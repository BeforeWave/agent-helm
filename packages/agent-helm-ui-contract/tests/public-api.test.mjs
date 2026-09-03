import assert from 'node:assert/strict'
import test from 'node:test'

import {
  agentHelmInstallerSourceForRelease,
  deriveHelmConnectionHealth,
  normalizeWorkHistorySession,
  workHistoryTimelinePurpose,
} from '../lib/index.js'

test('connection health projects a usable connected state', () => {
  assert.deepEqual(
    deriveHelmConnectionHealth({
      connection: { state: 'connected' },
      core: { state: 'running', enabled: true },
    }),
    { state: 'connected' },
  )
})

test('connection health preserves transport failures', () => {
  assert.deepEqual(
    deriveHelmConnectionHealth({
      connection: { state: 'error', message: 'transport failed' },
    }),
    {
      state: 'error',
      issue: { source: 'connection', state: 'error', message: 'transport failed' },
    },
  )
})

test('installer source is derived from the public Agent Helm release', () => {
  const source = agentHelmInstallerSourceForRelease('1.2.3')
  assert.equal(source.macos.version, '1.2.3')
  assert.equal(source.macos.releaseUrl, 'https://github.com/BeforeWave/agent-helm/releases')
  assert.equal(source.macos.assetName, 'Agent-Helm-Installer-1.2.3.pkg')
  assert.equal(source.macos.downloadUrl, 'https://github.com/BeforeWave/agent-helm/releases/download/v1.2.3/Agent-Helm-Installer-1.2.3.pkg')
})

test('Work History session normalization owns legacy compatibility at the UI boundary', () => {
  const normalized = normalizeWorkHistorySession({
    session_id: 'session-legacy',
    originChat: { message: 'origin message', task: 'origin task', url: 'https://chatgpt.com/c/origin' },
    boundChats: [{ message: 'bound message', task: 'bound task', boundAt: '2026-09-02T00:00:00Z', url: 'https://chatgpt.com/c/bound' }],
  })
  assert.equal(normalized?.id, 'session-legacy')
  assert.deepEqual(normalized?.originIntent, { message: 'origin message', task: 'origin task' })
  assert.deepEqual(normalized?.boundIntents, [{ intent: { message: 'bound message', task: 'bound task' }, boundAt: '2026-09-02T00:00:00Z' }])
  assert.deepEqual(normalized?.chatUrls, ['https://chatgpt.com/c/origin', 'https://chatgpt.com/c/bound'])
})

test('Work History timeline purpose reads the canonical purpose argument', () => {
  assert.equal(workHistoryTimelinePurpose({ arguments: { purpose: ' inspect registry ' } }), 'inspect registry')
  assert.equal(workHistoryTimelinePurpose({ arguments: { purpose: '   ' } }), undefined)
  assert.equal(workHistoryTimelinePurpose({ purpose: 'wrong level' }), undefined)
})
