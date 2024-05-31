---
categories: NS3
title: Callback在NS3中的实现
---

NS3中使用了Functor机制，也就是函子机制来完成回调的实现，具体如下：

首先是`Functor`类与`SpecialFunctor`类的实现，我们首先定义`Functor`类，这个类是一个多态类型（*polymorphic type*）：

```c++
template <typename T>
class Functor {
 public:
  // The overload for operator ()
  virtual void operator()(T arg) = 0;
};
```

这个类声明了一个调用函数，可以通过传入参数指定类型的参数来调用。我们可以把它看作一个`Callback<T>`类，这个类是一个参数类型为`T`的回调函数。接下来我们定义类`SpecificFunctor`：

```c++
template <typename T, typename ARG>
class SpecificFunctor : public Functor<ARG> {
 public:
  SpecificFunctor(T *p, void (T::*_pmi)(ARG arg)) {
    m_p = p;
    m_pmi = _pmi;
  }
  virtual void operator()(ARG arg) { (*m_p.*m_pmi)(arg); }

 private:
  void (T::*m_pmi)(ARG arg);
  T *m_p;
};
```

这个类继承了类`Functor`，其在构造函数中传入一个变量的指针以及这个变量中的一个成员函数指针（参数类型为`ARG`），并在调用阶段通过这个变量调用这个函数。

由此，我们定义一个类：

```c++
class A {
 public:
  A(int a0) : a(a0) {}
  void Hello(int b0) {
    std::cout << "Hello from A, a = " << a << " b0 = " << b0 << std::endl;
  }
  int a;
};
```

然后在主函数中调用它：

```c++
int main() {
  A a(10);
  SpecificFunctor<A, int> sf(&a, &A::Hello);
  sf(5);
}
```

我们首先初始化这个变量，然后将这个变量的成员函数`Hello`包装到回调中，然后就可以调用了。

# 参考文献

- [Callbacks — Manual](https://www.nsnam.org/docs/manual/html/callbacks.html)