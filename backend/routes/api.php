<?php

use App\Http\Controllers\Api\SolicitacaoController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('solicitacoes', [SolicitacaoController::class, 'index'])->name('solicitacoes.index');
    Route::post('solicitacoes', [SolicitacaoController::class, 'store'])->name('solicitacoes.store');
    Route::get('solicitacoes/{solicitacao}', [SolicitacaoController::class, 'show'])->name('solicitacoes.show');
    Route::patch('solicitacoes/{solicitacao}/status', [SolicitacaoController::class, 'updateStatus'])->name('solicitacoes.status');
});
