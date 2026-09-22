<?php

declare(strict_types=1);

namespace App\Listeners;

use Illuminate\Foundation\Events\DiagnosingHealth;
use Illuminate\Support\Facades\DB;

/**
 * O /up do Laravel só responde 200 se a aplicação subiu.
 * Este listener faz a rota falhar quando a conexão padrão não executa SELECT 1.
 * No Compose essa conexão é o PostgreSQL.
 */
final class VerificarConexaoDoBanco
{
    public function handle(DiagnosingHealth $event): void
    {
        DB::connection()->select('select 1');
    }
}
