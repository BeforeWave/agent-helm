export const tunnelSetupLinks = {
  tunnels: 'https://platform.openai.com/settings/organization/tunnels',
  runtimeApiKeys: 'https://platform.openai.com/settings/organization/api-keys',
  organization: 'https://platform.openai.com/settings/organization/general',
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
  | 'fieldGet'
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
  description: { key: 'tunnelSetupDescription', defaultText: 'Enter the connection settings first. Values that come from OpenAI can be opened directly beside each field.' },
  steps: [
    {
      id: 'agent-helm-configuration',
      title: { key: 'tunnelSetupStep1', defaultText: '1. Configure Agent Helm' },
      description: { key: 'tunnelSetupStep1Description', defaultText: 'Required settings come first, followed by optional settings.' },
      getAction: { key: 'fieldGet', defaultText: 'Get' },
      fields: [
        { id: 'tunnelId', label: { key: 'tunnelIdLabel', defaultText: 'Tunnel ID' }, required: true, secret: false, helpLink: { id: 'tunnels', href: tunnelSetupLinks.tunnels } },
        { id: 'apiKey', label: { key: 'runtimeApiKeyLabel', defaultText: 'Runtime API Key' }, required: true, secret: true, savedPlaceholder: { key: 'runtimeApiKeyPlaceholder', defaultText: 'Leave blank to keep the saved key' }, helpLink: { id: 'runtimeApiKeys', href: tunnelSetupLinks.runtimeApiKeys } },
        { id: 'organizationId', label: { key: 'organizationIdLabel', defaultText: 'Organization ID (optional)' }, required: false, secret: false, helpLink: { id: 'organization', href: tunnelSetupLinks.organization } },
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
      id: 'openai-guidance',
      title: { key: 'tunnelSetupStep2', defaultText: '2. Permissions and dependency' },
      description: { key: 'tunnelSetupStep2Description', defaultText: 'The Runtime API Key needs Tunnels Read + Use. OpenAI tunnel-client is required for the ChatGPT Tunnel connection.' },
      links: [
        { id: 'roles', label: { key: 'openTunnelRoles', defaultText: 'View permission settings' }, href: tunnelSetupLinks.roles },
      ],
      dependency: {
        id: 'tunnelClient',
        required: { key: 'tunnelClientRequired', defaultText: 'OpenAI tunnel-client is required.' },
        installDescription: { key: 'tunnelClientInstallDescription', defaultText: 'Agent Helm uses an available tunnel-client from the system path first. Otherwise it downloads and verifies the compatible version from the official OpenAI release. On macOS it also completes the required run authorization; Windows uses the corresponding install flow.' },
        installAction: { key: 'authorizeInstallTunnelClient', defaultText: 'Authorize & install tunnel-client' },
        installing: { key: 'installing', defaultText: 'Installing…' },
        downloadAction: { id: 'tunnelClientRelease', label: { key: 'downloadTunnelClient', defaultText: 'OpenAI official releases' }, href: tunnelSetupLinks.tunnelClientRelease },
      },
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
