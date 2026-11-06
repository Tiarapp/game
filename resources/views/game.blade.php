<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $game['title'][0] }} {{ $game['title'][1] }}</title>
    <link rel="stylesheet" href="{{ asset('vendor/bootstrap.min.css') }}">
    <link rel="stylesheet" href="{{ asset('css/game.css') }}">
</head>
<body>
<div id="app">

    {{-- MENU --}}
    <section id="screen-menu" class="screen active">
        <div class="container menu-wrap text-center">
            <a href="{{ route('hub') }}" class="back-link">← Semua Game</a>
            <h1 class="logo">{{ $game['title'][0] }} <span>{{ $game['title'][1] }}</span></h1>
            <p class="tagline">{{ $game['tagline'] }}</p>

            <div class="panel mx-auto">
                <div class="setting">
                    <label>Jumlah Pemain</label>
                    <div class="btn-group choice flex-wrap" data-setting="players">
                        <button class="btn" data-value="2">2</button>
                        <button class="btn" data-value="3">3</button>
                        <button class="btn" data-value="4">4</button>
                        <button class="btn" data-value="5">5</button>
                        <button class="btn" data-value="6">6</button>
                        <button class="btn" data-value="7">7</button>
                        <button class="btn" data-value="8">8</button>
                        <button class="btn" data-value="9">9</button>
                        <button class="btn" data-value="10">10</button>
                    </div>
                </div>
                <div class="setting">
                    <label>Tingkat Kesulitan</label>
                    <div class="btn-group choice" data-setting="difficulty">
                        @foreach ($game['levels'] as $v => $lv)
                            <button class="btn" data-value="{{ $v }}">{{ $lv['label'] }}</button>
                        @endforeach
                    </div>
                    <div id="level-hint" class="level-hint"></div>
                </div>
                <div class="setting" @if (empty($game['decoys'])) hidden @endif>
                    <label>Jumlah {{ ucfirst($game['noun']) }} Pengecoh</label>
                    <div class="btn-group choice" data-setting="decoys">
                        @foreach ($game['decoys'] as $d)
                            <button class="btn" data-value="{{ $d }}">{{ $d }}</button>
                        @endforeach
                    </div>
                </div>
                <div class="keys-info" id="keys-info"></div>
                <button id="btn-play" class="btn btn-play">▶ PLAY</button>
                <p class="rules">30 target · benar +10 · salah −3<br>
                    {{ $game['rules'] }}</p>
            </div>
        </div>
    </section>

    {{-- GAME --}}
    <section id="screen-game" class="screen">
        <header class="hud">
            <div class="hud-left">
                <div class="hud-label">TARGET <span id="target-index">0/30</span></div>
                <div id="status" class="status">SIAP</div>
            </div>
            <div class="hud-center">
                <div id="target-label" class="hud-label">{{ $game['label'] }}</div>
                <div id="target-number" class="target-number">--</div>
                <div id="target-clue" class="target-clue"></div>
            </div>
            <div class="hud-right">
                <div id="timer-text" class="timer-text">10.0</div>
                <div class="timer-bar"><div id="timer-fill"></div></div>
            </div>
        </header>
        <main class="arena-wrap">
            <div id="arena" class="arena"></div>
            <div id="overlay" class="overlay"></div>
        </main>
        <footer id="scoreboard" class="scoreboard"></footer>
        <button id="btn-quit" class="btn btn-quit" title="Kembali ke menu">✕</button>
    </section>

    {{-- RESULT --}}
    <section id="screen-result" class="screen">
        <div class="container result-wrap text-center">
            <h2 class="logo small">HASIL <span>AKHIR</span></h2>
            <div id="winner-banner" class="winner-banner"></div>
            <div id="result-list" class="result-list"></div>
            <p id="result-meta" class="rules"></p>
            <div class="d-flex gap-3 justify-content-center mt-3">
                <button id="btn-again" class="btn btn-play">↻ Play Again</button>
                <button id="btn-menu" class="btn btn-ghost">Back to Menu</button>
            </div>
        </div>
        <canvas id="confetti"></canvas>
    </section>
</div>

@php
    $cfg = $game;
    $cfg['game'] = $game['key'];
    $cfg['saveUrl'] = route('games.store');
@endphp
<script>window.GAME_CONFIG = @json($cfg);</script>
<script type="module" src="{{ asset('js/game/main.js') }}"></script>
</body>
</html>
