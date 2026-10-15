import { useEffect, useRef, useState } from 'react';
import type { HelpKey } from '../../context/robotContext';
import styles from './styles.module.css';

interface TabStripProps<Id extends string> {
  /** Each with the small icon drawn before its name, when it has one. */
  tabs: readonly { id: Id; label: string; icon?: string; help?: HelpKey }[];
  activeId: Id;
  onSelect: (id: Id) => void;
  /** Lets the other tabs recede while something else is asking for attention. */
  quiet?: boolean;
}

export const TabStrip = <Id extends string>({
  tabs,
  activeId,
  onSelect,
  quiet = false,
}: TabStripProps<Id>) => {
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = strip.current;
    if (!el) return;

    const update = () =>
      setEdges({
        start: el.scrollLeft > 1,
        end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });

    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const tab of el.children) observer.observe(tab);

    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [tabs.length]);

  const nudge = (direction: -1 | 1) => {
    strip.current?.scrollBy({ left: direction * 120, behavior: 'smooth' });
  };

  return (
    <div className={`${styles.bar} ${quiet ? styles.quiet : ''}`}>
      <div ref={strip} className={styles.strip} role="tablist">
        {tabs.map(({ id, label, icon, help }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeId === id}
            data-help={help}
            onClick={() => onSelect(id)}
            className={`${styles.tab} ${activeId === id ? styles.tabActive : ''}`}
          >
            {icon && <img src={icon} alt="" className={styles.icon} draggable={false} />}
            {label}
          </button>
        ))}
      </div>

      {edges.start && (
        <button type="button" tabIndex={-1} className={`${styles.nudge} ${styles.nudgeStart}`} onClick={() => nudge(-1)}>
          ◄
        </button>
      )}
      {edges.end && (
        <button type="button" tabIndex={-1} className={`${styles.nudge} ${styles.nudgeEnd}`} onClick={() => nudge(1)}>
          ►
        </button>
      )}
    </div>
  );
};
