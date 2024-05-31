---
categories: Miscellaneous
title: Troubleshooting
---

> 空调不制热怎么办？

可能是防尘网灰太多了，可以拆下来洗一洗。

> git clone 速度太慢怎么办？

试着设置 --depth=1 来保证不会克隆历史下来。也可以设置 git 的代理。如果操作系统上没有代理软件，可以找到局域网主机上的代理软件，并打开局域网代理，同时 git 的代理 ip 以及端口号填局域网主机的 ip 以及代理端口号就可以了。

>chsh -s /usr/bin/fish 不起作用怎没办？

要在 bash 里执行这一条命令，而不是在 fish 里。

