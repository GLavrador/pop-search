import { useState, type ReactNode } from 'react';
import type { SearchResult } from '../../types';
import type { SearchMode } from '../../constants/searchModes';
import { useI18n } from '../../i18n/languageContext';
import { Dialog } from '../Dialog';
import { GroupBox } from '../Dialog/GroupBox';
import styles from './styles.module.css';

/** The search a list of results answers. */
export interface Asked {
  mode: SearchMode;
  threshold: number;
}

interface WhyProps {
  data: SearchResult;
  asked: Asked;
  /** Where the result stands in the list on screen, 1 on top. */
  place: number;
  onClose: () => void;
}

const MARKED = /<<(.+?)>>/;

/** The excerpt as the database marked it: every other piece is a word that matched. */
const highlighted = (excerpt: string): ReactNode[] =>
  excerpt
    .split(MARKED)
    .map((piece, index) => (index % 2 === 1 ? <mark key={index}>{piece}</mark> : piece));

/** Why a result is on the list: in plain words first, and the sum behind them for whoever asks. */
export const Why = ({ data, asked, place, onClose }: WhyProps) => {
  const { t, locale } = useI18n();
  const [summing, setSumming] = useState(false);
  const copy = t.why;

  // A mode drops the list it does not use, and with it the place held there.
  const meaningOff = asked.mode === 'text';
  const wordsOff = asked.mode === 'semantic';
  const meaningPlace = meaningOff ? null : (data.vector_position ?? null);
  const wordsPlace = wordsOff ? null : (data.text_position ?? null);

  const percent = Math.round(data.similarity * 100);
  const belowCut = meaningPlace !== null && data.similarity < asked.threshold;
  const byMeaning = meaningPlace !== null && !belowCut;
  const byWords = wordsPlace !== null;
  const lead = byMeaning && byWords ? copy.lead.both : byWords ? copy.lead.words : copy.lead.meaning;

  const k = data.fusion_k ?? null;
  const pointsFor = (held: number | null) => (k === null || held === null ? 0 : 1 / (k + held));
  const shown = (points: number) =>
    points.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const sumRow = (name: string, held: number | null) => (
    <tr>
      <th scope="row">{name}</th>
      <td>{held === null ? copy.sum.out : copy.sum.nth(held)}</td>
      <td className={styles.points}>
        {k !== null && held !== null ? copy.sum.formula(k, held, shown(pointsFor(held))) : shown(0)}
      </td>
    </tr>
  );

  return (
    <Dialog
      title={copy.heading}
      onClose={onClose}
      footer={
        k !== null && (
          <button
            type="button"
            className="win95-btn"
            aria-expanded={summing}
            onClick={() => setSumming(!summing)}
          >
            {summing ? copy.hideSum : copy.showSum}
          </button>
        )
      }
    >
      <div className={styles.why}>
        <p className={styles.video}>{data.titulo_video}</p>
        <p>
          <strong>{copy.final(place)}</strong> {lead}
        </p>

        <GroupBox legend={copy.meaning}>
          {meaningOff ? (
            <p className={styles.absent}>{copy.meaningOff}</p>
          ) : meaningPlace === null ? (
            <p className={styles.absent}>{copy.meaningUnlisted}</p>
          ) : (
            <>
              <p>{copy.meaningPlace(meaningPlace, percent)}</p>
              <span className={styles.meter} aria-hidden="true">
                <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
              </span>
              {belowCut && <p>{copy.belowCut(Math.round(asked.threshold * 100))}</p>}
            </>
          )}
        </GroupBox>

        <GroupBox legend={copy.words}>
          {wordsOff ? (
            <p className={styles.absent}>{copy.wordsOff}</p>
          ) : wordsPlace === null ? (
            <p className={styles.absent}>{copy.wordsUnlisted}</p>
          ) : (
            <>
              <p>{copy.wordsPlace(wordsPlace)}</p>
              {data.matched && <q className={styles.excerpt}>...{highlighted(data.matched)}...</q>}
            </>
          )}
        </GroupBox>

        {summing && k !== null && (
          <div className={styles.sum}>
            <table>
              <caption>{copy.sum.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{copy.sum.list}</th>
                  <th scope="col">{copy.sum.place}</th>
                  <th scope="col" className={styles.points}>
                    {copy.sum.points}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sumRow(copy.meaning, meaningPlace)}
                {sumRow(copy.words, wordsPlace)}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{copy.sum.total}</th>
                  <td>{copy.sum.nth(place)}</td>
                  <td className={styles.points}>
                    {shown(pointsFor(meaningPlace) + pointsFor(wordsPlace))}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className={styles.how}>{asked.mode === 'hybrid' ? copy.how : copy.howSingle}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
