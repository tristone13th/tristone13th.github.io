---
categories: QEMU
title: Notifiers in QEMU
---

QEMU 里的 notifier 机制很简单，和 Kernel 里的 notifier 不是一回事，要区分开。

大部分代码都在 `util/notify.c` 中，这个文件甚至只有 76 行代码。

# `include/qemu/notify.h`

### `struct Notifier` QEMU

```c
struct Notifier
{
    // 一个 notifier 就是一个函数
    void (*notify)(Notifier *notifier, void *data);
    // 表示 notifier 之间可以形成一个链表，比如 NotifierList
    QLIST_ENTRY(Notifier) node;
};
```

### `struct NotifierList` QEMU

很简单，就是一个 Notifier 的列表：

```c
typedef struct NotifierList
{
    QLIST_HEAD(, Notifier) notifiers;
} NotifierList;
```

### `NotifierWithReturn` QEMU

看起来和 `struct Notifier` 很像，区别在于这个函数是有返回值的，

- Return 0 on success (next notifier will be invoked), otherwise
- `notifier_with_return_list_notify()` will stop and return the value.

而 `struct Notifier` 很简单，不管成功与否，都会执行下一个，因为返回值是 void。

```c
struct NotifierWithReturn {
    int (*notify)(NotifierWithReturn *notifier, void *data);
    QLIST_ENTRY(NotifierWithReturn) node;
};
```

### `NotifierWithReturnList` QEMU

`NotifierWithReturnList` 和 `NotifierWithReturn` 的关系，类似于 `NotifierList` 对于 `Notifier` 的关系。

```c
typedef struct NotifierWithReturnList {
    QLIST_HEAD(, NotifierWithReturn) notifiers;
} NotifierWithReturnList;
```

# `util/notify.c`

`notifier_list_init`, `notifier_list_add`, `notifier_remove` 这些函数都没有必要介绍了，望文生义。

`notifier_with_return_list_init`, `notifier_with_return_list_add`, `notifier_with_return_remove` 是对应的 `ReturnList` 版本，也不用多说。

### `notifier_list_notify()` QEMU

很简单一函数，无需赘言。

```c
void notifier_list_notify(NotifierList *list, void *data)
{
    //...
    QLIST_FOREACH_SAFE(notifier, &list->notifiers, node, next) {
        notifier->notify(notifier, data);
    }
}
```

### `notifier_with_return_list_notify()` QEMU

一个一个 notifier 调用，成功就下一个，不成功就直接返回 ret。

```c
int notifier_with_return_list_notify(NotifierWithReturnList *list, void *data)
{
    //...
    QLIST_FOREACH_SAFE(notifier, &list->notifiers, node, next) {
        ret = notifier->notify(notifier, data);
        if (ret != 0)
            return ret;
    }
    //...
}
```
