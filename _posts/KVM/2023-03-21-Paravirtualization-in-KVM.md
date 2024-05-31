---
categories: KVM
title: Paravirtualization in KVM
---

### expose_kvm

How to use it: `-cpu host,kvm=on`

```c
// target/i386/cpu.c
static Property x86_cpu_properties[] = {
	//...
    DEFINE_PROP_BOOL("kvm", X86CPU, expose_kvm, true),
	//...
};

// target/i386/kvm/kvm.c
int kvm_arch_init_vcpu(CPUState *cs)
{
	//...
    if (cpu->expose_kvm) {
        memcpy(signature, "KVMKVMKVM\0\0\0", 12);
        c = &cpuid_data.entries[cpuid_i++];
        c->function = KVM_CPUID_SIGNATURE | kvm_base;
        c->eax = KVM_CPUID_FEATURES | kvm_base;
        c->ebx = signature[0];
        c->ecx = signature[1];
        c->edx = signature[2];

        c = &cpuid_data.entries[cpuid_i++];
        c->function = KVM_CPUID_FEATURES | kvm_base;
        c->eax = env->features[FEAT_KVM]; // use the KVM para features user want
        c->edx = env->features[FEAT_KVM_HINTS];
    }
	//...
    r = kvm_vcpu_ioctl(cs, KVM_SET_CPUID2, &cpuid_data);
	//...
}
```

When we set it in the command line, you can see above code that we will expose the KVM paravirtualization features to the guest, that's the meaning of "expose_kvm": expose so let guest know it is running as a KVM.

**Why use this way to expose to guest, rather than KVM_GET_SUPPORTED_CPUID?**

`kvm_arch_init_vcpu` is executed `after` CPUID filter, so actually we have executed `KVM_GET_SUPPORTED_CPUID` to drop the CPUID KVM doesn't support. Then pass the filtered CPUID to KVM to set the CPUID: `c->eax = env->features[FEAT_KVM];`.

### KVM specific/custom MSR (Paravirtualization)

KVM makes use of some custom MSRs to service some requests.

Custom MSRs have a range reserved for them, that goes from `0x4b564d00` to `0x4b564dff`. There are MSRs outside this area, but they are deprecated and their use is discouraged.

For example, for MSR `MSR_KVM_POLL_CONTROL`, guest kernel can enable it:

```c
// arch/x86/kernel/kvm.c
void arch_haltpoll_enable(unsigned int cpu)
{
    //...
	/* Enable guest halt poll disables host halt poll */
    // wrmsrl(MSR_KVM_POLL_CONTROL, 0);
	smp_call_function_single(cpu, kvm_disable_host_haltpoll, NULL, 1);
}

EXPORT_SYMBOL_GPL(arch_haltpoll_enable);
```

[KVM-specific MSRs — The Linux Kernel documentation](https://www.kernel.org/doc/html/v5.9/virt/kvm/msr.html)

### How does guest kernel know it is running as a VM when the KVM is exposed?

Intel and AMD CPUs have reserved bit 31 of ECX of CPUID leaf 0x1 as the hypervisor present bit. This bit allows hypervisors to indicate their presence to the guest operating system.

[Mechanisms to determine if software is running in a VMware virtual machine (1009458)](https://kb.vmware.com/s/article/1009458)

```c
start_kernel
    setup_arch
        init_hypervisor_platform
            detect_hypervisor_vendor
                kvm_detect //(*p)->detect();
                    kvm_cpuid_base
                        __kvm_cpuid_base
                            boot_cpu_has(X86_FEATURE_HYPERVISOR)
```

### KVM_CPUID_SIGNATURE: `0x40000000`

This CPUID

- returns the signature `"KVMKVMKVM"` in `ebx`, `ecx`, and `edx`.
- returns the `KVM_CPUID_FEATURES` in `eax`.

It should be used to determine that a VM is running under KVM.

### KVM_CPUID_FEATURES: `0x40000001`

```c
/* This CPUID returns two feature bitmaps in eax, edx. Before enabling
 * a particular paravirtualization, the appropriate feature bit should
 * be checked in eax. The performance hint feature bit should be checked
 * in edx.
 */
#define KVM_CPUID_FEATURES	0x40000001

/* features bits in this CPUID */
#define KVM_FEATURE_CLOCKSOURCE		0
#define KVM_FEATURE_NOP_IO_DELAY	1
#define KVM_FEATURE_MMU_OP		2
#define KVM_FEATURE_CLOCKSOURCE2        3
#define KVM_FEATURE_ASYNC_PF		4
#define KVM_FEATURE_STEAL_TIME		5
#define KVM_FEATURE_PV_EOI		6
#define KVM_FEATURE_PV_UNHALT		7
#define KVM_FEATURE_PV_TLB_FLUSH	9
#define KVM_FEATURE_ASYNC_PF_VMEXIT	10
#define KVM_FEATURE_PV_SEND_IPI	11
#define KVM_FEATURE_POLL_CONTROL	12
#define KVM_FEATURE_PV_SCHED_YIELD	13
#define KVM_FEATURE_ASYNC_PF_INT	14
#define KVM_FEATURE_MSI_EXT_DEST_ID	15
#define KVM_FEATURE_HC_MAP_GPA_RANGE	16
#define KVM_FEATURE_MIGRATION_CONTROL	17
```

# KVM halt polling (KVM_FEATURE_POLL_CONTROL)

在实际业务中，guest 执行 HLT 指令是导致虚拟化 overhead 的一个重要原因。注意，HLT 只有在一定条件下才会 vm-exit。

KVM halt polling 是为了解决这一个问题被引入的，它在 Linux 4.3-rc1 被合入主干内核。当 guest 执行 HLT 指令时，会发生 vm-exit。host kernel 并不马上让出物理核给调度器，而是 poll 一段时间，若 guest 在这段时间内被唤醒，便可以马上调度回该 vcpu 线程继续运行。

### Host side poll / guest side poll

If guest poll is enabled, host poll should be disabled, and vice versa.

Guest side halt polling allows the guest vcpus to poll for a specified amount of time **before halting**. This provides the following benefits to host side polling:

- The POLL flag is set while polling is performed, which allows a remote vCPU to avoid sending an IPI (and the associated cost of handling the IPI) when performing a wakeup.
- The VM-exit cost can be avoided.

The downside is that polling is performed even with other runnable tasks in the host.

**Why enable guest poll disables host poll?**

Because no need to poll twice, see the following self-explained code in guest kernel:

```c
// drivers/cpuidle/cpuidle-haltpoll.c
static int haltpoll_cpu_online(unsigned int cpu)
{
	//...
	arch_haltpoll_enable(cpu);
	//...
}

// This function enables guest side halt poll (if it is running as a guest)
void arch_haltpoll_enable(unsigned int cpu)
{
	// this feature actually is for **host side polling**
	if (!kvm_para_has_feature(KVM_FEATURE_POLL_CONTROL)) {
		pr_err_once("host does not support poll control\n");
		pr_err_once("host upgrade recommended\n");
		return;
	}

	/* Enable guest halt poll disables host halt poll */
	smp_call_function_single(cpu, kvm_disable_host_haltpoll, NULL, 1);
}
EXPORT_SYMBOL_GPL(arch_haltpoll_enable);
```

## Host side poll

### How to enable host side poll

KVM should support `KVM_FEATURE_POLL_CONTROL` paravirtualization feature.

`MSR_KVM_POLL_CONTROL` should be set to 1 to enable host (KVM) side halt polling.

### Main process

```c
static int (*kvm_vmx_exit_handlers[])(struct kvm_vcpu *vcpu) = {
	//...
	[EXIT_REASON_HLT]                     = kvm_emulate_halt,
	//...
}

// vcpu_run -> vcpu_block
void kvm_vcpu_halt(struct kvm_vcpu *vcpu)
{
	//...
	if (do_halt_poll) {
		ktime_t stop = ktime_add_ns(start, vcpu->halt_poll_ns);

		do {
			/*
			 * This sets KVM_REQ_UNHALT if an interrupt
			 * arrives.
			 */
			if (kvm_vcpu_check_block(vcpu) < 0)
				goto out;
			cpu_relax();
			poll_end = cur = ktime_get();
		} while (kvm_vcpu_can_poll(cur, stop));
	}
	//...
}
```

[KVM halt-polling机制分析 - tianshidan1998 - 博客园](https://www.cnblogs.com/zyfd/p/10114752.html)
