<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\StatusEnum;
use App\Listeners\RegistrarEventoDeDominio;
use App\Models\Solicitacao;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

final class SolicitacaoDomainQueueTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();

        config(['queue.default' => 'database']);
    }

    public function test_criacao_responde_antes_do_worker_e_o_payload_nao_leva_pii(): void
    {
        $logged = $this->captureLoggedMessages();
        $nome = 'Maria Queue Sem Pii';
        $descricao = 'Descricao que nao pode ir para a fila';

        $response = $this->withHeader('X-Request-Id', 'req-queue01')
            ->postJson('/api/v1/solicitacoes', [
                'nome_solicitante' => $nome,
                'categoria' => 'CONSULTA',
                'prioridade' => 'MEDIA',
                'descricao' => $descricao,
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('solicitacao_status_historico', [
            'solicitacao_id' => $response->json('data.id'),
            'from_status' => null,
            'to_status' => 'RECEBIDA',
        ]);
        $this->assertDatabaseCount('jobs', 1);
        $this->assertSame(RegistrarEventoDeDominio::QUEUE, DB::table('jobs')->value('queue'));
        $this->assertNull($logged->first(fn (MessageLogged $entry) => $entry->message === 'solicitacao.created'));

        $payload = (string) DB::table('jobs')->value('payload');
        $this->assertStringContainsString('RegistrarEventoDeDominio', $payload);
        $this->assertStringContainsString($response->json('data.protocolo'), $payload);
        $this->assertStringNotContainsString($nome, $payload);
        $this->assertStringNotContainsString($descricao, $payload);

        $this->artisan('queue:work', [
            'connection' => 'database',
            '--queue' => RegistrarEventoDeDominio::QUEUE,
            '--once' => true,
        ])->assertSuccessful();

        $entry = $logged->first(fn (MessageLogged $event) => $event->message === 'solicitacao.created');
        $this->assertNotNull($entry);
        $this->assertTrue($entry->context['queued']);
        $this->assertSame('req-queue01', $entry->context['request_id']);
        $this->assertSame($response->json('data.protocolo'), $entry->context['protocolo']);
        $this->assertArrayNotHasKey('nome_solicitante', $entry->context);
        $this->assertArrayNotHasKey('descricao', $entry->context);
        $this->assertDatabaseCount('jobs', 0);
    }

    public function test_transicao_valida_enfileira_e_invalida_ou_igual_nao(): void
    {
        $solicitacao = Solicitacao::factory()->create(['status' => StatusEnum::RECEBIDA]);

        $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", [
            'status' => 'RECEBIDA',
        ])->assertOk();

        $this->assertDatabaseCount('jobs', 0);

        $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", [
            'status' => 'AGENDADA',
        ])->assertStatus(422);

        $this->assertDatabaseCount('jobs', 0);
        $this->assertDatabaseHas('solicitacoes', [
            'id' => $solicitacao->id,
            'status' => 'RECEBIDA',
        ]);

        $this->patchJson("/api/v1/solicitacoes/{$solicitacao->id}/status", [
            'status' => 'EM_ANALISE',
        ])->assertOk();

        $this->assertDatabaseCount('jobs', 1);
        $payload = (string) DB::table('jobs')->value('payload');
        $this->assertStringContainsString('EM_ANALISE', $payload);
        $this->assertStringContainsString('RECEBIDA', $payload);
        $this->assertStringNotContainsString($solicitacao->nome_solicitante, $payload);

        $logged = $this->captureLoggedMessages();

        $this->artisan('queue:work', [
            'connection' => 'database',
            '--queue' => RegistrarEventoDeDominio::QUEUE,
            '--once' => true,
        ])->assertSuccessful();

        $entry = $logged->first(fn (MessageLogged $event) => $event->message === 'solicitacao.status_updated');
        $this->assertNotNull($entry);
        $this->assertSame('RECEBIDA', $entry->context['from_status']);
        $this->assertSame('EM_ANALISE', $entry->context['to_status']);
        $this->assertTrue($entry->context['queued']);
    }

    /**
     * @return Collection<int, MessageLogged>
     */
    private function captureLoggedMessages(): Collection
    {
        $captured = collect();

        Event::listen(MessageLogged::class, function (MessageLogged $event) use ($captured): void {
            $captured->push($event);
        });

        return $captured;
    }
}
