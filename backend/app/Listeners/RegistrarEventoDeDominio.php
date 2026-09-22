<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\SolicitacaoCriada;
use App\Events\SolicitacaoStatusAlterado;
use App\Services\ApiLogService;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;

/**
 * Log de domínio fora do request. A solicitação e o histórico já commitaram;
 * falha aqui não vira 500 para o operador.
 */
final class RegistrarEventoDeDominio implements ShouldQueueAfterCommit
{
    public const QUEUE = 'dominio';

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(private readonly ApiLogService $apiLog) {}

    public function viaQueue(): string
    {
        return self::QUEUE;
    }

    public function handle(SolicitacaoCriada|SolicitacaoStatusAlterado $event): void
    {
        $this->apiLog->logQueuedDomainEvent(
            $event->requestId,
            $event->nome(),
            $event->contexto(),
        );
    }
}
