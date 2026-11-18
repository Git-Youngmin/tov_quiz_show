/**
 * README 용 화면 캡처 — 진행자 1명 + 폰 4대로 실제 한 판(3문제)을 돌리면서 장면마다 찍는다.
 *
 * 준비 (한 번):   npm i -D playwright   그리고   npx playwright install chromium
 * 서버 2개 켜기:  npm run dev:server   /   npm run dev:web   (각각 다른 터미널)
 * 실행:           npm run capture
 *
 * 결과는 docs/screenshots/*.jpg 에 저장된다. 데모 퀴즈를 직접 만들었다가 끝나면 지우므로 데이터가 남지 않는다.
 * ⚠️ 배포한 서버에 돌리지 마세요 (데모 퀴즈가 잠깐 생깁니다). 기본값은 로컬 주소입니다.
 */
const { chromium, devices } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const WEB = process.env.WEB ?? "http://localhost:5173";
const API = process.env.API ?? "http://localhost:8787";
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const TITLE = "상식 퀴즈 (데모)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ox = (text, answerIndex) => ({ type: "ox", text, choices: ["O", "X", "", ""], answerIndex, timeLimitSec: 15 });
const choice = (text, choices, answerIndex) => ({ type: "choice", text, choices, answerIndex, timeLimitSec: 15 });
const DEMO_QUIZ = {
  title: TITLE,
  questions: [
    ox("지구는 태양 주위를 돈다.", 0),
    choice("태양계에서 가장 큰 행성은 무엇일까요?", ["지구", "목성", "화성", "금성"], 1),
    choice("윤년에는 2월이 며칠까지 있을까요?", ["28일", "29일", "30일", "31일"], 1),
  ],
};
/** 닉네임, 캐릭터 이름(화면에 보이는 글자), 색 이름 */
const PLAYERS = [
  ["요셉", "곰돌이", "파랑"],
  ["다윗", "야옹이", "주황"],
  ["에스더", "팬더", "보라"],
  ["룻", "펭귄", "초록"],
];

/** 정답 공개 → 점수판. 버튼을 누르는 순간 자동 전환과 겹쳐도 실패하지 않게 한다 */
const toBoard = async (host) => {
  await host.waitForSelector('button:has-text("점수판 ▶"), h2:has-text("점수판")', { timeout: 12000 });
  await host.locator('button:has-text("점수판 ▶")').click({ timeout: 2500 }).catch(() => {});
  await host.waitForSelector('h2:has-text("점수판")', { timeout: 8000 });
};

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: "jpeg", quality: 86 });
  console.log("  ✓", name);
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`웹 ${WEB} · 서버 ${API}`);
  const created = await fetch(`${API}/api/quizzes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(DEMO_QUIZ) });
  if (!created.ok) throw new Error(`데모 퀴즈를 만들지 못했어요 (${created.status}). 서버가 켜져 있나요?`);
  const { id: quizId } = await created.json();

  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  try {
    const host = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    console.log("홈 · 퀴즈 고르기 · 문제 만들기");
    await host.goto(`${WEB}/`);
    await sleep(1600);
    await shot(host, "h01-home");
    await host.goto(`${WEB}/host`);
    await host.waitForSelector(`li:has-text("${TITLE}")`);
    await sleep(500);
    await shot(host, "h02-picker");
    await host.goto(`${WEB}/host/quizzes`);
    await host.locator("button", { hasText: TITLE }).click();
    await host.waitForSelector("text=1번");
    await sleep(500);
    await shot(host, "h03-editor");

    console.log("방 만들기 · 폰 4대 입장");
    await host.goto(`${WEB}/host`);
    await host.locator("li", { hasText: TITLE }).locator('button:has-text("시작하기")').click();
    await host.waitForSelector("text=참가자 0명");
    const pin = (await host.locator("header b").textContent()).trim();

    const phones = [];
    for (const [i, [name, shape, color]] of PLAYERS.entries()) {
      const ctx = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 2 });
      const p = await ctx.newPage();
      await p.goto(`${WEB}/play?pin=${pin}`);
      await p.fill("input[placeholder=닉네임]", name);
      await p.locator("button", { hasText: shape }).first().click();
      await p.locator(`button[aria-label="${color}"]`).click();
      await sleep(400);
      if (i === 0) {
        await p.evaluate(() => window.scrollTo(0, 0));
        await sleep(200);
        await shot(p, "p01-join");
      }
      await p.click('button:has-text("참가하기")');
      await p.waitForSelector("text=입장 완료");
      phones.push(p);
    }
    const [A, B, C, D] = phones;
    await host.waitForSelector("text=참가자 4명");
    await sleep(1300);
    await shot(host, "h04-lobby");
    await shot(A, "p02-lobby");

    console.log("1번 (O/X)");
    await host.click('button:has-text("시작")');
    await sleep(600);
    await shot(host, "h05-intro-type");
    await shot(A, "p03-intro");
    await sleep(1800);
    await shot(host, "h06-intro-count");
    await A.waitForSelector('button:not([disabled])[aria-label="O"]', { timeout: 9000 });
    await sleep(1400);
    await shot(host, "h07-question-ox");
    await shot(A, "p04-ox");
    await A.click('button[aria-label="O"]'); // 요셉: 정답
    await sleep(900);
    await B.click('button[aria-label="O"]'); // 다윗: 정답(조금 느림)
    await C.click('button[aria-label="X"]'); // 에스더, 룻: 오답
    await D.click('button[aria-label="X"]');
    await host.waitForSelector('button:has-text("점수판 ▶")', { timeout: 12000 });
    await sleep(1400);
    await shot(host, "h08-answer-reveal");
    await toBoard(host);
    await sleep(4300);
    await host.click('button:has-text("다음 문제")');

    console.log("2번 (4지선다) — 순위가 뒤바뀌는 문제");
    await A.waitForSelector('button:not([disabled])[aria-label="1번 빨강"]', { timeout: 12000 });
    await sleep(1500);
    await shot(host, "h09-question-choice");
    await shot(A, "p05-choice");
    await C.click('button[aria-label="2번 파랑"]'); // 에스더: 정답
    await sleep(800);
    await D.click('button[aria-label="2번 파랑"]'); // 룻: 정답(조금 느림)
    await A.click('button[aria-label="1번 빨강"]'); // 요셉, 다윗: 오답
    await B.click('button[aria-label="3번 노랑"]');
    await host.waitForSelector('button:has-text("점수판 ▶")', { timeout: 12000 });
    await sleep(1400);
    await shot(host, "h10-answer-choice");
    await C.waitForSelector("text=/순위가 올랐어요/", { timeout: 9000 });
    await shot(C, "p06-rank-up");
    await B.waitForSelector("text=/따라잡아요/", { timeout: 9000 });
    await shot(B, "p07-rank-down");
    await toBoard(host);
    await sleep(250);
    await shot(host, "h11-board-before");
    await sleep(1500);
    await shot(host, "h12-board-counting");
    await sleep(2500);
    await shot(host, "h13-board-after");
    await host.click('button:has-text("다음 문제")');

    console.log("3번 (4지선다)");
    await A.waitForSelector('button:not([disabled])[aria-label="1번 빨강"]', { timeout: 12000 });
    await sleep(500);
    await A.click('button[aria-label="2번 파랑"]'); // 요셉: 정답
    await sleep(700);
    await B.click('button[aria-label="2번 파랑"]'); // 다윗: 정답(조금 느림)
    await C.click('button[aria-label="4번 초록"]'); // 에스더, 룻: 오답
    await D.click('button[aria-label="1번 빨강"]');
    await host.waitForSelector('button:has-text("점수판 ▶")', { timeout: 12000 });
    await toBoard(host);
    await sleep(4300);
    await host.click('button:has-text("최종 결과")');

    console.log("시상식");
    const t0 = Date.now();
    const at = async (ms, fn) => {
      const wait = ms - (Date.now() - t0);
      if (wait > 0) await sleep(wait);
      await fn();
    };
    await host.waitForSelector(".stage");
    await at(700, () => shot(host, "f01-curtains-closed"));
    await at(1900, () => shot(host, "f02-curtains-opening"));
    await at(3700, () => shot(host, "f03-presenter"));
    await at(6800, () => shot(host, "f04-third"));
    await at(7000, () => shot(A, "p08-finale-wait"));
    await at(11200, () => shot(host, "f05-second"));
    await at(15600, () => shot(host, "f06-suspense"));
    await at(18500, () => shot(host, "f07-first")); // 번쩍임이 걷히고 카메라가 1등에 맞춰진 뒤
    await at(18800, () => shot(A, "p09-winner"));
    await at(23300, () => shot(host, "f08-done"));
    await at(23400, () => shot(D, "p10-fourth"));
  } finally {
    await browser.close();
    await fetch(`${API}/api/quizzes/${quizId}`, { method: "DELETE" }).catch(() => {});
  }
  console.log(`끝. ${OUT}`);
}

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
