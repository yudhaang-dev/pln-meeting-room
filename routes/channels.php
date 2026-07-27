<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('room.{roomId}', function () {
    return true;
});

Broadcast::channel('room-group.{roomGroupId}', function () {
    return true;
});

Broadcast::channel('bookings', function () {
    return true;
});
