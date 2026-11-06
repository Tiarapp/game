// Generates targets and decoys (numbers 1-99) plus random visual attributes.
export const PALETTE = [
  '#ff3b6b', '#ffb300', '#00e5ff', '#76ff03', '#b388ff',
  '#ff6e40', '#40c4ff', '#f50057', '#69f0ae', '#ffd740',
  '#e040fb', '#ffffff', '#ff8a80', '#18ffff',
];

export const SIZE_MIN = 12;
export const SIZE_MAX = 60;

export const DIFFICULTY = {
  easy: { minSize: 20, lookalikeRatio: 0 },
  normal: { minSize: SIZE_MIN, lookalikeRatio: 0.05 },
  hard: { minSize: SIZE_MIN, lookalikeRatio: 0.2 },
};

export const rand = (min, max) => Math.random() * (max - min) + min;
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 30 unique targets per round when possible (1-99 has 99 values).
export function generateTargets(count) {
  const pool = shuffle(Array.from({ length: 99 }, (_, i) => i + 1));
  const out = [];
  while (out.length < count) out.push(...pool.slice(0, count - out.length));
  return out;
}

function lookalikes(target) {
  const s = String(target);
  const set = new Set();
  if (s.length === 2) {
    set.add(Number(s[1] + s[0]));
    for (let d = 0; d <= 9; d++) {
      set.add(Number(d + s[1]));
      set.add(Number(s[0] + d));
    }
  } else {
    for (let d = 1; d <= 9; d++) set.add(d * 10 + Number(s));
  }
  set.delete(target);
  set.delete(0);
  return [...set].filter((n) => n >= 1 && n <= 99);
}

// Visual attributes are independent of whether an item is the target.
export function visual(minSize, maxSize = SIZE_MAX) {
  return {
    fontSize: randInt(minSize, maxSize),
    fontWeight: randInt(4, 9) * 100,
    color: pick(PALETTE),
    rotation: rand(-15, 15),
  };
}

export function generateRound({ target, decoyCount, difficulty }) {
  const cfg = DIFFICULTY[difficulty] || DIFFICULTY.normal;
  const similar = lookalikes(target);
  const items = [{ id: 0, value: target, isTarget: true, ...visual(cfg.minSize) }];

  for (let i = 1; i <= decoyCount; i++) {
    let value;
    if (similar.length && Math.random() < cfg.lookalikeRatio) value = pick(similar);
    else do { value = randInt(1, 99); } while (value === target);
    items.push({ id: i, value, isTarget: false, ...visual(cfg.minSize) });
  }
  return shuffle(items);
}
