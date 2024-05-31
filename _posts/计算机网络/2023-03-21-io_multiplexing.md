---
categories: 计算机网络
title: I/O Multiplexing
---

# Terminology

### Event

**For epoll**:

EPOLLIN, EPOLLOUT, etc.

[epoll_ctl - Linux manual page](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html)

**For poll**:

POLLIN, POLLOUT, etc.

[poll - Linux manual page](https://man7.org/linux/man-pages/man2/poll.2.html)

**For select**:

select doesn't have a concept of `event`, it seems it just wait for the fd to be "ready".

poll offers somewhat more flavors of events to wait for, and to receive, although for most common networked cases they don't add a lot of value.

[poll vs select vs event-based](https://daniel.haxx.se/docs/poll-vs-select.html)

## Epoll

The central concept of the epoll API is the epoll instance.

[epoll(7) - Linux manual page](https://man7.org/linux/man-pages/man7/epoll.7.html)

epoll is a kernel module.

epoll 本身也是一个文件系统，这也是 epoll 在 fs/eventpoll.c 下面实现的原因。

用户空间调用 epoll_create (0) 或 epoll_create1 (int)，其实质就是在名为 "eventpollfs" 的文件系统里创建了一个新文件，同时为该文件申请一个 fd，绑定一个 inode，最后返回该文件句柄。

[epoll源码分析 \| 荒野之萍](https://icoty.github.io/2019/06/03/epoll-source/)

### Edge-trigger and level-trigger

default is level-triggered.

Edge-triggered mode delivers events only when changes occur on the monitored file descriptor.

[The edge-triggered misunderstanding [LWN.net]](https://lwn.net/Articles/864947/)

This edge-triggered mode is what makes `epoll` an *O(1)* I/O multiplexer: the `epoll_wait` call will suspend immediately, and since a list is maintained for each file descriptor ahead of time, when new data comes in the kernel immediately knows what processes must be woken up in *O(1)* time.

Here's a more worked out example of the difference between edge-triggered and level-triggered modes. Suppose your read buffer is 100 bytes, and 200 bytes of data comes in for that file descriptor. Suppose then you call `read` exactly one time and then call `epoll_wait` again. There's still 100 bytes of data already ready to read. In level-triggered mode the kernel would notice this and notify the process that it should call `read` again. By contrast, in edge-triggered mode the kernel would immediately go to sleep. If the other side is expecting a response (e.g. the data it sent is some kind of RPC) then the two sides will "deadlock", as the server will be waiting for the client to send more data, but the client will be waiting for the server to send a response.

**To use edge-triggered polling you must put the file descriptors into nonblocking mode. Then you must call `read` or `write` until they return `EWOULDBLOCK` every time.** If you fail to meet these conditions you will miss notifications from the kernel. But **there's a big upside of doing this: each call to `epoll_wait` will be more efficient, which can be very important on programs with extremely high levels of concurrency.**

[Blocking I/O, Nonblocking I/O, And Epoll](https://eklitzke.org/blocking-io-nonblocking-io-and-epoll)

**Why edge-triggered in *O(1)*?*

# Epoll

这些值得好好看看：

[Implementation of Epoll ❚ fd3kyt's blog](https://fd3kyt.github.io/posts/implementation-of-epoll/#LDD33)

[epoll - Datong's Random Thoughts](https://idndx.com/tag/epoll/)

[linux 源码角度看 epoll - JackTang's Blog](https://jacktang816.github.io/post/epollsourceview/)

[从linux源码看epoll - 知乎](https://zhuanlan.zhihu.com/p/116901360)

This RBT (Red Black Tree) is mainly used by `epoll_ctl` and other management functions. Getting the ready events and `epoll_wait` use other data structures instead of this RBT.

## Struct eppoll_entry

## Struct eventpoll

>Represents the main data structure for the eventpoll interface.

`eventpoll` 表示 epoll instance 本身。

### queues/lists In eventpoll

```c
struct eventpoll {
	//...
	/*
	 * Wait queue used by sys_epoll_wait()
	 * entry is process
	 */
	wait_queue_head_t wq;

	/* 
	 * Wait queue used by file->poll()
	 * entry is process
	 */
	wait_queue_head_t poll_wait;

	/* List of ready file descriptors */
	struct list_head rdllist;

	/*
	 * This is a single linked list that chains all the "struct epitem" that
	 * happened while transferring ready events to userspace w/out
	 * holding ->lock.
	 */
	struct epitem *ovflist;
	//...
};

```

## Struct epitem

>Each **file descriptor** added to the eventpoll interface will have an entry of this type linked to the "rbr" RB tree.

`epitem` 是红黑树的节点。多个 `epitem` 从属于一个 `eventpoll`。

In current implementation, an `epitem` may be add into several containers, including:

- `eventpoll.rbr`, a red-black tree of all registered `epitem`
- `eventpoll.rdllist`, a list of `epitem` representing ready file descriptors
- `file.f_ep_links`, a list of all the `epitem` referencing this file

## Struct ep_pqueue

Just a wrapper for convenience.

```c
struct ep_pqueue {
	poll_table pt;
	struct epitem *epi;
};
```

## Struct eppoll_entry

## \_\_pollwait()

The `__pollwait()` function in the Linux kernel code is used to add a **wait queue entry** for a given file descriptor that has requested to be polled for events. When called, it inserts the current process into the wait queue associated with the file descriptor and blocks until an event occurs or a timeout expires. Once the event or timeout happens, the process is woken up and removed from the wait queue. This function is used by various system calls such as poll(), epoll_wait() etc. to efficiently wait for multiple file descriptors at once.

## \_\_ep_eventpoll_poll()

```c
static __poll_t __ep_eventpoll_poll(struct file *file, poll_table *wait, int depth)
{
	struct eventpoll *ep = file->private_data;
	LIST_HEAD(txlist);
	struct epitem *epi, *tmp;
	poll_table pt;
	__poll_t res = 0;

	init_poll_funcptr(&pt, NULL);

	/*
	 * Insert inside our poll wait queue, 当 epoll_fd 是被 select, poll 来执行时，
	 * wait 就是 ->poll() 时传进来的 poll_table，是有函数的；当是 epoll 递归过来的时候，函数是空的。
	*/
	poll_wait(file, &ep->poll_wait, wait);

	/*
	 * Proceed to find out if wanted events are really available inside
	 * the ready list.
	 */
	mutex_lock_nested(&ep->mtx, depth);
	ep_start_scan(ep, &txlist);
	list_for_each_entry_safe(epi, tmp, &txlist, rdllink) {
		if (ep_item_poll(epi, &pt, depth + 1)) {
			res = EPOLLIN | EPOLLRDNORM;
			break;
		} else {
			/*
			 * Item has been dropped into the ready list by the poll
			 * callback, but it's not actually ready, as far as
			 * caller requested events goes. We can remove it here.
			 */
			__pm_relax(ep_wakeup_source(epi));
			list_del_init(&epi->rdllink);
		}
	}
	ep_done_scan(ep, &txlist);
	mutex_unlock(&ep->mtx);
	return res;
}
```

这个函数很有意思，有两个地方可以调用到这个函数：

- `ep_eventpoll_poll()`
- `ep_item_poll

**第一个地方**，也就是：

```c
static const struct file_operations eventpoll_fops = {
    //...
	.poll		= ep_eventpoll_poll,
    //...
};

static __poll_t ep_eventpoll_poll(struct file *file, poll_table *wait)
{
	return __ep_eventpoll_poll(file, wait, 0);
}
```

是为了 **当我们 select 或者 poll 一个 epollfd 时起作用的**。select 和 poll 会调用每一个 fd 自己的 `->poll` 函数，对于传入 `->poll` 的 poll_table 里的 qproc 函数，有以下可能：

- 当是 select 时，函数是 `__pollwait`；
- 当是 poll 时，函数也是 `__pollwait`。

可见 select 和 poll 在底层的实现上有一些共享的地方。这个函数会在 `__ep_eventpoll_poll()` 的 `poll_wait` 里面调用。

**第二个地方**，也就是 `ep_item_poll()`：

```c
static __poll_t ep_item_poll(const struct epitem *epi, poll_table *pt,
				 int depth)
{
	struct file *file = epi->ffd.file;
	__poll_t res;

	pt->_key = epi->event.events;
	if (!is_file_epoll(file))
		res = vfs_poll(file, pt);
	else
		res = __ep_eventpoll_poll(file, pt, depth);
	return res & epi->event.events;
}
```

`ep_item_poll` 起先是在 epoll_wait 那里调用的，它表示我们使用的 epoll_instance 有 epitem 是 epollfd，也就是我们遇到了 nested epoll 的情况。

## 架构

### 等待队列

每一个 fd/socket 有一个等待队列。队列元素是 **进程**。

select: 把当前进程加入每一个监听 fd 的等待队列，如果有某一个 fd 有数据带来，会唤醒。

**因为 epoll_fd 本身也是一个 fd，所以他也有等待队列。**

**如果一个 fd 加入到了 epoll_fd 里面，那么这个进程同时存在于两个等待队列里面吗？**

### 就绪列表（epoll 特有）

就绪列表（rdllink）：epoll 特有的概念，当唤醒后可以知道是哪些 fd 就绪了，这样就不需要再遍历一遍了，其中的元素是 `epitem`。通过 internal link (list_head) 来实现：

不要把这个就绪列表和 CPU 的 Process 就绪队列^搞混。

[如果这篇文章说不清 epoll 的本质，那就过来掐死我吧！ - 知乎](https://zhuanlan.zhihu.com/p/63179839)

|            | 等待队列 | 就绪列表       |
| ---------- | -------- | -------------- |
| Owner      | fd       | epoll instance |
| Entry type | Process  | fd (epitem)    |

So you can roughly think that:

- 1 epoll instance corresponds to multiple fds;
- 1 fd corresponding s to multiples processes.

## 实现

### epoll_ctl(EPOLL_CTL_ADD)

```c
// do_epoll_ctl
//     ep_insert
static int ep_insert(struct eventpoll *ep, const struct epoll_event *event,
		     struct file *tfile, int fd, int full_check)
```

`ep_insert` do most of the job:

- Create and add the `epitem` of the fd into the RBT: `ep_rbtree_insert(ep, epi);`
- Prepare the callback function `ep_ptable_queue_proc` for modifying "readiness"-related queues in `epitem`: `init_poll_funcptr(&epq.pt, ep_ptable_queue_proc);
- Make some modifications on the "readiness"-related queues in `epitem`: `ep_item_poll`, which will pass the `ep_ptable_queue_proc` function as a callback argument when calling `.poll` VFS file operation.

What will `ep_ptable_queue_proc` do?

- Add a `wait_queue_entry` to the wait queue ("readiness"-related queue), with the callback function set as `ep_poll_callback`. This function will be called when the queue is "activated(wake up)".

What will `ep_poll_callback` do?

- Add this epitem to the epoll instance's ready list (`list_add_tail_lockless(&epi->rdllink, &ep->rdllist)`). So when `epoll_wait` return, it will know which file descriptors have new events.
- "activate(`wake_up()`)" the wait queue for the `epitem`'s corresponding epoll instance. i.e., `wake_up(&ep->wq);`, each item in this queue is a process, the callback function is `ep_autoremove_wake_function()`.

Because

- 1 **file struct** (fd) can link to multiple **epitem**s (let's say we created 2 epoll instances and run 2 epoll_wait() both in a single thread), and,
- 1 **epitem** corresponds to 1 epoll instance (not vice versa!), which can have multiple **process**es blocking on it (The reason is [linux - When will an epoll instance shared by multiple processes? - Stack Overflow](https://stackoverflow.com/questions/75293582/when-will-an-epoll-instance-shared-by-multiple-processes?noredirect=1#comment132861666_75293582)).

So we

- first use `ep_ptable_queue_proc` (actually, this one is called by the corresponding file's `poll()` file operation) to append an epitem to the file struct's wait queue and add the callback `ep_poll_callback` for it.
- When there is new data, the file's wait queue is activate, which means the function `ep_poll_callback` on each epitem will be executed.
- When `ep_poll_callback` on an epitem is executed, the epitem's wait queue is also activated, which means the function `space` on each process will be executed.

When will the queue (the queue hold by an `struct file`) be **activated**?

```
unix_stream_sendmsg
	other->sk_data_ready() (sock_def_readable)
		wake_up_interruptible_sync_poll
			__wake_up_sync_key
				__wake_up_common_lock
					__wake_up_common
```

Note:

- The wait queue is hold by each file.
- Each entry in wait queue can be transformed to an `epitem`, so when the callback `ep_poll_callback` is invoked, it can retrieve the corresponding `epitem`.

### epoll_wait()

When will the process(the process call `epoll_wait`) be added into the epoll instance's wait queue `ep->wq`?

```c
// epoll_wait
//     do_epoll_wait
//         ep_poll
static int ep_poll(struct eventpoll *ep, struct epoll_event __user *events,
		   int maxevents, struct timespec64 *timeout)
{
	//...
	while (1) {
		//...
		init_wait(&wait); // will set the private to current, i.e., the current process
		wait.func = ep_autoremove_wake_function;
		if (!eavail)
			__add_wait_queue_exclusive(&ep->wq, &wait);
		//...
	}
	//...
}
```