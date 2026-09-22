<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

final class SolicitacaoStatusAlterado implements EventoDeDominio
{
    use Dispatchable;

    public function __construct(
        public readonly int $solicitacaoId,
        public readonly string $protocolo,
        public readonly string $fromStatus,
        public readonly string $toStatus,
        public readonly ?string $requestId,
    ) {}

    public function nome(): string
    {
        return 'solicitacao.status_updated';
    }

    public function contexto(): array
    {
        return [
            'solicitacao_id' => $this->solicitacaoId,
            'protocolo' => $this->protocolo,
            'from_status' => $this->fromStatus,
            'to_status' => $this->toStatus,
        ];
    }
}
