<?php

namespace App\Providers;

use App\Models\Solicitacao;
use App\Policies\SolicitacaoPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Console\ServeCommand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // `artisan serve` só repassa um allowlist ao PHP que atende HTTP.
        // Sem isto, LOG_* do Compose some quando existe .env e o log volta ao arquivo.
        ServeCommand::$passthroughVariables = array_values(array_unique([
            ...ServeCommand::$passthroughVariables,
            'APP_DEBUG',
            'LOG_CHANNEL',
            'LOG_STACK',
            'LOG_LEVEL',
            'LOG_HTTP_ENABLED',
            'LOG_HTTP_CHANNEL',
            'LOG_API_LEVEL',
            'LOG_API_DAYS',
            'LOG_HTTP_SKIP_FAST_INDEX',
        ]));

        Gate::policy(Solicitacao::class, SolicitacaoPolicy::class);

        Gate::before(function (?Authenticatable $user, string $ability): ?bool {
            if (! config('vlab.api_auth_enabled')) {
                return true;
            }

            return null;
        });

        RateLimiter::for('api', function (Request $request) {
            $by = $request->ip() ?: 'unknown';

            if ($request->isMethod('GET')) {
                return Limit::perMinute(120)->by($by);
            }

            return Limit::perMinute(30)->by($by);
        });
    }
}
