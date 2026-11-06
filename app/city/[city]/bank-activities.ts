export const gameHour = 3_600_000;
export const activities = {
  overtime: { label: "회사에서 야근하기", location: "회사 · 야근 중", scene: "office", hours: 4, amount: 100 },
  cafe: { label: "카페에서 알바하기", location: "카페 · 알바 중", scene: "cafe", hours: 4, amount: 100 },
  storeShift: { label: "편의점에서 알바하기", location: "편의점 · 알바 중", scene: "store", hours: 4, amount: 100 },
  store: { label: "편의점에서 쇼핑하기", location: "편의점 · 쇼핑 중", scene: "store", hours: 1, amount: -20 },
} as const;

export type ActivityId = keyof typeof activities;
export type Activity = { id: ActivityId; endsAt: number; amount: number };
export type BankMode = "earn" | "spend";

export function activityPayments(history: Activity[], time: number) {
  return history.filter(({ endsAt }) => endsAt <= time).map(({ id, endsAt, amount }) => ({
    time: endsAt,
    label: activities[id].label,
    amount,
  }));
}

export const housePrices = [1000, 3000, 6000, 10000, 20000] as const;
