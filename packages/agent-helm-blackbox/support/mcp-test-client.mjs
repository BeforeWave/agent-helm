import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export function enableLoopbackProxyBypass() {
  const add = (value) => [...new Set([...(value ?? '').split(',').map((item) => item.trim()).filter(Boolean), '127.0.0.1', 'localhost'])].join(',')
  process.env.NO_PROXY = add(process.env.NO_PROXY)
  process.env.no_proxy = add(process.env.no_proxy)
}

export async function connectMcpClient(options, tokenArg, nameArg) {
  enableLoopbackProxyBypass()
  const { url, token, name, version = '0.1.0' } = typeof options === 'string'
    ? { url: options, token: tokenArg, name: nameArg }
    : options
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  })
  const client = new Client({ name, version })
  await client.connect(transport)
  return { client, transport }
}

export function callMcpTool(client, correlation, name, args = {}) {
  return client.callTool({
    name,
    arguments: args,
    _meta: { 'openai/session': correlation },
  })
}

export function mcpResultText(result) {
  return result.content?.map((block) => block.text ?? '').join('') ?? ''
}

export function mcpErrorCode(result) {
  try {
    return JSON.parse(mcpResultText(result)).error?.code
  } catch {
    return undefined
  }
}

export function mcpResultDetail(result) {
  if (result.isError === true) return `error=${mcpErrorCode(result) ?? 'unknown'} ${mcpResultText(result)}`
  return JSON.stringify(result.structuredContent ?? result.content ?? null)
}

export function sameNames(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort())
}

export async function rawMcpRequest(url, token, { method = 'POST', sessionId, body } = {}) {
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

export function rpc(method, id = 1, params = {}) {
  return { jsonrpc: '2.0', id, method, params }
}
