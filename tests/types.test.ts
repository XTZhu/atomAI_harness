import { describe, it, expect } from 'vitest'
import type { GitHubRepo, GitHubRepoDetail, AIChatMessage, TrendRange } from '~/types'

describe('Types validation', () => {
  it('GitHubRepo should have required fields', () => {
    const repo: GitHubRepo = {
      id: 1,
      name: 'test/repo',
      fullName: 'test/repo',
      description: 'test',
      url: 'https://github.com/test/repo',
      homepage: null,
      stars: 100,
      forks: 10,
      openIssues: 5,
      watchers: 50,
      language: 'TypeScript',
      license: 'MIT',
      topics: ['web'],
      defaultBranch: 'main',
      size: 1024,
      createdAt: '2024-01-01',
      updatedAt: '2024-06-01',
      owner: { avatar: 'https://a.com/1.png', login: 'test' },
    }
    expect(repo.name).toBe('test/repo')
    expect(repo.owner.avatar).toBeTruthy()
  })

  it('GitHubRepoDetail extends GitHubRepo with readme', () => {
    const detail: GitHubRepoDetail = {
      id: 1,
      name: 'x',
      fullName: 'x',
      description: null,
      url: '',
      homepage: null,
      stars: 0,
      forks: 0,
      openIssues: 0,
      watchers: 0,
      language: null,
      license: null,
      topics: [],
      defaultBranch: 'main',
      size: 0,
      createdAt: '',
      updatedAt: '',
      owner: { avatar: '', login: '' },
      readme: '# Hello',
    }
    expect(detail.readme).toBe('# Hello')
  })

  it('AIChatMessage should enforce valid roles', () => {
    const msg: AIChatMessage = { role: 'user', content: 'hello' }
    expect(msg.role).toBe('user')
    // @ts-expect-error type check
    const _invalid: AIChatMessage = { role: 'bot', content: 'x' }
  })

  it('TrendRange should be valid literal union', () => {
    const ranges: TrendRange[] = ['daily', 'weekly', 'monthly']
    expect(ranges).toHaveLength(3)
  })
})
