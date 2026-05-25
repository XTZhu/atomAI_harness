/**
 * GET /api/github/user/:username
 * 获取 GitHub 用户详细信息
 */
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')

  if (!username) {
    throw createError({ statusCode: 400, message: '缺少用户名参数' })
  }

  const octokit = useGitHub()

  try {
    const { data: user } = await octokit.request('GET /users/{username}', { username })

    // 获取用户仓库列表
    const { data: repos } = await octokit.request('GET /users/{username}/repos', {
      username,
      sort: 'stars',
      per_page: 10,
    })

    return {
      login: user.login,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog,
      email: user.email,
      twitter: user.twitter_username,
      url: user.html_url,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      topRepos: repos.slice(0, 5).map((r: any) => ({
        name: r.full_name,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language,
        url: r.html_url,
      })),
    }
  } catch (err: any) {
    if (err.status === 404) {
      throw createError({ statusCode: 404, message: `用户 ${username} 未找到` })
    }
    throw err
  }
})
