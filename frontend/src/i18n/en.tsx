import demo from '../components/DemoTour/styles.module.css';
import { TAB_LABELS } from '../constants/tabs';

export const en = {
  language: {
    label: 'Language:',
    pt: 'PT-BR',
    en: 'EN',
    ptTitle: 'Mudar para português do Brasil',
    enTitle: 'Switch to English',
  },

  window: {
    title: 'Pop Search System',
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close',
  },

  gate: {
    title: 'An account is required to add videos.',
    body: 'Indexing a video runs it through the AI, so it is limited to signed-in users. Searching the archive stays open to everyone.',
    signIn: 'Sign In',
    takeTour: '🎓 Take the tour instead',
  },

  footer: '© 1998 Pop Search Corp. - All rights reserved.',

  common: {
    ready: 'Ready',
    cancel: 'Cancel',
    back: 'Back',
    save: 'Save',
    saving: 'Saving...',
  },

  searchModes: {
    hybrid: {
      label: 'Hybrid',
      hint: 'Meaning and exact terms combined. A video is found either by what it shows or by the words it contains.',
      operatorScope:
        'These steer the exact-terms half of the search. The meaning half always reads your full text.',
    },
    semantic: {
      label: 'Semantic',
      hint: 'Meaning only. Finds related videos even when none of your words appear in them.',
      operatorScope:
        'Not available here. Quotes and minus signs are read as ordinary characters and change how your text is interpreted.',
    },
    text: {
      label: 'Exact',
      hint: 'Literal terms only. A video must contain every word you typed, in any order.',
      operatorScope: 'These control the entire search.',
    },
  },

  presets: {
    broad: {
      label: 'Broad',
      hint: "More results, including loose connections. Useful when you can't recall the exact wording.",
    },
    balanced: {
      label: 'Balanced',
      hint: 'Balances coverage and relevance. Recommended for most searches.',
    },
    precise: {
      label: 'Precise',
      hint: 'Strong matches only. Fewer results, all closely related to the query.',
    },
    caption: 'Precision:',
    groupLabel: 'Search precision',
    custom: (percent: number) => `Custom (${percent}%)`,
  },

  search: {
    placeholder: 'Type to search...',
    submit: 'Find Now',
    loading: 'Querying database...',
    emptyTitle: '0 found.',
    emptyWithThreshold: (percent: number) => (
      <>
        No semantic match above <strong>{percent}%</strong> and no exact term found. Try the{' '}
        <strong>Broad</strong> precision or different keywords.
      </>
    ),
    emptyLiteral: (
      <>
        No video contains every word you typed. Try fewer words, or switch to{' '}
        <strong>Hybrid</strong> mode to match by meaning too.
      </>
    ),
    status: {
      failed: (error: string) => `Search failed: ${error}`,
      running: (query: string) => `Searching database for: "${query}"...`,
      none: 'Search finished. No objects found.',
      found: (count: number) => `Search finished. Found ${count} object(s).`,
      cancelled: 'Search cancelled.',
    },
    errors: {
      rateLimited: 'Too many searches! Please wait a minute and try again.',
      timeout: 'Search timed out.',
      detail: (detail: string) => `Error: ${detail}`,
      generic: 'Error accessing database index.',
    },
  },

  advanced: {
    queryLabel: 'Search Query:',
    hide: '▲ Hide Advanced',
    show: '▼ Advanced',
    modeLegend: 'Search Mode',
    modeGroupLabel: 'Search mode',
    modeHelp:
      'Chooses how a video qualifies as a match: by meaning, by the literal words you typed, or both.',
    thresholdLegend: 'Match Threshold',
    thresholdLabel: 'Match threshold',
    thresholdHelp:
      'Controls how strict the semantic (meaning-based) matching is. Higher values return fewer but more precise results.',
    custom: ' (Custom)',
    scaleLow: 'More results',
    scaleHigh: 'Fewer, stricter',
    thresholdDisabled: (mode: string) => (
      <>
        Not used in <strong>{mode}</strong> mode: matching is literal, so nothing is scored by
        similarity.
      </>
    ),
    syntaxLegend: 'Search Syntax',
    syntax: [
      { example: 'baleia bebê', meaning: 'Both words required. Every extra word narrows the search.' },
      { example: '"baleia assassina"', meaning: 'That exact phrase, in that order.' },
      { example: 'baleia -orca', meaning: 'Contains the first, excludes the second.' },
      { example: 'baleia or golfinho', meaning: 'Either word is enough.' },
    ],
    resultsLegend: 'Results',
    maxResults: 'Max results per search',
  },

  card: {
    both: { label: 'meaning + words', title: 'Matched both semantically and by the exact terms you typed.' },
    words: { label: 'words', title: 'Matched because the video contains the terms you typed.' },
    meaning: { label: 'meaning', title: 'Matched by meaning. Your exact words may not appear in this video.' },
    match: (percent: number) => `MATCH: ${percent}%`,
    noDescription: 'No description available',
    copy: 'Copy',
    copyTitle: 'Copy URL',
    copied: 'URL copied to clipboard!',
  },

  quota: {
    loading: 'Loading usage...',
    label: 'Analyses this month',
    barLabel: 'Analyses used this month',
    tokens: (amount: string) => `${amount} AI tokens used`,
    exhausted: (date: string) =>
      `Limit reached. Renews on ${date}. You can still add videos manually.`,
    remaining: (left: number, date: string) => `${left} left, renews on ${date}`,
  },

  myVideos: {
    loading: 'Loading your videos...',
    empty: (
      <>
        You have not added any videos yet. Use <strong>Add-Video.exe</strong> to index your first
        one.
      </>
    ),
    title: 'My Videos',
    count: (n: number) => `${n} indexed`,
    errors: {
      expired: 'Your session expired. Sign in again.',
      rateLimited: 'Too many requests. Wait a minute and try again.',
      generic: 'Could not load your videos.',
    },
  },

  ingest: {
    urlLabel: 'Insert URL:',
    urlPlaceholder: 'https://...',
    next: 'Next',
    openForm: 'Open Form',
    manualInput: 'Manual Input',
    optionsTitle: 'Analysis Options',
    optionsDescription:
      'By default, the AI returns a suggested title and a description for the video. Select additional fields below if needed.',
    scenes: 'Scenes elements',
    audio: 'Audio transcription',
    runAnalysis: 'Run Analysis',
    status: {
      analysed: 'Analysis finished successfully. Please review data below.',
      failed: 'Analysis failed. Check the error box for details.',
      invalid: (reason: string) => `Error: ${reason}`,
      analysing: 'Analyzing video... Please wait.',
      manual: 'Manual mode: Fill in the video details below.',
      saving: 'Saving data to database...',
      saved: 'Video saved successfully! Ready for next.',
      saveFailed: 'Error: Failed to save video. Please try again.',
      cancelled: 'Analysis cancelled by user.',
      reset: 'Ready for next video.',
    },
    errors: {
      timeout: 'Server Timeout (504). Video might be too long.',
      rateLimited: 'Too many requests. Please wait a moment.',
      unauthorized: 'Sign in to analyze videos.',
      generic: 'Failed to analyze video.',
    },
  },

  review: {
    generalLegend: 'General Information',
    titleLabel: 'Suggested Title',
    titleHint: '(min. 5 words)',
    descriptionLabel: 'Full Description',
    descriptionHint: '(min. 20 words)',
    sourceLabel: 'Source URL (Read-only)',
    scenesLegend: 'Scene Elements',
    scenesLabel: 'Scene Elements (comma separated)',
    scenesPlaceholder: 'mesa de cozinha, tigela azul, janela',
    audioLegend: 'Audio Analysis',
    transcription: 'Transcription / Lyrics',
    track: 'Track Name',
    artist: 'Artist',
  },

  validation: {
    urlRequired: 'Please enter a URL',
    urlInvalid: 'Please enter a valid URL',
    invalidUrl: 'Invalid URL',
    titleRequired: 'Title is required',
    titleWords: 'Title must have at least 5 words',
    descriptionRequired: 'Description is required',
    descriptionWords: 'Description must be at least 20 words long',
  },

  auth: {
    signedInAs: 'Signed in as',
    signOut: 'Sign Out',
    signedOut: 'Signed out.',
    signedIn: 'Signed in.',
    createAccount: 'Create Account',
    signIn: 'Sign In',
    subtitle: 'Searching is open to everyone. An account is what lets you add videos to the archive.',
    displayName: 'Display name',
    email: 'E-mail',
    password: 'Password',
    created: 'Account created. If confirmation is required, check your inbox before signing in.',
    working: 'Working...',
    toSignIn: 'Already have an account? Sign in',
    toSignUp: 'No account yet? Create one',
    errors: {
      invalidCredentials: 'Wrong e-mail or password.',
      emailTaken: 'That e-mail already has an account. Try signing in.',
      passwordTooShort: 'Password is too short. Use at least 6 characters.',
      emailNotConfirmed: 'Confirm your e-mail before signing in. Check your inbox.',
    },
  },

  admin: {
    notAdmin: 'This page is for administrators.',
    loading: 'Loading statistics...',
    noData: 'No data yet.',
    loadFailed: 'Could not load statistics.',
    title: 'Project statistics',
    rangeLabel: 'Time range',
    range: (days: number) => `${days} days`,
    avgLabel: 'Avg per analysis',
    avgHint: (median: string, measured: number) => `median ${median} · ${measured} measured`,
    extremesLabel: 'Cheapest / priciest',
    extremesHint: 'tokens, one analysis',
    analysesLabel: 'Analyses',
    analysesHint: (saves: string, tokens: string) => `${saves} saves · ${tokens} tokens total`,
    failureLabel: 'Failure rate',
    failureHint: (wasted: string) => `${wasted} tokens spent for nothing`,
    todayLabel: 'Today',
    ceilingHit: 'ceiling reached, nobody can analyse',
    againstCeiling: 'against the daily ceiling',
    projectedLabel: 'A full day would cost',
    projectedHint: 'tokens, at the ceiling and current average',
    perDayLegend: 'Analyses per day',
    perDayEmpty: 'Nothing in this range.',
    barTitle: (date: string, analyses: number, tokens: string) =>
      `${date}: ${analyses} analyses, ${tokens} tokens`,
    perDayNote:
      'Hover a bar for the exact day. Use this to see whether the ceiling is set anywhere near real demand.',
    failuresLegend: 'Why analyses failed',
    failuresEmpty: 'No failures in this range.',
    reason: 'Reason',
    count: 'Count',
    failuresNote:
      "Every failure here still cost tokens. A reason that repeats is worth fixing before raising anyone's limit.",
    perUserLegend: 'Consumption per account, this month',
    user: 'User',
    tokens: 'Tokens',
    perUserNote:
      'Tokens are what count against the Google AI quota. Analyses are what each account is limited by.',
  },

  tour: {
    counter: (current: number, total: number) => `Step ${current} of ${total}`,
    back: '◀ Back',
    next: 'Next ▶',
    restart: '↺ Start over',
    steps: {
      welcome: {
        tab: 'Welcome',
        title: 'What Pop Search is',
        body: (
          <>
            <p>
              An archive of Twitter and X videos that you can search by meaning, not just by the
              words someone happened to type.
            </p>
            <p>
              Each video is watched by an AI, which writes a description and lists the people,
              objects and speech it finds. That text is what the search runs against.
            </p>
            <p className={demo.reassure}>
              Nothing here is saved, and no AI is called. Take as long as you like.
            </p>
          </>
        ),
      },
      search: {
        tab: TAB_LABELS.search,
        title: 'Finding a video',
        intro: <p>Open to everyone, no account needed. Three modes:</p>,
        definitions: [
          {
            term: 'Hybrid',
            definition:
              'Meaning and exact words together. A search for "cat" finds a video described as "orange tabby", and one whose title literally says cat.',
          },
          {
            term: 'Semantic',
            definition: 'Meaning only. Finds related videos that share no words with your search.',
          },
          { term: 'Exact', definition: 'Literal words only. Every word you type must appear.' },
        ],
        outro: (
          <>
            <p>
              Under <strong>Advanced</strong> you can also set how strict the matching is, how many
              results to return, and read the supported operators: <code>"exact phrase"</code>,{' '}
              <code>-exclude</code> and <code>a or b</code>.
            </p>
            <p>
              Each result carries a badge saying whether it matched by meaning, by words, or by
              both.
            </p>
          </>
        ),
      },
      ingest: {
        tab: TAB_LABELS.ingest,
        title: 'Adding a video',
        body: (
          <p>
            This is the part that needs an account, because every analysis costs AI time. Try the
            whole flow below with a real example.
          </p>
        ),
      },
      manual: {
        tab: `${TAB_LABELS.ingest} → Manual Input`,
        title: 'Adding without the AI',
        body: (
          <>
            <p>
              Tick <strong>Manual Input</strong> on the add screen and you get the same review form,
              empty, to fill in yourself. No video is downloaded and no AI is called.
            </p>
            <p>Two reasons to use it:</p>
            <ul className={demo.list}>
              <li>
                <strong>You ran out of analyses.</strong> Manual entries do not count against the
                monthly limit, so the archive stays open to you.
              </li>
              <li>
                <strong>You describe it better.</strong> A joke or a reference the AI misses is
                exactly what makes a video findable later.
              </li>
            </ul>
            <p className={demo.hint}>
              Manually added videos are searchable like any other: the description you write is what
              the search reads.
            </p>
          </>
        ),
      },
      library: {
        tab: TAB_LABELS.myVideos,
        title: 'What you contributed',
        body: (
          <>
            <p>
              Everything you added, newest first, with a link back to the original post. Videos
              belong to whoever indexed them.
            </p>
            <p>
              The archive itself stays public: anyone can find your videos through search, with or
              without an account.
            </p>
          </>
        ),
      },
      account: {
        tab: '👤 Account',
        title: 'Your account and limits',
        body: (
          <>
            <p>
              Sign up with an e-mail and a password. Each account gets a number of analyses per
              month, shown as a bar on this tab and above the add form.
            </p>
            <p>
              The limit exists because watching a video with an AI is the expensive part. Two things
              worth knowing:
            </p>
            <ul className={demo.list}>
              <li>
                A failed analysis still counts, because the AI was already paid for by then.
              </li>
              <li>Adding a video manually, without the AI, does not count against it.</li>
            </ul>
            <p>The counter resets on the first day of each month.</p>
          </>
        ),
      },
    },
    demoSearch: {
      tryIt: (query: string) => `Try it: search for “${query}”`,
      inputLabel: 'Example search',
      submit: 'Find Now',
      badgeHint:
        'Look at the badge on each result. The first contains the word and is about a cat, so it matched both ways. The second never says “gato” - a spinning giraffe came up because the search understood the idea. The third matched only on the word.',
      modeHint: (
        <>
          In <strong>Exact</strong> mode the giraffe would disappear. In <strong>Semantic</strong>{' '}
          mode the third one would.
        </>
      ),
    },
    demoUpload: {
      step1: 'Step 1 - paste a link',
      urlLabel: 'Example video URL',
      step1Hint:
        'Only twitter.com and x.com links are accepted. Scene and audio analysis are on by default, which is what fills the searchable metadata below.',
      runAnalysis: 'Run Analysis',
      step2: 'Step 2 - the AI watches the video',
      step2Hint:
        'The real thing downloads the video, sends it to Gemini and waits for a description. This tour skips that and uses a result captured earlier.',
      step3: 'Step 3 - you review what the AI wrote',
      step3Hint:
        'Every field is editable. This is the human check before anything is indexed, and it is the same form the real flow uses.',
      step4: 'Step 4 - indexed',
      savedNotice: (
        <>
          <strong>Nothing was saved.</strong> In the real app this video would now be in the archive
          and findable by anyone, and it would count as one of your monthly analyses.
        </>
      ),
      again: 'Run it again',
    },
  },
};

export type Dictionary = typeof en;
