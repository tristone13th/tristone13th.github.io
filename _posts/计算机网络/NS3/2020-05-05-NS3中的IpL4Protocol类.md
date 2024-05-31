---
categories: NS3
title: NS3中的IpL4Protocol类
---

NS3中的`IpL4Protocol`是一个基类，其主要用来使其他的基于IP协议的传输层协议继承于这个类，从而实现其基于IP的功能。

这个类继承于`Object`类，其中首先定义了一个枚举类型`RxStatus`：

```c++
  /**
   * \brief Rx status codes.
   */
  enum RxStatus {
    RX_OK,
    RX_CSUM_FAILED, // checksum failed
    RX_ENDPOINT_CLOSED, // endpoint closed
    RX_ENDPOINT_UNREACH // endpoint unreach
  };
```

这个类中没有什么成员变量，也没有保护和私有的成员函数，下面介绍下它的公有函数。

# 公有函数

### GetProtocolNumber

```c++
virtual int GetProtocolNumber (void) const = 0;
```

得到协议号，具体可参考另一篇文章[Protocol Numbers « 云中君](https://tristone13th.github.io/archivers/Protocol-Numbers)。

### Receive及其变种

```c++
// 接收普通包
virtual enum RxStatus Receive (Ptr<Packet> p,
                                 Ipv4Header const &header,
                                 Ptr<Ipv4Interface> incomingInterface) = 0;

// 接收ICMP包
virtual void ReceiveIcmp (Ipv4Address icmpSource, uint8_t icmpTtl,
                            uint8_t icmpType, uint8_t icmpCode, uint32_t icmpInfo,
                            Ipv4Address payloadSource, Ipv4Address payloadDestination,
                            const uint8_t payload[8]);
```

这里的接受包指的是网络层收到了包，需要将其发送到上层，也就是传输层。

### SetDownTarget

Receive函数主要用来当接收到网络层的包后的行为，而SetDownTarget函数主要是主动发送包时的行为。其允许使用者手动设置一个向下端发送的回调函数，从而能够顺利地将包向下进行交付。

```c++
virtual void SetDownTarget (DownTargetCallback cb) = 0;
virtual DownTargetCallback GetDownTarget (void) const = 0;
```

同样，`GetDownTarget`函数用来得到当前设置的回调。

**注意，这个函数是纯虚函数，因为我们无法在这个类中进行实现。**

# 参考文献

- [ns-3: src/internet/model/ip-l4-protocol.h Source File](https://www.nsnam.org/doxygen/ip-l4-protocol_8h_source.html)

