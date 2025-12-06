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

  const onSubmit: SubmitHandler<VideoMetadata> = (data) => {
    console.log("[ReviewForm] Form submitted:", data);
    onSave(data);
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

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" onClick={onCancel} style={{ background: '#6c757d' }}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton}>
          Confirm & Save
        </button>
      </div>
    </form>
  );
};