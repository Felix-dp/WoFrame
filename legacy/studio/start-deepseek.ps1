param([switch]$Verify, [string]$BrowserPath)
$ErrorActionPreference = 'Stop'
if ($Verify -and -not $BrowserPath) {
    throw 'Pass -BrowserPath with the full Chrome or Edge executable path.'
}

$studioPreviousKey = $env:DEEPSEEK_API_KEY
try {
    if (-not $env:DEEPSEEK_API_KEY) {
        $studioSecret = Read-Host 'DeepSeek API key (input hidden)' -AsSecureString
        try {
            $env:DEEPSEEK_API_KEY = [Net.NetworkCredential]::new('', $studioSecret).Password
        } finally {
            $studioSecret.Dispose()
        }
    }
    if (-not $env:DEEPSEEK_API_KEY) { throw 'DeepSeek API key is empty.' }
    if ($Verify) {
        & node (Join-Path $PSScriptRoot 'browser-smoke.mjs') $BrowserPath --live-ai
    } else {
        & node (Join-Path $PSScriptRoot 'server.mjs')
    }
    if ($LASTEXITCODE -ne 0) { throw "Studio exited with code $LASTEXITCODE." }
} finally {
    $env:DEEPSEEK_API_KEY = $studioPreviousKey
}
