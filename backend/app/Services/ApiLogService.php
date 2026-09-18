<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Middleware\AssignRequestId;
use App\Support\Http\HttpStatus;
use App\Support\Logging\LogContextSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

final class ApiLogService
{
    public function isEnabled(): bool
    {
        return (bool) config('http_logging.enabled', true);
    }

    public function logHttpResponse(Request $request, Response $response, int $startedAtHrtime): void
    {
        if (! $this->isEnabled() || ! $request->is('api/*')) {
            return;
        }

        $path = $request->path();
        if ($path === 'up' || $path === 'health') {
            return;
        }

        $statusCode = $response->getStatusCode();
        $category = HttpStatus::category($statusCode);
        $durationMs = (hrtime(true) - $startedAtHrtime) / 1_000_000;

        $this->write(
            HttpStatus::logLevel($statusCode),
            'http.response',
            [
                'event' => 'http.response',
                'request_id' => $this->requestId($request),
                'method' => $request->method(),
                'path' => '/'.$path,
                'route' => $request->route()?->getName(),
                'status_code' => $statusCode,
                'status_phrase' => HttpStatus::reasonPhrase($statusCode),
                'status_category' => $category->value,
                'status_category_label' => $category->labelPt(),
                'duration_ms' => round($durationMs, 2),
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public function logDomainEvent(Request $request, string $event, array $context = []): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        $this->write('info', $event, [
            'event' => $event,
            'request_id' => $this->requestId($request),
            ...$context,
        ]);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function write(string $level, string $message, array $context): void
    {
        $channel = (string) config('http_logging.channel', 'api');
        Log::channel($channel)->log($level, $message, LogContextSanitizer::sanitize($context));
    }

    private function requestId(Request $request): ?string
    {
        $id = $request->attributes->get(AssignRequestId::ATTRIBUTE);

        return is_string($id) ? $id : null;
    }
}
