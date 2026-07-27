<?php

use App\Models\Building;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
    $this->building = Building::factory()->create();
});

test('admin can view room groups page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('admin.room-groups.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/room-groups/index'));
});

test('operator can view room groups page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('admin.room-groups.index'));
    $response->assertOk();
});

test('regular user cannot view room groups page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.room-groups.index'));
    $response->assertForbidden();
});

test('admin can create room group', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.room-groups.store'), [
        'building_id' => $this->building->id,
        'name' => 'East Wing',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('room_groups', ['name' => 'East Wing']);
});

test('admin can update room group', function () {
    $this->actingAs($this->admin);
    $grouping = RoomGroup::factory()->create(['building_id' => $this->building->id]);

    $response = $this->put(route('admin.room-groups.update', $grouping), [
        'building_id' => $this->building->id,
        'name' => 'Updated Grouping',
        'is_active' => false,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('room_groups', [
        'id' => $grouping->id,
        'name' => 'Updated Grouping',
        'is_active' => false,
    ]);
});

test('admin can delete room group', function () {
    $this->actingAs($this->admin);
    $grouping = RoomGroup::factory()->create(['building_id' => $this->building->id]);

    $response = $this->delete(route('admin.room-groups.destroy', $grouping));

    $response->assertRedirect();
    $this->assertDatabaseMissing('room_groups', ['id' => $grouping->id]);
});

test('room group search filters results', function () {
    $this->actingAs($this->admin);
    RoomGroup::factory()->create(['building_id' => $this->building->id, 'name' => 'Alpha Wing']);
    RoomGroup::factory()->create(['building_id' => $this->building->id, 'name' => 'Beta Wing']);

    $response = $this->get(route('admin.room-groups.index', ['search' => 'Alpha']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('roomGroups.data', 1));
});

test('room group pagination works', function () {
    $this->actingAs($this->admin);
    RoomGroup::factory()->count(15)->create(['building_id' => $this->building->id]);

    $response = $this->get(route('admin.room-groups.index', ['per_page' => 5]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('roomGroups.data', 5)
        ->where('roomGroups.last_page', 3)
    );
});

test('room group sort by name works', function () {
    $this->actingAs($this->admin);
    RoomGroup::factory()->create(['building_id' => $this->building->id, 'name' => 'Zebra']);
    RoomGroup::factory()->create(['building_id' => $this->building->id, 'name' => 'Alpha']);

    $response = $this->get(route('admin.room-groups.index', ['sort_by' => 'name', 'sort_direction' => 'asc']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('roomGroups.data', 2));
});

test('room group validation requires building_id', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.room-groups.store'), [
        'building_id' => '',
        'name' => 'Test',
    ]);

    $response->assertSessionHasErrors('building_id');
});

test('room group validation requires name', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.room-groups.store'), [
        'building_id' => $this->building->id,
        'name' => '',
    ]);

    $response->assertSessionHasErrors('name');
});

test('admin can sync rooms to room group', function () {
    $this->actingAs($this->admin);
    $grouping = RoomGroup::factory()->create(['building_id' => $this->building->id]);
    $room = Room::factory()->create();

    $response = $this->put(route('admin.room-groups.update', $grouping), [
        'building_id' => $this->building->id,
        'name' => $grouping->name,
        'is_active' => true,
        'room_ids' => [$room->id],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('room_room_group', [
        'room_id' => $room->id,
        'room_group_id' => $grouping->id,
    ]);
});

test('room group validation requires valid room_ids', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.room-groups.store'), [
        'building_id' => $this->building->id,
        'name' => 'Test',
        'room_ids' => [9999],
    ]);

    $response->assertSessionHasErrors('room_ids.0');
});
