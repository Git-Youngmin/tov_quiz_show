# 토브 퀴즈쇼 (Tob Quiz Show)

교회 중고등부용 **카훗 스타일 실시간 퀴즈**. 진행자가 예배당 스크린에 PIN/QR 을 띄우면 학생들이 스마트폰으로 접속해 4색 버튼으로 답합니다.

## 구조

```
.
├─ shared/   프론트·백엔드 공용 타입, 메시지 규약(protocol.ts), 점수 계산(scoring.ts)
├─ server/   Cloudflare Worker + PartyServer(Durable Object) WebSocket
│  ├─ wrangler.toml      DO / D1 / KV 바인딩
│  ├─ schema.sql         D1 스키마 (Quizzes, Questions, GameSessions, GameResults)
│  ├─ seed.sql           로컬 예시 퀴즈
│  ├─ src/index.ts       Worker 진입점 (REST + /parties 라우팅)
│  ├─ src/QuizRoom.ts    방 1개 = DO 1개, Room State 메모리 관리
│  └─ scripts/e2e-test.mjs  게임 1판 스모크 테스트
└─ web/      React + Vite + Tailwind v4 + React Router (Cloudflare Pages)
   └─ src/pages/  HomePage(/) · HostPage(/host) · PlayPage(/play)
```

| 경로 | 화면 |
|---|---|
| `/` | 운영자용 홈: **문제 만들기**(→ `/host/quizzes`) / **PLAY**(→ `/host`) |
| `/host` | **PLAY** — 스크린에 띄우는 진행 화면: 퀴즈 고르기 → PIN·QR 로비 → [시작] · [마감] · [다음 문제] → 최종 순위 (로그인 없음) |
| `/host/quizzes` | **퀴즈 편집**: 세트 만들기·수정·삭제, 문제 추가·복제·순서 변경 |
| `/play?pin=123456` | **참가자 입장 페이지** (QR 로 바로 도착, 홈 링크 없음): PIN 자동 확인 → 닉네임 + 캐릭터 → 4색/O·X 리모컨 → 정답/등수 피드백. PIN 없이 열면 PIN 입력 칸이 나옴 |

## 디자인

- 경원교회 홈페이지의 **네이비 + 골드** 팔레트, 본문 Pretendard · 제목 나눔명조. 색은 `web/src/index.css` 의 `@theme` 토큰에서 바꿉니다.
- **오로라 배경** (`components/AuroraBackground.tsx`): 가만히 있어도 일렁이고, 스크롤하면 층마다 다른 속도로 흘러갑니다. `prefers-reduced-motion` 이면 멈춥니다.
- **캐릭터** (`components/CharacterAvatar.tsx`): 머리 · 몸통 · 팔과 장갑 낀 손 · 다리와 신발이 따로 있는 애니메이션풍 치비 캐릭터입니다. 모양 4종이 각각 다른 캐릭터이고(캡슐=**젤리**, 상자=**로봇**, 구=**고양이**, 원뿔=**마법사**), 색 6종이 그대로 적용됩니다. 전부 직접 그린 SVG 라서 외부 이미지·라이선스 걱정이 없습니다.
  - 상태(`mood`)별로 머리·팔·다리·눈이 따로 움직입니다: 숨쉬기·고개 갸웃·눈 깜빡·두리번(idle), 손 흔들기(wave), 폴짝+만세(cheer/happy), 울상(sad), 꾸벅 졸기(sleepy). CSS 애니메이션이라 수십 명이 있어도 가볍습니다.
  - 작은 목록에는 `bust` 로 머리~가슴만 보여 줍니다. 홈·로비·결과·시상대에 나옵니다.

## 배경음악

진행 화면에서 화면별로 자동 전환됩니다. 전부 **Kevin MacLeod 의 CC BY 4.0 곡**이라 **출처 표기가 조건**이고, 로비·최종 화면 아래에 작게 표기됩니다.

| 화면 | 곡 |
|---|---|
| 로비 | Pleasant Porridge |
| 문제 풀이 | Loopster |
| 점수판 | Funky Chunk |
| 시상식 | Heroic Age |

곡 정보·표기 문구·원곡에서 바꾼 점은 [`web/public/audio/CREDITS.md`](web/public/audio/CREDITS.md) 에 있습니다. 곡을 바꿀 때는 같은 이름으로 `bgm_*.mp3` 를 덮어쓰고 그 문서와 `web/src/audio/credits.ts` 도 같이 고치세요.

## 퀴즈 편집 · 문제 유형

- 문제는 **4지선다**(빨강▲·파랑◆·노랑●·초록■)와 **O/X**(파랑 O · 빨강 X, 참가자 폰에 큰 버튼 2개) 두 가지이고, 문제마다 섞어 쓸 수 있습니다. 제한 시간 기본값은 10초이고, 편집 화면의 슬라이더로 10~20초 사이를 조절합니다.

## 운영 방식 (로그인 없음)

운영자 한 사람이 쓰는 서비스라 **비밀번호/로그인이 없습니다.** 선생님은 `/` → PLAY 를 스크린에 띄우고, 학생들은 스크린의 QR 만 찍습니다. 방마다 발급되는 일회성 `hostToken` 으로 "진행자 권한"만 구분합니다.
> 주소를 아는 사람은 `/host/quizzes` 에서 퀴즈를 고치거나 지울 수 있습니다. 걱정되면 코드 수정 없이 Cloudflare Access(무료)로 `/host*` 경로만 잠글 수 있습니다.

## 게임 규칙

- 점수: $1000 \times \left(1 - \dfrac{t_{\text{응답}}}{t_{\text{제한}}} \cdot \dfrac{1}{2}\right)$ → 즉시 1000점, 마지막 순간 500점, 오답 0점
- 연속 정답 보너스는 없습니다. 정답은 응답 속도에 따른 점수만 받습니다 (최대 1000점).
- 응답 시간은 **서버가 답을 받기 시작한 시각(`startsAt`) 기준**으로 계산 (클라이언트 시계 조작 방지)
- 접속 중인 전원이 답하면 제한 시간 전에 바로 마감
- 정답/점수는 문제 마감 후 공개 (중간 공개 시 정답 공유 방지)
- 참가자는 기기별 `playerId`(localStorage)로 식별 → 새로고침·재접속해도 점수 유지

## 한 라운드의 흐름 (연출)

| 단계 | 진행 화면 | 폰 |
|---|---|---|
| ① 소개 (1초) | "O/X 퀴즈!" 또는 "4지선다 퀴즈!" 카드가 쾅 | 같은 화면 |
| ② 카운트다운 (3초) | 3 → 2 → 1 (숫자마다 파동 + 똑딱 소리). **이 동안은 답을 받지 않음** | 같은 화면 (서버 시계 기준이라 모든 기기가 동시에) |
| ③ 문제 (제한 시간) | 문제 + 줄어드는 시간 막. O/X 는 버튼을 작게, 문제 글을 크게 | O/X 는 큼직한 정사각형 2개, 4지선다는 4색 버튼 |
| ④ 결과 발표 | "🥁 결과 발표!" → 정답 공개(보기별 인원 막대, 정답 반짝) | 정답/오답 + 점수가 올라감 → 순위가 바뀌며 ▲▼ |
| ⑤ 점수판 | **이전 점수·순서로 보여 주다가 → 이번 점수가 붙으며 숫자가 올라가고 → 새 순위 자리로 줄이 쑥 이동.** 오른 캐릭터는 폴짝, 내린 캐릭터는 풀이 죽음, 1등은 👑 | |
| ⑥ 최종 | 3등 → 2등 → 1등 순서로 시상대에 차례로 등장 | |

모두 같은 점수(0점)로 시작한 첫 라운드는 "공동 1등"일 뿐이라 순위 변동(▲▼)을 표시하지 않습니다.

## 로컬 실행

```bash
npm install
npm run db:migrate:local                        # 로컬 D1 에 스키마 + 예시 퀴즈
npm run dev:server                              # http://localhost:8787
npm run dev:web                                 # http://localhost:5173 (다른 터미널)
```

같은 Wi-Fi 의 폰에서는 Vite 가 출력하는 `Network:` 주소로 접속합니다. 스모크 테스트: `npm run test:e2e` (dev:server 실행 중), 점수 단위 테스트: `npm test`.

## Cloudflare 배포

```bash
cd server
npx wrangler d1 create tob-quiz-db          # 출력된 database_id → wrangler.toml
npx wrangler kv namespace create ROOMS      # 출력된 id → wrangler.toml
npx wrangler d1 execute tob-quiz-db --remote --file=./schema.sql
npx wrangler deploy                         # → https://tob-quiz-server.<계정>.workers.dev
```

```bash
cd web
VITE_API_HOST=tob-quiz-server.<계정>.workers.dev npm run deploy   # Cloudflare Pages
```

배포 후 `server/wrangler.toml` 의 `ALLOWED_ORIGINS` 를 Pages 도메인으로 좁히는 것을 권장합니다.

## 다음 단계 후보

- 진행자 화면 효과음·BGM, 결과 애니메이션
- 문제 이미지 첨부 (R2)
