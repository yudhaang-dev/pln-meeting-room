<?php

use App\Models\Building;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view buildings page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('admin.buildings.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/buildings/index'));
});

test('operator can view buildings page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('admin.buildings.index'));
    $response->assertOk();
});

test('regular user cannot view buildings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.buildings.index'));
    $response->assertForbidden();
});

test('admin can create building', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.buildings.store'), [
        'name' => 'New Building',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('buildings', ['name' => 'New Building']);
});

test('admin can update building', function () {
    $this->actingAs($this->admin);
    $building = Building::factory()->create();

    $response = $this->put(route('admin.buildings.update', $building), [
        'name' => 'Updated Building',
        'is_active' => false,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('buildings', [
        'id' => $building->id,
        'name' => 'Updated Building',
        'is_active' => false,
    ]);
});

test('admin can delete building', function () {
    $this->actingAs($this->admin);
    $building = Building::factory()->create();

    $response = $this->delete(route('admin.buildings.destroy', $building));

    $response->assertRedirect();
    $this->assertDatabaseMissing('buildings', ['id' => $building->id]);
});

test('building search filters results', function () {
    $this->actingAs($this->admin);
    Building::factory()->create(['name' => 'Alpha Tower']);
    Building::factory()->create(['name' => 'Beta Center']);

    $response = $this->get(route('admin.buildings.index', ['search' => 'Alpha']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('buildings.data', 1));
});

test('building pagination works', function () {
    $this->actingAs($this->admin);
    Building::factory()->count(15)->create();

    $response = $this->get(route('admin.buildings.index', ['per_page' => 5]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('buildings.data', 5)
        ->where('buildings.last_page', 3)
    );
});

test('building sort by name works', function () {
    $this->actingAs($this->admin);
    Building::factory()->create(['name' => 'Zebra']);
    Building::factory()->create(['name' => 'Alpha']);

    $response = $this->get(route('admin.buildings.index', ['sort_by' => 'name', 'sort_direction' => 'asc']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('buildings.data', 2));
});

test('building validation requires name', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.buildings.store'), [
        'name' => '',
    ]);

    $response->assertSessionHasErrors('name');
});
