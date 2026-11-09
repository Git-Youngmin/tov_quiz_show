import { useEffect, useState } from "react";

/** endsAt(ms epoch) 까지 남은 초 */
export function useCountdown(endsAt: number | null | undefined): number {
  const calc = () => (endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!endsAt) return;
    const t = setInterval(() => setLeft(calc()), 200);
    return () => clearInterval(t);
  }, [endsAt]);
  return left;
}
