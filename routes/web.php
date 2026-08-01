<?php

use App\Http\Controllers\Web;
use Illuminate\Support\Facades\Route;

Route::get('/', Web\HomeController::class)->name('home');
Route::get('/display', [Web\DisplayController::class, 'index'])->name('display.index');
Route::get('/display/lobby/{roomGroup}', [Web\DisplayController::class, 'lobby'])->name('display.lobby');
Route::get('/display/room/{room}', [Web\DisplayController::class, 'room'])->name('display.room');
Route::get('/display/osh', [Web\DisplayController::class, 'osh'])->name('display.osh');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('osh-levels', Web\OshLevelController::class)->except(['create', 'show', 'edit']);
    Route::post('osh-levels/reorder', [Web\OshLevelController::class, 'reorder'])->name('osh-levels.reorder');

    Route::resource('people', Web\PersonController::class)->except(['create', 'show', 'edit']);
    Route::resource('buildings', Web\BuildingController::class)->except(['create', 'show', 'edit']);
    Route::resource('rooms', Web\RoomController::class)->except(['create', 'show', 'edit']);
    Route::resource('room-groups', Web\RoomGroupController::class)->except(['create', 'show', 'edit']);

    Route::get('rooms/{room}/media', [Web\RoomController::class, 'media'])->name('rooms.media');
    Route::post('rooms/{room}/media', [Web\MediaController::class, 'store'])->name('rooms.media.store');
    Route::post('rooms/{room}/media/reorder', [Web\MediaController::class, 'reorder'])->name('rooms.media.reorder');
    Route::post('rooms/{room}/media/bulk-delete', [Web\MediaController::class, 'bulkDelete'])->name('rooms.media.bulkDelete');
    Route::put('rooms/{room}/media/{media}/toggle-active', [Web\MediaController::class, 'toggleActive'])->name('rooms.media.toggleActive');
    Route::delete('rooms/{room}/media/{media}', [Web\MediaController::class, 'destroy'])->name('rooms.media.destroy');

    Route::get('room-groups/{roomGroup}/media', [Web\RoomGroupController::class, 'media'])->name('room-groups.media');
    Route::post('room-groups/{roomGroup}/media', [Web\MediaController::class, 'storeFromGrouping'])->name('room-groups.media.store');
    Route::post('room-groups/{roomGroup}/media/reorder', [Web\MediaController::class, 'reorder'])->name('room-groups.media.reorder');
    Route::post('room-groups/{roomGroup}/media/bulk-delete', [Web\MediaController::class, 'bulkDeleteFromGrouping'])->name('room-groups.media.bulkDelete');
    Route::put('room-groups/{roomGroup}/media/{media}/toggle-active', [Web\MediaController::class, 'toggleActive'])->name('room-groups.media.toggleActive');
    Route::delete('room-groups/{roomGroup}/media/{media}', [Web\MediaController::class, 'destroy'])->name('room-groups.media.destroy');

    Route::post('media/chunk', [Web\MediaController::class, 'chunk'])->name('media.chunk');
    Route::post('media/assemble', [Web\MediaController::class, 'assemble'])->name('media.assemble');

    Route::resource('bookings', Web\BookingController::class)->except(['create', 'edit']);
    Route::post('/bookings/{booking}/status/reject', [Web\BookingController::class, 'reject'])->name('bookings.reject');
    Route::post('/bookings/{booking}/status/approve', [Web\BookingController::class, 'approve'])->name('bookings.approve');

    Route::get('/notifications/unread-count', [Web\NotificationController::class, 'unreadCount'])->name('notifications.unreadCount');
    Route::get('/notifications/recent', [Web\NotificationController::class, 'recent'])->name('notifications.recent');
    Route::post('/notifications/mark-all-as-read', [Web\NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
    Route::patch('/notifications/clear', [Web\NotificationController::class, 'clearAll'])->name('notifications.clear');
    Route::post('/notifications/{notification}/read', [Web\NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::resource('notifications', Web\NotificationController::class)->only(['index', 'destroy']);

    Route::middleware('role:admin')->group(function () {
        Route::resource('users', Web\UserController::class)->except(['create', 'show', 'edit']);
        Route::get('admin/monitoring', Web\MonitoringController::class)->name('admin.monitoring');
        Route::post('admin/monitoring/queue/clear', [Web\MonitoringController::class, 'clearQueue'])->name('admin.monitoring.queue.clear');
        Route::post('admin/monitoring/failed/retry', [Web\MonitoringController::class, 'retryFailed'])->name('admin.monitoring.failed.retry');
        Route::post('admin/monitoring/failed/clear', [Web\MonitoringController::class, 'flushFailed'])->name('admin.monitoring.failed.clear');
        Route::post('admin/monitoring/worker/stop', [Web\MonitoringController::class, 'stopWorker'])->name('admin.monitoring.worker.stop');
        Route::post('admin/monitoring/worker/start', [Web\MonitoringController::class, 'startWorker'])->name('admin.monitoring.worker.start');
        Route::post('admin/monitoring/reverb/start', [Web\MonitoringController::class, 'startReverb'])->name('admin.monitoring.reverb.start');
        Route::post('admin/monitoring/reverb/stop', [Web\MonitoringController::class, 'stopReverb'])->name('admin.monitoring.reverb.stop');
    });

    Route::get('/dashboard', Web\DashboardController::class)->name('dashboard');

    Route::redirect('settings', '/settings/account/profile');
    Route::prefix('settings/account')->name('settings.account.')->group(function () {
        Route::get('/profile', [Web\Settings\ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [Web\Settings\ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [Web\Settings\ProfileController::class, 'destroy'])->name('profile.destroy');
        Route::get('/security', [Web\Settings\SecurityController::class, 'edit'])->name('security.edit');
        Route::put('/security/password', [Web\Settings\SecurityController::class, 'update'])
            ->middleware('throttle:6,1')
            ->name('security.password.update');

        Route::get('/appearance', [Web\Settings\AppearanceController::class, 'edit'])
            ->name('appearance.edit');
    });

    Route::prefix('settings/systems')->name('settings.systems.')->middleware('role:admin,operator')->group(function () {
        Route::get('/general', [Web\Settings\GeneralController::class, 'edit'])->name('general.edit');
        Route::put('/general', [Web\Settings\GeneralController::class, 'update'])->name('general.update');
    });
});
