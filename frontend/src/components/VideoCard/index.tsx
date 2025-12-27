import type { SearchResult } from "../../types";
import { useStatus } from "../../context/StatusContext";
import styles from "./styles.module.css";

interface VideoCardProps {
  data: SearchResult;
}

export const VideoCard = ({ data }: VideoCardProps) => {
  const { setStatus } = useStatus();
  const percentage = Math.round(data.similarity * 100);
  const displayUrl = data.url_original;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    setStatus("URL copied to clipboard!", 2000);
  };

  return (
    <div className={styles.card}>
      <div className={styles.iconColumn}>
        🎬
      </div>
      
      <div className={styles.contentColumn}>
        <div className={styles.header}>
          <a 
            href={displayUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.title} 
            title={data.titulo_video}
          >
            {data.titulo_video}
          </a>
          
          <span className={styles.score}>
            MATCH: {percentage}%
          </span>
        </div>
        
        <p className={styles.summary}>
          {data.descricao_completa || data.resumo || 'No description available'}
        </p>

        <div className={styles.urlRow}>
          <input 
            type="text" 
            readOnly 
            value={displayUrl} 
            className={styles.urlInput} 
          />
          <button 
            type="button" 
            onClick={handleCopy} 
            className={styles.copyButton}
            title="Copy URL"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};