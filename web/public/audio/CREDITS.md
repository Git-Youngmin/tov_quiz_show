# 배경음악 출처

모든 BGM 은 **Kevin MacLeod** 의 곡이며 **Creative Commons: By Attribution 4.0 (CC BY 4.0)** 라이선스로 사용합니다.
조건은 "출처 표기"이고, 상업적 이용·편집(음량 조절, 자르기 등)이 허용됩니다. 표기 문구는 곡 제공처의 안내 형식 그대로입니다.

```
"Pleasant Porridge", "Loopster", "Funky Chunk", "Heroic Age"
Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
http://creativecommons.org/licenses/by/4.0/
```

| 화면 | 파일 | 곡 | 원곡 정보 |
|---|---|---|---|
| 로비 | `bgm_lobby.mp3` | Pleasant Porridge | 119 BPM · 일렉트릭 피아노, 기타, 베이스, 드럼 |
| 문제 풀이 | `bgm_playing.mp3` | Loopster | 108 BPM · 베이스, 일렉트릭 피아노, 드럼 |
| 점수판 | `bgm_leaderboard.mp3` | Funky Chunk | 115 BPM · 베이스, 일렉트릭 피아노, 드럼, 기타, 신스, 호른 |
| 시상식 | `bgm_finished.mp3` | Heroic Age | 129 BPM · 플루트, 클라리넷, 오보에, 트롬본, 튜바, 첼로 |

출처: https://incompetech.com/music/royalty-free/ (곡 목록에서 제목으로 검색)

## 원곡에서 바꾼 점 (편집은 라이선스상 허용)
- 앞뒤의 무음 구간 제거 (반복 재생 때 어색하게 쉬지 않도록)
- 음량을 -18 LUFS 로 통일 (곡마다 크기가 달라 화면이 바뀔 때 깜짝 놀라지 않도록)
- 시작 0.25초 페이드인, 끝 1.4초 페이드아웃 (반복 지점이 뚝 끊기지 않도록)
- 용량을 줄이기 위해 가변 비트레이트 MP3 로 다시 인코딩

## 곡을 바꾸고 싶을 때
같은 이름으로 `bgm_*.mp3` 를 덮어쓰고, 이 문서와 `web/src/audio/credits.ts` 의 곡 이름도 함께 고치세요.
(출처 표기가 필요 없는 곡으로 바꾸면 `MusicCredit` 을 화면에서 빼도 됩니다.)

## 효과음
`sfx_correct.mp3`, `sfx_wrong.mp3` 두 파일은 이 문서의 정리 대상이 아니며, 출처가 확인되지 않았습니다.
