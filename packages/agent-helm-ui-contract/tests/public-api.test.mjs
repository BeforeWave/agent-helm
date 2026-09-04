import assert from 'node:assert/strict'
import test from 'node:test'

import {
  agentHelmInstallerSourceForRelease,
  deriveHelmConnectionHealth,
  normalizeWorkHistorySession,
  normalizeWorkHistoryTimelinePresentation,
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

test('installer source is derived from the public Extension release', () => {
  const source = agentHelmInstallerSourceForRelease('1.2.3')
  assert.equal(source.macos.version, '1.2.3')
  assert.equal(source.macos.releaseUrl, 'https://github.com/BeforeWave/agent-helm-extensions/releases')
  assert.equal(source.macos.assetName, 'Agent-Helm-Installer-1.2.3.pkg')
  assert.equal(source.macos.downloadUrl, 'https://github.com/BeforeWave/agent-helm-extensions/releases/download/v1.2.3/Agent-Helm-Installer-1.2.3.pkg')
  assert.equal(source.windows.platform, 'win32-x64')
  assert.equal(source.windows.assetName, 'Agent-Helm-Installer-1.2.3-win32-x64.cmd')
  assert.equal(source.windows.downloadUrl, 'https://github.com/BeforeWave/agent-helm-extensions/releases/download/v1.2.3/Agent-Helm-Installer-1.2.3-win32-x64.cmd')
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
  assert.deepEqual(normalized?.presentation, { title: 'session-legacy' })
})

test('Work History session normalization preserves Core-selected presentation over legacy derivation', () => {
  const normalized = normalizeWorkHistorySession({
    id: 'session-current',
    originIntent: { message: 'origin', task: 'origin task' },
    boundIntents: [{ intent: { message: 'latest raw context', task: 'raw task' }, boundAt: '2026-09-03T00:00:00Z' }],
    presentation: { title: 'Core title', workspaceLabel: 'Core workspace' },
  })
  assert.deepEqual(normalized?.presentation, { title: 'Core title', workspaceLabel: 'Core workspace' })
})

test('Work History timeline normalization preserves Core presentation and degrades legacy payloads without re-deriving semantics', () => {
  assert.deepEqual(normalizeWorkHistoryTimelinePresentation({
    kind: 'work',
    actionType: 'edit',
    arguments: { purpose: 'raw purpose' },
    presentation: {
      title: { kind: 'text', text: 'Core purpose' },
      primary: 'Core primary',
      details: [{ kind: 'status', text: 'success' }],
      expanded: [
        { kind: 'task', text: 'Core task' },
        { kind: 'follow-up-prompts', items: ['Core follow-up'] },
      ],
    },
  }), {
    title: { kind: 'text', text: 'Core purpose' },
    primary: 'Core primary',
    details: [{ kind: 'status', text: 'success' }],
    expanded: [
      { kind: 'task', text: 'Core task' },
      { kind: 'follow-up-prompts', items: ['Core follow-up'] },
    ],
  })
  assert.deepEqual(normalizeWorkHistoryTimelinePresentation({
    kind: 'work',
    actionType: 'command',
    tool: 'command_execute',
    primaryObject: 'npm test',
    arguments: { purpose: 'legacy purpose' },
  }), {
    title: { kind: 'label', label: 'activity' },
    details: [],
  })
})

test('Work History timeline purpose reads the canonical purpose argument', () => {
  assert.equal(workHistoryTimelinePurpose({ arguments: { purpose: ' inspect registry ' } }), 'inspect registry')
  assert.equal(workHistoryTimelinePurpose({ arguments: { purpose: '   ' } }), undefined)
  assert.equal(workHistoryTimelinePurpose({ purpose: 'wrong level' }), undefined)
})
