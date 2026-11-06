import * as numberGenerator from './number-generator.js';
import { layoutItems } from './number-layout.js';
import { KeyboardController, PLAYER_KEYS } from './keyboard-controller.js';
import { Scoring } from './scoring.js';
import { Timer } from './timer.js';

export const TOTAL_TARGETS = 30;
export const TARGET_SECONDS = 10;
export const ANSWER_SECONDS = 3;
const REVEAL_MS = 900;

// States: idle -> countdown -> playing <-> answering -> reveal -> ... -> finished
export class GameEngine {
  constructor({ arena, ui, generator = numberGenerator }) {
    this.generator = generator;
    this.arena = arena;
    this.ui = ui;
    this.state = 'idle';
    this.timer = new Timer({
      onTick: (rem, dur) => ui.onTick(rem, dur),
      onExpire: () => this._onTargetTimeout(),
    });
    this.answerTimer = new Timer({
      onTick: (rem, dur) => ui.onAnswerTick(rem, dur),
      onExpire: () => this._resolveWrong(this.answering.playerId, 'timeout'),
    });
    this.keyboard = new KeyboardController((id) => this._onKey(id));
    this._timeouts = [];
    arena.addEventListener('click', (e) => this._onArenaClick(e));
    // Registered before the keyboard controller's listener, so the buzzer keydown
    // is handled first as a buzz and never counted as a typed letter.
    window.addEventListener('keydown', (e) => this._onType(e));
  }

  start(config) {
    this.reset();
    this.config = config;
    this.players = PLAYER_KEYS.slice(0, config.players);
    this.scoring = new Scoring(this.players);
    this.targets = this.generator.generateTargets(TOTAL_TARGETS, config);
    this.index = -1;
    this.missed = 0;
    this.keyboard.enable(config.players);
    this.state = 'countdown';
    this.ui.onStart(this.players);
    this.ui.onScores(this.scoring.snapshot(), null);
    this._countdown(3);
  }

  reset() {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
    this.timer.stop();
    this.answerTimer.stop();
    this.keyboard.disable();
    this.state = 'idle';
    this.arena.innerHTML = '';
  }

  _later(fn, ms) {
    this._timeouts.push(setTimeout(fn, ms));
  }

  _countdown(n) {
    if (this.state !== 'countdown') return;
    this.ui.onCountdown(n);
    if (n === 0) {
      this._later(() => this._nextTarget(), 600);
      return;
    }
    this._later(() => this._countdown(n - 1), 1000);
  }

  _nextTarget() {
    this.index++;
    if (this.index >= TOTAL_TARGETS) return this._finish();
    this.target = this.targets[this.index];
    this.lockedOut = new Set(); // players who answered wrong on this target
    this.answering = null;
    this.firstPresser = null;
    this.resolved = false;

    if (this.generator.typing) {
      this.arena.innerHTML = this.generator.arenaHTML
        ? this.generator.arenaHTML(this.target)
        : `<div class="arena-hint">${this.generator.typingHint}</div>`;
    } else {
      const items = this.generator.generateRound({
        target: this.target,
        decoyCount: this.config.decoys,
        difficulty: this.config.difficulty,
      });
      const { clientWidth: w, clientHeight: h } = this.arena;
      const { placed } = layoutItems(items, w, h);
      this._render(placed);
    }

    this.state = 'playing';
    this.ui.onTarget(this.target, this.index + 1, TOTAL_TARGETS);
    this.ui.onStatus('playing');
    this.timer.start(this.generator.targetSeconds?.(this.config) ?? TARGET_SECONDS);
  }

  _render(placed) {
    this.arena.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const it of placed) {
      const el = document.createElement('span');
      el.className = 'num';
      el.textContent = it.value;
      el.dataset.value = it.value;
      if (it.isTarget) el.dataset.target = '1';
      Object.assign(el.style, {
        left: `${it.x}px`, top: `${it.y}px`, width: `${it.w}px`, height: `${it.h}px`,
        fontSize: `${it.fontSize}px`, fontWeight: it.fontWeight, color: it.color,
        transform: `rotate(${it.rotation.toFixed(1)}deg)`,
      });
      frag.appendChild(el);
    }
    this.arena.appendChild(frag);
  }

  _onKey(playerId) {
    if (this.state !== 'playing' || this.lockedOut.has(playerId)) return;
    if (!this.firstPresser) {
      this.firstPresser = playerId;
      this.scoring.markFastest(playerId);
    }
    // Pause everything while one player answers; others are locked out until resolved.
    this.state = 'answering';
    this.answering = { playerId, reaction: Math.round(this.timer.elapsed) };
    this.timer.pause();
    this.ui.onStatus('answering', playerId);
    this.ui.onScores(this.scoring.snapshot(), this.scoring.fastestId);
    this.arena.classList.add('answering');
    this.progress = 0;
    this.typed = [];
    this._startAnswerTimer();
  }

  _startAnswerTimer() {
    this.answerTimer.start(this.generator.answerSeconds?.(this.target) ?? ANSWER_SECONDS);
  }

  _resetProgress() {
    this.progress = 0;
    this.typed = [];
    this.ui.onProgress?.(this.target.guess ? [] : 0);
  }

  // Word-completion mode: the answering player types the missing letters in order.
  _onType(e) {
    if (this.state !== 'answering' || !this.generator.typing) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const id = this.answering.playerId;

    // Guess mode: type the whole answer, Backspace allowed, checked once complete.
    if (this.target.guess) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.typed.pop();
        return this.ui.onProgress?.([...this.typed]);
      }
      if (e.repeat || !/^[a-zA-Z]$/.test(e.key)) return;
      e.preventDefault();
      e.stopImmediatePropagation(); // keep typed letters from buzzing other players
      this.typed.push(e.key.toUpperCase());
      this.ui.onProgress?.([...this.typed]);
      if (this.typed.length < this.target.missing.length) return;
      this.answerTimer.stop();
      return this.typed.join('') === this.target.missing.join('')
        ? this._resolveCorrect(id)
        : this._resolveWrong(id, 'wrong');
    }

    if (e.repeat || !/^[a-zA-Z]$/.test(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key.toUpperCase() !== this.target.missing[this.progress]) {
      this.answerTimer.stop();
      return this._resolveWrong(id, 'wrong');
    }
    this.progress++;
    this.ui.onProgress?.(this.progress);
    if (this.progress >= this.target.missing.length) {
      this.answerTimer.stop();
      return this._resolveCorrect(id);
    }
    this._startAnswerTimer();
  }

  _onArenaClick(e) {
    if (this.state !== 'answering' || this.generator.typing) return;
    const el = e.target.closest('.num');
    if (!el) return;
    const id = this.answering.playerId;

    this.answerTimer.stop();
    if (el.dataset.target) this._resolveCorrect(id, el);
    else this._resolveWrong(id, 'wrong', el);
  }

  _resolveCorrect(id, el) {
    if (this.resolved) return; // one reward per target
    this.resolved = true;
    this.answerTimer.stop();
    this.scoring.correct(id, this.answering.reaction);
    this.arena.classList.remove('answering');
    el?.classList.add('found');
    this.state = 'reveal';
    this.ui.onResult('correct', id, el);
    this.ui.onScores(this.scoring.snapshot(), this.scoring.fastestId);
    this._later(() => this._nextTarget(), REVEAL_MS);
  }

  _resolveWrong(id, reason, el) {
    if (this.state !== 'answering') return;
    this.answerTimer.stop();
    this.scoring.wrong(id);
    this.lockedOut.add(id);
    this.arena.classList.remove('answering');
    if (el) {
      el.classList.add('wrong');
      setTimeout(() => el.classList.remove('wrong'), 500);
    }
    this.ui.onResult('wrong', id, el, reason);
    this.ui.onScores(this.scoring.snapshot(), this.scoring.fastestId);
    this.answering = null;
    if (Array.isArray(this.target.missing)) this._resetProgress();
    if (this.lockedOut.size >= this.players.length) {
      // Everyone failed this target: treat as missed.
      this.timer.stop();
      this._miss();
      return;
    }
    this.state = 'playing';
    this.ui.onStatus('playing');
    this.timer.resume();
  }

  _onTargetTimeout() {
    if (this.state !== 'playing') return;
    this._miss();
  }

  _miss() {
    this.missed++;
    this.state = 'reveal';
    this.arena.querySelectorAll('[data-target]').forEach((n) => n.classList.add('revealed'));
    this.ui.onResult('missed');
    this._later(() => this._nextTarget(), REVEAL_MS + 400);
  }

  _finish() {
    this.state = 'finished';
    this.keyboard.disable();
    this.timer.stop();
    this.ui.onFinish({
      ranking: this.scoring.ranking(),
      players: this.players,
      missed: this.missed,
      config: this.config,
    });
  }
}
