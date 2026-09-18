<?php

namespace App\Support\Http;

use Psr\Log\LogLevel;

/**
 * Mapeia códigos HTTP para categoria (MDN), frase e nível de log justificável para a API.
 */
final class HttpStatus
{
    /** Frases usadas pela API V-Lab e erros comuns de gateway. */
    private const REASON_PHRASES = [
        200 => 'OK',
        201 => 'Created',
        204 => 'No Content',
        304 => 'Not Modified',
        400 => 'Bad Request',
        401 => 'Unauthorized',
        403 => 'Forbidden',
        404 => 'Not Found',
        405 => 'Method Not Allowed',
        409 => 'Conflict',
        422 => 'Unprocessable Content',
        429 => 'Too Many Requests',
        500 => 'Internal Server Error',
        502 => 'Bad Gateway',
        503 => 'Service Unavailable',
        504 => 'Gateway Timeout',
    ];

    public static function category(int $statusCode): HttpStatusCategory
    {
        return match (true) {
            $statusCode >= 100 && $statusCode <= 199 => HttpStatusCategory::Informational,
            $statusCode >= 200 && $statusCode <= 299 => HttpStatusCategory::Successful,
            $statusCode >= 300 && $statusCode <= 399 => HttpStatusCategory::Redirection,
            $statusCode >= 400 && $statusCode <= 499 => HttpStatusCategory::ClientError,
            $statusCode >= 500 && $statusCode <= 599 => HttpStatusCategory::ServerError,
            default => HttpStatusCategory::Unknown,
        };
    }

    public static function reasonPhrase(int $statusCode): string
    {
        return self::REASON_PHRASES[$statusCode]
            ?? sprintf('HTTP %d', $statusCode);
    }

    /**
     * Nível de log alinhado à semântica do status:
     * - 2xx: operação normal (info)
     * - 4xx: falha previsível do cliente (warning)
     * - 5xx: falha do servidor (error)
     */
    public static function logLevel(int $statusCode): string
    {
        return match (self::category($statusCode)) {
            HttpStatusCategory::Informational => LogLevel::DEBUG,
            HttpStatusCategory::Successful => LogLevel::INFO,
            HttpStatusCategory::Redirection => LogLevel::NOTICE,
            HttpStatusCategory::ClientError => LogLevel::WARNING,
            HttpStatusCategory::ServerError => LogLevel::ERROR,
            HttpStatusCategory::Unknown => LogLevel::INFO,
        };
    }

    public static function isSuccess(int $statusCode): bool
    {
        return self::category($statusCode) === HttpStatusCategory::Successful;
    }
}
