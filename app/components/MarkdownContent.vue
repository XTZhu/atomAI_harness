<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  content: string
}>()

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch { /* fallback */ }
    }
    try {
      return hljs.highlightAuto(code).value
    } catch {
      return code
    }
  },
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  try {
    return marked.parse(props.content) as string
  } catch {
    return `<p>${props.content}</p>`
  }
})
</script>

<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body :deep(h1) { font-size: 1.5em; }
.markdown-body :deep(h2) { font-size: 1.3em; border-bottom: 1px solid var(--el-border-color-lighter); padding-bottom: 6px; }
.markdown-body :deep(h3) { font-size: 1.15em; }

.markdown-body :deep(p) {
  margin: 0 0 10px;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin-bottom: 10px;
}

.markdown-body :deep(li) {
  margin-bottom: 4px;
}

.markdown-body :deep(pre) {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 10px 0;
}

.markdown-body :deep(pre code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: none;
  padding: 0;
  color: #cdd6f4;
}

.markdown-body :deep(code) {
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--el-color-primary);
  padding: 8px 16px;
  margin: 10px 0;
  background: var(--el-fill-color-light);
  border-radius: 0 6px 6px 0;
  color: var(--el-text-color-secondary);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--el-border-color);
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--el-fill-color);
  font-weight: 600;
}

.markdown-body :deep(a) {
  color: var(--el-color-primary);
}

.markdown-body :deep(strong) {
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color-lighter);
  margin: 16px 0;
}

/* highlight.js 主题覆盖 */
.markdown-body :deep(.hljs-keyword) { color: #cba6f7; }
.markdown-body :deep(.hljs-string) { color: #a6e3a1; }
.markdown-body :deep(.hljs-comment) { color: #6c7086; font-style: italic; }
.markdown-body :deep(.hljs-function) { color: #89b4fa; }
.markdown-body :deep(.hljs-number) { color: #fab387; }
.markdown-body :deep(.hljs-title) { color: #89b4fa; }
.markdown-body :deep(.hljs-type) { color: #f9e2af; }
.markdown-body :deep(.hljs-built_in) { color: #f38ba8; }
</style>
