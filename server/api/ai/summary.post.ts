/**
 * POST /api/ai/summary
 * 仓库 AI 总结 — 生成 300 字以内的 What/How/Why 概述
 *
 * Body: { repoContext: { name, description, language, readme } }
 * Response: { summary: string }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { repoContext } = body || {}

  if (!repoContext?.name) {
    throw createError({ statusCode: 400, message: 'repoContext.name 缺失' })
  }

  // 构建 prompt，引导 AI 从 What/How/Why 三个维度分析
  const userPrompt = `请从以下三个维度分析并总结这个 GitHub 开源仓库，总字数控制在 300 字以内，使用简洁的中文回答：

**What** — 这个项目是做什么的？
**How** — 它采用了什么技术栈或架构来实现？
**Why** — 它解决了什么问题？为什么值得关注？

仓库信息:
- 名称: ${repoContext.name}
- 描述: ${repoContext.description || '无'}
- 主要语言: ${repoContext.language || '未知'}
${repoContext.readme ? `- README 摘要: ${repoContext.readme.slice(0, 2500)}` : ''}

请直接输出总结内容，不要包含问问题或额外说明。`

  const messages = [
    {
      role: 'system' as const,
      content:
        '你是一个专业的开源项目分析助手。你擅长从多个维度简短精炼地分析 GitHub 仓库。使用中文回答，总字数不超过 300 字。',
    },
    { role: 'user' as const, content: userPrompt },
  ]

  try {
    const summary = await callAI(messages, { temperature: 0.5, maxTokens: 512 })
    return { summary }
  } catch (err: any) {
    throw createError({ statusCode: 502, message: err.message || 'AI 总结生成失败' })
  }
})
