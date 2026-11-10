@echo off
REM Restart queue worker dan WebSocket (Reverb): minta yang lama berhenti dengan rapi,
REM tunggu sampai benar-benar berhenti, lalu jalankan yang baru. Cadangan manual bila
REM tombol Restart di halaman monitoring tidak bisa dipakai.
call "%~dp0_env.bat"

cd /d "%APP_DIR%"

echo Meminta layanan lama berhenti...
"%PHP_EXE%" artisan queue:restart
"%PHP_EXE%" artisan reverb:restart

echo Menunggu layanan lama berhenti (maksimal sekitar 40 detik)...
set /a TRIES=0
:waitloop
netstat -ano | findstr /r /c:":%RV_PORT% .*LISTENING" >nul
if errorlevel 1 goto stopped
set /a TRIES+=1
if %TRIES% geq 20 (
    echo Reverb lama belum berhenti. Restart dibatalkan agar tidak terjadi dua proses.
    echo Tutup jendela "reverb" secara manual atau restart PC, lalu jalankan skrip ini lagi.
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto waitloop

:stopped
timeout /t 5 /nobreak >nul
echo Menjalankan layanan baru...
call "%~dp0start-services.bat"
echo Selesai. Periksa halaman Pemantauan Layanan beberapa detik lagi.
exit /b 0
