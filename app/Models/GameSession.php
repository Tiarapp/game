<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSession extends Model
{
    protected $guarded = [];

    public function players(): HasMany
    {
        return $this->hasMany(GameSessionPlayer::class);
    }
}
