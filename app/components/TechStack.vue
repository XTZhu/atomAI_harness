<template>
  <div class="tech-stack-section">
    <!-- 技术栈 -->
    <el-card class="tech-card" shadow="hover">
      <template #header>
        <div class="tech-header">
          <el-icon :size="18" color="#6366f1"><Setting /></el-icon>
          <span>技术栈</span>
        </div>
      </template>
      <div class="tech-grid">
        <div class="tech-item" v-for="tech in techStack" :key="tech.name">
          <div class="tech-icon" :style="{ background: tech.gradient }">
            <el-icon :size="20"><component :is="tech.icon" /></el-icon>
          </div>
          <div class="tech-info">
            <span class="tech-name">{{ tech.name }}</span>
            <span class="tech-desc">{{ tech.desc }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- AI 模型 -->
    <el-card class="tech-card ai-card" shadow="hover">
      <template #header>
        <div class="tech-header">
          <el-icon :size="18" color="#8b5cf6"><Cpu /></el-icon>
          <span>大模型支持</span>
          <el-tag size="small" type="warning" effect="dark" round>OpenAI 兼容</el-tag>
        </div>
      </template>
      <div class="model-grid">
        <div class="model-item" v-for="model in aiModels" :key="model.name">
          <div class="model-header">
            <span class="model-name">{{ model.name }}</span>
            <el-tag v-if="model.tag" size="small" :type="model.tagType" effect="plain">{{ model.tag }}</el-tag>
          </div>
          <span class="model-desc">{{ model.desc }}</span>
          <span class="model-id">{{ model.model }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Setting, Cpu, Monitor, Box, Memo, Files, Connection, Document, Link } from '@element-plus/icons-vue'

const techStack = [
  { name: 'Nuxt 4', desc: 'SSR 框架', icon: Monitor, gradient: 'linear-gradient(135deg, #00DC82, #00B86E)' },
  { name: 'Vue 3.5', desc: '响应式核心', icon: Box, gradient: 'linear-gradient(135deg, #4FC08D, #3AA876)' },
  { name: 'Element Plus', desc: 'UI 组件库', icon: Files, gradient: 'linear-gradient(135deg, #409EFF, #337ECC)' },
  { name: 'TypeScript', desc: '类型安全', icon: Memo, gradient: 'linear-gradient(135deg, #3178C6, #235A97)' },
  { name: 'Vite 7', desc: '极速构建', icon: Connection, gradient: 'linear-gradient(135deg, #646CFF, #747BFF)' },
  { name: 'Octokit 5', desc: 'GitHub API', icon: Link, gradient: 'linear-gradient(135deg, #333, #555)' },
]

const aiModels = [
  { name: '通义千问', desc: '阿里云 · 中文理解优秀', model: 'qwen-plus / qwen-max', tag: '推荐', tagType: 'success' as const },
  { name: '智谱 GLM', desc: '免费额度充足 · 响应快', model: 'glm-4-flash / glm-4-plus', tag: '免费', tagType: 'info' as const },
  { name: 'DeepSeek', desc: '代码能力强 · 成本极低', model: 'deepseek-chat / deepseek-reasoner', tag: '', tagType: 'info' as const },
  { name: 'Ollama', desc: '完全本地运行 · 离线可用', model: 'qwen2.5:7b / llama3.1:8b', tag: '本地', tagType: 'warning' as const },
]
</script>

<style scoped>
.tech-stack-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1080px;
  margin: 32px auto 0;
  padding: 0 24px 32px;
  animation: fadeInUp 0.5s ease-out both;
  animation-delay: 0.3s;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.tech-card {
  border-radius: 12px;
  overflow: hidden;
}

.tech-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

/* ===== 技术栈网格 ===== */
.tech-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.2s;
  cursor: default;
}

.tech-item:hover {
  background: var(--el-fill-color-light);
  transform: translateX(2px);
}

.tech-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.tech-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tech-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.tech-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* ===== AI 模型网格 ===== */
.model-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.model-item {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.model-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.model-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.model-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.model-id {
  font-size: 11px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .tech-stack-section {
    grid-template-columns: 1fr;
    padding: 0 12px 24px;
    margin-top: 24px;
    gap: 12px;
  }

  .tech-grid {
    grid-template-columns: 1fr;
  }

  .model-grid {
    grid-template-columns: 1fr;
  }
}
</style>
