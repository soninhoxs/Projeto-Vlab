<?php

declare(strict_types=1);

namespace App\Events;

interface EventoDeDominio
{
    public function nome(): string;

    /**
     * Campos operacionais. Sem nome, descrição ou justificativa.
     *
     * @return array<string, int|string>
     */
    public function contexto(): array;
}
