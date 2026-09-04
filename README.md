<p align="right">
  <a href="./README.md"><b>English</b></a> | <a href="./README.zh-CN.md">中文</a>
</p>

# Agent Helm

> **Bring ChatGPT in your browser into your local development environment.**

**Agent Helm** lets you keep using ChatGPT the way you already do, while giving it direct access to the real projects on your machine.

ChatGPT can understand the project, find files, edit code, run commands, inspect diagnostics, and check build, test, and execution results — without you constantly copying code, errors, and project context into the conversation.

When a task needs more execution power, ChatGPT can also hand the work off to a local coding agent already connected to Agent Helm.

Once the agent is done, ChatGPT can come back to the real project, inspect the code, Git diff, and test results, and continue from there.

<img width="1000" alt="Agent Helm" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## Quick Start

### 1. Install Agent Helm

macOS / Linux one-click installer:

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh
```

Windows x64:

```powershell
irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1 | iex
```

Stable npm release:

```bash
npm install -g @beforewave/agent-helm
```

To install a specific GitHub release:

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.sh | sh -s -- 0.1.4
```

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install.ps1))) -Version 0.1.4
```

The installer reuses Node.js 22+ when available and otherwise installs an Agent Helm-managed Node runtime without changing the system Node.js installation.

### 2. Configure

Run setup:

```bash
agent-helm setup
```

`agent-helm setup` handles the environment checks and connection setup required to run Agent Helm.

### 3. Add a Project and Start

Enter the project you want to use:

```bash
cd /path/to/project
agent-helm workspace add
agent-helm start
```

### 4. Verify the Connection

```bash
agent-helm status
agent-helm doctor
```

Once connected, go back to ChatGPT in your browser and start working directly with that project.

To stop Agent Helm later:

```bash
agent-helm stop
```

## Let ChatGPT Work Directly with Your Local Project

ChatGPT no longer has to work from a small slice of code pasted into a chat. It can work against the real project on your machine.

Depending on the task, it can:

* Understand the project structure and relevant context
* Find and read files
* Edit code and configuration
* Inspect diagnostics and Git state
* Run commands and development tools
* Check build, test, and execution results

A lot of work that previously required manually collecting context, pasting outputs, and going back and forth can now happen directly against the real project.

## Use Local Coding Agents When Needed

Not every task needs a coding agent.

Focused work can be handled directly by ChatGPT.

For tasks that involve substantial changes, builds, tests, or longer-running execution, ChatGPT can hand the work off to a local coding agent after it already understands the project and the task.

When the agent finishes, ChatGPT can inspect the project again, review the code, diff, diagnostics, command output, and test results, and decide what to do next.

The same piece of work can naturally move through:

**ChatGPT works directly → a local agent continues the task → ChatGPT reviews the result**

## Check the Real Results

Agent Helm does more than hand a task off and wait for a text response.

ChatGPT can inspect the actual state left behind after execution, including:

* Modified files
* Git diff
* Diagnostics
* Command output
* Build results
* Test results

It can then keep editing and validating based on what actually happened, rather than treating an agent's summary as the final source of truth.

## Work History

Agent Helm can associate a **ChatGPT conversation, local project, worktree, direct ChatGPT operations, and agent sessions** as one piece of work.

You can come back later and see:

* Which ChatGPT conversation the work came from
* Which project / worktree was used
* What ChatGPT did locally
* Whether a local coding agent was used
* Which agent session was associated with the work
* What happened most recently

Even when a task moves back and forth between ChatGPT and a local agent, it does not have to turn into several disconnected pieces of work.

A fuller interface for browsing and managing this history is available through the [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions).

## Local Projects and Security

Your projects and execution environment remain on your machine.

ChatGPT receives the local information needed for the current task, such as relevant files, project structure, diagnostics, Git state, command output, and test results.

What it can access, which capabilities it can use, and which operations it can execute are determined by the currently authorized Workspace, capabilities, and permissions.

When ChatGPT performs local operations directly, Agent Helm provides the local permission and sandbox boundary. If an operation requires sandbox protection and that protection cannot be established safely, the operation is rejected.

When work is handed off to a local coding agent, that agent runs under the permissions and sandbox model of its corresponding integration.

See the [Security Model](./docs/security.md) for the full security model.

## Use Agent Helm Through Different Product Integrations

Agent Helm can be used on its own or through product integrations that fit into existing workflows.

### DSH with ChatGPT

[DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) brings Agent Helm into DSH.

ChatGPT in your browser can work directly with your local project and hand tasks off to native DSH Sessions when needed. DSH also gets a lightweight view for seeing the project, local actions, and work history associated with ChatGPT.

<img width="1000" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

> The `dsh-plugin` entry in the lower-left is DSH with ChatGPT.

### Agent Helm Chrome Extension

The [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions) provides a browser-based installation and management experience.

If Agent Helm is already installed, configure the browser integration with:

```bash
agent-helm setup chrome
```

It associates the current ChatGPT conversation with the corresponding local work, so you can see the active project, worktree, ChatGPT's local actions, connected coding agents, and agent sessions directly from the browser.

<img width="1000" alt="Agent Helm Chrome Extension" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

> The panel on the right is the Agent Helm Chrome Extension Side Panel.

## Documentation

This README focuses on Agent Helm's primary value and usage. More detailed technical documentation is available here:

* [Architecture](./docs/architecture.md) — Components and runtime architecture
* [Reliability & Verification](./docs/reliability.md) — Reliability design and end-to-end black-box verification
* [Security Model](./docs/security.md) — Workspaces, execution permissions, sandboxing, and security boundaries
* [Configuration](./docs/configuration.md) — Configuration files, Workspaces, network access, and capability settings

## Core Components

Agent Helm uses established open-source projects for several core capabilities:

| Component                     | Purpose                                                    | Project                                                                                             |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | Project understanding and semantic capabilities            | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | Local command sandbox                                      | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | Secure MCP connection between ChatGPT and local Agent Helm | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |

## Project Status

Agent Helm is under active development.
