param(
  [string]$Version = 'latest',
  [string]$ChromeExtensionId = $env:AGENT_HELM_CHROME_EXTENSION_ID,
  [string]$RuntimeBundle = $env:AGENT_HELM_RUNTIME_BUNDLE,
  [string]$RuntimeBundleSha256 = $env:AGENT_HELM_RUNTIME_BUNDLE_SHA256
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Package = '@beforewave/agent-helm'
$ReleaseUrl = 'https://github.com/BeforeWave/agent-helm/releases'
$ReleaseToolUrl = if ($env:BEFOREWAVE_RELEASE_TOOL_URL) { $env:BEFOREWAVE_RELEASE_TOOL_URL } else { 'https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install-release.ps1' }
$Prefix = if ($env:AGENT_HELM_INSTALL_PREFIX) { $env:AGENT_HELM_INSTALL_PREFIX } else { Join-Path $HOME '.agent-helm\npm' }
$NodeVersion = '22.23.2'
$MinNodeMajor = 22
$AgentHome = Join-Path $HOME '.agent-helm'
if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) { Fail 'this installer supports Windows only' }
$BinRoot = Join-Path $AgentHome 'bin'
$NodeRoot = Join-Path $AgentHome 'runtime\node'
$NodeCurrent = Join-Path $NodeRoot 'current'

function Fail([string]$Message) { throw "Agent Helm installer: $Message" }
function Stage([int]$Number, [string]$Message) { Write-Host "Agent Helm [$Number/4] $Message" }

$arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
if ($arch -notin @('AMD64', 'x64', 'X64')) {
  Fail "Windows installer currently supports win32-x64 only; detected $arch"
}

function Get-RemoteScript([string]$Uri) {
  $source = (Invoke-WebRequest -UseBasicParsing -Uri $Uri).Content
  if ([string]::IsNullOrWhiteSpace($source)) { Fail "downloaded script is empty: $Uri" }
  return [scriptblock]::Create($source)
}

$ReleaseTool = Get-RemoteScript $ReleaseToolUrl

function Get-NodeMajor([string]$NodePath) {
  try { return [int](& $NodePath -p 'Number(process.versions.node.split(".")[0])') } catch { return 0 }
}

function Test-Node([string]$NodePath) {
  return (-not [string]::IsNullOrWhiteSpace($NodePath)) -and (Test-Path -LiteralPath $NodePath -PathType Leaf) -and ((Get-NodeMajor $NodePath) -ge $MinNodeMajor)
}

function Find-SystemNode {
  $command = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $command) { return $null }
  if (Test-Node $command.Source) { return $command.Source }
  return $null
}

function Install-ManagedNode {
  Stage 1 "Runtime / Node: installing managed Node.js $NodeVersion win-x64"
  $asset = "node-v$NodeVersion-win-x64.zip"
  $base = "https://nodejs.org/dist/v$NodeVersion"
  $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("agent-helm-node-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $temp -Force | Out-Null
  try {
    $archive = Join-Path $temp $asset
    $sums = Join-Path $temp 'SHASUMS256.txt'
    Invoke-WebRequest -UseBasicParsing -Uri "$base/$asset" -OutFile $archive
    Invoke-WebRequest -UseBasicParsing -Uri "$base/SHASUMS256.txt" -OutFile $sums
    $escaped = [regex]::Escape($asset)
    $line = Get-Content -LiteralPath $sums | Where-Object { $_ -match "^[0-9a-fA-F]{64}\s+\*?$escaped$" } | Select-Object -First 1
    if (-not $line) { Fail "Node.js SHASUMS256.txt does not contain $asset" }
    $expected = ($line -split '\s+')[0].ToLowerInvariant()
    $actual = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expected -ne $actual) { Fail "Node.js SHA-256 verification failed for $asset" }
    $extract = Join-Path $temp 'extract'
    Expand-Archive -LiteralPath $archive -DestinationPath $extract -Force
    $source = Join-Path $extract "node-v$NodeVersion-win-x64"
    if (-not (Test-Path -LiteralPath (Join-Path $source 'node.exe'))) { Fail "managed Node archive is missing node.exe" }
    New-Item -ItemType Directory -Path $NodeRoot -Force | Out-Null
    $next = "$NodeCurrent.next"
    Remove-Item -LiteralPath $next -Recurse -Force -ErrorAction SilentlyContinue
    Move-Item -LiteralPath $source -Destination $next
    Remove-Item -LiteralPath $NodeCurrent -Recurse -Force -ErrorAction SilentlyContinue
    Move-Item -LiteralPath $next -Destination $NodeCurrent
  } finally {
    Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Stage 1 'Runtime / Node'
$NodeBin = Find-SystemNode
if ($NodeBin) {
  Write-Host "Agent Helm: using existing $(& $NodeBin --version)."
} else {
  $managed = Join-Path $NodeCurrent 'node.exe'
  if (-not (Test-Node $managed)) { Install-ManagedNode }
  $NodeBin = $managed
  Write-Host "Agent Helm: using managed $(& $NodeBin --version)."
}

$NpmCmd = Join-Path ([System.IO.Path]::GetDirectoryName($NodeBin)) 'npm.cmd'
if (-not (Test-Path -LiteralPath $NpmCmd)) {
  $managed = Join-Path $NodeCurrent 'node.exe'
  if (-not (Test-Node $managed)) { Install-ManagedNode }
  $NodeBin = $managed
  $NpmCmd = Join-Path $NodeCurrent 'npm.cmd'
}
if (-not (Test-Path -LiteralPath $NpmCmd)) { Fail 'npm is unavailable next to the selected Node.js runtime' }

New-Item -ItemType Directory -Path $AgentHome, $BinRoot -Force | Out-Null

if ($RuntimeBundle) {
  $Version = $Version -replace '^v', ''
  if ($Version -eq 'latest') { Fail 'bundled runtime requires an explicit Agent Helm version' }
  if (-not (Test-Path -LiteralPath $RuntimeBundle)) { Fail 'bundled Agent Helm runtime is missing' }
  if ($RuntimeBundleSha256 -notmatch '^[0-9a-fA-F]{64}$') { Fail 'bundled Agent Helm runtime SHA-256 is invalid' }
  $actual = (Get-FileHash -LiteralPath $RuntimeBundle -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $RuntimeBundleSha256.ToLowerInvariant()) { Fail 'bundled Agent Helm runtime SHA-256 verification failed' }
  Stage 2 "Agent Helm $Version: embedded runtime"
  $installRoot = "$Prefix.install.$([guid]::NewGuid().ToString('N'))"
  New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
  try {
    & tar.exe -xf $RuntimeBundle -C $installRoot
    if ($LASTEXITCODE -ne 0) { Fail 'could not extract bundled Agent Helm runtime' }
    $bundledCli = Join-Path $installRoot 'node_modules\@beforewave\agent-helm\lib\cli.js'
    if (-not (Test-Path -LiteralPath $bundledCli)) { Fail 'bundled Agent Helm runtime does not contain the CLI' }
    $backup = "$Prefix.previous"
    Remove-Item -LiteralPath $backup -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $Prefix) { Move-Item -LiteralPath $Prefix -Destination $backup }
    Move-Item -LiteralPath $installRoot -Destination $Prefix
    Remove-Item -LiteralPath $backup -Recurse -Force -ErrorAction SilentlyContinue
  } finally {
    Remove-Item -LiteralPath $installRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
} else {
  $Version = (& $ReleaseTool resolve -ReleaseUrl $ReleaseUrl -Version $Version | Select-Object -Last 1).Trim()
  Stage 2 "Agent Helm $Version: exact-version install"
  & $NpmCmd view "$Package@$Version" version --silent *> $null
  $npmHasVersion = $LASTEXITCODE -eq 0
  if ($npmHasVersion) {
    Write-Host "Installing stable $Package@$Version from npm..."
    & $NpmCmd install --prefix $Prefix "$Package@$Version" --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { Fail "npm install failed for $Package@$Version" }
  } else {
    $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("agent-helm-release-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $temp -Force | Out-Null
    try {
      $archive = Join-Path $temp 'agent-helm.tgz'
      & $ReleaseTool download -ReleaseUrl $ReleaseUrl -Version $Version -ArtifactId 'agent-helm-package' -Output $archive
      & $NpmCmd install --prefix $Prefix $archive --no-audit --no-fund
      if ($LASTEXITCODE -ne 0) { Fail "local GitHub tgz install failed for Agent Helm $Version" }
    } finally {
      Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

$CliJs = Join-Path $Prefix 'node_modules\@beforewave\agent-helm\lib\cli.js'
if (-not (Test-Path -LiteralPath $CliJs)) { Fail "Agent Helm CLI was not installed at $CliJs" }
$Launcher = Join-Path $BinRoot 'agent-helm.cmd'
$escapedCli = $CliJs.Replace('%', '%%')
$escapedFallbackNode = $NodeBin.Replace('%', '%%')
$launcherBody = @"
@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "MANAGED_NODE=%USERPROFILE%\.agent-helm\runtime\node\current\node.exe"
set "FALLBACK_NODE=$escapedFallbackNode"
set "CLI_JS=$escapedCli"
set "NODE_BIN="
if defined AGENT_HELM_NODE call :use_node_if_compatible "%AGENT_HELM_NODE%"
if not defined NODE_BIN call :use_node_if_compatible "%MANAGED_NODE%"
if not defined NODE_BIN for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined NODE_BIN call :use_node_if_compatible "%%I"
if not defined NODE_BIN call :use_node_if_compatible "%FALLBACK_NODE%"
if not defined NODE_BIN exit /b 127
set "CLI_PATH=%CLI_JS%"
if defined AGENT_HELM_CLI if exist "%AGENT_HELM_CLI%" set "CLI_PATH=%AGENT_HELM_CLI%"
if not exist "%CLI_PATH%" exit /b 127
"%NODE_BIN%" "%CLI_PATH%" %*
exit /b %errorlevel%

:use_node_if_compatible
if not exist "%~1" exit /b 0
set "NODE_MAJOR="
for /f "delims=" %%V in ('"%~1" -p "process.versions.node.split(String.fromCharCode(46))[0]" 2^>nul') do set "NODE_MAJOR=%%V"
if not defined NODE_MAJOR exit /b 0
if %NODE_MAJOR% GEQ 22 set "NODE_BIN=%~1"
exit /b 0
"@
[IO.File]::WriteAllText($Launcher, $launcherBody, [Text.UTF8Encoding]::new($false))

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$pathEntries = @($userPath -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if (-not ($pathEntries | Where-Object { $_.TrimEnd('\\') -ieq $BinRoot.TrimEnd('\\') })) {
  $nextPath = (($pathEntries + $BinRoot) -join ';')
  [Environment]::SetEnvironmentVariable('Path', $nextPath, 'User')
}
if (-not (($env:Path -split ';') | Where-Object { $_.TrimEnd('\\') -ieq $BinRoot.TrimEnd('\\') })) {
  $env:Path = "$BinRoot;$env:Path"
}
Stage 3 "CLI launcher: $Launcher"

if (-not [string]::IsNullOrWhiteSpace($ChromeExtensionId)) {
  Stage 4 "Native Messaging bridge: $ChromeExtensionId"
  & $Launcher install-chrome-native-host --extension-id $ChromeExtensionId
  if ($LASTEXITCODE -ne 0) { Fail 'Chrome Native Messaging bridge registration failed' }
  return
}

Stage 4 'Setup'
Write-Host 'Agent Helm installed. Running Agent Helm setup...'
& $Launcher setup
if ($LASTEXITCODE -ne 0) { Fail 'Agent Helm setup failed' }
