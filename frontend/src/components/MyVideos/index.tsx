import { useMyVideosQuery } from '../../hooks/useMyVideosQuery';
import styles from './styles.module.css';

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

export const MyVideos = () => {
  const { videos, isLoading, error } = useMyVideosQuery();

  if (isLoading) {
    return <p className={styles.message}>Loading your videos...</p>;
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={styles.message}>
        You have not added any videos yet. Use <strong>Add-Video.exe</strong> to
        index your first one.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.title}>My Videos</p>
        <span className={styles.count}>{videos.length} indexed</span>
      </div>

      <div className={styles.list}>
        {videos.map((video) => (
          <div key={video.id} className={styles.row}>
            <span className={styles.icon}>🎬</span>
            <div className={styles.body}>
              <a
                href={video.url_original}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {video.titulo_video || video.url_original}
              </a>
              {video.descricao_completa && (
                <p className={styles.description}>{video.descricao_completa}</p>
              )}
            </div>
            <span className={styles.date}>{formatDate(video.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
