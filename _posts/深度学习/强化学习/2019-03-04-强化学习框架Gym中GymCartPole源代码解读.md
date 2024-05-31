---
categories: 强化学习
title: 强化学习框架Gym中GymCartPole源代码解读
---

# CartPole介绍

## 概述

> A pole is attached by an un-actuated joint to a cart, which moves along a frictionless track. The pendulum starts upright, and the goal is to prevent it from falling over by increasing and reducing the cart's velocity.

一个小车**非固定式**地连接着一个杆子，该小车在着**无摩擦**的轨道移动。为了让杆子时刻保持直立，应当如何控制小车的**速度**？

## 观测值（状态）

### 类型

该参数为`Box(4)`类型，其是一个四维的向量，该向量的解释如下：

| 标号（Num） |        观测量（Observation）         | 最小值（Min） | 最大值（Max） |
| :---------: | :----------------------------------: | :-----------: | :-----------: |
|      0      |      小车位置（Cart Position）       |     -4.8      |      4.8      |
|      1      |      小车速度（Cart Velocity）       |     -Inf      |      Inf      |
|      2      |         杆角度（Pole Angle）         |    -24 deg    |    24 deg     |
|      3      | 杆末端线速度（Pole Velocity At Tip） |     -Inf      |      Inf      |

## 动作

### 类型

该参数为`Discrete(2)`类型，其解释如下：

| 标号（Num） | 动作（Action） |
| :---------: | :------------: |
|      0      |    向左推车    |
|      1      |    向右推车    |

> 注意：速度改变的值是**不固定**的，这取决于杆的角度，这是因为杆的中心增加了移动小车所需要的能量。

## 回报

每一步的回报都是`1`。

## 开始状态

观测值的所有维度都可能被赋予一个在区间`[-0.05..0.05]`的均值。

## 源注释

以上内容来自于代码中的注释，如下：

```python
"""
    Description:
        A pole is attached by an un-actuated joint to a cart, which moves along a frictionless track. The pendulum starts upright, and the goal is to prevent it from falling over by increasing and reducing the cart's velocity.

    Source:
        This environment corresponds to the version of the cart-pole problem described by Barto, Sutton, and Anderson

    Observation: 
        Type: Box(4)
        Num	Observation                 Min         Max
        0	Cart Position             -4.8            4.8
        1	Cart Velocity             -Inf            Inf
        2	Pole Angle                 -24 deg        24 deg
        3	Pole Velocity At Tip      -Inf            Inf
        
    Actions:
        Type: Discrete(2)
        Num	Action
        0	Push cart to the left
        1	Push cart to the right
        
        Note: The amount the velocity that is reduced or increased is not fixed; it depends on the angle the pole is pointing. This is because the center of gravity of the pole increases the amount of energy needed to move the cart underneath it

    Reward:
        Reward is 1 for every step taken, including the termination step

    Starting State:
        All observations are assigned a uniform random value in [-0.05..0.05]

    Episode Termination:
        Pole Angle is more than 12 degrees
        Cart Position is more than 2.4 (center of the cart reaches the edge of the display)
        Episode length is greater than 200
        Solved Requirements
        Considered solved when the average reward is greater than or equal to 195.0 over 100 consecutive trials.
    """
```

## 回合终止（结束状态）

- 杆角度超过12度。
- 小车中心超出显示范围（2.4）。
- 回合的长度大于了200。
- 解决了需求（当平均回报在连续的100次试验中大于或者等于了195）。

# CartPole实现

在`Gym`的官方文档中，举了一个关于杆上小车`CartPole`的例子，下面对该例子中的源代码进行解读。

打开代码源文件`CartPole.py`，首先是该代码中引入的库：

```python
import math
import gym
from gym import spaces, logger
from gym.utils import seeding
import numpy as np
```

其中`logger`用来保存日志，而`seeding`用来在随机数中生成随机种子。

接下来继承了类`gym.Env`来定义类`CartPoleEnv`：

```python
class CartPoleEnv(gym.Env):
```

## 元数据

```python
    metadata = {
        'render.modes': ['human', 'rgb_array'],
        'video.frames_per_second' : 50
    }
```

该部分主要设定了一些渲染所需的参数。

## 其他函数

### `seed(self, seed=None)`

```python
    def seed(self, seed=None):
        self.np_random, seed = seeding.np_random(seed)
        return [seed]
```

定义了**随机种子函数**。

## 构造函数

构造函数用来设定一些**环境本身的参数**，如

- 万有引力参数。
- 小车质量。
- 杆子质量。
- 总质量。
- 长度。
- 状态更新间隔。
- 运动积分器。
- 最大角度。
- 最大小车位置偏移。
- 状态空间。
- 观测空间。

变量`high`是一个四维向量，每一维对应该维观测值的最大值。

同时，该函数还调用了`seed`函数，进行了随机数的相应设置。

```python
def __init__(self):
        self.gravity = 9.8
        self.masscart = 1.0
        self.masspole = 0.1
        self.total_mass = (self.masspole + self.masscart)
        self.length = 0.5 # actually half the pole's length
        self.polemass_length = (self.masspole * self.length)
        self.force_mag = 10.0
        self.tau = 0.02  # seconds between state updates
        self.kinematics_integrator = 'euler'

        # Angle at which to fail the episode
        self.theta_threshold_radians = 12 * 2 * math.pi / 360
        self.x_threshold = 2.4

        # Angle limit set to 2 * theta_threshold_radians so failing observation is still within bounds
        high = np.array([
            self.x_threshold * 2,
            np.finfo(np.float32).max,
            self.theta_threshold_radians * 2,
            np.finfo(np.float32).max])

        self.action_space = spaces.Discrete(2)
        self.observation_space = spaces.Box(-high, high, dtype=np.float32)

        self.seed()
        self.viewer = None
        self.state = None

        self.steps_beyond_done = None
```

## `step`函数

`step`函数是一个非常重要的函数，它定义了当智能体执行动作后环境应当如何给予反馈。下面将以注释的形式对代码进行解读。

输入：

- 动作

返回：

- 状态、回报、是否完成、调试参数

```python
def step(self, action):
    	# 假设是动作满足动作空间，否则报错
        assert self.action_space.contains(action), "%r (%s) invalid"%(action, type(action))
        
        # 当前状态拆分到以下几个变量中
        state = self.state
        x, x_dot, theta, theta_dot = state
        
        # 根据动作来计算力度
        force = self.force_mag if action==1 else -self.force_mag
        
        # 根据参数做相应计算
        costheta = math.cos(theta)
        sintheta = math.sin(theta)
        temp = (force + self.polemass_length * theta_dot * theta_dot * sintheta) / self.total_mass
        thetaacc = (self.gravity * sintheta - costheta* temp) / (self.length * (4.0/3.0 - self.masspole * costheta * costheta / self.total_mass))
        xacc  = temp - self.polemass_length * thetaacc * costheta / self.total_mass
        if self.kinematics_integrator == 'euler':
            x  = x + self.tau * x_dot
            x_dot = x_dot + self.tau * xacc
            theta = theta + self.tau * theta_dot
            theta_dot = theta_dot + self.tau * thetaacc
        else: # semi-implicit euler
            x_dot = x_dot + self.tau * xacc
            x  = x + self.tau * x_dot
            theta_dot = theta_dot + self.tau * thetaacc
            theta = theta + self.tau * theta_dot
            
        # 更新当前状态
        self.state = (x,x_dot,theta,theta_dot)
        done =  x < -self.x_threshold \
                or x > self.x_threshold \
                or theta < -self.theta_threshold_radians \
                or theta > self.theta_threshold_radians
        done = bool(done)

        # 更新当前奖励
        if not done:
            reward = 1.0
        elif self.steps_beyond_done is None:
            # Pole just fell!
            self.steps_beyond_done = 0
            reward = 1.0
        else:
            if self.steps_beyond_done == 0:
                logger.warn("You are calling 'step()' even though this environment has already returned done = True. You should always call 'reset()' once you receive 'done = True' -- any further steps are undefined behavior.")
            self.steps_beyond_done += 1
            reward = 0.0

        # 将（状态、奖励、是否完成、调试数据）返回
        return np.array(self.state), reward, done, {}
```

## `reset`函数

输入：

- 无

返回：

- 初始观测值

```python
    def reset(self):
        
        # 状态重新随机采样
        self.state = self.np_random.uniform(low=-0.05, high=0.05, size=(4,))
        self.steps_beyond_done = None
        
        # 返回观测值
        return np.array(self.state)
```

## `render`函数

由于`render`函数不会对任何一个参数产生影响，只会执行屏幕渲染，所以可以为空。

输入：

- 模式（Optional）

返回：

- 无

```python
	def render(self, mode='human'):
        screen_width = 600
        screen_height = 400

        world_width = self.x_threshold*2
        scale = screen_width/world_width
        carty = 100 # TOP OF CART
        polewidth = 10.0
        polelen = scale * (2 * self.length)
        cartwidth = 50.0
        cartheight = 30.0

        if self.viewer is None:
            from gym.envs.classic_control import rendering
            self.viewer = rendering.Viewer(screen_width, screen_height)
            l,r,t,b = -cartwidth/2, cartwidth/2, cartheight/2, -cartheight/2
            axleoffset =cartheight/4.0
            cart = rendering.FilledPolygon([(l,b), (l,t), (r,t), (r,b)])
            self.carttrans = rendering.Transform()
            cart.add_attr(self.carttrans)
            self.viewer.add_geom(cart)
            l,r,t,b = -polewidth/2,polewidth/2,polelen-polewidth/2,-polewidth/2
            pole = rendering.FilledPolygon([(l,b), (l,t), (r,t), (r,b)])
            pole.set_color(.8,.6,.4)
            self.poletrans = rendering.Transform(translation=(0, axleoffset))
            pole.add_attr(self.poletrans)
            pole.add_attr(self.carttrans)
            self.viewer.add_geom(pole)
            self.axle = rendering.make_circle(polewidth/2)
            self.axle.add_attr(self.poletrans)
            self.axle.add_attr(self.carttrans)
            self.axle.set_color(.5,.5,.8)
            self.viewer.add_geom(self.axle)
            self.track = rendering.Line((0,carty), (screen_width,carty))
            self.track.set_color(0,0,0)
            self.viewer.add_geom(self.track)

            self._pole_geom = pole

        if self.state is None: return None

        # Edit the pole polygon vertex
        pole = self._pole_geom
        l,r,t,b = -polewidth/2,polewidth/2,polelen-polewidth/2,-polewidth/2
        pole.v = [(l,b), (l,t), (r,t), (r,b)]

        x = self.state
        cartx = x[0]*scale+screen_width/2.0 # MIDDLE OF CART
        self.carttrans.set_translation(cartx, carty)
        self.poletrans.set_rotation(-x[2])

        return self.viewer.render(return_rgb_array = mode=='rgb_array')
```

## `close`函数

把渲染出来的窗口关闭。

```python
    def close(self):
        if self.viewer:
            self.viewer.close()
            self.viewer = None
```

