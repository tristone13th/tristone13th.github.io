---
categories: QEMU
title: JSONWriter in QEMU
---

```c
struct JSONWriter {
    bool pretty;
    bool need_comma;
    GString *contents;
    // GByteArray 是 glibc 的一个 structure，表示一个 byte list
    GByteArray *container_is_array;
};
```

首先要明白 JSON 的基本结构：

- Key 都是字符串
- Value 可以是字符串，数字，`{} object` 或者 `[] object`。

### `maybe_comma_name()` QEMU

给你一个名字：

- 想要将其作为 key，或者
- 单纯就想给 array 里的上一个 entry 补一个逗号。

判断要怎么插入到当前的 JSON stream 中去：

- 要不要给上一个 key value pair / array entry 补上逗号？
- 如果在 `{}` 里，也就是想要作为 key，那么需要加引号与冒号。

```c
static void maybe_comma_name(JSONWriter *writer, const char *name)
{
    // need_comma 初始化的时候是 False
    if (writer->need_comma) {
        g_string_append_c(writer->contents, ',');
        pretty_newline_or_space(writer);
    } else {
        // 如果我们的 writer 已经有内容了
        // 就换行缩进格式化一下，一般来说不用格式化，所以我们可以忽略这个 block
        if (writer->contents->len) {
            pretty_newline(writer);
        }
        // 这次加了一个 key value pair，所以下一次要加逗号了。
        writer->need_comma = true;
    }

    // 如果我们在 {} 里面而非 []
    if (in_object(writer)) {
        // 加上引号：name 变 "name"
        quoted_str(writer, name);
        // 加冒号表示这是一个 key
        g_string_append(writer->contents, ": ");
    }
}
```

### `in_object()` QEMU

当一下两个条件同时满足时返回 true：

- 第一个条件可以忽略，基本上是必然会满足的，
- 当前所在的这一层 object 是一个 `{}` 而不是 `[]`。

白话来说，就是表示现在是否在 `{}` 里面而非 `[]`。

```c
static bool in_object(JSONWriter *writer)
{
    unsigned depth = writer->container_is_array->len;
    return depth && !writer->container_is_array->data[depth - 1];
}
```

### `enter_container()` / `leave_container()` QEMU

所谓 container 指的是 `[]` 或者 `{}`。

```c
// is_array 表示我们要 enter 的是 [] 还是 {}
static void enter_container(JSONWriter *writer, bool is_array)
{
    // container_is_array 是一个 GByteArray 类型的，包含两个 fields：data 和 len
    // 分别表示起始地址和长度
    // len 表示 depth
    unsigned depth = writer->container_is_array->len;
    // depth 加 1，因为我们进入了 container
    g_byte_array_set_size(writer->container_is_array, depth + 1);
    // 因为 GByteArray 是一个 byte list，每一个 byte 正好就是一个 bool，
    // 所以每一个 entry 表示的就是这个 depth 的元素是一个 array 还是 object
    writer->container_is_array->data[depth] = is_array;
    // 因为我们是 enter container，所以不需要逗号。
    writer->need_comma = false;
}

// 可以用上面的注释解释
static void leave_container(JSONWriter *writer, bool is_array)
{
    unsigned depth = writer->container_is_array->len;

    assert(depth);
    // 保证 } 和 { 匹配，] 和 [ 匹配
    assert(writer->container_is_array->data[depth - 1] == is_array);
    g_byte_array_set_size(writer->container_is_array, depth - 1);
    writer->need_comma = true;
}
```

### `json_writer_start_object()` / `json_writer_end_object()` QEMU

以 name 为 key，开启一个新的 `{}` 作为 value。

```c
void json_writer_start_object(JSONWriter *writer, const char *name)
{
    maybe_comma_name(writer, name);
    g_string_append_c(writer->contents, '{');
    enter_container(writer, false);
}

void json_writer_end_object(JSONWriter *writer)
{
    leave_container(writer, false);
    pretty_newline(writer);
    g_string_append_c(writer->contents, '}');
}
```

### `json_writer_start_array()` / `json_writer_end_array()` QEMU

以 name 为 key，开启一个新的 `[]` 作为 value。

```c
void json_writer_start_array(JSONWriter *writer, const char *name)
{
    maybe_comma_name(writer, name);
    g_string_append_c(writer->contents, '[');
    enter_container(writer, true);
}

void json_writer_end_array(JSONWriter *writer)
{
    leave_container(writer, true);
    pretty_newline(writer);
    g_string_append_c(writer->contents, ']');
}
```

### `json_writer_get()` QEMU

很简单，就是把当前 content 的 string 内容拿出来。

### `json_writer_bool()` / `json_writer_null()` / `json_writer_int64()` / `json_writer_uint64()` / `json_writer_double()` / `json_writer_str()` QEMU

都大同小异，都是把传进来的 name 作为 key，然后 value 写不同类型的值，不作赘述。
