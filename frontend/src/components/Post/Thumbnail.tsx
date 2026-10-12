import { useState } from 'react';
import styles from './styles.module.css';

interface ThumbnailProps {
  src?: string | null;
}

/** The picture of the video. Without one, or once it stops loading, the film icon. */
export const Thumbnail = ({ src }: ThumbnailProps) => {
  const [failed, setFailed] = useState<string | null>(null);

  if (!src || failed === src) {
    return (
      <span className={`win95-inset ${styles.frame} ${styles.empty}`} aria-hidden="true">
        🎬
      </span>
    );
  }

  return (
    <img
      className={`win95-inset ${styles.frame}`}
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(src)}
    />
  );
};
