---
categories: QEMU
title: CPU Throttling in QEMU
---

# CPU Throttling Utilities and Mechanism `system/cpu-throttle.c`

看起来这个文件只是提供了一些实现 CPU Throttling 的基本的函数，并没有有关 CPU Throttling 的机制在里面。

This is achieved by periodically pausing the VM’s execution for small intervals, thereby reducing the CPU time available to the VM.

主要是两个变量在控制：

```c
static QEMUTimer *throttle_timer;
static unsigned int throttle_percentage;
```

一个是 timer，另一个是 percentage。timer 会根据 percentage 设置 expire 的时间以及 callback 函数，每次 timer expire 之后，这个 callback 函数会被调用，sleep 一段时间，从而达到 throttling 的效果。我们理想的情况是让 CPU 降速，而不是让 CPU 运行一段时间 sleep 一段时间，就像我们开车希望平均 60 迈，而不是一半的时间不动另一半的时间 120 迈，所以这就是 **CPU 单位时间** 来控制，CPU 单位时间表示每次轮到 CPU 运行的时间，这个时间越小我们的控制就越精细，throttling 就会越平稳，但是这样的后果是会频繁 sleep 进行上下文的切换，影响性能，所以需要在 throttling 效果以及性能之间进行取舍。

一个 CPU 有没有 enable throttle 通过 `throttle_percentage` 是否是 0 来判断：

```c
// 如果要 stop，那么我们将其设置为 0
void cpu_throttle_stop(void)
{
    qatomic_set(&throttle_percentage, 0);
}

// 判断 throttle 是否 active，通过是否是 0 来判断。
bool cpu_throttle_active(void)
{
    return (cpu_throttle_get_percentage() != 0);
}
```

当我们 init 了 `throttle_timer` 并且同时将 `throttle_percentage` 置为了一个非 0 值之后，我们才算 enable 了这个 feature。但是 `throttle_timer` 在 QEMU 启动的时候就直接 init 了，所以还是看 percentage 是多来来决定是否 enable 了这个 feature。

### `throttle_timer` QEMU

```c
void cpu_throttle_init(void)
{
    // 当 timer expire 的时候，函数 cpu_throttle_timer_tick^ 会被调用，这个函数
    // 会 throttle vCPU 一段时间，然后更新这个 timer 
    throttle_timer = timer_new_ns(QEMU_CLOCK_VIRTUAL_RT, cpu_throttle_timer_tick, NULL);
}
```

### `cpu_throttle_set()` QEMU

设置一个新的 percentage。

```c
void cpu_throttle_set(int new_throttle_pct)
{
    bool throttle_active = cpu_throttle_active();

    /* Ensure throttle percentage is within valid range */
    new_throttle_pct = MIN(new_throttle_pct, CPU_THROTTLE_PCT_MAX);
    new_throttle_pct = MAX(new_throttle_pct, CPU_THROTTLE_PCT_MIN);

    // 将 throttle_percentage 置为新值。
    qatomic_set(&throttle_percentage, new_throttle_pct);

    // 如果之前没有 enable throttle，那么我们 timer tick 一下
    if (!throttle_active)
        cpu_throttle_timer_tick(NULL);
}
```

### `cpu_throttle_timer_tick()` QEMU

```c
cpu_throttle_set
    cpu_throttle_timer_tick
static void cpu_throttle_timer_tick(void *opaque)
{
    CPUState *cpu;
    double pct;

    // percentage 是 0，那么 stop the timer if needed
    if (!cpu_throttle_get_percentage())
        return;

    CPU_FOREACH(cpu) {
        // 将 throttle_thread_scheduled 置为 1，如果之前是 0
        // 那么启动一个 cpu_throttle_thread 线程
        if (!qatomic_xchg(&cpu->throttle_thread_scheduled, 1)) {
            async_run_on_cpu(cpu, cpu_throttle_thread, RUN_ON_CPU_NULL);
        }
    }

    pct = (double)cpu_throttle_get_percentage() / 100;
    // 下次触发 thottle 的时间应该是 CPU 时间用完
    // CPU 单位时间我们定义的是 CPU_THROTTLE_TIMESLICE_NS，因为在 sleep time QEMU_CLOCK_VIRTUAL_RT
    // 不会被更新，所以我们需要增加一个 CPU 时间 + 一个 Throttle 时间也就是一个周期的时间才行，
    // 这个时间通过公式 CPU_THROTTLE_TIMESLICE_NS / (1 - pct) 计算得出。
    timer_mod(throttle_timer, qemu_clock_get_ns(QEMU_CLOCK_VIRTUAL_RT) + CPU_THROTTLE_TIMESLICE_NS / (1 - pct));
}
```

```c
struct CPUState {
    //...
    // Used to keep track of an outstanding cpu throttle thread for migration autoconverge
    // 表示是否已经有一个 throttle thread scheduled 在跑
    // 在 throttle thread 线程结束的时候，会将其设置回 0。
    bool throttle_thread_scheduled;

    // Sleep throttle_us_per_full microseconds once dirty ring is full if dirty page rate limit is enabled.
    int64_t throttle_us_per_full;
}
```

### `cpu_throttle_thread()` QEMU

这应该不是一个新线程，只能说这是一个任务，这个任务用来根据我们设置的 throttle 百分比来 sleep 从而抢占目标 vCPU 的运行时间。

```c
static void cpu_throttle_thread(CPUState *cpu, run_on_cpu_data opaque)
{
    double pct;
    double throttle_ratio;
    int64_t sleeptime_ns, endtime_ns;

    // 如果 percentage 是 0，那么我们不需要抢占，所以直接返回。
    if (!cpu_throttle_get_percentage())
        return;

    pct = (double)cpu_throttle_get_percentage() / 100;

    // ratio 就是 throttle 的时间 / 不 throttle 的时间
    throttle_ratio = pct / (1 - pct);
    // Add 1ns to fix double's rounding error (like 0.9999999...)
    // throttle_ratio 表示 throttle 时间应该是 CPU 时间的多少倍，
    // 而 CPU 一单位的运行时间应该是固定的，也就是 CPU_THROTTLE_TIMESLICE_NS 是 10ms，
    // 这个值设置成多少对于比例来说没有关系。
    sleeptime_ns = (int64_t)(throttle_ratio * CPU_THROTTLE_TIMESLICE_NS + 1);
    // 睡到这个时候醒
    endtime_ns = qemu_clock_get_ns(QEMU_CLOCK_REALTIME) + sleeptime_ns;
    // cpu->stop 的情况下就不用 throttle 了，因为本身已经 stop，不用再降速了
    while (sleeptime_ns > 0 && !cpu->stop) {
        // 如果要睡的时间超过了一毫秒
        // 要 sleep 的时间太长，这段时间可能有别的线程要 kick 我们的 CPU，我们
        // 不能让别的线程也阻塞，所以我们就 cond_wait 就行了。
        if (sleeptime_ns > SCALE_MS) {
            qemu_cond_timedwait_bql(cpu->halt_cond, sleeptime_ns / SCALE_MS);
        } else {
            // Release the BQL and sleep
            bql_unlock();
            g_usleep(sleeptime_ns / SCALE_US);
            bql_lock();
        }
        sleeptime_ns = endtime_ns - qemu_clock_get_ns(QEMU_CLOCK_REALTIME);
    }
    // 将其设置为 0，表示我们已经 throttle 完了。
    qatomic_set(&cpu->throttle_thread_scheduled, 0);
}
```

# CPU Throttling in Live Migration

Live migration 提供了一个 Throttling 框架，这个框架使用了两个提供 CPU Throttling 的组件之一来实现 throttling：

- `system/cpu-throttle.c` 提供的 CPU Throttling 机制，也就是 auto-converge feature
- dirty limit feature 提供的一种 CPU throttling 机制。

这里只介绍下这个框架，对于这两种组件的实现，请参照对应的 migration capabilities。

```c
migration_bitmap_sync
    // These 2 bitmap sync >1 second
    // 这么做的原因是 it is an indication that the migration is not progressing efficiently.
    // 说明这 1s 多都去发送脏页去了，也就说明在上次 bitmap sync 之后，我们有很多的脏页要发送，
    // 这正好说明了 CPU 产生脏页的速度太快了，所以我们需要 throttle 一下。
    if (end_time > rs->time_last_bitmap_sync + 1000)
        migration_trigger_throttle
```

```c
struct RAMState {
    //...
    // 表示上一次 trigger throttle 的时候，已经 transfered 的 bytes 数量
    uint64_t bytes_xfer_prev;
    // 上一次trigger throttle 的时候到这一次，多的 dirty pages 的数量
    uint64_t num_dirty_pages_period;
    //...
}
```

### `migration_trigger_throttle()` QEMU

```c
static void migration_trigger_throttle(RAMState *rs)
{
    // 表示 trigger 的百分比 threshold，也就是新 dirty 的 bytes 占
    // 已经传输的 bytes 到达百分之多少时候触发 CPU Throttling。
    uint64_t threshold = migrate_throttle_trigger_threshold();
    // 上次 throttle 到这一次 throttle 之间 transfer 了多少 bytes？
    uint64_t bytes_xfer_period = migration_transferred_bytes() - rs->bytes_xfer_prev;
    // 上次 throttle 到这一次 throttle 之间多了多少 dirty 的 bytes 需要传送？
    uint64_t bytes_dirty_period = rs->num_dirty_pages_period * TARGET_PAGE_SIZE;
    uint64_t bytes_dirty_threshold = bytes_xfer_period * threshold / 100;

    /*
     * The following detection logic can be refined later. For now:
     * Check to see if the ratio between dirtied bytes and the approx.
     * amount of bytes that just got transferred since the last time
     * we were in this routine reaches the threshold. If that happens
     * twice, start or increase throttling.
     */
    // 如果出现了两次超过 threshold，那么触发 throttling。
    if ((bytes_dirty_period > bytes_dirty_threshold) && (++rs->dirty_rate_high_cnt >= 2)) {
        rs->dirty_rate_high_cnt = 0;
        // 第一个组件 auto-converge
        if (migrate_auto_converge())
            mig_throttle_guest_down(bytes_dirty_period, bytes_dirty_threshold);
        // 第二个组件 dirty limit
        } else if (migrate_dirty_limit())
            migration_dirty_limit_guest();
    }
}
```

## Parameters for CPU Throttling in Live Migration

### `throttle-trigger-threshold` QEMU

The ratio of `bytes_dirty_period` and `bytes_xfer_period` to trigger throttling. It is expressed as percentage. **The default value is 50**.

# User of CPU Throttling

我们可以看出来 CPU Throttling 机制对外提供了一些 API：

- `cpu_throttle_set()`：设置 CPU throttling 的 percentage；
- `cpu_throttle_stop()`：中止 CPU throttling；
- `cpu_throttle_active()`：判断是否正在工作；
- `cpu_throttle_get_percentage()`：拿到当前的 percentage 是多少。

从 QEMU 源码中我们可以看出来，目前在使用 CPU Throttling 机制的主要还是 live migration 的 auto-converge^ feature。
