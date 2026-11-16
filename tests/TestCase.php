<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Set the currently logged in user for the application.
     *
     * @param  \Illuminate\Contracts\Auth\Authenticatable  $user
     * @param  string|null  $guard
     * @return $this
     */
    public function actingAs($user, $guard = null)
    {
        if (method_exists($user, 'withAccessToken') && ! $user->currentAccessToken()) {
            $abilities = method_exists($user, 'tokenAbilities') ? $user->tokenAbilities() : [];
            $token = \Mockery::mock(\Laravel\Sanctum\PersonalAccessToken::class)->shouldIgnoreMissing(false);
            foreach ($abilities as $ability) {
                $token->shouldReceive('can')->with($ability)->andReturn(true);
            }
            $token->shouldReceive('can')->withAnyArgs()->andReturnUsing(fn ($a) => in_array($a, $abilities, true));
            $token->abilities = $abilities;
            $user->withAccessToken($token);
        }

        if ($guard === null && method_exists($user, 'isStaffOrAdmin') && $user->isStaffOrAdmin()) {
            $this->app['auth']->guard('admin')->setUser($user);
            $this->app['auth']->guard('sanctum')->setUser($user);
        }

        if ($guard === 'sanctum') {
            $this->app['auth']->guard('sanctum')->setUser($user);
        }

        return parent::actingAs($user, $guard);
    }

    /**
     * Assert that the user is authenticated as the given user.
     *
     * @param  \Illuminate\Contracts\Auth\Authenticatable  $user
     * @param  string|null  $guard
     * @return $this
     */
    public function assertAuthenticatedAs($user, $guard = null)
    {
        if ($guard === null && method_exists($user, 'isStaffOrAdmin') && $user->isStaffOrAdmin()) {
            if ($this->app['auth']->guard('admin')->check()) {
                $guard = 'admin';
            }
        }

        return parent::assertAuthenticatedAs($user, $guard);
    }
}
