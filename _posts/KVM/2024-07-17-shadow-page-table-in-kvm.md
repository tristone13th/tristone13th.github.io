---
categories: KVM
title: Shadow Page Table in KVM
---

**在影子页表提出之前**，一般的思路是，GVA 经过客户端的页表转化为 GPA，然后把 GPA 经过转换，变为 HVA，kvm 中有一个数据结构 `kvm_memory_slot` 记录了此映射关系，再经过 host 上页表的转换变为 HPA。然而这样的转换路径也太长，影响了性能，**KVM 有了硬件的支持以后提出了影子页表的概念**。但是对于内存的虚拟化就更麻烦了。

影子页表简单来说就是，可以直接把 GVA 映射成 HPA。Guest 想把客户端的页表基地址写入 CR3 寄存器的时候，当 VMCS 里 CR3-load exiting/CR3-store exiting 打开的情况下，会陷入到 VMM，VMM 会首先截获到此指令。在客户端写 CR3 的时候，VMM 首先保存好要写入的值，然后填入的是主机端针对 Guest 生成的影子页表的基地址，当客户端读 CR3 值的时候，VMM 会把之前保存的 CR3 的值返回给客户端。

影子页表也有缺陷，**KVM 需要对 Guest 的每一个进程维护一张表**（毕竟直接从 HVA 开始映射）

Guest 有两种方式陷入到 VMM 触发 VMM 对于影子页表的更新：

- Guest 写 CR3 或者读 CR3
- Guest 写它自己的页表，kvm 对 Guest 的页表所在的页执行了 write-protection，这样写的话就会 intercept。

### Memory access in non-root mode when EPT is not used

non-root mode 下访问内存和 root-mode 下访问内存的区别（在不开启 EPT 的情况下）。

都是根据 CR3 指向的页表进行地址的翻译，并不会说在 non-root mode 的时候，就不能翻译怎么样的。

### Is SPT's tree structure identical to guest's page table's?

结构应该是一样的，只不过 leaf PTE 的值是不一样的，毕竟一个映射到了 GPA，另一个映射到的是 HPA。但是因为不管是 guest PT 还是影子页表，其实映射的键都是 HVA，也就是进程里的虚拟地址，所以感觉如果是 sync 的情况下，结构应该是相似的。

### When guest modify its page table, how does VMM intercept this?

1. Mark the guest table pages as read-only (in the shadow page table)
2. If guest OS tries to modify its page tables, it triggers page fault
3. VMM handles the page fault by updating shadow page table

[Virtualize-Memory](https://cseweb.ucsd.edu/~yiying/cse291j-winter20/reading/Virtualize-Memory.pdf)

当 Guest 在构建其页表的过程中，肯定会从第一级页表开始构建，设置第一级页表的某一个 entry 指向第二级页表，对第一级页表的写被 intercept，VMM 从而知道了第二级页表的地址，进而将第二级页表 mark 为只读来 intercept，就这样一直下去…那么问题来了，当 VMM intercept 到时，它只知道了 page fault，怎么知道写的内容呢？VMM 知道发生 Exit 时 Guest 的 RIP，那么可以推断出来指令，从而通过指令可以分析区域要写的内容？我认为这是一种方式。

```c
kvm_init_mmu
    if (tdp_enabled)
		init_kvm_tdp_mmu(vcpu, cpu_role);
	else
        // 影子页表的方式
		init_kvm_softmmu(vcpu, cpu_role);

```

### `init_kvm_softmmu()` KVM

```c
static void init_kvm_softmmu(struct kvm_vcpu *vcpu,
			     union kvm_cpu_role cpu_role)
{
	struct kvm_mmu *context = &vcpu->arch.root_mmu;

	kvm_init_shadow_mmu(vcpu, cpu_role);

	context->get_guest_pgd     = get_guest_cr3;
	context->get_pdptr         = kvm_pdptr_read;
	context->inject_page_fault = kvm_inject_page_fault;
}
```

### `kvm_init_shadow_mmu()` KVM

```c
static void kvm_init_shadow_mmu(struct kvm_vcpu *vcpu, union kvm_cpu_role cpu_role)
{
	struct kvm_mmu *context = &vcpu->arch.root_mmu;
	union kvm_mmu_page_role root_role;

	root_role = cpu_role.base;

	/* KVM uses PAE paging whenever the guest isn't using 64-bit paging. */
	root_role.level = max_t(u32, root_role.level, PT32E_ROOT_LEVEL);

	/*
	 * KVM forces EFER.NX=1 when TDP is disabled, reflect it in the MMU role.
	 * KVM uses NX when TDP is disabled to handle a variety of scenarios,
	 * notably for huge SPTEs if iTLB multi-hit mitigation is enabled and
	 * to generate correct permissions for CR0.WP=0/CR4.SMEP=1/EFER.NX=0.
	 * The iTLB multi-hit workaround can be toggled at any time, so assume
	 * NX can be used by any non-nested shadow MMU to avoid having to reset
	 * MMU contexts.
	 */
	root_role.efer_nx = true;

	shadow_mmu_init_context(vcpu, context, cpu_role, root_role);
}
```

### `shadow_mmu_init_context()` KVM

```c
static void shadow_mmu_init_context(struct kvm_vcpu *vcpu, struct kvm_mmu *context,
				    union kvm_cpu_role cpu_role,
				    union kvm_mmu_page_role root_role)
{
	if (cpu_role.as_u64 == context->cpu_role.as_u64 && root_role.word == context->root_role.word)
		return;

	context->cpu_role.as_u64 = cpu_role.as_u64;
	context->root_role.word = root_role.word;

	if (!is_cr0_pg(context))
		nonpaging_init_context(context);
	else if (is_cr4_pae(context))
		paging64_init_context(context);
	else
		paging32_init_context(context);

	reset_guest_paging_metadata(vcpu, context);
	reset_shadow_zero_bits_mask(vcpu, context);
}
```

## Page fault when using shadow PT and EPT is not enabled

The exit reason will be `EXIT_REASON_EXCEPTION_NMI`.

```c
handle_exception_nmi
    // 当发现这是一个 page fault 的时候
    kvm_handle_page_fault
        kvm_mmu_page_fault
    
static int handle_exception_nmi(struct kvm_vcpu *vcpu)
{
    //...
	if (is_page_fault(intr_info)) {
        // cr2 is containing the value called Page Fault Linear Address (PFLA).
        // When a page fault occurs, the address the program attempted to access is stored in the CR2 register.
		cr2 = vmx_get_exit_qual(vcpu);
        // We are using the EPT, EPT will cause page fault only if we need to
        // detect illegal GPAs.
		if (enable_ept && !vcpu->arch.apf.host_apf_flags) {
            // ...
			kvm_fixup_and_inject_pf_error(vcpu, cr2, error_code);
			return 1;
		} else
			return kvm_handle_page_fault(vcpu, error_code, cr2, NULL, 0);
	}
    //...
}
```

### `kvm_handle_page_fault()` KVM

Handle page fault occurs in guest (note, not EPT violation, so this is only working when EPT is not enabled).

```c
int kvm_handle_page_fault(struct kvm_vcpu *vcpu, u64 error_code,
				u64 fault_address, char *insn, int insn_len)
{
	int r = 1;
	u32 flags = vcpu->arch.apf.host_apf_flags;

    //...
	vcpu->arch.l1tf_flush_l1d = true;
	if (!flags) {
        //...
		if (kvm_event_needs_reinjection(vcpu))
			kvm_mmu_unprotect_page_virt(vcpu, fault_address);
		r = kvm_mmu_page_fault(vcpu, fault_address, error_code, insn, insn_len);
	} else if (flags & KVM_PV_REASON_PAGE_NOT_PRESENT) {
		vcpu->arch.apf.host_apf_flags = 0;
		local_irq_disable();
		kvm_async_pf_task_wait_schedule(fault_address);
		local_irq_enable();
	} else {
		WARN_ONCE(1, "Unexpected host async PF flags: %x\n", flags);
	}

	return r;
}
```
