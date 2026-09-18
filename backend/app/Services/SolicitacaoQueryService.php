<?php

namespace App\Services;

use App\Enums\CategoriaEnum;
use App\Enums\PrioridadeEnum;
use App\Enums\StatusEnum;
use App\Models\Solicitacao;
use Illuminate\Database\Eloquent\Builder;

class SolicitacaoQueryService
{
    /**
     * @param array{status?: string, categoria?: string, prioridade?: string, busca?: string, data_inicio?: string, data_fim?: string} $filters
     */
    public function applyFilters(array $filters): Builder
    {
        $query = Solicitacao::query();

        if (! empty($filters['status'])) {
            $query->where('status', StatusEnum::from($filters['status']));
        }

        if (! empty($filters['categoria'])) {
            $query->where('categoria', CategoriaEnum::from($filters['categoria']));
        }

        if (! empty($filters['prioridade'])) {
            $query->where('prioridade', PrioridadeEnum::from($filters['prioridade']));
        }

        if (! empty($filters['busca'])) {
            $this->applySearch($query, $filters['busca']);
        }

        if (! empty($filters['data_inicio'])) {
            $query->where('created_at', '>=', $filters['data_inicio'].' 00:00:00');
        }

        if (! empty($filters['data_fim'])) {
            $query->where('created_at', '<=', $filters['data_fim'].' 23:59:59.999');
        }

        return $query;
    }

    /**
     * @return array{total: int, recebidas: int, em_analise: int, agendadas: int, urgentes: int}
     */
    public function buildSummary(Builder $query): array
    {
        $base = (clone $query)->reorder();

        if ($query->getConnection()->getDriverName() === 'pgsql') {
            $summary = $base
                ->selectRaw('count(*) as total')
                ->selectRaw("count(*) filter (where status = 'RECEBIDA') as recebidas")
                ->selectRaw("count(*) filter (where status = 'EM_ANALISE') as em_analise")
                ->selectRaw("count(*) filter (where status = 'AGENDADA') as agendadas")
                ->selectRaw("count(*) filter (where prioridade = 'URGENTE') as urgentes")
                ->first();

            return [
                'total' => (int) ($summary->total ?? 0),
                'recebidas' => (int) ($summary->recebidas ?? 0),
                'em_analise' => (int) ($summary->em_analise ?? 0),
                'agendadas' => (int) ($summary->agendadas ?? 0),
                'urgentes' => (int) ($summary->urgentes ?? 0),
            ];
        }

        $rows = $base->get(['status', 'prioridade']);

        return [
            'total' => $rows->count(),
            'recebidas' => $rows->where('status', StatusEnum::RECEBIDA)->count(),
            'em_analise' => $rows->where('status', StatusEnum::EM_ANALISE)->count(),
            'agendadas' => $rows->where('status', StatusEnum::AGENDADA)->count(),
            'urgentes' => $rows->where('prioridade', PrioridadeEnum::URGENTE)->count(),
        ];
    }

    private function applySearch(Builder $query, string $busca): void
    {
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $busca);
        $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $query->where(function (Builder $q) use ($escaped, $operator) {
            $q->whereRaw("nome_solicitante {$operator} ? ESCAPE '\\'", ["%{$escaped}%"])
                ->orWhereRaw("protocolo {$operator} ? ESCAPE '\\'", ["%{$escaped}%"]);
        });
    }
}
