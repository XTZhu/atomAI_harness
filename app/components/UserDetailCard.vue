<template>
  <el-card v-if="user" class="user-detail-card" shadow="hover">
    <div class="user-header">
      <el-avatar :size="64" :src="user.avatar" />
      <div class="user-info">
        <h2>{{ user.name || user.login }}</h2>
        <p class="user-login">@{{ user.login }}</p>
        <p v-if="user.bio" class="user-bio">{{ user.bio }}</p>
      </div>
    </div>

    <el-divider />

    <div class="user-meta">
      <div class="meta-item" v-if="user.company">
        <el-icon><OfficeBuilding /></el-icon>
        <span>{{ user.company }}</span>
      </div>
      <div class="meta-item" v-if="user.location">
        <el-icon><Location /></el-icon>
        <span>{{ user.location }}</span>
      </div>
      <div class="meta-item" v-if="user.blog">
        <el-icon><Link /></el-icon>
        <a :href="user.blog" target="_blank">{{ user.blog }}</a>
      </div>
      <div class="meta-item" v-if="user.twitter">
        <el-icon><ChatDotRound /></el-icon>
        <span>@{{ user.twitter }}</span>
      </div>
    </div>

    <div class="user-stats">
      <div class="user-stat-item">
        <span class="stat-num">{{ user.followers?.toLocaleString() }}</span>
        <span class="stat-label">Followers</span>
      </div>
      <div class="user-stat-item">
        <span class="stat-num">{{ user.following?.toLocaleString() }}</span>
        <span class="stat-label">Following</span>
      </div>
      <div class="user-stat-item">
        <span class="stat-num">{{ user.publicRepos?.toLocaleString() }}</span>
        <span class="stat-label">Repos</span>
      </div>
      <div class="user-stat-item">
        <span class="stat-num">{{ user.publicGists?.toLocaleString() }}</span>
        <span class="stat-label">Gists</span>
      </div>
    </div>

    <div v-if="user.topRepos?.length" class="user-repos">
      <h3>🔥 热门仓库</h3>
      <div v-for="repo in user.topRepos" :key="repo.name" class="user-repo-item">
        <div class="user-repo-name">
          <el-icon><Folder /></el-icon>
          <a :href="repo.url" target="_blank">{{ repo.name }}</a>
          <el-tag v-if="repo.language" size="small" type="info">{{ repo.language }}</el-tag>
        </div>
        <p class="user-repo-desc">{{ repo.description || '-' }}</p>
        <span class="user-repo-stars">
          <el-icon><Star /></el-icon> {{ repo.stars?.toLocaleString() }}
        </span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { OfficeBuilding, Location, Link, ChatDotRound, Folder, Star } from '@element-plus/icons-vue'

defineProps<{
  user: any
}>()
</script>

<style scoped>
.user-detail-card {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.user-info h2 {
  margin: 0;
  font-size: 20px;
}

.user-login {
  margin: 2px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.user-bio {
  margin: 4px 0 0;
  font-size: 14px;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.meta-item a {
  color: var(--el-color-primary);
}

.user-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.user-stat-item {
  flex: 1;
  text-align: center;
  padding: 10px 8px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.user-stat-item .stat-num {
  font-size: 20px;
  font-weight: 700;
  display: block;
}

.user-stat-item .stat-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.user-repos h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.user-repo-item {
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  margin-bottom: 8px;
}

.user-repo-name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.user-repo-name a {
  font-weight: 600;
  color: var(--el-color-primary);
  font-size: 14px;
}

.user-repo-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0 0 4px;
}

.user-repo-stars {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
