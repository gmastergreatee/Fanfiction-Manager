@echo off
title Fanfiction Manager v4 - Debug Launcher
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
echo Starting Fanfiction Manager v4 in Tauri Debug Mode...
call npm.cmd run start
pause

