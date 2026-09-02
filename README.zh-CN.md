<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><b>中文</b></a>
</p>

# Agent Helm

> **让 ChatGPT 直接理解和操作你的本地开发环境，并在需要时指挥本地 Coding Agent 持续执行任务。**

**Agent Helm** 把 ChatGPT 与你的本地开发环境连接起来。

你仍然在 ChatGPT 中描述问题、讨论方案和检查结果，但不再需要反复复制代码、错误信息和项目上下文。ChatGPT 可以直接基于真实项目理解代码、修改文件、运行命令、查看诊断，并验证实际结果。

对于明确的工程任务，ChatGPT 可以直接完成；对于需要大量修改、构建、测试或持续执行的工作，ChatGPT 可以在理解项目和目标后，指挥你本地的 Coding Agent 执行，并在完成后重新检查真实代码、Git Diff 和测试结果。

```text
                         ChatGPT
                            │
                   理解并操作真实项目
                            │
                ┌───────────┴───────────┐
                │                       │
             直接完成              本地 Coding Agent
                │                       │
                │                    持续执行
                │                       │
                └───────────┬───────────┘
                            ▼
                       检查实际结果
```

<img width="2166" height="1498" alt="Agent Helm" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## 为什么使用 Agent Helm

### 直接基于真实项目工作

ChatGPT 面对的是你电脑上的实际项目，而不是聊天框里临时复制的一小段代码。

它可以根据任务读取相关文件和代码结构、查看诊断与 Git 状态、运行工具和命令，并基于真实结果继续工作。

### 直接完成，或者指挥 Coding Agent

不需要每个任务都启动 Coding Agent。

范围明确的修改可以由 ChatGPT 直接完成；更大的任务可以交给本地 Coding Agent 持续执行。

两种方式可以在同一项工作中自然切换。

### 结果来自真实执行

Agent Helm 不只把任务“发送出去”。

ChatGPT 可以继续读取修改后的代码、Git Diff、诊断、命令输出和测试结果，并基于实际状态检查任务是否真正完成。

### 工作上下文保持清晰

每项工作都对应明确的本地项目和执行上下文。

当使用 Worktree 或本地 Coding Agent 时，Agent Helm 会继续维护 Conversation、项目和 Agent Session 之间的关联，方便之后重新找到并继续工作。

### 本地执行有明确边界

项目和实际执行环境仍然在你的电脑上。

Agent Helm 根据授权的 Workspace、能力和权限限制本地访问；需要 Sandbox 保护的执行无法安全建立时，相关操作会被拒绝。

更完整的安全模型见 [Security Model](./docs/security.md)。

## 快速开始

安装 Agent Helm：

```bash
npm install -g agent-helm
```

运行 Setup：

```bash
agent-helm setup
```

`agent-helm setup` 是推荐的配置入口，用于完成 Agent Helm 运行所需的环境检查和连接配置。

然后进入你希望使用的项目：

```bash
cd /path/to/project
agent-helm init
agent-helm start
```

完成连接后，回到 ChatGPT 就可以直接基于这个项目工作。

### Chrome Extension

如果希望通过浏览器完成安装、连接和日常管理：

```bash
agent-helm setup chrome
```

也可以直接使用 [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions)。

### 常用命令

```bash
agent-helm status
agent-helm doctor
agent-helm stop
```

## 为实际开发工作设计

Agent Helm 的重点不是单次执行一个命令，而是让 ChatGPT 能够稳定地参与真实的软件开发过程。

一次工作可以包含：

* ChatGPT 理解项目和定位问题
* 直接修改代码并验证
* 创建或使用独立 Worktree
* 把较大的执行任务交给本地 Coding Agent
* 根据执行结果继续调整
* 检查最终代码、Diff、诊断和测试结果
* 之后重新找到这项工作并继续

Agent Helm 会维护这些操作所依赖的项目和工作上下文，而不是把不同步骤当成互不相关的一次性调用。

## Work History

Agent Helm 可以把一次工作中的 **ChatGPT Conversation、本地项目、Worktree、直接操作和 Agent Session** 关联起来。

这样，即使一项任务经历了 ChatGPT 直接修改和 Coding Agent 持续执行，也可以之后重新找到这项工作，查看实际进展并继续处理。

更完整的工作管理界面由 [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions) 和其他 Agent Helm Extensions 提供。

## 更简单的产品入口

Agent Helm 可以独立使用，也可以通过不同产品入口使用。

| 项目                                                                           | 用途                                    |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | 通过浏览器 Extension 安装、连接和管理 Agent Helm   |
| [DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt)           | 让 ChatGPT 直接操作本地环境，并在需要时指挥 DSH 持续执行任务 |

## 文档

README 只介绍 Agent Helm 的主要价值和使用方式。更完整的技术说明独立维护：

* [Architecture](./docs/architecture.md) — Agent Helm 的组件与运行架构
* [Reliability & Black-box Testing](./docs/reliability.md) — 可靠性设计和端到端黑盒验证
* [Security Model](./docs/security.md) — Workspace、执行权限、Sandbox 和安全边界
* [Configuration](./docs/configuration.md) — 配置文件、Workspace、Network 和能力配置

## 基础组件

Agent Helm 基于成熟的开源项目提供部分核心能力：

| 组件                            | 用途                                       | 项目                                                                                                  |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | 项目理解和语义能力                                | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | 本地命令 Sandbox                             | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | ChatGPT 与本地 Agent Helm 之间的 Secure MCP 连接 | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |
