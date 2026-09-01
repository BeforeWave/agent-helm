<p align="right">
  <a href="./README.md"><b>English</b></a> | <a href="./README.zh-CN.md">中文</a>
</p>

# Agent Helm

> **Bring ChatGPT into your local development environment. Understand the project, complete engineering work directly, and direct your local Coding Agents when needed.**

Agent Helm connects ChatGPT to your authorized local project through **Secure MCP**.

You still describe problems, discuss approaches, and review results in ChatGPT, but you no longer need to repeatedly copy code, errors, and project context into the Conversation. ChatGPT can understand the current project state, modify files, run tools and commands, and inspect the actual result.

When a task is larger or needs sustained execution, ChatGPT can hand the work to a local Coding Agent and come back afterward to inspect and continue the work.

```text
                         ChatGPT
                 Understand · Reason · Work · Review
                            │
                       Secure MCP
                            │
                            ▼
                        Agent Helm
                     /              \
                    /                \
               Direct Work       Local Coding Agent
                    \                /
                     \              /
                  Authorized Local Project
                            │
                         Sandbox
```

**The project and execution environment stay on your computer.**

While ChatGPT is working, Agent Helm returns the information needed for the current task through MCP, such as relevant file contents, errors, project state, and command output.

Local operations run within the project and permissions you authorize, with Sandbox protection. If the required protection is unavailable, the operation is rejected.

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## Quick Start

Install and configure Agent Helm:

```bash
npm install -g agent-helm
agent-helm setup
```

Enter the project you want to use:

```bash
cd /path/to/project
agent-helm init
agent-helm start
```

Once connected, continue working in ChatGPT.

For browser integration:

```bash
agent-helm setup chrome
```

You can also use the [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions).

Common commands:

```bash
agent-helm status
agent-helm doctor
agent-helm stop
```

## Let ChatGPT Work Directly

ChatGPT can use Agent Helm to:

- Understand the current project
- Find and read files
- Modify content
- Run tools and commands
- Inspect errors and execution results
- Verify the result of a task

You do not need to repeatedly copy large amounts of project context into the Conversation just so ChatGPT can understand the project.

## Use Local Coding Agents

Larger, time-consuming, or sustained tasks can be handed to Coding Agents already available on your machine.

```text
ChatGPT
   │
   ▼
Agent Helm
   │
   ├── Direct Work
   │
   └── Local Coding Agent
             │
             ▼
       Sustained Execution
             │
             ▼
        ChatGPT Review
```

After the Agent finishes, ChatGPT can inspect the actual result in the project and continue modifying, verifying, or moving to the next step.

A task can move naturally between:

**ChatGPT Direct Work → Local Agent Execution → ChatGPT Review and Continuation**

## What Passes Between Your Local Project and ChatGPT

Project files, Git state, tools, and commands are all based on your local environment.

When ChatGPT works through Agent Helm, Agent Helm returns the information needed to complete the current task through MCP, including:

- Relevant file contents
- Errors and diagnostics
- Project state
- Git information
- Command output
- Other information needed for the current task

## Security Boundaries

Agent Helm works within the local project you authorize, with corresponding limits on file access and engineering operations.

On supported environments, local commands run inside a Sandbox that restricts access to local resources such as files, commands, environment variables, and the network.

If required security protection is unavailable, the related operation is rejected.

Local Coding Agents used through Agent Helm follow the same project scope and execution restrictions.

**No security issues have been found within the current test coverage, but cautious use is still recommended.**

## Work History

Agent Helm Work History connects the ChatGPT Conversation, local project, direct operations, and Agent Sessions that belong to the same work.

You can see:

- Which ChatGPT Conversation started the work
- Which project / Worktree was used
- What ChatGPT has completed
- Whether a local Agent was used
- The related Agent Session
- What the Agent completed afterward
- What happened most recently

Long-running work can be found again and continued at any time.

## Chrome Extension

The [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions) provides browser-based installation, configuration, and controls for managing connections, projects, and local Agents, and for viewing the current work in progress.

If Agent Helm is already installed, run:

```bash
agent-helm setup chrome
```

to complete the browser connection.

## Foundation Components

Some Agent Helm capabilities use mature open-source projects:

| Component | Purpose | Project |
| --- | --- | --- |
| **Serena** | Project understanding and semantic capabilities | [oraios/serena](https://github.com/oraios/serena) |
| **Anthropic Sandbox Runtime** | Sandbox for local command execution | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client** | Secure MCP connection between ChatGPT and local Agent Helm | [openai/tunnel-client](https://github.com/openai/tunnel-client) |

## Related Projects

Agent Helm can be used independently.

| Project | Purpose | Link |
| --- | --- | --- |
| **DSH with ChatGPT** | Let ChatGPT use DSH Sessions for larger tasks that need sustained execution | [DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) |
| **Agent Helm Extensions** | Chrome Extension and other Agent Helm interfaces | [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) |

<img width="2164" height="1666" alt="dsh-pure" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

> The dsh-plugin in the lower-left is dsh-with-chatgpt.

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

> The panel on the right is the Chrome Extension panel.

## Project Status

Agent Helm is under active development.
