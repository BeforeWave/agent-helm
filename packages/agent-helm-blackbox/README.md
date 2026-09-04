# Agent Helm MCP Black-box

`@beforewave/agent-helm-blackbox` verifies an Agent Helm build from the outside, as a real MCP client.

The caller supplies the command that launches Agent Helm. The harness does not import Agent Helm implementation modules, inspect the tested package source tree, choose an npm version, or replace the MCP server with an in-process test server.

## Usage

Pass the Agent Helm command prefix after `--`:

```sh
agent-helm-blackbox -- <agent-helm command...>
```

Test an already installed binary:

```sh
agent-helm-blackbox -- /path/to/node_modules/.bin/agent-helm
```

Test a specific npm release:

```sh
agent-helm-blackbox -- npx --yes --package @beforewave/agent-helm@0.1.3 agent-helm
```

Everything after `--` is treated as the command prefix for the Agent Helm build under test. The harness appends the daemon arguments required to start that build on temporary MCP transport endpoints.

## Environment and isolation

The harness inherits the caller environment. It does not replace `HOME`, npm cache/prefix, XDG directories, or other user-selected state roots.

The harness does create its own temporary test fixture, config file, daemon socket, local port, and MCP bearer token so that MCP requests are directed to the supplied Agent Helm command rather than an unrelated daemon. Those temporary files are removed when the run finishes.

If the caller wants full process-state isolation, provide it outside the harness:

```sh
HOME="$TMPDIR/agent-helm-blackbox-home" \
agent-helm-blackbox -- npx --yes --package @beforewave/agent-helm@0.1.3 agent-helm
```

Without that isolation, normal Agent Helm user-level runtime state still applies. For example, persisted access disabled by the user can intentionally prevent the base black-box run from succeeding.

Capability-state cases are opt-in because they need to create persisted Agent Helm access state. The caller chooses the disposable state root explicitly:

```sh
AGENT_HELM_BLACKBOX_STATE_HOME="$TMPDIR/agent-helm-blackbox-state" \
agent-helm-blackbox -- /path/to/agent-helm
```

The harness creates a disposable HOME under that caller-provided root and removes only that directory. It never redirects state to an implicit HOME. Repository and OSS release verification provide their own temporary state roots.

## MCP profile

The harness starts the supplied Agent Helm build with a deterministic dependency-minimal MCP profile:

```text
Command execution: enabled
Semantic operations: disabled
Delegation: disabled
Tunnel: disabled
```

The base execution cases keep semantic operations and delegation disabled so they do not require Serena or a connected local Agent. When `AGENT_HELM_BLACKBOX_STATE_HOME` is supplied, the runner additionally verifies live access changes and restart recovery using the installed Agent Helm package. Provider success is not required: after an operation is restored, the test only requires that the call is no longer rejected as unavailable.

## Checks

The harness verifies the real HTTP MCP endpoint exposed by the supplied Agent Helm command:

1. the process starts a reachable MCP server;
2. an invalid bearer token is rejected;
3. a real MCP client completes `initialize` and receives a transport session;
4. `tools/list` advertises exactly the expected command-only tool set;
5. every advertised tool includes input and output schemas;
6. `workspace_list` exposes the temporary authorized workspace;
7. `helm_status` reports the requested command-only capability profile;
8. `context_setup` returns an execution context;
9. `bind_conversation_intent` binds the MCP correlation to that context;
10. `command_execute` runs `pwd`, an ordinary command, and authorized file inspection through MCP;
11. workspace file create/remove operations work through MCP;
12. a direct read outside the workspace is rejected with `shell_path_not_allowed`;
13. a destructive Git reset is rejected with `destructive_command_denied`;
14. successful tool results match each tool's advertised output schema;
15. repeated context setup for the same conversation/target is stable while another conversation receives a distinct context;
16. cross-conversation context use is rejected with `context_ownership_mismatch`;
17. missing/unknown contexts, invalid tool input, unknown tools, missing transport sessions, and unknown transport session ids fail with the public contract;
18. multiple concurrent real `command_execute` calls complete independently and leave the MCP server usable;
19. the supplied Agent Helm service can restart on the same endpoint while the existing MCP client recovers without reinitializing;
20. restart recovery preserves the MCP transport session id and the pre-restart Helm execution context/conversation remains usable for real command execution.

With `AGENT_HELM_BLACKBOX_STATE_HOME`, the same runner additionally verifies live `on -> off -> on` access transitions while preserving one execution context and one MCP transport session:

- every access, mutation, and delegation transition emits `notifications/tools/list_changed` to the existing MCP client;
- Disabling access keeps `tools/list` stable and calls return `user_access_disabled`; restoring access makes the same client/session callable again;
- Disabling mutations keeps semantic queries, removes semantic mutation tools, and a stale mutation call returns `tool_not_available_on_surface`; restoring mutations re-advertises the mutation tool and a subsequent call is no longer rejected as unavailable;
- Disabling delegation removes delegated session tools, a stale delegation call returns `tool_not_available_on_surface`, and `helm_status` reports delegation disabled; restoring delegation re-advertises delegated session tools and subsequent calls are no longer rejected as unavailable;
- the MCP transport session id remains unchanged across all six state transitions.

This package is the canonical source for installed-package MCP black-box cases. Repository verification invokes this runner rather than maintaining a second black-box case list. Internal simulated protocol tests may overlap behavior, but they are not the black-box contract.

The runner prints the number of MCP checks it actually executed in its final success line. The exact count may grow as the canonical contract expands; the success line has this shape:

```text
Agent Helm MCP black-box OK (N checks)
```

`npm test` for this package is only the runner's own self-test against a fake MCP target, so its Node test count is not the black-box case count.

## Exit status

The command exits with status `0` only when all MCP black-box checks pass.

A target startup failure, authentication failure, MCP contract mismatch, tool-call failure, command-execution failure, or missing security rejection causes a non-zero exit status. Target stdout/stderr captured during startup is included when it is needed to diagnose a startup failure.

## Startup timeout

The default startup deadline is 60 seconds, allowing commands such as `npx` to resolve an npm package before Agent Helm starts. Override it when necessary:

```sh
AGENT_HELM_BLACKBOX_START_TIMEOUT_MS=120000 \
agent-helm-blackbox -- npx --yes --package @beforewave/agent-helm@0.1.3 agent-helm
```
