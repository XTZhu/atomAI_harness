<template>
  <Teleport to="body">
    <div class="chat-overlay" :class="{ open: isOpen }" @click.self="close">
      <div class="chat-panel" :class="{ open: isOpen }">
        <!-- 面板头部 -->
        <div class="chat-header">
          <div class="chat-title">
            <el-icon :size="20"><Cpu /></el-icon>
            <span>AI 代码助手</span>
            <el-tag v-if="repoContext" size="small" type="info" effect="plain">
              {{ repoContext }}
            </el-tag>
          </div>
          <div class="chat-actions">
            <el-button text circle @click="clearChat">
              <el-icon><Delete /></el-icon>
            </el-button>
            <el-button text circle @click="close">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div ref="messageListRef" class="chat-messages">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="chat-welcome">
            <el-icon :size="40"><Cpu /></el-icon>
            <h3>AI 代码分析助手</h3>
            <p>我可以帮你理解仓库代码、分析架构、解答技术问题。</p>
            <div class="quick-prompts">
              <el-tag
                v-for="prompt in quickPrompts"
                :key="prompt"
                class="prompt-tag"
                @click="sendMessage(prompt)"
              >
                {{ prompt }}
              </el-tag>
            </div>
          </div>

          <!-- 消息 -->
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
              <div class="message-content">
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

        <!-- 输入区 -->
        <div class="chat-input">
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
                type="primary"
                :disabled="!inputText.trim() || streaming"
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
import { Cpu, Delete, Close, User, Promotion } from '@element-plus/icons-vue'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const props = defineProps<{
  isOpen: boolean
  repoContext: string | null
  repoData: any | null
}>()

const emit = defineEmits<{
  close: []
}>()

const messageListRef = ref<HTMLElement>()
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const streaming = ref(false)
const loading = ref(false)
const streamContent = ref('')

const quickPrompts = [
  '这个项目的主要功能是什么？',
  '代码架构是怎样的？',
  '有哪些核心模块？',
  '如何开始贡献代码？',
]

const close = () => emit('close')

const clearChat = () => {
  messages.value = []
  streamContent.value = ''
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const handleSend = () => {
  if (!inputText.value.trim() || streaming.value) return
  sendMessage(inputText.value)
  inputText.value = ''
}

const sendMessage = async (text: string) => {
  // 添加用户消息
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()

  // 构建上下文
  const repoContext = props.repoData
    ? {
        name: props.repoData.name,
        description: props.repoData.description,
        language: props.repoData.language,
        readme: props.repoData.readme || null,
      }
    : null

  // 发起流式请求
  loading.value = true
  streamContent.value = ''

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        repoContext,
      }),
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
            streamContent.value = ''
            streaming.value = false
            scrollToBottom()
            return
          } else if (data.type === 'error') {
            ElMessage.error(data.message || 'AI 服务错误')
            streaming.value = false
            return
          }
        } catch { /* skip malformed lines */ }
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || '请求失败')
    streaming.value = false
    loading.value = false
  }
}
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.chat-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  max-width: 100vw;
  background: var(--el-bg-color);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-panel.open {
  transform: translateX(0);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.chat-actions {
  display: flex;
  gap: 4px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.chat-welcome {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
}

.chat-welcome h3 {
  margin: 12px 0 8px;
  color: var(--el-text-color-primary);
}

.chat-welcome p {
  font-size: 14px;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
}

.prompt-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.prompt-tag:hover {
  background: var(--el-color-primary);
  color: #fff;
  border-color: var(--el-color-primary);
}

.chat-message {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.chat-message.user .message-avatar {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.chat-message.assistant .message-avatar {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.message-body {
  max-width: 85%;
  min-width: 0;
}

.message-content {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.user-content {
  background: var(--el-color-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-message.assistant .message-content {
  background: var(--el-fill-color);
  border-bottom-left-radius: 4px;
}

.cursor-blink {
  display: inline;
  animation: blink 1s step-end infinite;
  color: var(--el-color-primary);
  font-weight: bold;
}

@keyframes blink {
  50% { opacity: 0; }
}

.chat-loading {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 16px;
  background: var(--el-fill-color);
  border-radius: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--el-text-color-secondary);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

.chat-input {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.input-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin: 6px 0 0;
  text-align: right;
}

/* 响应式 */
@media (max-width: 520px) {
  .chat-panel {
    width: 100vw;
  }
}
</style>
