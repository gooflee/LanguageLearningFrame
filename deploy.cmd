@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Deploy-Scene.ps1" %*
