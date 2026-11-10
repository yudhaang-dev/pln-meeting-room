<?php

use App\Http\Controllers\Web;
use Illuminate\Support\Facades\Route;

Route::get('/display', [Web\DisplayController::class, 'index'])->name('display.index');
Route::get('/display/lobby/{roomGroup}', [Web\DisplayController::class, 'lobby'])->name('display.lobby');
Route::get('/display/room/{room}', [Web\DisplayController::class, 'room'])->name('display.room');
Route::get('/display/osh', [Web\DisplayController::class, 'osh'])->name('display.osh');
Route::get('/display/infografis', [Web\DisplayController::class, 'infografis'])->name('display.infografis');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', Web\DashboardController::class)->name('home');

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

    Route::get('infografis', [Web\MediaController::class, 'indexGlobal'])->name('infografis.index');
    Route::post('infografis', [Web\MediaController::class, 'storeGlobal'])->name('infografis.store');
    Route::post('infografis/reorder', [Web\MediaController::class, 'reorder'])->name('infografis.reorder');
    Route::post('infografis/bulk-delete', [Web\MediaController::class, 'bulkDeleteGlobal'])->name('infografis.bulkDelete');
    Route::put('infografis/{media}/toggle-active', [Web\MediaController::class, 'toggleActiveGlobal'])->name('infografis.toggleActive');
    Route::delete('infografis/{media}', [Web\MediaController::class, 'destroyGlobal'])->name('infografis.destroy');

    Route::get('schedule', [Web\ScheduleController::class, 'index'])->name('schedule.index');
    Route::get('meeting-rooms', [Web\MeetingRoomController::class, 'index'])->name('meeting-rooms.index');
    Route::get('meeting-rooms/{room}', [Web\MeetingRoomController::class, 'show'])->name('meeting-rooms.show');

    Route::get('bookings/availability', Web\BookingAvailabilityController::class)->name('bookings.availability');
    Route::resource('bookings', Web\BookingController::class)->except(['create', 'edit']);
    Route::post('/bookings/{booking}/status/reject', [Web\BookingController::class, 'reject'])->name('bookings.reject');
    Route::post('/bookings/{booking}/finish', [Web\BookingController::class, 'finish'])->name('bookings.finish');
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
        Route::get('admin/activity', Web\ActivityLogController::class)->name('admin.activity');

        Route::post('admin/services/{service}/start', [Web\ServiceControlController::class, 'start'])
            ->whereIn('service', ['queue', 'reverb'])->name('admin.services.start');
        Route::post('admin/services/{service}/restart', [Web\ServiceControlController::class, 'restart'])
            ->whereIn('service', ['queue', 'reverb'])->name('admin.services.restart');

        Route::post('admin/actions/clear-cache', [Web\AdminActionController::class, 'clearCache'])->name('admin.actions.clearCache');
        Route::middleware('password.confirm')->group(function () {
            Route::post('admin/actions/logout-all', [Web\AdminActionController::class, 'logoutAll'])->name('admin.actions.logoutAll');
            Route::get('admin/export-database', [Web\AdminActionController::class, 'exportDatabase'])->name('admin.exportDatabase');
        });
    });

    Route::get('/dashboard', Web\DashboardController::class)->name('dashboard');
    Route::middleware('role:admin,operator')->group(function () {
        Route::put('/dashboard/layout', [Web\DashboardLayoutController::class, 'update'])->name('dashboard.layout.update');
        Route::delete('/dashboard/layout', [Web\DashboardLayoutController::class, 'destroy'])->name('dashboard.layout.destroy');
    });

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

        Route::get('/notification', [Web\Settings\NotificationPreferenceController::class, 'edit'])
            ->name('notification.edit');
        Route::put('/notification', [Web\Settings\NotificationPreferenceController::class, 'update'])
            ->name('notification.update');
    });

    Route::prefix('settings/systems')->name('settings.systems.')->middleware('role:admin,operator')->group(function () {
        Route::get('/general', [Web\Settings\GeneralController::class, 'edit'])->name('general.edit');
        Route::put('/general', [Web\Settings\GeneralController::class, 'update'])->name('general.update');
    });
});
