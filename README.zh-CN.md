<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><b>中文</b></a>
</p>

# Agent Helm

> **让 ChatGPT 真正进入你的本地开发环境。理解项目、直接完成工程工作，并在需要时指挥你本地的 Coding Agent。**

Agent Helm 通过 **Secure MCP** 把 ChatGPT 与你授权的本地项目连接起来。

你仍然在 ChatGPT 里描述问题、讨论方案和检查结果，但不再需要反复复制代码、错误信息和项目背景。ChatGPT 可以直接了解项目当前状态、修改文件、运行工具和命令，并检查实际结果。

当任务更大或需要持续执行时，ChatGPT 还可以把工作交给你本地的 Coding Agent，完成后再回来继续检查和处理。

```text
                         ChatGPT
                  理解 · 推理 · 工作 · Review
                            │
                       Secure MCP
                            │
                            ▼
                        Agent Helm
                     /              \
                    /                \
               直接完成工作        本地 Coding Agent
                    \                /
                     \              /
                      授权的本地项目
                            │
                         Sandbox
```

**项目和实际执行环境在你的电脑上。**

ChatGPT 工作时，Agent Helm 会通过 MCP 返回完成当前任务所需的信息，例如相关文件内容、错误信息、项目状态和命令输出。

本地操作基于你授权的项目和权限执行，并受到 Sandbox 保护。需要的安全保护不可用时，相关操作会被拒绝。

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## 快速开始

安装并配置 Agent Helm：

```bash
npm install -g agent-helm
agent-helm setup
```

进入你希望使用的项目：

```bash
cd /path/to/project
agent-helm init
agent-helm start
```

完成连接后，继续在 ChatGPT 里工作即可。

浏览器集成：

```bash
agent-helm setup chrome
```

也可以直接使用 [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions)。

常用命令：

```bash
agent-helm status
agent-helm doctor
agent-helm stop
```

## ChatGPT 直接工作

ChatGPT 可以直接通过 Agent Helm：

- 理解当前项目
- 查找和读取文件
- 修改内容
- 运行工具和命令
- 检查错误和运行结果
- 验证任务结果

不需要为了让 ChatGPT 理解项目，反复把大量上下文手工复制进 Conversation。

## 使用本地 Coding Agent

较大、耗时或者需要持续执行的任务，可以交给你本地已有的 Coding Agent。

```text
ChatGPT
   │
   ▼
Agent Helm
   │
   ├── 直接完成任务
   │
   └── 本地 Coding Agent
             │
             ▼
          持续执行
             │
             ▼
        ChatGPT 检查结果
```

Agent 完成后，ChatGPT 可以重新检查项目中的实际结果，再继续修改、验证或者进行下一步。

一项工作可以自然地在：

**ChatGPT 直接处理 → 本地 Agent 持续执行 → ChatGPT 检查并继续**

之间切换。

## 本地项目与 ChatGPT 之间会传递什么

项目文件、Git 状态、工具和命令都以你的本地环境为准。

ChatGPT 通过 Agent Helm 工作时，Agent Helm 会通过 MCP 返回完成当前任务所需要的信息，包括：

- 相关文件内容
- 错误和诊断信息
- 项目状态
- Git 信息
- 命令输出
- 完成当前任务需要的其他内容

## 安全边界

Agent Helm 在你授权的本地项目范围内工作，文件访问和工程操作受到相应的权限限制。

在支持的环境中，本地命令运行在 Sandbox 中，对文件、命令、环境变量和网络等本地资源的访问进行限制。

需要的安全保护不可用时，相关操作会被拒绝。

通过 Agent Helm 使用的本地 Coding Agent 同样遵循当前项目的工作范围和执行限制。

**在当前测试覆盖范围内未发现安全问题，但仍建议谨慎使用。**

## Work History

Agent Helm Work History 会把一次工作中的 ChatGPT Conversation、本地项目、直接操作和 Agent Session 关联起来。

你可以查看：

- 这项工作来自哪个 ChatGPT Conversation
- 使用的是哪个项目 / Worktree
- ChatGPT 已经完成了什么
- 是否使用过本地 Agent
- 对应的 Agent Session
- Agent 后续完成了什么
- 最近发生了什么

这样，一项持续较久的工作可以随时重新找到并继续处理。

## Chrome Extension

[**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions) 提供浏览器里的安装、配置和操作面板，可以管理连接、项目和本地 Agent，并查看当前工作的执行情况。

如果已经安装 Agent Helm，可以运行：

```bash
agent-helm setup chrome
```

完成浏览器连接。

## 基础组件

Agent Helm 的部分能力使用成熟的开源项目：

| 组件 | 用途 | 项目 |
| --- | --- | --- |
| **Serena** | 项目理解和语义能力 | [oraios/serena](https://github.com/oraios/serena) |
| **Anthropic Sandbox Runtime** | 本地命令 Sandbox | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client** | ChatGPT 与本地 Agent Helm 之间的 Secure MCP 连接 | [openai/tunnel-client](https://github.com/openai/tunnel-client) |

## 相关项目

Agent Helm 可以独立使用。

| 项目 | 用途 | 链接 |
| --- | --- | --- |
| **DSH with ChatGPT** | 让 ChatGPT 配合 DSH Session 持续执行较大的任务 | [DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) |
| **Agent Helm Extensions** | Chrome Extension 和其他 Agent Helm 使用界面 | [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) |

<img width="2164" height="1666" alt="dsh-pure" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

> 左下方的 dsh-plugin 是 dsh-with-chatgpt

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

> 右侧是 Chrome Extension 的 panel

## 项目状态

Agent Helm 正在持续开发中。
