---
title: DFS 和 BDS 算法
date: 2025-2-20
editLink: false
tags:
  - 搜索算法
categories:
  - 算法
---

## 深度优先搜索（DFS）

深度优先搜索（DFS）是遍历二叉树的常用方法之一。DFS有三种常见的遍历方式：前序遍历、中序遍历和后序遍历。

### 前序遍历

访问顺序：根节点 -> 左子树 -> 右子树

```js
function preorderTraversal(root) {
  if (!root) return;
  const res = [];

  const dfs = (node) => {
    if (!node) return;

    res.push(node.val); // 访问根节点
    dfs(node.left); // 递归遍历左子树
    dfs(node.right); // 递归遍历右子树
  };

  dfs(node); // 从根节点开始遍历
  return res;
}
```

### 中序遍历

访问顺序：左子树 -> 根节点 -> 右子树

```js
function inorderTraversal(root) {
  if (!root) return [];
  const res = [];

  const dfs = (node) => {
    if (!node) return;

    dfs(node.left);
    res.push(node.val);
    dfs(node.right);
  };

  dfs(root);
  return res;
}
```

### 后序遍历

访问顺序： 左子树 -> 右子树 -> 根节点

```js
function postorderTraversal(root) {
  if (!root) return [];
  const res = [];

  const dfs = (node) => {
    if (!node) return;

    dfs(node.left);
    dfs(node.right);
    res.push(node.val);
  };

  dfs(root);
  return res;
}
```

## 广度优先搜索 (BFS)

广度优先搜索（BFS）是一种逐层遍历二叉树的算法，通常使用队列来实现。它的访问顺序是从根节点开始，逐层向下遍历，每一层从左到右依次访问节点。

```js
function breadthFirstTraversal(root) {
  if (!root) return [];

  const res = [];
  const queue = [root];

  while (queue.length) {
    const node = queue.shift();
    res.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return res;
}
```
