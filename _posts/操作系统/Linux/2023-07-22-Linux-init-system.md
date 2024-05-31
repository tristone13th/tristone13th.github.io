---
categories: Linux
title: Linux Init System
---

An **init system** is the first program, other than the kernel, to be run after a Linux distribution is booted.

Linux 系统中所有其他进程都是直接或间接由 init 进程启动的， 因此 init 进程是其他所有进程的父进程或祖先进程。

如果一个子进程的父进程退了，那么这个子进程会被挂到 PID 1 下面。（注：PID 0 是内核的一部分，主要用于内进换页，参看：[Process identifier](https://en.wikipedia.org/wiki/Process_identifier)）

[Comparison of init systems - Gentoo Wiki](https://wiki.gentoo.org/wiki/Comparison_of_init_systems)

[Linux PID 1 和 Systemd \| 酷 壳 - CoolShell](https://coolshell.cn/articles/17998.html)

### A service management program must be started as init?

### What's the relationship with `networkd`?

### Why everyone hates `systemd`?

[Everyone Hates systemd. Exploring one of Linux’s most heated holy wars | Sunny Beatteay | Better Programming](https://betterprogramming.pub/why-most-linux-users-hate-systemd-c591eef3d034)

`exec()` will preserve file descriptors: [c - Does exec preserve file descriptors - Stack Overflow](https://stackoverflow.com/questions/22241000/does-exec-preserve-file-descriptors)

# Terminologies

### Logind

Seat: A **seat** consists of all hardware devices assigned to a specific workplace. It consists of at least one graphics device, and usually also includes keyboard, mouse. It can also include video cameras, sound cards and more. Seats are identified by seat names. "seat0" always exists.

Session: A **session** is defined by the time a user is logged in until he logs out. A session is bound to one or no seats (the latter for 'virtual' ssh logins). Multiple sessions can be attached to the same seat, but only one of them can be active, the others are in the background.

User: A **user** (the way we know it on Unix) corresponds to the person using a computer. A single user can have opened multiple sessions at the same time.

multi-session: A **multi-session** system allows multiple user sessions on the same seat at the same time. Linux+systemd qualifies.

multi-seat: A multi-seat system allows multiple independent seats that can be individually and simultaneously used by different users. Linux+systemd qualifies.

[multiseat](https://www.freedesktop.org/wiki/Software/systemd/multiseat/)
