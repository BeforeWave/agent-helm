# Configuration

For normal installation, start with:

```bash
agent-helm setup
```

`agent-helm setup` checks the semantic provider, installs the manifest-pinned tunnel client when needed, guides tunnel credentials, checks Sandbox readiness, and reports whether the installation is ready to start.

Manual configuration is available when you need explicit Workspace, capability, execution, or semantic policy.

## Configuration source

Agent Helm has one user-scoped configuration file:

```text
~/.config/agent-helm/config.yml
```

Repo-local `.agent-helm/config.yml` files are not configuration sources. Workspace-specific policy belongs under the corresponding `workspaces[]` entry in the user config.

The effective host configuration is resolved in this order:

1. built-in defaults;
2. `~/.config/agent-helm/config.yml`;
3. explicit launcher/runtime overrides.

When an execution context selects a registered Workspace, Agent Helm then applies that Workspace's nested `execution` and `semantic` settings to the selected base checkout or Worktree.

## A practical configuration

```yaml
execution:
  filesystem:
    allow:
      - ~/.cache/shared-tools
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
        allow:
          - ../shared-generated
        allowFromEnv:
          - GOMODCACHE
        deny:
          - private
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

Keep the global section small. Put project-specific grants and restrictions on the relevant Workspace entry.

## Workspaces

A Workspace entry supports:

| Field | Purpose |
| --- | --- |
| `path` | Authorized project root. Required. |
| `title` | Human-readable project name. |
| `worktreeBasePath` | Root under which Agent Helm may create or reuse managed linked Worktrees. |
| `execution` | Workspace-specific filesystem, command, environment, and network policy. |
| `semantic` | Workspace-specific semantic code-intelligence settings. |

For simple registration, `agent-helm init` can add the current project to Agent Helm's managed runtime state. Use `workspaces[]` when you need persistent per-project policy or a configured Worktree root.

A Workspace entry cannot configure daemon, HTTP, tunnel, MCP capability ceilings, `allowUnsandboxed`, or command-worker count. Those remain user-level authority.

## Execution policy

The top-level `execution` section controls local command authority.

```yaml
execution:
  allowUnsandboxed: false
  commandWorkers: 4

  filesystem:
    allow: []
    allowFromEnv: []
    deny: []

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

The defaults add no extra host grants, disable local TCP binding, and keep unsandboxed fallback disabled.

### Filesystem

The selected Workspace/work path is the primary execution scope.

`filesystem.allow` adds paths; `filesystem.deny` removes access. At Workspace level, relative paths are resolved against the selected execution working copy, so the same rule follows the base checkout or managed Worktree.

`filesystem.allowFromEnv` is useful for toolchain directories such as language caches:

```yaml
execution:
  filesystem:
    allowFromEnv:
      - GOMODCACHE
```

The named variable is also made visible to the child environment. If it is set, every path in its platform-delimited value must be absolute and canonicalizable. Missing or empty values add no filesystem authority. Agent Helm-managed variables such as `HOME` and `TMPDIR` cannot be used to derive host filesystem grants.

### Commands

`commands.allow` and `commands.deny` use normalized command rules. Workspace rules inherit user-level rules; deny rules remain additive.

Use command restrictions for explicit policy such as:

```yaml
execution:
  commands:
    deny:
      - npm publish
      - git clean
```

### Environment

Host environment access is name-scoped:

```yaml
execution:
  env:
    allow:
      - CI
      - NODE_ENV
    deny:
      - AWS_SECRET_ACCESS_KEY
```

Agent Helm supplies managed execution values for `HOME` and temporary directories. `PATH` is retained for executable lookup; the complete daemon environment is not copied into commands.

### Network

```yaml
execution:
  network:
    allow:
      - registry.npmjs.org
    deny:
      - blocked.example.com
    allowLocalBinding: false
```

`allowLocalBinding` controls local TCP listeners separately from outbound destinations and is disabled by default.

Workspace network settings inherit user-level allow/deny rules and may override `allowLocalBinding` for that Workspace.

### Unsandboxed fallback

`execution.allowUnsandboxed` is user-level only and defaults to `false`.

When enabled, it permits only the limited fallback described in the [Security Model](./security.md). It should not be treated as a general "disable security" switch.

## MCP capabilities

The `mcp` section defines the fixed capability ceiling exposed by Core.

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

External runtime UI controls may reduce this surface but cannot raise it above the configured ceiling.

Native MCP intentionally has no generic command capability.

These settings are user-level and cannot be overridden per Workspace.

## Semantic configuration

Semantic settings are provider-neutral:

```yaml
semantic:
  languages: []
  ignoredPaths: []
  respectGitignore: true
```

A Workspace can add its own `languages` and `ignoredPaths`, and can override `respectGitignore`.

Serena is currently the semantic provider, but `.serena/project.yml` and `.serena/project.local.yml` are not Agent Helm configuration authorities. Put project semantic settings under `workspaces[].semantic` instead.

## Daemon, HTTP, and tunnel

These sections are advanced host-level settings:

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

The HTTP host is restricted to loopback configuration. MCP endpoints use bearer-token authentication.

For tunnel installation and credentials, prefer `agent-helm setup` rather than manually managing secret material in the YAML file.

## Validate changes

After changing configuration, use:

```bash
agent-helm doctor
agent-helm status
```

For installation or dependency problems, rerun:

```bash
agent-helm setup
```

Configuration parsing is strict: unsupported fields and invalid authority combinations are rejected instead of being silently ignored.
