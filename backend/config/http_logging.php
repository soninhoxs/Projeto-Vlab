<?php

return [

    /*
    |--------------------------------------------------------------------------
    | HTTP request/response logging
    |--------------------------------------------------------------------------
    |
    | Registra cada resposta da API com código HTTP, categoria (MDN) e duração.
    | Corpos de requisição não são logados (dados de saúde / solicitantes).
    |
    */

    'enabled' => filter_var(env('LOG_HTTP_ENABLED', true), FILTER_VALIDATE_BOOL),

    'channel' => env('LOG_HTTP_CHANNEL', 'api'),

    /*
     * GET da fila 2xx abaixo de 400 ms não grava http.response quando a saída
     * é arquivo. No Compose (stderr) isso fica desligado para a listagem
     * aparecer em `docker logs`.
     */
    'skip_fast_index' => filter_var(env('LOG_HTTP_SKIP_FAST_INDEX', true), FILTER_VALIDATE_BOOL),

];
