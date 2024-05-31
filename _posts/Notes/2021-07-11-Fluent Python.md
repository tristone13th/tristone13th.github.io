---
categories: Notes
title: Reading Notes for Fluent Python
---

# Part I. Prologue

## Chapter 1. The Python Data Model

Python 解释器会调用特殊的函数来执行基础的操作。

> The Python interpreter invokes special methods to perform basic object oper‐ ations, often triggered by special syntax \| Page 29 (Underline).

魔法函数 \_\_getitem\_\_ 就是用来处理 something[key] 这种情况的。正如 \_\_getattr\_\_ 正是用来处理 something.attr 这种情况的。

> In order to evaluate my\_collection[key], the interpreter calls my\_collection.\_\_getitem\_\_(key). \| Page 30 (Underline).

魔法函数也称为特殊函数。

> The  term  magic  method  is  slang  for  special  method \| Page 30 (Underline).

魔法函数也叫 dunder methods

> As a result, the special methods are also known as dunder methods \| Page 30 (Underline).

### A Pythonic Card Deck

namedtuple 主要就是用来制造没有方法的类的，就像一条数据库记录。

> Since Python 2.6, namedtuple can be used to build classes of objects that are just bundles of attributes with no custom methods, like a database record. \| Page 31 (Underline).

Python 对于魔法函数的设计有两个好处：
   1. 更加标准，对于长度我们统一使用 len，而不像其他语言需要纠结是 size, length 还是其他。
   2. Python 标准库也能够得到应用，比如实现了 len 和 getitem，那么我们可以使用 choice。

> We've just seen two advantages of using special methods to leverage the Python data model \| Page 32 (Underline).

### How Special Methods Are Used

因为 len 函数的实现基于 C 语言结构体，只是返回它的一个变量，所以它的时间复杂度很低，只有 O(1)。

> But for built-in types like list, str, bytearray, and so on, the interpreter takes a short‐ cut: the CPython implementation of len() actually returns the value of the ob\_size field in the PyVarObject C struct that represents any variable-sized built-in object in memory. This is much faster than calling a method. \| Page 34 (Underline).

#### String Representation

\_\_repr\_\_ 用来向计算机表示，而 \_\_str\_\_ 用来向用户表示。

> Contrast \_\_repr\_\_ with \_\_str\_\_, which is called by the str() constructor and implicitly used by the print function. \_\_str\_\_ should return a string suitable for display to end users. \| Page 37 (Underline).

如果只以一种方式实现，那么最好实现 \_\_repr\_\_ 而非 \_\_str\_\_，因为后者会默认调用前者。

> If you only implement one of these special methods, choose \_\_repr\_\_, because when no custom \_\_str\_\_ is available, Python will call \_\_repr\_\_ as a fallback. \| Page 37 (Underline).

#### Boolean Value of a Custom Type

每一个对象其实都有自己的真值和假值。可以通过实现 \_\_bool\_\_ 来进行返回其真实的布尔值，否则默认用户实现的对象都是真的。

> To determine whether a value x is truthy or falsy, Python applies bool(x), which always returns True or False. \| Page 38 (Underline).

# Part II. Data Structures

## Chapter 2. An Array of Sequences

### Overview of Built-In Sequences

Python 中 sequence 的一种分类方式，Container sequences 和 Flat sequences。前者包含的是引用，后者包含的是值。

> list, tuple, and collections.deque can hold items of different types. Container sequences Flat sequences str, bytes, bytearray, memoryview, and array.array hold items of one type. \| Page 46 (Underline).

Python 中序列的另一种分类方式，Mutable sequences 和 Immutable sequences。前者可变，后者不可变。

> list, bytearray, array.array, collections.deque, and memoryview Mutable sequences Immutable sequences tuple, str, and bytes \| Page 46 (Underline).

### List Comprehensions and Generator Expressions

列表推导式，通常简写为 listcomp。

> List Comprehensions \| Page 47 (Underline).

#### List Comprehensions and Readability

Python 代码中，括号（大中小）中的换行都是被忽略的，所以可以在括号的中间进行换行而不需要使用 \。尽量避免 \ 来换行，因为太丑。

> In Python code, line breaks are ignored inside pairs of [], \{\}, or (). So you can build multiline lists, listcomps, genexps, dictionar‐ ies and the like without using the ugly \ line continuation escape. \| Page 48 (Underline).

列表推导式的功能都可以通过 map 和 filter 实现，这就是函数式编程的魅力吧。

> Listcomps Versus map and filter \| Page 49 (Underline).

#### Cartesian Products

注意，当存在两层循环是，默认第一个出现的 for 是外部循环，而第二个是内部循环。

> [(color, size) for color in colors for size in sizes] \| Page 50 (Underline).

#### Generator Expressions

可以使用生成器表达式，它的好处就是它是使用 yield 来生成元素的，所以它很节省内存。把列表推导式的中括号换成圆括号就可以了。

> but a genexp saves memory because it yields items one by one using the iterator protocol instead of building a whole list just to feed another constructor \| Page 51 (Underline).

生成器表达式和列表推导式的语法是一样的。生成器表达式的简写为 genexp。

> Genexps use the same syntax as listcomps, but are enclosed in parentheses rather than brackets. \| Page 51 (Underline).

### Tuples Are Not Just Immutable Lists

可以把元组当成不可更改的列表，也可以当成一个记录来用。

> Tuples do double duty: they can be used as immutable lists and also as records with no field names. This use is sometimes overlooked, so we will start with that. \| Page 52 (Underline).

#### Tuple Unpacking

当对函数传入参数时，在列表或者元组变量的前面加上一个*，表示对这个东西进行解包。

> Another example of tuple unpacking is prefixing an argument with a star when calling a function \| Page 54 (Underline).

星号 * 的一些作用：
   - 当定义函数时，表示接受的是一个列表。
   - 当对一个函数传入参数时，表示传入的是一个列表。
   - 当进行 tuple unpacking 时，表示接受多余的参数。

> Using * to grab excess items \| Page 55 (Underline).

嵌套元组解包可以使用括号将要赋于的变量包含，可以解包元组中的元组。

> Nested Tuple Unpacking \| Page 55 (Underline).

#### Named Tuples

这句话对 namedtuple 概括的很精确，是一个工厂函数，返回一个 tuple 的子类，包含域的名称以及类名称。

> The collections.namedtuple function is a factory that produces subclasses of tuple enhanced with field names and a class name—which helps debugging. \| Page 56 (Underline).

### Slicing

#### Slice Objects

[] 当中的 a:b:c 其实是一个 slice 对象（只有在 [] 中才可以被识别），我们也可以创建自己的 slice 对象，直接通过 slice() 来创建就好。

> is  only  valid  within  []  when  used  as  the  indexing  or  subscript operator, and it produces a slice object: slice(a, b, c). \| Page 60 (Underline).

#### Multidimensional Slicing and Ellipsis

[] 其实就是通过 \_\_getitem\_\_ 来实现的。[] 可以接受一个带有冒号的传入的值，也就是前面讲到的，实际上传入的是 slice 对象，同时其也可以传入逗号分割的值，这个传入的其实是元组，也就是相当于 \_\_getitem\_\_(a, b)。

> The [] operator can also take multiple indexes or slices separated by commas. \| Page 61 (Underline).

### When a List Is Not the Answer

#### Deques and Other Queues

queue 这个库是线程安全的。

> Queue, LifoQueue, and PriorityQueue \| Page 83 (Underline).

## Chapter 3. Dictionaries and Sets

内置函数比如 len 在 \_\_builtins\_\_.\_\_dict\_\_ 当中。

> The built-in functions live in \_\_builtins\_\_.\_\_dict\_\_. \| Page 89 (Underline).

### Generic Mapping Types

如果一个对象是 hashable 的，那么它需要实现 \_\_hash\_\_ 方法，并且保证在这个对象的生命周期内都是不变的，并且是可以和其他对象进行比较的，所以需要实现 \_\_eq\_\_ 方法，通过 \_\_eq\_\_ 进行比较相同的对象其哈希值也必须是相同的。

> An object is hashable if it has a hash value which never changes during its lifetime (it needs a \_\_hash\_\_() method), and can be compared to other objects (it needs an \_\_eq\_\_() method). Hashable objects which compare equal must have the same hash value. \| Page 91 (Underline).

用户定义的类型通常都是 hashable 的，而且它们的哈希值是 id()，所以任何两个对象都无法保证是 equal。如果一个对象实现的 \_\_eq\_\_ 函数考虑了它自己的内部状态，那么这些内部状态应该是不可变的（因为需要保证在生命周期内其哈希值是不可变的）。

> User-defined types are hashable by default because their hash value is their id() and they all compare not equal. If an object implements a custom \_\_eq\_\_ that takes into account its internal state, it may be hashable only if all its attributes are immutable. \| Page 91 (Underline).

### Mappings with Flexible Key Lookup

其实可以通过继承 dict 类，并且实现一个 \_\_missing\_\_ 魔法函数来实现默认值。

> There are two main approaches to this: one is to use a default dict instead of a plain dict. The other is to subclass dict or any other mapping type and add a \_\_missing\_\_ method \| Page 96 (Underline).

#### The \_\_missing\_\_ Method

\_\_missing\_\_ 函数仅仅对 \_\_getitem\_\_ 有效，这也意味着通过 get 函数或者通过 \_\_contains\_\_ 函数无法享受实现 \_\_missing\_\_ 带来的好处。

> The \_\_missing\_\_ method is just called by \_\_getitem\_\_ (i.e., for the d[k] operator). The presence of a \_\_missing\_\_ method has no effect on the behavior of other methods that look up keys, such as get or \_\_contains\_\_ (which implements the in operator). This is why  the  default\_factory  of  defaultdict  works  only  with \_\_getitem\_\_, as noted in the warning at the end of the previous section. \| Page 98 (Underline).

### Variations of dict

ChainMap 的一个好处是可以把多个 mapping 对象进行合并，这样如果其中任何一个对象更改了，在 ChainMap 中进行查询也会得到相应的更改。

> collections.ChainMap \| Page 101 (Underline).

可以数每一个对象的个数的 mapping 对象，感觉应该挺好用。

> collections.Counter \| Page 101 (Underline).

如果要实现自己的字典，最好直接继承 UserDict，而不是直接继承 dict。

> Subclassing UserDict \| Page 102 (Underline).

### Subclassing UserDict

我们可以实现不可更改的映射。

> Immutable Mappings \| Page 103 (Underline).

### Immutable Mappings

可以通过 MappingProxy 来实现不可更改的映射。

> MappingProxy \| Page 104 (Underline).

### Set Theory

集合中的元素必须是可哈希的，这样才能保证元素的唯一性。一个元素的哈希值可以看做就是这个元素的 id。

> Set elements must be hashable. \| Page 105 (Underline).

#### set Literals

空集必须要使用 set() 来定义。通过 \{\} 来定义是空的字典。

> so we must re‐ member to write set() \| Page 106 (Underline).

#### Set Operations

集合和字典都是通过哈希表实现的。

> We now change gears to discuss how dictionaries and sets are implemented with hash tables. \| Page 110 (Underline).

### dict and set Under the Hood

#### Hash Tables in Dictionaries

Python 保持三分之一的地方是空的，如果不满足，就拷贝到一个新的内存区域。

> Python tries to keep at least 1/3 of the buckets empty; if the hash table becomes too crowded, it is copied to a new location with room for more buckets. \| Page 113 (Underline).

如果两个对象被判断为相等，那么他们的哈希值也应当相等。

> If two objects compare equal, their hash values must also be equal \| Page 113 (Underline).

在对字典传入一个 key 时，是通过这个 key 计算出一个哈希值，然后根据这个哈希值来执行进一步的计算。

> my\_dict[search\_key] \| Page 114 (Underline).

#### Practical Consequences of How dict Works

hashable 的定义。

> An object is hashable if all of these requirements are met \| Page 116 (Underline).

在迭代一个字典时，对其中的内容进行修改是很蠢的想法，因为可能涉及到拷贝到新的内存空间。

> This is why modifying the contents of a dict while iterating through it is a bad idea \| Page 118 (Underline).

#### How Sets Work—Practical Consequences

同样，集合的元素也要是 hashable 的。

> Set elements must be hashable objects. \| Page 119 (Underline).

## Chapter 4. Text versus Bytes

### Byte Essentials

bytes 是不可更改的，但是 bytearray 是可以更改的。

> the im‐ mutable  bytes  type  introduced  in  Python  3  and  the  mutable  bytearray \| Page 125 (Underline).

### Understanding Encode/Decode Problems

#### How to Discover the Encoding of a Byte Sequence

仅仅通过一个字节序列是无法判断其编码的。

> How do you find the encoding of a byte sequence? Short answer: you can't. You must be told. \| Page 135 (Underline).

# Part III. Functions as Objects

## Chapter 5. First-Class Functions

### Treating a Function Like an Object

一个函数的 \_\_doc\_\_ 属性就是在函数头通过三个引号定义的注释说明内容。

> The  \_\_doc\_\_  attribute  is  used  to  generate  the  help  text  of  an  object. \| Page 166 (Underline).

### The Seven Flavors of Callable Objects

Python 当中有 7 种可调用类型：用户定义的函数、内置函数、内置方法，类方法，类，类的实例以及生成器函数。

> The Python Data Model documentation lists seven callable types \| Page 170 (Underline).

当一个类被调用时，先用 \_\_new\_\_ 来创建实例，再通过 \_\_init\_\_ 来进行初始化。

> When invoked, a class runs its \_\_new\_\_ method to create an instance, then \_\_in it\_\_ to initialize it, and finally the instance is returned to the caller \| Page 171 (Underline).

如果一个类实现了 \_\_call\_\_ 内置函数，那么这个对象就是 callable 的，可以通过函数 callable 来判断是否是一个 callable 对象。

> If a class defines a \_\_call\_\_ method, then its instances may be invoked as functions \| Page 171 (Underline).

使用 yield 的函数返回的都是一个生成器对象。

> Functions or methods that use the yield keyword. When called, generator func‐ tions return a generator object. \| Page 171 (Underline).

### Function Introspection

函数和用户定义的类都是通过 \_\_dict\_\_ 来存储属性。比如我们在定义了一个函数之后，可以通过 函数名.属性名 = 值 的方式来为函数进行赋值。

> Like the instances of a plain user-defined class, a function uses the \_\_dict\_\_ attribute to store user attributes assigned to it. \| Page 173 (Underline).

Type Annotation 被存储在 \_\_annotations\_\_ 这个属性当中。

> Parameter and return annotations \| Page 174 (Underline).

### From Positional to Keyword-Only Parameters

位置型参数即使没有指定，也可以随后在字典型参数中进行指定。

> Prefixing  the  my\_tag  dict  with  **  passes  all  its  items  as  separate  arguments, which are then bound to the named parameters, with the remaining caught by **attrs. \| Page 175 (Underline).

如果想让某参数只能被字典来指定，而不能通过位置来指定，把它放在具有 * 参数之后，这样子任何位置的参数都不会匹配为这个参数，比如这样：def f(a, *, b)。

> Keyword-only  arguments  are  a  new  feature  in  Python  3.  In  Example  5-10,  the  cls parameter can only be given as a keyword argument—it will never capture unnamed positional arguments. To specify keyword-only arguments when defining a function, name them after the argument prefixed with *. \| Page 175 (Underline).

仅字典型参数（keyword-only parameter）不需要必须有默认值。

> Note that keyword-only arguments do not need to have a default value: they can be mandatory, like b in the preceding example. \| Page 176 (Underline).

### Retrieving Information About Parameters

\_\_defaults\_\_ 存储的是关于位置型参数和关键字型参数的默认值，而 \_\_kwdefaults\_\_ 中的放的是 keyword only 的参数的值，注意，这两者都是关于值的元组。而参数的名称其实存储在 \_\_code\_\_ 当中。

> Within  a  function  object,  the  \_\_defaults\_\_  attribute  holds  a  tuple  with  the  default values of positional and keyword arguments. The defaults for keyword-only arguments appear in \_\_kwdefaults\_\_. The names of the arguments, however, are found within the \_\_code\_\_ attribute, which is a reference to a code object with many attributes of its own. \| Page 177 (Underline).

clip.\_\_defaults\_\_

> clip.\_\_defaults\_\_ \| Page 177 (Underline).

通过 \_\_code\_\_.co\_varnames 能够看到环境中的所有变量，包含函数内定义的变量以及参数变量，而\_\_code\_\_.co\_argcount 可以看到参数的个数，所以 varnames 的前 argcound 就是参数变量。\_\_defaults\_\_ 表示这些参数变量从后往前的默认值。

> Therefore, the argument names are the first N strings, where N is given by \_\_code\_\_.co\_argcount which—by the way— does not include any variable arguments prefixed with * or **. \| Page 178 (Underline).

参数可能有五种类型。
   - POSITIONAL\_OR\_KEYWORD：这个参数可能是一个位置型参数，也可能是一个可以通过关键字来指定的参数，这个是最常见的参数。
   - VAR\_POSITIONAL：是位置型参数的元组。
   - VAR\_KEYWORD：是一个关于参数的字典。
   - KEYWORD\_ONLY：一个仅仅能够通过关键字指定的参数。
   - POSITIONAL\_ONLY：一个仅仅能够通过位置来指定的参数。（目前在 Python 当中还不支持）

> The kind attribute holds one of five possible values from the \_ParameterKind class \| Page 178 (Underline).

### Function Annotations

Python 对注解所做的唯一一件事就是将它们存储在函数的 \_\_annotations\_\_ 属性中。

> The  only  thing  Python  does  with  annotations  is  to  store  them  in  the  \_\_annota tions\_\_ attribute of the function. Nothing else: no checks, enforcement, validation, or any other action is performed. In other words, annotations have no meaning to the Python interpreter. They are just metadata that may be used by tools, such as IDEs, frameworks, and decorators. \| Page 181 (Underline).

### Packages for Functional Programming

#### The operator Module

operator 库中包含了很多算术运算比如 mul 等等。

> operator \| Page 182 (Underline).

itemgetter and attrgetter 类似于 \_\_getitem\_\_ 以及 \_\_getattr\_\_，这两个函数对 lambda 表达式更友好。

> itemgetter and attrgetter \| Page 182 (Underline).

methodcaller 也可以更有利于 lambda 的使用。

> methodcaller \| Page 185 (Underline).

#### Freezing Arguments with functools.partial

functools.partial 是一个高阶函数可以允许创建一个其他参数都固定的函数。

> functools.partial is a higher-order function that allows partial application of a func‐ tion. Given a function, a partial application produces a new callable with some of the arguments of the original function fixed. \| Page 185 (Underline).

## Chapter 6. Design Patterns with First-Class Functions

### Case Study: Refactoring Strategy

#### Classic Strategy

最简单的方式来定义一个抽象类就是通过继承 abc.ABC。

> In Python 3.4, the simplest way to declare an ABC is to subclass abc.ABC \| Page 197 (Underline).

#### Choosing the Best Strategy: Simple Approach

函数是对象，也就意味着定义了之后把它当作对象来看就可以了。

> functions are first-class objects \| Page 201 (Underline).

#### Finding Strategies in a Module

Python 当中的 module 也是第一优先级的对象，和函数一样。

> Modules in Python are also first-class objects \| Page 202 (Underline).

globals() 函数以字典方式返回全局符号表。

> Return a dictionary representing the current global symbol table. This is always the dictionary of the current module (inside a function or method, this is the module where it is defined, not the module from which it is called). \| Page 202 (Underline).

黑科技，可以通过这种方式找到一个模块当中所有的函数。

> The function inspect.getmembers returns the attributes of an object—in this case, the promotions module—optionally filtered by a predicate (a boolean function). We use inspect.isfunction to get only the functions from the module. \| Page 203 (Underline).

### Command

命令有提出者，也有执行者，命令模式存在的意义就是让命令的提出者和执行者之间进行解耦。

> The goal of Command is to decouple an object that invokes an operation (the Invoker) from the provider object that implements it (the Receiver). \| Page 204 (Underline).

## Chapter 7. Function Decorators and Closures

Python 当中的装饰器是通过 closure 实现的。

> However, if you want to imple‐ ment your own function decorators, you must know closures inside out, and then the need for nonlocal becomes obvious. \| Page 209 (Underline).

### Decorators 101

注意，直接通过装饰器语法与将函数传入另一个函数是一样的。装饰器只是语法糖。

> In other words, assuming an existing decorator named decorate \| Page 210 (Underline).

这就是元编程的定义：metaprogramming—changing program behavior at runtime

> metaprogramming—changing pro‐ gram behavior at runtime \| Page 211 (Underline).

### When Python Executes Decorators

在模块被导入时，装饰器就被执行了；而函数只有在显式被调用时才会执行。

> The main point of Example 7-2 is to emphasize that function decorators are executed as soon as the module is imported, but the decorated functions only run when they are explicitly invoked \| Page 213 (Underline).

### Variable Scope Rules

当 Python 在编译一个函数时，其实变量是 local 还是 global 已经被确定了，如果有赋值就会把它判断为一个 local 的变量。也就是当仅仅读取时，会按照自由变量来搜索，而当要对这个变量进行写时，那么就把它当做一个局部变量了，除非显式对其进行声明：global and nonlocal。

> But the fact is, when Python compiles the body of the function, it decides that b is a local variable because it is assigned within the function. \| Page 216 (Underline).

### Closures

闭包的定义：一个函数的作用域被扩展了，它把一些没有在其中定义的同时也是非全局的变量放到了里面。

> Actually, a closure is a function with an extended scope that encompasses nonglobal variables referenced in the body of the function but not defined there \| Page 218 (Underline).

闭包函数内的非全局外部变量也被称作自由变量。可以通过 \_\_code\_\_.co\_freevars 来访问。也可通过 \_\_closure\_\_ 来访问。

> Within averager, series is a free variable. \| Page 220 (Underline).

### Implementing a Simple Decorator

#### How It Works

functools.wraps 这个装饰器可以对 \_\_name\_\_ 以及 \_\_doc\_\_ 进行拷贝。

> functools.wraps \| Page 225 (Underline).

### Decorators in the Standard Library

三个针对于类方法的装饰器：
   - property
   - classmethod
   - staticmethod

> Python has three built-in functions that are designed to decorate methods: property, classmethod, and staticmethod \| Page 225 (Underline).

#### Memoization with functools.lru\_cache

可以通过 lru\_cache 函数装饰器加快速度。

> A very practical decorator is functools.lru\_cache. It implements memoization: an optimization technique that works by saving the results of previous invocations of an expensive function, avoiding repeat computations on previously used arguments. \| Page 226 (Underline).

#### Generic Functions with Single Dispatch

注意，Python 没有函数重载！也就是无法根据变量的类型来执行不同的代码，但是可以通过 singledispatch 来进行实现。

> we don't have method or function overloading in Python \| Page 229 (Underline).

### Stacked Decorators

装饰器是可以嵌套的，越在前面的越是外层函数。

> When two decorators @d1 and @d2 are applied to a function f in that order, the result is the same as f = d1(d2(f)). \| Page 231 (Underline).

### Parameterized Decorators

#### A Parameterized Registration Decorator

通俗来说，装饰器模式有两种方式，第一种就是直接通过 @register 来装饰，其直接把要装饰的函数作为 register 函数的输入并返回一个输出，而 @register() 可以理解为，先执行 register() 函数，然后将这个函数的输出作为装饰器来装饰要装饰的函数。

> @register(active=False) \| Page 233 (Underline).

### Further Reading

装饰器模式的定义，也就是 decorator 和 component 需要满足同样的接口，也就是 decorator 是什么，那么 component 就是什么（duck typing）。

> The decorator conforms to the interface of the component it decorates so that its pres‐ ence is transparent to the component's clients. \| Page 240 (Underline).

# Part IV. Object-Oriented Idioms

## Chapter 8. Object References, Mutability, and Recycling

### Identity, Equality, and Aliases

通过 is 来判断地址。

> But they are distinct objects. This is the Pythonic way of writing the negative identity comparison: a is not b. \| Page 248 (Underline).

每一个对象都有地址、类型和值。is 比较的是地址，id 返回的也是地址。

> Every object has an identity, a type and a value. An object's identity never changes once it has been created; you may think of it as the object's address in memory. The is operator compares the identity of two objects; the id() function returns an integer representing its identity. \| Page 249 (Underline).

### Copies Are Shallow by Default

通过 [:] 进行的拷贝是浅拷贝。

> However,  using  the  constructor  or  [:]  produces  a  shallow  copy  (i.e.,  the  outermost container is duplicated, but the copy is filled with references to the same items held by the original container). \| Page 251 (Underline).

#### Deep and Shallow Copies of Arbitrary Objects

copy.copy and copy.deepcopy

> Using copy and deepcopy \| Page 254 (Underline).

### Function Parameters as References

Python 当中的参数传递方式只有一个：call by sharing。也就是对要传入的地址进行复制。在传入的是字面量或者不可更改对象时，那么对这个变量名的赋值其实就是重新对这个变量的地址进行了绑定，换成了右边表达式的地址，因此原地址的值并不会受到影响；当传入的是一个可变对象时，要分情况，如果改的是对象里的指针，那么外部的对象的确也会受到影响。如果重新对变量本身进行了赋值，其实外部是不会受到影响的，因为内部的变量换了一个新的地址。

> The only mode of parameter passing in Python is call by sharing \| Page 255 (Underline).

#### Mutable Types as Parameter Defaults: Bad Idea

使用可变对象作为函数参数的默认值是很傻的行为，因为默认值其实是存储在类属性当中的，对其进行更改，那么下一次再创建对象时，默认值便不是原来的值了，而是更改之后的值。

> However, you should avoid mutable objects as default values for parameters. \| Page 256 (Underline).

默认值存储在函数对象当中，如果其是可变的，那么会影响到函数的每一次调用。

> The problem is that each default value is eval‐ uated when the function is defined—i.e., usually when the module is loaded—and the default values become attributes of the function object. So if a default value is a mutable object, and you change it, the change will affect every future call of the function \| Page 258 (Underline).

### del and Garbage Collection

del 删除名字，而不删除对象，也就是变量名不可以使用了，但是如果这个对象仍然被别的变量引用，那么它不会消失，当最后一个引用被删除时，对象因为垃圾回收机制被删除。对象被删除是垃圾回收机制的结果。

> The del statement deletes names, not objects. An object may be garbage collected as result of a del command, but only if the variable deleted holds the last reference to the object, or if the object becomes unreachable \| Page 260 (Underline).

CPython 当中最主要的垃圾回收方式是引用计数。

> thon, the primary algorithm for garbage collection is reference counting. \| Page 261 (Underline).

后来加入了分代垃圾回收算法。

> a generational garbage collection algorithm \| Page 261 (Underline).

### Weak References

弱引用并不会增加引用计数。

> Weak references to an object do not increase its reference count. \| Page 262 (Underline).

如果一个表达式结果不是 None，那么 Python 控制台会自动将这个值绑定到 \_ 变量当中。

> and the Python console auto‐ matically binds the \_ variable to the result of expressions that are not None. \| Page 262 (Underline).

### Tricks Python Plays with Immutables

用 == 来判断字面量而非使用 is，尽管 Python 内部实现存在对于常用字面量的优化，使得他们共享内存空间从而可以通过 is 比较，但是用 == 永远是没错的，除了 None。

> Never depend on str or int interning! Always use == and not is to compare them for equality. Interning is a feature for internal use of the Python interpreter. \| Page 267 (Underline).

### Further Reading

Python 没有能够显式直接摧毁对象的方法。正如前面所说，通过 del 删除的仅仅是变量的名称，Python 对象只有通过垃圾回收才会被销毁。

> There is no mechanism in Python to directly destroy an object \| Page 271 (Underline).

一个流行的对于 Python 参数传递的解释是，Python 传递的是值，只不过是指针的值。

> A popular way of explaining how parameter passing works in Python is the phrase: "Parameters are passed by value, but the values are references." \| Page 271 (Underline).

## Chapter 9. A Pythonic Object

### Object Representations

\_\_format\_\_ 魔法函数是为了 str.format() 服务的。

> Regarding \_\_for mat\_\_, both the built-in function format() and the str.format() method call it to get string displays of objects using special formatting codes. \| Page 274 (Underline).

### An Alternative Constructor

对于一个类的方法，第一个参数应该是 cls 而不应该是 self。

> No self argument; instead, the class itself is passed as cls. \| Page 277 (Underline).

### classmethod Versus staticmethod

Python 不会关注 classmethod 的第一个名称是 cls 还是 self，只是名字不同而已。

> By convention, the first parameter of a class method should be named cls (but Python doesn't care how it's named). \| Page 278 (Underline).

staticmethod 和 classmethod 的区别是，这个不需要接受类自身作为参数，我们可以仅仅把它当做是放在类中的一个函数，而不是定义在外部的空间中。

> In essence, a static method is just like a plain function that happens to live in a class body, instead of being defined at the module level \| Page 278 (Underline).

staticmethod 的使用场景其实不算太多，因为他能做的 classmethod 都可以做。

> If you want to define a function that does not interact with the class, just define it in the module. \| Page 279 (Underline).

### Formatted Displays

format 内置函数和 str.format() 方法其实都是通过 \_\_format\_\_ 实现的。

> The format() built-in function and the str.format() method delegate the actual for‐ matting  to  each  type  by  calling  their  .\_\_format\_\_(format\_spec)  method \| Page 279 (Underline).

### A Hashable Vector2d

前面两个下划线，可以让属性变成私有。

> Use exactly two leading underscores (with zero or one trailing underscore) to make an attribute private.6 \| Page 284 (Underline).

当实现 \_\_hash\_\_ 时，推荐通过 XOR (^) 来混合多个属性的哈希值。

> The \_\_hash\_\_ special method documentation suggests using the bitwise XOR operator (^) to mix the hashes of the components \| Page 284 (Underline).

### Private and “Protected” Attributes in Python

如果没有双下划线来标识私有属性，那么这个类的子类可能偶然间覆盖了父类的内部属性。为了防止这个情况发生，Python 会识别出带有双下划线的属性，然后将其存储到 \_\_dict\_\_ 中，并且附上类的名字，比如  \_\_mood becomes \_Dog\_\_mood，这样就防止了覆盖发生，也就叫做 name mangling。

> Consider  this  scenario:  someone  wrote  a  class  named  Dog  that  uses  a  mood  instance attribute internally, without exposing it. You need to subclass Dog as Beagle. If you create your own mood instance attribute without being aware of the name clash, you will clobber the mood attribute used by the methods inherited from Dog. This would be a pain to debug. \| Page 288 (Underline).

通过下划线设置的私有变量是无法直接访问的，就像是 v.\_\_x 是不被允许的。而是要通过 v.\_类名\_\_x 来访问这个变量。

> They can also directly assign a value to a private component of a Vector2d by simply writing v1.\_Vector\_\_x = 7. But if you are doing that in production code, you can't complain if something blows up. \| Page 289 (Underline).

单下划线前缀对 Python 解释器没有特殊意义。但它是Python程序员之间的一个非常强大的惯例：您不应从类外访问此类属性。就像常量需要大写一样。

> The single underscore prefix has no special meaning to the Python interpreter when used in attribute names, but it's a very strong convention among Python programmers that you should not access such attributes from outside the class \| Page 290 (Underline).

### Saving Space with the \_\_slots\_\_ Class Attribute

Python 通过 \_\_dict\_\_ 存储每一个实例的属性，但是，因为字典是用哈希表实现的，所以这样子会造成很大的空间浪费，尤其是实例比较多但是属性却不多的时候，这个时候我们可以使用 \_\_slot\_\_ 来优化内存空间的布局。

> By default, Python stores instance attributes in a per-instance dict named \_\_dict\_\_. As we saw in "Practical Consequences of How dict Works" on page 90, dictionaries have a significant memory overhead because of the underlying hash table used to provide fast  access.  If  you  are  dealing  with  millions  of  instances  with  few  attributes,  the \_\_slots\_\_ class attribute can save a lot of memory, by letting the interpreter store the instance attributes in a tuple instead of a dict. \| Page 290 (Underline).

可以直接在类中定义 \_\_slots\_\_，只要是一个 iterable 即可。这样子 Python 解释器会把它所有的属性值放在元组当中，从而防止了空间浪费。\_\_slots\_\_ 好像也可以优化时间，因为列表中的 get 和 set 操作的最差时间复杂度是 O(1)，因为在内存中更加紧凑。但是字典中是 O(n)。关于 Python 中 \_\_slots\_\_ 是如何被实现的，仍然可以进一步进行探究。

> By defining \_\_slots\_\_ in the class, you are telling the interpreter: "These are all the instance attributes in this class." Python then stores them in a tuple-like structure in each instance, avoiding the memory overhead of the per-instance \_\_dict\_\_. \| Page 291 (Underline).

如果写明了 \_\_slots\_\_，那么将不允许有其他属性存在。但是 \_\_slots\_\_ 应当是为了优化而存在，而非为了程序的限制，比如属性的限制。

> \_\_slots\_\_  should  used  for  optimiza‐ tion, not for programmer restraint. \| Page 292 (Underline).

## Chapter 10. Sequence Hacking, Hashing, and Slicing

### Protocols and Duck Typing

sequence protocol 仅仅要求实现 \_\_len\_\_ 和 \_\_getitem\_\_ 即可。

> For example, the sequence protocol in Python entails just the \_\_len\_\_ and \_\_getitem\_\_ methods. Any class Spam that imple‐ ments those methods with the standard signature and semantics can be used anywhere a sequence is expected. Whether Spam is a subclass of this or that is irrelevant; all that matters is that it provides the necessary methods. \| Page 305 (Underline).

### Vector Take #3: Dynamic Attribute Access

当通过 my\_obj.x 这种方式获取属性失败时，Python 解释器会通过 \_\_getattr\_\_ 来得到需要的属性。

> "The \_\_getattr\_\_ method is invoked by the interpreter when attribute lookup fails. In simple terms, given the expression my\_obj.x, Python checks if the my\_obj instance has an attribute named x; if not, the search goes to the class (my\_obj.\_\_class\_\_), and then up the inheritance graph.2 If the x attribute is not found, then the \_\_getattr\_\_ method defined in the class of my\_obj is called with self and the name of the attribute as a string (e.g., 'x'). \| Page 311 (Underline).

无论是添加属性还是修改属性，都会触发 \_\_setattr\_\_ 这个函数的执行。

> \_\_setattr\_\_ \| Page 313 (Underline).

## Chapter 11. Interfaces: From Protocols to ABCs

Interfaces, protocols and ABCs, 这三者是什么关系？我认为前者包含了后两者，而 protocol 指的是一种软性的约束，而 ABC 指的是一种硬性的约束。

> Interfaces are the subject of this chapter: from the dynamic protocols that are the hall‐ mark of duck typing to abstract base classes (ABCs) that make interfaces explicit and verify implementations for conformance. \| Page 333 (Underline).

在 Python 当中，部分实现的接口也是被允许的。

> We'll start the chapter by reviewing how the Python community traditionally under‐ stood interfaces as somewhat loose—in the sense that a partially implemented interface is often acceptable. \| Page 333 (Underline).

使用 ABC 所带来的过度软件工程的风险是很高的。

> The  risk  of  overengineering with ABCs is very high. \| Page 334 (Underline).

### Interfaces and Protocols in Python Culture

interface 的一个有用的定义是：一个对象的公开方法的子集，其允许这个对象在某一个上下文中扮演某一个角色。

> A useful complementary definition of interface is: the subset of an object's public meth‐ ods that enable it to play a specific role in the system \| Page 335 (Underline).

一个类可能会实现多个协议，保证其能够同时扮演多个角色。

> A class may implement several protocols, enabling its in‐ stances to fulfill several roles. \| Page 335 (Underline).

在 Python 当中，一个最基础的接口是 sequence protocol。

> One of the most fundamental interfaces in Python is the sequence protocol. \| Page 336 (Underline).

### Python Digs Sequences

sequence protocol 的官方定义。

> shows how the formal Sequence interface is defined as an ABC. \| Page 336 (Underline).

如果没有实现 \_\_iter\_\_，那么会通过 \_\_getitem\_\_ 来迭代数据。\_\_getitem\_\_ 的输入并不必须是整数，其他类型比如字符串也可以。

> There is no method \_\_iter\_\_ yet Foo instances are iterable because—as a fallback— when Python sees a \_\_getitem\_\_ method, it tries to iterate over the object by calling that method with integer indexes starting with 0. \| Page 337 (Underline).

### Alex Martelli’s Waterfowl

不推荐使用 isinstance，也不推荐使用 type 来比较，因为它们抑制了最简单的形式，继承。

> In Python, this mostly boils down to avoiding the use of isinstance to check the object's type  (not  to  mention  the  even  worse  approach  of  checking,  for  example,  whether type(foo) is bar—which is rightly anathema as it inhibits even the simplest forms of inheritance!). \| Page 340 (Underline).

goose typing：使用 isinstance(obj, cls) 是可以接受的，只要 cls 是一个抽象基类（ABC），也就意味着它继承了 abc.ABCMeta。因为有可能有许多不相关的类，其实他们的接口是类似的，直接通过 duck typing 可能并无意义，因此通过 instance 来进行类的判断也是有必要的（个人理解）。

> What goose typing means is: isinstance(obj, cls) is now just fine... as long as cls is an abstract base class—in other words, cls's metaclass is abc.ABCMeta. \| Page 341 (Underline).

一个类即使没有继承 abc.Sized，但是它实现了 \_\_len\_\_ 方法，那么 isinstance(obj, abc.Sized) 仍然返回 True。

> As you see, abc.Sized recognizes Struggle as "a subclass," with no need for registration, as implementing the special method named \_\_len\_\_ is all it takes (it's supposed to be implemented with the proper syntax—callable without arguments—and semantics— returning a nonnegative integer denoting an object's "length"; any code that implements a specially named method, such as \_\_len\_\_, with arbitrary, non-compliant syntax and semantics has much worse problems anyway). \| Page 342 (Underline).

### Subclassing an ABC

Python 在导入的时候并不会检查对基类实现的是否完善，相反，在真正试图初始化的时候，Python 会发现 \_\_delitem\_\_ 没有被实现而报错：不能初始化一个 abstract method。

> Python does not check for the implementation of the abstract methods at import time (when the frenchdeck2.py module is loaded and compiled), but only at runtime when we actually try to instantiate FrenchDeck2. \| Page 345 (Underline).

### ABCs in the Standard Library

#### ABCs in collections.abc

collections.abc 的所有 ABCs （共 16 个）之间的 UML 关系。

> Figure 11-3 is a summary UML class diagram (without attribute names) of all 16 ABCs defined in collections.abc as of Python 3.4. \| Page 347 (Underline).

Java 当中不允许多继承，除了 interface。

> Multiple inheritance was considered harmful and excluded from Java, except for interfaces: Java interfaces can extend multiple interfaces, and Java classes can implement multiple interfaces. \| Page 347 (Underline).

三个很基础的 ABC，都是仅仅实现一个函数，第一个是 Iterable，只要实现了 \_\_iter\_\_ 就是 Iterable。第二个是 Container，只要实现了 \_\_contains\_\_ 就是 Container，第三个是 Sized，只要实现了 \_\_len\_\_ 就是 Sized。

> Iterable supports iteration with \_\_iter\_\_, Container supports the in operator with \_\_contains\_\_, and Sized supports len() with \_\_len\_\_. \| Page 348 (Underline).

#### The Numbers Tower of ABCs

Intergral 继承于 Rational，Rational 继承于 Real，Real 继承于 Complex，Complex 继承于 Number。这是关于数的 ABC 之间的继承塔。

> numerical tower \| Page 349 (Underline).

### Defining and Using an ABC

abc.abstractmethod 和 classmethod 以及 staticmethod 都是不一样的，前者的类不能实例化，如果子类没有实现这个函数，那么也不能实例化，但是后两者可以。这两个装饰器可以一起使用。

> @abc.abstractmethod \| Page 351 (Underline).

为了定义一个 ABC，可以通过继承 abc.ABC（abc 可以通过 import abc 来实现）。

> To define an ABC, subclass abc.ABC. \| Page 352 (Underline).

一个 ABC 可以包含 concrete method，只要有一个是纯虚函数就可以当做是抽象基类（ABC）。

> An ABC may include concrete methods. \| Page 352 (Underline).

#### A Virtual Subclass of Tombola

goose typing 的精髓是，我们可以 register 一个类为一个 ABC 的虚拟子类，即使它并没有继承它。这是一种约定，解释器并不会进行检查，如果我们没有实现，那么就会出现一个运行时异常。

> An essential characteristic of goose typing—and the reason why it deserves a waterfowl name—is the ability to register a class as a virtual subclass of an ABC, even if it does not inherit from it. \| Page 358 (Underline).

通过 register 实现的被称为虚拟子类，这种类的特点就是可以被 issubclass 和 isinstance 识别，但是不会继承父类的属性和方法。

> This is done by calling a register method on the ABC. The registered class then be‐ comes a virtual subclass of the ABC, and will be recognized as such by functions like issubclass and isinstance, but it will not inherit any methods or attributes from the ABC. \| Page 358 (Underline).

继承信息会被记录在一个特殊函数 \_\_mro\_\_ 中，其全称是 Method Resolution Order。这个函数会将类所有的父类按顺序列出来以供方法的查找。虚拟子类的 \_\_mro\_\_ 中不会包含其所虚拟继承的父类的信息。

> However, inheritance is guided by a special class attribute named \_\_mro\_\_—the Method Resolution Order. It basically lists the class and its superclasses in the order Python uses to search for methods.1 \| Page 360 (Underline).

### How the Tombola Subclasses Were Tested

这个函数可以找到所有的子类。

> \_\_subclasses\_\_() \| Page 362 (Underline).

这个属性可以找到所有的虚拟子类。

> \_abc\_registry \| Page 362 (Underline).

### Further Reading

C++ 到底是强类型还是弱类型？这也是一个没有定论的问题吧，我倾向于认为其是弱类型的，因为有很多的隐式类型转换。

> Java, C++, and Python are strongly typed. \| Page 370 (Underline).

静态类型和动态类型的准确定义。

> If type-checking is performed at compile time, the language is statically typed; if it happens at runtime, it's dynamically typed. \| Page 370 (Underline).

什么是 Monkey Patching？摘自一个 Stack Overflow 上的定义：For instance, consider a class that has a method get\_data. This method does an external lookup (on a database or web API, for example), and various other methods in the class call it. However, in a unit test, you don't want to depend on the external data source - so you dynamically replace the get\_data method with a stub that returns some fixed data.

> Monkey Patching \| Page 371 (Underline).

## Chapter 12. Inheritance: For Good or For Worse

### Subclassing Built-In Types Is Tricky

最好不要继承内置类型比如 dict 或者 list，因为这些内置类型的方法有可能忽视用户重载之后的方法，还是调用自己的方法。如果想要继承，那么最好通过继承 collections 里的 UserDict, UserList 以及 UserString 更好一些。

> Subclassing built-in types like dict or list or str directly is errorprone  because  the  built-in  methods  mostly  ignore  user-defined overrides. \| Page 375 (Underline).

### Multiple Inheritance and Method Resolution Order

diamond problem：多继承中如果两个不相关的父类拥有同一个属性和方法，那么子类应当如何进行处理？

> Any language implementing multiple inheritance needs to deal with potential naming conflicts when unrelated ancestor classes implement a method by the same name. This is called the "diamond problem," \| Page 377 (Underline).

竟然还可以通过这种方式来调用父类的方法，学到了。其实也很正常，这个函数是这个类的一个属性，所以可以直接调用，第一个参数是 self 需要传入一个对象，所以传入 d 也是理所应当的。

> C.pong(d) \| Page 378 (Underline).

MRO 和继承的顺序有关，比如 class D(B, C) 和 class D(C, B)。

> The MRO takes into account not only the inheritance graph but also the order in which superclasses  are  listed  in  a  subclass  declaration.  In  other  words,  if  in  diamond.py (Example 12-4) the D class was declared as class D(C, B):, the \_\_mro\_\_ of class D would be different: C would be searched before B. \| Page 380 (Underline).

### Multiple Inheritance in the Real World

23 种设计模式中，只有适配器模式使用了多继承，所以看来多继承并不是万能药。

> It is possible to put multiple inheritance to good use. The Adapter pattern in the Design Patterns book uses multiple inheritance, so it can't be completely wrong to do it (the remaining 22 patterns in the book use single inheritance only, so multiple inheritance is clearly not a cure-all). \| Page 382 (Underline).

### Coping with Multiple Inheritance

#### 3. Use Mixins for Code Reuse

Mixin 是多继承中特有的概念，后面再进行解释。

> mixin class \| Page 385 (Underline).

#### 5. An ABC May Also Be a Mixin; The Reverse Is Not True

ABC 可以作为其他类的基类，但是 Mixin 不能够单独被继承。

> And an ABC can be the sole base class of any other class, while a mixin should never be subclassed alone except by another \| Page 386 (Underline).

#### 6. Don’t Subclass from More Than One Concrete Class

一个 concrete class 最多继承一个 concrete class，其他的只能是 ABC 或者 Mixin。这是多继承中需要遵守的原则之一。

> Concrete classes should have zero or at most one concrete superclass.6 In other words, all but one of the superclasses of a concrete class should be ABCs or mixins. For example, in the following code, if Alpha is a concrete class, then Beta and Gamma must be ABCs or mixins \| Page 386 (Underline).

### Further Reading

Keep it simple, stupid.

> KISS principle \| Page 394 (Underline).

CPython 中的这种设计是一种 tradeoff，dict, list, str 难于扩展，但是它们的速度很快；UserDict, UserList 和 UserString 容易扩展，但是它们的速度相对较慢。

> But wait, this is what we have: UserDict, UserList, and UserString are not as fast as the built-ins but are easily extensible. \| Page 394 (Underline).

## Chapter 13. Operator Overloading: Doing It Right

### Unary Operators

运算符的基本法则：一定要返回一个新对象。

> but stick to the fundamental rule of operators: always return a new object. \| Page 399 (Underline).

### Overloading + for Vector Addition

当当前对象是右操作数时，会调用 \_\_radd\_\_ 函数。

> The \_\_radd\_\_ method is called the "reflected" or "reversed" version of \_\_add\_\_. \| Page 404 (Underline).

如果一个操作数特殊方法由于类型不兼容，并没有返回一个可行的结果，那么它应当返回 NotImplemented 并且不抛出 TypeError。因为当返回 NotImplemented 时，Python 仍然能够进一步调用这个方法的 reversed 版本，比如 \_\_radd\_\_。这样子报错信息也更友好。

> The problems in Examples 13-8 and 13-9 actually go deeper than obscure error mes‐ sages: if an operator special method cannot return a valid result because of type incom‐ patibility, it should return NotImplemented and not raise TypeError. By returning No tImplemented, you leave the door open for the implementer of the other operand type to perform the operation when Python tries the reversed method call. \| Page 405 (Underline).

### Overloading * for Scalar Multiplication

@ 代表矩阵乘积。此功能在 Python 3.5 当中加入。

> These meth‐ ods are not used anywhere in the standard library at this time, but are recognized by the interpreter in Python 3.5 so the NumPy team—and the rest of us—can support the @ operator in user-defined types. The parser was also changed to handle the infix @ \| Page 409 (Underline).

### Augmented Assignment Operators

如果实现了 \_\_iadd\_\_，那么就是 inplace 加法，如果没有实现，那么就是调用 a = a + b，总是返回一个新的值。

> However,  if  you  do  implement  an  in-place  operator  method  such  as  \_\_iadd\_\_,  that method is called to compute the result of a += b. As the name says, those operators are expected to change the lefthand operand in place, and not create a new object as the result. \| Page 415 (Underline).

\_\_iadd\_\_ 这种类型的特殊函数一定要返回 self。

> Very important: augmented assignment special methods must return self. \| Page 418 (Underline).

# Part V. Control Flow

## Chapter 14. Iterables, Iterators, and Generators

range 返回的是 generator，并不是全部的列表。

> Even  the  range()  built-in  now  returns  a generator-like object instead of full-blown lists like before. \| Page 428 (Underline).

generator 和协程看起来类似，但是实际上是非常不同的。

> not be mixed Why generators and coroutines look alike but are actually very different and should \| Page 428 (Underline).

### Sentence Take #1: A Sequence of Words

#### Why Sequences Are Iterable: The iter Function

正如前面所提到的，实现了 \_\_getitem\_\_ 就是 Iterable。

> That is why any Python sequence is iterable: they all implement \_\_getitem\_\_. \| Page 430 (Underline).

### Iterables Versus Iterators

Iterator 和 Iterable 的关系很明确，Python 解释器通过 \_\_iter\_\_ 从 Iterable 对象中获取 Iterator。

> It's important to be clear about the relationship between iterables and iterators: Python obtains iterators from iterables. \| Page 432 (Underline).

Iterator 继承了 Iterable，同时增加了 \_\_next\_\_ 函数来获取下一项。

> This is formalized in the collections.abc.Iterator ABC, which defines the \_\_next\_\_ abstract  method,  and  subclasses  Iterable—where  the  abstract  \_\_iter\_\_  method  is defined. \| Page 433 (Underline).

如果想要重置 Iterator，最好别在上面调用 iter，而是在原始的 Iterable 上进行调用。

> Calling iter(...)  on  the itself  won't  help,  because—as  mentioned—Itera tor.\_\_iter\_\_ is implemented by returning self, so this will not reset a depleted iter‐ ator. iterator \| Page 435 (Underline).

### Sentence Take #2: A Classic Iterator

#### Making Sentence an Iterator: Bad Idea

不要把一个类同时当做 Iterable 和 Iterator，这两者要分开。

> It may be tempting to implement \_\_next\_\_ in addition to \_\_iter\_\_ in the Sentence class, making each Sentence instance at the same time an iterable and iterator over itself. But this is a terrible idea. It's also a common anti-pattern, according to Alex Mar‐ telli who has a lot of experience with Python code reviews. \| Page 437 (Underline).

### Sentence Take #3: A Generator Function

#### How a Generator Function Works

任何有 yield 的 Python 函数被认为是生成器函数（generator function），这个函数当被调用时，返回一个生成器对象（generator object），可以这么说，一个 generator function 其实是一个生成器工厂。

> Any Python function that has the yield keyword in its body is a generator function: a function which, when called, returns a generator object. In other words, a generator function is a generator factory. \| Page 439 (Underline).

### Generators as Coroutines

协程是在生成器之上添加了新的方法，比如 send()。

> This proposal added extra methods and functionality to generator objects, most notably the .send() method. \| Page 465 (Underline).

send() 函数其实是与 \_\_next\_\_() 函数类似的，都是告诉 generator 要开始到下一个 yield，它们的区别在于 send() 函数可以发送信息进去。

> Like .\_\_next\_\_(), .send() causes the generator to advance to the next yield, but it also allows the client using the generator to send data into it: whatever argument is passed to .send() becomes the value of the corresponding yield expression inside the generator function body. \| Page 465 (Underline).

### Further Reading

每一个 generator 都是 iterator。

> every generator is an iterator. \| Page 469 (Underline).

Python 当中对于 Iterator 和 generator 的区分并不明显，通常是当做同一个东西。

> In reality, Python programmers are not strict about this distinction: generators are also called iterators, even in the official docs. \| Page 470 (Underline).

## Chapter 15. Context Managers and else Blocks

### Do This, Then That: else Blocks Beyond if

两种编程方式，第一种是 EAFP，也就是通过 try catch 的方式来完成控制流，这种方式比较大胆，也就是先干再说；LBYL 相对来说比较谨慎，在检查条件满足之后才会执行，这种方式往往会引入很多的 if 语句。

> Easier to ask for forgiveness than permission. This common Python coding style assumes the existence of valid keys or attributes and catches exceptions if the as‐ sumption proves false. This clean and fast style is characterized by the presence of many try and except statements. The technique contrasts with the LBYL style com‐ mon to many other languages such as C. \| Page 475 (Underline).

### Context Managers and with Blocks

上下文管理协议包含 \_\_enter\_\_ 和 \_\_exit\_\_ 两个方法。

> The context manager protocol consists of the \_\_enter\_\_ and \_\_exit\_\_ methods. \| Page 476 (Underline).

with 语句不会创建一个新的作用域。

> with blocks don't define a new scope \| Page 476 (Underline).

在通过 with 后的语句创建一个对象后，这个对象的 \_\_enter\_\_ 会自动被调用，并且将返回的值绑定到 as 后的变量当中。

> Python invokes \_\_enter\_\_ with no arguments besides self. \| Page 478 (Underline).

\_\_exit\_\_ 函数应当是 with 的函数体执行完毕后执行的，如果执行过程（该执行过程指的是 with 的代码体，不包含代码头，如果代码头发生了异常，比如在创建变量时或者通过 \_\_enter\_\_ 进入上下文时发生的异常，那么通过 \_\_exit\_\_ 是捕获不到异常的）中没有发生异常，那么参数都是 None，如果发生了异常那么参数就是异常。

> Python calls \_\_exit\_\_ with None, None, None if all went well; if an exception is raised, the three arguments get the exception data, as described next. \| Page 478 (Underline).

如果 \_\_exit\_\_ 返回了 True，那么异常不会传播，否则异常会向上传播。

> If \_\_exit\_\_ returns None or anything but True, any exception raised in the with block will be propagated. \| Page 478 (Underline).

### Using @contextmanager

一个生成器函数（生成器函数是有 yield 的函数）可以用来作为上下文管理器使用，\_\_enter\_\_ 执行的是 yield 之前的部分，而 \_\_exit\_\_ 执行的是 yield 之后的部分。相当于是在函数中间打了一个断点。

> In a generator decorated with @contextmanager, yield is used to split the body of the function in two parts: everything before the yield will be executed at the beginning of the while block when the interpreter calls \_\_enter\_\_; the code after yield will run when \_\_exit\_\_ is called at the end of the block. \| Page 481 (Underline).

### Further Reading

这个想法挺有意思，子程序是把公共的部分抽取了出来，类似于相同的酱换不同的面包；context manager 类似于相同的面包，但是中间的酱可以随意定制。

> It's like factoring out the filling in a sandwich: using tuna with different breads. But what if you want to factor out the bread, to make sandwiches with wheat bread, using a different filling each time? That's what the with statement offers. It's the complement of the subroutine. \| Page 486 (Underline).

## Chapter 16. Coroutines

yield 在英语字典中的本意有两个：生产（produce）和让位（give way）。在协程中这两个都是很贴切的，Python 协程可以通过 yield 返回值，同时也可以通过 yield 为其他程序的执行让位。

> We find two main senses for the verb "to yield" in dictionaries: to produce or to give way. Both senses apply in Python when we use the yield keyword in a generator. A line such as yield item produces a value that is received by the caller of next(...), and it also gives way, suspending the execution of the generator so that the caller may proceed until it's ready to consume another value by invoking next() again. The caller pulls values from the generator. \| Page 489 (Underline).

### Basic Behavior of a Generator Used as a Coroutine

一个协程存在四种状态：
   1. GEN\_CREATED：等待开始执行；
   2. GEN\_RUNNING：正在被解释器执行；
   3. GEN\_SUSPENDED：当前在 yield 处被挂起；
   4. GEN\_CLOSED：执行已结束。

> A coroutine can be in one of four states. \| Page 491 (Underline).

next 其实就是 send(None)。当协程刚被创建时，其状态是 GEN\_CREATED，还无法接受参数，所以需要先通过 next 进行初始化，或者通过 sene(None)。

> That's why the first activation of a coroutine is always done with next(my\_coro)—you can also call my\_coro.send(None), and the effect is the same. \| Page 492 (Underline).

初始的 next() 调用通常被描述成为 "priming" 协程，或者说是点火协程。

> The initial call next(my\_coro) is often described as "priming" the coroutine (i.e., ad‐ vancing it to the first yield to make it ready for use as a live coroutine). \| Page 492 (Underline).

对于 b = yield a，是先 yield 再 赋值，因为就是在 yield 处被挂起的。

> This means that in a line like b = yield a, the value of b will only be set when the coroutine is activated later by the client code. \| Page 493 (Underline).

### Decorators for Coroutine Priming

functools.wraps 的作用是，因为直接使用装饰器会导致原来函数的信息丢失（函数名、参数列表、函数 docstring），通过 wraps(func)，能把 func 的这些信息拷贝到被装饰的函数中，从而保留这些信息。

> @wraps(func) \| Page 496 (Underline).

### Coroutine Termination and Exception Handling

可以通过 gen.throw 来向协程传入异常。

> generator.throw(exc\_type[, exc\_value[, traceback]]) \| Page 498 (Underline).

### Returning a Value from a Coroutine

协程当中除了 yield 之外，也是可以有返回值的。

> return Result(count, average) \| Page 501 (Underline).

### Using yield from

这条比较重要：yield from 的参数可以是任何 iterable，因为会自动执行 iter() 来获取 iterator。注意，Python 3.5 之后加入了新的 async await 语法，所以我们可以不适用 yield from 而使用新的语法来使用协程。

> The first thing the yield from x expression does with the x object is to call iter(x) to obtain an iterator from it. This means that x can be any iterable. \| Page 504 (Underline).

yield from 涉及到的部分：caller/client：调用者；delegating generator：外层 generator；subgenerator：内层 generator。

> PEP 380 uses some terms in a very specific way \| Page 504 (Underline).

当 delegating generator 因为 yield from 被挂起时，调用者会直接绕过它，而直接把数据发送到 subgenerator 中。当 subgenerator 抛出 StopIteration 异常并返回时，delegating generator 才会恢复，同时，返回值会绑定到 yield from 前的赋值语句中而非 caller。

> While the delegating generator is suspended at yield from, the caller sends data directly to the subgenerator, which yields data back to the caller. The delegating generator resumes when the subgenerator returns and the interpreter raises StopItera‐ tion with the returned value attached. \| Page 505 (Underline).

### The Meaning of yield from

yield from 具体的六个设计点。

> I reproduce them almost exactly here, except that I replaced every occurrence  of  the  ambiguous  word  "iterator"  with  "subgenerator"  and  added  a  few clarifications. Example 16-17 illustrates these four points \| Page 509 (Underline).

yield from 第一个设计点：任何 subgenerator yield 的值都会直接传递给 caller。

> Any values that the subgenerator yields are passed directly to the caller of the del‐ egating generator (i.e., the client code). \| Page 510 (Underline).

yield from 第二个设计点：任何通过 send 传入的值都会直接传递给 subgenerator。

> Any values sent to the delegating generator using send() are passed directly to the subgenerator. If the sent value is None, the subgenerator's \_\_next\_\_() method is called. If the sent value is not None, the subgenerator's send() method is called. If the call raises StopIteration, the delegating generator is resumed. Any other ex‐ ception is propagated to the delegating generator. \| Page 510 (Underline).

yield from 第三个设计点：任何 generator 当中的 return 都会直接抛出一个 StopIteration 的异常。

> return expr in a generator (or subgenerator) causes StopIteration(expr) to be raised upon exit from the generator. \| Page 510 (Underline).

如果要深入理解 yield from 的伪代码，可以参考这个伪代码。

> Pseudocode equivalent to the statement RESULT = yield from EXPR in the delegating generator \| Page 513 (Underline).

### Use Case: Coroutines for Discrete Event Simulation

事件驱动的编程，使用协程很合适，因为协程的优势在于协作。

> Coroutines are a natural way of expressing many algorithms, such as simulations, games, asynchronous I/O, and other forms of event-driven programming or co-operative mul‐ titasking. \| Page 515 (Underline).

#### About Discrete Event Simulations

在模拟领域中，process 指的是一个实体的动作，而非操作系统层面的 process。

> In the field of simulation, the term process refers to the activities of an entity in the model, and not to an OS process. A simulation process may be implemented as an OS process, but usually a thread or a coroutine is used for that purpose. \| Page 516 (Underline).

### Further Reading

Python 的问题时关键词太少，比如 for 循环可以使用 else，不如重新定义一个新的更加清楚的关键字；def 可以用来定义函数、生成器以及协程，这三者有很大的不同，都使用 def 来定义容易造成误解。

> Now, back to Python syntax. I think Guido is too conservative with keywords. It's nice to have a small set of them, and adding new keywords potentially breaks a lot of code. But the use of else in loops reveals a recurring problem: the overloading of existing keywords when a new one would be a better choice. In the context of for, while, and try, a new then keyword would be preferable to abusing else. The most serious manifestation of this problem is the overloading of def: it's now used to define functions, generators, and coroutines—objects that are too different to share the same declaration syntax. \| Page 529 (Underline).

## Chapter 17. Concurrency with Futures

### Example: Web Downloads in Three Styles

#### Where Are the Futures?

Future 和 JS 当中的 Promise 是比较类似的。

> and Promise objects in various JavaScript libraries. \| Page 537 (Underline).

future.done() 函数可以判断是否执行完成，这个函数是非阻塞的。future.add\_done\_callback() 函数可以用拉力注册回调函数。

> Both types of Future have a .done() method that is nonblocking and returns a Boolean that tells you whether the callable linked to that future has executed or not.  That's why both Future classes have an .add\_done\_callback() method: you give it a callable, and the callable will be invoked with the future as the single argument when the future is done. \| Page 538 (Underline).

调用 .result() 会直接阻塞直到返回结果。

> invoking f.result() will block the caller's thread until the result is ready. \| Page 538 (Underline).

### Blocking I/O and the GIL

Python 程序可以在多个 CPU 上执行，只不过由于 GIL 的存在，同一时刻只有一个线程能够执行。

> That's why a single Python process usually cannot use multiple CPU cores at the same time.3 \| Page 541 (Underline).

Python 的多线程适合 IO 密集型程序。

> Python threads are per‐ fectly usable in I/O-bound applications, despite the GIL. \| Page 541 (Underline).

### Launching Processes with concurrent.futures

ProcessPoolExecutor 和 ThreadPoolExecutor 都实现了通用的 Executor 接口，这样子从一个基于多线程的程序切换到一个基于多进程的程序将非常简单。

> Both ProcessPoolExecutor and ThreadPoolExecutor implement the generic Execu tor interface, so it's very easy to switch from a thread-based to a process-based solution using concurrent.futures. \| Page 541 (Underline).

## Chapter 18. Concurrency with asyncio

注意，这一章关于 asyncio 的部分已经过时了，因为装饰器和 yield from 已经换成了 async 关键字和 await 了。但是本质还没有过时，asyncio 是通过协程实现的，相对于通过线程实现，

> Concurrency with asyncio \| Page 563 (Underline).

asyncio 这个库其实是通过协程以及 event loop 实现了对于并行的支持。

> This chapter introduces asyncio, a package that implements concurrency with corou‐ tines driven by an event loop. It's one of the largest and most ambitious libraries ever added to Python. \| Page 564 (Underline).

通过 asyncio 来进行异步编程来编写网络应用，不需要使用线程或者进程。

> How asynchronous programming manages high concurrency in network applica‐ tions, without using threads or processes \| Page 564 (Underline).

### Thread Versus Coroutine: A Comparison

没有 API 能够终止一个线程，必须通过发送信息的方式来让线程自动停止执行。

> Note that, by design, there is no API for terminating a thread in Python. You must send it a message to shut down. Here I used the signal.go attribute: when the main thread sets it to false, the spinner thread will eventually notice and exit cleanly \| Page 567 (Underline).

asyncio 提供的协程最好使用 asyncio.coroutine 装饰器来进行装饰。

> Coroutines  intended  for  use  with  asyncio  should  be  decorated  with  @asyn cio.coroutine.  This  not  mandatory,  but  is  highly  advisable.  See  explanation following this listing. \| Page 568 (Underline).

# Part VI. Metaprogramming

## Chapter 19. Dynamic Attributes and Properties

Python 当中，属性和方法都被称为 attribute，相对于属性，方法唯一的不同就是它是 callable 的。

> Data attributes and methods are collectively known as attributes in Python: a method is just an attribute that is callable. \| Page 611 (Underline).

Python 当中通过点来获取属性，是通过 \_\_getattr\_\_ 以及 \_\_setattr\_\_ 来实现的，当然，也可以实现所谓的虚拟属性来保证即使计算属性值，而不是真实存在的属性。

> The interpreter calls special methods such as  \_\_get attr\_\_  and  \_\_setattr\_\_  to  evaluate  attribute  access  using  dot  notation  (e.g., obj.attr).  A  user-defined  class  implementing  \_\_getattr\_\_  can  implement  "virtual attributes" by computing values on the fly whenever somebody tries to read a nonexis‐ tent attribute like obj.no\_such\_attribute. \| Page 611 (Underline).

### Data Wrangling with Dynamic Attributes

两个上下文管理器可以并列来写。

> with using two context managers (allowed since Python 2.7 and 3.1) to read the remote file and save it. \| Page 613 (Underline).

#### Flexible Object Creation with \_\_new\_\_

我们一直以为 \_\_init\_\_ 是构造函数，但是其实真正的构造函数是 \_\_new\_\_，这个函数是一个类函数，这个函数不需要通过 @classmethod 来装饰是因为这个函数得到了特殊的待遇。

> We often refer to \_\_init\_\_ as the constructor method, but that's because we adopted jargon from other languages. The special method that actually constructs an instance is \_\_new\_\_: it's a class method \| Page 618 (Underline).

注意：\_\_new\_\_ 函数可以有参数，第一个参数是类自己，后面还可以接其他的参数，详见此伪代码。

> new\_object = the\_class.\_\_new\_\_(some\_arg) \| Page 619 (Underline).

### Using a Property for Attribute Validation

当前我们看到的都是通过 property 实现只读属性，我们也可以创建同时可读可写的属性。

> So far, we have only seen the @property decorator used to implement read-only prop‐ erties. In this section, we will create a read/write property. \| Page 630 (Underline).

#### LineItem Take #2: A Validating Property

可以通过 .setter 装饰器来使得一个 property 变得可写。

> The decorated getter has a .setter attribute, which is also a decorator; this ties the getter and setter together. \| Page 632 (Underline).

### A Proper Look at Properties

property 其实是 Python 当中的一个类。

> Although often used as a decorator, the property built-in is actually a class. \| Page 632 (Underline).

property 是一个类，它的构造函数是这样的：可以设置 get 函数，可以设置 set 函数，可以设置 del 函数，以及可以设置文档。

> property(fget=None, fset=None, fdel=None, doc=None) \| Page 633 (Underline).

一个类中存在的 property 是会影响到这个实例中属性的查找的。

> The presence of a property in a class affects how attributes in instances of that class can be found in a way that may be surprising at first. The next section explains. \| Page 633 (Underline).

#### Properties Override Instance Attributes

当 Class 有一个属性（类属性），同时 instance 也有一个对象属性的话，对象的属性会 shadow 掉 Class 的属性（非 property 的情况）——至少对于从 instance 来获取属性是如此。也就是通过 obj.name 来获取的话会获取的是对象的属性，但是如果是通过 Class.name 来获取，获取的仍然是类的属性。

> when an instance and its class both have a data attribute by the same name, the instance attribute overrides, or shad‐ ows, the class attribute \| Page 634 (Underline).

然而，通过 \_\_dict\_\_ 来更改 instance 的含有 property 的属性值，在属性获取时并不会更改，因为其并不能覆盖掉通过 property 装饰器所装饰的属性。只有从类的层面把 property 的属性更改了，通过对象拿的属性才是通过 \_\_dict\_\_ 拿到的，也就是 property 的优先级是要高于 \_\_dict\_\_ 的，这一点要切记。

> Instance  attribute  does  not  shadow  class  property \| Page 635 (Underline).

Python 解释器的属性搜索流程：obj.attr，首先从类中，也就是通过obj.\_\_class\_\_ 寻找 property，如果类中没有的 property 的话才会去对象当中寻找此属性。

> The main point of this section is that an expression like obj.attr does not search for attr starting with obj. The search actually starts at obj.\_\_class\_\_, and only if there is no property named attr in the class, Python looks in the obj instance itself \| Page 636 (Underline).

### Handling Attribute Deletion

property 的 deleter 装饰器，可以用来删除一个 property。

> @member.deleter \| Page 641 (Underline).

### Essential Attributes and Functions for Attribute Handling

#### Special Attributes that Affect Attribute Handling

一个对象的 \_\_class\_\_ 属性记载了它的类型，与 type(obj) 的作用是一样的。

> \_\_class\_\_ \| Page 642 (Underline).

记录了一个对象或者类的可写的属性。

> \_\_dict\_\_ \| Page 642 (Underline).

#### Built-In Functions for Attribute Handling

getattr 可以从一个对象自身、类和父类当中获取属性。

> getattr \| Page 643 (Underline).

#### Special Methods for Attribute Handling

直接读和写 \_\_dict\_\_ 并不会触发特殊函数，比如 \_\_setattr\_\_, \_\_getattr\_\_ 这些函数，这是经常用的将它们进行 bypass 掉的方式。

> Reading and writing attributes directly in the instance \_\_dict\_\_ does not trigger these special methods— and that's the usual way to bypass them if needed. \| Page 643 (Underline).

obj.attr 和 getattr(obj, 'attr', 42) 都会调用 Class.\_\_getattribute\_\_(obj, 'attr')

> For  example,  both  obj.attr  and  getattr(obj, 'attr', 42) trigger Class.\_\_getattribute\_\_(obj, 'attr'). \| Page 644 (Underline).

\_\_getattribute\_\_ 和 \_\_getattr\_\_ 的区别在于后者仅仅处理当属性不存在时的情况，也就是 \_\_getattribute\_\_ raise AttributeError 的情况，但是前者是无论引用任何属性都会被调用。

> \_\_getattribute\_\_(self, name) \| Page 644 (Underline).

## Chapter 20. Attribute Descriptors

descriptor 是一个类，这个类实现了一个协议，包含 \_\_get\_\_, \_\_set\_\_, 以及 \_\_delete\_\_ 函数，property 类实现了这个完全实现了这个协议。

> A descriptor is a class that implements a protocol consisting of the \_\_get\_\_, \_\_set\_\_, and \_\_delete\_\_ methods. \| Page 651 (Underline).

### Descriptor Example: Attribute Validation

#### LineItem Take #3: A Simple Descriptor

def \_\_set\_\_(self, instance, value): 这是 set 函数的签名，需要注意的是，self 指的是描述符自身，而 instance 指的是这个描述符管理的哪一个实例，这就是 Python 为什么要为 set 提供这个方法的原因。

> When coding a \_\_set\_\_ method, you must keep in mind what the self  and  instance  arguments  mean:  self  is  the  descriptor  in‐ stance, and instance is the managed instance. Descriptors man‐ aging instance attributes should store values in the managed in‐ stances. That's why Python provides the instance argument to the descriptor methods. \| Page 656 (Underline).

在使用描述符的 \_\_set\_\_ 设置属性值时，为什么使用 instance 的 \_\_dict\_\_ 而不使用 self 的 \_\_dict\_\_ 来存储值呢？这是因为描述符实例是类的类属性，而不是对象属性，这意味着这些描述符实例在多个管理类实例之间是共享的，因此这些值也是多个实例共享的，这很明显是不合理的。

> To  understand  why  this  would  be  wrong,  think  about  the  meaning  of  the  first  two arguments to \_\_set\_\_: self and instance. Here, self is the descriptor instance, which is actually a class attribute of the managed class. You may have thousands of LineI tem instances in memory at one time, but you'll only have two instances of the descrip‐ tors: LineItem.weight and LineItem.price. So anything you store in the descriptor instances themselves is actually part of a LineItem class attribute, and therefore is shared among all LineItem instances. \| Page 656 (Underline).

#### LineItem Take #4: Automatic Storage Attribute Names

如果我们想通过 weight = Quantity() 或者 price = Quantity() 这样子进一步省去写参数名字，因为可能出错，那么我们可以通过这种实现方式，也就是在 Quantity 中设计一个 counter，每次初始化一个 Quantity 时自增一，并把这个属性（因为有 counter 的存在，所以我们可以保证每次的属性名都是唯一的）存储在要管理的对象当中，这样子就可以避免名字发生冲突。当对象需要调动时，比如 obj.weight 时，它指向的是这个 Quantity 对象，而这个 Quantity 对象中存储的与 counter 相关的 storage\_name 正好就是对应于 weight 的名称。

> weight = Quantity() \| Page 658 (Underline).

#### LineItem Take #5: A New Descriptor Type

模板方法的确是一种比较简单地设计模式。

> A template method defines an algorithm in terms of abstract operations that subclasses override to provide concrete behavior.4 \| Page 663 (Underline).

### Overriding Versus Nonoverriding Descriptors

对于属性的读和写存在着一种不对称性：当通过一个实例读取数据时，如果实例当中没有这个数据，那么会从类当中来查找；当对一个实例的属性进行赋值时，如果不存在，就会在实例当中创建一个属性，而不影响类的属性。

> Recall  that  there  is  an  important  asymmetry  in  the  way  Python  handles  attributes. Reading an attribute through an instance normally returns the attribute defined in the instance, but if there is no such attribute in the instance, a class attribute will be retrieved. On the other hand, assigning to an attribute in an instance normally creates the attribute in the instance, without affecting the class at all. \| Page 666 (Underline).

#### Overriding Descriptor

一个实现了 \_\_set\_\_ 方法的描述符被称作 overriding descriptor，因为尽管这是一个类的属性，但是当试图对实例属性进行赋值时，其仍然能够对其进行拦截。property 就是 overriding descriptor，当不实现一个 setter 函数时，会执行 property 自身的 setter 函数，这个函数会抛出异常，因此任何试图对属性进行赋值都不会被允许。

> A descriptor that implements the \_\_set\_\_ method is called an overriding descriptor, because although it is a class attribute, a descriptor implementing \_\_set\_\_ will override attempts to assign to instance attributes. \| Page 668 (Underline).

#### Overriding Descriptor Without \_\_get\_\_

通常来说，overriding descriptor 是 \_\_get\_\_ 和 \_\_set\_\_ 都要实现的，但是也可以仅仅实现 \_\_set\_\_，但是感觉这种情况不算通用。这种情况 get 到的仍然是 property 对象，但是当有重名的属性值写在 \_\_dict\_\_ 当中时，优先读取的是 \_\_dict\_\_ 中的值。

> Usually, overriding descriptors implement both \_\_set\_\_ and \_\_get\_\_, but it's also pos‐ sible to implement only \_\_set\_\_, as we saw in Example 20-1. \| Page 669 (Underline).

#### Nonoverriding Descriptor

对于 nonoverriding descriptor，其没有实现 \_\_set\_\_。当对实例的属性进行 set 时，如果是和这个描述符重名，那么会覆盖掉这个描述符。这也就意味着后面的 get 都会直接返回描述符设置在实例 \_\_dict\_\_ 当中的值，而不通过描述符。

> If a descriptor does not implement \_\_set\_\_, then it's a nonoverriding descriptor. Setting an instance attribute with the same name will shadow the descriptor, rendering it inef‐ fective for handling that attribute in that specific instance. \| Page 670 (Underline).

Overriding descriptors 也叫 data
descriptors 或者 enforced descriptors. Nonoverriding descriptors 被称为 nondata descriptors 或者 shadowable descriptors.

> Overriding  descriptors  are  also  called  data descriptors or enforced descriptors. Nonoverriding descriptors are also known as nondata descriptors or shadowable descriptors. \| Page 671 (Underline).

对于类属性的设置（注意不是实例），描述符无法控制。这意味着当对类直接进行设置时，描述符可能被覆盖。

> The setting of attributes in the class cannot be controlled by descriptors attached to the same class. \| Page 671 (Underline).

#### Overwriting a Descriptor in the Class

描述符在类一级的表现仍然具有这种非对称性（注意是类一级，也就是通过类名来 get 或者 set）：如果是读取类属性，那么会被描述符的 \_\_get\_\_ 处理；如果是设置类属性，那么描述符的 \_\_set\_\_ 则不会处理。我认为这种设计方式符合直觉。

> Example 20-12 reveals another asymmetry regarding reading and writing attributes: although the reading of a class attribute can be controlled by a descriptor with \_\_get\_\_ attached to the managed class, the writing of a class attribute cannot be handled by a descriptor with \_\_set\_\_ attached to the same class. \| Page 671 (Underline).

### Methods Are Descriptors

用户定义的类中定义的函数都有一个 \_\_get\_\_ 方法，因此他们也是描述符。

> A function within a class becomes a bound method because all user-defined functions have a \_\_get\_\_ method, therefore they operate as descriptors when attached to a class. \| Page 672 (Underline).

如果是直接通过类来获取的属性，那么函数的 \_\_get\_\_ 方法通常返回一个对于它自身的引用；如果是通过实例来获取属性，那么这个函数的 \_\_get\_\_ 函数返回的是一个 bound method object，是一个可调用对象，但是这个对象的第一个参数绑定成了实例，也就是 self，这与 functools.partial 函数类似。

> As usual with descriptors, the \_\_get\_\_ of a function returns a reference to itself when the access happens through the managed class. But when the access goes through an instance, the \_\_get\_\_ of the function returns a bound method object: a callable that wraps the function and binds the managed instance (e.g., obj) to the first argument of the function (i.e., self), like the functools.partial function does (as seen in "Freezing Arguments with functools.partial" on page 159). \| Page 672 (Underline).

### Descriptor Usage Tips

如前所述，一个 property 就是一个 overriding descriptor，有一个默认实现的 \_\_set\_\_ 函数，如果这个函数没有被实现，那么 property 的这个默认实现函数会直接抛出异常，这也就是为什么直接通过 property 装饰器修饰的只是可读的。

> The  default \_\_set\_\_ of a property raises AttributeError: can't set attribute, so a prop‐ erty is the easiest way to create a read-only attribute, avoiding the issue described next. \| Page 674 (Underline).

如果想要通过描述符实现一个只读的属性，那么是不是就不用实现 \_\_set\_\_ 了？不是的。因为 property 实现了 \_\_set\_\_，即使是默认实现，也能够防止当属性被设置时这个描述符被覆盖掉，所以 \_\_set\_\_ 还是需要被实现的，可以提供一个默认的实现，就像 property 当中做的那样，直接抛出一个 AttributeError 异常。

> If you use a descriptor class to implement a read-only attribute, you must remember to code both \_\_get\_\_ and \_\_set\_\_, otherwise setting a namesake attribute on an instance will shadow the descriptor. The \_\_set\_\_ method of a read-only attribute should just raise AttributeError with a suitable message. \| Page 674 (Underline).

如果仅仅需要进行验证的话，那么只实现 \_\_set\_\_ 就好。

> Validation descriptors can work with \_\_set\_\_ only \| Page 674 (Underline).

nonoverriding descriptor 可以用来当做缓存，适用于计算量大但是不经常变化的属性。第一次获取通过 \_\_get\_\_ 计算，然后存在 \_\_dict\_\_ 里，这样子后面每次获取都可以直接通过 \_\_dict\_\_ 来取出来，而不再需要计算。

> Caching can be done efficiently with \_\_get\_\_ only \| Page 675 (Underline).

特殊函数是直接通过类来调用的，比如 repr(x) 其实是通过 x.\_\_class\_\_.\_\_repr\_\_(x) 来调用的，所以如果实例中有一个属性 \_\_repr\_\_ 覆盖了原始的函数，那么这个特殊函数并不会受到干扰。

> repr(x) is executed as x.\_\_class\_\_.\_\_repr\_\_(x), so a \_\_repr\_\_ attribute defined in x has no effect on repr(x). \| Page 675 (Underline).

## Chapter 21. Class Metaprogramming

类的元编程就是可以在运行时动态创建和修改类。

> Class metaprogramming is the art of creating or customizing classes at runtime. \| Page 681 (Underline).

### A Class Factory

collections.namedtuple 就是一个类生产工厂。

> collections.namedtuple \| Page 682 (Underline).

type() 使用起来像一个函数，但是其实它是一个类，是一个可以创建其他类的类。

> We usually think of type as a function, because we use it like one, e.g., type(my\_ob ject) to get the class of the object—same as my\_object.\_\_class\_\_. However, type is a class. \| Page 684 (Underline).

### A Class Decorator for Customizing Descriptors

类装饰器与函数装饰器很类似，它输入一个类，同时返回一个类。

> A class decorator is very similar to a function decorator: it's a function that gets a class object and returns the same class or a modified one \| Page 686 (Underline).

### What Happens When: Import Time Versus Runtime

Python 当中存在两个时间：导入时 import time 以及运行时 runtime。在导入时，Python 会从头到尾地检查 .py 文件，并生成 bytecode。也就是 \_\_pycache\_\_ 中的 .pyc 文件。

> At import time, the interpreter parses the source code of a .py module in one pass from top to bottom, and generates the bytecode to be executed. That's when syntax errors may occur. \| Page 687 (Underline).

import 语句并不仅仅是一个声明，当第一次 import 时，它还是会执行所引入模块的最上层的代码的。

> In particular, the import statement is not merely a declaration3 but it actually runs all the top-level code of the imported module when it's imported for the first time in the process \| Page 687 (Underline).

解释器通常是在 import time 定义最外层函数，但是在 runtime 执行它们。

> In the usual case, this means that the interpreter defines top-level functions at import time, but executes their bodies only when—and if—the functions are invoked at runtime. \| Page 688 (Underline).

对于类来说，在导入时，解释器会执行类的代码体，即使这个类是 nest 的，也就是同时定义在其他类中。

> For classes, the story is different: at import time, the interpreter executes the body of every class, even the body of classes nested in other classes. \| Page 688 (Underline).

#### The Evaluation Time Exercises

类装饰器并不会影响子类的行为，但是如果子类通过 \_\_super\_\_ 调用了父类的方法，而父类的方法被 decorator 修改了，那么执行的是修改之后的函数。

> The main point of scenario #2 is to show that the effects of a class decorator may not affect subclasses. \| Page 692 (Underline).

### Metaclasses 101

metaclass 是一个类工厂，它本身就是一个类，同时它也可以生成其他的类。

> A metaclass is a class factory, except that instead of a function, like record\_factory from Example 21-2, a metaclass is written as a class. \| Page 692 (Underline).

默认来说，所有类都是 type 类的对象，另外一句话来说，type 就是大多数内建类的 metaclass。

> By default, Python classes are instances of type. In other words, type is the metaclass for most built-in and user-defined classes \| Page 693 (Underline).

为了防止无限套娃，type 是自己的实例。

> To avoid infinite regress, type is an instance of itself, as the last line shows \| Page 693 (Underline).

object 是 type 的实例，但是 type 却是 object 的子类，这就是 Python。

> The classes object and type have a unique relationship: object is  an  instance  of  type,  and  type  is  a  subclass  of  object. \| Page 694 (Underline).

除了 type，还有一些其他的元类，比如 ABCMeta 以及 Enum。

> Besides type, a few other metaclasses exist in the standard library, such as ABCMeta and Enum. \| Page 694 (Underline).

每一个类都隐性或者显性地是 type 的实例，但是仅仅 metaclass 能够是 type 的子类。

> Every class is an instance of type, directly or indirectly, but only metaclasses are also subclasses of type. \| Page 694 (Underline).

#### The Metaclass Evaluation Time Exercise

即使一个类并没有直接指定 metaclass，而是直接继承了一个指定了 metaclass 的类，在创建时其仍然会通过这个 metaclass 相关的流程进行创建。

> Note  that  ClassSix  makes  no  direct  reference  to  MetaAleph,  but  it  is  affected  by  it because it's a subclass of ClassFive and therefore it is also an instance of MetaAleph, so it's initialized by MetaAleph.\_\_init\_\_. \| Page 699 (Underline).

### The Metaclass \_\_prepare\_\_ Special Method

\_\_prepare\_\_ 只能够在元类当中使用，同时他必须是 @classmethod。\_\_prepare\_\_ 的作用是当创建一个类前，返回一个可以包含这个类属性的容器，比如一个 OrderedDict()。

> The solution to this problem is the \_\_prepare\_\_ special method, introduced in Python 3. This special method is relevant only in metaclasses, and it must be a class method \| Page 701 (Underline).

### Classes as Objects

与实例一样，类也有很多的属性，比如 \_\_mro\_\_, \_\_class\_\_ 以及 \_\_name\_\_ 等等。

> Every class has a number of attributes defined in the Python data model \| Page 703 (Underline).

# Afterword

## Python Jargon

在 Python 当中，argument 和 parameter 几乎是同义词。

> An expression passed to a function when it is  called.  In  Pythonic  parlance,  argument and  parameter  are  almost  always  syno‐ nyms.  See  parameter  for  more  about  the distinction and usage of these terms. \| Page 741 (Underline).

bound method，就是绑定了对象的方法，方法不能再改变。

> A method that is accessed through an in‐ stance becomes bound to that instance. \| Page 742 (Underline).

\_\_len\_\_ 也被称为 dunder len。

> Shortcut to pronounce the names of special methods and attributes that are written with leading  and  trailing  double-underscores (i.e., \_\_len\_\_ is read as "dunder len"). \| Page 744 (Underline).

monkey patching 就是运行时更改模块、类或者函数。

> Dynamically changing a module, class, or function at runtime, usually to add features or fix bugs. \| Page 747 (Underline).

parameter 是形参，argument 是实参。

> When the function is called, the arguments  or  "actual  parameters"  passed are bound to those variables. \| Page 747 (Underline).

自动把私有属性 \_\_x 转化成为 \_MyClass\_\_x 被称为 name mangling。

> The  automatic  renaming  of  private  at‐ tributes  from  \_\_x  to  \_MyClass\_\_x,  per‐ formed  by  the  Python  interpreter  at  run‐ time. \| Page 747 (Underline).

一个实例的方法，直接通过类来调用，因此并没有绑定任何实例（self），这个方法就被称为 unbound method。

> An instance method accessed directly on a class is not bound to an instance; \| Page 749 (Underline).

