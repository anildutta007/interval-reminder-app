@echo off
title Push PulseRemind to GitHub
cd /d "%~dp0"
echo ========================================================
echo        Pushing interval-reminder-app to GitHub
echo ========================================================
echo.
echo Remote target: https://github.com/anildutta007/interval-reminder-app.git
echo.

git init -b main 2>nul
git add .
git commit -m "Initial commit: PulseRemind Interval Task & Habit Reminder Alarm Web App" 2>nul
git branch -M main

git remote get-url origin >nul 2>nul
if errorlevel 1 (
    git remote add origin https://github.com/anildutta007/interval-reminder-app.git
) else (
    git remote set-url origin https://github.com/anildutta007/interval-reminder-app.git
)

git push -u origin main
if errorlevel 1 (
    echo.
    echo ========================================================
    echo [ACTION REQUIRED ON GITHUB]
    echo 1. Open your browser and go to: https://github.com/new
    echo 2. Repository name: interval-reminder-app
    echo 3. Keep it Public (or Private)
    echo 4. Leave "Add a README file" UNCHECKED (keep repo empty)
    echo 5. Click "Create repository"
    echo 6. Run this push_to_github.bat script again!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  SUCCESS! Your code has been pushed to GitHub:
    echo  https://github.com/anildutta007/interval-reminder-app
    echo ========================================================
)
pause
