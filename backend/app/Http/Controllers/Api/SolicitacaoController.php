<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\StatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexSolicitacaoRequest;
use App\Http\Requests\StoreSolicitacaoRequest;
use App\Http\Requests\UpdateStatusRequest;
use App\Http\Resources\SolicitacaoResource;
use App\Models\Solicitacao;
use App\Services\ApiLogService;
use App\Services\SolicitacaoQueryService;
use App\Support\Cache\SolicitacaoSummaryCache;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SolicitacaoController extends Controller
{
    public function __construct(
        protected StatusTransitionService $statusTransitionService,
        protected SolicitacaoQueryService $solicitacaoQueryService,
        protected ApiLogService $apiLogService,
    ) {}

    public function index(IndexSolicitacaoRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Solicitacao::class);

        $filters = $request->filters();
        $page = max(1, $request->integer('page', 1));
        $ttl = max(1, (int) config('vlab.list_cache_seconds', 30));

        $payload = Cache::remember(
            SolicitacaoSummaryCache::listKey($filters, $page),
            $ttl,
            fn (): array => $this->buildIndexPayload($request, $filters, $page),
        );

        return response()->json($payload)
            ->header('Cache-Control', 'private, max-age='.$ttl);
    }

    /**
     * @param  array{status?: string, categoria?: string, prioridade?: string, busca?: string, data_inicio?: string, data_fim?: string}  $filters
     * @return array<string, mixed>
     */
    private function buildIndexPayload(IndexSolicitacaoRequest $request, array $filters, int $page): array
    {
        $filteredQuery = $this->solicitacaoQueryService->applyFilters($filters);
        $summary = $this->solicitacaoQueryService->buildSummary($filteredQuery, $filters);

        $paginated = (clone $filteredQuery)
            ->select([
                'id',
                'protocolo',
                'nome_solicitante',
                'categoria',
                'prioridade',
                'status',
                'created_at',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(7, ['*'], 'page', $page)
            ->appends($request->safe()->only([
                'status',
                'categoria',
                'prioridade',
                'busca',
                'data_inicio',
                'data_fim',
            ]));

        $payload = $paginated->toArray();
        $payload['data'] = SolicitacaoResource::collection($paginated->getCollection())->resolve($request);
        $payload['summary'] = $summary;

        return $payload;
    }

    public function store(StoreSolicitacaoRequest $request): JsonResponse
    {
        $this->authorize('create', Solicitacao::class);

        $solicitacao = Solicitacao::create($request->safe()->only([
            'nome_solicitante',
            'categoria',
            'prioridade',
            'descricao',
            'justificativa_prioridade',
        ]));

        $this->apiLogService->logDomainEvent($request, 'solicitacao.created', [
            'solicitacao_id' => $solicitacao->id,
            'protocolo' => $solicitacao->protocolo,
            'categoria' => $solicitacao->categoria->value,
            'prioridade' => $solicitacao->prioridade->value,
            'status' => $solicitacao->status->value,
        ]);

        return response()->json([
            'message' => 'Solicitação criada com sucesso',
            'data' => SolicitacaoResource::make($solicitacao)->resolve($request),
        ], 201);
    }

    public function show(Solicitacao $solicitacao): SolicitacaoResource
    {
        $this->authorize('view', $solicitacao);

        return SolicitacaoResource::make($solicitacao);
    }

    public function updateStatus(UpdateStatusRequest $request, Solicitacao $solicitacao): JsonResponse
    {
        $this->authorize('update', $solicitacao);

        $previousStatus = $solicitacao->status->value;
        $newStatus = StatusEnum::from($request->validated('status'));
        $this->statusTransitionService->transition($solicitacao, $newStatus);

        $this->apiLogService->logDomainEvent($request, 'solicitacao.status_updated', [
            'solicitacao_id' => $solicitacao->id,
            'protocolo' => $solicitacao->protocolo,
            'from_status' => $previousStatus,
            'to_status' => $newStatus->value,
        ]);

        return response()->json([
            'message' => 'Status atualizado com sucesso',
            'data' => SolicitacaoResource::make($solicitacao)->resolve($request),
        ]);
    }
}
