import { activities, type ActivityId, type BankMode } from "./bank-activities";
import { bonus, bonusHour, gameHourFormat, salary } from "./game-clock";
import { formatCells } from "./asset-policy";
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
      <figcaption>{label} <strong>{formatCells(values.at(-1) ?? 0)}</strong></figcaption>
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
        <strong>{formatCells(game.houseValue)}</strong>
        <small>게임 주마다 +0.5%</small>
      </div>
      <div className={styles.assetValue}>
        <span>현금</span>
        <strong>{formatCells(game.balance)}</strong>
        <small className={styles.cashTotals}>누적 수입 {formatCells(game.income)} · 누적 지출 {formatCells(game.spent)}</small>
      </div>
      <div className={styles.bankModes} role="group" aria-label="통장 활동">
        <button type="button" aria-pressed={mode === "earn"} onClick={() => setMode("earn")}>돈 벌기</button>
        <button type="button" aria-pressed={mode === "spend"} onClick={() => setMode("spend")}>돈 쓰기</button>
      </div>
      {mode === "earn" && <p className={styles.bankTotals}>매월 말일 18:00 월급 +{formatCells(salary)} · 월·수·금 {bonusHour}:00 보너스 +{formatCells(bonus)}</p>}
      {game.active && <p role="status">{activities[game.active.id].location} · {gameHourFormat.format(game.active.endsAt)} 종료</p>}
      {game.routine.id === "work" && <p className={styles.bankTotals}>지금은 회사에 있을 시간이야. 다른 곳은 퇴근하고 가자! 💼</p>}
      <div className={styles.bankActivities}>
        {choices[mode].map((id) => {
          const { label, amount, hours, scene } = activities[id];
          const lockedAtWork = game.routine.id === "work" && scene !== "office";
          return (
            <button key={id} type="button" disabled={!game.ready || Boolean(game.active) || lockedAtWork || game.balance + amount < 0}
              onClick={() => onStart(id)}>
              <strong>{label}</strong>
              <span>게임 시간 {hours}시간 · {amount > 0 ? "+" : "−"}{formatCells(Math.abs(amount))}</span>
            </button>
          );
        })}
        {mode === "spend" && game.nextHousePrice !== null && (
          <button type="button" disabled={!game.ready || game.availableBalance < game.nextHousePrice} onClick={onBuyHouse}>
            <strong>다음 집 구매</strong>
            <span>−{formatCells(game.nextHousePrice)}</span>
          </button>
        )}
      </div>
      {mode === "spend" && game.ready && game.balance < -activities.store.amount && <p>잔액이 부족해요.</p>}
      {message && <p role="status">{message}</p>}
    </>
  );
}
