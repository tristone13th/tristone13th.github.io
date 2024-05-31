---
categories: Notes
title: Reading Notes for Professional Assembly Language
---

# Chapter 1: What Is Assembly Language?

## Processor Instructions

### Instruction code format

Page 34 (Underline).

> Every instruction must contain at least 1 byte called the operation code(or opcodefor short). The opcodedefines what function the processor should perform.


IA-32 其实就是 x86 架构，一条 x86 的指令由四部分组成：
   - 前缀
   - opcode
   - modifier
   - data element
除了第二个之外，其他的都是可选的。

> Figure 1-2 shows the layout of the IA-32 instruction code format. \| Page 34 (Underline).


Page 35 (Underline).

> The opcode is between 1 and 3 bytes in length, and uniquely defines the function that is performed.


四种类型的前缀，每一种类型的只能用一个，因此最多使用四个，这四种前缀是：
   - Lock and repeat prefixes
   - Segment override and branch hint prefixes
   - Operand size override prefix
   - Address size override prefix

> The instruction prefix can contain between one and four 1-byte prefixes that modify the opcode behav-ior. These prefixes are categorized into four different groups, based on the prefix function. Only one pre-fix from each group can be used at one time to modify the opcode (thus the maximum of four prefixbytes). \| Page 35 (Underline).


Page 35 (Underline).

> The lock prefix indicates that any shared memory areas will be used exclusively by the instruction. Thisis important for multiprocessor and hyperthreaded systems. The repeat prefixes are used to indicate arepeating function (usually used when handling strings).


Page 35 (Underline).

> The segment override prefixes define instructions that can override the defined segment register value(described in more detail in Chapter 2). The branch hint prefixes attempt to give the processor a clue asto the most likely path the program will take in a conditional jump statement (this is used with predic-tive branching hardware).


Page 35 (Underline).

> The operand size override prefix informs the processor that the program will switch between 16-bit and32-bit operand sizes within the instruction code. This enables the program to warn the processor when ituses larger-sized operands, helping to speed up the assignment of data to registers.


Page 36 (Underline).

> The address size override prefix informs the processor that the program will switch between 16-bit and32-bit memory addresses. Either size can be declared as the default size for the program, and this prefixinforms the processor that the program is switching to the other.


modifiers 包含三种类型：
   - addressing-form specifier (ModR/M) byte
   - Scale-Index-Base (SIB) byte
   - One, two, or four address displacement bytes

> Some opcodes require additional modifiers to define what registers or memory locations are involved inthe function. The modifiers are contained in three separate values: \| Page 36 (Underline).


## High-Level Languages

Page 37 (Underline).

> The final part of the instruction code is the data element that is used by the function. While some instruc-tion codes read data from memory locations or processor registers, some include data within the instruc-tion code itself. Often this value is used to represent a static numeric value, such as a number to be added,or a memory location. This value can contain 1, 2, or 4 bytes of information, depending on the data size.


Page 37 (Underline).

> As you can see from this example, the value 1 was written as the 4-byte hexadecimal value 01 00 00 00.The order of the bytes in the data stream depends on the type of processor used. The IA-32 platform pro-cessors use "little-endian" notation, whereby the lower-value bytes appear first in order (when readingleft to right).


### Types of high-level languages

Page 39 (Underline).

> The object code file contains the instruc-tion codes that represent the core of the application functions, as shown above. The object code file itselfcannot be run by the operating system.


Page 39 (Underline).

> Object files that contain commonly used functions can be combined into a single file, called a libraryfile. The library file can then be linked into multiple applications either at compile time (called staticlibraries), or at the time the application is run on the system (called dynamic libraries).


### High-level language features

Page 40 (Underline).

> The Java programming language is compiled into what is called byte code. The byte code is similar totheinstruction code you would see on a processor, but is itself not compatible with any current proces-sor family (although there have been plans to create a processor that can run Java byte code as instruc-tion sets).Instead, the Java byte code must be interpreted by a Java Virtual Machine (JVM), running separately onthe host computer. The Java byte code is portable, in that it can be run by any JVM on any type of hostcomputer. The advantage is that different platforms can have their own specific JVMs, which are used tointerpret the same Java byte code without it having to be recompiled from the original source code.


## Assembly Language

编译、汇编、链接。所以链接使用的是 object code 而不是汇编代码。

> The assembly languagemnemonics are easily converted to the raw instruction codes by an assembler. \| Page 41 (Underline).


### Opcode mnemonics

汇编代码的那些助记符，或者说叫做 mnemonic codes，就像 push, mov 等等，其实并不仅仅和处理器的指令集架构相关，而且还和汇编器相关，这是很好理解的。

> Different assemblers use different mnemonics to represent instruction codes. While trends haveemergedto standardize assembler mnemonics, there is still quite a vast variety of mnemonic codes, notonly between processor families but even between assemblers used for the same processor instructioncode sets. \| Page 42 (Underline).


### Directives

Page 45 (Underline).

> The stack is aspecial memory area usually reserved for passing data elements between functions in the program. Itcan also be used for temporarily storing and retrieving data elements.


derective，中文名不知道叫什么，和 label 的区别在于其前面有一个 period，也就是点号。

> The datatypes were declared using assembler directives used in the GNU assembler. The .long, .ascii, and.floatdirectives are used to alert the assembler that a specific type of data is being declared. As shownin the example, directives are preceded by a period to set them apart from labels. \| Page 45 (Underline).


所以说 directive 这东西和语法糖也有点像，其实也和汇编器是强相关的。

> Directives are another area in which the different assemblers vary. Many different directives are used tohelp make the programmer's job of creating instruction codes easier. \| Page 45 (Underline).


Page 45 (Underline).

> Some modern assemblers have listsof directives that can rival many HLLfeatures, such as while loops, and if-then statements! The older,more traditional assemblers, however, keep the directives to a minimum, forcing the assembly languageprogrammer to use the mnemonic codes to create the program logic.


.section 是 directive，同时注意所有的汇编语言程序都需要至少三个段是声明的，也就是数据段、bss 段以及代码段。

> One of the most important directives used in the assembly language program is the .sectiondirective.This directive defines the section of memory in which the assembly language program is defining ele-ments. All assembly language programs have at least three sections that must be declared \| Page 45 (Underline).


Page 45 (Underline).

> The data section is used to declare the memory region where data elements are stored for the program.This section cannot be expanded after the data elements are declared, and it remains static throughoutthe program.


## Summary

Page 46 (Underline).

> The bss section is also a static memory section. It contains buffers for data to be declared later in the pro-gram. What makes this section special is that the buffer memory area is zero-filled.


# Chapter 2: The IA-32 Platform

## Core Parts of an IA-32 Processor

### Control unit

为什么叫 IA-32 架构呢，全称是 Intel Architecture, 32-bit

> Older processors in the IA-32 family fetched instructions and data directly from system memory as theywere needed by the execution unit. Because it takes considerably longer to retrieve data from memorythan to process it, a backlog occurs, whereby the processor is continually waiting for instructions anddata to be retrieved from memory. To solve this problem, the concept of prefetchingwas created. \| Page 51 (Underline).


Page 52 (Underline).

> The IA-32 platform implements pipelining by utilizing two (or more) layers of cache. The first cachelayer (called L1) attempts to prefetch both instruction code and data from memory as it thinks it willbeneeded by the processor. As the instruction pointer moves along in memory, the prefetch algorithmdetermines which instruction codes should be read and placed in the cache.


Page 52 (Underline).

> Of course, one pitfall to caching instructions and data is that there is no guarantee that the program willexecute instructions in a sequential order. If the program takes a logic branch that moves the instructionpointer to a completely different location in memory, the entire cache is useless and must be cleared andrepopulated with instructions from the new location.To help alleviate this problem, a second cache layer was created. The second cache layer (called L2) canalso hold instruction code and data elements, separate from the first cache layer. When the programlogic jumps to a completely different area in memory to execute instructions, the second layer cache canstill hold instructions from the previous instruction location. If the program logic jumps back to the area,those instructions are still being cached and can be processed almost as quickly as instructions stored inthe first layer cache.


### Registers

EAX 经常被用来做操作数的累加

> Accumulator for operands and results data \| Page 57 (Underline).


EBX 通常来指向数据。

> Pointer to data in the data memory segment \| Page 57 (Underline).


ECX 被用来做循环和字符串的计数器。

> Counter for string and loop operations \| Page 57 (Underline).


EDX。

> I/O pointer \| Page 57 (Underline).


EDI。

> Data pointer for destination of string operations \| Page 57 (Underline).


ESI。

> Data pointer for source of string operations \| Page 57 (Underline).


ESP 是段指针，注意其算是通用寄存器。

> Stack pointer \| Page 57 (Underline).


EBP 也算是通用寄存器。

> Stack data pointer \| Page 57 (Underline).


段寄存器有六个，CS, DS, SS, ES, FS, GS, 前三个好理解，分别是代码段、数据段以及堆栈段的寄存器，后三个都是额外的段寄存器。

> The segment registers are used to contain the segment address for specific data access. \| Page 59 (Underline).


Page 59 (Underline).

> Each segment register is 16 bits and contains the pointer to the start of the memory-specific segment. TheCS register contains the pointer to the code segment in memory. The code segment is where the instruc-tion codes are stored in memory. The processor retrieves instruction codes from memory based on theCS register value, and an offset value contained in the EIPinstruction pointer register. Aprogram cannotexplicitly load or change the CS register. The processor assigns its value as the program is assigned amemory space.


Page 59 (Underline).

> The DS, ES, FS, and GS segment registers are all used to point to data segments. By having four separatedata segments, the program can help separate data elements, ensuring that they do not overlap.


Page 59 (Underline).

> If a program is using the real address mode, all of the segment registers point to the zero linear address,and are not changed by the program. All instruction codes, data elements, and stack elements areaccessed directly by their linear address.


Page 59 (Underline).

> The instruction pointer register (or EIPregister), sometimes called the program counter,keeps track of thenext instruction code to execute. While this sounds like a simple process, with the implementation of theinstruction prefetch cache it is not. The instruction pointer points to the next instruction to execute.


Page 59 (Underline).

> An application program cannot directly modify the instruction pointer per se. You cannot specify amemory address and place it in the EIPregister. Instead, you must use normal program control instruc-tions, such as jumps, to alter the next instruction to be read into the prefetch cache.


### Flags

除了通用寄存器、段寄存器，指令指针寄存器之外，还有五个控制寄存器，分别是 CR0 到 CR4。

> The five control registers are used to determine the operating mode of the processor, and the characteris-tics of the currently executing task. \| Page 60 (Underline).


Page 60 (Underline).

> The values in the control registers cannot be directly accessed, but the data contained in the control reg-ister can be moved to a general-purpose register. Once the data is in a general-purpose register, an appli-cation program can examine the bit flags in the register to determine the operating status of theprocessor and/or currently running task.


Page 60 (Underline).

> If a change is required to a control register flag value, the change can be made to the data in the general-purpose register, and the register moved to the control register. Systems programmers usually modifythe values in the control registers. Normal user application programs do not usually modify control reg-isters entries, although they might query flag values to determine the capabilities of the host processorchip on which the application is running.


flags 也是 CPU 当中的寄存器。

> Flags are important to assembly language programs, as they are the only means available to determinewhether a program's function succeeded or not. For example, if an application performed a subtractionoperation that resulted in a negative value, a special flag within the processor would be set. Withoutchecking the flag, the assembly language program would not have any way to know that somethingwent wrong. \| Page 60 (Underline).


Page 60 (Underline).

> The IA-32 platform uses a single 32-bit register to contain a group of status, control, and system flags.The EFLAGS register contains 32 bits of information that are mapped to represent specific flags of infor-mation. Some bits are reserved for future use, to allow additional flags to be defined in future proces-sors. At the time of this writing, 17 bits are used for flags.


## Advanced IA-32 Features

### The x87 floating-point unit

Page 63 (Underline).

> Starting with the 80486 processor, the advanced arithmetic functions found in the 80287 and 80387 chipswere incorporated into the main processor. To support these functions, additional instruction codes aswell as additional registers and execution units were required. Together these elements are referred to asthe x87 floating-point unit (FPU).


### Streaming SIMD extensions (SSE)

Page 64 (Underline).

> The FPU registers and instruction codes enable assembly language programs to quickly process complexfloating-point mathematical functions, such as those required for graphics processing, digital signal pro-cessing, and complex business applications. The FPU can process floating-point arithmetic considerablyfaster than the software simulation used in the standard processor without the FPU. Whenever possible,the assembly language programmer should utilize the FPU for floating-point arithmetic.


Multimedia extensions (MMX)

> The Pentium II processor introduced another method for programmers to perform complex integerarithmetic operations. MMX was the first technology to support the Intel Single Instruction, MultipleData (SIMD) execution model. \| Page 64 (Underline).


MMX 解决复杂整数运算，而 SSE 解决的是复杂浮点数运算。

> While the MMX technology improved processing speeds for complex integer arithmetic, it did nothingfor programs that require complex floating-point arithmetic. That problem was solved with the SSEenvironment. \| Page 64 (Underline).


## The IA-32 Processor Family

Page 65 (Underline).

> The hyperthreading technology consists of two or more logical processors located on a single physicalprocessor. Each logical processor contains a complete set of general-purpose, segment, control, anddebug registers. All of the logical processors share the same execution unit. The out-of-order executioncore is responsible for handling the separate threads of instruction codes provided by the different logi-cal processors.


# Chapter 3: The Tools of the Trade

## The Development Tools

### The Assembler

Page 72 (Underline).

> The granddaddy of all assemblers for the Intel platform, the Microsoft Assembler (MASM) is the prod-uct of the Microsoft Corporation. It has been available since the beginning of the IBM-compatible PC,enabling programmers to produce assembly language programs in both the DOS and Windowsenvironments.


### The Linker

Page 73 (Underline).

> When the linker is invoked manually, the developer must know which libraries are required to com-pletely resolve any functions used by the application. The linker must be told where to find functionlibraries and which object code files to link together to produce the resulting file.


## The GNU Assembler

### Installing the assembler

Page 76 (Underline).

> The GNU assembler program (called gas) is the most popular assembler for the UNIX environment.


### Using the assembler

Page 78 (Underline).

> It is often recommended not to change the binutilspackage on your Linux distribution if one isalready installed and being used. The binutilspackage contains many low-level library files that areused to compile operating system components. If those library files change or are moved, bad things canhappen to your system, very bad things.


### A word about opcode syntax

Page 80 (Underline).

> The original developers of gas chose to implement AT&T opcodesyntax for the assembler.


Page 80 (Underline).

> The AT&T opcode syntax originated from AT&T Bell Labs, where the UNIX operating system was cre-ated. It was formed based on the opcode syntax of the more popular processor chips used to implementUNIX operating systems at the time. While many processor manufacturers used this format, unfortu-nately Intel chose to use a different opcode syntax.


AT&T 风格汇编代码和 Intel 风格的汇编代码的区别之一。

> AT&T immediate operands use a \$to denote them, whereas Intel immediate operands areundelimited. Thus, when referencing the decimal value 4 in AT&T syntax, you would use \$4,and in Intel syntax you would just use 4. \| Page 80 (Underline).


区别之二。

> AT&T prefaces register names with a %, while Intel does not. Thus, referencing the EAX registerin AT&T syntax, you would use %eax. \| Page 80 (Underline).


区别之三。

> AT&T syntax uses the opposite order for source and destination operands. To move the decimalvalue 4 to the EAX register, AT&T syntax would be movl \$4, %eax, whereas for Intel it wouldbe mov eax, 4. \| Page 80 (Underline).


区别之四。

> AT&T syntax uses a separate character at the end of mnemonics to reference the data size usedin the operation, whereas in Intel syntax the size is declared as a separate operand. The AT&Tinstruction movl \$test, %eaxis equivalent to mov eax, dword ptr testin Intel syntax. \| Page 80 (Underline).


区别之五

> Long calls and jumps use a different syntax to define the segment and offset values. AT&T syn-tax uses ljmp \$section, \$offset, whereas Intel syntax uses jmp section:offset. \| Page 80 (Underline).


Page 80 (Underline).

> If you learn assembly language coding using the AT&T syntax, you will becomfortable creating assembly language programs on most any UNIX system available, on most anyhardware platform. If you plan on doing cross-platform work between UNIX and Microsoft Windowssystems, you may want to consider using Intel syntax for your applications.


## The GNU Compiler

### Downloading and installing gcc

GCC 的 C 和 C 语言没关系，注意全称。

> The GNU Compiler Collection (gcc) is the most popular development system for UNIX systems. \| Page 84 (Underline).


# Chapter 4: A Sample Assembly Language Program

## The Parts of a Program

### Defining the starting point

Page 105 (Underline).

> The GNU assembler declares sections using the .sectiondeclarative statement. The .sectionstate-ment takes a single argument, the type of section it is declaring.


## Creating a Simple Program

Page 106 (Underline).

> the GNU assembler declares a default label, or identifier, that should be used forthe entry point of the application. The \_startlabel is used to indicate the instruction from which theprogram should start running. If the linker cannot find this label, it will produce an error message


[在 C 中引用汇编语言定义的 .globl 变量\_车子（chezi）-CSDN博客](https://blog.csdn.net/longintchar/article/details/80038843)

> Besides declaring the starting label in the application, you also need to make the entry point availablefor external applications. This is done with the .globldirective.The .globldirective declares program labels that are accessible from external programs. If you are writ-ing a bunch of utilities that are being used by external assembly or C language programs, each functionsection label should be declared with a .globldirective. \| Page 106 (Underline).


### The CPUID instruction

Page 107 (Underline).

> The CPUIDinstruction is one assembly language instruction that is not easily performed from a high-level language application. It is a low-level instruction that queries the processor for specific informa-tion, and returns the information in specific registers.


### The sample program

Page 109 (Underline).

> The .asciideclarative is used to declare a text string using ASCII characters.


[.globl \_start 简介\_engineer0的博客-CSDN博客\_.global \_start](https://blog.csdn.net/engineer0/article/details/109911045)

> .section .text.globl \_start\_start: \| Page 109 (Underline).


汇编语言是可以执行系统调用的。int 0x80 可以直接进行软中断，软中断是执行中断指令产生的，而硬中断是由外设引发的。硬中断的中断号是由中断控制器提供的，软中断的中断号由指令直接指出，无需使用中断控制器。 硬中断是可屏蔽的，软中断不可屏蔽。硬中断处理程序要确保它能快速地完成任务，这样程序执行时才不会等待较长时间，称为上半部。

> The Linux kernel provides many preset functions that can be easily accessed from assembly applica-tions. To access these kernel functions, you must use the intinstruction code, which generates a soft-ware interrupt, with a value of 0x80. The specific function that is performed is determined by the valueof the EAXregister. Without this kernel function, you would have to send each output character yourselfto the proper I/O address of the display. The Linux system calls are a great time-saver for assembly lan-guage programmers. \| Page 110 (Underline).


## Debugging the Program

### Using gdb

There is one problem when using gcc to assemble your programs. While the GNU linker looks for the \_start label to determine the beginning of the program, gcc looks for the main label (you might recognize that from C or C++ programming). You must change both the \_start label and the .globl directive defining the label in your program to look like the following

> .section .text.globl mainmain: \| Page 112 (Underline).


## Using C Library Functions in Assembly

### Linking with C library functions

Page 119 (Underline).

> When you use C library functions in your assembly language program, you must link the C library fileswith the program object code.


Page 119 (Underline).

> On Linux systems, the standard C dynamic library is located in the file libc.so.x, where xis a valuerepresenting the version of the library.


# Chapter 5: Moving Data

## Defining Data Elements

### The data section

Page 123 (Underline).

> There is another type of data section called.rodata. Any data elements defined in this section canonly be accessed in read-only mode (thus the roprefix).


.section .data 
msg:
.ascii "This is a test message" 
factors: 
.double 37.45, 45.33, 12.30 
height: 
.int 54 
length: 
.int 62, 35, 47

> You can define as many data elements as you need in the data section. Just remember that the label mustprecede the directive defining the data \| Page 124 (Underline).


### Defining static symbols

Page 125 (Underline).

> Although the data section is intended primarily for defining variable data, you can also declare staticdata symbols here as well. The .equdirective is used to set a constant value to a symbol that can be usedin the text section


### The bss section

Page 126 (Underline).

> Defining data elements in the bss section is somewhat different from defining them in the data section.Instead of declaring specific data types, you just declare raw segments of memory that are reserved forwhatever purpose you need them for.


.comm

> Declares a common memory area for data that is not initialized \| Page 126 (Underline).


.lcomm

> Declares a local common memory area for data that is not initialized \| Page 126 (Underline).


.comm symbol, length

> While the two sections work similarly, the local common memory area is reserved for data that will notbe accessed outside of the local assembly code. \| Page 126 (Underline).


Page 126 (Underline).

> Local common memory areascannot be accessed by functions outside of where they were declared (they can't be used in .globldirectives).


可执行文件会比较小，因为不需要存初始化的值。

> One benefit to declaring data in the bss section is that the data is not included in the executable program.When data is defined in the data section, it must be included in the executable program, since it must beinitialized with a specific value. Because the data areas declared in the bss section are not initialized withprogram data, the memory areas are reserved at runtime, and do not have to be included in the finalprogram. \| Page 126 (Underline).


buffer:
.fill 10000

> The .filldirective enables the assembler to automatically create the 10,000 data elements for you. Thedefault is to create one byte per field, and fill it with zeros. You could have declared a .bytedata value,and listed 10,000 bytes yourself. \| Page 127 (Underline).


## Moving Data Elements

### The MOV instruction formats

movx source, destination

> The sourceand destinationvalues can be memory addresses, data values stored in memory, datavalues defined in the instruction statement, or registers. \| Page 128 (Underline).


movl

> lfor a 32-bit long word value \| Page 128 (Underline).


movw

> wfor a 16-bit word value \| Page 128 (Underline).


movb

> bfor an 8-bit byte value \| Page 128 (Underline).


### Moving immediate data to registers and memory

An immediate data element to a general-purpose register 
An immediate data element to a memory location 
A general-purpose register to another general-purpose register 
A general-purpose register to a segment register 
A segment register to a general-purpose register
A general-purpose register to a control register
A control register to a general-purpose register
A general-purpose register to a debug register
A debug register to a general-purpose register
A memory location to a general-purpose register
A memory location to a segment register 
A general-purpose register to a memory location
Asegment register to a memory location

> There are very specific rules for using the MOVinstruction. Only certain things can be moved to otherthings, as shown in the following combinations for a MOVinstruction \| Page 129 (Underline).


### Moving data between memory and registers

Page 130 (Underline).

> The eight general-purpose registers (EAX, EBX, ECX, EDX, EDI, ESI, EBP, and ESP) are the most commonregisters used for holding data. These registers can be moved to any other type of register available.Unlike the general-purpose registers, the special-purpose registers (the control, debug, and segment reg-isters) can only be moved to or from a general-purpose register.


movb %al, %bx

> will produce an error by the assembler. This instruction attempts to move the 8 bits in the ALregister tothe lower 8 bits in the BXregister. Instead, you should move the entire %axregister to the %bxregisterusing the MOVWinstruction. \| Page 130 (Underline).


base\_address + offset\_address + index * size

> base\_address(offset\_address, index, size) \| Page 133 (Underline).


movl \$values, %edi

> While using a label references the data value contained in the memory location, you can get the memorylocation address of the data value by placing a dollar sign (\$) in front of the label in the instruction. \| Page 135 (Underline).


movl %ebx, (%edi)

> With the parentheses aroundthe EDIregister, the instruction instead moves the value in the EBXregister to the memory location con-tained in the EDIregister. \| Page 135 (Underline).


movl %edx, 4(%edi)

> Instead of just allowing you to add a value to the register, you must place the value outside of the paren-theses, \| Page 135 (Underline).


## Conditional Move Instructions

Page 137 (Underline).

> Over the years, Intel hastweaked the IA-32 platform to provide additional functionality, making assembly language program-mers' jobs easier. The conditional moveinstructions are one of those tweaks, available starting in the P6family of Pentium processors (the Pentium Pro, Pentium II, and newer).


### The CMOV instructions

cmovx source, destination

> where xis a one- or two-letter code denoting the condition that will trigger the move action. The condi-tions are based on the current values in the EFLAGSregister. \| Page 138 (Underline).


## Exchanging Data

### The data exchange instructions

xchg operand1, operand2 交换两个值。

> Either operand1or operand2can be a general-purpose register or a memory location (but both cannotbe a memory location). The command can be used with any general-purpose 8-, 16-, or 32-bit register,although the two operands must be the same size. \| Page 143 (Underline).


When one of the operands is a memory location, the processor's LOCK signal is automatically asserted, preventing any other processor from accessing the memory location during the exchange.

> Be careful when using the XCHGinstruction with memory locations. The LOCKprocess is very time-consuming, and can be detrimental to your program's performance. \| Page 143 (Underline).


It is important to remember that the bits are not reversed; but rather, the individual bytes contained within the register are reversed. This produces a big-endian value from a little-endian value, and visa versa.

> The BSWAPinstruction is a powerful tool to have handy when working with systems that have differentbyte orientations. The BSWAPinstruction reverses the order of the bytes in a register. Bits 0 through 7 areswapped with bits 24 through 31, while bits 8 through 15 are swapped with bits 16 through 23. \| Page 143 (Underline).


xadd source, destination

> The XADDinstruction is used to exchange the values between two registers, or a memory location and aregister, add the values, and then store them in the destination location \| Page 144 (Underline).


cmpxchg source, destination. The destination operand can be an 8-, 16-, or 32-bit register, or a memory location. The source operand must be a register whose size matches the destination operand.

> The CMPXCHGinstruction compares the destination operand with the value in the EAX, AX, or ALregisters.If the values are equal, the value of the source operand value is loaded into the destination operand. Ifthe values are not equal, the destination operand value is loaded into the EAX, AX, or ALregisters. \| Page 145 (Underline).


## The Stack

### PUSHing and POPing data

Page 151 (Underline).

> The bottom of the stack (or top of memory) contains data elements placed there by the operating systemwhen the program is run. Any command-line parameters used when running the program are enteredonto the stack, and the stack pointer is set to the bottom of the data elements.


Page 151 (Underline).

> As each data element is added to the stack area, a pointer is used to keep track of where the start of thestack is. The ESPregister contains the memory address of the start of the stack.


pushx source，pop 也是类似的规则。

> where xis a one-character code for the size of the data \| Page 151 (Underline).


pushl

> lfor a long word (32 bits) \| Page 152 (Underline).


pushw

> wfor a word (16 bits) \| Page 152 (Underline).


Page 152 (Underline).

> Note the difference between using the label dataversus the memory location \$data. The first format(without the dollar sign) places the data value contained in the memory location in the stack, whereasthe second format places the memory address referenced by the label in the stack.


## Optimizing Memory Access

PUSHA/POPA

> Push or pop all of the 16-bit general-purpose registers \| Page 154 (Underline).


PUSHAD/POPAD

> Push or pop all of the 32-bit general-purpose registers \| Page 154 (Underline).


PUSHF/POPF

> Push or pop the lower 16 bits of the EFLAGS register \| Page 154 (Underline).


PUSHFD/POPFD

> Push or pop the entire 32 bits of the EFLAGS register \| Page 154 (Underline).


Page 154 (Underline).

> The PUSHAand POPAinstructions are great for quickly setting aside and retrieving the current state of allthe general-purpose registers at once.


Page 154 (Underline).

> The PUSHAinstruction pushes the 16-bit registers so they appearon the stack in the following order: DI, SI, BP, BX, DX, CX, and finally, AX. The PUSHADinstruction pushesthe 32-bit counterparts of these registers in the same order. The POPAand POPADinstructions retrieve theregisters in the reverse order they were pushed.


Page 154 (Underline).

> Often, instead of using the ESPregister itself, you will see many programs copy the ESPregister value tothe EBPregister. It is common in assembly language functions to use the EBPpointer to point to the baseof the working stack space for the function. Instructions that access parameters stored on the stack refer-ence them relative to the EBPvalue


## Summary

内存对齐。

> The gasassembler supports the .aligndirective, which is used to align defined data elements on spe-cific memory boundaries. The .aligndirective is placed immediately before the data definition in thedata section, instructing the assembler to position the data element on a memory boundary \| Page 155 (Underline).


# Chapter 6: Controlling Execution Flow

## The Instruction Pointer

Page 159 (Underline).

> An instruction is considered executed when the processor retirement unit executes the result from theout-of-order engine from the instruction. After that instruction is executed, the instruction pointer isincremented to the next instruction in the program code.


## Unconditional Branches

### Jumps

Page 160 (Underline).

> Your program cannot directly modify the instruction pointer. You do not have the capability to directlychange the value of the EIPregister to point to a different location in memory with a MOVinstruction.You can, however, utilize instructions that alter the value of the instruction pointer. These instructionsare called branches.


三种非条件型分支：Jumps, Calls, Interrupts

> When an unconditional branch is encountered in the program, the instruction pointer is automaticallyrouted to a different location. You can use three types of unconditional branches \| Page 160 (Underline).


Page 160 (Underline).

> If you are familiarwith the BASIC programming language, you have most likely seen GOTOstatements. Jump statementsare the assembly language equivalent of the BASIC GOTOstatement.


jmp location

> where locationis the memory address to jump to. In assembly language, the location value is declaredas a label within the program code. When the jump occurs, the instruction pointer is changed to thememory address of the instruction code located immediately after the label. \| Page 160 (Underline).


Short jump, Near jump, Far jump

> Behind the scenes, the single assembly jump instruction is assembled into one of three different types ofjump opcodes \| Page 161 (Underline).


Page 161 (Underline).

> Ashort jump is used when the jump offset is less than128 bytes. Afar jump is used in segmented memory models when the jump goes to an instruction inanother segment. The near jump is used for all other jumps.


### Calls

Page 163 (Underline).

> The next type of unconditional branch is the call. Acall is similar to the jump instruction, but it remem-bers where it jumped from and has the capability to return there if needed. This is used when imple-menting functions in assembly language programs.


Page 164 (Underline).

> The return instruction has no operands,just the mnemonic RET. It knows where to return to by looking at the stack.


Page 165 (Underline).

> The return address is added to the stack when the CALLinstruction is executed. When the called func-tion begins, it must store the ESPregister somewhere it can be restored to its original form before the RETinstruction attempts to return to the calling location. Because the stack may also be manipulated withinthe function, the EBPregister is often used as a base pointer to the stack. Thus, the ESPregister is usuallycopied to the EBPregister at the beginning of the function as well.


所以说 call 和 ret 好像并不会做很多事情，其实需要我们手动来完成。
```assembly
function\_label: 
    pushl %ebp
    movl %esp, %ebp
    < normal function code goes here> 
    movl %ebp, %esp 
    popl %ebp 
    ret
```

> it is not too difficult if you create a standard template to use for all of yourfunction calls. The form to remember for functions is as follows \| Page 165 (Underline).


### Interrupts

Page 166 (Underline).

> Hardware devices generate hardware interrupts. They are used to signal events happening at the hard-ware level (such as when an I/O port receives an incoming signal). Programs generate software inter-rupts. They are a signal to hand off control to another program.


Page 166 (Underline).

> When a program is called by an interrupt, the calling program is put on hold, and the called programtakes over. The instruction pointer is transferred to the called program, and execution continues fromwithin the called program. When the called program is complete, it can return control back to the callingprogram (using an interrupt return instruction).


从用户态切换到内核态，是直接通过软中断来进行系统调用实现的。

> Software interrupts are provided by the operating system to enable applications to tap into functionswithin the operating system, and in some cases even the underlying BIOS system. In the Microsoft DOSoperating system, many functions are provided with the 0x21 software interrupt. In the Linux world, the0x80 interrupt is used to provide low-level kernel functions. \| Page 166 (Underline).


## Conditional Branches

### Conditional jump instructions

❑ Carry flag (CF) - bit 0 (lease significant bit) ❑ Overflow flag (OF) - bit 11 ❑ Parity flag (PF) - bit 2 ❑ Sign flag (SF) - bit 7 ❑ Zero flag (ZF) - bit 6

> There are many bits in the EFLAGSregister, but the conditional branches are only concerned with fiveofthem \| Page 167 (Underline).


jxx address，where xx is a one- to three-character code for the condition

> The formatof the conditional jump instruction is \| Page 167 (Underline).


### The compare instruction

Short jumps、Near jumps

> Two types of jumps are allowed for conditional jumps \| Page 169 (Underline).


### Examples of using the flag bits

Page 171 (Underline).

> The Zero flag can be set by either a CMPinstruction or a mathematical instruction that evaluates to Zero


奇 0 偶 1。

> The parity flag indicates the number of bits that should be one in a mathematical answer. This can beused as a crude error-checking system to ensure that the mathematical operation was successful. \| Page 172 (Underline).


Page 172 (Underline).

> The sign flag is used in signed numbers to indicate a sign change in the value contained in the register.In a signed number, the last (highest order) bit is used as the sign bit. It indicates whether the numericrepresentation is negative (set to 1) or positive (set to 0).


Page 174 (Underline).

> The carry flag is used in mathematical expressions to indicate when an overflow has occurred in anunsigned number (remember that signed numbers use the overflow flag).


Page 174 (Underline).

> Unlike the overflow flag, the DECand INCinstructions do not affect the carry flag.


## Loops

### The loop instructions

Page 175 (Underline).

> The loop instructions use the ECXregister as a counter and automatically decrease its value as the loopinstruction is executed.


loop address

> where addressis a label name for a location in the program code to jump to. Unfortunately, the loopinstructions support only an 8-bit offset, so only short jumps can be performed. \| Page 175 (Underline).


### Preventing LOOP catastrophes

Page 176 (Underline).

> An added benefit of the loop instructions is that they decrease the value of the ECXregister withoutaffecting the EFLAGSregister flag bits. When the ECXregister reaches zero, the Zero flag is not set.


## Duplicating High-Level Conditional Branches

### if statements

esp 指针并不是自动更新的，它也需要手动进行更新。

> The stackpointer, ESP, is then manually manipulated to make room for putting local variables on the stack. \| Page 179 (Underline).


## Optimizing Branch Instructions

### Branch prediction

分支预测规则一：Using normal programming logic, the most often seen use of backward branches (branches that jump to previous instruction codes) is in loops. For example, the code snippet will jump 100 times back to the loop1 label, but fall through to the next instruction only once. The first branching rule will always assume that the backwards branch will be taken. Out of the 101 times the branch is executed, it will only be wrong once.

> Backward branches are assumed to be taken. \| Page 185 (Underline).


Page 185 (Underline).

> Forward branches are a little trickier. The branch prediction algorithm assumes that most of the timeconditional branches that go forward are not taken. In programming logic, this assumes that the codeimmediately following the jump instruction is most likely to be taken, rather than the jump that movesover the code.


### Optimizing tips

Page 186 (Underline).

> Whenthe compiler created the assembly language code, it attempted to maximize the code's performance byguessing that the "then" part of the If statement would be more likely to be taken than the "else" part.


Page 186 (Underline).

> The final rule implies that branches that are performed multiple times are likely to follow the same paththe majority of the time. The Branch Target Buffer (BTB) keeps track of each branch instruction performedby the processor, and the outcome of the branch is stored in the buffer area.The BTB information overrides either of the two previous rules for branches. For example, if a backwardbranch is not taken the first time it is encountered, the branch prediction unit will assume it will not betaken any subsequent times, rather than assume that the backwards branch rule would apply.The problem with the BTB is that it can become full. As the BTB becomes full, looking up branch resultstakes longer, and performance for executing the branch decreases.


Page 188 (Underline).

> While loops are generally covered by the backward branch rule, there is still a performance penalty evenwhen they are predicted correctly. Abetter rule-of-thumb to use is to eliminate small loops wheneverpossible.The problem appears in loop overhead. Even a simple loop requires a counter that must be checked foreach iteration, and a jump instruction that must be evaluated. Depending on the number of programlogic instructions within the loop, this can be a huge overhead.


# Chapter 7: Using Numbers

## Binary Coded Decimal

### What is BCD?

Page 209 (Underline).

> The Binary Coded Decimal (BCD) data type has been available for quite a long time in computer sys-tems. The BCD format is often used to simplify working with devices that use decimal numbers (such asdevices that must display numbers to humans, such as clocks and timers).


### FPU BCD values

Page 210 (Underline).

> As you can tell, BCD wastes space by using an entire byte for each decimal digit. Packed BCD was cre-ated to help compensate for that. Packed BCD enables a single byte to contain two BCD values.


### Moving BCD values

Page 211 (Underline).

> The FBLDinstruction is used to move a packed 80-bit BCD value into the FPUregister stack.


## Floating-Point Numbers

### What are floating-point numbers?

Page 213 (Underline).

> In earlier Intel pro-cessors (such as the 80286 and 80386 chips) performing floating-point operations required either usingsoftware to simulate the floating-point values using integers, or purchasing a separate FPU chip thatspecialized in performing only floating-point arithmetic.However, since the 80486 processor, the Intel IA-32 platform has directly supported floating-point opera-tions. It is now just as easy for assembly language programmers to incorporate floating-point mathemat-ical operations within their programs.


### Standard floating-point data types

Page 215 (Underline).

> In 1985, the Institute of Electrical and Electronics Engineers (IEEE) created what is called the IEEEStandard 754 floating-point formats. These formats are used universally to represent real numbers incomputer systems. Intel has adopted this standard in the IA-32 platform for representing floating-pointvalues.


IEEE 754。

> The sign bit denotes if the value is negative or positive. Aone in the sign bit denotes a negative value,and a zero denotes a positive value.The significand part represents the coefficient (or mantissa) of the floating-point number. The coefficientcan be either normalizedor denormalized. When a binary value is normalized, it is written with a onebefore the decimal point. The exponent is modified to accommodate how many bit positions have beenshifted to accomplish this (similar to the scientific notation method). This means that in a normalizedvalue, the significand is always comprised of a one and a binary fraction.The exponent represents the exponent part of the floating-point number. Because the exponent value canbe positive or negative, it is offset by a bias value. This ensures that the exponent field can only be a pos-itive unsigned integer. It also limits the minimum and maximum exponent values available for use inthe format. The general format of the binary floating-point number is shown in Figure 7-11. \| Page 216 (Underline).


### Moving floating-point values

Page 218 (Underline).

> The FLDinstruction is used to move floating-point values into and out of the FPUregisters.


Page 219 (Underline).

> Similarly, the FSTinstruction is used for retrieving the top value on the FPUregister stack and placingthe value in a memory location.


### Moving SSE floating-point values

Page 222 (Underline).

> Similar to the packed BCD concept, packed floating-point numbers enable multiple floating-point valuesto be stored in a single register. Floating-point calculations can be performed in parallel using the multi-ple data elements, producing results quicker than sequentially processing the data.


# Chapter 8: Basic Math Functions

## Integer Arithmetic

### Addition

add source, destination

> where sourcecan be an immediate value, a memory location, or a register. The destinationparam-eter can be either a register or a value stored in a memory location (although you cannot use a memorylocation for both the source and destination at the same time). The result of the addition is placed in thedestination location. \| Page 233 (Underline).


Page 233 (Underline).

> As with other GNU assembler instructions, youmust specify the size of the operands by adding a b(for byte), w(for word), or l(for doubleword) to theend of the ADDmnemonic.


Page 235 (Underline).

> When adding integers, you should always pay attention to the EFLAGSregister to ensure that nothing oddhappened during the process. For unsigned integers, the carry flagis set when an addition results in acarry condition in the binary addition (the result is larger than the maximum value allowed). For signedintegers, the overflow flagis used when an overflow condition is present (the resulting value is less thanthe minimum negative value, or greater than the maximum positive value allowed).


For example, a value of 1 in %eax means a system call of exit(), and the value in %ebx holds the value of the status code for exit().

> movl \$1, %eaxmovl \$0, %ebxint \$0x80 \| Page 235 (Underline).


Page 238 (Underline).

> The ADCinstruction can be used to add two unsigned or signed integer values, along with the value con-tained in the carry flag from a previous ADDinstruction.


### Subtraction

sub source, destination

> where the sourcevalue is subtracted from the destinationvalue, with the result stored in thedestinationoperand location. \| Page 241 (Underline).


Page 244 (Underline).

> The carry flag is used to determine when subtracting unsigned integers produces a negative result.


Page 244 (Underline).

> As with adding signed integers, if you are subtracting signed integers, the carry flag is not useful, as theresult can often be negative. Instead, you must rely on the overflow flag to tell you when you havereached the data size limits.


Page 245 (Underline).

> The SBBinstruction is most often used to "scoop up" the carry flag from a previous SUBinstruction.When the previous SUBinstruction is executed and a carry results, the carry bit is "borrowed" by theSBBinstruction to continue the subtraction on the next data pair.


### Incrementing and decrementing

Page 246 (Underline).

> The INCand DECinstructions are used to increment (INC) and decrement (DEC) an unsigned integervalue.


### Multiplication

mul source, For one thing, the destination location always uses some form of the EAX register,

> The MULinstruction is used to multiply two unsigned integers. Its format is somewhat different fromwhat you would expect. The format for the MULinstruction is \| Page 247 (Underline).


### Division

Page 252 (Underline).

> Similar to multiplication, division requires using a specific instruction depending on whether you areusing unsigned or signed integers.


## Shift Instructions

Page 254 (Underline).

> The biggest problem with integer division is detecting when an error condition has occurred, such aswhen a division by zero happens, or the quotient (or remainder) overflows the destination register.


### Multiply by shifting

Page 255 (Underline).

> To multiply integers by a power of 2, you must shift the value to the left. Two instructions can be used toleft shift integer values, SAL(shift arithmetic left) and SHL(shift logical left). Both of these instructionsperform the same operation, and are interchangeable.


Page 255 (Underline).

> The shift left instructions can be performed on both signed and unsigned integers. The bits emptied bythe shift are filled with zeroes. Any bits that are shifted out of the data size are first placed in the carryflag, and then dropped in the next shift.


### Rotating bits

Page 257 (Underline).

> The SHRinstruction clears the bits emptiedby the shift, which makes it useful only for shifting unsigned integers. The SARinstruction either clearsor sets the bits emptied by the shift, depending on the sign bit of the integer. For negative numbers, thebits are set to 1, but for positive numbers, they are cleared to zero.


Page 257 (Underline).

> As with the left-shift instructions, the right-shift instructions shift bits out of the data element. Any bitsshifted out of the data element (the least significant bits) are first moved to the carry flag, and thenshifted out (lost).


Page 257 (Underline).

> Close relatives to the shift instructions are the rotate instructions. The rotate instructions perform justlike the shift instructions, except the overflow bits are pushed back into the other end of the valueinstead of being dropped.


## Logical Operations

### Boolean logic

and source, destination

> The AND, OR, and XORinstructions use the same format \| Page 262 (Underline).


### Bit testing

Page 263 (Underline).

> The most efficient way to clearout a register is to exclusive ORthe register with itself using the XORinstruction. Each bit that was set to 1when XOR'd with itself becomes 0, and each bit that was set to 0 when XOR'd with itself also becomes 0.This ensures that all of the bits in the register will be set to 0, faster than what it would take to load theimmediate value of 0 using the MOVinstruction.


Page 263 (Underline).

> The TESTinstruction performsa bit-wise logical ANDbetween two 8-, 16-, or 32-bit values, and sets the sign, zero, and parity flagsaccordingly, without modifying the destination value.


Page 263 (Underline).

> The format of the TESTinstruction is the same as for the ANDinstruction. Even though no data is writtento the destination location, you still must specify any immediate values as the source value.


Page 263 (Underline).

> As mentioned, the most common use of the TESTinstruction is to check for flags in the EFLAGSregister.


# Chapter 9: Advanced Math Functions

## The FPU Environment

### The FPU register stack

Page 267 (Underline).

> As mentioned in Chapter 2, the FPU is a self-contained unit that handles floating-point operations usinga set of registers that are set apart from the standard processor registers. The additional FPU registersinclude eight 80-bit data registers, and three 16-bit registers called the control, status,and tagregisters.


### The FPU status, control, and tag registers

Page 268 (Underline).

> Because the FPU is independent of the main processor, it does not normally use the EFLAGSregister toindi-cate results and determine behavior. The FPU contains its own set of registers to perform these functions.The status, control, and tag registers are used to access features and determine the status ofthe FPU.


## Floating-Point Conditional Branches

Page 290 (Underline).

> With floating-point numbers, you do not have the luxury of using the CMPinstruction. Instead, the FPUprovides some instructions of its own to use when comparing floating-point values


## Saving and Restoring the FPU State

### Saving and restoring the FPU environment

Page 296 (Underline).

> Unfortunately, with modern IA-32 processors, the FPU data registers must do double duty. The MMXtechnology utilizes the FPU data registers as MMXdata registers, storing 80-bit packed integer values forcalculations. If you use both FPU and MMX functions in the same program, it is possible that you will"step on" your data registers.


# Chapter 10: Working with Strings

## Moving Strings

Page 304 (Underline).

> One of the most useful functions when dealing with strings is the capability to copy a string fromone memory location to another. If you remember from Chapter 5, "Moving Data," you cannot usethe MOVinstruction to move data from one memory location to another.


### The MOVS instruction

Page 305 (Underline).

> The MOVSinstruction was created to provide a simple way for programmers to move string data fromone memory location to another.


Page 305 (Underline).

> The MOVSinstructions use implied source and destination operands. The implied source operand is theESIregister. It points to the memory location for the source string. The implied destination operand isthe EDIregister. It points to the destination memory location to which the string is copied. The obviousway to remember this is that the Sin ESIstands for source, and the Din EDIstands for destination.


两种保存地址的方式，第一种：
movl \$output, %edi
第二种：
leal output, %edi

> Another method of specifying the memory locations is the LEAinstruction. The LEAinstruction loads theeffective address of an object. Because Linux uses 32-bit values to reference memory locations, the mem-ory address of the object must be stored in a 32-bit destination value. \| Page 305 (Underline).


Page 306 (Underline).

> Each time a MOVSinstruction is executed, when the data is moved, the ESIand EDIregisters are auto-matically changed in preparation for another move.


### The REP prefix

Page 309 (Underline).

> The REPinstruction is special in that it does nothing by itself. It is used to repeat a string instruction aspecific number of times, controlled by the value in the ECXregister, similar to using a loop, but withoutthe extra LOOPinstruction. The REPinstruction repeats the string instruction immediately following ituntil the value in the ECXregister is zero. That is why it is called a prefix.


## Storing and Loading Strings

### The LODS instruction

Page 314 (Underline).

> The LODSinstruction is used to move a string value in memory into the EAXregister.


### The STOS instruction

Page 315 (Underline).

> After the LODSinstruction is used to place a string value in the EAXregister, the STOSinstruction can beused to place it in another memory location.


## Comparing Strings

### The CMPS instruction

Page 317 (Underline).

> The CMPSfamily of instructions is used to compare string values. As with the other string instructions,there are three formats of the CMPSinstruction


Page 318 (Underline).

> Each time the CMPSinstruction is executed, the ESIand EDIregisters are incremented or decremented by the amount of the data size compared, depending on the DFflag setting.


## Scanning Strings

### The SCAS instruction

Page 323 (Underline).

> The SCASfamily of instructions is used to scan strings for one or more search characters. As with theother string instructions, there are three versions of the SCASinstruction


### Finding a string length

Page 326 (Underline).

> One extremely useful function of the SCASinstruction is to determine the string length of zero-terminated(also called null-terminated) strings. These strings are most commonly used in C programs, but are alsoused in assembly language programs by using the .ascizdeclaration. With a zero-terminated string,the obvious thing to search for is the location of the zero, and count how many characters were pro-cessed looking for the zero.


# Chapter 11: Using Functions

## Assembly Functions

### Writing functions

.type func1, @function 
func1:

> To define a function in the GNU assembler, you must declare the name of the function as a label in theprogram. To declare the function name for the assembler, use the .typedirective \| Page 331 (Underline).


Page 331 (Underline).

> Within the function, code can be used just as with the main program code. Registers and memory loca-tions can be accessed, and special features such as the FPU, MMX, and SSE can be utilized.


### Using global data

Page 335 (Underline).

> If you are calling a function that modifies registers the main program uses, it is crucial that you save thecurrent state of the registers before calling the function, and then restore them after the function returns.You can either save specific registers individually using the PUSHinstruction or save all of the registerstogether using the PUSHAinstruction before calling the function. Similarly, you can restore the registersback to their original state either individually using the POPinstruction or together using the POPAinstruction.


## Passing Data Values in C Style

### Passing function parameters on the stack

Page 337 (Underline).

> As you can tell, numerous options are available for handling input and output values in functions. Whilethis might seem like a good thing, in reality it can become a problem. If you are writing functions for alarge project, the documentation required to ensure that each function is used properly can become over-whelming. Trying to keep track of which function uses which registers and global variables, or which reg-isters and global variables are used to pass which parameters, can be a nightmare.To help solve this problem, a standard must be used to consistently place input parameters for functionsto retrieve, and consistently place output values for the main program to retrieve. When creating codefor the IA-32 platform, most C compilers use a standard method for handling input and output valuesinassembly language code compiled from C functions. This method works equally as well for anyassembly language program, even if it wasn't derived from a C program.The C solution for passing input values to functions is to use the stack. The stack is accessible from themain program as well as from any functions used within the program. This creates a clean way to passdata between the main program and the functions in a common location, without having to worry aboutclobbering registers or defining global variables.Likewise, the C style defines a common method for returning values to the main program, using the EAXregister for 32-bit results (such as short integers), the EDX:EAXregister pair for 64-bit integer values, andthe FPUST(0)register for floating-point values.


Page 337 (Underline).

> When the CALLinstruction is executed, it places the return address from the calling program onto thetop of the stack as well, so the function knows where to return.


### Function prologue and epilogue

Page 339 (Underline).

> To avoid this problem, it is common practice to copy the ESPregister value to the EBPregister whenentering the function. This ensures that there is a register that always contains the correct pointer to thetop of the stack when the function is called. Any data pushed onto the stack during the function wouldnot affect the EBPregister value. To avoid corrupting the original EBPregister if it is used in the mainprogram, before the ESPregister value is copied, the EBPregister value is also placed on the stack.


function: 
    pushl %ebp
    movl %esp, %ebp 
    . .
    movl %ebp, %esp 
    popl %ebp 
    ret

> The technique of using the stack to reference input data for the function has created a standard set ofinstructions that are found in all functions written using the C function style technique. This code snippetdemonstrates what instructions are used for the start and end of the function code \| Page 339 (Underline).


### Defining local function data

Page 340 (Underline).

> The ENTERand LEAVEinstructions are specifically designed for setting up function prologues (the ENTERinstruction) and epilogues (the LEAVEinstruction). These can be used instead of creating the prologuesby hand.


ebp 寄存器和 esp 寄存器主要的区别在于当函数内部定义局部变量时，esp 会相应进行更新，而 ebp 则不会更新。参数在 ebp 指针之前的位置，而局部变量则在 ebp 指针之后的位置。

> Once the EBPregister is set to point to the top of the stack, any additional data used in the function canbe placed on the stack after that point without affecting how the input values are accessed. \| Page 340 (Underline).


function:
    pushl %ebp
    movl %ebp, %esp
    subl \$8, %esp 
    . .
其实就是因为函数在定义本地变量时，不会自动更新 esp 的值，所以需要在函数的开始部分手动对 esp 进行更新。

> The function prologue code now must include one additional line to reserve the space for the local vari-ables by moving the stack pointer down. You must remember to reserve enough space for all of the localvariables needed in the function. \| Page 342 (Underline).


### An example

Page 343 (Underline).

> There is just one more detail to consider when using C style function calling. Before the function iscalled, the calling program places all of the required input values onto the stack. When the functionreturns, those values are still on the stack (since the function accessed them without popping them offofthe stack). If the main program uses the stack for other things, most likely it will want to remove theold input values from the stack to get the stack back to where it was before the function call.


pushl %eax 
pushl %ebx 
call compute 
addl \$8, %esp
This ensures that the stack is back to where it should be for the rest of the main program.

> For example, if you place two 4-byte integer values onto the stack and then call a function, you must add8 to the ESPregister to clean the data off of the stack \| Page 343 (Underline).


## Using Separate Function Files

### Creating a separate function file

.section .text
.type area, @function 
.globl area 
area:

> The self-contained function file is similar to the main program files you are used to creating. The onlydifference is that instead of the \_startsection, you must declare the function name as a global label,soother programs can access it. \| Page 348 (Underline).


## Using Command-Line Parameters

### Analyzing the stack

❑ The number of command-line parameters (including the program name) ❑ The name of the program as executed from the shell prompt ❑ Any command-line parameters included on the command line ❑ All the current Linux environment variables at the start of the program

> Linux places four types of information into the program stack when the program starts \| Page 352 (Underline).


### Viewing environment variables

Page 356 (Underline).

> Remember that the program name is considered the first parameter, with the first command-line param-eter being the second parameter, and so on. Acommon beginner's mistake is to check the number ofcommand-line parameters for a zero value. It will never be zero, as the program name must always bepresent on the command line.


# Chapter 12: Using Linux System Calls

## The Linux Kernel

Page 360 (Underline).

> The straceapplication is a great tool to use forwatching system calls in action.


### Parts of the kernel

Page 361 (Underline).

> On Linux systems, the current status of the virtual memory can be determined by viewing the special/proc/meminfofile.


Page 362 (Underline).

> The ipcscommand can be used to view the current shared memory segments on the system


## System Calls

### Finding system calls

If your Linux system has been configured for a programming development environment (which, if you are assembling programs, it most likely is), the system calls are defined in the following file

> /usr/include/asm/unistd.h \| Page 368 (Underline).


### Finding system call definitions

Page 369 (Underline).

> As you will seein the next section, the system call number is crucial to assembly language programmers, as that is howthe assembly program references the system call.


# man 2 exit
The 2 in the command line specifies section 2 of the man pages. The exit option specifies the system call name to get information for.

> To access the system call definitions, use the mancommand from the command prompt \| Page 369 (Underline).


## Using System Calls

### The system call format

Page 372 (Underline).

> As you have already seen in the examples in this book, to initiate a system call, the INTinstruction isused. The Linux system calls are located at interrupt 0x80. When the INTinstruction is performed, alloperations transfer to the system call handler in the kernel.


Page 373 (Underline).

> Unlike C style functions, where the input values are placed on the stack, system calls require that inputvalues be placed in registers. There is a specific order in which each input value is placed in the registers.Placing the wrong input value in a wrong register can produce catastrophic results.


Page 373 (Underline).

> System calls that require more than six input parameters use a different method of passing the parame-ters to the system call. The EBXregister is used to contain a pointer to the memory location of the inputparameters, stored in sequential order. The system call uses the pointer to access the memory location toread the parameters.


Page 375 (Underline).

> The return value from a system call is placed in the EAXregister. It is your job to check the value in theEAXregister, especially for failure conditions.


## Advanced System Call Return Values

### The sysinfo system call

汇编语言里可以实现结构体，只要在数据段一个个排列下去就可以。

> Sometimes system calls return complex data involving C style structures. When using them in assemblylanguage programs, it is sometimes difficult to determine how to handle the returned C structure andconvert it into a data type that can be handled by the assembly language program. \| Page 377 (Underline).


## System Calls versus C Libraries

### The C libraries

Page 387 (Underline).

> The C library functions are documented in section 3 of the man pages.


pushl k
pushl \$output 
call printf 
addl \$8, %esp

> As discussed in Chapter 11, "Using Functions," C style functions use the stack to pass input values. Thisalso holds true for C library functions. All input parameters are placed on the stack in the opposite orderfrom which they are listed in the synopsis for the function. \| Page 387 (Underline).


## Summary

❑ It creates the smallest size code possible because no external libraries need to be linked into the programs.
❑ It creates the fastest possible code, again because no external libraries are linked into the programs. ❑ Linked executable files are independent of any external library code.

> The major reasons to use raw Linux system calls are as follows \| Page 390 (Underline).


❑ The C libraries contain many functions that would require major assembly language code to emulate (such as the ASCII-to-integer or floating-point data type conversions).
❑ The C libraries are portable between operating systems (such as compiling programs on FreeBSD running on the Intel platform as well as Linux systems).
❑ C library functions can utilize shared libraries between programs, reducing memory requirements.

> The major reasons for using C library functions in assembly language programs are as follows \| Page 390 (Underline).


# Chapter 13: Using Inline Assembly

## What Is Inline Assembly?

Page 392 (Underline).

> This chapter describes how to place assembly language functions directlywithin C and C++ language programs. This technique is called inline assembly.


Page 395 (Underline).

> Thetwo C functions were created as separate assembly language functions, set apart from the main programcode. The main program uses the standard C style function format to pass the input parameter to thefunctions (by placing the input value onto the top of the stack). The CALLinstruction is used to invokethe functions from the main program.


## Basic Inline Assembly Code

### The asm format

asm( "assembly code" );

> The GNU C compiler uses the asmkeyword to denote a section of source code that is written in assemblylanguage. The basic format of the asmsection is as follows \| Page 396 (Underline).


Page 397 (Underline).

> The assembly language instruction used in the asmstatement (the NOPinstruction) does not do anythingin the C program, but will appear in the assembly language code generated by the compiler.


### Using global C variables

Page 398 (Underline).

> The basic inline assembly code can utilize global C variables defined in the application. The word toremember here is "global." Only globally defined variables can be used within the basic inline assemblycode. The variables are referenced by the same names used within the C program.


Page 399 (Underline).

> Remember that the data variables must be declared as global. You cannot use local variables within theasmsection.


### Using an alternate keyword

Page 400 (Underline).

> Sometimes optimization is not a good thing with inline assembly functions. It is possible that the compilermay look at the inline code and attempt to optimize it as well, possibly producing undesirable effects.


Page 400 (Underline).

> The volatilemodifier can be placed in the asmstatement to indicate that no optimization is desiredonthat section of code.


Page 400 (Underline).

> The asmkeyword used to identify the inline assembly code section may be altered if necessary. TheANSI C specifications use the asmkeyword for something else, preventing you from using it for yourinline assembly statements. If you are writing code using the ANSI C conventions, you must use the\_\_asm\_\_keyword instead of the normal asmkeyword.


## Using Inline Assembly Code

### Creating inline assembly macro functions

Page 417 (Underline).

> Just as you can with the C macro functions, you can declare macro functions that include inline assemblycode.


# Chapter 14: Calling Assembly Libraries

## Creating Assembly Functions

Page 420 (Underline).

> If you want your assembly language functions to work with C and C++ programs, you mustexplicitly follow the C style function format. This means that all input variables must be readfromthe stack, and that most output values are returned in the EAXregister.


## Compiling the C and Assembly Programs

.section .text
.type func, @function 
func:
    pushl %ebp
    movl %esp, %ebp 
    subl \$12, %esp 
    pushl %edi 
    pushl %esi 
    pushl %ebx
    <function code>
    popl %ebx 
    popl %esi 
    popl %edi
    movl %ebp, %esp 
    popl %ebp
    ret

> As shown in the table, the EBX, EDI, ESI, EBPand ESPregisters must be preserved by the called func-tion. This requires pushing the registers onto the stack before the function code, and popping them offwhen the function is ready to return to the calling program. This is usually done in a standard prologueand epilogue format \| Page 422 (Underline).


Page 422 (Underline).

> Notice the SUBLinstruction included in the prologue. If you remember from Chapter 11, this is used toreserve space on the stack for local variables used within the function. This instruction reserves 12 bytesof memory space on the stack. This can be used to hold three 4-byte data values. If more space is neededfor local variables, you must subtract that from the ESPvalue. The local variables are referenced withinthe function relative to the EBPregister. For example, if the first local variable is used as a 4-byte value,its location would be at -4(%ebp). Asecond variable could be referenced at location -8(%ebp), and thethird at -12(%ebp).


Page 422 (Underline).

> However, assembly language functions called by C programs may also declare their own .dataand.bsssections to store data. These memory areas will be combined with the memory requirements forthe C program at compile time. Apointer can be passed back to the calling program to access any datastored in these memory locations


### The executable file

可以在 C 语言当中以这种方式调用汇编代码，其中 asmfunc 函数是一个其他汇编语言文件当中的汇编函数。前提是需要进行正确的链接。

> printf("This is a test.\n");asmfunc();printf("Now for the second time.\n");asmfunc();printf("This completes the test.\n");return 0; \| Page 425 (Underline).


## Using Assembly Functions in C++ Programs

Page 438 (Underline).

> The rules for using assembly language functions in C++ programs are almost the same as using them inC programs. There is only one difference, but that difference is a major point.By default, C++ programs assume that all functions used in a C++ program use the C++ style naming andcalling conventions. However, the assembly language functions used in the program use the C callingconvention (see the "Creating Assembly Functions" section). You must tell the compiler which functionsused are C functions. This is done with the externstatement.


## Creating Static Libraries

### What is a static library?

Page 439 (Underline).

> Instead of including each separate function object file separately on the command line, the GNU C com-piler enables you to combine all of the object files into a single archive file. When you compile the mainC program, all you need to include is the single object archive file. The compiler can pick the properobject file required out of the archive file at compile time, as shown in Figure 14-5.The archive file can be used to compile any program that uses any of the functions contained within thearchive file. This archive is referred to as a library file.


Page 439 (Underline).

> This type of library file is called static, because the object code contained in the library file is compiledinto the main program from the compiler. Once the function object code is compiled into the executablecode, the library file is not needed for the executable program to run. However, this means that everycopy of the program contains the code for the functions within it.


### Creating a static library file

Page 441 (Underline).

> Before creating the library file, you should decide on a naming convention for the library. Different oper-ating systems use different conventions for identifying library files. The Linux operating system uses theconventionlibx.awhere xis the name of the library. The aextension identifies the file as a static library file.


Page 441 (Underline).

> The arcommand format for creating a new archive and adding new files is fairly straightforward. Thefollowing command creates an archive of the assembly language functions shown thus far in this chapter:\$ ar r libchap14.a square.o cpuidfunc.o areafunc.o greater.o fpmathfunc.o


Page 442 (Underline).

> After the library file is created, it is a good idea to create an index for the library to help speed up thecompilation when other programs must link with the library. The ranlibprogram is used to create theindex for the library. The index is placed inside of the library file.


## Using Shared Libraries

### What are shared libraries?

Page 443 (Underline).

> Using the library to compile the programs does not affect the size of the produced executable file. Youcan see this yourself by comparing the results from using just the single function object file and the staticlibrary file


Page 444 (Underline).

> Shared libraries attempt to solve these problems. Aseparate file that contains the function object codeislocated in a common area on the operating system. When an application needs to access a functionwithin the shared library, the operating system automatically loads the function code into memory, andallows the application to access it.


Page 444 (Underline).

> If another application also needs to use the function code, the operating system allows it to access thesame function code already loaded in memory. Only one copy of the function code is needed in memory,and each of the individual programs that use the function code do not need it loaded into their memoryspace, or in their executable files.


### Compiling with a shared library

Page 445 (Underline).

> Just as with static libraries, Linux has anaming convention that is used for shared libraries:libx.sowhere xis the name of the library, and the .soextension indicates that it is a shared library.


Page 445 (Underline).

> the object code in shared libraries is not compiled into the executable programs.


Page 445 (Underline).

> Even though the shared library files are not compiled into the C program, the compiler must still knowhow to access the functions. The shared libraries are included on the compile command line using the -loption, along with the name of the shared library (minus the libpart and the .soextension). Beforeyou can use the shared library, you must tell the compiler where to look for it, using the -Loption.


### Running programs that use shared libraries

Page 446 (Underline).

> To see what shared libraries an executable file relies on, you can use the lddcommand


这个环境变量包含了默认的动态链接库地址。

> The LD\_LIBRARY\_PATHenvironment variable \| Page 446 (Underline).


Page 446 (Underline).

> The LD\_LIBRARY\_PATHenvironment variable is an easy way for any user on the system to add a pathfor the dynamic loader for the current process. It contains a list of paths (separated by colons) where thedynamic loader should look for library files apart from the ones listed in the ld.so.conffile. You donot need any special privileges to use the LD\_LIBRARY\_PATHenvironment variable; just set it


Page 447 (Underline).

> The ld.so.conffile located in the/etcdirectory keeps a list of the directories in which the dynamicloader will look for libraries.


Page 447 (Underline).

> It is best to create a separate directory for your application libraries, and add it to the ld.so.conffile.Most Linux distributions include a /usr/local/libdirectory in which application shared libraries canbe stored. To avoid having a mess of library files in this directory, you can create a separate subdirectoryin here for your applications, and store the application library files required.


# Chapter 15: Optimizing Routines

## Optimized Compiler Code

### Compiler optimization level 1

Page 453 (Underline).

> The -Ofamily of compiler options provides steps of optimization for the GNU compiler. Each step providesa higher level of optimization. There are currently three steps available for optimizing


Page 453 (Underline).

> -fdefer-pop:This optimization technique is related to how the assembly language code acts whena function is finished. Normally, input values for functions are placed on the stack and accessedby the function. When the function returns, the input values are still on the stack. Normally, theinput values are popped from the stack immediately following the function return.This option permits the compiler to allow input values to accumulate on the stack across func-tion calls. The accumulated input values are then removed all at once with a single instruction(usually by changing the stack pointer to the proper value). For most operations this is perfectlylegal, as input values for new functions are placed on top of the old input values. However, thisdoes make things somewhat messy on the stack.


Page 453 (Underline).

> -fmerge-constants:With this optimization technique, the compiler attempts to merge identicalconstants. This feature can sometimes result in long compile times, as the compiler must analyzeevery constant used in the C or C++ program, comparing them with one another.


Page 453 (Underline).

> -fthread-jumps:This optimization technique relates to how the compiler handles both condi-tional and unconditional branches in the assembly code. In some cases, one jump instructionmay lead to another conditional branch statement. By threading jumps, the compiler determinesthe final destination between multiple jumps and redirects the first jump to the final destination.


Page 453 (Underline).

> -floop-optimize:By optimizing how loops are generated in the assembly language, the com-piler can greatly increase the performance of the application. Often, programs consist of manyloops that are large and complex. By removing variable assignments that do not change valuewithin the loops, the number of instructions performed within the loop can be reduced


### Compiler optimization level 2

Page 454 (Underline).

> -fif-conversion:Next to loops, if-thenstatements are the second most time-consuming part ofan application. Asimple if-thenstatement can generate numerous conditional branches in thefinal assembly language code. By reducing or eliminating conditional branches and replacingthem with conditional moves, setting flags, and performing arithmetic


Page 454 (Underline).

> -fif-conversion2:This technique incorporates more advanced mathematical features that reducethe conditional branching required to implement the if-thenstatements.


Page 454 (Underline).

> -fdelayed-branch:This technique attempts to reorder instructions based on instruction cycletimes. It also attempts to move as many instructions before conditional branches as possible tomaximize the use of the processor instruction cache.


Page 454 (Underline).

> -fguess-branch-probability:As its name suggests, this technique attempts to determine themost likely outcome of conditional branches, and moves instructions accordingly, similar to thedelayed-branch technique. Because the code placement is predicted at compile time, it is quitepossible that compiling the same C or C++ code twice using this option can produce differentassembly language source code, depending on what branches the compiler thought would beused at compile time.Because of this, many programmers prefer not to incorporate this feature, and specificallyinclude the –fno-guess-branch-probabilityoption to turn it off.


Page 454 (Underline).

> -fcprop-registers:As registers are allocated to variables within functions, the compiler performsa second pass to reduce scheduling dependencies (two sections requiring the same register) andeliminate needlessly copying registers.


Page 454 (Underline).

> The second level of code optimization (-O2) incorporates all of the optimization techniques of the firstlevel, plus a lot of additional techniques.


## Creating Optimized Code

### Generating the assembly language code

Page 456 (Underline).

> The highest level of optimization provided by the compiler is accessed using the -O3option. It incorpo-rates all of the optimization techniques listed in levels one and two, along with some very specific addi-tional optimizations. Again, there is no guarantee that this level of optimization will improve performanceof the final code.


## Optimization Tricks

### Common subexpression elimination

Page 478 (Underline).

> One of the more advanced optimization techniques performed by the compiler is the common subexpres-sion elimination (cse). The compiler must scan the entire assembly language code looking for commonexpressions. When commonly used expressions are found, the expression only needs to be calculatedonce; after that, the value can be used in all of the other places where the expression is used.


