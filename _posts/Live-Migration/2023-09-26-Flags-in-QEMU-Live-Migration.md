---
categories: Migration
title: Flags in QEMU Live Migration
---
注意，只有后 12 bit (0~11) 可以被用作 flags，否则会和 page address 起冲突。

```c
// RAM_SAVE_FLAG_FULL was obsoleted in 2009, 现在的代码里没有用到这个
#define RAM_SAVE_FLAG_FULL     0x01

// ############### 这些是不独立的，会通过 attach 在其他信息上发送 ##############
// RAM_SAVE_FLAG_ZERO used to be named RAM_SAVE_FLAG_COMPRESS, it
// worked for pages that were filled with the same char. We switched
// it to only search for the zero value.  And to avoid confusion with
// RAM_SAVE_FLAG_COMPRESS_PAGE just rename it.
// 一句话总结，范围变窄了，只表示全 0 而非其他字符，其他字符的用 RAM_SAVE_FLAG_COMPRESS_PAGE 来表示
// attach 在 page 地址上面（offset），并且这是一个 0 页
#define RAM_SAVE_FLAG_ZERO     0x02
// 此 flag 所 attach 的信息表示所有要发送的 RAMBlock 的大小
#define RAM_SAVE_FLAG_MEM_SIZE 0x04
// attach 在 page 地址上面（offset），并且这是一个普通 page 而非 0 页
#define RAM_SAVE_FLAG_PAGE     0x08
// attach 在 page 地址上面（offset），表示这个 page 所属的 RAMBlock 没有变
#define RAM_SAVE_FLAG_CONTINUE 0x20
// attach 在 page 地址上面（offset），一种压缩算法，暂时先不管
#define RAM_SAVE_FLAG_XBZRLE   0x40
/* 0x80 is reserved in qemu-file.h for RAM_SAVE_FLAG_HOOK */
// attach 在 page 地址上面（offset），表示这个 page 是压缩过的
#define RAM_SAVE_FLAG_COMPRESS_PAGE    0x100

// ############### 这两个是独立的，不会通过 attach 在其他信息上发送 ##############
// 此 flag 单独发送，并不 attach 在任何信息上面，表示 section 的结束
#define RAM_SAVE_FLAG_EOS      0x10
// 当没有开启 multifd_flush_after_each_section 时发送，这个默认是不开启的
// 在 src 和 dst 端同时开启这个表示要在每次发送完 section 的时候都同步一下，
// 同步指的是 multifd_send_sync_main, multifd_recv_sync_main
// 如果 src 发现没有开，那么它认为 dst 也没有开，所以需要我们发送这个 flag 过去来让 dst 端执行 multifd_recv_sync_main
#define RAM_SAVE_FLAG_MULTIFD_FLUSH    0x200

/* We can't use any flag that is bigger than 0x200 */
```

### `RAM_SAVE_FLAG_MULTIFD_FLUSH` / `multifd_flush_after_each_section`

我认为这个 flag 涉及到一些逻辑，值得研究一下。

QEMU 当中有 migration capability 可以进行配置，当然，也有伪的 capabilities，这些 capabilities 除了不能被 user 配置之外和普通的 capability 没有什么两样。`multifd_flush_after_each_section` 就是这样的一个 capability。可以看看这个 capability 的介绍。

Flush every channel after each section sent. **This assures that we can't mix pages from one iteration through ram pages with pages for the following iteration.** We really only need to do this flush after we have go through all the dirty pages. For historical reasons, we do that after each section. This is suboptimal (we flush too many times). Default value is false. (since 8.1)

看了上面这段话，首先要考虑的一个问题是：**flush when go through all the dirty pages 和 flush after each section 有什么区别吗**？这个问题先放一放，我们先看一下几个 check 这个 capabilities 的地方：

1. 在 `find_dirty_block` 的时候，当发现这一轮所有的 block 都 go through 了一遍，没有 dirty pages 的时候。如果没有 enable 这个 feature，这表示我们在后面 section 结束的时候不会进行同步，那么我们需要手动地 `multifd_send_sync_main` 并且发送 flag `RAM_SAVE_FLAG_MULTIFD_FLUSH` 过去。（disable 了这个 feature，**这是效率高的做法**）
2. 在第一个 section 和最后一个 section（START, END），src 端**总会**执行 `multifd_send_sync_main`，为了保证 dst 端也要对应执行 `multifd_recv_sync_main`，所以当发现没有 enable 这个 capability 时，需要发送 `RAM_SAVE_FLAG_MULTIFD_FLUSH` 给 dst。
3. 在中间的 section（PART），在每一个 section 结束，src 端发现 enable 了这个 capability 时，会主动 `multifd_send_sync_main`（因为 enable 了，所以 src assert dst 也 enable 了，所以就没有必要发送 `RAM_SAVE_FLAG_MULTIFD_FLUSH` 过去了）。（enable 了这个 feature，**这是效率低的做法**）

可以看出来，1 和 3 是互补的，只不过调用的函数不一样。1 是效率高的做法，2 是原来的效率低的做法。这三条归纳下来的原则就是：**无论 enable 不 enable 这个 capability，都要保证 src 和 dst 在每一个 section 结束的时候至少同步一次，以防止一个 iteration 的 page 跑到了另一个 iteration**。（设想这种情况，iteration 1 的 GPA x 被某 thread 发送了但还没有 flush，此时进入到了下一个 iteration 才 flush，那么 dst 会误以为这个 GPA x 是下一个 iteration 的信息而不是这一个 iteration 的，当本 iteration 的 GPA x 被另一个 thread 发过来时，是应该接受还是拒绝呢？怎么区分这两个 thread 发来的哪一个是老的 page 信息，哪一个是新的呢？）。

反过来再回答上面的问题，**flush when go through all the dirty pages 和 flush after each section 有什么区别吗**？每一个 section 不就是 go through 了所有的 dirty pages 才结束的吗？

不一定，目前看 code 的结果是发现了以下不一样的地方，欢迎后面补充：

- 一个 section 并不一定 go through all dirty blocks 之后才结束，可能因为 rate limiting 提前就结束了。

original patch set: [[PATCH v9 0/3] Eliminate multifd flush - Juan Quintela](https://lore.kernel.org/all/20230426181901.13574-1-quintela@redhat.com/)

# Multi-fd Flags

```c
// 用来 multifd_send_sync_main 的 flag
#define MULTIFD_FLAG_SYNC (1 << 0)

// We reserve 3 bits for compression methods
// 0 bit 置上表示没有压缩，1 bit 置上表示 ZLIB 压缩，2 bit 置上表示 ZSTD 压W缩
#define MULTIFD_FLAG_COMPRESSION_MASK (7 << 1)
#define MULTIFD_FLAG_NOCOMP (0 << 1)
#define MULTIFD_FLAG_ZLIB (1 << 1)
#define MULTIFD_FLAG_ZSTD (2 << 1)

// FOR CGS
#define MULTIFD_FLAG_PRIVATE (4 << 1)
```

这些 flag 都是直接置到 `MultiFDSendParams->flags` 里的。在 fill packet 的时候，也就是 `multifd_send_fill_packet()` 里面，会：

```c
packet->flags = cpu_to_be32(p->flags);
```

从而在发送 packet 这个结构体的时候也一并把 flag 发送过去。

# TDX Live Migration Flags

```c
// 告诉对端是否要继续接收
// 目前只有在所有 RAM 发送完之后，最后发送 mutable state 的时候才会用到，
// 因为要发送 TD, each VCPU, 以及最后一个 epoch 的 mbmd 信息，是否还有下一个 packet dst 无法知道
// 所以 src 通过这个 flag 来告诉 dst 还有 packet 没发，应该继续接受。
#define TDX_MIG_F_CONTINUE 0x1
```

这些 flags 是会被置到：

```c
TdxMigHdr hdr = {
    .flags = flags,
    .buf_list_num = (uint16_t)num,
};
```

的 flags 中去。