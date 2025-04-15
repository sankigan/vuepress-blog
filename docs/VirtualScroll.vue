<template>
  <div class="screen" ref="screenRef">
    <div id="scroll" ref="scrollRef" @scroll="handleScroll">
      <div class="background" ref="bgRef" :style="{ height: totalHeight + 'px' }"></div>
      <div
        class="list"
        ref="listRef"
        :style="{ transform: `translate3d(0, ${contentOffset}px, 0)` }"
      >
        <!-- 使用v-for自动渲染可见项 -->
        <div
          v-for="item in visibleItems"
          :key="item.index"
          class="line"
          :style="{ height: ITEM_HEIGHT + 'px' }"
        >
          第 {{ item.text }} 项
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VirtualScroll',
  data() {
    return {
      ITEM_HEIGHT: 32,       // 每项高度
      COUNT: 10000,          // 总项数
      listData: [],          // 所有数据
      visibleItems: [],      // 当前可见项
      startIndex: 0,         // 起始索引
      contentOffset: 0,      // 内容偏移量
      maxVisibleCount: 0,    // 最大可见项数
      switchScrollScale: [0, 0], // 滚动切换范围
      tick: false,           // 节流标志
    };
  },
  computed: {
    // 计算列表总高度
    totalHeight() {
      return this.ITEM_HEIGHT * this.COUNT;
    }
  },
  created() {
    // 初始化数据
    this.generateData();
  },
  mounted() {
    // 计算可视区域能容纳的项数
    this.calculateVisibleCount();
    // 初始渲染（通过获取初始滚动位置数据）
    this.getRunDataList(0);
    // 监听窗口大小变化
    window.addEventListener('resize', this.calculateVisibleCount);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateVisibleCount);
  },
  methods: {
    // 生成测试数据
    generateData() {
      this.listData = Array.from({ length: this.COUNT }, (_, i) => ({
        text: i + 1,
        index: i,
        top: i * this.ITEM_HEIGHT
      }));
    },
    // 计算可视区域能显示的项数
    calculateVisibleCount() {
      if (this.$refs.screenRef) {
        this.maxVisibleCount = Math.ceil(
          this.$refs.screenRef.clientHeight / this.ITEM_HEIGHT
        ) * 2; // 多渲染一些作为缓冲
        this.switchScrollScale = [0, this.maxVisibleCount * this.ITEM_HEIGHT];
      }
    },
    // 处理滚动事件
    handleScroll(event) {
      if (!this.tick) {
        this.tick = true;
        requestAnimationFrame(() => {
          this.tick = false;
          this.getRunDataList(event.target.scrollTop);
        });
      }
    },
    // 获取当前需要渲染的数据
    getRunDataList(distance) {
      if (!this.switchScroll(distance)) {
        const startIndex = this.getStartIndex(distance);
        const beforeList = this.listData.slice(
          this.getBeforeIndex(startIndex),
          startIndex
        );
        const nowList = this.listData.slice(
          startIndex,
          startIndex + this.maxVisibleCount
        );
        const afterList = this.listData.slice(
          this.getAfterIndex(startIndex),
          this.getAfterIndex(startIndex) + this.maxVisibleCount
        );

        this.contentOffset = (beforeList[0] || this.listData[startIndex]).top;
        this.changeSwitchScale(startIndex);

        this.visibleItems = [...beforeList, ...nowList, ...afterList];
      }
    },
    // 判断是否在切换范围内
    switchScroll(scrollTop) {
      return scrollTop > this.switchScrollScale[0] &&
             scrollTop < this.switchScrollScale[1];
    },
    // 更新切换范围
    changeSwitchScale(startIndex) {
      const beforeScale = Math.ceil(startIndex) * this.ITEM_HEIGHT;
      const afterScale = Math.floor(startIndex + this.maxVisibleCount * 2) * this.ITEM_HEIGHT;
      this.switchScrollScale = [beforeScale, afterScale];
    },
    // 二分查找起始索引
    getStartIndex(scrollTop) {
      let start = 0;
      let end = this.listData.length - 1;
      while (start < end) {
        const mid = Math.floor((end + start) / 2);
        const { top } = this.listData[mid];
        if (scrollTop >= top && scrollTop < top + this.ITEM_HEIGHT) {
          start = mid;
          break;
        } else if (scrollTop >= top + this.ITEM_HEIGHT) {
          start = mid + 1;
        } else if (scrollTop < top) {
          end = mid - 1;
        }
      }
      return start < 0 ? 0 : start;
    },
    // 获取前缓冲区索引
    getBeforeIndex(startIndex) {
      return Math.max(0, startIndex - this.maxVisibleCount);
    },
    // 获取后缓冲区索引
    getAfterIndex(startIndex) {
      return Math.min(this.COUNT, startIndex + this.maxVisibleCount);
    }
  }
};
</script>

<style>
.screen {
  position: absolute;
  width: 300px;
  height: 200px;
}
#scroll {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #4DC0EB;
  overflow-y: scroll;
}
.background {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: -1;
}
.list {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}
.line {
  color: #24305E;
  line-height: 2;
  padding-left: 10px;
}
</style>
