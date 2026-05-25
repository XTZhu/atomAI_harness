<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <el-card class="profile-card" shadow="hover">
      <div class="profile-header">
        <el-avatar :size="72" icon="UserFilled" />
        <div class="profile-meta">
          <h2 class="profile-name">AtomAI 用户</h2>
          <p class="profile-bio">这个人很懒，还没有填写简介...</p>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ posts }}</span>
              <span class="stat-label">帖子</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ followers }}</span>
              <span class="stat-label">关注者</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ following }}</span>
              <span class="stat-label">正在关注</span>
            </div>
          </div>
        </div>
        <el-button type="primary" plain>编辑资料</el-button>
      </div>
    </el-card>

    <!-- 设置区域 -->
    <el-card class="settings-card" shadow="hover">
      <template #header>
        <span class="section-title">⚙️ 设置</span>
      </template>
      <div class="settings-list">
        <div
          v-for="item in settings"
          :key="item.label"
          class="settings-item"
          @click="item.onClick"
        >
          <span class="settings-label">{{ item.label }}</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'

definePageMeta({ layout: 'default' })

const posts = ref(42)
const followers = ref(128)
const following = ref(56)

const settings = [
  { label: '账号与安全', onClick: () => ElMessage.info('账号与安全') },
  { label: '通知设置', onClick: () => ElMessage.info('通知设置') },
  { label: '隐私与屏蔽', onClick: () => ElMessage.info('隐私与屏蔽') },
  { label: '外观设置', onClick: () => ElMessage.info('外观设置') },
  { label: '关于 AtomAI', onClick: () => ElMessage.info('AtomAI Harness v1.0.0') },
]
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.profile-meta {
  flex: 1;
}

.profile-name {
  margin: 0 0 4px;
  font-size: 22px;
}

.profile-bio {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.profile-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: color 0.2s;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item:hover {
  color: var(--el-color-primary);
}

.section-title {
  font-weight: 600;
  font-size: 16px;
}
</style>
