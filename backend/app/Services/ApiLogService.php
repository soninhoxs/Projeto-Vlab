<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Middleware\AssignRequestId;
use App\Support\Http\HttpStatus;
use App\Support\Logging\LogContextSanitizer;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PDOException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class ApiLogService
{
    public function isEnabled(): bool
    {
        return filter_var(config('http_logging.enabled', true), FILTER_VALIDATE_BOOL);
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
        $durationMs = (hrtime(true) - $startedAtHrtime) / 1_000_000;

        if (
            $this->skipsFastIndex()
            && $request->isMethod('GET')
            && $statusCode < 400
            && $durationMs < 400
            && $request->routeIs('solicitacoes.index')
        ) {
            return;
        }

        $category = HttpStatus::category($statusCode);

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
     * Falha de persistência (Postgres/PDO). Não grava SQL nem bindings: a mensagem
     * do QueryException pode carregar nome, descrição ou justificativa.
     */
    public function logIntegrationFailure(Request $request, Throwable $exception): void
    {
        if (! $this->isEnabled() || ! $request->is('api/*') || ! $this->isPersistenceFailure($exception)) {
            return;
        }

        $this->write('error', 'integration.failed', [
            'event' => 'integration.failed',
            'request_id' => $this->requestId($request),
            'dependency' => 'database',
            'exception' => $exception::class,
            'sqlstate' => $this->sqlState($exception),
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

    private function skipsFastIndex(): bool
    {
        return filter_var(config('http_logging.skip_fast_index', true), FILTER_VALIDATE_BOOL);
    }

    private function isPersistenceFailure(Throwable $exception): bool
    {
        return $exception instanceof QueryException || $exception instanceof PDOException;
    }

    private function sqlState(Throwable $exception): ?string
    {
        $info = match (true) {
            $exception instanceof QueryException, $exception instanceof PDOException => $exception->errorInfo,
            default => null,
        };

        $state = is_array($info) ? ($info[0] ?? null) : null;

        return is_string($state) && $state !== '' ? $state : null;
    }

    private function requestId(Request $request): ?string
    {
        $id = $request->attributes->get(AssignRequestId::ATTRIBUTE);

        return is_string($id) ? $id : null;
    }
}
