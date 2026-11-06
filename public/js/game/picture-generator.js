// Tebak Gambar: emoji picture + absurd clue; the answering player types the answer.
import { shuffle } from './number-generator.js';
import { PICTURES } from './picture-data.js';

export const typing = true;

// reveal: letters shown up front; clue: 'show' | 'late' (half-way) | 'none'.
export const LEVELS = {
  easy: { reveal: 2, clue: 'show', seconds: 20 },
  normal: { reveal: 1, clue: 'show', seconds: 18 },
  hard: { reveal: 0, clue: 'late', seconds: 16 },
  expert: { reveal: 0, clue: 'none', seconds: 14, blur: true, decoys: 3 },
};

const level = (d) => LEVELS[d] || LEVELS.normal;
export const targetSeconds = (config) => level(config.difficulty).seconds;
export const answerSeconds = () => 10; // whole answer

function makeTarget([word, emojis, clue], lv) {
  const letters = word.split('');
  const reveal = Math.min(lv.reveal, Math.max(0, letters.length - 2));
  const shown = new Set(shuffle(letters.map((_, i) => i)).slice(0, reveal));
  return {
    word,
    emojis,
    clue: '',
    picClue: lv.clue === 'none' ? '' : clue,
    lateClue: lv.clue === 'late',
    blur: Boolean(lv.blur),
    decoys: lv.decoys || 0,
    guess: true,
    pattern: letters.map((c, i) => (shown.has(i) ? c : null)),
    missing: letters.filter((_, i) => !shown.has(i)),
  };
}

export function generateTargets(count, config = {}) {
  const lv = level(config.difficulty);
  const out = [];
  while (out.length < count) out.push(...shuffle(PICTURES).slice(0, count - out.length));
  return out.map((p) => makeTarget(p, lv));
}

const graphemes = (str) => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)].map((x) => x.segment);

// Expert: real emojis are mixed with decoys from other pictures and start blurred.
export function arenaHTML(t) {
  let emojis = t.emojis;
  if (t.decoys) {
    const own = new Set(graphemes(t.emojis));
    const pool = [...new Set(PICTURES.flatMap((p) => graphemes(p[1])))].filter((e) => !own.has(e));
    emojis = shuffle([...graphemes(t.emojis), ...shuffle(pool).slice(0, t.decoys)]).join('');
  }
  const clue = t.picClue
    ? `<div class="pic-clue${t.lateClue ? ' late' : ''}">“${t.picClue}”</div>`
    : '';
  return `<div class="pic${t.blur ? ' blurred' : ''}"><div class="pic-emojis">${emojis}</div>${clue}</div>`;
}
