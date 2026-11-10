@echo off
cd /d "E:\Laragon\www\meeting-room"
"E:\Laragon\bin\php\php-8.4.27-nts-Win32-vs17-x64\php.exe" artisan queue:work --tries=3 --timeout=90 >> "E:\Laragon\www\meeting-room\storage\logs\queue-service.log" 2>&1
