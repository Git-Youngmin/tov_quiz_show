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
| `/` | 투트랙: **문제 만들기**(출제자 → `/host`) / **PLAY**(참가자 → `/play`) |
| `/host` | 관리자 로그인 → 퀴즈 세트 선택 → PIN·QR 로비 → [시작] · [마감] · [다음 문제] → 최종 순위 |
| `/host/quizzes` | **퀴즈 편집**: 세트 만들기·수정·삭제, 문제 추가·복제·순서 변경, 단톡방 글 붙여넣기 가져오기 |
| `/play?pin=123456` | PIN 입력(QR 이면 자동 채움) → 닉네임 + 캐릭터(모양 4 × 색 6) → 4색 리모컨 → 정답/등수 피드백 |

## 디자인

- 경원교회 홈페이지의 **네이비 + 골드** 팔레트, 본문 Pretendard · 제목 나눔명조. 색은 `web/src/index.css` 의 `@theme` 토큰에서 바꿉니다.
- **오로라 배경** (`components/AuroraBackground.tsx`): 가만히 있어도 일렁이고, 스크롤하면 층마다 다른 속도로 흘러갑니다. `prefers-reduced-motion` 이면 멈춥니다.
- **캐릭터** (`components/CharacterAvatar.tsx`): 모양 4종 × 색 6종을 얼굴·팔·발·그림자·음영이 있는 오리지널 SVG 로 그렸습니다(외부 이미지 없음 → 라이선스 걱정 없음). 상태(`mood`)별로 깜빡임·두리번·둥실·만세·울상·졸기·손 흔들기가 CSS 로 움직입니다. 홈·로비·결과·시상대에 나옵니다.

## 퀴즈 편집 · 문제 유형

- 문제는 **4지선다**(빨강▲·파랑◆·노랑●·초록■)와 **O/X**(파랑 O · 빨강 X, 참가자 폰에 큰 버튼 2개) 두 가지이고, 문제마다 섞어 쓸 수 있습니다. 제한 시간 기본값은 O/X 15초, 4지선다 20초입니다.
- **붙여넣기 가져오기**: 편집 화면의 "단톡방에 올리던 글 붙여넣기"에 기존 형식 그대로 붙여 넣으면 문제로 바꿔 줍니다. 인식 결과(O/X·4지선다 개수, 건너뛴 문제와 이유)가 미리 보이고, 가져온 뒤 수정해서 저장합니다.

  | 지원하는 형식 | 예 |
  |---|---|
  | 번호 | `1. 문제` · `1) 문제` |
  | O/X 정답 | `정답: O` · `답 : X` · `정답: (O)` · 문제 끝 `( O )` · 문제 끝 `(O / X)` 표시는 자동 제거 |
  | 4지선다 보기 | `① ② ③ ④` · `A. B. C. D.` |
  | 4지선다 정답 | `정답: 3` · `답 : ③` · `정답: C` · `정답: ③ 보기 글 그대로` · 문제 끝 `? 3` |

  파서는 실제로 쓰던 퀴즈 17개(205문제)로 확인했고, 모두 경고 없이 읽혔습니다. (`shared/src/parse.ts`, 테스트는 `npm test`)

## 게임 규칙

- 점수: $1000 \times \left(1 - \dfrac{t_{\text{응답}}}{t_{\text{제한}}} \cdot \dfrac{1}{2}\right)$ → 즉시 1000점, 마지막 순간 500점, 오답 0점
- 연속 정답(streak) 2 이상이면 $+100$ 보너스
- 응답 시간은 **서버가 문제를 연 시각 기준**으로 계산 (클라이언트 시계 조작 방지)
- 접속 중인 전원이 답하면 제한 시간 전에 바로 마감
- 정답/점수는 문제 마감 후 공개 (중간 공개 시 정답 공유 방지)
- 참가자는 기기별 `playerId`(localStorage)로 식별 → 새로고침·재접속해도 점수 유지

## 로컬 실행

```bash
npm install
cp server/.dev.vars.example server/.dev.vars   # ADMIN_PASSWORD=tob1234
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
npx wrangler secret put ADMIN_PASSWORD
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
