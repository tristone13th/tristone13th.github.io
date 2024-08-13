---
categories: Python
title: 浅析 Python 导入系统
---

有两个正交的维度：导入的方式以及项目运行的方式：

- 导入的方式：表示代码中 import 的方式，分为绝对导入和相对导入；
- 项目运行的方式：表示项目是如何被启动的，分为模块运行（`python -m`）和脚本运行（`python <script>`）。

# 绝对导入

绝对导入是通过 `sys.path` 中的路径来进行搜索并导入的。

绝对导入是形如：

```python
import A.B
from A import B
```

的方式。

# 相对导入

相对导入是形如：

```python
from . import B
from ..A import B
```

.代表当前模块，..代表上层模块，…代表上上层模块，依次类推。

From [PEP 328](http://www.python.org/dev/peps/pep-0328/):

> Relative imports use a module's \_\_name\_\_ attribute to determine that module's position in the package hierarchy. If the module's name does not contain any package information (e.g. it is set to '\_\_main\_\_') then relative imports are resolved as if the module were a top level module, regardless of where the module is actually located on the file system.

举个例子：`importee.py` 被 `importer.py` 以相对模式导入，那么如果 `importer.py` 恰好也是被另外一个 module 导入的，其 `__name__` 为 `package1.pakcage2.module_name`，那么其可以通过 `..` 来相对导入位于 `package1` 下的 `importee.py`，但是由于其只保留了两层信息，所以 `…` 将导致失败。

# FAQ

> 什么是以 module 的方式运行？

```bash
python -m <project>.<dir>...<dir>.<module>
```

使用这种模式，项目中模块可以通过项目的绝对路径进行导入（`import <project>.<dir>…<dir>.<another_module>`），也可以通过相对模式进行导入。这种方式相对于以 script 模式运行，主要影响 `sys.path` 属性，它会把当前目录（通常是包含项目目录的目录，而非所执行 script 所在的目录）加入到 sys.path 的第一个位置。

以 module 方式运行对于绝对导入和相对导入都有好处：

- 对于绝对导入：加入到 `sys.path` 中的路径是固定的，也就保证了所有模块都以绝对路径方式导入即可。如果是以 script 的方式运行，那么加入到 `sys.path` 中的路径取决于要执行脚本的路径，因此项目中的其他模块之间要进行绝对导入时，“根”目录也就是不确定的，这会造成兼容性问题。
- 对于相对导入：相对导入依赖于**模块层级**（`__name__ `） 而非**文件系统层级**进行判断。如果以 script 模式执行的 `main.py` 所导入的模块 `importee.py` 又**相对导入**了与 `main.py` 同级或上级的 module，那么会失败，因为 `importee.py` 的 `__name__` 中并不包含项目目录信息。但是通过 module 方式来运行的话，就不会存在此问题，因为 Python 解析器知道并记录所跑的脚本在整个项目层级中的位置，尽管 `main.py` 的 `__name__` 为 `__main__` 并不包含此信息。

> 为什么有时以 script 模式执行 main.py，其所引用到模块之间如果以绝对路径导入的话，也能成功运行？

绝对导入依赖 `sys.path`，script 模式会把当前 script 目录加入到 `sys.path` 当中，而如果模块之间绝对导入的方式正好以此目录为 `root`，那么以绝对路径导入可以被 Python 解释器识别。

如果代码中有相对导入，那么无论如何情况以 script 模式执行都无法成功。

> 那么 \_\_init\_\_.py 的作用是什么？

Help useful modules/functions bubble up from deep within a project hierarchy to the top level, so users or other modules can call them with a simpler `from folder import add` rather than the deeper `from folder.utils import add`.[^1]

`__init__.py` 最大的作用就是把一个 namespace package 转化成了 regular package，但是不论是相对导入还是绝对导入，只要是 package 他们都支持。所以如果并不需要 `bubble up from deep within a project hierarchy`，那么就是没有必要写 `__init__.py` 的。

无论是一个 namespace package 还是 regular package，都可以通过 `import <package_name>` 的方式来导入。

> \_\_name\_\_ 是如何被设置的？

不论通过 module 执行还是通过 script 执行，所执行的那个脚本的 `__name__` 都是 `__main__`，这个是不会变的。

# 一个小实验

```bash
(base) tristone@tristone13th:~/projects/workaround$ tree
.
├── test.c
└── workaround
    ├── importee2.py
    └── sub
        ├── importee.py
        ├── sub2
        │   └── importee3.py
        └── test.py

3 directories, 5 files
(base) tristone@tristone13th:~/projects/workaround$ cat workaround/sub/test.py
print("test.py: ", __name__)
from .sub2 import importee3
from . import importee
(base) tristone@tristone13th:~/projects/workaround$ cat workaround//sub/sub2/importee3.py
print("importee3.py: ", __name__)
(base) tristone@tristone13th:~/projects/workaround$ cat workaround/sub/importee.py
print("importee.py: ", __name__)
from .. import importee2
(base) tristone@tristone13th:~/projects/workaround$ cat workaround/importee2.py
print("importee2.py: ", __name__)
(base) tristone@tristone13th:~/projects/workaround$ python -m workaround.sub.test
test.py:  __main__
importee3.py:  workaround.sub.sub2.importee3
importee.py:  workaround.sub.importee
importee2.py:  workaround.importee2
(base) tristone@tristone13th:~/projects/workaround$ python workaround/sub/test.py
test.py:  __main__
Traceback (most recent call last):
  File "/home/tristone/projects/workaround/workaround/sub/test.py", line 2, in <module>
    from .sub2 import importee3
ImportError: attempted relative import with no known parent package
(base) tristone@tristone13th:~/projects/workaround$ cd workaround/
(base) tristone@tristone13th:~/projects/workaround/workaround$ python sub/test.py
test.py:  __main__
Traceback (most recent call last):
  File "/home/tristone/projects/workaround/workaround/sub/test.py", line 2, in <module>
    from .sub2 import importee3
ImportError: attempted relative import with no known parent package
(base) tristone@tristone13th:~/projects/workaround/workaround$ cd sub/
(base) tristone@tristone13th:~/projects/workaround/workaround/sub$ python test.py
test.py:  __main__
Traceback (most recent call last):
  File "/home/tristone/projects/workaround/workaround/sub/test.py", line 2, in <module>
    from .sub2 import importee3
ImportError: attempted relative import with no known parent package
(base) tristone@tristone13th:~/projects/workaround/workaround/sub$
```

可见相对导入是绝对不能适用于直接用脚本执行的，因为即使这种情况添加了正确的 sys.path，因为相对导入不依赖于 sys.path 而是 \_\_name\_\_，仍然不能正确导入，如以下代码所示：

```bash
(base) tristone@tristone13th:~/projects/workaround/workaround/sub$ python test.py
['/home/tristone/projects/workaround/workaround/sub', '/home/tristone/miniconda3/lib/python39.zip', '/home/tristone/miniconda3/lib/python3.9', '/home/tristone/miniconda3/lib/python3.9/lib-dynload', '/home/tristone/miniconda3/lib/python3.9/site-packages']
test.py:  __main__
Traceback (most recent call last):
  File "/home/tristone/projects/workaround/workaround/sub/test.py", line 4, in <module>
    from .sub2 import importee3
ImportError: attempted relative import with no known parent package
```

# 总结

- 绝对导入依赖于 `sys.path`，相对导入依赖 `__name__`；
- 以 module 方式执行会将**项目目录**放在 `sys.path` 当中，而以 script 方式执行会将 **script 目录**放在 `sys.path` 当中。
- `__init__.py` 与能否相对导入或者绝对导入没有关系，其影响的是命名空间，也就是 API 的易用性。

# 引申

> Python 项目结构如何设计较为合理？

project.project 这种形式，源代码放在第二个 project 里面。详情参考 [Python 项目结构](https://stackoverflow.com/a/3419951/11065161)，这也是为了导入以及包安装方便。

# Reference

[^1]: [Taming the Python Import System. Do it wrong so you can do it right](https://towardsdatascience.com/taming-the-python-import-system-fbee2bf0a1e4)

