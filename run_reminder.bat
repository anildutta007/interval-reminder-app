@echo off
title PulseRemind - Interval Task & Habit Reminder Alarm Hub
cd /d "%~dp0"
echo ========================================================
echo   PulseRemind - Interval Task & Habit Reminder Alarm Hub
echo   Automated Periodic Alarms, User Profiles & PIN Security
echo ========================================================
echo.
echo Starting server on http://127.0.0.1:8050 ...
echo Press Ctrl+C to stop.
echo.

python server.py

if errorlevel 1 (
    echo.
    echo Launching index.html directly in browser...
    start "" "%~dp0index.html"
)

pause
