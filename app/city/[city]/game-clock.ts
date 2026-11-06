const hour = 60 * 60 * 1000;
const day = 24 * hour;
const week = 7 * day;
const realWeek = 22 * hour;

// UTC values represent the in-game calendar, independent of device time zones.
export const gameStart = Date.UTC(2026, 10, 6, 18);
const firstMonday = Date.UTC(2026, 10, 2);
const startOffset = 19 * hour;

export const salary = 1800;
export const bonus = 300;
export const payday = 25;
export const mealPrice = 100;

export function gameTimeAt(elapsed: number) {
  const realTime = startOffset + Math.max(0, elapsed);
  const weeks = Math.floor(realTime / realWeek);
  const remaining = realTime % realWeek;
  const weekdayTime = 20 * hour;
  const gameOffset = remaining < weekdayTime
    ? remaining * 6
    : 5 * day + (remaining - weekdayTime) * 24;

  return firstMonday + weeks * week + gameOffset;
}

export function routineAt(time: number) {
  const date = new Date(time);
  const weekday = date.getUTCDay();
  const clock = date.getUTCHours();
  const workday = weekday >= 1 && weekday <= 5;

  if (workday && clock === 8) return { id: "commute", location: "출근 중", mission: "일 하러 가기", scene: "street" } as const;
  if (workday && clock >= 9 && clock < 18) return { id: "work", location: "회사", mission: null, scene: "office" } as const;
  if (workday && clock === 18) return { id: "leave", location: "퇴근 중", mission: "퇴근하기", scene: "return" } as const;
  if (clock >= 23 || clock < 7) return { id: "sleep", location: "집 · 취침 중", mission: null, scene: "home" } as const;
  return { id: "rest", location: "집 · 휴식 중", mission: null, scene: "home" } as const;
}

export function earningsAt(time: number) {
  const payments: { time: number; label: string; amount: number }[] = [];
  let total = 0;

  for (let paymentTime = gameStart + day; paymentTime <= time; paymentTime += day) {
    const date = new Date(paymentTime);
    const isPayday = date.getUTCDate() === payday;
    const isBonusDay = date.getUTCDay() === 4;
    if (isPayday) payments.push({ time: paymentTime, label: "월급", amount: salary });
    if (isBonusDay) payments.push({ time: paymentTime, label: "목요일 보너스", amount: bonus });
    total += (isPayday ? salary : 0) + (isBonusDay ? bonus : 0);
  }

  return { total, recent: payments.slice(-8).reverse() };
}

export const gameDateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "UTC", year: "numeric", month: "long", day: "numeric", weekday: "long",
});

export const gameHourFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "UTC", hour: "numeric", minute: "2-digit", hour12: true,
});
