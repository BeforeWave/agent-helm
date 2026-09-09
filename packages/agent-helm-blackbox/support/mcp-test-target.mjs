import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export const MCP_TEST_TARGET_STATE_VERSION = 1

export async function readMcpTestTargetState(file) {
  const value = JSON.parse(await readFile(file, 'utf8'))
  if (value?.version !== MCP_TEST_TARGET_STATE_VERSION || typeof value.mcpUrl !== 'string' || typeof value.token !== 'string') {
    throw new Error(`invalid MCP test target state: ${file}`)
  }
  return value
}

export async function writeMcpTestTargetState(file, value) {
  await mkdir(dirname(file), { recursive: true })
  const state = {
    version: MCP_TEST_TARGET_STATE_VERSION,
    generatedAt: new Date().toISOString(),
    ...value,
  }
  const temporary = `${file}.tmp-${process.pid}`
  await writeFile(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 })
  await rename(temporary, file)
  return state
}

export async function requestMcpTestTargetControl(target, action, parameters = {}, timeoutMs = 15_000) {
  const requestFile = target?.control?.requestFile
  const responseFile = target?.control?.responseFile
  if (!requestFile || !responseFile) throw new Error(`MCP test target does not expose control for ${action}`)
  const id = `mcp-test-control-${process.pid}-${randomBytes(6).toString('hex')}`
  await rm(responseFile, { force: true }).catch(() => {})
  await writeFile(requestFile, JSON.stringify({ id, action, ...parameters }) + '\n', { mode: 0o600 })
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50))
    try {
      const response = JSON.parse(await readFile(responseFile, 'utf8'))
      if (response.id !== id) continue
      await rm(responseFile, { force: true }).catch(() => {})
      if (response.ok !== true) throw new Error(response.error || `MCP test target control failed: ${action}`)
      return response.value
    } catch (error) {
      if (error instanceof SyntaxError || error?.code === 'ENOENT') continue
      throw error
    }
  }
  throw new Error(`MCP test target control timed out: ${action}`)
}

export async function requestMcpTestTargetRestart(targetStateFile, target, { timeoutMs = 60_000, waitForHealth } = {}) {
  const restartRequestFile = target?.lifecycle?.restartRequestFile
  if (!restartRequestFile) throw new Error('MCP test target does not expose restart control')
  const previousGeneration = Number(target.generation ?? 0)
  await writeFile(restartRequestFile, JSON.stringify({ action: 'restart', requestedBy: process.pid, generation: previousGeneration }) + '\n', { mode: 0o600 })
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
    try {
      const next = await readMcpTestTargetState(targetStateFile)
      if (Number(next.generation ?? 0) <= previousGeneration) continue
      if (waitForHealth) await waitForHealth(next)
      return next
    } catch (error) {
      if (error instanceof SyntaxError || error?.code === 'ENOENT') continue
      throw error
    }
  }
  throw new Error(`MCP test target did not restart within ${timeoutMs}ms`)
}
