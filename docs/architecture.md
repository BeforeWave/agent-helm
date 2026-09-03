# Architecture

Agent Helm connects ChatGPT in the browser to an authorized local development environment.

It provides the stable MCP contract used by ChatGPT, keeps local work scoped to explicit Workspaces and execution contexts, runs direct local operations through its execution backend, provides project intelligence, and connects to local Coding Agent integrations when work is delegated.

## System shape

Agent Helm has two main browser-facing paths:

```text
ChatGPT in the browser
        │
        │ Managed tunnel / Secure MCP
        ▼
 Agent Helm Core
        │
        ├── Authorized local projects
        ├── Command execution
        ├── Project intelligence
        └── Local Coding Agent integrations


Agent Helm Chrome Extension
        │
        │ Native Messaging
        ▼
 Agent Helm Core
```

The Chrome Extension is a browser-side product interface. It does not use the local MCP HTTP endpoint as a browser data plane.

DSH with ChatGPT and other Agent integrations connect to the same local Core through their supported integration contracts.

## Core responsibilities

The long-running Agent Helm Core owns:

* user configuration;
* the Workspace registry;
* External and Native MCP surfaces;
* execution-context creation and validation;
* conversation and Work correlation;
* direct command execution policy;
* Sandbox integration for direct execution;
* semantic-provider lifecycle;
* local Coding Agent registration and delegation;
* the optional external tunnel.

This keeps the public MCP contract and direct local execution authority in one place.

Product interfaces may add UX, and providers may supply capabilities, but neither can silently expand the authority granted by Agent Helm configuration.

## Workspaces and execution contexts

A **Workspace** is a local project that has been explicitly registered with Agent Helm.

`workspace_list` exposes logical Workspace identifiers to the MCP client without exposing local filesystem paths.

Before context-scoped work begins, the client calls `context_setup`.

The returned `context_id` identifies one exact execution target:

* the Workspace base checkout; or
* one managed Worktree associated with that Workspace.

Changing `cwd`, Git state, conversation intent, or an Agent session ID does not retarget an existing context.

Moving to another Workspace or Worktree requires another `context_setup`.

Conversation intent is provenance. It can describe why a conversation is using a context, but it cannot expand filesystem, command, network, or delegation authority.

## MCP surfaces

Agent Helm exposes separate MCP capability surfaces for browser ChatGPT and local integrations.

### External MCP

External MCP is used by ChatGPT.

Depending on configuration, it may expose:

* project and semantic operations;
* direct command execution;
* mutation capabilities;
* local Coding Agent delegation.

### Native MCP

Native MCP is used by supported local Agent integrations.

It exposes only the capabilities intended for native integrations and does not provide generic command execution authority.

Public MCP tool names and schemas belong to Agent Helm rather than to an individual semantic provider.

This allows the underlying provider to change without silently changing the public MCP surface.

## Direct command execution

Direct commands requested through Agent Helm run through the Agent Helm execution backend.

The execution path combines:

1. the selected Workspace and work-path scope;
2. command and path policy checks;
3. the effective execution policy;
4. OS-level Sandbox enforcement when required;
5. normalized MCP results and output-scope validation.

Execution uses Agent Helm-managed `HOME` and temporary directories.

The complete host environment is not copied into child processes. `PATH` is retained for executable resolution, while additional host environment variables are controlled by policy.

Command text cannot authorize its own Sandbox bypass.

## Project intelligence

Agent Helm keeps project-intelligence configuration independent from a specific provider.

Settings such as:

* languages;
* ignored paths;
* Git-ignore behavior;

belong to Agent Helm configuration.

Serena is currently used as the semantic provider.

Agent Helm creates and manages provider runtimes for authorized working copies and translates the effective Agent Helm configuration into provider-specific settings.

The public MCP contract remains owned by Agent Helm.

## Local Coding Agents

Agent Helm can delegate work to supported local Coding Agent integrations.

Delegation is associated with the current Agent Helm execution context, so Agent Helm knows which Workspace and work path the task belongs to and can associate the resulting Agent session with the same Work.

The Agent session ID is an identifier. It does not grant additional Agent Helm authority.

The native Agent integration remains responsible for the Agent's own execution behavior, including its:

* filesystem access;
* command execution;
* network access;
* permission model;
* Sandbox model;
* model configuration;
* session lifecycle;
* cancellation and UI controls.

Agent Helm does not claim that its direct-execution Sandbox is automatically imposed on the internal execution of every delegated Coding Agent.

## Data flow

Projects and execution environments remain on the local machine, but task-relevant local information can be returned to ChatGPT through MCP.

Depending on the task and enabled capabilities, this may include:

* relevant file contents;
* project structure;
* semantic results;
* diagnostics;
* Git state and diffs;
* command output;
* build and test results.

This information is what allows ChatGPT to work against the real project instead of relying only on content manually pasted into the conversation.

The Chrome Extension uses Native Messaging for its local connection. It does not expose the local MCP HTTP endpoint directly to browser JavaScript.

## Transport

Agent Helm Core exposes authenticated MCP endpoints on the local machine.

External ChatGPT connectivity can be provided through the managed tunnel.

The local HTTP surface uses bearer-token authentication and is not intended to be used as a general browser-facing API.

## Design rule

The central architectural rule is:

> **Agent Helm owns the public MCP contract and the authority for direct local execution. Product interfaces add UX, providers add capabilities, and native Agent integrations retain responsibility for their own execution environment.**
