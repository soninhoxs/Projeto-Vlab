<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            Schema::table('solicitacoes', function (Blueprint $table): void {
                $table->index('protocolo');
            });

            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS solicitacoes_protocolo_index
            ON solicitacoes (protocolo)
        SQL);

        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS solicitacoes_nome_solicitante_trgm_idx
            ON solicitacoes USING gin (nome_solicitante gin_trgm_ops)
        SQL);

        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS solicitacoes_protocolo_trgm_idx
            ON solicitacoes USING gin (protocolo gin_trgm_ops)
        SQL);
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            Schema::table('solicitacoes', function (Blueprint $table): void {
                $table->dropIndex(['protocolo']);
            });

            return;
        }

        DB::statement('DROP INDEX IF EXISTS solicitacoes_protocolo_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS solicitacoes_nome_solicitante_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS solicitacoes_protocolo_index');
    }
};
