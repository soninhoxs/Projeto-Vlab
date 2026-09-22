<?php

declare(strict_types=1);

namespace App\Logging;

use App\Http\Middleware\AssignRequestId;
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

/**
 * Coloca o X-Request-Id no extra do Monolog para exceções no canal stderr
 * correlacionarem com http.response / integration.failed.
 */
final class RequestIdProcessor implements ProcessorInterface
{
    public function __invoke(LogRecord $record): LogRecord
    {
        if (isset($record->context['request_id']) || isset($record->extra['request_id'])) {
            return $record;
        }

        if (! app()->bound('request')) {
            return $record;
        }

        $requestId = request()->attributes->get(AssignRequestId::ATTRIBUTE);

        if (! is_string($requestId) || $requestId === '') {
            return $record;
        }

        return $record->with(extra: array_merge($record->extra, [
            'request_id' => $requestId,
        ]));
    }
}
