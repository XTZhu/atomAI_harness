<template>
  <div class="result-card" @click="$emit('select', repo)">
    <div class="result-header">
      <el-avatar :size="28" :src="repo.owner.avatar" class="result-avatar" />
      <span class="result-name">{{ repo.name }}</span>
      <el-tag v-if="repo.language" size="small" class="result-lang">{{ repo.language }}</el-tag>
    </div>
    <p class="result-desc">{{ repo.description || '暂无描述' }}</p>
    <div class="result-meta">
      <span class="meta-stat">
        <el-icon :size="13"><Star /></el-icon> {{ formatNum(repo.stars) }}
      </span>
      <span class="meta-stat">
        <el-icon :size="13"><Share /></el-icon> {{ formatNum(repo.forks) }}
      </span>
      <span class="meta-stat">
        <el-icon :size="13"><Clock /></el-icon> {{ formatDate(repo.updatedAt) }}
      </span>
    </div>
    <!-- Hover 操作 -->
    <div class="result-overlay">
      <el-button size="small" type="primary" plain @click.stop="$emit('select', repo)">
        <el-icon><Folder /></el-icon> 详情
      </el-button>
      <el-button size="small" type="warning" plain @click.stop="$emit('chat', repo)">
        <el-icon><Cpu /></el-icon> AI 分析
      </el-button>
    </div>
    <!-- 移动端：底部操作栏替代叠层 -->
    <div class="result-mobile-actions">
      <el-button size="small" type="primary" text @click.stop="$emit('select', repo)">
        详情
      </el-button>
      <el-button size="small" type="warning" text @click.stop="$emit('chat', repo)">
        <el-icon><Cpu /></el-icon> AI
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Star, Share, Clock, Folder, Cpu } from '@element-plus/icons-vue'
import type { GitHubRepo } from '~/types'

defineProps<{ repo: GitHubRepo }>()

defineEmits<{
  select: [repo: GitHubRepo]
  chat: [repo: GitHubRepo]
}>()

const formatNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

const formatDate = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return '今天'
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}月前`
}
</script>

<style scoped>
.result-card {
  position: relative;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  background: var(--el-bg-color);
  animation: cardIn 0.35s ease-out both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.result-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.result-avatar { flex-shrink: 0; }

.result-name {
  font-weight: 600; font-size: 14px;
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.result-lang { flex-shrink: 0; }

.result-desc {
  font-size: 13px; color: var(--el-text-color-secondary);
  margin: 0 0 12px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  display: flex; gap: 16px;
  font-size: 12px; color: var(--el-text-color-secondary);
}

.meta-stat { display: flex; align-items: center; gap: 3px; }

/* Hover 覆盖层 */
.result-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  gap: 8px; opacity: 0; pointer-events: none; transition: opacity 0.2s;
}

.dark .result-overlay { background: rgba(30, 30, 40, 0.92); }

@media (hover: hover) and (pointer: fine) {
  .result-card:hover .result-overlay { opacity: 1; pointer-events: auto; }
}

.result-mobile-actions {
  display: none; justify-content: flex-end; gap: 4px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .result-overlay { display: none; }
  .result-mobile-actions { display: flex; }
  .result-card { padding: 12px; }
  .result-card:hover { transform: none; }
}
</style>
