<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
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
        return $this->catchErrors(function () use ($request, $notification) {
            $notification = $request->user()
                ->notifications()
                ->where('id', $notification)
                ->firstOrFail();

            $notification->markAsRead();

            return back();
        }, __('Failed to mark notification as read.'));
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        return $this->catchErrors(function () use ($request) {
            $request->user()->unreadNotifications()->update([
                'read_at' => now(),
            ]);

            return back();
        }, __('Failed to mark notifications as read.'));
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        return $this->catchErrors(function () use ($request, $id) {
            $request->user()
                ->notifications()
                ->where('id', $id)
                ->delete();

            return back();
        }, __('Failed to delete notification.'));
    }

    public function clearAll(Request $request): RedirectResponse
    {
        return $this->catchErrors(function () use ($request) {
            $request->user()->notifications()->delete();

            return back();
        }, __('Failed to clear notifications.'));
    }

    /**
     * PENTING: Dua method di bawah ini tetap mengembalikan JsonResponse
     * karena sifatnya asinkronus (untuk backend fetching/polling/Echo listener di React)
     */
    public function recent(Request $request): JsonResponse
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

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }
}
