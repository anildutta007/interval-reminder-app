@echo off
title Stop PulseRemind Background Service
cd /d "%~dp0"
echo ========================================================
echo   Stopping PulseRemind Background Service...
echo ========================================================
echo.

powershell -Command "try { Invoke-RestMethod -Uri 'http://127.0.0.1:8050/api/shutdown' -Method Post -TimeoutSec 2 | Out-Null; Write-Host 'Graceful shutdown signal sent.' } catch {}"

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8050 ^| findstr LISTENING') do (
    echo Terminating process PID %%a listening on port 8050...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo PulseRemind background service has been stopped.
echo.
pause
