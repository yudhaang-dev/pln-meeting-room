# Product Requirements Document (PRD): Kiosk Display UI/UX Agent Specification

**Sistem Terkait:** MeetingSpace  
**Target Eksekusi:** Stitch AI UX Generation Agent / Google Stitch Agent  
**Bahasa Output UI:** Bahasa Indonesia  
**Versi Dokumen:** 2.1 (Refactored for Multi-Orientation Hard Constraints)

---

## 1. Instruksi Utama & Batasan Keras Agen (*Agent Core Constraints*)

Agen AI wajib mematuhi tiga arsitektur perangkat keras dan batasan UX berikut dalam merancang komponen:

* **TIDAK ADA SCROLL (Zero Scroll & Overflow Hidden)**: Seluruh konten wajib muat dalam satu bingkai layar (*viewport*). Gunakan utilitas Tailwind `overflow-hidden` dan `h-screen`. Jangan menghasilkan elemen yang membutuhkan pemosisian gulir.
* **MODE LAYAR PENUH (Full-Screen Layout)**: Desain harus dioptimalkan untuk visibilitas jarak jauh (minimal 3-5 meter). Tipografi harus tebal dan memiliki kontras tinggi (WCAG AA) menggunakan token warna dari `DESIGN.md`.
* **RESPONS JARINGAN TERPUTUS (Offline Cache State)**: Desain layout harus statis dan kokoh, tidak boleh hancur atau bergeser ketika data kosong atau berada dalam status *cached offline*.

---

## 2. Spesifikasi Matriks Perangkat Keras (*Hardware Matrix*)

| Tipe Tampilan (Display) | Perangkat Keras & Rasio | Orientasi Fisik | Target Audiens |
| :--- | :--- | :--- | :--- |
| **6a. Lobby Display** | Monitor Komersial 43-Inci (Rasio 16:9) | Dinamis: Lanskap atau Potret | Pengunjung Gedung, Karyawan Umum |
| **6b. Room Display** | Monitor Komersial 43-Inci (Rasio 16:9) | Dinamis: Lanskap atau Potret | Peserta Rapat di depan pintu ruangan |
| **6c. OSH / K3 Display** | Layar Monitor PC / Laptop Standar | Terkunci: Lanskap Saja | Tim Keamanan & Ketertiban internal |

---

## 3. Matriks Responsif Orientasi Fisik (Lanskap vs Potret)

Agent AI wajib mendeteksi variasi orientasi menggunakan *state* konfigurasi (misal melalui parameter properti URL `?orientation=portrait` atau `?orientation=landscape`) dan mengubah kelas CSS Tailwind secara dinamis dengan aturan berikut:

### 3.1 Aturan Grid pada Lobby Display (Monitor 43")

* **Varian Lanskap (`landscape`)**: 
  * Membagi layar menjadi **2 Kolom Berdampingan** menggunakan kelas `grid grid-cols-12 h-screen w-full overflow-hidden`.
  * Kolom Kiri (Media Loop): `col-span-7 h-full` (Lebih lebar untuk visual video/gambar).
  * Kolom Kanan (Jadwal Hari Ini): `col-span-5 h-full border-l border-border`.
* **Varian Potret (`portrait`)**: 
  * Membagi layar menjadi **2 Baris Bertumpuk Atas-Bawah** menggunakan kelas `flex flex-col h-screen w-full overflow-hidden`.
  * Baris Atas (Media Loop): `h-[45%] w-full` (Media berada di posisi atas sejajar rata mata).
  * Baris Bawah (Jadwal Hari Ini): `h-[55%] w-full border-t border-border` (Ruang lebih panjang ke bawah untuk menampung baris jadwal lebih banyak, maksimal 10 baris tanpa scroll).

### 3.2 Aturan Grid pada Room Display (Monitor 43")

* **Varian Lanskap (`landscape`)**:
  * Saat acara aktif, bagi layar menjadi **2 Kolom Berdampingan** (`grid grid-cols-12 h-screen w-full overflow-hidden`):
    * Sisi Kiri (`col-span-8`): Detail Informasi Acara (Judul Besar, Pimpinan, Waktu).
    * Sisi Kanan (`col-span-4`): QR Code Absensi ukuran besar (`w-64 h-64` atau lebih) diposisikan di tengah kanan agar sejajar dada pengguna.
* **Varian Potret (`portrait`)**:
  * Saat acara aktif, bagi layar menjadi **3 Baris Vertikal Bertumpuk** (`flex flex-col h-screen w-full overflow-hidden`):
    * Baris Atas (`h-[15%]`): Status K3 & Nama Ruangan (Header).
    * Baris Tengah (`h-[50%]`): Detail Informasi Acara (Judul Besar, Pimpinan, Waktu).
    * Baris Bawah (`h-[35%] flex items-center justify-center`): QR Code Absensi ditempatkan di area bawah layar agar mudah dipindai dari posisi berdiri di depan pintu.

### 3.3 Aturan Grid pada OSH / K3 Display (Monitor PC/Laptop)

* **Khusus Lanskap Standar**: Karena perangkat kerasnya adalah monitor PC/Laptop, layout **wajib mengunci orientasi lanskap** menggunakan `grid grid-cols-2 gap-6 h-screen w-full p-6 overflow-hidden` untuk menampilkan tabel "Hari Ini" dan "Besok" secara berdampingan dengan proporsi seimbang (50% : 50%).

---

## 4. Persyaratan Konten Layar Antarmuka (*Screen Layout Content*)

### 4.1 Lobby Display (Spesifikasi Komponen UI)

* **Tujuan Visual**: Memberikan informasi navigasi instan dan promosi visual grup ruangan (klaster).
* **Konten Wajib**:
    1. **Media Loop Section**: Area tanpa batas (*borderless*) untuk memutar media gambar, video korporat, atau salindia PDF secara berulang.
    2. **Jadwal Acara Hari Ini Section**: Tabel informasi tanpa fitur gulir. Menampilkan daftar kolom wajib: Waktu, Nama Ruangan, Judul Acara, Pimpinan Acara.
* **Logika Agen**: Jika baris jadwal melebihi kapasitas layar (berdasarkan varian orientasi), agen harus membagi komponen menjadi *paginated state* otomatis (pergantian halaman berbasis waktu), bukan memunculkan *scrollbar*.

### 4.2 Room Display (Spesifikasi Komponen UI)

* **Tujuan Visual**: Penunjuk status ruangan tunggal yang diletakkan di sisi luar pintu ruang rapat.

* **Konten Berdasarkan Skenario Status**:
  * **Kondisi 1: Acara Sedang Berlangsung (Active Event)**:
    * Tampilkan teks Judul Acara ukuran besar (`text-3xl` hingga `text-4xl`), Nama Pimpinan, dan Jam Mulai/Selesai.
    * **QR Code Absensi**: Wajib menampilkan modul komponen QR Code yang kontras dan berukuran cukup besar agar mudah dipindai oleh ponsel peserta dari jarak 1-2 meter.
    * Warna latar belakang/aksen wajib berubah secara dinamis mengikuti status warna K3 (Hijau/Kuning/Merah) berdasarkan data tingkat bahaya/jumlah peserta dari `DESIGN.md`.
  * **Kondisi 2: Ruangan Kosong (Idle)**:
    * Layar otomatis berubah menjadi pemutar media layar penuh (*full-screen media loop*) dari pustaka media ruangan tersebut. Seluruh teks informasi rapat dan QR Code disembunyikan.

### 4.3 OSH / K3 Display (Spesifikasi Komponen UI)

* **Tujuan Visual**: Dasbor operasional terpusat bagi Tim Keamanan untuk memetakan penempatan personel dan logistik pengamanan.
* **Konten Wajib**:
  * Tampilan terdiri dari **Dua Tabel Berdampingan** (Side-by-Side):
        1.  **Tabel Kiri (Acara Hari Ini)**: Daftar seluruh acara yang berjalan hari ini (Today's Events).
        2.  **Tabel Kanan (Acara Besok)**: Daftar seluruh acara untuk esok hari (Tomorrow's Events).
  * **Kolom Wajib Tabel K3**: Nama Ruangan, Waktu Acara, Judul Rapat, Pimpinan Acara, Jumlah Peserta (`participants_count`), dan **Badge Indikator Tingkat K3** (Menggunakan komponen lencana *high-contrast* shadcn/ui dengan warna penanda dari `DESIGN.md`).

---

## 5. Parameter Gaya Global untuk Agen AI (`DESIGN.md` Interface Guide)

Agen AI wajib menggunakan referensi token berikut saat menghasilkan kode antarmuka:

* **Background Utama**: `var(--background)` (Putih bersih di mode terang / Abu gelap solid di mode gelap). Tidak boleh menggunakan gradasi yang mengganggu keterbacaan data teks.
* **Tipografi Judul Kios**: Wajib menggunakan bobot tebal ekstra `font-bold` atau `font-extrabold` dengan *tracking* ketat (`tracking-tight`).
* **Kartu Informasi**: `rounded-lg border bg-card text-card-foreground shadow-none`. Berikan jarak aman padding minimal `p-6` atau `p-8` pada monitor 43-inci untuk mencegah teks terpotong oleh bingkai luar fisikal (*bezel*) televisi.

---
