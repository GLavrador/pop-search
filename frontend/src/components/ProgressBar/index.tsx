import { useState, useEffect } from 'react';
import styles from './styles.module.css';

interface ProgressBarProps {
  loading: boolean;
}

export const ProgressBar = ({ loading }: ProgressBarProps) => {
  const [progress, setProgress] = useState({
    loading,
    width: loading ? 0 : 100,
    duration: loading ? '0s' : '0.5s',
  });

  if (progress.loading !== loading) {
    setProgress({ loading, width: loading ? 0 : 100, duration: loading ? '0s' : '0.5s' });
  }

  useEffect(() => {
    if (!loading) return;
    const timeoutId = setTimeout(() => {
      setProgress({ loading: true, width: 95, duration: '30s' });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  return (
    <div className={styles.container}>
       <div 
         className={styles.filler} 
         style={{ 
           width: `${progress.width}%`,
           transition: `width ${progress.duration} ease-out`
         }} 
       /> 
       <div className={styles.blocks} />
    </div>
  );
};
