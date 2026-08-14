import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

interface TabStripProps<Id extends string> {
  tabs: readonly { id: Id; label: string }[];
  activeId: Id;
  onSelect: (id: Id) => void;
}

export const TabStrip = <Id extends string>({ tabs, activeId, onSelect }: TabStripProps<Id>) => {
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
    <div className={styles.bar}>
      <div ref={strip} className={styles.strip} role="tablist">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeId === id}
            onClick={() => onSelect(id)}
            className={`${styles.tab} ${activeId === id ? styles.tabActive : ''}`}
          >
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
