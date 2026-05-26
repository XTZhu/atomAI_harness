/**
 * localStorage 持久化 composable
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue) as Ref<T>

  const load = () => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) data.value = JSON.parse(raw)
    } catch { /* ignore */ }
  }

  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(data.value))
    } catch { /* ignore */ }
  }

  // 初始化加载
  if (typeof window !== 'undefined') load()

  watch(data, save, { deep: true })

  return { data, load, save }
}
