import { gameHour, housePrices } from "./bank-activities";

export const starterCash = 500;
export const starterStock = 500;
export const starterHouse = 300;
export const stockGrowth = 0.01;
export const houseGrowth = 0.005;
export const gameWeek = 7 * 24 * gameHour;

export function formatCells(amount: number) {
  return `${amount.toLocaleString("ko-KR", { maximumFractionDigits: 2 })} 셀`;
}

function weeklyValue(base: number, rate: number, acquiredAt: number, time: number) {
  const weeks = Math.max(0, Math.floor((time - acquiredAt) / gameWeek));
  return base * (1 + rate) ** weeks;
}

export function portfolioAt(time: number, starterGrantedAt: number, houses: number[]) {
  const currentHouse = houses.findLastIndex((purchasedAt) => purchasedAt <= time);
  return {
    stockValue: weeklyValue(starterStock, stockGrowth, starterGrantedAt, time),
    houseValue: currentHouse < 0
      ? weeklyValue(starterHouse, houseGrowth, starterGrantedAt, time)
      : weeklyValue(housePrices[currentHouse], houseGrowth, houses[currentHouse], time),
  };
}

export function investmentNotices(time: number, grantedAt: number, houses: number[]) {
  if (time < grantedAt) return [];

  const notices = [{ time: grantedAt, label: "시작 주식이 생겼어! 📈", amount: starterStock }];
  if (houses[0] === undefined || houses[0] > grantedAt) {
    notices.push({ time: grantedAt, label: "내 집이 생겼어! 🏠", amount: starterHouse });
  }

  function addGrowth(label: string, base: number, rate: number, since: number, until: number) {
    const firstWeek = Math.max(1, Math.ceil((grantedAt - since) / gameWeek));
    for (let event = since + firstWeek * gameWeek; event <= until; event += gameWeek) {
      const amount = weeklyValue(base, rate, since, event) - weeklyValue(base, rate, since, event - gameWeek);
      notices.push({ time: event, label, amount });
    }
  }

  addGrowth("주식 가치가 올랐어! 📈", starterStock, stockGrowth, grantedAt, time);
  const houseStarts = [grantedAt, ...houses];
  houseStarts.forEach((since, index) => {
    const until = Math.min(time, (houseStarts[index + 1] ?? Infinity) - 1);
    const price = index === 0 ? starterHouse : housePrices[index - 1];
    addGrowth("집값이 올랐어! 🏠", price, houseGrowth, since, until);
  });
  return notices;
}
