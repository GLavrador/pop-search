import { useForm, type SubmitHandler } from "react-hook-form";
import type { VideoMetadata } from "../../types";
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

  // onSubmit with arrays may need better approach
  const onSubmit: SubmitHandler<VideoMetadata> = (data) => {

    const processedData = {
      ...data,
      metadados_visuais: {
        ...data.metadados_visuais,
        pessoas: typeof data.metadados_visuais.pessoas === 'string' 
          ? (data.metadados_visuais.pessoas as string).split(',').map((s: string) => s.trim())
          : data.metadados_visuais.pessoas, 
      },
      tags_busca: typeof data.tags_busca === 'string'
        ? (data.tags_busca as string).split(',').map((s: string) => s.trim())
        : data.tags_busca
    };

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
            className={`win95-inset ${styles.input}`} 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Summary</label>
          <textarea 
            {...register("resumo", { required: true })} 
            className={`win95-inset ${styles.textarea}`} 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Source URL (Read-only)</label>
          <input 
            {...register("url_original")} 
            className={`win95-inset ${styles.input}`} 
            disabled 
            style={{ color: '#666', background: '#ddd' }}
          />
        </div>
      </fieldset>

      <fieldset className={styles.groupFrame}>
        <legend className={styles.legend}>Visual Analysis</legend>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Context Description</label>
          <textarea 
            {...register("metadados_visuais.contexto")} 
            className={`win95-inset ${styles.textarea}`}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Detected People (comma separated)</label>
          <input 
            {...register("metadados_visuais.pessoas")} 
            className={`win95-inset ${styles.input}`}
          />
        </div>
      </fieldset>

      <fieldset className={styles.groupFrame}>
        <legend className={styles.legend}>Audio Analysis</legend>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Transcription / Lyrics</label>
          <textarea 
            {...register("metadados_audio.transcricao_trecho")} 
            className={`win95-inset ${styles.textarea}`}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Track Name</label>
            <input 
              {...register("metadados_audio.musica_identificada")} 
              className={`win95-inset ${styles.input}`} 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Artist</label>
            <input 
              {...register("metadados_audio.artista")} 
              className={`win95-inset ${styles.input}`} 
            />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.groupFrame}>
        <legend className={styles.legend}>Index Tags</legend>
        <div className={styles.formGroup}>
          <input 
            {...register("tags_busca")} 
            className={`win95-inset ${styles.input}`}
            placeholder="tag1, tag2, tag3"
          />
        </div>
      </fieldset>

      <div className={styles.actions}>
        <button 
          type="button" 
          onClick={onCancel} 
          className={`win95-border ${styles.button}`}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className={`win95-border ${styles.button}`}
          style={{ fontWeight: 'bold' }}
        >
          Save
        </button>
      </div>
    </form>
  );
};