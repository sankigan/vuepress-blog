## 经典排序算法比较

![](https://user-gold-cdn.xitu.io/2018/12/24/167de867a0b2c69e?imageslim)

> 注：上图中快排的空间复杂度应为logn

```js
// 定义交换函数
function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}
```

## 选择排序

```javascript
// 选择排序
// 时间复杂度:平均: O(n^2), 最坏: O(n^2), 最好: O(n^2)
// 空间复杂度:O(1)
function selectSort(arr) {
	for (let i = 0; i < arr.length - 1; ++i) {
		let minPos = i;
		for (let j = i + 1; j < arr.length; ++j) {
			if (arr[j] < arr[minPos]) minPos = j;
		}
		swap(arr, i, minPos);
	}
	return arr;
}
```

## 冒泡排序

```javascript
// 冒泡排序
// 时间复杂度:平均: O(n^2), 最坏: O(n^2), 最好: O(n)
// 空间复杂度:O(1)
function bubbleSort(arr) {
	for (let i = arr.length - 1; i >= 1 ; --i) {
		let flag = true;
		for (let j = 0; j < i; ++j) {
			if (arr[j] > arr[j + 1]) {
				swap(arr, j, j + 1);
				flag = false;
			}
		}
		if (flag) break;
	}
	return arr;
}

// 最坏情况，待排序列逆序； 最好情况，待排序列有序
```

## 插入排序

```javascript
// 插入排序
// 时间复杂度:平均: O(n^2), 最坏: O(n^2), 最好: O(n)
// 空间复杂度:O(1)
function insertSort(arr) {
	for (let i = 1; i < arr.length; ++i) {
		let tmp = arr[i];
		let j = i - 1;
		while (j >= 0 && tmp < arr[j]) {
			arr[j + 1] = arr[j];
			--j;
		}
		arr[j + 1] = tmp;
	}
	return arr;
}

// 最坏情况，待排序列逆序； 最好情况，待排序列有序
```

## 快排

```javascript
// 快排
// 时间复杂度:平均: O(nlogn), 最坏: O(n^2), 最好: O(nlogn)
// 空间复杂度:O(logn)
function quickSort(arr) {
	if (arr.length <= 1) return arr;
	let pivot = arr[0];
	let left = [], right = [];
	for (let i = 1; i < arr.length; ++i) {
		if (arr[i] < pivot) left.push(arr[i]);
		else right.push(arr[i]);
	}
	return quickSort(left).concat(pivot, quickSort(right));
}

// 待排序列越接近无序，本算法效率越高
// 待排序列越接近有序，本算法效率越低
```

## 希尔排序

```js
// 希尔排序(缩小增量排序)
// 时间复杂度:平均: O(n^1.3), 最坏: O(n^2), 最好: O(n)
// 空间复杂度:O(1)
function shellSort(arr) {
	let gap = 1;
	while (gap < arr.length / 3) gap = gap * 3 + 1;
	for (gap; gap > 0; gap = Math.floor(gap/3)) {
		for (let i = gap; i < arr.length; ++i) {
			let tmp = arr[i];
			let j;
			for (j = i - gap; j >= 0 && arr[j] > tmp; j -= gap) {
				arr[j + gap] = arr[j];
			}
			arr[j + gap] = tmp;
		}
	}
	return arr;
}
```

## 归并排序

```js
// 归并排序
// 时间复杂度:平均: O(nlogn), 最坏: O(nlogn), 最好: O(nlogn)
// 空间复杂度:O(n)
function merge(left, right) {
	let res = [];
	while (left.length > 0 && right.length > 0) {
		if (left[0] < right[0]) res.push(left.shift());
		else res.push(right.shift());
	}
	return res.concat(left, right);
}
function mergeSort(arr) {
	if (arr.length == 1) return arr;
	let mid = Math.floor(arr.length / 2);
	let left = arr.slice(0, mid);
	let right = arr.slice(mid);
	return merge(mergeSort(left), mergeSort(right))
}
```

## 堆排序

```javascript
// 堆排序(大顶堆)
// 时间复杂度:平均: O(nlogn), 最坏: O(nlogn), 最好: O(nlogn)
// 空间复杂度:O(1)
function shiftDown(arr, i, length) {
	for (let j = 2*i+1; j < length; j = 2*j+1) {
		let tmp = arr[i];
		if (j + 1 < length && arr[j] < arr[j + 1]) ++j;
		if (tmp < arr[j]) {
			swap(arr, i, j);
			i = j;
		} else break;
	}
}
function heapSort(arr) {
	// 初始化大顶堆，从第一个非叶子阶段开始
	for (let i = Math.floor(arr.length / 2); i >= 0; --i) {
		shiftDown(arr, i, arr.length);
	}
	// 排序，每一次for循环找出一个当前最大值，数组长度减 1
	for (let j = arr.length - 1; j > 0; --j) {
		swap(arr, 0, j);
		shiftDown(arr, 0, j);
	}
	return arr;
}

// 堆排序适用的场景是关键字数很多的情况，典型的例子是从10000个关键字中选出前10个最小的，这种情况用堆排序最好。如果关键字数较少，则不提倡使用堆排序。
```

## 桶排序

```javascript
// 桶排序
// 时间复杂度:平均: O(n+k), 最坏: O(n^2), 最好: O(n)
// 空间复杂度:O(n+k)
function bucketSort(arr, num) {
	let max = Math.max.apply(null, arr),
		min = Math.min.apply(null, arr);
	let buckets    = [],
		bucketSize = Math.floor((max-min+1) / num);
	for (let i = 0; i < arr.length; ++i) {
		let index = ~~(arr[i] / bucketSize);
		!buckets[index] && (buckets[index] = []);
		buckets[index].push(arr[i]);
		let len = buckets[index].length;
		while (len > 0) {
			(buckets[index][len-1] > buckets[index][len]) && ([buckets[index][len], buckets[index][len-1]] = [buckets[index][len-1], buckets[index][len]]);
			--len;
		}
	};

	let wrapBuckets = [];
	for (let i = 0; i < buckets.length; ++i) {
		buckets[i] && (wrapBuckets = wrapBuckets.concat(buckets[i]));
	}
	return wrapBuckets;
}

```

## 计数排序

```javascript
// 计数排序
// 时间复杂度:平均: O(n+k), 最坏: O(n+k), 最好: O(n+k)
// 空间复杂度:O(n+k)
function countSort(arr) {
	let max = Math.max.apply(null, arr);
	let res = [];
	let tmp = new Array(max+1).fill(0);
	for (let item of arr) {
		++tmp[item];
	}
	for (let index in tmp) {
		while (tmp[index]-- > 0) res.push(+index);
	}
	return res;
} 

```

## 基数排序

```javascript
// 基数排序
// 时间复杂度:平均: O(n*k), 最坏: O(n*k), 最好: O(n*k)
// 空间复杂度:O(n+k)
function getLoopTimes(num) {
	return (num+"").split("").length;
}
function getBucketNumber(num, d) {
	return (num+"").split("").reverse()[d];
}
function lsdRadixSort(arr, buckets, radix) {
	for (let i = 0; i < arr.length; ++i) {
		let ele = arr[i];
		let index = getBucketNumber(ele, radix);
		buckets[index].push(ele);
	}
	let k = 0;
	for (let i = 0; i < 10; ++i) {
		let bucket = buckets[i];
		for (let j = 0; j < bucket.length; ++j) {
			arr[k++] = bucket[j];
		}
	}
}
function radixSort(arr) {
	let max = Math.max.apply(null, arr),
		times = getLoopTimes(max),
		len = arr.length;
	let buckets = [];
	for (let i = 0; i < 10; ++i) {
		buckets[i] = [];  // 初始化10个桶
	}
	for (let radix = 0; radix < times; ++radix) {
		lsdRadixSort(arr, buckets, radix);
	}
	return arr;
}

```
