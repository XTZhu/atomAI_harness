/**
 * 通用异步数据获取 + loading/error 状态管理
 *
 * @example
 * const { data, loading, error, refresh } = useAsyncData(() => $fetch('/api/github/repo/vue'))
 */
import { ref } from 'vue'
import type { AsyncDataState } from '~/types'

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
): AsyncDataState<T> & { data: Ref<T | null>; loading: Ref<boolean>; error: Ref<string> } {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref('')

  const refresh = async () => {
    loading.value = true
    error.value = ''
    try {
      data.value = await fetcher()
    } catch (err: any) {
      error.value = err.message || '请求失败'
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, refresh }
}
