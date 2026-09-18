<?php

namespace Database\Factories;

use App\Models\Solicitacao;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Solicitacao>
 */
class SolicitacaoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'protocolo' => strtoupper($this->faker->lexify('??????????')),
            'nome_solicitante' => $this->faker->name(),
            'categoria' => $this->faker->randomElement(['CONSULTA', 'EXAME', 'VACINACAO', 'OUTRO']),
            'prioridade' => $this->faker->randomElement(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
            'status' => $this->faker->randomElement(['RECEBIDA', 'EM_ANALISE', 'AGENDADA', 'CONCLUIDA', 'CANCELADA']),
            'descricao' => $this->faker->sentence(),
            'justificativa_prioridade' => function (array $attributes) {
                return $attributes['prioridade'] === 'URGENTE' ? $this->faker->sentence() : null;
            },
        ];
    }
}
