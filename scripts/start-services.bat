@echo off
REM Menjalankan queue worker dan WebSocket (Reverb) untuk aplikasi Jadwal Rapat.
REM Dipanggil otomatis oleh Task Scheduler saat Windows menyala (lihat docs/AUTO-START.md).
REM Tidak perlu mengedit jalur: lihat scripts\_env.bat (PHP_CLI_PATH di .env bila php tidak ada di PATH).
call "%~dp0_env.bat"

cd /d "%APP_DIR%"

start "reverb" /min cmd /c ""%PHP_EXE%" artisan reverb:start --host=%RV_HOST% --port=%RV_PORT% >> "storage\logs\reverb-service.log" 2>&1"
start "queue" /min cmd /c ""%PHP_EXE%" artisan queue:work --tries=3 --timeout=90 >> "storage\logs\queue-service.log" 2>&1"
exit /b 0
