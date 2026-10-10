@echo off
title CHRONO-LOCK : CODING ADVENTURE
color 0B
cls
echo.
echo   ============================================================
echo        CHRONO-LOCK : CODING ADVENTURE
echo        CODE THE CITY. LEARN PROGRAMMING BY CHANGING THE WORLD.
echo   ============================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] Node.js was not found on this system.
  echo   Please install Node.js 18+ from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   [SETUP] Installing dependencies for the first time...
  echo   This can take a couple of minutes. Please wait.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [ERROR] Dependency installation failed. See the messages above.
    pause
    exit /b 1
  )
)

echo.
echo   [LAUNCH] Starting Chrono-Lock...
echo   The game will open in your browser at http://localhost:5173
echo   Keep this window open while playing. Close it to stop the game.
echo.

call npm run start

pause
