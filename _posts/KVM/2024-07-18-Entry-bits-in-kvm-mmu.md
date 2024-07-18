---
categories: KVM
title: Entry Bits in KVM MMU
---

### SPTE state transition

### Bit 11 / Bit 61 / `SPTE_MMU_PRESENT_MASK` / `is_shadow_present_pte()` / Shadow present PTE / KVM

这两个 bit 任何一个 bit 置上都算，这种机制是 TDX patch 引入的，原来只有 bit 11。

注意，即使是 non-leaf SPTE，也是可以 `SPTE_MMU_PRESENT_MASK` 的，也就是说这个和是不是 leaf SPTE 没有关系。

edea7c4fc215c7ee1cc98363b016ad505cbac9f7: KVM: x86/mmu: Use a dedicated bit to track shadow/MMU-present SPTEs

先搞清楚 shadow/MMU-present SPTE 其实是同一个概念。

Bit 11 是软件定义的 bit，硬件并没有用，ignore 掉了。

MMU-present: A MMU present SPTE is backed by actual memory and **may or may not be present in hardware**. MMIO SPTEs are not considered present. (并不是 backed by actual memory？)，所以看来主要是为了**将普通的 SPTE 和 MMIO SPTE 区分开**，置上的表示这个 SPTE 指向的 HPA 是 backed by 真实的内存区间的（但是目前有没有在物理内存里是不重要的），而没有置上表示这其实是一个 MMIO，应该把访问映射到对应的 MMIO 中。

**请把这个和页表里的 Present bit 区分**。页表里的 present 表示这个页在物理内存里（If the present bit is set, the page is available in RAM）。

可以看一下引入以后判断的区别：

```c
static inline bool is_shadow_present_pte(u64 pte)
{
    // return (pte != 0) && !is_mmio_spte(pte) && !is_removed_spte(pte);
    return !!(pte & SPTE_MMU_PRESENT_MASK);
}
```

`pte != 0` 相当于 `pte != SHADOW_NONPRESENT_VALUE`（因为此时 `SHADOW_NONPRESENT_VALUE` 这个还没有被引入）。

**可见，一个 MMU present 的，一定也是 shadow present 的，因此，大多数时候，我们判断 `is_present = is_shadow_present_pte` 具有更严格的条件，隐含了 shadow present 这一要求。反之则不一定。**

### Bit 63 / `SHADOW_NONPRESENT_VALUE` KVM

看这里可以先复习一下 Virtualization Exception^。

```c
#define SHADOW_NONPRESENT_VALUE	BIT_ULL(63)
// 我们是需要保证 SHADOW_NONPRESENT_VALUE 和 SPTE_MMU_PRESENT_MASK 不是同一个 bit
static_assert(!(SHADOW_NONPRESENT_VALUE & SPTE_MMU_PRESENT_MASK));
```

**TDX patch 引入的**，这个的引入是为了 TDX 开路，原来都是直接 hard-coded 0 的。现在变成了 bit 63 是置上的情况。

引入的 patch 的名字叫做：KVM: x86/mmu: Allow non-zero value for non-present SPTE and removed SPTE

这个 bit 名字就叫 Suppress VE，表示发生 EPT violation 的时候应该发生 VM-exit 还是只生成 VE 就行了。

In VMX case，因为 vMMIO 的 handle 之前都是通过把对应的 EPT entry 置为 `W/X` 的（SVM 是通过 reserved bit），这样当 guest 想要访问一个 MMIO 的 GPA，在遍历这个 EPT 表的时候，会发生 EPT Misconfiguration 出来（EPT Misconfiguration 一定会 VM-exit），KVM 发现找不到对应的 `kvm_memory_slot`，那么说明这是一个 MMIO。从而在 KVM 处进行 emulation。分为三步：

1. 设置 MMIO SPTE 应该用的 value，也就是 `VMX_EPT_WRITABLE_MASK | VMX_EPT_EXECUTABLE_MASK`，这样才能产生 EPT Misconfiguration 出来。
2. 产生 EPT Violation，通过判断 slot 存不存在来看是不是一个 MMIO SPTE，是的话创建一个 MMIO SPTE
3. 后续每次 guest 访问这个 GPA，都会产生 EPT Misconfiguration，从而让 KVM 来模拟 MMIO。

```c
// 这是对应第一步
// 设置 mmio 的 bit，注意 EPT 并不是 reserved bit。
u64 __read_mostly shadow_mmio_value;
u64 __read_mostly shadow_mmio_mask;
u64 __read_mostly shadow_mmio_access_mask;
/* The mask to use to trigger an EPT Misconfiguration in order to track MMIO */
#define VMX_EPT_MISCONFIG_WX_VALUE		(VMX_EPT_WRITABLE_MASK | VMX_EPT_EXECUTABLE_MASK)
vt_hardware_setup
	if (enable_ept)
        kvm_mmu_set_ept_masks
        	// EPT Misconfigurations are generated if the value of bits 2:0
        	// of an EPT paging-structure entry is 110b (write/execute).
            kvm_mmu_set_mmio_spte_mask(VMX_EPT_MISCONFIG_WX_VALUE, VMX_EPT_RWX_MASK | VMX_EPT_SUPPRESS_VE_BIT, 0);
                shadow_mmio_value = mmio_value;
            	shadow_mmio_mask  = mmio_mask;
            	shadow_mmio_access_mask = access_mask;

// 这是对应第二步
// 在 MMIO SPTE 还没有置上之前，第一次访问这个 GPA 会 EPT Violation（page fault）而不是 ept misconfig，
// 我们需要通过有没有 slot 来确定这个 spte 应不应该是一个 MMIO，如果是的话创建 mmio spte，从而让后续访问
// 都触发 ept misconfig，exit 到 KVM 进行模拟。
handle_ept_violation
    __vmx_handle_ept_violation
        kvm_mmu_page_fault
            kvm_mmu_do_page_fault
                kvm_tdp_page_fault
                    kvm_tdp_mmu_page_fault
                        kvm_tdp_mmu_map
                            tdp_mmu_map_handle_target_level
                            	if (unlikely(!fault->slot))
                                    make_mmio_spte
                                        spte |= vcpu->kvm->arch.shadow_mmio_value | access;

// 这是对应第三步
// 后续硬件遍历 mmio spte 的时候会发生 ept misconfig，
// KVM 直接当成 MMIO 来处理
handle_ept_misconfig
    kvm_mmu_page_fault(vcpu, gpa, PFERR_RSVD_MASK, NULL, 0);
    	if (unlikely(error_code & PFERR_RSVD_MASK))
    		r = handle_mmio_page_fault(vcpu, cr2_or_gpa, direct);
```

TDX 的情况下，**我们不期望生成一个 EPT Misconfiguration 从而让 KVM 全权处理，而是在 guest 后续访问的时候产生 VE，因为 TD Guest 期望在其访问 MMIO 的时候能收到一个 VE**，这样它就可以 hypercall 给 KVM，把一些 KVM 需要做 MMIO emulation 相关的信息告诉 KVM（VMX 的时候不需要告诉是因为不是 private 的，KVM 直接访问就能拿到了）。总体分为三步：

1. 设置 MMIO SPTE 应该用的 value，也就是 `SHADOW_NONPRESENT_VALUE`，这是一个合法的值，这样才能不产生 EPT Misconfiguration。
2. Guest 第一次访问产生 EPT Violation，并 exit 出来，通过判断 slot 存不存在来看是不是一个 MMIO SPTE，是的话创建一个 MMIO SPTE，也就是 0（因为 suppress VE bit 也 clear 了）。
3. 后续每次 guest 访问这个 GPA，都会产生 VE，从而让 Guest TD handle 并 hypercall 给 KVM，传递给 KVM 一些模拟需要的信息。

刚开始的时候，所有 SPTE 的值都是 `10000..` 也就是 `SHADOW_NONPRESENT_VALUE`，当第一次 EPT Violation 发生并 exit 出来后：

- 对于非 MMIO 的 SPTE，我们保持 suppress VE bit 置上，从而每次 ept violation 都会 exit 出来。这不会影响性能因为 **现有 VMX 也没有用到 EPT Violation VE 这个 feature**。此时映射完成后 SPTE 值变为 `10000… | PFN | …`。
- 对于 MMIO 的 SPTE，我们 clear 掉 suppress VE bit，从而在后续的每次访问都会自动生成一个 VE 给 TD Guest，guest 再 hypercall 出来。因为后面 MMIO 的 SPTE 的值变为 0 而不是 `SHADOW_NONPRESENT_VALUE` 了，所以每次访问这个 GPA 都会产生 VE。

```c
// 这是对应第一步
// 设置 MMIO SPTE default value 为 0 而不是 VNX 用的值，这样才能
// 保证每次产生 VE 而不是 EPT MISCONFIG
tdx_vm_init
	/*
	 * Because guest TD is protected, VMM can't parse the instruction in TD.
	 * Instead, guest uses MMIO hypercall.  For unmodified device driver,
	 * #VE needs to be injected for MMIO and #VE handler in TD converts MMIO
	 * instruction into MMIO hypercall.
	 *
	 * SPTE value for MMIO needs to be setup so that #VE is injected into
	 * TD instead of triggering EPT MISCONFIG.
	 * - RWX=0 so that EPT violation is triggered.
	 * - suppress #VE bit is cleared to inject #VE.
	 */
	kvm_mmu_set_mmio_spte_value(kvm, 0);
        kvm->arch.shadow_mmio_value = 0;

// 这里对应第二步
// Guest TD 访问 MMIO range，因为还没有 map，同时 suppress VE is 1, 所以出现了 EPT Violation
// 我们把此 SPTE 设置成 shadow mmio value，TDX 情况下这个值是 0，从而每次 guest 访问这个地址
// 都会产生 VE 而不是 EPT MISCONFIG
__tdx_handle_exit
    tdx_handle_ept_violation
        __vmx_handle_ept_violation
            kvm_mmu_page_fault
                kvm_mmu_do_page_fault
                    kvm_tdp_page_fault
                        kvm_tdp_mmu_page_fault
                            kvm_tdp_mmu_map
                                tdp_mmu_map_handle_target_level
                                	if (unlikely(!fault->slot))
                                        make_mmio_spte
                                            spte |= vcpu->kvm->arch.shadow_mmio_value | access;

// 这里对应第三步
// TD Guest handle VE 的代码
DEFINE_IDTENTRY(exc_virtualization_exception)
    tdx_handle_virt_exception
        handle_halt // 调用 hcall_func(EXIT_REASON_HLT) 来 hlt
        read_msr // 调用 hcall_func(EXIT_REASON_MSR_READ)
        write_msr // 调用 hcall_func(EXIT_REASON_MSR_WRITE)
        handle_cpuid // 调用 hcall_func(EXIT_REASON_CPUID)
        // 这个是重点 MMIO
        handle_mmio // 告诉 MMIO 的一些信息
```

TDX Module 永远会打开 EPT-violation VE 这个 VMCS execution bit。

虽然名字叫做 value，但是其实也只是这一个 bit，比如我们可以附加一些额外的信息：

```c
static u64 __private_zapped_spte(u64 old_spte)
{
	return SHADOW_NONPRESENT_VALUE | SPTE_PRIVATE_ZAPPED |
		(spte_to_pfn(old_spte) << PAGE_SHIFT) |
		(is_large_pte(old_spte) ? PT_PAGE_SIZE_MASK : 0);
}
```

### Bit 7 / `is_large_pte()` / `is_last_spte()` / `PT_PAGE_SIZE_MASK` / KVM

一般来说，`is_leaf` 就是通过这个来判断的：

```c
bool is_leaf = is_present && is_last_spte(new_spte, level);
```

可以看到，这个 mask 表示这个 spte 表示的

- 是一个 leaf PTE（不是 PSE），
- 但是不是 4K 大小的，所以是 large 的。

```c
//...
// 生成 leaf
make_spte
	if (level > PG_LEVEL_4K)
		spte |= PT_PAGE_SIZE_MASK;
//...
```

```c
// 是个大 leaf
static inline bool is_large_pte(u64 pte)
{
	return pte & PT_PAGE_SIZE_MASK;
}

// 是个大 leaf 或者是个小 leaf，总之是一个 leaf
static inline bool is_last_spte(u64 pte, int level)
{
	return (level == PG_LEVEL_4K) || is_large_pte(pte);
}
```

### 0x5a0ULL / Removed SPTE / `REMOVED_SPTE` / KVM

TDP MMU 引入的一个概念。看来主要是为了：

If a thread running without exclusive control of the MMU lock must perform a multi-part operation on an SPTE, it can set the SPTE to `REMOVED_SPTE` as a **non-present intermediate value**. Other threads which encounter this value should not modify the SPTE. **相当于为了避免额外的 lock，直接把 lock 放在 SPTE 的值里了，可以理解这是一个中间值，Freeze 住 SPTE 的值不能更改。**

```c
#define REMOVED_SPTE	(SHADOW_NONPRESENT_VALUE | 0x5a0ULL)

// 从这里可以看到 REMOVED 不是 MMU PRESENT 的
static_assert(!(REMOVED_SPTE & SPTE_MMU_PRESENT_MASK));
// 从这里可以看到 REMOVED 不能是 PRIVATE_ZAPPED 的
static_assert(!(REMOVED_SPTE & SPTE_PRIVATE_ZAPPED));
```

在使用的时候一般也是使用：

```c
ret = tdp_mmu_set_spte_atomic(kvm, iter, REMOVED_SPTE);
old_spte = kvm_tdp_mmu_write_spte_atomic(sptep, REMOVED_SPTE);
if (!try_cmpxchg64(sptep, &old_spte, REMOVED_SPTE))
```

等等**原子性**的原语，也可以印证这一点。

### Bit 62 / `SPTE_PRIVATE_ZAPPED` / `__private_zapped_spte()` / `private_zapped_spte()` KVM

看 commit：2f4147ad0ea5bf3ade46cd96bbe79f84ea8de15a，主要是为了优化 TLB shootdown？

从以下两个函数中可以看出来：

- 一个 zapped 的 SPTE，事先一定是已经 `SHADOW_NONPRESENT_VALUE` 的；毕竟 comment 里写了 Masks that used to track metadata for **not-present** SPTEs.
- 一个 zapped 的 SPTE，是还保存着 PFN 的映射值的，只不过是 zap bit 置 1 了。
- 必须要是 private 的才可以。

```c
static u64 __private_zapped_spte(u64 old_spte)
{
	return SHADOW_NONPRESENT_VALUE | SPTE_PRIVATE_ZAPPED |
		(spte_to_pfn(old_spte) << PAGE_SHIFT) |
		(is_large_pte(old_spte) ? PT_PAGE_SIZE_MASK : 0);
}

static u64 private_zapped_spte(struct kvm *kvm, const struct tdp_iter *iter)
{
	if (!kvm_gfn_shared_mask(kvm))
		return SHADOW_NONPRESENT_VALUE;

	if (!is_private_sptep(iter->sptep))
		return SHADOW_NONPRESENT_VALUE;

	return __private_zapped_spte(iter->old_spte);
}

static inline bool is_private_zapped_spte(u64 spte)
{
	return !!(spte & SPTE_PRIVATE_ZAPPED);
}
```

- 当一个 SPTE 变成 zapped 时或者
- 进一步清空以 zapped SPTE 到 not present 同时也是 not zapped 时

都会执行这个 SEAMCALL：`TDH.MEM.PAGE.REMOVE`。

当然，也是可以一步直接从 normal zap 到清空的，比如 `ZAP_PRIVATE_REMOVE`。

那么为什么要留着 PFN 的值呢？

中间的 PSE 可以是 zapped 状态吗？

为什么要引入 zapped 这个中间状态？它和 removed SPTE 有什么关系？