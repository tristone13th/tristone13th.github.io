---
categories: QEMU
title: Bitops in QEMU
---

# `util/bitops.c` QEMU

### `find_next_bit()` QEMU

因为 `addr` 是一个关于 `long` 的数组，`offset` 对应的是某一个 long 里的某一个 bit。`size` 也并非表示有多少个 long，而是一共有多少个 bit，一个 long 里有多少个 bit 可以用 `BITS_PER_LONG` 得出。

`offset` 表示从哪里开始找，到底包不包含 `offset`？（包含，offset 也属于查找的范围，请看 code comment）。

如果返回的是 `size` 值，那表示我们什么都没有找到。

函数里变量的注释：

- `result` 表示从 bitmap 左数，有多少 bit 已经检查过了 + 有多少 bit 不需要检查。
- `size`：表示从右数，还剩余多少个 bit 需要检查。因此 `size` + `result` = 刚开始传进来的 size。
- `offset`：表示所在 long 内的第几个 bit，和第几个 long 没有关系。

算法思路：

1. 先从 offset 开始找到**存在** bit 为 1 的 long（一个 long 包含多个 bit）。
    1. 先四个四个 long 来找，看这四个 long 存不存在 bit 被 set
    2. 如果存在，则从这四个 long 里找第一个 set 的 long
2. 然后再通过此 long 找到第一个被 set 的 bit。

```c
unsigned long find_next_bit(const unsigned long *addr, unsigned long size, unsigned long offset)
{
    // 先找到从 offset 所在的那一个 long
    const unsigned long *p = addr + BIT_WORD(offset);

    // BITS_PER_LONG 只有可能是 1 bit 置上的，其他位都是 0，比如
    //  16 = 2^4: 10000，1 后面跟 4 个 0
    //  32 = 2^5: 100000，1 后面跟 5 个 0
    //  64 = 2^6: 1000000，1 后面跟 6 个 0
    // 那么减一就变成了 1..000000，0 的个数 n 也就是 2^n
    // 那么这个计算相当于减去小头 result = (offset / BITS_PER_LONG) * BITS_PER_LONG
    // **result 表示从 bitmap 左数，有多少 bit 已经检查过了 + 有多少 bit 不需要检查**
    unsigned long result = offset & ~(BITS_PER_LONG-1);
    unsigned long tmp;

    // 可以理解，超出范围直接返回
    if (offset >= size) {
        return size;
    }
    // offset 所在的位置超过 addr 的距离可以分为两个部分
    //  - 大头：n 个 long
    //  - 小头：在此 long 内，m 个 bit
    // 此处相当于先减去小头：n * BITS_PER_LONG 个 bit。
    // **size 表示还剩余多少个 bit 还没有检查。**
    size -= result;
    // 因为 size 已经把前面的大头减去了，所以我们 offset 也可以减去它
    // 此时 size, p, offset 的值同步了
    // **此时的 offset 表示其所在 long 的第几 bit，和第几个 long 没有关系**
    offset %= BITS_PER_LONG;
    // 如果还有小头
    if (offset) {
        tmp = *(p++);
        // 找到这个 long 内 offset 对应的 bit
        // 因为我们是从 offset 往后找到为 1 的 bit
        // 所以我们先将这个 offset 前面的 bits 置零，因为对我们没有用
        // 我们可以看到，offset 处的 bit 并没有被置 0，说明我们
        // 的**查找范围包含了 offset**
        tmp &= (~0UL << offset);
        // 表示这是最后一个 long，同时我们
        // 的 bitmap 还并没有完全使用这个 long，也就是说
        // 我们的 size 并不是 BITS_PER_LONG 的整数倍
        if (size < BITS_PER_LONG) {
            goto found_first;
        }
        // 如果 tmp 所在的 long 有 bit 为 1，直接找就行
        if (tmp) {
            goto found_middle;
        }
        // offset 所在的这个 long 被检查过了，没有 bit 为 1
        // 根据 size 和 result 的定义，做对应的调整。
        size -= BITS_PER_LONG;
        result += BITS_PER_LONG;
    }
    // 如果剩余的没检查的 bit 数量还有很多，至少 4 * BITS_PER_LONG 这么多
    // 那么就 4 个 long 4 个 long 检查，这样子更快，一旦发现这四个 long
    // 里面有 bit set，那么就 break，我们就只在这四个 long 里找就行了
    while (size >= 4*BITS_PER_LONG) {
        unsigned long d1, d2, d3;
        tmp = *p;
        d1 = *(p+1);
        d2 = *(p+2);
        d3 = *(p+3);
        if (tmp) {
            goto found_middle;
        }
        if (d1 | d2 | d3) {
            break;
        }
        p += 4;
        result += 4*BITS_PER_LONG;
        size -= 4*BITS_PER_LONG;
    }
    // 找到是 4 个 long 里的哪一个 long
    while (size >= BITS_PER_LONG) {
        if ((tmp = *(p++))) {
            goto found_middle;
        }
        result += BITS_PER_LONG;
        size -= BITS_PER_LONG;
    }
    // 所有的都找过了，没找到，返回吧，就说没找到
    if (!size) {
        return result;
    }
    tmp = *p;

found_first:
    // 把我们 bitmap 没有用到的 long 的后面的部分置 0，因为没有用到，不能干扰我们的查找
    tmp &= (~0UL >> (BITS_PER_LONG - size));
    // tmp == 0 表示找完了，没有 set 的 bit
    if (tmp == 0UL) {
        // 返回我们传进来的 size 的值，表示啥也没找到
        return result + size;
    }
found_middle:
    // ctzl: count trailing zeros in a 64-bit value
    // 如果有 n 个 trailing zero，那么第 n 个 bit 就是 1
    return result + ctzl(tmp);
}
```