<template>
  <div class="topics-page">
    <el-page-header @back="navigateTo('/')">
      <template #content>
        <h2 style="margin: 0">话题广场</h2>
      </template>
    </el-page-header>

    <!-- 热门话题 -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <span class="section-title">🔥 热门话题</span>
      </template>
      <el-row :gutter="12">
        <el-col v-for="tag in hotTags" :key="tag.name" :span="8">
          <el-card class="tag-card" shadow="never" @click="onTagClick(tag.name)">
            <div class="tag-info">
              <span class="tag-name">#{{ tag.name }}</span>
              <span class="tag-count">{{ tag.count }} 条动态</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 推荐话题 -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <span class="section-title">✨ 推荐话题</span>
      </template>
      <el-space wrap>
        <el-tag
          v-for="tag in recommendedTags"
          :key="tag"
          type="info"
          size="large"
          class="topic-tag"
          @click="onTagClick(tag)"
        >
          #{{ tag }}
        </el-tag>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const hotTags = ref([
  { name: '前端开发', count: '12,340' },
  { name: '人工智能', count: '9,876' },
  { name: '开源项目', count: '7,654' },
  { name: '产品设计', count: '5,432' },
  { name: '职场分享', count: '4,567' },
  { name: '技术博客', count: '3,210' },
])

const recommendedTags = [
  'Vue3',
  'Nuxt4',
  'TypeScript',
  'ElementPlus',
  'TailwindCSS',
  'DevOps',
  '微服务',
  '跨端开发',
  '性能优化',
  'UI设计',
  '面试经验',
  '团队协作',
]

const onTagClick = (tag: string) => {
  ElMessage.info(`点击了话题 #${tag}`)
}
</script>

<style scoped>
.topics-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  margin-top: 8px;
}

.section-title {
  font-weight: 600;
  font-size: 16px;
}

.tag-card {
  cursor: pointer;
  text-align: center;
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
  transition: border-color 0.2s;
}

.tag-card:hover {
  border-color: var(--el-color-primary);
}

.tag-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-name {
  font-weight: 600;
  color: var(--el-color-primary);
}

.tag-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.topic-tag {
  cursor: pointer;
  margin: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .topics-page {
    padding: 0 4px;
  }

  :deep(.el-col-8) {
    max-width: 50%;
    flex: 0 0 50%;
  }

  .section-title {
    font-size: 14px;
  }

  .tag-name {
    font-size: 13px;
  }
}
</style>
