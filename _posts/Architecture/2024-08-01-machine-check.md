---
categories: x86
title: Machine Check
---

*SDM CHAPTER 15 MACHINE-CHECK ARCHITECTURE*

The processor signals the detection of an **uncorrected machine-check error** by generating a machine-check exception (#MC), which is an abort class exception. 也就是说，MCE 表示的是发生了 machine-check，并且这个 machine check 并不能自动修复（？）。

The implementation of the machine-check architecture does not ordinarily permit the processor to be restarted reliably after generating a machine-check exception. However, the machine-check-exception handler can collect information about the machine-check error from the machine-check MSRs. 也就是说，在发生了 MCE 之后，处理器不能够再重新回到正轨了（好像也不一定，这是之前的情况，后面变了？），MCE handler 的作用仅仅是 check 相关的 MSR 来报告这一情况，而非恢复（？）。

一共有两类 MSR：

- Global Control MSRs:
    - IA32_MCG_CAP
    - IA32_MCG_STATUS
    - IA32_MCG_CTL
    - IA32_MCG_EXT_CTL
- Error-Reporting Bank Registers (One Set for Each Hardware Unit)
    - IA32_MCi_CTL
    - IA32_MCi_STATUS
    - IA32_MCi_ADDR
    - IA32_MCi_MISC
    - IA32_MCi_CTL2

### IA32_MCG_CAP

The IA32_MCG_CAP MSR is a read-only register that provides information about the machine-check architecture of the processor.

只读，提供哪些 Capability 是支持的，比如 CMCI 支不支持，软件恢复（SER）支不支持等等。

### IA32_MCG_STATUS

Describes the current state of the processor after a MCE has occurred.

注意这是 global 的 MSR。

### IA32_MCG_CTL

IA32_MCG_CTL controls the reporting of MCEs.

### Local Machine Check (LMCE)

Allow hardware to signal some MCEs to only a single logical processor.

### Threshold-based cache error status

Cache status is based on the number of lines in a cache that incur repeated corrections. The threshold is chosen by Intel, based on various factors.

The hardware reports a **“green”** status when the number of lines that incur repeated corrections is at or below a pre-defined threshold, and a **“yellow”** status when the number of affected lines exceeds the threshold. Yellow status means that the cache reporting the event is operating correctly, but you should schedule the system for servicing within a few weeks.

The CPU/system/platform response to a yellow event should be less severe than its response to an uncorrected error. An uncorrected error means that a serious error has actually occurred, whereas the yellow condition is a warning that the number of affected lines has exceeded the threshold but is not, in itself, a serious event: the error was corrected and system state was not compromised.

**问题一：什么时候才会发送 MCE 出来？**

### Corrected Machine-Check error Interrupt (CMCI)

Machine check handling on Linux: [mce.pdf](https://www.halobates.de/mce.pdf)

# `x86_mce_decoder_chain` Kernel

是一个 block 类型的 notifier，意味着在调用这些 notifier 的过程中可以调度。

```c
extern struct blocking_notifier_head x86_mce_decoder_chain;
```

### `mce_register_decode_chain()` / `mce_unregister_decode_chain()` Kernel

```c
void mce_register_decode_chain(struct notifier_block *nb)
{
	if (WARN_ON(nb->priority < MCE_PRIO_LOWEST || nb->priority > MCE_PRIO_HIGHEST))
		return;

	blocking_notifier_chain_register(&x86_mce_decoder_chain, nb);
}
```

```c
start_kernel
    setup_arch
        mcheck_init
            INIT_WORK(&mce_work, mce_gen_pool_process);
            mce_gen_pool_process
                blocking_notifier_call_chain
```