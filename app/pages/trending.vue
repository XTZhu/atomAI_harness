<template>
  <div class="trending-page">
    <div class="trending-hero">
      <el-icon :size="32" color="#f59e0b"><TrendCharts /></el-icon>
      <div>
        <h2>GitHub 趋势榜单</h2>
        <p>发现今日最受瞩目的开源项目</p>
      </div>
    </div>

    <TrendingList show-filters @select="onRepoSelect" @chat="onChat" />

    <!-- 选中仓库的详情 -->
    <RepoDetailCard
      v-if="selectedRepo"
      :repo="selectedRepo"
      @chat="onChat"
    />
  </div>
</template>

<script setup lang="ts">
import { TrendCharts } from '@element-plus/icons-vue'

definePageMeta({ layout: 'default' })

const selectedRepo = ref<any>(null)
const openChatPanel = inject<(name: string, data?: any) => void>('openChat', () => {})

const onRepoSelect = async (item: any) => {
  selectedRepo.value = null
  try {
    const data = await $fetch(`/api/github/repo/${item.name}`)
    selectedRepo.value = data
  } catch (err: any) {
    ElMessage.error(err.message || '获取仓库详情失败')
  }
}

const onChat = (item: any) => {
  openChatPanel(item.name, selectedRepo.value)
}
</script>

<style scoped>
.trending-page {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trending-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
}

.trending-hero h2 {
  margin: 0 0 4px;
  font-size: 22px;
}

.trending-hero p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
