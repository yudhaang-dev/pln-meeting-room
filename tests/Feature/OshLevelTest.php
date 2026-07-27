<?php

use App\Models\OshLevel;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view osh levels page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('admin.osh-levels.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/osh-levels/index'));
});

test('operator can view osh levels page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('admin.osh-levels.index'));
    $response->assertOk();
});

test('regular user cannot view osh levels page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.osh-levels.index'));
    $response->assertForbidden();
});

test('admin can create osh level', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.osh-levels.store'), [
        'name' => 'critical',
        'color' => '#ff0000',
        'min_participants' => 100,
        'max_participants' => 500,
        'sort_order' => 4,
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('osh_levels', ['name' => 'critical']);
});

test('admin can update osh level', function () {
    $this->actingAs($this->admin);
    $oshLevel = OshLevel::factory()->create();

    $response = $this->put(route('admin.osh-levels.update', $oshLevel), [
        'name' => 'updated',
        'color' => '#00ff00',
        'min_participants' => 1,
        'max_participants' => 50,
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('osh_levels', ['id' => $oshLevel->id, 'name' => 'updated']);
});

test('admin can delete osh level', function () {
    $this->actingAs($this->admin);
    $oshLevel = OshLevel::factory()->create();

    $response = $this->delete(route('admin.osh-levels.destroy', $oshLevel));

    $response->assertRedirect();
    $this->assertDatabaseMissing('osh_levels', ['id' => $oshLevel->id]);
});

test('osh level validation requires valid color hex', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.osh-levels.store'), [
        'name' => 'test',
        'color' => 'not-a-color',
        'min_participants' => 1,
        'max_participants' => 10,
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $response->assertSessionHasErrors(['color']);
});

test('osh level validation requires max_participants >= min_participants', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.osh-levels.store'), [
        'name' => 'test',
        'color' => '#ff0000',
        'min_participants' => 50,
        'max_participants' => 10,
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $response->assertSessionHasErrors(['max_participants']);
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

test('admin can reorder osh levels', function () {
    $this->actingAs($this->admin);
    $a = OshLevel::factory()->create(['sort_order' => 1]);
    $b = OshLevel::factory()->create(['sort_order' => 2]);

    $response = $this->post(route('admin.osh-levels.reorder'), [
        'order' => [$b->id, $a->id],
    ]);

    $response->assertRedirect();
    $this->assertEquals(2, $a->fresh()->sort_order);
    $this->assertEquals(1, $b->fresh()->sort_order);
});

test('osh levels can be searched by name', function () {
    $this->actingAs($this->admin);
    OshLevel::factory()->create(['name' => 'low']);
    OshLevel::factory()->create(['name' => 'high']);

    $response = $this->get(route('admin.osh-levels.index', ['search' => 'low']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('oshLevels.data', 1));
});

test('osh levels are paginated', function () {
    $this->actingAs($this->admin);
    OshLevel::factory()->count(15)->create();

    $response = $this->get(route('admin.osh-levels.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('oshLevels.data', 10)
        ->where('oshLevels.last_page', 2)
    );
});

test('osh levels per_page is configurable', function () {
    $this->actingAs($this->admin);
    OshLevel::factory()->count(15)->create();

    $response = $this->get(route('admin.osh-levels.index', ['per_page' => 5]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('oshLevels.data', 5)
        ->where('oshLevels.last_page', 3)
    );
});

test('osh levels can be sorted by name descending', function () {
    $this->actingAs($this->admin);
    OshLevel::factory()->create(['name' => 'alpha', 'sort_order' => 1]);
    OshLevel::factory()->create(['name' => 'zulu', 'sort_order' => 2]);
    OshLevel::factory()->create(['name' => 'mike', 'sort_order' => 3]);

    $response = $this->get(route('admin.osh-levels.index', ['sort_by' => 'name', 'sort_direction' => 'desc']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('oshLevels.data.0.name', 'zulu')
        ->where('oshLevels.data.2.name', 'alpha')
    );
});

test('osh levels sort is restricted to allowed columns', function () {
    $this->actingAs($this->admin);
    OshLevel::factory()->count(3)->create();

    $response = $this->get(route('admin.osh-levels.index', ['sort_by' => 'id', 'sort_direction' => 'desc']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('oshLevels.data', 3));
});
