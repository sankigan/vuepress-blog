<template>
  <span :class="['difficulty-tag', `difficulty-tag--${type}`]">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  difficulty: {
    type: String,
    default: '',
  },
});

const type = computed(() => {
  const map = {
    '简单': 'easy',
    '中等': 'medium',
    '困难': 'hard',
  };
  return map[props.difficulty] || 'easy';
});

const label = computed(() => props.difficulty);
</script>
