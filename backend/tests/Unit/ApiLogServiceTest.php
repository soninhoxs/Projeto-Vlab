<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Http\Middleware\AssignRequestId;
use App\Services\ApiLogService;
use Illuminate\Http\Request;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ApiLogServiceTest extends TestCase
{
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

    public function test_should_not_write_logs_when_http_logging_is_disabled(): void
    {
        config(['http_logging.enabled' => false]);
        $logged = $this->captureLoggedMessages();

        $request = Request::create('/api/v1/solicitacoes', 'GET');
        app(ApiLogService::class)->logDomainEvent($request, 'solicitacao.created', [
            'protocolo' => 'VL-1',
        ]);

        $this->assertTrue($logged->isEmpty());
    }

    public function test_should_redact_sensitive_fields_in_domain_event_logs(): void
    {
        config(['http_logging.enabled' => true, 'http_logging.channel' => 'api']);
        $logged = $this->captureLoggedMessages();

        $request = Request::create('/api/v1/solicitacoes', 'POST');

        app(ApiLogService::class)->logDomainEvent($request, 'solicitacao.created', [
            'protocolo' => 'VL-2026-0002',
            'nome_solicitante' => 'Não deve aparecer',
        ]);

        $entry = $logged->first(fn (MessageLogged $e) => $e->message === 'solicitacao.created');
        $this->assertNotNull($entry);
        $this->assertSame('[redacted]', $entry->context['nome_solicitante'] ?? null);
        $this->assertSame('VL-2026-0002', $entry->context['protocolo'] ?? null);
    }

    public function test_should_skip_http_response_log_for_non_api_paths(): void
    {
        config(['http_logging.enabled' => true, 'http_logging.channel' => 'api']);
        $logged = $this->captureLoggedMessages();

        $service = app(ApiLogService::class);
        $request = Request::create('/dashboard', 'GET');
        $response = new Response('', 200);

        $service->logHttpResponse($request, $response, hrtime(true));

        $this->assertTrue($logged->isEmpty());
    }

    public function test_should_include_request_id_in_domain_event_logs(): void
    {
        config(['http_logging.enabled' => true, 'http_logging.channel' => 'api']);
        $logged = $this->captureLoggedMessages();

        $request = Request::create('/api/v1/solicitacoes', 'POST');
        $request->attributes->set(AssignRequestId::ATTRIBUTE, 'test-request-id');

        app(ApiLogService::class)->logDomainEvent($request, 'solicitacao.created', [
            'protocolo' => 'VL-2026-0001',
        ]);

        $entry = $logged->first(fn (MessageLogged $e) => $e->message === 'solicitacao.created');
        $this->assertNotNull($entry);
        $this->assertSame('test-request-id', $entry->context['request_id'] ?? null);
        $this->assertSame('VL-2026-0001', $entry->context['protocolo'] ?? null);
    }
}
