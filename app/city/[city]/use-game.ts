"use client";

import { useEffect, useMemo, useState } from "react";
import { earningsAt, gameStart, gameTimeAt, mealPrice } from "./game-clock";

const saveKey = "pixel-city-life:game:v1";
type Save = { startedAt: number; meals: number };

function readSave(): Save | null {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) ?? "null");
    if (saved && Number.isFinite(saved.startedAt) && saved.startedAt > 0 &&
        Number.isSafeInteger(saved.meals) && saved.meals >= 0) {
      return saved;
    }
  } catch {
    // The game can still run for the current visit without browser storage.
  }
  return null;
}

function writeSave(save: Save) {
  try {
    localStorage.setItem(saveKey, JSON.stringify(save));
  } catch {
    // Keep the current game playable when browser storage is unavailable.
  }
}

export default function useGame() {
  const [save, setSave] = useState<Save | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const started = window.setTimeout(() => {
      const currentTime = Date.now();
      const current = readSave() ?? { startedAt: currentTime, meals: 0 };
      writeSave(current);
      setSave(current);
      setNow(currentTime);
    }, 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    function syncSave(event: StorageEvent) {
      if (event.key === saveKey) setSave(readSave());
    }

    window.addEventListener("storage", syncSave);
    return () => {
      window.clearTimeout(started);
      window.clearInterval(timer);
      window.removeEventListener("storage", syncSave);
    };
  }, []);

  const time = save ? gameTimeAt(now - save.startedAt) : gameStart;
  const paymentHour = Math.floor(time / 3_600_000) * 3_600_000;
  const earnings = useMemo(() => earningsAt(paymentHour), [paymentHour]);
  const spent = (save?.meals ?? 0) * mealPrice;

  async function buyMeal() {
    function purchase() {
      const current = readSave() ?? save;
      if (!current) return false;
      const income = earningsAt(gameTimeAt(Date.now() - current.startedAt)).total;
      if (income - current.meals * mealPrice < mealPrice) return false;
      const updated = { ...current, meals: current.meals + 1 };
      writeSave(updated);
      setSave(updated);
      return true;
    }

    return navigator.locks ? navigator.locks.request(saveKey, purchase) : purchase();
  }

  return { time, earnings, spent, balance: earnings.total - spent, buyMeal };
}
