import { useRef, useState } from "react";
import type { SearchResult } from "../../types";
import { useStatus } from "../../context/status";
import { useI18n } from "../../i18n/languageContext";
import { helpAt, useRobot } from "../../context/robotContext";
import { useOverflowing } from "../../hooks/useOverflowing";
import { Thumbnail } from "../Post/Thumbnail";
import styles from "./styles.module.css";

interface VideoCardProps {
  data: SearchResult;
  /** Asks for the whole reason it came up. Without it there is no asking. */
  onWhy?: () => void;
  /** That reason is on screen right now. */
  explaining?: boolean;
}

const matchOriginKey = (similarity: number, textRank: number) => {
  const byMeaning = similarity > 0;
  const byWords = textRank > 0;

  if (byMeaning && byWords) return 'both' as const;
  if (byWords) return 'words' as const;
  return 'meaning' as const;
};

export const VideoCard = ({ data, onWhy, explaining = false }: VideoCardProps) => {
  const { setStatus } = useStatus();
  const { t } = useI18n();
  const robot = useRobot();
  const summary = useRef<HTMLParagraphElement>(null);
  const [unfolded, setUnfolded] = useState(false);
  const cutShort = useOverflowing(summary, !unfolded, data.descricao_completa);
  const percentage = Math.round(data.similarity * 100);
  const displayUrl = data.url_original;
  const origin = t.card[matchOriginKey(data.similarity, data.text_rank ?? 0)];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setStatus(t.card.copied, 2000);
      robot.notify({ kind: 'copied' });
    } catch {
      setStatus(t.card.copyFailed, 5000);
    }
  };

  return (
    <div className={styles.card} {...helpAt('card')}>
      <Thumbnail src={data.post?.miniatura} />

      <div className={styles.contentColumn}>
        <a
          href={displayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.title}
          title={data.titulo_video}
          onClick={() => robot.notify({ kind: 'pressed', what: 'openVideo' })}
        >
          {data.titulo_video}
        </a>

        <p ref={summary} className={styles.summary} data-folded={unfolded ? undefined : ''}>
          {data.descricao_completa || t.card.noDescription}
        </p>

        {(cutShort || unfolded) && (
          <button
            type="button"
            className={styles.more}
            aria-expanded={unfolded}
            onClick={() => setUnfolded(!unfolded)}
          >
            {unfolded ? t.card.less : t.card.more}
          </button>
        )}

        <div className={styles.urlRow} {...helpAt('card.copy')}>
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

      <div className={styles.side} {...helpAt('card.match')}>
        <div className={styles.how}>
          {/* A video found by its words alone has no likeness to show. */}
          {percentage > 0 && <span className={styles.match}>{t.card.match(percentage)}</span>}

          <span className={styles.origin} title={origin.title} {...helpAt('card.origin')}>
            {origin.label}
          </span>
        </div>

        {onWhy && (
          <button
            type="button"
            className={styles.whyButton}
            title={t.why.title}
            aria-haspopup="dialog"
            aria-expanded={explaining}
            onClick={onWhy}
            {...helpAt('card.why')}
          >
            {t.why.open}
          </button>
        )}
      </div>
    </div>
  );
};
