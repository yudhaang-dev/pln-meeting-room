@echo off
cd /d "E:\Laragon\www\meeting-room"
"E:\Laragon\bin\php\php-8.4.27-nts-Win32-vs17-x64\php.exe" artisan reverb:start --host=0.0.0.0 --port=8080 >> "E:\Laragon\www\meeting-room\storage\logs\reverb-service.log" 2>&1
