<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerRegistrationAndLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_with_provided_credentials(): void
    {
        // Ensure clean state for test user
        User::where('email', 'kgsanjay.kallabbe@gmail.com')
            ->orWhere('phone', '7975365475')
            ->forceDelete();

        $response = $this->post('/register', [
            'name' => 'sanjay',
            'email' => 'kgsanjay.kallabbe@gmail.com',
            'phone' => '7975365475',
            'password' => 'Admin@123',
            'whatsapp_opt_in' => true,
        ]);

        $response->assertRedirect(route('account.index'));
        $this->assertAuthenticated();

        $user = User::where('email', 'kgsanjay.kallabbe@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('sanjay', $user->name);
        $this->assertSame('7975365475', $user->phone);
        $this->assertSame(UserRole::CUSTOMER, $user->role);
        $this->assertTrue(Hash::check('Admin@123', $user->password));
    }

    public function test_customer_can_login_with_phone(): void
    {
        User::create([
            'name' => 'sanjay',
            'email' => 'kgsanjay.kallabbe@gmail.com',
            'phone' => '7975365475',
            'password' => Hash::make('Admin@123'),
            'role' => UserRole::CUSTOMER,
        ]);

        $response = $this->post('/login', [
            'login' => '7975365475',
            'password' => 'Admin@123',
        ]);

        $response->assertRedirect(route('account.index'));
        $this->assertAuthenticated();
    }

    public function test_customer_can_login_with_email(): void
    {
        User::create([
            'name' => 'sanjay',
            'email' => 'kgsanjay.kallabbe@gmail.com',
            'phone' => '7975365475',
            'password' => Hash::make('Admin@123'),
            'role' => UserRole::CUSTOMER,
        ]);

        $response = $this->post('/login', [
            'login' => 'kgsanjay.kallabbe@gmail.com',
            'password' => 'Admin@123',
        ]);

        $response->assertRedirect(route('account.index'));
        $this->assertAuthenticated();
    }
}

