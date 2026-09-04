<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><b>中文</b></a>
</p>

# Agent Helm

> **把浏览器里的 ChatGPT 带进你的本地开发环境。**

**Agent Helm** 让你继续使用平时的 ChatGPT，同时让它直接使用你电脑上的真实项目。

ChatGPT 可以理解项目、查找文件、修改代码、运行命令、查看 Diagnostics，并检查构建、测试和实际执行结果，不需要你反复把代码、报错和项目上下文复制进聊天框。

需要更多执行能力时，它也可以把任务交给你本地已经接入的 Coding Agent。

Agent 做完以后，ChatGPT 还能重新检查真实项目里的代码、Git Diff 和测试结果，再继续下一步。

<img width="2166" height="1498" alt="Agent Helm" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## 直接让 ChatGPT 使用本地项目

ChatGPT 面对的不再只是你复制进聊天框的一小段代码，而是当前真实项目。

它可以根据任务：

* 理解项目结构和相关内容
* 查找和读取文件
* 修改代码和配置
* 查看 Diagnostics 和 Git 状态
* 运行命令和工程工具
* 检查构建、测试和实际执行结果

很多原本需要你手工收集上下文、复制结果、再继续追问的工作，现在可以直接围绕真实项目完成。

## 需要时调用本地 Coding Agent

不是每个任务都需要启动 Coding Agent。

范围明确的工作，ChatGPT 可以直接完成。

当任务需要大量修改、构建、测试或者更长时间执行时，ChatGPT 可以在已经理解项目和任务的基础上，把工作交给本地 Coding Agent。

Agent 完成后，ChatGPT 仍然可以重新读取真实项目，检查代码、Diff、Diagnostics、命令输出和测试结果，再决定下一步。

同一项工作可以自然地在：

**ChatGPT 直接处理 → 本地 Agent 继续执行 → ChatGPT 检查结果**

之间切换。

## 检查真实结果

Agent Helm 不只是把任务发出去。

ChatGPT 可以继续查看任务执行后的真实状态，包括：

* 修改后的文件
* Git Diff
* Diagnostics
* 命令输出
* 构建结果
* 测试结果

它可以基于这些实际结果继续修改和验证，而不是只根据 Agent 的文字回复判断任务是否完成。

## 快速开始

### 安装 Agent Helm

npm 稳定版：

\`\`\`bash
npm install -g @beforewave/agent-helm
\`\`\`

macOS / Linux 从 GitHub 安装：

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh
\`\`\`

指定版本：

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh -s -- 0.1.4
\`\`\`

Windows x64：

\`\`\`powershell
irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1 | iex
\`\`\`

指定版本：

\`\`\`powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1))) -Version 0.1.4
\`\`\`

GitHub 安装入口支持 macOS 和 Windows x64。已有 Node.js 22+ 时直接复用；否则安装 Agent Helm 自己管理的 Node runtime，不修改系统 Node.js。

运行 Setup：

\`\`\`bash
agent-helm setup
\`\`\`

\`agent-helm setup\` 会完成 Agent Helm 运行所需的环境检查和连接配置。

然后进入你希望使用的项目：

\`\`\`bash
cd /path/to/project
agent-helm workspace add
agent-helm start
\`\`\`

完成连接后，回到浏览器里的 ChatGPT，就可以直接基于这个项目开始工作。

### Chrome Extension

如果希望通过浏览器完成安装、连接和日常管理：

\`\`\`bash
agent-helm setup chrome
\`\`\`

也可以使用 [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions)。

### 常用命令

\`\`\`bash
agent-helm status
agent-helm doctor
agent-helm stop
\`\`\`

## Work History

Agent Helm 可以把一次工作中的 **ChatGPT Conversation、本地项目、Worktree、ChatGPT 的直接操作和 Agent Session** 关联起来。

你可以之后重新找到一项工作，知道：

* 它来自哪个 ChatGPT Conversation
* 使用的是哪个项目 / Worktree
* ChatGPT 在本地做过什么
* 是否调用过本地 Coding Agent
* 关联的是哪个 Agent Session
* 最近发生了什么

即使一项任务在 ChatGPT 和本地 Agent 之间来回执行，也不会变成几段互相对不上的工作记录。

更完整的工作查看和管理界面由 [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions) 提供。

## 本地项目与安全

项目和实际执行环境仍然在你的电脑上。

ChatGPT 会根据当前任务获得完成工作需要的本地信息，例如相关文件、项目结构、Diagnostics、Git 状态、命令输出和测试结果。

它能够访问哪些项目、使用哪些能力、执行哪些操作，由当前授权的 Workspace、能力和权限决定。

ChatGPT 直接执行本地操作时，由 Agent Helm 提供本地权限和 Sandbox 边界。需要 Sandbox 保护的执行如果无法安全建立，相关操作会被拒绝。

任务交给本地 Coding Agent 后，则按照对应 Agent integration 自身的权限和 Sandbox 配置执行。

完整安全模型见 [Security Model](./docs/security.md)。

## 通过不同入口使用 Agent Helm

Agent Helm 可以独立使用，也可以通过不同的产品入口接入现有工作流。

### DSH with ChatGPT

[DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) 把 Agent Helm 接进 DSH。

浏览器里的 ChatGPT 可以直接使用本地项目，在需要时把任务交给原生 DSH Session；DSH 里也会提供一个轻量入口，用来查看 ChatGPT 关联的项目、本地操作和工作记录。

<img width="2164" height="1666" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

> 左下方的 `dsh-plugin` 是 DSH with ChatGPT。

### Agent Helm Chrome Extension

[Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions) 提供浏览器里的安装和管理入口。

它会把当前 ChatGPT Conversation 和对应的本地工作关联起来，让你直接查看当前项目、Worktree、ChatGPT 的本地操作、Coding Agent 和 Agent Session。

<img width="2166" height="1498" alt="Agent Helm Chrome Extension" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

> 右侧为 Agent Helm Chrome Extension 的 Side Panel。

## 文档

README 只介绍 Agent Helm 的主要价值和使用方式。更完整的技术说明见：

* [Architecture](./docs/architecture.md) — 组件与运行架构
* [Reliability & Verification](./docs/reliability.md) — 可靠性设计和端到端黑盒验证
* [Security Model](./docs/security.md) — Workspace、执行权限、Sandbox 和安全边界
* [Configuration](./docs/configuration.md) — 配置文件、Workspace、Network 和能力配置

## 基础组件

Agent Helm 基于成熟的开源项目提供部分核心能力：

| 组件                            | 用途                                       | 项目                                                                                                  |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | 项目理解和语义能力                                | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | 本地命令 Sandbox                             | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | ChatGPT 与本地 Agent Helm 之间的 Secure MCP 连接 | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |

## 项目状态

Agent Helm 正在持续开发中。
