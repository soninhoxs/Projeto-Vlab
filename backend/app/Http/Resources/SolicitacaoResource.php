<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SolicitacaoResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocolo' => $this->protocolo,
            'nome_solicitante' => $this->nome_solicitante,
            'categoria' => $this->categoria?->value ?? $this->categoria,
            'prioridade' => $this->prioridade?->value ?? $this->prioridade,
            'status' => $this->status?->value ?? $this->status,
            'descricao' => $this->when(
                $request->routeIs('solicitacoes.show') || $request->routeIs('solicitacoes.store') || $request->isMethod('patch'),
                $this->descricao
            ),
            'justificativa_prioridade' => $this->when(
                $request->routeIs('solicitacoes.show') || $request->routeIs('solicitacoes.store') || $request->isMethod('patch'),
                $this->justificativa_prioridade
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->when(
                $request->routeIs('solicitacoes.show'),
                $this->updated_at
            ),
        ];
    }
}
