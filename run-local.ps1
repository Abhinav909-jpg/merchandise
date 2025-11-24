# Small helper to run the built-in PHP server or show instructions
if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "PHP not found on PATH. Install PHP or use XAMPP/WAMP. See README.md" -ForegroundColor Yellow
    exit 1
}

$root = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Write-Host "Starting PHP built-in server at http://localhost:8000 (root: $root)"
Write-Host "Press Ctrl+C to stop"
php -S localhost:8000 -t $root
