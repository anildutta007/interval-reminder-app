@echo off
title Start PulseRemind in Background
cd /d "%~dp0"
echo ========================================================
echo   Starting PulseRemind Background Daemon...
echo ========================================================
echo.
echo Launching server silently in background via pythonw...
start "" pythonw server.py

echo.
echo PulseRemind is now running in the background!
echo - It will continue monitoring tasks even if you close the browser tab.
echo - Audio alarms and Hindi/English voice announcements will trigger on your PC.
echo.
echo To stop the background daemon anytime, run: stop_background_reminder.bat
echo.
timeout /t 2 >nul
exit
