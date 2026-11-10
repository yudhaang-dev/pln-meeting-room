@echo off
cd /d "E:\Laragon\www\meeting-room"
"E:\Laragon\bin\php\php-8.4.27-nts-Win32-vs17-x64\php.exe" artisan services:relaunch queue >> "E:\Laragon\www\meeting-room\storage\logs\service-control-output.log" 2>&1
