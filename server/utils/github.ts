import { Octokit } from 'octokit'

let _octokit: Octokit | null = null

export function useGitHub(): Octokit {
  const config = useRuntimeConfig()
  const token = process.env.GITHUB_TOKEN || config.githubToken

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'GitHub Token 未配置，请在 .env 中设置 GITHUB_TOKEN',
    })
  }

  // 单例复用
  if (!_octokit) {
    _octokit = new Octokit({ auth: token })
  }

  return _octokit
}

/**
 * 带重试的 GitHub API 调用
 * 遇到 403 rate limit / 5xx 服务器错误时自动重试
 */
export async function githubRequest<T>(
  fn: (octokit: Octokit) => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  const octokit = useGitHub()
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(octokit)
    } catch (err: any) {
      lastError = err

      // 403 rate limit — 等待后重试
      if (err.status === 403 && err.response?.headers?.['retry-after']) {
        const waitSec = parseInt(err.response.headers['retry-after']) || 10
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.min(waitSec * 1000, 15000)))
          continue
        }
      }

      // 5xx 服务器错误 — 短暂等待后重试
      if (err.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      throw err
    }
  }

  throw lastError
}
