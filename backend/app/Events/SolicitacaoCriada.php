<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

final class SolicitacaoCriada implements EventoDeDominio
{
    use Dispatchable;

    public function __construct(
        public readonly int $solicitacaoId,
        public readonly string $protocolo,
        public readonly string $categoria,
        public readonly string $prioridade,
        public readonly string $status,
        public readonly ?string $requestId,
    ) {}

    public function nome(): string
    {
        return 'solicitacao.created';
    }

    public function contexto(): array
    {
        return [
            'solicitacao_id' => $this->solicitacaoId,
            'protocolo' => $this->protocolo,
            'categoria' => $this->categoria,
            'prioridade' => $this->prioridade,
            'status' => $this->status,
        ];
    }
}
