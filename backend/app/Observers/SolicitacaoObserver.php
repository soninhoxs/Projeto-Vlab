<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Solicitacao;
use App\Support\Cache\SolicitacaoSummaryCache;

final class SolicitacaoObserver
{
    public function created(Solicitacao $solicitacao): void
    {
        $solicitacao->statusHistorico()->create([
            'from_status' => null,
            'to_status' => $solicitacao->status->value,
        ]);

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
