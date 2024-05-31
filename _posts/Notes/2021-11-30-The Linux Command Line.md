---
categories: Notes
title: Reading Notes for The Linux Command Line
---

# Introduction

## Why Use the Command Line?

GUI 能够让简单的工作简单，而 CLI 能够让难的工作可能。

> graphical user interfaces make easy tasks easy, while command line interfaces make difficult tasks possible \| Page 19 (Underline).

## Who Should Read This Book

这里补充一下单片机（MCU, SoC）以及树莓派的区别：树莓派指的是一款开源硬件的成品开发板，上面也有 CPU、内存，但是它们都是以分立的芯片的形式存在，而且 CPU 性能远超单片机，可以运行 Linux 操作系统。单片机是一类芯片的总称，在一块芯片上集成了 CPU，内存，Flash（类比电脑的硬盘，早期单片机是 ROM）以及 IO 之类的外设，它不能运行 Linux 或者 Windows 这样的分时操作系统。

> single board computers (SBC) such as the Raspberry Pi \| Page 19 (Underline).

# Part 1 – Learning the Shell

## 1 – What Is the Shell?

### Making Your First Keystrokes

#### Cursor Movement

shell 里的 c-c c-v 要比 Windows 的历史还要长。

> These control codes have different meanings   to   the   shell   and   were   assigned   many   years   before   the   release   of Microsoft Windows. \| Page 28 (Underline).

### Try Some Simple Commands

df 是用来看硬盘的。

> To see the current amount of free space on our disk drives, enter df \| Page 28 (Underline).

free 是用来看内存的。

> Likewise, to display the amount of free memory, enter the free command. \| Page 29 (Underline).

## 2 – Navigation

### Understanding the File System Tree

与 Windows 不同，Linux 仅仅有一个单一的文件系统树，不论有多少个硬盘设备，而 Windows 其实每一个硬盘设备都有文件系统树。

> Note that unlike Windows, which has a separate file system tree for each storage device, Unix-like systems such as Linux always have a single file system tree, regardless of how many drives or storage devices are attached to the computer. \| Page 31 (Underline).

### The Current Working Directory

一个普通用户只有在自己的 home 目录下才能够写文件。

> Each user account is given its own home directory and it is the only place a regular user is allowed to write files. \| Page 32 (Underline).

### Changing the Current Working Directory

#### Relative Pathnames

一个点表示的是当前的工作目录。

> The "." notation refers to the working directory \| Page 33 (Underline).

注意，标准的路径名最后是没有 / 的。

> cd /usr/bin \| Page 34 (Underline).

大多数情况下，./ 这个可以省略。

> Now, there is something important to point out here. In almost all cases, we can omit the "./". It is implied. \| Page 35 (Underline).

#### Some Helpful Shortcuts

cd 命令的一些快捷方式：
   - 进入到 home：cd
   - 进入到上一个工作目录：cd -
   

> cd Shortcuts \| Page 35 (Underline).

前面是一个点的文件也是隐藏文件。

> Filenames that begin with a period character are hidden. This only means that ls will not list them unless you say ls -a. When your account was created, several  hidden files  were placed in your home directory to configure things for your account. \| Page 35 (Underline).

Linux 当中的文件大小写是敏感的。

> Filenames and commands in Linux, like Unix, are  case sensitive. The file names "File1" and "file1" refer to different files. \| Page 36 (Underline).

文件名当中不要用空格。

> Most importantly, do not  embed spaces in filenames. If you want to represent spaces between words in a filename, use underscore characters. You will thank yourself later. \| Page 36 (Underline).

## 3 – Exploring the System

### Having More Fun with ls

#### Options and Arguments

一行命令通常包含三部分：命令、选项，参数。命令就是命令名、选项就是 - 后面跟的字符串，参数就是值。

> command -options arguments \| Page 38 (Underline).

#### A Longer Look at Long Format

这个第一个字符是 - 表示这是一个普通文件，如果是 d 就表示这是一个目录。

> -rw-r--r \| Page 40 (Underline).

### Determining a File's Type with file

可以使用 file 命令来查看一个文件的类型。

> [me@linuxbox ~]\$ file picture.jpg picture.jpg: JPEG image data, JFIF standard 1.01 \| Page 41 (Underline).

### Viewing File Contents with less

请注意这个单词的发音。

> ASCII (pronounced "As-Key") \| Page 42 (Underline).

使用 less 来检查文本内容很方便，可以直接按 q 来退出，其他浏览操作其实和 vim 类似。less 主要用于浏览大文件，加载文件时不会读取整个文件，相比于 vim 或 nano 等文本编辑器，启动会更快。

> less filename \| Page 42 (Underline).

### Taking a Guided Tour

Linux 的文件系统的设计是符合这个标准的。

> The design is actually specified in a published standard called the Linux Filesystem Hierarchy Standard. \| Page 43 (Underline).

Linux 当中的一些目录。

> Directories Found on Linux Systems \| Page 44 (Underline).

/bin 当中包含的是一些系统在启动时就需要运行的程序。

> Contains binaries (programs) that must be present for the system to boot and run. \| Page 44 (Underline).

Linux 内核代码是在这个目录下的。

> /boot \| Page 44 (Underline).

这里包含了所有的设备。

> /dev \| Page 45 (Underline).

这个里面存的都是可以阅读的文本，主要包含了系统级的配置信息。

> /etc \| Page 45 (Underline).

这个当中包含了共享库，与 Windows 当中的共享链接库类似。

> /lib \| Page 45 (Underline).

这个当中包含的是一些可以移除的媒体，比如 USB 以及光盘等等。

> /media \| Page 45 (Underline).

手动 mount 的点。

> /mnt \| Page 45 (Underline).

这个目录安装的是第三方的商业软件。

> /opt \| Page 46 (Underline).

root 用户的 home。

> /root \| Page 46 (Underline).

这个目录可能是 Linux 系统当中最大的目录，普通用户用到的一些程序可能是在这个目录下的。

> /usr \| Page 46 (Underline).

Linux 发行版安装的可执行文件。

> /usr/bin \| Page 46 (Underline).

这个目录其实是针对于 /usr/bin 当中程序的共享库。

> /usr/lib \| Page 46 (Underline).

暂时看不太懂，后期再搜。

> /usr/local \| Page 46 (Highlight).

符号链接也叫做软连接。

> Symbolic Links \| Page 47 (Underline).

### Symbolic Links

软链接的第一个字母是 l，可能表示 link？

> lrwxrwxrwx \| Page 47 (Underline).

## 4 – Manipulating Files and Directories

### cp – Copy Files and Directories

把前面的文件拷贝到后面的位置。

> cp item1 item2 \| Page 52 (Underline).

### mv – Move and Rename Files

mv 可以用来重命名。

> mv item1 item2 \| Page 54 (Underline).

### rm – Remove Files and Directories

#### Useful Options and Examples

Linux 当中并没有撤销删除操作。

> Unix-like operating systems such as Linux do not have an undelete command. Once you delete something with  rm, it's gone. Linux assumes you're smart and you know what you're doing. \| Page 57 (Underline).

如何避免删除错误？尽量在删除前使用 ls 检查要删除的文件，然后再进行删除。

> Here is a useful tip:  whenever you use wildcards  with  rm  (besides carefully checking your typing!), test the wildcard first with ls. This will let you see the files that will be deleted. Then press the up arrow key to recall the command and replace ls with rm. \| Page 57 (Underline).

### ln – Create Links

ln link 参数是在后面的。

> ln file link \| Page 57 (Underline).

#### Hard Links

硬链接不能够指向目录，因为可能会造成环。

> A hard link may not reference a directory. \| Page 58 (Underline).

#### Symbolic Links

注意软链接的这个特性，如果我们向软链接当中写入东西，那么其实会写到它指向的位置。如果删除软链接，只会删除它自己不会影响到指向的文件。

> For example, if we write something to the symbolic link, the referenced file is written to. However when we delete a symbolic link, only the link is deleted, not the file itself. \| Page 58 (Underline).

ls 会把已经破损的软链接以特殊的颜色显示出来，比如红色。

> the ls command will display broken links in a distinguishing color, such as red, to reveal their presence. \| Page 58 (Underline).

### Let's Build a Playground

#### Creating Hard Links

使用 ls -i 能够输出文件名所对应的 inode 号，具有相同号的其实就是相同的文件，只不过名字不同。

> In this version of the listing, the first field is the inode number and, as we can see, both fun  and  fun-hard  share the same inode number, which confirms they are the same file. \| Page 62 (Underline).

#### Creating Symbolic Links

软链接前是 l 字母，硬链接因为就是文件实现的本质，所以就是常规文件，没有 l。

> The listing for fun-sym in dir1 shows that it is a symbolic link by the leading l in the first field and that it points to ../fun, which is correct. \| Page 63 (Underline).

可以使用绝对路径以及相对路径来创建软链接，更加推荐使用相对路径，这样子在改变包含的文件夹位置时链接不会被破坏。软链接文件的大小其实是路径字符的多少，而不是所指向文件的大小。

> In most cases, using relative pathnames is more desirable because it allows a directory tree containing symbolic links and their referenced files to be renamed and/or moved without breaking the links. \| Page 63 (Underline).

#### Removing Files and Directories

对于软链接要记住的一点是，大部分的操作都是基于它指向的文件所执行的，除了 rm 以外。

> One thing to remember about symbolic links is that most file operations are carried out on the link's target, not the link itself. rm is an exception. When we delete a link, it is the link that is deleted, not the target. \| Page 65 (Underline).

## 5 – Working with Commands

### What Exactly Are Commands?

什么是命令？一个命令通常包含以下四种：
   - 一个可执行程序，使用任何语言写的都可以，包括 shell 自己
   - 一个 shell 自带的命令，比如 cd
   - 一个 shell 函数
   - alias

> A command can be one of four different things \| Page 66 (Underline).

### Identifying Commands

#### type – Display a Command's Type

type 可以给出将要执行的命令的类型，内置的还是一个程序还是一个 alias 等等。

> type command \| Page 67 (Underline).

#### which – Display an Executable's Location

which 命令只能用于第一种类型的命令，也就是可执行程序。

> which only works for executable programs, not builtins nor aliases that are substitutes for actual executable programs. \| Page 67 (Underline).

### Getting a Command's Documentation

#### whatis – Display One-line Manual Page Descriptions

whatis 其实就是 man 的一行版本。

> The whatis program displays the name and a one-line description of a man page matching a specified keyword \| Page 72 (Underline).

### Creating Our Own Commands with alias

可以在一行当中使用；来分割多个不同的命令。

> command1; command2; command3... \| Page 74 (Underline).

可以使用 alias 为命令起一个别名。

> alias name='string' \| Page 75 (Underline).

使用 unalias 可以去除 alias

> To remove an alias, the unalias command is used \| Page 76 (Underline).

## 6 – Redirection

### Standard Input, Output, and Error

有两个特殊文件：标准输出、标准错误。这符合 Unix 任何东西都是一个文件的设计。

> Keeping with the Unix theme of "everything is a file," programs such as ls actually send their results to a special file called standard output (often expressed as stdout) and their status messages to another file called  standard error (stderr). \| Page 78 (Underline).

### Redirecting Standard Output

使用这个符号对输出进行重定向。

> we use the > redirection operator followed by the name of the file. \| Page 79 (Underline).

这个命令列了一个不可能存在的目录，为什么报错信息没有被重定向到我们所指定的文本文件呢？原因是这个这个仅仅是输出重定向，而不是错误重定向。

> [me@linuxbox ~]\$ ls -l /bin/usr > ls-output.txt \| Page 79 (Underline).

可以用这种方式创建一个空文件。

> [me@linuxbox ~]\$ > ls-output.txt \| Page 80 (Underline).

单个大于号会对文件进行重新，而两个大于号其实就是在文件后 append。

> [me@linuxbox ~]\$ ls -l /usr/bin >> ls-output.txt \| Page 80 (Underline).

### Redirecting Standard Error

shell 当中，0、1、2 分别代表的是标准输入、标准输出以及标准错误。

> While we have referred to the first three of these file streams as standard input, output and error, the shell references them internally as file descriptors 0, 1, and 2, respectively. The shell provides a notation for redirecting files using the file descriptor number. \| Page 81 (Underline).

#### Redirecting Standard Output and Standard Error to One File

通过这种方式可以先将标准输出重定向到 ls-output.txt，然后再将标准错误重定向到标准输出，注意重定向的顺序不要搞混。

> [me@linuxbox ~]\$ ls -l /bin/usr > ls-output.txt 2>&1 \| Page 81 (Underline).

使用 &> 可以同时对标准输出以及标准错误进行重定向。

> [me@linuxbox ~]\$ ls -l /bin/usr &> ls-output.txt \| Page 82 (Underline).

#### Disposing of Unwanted Output

/dev/nul 这个文件可以用来舍弃输出，只需要把输出重定向到这个文件就可以。

> The system provides a way to do this by redirecting output to a special file called "/dev/null". \| Page 82 (Underline).

bit bucket 是一个行话，具体的意思可以参考 https://en.wikipedia.org/wiki/Bit\_bucket

> bit bucket \| Page 82 (Underline).

通过这种方式可以直接舍弃输出。

> [me@linuxbox ~]\$ ls -l /bin/usr 2> /dev/null \| Page 82 (Underline).

### Redirecting Standard Input

#### cat – Concatenate Files

cat 命令不止能够输出一个文件的值，它还可以把多个文件合并到一个文件进行输出。

> cat movie.mpeg.0* > movie.mpeg \| Page 83 (Underline).

如果 cat 没有指定参数，那么 cat 就从标准输入来进行输入，所以执行 cat 命令后什么都不会发生，而是静静地等待着输入。

> If cat is not given any arguments, it reads from standard input and since standard input is, by default, attached to the keyboard, it's waiting for us to type something! \| Page 83 (Underline).

这个表示 EOF。

> Next, type a Ctrl-d (i.e., hold down the Ctrl key and press "d") to tell cat that it has reached end of file (EOF) on standard input \| Page 84 (Underline).

这种方式可以用来创建简单的文本文件，因为我们没有指定参数，所以默认会从标准输入当中输入字符串。

> [me@linuxbox ~]\$ cat > lazy\_dog.txt The quick brown fox jumped over the lazy dog. \| Page 84 (Underline).

### Pipelines

管道就是可以把一个命令的输出重定向到一个命令的输入。

> command1 \| command2 \| Page 85 (Underline).

#### Filters

sort 命令会从标准输入读取多行数据，然后对这些行进行一个排序，最后输出到标准输出当中，因此可以用此种方式进行过滤。

> [me@linuxbox ~]\$ ls /bin /usr/bin \| sort \| less \| Page 86 (Underline).

#### uniq - Report or Omit Repeated Lines

uniq 可以用来对已经排好序的项目进行去重，所以可以搭配 sort 进行使用。

> [me@linuxbox ~]\$ ls /bin /usr/bin \| sort \| uniq \| less \| Page 86 (Underline).

#### wc – Print Line, Word, and Byte Counts

wc 可以用来输出行、单词以及字节数量。

> [me@linuxbox ~]\$ wc ls-output.txt 7902  64566 503634 ls-output.txt \| Page 87 (Underline).

#### grep – Print Lines Matching a Pattern

注意 grep 是对每一行进行检查，然后输出满足的行。

> When  grep  encounters a "pattern" in the file, it prints out the lines containing it. \| Page 87 (Underline).

head tail 命令可以打印出来文件的前几行以及最后几行。

> head / tail – Print First / Last Part of Files \| Page 88 (Underline).

#### head / tail – Print First / Last Part of Files

tail 可以用来实时地对文件进行监控，通过指定这个参数，一旦文件后加入了新的行，tail 可以实时地将它打印到屏幕上。

> Using the "-f" option,  tail  continues to monitor the file, and when new lines are appended, they immediately appear on the display. \| Page 89 (Underline).

#### tee – Read from Stdin and Output to Stdout and Files

就像这个命令的名字一样，tee 可以让管道分叉，从而允许我们将处理的中间结果保存到文件当中进行检查。

> [me@linuxbox ~]\$ ls /usr/bin \| tee ls.txt \| grep zip \| Page 90 (Underline).

### Summing Up

几乎所有的命令都使用标准错误来输出错误信息。

> There are many commands that make use of standard input and output, and almost all command line programs use standard error to display their informative messages. \| Page 90 (Underline).

## 7 – Seeing the World as the Shell Sees It

### Expansion

Expansion 指的是 bash 会自动对一些东西进行替换，所以我们的命令可能看到的是其他的内容。比如 echo * 并不会真正打印 *，因为 bash 把 * 替换成了当前目录下的文件名。

> Each time we type a command and press the Enter key, bash performs several substitutions upon the text before it carries out our command. \| Page 92 (Underline).

#### Pathname Expansion

对 wildcart 进行扩展，我们把它叫做 pathname expansion。

> The mechanism by which wildcards work is called pathname expansion. \| Page 93 (Underline).

ls -A 可以输出所有隐藏的文件。

> ls -A \| Page 94 (Underline).

#### Tilde Expansion

tilde expansion 指的是 ~ 会被自动替换成 home 目录。

> As we may recall from our introduction to the cd command, the tilde character (~) has a special meaning. \| Page 94 (Underline).

#### Arithmetic Expansion

Arithmetic expansion 是这种形式，可以用来进行计算。

> \$((expression)) \| Page 95 (Underline).

#### Brace Expansion

brace expansion 有点像正则表达式，可以用来批量地创建一些文件。

> mkdir \{2007..2009\}-\{01..12\} \| Page 97 (Underline).

#### Parameter Expansion

这种叫做 parameter expansion，可以直接打印出环境变量，比如当前用户的信息。

> echo \$USER \| Page 98 (Underline).

这个命令可以打印出所有的环境变量。

> printenv \| Page 98 (Underline).

#### Command Substitution

这种方式叫做 command substitution，也是 expansion 的一种，注意到美元符号有三种不同的用法，如果后面接了一个括号就是 command，如果没有就是 parameter，如果两个就是 arithmetic。

> echo \$(ls) \| Page 98 (Underline).

### Quoting

#### Double Quotes

加引号的好处就是能够放置一些特殊字符的干扰。

> ls -l "two words.txt" \| Page 100 (Underline).

使用到美元符号的字符串仍然会被解析，即使是在双引号中，这包括了上面提到的 parameter, expansion 以及 arithmetic 三种方式。

> echo "\$USER \$((2+2)) \$(cal)" \| Page 100 (Underline).

这个例子可以看出换行符也被看作 delimiter，详情可以参考书籍。

> [me@linuxbox ~]\$ echo \$(cal) \| Page 101 (Underline).

#### Single Quotes

双引号仅仅能够去除一部分特殊符号的含义，但是单引号能够保证纯字符串，所有的特殊符号都将被禁用。

> If we need to suppress all expansions, we use single quotes. \| Page 102 (Underline).

#### Escaping Characters

转义符，backslash 或者 escape，含义不言自明。

> echo "The balance for user \$USER is: \$5.00" \| Page 102 (Underline).

文件名也是可以以这种方式进行处理的。

> mv bad&filename good\_filename \| Page 102 (Underline).

使用转义字符来表示一些特殊信息是 C 语言首创的，即使是 shell 也是学习的 C 语言。

> The idea behind this representation using the backslash originated in the C programming language and has been adopted by many others, including the shell. \| Page 103 (Underline).

## 8 – Advanced Keyboard Tricks

### Using History

#### Searching History

Page 110 (Underline).

> [me@linuxbox ~]\$ history \| less

Page 110 (Underline).

> bash  will expand  !88  into the contents of the 88th line in the history list.

## 9 – Permissions

### Owners, Group Members, and Everybody Else

Page 115 (Underline).

> In the Unix security model, a user may own files and directories. When a user owns a file or directory, the user has control over its access. Users can, in turn, belong to a  group consisting of one or more users who are given access to files and directories by their owners. In addition to granting access to a group, an owner may also grant some set of access rights to everybody, which in Unix terms is referred to as the world.

使用 id 命令可以查看这些信息。

> When user  accounts  are created, users are assigned a number called a user ID (uid) which is then, for the sake of the humans, mapped to a username. The user is assigned a primary group ID (gid) and may belong to additional groups. \| Page 115 (Underline).

Page 116 (Underline).

> User accounts are defined in the /etc/passwd file and groups are defined in the /etc/group file. When user accounts and groups are created, these files are modified along with /etc/shadow which holds information about the user's password.

一些现代操作系统的最佳实践是，给每一个用户创建一个同名的 group，只有这一个用户，这能够让权限管理更加简单。

> While many Unix-like systems assign regular users to a common group such as "users", modern Linux practice is to create a unique, single-member group with the same name as the user. This makes certain types of permission assignment easier. \| Page 116 (Underline).

### Reading, Writing, and Executing

-rw-rw-r-- 这些东西被叫做 file attributes。

> The first 10 characters of the listing are the file attributes. \| Page 116 (Underline).

 - 表示一个普通文件。

> A regular file. \| Page 116 (Underline).

d 表示一个目录。

> A directory. \| Page 116 (Underline).

l 表示符号链接。

> A symbolic link. Notice that with symbolic links, the remaining file attributes are always "rwxrwxrwx" and are dummy values. The real file attributes are those of the file the symbolic link points to. \| Page 116 (Underline).

c 表示字符设备文件。

> A character special file. This file type refers to a device that handles data as a stream of bytes, such as a terminal or /dev/null. \| Page 117 (Underline).

b 表示块设备文件。

> A block special file. This file type refers to a device that handles data in blocks, such as a hard drive or DVD drive. \| Page 117 (Underline).

file attributes 包含 file modes，后者仅仅包含那九个字符。

> The remaining nine characters of the file attributes, called the file mode, represent the read, write, and execute permissions for the file's owner, the file's group owner, and everybody else. \| Page 117 (Underline).

如果在一个目录上的权限是 r，那么...

> Allows a directory's contents to be listed if the execute attribute is also set. \| Page 117 (Underline).

如果目录上的权限是 w，那么...

> Allows files within a directory to be created, deleted, and renamed if the execute attribute is also set. \| Page 117 (Underline).

如果目录上的权限是 x，那么...

> Allows a directory to be entered, e.g., cd directory. \| Page 117 (Underline).

lrwxrwxrwx 表示的是这个符号链接的权限，而不是这个符号链接指向文件的权限。

> A symbolic link. All symbolic links have "dummy" permissions. The real permissions are kept with the actual file pointed to by the symbolic link. \| Page 118 (Underline).

#### chmod – Change File Mode

chmod 可以用来改权限，需要注意的是只有文件所有者以及 root 有权限更改。

> To change the mode (permissions) of a file or directory, the chmod command is used. Be aware that only the file's owner or the superuser can change the mode of a file or directory. \| Page 118 (Underline).

chmod 的参数可以指定影响者，可选的值为 u, g, o, 以及 a，分别代表 user, group, other, 以及 all。

> To specify who is affected, a combination of the characters "u", "g", "o", and "a" is used as shown in Table 9-5. \| Page 120 (Underline).

chmod 命令的另一个参数表示要执行的操作，可能取值为 +-=，分别代表添加权限、删除权限以及设置权限同时删除其他权限。

> The operation may be a "+" indicating that a permission is to be added, a "-" indicating that a permission is to be taken away, or a "=" indicating that only the specified permissions are to be applied and that all others are to be removed. \| Page 121 (Underline).

chmod 的最后一个参数是权限的值，可以取 rwx。

> Permissions are specified with the "r", "w", and "x" characters. \| Page 121 (Underline).

#### umask – Set Default Permissions

一些通常的 umask 被设置为 0002 或者 0022（Ubuntu 上应该是 0022），注意，umask 表示的是被移除的位，而不是被保留的位。

> The umask command controls the default permissions given to a file when it is created. It uses octal notation to express a  mask  of bits to be removed from a file's mode attributes. Let's take a look. \| Page 122 (Underline).

文件权限用三个数字就能表示吗？naive，因为有一些特殊设置，我们可能需要 4 个数字。

> Though we usually see an octal permission mask expressed as a three-digit number, it is more technically correct to express it in four digits. Why? Because, in addition to read, write, and execute permission, there are some other, less used, permission settings. \| Page 124 (Underline).

特殊权限的第一位是 setuid 位。如果设置了，那么在执行一个文件时，会把 effective user ID 设置为文件所有者（通常是 super user）而非执行者。

> The first of these is the setuid bit (octal 4000). When applied to an executable file, it sets the effective user ID from that of the real user (the user actually running the program) to that of the program's owner. \| Page 124 (Underline).

setgid 与 setuid 类似。

> The second less-used setting is the setgid bit (octal 2000), which, like the setuid bit, changes the effective group ID from the real group ID of the real user to that of the file owner. \| Page 124 (Underline).

这个特殊位感觉没啥用。

> The third is called the  sticky bit  (octal 1000). \| Page 124 (Underline).

### Changing Identities

#### su – Run a Shell with Substitute User and Group IDs

Page 126 (Underline).

> The su command is used to start a shell as another user.

su - 或者 su -l 可以以 superuser 来开启一个 shell。

> [me@linuxbox ~]\$ su \| Page 126 (Underline).

#### sudo – Execute a Command as Another User

sudo 需要被管理员配置，允许谁执行哪些程序。

> The administrator can configure  sudo  to allow an ordinary user to execute commands as a different user (usually the superuser) in a controlled way. \| Page 127 (Underline).

sudo 要求的是自己的密码，而不是 root 的密码。

> Another important difference is that the use of sudo does not require access to the superuser's password. To authenticating using sudo, requires the user's own password. \| Page 127 (Underline).

sudo 与 su 不同的地方在于其不会开启一个新的 shell。

> One important difference between su and sudo is that sudo does not start a new shell, nor does it load another user's environment. \| Page 127 (Underline).

默认情况 Ubuntu 不允许以 root 登录。

> By   default, Ubuntu disables logins to the root account \| Page 128 (Underline).

#### chown – Change File Owner and Group

chown 需要 root 权限。

> The chown command is used to change the owner and group owner of a file or directory. Superuser privileges are required to use this command. \| Page 128 (Underline).

sudo 输入密码一次后后面一段时间就不会输入了，这是因为它会选择在几分钟内相信我们，过时后就不行了。

> Notice that after the first use of sudo, janet was not prompted for her password. \| Page 129 (Underline).

#### chgrp – Change Group Ownership

知道有 chgrp 这么个东西就行。

> In older versions of Unix, the chown command only changed file ownership, not group ownership. \| Page 130 (Underline).

这是一个关于共享文件夹的小例子，还挺有趣的，有时间了可以仔细看看。

> Exercising Our Privileges \| Page 130 (Underline).

## 10 – Processes

### How a Process Works

Page 135 (Underline).

> with init always getting PID 1.

Page 135 (Underline).

> Like files, processes also have owners and user IDs, effective user IDs, etc.

### Viewing Processes

只执行 ps 会输出当前 TTY 的进程，而 ps x 会输出所有 tty 的进程。

> [me@linuxbox ~]\$ ps x \| Page 135 (Underline).

这个表格当中有进程的状态，一共有七个。

> Table 10-1: Process States \| Page 136 (Underline).

R 状态。

> Running. This means that the process is running or ready to run. \| Page 136 (Underline).

S 状态。

> Sleeping. The process is not running; rather, it is waiting for an event, such as a keystroke or network packet. \| Page 136 (Underline).

D 状态。

> Uninterruptible sleep. The process is waiting for I/O such as a disk drive. \| Page 136 (Underline).

T 状态。

> Stopped. The process has been instructed to stop. \| Page 136 (Underline).

Z 状态。

> A defunct or "zombie" process. This is a child process that has terminated but has not been cleaned up by its parent. \| Page 136 (Underline).

< 状态。

> A high-priority process. It's possible to grant more importance to a process, giving it more time on the CPU. This property of a process is called niceness. A process with high priority is said to be less nice because it's taking more of the CPU's time, which leaves less for everybody else. \| Page 136 (Underline).

N 状态。

> A low-priority process. A process with low priority (a "nice" process) will get processor time only after other processes with higher priority have been serviced. \| Page 136 (Underline).

BSD 风格就是选项前不用加 dash，比如 ps aux。

> Using the options without the leading dash invokes the command with "BSD style" behavior. \| Page 137 (Underline).

#### Viewing Processes Dynamically with top

ps 仅仅是 snapshot，top 是动态的。

> To see a more dynamic view of the machine's activity, we use the top command \| Page 137 (Underline).

### Controlling Processes

#### Putting a Process in the Background

Page 141 (Underline).

> To launch a program so that it is immediately placed in the background, we follow the command with an ampersand (&) character.

使用 jobs 命令就能看到。

> The shell's job control facility also gives us a way to list the jobs that have been launched from our terminal. \| Page 141 (Underline).

#### Returning a Process to the Foreground

这个命令可以把后台命令切换到前台，注意这个号是 job 号。

> [me@linuxbox ~]\$ fg %1 \| Page 142 (Underline).

#### Stopping (Pausing) a Process

Page 142 (Underline).

> To stop a foreground process and place it in the background, press Ctrl-z.

通过 C-z 切换到后台的程序不会自动执行，通过这种方式能够让其在后台执行。

> [me@linuxbox ~]\$ bg %1 \| Page 142 (Underline).

### Signals

kill 命令也可以使用 job ID。

> We could have also specified the process using a jobspec (for example, %1) instead of a PID. \| Page 143 (Underline).

#### Sending Signals to Processes with kill

kill 不止能发送中止的命令。

> kill [-signal] PID... \| Page 144 (Underline).

HUP 信号的常见使用方式。

> This signal is also used by many daemon programs to cause a reinitialization. This means that when a daemon is sent this signal, it will restart and reread its configuration file. The Apache web server is an example of a daemon that uses the HUP signal in this way. \| Page 144 (Underline).

INT 信号

> Interrupt. This performs the same function as a Ctrl-c sent from the terminal. It will usually terminate a program. \| Page 144 (Underline).

KILL 信号不由进程接受，而是发送给内核

> Rather, the kernel immediately terminates the process. When a process is terminated in this manner, it is given no opportunity to "clean up" after itself or save its work. For this reason, the KILL signal should be used only as a last resort when other termination signals fail. \| Page 145 (Underline).

kill 命令默认发送 TERM。

> Terminate. This is the default signal sent by the kill command. If a program is still "alive" enough to receive signals, it will terminate. \| Page 145 (Underline).

Page 146 (Underline).

> Processes, like files, have owners, and you must be the owner of a process (or the superuser) to send it signals with kill.

段错误 SEGV

> Segmentation violation. This signal is sent if a program makes illegal use of memory, that is, if it tried to write somewhere it was not allowed to write. \| Page 146 (Underline).

### More Process-Related Commands

这个表当中列出了一些进程相关的命令，可以看看。

> Table 10-6: Other Process Related Commands \| Page 148 (Underline).

pstree 命令。

> Outputs a process list arranged in a tree-like pattern showing the parent-child relationships between processes. \| Page 148 (Underline).

vmstat 命令。

> Outputs a snapshot of system resource usage including, memory, swap, and disk I/O. To see a continuous display, follow the command with a time delay (in seconds) for updates. Here's an example: vmstat 5. Terminate the output with Ctrl-c. \| Page 148 (Underline).

xload 命令。

> A graphical program that draws a graph showing system load over time. \| Page 148 (Underline).

tload 命令。

> Similar to the xload program but draws the graph in the terminal. Terminate the output with Ctrl-c. \| Page 148 (Underline).

# Part 2 – Configuration and the Environment

## 11 – The Environment

### What is Stored in the Environment?

Page 152 (Underline).

> The shell stores two basic types of data in the environment; though, with  bash,  the types are largely indistinguishable. They are  environment variables  and  shell  variables. Shell variables are bits of data placed there by bash, and environment variables are everything else.

#### Examining The Environment

Page 152 (Underline).

> The set command will show both the shell and environment variables, while  printenv  will only display the latter.

Page 154 (Underline).

> It is also possible to view the contents of a variable using the echo command

Page 154 (Underline).

> One element of the environment that neither set nor printenv displays is aliases. To see them, enter the alias command without arguments.

### How Is The Environment Established?

这是 login shell，non-login shell 通常是我们通过 GUI 打开的 terminal。

> A login shell session A login shell session is one in which we are prompted for our username and password. This happens when we start a virtual console session, for example. \| Page 155 (Underline).

login shell 在启动时会读取的配置文件表格。

> Table 11-2: Startup Files for Login Shell Sessions \| Page 156 (Underline).

Non-login shell 在启动时会读取的配置文件表格。

> Table 11-3: Startup Files for Non-Login Shell Sessions \| Page 156 (Underline).

Page 156 (Underline).

> In addition to reading the startup files in Table 11-3, non-login shells inherit the environment from their parent process, usually a login shell.

#### What's in a Startup File?

Page 158 (Underline).

> The  export command tells the shell to make the contents of  PATH  available to child processes of this shell.

### Modifying the Environment

#### Which Files Should We Modify?

Page 159 (Underline).

> As a general rule, to add directories to your PATH or define additional environment variables, place those changes in  .bash\_profile  (or the equivalent, according to your distribution;   for   example,   Ubuntu   uses  .profile).   For   everything   else,   place   the changes in .bashrc.

Page 159 (Underline).

> Note: Unless you are the system administrator and need to change the defaults for all users of the system, restrict your modifications to the files in your home directory.

#### Using a Text Editor

Page 160 (Underline).

> The extensions ".bak", ".sav", ".old", and ".orig" are all popular ways of indicating a backup file.

## 13 – Customizing the Prompt

### Anatomy of a Prompt

The prompt style is defined by an environment variable named PS1 (short for "prompt string 1"). We can view the contents of PS1 with the echo command.

> [me@linuxbox ~]\$ \| Page 186 (Underline).

Page 186 (Underline).

> [me@linuxbox ~]\$ echo \$PS1 [\u@\h \W]\$

shell 当中用到的转义字符表格。

> Table 13-1: Escape Codes Used in Shell Prompts \| Page 187 (Underline).

### Trying Some Alternative Prompt Designs

定义变量原来用这种方式。

> [me@linuxbox ~]\$ ps1\_old="\$PS1" \| Page 188 (Underline).

### Adding Color

这里讲的是如何更改命令行的颜色。

> Let's try to make a red prompt. \| Page 190 (Underline).

# Part 3 – Common Tasks and Essential Tools

## 14 – Package Management

### Packaging Systems

为什么一个发行版上的软件包不兼容另一个呢？

> Different distributions use different packaging systems, and as a general rule, a package intended for one distribution is not compatible with another distribution. \| Page 196 (Underline).

Page 196 (Underline).

> Most distributions fall into one of two camps of packaging technologies: the Debian .deb camp and the Red Hat .rpm  camp.

### Summing Up

Page 204 (Underline).

> Device drivers are handled in much the same way, except that instead of being separate items in a distribution's repository, they become part of the Linux kernel. Generally speaking, there is no such thing as a "driver disk" in Linux. Either the kernel supports a device or it doesn't, and the Linux kernel supports a lot of devices. Many more, in fact, than Windows does.

## 15 – Storage Media

### Mounting and Unmounting Storage Devices

Page 207 (Underline).

> The first step in managing a storage device is attaching the device to the file system tree. This process, called mounting, allows the device to interact with the operating system. As we recall from Chapter 2, Unix-like operating systems, like Linux, maintain a single file system tree with devices attached at various points. This contrasts with other operating systems such as MS-DOS and Windows that maintain separate file system trees for each device (for example C:\, D:\, etc.).

Page 207 (Underline).

> A file named  /etc/fstab  (short for "file system table") lists the devices (typically hard disk partitions) that are to be mounted at boot time.

Page 208 (Underline).

> Linux allows many file system types to be mounted. Most native Linux file systems are Fourth Extended File System (ext4), but many others are supported, such as FAT16 (msdos), FAT32 (vfat), NTFS (ntfs), CD-ROM (iso9660), etc.

#### Viewing a List of Mounted File Systems

Page 208 (Underline).

> The mount command is used to mount file systems. Entering the command without arguments will display a list of the file systems currently mounted

Page 209 (Underline).

> Like many modern Linux distributions, this system will attempt to automatically mount the CD-ROM after insertion.

Page 210 (Underline).

> [root@linuxbox ~]# umount /dev/sdc

Page 210 (Underline).

> A mount point is simply a directory somewhere on the file system tree. There's nothing special about it. It doesn't even have to be an empty directory, though if you mount a device on a non-empty directory, you will not be able to see the directory's previous contents until you unmount the device.

#### Determining Device Names

打印机设备用这种方式命名。

> /dev/lp* \| Page 213 (Underline).

多种多样的存储都用这种方式命名。

> /dev/sd* \| Page 213 (Underline).

### Creating New File Systems

#### Creating a New File System with mkfs

Page 218 (Underline).

> To do this, we will use mkfs (short for "make file system"), which can create file systems in a variety of formats.

### Testing and Repairing File Systems

fuck

> In Unix culture, the word fsck is often used in place of a popular word with which it shares three letters. \| Page 220 (Underline).

## 16 – Networking

### Examining and Monitoring a Network

#### traceroute

Page 227 (Underline).

> The  traceroute  program (some systems use the similar  tracepath  program instead) lists all the "hops" network traffic takes to get from the local system to a specified host.

#### ip

ip 代替了 ifconfig，看来以后不用 ifconfig 了，需要用 ip a 命令来查看。

> The ip program is a multi-purpose network configuration tool that makes use of the full range networking of features available in modern Linux kernels. It replaces the earlier and now deprecated ifconfig program. \| Page 228 (Underline).

### Secure Communication with Remote Hosts

#### ssh

Page 234 (Underline).

> Most   Linux   distributions   ship   an   implementation   of   SSH   called  OpenSSH  from   the OpenBSD project. Some distributions include both the client and the server packages by default (for example, Red Hat), while others (such as Ubuntu) only supply the client.

## 17 – Searching for Files

### locate – Find Files the Easy Way

Page 241 (Underline).

> The locate program performs a rapid database search of pathnames, and then outputs every name that matches a given substring.

Page 243 (Underline).

> The  locate  database is created by another program named  updatedb. Usually, it is run periodically as a cron job, that is, a task performed at regular intervals by the cron daemon.  Most systems equipped with locate run updatedb once a day.

这一章是讲 find 命令的，内容很多很复杂，如果以后需要了解可以看一看。

> find – Find Files the Hard Way \| Page 243 (Underline).

### find – Find Files the Hard Way

Page 243 (Underline).

> While the locate program can find a file based solely on its name, the find program searches   a given  directory  (and  its   subdirectories) for  files   based  on a  variety  of  attributes.

#### xargs

The xargs command performs an interesting function. It accepts input from standard input and converts it into an argument list for a specified command.

> find ~ -type f -name 'foo*' -print \| xargs ls -l \| Page 253 (Underline).

Page 253 (Underline).

> Unix-like   systems   allow   embedded   spaces   (and   even   newlines!)   in  filenames.

## 18 – Archiving and Backup

### Compressing Files

#### gzip

Page 259 (Underline).

> The gzip program is used to compress one or more files. When executed, it replaces the original file with a compressed version of the original. The corresponding gunzip program is used to restore compressed files to their original, uncompressed form.

#### bzip2

Page 262 (Underline).

> If you apply compression to a file that is already compressed, you will usually end up with a larger file. This is because all compression techniques involve some overhead that is added to the file to describe the compression. If you try to compress a file that already contains no redundant information, the compression will most often not result in any savings to offset the additional overhead.

### Archiving Files

Page 262 (Underline).

> Archiving is the process of gathering up many files and bundling them together into a single large file.

#### tar

Page 263 (Underline).

> In the Unix-like world of software, the tar program is the classic tool for archiving files. Its name, short for tape archive, reveals its roots as a tool for making backup tapes.

Page 264 (Underline).

> Unless we are operating as the superuser, files and directories extracted from archives take on the ownership of the user performing the restoration, rather than the original owner.

## 20 – Text Processing

### Revisiting Some Old Friends

#### uniq

Page 308 (Underline).

> Compared to sort, the uniq program is lightweight. uniq performs a seemingly trivial task. When given a sorted file (or standard input), it removes any duplicate lines and sends the results to standard output. It is often used in conjunction with sort to clean the output of duplicates.

### Slicing and Dicing

#### cut

Page 310 (Underline).

> The cut program is used to extract a section of text from a line and output the extracted section to standard output. It can accept multiple file arguments or input from standard input.

#### paste

Page 314 (Underline).

> The paste command does the opposite of cut. Rather than extracting a column of text from a file, it adds one or more columns of text to a file.

### Comparing Text

#### diff

Page 319 (Underline).

> Like the comm program, diff is used to detect the differences between files. However, diff is a much more complex tool, supporting many output formats and the ability to process large collections of text files at once. diff is often used by software developers to examine changes between different versions of program source code and thus has the ability to recursively examine directories of source code, often referred to as source trees.

#### patch

Page 321 (Underline).

> The patch program is used to apply changes to text files. It accepts output from diff and is generally used to convert older version files into newer versions.

### Editing on the Fly

#### sed

Page 325 (Underline).

> The name sed is short for stream editor. It performs text editing on a stream of text, either a set of specified files or standard input. sed is a powerful and somewhat complex program (there are entire books about it)

Page 333 (Underline).

> awk is a little more specialized. Its specific strength is its ability to manipulate tabular data.

## 23 – Compiling Programs

### Compiling a C Program

Page 376 (Underline).

> The C compiler used almost universally in the Linux environment is called gcc (GNU C Compiler), originally written by Richard Stallman. Most distributions do not install gcc by default.

#### Obtaining the Source Code

Page 378 (Underline).

> One element of the standard is that when the source code tar file is unpacked, a directory will be created that contains the source tree, and this directory will be named project-x.xx, thus containing both the project's name and its version number. This scheme allows easy installation of multiple versions of the same program.

#### Building the Program

Most programs build with a simple, two-command sequence.

> ./configure make \| Page 380 (Underline).

Page 381 (Underline).

> The configure program is a shell script that is supplied with the source tree. Its job is to analyze the build environment. Most source code is designed to be portable. That is, it is designed to build on more than one kind of Unix-like system. But to do that, the source code may need to undergo slight adjustments during the build to accommodate differences between systems. configure also checks to see that necessary external tools and components   are   installed.

这就是我们执行 ./configure 而不是直接执行 configure 的原因。因为这个程序并不是系统提供的，而是源代码提供的，用来做一些微小的配置。

> Since  configure  is   not   located where the shell normally expects programs to be located, we must explicitly tell the shell its location by prefixing the command with ./ to indicate that the program is located in the current working directory. \| Page 381 (Underline).

Page 381 (Underline).

> The makefile is a configuration file that instructs the make program exactly how to build the program. Without it, make will refuse to run.

Page 383 (Underline).

> It only produces this strange message. What's going on? Why didn't it build the program again? Ah, this is the magic of  make. Rather than simply building everything again, make only builds what needs building. With all of the targets present, make determined that there was nothing to do.

#### Installing the Program

sudo make install

> Well-packaged source code will often include a special  make  target called  install. This target will install the final product in a system directory for use. Usually, this directory is /usr/local/bin, the traditional location for locally built software. However, this directory is not normally writable by ordinary users, so we must become the superuser to perform the installation. \| Page 384 (Underline).

# Part 4 – Writing Shell Scripts

## 24 – Writing Your First Script

### Script File Format

Page 389 (Underline).

> The #! character sequence is, in fact, a special construct called a  shebang. The shebang is used to tell the kernel the name of the interpreter that should be used to execute the script that follows. Every shell script should include this as its first line.

### Script File Location

The dot (.) command is a synonym for the source command, a shell builtin that reads a specified file of shell commands and treats it like input from the keyboard.

> [me@linuxbox ~]\$ . .bashrc \| Page 391 (Underline).

#### Good Locations for Scripts

Page 392 (Underline).

> The ~/bin directory is a good place to put scripts intended for personal use. If we write a script that everyone on a system is allowed to use, the traditional location is  /usr/ local/bin. Scripts intended for use by the system administrator are often located in / usr/local/sbin. In most cases, locally supplied software, whether scripts or compiled programs, should be placed in the /usr/local hierarchy and not in /bin or / usr/bin. These directories are specified by the Linux Filesystem Hierarchy Standard to contain only files supplied and maintained by the Linux distributor.

### More Formatting Tricks

#### Indentation and Line-Continuation

Page 393 (Underline).

> One difference between a script and a command line is that the script may employ tab characters to achieve indentation, whereas the command line cannot since tabs are used to activate completion.

## 25 – Starting a Project

### Variables and Constants

#### Assigning Values to Variables and Constants

Page 401 (Underline).

> Unlike some other programming languages, the shell does not care about the type of data assigned to a variable; it treats them all as strings.

Page 401 (Underline).

> Note that in an assignment, there must be no spaces between the variable name, the equal sign, and the value.

Multiple variable assignments may be done on a single line.

> a=5 b="a string" \| Page 401 (Underline).

Page 402 (Underline).

> Note:  It's good practice is to enclose variables and command substitutions in double quotes to limit the effects of word-splitting by the shell. Quoting is especially important when a variable might contain a filename.

## 32 – Positional Parameters

### Accessing the Command Line

Page 475 (Underline).

> The shell provides a set of variables called positional parameters that contain the individual words on the command line. The variables are named  0  through  9.

Page 476 (Underline).

> Even when no arguments are provided, \$0 will always contain the first item appearing on the command line, which is the pathname of the program being executed.

#### Determining the Number of Arguments

Page 476 (Underline).

> The shell also provides a variable, \$#, that contains the number of arguments on the command line

#### shift – Getting Access to Many Arguments

Page 478 (Underline).

> On this example system, the wildcard * expands into 82 arguments. How can we process that many? The shell provides a method, albeit a clumsy one, to do this. The  shift command causes all the parameters to "move down one" each time it is executed.

Page 478 (Underline).

> Each time shift is executed, the value of \$2 is moved to \$1, the value of \$3 is moved to \$2 and so on. The value of \$# is also reduced by one.

#### Simple Applications

Page 479 (Underline).

> The basename command removes the leading portion of a pathname, leaving only the base name of a file.

### Handling Positional Parameters en Masse

Page 482 (Underline).

> The lesson to take from this is that even though the shell provides four different ways of getting the list of positional parameters, "\$@" is by far the most useful for most situations because it preserves the integrity of each positional parameter. To ensure safety, it should always be used, unless we have a compelling reason not to use it.

## 34 – Strings and Numbers

### Parameter Expansion

Page 497 (Underline).

> Note: It's always good practice to enclose parameter expansions in double quotes to prevent unwanted word splitting, unless there is a specific reason not to. This is especially true when dealing with filenames since they can often include embedded spaces and other assorted nastiness.

#### Expansions to Manage Empty Variables

如果参数不存在那么取后面的那个值。

> \$\{parameter:-word\} \| Page 498 (Underline).

如果变量不存在，那么取后面哪个值，并且将其赋予这个参数。

> \$\{parameter:=word\} \| Page 499 (Underline).

如果不存在，输出错误信息 word。

> \$\{parameter:?word\} \| Page 499 (Underline).

如果参数存在，用 word 替换。

> \$\{parameter:+word\} \| Page 500 (Underline).

## 35 – Arrays

### Array Operations

#### Deleting an Array

Page 526 (Underline).

> To delete an array, use the unset command.

Page 526 (Underline).

> unset may also be used to delete single array elements.

Page 526 (Underline).

> Any reference to an array variable without a subscript refers to element zero of the array.

### Associative Arrays

Page 527 (Underline).

> Unlike integer indexed arrays, which are created by merely referencing them, associative arrays must be created with the declare command using the new -A option. Associative array elements are accessed in much the same way as integer indexed arrays.

