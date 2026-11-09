/**
 * 서버 시계 맞추기.
 * 폰·PC 마다 시계가 몇 초씩 다를 수 있어서, 서버가 문제 정보와 함께 보내 주는 `now` 로
 * 내 시계와의 차이를 기억해 두고 카운트다운(startsAt/endsAt)을 모두 서버 시각 기준으로 계산한다.
 */
let offset = 0;

export function syncServerClock(serverNow: number): void {
  offset = serverNow - Date.now();
}

/** 서버 기준 현재 시각 (ms) */
export function nowMs(): number {
  return Date.now() + offset;
}
