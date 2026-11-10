@echo off
REM Dipanggil oleh skrip lain (call "%~dp0_env.bat"). Tidak ada jalur yang ditulis tetap:
REM   APP_DIR  = folder induk dari folder scripts\ ini
REM   PHP_EXE  = PHP_CLI_PATH dari .env, atau "php" dari PATH Windows bila kosong
REM   RV_HOST / RV_PORT = REVERB_SERVER_HOST / REVERB_SERVER_PORT dari .env (bawaan 0.0.0.0 dan 8080)

set "APP_DIR=%~dp0.."
for %%I in ("%APP_DIR%") do set "APP_DIR=%%~fI"

set "PHP_EXE="
set "RV_HOST="
set "RV_PORT="

if exist "%APP_DIR%\.env" (
    for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"PHP_CLI_PATH=" "%APP_DIR%\.env"`) do set "PHP_EXE=%%~B"
    for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"REVERB_SERVER_HOST=" "%APP_DIR%\.env"`) do set "RV_HOST=%%~B"
    for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"REVERB_SERVER_PORT=" "%APP_DIR%\.env"`) do set "RV_PORT=%%~B"
)

if "%PHP_EXE%"=="" set "PHP_EXE=php"
if "%RV_HOST%"=="" set "RV_HOST=0.0.0.0"
if "%RV_PORT%"=="" set "RV_PORT=8080"
