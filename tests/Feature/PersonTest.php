<?php

use App\Models\Person;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view people page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('admin.people.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/people/index'));
});

test('operator can view people page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('admin.people.index'));
    $response->assertOk();
});

test('regular user cannot view people page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.people.index'));
    $response->assertForbidden();
});

test('admin can create person', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.people.store'), [
        'name' => 'Test Leader',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('people', ['name' => 'Test Leader']);
});

test('admin can create person with photo', function () {
    Storage::fake('public');
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.people.store'), [
        'name' => 'Test Leader',
        'photo' => UploadedFile::fake()->image('photo.jpg'),
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('people', ['name' => 'Test Leader']);
    $this->assertStringContainsString('people/', Person::where('name', 'Test Leader')->first()->photo);
});

test('admin can update person', function () {
    $this->actingAs($this->admin);
    $person = Person::factory()->create();

    $response = $this->put(route('admin.people.update', $person), [
        'name' => 'Updated Name',
        'is_active' => false,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('people', ['id' => $person->id, 'name' => 'Updated Name']);
});

test('admin can delete person', function () {
    $this->actingAs($this->admin);
    $person = Person::factory()->create();

    $response = $this->delete(route('admin.people.destroy', $person));

    $response->assertRedirect();
    $this->assertDatabaseMissing('people', ['id' => $person->id]);
});

test('person validation requires name', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.people.store'), [
        'name' => '',
    ]);

    $response->assertSessionHasErrors(['name']);
});

test('people can be searched by name', function () {
    $this->actingAs($this->admin);
    Person::factory()->create(['name' => 'Budi Santoso']);
    Person::factory()->create(['name' => 'Siti Aminah']);

    $response = $this->get(route('admin.people.index', ['search' => 'Budi']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('people.data', 1));
});

test('people are paginated', function () {
    $this->actingAs($this->admin);
    Person::factory()->count(15)->create();

    $response = $this->get(route('admin.people.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('people.data', 10)
        ->where('people.last_page', 2)
    );
});

test('people per_page is configurable', function () {
    $this->actingAs($this->admin);
    Person::factory()->count(15)->create();

    $response = $this->get(route('admin.people.index', ['per_page' => 5]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('people.data', 5)
        ->where('people.last_page', 3)
    );
});

test('people can be sorted by name descending', function () {
    $this->actingAs($this->admin);
    Person::factory()->create(['name' => 'Alice']);
    Person::factory()->create(['name' => 'Zara']);
    Person::factory()->create(['name' => 'Bob']);

    $response = $this->get(route('admin.people.index', ['sort_by' => 'name', 'sort_direction' => 'desc']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('people.data.0.name', 'Zara')
        ->where('people.data.2.name', 'Alice')
    );
});

test('people sort is restricted to allowed columns', function () {
    $this->actingAs($this->admin);
    Person::factory()->count(3)->create();

    $response = $this->get(route('admin.people.index', ['sort_by' => 'id', 'sort_direction' => 'desc']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('people.data', 3));
});
