import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const harness = fileURLToPath(new URL('../bin/agent-helm-blackbox-cli.mjs', import.meta.url))
const fakeAgentHelm = fileURLToPath(new URL('./fake-agent-helm.mjs', import.meta.url))

test('drives the supplied Agent Helm command only through its public MCP interface', () => {
  const home = mkdtempSync(join(tmpdir(), 'agent-helm-blackbox-home-marker-'))
  try {
    const result = spawnSync(process.execPath, [harness, '--', process.execPath, fakeAgentHelm], {
      encoding: 'utf8',
      timeout: 20_000,
      env: {
        ...process.env,
        HOME: home,
        AGENT_HELM_BLACKBOX_EXPECT_HOME: home,
        AGENT_HELM_BLACKBOX_STATE_HOME: join(home, 'state-scenarios'),
        AGENT_HELM_BLACKBOX_PROBE: 'preserved',
      },
    })
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.match(result.stdout, /real MCP client initializes a transport session/)
    assert.match(result.stdout, /command profile advertises only the canonical tools, with optional complete External MCP bridge/)
    assert.match(result.stdout, /command_execute runs inside the selected MCP workspace/)
    assert.match(result.stdout, /quoted heredoc preserves literal exclamation through command_execute/)
    assert.match(result.stdout, /workspace and Agent Helm control-config boundaries/)
    assert.match(result.stdout, /destructive-command guardrail through MCP/)
    assert.match(result.stdout, /another conversation cannot use the first conversation execution context/)
    assert.match(result.stdout, /context_required/)
    assert.match(result.stdout, /unknown MCP transport session id is rejected with HTTP 404/)
    assert.match(result.stdout, /concurrent MCP command calls all complete/)
    assert.match(result.stdout, /pre-restart MCP client recovers after graceful restart without reinitializing/)
    assert.match(result.stdout, /pre-restart execution context and conversation remain usable after Agent Helm restart/)
    assert.match(result.stdout, /Access disabled returns user_access_disabled on the existing MCP session/)
    assert.match(result.stdout, /Mutations disabled rejects cached mutation calls at execution time/)
    assert.match(result.stdout, /Mutations restored preserves the configured semantic catalog on the same MCP session/)
    assert.match(result.stdout, /Delegation disabled rejects cached delegation calls at execution time/)
    assert.match(result.stdout, /Delegation restored keeps configured delegation tools in catalog/)
    assert.match(result.stdout, /all access transitions preserve the original MCP transport session/)
    assert.match(result.stdout, /Agent Helm MCP black-box OK \(\d+ checks\)/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('keeps daemon sockets independent from a deeply nested caller TMPDIR', { skip: process.platform === 'win32' }, () => {
  const home = mkdtempSync(join(tmpdir(), 'agent-helm-blackbox-long-tmp-'))
  const socketTmp = process.env.AGENT_HELM_BLACKBOX_SOCKET_TMPDIR || tmpdir()
  const deepTmp = join(home, 'nested-segment-aaaaaaaaaaaaaaaaaaaaaaaa', 'nested-segment-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'nested-segment-cccccccccccccccccccccccccccccccc')
  mkdirSync(deepTmp, { recursive: true })
  try {
    const result = spawnSync(process.execPath, [harness, '--', process.execPath, fakeAgentHelm], {
      encoding: 'utf8',
      timeout: 20_000,
      env: {
        ...process.env,
        HOME: home,
        TMPDIR: deepTmp,
        AGENT_HELM_BLACKBOX_SOCKET_TMPDIR: socketTmp,
        AGENT_HELM_BLACKBOX_EXPECT_HOME: home,
        AGENT_HELM_BLACKBOX_PROBE: 'preserved',
      },
    })
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.match(result.stdout, /Agent Helm MCP black-box OK \(\d+ checks\)/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('requires a caller-supplied launch command', () => {
  const result = spawnSync(process.execPath, [harness], { encoding: 'utf8' })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /Usage: agent-helm-blackbox .*-- <agent-helm command/)
})
