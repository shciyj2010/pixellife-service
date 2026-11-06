import Image from "next/image";
import styles from "./my-city.module.css";

const asset = "/my-city/scenes";
const sizes = "(max-width: 720px) 100vw, 680px";

export default function SceneArt({
  scene, hour, avatar, occupied, bubble,
}: {
  scene: { id: string; label: string; pose: "walking" | "sitting" | "shopping" | "reading" };
  hour: number;
  avatar: { id: string; label: string };
  occupied: boolean;
  bubble: string | null;
}) {
  const period = hour < 6 || hour >= 20 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div className={styles.sceneFrame}>
      <div className={styles.scene} data-scene={scene.id} role="img" aria-label={
        occupied ? `서울 ${scene.label}에 있는 ${avatar.label} 캐릭터` : `인물이 없는 서울 ${scene.label} 풍경`
      }>
        <Image src={`${asset}/${scene.id}-${period}.svg`} alt="" fill sizes={sizes} />
        <Image src={`${asset}/${scene.id}-foreground.webp`} alt="" fill sizes={sizes} unoptimized />
        {occupied && (
          <svg className={styles.sceneCharacter} data-scene={scene.id} viewBox="0 0 32 52" aria-hidden="true">
            <use href={`/my-city/layers/characters.svg#${avatar.id}-${scene.pose}`} />
          </svg>
        )}
      </div>
      <div className={styles.sceneSpeech} role="status">
        {bubble && <span key={bubble} className={styles.sceneBubble}>{bubble}</span>}
      </div>
    </div>
  );
}
