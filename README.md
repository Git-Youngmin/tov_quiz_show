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
| `/` | 투트랙: **진행하기** / **참가하기** |
| `/host` | 관리자 로그인 → 퀴즈 세트 선택 → PIN·QR 로비 → [시작] · [마감] · [다음 문제] → 최종 순위 |
| `/play?pin=123456` | PIN 입력(QR 이면 자동 채움) → 닉네임 + 캐릭터(모양 4 × 색 6) → 4색 리모컨 → 정답/등수 피드백 |

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

- 퀴즈 세트 편집 UI (지금은 D1 에 SQL 로 입력)
- 진행자 화면 효과음·BGM, 결과 애니메이션
- 문제 이미지 첨부 (R2)
