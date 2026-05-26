/**
 * AI Provider 抽象层 — 兼容 OpenAI 接口（通义千问 / 智谱 / DeepSeek）
 * 支持流式 SSE 输出
 */
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIStreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

/**
 * 非流式 AI 调用（用于摘要等短文本场景）
 */
export async function callAI(
  messages: AIChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const config = useRuntimeConfig()
  const apiBase = process.env.AI_API_BASE || config.aiApiBase
  const apiKey = process.env.AI_API_KEY || config.aiApiKey
  const model = process.env.AI_MODEL || config.aiModel || 'qwen-plus'

  if (!apiBase || !apiKey) {
    throw new Error('AI API 未配置，请在 .env 中设置 AI_API_BASE 和 AI_API_KEY')
  }

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? 512,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI API 错误 (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function streamAI(
  messages: AIChatMessage[],
  callbacks: AIStreamCallbacks,
  options?: { temperature?: number; maxTokens?: number },
) {
  const config = useRuntimeConfig()

  // process.env 优先（useRuntimeConfig 默认值在 server utils 中不可靠）
  const apiBase = process.env.AI_API_BASE || config.aiApiBase
  const apiKey = process.env.AI_API_KEY || config.aiApiKey
  const model = process.env.AI_MODEL || config.aiModel || 'qwen-plus'

  if (!apiBase || !apiKey) {
    callbacks.onError(new Error('AI API 未配置，请在 .env 中设置 AI_API_BASE 和 AI_API_KEY'))
    return
  }

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    callbacks.onError(new Error(`AI API 错误 (${response.status}): ${errText}`))
    return
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          callbacks.onDone(fullText)
          return
        }

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullText += content
            callbacks.onToken(content)
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    // 处理缓冲区中剩余数据
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
        try {
          const parsed = JSON.parse(trimmed.slice(6))
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullText += content
            callbacks.onToken(content)
          }
        } catch {
          /* skip */
        }
      }
    }
    callbacks.onDone(fullText)
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  }
}
