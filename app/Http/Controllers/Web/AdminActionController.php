<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Services\Monitoring\DatabaseExporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Tindakan cepat khusus admin. Aksi sensitif dilindungi konfirmasi kata sandi
 * (middleware password.confirm di rute) dan dicatat ke log aktivitas.
 */
class AdminActionController extends Controller
{
    /**
     * Bersihkan cache aplikasi, konfigurasi, rute, dan tampilan.
     */
    public function clearCache(Request $request): RedirectResponse
    {
        Artisan::call('optimize:clear');

        $this->record($request, 'system.clear_cache', 'Membersihkan cache aplikasi');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cache aplikasi dibersihkan.']);

        return back();
    }

    /**
     * Keluarkan semua pengguna lain: hapus semua sesi kecuali sesi admin ini,
     * dan ganti token "ingat saya" semua akun.
     */
    public function logoutAll(Request $request): RedirectResponse
    {
        $kept = $request->session()->getId();

        $removed = DB::table('sessions')->where('id', '!=', $kept)->delete();
        DB::table('users')->orderBy('id')->each(
            fn ($user) => DB::table('users')->where('id', $user->id)->update(['remember_token' => Str::random(60)])
        );

        $this->record($request, 'system.logout_all', "Mengeluarkan semua pengguna ({$removed} sesi dihapus)");

        Inertia::flash('toast', ['type' => 'success', 'message' => "Semua pengguna lain dikeluarkan ({$removed} sesi)."]);

        return back();
    }

    /**
     * Unduh ekspor database (berkas SQL).
     */
    public function exportDatabase(Request $request, DatabaseExporter $exporter): StreamedResponse
    {
        $this->record($request, 'system.export_database', 'Mengekspor database');

        $filename = $exporter->filename();

        return response()->streamDownload(function () use ($exporter) {
            $exporter->export(function (string $chunk) {
                echo $chunk;

                if (ob_get_level() > 0) {
                    @ob_flush();
                }

                flush();
            });
        }, $filename, [
            'Content-Type' => 'application/sql; charset=UTF-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    private function record(Request $request, string $event, string $description): void
    {
        ActivityLogger::record(
            event: $event,
            description: $description,
            userId: $request->user()->id,
            actorEmail: $request->user()->email,
        );
    }
}
