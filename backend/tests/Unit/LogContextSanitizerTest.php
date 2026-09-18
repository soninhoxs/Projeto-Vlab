<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\Logging\LogContextSanitizer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class LogContextSanitizerTest extends TestCase
{
    public function test_should_redact_sensitive_fields_when_logging_domain_context(): void
    {
        // Arrange
        $context = [
            'protocolo' => 'VL-2026-0001',
            'nome_solicitante' => 'Maria Clara',
            'nested' => ['descricao' => 'Dado clínico'],
        ];

        // Act
        $sanitized = LogContextSanitizer::sanitize($context);

        // Assert
        $this->assertSame('VL-2026-0001', $sanitized['protocolo']);
        $this->assertSame('[redacted]', $sanitized['nome_solicitante']);
        $this->assertSame('[redacted]', $sanitized['nested']['descricao']);
    }

    public function test_should_truncate_overlong_strings_to_limit_log_exfiltration(): void
    {
        $long = str_repeat('a', 600);

        $sanitized = LogContextSanitizer::sanitize(['note' => $long]);

        $this->assertIsString($sanitized['note']);
        $this->assertSame(512 + strlen('…'), strlen($sanitized['note']));
        $this->assertStringEndsWith('…', $sanitized['note']);
    }

    #[DataProvider('sensitiveKeyProvider')]
    public function test_should_redact_when_key_contains_sensitive_fragment(string $key): void
    {
        $sanitized = LogContextSanitizer::sanitize([$key => 'valor']);

        $this->assertSame('[redacted]', $sanitized[$key]);
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function sensitiveKeyProvider(): array
    {
        return [
            'password' => ['password'],
            'authorization header key' => ['authorization'],
            'nested token' => ['api_token'],
        ];
    }
}
