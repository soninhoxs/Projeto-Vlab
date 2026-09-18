<?php

namespace App\Http\Requests;

use App\Enums\CategoriaEnum;
use App\Enums\PrioridadeEnum;
use App\Enums\StatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class IndexSolicitacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('busca')) {
            $this->merge([
                'busca' => trim((string) $this->input('busca')),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'status' => ['sometimes', 'nullable', 'string', new Enum(StatusEnum::class)],
            'categoria' => ['sometimes', 'nullable', 'string', new Enum(CategoriaEnum::class)],
            'prioridade' => ['sometimes', 'nullable', 'string', new Enum(PrioridadeEnum::class)],
            'busca' => ['sometimes', 'nullable', 'string', 'max:100'],
            'data_inicio' => ['sometimes', 'nullable', 'date', 'date_format:Y-m-d'],
            'data_fim' => ['sometimes', 'nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:data_inicio'],
        ];
    }

    /**
     * @return array{status?: string, categoria?: string, prioridade?: string, busca?: string, data_inicio?: string, data_fim?: string}
     */
    public function filters(): array
    {
        return $this->safe()->only(['status', 'categoria', 'prioridade', 'busca', 'data_inicio', 'data_fim']);
    }
}
