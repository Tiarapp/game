<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Models\GameSessionPlayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    public function hub()
    {
        $games = [
            ['title' => 'Number Hunt', 'desc' => 'Cari angka secepat mungkin. 2–10 pemain, satu keyboard.', 'icon' => '🔢', 'url' => route('number-hunt'), 'color' => '#00e5ff', 'players' => '2–10 pemain'],
            ['title' => 'Word Hunt', 'desc' => 'Lengkapi kata yang hurufnya hilang. Dari mudah sampai expert.', 'icon' => '🔤', 'url' => route('word-hunt'), 'color' => '#ffd740', 'players' => '2–10 pemain'],
            ['title' => 'Tebak Gambar', 'desc' => 'Tebak gambar emoji dengan petunjuk di luar nalar. Ketik jawabannya!', 'icon' => '🖼️', 'url' => route('tebak-gambar'), 'color' => '#ff3b6b', 'players' => '2–10 pemain'],
        ];

        return view('hub', compact('games'));
    }

    public function index()
    {
        return view('game', ['game' => [
            'key' => 'number_hunt',
            'title' => ['NUMBER', 'HUNT'],
            'label' => 'CARI ANGKA',
            'noun' => 'angka',
            'tagline' => 'Cari angkanya. Tekan tombolmu. Klik angkanya!',
            'prompt' => 'KLIK ANGKANYA!',
            'rules' => 'Tekan tombolmu saat menemukan angka, lalu klik angkanya (3 detik).',
            'decoys' => [30, 50, 80, 100],
            'defaults' => ['difficulty' => 'normal', 'decoys' => 50],
            'levels' => [
                'easy' => ['label' => 'Easy', 'hint' => 'Angka tidak lebih kecil dari 20px, tanpa angka mirip.'],
                'normal' => ['label' => 'Normal', 'hint' => 'Angka kecil mulai 12px, sedikit angka mirip (mis. 27 dan 72).'],
                'hard' => ['label' => 'Hard', 'hint' => 'Angka kecil mulai 12px, banyak angka mirip target.'],
            ],
        ]]);
    }

    public function word()
    {
        return view('game', ['game' => [
            'key' => 'word_hunt',
            'title' => ['WORD', 'HUNT'],
            'label' => 'LENGKAPI KATA',
            'noun' => 'huruf',
            'tagline' => 'Lengkapi katanya! Ketik huruf yang hilang secepat mungkin.',
            'prompt' => 'KETIK HURUF YANG HILANG!',
            'rules' => 'Tekan tombolmu saat tahu huruf yang hilang, lalu ketik huruf-huruf yang hilang berurutan dari kiri ke kanan (3 detik per huruf).',
            'decoys' => [],
            'defaults' => ['difficulty' => 'normal', 'decoys' => 50],
            'levels' => [
                'easy' => ['label' => 'Easy', 'hint' => 'Kata pendek, 1 huruf hilang, ada petunjuk.'],
                'normal' => ['label' => 'Normal', 'hint' => 'Kata sedang, 2 huruf hilang, ada petunjuk.'],
                'hard' => ['label' => 'Hard', 'hint' => 'Kata panjang, 3 huruf hilang, huruf lebih kecil.'],
                'expert' => ['label' => 'Expert', 'hint' => 'Setengah huruf hilang, tanpa petunjuk, 18 detik.'],
            ],
        ]]);
    }

    public function picture()
    {
        return view('game', ['game' => [
            'key' => 'picture_guess',
            'title' => ['TEBAK', 'GAMBAR'],
            'label' => 'TEBAK GAMBAR',
            'noun' => 'huruf',
            'tagline' => 'Tebak gambar emoji dari petunjuk yang di luar nalar!',
            'prompt' => 'KETIK JAWABANNYA!',
            'rules' => 'Tekan tombolmu saat tahu jawabannya, lalu ketik jawaban lengkap (Backspace untuk koreksi, 10 detik).',
            'decoys' => [],
            'defaults' => ['difficulty' => 'normal', 'decoys' => 50],
            'levels' => [
                'easy' => ['label' => 'Easy', 'hint' => '2 huruf terbuka, clue ngawur langsung muncul, 20 detik.'],
                'normal' => ['label' => 'Normal', 'hint' => '1 huruf terbuka, clue ngawur muncul, 18 detik.'],
                'hard' => ['label' => 'Hard', 'hint' => 'Tanpa huruf terbuka, clue baru muncul di separuh waktu, 16 detik.'],
                'expert' => ['label' => 'Expert', 'hint' => 'Gambar buram yang makin jelas, dicampur emoji pengecoh, tanpa clue, 14 detik.'],
            ],
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'game' => 'sometimes|in:number_hunt,word_hunt,picture_guess',
            'player_count' => 'required|integer|between:2,10',
            'difficulty' => 'required|in:easy,normal,hard,expert',
            'decoy_count' => 'required|integer|between:10,100',
            'total_targets' => 'required|integer|between:1,30',
            'missed_targets' => 'required|integer|min:0|max:30',
            'players' => 'required|array|min:2|max:10',
            'players.*.slot' => 'required|integer|between:1,10',
            'players.*.key' => 'required|string|max:2',
            'players.*.score' => 'required|integer',
            'players.*.correct' => 'required|integer|min:0|max:30',
            'players.*.wrong' => 'required|integer|min:0|max:500',
            'players.*.accuracy' => 'required|numeric|between:0,100',
            'players.*.rank' => 'required|integer|between:1,10',
            'players.*.avg_reaction_ms' => 'nullable|integer|min:0',
        ]);

        $session = DB::transaction(function () use ($data) {
            $winner = collect($data['players'])->firstWhere('rank', 1);
            $session = GameSession::create([
                'game' => $data['game'] ?? 'number_hunt',
                'player_count' => $data['player_count'],
                'difficulty' => $data['difficulty'],
                'decoy_count' => $data['decoy_count'],
                'total_targets' => $data['total_targets'],
                'missed_targets' => $data['missed_targets'],
                'winner_slot' => $winner['slot'] ?? null,
            ]);
            foreach ($data['players'] as $p) {
                GameSessionPlayer::create($p + ['game_session_id' => $session->id]);
            }
            return $session;
        });

        return response()->json(['id' => $session->id], 201);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'games' => GameSession::count(),
            'wins' => GameSession::selectRaw('winner_slot, count(*) as total')
                ->whereNotNull('winner_slot')->groupBy('winner_slot')
                ->pluck('total', 'winner_slot'),
            'recent' => GameSession::with('players')->latest()->limit(10)->get(),
        ]);
    }
}
