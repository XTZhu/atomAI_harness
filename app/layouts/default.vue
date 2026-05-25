<template>
  <div class="app-layout">
    <!-- ============ 侧边栏 ============ -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 品牌区 -->
      <div class="brand" @click="navigateTo('/')">
        <div class="brand-icon">
          <svg viewBox="0 0 40 40" fill="none" class="brand-svg">
            <rect width="40" height="40" rx="10" fill="url(#bg)"/>
            <path d="M12 16 L20 8 L28 16 L28 30 L20 24 L12 30 Z" fill="white" opacity="0.9"/>
            <circle cx="20" cy="14" r="3" fill="white"/>
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div v-show="!sidebarCollapsed" class="brand-text">
          <span class="brand-name">RepoLens</span>
          <span class="brand-tagline">AI-Powered Explorer</span>
        </div>
        <el-button class="collapse-btn" text circle size="small" @click.stop="sidebarCollapsed = !sidebarCollapsed">
          <el-icon :size="14"><Fold /></el-icon>
        </el-button>
      </div>

      <!-- 导航 -->
      <div class="sidebar-nav" v-show="!sidebarCollapsed">
        <div class="nav-section">
          <span class="nav-label">探索</span>
          <el-menu :default-active="currentRoute" router class="nav-menu" background-color="transparent">
            <el-menu-item index="/">
              <el-icon><Search /></el-icon>
              <span>发现仓库</span>
            </el-menu-item>
            <el-menu-item index="/trending">
              <el-icon><TrendCharts /></el-icon>
              <span>趋势榜单</span>
            </el-menu-item>
          </el-menu>
        </div>
        <div class="nav-section">
          <span class="nav-label">社区</span>
          <el-menu :default-active="currentRoute" router class="nav-menu" background-color="transparent">
            <el-menu-item index="/topics">
              <el-icon><ChatLineSquare /></el-icon>
              <span>话题广场</span>
            </el-menu-item>
          </el-menu>
        </div>
      </div>

      <!-- 折叠态 -->
      <div v-show="sidebarCollapsed" class="nav-collapsed">
        <el-tooltip content="发现仓库" placement="right">
          <div class="nav-icon" :class="{ active: currentRoute === '/' }" @click="navigateTo('/')">
            <el-icon :size="22"><Search /></el-icon>
          </div>
        </el-tooltip>
        <el-tooltip content="趋势榜单" placement="right">
          <div class="nav-icon" :class="{ active: currentRoute === '/trending' }" @click="navigateTo('/trending')">
            <el-icon :size="22"><TrendCharts /></el-icon>
          </div>
        </el-tooltip>
        <el-tooltip content="话题广场" placement="right">
          <div class="nav-icon" :class="{ active: currentRoute === '/topics' }" @click="navigateTo('/topics')">
            <el-icon :size="22"><ChatLineSquare /></el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- 底部 -->
      <div class="sidebar-footer">
        <el-tooltip :content="isDark ? '亮色模式' : '暗色模式'" placement="top" v-show="!sidebarCollapsed">
          <el-button text @click="toggleDark" class="theme-btn">
            <el-icon :size="16"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
            <span>{{ isDark ? '亮色' : '暗色' }}</span>
          </el-button>
        </el-tooltip>
        <el-tooltip :content="isDark ? '亮色模式' : '暗色模式'" placement="right" v-show="sidebarCollapsed">
          <el-button text circle @click="toggleDark" class="theme-btn-icon">
            <el-icon :size="16"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </aside>

    <!-- ============ 主内容区 ============ -->
    <main class="main-area">
      <header class="top-bar">
        <!-- 面包屑 -->
        <nav class="breadcrumb-nav">
          <span
            v-for="(crumb, i) in breadcrumbs"
            :key="i"
            class="crumb-item"
            :class="{ active: i === breadcrumbs.length - 1, clickable: crumb.path }"
            @click="crumb.path && navigateTo(crumb.path)"
          >
            <el-icon v-if="crumb.icon" :size="14" class="crumb-icon"><component :is="crumb.icon" /></el-icon>
            <span>{{ crumb.label }}</span>
            <el-icon v-if="i < breadcrumbs.length - 1" :size="12" class="crumb-sep"><ArrowRight /></el-icon>
          </span>
        </nav>

        <div class="top-actions">
          <el-button type="primary" :icon="Cpu" size="default" class="ai-btn" @click="chatOpen = !chatOpen">
            AI 分析
            <el-badge v-if="chatOpen" :value="1" class="ai-dot" />
          </el-button>
        </div>
      </header>

      <div class="page-body">
        <slot />
      </div>
    </main>

    <!-- AI 聊天面板 -->
    <AIChatPanel
      :is-open="chatOpen"
      :repo-context="globalChatRepo"
      :repo-data="globalChatRepoData"
      @close="chatOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Search, Moon, Sunny, Fold, TrendCharts, ChatLineSquare, Cpu, ArrowRight,
  HomeFilled, Folder,
} from '@element-plus/icons-vue'

const route = useRoute()
const currentRoute = computed(() => route.path)

// ===== 侧边栏 =====
const sidebarCollapsed = ref(false)

// ===== 暗色模式 =====
const isDark = ref(false)
const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

// ===== AI 面板 =====
const chatOpen = ref(false)
const globalChatRepo = ref<string | null>(null)
const globalChatRepoData = ref<any>(null)

provide('openChat', (repoName: string, repoData?: any) => {
  globalChatRepo.value = repoName
  globalChatRepoData.value = repoData || null
  chatOpen.value = true
})

// 当前仓库上下文（由 index.vue 注入）
const currentRepoContext = ref<{ name: string; label: string } | null>(null)
provide('setBreadcrumbRepo', (name: string, label: string) => {
  currentRepoContext.value = { name, label }
})
provide('clearBreadcrumbRepo', () => {
  currentRepoContext.value = null
})

// ===== 动态面包屑 =====
const breadcrumbs = computed(() => {
  const items: { label: string; path?: string; icon?: any }[] = [
    { label: 'RepoLens', path: '/', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', style: 'width:14px;height:14px' }, [
      h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' }),
      h('polyline', { points: '9 22 9 12 15 12 15 22', stroke: 'currentColor', fill: 'none', 'stroke-width': '2' }),
    ]) },
  ]

  const path = route.path

  if (path === '/trending') {
    items.push({ label: '趋势榜单', icon: TrendCharts })
  } else if (path === '/topics') {
    items.push({ label: '话题广场', icon: ChatLineSquare })
  } else if (path === '/') {
    items.push({ label: '发现仓库', icon: Search })
    // 如果有选中的仓库上下文
    if (currentRepoContext.value) {
      items.push({ label: currentRepoContext.value.label, icon: Folder })
    }
  }

  return items
})

// ===== 快捷键 =====
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      // 聚焦搜索框？待实现
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault()
      chatOpen.value = !chatOpen.value
    }
  }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})
</script>

<style scoped>
/* ============ 布局 ============ */
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

/* ============ 侧边栏 ============ */
.sidebar {
  width: 220px;
  min-height: 100vh;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  flex-shrink: 0;
}

.sidebar.collapsed { width: 64px; }

/* Brand */
.brand {
  display: flex;
  align-items: center;
  padding: 18px 16px;
  gap: 10px;
  position: relative;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.brand-icon {
  flex-shrink: 0;
  transition: transform 0.25s;
}

.brand:hover .brand-icon { transform: scale(1.08) rotate(-5deg); }

.brand-svg { display: block; }

.brand-text {
  overflow: hidden;
  line-height: 1.2;
}

.brand-name {
  display: block;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, var(--el-color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-tagline {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.collapse-btn {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.brand:hover .collapse-btn { opacity: 1; }

/* 导航 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.nav-collapsed {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  gap: 6px;
}

.nav-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
}

.nav-icon:hover { background: var(--el-fill-color-light); color: var(--el-color-primary); }
.nav-icon.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }

.nav-section { margin-bottom: 6px; }

.nav-label {
  display: block;
  padding: 6px 18px 2px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--el-text-color-placeholder);
}

.nav-menu {
  border-right: none !important;
}

.nav-menu :deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 2px 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.nav-menu :deep(.el-menu-item.is-active) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 底部 */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.theme-btn {
  width: 100%;
  justify-content: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.theme-btn:hover { color: var(--el-color-primary); }

.theme-btn-icon {
  width: 100%;
  color: var(--el-text-color-secondary);
}

/* ============ 主内容区 ============ */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ============ 顶栏 ============ */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 9;
  gap: 16px;
}

/* ============ 面包屑 ============ */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.crumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s;
}

.crumb-item.clickable {
  cursor: pointer;
}

.crumb-item.clickable:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.crumb-item.active {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.crumb-icon { flex-shrink: 0; }

.crumb-sep {
  margin: 0 2px;
  color: var(--el-border-color);
}

/* ============ 操作按钮 ============ */
.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ai-btn {
  border-radius: 8px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--el-color-primary), #6366f1);
  border: none;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
  transition: all 0.2s;
}

.ai-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
  background: linear-gradient(135deg, var(--el-color-primary-light-1), #7c7ff6);
}

.ai-dot { margin-left: 4px; }

/* ============ 页面内容 ============ */
.page-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
