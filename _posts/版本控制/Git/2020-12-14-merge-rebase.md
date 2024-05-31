---
categories: Git
title: Merge vs. Rebase
---

`rebase` 命令和 `merge` 命令的优缺点如下：

> The first thing to understand about `git rebase` is that it solves the same problem as `git merge`. Both of these commands are designed to integrate changes from one branch into another branch—they just do it in very different ways.
>
> Merging is nice because it’s a *non-destructive* operation. The existing branches are not changed in any way. On the other hand, this also means that the `feature` branch will have an extraneous merge commit every time you need to incorporate upstream changes. If `master` is very active, this can pollute your feature branch’s history quite a bit.
>
> The major benefit of rebasing is that you get a much cleaner project history. First, it eliminates the unnecessary merge commits required by `git merge`.
>
> The golden rule of `git rebase` is to never use it on *public* branches.

使用 `rebase` 和 `merge` 的基本原则是：

1. 下游分支（feature）要更新上游分支（master）内容的时候使用 `rebase`
2. 上游分支（master）合并下游分支（feather）内容的时候使用 `merge`
3. 更新当前分支的内容时一定要使用 `--rebase` 参数

**下游分支（feature）要更新上游分支（master）内容的时候使用 `rebase`**。

举个例子：现有上游分支 master，基于 master 分支拉出来一个分支 feature，在 feature 上开发了一段时间后要把 master 分支提交的新内容更新到 feature 分支，此时切换到 feature 分支，使用 git rebase master。

举个例子：现有上游分支 master，基于 master 分支拉出来一个分支 feature，在 feature 上开发了一段时间后要把 master 分支提交的新内容更新到 feature 分支，此时切换到 feature 分支，使用 `git rebase master`。

为什么不使用 merge？因为如上面所说，如果 master 分支更新很频繁，多次将 master 合并过来会污染 feature 分支的历史。使用 rebase 可以保证 feature 分支是干净的。

**上游分支（master）合并下游分支（feather）内容的时候使用 `merge`**。

举个例子：当 feature 分支开发完成，要合并到上游分支 master 的时候，切换到 master 分支，使用 `git merge dev`。

为什么不使用 rebase？因为 master 分支是公共的，在公共分支上 rebase 会造成混乱。如果要把一个 feature 合并过来，我们并不在乎这个 feature 的开发历史，而是只把它当作一个一次性的提交，merge 过来可以保证只有一次的提交，同时也保证了 master 分支的简洁不冗余。

**更新当前分支的内容时一定要使用 `--rebase` 参数**

更新代码使用 `git pull origin B1 --rebase` 而不是 `git pull origin B1`。`git pull` 这条命令默认使用了 `--merge` 的方式更新代码，如果你不指定用 `--rebase`，考虑这样一种情况：A 和 B 同时在master上开发，A 提交了一个 commit 1，push 了上去；B 提交了一个 commit 2，push 时发现 master 更新了，拉下来之后会发现 commit 1 和 commit 2 merge 出了一个新的 commit。master 分支会出现分叉，很难看且没必要，污染项目历史。采用 --rebase 更新当前分支能够保证提交记录的简洁性。

# 参考文献

- [Merging vs. Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
- [GIT使用rebase和merge的正确姿势 - 知乎](https://zhuanlan.zhihu.com/p/34197548)
- [git pull --rebase的正确使用](https://juejin.cn/post/6844903895160881166)