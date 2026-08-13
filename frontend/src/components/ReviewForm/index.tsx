import { useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { VideoMetadata } from "../../types";
import { createVideoMetadataFormSchema, type VideoMetadataForm } from "../../schemas/videoMetadata";
import { transformFormDataToMetadata } from "../../utils/transformers";
import { useI18n } from "../../i18n/languageContext";
import styles from "./styles.module.css";

interface ReviewFormProps {
  initialData: VideoMetadata;
  onSave: (data: VideoMetadata) => Promise<void>;
  onCancel: () => void;
  showScenes?: boolean;
  showAudio?: boolean;
}

const toFormData = (data: VideoMetadata): VideoMetadataForm => ({
  ...data,
  metadados_estruturados: {
    ...data.metadados_estruturados,
    elementos_cenario: data.metadados_estruturados.elementos_cenario.join(', '),
  },
});

export const ReviewForm = ({ initialData, onSave, onCancel, showScenes = true, showAudio = true }: ReviewFormProps) => {
  const { t } = useI18n();
  const schema = useMemo(() => createVideoMetadataFormSchema(t.validation), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<VideoMetadataForm>({
    defaultValues: toFormData(initialData),
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<VideoMetadataForm> = async (data) => {
    const processedData = transformFormDataToMetadata(data);
    await onSave(processedData);
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit(onSubmit)}>
      <fieldset className={styles.groupFrame}>
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

      {showScenes && (
        <fieldset className={styles.groupFrame}>
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
        <fieldset className={styles.groupFrame}>
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

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
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
