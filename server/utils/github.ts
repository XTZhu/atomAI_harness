import { Octokit } from 'octokit'

export function useGitHub() {
  const config = useRuntimeConfig()
  const token = config.githubToken

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'GitHub Token 未配置，请在 .env 中设置 GITHUB_TOKEN',
    })
  }

  return new Octokit({ auth: token })
}
