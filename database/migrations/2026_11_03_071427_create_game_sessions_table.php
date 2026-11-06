<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('player_count');
            $table->string('difficulty', 16);
            $table->unsignedSmallInteger('decoy_count');
            $table->unsignedTinyInteger('total_targets');
            $table->unsignedTinyInteger('missed_targets')->default(0);
            $table->unsignedTinyInteger('winner_slot')->nullable();
            $table->timestamps();
        });

        Schema::create('game_session_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained('game_sessions')->cascadeOnDelete();
            $table->unsignedTinyInteger('slot');
            $table->string('key', 2);
            $table->integer('score');
            $table->unsignedSmallInteger('correct');
            $table->unsignedSmallInteger('wrong');
            $table->decimal('accuracy', 5, 2);
            $table->unsignedTinyInteger('rank');
            $table->unsignedInteger('avg_reaction_ms')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_session_players');
        Schema::dropIfExists('game_sessions');
    }
};
