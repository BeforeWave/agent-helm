# Reliability and Black-box Testing

Agent Helm treats reliability as an externally observable contract: the installed service must start, expose the expected MCP surface, preserve execution authority, reject invalid access, survive supported restart paths, and return results that match its advertised schemas.

## Reliability principles

### Stable public contract

Public MCP tool names, schemas, capability surfaces, and entry paths are verified separately from provider implementations. Internal refactors should not silently change the protocol presented to ChatGPT or integrations.

### Explicit execution context

Context-scoped work always uses a `context_id` created by `context_setup`. The context stays bound to one Workspace/work path and one conversation ownership boundary until another context is established.

This prevents incidental changes such as `cwd`, Git operations, or a delegated Agent session ID from changing execution authority.

### Fail closed at authority boundaries

Missing contexts, cross-conversation context reuse, disallowed paths, destructive commands, unavailable required Sandbox enforcement, disabled capabilities, and malformed MCP requests return explicit failures instead of silently widening access.

### Recovery without changing the client contract

Daemon and transport lifecycle tests cover recovery on the same MCP endpoint. Existing clients and execution contexts are expected to remain usable across supported Core restart flows where the transport contract is preserved.

## Canonical MCP black-box test

`@beforewave/agent-helm-blackbox` is the canonical installed-package MCP black-box harness.

It launches the supplied Agent Helm command as an external process and drives it as a real MCP client. The harness does **not** import Agent Helm implementation modules or replace the server with an in-process test double.

The default profile is intentionally dependency-minimal:

```text
Command execution: enabled
Semantic operations: disabled
Delegation: disabled
Tunnel: disabled
```

This isolates the base MCP and execution contract from Serena or a connected Coding Agent.

### What it verifies

The black-box suite covers the main externally visible invariants:

- service startup and MCP reachability;
- bearer-token authentication;
- MCP initialization and transport sessions;
- exact advertised tool surface and schemas;
- authorized Workspace discovery;
- stable `context_setup` behavior;
- conversation/context ownership isolation;
- real `command_execute` operations through MCP;
- authorized file creation and inspection;
- rejection of out-of-workspace reads and destructive Git reset;
- output-schema conformance;
- invalid inputs, tools, contexts, and transport sessions;
- concurrent command execution without corrupting the MCP service;
- service restart and client recovery on the same endpoint;
- continued use of the pre-restart execution context after recovery.

An optional disposable state root enables additional live capability-transition checks, including External access, mutation, and delegation changes without replacing the MCP client session.

## Repository verification layers

The black-box harness is one layer, not the entire test strategy. Repository verification also checks narrower contracts around:

- MCP public metadata and protocol schemas;
- Core/entry protocol compatibility;
- execution backend and shell-policy behavior;
- Sandbox readiness and policy matrices;
- workspace and Worktree isolation;
- daemon and runtime-host lifecycle;
- tunnel planning, reconciliation, and observability;
- installed CLI and release artifacts;
- Chrome native-host and setup integration;
- OSS projection and publish contracts.

These tests intentionally overlap at important boundaries. Unit-level checks explain a failure precisely; black-box checks confirm the built product still behaves correctly from the outside.

## Running the checks

From the Agent Helm monorepo, the canonical repository black-box entry point is:

```bash
npm run verify:mcp-blackbox
```

The standalone black-box package accepts any Agent Helm launch command:

```bash
agent-helm-blackbox -- <agent-helm command...>
```

For example, it can target an already installed binary or a specific package version resolved by the caller.

See [`packages/agent-helm-blackbox`](../packages/agent-helm-blackbox/) for the harness and its complete current case list.

## Scope

The black-box suite verifies the observable Agent Helm contract. It is not a formal proof of security and does not claim that every external dependency is bug-free.

Semantic-provider correctness and native Coding Agent behavior are tested through their own integration layers; the dependency-minimal base black-box profile deliberately does not require them.
