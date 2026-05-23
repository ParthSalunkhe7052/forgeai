@echo off
title Forge AI — Local Setup and Startup Manager
color 0B
cls

echo =================================================================
echo  FORGE AI — STEEL MANUFACTURING OPERATIONS CO-PILOT
echo  Local Environment Verification & Startup Controller
echo =================================================================
echo.

set WORKSPACE_DIR=%~dp0
set API_DIR=%WORKSPACE_DIR%forge-api
set AI_DIR=%WORKSPACE_DIR%forge-ai

:: 1. Verify python environment
echo [1/6] Verifying Backend Python virtual environment...
if not exist "%API_DIR%\venv" (
    echo [INFO] Virtual environment not found. Initializing virtualenv inside %API_DIR%\venv...
    cd /d "%API_DIR%"
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Python not found or failed to initialize venv. Make sure Python 3.10+ is added to PATH.
        pause
        exit /b 1
    )
    echo [INFO] venv created successfully.
) else (
    echo [INFO] venv directory verified.
)

:: Activate and install requirements
echo.
echo [2/6] Restoring backend pip package dependencies...
cd /d "%API_DIR%"
call venv\Scripts\activate.bat
call pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies via pip.
    pause
    exit /b 1
)
echo [INFO] Python packages restored.

:: 2. Verify Node dependencies
echo.
echo [3/6] Verifying Frontend NPM packages...
cd /d "%AI_DIR%"
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing NPM dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] NPM install failed. Make sure Node.js is installed.
        pause
        exit /b 1
    )
) else (
    echo [INFO] node_modules verified.
)
echo [INFO] Frontend packages ready.

:: 3. Docker compose (Postgres + Redis)
echo.
echo [4/6] Checking local Docker Engine status...
cd /d "%WORKSPACE_DIR%"
docker ps >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Docker Daemon detected. Spinning up local PostgreSQL and Redis...
    docker-compose up -d
    echo [INFO] Docker containers active.
) else (
    echo [WARNING] Docker Daemon is not running or not found.
    echo           Backend will automatically fallback to offline SQLite [forgeai.db] and in-memory cache.
)

:: 4. Seeding data
echo.
echo [5/6] Ensuring local database is fully seeded with 90-day history...
cd /d "%API_DIR%"
call venv\Scripts\python scripts/seed_data.py
if errorlevel 1 (
    echo [ERROR] Seeding process failed.
    pause
    exit /b 1
)

:: 5. Start Servers
echo.
echo [6/6] Launching Servers...
start "Forge AI Backend (Port 8000)" /D "%API_DIR%" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo [INFO] Starting Next.js Frontend on http://localhost:3000...
start "Forge AI Frontend (Port 3000)" /D "%AI_DIR%" cmd /k "npm run dev"

:: 6. Launch browser
echo.
echo [SUCCESS] Environment startup sequence initialized successfully!
echo           Waiting 5 seconds for local ports to initialize, then launching dashboard...
ping 127.0.0.1 -n 6 > nul
start http://localhost:3000
echo.
echo =================================================================
echo  Dashboard is launching at http://localhost:3000
echo  Press any key to exit this startup script (servers stay active).
echo =================================================================
pause > nul
exit /b 0
