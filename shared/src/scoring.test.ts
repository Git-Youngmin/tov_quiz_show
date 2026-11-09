import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreAnswer, timeScore } from "./scoring.ts";

test("timeScore: 즉시 1000, 절반 750, 끝 500", () => {
  assert.equal(timeScore(0, 20_000), 1000);
  assert.equal(timeScore(10_000, 20_000), 750);
  assert.equal(timeScore(20_000, 20_000), 500);
  assert.equal(timeScore(99_000, 20_000), 500); // 초과 응답은 잘림
});

test("scoreAnswer: 오답은 0점, streak 초기화", () => {
  assert.deepEqual(scoreAnswer({ correct: false, responseMs: 0, timeLimitMs: 20_000, prevStreak: 3 }), {
    points: 0,
    streak: 0,
    bonus: 0,
  });
});

test("scoreAnswer: 첫 정답은 보너스 없음, 두 번째부터 +100", () => {
  const first = scoreAnswer({ correct: true, responseMs: 0, timeLimitMs: 20_000, prevStreak: 0 });
  assert.deepEqual(first, { points: 1000, streak: 1, bonus: 0 });
  const second = scoreAnswer({ correct: true, responseMs: 10_000, timeLimitMs: 20_000, prevStreak: 1 });
  assert.deepEqual(second, { points: 850, streak: 2, bonus: 100 });
});
