"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CityId } from "../../cities";
import { gameBarDate, gameDateFormat, gameHourFormat } from "./game-clock";
import { activities, type ActivityId, type BankMode } from "./bank-activities";
import { formatMoney, investmentNotices, starterCash, starterHouse, starterStock } from "./asset-policy";
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

const routineBubbles = {
  commute: "몸은 출근 중, 마음은 이불 속 🥱",
  work: "출근했어 😭",
  leave: "퇴근할래 😍",
  rest: "집이다! 양말부터 벗자 🧦",
  sleep: "내일의 나야, 잘 부탁해 😴",
  park: "오늘 일정은 광합성이야 🌿",
  coffee: null,
} as const;

const activityBubbles: Record<ActivityId, string> = {
  overtime: "사무실 불, 내가 끄고 간다 💡",
  cafe: "어서 오세요, 라떼는 제가 쏠 뻔했어요 ☕",
  storeShift: "삑! 오늘도 원 모으는 중 🧾",
  store: "과자 하나만… 진짜 하나만 🍪",
};

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
        <div><dt>현금</dt><dd>{formatMoney(starterCash)}</dd></div>
        <div><dt>주식</dt><dd>{formatMoney(starterStock)}</dd></div>
        <div><dt>기본 주택</dt><dd>{formatMoney(starterHouse)}</dd></div>
      </dl>
      <form method="dialog">
        <button type="submit">확인</button>
      </form>
    </dialog>
  );
}

function BirthdaySetup({
  birthDate,
  gender,
  onSave,
}: {
  birthDate: string | null;
  gender: "female" | "male" | null;
  onSave: (birthDate: string, gender: "female" | "male") => Promise<string | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const errorMessage = await onSave(String(form.get("birthDate")), form.get("gender") as "female" | "male");
    if (errorMessage) {
      setError(errorMessage);
      return;
    }
    dialog.current?.close();
  }

  return (
    <dialog ref={dialog} className={styles.starterNotice} aria-labelledby="birthday-title" onCancel={(event) => event.preventDefault()}>
      <h2 id="birthday-title">생일 보너스 챙겨줄게! 😆🥳</h2>
      <p>생일마다 보너스를 기다려봐. 얼마일지는 비밀~ (정보는 사용자의 기기에만 저장되고 우리는 알 수 없어. 돈은 ai가 자동 지급해줄거야. 😉)</p>
      <form onSubmit={submit}>
        <label className={styles.birthdayField}>
          생일이 언제야?
          <input name="birthDate" type="date" defaultValue={birthDate ?? undefined} required />
        </label>
        <fieldset className={styles.genderField}>
          <legend>성별이 뭐야?</legend>
          <label><input type="radio" name="gender" value="female" defaultChecked={gender === "female"} required /> 여자</label>
          <label><input type="radio" name="gender" value="male" defaultChecked={gender === "male"} required /> 남자</label>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <button type="submit">저장하고 시작</button>
      </form>
    </dialog>
  );
}

export default function MyCity({ city, name, title, hasScenes }: { city: CityId; name: string; title: string; hasScenes: boolean }) {
  const game = useGame(city);
  const avatar = avatars.find((item) => item.id === game.avatar)!;
  const { tab, bankMode, preview } = game.view;
  const { time, routine, balance, active, payments, nextHousePrice, availableBalance } = game;
  const activeActivity = active ? activities[active.id] : null;
  const atWork = routine.id === "work";
  const shift = `${Math.floor(time / 86_400_000)}:${routine.id}`;
  const routineScene = activeActivity?.scene ?? routine.scene;
  const currentScene = scenes.find((item) => item.id === routineScene)!;
  const previewScene = !activeActivity && !atWork && preview?.shift === shift
    ? scenes.find((item) => item.id === preview.scene)
    : null;
  const scene = previewScene ?? currentScene;
  const bubble = game.ready && scene.id === routineScene
    ? active ? activityBubbles[active.id] : routineBubbles[routine.id]
    : null;
  const [message, setMessage] = useState("");
  const [editingBirthday, setEditingBirthday] = useState(false);
  const notices = tab === "bell" && game.ready
    ? [...payments, ...investmentNotices(time, game.starterGrantedAt, game.houses)].sort((a, b) => b.time - a.time)
    : [];

  function openBank(mode: BankMode) {
    setMessage("");
    void game.setView({ tab: "bank", bankMode: mode });
  }

  async function startActivity(id: ActivityId) {
    const error = await game.startActivity(id);
    setMessage(error ?? "");
  }

  async function saveBirthday(birthDate: string, gender: "female" | "male") {
    const error = await game.saveBirthday(birthDate, gender);
    if (!error) setEditingBirthday(false);
    return error;
  }

  return (
    <main className={styles.page}>
      <section className={styles.frame} aria-label={name + " 나의 도시"}>
        <header className={styles.header}>
          <h1>{title}</h1>
          <div className={styles.level}>
            <Icon name={avatar.icon} />
            <strong>Lv. 1</strong>
          </div>
          <div className={styles.balance}>
            <Icon name="coin" />
            <strong aria-label={`보유 현금 ${formatMoney(balance)}`}>{formatMoney(balance)}</strong>
          </div>
        </header>

        <div className={`${styles.statusBar} ${tab !== "home" ? styles.statusBarHidden : ""}`} aria-hidden={tab !== "home"}>
          <time dateTime={new Date(time).toISOString().slice(0, 19)} title={gameDateFormat.format(time)}>
            {gameBarDate(time)}
          </time>
          <strong aria-live="polite">{activeActivity?.location ?? routine.location}</strong>
          {game.ready && (
            <button
              type="button"
              className={styles.pauseButton}
              aria-label={game.paused ? "게임 시간 재개" : "게임 시간 일시정지"}
              aria-pressed={game.paused}
              title={game.paused ? "시간 재개" : "시간 일시정지"}
              disabled={tab !== "home"}
              onClick={() => void game.togglePause()}
            >
              {game.paused ? "▶" : "Ⅱ"}
            </button>
          )}
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
                    <strong>{formatMoney(Math.max(0, nextHousePrice - availableBalance))} 남음</strong>
                  </>
                )}
              </section>
              <div className={styles.actions}>
                <button type="button" onClick={() => openBank("earn")}>돈 벌기</button>
                <button type="button" onClick={() => openBank("spend")}>돈 쓰기</button>
              </div>
            </div>
            <div className={styles.activityStatus}>
              {active && <small>{gameHourFormat.format(active.endsAt)} 종료</small>}
            </div>

            {hasScenes ? (
              <>
                <SceneArt
                  scene={active?.id === "cafe" ? { ...scene, pose: "sitting" } : scene}
                  hour={new Date(time).getUTCHours()}
                  avatar={avatar}
                  occupied={scene.id === routineScene}
                  bubble={bubble}
                />
                <div className={styles.scenePicker} role="group" aria-label="장면 선택">
                  {scenes.map((item) => (
                    <button key={item.id} type="button" aria-pressed={scene.id === item.id}
                      disabled={Boolean(active) || (atWork && item.id !== "office")}
                      onClick={() => { void game.setView({ preview: { shift, scene: item.id } }); }}>
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
                <BankPanel game={game} mode={bankMode} setMode={(mode) => { void game.setView({ bankMode: mode }); setMessage(""); }}
                  onStart={startActivity} onBuyHouse={async () => {
                    setMessage(await game.buyHouse(game.houseStage) ?? "집을 구매했어요.");
                  }} message={message} />
              )}
              {tab === "bell" && (notices.length ? (
                <ul className={styles.noticeText}>
                  {notices.map((payment) => (
                    <li key={`${payment.time}:${payment.label}`}>
                      {gameBarDate(payment.time)} · {payment.label} {payment.amount > 0 ? "+" : ""}{formatMoney(payment.amount)}
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.noticeText}>아직 소식이 없어. 새 소식이 오면 알려줄게! ✨</p>)}
              {tab === "settings" && (
                <>
                  <button type="button" className={styles.birthdayEdit} onClick={() => setEditingBirthday(true)}>
                    생일 정보 수정
                  </button>
                  <p>캐릭터 선택</p>
                  <div className={styles.avatarToggle} role="group" aria-label="캐릭터 선택">
                    {avatars.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={avatar.id === option.id}
                        onClick={() => { void game.setAvatar(option.id); }}
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
            <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => { void game.setView({ tab: item.id }); }}>
              <Icon name={item.id} />
              {item.label}
            </button>
          ))}
        </nav>
      </section>
      {game.showStarterNotice && <StarterNotice onClose={() => { void game.acknowledgeStarterNotice(); }} />}
      {(game.showBirthdaySetup || editingBirthday) && (
        <BirthdaySetup birthDate={game.birthDate} gender={game.gender} onSave={saveBirthday} />
      )}
    </main>
  );
}
