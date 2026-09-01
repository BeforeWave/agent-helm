<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><b>中文</b></a>
</p>

# Agent Helm

> **让 ChatGPT 直接进入你的本地开发环境：理解真实项目、修改项目、完成工程任务、指挥你本地的 Coding Agent，同时让所有本地操作始终处于明确的权限和 Sandbox 边界之内。**

**Agent Helm** 让 ChatGPT 真正能够在你电脑上的本地项目中工作，而不再只能基于你复制进 Conversation 的代码、日志和项目背景进行推理。

你可以像平时一样在 ChatGPT 里描述问题、提出修改要求、讨论方案和 Review 结果。

ChatGPT 可以连接到你授权的本地项目，理解项目当前的真实状态，按照你的要求修改项目、完成工作，也可以指挥你本地可用的 Coding Agent 继续执行更大的任务，并在之后重新检查实际结果。

这些本地操作在明确的权限范围和 **Sandbox** 中执行，让 ChatGPT 和它调用的本地 Agent 能真正动手，同时不会获得对整台电脑的无限制访问。

```text
                         ChatGPT
                  理解 · 推理 · 工作 · 指挥
                            │
                            ▼
                        Agent Helm
                     /              \
                    /                \
               直接完成工作        本地 Coding Agent
                    \                /
                     \              /
                        权限边界
                            │
                         Sandbox
                            │
                            ▼
                     授权的 Workspace
```

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## 让 ChatGPT 操作真实的本地项目

真正的项目始终在你的电脑上。

使用 Agent Helm 以后，你不需要不断把代码、错误、日志和项目背景复制进 ChatGPT，只为了让它知道当前项目发生了什么。

ChatGPT 可以直接基于你授权的本地 Workspace 理解问题、修改项目、完成任务，并继续检查实际结果。

对于用户来说，体验很简单：

* 在 ChatGPT 里描述你想做什么
* 让 ChatGPT 理解当前项目
* 让它直接在项目上完成工作
* 需要时让它指挥本地 Coding Agent 继续执行
* 回到同一个 Conversation 继续讨论和 Review

真正重要的区别很简单：

**ChatGPT 面对的是你电脑上项目当前的真实状态，而不是聊天窗口里的一份简化副本。**

## 直接完成工作，也可以指挥本地 Agent

并不是每一个任务都需要启动一个完整的 Coding Agent。

对于明确而集中的工作，ChatGPT 可以直接通过 Agent Helm 完成。

```text
ChatGPT
   │
   ▼
Agent Helm
   │
   ▼
本地项目
```

当任务变得更大、需要持续执行，或者更适合交给 Coding Agent 时，ChatGPT 可以发现并使用你本地可用的 Agent，把任务和当前项目上下文交给它继续执行。

ChatGPT 不只是“启动一个 Agent”。

它可以围绕当前项目和当前任务指挥本地 Agent 工作，在需要时继续给出方向，并在 Agent 完成后重新回到真实项目检查结果、继续 Review，或者决定下一步。

```text
ChatGPT
   │
   ├── 理解项目
   ├── 直接完成工作
   └── 指挥本地 Agent
              │
              ▼
          Local Agent
              │
          持续执行任务
              │
              ▼
        ChatGPT Review
```

你可以先从 ChatGPT 开始，只在任务真正需要的时候再使用 Coding Agent。

Agent 完成以后，ChatGPT 可以重新读取真实项目中的结果，而不是只相信 Agent 的完成报告。

这样，一个任务可以自然地在几种工作方式之间切换：

**ChatGPT 直接处理 → 本地 Agent 持续执行 → ChatGPT 检查结果并继续工作**

而不需要你自己不断在不同工具之间重新解释项目背景和任务上下文。

## 安全地让 ChatGPT 真正动手

让 ChatGPT 操作本地项目，不应该等于把整台电脑交给它。

Agent Helm 只在你授权的本地工作环境中工作。

ChatGPT 能够访问什么、能够在哪里工作，以及本地操作可以做到什么，都受到明确的权限范围限制。

通过 Agent Helm 使用的本地 Coding Agent，同样处在这套本地工作与权限边界之内。

本地执行进一步受到 **Sandbox** 约束。

```text
ChatGPT
   │
   ▼
Agent Helm
   │
   ├── Authorized Workspace
   ├── Permission Boundary
   ├── Local Agent Delegation
   └── Sandbox
            │
            ▼
        本地项目
```

这不是简单依赖 Prompt 告诉 ChatGPT“不要访问其他地方”。

真正的限制发生在本地执行层。

在支持的环境中，Agent Helm 会让本地命令运行在 enforcing Sandbox 中。

如果某项操作无法安全执行，同时又没有可用的 enforcing Sandbox，Agent Helm 会默认 **fail closed**，而不是静默退化成无限制执行。

> **ChatGPT 可以真正进入项目工作，也可以指挥本地 Agent 完成任务，但它们能够访问什么、执行什么，仍然由明确的本地权限和 Sandbox 边界决定。**

### 使用的基础组件

Agent Helm 在部分本地能力上使用成熟的开源组件作为实现基础：

| 组件                            | 在 Agent Helm 中的作用                                   | 项目                                                                                                  |
| ----------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | 提供语义代码理解以及基于 LSP 的项目能力                              | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | 为本地命令执行提供 enforcing Sandbox                         | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | 默认用于建立 ChatGPT 与本地 Agent Helm 之间的 Secure MCP Tunnel | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |

这些组件是 Agent Helm 使用的实现 backend。

Agent Helm 在它们之上负责定义和管理本地能力边界、Workspace 隔离、权限模型、Coding Agent 委派、Setup 流程以及运行时生命周期。

安全边界也不仅停留在文档描述上。Agent Helm 源码中提供了公开、可复现的 **Security / Conformance Tests** 来验证这些约束。

## 引导式配置

Agent Helm 可能需要少量本地依赖和连接配置，但 Setup 流程会检查当前缺少什么，并引导你完成需要的步骤。

**你不需要自己查找大量安装文档、手工拼环境变量，或者研究每一个底层组件应该如何配置。**

安装 Agent Helm：

```bash
npm install -g agent-helm
```

然后运行：

```bash
agent-helm setup
```

Setup 会检查当前本地环境，并引导你完成 Agent Helm 需要的依赖、权限、Tunnel 连接以及其他配置。

能够自动完成的步骤可以由 Agent Helm 帮你处理。

必须由用户授权或者前往外部页面完成的步骤，则会给出明确的下一步操作。

### Chrome 集成

如果你希望直接从浏览器里的 ChatGPT 使用 Agent Helm：

```bash
agent-helm setup chrome
```

你也可以直接从 [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions) 开始。

Extension 会检查当前本地环境，并从浏览器中引导你进入同一套 Agent Helm 安装和连接流程。

## Workspace 与日常使用

Setup 配置的是 **Agent Helm 本身**。

你的本地项目需要单独注册为 Workspace。

在项目目录中执行：

```bash
cd /path/to/workspace
agent-helm init
```

也可以直接指定项目：

```bash
agent-helm init /path/to/workspace
```

然后启动 Agent Helm：

```bash
agent-helm start
```

查看当前运行状态：

```bash
agent-helm status
```

需要检查环境和连接问题时：

```bash
agent-helm doctor
```

停止 Agent Helm：

```bash
agent-helm stop
```

当 Agent Helm 已经启动并连接以后，你仍然像平时一样从 ChatGPT 开始工作。

## Work History

一次真实的开发工作，往往不只发生在一条命令、一个 Conversation 或一个 Agent Session 中。

ChatGPT 可能直接完成任务的一部分，也可能把另一部分交给本地 Agent；本地 Agent 可能继续执行一段时间，而你之后再回到 Conversation 继续讨论。

Agent Helm Work History 会把这些工作重新关联起来。

```text
ChatGPT Conversation
        │
        ▼
       Work
     /      \
Direct Work  Agent Sessions
```

你可以随时重新找到：

* 这项工作来自哪个 ChatGPT Conversation
* 使用的是哪个 Workspace / Worktree
* ChatGPT 已经直接完成了什么
* 是否把任务交给了本地 Agent
* 对应的是哪个 Agent Session
* Agent 后续完成了什么
* 最近又发生了什么

Work History 不是另一份聊天记录，也不只是 Agent Session 列表。

它连接的是：

**Conversation → Workspace → Direct Work → Agent Sessions → 实际工作历史**

这样，一项工作即使在 ChatGPT 和本地 Agent 之间持续很久，也可以被重新找到、继续、Review 和交接，而不会因为切换工具或离开 Conversation 就失去上下文。

## 相关项目

Agent Helm 可以完全独立使用。

你不需要提前理解或者安装其他项目。

如果你希望在 Agent Helm 之上获得不同的使用方式，可以配合下面两个项目：

| 项目                        | 说明                                                                                               | 链接                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **DSH with ChatGPT**      | 让 ChatGPT 与 DSH 一起完成更完整的开发工作流。ChatGPT 可以直接处理任务，也可以指挥真实的 DSH Session 持续执行，并在完成后重新回到真实项目继续 Review。 | [DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt)           |
| **Agent Helm Extensions** | 让浏览器里的 ChatGPT 直接进入本地开发环境，并提供 Work 和 Agent Session 的浏览器管理界面。                                     | [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) |

<img width="906" height="1078" alt="dsh-plugin-only" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## 项目状态

Agent Helm 正在持续开发中。

它解决的核心问题很简单：

> **让 ChatGPT 直接面对你电脑上的真实项目，自己完成适合直接处理的工作，并在需要时指挥你本地的 Coding Agent 持续执行；与此同时，本地访问始终受到你可以控制的权限和 Sandbox 边界约束。**
