<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Solicitacao;
use App\Support\Cache\SolicitacaoSummaryCache;

final class SolicitacaoObserver
{
    public function created(Solicitacao $solicitacao): void
    {
        SolicitacaoSummaryCache::bump();
    }

    public function updated(Solicitacao $solicitacao): void
    {
        SolicitacaoSummaryCache::bump();
    }

    public function deleted(Solicitacao $solicitacao): void
    {
        SolicitacaoSummaryCache::bump();
    }
}
