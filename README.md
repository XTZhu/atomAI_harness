# RepoLens

> 🔬 **AI-Powered GitHub Explorer** — 用 AI 洞察开源世界，搜索仓库、分析代码、追踪趋势。

[![Nuxt](https://img.shields.io/badge/Nuxt-4.4-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.14-409EFF)](https://element-plus.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm)](https://pnpm.io)

---

## ✨ 核心能力

### 🔍 智能搜索与发现
- 多维度 GitHub 仓库搜索，支持 `stars:>1000`、`language:rust` 等高级语法
- 热门标签一键直达（Vue.js、React、TensorFlow、LLM…）
- 搜索预览即时反馈，结果卡片动画渐变

### 🧠 AI 驱动的代码洞察
- **AI 项目解读**：选中仓库自动生成 What / How / Why 三维总结（≤300 字）
- **AI 对话分析**：右侧滑动面板，SSE 流式逐字输出，Markdown + 代码高亮渲染
- **RAG 增强**：浏览仓库时自动注入 README 上下文，AI 精准理解代码架构
- 支持流式停止、对话历史管理、上下文快捷提问

### 📊 仓库深度剖析
- 完整统计面板（Stars / Forks / Issues / Watchers）
- README 预览（Markdown 渲染 + 代码高亮 + 图片自适应）
- 语言、许可证、默认分支、Topic 标签全维度展示
- GitHub / 项目主页直达链接

### 🔥 趋势榜单
- 今日 / 本周 / 本月三级时间维度
- 12 种主流编程语言过滤
- 热力排名（Top 3 金银铜渐变徽章）

### 📱 全平台适配
- 桌面端：侧边栏折叠 / 展开、键盘快捷键（⌘K / ⌘J / ⌘B）
- 移动端：汉堡菜单 + 遮罩层、底部操作栏、触摸友好交互
- 暗色模式：一键切换，Element Plus 完整暗色主题

---

## 🤖 大模型支持

RepoLens 兼容所有 **OpenAI 接口格式** 的 AI 服务，开箱即用：

| 模型 | API Base | 推荐模型 | 特点 |
|---|---|---|---|
| **通义千问** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | 中文理解优秀，性价比高 |
| **智谱 GLM** | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | 免费额度充足，响应快 |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-chat` | 代码能力强，成本低 |
| **Ollama** | `http://localhost:11434/v1` | `qwen2.5:7b` | 本地运行，完全离线 |

只需在 `.env` 中配置 `AI_API_BASE`、`AI_API_KEY`、`AI_MODEL` 即可切换。

---

## 🛠 技术栈

```
┌──────────────────────────────────────────────┐
│                  前端层                        │
│  Nuxt 4 (SSR) · Vue 3.5 · Element Plus 2.14  │
│  TypeScript · Vite 7 · pnpm                   │
├──────────────────────────────────────────────┤
│                  渲染层                        │
│  marked · highlight.js (GitHub Dark 主题)      │
│  SSE 流式渲染 · Markdown 自适应               │
├──────────────────────────────────────────────┤
│                  API 层                        │
│  Octokit 5 · GitHub REST API                   │
│  OpenAI 兼容 AI 接口 · 流式 SSE               │
└──────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 1. 环境配置

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# GitHub Token: https://github.com/settings/tokens
# 权限: repo
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# AI 后端（兼容 OpenAI 接口格式）
AI_API_BASE=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL=glm-4-flash
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
| `⌘/Ctrl + J` | 打开/关闭 AI 对话面板 |
| `⌘/Ctrl + B` | 折叠/展开侧边栏 |
| `Esc` | 关闭 AI 面板 / 移动端侧边栏 |

---

## 📡 API 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/github/search?q=&page=&per_page=` | 搜索仓库 |
| `GET` | `/api/github/repo/:owner/:repo` | 仓库详情 + README |
| `GET` | `/api/github/trending?since=&language=` | 趋势榜单 |
| `POST` | `/api/ai/chat` | AI 流式对话 (SSE + RAG) |
| `POST` | `/api/ai/summary` | AI 仓库总结 (非流式) |

---

## 📂 项目结构

```
.
├── app/
│   ├── pages/
│   │   ├── index.vue              # 搜索 Hero + 结果 + 详情
│   │   ├── trending.vue           # 趋势榜单专页
│   │   └── topics.vue             # 话题广场
│   ├── components/
│   │   ├── RepoDetailCard.vue     # 仓库详情（AI 解读 + 统计 + README）
│   │   ├── AIChatPanel.vue        # AI 流式对话面板
│   │   ├── TrendingList.vue       # 趋势列表（时间/语言过滤）
│   │   ├── MarkdownContent.vue    # Markdown 渲染（代码高亮 + 图片自适应）
│   │   ├── GitHubSearch.vue       # 搜索组件
│   │   └── ErrorFallback.vue      # 错误回退
│   ├── layouts/
│   │   └── default.vue            # 侧边栏 + 顶栏 + 面包屑
│   └── plugins/
│       └── error-handler.ts       # 全局错误处理
├── server/
│   ├── api/
│   │   ├── github/                # GitHub REST API 封装
│   │   └── ai/
│   │       ├── chat.post.ts       # 流式对话 (SSE)
│   │       └── summary.post.ts    # 仓库总结 (非流式)
│   └── utils/
│       ├── github.ts              # Octokit 客户端
│       ├── ai/provider.ts         # AI 流式/非流式抽象层
│       └── cache.ts               # 内存缓存
├── nuxt.config.ts                 # Nuxt 配置
├── package.json
└── .env.example
```

---

## 📄 License

MIT
