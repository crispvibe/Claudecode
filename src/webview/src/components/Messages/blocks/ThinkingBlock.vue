<template>
  <div class="thinking-block">
    <div class="thinking-header" @click="toggleExpanded">
      <span class="thinking-label">{{ isThinking ? 'Thinking...' : 'Thought' }}</span>
      <span class="codicon" :class="expanded ? 'codicon-chevron-up' : 'codicon-chevron-down'" />
    </div>
    <div v-if="expanded" class="thinking-content">
      {{ block.thinking }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import type { ThinkingBlock as ThinkingBlockType } from '../../../models/ContentBlock';

interface Props {
  block: ThinkingBlockType;
}

const props = defineProps<Props>();

const expanded = ref(true);
const isThinking = ref(true);
let manualToggled = false;
let stableTimer: ReturnType<typeof setTimeout> | null = null;

function toggleExpanded() {
  expanded.value = !expanded.value;
  manualToggled = true;
  // 手动操作后不再自动收起
  if (stableTimer) {
    clearTimeout(stableTimer);
    stableTimer = null;
  }
}

// 监听思考文本变化，文本停止更新 600ms 后判定思考完成并自动收起
watch(
  () => props.block.thinking,
  () => {
    // 文本还在变化，说明还在思考
    if (stableTimer) {
      clearTimeout(stableTimer);
    }

    // 用户已手动操作过，不再自动收起
    if (manualToggled) return;

    stableTimer = setTimeout(() => {
      stableTimer = null;
      isThinking.value = false;
      if (!manualToggled) {
        expanded.value = false;
      }
    }, 600);
  }
);

onBeforeUnmount(() => {
  if (stableTimer) {
    clearTimeout(stableTimer);
    stableTimer = null;
  }
});
</script>

<style scoped>
.thinking-block {
  margin: 4px 0;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.thinking-header .codicon {
  font-size: 14px;
  color: var(--vscode-descriptionForeground);
  opacity: 0.7;
  transition: opacity 0.1s ease;
}

.thinking-header:hover .codicon {
  opacity: 1;
}

.thinking-label {
  font-size: 14px;
  font-style: italic;
  color: var(--vscode-descriptionForeground);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.thinking-header:hover .thinking-label {
  opacity: 1;
}

.thinking-content {
  margin-left: 16px;
  padding: 4px 0;
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-secondary-foreground);
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
