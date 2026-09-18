<?php

namespace App\Models;

use App\Observers\SolicitacaoObserver;
use App\Enums\CategoriaEnum;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use App\Enums\PrioridadeEnum;
use App\Enums\StatusEnum;
use Database\Factories\SolicitacaoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

#[ObservedBy([SolicitacaoObserver::class])]
class Solicitacao extends Model
{
    /** @use HasFactory<SolicitacaoFactory> */
    use HasFactory;

    protected $table = 'solicitacoes';

    protected $fillable = [
        'nome_solicitante',
        'categoria',
        'prioridade',
        'descricao',
        'justificativa_prioridade',
    ];

    protected $casts = [
        'categoria' => CategoriaEnum::class,
        'prioridade' => PrioridadeEnum::class,
        'status' => StatusEnum::class,
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->protocolo)) {
                $model->protocolo = strtoupper(Str::random(10));
            }

            if (empty($model->status)) {
                $model->status = StatusEnum::RECEBIDA;
            }
        });
    }
}
