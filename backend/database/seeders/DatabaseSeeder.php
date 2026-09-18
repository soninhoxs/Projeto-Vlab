<?php

namespace Database\Seeders;

use App\Models\Solicitacao;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Solicitacao::factory(30)->create();
    }
}
