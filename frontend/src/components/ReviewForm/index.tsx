import { useId, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { VideoMetadata } from "../../types";
import { createVideoMetadataFormSchema, type VideoMetadataForm } from "../../schemas/videoMetadata";
import { transformFormDataToMetadata } from "../../utils/transformers";
import { useI18n } from "../../i18n/languageContext";
import { helpAt, useRobot } from "../../context/robotContext";
import { Thumbnail } from "../Post/Thumbnail";
import styles from "./styles.module.css";

interface ReviewFormProps {
  initialData: VideoMetadata;
  onSave: (data: VideoMetadata) => Promise<void>;
  onCancel: () => void;
  showScenes?: boolean;
  showAudio?: boolean;
  /** Changing a video already kept, where cancelling throws nothing away. */
  editing?: boolean;
}

const MAX_POST_TEXT = 2000;

const toFormData = (data: VideoMetadata): VideoMetadataForm => ({
  ...data,
  metadados_estruturados: {
    ...data.metadados_estruturados,
    elementos_cenario: data.metadados_estruturados.elementos_cenario.join(', '),
  },
});

export const ReviewForm = ({ initialData, onSave, onCancel, showScenes = true, showAudio = true, editing = false }: ReviewFormProps) => {
  const { t } = useI18n();
  const robot = useRobot();
  const schema = useMemo(() => createVideoMetadataFormSchema(t.validation), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<VideoMetadataForm>({
    defaultValues: toFormData(initialData),
    resolver: zodResolver(schema),
  });

  const post = initialData.post;
  const postFieldId = useId();
  // The text that came with the video, until something is typed over it.
  const [typedPost, setTypedPost] = useState<string | null>(null);
  const postText = typedPost ?? post?.texto ?? '';

  const onSubmit: SubmitHandler<VideoMetadataForm> = async (data) => {
    const processedData = transformFormDataToMetadata(data);
    // Only what was left in the field is kept. The picture goes back as it came.
    await onSave({
      ...processedData,
      post: { texto: postText.trim(), miniatura: post?.miniatura ?? null },
    });
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit(onSubmit)}>
      <fieldset className={styles.groupFrame} {...helpAt('review.general')}>
        <legend className={styles.legend}>{t.review.generalLegend}</legend>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            {t.review.titleLabel} <span className={styles.required}>*</span>
            <span className={styles.hint}>{t.review.titleHint}</span>
          </label>
          <input
            {...register("titulo_sugerido")}
            className={`win95-inset win95-input ${errors.titulo_sugerido ? styles.inputError : ''}`}
          />
          {errors.titulo_sugerido && (
            <span className={styles.errorText}>{errors.titulo_sugerido.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            {t.review.descriptionLabel} <span className={styles.required}>*</span>
            <span className={styles.hint}>{t.review.descriptionHint}</span>
          </label>
          <textarea
            {...register("descricao_completa")}
            className={`win95-inset win95-input ${styles.textarea} ${errors.descricao_completa ? styles.inputError : ''}`}
            rows={4}
          />
          {errors.descricao_completa && (
            <span className={styles.errorText}>{errors.descricao_completa.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t.review.sourceLabel}</label>
          <input
            {...register("url_original")}
            className="win95-inset win95-input"
            disabled
          />
        </div>
      </fieldset>

      <fieldset className={styles.groupFrame} {...helpAt('review.post')}>
        <legend className={styles.legend}>{t.review.postLegend}</legend>

        <div className={styles.post}>
          {post?.miniatura && <Thumbnail src={post.miniatura} />}
          <div className={`${styles.formGroup} ${styles.postField}`}>
            <label className={styles.label} htmlFor={postFieldId}>
              {t.review.postLabel}
              <span className={styles.hint}>{t.review.postHint}</span>
            </label>
            <textarea
              id={postFieldId}
              className={`win95-inset win95-input ${styles.textarea}`}
              rows={2}
              maxLength={MAX_POST_TEXT}
              value={postText}
              onChange={(event) => setTypedPost(event.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {showScenes && (
        <fieldset className={styles.groupFrame} {...helpAt('review.scenes')}>
          <legend className={styles.legend}>{t.review.scenesLegend}</legend>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t.review.scenesLabel}</label>
            <input
              {...register("metadados_estruturados.elementos_cenario")}
              className="win95-inset win95-input"
              placeholder={t.review.scenesPlaceholder}
            />
          </div>
        </fieldset>
      )}

      {showAudio && (
        <fieldset className={styles.groupFrame} {...helpAt('review.audio')}>
          <legend className={styles.legend}>{t.review.audioLegend}</legend>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t.review.transcription}</label>
          <textarea
            {...register("metadados_estruturados.audio.transcricao")}
            className={`win95-inset win95-input ${styles.textarea}`}
          />
        </div>

        <div className={styles.gridRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t.review.track}</label>
            <input
              {...register("metadados_estruturados.audio.musica")}
              className="win95-inset win95-input"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t.review.artist}</label>
            <input
              {...register("metadados_estruturados.audio.artista")}
              className="win95-inset win95-input"
            />
          </div>
        </div>
        </fieldset>
      )}

      <div className={styles.actions} {...helpAt(editing ? 'library.save' : 'review.save')}>
        <button
          type="button"
          onClick={() => {
            robot.notify({ kind: 'pressed', what: editing ? 'editCancel' : 'reviewCancel' });
            onCancel();
          }}
          className="win95-btn"
          disabled={isSubmitting}
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          className="win95-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? t.common.saving : t.common.save}
        </button>
      </div>
    </form>
  );
};
