#!/usr/bin/env node

import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv'

const argv = process.argv.slice(2)
const separator = argv.indexOf('--')
if (separator < 0 || separator === argv.length - 1) {
  console.error('Usage: agent-helm-blackbox -- <agent-helm command...>')
  console.error('Example: agent-helm-blackbox -- npx --yes --package @beforewave/agent-helm@0.1.3 agent-helm')
  process.exit(2)
}

const commandPrefix = argv.slice(separator + 1)
const executable = commandPrefix[0]
const prefixArgs = commandPrefix.slice(1)
const startTimeoutMs = Number(process.env.AGENT_HELM_BLACKBOX_START_TIMEOUT_MS ?? 60_000)
const stateHomeRoot = process.env.AGENT_HELM_BLACKBOX_STATE_HOME?.trim()
if (!Number.isFinite(startTimeoutMs) || startTimeoutMs <= 0) throw new Error('AGENT_HELM_BLACKBOX_START_TIMEOUT_MS must be positive')

let checkCount = 0
function check(label, condition, detail = '') {
  checkCount += 1
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!condition) throw new Error(label)
}

function errorCode(result) {
  const text = result.content?.find((entry) => entry.type === 'text')?.text ?? '{}'
  try { return JSON.parse(text).error?.code } catch { return undefined }
}

function commandResult(result) {
  return result.structuredContent?.result
}

function resultDetail(result) {
  if (result.isError === true) return `error=${errorCode(result) ?? 'unknown'} ${result.content?.find((entry) => entry.type === 'text')?.text ?? ''}`
  return JSON.stringify(result.structuredContent ?? result.content ?? null)
}

function sameNames(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort())
}

function terminateProcessTree(child) {
  if (!child?.pid || child.exitCode !== null) return
  if (process.platform !== 'win32') {
    try { process.kill(-child.pid, 'SIGTERM'); return } catch {}
  }
  try { child.kill('SIGTERM') } catch {}
}

async function waitForExit(child, timeoutMs = 10_000) {
  if (!child || child.exitCode !== null) return
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) {
        if (process.platform !== 'win32' && child.pid) {
          try { process.kill(-child.pid, 'SIGKILL') } catch {}
        } else {
          try { child.kill('SIGKILL') } catch {}
        }
      }
      resolve()
    }, timeoutMs)
    child.once('exit', () => { clearTimeout(timer); resolve() })
  })
}

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close((error) => error ? reject(error) : resolve(port))
    })
  })
}

class LineBuffer {
  #lines = []
  constructor(limit = 120) { this.limit = limit }
  push(chunk) {
    for (const line of String(chunk).replace(/\r/g, '').split('\n')) {
      if (!line) continue
      this.#lines.push(line)
      if (this.#lines.length > this.limit) this.#lines.shift()
    }
  }
  text() { return this.#lines.join('\n') }
}

async function waitForHealth(url, child, stderr) {
  const deadline = Date.now() + startTimeoutMs
  let lastError
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Agent Helm target exited during startup with code ${String(child.exitCode)}\n${stderr.text()}`)
    try {
      const response = await fetch(new URL('/healthz', url), { signal: AbortSignal.timeout(750) })
      if (response.ok) return
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Agent Helm MCP did not become ready within ${startTimeoutMs}ms${lastError ? `: ${lastError instanceof Error ? lastError.message : String(lastError)}` : ''}\n${stderr.text()}`)
}

async function connectClient(url, token, name) {
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  })
  const client = new Client({ name, version: '0.1.0' })
  await client.connect(transport)
  return { client, transport }
}

async function rawMcpRequest(url, token, { method = 'POST', sessionId, body } = {}) {
  const headers = { Authorization: `Bearer ${token}` }
  if (body !== undefined) {
    headers['content-type'] = 'application/json'
    headers.accept = 'application/json, text/event-stream'
  }
  if (sessionId) headers['mcp-session-id'] = sessionId
  return await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  })
}

function rpc(method, id = 1, params = {}) {
  return { jsonrpc: '2.0', id, method, params }
}

async function nativeControlRequest({ home, socket, method, params = [] }) {
  return await new Promise((resolve, reject) => {
    const control = spawn(executable, [...prefixArgs, 'chrome-native-host'], {
      env: {
        ...process.env,
        HOME: home,
        USERPROFILE: home,
        AGENT_HELM_DAEMON_SOCKET: socket,
        ...(process.env.AGENT_HELM_BLACKBOX_EXPECT_HOME ? { AGENT_HELM_BLACKBOX_EXPECT_HOME: home } : {}),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: process.platform === 'win32',
    })
    const stdout = []
    const stderr = new LineBuffer()
    let settled = false
    const fail = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    const timer = setTimeout(() => {
      terminateProcessTree(control)
      fail(new Error(`Agent Helm control request timed out: ${method}\n${stderr.text()}`))
    }, Math.min(startTimeoutMs, 15_000))
    control.stdout?.on('data', (chunk) => stdout.push(Buffer.from(chunk)))
    control.stderr?.on('data', (chunk) => stderr.push(chunk))
    control.once('error', fail)
    control.once('close', (code) => {
      clearTimeout(timer)
      if (settled) return
      if (code !== 0) return fail(new Error(`Agent Helm control request failed with code ${String(code)}: ${method}\n${stderr.text()}`))
      try {
        const output = Buffer.concat(stdout)
        if (output.length < 4) throw new Error('missing Chrome Native Messaging response frame')
        const length = output.readUInt32LE(0)
        if (length <= 0 || output.length < 4 + length) throw new Error('incomplete Chrome Native Messaging response frame')
        const response = JSON.parse(output.subarray(4, 4 + length).toString('utf8'))
        if (response.error) throw new Error(String(response.error))
        settled = true
        resolve(response.result)
      } catch (error) {
        fail(error)
      }
    })
    const payload = Buffer.from(JSON.stringify({ id: `blackbox-control-${randomBytes(6).toString('hex')}`, method, params }), 'utf8')
    const frame = Buffer.allocUnsafe(4 + payload.length)
    frame.writeUInt32LE(payload.length, 0)
    payload.copy(frame, 4)
    control.stdin?.end(frame)
  })
}

async function waitForNotificationCount(readCount, minimum, label) {
  const deadline = Date.now() + 3_000
  while (Date.now() < deadline) {
    if (readCount() >= minimum) return
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  check(label, false, `count=${readCount()} expected>=${minimum}`)
}

async function runDynamicAccessStateScenario({ root, workspace }) {
  const scenarioRoot = mkdtempSync(join(root, 'agent-helm-live-access-'))
  const scenarioHome = join(scenarioRoot, 'home')
  const scenarioConfig = join(scenarioRoot, 'config.yml')
  const scenarioSocket = join(scenarioRoot, 'daemon.sock')
  const scenarioStateDir = join(scenarioHome, '.agent-helm')
  const scenarioPort = await freePort()
  const scenarioToken = randomBytes(24).toString('base64url')
  const scenarioUrl = `http://127.0.0.1:${scenarioPort}/mcp`
  const scenarioCorrelation = `agent-helm-blackbox-live-access-${randomBytes(8).toString('hex')}`
  const scenarioStdout = new LineBuffer()
  const scenarioStderr = new LineBuffer()
  let scenarioChild
  let scenarioClient
  try {
    mkdirSync(scenarioStateDir, { recursive: true })
    writeFileSync(join(scenarioStateDir, 'state.json'), `${JSON.stringify({
      coreEnabled: true,
      localMcpEnabled: false,
      externalUserAccess: { enabled: true, mutations: true, delegation: true },
      disabledAgentIds: [],
      manualWorkspaces: [],
    }, null, 2)}\n`)
    writeFileSync(scenarioConfig, `${JSON.stringify({
      workspaces: [{ path: workspace, title: 'agent-helm-blackbox-fixture' }],
      mcp: {
        external: { command: true, semantic: true, read_only: false, delegate: true },
        native: { semantic: false, delegate: false },
      },
      tunnel: { enabled: false },
    }, null, 2)}\n`)
    scenarioChild = spawn(executable, [
      ...prefixArgs,
      'daemon',
      '--config', scenarioConfig,
      '--socket', scenarioSocket,
      '--host', '127.0.0.1',
      '--port', String(scenarioPort),
      '--no-tunnel',
      '--lifecycle-owner', 'mcp:blackbox:live-access',
    ], {
      env: {
        ...process.env,
        HOME: scenarioHome,
        USERPROFILE: scenarioHome,
        ...(process.env.AGENT_HELM_BLACKBOX_EXPECT_HOME ? { AGENT_HELM_BLACKBOX_EXPECT_HOME: scenarioHome } : {}),
        AGENT_HELM_TOKEN: scenarioToken,
      },
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: process.platform === 'win32',
    })
    scenarioChild.stdout?.on('data', (chunk) => scenarioStdout.push(chunk))
    scenarioChild.stderr?.on('data', (chunk) => scenarioStderr.push(chunk))
    await waitForHealth(scenarioUrl, scenarioChild, scenarioStderr)
    const connected = await connectClient(scenarioUrl, scenarioToken, 'agent-helm-blackbox-live-access')
    scenarioClient = connected.client
    const sessionId = connected.transport.sessionId
    let toolListChanges = 0
    scenarioClient.fallbackNotificationHandler = (notification) => {
      if (notification.method === 'notifications/tools/list_changed') toolListChanges += 1
    }

    const baseline = await scenarioClient.listTools()
    const baselineNames = new Set(baseline.tools.map((tool) => tool.name))
    check('live access baseline advertises representative semantic and delegation tools', baselineNames.has('semantic_find_symbol') && baselineNames.has('semantic_rename_symbol') && baselineNames.has('agent_sessions_create'))
    const workspaceList = await scenarioClient.callTool({ name: 'workspace_list', arguments: {}, _meta: { 'openai/session': scenarioCorrelation } })
    const fixtureWorkspace = workspaceList.structuredContent?.workspaces?.find((entry) => entry.title === 'agent-helm-blackbox-fixture')
    check('live access scenario resolves the fixture workspace', typeof fixtureWorkspace?.id === 'string')
    const setup = await scenarioClient.callTool({ name: 'context_setup', arguments: { workspace_id: fixtureWorkspace.id }, _meta: { 'openai/session': scenarioCorrelation } })
    const contextId = setup.structuredContent?.context_id
    check('live access scenario establishes one persistent MCP execution context', typeof contextId === 'string' && contextId.length > 0)
    const bind = await scenarioClient.callTool({
      name: 'bind_conversation_intent',
      arguments: { context_id: contextId, message: 'Agent Helm dynamic access black-box verification', task: 'Verify live access transitions over one MCP session.' },
      _meta: { 'openai/session': scenarioCorrelation },
    })
    check('live access scenario binds its persistent MCP context', bind.isError !== true && bind.structuredContent?.context_id === contextId)

    await nativeControlRequest({ home: scenarioHome, socket: scenarioSocket, method: 'setExternalUserAccess', params: [{ enabled: false }] })
    await waitForNotificationCount(() => toolListChanges, 1, 'Access disabled emits tools/list_changed on the existing MCP session')
    check('Access disabled emits tools/list_changed on the existing MCP session', toolListChanges >= 1, `count=${toolListChanges}`)
    const understandOffTools = await scenarioClient.listTools()
    check('Access disabled keeps the advertised tool catalog stable on the same MCP session', sameNames(new Set(understandOffTools.tools.map((tool) => tool.name)), baselineNames))
    const understandBlocked = await scenarioClient.callTool({ name: 'workspace_list', arguments: {}, _meta: { 'openai/session': scenarioCorrelation } })
    check('Access disabled returns user_access_disabled on the existing MCP session', understandBlocked.isError === true && errorCode(understandBlocked) === 'user_access_disabled', errorCode(understandBlocked) ?? '')

    await nativeControlRequest({ home: scenarioHome, socket: scenarioSocket, method: 'setExternalUserAccess', params: [{ enabled: true }] })
    await waitForNotificationCount(() => toolListChanges, 2, 'Access restored emits tools/list_changed on the existing MCP session')
    check('Access restored emits tools/list_changed on the existing MCP session', toolListChanges >= 2, `count=${toolListChanges}`)
    const understandRestored = await scenarioClient.callTool({ name: 'workspace_list', arguments: {}, _meta: { 'openai/session': scenarioCorrelation } })
    check('Access restored makes calls available on the same MCP session', understandRestored.isError !== true)

    await nativeControlRequest({ home: scenarioHome, socket: scenarioSocket, method: 'setExternalUserAccess', params: [{ mutations: false }] })
    await waitForNotificationCount(() => toolListChanges, 3, 'Mutations disabled emits tools/list_changed on the existing MCP session')
    check('Mutations disabled emits tools/list_changed on the existing MCP session', toolListChanges >= 3, `count=${toolListChanges}`)
    const codingOffTools = new Set((await scenarioClient.listTools()).tools.map((tool) => tool.name))
    check('Mutations disabled keeps semantic queries but removes semantic mutations on the same MCP session', codingOffTools.has('semantic_find_symbol') && !codingOffTools.has('semantic_rename_symbol'))
    const staleMutation = await scenarioClient.callTool({
      name: 'semantic_rename_symbol',
      arguments: { context_id: contextId, name_path: 'sample', relative_path: 'sample.ts', new_name: 'renamed' },
      _meta: { 'openai/session': scenarioCorrelation },
    })
    check('Mutations disabled gives stale cached mutation calls tool_not_available_on_surface', staleMutation.isError === true && errorCode(staleMutation) === 'tool_not_available_on_surface', errorCode(staleMutation) ?? '')

    await nativeControlRequest({ home: scenarioHome, socket: scenarioSocket, method: 'setExternalUserAccess', params: [{ mutations: true }] })
    await waitForNotificationCount(() => toolListChanges, 4, 'Mutations restored emit tools/list_changed on the existing MCP session')
    check('Mutations restored emit tools/list_changed on the existing MCP session', toolListChanges >= 4, `count=${toolListChanges}`)
    const codingRestoredTools = new Set((await scenarioClient.listTools()).tools.map((tool) => tool.name))
    check('Mutations restored re-advertise semantic mutations on the same MCP session', codingRestoredTools.has('semantic_rename_symbol'))
    const restoredMutation = await scenarioClient.callTool({
      name: 'semantic_rename_symbol',
      arguments: { context_id: contextId, name_path: 'sample', relative_path: 'sample.ts', new_name: 'renamed' },
      _meta: { 'openai/session': scenarioCorrelation },
    })
    check('Restored mutations are no longer rejected as unavailable', errorCode(restoredMutation) !== 'tool_not_available_on_surface', errorCode(restoredMutation) ?? 'call accepted')

    await nativeControlRequest({ home: scenarioHome, socket: scenarioSocket, method: 'setExternalUserAccess', params: [{ delegation: false }] })
    await waitForNotificationCount(() => toolListChanges, 5, 'Delegation disabled emits tools/list_changed on the existing MCP session')
    check('Delegation disabled emits tools/list_changed on the existing MCP session', toolListChanges >= 5, `count=${toolListChanges}`)
    const delegationOffTools = new Set((await scenarioClient.listTools()).tools.map((tool) => tool.name))
    check('Delegation disabled removes delegated session tools on the same MCP session', !delegationOffTools.has('agent_sessions_create'))
    const staleDelegation = await scenarioClient.callTool({
      name: 'agent_sessions_create',
      arguments: { context_id: contextId, initial_message: 'must not run while delegation is disabled' },
      _meta: { 'openai/session': scenarioCorrelation },
    })
    check('Delegation disabled gives stale cached delegation calls tool_not_available_on_surface', staleDelegation.isError === true && errorCode(staleDelegation) === 'tool_not_available_on_surface', errorCode(staleDelegation) ?? '')
    const delegationOffStatus = await scenarioClient.callTool({ name: 'helm_status', arguments: {} })
    check('helm_status reports delegation disabled on the same MCP session', delegationOffStatus.isError !== true && delegationOffStatus.structuredContent?.capabilities?.delegation === false)

    await nativeControlRequest({ home: scenarioHome, socket: scenarioSocket, method: 'setExternalUserAccess', params: [{ delegation: true }] })
    await waitForNotificationCount(() => toolListChanges, 6, 'Delegation restored emits tools/list_changed on the existing MCP session')
    check('Delegation restored emits tools/list_changed on the existing MCP session', toolListChanges >= 6, `count=${toolListChanges}`)
    const delegationRestoredTools = new Set((await scenarioClient.listTools()).tools.map((tool) => tool.name))
    check('Delegation restored re-advertises delegated session tools on the same MCP session', delegationRestoredTools.has('agent_sessions_create'))
    const restoredDelegation = await scenarioClient.callTool({
      name: 'agent_sessions_create',
      arguments: { context_id: contextId, initial_message: 'probe restored delegation surface' },
      _meta: { 'openai/session': scenarioCorrelation },
    })
    check('Restored delegation is no longer rejected as unavailable', errorCode(restoredDelegation) !== 'tool_not_available_on_surface', errorCode(restoredDelegation) ?? 'call accepted')
    check('all access transitions preserve the original MCP transport session', typeof sessionId === 'string' && connected.transport.sessionId === sessionId)
  } finally {
    await scenarioClient?.close().catch(() => {})
    terminateProcessTree(scenarioChild)
    await waitForExit(scenarioChild)
    rmSync(scenarioRoot, { recursive: true, force: true })
  }
}

const scratch = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'agent-helm-mcp-blackbox-'))
const workspace = join(scratch, 'workspace')
const configDir = join(scratch, 'config')
const configFile = join(configDir, 'config.yml')
const socket = join(scratch, 'daemon.sock')
const outsideFile = join(scratch, 'outside-command-scope.txt')
const token = randomBytes(24).toString('base64url')
const port = await freePort()
const mcpUrl = `http://127.0.0.1:${port}/mcp`
const correlation = `agent-helm-blackbox-${randomBytes(8).toString('hex')}`

mkdirSync(workspace, { recursive: true })
mkdirSync(configDir, { recursive: true })
writeFileSync(join(workspace, 'probe.txt'), 'agent-helm-mcp-blackbox\n')
writeFileSync(outsideFile, 'outside\n')
writeFileSync(configFile, `${JSON.stringify({
  workspaces: [{ path: workspace, title: 'agent-helm-blackbox-fixture' }],
  mcp: {
    external: { command: true, semantic: false, read_only: false, delegate: false },
    native: { semantic: false, delegate: false },
  },
  tunnel: { enabled: false },
}, null, 2)}\n`)

const stdout = new LineBuffer()
const stderr = new LineBuffer()
let child
let client
function spawnBaseTarget() {
  const target = spawn(executable, [
    ...prefixArgs,
    'daemon',
    '--config', configFile,
    '--socket', socket,
    '--host', '127.0.0.1',
    '--port', String(port),
    '--no-tunnel',
    '--lifecycle-owner', 'mcp:blackbox',
  ], {
    env: { ...process.env, AGENT_HELM_TOKEN: token },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: process.platform === 'win32',
  })
  target.stdout?.on('data', (chunk) => stdout.push(chunk))
  target.stderr?.on('data', (chunk) => stderr.push(chunk))
  return target
}

try {
  child = spawnBaseTarget()

  await waitForHealth(mcpUrl, child, stderr)
  check('supplied command starts a reachable Agent Helm MCP server', true)

  const unauthorized = await fetch(mcpUrl, { method: 'GET', headers: { Authorization: 'Bearer definitely-wrong-token' } })
  check('MCP rejects an invalid bearer token', unauthorized.status === 401, `HTTP ${unauthorized.status}`)

  const connected = await connectClient(mcpUrl, token, 'agent-helm-npm-blackbox')
  client = connected.client
  const transport = connected.transport
  check('real MCP client initializes a transport session', typeof transport.sessionId === 'string' && transport.sessionId.length > 0)

  const listed = await client.listTools()
  const tools = new Map(listed.tools.map((tool) => [tool.name, tool]))
  const expectedTools = new Set(['context_setup', 'bind_conversation_intent', 'workspace_list', 'helm_status', 'command_execute'])
  check('command-only profile advertises the exact expected MCP tool set', sameNames(tools.keys(), expectedTools), [...tools.keys()].join(', '))
  check('every advertised MCP tool publishes input and output schemas', [...tools.values()].every((tool) => tool.inputSchema?.type === 'object' && tool.outputSchema?.type === 'object'))

  const validator = new AjvJsonSchemaValidator()
  const call = async (name, args, { validate = true } = {}) => {
    const tool = tools.get(name)
    check(`tool is advertised: ${name}`, Boolean(tool))
    const result = await client.callTool({
      name,
      arguments: args,
      _meta: { 'openai/session': correlation },
    })
    if (validate && result.isError !== true) {
      const validated = validator.getValidator(tool.outputSchema)(result.structuredContent)
      check(`output matches advertised schema: ${name}`, validated.valid, validated.errorMessage ?? '')
    }
    return result
  }

  const workspaceList = await call('workspace_list', {})
  const fixtureWorkspace = workspaceList.structuredContent?.workspaces?.find((entry) => entry.title === 'agent-helm-blackbox-fixture')
  check('workspace_list exposes the black-box fixture workspace', typeof fixtureWorkspace?.id === 'string')

  const status = await call('helm_status', {})
  check('helm_status reports the requested command-only capability profile', status.structuredContent?.status === 'ok' && status.structuredContent?.capabilities?.command === true && status.structuredContent?.capabilities?.semantic === false && status.structuredContent?.capabilities?.delegation === false)

  const setup = await call('context_setup', { workspace_id: fixtureWorkspace.id })
  const contextId = setup.structuredContent?.context_id
  check('context_setup returns an execution context id', typeof contextId === 'string' && contextId.length > 0)

  const bind = await call('bind_conversation_intent', {
    context_id: contextId,
    message: 'Agent Helm npm MCP black-box verification',
    task: 'Exercise the installed Agent Helm package only through its public MCP interface.',
  })
  check('bind_conversation_intent binds the MCP correlation to the context', bind.structuredContent?.context_id === contextId)

  const pwd = await call('command_execute', { context_id: contextId, command: 'pwd', purpose: 'Verify real MCP command execution cwd' })
  check('command_execute runs inside the selected MCP workspace', pwd.isError !== true && commandResult(pwd)?.return_code === 0 && commandResult(pwd)?.stdout?.trim() === '.' && commandResult(pwd)?.cwd === '.', resultDetail(pwd))

  const echo = await call('command_execute', { context_id: contextId, command: 'echo AGENT_HELM_MCP_BLACKBOX', purpose: 'Verify ordinary MCP command execution' })
  check('command_execute returns real command output', echo.isError !== true && commandResult(echo)?.return_code === 0 && commandResult(echo)?.stdout?.trim() === 'AGENT_HELM_MCP_BLACKBOX', resultDetail(echo))

  const stat = await call('command_execute', { context_id: contextId, command: 'stat probe.txt', purpose: 'Verify authorized workspace file access through MCP' })
  check('command_execute can inspect an authorized workspace file', stat.isError !== true && commandResult(stat)?.return_code === 0, resultDetail(stat))

  const create = await call('command_execute', { context_id: contextId, command: 'touch blackbox-created.tmp', purpose: 'Verify authorized workspace write through MCP' })
  const createSucceeded = create.isError !== true && commandResult(create)?.return_code === 0
  check('command_execute can create a workspace file', createSucceeded, resultDetail(create))
  const remove = await call('command_execute', { context_id: contextId, command: 'rm blackbox-created.tmp', purpose: 'Verify authorized workspace cleanup through MCP' })
  check('command_execute can remove a workspace file', remove.isError !== true && commandResult(remove)?.return_code === 0, resultDetail(remove))

  const outside = await call('command_execute', { context_id: contextId, command: `cat ${JSON.stringify(outsideFile)}`, purpose: 'Verify MCP workspace read boundary' }, { validate: false })
  check('command_execute rejects a direct read outside MCP execution authority', outside.isError === true && errorCode(outside) === 'shell_path_not_allowed', errorCode(outside) ?? '')

  const destructive = await call('command_execute', { context_id: contextId, command: 'git reset --hard HEAD~1', purpose: 'Verify MCP destructive command guardrail' }, { validate: false })
  check('command_execute exposes the destructive-command guardrail through MCP', destructive.isError === true && errorCode(destructive) === 'destructive_command_denied', errorCode(destructive) ?? '')

  const repeatedSetup = await client.callTool({
    name: 'context_setup',
    arguments: { workspace_id: fixtureWorkspace.id },
    _meta: { 'openai/session': correlation },
  })
  check('context_setup reuses the same execution context for the same conversation and target', repeatedSetup.isError !== true && repeatedSetup.structuredContent?.context_id === contextId)

  const secondCorrelation = `agent-helm-blackbox-isolation-${randomBytes(8).toString('hex')}`
  const secondSetup = await client.callTool({
    name: 'context_setup',
    arguments: { workspace_id: fixtureWorkspace.id },
    _meta: { 'openai/session': secondCorrelation },
  })
  const secondContextId = secondSetup.structuredContent?.context_id
  check('another conversation receives a distinct execution context for the same workspace target', secondSetup.isError !== true && typeof secondContextId === 'string' && secondContextId !== contextId)
  const secondUsingFirst = await client.callTool({
    name: 'command_execute',
    arguments: { context_id: contextId, command: 'echo isolation-probe', purpose: 'Verify conversation context ownership isolation' },
    _meta: { 'openai/session': secondCorrelation },
  })
  check('another conversation cannot use the first conversation execution context', secondUsingFirst.isError === true && errorCode(secondUsingFirst) === 'context_ownership_mismatch', errorCode(secondUsingFirst) ?? '')
  const firstUsingSecond = await client.callTool({
    name: 'command_execute',
    arguments: { context_id: secondContextId, command: 'echo isolation-probe', purpose: 'Verify reciprocal conversation context ownership isolation' },
    _meta: { 'openai/session': correlation },
  })
  check('the first conversation cannot use another conversation execution context', firstUsingSecond.isError === true && errorCode(firstUsingSecond) === 'context_ownership_mismatch', errorCode(firstUsingSecond) ?? '')

  const missingContext = await client.callTool({
    name: 'command_execute',
    arguments: { command: 'echo missing-context', purpose: 'Verify missing execution context contract' },
    _meta: { 'openai/session': correlation },
  })
  check('work tools reject a missing context_id with context_required', missingContext.isError === true && errorCode(missingContext) === 'context_required', errorCode(missingContext) ?? '')
  const unknownContext = await client.callTool({
    name: 'command_execute',
    arguments: { context_id: 'session-blackbox-definitely-missing', command: 'echo unknown-context', purpose: 'Verify unknown execution context contract' },
    _meta: { 'openai/session': correlation },
  })
  check('work tools reject an unknown context_id with context_not_found', unknownContext.isError === true && errorCode(unknownContext) === 'context_not_found', errorCode(unknownContext) ?? '')
  const invalidInput = await client.callTool({
    name: 'context_setup',
    arguments: {},
    _meta: { 'openai/session': `agent-helm-blackbox-invalid-${randomBytes(6).toString('hex')}` },
  })
  check('invalid advertised tool input returns an MCP tool error without crashing the server', invalidInput.isError === true)
  const unknownTool = await client.callTool({ name: 'not_a_real_tool', arguments: {} })
  check('unknown tool calls are rejected by the live MCP interface', unknownTool.isError === true && errorCode(unknownTool) === 'tool_not_available_on_surface', errorCode(unknownTool) ?? '')

  const noSessionResponse = await rawMcpRequest(mcpUrl, token, { body: rpc('tools/list', 41) })
  check('non-initialize MCP POST without a transport session is rejected', noSessionResponse.status === 400, `HTTP ${noSessionResponse.status}`)
  const unknownSessionResponse = await rawMcpRequest(mcpUrl, token, { sessionId: 'definitely-invalid-session', body: rpc('tools/list', 42) })
  check('unknown MCP transport session id is rejected with HTTP 404', unknownSessionResponse.status === 404, `HTTP ${unknownSessionResponse.status}`)
  const getWithoutSession = await rawMcpRequest(mcpUrl, token, { method: 'GET' })
  check('GET without an MCP transport session is rejected', getWithoutSession.status === 400, `HTTP ${getWithoutSession.status}`)

  const concurrentResults = await Promise.all(Array.from({ length: 8 }, (_, index) => client.callTool({
    name: 'command_execute',
    arguments: { context_id: contextId, command: `echo AGENT_HELM_MCP_BLACKBOX_PARALLEL_${index}`, purpose: `Verify concurrent MCP command execution ${index}` },
    _meta: { 'openai/session': correlation },
  })))
  check('concurrent MCP command calls all complete with their own results', concurrentResults.every((result, index) => result.isError !== true && commandResult(result)?.return_code === 0 && commandResult(result)?.stdout?.trim() === `AGENT_HELM_MCP_BLACKBOX_PARALLEL_${index}`))
  const afterConcurrency = await client.callTool({ name: 'workspace_list', arguments: {}, _meta: { 'openai/session': correlation } })
  check('MCP server remains usable after concurrent command execution', afterConcurrency.isError !== true && Array.isArray(afterConcurrency.structuredContent?.workspaces))

  const preRestartSessionId = transport.sessionId
  terminateProcessTree(child)
  await waitForExit(child)
  child = spawnBaseTarget()
  await waitForHealth(mcpUrl, child, stderr)
  const recoveredTools = await client.listTools()
  check('pre-restart MCP client recovers without reinitializing', sameNames(new Set(recoveredTools.tools.map((tool) => tool.name)), expectedTools))
  check('stateless restart recovery preserves the original MCP transport session id', typeof preRestartSessionId === 'string' && transport.sessionId === preRestartSessionId)
  const recoveredCommand = await client.callTool({
    name: 'command_execute',
    arguments: { context_id: contextId, command: 'echo AGENT_HELM_MCP_BLACKBOX_RESTART', purpose: 'Verify persisted execution context after Agent Helm restart' },
    _meta: { 'openai/session': correlation },
  })
  check('pre-restart execution context and conversation remain usable after Agent Helm restart', recoveredCommand.isError !== true && commandResult(recoveredCommand)?.stdout?.trim() === 'AGENT_HELM_MCP_BLACKBOX_RESTART', resultDetail(recoveredCommand))
  const freshAfterRestart = await connectClient(mcpUrl, token, 'agent-helm-blackbox-fresh-after-restart')
  try {
    const freshTools = await freshAfterRestart.client.listTools()
    check('a fresh MCP client can initialize after the same Agent Helm restart', sameNames(new Set(freshTools.tools.map((tool) => tool.name)), expectedTools))
  } finally {
    await freshAfterRestart.client.close().catch(() => {})
  }

  if (stateHomeRoot) {
    mkdirSync(stateHomeRoot, { recursive: true })
    await runDynamicAccessStateScenario({ root: stateHomeRoot, workspace })
  }

  console.log(`Agent Helm MCP black-box OK (${checkCount} checks)`)
} finally {
  await client?.close().catch(() => {})
  terminateProcessTree(child)
  await waitForExit(child)
  rmSync(scratch, { recursive: true, force: true })
}
