"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { homeBreadcrumb } from "../../seo";
import styles from "./my-city.module.css";

const asset = "/my-city";
const balance = 1200;
const housePrice = 3000;
const avatars = [
  { id: "female", label: "여자", icon: "avatar-female" },
  { id: "male", label: "남자", icon: "avatar" },
] as const;
const scenes = [
  { id: "street", label: "도시 거리", location: "출근중", alt: "남산서울타워가 보이는 골목에서 출근하는" },
  { id: "office", label: "사무실", location: "회사", alt: "서울이 보이는 사무실에서 고양이 두 마리와 일하는" },
  { id: "return", label: "퇴근길", location: "퇴근중", alt: "노을이 물든 서울 골목에서 퇴근하는" },
  { id: "home", label: "집 안", location: "집", alt: "서울 풍경이 보이는 거실에서 고양이 두 마리와 쉬는" },
  { id: "park", label: "동네 공원", location: "퇴근중", alt: "꽃이 핀 서울 공원을 산책하는" },
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
  const [avatar, setAvatar] = useState<(typeof avatars)[number]>(avatars[1]);
  const [scene, setScene] = useState<(typeof scenes)[number]>(scenes[0]);
  const [tab, setTab] = useState<(typeof menu)[number]["id"]>("home");
  const [action, setAction] = useState<"earn" | "spend">("earn");
  const dialog = useRef<HTMLDialogElement>(null);
  const isOffice = scene.id === "office";
  const sceneImage = isOffice ? "office-v2" : `seoul-${scene.id}`;
  const avatarSuffix = avatar.id === "female" ? "-female" : "";

  function openAction(nextAction: typeof action) {
    setAction(nextAction);
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
          <div className={styles.level}>
            <Icon name={avatar.icon} />
            <strong>Lv. 1</strong>
          </div>
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
          <div className={styles.balance}>
            <Icon name="coin" />
            <strong aria-label={`보유 자산 ${balance.toLocaleString("ko-KR")} 코인`}>{balance.toLocaleString("ko-KR")}</strong>
          </div>
        </header>

        <div className={styles.title}>
          <h1>{title}</h1>
          {hasScenes && <p>현재 위치 <strong aria-live="polite">{scene.location}</strong></p>}
        </div>

        <div className={styles.tabContent}>
          <div className={styles.homeContent} inert={tab !== "home"}>
            <section className={styles.dashboard} aria-labelledby="house-goal">
              <Icon name="house" />
              <div>
                <h2 id="house-goal">다음 집</h2>
                <progress aria-labelledby="house-goal" value={balance} max={housePrice} />
              </div>
              <strong>{balance.toLocaleString("ko-KR")} / {housePrice.toLocaleString("ko-KR")}</strong>
            </section>

            {hasScenes ? (
              <>
                <div className={styles.scene}>
                  <Image
                    src={`${asset}/${sceneImage}${avatarSuffix}.png`}
                    alt={`${scene.alt} ${avatar.label} 캐릭터의 픽셀 아트`}
                    fill
                    sizes="(max-width: 720px) 100vw, 680px"
                    unoptimized={isOffice}
                  />
                </div>
                <div className={styles.scenePicker} role="group" aria-label="장면 선택">
                  {scenes.map((item) => (
                    <button key={item.id} type="button" aria-pressed={scene.id === item.id} onClick={() => setScene(item)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.sceneUnavailable}>이 도시의 장면은 준비 중이에요.</p>
            )}

            <div className={styles.actions}>
              <button type="button" onClick={() => openAction("earn")}>돈 벌기</button>
              <button type="button" onClick={() => openAction("spend")}>돈 쓰기</button>
            </div>
          </div>
          {tab !== "home" && (
            <section className={styles.tabPanel} aria-labelledby="tab-title">
              <h2 id="tab-title">{menu.find((item) => item.id === tab)?.label}</h2>
              {tab === "bank" && <p>보유 자산 <strong>{balance.toLocaleString("ko-KR")} 코인</strong></p>}
              {tab === "bell" && <p>새 알림이 없어요.</p>}
              {tab === "settings" && <Link href="/">도시 선택으로 돌아가기</Link>}
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
        <p>{action === "earn" ? (hasScenes ? "회사 장면에서 일하는 모습을 볼 수 있어요." : "이 도시의 회사 장면은 준비 중이에요.") : "다음 집 목표까지 1,800코인이 남았어요."}</p>
        <form method="dialog">
          {action === "earn" && hasScenes && <button onClick={() => setScene(scenes[1])}>회사로 이동</button>}
          <button>닫기</button>
        </form>
      </dialog>
    </main>
  );
}
