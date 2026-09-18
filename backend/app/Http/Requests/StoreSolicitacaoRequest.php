<?php

namespace App\Http\Requests;

use App\Enums\CategoriaEnum;
use App\Enums\PrioridadeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreSolicitacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'nome_solicitante' => $this->sanitizeText($this->input('nome_solicitante')),
            'descricao' => $this->sanitizeText($this->input('descricao')),
            'justificativa_prioridade' => $this->sanitizeText($this->input('justificativa_prioridade')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nome_solicitante' => ['required', 'string', 'min:3', 'max:120', 'regex:/^[\p{L}\p{M}\s.\'-]+$/u'],
            'categoria' => ['required', new Enum(CategoriaEnum::class)],
            'prioridade' => ['required', new Enum(PrioridadeEnum::class)],
            'descricao' => ['nullable', 'string', 'max:2000'],
            'justificativa_prioridade' => ['required_if:prioridade,URGENTE', 'nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nome_solicitante.regex' => 'O nome deve conter apenas letras e caracteres comuns de nome.',
            'justificativa_prioridade.required_if' => 'A justificativa é obrigatória para prioridade urgente.',
        ];
    }

    private function sanitizeText(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $stripped = strip_tags($value);
        $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $stripped) ?? '';

        return trim($stripped);
    }
}
