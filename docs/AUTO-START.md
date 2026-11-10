# Menjalankan Server Otomatis Setelah PC Restart

1. **Web server (Apache/Nginx + MySQL)**: buka Laragon > Preferences > centang
   **Run Laragon when Windows starts** dan **Start All automatically**.
2. **Queue worker dan WebSocket (Reverb)**: dijalankan oleh `scripts\start-services.bat`.
   Periksa `APP_DIR` dan `PHP_EXE` di dalam file tersebut (jika `php` tidak ada di PATH,
   isi dengan path penuh php.exe milik Laragon).
3. Daftarkan ke Task Scheduler (Command Prompt sebagai Administrator):

```
schtasks /Create /TN "JadwalRapat-Services" /TR "E:\Laragon\www\meeting-room\scripts\start-services.bat" /SC ONSTART /DELAY 0001:00 /RU SYSTEM /RL HIGHEST /F
```

   Delay 1 menit memberi waktu Laragon menyalakan MySQL lebih dulu.
4. Uji: restart PC, lalu buka `/admin/monitoring` dan cek bahwa Reverb dan queue aktif.
5. Hapus tugas: `schtasks /Delete /TN "JadwalRapat-Services" /F`

Log ada di `storage\logs\reverb-service.log` dan `storage\logs\queue-service.log`.
Catatan: skrip ini tidak memulai ulang proses yang mati sendiri. Untuk auto-restart,
gunakan NSSM (`nssm install JadwalRapat-Reverb php.exe artisan reverb:start`).
