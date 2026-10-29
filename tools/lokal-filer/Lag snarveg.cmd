@echo off
rem Lagar snarvegen "SXI-generatoren (lokal)" paa skrivebordet og i Start-menyen.
rem Koeyr paa nytt om mappa vert flytt.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0lag-snarveg.ps1"
echo.
pause
