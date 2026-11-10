"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cities, type CityId } from "../../cities";
import { birthdayBonus, earningsAt, gameStart, gameTimeAt, legacyGameTimeAt, legacyMealPrice, migrateElapsed, routineAt } from "./game-clock";
import { activities, activityLimitPerGameWeek, activityPayments, activityRewardIds, gameHour, housePrices, type Activity, type ActivityId, type BankMode } from "./bank-activities";
import { gameWeek, portfolioAt, starterCash } from "./asset-policy";

const tabs = ["home", "bank", "bell", "settings"] as const;
export type CityTab = (typeof tabs)[number];
export type AvatarId = "female" | "male";
type CityView = { tab: CityTab; bankMode: BankMode; preview: { shift: string; scene: string } | null };

const defaultView: CityView = { tab: "home", bankMode: "earn", preview: null };
const saveKey = "pixel-city-life:game:v1";
type Save = {
  startedAt: number;
  pausedAt: number | null;
  pausedDuration: number;
  meals: number;
  clockVersion: 3;
  moneyVersion: 1;
  history: Activity[];
  houses: number[];
  policyStartsAfter: number;
  bonusStartsAfter: number;
  starterGrantedAt: number;
  starterNoticeSeen: boolean;
  birthDate: string | null;
  gender: AvatarId | null;
  birthdaySetupVersion: number;
  lastCity: CityId | null;
  avatar: AvatarId;
  views: Partial<Record<CityId, CityView>>;
};

const legacyActivityAmounts = { overtime: 400, cafe: 300, store: -100, storeShift: 100 };

function gameWeekStart(time: number) {
  const date = new Date(time);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.getTime();
}

function validBirthDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function readSave(now = Date.now()): Save | null {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) ?? "null");
    if (saved && Number.isFinite(saved.startedAt) && saved.startedAt > 0 &&
        Number.isSafeInteger(saved.meals) && saved.meals >= 0) {
      const startedAt = saved.clockVersion === 2 || saved.clockVersion === 3
        ? saved.startedAt
        : now - migrateElapsed(now - saved.startedAt);
      const migratingClock = saved.clockVersion !== 3;
      const convertingMoney = saved.moneyVersion !== 1;
      const moneyScale = convertingMoney ? 10_000 : 1;
      const timeShift = migratingClock
        ? gameTimeAt(now - startedAt) - legacyGameTimeAt(now - startedAt)
        : 0;
      const history = Array.isArray(saved.history) ? saved.history
        .filter((entry: Activity) => entry && Object.hasOwn(activities, entry.id) && Number.isSafeInteger(entry.endsAt))
        .map((entry: Activity) => ({
          ...entry,
          endsAt: entry.endsAt + timeShift,
          amount: (Number.isSafeInteger(entry.amount) ? entry.amount : legacyActivityAmounts[entry.id]) * moneyScale,
        })) : [];
      const houses = Array.isArray(saved.houses)
        ? (saved.houses.filter(Number.isSafeInteger).slice(0, housePrices.length) as number[])
          .map((time) => time + timeShift)
        : [];
      const views: Save["views"] = {};
      for (const city of Object.keys(cities) as CityId[]) {
        const view = saved.views?.[city];
        if (!view) continue;
        views[city] = {
          tab: tabs.includes(view.tab) ? view.tab : defaultView.tab,
          bankMode: view.bankMode === "spend" ? "spend" : "earn",
          preview: typeof view.preview?.shift === "string" && typeof view.preview?.scene === "string"
            ? { shift: view.preview.shift, scene: view.preview.scene } : null,
        };
      }
      return {
        startedAt,
        pausedAt: Number.isFinite(saved.pausedAt) && saved.pausedAt > 0 ? saved.pausedAt : null,
        pausedDuration: Number.isFinite(saved.pausedDuration) && saved.pausedDuration >= 0 ? saved.pausedDuration : 0,
        meals: saved.meals,
        clockVersion: 3,
        moneyVersion: 1,
        history,
        houses,
        policyStartsAfter: migratingClock ? gameStart : Number.isSafeInteger(saved.policyStartsAfter)
          ? saved.policyStartsAfter : gameTimeAt(now - startedAt),
        bonusStartsAfter: migratingClock ? gameStart : Number.isSafeInteger(saved.bonusStartsAfter)
          ? saved.bonusStartsAfter : gameTimeAt(now - startedAt),
        starterGrantedAt: migratingClock ? gameStart : Number.isSafeInteger(saved.starterGrantedAt)
          ? saved.starterGrantedAt : gameTimeAt(now - startedAt),
        starterNoticeSeen: saved.starterNoticeSeen === true,
        birthDate: validBirthDate(saved.birthDate) ? saved.birthDate : null,
        gender: saved.gender === "male" || saved.gender === "female" ? saved.gender : null,
        birthdaySetupVersion: saved.birthdaySetupVersion === 1 ? 1 : 0,
        lastCity: typeof saved.lastCity === "string" && Object.hasOwn(cities, saved.lastCity) ? saved.lastCity : null,
        avatar: saved.avatar === "male" ? "male" : "female",
        views,
      };
    }
  } catch {
    // The game can still run for the current visit without browser storage.
  }
  return null;
}

function playerPayments(save: Save | null, time: number) {
  const purchases = (save?.houses ?? []).map((time, index) => ({
    time,
    label: `주택 ${index + 1}단계 구매`,
    amount: -housePrices[index],
  }));
  const grant = save && save.starterGrantedAt <= time
    ? [{ time: save.starterGrantedAt, label: "시작 지원금", amount: starterCash }]
    : [];
  const birthdays: { time: number; label: string; amount: number }[] = [];
  if (save?.birthDate) {
    const [, monthText, dayText] = save.birthDate.split("-");
    const month = Number(monthText) - 1;
    const birthDay = Number(dayText);
    for (let year = new Date(gameStart).getUTCFullYear(); year <= new Date(time).getUTCFullYear(); year += 1) {
      const day = month === 1 && birthDay === 29 && new Date(Date.UTC(year, 1, 29)).getUTCMonth() !== 1 ? 28 : birthDay;
      const birthday = Date.UTC(year, month, day, 10);
      if (birthday >= gameStart && birthday <= time) {
        birthdays.push({ time: birthday, label: "생일 보너스", amount: birthdayBonus });
      }
    }
  }
  return [...grant, ...activityPayments(save?.history ?? [], time), ...purchases, ...birthdays];
}

function writeSave(save: Save) {
  try {
    localStorage.setItem(saveKey, JSON.stringify(save));
  } catch {
    // Keep the current game playable when browser storage is unavailable.
  }
}

function withSaveLock<T>(action: () => T): Promise<T> {
  return navigator.locks ? navigator.locks.request(saveKey, action) : Promise.resolve(action());
}

function balanceAt(save: Save, time: number) {
  return earningsAt(time).total - save.meals * legacyMealPrice
    + playerPayments(save, time).reduce((sum, payment) => sum + payment.amount, 0);
}

function elapsedAt(save: Save, now: number) {
  const endpoint = save.pausedAt ?? now;
  return Math.max(0, endpoint - save.startedAt - save.pausedDuration);
}

export default function useGame(city: CityId) {
  const [save, setSave] = useState<Save | null>(null);
  const [now, setNow] = useState(0);

  const latestSave = useRef<Save | null>(null);

  useEffect(() => {
    let cancelled = false;
    void withSaveLock(() => {
      if (cancelled) return;
      const currentTime = Date.now();
      const current = readSave(currentTime) ?? latestSave.current ?? {
        startedAt: currentTime,
        pausedAt: null,
        pausedDuration: 0,
        meals: 0,
        clockVersion: 3,
        moneyVersion: 1,
        history: [],
        houses: [],
        policyStartsAfter: gameStart,
        bonusStartsAfter: gameStart,
        starterGrantedAt: gameStart,
        starterNoticeSeen: false,
        birthDate: null,
        gender: null,
        birthdaySetupVersion: 0,
        avatar: "female",
        views: {},
      };
      const updated: Save = { ...current, lastCity: city };
      writeSave(updated);
      latestSave.current = updated;
      setSave(updated);
      setNow(currentTime);
    });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    function syncSave(event: StorageEvent) {
      if (event.key !== saveKey) return;
      const currentTime = Date.now();
      const current = readSave(currentTime);
      if (!current) return;
      latestSave.current = current;
      setSave(current);
      setNow(currentTime);
    }

    window.addEventListener("storage", syncSave);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("storage", syncSave);
    };
  }, [city]);

  const time = save ? gameTimeAt(elapsedAt(save, now)) : gameStart;
  const routine = routineAt(time);
  const paymentHour = Math.floor(time / gameHour) * gameHour;
  const payroll = useMemo(() => earningsAt(paymentHour), [paymentHour]);
  const active = save?.history.find(({ endsAt }) => endsAt > time);
  const completed = playerPayments(save, time);
  const payments = [...payroll.payments, ...completed].sort((a, b) => a.time - b.time);
  const allPayments = [...payroll.payments, ...completed];
  const income = allPayments.reduce((sum, payment) => sum + Math.max(0, payment.amount), 0);
  const spent = (save?.meals ?? 0) * legacyMealPrice
    + allPayments.reduce((sum, payment) => sum - Math.min(0, payment.amount), 0);
  const balance = income - spent;
  const houseStage = save?.houses.length ?? 0;
  const nextHousePrice = housePrices[houseStage] ?? null;

  async function updateSave(update: (current: Save, time: number) => Save | string) {
    function applyUpdate() {
      const currentTime = Date.now();
      const current = readSave(currentTime) ?? latestSave.current;
      if (!current) return "게임을 불러오는 중이에요.";
      const gameTime = gameTimeAt(elapsedAt(current, currentTime));
      const updated = update(current, gameTime);
      if (typeof updated === "string") return updated;
      writeSave(updated);
      latestSave.current = updated;
      setSave(updated);
      setNow(currentTime);
      return null;
    }

    return withSaveLock(applyUpdate);
  }

  function startActivity(id: ActivityId) {
    return updateSave((current, gameTime) => {
      if (current.history.some(({ endsAt }) => endsAt > gameTime)) return "이미 진행 중인 활동이 있어요.";
      if (routineAt(gameTime).id === "work" && activities[id].scene !== "office") {
        return "지금은 회사에 있을 시간이야. 퇴근하고 가자! 💼";
      }
      if (activityRewardIds.includes(id)) {
        const weekStart = gameWeekStart(gameTime);
        const completedThisWeek = current.history.filter((entry) => {
          if (!activityRewardIds.includes(entry.id)) return false;
          const startedAt = entry.endsAt - activities[entry.id].hours * gameHour;
          return gameWeekStart(startedAt) === weekStart;
        }).length;
        if (completedThisWeek >= activityLimitPerGameWeek) return "이번 게임 주의 추가 활동 횟수를 모두 사용했어요.";
      }
      const { amount, hours } = activities[id];
      return {
        ...current,
        history: [...current.history, { id, endsAt: gameTime + hours * gameHour, amount }],
        views: cityViews(current, { tab: "home", preview: null }),
      };
    });
  }

  function buyHouse(expectedStage: number) {
    return updateSave((current, gameTime) => {
      const price = housePrices[current.houses.length];
      if (price === undefined || current.houses.length !== expectedStage) return "주택 목표가 바뀌었어요.";
      const reserved = current.history.find(({ endsAt }) => endsAt > gameTime)?.amount ?? 0;
      if (balanceAt(current, gameTime) + Math.min(0, reserved) < price) return "사용할 수 있는 잔액이 부족해요.";
      return { ...current, houses: [...current.houses, gameTime] };
    });
  }

  function cityViews(current: Save, patch: Partial<CityView>) {
    return { ...current.views, [city]: { ...defaultView, ...current.views[city], ...patch } };
  }

  function setView(patch: Partial<CityView>) {
    return updateSave((current) => ({ ...current, views: cityViews(current, patch) }));
  }

  function setAvatar(avatar: AvatarId) {
    return updateSave((current) => ({ ...current, avatar }));
  }

  function acknowledgeStarterNotice() {
    return updateSave((current) => ({ ...current, starterNoticeSeen: true }));
  }

  function saveBirthday(birthDate: string, gender: AvatarId) {
    if (!validBirthDate(birthDate)) return Promise.resolve("생년월일을 확인해 주세요.");
    return updateSave((current) => ({ ...current, birthDate, gender, avatar: gender, birthdaySetupVersion: 1 }));
  }

  function togglePause() {
    return updateSave((current) => {
      if (current.pausedAt !== null) {
        return {
          ...current,
          pausedAt: null,
          pausedDuration: current.pausedDuration + Math.max(0, Date.now() - current.pausedAt),
        };
      }
      return { ...current, pausedAt: Date.now() };
    });
  }

  const starterGrantedAt = save?.starterGrantedAt ?? gameStart;
  const houses = save?.houses ?? [];
  const { stockValue, houseValue } = portfolioAt(time, starterGrantedAt, houses);
  const assetHistory = Array.from({ length: 14 }, (_, index) => {
    const sampleTime = Math.max(starterGrantedAt, time - (13 - index) * gameWeek);
    const cash = balance - payments.reduce((sum, payment) => sum + (payment.time > sampleTime ? payment.amount : 0), 0);
    const { stockValue, houseValue } = portfolioAt(sampleTime, starterGrantedAt, houses);
    return { stockValue, total: cash + stockValue + houseValue };
  });

  const availableBalance = balance + Math.min(0, active?.amount ?? 0);
  const activityUsesThisWeek = save ? save.history.filter((entry) => {
    if (!activityRewardIds.includes(entry.id)) return false;
    const startedAt = entry.endsAt - activities[entry.id].hours * gameHour;
    return gameWeekStart(startedAt) === gameWeekStart(time);
  }).length : 0;

  return { time, routine, active, payments, income, spent, balance, availableBalance, houseStage, nextHousePrice,
    startActivity, buyHouse, ready: save !== null, stockValue, houseValue, assetHistory,
    view: save?.views[city] ?? defaultView, avatar: save?.avatar ?? "female",
    setView, setAvatar, starterGrantedAt, houses, paused: save?.pausedAt !== null && save?.pausedAt !== undefined,
    togglePause, showStarterNotice: save !== null && !save.starterNoticeSeen,
    showBirthdaySetup: save !== null && save.starterNoticeSeen && (save.birthDate === null || save.birthdaySetupVersion !== 1),
    birthDate: save?.birthDate ?? null, gender: save?.gender ?? null, saveBirthday,
    activityUsesThisWeek, acknowledgeStarterNotice };
}
