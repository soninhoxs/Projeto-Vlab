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

    'enabled' => env('LOG_HTTP_ENABLED', true),

    'channel' => env('LOG_HTTP_CHANNEL', 'api'),

];
