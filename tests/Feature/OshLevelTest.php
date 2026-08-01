<?php

use App\Models\OshLevel;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

test('determineForParticipants returns correct level', function () {
    $low = OshLevel::factory()->create(['min_participants' => 1, 'max_participants' => 20, 'sort_order' => 1]);
    $mid = OshLevel::factory()->create(['min_participants' => 21, 'max_participants' => 50, 'sort_order' => 2]);
    $high = OshLevel::factory()->create(['min_participants' => 51, 'max_participants' => 9999, 'sort_order' => 3]);

    $this->assertEquals($low->id, OshLevel::determineForParticipants(10)->id);
    $this->assertEquals($mid->id, OshLevel::determineForParticipants(35)->id);
    $this->assertEquals($high->id, OshLevel::determineForParticipants(100)->id);
    $this->assertNull(OshLevel::determineForParticipants(0));
});
