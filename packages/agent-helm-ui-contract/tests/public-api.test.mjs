import assert from 'node:assert/strict'
import test from 'node:test'

import {
  agentHelmInstallerSourceForRelease,
  deriveHelmConnectionHealth,
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
