---
categories: Virtualization
title: Interrupt Virtualization & APICv
---

# Interrupt Virtualization VMCS fields

### `external-interrupt exiting` VMCS field

non-root 模式下接收到外部中断后，会产生 VM Exit。

### `Acknowledge interrupt on exit` VMCS field

所以说 `external-interrupt exiting` 应该是一个前置的设置。

This control affects **VM exits due to external interrupts** (see `external-interrupt exiting`), when that occurred:

- If this control is 1, the logical processor acknowledges the interrupt controller, acquiring the interrupt’s vector. The vector is stored in the **VM-exit interruption-information** field, which is marked valid.
- If this control is 0, the interrupt is not acknowledged and the **VM-exit interruption-information** field is marked **invalid**.

```c
#define VM_EXIT_ACK_INTR_ON_EXIT                0x00008000
```

# APICv Overview

*SDM: CHAPTER 29 APIC VIRTUALIZATION AND VIRTUAL INTERRUPTS*（还没有看完）

[nakajima_0.2.pptx](https://www.linux-kvm.org/images/7/70/2012-forum-nakajima_apicv.pdf)

需要一些关于 APIC 在 bare-metal 上的前置知识。

一个 Virtual APIC Page 里包含了所有 APIC 的寄存器。是否开启这个 APIC 寄存器的虚拟化通过 VM-execution control 来控制。

VMCS has following **VM-execution controls**:

- **Virtual-interrupt delivery**. This controls enables the evaluation and delivery of pending virtual interrupts. It also enables the emulation of writes (memory-mapped (xAPIC) or MSR-based (x2APIC), as enabled) to the APIC registers that **control interrupt prioritization**.
- **Use TPR shadow**. This control enables emulation of accesses to the APIC’s task-priority register (TPR) via CR8 (Section 30.3) and, if enabled, via the memory-mapped or MSR-based interfaces.
- **Virtualize APIC accesses**. This control enables virtualization of memory-mapped accesses to the APIC by **causing VM exits** on accesses to a VMM-specified APIC-access page. Some of the other controls, if set, may cause some of these accesses to be emulated (请看 APIC-access page 和 virtual-APIC page 的区别) rather than causing VM exits. 也就是说这个 control 是一个基础，需要叠加其他的 controls 来使用。
- **Virtualize x2APIC mode**. This control enables virtualization of MSR-based accesses to the APIC。因为 x2APIC 相比于 xAPIC 一个不一样之处就在于允许 MSR 来访问 APIC 里的寄存器。
- **APIC-register virtualization.** Allows memory-mapped and MSR-based reads of most APIC registers (as enabled) by **satisfying them from the virtual-APIC page**. It directs memory-mapped writes to the APIC-access page to the virtual-APIC page, following them by VM exits for VMM emulation.

### Difference between `APIC-access page` and `virtual-APIC page` VMCS field

所有 CPU 访问自己的 LAPIC 使用相同的物理地址（这个物理地址会被 MMIO 到 LAPIC 里的寄存器而不是真的物理地址，因为 LAPIC 是每一个 CPU 都有的，所以寄存器是不一样的），那么 guest 中两个 vCPU 访问自己的虚拟 LAPIC 也用相同的物理地址，但一个 guest 只有一套 EPT 机制，所以最后所有都会导向同一个 page，无法做区分，怎么办？

APIC-access page 和 virtual-APIC page，这两个 page 的物理地址写在 VMCS 中，

- 一个 guest 只有一个 APIC-access page，
- 每个 vCPU 有一个 virtual-APIC page。

EPT 把地址翻译指向 APIC-access page，但是当 vCPU 读写 LAPIC 的时候，会去 virtual APIC page 去拿数据，这样就能保证 vCPU 访问相同的物理地址拿到不同的结果，而且不需要 VMM 软件介入。可以得知：

- APIC-access page 主要是用来判断这个 vCPU 的内存操作是不是想访问 APIC register
- Virtual-APIC page 是真的存放这些 APIC register 数据的地方。当 hardware 发现想访问 APIC register 的时候，会把 access 导向这个 vCPU 的 Virtual-APIC page 的内容。

比如虚拟 CPU 读自己的 LAPIC ID，那结果肯定不一样，EPT 翻译到相同的地址，如果没重定向到 virtual-APIC page 那么结果就一样了。

# VMCS Fields for APIC Virtualization

## `APIC-access address` VMCS field

This field contains the physical address of the 4-KByte **APIC-access page**.

Guest 通过 linear address 访问一个 page 里的内容，如果这个 linear address 翻译得到的物理地址在这个 VMCS field 所指向的页内，那么**可能**会出现一个 VM-exit（也视其他 control 的值而定）。

Certain VM-execution controls enable virtualize certain accesses to the APIC-access **page without a VM exit**. In general, this virtualization causes these accesses to be made to the **virtual-APIC page** instead of the **APIC-access page**.

## Virtual-APIC Page / `Virtual-APIC Address` VMCS field

因为 APIC 在 bare-metal 上就是一个 page 包含了几乎所有的寄存器（除了几个 MSR？），所以对于其的虚拟化也搞到了一个 page 里面。

为了让 Guest 对其（虚拟）APIC 的访问不必引起 VM Exit，引入了 Virtual-APIC Page 的概念。它相当于是一个 Shadow APIC，Guest 对其 APIC 的**部分甚至全部访问**都可以被**硬件**翻译成对 Virtual-APIC Page 的访问，这样就不必频繁引起 VM Exit 了。我们可以通过 VMCS 中的 **Virtual-APIC Address** field 指定 Virtual-APIC Page 的物理地址。

Depending on the settings of **certain VM-execution controls**, the processor may virtualize **certain fields** on the virtual-APIC page. 要了解什么叫做 "virtualize"，可以看这个 field 和 `APIC-access address` 的区别。

**Virtualized APIC Registers** 是 Virtual-APIC Page 的一部分 fields。Depending on the setting of **certain VM-execution controls**, a logical processor may virtualize certain accesses to APIC registers using those fields：

- Virtual task-priority register (VTPR): 对应 bare-metal 的 TPR。
- Virtual processor-priority register (VPPR): 对应 PPR（我记得应该是只读的？）
- Virtual end-of-interrupt register (VEOI): 对应 EOI
- Virtual interrupt-service register (VISR): 对应 ISR
- Virtual interrupt-request register (VIRR): 对应 IRR
- Virtual interrupt-command register (VICR_LO) / Virtual interrupt-command register (VICR_HI): 对应 ICR。

## `virtualize APIC accesses` VMCS field

If this control is 1, the logical processor treats specially memory accesses using linear addresses that translate to physical addresses in the 4-KByte **APIC-access page**. (VM Exit)

## `APIC-register virtualization` VMCS field

控制要不要 virtualize 对于 APIC 里寄存器的访问。这里只列举 xAPIC 模式以 MMIO 的方式的访问，对于 x2APIC 模式以 MSR 的方式访问请参照另一个 VMCS field `virtualize x2APIC mode`。

如果要 virtualize，那么 A read access from the **APIC-access page** that is virtualized returns data from the corresponding page offset on the **virtual-APIC page**.

对于寄存器的写操作的处理要复杂一些。

## `virtualize x2APIC mode` VMCS field

因为 x2APIC mode 主要就是 enable 了以 MSR 的方式对于 APIC page 里的寄存器的访问。所以这个 control 主要是为了控制 RDMSR/WRMSR 的时候硬件会怎么处理。

对于这两个指令的处理不仅仅涉及到这个 control field，还和 `APIC-register virtualization`, `virtual-interrupt delivery`, `IPI virtualization` 等等相关。

简化来说，RDMSR 主要看 `APIC-register virtualization` 的值，如果是 1 那么就直接从 virtual APIC page 里对应的 offset 来读；如果不是那么就作为一个 normal 的 MSR access 来处理，走那一套流程。

WRMSR 有点复杂，可以看 *30.5 VIRTUALIZING MSR-BASED APIC ACCESSES*。

## `Virtual-interrupt Delivery` VMCS field

首先得明白什么是 evaluate, recognize 和 deliver：

- evaluate 指的是当有中断发生的时候，根据 RVI 和 VPPR 的优先级比较来 mask 这个 interrupt 的这个动作
- recognize 指的是这个动作的结果。

开启之后，会启动 **evaluate** pending interrupt, **recognize** and **deliver** it 机制。具体的，一些操作之前不会做这些事，但是开启之后一些动作会触发这个机制，比如 VM entry; TPR virtualization; EOI virtualization; self-IPI virtualization; and posted-interrupt processing. 所以这些操作其实散落在对于各个不同的寄存器的虚拟化中。

先 recognize，如果一个 interrupt 被 recognize 了，才会执行下面这个伪代码所展示的 deliver 的流程：

```c
// ---------- 这一部分主要是为了更新 RVI, SVI, VISR, VIRR 的值
Vector := RVI;
// 把 vector 在 VISR 里置上 1 表示已经在处理了
VISR[Vector] := 1;
// SVI 和 VISR 保持同步，表示在处理了 
SVI := Vector;
VPPR := Vector & F0H;
// VIRR 置为 0
VIRR[Vector] := 0;
IF any bits set in VIRR
    THEN RVI := highest index of bit set in VIRR
    // RVI 置为 0，和 VIRR 的设置同步，表示我们在处理了
    ELSE RVI := 0;
// ----------
终止 recognition of any pending virtual interrupt
// ...
deliver interrupt with Vector through IDT
```

### `Guest Interrupt Status` / RVI / SVI

16 bits. This field is supported only on processors that support the 1-setting of the “**virtual-interrupt delivery**” VM-execution control. It characterizes part of the guest’s virtual-APIC state. It comprises two 8-bit subfields（8bit 的原因可能是因为正好 $2^8=256$？毕竟我们有 256 个 vectors）:

- **Requesting virtual interrupt** (RVI): The processor treats this value as the vector of the highest priority virtual interrupt that is **requesting service**（有点像 IRR）；
- **Servicing virtual interrupt** (SVI). The processor treats this value as the vector of the highest priority virtual interrupt that is **in service**. (有点像 ISR)。

### 我们已经有 VIRR 和 VISR 了，为什么还需要 RVI 和 SVI 这两个 fields？

VIRR 和 RVI 应该是**同时被置上**的。可以是因为 self-IPI 被置上的，也可能是因为其他外部中断被置上的？我们可以看 self-IPI 的伪代码：

```c
// 置上 VIRR
VIRR[Vector] := 1;
// 置上 RVI
RVI := max{RVI,Vector};
evaluate pending virtual interrupts;
```

VIRR 和 RVI 应该也是**同时被清除**的。请看关于 `virtual-interrupt delivery`^ 的伪代码。

同样，VISR 和 SVI 也是同时置上清除的（请看 SDM 30.1.4 *EOI Virtualization*）。

RVI 是要和 VPPR 比较来决定要不要 recognize 这个 interrupt。

```
IF RVI[7:4] > VPPR[7:4]
    recognize a pending virtual interrupt;
ELSE
    do not recognize a pending virtual interrupt;
```

VIRR 和 VISR 可以同时有多个 bit 置上，表示同时有多个请求。这个 8bit 只是一个值，所以只能表示一个 vector。

# TPR Virtualization

三件事要做：

- virtualization of the MOV to CR8 instruction（请看 TPR 和 CR8 的关系）
- virtualization of a write to offset 080H on the APIC-access page（080H 就是 VTPR 的地址，这是为了模拟 xAPIC 模式通过 MMIO 来访问寄存器的模式）
- virtualization of the WRMSR instruction with ECX = 808H.（这是为了模拟通过 MSR 来访问寄存器的模式）。

```
IF “virtual-interrupt delivery” is 0:
    IF VTPR[7:4] < TPR threshold (see Section 25.6.8)
        THEN cause VM exit due to TPR below threshold;
    ELSE
        perform PPR virtualization
        evaluate pending virtual interrupts (see Section 30.2.1);
```

# VT-x Post Interrupt

首先来回顾一下，non-root 模式下对外部中断（指除 NMI、SMI、INIT 和 Start-IPI 外的所有中断）的处理：

当 `external-interrupt exiting` = 1 时，non-root 模式下接收到外部中断后，会产生 VM Exit（VM Exit No.1 External Interrupt），将中断交给 host 处理。开启 virtual-interrupt delivery 的前提就是开启 external-interrupt exiting（If the “virtual-interrupt delivery” VM-execution control is 1, the “external-interrupt exiting” VM-execution control must be 1.）。根据 `Acknowledge Interrupt on Exit` 的取值，Host 对中断有不同的处理：

- 若 Acknowledge Interrupt on Exit = 0，则 VM Exit 后该中断还在物理 interrupt controller (PIC/APIC) 的 IRR 中 pending，host 应该开中断（即取消中断屏蔽）以调用其 IDT 中注册的中断处理例程。
- 否则，VM Exit 时会进行中断确认，但不会进行 EOI，中断的向量号会存储在 VM-Exit Interruption Information（`VMCS[0x4404](32 bit)`）中，host 应该读取该向量号然后作出相应的处理。

当 non-root 模式下收到一个外部中断时（此时还没有 VM exit），CPU 首先完成中断接受和中断确认（因为开启 posted interrupt 必先开启 acknowledge interrupt on exit），并取得中断的向量号。

- 若向量与 posted-interrupt notification vector 相等，则进入 posted-interrupt processing，
- 否则照常产生 external interrupt VM Exit。

```c
The local APIC is acknowledged; this provides the core with an interrupt vector, called here the physical vector (phy_vec).
If (phy_vec != posted-interrupt notification vector)
    a VM exit occurs as it would normally due to an external interrupt
    return
Clear ON bit
// This dismisses the interrupt with the posted interrupt notification vector from the local APIC
// 其实就是执行 EOI，至此在**硬件 APIC 上**该中断已经处理完毕
// 执行 EOI 的原因是之前我们已经对硬件 APIC 执行了中断确认，INTA，所以需要写 EOI 表示我们中断处理完成了。
processor writes 0 to EOI 
VIRR = VIRR | PIR
PIR = 0
RVI = max(RVI, highest index of all bits that were set in PIR)
Evaluates pending virtual interrupts
If (recognized)
    Deliver that interrupt immediately
```

**从 use case 来理解**：假设现在想给一个**正在运行**的 vCPU 注入中断，除非该 vCPU 正在处理中断，否则仅凭虚拟中断投递，仍需要令其 VM Exit 并设置 RVI，以便在 VM Entry 时**触发**虚拟中断投递。若使用 posted interrupt，**则可以设置 `PID.PIR` 中对应位，然后给 vCPU 所在的 CPU 发送一个 notification event，即中断向量号为 posted-interrupt notification vector 的中断，这样 vCPU 无需 VM Exit 就可以被注入一个甚至多个中断**。

也就是说，**notification vector** 和真正要**注入的中断**是不一样的，真正要注入的中断会被先写入在 **PID.PIR** 中，然后 vCPU 给自己发一个 self IPI，号是 notification vector，这样就不会发生 VM exit 从而注入了中断。

Virtual-Interrupt Delivery 利用硬件功能解决了如下两个问题：

- 第一个是需要 Hypervisor 手动模拟 Interrupt Acknowledgement（也就是说要告诉硬件 APIC 我们收到了中断，正在处理，不包含写 EOI 的动作。要先从 IRR 中取出最高优先级的中断，设置 ISR 中对应位)、Interrupt Delivery (EOI)；
- 第二，有时需要产生 Interrupt Window VM Exit 以正确注入中断。

由上我们可知：Posted Interrupt 是对 Virtual-Interrupt Delivery 的进一步发展，让我们可以省略 Interrupt Acceptance 的过程，直接令正在运行的 vCPU 收到一个虚假中断，而不产生 VM Exit。**它可以向正在运行的 vCPU 注入中断。**

If the “**process posted interrupts**” VM-execution control is 1, a logical processor uses a 64-byte posted-interrupt descriptor located at the posted-interrupt descriptor address.

Post interrupt 是 Intel 提供的一种硬件机制，使得中断的注入不需要 VM-exit。

In general, data structures referenced by VMCS shouldn’t be modified when guest is running, this **doesn’t** apply to Posted-interrupt Descriptor field.

[Intel SDM Chapter 29: APIC Virtualizaton & Virtual Interrupts | tcbbd的博客](https://tcbbd.moe/ref-and-spec/intel-sdm/sdm-vmx-ch29/)

[APICv Summary - caijiqhx notes](https://notes.caijiqhx.top/ucas/virtualization/apicv_summary/#posted-interrupt)

Patch: [[PATCH v10 0/7] KVM: VMX: Add Posted Interrupt supporting - Yang Zhang](https://lore.kernel.org/kvm/1365679516-13125-1-git-send-email-yang.z.zhang@intel.com/)

### PID (posted-interrupt descriptor) / PIR

It is a 64-byte (512bit，恰好占满一个 cache line), address of the PID is field in the VMCS.

- `255:0`: Posted-interrupt requests (PIR), one bit for each interrupt vector. **There is a posted-interrupt request for a vector if the corresponding bit is 1.**
- `256`: Outstanding notification (ON): If this bit is set, there is a notification outstanding for one or more posted interrupts in bits 255:0.（取 1 表示有 outstanding 的 notification event（即中断）尚未处理，也就是说 PIR 不全是 0？）
- `511:257`: Reserved.

PIR refers to the 256 posted-interrupt bits in the PID.

```c
POSTED_INTR_DESC_ADDR           = 0x00002016,

struct vcpu_vmx {
    //...
	/* Posted interrupt descriptor */
	struct pi_desc pi_desc;
    //...
}
```

**Outstanding notification (ON) 到底是什么意思？**

PI processing doesn't need to proceed if ON bit is 0. This is just an optimization. The flow can choose to proceed, which just wastes cycles, e.g. bitwise-or with 0 (i.e. PIR=0) and clear ON bit which is already 0 etc. 所以从这里来看，的确 ON bit 就是表示 PIR 是否存在非 0 bit。

```c
bool pi_has_pending_interrupt(struct kvm_vcpu *vcpu)
{
	struct pi_desc *pi_desc = vcpu_to_pi_desc(vcpu);
    // 如果 ON bit set，或者 suppress notification 并且非空，那么就是有 interrupt 的
	return pi_test_on(pi_desc) || (pi_test_sn(pi_desc) && !pi_is_pir_empty(pi_desc));
}
```

Kernel 里设置上 PIR 的地方：

```c
__apic_accept_irq
    case APIC_DM_FIXED:
        static_call(kvm_x86_deliver_interrupt)
            vt_deliver_interrupt
                vmx_deliver_interrupt
                    vmx_deliver_posted_interrupt / tdx_deliver_interrupt
                        __vmx_deliver_posted_interrupt
                            pi_test_and_set_pir
                                test_and_set_bit
```

### Posted-interrupt notification vector / `VMCS[0x0002](16 bit)`

这个 field 主要就是 hold 一个向量号，可以被用户设置。这个向量号表示这个 interrupt 是一个 notification vector。用来通知用的。

### `.sync_pir_to_irr()` KVM

可以在 `kvm_vcpu_ioctl_get_lapic()` 的时候被调用，用来获取中断信息。

```c
.sync_pir_to_irr = vmx_sync_pir_to_irr
	if (pi_test_on(&vmx->pi_desc))
        // vmx->pi_desc 的地址在初始化时会被设置到 VMCS field 表示这片内存区域用来被硬件更新 PI 信息
        // 将硬件的 PI 信息（存储在 vmx->pi_desc 内存区域中）更新到 IRR
        got_posted_interrupt = kvm_apic_update_irr(vcpu, vmx->pi_desc.pir, &max_irr);
```

之所以这么设计，而不是直接把 `pi_desc` get 出来，我觉得是是因为 LAPIC states 是一些 registers 的信息。 而 pi_desc 是一片 VMCS field 指向的内存，和 LAPIC 关系不大，所以不应该拿出来。

# VT-d Post Interrupt

VT-d Interrupt Posting 是基于 Interrupt Remapping 的一种扩展的中断处理方式。

可以实现 Passthrough 设备的中断直接发给 vCPU 而不引起 VM Exit。

[VT-d Posted Interrupt · kernelgo](https://kernelgo.org/posted-interrupt.html)
