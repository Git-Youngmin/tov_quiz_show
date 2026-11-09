import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuizText } from "./parse.ts";

// 실제로 올리던 형식 (O/X 4 + 4지선다)
const KAKAO = `1. 무지개는 성경에서 단순한 자연현상이 아니라 하나님의 언약의 증거이다.
정답: O

2. 노아는 하나님께 먼저 “다시는 홍수로 심판하지 말아 달라”고 요청했다.
정답: X

5. 하나님께서 무지개를 주신 가장 중요한 목적은 무엇인가?
① 자연의 아름다움을 보여 주기 위해
② 날씨 변화를 알려 주기 위해
③ 다시는 홍수로 세상을 멸하지 않겠다는 언약의 증거로
④ 노아 가족만을 위한 특별한 표로
정답: 3

6. 창세기 9장에서 하나님이 언약을 맺으신 대상에 포함되지 않는 것은?
① 노아
② 노아의 자손
③ 모든 생물
④ 천사들
정답: 4`;

test("정답:/보기①~④ 형식", () => {
  const r = parseQuizText(KAKAO);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.questions.length, 4);
  assert.deepEqual(r.questions.map((q) => q.type), ["ox", "ox", "choice", "choice"]);
  assert.deepEqual(r.questions.map((q) => q.answerIndex), [0, 1, 2, 3]);
  assert.equal(r.questions[2].choices[2], "다시는 홍수로 세상을 멸하지 않겠다는 언약의 증거로");
  assert.equal(r.questions[0].timeLimitSec, 15);
  assert.equal(r.questions[2].timeLimitSec, 20);
});

test("'(O / X)' 표시와 '답 :' 표기는 정리됨", () => {
  const r = parseQuizText(`1. 아브람이 의롭다 여김을 받은 이유는 도덕적 완전함 때문이었다. (O / X)
답 : X
2. 성경에서 말하는 ‘의’는 믿음과 관련이 깊다. (O/X)
답 : O`);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.questions[0].text, "아브람이 의롭다 여김을 받은 이유는 도덕적 완전함 때문이었다.");
  assert.deepEqual(r.questions.map((q) => q.answerIndex), [1, 0]);
});

test("문제 끝에 정답이 붙고 보기가 뒤따르는 형식 (? 3)", () => {
  const r = parseQuizText(`7. 하나님께서 아브람을 의롭다 여기신 직접적인 이유는 무엇인가? 3
① 아브람이 전쟁에서 승리했기 때문에
② 아브람이 십일조를 드렸기 때문에
③ 아브람이 여호와를 믿었기 때문에
④ 아브람이 죄를 짓지 않았기 때문에`);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.questions[0].text, "하나님께서 아브람을 의롭다 여기신 직접적인 이유는 무엇인가?");
  assert.equal(r.questions[0].answerIndex, 2);
});

test("정답을 ③ 이나 A~D 로 적어도 인식", () => {
  const r = parseQuizText(` 7. 의미로 알맞은 것은?
① 가
② 나
③ 다
④ 라
답 : ③

 8. 영적 의미는?
A. 질병
B. 소경 치유
C. 구제
D. 율법
정답: B`);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.questions.map((q) => q.answerIndex), [2, 1]);
});

test("여러 줄 문제·인사말·잘못된 문제는 경고와 함께 처리", () => {
  const r = parseQuizText(`카훗 퀴즈입니다
1. 첫 줄
둘째 줄까지 이어지는 문제
정답: O
2. 정답이 없는 문제 (O / X)
3. 보기가 3개
① 가
② 나
③ 다
정답: 1`);
  assert.equal(r.questions.length, 1);
  assert.equal(r.questions[0].text, "첫 줄 둘째 줄까지 이어지는 문제");
  assert.equal(r.warnings.length, 2);
  assert.match(r.warnings[0], /^2번: 정답/);
  assert.match(r.warnings[1], /^3번: 보기가 3개/);
});

test("문제 끝 (O)/( X ) 와 '정답: (O)' 와 '정답: ③ 보기글' 형식", () => {
  const r = parseQuizText(`카훗 4/12

 1. 이 시험은 믿음을 드러내시려는 테스트이다. ( O )
 2. 성경은 순종보다 감정을 더 보여주고 있다. ( X )
3. 질그릇은 쉽게 깨질 수 있다.
정답: (O)
7. 야고보서 2장 17절에서 행함이 없는 믿음은 무엇과 같다고 말씀합니까?
① 부족한 믿음
② 작은 믿음
③ 죽은 믿음
④ 연약한 믿음
정답: ③ 죽은 믿음`);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.questions.map((q) => [q.type, q.answerIndex]), [["ox", 0], ["ox", 1], ["ox", 0], ["choice", 2]]);
  assert.equal(r.questions[0].text, "이 시험은 믿음을 드러내시려는 테스트이다.");
});
