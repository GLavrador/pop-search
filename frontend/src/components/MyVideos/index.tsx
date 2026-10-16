import { useState } from 'react';
import { useMyVideosQuery } from '../../hooks/useMyVideosQuery';
import { useMyVideoActions } from '../../hooks/useMyVideoActions';
import { useStatus } from '../../context/status';
import { validationErrorMessage } from '../../utils/validationError';
import { useI18n } from '../../i18n/languageContext';
import { helpAt, useRobot } from '../../context/robotContext';
import type { MyVideo, VideoMetadata } from '../../types';
import { Thumbnail } from '../Post/Thumbnail';
import { ReviewForm } from '../ReviewForm';
import styles from './styles.module.css';
import warningIcon from '../../assets/win98/msg_warning-0.png';

const formatDate = (value: string, locale: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
};

// A video kept before a field existed comes without it: the form needs them all.
const toMetadata = (video: MyVideo): VideoMetadata => {
  const meta = video.metadados_estruturados;

  return {
    titulo_sugerido: video.titulo_video ?? '',
    descricao_completa: video.descricao_completa ?? '',
    url_original: video.url_original,
    metadados_estruturados: {
      pessoas: meta?.pessoas ?? [],
      elementos_cenario: meta?.elementos_cenario ?? [],
      audio: {
        transcricao: meta?.audio?.transcricao ?? '',
        musica: meta?.audio?.musica ?? null,
        artista: meta?.audio?.artista ?? null,
      },
    },
    post: video.post,
  };
};

export const MyVideos = () => {
  const { videos, isLoading, error } = useMyVideosQuery();
  const { update, remove } = useMyVideoActions();
  const { setStatus } = useStatus();
  const { t, locale } = useI18n();
  const robot = useRobot();
  const [editing, setEditing] = useState<MyVideo | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const startEditing = (video: MyVideo) => {
    setAsking(null);
    setEditing(video);
    setStatus(t.myVideos.status.editing);
    robot.notify({ kind: 'pressed', what: 'editVideo' });
  };

  const cancelEditing = () => {
    setEditing(null);
    setStatus(t.myVideos.status.editCancelled, 3000);
  };

  const saveEditing = async (data: VideoMetadata) => {
    if (!editing) return;

    try {
      setStatus(t.myVideos.status.saving);
      await update(editing.id, data);
      setStatus(t.myVideos.status.saved, 5000);
      robot.notify({ kind: 'saved' });
      setEditing(null);
    } catch (err: unknown) {
      console.error('Failed to save the changes to a video:', err);
      setStatus(validationErrorMessage(err) ?? t.myVideos.status.saveFailed, 5000);
      robot.notify({ kind: 'saveFailed' });
    }
  };

  const ask = (video: MyVideo) => {
    setAsking(video.id);
    robot.notify({ kind: 'pressed', what: 'removeAsk' });
  };

  const keep = () => {
    setAsking(null);
    robot.notify({ kind: 'pressed', what: 'removeCancel' });
  };

  const confirmRemoval = async (video: MyVideo) => {
    setRemoving(true);
    setStatus(t.myVideos.status.removing);

    try {
      await remove(video.id);
      setStatus(t.myVideos.status.removed, 5000);
      robot.notify({ kind: 'videoRemoved' });
    } catch (err: unknown) {
      console.error('Failed to delete a video:', err);
      setStatus(t.myVideos.status.removeFailed, 5000);
      robot.notify({ kind: 'videoRemoveFailed' });
    } finally {
      setRemoving(false);
      setAsking(null);
    }
  };

  if (editing) {
    return (
      <div className={styles.container} {...helpAt('library')}>
        <p className={styles.title}>{t.myVideos.editing}</p>
        <ReviewForm
          key={editing.id}
          initialData={toMetadata(editing)}
          onSave={saveEditing}
          onCancel={cancelEditing}
          editing
        />
      </div>
    );
  }

  if (isLoading) {
    return <p className={styles.message}>{t.myVideos.loading}</p>;
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        <img src={warningIcon} alt="" className="win98-warning" />
        <span>{error}</span>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={styles.message} {...helpAt('library')}>
        {t.myVideos.empty}
      </div>
    );
  }

  return (
    <div className={styles.container} {...helpAt('library')}>
      <div className={styles.header}>
        <p className={styles.title}>{t.myVideos.title}</p>
        <span className={styles.count}>{t.myVideos.count(videos.length)}</span>
      </div>

      <div className={styles.list}>
        {videos.map((video) => {
          const name = video.titulo_video || video.url_original;

          return (
            <div key={video.id} className={styles.row}>
              <div className={styles.video}>
                <Thumbnail src={video.post?.miniatura} />
                <div className={styles.body}>
                  <a
                    href={video.url_original}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                    onClick={() => robot.notify({ kind: 'pressed', what: 'openVideo' })}
                  >
                    {name}
                  </a>
                  {video.descricao_completa && (
                    <p className={styles.description}>{video.descricao_completa}</p>
                  )}
                </div>
                <div className={styles.side}>
                  <span className={styles.date}>{formatDate(video.created_at, locale)}</span>
                  {asking !== video.id && (
                    <div className={styles.actions} {...helpAt('library.actions')}>
                      <button
                        type="button"
                        className={`win95-btn ${styles.action}`}
                        aria-label={t.myVideos.editOf(name)}
                        onClick={() => startEditing(video)}
                      >
                        {t.myVideos.edit}
                      </button>
                      <button
                        type="button"
                        className={`win95-btn ${styles.action}`}
                        aria-label={t.myVideos.removeOf(name)}
                        onClick={() => ask(video)}
                      >
                        {t.myVideos.remove}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {asking === video.id && (
                <div
                  className={styles.confirm}
                  role="group"
                  aria-label={t.myVideos.removeOf(name)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && !removing) keep();
                  }}
                >
                  <span className={styles.question}>
                    <img src={warningIcon} alt="" className="win98-warning" />{' '}
                    {t.myVideos.confirm.question}
                  </span>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`win95-btn ${styles.action}`}
                      onClick={() => confirmRemoval(video)}
                      disabled={removing}
                    >
                      {removing ? t.myVideos.confirm.removing : t.myVideos.confirm.yes}
                    </button>
                    <button
                      type="button"
                      className={`win95-btn ${styles.action}`}
                      onClick={keep}
                      disabled={removing}
                      autoFocus
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
