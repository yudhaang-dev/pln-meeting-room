<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Menampilkan halaman daftar semua notifikasi.
     */
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Menandai satu notifikasi sebagai selesai dibaca.
     */
    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->firstOrFail();

        $notification->markAsRead();

        // Mengembalikan back() agar Inertia me-refresh properti global secara otomatis
        return back();
    }

    /**
     * Menandai seluruh notifikasi user sebagai selesai dibaca.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update([
            'read_at' => now(),
        ]);

        return back();
    }

    /**
     * Menghapus satu data notifikasi.
     */
    public function destroy(Request $request, string $id): RedirectResponse
    {
        $request->user()
            ->notifications()
            ->where('id', $id)
            ->delete();

        return back();
    }

    /**
     * Menghapus seluruh riwayat notifikasi user.
     */
    public function clearAll(Request $request): RedirectResponse
    {
        $request->user()->notifications()->delete();

        return back();
    }

    /**
     * PENTING: Dua method di bawah ini tetap mengembalikan JsonResponse
     * karena sifatnya asinkronus (untuk backend fetching/polling/Echo listener di React)
     */
    public function recent(Request $request)
    {
        $notifications = $request->user()
            ->unreadNotifications()
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'data' => $n->data,
                'created_at' => $n->created_at->toISOString(),
            ]);

        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
            'notifications' => $notifications,
        ]);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }
}
