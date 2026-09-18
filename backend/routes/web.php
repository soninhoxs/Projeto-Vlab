<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'V-Lab API',
        'version' => 'v1',
        'docs' => url('/api/v1/solicitacoes'),
    ]);
});
