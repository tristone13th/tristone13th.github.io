---
categories: Python
title: How to create a python package
---

# 概念（Conceptions）

## 模块（Module）

在Python中，一个模块可以视为**一个**含有一个或者很多个类的**文件**。

## 包（Package）

包是一个更大的概念，是在同一目录下功能上相近的一组模块（Module）或者类（Class）。

# 简单地创建一个包

- 创建一个目录并且将包名称赋予它（Create a directory and give it your package's name）；
- 把你的类放进去；
- 创建一个\_\_init\_\_.py文件。

有了这个文件后，Python将会明白这个目录是一个Python的包目录。无论如何，我们应当写一些导入语句来导入这些类或者模块。

## 在Pycharm中导入自定义包

右击创建好的目录，选择Mark Directory as, 点击source roots即可。