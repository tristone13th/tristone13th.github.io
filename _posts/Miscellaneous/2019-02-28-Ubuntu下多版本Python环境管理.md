---
categories: Miscellaneous
title: Ubuntu下多版本Python环境管理
---

# virtualenvwrapper库的安装与配置

## 查看当前环境

Python的执行文件位于`/usr/bin/`目录下，可以进入该目录查看当前安装的Python版本有哪些：

```bash
cd /usr/bin/
ls | grep python
```
通过命令行查看当前使用的Python版本

```bash
python --version
```

## 安装virtualenvwrapper

```bash
sudo pip install virtualenvwrapper
```

## 对virtualenvwrapper进行配置

在Linux中，`$HOME`代表`root`，我们首先在`root`下建立一个隐藏文件夹`.virtualenvs`。

```bash
mkdir $HOME/.virtualenvs
```

在Linux中，`~`代表文件夹`HOME`下的当前用户目录，我们编辑该文件夹下的`.bashrc`文件，该文件是用户的个性化配置文件。

```bash
sudo gedit ~/.bashrc

#在打开的.bashrc文件中添加如下行：
export WORKON_HOME=$HOME/.virtualenvs
source /usr/local/bin/virtualenvwrapper.sh

#更新配置文件
source ~/.bashrc
```

这样，virtualenvwrapper的配置就基本完成了。

# virtualenvwrapper库的使用

## 创建虚拟环境

根据当前系统中所安装的Python版本创建其虚拟环境，我的Ubuntu中含有Python 2.7和Python 3.6两个版本，则根据这两个版本进行虚拟环境的创建。

```bash
mkvirtualenv -p /usr/bin/python2.7 python27_env
mkvirtualenv -p /usr/bin/python3.6 python36_env
```

## 虚拟环境切换

```bash
#使用python2.7
workon python27_env

#退出python2.7
deactivate

#使用python3.6
workon python36_env

#退出python3.6
deactivate
```

## 删除虚拟环境

```bash
rmvirtualenv python27_env
```