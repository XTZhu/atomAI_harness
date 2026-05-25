<template>
  <el-card v-if="repo" class="repo-detail-card" shadow="hover">
    <div class="detail-header">
      <div class="repo-title-row">
        <el-avatar :size="40" :src="repo.owner?.avatar" />
        <div class="repo-title">
          <h2>{{ repo.name }}</h2>
          <span class="repo-desc-text">{{ repo.description || '暂无描述' }}</span>
        </div>
        <el-button type="primary" size="small" @click="$emit('chat', repo)">
          <el-icon><ChatDotRound /></el-icon>
          AI 分析
        </el-button>
      </div>
    </div>

    <el-divider />

    <div class="detail-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">{{ repo.stars?.toLocaleString() }}</div>
            <div class="stat-label">Stars</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">{{ repo.forks?.toLocaleString() }}</div>
            <div class="stat-label">Forks</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">{{ repo.openIssues?.toLocaleString() }}</div>
            <div class="stat-label">Issues</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-value">{{ repo.watchers?.toLocaleString() }}</div>
            <div class="stat-label">Watchers</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-divider />

    <div class="detail-info">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="语言">
          <el-tag v-if="repo.language" size="small">{{ repo.language }}</el-tag>
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
      <el-button @click="openUrl(repo.url)" type="default">
        <el-icon><Link /></el-icon> 在 GitHub 打开
      </el-button>
      <el-button v-if="repo.homepage" @click="openUrl(repo.homepage)" type="info">
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
            <el-tag size="small" type="info" effect="plain">预览</el-tag>
          </div>
        </template>
        <div class="readme-preview">
          <MarkdownContent :content="readmePreview" />
          <div v-if="repo.readme.length > 4000" class="readme-truncated">
            <el-divider />
            <span>README 内容较长，仅展示前 4000 字符。</span>
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
import { ChatDotRound, Link, Document } from '@element-plus/icons-vue'

const props = defineProps<{
  repo: any
}>()

defineEmits<{
  chat: [repo: any]
}>()

// README 预览截断
const readmePreview = computed(() => {
  const readme = props.repo?.readme
  if (!readme) return ''
  return readme.length > 4000 ? readme.slice(0, 4000) : readme
})

const formatSize = (kb: number) => {
  if (!kb) return '-'
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const formatTime = (t: string) => {
  if (!t) return '-'
  return new Date(t).toLocaleDateString('zh-CN')
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
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
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
</style>
