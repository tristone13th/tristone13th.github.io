---
categories: Miscellaneous
title: The magic behind configure, make, make install
---

这篇文章是对于文章[The magic behind configure, make, make install](https://thoughtbot.com/blog/the-magic-behind-configure-make-make-install)的一个转载与补充，如有兴趣可以访问原文查看。

This article is a reproduced and supplement article for [The magic behind configure, make, make install](https://thoughtbot.com/blog/the-magic-behind-configure-make-make-install), if you are interested in it you can visit the original website for more information.

如果您已使用 Unix 的任何版本进行开发，则您可能已经安装了很多软件，并执行过以下这种神奇的代码：

```bash
./configure
make
make install
```

我知道我已经输入了很多次这样的代码，但在我早期使用Linux，我真的不明白它的意思，我只知道，如果我想安装软件，那我就需要把这些代码香咒语一样背诵出来。

最近，我一直在构建自己的 Unix 工具，我想利用这个标准安装过程；它不仅为许多 Unix 用户所熟悉，也是为 Homebrew 和各种 Linux 和 BSD 软件包管理器构建软件包的一个很好的起点。是时候深入Unix，找出这个代码的真正作用。

# 这一切是怎么工作的？

这个过程有三个不同的步骤：

## 配置软件（configure）

这个脚本用来为**在特定的机器上构建软件做准备**。它首先能够保证build和install过程的所有的依赖都能满足。并且如果要使用这些依赖需要了解什么。

Unix程序通常使用C语言来写成，这个步骤能够保证我们的系统中有C编译器，并且它能够知道它怎么被调用以及在哪里找到它。

## 构建软件（build）

一旦工作完成，我们就可以构建这个软件了。它执行Makefile中定义的任务来从源代码中构建程序。

下载的压缩包通常是不包含Makefile文件的。但是它有一个模板文件Makefile.in，在配置（configure）阶段，通常配置代码会创建一个平台相关的Makefile文件。

## 安装软件（Install）

既然软件已经被构建了，并且已经准备好运行了，那么文件就可以被**拷贝到最终的目的地**了。`make install`命令将拷贝已经构建的程序、库以及说明文档到**正确的目录**。

这意味着程序的二进制文件将会被拷贝到`PATH`中的目录，程序的手册文件将会被拷贝到`MANPATH`目录，并且它依赖的任何其他文件将被存储在正确的位置。

因为`install`步骤也被定义在`Makefile`当中，所以软件安装的位置可以根据传递给configure脚本的选项或configure脚本发现的关于系统的内容进行更改。

根据软件安装的位置，您可能需要升级此步骤的权限，以便将文件复制到系统目录。使用`sudo`通常会达到这个效果。

# 这些脚本来自哪里？

所有这些都可以工作，**因为configure脚本检查您的系统，并使用它找到的信息把Makefile.in文件转化成为Makefile文件**。但是configure脚本和Makefile.in模板来自哪里呢?

如果您曾经打开过configure脚本或关联的Makefile.in。在这里，您将看到数千行密集的shell脚本。有时这些脚本比它们安装的程序的源代码还要长。

即使从现有的configure脚本开始，手动构造一个脚本也是非常困难的。但是不要担心：这些脚本不是手工构建的。

以这种方式构建的程序通常使用一套程序进行打包，这些程序统称为自动工具。这个套件包括autoconf、automake和许多其他程序，所有这些程序一起工作可以大大简化软件维护者的工作。最终用户看不到这些工具，但它们消除了设置在许多不同风格的Unix上一致运行的安装过程的痛苦。

# 一个Hello World示例

让我们使用一个简单的Hello World程序作为示例。

这是一个程序的源代码，在一个叫做`main.c`的文件当中：

```c
#include <stdio.h>

int
main(int argc, char* argv[])
{
    printf("Hello world\n");
    return 0;
}
```

## 创建configure脚本

configure脚本不是手工编写的，我们需要去创建一个`configure.ac`文件来描述configure脚本应该做什么。这个文件是用 m4sh 编写的，这是一个m4的宏和 POSIX shell 的结合。

我们需要调用的第一个m4宏是AC_INIT，它将初始化autoconf并设置一些关于我们打包的程序的基本信息。这个程序叫做helloworld，版本是0.1，维护者是george@thoughtbot.com:

```
AC_INIT([helloworld], [0.1], [george@thoughtbot.com])
```

我们将在这个项目中使用automake，所以我们需要用AM_INIT_AUTOMAKE宏来初始化它：

```
AM_INIT_AUTOMAKE
```

接下来，我们需要告诉autoconf配置脚本需要寻找的依赖项。在这种情况下，configure脚本只需要查找C编译器。我们可以使用AC_PROG_CC宏来设置：

```
AC_PROG_CC
```

如果有其他依赖项，那么我们将使用其他m4宏来发现它们;例如，AC_PATH_PROG宏在用户路径上查找给定的程序。

现在我们已经列出了依赖项，可以使用它们了。我们在前面看到，典型的配置脚本将使用它拥有的关于用户系统的信息从Makefile.in模板构建Makefile。

下一行使用AC_CONFIG_FILES宏告诉autoconf配置脚本应该这样做：它应该找到一个名为Makefile的文件。在这种情况下，将@PACKAGE_VERSION@这样的占位符替换为0.1这样的值，并将结果写入Makefile。

```
AC_CONFIG_FILES([Makefile])
```

最后，已经告诉autoconf我们的配置脚本需要做的一切，我们可以调用AC_OUTPUT宏输出脚本：

```
AC_OUTPUT
```

事情是这样的。与将要生成的4,737行配置脚本相比，这还不错！

```
AC_INIT([helloworld], [0.1], [george@thoughtbot.com])
AM_INIT_AUTOMAKE
AC_PROG_CC
AC_CONFIG_FILES([Makefile])
AC_OUTPUT
```

我们几乎已经准备好打包并分发我们的程序了，但我们仍然缺少一些东西。我们的配置脚本需要一个Makefile。在文件中，它可以替换所有那些系统特定的变量，但到目前为止，我们还没有创建那个文件。

## 创建Makefile

与configure脚本一样，Makefile.in模板很长很复杂。所以我们不用手写它，而是写一个更短的Makefile.am文件，automake将使用它来生成Makefile.in。

首先，我们需要设置一些选项来告诉automake项目的结构。由于我们没有遵循GNU项目的标准结构，我们警告automake这是一个其他项目：

```
AUTOMAKE_OPTIONS = foreign
```

接下来，我们告诉automake，我们希望Makefile构建一个名为helloworld的程序：

```
bin_PROGRAMS = helloworld
```

由于automake的统一命名方案，这一行包含了大量信息。

后缀`PROGRAMS`被称为*primary*。它告诉automake `helloworld`文件有什么属性。例如，PROGRAMS需要build，而 `SCRIPTS`和`DATA`文件不需要build。

`bin`前缀告诉automake，这里列出的文件应该安装到变量bindir定义的目录中。autotools为我们定义了各种目录——包括bindir、libdir和pkglibdir——但我们也可以定义自己的目录。

如果我们想要安装一些Ruby脚本作为我们程序的一部分，我们可以定义一个rubydir变量，并告诉automake在那里安装我们的Ruby文件：

```
rubydir = $(datadir)/ruby
ruby_DATA = my_script.rb my_other_script.rb
```

可以在安装目录之前添加额外的前缀来进一步区分automake的行为。

因为我们已经定义了一个程序，我们需要告诉automake在哪里找到它的源文件。在这种情况下，前缀是这些源文件构建的程序的名称，而不是它们将安装的位置：

```
helloworld_SOURCES = main.c
```

这是整个我们的helloworld程序的Makefile.am文件。与configure.ac和configure脚本一样，它比它所产生的Makefile.in短得多：

```
AUTOMAKE_OPTIONS = foreign
bin_PROGRAMS = helloworld
helloworld_SOURCES = main.c
```

## 整合

现在我们已经写好了配置文件，我们可以运行autotools并生成configure脚本和Makefile.in模板。

首先，我们需要为autotools生成一个m4环境来使用:

```
aclocal
```

现在我们可以运行autoconf来将configure.ac转换为configure脚本，并使用automake来将Makefile.am转化为Makefile.in模板。

```
autoconf
automake --add-missing
```

## 分发软件

终端用户不需要看到autotools的设置，所以我们可以分发configure脚本和Makefile.in，**它们是怎么生成的无需用户关注**。

幸运的是，自动工具也可以帮助我们进行分发。Makefile包含了各种有趣的目标，包括构建一个包含我们需要分发的所有文件的项目压缩包：

```
./configure
make dist
```

您甚至可以测试，分发tarball可以安装在各种条件下：

```
make distcheck
```

## 总览

现在我们知道这个咒语是从哪里来的，它是怎么起作用的了！

在维护系统：

```
aclocal # Set up an m4 environment
autoconf # Generate configure from configure.ac
automake --add-missing # Generate Makefile.in from Makefile.am
./configure # Generate Makefile from Makefile.in
make distcheck # Use Makefile to build and test a tarball to distribute
```

在用户系统：

```
./configure # Generate Makefile from Makefile.in using configure
make # Use Makefile to build the program
make install # Use Makefile to install the program
```

我们可以画一个图来表示整个过程：

![](../../img/202006161.png)





