// 게임 1판 전체 흐름 스모크 테스트 (wrangler dev + 로컬 D1 시드 필요)
//   cd server && npm run db:migrate:local && npm run dev   (다른 터미널)
//   node scripts/e2e-test.mjs
const BASE = process.env.BASE ?? "http://localhost:8787";
const WS = BASE.replace(/^http/, "ws");

const assert = (cond, msg) => {
  if (!cond) throw new Error(`실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

const auth = { "Content-Type": "application/json" };

function connect(pin, query) {
  const ws = new WebSocket(`${WS}/parties/quiz-room/${pin}?${new URLSearchParams(query)}`);
  const inbox = [];
  const waiters = [];
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    inbox.push(msg);
    for (const w of [...waiters]) if (w.pred(msg)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg); }
  });
  const next = (pred, ms = 5000) =>
    new Promise((resolve, reject) => {
      const hit = inbox.find(pred);
      if (hit) { inbox.splice(inbox.indexOf(hit), 1); return resolve(hit); }
      const w = { pred: (m) => pred(m) && (inbox.splice(inbox.indexOf(m), 1), true), resolve };
      waiters.push(w);
      setTimeout(() => reject(new Error("메시지 대기 시간 초과")), ms).unref();
    });
  const opened = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  return { ws, next, opened, send: (m) => ws.send(JSON.stringify(m)) };
}

console.log("REST");
const quizzes = await (await fetch(`${BASE}/api/quizzes`, { headers: auth })).json();
assert(quizzes.length > 0 && quizzes[0].questionCount > 0, `퀴즈 목록 (${quizzes[0]?.title})`);
const quiz = quizzes.find((q) => q.questionCount > 0);
const { pin, hostToken } = await (await fetch(`${BASE}/api/rooms`, { method: "POST", headers: auth, body: JSON.stringify({ quizId: quiz.id }) })).json();
assert(/^\d{6}$/.test(pin), `PIN 발급 ${pin}`);
assert((await fetch(`${BASE}/api/rooms/${pin}`)).status === 200, "PIN 조회");
assert((await fetch(`${BASE}/api/rooms/000001`)).status === 404, "없는 PIN 404");

console.log("WebSocket");
const fake = connect(pin, { role: "host", token: "wrong" });
await fake.opened;
assert((await fake.next((m) => m.type === "error")).message.includes("인증"), "잘못된 진행자 토큰 거부");

const host = connect(pin, { role: "host", token: hostToken });
await host.opened;
await host.next((m) => m.type === "state");
const a = connect(pin, { role: "player", _pk: "p-a" });
const b = connect(pin, { role: "player", _pk: "p-b" });
await Promise.all([a.opened, b.opened]);
a.send({ type: "join", nickname: "요셉", character: { shape: "capsule", color: "blue" } });
b.send({ type: "join", nickname: "요셉", character: { shape: "box", color: "red" } });
assert((await b.next((m) => m.type === "error")).message.includes("닉네임"), "닉네임 중복 거부");
b.send({ type: "join", nickname: "다윗", character: { shape: "box", color: "red" } });
await host.next((m) => m.type === "state" && Object.keys(m.state.players).length === 2);
assert(true, "로비에 2명 입장");

host.send({ type: "host:start" });
const hq = await host.next((m) => m.type === "question:host");
const pq = await a.next((m) => m.type === "question:player");
assert(typeof hq.question.text === "string" && !("answerIndex" in hq.question), "진행자는 문제 텍스트 수신 (정답 숨김)");
assert(!("question" in pq) && pq.choiceCount === (hq.question.type === "ox" ? 2 : 4), `참가자는 텍스트 없이 버튼 정보만 수신 (${hq.question.type === "ox" ? "O/X 2버튼" : "4버튼"})`);
if (hq.question.type === "ox") {
  a.send({ type: "answer", questionIndex: 0, choice: 3 }); // O/X 문제에 없는 버튼 → 무시되어야 함 (아래 분포 검사로 확인)
}

for (let i = 0; i < quiz.questionCount; i++) {
  if (i > 0) {
    host.send({ type: "host:next" });
    await a.next((m) => m.type === "question:player" && m.index === i);
  }
  // 정답을 모르므로 a 는 0번, b 는 1번 → 결과 확인
  a.send({ type: "answer", questionIndex: i, choice: 0 });
  b.send({ type: "answer", questionIndex: i, choice: 1 });
  const res = await host.next((m) => m.type === "question:result" && m.index === i);
  const ra = await a.next((m) => m.type === "result:player" && m.index === i);
  assert(res.distribution[0] === 1 && res.distribution[1] === 1, `Q${i + 1} 전원 응답 → 즉시 마감, 분포 확인`);
  assert(ra.correct === (res.answerIndex === 0) && (ra.correct ? ra.points >= 500 : ra.points === 0), `Q${i + 1} 요셉 ${ra.correct ? "정답" : "오답"} +${ra.points} (${ra.rank}등, 🔥${ra.streak})`);
}
host.send({ type: "host:next" });
const fin = await host.next((m) => m.type === "state" && m.state.status === "finished");
assert(fin.state.status === "finished", "게임 종료");
for (const c of [host, a, b, fake]) c.ws.close();
console.log("\n모든 확인 통과 ✅");
process.exit(0);
