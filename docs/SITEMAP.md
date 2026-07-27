# Site Map & Routes

## Guest & Public Visitor

### Pages
* `/` = HomeController → Home page
* `/login` = Laravel Fortify login page
* `/display/lobby/{roomGroup}` = DisplayController@lobby → Lobby display page
* `/display/room/{room}` = DisplayController@room → Room display page
* `/display/osh` = DisplayController@osh → OSH display page

### Public API / support endpoints
* `/.well-known/passkey-endpoints` = well-known.passkeys
* `/passkeys/login` = passkey.login
* `/passkeys/login/options` = passkey.login-options
* `/passkeys/confirm` = passkey.confirm
* `/passkeys/confirm/options` = passkey.confirm-options
* `/user/passkeys` = passkey.store
* `/user/passkeys/options` = passkey.registration-options
* `/user/passkeys/{passkey}` = passkey.destroy
* `/user/confirm-password` = password.confirm
* `/user/confirmed-password-status` = password.confirmation

## Authenticated User

### Pages
* `/dashboard` = DashboardController → Main app dashboard
* `/bookings` = BookingController@index → Booking list
* `/bookings/create` = BookingController@create → New booking form
* `/bookings/{booking}` = BookingController@show → Booking details
* `/notifications` = NotificationController@index → Notifications list

### Actions
* `POST /bookings` = BookingController@store
* `POST /bookings/{booking}/cancel` = BookingController@cancel
* `POST /notifications/{notificationId}/read` = NotificationController@markAsRead
* `POST /notifications/read-all` = NotificationController@markAllAsRead
* `GET /notifications/unread-count` = NotificationController@unreadCount

## Settings

* `/settings` redirects to `/settings/profile`
* `/settings/profile` = Settings\ProfileController@edit → Profile settings
* `PATCH /settings/profile` = Settings\ProfileController@update
* `DELETE /settings/profile` = Settings\ProfileController@destroy
* `/settings/security` = Settings\SecurityController@edit → Security / passkey management
* `PUT /settings/password` = Settings\SecurityController@update
* `/settings/appearance` = Inertia page `settings/appearance`

## Admin / Operator

### Pages
* `/admin/dashboard` = Admin\DashboardController → Admin dashboard
* `/admin/settings` = Admin\GeneralSettingController@edit → General settings
* `/admin/settings/profile` = Admin\Settings\ProfileController@edit
* `/admin/settings/security` = Admin\Settings\SecurityController@edit
* `/admin/settings/appearance` = Admin\Settings\AppearanceController@edit
* `/admin/people` = Admin\PersonController index/create/update/destroy
* `/admin/osh-levels` = Admin\OshLevelController index/store/update/destroy
* `/admin/buildings` = Admin\BuildingController index/store/update/destroy
* `/admin/rooms` = Admin\RoomController index/store/update/destroy
* `/admin/room-groups` = Admin\RoomGroupController index/store/update/destroy
* `/admin/bookings` = Admin\BookingController index/store/update/destroy
* `/admin/users` = Admin\UserController index/store/update/destroy (admin-only)

### Media endpoints
* `POST /admin/media/chunk` = Admin\MediaController@chunk
* `POST /admin/media/assemble` = Admin\MediaController@assemble
* `/admin/rooms/{room}/media` = Admin\RoomController@media / store / reorder / toggle-active / destroy
* `/admin/room-groups/{roomGroup}/media` = Admin\RoomGroupController@media / storeFromGrouping / reorder / toggle-active / destroy

## Notes
* `AppLayout` is used for authenticated app pages.
* `AuthLayout` is used for login/passkey auth flows.
* `Display Layout` is used for `display/*` routes.
* Admin routes are currently prefixed with `/admin/*` and guarded by `auth` + `role:admin,operator`.
* Settings routes are under `/settings/*` and require authentication. Security and appearance pages require verified users.
