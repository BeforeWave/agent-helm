#!/usr/bin/env node

import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join, sep } from 'node:path'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { CallToolRequestSchema, ListToolsRequestSchema, isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'

if (process.env.AGENT_HELM_BLACKBOX_PROBE && process.env.AGENT_HELM_BLACKBOX_PROBE !== 'preserved') process.exit(91)
if (process.env.AGENT_HELM_BLACKBOX_EXPECT_HOME && process.env.HOME !== process.env.AGENT_HELM_BLACKBOX_EXPECT_HOME) process.exit(92)

const args = process.argv.slice(2)
const stateFile = join(process.env.HOME ?? '', '.agent-helm', 'state.json')
const contextFile = join(process.env.HOME ?? '', '.agent-helm', 'fake-contexts.json')

function readContexts() {
  try { return JSON.parse(readFileSync(contextFile, 'utf8')) } catch { return {} }
}

function writeContexts(contexts) {
  mkdirSync(join(process.env.HOME ?? '', '.agent-helm'), { recursive: true })
  writeFileSync(contextFile, JSON.stringify(contexts, null, 2) + '\n')
}

function contextForCorrelation(correlation) {
  const contexts = readContexts()
  if (contexts[correlation]) return contexts[correlation]
  const contextId = `session-blackbox-${randomUUID()}`
  contexts[correlation] = contextId
  writeContexts(contexts)
  return contextId
}

function contextAccessError(contextId, correlation) {
  if (!contextId) return 'context_required'
  const contexts = readContexts()
  const known = Object.values(contexts).includes(contextId)
  if (!known) return 'context_not_found'
  return contexts[correlation] === contextId ? undefined : 'context_ownership_mismatch'
}

function readState() {
  try { return JSON.parse(readFileSync(stateFile, 'utf8')) } catch { return {} }
}

function readAccess() {
  const state = readState()
  return { enabled: true, mutations: true, delegation: true, ...(state.externalUserAccess ?? {}) }
}

async function readAllStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

function writeNativeResponse(response) {
  const payload = Buffer.from(JSON.stringify(response), 'utf8')
  const frame = Buffer.allocUnsafe(4 + payload.length)
  frame.writeUInt32LE(payload.length, 0)
  payload.copy(frame, 4)
  process.stdout.write(frame)
}

if (args[0] === 'chrome-native-host') {
  const frame = await readAllStdin()
  if (frame.length < 4) process.exit(5)
  const length = frame.readUInt32LE(0)
  if (length <= 0 || frame.length < 4 + length) process.exit(6)
  const request = JSON.parse(frame.subarray(4, 4 + length).toString('utf8'))
  if (request.method !== 'setExternalUserAccess') {
    writeNativeResponse({ ...(request.id ? { id: request.id } : {}), error: 'unsupported native host method: ' + String(request.method) })
    process.exit(0)
  }
  const patch = request.params?.[0] ?? {}
  const currentState = readState()
  const nextAccess = { ...readAccess(), ...patch }
  writeFileSync(stateFile, JSON.stringify({ ...currentState, externalUserAccess: nextAccess }, null, 2) + '\n')
  writeNativeResponse({ ...(request.id ? { id: request.id } : {}), result: { status: 'ok', externalUserAccess: nextAccess } })
  process.exit(0)
}

if (args[0] !== 'daemon') process.exit(2)
const option = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}
const host = option('--host') ?? '127.0.0.1'
const port = Number(option('--port'))
const configFile = option('--config')
const token = process.env.AGENT_HELM_TOKEN ?? ''
if (!Number.isInteger(port) || !configFile || !token) process.exit(3)
const config = JSON.parse(readFileSync(configFile, 'utf8'))
const workspace = config.workspaces?.find((entry) => entry.title === 'agent-helm-blackbox-fixture')
if (!workspace?.path) process.exit(4)
const protectedConfigDir = dirname(configFile)
const workspaceInsideProtectedConfigDir = workspace.path === protectedConfigDir || workspace.path.startsWith(protectedConfigDir + sep)
const workspaceId = 'workspace-blackbox-fixture'
const configured = config.mcp?.external ?? { command: true, semantic: true, read_only: false, delegate: true }
let access = readAccess()
let accessSignature = JSON.stringify(access)

const tool = (name, outputSchema = { type: 'object' }) => ({ name, inputSchema: { type: 'object' }, outputSchema })
const baseTools = [
  tool('context_setup', { type: 'object', properties: { context_id: { type: 'string' } }, required: ['context_id'], additionalProperties: false }),
  tool('bind_conversation_intent', { type: 'object', properties: { context_id: { type: 'string' } }, required: ['context_id'], additionalProperties: false }),
  tool('workspace_list', { type: 'object', properties: { workspaces: { type: 'array', items: { type: 'object' } } }, required: ['workspaces'], additionalProperties: false }),
  tool('helm_status', { type: 'object', properties: { status: { type: 'string' }, capabilities: { type: 'object' } }, required: ['status', 'capabilities'], additionalProperties: false }),
]
const commandTool = tool('command_execute', { type: 'object', properties: { result: { type: 'object' } }, required: ['result'], additionalProperties: false })
const semanticQueryTools = [tool('semantic_find_symbol')]
const semanticMutationTools = [tool('semantic_rename_symbol')]
const delegationTools = [tool('agents_list'), tool('agent_sessions_create')]

function currentTools() {
  const tools = [...baseTools]
  if (configured.command) tools.push(commandTool)
  if (configured.semantic) {
    tools.push(...semanticQueryTools)
    if (!configured.read_only && access.mutations) tools.push(...semanticMutationTools)
  }
  if (configured.delegate && access.delegation) tools.push(...delegationTools)
  return tools
}

function structured(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value }
}

function toolError(code) {
  const error = { code, reason: code === 'shell_path_not_allowed' ? 'scope_denied' : 'policy_denied', message: code, retryable: false, layer: 'policy' }
  return { content: [{ type: 'text', text: JSON.stringify({ error }) }], isError: true }
}

function commandOutput(stdout = '') {
  return structured({ result: { stdout, stderr: '', return_code: 0, cwd: '.', truncated: false, stdout_original_length: stdout.length, stderr_original_length: 0 } })
}

function protocol() {
  const server = new Server({ name: 'fake-agent-helm', version: '0.0.0' }, { capabilities: { tools: { listChanged: true } } })
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: currentTools() }))
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name
    const input = request.params.arguments ?? {}
    const correlation = request.params._meta?.['openai/session']
    if (!currentTools().some((candidate) => candidate.name === name)) return toolError('tool_not_available_on_surface')
    if (!access.enabled) return toolError('user_access_disabled')
    if (name === 'workspace_list') return structured({ workspaces: [{ id: workspaceId, title: 'agent-helm-blackbox-fixture', git: { available: true, isRepository: false } }] })
    if (name === 'helm_status') return structured({ status: 'ok', capabilities: { command: Boolean(configured.command), semantic: Boolean(configured.semantic), delegation: Boolean(configured.delegate && access.delegation) } })
    if (name === 'context_setup') {
      if (!input.workspace_id || !correlation) return toolError('invalid_input')
      return structured({ context_id: contextForCorrelation(correlation) })
    }
    if (name === 'bind_conversation_intent') {
      const denied = contextAccessError(input.context_id, correlation)
      return denied ? toolError(denied) : structured({ context_id: String(input.context_id) })
    }
    if (name === 'semantic_find_symbol' || name === 'semantic_rename_symbol' || name === 'agent_sessions_create' || name === 'command_execute') {
      const denied = contextAccessError(input.context_id, correlation)
      if (denied) return toolError(denied)
    }
    if (name === 'semantic_find_symbol') return toolError('semantic_not_available')
    if (name === 'semantic_rename_symbol') return toolError('semantic_not_available')
    if (name === 'agents_list') return structured({ agents: [] })
    if (name === 'agent_sessions_create') return toolError('agent_not_available')
    if (name === 'command_execute') {
      const command = String(input.command ?? '')
      if (command === 'pwd') return commandOutput('.\n')
      if (command === 'echo AGENT_HELM_MCP_BLACKBOX') return commandOutput('AGENT_HELM_MCP_BLACKBOX\n')
      if (command === 'echo AGENT_HELM_MCP_BLACKBOX_RESTART') return commandOutput('AGENT_HELM_MCP_BLACKBOX_RESTART\n')
      if (command.startsWith('echo AGENT_HELM_MCP_BLACKBOX_PARALLEL_')) return commandOutput(command.slice(5) + '\n')
      if (command === 'stat probe.txt') return commandOutput('probe.txt\n')
      if (command === 'touch blackbox-created.tmp' || command === 'rm blackbox-created.tmp') {
        if (workspaceInsideProtectedConfigDir) return toolError('filesystem_write_denied')
        return commandOutput('')
      }
      if (command.startsWith('cat ')) return toolError('shell_path_not_allowed')
      if (command === 'git reset --hard HEAD~1') return toolError('destructive_command_denied')
    }
    return toolError('unexpected_tool_call')
  })
  return server
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

const sessions = new Map()
const http = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${host}`)
    if (url.pathname === '/healthz') return json(res, 200, { status: 'ok' })
    if (url.pathname !== '/mcp') return json(res, 404, { error: 'not found' })
    if ((req.headers.authorization ?? '').replace(/^Bearer\s+/i, '') !== token) return json(res, 401, { error: 'unauthorized' })

    const sessionId = typeof req.headers['mcp-session-id'] === 'string' ? req.headers['mcp-session-id'] : undefined
    if (sessionId && sessions.has(sessionId)) {
      const entry = sessions.get(sessionId)
      const body = req.method === 'POST' ? await readJson(req) : undefined
      await entry.transport.handleRequest(req, res, body)
      return
    }
    if (sessionId) {
      if (req.method !== 'POST' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) return json(res, 404, { error: 'unknown MCP session' })
      const body = await readJson(req)
      if (isInitializeRequest(body)) return json(res, 404, { error: 'unknown MCP session' })
      const recoveredServer = protocol()
      const recoveredTransport = new StreamableHTTPServerTransport({ enableJsonResponse: true })
      await recoveredServer.connect(recoveredTransport)
      try { await recoveredTransport.handleRequest(req, res, body) }
      finally { await recoveredTransport.close().catch(() => {}) }
      return
    }
    if (req.method !== 'POST') return json(res, 400, { error: 'MCP session id required' })
    const body = await readJson(req)
    if (!isInitializeRequest(body)) return json(res, 400, { error: 'initialize required' })

    const server = protocol()
    let createdSessionId
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (id) => {
        createdSessionId = id
        sessions.set(id, { server, transport })
      },
    })
    transport.onclose = () => {
      const id = transport.sessionId ?? createdSessionId
      if (id) sessions.delete(id)
    }
    await server.connect(transport)
    await transport.handleRequest(req, res, body)
  } catch (error) {
    if (!res.headersSent) json(res, 500, { error: error instanceof Error ? error.message : String(error) })
    else res.end()
  }
})

await new Promise((resolve, reject) => {
  http.once('error', reject)
  http.listen(port, host, resolve)
})

const accessRefresh = setInterval(() => {
  const next = readAccess()
  const signature = JSON.stringify(next)
  if (signature === accessSignature) return
  access = next
  accessSignature = signature
  for (const { server } of sessions.values()) void server.sendToolListChanged().catch(() => {})
}, 20)
accessRefresh.unref()

async function stop() {
  clearInterval(accessRefresh)
  for (const { transport } of sessions.values()) await transport.close().catch(() => {})
  await new Promise((resolve) => http.close(resolve))
  process.exit(0)
}
process.once('SIGTERM', () => { void stop() })
process.once('SIGINT', () => { void stop() })
