/**
 * 全局客户端错误处理
 * 捕获未处理的 Promise rejection 和全局错误
 */
export default defineNuxtPlugin(() => {
  // 全局 fetch 错误处理
  const originalFetch = globalThis.$fetch

  globalThis.$fetch = async function patchedFetch(request: any, opts?: any) {
    try {
      return await originalFetch(request, opts)
    } catch (err: any) {
      // 网络断开
      if (err.message?.includes('fetch') || err.message?.includes('network') || err.name === 'TypeError') {
        ElMessage.error('网络连接异常，请检查网络后重试')
      }
      throw err
    }
  } as any

  // 全局 Vue 错误
  const app = useNuxtApp()
  app.vueApp.config.errorHandler = (err: any, instance, info) => {
    console.error('[RepoLens Error]', info, err)
  }
})
