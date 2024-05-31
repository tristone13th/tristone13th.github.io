---
categories: Notes
title: ZLIB & ZSTD
---

# ZLIB

Compression: (Also called as **Deflate**): Data `->` LZ77 `->` Huffman `->` Compressed Data.

Decompression: (Also called as **Inflate**): Compressed Data `->` Huffman `->` LZ77 `->` Data.

Deflate 和 Inflate 的称呼很形象，因为我们是在压缩，所以叫放气，因为是在解压，所以是充气。

### Why combining LZ77 with Huffman coding?

[compression - Why to combine Huffman and lz77? - Stack Overflow](https://stackoverflow.com/questions/55547113/why-to-combine-huffman-and-lz77)

直接原因：The output of LZ77 (lengths, distances, literal symbols, …) is often not uniformly distributed (some occur more frequently, some less). You can use variable-length codes (such as Huffman) to code them more efficiently, gaining better compression.

根本原因：Huffman is letter-oriented which is good at detecting and compressing files using the **letter frequencies** alone, but it cannot detect correlations between consecutive letters (common words and syllables). 举个例子 ABCABCABCABCABC 如果要压缩这个，如果只用 huffman，我们只能得出 A, B, C 这三者拥有同样的概率，从而无法达到压缩的效果。但是 LZ77 可以输出一种类似 ABC5 的东西来表示出现了 5 次，从而大大压缩了数据的长度。

### LZ77

有两个缓冲区：搜索缓冲区（search buffer）和前瞻缓冲区（look-ahead buffer）。共同组成了滑动窗口。

滑动窗口维护用作字典的历史数据。

**数据流动的顺序是**：从前瞻缓冲区流动到搜索缓冲区（以滑动的形式）。

**Coding Position**: The position of the byte in the input stream that is currently being coded (**the beginning of the lookahead buffer**).

**Pointer**：从 coding position 往前数，starting offset 的位置。

**初始化**：刚开始会先把前瞻缓冲区填充满。比如如果我们要处理的数据为（axrrmaxrbaxssr），但是前瞻缓冲区大小为 0，那么刚开始前瞻缓冲区的内容会被初始化为（axrrma），而搜索缓冲区里面的数据为空。

**算法**：在搜索缓冲区中搜索，找到能与**以前瞻缓冲区第一个字符开始的字符串**进行匹配的最长字串的长度，如果这个长度 > 0：停下，然后做下面这些事情：

- 记录 `(D, L)` 二元组，分别表示：
    - D (Distance): 最长匹配在搜索缓冲区的起始位置到前瞻缓冲区起点的距离；
    - L (Length): 最长匹配的长度；
- （**滑动动作**）滑动直到 C 到达了前瞻缓冲区的第一个位置。

否则，

- 输出 C；
- （**滑动动作**）滑动一个位置。

由此看来，One or more pointers `(D, L)` might be included before a C.

Therefore, the protocol considers sequences of bytes to only be a match if the sequences length > 2.

**找最长字串的算法**：使用 Rabin-Karp 算法查找长度为 `MIN_MATCH` 的**可能**的匹配项，然后尝试所有可能的匹配项并选择最长的匹配项。

**结束条件**：当前瞻缓冲区中没有数据时。

Compression example for `AABCBBABC`:

| Step | Position | Match | Byte | Output |
| ---- | -------- | ----- | ---- | ------ |
| 1.   | 1        | \--   | A    | A      |
| 2.   | 2        | A     | \--  | (1,1)  |
| 3.   | 3        | \--   | B    | B      |
| 4.   | 4        | \--   | C    | C      |
| 5.   | 5        | B     | \--  | (2,1)  |
| 6.   | 6        | B     | \--  | (1,1)  |
| 7.   | 7        | A B C | \--  | (5,3)  |

Decompress:

- For each `NULL` pointer, it appends the associated byte directly to the end of the output stream.
- For each non-null pointer, it reads back to the specified offset from the current end of the output stream and appends the specified number of bytes to the end of the output stream.

Example:

| Step | Input Pointer | Append Bytes | Output Stream     |
| ---- | ------------- | ------------ | ----------------- |
| 1.   | A             | A            | A                 |
| 2.   | (1,1)         | A            | A A               |
| 3.   | B             | B            | A A B             |
| 4.   | C             | C            | A A B C           |
| 5.   | (2,1)         | B            | A A B C B         |
| 6.   | (1,1)         | B            | A A B C B B       |
| 7.   | (5,3)         | ABC          | A A B C B B A B C |

[MS-WUSP: LZ77 Compression Algorithm \| Microsoft Learn](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-wusp/fb98aa28-5cd7-407f-8869-a6cef1ff1ccb)

### Rabin-Karp

Pattern 需要有一个长度 m，也就是定长的。

```python
# p is a pattern, its length is m
# t is text, its length is n
# the algorithm searches for pattern p in text t
Compute hash_p (for pattern p)
Compute hash_t (for the first substring of t with m length)
for i = 0 to n - m:
    if hash_p == hash_t:
        Match t[i ... i+m-1] with p, if matched return 1
    else:
        Update hash_t for t[i+1 ... i+m] using rolling hash
End
```

[zlib 1.3 Manual](https://www.zlib.net/manual.html)

# ZSTD

Zstd stands for Zstandard.

zstd is better than zlib in all aspects.