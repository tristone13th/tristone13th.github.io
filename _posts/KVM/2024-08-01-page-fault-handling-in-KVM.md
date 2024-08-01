---
categories: KVM
title: Page Fault Handling in KVM
---

CR2 会保存最后一次出现 page fault 的 VA.

```c
// EXIT_REASON_EXCEPTION_NMI
// 当没有使用 EPT 的时候会是这条路径。
// 当用了 EPT 的情况是 EPT Violation
handle_exception_nmi
    kvm_handle_page_fault // 这个函数只处理非 ept 的情况
        kvm_mmu_page_fault
        //...

// EXIT_REASON_EPT_VIOLATION
handle_ept_violation
    __vmx_handle_ept_violation
        kvm_mmu_page_fault
        //...

// EXIT_REASON_EPT_MISCONFIG
handle_ept_misconfig
    kvm_mmu_page_fault
    //...

// 可以看到，上面三个 path 都调用到了 kvm_mmu_page_fault
// 可见此函数非常重要
kvm_mmu_page_fault
    kvm_mmu_do_page_fault // 在这个函数里做了 TDP 和普通的区分
        // TDP 的情况
        kvm_tdp_page_fault
            kvm_tdp_mmu_page_fault
                kvm_faultin_pfn 
            // 为什么 TDP 还会调用这个函数？
            // 当 kvm_intel module 想 enable EPT 时（sudo modprobe kvm_intel ept=1）
            // 但 kvm module 不想 enabled TDP (sudo modprobe kvm tdp_mmu=0)
            // 会走这条路径。这可能表示尽管 kvm_intel 打开了 EPT，但是 kvm 还是不想走 TDP 的情况
            direct_page_fault
                kvm_tdp_mmu_map
        // 没有 EPT 的的情况
        paging64_page_fault // vcpu->arch.mmu->page_fault(vcpu, &fault);

```

### `EPT_VIOLATION_ACC_READ` / `EPT_VIOLATION_ACC_WRITE` / `EPT_VIOLATION_ACC_INSTR` KVM

都是 exit qualification 的 bits，都是在发生 page fault 的时候通过**判断 PFERR** 置上的。表示引起 EPT violation 的访问是一个读，写还是指令 fetch。置上的 path：

```c
kvm_mmu_do_page_fault
    vcpu->arch.mmu->page_fault
        context->page_fault = nonpaging_page_fault;
            FNAME(page_fault)
                // paging32_gva_to_gpa / paging64_gva_to_gpa / paging64_gva_to_gpa / nonpaging_gva_to_gpa
                // 这些 FNAME 都是 kvm_mmu 下面挂的钩子。gva_to_gpa 看起来和 guest 关系不大，
                // 不是 guest 引起的 page fault，所以先忽略。
                FNAME(walk_addr) / FNAME(gva_to_gpa)
                    walk_addr_generic
                        if (write_fault)
                            vcpu->arch.exit_qualification |= EPT_VIOLATION_ACC_WRITE;
                        if (user_fault)
                            vcpu->arch.exit_qualification |= EPT_VIOLATION_ACC_READ;
                        if (fetch_fault)
                            vcpu->arch.exit_qualification |= EPT_VIOLATION_ACC_INSTR;
```

### `tdp_mmu_map_handle_target_level()` KVM

```c
/*
 * Installs a last-level SPTE to handle a TDP page fault.
 * (NPT/EPT violation/misconfiguration)
 */
static int tdp_mmu_map_handle_target_level(struct kvm_vcpu *vcpu,
					  struct kvm_page_fault *fault,
					  struct tdp_iter *iter)
{
	struct kvm_mmu_page *sp = sptep_to_sp(rcu_dereference(iter->sptep));
	u64 new_spte;
	int ret = RET_PF_FIXED;
	bool wrprot = false;

	if (WARN_ON_ONCE(sp->role.level != fault->goal_level))
		return RET_PF_RETRY;

	if (unlikely(!fault->slot))
		new_spte = make_mmio_spte(vcpu, iter->gfn, ACC_ALL);
	else
		wrprot = make_spte(vcpu, sp, fault->slot, ACC_ALL, iter->gfn,
					 fault->pfn, iter->old_spte, fault->prefetch, true,
					 fault->map_writable, &new_spte);

	if (new_spte == iter->old_spte)
		ret = RET_PF_SPURIOUS;
	else if (tdp_mmu_set_spte_atomic(vcpu->kvm, iter, new_spte))
		return RET_PF_RETRY;
	else if (is_shadow_present_pte(iter->old_spte) &&
		 !is_last_spte(iter->old_spte, iter->level))
		kvm_flush_remote_tlbs_gfn(vcpu->kvm, iter->gfn, iter->level);

	/*
	 * If the page fault was caused by a write but the page is write
	 * protected, emulation is needed. If the emulation was skipped,
	 * the vCPU would have the same fault again.
	 */
	if (wrprot) {
		if (fault->write)
			ret = RET_PF_EMULATE;
	}

    // MMIO handling...
    //...
	return ret;
}

```

### When EPT is enabled, will a \#PF still occur rather than a EPT violation?

### `kvm_mmu_map_tdp_page()` KVM

在 EPT 里映射一个 tdp page，传入一个 GPA，返回映射后的 PFN。

```c
kvm_pfn_t kvm_mmu_map_tdp_page(struct kvm_vcpu *vcpu, gpa_t gpa, u32 error_code, int max_level, bool nonleaf)
{
	int r;
	struct kvm_page_fault fault = (struct kvm_page_fault) {
		.addr = gpa,
		.error_code = error_code,
		.exec = error_code & PFERR_FETCH_MASK,
		.write = error_code & PFERR_WRITE_MASK,
		.present = error_code & PFERR_PRESENT_MASK,
		.rsvd = error_code & PFERR_RSVD_MASK,
		.user = error_code & PFERR_USER_MASK,
		.prefetch = false,
		.is_tdp = true,
		.nx_huge_page_workaround_enabled = is_nx_huge_page_enabled(vcpu->kvm),
		.is_private = kvm_is_private_gpa(vcpu->kvm, gpa),
		.nonleaf = nonleaf,
	};

	WARN_ON_ONCE(!vcpu->arch.mmu->root_role.direct);
	fault.gfn = gpa_to_gfn(fault.addr) & ~kvm_gfn_shared_mask(vcpu->kvm);
	fault.slot = kvm_vcpu_gfn_to_memslot(vcpu, fault.gfn);

	if (mmu_topup_memory_caches(vcpu, false))
		return KVM_PFN_ERR_FAULT;

    //...
    fault.max_level = max_level;
    fault.req_level = PG_LEVEL_4K;
    fault.goal_level = PG_LEVEL_4K;
    
    r = direct_page_fault(vcpu, &fault);
	return fault.pfn;
}
```

### `tdp_enabled` / `tdp_mmu_enabled` / `tdp_mmu_allowed` / KVM

目前结构是这样的：

```c
TDP MMU // 这是一个很宏大的概念，表示两级页表，直接用 GPA 来 map
    // 这种实现是 Google 后来提出的，用了更小粒度的锁，在多个 vCPU 大内存的情况下性能比后者更好。
    // 原先的方案 Direct Page Fault 使用的是一个大锁。
    Google TDP MMU implementation 
    Direct Page Fault implementation // 目前 32 位还在用，可能会逐渐废弃。
Shadow MMU
```

| tdp_mmu_enabled | enable_ept | 说明                          |
| --------------- | ---------- | ----------------------------- |
| 1               | 0          | 应该会报错，不支持            |
| 1               | 1          | 使用 TDP -> Google TDP MMU    |
| 0               | 0          | Shadow MMU                    |
| 0               | 1          | 使用 TDP -> Direct Page Fault |

（`tdp_mmu_allowed`）这是在 Kernel module `kvm` initialize 的时候，还没有到 `kvm_intel` initialize 的时候。

```c
bool __read_mostly tdp_mmu_enabled = true;
// sudo modprobe kvm tdp_mmu=1 // or 0
module_param_named(tdp_mmu, tdp_mmu_enabled, bool, 0444);

kvm_x86_init
    kvm_mmu_x86_module_init
void __init kvm_mmu_x86_module_init(void)
{
    //...
    // tdp_mmu_enabled 是用户在 init KVM module 的时候传进来的 parameter
    // tdp_mmu_allowed 相当于是 snapshot 了一下 tdp_mmu_enabled
	tdp_mmu_allowed = tdp_mmu_enabled;
    //...
}
```

（`tdp_enabled`, `tdp_mmu_enabled`）这是在 `kvm_intel` initialize 的时候。

```c
bool __read_mostly enable_ept = 1;
module_param_named(ept, enable_ept, bool, S_IRUGO);
// sudo modprobe kvm_intel ept=1 // or 0

module_init(vmx_init);
    kvm_x86_vendor_init
        __kvm_x86_vendor_init
            hardware_setup
            	if (!cpu_has_vmx_ept() ||
            	    !cpu_has_vmx_ept_4levels() ||
            	    !cpu_has_vmx_ept_mt_wb() ||
            	    !cpu_has_vmx_invept_global())
            		enable_ept = 0;

// enable_tdp 其实就是 enable_ept
void kvm_configure_mmu(bool enable_tdp, int tdp_forced_root_level, int tdp_max_root_level, int tdp_huge_page_level)
{
	tdp_enabled = enable_tdp;
    //...
    // 如果 kvm module 和 kvm_intel module 同时要求打开 tdp，那么就打开
    // 复用了 tmp_mmu_enabled 的变量
	tdp_mmu_enabled = tdp_mmu_allowed && tdp_enabled;
    //...
}
```

### `kvm_handle_page_fault()` KVM

这个函数是处理非 EPT 的情况的 page fault 的。`fault_address` 是 CR2，也就是发生 page fault 的 VA。

```c
// fault_address 表示的是 CR2 (也就是 GVA，注意不是 GPA)
int kvm_handle_page_fault(struct kvm_vcpu *vcpu, u64 error_code, u64 fault_address, char *insn, int insn_len)
{
	int r = 1;
    // KVM_PV_REASON_PAGE_NOT_PRESENT：表示
    // KVM_PV_REASON_PAGE_READY：
	u32 flags = vcpu->arch.apf.host_apf_flags;

    // sanity checks...
	vcpu->arch.l1tf_flush_l1d = true;
    // 说明和 APF 是没有关系的，就是普通的 page fault
	if (!flags) {
        //...
		if (kvm_event_needs_reinjection(vcpu))
			kvm_mmu_unprotect_page_virt(vcpu, fault_address);
		r = kvm_mmu_page_fault(vcpu, fault_address, error_code, insn, insn_len);
    // APF page fault ahndling...
	} else if (flags & KVM_PV_REASON_PAGE_NOT_PRESENT) {
		vcpu->arch.apf.host_apf_flags = 0;
		local_irq_disable();
		kvm_async_pf_task_wait_schedule(fault_address);
		local_irq_enable();
    }
    //...
}
```

### `FNAME(walk_addr)` / `FNAME(walk_addr_generic)` / KVM

walk 一下 guest 自己的页表，找到映射 GVA 的那一个 PTE。

```c
// Fetch a guest pte for a GVA, or for an L2's GPA.
static int FNAME(walk_addr)(struct guest_walker *walker, struct kvm_vcpu *vcpu, gpa_t addr, u64 access)
{
	return FNAME(walk_addr_generic)(walker, vcpu, vcpu->arch.mmu, addr, access);
}
```

### Why `handle_exception_nmi` can handle page fault?

NMI 和 \#PF 并不是并列的关系，相反，NMI 和 External interrupt, Hardware exception, Software exception 是并列的，它们都各自表示一类中断或异常。page fault 属于 NMI 这一类的，所以在这个里面进行处理。

### `struct kvm_page_fault` KVM

```c
struct kvm_page_fault {
    // 就是 fault 的 GPA 或者是 cr2
    // 当普通情况时（handle nmi），cr2_or_gpa 是 cr2，也就是 GVA
    // 当是 EPT 时（handle ept violation），cr2_or_gpa 是 gpa，也就是 GPA。
	const gpa_t addr;
    // gpa_to_gfn(fault->addr)
	gfn_t gfn;
    // which memslot this gfn is in
	struct kvm_memory_slot *slot;
    // 当造成 fault 的 access 是读时，是否 map 成了一个可写的 host page
    // 在这个引入之前，统一都映射成为可写的 host page，引入这个主要是为了支持 readonly memslot
    // 我们看到，在 make spte 的时候，如果 map_writable 为 true，那么会
    // spte |= shadow_host_writable_mask, 这个 mask 用了 reserved 的 bit。
    // 表示是否是 host-writable^ 的。
	bool map_writable;
    // 没开 huge page 的时候，一般就是 PG_LEVEL_4K 
	u8 goal_level;
	// Maximum page size that can be created for this fault; input to
	// FNAME(fetch), direct_map() and kvm_tdp_mmu_map().
    // 一般被初始化成了 .max_level = vcpu->kvm->arch.tdp_max_page_level,
    //
	u8 max_level;

 	/* Derived from error_code.*/
    // 造成 fault 的访问是一个 exec 吗？
	const bool exec;
    //...

	// valid only for private memslot && private gfn
	// TDX 会用到
	enum pg_level host_level;
    // NX huge page^ 默认把所有 huge page 看成不可执行的，如果要执行，那么就先 break 成 4k page。
    // 这个 field 就是表示是否启用了 NX huge page（is_nx_huge_page_enabled()）。
    // 是否启用又由两个因素决定：
    //  - 是否 sysfs 里启用了
    //  - 是否在启用 VM 时 enable 了这个 CAP：KVM_CAP_VM_DISABLE_NX_HUGE_PAGES
	const bool nx_huge_page_workaround_enabled;
	// Whether a >4KB mapping can be created or is forbidden due to NX hugepages.
    //   huge_page_disallowed = fault->exec && fault->nx_huge_page_workaround_enabled;
    // 可以看出，如果 fault 的 exec 置上了，表示造成 fault 的 access 是 exec, 同时我们
    // disable 了 NX huge page 这个 feature，那么，我们就不允许为大页创建 mapping。
	bool huge_page_disallowed;
	bool nonleaf;
};
```

### Page fault return values / enum

```c
enum {
    // So far, so good, keep handling the page fault.
	RET_PF_CONTINUE = 0,
    // let CPU fault again on the address.
	RET_PF_RETRY,
    // mmio page fault, 因为本身就没有 page，所以我们需要 emulate the instruction.
	RET_PF_EMULATE,
    // the spte is invalid, let the real page fault path update it.
	RET_PF_INVALID,
    // The faulting entry has been fixed (by us).
	RET_PF_FIXED,
    // The faulting entry was already fixed, e.g. by another vCPU.
	RET_PF_SPURIOUS,
};
```

### `kvm_faultin_pfn()` KVM

目的是为传进来的 `struct kvm_page_fault`^ 里的 `gfn` 计算 `pfn`, `hva`, `map_writable` 等属性。计算 pfn 有两种方式：

1. 直接 walk 页表（这里指的是软件模拟硬件的 walk）；
2. 通过我们 `kvm_memory_slot` 里的 gfn 到 hva 或者是到 (fd, offset) 的映射关系，来计算出 pfn 应该是什么：
    - 如果是 legacy VM，那么 `kvm_memory_slot` 里有 gfn 到 hva 的映射关系，hva 进一步可以映射到 pfn（没有映射的话就现申请一个 page）；
    - 如果是 TD，那么 `kvm_memory_slot` 里有 gfn 到 (fd, offset) 的映射关系，(fd, ffset) 可以进一步映射到 pfn（没有映射的话就现申请一个 page）

因为发生了 page fault，所以表示我们的页表里没有 gfn 到 pfn 的映射，这也意味着上述第一种方式是行不通的，我们需要通过这个函数拿到对应的 pfn，然后后面再 map 到页表里。

```c
static int kvm_faultin_pfn(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault,
			   unsigned int access)
{
	fault->mmu_seq = vcpu->kvm->mmu_invalidate_seq;
    //...

	ret = __kvm_faultin_pfn(vcpu, fault);
    //...
	return ret;
}

static int __kvm_faultin_pfn(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
	struct kvm_memory_slot *slot = fault->slot;
	bool async;

	// Retry the page fault if the gfn hit a memslot that is being deleted
	// or moved. This ensures any existing SPTEs for the old memslot will
	// be zapped before KVM inserts a new MMIO SPTE for the gfn.
    // 当我们正在 delete 或者 move 一个 memslot 的时候，PF 发生了，那么我们
    // 需要 retry 直到 memslot 的操作结束，再插入新的 MMIO SPTE
	if (slot && (slot->flags & KVM_MEMSLOT_INVALID))
		return RET_PF_RETRY;

    // For internal memslots, such as TSS, APIC_ACCESS_PAGE, IDENTITY_PAGETABLE...
    // ...
	async = false;
	fault->pfn = __gfn_to_pfn_memslot(slot, fault->gfn, false, false, &async, fault->write, &fault->map_writable, &fault->hva);
	if (!async)
		return RET_PF_CONTINUE; /* *pfn has correct page already */

	if (!fault->prefetch && kvm_can_do_async_pf(vcpu)) {
		trace_kvm_try_async_get_page(fault->addr, fault->gfn);
		if (kvm_find_async_pf_gfn(vcpu, fault->gfn)) {
			trace_kvm_async_pf_repeated_fault(fault->addr, fault->gfn);
			kvm_make_request(KVM_REQ_APF_HALT, vcpu);
			return RET_PF_RETRY;
		} else if (kvm_arch_setup_async_pf(vcpu, fault->addr, fault->gfn)) {
			return RET_PF_RETRY;
		}
	}

	/*
	 * Allow gup to bail on pending non-fatal signals when it's also allowed
	 * to wait for IO.  Note, gup always bails if it is unable to quickly
	 * get a page and a fatal signal, i.e. SIGKILL, is pending.
	 */
	fault->pfn = __gfn_to_pfn_memslot(slot, fault->gfn, false, true, NULL,
					  fault->write, &fault->map_writable,
					  &fault->hva);
	return RET_PF_CONTINUE;
}
```

# Fast page fault / `fast_page_fault()`

After shadow page become stable (all GFNs are mapped in shadow page table, it is a short stage since only one shadow page table is used and only a few of page is needed), **almost all page fault is caused by write-protect** (frame-buffer under Xwindow, migration), the other small part is caused by page merge/COW under KSM/THP.

What we need do to fix the rest page fault (EFEC.P = 1 && RSV != 1) is just **increasing the corresponding access on the spte**.

Write disable 并不是我们真的想 disable write，而是就是为了让它发生 page fault 比如 access tracking 这种情况，所以 fix 就很简单，移除 write disable bit 就好了，同时因为**简单地移除此 bit 并不需要 lock，所以为 fast 的处理提供了可能**：

下面两个片段展示了 `fast_page_fault()` 所有调用的地方：

```c
static int kvm_tdp_mmu_page_fault(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
    //...
    // fast page fault
	r = fast_page_fault(vcpu, fault);
	if (r != RET_PF_INVALID)
		return r;
    //...
    // take the mmu lock
	read_lock(&vcpu->kvm->mmu_lock);
    //...
    // release the mmu lock
	read_unlock(&vcpu->kvm->mmu_lock);
    //...
}

static int direct_page_fault(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
    //...
    // fast page fault
	r = fast_page_fault(vcpu, fault);
	if (r != RET_PF_INVALID)
		return r;
    //...
    // take the mmu lock
	write_lock(&vcpu->kvm->mmu_lock);
    //...
    // release the mmu lock
	write_unlock(&vcpu->kvm->mmu_lock);
    //...
}
```

TD live migration 目前也是这么处理的，write unblock 在 fast path，write block 在 slow path。

我觉得一个应用场景是 live migration, 比如在 migration 时通常会先 block 一些 page，等到后面要访问这个 page 的时候再以 lazy 的方式 unblock，这样子可以记录哪些 page 是 dirty 的 [fast-write-protection-v2](http://events17.linuxfoundation.org/sites/events/files/slides/Guangrong-fast-write-protection.pdf)。[KVM: MMU: fast page fault [LWN.net]](https://lwn.net/Articles/489307/) 这里也提到了 migration 的 case。fast page fault 主要缓解的 cost 在于

- **it fixes page fault out of mmu-lock**, and uses a very light way to avoid the race with other pathes.
- Also, it fixes page fault in the front of **gfn_to_pfn** (`kvm_faultin_pfn()`), it means no host page table walking。

```c
direct_page_fault^
    fast_page_fault
static int fast_page_fault(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
    //...
    // 首先判断这个 page fault 可不可以是 fast 的
	if (!page_fault_can_be_fast(vcpu->kvm, fault))
		return RET_PF_INVALID;
    //...

	do {
        //...
        // 此处省去了非 TDP 的情况...
        // 此函数作用为找到出现 page fault 的那个 gfn 所对应的 PTE 的地址。
		sptep = kvm_tdp_mmu_fast_pf_get_last_sptep(vcpu, fault->addr, &spte);

        // 如果这个 PTE 不是 back by RAM 的，比如是 back by MMIO 的，那么直接返回 RET_PF_INVALID
        // 因为这个需要在 slow path 进行 handle
		if (!is_shadow_present_pte(spte))
			break;

        // 找到用来描述这个 PTE 的 kvm_mmu_page
		sp = sptep_to_sp(sptep);
        //...

        // 当时会产生 page fault 的操作，现在还会吗？如果不会，那说明这是 TLB
        // lazily flushed 导致的，返回 RET_PF_SPURIOUS。
		if (is_access_allowed(fault, spte)) {
			ret = RET_PF_SPURIOUS;
			break;
		}

		new_spte = spte;

        // See access tracking in KVM^, ept 没有 A/D support 的情况
        // 会通过 set RWX 0 来 enable access track，原来的 RWX 放在了高位
        // 所以要 restore 回来。
		if (unlikely(!kvm_ad_enabled()) && is_access_track_spte(spte))
			new_spte = restore_acc_track_spte(new_spte);

        //...
		/*
		 * To keep things simple, only SPTEs that are MMU-writable can
		 * be made fully writable outside of mmu_lock, e.g. only SPTEs
		 * that were write-protected for dirty-logging or access
		 * tracking are handled here.  Don't bother checking if the
		 * SPTE is writable to prioritize running with A/D bits enabled.
		 * The is_access_allowed() check above handles the common case
		 * of the fault being spurious, and the SPTE is known to be
		 * shadow-present, i.e. except for access tracking restoration
		 * making the new SPTE writable, the check is wasteful.
		 */
		if (fault->write && is_mmu_writable_spte(spte)) {
			new_spte |= PT_WRITABLE_MASK;
            //...
		}

        //...
		/*
		 * Currently, fast page fault only works for direct mapping
		 * since the gfn is not stable for indirect shadow page. See
		 * Documentation/virt/kvm/locking.rst to get more detail.
		 */
		if (fast_pf_fix_direct_spte(vcpu, fault, sptep, spte, new_spte, sp->role.level)) {
			ret = RET_PF_FIXED;
			break;
		}
        //...
	} while (true);

    //...
	return ret;
}
```

### `page_fault_can_be_fast()` KVM

- 首先判断是不是 reserved bits set 导致的，如果是，那么不能走 fast path。
- PTE 是 present 并且 `fault->write` 被置上了，说明这个是因为写权限不足导致的，可以 fast path 来 write unblock。
- PTE 没有 present，仍然有可能 fast path，只要 A/D 是 disabled 的，KVM 想要进行 access tracking。

```c
static bool page_fault_can_be_fast(struct kvm *kvm, struct kvm_page_fault *fault)
{
	/*
	 * Page faults with reserved bits set, i.e. faults on MMIO SPTEs, only
	 * reach the common page fault handler if the SPTE has an invalid MMIO
	 * generation number.  Refreshing the MMIO generation needs to go down
	 * the slow path.  Note, EPT Misconfigs do NOT set the PRESENT flag!
	 */
	if (fault->rsvd)
		return false;

	/*
	 * #PF can be fast if:
	 *
	 * 1. The shadow page table entry is not present and A/D bits are
	 *    disabled _by KVM_, which could mean that the fault is potentially
	 *    caused by access tracking (if enabled).  If A/D bits are enabled
	 *    by KVM, but disabled by L1 for L2, KVM is forced to disable A/D
	 *    bits for L2 and employ access tracking, but the fast page fault
	 *    mechanism only supports direct MMUs.
	 * 2. The shadow page table entry is present, the access is a write,
	 *    and no reserved bits are set (MMIO SPTEs cannot be "fixed"), i.e.
	 *    the fault was caused by a write-protection violation.  If the
	 *    SPTE is MMU-writable (determined later), the fault can be fixed
	 *    by setting the Writable bit, which can be done out of mmu_lock.
	 */
	if (!fault->present)
		return !kvm_ad_enabled();

	/*
	 * Note, instruction fetches and writes are mutually exclusive, ignore
	 * the "exec" flag.
	 */
	return fault->write;
}
```

### `fast_pf_fix_direct_spte()` KVM

```c
/*
 * Returns true if the SPTE was fixed successfully. Otherwise,
 * someone else modified the SPTE from its original value.
 */
static bool
fast_pf_fix_direct_spte(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault,
			u64 *sptep, u64 old_spte, u64 new_spte, int level)
{
	gfn_t gfn = fault->gfn;

	/*
	 * Theoretically we could also set dirty bit (and flush TLB) here in
	 * order to eliminate unnecessary PML logging. See comments in
	 * set_spte. But fast_page_fault is very unlikely to happen with PML
	 * enabled, so we do not do this. This might result in the same GPA
	 * to be logged in PML buffer again when the write really happens, and
	 * eventually to be called by mark_page_dirty twice. But it's also no
	 * harm. This also avoids the TLB flush needed after setting dirty bit
	 * so non-PML cases won't be impacted.
	 *
	 * Compare with set_spte where instead shadow_dirty_mask is set.
	 */
	if (!try_cmpxchg64(sptep, &old_spte, new_spte))
		return false;

	if (is_writable_pte(new_spte) && !is_writable_pte(old_spte)) {
		if (fault->is_private)
			kvm_write_unblock_private_page(vcpu->kvm, gfn, level);

		mark_page_dirty_in_slot(vcpu->kvm, fault->slot, gfn);
	}

	return true;
}
```

### `kvm_mmu_hugepage_adjust()` KVM

```c
void kvm_mmu_hugepage_adjust(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
	struct kvm_memory_slot *slot = fault->slot;
	kvm_pfn_t mask;

	fault->huge_page_disallowed = fault->exec && fault->nx_huge_page_workaround_enabled;

	if (unlikely(fault->max_level == PG_LEVEL_4K))
		return;

	if (!fault->nonleaf && is_error_noslot_pfn(fault->pfn))
		return;

	if (kvm_slot_dirty_track_enabled(slot))
		return;

	/*
	 * Enforce the iTLB multihit workaround after capturing the requested
	 * level, which will be used to do precise, accurate accounting.
	 */
	fault->req_level = __kvm_mmu_max_mapping_level(vcpu->kvm, slot,
						       fault->gfn, fault->max_level,
						       fault->host_level,
						       kvm_is_faultin_private(fault));
	if (fault->req_level == PG_LEVEL_4K || fault->huge_page_disallowed)
		return;

	/*
	 * mmu_invalidate_retry() was successful and mmu_lock is held, so
	 * the pmd can't be split from under us.
	 */
	fault->goal_level = fault->req_level;
	mask = KVM_PAGES_PER_HPAGE(fault->goal_level) - 1;
	VM_BUG_ON((fault->gfn & mask) != (fault->pfn & mask));
	fault->pfn &= ~mask;
}
```

### `direct_page_fault()` KVM

两种情况会调用到：

- guest 的 CR0 paging 都没打开，当然也没有打开 EPT；此时 GVA == GPA，也没页表。
- `kvm` module 的 TDP 没打开，但是 `kvm_intel` 的 EPT 打开了。表示 Google TDP 的 patchset 引入之前使用 EPT 的方式，也就是 Direct Page Fault 的方式。

所谓的 direct 表示我们要处理的是 GPA，而不是 GVA。Direct 和 Google TDP 是两种 TDP 的实现。

```c
static int direct_page_fault(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
	int r;
    //...
    // 如果 write track 了那就不能进行 handle
    //...

    // fast PF
	r = fast_page_fault(vcpu, fault);
    //...

    // 计算出发生 PF 对应的 pfn
	r = kvm_faultin_pfn(vcpu, fault, ACC_ALL);
    //handling some cases...

    make_mmu_pages_available(vcpu);
    // 建立 EPT 每一级的映射
	return direct_map(vcpu, fault);
    //...
}
```

### `direct_map()` KVM

这个函数的作用是，为 page fault 发生的 gfn 建立 EPT 里每一级页表（包括 leaf PTE）的映射，真正地分配内存。

```c
static int direct_map(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
	struct kvm_shadow_walk_iterator it;
	struct kvm_mmu_page *sp;
	int ret;
	gfn_t base_gfn;

    // DFS 方式从 root 一致找到 leaf，返回每一级 PSE
	for_each_shadow_entry(vcpu, fault->addr, it) {
        //...
        // 根据发生 fault 的 gfn，可以倒推出应该 map 这个 gfn 在 it.level 这一级的
        // page table 的第一个 gfn，也就是 base_gfn。不难发现，越靠近 root，这个 base 越小
        // 约靠近 leaf，这个 base 越接近于 fault->gfn
		base_gfn = gfn_round_for_level(fault->gfn, it.level);
        // huge page 相关的
		if (it.level == fault->goal_level)
			break;

        // 拿到 base_gfn 所在的 PT 页，如果没有就创建一个
		sp = kvm_mmu_get_child_sp(vcpu, it.sptep, base_gfn, true, ACC_ALL);
		if (sp == ERR_PTR(-EEXIST))
			continue;

        // 让 it.sptep 指向这个刚刚找到的 sp
		link_shadow_page(vcpu, it.sptep, sp);
        //...
	}

    // error checking...
    // 此时的 it.sptep 应该已经指向最后一级 PTE 了
    // 所以将这个值更新到 (base_gfn -> fault->pfn) 的映射。
	ret = mmu_set_spte(vcpu, fault->slot, it.sptep, ACC_ALL, base_gfn, fault->pfn, fault);
	if (ret == RET_PF_SPURIOUS)
		return ret;

	direct_pte_prefetch(vcpu, it.sptep);
	return ret;
}
```

### `kvm_tdp_mmu_page_fault()` / KVM

当 TDP 和 EPT 都打开的时候，会调用这个函数；当 TDP 没有打开，但是 EPT 打开的时候，会调用 `direct_page_fault()`。两个函数主要的区别在于使用的是 Google TDP 还是 Direct 的实现方式。

```c
// 只有这一条路会调用到
// 其他的 path 都是不可达的
handle_ept_violation
    kvm_mmu_page_fault
        kvm_mmu_do_page_fault
        	if (IS_ENABLED(CONFIG_RETPOLINE) && fault.is_tdp)
            	kvm_tdp_page_fault(vcpu, &fault);
                	if (tdp_mmu_enabled)
                        kvm_tdp_mmu_page_fault // <----
                	return direct_page_fault(vcpu, fault);

static int kvm_tdp_mmu_page_fault(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
	int r;
    // 如果 write track 了那就不能进行 handle
    //...

    // fast PF
	r = fast_page_fault(vcpu, fault);
    //...

    // 计算出发生 PF 对应的 pfn
	r = kvm_faultin_pfn(vcpu, fault, ACC_ALL);
    //...
    // stale page fault...
    //...
	return kvm_tdp_mmu_map(vcpu, fault);
}
```

### `kvm_tdp_mmu_map()` KVM

作用和 `direct_map()` 一样，都是 map 一个 page。

```c
// 普通路径
kvm_mmu_do_page_fault
    kvm_tdp_page_fault
        kvm_tdp_mmu_page_fault
            kvm_tdp_mmu_map

// 给 TDX 的路径
kvm_mmu_map_tdp_page
    direct_page_map
        kvm_tdp_mmu_map
```

```c
// Handle a TDP page fault (NPT/EPT violation/misconfiguration) by installing
// page tables and SPTEs to translate the faulting GPA.
int kvm_tdp_mmu_map(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
	struct kvm_mmu *mmu = vcpu->arch.mmu;
	struct kvm *kvm = vcpu->kvm;
	struct tdp_iter iter;
	struct kvm_mmu_page *sp;
	gfn_t raw_gfn;
	bool is_private = fault->is_private;
	int ret = RET_PF_RETRY;

	kvm_mmu_hugepage_adjust(vcpu, fault);

    //...
    // GPA -> GFN
	raw_gfn = gpa_to_gfn(fault->addr);

    // sanity checks...
    // 和 Direct 的实现一样，也是 DFS 返回每一级 PSE
	tdp_mmu_for_each_pte(iter, mmu, is_private, raw_gfn, raw_gfn + 1) {
		int r;

        // NX-huge page 相关的
        // retry...
        // ...
		if (iter.level == fault->goal_level)
			goto map_target_level;

		// Step down into the lower level page table if it exists.
		if (is_shadow_present_pte(iter.old_spte) && !is_large_pte(iter.old_spte))
			continue;

		if (is_private_zapped_spte(iter.old_spte) && is_large_pte(iter.old_spte)) {
			if (tdp_mmu_unzap_large_spte(vcpu, fault, &iter) != RET_PF_CONTINUE)
				break;
		}

		/*
		 * The SPTE is either non-present or points to a huge page that
		 * needs to be split.
		 */
		sp = tdp_mmu_alloc_sp(vcpu, tdp_iter_child_role(&iter));
		tdp_mmu_init_sp(sp, iter.sptep, iter.gfn);

		sp->nx_huge_page_disallowed = fault->huge_page_disallowed;

		if (is_shadow_present_pte(iter.old_spte))
			r = tdp_mmu_split_huge_page(kvm, &iter, sp, true);
		else
			r = tdp_mmu_link_sp(kvm, &iter, sp, true);

        // retry...
        // huge page-related...
		if (!is_private && iter.level == vcpu->arch.mmu->root_role.level &&
		    kvm_gfn_shared_mask(vcpu->kvm))
			link_shared_spte(vcpu->kvm, iter.gfn, iter.level,
					 kvm_tdp_mmu_read_spte(iter.sptep));
	}

	/*
	 * The walk aborted before reaching the target level, e.g. because the
	 * iterator detected an upper level SPTE was frozen during traversal.
	 */
	WARN_ON_ONCE(iter.level == fault->goal_level);

map_target_level:
	if (!fault->nonleaf)
		ret = tdp_mmu_map_handle_target_level(vcpu, fault, &iter);
	else
		ret = RET_PF_FIXED;
    //...
}
```

### EPT violation handling in KVM

```c
handle_ept_violation
    // 从 VMCS 里读出 fault 的 GPA
    // 从 VMCS 里读出 exit_qualification
    __vmx_handle_ept_violation
        // based on the exit_qualification, 看看是什么引起的，读？写？fetch？not present?
        kvm_mmu_page_fault
            kvm_mmu_do_page_fault
                // construct kvm_page_fault struct
                kvm_tdp_page_fault
                    direct_page_fault // search^
                        
```

### `kvm_mmu_page_fault()` KVM / entry for handling page fault in KVM

三个 page fault handler 都调到了这里，可以算是 page fault 处理的入口函数。

这个函数不仅仅 handle EPT enabled case 下的 page fault，也 handle shadow page table（普通情况）下的 page fault。因此，传入的可能是 HVA（CR2），也可能是 GPA（EPT）。

```c
// 当普通情况时，cr2_or_gpa 是 cr2，也就是 GVA
// 当时 EPT 时，cr2_or_gpa 是 gpa，也就是 GPA。
int noinline kvm_mmu_page_fault(struct kvm_vcpu *vcpu, gpa_t cr2_or_gpa, u64 error_code,
		       void *insn, int insn_len)
{
	int r, emulation_type = EMULTYPE_PF;
	bool direct = vcpu->arch.mmu->root_role.direct;

	/*
	 * IMPLICIT_ACCESS is a KVM-defined flag used to correctly perform SMAP
	 * checks when emulating instructions that triggers implicit access.
	 * WARN if hardware generates a fault with an error code that collides
	 * with the KVM-defined value.  Clear the flag and continue on, i.e.
	 * don't terminate the VM, as KVM can't possibly be relying on a flag
	 * that KVM doesn't know about.
	 */
	if (WARN_ON_ONCE(error_code & PFERR_IMPLICIT_ACCESS))
		error_code &= ~PFERR_IMPLICIT_ACCESS;

	if (WARN_ON_ONCE(!VALID_PAGE(vcpu->arch.mmu->root.hpa)))
		return RET_PF_RETRY;

	r = RET_PF_INVALID;

    //...
    r = kvm_mmu_do_page_fault(vcpu, cr2_or_gpa, lower_32_bits(error_code), false, &emulation_type);
    //...

	if (r != RET_PF_EMULATE)
		return 1;

	/*
	 * Before emulating the instruction, check if the error code
	 * was due to a RO violation while translating the guest page.
	 * This can occur when using nested virtualization with nested
	 * paging in both guests. If true, we simply unprotect the page
	 * and resume the guest.
	 */
	if (vcpu->arch.mmu->root_role.direct &&
	    (error_code & PFERR_NESTED_GUEST_PAGE) == PFERR_NESTED_GUEST_PAGE) {
		kvm_mmu_unprotect_page(vcpu->kvm, gpa_to_gfn(cr2_or_gpa));
		return 1;
	}

	/*
	 * vcpu->arch.mmu.page_fault returned RET_PF_EMULATE, but we can still
	 * optimistically try to just unprotect the page and let the processor
	 * re-execute the instruction that caused the page fault.  Do not allow
	 * retrying MMIO emulation, as it's not only pointless but could also
	 * cause us to enter an infinite loop because the processor will keep
	 * faulting on the non-existent MMIO address.  Retrying an instruction
	 * from a nested guest is also pointless and dangerous as we are only
	 * explicitly shadowing L1's page tables, i.e. unprotecting something
	 * for L1 isn't going to magically fix whatever issue cause L2 to fail.
	 */
	if (!mmio_info_in_cache(vcpu, cr2_or_gpa, direct) && !is_guest_mode(vcpu))
		emulation_type |= EMULTYPE_ALLOW_RETRY_PF;
emulate:
	return x86_emulate_instruction(vcpu, cr2_or_gpa, emulation_type, insn,
				       insn_len);
}
```

### `kvm_mmu_do_page_fault()` KVM

```c
static inline int kvm_mmu_do_page_fault(struct kvm_vcpu *vcpu, gpa_t cr2_or_gpa,
					u32 err, bool prefetch, int *emulation_type)
{
    // addr 可能是 HVA，也可能是 GPA
	struct kvm_page_fault fault = {
		.addr = cr2_or_gpa,
		.error_code = err,
		.exec = err & PFERR_FETCH_MASK,
		.write = err & PFERR_WRITE_MASK,
		.present = err & PFERR_PRESENT_MASK,
		.rsvd = err & PFERR_RSVD_MASK,
		.user = err & PFERR_USER_MASK,
		.prefetch = prefetch,
		.is_tdp = likely(vcpu->arch.mmu->page_fault == kvm_tdp_page_fault),
		.nx_huge_page_workaround_enabled = is_nx_huge_page_enabled(vcpu->kvm),
		.max_level = KVM_MAX_HUGEPAGE_LEVEL,
		.req_level = PG_LEVEL_4K,
		.goal_level = PG_LEVEL_4K,
		.is_private = kvm_mem_is_private(vcpu->kvm, cr2_or_gpa >> PAGE_SHIFT),
	};
	int r;

    // direct fault.addr 是一个 GPA 而不是一个 GVA
    // 因此我们可以计算出来 gfn 以及这个 gfn 所在的 memslot 是哪一个
	if (vcpu->arch.mmu->root_role.direct) {
		fault.gfn = fault.addr >> PAGE_SHIFT;
		fault.slot = kvm_vcpu_gfn_to_memslot(vcpu, fault.gfn);
	}

    // APF-related...
    //...
    // 简化为...
	r = vcpu->arch.mmu->page_fault(vcpu, &fault);

	if (fault.write_fault_to_shadow_pgtable && emulation_type)
		*emulation_type |= EMULTYPE_WRITE_PF_TO_SP;

    // countings...
	return r;
}
```

### `kvm_tdp_page_fault()` KVM

从这个名字就看出来 TDP 的意思了，TDP 的并不就直接等于 EPT，而是两种情况：

- EPT enabled 的情况
- Guest 还没有打开 paging，因此 GVA == GPA 的情况。

无论是哪一种情况，它表示 fault 的 address 都是一个 GPA。

```c
int kvm_tdp_page_fault(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
    // 一个看不懂的 corner case
    //...
	if (tdp_mmu_enabled)
		return kvm_tdp_mmu_page_fault(vcpu, fault);
	return direct_page_fault(vcpu, fault);
}
```

### `ept_page_fault()` KVM

不要被函数名字迷惑了，这个是 Nested 环境下才有的。真正的 EPT handler 是 `kvm_tdp_page_fault()`。

## `FNAME(page_fault)` / KVM

`FNAME(page_fault)` 可能是：

- `paging64_page_fault()`
- `paging32_page_fault()`
- `ept_page_fault()`

先看一下基本的框架：

```c
static int FNAME(page_fault)(struct kvm_vcpu *vcpu, struct kvm_page_fault *fault)
{
	struct guest_walker walker;
	int r;

    //...
	// Look up the guest pte for the faulting address (GVA or l2 GPA).
    // fault->addr 可能是 GVA（shadow PT），也可能是  l2 的 GPA
	r = FNAME(walk_addr)(&walker, vcpu, fault->addr, fault->error_code & ~PFERR_RSVD_MASK);

	/*
	 * The page is not mapped by the guest.  Let the guest handle it.
	 */
	if (!r) {
		if (!fault->prefetch)
			kvm_inject_emulated_page_fault(vcpu, &walker.fault);

		return RET_PF_RETRY;
	}

	fault->gfn = walker.gfn;
	fault->max_level = walker.level;
	fault->slot = kvm_vcpu_gfn_to_memslot(vcpu, fault->gfn);

	if (page_fault_handle_page_track(vcpu, fault)) {
		shadow_page_table_clear_flood(vcpu, fault->addr);
		return RET_PF_EMULATE;
	}

	r = mmu_topup_memory_caches(vcpu, true);
	if (r)
		return r;

	r = kvm_faultin_pfn(vcpu, fault, walker.pte_access);
	if (r != RET_PF_CONTINUE)
		return r;

	/*
	 * Do not change pte_access if the pfn is a mmio page, otherwise
	 * we will cache the incorrect access into mmio spte.
	 */
	if (fault->write && !(walker.pte_access & ACC_WRITE_MASK) &&
	    !is_cr0_wp(vcpu->arch.mmu) && !fault->user && fault->slot) {
		walker.pte_access |= ACC_WRITE_MASK;
		walker.pte_access &= ~ACC_USER_MASK;

		/*
		 * If we converted a user page to a kernel page,
		 * so that the kernel can write to it when cr0.wp=0,
		 * then we should prevent the kernel from executing it
		 * if SMEP is enabled.
		 */
		if (is_cr4_smep(vcpu->arch.mmu))
			walker.pte_access &= ~ACC_EXEC_MASK;
	}

	r = RET_PF_RETRY;
	write_lock(&vcpu->kvm->mmu_lock);

	if (is_page_fault_stale(vcpu, fault))
		goto out_unlock;

	r = make_mmu_pages_available(vcpu);
	if (r)
		goto out_unlock;
	r = FNAME(fetch)(vcpu, fault, &walker);

out_unlock:
	write_unlock(&vcpu->kvm->mmu_lock);
	kvm_release_pfn_clean(fault->pfn);
	return r;
}

```
