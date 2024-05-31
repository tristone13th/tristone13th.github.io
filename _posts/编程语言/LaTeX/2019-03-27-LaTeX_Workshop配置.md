---
categories: LaTeX
title: LaTeX Workshop配置
---

# LaTeX Workshop

LaTex Workshop是一个VSCode上的插件，用来支持LaTex相关操作，其配置JSON文件如下：

```json
{
    "latex-workshop.latex.autoClean.run": "never",
    "latex-workshop.view.pdf.viewer": "tab",
    "latex-workshop.latex.tools": [
        {
            "name": "xelatex",
            "command": "xelatex",
            "args": [
                "-synctex=1",
                "-interaction=nonstopmode",
                "-file-line-error",
                "%DOC%"
            ]
        },
        {
            "name": "bibtex",
            "command": "bibtex",
            "args": [
                "%DOCFILE%"
            ]
        },
    ],

    "latex-workshop.latex.recipes": [
        {
            "name":  "xelatex ➞ bibtex ➞ xelatex`×2",
            "tools": [
                "xelatex",
                "bibtex",
                "xelatex",
                "xelatex"
            ]
        },
    ],
    "latex-workshop.synctex.afterBuild.enabled": true,
}
```

# 自动清理

中间文件可能需要自动清理，这便可以通过以下代码进行配置：

```json
{"latex-workshop.latex.autoClean.run": "never"}
```

其值有三种，分别为：

- `never`：表示从不清理
- `onFailed`：当编译失败时清理
- ``onBuilt`：当编译后（无论成功或者失败）都进行清理。

一般将其设置为`never`，因为我们有时会用到bibtex与.aux文件来进行参考文献的编译。

# 预览

可以通过如下代码设置编译生成的PDF自动预览：

```json
{"latex-workshop.view.pdf.viewer": "tab"}
```

其值有四种，分别为：

- `browser`：在浏览器中打开。
- `external`：在外部编辑器中打开。
- `none`：不打开。
- `tab`：在右侧打开。

# 编译工具

```json
{
    "latex-workshop.latex.tools": [
        {
            "name": "xelatex",
            "command": "xelatex",
            "args": [
                "-synctex=1",
                "-interaction=nonstopmode",
                "-file-line-error",
                "%DOC%"
            ]
        },
        {
            "name": "bibtex",
            "command": "bibtex",
            "args": [
                "%DOCFILE%"
            ]
        },
    ],
}
```

其中：

- `name`：工具名称，在后面`recipes`中会进行引用。
- `command`：命令，该工具执行的命令。
- `args`：执行命令带的参数。

这里设置了两个编译工具，一个是`xelatex`用来编译.tex文件，另一个是`bibtex`用来编译参考文献文件.bib。

# 编译菜单

```json
{
    "latex-workshop.latex.recipes": [
        {
            "name":  "xelatex ➞ bibtex ➞ xelatex`×2",
            "tools": [
                "xelatex",
                "bibtex",
                "xelatex",
                "xelatex"
            ]
        },
    ],
}
```

这个菜单决定了编译的顺序。这样设置的原因是首先编译源文件，然后编译参考文献文件，第三次编译源文件构成新的参考文献，最后一次编译源文件来保证编号的正确性。

# 预览同步

```json
{
    "latex-workshop.synctex.afterBuild.enabled": true,
}
```

允许在编译后预览的PDF文件定向到tex文件中上次更改的位置。

## 前向同步

使用`Ctrl`+`Alt`+`J`来实行前向同步，即在当前光标处按下该组合键后，预览侧将会定位到当前光标所在的位置。

## 后向同步

使用`Ctrl`+`Left Click`来进行后向同步，在PDF中点击该组合键后，左端编辑窗口将自动定位到鼠标左键所点击的位置。