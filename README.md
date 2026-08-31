# Agent Helm

> **Give ChatGPT real engineering capabilities inside your local workspace.**

Agent Helm connects ChatGPT to the environment where your work actually happens.

Instead of reasoning only from code snippets copied into a conversation, ChatGPT can work with the real local workspace: source code, configuration, tests, documentation, Git state, diagnostics, project tools, and local execution.

At the same time, local access remains inside an explicit security boundary.

```text
                         ChatGPT
                   Understand · Reason
                            │
                            ▼
                        Agent Helm
                   /        |        \
                  /         |         \
             Workspace   Commands   Local Agents
                  \         |         /
                   \        |        /
                    Execution Context
                            │
                         Sandbox
                            │
                            ▼
                   Authorized Workspace
```

## Work with the real local workspace

Agent Helm gives ChatGPT a stable local engineering surface.

It can:

- understand project structure and code
- navigate symbols and references
- inspect diagnostics
- read and modify files
- work with Git and Worktrees
- run local commands and project tools
- verify changes against the real project
- discover and delegate to native coding agents

The important part is that ChatGPT is working against the actual workspace state, not a simplified copy of it inside the chat.

### Semantic code intelligence

Agent Helm currently uses **Serena** as its semantic code-intelligence backend, providing LSP-backed capabilities such as symbol navigation, reference discovery, diagnostics, and structured code understanding.

Serena is an implementation backend. Agent Helm defines the semantic capability contract, lifecycle, workspace isolation, and security policy around it.

## Work directly when the task is small

Not every task needs a full Coding Agent.

For focused work such as investigation, local fixes, small refactors, verification, and review, ChatGPT can work directly through Agent Helm:

```text
ChatGPT ──► Agent Helm ──► Inspect · Reason · Edit · Verify
```

This keeps small tasks lightweight while still using the real project context.

## Delegate when the task gets larger

For work that requires sustained editing, repeated build and test loops, or broader execution, Agent Helm can expose native local coding agents.

```text
ChatGPT
   │
   ├── Understand the workspace
   ├── Analyze the problem
   └── Define the direction
              │
              ▼
          Local Agent
              │
        Edit · Run · Test
              │
              ▼
        ChatGPT Review
```

ChatGPT remains the reasoning and review layer. The execution mechanism can change without changing the local capability boundary.

## Real local capability, with explicit boundaries

Giving ChatGPT engineering capabilities should not mean giving it unrestricted access to the machine.

Agent Helm establishes an **Execution Context** for local work and turns that context into concrete resource authority.

It controls:

- Workspace / Worktree
- filesystem reads and writes
- command execution
- environment variables
- network access
- local TCP binding
- semantic capabilities
- Coding Agent delegation

```text
ChatGPT
   │
   ▼
Agent Helm
   │
   ├── Execution Context
   ├── Capability Policy
   ├── Filesystem Authority
   ├── Environment Authority
   ├── Network Authority
   └── Sandbox
            │
            ▼
     Authorized Local Workspace
```

### Authority-first security model

Agent Helm uses an **authority-first security model**: every local action is derived from an explicit Execution Context, narrowed across filesystem, environment, network, and capability boundaries, then enforced at runtime by a sandbox with fail-closed behavior.

The selected Workspace / Worktree is part of that authority boundary. Agent Helm does not rely on a prompt telling the model what it should avoid; it derives what the execution is actually allowed to access.

Authority is layered deliberately:

```text
Host / User capability ceiling
             │
             ▼
      Workspace policy
             │
             ▼
       Execution Context
             │
             ▼
     Runtime enforcement
```

A lower layer cannot grant itself authority that a higher layer did not provide. Explicit deny rules take precedence over allows.

### Sandbox enforcement

On supported environments, local command execution is constrained by an enforcing sandbox. Agent Helm currently uses **Anthropic Sandbox Runtime** as the sandbox enforcement backend.

The sandbox is one layer of Agent Helm's broader security model; filesystem, environment, network, and execution authority are still defined by Agent Helm's Execution Context and capability policy.

This matters because real programs can construct paths dynamically, follow symlinks, create child processes, and perform actions that cannot always be understood safely from command text alone. Agent Helm can reject explicit violations before execution, while the sandbox provides the final runtime boundary for behavior that only becomes known during execution.

If an operation cannot be executed safely and no enforcing sandbox is available, Agent Helm defaults to **fail closed** instead of silently falling back to unrestricted execution.

### Narrow authority

Agent Helm grants local authority deliberately rather than inheriting the whole host environment.

Filesystem access, environment visibility, network access, and local binding are all explicit parts of the execution boundary.

Read-only work removes write authority at the execution layer. Explicit deny rules take precedence over allows.

> **ChatGPT can really take action locally, while what it can access and execute remains bounded by explicit authority.**

The security boundary is backed by public, reproducible Security / Conformance Tests in the Agent Helm source rather than documentation claims alone.

## Secure MCP connectivity

Agent Helm currently uses **OpenAI tunnel-client** as the default Secure MCP Tunnel backend for connecting the local Agent Helm runtime with ChatGPT.

Agent Helm owns the Tunnel lifecycle, configuration, version compatibility, and local credential handling around that connection. The tunnel-client is the current transport backend rather than the source of Agent Helm's capability or security policy.

## Guided setup

Agent Helm may require a few local dependencies and connection settings, but the setup flow detects what is missing and walks you through each step.

**You do not need to hunt through documentation, manually piece together environment variables, or figure out third-party setup on your own.**

Install Agent Helm:

```bash
npm install -g agent-helm
```

Then configure Agent Helm itself:

```bash
agent-helm setup
```

The setup flow checks the local environment and guides you through the dependencies, Tunnel settings, permissions, and other configuration Agent Helm needs. When a supported dependency can be installed for you, Agent Helm asks first; if you choose not to install it automatically, the setup flow gives you the exact command and official URL you need.

For Chrome integration, continue with:

```bash
agent-helm setup chrome
```

The Chrome setup continues the same guided experience for browser-specific installation, Native Messaging, and user-authorized connection steps.

## Workspaces and daily use

Setup configures **Agent Helm itself**. Workspaces are registered separately.

From a local workspace:

```bash
cd /path/to/workspace
agent-helm init
```

Or register one explicitly:

```bash
agent-helm init /path/to/workspace
```

Then start Agent Helm:

```bash
agent-helm start
```

Check the runtime at any time:

```bash
agent-helm status
agent-helm doctor
```

Stop it with:

```bash
agent-helm stop
```

`agent-helm daemon` is an internal runtime primitive. Normal users should use `agent-helm start`.

## Work History

Local AI work should remain understandable after a command or Agent Session ends.

Agent Helm Work History connects the ChatGPT conversation that caused the work with the local activity that actually happened.

```text
ChatGPT Conversation
        │
        ▼
       Work
     /      \
Direct Work  Subagent Sessions
```

A Work can associate:

- ChatGPT Conversation
- Workspace / Worktree
- direct local work
- delegated Agent Sessions
- recent activity and execution state

This makes work easier to inspect, resume, review, and hand over.

## Use with DSH

For the complete ChatGPT + DeepSeek Harness workflow:

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

[DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) uses Agent Helm as its local capability and security layer, then adds native DSH execution, Session control, manual takeover, and independent ChatGPT Review.

## Agent Helm Family

| Project | Role |
| --- | --- |
| **Agent Helm** | Local engineering capabilities, security boundary, and execution control layer for ChatGPT |
| [DSH with ChatGPT](https://github.com/BeforeWave/dsh-with-chatgpt) | Complete ChatGPT + DSH development workflow |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Browser and other user-facing integrations |

## Project Status

Agent Helm is under active development.

> **Bring ChatGPT into the real local workspace, give it useful engineering capabilities, and keep those capabilities inside a boundary you control.**
