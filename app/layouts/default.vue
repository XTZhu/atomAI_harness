<template>
  <div class="app-layout">
    <!-- ============ 侧边栏 ============ -->
    <!-- 移动端遮罩 -->
    <div v-if="isMobile && sidebarOpen" class="sidebar-overlay" @click="closeSidebar" />
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed && !isMobile, open: isMobile && sidebarOpen }">
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
        <div v-show="!sidebarCollapsed || isMobile" class="brand-text">
          <span class="brand-name">RepoLens</span>
          <span class="brand-tagline">AI-Powered Explorer</span>
        </div>
        <!-- 移动端关闭按钮 -->
        <button v-if="isMobile" class="sidebar-close-btn" @click.stop="closeSidebar" aria-label="关闭菜单">
          <el-icon :size="20"><Close /></el-icon>
        </button>
      </div>

      <!--  导航（展开态） -->
      <nav class="sidebar-nav" v-show="!sidebarCollapsed || isMobile">
        <div class="nav-section">
          <span class="nav-label">探索</span>
          <el-menu :default-active="currentRoute" router class="nav-menu" background-color="transparent" @select="isMobile && closeSidebar()">
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
      </nav>

      <!-- 导航（折叠态） -->
      <nav v-show="sidebarCollapsed && !isMobile" class="nav-collapsed">
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
      </nav>

      <!-- 底部操作区 -->
      <div class="sidebar-footer">
        <!-- 折叠开关 -->
        <el-tooltip :content="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'" placement="right">
          <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <el-icon :size="16" class="toggle-icon" :class="{ flipped: sidebarCollapsed }">
              <DArrowLeft />
            </el-icon>
            <span v-show="!sidebarCollapsed" class="toggle-label">收起</span>
          </button>
        </el-tooltip>

        <!-- 暗色模式 -->
        <el-tooltip :content="isDark ? '亮色模式' : '暗色模式'" placement="right">
          <button class="toggle-btn" @click="toggleDark" :class="{ 'is-icon-only': sidebarCollapsed }">
            <el-icon :size="16"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
            <span v-show="!sidebarCollapsed" class="toggle-label">{{ isDark ? '亮色' : '暗色' }}</span>
          </button>
        </el-tooltip>
      </div>
    </aside>

    <!-- ============ 主内容区 ============ -->
    <main class="main-area">
      <header class="top-bar">
        <!-- 移动端汉堡菜单 -->
        <button v-if="isMobile" class="hamburger-btn" @click="toggleSidebar" aria-label="菜单">
          <el-icon :size="20"><component :is="sidebarOpen ? Close : Menu" /></el-icon>
        </button>
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
          <el-button
            type="primary"
            :icon="Cpu"
            size="default"
            class="ai-btn"
            :aria-label="chatOpen ? '关闭 AI 助手' : '打开 AI 助手 (⌘J)'"
            @click="chatOpen = !chatOpen"
          >
            AI 分析
          </el-button>
        </div>
      </header>

      <div class="page-body">
        <slot />
        <!-- 底部技术信息 -->
        <footer class="app-footer">
          <span class="footer-text">RepoLens · AI-Powered GitHub Explorer</span>
          <span class="footer-sep">·</span>
          <span class="footer-text">Nuxt 4 + Vue 3 + Element Plus</span>
          <span class="footer-sep">·</span>
          <span class="footer-text"> 智谱 GLM · DeepSeek 提供支持</span>
        </footer>
      </div>
    </main>

    <!-- AI 聊天面板 -->
    <AIChatPanel
      :is-open="chatOpen"
      :repo-context="globalChatRepo"
      :repo-data="globalChatRepoData"
      @close="handleChatClose"
      @clear-context="handleClearContext"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Search, Moon, Sunny, TrendCharts, Cpu, ArrowRight,
  HomeFilled, Folder, DArrowLeft, Menu, Close,
} from '@element-plus/icons-vue'

const route = useRoute()
const currentRoute = computed(() => route.path)

// ===== 移动端检测 =====
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// ===== 侧边栏 =====
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)

const toggleSidebar = () => {
  if (isMobile.value) {
    sidebarOpen.value = !sidebarOpen.value
    // 移动端禁止 collapsed 状态与 open 冲突
    if (sidebarOpen.value) {
      sidebarCollapsed.value = false
    }
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

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

const handleChatClose = () => {
  chatOpen.value = false
  globalChatRepo.value = null
  globalChatRepoData.value = null
}

// 清除对话时重置上下文
const handleClearContext = () => {
  globalChatRepo.value = null
  globalChatRepoData.value = null
}

// 面包屑上下文（由页面注入）
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
  } else if (path === '/') {
    items.push({ label: '发现仓库', icon: Search })
    if (currentRepoContext.value) {
      items.push({ label: currentRepoContext.value.label, icon: Folder })
    }
  }

  return items
})

// ===== 生命周期 =====
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  const handler = (e: KeyboardEvent) => {
    // ⌘K 聚焦搜索
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const input = document.querySelector('.hero-input input') as HTMLInputElement
      input?.focus()
    }
    // ⌘J 打开/关闭 AI 面板
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault()
      chatOpen.value = !chatOpen.value
    }
    // ⌘B 折叠侧边栏
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      toggleSidebar()
    }
    // Escape 关闭 AI 面板 / 侧边栏
    if (e.key === 'Escape') {
      if (chatOpen.value) {
        chatOpen.value = false
      } else if (sidebarOpen.value) {
        closeSidebar()
      }
    }
  }
  window.addEventListener('keydown', handler)
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('keydown', handler)
  })
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
  height: 100vh;
  position: sticky;
  top: 0;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar.collapsed { width: 64px; }

/* 移动端关闭按钮 */
.sidebar-close-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
}

.sidebar-close-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  padding: 16px 12px;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  min-height: 64px;
}

.sidebar.collapsed .brand {
  padding: 16px 12px;
  justify-content: center;
}

.brand-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  transition: transform 0.25s;
  animation: brandIn 0.5s ease-out;
}

@keyframes brandIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
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
  padding: 8px 10px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.toggle-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.toggle-btn.is-icon-only {
  justify-content: center;
  padding: 8px;
}

.toggle-icon {
  transition: transform 0.25s ease;
}

.toggle-icon.flipped {
  transform: rotate(180deg);
}

.toggle-label {
  white-space: nowrap;
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

/* 移动端汉堡菜单 */
.hamburger-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.hamburger-btn:hover {
  background: var(--el-fill-color-light);
}

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

.crumb-item.clickable { cursor: pointer; }

.crumb-item.clickable:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.crumb-item.active {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.crumb-icon { flex-shrink: 0; }

.crumb-sep { margin: 0 2px; color: var(--el-border-color); }

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
  background: linear-gradient(135deg, var(--el-color-primary-light-3), #8b83f8);
}

/* ============ 页面内容 ============ */
.page-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.page-body > :first-child {
  flex: 1;
}

/* ============ 底部信息 ============ */
.app-footer {
  text-align: center;
  padding: 24px 16px 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.footer-text {
  white-space: nowrap;
}

.footer-sep {
  margin: 0 6px;
  color: var(--el-border-color);
}

/* ============ 响应式 ============ */
/* 侧边栏遮罩（移动端） */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
  animation: overlayIn 0.25s ease;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  /* 显示汉堡菜单 */
  .hamburger-btn {
    display: flex;
  }

  /* 显示侧边栏关闭按钮 */
  .sidebar-close-btn {
    display: flex;
  }

  /* 显示遮罩 */
  .sidebar-overlay {
    display: block;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 260px;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  /* 移动端不折叠 */
  .sidebar.collapsed {
    transform: translateX(-100%);
    width: 260px;
  }

  /* open 必须覆盖 collapsed */
  .sidebar.open.collapsed {
    transform: translateX(0);
  }

  .top-bar {
    padding: 8px 12px;
    gap: 8px;
  }

  .ai-btn span { display: none; }
  .ai-btn { padding: 6px 10px; min-width: auto; }
  .page-body { padding: 12px; }
  .breadcrumb-nav { font-size: 12px; }
}
</style>
