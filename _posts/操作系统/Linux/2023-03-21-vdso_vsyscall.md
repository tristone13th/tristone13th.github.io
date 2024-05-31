---
categories: Linux
title: vsyscall / vDSO
---

They are concepts in Linux OS, not in ISA!

# Vsyscall

**vsyscall**: kernel maps these system call implementation and the related-data into user space pages. Then the application can just trigger these system call like a trivial function call.

`0xffffffffff600000-0xffffffffff601000` **was** user space to implement vsyscall, nowadays, it's kernel space and the kernel is watching to see if the user mode accesses it and it **emulates** the call.

[linux - Why vsyscall is in 0xffffffffff600000-0xffffffffff601000, not user space? - Stack Overflow](https://stackoverflow.com/questions/75357949/why-vsyscall-is-in-0xffffffffff600000-0xffffffffff601000-not-user-space?noredirect=1#comment133034785_75357949)

The address stated above is fixed in every process. The fixed address is considered to violate the ASLR as this allow the attack to write exploit more easy. So the original vsyscall is discarded. vsyscall is an obsolete concept and replaced by the vDSO or virtual dynamic shared object (.so, dynamic linking/library).

**How does user-space aware of the existence of such pages and call them?**

By user-space libraries such as `glibc`.

>All userspace application that dynamically link to glibc will use vDSO automatically.

[vsyscall and vDSO](http://terenceli.github.io/%E6%8A%80%E6%9C%AF/2019/02/13/vsyscall-and-vdso)

## vsyscall emulation

CONFIG_X86_VSYSCALL_EMULATION

```c
// handle_page_fault -> do_user_addr_fault
extern bool emulate_vsyscall(unsigned long error_code,
			     struct pt_regs *regs, unsigned long address);
```

# vDSO

**Any security problems?**

Clearly, only "read-only" system calls are valid candidates for this type of emulation because user-space processes are not allowed to write into the kernel address space. User-space functions that emulate system calls are called virtual system calls.

The Linux vDSO implementation on `x86_64` offers four of these virtual system calls: `__vdso_clock_gettime()`, `__vdso_gettimeofday()`, `__vdso_time()`, and `__vdso_getcpu()`. They correspond, respectively, to the standard clock_gettime(), gettimeofday(), time(), and getcpu() system calls.

[Implementing virtual system calls [LWN.net]](https://lwn.net/Articles/615809/)

**Even if the system call is read-only, but some instructions are only valid in kernel mode(Ring 0), How to make sure these instructions can be executed correctly?**

vDSO will change to Ring 0, what it eliminate is the cost of context switch.

[RISC-V Syscall 系列 4：vDSO 实现原理分析 - 泰晓科技](https://tinylab.org/riscv-syscall-part4-vdso-implementation/)
