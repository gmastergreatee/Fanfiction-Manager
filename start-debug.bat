@echo off
title Fanfiction Manager v4 - Debug Launcher
cd /d "%~dp0"

:: Ensure Cargo, Node, and System32 are in PATH
set "PATH=%USERPROFILE%\.cargo\bin;%SystemRoot%\System32;%SystemRoot%;%PATH%"

echo ========================================================
echo   Fanfiction Manager v4 - Starting in Tauri Debug Mode
echo ========================================================
echo.

node scripts/start-tauri.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application exited with error code %errorlevel%.
)

pause
