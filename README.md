<p align="center">
  <img src="web/public/icon-192.png" width="96" alt="TOV QUIZ 아이콘">
</p>

<h1 align="center">TOV QUIZ</h1>

<p align="center">
  경원교회 중고등부 <b>토브</b>의 실시간 퀴즈쇼<br>
  스크린은 보고, 폰으로는 누르고 → 점수가 오르고 순위가 뒤바뀌고 → <b>시상식</b>으로 마무리 🏆
</p>

<p align="center">
  <a href="https://tov-quiz-show.pages.dev/host/quizzes"><b>✏️ 문제 만들기</b></a>
  ·
  <a href="https://tov-quiz-show.pages.dev/host"><b>🎮 PLAY (스크린에 띄우기)</b></a>
</p>

---

## 어떤 퀴즈쇼인가요?

운영자가 스크린(TV·프로젝터)에 PLAY 화면을 띄우면 **QR 코드와 6자리 PIN**이 나오고, 학생들은 폰으로 QR 을 찍어 **닉네임과 캐릭터만 고르고** 바로 참가합니다.
문제는 스크린에, 폰에는 **큼직한 버튼만** 나옵니다. 빨리 맞힐수록 점수가 높고, 문제마다 점수판의 줄이 새 순위 자리로 움직이며, 마지막은 아카데미 시상식처럼 발표합니다.

| | |
|---|---|
| **운영자** | `문제 만들기`로 퀴즈를 만들고, `PLAY`를 스크린에 띄워 진행합니다. 로그인은 없습니다. |
| **참가자** | 스크린의 QR 한 번이면 입장합니다. 홈 화면을 거치지 않는 독립된 입장 페이지(`/play?pin=…`)이고, 가입은 없습니다. |
| **문제 유형** | **O/X** 와 **4지선다**를 한 퀴즈 안에서 섞어 쓸 수 있습니다. |
| **캐릭터** | 동물·크리처 20종 + 기본형 4종 = **24종 × 색 6가지**. 머리·팔·다리가 따로 움직입니다. |
| **동시 사용** | 방(PIN)마다 서버의 독립된 공간 하나를 쓰도록 설계했습니다(최대 200명). |

> 목표는 **스크린 앞의 모두가 같이 들뜨는 것**입니다. 문제 사이사이의 카운트다운, 순위가 뒤바뀌는 점수판, 시상식 연출은 전부 그 때문에 넣었습니다.

---

## 실제 플레이 화면

아래는 모두 **진행자 1명 + 폰 4대로 실제 한 판(3문제)을 돌리며 캡처**한 화면입니다. (`npm run capture` 로 다시 만들 수 있어요)
캡처 속 닉네임·문제는 시연용 예시이고, 주소의 `localhost` 는 배포하면 실제 주소로 바뀝니다.

### 운영자 — 만들기와 시작

| 홈 | 플레이할 퀴즈 고르기 |
|:---:|:---:|
| <img src="docs/screenshots/h01-home.jpg" width="420" alt="홈: 문제 만들기와 PLAY"> | <img src="docs/screenshots/h02-picker.jpg" width="420" alt="플레이할 퀴즈 고르기"> |

| 문제 만들기 (O/X ↔ 4지선다 전환, 시간 슬라이더) | 대기실 (QR · PIN · 입장한 캐릭터) |
|:---:|:---:|
| <img src="docs/screenshots/h03-editor.jpg" width="420" alt="퀴즈 편집 화면"> | <img src="docs/screenshots/h04-lobby.jpg" width="420" alt="QR 과 PIN 이 보이는 대기실"> |

### 큰 화면 — 한 라운드

문제가 나오기 전 **소개와 3-2-1 카운트다운**이 진행 화면과 폰에서 같이 흘러가고, 이 동안은 답을 받지 않습니다.

| 소개: "O/X 퀴즈!" | 카운트다운 |
|:---:|:---:|
| <img src="docs/screenshots/h05-intro-type.jpg" width="420" alt="O/X 퀴즈 소개"> | <img src="docs/screenshots/h06-intro-count.jpg" width="420" alt="카운트다운"> |

제한 시간은 **타들어 가는 밧줄**로 보이고, 마지막 3초에는 불꽃이 커지며 숫자가 빨갛게 흔들립니다.

| O/X 문제 | 4지선다 문제 |
|:---:|:---:|
| <img src="docs/screenshots/h07-question-ox.jpg" width="420" alt="O/X 문제"> | <img src="docs/screenshots/h09-question-choice.jpg" width="420" alt="4지선다 문제"> |

| 정답 공개 (보기별 인원) | 정답 공개 (4지선다) |
|:---:|:---:|
| <img src="docs/screenshots/h08-answer-reveal.jpg" width="420" alt="O/X 정답 공개"> | <img src="docs/screenshots/h10-answer-choice.jpg" width="420" alt="4지선다 정답 공개"> |

### 큰 화면 — 점수판 (순위가 뒤바뀌는 순간)

이전 점수와 순서로 먼저 보여 주고 → `+점수` 가 붙으며 숫자가 올라가고 → 줄이 새 순위 자리로 쑥 움직입니다. 오른 캐릭터는 폴짝, 내린 캐릭터는 풀이 죽습니다.

| ① 이전 점수 | ② 점수가 올라가는 중 | ③ 순위가 바뀐 뒤 |
|:---:|:---:|:---:|
| <img src="docs/screenshots/h11-board-before.jpg" width="280" alt="이전 점수판"> | <img src="docs/screenshots/h12-board-counting.jpg" width="280" alt="점수가 올라가는 중"> | <img src="docs/screenshots/h13-board-after.jpg" width="280" alt="순위가 바뀐 점수판"> |

### 큰 화면 — 시상식

커튼이 열리고, 진행자가 마이크 앞에서 3등 → 2등 → "그리고 1등은…?!" 순서로 호명합니다. 카메라는 진행자에서 각 시상대로 줌인하고, 1등 직전에는 비스듬히 다가갑니다.

| 커튼이 닫혀 있다가 | 열리는 중 |
|:---:|:---:|
| <img src="docs/screenshots/f01-curtains-closed.jpg" width="420" alt="닫힌 커튼"> | <img src="docs/screenshots/f02-curtains-opening.jpg" width="420" alt="열리는 커튼"> |

| 진행자 클로즈업 | 3등 호명 |
|:---:|:---:|
| <img src="docs/screenshots/f03-presenter.jpg" width="420" alt="진행자 클로즈업"> | <img src="docs/screenshots/f04-third.jpg" width="420" alt="3등 호명"> |

| 2등 호명 | "그리고 1등은…?!" |
|:---:|:---:|
| <img src="docs/screenshots/f05-second.jpg" width="420" alt="2등 호명"> | <img src="docs/screenshots/f06-suspense.jpg" width="420" alt="1등 발표 직전"> |

| 1등 호명 (번쩍 · 줌인 · 색종이) | 마무리 (나머지 순위) |
|:---:|:---:|
| <img src="docs/screenshots/f07-first.jpg" width="420" alt="1등 호명"> | <img src="docs/screenshots/f08-done.jpg" width="420" alt="시상식 마무리"> |

### 참가자 — 폰

| 캐릭터·닉네임 | 입장 완료 | 소개·카운트다운 | O/X |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/p01-join.jpg" width="190" alt="캐릭터와 닉네임 고르기"> | <img src="docs/screenshots/p02-lobby.jpg" width="190" alt="입장 완료"> | <img src="docs/screenshots/p03-intro.jpg" width="190" alt="폰의 카운트다운"> | <img src="docs/screenshots/p04-ox.jpg" width="190" alt="O/X 버튼"> |

| 4지선다 | 순위가 올랐을 때 | 순위가 내렸을 때 | 시상식 진행 중 |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/p05-choice.jpg" width="190" alt="4색 버튼"> | <img src="docs/screenshots/p06-rank-up.jpg" width="190" alt="순위 상승"> | <img src="docs/screenshots/p07-rank-down.jpg" width="190" alt="순위 하락"> | <img src="docs/screenshots/p08-finale-wait.jpg" width="190" alt="시상식 대기"> |

폰은 스크린에서 **내 이름이 호명되는 순간**에 맞춰 내 최종 등수를 공개합니다. 먼저 보면 스크린의 긴장감이 사라지기 때문이며, 화면을 톡 치면 바로 볼 수 있습니다.

| 우승 | 4등 이하 |
|:---:|:---:|
| <img src="docs/screenshots/p09-winner.jpg" width="190" alt="우승 화면"> | <img src="docs/screenshots/p10-fourth.jpg" width="190" alt="4등 화면"> |

### 아이콘

브라우저 탭 제목 옆과 폰 홈 화면에 쓰는 대표 아이콘입니다. 탭용은 16px 에서도 알아볼 수 있게 단순하게, 홈 화면용은 금빛 테두리와 반짝이를 넣어 따로 만들었습니다.

<p align="center"><img src="web/public/icon-512.png" width="140" alt="TOV QUIZ 앱 아이콘"></p>

---

## 게임 흐름

```
lobby ─시작─▶ [ 소개·카운트다운 ─▶ 답 받기 ─▶ 결과 발표 ─▶ 점수판 ] × 문제 수 ─▶ finished(시상식)
 대기실         4초                  제한 시간     정답 공개     순위 변동         약 20초
```

| 단계 | 큰 화면 | 참가자 폰 |
|---|---|---|
| **lobby** | QR · 6자리 PIN · 입장한 캐릭터 · `시작` | 닉네임·캐릭터 선택 → 입장 완료 |
| **소개·카운트다운** (4초) | "O/X 퀴즈!" / "4지선다 퀴즈!" 소개 1초 → 3·2·1 | 같은 화면. **이 동안은 답을 받지 않음** |
| **문제** (제한 시간) | 문제 글 + 타들어 가는 밧줄 + 응답 수 + `마감하기` | **문제 글 없이** 큰 버튼만 (O/X 는 정사각형 2개, 4지선다는 4색) |
| **결과 발표** | "🥁 결과 발표!" → 정답 공개(보기별 인원 막대, 정답 반짝) | 정답/오답 + 점수 |
| **점수판** | 이전 점수 → 점수 상승 → 순위 재정렬, 오른 캐릭터 폴짝·내린 캐릭터 풀 죽음, 1등 👑 | 순위가 이전 → 새 순위로 바뀌며 ▲▼ |
| **finished** | 커튼 → 진행자 → 3등 → 2등 → 1등 → 나머지 순위 | 내가 호명되는 순간에 최종 등수 공개 + 등수별 세레머니 |

**점수** — 정답이면 응답 속도에 비례합니다. 오답·미응답은 0점이고, 연속 정답 보너스는 없습니다.

$$\text{점수} = 1000 \times \left(1 - \frac{t_{\text{응답}}}{t_{\text{제한}}} \cdot \frac{1}{2}\right) \quad (\text{즉시 } 1000\text{점, 마지막 순간 } 500\text{점})$$

- 응답 시간 $t_{\text{응답}}$ 은 **서버가 답을 받기 시작한 시각(`startsAt`)** 부터 잽니다. 클라이언트 시계는 쓰지 않습니다.
- 접속 중인 전원이 답하면 제한 시간 전에 바로 마감합니다.
- 모두 같은 점수(0점)로 시작한 **첫 라운드**는 "공동 1등"일 뿐이라 순위 변동(▲▼)을 표시하지 않습니다.
- 점수판에는 상위 7명을 보여 줍니다.

**시상식 세레머니** — 시상대에 오른 캐릭터가 등수별로 알아서 다른 동작을 반복합니다.

| 등수 | 동작 |
|---|---|
| 🥉 3등 | 폴짝 |
| 🥈 2등 | 더블 점프 + 회전 |
| 🥇 1등 | 공중 뒤돌기 + 춤 + 👑 + 반짝이 + 색종이 |

---

## 진행하는 법

1. **문제 만들기** — 홈에서 `문제 만들기` → `새 퀴즈 만들기`. 제목을 쓰고 문제를 추가합니다. 새 문제는 **O/X** 로 시작하고, 카드 위의 `4지선다` 버튼으로 바꿀 수 있습니다. 제한 시간은 슬라이더(10~20초, 기본 10초)로 조절합니다.
2. **PLAY** — 홈에서 `PLAY` → 퀴즈를 골라 `시작하기`. 이 화면을 **스크린에 띄웁니다.** (BGM 이 이 화면에서 나오니 스크린의 소리를 켜 두세요)
3. **입장** — 학생들이 스크린의 **QR 을 찍으면** 닉네임 입력 화면이 바로 열립니다. 캐릭터(24종)와 색을 고르면 입장 완료이고, 스크린에 캐릭터가 나타납니다. (QR 이 안 되면 `주소/play` 에서 PIN 입력)
4. **시작** — 인원이 모이면 `시작 ▶`. 이후에는 `점수판 ▶` → `다음 문제 ▶` 버튼만 누르면 됩니다. (결과 발표와 정답 공개는 자동으로 넘어가고, 버튼으로 앞당길 수도 있어요)
5. **시상식** — 마지막 문제 뒤 `최종 결과 ▶`. 약 20초이고 `건너뛰기`가 있습니다.

### 퀴즈 만들 때의 한도

| 항목 | 한도 |
|---|---|
| 퀴즈 제목 | 50자 |
| 문제 수 | 최대 50개 |
| 문제 글 · 보기 | 200자 · 80자 |
| 제한 시간 | 슬라이더 10~20초 (저장 가능 범위는 5~120초) |
| 정답 | O/X 는 O 또는 X, 4지선다는 1~4번 중 하나 |

저장할 때 같은 규칙으로 화면과 서버가 모두 검사하고, 어디가 문제인지("2번 문제 3번 보기를 입력해 주세요")를 알려 줍니다.

---

## 구조 · 기술 스택

```
 폰 · 스크린 (브라우저)
      │  정적 화면                              REST (/api)             WebSocket (/parties/quiz-room/<PIN>)
      ▼                                           │                              │
 Cloudflare Pages  ── React + Vite + Tailwind ──▶ ▼                              ▼
   (web)                                    Cloudflare Worker (server) ─▶ Durable Object "QuizRoom" (방 1개 = 인스턴스 1개)
                                              │      │                      └ 방 상태·타이머·점수를 메모리에서 관리
                                              ▼      ▼
                                        D1 (퀴즈·문항·결과)   KV (PIN → 방 정보, 6시간)
```

- **화면**: React 19 · Vite · Tailwind v4 · React Router (Cloudflare Pages)
- **실시간**: Cloudflare Worker + PartyServer(Durable Object 위의 WebSocket) — 방 하나가 인스턴스 하나
- **저장**: D1 (퀴즈 · 문항 · 게임 결과), KV (PIN 로 방 찾기)
- **캐릭터·연출**: 전부 SVG + CSS 애니메이션 (외부 이미지 없음, 별도 애니메이션 라이브러리 없음)

```
shared/                    화면·서버가 같이 쓰는 코드
  src/protocol.ts          메시지 규약 · 방 상태 · 캐릭터 목록
  src/scoring.ts           점수 계산 (+ scoring.test.ts)
  src/validate.ts          퀴즈 저장 규칙 · 한도 (+ validate.test.ts)
server/                    Cloudflare Worker
  wrangler.toml            Durable Object · D1 · KV 설정
  schema.sql, seed.sql     D1 표 만들기 · 로컬용 예시 퀴즈
  src/index.ts             REST (퀴즈 목록·저장·삭제, 방 만들기, PIN 확인) + WebSocket 라우팅
  src/QuizRoom.ts          방 하나의 진행: 입장·답·타이머·점수·순위
  src/db.ts                D1 읽기/쓰기
  scripts/                 API 확인(quiz-crud-test), 한 판 진행 확인(e2e-test)
web/                       화면 (Cloudflare Pages)
  public/                  아이콘 · manifest · 배경음악(audio/)
  src/pages/               HomePage · HostPage(PLAY) · QuizEditorPage · PlayPage(참가자)
  src/components/          CharacterAvatar · QuestionIntro · FuseTimer · HostRound · AnimatedScoreboard
                           FinalCeremony(시상식) · AuroraBackground · Confetti · MusicCredit …
  src/lib/                 useRoom(WebSocket) · clock(서버 시계 맞추기) · finale(시상식 시간표) …
  src/audio/               BGM·효과음 엔진 · credits.ts(출처)
scripts/capture.cjs        README 용 화면 캡처 (Playwright)
docs/screenshots/          README 의 사진
```

### 정확성 · 보안 원칙 (그리고 어떻게 확인했는지)

| 원칙 | 구현 | 확인 |
|---|---|---|
| 정답은 **마감 전에 서버가 절대 보내지 않음** | 진행 화면에는 정답 번호를 뺀 문제를, 폰에는 문제 글 없이 보기 개수만 보냄 | `e2e-test`: 진행자가 받은 문제에 `answerIndex` 없음, 폰이 받은 메시지에 문제 글 없음 |
| 점수는 **서버 시계**로 계산 | 응답 시간 = 서버가 답을 받은 시각 − `startsAt`. 클라이언트가 보낸 시간은 쓰지 않음 | 단위 테스트(점수식), `e2e-test`(정답 점수가 500~1000 사이) |
| **카운트다운 중에는 답·마감을 받지 않음** | `startsAt` 이전의 답과 `마감하기`는 서버가 무시 | `e2e-test`: 카운트다운 중 보낸 답에 응답(ack)이 없음 |
| O/X 문제에 **없는 보기 번호**는 무시 | 보기 개수보다 큰 번호 거절 | `e2e-test`: 3번 버튼을 눌러도 득표에 안 잡힘 |
| 진행자 권한은 **방마다 발급되는 일회성 토큰**으로만 | 틀린 토큰이면 접속 즉시 거절 | `e2e-test`: 가짜 토큰 거절 |
| 닉네임 중복 방지 · 닉네임 12자 · 최대 200명 | `QuizRoom` 입장 검사 | `e2e-test`: 중복 닉네임 거절 |
| 퀴즈 저장 입력 검증 | 화면과 서버가 같은 `validateQuizInput` 사용 | 단위 테스트, `quiz-crud-test`(잘못된 입력은 400) |
| 모든 화면이 **같은 순간에 카운트다운** | 서버가 보낸 현재 시각으로 내 시계와의 차이를 보정 | 구현함. 시계가 어긋난 기기로는 **확인하지 못함** |
| 새로고침해도 **같은 사람으로 복귀** | 기기 id(`localStorage`)로 점수·닉네임 유지 | 구현함. 자동 시험은 **하지 않음** |

---

## 로컬에서 실행

```bash
npm install
npm run db:migrate:local      # 로컬 D1 에 표 + 예시 퀴즈 (Cloudflare 계정 없이 동작)
npm run dev:server            # http://localhost:8787
npm run dev:web               # http://localhost:5173  (다른 터미널)
```

브라우저에서 `http://localhost:5173` 을 열면 홈입니다. 같은 Wi-Fi 의 폰으로 시험하려면 Vite 가 출력하는 `Network:` 주소(`http://<PC의 IP>:5173`)로 **큰 화면도** 여세요. (QR 에 들어가는 주소가 그 주소가 됩니다)

```bash
npm test             # 점수·저장 규칙 단위 테스트 (서버 불필요)
npm run test:e2e     # 퀴즈 편집 API + 한 판 진행 확인 (npm run dev:server 가 켜져 있어야 함)
npm run typecheck    # 타입 검사
npm run capture      # README 사진 다시 만들기 (아래)
```

**README 사진 다시 만들기** — Playwright 가 필요합니다. 서버 두 개(`dev:server`, `dev:web`)를 켜 둔 채로:

```bash
npm i -D playwright && npx playwright install chromium
npm run capture
```

진행자 1명 + 폰 4대로 데모 퀴즈 한 판을 돌리며 `docs/screenshots/` 에 저장하고, 끝나면 데모 퀴즈를 지웁니다. ⚠️ 배포한 서버에는 돌리지 마세요(기본값은 로컬 주소입니다).

---

## 배포 방법

화면은 **Cloudflare Pages**, 서버는 **Cloudflare Worker** 로 따로 올립니다. 둘 다 같은 GitHub 저장소에서 폴더만 달리 지정해서 올리고, `main` 에 푸시하면 자동으로 다시 배포됩니다. (이 프로젝트는 아래 방법으로 배포했습니다)

### 1. 저장소 만들기 (Cloudflare 대시보드)

1. **D1** → 데이터베이스 만들기: 이름 `tob-quiz-db` → 콘솔에 `server/schema.sql` 내용을 붙여 넣고 실행
2. **KV** → 네임스페이스 만들기: 이름 `ROOMS`
3. 두 곳의 ID(데이터베이스 ID, 네임스페이스 ID)를 `server/wrangler.toml` 의 `database_id`, KV `id` 에 넣고 푸시

### 2. 서버 (Worker) — GitHub 연결

| 칸 | 값 |
|---|---|
| 프로젝트 이름 | `tob-quiz-server` (`wrangler.toml` 의 `name` 과 **같아야** 함) |
| 경로(루트 디렉터리) | `server` |
| 빌드 명령 | `cd .. && npm ci` (`shared/` 와 같이 설치해야 해서 맨 위 폴더에서) |
| 배포 명령 | `npx wrangler deploy` |

배포되면 `https://tob-quiz-server.<계정>.workers.dev` 주소가 나옵니다.

### 3. 화면 (Pages) — GitHub 연결

| 칸 | 값 |
|---|---|
| 프레임워크 | 없음 |
| 빌드 명령 | `npm ci && npm run build` |
| 빌드 출력 디렉터리 | `web/dist` |
| 환경 변수 `NODE_VERSION` | `22` |
| 환경 변수 `VITE_API_HOST` | 2번의 서버 주소 (`https://` 없이, 예: `tob-quiz-server.<계정>.workers.dev`) |

> `VITE_API_HOST` 는 **빌드할 때** 화면 코드에 들어갑니다. 값을 바꿨다면 다시 배포해야 적용됩니다. 비어 있거나 틀리면 화면에 "서버에 연결할 수 없어요" 안내가 뜹니다.

### 명령어로 배포하고 싶다면

```bash
cd server
npx wrangler login
npx wrangler d1 create tob-quiz-db          # 출력된 database_id → wrangler.toml
npx wrangler kv namespace create ROOMS      # 출력된 id → wrangler.toml
npx wrangler d1 execute tob-quiz-db --remote --file=./schema.sql
npx wrangler deploy
cd ../web
VITE_API_HOST=tob-quiz-server.<계정>.workers.dev npm run deploy   # Pages
```

배포 후 `server/wrangler.toml` 의 `ALLOWED_ORIGINS` 를 Pages 주소로 좁히면 다른 사이트에서의 호출을 막을 수 있습니다. (지금은 `*` 라서 어디서든 호출됩니다)

---

## 데이터와 개인정보

| 어디에 | 무엇을 | 얼마나 |
|---|---|---|
| D1 | 퀴즈·문항, **게임 결과(닉네임·점수·순위)** | 퀴즈는 지울 때까지. **게임 결과는 지우는 기능이 아직 없어 계속 남습니다** |
| KV | 방 정보(PIN → 퀴즈 번호·진행자 토큰) | 6시간 뒤 자동 삭제 |
| 서버 메모리(Durable Object) | 진행 중인 방의 참가자·점수 | 방이 쓰이는 동안. 별도 저장은 하지 않음 |
| 폰 브라우저(`localStorage`) | 기기 id, 마지막에 고른 닉네임·캐릭터, 소리 설정 | 지우기 전까지 |

- 가입·이메일·전화번호·명단은 받지 않습니다. 닉네임과 캐릭터만 씁니다.
- 로그인이 없으므로 **주소를 아는 사람은 누구나 `/host/quizzes` 에서 퀴즈를 고치거나 지울 수 있습니다.** 걱정되면 코드 수정 없이 Cloudflare Access(무료)로 `/host*` 경로만 잠글 수 있습니다.
- 웹폰트(Pretendard, 나눔명조)는 외부(jsDelivr, Google Fonts)에서 불러옵니다. 연결이 안 되면 기기 기본 한글 폰트로 보입니다.

---

## 확인한 것과 확인하지 못한 것

| 항목 | 상태 |
|---|---|
| 단위 테스트 5개 (점수식, 저장 규칙) | 통과 |
| 퀴즈 편집 API 확인 (`quiz-crud-test`) | 통과 (만들기·읽기·고치기·지우기, 잘못된 입력 400) |
| 한 판 진행 확인 (`e2e-test`) | 통과 (카운트다운 중 답 무시, 점수, 순위 변동 데이터, 진행자 토큰, 닉네임 중복) |
| 진행자 1 + 가상 폰 4대로 3문제와 시상식까지 | 통과 (이 README 의 사진이 그 화면, 페이지 오류 없음) |
| 배포된 서버 응답 (`/api/health`, 퀴즈 목록, 퀴즈 만들기·읽기) | 확인함 |
| **실제 폰 여러 대로 한 판** | **아직 하지 않음.** 사진은 가상 폰(아이폰 13 크기) 화면입니다 |
| **iOS 사파리 · 카카오톡 인앱 브라우저** | **확인하지 못함.** 소리 자동 재생, 화면 꺼짐 후 복귀가 폰마다 다를 수 있음 |
| 배포된 Pages 화면을 직접 열어 본 것 | 확인하지 못함 (이 작업 환경에서 접속이 막혀 있음). 배포 설정은 위 표대로 했습니다 |
| 많은 인원(수십 명) 동시 접속 | 시험하지 않음. 한 방 200명까지 받도록 되어 있지만 **실제로 돌려 보지 않았습니다** |
| 배경음악이 화면 분위기에 어울리는지 | **직접 듣고 고르지 못했습니다.** 곡 설명·악기·BPM 으로 골랐으니 직접 들어 보고 바꿔 주세요 |
| 색종이·카메라 연출이 저사양 폰에서 부드러운지 | 확인하지 못함. 폰의 "동작 줄이기" 설정이 켜져 있으면 움직임이 꺼집니다 |

위 "하지 않음/확인하지 못함" 항목은 [행사 전 리허설 체크리스트](docs/REHEARSAL.md) 순서대로 폰으로 직접 확인할 수 있습니다.

**알아 둘 점**

- **진행자가 페이지를 나가거나 새로고침하면 방이 끝납니다.** 의도한 동작입니다. 진행자 연결이 끊긴 지 10초 안에 돌아오지 않으면 참가자 폰에 "진행자가 나가서 퀴즈가 끝났어요"가 뜨고 그 PIN 은 못 씁니다. (와이파이가 순간적으로 끊겼다 바로 돌아오는 경우는 유지됩니다.) 이미 최종 결과까지 간 게임은 진행자가 나가도 폰의 결과 화면이 그대로 남습니다. 진행 도중 실수로 나갔다면 PLAY 로 새 방을 만들고 QR 을 다시 안내해야 합니다.
- 방 폭주(메시지를 한꺼번에 많이 보내는 경우)를 막는 속도 제한은 **없습니다.**
- 폰에는 문제 글이 나오지 않고 버튼만 있어서(카훗 방식), 스크린이 안 보이는 자리에서는 문제를 읽을 수 없습니다.
- 정답·오답 효과음 2개(`sfx_correct.mp3`, `sfx_wrong.mp3`)는 **출처를 확인하지 못했습니다.**

---

## 라이선스 · 출처

- **배경음악**: Kevin MacLeod ([incompetech.com](https://incompetech.com)) — *Pleasant Porridge*, *Loopster*, *Funky Chunk*, *Heroic Age*, [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). 출처 표기 문구와 원곡에서 바꾼 점은 [`web/public/audio/CREDITS.md`](web/public/audio/CREDITS.md) 에 있고, 화면 아래에도 표기됩니다.
- **캐릭터 · 아이콘 · 연출**: 이 프로젝트에서 SVG 와 CSS 로 직접 만든 것입니다. 외부 이미지는 쓰지 않았습니다.
- **글꼴**: [Pretendard](https://github.com/orioncactus/pretendard) (SIL OFL), 나눔명조 (SIL OFL, Google Fonts)
- **라이브러리**: React, Vite, Tailwind CSS, React Router, [qrcode.react](https://github.com/zpao/qrcode.react), [PartyServer / PartySocket](https://github.com/cloudflare/partykit), Cloudflare Workers · Pages · D1 · KV
