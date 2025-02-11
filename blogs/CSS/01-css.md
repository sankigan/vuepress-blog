---
title: CSS 入门
date: 2019-9-9
editLink: false
tags:
 - CSS
categories:
 - 前端
---

## 1、BFC

详见[文章](/blogs/css/bfc.md)

## 2、三栏布局

详见[文章](/blogs/css/three-column-layout.md)

## 3、水平居中

详见[文章](/blogs/css/horizontal-centering.md)

## 4、垂直居中

详见[文章](/blogs/css/vertical-centering.md)

## 5、盒模型

盒模型有两种：**`W3C标准盒模型`** 和 **`IE怪异盒模型`**

盒模型是由：**`内容（content）`**、**`内边距（padding）`**、**`边框（border）`**和**`外边距（margin）`**组成的。

标准盒模型的宽高指的是 **`content`** 区域的宽高，IE盒模型的宽高指的是 **`content+padding+border`** 的总宽高。

![](https://upload-images.jianshu.io/upload_images/3534156-e2309fc21e18ce8d.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/746/format/webp)

![](https://upload-images.jianshu.io/upload_images/3534156-55b43078fcef0bec.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/598/format/webp)

**CSS 如何设置这两种盒模型？**

标准盒模型：`box-sizing: content-box;`

怪异盒模型：`box-sizing: border-box;`

## 6、Flex

详见[文章](/blogs/css/flex.md)

## 7、CSS 选择器权重

浏览器通过优先级规则，判断元素展示那些样式。优先级通过 4 个维度指标确定，假定以`a、b、c、d`命名，分别代表以下含义：

1. `a` 表示是否使用内联样式。如果使用，`a`为 1，否则为 0。
2. `b ` 表示 ID 选择器的数量。
3. `c` 表示类选择器、属性选择器和伪类选择器数量之和。
4. `d` 表示标签（类型）选择器和伪元素选择器之和。

优先级的结果并非通过以上四个值生成一个得分，而是**每个值分开比较**。`a`、`b`、`c`、`d` 权重从左到右，依次减小。判断优先级时，从左到右，一一比较，直到比较出最大值，即可停止。所以，如果 `b` 的值不同，那么 `c` 和 `d` 不管多大，都不会对结果产生影响。比如 `0, 1, 0, 0` 的优先级高于 `0, 0, 10, 10`。

**当出现优先级相等的情况时，最晚出现的样式规则被采纳**。如果你在样式表里写了相同的规则（无论是在该文件内部还是其它样式文件中），那么最后出现的（在文件底部的）样式优先级更高，因此会被采纳。

在写样式时，我会使用较低的优先级，这样这些样式可以轻易地覆盖掉。尤其对写 UI 组件的时候更为重要，这样使用者就不需要通过非常复杂的优先级规则或使用 `!important` 的方式，去覆盖组件的样式了。

## 8、[TODO]请阐述 `z-index`属性，并说明如何形成层叠上下文（stacking context）。

## 9、[TODO]层叠顺序和堆栈上下文

![](https://images2015.cnblogs.com/blog/608782/201609/608782-20160923104742809-2054066790.png)

## 10、有哪些清除浮动的技术？

- **空 `div` 方法**：`<div style="clear: both;"></div>`

- **自定义一个 `.clearfix` 类，利用伪元素选择器`::after` 清除浮动**：

	```css
	.clearfix::after {
		content: "";
		display: block;
		clear: both;
	}
	```

- `overflow: auto` 或 `overflow: hidden` **触发 BFC**

## 11、CSS 画三角形、梯形和平行四边形

```css
/*三角形*/
#box {
	width: 0;
	height: 0;
	border: 50px solid transparent;
	border-bottom: 50px solid steelblue;
}
/*梯形*/
#box {
	width: 50px;
	height: 0;
	border: 50px solid transparent;
	border-bottom: 50px solid steelblue;
}
/*平行四边形，如需让内容保持不倾斜，只需再嵌套一层div然后倾斜45度就好*/
#box {
	width: 200px;
	height: 100px;
	transform: skew(-45deg);
	background: steelblue;
}
```

## 12、多行文本溢出显示省略号

```css
overflow: hidden;
text-overflow: ellipsis;
```

## 13、回到顶部

`window.scrollTo(0, 0);`

## 14、px、em、rem的区别

**px 像素（Pixel）**。相对长度单位。像素px是相对于屏幕分辨率而言的。

**em** 是相对长度单位。相对于当前对象内文本的字体尺寸。如当前对行内文本的字体尺寸未被人为设置，则相对于浏览器的默认字体尺寸。

**rem** 是css3新增的一个相对单位（root em），rem 与 em 的区别在于使用rem为元素设定字体大小时，仍然是相对大小，但相对的是HTML根元素。这个单位可谓集相对大小和绝对大小的优点于一身，通过它既可以做到只修改根元素就成比例地调整所有字体大小，又可以避免字体大小逐层复合地连锁反应。

## 15、`static`、`relative`、`absolute` 和 `fixed`四种定位有什么区别？

- `static`：默认定位属性值。该关键字指定元素使用正常的布局行为，即元素在文档常规流中当前的布局位置。此时top，bottom，left，right和z-index属性无效。
- `relative`：元素先放置在未添加定位时的位置，再在不改变页面布局的前提下调整元素位置，因此会在此元素未添加定位时所在位置留下空白。
- `absolute`：不为元素预留空间，通过指定元素相对于最近的非static定位祖先元素的偏移，来确定元素位置。绝对定位的元素可以设置外边距，且不会与其他边距合并。
- `fixed`：不为元素预留空间，通过指定元素相对于屏幕视口的位置来指定元素位置。元素的位置在屏幕滚动时不会改变。fixed 属性会创建新的层叠上下文。当元素祖先的 transform 属性非 none 时，容器由视口改为该祖先。

## 16、CSS3实现硬币旋转

```html
<div id="euro">
	<div class="back"></div>
	<div class="middle" style="transform: translateZ(1px)"></div>
	<div class="middle" style="transform: translateZ(2px)"></div>
	<div class="middle" style="transform: translateZ(3px)"></div>
	<div class="middle" style="transform: translateZ(4px)"></div>
	<div class="middle" style="transform: translateZ(5px)"></div>
	<div class="middle" style="transform: translateZ(6px)"></div>
	<div class="middle" style="transform: translateZ(7px)"></div>
	<div class="middle" style="transform: translateZ(8px)"></div>
	<div class="middle" style="transform: translateZ(9px)"></div>
	<div class="front" style="transform: translateZ(10px)"></div>
</div>
```

```css
#euro {
	width: 150px;
	height: 150px;
	margin-left: -75px;
	margin-top: -75px;
	position: absolute;
	top: 50%;
	left: 50%;
	transform-style: preserve-3d;
	animation: spin 2.5s linear infinite;
}
.back {
	background-image: url("images/backeuro.png");
	width: 150px;
	height: 150px;
}
.middle {
	background-image: url("images/backeuro.png");
	width: 150px;
	height: 150px;
	position: absolute;
	top: 0;
}
.front {
	background-image: url("images/faceeuro.png");
	width: 150px;
	height: 150px;
	position: absolute;
	top: 0;
}
@keyframes spin {
	from {
		transform: rotateY(0deg);
	}
	to {
		transform: rotateY(360deg);
	}
}
```
## 17、background-origin作用

背景定位原点background-origin是CSS3新添加的有关背景的属性，主要是**改变背景起始的原点位置**。

属性值有三个：

**`border-box`**：背景图片的摆放以border区域为参考

**`padding-box`**：背景图片的摆放以padding区域为参考

**`content-box`**：背景图片的摆放以content区域为参考

## 18、vw、vh、vmin、vmax的区别

**vw**：1vw等于视口宽度的1%

**vh**：1vh等于视口高度的1%

**vmin**：选取vw和vh中最小的那个

**vmax**：选取vw和vh中最大的那个

vh,vw,vmin,vmax都是基于viewport定义的width来定义单位，它是利用视口单位实现，依赖于视口大小而自动缩放，所以不同的设备视口大小不一样自然就达到的适配的效果。

## 19、怎么实现图片的倒影效果

```html
<img src="images/pic.jpg" alt="" id="pic">
```

```css
#pic {
	-webkit-box-reflect: below;
}
```

如果希望倒影和图片之间有间隙可以设置css样式：

```css
#pic {
	-webkit-box-reflect: below 10px;
}
```

## 20、鼠标悬停下拉菜单

```html
<div class="drop-menu">
	<div class="hover-btn">Hover me</div>
	<div class="drop-content">
		<a href="#">Link 1</a>
		<a href="#">Link 2</a>
		<a href="#">Link 3</a>
	</div>
</div>
```

```css
.drop-menu {
	position: relative;
}
.hover-btn {
	width: 100px;
	height: 30px;
	line-height: 30px;
	text-align: center;
	border: 1px solid #CCC;
	border-radius: 5px;
	cursor: pointer;
}
.drop-content {
	display: none;
	position: absolute;
}
.drop-content a {
	display: block;
}
.drop-menu:hover .drop-content {
	display: block;
}
```

## 21、伪类和伪元素的区别？都有哪些？

伪类和伪元素的区别在于：有没有创建一个文档树之外的元素。

伪类：`:link`、`:visited`、`:hover`、`:active`、`:first-child`、`:nth-child()`、`:nth-of-type()`等。

伪元素：`::before`、`::after`、`::first-letter`、`::first-line`、`::selection`等。

## 22、`:nth-child()`和`:nth-of-type()`区别有哪些？

1. 在不指定类型时，`:nth-child(n)`选中父元素下的第n个子元素；`:nth-of-type(n)`选中的是父元素下不同标签类型的第n个。

2. `ele:nth-child(n)`要求不仅仅是第n个子元素，并且这个子元素标签名是`ele`；`ele:nth-of-type(n)`选择的是父元素下ele标签的第n个。

## 23、使一个div填充整个屏幕的方法

1. 给div设置定位

```css
div {
	width: 100%;
	height: 100%;
	background: yellow;
	position: absolute;
}
```

2. 通过html，body的宽高来让div充满屏幕

```css
* {
	margin: 0;
	padding: 0;
}
html, body {
	width: 100%;
	height: 100%;
}
div {
	width: 100%;
	height: 100%;
	background: red;
}
```

## 24、实现嵌套边框

```css
div {
	background: steelblue;
	min-width: 300px;
	min-height: 300px;
	box-shadow: inset 0 0 20px #0f0;
	border: 10px solid black;
}
```

```css
div {
	background: steelblue;
	min-width: 300px;
	min-height: 300px;
	border: 10px solid yellow;
	outline: red solid 10px;
}
```
