---
categories: KVM
title: KVM Shadow Page Table Walking
---

看起来 Direct Page Fault 和 Shadow MMU 都使用了这一套框架。

### `struct kvm_shadow_walk_iterator`

```c
struct kvm_shadow_walk_iterator {
    // GVA CR2（normal 情况） 或者是 GPA（EPT）
    // 很容易理解，普通的情况，shadow PT 需要完成 GVA->HPA 的转换，所以应该是 GVA
    // EPT 下，shadow PT 需要完成 GPA->HPA 的转换，所以应该是 GPA
	u64 addr;
    // 表示当前 PTE 所映射到的 HPA
	hpa_t shadow_addr;
    // 指向 PTE
	u64 *sptep;
    // 当前 PTE 所在的 level
	int level;
    // 这个 entry 是所在 page 的 512 entries 里的第几个
	unsigned index;
};
```

### `shadow_walk_next()` / `__shadow_walk_next()` / KVM

```c
static void __shadow_walk_next(struct kvm_shadow_walk_iterator *iterator, u64 spte)
{
    // Not present: 4K page 里 512 entries 里的这一个 entry 是 0，表示压根就没有这个 entry，查找失败
    // 如果存在，但是是最后一级 spte
	if (!is_shadow_present_pte(spte) || is_last_spte(spte, iterator->level)) {
		iterator->level = 0;
		return;
	}

    // 如果都不是，按 DFS 找到下一个 level，根据 SPTE 的内容找到下一个 PSE 的 HPA 来继续查找
	iterator->shadow_addr = spte & SPTE_BASE_ADDR_MASK;
	--iterator->level;
}
```

### `shadow_walk_okay()` / KVM

```c
static bool shadow_walk_okay(struct kvm_shadow_walk_iterator *iterator)
{
    // 这种情况那就只能是 PG_LEVEL_NONE 了
    // 在 next() 函数里会置为 iterator->level = 0;
    // 这样的话就应该退出了
	if (iterator->level < PG_LEVEL_4K)
		return false;

	iterator->index = SPTE_INDEX(iterator->addr, iterator->level);
    // 继续下一步：根据这个 PSE 所映射到的下一级的 HPA (shadow_addr) 找到 HVA，
    // 这个值指向了 4K 大小的一个 page，包含了 512 个 entries，所以还需要加上
    // iterator->index 来定位到对应的 entry（PSE）。
	iterator->sptep	= ((u64 *)__va(iterator->shadow_addr)) + iterator->index;
    // 我们还没有结束，继续找！
	return true;
}
```

### `shadow_walk_init_using_root()` / `shadow_walk_init()` / KVM

```c
static void shadow_walk_init_using_root(struct kvm_shadow_walk_iterator *iterator,
					struct kvm_vcpu *vcpu, hpa_t root,
					u64 addr)
{
	iterator->addr = addr; // GPA?
	iterator->shadow_addr = root; // SPT 树的 root page 所在的 HPA
    // 初始化为 SPT root page 的 level，表示是根节点。
	iterator->level = vcpu->arch.mmu->root_role.level;

    // 下面一直在捣鼓的是 iterator->level 应该是什么
    // 有一些 corner cases，暂时先不管了。
}
```

### `for_each_shadow_entry()` KVM

从 root PT 当中遍历直到找到映射 `_addr` 的 PTE，返回每一级的 PSE。

```c
#define for_each_shadow_entry(_vcpu, _addr, _walker)            \
	for (shadow_walk_init(&(_walker), _vcpu, _addr);	\
	     shadow_walk_okay(&(_walker));			\
	     shadow_walk_next(&(_walker)))
```