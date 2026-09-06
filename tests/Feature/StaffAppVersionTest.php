<?php

declare(strict_types=1);

test('staff app version endpoint returns latest version and APK download url', function (): void {
    $response = $this->getJson('/api/v1/staff/app-version');

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'success',
            'data' => [
                'latest_version',
                'min_required_version',
                'apk_url',
                'release_notes',
                'published_at',
            ],
            'message',
        ]);

    $data = $response->json('data');
    expect($data['latest_version'])->not->toBeEmpty()
        ->and($data['apk_url'])->toContain('.apk');
});
