---
categories: 版本控制
title: What does "applying a change" mean when doing cherry-pick?
published: true
---

TLDR: A cherry-pick is a merge, the new commit is created using merge logic, using the **parent of the cherry-picked commit** as the merge base.

Following the merge logic, when cherry-picking a commit, git will do...

1. Use the **parent** of the cherry-picked commit `c` as the merge base;
2. Generate two diff:
    1. from `c^` (the merge base) to `c`;
    2. from `c^` to the branch `B` you want to cherry-pick into;
3. Applying these two diffs onto the `c^` generates a temporary revision, then generate a new commit based on the diff between branch `B` and this revision.


### How to explain the conflicts markers after cherry-picking?




```c

```


### When doing `git cherrypick`, what does the "applying a change" mean?

For an example, if we has a branch `B` and we want to cherry-pick another commit `c` onto this branch, what will git do to achieve this? Lei's do some experiments.

Firstly, setup an empty git repo `test` , then we add a file `test.txt`. Add following text in the `test.txt`:

then do an initial commit with message `test`.

When the commit is done, we can see that we have a default branch `master` by `git branch -a`.

Let's start experimenting. 

- First question: **if the commit we want to cherry-pick has a newly added file related to current revision, what will happen?** I suppose it will just add the file. Talk is cheap, show me the code.

  EXP 1: Add to nah

  1. First add a new file `add.txt`, then add and commit with message `add`. `master` branch will go to this commit automatically;
  2. Go one step back by `git checkout HEAD^`, git will enter to the `detached HEAD state` which means HEAD is not on any branch;
  3. Then remove `test.txt` by `rm test.txt`, add and commit with message `remove`. Now we have two branch, although the second so called branch doesn't have a name for we are in the `detached HEAD state`;
  4. Let's assign the second branch a name, `git branch remove_branch HEAD`, then check it out (git will do nothing because the `remove_branch` is pointing to the HEAD);
  5. `git reflog`, then find the HASH of the commit `add`, `git cherry-pick -n <add>`, where `add` is the commit HASH of  `add`;
  6. `ls`, you can find the `add.txt` is added, **which means when doing cherry-picking, git will introduce the added files of the cherry into current revision;**
  7. Clear the workspace by discarding the staged change: `git reset --hard`;

- Then: **if the commit we want to cherry-pick has a file removed related to current revision, what will happen?** I suppose it depends. If the file removed by others not changed by us, git will remove the file. Talk is cheap, show me the code.

  Following the experiment [EXP 1], we can continue our experiment:

  EXP 2: Remove to nah

  1. Checkout to branch `master`: `git checkout master`;
  2. `git reflog`, then find the HASH of the commit `remove`, `git cherry-pick -n <remove>`, where `remove` is the commit HASH of  `remove`;
  3. `ls`, you can find the `test.txt` is deleted, `add.txt` is still there, **which means when doing cherry-picking, git will delete the files deleted by the cherry in current revision;**
  4. Clear the workspace by discarding the staged change: `git reset --hard`;

  If the file removed by others changed by us, git will report a merge conflict. Following the experiment [EXP 2], we can continue our experiment:

  EXP 3: Remove to changed

  1. Change file `text.txt` by `echo "hello workd" > test.txt`;
  2. Add and commit it with message `change` 
  3. `git reflog`, then find the HASH of the commit `remove`, `git cherry-pick -n <remove>`, where `remove` is the commit HASH of  `remove`;
  4. Wow, conflict! **which means when doing cherry-picking, git will report a conflict when others try to delete the files changed in current revision;**
  5. Clear the workspace by discarding the staged change: `git reset --hard`;

- Then: **if the commit we want to cherry-pick has a file changed related to current revision, what will happen?** I think it depends. It is no doubt that if there is no merge conflict, then the changes will be merged. If there has some conflicts, then it will prompt to you to resolve them. It should be noted that merge conflicts occur when the same section in the same file is changed rather than just the same file, for more please refer to https://stackoverflow.com/a/32765354/18644471.

- Final question: if some files are added by the current branch, and the cherry-picked-commit haven't touched these files, what will happen? From the step 3 of the experiment (EXP 2), we can see that it won't touch these files.

From the above experiments especially the step 3 of the experiment (EXP 2), a question arise: In commit `remove` there has no file, why when cherry-picking it into the branch `master`, the file `test.txt` is deleted but the file `add.txt` is removed?

The reason for this is that git uses a **3-way merge mechanism**. In short, you can imagine that git will tag each file with a version number and increase it when each time doing commit, some corner cases:

1. If a file is deleted, it will also have a version and the version will increase when doing the commit to delete it;
2. If a file doesn't exist in history, such as `5J7MnlhuF1RMYjd7S87lLqwGmb0oM74jI.txt`, you can imagine that its version is -1;
3. If a file is newly added and committed, you can imagine its version is 0.

Specifically, git will find the *base version* (the common ancestor) of each file when doing cherry-picking, the base's version is less or equal than the ours and theirs version. Git follows following principles when doing merging:

1. If ours or theirs version equals to the base version, accept the one with the higher version;
2. If both ours and theirs version are not equal to the base version, try to do a merge.

Just these two conditions, no more.

The we can explain the result we have obtained during the experiments:

1. Why in the 6 step of experiment (EXP 1), Git will introduce the newly added file? That's because a newly added file has a higher version number than the "non-existence file" both in base and `remove_branch`, which falls into the principle 1, so Git decide to accept others;
2. Why in the 3 step of experiment (EXP 2), Git will delete the files deleted by others? That's because a file is deleted, then its version is increased, but in base and `master` branch, they both have the same version number which is less that `remove`, which still falls into the principle 1, so Git decide to accept others and delete it;
3. Also why in the 3 step of experiment (EXP 2), Git **won't** delete the file `add.txt` which doesn't exist in `remove`? That's because `add.txt` is added by us, so we have the highest version number than base and `remove`, which still falls into the principle 1, so Git decide to accept ours and preserve it;
4. Why in the 4 step of experiment (EXP 3), Git will report a merge conflict? That's because `test.txt` is modified by us, and deleted by `remove`, we both have a higher version than base, which falls into the principle 2, Git will try to do a merge. Soon it realize that the merge cannot be decided by itself, so it will prompt to us to ask for a conflict resolving.

**So when doing cherry-pick or other Git operations, always remember the virtual versioning mechanism, it will help you unravel the puzzle.** ^_^

Some reference you may be interested in:

- [Principle of GIT merge \| Develop Paper](https://developpaper.com/principle-of-git-merge-recursive-three-way-merge-algorithm/)

