@echo off
REM Menjalankan queue worker dan WebSocket (Reverb) untuk aplikasi Jadwal Rapat.
REM Dipanggil otomatis oleh Task Scheduler saat Windows menyala (lihat docs/AUTO-START.md).
REM Ubah APP_DIR / PHP_EXE jika lokasi berbeda.
set APP_DIR=E:\Laragon\www\meeting-room
set PHP_EXE=php

cd /d %APP_DIR%

start "reverb" /min cmd /c "%PHP_EXE% artisan reverb:start --host=0.0.0.0 --port=8080 >> storage\logs\reverb-service.log 2>&1"
start "queue" /min cmd /c "%PHP_EXE% artisan queue:work --tries=3 --timeout=90 >> storage\logs\queue-service.log 2>&1"
exit /b 0
