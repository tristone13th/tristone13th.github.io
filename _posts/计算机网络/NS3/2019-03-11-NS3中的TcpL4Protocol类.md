---
categories: NS3
title: NS3中的TcpL4Protocol类
---

官方给出的定义如下：

```c++
/**
 * \ingroup tcp
 * \brief TCP socket creation and multiplexing/demultiplexing
 * 
 * A single instance of this class is held by one instance of class Node.
 *
 * The creation of TcpSocket are handled in the method CreateSocket, which is
 * called by TcpSocketFactory. Upon creation, this class is responsible to
 * the socket initialization and handle multiplexing/demultiplexing of data
 * between node's TCP sockets. Demultiplexing is done by receiving
 * packets from IP, and forwards them up to the right socket. Multiplexing
 * is done through the SendPacket function, which sends the packet down the stack.
 *
 * Moreover, this class allocates "endpoint" objects (ns3::Ipv4EndPoint) for TCP,
 * and SHOULD checksum packets its receives from the socket layer going down
 * the stack, but currently checksumming is disabled.
 *
 * \see CreateSocket
 * \see NotifyNewAggregate
 * \see SendPacket
*/
```

简要来说即为：

> 该类的一个实例由一个Node类实例保存。
>
> `TcpSocket`的创建在`CreateSocket`方法中处理，该方法由`TcpSocketFactory`调用。 在创建时，该类负责套接字初始化并处理节点的`TCP`套接字之间的数据复用/解复用。 通过从`IP`接收数据包完成解复用，并将它们转发到正确的套接字。 多路复用是通过`SendPacket`函数完成的，该函数将数据包发送到堆栈。
>
> 此外，此类为`TCP`分配“端点”对象（`ns3 :: Ipv4EndPoint`），并且应该从堆栈中的套接字层接收校验和数据包，但当前校验和已被禁用。

我们可以通过以下代码来设置拥塞控制算法：

```c++
Config::SetDefault ("ns3::TcpL4Protocol::SocketType",
                          TypeIdValue (TypeId::LookupByName (transport_prot)));
```

`ns3::TcpL4Protocol::SocketType`变量类型决定了`TCP`拥塞控制算法。即

> We pick the TCP congesion-control algorithm by setting `ns3::TcpL4Protocol::SocketType`. Options are `TcpRfc793` (no congestion control), `TcpTahoe`, `TcpReno`, `TcpNewReno` and `TcpWestwood`. TCP Cubic and SACK TCP are not supported natively (though they are available if the [Network Simulation Cradle](http://research.wand.net.nz/software/nsc.php) is installed).

# 参考文献

- [http://intronetworks.cs.luc.edu/current/html/ns3.html](http://intronetworks.cs.luc.edu/current/html/ns3.html)

