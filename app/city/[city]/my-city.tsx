"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { homeBreadcrumb } from "../../seo";
import { bonus, gameBarDate, gameDateFormat, gameHourFormat, mealPrice, payday, routineAt, salary } from "./game-clock";
import useGame from "./use-game";
import SceneArt from "./scene-art";
import styles from "./my-city.module.css";

const asset = "/my-city";
const housePrice = 3000;
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

export default function MyCity({ name, title, hasScenes }: { name: string; title: string; hasScenes: boolean }) {
  const [avatar, setAvatar] = useState<(typeof avatars)[number]>(avatars[0]);
  const { time, balance, earnings, spent, buyMeal } = useGame();
  const routine = routineAt(time);
  const shift = `${Math.floor(time / 86_400_000)}:${routine.id}`;
  const [completedMission, setCompletedMission] = useState("");
  const [preview, setPreview] = useState<{ shift: string; scene: (typeof scenes)[number] } | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const waitingForMission = Boolean(routine.mission && completedMission !== shift);
  const routineScene = routine.scene;
  const scene = preview?.shift === shift ? preview.scene : scenes.find((item) => item.id === routineScene)!;
  const [tab, setTab] = useState<(typeof menu)[number]["id"]>("home");
  const [action, setAction] = useState<"earn" | "spend">("earn");
  const dialog = useRef<HTMLDialogElement>(null);

  function openAction(nextAction: typeof action) {
    setAction(nextAction);
    setPurchaseMessage("");
    dialog.current?.showModal();
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
            <strong aria-label={`보유 자산 ${balance.toLocaleString("ko-KR")} 원`}>{balance.toLocaleString("ko-KR")}</strong>
          </div>
        </header>

        <div className={styles.statusBar}>
          <time dateTime={new Date(time).toISOString().slice(0, 19)} title={gameDateFormat.format(time)}>
            {gameBarDate(time)} {gameHourFormat.format(time)}
          </time>
          <strong aria-live="polite">{routine.location}</strong>
        </div>

        <div className={styles.tabContent}>
          <div className={styles.homeContent} inert={tab !== "home"}>
            <div className={styles.dashboardRow}>
              <section className={styles.dashboard} aria-labelledby="house-goal">
                <h2 id="house-goal">다음 집</h2>
                <Icon name="house" />
                <progress aria-labelledby="house-goal" value={Math.min(balance, housePrice)} max={housePrice} />
                <strong>{balance.toLocaleString("ko-KR")} / {housePrice.toLocaleString("ko-KR")}</strong>
              </section>
              <div className={styles.actions}>
                <button type="button" onClick={() => openAction("earn")}>돈 벌기</button>
                <button type="button" onClick={() => openAction("spend")}>돈 쓰기</button>
              </div>
            </div>
            <div className={styles.mission}>
              {waitingForMission && (
                <button type="button" onClick={() => { setPreview(null); setCompletedMission(shift); }}>
                  {routine.mission}
                </button>
              )}
            </div>

            {hasScenes ? (
              <>
                <SceneArt
                  scene={scene}
                  hour={new Date(time).getUTCHours()}
                  avatar={avatar}
                  occupied={scene.id === routineScene}
                />
                <div className={styles.scenePicker} role="group" aria-label="장면 선택">
                  {scenes.map((item) => (
                    <button key={item.id} type="button" aria-pressed={scene.id === item.id} onClick={() => setPreview({ shift, scene: item })}>
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
                <>
                  <p>보유 자산 <strong>{balance.toLocaleString("ko-KR")}원</strong></p>
                  <p>누적 수입 {earnings.total.toLocaleString("ko-KR")}원 · 누적 지출 {spent.toLocaleString("ko-KR")}원</p>
                </>
              )}
              {tab === "bell" && (earnings.recent.length ? (
                <ul>
                  {earnings.recent.map((payment) => (
                    <li key={`${payment.time}:${payment.label}`}>
                      {gameDateFormat.format(payment.time)} · {payment.label} +{payment.amount.toLocaleString("ko-KR")}원
                    </li>
                  ))}
                </ul>
              ) : <p>새 알림이 없어요.</p>)}
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

      <dialog className={styles.dialog} ref={dialog} aria-labelledby="action-title">
        <h2 id="action-title">{action === "earn" ? "돈 벌기" : "돈 쓰기"}</h2>
        {action === "earn" ? (
          <p>평일 오전 8시에 일을 시작해 오후 6시에 마쳐요. 매월 {payday}일 월급 {salary.toLocaleString("ko-KR")}원, 매주 목요일 보너스 {bonus.toLocaleString("ko-KR")}원이 오후 6시에 들어와요.</p>
        ) : (
          <p>식사를 구매하면 자산에서 {mealPrice.toLocaleString("ko-KR")}원이 빠져요.</p>
        )}
        {purchaseMessage && <p role="status">{purchaseMessage}</p>}
        <form method="dialog">
          {action === "spend" && (
            <button type="button" disabled={balance < mealPrice} onClick={async () => {
              setPurchaseMessage(await buyMeal() ? "식사를 구매했어요." : "잔액이 부족해요.");
            }}>식사 구매</button>
          )}
          <button>닫기</button>
        </form>
      </dialog>
    </main>
  );
}
