# Architecture

Agent Helm is the local control layer between ChatGPT and an authorized development environment. It owns the public MCP contract, workspace authority, local execution, semantic code intelligence, and connections to local Coding Agents.

## System shape

```text
ChatGPT
   │
   │ Secure MCP
   ▼
Agent Helm Core
   ├── Workspace + execution-context authority
   ├── Command execution + Sandbox
   ├── Semantic code intelligence
   ├── Work / conversation correlation
   └── Local Agent registry
            │
            │ local adapter RPC
            ▼
      Native Coding Agents
```

The Chrome Extension and DSH integrations are product interfaces around the same Core. They do not replace Core as the authority for workspaces, MCP capabilities, or direct command execution.

## Core ownership

The long-running Agent Helm Core owns:

- user configuration;
- the canonical workspace registry;
- External and Native MCP surfaces;
- execution contexts and conversation correlation;
- command execution policy and Sandbox integration;
- semantic-provider lifecycle;
- local Coding Agent registration;
- the optional external tunnel.

This keeps authorization in one place. Adapters can expose native Agent sessions, but they do not become parallel policy engines.

## Workspaces and execution contexts

A **Workspace** is an explicitly authorized local project. `workspace_list` exposes stable workspace IDs without exposing local paths to the MCP client.

Before doing context-scoped work, the client calls `context_setup`. The returned `context_id` is bound to one exact Workspace and work path: the base checkout or one managed Worktree.

Changing `cwd`, Git state, conversation intent, or Agent session ID does not retarget that context. Moving to another Workspace or Worktree requires another `context_setup`.

Conversation intent is provenance only. It records why the conversation is working in a context but cannot expand filesystem, command, network, or Agent authority.

## MCP surfaces

Agent Helm exposes two capability surfaces:

- **External MCP** for ChatGPT: command execution, semantic operations, and Agent delegation according to configured capabilities.
- **Native MCP** for local Agent integrations: semantic operations and delegation only. It never exposes generic command authority.

Public tool names and schemas are owned by Agent Helm rather than by a specific semantic provider. Provider upgrades therefore cannot silently add tools to the MCP surface.

## Command execution

`command_execute` always runs through the Agent Helm execution backend.

The execution path combines:

1. the selected Workspace/work-path authority;
2. static command and path checks;
3. the effective execution policy;
4. an enforcing OS Sandbox when required;
5. normalized MCP results and output-boundary checks.

Execution receives a managed `HOME` and temporary directory. Host environment variables are not copied wholesale into the child process; access is limited by the effective environment policy, with `PATH` retained for executable resolution.

The command text itself can never authorize a Sandbox bypass.

## Semantic code intelligence

Agent Helm keeps semantic configuration provider-neutral: languages, ignored paths, and Git-ignore behavior belong to Agent Helm configuration rather than to Serena-specific project files.

Serena is the current semantic provider. Core creates and manages provider runtimes for authorized working copies and translates the effective Agent Helm semantic configuration into provider-specific configuration.

The public MCP contract remains stable if the underlying provider changes.

## Local Coding Agents

Local Coding Agents remain native to their host integration. For example, DSH continues to own DSH session persistence, model selection, cancellation, and UI takeover.

Agent Helm associates those sessions with the current execution context. A delegated session inherits the context's exact Workspace and work path; its session ID identifies the session but does not grant additional authority.

## Transport

Core exposes token-authenticated MCP endpoints on the local host. External ChatGPT connectivity can be provided through the managed tunnel.

Browser extensions do not use the MCP HTTP endpoint as a browser data plane. The Agent Helm Chrome Extension communicates with the local installation through Native Messaging.

## Design rule

The central architectural rule is simple:

> **Product interfaces may add UX, and providers may supply capabilities, but Agent Helm Core owns the public contract and local execution authority.**
