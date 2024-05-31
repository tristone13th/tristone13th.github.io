---
categories: Features
title: Split Lock & Bus Lock
---

# Split lock / \#AC

不要把 split lock 和因为 split lock 产生的 \#AC 混为一谈。同时 AC

- 不只是 split lock 可能会产生。Split lock 是 CPU 为了支持 **跨 cache line 进行原子内存访问** 而产生的一种 **bus lock**。
- 传统的 Alignment check 也可能会产生。不同的 data type 可能会有不同的对于 alignment 的 requirement。An example of an Alignment-check violation is a **word** stored at an odd byte address, or a **doubleword** stored at an address that is not an integer multiple of 4。开启 Alignment check 需要保证 AC flag in the EFLAGS register is set。Alignment-check exceptions (#AC) are generated only when operating at privilege level 3 (user mode). 对于这种引发的 AC 处理很简单，就是不 warn，并且发送 SIGBUS 给对应进程。

所以感觉可以理解为，传统 Alignment check 粒度比较小，因为数据类型都是（2-16）bytes，而 split lock 的粒度大，是 64 bytes。

`MSR_TEST_CTRL` (0x33) bit `MSR_TEST_CTRL_SPLIT_LOCK_DETECT` (29) controls enabling and disabling \#AC for **Split-locked Access**.

Sets the AC flag bit in EFLAGS register. This may enable alignment checking of user-mode data accesses (the legacy alignment checking).

**Split lock detection 目前还没有被虚拟化。** Patchset 其实已经发了（Xiaoyao），但是社区没人感兴趣。所以看 code 感觉 guest 里 handle AC 的方式类似于 `sld_warn`，所谓不支持虚拟化指的就是还不支持 guest 设置其他的值，比如 `sld_fatal` 等等。

**non-root 模式下发生 split lock \#AC 会出现 VM-exit。**

一个产生 split lock 的指令会独占内存总线大约 1000 个时钟周期，对比正常情况下的 ADD 指令约只需要小于 10 个时钟周期。

Split lock can be detected by \#AC (SDM 6.15 Interrupt 17—Alignment Check Exception (#AC)) trap, the trap is triggered before the instruction acquires bus lock. This makes it difficult to mitigate bus lock (e.g. throttle the user application).

Common cache line sizes are 32, 64 and 128 bytes.

The CPU core is no longer directly connected to the main memory. {In even earlier systems the cache was attached to the system bus just like the CPU and the main memory. This was more a hack than a real solution.} All loads and stores have to go through the cache.

[Memory part 2: CPU caches [LWN.net]](https://lwn.net/Articles/252125/)

### `X86_FEATURE_SPLIT_LOCK_DETECT`

If bit 5 is set in `MSR_IA32_CORE_CAPS`, which means: `SPLIT_LOCK_DISABLE_SUPPORTED`. When read as 1, software can set bit 29 of `MSR_MEMORY_CTRL` (MSR address 33H) to enable split lock detection.

So if bit 5 is set, the feature `X86_FEATURE_SPLIT_LOCK_DETECT` will be enabled.

### `exc_alignment_check` / `handle_user_split_lock()` Kernel

AC 是一种异常，而不是中断，它是同步的。在指令当时就发生。

当发生 \#AC 时，会调用到这里。不管这个 AC 是因为 split lock 产生的还是因为 legacy alignment check 产生的。

```c
DEFINE_IDTENTRY_ERRORCODE(exc_alignment_check)
{
	char *str = "alignment check";

    // notify 一下注册进来的 notifiers
	if (notify_die(DIE_TRAP, str, regs, error_code, X86_TRAP_AC, SIGBUS) == NOTIFY_STOP)
		return;

    // 如果是 kernel code 触发的 #AC，说明 kernel 有 bug，所以需要把 kernel crash 掉
    // search: #AC: crashing the kernel on kernel split_locks and warning on user-space split_locks
	if (!user_mode(regs))
		die("Split lock detected\n", regs, error_code);

    //...
    // 如果在这里面 warn 过了，那么就不需要 do_trap 了
    // 如果因为置上了 X86_EFLAGS_AC 没有 warn（我们需要对 user-mode data accesses 进行处理），
    // 那么我们还需要进一步处理，给 Userspace 程序发信号。
	if (handle_user_split_lock(regs, error_code))
        return;

    // 给 Userspace 程序发送 SIGBUS
	do_trap(X86_TRAP_AC, SIGBUS, "alignment check", regs, error_code, BUS_ADRALN, NULL);
    //...
}

bool handle_user_split_lock(struct pt_regs *regs, long error_code)
{
    // 如果是 legacy alignment check 引发的 AC，不需要 warn。
    // 如果是 sld_fatal 也不需要 warn。
	if ((regs->flags & X86_EFLAGS_AC) || sld_state == sld_fatal)
		return false;
	split_lock_warn(regs->ip);
	return true;
}
```

### `X86_EFLAGS_AC`

**Alignment checking of user-mode data accesses** is enabled if and only if this flag is 1.

在 split lock detection 之前就有了，是 AC 表示 legacy alignment checking 的情况。

### Split lock handling in guest / `vmx_guest_inject_ac()` / `handle_guest_split_lock()` QEMU

当 Guest 里的 userspace 程序触发了 split lock 时，不一定会产生 AC，只有当 host `sld_state!=off` 的时候才会产生 AC：

```c
init_intel
    split_lock_init
        split_lock_verify_msr(sld_state != sld_off);
```

当 AC 发生时，**会发生 VM-exit**。同理，guest 产生 AC 也有两个可能情况：

- Guest 产生了 legacy alignment check
- Guest 产生了 split lock

```c
handle_exception_nmi
    case AC_VECTOR:
        // 如果需要 inject 回 guest，那就 inject
        if (vmx_guest_inject_ac(vcpu)) {
			kvm_queue_exception_e(vcpu, AC_VECTOR, error_code);
			return 1;
		}

        //...
        // handle guest 因为 split lock 而产生的 AC
		if (handle_guest_split_lock(kvm_rip_read(vcpu)))
			return 1;


bool vmx_guest_inject_ac(struct kvm_vcpu *vcpu)
{
    // 如果我们压根都没有这个 feature，那这个只能是 legacy alignment check
    // 产生的 AC，所以我们需要 inject 给 guest，这也是 split lock detection 被引入之前的处理方式
	if (!boot_cpu_has(X86_FEATURE_SPLIT_LOCK_DETECT))
		return true;

    // 如果 host 有这个 feature，那么我们仍然需要判断这个是不是 legacy alignment check 产生的
    // 如果是的话才会 inject，不是的话说明是 split lock 产生的 AC，不应该 inject 给 guest
    // 而三个条件就是用来判断 guest 的 vcpu 有没有打开 legacy alignment check 的
	return vmx_get_cpl(vcpu) == 3 && kvm_is_cr0_bit_set(vcpu, X86_CR0_AM) &&
	       (kvm_get_rflags(vcpu) & X86_EFLAGS_AC);
}

// 顾名思义，handle guest 产生的 AC
bool handle_guest_split_lock(unsigned long ip)
{
    // 如果 host 的 sld_state 是 warn，那就只 warn
	if (sld_state == sld_warn) {
		split_lock_warn(ip);
		return true;
	}

	pr_warn_once("#AC: %s/%d %s split_lock trap at address: 0x%lx\n",
		     current->comm, current->pid,
		     sld_state == sld_fatal ? "fatal" : "bogus", ip);

	current->thread.error_code = 0;
	current->thread.trap_nr = X86_TRAP_AC;
    // 给 vcpu 线程发 SIGBUS，可能导致 vcpu 线程被 kill 掉
	force_sig_fault(SIGBUS, BUS_ADRALN, NULL);
	return false;
}
```

但是实验发现 legacy Guest 里跑会产生 split lock 的程序时，只会报 \#DB warning，而不是 \#AC warning 出来，并且实验发现 KVM 在 `handle_exception_nmi()` 函数里给 guest inject 的是 DB 而不是 AC。也就是说，exit reason 是 `DB_VECTOR` 而不是 `AC_VECTOR`。**这是为什么呢？**

一个可能的原因是，因为 Host 并没有暴露 `X86_FEATURE_SPLIT_LOCK_DETECT` 这个 bit 给 Guest，也就是说 Guest 的 `IA32_CORE_CAPALITIES` MSR 的 bit 5 是 0，同时 guest 的 `MSR_TEST_CTRL` 没有 enable split lock detection 这个 feature，所以自然而然的，guest 在跑的过程中的 MSR 是 guest 的 context 而非 host 的，因此发生 split lock 时应该出现的是 DB 而不是 AC。

但是在 TD 里，**因为 TD 里触发 split lock 的时候并不会 exit 出来**，所以是到了 TD Guest kernel 的\#AC handler 里。也就是 KVM 并没有注入了 AC，而是直接 handle 的。

# Bus Lock Detection

There is an architecture-defined interrupt named \#DB (Vector 1) for detecting bus lock.

CPUID.(EAX=7, ECX=0).ECX[24] determine if the MSR can be set;

> Processors that allow IA32_DEBUGCTL bit 2 to be set enumerate this support using the CPUID.(EAX=7, ECX=0).ECX[24] bit.

IA32_DEBUGCTL.BUS_LOCK_DETECT (bit 2) can determine if can enable debug exception traps.

不要把这个和 Split lock detection 搞混。两个都是通过 CPUID 来 enumerate 的。

```c
#define X86_FEATURE_SPLIT_LOCK_DETECT	(11*32+ 6) /* #AC for split lock */
#define X86_FEATURE_BUS_LOCK_DETECT	(16*32+24) /* Bus Lock detect */
```

对于 \#DB 的 handle 是这样的：

```c
DEFINE_IDTENTRY_DEBUG_USER(exc_debug)
    exc_debug_user
        handle_bus_lock
        	switch (sld_state) {
            	case sld_off:
            		break;
            	case sld_ratelimit:
            		/* Enforce no more than bld_ratelimit bus locks/sec. */
            		while (!__ratelimit(&bld_ratelimit))
            			msleep(20);
            		/* Warn on the bus lock. */
            		fallthrough;
            	case sld_warn:
            		pr_warn_ratelimited("#DB: %s/%d took a bus_lock trap at address: 0x%lx\n",
            				    current->comm, current->pid, regs->ip);
            		break;
            	case sld_fatal:
            		force_sig_fault(SIGBUS, BUS_ADRALN, NULL);
            		break;
            	}
```

当程序试图造一个 split lock 时，AC 会不会产生其实还是要看 kernel 有没有 configure 对应的 MSR，当 sld=off 时就不会去 configure MSR，所以 AC 也就不会产生了。

两个都用了 sld state（off, warn, fatal, ratelimit），但是 split lock detection 会覆盖 bus lock detection：

```c
sld_state_show()
//...
switch (sld_state) {
	case sld_off:
		pr_info("disabled\n");
		break;
	case sld_warn:
		if (boot_cpu_has(X86_FEATURE_SPLIT_LOCK_DETECT)) {
			pr_info("#AC: crashing the kernel on kernel split_locks and warning on user-space split_locks\n");
			if (cpuhp_setup_state(CPUHP_AP_ONLINE_DYN,
					      "x86/splitlock", NULL, splitlock_cpu_offline) < 0)
				pr_warn("No splitlock CPU offline handler\n");
		} else if (boot_cpu_has(X86_FEATURE_BUS_LOCK_DETECT)) {
			pr_info("#DB: warning on user-space bus_locks\n");
		}
		break;
	case sld_fatal:
		if (boot_cpu_has(X86_FEATURE_SPLIT_LOCK_DETECT)) {
			pr_info("#AC: crashing the kernel on kernel split_locks and sending SIGBUS on user-space split_locks\n");
		} else if (boot_cpu_has(X86_FEATURE_BUS_LOCK_DETECT)) {
			pr_info("#DB: sending SIGBUS on user-space bus_locks%s\n",
				boot_cpu_has(X86_FEATURE_SPLIT_LOCK_DETECT) ?
				" from non-WB" : "");
		}
		break;
	case sld_ratelimit:
		if (boot_cpu_has(X86_FEATURE_BUS_LOCK_DETECT))
			pr_info("#DB: setting system wide bus lock rate limit to %u/sec\n", bld_ratelimit.burst);
		break;
	}
```

我的理解是因为 Split lock 在 TD 里还没有虚拟化好，所以无论 guest 的 SLD state 是 off 还是 warn 还是什么，它都不会去 configure MSR。但是当 host 的 SLD state 不是 off 时，它会 configure MSR 来 enable hardware 的 AC，又因为 guest 在跑程序触发 AC 时并不会 VMExit，所以这相当于 host configure 的 MSR 影响到了 guest，即使 guest 的 SLD=off 其仍然能收到 AC。

### KVM Bus Lock Debug Exception

Bus lock debug exception is a **sub-feature** of bus lock detection.

It is an ability to notify the kernel by an \#DB trap after the instruction acquires a bus lock when CPL>0. This allows the kernel to enforce user application throttling or mitigations.

### Bus Lock VM Exit

Bus lock VM exit is a **sub-feature** of bus lock detection.

For VMM, **it can detect every bus lock acquired by guest and induces a VM exit.** So VMM can count the number/frequency of bus lock and take some throttling action or just kill the guest.

This feature is specific designed for virtualization scenario. Because we cannot use Bus Lock \#DB capture all the Bus Lock. For example, in VM, If an instruction acquired a bus lock and then subsequently faulted then there is no bus lock debug exception trap pending at the instruction boundary on which the fault is delivered. In this case, bus lock VM exit makes sense.

### Notify VM Exit