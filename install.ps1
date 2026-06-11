# Install opencode-worktree-tools (global OpenCode plugin)
# Usage: powershell -ExecutionPolicy Bypass -File .\install.ps1

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Invoke-NodeScript {
    param([string]$ScriptPath)
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
        & node $ScriptPath
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        return
    }
    $bun = Get-Command bun -ErrorAction SilentlyContinue
    if ($bun) {
        & bun run $ScriptPath
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        return
    }
    Write-Host "Node.js or Bun is required." -ForegroundColor Red
    exit 1
}

Write-Host "opencode-worktree-tools installer" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Invoke-NodeScript "$PSScriptRoot\scripts\install-global.mjs"
Write-Host "`nDone! Restart OpenCode to activate the plugin." -ForegroundColor Green