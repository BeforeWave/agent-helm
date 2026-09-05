<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><b>中文</b></a>
</p>

<div align="center">

# Agent Helm

**告别复制粘贴与 Token 额度焦虑！让网页版 ChatGPT 直连本地项目、运行代码，按需调度本地 Agent。**

[![npm](https://img.shields.io/npm/v/@beforewave/agent-helm?color=blue\&style=flat-square)](https://www.npmjs.com/package/@beforewave/agent-helm)
[![License](https://img.shields.io/github/license/BeforeWave/agent-helm?style=flat-square)](./LICENSE)

</div>

<br />
<p align="center">
<sub>
  推荐
  <a href="https://github.com/BeforeWave/agent-helm-extensions"><b>Agent Helm Extensions</b></a> · Chrome 体验
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://github.com/BeforeWave/dsh-with-chatgpt"><b>DSH with ChatGPT</b></a> · DSH 集成
</sub>
</p>
<p align="center">
  <img width="1000" alt="Agent Helm" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />
</p>

---

## 💡 为什么需要 Agent Helm？

网页版 ChatGPT 有很强的模型能力，但原本无法直接访问你的本地项目、文件和终端。处理真实工程时，代码、报错和执行结果仍要在浏览器、IDE 和终端之间反复搬运。

本地 Coding Agent 可以直接操作工程，但大量 Token 往往消耗在读取项目、理解上下文和重复推理上。

**Agent Helm** 给 ChatGPT 一套真正的本地工程能力：

* **ChatGPT 直接动手 Coding：** 读取和修改本地文件、运行终端命令、查看 Diagnostics 和 Git 状态，并执行构建与测试。
* **直接理解真实工程：** 基于项目结构、代码符号、引用关系和实际 Diagnostics 工作，不再依赖复制进聊天框的一小段上下文。
* **减少 Coding Agent Token 消耗：** 项目理解、问题分析、小型修改和结果 Review 可以直接由 ChatGPT 完成，把本地 Agent 留给真正需要持续执行的任务。
* **多 Agent 协作：** 复杂任务可以直接交给已经接入 Agent Helm 的本地 Coding Agent，完成后再由 ChatGPT 检查真实结果。
* **独立网络代理支持：** ChatGPT Tunnel 可以单独配置 HTTP / HTTPS 代理，不需要修改系统全局代理或开启全局 VPN。
* **本地权限与 Sandbox：** Workspace、执行权限、网络访问和 Sandbox 都由 Agent Helm 在本机控制。

---

## ⚡ 快速开始

### 1. 安装 Agent Helm

**macOS：**

```bash id="3hymxq"
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh
```

> 指定版本：
> `curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh -s -- 0.1.4`

**Linux（best-effort）：**

```bash id="l0vh1x"
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh
```

> 指定版本：
> `curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh -s -- 0.1.4`

**Windows x64：**

```powershell id="yfk4k0"
irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1 | iex
```

> 指定版本：
> `& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1))) -Version 0.1.4`

**npm 稳定版：**

```bash id="ytwkt3"
npm install -g @beforewave/agent-helm
```

> 指定版本：
> `npm install -g @beforewave/agent-helm@0.1.4`

一键安装会优先使用已有的 Node.js 22+；如果没有，则安装 Agent Helm 自己管理的 Node Runtime，不修改系统 Node.js。

---

### 2. 完成配置

```bash id="g2y4lf"
agent-helm setup
```

Setup 会检查当前环境，并引导完成 Agent Helm、ChatGPT Tunnel、所需依赖和网络代理配置。

ChatGPT Tunnel 支持单独设置 HTTP / HTTPS 代理，不影响系统和其他开发工具的网络配置。

---

### 3. 添加项目并启动

进入希望 ChatGPT 使用的项目：

```bash id="51u9zk"
cd /path/to/project
agent-helm workspace add
agent-helm start
```

完成后，回到浏览器里的 ChatGPT，就可以直接基于这个项目开始工作。

---

### 4. 检查运行状态

```bash id="c99l2d"
agent-helm status
agent-helm doctor
```

停止 Agent Helm：

```bash id="ev0xsa"
agent-helm stop
```

---

## 🛠️ ChatGPT 可以直接做什么？

Agent Helm 让 ChatGPT 面对的是你的真实项目，而不是复制进聊天框的代码片段。

ChatGPT 可以直接：

* 理解项目结构
* 查找和读取文件
* 理解代码符号和引用关系
* 修改代码和配置
* 运行终端命令和工程工具
* 查看 Diagnostics 和 Git 状态
* 执行构建与测试
* 检查真实运行结果

从理解问题、修改代码到运行验证，都可以直接围绕本地工程完成。

---

## 🤖 需要时调用本地 Coding Agent

范围明确的工作可以直接由 ChatGPT 完成。

任务需要大量修改、构建、测试或长时间执行时，ChatGPT 可以在已经理解项目和任务的基础上，把工作交给本地 Coding Agent。

```text id="ixr5ob"
ChatGPT
   │
   ├── 理解项目
   ├── 分析问题
   ├── 直接修改与验证
   │
   └── 重任务 ──► Local Coding Agent
                         │
                    Edit · Run · Test
                         │
                         ▼
                    ChatGPT Review
```

Agent 完成后，ChatGPT 可以重新检查：

* 修改后的文件
* Git Diff
* Diagnostics
* 命令输出
* 构建结果
* 测试结果

判断任务是否完成时，依据的是真实工程状态，而不仅是 Agent 返回的一段文字。

---

## 📚 Work History

Agent Helm 可以把一次工作中的这些内容关联起来：

* ChatGPT Conversation
* 项目 / Worktree
* ChatGPT 的本地操作
* Coding Agent
* Agent Session
* 执行状态与最近活动

即使任务在 ChatGPT 和本地 Agent 之间多次切换，也可以作为同一项工作持续追踪。

完整的 Work History 查看和管理界面可以通过 [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) 使用。

---

## 🌐 独立网络代理

ChatGPT Tunnel 可以单独配置 HTTP / HTTPS 代理。

这套代理配置只用于 Agent Helm 的 Tunnel 连接：

* 不需要修改系统全局代理
* 不需要开启全局 VPN
* 不影响终端、浏览器或其他开发工具的网络配置

如果 Chrome、DSH 或当前运行环境无法继承你的 Shell Proxy，可以直接在 Agent Helm Setup 中单独填写 Tunnel Proxy。

---

## 🔒 本地项目与安全

项目和实际执行环境始终留在你的本地电脑上：

* **Workspace 权限：** ChatGPT 可以访问哪些项目，由明确配置的 Workspace 决定。
* **能力控制：** 文件修改、命令执行、Agent Delegation 等能力可以独立控制。
* **Sandbox：** 本地命令通过 Agent Helm 的执行 Sandbox 运行；无法安全建立所需隔离时，相关操作会被拒绝。
* **Network 控制：** 可以限制本地命令允许访问的网络目标。
* **Agent 权限独立：** 任务交给本地 Coding Agent 后，按照对应 Agent integration 自身的权限和 Sandbox 配置运行。

完整说明见 [Security Model](./docs/security.md)。

---

## 🔌 产品集成

Agent Helm 是本地能力层，可以独立使用，也可以通过不同产品入口接入现有工作流。

### Agent Helm Extensions

[Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) 是 Agent Helm 的 Chrome Extension，提供浏览器里的安装、配置和 Work 管理入口。

如果已经安装 Agent Helm：

```bash id="2yo8vx"
agent-helm setup chrome
```

你可以直接在浏览器中查看当前项目、Worktree、ChatGPT 的本地操作、Coding Agent、Agent Session 和 Work History。

<p align="center">
  <img width="1000" alt="Agent Helm Chrome Extension" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />
</p>

### DSH with ChatGPT

[DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) 是 Agent Helm 的 DSH 集成。

它让 ChatGPT 可以直接使用本地项目，并在需要持续执行时创建原生 DSH Session。

<p align="center">
  <img width="1000" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />
</p>

---

## 📖 文档

| 文档                                                  | 内容                           |
| --------------------------------------------------- | ---------------------------- |
| [Architecture](./docs/architecture.md)              | 组件与运行架构                      |
| [Reliability & Verification](./docs/reliability.md) | 可靠性设计与端到端黑盒验证                |
| [Security Model](./docs/security.md)                | Workspace、执行权限、Sandbox 与安全边界 |
| [Configuration](./docs/configuration.md)            | 配置文件、Workspace、Network 与能力配置 |

---

## 🧩 基础组件

Agent Helm 基于成熟的开源项目提供部分核心能力：

| 组件                            | 用途                                       | 项目                                                                                                  |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | 项目理解与语义代码能力                              | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | 本地命令 Sandbox                             | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | ChatGPT 与本地 Agent Helm 之间的 Secure MCP 连接 | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |

---

## 📌 项目状态

Agent Helm 正在持续开发与积极迭代中。欢迎提交 Issue 与 Pull Request！
