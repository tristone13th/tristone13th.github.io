---
categories: Linux
title: MMU Notifier
---

## Linux MMU Notifier

Original patch: [kernel/git/torvalds/linux.git - Linux kernel source tree](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=cddb8a5c14aa89810b40495d94d3d2a0faee6619)

Codes:

- `include/linux/mmu_notifier.h`

## `struct mmu_notifier_range` Kernel

在 `invalidate_range_start` 和 `invalidate_range_end` 函数中会用到，表示要 invalidate 的区间。

```c
// #ifdef CONFIG_MMU_NOTIFIER
struct mmu_notifier_range {
	struct mm_struct *mm;
	unsigned long start; // HVA
	unsigned long end; // HVA
	unsigned flags;
	enum mmu_notifier_event event; // invalidate 原因
	void *owner;
};
```

### `struct mmu_notifier_event` Kernel

多个 invalidate 的 reason。

```c
enum mmu_notifier_event {
	MMU_NOTIFY_UNMAP = 0,
	MMU_NOTIFY_CLEAR,
	MMU_NOTIFY_PROTECTION_VMA,
	MMU_NOTIFY_PROTECTION_PAGE,
	MMU_NOTIFY_SOFT_DIRTY,
	MMU_NOTIFY_RELEASE,
	MMU_NOTIFY_MIGRATE,
	MMU_NOTIFY_EXCLUSIVE,
};
```

## `struct mmu_notifier_ops` Kernel

这个结构体每一个成员在源代码中都有很详尽的注释。

```c
struct mmu_notifier_ops {
	void (*release)(struct mmu_notifier *subscription, struct mm_struct *mm);
	int (*clear_flush_young)(struct mmu_notifier *subscription, struct mm_struct *mm, unsigned long start, unsigned long end);
	int (*clear_young)(struct mmu_notifier *subscription, struct mm_struct *mm, unsigned long start, unsigned long end);
	int (*test_young)(struct mmu_notifier *subscription, struct mm_struct *mm, unsigned long address);
	// * change_pte is called in cases that pte mapping to page is changed:
	// for example, when ksm remaps pte to point to a new shared page.
	// 这里的 mapping 指的是 kernel 页表，对于同一个 HVA，映射到了一个不同的 HPA（page migration）
	// 所以需要通知到 KVM 这个页换位置了，请 KVM 也更新下相关的信息，比如 EPT 里的 GPA->HPA mapping。
	void (*change_pte)(struct mmu_notifier *subscription, struct mm_struct *mm, unsigned long address, pte_t pte);
	// invalidate_range_start() is called when all pages in the
	// range are still mapped and have at least a refcount of one.
	// invalidate_range_end() is called when all pages in the
	// range have been unmapped and the pages have been freed by
	// the VM.（VM 并不是虚拟机的位置）。numa_balancing 应该调用不到这里吧，毕竟
	// 并没有 invalidate，而是换了位置，所以应该调用到 change_pte？
	int (*invalidate_range_start)(struct mmu_notifier *subscription, const struct mmu_notifier_range *range);
	void (*invalidate_range_end)(struct mmu_notifier *subscription, const struct mmu_notifier_range *range);
	void (*arch_invalidate_secondary_tlbs)( struct mmu_notifier *subscription, struct mm_struct *mm, unsigned long start, unsigned long end);
	struct mmu_notifier *(*alloc_notifier)(struct mm_struct *mm);
	void (*free_notifier)(struct mmu_notifier *subscription);
};
```

### `ops->invalidate_range_start()`/`ops->invalidate_range_end()` Kernel

从这两个函数的签名可以看到，参数是所有的 notifier，表示要通知哪些注册的 notifer，以及一个 `mmu_notifier_range`，表示通知的内容（具体是哪些 range 要被 invalidate）。

`invalidate_range_start()` and `invalidate_range_end()` must be paired.

`invalidate_range_start()` is called when all pages in the range are still mapped and have **at least a refcount of one**.

`invalidate_range_end()` is called when all pages in the range have been unmapped and the pages have been freed by the VM.

The VM will remove the PTEs and the page between `invalidate_range_start()` and `invalidate_range_end()`.

# How does KVM subsystem use MMU notifier

There is a kernel config: `CONFIG_MMU_NOTIFIER`. Only this kernel config and `KVM_ARCH_WANT_MMU_NOTIFIER` is defined, the MMU Notifier in KVM is enabled:

```c
#if defined(CONFIG_MMU_NOTIFIER) && defined(KVM_ARCH_WANT_MMU_NOTIFIER)
```

```c
KVM_CREATE_VM
    kvm_dev_ioctl_create_vm
        kvm_create_vm
            kvm_init_mmu_notifier
                // current-mm means KVM will got notified if current process's memory has things changed
                mmu_notifier_register(&kvm->mmu_notifier, current->mm);
```

### `KVM_ARCH_WANT_MMU_NOTIFIER` KVM

It is defined in each arch (x86, arm, riscv…):

```c
#define KVM_ARCH_WANT_MMU_NOTIFIER
```

### `struct mmu_notifier` In KVM

```c
static const struct mmu_notifier_ops kvm_mmu_notifier_ops = {
	.invalidate_range	= kvm_mmu_notifier_invalidate_range,
	.invalidate_range_start	= kvm_mmu_notifier_invalidate_range_start,
	.invalidate_range_end	= kvm_mmu_notifier_invalidate_range_end,
	.clear_flush_young	= kvm_mmu_notifier_clear_flush_young,
	.clear_young		= kvm_mmu_notifier_clear_young,
	.test_young		= kvm_mmu_notifier_test_young,
	.change_pte		= kvm_mmu_notifier_change_pte,
	.release		= kvm_mmu_notifier_release,
};


kvm_create_vm
    kvm_init_mmu_notifier
        mmu_notifier_register
            kvm->mmu_notifier.ops = &kvm_mmu_notifier_ops;
            __mmu_notifier_register

kvm_destroy_vm
    mmu_notifier_unregister
        subscription->ops->release
            kvm_mmu_notifier_release
```

### `struct kvm_hva_range` KVM

可以看到和 `kvm_gfn_range` 很像。因为 `kvm_mmu_notifier_ops` 里的成员函数比如 `invalidate_start`, `invalidate_end` 都是基于 HVA 的，所以需要把 `mmu_notifier_range` 里的成员（mmu_notifier_range 本身就是基于 HVA 的，Kernel 并不 aware GPA 这个概念）赋值到这个里面。

```c
struct kvm_hva_range {
	unsigned long start;
	unsigned long end;
    // 下面这两个属性是此结构体和 mmu_notifier_range 的最主要的区别，后者没有这两个结构体
	pte_t pte;
    // 下面 3 个属性都是函数，调用顺序详参 __kvm_handle_hva_range
    // 基本上就是 on_lock -> handler -> handler -> ... -> on_unlock
	hva_handler_t handler;
	on_lock_fn_t on_lock;
	on_unlock_fn_t on_unlock;

	bool flush_on_ret; // 要不要 flush remote TLB?
	bool may_block;
};
```

### `struct kvm_gfn_range` KVM

表示一段 GFN 的区间。主要是为 KVM MMU Notifier 服务的。HVA 对于 KVM 处理用处并不大，很多时候 KVM 需要拿到 GFN 的信息。所以数据的流向是：`mmu_notifier_range`(HVA) -> `kvm_hva_range`(HVA) -> `kvm_gfn_range`(GFN)。

这个结构体是 Arch 无关的，所有的 Arch 的此结构体都一样。

```c
struct kvm_gfn_range {
	struct kvm_memory_slot *slot; // 这个 GFN 所在的 slot
	gfn_t start;
	gfn_t end;
	pte_t pte;
	bool may_block;
};
```

### `kvm_handle_hva_range` / `kvm_handle_hva_range_no_flush` / `__kvm_handle_hva_range` KVM

前两个函数都调用了 `__kvm_handle_hva_range`，最主要的逻辑在这里面。

概括：找到对应这个 HVA 区域的所有 GFN 区域，并且执行 `kvm_hva_range->lock()`, `kvm_hva_range->handler()` 以及 `kvm_hva_range->unlock()`。参数是 `kvm_gfn_range`。

handler 做了什么以及在哪里置上的，可以参考：`kvm_mmu_notifier_invalidate_range_start()` 以及 `kvm_mmu_unmap_gfn_range()`。

```c
static __always_inline int __kvm_handle_hva_range(struct kvm *kvm, const struct kvm_hva_range *range)
{
	bool ret = false, locked = false;
	struct kvm_gfn_range gfn_range;
	struct kvm_memory_slot *slot;
	struct kvm_memslots *slots;
	int i, idx;

    //...
	// A null handler is allowed if and only if on_lock() is provided.
	if (WARN_ON_ONCE(IS_KVM_NULL_FN(range->on_lock) && IS_KVM_NULL_FN(range->handler)))
		return 0;

    //...
    // KVM_ADDRESS_SPACE_NUM is 2 in x86
	for (i = 0; i < KVM_ADDRESS_SPACE_NUM; i++) {
		struct interval_tree_node *node;

        // each address space has a bunch of slots
		slots = __kvm_memslots(kvm, i);
        // 望文生义：对于落在这个 range 区间的每一个 kvm_memory_slot
        // 相交就算在里面
		kvm_for_each_memslot_in_hva_range(node, slots, range->start, range->end - 1) {
			unsigned long hva_start, hva_end;
			slot = container_of(node, struct kvm_memory_slot, hva_node[slots->node_idx]);
            // slot->userspace_addr 这是 slot 的 HVA
            // 这个 max 和 min 的作用是找到 slot 和 range 重合的区域。
			hva_start = max(range->start, slot->userspace_addr);
			hva_end = min(range->end, slot->userspace_addr + (slot->npages << PAGE_SHIFT));

            // 从 hva_range 到 gnf_range
            // 这个 PTE 指的好像是 HVA -> HPA 的 PTE
			gfn_range.pte = range->pte;
			gfn_range.may_block = range->may_block;

			/*
			 * {gfn(page) | page intersects with [hva_start, hva_end)} =
			 * {gfn_start, gfn_start+1, ..., gfn_end-1}.
			 */
            // start of the gfn of current **intersection** range
			gfn_range.start = hva_to_gfn_memslot(hva_start, slot);
            // end of the gfn of current **intersection** range
			gfn_range.end = hva_to_gfn_memslot(hva_end + PAGE_SIZE - 1, slot);
			gfn_range.slot = slot;

			if (!locked) {
				locked = true;
                //...
				range->on_lock(kvm, range->start, range->end);
                //...
			}
			ret |= range->handler(kvm, &gfn_range);
		}
	}

    // flush 其他 vCPU 的 TLB
	if (range->flush_on_ret && ret)
		kvm_flush_remote_tlbs(kvm);

	if (locked) {
        //...
		range->on_unlock(kvm);
	}

	/* The notifiers are averse to booleans. :-( */
	return (int)ret;
}
```

### `kvm_mmu_notifier_invalidate_range_start()` KVM

这个函数其实就是对 `__kvm_handle_hva_range()` 进行了一下包装。把 `kvm_mmu_unmap_gfn_range` 作为 handler 传进去。

```c
static int kvm_mmu_notifier_invalidate_range_start(struct mmu_notifier *mn,
					const struct mmu_notifier_range *range)
{
	struct kvm *kvm = mmu_notifier_to_kvm(mn);
	const struct kvm_hva_range hva_range = {
		.start		= range->start,
		.end		= range->end,
		.pte		= __pte(0),
		.handler	= kvm_unmap_gfn_range,
		.on_lock	= kvm_mmu_invalidate_begin,
		.on_unlock	= kvm_arch_guest_memory_reclaimed,
		.flush_on_ret	= true,
		.may_block	= mmu_notifier_range_blockable(range),
	};

    //...
	__kvm_handle_hva_range(kvm, &hva_range);
}
```

### `kvm_mmu_invalidate_begin` / on_lock() In `kvm_hva_range` KVM

```c
void kvm_mmu_invalidate_begin(struct kvm *kvm, unsigned long start, unsigned long end)
{
    // 表示我们已经开始 invalidate 的过程了。
    // 注意，在 invalidate_end 的 lock 时候才会 -1 恢复，而不是 invalidate_start 的 unlock。
	kvm->mmu_invalidate_in_progress++;
    //...
    // 记录一下 range 的开始 HVA 与终止 HVA
	kvm->mmu_invalidate_range_start = start;
	kvm->mmu_invalidate_range_end = end;
    //...
}
```

### `kvm_unmap_gfn_range()` / handler() In `kvm_hva_range` KVM

做的事，把所有要 invalidate 的 GFN 的 range，

```c
bool kvm_unmap_gfn_range(struct kvm *kvm, struct kvm_gfn_range *range)
{
	bool flush = false;

	if (kvm_memslots_have_rmaps(kvm))
		flush = kvm_handle_gfn_range(kvm, range, kvm_zap_rmap);

    // Only valid when tdp is enabled
	if (tdp_mmu_enabled)
        // zap leaves, 也就是把所有相关的 TDP leaf 都 zap 掉
        // 很好理解，因为对应的 guest memory 被回收了，那么 TDP 对应的 map 也应该更新。
		flush = kvm_tdp_mmu_unmap_gfn_range(kvm, range, flush);

    // 如果这个 slot 是 APIC PAGE，那么 reload
	if (kvm_x86_ops.set_apic_access_page_addr &&
	    range->slot->id == APIC_ACCESS_PAGE_PRIVATE_MEMSLOT)
		kvm_make_all_cpus_request(kvm, KVM_REQ_APIC_PAGE_RELOAD);

	return flush;
}
```

### ``