---
categories: Migration
title: Sections in QEMU Live Migration
---

Section 是 device 里的概念。

[Migration — QEMU documentation](https://www.qemu.org/docs/master/devel/migration.html#iterative-device-migration)

下面是 section header，用来表示不同的 section。一个 section header 是 1 byte。

```c
// First section containing information on the device. In the case of RAM this transmits a list of RAMBlocks and sizes.
// See function savevm_ram_handlers->save_setup()
#define QEMU_VM_SECTION_START        0x01
// A mortal in the various sections
#define QEMU_VM_SECTION_PART         0x02
// The last section for the device containing any remaining data.
// See function savevm_ram_handlers->save_live_complete_precopy()
#define QEMU_VM_SECTION_END          0x03
// 表示应该在不同 SECTION 里的内容都放到这一个 SECTION 里来发送了。
// 所以 destination 端对这个 SECTION 的处理和 START 是一样的。
// ram 并不以 FULL 的方式发送，所以这个和 ram 无关，以 FULL 方式发送的设备有
// timer, tdx-guest, cpu_common, cpu, ioapic...
#define QEMU_VM_SECTION_FULL         0x04
```

Each section contains a device, or one **iteration** of a device save. For **non-iterative** devices they have a single section; **iterative** devices have 3 different section types:

- an initial and,
- and last section and,
- a set of parts in between.

The **ID string** of each section is normally unique, having been formed from a bus name and device address.

https://www.qemu.org/docs/master/devel/migration.html#stream-structure

**为什么要把 START, PART, 和 END 区分开呢，都是 PART 不好吗？**

首先 START 是要和另外两者分开的，因为 START 是第一次发送，需要发送 version id 过去来保证兼容性。

根据 destination 端接受的情况来看，确实没什么必要来区分 PART 和 END，因为两者是不加区分的。

怎样知道一个 section 已经结束了呢，通过 section footer：

```c
#define QEMU_VM_SECTION_FOOTER       0x7e

static void save_section_footer(QEMUFile *f, SaveStateEntry *se)
{
    if (migrate_get_current()->send_section_footer) {
        qemu_put_byte(f, QEMU_VM_SECTION_FOOTER);
        qemu_put_be32(f, se->section_id);
    }
}
```

当 source 端决定结束这个 section 时，会发送一个 section footer 过去，用来表示正在发送的这个 section 已经结束了。

所以发送的数据结构是这样的：

- Section header:
    - Section type (1 byte): like `QEMU_VM_SECTION_START`
    - Section id (4 bytes): the section's id
- section data: …
- Section footer (如果开启了 `send-section-footer` property 的话):
    - End mark (1 byte): `QEMU_VM_SECTION_FOOTER`
    - Section id (4 bytes): the section's id

### How many sections used to live migrate RAM? QEMU

Not just 1, because in `qemu_savevm_state_iterate()`:

```c
QTAILQ_FOREACH(se, &savevm_state.handlers, entry) {
    //...
    save_section_header(f, se, QEMU_VM_SECTION_PART);
    //...
}
```

We use `QEMU_VM_SECTION_PART` rather than `FULL`.

### Who is responsible for flushing the data when sending section's header?

举个例子，对于 `QEMU_VM_SECTION_END`，发送端是这样的：

```c
save_section_header(f, se, QEMU_VM_SECTION_END);
```

我们需要保证这个 section header 能及时地 flush（`qemu_fflush`） 过去，这件事是谁来做的？

好像并不需要及时 flush 过去，在每一个 section 结束的时候 flush 也可以？这个的确是会有的。

### Subsection

Subsections are **also** represented by the `VMStateDescription` struct.

A subsection is “like” a device vmstate, but it has a Boolean function that tells if that values are needed to be sent or not. Subsections have a unique name, that is looked for on the receiving side. So on the receiving side, if we found a subsection for a device that we don’t understand, we just fail the migration.

```c
static bool ide_drive_pio_state_needed(void *opaque)
{
    //...
}

const VMStateDescription vmstate_ide_drive_pio_state = {
    .name = "ide_drive/pio_state",
    //...
    .needed = ide_drive_pio_state_needed,
};

const VMStateDescription vmstate_ide_drive = {
    .name = "ide_drive",
    //...
    .subsections = (const VMStateDescription*[]) {
        &vmstate_ide_drive_pio_state,
        NULL
    }
};
```

Sometimes, it is not enough to be able to save the state directly from one structure, we need to fill the correct values there. One example is when we are using KVM. Before saving the CPU state, we need to ask KVM to copy to QEMU the state that it is using. And the opposite when we are loading. The functions to do that are inside a vmstate definition: `pre_load`, `post_load`, `pre_save` and `post_save`.