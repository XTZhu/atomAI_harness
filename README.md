# RepoLens

> 🔬 **AI-Powered GitHub Explorer** — 用 AI 洞察开源世界，搜索仓库、分析代码、追踪趋势。

[![Nuxt](https://img.shields.io/badge/Nuxt-4.4-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.14-409EFF)](https://element-plus.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## ✨ 亮点

| 模块 | 能力 |
|---|---|
| 🔍 **智能搜索** | 多维度 GitHub 仓库搜索，热门标签一键直达，搜索预览即时反馈 |
| 📊 **仓库洞察** | 完整统计面板、README 预览、语言/许可证/Topics 全维度展示 |
| 🔥 **趋势榜单** | 今日/本周/本月三级时间维度 + 12 种语言过滤 |
| 💬 **AI 分析** | 右侧滑动面板，SSE 流式逐字输出，Markdown + 代码高亮渲染 |
| 🧠 **RAG 增强** | 浏览仓库时自动注入 README 上下文，AI 精准理解代码 |
| 🌙 **暗色模式** | 一键切换，Element Plus 完整暗色主题 |

---

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 框架 | **Nuxt 4** (SSR) + **Vue 3.5** |
| UI | **Element Plus 2.14** |
| 构建 | **Vite 7** + pnpm |
| Markdown | **marked** + **highlight.js** (GitHub Dark 主题) |
| GitHub API | **Octokit 5** |
| AI 接口 | 通义千问 · 智谱 GLM · DeepSeek · Ollama |

---

## 🚀 快速开始

### 1. 环境配置

```bash
cp .env.example .env
```

编辑 `.env`:

```env
# GitHub Token: https://github.com/settings/tokens
# 权限: repo
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# AI 后端（兼容 OpenAI 接口）
AI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
AI_MODEL=qwen-plus
```

### 2. 启动

```bash
pnpm install
pnpm dev          # → http://localhost:3000
pnpm build        # 生产构建
```

### 3. 快捷键

| 快捷键 | 功能 |
|---|---|
| `⌘/Ctrl + K` | 聚焦搜索框 |
| `⌘/Ctrl + J` | 打开/关闭 AI 面板 |

---

## 📡 API

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/github/search?q=&page=&per_page=` | 搜索仓库 |
| `GET` | `/api/github/repo/:owner/:repo` | 仓库详情 + README |
| `GET` | `/api/github/trending?since=&language=` | 趋势榜单 |
| `POST` | `/api/ai/chat` | AI 流式对话 (SSE + RAG) |

---

## 📂 结构

```
server/
├── utils/
│   ├── github.ts              # Octokit 客户端
│   └── ai/provider.ts         # AI SSE 流式抽象
└── api/
    ├── github/search.get.ts
    ├── github/repo/[owner]/[repo].get.ts
    ├── github/trending.get.ts
    └── ai/chat.post.ts

app/
├── pages/
│   ├── index.vue              # 搜索 Hero + 结果 + 详情
│   ├── trending.vue           # 趋势专属页
│   └── topics.vue             # 话题广场
├── components/
│   ├── GitHubSearch.vue       # 搜索组件
│   ├── RepoDetailCard.vue     # 仓库详情
│   ├── TrendingList.vue       # 趋势列表
│   ├── AIChatPanel.vue        # AI 聊天面板
│   └── MarkdownContent.vue    # Markdown 渲染
└── layouts/default.vue        # 品牌布局 + 面包屑
```

---

## 📄 License

MIT
