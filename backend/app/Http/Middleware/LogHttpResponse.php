<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\ApiLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class LogHttpResponse
{
    public const STARTED_AT_ATTRIBUTE = 'http_log_started_at';

    public function __construct(
        private readonly ApiLogService $apiLogService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->apiLogService->isEnabled()) {
            $request->attributes->set(self::STARTED_AT_ATTRIBUTE, hrtime(true));
        }

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $startedAt = $request->attributes->get(self::STARTED_AT_ATTRIBUTE);
        if (! is_int($startedAt)) {
            return;
        }

        $this->apiLogService->logHttpResponse($request, $response, $startedAt);
    }
}
