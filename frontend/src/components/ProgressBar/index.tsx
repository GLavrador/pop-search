import { useState, useEffect } from 'react';
import styles from './styles.module.css';

interface ProgressBarProps {
  loading: boolean;
}

export const ProgressBar = ({ loading }: ProgressBarProps) => {
  const [width, setWidth] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState('0s');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (loading) {
      setWidth(0);
      setTransitionDuration('0s');
      timeoutId = setTimeout(() => {
        setWidth(95);
        setTransitionDuration('30s'); 
      }, 50);

    } else {
      if (width > 0 || loading === false) { 
        setWidth(100);
        setTransitionDuration('0.5s'); 
      }
    }

    return () => clearTimeout(timeoutId);
  }, [loading]);

  return (
    <div className={styles.container}>
       <div 
         className={styles.filler} 
         style={{ 
           width: `${width}%`,
           transition: `width ${transitionDuration} ease-out`
         }} 
       /> 
       <div className={styles.blocks} />
    </div>
  );
};