<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class HealthCheckTest extends TestCase
{
    public function test_up_returns_200_when_the_database_accepts_a_query(): void
    {
        $response = $this->getJson('/up');

        $response->assertOk();
        $response->assertJson(['status' => 'up']);
    }

    public function test_up_returns_500_when_the_database_is_unreachable(): void
    {
        config([
            'app.debug' => false,
            'database.connections.sqlite.database' => sys_get_temp_dir()
                .DIRECTORY_SEPARATOR.'vlab-health-missing-'.uniqid('', true)
                .DIRECTORY_SEPARATOR.'db.sqlite',
        ]);
        DB::purge('sqlite');

        $response = $this->getJson('/up');

        $response->assertStatus(500);
        $response->assertJson(['status' => 'down']);
    }
}
