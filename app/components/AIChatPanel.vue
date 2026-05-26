<template>
  <Teleport to="body">
    <div class="chat-overlay" :class="{ open: isOpen }" @click.self="closePanel">
      <div class="chat-panel" :class="{ open: isOpen }">
        <!-- ===== 面板头部 ===== -->
        <div class="chat-header">
          <div class="chat-title">
            <el-icon :size="20"><Cpu /></el-icon>
            <span>AI 代码助手</span>
            <el-tag size="small" type="warning" effect="dark" round class="model-tag">{{ aiModelName }}</el-tag>
          </div>
          <div class="chat-actions">
            <el-tooltip :content="newConversationTooltip" placement="bottom">
              <span class="action-btn-wrap">
                <el-button
                  text
                  circle
                  :disabled="!canNewConversation"
                  :class="{ 'btn-new-chat': canNewConversation }"
                  @click="newConversation"
                >
                  <el-icon :size="16"><Plus /></el-icon>
                </el-button>
              </span>
            </el-tooltip>
            <el-tooltip content="关闭面板" placement="bottom">
              <el-button text circle @click="closePanel">
                <el-icon :size="16"><Close /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- ===== 快速搜索入口 ===== -->
        <div class="chat-search-bar">
          <el-input
            v-model="searchQuery"
            size="small"
            placeholder="搜索仓库..."
            clearable
            @keyup.enter="doRepoSearch"
          >
            <template #prefix>
              <el-icon :size="14"><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- ===== 搜索结果下拉 ===== -->
        <div v-if="searchResults.length > 0" class="search-results-drop">
          <div
            v-for="r in searchResults"
            :key="r.name"
            class="search-result-item"
            @click="onSearchResultClick(r)"
          >
            <el-avatar :size="20" :src="r.owner?.avatar" />
            <span class="search-result-name">{{ r.name }}</span>
            <el-tag v-if="r.language" size="small" type="info">{{ r.language }}</el-tag>
          </div>
        </div>

        <!-- ===== 仓库上下文条 ===== -->
        <div class="chat-context-bar" :class="{ active: hasActiveRepo }">
          <template v-if="hasActiveRepo">
            <el-icon :size="15" class="context-icon"><Folder /></el-icon>
            <span class="context-repo">{{ activeSessionKey }}</span>
            <span v-if="messages.length > 0" class="context-msg-count">{{ messages.length }} 条对话</span>
            <el-button text size="small" class="context-close" @click="removeContext">
              <el-icon :size="14"><Close /></el-icon>
            </el-button>
          </template>
          <template v-else>
            <el-icon :size="15" class="context-icon idle"><InfoFilled /></el-icon>
            <span class="context-hint">选择一个仓库后点击「AI 分析」开始对话</span>
          </template>
        </div>

        <!-- ===== 仓库历史快速切换 ===== -->
        <div v-if="recentRepos.length > 0" class="repo-quick-switch">
          <span class="quick-label">最近分析：</span>
          <div class="quick-chips">
            <span
              v-for="r in recentRepos"
              :key="r.key"
              class="quick-chip"
              :class="{ active: r.key === activeSessionKey }"
              @click="switchRepo(r.key)"
            >
              {{ r.key }}
              <span class="chip-count" v-if="r.count > 0">{{ r.count }}</span>
            </span>
          </div>
        </div>

        <!-- ===== 消息列表 ===== -->
        <div ref="messageListRef" class="chat-messages">
          <!-- 欢迎态 -->
          <div v-if="messages.length === 0 && !streaming" class="chat-welcome">
            <div class="welcome-icon">
              <el-icon :size="44"><Cpu /></el-icon>
            </div>
            <h3>AI 代码分析助手</h3>
            <p v-if="hasActiveRepo">
              正在分析 <strong>{{ activeSessionKey }}</strong>，你可以问：
            </p>
            <p v-else>
              选择一个仓库后点击「AI 分析」，我可以帮你深入理解代码
            </p>
            <div class="quick-prompts">
              <el-tag
                v-for="prompt in quickPrompts"
                :key="prompt"
                class="prompt-tag"
                @click="onPromptClick(prompt)"
              >
                {{ prompt }}
              </el-tag>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="chat-message"
            :class="msg.role"
          >
            <div class="message-avatar">
              <el-icon v-if="msg.role === 'user'" :size="18"><User /></el-icon>
              <el-icon v-else :size="18"><Cpu /></el-icon>
            </div>
            <div class="message-body">
              <div v-if="msg.role === 'assistant'" class="message-content">
                <MarkdownContent :content="msg.content" />
              </div>
              <div v-else class="message-content user-content">
                {{ msg.content }}
              </div>
            </div>
          </div>

          <!-- 流式输出中 -->
          <div v-if="streaming" class="chat-message assistant">
            <div class="message-avatar">
              <el-icon :size="18"><Cpu /></el-icon>
            </div>
            <div class="message-body">
              <div class="message-content streaming-content">
                <MarkdownContent :content="streamContent" />
                <span class="cursor-blink">|</span>
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="loading && !streaming" class="chat-loading">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- ===== 输入区 ===== -->
        <div class="chat-input">
          <div v-if="streaming" class="stop-bar">
            <el-button type="warning" plain size="small" @click="stopStreaming">
              <el-icon><VideoPause /></el-icon> 停止生成
            </el-button>
            <span class="stop-hint">AI 正在生成中...</span>
          </div>

          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            :placeholder="inputPlaceholder"
            resize="none"
            :disabled="!canSend"
            @keydown.enter.exact.prevent="handleSend"
          >
            <template #suffix>
              <el-button
                v-if="!streaming"
                type="primary"
                :disabled="!inputText.trim() || !canSend"
                :loading="loading"
                circle
                size="small"
                @click="handleSend"
              >
                <el-icon><Promotion /></el-icon>
              </el-button>
            </template>
          </el-input>
          <p class="input-hint">Enter 发送 / Shift+Enter 换行</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Cpu, Close, User, Promotion, VideoPause, Folder, Plus, InfoFilled, Search } from '@element-plus/icons-vue'
import type { GitHubRepoDetail, GitHubRepo } from '~/types'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const props = defineProps<{
  isOpen: boolean
  repoContext: string | null
  repoData: GitHubRepoDetail | null
}>()

const emit = defineEmits<{ close: []; 'clear-context': [] }>()

// ===== Refs =====
const messageListRef = ref<HTMLElement>()
const inputText = ref('')
const streaming = ref(false)
const loading = ref(false)
const streamContent = ref('')
const abortController = ref<AbortController | null>(null)

// ===== 模型 =====
const config = useRuntimeConfig()
const aiModelName = computed(() => config.public.aiModel || 'AI')

// ===== 状态枚举（基于本地 activeSessionKey 而非 props.repoContext） =====
type PanelState = 'idle' | 'ready' | 'active' | 'streaming' | 'loading'
const hasActiveRepo = computed(() => !!activeSessionKey.value)
const panelState = computed<PanelState>(() => {
  if (!hasActiveRepo.value) return 'idle'
  if (streaming.value) return 'streaming'
  if (loading.value) return 'loading'
  if (messages.value.length === 0) return 'ready'
  return 'active'
})

// ===== 多仓库对话存储 =====
const conversations = ref<Map<string, ChatMessage[]>>(new Map())
const activeSessionKey = ref<string | null>(null)
const messages = ref<ChatMessage[]>([])

const saveCurrent = () => {
  const key = activeSessionKey.value
  if (key && messages.value.length > 0) {
    conversations.value.set(key, [...messages.value])
  }
}

const loadRepo = (key: string) => {
  if (streaming.value) return // 流式中不允许切换
  saveCurrent()
  activeSessionKey.value = key
  messages.value = [...(conversations.value.get(key) || [])]
  streamContent.value = ''
}

// 外部 repoContext 变化 → 自动切换
watch(() => props.repoContext, (newRepo) => {
  if (newRepo) loadRepo(newRepo)
})

// 面板打开 + 有 repo → 加载
watch(() => props.isOpen, (open) => {
  if (open && props.repoContext) loadRepo(props.repoContext)
})

// ===== 仓库搜索 =====
const searchQuery = ref('')
const searchResults = ref<GitHubRepo[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

const doRepoSearch = async () => {
  const q = searchQuery.value.trim()
  if (!q) { searchResults.value = []; return }

  try {
    const data = await $fetch<{ items: GitHubRepo[] }>('/api/github/search', {
      query: { q, per_page: 5 },
    })
    searchResults.value = data.items || []
  } catch {
    searchResults.value = []
  }
}

// 输入防抖搜索
watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!val.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(() => doRepoSearch(), 300)
})

const onSearchResultClick = async (repo: GitHubRepo) => {
  searchResults.value = []
  searchQuery.value = ''
  // 加载仓库上下文
  try {
    const detail = await $fetch<GitHubRepoDetail>(`/api/github/repo/${repo.name}`)
    // 将详情存入 conversations 的 metadata（如果有需要）
    loadRepo(repo.name)
    // 通过事件通知父组件
    window.dispatchEvent(new CustomEvent('repolens:switch-repo', { detail: { repo: repo.name, data: detail } }))
  } catch (err: any) {
    loadRepo(repo.name)
    ElMessage.warning('仓库详情加载失败，但已切换上下文')
  }
}

// ===== 最近仓库列表 =====
const recentRepos = computed(() => {
  const list: { key: string; count: number }[] = []
  for (const [key, msgs] of conversations.value.entries()) {
    if (key !== '__default__' && msgs.length > 0) {
      list.push({ key, count: msgs.length })
    }
  }
  return list.slice(0, 5)
})

// ===== 操作：新建对话 =====
const canNewConversation = computed(() =>
  panelState.value === 'ready' || panelState.value === 'active'
)

const newConversationTooltip = computed(() => {
  if (!hasActiveRepo.value) return '请先选择一个仓库'
  if (!canNewConversation.value) return 'AI 正在生成中'
  return messages.value.length > 0 ? '清空并新建对话' : '已是新对话'
})

const newConversation = () => {
  if (!hasActiveRepo.value || !canNewConversation.value) return

  if (messages.value.length === 0) {
    ElMessage.info('当前已是新对话')
    return
  }

  const key = activeSessionKey.value!
  ElMessageBox.confirm('确定清空当前仓库的对话记录？', '新建对话', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    conversations.value.set(key, [])
    messages.value = []
    streamContent.value = ''
    scrollToBottom()
  }).catch(() => {})
}

// ===== 操作：切换仓库（chip 点击） =====
const switchRepo = (key: string) => {
  if (streaming.value) return
  loadRepo(key)
  // 同步到父组件
  emit('clear-context')
  nextTick(() => {
    // 通过事件总线更新父组件的 repoContext
    window.dispatchEvent(new CustomEvent('repolens:switch-repo', { detail: { repo: key } }))
  })
}

// ===== 操作：关闭面板 / 移除上下文 =====
const closePanel = () => {
  if (streaming.value) stopStreaming()
  saveCurrent()
  emit('close')
}

const removeContext = () => {
  if (streaming.value) stopStreaming()
  saveCurrent()
  activeSessionKey.value = null
  messages.value = []
  streamContent.value = ''
  emit('clear-context')
}

// ===== 快捷提问 =====
const quickPrompts = computed(() => {
  if (hasActiveRepo.value) {
    return [
      '这个项目的主要功能是什么？',
      '代码架构是怎样的？',
      '有哪些核心模块？',
      '如何开始贡献代码？',
    ]
  }
  return [
    '搜索一个 GitHub 仓库开始分析',
    'GitHub 趋势有哪些热门项目？',
    '帮我分析一个开源项目',
  ]
})

const onPromptClick = (prompt: string) => {
  if (!hasActiveRepo.value || !canSend.value) {
    ElMessage.info('请先选择一个仓库')
    return
  }
  sendMessage(prompt)
}

// ===== 输入框 =====
const inputPlaceholder = computed(() => {
  switch (panelState.value) {
    case 'idle': return '请先选择一个仓库'
    case 'streaming': return 'AI 正在生成中...'
    case 'loading': return 'AI 正在思考...'
    default: return '输入你的问题...'
  }
})

// ===== 停止流式 =====
const stopStreaming = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  if (streamContent.value) {
    messages.value.push({ role: 'assistant', content: streamContent.value + '\n\n*[已停止生成]*' })
    saveCurrent()
  }
  streamContent.value = ''
  streaming.value = false
  loading.value = false
}

// ===== 发送消息 =====
const canSend = computed(() =>
  panelState.value !== 'idle' && panelState.value !== 'streaming' && panelState.value !== 'loading'
)

const handleSend = () => {
  if (!canSend.value || !inputText.value.trim()) return
  sendMessage(inputText.value)
  inputText.value = ''
}

const sendMessage = async (text: string) => {
  if (!canSend.value) return

  messages.value.push({ role: 'user', content: text })
  saveCurrent()
  scrollToBottom()

  const repoCtx = props.repoData ? {
    name: props.repoData.name,
    description: props.repoData.description,
    language: props.repoData.language,
    readme: props.repoData.readme || null,
  } : null

  loading.value = true
  streamContent.value = ''

  const controller = new AbortController()
  abortController.value = controller

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        repoContext: repoCtx,
      }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    streaming.value = true
    loading.value = false

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        try {
          const data = JSON.parse(trimmed.slice(6))
          if (data.type === 'token') {
            streamContent.value += data.content
            scrollToBottom()
          } else if (data.type === 'done') {
            messages.value.push({ role: 'assistant', content: data.fullText })
            saveCurrent()
            streamContent.value = ''
            streaming.value = false
            abortController.value = null
            scrollToBottom()
            return
          } else if (data.type === 'error') {
            ElMessage.error(data.message || 'AI 服务错误')
            streaming.value = false
            abortController.value = null
            return
          }
        } catch { /* skip */ }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return
    ElMessage.error(err.message || '请求失败')
    streaming.value = false
    loading.value = false
    abortController.value = null
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
/* ===== 遮罩 ===== */
.chat-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s ease;
}
.chat-overlay.open { opacity: 1; pointer-events: all; }

/* ===== 面板 ===== */
.chat-panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 480px; max-width: 100vw;
  background: var(--el-bg-color);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.chat-panel.open { transform: translateX(0); }

/* ===== Header ===== */
.chat-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.chat-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; }
.chat-actions { display: flex; gap: 2px; align-items: center; }

.model-tag { font-size: 10px; letter-spacing: 0.5px; flex-shrink: 0; }

.model-tag { font-size: 10px; letter-spacing: 0.5px; flex-shrink: 0; }

/* tooltip 包裹层 */
.action-btn-wrap { display: inline-flex; }

/* 新建对话按钮激活态 */
.btn-new-chat:hover {
  color: var(--el-color-primary) !important;
  background: var(--el-color-primary-light-9) !important;
}

/* ===== 搜索条 ===== */
.chat-search-bar {
  padding: 8px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.chat-search-bar :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  background: var(--el-fill-color-light);
}

/* 搜索结果下拉 */
.search-results-drop {
  max-height: 200px;
  overflow-y: auto;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  cursor: pointer;
  transition: background 0.15s;
}

.search-result-item:hover {
  background: var(--el-fill-color-light);
}

.search-result-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 上下文条 ===== */
.chat-context-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px;
  font-size: 13px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.2s;
}
.chat-context-bar.active {
  background: var(--el-color-primary-light-9);
  border-bottom-color: var(--el-color-primary-light-7);
}
.context-icon { color: var(--el-text-color-secondary); flex-shrink: 0; }
.chat-context-bar.active .context-icon { color: var(--el-color-primary); }
.context-icon.idle { color: var(--el-text-color-placeholder); }
.context-repo { font-weight: 600; color: var(--el-color-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.context-msg-count { font-size: 11px; color: var(--el-text-color-placeholder); flex-shrink: 0; }
.context-hint { color: var(--el-text-color-placeholder); flex: 1; }
.context-close { flex-shrink: 0; color: var(--el-text-color-secondary); }
.context-close:hover { color: var(--el-color-danger); }

/* ===== 仓库快速切换 ===== */
.repo-quick-switch {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  overflow: hidden;
}
.quick-label { font-size: 11px; color: var(--el-text-color-placeholder); flex-shrink: 0; white-space: nowrap; }
.quick-chips { display: flex; gap: 6px; overflow-x: auto; flex: 1; scrollbar-width: none; }
.quick-chips::-webkit-scrollbar { display: none; }
.quick-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 12px;
  font-size: 12px; white-space: nowrap; cursor: pointer;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  transition: all 0.15s;
  border: 1px solid transparent;
}
.quick-chip:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.quick-chip.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); border-color: var(--el-color-primary-light-5); font-weight: 600; }
.chip-count { font-size: 10px; background: var(--el-color-primary-light-5); color: #fff; padding: 0 5px; border-radius: 8px; min-width: 16px; text-align: center; }

/* ===== 消息区 ===== */
.chat-messages { flex: 1; overflow-y: auto; padding: 16px 18px; scroll-behavior: smooth; }

.chat-welcome { text-align: center; padding: 40px 16px; }
.welcome-icon {
  width: 72px; height: 72px; margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-3));
  border-radius: 18px; color: var(--el-color-primary);
}
.chat-welcome h3 { margin: 0 0 8px; font-size: 17px; }
.chat-welcome p { font-size: 13px; color: var(--el-text-color-secondary); margin: 0 0 16px; }
.chat-welcome strong { color: var(--el-color-primary); }

.quick-prompts { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.prompt-tag { cursor: pointer; transition: all 0.2s; }
.prompt-tag:hover { background: var(--el-color-primary); color: #fff; border-color: var(--el-color-primary); }

.chat-message { display: flex; gap: 10px; margin-bottom: 18px; }
.chat-message.user { flex-direction: row-reverse; }
.message-avatar {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.chat-message.user .message-avatar { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.chat-message.assistant .message-avatar { background: var(--el-color-success-light-9); color: var(--el-color-success); }

.message-body { max-width: 82%; min-width: 0; }
.message-content { padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.65; word-break: break-word; }
.user-content { background: var(--el-color-primary); color: #fff; border-bottom-right-radius: 4px; }
.chat-message.assistant .message-content { background: var(--el-fill-color); border-bottom-left-radius: 4px; }

.streaming-content { border: 1px dashed var(--el-color-primary-light-5); }

.cursor-blink { display: inline; animation: blink 1s step-end infinite; color: var(--el-color-primary); font-weight: bold; }
@keyframes blink { 50% { opacity: 0; } }

.chat-loading { display: flex; justify-content: flex-start; padding: 8px 0; }
.typing-indicator { display: flex; gap: 4px; padding: 10px 16px; background: var(--el-fill-color); border-radius: 12px; }
.typing-indicator span { width: 8px; height: 8px; background: var(--el-text-color-secondary); border-radius: 50%; animation: typing 1.4s infinite ease-in-out; }
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }

/* ===== 输入区 ===== */
.chat-input { padding: 10px 18px 14px; border-top: 1px solid var(--el-border-color-lighter); flex-shrink: 0; }
.stop-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 8px 12px; background: var(--el-color-warning-light-9); border-radius: 8px; }
.stop-hint { font-size: 12px; color: var(--el-text-color-secondary); }
.input-hint { font-size: 11px; color: var(--el-text-color-placeholder); margin: 6px 0 0; text-align: right; }

/* ===== 响应式 ===== */
@media (max-width: 520px) {
  .chat-panel { width: 100vw; }
  .chat-header { padding: 12px 14px; }
  .chat-messages { padding: 12px 14px; }
  .chat-input { padding: 8px 14px 12px; }
  .chat-welcome { padding: 24px 16px; }
  .quick-prompts { gap: 4px; }
  .prompt-tag { font-size: 11px; padding: 0 10px; }
  .chat-context-bar { padding: 8px 14px; }
  .repo-quick-switch { padding: 6px 14px; }
  .quick-chip { font-size: 11px; padding: 2px 8px; }
}
</style>
