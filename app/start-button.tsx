"use client";

import { useRef } from "react";
import styles from "./city-select.module.css";

export default function StartButton() {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className={styles.start} onClick={() => dialog.current?.showModal()}>
        서울에서 시작 <span className={styles.arrow} aria-hidden="true" />
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="seoul-title">
        <h2 id="seoul-title">서울에 오신 걸 환영해요</h2>
        <p>픽셀 라이프의 첫 도시예요.</p>
        <form method="dialog">
          <button className={styles.back}>도시 지도로 돌아가기</button>
        </form>
      </dialog>
    </>
  );
}
