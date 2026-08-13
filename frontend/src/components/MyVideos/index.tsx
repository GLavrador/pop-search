import { useMyVideosQuery } from '../../hooks/useMyVideosQuery';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

const formatDate = (value: string, locale: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
};

export const MyVideos = () => {
  const { videos, isLoading, error } = useMyVideosQuery();
  const { t, locale } = useI18n();

  if (isLoading) {
    return <p className={styles.message}>{t.myVideos.loading}</p>;
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
    return <div className={styles.message}>{t.myVideos.empty}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.title}>{t.myVideos.title}</p>
        <span className={styles.count}>{t.myVideos.count(videos.length)}</span>
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
            <span className={styles.date}>{formatDate(video.created_at, locale)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
