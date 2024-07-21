---
categories: KVM
title: Access Tracking & Dirty Logging in KVM
---

不一定有 EPT 的平台都支持 EPT A/D bits，但是所有 Host page table（影子页表的情况） 都有 A/D bits，因为有 VMX 支持的平台肯定 host page 早就支持 A/D bits 了。

### Overview of Access tracking in KVM / EPT entry RWX bits / EPT non-present entry

分三种情况：

- 使用 EPT：
    - EPT 支持 A/D bits：仅仅清理掉 A bit 的数据就行，不需要 access tracking 因为硬件已经做了。
    - EPT 不支持 A/D bits：把 SPTE 里面的 RWX bits 设置为 0，从而能够 intercept，这其实就相当于把这个页置为了 non-present 的，因为 EPT PTE 的 format 里并没有一个 Present bit，请看下面的详细说明。
- 使用影子页表：仅仅清理掉 A bit 数据就行了，因为影子页表都是支持 A/D bits，access tracking 硬件已经做了。

对于置 RWX bits 为 0 就相当于置为 non-present 的说明：From SDM Table 28-7. Exit Qualification for EPT Violations:

- Bit 3: The logical-AND of bit 0 in the EPT paging-structure entries used to translate the guest-physical address of the access causing the EPT violation (indicates whether the guest-physical address was readable).
- Bit 4: The logical-AND of bit 1 in the EPT paging-structure entries used to translate the guest-physical address of the access causing the EPT violation (indicates whether the guest-physical address was writeable).
- Bit 5: The logical-AND of bit 2 in the EPT paging-structure entries used to translate the guest-physical address of the access causing the EPT violation.

```c
handle_ept_violation
    // 通过 translate 这个 GPA 的所有 entries 计算出来的与过之后的 readable, writable 和 executable 的 bits 都是 0，
    // 那么就是 non-present，但凡有一个不是 0，都表示这个页是 present 的。
	error_code |= (exit_qualification & EPT_VIOLATION_RWX_MASK) ? PFERR_PRESENT_MASK : 0;
```

### `mark_spte_for_access_track()` KVM

```c
u64 mark_spte_for_access_track(u64 spte)
{
    // 我们有 A/D bits 的硬件支持，所以我们清空 A bit 就好了。
    // 硬件是自动进行 access track 的，所以不需要为了 intercept 而改 SPTE。
    // 影子页表会走这个 path。因为影子页表一定是 enable 了 A/D feature 的。
    // EPT with ad bits support 也会走这个 path。
	if (spte_ad_enabled(spte))
		return spte & ~shadow_accessed_mask;
    // 下面的 code 只有在 EPT 没有 ad bits support 才会走到。

    // 已经 enable 了 access tracking，因为 RWX 已经是 0 了，直接返回就好。
	if (is_access_track_spte(spte))
		return spte;

    //...
    // 把 RWX 的值移到 reserved 区
	spte |= (spte & SHADOW_ACC_TRACK_SAVED_BITS_MASK) << SHADOW_ACC_TRACK_SAVED_BITS_SHIFT;
    // 清空 RWX，这样就 enable track 了
	spte &= ~shadow_acc_track_mask;

	return spte;
}
```

## Writable SPTE / MMU-writable SPTE / Host-writable SPTE / `shadow_host_writable_mask` / `shadow_mmu_writable_mask` / `PT_WRITABLE_MASK` KVM

这个 commit 移除了一些 comments，也可以参考一下。

[[PATCH 5/5] KVM: x86/mmu: Consolidate comments about {Host,MMU}-writable - David Matlack](https://lore.kernel.org/all/20220125230723.1701061-1-dmatlack@google.com/)

```c
static inline void check_spte_writable_invariants(u64 spte)
{
	if (spte & shadow_mmu_writable_mask)
		WARN_ONCE(!(spte & shadow_host_writable_mask), KBUILD_MODNAME ": MMU-writable SPTE is not Host-writable: %llx", spte);
	else
		WARN_ONCE(is_writable_pte(spte), KBUILD_MODNAME ": Writable SPTE is not MMU-writable: %llx", spte);
}
```

- 当一个 `spte & shadow_host_writable_mask` 时，那么它就是 host-writable 的，这个是软件定义的，用了 PTE 里面的 reserved bit。
- 当一个 `spte & shadow_mmu_writable_mask` 时，那么它就是 MMU-writable 的，这个也是软件定义的，用了 PTE 里面的 reserved bit。这个表示这个 SPTE **应当是** MMU-writable 的。
- 当一个 `spte & PT_WRITABLE_MASK` 时，那么它就是 Writable 的。这是硬件定义的，bit 1。当这个 bit 被置上时，表示**实际上**这个 SPTE 对应的页是 writable 的。

更多的解释请看这段注释：一个 SPTE 所映射的页不可写的可能有四个原因：

1. Intercept write for that page so that we can do **dirty page logging**. （因为我们本来也**没想不让人家写**，所以最后的处理可以把它转成 writable 的）。
2. Intercept write for 客户机的页表。看来这个 **SPTE 映射的页是一个客户机的页表页**（所以所有这种 SPTE 都是不可写的吗？）（Not MMU-writable，我们本来也不是想防止 guest 写人家自己的页表，所以最后的处理是转成 writable 的）。
3. 防止 guest 写只读的内存，这个没什么好说的，guest 不应该写，所以最后也不会转为 writable 的。（Not Host-writable）。
4. 如果一个 SPTE 不支持 A/D bits，模拟 accessed bit，当这个 SPTE 对应的页被访问过时，这个 bit 会被置 1。（读保护从而能够把**读/写**的请求全部截取下来，这样才能模拟 access bit/dirty bit，当然这种情况也表示我们本来**并没有想让人家不可写**，所以最后的处理也应该是可写的），和第一种是同一个情况，只不过一个有 A/D bit 一个没有。

如上所述，我们可以把 1 和 4 归为一类，因为处理它们只需要把它们变成 writable 就行了，也不用获取 MMU Lock，因为我们只需要获取 A/D 信息。

- `shadow_mmu_writable_mask`, aka **MMU-writable** - Cleared on SPTEs that KVM is currently write-protecting for shadow paging purposes (**case 2 above**)；
- `shadow_host_writable_mask`, aka **Host-writable** - Cleared on SPTEs that are not host-writable (**case 3 above**)；
- `PT_WRITABLE_MASK`：因为这个 mask 本来就是直接和硬件相关的，所以如果这个 mask 被置上了就表示这个 SPTE 所指向的页是 writable 的。

我们可以这样理解这两个名词：

- **Host-writable**：表示我们本来想让这个页是不可写的，还是我们就是想截获下来 track 一下，截获完之后还是会改为可写的，或者干脆本来就是可写的；
- **MMU-writable**：表示 unblock 的时候是否需要 take MMU lock，case 1 只是 dirty logging for live migartion，可以走 fast page fault 的 path，所以不需要 take，因而就是 MMU-writable 的。

|          | shadow_host_writable_mask | shadow_mmu_writable_mask | PT_WRITABLE_MASK |
| -------- | ------------------------- | ------------------------ | ---------------- |
| Writable | 1                         | 1                        | 1                |
| Case 1   | 1                         | 1                        | 0                |
| Case 2   | 1                         | 0                        | 0                |
| Case 3   | 0                         | 0                        | 0                |

从上面的表格中我们可以发现以下规律：**一个 Writable SPTE 必须是 MMU-writable 的，一个 MMU-writable 的必须是 Host-writable 的。这就导致了本来 combination 有 8 种，但是其实只有表格中的 4 种是 valid 的。** 下面我来分别分析一下这几种 case：

- **Case 1**：就是为了 write block 从而 enable dirty logging 比如说为了 live migration。它既应该是 MMU-writable 的，也就是 block 它的原因不是为了 block guest 对于页表的写，也应该是 Host-writable 的，也就是我们并不是本来就想把它设置为只读的。但是我们的确想 dirty logging，所以我们需要把 `PT_WRTIABLE_MASK` 置为 0，也就有了上面的组合；
- **Case 2**：Intercept 客户机对于页表的写。那么肯定就不是 MMU-writable 的，所以这点是 0，但是的确我们 write block 它并不是真的不让它写，而是只是希望 track 而已，所以应该还是 Host-writable 的，所以就有了上面的组合。
- **Case 3**：把页设置为只读的。本来就不想让它是可写的，所以 Host-writable 是 0，同时

你可能会问为什么没有 Case 4，Case 4 其实和 Case 1 是同一种情况。

The **Host-writable** bit is not modified on present SPTEs, it is only set or cleared when an SPTE is first faulted in from non-present and then remains immutable. 结合上面分析是可以理解的，一个页我们只是 intercept 它还是真的想让它变得不可写，是在刚开始就被决定的。

可以看下面的表格 in `arch/x86/kvm/mmu/spte.h`：

```c
/*
 * A shadow-present leaf SPTE may be non-writable for 4 possible reasons:
 *
 *  1. To intercept writes for dirty logging. KVM write-protects huge pages
 *     so that they can be split down into the dirty logging
 *     granularity (4KiB) whenever the guest writes to them. KVM also
 *     write-protects 4KiB pages so that writes can be recorded in the dirty log
 *     (e.g. if not using PML). SPTEs are write-protected for dirty logging
 *     during the VM-iotcls that enable dirty logging.
 *
 *  2. To intercept writes to guest page tables that KVM is shadowing. When a
 *     guest writes to its page table the corresponding shadow page table will
 *     be marked "unsync". That way KVM knows which shadow page tables need to
 *     be updated on the next TLB flush, INVLPG, etc. and which do not.
 *
 *  3. To prevent guest writes to read-only memory, such as for memory in a
 *     read-only memslot or guest memory backed by a read-only VMA. Writes to
 *     such pages are disallowed entirely.
 *
 *  4. To emulate the Accessed bit for SPTEs without A/D bits.  Note, in this
 *     case, the SPTE is access-protected, not just write-protected!
 *
 * For cases #1 and #4, KVM can safely make such SPTEs writable without taking
 * mmu_lock as capturing the Accessed/Dirty state doesn't require taking it.
 * To differentiate #1 and #4 from #2 and #3, KVM uses two software-only bits
 * in the SPTE:
 *
 *  shadow_mmu_writable_mask, aka MMU-writable -
 *    Cleared on SPTEs that KVM is currently write-protecting for shadow paging
 *    purposes (case 2 above).
 *
 *  shadow_host_writable_mask, aka Host-writable -
 *    Cleared on SPTEs that are not host-writable (case 3 above)
 *
 * Note, not all possible combinations of PT_WRITABLE_MASK,
 * shadow_mmu_writable_mask, and shadow_host_writable_mask are valid. A given
 * SPTE can be in only one of the following states, which map to the
 * aforementioned 3 cases:
 *
 *   shadow_host_writable_mask | shadow_mmu_writable_mask | PT_WRITABLE_MASK
 *   ------------------------- | ------------------------ | ----------------
 *   1                         | 1                        | 1       (writable)
 *   1                         | 1                        | 0       (case 1)
 *   1                         | 0                        | 0       (case 2)
 *   0                         | 0                        | 0       (case 3)
 *
 * The valid combinations of these bits are checked by
 * check_spte_writable_invariants() whenever an SPTE is modified.
 *
 * Clearing the MMU-writable bit is always done under the MMU lock and always
 * accompanied by a TLB flush before dropping the lock to avoid corrupting the
 * shadow page tables between vCPUs. Write-protecting an SPTE for dirty logging
 * (which does not clear the MMU-writable bit), does not flush TLBs before
 * dropping the lock, as it only needs to synchronize guest writes with the
 * dirty bitmap. Similarly, making the SPTE inaccessible (and non-writable) for
 * access-tracking via the clear_young() MMU notifier also does not flush TLBs.
 *
 * So, there is the problem: clearing the MMU-writable bit can encounter a
 * write-protected SPTE while CPUs still have writable mappings for that SPTE
 * cached in their TLB. To address this, KVM always flushes TLBs when
 * write-protecting SPTEs if the MMU-writable bit is set on the old SPTE.
 *
 * The Host-writable bit is not modified on present SPTEs, it is only set or
 * cleared when an SPTE is first faulted in from non-present and then remains
 * immutable.
 */
```

有一个问题，对应这四种情况，memslot 应该是 read-only 的吗？

## How does KVM emulate Accessed/Dirty (A/D) bit in guest's PTE?

*4.8 ACCESSED AND DIRTY FLAGS*:

我们先讨论 host page table 的 A/D bit，先不讨论 EPT 里面的 A/D bit：

- A/D bit 的置上是硬件自动完成的，当对一个 page 有读或者写请求的时候，硬件会自动对其进行更新。
- A/D bit 的 clear 是 Guest kernel 完成的，当其想 evict page 时，发现如果 A 是 1，那么就置为 0；当 A 是 0，就 evict。D bit 的 clear 应该是 VMM 完成的。

**当 Guest 访问一个页时，EPT 的 A/D bits 会被硬件置上，Guest page table 的 A/D bits 会被硬件置上吗？**

答案是 **Yes**：The A/D bits are set in the guest via the MMU, **just as they would be without virtualization.** The MMU is still being used to do GVA -> GPA translation and will set the appropriate dirty/access bits in the guest page table data structures.

[virtualization - setting of intel EPT Accessed and dirty FLags for guest page tables - Stack Overflow](https://stackoverflow.com/questions/32093036/setting-of-intel-ept-accessed-and-dirty-flags-for-guest-page-tables/32094407#32094407)

**EPT did not have A/D bits before Haswell**. For EPT (TDP) case, it needn't to be emulated, because **hardware has supported** it. See SDM Table 28-6. Format of an EPT Page-Table Entry that Maps a 4-KByte Page. Bit 8 and Bit 9.

A/D bits in EPT are just for VMM use not guest OS so it means VMM can use these bits for its own purpose. same way an **OS** would use them for a **process** although it is used less often as memory is not as much of a constraint but the VMM could swap out physical pages of a guest if it wanted or needed to just think of it this way, **the EPT is to the VMM and guest the same was as the traditional page tables are to the OS and process**.

**EPT 页表里的 A/D 可以代替 Guest 的页表吗？**

不能，一个是为了让 VMM 用的，一个是为了让 Guest 用的。

- [virtualization - setting of intel EPT Accessed and dirty FLags for guest page tables - Stack Overflow](https://stackoverflow.com/questions/32093036/setting-of-intel-ept-accessed-and-dirty-flags-for-guest-page-tables)
- More chats…: [Discussion between missimer and shami \| chat.stackoverflow.com](https://chat.stackoverflow.com/rooms/87380/discussion-between-missimer-and-shami)

当然 EPT 也不一定都是支持 A/D bits 的，EPT did not have A/D bits before Haswell。即使不支持，guest page table 的 A/D bits 仍然会被 set 上，正如我们所说，EPT 里的这两个 bits 主要是为了让 VMM 来用的。

For SPT case（Guest 切 CR3 的时候其实 load 的不是它自己的 page table，而是 VMM 为其准备的影子 page table）, 当 Guest 在跑的时候，因为是影子页表在运行，所以硬件对于 A/D bits 的修改也会作用于影子页表上，Guest 在读它自己的页表的时候，怎么保证 A/D 是准确的？

答案是：对于 Guest 里的每一个 page，在 SPT 上是**不可读的**，guest 读了一个 page 之后就会 trap，从而 VMM 会把 entry 改为可读，并设置 guest page table 里的 A bit，这就模拟了 **guest 读一个页会导致其 page table entry 的 access bit 被硬件自动置上的情况。** 在 guest clear A bit 的时候，trap 出来再次把这个 page 设置成不可读的状态，这样才能进行下次 access track。

至于怎么让它不可读，我觉得可以直接清空影子页表里 PTE 的 PRESENT bit，这样 guest 一读肯定就会 trap 出来。但是 VMM 看到这个 PTE 里的**某一个 bit 置上**了，表示这个并不是真的 NON PRESENT page，从而换回真正的 PTE，并将指向这一 page 的 gPTE 上的 A bit 置为 1。这部分逻辑在 KVM 里对应，请看函数 `mark_spte_for_access_track()`。

同样，对于 Dirty bit，在 SPT 上设置为不可写的，guest 写了一个 page 后就会 trap，从而 VMM 会把这个 PTE 改为可写的，并设置 guest page table 里的 D bit，这就模拟了**guest 写一个页会导致其 page table entry 的 dirty bit 被硬件自动置上的情况**。在 guest clear D bit 的时候，trap 出来再次把这个 page 设置为不可写的状态。这样才能进行下次 dirty logging。

# Masks/Bits In KVM for Access Tracking & Dirty Logging

和 access tracking 以及 dirty logging 有关的 bits/masks 可以从下面两个维度进行分类：

- Hardware 还是 Software 定义的 bit，比如有的 bit 就是 EPT 或者 Host 页表里定义的，这是硬件定义的。
- A/D bit 还是 R/W/X bit，这些 bit 都和我们要讨论的有关系。A/D bit 用来告诉 software 一个页被 accessed/dirty 了还是没有，R/W/X bit 用来控制 intercept guest 对于一个页的读和写。

这其中大部分都是定义在文件 `arch/x86/kvm/mmu/spte.h` 中的，有时间可以多研究一下这个文件。

### `PT_ACCESSED_MASK` / `PT_DIRTY_MASK` / `PT_ACCESSED_SHIFT` / `PT_DIRTY_SHIFT` KVM

分类：硬件/A/D。

虽然前缀是 PT，但是其实是定义在文件 `arch/x86/kvm/mmu.h` 中：

```c
#define PT_ACCESSED_SHIFT 5
#define PT_ACCESSED_MASK (1ULL << PT_ACCESSED_SHIFT)
#define PT_DIRTY_SHIFT 6
#define PT_DIRTY_MASK (1ULL << PT_DIRTY_SHIFT)
```

这是 host 页表的 format 里的 A/D bit 的位置，分别表示是否 accessed 以及是否 dirty。

### `VMX_EPT_ACCESS_BIT` / `VMX_EPT_DIRTY_BIT` KVM

分类：硬件/A/D。

SDM Table 29-7. Format of an EPT Page-Table Entry that Maps a 4-KByte Page 里定义的，关于 EPT 页表格式的 bit 8 和 bit 9，分别代表 whether software has accessed the 4-KByte page 和 whether software has written to the 4-KByte page。

```c
#define VMX_EPT_ACCESS_BIT			(1ull << 8)
#define VMX_EPT_DIRTY_BIT			(1ull << 9)
```

### `VMX_EPT_READABLE_MASK` / `VMX_EPT_WRITABLE_MASK` / `VMX_EPT_EXECUTABLE_MASK` KVM

分类：硬件/R/W/X。

```c
#define VMX_EPT_READABLE_MASK			0x1ull
#define VMX_EPT_WRITABLE_MASK			0x2ull
#define VMX_EPT_EXECUTABLE_MASK			0x4ull
```

表示 EPT PTE 里 readable, writable, executable 的位置。

### `shadow_accessed_mask` / `shadow_dirty_mask` KVM

表示 A/D bit 的位置。

```c
vmx_init
    kvm_x86_vendor_init
        kvm_mmu_vendor_module_init
            kvm_mmu_reset_all_pte_masks
                // First set to PT_ACCESSED_MASK
            	shadow_accessed_mask = PT_ACCESSED_MASK;
                shadow_dirty_mask	= PT_DIRTY_MASK;
        r = ops->hardware_setup();
            vmx_hardware_setup
                if (enable_ept)
                    kvm_mmu_set_ept_masks
                        // Second set to VMX_EPT_ACCESS_BIT
                        shadow_accessed_mask = has_ad_bits ? VMX_EPT_ACCESS_BIT : 0ull;
                    	shadow_dirty_mask	= has_ad_bits ? VMX_EPT_DIRTY_BIT : 0ull;
```

从上面的流程中我们可以看出来我们先设置为了 `PT_ACCESSED_MASK`，然后设置为了 `VMX_EPT_ACCESS_BIT` 或 0。也就是 `shadow_accessed_mask` 有三种可能的值：

- `PT_ACCESSED_MASK`：如果我们不打算使用 EPT，这个时候我们要用影子页表，影子页表也是 host 页表的一种，所以这个时候 A/D bit 就是 host 页表的 A/D bit。
- `VMX_EPT_ACCESS_BIT`：如果我们要 enable EPT，那么我们设置为 EPT 硬件定义的 bit。
- `0`：enable EPT 但是没有办法 enable access tracking / dirty logging，因为硬件不支持，详见 `cpu_has_vmx_ept_ad_bits()`，那么置为 0。

介绍完了设置的地方，我们来看使用的地方：

- Clear accessed bit：清除硬件置上的 accessed bit，可能是为了重新 write block 这个页？

### `SPTE_TDP_AD_MASK` / `SPTE_TDP_AD_DISABLED` / `SPTE_TDP_AD_ENABLED` / `SPTE_TDP_AD_WRPROT_ONLY` / KVM

软件定义在 reserved bits 里的用来 indicate 这个 EPT/Host PT 里的 PTE 有没有 enable A/D bits feature。

```c
#define SPTE_TDP_AD_SHIFT		52
#define SPTE_TDP_AD_MASK		(3ULL << SPTE_TDP_AD_SHIFT)
// 不 write protect，因为我们有 A/D bits，不需要 write protect
#define SPTE_TDP_AD_ENABLED		(0ULL << SPTE_TDP_AD_SHIFT)
// 不 write protect，也没有 A/D bits。
#define SPTE_TDP_AD_DISABLED		(1ULL << SPTE_TDP_AD_SHIFT)
// 我们不需要 A/D bits，只需要 write protect。
#define SPTE_TDP_AD_WRPROT_ONLY		(2ULL << SPTE_TDP_AD_SHIFT)
```

如果是 `SPTE_TDP_AD_DISABLED`，那么表示硬件没有能力（主要是 EPT，因为 Host page table 肯定有能力）来帮我们更新 A/D bit。这其实是整体 A/D disable or not 的具象化，整体 A/D disable 落到实处就是每一个 SPTE 都要设置为 disable 的。

因为其实利用 EPT/host page table 的 reserved bit，所以这个是通用的，可以表示一个 EPT SPTE，也可以表示一个 Host page table 的 PTE 里 A/D 到底有没有被 enable。**所以说这个可以用在 EPT enable 的情况下，也可以用在使用影子页表的情况下。**

因为 Host page table 本身就是一定有 A/D bits 支持的，所以肯定值是 `SPTE_TDP_AD_ENABLED`。同时 Host page table PTE 的 reserved bits 一定需要是 0，所以我们必须要把 `SPTE_TDP_AD_ENABLED` 定义成 0 才好。

### `shadow_acc_track_mask` KVM

**这个变量表示当没有 A/D bits support 的时候，如果我们要 access track 一个 SPTE，需要把哪些 bits 置为 0。**

虽然这个 function 是 general call 的，但是其实只有 EPT without A/D bits support 的情况才会使用到这个变量，影子页表里 A/D bits 默认都是有的，所以其实不需要置什么 bit 来 enable access track。

```c
vmx_init
    kvm_x86_vendor_init
        kvm_mmu_vendor_module_init
            kvm_mmu_reset_all_pte_masks
            	shadow_acc_track_mask	= 0;
        r = ops->hardware_setup();
            vmx_hardware_setup
                if (enable_ept)
                    kvm_mmu_set_ept_masks
                    	shadow_acc_track_mask = VMX_EPT_RWX_MASK;
```

如果我们想软件 access track 一个 page，那么我们需要想办法 intercept 它。

上面 code 可以看到其可能取两个值：0 和 `VMX_EPT_RWX_MASK`。你可能会想，一个 mask 怎么可以是 0 呢，其实我们使用的时候是要取反的，所以 0 就表示全部。

当 enable EPT 的时候，无论 EPT 有没有 A/D bits，都置为 RWX 的 mask，这是因为我们可以保证只有在没有 A/D bits 支持的时候这个变量才会用到。

```c
// access track 一个 SPTE
u64 mark_spte_for_access_track(u64 spte)
{
    //...
    // 只有没有 ad support 的时候才会调用到这里。
    // 把 RWX 都置 0，这样就确保能够 intercept 它，从而实现 access track
	spte &= ~shadow_acc_track_mask;
}

// 取消 access track 从而能让一个页变的可读
// 观察这个函数的调用链可以发现，只有当没有 ad bit support 的时候才会调用到这里。
static inline u64 restore_acc_track_spte(u64 spte)
{
	spte &= ~shadow_acc_track_mask;
    // 恢复之前的 RWX，因为 RWX 被我们清了做 access track 用了。
	spte |= saved_bits;
}
```

### `SHADOW_ACC_TRACK_SAVED_BITS_MASK` / `SHADOW_ACC_TRACK_SAVED_BITS_SHIFT` / `SPTE_EPT_READABLE_MASK` / `SPTE_EPT_EXECUTABLE_MASK` / KVM

**这个变量表示我们要把 RWX 置为 0 从而 enable access tracking 时原先 RWX 值 save 的位置。**

只有在 EPT 的并且没有 A/D bit 支持的情况下才有意义。

```c
/* The mask for the R/X bits in EPT PTEs */
#define SPTE_EPT_READABLE_MASK			0x1ull
#define SPTE_EPT_EXECUTABLE_MASK		0x4ull

/*
 * The mask/shift to use for saving the original R/X bits when marking the PTE
 * as not-present for access tracking purposes. We do not save the W bit as the
 * PTEs being access tracked also need to be dirty tracked, so the W bit will be
 * restored only when a write is attempted to the page.  This mask obviously
 * must not overlap the A/D type mask.
 */
#define SHADOW_ACC_TRACK_SAVED_BITS_MASK (SPTE_EPT_READABLE_MASK | SPTE_EPT_EXECUTABLE_MASK)
#define SHADOW_ACC_TRACK_SAVED_BITS_SHIFT 54
#define SHADOW_ACC_TRACK_SAVED_MASK	(SHADOW_ACC_TRACK_SAVED_BITS_MASK << SHADOW_ACC_TRACK_SAVED_BITS_SHIFT)
```

原来 EPT 里 SPTE 的 readable 和 executable 的 bit 是 bit 0 和 bit 2（`VMX_EPT_READABLE_MASK`, `VMX_EPT_EXECUTABLE_MASK`）。现在我们平移到了 54 + 0 和 54 + 2。为啥要这么做呢，这是因为这两个 bit 其实是 reserved 的，当我们想要 access track 一个 page 的时候，我们需要把 RWX 置为 0 这样 guest 访问它才能 page fault 从而 intercept 下来。为了保存置 0 之前的值，我们在 reserved bits 记录下来原来的 R/X 值，这样当 intercept 的时候，我们能够通过这些 bits 恢复其原来的 R/X 值。

See function `mark_spte_for_access_track()` 和 `restore_acc_track_spte()` ，分别对应把 SPTE 置为 non-present 的时候以及 restore 这个 SPTE 的时候。

EPT 可能没有 A/D bits 的支持，但是都有 RWX 的支持。

```c
static inline bool is_access_track_spte(u64 spte)
{
	return !spte_ad_enabled(spte) && (spte & shadow_acc_track_mask) == 0;
}
```

可以看到如果它发现 `shadow_acc_track_mask` 其实也就是 `VMX_EPT_RWX_MASK` 是 0 的是否，也就是不可读，不可写，不可执行的时候，就相当于已经 access track 了。
