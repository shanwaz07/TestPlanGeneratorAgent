@echo off
title Leoforce Test Plan Generator
color 1F

echo.
echo  ============================================================
echo   Leoforce Test Plan Generator
echo   Where AI Meets Empathy
echo  ============================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Set working directory to script location
cd /d "%~dp0"

:: Check .env exists
if not exist ".env" (
    echo  [WARN] .env file not found. Copying from .env.example...
    copy ".env.example" ".env" >nul
    echo  [WARN] Please fill in your credentials in .env before using the app.
    echo.
)

:: Check backend dependencies
if not exist "backend\node_modules" (
    echo  [INFO] Installing backend dependencies...
    cd backend
    call npm install --silent
    cd ..
    echo  [INFO] Backend dependencies installed.
)

:: Check frontend dependencies
if not exist "frontend\node_modules" (
    echo  [INFO] Installing frontend dependencies...
    cd frontend
    call npm install --silent
    cd ..
    echo  [INFO] Frontend dependencies installed.
)

echo  [INFO] Starting Backend  ^(http://localhost:5000^)...
start "Backend  - Test Plan Generator" /min cmd /c "cd /d "%~dp0backend" && npm run dev"

:: Give backend a moment to boot
timeout /t 3 /nobreak >nul

echo  [INFO] Starting Frontend ^(http://localhost:3000^)...
start "Frontend - Test Plan Generator" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"

:: Wait for frontend to be ready
timeout /t 4 /nobreak >nul

echo.
echo  ============================================================
echo   Both servers are running!
echo.
echo   App    ->  http://localhost:3000
echo   API    ->  http://localhost:5000
echo   Health ->  http://localhost:5000/health
echo  ============================================================
echo.
echo  Opening browser...
start "" "http://localhost:3000"

echo.
echo  Press any key to STOP both servers and exit.
pause >nul

echo.
echo  [INFO] Shutting down servers...
taskkill /fi "WindowTitle eq Backend  - Test Plan Generator" /f >nul 2>&1
taskkill /fi "WindowTitle eq Frontend - Test Plan Generator" /f >nul 2>&1
echo  [INFO] Done. Goodbye!
timeout /t 2 /nobreak >nul
