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
    $this->grouping = RoomGroup::factory()->create(['building_id' => $this->building->id]);
});

test('admin can view rooms page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('admin.rooms.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/rooms/index'));
});

test('operator can view rooms page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('admin.rooms.index'));
    $response->assertOk();
});

test('regular user cannot view rooms page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.rooms.index'));
    $response->assertForbidden();
});

test('admin can create room', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.rooms.store'), [
        'name' => 'New Room',
        'capacity' => 20,
        'building_id' => $this->building->id,
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('rooms', ['name' => 'New Room']);
});

test('admin can update room', function () {
    $this->actingAs($this->admin);
    $room = Room::factory()->create();

    $response = $this->put(route('admin.rooms.update', $room), [
        'name' => 'Updated Room',
        'capacity' => 50,
        'building_id' => $this->building->id,
        'is_active' => false,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('rooms', [
        'id' => $room->id,
        'name' => 'Updated Room',
        'capacity' => 50,
        'building_id' => $this->building->id,
        'is_active' => false,
    ]);
});

test('admin can delete room', function () {
    $this->actingAs($this->admin);
    $room = Room::factory()->create();

    $response = $this->delete(route('admin.rooms.destroy', $room));

    $response->assertRedirect();
    $this->assertDatabaseMissing('rooms', ['id' => $room->id]);
});

test('room search filters results', function () {
    $this->actingAs($this->admin);
    Room::factory()->create(['name' => 'Alpha Room']);
    Room::factory()->create(['name' => 'Beta Room']);

    $response = $this->get(route('admin.rooms.index', ['search' => 'Alpha']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('rooms.data', 1));
});

test('room pagination works', function () {
    $this->actingAs($this->admin);
    Room::factory()->count(15)->create();

    $response = $this->get(route('admin.rooms.index', ['per_page' => 5]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('rooms.data', 5)
        ->where('rooms.last_page', 3)
    );
});

test('room sort by name works', function () {
    $this->actingAs($this->admin);
    Room::factory()->create(['name' => 'Zebra']);
    Room::factory()->create(['name' => 'Alpha']);

    $response = $this->get(route('admin.rooms.index', ['sort_by' => 'name', 'sort_direction' => 'asc']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('rooms.data', 2));
});

test('room validation requires name', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.rooms.store'), [
        'name' => '',
        'capacity' => 10,
        'building_id' => $this->building->id,
    ]);

    $response->assertSessionHasErrors('name');
});

test('room validation requires capacity', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.rooms.store'), [
        'name' => 'Test',
        'capacity' => '',
        'building_id' => $this->building->id,
    ]);

    $response->assertSessionHasErrors('capacity');
});

test('room validation requires building_id', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.rooms.store'), [
        'name' => 'Test',
        'capacity' => 10,
        'building_id' => '',
    ]);

    $response->assertSessionHasErrors('building_id');
});

test('room many-to-many managed from room grouping', function () {
    $this->actingAs($this->admin);
    $room = Room::factory()->create();

    $this->put(route('admin.room-groups.update', $this->grouping), [
        'building_id' => $this->building->id,
        'name' => $this->grouping->name,
        'is_active' => true,
        'room_ids' => [$room->id],
    ]);

    $this->assertDatabaseHas('room_room_group', [
        'room_id' => $room->id,
        'room_group_id' => $this->grouping->id,
    ]);
});
