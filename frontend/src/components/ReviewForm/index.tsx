import { useForm, type SubmitHandler } from "react-hook-form";
import type { VideoMetadata } from "../../types";
import { transformFormDataToMetadata } from "../../utils/transformers";
import styles from "./styles.module.css";

interface ReviewFormProps {
  initialData: VideoMetadata;
  onSave: (data: VideoMetadata) => void;
  onCancel: () => void;
}

export const ReviewForm = ({ initialData, onSave, onCancel }: ReviewFormProps) => {
  const { register, handleSubmit } = useForm<VideoMetadata>({
    defaultValues: initialData,
  });

  const onSubmit: SubmitHandler<VideoMetadata> = (data) => {
    const processedData = transformFormDataToMetadata(data);
      
    console.log("[ReviewForm] Form submitted with processed data:", processedData);
    onSave(processedData);
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit(onSubmit)}>
      <fieldset className={styles.groupFrame}>
        <legend className={styles.legend}>General Information</legend>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Suggested Title</label>
          <input 
            {...register("titulo_sugerido", { required: true })} 
            className="win95-inset win95-input" 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Description</label>
          <textarea 
            {...register("descricao_completa", { required: true })} 
            className={`win95-inset win95-input ${styles.textarea}`}
            rows={4}
          />
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

      <fieldset className={styles.groupFrame}>
        <legend className={styles.legend}>Audio Analysis</legend>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Transcription / Lyrics</label>
          <textarea 
            {...register("metadados_estruturados.audio.transcricao")} 
            className={`win95-inset win95-input ${styles.textarea}`}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

      <fieldset className={styles.groupFrame}>
        <legend className={styles.legend}>Search Tags</legend>
        <div className={styles.formGroup}>
          <input 
            {...register("metadados_estruturados.tags_busca")} 
            className="win95-inset win95-input"
            placeholder="gato laranja, comendo ração, cozinha"
          />
        </div>
      </fieldset>

      <div className={styles.actions}>
        <button 
          type="button" 
          onClick={onCancel} 
          className="win95-btn"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="win95-btn"
        >
          Save
        </button>
      </div>
    </form>
  );
};