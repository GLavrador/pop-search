import type { GuideStepCopy, GuideStepId } from '../constants/guide';

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
    restore: 'Restore',
    close: 'Close',
  },

  taskbar: {
    start: 'Start',
  },

  desktop: {
    myComputer: 'My Computer',
    recycleBin: 'Recycle Bin',
  },

  closed: {
    phrases: [
      'Program terminated. The cat is in charge now.',
      'Fatal error: cat detected.',
      'You closed it. The cat opened.',
      'This machine has been shut down by a cat.',
      'Congratulations, you found the cat.',
      'It is safe to pet the cat now.',
      'System offline. The cat fell asleep on the keyboard.',
      'Access denied. Only the cat has admin privileges now.',
      'The cat caught the mouse. Application terminated.',
      'Error 404: Cat food not found.',
      'Session ended. The cat purred and wants attention.',
      'Search aborted. The cat knocked over the server.',
      'Everything is fine here. You may go clean the litter box.',
      'The system crashed. Do not let cats deploy.',
      'Asdhfjkçasldkjf... sorry, the cat stepped on the keyboard.',
      'Process terminated. But it is fine, the cat still has 6 lives.',
    ],
    hint: 'Open Pop Search on the desktop to come back.',
    catAlt: 'A cat',
  },

  gate: {
    title: 'An account is required to add videos.',
    body: 'Indexing a video runs it through the AI, so it is limited to signed-in users. Searching the archive stays open to everyone.',
    signIn: 'Sign In',
    openGuide: '📎 Show me how it works',
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
    guideInvite: 'In the meantime, let the assistant walk you through the app. It costs no analysis and needs no account.',
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

  guide: {
    name: 'BIP-98',
    poke: 'Poke BIP-98',
    beeps: ['Beep!', 'Boop.', 'Hm?', 'Ouch.', 'Zzzt.'],
    counter: (current: number, total: number) => `Step ${current} of ${total}`,
    back: '◀ Back',
    next: 'Next ▶',
    finish: '✓ Done',
    hide: 'Hide',
    hideTitle: 'Put the assistant away without losing your place',
    jumpTo: (step: number) => `Go to step ${step}`,
    paused: (current: number, total: number) => `Guide paused on step ${current} of ${total}.`,
    resume: '▶ Resume',
    quit: 'End guide',
    offScript: (tab: string) => (
      <>
        You stepped away. This part of the guide lives on <strong>{tab}</strong>.
      </>
    ),
    offScriptAction: 'Take me back',
    invite: {
      text: 'First time here? I can show you the whole app in two minutes.',
      start: '▶ Start the guide',
      dismiss: '✕',
      dismissTitle: 'Hide this invitation',
    },
    profile: {
      legend: 'Guided demo',
      note: 'A walk through adding a video and searching it. Nothing is saved and no AI is called.',
      start: '📎 Open the guide',
    },
    demo: {
      badge: 'DEMO',
      badgeTitle: 'Scripted example. Nothing is sent anywhere.',
      saved: (
        <>
          <strong>Nothing was saved.</strong> In the real app this video would be in the archive
          from now on, findable by anyone, and one analysis would have come off your monthly
          allowance.
        </>
      ),
    },
    steps: {
      welcome: {
        title: 'Hello',
        say: "Hi! I am BIP-98, the Pop Search assistant. I will show you around in about two minutes. None of what we do here counts for real: it is a tutorial, nothing reaches the app. Click away. Let's start where the videos come from.",
      },
      paste: {
        title: 'A link to start',
        say: 'Everything begins with a link to a post on X that has video in it. I pasted one in for you.',
      },
      options: {
        title: 'What the AI should look at',
        say: 'Here you pick what the AI looks at in the video: the scenes, the spoken audio, or both. Everything it reads turns into text that the search can see later, so the more you tick, the more ways there are to find this video.',
      },
      analyzing: {
        title: 'The AI watches the video',
        say: 'The real app downloads the video and hands it to Gemini, which genuinely watches it. That takes about a minute. We are not going to sit here for it - go on.',
      },
      review: {
        title: 'Your turn to check',
        say: 'This screen is the whole point. The AI wrote all of it, and nothing enters the archive until a person has read it. Every field is editable, and what you leave here is what the search will read.',
      },
      saved: {
        title: 'Indexed',
        say: 'That is the full loop. In the real app the video would be in the archive from now on, and one analysis would have come off your monthly allowance.',
      },
      manual: {
        title: 'The path without AI',
        say: 'Back on this screen, notice Manual Input. It skips the AI entirely and hands you the same form, empty. It is what you use when your monthly allowance has run out, and also when a joke needs explaining and you describe it better than Gemini does.',
      },
      searchIntro: {
        title: 'Finding something',
        say: 'Now the other half, and the half that needs no account at all. Anyone can search the archive. Let us go looking for a cat.',
      },
      results: {
        title: 'Reading the results',
        say: "Three hits, and the badge on each says how it got here. The first matched by meaning and by the word. The second never says cat at all - a spinning giraffe surfaced because the search understood the idea. The third matched on the word alone.",
      },
      modes: {
        title: 'Tuning the search',
        say: 'Open Advanced and you choose how matching works, how strict it is, and how many results come back. In Exact mode the giraffe disappears; in Semantic mode the third result does. The operators are listed in there too.',
      },
      account: {
        title: 'Accounts and limits',
        say: 'That is everything. Searching stays open and free. Adding a video is what needs an account, because every analysis costs AI time, and this tab is where you would create one and watch your monthly allowance.',
      },
    } satisfies Record<GuideStepId, GuideStepCopy>,
  },

};

export type Dictionary = typeof en;
