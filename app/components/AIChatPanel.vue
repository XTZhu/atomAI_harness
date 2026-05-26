<template>
  <Teleport to="body">
    <div class="chat-overlay" :class="{ open: isOpen }" @click.self="closePanel">
      <div class="chat-panel" :class="{ open: isOpen }">
        <!-- 面板头部 -->
        <div class="chat-header">
          <div class="chat-title">
            <el-icon :size="20"><Cpu /></el-icon>
            <span>AI 代码助手</span>
            <el-tag size="small" type="warning" effect="dark" round class="model-tag">{{ aiModelName }}</el-tag>
          </div>
          <div class="chat-actions">
            <!-- 会话选择 -->
            <el-dropdown v-if="sessions.length > 0" trigger="click" @command="switchSession">
              <el-button text size="small" class="session-btn">
                <el-icon :size="16"><ChatLineSquare /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="s in sessions"
                    :key="s.key"
                    :command="s.key"
                    :class="{ 'is-active': s.key === activeSessionKey }"
                  >
                    <div class="session-item">
                      <span class="session-repo">{{ s.key }}</span>
                      <span class="session-count">{{ s.count }} 条</span>
                    </div>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="sessions.length > 0" divided command="__clear_all__">
                    <el-icon><Delete /></el-icon> 清除所有会话
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-tooltip content="清除当前对话" placement="bottom">
              <el-button text circle @click="clearCurrentSession">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="关闭面板" placement="bottom">
              <el-button text circle @click="closePanel">
                <el-icon><Close /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- Repo 上下文指示条 -->
        <div v-if="repoContext" class="chat-context-bar">
          <el-icon :size="14"><Folder /></el-icon>
          <span class="context-repo-name">{{ repoContext }}</span>
          <el-button text size="small" class="context-switch-btn" @click="removeContext">
            <el-icon :size="12"><Close /></el-icon>
          </el-button>
        </div>

        <!-- 消息列表 -->
        <div ref="messageListRef" class="chat-messages">
          <!-- 欢迎态 -->
          <div v-if="messages.length === 0 && !streaming" class="chat-welcome">
            <div class="welcome-icon">
              <el-icon :size="44"><Cpu /></el-icon>
            </div>
            <h3>AI 代码分析助手</h3>
            <p v-if="repoContext">
              正在分析 <strong>{{ repoContext }}</strong>，你可以问：
            </p>
            <p v-else>
              选择一个仓库后点击「AI 分析」，我可以帮你深入理解代码
            </p>
            <div class="quick-prompts">
              <el-tag
                v-for="prompt in currentPrompts"
                :key="prompt"
                class="prompt-tag"
                @click="sendMessage(prompt)"
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

          <!-- 加载中（等待首 token） -->
          <div v-if="loading && !streaming" class="chat-loading">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-input">
          <!-- 停止生成按钮 -->
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
            placeholder="输入你的问题..."
            resize="none"
            :disabled="streaming"
            @keydown.enter.exact.prevent="handleSend"
          >
            <template #suffix>
              <el-button
                v-if="!streaming"
                type="primary"
                :disabled="!inputText.trim()"
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
import { Cpu, Delete, Close, User, Promotion, VideoPause, ChatLineSquare, Folder } from '@element-plus/icons-vue'
import type { AIChatMessage, SSEEvent, GitHubRepoDetail } from '~/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const props = defineProps<{
  isOpen: boolean
  repoContext: string | null
  repoData: GitHubRepoDetail | null
}>()

const emit = defineEmits<{
  close: []
  'clear-context': []
}>()

const messageListRef = ref<HTMLElement>()
const inputText = ref('')
const streaming = ref(false)
const loading = ref(false)
const streamContent = ref('')
const abortController = ref<AbortController | null>(null)

// ===== 模型名称 =====
const config = useRuntimeConfig()
const aiModelName = computed(() => config.public.aiModel || 'AI')

// ===== 多仓库会话管理 =====
type SessionStore = Map<string, ChatMessage[]>
const sessionStore = ref<SessionStore>(new Map())
const activeSessionKey = ref<string | null>(null)

// 当前激活会话的消息
const messages = ref<ChatMessage[]>([])

// 同步会话到 store
const syncToStore = () => {
  const key = activeSessionKey.value || (props.repoContext || '__default__')
  sessionStore.value.set(key, [...messages.value])
}

// 从 store 加载会话
const loadFromStore = (key: string) => {
  messages.value = [...(sessionStore.value.get(key) || [])]
}

// 所有会话列表（供下拉菜单）
const sessions = computed(() => {
  const list: { key: string; count: number }[] = []
  for (const [key, msgs] of sessionStore.value.entries()) {
    if (key !== '__default__' || msgs.length > 0) {
      list.push({ key, count: msgs.length })
    }
  }
  return list
})

// 切换到指定仓库会话
const loadSession = (key: string) => {
  // 先保存当前会话
  syncToStore()
  // 切换并加载
  activeSessionKey.value = key
  loadFromStore(key)
}

// 当外部 repoContext 变化时，自动切换会话
watch(() => props.repoContext, (newRepo) => {
  if (newRepo) {
    loadSession(newRepo)
  }
})

// 当面板打开且有 repoContext 时，确保加载会话
watch(() => props.isOpen, (open) => {
  if (open && props.repoContext) {
    loadSession(props.repoContext)
  }
})

const switchSession = (key: string) => {
  if (key === '__clear_all__') {
    sessionStore.value.clear()
    messages.value = []
    activeSessionKey.value = null
    if (props.repoContext) {
      loadSession(props.repoContext)
    }
    return
  }
  loadSession(key)
}

const clearCurrentSession = () => {
  messages.value = []
  streamContent.value = ''
  syncToStore()
}

// 根据是否有 repo 上下文切换快捷问题
const quickPrompts = computed(() => {
  if (props.repoContext) {
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

const currentPrompts = computed(() => quickPrompts.value)

// ===== 核心操作 =====
const closePanel = () => {
  emit('close')
}

const removeContext = () => {
  emit('clear-context')
}

// ===== 停止流式输出 =====
const stopStreaming = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  // 把已输出的内容作为一条消息保存
  if (streamContent.value) {
    messages.value.push({ role: 'assistant', content: streamContent.value + '\n\n*[已停止生成]*' })
    syncToStore()
  }
  streamContent.value = ''
  streaming.value = false
  loading.value = false
}

// ===== 发送消息 =====
const handleSend = () => {
  if (!inputText.value.trim() || streaming.value) return
  sendMessage(inputText.value)
  inputText.value = ''
}

const sendMessage = async (text: string) => {
  messages.value.push({ role: 'user', content: text })
  syncToStore()
  scrollToBottom()

  const repoContext = props.repoData
    ? {
        name: props.repoData.name,
        description: props.repoData.description,
        language: props.repoData.language,
        readme: props.repoData.readme || null,
      }
    : null

  loading.value = true
  streamContent.value = ''

  // 创建 AbortController
  const controller = new AbortController()
  abortController.value = controller

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        repoContext,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

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
            syncToStore()
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
    if (err.name === 'AbortError') {
      // 用户主动停止，已在 stopStreaming 中处理
      return
    }
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
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.chat-overlay.open { opacity: 1; pointer-events: all; }

/* ===== 面板 ===== */
.chat-panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 480px;
  max-width: 100vw;
  background: var(--el-bg-color);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.chat-panel.open { transform: translateX(0); }

/* ===== Header ===== */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
  flex: 1;
  min-width: 0;
}
.chat-actions { display: flex; gap: 2px; }

/* 会话按钮 */
.session-btn {
  color: var(--el-text-color-secondary);
  transition: color 0.15s;
}
.session-btn:hover { color: var(--el-color-primary); }

/* 会话下拉项 */
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 140px;
}
.session-repo {
  font-weight: 500;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.session-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

/* Repo 上下文指示条 */
.chat-context-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-color-primary-light-7);
  font-size: 13px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.context-repo-name {
  flex: 1;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.context-switch-btn {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}
.context-switch-btn:hover { color: var(--el-color-danger); }

/* 模型标签 */
.model-tag {
  font-size: 10px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* ===== 消息区 ===== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  scroll-behavior: smooth;
}

/* 欢迎态 */
.chat-welcome { text-align: center; padding: 40px 16px; }
.welcome-icon {
  width: 72px; height: 72px;
  margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-3));
  border-radius: 18px; color: var(--el-color-primary);
}
.chat-welcome h3 { margin: 0 0 8px; font-size: 17px; }
.chat-welcome p { font-size: 13px; color: var(--el-text-color-secondary); margin: 0 0 16px; }
.chat-welcome strong { color: var(--el-color-primary); }

.quick-prompts {
  display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
}
.prompt-tag {
  cursor: pointer; transition: all 0.2s;
}
.prompt-tag:hover {
  background: var(--el-color-primary); color: #fff; border-color: var(--el-color-primary);
}

/* 消息气泡 */
.chat-message { display: flex; gap: 10px; margin-bottom: 18px; }
.chat-message.user { flex-direction: row-reverse; }
.message-avatar {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.chat-message.user .message-avatar { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.chat-message.assistant .message-avatar { background: var(--el-color-success-light-9); color: var(--el-color-success); }

.message-body { max-width: 82%; min-width: 0; }
.message-content {
  padding: 10px 14px; border-radius: 14px;
  font-size: 14px; line-height: 1.65; word-break: break-word;
}
.user-content {
  background: var(--el-color-primary); color: #fff;
  border-bottom-right-radius: 4px;
}
.chat-message.assistant .message-content {
  background: var(--el-fill-color);
  border-bottom-left-radius: 4px;
}

/* 流式输出 */
.streaming-content { border: 1px dashed var(--el-color-primary-light-5); }

.cursor-blink {
  display: inline; animation: blink 1s step-end infinite;
  color: var(--el-color-primary); font-weight: bold;
}
@keyframes blink { 50% { opacity: 0; } }

/* 加载态 */
.chat-loading { display: flex; justify-content: flex-start; padding: 8px 0; }
.typing-indicator {
  display: flex; gap: 4px; padding: 10px 16px;
  background: var(--el-fill-color); border-radius: 12px;
}
.typing-indicator span {
  width: 8px; height: 8px;
  background: var(--el-text-color-secondary); border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ===== 输入区 ===== */
.chat-input {
  padding: 10px 18px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

/* 停止生成条 */
.stop-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: var(--el-color-warning-light-9);
  border-radius: 8px;
}
.stop-hint {
  font-size: 12px; color: var(--el-text-color-secondary);
}

.input-hint {
  font-size: 11px; color: var(--el-text-color-placeholder);
  margin: 6px 0 0; text-align: right;
}

/* ===== 响应式 ===== */
@media (max-width: 520px) {
  .chat-panel { width: 100vw; }
  .chat-header { padding: 12px 14px; }
  .chat-messages { padding: 12px 14px; }
  .chat-input { padding: 8px 14px 12px; }
  .chat-welcome { padding: 24px 16px; }
  .quick-prompts { gap: 4px; }
  .prompt-tag { font-size: 11px; padding: 0 10px; }
}
</style>
