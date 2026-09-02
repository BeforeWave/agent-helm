<p align="right">
  <a href="./README.md"><b>English</b></a> | <a href="./README.zh-CN.md">中文</a>
</p>

# Agent Helm

> **Let ChatGPT directly understand and operate your local development environment, and direct local Coding Agents to carry out longer-running tasks when needed.**

**Agent Helm** connects ChatGPT to your local development environment.

You continue to describe problems, discuss approaches, and review results in ChatGPT, but you no longer need to repeatedly copy code, errors, and project context into the conversation. ChatGPT can work directly against the real project: understand code, edit files, run commands, inspect diagnostics, and verify actual results.

For focused engineering tasks, ChatGPT can complete the work directly. For tasks that require substantial editing, building, testing, or continued execution, ChatGPT can first understand the project and the goal, then direct a local Coding Agent to carry out the work and review the actual code, Git diff, and test results afterward.

```text
                         ChatGPT
                            │
                  Understand and operate
                     the real project
                            │
                ┌───────────┴───────────┐
                │                       │
            Work directly         Local Coding Agent
                │                       │
                │                Continued execution
                │                       │
                └───────────┬───────────┘
                            ▼
                    Review actual results
```

<img width="2166" height="1498" alt="Agent Helm" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## Why Agent Helm

### Work Against the Real Project

ChatGPT works with the actual project on your computer, not just a small set of code snippets copied into a chat.

It can inspect relevant files and code structure, diagnostics and Git state, run tools and commands, and continue working based on real engineering results.

### Work Directly or Direct a Coding Agent

Not every task needs a Coding Agent.

Focused changes can be completed directly by ChatGPT, while larger tasks can be handed to a local Coding Agent for continued execution.

Both modes can naturally be used within the same piece of work.

### Verify Real Results

Agent Helm does more than send a task away for execution.

ChatGPT can continue reading the modified code, Git diff, diagnostics, command output, and test results, then determine whether the task was actually completed.

### Keep Work Context Clear

Each piece of work is associated with an explicit local project and execution context.

When Worktrees or local Coding Agents are involved, Agent Helm keeps the relationship between the Conversation, project, and Agent Session so the work can be found and continued later.

### Clear Boundaries for Local Execution

Your projects and actual execution environment remain on your computer.

Agent Helm limits local access according to authorized Workspaces, capabilities, and permissions. If an operation requires Sandbox protection and that protection cannot be established safely, the operation is rejected.

See [Security Model](./docs/security.md) for the full security model.

## Quick Start

Install Agent Helm:

```bash
npm install -g agent-helm
```

Run Setup:

```bash
agent-helm setup
```

`agent-helm setup` is the recommended configuration entry point. It handles the environment checks and connection setup required to run Agent Helm.

Then enter the project you want to use:

```bash
cd /path/to/project
agent-helm init
agent-helm start
```

Once connected, return to ChatGPT and start working directly against that project.

### Chrome Extension

If you want to handle installation, connection, and day-to-day management from the browser:

```bash
agent-helm setup chrome
```

You can also use the [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions).

### Common Commands

```bash
agent-helm status
agent-helm doctor
agent-helm stop
```

## Designed for Real Development Work

Agent Helm is designed for more than running a single command. Its goal is to let ChatGPT participate reliably in real software development workflows.

A piece of work can include:

* ChatGPT understanding the project and locating the problem
* Editing code directly and verifying the result
* Creating or using an isolated Worktree
* Directing a local Coding Agent to carry out larger tasks
* Continuing to adjust the implementation based on execution results
* Reviewing the final code, diff, diagnostics, and test results
* Finding the same work later and continuing from where it left off

Agent Helm maintains the project and work context required across these steps instead of treating every operation as an unrelated one-off call.

## Work History

Agent Helm can associate a **ChatGPT Conversation, local project, Worktree, direct operations, and Agent Sessions** as one piece of work.

This means a task can move between direct ChatGPT changes and continued Coding Agent execution while still remaining easy to find later, inspect, and continue.

A fuller work-management interface is available through the [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions) and other Agent Helm Extensions.

## Easier Product Entry Points

Agent Helm can be used directly or through higher-level product integrations.

| Project                                                                      | Purpose                                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Install, connect, and manage Agent Helm through browser extensions                                              |
| [DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt)           | Let ChatGPT operate the local environment directly and direct DSH to carry out longer-running tasks when needed |

## Documentation

This README focuses on Agent Helm's primary value and usage. More detailed technical documentation is maintained separately:

* [Architecture](./docs/architecture.md) — Components and runtime architecture
* [Reliability & Black-box Testing](./docs/reliability.md) — Reliability design and end-to-end black-box verification
* [Security Model](./docs/security.md) — Workspaces, execution permissions, Sandbox, and security boundaries
* [Configuration](./docs/configuration.md) — Configuration files, Workspaces, network access, and capability settings

## Core Components

Agent Helm uses established open-source projects for several core capabilities:

| Component                     | Purpose                                                    | Project                                                                                             |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | Project understanding and semantic capabilities            | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | Local command Sandbox                                      | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | Secure MCP connection between ChatGPT and local Agent Helm | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |
