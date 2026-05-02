@echo off
setlocal
title NaagrikInfo Launcher

echo ============================================================
echo      NaagrikInfo: Political Transparency Dashboard
echo ============================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js to continue.
    pause
    exit /b
)

:: Check for Python and Virtual Environment
set "PYTHON_EXE=python"
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
    echo [INFO] Using virtual environment found in .venv
) else (
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo [WARNING] Python not found. Python Tracker will fail to start.
    )
)

echo.
echo [1/3] Starting Node.js API (Port 8787)...
echo       Handling: News, Representatives, Integrity, ED Cases
start "NaagrikInfo - Node API" cmd /c "npm run api"

echo [2/3] Starting Python Tracker (Port 5050)...
echo       Handling: ECI Scraper, RSS Snapshots
if exist "python_tracker\app.py" (
    start "NaagrikInfo - Python Tracker" cmd /c "cd python_tracker && ..\%PYTHON_EXE% app.py"
) else (
    echo [ERROR] python_tracker\app.py not found.
)

echo [3/3] Starting Frontend Server (Port 8000)...
echo       Serving: Glassmorphic Dashboard
start "NaagrikInfo - Frontend" cmd /c "npm run dev"

echo.
echo Waiting for services to warm up (6 seconds)...
timeout /t 6 >nul

echo.
echo [SUCCESS] Opening Dashboard in browser...
start http://localhost:8000

echo.
echo ------------------------------------------------------------
echo  - Dashboard:  http://localhost:8000
echo  - Data API:   http://localhost:8787
echo  - Tracker:    http://localhost:5050
echo ------------------------------------------------------------
echo  Keep this window open while using the application.
echo  To shut down, close the individual server windows.
echo ------------------------------------------------------------
echo.
pause
