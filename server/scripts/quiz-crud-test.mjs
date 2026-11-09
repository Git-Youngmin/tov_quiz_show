// 퀴즈 편집 API 스모크 테스트 (wrangler dev 실행 중이어야 함)  node scripts/quiz-crud-test.mjs
const BASE = process.env.BASE ?? "http://localhost:8787";
const auth = { "Content-Type": "application/json" };
const ok = (cond, msg) => {
  if (!cond) throw new Error(`실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};
const call = (method, path, body, headers = auth) =>
  fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });

const ox = (text, answerIndex) => ({ type: "ox", text, choices: ["O", "X", "", ""], answerIndex, timeLimitSec: 15 });
const choice = (text, answerIndex) => ({ type: "choice", text, choices: ["가", "나", "다", "라"], answerIndex, timeLimitSec: 20 });

console.log("퀴즈 편집 API");
ok((await call("POST", "/api/quizzes", { title: "", questions: [] })).status === 400, "빈 퀴즈는 400");
const bad = await call("POST", "/api/quizzes", { title: "t", questions: [ox("문제", 3)] });
ok(bad.status === 400 && (await bad.json()).error.includes("정답"), "O/X 문제의 정답 3은 거부");

const created = await call("POST", "/api/quizzes", { title: "  테스트 퀴즈 ", questions: [ox("첫 문제", 1), choice("둘째 문제", 3)] });
ok(created.status === 201, "생성 201");
const { id } = await created.json();

let quiz = await (await call("GET", `/api/quizzes/${id}`)).json();
ok(quiz.title === "테스트 퀴즈" && quiz.questions.length === 2, "제목 trim, 문항 2개 저장");
ok(quiz.questions[0].type === "ox" && quiz.questions[0].answerIndex === 1 && quiz.questions[0].choices[0] === "O", "O/X 문제 저장·정답 복원");
ok(quiz.questions[1].type === "choice" && quiz.questions[1].answerIndex === 3, "4지선다 정답 복원");

ok((await call("PUT", `/api/quizzes/${id}`, { title: "수정됨", questions: [choice("하나", 0), ox("둘", 0), ox("셋", 1)] })).status === 200, "수정 200");
quiz = await (await call("GET", `/api/quizzes/${id}`)).json();
ok(quiz.title === "수정됨" && quiz.questions.map((q) => q.text).join() === "하나,둘,셋", "수정 후 순서 유지");

const list = await (await call("GET", "/api/quizzes")).json();
ok(list.find((q) => q.id === id)?.questionCount === 3, "목록에 문항 수 반영");

ok((await call("PUT", "/api/quizzes/999999", { title: "x", questions: [ox("a", 0)] })).status === 404, "없는 퀴즈 수정은 404");
ok((await call("DELETE", `/api/quizzes/${id}`)).status === 200, "삭제 200");
ok((await call("GET", `/api/quizzes/${id}`)).status === 404, "삭제 후 조회 404");
ok((await call("DELETE", `/api/quizzes/${id}`)).status === 404, "이미 삭제된 퀴즈 삭제는 404");
console.log("\n모든 확인 통과 ✅");
