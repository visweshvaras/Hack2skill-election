@echo off
setlocal

echo ========================================
echo NaagrikInfo Local Hosting Suite
echo ========================================

echo.
echo [1/3] Starting Node.js Backend (Port 8787)...
echo Note: This server also handles static file serving.
start "NaagrikInfo - Node API" cmd /c "npm run api"

echo [2/3] Starting Python Tracker (Port 5050)...
echo Note: This handles background snapshots and live ECI data.
start "NaagrikInfo - Python Tracker" cmd /c "cd python_tracker && python app.py"

echo [3/3] Starting Frontend Server (Port 8000)...
start "NaagrikInfo - Frontend" cmd /c "npm run dev"

echo.
echo Waiting 5 seconds for systems to initialize...
timeout /t 5 >nul

echo.
echo Opening NaagrikInfo in your browser...
start http://localhost:8000

echo.
echo ========================================
echo All systems are running!
echo - Dashboard: http://localhost:8000
echo - Node API: http://localhost:8787
echo - Python Tracker: http://localhost:5050
echo.
echo To stop, close the individual terminal windows.
echo ========================================
echo.
pause
