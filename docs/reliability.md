# Reliability and Verification

Agent Helm treats reliability as an externally observable product property.

The important question is not only whether an internal component is running, but whether an installed Agent Helm instance can expose the expected MCP contract, preserve execution authority, reject invalid access, recover through supported lifecycle paths, and return results that match its advertised schemas.

This document separates those reliability expectations from the test tooling used to verify them.

## Reliability principles

### Stable public contract

Public MCP tool names, schemas, capability surfaces, and entry paths should remain stable across internal implementation changes.

Provider upgrades and internal refactors must not silently change the contract presented to ChatGPT or supported integrations.

### Explicit execution context

Context-scoped work uses a `context_id` created by `context_setup`.

The context remains associated with one Workspace, one work path, and the applicable conversation boundary.

Incidental changes such as:

* changing `cwd`;
* running Git commands;
* selecting an Agent session ID;

must not silently retarget that authority.

### Fail closed at authority boundaries

Failures at authorization boundaries are expected to be explicit.

Examples include:

* missing or invalid contexts;
* cross-conversation context reuse;
* disallowed paths;
* denied commands;
* disabled capabilities;
* malformed MCP requests;
* unavailable Sandbox enforcement when that protection is required.

These failures must not result in silently broader local access.

## Failure behavior

Agent Helm separates failures by subsystem so that one unavailable capability does not need to become unrestricted fallback for another.

### Direct execution failure

A failed command returns an explicit execution result or error.

If required Sandbox protection cannot be established, the operation fails according to the configured execution policy.

### Semantic-provider failure

Semantic-provider failure affects semantic capabilities.

It should not implicitly widen direct command authority.

When diagnosing semantic-provider problems, use `agent-helm doctor` and the provider-related status information exposed by the runtime.

### Coding Agent failure

A local Coding Agent integration can be unavailable or fail independently of direct Agent Helm operations.

Delegation failure should be reported as a delegation or integration failure rather than silently replacing the selected Agent with another execution path.

### Transport failure

Tunnel or MCP transport interruption should be treated separately from Core execution state.

A transport error does not by itself imply that a previously requested local command succeeded or failed.

Clients should rely on explicit MCP results rather than infer execution success from connection state.

## Restart and recovery

Agent Helm includes lifecycle and black-box coverage for supported restart and reconnect paths.

The verified contract should be interpreted narrowly:

* the same advertised MCP endpoint can recover through the restart path exercised by the black-box suite;
* the client can reconnect;
* the tested pre-restart execution context remains usable after that verified recovery path.

This does not mean every possible crash, host reboot, tunnel replacement, configuration change, or dependency failure preserves all transient state.

If a client cannot establish that an existing context is still valid after an unverified recovery path, it should perform discovery and `context_setup` again rather than assume authority or state survived.

## Operational diagnosis

The main user-facing diagnostic commands are:

```bash
agent-helm status
agent-helm doctor
```

Use `status` to inspect the currently running Agent Helm service and its integration state.

Use `doctor` to check whether the local environment is ready for the configured features.

For installation or dependency setup problems, rerun:

```bash
agent-helm setup
```

Transport, Sandbox, semantic-provider, and Coding Agent failures should remain distinguishable in diagnostics so that users are not forced to infer the failing subsystem from a generic connectivity error.

## Canonical MCP black-box test

`@beforewave/agent-helm-blackbox` is the canonical installed-package MCP black-box harness.

It launches the supplied Agent Helm command as an external process and drives it as a real MCP client.

The harness does **not** import Agent Helm implementation modules and does not replace the server with an in-process test double.

The default profile is intentionally dependency-minimal:

```text
Command execution: enabled
Semantic operations: disabled
Delegation: disabled
Tunnel: disabled
```

This isolates the base MCP and direct-execution contract from Serena and local Coding Agent dependencies.

## What the black-box suite verifies

The current black-box suite covers externally visible invariants including:

* service startup and MCP reachability;
* bearer-token authentication;
* MCP initialization and transport sessions;
* advertised tool surface and schemas;
* authorized Workspace discovery;
* `context_setup` behavior;
* conversation/context ownership isolation;
* real command execution through MCP;
* authorized file creation and inspection;
* rejection of selected out-of-workspace access;
* rejection of selected destructive commands;
* output-schema conformance;
* invalid inputs, tools, contexts, and transport sessions;
* concurrent command execution;
* the tested service restart and reconnect path;
* continued use of the tested pre-restart execution context after that recovery path.

An optional disposable state root can enable additional capability-transition tests.

The test list should be read as verified coverage, not as a claim that every possible failure mode has been proven safe.

## Repository verification layers

The black-box harness is one verification layer.

Repository-level tests also cover narrower contracts around areas such as:

* MCP metadata and protocol schemas;
* Core and entry compatibility;
* execution backend and command policy;
* Sandbox readiness and policy combinations;
* Workspace and Worktree isolation;
* daemon and runtime-host lifecycle;
* tunnel planning and observability;
* installed CLI and release artifacts;
* Chrome native-host and setup integration;
* publish and compatibility contracts.

Overlap between test layers is intentional.

Narrow tests help identify the source of a failure, while black-box tests verify that the built product still behaves correctly from the outside.

## Running the checks

From the Agent Helm monorepo:

```bash
npm run verify:mcp-blackbox
```

The standalone harness can also run against an Agent Helm launch command:

```bash
agent-helm-blackbox -- <agent-helm command...>
```

See [`packages/agent-helm-blackbox`](../packages/agent-helm-blackbox/) for the harness and its current case list.

## Scope

The verification suite is not a formal proof of security or reliability.

It verifies the observable behaviors covered by the current test cases.

Semantic-provider correctness and native Coding Agent behavior are verified through their respective integration layers rather than by the dependency-minimal base MCP profile.
