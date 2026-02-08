# Claudecode

<p align="center">
  <img src="resources/claude-logo.png" alt="Claudecode Logo" width="128" height="128">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-%3E%3D1.98.0-blue?style=flat-square&logo=visual-studio-code" alt="VS Code">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square" alt="License">
</p>

AI 智能编程助手 VSCode 扩展，基于 Claude Code SDK，支持自定义模型和 API 接入。

<p align="center">
  <img src="resources/screenshot-chat.png" alt="聊天界面" width="400">
</p>

---

## 功能

- **自定义模型** — 配置任意 API Key、Base URL、模型 ID
- **流式对话** — 实时流式输出，Markdown 渲染
- **工具调用** — 文件读写、终端命令、内容搜索、网页搜索、批量编辑
- **会话管理** — 多会话、历史记录、消息队列
- **拖拽附件** — 图片拖入作为附件，文件拖入插入路径
- **追加规则** — 自定义指令模板，每次对话自动追加
- **MCP 扩展** — 支持 Model Context Protocol 工具

## 快速开始

```bash
git clone https://github.com/crispvibe/Claudecode.git
cd Claudecode
pnpm install
pnpm build
pnpm package
```

在 VSCode 中通过 **扩展 → 从 VSIX 安装** 安装生成的 `.vsix` 文件。

### 配置

1. 点击侧边栏 Claudecode 图标 → 设置
2. 输入 API Key 和 Base URL
3. 添加自定义模型（模型 ID + 显示名称）
4. 开始对话

## 开发

```bash
pnpm dev          # 热更新开发
pnpm build        # 构建
pnpm package      # 打包 VSIX
```

环境要求：Node.js >= 18, pnpm >= 8, VSCode >= 1.98

**技术栈**：TypeScript + Vue 3 + Vite + esbuild + Claude Agent SDK

## 鸣谢

基于 [Claudix](https://github.com/Haleclipse/Claudix) 二次开发，感谢原作者 [Haleclipse](https://github.com/Haleclipse)。

## 许可证

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) — 基于 [Claudix](https://github.com/Haleclipse/Claudix) © Haleclipse
