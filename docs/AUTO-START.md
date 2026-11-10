# Menjalankan dan Merestart Server

Aplikasi butuh tiga hal berjalan: **web server + MySQL** (Laragon), **queue worker** (notifikasi),
dan **Reverb** (WebSocket untuk layar display). Skrip di folder `scripts\` mengurus dua yang terakhir.

Skrip **tidak menulis jalur tetap**. Lokasi aplikasi diambil dari letak skrip itu sendiri, jadi folder
aplikasi boleh dipindah atau dipasang di server mana pun tanpa mengedit skrip.

## 1. Setelah PC Restart (otomatis)

1. **Web server (Apache/Nginx + MySQL)**: buka Laragon > Preferences > centang
   **Run Laragon when Windows starts** dan **Start All automatically**.
2. **Queue worker dan WebSocket (Reverb)**: dijalankan oleh `scripts\start-services.bat`.
3. Daftarkan ke Task Scheduler (Command Prompt sebagai Administrator). Ganti `<FOLDER-APLIKASI>`
   dengan lokasi aplikasi di server (mis. `C:\laragon\www\meeting-room`):

```
schtasks /Create /TN "JadwalRapat-Services" /TR "<FOLDER-APLIKASI>\scripts\start-services.bat" /SC ONSTART /DELAY 0001:00 /RU SYSTEM /RL HIGHEST /F
```

   Delay 1 menit memberi waktu Laragon menyalakan MySQL lebih dulu.
4. Uji: restart PC, lalu buka **Pemantauan Layanan** (`/admin/monitoring`) dan cek bahwa kedua layanan *Berjalan*.
5. Hapus tugas: `schtasks /Delete /TN "JadwalRapat-Services" /F`

Log: `storage\logs\reverb-service.log` dan `storage\logs\queue-service.log`.

### Jika `php` tidak dikenali

Skrip memakai `php` dari PATH Windows. Jika tidak ada di PATH (umum pada Laragon), isi lokasi `php.exe`
di berkas `.env` (satu kali saja):

```
PHP_CLI_PATH="C:\laragon\bin\php\php-8.4.27-nts-Win32-vs17-x64\php.exe"
```

Port dan alamat Reverb dibaca dari `.env` (`REVERB_SERVER_HOST`, `REVERB_SERVER_PORT`); bawaannya `0.0.0.0` dan `8080`.

## 2. Merestart layanan

### Lewat halaman Pemantauan Layanan (disarankan)

Buka `/admin/monitoring` (khusus Admin), bagian **Kendali Layanan**:

- **Jalankan**: muncul jika layanan berhenti. Tidak pernah membuka proses kedua jika sudah berjalan.
- **Restart**: muncul jika layanan berjalan. Layanan lama diminta berhenti dengan rapi, aplikasi menunggu
  sampai benar-benar berhenti, baru menjalankan yang baru. Jika yang lama tidak mau berhenti dalam
  40 detik, restart dibatalkan (tidak memaksa dan tidak membuat dua proses).
  - Queue worker: sekitar 10 detik. Notifikasi tertunda sebentar.
  - Reverb: layar display terputus sekitar 10-40 detik lalu tersambung sendiri.

Lokasi PHP dideteksi otomatis dan ditampilkan di bawah tombol. Jika tidak ditemukan, tombol dinonaktifkan
dan muncul petunjuk untuk mengisi `PHP_CLI_PATH` di `.env`. Semua tindakan dicatat di **Log Aktivitas**.

Log proses restart: `storage\logs\service-control.log` (ringkas) dan `service-control-output.log` (keluaran konsol).

### Lewat skrip (cadangan jika tombol tidak bisa dipakai)

Klik ganda `scripts\restart-services.bat`. Skrip meminta layanan lama berhenti, menunggu sampai berhenti
(maksimal sekitar 40 detik), lalu menjalankan yang baru lewat `start-services.bat`.

## Hal yang perlu diketahui

- **Hak akses.** Skrip Task Scheduler di atas berjalan sebagai SYSTEM, sedangkan tombol di halaman
  monitoring membuka proses atas nama akun yang menjalankan Apache. Keduanya boleh dipakai bergantian,
  tetapi **uji sekali di server** setelah dipasang: tekan Restart pada kedua layanan dan pastikan
  statusnya kembali *Berjalan*. Jika Apache tidak diizinkan membuka proses, gunakan skrip (bagian di atas).
- **Jangan hapus cache data lewat `php artisan cache:clear` / `optimize:clear`** saat layanan berjalan.
  Queue worker dan Reverb menyimpan tanda restart di cache dan **berhenti sendiri** bila tanda itu hilang.
  Tombol **Bersihkan Cache** di halaman monitoring sudah aman (hanya membersihkan cache konfigurasi,
  rute, dan tampilan). Jika terlanjur, jalankan kembali layanan lewat tombol **Jalankan**.
- Skrip ini tidak menghidupkan lagi proses yang mati sendiri. Untuk itu pakai pengawas proses seperti
  NSSM (`nssm install JadwalRapat-Reverb <php.exe> artisan reverb:start`), yang juga membuat tombol
  Restart lebih tahan lama.
