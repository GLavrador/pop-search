export const TAB_LABELS = {
  ingest: '💿 Add-Video.exe',
  search: '🔍 Search.exe',
  myVideos: '📁 My-Videos.exe',
  stats: '📊 Stats.exe',
  signIn: '🔑 Sign In',
} as const;

export type Tab = 'ingest' | 'search' | 'library' | 'account' | 'admin';
