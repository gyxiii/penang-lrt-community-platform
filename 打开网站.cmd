@echo off
setlocal
cd /d "%~dp0"
if not exist "js\google-map-config.js" (
  copy /y "js\google-map-config.example.js" "js\google-map-config.js" >nul
  if errorlevel 1 (
    echo Could not prepare the local map configuration.
    exit /b 1
  )
)
if /i "%~1"=="--prepare-only" exit /b 0
start "" "%~dp0index.html"
endlocal
