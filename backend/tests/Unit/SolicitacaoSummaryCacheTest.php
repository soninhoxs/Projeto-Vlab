<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\Cache\SolicitacaoSummaryCache;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

final class SolicitacaoSummaryCacheTest extends TestCase
{
    public function test_should_change_cache_key_when_summary_version_bumps(): void
    {
        Cache::flush();

        $filters = ['status' => 'RECEBIDA'];
        $firstKey = SolicitacaoSummaryCache::key($filters);

        SolicitacaoSummaryCache::bump();

        $this->assertNotSame($firstKey, SolicitacaoSummaryCache::key($filters));
    }

    public function test_should_change_list_cache_key_when_version_bumps(): void
    {
        Cache::flush();

        $filters = ['status' => 'RECEBIDA'];
        $firstKey = SolicitacaoSummaryCache::listKey($filters, 2);

        SolicitacaoSummaryCache::bump();

        $this->assertNotSame($firstKey, SolicitacaoSummaryCache::listKey($filters, 2));
        $this->assertNotSame(
            SolicitacaoSummaryCache::listKey($filters, 1),
            SolicitacaoSummaryCache::listKey($filters, 2),
        );
    }
}
