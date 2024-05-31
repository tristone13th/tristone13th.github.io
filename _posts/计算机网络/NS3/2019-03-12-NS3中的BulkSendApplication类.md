---
categories: NS3
title: NS3中的BulkSendApplication类
---

顾名思义，英语中`Bulk`的意思是成块的，大批的，所以`BulkSendApplication`表示极尽所能地向链路中发送流量。

官方给出的定义如下：

```c++
/**
 * \ingroup bulksend
 *
 * \brief Send as much traffic as possible, trying to fill the bandwidth.
 *
 * This traffic generator simply sends data
 * as fast as possible up to MaxBytes or until
 * the application is stopped (if MaxBytes is
 * zero). Once the lower layer send buffer is
 * filled, it waits until space is free to
 * send more data, essentially keeping a
 * constant flow of data. Only SOCK_STREAM
 * and SOCK_SEQPACKET sockets are supported.
 * For example, TCP sockets can be used, but
 * UDP sockets can not be used.
 *
 */
```

通俗来说即为：

> 简单地极尽所能地向网络中发送包，试图完全利用带宽。
>
> 这个包产生器只是简单地尽快地发送最大字节的数据直到这个应用停止。一旦底层的发送缓冲区被填满了，它等待知道空间中产生富余来发送更多的数据。

这个类实现于`ns3-gym/build/ns3`目录下的`bulk-send-application.h`文件中，**继承于应用类`Application`**。

