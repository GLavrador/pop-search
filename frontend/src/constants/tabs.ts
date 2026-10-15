import cdDrive from '../assets/win98/cd_drive-1.png';
import findFiles from '../assets/win98/search_file-2.png';
import videoFolder from '../assets/win98/directory_movie-1.png';
import chart from '../assets/win98/chart1-1.png';
import keys from '../assets/win98/keys-0.png';
import users from '../assets/win98/users-1.png';

export const TAB_LABELS = {
  ingest: 'Add-Video.exe',
  search: 'Search.exe',
  myVideos: 'My-Videos.exe',
  stats: 'Stats.exe',
  signIn: 'Sign In',
} as const;

/** The small Windows 98 icon drawn before the name of each tab. */
export const TAB_ICONS = {
  ingest: cdDrive,
  search: findFiles,
  myVideos: videoFolder,
  stats: chart,
  signIn: keys,
  account: users,
} as const;

export type Tab = 'ingest' | 'search' | 'library' | 'account' | 'admin';
