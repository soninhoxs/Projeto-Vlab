<?php

use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\LogHttpResponse;
use App\Http\Middleware\SecurityHeaders;
use App\Services\ApiLogService;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(function (Request $request): ?string {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            return null;
        });

        $middleware->append(SecurityHeaders::class);
        $middleware->throttleApi('api');
        $middleware->api(prepend: [
            AssignRequestId::class,
        ]);
        $middleware->append(LogHttpResponse::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Recurso não encontrado',
                ], 404);
            }
        });

        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Muitas requisições. Tente novamente em instantes.',
                ], 429);
            }
        });

        $exceptions->report(function (Throwable $e): void {
            try {
                if (! app()->bound(ApiLogService::class)) {
                    return;
                }

                app(ApiLogService::class)->logIntegrationFailure(request(), $e);
            } catch (Throwable) {
                // Falha ao logar não pode esconder a exceção original.
            }
        });
    })->create();
