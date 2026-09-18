<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Http\Middleware\AssignRequestId;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Response;

final class AssignRequestIdTest extends TestCase
{
    public function test_should_accept_opaque_client_request_id_when_format_is_valid(): void
    {
        $middleware = new AssignRequestId;
        $request = Request::create('/api/v1/solicitacoes', 'GET');
        $request->headers->set('X-Request-Id', 'client-req-12345');

        $response = $middleware->handle($request, fn () => new Response('', 200));

        $this->assertSame('client-req-12345', $request->attributes->get(AssignRequestId::ATTRIBUTE));
        $this->assertSame('client-req-12345', $response->headers->get('X-Request-Id'));
    }

    public function test_should_replace_request_id_when_header_contains_injection_characters(): void
    {
        $middleware = new AssignRequestId;
        $request = Request::create('/api/v1/solicitacoes', 'GET');
        $request->headers->set('X-Request-Id', "evil\r\nX-Injected: true");

        $middleware->handle($request, fn () => new Response('', 200));

        $assigned = $request->attributes->get(AssignRequestId::ATTRIBUTE);
        $this->assertIsString($assigned);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $assigned,
        );
    }
}
