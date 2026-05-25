/**
 * POST /api/ai/chat
 * AI 流式对话（SSE）— 集成 RAG 上下文
 *
 * Body: { messages: [{role, content}], repoContext?: { name, readme, language } }
 * Response: Server-Sent Events 流
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, repoContext } = body || {}

  if (!messages || !Array.isArray(messages)) {
    throw createError({ statusCode: 400, message: 'messages 参数缺失或格式错误' })
  }

  const config = useRuntimeConfig()
  const systemPrompt = config.aiSystemPrompt || '你是一个专业的代码分析助手。使用 Markdown 格式回答，代码块标注语言。'

  // 构建 RAG 上下文
  let systemContent = systemPrompt
  if (repoContext?.name) {
    systemContent += `\n\n## 当前仓库上下文\n`
    systemContent += `**仓库**: ${repoContext.name}\n`
    if (repoContext.language) systemContent += `**主要语言**: ${repoContext.language}\n`
    if (repoContext.description) systemContent += `**描述**: ${repoContext.description}\n`
    if (repoContext.readme) {
      // README 截断到 4000 字符避免超出上下文
      const truncatedReadme = repoContext.readme.length > 4000
        ? repoContext.readme.slice(0, 4000) + '\n...(README 内容已截断)'
        : repoContext.readme
      systemContent += `\n**README.md**:\n\`\`\`markdown\n${truncatedReadme}\n\`\`\``
    }
  }

  const allMessages = [
    { role: 'system', content: systemContent },
    ...messages,
  ]

  // 设置 SSE 响应头
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false

      // 监听客户端断开
      event.node.req.on('close', () => {
        aborted = true
      })

      function send(data: string) {
        if (!aborted) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
      }

      try {
        await streamAI(allMessages, {
          onToken(token) {
            send({ type: 'token', content: token })
          },
          onDone(fullText) {
            send({ type: 'done', fullText })
            controller.close()
          },
          onError(error) {
            send({ type: 'error', message: error.message })
            controller.close()
          },
        })
      } catch (err: any) {
        send({ type: 'error', message: err.message || 'AI 服务异常' })
        controller.close()
      }
    },
  })

  return sendStream(event, stream)
})
