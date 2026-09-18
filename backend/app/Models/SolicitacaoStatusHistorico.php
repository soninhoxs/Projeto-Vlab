<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\StatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitacaoStatusHistorico extends Model
{
    public $timestamps = true;

    protected $table = 'solicitacao_status_historico';

    const UPDATED_AT = null;

    protected $fillable = [
        'from_status',
        'to_status',
    ];

    protected $casts = [
        'from_status' => StatusEnum::class,
        'to_status' => StatusEnum::class,
        'created_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Solicitacao, $this>
     */
    public function solicitacao(): BelongsTo
    {
        return $this->belongsTo(Solicitacao::class);
    }
}
