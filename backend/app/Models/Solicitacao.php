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
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use RuntimeException;

#[ObservedBy([SolicitacaoObserver::class])]
class Solicitacao extends Model
{
    /** @use HasFactory<SolicitacaoFactory> */
    use HasFactory;

    public const PROTOCOLO_LENGTH = 10;

    public const PROTOCOLO_MAX_ATTEMPTS = 8;

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

    /**
     * @return HasMany<SolicitacaoStatusHistorico, $this>
     */
    public function statusHistorico(): HasMany
    {
        return $this->hasMany(SolicitacaoStatusHistorico::class)->orderBy('id');
    }

    public static function generateUniqueProtocolo(): string
    {
        for ($attempt = 1; $attempt <= self::PROTOCOLO_MAX_ATTEMPTS; $attempt++) {
            $protocolo = strtoupper(Str::random(self::PROTOCOLO_LENGTH));

            if (! self::query()->where('protocolo', $protocolo)->exists()) {
                return $protocolo;
            }
        }

        throw new RuntimeException('Não foi possível gerar um protocolo único.');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->protocolo)) {
                $model->protocolo = self::generateUniqueProtocolo();
            }

            if (empty($model->status)) {
                $model->status = StatusEnum::RECEBIDA;
            }
        });
    }
}
