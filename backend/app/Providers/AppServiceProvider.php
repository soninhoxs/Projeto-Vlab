<?php

namespace App\Providers;

use App\Models\Solicitacao;
use App\Policies\SolicitacaoPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\Authenticatable;
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
        Gate::policy(Solicitacao::class, SolicitacaoPolicy::class);

        Gate::before(function (?Authenticatable $user, string $ability): ?bool {
            if (! config('vlab.api_auth_enabled')) {
                return true;
            }

            return null;
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}
