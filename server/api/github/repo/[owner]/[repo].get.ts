/**
 * GET /api/github/repo/:owner/:repo
 * 获取仓库详细信息（含 README）
 */
export default defineEventHandler(async (event) => {
  const owner = getRouterParam(event, 'owner')
  const repo = getRouterParam(event, 'repo')

  if (!owner || !repo) {
    throw createError({ statusCode: 400, message: '缺少 owner/repo 参数' })
  }

  const octokit = useGitHub()

  // 并行获取基础信息和 README
  const [repoResult, readmeResult] = await Promise.allSettled([
    octokit.request('GET /repos/{owner}/{repo}', { owner, repo }),
    octokit.request('GET /repos/{owner}/{repo}/readme', { owner, repo }),
  ])

  if (repoResult.status === 'rejected') {
    throw createError({ statusCode: 404, message: `仓库 ${owner}/${repo} 未找到` })
  }

  const repoData = repoResult.value.data
  const readmeContent = readmeResult.status === 'fulfilled'
    ? Buffer.from(readmeResult.value.data.content, 'base64').toString('utf-8')
    : null

  return {
    id: repoData.id,
    name: repoData.full_name,
    description: repoData.description,
    url: repoData.html_url,
    homepage: repoData.homepage,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    language: repoData.language,
    topics: repoData.topics || [],
    license: repoData.license?.spdx_id || null,
    updatedAt: repoData.updated_at,
    createdAt: repoData.created_at,
    openIssues: repoData.open_issues_count,
    watchers: repoData.watchers_count,
    subscribers: repoData.subscribers_count,
    defaultBranch: repoData.default_branch,
    size: repoData.size,
    archived: repoData.archived,
    readme: readmeContent,
    owner: {
      login: repoData.owner.login,
      avatar: repoData.owner.avatar_url,
      url: repoData.owner.html_url,
      type: repoData.owner.type,
    },
  }
})
