# ClubSync - Start Frontend & Backend in separate PowerShell windows

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPortInUse = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
$frontendPortInUse = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

Write-Host "Starting ClubSync..." -ForegroundColor Cyan
Write-Host "Project root: $ProjectDir"

# Start Backend
if ($backendPortInUse) {
	Write-Host "Backend already appears to be running on port 5000. Skipping a second backend launch." -ForegroundColor Yellow
} else {
	Write-Host "Launching Backend..." -ForegroundColor Green
	Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectDir\backend'; Write-Host '=== ClubSync Backend ===' -ForegroundColor Green; npm run dev"
}

Start-Sleep -Seconds 1


# Start Frontend
if ($frontendPortInUse) {
	Write-Host "Frontend already appears to be running on port 5173. Skipping a second frontend launch." -ForegroundColor Yellow
} else {
	Write-Host "Launching Frontend..." -ForegroundColor Yellow
	Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectDir'; Write-Host '=== ClubSync Frontend ===' -ForegroundColor Yellow; npm run dev"
}

Write-Host "Startup check complete. Review the PowerShell windows for any services that were launched." -ForegroundColor Cyan
