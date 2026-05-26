/**
 * 全局客户端错误处理
 */
export default defineNuxtPlugin(() => {
  const app = useNuxtApp()
  app.vueApp.config.errorHandler = (err: unknown, _instance, info) => {
    console.error('[RepoLens Error]', info, err)
  }
})
