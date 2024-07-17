---
categories: KVM
title: Access Tracking & Dirty Logging in KVM
---

## Writable SPTE / MMU-writable SPTE / Host-writable SPTE / `shadow_host_writable_mask` / `shadow_mmu_writable_mask` / `PT_WRITABLE_MASK` KVM

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

### `mark_spte_for_access_track()` KVM

```c
u64 mark_spte_for_access_track(u64 spte)
{
    // 我们有 A/D bits 的硬件支持，所以我们清空 A bit 就好了。
    // 硬件是自动进行 access track 的。
	if (spte_ad_enabled(spte))
		return spte & ~shadow_accessed_mask;

    // 以及是不可读的了，直接返回就好。
	if (is_access_track_spte(spte))
		return spte;

    //...
	spte |= (spte & SHADOW_ACC_TRACK_SAVED_BITS_MASK) << SHADOW_ACC_TRACK_SAVED_BITS_SHIFT;
    // readable, writable, executable bit 都置为 0，这样就 enable track 了
	spte &= ~shadow_acc_track_mask;

	return spte;
}
```

# Masks/Bits In KVM for Access Tracking & Dirty Logging