import { GameEngine, TOTAL_TARGETS, TARGET_SECONDS } from './game-engine.js';
import { PLAYER_KEYS } from './keyboard-controller.js';

const $ = (s) => document.querySelector(s);
const COLORS = { 1: '#ff3b6b', 2: '#00e5ff', 3: '#ffd740', 4: '#76ff03', 5: '#b388ff', 6: '#ff8a00', 7: '#18ffff', 8: '#f50057', 9: '#69f0ae', 10: '#e0e0e0' };
const CFG = window.GAME_CONFIG;
const GENERATORS = {
  word_hunt: () => import('./word-generator.js'),
  picture_guess: () => import('./picture-generator.js'),
  number_hunt: () => import('./number-generator.js'),
};
const generator = await GENERATORS[CFG.game]();
const settings = { players: 2, ...CFG.defaults };

// ---- screens & menu ----
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${id}`));
}

function syncMenu() {
  document.querySelectorAll('.choice').forEach((g) => {
    g.querySelectorAll('.btn').forEach((b) => b.classList.toggle('active', b.dataset.value === String(settings[g.dataset.setting])));
  });
  $('#level-hint').textContent = CFG.levels[settings.difficulty]?.hint || '';
  $('#keys-info').innerHTML = PLAYER_KEYS.slice(0, settings.players)
    .map((p) => `<span class="keycap" style="--c:${COLORS[p.id]}"><b>${p.label}</b> Player ${p.id}</span>`).join('');
}

document.querySelectorAll('.choice .btn').forEach((b) =>
  b.addEventListener('click', () => {
    const key = b.parentElement.dataset.setting;
    const v = b.dataset.value;
    settings[key] = key === 'difficulty' ? v : Number(v);
    syncMenu();
  }));

// ---- UI callbacks ----
const arena = $('#arena');
const overlay = $('#overlay');
let engine;
let scoreEls = {};
let currentTarget = null;

function flash(text, cls = '') {
  overlay.innerHTML = `<div class="flash ${cls}">${text}</div>`;
}

const ui = {
  onStart(players) {
    show('game');
    $('#target-number').textContent = '--';
    $('#target-index').textContent = `0/${TOTAL_TARGETS}`;
    $('#status').textContent = 'BERSIAP';
    $('#scoreboard').innerHTML = players.map((p) => `
      <div class="pcard" id="p${p.id}" style="--c:${COLORS[p.id]}">
        <div class="pname"><span class="key">${p.label}</span> Player ${p.id}<span class="fast" title="Tercepat">⚡</span></div>
        <div class="pscore">0</div>
        <div class="pstats"><span class="ok">✔ 0</span><span class="bad">✘ 0</span><span class="acc">0%</span></div>
      </div>`).join('');
    $('#scoreboard').classList.toggle('dense', players.length > 4);
    scoreEls = Object.fromEntries(players.map((p) => [p.id, $(`#p${p.id}`)]));
  },
  onCountdown(n) {
    flash(n === 0 ? 'GO!' : n, 'count');
    if (n === 0) setTimeout(() => (overlay.innerHTML = ''), 600);
  },
  onTarget(value, idx) {
    const el = $('#target-number');
    const isWord = typeof value === 'object';
    currentTarget = isWord ? value : null;
    if (isWord) {
      el.innerHTML = value.pattern.map((c) => (c ? `<span class="ch">${c}</span>` : '<span class="ch blank">_</span>')).join('');
    } else {
      el.textContent = value;
    }
    el.classList.toggle('word', isWord);
    $('#target-clue').textContent = isWord && value.clue ? `💡 ${value.clue}` : '';
    el.classList.remove('swap');
    void el.offsetWidth;
    el.classList.add('swap');
    $('#target-index').textContent = `${idx}/${TOTAL_TARGETS}`;
    overlay.innerHTML = '';
    Object.values(scoreEls).forEach((e) => e.classList.remove('active'));
  },
  onTick(rem, dur) {
    $('#timer-text').textContent = (rem / 1000).toFixed(1);
    const pct = (rem / dur) * 100;
    document.querySelector('.pic.blurred:not(.clear)')?.style.setProperty('--blur', `${(pct / 100 * 26).toFixed(1)}px`);
    if (currentTarget?.lateClue && pct <= 50) document.querySelector('.pic-clue.late')?.classList.add('show');
    const fill = $('#timer-fill');
    fill.style.width = `${pct}%`;
    fill.className = pct < 30 ? 'low' : pct < 60 ? 'mid' : '';
  },
  onProgress(p) {
    const typed = Array.isArray(p) ? p : currentTarget.missing.slice(0, p);
    document.querySelectorAll('#target-number .blank').forEach((b, i) => {
      b.textContent = typed[i] || '_';
      b.classList.toggle('filled', Boolean(typed[i]));
    });
  },
  onAnswerTick(rem) {
    $('#status').textContent = `${$('#status').dataset.who} ${CFG.prompt} ${Math.ceil(rem / 1000)}`;
  },
  onStatus(state, playerId) {
    const s = $('#status');
    Object.values(scoreEls).forEach((e) => e.classList.remove('active'));
    if (state === 'answering') {
      s.dataset.who = `PLAYER ${playerId}`;
      s.textContent = `PLAYER ${playerId} ${CFG.prompt}`;
      s.style.color = COLORS[playerId];
      scoreEls[playerId].classList.add('active');
    } else {
      s.textContent = `${CFG.label}!`;
      s.style.color = '';
    }
  },
  onResult(type, id, el, reason) {
    document.querySelector('.pic.blurred')?.classList.add('clear');
    const s = $('#status');
    if (type === 'correct') {
      s.textContent = `PLAYER ${id} +10`;
      s.style.color = COLORS[id];
      flash(`+10`, 'good');
      burstAt(el || $('#target-number'), COLORS[id]);
    } else if (type === 'wrong') {
      s.textContent = `PLAYER ${id} −3 ${reason === 'timeout' ? '(waktu habis)' : ''}`;
      s.style.color = '#ff5252';
      flash('−3', 'bad');
      scoreEls[id]?.classList.add('shake');
      setTimeout(() => scoreEls[id]?.classList.remove('shake'), 500);
    } else {
      document.querySelectorAll('#target-number .blank').forEach((b, i) => {
        b.textContent = currentTarget?.missing[i] ?? '_';
        b.classList.add('revealed');
      });
      document.querySelector('.pic-clue.late')?.classList.add('show');
      s.textContent = 'TERLEWAT';
      s.style.color = '#ffb300';
      flash('TERLEWAT', 'miss');
    }
  },
  onScores(snap, fastestId) {
    for (const s of snap) {
      const c = scoreEls[s.id];
      if (!c) continue;
      c.querySelector('.pscore').textContent = s.score;
      c.querySelector('.ok').textContent = `✔ ${s.correct}`;
      c.querySelector('.bad').textContent = `✘ ${s.wrong}`;
      c.querySelector('.acc').textContent = `${s.accuracy}%`;
      c.classList.toggle('fastest', s.id === fastestId);
    }
  },
  onFinish(result) {
    renderResult(result);
    show('result');
    startConfetti();
    saveResult(result);
  },
};

function burstAt(el, color) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('i');
    p.className = 'spark';
    const a = (i / 14) * Math.PI * 2, d = 40 + Math.random() * 50;
    p.style.cssText = `left:${cx}px;top:${cy}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

// ---- result ----
const MEDALS = ['🥇', '🥈', '🥉'];
function renderResult({ ranking, missed, config }) {
  const top = ranking[0];
  const tie = ranking.filter((r) => r.score === top.score && r.correct === top.correct && r.wrong === top.wrong).length > 1;
  $('#winner-banner').textContent = tie ? '🏆 SERI!' : `🏆 PLAYER ${top.id} MENANG!`;
  $('#result-list').classList.toggle('dense', ranking.length > 4);
  $('#result-list').innerHTML = ranking.map((r) => `
    <div class="rrow" style="--c:${COLORS[r.id]}">
      <div class="rmedal">${MEDALS[r.rank - 1] || `#${r.rank}`}</div>
      <div class="rname">Player ${r.id}</div>
      <div class="rscore">${r.score}<small>poin</small></div>
      <div class="rdetail">✔ ${r.correct} · ✘ ${r.wrong} · Akurasi ${r.accuracy}%
        ${r.avgReaction != null ? `· ⏱ ${(r.avgReaction / 1000).toFixed(2)}s` : ''}</div>
    </div>`).join('');
  $('#result-meta').textContent = `Target terlewat: ${missed} · ${config.players} pemain · ${config.difficulty} ${CFG.game !== 'number_hunt' ? '' : ` · ${config.decoys} pengecoh`}`;
}

async function saveResult({ ranking, missed, config }) {
  try {
    await fetch(CFG.saveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
      },
      body: JSON.stringify({
        game: CFG.game,
        player_count: config.players,
        difficulty: config.difficulty,
        decoy_count: config.decoys,
        total_targets: TOTAL_TARGETS,
        missed_targets: missed,
        players: ranking.map((r) => ({
          slot: r.id, key: PLAYER_KEYS[r.id - 1].label, score: r.score, correct: r.correct,
          wrong: r.wrong, accuracy: r.accuracy, rank: r.rank, avg_reaction_ms: r.avgReaction,
        })),
      }),
    });
  } catch (e) { /* history is optional; the game works offline */ }
}

// ---- confetti ----
let confettiRaf;
function startConfetti() {
  const c = $('#confetti');
  const ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const cols = Object.values(COLORS).concat('#fff');
  const ps = Array.from({ length: 140 }, () => ({
    x: Math.random() * c.width, y: -Math.random() * c.height, s: 4 + Math.random() * 7,
    v: 2 + Math.random() * 4, d: Math.random() * 2 - 1, col: cols[Math.floor(Math.random() * cols.length)],
  }));
  cancelAnimationFrame(confettiRaf);
  const step = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of ps) {
      p.y += p.v; p.x += p.d;
      if (p.y > c.height) { p.y = -10; p.x = Math.random() * c.width; }
      ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.s, p.s * 0.6);
    }
    confettiRaf = requestAnimationFrame(step);
  };
  step();
}
const stopConfetti = () => cancelAnimationFrame(confettiRaf);

// ---- wiring ----
engine = new GameEngine({ arena, ui, generator });
window.__engine = engine; // handy for debugging

$('#btn-play').addEventListener('click', () => engine.start({ ...settings }));
$('#btn-again').addEventListener('click', () => { stopConfetti(); engine.start({ ...settings }); });
$('#btn-menu').addEventListener('click', () => { stopConfetti(); engine.reset(); show('menu'); });
$('#btn-quit').addEventListener('click', () => { engine.reset(); overlay.innerHTML = ''; show('menu'); });
syncMenu();
