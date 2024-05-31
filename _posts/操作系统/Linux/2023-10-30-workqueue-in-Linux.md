---
categories: Linux
title: Workqueue in Linux
---

Work queues are added in the Linux kernel 2.6 version. Work queues are a different form of deferring work. Work queues defer work into a kernel thread; this bottom half always runs in the process context. Because workqueue allows users to create a kernel thread and bind work to the kernel thread.

Work queues are a different form of deferring work. Work queues defer work into a kernel thread; this bottom half always runs in the process context. So, this will run in the process context and the work queue can sleep. Normally, it is easy to decide between using workqueue and softirq/tasklet:

- If the deferred work needs to sleep, then `workqueue` is used.
- If the deferred work needs not sleep, then `softirq` or `tasklet` are used.

[Mastering Workqueue in Linux Kernel Programming | Full Tutorial](https://embetronicx.com/tutorials/linux/device-drivers/workqueue-in-linux-kernel/)

A "workqueue" is a list of tasks to perform, along with a (per-CPU) kernel thread to execute those tasks.

# Linux Workqueue Interface

### `create_workqueue()` Kernel

Tasks to be run out of a workqueue need to be packaged in a work_t structure.

### `DECLARE_WORK()` Kernel

Declare and initialize a `work_t` strucure at **compile time**.

### `INIT_WORK()` / `PREPARE_WORK()` / Kernel

Set up a `work_t` structure at **run time**.

The difference between the two is that `INIT_WORK` initializes the linked list pointers within the work_t structure, while `PREPARE_WORK` changes only the function and data pointers. `INIT_WORK` must be used at least once before queueing the work_t structure, but should not be used if the work_t might already be in a workqueue.

### `queue_work()` / `queue_delayed_work()` Kernel

The second form of the call ensures that a minimum delay (in jiffies) passes before the work is actually executed.

### `flush_workqueue()` Kernel

Entries in workqueues are executed at some undefined time in the future, when the associated worker thread is scheduled to run.

This call is to wait until all workqueue entries have actually run.

Note that if the queue contains work with long delays, or if something keeps refilling the queue, this call could take a long time to complete.

### `destroy_workqueue()` / Kernel

**Flush** the queue, then delete it.

### `schedule_work()` / `schedule_delayed_work()` / Kernel

当然，有一些 work 就是简单的想执行，并不想再刻意定义一个 workqueue 包含它们，这种情况可以调用这两个函数用全局的 queue。

### `flush_scheduled_work()` Kernel

Wait for everything on this global queue to be executed.
