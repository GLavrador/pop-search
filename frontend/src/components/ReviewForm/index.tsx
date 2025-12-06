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
      <h2 className={styles.sectionTitle}>Review AI Data</h2>
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Suggested Title</label>
        <input 
          {...register("titulo_sugerido", { required: true })} 
          className={styles.input} 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Summary</label>
        <textarea 
          {...register("resumo", { required: true })} 
          className={styles.textarea} 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Original URL (Read-only)</label>
        <input 
          {...register("url_original")} 
          className={styles.input} 
          disabled 
          style={{ background: '#e9ecef' }}
        />
      </div>

      <h3 className={styles.sectionTitle}>Visual Details</h3>
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Context</label>
        <textarea 
          {...register("metadados_visuais.contexto")} 
          className={styles.textarea}
          placeholder="Describe the visual context..."
        />
      </div>

      <h3 className={styles.sectionTitle}>Audio Details</h3>
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Transcription / Lyrics</label>
        <textarea 
          {...register("metadados_audio.transcricao_trecho")} 
          className={styles.textarea}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Identified Music</label>
          <input 
            {...register("metadados_audio.musica_identificada")} 
            className={styles.input} 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Artist</label>
          <input 
            {...register("metadados_audio.artista")} 
            className={styles.input} 
          />
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Keywords & Entities</h3>

      <div className={styles.formGroup}>
        <label className={styles.label}>People (comma separated)</label>
        <input 
          {...register("metadados_visuais.pessoas")} 
          className={styles.input}
          placeholder="Famous person 1, Famous person 2..."
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Search Tags</label>
        <input 
          {...register("tags_busca")} 
          className={styles.input}
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton}>
          Confirm & Save
        </button>
      </div>
    </form>
  );
};