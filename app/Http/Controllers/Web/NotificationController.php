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

    public function show(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function destroy(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $request->user()
            ->notifications()
            ->where('id', $id)
            ->delete();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

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

    public function markAsRead(Request $request, string $notification): RedirectResponse|JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->firstOrFail();

        $notification->markAsRead();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllAsRead(Request $request): RedirectResponse|JsonResponse
    {
        $request->user()->unreadNotifications()->update([
            'read_at' => now(),
        ]);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json([
            'count' => 0,
        ]);
    }

    public function clearAll(Request $request): RedirectResponse|JsonResponse
    {
        $request->user()->notifications()->delete();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json([
            'count' => 0,
        ]);
    }
}
