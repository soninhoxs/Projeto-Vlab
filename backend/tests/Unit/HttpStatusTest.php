<?php

namespace Tests\Unit;

use App\Support\Http\HttpStatus;
use App\Support\Http\HttpStatusCategory;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Psr\Log\LogLevel;

class HttpStatusTest extends TestCase
{
    #[DataProvider('categoryProvider')]
    public function test_category_matches_mdn_ranges(int $code, HttpStatusCategory $expected): void
    {
        $this->assertSame($expected, HttpStatus::category($code));
    }

    public static function categoryProvider(): array
    {
        return [
            [100, HttpStatusCategory::Informational],
            [200, HttpStatusCategory::Successful],
            [201, HttpStatusCategory::Successful],
            [302, HttpStatusCategory::Redirection],
            [404, HttpStatusCategory::ClientError],
            [422, HttpStatusCategory::ClientError],
            [429, HttpStatusCategory::ClientError],
            [500, HttpStatusCategory::ServerError],
            [503, HttpStatusCategory::ServerError],
        ];
    }

    #[DataProvider('logLevelProvider')]
    public function test_log_level_for_status(int $code, string $expectedLevel): void
    {
        $this->assertSame($expectedLevel, HttpStatus::logLevel($code));
    }

    public static function logLevelProvider(): array
    {
        return [
            [200, LogLevel::INFO],
            [201, LogLevel::INFO],
            [404, LogLevel::WARNING],
            [422, LogLevel::WARNING],
            [429, LogLevel::WARNING],
            [500, LogLevel::ERROR],
        ];
    }

    public function test_reason_phrase_for_api_codes(): void
    {
        $this->assertSame('Created', HttpStatus::reasonPhrase(201));
        $this->assertSame('Unprocessable Content', HttpStatus::reasonPhrase(422));
        $this->assertSame('Too Many Requests', HttpStatus::reasonPhrase(429));
    }
}
