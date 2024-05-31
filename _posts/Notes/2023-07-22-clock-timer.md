---
categories: Notes
title: Clocks & Timers
---

### PTP clock (IEEE 1588)

Precision Time Protocol.

是一个局域网内设备时钟同步的协议。

### Generic Time Of Day (GTOD)

[High resolution timers and dynamic ticks design notes — The Linux Kernel documentation](https://docs.kernel.org/timers/highres.html)

### Linux epoch

Linux Epoch 其实就是 1970 年 1 月 1 日 0 点 0 分 0 秒（UTC）的时间点。

### Broken-down POSIX time

Human friendly:

```c
struct tm {
	int tm_sec;
	int tm_min;
	int tm_hour;
	int tm_mday;
	int tm_mon;
	long tm_year;
	/* the number of days since Sunday, in the range 0 to 6 */
	int tm_wday;
	/* the number of days since January 1, in the range 0 to 365 */
	int tm_yday;
};
```

### 表示不同精度时间的数据结构

```c
// 精确到秒
typedef long time_t;

// 精确到微秒
struct timeval { 
    time_t        tv_sec;        /* seconds */ 
    suseconds_t    tv_usec;    /* microseconds */
};

// 精确到纳秒
struct timespec { 
    time_t    tv_sec;            /* seconds */
    long        tv_nsec;        /* nanoseconds */
};
```

### Which hardware can generate a timer interrupt?

Following hardwares can generate timer interrupts:

- PIT (programmable interrupt timer)
- RTC
- APIC. See SDM 10.5.4 APIC Timer.
- HPET

Following hardware WON'T generate timer interrupts:

- TSC (time stamp counter): [linux - Does using TSC as clock source improve timer and scheduling granularity? - Stack Overflow](https://stackoverflow.com/questions/13950264/does-using-tsc-as-clock-source-improve-timer-and-scheduling-granularity), tsc 可以用来提供更加精确的时间计数，但是其本身并不会产生中断。

[https://www.kernel.org/doc/Documentation/virtual/kvm/timekeeping.txt](https://www.kernel.org/doc/Documentation/virtual/kvm/timekeeping.txt)

Timer interrupt CANNOT be a **software interrupt**, because it should break the current code flow.

### How to config the frequency of timer interrupt?

The APIC timer frequency will be the processor’s bus clock or core crystal clock frequency (when TSC/core crystal clock ratio is enumerated in CPUID leaf 0x15) divided by the value specified in the divide configuration register.

### RTC (Real Time Clock)

A type of hardware clock.

RTC 相比于其它 clock 的区别在于，它有自己的电池，在断电后还是可以继续计时。

系统启动时，内核通过硬件 RTC 获得当前时间，在这以后，在大多数情况下，内核通过选定的 **时钟源** 更新实时时间信息（墙上时间），而不再读取 RTC 的时间。

[Linux时间子系统之一：clock source - kk Blog —— 通用基础](https://abcdxyzk.github.io/blog/2017/07/23/kernel-clock-1/)

RTC 的目的基本上是在电脑上显示时间。但是 RTC 也可以提供定期的 timer interrupt：

>The RTC generates an interrupt which is usually routed to IRQ 8. The interrupt can function as a periodic timer.

[https://www.kernel.org/doc/Documentation/virtual/kvm/timekeeping.txt](https://www.kernel.org/doc/Documentation/virtual/kvm/timekeeping.txt)

[rtc2.html](http://www.cs.fsu.edu/~baker/realtime/restricted/notes/rtc2.html)

It runs even if the virtual machine is stopped.

The term *real-time clock* is used to avoid confusion with ordinary [hardware clocks](https://en.wikipedia.org/wiki/Clock_signal) which are only [signals](https://en.wikipedia.org/wiki/Signal_(electrical_engineering)) that govern [digital electronics](https://en.wikipedia.org/wiki/Digital_electronics), such as 晶振 (Electronic oscillator), and do not count time in human units.

Both RTC and 晶振 are **hardware clocks**, there also exist **software clocks**.

[Real time clock vs. clock: What is the difference?](https://www.microcontrollertips.com/whats-the-difference-between-a-clock-and-a-real-time-clock/)

RTCs should not be confused with the system clock, which is a **software clock** maintained by the kernel and used to implement gettimeofday(2) and time(2), as well as setting timestamps on files, and so on. The system clock reports seconds and microseconds since a start point, defined to be the POSIX Epoch^: 1970-01-01 00:00:00 +0000 (UTC).

### HPET

HPET is quite complex, and was originally intended to replace the **PIT / RTC** support of the X86 PC. Some systems designated as legacy free may support only the HPET as a hardware timer device.

The HPET is also **memory-mapped** (like APIC).

### Jiffies

jiffy: 一会，瞬间。

The jiffies are incremented by the **timer interrupt** that tells the scheduler to reschedule. So not in each timer interrupt scheduling will occur!

The jiffy defines the maximum time period for the processes to run without rescheduling. If the process calls `yield()` or `sleep()`, for example, then rescheduling takes place immediately. **Thus the context switch to a next available running process not necessarily occurs at the jiffy boundary.**

[linux - When do jiffies increment? How a process runs in a jiffy? - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/51978/when-do-jiffies-increment-how-a-process-runs-in-a-jiffy)

jiffies 记录了系统启动以来，经过了多少 **tick**。

jiffy 的更新在：

```c
static void tick_periodic(int cpu)
{
		//...
		do_timer(1);
		//...
}

void do_timer(unsigned long ticks)
{
	jiffies_64 += ticks;
	//...
}
```

一个 **tick** 代表多长时间，在内核的 CONFIG_HZ 中定义。比如 CONFIG_HZ=200，则一个 jiffy 对应 5ms 时间。所以内核基于 jiffies 的定时器精度也是 5ms。

[Linux 时间子系统之三：jiffies - ArnoldLu - 博客园](https://www.cnblogs.com/arnoldlu/p/7234443.html)

### Timer Interrupt Service Routine / handler

```c
static irqreturn_t timer_interrupt(int irq, void *dev_id)
{
	global_clock_event->event_handler(global_clock_event);
	return IRQ_HANDLED;
}

void tick_handle_periodic(struct clock_event_device *dev)
{
	int cpu = smp_processor_id();
	ktime_t next = dev->next_event;

	tick_periodic(cpu);

#if defined(CONFIG_HIGH_RES_TIMERS) || defined(CONFIG_NO_HZ_COMMON)
	/*
	 * The cpu might have transitioned to HIGHRES or NOHZ mode via
	 * update_process_times() -> run_local_timers() ->
	 * hrtimer_run_queues().
	 */
	if (dev->event_handler != tick_handle_periodic)
		return;
#endif

	if (!clockevent_state_oneshot(dev))
		return;
	for (;;) {
		/*
		 * Setup the next period for devices, which do not have
		 * periodic mode:
		 */
		next = ktime_add_ns(next, TICK_NSEC);

		if (!clockevents_program_event(dev, next, false))
			return;
		/*
		 * Have to be careful here. If we're in oneshot mode,
		 * before we call tick_periodic() in a loop, we need
		 * to be sure we're using a real hardware clocksource.
		 * Otherwise we could get trapped in an infinite
		 * loop, as the tick_periodic() increments jiffies,
		 * which then will increment time, possibly causing
		 * the loop to trigger again and again.
		 */
		if (timekeeping_valid_for_hres())
			tick_periodic(cpu);
	}
}
```

Each occurrence of a timer interrupt triggers the following major activities:

Usually handled in upper half:

- Updates the time elapsed since system startup.

Usually handled in bottom half:

- Updates the time and date.
- Determines how long the current process has been running on the CPU and preempts it if it has exceeded the time allocated to it. The allocation of time slots (also called quanta) is discussed in Chapter 10.
- Updates resource usage statistics.
- Checks whether the interval of time associated with each software timer (see Section 5.4.4) has elapsed; if so, invokes the proper function.

[The Timer Interrupt Handler - Understanding the Linux Kernel [Book]](https://www.oreilly.com/library/view/understanding-the-linux/0596000022/0596000022_ch05-5-fm2xml.html)

### Tick broadcast

Idle CPUs are typically woken up by their respective local timers when there is work to be done, but what happens if these CPUs enter deep C-states in which these timers stop working? Who will wake up the CPUs in time to handle the work scheduled on them? This is where the "tick broadcast framework" steps in. It assigns a clock device that is not affected by the C-states of the CPUs as the timer responsible for handling the wakeup of all those CPUs that enter deep C-states.

[The tick broadcast framework [LWN.net]](https://lwn.net/Articles/574962/)

tsc 就是一个 cpu 一个，hpet 就是全局的，所有 cpu 都可以读。

### Timer and clock

A timer is a specialized type of clock used for measuring specific time intervals.

## Q&A

### Process schedule in each tick?

### How does CONFIG_HZ be set

By the kconfig and some magics.

## System clock type

这些类别的时间都是通过 `timekeeper` 统计并提供的，并不是有 hardware 能 track 这些。

```c
// CLOCK_REALTIME 是描述真实世界的时钟，REALTIME 应该翻译为真实的时间，而不是实时性。
#define CLOCK_REALTIME            0

// CLOCK_MONOTONIC 是一个禁止人为设定的真实世界的时钟，你没有办法设定它，但是可以通过 NTP 协议进行调整。
#define CLOCK_MONOTONIC            1
```

[Linux时间子系统之：时间的基本概念](http://www.wowotech.net/timer_subsystem/time_concept.html)

### `CLOCK_REALTIME`

也可以叫做 Wall time, Wall clock。

`CLOCK_REALTIME` represents the machine's **best-guess** as to the current wall-clock, time-of-day time. This means that `CLOCK_REALTIME` **can jump forwards and backwards** as the system time-of-day clock is changed, including by NTP.

[linux - Difference between CLOCK_REALTIME and CLOCK_MONOTONIC? - Stack Overflow](https://stackoverflow.com/questions/3523442/difference-between-clock-realtime-and-clock-monotonic)

### `CLOCK_MONOTONIC`

开机时是 0，不像 CLOCK_REALTIME，表示的是从 Linux epoch (1970) 的值。

Absolute elapsed wall-clock time since some arbitrary, fixed point in the past. It isn't affected by changes in the system time-of-day clock.

`CLOCK_MONOTONIC` never experiences discontinuities due to **NTP** time adjustments, but it does change in **frequency** as NTP learns what error exists between the local oscillator and the upstream servers.

>The important aspect of a monotonic time source is NOT the current value, but the guarantee that the time source is strictly linearly increasing, and thus useful for calculating the difference in time between two samplings

[linux - Difference between CLOCK_REALTIME and CLOCK_MONOTONIC? - Stack Overflow](https://stackoverflow.com/questions/3523442/difference-between-clock-realtime-and-clock-monotonic)

### `CLOCK_MONOTONIC_RAW`

开机时是 0，不像 CLOCK_REALTIME，表示的是从 Linux epoch (1970) 的值。

Similar to `CLOCK_MONOTONIC`, but provides access to a raw hardware-based time that is not subject to **NTP adjustments**.

`CLOCK_MONOTONIC_RAW` is simply the local oscillator, not disciplined by NTP. This could be very useful if you want to implement some other time synchronization algorithm against a clock which is not fighting you due to NTP. While ntpd (the reference implementation of NTP protocol and the most widespread NTP daemon) is reputed to be "gentle" with time adjustments, it's more accurate to say it's gentle with the absolute time. It's willing to slew the clock by 500ppm which is pretty dramatic if you're in a position to measure your clock frequency against some other standard.

[linux - What is the difference between CLOCK_MONOTONIC & CLOCK_MONOTONIC_RAW? - Stack Overflow](https://stackoverflow.com/questions/14270300/what-is-the-difference-between-clock-monotonic-clock-monotonic-raw)

### `CLOCK_BOOTTIME`

开机时是 0，不像 CLOCK_REALTIME，表示的是从 Linux epoch (1970) 的值。

与 `CLOCK_MONOTONIC` 类似，但是当 suspend 时，会依然增加。

Motivation: address the drawback of `CLOCK_MONOTONIC`.

>So this patchset introduces CLOCK_BOOTTIME, which is identical to CLOCK_MONOTONIC, but includes any time spent in suspend.

[Introduce CLOCK_BOOTTIME ](https://lwn.net/Articles/420142/)

## NO_HZ (Never Omit HZ, tickless, 动态时钟框架)

在动态时钟正确工作之前，系统需要切换至**动态时钟模式**，而要切换至此模式，需要一些前提条件，最主要的一条就是 **CPU 的时钟事件设备必须要支持单触发模式**。这样，idle 进程决定是否可以停止周期时钟，退出 idle 进程时则需要恢复周期时钟。

几种模式：

- 周期时钟模式（nohz mode, 对应于 device 上的周期触发模式）
- 动态时钟模式（对应于 device 上的单触发模式）：The PIT has three channels which can be programmed to deliver **periodic** or **one-shot** interrupts.

Three ways to reduce Scheduling-Clock Ticks:

- CONFIG_HZ_PERIODIC=y: Never Omit Scheduling-Clock Ticks
- CONFIG_NO_HZ_IDLE=y: Omit Scheduling-Clock Ticks For Idle CPUs (default)
- CONFIG_NO_HZ_FULL=y

[Linux时间子系统之八：动态时钟框架【转】-阿里云开发者社区](https://developer.aliyun.com/article/380472)

### Scheduling-clock interrupts (scheduling-clock ticks, or simply "ticks")

This is actually the **timer interrupt**.

### 动态时钟模式

```c
tick_nohz_switch_to_nohz // 切换至动态时钟模式
    tick_switch_to_oneshot(tick_nohz_handler) // 切换设备至单次触发模式，tick_nohz_handler 是中断事件处理函数
```

### `struct tick_sched`

在 SMP 系统中，内核会为每个 CPU 都定义一个 `tick_sched` 结构，这通过一个 per CPU 全局变量 `tick_cpu_sched` 来实现。

### `struct clock_event_device`

```c
/*
 * Possible states of a clock event device.
 *
 * DETACHED:	Device is not used by clockevents core. Initial state or can be reached from SHUTDOWN.
 * SHUTDOWN:	Device is powered-off. Can be reached from PERIODIC or ONESHOT.
 * PERIODIC:	Device is programmed to generate events periodically. Can be reached from DETACHED or SHUTDOWN.
 * ONESHOT:	Device is programmed to generate event only once. Can be reached from DETACHED or SHUTDOWN.
 * ONESHOT_STOPPED: Device was programmed in ONESHOT mode and is temporarily stopped.
 */
enum clock_event_state {
	CLOCK_EVT_STATE_DETACHED,
	CLOCK_EVT_STATE_SHUTDOWN,
	CLOCK_EVT_STATE_PERIODIC,
	CLOCK_EVT_STATE_ONESHOT,
	CLOCK_EVT_STATE_ONESHOT_STOPPED,
};

struct clock_event_device {
	enum clock_event_state	state_use_accessors; // 表示当前此 device 处于哪一种模式
	//...
} ____cacheline_aligned;
```

# TSC (Time Stamp Counter)

A `per-thread` 64-bit register present on all x86 processors: `MSR_IA32_TSC`.

**AFAIK, TSC may NOT be written. I didn't find any place in the kernel (exclude KVM) the TSC is set.**

[Solved: TSCs per logical processor? Per socket? - Intel Communities](https://community.intel.com/t5/Software-Tuning-Performance/TSCs-per-logical-processor-Per-socket/m-p/1121318)

counts the number of **CPU cycles** since its reset.

VMX provides **conditional** trapping of RDTSC, RDMSR, WRMSR and RDTSCP instructions (See `CPU_BASED_RDTSC_EXITING` in KVM), which is enough for full virtualization of TSC in any manner. In addition, VMX allows passing through the host TSC plus an additional TSC_OFFSET field specified in the VMCS.

Currently, although there is an exit reason `EXIT_REASON_RDTSC` in KVM, it is only used in nested case: [Intercepting RDTSC instruction by causing a VMEXIT](https://lore.kernel.org/all/CAJGDS+FGnDFssYXLfLrog+AJu62rrs6DzAQuESJSDaNNdsYdcw@mail.gmail.com/T/) Currently KVM just passthrough the TSC to the guest.

### TSC Deadline

For `KVM_GET_SUPPORTED_CPUID`, The TSC deadline timer feature (CPUID leaf 1, ecx\[24\]) is always returned as **false**, since the feature depends on `KVM_CREATE_IRQCHIP` for local APIC support. Instead it is reported via:

```c
ioctl(KVM_CHECK_EXTENSION, KVM_CAP_TSC_DEADLINE_TIMER)
```

if that returns true and you use `KVM_CREATE_IRQCHIP`, or if you emulate the feature in userspace, then you can enable the feature for `KVM_SET_CPUID2`.

### Unstable TSC

Once TSC is marked as unstable, it will keep unstable all the boot time, it is not reverseable.

One can set the tsc to unstable manually by appending `tsc=unstable` to kernel cmdline:

**Unstable 表示的是频率的不稳定**。

TSC 不同于 HPET 等时钟，它的频率不是预知的。因此，内核必须在初始化过程中，利用 HPET，PIT 等始终来校准 TSC 的频率。如果两次校准结果偏差较大，则认为 TSC 是不稳定的，则使用其它时钟源。并打印内核日志：Clocksource tsc unstable.

正常来说，TSC 的频率很稳定且不受 CPU 调频的影响（如果 CPU 支持 constant-tsc）。内核不应该侦测到它是 unstable 的。但是，计算机系统中存在一种名为 SMI（System Management Interrupt）的中断，该中断不可被操作系统感知和屏蔽。如果内核校准 TSC 频率的计算过程 quick_ pit_ calibrate () 被 SMI 中断干扰，就会导致计算结果偏差较大（超过 1%），结果是 tsc 基准频率不准确。最后导致机器上的时间戳信息都不准确，可能偏慢或者偏快。

当内核认为 TSC unstable 时，切换到 HPET 等时钟，不会给你的系统带来过大的影响。当然，时钟精度或访问时钟的速度会受到影响。通过实验测试，访问 HPET 的时间开销为访问 TSC 时间开销的 7 倍左右。如果您的系统无法忍受这些，可以尝试以下解决方法： 在内核启动时，加入启动参数：tsc=reliable。

[Clocksource tsc unstable - 苏小北1024 - 博客园](https://www.cnblogs.com/muahao/p/6641264.html)

### Constant TSC / Nonstop TSC / Invariant TSC / invtsc

Constant tsc means the rate of the counter won't vary if the CPU freq changes (Constant doesn't mean invariant), which means that the TSC is incremented at a constant rate across P and T-states. The TSC continues to increment in the HLT state (called Auto Halt or C1/Auto Halt). **TSC doesn't increment in any other sleep state**.

`constant_tsc` 和 `nonstop_tsc` 都是 `/proc/cpuinfo` 里的 flag 信息，是 OS 起的名字。

- `constant_tsc`: Support for the constant TSC feature is determined by checking the CPU family and model numbers. The TSC ticks at constant frequency regardless of changes in core clock speed. Without this, RDTSC does count core clock cycles.
- `nonstop_tsc`: This feature is called the invariant TSC in the Intel SDM manual and is supported on processors with `CPUID.80000007H:EDX[7]`. The TSC keeps ticking even in deep sleep C-states. On all x86 processors, **`nonstop_tsc` implies `constant_tsc`, but `constant_tsc` doesn't necessarily imply `nonstop_tsc`**. No separate CPUID feature bit; on Intel and AMD the same invariant TSC CPUID bit implies both constant_tsc and nonstop_tsc features. See Linux's x86/kernel/cpu/intel.c detection code, and amd.c was similar.

[How to get the CPU cycle count in x86_64 from C++? - Stack Overflow](https://stackoverflow.com/questions/13772567/how-to-get-the-cpu-cycle-count-in-x86-64-from-c/51907627#51907627)

cpuinfo indicates Invariant TSC by putting both `constant_tsc` and `nonstop_tsc`, so **Invariant TSC = Constant TSC + Nonstop TSC**.

The invariant TSC will run at a constant rate in all ACPI P-, C-. and T-states. On processors with invariant TSC support, the OS may use the TSC for **wall clock** timer services (instead of ACPI or HPET timers).

[x86 tsc相关知识 - 蓝色魔兽 - 博客园](https://www.cnblogs.com/kvm-qemu/articles/9937703.html)

[assembly - Can constant non-invariant tsc change frequency across cpu states? - Stack Overflow](https://stackoverflow.com/questions/62492053/can-constant-non-invariant-tsc-change-frequency-across-cpu-states)

**Why invtsc CPUID is un-migratable?**

invtsc 表示 TSC freq 不会变，如果迁移过去之后 tsc frequency 不一样了，那么 invtsc 这个 CPUID flag 不就冲突了吗。

但是如果用户明确指定了 TSC 频率，那么就可以迁移了：

```c
    if (!env->user_tsc_khz) {
        if ((env->features[FEAT_8000_0007_EDX] & CPUID_APM_INVTSC) &&
            invtsc_mig_blocker == NULL) {
            error_setg(&invtsc_mig_blocker,
                       "State blocked by non-migratable CPU device"
                       " (invtsc flag)");
            r = migrate_add_blocker(&invtsc_mig_blocker, &local_err);
            if (r < 0) {
                error_report_err(local_err);
                return r;
            }
        }
    }
```

原因仍如上。

### Reliable TSC (`X86_FEATURE_TSC_RELIABLE`)

Unfortunately **there is no way for hardware to tell whether the TSC is reliable.**

```
The following feature bits are used by Linux to signal various TSC attributes,
but they can only be taken to be meaningful for UP or single node systems.

=========================	=======================================
X86_FEATURE_TSC			The TSC is available in hardware
X86_FEATURE_RDTSCP		The RDTSCP instruction is available
X86_FEATURE_CONSTANT_TSC	The TSC rate is unchanged with P-states
X86_FEATURE_NONSTOP_TSC		The TSC does not stop in C-states
X86_FEATURE_TSC_RELIABLE	TSC sync checks are skipped (VMware)
=========================	=======================================
```

TSC Reliable 的作用就是，不需要做 TSC 的 check 了。比如可以通过加 `tsc=reliable` 命令行参数（当我们知道了硬件已经是 reliable 时）来跳过启动时的 TSC 检查，获取可以节省时间。

我们可以看到内核中几个把 TSC 置为 reliable 的地方：

```c
unsigned long native_calibrate_tsc(void)
    //...
    // 当我们发现我们用的 Atom，因为 Atom 的硬件设计者已经说了，Atom 的 TSC 是 reliable 的
    // 所以我们就置为 reliable。
	if (boot_cpu_data.x86_model == INTEL_FAM6_ATOM_GOLDMONT)
		setup_force_cpu_cap(X86_FEATURE_TSC_RELIABLE);
    //...

static void __init vmware_set_capabilities(void)
    //...
    // VMWare 能够 export reliable TSC 给 guest，所以当
    // 我们发现我们是一个跑在 VMWare 上的 guest 时，mark 为 reliable 的。
	setup_force_cpu_cap(X86_FEATURE_CONSTANT_TSC);
    //...

static void __init ms_hyperv_init_platform(void)
    // 同理，对于 hyper-v 也一样
	setup_force_cpu_cap(X86_FEATURE_CONSTANT_TSC);
    //...

static const struct x86_cpu_id tsc_msr_cpu_ids[] = {
	X86_MATCH_INTEL_FAM6_MODEL(ATOM_SALTWELL_MID,	&freq_desc_pnw),
	X86_MATCH_INTEL_FAM6_MODEL(ATOM_SALTWELL_TABLET,&freq_desc_clv),
	X86_MATCH_INTEL_FAM6_MODEL(ATOM_SILVERMONT,	&freq_desc_byt),
	X86_MATCH_INTEL_FAM6_MODEL(ATOM_SILVERMONT_MID,	&freq_desc_tng),
	X86_MATCH_INTEL_FAM6_MODEL(ATOM_AIRMONT,	&freq_desc_cht),
	X86_MATCH_INTEL_FAM6_MODEL(ATOM_AIRMONT_MID,	&freq_desc_ann),
	X86_MATCH_INTEL_FAM6_MODEL(ATOM_AIRMONT_NP,	&freq_desc_lgm),
	{}
};

// 这个函数通过 MSR 来拿到 CPU 的频率，只有当 cpu_khz_from_cpuid 不行时才可以（这个函数只有 Intel 的 CPU 支持）。
// 可以看到当发现不在这些 CPU 里时（基本上都是 atom），会直接 return，不 mark 为 reliable。
unsigned long cpu_khz_from_msr(void)
    //...
	id = x86_match_cpu(tsc_msr_cpu_ids);
	if (!id)
		return 0;
    setup_force_cpu_cap(X86_FEATURE_TSC_RELIABLE);
    //...
```

总结一下就是，当

- 自己是跑在 VMware 或者 hyper-v 里的 guest 时，或
- 自己是 Intel Atom 的 CPU 时

才会 mark 自己时 reliable 的。

### `IA32_TIME_STAMP_COUNTER` / `IA32_TSC`

These 2 are the same.

Software can modify the value of the time-stamp counter (TSC) of a logical processor by using the WRMSR instruction to write to the `IA32_TIME_STAMP_COUNTER` MSR.

```c
kvm_set_msr_common
    case MSR_IA32_TSC:
        // Written by Userspace (QEMU):
		if (msr_info->host_initiated) {
			kvm_synchronize_tsc(vcpu, data);
        // Written by Guest:
		} else {
			u64 adj = kvm_compute_l1_tsc_offset(vcpu, data) - vcpu->arch.l1_tsc_offset;
			adjust_tsc_offset_guest(vcpu, adj);
			vcpu->arch.ia32_tsc_adjust_msr += adj;
		}
		break;
```

How does qemu write the MSR:

```c
kvm_arch_put_registers
    kvm_put_msrs
        kvm_put_msrs_vm
            kvm_msr_entry_add(cpu, MSR_IA32_TSC, env->tsc);
```

### `IA32_TSC_AUX`

*SDM: 17.17.2 IA32_TSC_AUX Register and RDTSCP Support*

Auxiliary TSC.

主要是给 RDTSCP 用的，OS should write core id into IA32_TSC_AUX which indicates which core's TSC want to be read.

`IA32_TSC_AUX` provides a 32-bit field that is initialized by privileged software with a signature value.

The primary usage of `IA32_TSC_AUX` in conjunction with `IA32_TSC` is to allow software to read the 64-bit time stamp in `IA32_TSC` and signature value in `IA32_TSC_AUX` with the instruction RDTSCP in an atomic operation.

RDTSCP returns the 64-bit time stamp in EDX:EAX and the 32-bit TSC_AUX signature value in ECX.

### RDTSCP

*SDM: 17.17.2 IA32_TSC_AUX Register and RDTSCP Support*

主要解决的是乱序执行导致 RDTSC 结果可能不准。

开销虽然略高，但胜在稳定好用。

如果不想用这个指令，还可以用 memory barrier 技术，或者 CPUID 指令来实现。

### RDTSC

Reads the current value of the processor’s time-stamp counter (a 64-bit MSR).

**here are several flags in cr4 that control the availability of specific instructions in user mode**:

- TSD (bit 2): RDTSC and RDTSCP
- …

[assembly - What instructions can be allowed to execute or prohibited from executing in user mode? - Stack Overflow](https://stackoverflow.com/questions/55507736/what-instructions-can-be-allowed-to-execute-or-prohibited-from-executing-in-user)

The time-stamp counter can also be read with the RDMSR instruction, **when executing at privilege level 0**.

[RDTSC — Read Time-Stamp Counter](https://www.felixcloutier.com/x86/rdtsc)

IA32_TIME_STAMP_COUNTER (10H)

### Why do we need to synchronize tsc of different processors?

>On most older SMP and early multi-core machines, TSC was not synchronized between processors. Thus if an application were to read the TSC on one processor, then was moved by the OS to another processor, then read TSC again, it might appear that "time went backwards". This loss of monotonicity resulted in many obscure application bugs when TSC-sensitive apps were ported from a uniprocessor to an SMP environment; as a result, many applications -- especially in the Windows world -- removed their dependency on TSC and replaced their timestamp needs with OS-specific functions, losing both performance and precision. On some more recent generations of multi-core machines, especially multi-socket multi-core machines, the TSC was synchronized but if one processor were to enter certain low-power states, its TSC would stop, destroying the synchrony and again causing obscure bugs. This reinforced decisions to avoid use of TSC altogether. On the most recent generations of multi-core machines, however, synchronization is provided across all processors in all power states, even on multi-socket machines, and provide a flag that indicates that TSC is synchronized and "invariant". Thus TSC is once again useful for applications, and even newer operating systems are using and depending upon TSC for critical timekeeping tasks when running on these recent machines.

[https://xenbits.xen.org/docs/4.8-testing/misc/tscmode.txt](https://xenbits.xen.org/docs/4.8-testing/misc/tscmode.txt)

### TSC frequency

In `arch/x86/include/asm/tsc.h` , a global:

```c
extern unsigned int tsc_khz;

// Determine TSC frequency via CPUID, else return 0.
tsc_khz = x86_platform.calibrate_tsc(); // native_calibrate_tsc
```

denotes the pTSCfreq (host).

In KVM, `vcpu->arch.virtual_tsc_khz` denotes the vcpu's vTSCfreq.

Skylake CPU base-frequency and TSC frequency may differ by up to 2%.

[[tip:x86/timers] x86/tsc: Enumerate SKL cpu_khz and tsc_khz via CPUID - tip-bot for Len Brown](https://lore.kernel.org/lkml/tip-aa297292d708e89773b3b2cdcaf33f01bfa095d8@git.kernel.org/)

### TSC offsetting

TSC offsetting is a **virtualization feature** that allows VMM to specify a value (the TSC offset) that is added to the TSC when it is read by guest. A VMM can use this feature to provide guest with the illusion that it is operating at a time later or earlier than that represented by the current TSC value.

### TSC Scaling

Seems introduced from Skylake:

- [Intel® Xeon® Processor Scalable Family Technical Overview](https://www.intel.com/content/www/us/en/developer/articles/technical/xeon-processor-scalable-family-technical-overview.html)
- [Linux-Kernel Archive: [PATCH 00/12] KVM: x86: add support for VMX TSC scaling](https://www.uwsg.indiana.edu/hypermail/linux/kernel/1509.3/02101.html)

```c
// kvm has a capability...
struct kvm_caps {
	/* control of guest tsc rate supported? */
	bool has_tsc_control;
    //...
};

hardware_setup
    if (cpu_has_vmx_tsc_scaling())
		kvm_caps.has_tsc_control = true;

// vTSCfreq / pTSCfreq

vcpu->arch.tsc_scaling_ratio

set_tsc_khz
	ratio = mul_u64_u32_div(1ULL << kvm_caps.tsc_scaling_ratio_frac_bits,
				user_tsc_khz, tsc_khz);
        kvm_vcpu_write_tsc_multiplier(vcpu, ratio);
            vcpu->arch.tsc_scaling_ratio = ratio;
```

TSC offsetting is not adequate if the VMM migrates a VM between platforms on which the TSC moves at different rates.

TSC scaling can adjust the TSC rate perceived by guest. **When TSC scaling and TSC offsetting are both enabled**, reads from the TSC in VMX non-root operation multiply the actual TSC value by a new TSC multiplier, add the TSC offset to the product, and return the sum to guest software.

$$
result = (ptsc * multiplier) + offset
$$

With both TSC offsetting and TSC scaling, a VMM that migrates a virtual machine from one platform to another can configure the TSC offset and the TSC multiplier on the new platform so that the TSC (as perceived by the guest) appears to proceed from the same value that it had before the migration and at the same rate.

The VMCS field is `TSC_MULTIPLIER`.

[Time-Stamp Counter Virtualization - L](https://liujunming.top/2022/02/28/Time-Stamp-Counter-virtualization/)

### TSC catchup

这是一个 KVM 里的机制，不是一个硬件的 feature。

这个会在两个地方被置上，第一，当 Userspace (QEMU) 要设置 TSC_KHZ 时，如果 host 上没有 tsc scaling 这个 feature，同时如果设置的 vTSCfreq > pTSCfreq, 那么，就将 `tsc_catchup` 和 `tsc_always_catchup` 设置为 1（`tsc_always_catchup` 只能通过这种方式被置上）。

```c
kvm_vcpu_ioctl
    kvm_arch_vcpu_ioctl
        kvm_set_tsc_khz
            set_tsc_khz
            	if (!kvm_caps.has_tsc_control) {
            		if (user_tsc_khz > tsc_khz) {
            			vcpu->arch.tsc_catchup = 1;
            			vcpu->arch.tsc_always_catchup = 1;
                    //...
```

第二个地方，vcpu 在 load 时如果发现 tsc 是 unstable 的，就会置上 `tsc_catchup`。

## `IA32_TSC_ADJUST`

*SDM: 17.17.3 Time-Stamp Counter Adjustment*

Software can modify the value of the time-stamp counter (TSC) of a logical processor by using the WRMSR instruction to write to the IA32_TIME_STAMP_COUNTER MSR (address 10H). Because such a write applies only to that logical processor, software seeking to synchronize the TSC values of multiple logical processors must perform these writes on each logical processor. It may be difficult for software to do this in a way than ensures that all logical processors will have the same value for the TSC at a given point in time.

Like the IA32_TIME_STAMP_COUNTER MSR, the IA32_TSC_ADJUST MSR is maintained separately for each logical processor. A logical processor maintains and uses the IA32_TSC_ADJUST MSR as follows:

- On RESET, the value of it is 0.
- If an execution of WRMSR to the IA32_TSC adds (or subtracts) value X from the TSC, the logical processor also adds (or subtracts) value X from the IA32_TSC_ADJUST MSR.
- If an execution of WRMSR to the IA32_TSC_ADJUST MSR adds (or subtracts) value X from that MSR, the logical processor also adds (or subtracts) value X from the IA32_TSC.

Unlike the TSC, the value of the IA32_TSC_ADJUST MSR changes only in response to `WRMSR` (either to the MSR itself, or to the IA32_TSC). **Its value does not otherwise change as time elapses**.

Software seeking to adjust the TSC can do so by using WRMSR to write the same value to the IA32_TSC_ADJUST MSR on each logical processor.

```c
struct tsc_adjust {
	s64		bootval; // CPU boot 时 TSC ADJUST MSR 的值
	s64		adjusted; // 当前我们保存的 TSC ADJUST MSR 的值
	unsigned long	nextcheck; // 下次检查的时间
	bool		warned; // 是否已经警告过了
};
```

### `tsc_sanitize_first_cpu()` Kernel

“first cpu” 表示这是 package 里第一个 online 的 CPU，当然如果是第一个 package，那同时这也是 boot CPU。

主要做的就是当这是 bootcpu 同时 boot TSC adjust 的值非 0 时，我们需要强迫其为 0，并报出一个固件 bug。

```c
// bootval: 这个 CPU 在 boot 时的 TSC ADJUST 的值。
static void tsc_sanitize_first_cpu(struct tsc_adjust *cur, s64 bootval, unsigned int cpu, bool bootcpu)
{
	if (bootcpu && bootval != 0) {
    	// On the boot cpu we just force set the ADJUST value to 0 if it's
    	// non zero. We don't do that on non boot cpus because physical
	    // hotplug should have set the ADJUST register to a value > 0 so
	    // the TSC is in sync with the already running cpus.
		if (likely(!tsc_async_resets)) {
			pr_warn(FW_BUG "TSC ADJUST: CPU%u: %lld force to 0\n", cpu, bootval);
			wrmsrl(MSR_IA32_TSC_ADJUST, 0);
			bootval = 0;
        // when multiple sockets are reset asynchronously with each other
    	// and socket 0 may not have an TSC ADJUST value of 0.
    	// so don't force the ADJUST value to zero
		} else {
			pr_info("TSC ADJUST: CPU%u: %lld NOT forced to 0\n", cpu, bootval);
		}
	}
	cur->adjusted = bootval;
}
```

### `tsc_store_and_check_tsc_adjust()` Kernel

主要还是为了保证 package 内多个 CPU 之间的 tsc adjust 必须要相等。

```c
bool tsc_store_and_check_tsc_adjust(bool bootcpu)
{
	struct tsc_adjust *ref, *cur = this_cpu_ptr(&tsc_adjust);
	unsigned int refcpu, cpu = smp_processor_id();
	struct cpumask *mask;
	s64 bootval;

    // 读 tsc adjust MSR 的值并存起来
	rdmsrl(MSR_IA32_TSC_ADJUST, bootval);
	cur->bootval = bootval;
	cur->nextcheck = jiffies + HZ;
	cur->warned = false;

	/*
	 * If a non-zero TSC value for socket 0 may be valid then the default
	 * adjusted value cannot assumed to be zero either.
	 */
    // 不同的 socket 上的 TSC 有可能是异步 reset 的，这可能导致 socket 0
    // 上的 TSC ADJUST 非 0。所以当异步 reset 时，我们需要把 bootval 赋值给 adjusted
	if (tsc_async_resets)
		cur->adjusted = bootval;

    // 一通操作，总之 refcpu 可以是这个 package 里的任何一个 cpu，除了当前 cpu
    // 这个条件表示 refcpu 是 package 里的第一个 cpu。 In
	// this case do not check the boot value against another package
	// because the new package might have been physically hotplugged,
	// where TSC_ADJUST is expected to be different.
	if (refcpu >= nr_cpu_ids) {
		tsc_sanitize_first_cpu(cur, bootval, smp_processor_id(), bootcpu);
		return false;
	}

    // 我们 CPU 和 package 里其他 CPU 的 bootval 不一样，也是一个固件错误
	if (bootval != ref->bootval)
		printk_once(FW_BUG "TSC ADJUST differs within socket(s), fixing all errors\n");

	/*
	 * The TSC_ADJUST values in a package must be the same. If the boot
	 * value on this newly upcoming CPU differs from others, set it to that
	 */
	if (bootval != ref->adjusted) {
		cur->adjusted = ref->adjusted;
		wrmsrl(MSR_IA32_TSC_ADJUST, ref->adjusted);
	}
	/*
	 * We have the TSCs forced to be in sync on this package. Skip sync
	 * test:
	 */
	return true;
}
```

### `check_tsc_warp()` Kernel

```c
/*
 * TSC-warp measurement loop running on both CPUs.  This is not called
 * if there is no TSC.
 */
// 在一段时间内，不断地检查 TSC 的值，看看是否有 tsc wrap 的现象
// warp: 弯曲，歪曲
static cycles_t check_tsc_warp(unsigned int timeout)
{
	cycles_t start, now, prev, end, cur_max_warp = 0;
	int i, cur_warps = 0;

	start = rdtsc_ordered();

    // end 时结束的时间
	end = start + (cycles_t) tsc_khz * timeout;

	for (i = 0; ; i++) {
        // 把上次的 tsc 测量值写到上上次的 tsc 值里
        // 把读到的值，记录到上次 tsc 测量值里
        // 注意：可能上次 tsc 不是这个 CPU 更新的哦
		arch_spin_lock(&sync_lock);
		prev = last_tsc;
		now = rdtsc_ordered();
		last_tsc = now;
		arch_spin_unlock(&sync_lock);

        // 每 8 次重置一下 watchdog 计时器。
		if (unlikely(!(i & 7))) {
			if (now > end || i > 10000000)
				break;
			cpu_relax();
			touch_nmi_watchdog();
		}

        // 发现了 tsc wrap 的现象，不一定是本 CPU 的 tsc 倒流，因为可能
        // 和其他的 CPU 的 tsc 值有关系。
		if (unlikely(prev > now)) {
			arch_spin_lock(&sync_lock);
            // 最大的 warp
			max_warp = max(max_warp, prev - now);
			cur_max_warp = max_warp;
			/*
			 * Check whether this bounces back and forth. Only
			 * one CPU should observe time going backwards.
			 */
			if (cur_warps != nr_warps)
				random_warps++;
			nr_warps++;
			cur_warps = nr_warps;
			arch_spin_unlock(&sync_lock);
		}
	}

    //...
    // 返回目前为止遇到过的最大的 warp 值。
	return cur_max_warp;
}
```

### What is source CPU and target CPU

Source CPU brings up a target CPU.

核是一个一个启动的，从核需要主核来拉起。source CPU 就是拉别人的核，target CPU 就是被别人拉的核。

### `check_tsc_sync_source()` / `check_tsc_sync_target()` Kernel

```c
bringup_cpu(int cpu)
    __cpu_up(int cpu, ...) // Bring a CPU up from this running CPU
        native_cpu_up(int cpu, ...)
            check_tsc_sync_source // 注意，这里还是跑在 source CPU 上的，所以这个函数叫做 source
/*
 * Source CPU calls into this - it waits for the freshly booted
 * target CPU to arrive and then starts the measurement:
 */
// 可见，source CPU 是先启动的，target CPU 是后 boot 的。
void check_tsc_sync_source(int cpu)
{
    // 没有 TSC 或者我们本来就知道 TSC 是不同步的，没必要 check 了
    // 为什么 TSC 是同步的才值得 check 呢？因为我们本身就是为了 check
    // 他同不同步？
	if (unsynchronized_tsc())
		return;

	/*
	 * Set the maximum number of test runs to
	 *  1 if the CPU does not provide the TSC_ADJUST MSR
	 *  3 if the MSR is available, so the target can try to adjust
	 */
	if (!boot_cpu_has(X86_FEATURE_TSC_ADJUST))
		atomic_set(&test_runs, 1);
	else
		atomic_set(&test_runs, 3);
retry:
	/*
	 * Wait for the target to start or to skip the test:
	 */
    // start_count 变成 1 表示 target 那边加入了（但是还没开始）
	while (atomic_read(&start_count) != 1) {
		if (atomic_read(&skip_test) > 0) {
			atomic_set(&skip_test, 0);
			return;
		}
		cpu_relax();
	}

    // 因为 target 那边会检查是不是等于 2，目前是 1，所以增加 1
    // 表示 source 这里下达开始的指令，告诉 target 也可以开始 measure 了。
	atomic_inc(&start_count);

    // measurning....
	check_tsc_warp(loop_timeout(cpu));

    // measure 的结束是由 target 决定的，source 能做的只有等待。
	while (atomic_read(&stop_count) != 1)
		cpu_relax();

	/*
	 * If the test was successful set the number of runs to zero and
	 * stop. If not, decrement the number of runs an check if we can
	 * retry. In case of random warps no retry is attempted.
	 */
    // 没有发现 warp，说明没问题，结束。
	if (!nr_warps) {
		atomic_set(&test_runs, 0);
        //...
    // 只试三次
	} else if (atomic_dec_and_test(&test_runs) || random_warps) {
		/* Force it to 0 if random warps brought us here */
        // 这里其实没有太看懂，这不是每次都会变成 0 吗
		atomic_set(&test_runs, 0);
        //...
		mark_tsc_unstable("check_tsc_sync_source failed");
	}

    // reset，boot 其他 CPU 的时候这些变量还要用
	atomic_set(&start_count, 0);
	random_warps = 0;
	nr_warps = 0;
	max_warp = 0;
	last_tsc = 0;

    // target 需要 stop_count = 2，他自己会自增 1。这里设置一个同步
    // 是因为需要 source 先把 log print 出来，target CPU 再继续 boot。
	atomic_inc(&stop_count);

	/*
	 * Retry, if there is a chance to do so.
	 */
	if (atomic_read(&test_runs) > 0)
		goto retry;
}

// Freshly booted CPUs call into this，注意不是 BSP，同时注意参数是 void。
start_secondary
void check_tsc_sync_target(void)
{
	struct tsc_adjust *cur = this_cpu_ptr(&tsc_adjust);
	unsigned int cpu = smp_processor_id();
	cycles_t cur_max_warp, gbl_max_warp;
	int cpus = 2;

    // ...

	/*
	 * Store, verify and sanitize the TSC adjust register. If
	 * successful skip the test.
	 *
	 * The test is also skipped when the TSC is marked reliable. This
	 * is true for SoCs which have no fallback clocksource. On these
	 * SoCs the TSC is frequency synchronized, but still the TSC ADJUST
	 * register might have been wreckaged by the BIOS..
	 */
    // 因为不是 BSP，所以传入 false。当是这个 package 里的第一个 cpu 时返回 false
    // 这个条件表示如果不是 package 里第一个 online CPU，或者 reliable，后面就不用 check 了
	if (tsc_store_and_check_tsc_adjust(false) || tsc_clocksource_reliable) {
		atomic_inc(&skip_test);
		return;
	}

retry:
    // 我们是 package 里的第一个 CPU，等其他的 CPU 上线
	atomic_inc(&start_count);
	while (atomic_read(&start_count) != cpus)
		cpu_relax();

    // ^measure 一段时间，看看这段时间有没有 tsc warp 的现象，也就是回退。
	cur_max_warp = check_tsc_warp(loop_timeout(cpu));

	/*
	 * Store the maximum observed warp value for a potential retry:
	 */
	gbl_max_warp = max_warp;

    // 我们这个 CPU 完成了，等其他的 source CPU 
	atomic_inc(&stop_count);
	while (atomic_read(&stop_count) != cpus)
		cpu_relax();

    // 这一轮测试结束，归零为了下一次 sync test（一次 goto retry 表示一次 sync test）
	atomic_set(&stop_count, 0);

    // 非零表示测试失败了，使用一个 adjusted 的 TSC 来 retry 是可能的
    // 零表示成功或者一直失败到了最后。
	if (!atomic_read(&test_runs))
		return;

    // 这个 CPU 没有看到 tsc going backward，但是别的 CPU 看到了，
    // 说明这个 CPU 快，那么我们要调整一下了。
	if (!cur_max_warp)
		cur_max_warp = -gbl_max_warp;

	/*
	 * The adjustment value is slightly off by the overhead of the
	 * sync mechanism (observed values are ~200 TSC cycles), but this
	 * really depends on CPU, node distance and frequency. So
	 * compensating for this is hard to get right. Experiments show
	 * that the warp is not longer detectable when the observed warp
	 * value is used. In the worst case the adjustment needs to go
	 * through a 3rd run for fine tuning.
	 */
	cur->adjusted += cur_max_warp;

    //...
	wrmsrl(MSR_IA32_TSC_ADJUST, cur->adjusted);
	goto retry;
}
```

### `tsc_verify_tsc_adjust()` Kernel

核心就是当 TSC ADJUST MSR 的 value 相比于我们保存的变化了之后，恢复成我们保存的。

那么问题来了：

- 什么情况会导致 TSC ADJUST MSR 发生变化？
- 为什么变化了之后要在这个函数里恢复？

什么情况会导致 TSC ADJUST MSR 发生变化呢？除了这个函数本身，代码里有这么几处：

- `tsc_sanitize_first_cpu`：当 BSP boot 时的 tsc adjust 值非 0 时，置 0。
- `tsc_store_and_check_tsc_adjust`：主要还是为了保证 package 内多个 CPU 之间的 tsc adjust 必须要相等。
- `check_tsc_sync_target`：主要还是

核心思想还是要保证 CPU 之间的 tsc adjust 同步。这个函数主要在这两个函数里被调用：

- `arch_cpu_idle_enter`：表示在要进入 idle 时，会 check 一下 tsc
- `tsc_sync_check_timer_fn`：有时候太忙进不去 idle，所以定期地 check tsc
- `tsc_resume`：从休眠中恢复时会调用。

```c
// resume: 表示这个是从 tsc_resume() 里调用过来的。
void tsc_verify_tsc_adjust(bool resume)
{
    // get current tsc adjust value
	struct tsc_adjust *adj = this_cpu_ptr(&tsc_adjust);
	s64 curval;

    // This is dependent on this feature
	if (!boot_cpu_has(X86_FEATURE_TSC_ADJUST))
		return;

    // 当 tsc unstable 的时候，就不要再继续执行了，不然只会增加不必要的报错
	if (check_tsc_unstable())
		return;

    // 不要一直 check，要有 rate limiting
    // 当 resume=true 的时候不会 rate limiting，为什么？
	if (!resume && time_before(jiffies, adj->nextcheck))
		return;
    // 计算下一次的 check 的时间
	adj->nextcheck = jiffies + HZ;

	rdmsrl(MSR_IA32_TSC_ADJUST, curval);

    // 检验过了，TSC_ADJUST 没有变化，可以返回
	if (adj->adjusted == curval)
		return;

    // 没有检查通过的话，说明现在 MSR 的值变了，那就重新写回去
	wrmsrl(MSR_IA32_TSC_ADJUST, adj->adjusted);

    // 没有检查通过，那就 warning 一下，如果 resume=true，那就不要只 warning 一次，而是每一次都 warn。
	if (!adj->warned || resume) {
		pr_warn(FW_BUG "TSC ADJUST differs: CPU%u %lld --> %lld. Restoring\n",
			smp_processor_id(), adj->adjusted, curval);
		adj->warned = true;
	}
}
```

### Guest set to this MSR

```c
int kvm_set_msr_common(struct kvm_vcpu *vcpu, struct msr_data *msr_info)
    //...
	case MSR_IA32_TSC_ADJUST:
            //...
            s64 adj = data - vcpu->arch.ia32_tsc_adjust_msr;
            // adjust TSC OFFSET by vmcs_write64(TSC_OFFSET, offset);
            adjust_tsc_offset_guest(vcpu, adj);
            /* Before entering to guest, tsc_timestamp must be adjusted
             * as well, otherwise guest's percpu pvclock time could jump.
             */
            kvm_make_request(KVM_REQ_CLOCK_UPDATE, vcpu);
            // update the cached value to new adj data
			vcpu->arch.ia32_tsc_adjust_msr = data;
            //...
```

# Linux time subsystem

## Clocksource

CPU 中的 TSC 寄存器是精度最高（与 CPU 最高主频等同），访问速度最快（只需一条指令，一个时钟周期）的时钟源，因此**内核优选 TSC 作为计时的时钟源**。其它的时钟源，如 HPET，ACPI-PM，PIT 等则作为备选。

You can check current clocksource by:

```bash
cat /sys/devices/system/clocksource/clocksource0/current_clocksource

# See all available clocksources
cat /sys/devices/system/clocksource/clocksource0/available_clocksource
```

[Clocksource tsc unstable - 苏小北1024 - 博客园](https://www.cnblogs.com/muahao/p/6641264.html)

```c
struct clocksource {
	u64			(*read)(struct clocksource *cs);

    // Bitmask for two's complement subtraction of non 64 bit counters
    // 一般来说没有用，大多数的 clocksource，比如 tsc，在定义时就设置成了：
    // static struct clocksource clocksource_tsc = {
    //     .name			= "tsc",
    //     .mask			= CLOCKSOURCE_MASK(64),
    //     //...
    // };
	u64			mask;

    // Cycle to nanosecond multiplier
    // See function clocksource_cyc2ns()
    // nsec = (cycles * mult) >> shift
    // mult and shift are calculated in
    // clocks_calc_mult_shift()
	u32			mult;

    // Cycle to nanosecond divisor (power of two)
    // Note, this is not the offset for adding, this is
    // right shift for dividing!
	u32			shift;
	u64			max_idle_ns;
	u32			maxadj;
	u32			uncertainty_margin;
#ifdef CONFIG_ARCH_CLOCKSOURCE_DATA
	struct arch_clocksource_data archdata;
#endif
	u64			max_cycles;
	const char		*name;
	struct list_head	list;
	int			rating;
	enum clocksource_ids	id;
    // 
	enum vdso_clock_mode	vdso_clock_mode;
	unsigned long		flags;

	int			(*enable)(struct clocksource *cs);
	void			(*disable)(struct clocksource *cs);
	void			(*suspend)(struct clocksource *cs);
	void			(*resume)(struct clocksource *cs);
	void			(*mark_unstable)(struct clocksource *cs);
	void			(*tick_stable)(struct clocksource *cs);

	/* private: */
#ifdef CONFIG_CLOCKSOURCE_WATCHDOG
	/* Watchdog related data, used by the framework */
	struct list_head	wd_list;
	u64			cs_last;
	u64			wd_last;
#endif
	struct module		*owner;
};
```

### vdso_clock_mode

```c
enum vdso_clock_mode {
	VDSO_CLOCKMODE_NONE,
	VDSO_CLOCKMODE_TSC,
	VDSO_CLOCKMODE_PVCLOCK,
    // This one is only used when Hyper-V
	VDSO_CLOCKMODE_HVCLOCK,
	VDSO_CLOCKMODE_MAX,
	/* Indicator for time namespace VDSO */
	VDSO_CLOCKMODE_TIMENS = INT_MAX
};
```

### `clocks_calc_mult_shift()` Kernel

```c
void
clocks_calc_mult_shift(u32 *mult, u32 *shift, u32 from, u32 to, u32 maxsec)
{
	u64 tmp;
	u32 sft, sftacc= 32;

	/*
	 * Calculate the shift factor which is limiting the conversion
	 * range:
	 */
	tmp = ((u64)maxsec * from) >> 32;
	while (tmp) {
		tmp >>=1;
		sftacc--;
	}

	/*
	 * Find the conversion shift/mult pair which has the best
	 * accuracy and fits the maxsec conversion range:
	 */
	for (sft = 32; sft > 0; sft--) {
		tmp = (u64) to << sft;
		tmp += from / 2;
		do_div(tmp, from);
		if ((tmp >> sftacc) == 0)
			break;
	}
	*mult = tmp;
	*shift = sft;
}
```

### `clocksource_register_*()`

## Timekeeping

timekeeping 应该在同一时间只能使用一个 clocksource 来提供时间（current clocksource）。

timekeeping 模块维护 timeline 的基础是基于 clocksource 模块和 tick 模块。

- 通过 tick 模块的 tick 事件，可以周期性的更新 time line，
- 通过 clocksource 模块、可以获取 tick 之间更精准的时间信息。

一般而言，timekeeping 模块是在 **tick 到来的时候更新各种系统时钟的时间值**，ktime_get 调用很有可能发生在两次 tick 之间，这时候，仅仅依靠当前系统时钟的值精度就不甚理想了，毕竟那个时间值是 per tick 更新的。

除了直接调用 clocksource 的 read 函数之外，timekeeping 和 clocksource 模块主要的交互就是 change clocksource 的操作了。当系统中有更高精度的 clocksource 的时候，会调用 timekeeping_notify 函数通知 timekeeping 模块进行 clock source 的切换。

[Linux时间子系统之：timekeeping](http://www.wowotech.net/timer_subsystem/timekeeping.html)

### `tk_normalize_xtime()` KVM

`tk->tkr_raw.xtime_nsec` 和 `tk->tkr_mono.xtime_nsec` 有可能超过了一秒，换算成秒数分别加到 `tk->xtime_sec` 和 `tk->raw_sec` 中，只保留小数部分。

### `struct timekeeper` / `struct tk_read_base`

`offs_*` 都是以 `CLOCK_MONOTONIC` 为 base 来计算的。

```c
struct timekeeper {
    // Has 2 clocksource, 1 for CLOCK_MONOTONIC, 1 for CLOCK_MONOTONIC_RAW
    // These 2 are for readout, which means other functions
    // shouldn't read other properties directly, they should
    // read from these 2 members directly.
    // These 2 use the same clocksource, for more, see:
    // timekeeping_notify
    //   change_clocksource
    //     tk_setup_internals
    // Patchset 在这里：
    // https://lore.kernel.org/all/20150319093137.149794496@infradead.org/
    // 尽管有两个，但还是优先使用 tkr_mono 的。
    // CLOCK_MONOTONIC
	struct tk_read_base	tkr_mono;
    // CLOCK_MONOTONIC_RAW
	struct tk_read_base	tkr_raw;

    // CLOCK_REALTIME time in seconds（其实就是墙上时钟 WALL CLOCK）
    // 1970 到现在经历的秒数。
    // 通过 tkr_mono.xtime_nsec 计算得到, refer to tk_normalize_xtime()
    // 尽管 xtime_nsec 需要 shift 之后才代表真正的 ns 值，xtime_sec 就是
    // 真实的秒值，不需要进行 shift。
	u64			xtime_sec;

    // CLOCK_REALTIME time in seconds（其实就是墙上时钟 WALL CLOCK）
    // 1970 到现在经历的秒数。
    // 通过 tkr_raw.xtime_nsec 计算得到，refer to tk_normalize_xtime()
    // 尽管 xtime_nsec 需要 shift 之后才代表真正的 ns 值，raw_sec 就是
    // 真实的秒值，不需要进行 shift。
    u64			raw_sec;

    // CLOCK_MONOTONIC time in seconds
    // Calculated by: ktime_sec = xtime_sec + wall_to_monotonic
    // See function tk_update_ktime_data
	unsigned long		ktime_sec;

    // CLOCK_MONOTONIC 类型的时钟，其未像前者一样定义一个相对于 linux epoch 的值，
    // 而是定义了 CLOCK_MONOTONIC 到 CLOCK_REALTIME 的偏移
    // 也就是说，CLOCK_MONOTONIC = CLOCK_REALTIME(上面定义的) + wall_to_monotonic
    // 实际上，这个变量是一个负数，因为 CLOCK_REALTIME 是从 1970 开始计算的，
    // 而 CLOCK_MONOTONIC 是从开机开始增加的（而且还有休眠存在）
	struct timespec64	wall_to_monotonic;

    // 和 wall_to_monotonic 一样，只不过是反着的，通过 
    // 也就是说，CLOCK_REALTIME = CLOCK_MONOTONIC + offs_real
    // 从下面的函数可以看到，offs_real 纯粹是 wall_to_monotonic 的相反数
    // tk_set_wall_to_mono() {
    //     //...
    //     tk->wall_to_monotonic = wtm;
	//     set_normalized_timespec64(&tmp, -wtm.tv_sec, -wtm.tv_nsec);
	//     tk->offs_real = timespec64_to_ktime(tmp);
    //     //...
    // }
	ktime_t			offs_real;

    // CLOCK_BOOTTIME = CLOCK_MONOTONIC + offs_boot
	ktime_t			offs_boot; 
    // CLOCK_BOOTTIME = CLOCK_MONOTONIC + offs_boot
    // Q: Why again, is this duplicated?
    // A: Timespec representation for VDSO update to avoid 64bit division 
    // on every update.
	struct timespec64	monotonic_to_boot;

    //...
};

struct tk_read_base {
    // timekeeping 当前使用的时钟源
	struct clocksource	*clock;

    // 参考 clocksource 里的 mask
	u64			mask;
    // 最后一次更新的时钟周期值
    // cycle 不止可以是 tsc，比如 clocksource 结构体里的 read 函数
    // 返回的就是 cycle，但是不止是 tsc 可以是 clocksource，因此 cycle
    // 也可以表示 HPET counter 等等
	u64			cycle_last;

    //（经过 NTP 调整）数学换算的乘数
    // 参考 clocksource 里的 mult
	u32			mult;
    // 数学换算的移位值
    // 参考 clocksource 里的 shift
	u32			shift;

    // CLOCK_REALTIME 的纳秒值
    // 注意，这是 shift 之后的，如果要还原，就需要先右移 shift
    // So, this is higher than the real nsec value
    // See tk_normalize_xtime() to understand more
	u64			xtime_nsec;

    // CLOCK_MONOTONIC base time
    // base time 应该指的是后面还需要加一个 delta？
    // xtime_sec/raw_sec 的 ktime 表达形式（而非秒）

    // tkr_mono.base is different from tkr_raw.base.
    // wtm is wall_to_monotonic
    // tkr_mono.base = (xtime_sec + wtm_sec) * 1e9 + wtm_nsec
    // 叫 base 的原因可能是没有加 xtime_nsec
    // See function tk_update_ktime_data() for the formula to calculate base.
	ktime_t			base;

    // CLOCK_REALTIME base time
    // base_real = tkr->base + tk->offs_real
	u64			base_real;
};
```

所以，为了计算当前 `CLOCK_REALTIME`，可以通过下面公式：

$$
tk.xtime\_sec + tk.tkr\_mono.xtime\_nsec << shift
$$

### Why `xtime_nsec` in `tk_read_base`?

从下面代码可以看出，为了得到 REALTIME，分别取了 `xtime_sec` 和 `tkr_mono.xtime_nsec`。

```c
static inline struct timespec64 tk_xtime(const struct timekeeper *tk)
{
	struct timespec64 ts;

	ts.tv_sec = tk->xtime_sec;
	ts.tv_nsec = (long)(tk->tkr_mono.xtime_nsec >> tk->tkr_mono.shift);
	return ts;
}
```

同理在 set 的时候也是优先使用 `tkr_mono` 的：

```c
static void tk_set_xtime(struct timekeeper *tk, const struct timespec64 *ts)
{
	tk->xtime_sec = ts->tv_sec;
	tk->tkr_mono.xtime_nsec = (u64)ts->tv_nsec << tk->tkr_mono.shift;
}
```

那么 `tkr_raw.xtime_nsec` 的作用是什么呢？
