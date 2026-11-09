import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreAnswer, timeScore } from "./scoring.ts";

test("timeScore: 즉시 1000, 절반 750, 끝 500", () => {
  assert.equal(timeScore(0, 20_000), 1000);
  assert.equal(timeScore(10_000, 20_000), 750);
  assert.equal(timeScore(20_000, 20_000), 500);
  assert.equal(timeScore(99_000, 20_000), 500); // 초과 응답은 잘림
});

test("scoreAnswer: 오답/미응답은 0점", () => {
  assert.equal(scoreAnswer({ correct: false, responseMs: 0, timeLimitMs: 20_000 }), 0);
});

test("scoreAnswer: 정답은 시간 비례 점수만 — 연속 정답 보너스 없음", () => {
  assert.equal(scoreAnswer({ correct: true, responseMs: 0, timeLimitMs: 10_000 }), 1000);
  // 몇 번째 연속 정답이든 같은 응답 시간이면 같은 점수
  assert.equal(scoreAnswer({ correct: true, responseMs: 5_000, timeLimitMs: 10_000 }), 750);
  assert.equal(scoreAnswer({ correct: true, responseMs: 5_000, timeLimitMs: 10_000 }), 750);
});
