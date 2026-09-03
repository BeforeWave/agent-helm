# Security Model

Agent Helm gives ChatGPT controlled access to explicitly authorized local development projects.

Its security model is based on explicit authority, narrow execution scope, capability limits, and fail-closed behavior when required protection cannot be enforced.

Delegated Coding Agents are treated separately from direct Agent Helm execution: Agent Helm scopes and tracks the delegation, while the native Agent integration remains responsible for enforcing its own execution permissions and Sandbox model.

## Trust boundaries and data flow

Agent Helm is designed around a local execution environment.

Projects, Git repositories, commands, build tools, and Agent runtimes remain on the local machine.

To perform a task, ChatGPT may receive task-relevant information from the authorized local environment through MCP, including:

* relevant file contents;
* project structure;
* semantic results;
* diagnostics;
* Git information;
* command output;
* build results;
* test results.

Agent Helm therefore should not be described as a system in which no project information leaves the machine.

The important boundary is that access is scoped to authorized Workspaces, enabled capabilities, and the configured execution policy.

## Authority chain

A direct local operation through Agent Helm is constrained by several independent boundaries:

1. **Workspace authorization** — only registered local projects are eligible for context-scoped work.
2. **Execution context** — `context_setup` selects one exact Workspace and work path.
3. **Conversation ownership** — External execution contexts are associated with the ChatGPT conversation that created them.
4. **Capability policy** — command execution, semantic mutation, read/write access, and delegation can be enabled or disabled.
5. **Execution policy** — filesystem, command, environment, and network rules constrain direct local execution.
6. **Sandbox enforcement** — operations requiring OS-level containment use the supported Sandbox backend.
7. **Output-scope validation** — public MCP results pass final Agent Helm checks before being returned.

A later identifier such as `cwd`, a Worktree name, conversation intent, or Agent session ID cannot expand authority granted by an earlier layer.

## Workspace and context isolation

`workspace_list` returns logical Workspace identifiers without exposing registered local filesystem paths to the MCP client.

`context_setup` binds a `context_id` to one exact execution target:

* a Workspace base checkout; or
* a managed Worktree belonging to that Workspace.

Context-scoped Agent Helm tools inherit that target.

Changing `cwd` selects a directory only within the authority already established by the execution context.

Git operations do not retarget the context.

A delegated Agent session is associated with the same Workspace and work path for Work tracking and delegation scope, but the native integration remains responsible for enforcing its own filesystem and execution permissions.

## Direct command execution

All direct command execution exposed by Agent Helm goes through the Agent Helm execution backend.

The default execution policy is conservative:

* `allowUnsandboxed: false`;
* no additional filesystem grants;
* no additional environment grants;
* no outbound network destinations;
* local TCP binding disabled.

The selected Workspace or work path is the primary filesystem scope.

Additional host access must be explicitly granted by configuration.

Agent Helm performs static command and path checks where behavior can be determined reliably.

When static validation is insufficient and the requested operation requires stronger containment, the operation may proceed only through an enforcing Sandbox.

Static analysis can reject an operation. It cannot authorize a Sandbox bypass.

## Sandbox and fail-closed behavior

When direct Agent Helm execution requires Sandbox enforcement but the supported Sandbox is unavailable, unsupported, or unable to represent the requested policy safely, the operation fails rather than silently running with broader authority.

A user-level:

```yaml
execution:
  allowUnsandboxed: true
```

can enable only the explicitly supported fallback behavior.

It should not be treated as a general "disable security" switch.

Protected Agent Helm configuration and runtime paths remain subject to non-configurable restrictions where supported by the execution backend.

## Filesystem, environment, and temporary state

Direct execution receives Agent Helm-managed `HOME` and temporary directories instead of automatically inheriting the host user's normal state directories.

Host environment access is name-scoped.

`PATH` is retained for executable resolution, while additional host variables must be explicitly allowed.

Agent Helm-managed values such as `HOME` and `TMPDIR` are supplied by the runtime.

`execution.filesystem.allowFromEnv` can derive additional filesystem access from explicitly selected host environment variables when those values resolve to valid absolute paths.

## Network policy

Network access for direct Agent Helm execution is explicit.

Example:

```yaml
execution:
  network:
    allow:
      - registry.npmjs.org
    deny: []
    allowLocalBinding: false
```

`allow` grants configured outbound destinations.

`deny` removes configured access.

`allowLocalBinding` separately controls whether local TCP listeners may be created and is disabled by default.

Workspace-level rules are resolved together with user-level policy according to the configuration model.

## Capability boundaries

User configuration defines the maximum MCP capability surface available to Agent Helm.

External MCP can configure capabilities such as:

* command execution;
* semantic operations;
* read-only mode;
* local Agent delegation.

Native MCP does not expose generic direct command execution.

Runtime UI controls may reduce the effective External surface.

They cannot raise it above the configured capability ceiling.

Read-only mode removes mutation authority even when other resource grants would otherwise permit writes.

## MCP transport authentication

Agent Helm Core MCP HTTP endpoints require bearer-token authentication.

Generated token material is stored with restricted local permissions.

The local MCP HTTP surface is not intended to be used as a browser data plane.

Browser-origin requests to the local MCP HTTP surface are rejected even when a valid bearer token is present.

The Agent Helm Chrome Extension communicates with the local installation through Native Messaging.

## Output-scope validation

Public MCP results pass Agent Helm-owned validation before being returned to the client.

These checks provide an additional boundary against returning host data that is outside the scope of the authorized Agent Helm operation.

They are not a general-purpose data-loss-prevention system and should not be treated as a substitute for correct Workspace, execution-policy, and Sandbox enforcement.

Where Agent Helm detects an output that cannot safely be returned under the current context, the result is withheld rather than forwarded to the MCP client.

## Local Coding Agents

Agent Helm can delegate a task to a supported local Coding Agent integration.

The delegation request remains associated with the current Agent Helm Workspace, work path, conversation, and Work.

An Agent session ID identifies the delegated session and does not expand Agent Helm authority.

The native integration continues to own the Agent's:

* session persistence;
* model configuration;
* cancellation;
* UI controls;
* filesystem enforcement;
* command permissions;
* network permissions;
* Sandbox behavior.

Agent Helm's direct-execution Sandbox policy should not be assumed to automatically govern every operation performed internally by a delegated Agent.

## Security posture

Agent Helm runs real development tools against real local projects.

It should be configured deliberately.

Recommended defaults are:

* keep Workspace registration narrow;
* grant only the filesystem access a project actually needs;
* expose only the environment variables required by the toolchain;
* allow only required network destinations;
* keep local binding disabled unless necessary;
* keep unsandboxed fallback disabled unless there is a specific reason to enable it;
* review the permission and Sandbox model of each local Coding Agent integration separately.
