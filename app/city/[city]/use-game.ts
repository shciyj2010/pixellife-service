"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cities, type CityId } from "../../cities";
import { earningsAt, gameStart, gameTimeAt, legacyMealPrice, migrateElapsed, routineAt } from "./game-clock";
import { activities, activityPayments, gameHour, housePrices, type Activity, type ActivityId, type BankMode } from "./bank-activities";
import { gameWeek, portfolioAt, starterCash } from "./asset-policy";

const tabs = ["home", "bank", "bell", "settings"] as const;
export type CityTab = (typeof tabs)[number];
export type AvatarId = "female" | "male";
type CityView = { tab: CityTab; bankMode: BankMode; preview: { shift: string; scene: string } | null };

const defaultView: CityView = { tab: "home", bankMode: "earn", preview: null };
const saveKey = "pixel-city-life:game:v1";
type Save = {
  startedAt: number;
  meals: number;
  clockVersion: 2;
  history: Activity[];
  houses: number[];
  policyStartsAfter: number;
  bonusStartsAfter: number;
  starterGrantedAt: number;
  starterNoticeSeen: boolean;
  lastCity: CityId | null;
  avatar: AvatarId;
  missions: string[];
  views: Partial<Record<CityId, CityView>>;
};

const legacyActivityAmounts = { overtime: 400, cafe: 300, store: -100, storeShift: 100 };

export function readSave(now = Date.now()): Save | null {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) ?? "null");
    if (saved && Number.isFinite(saved.startedAt) && saved.startedAt > 0 &&
        Number.isSafeInteger(saved.meals) && saved.meals >= 0) {
      const startedAt = saved.clockVersion === 2
        ? saved.startedAt
        : now - migrateElapsed(now - saved.startedAt);
      const history = Array.isArray(saved.history) ? saved.history
        .filter((entry: Activity) => entry && Object.hasOwn(activities, entry.id) && Number.isSafeInteger(entry.endsAt))
        .map((entry: Activity) => ({
          ...entry,
          amount: Number.isSafeInteger(entry.amount) ? entry.amount : legacyActivityAmounts[entry.id],
        })) : [];
      const houses = Array.isArray(saved.houses)
        ? saved.houses.filter(Number.isSafeInteger).slice(0, housePrices.length) as number[]
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
        meals: saved.meals,
        clockVersion: 2,
        history,
        houses,
        policyStartsAfter: Number.isSafeInteger(saved.policyStartsAfter)
          ? saved.policyStartsAfter : gameTimeAt(now - startedAt),
        bonusStartsAfter: Number.isSafeInteger(saved.bonusStartsAfter)
          ? saved.bonusStartsAfter : gameTimeAt(now - startedAt),
        starterGrantedAt: Number.isSafeInteger(saved.starterGrantedAt)
          ? saved.starterGrantedAt : gameTimeAt(now - startedAt),
        starterNoticeSeen: saved.starterNoticeSeen === true,
        lastCity: typeof saved.lastCity === "string" && Object.hasOwn(cities, saved.lastCity) ? saved.lastCity : null,
        avatar: saved.avatar === "male" ? "male" : "female",
        missions: Array.isArray(saved.missions) ? saved.missions.filter((id: unknown) => typeof id === "string") : [],
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
  return [...grant, ...activityPayments(save?.history ?? [], time), ...purchases];
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
  return earningsAt(time, save.policyStartsAfter, save.bonusStartsAfter).total - save.meals * legacyMealPrice
    + playerPayments(save, time).reduce((sum, payment) => sum + payment.amount, 0);
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
        meals: 0,
        clockVersion: 2,
        history: [],
        houses: [],
        policyStartsAfter: gameStart,
        bonusStartsAfter: gameStart,
        starterGrantedAt: gameStart,
        starterNoticeSeen: false,
        avatar: "female",
        missions: [],
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

  const time = save ? gameTimeAt(now - save.startedAt) : gameStart;
  const routine = routineAt(time);
  const paymentHour = Math.floor(time / gameHour) * gameHour;
  const policyStartsAfter = save?.policyStartsAfter;
  const bonusStartsAfter = save?.bonusStartsAfter;
  const payroll = useMemo(() => earningsAt(paymentHour, policyStartsAfter, bonusStartsAfter), [paymentHour, policyStartsAfter, bonusStartsAfter]);
  const active = save?.history.find(({ endsAt }) => endsAt > time);
  const completed = playerPayments(save, time);
  const payments = [...payroll.payments, ...completed].sort((a, b) => a.time - b.time);
  const income = payroll.total + completed.reduce((sum, payment) => sum + Math.max(0, payment.amount), 0);
  const spent = (save?.meals ?? 0) * legacyMealPrice
    + completed.reduce((sum, payment) => sum - Math.min(0, payment.amount), 0);
  const balance = income - spent;
  const houseStage = save?.houses.length ?? 0;
  const nextHousePrice = housePrices[houseStage] ?? null;

  async function updateSave(update: (current: Save, time: number) => Save | string) {
    function applyUpdate() {
      const currentTime = Date.now();
      const current = readSave(currentTime) ?? latestSave.current;
      if (!current) return "게임을 불러오는 중이에요.";
      const gameTime = gameTimeAt(currentTime - current.startedAt);
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
      const { amount, hours } = activities[id];
      if (amount < 0 && balanceAt(current, gameTime) + amount < 0) return "잔액이 부족해요.";
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

  function completeMission(shift: string) {
    return updateSave((current) => {
      if (current.missions.includes(shift)) return current;
      return { ...current, missions: [...current.missions, shift], views: cityViews(current, { preview: null }) };
    });
  }

  function acknowledgeStarterNotice() {
    return updateSave((current) => ({ ...current, starterNoticeSeen: true }));
  }

  const starterGrantedAt = save?.starterGrantedAt ?? gameStart;
  const houses = save?.houses ?? [];
  const { stockValue, houseValue } = portfolioAt(time, starterGrantedAt, houses);
  const assetHistory = Array.from({ length: 14 }, (_, index) => {
    const sampleTime = Math.max(starterGrantedAt, time - (13 - index) * gameWeek);
    const cash = balance - payments.reduce((sum, payment) => sum + (payment.time > sampleTime ? payment.amount : 0), 0);
    const { stockValue, houseValue } = portfolioAt(sampleTime, starterGrantedAt, houses);
    return { stockValue, total: Math.max(0, cash) + stockValue + houseValue };
  });

  const availableBalance = balance + Math.min(0, active?.amount ?? 0);
  return { time, routine, active, payments, income, spent, balance, availableBalance, houseStage, nextHousePrice,
    startActivity, buyHouse, ready: save !== null, stockValue, houseValue, assetHistory,
    view: save?.views[city] ?? defaultView, avatar: save?.avatar ?? "female", missions: save?.missions ?? [],
    setView, setAvatar, completeMission, starterGrantedAt, houses, showStarterNotice: save !== null && !save.starterNoticeSeen, acknowledgeStarterNotice };
}
