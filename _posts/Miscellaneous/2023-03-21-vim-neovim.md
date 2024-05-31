---
categories: Miscellaneous
title: Vim / Neovim
---

### doautocmd

可以自己创建一个新的 event，放在任意的位置。

### concealing

Vim 的这个机制允许更好看的展示。


# Buffer

In fact, any buffer has two **independent** flags: **loaded** and **listed**. "Loaded and nolisted" is a typical value for special buffers such as "help", so they are visible but not normally shown by `:ls`;

### unloaded buffer

A buffer is loaded if the corresponding file is loaded into memory.

### unlisted buffer

`set buftype?` outputs **empty**.

Use `ls!` to see all **unlisted buffers**.

Unlisted buffers won't trigger `BufEnter`.

[autocompletion - What is the difference between loaded and unloaded buffers? - Vi and Vim Stack Exchange](https://vi.stackexchange.com/questions/21498/what-is-the-difference-between-loaded-and-unloaded-buffers)

`lua vim.api.nvim_create_buf(false, true)` (listed, scratch)

# Neovim

## Useful APIs of Neovim

### Return a vimscript function call's result to lua

```
vim.fn.eval()
```

### Get current buffer

```lua
vim.fn.bufnr()
```

### Get current file name

```lua
lua print(vim.fn.expand("%:p"))
```

```
:help expand
:echo expand("%:p")    " absolute path
:echo expand("%:p:h")  " absolute path dirname
:echo expand("%:p:h:h")" absolute path dirname dirname
:echo expand("%:.")    " relative path
:echo expand("%:.:h")  " relative path dirname
:echo expand("%:.:h:h")" relative path dirname dirname

:echo expand("<sfile>:p")  " absolute path to [this] vimscript

:help filename-modifiers
```

[How can I expand the full path of the current file to pass to a command in Vim? - Stack Overflow](https://stackoverflow.com/questions/2233905/how-can-i-expand-the-full-path-of-the-current-file-to-pass-to-a-command-in-vim)

### Get current cursor position

```lua
local r,c = unpack(vim.api.nvim_win_get_cursor(0))
lua print(unpack(vim.api.nvim_win_get_cursor(0)))
```

### Get current mode

```
vim.api.nvim_get_mode()
```

### Get register content

```lua
vim.fn.getreg()
```

### Send key stroke

```lua
vim.api.nvim_command([[ 
	call feedkeys("m")
]])
```

### Get a buffer's filetype

```lua
vim.bo[bufnr].filetype
```

### Get a buffer's path/name

```lua
vim.api.nvim_buf_get_name(buffer)
```

### Change to a new buffer

won't trigger BufEnter

```
vim.api.nvim_win_set_buf
```

## Neovim Plugins

### Iron.nvim

```
Mappings                                                        *iron-mappings*

Iron by default doesn't map the keybindings, only those supplied in the
core.setup function.

- send_motion: Sends a motion to the repl
- visual_send: Sends the visual selection to the repl
- send_file: Sends the whole file to the repl
- send_line: Sends the line below the cursor to the repl
- send_mark: Sends the text within the mark
- mark_motion: Marks the text object
- mark_visual: Marks the visual selection
- remove_mark: Removes the set mark
- cr: Sends a return to the repl
- interrupt: Sends a `<C-c>` signal to the repl
- exit: Exits the repl
- clear: Clears the repl window
```