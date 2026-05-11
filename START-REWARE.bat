@echo off
title REWARE CampusCycle
cd /d "%~dp0"
echo Starting REWARE (keep this window open)...
echo Copy the FULL http://localhost:PORT url from below — port may be 4000, 4001, etc.
echo.
node backend/server.js
if errorlevel 1 (
  echo.
  echo If "node is not recognized": install Node.js from https://nodejs.org then run: npm install
  echo If port is busy: in PowerShell run   set PORT=4010   then double-click this file again, or run npm start
  pause
)
