<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Solicitacao;
use App\Models\User;

final class SolicitacaoPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Solicitacao $solicitacao): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Solicitacao $solicitacao): bool
    {
        return true;
    }
}
