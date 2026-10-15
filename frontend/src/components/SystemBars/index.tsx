import { useEffect, useSyncExternalStore } from 'react';
import { BARS, claims } from './bars';
import styles from './styles.module.css';

const themeColor = () => {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
  }
  return meta;
};

/**
 * What the phone colours its own bars from. Safari on the iPhone takes them from
 * whatever is fixed against the top and bottom edges of the page, and only looks
 * again when something fixed comes or goes: so on every change both strips are
 * put down anew. Other browsers read the theme colour.
 */
export const SystemBars = () => {
  const { list, turn } = useSyncExternalStore(claims.subscribe, claims.get);
  const { top, bottom } = list.at(-1)?.bars ?? BARS.desktop;

  useEffect(() => {
    themeColor().content = top;
  }, [top]);

  return (
    <>
      <i
        key={`top-${turn}`}
        className={`${styles.edge} ${styles.top}`}
        style={{ backgroundColor: top }}
        aria-hidden="true"
      />
      <i
        key={`bottom-${turn}`}
        className={`${styles.edge} ${styles.bottom}`}
        style={{ backgroundColor: bottom }}
        aria-hidden="true"
      />
    </>
  );
};
