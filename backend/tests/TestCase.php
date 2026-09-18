<?php

declare(strict_types=1);

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();

        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.url', null);
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app['config']->set('cache.default', 'array');
        $app['config']->set('http_logging.enabled', true);
        $app['config']->set('logging.default', 'stack');

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app['db']->getDriverName() !== 'sqlite') {
            throw new RuntimeException(
                'Os testes devem usar sqlite em memória, não '.$this->app['db']->getDriverName().'.',
            );
        }

        Cache::flush();

        $this->withoutMiddleware(ThrottleRequests::class);

        if (config('vlab.api_auth_enabled')) {
            Sanctum::actingAs(User::factory()->create());
        }
    }
}
