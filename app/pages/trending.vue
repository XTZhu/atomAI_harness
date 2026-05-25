<template>
  <div class="trending-page">
    <!-- 两栏布局 -->
    <div class="trending-layout">
      <!-- 左栏：Hero + 详情 -->
      <div class="trending-main">
        <div class="trending-hero">
          <el-icon :size="32" color="#f59e0b"><TrendCharts /></el-icon>
          <div>
            <h2>GitHub 趋势榜单</h2>
            <p>发现今日最受瞩目的开源项目</p>
          </div>
        </div>

        <!-- 选中仓库的详情（直接展示在 Hero 下方） -->
        <RepoDetailCard
          v-if="selectedRepo"
          :repo="selectedRepo"
          @chat="onChat"
        />

        <!-- 未选中时的占位提示 -->
        <div v-else class="trending-placeholder">
          <el-icon :size="28"><Folder /></el-icon>
          <span>点击右侧列表中的仓库查看详情</span>
        </div>
      </div>

      <!-- 右栏：趋势列表 -->
      <div class="trending-list-col">
        <TrendingList show-filters @select="onRepoSelect" @chat="onChat" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendCharts, Folder } from '@element-plus/icons-vue'

definePageMeta({ layout: 'default' })

const selectedRepo = ref<any>(null)
const openChatPanel = inject<(name: string, data?: any) => void>('openChat', () => {})

const onRepoSelect = async (item: any) => {
  selectedRepo.value = null
  try {
    const data = await $fetch(`/api/github/repo/${item.name}`)
    selectedRepo.value = data
    // 滚动左栏至详情卡片
    nextTick(() => {
      const el = document.querySelector('.trending-main')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  } catch (err: any) {
    ElMessage.error(err.message || '获取仓库详情失败')
  }
}

const onChat = async (item: any) => {
  try {
    const data = selectedRepo.value?.name === item.name
      ? selectedRepo.value
      : await $fetch(`/api/github/repo/${item.name}`)
    if (!selectedRepo.value || selectedRepo.value.name !== item.name) {
      selectedRepo.value = data
    }
    openChatPanel(item.name, data)
  } catch (err: any) {
    ElMessage.error(err.message || '获取仓库详情失败')
    openChatPanel(item.name, null)
  }
}
</script>

<style scoped>
.trending-page {
  max-width: 1200px;
  margin: 0 auto;
}

.trending-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

/* 左栏 */
.trending-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.trending-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 0;
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

.trending-placeholder {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  justify-content: center;
  border: 2px dashed var(--el-border-color-lighter);
  border-radius: 12px;
}

/* 右栏 */
.trending-list-col {
  position: sticky;
  top: 76px;
}

/* 响应式 */
@media (max-width: 900px) {
  .trending-layout {
    grid-template-columns: 1fr;
  }
  .trending-list-col {
    position: static;
  }
}

@media (max-width: 600px) {
  .trending-hero h2 { font-size: 18px; }
  .trending-page { padding: 0 8px; }
}
</style>
