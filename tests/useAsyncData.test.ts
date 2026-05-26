import { describe, it, expect, vi } from 'vitest'
import { useAsyncData } from '~/composables/useAsyncData'

describe('useAsyncData', () => {
  it('should start with loading=false, error="", data=null', () => {
    const { data, loading, error } = useAsyncData(() => Promise.resolve('ok'))
    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBe('')
  })

  it('should set data on successful fetch', async () => {
    const { data, loading, refresh } = useAsyncData(() => Promise.resolve('hello'))
    await refresh()
    expect(data.value).toBe('hello')
    expect(loading.value).toBe(false)
  })

  it('should set error on failed fetch', async () => {
    const { data, error, refresh } = useAsyncData(() => Promise.reject(new Error('fail')))
    await refresh()
    expect(data.value).toBeNull()
    expect(error.value).toBe('fail')
  })

  it('should set loading=true during fetch', async () => {
    let resolve: (v: string) => void
    const promise = new Promise<string>((r) => {
      resolve = r
    })
    const { loading, refresh } = useAsyncData(() => promise)
    const p = refresh()
    expect(loading.value).toBe(true)
    resolve!('done')
    await p
    expect(loading.value).toBe(false)
  })
})
