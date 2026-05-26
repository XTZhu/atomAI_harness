<template>
  <div class="dashboard">
    <!-- ============ 搜索 Hero ============ -->
    <section class="search-hero">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <h1 class="hero-heading">
          探索<span class="hero-accent">开源</span>世界
        </h1>
        <p class="hero-desc">通过 AI 洞察，深入理解每一行代码</p>

        <div class="hero-search-box">
          <el-input
            ref="searchInputRef"
            v-model="keyword"
            size="large"
            :placeholder="placeholderText"
            class="hero-input"
            @keyup.enter="doSearch"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          >
            <template #prefix>
              <el-icon :size="18" class="search-icon"><Search /></el-icon>
            </template>
            <template #append>
              <el-button
                type="primary"
                :loading="loading"
                :disabled="!keyword.trim()"
                class="search-btn"
                @click="doSearch"
              >
                搜索
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 热门标签 -->
        <div class="hot-tags">
          <span class="hot-label">热门搜索</span>
          <el-tag
            v-for="tag in hotTags"
            :key="tag"
            class="hot-tag"
            :type="tag.color"
            effect="plain"
            @click="quickSearch(tag.query)"
          >
            {{ tag.label }}
          </el-tag>
        </div>

        <!-- 快捷入口 -->
        <div class="quick-entries">
          <div class="quick-entry" @click="quickSearch('stars:>10000')">
            <el-icon :size="16"><Star /></el-icon>
            <span>万星项目</span>
          </div>
          <div class="quick-entry" @click="quickSearch('language:rust')">
            <el-icon :size="16"><Setting /></el-icon>
            <span>Rust 生态</span>
          </div>
          <div class="quick-entry" @click="quickSearch('machine learning')">
            <el-icon :size="16"><Cpu /></el-icon>
            <span>AI/ML 项目</span>
          </div>
          <div class="quick-entry" @click="navigateTo('/trending')">
            <el-icon :size="16"><TrendCharts /></el-icon>
            <span>趋势榜单</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 搜索结果 + 详情 ============ -->
    <section v-if="searched" class="results-section">
      <!-- 搜索错误 -->
      <ErrorFallback v-if="searchError" :message="searchError" @retry="fetchResults" />

      <!-- 搜索摘要 -->
      <div v-if="results.length && !selectedRepo" class="search-summary">
        <div class="summary-info">
          <el-icon><Search /></el-icon>
          <span>找到 <strong>{{ totalCount.toLocaleString() }}</strong> 个仓库 匹配 "<em>{{ searchQuery }}</em>"</span>
        </div>
        <el-button text size="small" @click="resetSearch">
          <el-icon><Close /></el-icon> 清除
        </el-button>
      </div>

      <!-- 搜索结果列表 -->
      <div v-if="results.length && !selectedRepo && !searchError" class="results-grid">
        <div
          v-for="repo in results"
          :key="repo.id"
          class="result-card"
          @click="selectRepo(repo)"
        >
          <div class="result-header">
            <el-avatar :size="28" :src="repo.owner?.avatar" class="result-avatar" />
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
            <el-button size="small" type="primary" plain @click.stop="selectRepo(repo)">
              <el-icon><Folder /></el-icon> 详情
            </el-button>
            <el-button size="small" type="warning" plain @click.stop="handleChatFromResult(repo)">
              <el-icon><Cpu /></el-icon> AI 分析
            </el-button>
          </div>
          <!-- 移动端：底部操作栏替代叠层 -->
          <div class="result-mobile-actions">
            <el-button size="small" type="primary" text @click.stop="selectRepo(repo)">
              详情
            </el-button>
            <el-button size="small" type="warning" text @click.stop="handleChatFromResult(repo)">
              <el-icon><Cpu /></el-icon> AI
            </el-button>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="totalCount > results.length && !selectedRepo" class="load-more">
        <el-button :loading="loading" @click="loadMore" size="default">
          加载更多仓库
        </el-button>
      </div>

      <!-- 无结果 -->
      <div v-if="searched && !searchError && !results.length && !loading" class="search-empty">
        <el-empty description="未找到匹配的仓库">
          <template #image>
            <el-icon :size="56" color="var(--el-text-color-placeholder)"><FolderOpened /></el-icon>
          </template>
          <el-button @click="keyword = ''; searchInputRef?.focus()" type="primary" plain>
            换个关键词试试
          </el-button>
        </el-empty>
      </div>
    </section>

    <!-- ============ 仓库详情（覆盖搜索区） ============ -->
    <section v-if="selectedRepo || detailLoading" class="detail-section">
      <div class="detail-back">
        <el-button text @click="backToResults">
          <el-icon><ArrowLeft /></el-icon> 返回搜索结果
        </el-button>
      </div>
      <!-- 骨架屏加载 -->
      <div v-if="detailLoading" class="detail-skeleton-card">
        <el-skeleton animated :throttle="300">
          <template #template>
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
              <el-skeleton-item variant="circle" style="width:40px;height:40px" />
              <div style="flex:1">
                <el-skeleton-item variant="text" style="width:40%" />
                <el-skeleton-item variant="text" style="width:60%;margin-top:6px" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0">
              <el-skeleton-item v-for="i in 4" :key="i" variant="rect" style="height:60px;border-radius:8px" />
            </div>
            <el-skeleton-item variant="text" style="width:100%;margin-bottom:8px" />
            <el-skeleton-item variant="text" style="width:100%;margin-bottom:8px" />
            <el-skeleton-item variant="text" style="width:60%" />
          </template>
        </el-skeleton>
      </div>
      <!-- 详情卡片 -->
      <RepoDetailCard v-if="selectedRepo && !detailLoading" :repo="selectedRepo" @chat="openChat" />
    </section>

    <!-- ============ 未搜索时的欢迎态 ============ -->
    <section v-if="!searched && !selectedRepo" class="explore-section">
      <div class="explore-grid" :class="{ 'single-col': !recentRepos.length }">
        <!-- 趋势栏 -->
        <TrendingList compact @select="selectRepo" @chat="handleChatFromTrending" />
        <!-- 最近浏览 -->
        <el-card v-if="recentRepos.length" class="recent-card" shadow="hover">
          <template #header>
            <div class="card-title">
              <el-icon><Clock /></el-icon> 最近浏览
            </div>
          </template>
          <div class="recent-list">
            <div
              v-for="repo in recentRepos"
              :key="repo.name"
              class="recent-item"
              @click="selectRepo(repo)"
            >
              <el-avatar :size="22" :src="repo.owner?.avatar" />
              <span class="recent-name">{{ repo.name }}</span>
              <el-icon :size="12" class="recent-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 技术栈展示 -->
      <TechStack />
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Search, Star, Share, Clock, Folder, Cpu, Setting,
  Close, ArrowLeft, ArrowRight, TrendCharts, FolderOpened,
} from '@element-plus/icons-vue'

definePageMeta({ layout: 'default' })

// 路由
const route = useRoute()

// ===== 上下文注入 =====
const setBreadcrumb = inject<(name: string, label: string) => void>('setBreadcrumbRepo', () => {})
const clearBreadcrumb = inject<() => void>('clearBreadcrumbRepo', () => {})
const openChatPanel = inject<(name: string, data?: any) => void>('openChat', () => {})

// ===== 状态 =====
const keyword = ref('')
const results = ref<any[]>([])
const totalCount = ref(0)
const searchError = ref('')
const searched = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const page = ref(1)
const selectedRepo = ref<any>(null)
const detailLoading = ref(false)
const recentRepos = ref<any[]>([])

// 输入框 Ref
const searchInputRef = ref()

// 占位符轮播
const placeholders = [
  '搜索 GitHub 仓库... 如: nuxt, tensorflow',
  '试试: stars:>1000 language:python',
  '探索 AI 开源项目...',
  '发现热门前端框架...',
]
const placeholderIndex = ref(0)
const placeholderText = computed(() => placeholders[placeholderIndex.value])

let placeholderTimer: ReturnType<typeof setInterval> | null = null

// ===== 热门标签 =====
const hotTags = [
  { label: 'Vue.js', query: 'vue', color: 'success' as const },
  { label: 'React', query: 'react', color: 'info' as const },
  { label: 'TensorFlow', query: 'tensorflow', color: 'warning' as const },
  { label: 'Rust', query: 'language:rust', color: 'danger' as const },
  { label: 'Go', query: 'language:go', color: 'info' as const },
  { label: 'LLM', query: 'llm', color: 'info' as const },
]

// ===== 生命周期 =====
onMounted(() => {
  placeholderTimer = setInterval(() => {
    placeholderIndex.value = (placeholderIndex.value + 1) % placeholders.length
  }, 4000)

  // 处理 URL query
  const q = route.query.q as string
  if (q) {
    keyword.value = q
    doSearch()
  }
})

onUnmounted(() => {
  if (placeholderTimer) clearInterval(placeholderTimer)
})

// ===== 搜索 =====
const doSearch = () => {
  if (!keyword.value.trim()) return
  searchQuery.value = keyword.value
  page.value = 1
  searched.value = true
  selectedRepo.value = null
  clearBreadcrumb()
  fetchResults()
}

const fetchResults = async () => {
  loading.value = true
  searchError.value = ''
  try {
    const data = await $fetch('/api/github/search', {
      query: { q: searchQuery.value, page: page.value, per_page: 12 },
    })
    if (page.value === 1) {
      results.value = data.items
    } else {
      results.value.push(...data.items)
    }
    totalCount.value = data.total
  } catch (err: any) {
    searchError.value = err.message || '搜索失败'
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  page.value++
  fetchResults()
}

const resetSearch = () => {
  searched.value = false
  selectedRepo.value = null
  results.value = []
  totalCount.value = 0
  keyword.value = ''
  clearBreadcrumb()
}

// 返回搜索结果列表（保留搜索状态）
const backToResults = () => {
  selectedRepo.value = null
  detailLoading.value = false
  clearBreadcrumb()
}

const quickSearch = (q: string) => {
  keyword.value = q
  doSearch()
}

// ===== 仓库选择 =====
const selectRepo = async (repo: any) => {
  const name = repo.name || repo.full_name
  detailLoading.value = true
  selectedRepo.value = null
  try {
    const data = await $fetch(`/api/github/repo/${name}`)
    selectedRepo.value = data
    detailLoading.value = false
    setBreadcrumb(name, name)
    addRecent({ name, owner: repo.owner || data.owner })
    // 滚动到详情卡片位置
    nextTick(() => {
      const el = document.querySelector('.detail-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  } catch (err: any) {
    ElMessage.error(err.message || '获取仓库详情失败')
  }
}

const openChat = (repo: any) => {
  openChatPanel(repo.name || repo.full_name, selectedRepo.value)
}

// 从趋势/搜索结果打开 AI 面板（先获取详情再打开）
const handleChatFromTrending = async (item: any) => {
  const name = item.name || item.full_name
  detailLoading.value = true
  selectedRepo.value = null
  try {
    const data = await $fetch(`/api/github/repo/${name}`)
    selectedRepo.value = data
    detailLoading.value = false
    setBreadcrumb(name, name)
    addRecent({ name, owner: item.owner || data.owner })
    openChatPanel(name, data)
  } catch (err: any) {
    detailLoading.value = false
    ElMessage.error(err.message || '获取仓库详情失败')
    openChatPanel(name, null)
  }
}

const handleChatFromResult = async (repo: any) => {
  await handleChatFromTrending(repo)
}

// ===== 最近浏览 =====
const addRecent = (repo: { name: string; owner?: any }) => {
  recentRepos.value = [
    repo,
    ...recentRepos.value.filter(r => r.name !== repo.name),
  ].slice(0, 6)
}

// ===== 工具函数 =====
const formatNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
const formatDate = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return '今天'
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}月前`
}

// ===== 搜索框焦点效果 =====
const isFocused = ref(false)
const onSearchFocus = () => { isFocused.value = true }
const onSearchBlur = () => { isFocused.value = false }
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* ============ Hero ============ */
.search-hero {
  position: relative;
  text-align: center;
  padding: 56px 24px 48px;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 300px;
  background: radial-gradient(ellipse, var(--el-color-primary-light-5) 0%, transparent 70%);
  opacity: 0.3;
  pointer-events: none;
  border-radius: 50%;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-heading {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.hero-accent {
  background: linear-gradient(135deg, var(--el-color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0 0 32px;
}

/* 搜索框 */
.hero-search-box {
  max-width: 600px;
  margin: 0 auto 24px;
}

.hero-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 6px 12px;
  transition: all 0.3s;
}

.hero-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
}

.hero-input :deep(.el-input-group__append) {
  border-radius: 0 12px 12px 0;
  background: transparent;
  border: none;
  padding: 0 4px;
}

.search-btn {
  border-radius: 8px;
  height: 40px;
  padding: 0 24px;
  font-weight: 600;
}

.search-icon {
  color: var(--el-text-color-placeholder);
}

/* 热门标签 */
.hot-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.hot-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-right: 4px;
}

.hot-tag {
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 20px;
  padding: 0 12px;
}

.hot-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 快捷入口 */
.quick-entries {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
}

.quick-entry:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* ============ 搜索结果 ============ */
.results-section {
  padding: 0 24px 32px;
}

.search-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-info strong { color: var(--el-color-primary); }

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
}

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

.result-card:nth-child(1) { animation-delay: 0.03s; }
.result-card:nth-child(2) { animation-delay: 0.08s; }
.result-card:nth-child(3) { animation-delay: 0.13s; }
.result-card:nth-child(4) { animation-delay: 0.18s; }
.result-card:nth-child(5) { animation-delay: 0.23s; }
.result-card:nth-child(6) { animation-delay: 0.28s; }

@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.result-avatar { flex-shrink: 0; }

.result-name {
  font-weight: 600;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-lang { flex-shrink: 0; }

.result-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-stat {
  display: flex;
  align-items: center;
  gap: 3px;
}

/* Hover 覆盖层 */
.result-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.dark .result-overlay {
  background: rgba(30, 30, 40, 0.92);
}

/* 桌面端 hover 显示叠层 */
@media (hover: hover) and (pointer: fine) {
  .result-card:hover .result-overlay {
    opacity: 1;
    pointer-events: auto;
  }
}

/* 移动端底部操作栏 */
.result-mobile-actions {
  display: none;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.search-empty {
  padding: 48px 0;
}

/* ============ 详情区 ============ */
.detail-section {
  padding: 0 24px 32px;
  max-width: 900px;
  margin: 0 auto;
}

.detail-skeleton-card {
  padding: 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.detail-back {
  margin-bottom: 12px;
}

/* ============ 探索区（欢迎态） ============ */
.explore-section {
  padding: 0 24px 32px;
  display: flex;
  justify-content: center;
}

.explore-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
  width: 100%;
  max-width: 1080px;
}

.explore-grid.single-col {
  grid-template-columns: 1fr;
  max-width: 700px;
}

.recent-card {
  border-radius: 12px;
  position: sticky;
  top: 76px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
}

.recent-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.recent-name {
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-arrow {
  opacity: 0;
  transition: opacity 0.15s;
}

.recent-item:hover .recent-arrow { opacity: 1; }

/* ============ 响应式 ============ */
@media (max-width: 900px) {
  .explore-grid {
    grid-template-columns: 1fr;
  }
  .results-grid {
    grid-template-columns: 1fr;
  }
  .hero-heading { font-size: 24px; }
  .hero-desc { font-size: 13px; }
  .hero-search-box { max-width: 100%; }
  .hot-tags { gap: 4px; }
  .hot-tag { font-size: 11px; padding: 0 8px; }
  .quick-entry { font-size: 12px; padding: 6px 10px; }
  .detail-section { padding: 0 12px 24px; }
  .results-section { padding: 0 12px 24px; }
  .explore-section { padding: 0 12px 24px; }
}

@media (max-width: 768px) {
  .hero-heading { font-size: 22px; }
  .search-hero { padding: 32px 16px 32px; }
  .hero-desc { font-size: 12px; margin-bottom: 20px; }

  /* 快捷入口双列 */
  .quick-entries {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .quick-entry {
    justify-content: center;
    padding: 10px 8px;
    font-size: 12px;
  }

  /* 结果卡片：隐藏叠层，显示底部操作栏 */
  .result-overlay { display: none; }
  .result-mobile-actions { display: flex; }

  .result-card:hover {
    transform: none;
  }

  /* 最近浏览：移动端显示 */
  .recent-card {
    position: static;
  }

  .explore-grid {
    gap: 12px;
  }

  .results-grid {
    gap: 8px;
  }

  .result-card {
    padding: 12px;
  }

  .search-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
