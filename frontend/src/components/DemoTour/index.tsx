import { useState, type ReactNode } from 'react';
import { DemoSearch } from './DemoSearch';
import { DemoUpload } from './DemoUpload';
import styles from './styles.module.css';

interface Step {
  id: string;
  tab: string;
  title: string;
  body: ReactNode;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    tab: 'Welcome',
    title: 'What Pop Search is',
    body: (
      <>
        <p>
          An archive of Twitter and X videos that you can search by meaning, not
          just by the words someone happened to type.
        </p>
        <p>
          Each video is watched by an AI, which writes a description and lists
          the people, objects and speech it finds. That text is what the search
          runs against.
        </p>
        <p className={styles.reassure}>
          Nothing here is saved, and no AI is called. Take as long as you like.
        </p>
      </>
    ),
  },
  {
    id: 'search',
    tab: '🔍 Search.exe',
    title: 'Finding a video',
    body: (
      <>
        <p>Open to everyone, no account needed. Three modes:</p>
        <dl className={styles.definitions}>
          <div>
            <dt>Hybrid</dt>
            <dd>
              Meaning and exact words together. A search for "cat" finds a video
              described as "orange tabby", and one whose title literally says
              cat.
            </dd>
          </div>
          <div>
            <dt>Semantic</dt>
            <dd>Meaning only. Finds related videos that share no words with your search.</dd>
          </div>
          <div>
            <dt>Exact</dt>
            <dd>Literal words only. Every word you type must appear.</dd>
          </div>
        </dl>
        <p>
          Under <strong>Advanced</strong> you can also set how strict the
          matching is, how many results to return, and read the supported
          operators: <code>"exact phrase"</code>, <code>-exclude</code> and{' '}
          <code>a or b</code>.
        </p>
        <p>
          Each result carries a badge saying whether it matched by meaning, by
          words, or by both.
        </p>
        <DemoSearch />
      </>
    ),
  },
  {
    id: 'ingest',
    tab: '💿 Add-Video.exe',
    title: 'Adding a video',
    body: (
      <>
        <p>
          This is the part that needs an account, because every analysis costs AI
          time. Try the whole flow below with a real example.
        </p>
        <DemoUpload />
      </>
    ),
  },
  {
    id: 'manual',
    tab: '💿 Add-Video.exe → Manual Input',
    title: 'Adding without the AI',
    body: (
      <>
        <p>
          Tick <strong>Manual Input</strong> on the add screen and you get the
          same review form, empty, to fill in yourself. No video is downloaded
          and no AI is called.
        </p>
        <p>Two reasons to use it:</p>
        <ul className={styles.list}>
          <li>
            <strong>You ran out of analyses.</strong> Manual entries do not count
            against the monthly limit, so the archive stays open to you.
          </li>
          <li>
            <strong>You describe it better.</strong> A joke or a reference the AI
            misses is exactly what makes a video findable later.
          </li>
        </ul>
        <p className={styles.hint}>
          Manually added videos are searchable like any other: the description
          you write is what the search reads.
        </p>
      </>
    ),
  },
  {
    id: 'library',
    tab: '📁 My-Videos.exe',
    title: 'What you contributed',
    body: (
      <>
        <p>
          Everything you added, newest first, with a link back to the original
          post. Videos belong to whoever indexed them.
        </p>
        <p>
          The archive itself stays public: anyone can find your videos through
          search, with or without an account.
        </p>
      </>
    ),
  },
  {
    id: 'account',
    tab: '👤 Account',
    title: 'Your account and limits',
    body: (
      <>
        <p>
          Sign up with an e-mail and a password. Each account gets a number of
          analyses per month, shown as a bar on this tab and above the add form.
        </p>
        <p>
          The limit exists because watching a video with an AI is the expensive
          part. Two things worth knowing:
        </p>
        <ul className={styles.list}>
          <li>
            A failed analysis still counts, because the AI was already paid for
            by then.
          </li>
          <li>
            Adding a video manually, without the AI, does not count against it.
          </li>
        </ul>
        <p>The counter resets on the first day of each month.</p>
      </>
    ),
  },
];

export const DemoTour = () => {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <div className={styles.tour}>
      <div className={styles.header}>
        <span className={styles.counter}>
          Step {index + 1} of {STEPS.length}
        </span>
        <span className={styles.tabName}>{step.tab}</span>
      </div>

      <div className={styles.track} aria-hidden="true">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`${styles.pip} ${i <= index ? styles.pipDone : ''}`}
          />
        ))}
      </div>

      <div className={`win95-border ${styles.panel}`}>
        <h2 className={styles.title}>{step.title}</h2>
        <div className={styles.body}>{step.body}</div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="win95-btn"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
        >
          ◀ Back
        </button>
        <button
          type="button"
          className="win95-btn"
          onClick={() => setIndex(isLast ? 0 : index + 1)}
        >
          {isLast ? '↺ Start over' : 'Next ▶'}
        </button>
      </div>
    </div>
  );
};
