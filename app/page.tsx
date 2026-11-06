import Image from "next/image";
import StartButton from "./start-button";
import styles from "./city-select.module.css";

const asset = "/city-select";

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
        <figure className={styles.map} aria-label="도시 지도. 시작 도시 서울, 잠긴 도시 도쿄와 뉴욕.">
          <Image src={asset + "/background.svg"} alt="" width={232} height={125} className={styles.backdrop} />
          <Image src={asset + "/island.svg"} alt="" width={128} height={75} className={styles.island} />
          <Image src={asset + "/seoul.svg"} alt="" width={101} height={77} className={styles.seoul} />
          <Image src={asset + "/city-block.svg"} alt="" width={72} height={34} className={styles.tokyoBlock} />
          <Image src={asset + "/tokyo.svg"} alt="" width={25} height={47} className={styles.tokyo} />
          <Image src={asset + "/city-block.svg"} alt="" width={72} height={34} className={styles.newYorkBlock} />
          <Image src={asset + "/new-york.svg"} alt="" width={27} height={38} className={styles.newYork} />
          <span className={styles.seoulLabel}>
            <svg viewBox="0 0 12 16" aria-hidden="true">
              <path fill="currentColor" d="M4 0h4v1h2v2h2v5h-1v2h-1v2H9v1H8v2H7v1H5v-1H4v-2H3v-1H2v-2H1V8H0V3h2V1h2z"/>
              <path fill="#f5eee2" d="M4 4h4v4H4z"/>
            </svg>
            서울
          </span>
          <span className={styles.tokyoLabel}>도쿄</span>
          <span className={styles.newYorkLabel}>뉴욕</span>
        </figure>
        <StartButton />
      </section>
    </main>
  );
}
