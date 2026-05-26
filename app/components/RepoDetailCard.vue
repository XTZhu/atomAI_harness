<template>
  <el-card v-if="repo" class="repo-detail-card" shadow="hover">
    <div class="detail-header">
      <div class="repo-title-row">
        <el-avatar :size="40" :src="repo.owner?.avatar" />
        <div class="repo-title">
          <h2>{{ repo.name }}</h2>
          <span class="repo-desc-text">{{ repo.description || '暂无描述' }}</span>
        </div>
        <el-button class="ai-analyze-btn" size="small" @click="$emit('chat', repo)">
          <el-icon><ChatDotRound /></el-icon>
          AI 分析
        </el-button>
      </div>
    </div>

    <!-- AI 总结概览 -->
    <div v-if="summary || summaryLoading" class="ai-summary-section">
      <div class="ai-summary-header">
        <div class="ai-summary-title">
          <el-icon :size="16">
            <MagicStick />
          </el-icon>
          <span>AI 项目解读</span>
          <el-tag size="small" type="warning" effect="dark" round> AI </el-tag>
        </div>
      </div>
      <!-- 加载态 -->
      <div v-if="summaryLoading" class="ai-summary-loading">
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span class="loading-text">AI 正在生成项目总结…</span>
      </div>
      <!-- 总结内容 -->
      <div v-else-if="summary" class="ai-summary-content">
        <div class="summary-block">
          <span class="summary-label what">What</span>
          <div class="summary-body">
            <MarkdownContent :content="summaryParts.what" />
          </div>
        </div>
        <div class="summary-block">
          <span class="summary-label how">How</span>
          <div class="summary-body">
            <MarkdownContent :content="summaryParts.how" />
          </div>
        </div>
        <div class="summary-block">
          <span class="summary-label why">Why</span>
          <div class="summary-body">
            <MarkdownContent :content="summaryParts.why" />
          </div>
        </div>
      </div>
      <!-- 错误态 -->
      <div v-if="summaryError" class="ai-summary-error">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ summaryError }}</span>
        <el-button text size="small" type="primary" @click="fetchSummary"> 重试 </el-button>
      </div>
    </div>

    <el-divider />

    <div class="detail-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">
              {{ repo.stars?.toLocaleString() }}
            </div>
            <div class="stat-label">Stars</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">
              {{ repo.forks?.toLocaleString() }}
            </div>
            <div class="stat-label">Forks</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">
              {{ repo.openIssues?.toLocaleString() }}
            </div>
            <div class="stat-label">Issues</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">
              {{ repo.watchers?.toLocaleString() }}
            </div>
            <div class="stat-label">Watchers</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-divider />

    <div class="detail-info">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="语言">
          <el-tag v-if="repo.language" size="small">
            {{ repo.language }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="许可证">
          {{ repo.license || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="默认分支">
          {{ repo.defaultBranch || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="仓库大小">
          {{ formatSize(repo.size) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(repo.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="最近更新">
          {{ formatTime(repo.updatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="repo.topics?.length" label="话题" :span="2">
          <el-space wrap>
            <el-tag v-for="topic in repo.topics" :key="topic" size="small" type="info">
              {{ topic }}
            </el-tag>
          </el-space>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="detail-links">
      <el-button type="default" @click="openUrl(repo.url)">
        <el-icon><Link /></el-icon> 在 GitHub 打开
      </el-button>
      <el-button v-if="repo.homepage" type="info" @click="openUrl(repo.homepage)">
        <el-icon><Link /></el-icon> 项目主页
      </el-button>
    </div>

    <!-- README 预览（Markdown 渲染） -->
    <el-collapse v-if="repo.readme" class="readme-collapse">
      <el-collapse-item name="readme">
        <template #title>
          <div class="readme-title">
            <el-icon><Document /></el-icon>
            <span>README.md</span>
            <el-tag size="small" type="info" effect="plain"> 预览 </el-tag>
          </div>
        </template>
        <div class="readme-preview">
          <MarkdownContent :content="readmePreview" :repo-name="repo.name" />
          <div v-if="repo.readme.length > MAX_LENGTH" class="readme-truncated">
            <el-divider />
            <span>README 内容较长，仅展示前 {{ MAX_LENGTH }} 字符。</span>
            <el-button text type="primary" size="small" @click="openUrl(repo.url)">
              在 GitHub 查看完整 README <el-icon><Link /></el-icon>
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script setup lang="ts">
import { ChatDotRound, Link, Document, MagicStick, WarningFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { GitHubRepoDetail } from '~/types'

const props = defineProps<{
  repo: GitHubRepoDetail
}>()

defineEmits<{
  chat: [repo: any]
}>()

const MAX_LENGTH = 10000

// README 预览截断
const readmePreview = computed(() => {
  const readme = props.repo?.readme
  if (!readme) return ''
  return readme.length > MAX_LENGTH ? readme.slice(0, MAX_LENGTH) : readme
})

// ===== AI 总结 =====
const summary = ref('')
const summaryLoading = ref(false)
const summaryError = ref('')

// 解析 what/how/why
const summaryParts = computed(() => {
  const text = summary.value
  if (!text) return { what: '', how: '', why: '' }

  // 清理残存的 ** 标记
  const clean = (s: string) =>
    s
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .replace(/^\*([^*])/, '$1')
      .replace(/([^*])\*$/, '$1')
      .trim()

  // 匹配 **What** 或 What 格式，支持前后可选的 bold 标记
  const whatRe =
    /(?:\*\*)?\s*(?:What|是什么)\s*(?:\*\*)?[：:]\s*(.+?)(?=\s*(?:\*\*)?\s*(?:How|怎么|如何|采用)\s*(?:\*\*)?[：:]|$)/s
  const howRe =
    /(?:\*\*)?\s*(?:How|怎么|如何|采用)\s*(?:\*\*)?[：:]\s*(.+?)(?=\s*(?:\*\*)?\s*(?:Why|为什么|原因|意义)\s*(?:\*\*)?[：:]|$)/s
  const whyRe = /(?:\*\*)?\s*(?:Why|为什么|原因|意义)\s*(?:\*\*)?[：:]\s*(.+)/s

  const whatMatch = text.match(whatRe)
  const howMatch = text.match(howRe)
  const whyMatch = text.match(whyRe)

  if (whatMatch || howMatch || whyMatch) {
    return {
      what: clean(whatMatch?.[1] || ''),
      how: clean(howMatch?.[1] || ''),
      why: clean(whyMatch?.[1] || ''),
    }
  }

  // 按 **加粗标题** 分割作为回退
  const parts = text.split(/\*\*(?:What|是什么|How|如何|Why|为什么)\*\*/i)
  if (parts.length >= 3) {
    return {
      what: clean(parts[1] || ''),
      how: clean(parts[2] || ''),
      why: clean(parts.slice(3).join('').replace(/\*\*/g, '')),
    }
  }

  // 最终回退：全文
  return { what: text.replace(/\*\*/g, '').trim(), how: '', why: '' }
})

const fetchSummary = async () => {
  if (!props.repo) return
  summaryLoading.value = true
  summaryError.value = ''
  summary.value = ''
  try {
    const data = await $fetch('/api/ai/summary', {
      method: 'POST',
      body: {
        repoContext: {
          name: props.repo.name,
          description: props.repo.description,
          language: props.repo.language,
          readme: props.repo.readme,
        },
      },
    })
    summary.value = data.summary || ''
  } catch (err: any) {
    summaryError.value = err.message || '生成总结失败'
  } finally {
    summaryLoading.value = false
  }
}

// repo 变化时自动获取总结
watch(
  () => props.repo?.name,
  (name) => {
    if (name) {
      fetchSummary()
    } else {
      summary.value = ''
      summaryError.value = ''
    }
  },
  { immediate: true },
)

const formatSize = (kb: number) => {
  if (!kb) return '-'
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const formatTime = (t: string) => {
  if (!t) return '-'
  return dayjs(t).format('YYYY-MM-DD')
}

const openUrl = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
.repo-detail-card {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repo-title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.repo-title {
  flex: 1;
}

.repo-title h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.repo-desc-text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.stat-box {
  text-align: center;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.detail-links {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.readme-collapse {
  margin-top: 16px;
}

.readme-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.readme-preview {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 16px 20px;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
}

.readme-truncated {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ===== AI 总结概览 ===== */
.ai-summary-section {
  margin-top: 16px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-warning-light-9) 100%
  );
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 12px;
  padding: 16px 18px;
  animation: fadeIn 0.4s ease;
}

.ai-summary-header {
  margin-bottom: 12px;
}

.ai-summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--el-color-primary);
}

/* 加载动画 */
.ai-summary-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
}

.loading-dot {
  width: 7px;
  height: 7px;
  background: var(--el-color-primary);
  border-radius: 50%;
  animation: summaryDot 1.4s infinite ease-in-out;
}
.loading-dot:nth-child(1) {
  animation-delay: 0s;
}
.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes summaryDot {
  0%,
  60%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

/* 总结内容 */
.ai-summary-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-block {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.summary-label {
  flex-shrink: 0;
  width: 42px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  color: #fff;
  letter-spacing: 0.5px;
}

.summary-label.what {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.summary-label.how {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
}

.summary-label.why {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.summary-block p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  flex: 1;
}

/* 总结区域内的 markdown 微调 */
.summary-body {
  flex: 1;
  min-width: 0;
}

.summary-body :deep(.markdown-body) {
  font-size: 13px;
  line-height: 1.6;
}

.summary-body :deep(.markdown-body p) {
  margin: 0;
}

.summary-body :deep(.markdown-body code) {
  font-size: 0.85em;
  padding: 1px 5px;
}

.summary-body :deep(.markdown-body strong) {
  color: var(--el-color-primary);
}

/* 错误态 */
.ai-summary-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-color-danger);
  padding: 4px 0;
}

/* ===== AI 分析按钮优化 ===== */
.ai-analyze-btn {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border: none;
  background: linear-gradient(135deg, var(--el-color-primary), #7c3aed);
  color: #fff;
  font-weight: 600;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.35s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.ai-analyze-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  transition: left 0.45s ease;
  z-index: -1;
  border-radius: 8px;
}

.ai-analyze-btn:hover {
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
}

.ai-analyze-btn:hover::before {
  left: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 600px) {
  .repo-title-row {
    flex-wrap: wrap;
  }

  .repo-title h2 {
    font-size: 15px;
  }

  .repo-desc-text {
    font-size: 12px;
  }

  .stat-box {
    padding: 8px 4px;
  }

  .stat-value {
    font-size: 16px;
  }

  .stat-label {
    font-size: 10px;
  }

  .detail-links {
    flex-direction: column;
  }

  /* 统计区 2 列布局 */
  .detail-stats :deep(.el-col) {
    max-width: 50%;
    flex: 0 0 50%;
    margin-bottom: 8px;
  }

  .ai-analyze-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .ai-summary-section {
    padding: 12px 14px;
  }

  .summary-body :deep(.markdown-body) {
    font-size: 12px;
  }

  .summary-label {
    width: 36px;
    height: 20px;
    font-size: 10px;
  }
}
</style>
