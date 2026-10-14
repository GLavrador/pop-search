import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react';
import { useI18n } from '../../../i18n/languageContext';
import type { Dictionary } from '../../../i18n/en';
import error from '../../../assets/win98/msg_error-0.png';
import temp from '../../../assets/win98/file_question.png';
import text from '../../../assets/win98/notepad_file-0.png';
import picture from '../../../assets/win98/paint_file-3.png';
import shortcut from '../../../assets/win98/file_lines-0.png';
import setup from '../../../assets/win98/executable-0.png';
import folder from '../../../assets/win98/directory_closed-0.png';
import batch from '../../../assets/win98/ms_dos-1.png';
import disks from '../../../assets/win98/diskettes_copy-0.png';
import music from '../../../assets/win98/cd_audio_cd-0.png';
import waiting from '../../../assets/win98/application_hourglass-0.png';
import solitaire from '../../../assets/win98/game_solitaire-0.png';
import scandisk from '../../../assets/win98/scandisk-0.png';
import essay from '../../../assets/win98/document-0.png';
import { File } from './File';
import { lineUp, scatter, type Box, type Size } from './junk';
import styles from './styles.module.css';

type FileKey = keyof Dictionary['bin']['inside']['junk']['files'];

/** Where it would rather lie, from 0 to 1 across the disk and down it. */
interface Spot {
  x: number;
  y: number;
}

/** How an error box is closed: from the X of its title bar, or from its own Close button. */
type CloseWith = 'x' | 'button';

/** What the robot is doing to the close button of an error, and then to the error. */
export type Closing = Readonly<Record<number, 'pressed' | 'closed'>>;

/** One file on its way into line: where it lies, where it goes, and the push that takes it there. */
export interface Move {
  /** Both on the screen. */
  from: Box;
  to: Box;
  go: (ms: number) => void;
}

export interface ClutterHandle {
  /** The files in sight, each with the place in line it goes to, in the order they are put there. */
  order: () => Move[];
}

const PICTURES: Record<FileKey, string> = {
  temp,
  text,
  picture,
  shortcut,
  setup,
  folder,
  batch,
  disks,
  music,
  waiting,
  solitaire,
  scandisk,
  essay,
};

// The errors go down first, then the files around the edges, clear of the middle. The errors
// were left open over the years, wherever they came up: no two the same way apart, and some
// partly over others. Whatever finds no room near where it wants to be is left out.
const ERRORS: (Spot & { closeWith: CloseWith })[] = [
  { x: 0.03, y: 0.74, closeWith: 'x' },
  { x: 0.14, y: 0.88, closeWith: 'button' },
  { x: 0.88, y: 0.11, closeWith: 'x' },
  { x: 0.97, y: 0.66, closeWith: 'button' },
];

// Shortcuts keep their arrow. In this order they are lined up once the disk is in order.
const FILES: (Spot & { key: FileKey; shortcut?: boolean })[] = [
  { key: 'temp', x: 0, y: 0.32 },
  { key: 'setup', x: 1, y: 0.3 },
  { key: 'solitaire', x: 0.07, y: 0.38, shortcut: true },
  { key: 'folder', x: 0.93, y: 0.36 },
  { key: 'text', x: 0.01, y: 0.55 },
  { key: 'disks', x: 1, y: 0.56 },
  { key: 'shortcut', x: 0.08, y: 0.62, shortcut: true },
  { key: 'batch', x: 0.92, y: 0.64 },
  { key: 'scandisk', x: 0.5, y: 0, shortcut: true },
  { key: 'essay', x: 0.6, y: 0.02 },
  { key: 'picture', x: 0.4, y: 1 },
  { key: 'music', x: 0.55, y: 0.98 },
  { key: 'waiting', x: 0.03, y: 0.78 },
];

// Fewer files than this in sight, and the errors give up their room to them.
const FEWEST_FILES = 3;

// The cell each file gets once they are lined up, as even as the icons of the desktop.
const CELL = { w: 92, h: 84 };

interface ErrorBoxProps {
  title: string;
  text: string;
  /** What its one button says. */
  button: string;
  closeWith: CloseWith;
  index: number;
  state?: 'pressed' | 'closed';
}

/** A window that came up with bad news, was never answered, and is still waiting. */
const ErrorBox = ({ title, text: says, button, closeWith, index, state }: ErrorBoxProps) => (
  <div className={styles.error} data-error={index} data-close-with={closeWith} data-state={state}>
    <div className={styles.errorBar}>
      <span>{title}</span>
      <i data-close>×</i>
    </div>
    <div className={styles.errorBody}>
      <img src={error} alt="" />
      <p>{says}</p>
    </div>
    <div className={styles.errorFoot}>
      <span data-button>{button}</span>
    </div>
  </div>
);

const NOTHING_CLOSED: Closing = {};

const placeAt = (item: HTMLElement, box: Box) => {
  item.style.transform = `translate(${box.x}px, ${box.y}px)`;
};

// The files in sight, each with its place in line, or none where the line has no room for it.
const inLine = (items: HTMLElement[], area: Size, avoided: Box[]) => {
  const shown = items.filter((item) => item.dataset.junk === 'file' && !item.hasAttribute('data-out'));
  const places = lineUp(
    area,
    shown.map((item) => ({ w: item.offsetWidth, h: item.offsetHeight })),
    avoided,
    CELL,
  );
  return shown.map((item, index) => ({ item, place: places[index] }));
};

interface ClutterProps {
  /** The errors the robot is closing, by their place in the list, and how far it has got with each. */
  closing?: Closing;
  /** The disk is in order: no errors left, and the files lined up. */
  tidy?: boolean;
  /** Something is being done to it by hand: it stays exactly as it is meanwhile. */
  held?: boolean;
  /**
   * What must never be covered, where it is on the screen: the bin's window, and the robot
   * with what it says. Null while that cannot be known, and then everything stays where it is.
   */
  avoid: () => readonly DOMRect[] | null;
  /** Changes whenever what must not be covered may have moved or changed size. */
  layout: string;
  handle?: RefObject<ClutterHandle | null>;
}

/**
 * What was thrown away and never emptied, lying on the disk: old files, and
 * errors nobody closed. Each lies as near as there is room to where it was
 * dropped, and never under the bin's window or the robot, whatever the size of
 * the screen. Once the disk is in order the files stand in line, as on a
 * desktop. It is not drawn again while a game is played over it.
 */
export const Clutter = memo(function Clutter({
  closing = NOTHING_CLOSED,
  tidy = false,
  held = false,
  avoid,
  layout,
  handle,
}: ClutterProps) {
  const { t } = useI18n();
  const { errors, files, ok, close } = t.bin.inside.junk;
  const holder = useRef<HTMLDivElement>(null);
  const live = useRef({ avoid, tidy, held });

  useEffect(() => {
    live.current = { avoid, tidy, held };
  });

  // The disk, what must not be covered on it, and the files in sight with the places in line for them.
  const survey = useCallback(() => {
    const node = holder.current;
    const blocked = live.current.avoid();
    if (!node || !blocked) return null;
    const within = node.getBoundingClientRect();
    if (!within.width || !within.height) return null;
    return {
      within,
      area: { w: within.width, h: within.height },
      avoided: blocked.map((box) => ({
        x: box.left - within.left,
        y: box.top - within.top,
        w: box.width,
        h: box.height,
      })),
      items: [...node.querySelectorAll<HTMLElement>('[data-junk]')],
    };
  }, []);

  // Put down by hand, straight on the page: it only changes with the screen, and needs no render.
  const arrange = useCallback(() => {
    if (live.current.held) return;
    const seen = survey();
    if (!seen) return;
    const { area, avoided, items } = seen;

    // In order, the files in sight take their places in line. On a screen too small for all of them
    // in line, the ones left over are put away: nothing lies about out of line on a tidy disk.
    if (live.current.tidy) {
      inLine(items, area, avoided).forEach(({ item, place }) => {
        if (place) placeAt(item, place);
        else item.setAttribute('data-out', '');
      });
      return;
    }

    items.forEach((item) => item.removeAttribute('data-out'));
    const wanted = items.map((item) => ({
      w: item.offsetWidth,
      h: item.offsetHeight,
      x: Number(item.dataset.x),
      y: Number(item.dataset.y),
      loose: item.dataset.junk === 'error',
    }));
    let spots = scatter(area, wanted, avoided);
    // Where the errors leave almost no room for the files, on a small screen, the files go first.
    const filesIn = (placed: (Box | null)[]) =>
      placed.filter((spot, index) => spot && !wanted[index].loose).length;
    if (filesIn(spots) < FEWEST_FILES) {
      const order = [...wanted.keys()].sort((a, b) => Number(wanted[a].loose) - Number(wanted[b].loose));
      const again = scatter(area, order.map((index) => wanted[index]), avoided);
      const swapped = wanted.map((_, index) => again[order.indexOf(index)]);
      if (filesIn(swapped) > filesIn(spots)) spots = swapped;
    }
    items.forEach((item, index) => {
      const spot = spots[index];
      if (spot) placeAt(item, spot);
      else item.setAttribute('data-out', '');
    });
  }, [survey]);

  useImperativeHandle(
    handle,
    () => ({
      order: () => {
        const seen = survey();
        if (!seen) return [];
        const { within, area, avoided, items } = seen;
        return inLine(items, area, avoided).flatMap(({ item, place }) => {
          if (!place) return [];
          const now = item.getBoundingClientRect();
          return [
            {
              from: { x: now.left, y: now.top, w: now.width, h: now.height },
              to: { ...place, x: within.left + place.x, y: within.top + place.y },
              go: (ms: number) => {
                item.style.transition = `transform ${ms}ms ease-in-out`;
                placeAt(item, place);
              },
            },
          ];
        });
      },
    }),
    [survey],
  );

  useLayoutEffect(arrange, [arrange, layout, tidy, t]);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const watch = new ResizeObserver(arrange);
    watch.observe(node);
    return () => watch.disconnect();
  }, [arrange]);

  return (
    <div ref={holder} className={styles.junk} aria-hidden="true">
      {!tidy &&
        ERRORS.map(({ x, y, closeWith }, index) => (
          <div
            key={errors[index].title}
            className={styles.lying}
            data-junk="error"
            data-x={x}
            data-y={y}
          >
            <ErrorBox
              {...errors[index]}
              button={closeWith === 'button' ? close : ok}
              closeWith={closeWith}
              index={index}
              state={closing[index]}
            />
          </div>
        ))}
      {FILES.map(({ key, shortcut: arrowed, x, y }) => (
        <div key={key} className={styles.lying} data-junk="file" data-x={x} data-y={y}>
          <File art={<img src={PICTURES[key]} alt="" />} name={files[key]} shortcut={arrowed} />
        </div>
      ))}
    </div>
  );
});
