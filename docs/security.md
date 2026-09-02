# Security Model

Agent Helm gives ChatGPT and local Coding Agents controlled access to a developer workstation. Its security model is based on explicit authority, narrow execution scope, and fail-closed behavior when required protection cannot be enforced.

## Authority chain

A local operation is constrained by several independent boundaries:

1. **Workspace authorization** — only registered local projects are eligible for work.
2. **Execution context** — `context_setup` selects one exact Workspace and work path.
3. **Conversation ownership** — an External execution context cannot be reused by another ChatGPT conversation.
4. **Capability policy** — command, semantic mutation, and delegation surfaces are explicitly enabled or disabled.
5. **Execution policy** — filesystem, command, environment, and network rules limit local execution.
6. **Sandbox enforcement** — operations that need OS-level containment use the supported Sandbox backend.
7. **Output boundary** — public MCP results pass a final confidentiality check before being returned.

No later layer can use an identifier such as `cwd`, a Worktree name, conversation intent, or Agent session ID to expand authority granted by an earlier layer.

## Workspace and context isolation

`workspace_list` returns authorized logical workspace IDs without exposing local filesystem paths to the MCP client.

`context_setup` binds a `context_id` to one exact execution target: a Workspace base checkout or a managed Worktree. Context-scoped tools inherit that target.

Changing `cwd` only selects a directory inside the established authority. Git operations do not retarget the context. Delegated Agent sessions inherit the same Workspace/work path and cannot select a different one.

## Command execution

All `command_execute` calls pass through the Agent Helm execution backend.

The default execution policy is conservative:

- `allowUnsandboxed: false`;
- no extra filesystem grants;
- no extra environment grants;
- no network destinations;
- local TCP binding disabled.

The selected Workspace/work path is the primary filesystem authority. Additional access must come from configuration.

Agent Helm performs static command/path checks where it can do so reliably. If a command's behavior cannot be safely determined statically, it may proceed only through an enforcing Sandbox. Static analysis can reject access; it cannot authorize a Sandbox bypass.

## Sandbox and fail-closed behavior

When Sandbox enforcement is required but unsupported, unavailable, or unable to represent the requested policy safely, the operation fails instead of silently running with broader authority.

An explicit user-level `execution.allowUnsandboxed: true` enables a limited fallback for statically provable write-capable commands when the Sandbox is unavailable. It does not allow unsandboxed fallback for read-only execution or protected writes.

Agent Helm's own protected configuration paths are passed to the execution backend as non-configurable write restrictions.

## Filesystem, environment, and temporary state

Execution receives managed `HOME` and temporary directories rather than inheriting the host user's normal state directories.

Host environment access is name-scoped. `PATH` is retained for executable resolution, while additional variables must be allowed explicitly. Managed variables such as `HOME` and `TMPDIR` are supplied by Agent Helm.

`execution.filesystem.allowFromEnv` can derive filesystem authority from selected host environment variables, but only from absolute, canonicalizable paths and only when the variable is not denied.

## Network policy

Network authority is explicit:

```yaml
execution:
  network:
    allow:
      - registry.npmjs.org
    deny: []
    allowLocalBinding: false
```

`allow` grants destinations, `deny` removes them, and `allowLocalBinding` separately controls whether local TCP listeners may be created. Local binding is disabled by default.

Workspace-level rules inherit user-level grants and can add restrictions or additional approved access according to the configuration model.

## Capability boundaries

The user configuration defines the fixed MCP capability ceiling.

External MCP can independently configure:

- command execution;
- semantic operations;
- read-only mode;
- local Agent delegation.

Native MCP never exposes generic command authority.

Runtime UI controls may reduce the External surface further. They cannot raise it above the configured ceiling.

Read-only mode removes mutation authority even if other resource grants would normally permit writes.

## MCP transport authentication

Core MCP HTTP endpoints require bearer tokens. Generated token files use restricted file permissions.

The local HTTP surface is not intended as a browser data plane. Browser-origin requests are rejected even if they possess a token; the Agent Helm Chrome Extension uses Native Messaging for its local connection.

## Confidential output boundary

Every public MCP tool result passes a final Agent Helm-owned confidentiality boundary.

If a result would expose host data outside the authorized execution context, Agent Helm withholds the result and returns `confidential_output_redacted` rather than forwarding the data to the client.

This is a final defense boundary; it does not replace correct workspace and execution enforcement.

## Local Coding Agents

A delegated native Agent session is scoped to the same execution context that created it. The Agent's own session ID is an identifier, not an authority token.

Native integrations continue to own their session persistence, model configuration, cancellation, and UI controls, while Agent Helm controls which Workspace/work path the delegated work belongs to.

## Security posture

Agent Helm is designed to fail closed at authority boundaries, but it runs developer tools against real local projects and should be configured deliberately.

Keep Workspace registration narrow, grant only the filesystem/environment/network access a project needs, and leave unsandboxed fallback disabled unless there is a specific reason to enable it.
