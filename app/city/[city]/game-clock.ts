const hour = 60 * 60 * 1000;
const day = 24 * hour;
const week = 7 * day;
const weekdayHours = 2;

// UTC values represent the in-game calendar, independent of device time zones.
export const gameStart = Date.UTC(2026, 10, 6, 18);
const firstMonday = Date.UTC(2026, 10, 2);


export const salary = 300;
export const bonus = 20;
export const bonusHour = 10;
export const legacyMealPrice = 100;

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

  if (workday && clock === 7) return { id: "commute", location: "출근 중", scene: "street" } as const;
  if (workday && clock >= 8 && clock < 18) return { id: "work", location: "회사", scene: "office" } as const;
  if (workday && clock === 18) return { id: "leave", location: "퇴근 중", scene: "return" } as const;
  if (!workday && clock >= 10 && clock < 12) return { id: "coffee", location: "카페", scene: "cafe" } as const;
  if (!workday && clock >= 14 && clock < 16) return { id: "park", location: "공원", scene: "park" } as const;
  if (clock >= 23 || clock < 7) return { id: "sleep", location: "집 · 취침중", scene: "home" } as const;
  return { id: "rest", location: "집 · 휴식중", scene: "home" } as const;
}

export function earningsAt(time: number, policyStartsAfter = gameStart, bonusStartsAfter = gameStart) {
  const payments: { time: number; label: string; amount: number }[] = [];

  for (let midnight = gameStart + 6 * hour; midnight <= time; midnight += day) {
    const date = new Date(midnight);
    const weekday = date.getUTCDay();
    const evening = midnight + 18 * hour;
    const morning = midnight + bonusHour * hour;
    const legacy = evening <= policyStartsAfter;
    const lastDay = new Date(midnight + day).getUTCMonth() !== date.getUTCMonth();
    if (morning > bonusStartsAfter && morning <= time && (weekday === 1 || weekday === 3 || weekday === 5)) {
      payments.push({ time: morning, label: "보너스 도착! 🎁", amount: bonus });
    }
    if (evening > time) continue;
    if (legacy ? date.getUTCDate() === 25 : lastDay) {
      payments.push({ time: evening, label: "월급", amount: legacy ? 1800 : salary });
    }
    if (evening <= bonusStartsAfter && weekday === (legacy ? 4 : 5)) {
      payments.push({ time: evening, label: legacy ? "목요일 보너스" : "금요일 보너스", amount: legacy ? 300 : 50 });
    }
  }

  return { total: payments.reduce((sum, payment) => sum + payment.amount, 0), payments };
}

export const gameDateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "UTC", year: "numeric", month: "long", day: "numeric", weekday: "long",
});

export const gameHourFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});


const weekdayFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", weekday: "long" });

export function gameBarDate(time: number) {
  const date = new Date(time).toISOString().slice(0, 10).replaceAll("-", "/");
  return `${date}/${weekdayFormat.format(time)} ${gameHourFormat.format(time)}`;
}
