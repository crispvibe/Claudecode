<template>
  <div class="text-block">
    <div :class="markdownClasses" v-html="renderedMarkdown"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import type { TextBlock as TextBlockType } from '../../../models/ContentBlock';
import type { ToolContext } from '../../../types/tool';
import { marked } from 'marked';
// import DOMPurify from 'dompurify'; // TODO: 安装后启用

interface Props {
  block: TextBlockType;
  context?: ToolContext;
}

const props = defineProps<Props>();

// Markdown 类名
const markdownClasses = computed(() => {
  const classes = ['markdown-content'];
  if (props.block.isSlashCommand) {
    classes.push('slash-command-text');
  }
  return classes;
});

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// 节流 Markdown 渲染：流式输出时最多每 80ms 解析一次，避免 O(n²) 重复解析
const renderedMarkdown = ref('');
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let lastParsedText = '';

function parseMarkdown(text: string) {
  if (text === lastParsedText) return;
  lastParsedText = text;
  renderedMarkdown.value = marked.parse(text) as string;
}

watch(
  () => props.block.text,
  (newText) => {
    // 文本没变化则跳过
    if (newText === lastParsedText) return;

    // 已有定时器在等待，说明正在流式输出中，跳过本次，等定时器触发
    if (throttleTimer) return;

    // 立即解析一次（首次或间隔已过）
    parseMarkdown(newText);

    // 设置节流窗口：80ms 内的后续变化只在窗口结束时解析一次
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
      // 窗口结束时，如果文本又有新变化，补一次解析
      if (props.block.text !== lastParsedText) {
        parseMarkdown(props.block.text);
      }
    }, 80);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (throttleTimer) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
});
</script>

<style scoped>
.text-block {
  margin: 0;
  padding: 0px 2px;
}

.markdown-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--vscode-editor-foreground);
  word-wrap: break-word;
  user-select: text;
}

.slash-command-text {
  color: var(--vscode-textLink-foreground);
  font-weight: 600;
}

/* Markdown 基础样式 - Claudex 风格 */
.markdown-content :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

.markdown-content :deep(code) {
  font-family: var(--vscode-editor-font-family, 'Hack Nerd Font Mono', 'SF Mono', Consolas, 'Courier New', monospace);
  word-break: break-all;
  cursor: default;
}

.markdown-content :deep(pre) {
  background-color: color-mix(in srgb, var(--vscode-editor-background) 50%, transparent);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
}

.markdown-content :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
}

.markdown-content :deep(:not(pre) > code) {
  background-color: color-mix(in srgb, var(--vscode-editor-background) 50%, transparent);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.9em;
}

.markdown-content :deep(a) {
  color: var(--vscode-textLink-foreground);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  color: var(--vscode-textLink-activeForeground);
  text-decoration: underline;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0px 0px 0px 16px;
  padding: 0px;
}

.markdown-content :deep(li) {
  padding-top: 2px;
  padding-bottom: 2px;
  list-style-type: disc;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--vscode-textBlockQuote-border);
  background-color: var(--vscode-textBlockQuote-background);
  margin: 8px 0;
  padding: 8px 16px;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: var(--vscode-foreground);
  font-weight: 600;
  margin: 16px 0 8px 0;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 18px;
}

.markdown-content :deep(h2) {
  font-size: 16px;
}

.markdown-content :deep(h3) {
  font-size: 14px;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  margin: 16px 0;
  width: 100%;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--vscode-panel-border);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: color-mix(in srgb, var(--vscode-editor-background) 30%, transparent);
  font-weight: 600;
}
</style>
