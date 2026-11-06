"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import styles from "./city-select.module.css";

const asset = "/city-select";
const cities = [
  { id: "seoul", name: "서울", image: "seoul.svg", width: 101, height: 77, style: styles.seoul },
  { id: "tokyo", name: "도쿄", image: "tokyo.svg", width: 25, height: 47, style: styles.tokyo },
  { id: "new-york", name: "뉴욕", image: "new-york.svg", width: 27, height: 38, style: styles.newYork },
];
const skies = ["morning.svg", "background.svg", "night.svg"];
const slots = [styles.primary, styles.upper, styles.lower];

export default function CityPicker() {
  const cityButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const [order, setOrder] = useState([0, 1, 2]);
  const selected = cities[order[0]];

  function selectCity(index: number) {
    if (index === 0) return;

    const next = [...order.slice(index), ...order.slice(0, index)];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOrder(next);
      return;
    }

    const movingCities = order.map((cityIndex) => {
      const button = cityButtons.current[cityIndex]!;
      const before = button.getBoundingClientRect();
      button.getAnimations().forEach((animation) => animation.cancel());
      return { button, before };
    });

    flushSync(() => setOrder(next));

    // Bend each path in the same direction so all three cities travel around the map.
    const bend = index === 1 ? 0.24 : -0.24;
    for (const { button, before } of movingCities) {
      const after = button.getBoundingClientRect();
      const x = before.left + before.width / 2 - (after.left + after.width / 2);
      const y = before.top + before.height / 2 - (after.top + after.height / 2);
      const scale = before.width / after.width;
      const frames = Array.from({ length: 9 }, (_, step) => {
        const progress = step / 8;
        const remaining = 1 - progress;
        const curve = 4 * progress * remaining * bend;
        const offsetX = x * remaining - y * curve;
        const offsetY = y * remaining + x * curve;
        const size = 1 + (scale - 1) * remaining;
        return { transform: `translate(${offsetX}px, ${offsetY}px) scale(${size})` };
      });
      button.animate(frames, { duration: 520, easing: "cubic-bezier(0.35, 0, 0.25, 1)" });
    }
  }

  return (
    <main className={styles.page} data-night={order[0] === 2}>
      {skies.map((sky, index) => (
        <Image
          key={sky}
          src={asset + "/" + sky}
          alt=""
          fill
          sizes="100vw"
          className={styles.backdrop}
          data-active={index === order[0]}
        />
      ))}
      <section className={styles.panel} aria-labelledby="game-title">
        <h1 id="game-title" className={styles.title}>Pixel City Life</h1>
        <div className={styles.map} role="group" aria-label="시작 도시 선택">
          {order.map((cityIndex, index) => {
            const city = cities[cityIndex];
            const isSelected = index === 0;

            return (
              <button
                key={city.name}
                type="button"
                className={`${styles.city} ${slots[index]} ${city.style}`}
                ref={(button) => { cityButtons.current[cityIndex] = button; }}
                aria-pressed={isSelected}
                onClick={() => selectCity(index)}
              >
                <Image src={asset + "/island.svg"} alt="" width={128} height={75} className={styles.island} />
                {cityIndex !== 0 && (
                  <Image src={asset + "/city-block.svg"} alt="" width={72} height={34} className={styles.block} />
                )}
                <Image src={asset + "/" + city.image} alt="" width={city.width} height={city.height} className={styles.landmark} />
                <span className={styles.label}>
                  {isSelected && (
                    <svg viewBox="0 0 12 16" aria-hidden="true">
                      <path fill="currentColor" d="M4 0h4v1h2v2h2v5h-1v2h-1v2H9v1H8v2H7v1H5v-1H4v-2H3v-1H2v-2H1V8H0V3h2V1h2z" />
                      <path fill="#f5eee2" d="M4 4h4v4H4z" />
                    </svg>
                  )}
                  {city.name}
                </span>
              </button>
            );
          })}
        </div>
        <Link href={`/city/${selected.id}`} className={styles.start}>
          {selected.name}에서 시작 <span className={styles.arrow} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
