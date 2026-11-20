@echo off
rem Abre o IdleHub direto pelo Electron local (nao depende do npm/PATH).
if not exist "%~dp0node_modules\electron\dist\electron.exe" (
  echo Rode "npm install" nesta pasta primeiro.
  pause
  exit /b 1
)
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
