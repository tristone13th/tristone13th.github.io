---
categories: 操作系统
title: Memory Segmentation in x86
---

### 为什么要分段？/ GDT / LDT

**分段的 16bit 时代**：

早在 16 位的 8086 时代，CPU 为了能寻址超过 16 位地址能表示的最大空间（64KB），引入了段寄存器。通过将内存空间划分为若干个段，然后采用段基地址 + 段内偏移的方式访问内存，这样能访问 1MB 的内存空间了！

在那个时候，段寄存器中存放的是段基地址，注意，是一个地址。 所以，在通过 `ip` 寄存器读取指令的时候，实际上是 `cs:ip` 也就是读的代码段的基址加上 `ip` 里存的地址，通过 `sp` 寄存器访问栈的时候，实际上是 `ss:sp` 也就是堆栈段的基址加上存在 `sp` 里面的地址。

**分段的 32bit 时代**：

进入 32 位时代后，情况已经发生了翻天覆地的变化。

- 段寄存器又增加了两个：fs、gs，这两个段寄存器有特殊用途。
- 段寄存器里面存放的不再是段基地址，而是一个叫段选择子的东西。

段寄存器是 16 位的宽度，原来这 16 位是个物理内存地址，但现在，段寄存器中存放的是一个号码，什么号码呢？是一个表格中表项的号码，这个表，有可能是全局描述符表 GDT，也有可能是局部描述符表 LDT。

那到底是哪个表？是由段选择子从低到高的第三位来决定的，如果这一位是 0，则是 GDT，否则就是 LDT。这两个表的表项叫做段描述符，描述了一个内存段的信息，比如段的基地址、最大长度、访问属性等等一系列信息。The GDT is a table that the OS, privilege level 0, controls, while the LDT is controlled by the user application。

CPU 中单独添置了两个寄存器，用来指向这两个表，分别是 GDTR 和 LDTR。在寻址的时候，CPU 首先根据段寄存器中的号码，通过 GDTR/LDTR 来到 GDT/LDT 中取出对应的段描述符，然后再取出这个段的基地址，最后再结合段内的偏移，完成内存寻址。

1. GDT have only one copy in system while LDT can have many
2. GDT may not changed during execution which LDT often changes when task switches
3. entry of LDT is save in GDT. Entries in GDT and LDT have the same structure.

The GDT is used to store memory blocks containing supervisor code, such as interrupt/exception handlers, and the blocks used by the kernel itself, so they are system-wide.

A separate LDT can be used per task. Switching process involves loading a different LDT into the LDTR register.

Each task can see the memory blocks whose descriptors are, either referenced in the current LDT, or in the GDT. For user mode memory access, it will use local descriptors. For system calls, it can use various techniques, for example the INT instruction. This instruction effectively jumps to a code resident in a descriptor from the GDT

[How are LDT and GDT used differently in intel x86? - Stack Overflow](https://stackoverflow.com/questions/34243432/how-are-ldt-and-gdt-used-differently-in-intel-x86)

**现代操作系统是如何使用分段机制的？（适用于 32bit 的情况）**

现在操作系统到底用的哪种方式？ 好像是分页，但为什么段寄存器好像还是有，到底是怎么一回事？ 先说结论，答案就是：分段 + 分页相结合的内存管理方式

首先要明确一个前提，这一点非常非常重要：无论是分段还是分页，这都是 x86 架构 CPU 的内存管理机制，这俩是同时存在的（保护模式下），并不是让操作系统二选一！ 既然是同时存在的，那为什么现在将内存地址翻译时，都是讲分页，而很少谈到分段呢？

这一切的一切，都是因为一个原因：操作系统通过巧妙的设置，‘屏蔽’了段的存在。

[现代操作系统管理内存，到底是分段还是分页，段寄存器还有用吗？ - 轩辕之风 - 博客园](https://www.cnblogs.com/xuanyuan/p/15266447.html)

这篇文章的段寄存器一部分详细介绍了 Windows 以及 Linux 两大操作系统如何使用段（实验表明其实段根本就没有用）。除了一个作用，用来给代码段加 RE 属性，表示可读可执行；给数据段加 RW 属性，表示可读可写。但是既然大家段的区间都是完全重合的，那么怎么保证代码段就是不可写的，数据段就是不可执行的呢？

**分段的 64bit 时代**：

64bit 下，不管你的段寄存器 CS/DS/ES/SS 中指向的段基址是什么内容，段基址都会被当成 0 来对待。

以上内容主要借鉴自博客 [现代操作系统管理内存，到底是分段还是分页，段寄存器还有用吗？ - 轩辕之风 - 博客园](https://www.cnblogs.com/xuanyuan/p/15266447.html)

### 如何保证代码段（.text）的内容是只读的？

因为段在 64bit 已经不能用了，所以其实是通过分页来使用页里的 permission 来保证的。

[c - How is text segment made read-only? - Stack Overflow](https://stackoverflow.com/questions/59870800/how-is-text-segment-made-read-only)