<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('solicitacoes', function (Blueprint $table) {
            $table->index('status');
            $table->index('categoria');
            $table->index('prioridade');
            $table->index('created_at');
            $table->index('nome_solicitante');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('solicitacoes', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['categoria']);
            $table->dropIndex(['prioridade']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['nome_solicitante']);
        });
    }
};
