<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Lokasi PHP CLI
    |--------------------------------------------------------------------------
    |
    | Dipakai tombol Jalankan/Restart layanan di halaman monitoring untuk membuka
    | queue worker dan Reverb. Biarkan kosong agar dideteksi otomatis; isi hanya
    | jika deteksi gagal, mis. PHP_CLI_PATH="C:\laragon\bin\php\php-8.4\php.exe".
    |
    */

    'php_cli' => env('PHP_CLI_PATH'),

];
