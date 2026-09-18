<?php

namespace Tests\Feature;

use App\Models\Solicitacao;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class HttpRequestLoggingTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_fast_successful_list_skips_http_response_log(): void
    {
        config(['http_logging.enabled' => true, 'http_logging.channel' => 'api']);
        $logged = $this->captureLoggedMessages();

        Solicitacao::factory()->count(2)->create();

        $response = $this->getJson('/api/v1/solicitacoes');

        $response->assertOk();
        $response->assertHeader('X-Request-Id');

        $httpLog = $logged->first(
            fn (MessageLogged $entry) => $entry->message === 'http.response',
        );

        $this->assertNull($httpLog);
    }

    public function test_successful_create_logs_http_response_at_info(): void
    {
        config(['http_logging.enabled' => true, 'http_logging.channel' => 'api']);
        $logged = $this->captureLoggedMessages();

        $response = $this->postJson('/api/v1/solicitacoes', [
            'nome_solicitante' => 'João da Silva',
            'categoria' => 'CONSULTA',
            'prioridade' => 'MEDIA',
            'descricao' => 'Descrição de teste',
        ]);

        $response->assertCreated();
        $response->assertHeader('X-Request-Id');

        $httpLog = $logged->first(
            fn (MessageLogged $entry) => $entry->message === 'http.response' && $entry->level === 'info',
        );

        $this->assertNotNull($httpLog);
        $this->assertSame(201, $httpLog->context['status_code'] ?? null);
        $this->assertSame('http.response', $httpLog->context['event'] ?? null);
        $this->assertArrayHasKey('request_id', $httpLog->context);
        $this->assertArrayHasKey('duration_ms', $httpLog->context);
    }

    public function test_validation_error_logs_http_response_at_warning(): void
    {
        config(['http_logging.enabled' => true, 'http_logging.channel' => 'api']);
        $logged = $this->captureLoggedMessages();

        $response = $this->postJson('/api/v1/solicitacoes', []);

        $response->assertStatus(422);

        $httpLog = $logged->first(
            fn (MessageLogged $entry) => $entry->message === 'http.response' && $entry->level === 'warning',
        );

        $this->assertNotNull($httpLog);
        $this->assertSame(422, $httpLog->context['status_code'] ?? null);
        $this->assertSame('Unprocessable Content', $httpLog->context['status_phrase'] ?? null);
    }

    public function test_not_found_logs_warning(): void
    {
        config(['http_logging.enabled' => true, 'http_logging.channel' => 'api']);
        $logged = $this->captureLoggedMessages();

        $response = $this->getJson('/api/v1/solicitacoes/99999');

        $response->assertNotFound();

        $httpLog = $logged->first(
            fn (MessageLogged $entry) => $entry->message === 'http.response' && $entry->level === 'warning',
        );

        $this->assertNotNull($httpLog);
        $this->assertSame(404, $httpLog->context['status_code'] ?? null);
    }
}
