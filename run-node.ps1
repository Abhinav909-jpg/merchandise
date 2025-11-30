# helper to run the Node server for local development
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node not found on PATH. Install Node.js first (https://nodejs.org/)" -ForegroundColor Yellow
    exit 1
}

$root = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $root
if (-not (Test-Path node_modules)) {
    Write-Host "Installing npm packages..."
    npm install
}

Write-Host "Starting Node server at http://localhost:8000"
Write-Host "Press Ctrl+C to stop"
node server.js
