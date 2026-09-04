export const tunnelSetupLinks = {
  tunnels: 'https://platform.openai.com/settings/organization/tunnels',
  runtimeApiKeys: 'https://platform.openai.com/settings/organization/api-keys',
  roles: 'https://platform.openai.com/settings/organization/people/roles',
  developerMode: 'https://chatgpt.com/#settings/Connectors/Advanced',
  connectors: 'https://chatgpt.com/#settings/Connectors',
  tunnelClientRelease: 'https://github.com/openai/tunnel-client/releases',
} as const

export type TunnelOnboardingTextKey =
  | 'tunnelSetupTitle'
  | 'tunnelSetupDescription'
  | 'tunnelSetupStep1'
  | 'tunnelSetupStep1Description'
  | 'tunnelSetupStep2'
  | 'tunnelSetupStep2Description'
  | 'tunnelSetupStoredLocally'
  | 'tunnelSetupStep3'
  | 'tunnelSetupStep3Description'
  | 'tunnelIdLabel'
  | 'organizationIdLabel'
  | 'runtimeApiKeyLabel'
  | 'runtimeApiKeyPlaceholder'
  | 'tunnelProxyLabel'
  | 'tunnelProxyPlaceholder'
  | 'tunnelProxyConfigured'
  | 'tunnelProxyNotConfigured'
  | 'saveAndConnect'
  | 'savingTunnelSetup'
  | 'openTunnels'
  | 'createRuntimeApiKey'
  | 'openTunnelRoles'
  | 'openChatGptDeveloperMode'
  | 'openChatGptConnectors'
  | 'authorizeInstallTunnelClient'
  | 'tunnelClientInstallDescription'
  | 'tunnelClientRequired'
  | 'downloadTunnelClient'
  | 'tunnelApiKeyConfigured'
  | 'tunnelApiKeyMissing'
  | 'installing'

export interface TunnelOnboardingText {
  key: TunnelOnboardingTextKey
  defaultText: string
}

export type TunnelOnboardingLinkId = keyof typeof tunnelSetupLinks

export interface TunnelOnboardingLinkAction {
  id: TunnelOnboardingLinkId
  label: TunnelOnboardingText
  href: string
}

export const tunnelOnboardingSource = {
  id: 'chatgpt-tunnel',
  title: { key: 'tunnelSetupTitle', defaultText: 'Configure ChatGPT Tunnel' },
  description: { key: 'tunnelSetupDescription', defaultText: 'Complete these three steps. Agent Helm handles installation and local configuration for you.' },
  steps: [
    {
      id: 'openai-configuration',
      title: { key: 'tunnelSetupStep1', defaultText: '1. Get OpenAI configuration' },
      description: { key: 'tunnelSetupStep1Description', defaultText: 'Get the Tunnel ID, then create a Restricted Runtime API Key with Tunnels Read + Use.' },
      links: [
        { id: 'tunnels', label: { key: 'openTunnels', defaultText: 'Open Tunnels' }, href: tunnelSetupLinks.tunnels },
        { id: 'runtimeApiKeys', label: { key: 'createRuntimeApiKey', defaultText: 'Create Runtime API Key' }, href: tunnelSetupLinks.runtimeApiKeys },
        { id: 'roles', label: { key: 'openTunnelRoles', defaultText: 'Configure permissions' }, href: tunnelSetupLinks.roles },
      ],
      dependency: {
        id: 'tunnelClient',
        required: { key: 'tunnelClientRequired', defaultText: 'tunnel-client is missing. Choose Authorize & install below.' },
        installDescription: { key: 'tunnelClientInstallDescription', defaultText: 'Agent Helm downloads the pinned release, verifies it, and installs it automatically. No manual file-permission step is required.' },
        installAction: { key: 'authorizeInstallTunnelClient', defaultText: 'Authorize & install tunnel-client' },
        installing: { key: 'installing', defaultText: 'Installing…' },
        downloadAction: { id: 'tunnelClientRelease', label: { key: 'downloadTunnelClient', defaultText: 'Manual download (fallback)' }, href: tunnelSetupLinks.tunnelClientRelease },
      },
    },
    {
      id: 'agent-helm-configuration',
      title: { key: 'tunnelSetupStep2', defaultText: '2. Configure Agent Helm' },
      description: { key: 'tunnelSetupStep2Description', defaultText: 'Enter the Tunnel ID and Runtime API Key. Organization ID is usually optional. You can also save an HTTP/HTTPS Tunnel proxy when Chrome or DSH cannot inherit your shell proxy.' },
      fields: [
        { id: 'tunnelId', label: { key: 'tunnelIdLabel', defaultText: 'Tunnel ID' }, required: true, secret: false },
        { id: 'organizationId', label: { key: 'organizationIdLabel', defaultText: 'Organization ID (optional)' }, required: false, secret: false },
        { id: 'apiKey', label: { key: 'runtimeApiKeyLabel', defaultText: 'Runtime API Key' }, required: true, secret: true, savedPlaceholder: { key: 'runtimeApiKeyPlaceholder', defaultText: 'Leave blank to keep the saved key' } },
        { id: 'proxyUrl', label: { key: 'tunnelProxyLabel', defaultText: 'Tunnel proxy URL (optional)' }, required: false, secret: false, savedPlaceholder: { key: 'tunnelProxyPlaceholder', defaultText: 'http://127.0.0.1:7890' } },
      ],
      configuredNote: { key: 'tunnelApiKeyConfigured', defaultText: 'Runtime API Key configured' },
      missingNote: { key: 'tunnelApiKeyMissing', defaultText: 'Runtime API Key not configured' },
      proxyConfiguredNote: { key: 'tunnelProxyConfigured', defaultText: 'Tunnel proxy configured' },
      proxyMissingNote: { key: 'tunnelProxyNotConfigured', defaultText: 'Tunnel proxy not configured' },
      storageNote: { key: 'tunnelSetupStoredLocally', defaultText: 'Saved locally by Agent Helm. The Runtime API Key is not shown again.' },
      submitAction: { key: 'saveAndConnect', defaultText: 'Save & Connect' },
      submitting: { key: 'savingTunnelSetup', defaultText: 'Saving…' },
    },
    {
      id: 'chatgpt-connection',
      title: { key: 'tunnelSetupStep3', defaultText: '3. Finish the ChatGPT connection' },
      description: { key: 'tunnelSetupStep3Description', defaultText: 'After Tunnel connects, enable ChatGPT Developer mode, then create or configure the Connector.' },
      links: [
        { id: 'developerMode', label: { key: 'openChatGptDeveloperMode', defaultText: 'Open Developer mode' }, href: tunnelSetupLinks.developerMode },
        { id: 'connectors', label: { key: 'openChatGptConnectors', defaultText: 'Open ChatGPT Connectors' }, href: tunnelSetupLinks.connectors },
      ],
    },
  ],
} as const

export function tunnelOnboardingRequired(input: TunnelSetupProjection & { missingEnvironment?: readonly string[] }): boolean {
  return !input.tunnelId || !input.apiKeyConfigured || Boolean(input.missingEnvironment?.length)
}

export function tunnelSetupCanSubmit(input: { tunnelId: string; apiKeyConfigured: boolean; runtimeApiKey: string }): boolean {
  return Boolean(input.tunnelId.trim()) && (input.apiKeyConfigured || Boolean(input.runtimeApiKey.trim()))
}

export interface TunnelSetupValues {
  tunnelId: string
  organizationId?: string
  apiKey?: string
  proxyUrl?: string
}

export interface TunnelSetupProjection {
  tunnelId?: string
  organizationId?: string
  apiKeyConfigured: boolean
  proxyConfigured?: boolean
  proxyUrl?: string
}
