"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { homeBreadcrumb } from "../../seo";
import { gameBarDate, gameDateFormat, gameHourFormat, routineAt } from "./game-clock";
import { activities, type ActivityId, type BankMode } from "./bank-activities";
import { formatCells, investmentNotices, starterCash, starterHouse, starterStock } from "./asset-policy";
import BankPanel from "./bank-panel";
import useGame from "./use-game";
import SceneArt from "./scene-art";
import styles from "./my-city.module.css";

const asset = "/my-city";
const avatars = [
  { id: "female", label: "여자", icon: "avatar-female" },
  { id: "male", label: "남자", icon: "avatar" },
] as const;
const scenes = [
  { id: "street", label: "출근길", pose: "walking" },
  { id: "office", label: "회사", pose: "sitting" },
  { id: "return", label: "퇴근길", pose: "walking" },
  { id: "home", label: "집🏠", pose: "sitting" },
  { id: "park", label: "공원", pose: "walking" },
  { id: "cafe", label: "카페", pose: "reading" },
  { id: "store", label: "편의점", pose: "shopping" },
] as const;

const menu = [
  { id: "home", label: "홈" },
  { id: "bank", label: "통장" },
  { id: "bell", label: "알림" },
  { id: "settings", label: "설정" },
] as const;

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <use href={asset + "/icons.svg#" + name} />
    </svg>
  );
}

function StarterNotice({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog ref={dialog} className={styles.starterNotice} aria-labelledby="starter-title" onClose={onClose}>
      <h2 id="starter-title">픽셀 시티에 온 것을 환영해! 여기서는 뭐든 할 수 있어.</h2>
      <p>넌 이미 부자야. (이건 농담😂) 이미 자가, 현금, 주식까지 있어! 하지만 열심히 모아서 다음 집으로 점프하자! 😘</p>
      <dl>
        <div><dt>현금</dt><dd>{formatCells(starterCash)}</dd></div>
        <div><dt>주식</dt><dd>{formatCells(starterStock)}</dd></div>
        <div><dt>기본 주택</dt><dd>{formatCells(starterHouse)}</dd></div>
      </dl>
      <form method="dialog">
        <button type="submit">확인</button>
      </form>
    </dialog>
  );
}

export default function MyCity({ name, title, hasScenes }: { name: string; title: string; hasScenes: boolean }) {
  const [avatar, setAvatar] = useState<(typeof avatars)[number]>(avatars[0]);
  const game = useGame();
  const { time, balance, active, payments, nextHousePrice, availableBalance } = game;
  const activeActivity = active ? activities[active.id] : null;
  const routine = routineAt(time);
  const shift = `${Math.floor(time / 86_400_000)}:${routine.id}`;
  const [completedMission, setCompletedMission] = useState("");
  const [preview, setPreview] = useState<{ shift: string; scene: (typeof scenes)[number] } | null>(null);
  const waitingForMission = !active && Boolean(routine.mission && completedMission !== shift);
  const routineScene = activeActivity?.scene ?? routine.scene;
  const currentScene = scenes.find((item) => item.id === routineScene)!;
  const scene = activeActivity || preview?.shift !== shift ? currentScene : preview.scene;
  const [tab, setTab] = useState<(typeof menu)[number]["id"]>("home");
  const [bankMode, setBankMode] = useState<BankMode>("earn");
  const [message, setMessage] = useState("");
  const notices = tab === "bell" && game.ready
    ? [...payments, ...investmentNotices(time, game.starterGrantedAt, game.houses)].sort((a, b) => b.time - a.time)
    : [];

  function openBank(mode: BankMode) {
    setBankMode(mode);
    setMessage("");
    setTab("bank");
  }

  async function startActivity(id: ActivityId) {
    const error = await game.startActivity(id);
    setMessage(error ?? "");
    if (!error) {
      setPreview(null);
      setTab("home");
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.frame} aria-label={name + " 나의 도시"}>
        <nav className={styles.breadcrumb} aria-label="현재 페이지 경로">
          <ol>
            <li><Link href={homeBreadcrumb.path}>{homeBreadcrumb.name}</Link></li>
            <li aria-current="page"><span aria-hidden="true">›</span> {name}</li>
          </ol>
        </nav>
        <header className={styles.header}>
          <h1>{title}</h1>
          <div className={styles.level}>
            <Icon name={avatar.icon} />
            <strong>Lv. 1</strong>
          </div>
          <div className={styles.balance}>
            <Icon name="coin" />
            <strong aria-label={`보유 현금 ${formatCells(balance)}`}>{formatCells(balance)}</strong>
          </div>
        </header>

        <div className={styles.statusBar}>
          <time dateTime={new Date(time).toISOString().slice(0, 19)} title={gameDateFormat.format(time)}>
            {gameBarDate(time)}
          </time>
          <strong aria-live="polite">{activeActivity?.location ?? routine.location}</strong>
        </div>

        <div className={styles.tabContent}>
          <div className={styles.homeContent} inert={tab !== "home"}>
            <div className={styles.dashboardRow}>
              <section className={styles.dashboard} aria-labelledby="house-goal">
                <h2 id="house-goal">다음 집</h2>
                <Icon name="house" />
                {nextHousePrice === null ? (
                  <strong>최고 단계 달성</strong>
                ) : (
                  <>
                    <progress aria-labelledby="house-goal" value={Math.min(availableBalance, nextHousePrice)} max={nextHousePrice} />
                    <strong>{formatCells(Math.max(0, nextHousePrice - availableBalance))} 남음</strong>
                  </>
                )}
              </section>
              <div className={styles.actions}>
                <button type="button" onClick={() => openBank("earn")}>돈 벌기</button>
                <button type="button" onClick={() => openBank("spend")}>돈 쓰기</button>
              </div>
            </div>
            <div className={styles.mission}>
              {active && <small>{gameHourFormat.format(active.endsAt)} 종료</small>}
              {waitingForMission && (
                <button type="button" onClick={() => { setPreview(null); setCompletedMission(shift); }}>
                  {routine.mission}
                </button>
              )}
            </div>

            {hasScenes ? (
              <>
                <SceneArt
                  scene={active?.id === "cafe" ? { ...scene, pose: "sitting" } : scene}
                  hour={new Date(time).getUTCHours()}
                  avatar={avatar}
                  occupied={scene.id === routineScene}
                />
                <div className={styles.scenePicker} role="group" aria-label="장면 선택">
                  {scenes.map((item) => (
                    <button key={item.id} type="button" aria-pressed={scene.id === item.id} disabled={Boolean(active)} onClick={() => setPreview({ shift, scene: item })}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.sceneUnavailable}>이 도시의 장면은 준비 중이에요.</p>
            )}

          </div>
          {tab !== "home" && (
            <section className={styles.tabPanel} aria-labelledby="tab-title">
              <h2 id="tab-title">{menu.find((item) => item.id === tab)?.label}</h2>
              {tab === "bank" && (
                <BankPanel game={game} mode={bankMode} setMode={(mode) => { setBankMode(mode); setMessage(""); }}
                  onStart={startActivity} onBuyHouse={async () => {
                    setMessage(await game.buyHouse(game.houseStage) ?? "집을 구매했어요.");
                  }} message={message} />
              )}
              {tab === "bell" && (notices.length ? (
                <ul className={styles.noticeText}>
                  {notices.map((payment) => (
                    <li key={`${payment.time}:${payment.label}`}>
                      {gameBarDate(payment.time)} · {payment.label} {payment.amount > 0 ? "+" : ""}{formatCells(payment.amount)}
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.noticeText}>아직 소식이 없어. 새 소식이 오면 알려줄게! ✨</p>)}
              {tab === "settings" && (
                <>
                  <p>캐릭터 선택</p>
                  <div className={styles.avatarToggle} role="group" aria-label="캐릭터 선택">
                    {avatars.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={avatar.id === option.id}
                        onClick={() => setAvatar(option)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p><Link href="/">도시 선택으로 돌아가기</Link></p>
                </>
              )}
            </section>
          )}
        </div>

        <nav className={styles.nav} aria-label="하단 메뉴">
          {menu.map((item) => (
            <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>
              <Icon name={item.id} />
              {item.label}
            </button>
          ))}
        </nav>
      </section>
      {game.showStarterNotice && <StarterNotice onClose={() => { void game.acknowledgeStarterNotice(); }} />}
    </main>
  );
}
