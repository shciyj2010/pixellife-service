import CityPicker from "./city-picker";
import styles from "./city-select.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="game-title">
        <header className={styles.header}>
          <span aria-hidden="true">01</span> 도시 선택
        </header>
        <div className={styles.intro}>
          <svg className={styles.waves} viewBox="0 0 488 136" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-24 113Q 18 -80 74 67T 170 161 M-9 128Q 27 -67 88 76T 187 166 M4 141Q 39 -55 100 84T 201 172 M18 148Q 54 -36 113 92T 217 179 M391 146Q 435 59 485 117T 552 166 M407 150Q 453 47 500 108T 560 157 M426 155Q 467 38 514 102T 574 147" />
          </svg>
          <h1 id="game-title">픽셀 라이프</h1>
          <p>나만의 도시 자산 성장 라이프</p>
        </div>
        <CityPicker />
      </section>
    </main>
  );
}
