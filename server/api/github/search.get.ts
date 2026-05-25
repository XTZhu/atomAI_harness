/**
 * GET /api/github/search?q=xxx&page=1&per_page=10
 * 搜索 GitHub 仓库
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q || '')
  const page = Number(query.page || 1)
  const perPage = Math.min(Number(query.per_page || 10), 30)

  if (!q.trim()) {
    throw createError({ statusCode: 400, message: '搜索关键词不能为空' })
  }

  const octokit = useGitHub()
  const { data } = await octokit.request('GET /search/repositories', {
    q,
    page,
    per_page: perPage,
    sort: 'stars',
    order: 'desc',
  })

  return {
    total: data.total_count,
    items: data.items.map(formatRepo),
  }
})

function formatRepo(repo: any) {
  return {
    id: repo.id,
    name: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    topics: repo.topics || [],
    license: repo.license?.spdx_id || null,
    updatedAt: repo.updated_at,
    createdAt: repo.created_at,
    openIssues: repo.open_issues_count,
    watchers: repo.watchers_count,
    defaultBranch: repo.default_branch,
    owner: {
      login: repo.owner.login,
      avatar: repo.owner.avatar_url,
      url: repo.owner.html_url,
    },
  }
}
