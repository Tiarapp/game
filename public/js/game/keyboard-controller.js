// One key per player; ignores auto-repeat and keys of inactive players.
export const PLAYER_KEYS = [
  { id: 1, code: 'KeyQ', label: 'Q' },
  { id: 2, code: 'KeyW', label: 'W' },
  { id: 3, code: 'KeyO', label: 'O' },
  { id: 4, code: 'KeyP', label: 'P' },
  { id: 5, code: 'KeyZ', label: 'Z' },
  { id: 6, code: 'KeyX', label: 'X' },
  { id: 7, code: 'KeyN', label: 'N' },
  { id: 8, code: 'KeyM', label: 'M' },
  { id: 9, code: 'KeyA', label: 'A' },
  { id: 10, code: 'KeyL', label: 'L' },
];

export class KeyboardController {
  constructor(onPress) {
    this.onPress = onPress;
    this.byCode = new Map();
    this._handler = (e) => {
      const p = this.byCode.get(e.code);
      if (!p || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      if (e.repeat) return;
      this.onPress(p.id, performance.now());
    };
  }

  enable(playerCount) {
    this.byCode = new Map(PLAYER_KEYS.slice(0, playerCount).map((p) => [p.code, p]));
    window.addEventListener('keydown', this._handler);
  }

  disable() {
    window.removeEventListener('keydown', this._handler);
    this.byCode.clear();
  }
}
