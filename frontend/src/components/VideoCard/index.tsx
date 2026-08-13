import type { SearchResult } from "../../types";
import { useStatus } from "../../context/StatusContext";
import { useI18n } from "../../i18n/languageContext";
import styles from "./styles.module.css";

interface VideoCardProps {
  data: SearchResult;
}

const matchOriginKey = (similarity: number, textRank: number) => {
  const byMeaning = similarity > 0;
  const byWords = textRank > 0;

  if (byMeaning && byWords) return 'both' as const;
  if (byWords) return 'words' as const;
  return 'meaning' as const;
};

export const VideoCard = ({ data }: VideoCardProps) => {
  const { setStatus } = useStatus();
  const { t } = useI18n();
  const percentage = Math.round(data.similarity * 100);
  const displayUrl = data.url_original;
  const origin = t.card[matchOriginKey(data.similarity, data.text_rank ?? 0)];

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    setStatus(t.card.copied, 2000);
  };

  return (
    <div className={styles.card}>
      <div className={styles.iconColumn}>
        🎬
      </div>

      <div className={styles.contentColumn}>
        <div className={styles.header}>
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.title}
            title={data.titulo_video}
          >
            {data.titulo_video}
          </a>

          <span className={styles.score}>
            <span className={styles.origin} title={origin.title}>
              {origin.label}
            </span>
            {t.card.match(percentage)}
          </span>
        </div>

        <p className={styles.summary}>
          {data.descricao_completa || t.card.noDescription}
        </p>

        <div className={styles.urlRow}>
          <input
            type="text"
            readOnly
            value={displayUrl}
            className={styles.urlInput}
          />
          <button
            type="button"
            onClick={handleCopy}
            className={styles.copyButton}
            title={t.card.copyTitle}
          >
            {t.card.copy}
          </button>
        </div>
      </div>
    </div>
  );
};
