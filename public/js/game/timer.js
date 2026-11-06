// Countdown timer based on requestAnimationFrame; supports pause/resume.
export class Timer {
  constructor({ onTick = () => {}, onExpire = () => {} } = {}) {
    this.onTick = onTick;
    this.onExpire = onExpire;
    this.duration = 0;
    this.remaining = 0;
    this.running = false;
    this._raf = null;
    this._last = 0;
  }

  start(seconds) {
    this.stop();
    this.duration = seconds * 1000;
    this.remaining = this.duration;
    this.resume();
  }

  resume() {
    if (this.running || this.remaining <= 0) return;
    this.running = true;
    this._last = performance.now();
    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  stop() {
    this.pause();
    this.remaining = 0;
  }

  get elapsed() {
    return this.duration - this.remaining;
  }

  _loop(now) {
    if (!this.running) return;
    this.remaining = Math.max(0, this.remaining - (now - this._last));
    this._last = now;
    this.onTick(this.remaining, this.duration);
    if (this.remaining <= 0) {
      this.running = false;
      this.onExpire();
      return;
    }
    this._raf = requestAnimationFrame((t) => this._loop(t));
  }
}
