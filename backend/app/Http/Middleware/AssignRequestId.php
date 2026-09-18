<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class AssignRequestId
{
    public const ATTRIBUTE = 'request_id';

    /** Apenas IDs opacos — evita injeção em logs e headers. */
    private const CLIENT_REQUEST_ID_PATTERN = '/^[A-Za-z0-9_-]{8,64}$/';

    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $this->resolveRequestId($request->headers->get('X-Request-Id'));

        $request->attributes->set(self::ATTRIBUTE, $requestId);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }

    private function resolveRequestId(?string $headerValue): string
    {
        if (
            is_string($headerValue)
            && $headerValue !== ''
            && preg_match(self::CLIENT_REQUEST_ID_PATTERN, $headerValue) === 1
        ) {
            return $headerValue;
        }

        return (string) Str::uuid();
    }
}
