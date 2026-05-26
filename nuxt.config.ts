// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@element-plus/nuxt'],

  elementPlus: {
    icon: 'ElIcon',
    importStyle: 'css',
    themes: ['dark'],
  },

  app: {
    head: {
      title: 'RepoLens — AI-Powered GitHub Explorer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'RepoLens — 用 AI 洞察开源世界。搜索 GitHub 仓库，深入理解代码架构。' },
        { property: 'og:title', content: 'RepoLens — AI-Powered GitHub Explorer' },
        { property: 'og:description', content: '用 AI 洞察开源世界。搜索 GitHub 仓库，深入理解代码架构。' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
      ],
      link: [
        { rel: 'dns-prefetch', href: 'https://avatars.githubusercontent.com' },
        { rel: 'dns-prefetch', href: 'https://api.github.com' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  css: ['element-plus/theme-chalk/dark/css-vars.css', '~/assets/tokens.css'],

  runtimeConfig: {
    githubToken: '',
    aiApiBase: '',
    aiApiKey: '',
    aiModel: 'qwen-plus',
    aiSystemPrompt: '',
    public: {
      apiBase: '/api',
      aiModel: 'glm-4-flash',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['dayjs/plugin/*.js'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'element-plus': ['element-plus'],
            'highlight': ['highlight.js'],
          },
        },
      },
    },
  },

  experimental: {
    viewTransition: true,
  },
})
