---
categories: NS3
title: NS3Gym如何在Python端控制拥塞窗口大小
---

如果我们希望`Agent`能够针对其对于环境的观测`Observation`做出动作`Action`，并进一步对环境做出影响。比如，我们要动态地调整拥塞窗口的大小，那么可以通过以下方式进行实现：

# 注册接口

首先，在模拟脚本`sim.cc`中实例化一个`OpenGymInterface`类，并通过

```c++
openGymInterface = OpenGymInterface::Get (openGymPort);
```

来与Agent通过指定端口进行连接。

# 设置拥塞控制类

其次，通过以下代码设置`ns3::TcpL4Protocol::SocketType`类为我们实现的类的名称，其中，`transport_prot`值为`ns3::TcpRl`。

```c++
Config::SetDefault ("ns3::TcpL4Protocol::SocketType",
                          TypeIdValue (TypeId::LookupByName (transport_prot)));
```

而类`TcpRl`继承于`TcpRlBase`，后者又继承于`TcpCongestionOps`，这个类中自定义了`GetSsThresh`和`IncreaseWindow`等函数，这些函数是自动执行的，当系统探测到一个`Loss`或者接收到一个`ACK`时，这两个函数自动被调用执行。

## GetSsThresh

这个函数不能设置当前`socket`连接的状态，因为传进来的参数是`const`的，当探测到一个丢包时，系统会自动执行这个函数，然后将该函数的**返回值**设置为新的**慢启动阈值**。

## IncreaseWindow

这个函数可以对**拥塞窗口**进行设置。在这里，我们调用了环境的`IncreaseWindow`函数，即

```c++
void
TcpRlBase::IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked)
{
  NS_LOG_FUNCTION (this << tcb << segmentsAcked);
  if (!m_tcpGymEnv)
    {
      CreateGymEnv ();
    }

  if (m_tcpGymEnv)
    {
      m_tcpGymEnv->IncreaseWindow (tcb, segmentsAcked);
    }
}
```

环境中同样定义了`IncreaseWindow`函数，在这个函数中对拥塞窗口进行了设置。

```c++
void
TcpEventGymEnv::IncreaseWindow (Ptr<TcpSocketState> tcb, uint32_t segmentsAcked)
{
  NS_LOG_FUNCTION (this);
  // pkt was acked, so reward
  m_envReward = m_reward;
  //printf ("event based");
  NS_LOG_INFO (Simulator::Now () << " Node: " << m_nodeId
                                 << " IncreaseWindow, SegmentsAcked: " << segmentsAcked);
  m_calledFunc = CalledFunc_t::INCREASE_WINDOW;
  m_info = "IncreaseWindow";
  m_tcb = tcb;
  m_segmentsAcked = segmentsAcked;
  Notify ();
  tcb->m_cWnd = m_new_cWnd;
}
```

在这个代码中，将当前控制块的拥塞窗口`m_cWnd`调整为了新的拥塞窗口`m_new_cWnd`。

# Agent执行动作

在执行动作时，我们可以提交我们新的动作，在示例中，提交的动作包含：

- 新的慢启动阈值。
- 新的拥塞窗口。

可以通过直接设置**环境类的变量**来执行动作，因为上面两个函数在被触发后会读取这个值并进行修改，即

```c++
bool
TcpGymEnv::ExecuteActions (Ptr<OpenGymDataContainer> action)
{
  Ptr<OpenGymBoxContainer<uint32_t>> box = DynamicCast<OpenGymBoxContainer<uint32_t>> (action);
  m_new_ssThresh = box->GetValue (0);
  m_new_cWnd = box->GetValue (1);
  NS_LOG_INFO ("MyExecuteActions: " << action);
  return true;
}
```

