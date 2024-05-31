---
categories: Migration
title: QEMU Live Migration Capabilities
---

带 X 的 capability 表示还是 unstable 的。

所有的 Migration capabilities 默认都是 disable 的：

```c
// 这里的这个 false 表示 default value 就是 false。
#define DEFINE_PROP_MIG_CAP(name, x)             \
    DEFINE_PROP_BOOL(name, MigrationState, capabilities[x], false)
```

```c
typedef enum MigrationCapability {
    //...
    MIGRATION_CAPABILITY_MULTIFD,
    //...
} MigrationCapability;
```

### `MIGRATION_CAPABILITY_SWITCHOVER_ACK` QEMU

很新的 capability，QEMU 8.1 才加入。

src 端如果没有收到 dst 的 switchover 的 ack，就不会进入 blackout phase (`migration_completion()`)。

dst 端的每一个 device 都同意了（目前主要是 vfio 在用），dst 才会发送 ack 给 src 端。

`@switchover-ack`: If enabled, migration will not stop the source VM and complete the migration until an ACK is received from the destination that it's OK to do so. Exactly when this ACK is sent depends on the migrated devices that use this feature. For example, a device can use it to make sure some of its data is sent and loaded in the destination before doing switchover. This can reduce downtime if devices that support this capability are present. **'return-path' capability must be enabled to use it.** (since 8.1).

```
+----------------------+-----------------------+----------+
|    Switchover ack    | VFIO device data size | Downtime |
+----------------------+-----------------------+----------+
|       Disabled       |         300MB         |  1900ms  |
|       Enabled        |         300MB         |  420ms   |
+----------------------+-----------------------+----------+
```

The purpose of this capability is to reduce migration downtime in cases where loading of migration data in the destination can take a lot of time.

Patchset 里的 background 这一栏讲的很清楚：

[[PATCH v6 0/8] migration: Add switchover ack capability and VFIO precopy support - Avihai Horon](https://lore.kernel.org/all/20230621111201.29729-1-avihaih@nvidia.com/)

### `MIGRATION_CAPABILITY_X_IGNORE_SHARED` QEMU

If enabled, QEMU will not migrate shared memory that is accessible on the destination machine. (since 4.0).

### `MIGRATION_CAPABILITY_LATE_BLOCK_ACTIVATE` QEMU

Don't activate the block devices if we're not going to auto-start the VM when the migration is finished.

```c
If enabled, the destination will not activate block devices (and thus take locks) immediately at the end of migration.
```

### `MIGRATION_CAPABILITY_RELEASE_RAM` QEMU

commit 53f09a1076f5efbba7d751a8005e2fcf008606db

主要针对 post-copy 场景优化的。

This feature frees the migrated memory on the source during postcopy-ram migration. In the second step of postcopy-ram migration when the source vm is put on pause we can free unnecessary memory.

### `MIGRATION_CAPABILITY_POSTCOPY_RAM` QEMU

The 'postcopy ram' capability allows postcopy migration of RAM.

这个就是最正统的 post-copy 的 capability。