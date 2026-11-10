<?php

namespace App\Services\Monitoring;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Menjalankan dan me-restart queue worker serta Reverb dari aplikasi.
 *
 * Tidak ada jalur yang ditulis tetap: lokasi aplikasi dari base_path(), lokasi PHP CLI
 * dideteksi otomatis (atau dari PHP_CLI_PATH di .env), port dari konfigurasi Reverb.
 */
class ServiceManager
{
    public const SERVICES = ['queue', 'reverb'];

    /** Berapa detik menunggu Reverb lama berhenti sebelum membatalkan restart. */
    private const REVERB_STOP_TIMEOUT = 40;

    /** Jeda agar worker lama selesai pekerjaannya dan keluar. */
    private const QUEUE_STOP_DELAY = 8;

    /** Dapat diubah (mis. di test) tanpa menunggu 40 detik. */
    protected int $reverbStopTimeout = self::REVERB_STOP_TIMEOUT;

    private static ?string $php = null;

    public function __construct(private MonitoringService $monitoring) {}

    /**
     * Lokasi php CLI, atau null jika tidak ditemukan.
     */
    public function phpCli(): ?string
    {
        if (self::$php !== null && is_file(self::$php)) {
            return self::$php;
        }

        $exe = PHP_OS_FAMILY === 'Windows' ? 'php.exe' : 'php';
        $sep = DIRECTORY_SEPARATOR;

        $candidates = array_filter([
            config('monitoring.php_cli'),
            // Di bawah Apache, PHP_BINARY adalah httpd.exe, jadi hanya dipakai bila memang php CLI.
            in_array(strtolower(basename(PHP_BINARY)), ['php', 'php.exe'], true) ? PHP_BINARY : null,
            ($ini = php_ini_loaded_file()) ? dirname($ini).$sep.$exe : null,
            dirname(PHP_EXTENSION_DIR).$sep.$exe,
            PHP_BINDIR.$sep.$exe,
        ]);

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return self::$php = (string) (realpath($candidate) ?: $candidate);
            }
        }

        return self::$php = $this->findOnPath();
    }

    public function isRunning(string $service): bool
    {
        return match ($service) {
            'queue' => $this->monitoring->workerIsAlive(),
            'reverb' => $this->monitoring->reverbUp(),
            default => false,
        };
    }

    /**
     * Jalankan layanan yang sedang berhenti. Tidak pernah menjalankan yang kedua.
     *
     * @return array{ok: bool, message: string}
     */
    public function start(string $service): array
    {
        if (! $this->phpCli()) {
            return $this->noPhp();
        }

        if ($this->isRunning($service)) {
            return ['ok' => false, 'message' => $this->label($service).' sudah berjalan.'];
        }

        if (! $this->claim($service)) {
            return ['ok' => false, 'message' => 'Permintaan sebelumnya masih diproses. Tunggu sebentar.'];
        }

        return $this->launch(self::command($service), $service.'-service.log')
            ? ['ok' => true, 'message' => $this->label($service).' dijalankan. Status diperbarui dalam beberapa detik.']
            : ['ok' => false, 'message' => 'Gagal menjalankan '.$this->label($service).'. Lihat storage/logs.'];
    }

    /**
     * Restart: kirim tanda berhenti, lalu proses terpisah menunggu yang lama benar-benar
     * berhenti sebelum menjalankan yang baru (lihat relaunch()).
     *
     * @return array{ok: bool, message: string}
     */
    public function restart(string $service): array
    {
        if (! $this->phpCli()) {
            return $this->noPhp();
        }

        if (! $this->isRunning($service)) {
            return $this->start($service);
        }

        if (! $this->claim($service)) {
            return ['ok' => false, 'message' => 'Permintaan sebelumnya masih diproses. Tunggu sebentar.'];
        }

        try {
            $this->signalStop($service);
        } catch (Throwable $e) {
            report($e);

            return ['ok' => false, 'message' => 'Gagal mengirim tanda restart: '.$e->getMessage()];
        }

        return $this->launch(['services:relaunch', $service], 'service-control-output.log')
            ? ['ok' => true, 'message' => 'Restart '.$this->label($service).' dimulai. Butuh sekitar 10-40 detik.']
            : ['ok' => false, 'message' => 'Gagal memulai restart '.$this->label($service).'. Lihat storage/logs.'];
    }

    /**
     * Dijalankan oleh `services:relaunch` (proses terpisah): tunggu layanan lama berhenti,
     * lalu jalankan yang baru. Jika yang lama tidak mau berhenti, batalkan tanpa memaksa.
     */
    public function relaunch(string $service): bool
    {
        if ($service === 'reverb') {
            for ($i = 0; $i < $this->reverbStopTimeout && $this->monitoring->reverbUp(); $i++) {
                sleep(1);
            }

            if ($this->monitoring->reverbUp()) {
                $this->log("reverb: proses lama tidak berhenti dalam {$this->reverbStopTimeout} detik, restart dibatalkan");

                return false;
            }

            sleep(1); // beri waktu port dilepas
        } else {
            sleep(self::QUEUE_STOP_DELAY);
        }

        $ok = $this->launch(self::command($service), $service.'-service.log');
        $this->log("{$service}: ".($ok ? 'dijalankan ulang' : 'gagal dijalankan'));

        return $ok;
    }

    /**
     * Argumen artisan untuk menjalankan layanan.
     *
     * @return array<int, string>
     */
    public static function command(string $service): array
    {
        if ($service === 'queue') {
            return ['queue:work', '--tries=3', '--timeout=90'];
        }

        $host = (string) config('reverb.servers.reverb.host', '0.0.0.0');
        $port = (int) config('reverb.servers.reverb.port', 8080);

        return ['reverb:start', '--host='.(preg_match('/^[\w.:\-]+$/', $host) ? $host : '0.0.0.0'), '--port='.$port];
    }

    /**
     * Buka `php artisan ...` sebagai proses terpisah yang tetap hidup setelah request selesai.
     *
     * @param  array<int, string>  $artisanArgs
     */
    protected function launch(array $artisanArgs, string $logFile): bool
    {
        $php = $this->phpCli();

        if (! $php) {
            return false;
        }

        $base = base_path();
        $log = storage_path('logs'.DIRECTORY_SEPARATOR.$logFile);
        $args = implode(' ', $artisanArgs);

        if (PHP_OS_FAMILY === 'Windows') {
            // Lewat berkas .bat kecil agar tanda kutip jalur (spasi) tidak berantakan.
            $bat = storage_path('framework'.DIRECTORY_SEPARATOR.'service-'.md5($args).'.bat');
            file_put_contents($bat, "@echo off\r\ncd /d \"{$base}\"\r\n\"{$php}\" artisan {$args} >> \"{$log}\" 2>&1\r\n");

            $handle = popen('start "" /B cmd /c ""'.$bat.'""', 'r');

            if ($handle === false) {
                return false;
            }

            pclose($handle);

            return true;
        }

        exec(sprintf(
            'cd %s && nohup %s artisan %s >> %s 2>&1 &',
            escapeshellarg($base),
            escapeshellarg($php),
            $args,
            escapeshellarg($log),
        ));

        return true;
    }

    /**
     * Minta proses lama berhenti dengan rapi. Reverb tidak bisa lewat perintah `reverb:restart`
     * karena perintah itu hanya terdaftar di konsol, bukan di request web; jadi kunci
     * yang sama ditulis langsung (itu persis yang dilakukan perintahnya).
     */
    protected function signalStop(string $service): void
    {
        if ($service === 'queue') {
            Artisan::call('queue:restart');

            return;
        }

        Cache::forever('laravel:reverb:restart', now()->getTimestamp());
    }

    /**
     * Cegah klik ganda. Worker butuh waktu lebih lama sebelum status "berjalan" terlihat lagi
     * karena menunggu detak jantung pertamanya.
     */
    private function claim(string $service): bool
    {
        return Cache::lock('service-control.'.$service, $service === 'queue' ? 150 : 60)->get() !== false;
    }

    private function findOnPath(): ?string
    {
        if (! function_exists('shell_exec')) {
            return null;
        }

        $out = @shell_exec(PHP_OS_FAMILY === 'Windows' ? 'where php 2>NUL' : 'command -v php 2>/dev/null');
        $first = trim(strtok((string) $out, "\r\n") ?: '');

        return $first !== '' && is_file($first) ? $first : null;
    }

    private function label(string $service): string
    {
        return $service === 'queue' ? 'Pekerja latar belakang' : 'Server WebSocket';
    }

    /**
     * @return array{ok: bool, message: string}
     */
    private function noPhp(): array
    {
        return ['ok' => false, 'message' => 'PHP tidak ditemukan. Isi PHP_CLI_PATH di berkas .env dengan lokasi php.exe, lalu coba lagi.'];
    }

    protected function log(string $line): void
    {
        @file_put_contents(storage_path('logs'.DIRECTORY_SEPARATOR.'service-control.log'), '['.now()->toDateTimeString().'] '.$line.PHP_EOL, FILE_APPEND);
    }
}
