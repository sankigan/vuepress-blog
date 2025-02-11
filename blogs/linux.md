---
title: Linux 命令行基础
date: 2021-5-24
editLink: false
tags:
 - 命令行
categories:
 - Linux
---

# Linux基础

## [TODO] 分区

## [TODO] 桥接、NAT

## 注意事项

- Linux 严格区分大小写
- Linux 中所有内容以文件形式保存，包括硬件
- Linux 不靠扩展名区分文件类型
- Linux 所有的存储设备都必须在挂载之后才能使用，包括硬盘，U盘和光盘
- Windows 下的程序不能直接在 Linux 中安装和运行

## 目录处理命令

### ls

- `ls -a` 查看隐藏文件

- `ls -l` 获取详细信息（文件类型和权限、文件计数、文件所有者、文件所属组、文件大小、文件最后修改时间、文件名）

  ```shell
  ls -lh
  drwxr-xr-x 4 root root 4.0K May 14 16:24 xxx
  # drwxr-xr-x
  # 1. 文件类型（ -:二进制文件、d:目录、l:软链接文件）
  # 2. rwx(u)  r-x(g)  r-x(o)
  # u:所有者、g:所属组、o:其他
  # r:读、w:写、x:执行
  ```

- `ls -d` 查看指定目录详细信息（显示当前目录本身的信息）

- `ls -h` 人性化选项

- `ls -i` 查看目录 i 结点

### mkdir

`mkdir -p` 递归创建

### cd

### pwd

### rmdir

<u>注：仅仅只是删除空目录</u>

### cp

- `cp /tmp/sanki.log /root` 把 sanki.log 文件拷贝到 root 下
- `cp -r /tmp/sanki /root` 把 sanki 目录拷贝到 root 下
- `cp -r /tmp/sanki /root/sanki_cp` 把 sanki 目录拷贝到 root 下并更名为 sanki_cp
- `cp -p /tmp/sanki.log /root` 复制并保持文件属性

### mv

- `mv /tmp/sanki /root` 把 sanki 目录剪切到 root 下
- `mv /tmp/sanki /root/sanki_mv` 把 sanki 目录剪切到 root 下并更名为 sanki_mv
- `mv /root/sanki /root/sanki_rename` 把 sanki 更名为 sanki_rename

### rm

`rm -rf` 你懂的~

## 文件处理命令

### touch

<u>注：不建议文件名中使用空格</u>

### cat

- `cat /tmp/sanki.log` 显示文件内容
- `cat -n /tmp/sanki.log` 显示文件内容并显示行号

### tac

`tac /tmp/sanki.log` <u>反向</u>显示文件内容

<u>注：不支持 -n</u>

### more

`more /etc/service` 分页显示文件内容

|   操作    | 含义 |
| :-------: | :--: |
| 空格 或 f | 翻页 |
|   Enter   | 换行 |
|  q 或 Q   | 退出 |

### less

`less /etc/service` 分页显示文件内容

在具备 `more ` 操作的基础上，还支持：

|    操作     |               含义                |
| :---------: | :-------------------------------: |
| pageUp 或 b |             向上翻页              |
|   ↑ 或 ↓    |            向上/下换行            |
| /`keyword`  | 搜索关键词，按 n 寻找下一个关键词 |

### head

`head -n 7 /etc/services` 显示文件前 7 行内容，默认显示前十行。

### tail

- `tail -n 7 /etc/services` 显示文件最后 7 行内容，默认显示最后十行。
- `tail -f /etc/services` 动态显示文件最后十行内容。

## 链接命令

### ln

- `ln -s /etc/issue /tmp/issue.soft` 创建文件 /etc/issue 的软链接 /tmp/issue.soft
- `ln /etc/issue /tmp/issue.hard` 创建文件 /etc/issue 的硬链接 /tmp/issue.hard

软链接特征：类似 Windows 的快捷方式

1. lrwxrwxrwx
2. 文件大小 - 只是符号链接
3. `/tmp/issue.soft -> /etc/issue` 箭头指向源文件

硬链接特征：

1. 拷贝(cp -p) + 同步更新(因为 i 节点相同) `echo 'www.google.com' >> /etc/issue`
2. 通过 i 节点识别
3. 源文件就算丢失，硬链接仍旧可以访问
4. 不能跨分区
5. 不能针对目录使用

## 权限管理命令



## 文件搜索命令

## 帮助命令

## 用户管理命令

## 压缩解压命令

## 网络命令

## 关机重启命令
