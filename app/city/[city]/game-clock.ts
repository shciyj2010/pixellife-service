const hour = 60 * 60 * 1000;
const day = 24 * hour;
const week = 7 * day;
const weekdayHours = 2;

// UTC values represent the in-game calendar, independent of device time zones.
export const gameStart = Date.UTC(2026, 10, 6, 18);
const firstMonday = Date.UTC(2026, 10, 2);


export const salary = 1800;
export const bonus = 300;
export const payday = 25;
export const mealPrice = 100;

export function gameTimeAt(elapsed: number, hoursPerWeekday = weekdayHours) {
  const weekdayTime = 5 * hoursPerWeekday * hour;
  const realWeek = weekdayTime + 2 * hour;
  const startOffset = 4.75 * hoursPerWeekday * hour;
  const realTime = startOffset + Math.max(0, elapsed);
  const weeks = Math.floor(realTime / realWeek);
  const remaining = realTime % realWeek;
  const gameOffset = remaining < weekdayTime
    ? remaining * (24 / hoursPerWeekday)
    : 5 * day + (remaining - weekdayTime) * 24;

  return firstMonday + weeks * week + gameOffset;
}

export function migrateElapsed(elapsed: number) {
  const gameElapsed = gameTimeAt(elapsed, 4) - firstMonday;
  const weeks = Math.floor(gameElapsed / week);
  const remaining = gameElapsed % week;
  const weekdays = Math.min(remaining, 5 * day);
  const weekend = remaining - weekdays;
  return weeks * (5 * weekdayHours + 2) * hour
    + weekdays * weekdayHours / 24 + weekend / 24 - 4.75 * weekdayHours * hour;
}

export function routineAt(time: number) {
  const date = new Date(time);
  const weekday = date.getUTCDay();
  const clock = date.getUTCHours();
  const workday = weekday >= 1 && weekday <= 5;

  if (workday && clock === 7) return { id: "commute", location: "출근 중", mission: "일 하러 가기", scene: "street" } as const;
  if (workday && clock >= 8 && clock < 18) return { id: "work", location: "회사", mission: null, scene: "office" } as const;
  if (workday && clock === 18) return { id: "leave", location: "퇴근 중", mission: "퇴근하기", scene: "return" } as const;
  if (!workday && clock >= 10 && clock < 12) return { id: "coffee", location: "카페", mission: null, scene: "cafe" } as const;
  if (!workday && clock >= 14 && clock < 16) return { id: "park", location: "공원", mission: null, scene: "park" } as const;
  if (clock >= 23 || clock < 7) return { id: "sleep", location: "집 · 취침중", mission: null, scene: "home" } as const;
  return { id: "rest", location: "집 · 휴식중", mission: null, scene: "home" } as const;
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
  timeZone: "UTC", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
});


const weekdayFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", weekday: "long" });

export function gameBarDate(time: number) {
  const date = new Date(time);
  return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${weekdayFormat.format(time)}`;
}
