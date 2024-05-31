---
categories: NS3
title: NS3中的TcpSocketState类
---

官方给出的定义如下：

> brief Data structure that records the congestion state of a connection In this data structure, basic information that should be passed between socket and the congestion control algorithm are saved. Through the code, it will be referred as Transmission Control Block (TCB), but there are some differencies. In the RFCs, the TCB contains all the variables that defines a connection, while we preferred to maintain in this class only the values that should be exchanged between socket and other parts, like congestion control algorithms.

即，这是一个控制一个链接拥塞状态的类，但是和TCB(Transmission Control Block)不同的是，该类的权限更小，而TCB包含一个连接中所有的变量。

在`ns3`的源代码中，实现了一个用来控制TCP连接状态的类，名字叫做`TcpSocketState`，这个类实现于`ns3/src/internet/model`目录下的`tcp-socket-state.cc`文件中，继承于`Object`类。

在该类中有若干公开变量，这些变量包括着可以进行设置的拥塞窗口大小、慢启动阈值等等。**可以通过外界调用动态进行改变**。

