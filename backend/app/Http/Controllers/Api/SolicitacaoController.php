<?php

namespace App\Http\Controllers\Api;

use App\Enums\StatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexSolicitacaoRequest;
use App\Http\Requests\StoreSolicitacaoRequest;
use App\Http\Requests\UpdateStatusRequest;
use App\Http\Resources\SolicitacaoResource;
use App\Models\Solicitacao;
use App\Services\SolicitacaoQueryService;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;

class SolicitacaoController extends Controller
{
    public function __construct(
        protected StatusTransitionService $statusTransitionService,
        protected SolicitacaoQueryService $solicitacaoQueryService
    ) {}

    public function index(IndexSolicitacaoRequest $request): JsonResponse
    {
        $filteredQuery = $this->solicitacaoQueryService->applyFilters($request->filters());
        $summary = $this->solicitacaoQueryService->buildSummary($filteredQuery);

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
            ->paginate(7)
            ->appends($request->safe()->only(['status', 'categoria', 'prioridade', 'busca']));

        $payload = $paginated->toArray();
        $payload['data'] = SolicitacaoResource::collection($paginated->getCollection())->resolve($request);
        $payload['summary'] = $summary;

        return response()->json($payload);
    }

    public function store(StoreSolicitacaoRequest $request): JsonResponse
    {
        $solicitacao = Solicitacao::create($request->safe()->only([
            'nome_solicitante',
            'categoria',
            'prioridade',
            'descricao',
            'justificativa_prioridade',
        ]));

        return response()->json([
            'message' => 'Solicitação criada com sucesso',
            'data' => SolicitacaoResource::make($solicitacao)->resolve($request),
        ], 201);
    }

    public function show(Solicitacao $solicitacao): SolicitacaoResource
    {
        return SolicitacaoResource::make($solicitacao);
    }

    public function updateStatus(UpdateStatusRequest $request, Solicitacao $solicitacao): JsonResponse
    {
        $newStatus = StatusEnum::from($request->validated('status'));
        $this->statusTransitionService->transition($solicitacao, $newStatus);

        return response()->json([
            'message' => 'Status atualizado com sucesso',
            'data' => SolicitacaoResource::make($solicitacao)->resolve($request),
        ]);
    }
}
