<?php

namespace Tests\Unit;

use App\Enums\StatusEnum; // Must use standard TestCase to boot Laravel for models
use App\Models\Solicitacao;
use App\Services\StatusTransitionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class StatusTransitionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_allows_valid_transition()
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::RECEBIDA]);
        $service = new StatusTransitionService;

        $result = $service->transition($solicitacao, StatusEnum::EM_ANALISE);

        $this->assertTrue($result);
        $this->assertEquals(StatusEnum::EM_ANALISE, $solicitacao->fresh()->status);
    }

    public function test_it_prevents_invalid_transition()
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::RECEBIDA]);
        $service = new StatusTransitionService;

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Transição de status inválida');

        // Trying to skip EM_ANALISE and go straight to AGENDADA
        $service->transition($solicitacao, StatusEnum::AGENDADA);
    }

    public function test_it_allows_cancellation_from_any_valid_state()
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::AGENDADA]);
        $service = new StatusTransitionService;

        $result = $service->transition($solicitacao, StatusEnum::CANCELADA);

        $this->assertTrue($result);
        $this->assertEquals(StatusEnum::CANCELADA, $solicitacao->fresh()->status);
    }
}
