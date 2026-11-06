// Word-completion mode: a word with missing letters; the answering player
// types the missing letters in order.
import { PALETTE, shuffle, randInt, pick, visual } from './number-generator.js';
import { WORDS } from './word-data.js';

export { PALETTE };

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// blanks: number, or a ratio of the word length when blanksRatio is set.
export const LEVELS = {
  easy: { minLen: 3, maxLen: 5, blanks: 1, minSize: 26, maxSize: 60, seconds: 12, showClue: true },
  normal: { minLen: 5, maxLen: 7, blanks: 2, minSize: 20, maxSize: 56, seconds: 14, showClue: true },
  hard: { minLen: 6, maxLen: 12, blanks: 3, minSize: 16, maxSize: 52, seconds: 16, showClue: true },
  expert: { minLen: 5, maxLen: 12, blanksRatio: 0.5, minSize: 14, maxSize: 48, seconds: 18, showClue: false },
};

const level = (d) => LEVELS[d] || LEVELS.normal;
export const targetSeconds = (config) => level(config.difficulty).seconds;
export const typing = true;
export const typingHint = 'Tekan tombolmu,<br>lalu ketik huruf yang hilang!';
export const answerSeconds = () => 3; // per missing letter

function makeTarget({ word, clue }, lv) {
  const count = Math.min(
    word.length - 1,
    lv.blanksRatio ? Math.max(2, Math.round(word.length * lv.blanksRatio)) : lv.blanks
  );
  const positions = new Set(shuffle(Array.from({ length: word.length }, (_, i) => i)).slice(0, count));
  const letters = word.split('');
  return {
    word,
    clue: lv.showClue ? clue : '',
    pattern: letters.map((c, i) => (positions.has(i) ? null : c)),
    missing: letters.filter((_, i) => positions.has(i)),
  };
}

export function generateTargets(count, config = {}) {
  const lv = level(config.difficulty);
  const pool = WORDS.filter((w) => w.word.length >= lv.minLen && w.word.length <= lv.maxLen);
  const out = [];
  while (out.length < count) out.push(...shuffle(pool).slice(0, count - out.length));
  return out.map((w) => makeTarget(w, lv));
}

export function generateRound({ target, decoyCount, difficulty }) {
  const lv = level(difficulty);
  const items = [];
  let id = 0;
  // Every missing letter exists at least once; flagged as target for reveal on timeout.
  for (const letter of target.missing) {
    items.push({ id: id++, value: letter, isTarget: true, ...visual(lv.minSize, lv.maxSize) });
  }
  for (let i = 0; i < decoyCount; i++) {
    items.push({ id: id++, value: pick(ALPHABET), isTarget: false, ...visual(lv.minSize, lv.maxSize) });
  }
  return shuffle(items);
}
