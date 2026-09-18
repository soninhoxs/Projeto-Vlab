<?php

namespace App\Support\Http;

/**
 * Classes de resposta HTTP conforme RFC 9110 / MDN.
 *
 * @see https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status
 */
enum HttpStatusCategory: string
{
    case Informational = 'informational';
    case Successful = 'successful';
    case Redirection = 'redirection';
    case ClientError = 'client_error';
    case ServerError = 'server_error';
    case Unknown = 'unknown';

    public function labelPt(): string
    {
        return match ($this) {
            self::Informational => 'Resposta informativa',
            self::Successful => 'Resposta bem-sucedida',
            self::Redirection => 'Redirecionamento',
            self::ClientError => 'Erro do cliente',
            self::ServerError => 'Erro do servidor',
            self::Unknown => 'Desconhecida',
        };
    }
}
