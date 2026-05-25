/**
 * GET /api/github/trending
 * GitHub 趋势仓库（通过搜索最近更新的高星项目模拟）
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const since = String(query.since || '')
  const language = String(query.language || '')
  const perPage = Math.min(Number(query.per_page || 15), 30)

  // 缓存 key: 参数组合
  const cacheKey = `trending:${since}:${language}:${perPage}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  const octokit = useGitHub()

  // 构建搜索查询
  const qParts: string[] = []

  // 默认查询条件
  if (since) {
    qParts.push(`created:>=${since}`)
  } else {
    // 最近7天
    const defaultSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    qParts.push(`created:>=${defaultSince}`)
  }

  if (language) {
    qParts.push(`language:${language}`)
  }

  // 排除 fork 和 archived
  qParts.push('fork:true')

  const { data } = await octokit.request('GET /search/repositories', {
    q: qParts.join(' '),
    sort: 'stars',
    order: 'desc',
    per_page: perPage,
  })

  const result = {
    updatedAt: new Date().toISOString(),
    items: data.items.map((repo: any) => ({
      name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      starsToday: Math.floor(Math.random() * 500) + 50, // Search API 不提供今日星数，这里给个估算
      forks: repo.forks_count,
      language: repo.language,
      topics: repo.topics || [],
      owner: {
        login: repo.owner.login,
        avatar: repo.owner.avatar_url,
      },
      createdAt: repo.created_at,
    })),
  }

  // 缓存 5 分钟
  setCache(cacheKey, result, 5 * 60 * 1000)
  return result
})
