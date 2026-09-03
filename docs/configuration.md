# Configuration

For normal installation and setup, start with:

```bash
agent-helm setup
```

`agent-helm setup` checks the local environment and prepares the components required by the configured Agent Helm features.

Manual configuration is available when you need explicit Workspace, capability, execution, network, or semantic policy.

## Register a Workspace

To register the current project with Agent Helm:

```bash
cd /path/to/project
agent-helm workspace add
```

A Workspace represents a local project that Agent Helm is allowed to use.

Workspace registration and Workspace-specific policy are related but separate concerns:

* `agent-helm workspace add` registers a project for use by Agent Helm;
* `workspaces[]` in the user configuration is used when you need explicit persistent policy such as execution rules, semantic settings, or a configured Worktree root.

## Configuration source

Agent Helm has one user-scoped configuration file:

```text
~/.config/agent-helm/config.yml
```

Repo-local `.agent-helm/config.yml` files are not configuration authorities.

Workspace-specific policy belongs under the corresponding `workspaces[]` entry in the user configuration.

The effective host configuration is resolved from:

1. built-in defaults;
2. `~/.config/agent-helm/config.yml`;
3. supported launcher or runtime overrides.

When an execution context selects a registered Workspace, the effective Workspace-specific `execution` and `semantic` settings are applied to the selected base checkout or managed Worktree.

## A practical configuration

```yaml
execution:
  filesystem:
    readOnly:
      - ~/.cache/shared-reference
    allow:
      - ~/.cache/shared-tools

  runtime:
    roots:
      - ~/.local/share/project-toolchain

  network:
    allow:
      - registry.npmjs.org
    allowLocalBinding: false

mcp:
  maxAnswerChars: 150000

  external:
    command: true
    semantic: true
    read_only: false
    delegate: true

  native:
    semantic: true
    delegate: false

workspaces:
  - title: example
    path: ~/Workspace/example
    worktreeBasePath: ~/Workspace/example/.worktrees

    execution:
      filesystem:
        readOnly:
          - ../shared-reference
        allow:
          - ../shared-generated
        allowFromEnv:
          - GOMODCACHE
        deny:
          - private

      runtime:
        roots:
          - runtime-local

      commands:
        deny:
          - npm publish

      network:
        allow:
          - api.example.com

    semantic:
      languages:
        - typescript
      ignoredPaths:
        - generated/**
      respectGitignore: true
```

Keep global grants narrow.

Put project-specific access and restrictions on the relevant Workspace entry when possible.

## Workspaces

A configured Workspace entry supports:

| Field              | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `path`             | Authorized project root.                                                 |
| `title`            | Human-readable Workspace name.                                           |
| `worktreeBasePath` | Root under which managed linked Worktrees may be created or reused.      |
| `execution`        | Workspace-specific filesystem, command, environment, and network policy. |
| `semantic`         | Workspace-specific project-intelligence settings.                        |

For ordinary project registration:

```bash
agent-helm workspace add
```

Use an explicit `workspaces[]` entry when the project requires persistent per-Workspace policy or a configured Worktree root.

Workspace-level configuration cannot raise user-level authority such as daemon settings, HTTP binding, tunnel configuration, MCP capability ceilings, `allowUnsandboxed`, or command-worker count.

## Execution policy

The top-level `execution` section controls direct local command authority.

```yaml
execution:
  allowUnsandboxed: false
  commandWorkers: 4

  filesystem:
    readOnly: []
    allow: []
    allowFromEnv: []
    deny: []

  runtime:
    roots: []

  commands:
    allow: []
    deny: []

  env:
    allow: []
    deny: []

  network:
    allow: []
    deny: []
    allowLocalBinding: false
```

The defaults add no extra host filesystem, environment, or network grants and keep unsandboxed fallback disabled.

### Filesystem

The selected Workspace or work path is the primary execution scope.

`filesystem.readOnly` adds explicitly configured paths as read-only authority.

`filesystem.allow` adds explicitly configured read/write paths.

`filesystem.deny` removes access to configured paths and remains restrictive when it overlaps either read-only or read/write authority.

At Workspace level, relative paths are resolved against the selected working copy so the policy follows the base checkout or managed Worktree.

Example:

```yaml
execution:
  filesystem:
    readOnly:
      - ~/.cache/shared-reference
    allow:
      - ~/.cache/shared-tools
```

Read-only roots enlarge readable authority without becoming writable authority. They are enforced separately from `filesystem.allow`.

Use `allowFromEnv` when a toolchain exposes a required host path through an environment variable:

```yaml
execution:
  filesystem:
    allowFromEnv:
      - GOMODCACHE
```

A selected environment variable can contribute filesystem authority only when its value can be resolved as valid absolute host paths according to the runtime's path validation rules.

Missing or empty values add no authority.

Agent Helm-managed variables such as `HOME` and `TMPDIR` are not intended to be used to derive additional host filesystem grants.

### Runtime roots

`execution.runtime.roots` adds explicit read-only runtime/toolchain roots that commands may need in order to start or load dependencies.

Runtime roots are separate from project/data filesystem authority: they do not become writable, and they do not behave like `filesystem.allow`.

At Workspace level, relative runtime roots are resolved against the selected working copy.

Example:

```yaml
execution:
  runtime:
    roots:
      - runtime-local
```

Ordinary executables already reachable through the daemon-captured `PATH` normally do not need to be repeated here. Use explicit runtime roots only for additional runtime layouts that are not covered by the captured runtime substrate.

### Commands

`commands.allow` and `commands.deny` constrain direct command execution.

Example:

```yaml
execution:
  commands:
    deny:
      - npm publish
      - git clean
```

Command policy should be treated as an additional restriction layer rather than as a replacement for filesystem, network, environment, or Sandbox enforcement.

Workspace command restrictions are combined with user-level policy, and deny rules remain restrictive.

### Environment

Host environment access is name-scoped.

Example:

```yaml
execution:
  env:
    allow:
      - CI
      - NODE_ENV

    deny:
      - AWS_SECRET_ACCESS_KEY
```

Agent Helm supplies managed execution values for `HOME` and temporary directories.

`PATH` is retained for executable resolution.

The complete daemon environment is not copied automatically into child commands.

### Network

Example:

```yaml
execution:
  network:
    allow:
      - registry.npmjs.org

    deny:
      - blocked.example.com

    allowLocalBinding: false
```

Outbound network destinations are controlled separately from local TCP listener creation.

`allowLocalBinding` is disabled by default.

Workspace network settings are resolved together with user-level network policy.

### Unsandboxed fallback

`execution.allowUnsandboxed` is user-level only and defaults to:

```yaml
execution:
  allowUnsandboxed: false
```

When enabled, it permits only the fallback behavior explicitly supported by the Agent Helm execution backend.

It is not a general "disable security" switch.

See the [Security Model](./security.md) for the security implications.

## MCP capabilities

The `mcp` section defines the maximum capability surface exposed by Agent Helm Core.

```yaml
mcp:
  maxAnswerChars: 150000

  external:
    command: true
    semantic: true
    read_only: false
    delegate: true

  native:
    semantic: true
    delegate: false
```

External runtime UI controls may reduce this surface.

They cannot raise it above the configured ceiling.

Native MCP intentionally does not expose generic direct command authority.

MCP capability ceilings are user-level settings and cannot be raised by Workspace configuration.

## Semantic configuration

Semantic settings are provider-neutral.

```yaml
semantic:
  languages: []
  ignoredPaths: []
  respectGitignore: true
```

Workspace-specific semantic settings can be placed under:

```yaml
workspaces:
  - title: example
    path: ~/Workspace/example

    semantic:
      languages:
        - typescript
      ignoredPaths:
        - generated/**
      respectGitignore: true
```

Serena is currently used as the semantic provider.

An empty `semantic.languages` list means Agent Helm does not predeclare a language set; the provider may auto-detect the project languages. Explicit language entries are useful when auto-detection is undesirable or ambiguous.

Provider-specific files such as:

```text
.serena/project.yml
.serena/project.local.yml
```

are not Agent Helm configuration authorities.

Put Agent Helm project-intelligence policy in Agent Helm configuration instead.

## Daemon, HTTP, and tunnel

These sections control advanced host-level behavior.

Example:

```yaml
daemon:
  socket: ~/.agent-helm/run/daemon.sock

http:
  host: 127.0.0.1
  port: 3457

tunnel:
  enabled: true
  command: tunnel-client
  profile: agent-helm
  healthListenAddr: 127.0.0.1:3458
```

The supported HTTP host configuration is restricted to loopback.

MCP HTTP endpoints use bearer-token authentication.

For tunnel installation and credentials, prefer:

```bash
agent-helm setup
```

instead of manually managing secret material in the YAML file.

## Validate changes

After changing configuration:

```bash
agent-helm doctor
agent-helm status
```

For installation or dependency setup problems:

```bash
agent-helm setup
```

Agent Helm configuration parsing is strict.

Unsupported fields and invalid authority combinations are rejected rather than silently ignored.
