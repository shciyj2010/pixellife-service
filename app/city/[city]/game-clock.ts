const hour = 60 * 60 * 1000;
const day = 24 * hour;
const week = 7 * day;
const weekdayHours = 2;

// UTC values represent the in-game calendar, independent of device time zones.
export const gameStart = Date.UTC(2016, 10, 6, 18);
export const gameEnd = Date.UTC(2026, 10, 6, 18);
const realCampaignDuration = 30 * day;
const firstMonday = Date.UTC(2026, 10, 2);


export const salaryHour = 10;
export const bonus = 100_000;
export const bonusHour = 10;
export const weeklyShopping = 100_000;
export const paydayShopping = 500_000;
export const vacationExpense = 5_000_000;
export const birthdayBonus = 1_000_000;
export const legacyMealPrice = 1_000_000;

const monthlyMinimumWage = [
  1_260_270, 1_352_230, 1_573_770, 1_745_150, 1_795_310,
  1_822_480, 1_914_440, 2_010_580, 2_060_740, 2_096_270, 2_156_880,
];

export function salaryAt(time: number) {
  const year = Math.min(2026, Math.max(2016, new Date(time).getUTCFullYear()));
  const minimumWageRatio = monthlyMinimumWage[year - 2016] / monthlyMinimumWage[0];
  return Math.round(2_000_000 * minimumWageRatio ** 1.1 / 100_000) * 100_000;
}

export function legacyGameTimeAt(elapsed: number, hoursPerWeekday = weekdayHours) {
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

export function gameTimeAt(elapsed: number) {
  const progress = Math.min(1, Math.max(0, elapsed) / realCampaignDuration);
  return gameStart + (gameEnd - gameStart) * progress;
}

export function migrateElapsed(elapsed: number) {
  const gameElapsed = legacyGameTimeAt(elapsed, 4) - firstMonday;
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

export function earningsAt(time: number) {
  const payments: { time: number; label: string; amount: number }[] = [];

  const startDate = new Date(gameStart);
  const firstMidnight = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  for (let midnight = firstMidnight; midnight <= time; midnight += day) {
    const date = new Date(midnight);
    const weekday = date.getUTCDay();
    const morning = midnight + salaryHour * hour;
    const evening = midnight + 18 * hour;
    const inGame = (eventTime: number) => eventTime >= gameStart && eventTime <= time;
    const isLastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate() === date.getUTCDate();

    if (weekday === 3 && inGame(morning)) {
      payments.push({ time: morning, label: "수요일 보너스", amount: bonus });
    }
    if ((weekday === 1 || weekday === 3) && inGame(evening)) {
      payments.push({ time: evening, label: "필수 쇼핑", amount: -weeklyShopping });
    }
    if (isLastDay) {
      if (inGame(morning)) payments.push({ time: morning, label: "월급", amount: salaryAt(midnight) });
      if (inGame(evening)) payments.push({ time: evening, label: "월급날 쇼핑", amount: -paydayShopping });
    }
    if (date.getUTCMonth() === 7 && date.getUTCDate() === 1 && inGame(evening)) {
      payments.push({ time: evening, label: "여름 휴가비", amount: -vacationExpense });
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
