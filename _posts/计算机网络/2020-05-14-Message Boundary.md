---
categories: 计算机网络
title: Message Boundary
---

首先来看一下TCP和UDP的主要区别：

1. 从连接上来看：TCP是面向连接的，而UDP是无连接的；TCP更像是打电话，而UDP更像是发邮件；
2. 从传输属性的角度看：TCP是流式传输，也就是顺序交付，接收方的接收顺序与发送方的发送顺序一致；而UDP是报式传输，接收到的包是乱序的；
3. 从信息完整性来看：TCP保证信息的完整性，而UDP不保证信息的完整性；
4. **从信息结构上来看：TCP是无边界的，而UDP是保有边界的。**

今天我们着重要介绍的就是第四点区别，什么是信息边界（Message Boundary），以及为什么TCP无边界而UDP保有边界。

首先介绍下什么是Message Boundary，根据[sockets - What is a message boundary? - Stack Overflow](https://stackoverflow.com/questions/9563563/what-is-a-message-boundary)，我们能够得到：

> A "message boundary" is the separation between two messages being sent over a protocol. UDP preserves message boundaries. If you send "FOO" and then "BAR" over UDP, the other end will receive two datagrams, one containing "FOO" and the other containing "BAR".
>
> If you send "FOO" and then "BAR" over TCP, no message boundary is preserved. The other end might get "FOO" and then "BAR". Or it might get "FOOBAR". Or it might get "F" and then "OOB" and then "AR". TCP does not make any attempt to preserve application message boundaries -- it's just a stream of bytes in each direction.

那么为什么TCP要无边界，而UDP要保有边界呢：根据[sockets - What is a message boundary? - Stack Overflow](https://stackoverflow.com/questions/9563563/what-is-a-message-boundary)：

> Message boundaries in this context is simply the start & end of the message/packet. With TCP connections, all messages/packets are combined into a continuous stream of data, whereas with UDP the messages are given to you in their original form. They will have an exact size in bytes. 

另一个UDP需要保留消息边界的原因是，UDP是无连接的，这就需要我们从每一次获得的包中解析出发送方的地址，所以我们只能原封不动地把包交付给用户而不是转成字节串。

# 参考文献

- [sockets - What is a message boundary? - Stack Overflow](https://stackoverflow.com/questions/9563563/what-is-a-message-boundary)

