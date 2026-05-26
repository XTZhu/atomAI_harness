<template>
  <el-card class="trending-section" shadow="hover">
    <template #header>
      <div class="trending-header">
        <div class="trending-title">
          <el-icon :size="18" color="#f59e0b"><TrendCharts /></el-icon>
          <span>GitHub 趋势</span>
        </div>
        <div class="trending-filters">
          <!-- 时间范围 -->
          <el-radio-group
            v-if="showFilters"
            v-model="timeRange"
            size="small"
          >
            <el-radio-button value="daily">今日</el-radio-button>
            <el-radio-button value="weekly">本周</el-radio-button>
            <el-radio-button value="monthly">本月</el-radio-button>
          </el-radio-group>
          <!-- 语言过滤 -->
          <el-select
            v-if="showFilters"
            v-model="language"
            size="small"
            placeholder="全部语言"
            clearable
            class="lang-filter"
          >
            <el-option value="" label="全部语言" />
            <el-option v-for="lang in popularLanguages" :key="lang" :value="lang" :label="lang" />
          </el-select>
          <el-tag v-else size="small" type="warning" class="trending-subtitle">最近 7 天</el-tag>
        </div>
      </div>
    </template>

    <!-- 加载态 -->
    <div v-if="loading" class="trending-loading">
      <div v-for="i in 5" :key="i" class="skeleton-item">
        <div class="skeleton-rank"></div>
        <div class="skeleton-content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line long"></div>
        </div>
      </div>
    </div>

    <!-- 错误态 -->
    <div v-else-if="error" class="trending-error">
      <ErrorFallback title="趋势加载失败" :message="error" @retry="fetchTrending" />
    </div>

    <!-- 空态 -->
    <div v-else-if="items.length === 0" class="trending-empty">
      <el-empty description="暂无趋势数据" :image-size="80" />
    </div>

    <!-- 列表 -->
    <div v-else class="trending-list">
      <div
        v-for="(item, idx) in items"
        :key="item.name"
        class="trending-item"
        @click="$emit('select', item)"
      >
        <div class="trending-rank" :class="`rank-${idx + 1}`">
          {{ idx + 1 }}
        </div>
        <div class="trending-content">
          <div class="trending-name-row">
            <a :href="item.url" target="_blank" class="trending-name" @click.stop>
              <el-avatar :size="18" :src="item.owner?.avatar" class="owner-avatar" />
              {{ item.name }}
            </a>
            <div class="trending-actions" @click.stop>
              <el-tooltip content="AI 分析" :disabled="isTouchDevice">
                <el-button
                  text
                  size="small"
                  circle
                  class="ai-action-btn"
                  @click="$emit('select', item); $emit('chat', item)"
                >
                  <el-icon :size="14"><Cpu /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <p class="trending-desc">{{ item.description || '暂无描述' }}</p>
          <div class="trending-meta">
            <span class="trending-lang" v-if="item.language">
              <span class="lang-dot" :style="{ background: getLangColor(item.language) }"></span>
              {{ item.language }}
            </span>
            <span class="meta-stat">
              <el-icon :size="14"><Star /></el-icon> {{ formatNum(item.stars) }}
            </span>
            <span class="meta-stat">
              <el-icon :size="14"><Share /></el-icon> {{ formatNum(item.forks) }}
            </span>
            <span class="trending-today" v-if="item.starsToday">
              <el-icon :size="14"><Top /></el-icon> {{ item.starsToday }} today
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看更多 -->
    <div v-if="items.length > 0" class="trending-footer">
      <el-button text type="primary" @click="navigateTo('/trending')">
        查看完整榜单
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Star, Share, TrendCharts, Cpu, Top, ArrowRight } from '@element-plus/icons-vue'
import type { GitHubRepo, TrendRange, LangColorMap } from '~/types'

const props = withDefaults(defineProps<{
  showFilters?: boolean
  compact?: boolean
}>(), {
  showFilters: false,
  compact: false,
})

const emit = defineEmits<{
  select: [repo: GitHubRepo]
  chat: [repo: GitHubRepo]
}>()

const timeRange = ref<TrendRange>('weekly')
const language = ref('')

// 触摸设备检测
const isTouchDevice = ref(false)
onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

const popularLanguages = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust',
  'Java', 'Vue', 'Ruby', 'Swift', 'Kotlin', 'C++', 'C',
]

const langColors: LangColorMap = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572a5',
  Go: '#00add8', Rust: '#dea584', Java: '#b07219', Vue: '#41b883',
  Ruby: '#701516', 'C++': '#f34b7d', C: '#555555', Swift: '#f05138',
  Kotlin: '#a97bff', Shell: '#89e051', CSS: '#563d7c', HTML: '#e34c26',
}

const getLangColor = (lang: string) => langColors[lang] || '#8b8b8b'

const formatNum = (n: number) => {
  if (!n) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toLocaleString()
}

// 构建查询参数（响应式）
const trendingQuery = computed(() => {
  const now = new Date()
  const ranges: Record<TrendRange, number> = { daily: 1, weekly: 7, monthly: 30 }
  const since = new Date(now.getTime() - ranges[timeRange.value] * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const query: Record<string, string | number | undefined> = {
    since,
    per_page: props.compact ? 5 : 15,
  }
  if (language.value) {
    query.language = language.value
  }
  return query
})

const { data: trendingData, loading, error, refresh: fetchTrending } = useAsyncData<{ items: GitHubRepo[] }>(() =>
  $fetch('/api/github/trending', { query: trendingQuery.value })
)

const items = computed(() => trendingData.value?.items || [])

onMounted(fetchTrending)

// 当 filters 变化时重新加载
watch([timeRange, language], () => fetchTrending())
</script>

<style scoped>
.trending-section {
  border-radius: 12px;
  overflow: hidden;
}

.trending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.trending-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 16px;
}

.trending-filters {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trending-subtitle {
  font-weight: 500;
}

.lang-filter {
  width: 110px;
}

/* Skeleton */
.skeleton-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
}

.skeleton-rank {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--el-fill-color);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: var(--el-fill-color);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.short { width: 60%; }
.skeleton-line.long { width: 90%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 列表 */
.trending-list {
  display: flex;
  flex-direction: column;
}

.trending-item {
  display: flex;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 8px;
}

.trending-item:last-child {
  border-bottom: none;
}

.trending-item:hover {
  background: var(--el-fill-color-light);
}

/* 桌面端 hover 位移效果 */
@media (hover: hover) and (pointer: fine) {
  .trending-item:hover {
    padding-left: 8px;
    transform: translateX(4px);
  }
}

.trending-rank {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}

.rank-1 { background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff; transform: scale(1.1); }
.rank-2 { background: linear-gradient(135deg, #94a3b8, #64748b); color: #fff; }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #a0522d); color: #fff; }

.trending-content {
  flex: 1;
  min-width: 0;
}

.trending-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.trending-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.trending-name:hover {
  color: var(--el-color-primary);
}

.owner-avatar {
  flex-shrink: 0;
}

/* 桌面端 hover 显示按钮 */
@media (hover: hover) and (pointer: fine) {
  .trending-actions {
    opacity: 0;
    transition: opacity 0.15s;
  }

  .trending-item:hover .trending-actions {
    opacity: 1;
  }
}

/* 触摸设备常驻显示 */
.ai-action-btn {
  opacity: 1 !important;
}

.trending-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 4px 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.trending-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  align-items: center;
  flex-wrap: wrap;
}

.trending-lang {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.lang-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.meta-stat {
  display: flex;
  align-items: center;
  gap: 3px;
}

.trending-today {
  color: var(--el-color-warning);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
}

.trending-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 4px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .trending-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .trending-filters {
    flex-wrap: wrap;
    width: 100%;
  }

  .lang-filter {
    width: 100px;
  }

  .trending-item {
    padding: 10px 2px;
  }

  .trending-meta {
    gap: 8px;
    font-size: 11px;
  }

  .trending-name {
    font-size: 13px;
  }

  .trending-desc {
    font-size: 11px;
  }
}
</style>
