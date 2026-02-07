# Claudecode

<p align="center">
  <img src="resources/claude-logo.png" alt="Claudecode Logo" width="128" height="128">
</p>

<p align="center">
  <a href="https://github.com/crispvibe/Claudecode"><img src="https://img.shields.io/github/stars/crispvibe/Claudecode?style=flat-square&logo=github" alt="GitHub Stars"></a>
  <img src="https://img.shields.io/badge/VS%20Code-%3E%3D1.98.0-blue?style=flat-square&logo=visual-studio-code" alt="VS Code">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square" alt="License">
</p>

<p align="center">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

---

<a id="english"></a>

## English

### Introduction

Claudecode is a powerful VSCode extension that integrates multiple AI LLMs directly into your editor. It provides an interactive chat interface, intelligent code analysis, file operations, terminal command execution, and more — making AI your true coding partner.

Unlike other AI coding assistants, Claudecode supports **multi-protocol, multi-provider** access. You can freely choose from OpenAI, Anthropic, Gemini and connect to any OpenAI API-compatible third-party service.

<p align="center">
  <img src="resources/screenshot-chat.png" alt="Claudecode Chat Interface" width="400">
  <br>
  <em>Claudecode Chat — AI-powered sidebar conversation</em>
</p>

### Features

#### Multi-Protocol AI Support

- **OpenAI Compatible** — Supports `/v1/chat/completions`, compatible with OpenAI, DeepSeek, Qwen, Moonshot, etc.
- **Anthropic Direct** — Supports `/v1/messages` for Claude models
- **Google Gemini** — Supports `/v1beta/models` for Gemini models

#### Intelligent Coding Assistant

- **Interactive Chat** — Sidebar chat with Markdown, code highlighting, LaTeX
- **Session Management** — Multiple sessions, history, restore
- **Streaming Response** — Real-time streaming output

#### Powerful Tools

- **File Read/Write** — Smart file operations with diff preview
- **Batch Edit** — Modify multiple files at once
- **Terminal Commands** — Execute commands in the editor
- **Content Search** — Grep + Glob file finder
- **Web Search** — Internet search for latest info
- **Notebook** — Jupyter Notebook support
- **MCP Tools** — Model Context Protocol extensions

#### Append Rules

- Define rules that auto-append to every message sent to AI
- Enable/disable toggle in settings
- Ships with a default rule template

#### Message Queue

- Messages sent while AI is responding are auto-queued
- Queued messages sent sequentially after AI completes
- Click to edit, reorder (up/down), or remove items
- Visual indicator above input box

#### Drag & Drop

- **Image** — Drag images into input as attachments (no Shift needed)
- **Files** — Drag non-image files to insert absolute path
- **Shift + Drag** — Insert workspace-relative `@path` mention
- **Paste** — Paste images from clipboard

#### Security & Control

- **Three Modes** — Agent (default), Normal (confirm), Plan (read-only)
- **Permission Approval** — Sensitive ops require authorization
- **Transparent Tool Calls** — All AI tool usage fully visible

### Supported AI Services

| Provider | Protocol | Streaming |
|----------|----------|:---------:|
| **OpenAI** | `/v1/chat/completions` | ✅ |
| **Anthropic** | `/v1/messages` | ✅ |
| **Gemini** | `/v1beta/models` | ✅ |

> **Tip**: Via OpenAI-compatible protocol, connect to DeepSeek, Qwen, Moonshot, Yi, Groq, Together AI, etc.

### Quick Start

```bash
git clone https://github.com/crispvibe/Claudecode.git
cd Claudecode
pnpm install
pnpm build
pnpm package
```

Install `.vsix` via **Extensions → Install from VSIX** in VSCode.

#### First Setup

1. Click Claudecode icon in Activity Bar
2. Click ⚙️ gear → Settings
3. Select Provider (OpenAI / Anthropic / Gemini)
4. Enter API Key and Base URL
5. Add custom models (optional)
6. Configure append rules (optional)
7. Start chatting

### Configuration

| Setting | Example |
|---------|---------|
| **Provider** | `openai` / `anthropic` / `gemini` |
| **API Key** | `sk-xxxx...` |
| **Base URL** | `https://api.deepseek.com` |
| **Custom Models** | ID: `gpt-4o`, Name: `GPT-4o` |
| **Append Rules** | Custom instruction template |

#### Third-Party Examples

- **DeepSeek** — `openai` + `https://api.deepseek.com` + `deepseek-chat`
- **Qwen** — `openai` + `https://dashscope.aliyuncs.com/compatible-mode` + `qwen-plus`
- **Moonshot** — `openai` + `https://api.moonshot.cn` + `moonshot-v1-128k`

### Development

```bash
pnpm dev                # HMR dev server
pnpm build              # Build all
pnpm build:extension    # Backend only
pnpm build:webview      # Frontend only
pnpm package            # Package VSIX
```

Requirements: Node.js >= 18, pnpm >= 8, VSCode >= 1.98

### Contributing

1. Fork → 2. Branch → 3. Commit → 4. Push → 5. PR

### Acknowledgements

Based on [Claudix](https://github.com/Haleclipse/Claudix) by [Haleclipse](https://github.com/Haleclipse). Thank you for the outstanding open-source work.

### License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) — Based on [Claudix](https://github.com/Haleclipse/Claudix) © Haleclipse

---

<a id="中文"></a>

## 中文

### 简介

Claudecode 是一个功能强大的 VSCode 扩展，将多种 AI 大语言模型直接集成到编辑器中。提供交互式聊天界面、智能代码分析、文件操作、终端命令执行等功能，让 AI 成为你真正的编程搭档。

支持**多协议多服务商**接入，可自由选择 OpenAI、Anthropic、Gemini，或接入任何 OpenAI API 兼容的第三方服务。

<p align="center">
  <img src="resources/screenshot-chat.png" alt="Claudecode 聊天界面" width="400">
  <br>
  <em>Claudecode 聊天界面 — 侧边栏 AI 对话</em>
</p>

### 功能特性

#### 多协议 AI 支持

- **OpenAI 兼容** — 支持 `/v1/chat/completions`，兼容 OpenAI、DeepSeek、通义千问、Moonshot 等
- **Anthropic 直连** — 支持 `/v1/messages`，Claude 系列模型
- **Google Gemini** — 支持 `/v1beta/models`，Gemini 系列模型

#### 智能编程助手

- **交互式聊天** — 侧边栏聊天，Markdown 渲染、代码高亮、LaTeX 公式
- **会话管理** — 多会话、历史记录、会话恢复
- **流式响应** — 实时流式输出

#### 强大的工具集成

- **文件读写** — 智能文件操作，差异对比预览
- **批量编辑** — 一次修改多个文件
- **终端命令** — 编辑器内执行命令
- **内容搜索** — Grep 搜索 + Glob 文件查找
- **网页搜索** — 搜索互联网获取最新信息
- **笔记本** — Jupyter Notebook 支持
- **MCP 工具** — Model Context Protocol 扩展工具

#### 追加规则

- 自定义规则，每次发送消息时自动追加到末尾
- 设置页面启用/禁用开关
- 自带默认规则模板，引导 AI 按你的习惯回答

#### 消息队列

- AI 回复中发送的消息自动排队
- AI 完成后按顺序自动发送
- 支持点击编辑、上下排序、移除
- 队列显示在输入框上方

#### 拖拽支持

- **图片** — 直接拖入图片作为附件（无需 Shift）
- **文件** — 拖入非图片文件插入绝对路径
- **Shift + 拖拽** — 插入工作区相对 `@路径` 引用
- **粘贴** — 从剪贴板粘贴图片

#### 安全与控制

- **三种模式** — Agent（默认，自动执行）、Normal（需确认）、Plan（仅规划）
- **权限审批** — 敏感操作需授权
- **工具调用透明** — 所有 AI 工具调用完全可见

### 支持的 AI 服务

| Provider | 协议 | 流式支持 |
|----------|------|:--------:|
| **OpenAI** | `/v1/chat/completions` | ✅ |
| **Anthropic** | `/v1/messages` | ✅ |
| **Gemini** | `/v1beta/models` | ✅ |

> **提示**：通过 OpenAI 兼容协议，可接入 DeepSeek、通义千问、Moonshot、零一万物、Groq、Together AI 等。

### 快速开始

```bash
git clone https://github.com/crispvibe/Claudecode.git
cd Claudecode
pnpm install
pnpm build
pnpm package
```

在 VSCode 中通过 **扩展 → 从 VSIX 安装** 安装 `.vsix` 文件。

#### 首次配置

1. 点击活动栏 Claudecode 图标
2. 点击 ⚙️ 齿轮进入设置
3. 选择 Provider（OpenAI / Anthropic / Gemini）
4. 输入 API Key 和 Base URL
5. 添加自定义模型（可选）
6. 配置追加规则（可选）
7. 开始对话

### 配置说明

| 配置项 | 示例 |
|--------|------|
| **Provider** | `openai` / `anthropic` / `gemini` |
| **API Key** | `sk-xxxx...` |
| **Base URL** | `https://api.deepseek.com` |
| **自定义模型** | ID: `gpt-4o`，名称: `GPT-4o` |
| **追加规则** | 自定义指令模板 |

#### 接入第三方服务

- **DeepSeek** — `openai` + `https://api.deepseek.com` + `deepseek-chat`
- **通义千问** — `openai` + `https://dashscope.aliyuncs.com/compatible-mode` + `qwen-plus`
- **Moonshot** — `openai` + `https://api.moonshot.cn` + `moonshot-v1-128k`

### 项目架构

```
Claudecode/
├── src/
│   ├── services/              # 后端服务层
│   │   ├── claude/            # Claude Agent 服务
│   │   └── llm/               # LLM Provider 抽象层
│   │       └── providers/     # 各 Provider 实现
│   └── webview/               # 前端 (Vue 3)
│       └── src/
│           ├── components/    # UI 组件
│           ├── pages/         # 页面
│           ├── core/          # 核心逻辑
│           └── composables/   # 组合式函数
├── resources/                 # 静态资源
└── package.json
```

**技术栈**：TypeScript + Vue 3 + Vite + esbuild + Claude Agent SDK

### 开发指南

```bash
pnpm dev                # 热更新开发
pnpm build              # 构建全部
pnpm build:extension    # 仅后端
pnpm build:webview      # 仅前端
pnpm package            # 打包 VSIX
```

环境要求：Node.js >= 18、pnpm >= 8、VSCode >= 1.98

### 贡献指南

1. Fork → 2. 创建分支 → 3. 提交 → 4. 推送 → 5. PR

### 鸣谢

本项目基于 [Claudix](https://github.com/Haleclipse/Claudix) 开源项目二次开发。感谢原作者 [Haleclipse](https://github.com/Haleclipse) 的杰出工作和开源精神。

### 许可证

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) — 基于 [Claudix](https://github.com/Haleclipse/Claudix) © Haleclipse

---

<p align="center">
  <sub>Made with ❤️ by <a href="https://github.com/crispvibe">Anna</a></sub>
</p>
