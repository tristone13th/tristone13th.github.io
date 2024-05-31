---
categories: QEMU
title: Notifiers in QEMU Live Migration
---

总结，notifiers for Pre-copy 和 Post-copy 主要是 virtio 和 vhost 在用，可以先不看。

# Notifiers for Pre-copy

## `precopy_notifier_list` / QEMU

这是一个全局的变量，专为 precopy 设计：

```c
static NotifierWithReturnList precopy_notifier_list;
```

`precopy_infrastructure_init()` 负责初始化（不重要）：

```c
main
    qemu_init
        qemu_init_subsystems
            precopy_infrastructure_init
                notifier_with_return_list_init
                    QLIST_INIT(&list->notifiers);
```

`precopy_add_notifier()` 负责添加 callback 函数，目前看来只有 virtio 相关的 code 调用了这个函数来加 notifier，暂时先不看：

```c
precopy_add_notifier
    notifier_with_return_list_add
        QLIST_INSERT_HEAD(&list->notifiers, notifier, node);
```

`precopy_notify()` 负责进行通知：

```c
precopy_notify
    notifier_with_return_list_notify^
```

# Notifiers for Post-copy

## `postcopy_notifier_list` / QEMU

这是一个全局的变量，专为 postcopy 设计：

```c
static NotifierWithReturnList postcopy_notifier_list;
```

`postcopy_infrastructure_init()` 负责初始化（和 Pre-copy 其实是一样的）：

```c
main
    qemu_init
        qemu_init_subsystems
            postcopy_infrastructure_init
                notifier_with_return_list_init
                    QLIST_INIT(&list->notifiers);
```

`postcopy_add_notifier()` 负责添加 callback 函数（目前是 vhost 在用，先不管）：

```c
postcopy_add_notifier
    notifier_with_return_list_add
        QLIST_INSERT_HEAD(&list->notifiers, notifier, node);
```

`postcopy_notify()` 负责进行通知：

```c
postcopy_notify
    notifier_with_return_list_notify^
```