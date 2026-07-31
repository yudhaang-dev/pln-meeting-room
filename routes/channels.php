<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Broadcast::channel('App.Models.Booking', function () {
//     return true;
// });

// Broadcast::channel('App.Models.Room.{id}', function () {
//     return true;
// });

// Broadcast::channel('App.Models.RoomGroup.{id}', function () {
//     return true;
// });
