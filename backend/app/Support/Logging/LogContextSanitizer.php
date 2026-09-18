<?php

declare(strict_types=1);

namespace App\Support\Logging;

/**
 * Evita vazamento de dados sensíveis (LGPD / princípio do menor privilégio em logs).
 */
final class LogContextSanitizer
{
    private const MAX_STRING_LENGTH = 512;

    /** @var list<string> */
    private const SENSITIVE_KEY_FRAGMENTS = [
        'nome_solicitante',
        'descricao',
        'justificativa',
        'password',
        'senha',
        'secret',
        'token',
        'authorization',
        'cookie',
        'cpf',
        'email',
    ];

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function sanitize(array $context): array
    {
        $sanitized = [];

        foreach ($context as $key => $value) {
            $keyString = (string) $key;

            if (self::isSensitiveKey($keyString)) {
                $sanitized[$keyString] = '[redacted]';

                continue;
            }

            if (is_array($value)) {
                /** @var array<string, mixed> $nested */
                $nested = $value;
                $sanitized[$keyString] = self::sanitize($nested);

                continue;
            }

            if (is_string($value)) {
                $sanitized[$keyString] = self::truncateString($value);

                continue;
            }

            $sanitized[$keyString] = $value;
        }

        return $sanitized;
    }

    private static function isSensitiveKey(string $key): bool
    {
        $normalized = strtolower($key);

        foreach (self::SENSITIVE_KEY_FRAGMENTS as $fragment) {
            if ($normalized === $fragment || str_contains($normalized, $fragment)) {
                return true;
            }
        }

        return false;
    }

    private static function truncateString(string $value): string
    {
        if (strlen($value) <= self::MAX_STRING_LENGTH) {
            return $value;
        }

        return substr($value, 0, self::MAX_STRING_LENGTH).'…';
    }
}
