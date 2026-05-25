import { Octokit } from 'octokit'

export function useGitHub() {
  const config = useRuntimeConfig()
  // process.env 优先（useRuntimeConfig 默认值在 server utils 中不可靠）
  const token = process.env.GITHUB_TOKEN || config.githubToken

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'GitHub Token 未配置，请在 .env 中设置 GITHUB_TOKEN',
    })
  }

  return new Octokit({ auth: token })
}
