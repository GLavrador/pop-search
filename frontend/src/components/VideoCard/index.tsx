import type { SearchResult } from "../../types";
import styles from "./styles.module.css";

interface VideoCardProps {
  data: SearchResult;
}

export const VideoCard = ({ data }: VideoCardProps) => {
  const percentage = Math.round(data.similarity * 100);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{data.titulo_video}</h3>
        <span className={styles.score} title="Semantic Similarity">
          {percentage}% Match
        </span>
      </div>
      <p className={styles.summary}>{data.resumo}</p>
    </div>
  );
};