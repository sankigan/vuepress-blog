<template>
  <GenericContainer>
    <!-- 时间轴主页: 不锁定任何筛选维度, 走 TimelineMag 默认行为
         view-mode-scope='timeline' 让本页视图偏好 (卡片/列表) 与分类/标签页独立存储 -->
    <TimelineMag view-mode-scope="timeline" />
  </GenericContainer>
</template>

<script setup lang="ts">
import GenericContainer from '@components/GenericContainer/index.vue';
import TimelineMag from '../components/TimelineMag.vue';
</script>
