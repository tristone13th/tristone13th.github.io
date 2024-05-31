---
categories: NS3
title: NS3中的RateErrorModel类与ErrorRateModel类
---

# RateErrorModel

这个类继承于类`ErrorModel`，官方给出的解释如下：

```c++
/**
 * \brief Determine which packets are errored corresponding to an underlying
 * distribution, rate, and unit.
 *
 * This object is used to flag packets as being lost/errored or not.
 * The two parameters that govern the behavior are the rate (or
 * equivalently, the mean duration/spacing between errors), and the
 * unit (which may be per-bit, per-byte, and per-packet).
 * Users can optionally provide a RandomVariableStream object; the default
 * is to use a Uniform(0,1) distribution.

 * Reset() on this model will do nothing
 *
 * IsCorrupt() will not modify the packet data buffer
 */
```

通俗来说即为：

简单来说，根据一个提前预置的分布，决定哪一个包被错误。

> 这个对象被用来标记包是否丢失或者错误。两个参数用来决定这个行为的是`rate（两个错误之间的平均时间）`和`unit（错一个位、一个字节还是一个包）`。

# ErrorRateModel

这个类继承于Object类，是一个关于WiFi网络中错误的模型。官方给出的解释如下：

```c++
/**
 * \ingroup wifi
 * \brief the interface for Wifi's error models
 *
 */
```



