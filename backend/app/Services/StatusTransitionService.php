<?php

namespace App\Services;

use App\Enums\StatusEnum;
use App\Models\Solicitacao;
use Illuminate\Validation\ValidationException;

class StatusTransitionService
{
    /**
     * Map of allowed status transitions.
     * The key is the current status, and the values are the permitted next statuses.
     */
    protected const ALLOWED_TRANSITIONS = [
        StatusEnum::RECEBIDA->value => [
            StatusEnum::EM_ANALISE->value,
            StatusEnum::CANCELADA->value,
        ],
        StatusEnum::EM_ANALISE->value => [
            StatusEnum::AGENDADA->value,
            StatusEnum::CANCELADA->value,
        ],
        StatusEnum::AGENDADA->value => [
            StatusEnum::CONCLUIDA->value,
            StatusEnum::CANCELADA->value,
        ],
        StatusEnum::CONCLUIDA->value => [],
        StatusEnum::CANCELADA->value => [],
    ];

    /**
     * Attempt to transition the status of a Solicitacao.
     *
     * @param Solicitacao $solicitacao
     * @param StatusEnum $newStatus
     * @return bool
     * @throws ValidationException
     */
    public function transition(Solicitacao $solicitacao, StatusEnum $newStatus): bool
    {
        $currentStatus = $solicitacao->status->value;
        $nextStatus = $newStatus->value;

        if ($currentStatus === $nextStatus) {
            return true; // No change needed
        }

        $allowed = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];

        if (!in_array($nextStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => ["Transição de status inválida. Não é possível alterar de {$currentStatus} para {$nextStatus}."],
            ]);
        }

        $solicitacao->status = $newStatus;
        return $solicitacao->save();
    }
}
