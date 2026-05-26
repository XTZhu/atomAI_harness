import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'

describe('dayjs date formatting', () => {
  it('formatDate: today', () => {
    const d = dayjs().format('YYYY-MM-DD')
    const diff = dayjs().diff(dayjs(d), 'day')
    expect(diff).toBe(0)
  })

  it('formatDate: 3 days ago', () => {
    const d = dayjs().subtract(3, 'day').format('YYYY-MM-DD')
    const diff = dayjs().diff(dayjs(d), 'day')
    expect(diff).toBe(3)
  })

  it('trending since calculation: weekly', () => {
    const since = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
    expect(since).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const diff = dayjs().diff(dayjs(since), 'day')
    expect(diff).toBe(7)
  })

  it('trending since calculation: monthly', () => {
    const since = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const diff = dayjs().diff(dayjs(since), 'day')
    expect(diff).toBe(30)
  })
})

describe('Number formatting', () => {
  const formatNum = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n))

  it('should format numbers below 1000 as-is', () => {
    expect(formatNum(0)).toBe('0')
    expect(formatNum(999)).toBe('999')
  })

  it('should format numbers >= 1000 with k suffix', () => {
    expect(formatNum(1000)).toBe('1.0k')
    expect(formatNum(12345)).toBe('12.3k')
    expect(formatNum(1000000)).toBe('1000.0k')
  })
})
