import { test } from "node:test";
import assert from "node:assert/strict";
import { validateQuizInput } from "./validate.ts";

const q = (over: Record<string, unknown> = {}) => ({
  text: " 첫째 날? ",
  choices: ["a", "b", "c", "d"],
  answerIndex: 2,
  timeLimitSec: 20,
  ...over,
});

test("정상 입력은 trim 되어 통과", () => {
  const r = validateQuizInput({ title: "  제목 ", questions: [q()] });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.title, "제목");
    assert.equal(r.value.questions[0].text, "첫째 날?");
  }
});

test("잘못된 입력은 어떤 문제의 무엇이 문제인지 알려 줌", () => {
  const err = (v: unknown) => {
    const r = validateQuizInput(v);
    assert.ok(!r.ok);
    return r.ok ? "" : r.error;
  };
  assert.match(err({ title: "", questions: [q()] }), /제목/);
  assert.match(err({ title: "t", questions: [] }), /1개 이상/);
  assert.match(err({ title: "t", questions: [q(), q({ text: "" })] }), /2번 문제 내용/);
  assert.match(err({ title: "t", questions: [q({ choices: ["a", "b", "", "d"] })] }), /1번 문제 3번 보기/);
  assert.match(err({ title: "t", questions: [q({ answerIndex: 4 })] }), /정답/);
  assert.match(err({ title: "t", questions: [q({ timeLimitSec: 3 })] }), /제한 시간/);
  assert.match(err({ title: "t", questions: [q({ timeLimitSec: 20.5 })] }), /제한 시간/);
  assert.match(err(null), /잘못된/);
});
