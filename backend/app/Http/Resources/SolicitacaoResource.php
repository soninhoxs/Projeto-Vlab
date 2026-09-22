<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

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
            'created_at' => self::isoTimestamp($this->created_at),
            'updated_at' => $this->when(
                $request->routeIs('solicitacoes.show'),
                self::isoTimestamp($this->updated_at),
            ),
            'historico_status' => $this->when(
                $request->routeIs('solicitacoes.show'),
                function () {
                    $items = $this->relationLoaded('statusHistorico')
                        ? $this->statusHistorico
                        : $this->statusHistorico()->orderBy('id')->get();

                    return $items->map(function ($item): array {
                        $from = $item->from_status;
                        $to = $item->to_status;

                        return [
                            'from_status' => $from instanceof \BackedEnum ? $from->value : $from,
                            'to_status' => $to instanceof \BackedEnum ? $to->value : $to,
                            'created_at' => self::isoTimestamp($item->created_at),
                        ];
                    })->values();
                }
            ),
        ];
    }

    private static function isoTimestamp(mixed $value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return Carbon::parse($value)->utc()->format('Y-m-d\TH:i:s\Z');
        }

        if (is_array($value)) {
            $date = $value['date'] ?? null;

            return is_string($date) && $date !== ''
                ? self::isoTimestamp($date)
                : null;
        }

        if (is_object($value) && isset($value->date) && is_string($value->date) && $value->date !== '') {
            return self::isoTimestamp($value->date);
        }

        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->utc()->format('Y-m-d\TH:i:s\Z');
        } catch (\Throwable) {
            return $value;
        }
    }
}
