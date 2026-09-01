const chromeExtensionIdPattern = /^[a-p]{32}$/
const semanticVersionPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
const agentHelmReleaseUrl = 'https://github.com/BeforeWave/agent-helm/releases'

export const agentHelmChromeCompatibilityUrl = 'https://raw.githubusercontent.com/BeforeWave/agent-helm/main/compatibility/chrome.json'

function normalizedInstallerReleaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/$/, '')
  if (normalized === agentHelmReleaseUrl) return normalized
  let parsed: URL
  try { parsed = new URL(normalized) } catch { throw new Error('Agent Helm installer release URL is invalid') }
  if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error('Agent Helm installer release URL must use the official release or an explicit loopback UAT endpoint')
  }
  return normalized
}

function installerSourceForReleaseUrl(version: string, releaseUrl: string) {
  if (!semanticVersionPattern.test(version)) throw new Error('Invalid Agent Helm installer version')
  const assetName = `Agent-Helm-Installer-${version}.pkg`
  return {
    macos: {
      version,
      releaseUrl,
      assetName,
      downloadUrl: `${releaseUrl}/download/v${version}/${assetName}`,
    },
  } as const
}

export function agentHelmInstallerSourceForRelease(version: string) {
  return installerSourceForReleaseUrl(version, agentHelmReleaseUrl)
}

export async function loadAgentHelmInstallerSource(options: {
  fetch?: typeof fetch
  compatibilityUrl?: string
  expectedReleaseUrl?: string
  timeoutMs?: number
} = {}) {
  const fetcher = options.fetch ?? fetch
  const compatibilityUrl = options.compatibilityUrl ?? agentHelmChromeCompatibilityUrl
  const expectedReleaseUrl = normalizedInstallerReleaseUrl(options.expectedReleaseUrl ?? agentHelmReleaseUrl)
  const timeoutMs = options.timeoutMs ?? 5_000
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Agent Helm compatibility timeout must be positive')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let value: unknown
  try {
    const response = await fetcher(compatibilityUrl, { redirect: 'follow', signal: controller.signal, credentials: 'omit' })
    if (!response.ok) throw new Error(`Agent Helm compatibility lookup failed: HTTP ${response.status}`)
    value = await response.json() as unknown
  } finally {
    clearTimeout(timeout)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Agent Helm compatibility manifest is invalid')
  const manifest = value as Record<string, unknown>
  if (manifest.schemaVersion !== 1) throw new Error('Unsupported Agent Helm compatibility manifest schema')
  const component = manifest.agentHelm
  if (!component || typeof component !== 'object' || Array.isArray(component)) throw new Error('Agent Helm compatibility manifest is missing agentHelm')
  const record = component as Record<string, unknown>
  const version = typeof record.version === 'string' ? record.version.trim() : ''
  const releaseUrl = typeof record.releaseUrl === 'string' ? record.releaseUrl.trim().replace(/\/$/, '') : ''
  if (!semanticVersionPattern.test(version)) throw new Error('Agent Helm compatibility version is invalid')
  if (!options.expectedReleaseUrl && releaseUrl !== agentHelmReleaseUrl) throw new Error('Agent Helm compatibility release URL is invalid')
  if (releaseUrl !== expectedReleaseUrl) throw new Error('Agent Helm compatibility release URL is invalid')
  return releaseUrl === agentHelmReleaseUrl
    ? agentHelmInstallerSourceForRelease(version)
    : installerSourceForReleaseUrl(version, releaseUrl)
}

export function agentHelmMacosInstallerFilename(version: string, extensionId: string): string {
  if (!chromeExtensionIdPattern.test(extensionId)) throw new Error('Invalid Chrome Extension ID')
  if (!semanticVersionPattern.test(version)) throw new Error('Invalid Agent Helm installer version')
  return `Agent-Helm-Installer-${version}--chrome-${extensionId}.pkg`
}
