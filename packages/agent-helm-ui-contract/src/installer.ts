const chromeExtensionIdPattern = /^[a-p]{32}$/
const semanticVersionPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
const agentHelmInstallerReleaseUrl = 'https://github.com/BeforeWave/agent-helm-extensions/releases'

export function agentHelmInstallerSourceForRelease(version: string) {
  if (!semanticVersionPattern.test(version)) throw new Error('Invalid Agent Helm installer version')
  const macosAssetName = `Agent-Helm-Installer-${version}.pkg`
  const windowsAssetName = `Agent-Helm-Installer-${version}-win32-x64.cmd`
  return {
    macos: {
      version,
      releaseUrl: agentHelmInstallerReleaseUrl,
      assetName: macosAssetName,
      downloadUrl: `${agentHelmInstallerReleaseUrl}/download/v${version}/${macosAssetName}`,
    },
    windows: {
      version,
      platform: 'win32-x64',
      releaseUrl: agentHelmInstallerReleaseUrl,
      assetName: windowsAssetName,
      downloadUrl: `${agentHelmInstallerReleaseUrl}/download/v${version}/${windowsAssetName}`,
    },
  } as const
}

export function agentHelmMacosInstallerFilename(version: string, extensionId: string): string {
  if (!chromeExtensionIdPattern.test(extensionId)) throw new Error('Invalid Chrome Extension ID')
  if (!semanticVersionPattern.test(version)) throw new Error('Invalid Agent Helm installer version')
  return `Agent-Helm-Installer-${version}--chrome-${extensionId}.pkg`
}
