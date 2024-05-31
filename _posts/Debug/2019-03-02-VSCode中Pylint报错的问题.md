---
categories: Debug
title: VSCode中Pylint报错的问题
---

VSCode中Python扩展的默认代码审查工具是Pylint，由于其推断系统是静态的，而有些调用需要动态生成，因此其有时会触发报错。

在settings.json中加入以下一行以防止报错：

```json
 "python.linting.pylintArgs": [
     "--generate-members"
 ]
```

`--generate-members`参数的官方解释如下：

>List of members which are set dynamically and missed by pylint inference system, and so shouldn't trigger E1101 when accessed. Python regular expressions are accepted. 

