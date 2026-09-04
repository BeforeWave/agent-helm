<p align="right">
  <a href="./README.md"><b>English</b></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<div align="center">

# Agent Helm

**Say goodbye to copy-pasting and Token quota anxiety. Let ChatGPT on the web connect directly to your local projects, run code, and call local Coding Agents when needed.**

</div>

<br />

<p align="center">
  <img width="1000" alt="Agent Helm" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />
</p>

---

## 💡 Why Agent Helm?

ChatGPT on the web has strong models, but it normally cannot access your local projects, files, or terminal. When working on real codebases, source code, errors, and execution results still have to be moved back and forth between the browser, IDE, and terminal.

Local Coding Agents can operate directly on a project, but a large amount of Token usage often goes into reading the codebase, understanding context, and repeating reasoning work.

**Agent Helm** gives ChatGPT real local engineering capabilities:

* **Let ChatGPT code directly:** Read and modify local files, run terminal commands, inspect Diagnostics and Git state, and execute builds and tests.
* **Understand the real codebase:** Work directly with project structure, code symbols, references, and actual Diagnostics instead of relying on a small slice of context pasted into chat.
* **Reduce Coding Agent Token usage:** Project understanding, problem analysis, small changes, and result review can be handled directly by ChatGPT, leaving local Agents for tasks that truly need sustained execution.
* **Multi-Agent collaboration:** Complex tasks can be handed directly to local Coding Agents connected through Agent Helm, with ChatGPT reviewing the real results afterward.
* **Independent network proxy:** ChatGPT Tunnel can use its own HTTP / HTTPS proxy without changing the system-wide proxy or enabling a global VPN.
* **Local permissions & Sandbox:** Workspace access, execution permissions, network access, and Sandbox boundaries are all controlled locally by Agent Helm.

---

## ⚡ Quick Start

### 1. Install Agent Helm

**macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh
```

> Install a specific version:
> `curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh -s -- 0.1.4`

**Linux (best-effort):**

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh
```

> Install a specific version:
> `curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh -s -- 0.1.4`

**Windows x64:**

```powershell
irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1 | iex
```

> Install a specific version:
> `& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1))) -Version 0.1.4`

**Stable npm release:**

```bash
npm install -g @beforewave/agent-helm
```

> Install a specific version:
> `npm install -g @beforewave/agent-helm@0.1.4`

The one-command installer reuses an existing Node.js 22+ runtime when available. Otherwise, it installs an Agent Helm-managed Node Runtime without modifying your system Node.js installation.

---

### 2. Complete Setup

```bash
agent-helm setup
```

Setup checks the current environment and guides you through Agent Helm, ChatGPT Tunnel, required dependencies, and network proxy configuration.

ChatGPT Tunnel can use its own HTTP / HTTPS proxy without affecting the network configuration of your system or other development tools.

---

### 3. Add a Project and Start

Enter the project you want ChatGPT to use:

```bash
cd /path/to/project
agent-helm workspace add
agent-helm start
```

Once connected, return to ChatGPT in your browser and start working directly with the project.

---

### 4. Check Runtime Status

```bash
agent-helm status
agent-helm doctor
```

To stop Agent Helm:

```bash
agent-helm stop
```

---

## 🛠️ What Can ChatGPT Do Directly?

Agent Helm lets ChatGPT work with your real project instead of a code snippet pasted into a chat box.

ChatGPT can directly:

* Understand the project structure
* Find and read files
* Understand code symbols and references
* Modify code and configuration
* Run terminal commands and development tools
* Inspect Diagnostics and Git state
* Run builds and tests
* Check real execution results

From understanding the problem to modifying code and verifying the result, the entire workflow can happen directly against the local project.

---

## 🤖 Call Local Coding Agents When Needed

Focused tasks can be handled directly by ChatGPT.

When a task requires extensive changes, builds, tests, or sustained execution, ChatGPT can hand the work to a local Coding Agent after it already understands the project and the task.

```text
ChatGPT
   │
   ├── Understand Project
   ├── Analyze Problem
   ├── Edit & Verify Directly
   │
   └── Heavy Task ──► Local Coding Agent
                            │
                       Edit · Run · Test
                            │
                            ▼
                       ChatGPT Review
```

After the Agent finishes, ChatGPT can inspect the real results again:

* Modified files
* Git Diff
* Diagnostics
* Command output
* Build results
* Test results

Completion is judged against the real state of the project, not just a text response returned by the Agent.

---

## 📚 Work History

Agent Helm can associate all of these with the same piece of work:

* ChatGPT Conversation
* Project / Worktree
* Local actions performed by ChatGPT
* Coding Agent
* Agent Session
* Execution status and recent activity

Even when a task moves between ChatGPT and a local Agent multiple times, it can still be tracked as one continuous piece of work.

A complete Work History viewing and management interface is available through [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions).

---

## 🌐 Independent Network Proxy

ChatGPT Tunnel can use its own HTTP / HTTPS proxy.

This proxy configuration applies only to the Agent Helm Tunnel connection:

* No need to change the system-wide proxy
* No need to enable a global VPN
* No impact on the network configuration of your terminal, browser, or other development tools

If Chrome, DSH, or the current runtime environment cannot inherit your Shell Proxy, you can configure a dedicated Tunnel Proxy directly through Agent Helm Setup.

---

## 🔒 Local Projects & Security

Your projects and actual execution environment remain on your local machine:

* **Workspace permissions:** Which projects ChatGPT can access are determined by explicitly configured Workspaces.
* **Capability control:** File modification, command execution, Agent Delegation, and other capabilities can be controlled independently.
* **Sandbox:** Local commands run through Agent Helm's execution Sandbox. If the required isolation cannot be established safely, the operation is rejected.
* **Network control:** Network destinations available to local commands can be restricted.
* **Independent Agent permissions:** Tasks handed to local Coding Agents run under the permissions and Sandbox configuration of the corresponding Agent integration.

See the [Security Model](./docs/security.md) for the complete security model.

---

## 🔌 Product Integrations

Agent Helm is the local capability layer. It can be used independently or integrated into existing workflows through different product interfaces.

### Agent Helm Extensions

[Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) is the Chrome Extension for Agent Helm, providing browser-based installation, configuration, and Work management.

If Agent Helm is already installed:

```bash
agent-helm setup chrome
```

From the browser, you can directly view the current project, Worktree, ChatGPT's local actions, Coding Agents, Agent Sessions, and Work History.

<p align="center">
  <img width="1000" alt="Agent Helm Chrome Extension" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />
</p>

### DSH with ChatGPT

[DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) is the DSH integration for Agent Helm.

It lets ChatGPT work directly with local projects and create native DSH Sessions when sustained execution is needed.

<p align="center">
  <img width="1000" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />
</p>

---

## 📖 Documentation

| Document                                            | Contents                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| [Architecture](./docs/architecture.md)              | Components and runtime architecture                                 |
| [Reliability & Verification](./docs/reliability.md) | Reliability design and end-to-end black-box verification            |
| [Security Model](./docs/security.md)                | Workspaces, execution permissions, Sandbox, and security boundaries |
| [Configuration](./docs/configuration.md)            | Configuration files, Workspaces, Network, and capability settings   |

---

## 🧩 Core Components

Agent Helm builds several core capabilities on established open-source projects:

| Component                     | Purpose                                                    | Project                                                                                             |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | Project understanding and semantic code intelligence       | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | Local command Sandbox                                      | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | Secure MCP connection between ChatGPT and local Agent Helm | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |

---

## 📌 Project Status

Agent Helm is under active development and iteration. Issues and Pull Requests are welcome!
