<?php

namespace App\Services;

use App\Enums\CategoriaEnum;
use App\Enums\PrioridadeEnum;
use App\Enums\StatusEnum;
use App\Models\Solicitacao;
use App\Support\Cache\SolicitacaoSummaryCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class SolicitacaoQueryService
{
    /**
     * @param  array{status?: string, categoria?: string, prioridade?: string, busca?: string, data_inicio?: string, data_fim?: string}  $filters
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
     * @param  array<string, mixed>  $filters
     * @return array{
     *     total: int,
     *     recebidas: int,
     *     em_analise: int,
     *     agendadas: int,
     *     urgentes: int,
     *     por_status: array<string, int>,
     *     por_categoria: array<string, int>,
     *     por_prioridade: array<string, int>,
     *     por_dia: list<array{data: string, total: int}>
     * }
     */
    public function buildSummary(Builder $query, array $filters = []): array
    {
        $ttl = max(1, (int) config('vlab.summary_cache_seconds', 15));
        $cacheKey = SolicitacaoSummaryCache::key($filters);

        return Cache::remember($cacheKey, $ttl, function () use ($query): array {
            return $this->computeSummary($query);
        });
    }

    /**
     * @return array{
     *     total: int,
     *     recebidas: int,
     *     em_analise: int,
     *     agendadas: int,
     *     urgentes: int,
     *     por_status: array<string, int>,
     *     por_categoria: array<string, int>,
     *     por_prioridade: array<string, int>,
     *     por_dia: list<array{data: string, total: int}>
     * }
     */
    private function computeSummary(Builder $query): array
    {
        $rows = (clone $query)->reorder()->toBase()->get(['status', 'prioridade', 'categoria', 'created_at']);

        $porStatus = $this->emptyCounts(StatusEnum::cases());
        $porCategoria = $this->emptyCounts(CategoriaEnum::cases());
        $porPrioridade = $this->emptyCounts(PrioridadeEnum::cases());
        $porDia = [];

        foreach ($rows as $row) {
            $status = (string) $row->status;
            $categoria = (string) $row->categoria;
            $prioridade = (string) $row->prioridade;

            if (array_key_exists($status, $porStatus)) {
                $porStatus[$status]++;
            }

            if (array_key_exists($categoria, $porCategoria)) {
                $porCategoria[$categoria]++;
            }

            if (array_key_exists($prioridade, $porPrioridade)) {
                $porPrioridade[$prioridade]++;
            }

            if (! empty($row->created_at)) {
                $day = Carbon::parse($row->created_at)->timezone((string) config('app.timezone'))->toDateString();
                $porDia[$day] = ($porDia[$day] ?? 0) + 1;
            }
        }

        return [
            'total' => $rows->count(),
            'recebidas' => $porStatus[StatusEnum::RECEBIDA->value],
            'em_analise' => $porStatus[StatusEnum::EM_ANALISE->value],
            'agendadas' => $porStatus[StatusEnum::AGENDADA->value],
            'urgentes' => $porPrioridade[PrioridadeEnum::URGENTE->value],
            'por_status' => $porStatus,
            'por_categoria' => $porCategoria,
            'por_prioridade' => $porPrioridade,
            'por_dia' => $this->lastDays($porDia, 14),
        ];
    }

    /**
     * @param  array<int, \BackedEnum>  $cases
     * @return array<string, int>
     */
    private function emptyCounts(array $cases): array
    {
        $counts = [];

        foreach ($cases as $case) {
            $counts[(string) $case->value] = 0;
        }

        return $counts;
    }

    /**
     * @param  array<string, int>  $counts
     * @return list<array{data: string, total: int}>
     */
    private function lastDays(array $counts, int $days): array
    {
        $series = [];
        $cursor = now()->startOfDay();

        for ($offset = $days - 1; $offset >= 0; $offset--) {
            $date = $cursor->copy()->subDays($offset)->toDateString();
            $series[] = [
                'data' => $date,
                'total' => (int) ($counts[$date] ?? 0),
            ];
        }

        return $series;
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
