import type { AccountVideo } from '../../types';
import { Thumbnail } from '../Post/Thumbnail';
import styles from './styles.module.css';

interface VideoSummaryProps {
  video: AccountVideo;
  /** Below the title: the date it was added, rather than what it says. */
  added?: string;
}

/** What a video shows, enough to judge it without opening the post. */
export const VideoSummary = ({ video, added }: VideoSummaryProps) => (
  <div className={styles.pendingVideo}>
    <Thumbnail src={video.post?.miniatura} />
    <div className={styles.pendingBody}>
      <a href={video.url_original} target="_blank" rel="noopener noreferrer" className={styles.pendingLink}>
        {video.titulo_video || video.url_original}
      </a>
      {added ? (
        <span className={styles.cardHint}>{added}</span>
      ) : (
        <>
          {video.descricao_completa && <p className={styles.pendingText}>{video.descricao_completa}</p>}
          {video.post?.texto && <p className={styles.pendingText}>{`"${video.post.texto}"`}</p>}
        </>
      )}
    </div>
  </div>
);
