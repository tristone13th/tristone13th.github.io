---
categories: Security
title: Static Calls
---

### Side channel attack

Based on extra information that can be gathered because of the fundamental way, rather than flaws in the design of the protocol or algorithm itself, you can understand it from following examples:

- Cache attack — attacks based on monitoring cache accesses;
- [Timing attack](https://en.wikipedia.org/wiki/Timing_attack) — attacks based on measuring how much time various computations;
- [Power-monitoring attack](https://en.wikipedia.org/wiki/Power_analysis) — attacks that make use of varying power consumption;
- Optical - secrets can be read by visual recording using a high resolution camera.

### Indirect call / indirect branch

The address of a function to be called isn’t known at compile time. Instead, the address is stored in a pointer variable so it can then be used at run time.

2 type: memory indirect calls (`call *%eax`, the address is determined by the content in the memory specified by `%eax`) and register indirect calls (`call %eax`).

Function return instruction `ret` is also an indirect branch. (It will jump to the call point)

As many have discovered, those indirect calls are easily exploitable by speculative execution attacks (like **Spectre**).

### Trampoline

n. 蹦床；（杂技表演中翻筋斗用的）蹦床，弹床

Sometimes referred to as indirect jump vectors.

Execution jumps into the trampoline and then immediately jumps out, or bounces, hence the term *trampoline*.

These calls happen when the address of a function to be called isn’t known at compile time. Instead, the address is stored in a pointer variable so it can then be used at run time.

C code example: [code-snippets/trampoline.c at main · tristone13th/code-snippets](https://github.com/tristone13th/code-snippets/blob/main/c/trampoline.c)

**temporary trampoline**: CONFIG_HAVE_STATIC_CALL_INLINE

**permanent trampoline**: CONFIG_HAVE_STATIC_CALL

### Retpoline

An approach to mitigate the Spectre attack.

A retpoline is a return trampoline that makes use of an infinite loop that is never executed to **prevent a CPU from speculating the target of an indirect jump.**

Original documentation: [Retpoline: a software construct for preventing branch-target-injection - Google帮助](https://support.google.com/faqs/answer/7625886)

Is a mitigation for Spectre, but **far from ideal**:

1. Slows down when correctly predicted.
2. Drastically slows down when incorrectly predicted.
3. Interferes with Intel’s CET and other protections.
4. It's overly complicated.

[Linux Kernel 5.10 Introduces Static Calls to Prevent Speculative Execution Attacks – The New Stack](https://thenewstack.io/linux-kernel-5-10-introduces-static-calls-to-prevent-speculative-execution-attacks/)

## static_call

Use **classic code trampoline** and completely avoids the use of **retpolines**.

Use code patching to allow direct calls to be used instead of indirect calls.

[[PATCH v2 02/13] static_call: Add basic static call infrastructure - Peter Zijlstra](https://lore.kernel.org/lkml/20191007083830.64667428.5@infradead.org/)

The release of the [Linux 5.10 kernel](https://www.omgubuntu.co.uk/2020/12/new-linux-5-10-kernel-features) brings a new feature that does just that — protect against speculative execution attacks. That feature is called static calls and is a replacement for **global function pointers** in the Linux kernel.

**The core idea**: A static call uses a location in executable memory (instead of writable memory) that contains a jump instruction pointing to a target function. Executing a static call requires a call to the special location, which then jumps to the actual target. This is called a **classic code trampoline** and completely avoids the use of retpolines.

[[RFC PATCH 0/9] patchable function pointers for pluggable crypto routines](https://lore.kernel.org/all/20181005081333.15018-1-ard.biesheuvel@linaro.org/T/#md8dcb8fe3ca43b87f1419841edbc2dfb3373511b)

The original patchset is [[PATCH v7 00/18] Add static_call - Peter Zijlstra](https://lore.kernel.org/lkml/20200818135735.948368560@infradead.org/)

Some motivations: [[PATCH v7 06/18] static_call: Add basic static call infrastructure - Peter Zijlstra](https://lore.kernel.org/lkml/20200818135804.623259796@infradead.org/)

[Linux Kernel 5.10 Introduces Static Calls to Prevent Speculative Execution Attacks – The New Stack](https://thenewstack.io/linux-kernel-5-10-introduces-static-calls-to-prevent-speculative-execution-attacks/)

Writable memory / executable memory: [W^X - Wikipedia](https://en.wikipedia.org/wiki/W%5EX)

[Avoiding retpolines with static calls [LWN.net]](https://lwn.net/Articles/815908/)

### Why using trampoline, not just a direct call?

This patch set implements two different mechanisms:

1. The first tracks all call sites for each static call variable and patches each of them when the target changes; This method will be used if CONFIG_HAVE_STATIC_CALL_INLINE is set
2. otherwise, the second stores the target in a trampoline and all calls jump through there.

The motivations for the two approaches are not spelled out, but one can imagine that

1. the direct calls will be a little faster
2. while the trampoline will be quicker and easier to patch when the target changes.

[Relief for retpoline pain [LWN.net]](https://lwn.net/Articles/774743/)

# Implementation

### What's the difference between `DECLARE_STATIC_CALL` and `DEFINE_STATIC_CALL`

`DEFINE_STATIC_CALL()` 会利用 name 这个参数来创建一个新的静态调用，初始会指向 target () 这个函数。

而 `DECLARE_STATIC_CALL()` 则是声明在其他某个地方已经定义了这个静态调用，**在这种情况下，`target()` 只是用于对函数指针进行类型检查的。**

### Why each static_call_update will trigger kernel patching?

The target of a static call can be changed with:

```c
static_call_update(name, target2);
```

Where target2 is the new target for the static call. Changing the target of a static call requires **patching the code** of the running kernel, which is an **expensive operation**. That implies that static calls are only appropriate for settings where the target will change rarely.

It is a type of self modifying code in Linux kernel.

### Compile time

In compile time, the following code will be executed (basically, it just defines a null static call as a place holder):

```c
KVM_X86_OP 
	DEFINE_STATIC_CALL_NULL 
		ARCH_DEFINE_STATIC_CALL_NULL_TRAMP 

// definition for ARCH_DEFINE_STATIC_CALL_NULL_TRAMP
#ifdef CONFIG_RETHUNK
#define ARCH_DEFINE_STATIC_CALL_NULL_TRAMP(name)			\
	__ARCH_DEFINE_STATIC_CALL_TRAMP(name, "jmp __x86_return_thunk")
#else
#define ARCH_DEFINE_STATIC_CALL_NULL_TRAMP(name)			\
	__ARCH_DEFINE_STATIC_CALL_TRAMP(name, "ret; int3; nop; nop; nop")
#endif
```

As we can see above

- if kernel config `CONFIG_RETHUNK` is defined, then use `jmp __x86_return_thunk`
- else, use `ret; int3; nop; nop; nop`

When we `objdump` the `kvm.ko`, we will see the following code (`prepare_switch_to_guest` for an example):

```assembly
Disassembly of section .static_call.text:

0000000000000330 <__SCT__kvm_x86_prepare_switch_to_guest>:
 330:   e9 00 00 00 00          jmp    335 <__SCT__kvm_x86_prepare_switch_to_guest+0x5>
 335:   0f b9 cc                ud1    %esp,%ecx
```

So why the `jmp __x86_return_thunk` became `jmp 335 <__SCT__kvm_x86_prepare_switch_to_guest+0x5>`? Actually, `jmp 335` is just jump to the next instruction address.

In `arch/x86/lib/retpoline.S`, the following code:

```c
	/*
	 * As executed from __x86_return_thunk, this is a plain RET.
	 *
	 * As part of the TEST above, RET is the ModRM byte, and INT3 the imm8.
	 *
	 * We subsequently jump backwards and architecturally execute the RET.
	 * This creates a correct BTB prediction (type=ret), but in the
	 * meantime we suffer Straight Line Speculation (because the type was
	 * no branch) which is halted by the INT3.
	 *
	 * With SMT enabled and STIBP active, a sibling thread cannot poison
	 * RET's prediction to a type of its choice, but can evict the
	 * prediction due to competitive sharing. If the prediction is
	 * evicted, __x86_return_thunk will suffer Straight Line Speculation
	 * which will be contained safely by the INT3.
	 */
SYM_INNER_LABEL(__x86_return_thunk, SYM_L_GLOBAL)
	ret
	int3
SYM_CODE_END(__x86_return_thunk)
//...
EXPORT_SYMBOL(__x86_return_thunk)
```

We can see that `__x86_return_thunk` is just a plain `RET`, so basically, we are jumping to the RET, that's why we directly jumping to the next instruction.

The implementation:

```c
#define __ARCH_DEFINE_STATIC_CALL_TRAMP(name, insns)			\
	asm(".pushsection .static_call.text, \"ax\"		\n"	\
	    ".align 4						\n"	\
	    ".globl " STATIC_CALL_TRAMP_STR(name) "		\n"	\
	    STATIC_CALL_TRAMP_STR(name) ":			\n"	\
	    ANNOTATE_NOENDBR						\
	    insns "						\n"	\
	    ".byte 0x0f, 0xb9, 0xcc				\n"	\
	    ".type " STATIC_CALL_TRAMP_STR(name) ", @function	\n"	\
	    ".size " STATIC_CALL_TRAMP_STR(name) ", . - " STATIC_CALL_TRAMP_STR(name) " \n" \
	    ".popsection					\n")

#define ARCH_DEFINE_STATIC_CALL_TRAMP(name, func)			\
	__ARCH_DEFINE_STATIC_CALL_TRAMP(name, ".byte 0xe9; .long " #func " - (. + 4)")
```

### Run time

For an example, `x86_pmu_add_tramp` will be expanded to:

```nasm
.pushsection .static_call.text, "ax"
.align 4
.globl "__SCT__x86_pmu_add_tramp"
__SCT__x86_pmu_add_tramp":
  .byte 0xe9
  .long _x86_pmu_add - (. + 4)
  ud1 %esp, %ecx
  .type "__SCT__x86_pmu_add_tramp", @function
  .size "__SCT__x86_pmu_add_tramp", . - "__SCT__x86_pmu_add_tramp"
.popsection
```

What’s `.byte 0xe9`? It’s a relative JMP!

Specifically, it’s a JMP to the address calculated by `.long _x86_pmu_add - (. + 4)`, which is ugly GAS syntax for “the address of \_x86_pmu_add, minus the current address (indicated by .), plus 4”.

`.byte 0x0f, 0xb9, 0xcc` equals to `ud1 %esp, %ecx`

[[PATCH 5.10 087/148] x86,static_call: Use alternative RET encoding - Greg Kroah-Hartman](https://lore.kernel.org/lkml/20220723095248.801393697@linuxfoundation.org/)

[Static calls in Linux 5.10](https://blog.yossarian.net/2020/12/16/Static-calls-in-Linux-5-10)

**Why using a relative JMP, not the absolute one?**
