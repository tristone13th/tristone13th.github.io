---
categories: NS3
title: NS3中的OpenGymEnv类
---

这个类是模拟脚本端的环境类，其继承于`Object`类，定义了以下几个需要被实现的接口。

# Public

## `OpenGymEnv ()`

构造函数。

## `virtual ~OpenGymEnv ()`

析构函数。**基类的析构函数之所以是虚函数**是因为在实现多态时，当基类操作派生类，在析构时防止只析构基类而不析构派生类的状况发生。

## `static TypeId GetTypeId ()`

返回这个类的`TypeId`，之所以是静态的是因为要操作静态成员变量。

## 接口函数

需要被实现的7个接口函数，**这七个函数全部是纯虚函数，需要被继承的子类实现**。它们分别是：

- `virtual Ptr<OpenGymSpace> GetActionSpace() = 0;`，返回值的类型为`Ptr<OpenGymSpace>`。
- `virtual Ptr<OpenGymSpace> GetObservationSpace() = 0;`，返回值类型与上一个函数相同，都是空间类的指针`Ptr<OpenGymSpace>`。
- `virtual bool GetGameOver() = 0;`，返回值为布尔类型。
- `virtual Ptr<OpenGymDataContainer> GetObservation() = 0;`，返回值为数据容器类型的指针`Ptr<OpenGymDataContainer>`。
- `virtual float GetReward() = 0;`，返回值为一个浮点数。
- `virtual std::string GetExtraInfo() = 0;`，返回值为一个标准字符串。
- `virtual bool ExecuteActions(Ptr<OpenGymDataContainer> action) = 0;`，返回值为布尔值，代表是否执行成功。

综上，可以得到如下表格：

|       函数名称        |   函数作用   |           返回值            |
| :-------------------: | :----------: | :-------------------------: |
|   `GetActionSpace`    | 得到动作空间 |     `Ptr<OpenGymSpace>`     |
| `GetObservationSpace` | 得到观测空间 |              ↑              |
|     `GetGameOver`     | 是否游戏结束 |     `bool`是否游戏结束      |
|   `GetObservation`    |   得到观测   | `Ptr<OpenGymDataContainer>` |
|      `GetReward`      |  得到回报值  |        `float`回报值        |
|    `GetExtraInfo`     | 得到多余信息 |    `std::string`多余信息    |
|   `ExecuteActions`    |   执行动作   |     `bool`是否执行成功      |

## `void SetOpenGymInterface(Ptr<OpenGymInterface> openGymInterface)`

设定接口，传入一个`OpenGymInterface`类，将变量`m_openGymInterface`设为该类，根据这个类进行设定。

## `void Notify()`

调用类中变量保存的接口`m_openGymInterface`的`Notify`函数。这个函数将当前的一些状态通知给`Agent`，这些状态包括**当前观测值**、**当前回报**、**是否游戏结束**、**额外信息**。

## `void NotifySimulationEnd()`

调用类中变量保存的接口`m_openGymInterface`的`NotifySimulationEnd`函数。通知`Agent`模拟结束。

# Protected

## `virtual void DoInitialize (void);`

初始化。

## `virtual void DoDispose (void);`

部署。

## `Ptr<OpenGymInterface> m_openGymInterface;`

成员变量，这个成员变量是一个和`OpenGym`的接口。