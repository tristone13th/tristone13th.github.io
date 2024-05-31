---
categories: Miscellaneous
title: Bridging different keyboard layout
---

Today I found that different operating systems have different keyboard layouts and mappings, it is ugly to switch between different systems. So I think it is necessary to unify them to form a muscle memory and achieve better efficiency. Before the start, I should clarify some concepts:

- **keyboard layout**: the locations of each key. For example, on Mac, **command** is located in both sides of the **space**, but on Windows, the key located in such a way is **Alt**. The difference between the Windows and MacOS keyboard lies in the bottom line：

  | Operating System |  1   |    2    |   3    |    4    |   5   |    6    |   7    |
  | :--------------: | :--: | :-----: | :----: | :-----: | :---: | :-----: | :----: |
  |     Windows      | Ctrl |   Fn    |   #    |   Alt   | Space |   Alt   |  Ctrl  |
  |      MacOS       |  fn  | control | option | command | space | command | option |

  So it is necessary to unify them.

- **key mapping**: in different systems, even the same key has different meanings. The interpretation of a key depends on software. So it is also necessary to achieve a unified semantic interpretation. The good news is, almost all the keys in mac has a corresponding key in windows, see the following table:

  | Operating System | control | function | system | alt/option |
  | :--------------: | :-----: | :------: | :----: | :--------: |
  |     Windows      |  Ctrl   |    Fn    |   #    |    Alt     |
  |      MacOS       | command |    fn    |  None  |   option   |

  Although there isn't any corresponding of the Windows key on Mac, but we can let this key locate in the place of **control** key on Mac.

The good news is, Windows keys and Mac keys located in the same place. They both adopt QWERTY layout and has the same number of keys in each line. the minor difference is that The key on the left side and the right side of the space on Mac is slightly larger than the key on Windows, but it doesn't matter.

Now, let's search a solution to bring these different things together. We should first to think which way we prefer, the Windows way or the MacOS way? I think the MacOS way is better personally because we can use left thumb to press left **command** key and use right thumb to press right **command** key, it is convenient to reach and this design also let us press all the characters with little move.
