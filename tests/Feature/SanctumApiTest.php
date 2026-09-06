<?php

declare(strict_types=1);

use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('unauthenticated user cannot access protected api user endpoint', function () {
    $response = $this->getJson('/api/user');

    $response->assertUnauthorized();
});

test('authenticated user can access protected api user endpoint', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user, ['*']);

    $response = $this->getJson('/api/user');

    $response->assertOk()
        ->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
});
