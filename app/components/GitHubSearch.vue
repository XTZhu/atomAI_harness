<template>
  <div class="github-search">
    <el-input
      v-model="keyword"
      size="large"
      placeholder="搜索 GitHub 仓库... (如: nuxt, vue, react)"
      clearable
      @keyup.enter="search"
      @clear="clearSearch"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
      <template #append>
        <el-button :loading="loading" @click="search">
          <el-icon v-if="!loading"><Search /></el-icon>
          搜索
        </el-button>
      </template>
    </el-input>

    <!-- 搜索结果 -->
    <div v-if="results.length || searched" class="search-results">
      <div class="results-header">
        <span v-if="totalCount > 0">找到 <strong>{{ totalCount.toLocaleString() }}</strong> 个仓库</span>
        <span v-else-if="searched">未找到匹配的仓库</span>
      </div>

      <div v-for="repo in results" :key="repo.id" class="repo-item" @click="selectRepo(repo)">
        <div class="repo-header">
          <el-avatar :size="24" :src="repo.owner.avatar" />
          <span class="repo-name">{{ repo.name }}</span>
          <el-tag v-if="repo.language" size="small" type="info">{{ repo.language }}</el-tag>
        </div>
        <p class="repo-desc">{{ repo.description || '暂无描述' }}</p>
        <div class="repo-meta">
          <span><el-icon><Star /></el-icon> {{ repo.stars.toLocaleString() }}</span>
          <span><el-icon><Share /></el-icon> {{ repo.forks.toLocaleString() }}</span>
          <span v-if="repo.license">{{ repo.license }}</span>
          <span>更新于 {{ formatDate(repo.updatedAt) }}</span>
        </div>
      </div>

      <div v-if="totalCount > results.length" class="load-more">
        <el-button :loading="loading" @click="loadMore">加载更多</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Star, Share } from '@element-plus/icons-vue'

const emit = defineEmits<{
  select: [repo: any]
}>()

const route = useRoute()
const keyword = ref('')
const results = ref<any[]>([])
const totalCount = ref(0)
const searched = ref(false)
const loading = ref(false)
const page = ref(1)
const selectedRepo = ref<any>(null)

// 响应 URL query 参数（Header 快捷搜索）
watch(() => route.query.q, (newQ) => {
  if (newQ && typeof newQ === 'string') {
    keyword.value = newQ
    search()
  }
}, { immediate: true })

const search = async () => {
  if (!keyword.value.trim()) return
  loading.value = true
  searched.value = true
  page.value = 1

  try {
    const data = await $fetch('/api/github/search', {
      query: { q: keyword.value, page: 1, per_page: 10 },
    })
    results.value = data.items
    totalCount.value = data.total
  } catch (err: any) {
    ElMessage.error(err.message || '搜索失败')
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  loading.value = true
  page.value++
  try {
    const data = await $fetch('/api/github/search', {
      query: { q: keyword.value, page: page.value, per_page: 10 },
    })
    results.value.push(...data.items)
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
    page.value--
  } finally {
    loading.value = false
  }
}

const selectRepo = (repo: any) => {
  selectedRepo.value = repo
  emit('select', repo)
}

const clearSearch = () => {
  results.value = []
  totalCount.value = 0
  searched.value = false
}

const formatDate = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  if (days < 365) return `${Math.floor(days / 30)} 个月前`
  return `${Math.floor(days / 365)} 年前`
}
</script>

<style scoped>
.github-search {
  width: 100%;
}

.search-results {
  margin-top: 16px;
}

.results-header {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.repo-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.repo-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.repo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.repo-name {
  font-weight: 600;
  font-size: 15px;
  flex: 1;
}

.repo-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.repo-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.repo-meta span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.load-more {
  text-align: center;
  margin-top: 12px;
}
</style>
