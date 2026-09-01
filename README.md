<p align="right">
  <a href="./README.md"><b>English</b></a> | <a href="./README.zh-CN.md">中文</a>
</p>

# Agent Helm

> **Bring ChatGPT directly into your local development environment: understand the real project, make changes, complete engineering work, direct your local Coding Agents, and keep every local action inside explicit permission and Sandbox boundaries.**

**Agent Helm** lets ChatGPT actually work on the local projects on your machine instead of reasoning only from code, logs, and project context copied into a Conversation.

You can describe problems, request changes, discuss approaches, and review results in ChatGPT just as you normally would.

ChatGPT can connect to an authorized local project, understand its actual current state, make changes based on your instructions, complete work, and direct locally available Coding Agents to continue larger tasks before returning to inspect the actual result.

These local operations run within explicit permission boundaries and a **Sandbox**, so ChatGPT and the local Agents it uses can actually get work done without gaining unrestricted access to your entire machine.

```text
                         ChatGPT
               Understand · Reason · Work · Direct
                            │
                            ▼
                        Agent Helm
                     /              \
                    /                \
               Direct Work       Local Coding Agent
                    \                /
                     \              /
                    Permission Boundary
                            │
                         Sandbox
                            │
                            ▼
                   Authorized Workspace
```

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## Let ChatGPT work on the real local project

The real project stays on your machine.

With Agent Helm, you no longer need to keep copying code, errors, logs, and project context into ChatGPT just so it can understand what is happening.

ChatGPT can work directly from an authorized local Workspace to understand the problem, make changes, complete the task, and inspect the actual result.

From a user's perspective, the workflow stays simple:

* Describe what you want in ChatGPT
* Let ChatGPT understand the current project
* Let it work directly on the project
* Let it direct a local Coding Agent when needed
* Return to the same Conversation to continue discussing and reviewing the work

The important difference is simple:

**ChatGPT is working against the actual state of the project on your machine, not a simplified copy inside the chat window.**

## Work directly, or direct local Agents

Not every task needs a full Coding Agent.

For focused and well-defined work, ChatGPT can work directly through Agent Helm.

```text
ChatGPT
   │
   ▼
Agent Helm
   │
   ▼
Local Project
```

When a task becomes larger, needs sustained execution, or is better suited to a Coding Agent, ChatGPT can discover and use locally available Agents and hand them the task together with the current project context.

ChatGPT does more than simply "start an Agent."

It can direct a local Agent around the current project and task, continue providing direction when needed, and return to the real project after execution to inspect the result, continue the Review, or decide what should happen next.

```text
ChatGPT
   │
   ├── Understand the project
   ├── Complete work directly
   └── Direct a local Agent
              │
              ▼
          Local Agent
              │
       Continue the task
              │
              ▼
        ChatGPT Review
```

You can start with ChatGPT and involve a Coding Agent only when the task actually needs one.

After the Agent finishes, ChatGPT can inspect the real result in the project instead of relying only on the Agent's completion report.

A task can therefore move naturally between different ways of working:

**ChatGPT Direct Work → Local Agent Execution → ChatGPT Review and Continuation**

without requiring you to repeatedly re-explain the project background and task context across different tools.

## Let ChatGPT actually work — safely

Letting ChatGPT work on a local project should not mean handing over your entire machine.

Agent Helm works only within the local environment you authorize.

What ChatGPT can access, where it can work, and what local operations it can perform are all constrained by explicit permission boundaries.

Local Coding Agents used through Agent Helm operate within the same local work and permission boundaries.

Local execution is further constrained by a **Sandbox**.

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
       Local Project
```

This does not simply rely on telling ChatGPT through a Prompt not to access anything else.

The actual restrictions are enforced at the local execution layer.

On supported environments, Agent Helm runs local commands inside an enforcing Sandbox.

If an operation cannot be executed safely and no enforcing Sandbox is available, Agent Helm defaults to **fail closed** rather than silently falling back to unrestricted execution.

> **ChatGPT can actually enter the project and work, and it can direct local Agents to complete tasks, while what they can access and execute remains controlled by explicit local permissions and Sandbox boundaries.**

### Core components

Agent Helm builds parts of its local runtime on mature open-source components:

| Component                     | Role in Agent Helm                                              | Project                                                                                             |
| ----------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Serena**                    | Semantic code intelligence and LSP-backed project understanding | [oraios/serena](https://github.com/oraios/serena)                                                   |
| **Anthropic Sandbox Runtime** | Enforcing Sandbox for local command execution                   | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) |
| **OpenAI tunnel-client**      | Default Secure MCP Tunnel between ChatGPT and local Agent Helm  | [openai/tunnel-client](https://github.com/openai/tunnel-client)                                     |

These components are implementation backends used by Agent Helm.

Agent Helm defines and manages the local capability boundary, Workspace isolation, permission model, Coding Agent delegation, Setup flow, and runtime lifecycle around them.

The security boundary is not only a documentation claim. Agent Helm also provides public, reproducible **Security / Conformance Tests** in the source repository to verify these constraints.

## Guided Setup

Agent Helm may require a small number of local dependencies and connection settings, but the Setup flow checks what is missing and guides you through the required steps.

**You do not need to search through large amounts of installation documentation, manually assemble environment variables, or figure out how every underlying component should be configured.**

Install Agent Helm:

```bash
npm install -g agent-helm
```

Then run:

```bash
agent-helm setup
```

Setup checks the current local environment and guides you through the dependencies, permissions, Tunnel connection, and other configuration Agent Helm needs.

Steps that can be completed automatically can be handled by Agent Helm.

When user authorization or an external action is required, the Setup flow gives you a clear next step.

### Chrome integration

If you want to use Agent Helm directly from ChatGPT in the browser:

```bash
agent-helm setup chrome
```

You can also start directly from the [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions).

The Extension checks the current local environment and guides you from the browser into the same Agent Helm installation and connection flow.

## Workspaces and daily use

Setup configures **Agent Helm itself**.

Your local projects are registered separately as Workspaces.

From inside a project:

```bash
cd /path/to/workspace
agent-helm init
```

Or register a project explicitly:

```bash
agent-helm init /path/to/workspace
```

Then start Agent Helm:

```bash
agent-helm start
```

Check its current runtime state:

```bash
agent-helm status
```

When you need to diagnose environment or connection problems:

```bash
agent-helm doctor
```

Stop Agent Helm:

```bash
agent-helm stop
```

Once Agent Helm is running and connected, you continue working from ChatGPT as usual.

## Work History

Real development work often extends beyond a single command, Conversation, or Agent Session.

ChatGPT may complete part of a task directly and hand another part to a local Agent. The local Agent may continue working for some time, and you may return to the Conversation later to continue the discussion.

Agent Helm Work History keeps these pieces connected.

```text
ChatGPT Conversation
        │
        ▼
       Work
     /      \
Direct Work  Agent Sessions
```

You can always return and find:

* Which ChatGPT Conversation started the work
* Which Workspace / Worktree was used
* What ChatGPT completed directly
* Whether work was handed off to a local Agent
* Which Agent Session belongs to the task
* What the Agent completed afterward
* What happened most recently

Work History is not another copy of the chat transcript, and it is not just a list of Agent Sessions.

It connects:

**Conversation → Workspace → Direct Work → Agent Sessions → Actual Work History**

That means even when a task continues for a long time across ChatGPT and local Agents, it can still be found again, continued, reviewed, and handed over without losing context just because you switched tools or left the Conversation.

## Related Projects

Agent Helm can be used completely on its own.

You do not need to understand or install the other projects first.

If you want additional ways to work on top of Agent Helm, you can use these projects:

| Project                   | Description                                                                                                                                                                                                                         | Link                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **DSH with ChatGPT**      | Brings ChatGPT and DSH together in a more complete development workflow. ChatGPT can work directly, direct real DSH Sessions to continue sustained execution, and return to the real project afterward for another round of Review. | [DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt)           |
| **Agent Helm Extensions** | Lets ChatGPT in the browser enter your local development environment and provides a browser interface for managing Work and Agent Sessions.                                                                                         | [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) |

<img width="906" height="1078" alt="dsh-plugin-only" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

<img width="2166" height="1498" alt="workbench" src="https://github.com/user-attachments/assets/0c65c877-91d2-4453-a986-52d1bd13af5a" />

## Project Status

Agent Helm is under active development.

The core idea is simple:

> **Let ChatGPT work directly against the real project on your machine, complete the work that makes sense to handle directly, and direct your local Coding Agents when sustained execution is needed — while keeping local access inside permission and Sandbox boundaries you control.**
