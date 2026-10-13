import type { ReactNode } from 'react';
import styles from './styles.module.css';

interface GroupBoxProps {
  legend: string;
  children: ReactNode;
  className?: string;
}

/** A framed group with its name set into the top of the frame. */
export const GroupBox = ({ legend, children, className = '' }: GroupBoxProps) => (
  <fieldset className={`${styles.group} ${className}`}>
    <legend className={styles.legend}>{legend}</legend>
    {children}
  </fieldset>
);
