<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SolicitacaoController;
use App\Models\Solicitacao;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('auth.login');

    $authMiddleware = config('vlab.api_auth_enabled') ? ['auth:sanctum'] : [];

    Route::middleware($authMiddleware)->group(function () {
        Route::get('solicitacoes', [SolicitacaoController::class, 'index'])
            ->can('viewAny', Solicitacao::class)
            ->name('solicitacoes.index');
        Route::post('solicitacoes', [SolicitacaoController::class, 'store'])
            ->can('create', Solicitacao::class)
            ->name('solicitacoes.store');
        Route::get('solicitacoes/{solicitacao}', [SolicitacaoController::class, 'show'])
            ->can('view', 'solicitacao')
            ->name('solicitacoes.show');
        Route::patch('solicitacoes/{solicitacao}/status', [SolicitacaoController::class, 'updateStatus'])
            ->can('update', 'solicitacao')
            ->name('solicitacoes.status');
    });
});
