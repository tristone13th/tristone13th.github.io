---
categories: NS3
title: RLTCP在Ns3gym中的实现
---

> 截止到目前为止，`RLTCP`仅仅发布了两个版本，后续还会进行更新。源代码地址为[ns3gym](https://github.com/tkn-tub/ns3-gym)。

# 目录结构

`RLTCP`位于目录`ns3-gym/scratch`下，共有8个源代码文件，除此之外，其还依赖于事先实现好的环境文件`Ns3Env`，用来和`NS3`脚本进行交互。

这8个文件如下：

- `test_tcp.py`: 其中定义了Agent与环境定义的流程。
  - `tcp_newreno.py`: 定义了`newreno`版的Agent类，在该类中提供了`get_antion`函数，用来决定如何通过状态回报来选择`Action`。
- `tcp_base.py`:  定义了两种Agent, 一种是基于时间的，一种是基于事件的。
- `tcp_rl.h`：在命名空间`ns3`中声明了七个类，分别是：
  - `TcpSocketBase`
  - `Time`
  - `TcpGymEnv`
  - `TcpSocketDerived`
  - `TcpRlBase`
  - `TcpRl`
  - `TcpRlTimeBased`

- `tcp_rl.cc`：定义了命名空间`ns3`中的四个类，这四个类声明于同样名称的头文件中，分别是：
  - `TcpSocketDerived`
  - `TcpRlBase`
  - `TcpRl`
  - `TcpRlTimeBased`

- `tcp_rl_env.h`：在命名空间`ns3`中声明了七个类，分别是：
  - `Packet`
  - `TcpHeader`
  - `TcpSocketBase`
  - `Time`
  - `TcpGymEnv`
  - `TcpEventGymEnv`
  - `TcpTimeStepGymEnv`

- `tcp_rl_env.cc`：定义了命名空间`ns3`中的三个类，这三个类声明于同样名称的头文件中，分别是：
  - `TcpGymEnv`
  - `TcpEventGymEnv`
  - `TcpTimeStepGymEnv`

- `sim.cc`：模拟的脚本，定义了网络的参数与结构，以及对脚本的执行。

综上，在`RLTCP`相关的代码中，我们共声明并定义了11个类，这些类各有各的作用。其中，在源文件中实现了`TcpSocketDerived`, `TcpRlBase`, `TcpRl`, `TcpRlTimeBased`, `TcpGymEnv`, `TcpEventGymEnv`, `TcpTimeStepGymEnv` 7个类。

## 类继承关系

- `TcpSocketBase`
  - `TcpSocketDerived`

- `OpenGymEnv`
  - `TcpGymEnv`
    - `TcpEventGymEnv`
    - `TcpTimeStepGymEnv`

- `TcpCongestionOps`
  - `TcpRlBase`
    - `TcpRl`
    - `TcpRlTimeBased`

