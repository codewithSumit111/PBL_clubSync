# ClubSync - Start Frontend & Backend in separate PowerShell windows

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting ClubSync..." -ForegroundColor Cyan
Write-Host "Project root: $ProjectDir"

# Start Backend
Write-Host "Launching Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectDir\backend'; Write-Host '=== ClubSync Backend ===' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 1

# Start Frontend
Write-Host "Launching Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectDir'; Write-Host '=== ClubSync Frontend ===' -ForegroundColor Yellow; npm run dev"

Write-Host "Both servers are starting. Check the new PowerShell windows." -ForegroundColor Cyan
