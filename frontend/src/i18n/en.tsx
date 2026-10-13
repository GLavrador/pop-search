import type { ReactNode } from 'react';
import type { GuideStepCopy, GuideStepId } from '../constants/guide';

interface HelpCopy {
  title: string;
  text: ReactNode;
}

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

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

  system: {
    title: 'System Properties',
    tabs: {
      general: 'General',
      devices: 'Device Manager',
      performance: 'Performance',
    },
    asking: 'asking the server...',
    silent: 'the server did not answer',
    general: {
      system: 'System:',
      name: 'Pop Search 98',
      version: (version: string) => `version ${version}`,
      registered: 'Registered to:',
      visitor: 'Visitor',
      computer: 'Computer:',
      memory: (numbers: number) => `${numbers} numbers of memory per video`,
      videos: (count: number, shown: string) =>
        count === 1 ? '1 video in the archive' : `${shown} videos in the archive`,
    },
    devices: {
      root: 'Pop Search',
      list: 'Devices',
      status: 'Device status',
      working: 'This device is working properly.',
      ready: 'This device is installed and waiting for work. It is not tested from here.',
      waking: 'This device is still waking up.',
      failing: 'This device is not answering.',
      asking: 'Asking the server how this device is doing...',
      unsaid: 'The server did not say how this device is doing.',
      undriven: 'No driver is installed for this device. It works anyway.',
      refresh: 'Refresh',
      remove: 'Remove',
      screen: {
        kind: 'Monitor',
        name: (react: string) => `Your browser, running React ${react}`,
        about: 'Draws everything you see. The whole desktop is a single page.',
        size: (width: number, height: number) => `${width} × ${height} pixels right now.`,
        refusal: 'You are looking through it. Removing it now would be rude.',
      },
      server: {
        kind: 'Ports',
        name: 'FastAPI server, on Render',
        about: 'Takes what the page asks for and talks to everything else.',
        woke: (time: string) =>
          `Took ${time} to answer on this visit. It sleeps when nobody is using it.`,
        up: (time: string) => `On for ${time}.`,
        runtime: (python: string, framework: string) => `Python ${python}, ${framework}.`,
        refusal: 'Without it nobody searches for anything. Request denied.',
      },
      database: {
        kind: 'Disk drives',
        name: 'Postgres with pgvector, on Supabase',
        about:
          'Keeps every video twice: as words, for the exact search, and as numbers, for the search by meaning.',
        videos: (count: number, shown: string) =>
          count === 1 ? '1 video kept.' : `${shown} videos kept.`,
        answered: (time: string) => `Answered in ${time}.`,
        refusal: 'Every video lives in there. Not a chance.',
      },
      analysis: {
        kind: 'Processor',
        name: (model: string) => `Gemini (${model})`,
        about: 'Watches each video from start to finish and writes its title and description.',
        idle: 'Only called when somebody keeps a video. Asking it how it is doing would spend the quota.',
        refusal: 'And who would watch the videos? You?',
      },
      embedding: {
        kind: 'Coprocessor',
        name: (model: string) => `Gemini (${model})`,
        about: (numbers: number) =>
          `Turns a text into ${numbers} numbers. Texts about the same thing get numbers that are close, and that is how the search finds by meaning.`,
        kept: (kept: number, room: number) =>
          `${kept} of the last ${room} questions are in memory: asking them again costs nothing.`,
        refusal: 'Without it the search would only find the exact word.',
      },
      downloader: {
        kind: 'Modem',
        name: (version: string) => version,
        about:
          'Fetches the video from X for the AI to watch, along with the text and the picture of the post.',
        refusal: 'Without it no video ever gets here from X.',
      },
      robot: {
        kind: 'Other devices',
        name: 'BIP-98',
        about: 'Unknown device. Nobody remembers installing it.',
        refusal: 'The device refused to be removed. It also looks offended.',
      },
    },
    performance: {
      none: 'No search yet on this visit. Run one in Search.exe and come back: this tab shows how long each step of it took.',
      last: (query: string, mode: string) => `Last search: "${query}" (${mode})`,
      found: (count: number) => (count === 1 ? '1 result' : `${count} results`),
      steps: {
        embed: 'Understanding the question (AI)',
        db: 'Looking through the archive (database)',
        rest: 'Rest of the server',
        network: 'The way there and back',
      },
      skipped: 'skipped: this mode does not use the AI',
      total: 'From the click to the answer',
      unreported: 'This server does not say how long each step took.',
      cached:
        'A question already asked is not sent to the AI again, which is why that step can take no time at all.',
    },
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

  boot: {
    title: 'Pop Search BIOS 1.0',
    maker: 'Copyright (C) 1998, Pop Search Corp.',
    program: 'Program',
    language: 'Language',
    languageName: 'English',
    session: 'Session',
    server: 'Server',
    ok: 'OK',
    checking: 'checking...',
    visitor: 'visitor',
    calling: 'calling...',
    waking: (seconds: number) => `waking up, ${seconds} s`,
    awake: (time: string) => `OK, in ${time}`,
    down: 'no answer',
    asleep: 'The server sleeps when nobody is using it. Waking up takes up to a minute.',
    goingIn: 'Going in without it. The robot will tell you when the server is up.',
    starting: 'Starting Pop Search...',
    skip: 'Press any key, or tap the screen, to go in now.',
  },

  crash: {
    lead: 'A fatal error has occurred and Pop Search had to stop:',
    reopen: 'Press any key to restart Pop Search.',
    kept: 'Videos already saved are still saved. What was only on screen is lost.',
    again: 'The error came back right after restarting.',
    reload: 'Press any key to reload the whole page.',
    goOn: 'Press any key to continue',
    robot: 'Uh oh. That was not meant to happen. Press a key and I will switch it all back on.',
    robotAgain: 'Again?! Then let us reload the whole page.',
  },

  rebuild: {
    crash: {
      lead: 'An illegal operation was performed by you: Pop Search was thrown in the Recycle Bin.',
      code: 'ERROR 0xB1N: PROGRAM_IS_NOT_RUBBISH',
      steps: [
        'A program does not go in the Recycle Bin. That is like putting the house in the kitchen bin.',
        'The desktop went with it: icons, taskbar, clock, the lot.',
      ],
      hold: 'Do not press any key. Somebody is already on the way',
    },
    setup: {
      spoken: 'Pop Search. A robot is building the desktop from nothing. Press any key to skip.',
    },
    says: {
      disbelief: 'No. No, no, NO. I do not believe this.',
      gone: 'It is all gone. ALL of it. Nothing left but this blue.',
      who: 'Who threw Pop Search in the BIN?! I LIVE in there!',
      fine: 'Fine, fine. I will put it all back together. But you are going to watch.',
      done: 'There, everything back in its place. And a program is NOT rubbish. Deal?',
      visit: 'Goodness, I was not expecting visitors just now!',
      tidy: 'But make yourself at home, let me just tidy up real quick, hehe.',
    },
    emotes: {
      no: 'no...',
      noIcons: 'where are the icons?',
      noBar: 'and the taskbar?!',
      noClock: 'not even the clock?!',
      one: 'one bin...',
      two: 'one computer...',
      polish: 'this one with care',
      three: 'and my house!',
      bar: 'now, the bar',
      heave: 'hnnngh!',
      slip: 'it slipped!',
      heaveAgain: 'again...',
      slipAgain: 'oh, like that, is it?!',
      barUp: 'THIS TIME!',
      phew: 'phew...',
      start: 'and Start, just for show',
      hammer: 'tap tap tap',
      unset: '12:00? no.',
      ticking: 'there, ticking!',
      shoo: 'shoo, blue!',
      shooMore: 'off you go!',
      clean: 'spotless!',
      knock: 'open up!',
      knockHard: 'OPEN UP!!',
      pull: 'hnnnngh!!',
      slipped: 'no, no, no!',
      pullHard: 'ONE... MORE...',
      open: 'it is open!',
      ready: 'all yours!',
    },
    skip: 'skip ▸▸',
    skipTitle: 'Skip the rebuilding (Esc)',
  },

  gate: {
    title: 'An account is required to add videos.',
    body: 'Indexing a video runs it through the AI, so it is limited to signed-in users. Searching the archive stays open to everyone.',
    signIn: 'Sign In',
    openGuide: '▶ Show me how it works',
  },

  footer: '© 1998 Pop Search Corp. - All rights reserved.',

  common: {
    ready: 'Ready',
    cancel: 'Cancel',
    back: 'Back',
    save: 'Save',
    saving: 'Saving...',
    ok: 'OK',
    closeOf: (what: string) => `Close ${what}`,
  },

  searchModes: {
    hybrid: {
      label: 'Hybrid',
      hint: 'Meaning and exact terms combined. A video is found either by what it shows or by the words it contains.',
      operatorScope:
        'These apply to the part of the search that looks for your words. The part that looks for meaning reads your whole text.',
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
      operatorScope: 'Here they apply to the entire search.',
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
    precision: (percent: number) => `Precision ${percent}%`,
    loading: 'Querying database...',
    conCon: 'C:\\CON\\CON really did bring Windows 98 down. It does the same here.',
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
    thresholdLegend: 'Precision fine-tuning',
    thresholdLabel: 'Match threshold',
    scaleLow: 'More videos',
    scaleHigh: 'Pickier',
    thresholdDisabled: (mode: string) => (
      <>
        Not used in <strong>{mode}</strong> mode: matching is literal, so nothing is scored by
        similarity.
      </>
    ),
    syntaxLegend: 'Writing shortcuts',
    syntax: [
      { example: 'baleia bebê', meaning: 'Both words required. Every extra word narrows the search.' },
      { example: '"baleia assassina"', meaning: 'That exact phrase, in that order.' },
      { example: 'baleia -orca', meaning: 'Contains the first, excludes the second.' },
      { example: 'baleia or golfinho', meaning: 'Either word is enough.' },
    ],
    resultsLegend: 'Max results',
    maxResults: 'Max results per search',
  },

  card: {
    both: { label: 'meaning + words', title: 'Matched both semantically and by the exact terms you typed.' },
    words: { label: 'words', title: 'Matched because the video contains the terms you typed.' },
    meaning: { label: 'meaning', title: 'Matched by meaning. Your exact words may not appear in this video.' },
    match: (percent: number) => `MATCH: ${percent}%`,
    noDescription: 'No description available',
    more: 'read more ▾',
    less: 'read less ▴',
    copy: 'Copy',
    copyTitle: 'Copy URL',
    copied: 'URL copied to clipboard!',
  },

  why: {
    open: 'Why?',
    title: 'See why this video came up, and in this place',
    heading: 'Why this result?',
    final: (n: number) => `${ordinal(n)} on the list.`,
    lead: {
      both: 'It came up for its meaning and for its words.',
      words: 'It came up for the words you typed.',
      meaning: 'It came up for its meaning: it is about something like what you wrote.',
    },
    meaning: 'Meaning',
    words: 'Words',
    meaningPlace: (n: number, percent: number) =>
      `${ordinal(n)} among the videos most alike: ${percent}% like what you wrote.`,
    wordsPlace: (n: number) => `${ordinal(n)} among the videos that have your words.`,
    belowCut: (percent: number) =>
      `That is under the ${percent}% precision asked. On its own it would not be here: it got in through the words.`,
    meaningUnlisted: 'Not among the videos most alike.',
    wordsUnlisted: 'Not among the first by words.',
    meaningOff: 'This mode does not look for meaning.',
    wordsOff: 'This mode does not look for words.',
    showSum: 'Show the sum >>',
    hideSum: '<< Hide the sum',
    sum: {
      caption: 'How the place on the list was worked out',
      list: 'List',
      place: 'Place',
      points: 'Points',
      total: 'Together',
      nth: (n: number) => ordinal(n),
      out: 'not in it',
      formula: (k: number, place: number, points: string) => `1 ÷ (${k} + ${place}) = ${points}`,
    },
    how: 'Two lists are made, one by meaning and one by words. Each gives points for the place a video holds in it, and whoever adds up the most comes first.',
    howSingle: 'In this mode only one of the two lists is made, so its order is the final one.',
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
    edit: 'Edit',
    editOf: (title: string) => `Edit "${title}"`,
    remove: 'Delete',
    removeOf: (title: string) => `Delete "${title}"`,
    editing: 'Editing the video',
    confirm: {
      question: 'Delete this video from the archive? This cannot be undone.',
      yes: 'Yes, delete',
      removing: 'Deleting...',
    },
    status: {
      editing: 'Change what you need and save.',
      editCancelled: 'Edit cancelled. The video is as it was.',
      saving: 'Saving your changes...',
      saved: 'Changes saved.',
      saveFailed: 'Error: Failed to save your changes. Please try again.',
      removing: 'Deleting the video...',
      removed: 'Video deleted from the archive.',
      removeFailed: 'Error: Failed to delete the video. Please try again.',
    },
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
    progressLabel: 'Analysis progress',
    stages: {
      queued: 'Getting ready',
      downloading: 'Downloading the video from X',
      uploading: 'Sending the video to the AI',
      watching: 'The AI is watching the video',
      writing: 'The AI is writing the description',
    },
    duplicate: {
      title: 'This video is already in the archive.',
      body: 'Nothing was taken from your quota.',
      added: (date: string) => `Added on ${date}`,
      open: 'Open the post',
      dismiss: 'Dismiss the notice',
    },
    draft: {
      title: 'You left an analysis unsaved',
      body: 'The AI has already described this video. Pick it up where you left off, or discard it: a discarded analysis does not go back to your quota.',
      analysed: (date: string) => `Analysed on ${date}.`,
      resume: 'Continue the review',
      discard: 'Discard',
    },
    status: {
      stage: (step: string) => `${step}...`,
      draft: 'An analysis is waiting to be saved.',
      duplicate: 'This video is already in the archive.',
      discarded: 'Analysis discarded.',
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
      lost: 'I lost contact with the server in the middle of the analysis. It may have carried on there: wait a little and reload the page before trying again.',
    },
  },

  review: {
    generalLegend: 'General Information',
    titleLabel: 'Suggested Title',
    titleHint: '(min. 5 words)',
    descriptionLabel: 'Full Description',
    descriptionHint: '(min. 20 words)',
    sourceLabel: 'Source URL (Read-only)',
    postLegend: 'Original post',
    postLabel: 'Text of the post',
    postHint: '(optional, the search reads it)',
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
    emotes: {
      heavy: 'so heavy!',
      sorry: 'oops, sorry!',
      knock: 'knock knock',
      puzzled: 'huh?',
      grabbed: ['whoa!', 'hey!', 'put me down!', 'wheee!'],
      bin: ['NOT THE BIN!!', 'I AM NOT RUBBISH!', 'HELP!!'],
      hiding: ['is it over?', 'is it gone?', 'can I come out?'],
      dizzy: ['so dizzy...', 'stop the world!', 'everything is spinning...'],
      enough: ['enough!', 'stop, that tickles!', 'hey, that will do!'],
      lurk: ['that is it, I am hiding!', 'bye, I am off!', 'leave me be!'],
      found: ['you found me!', 'oops!', 'not here!'],
      flip: ['wheee!', 'watch this!', 'ta-da!'],
      roof: ['I can see it all from here', 'my favourite spot', 'what a view!'],
      yawn: ['yaaawn...', 'so sleepy...', 'where did everyone go?'],
      woke: ['huh? I am awake!', 'I was not sleeping!', 'oh, you are back!'],
    },
    progress: (current: number, total: number) => `Step ${current} of ${total}`,
    back: '◂ back',
    next: 'Got it ▶',
    skip: 'skip ▸',
    skipTitle: 'Carry on without doing this step',
    yourTurn: 'Your turn:',
    close: 'Close the guide',
    closeTitle: 'Close the guide. You can pick it up again where you stopped.',
    jumpTo: (step: number) => `Go to step ${step}`,
    paused: (current: number, total: number) => `Guide paused on step ${current} of ${total}.`,
    resume: '▶ Resume',
    quit: 'end guide',
    offScript: (tab: string) => (
      <>
        You stepped away. This part of the guide lives on <strong>{tab}</strong>.
      </>
    ),
    offScriptAction: 'Take me back',
    invite: {
      lead: 'Want to see how Pop Search works?',
      text: 'I will show you all of it in two minutes, on a practice screen. No account needed.',
      start: '▶ Start the guide',
      close: 'Close for now. The invitation is back the next time the page opens.',
      hide: 'do not show again',
      hideTitle: 'Do not show this invitation again in this browser. The Sign In tab can turn it back on.',
      keep: 'Invite me to the guide every time Pop Search opens',
    },
    chip: {
      label: 'Guide',
      title: 'Guide: let BIP-98 show you around',
    },
    profile: {
      legend: 'Guided demo',
      note: 'A walk through keeping a video and finding it again. Nothing is saved and no AI is called.',
      start: '▶ Open the guide',
    },
    demo: {
      badge: 'DEMO',
      badgeTitle: 'Practice screen. Nothing here is sent anywhere.',
      saved: (
        <>
          <strong>Saved, in pretend.</strong> This is practice, so nothing was really kept.
        </>
      ),
    },
    steps: {
      welcome: {
        title: 'Hi! I am BIP-98',
        say: (
          <>
            I am the robot that lives in here and helps whoever is just arriving. Before I show
            you where everything is, let me tell you <strong>what Pop Search is</strong> and what
            it is for.
          </>
        ),
        next: 'Tell me ▶',
      },
      about: {
        title: 'What Pop Search is',
        say: (
          <>
            Know that video you saw on X and then could never find again? Pop Search is an archive
            of videos built so that does not happen. This is basically how it works:
            <ol>
              <li>
                <strong>You keep it</strong> A video you would not want to lose or forget. Just
                paste the link to the post it is in.
              </li>
              <li>
                <strong>The AI describes it</strong> An artificial intelligence watches the video
                and writes down what happens in it. Or you write it yourself, if you would rather.
              </li>
              <li>
                <strong>You find it</strong> The search goes by meaning (semantic) and by the words
                (exact). It finds your videos and other people's, even when you are not sure what
                to type.
              </li>
            </ol>
            Now I will show you each part working, in a tutorial. It will not take long :)
          </>
        ),
        next: 'Off we go ▶',
      },
      paste: {
        title: 'Keeping a video',
        say: 'It all starts with the link to a post on X that has a video. In the real app you copy that link and paste it into this field. I already pasted an example for you.',
        task: (
          <>
            click <strong>Next</strong>, beside the link.
          </>
        ),
      },
      options: {
        title: 'What the AI looks at',
        say: 'The video is described by an artificial intelligence (AI): it watches the video and writes down what it sees. Here you choose whether it looks at the scenes, listens to the audio, or both. The more it takes in, the easier the video is to find later.',
        task: (
          <>
            click <strong>Run Analysis</strong>.
          </>
        ),
      },
      analyzing: {
        title: 'The AI is watching',
        say: 'Now the AI watches the whole video and writes a summary of it. In the real app this takes about a minute, and this bar shows how far along it is. Here we do not have to wait.',
        next: 'Skip the wait ▶',
      },
      review: {
        title: 'Check what the AI wrote',
        say: 'Done: the AI suggested a title and a description. It gets things wrong now and then, so nothing is kept before you check it. Click any field to fix it. This text is what the search will read later.',
      },
      save: {
        title: 'Keep it',
        say: 'When the text looks right, all that is left is saving. That is the moment the video enters the archive.',
        task: (
          <>
            click <strong>Save</strong>, at the end of the form.
          </>
        ),
      },
      saved: {
        title: 'Video kept',
        say: 'That is it! In the real app, from now on anyone could find this video. Each video the AI analyses uses up one of your analyses for the month: every account has a limit.',
      },
      manual: {
        title: 'And without the AI?',
        say: (
          <>
            See this little box? With <strong>Manual Input</strong> ticked the AI is not used: you
            write the title and the description yourself. It is for when your analyses for the
            month run out, or when you can explain the video better than the AI would.
          </>
        ),
      },
      searchIntro: {
        title: 'Now, finding one',
        say: (
          <>
            This is the other half, and it needs no account: anyone can search. You write what you
            remember of the video, in your own words. I already typed <strong>gato</strong>, which
            is cat in Portuguese, for us to try.
          </>
        ),
        task: (
          <>
            click <strong>Find Now</strong>.
          </>
        ),
      },
      results: {
        title: 'What came up',
        say: (
          <>
            Three videos. Look at the label next to each one: it tells you why that video came up.{' '}
            <strong>words</strong> means its text has the word you typed. <strong>meaning</strong>{' '}
            means it is about something similar, even without the word. That is how a giraffe got
            here. The <strong>Why?</strong> button of each one opens the whole explanation.
          </>
        ),
      },
      modes: {
        title: 'Fine-tuning the search',
        say: (
          <>
            The <strong>Advanced</strong> button opens the settings: search by the exact words
            only, by meaning only, or by both, which is the default. Open it and play around: the
            results below change as you go.
          </>
        ),
      },
      account: {
        title: 'To keep videos, an account',
        say: 'Searching is open to everyone. To keep videos you need an account, because every AI analysis has a cost. This tab is where you create yours and see how many analyses you have left this month.',
        next: 'Finish ✓',
      },
    } satisfies Record<GuideStepId, GuideStepCopy>,
  },

  robot: {
    dismiss: 'Close',
    ask: (what: string) => `What is ${what}?`,
    says: {
      tabs: {
        ingest: ['time to keep one!', 'send me the link!', 'a new video?'],
        search: ['shall we look?', 'what are we after?', 'I will find it for you!'],
        library: ['your collection!', 'look at all that!', 'all kept right here'],
        account: ['your account', 'your details live here', 'all in order here'],
        admin: ['the numbers!', 'spreadsheet time', 'let us see the sums'],
      },
      searching: ['looking...', 'leave it to me...', 'digging around...'],
      found: [
        (count: number) => (count === 1 ? 'found 1!' : `found ${count}!`),
        (count: number) => (count === 1 ? 'got 1 here!' : `got ${count} here!`),
        (count: number) => (count === 1 ? 'look, 1 video!' : `look, ${count} videos!`),
      ],
      searchFailed: ['oops, that failed...', 'uh oh, it broke...', 'something went wrong'],
      copied: ['copied!', 'it is yours!', 'link copied!'],
      badLink: ['that link will not do', 'that is not a link', 'hm, odd link'],
      analysed: ['done!', 'finished!', 'the AI is through!'],
      cancelled: ['ok, stopped.', 'cancelled.', 'fine, it stopped.'],
      duplicate: ['I already have that one!', 'that one is kept already', 'seen it, kept it!'],
      draft: ['you left one unfinished!', 'I kept your analysis', 'this one is still waiting'],
      manual: ['I trust you!', 'make it a good one!', 'you write better anyway'],
      saved: ['kept!', 'in the archive!', 'saved, go search for it!'],
      saveFailed: ['it did not save...', 'uh oh, not saved', 'try again?'],
      removed: ['off it goes', 'one fewer', 'out of the archive'],
      removeFailed: ['I could not remove it...', 'uh oh, it stayed', 'try again?'],
      hello: [
        (name: string | null) => (name ? `hi, ${name}!` : 'hi!'),
        (name: string | null) => (name ? `welcome, ${name}!` : 'welcome!'),
        (name: string | null) => (name ? `good to see you, ${name}!` : 'good to see you!'),
      ],
      bye: ['see you!', 'bye!', 'come back soon!'],
      language: ['now in English!', 'English it is!', 'speaking English!'],
      closing: ['hey!', 'do not close it!', 'really?', 'there is a cat in there...'],
      reopened: ['phew!', 'it is back!', 'what a scare!'],
      serverAwake: ['the server is up!', 'there, it woke up!', 'full speed now!'],
      iconDropped: ['it always goes back', 'stubborn icons', 'it likes it there'],
      binThreat: ['do NOT!', 'not in there!!', 'do not even think about it!'],
      appTrashed: ['WHAT DID YOU DO?!', 'NOOOO!', 'MY HOUSE!!'],
      bigger: ['wow, so big!', 'full screen!', 'room to spare!'],
      smaller: ['that fits better', 'regular size', 'back to my corner'],
      echo: [
        (word: string) => `${word}?`,
        (word: string) => `hm, ${word}?`,
        (word: string) => `${word}, eh?`,
      ],
      got: [
        (word: string) => `ah, ${word}!`,
        (word: string) => `${word}, I see!`,
        (word: string) => `so it was ${word}!`,
      ],
      quirks: {
        cleared: ['huh, gave up?', 'all gone!', 'starting over, eh?'],
        shouting: ['no need to shout!', 'ow, my ears!', 'CALM DOWN!'],
        stuck: ['is the key stuck?', 'keyboard jammed?', 'let go of the key!'],
        long: ['what a long search!', 'is that an essay?', 'take a breath!'],
      },
      caught: ['oops, I read nothing!', 'I was not looking!', 'I saw nothing, promise!'],
      hints: {
        lone: [
          (word: string) => `just "${word}"? try Broad!`,
          () => 'one word only? Broad finds more',
          (word: string) => `${word}... Broad brings more`,
        ],
        quoted: [
          () => 'in quotes means the exact phrase!',
          () => 'quotes? to the letter, then',
          () => 'exact phrase, noted!',
        ],
        quotedIgnored: [
          () => 'quotes do not count in Semantic mode',
          () => 'here the quotes are just decoration',
          () => 'quotes do nothing in this mode',
        ],
      },
      title: {
        good: ['I like that title!', 'the AI did well!', 'good title, easy to find'],
        short: [
          'short title: it needs 5 words',
          'is that all? the search wants more',
          'hm, that title is thin',
        ],
        long: ['whoa, what a long title!', 'a title or a description?', 'now that is a title!'],
      },
      typed: {
        cat: ['meow?', 'a cat?! where?', 'the one behind the window?'],
        robot: ['that is me!!', 'did you call?', 'robot? present!'],
        dog: ['woof woof!', 'dogs I like', 'where is the puppy?'],
        bin: ['do not say that word!', 'a bin?! where?!', 'yikes...'],
        home: ['you are already in it!', 'the best program there is!', 'that is my house!'],
      },
      press: {
        next: ['nice, a link!', 'let us see that video', 'next step!'],
        back: ['going back...', 'no hurry', 'back to the link'],
        manualOn: ['handmade mode!', 'you write, I watch', 'no AI this time'],
        manualOff: ['the AI is back!', 'leave it to the AI', 'automatic mode'],
        optionOn: ['more detail!', 'good, it notes that too', 'the more the better'],
        optionOff: ['quicker this way', 'ok, without that', 'less for it to read'],
        presetBroad: ['net wide open!', 'bring them all!', 'the more the merrier'],
        presetBalanced: ['the middle ground', 'balance!', 'not too much, not too little'],
        presetPrecise: ['only the best', 'picky mode', 'fine comb!'],
        advancedOpen: ['the fine settings!', 'time to tinker', 'the control panel'],
        advancedClose: ['all tucked away', 'closed!', 'settings put away'],
        modeHybrid: ['both ways!', 'the best of both', 'the usual mode'],
        modeSemantic: ['by subject only', 'reading between the lines', 'by meaning!'],
        modeText: ['to the letter', 'word for word', 'literal mode'],
        limit: ['noted!', 'that many it is', 'deal'],
        stricter: ['pickier!', 'only the close ones', 'raising the bar'],
        looser: ['looser!', 'letting more in', 'lowering the bar'],
        reviewCancel: ['fine, thrown away', 'maybe next time', 'ok, it is gone'],
        editVideo: ['let us tidy it up', 'time for a touch-up', 'what is changing?'],
        editCancel: ['left as it was', 'nothing changed', 'ok, I let it be'],
        removeAsk: ['are you sure?', 'really delete it?', 'this one does not come back...'],
        removeCancel: ['phew!', 'it stays!', 'good, still kept'],
        openVideo: ['good pick!', 'that one is good', 'go and see!'],
        authSwitch: ['new account or old?', 'either way, I wait', 'take your pick'],
        authSubmit: ['checking...', 'one moment...', 'knocking on the door...'],
        gateSignIn: ['come, it is quick', 'an account is free', 'this way!'],
        inviteClose: ['see you!', 'I will be around!', 'call me if you need me'],
        adminRange: ['another period!', 'moving the window', 'recounting...'],
        why: ['let me explain!', 'x-ray!', 'behind the scenes!'],
        computer: ['that is me inside!', 'mind the mess', 'my insides!'],
        deviceRobot: ['that is me!', 'no driver, and proud', 'unknown, me?'],
        removeDevice: ['that one stays!', 'not a chance!', 'we need that'],
        removeRobot: ['ME?!', 'remove ME?!', 'go on, try'],
      },
    },
    lines: {
      steps: {
        downloading: [
          'I am fetching the video from X. The whole analysis normally takes a minute.',
          'First I download the video from X. It is quick.',
          'Pulling the video over from X. I will keep an eye on it all.',
        ],
        uploading: [
          'Video in hand, now I send it to the other robot.',
          'Downloaded. I am sending the video to the AI.',
          'The video is on its way to the AI now.',
        ],
        watching: [
          'The AI is watching. It sees the whole video before it writes.',
          'Movie time: the AI is watching the video from start to finish.',
          'Over to the AI now. It watches everything, scene by scene.',
        ],
        writing: [
          'It has finished watching and is already writing.',
          'Nearly there: the AI is writing the title and the description.',
          'The AI picked up the pen. The description is coming.',
        ],
      },
      waiting: [
        'The AI watches the whole video before it writes, that is why it takes a while.',
        'A long video takes longer. It is still going.',
        'Nearly there, I think. If you get tired of waiting, you can cancel.',
      ],
      analysisFailed: {
        text: 'The AI could not manage this time, and the reason is in the red box. You can try again, or write the title and the description yourself.',
        action: 'Fill it in myself',
      },
      emptyWiden: {
        text: 'I found nothing at this precision. Shall I look again, accepting videos that are less alike?',
        action: 'Try Broad',
      },
      emptyLoosen: {
        text: 'No video has exactly those words. Shall I look by meaning as well?',
        action: 'Search by meaning too',
      },
      emptyStuck: {
        text: 'Still nothing. Try other words, or describe the scene another way.',
      },
      serverWaking: {
        text: 'The server is still waking up: it sleeps when nobody is using it. The first search may take up to a minute.',
      },
      serverDown: {
        text: 'The server did not answer. Searching and keeping videos may not work for now. Try reloading the page in a little while.',
      },
      inviteHidden: {
        text: 'Deal: I will not show the invitation again in this browser. The guide stays up here, under Guide, and the Sign In tab can turn the invitation back on.',
        action: 'Undo',
      },
    },
    drop: {
      computer: [
        'My Computer? But we are already inside it!',
        'Keep me in the computer? I already live in it, look.',
        'Opening My Computer from inside the computer... my head is spinning.',
      ],
      app: [
        'Pop Search! This one is already mine: I live in it.',
        'That is my house! I tidied it all up myself.',
        'Pop Search, the best program on this computer. I may be biased.',
      ],
      clock: [
        (time: string) => `It is ${time}. Time flies when you are looking for a video.`,
        (time: string) => `Let me see... ${time}. Right on time, as always.`,
        (time: string) => `${time}! High time to keep a new video.`,
      ],
      start: [
        'Open! Open! ... Nothing. This Start has never opened.',
        'Let me try again... no, still just for show.',
        'One day this button will open. Not today.',
      ],
      close: [
        'Careful with that button: they say there is a cat on the other side.',
        'The X? I would not press it. There is a cat waiting back there.',
        'That one closes the window. And lets the cat out.',
      ],
    },
    whatsThis: {
      button: "What's this?",
      title: "What's this? Click here, then on anything on screen.",
      prompt: 'Click on anything on screen and I will tell you what it is.',
      unknown: 'Hm, I have nothing to say about that one. Click on something else.',
    },
    help: {
      'tab.ingest': {
        title: 'Add-Video.exe',
        text: 'This is where you keep a video: paste the link to a post on X, and the AI watches it and writes down what happens.',
      } as HelpCopy,
      'tab.search': {
        title: 'Search.exe',
        text: 'This is where you find a video that was kept. Write what you remember of it, in your own words, and I look for it. No account needed.',
      } as HelpCopy,
      'tab.library': {
        title: 'My-Videos.exe',
        text: 'The list of the videos you kept yourself.',
      } as HelpCopy,
      'tab.account': {
        title: 'Your account',
        text: 'Here you sign in or create your account, see how many analyses you have left this month and switch language.',
      } as HelpCopy,
      'tab.admin': {
        title: 'Stats.exe',
        text: 'Only administrators see this tab. It shows how much the AI was used, and by whom.',
      } as HelpCopy,
      status: {
        title: 'Status bar',
        text: 'It tells what the program just did: searching, saved, something failed. Worth a look whenever things seem stuck.',
      } as HelpCopy,
      'window.buttons': {
        title: 'Window buttons',
        text: 'Minimize, maximize and close. The close one is stubborn: you have to insist. They say there is a cat on the other side.',
      } as HelpCopy,
      'taskbar.start': {
        title: 'Start',
        text: 'That one is just for show. I have jumped on it many times and it never opened a thing.',
      } as HelpCopy,
      'taskbar.clock': {
        title: 'Clock',
        text: 'The time on your computer. I drop by now and then to check it.',
      } as HelpCopy,
      'taskbar.task': {
        title: 'Pop Search System',
        text: 'The button of the window. Click to minimize the program, click again to bring it back.',
      } as HelpCopy,
      'desktop.icon': {
        title: 'Desktop',
        text: 'You can drag the icons around, but they always go back to their place. The Pop Search one opens the program again if you close the window, and My Computer shows what all this is made of. Just do not drop Pop Search in the Recycle Bin.',
      } as HelpCopy,
      system: {
        title: 'System Properties',
        text: 'What Pop Search is made of, for real: each part, whether it is answering right now, how many videos are kept and how long your last search took at each step.',
      } as HelpCopy,
      robot: {
        title: 'BIP-98',
        text: 'That is me! I live here in Pop Search and explain whatever you want. You can also pick me up and drag me around the screen.',
      } as HelpCopy,
      'guide.invite': {
        title: 'The guide',
        text: 'A two minute tour where I show you the whole app on a practice screen. Nothing you do there counts for real.',
      } as HelpCopy,
      'ingest.url': {
        title: 'Video link',
        text: 'Paste here the link to a post on X that has a video. Then click Next to choose what the AI looks at.',
      } as HelpCopy,
      'ingest.manual': {
        title: 'Manual input',
        text: 'With this box ticked the AI is not used: you write the title and the description yourself. It spends none of your analyses.',
      } as HelpCopy,
      'ingest.options': {
        title: 'Analysis options',
        text: 'The AI always writes a title and a description. Here you choose whether it also notes the scenery and transcribes the audio. The more it notes, the easier the video is to find later.',
      } as HelpCopy,
      'ingest.progress': {
        title: 'Analysis under way',
        text: 'The list shows which step the analysis is at: downloading the video, sending it to the AI, the AI watching it and then writing. It usually takes about a minute, longer for long videos. You can cancel, and you can leave and come back later.',
      } as HelpCopy,
      'ingest.duplicate': {
        title: 'Repeated video',
        text: 'Someone has already kept this video, so it is not analysed again and nothing leaves your quota. It already shows up in the search.',
      } as HelpCopy,
      'ingest.draft': {
        title: 'Unsaved analysis',
        text: 'An analysis that finished and was not saved is kept here. Continue the review to save it, or discard it to analyse another video.',
      } as HelpCopy,
      'ingest.error': {
        title: 'The analysis failed',
        text: 'The message says what went wrong. You can try again, or tick Manual input and write it yourself.',
      } as HelpCopy,
      'ingest.quota': {
        title: 'Analyses this month',
        text: 'Every video the AI analyses spends one analysis, and each account has a monthly limit. When it runs out, Manual input keeps working.',
      } as HelpCopy,
      'ingest.gate': {
        title: 'Account needed',
        text: 'Keeping videos uses the AI, which has a cost, so it asks for an account. Searching stays open to everyone.',
      } as HelpCopy,
      'review.general': {
        title: 'Title and description',
        text: 'This is the text the search reads to find the video. The AI gets things wrong now and then, so check it and fix what needs fixing before you save.',
      } as HelpCopy,
      'review.post': {
        title: 'Text of the post',
        text: 'What was written in the post on X. If it stays here, the search looks through this text too. You can correct it or clear it: it is not shown in the results.',
      } as HelpCopy,
      'review.scenes': {
        title: 'Scene elements',
        text: 'Things that show up in the video, separated by commas. They help find the video by a detail, like "blue bowl".',
      } as HelpCopy,
      'review.audio': {
        title: 'Audio',
        text: 'What is said or sung in the video, and the song when the AI recognises it. It lets you find the video by a line spoken in it.',
      } as HelpCopy,
      'review.save': {
        title: 'Save or cancel',
        text: 'Save keeps the video in the archive with the text above. Cancel throws it all away and goes back to the start.',
      } as HelpCopy,
      'search.query': {
        title: 'Your search',
        text: 'Write what you remember of the video, in your own words: a scene, a line, a subject. Then click Search.',
      } as HelpCopy,
      'search.presets': {
        title: 'Precision',
        text: 'How closely a video has to resemble what you wrote. Broad brings more videos, Precise only the closest ones. If nothing comes up, try Broad.',
      } as HelpCopy,
      'search.advanced': {
        title: 'Advanced',
        text: 'Opens the fine settings of the search: the mode, the exact precision, the writing shortcuts and how many results come back.',
      } as HelpCopy,
      'search.advancedOpen': {
        title: 'Hide advanced',
        text: 'Tucks the fine settings away again. Whatever you chose in them still applies.',
      } as HelpCopy,
      'search.mode': {
        title: 'Search mode',
        text: (
          <>
            It is how I look. <strong>Hybrid</strong> uses both ways at once and is the default.{' '}
            <strong>Semantic</strong> goes by subject, even when the video uses other words.{' '}
            <strong>Exact</strong> only brings videos that contain the words you typed.
          </>
        ),
      } as HelpCopy,
      'search.threshold': {
        title: 'Precision fine-tuning',
        text: 'How closely a video has to resemble what you wrote to make the list. Further right I get picky and bring fewer videos. Further left I bring more, some of them not that close. It only applies to searching by meaning.',
      } as HelpCopy,
      'search.syntax': {
        title: 'Writing shortcuts',
        text: 'Shortcuts for searching by words: quotes look for the exact phrase, a minus sign leaves a word out, and "or" accepts either one.',
      } as HelpCopy,
      'search.limit': {
        title: 'Max results',
        text: 'How many videos I bring each time. With fewer, the list stays short and holds only the best ones.',
      } as HelpCopy,
      'search.empty': {
        title: 'Nothing found',
        text: 'No video made it through the filter. Try the Broad precision, fewer words, or describe it another way.',
      } as HelpCopy,
      card: {
        title: 'A result',
        text: 'A video from the archive: the title leads to the original post and the text is the summary kept with it.',
      } as HelpCopy,
      'card.origin': {
        title: 'Why it came up',
        text: 'The tag tells the reason: "words" means the text of the video has what you typed, "meaning" means it is about something similar.',
      } as HelpCopy,
      'card.why': {
        title: 'Why?',
        text: 'Opens a window that tells, in plain words, why this video came up and in this place: how alike it is, where your words were found in it, and the sum behind it for whoever wants to see it.',
      } as HelpCopy,
      'card.match': {
        title: 'Match',
        text: 'How much the subject of the video resembles your search. The closer to 100%, the more alike.',
      } as HelpCopy,
      'card.copy': {
        title: 'Link to the post',
        text: 'The address of the original post on X. The Copy button leaves it ready to paste wherever you like.',
      } as HelpCopy,
      library: {
        title: 'My videos',
        text: 'Everything you kept with your account. Click the title of a video to open the original post.',
      } as HelpCopy,
      'library.actions': {
        title: 'Edit or delete',
        text: 'Edit opens what is kept about the video so you can correct it. Delete takes the video out of the archive for good, after you confirm.',
      } as HelpCopy,
      'library.save': {
        title: 'Save or cancel',
        text: 'Save writes the changes, and the search starts finding the video by the new text. Cancel leaves the video as it was.',
      } as HelpCopy,
      'account.form': {
        title: 'Sign in or create an account',
        text: 'The account is what lets you keep videos. Searching does not need one.',
      } as HelpCopy,
      'account.session': {
        title: 'Your account',
        text: 'You are signed in. The Sign Out button ends the session in this browser.',
      } as HelpCopy,
      'account.guide': {
        title: 'Guided demo',
        text: 'Takes the tour with me again on a practice screen. It spends no analysis and nothing is saved.',
      } as HelpCopy,
      language: {
        title: 'Language',
        text: 'Switches the language of the whole program, mine included.',
      } as HelpCopy,
      admin: {
        title: 'Statistics',
        text: 'The panel for whoever runs the project: how much the AI was used, what it cost and why analyses failed.',
      } as HelpCopy,
    },
  },
};

export type Dictionary = typeof en;
