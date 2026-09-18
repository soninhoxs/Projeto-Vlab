<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Solicitacao;
use App\Enums\StatusEnum;
use App\Enums\CategoriaEnum;
use App\Enums\PrioridadeEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SolicitacaoApiTest extends TestCase
{
    use RefreshDatabase;

    // ==================== INDEX ====================

    public function test_can_list_solicitacoes()
    {
        Solicitacao::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/solicitacoes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_page',
                'data' => [
                    '*' => [
                        'id',
                        'protocolo',
                        'nome_solicitante',
                        'categoria',
                        'prioridade',
                        'status',
                        'created_at',
                    ]
                ],
                'total',
                'last_page',
                'summary' => [
                    'total',
                    'recebidas',
                    'em_analise',
                    'agendadas',
                    'urgentes',
                ],
            ]);
    }

    public function test_can_filter_by_status()
    {
        Solicitacao::factory()->create(['status' => StatusEnum::RECEBIDA]);
        Solicitacao::factory()->create(['status' => StatusEnum::EM_ANALISE]);
        Solicitacao::factory()->create(['status' => StatusEnum::AGENDADA]);

        $response = $this->getJson('/api/v1/solicitacoes?status=RECEBIDA');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
    }

    public function test_can_filter_by_categoria()
    {
        Solicitacao::factory()->create(['categoria' => CategoriaEnum::CONSULTA]);
        Solicitacao::factory()->create(['categoria' => CategoriaEnum::EXAME]);

        $response = $this->getJson('/api/v1/solicitacoes?categoria=EXAME');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
    }

    public function test_can_filter_by_prioridade()
    {
        Solicitacao::factory()->create(['prioridade' => PrioridadeEnum::BAIXA]);
        Solicitacao::factory()->create(['prioridade' => PrioridadeEnum::URGENTE]);

        $response = $this->getJson('/api/v1/solicitacoes?prioridade=URGENTE');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
    }

    public function test_can_search_by_nome()
    {
        Solicitacao::factory()->create(['nome_solicitante' => 'João da Silva']);
        Solicitacao::factory()->create(['nome_solicitante' => 'Maria Santos']);

        $response = $this->getJson('/api/v1/solicitacoes?busca=João');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
    }

    public function test_can_filter_by_period()
    {
        Solicitacao::factory()->create(['created_at' => '2026-09-01 10:00:00']);
        Solicitacao::factory()->create(['created_at' => '2026-09-10 15:30:00']);
        Solicitacao::factory()->create(['created_at' => '2026-09-20 08:00:00']);

        $response = $this->getJson('/api/v1/solicitacoes?data_inicio=2026-09-05&data_fim=2026-09-15');

        $response->assertStatus(200);
        $this->assertSame(1, $response->json('total'));
    }

    public function test_can_filter_by_start_date_only()
    {
        Solicitacao::factory()->create(['created_at' => '2026-09-01 10:00:00']);
        Solicitacao::factory()->create(['created_at' => '2026-09-20 08:00:00']);

        $response = $this->getJson('/api/v1/solicitacoes?data_inicio=2026-09-15');

        $response->assertStatus(200);
        $this->assertSame(1, $response->json('total'));
    }

    public function test_rejects_invalid_period_range()
    {
        $this->getJson('/api/v1/solicitacoes?data_inicio=2026-09-20&data_fim=2026-09-10')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['data_fim']);
    }

    // ==================== STORE ====================

    public function test_can_create_solicitacao()
    {
        $data = [
            'nome_solicitante' => 'João da Silva',
            'categoria' => 'CONSULTA',
            'prioridade' => 'MEDIA',
            'descricao' => 'Descrição de teste',
        ];

        $response = $this->postJson('/api/v1/solicitacoes', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'protocolo',
                    'nome_solicitante',
                    'categoria',
                    'prioridade',
                    'status',
                ]
            ]);

        $this->assertDatabaseHas('solicitacoes', [
            'nome_solicitante' => 'João da Silva',
            'categoria' => 'CONSULTA',
            'prioridade' => 'MEDIA',
            'status' => 'RECEBIDA', // Status inicial padrão
        ]);
    }

    public function test_validates_required_fields()
    {
        $response = $this->postJson('/api/v1/solicitacoes', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nome_solicitante', 'categoria', 'prioridade']);
    }

    public function test_validates_justificativa_for_urgente()
    {
        $data = [
            'nome_solicitante' => 'João da Silva',
            'categoria' => 'CONSULTA',
            'prioridade' => 'URGENTE',
            // Missing justificativa_prioridade
        ];

        $response = $this->postJson('/api/v1/solicitacoes', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['justificativa_prioridade']);
    }

    public function test_can_create_urgente_with_justificativa()
    {
        $data = [
            'nome_solicitante' => 'João da Silva',
            'categoria' => 'CONSULTA',
            'prioridade' => 'URGENTE',
            'justificativa_prioridade' => 'Paciente idoso com sintomas graves',
        ];

        $response = $this->postJson('/api/v1/solicitacoes', $data);

        $response->assertStatus(201);

        $this->assertDatabaseHas('solicitacoes', [
            'nome_solicitante' => 'João da Silva',
            'prioridade' => 'URGENTE',
            'justificativa_prioridade' => 'Paciente idoso com sintomas graves',
        ]);
    }

    public function test_generates_unique_protocolo()
    {
        $data = [
            'nome_solicitante' => 'João da Silva',
            'categoria' => 'CONSULTA',
            'prioridade' => 'BAIXA',
        ];

        $response = $this->postJson('/api/v1/solicitacoes', $data);
        $protocolo = $response->json('data.protocolo');

        $this->assertNotNull($protocolo);
        $this->assertEquals(10, strlen($protocolo));
    }

    // ==================== SHOW ====================

    public function test_can_show_solicitacao()
    {
        $solicitacao = Solicitacao::factory()->create();

        $response = $this->getJson("/api/v1/solicitacoes/{$solicitacao->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id' => $solicitacao->id,
                'protocolo' => $solicitacao->protocolo,
                'nome_solicitante' => $solicitacao->nome_solicitante,
            ]);
    }

    public function test_returns_404_for_nonexistent_solicitacao()
    {
        $response = $this->getJson('/api/v1/solicitacoes/99999');

        $response->assertStatus(404);
    }

    // ==================== UPDATE STATUS ====================

    public function test_can_update_status_with_valid_transition()
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::RECEBIDA]);

        $response = $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", [
            'status' => 'EM_ANALISE',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Status atualizado com sucesso',
            ]);

        $this->assertDatabaseHas('solicitacoes', [
            'id' => $solicitacao->id,
            'status' => 'EM_ANALISE',
        ]);
    }

    public function test_cannot_update_status_with_invalid_transition()
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::RECEBIDA]);

        // Trying to skip to AGENDADA (should go through EM_ANALISE first)
        $response = $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", [
            'status' => 'AGENDADA',
        ]);

        $response->assertStatus(422);

        // Status should remain unchanged
        $this->assertDatabaseHas('solicitacoes', [
            'id' => $solicitacao->id,
            'status' => 'RECEBIDA',
        ]);
    }

    public function test_can_cancel_from_any_valid_state()
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::EM_ANALISE]);

        $response = $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", [
            'status' => 'CANCELADA',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('solicitacoes', [
            'id' => $solicitacao->id,
            'status' => 'CANCELADA',
        ]);
    }

    public function test_cannot_change_status_from_terminal_state()
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::CONCLUIDA]);

        $response = $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", [
            'status' => 'CANCELADA',
        ]);

        $response->assertStatus(422);

        // Status should remain unchanged
        $this->assertDatabaseHas('solicitacoes', [
            'id' => $solicitacao->id,
            'status' => 'CONCLUIDA',
        ]);
    }

    public function test_full_status_workflow()
    {
        // Create a new solicitação
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::RECEBIDA]);

        // RECEBIDA -> EM_ANALISE
        $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", ['status' => 'EM_ANALISE'])
            ->assertStatus(200);

        // EM_ANALISE -> AGENDADA
        $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", ['status' => 'AGENDADA'])
            ->assertStatus(200);

        // AGENDADA -> CONCLUIDA
        $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", ['status' => 'CONCLUIDA'])
            ->assertStatus(200);

        // Verify final state
        $this->assertDatabaseHas('solicitacoes', [
            'id' => $solicitacao->id,
            'status' => 'CONCLUIDA',
        ]);

        // Trying to change from CONCLUIDA should fail
        $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", ['status' => 'CANCELADA'])
            ->assertStatus(422);
    }

    public function test_cannot_mass_assign_status_or_protocolo()
    {
        $response = $this->postJson('/api/v1/solicitacoes', [
            'nome_solicitante' => 'João da Silva',
            'categoria' => 'CONSULTA',
            'prioridade' => 'BAIXA',
            'status' => 'CONCLUIDA',
            'protocolo' => 'HACKED1234',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'RECEBIDA');

        $this->assertNotEquals('HACKED1234', $response->json('data.protocolo'));
        $this->assertDatabaseHas('solicitacoes', [
            'nome_solicitante' => 'João da Silva',
            'status' => 'RECEBIDA',
        ]);
    }

    public function test_rejects_invalid_filter_values()
    {
        $this->getJson('/api/v1/solicitacoes?status=DROP_TABLE')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_escapes_like_wildcards_in_search()
    {
        Solicitacao::factory()->create(['nome_solicitante' => 'Ana Souza']);
        Solicitacao::factory()->create(['nome_solicitante' => 'Bruno Lima']);

        $response = $this->getJson('/api/v1/solicitacoes?busca=%');

        $response->assertStatus(200);
        $this->assertSame(0, $response->json('total'));
    }

    public function test_strips_html_from_nome()
    {
        $response = $this->postJson('/api/v1/solicitacoes', [
            'nome_solicitante' => '<b>Maria Clara</b>',
            'categoria' => 'EXAME',
            'prioridade' => 'BAIXA',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.nome_solicitante', 'Maria Clara');
    }

    public function test_not_found_does_not_leak_exception_details()
    {
        $response = $this->getJson('/api/v1/solicitacoes/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Recurso não encontrado',
            ])
            ->assertJsonMissingPath('exception')
            ->assertJsonMissingPath('file')
            ->assertJsonMissingPath('trace');
    }

    public function test_security_headers_are_present()
    {
        $this->getJson('/api/v1/solicitacoes')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
