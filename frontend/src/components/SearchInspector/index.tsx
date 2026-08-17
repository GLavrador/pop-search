import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/languageContext';
import type { FusionRow, SearchExplain } from '../../types';
import styles from './styles.module.css';

const ROW_HEIGHT = 30;
const ROW_GAP = 4;
const HEADER_HEIGHT = 24;
const COLUMN_GAP = 56;

const rowCenter = (index: number) =>
  HEADER_HEIGHT + index * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;

type Branch = 'semantic' | 'text';

interface Connector {
  id: string;
  branch: Branch;
  from: { x: number; y: number };
  to: { x: number; y: number };
  weight: number;
}

const useMeasuredWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    setWidth(node.clientWidth);

    const observer = new ResizeObserver(() => setWidth(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
};

const curve = (from: { x: number; y: number }, to: { x: number; y: number }) => {
  const bend = Math.abs(to.x - from.x) * 0.45;
  const direction = to.x > from.x ? 1 : -1;
  return `M ${from.x} ${from.y} C ${from.x + bend * direction} ${from.y}, ${to.x - bend * direction} ${to.y}, ${to.x} ${to.y}`;
};

const originOf = (row: FusionRow): 'both' | Branch => {
  if (row.semantic_position && row.text_position) return 'both';
  return row.semantic_position ? 'semantic' : 'text';
};

interface SearchInspectorProps {
  explain: SearchExplain;
}

export const SearchInspector = ({ explain }: SearchInspectorProps) => {
  const { t, locale } = useI18n();
  const { ref, width } = useMeasuredWidth();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const decimal = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 6, maximumFractionDigits: 6 }),
    [locale]
  );

  const rows = Math.max(explain.semantic.length, explain.text.length, explain.fused.length);
  const height = HEADER_HEIGHT + rows * (ROW_HEIGHT + ROW_GAP);
  const columnWidth = width > 0 ? (width - COLUMN_GAP * 2) / 3 : 0;

  const connectors = useMemo<Connector[]>(() => {
    if (columnWidth <= 0) return [];

    const leftEdge = columnWidth;
    const centerLeft = columnWidth + COLUMN_GAP;
    const centerRight = columnWidth * 2 + COLUMN_GAP;
    const rightEdge = columnWidth * 2 + COLUMN_GAP * 2;

    return explain.fused.flatMap((row, fusedIndex) => {
      const target = rowCenter(fusedIndex);
      const drawn: Connector[] = [];

      if (row.semantic_position) {
        drawn.push({
          id: row.id,
          branch: 'semantic',
          from: { x: leftEdge, y: rowCenter(row.semantic_position - 1) },
          to: { x: centerLeft, y: target },
          weight: row.semantic_position,
        });
      }

      if (row.text_position) {
        drawn.push({
          id: row.id,
          branch: 'text',
          from: { x: rightEdge, y: rowCenter(row.text_position - 1) },
          to: { x: centerRight, y: target },
          weight: row.text_position,
        });
      }

      return drawn;
    });
  }, [explain.fused, columnWidth]);

  const focused = explain.fused.find((row) => row.id === focusedId) ?? explain.fused[0] ?? null;

  const strokeWidth = (position: number) => Math.max(1, 3.5 - (position - 1) * 0.5);

  return (
    <div className={`win95-border ${styles.panel}`}>
      <p className={styles.title}>{t.inspector.title}</p>
      <p className={styles.subtitle}>{t.inspector.subtitle}</p>

      <div className={styles.legend}>
        <span className={`${styles.chip} ${styles.chipBoth}`}>{t.inspector.legendBoth}</span>
        <span className={`${styles.chip} ${styles.chipSemantic}`}>{t.inspector.legendSemantic}</span>
        <span className={`${styles.chip} ${styles.chipText}`}>{t.inspector.legendText}</span>
      </div>

      <div className={styles.diagram} ref={ref} style={{ height }}>
        <svg className={styles.wires} width={width} height={height} aria-hidden="true">
          {connectors.map((connector) => (
            <path
              key={`${connector.id}-${connector.branch}`}
              d={curve(connector.from, connector.to)}
              className={`${styles.wire} ${styles[connector.branch]} ${
                focused && focused.id === connector.id ? styles.wireActive : ''
              }`}
              strokeWidth={strokeWidth(connector.weight)}
              fill="none"
            />
          ))}
        </svg>

        <div className={styles.columns} style={{ gap: COLUMN_GAP }}>
          <div className={styles.column}>
            <div className={styles.columnHead} style={{ height: HEADER_HEIGHT }}>
              {t.inspector.semantic}
            </div>
            {explain.semantic.map((entry, index) => (
              <div
                key={entry.id}
                className={`${styles.row} ${styles.rowSemantic} ${
                  focused && focused.semantic_position === index + 1 ? styles.rowActive : ''
                }`}
                style={{ height: ROW_HEIGHT, marginBottom: ROW_GAP }}
              >
                <span className={styles.position}>{entry.position}</span>
                <span className={styles.label}>{entry.titulo_video}</span>
                <span className={styles.value}>{entry.value.toFixed(3)}</span>
              </div>
            ))}
          </div>

          <div className={styles.column}>
            <div className={styles.columnHead} style={{ height: HEADER_HEIGHT }}>
              {t.inspector.fused}
            </div>
            {explain.fused.map((row) => (
              <div
                key={row.id}
                className={`${styles.row} ${styles.rowFused} ${
                  focused && focused.id === row.id ? styles.rowActive : ''
                }`}
                style={{ height: ROW_HEIGHT, marginBottom: ROW_GAP }}
                onMouseEnter={() => setFocusedId(row.id)}
                onFocus={() => setFocusedId(row.id)}
                tabIndex={0}
                role="button"
              >
                <span className={`${styles.position} ${styles[originOf(row)]}`}>{row.position}</span>
                <span className={styles.label}>{row.titulo_video}</span>
                <span className={styles.value}>{row.score.toFixed(4)}</span>
              </div>
            ))}
          </div>

          <div className={styles.column}>
            <div className={styles.columnHead} style={{ height: HEADER_HEIGHT }}>
              {t.inspector.text}
            </div>
            {explain.text.map((entry, index) => (
              <div
                key={entry.id}
                className={`${styles.row} ${styles.rowText} ${
                  focused && focused.text_position === index + 1 ? styles.rowActive : ''
                }`}
                style={{ height: ROW_HEIGHT, marginBottom: ROW_GAP }}
              >
                <span className={styles.position}>{entry.position}</span>
                <span className={styles.label}>{entry.titulo_video}</span>
                <span className={styles.value}>{entry.value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {focused && (
        <div className={`win95-inset ${styles.math}`}>
          <p className={styles.mathTitle}>{t.inspector.formulaTitle}</p>
          <p className={styles.mathVideo}>{focused.titulo_video}</p>

          <div className={styles.mathLine}>
            <span>{t.inspector.semantic}</span>
            <span>
              {focused.semantic_position
                ? `1 / (${explain.rrf_k} + ${focused.semantic_position}) = ${decimal.format(focused.semantic_contribution)}`
                : t.inspector.noSemantic}
            </span>
          </div>

          <div className={styles.mathLine}>
            <span>{t.inspector.text}</span>
            <span>
              {focused.text_position
                ? `1 / (${explain.rrf_k} + ${focused.text_position}) = ${decimal.format(focused.text_contribution)}`
                : t.inspector.noText}
            </span>
          </div>

          <div className={`${styles.mathLine} ${styles.mathTotal}`}>
            <span>{t.inspector.total}</span>
            <span>{decimal.format(focused.score)}</span>
          </div>

          <p className={styles.hint}>{t.inspector.hint}</p>
        </div>
      )}
    </div>
  );
};
