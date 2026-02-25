import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { VideoMetadata } from "../../types";
import { videoMetadataFormSchema, type VideoMetadataForm } from "../../schemas/videoMetadata";
import { transformFormDataToMetadata } from "../../utils/transformers";
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
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<VideoMetadataForm>({
    defaultValues: toFormData(initialData),
    resolver: zodResolver(videoMetadataFormSchema),
  });

  const onSubmit: SubmitHandler<VideoMetadataForm> = async (data) => {
    const processedData = transformFormDataToMetadata(data);
    await onSave(processedData);
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit(onSubmit)}>
      <fieldset className={styles.groupFrame}>
        <legend className={styles.legend}>General Information</legend>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Suggested Title <span className={styles.required}>*</span>
            <span className={styles.hint}>(min. 5 words)</span>
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
            Full Description <span className={styles.required}>*</span>
            <span className={styles.hint}>(min. 20 words)</span>
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
          <label className={styles.label}>Source URL (Read-only)</label>
          <input 
            {...register("url_original")} 
            className="win95-inset win95-input" 
            disabled 
          />
        </div>
      </fieldset>

      {showScenes && (
        <fieldset className={styles.groupFrame}>
          <legend className={styles.legend}>Scene Elements</legend>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Scene Elements (comma separated)</label>
            <input 
              {...register("metadados_estruturados.elementos_cenario")} 
              className="win95-inset win95-input"
              placeholder="mesa de cozinha, tigela azul, janela"
            />
          </div>
        </fieldset>
      )}

      {showAudio && (
        <fieldset className={styles.groupFrame}>
          <legend className={styles.legend}>Audio Analysis</legend>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Transcription / Lyrics</label>
          <textarea 
            {...register("metadados_estruturados.audio.transcricao")} 
            className={`win95-inset win95-input ${styles.textarea}`}
          />
        </div>

        <div className={styles.gridRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Track Name</label>
            <input 
              {...register("metadados_estruturados.audio.musica")} 
              className="win95-inset win95-input" 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Artist</label>
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
          Cancel
        </button>
        <button 
          type="submit" 
          className="win95-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};