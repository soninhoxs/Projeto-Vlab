<?php

namespace App\Services;

use App\Enums\StatusEnum;
use App\Models\Solicitacao;
use Illuminate\Support\Facades\DB;
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
     * @throws ValidationException
     */
    public function transition(Solicitacao $solicitacao, StatusEnum $newStatus): bool
    {
        return DB::transaction(function () use ($solicitacao, $newStatus): bool {
            /** @var Solicitacao $locked */
            $locked = Solicitacao::query()
                ->whereKey($solicitacao->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $currentStatus = $locked->status->value;
            $nextStatus = $newStatus->value;

            if ($currentStatus === $nextStatus) {
                $solicitacao->refresh();

                return true;
            }

            $allowed = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];

            if (! in_array($nextStatus, $allowed, true)) {
                throw ValidationException::withMessages([
                    'status' => ["Transição de status inválida. Não é possível alterar de {$currentStatus} para {$nextStatus}."],
                ]);
            }

            $locked->status = $newStatus;
            $locked->save();

            $locked->statusHistorico()->create([
                'from_status' => $currentStatus,
                'to_status' => $nextStatus,
            ]);

            $solicitacao->refresh();

            return true;
        });
    }
}
