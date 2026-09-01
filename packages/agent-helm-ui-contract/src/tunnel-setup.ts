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
  description: { key: 'tunnelSetupDescription', defaultText: 'No README or manual environment-variable setup is required. Follow these three steps.' },
  steps: [
    {
      id: 'openai-configuration',
      title: { key: 'tunnelSetupStep1', defaultText: '1. Get OpenAI configuration' },
      description: { key: 'tunnelSetupStep1Description', defaultText: 'Open Tunnels to get the Tunnel ID, then create a Restricted Runtime API Key with Tunnels Read + Use.' },
      links: [
        { id: 'tunnels', label: { key: 'openTunnels', defaultText: 'Open Tunnels' }, href: tunnelSetupLinks.tunnels },
        { id: 'runtimeApiKeys', label: { key: 'createRuntimeApiKey', defaultText: 'Create Runtime API Key' }, href: tunnelSetupLinks.runtimeApiKeys },
        { id: 'roles', label: { key: 'openTunnelRoles', defaultText: 'Configure permissions' }, href: tunnelSetupLinks.roles },
      ],
      dependency: {
        id: 'tunnelClient',
        required: { key: 'tunnelClientRequired', defaultText: 'OpenAI tunnel-client is also required. Agent Helm detects it automatically after installation.' },
        installDescription: { key: 'tunnelClientInstallDescription', defaultText: 'Agent Helm downloads the manifest-pinned version from the official OpenAI release, verifies SHA256, and installs it in ~/.agent-helm/bin.' },
        installAction: { key: 'authorizeInstallTunnelClient', defaultText: 'Authorize & install tunnel-client' },
        installing: { key: 'installing', defaultText: 'Installing…' },
        downloadAction: { id: 'tunnelClientRelease', label: { key: 'downloadTunnelClient', defaultText: 'Download tunnel-client' }, href: tunnelSetupLinks.tunnelClientRelease },
      },
    },
    {
      id: 'agent-helm-configuration',
      title: { key: 'tunnelSetupStep2', defaultText: '2. Configure Agent Helm' },
      description: { key: 'tunnelSetupStep2Description', defaultText: 'Enter the Tunnel ID and Runtime API Key here. Organization ID is only needed when you must select an organization scope explicitly.' },
      fields: [
        { id: 'tunnelId', label: { key: 'tunnelIdLabel', defaultText: 'Tunnel ID' }, required: true, secret: false },
        { id: 'organizationId', label: { key: 'organizationIdLabel', defaultText: 'Organization ID (optional)' }, required: false, secret: false },
        { id: 'apiKey', label: { key: 'runtimeApiKeyLabel', defaultText: 'Runtime API Key' }, required: true, secret: true, savedPlaceholder: { key: 'runtimeApiKeyPlaceholder', defaultText: 'Leave blank to keep the saved key' } },
      ],
      configuredNote: { key: 'tunnelApiKeyConfigured', defaultText: 'Runtime API Key configured' },
      missingNote: { key: 'tunnelApiKeyMissing', defaultText: 'Runtime API Key not configured' },
      storageNote: { key: 'tunnelSetupStoredLocally', defaultText: 'Agent Helm stores this configuration locally. The Runtime API Key is never displayed back in the UI.' },
      submitAction: { key: 'saveAndConnect', defaultText: 'Save & Connect' },
      submitting: { key: 'savingTunnelSetup', defaultText: 'Saving…' },
    },
    {
      id: 'chatgpt-connection',
      title: { key: 'tunnelSetupStep3', defaultText: '3. Finish the ChatGPT connection' },
      description: { key: 'tunnelSetupStep3Description', defaultText: 'After the Tunnel connects, enable Developer mode in ChatGPT Settings → Apps → Advanced Settings, then create or configure the Connector.' },
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
}

export interface TunnelSetupProjection {
  tunnelId?: string
  organizationId?: string
  apiKeyConfigured: boolean
}
