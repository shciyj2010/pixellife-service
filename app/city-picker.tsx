"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./city-select.module.css";

const asset = "/city-select";
const cities = [
  { name: "서울", image: "seoul.svg", width: 101, height: 77, style: styles.seoul },
  { name: "도쿄", image: "tokyo.svg", width: 25, height: 47, style: styles.tokyo },
  { name: "뉴욕", image: "new-york.svg", width: 27, height: 38, style: styles.newYork },
];
const slots = [styles.primary, styles.upper, styles.lower];

export default function CityPicker() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [order, setOrder] = useState([0, 1, 2]);
  const selected = cities[order[0]];

  function selectCity(index: number) {
    setOrder((current) => {
      const next = [...current];
      [next[0], next[index]] = [next[index], next[0]];
      return next;
    });
  }

  return (
    <>
      <div className={styles.map} role="group" aria-label="시작 도시 선택">
        <Image src={asset + "/background.svg"} alt="" width={232} height={125} className={styles.backdrop} />
        <Image src={asset + "/island.svg"} alt="" width={128} height={75} className={styles.island} />
        {order.map((cityIndex, index) => {
          const city = cities[cityIndex];
          const isSelected = index === 0;

          return (
            <button
              key={city.name}
              type="button"
              className={`${styles.city} ${slots[index]} ${city.style}`}
              aria-pressed={isSelected}
              onClick={() => selectCity(index)}
            >
              {(!isSelected || cityIndex !== 0) && (
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
      <button type="button" className={styles.start} onClick={() => dialog.current?.showModal()}>
        {selected.name}에서 시작 <span className={styles.arrow} aria-hidden="true" />
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="welcome-title">
        <h2 id="welcome-title">{selected.name}에 오신 걸 환영해요</h2>
        <p>픽셀 라이프의 첫 도시예요.</p>
        <form method="dialog">
          <button className={styles.back}>도시 지도로 돌아가기</button>
        </form>
      </dialog>
    </>
  );
}
