# Petunjuk Pembaruan Aplikasi (Revisi November 2026)

Untuk: petugas IT yang mengelola server Aplikasi Jadwal Rapat UP Tarahan.
Waktu pengerjaan: sekitar 15 menit. Aplikasi tidak bisa dipakai selama langkah 4-6 (beberapa menit), jadi pilih jam sepi.

Semua perintah dijalankan di **folder aplikasi**, yaitu folder yang berisi berkas `artisan` dan `.env`. Lokasinya bisa berbeda di tiap server (misalnya langsung di `C:\laragon\www`, atau di dalam subfolder), jadi pindah dulu ke folder itu (`cd /d <folder aplikasi>`). Gunakan Terminal Laragon atau Command Prompt.

## 1. Sebelum mulai

1. Pastikan tidak ada pengguna yang sedang mengisi atau mengunggah sesuatu.
2. Buat cadangan database. Pilih salah satu:
   - Masuk sebagai **Admin**, buka alamat `/admin/monitoring` (halaman **Pemantauan Layanan**, tidak ada di menu samping), lalu tekan **Export Database** di bagian **Tindakan Cepat**. Simpan berkas `.sql` di tempat aman.
   - Atau lewat HeidiSQL / `mysqldump`.
3. Catat versi yang sedang terpasang, untuk jaga-jaga bila perlu kembali:

   ```
   git rev-parse --short HEAD
   ```

## 2. Ambil kode terbaru

```
git pull
```

Jika muncul pesan ada perubahan lokal yang bentrok, hentikan dan hubungi pengembang. Jangan memakai `git reset --hard` atau `git checkout .` karena bisa menghapus pengaturan di server.

Folder `public/build` sudah ikut di repo, jadi **tidak perlu** `npm install` / `npm run build`. Tidak ada perubahan paket, jadi **tidak perlu** `composer install`.

## 3. Periksa berkas `.env`

Buka `.env` dan pastikan baris berikut:

| Baris | Nilai | Keterangan |
|---|---|---|
| `APP_LOCALE` | `id` | Wajib agar pesan dari sistem berbahasa Indonesia. Bila masih `en`, ubah. |
| `APP_URL` | alamat yang dipakai pengguna | Contoh `http://192.168.1.2`. Tidak lagi menjadi penyebab preview lampiran gagal, tetapi tetap sebaiknya benar. |
| `PHP_CLI_PATH` | (opsional) | Isi jalur `php.exe` hanya jika tombol Jalankan/Restart di Pemantauan Layanan gagal menemukan PHP. Biasanya dikosongkan. |

Port WebSocket (default `8080`) harus terbuka di firewall Windows agar layar TV dan PC display bisa terhubung.

## 4. Perbarui database

```
php artisan migrate --force
```

Ada 6 migrasi baru. Semuanya hanya menambah kolom atau tabel, data lama tidak berubah:

- `bookings`: kolom keterangan menjadi teks panjang, waktu selesai rapat, Format Acara (Hybrid/Offline)
- `activity_logs`: tabel baru untuk Log Aktivitas
- `users`: pengaturan tata letak dashboard
- `media`: halaman PDF hasil konversi gambar

Hasil yang benar: tiap migrasi bertanda `DONE`. Jika ada yang `FAIL`, **berhenti**, jangan lanjut, dan kirim pesan error-nya ke pengembang.

## 5. Bersihkan cache

```
php artisan optimize:clear
```

Pastikan juga tautan penyimpanan ada (untuk preview lampiran dan media). Jika folder `public\storage` belum ada:

```
php artisan storage:link
```

## 6. Restart layanan latar belakang

Queue worker dan WebSocket (Reverb) masih menjalankan kode lama, jadi harus di-restart. Pilih salah satu:

- Masuk sebagai **Admin**, buka `/admin/monitoring`, lalu tekan **Restart** (atau **Jalankan** bila status **Berhenti**) pada **Kendali Layanan**, untuk Pekerja Latar Belakang dan Server WebSocket; atau
- Jalankan `scripts\restart-services.bat`.

Setelah beberapa detik, muat ulang halaman **Pemantauan Layanan** dan pastikan **Pekerja Latar Belakang** (queue worker) dan **Server WebSocket** (Reverb) tidak berstatus **Berhenti**. Jika layanan belum terdaftar agar otomatis hidup saat PC menyala, ikuti [AUTO-START.md](AUTO-START.md).

## 7. Pemeriksaan setelah pembaruan

Centang satu per satu:

- [ ] Login berhasil; tampilan menu berbahasa Indonesia.
- [ ] Halaman **Booking**: formulir punya kolom **Format Acara**, **Level K3**, dan **Keterangan**.
- [ ] Menu **Jadwal** dan **Ruang Rapat** tampil.
- [ ] Login Admin: menu **Log Aktivitas** tampil dan login yang barusan tercatat; halaman `/admin/monitoring` terbuka.
- [ ] Buka lampiran (JPG/PNG/PDF) pada sebuah booking, pastikan preview muncul (R5).
- [ ] Buka layar display (Lobby / Infografis) di PC, pastikan media berputar dan tidak blank.
- [ ] Ubah satu booking dan pastikan layar display ikut berubah tanpa dimuat ulang (menandakan WebSocket jalan).

## 8. Setelah pembaruan

- **PDF di layar display:** PDF yang sudah diunggah sebelum pembaruan tetap tampil seperti dulu (bisa putih di TV Samsung). Agar tampil sebagai gambar yang aman untuk TV, **hapus lalu unggah ulang** PDF tersebut lewat menu Infografis. Konversi terjadi di browser pengunggah, jadi tunggu sampai muncul tanda selesai sebelum menutup halaman.
- **TV Samsung (Lobby):** muat ulang halaman display satu kali di TV agar memakai versi baru. Selanjutnya TV memulihkan diri sendiri setelah standby dan memuat ulang otomatis tiap 6 jam.
- **Pengujian di TV:** mohon biarkan TV standby lebih dari 2 hari, lalu catat apakah layar tetap tampil normal. Jika blank lagi, catat tanggal dan jam kejadiannya dan kirim ke pengembang, beserta contoh PDF yang tampil putih.

## Jika ada masalah

| Gejala | Langkah |
|---|---|
| Halaman error 500 setelah pembaruan | Jalankan `php artisan optimize:clear`, lalu lihat `storage\logs\laravel.log` (baris paling bawah) dan kirim ke pengembang. |
| Layar display tidak berubah otomatis | Cek **Server WebSocket** berjalan di `/admin/monitoring` dan port 8080 terbuka di firewall. Tanpa WebSocket, layar tetap memperbarui diri tiap beberapa menit lewat polling. |
| Notifikasi dan layar tidak ter-update | Queue worker mati. Restart layanan (langkah 6). |
| Perlu kembali ke versi lama | Hentikan layanan, pulihkan cadangan database dari langkah 1, lalu `git checkout <kode versi dari langkah 1>` dan restart layanan. Jangan memakai `migrate:rollback` karena akan menghapus data baru. |
