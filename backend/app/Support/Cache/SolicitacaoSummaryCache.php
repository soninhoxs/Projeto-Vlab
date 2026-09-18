<?php

declare(strict_types=1);

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;

final class SolicitacaoSummaryCache
{
    private const VERSION_KEY = 'solicitacoes.summary.version';

    public static function version(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }

    public static function bump(): void
    {
        if (! Cache::has(self::VERSION_KEY)) {
            Cache::forever(self::VERSION_KEY, 2);

            return;
        }

        Cache::increment(self::VERSION_KEY);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public static function listKey(array $filters, int $page): string
    {
        $normalized = $filters;
        $normalized['page'] = max(1, $page);
        ksort($normalized);

        return 'solicitacoes.list.v'.self::version().'.'.hash('sha256', json_encode($normalized, JSON_THROW_ON_ERROR));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public static function key(array $filters): string
    {
        ksort($filters);

        return 'solicitacoes.summary.v'.self::version().'.'.hash('sha256', json_encode($filters, JSON_THROW_ON_ERROR));
    }
}
