import { activities, activityLimitPerGameWeek, activityRewardIds, type ActivityId, type BankMode } from "./bank-activities";
import { birthdayBonus, bonus, bonusHour, gameHourFormat, paydayShopping, salaryAt, salaryHour, vacationExpense, weeklyShopping } from "./game-clock";
import { formatMoney } from "./asset-policy";
import type useGame from "./use-game";
import styles from "./my-city.module.css";

const choices = {
  earn: ["overtime", "cafe", "storeShift"],
  spend: ["store"],
} as const;

function Chart({ label, values, note }: { label: string; values: number[]; note: string }) {
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values.map((value, index) => {
    const x = 4 + 192 * index / (values.length - 1);
    return `${x},${48 - (value - min) / range * 40}`;
  }).join(" ");

  return (
    <figure className={styles.bankChart}>
      <figcaption>{label} <strong>{formatMoney(values.at(-1) ?? 0)}</strong></figcaption>
      <svg viewBox="0 0 200 56" preserveAspectRatio="none" aria-hidden="true">
        <path d="M4 8H196 M4 28H196 M4 48H196" stroke="#cbd2c9" />
        <polyline points={points} fill="none" stroke="#105a55" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <small>{note}</small>
    </figure>
  );
}

export default function BankPanel({ game, mode, setMode, onStart, onBuyHouse, message }: {
  game: ReturnType<typeof useGame>;
  mode: BankMode;
  setMode: (mode: BankMode) => void;
  onStart: (id: ActivityId) => void;
  onBuyHouse: () => void;
  message: string;
}) {

  return (
    <>
      <div className={styles.bankCharts}>
        <Chart label="자산 그래프" values={game.assetHistory.map(({ total }) => total)} note="현금 · 주식 · 집값 합계" />
        <Chart label="주식 그래프" values={game.assetHistory.map(({ stockValue }) => stockValue)} note="보유 주식 · 게임 주마다 +1%" />
      </div>
      <div className={styles.assetValue}>
        <span>현재 보유 집의 가격</span>
        <strong>{formatMoney(game.houseValue)}</strong>
        <small>게임 주마다 +0.5%</small>
      </div>
      <div className={styles.assetValue}>
        <span>현금</span>
        <strong>{formatMoney(game.balance)}</strong>
        <small className={styles.cashTotals}>누적 수입 {formatMoney(game.income)} · 누적 지출 {formatMoney(game.spent)}</small>
      </div>
      <div className={styles.bankModes} role="group" aria-label="통장 활동">
        <button type="button" aria-pressed={mode === "earn"} onClick={() => setMode("earn")}>돈 벌기</button>
        <button type="button" aria-pressed={mode === "spend"} onClick={() => setMode("spend")}>돈 쓰기</button>
      </div>
      {mode === "earn" && <>
        <p className={styles.bankTotals}>매월 말일 {String(salaryHour).padStart(2, "0")}:00 월급 +{formatMoney(salaryAt(game.time))} · 매주 수요일 {bonusHour}:00 보너스 +{formatMoney(bonus)}</p>
        <p className={styles.bankTotals}>생일 {bonusHour}:00 보너스 +{formatMoney(birthdayBonus)} · 추가 활동은 게임 주 2회까지 직접 선택</p>
        <p className={styles.bankTotals}>추가 활동 {game.activityUsesThisWeek}/{activityLimitPerGameWeek}회 · 게임 주 기준</p>
      </>}
      {mode === "spend" && <p className={styles.bankTotals}>자동 지출: 월·수 18:00 각 −{formatMoney(weeklyShopping)} · 월급날 18:00 −{formatMoney(paydayShopping)} · 8월 1일 18:00 −{formatMoney(vacationExpense)}</p>}
      {game.active && <p role="status">{activities[game.active.id].location} · {gameHourFormat.format(game.active.endsAt)} 종료</p>}
      {game.routine.id === "work" && <p className={styles.bankTotals}>지금은 회사에 있을 시간이야. 다른 곳은 퇴근하고 가자! 💼</p>}
      <div className={styles.bankActivities}>
        {choices[mode].map((id) => {
          const { label, amount, hours, scene } = activities[id];
          const lockedAtWork = game.routine.id === "work" && scene !== "office";
          const limitReached = activityRewardIds.includes(id) && game.activityUsesThisWeek >= activityLimitPerGameWeek;
          return (
            <button key={id} type="button" disabled={!game.ready || Boolean(game.active) || lockedAtWork || limitReached}
              onClick={() => onStart(id)}>
              <strong>{label}</strong>
              <span>게임 시간 {hours}시간 · {amount > 0 ? "+" : "−"}{formatMoney(Math.abs(amount))}</span>
            </button>
          );
        })}
        {mode === "spend" && game.nextHousePrice !== null && (
          <button type="button" disabled={!game.ready || game.availableBalance < game.nextHousePrice} onClick={onBuyHouse}>
            <strong>다음 집 구매</strong>
            <span>−{formatMoney(game.nextHousePrice)}</span>
          </button>
        )}
      </div>
      {game.balance < 0 && <p>현재 잔액이 마이너스예요. 빚으로 기록되고 이후 수입에서 상환돼요.</p>}
      {message && <p role="status">{message}</p>}
    </>
  );
}
