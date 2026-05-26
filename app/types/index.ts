/** 共享类型定义 — 全项目复用 */

/** GitHub 仓库概要（列表/卡片用） */
export interface GitHubRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  homepage: string | null
  stars: number
  forks: number
  openIssues: number
  watchers: number
  language: string | null
  license: string | null
  topics: string[]
  defaultBranch: string
  size: number
  createdAt: string
  updatedAt: string
  starsToday?: number
  owner: {
    avatar: string
    login: string
  }
}

/** 仓库详情（含 README） */
export interface GitHubRepoDetail extends GitHubRepo {
  readme: string | null
}

/** AI 对话消息 */
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** AI 总结响应 */
export interface AISummaryResponse {
  summary: string
}

/** SSE 流式 token */
export interface SSEEvent {
  type: 'token' | 'done' | 'error'
  content?: string
  fullText?: string
  message?: string
}

/** 异步数据状态（Composable 用） */
export interface AsyncDataState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string>
  refresh: () => Promise<void>
}

/** 趋势时间范围 */
export type TrendRange = 'daily' | 'weekly' | 'monthly'

/** 语言颜色映射 */
export type LangColorMap = Record<string, string>
