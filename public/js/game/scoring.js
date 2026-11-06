export const POINTS_CORRECT = 10;
export const POINTS_WRONG = -3;

export class Scoring {
  constructor(players) {
    this.stats = new Map(
      players.map((p) => [p.id, { id: p.id, score: 0, correct: 0, wrong: 0, reactions: [], firstPresses: 0 }])
    );
    this.fastestId = null;
  }

  markFastest(id) {
    this.fastestId = id;
    this.stats.get(id).firstPresses++;
  }

  correct(id, reactionMs) {
    const s = this.stats.get(id);
    s.score += POINTS_CORRECT;
    s.correct++;
    s.reactions.push(reactionMs);
  }

  wrong(id) {
    const s = this.stats.get(id);
    s.score += POINTS_WRONG;
    s.wrong++;
  }

  static accuracy(s) {
    const total = s.correct + s.wrong;
    return total ? Math.round((s.correct / total) * 100) : 0;
  }

  static avgReaction(s) {
    return s.reactions.length ? Math.round(s.reactions.reduce((a, b) => a + b, 0) / s.reactions.length) : null;
  }

  snapshot() {
    return [...this.stats.values()].map((s) => ({
      ...s,
      accuracy: Scoring.accuracy(s),
      avgReaction: Scoring.avgReaction(s),
    }));
  }

  // Ranked by score, then correct answers, then fewer mistakes, then speed.
  ranking() {
    return this.snapshot()
      .sort((a, b) =>
        b.score - a.score || b.correct - a.correct || a.wrong - b.wrong ||
        (a.avgReaction ?? Infinity) - (b.avgReaction ?? Infinity))
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }
}
