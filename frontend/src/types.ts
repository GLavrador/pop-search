import type { SearchMode } from './constants/searchModes';

export interface Pessoa {
  descricao: string;
  papel: string | null;
}

export interface AudioInfo {
  transcricao: string;
  musica: string | null;
  artista: string | null;
}

export interface MetadadosEstruturados {
  pessoas: Pessoa[];
  elementos_cenario: string[];
  audio: AudioInfo;
}

/** What is kept of the post a video came from. Who posted it is not. */
export interface PostInfo {
  texto: string;
  miniatura: string | null;
}

export interface VideoMetadata {
  titulo_sugerido: string;
  descricao_completa: string;
  url_original?: string;
  metadados_estruturados: MetadadosEstruturados;
  post?: PostInfo | null;
}

export type AnalysisStage =
  | 'queued'
  | 'downloading'
  | 'uploading'
  | 'watching'
  | 'writing'
  | 'done'
  | 'failed';

export type RunningStage = Exclude<AnalysisStage, 'done' | 'failed'>;

/** The analysis a user has in hand: running, failed, or finished and unsaved. */
export interface AnalysisJob {
  id: string;
  url: string;
  stage: AnalysisStage;
  analyze_scenes: boolean;
  analyze_audio: boolean;
  result: VideoMetadata | null;
  error: { status: number; detail: string } | null;
  created_at: string;
}

export interface ExistingVideo {
  id: string;
  titulo_video?: string | null;
  url_original: string;
  created_at: string;
}

export interface SearchResult {
  id: string;
  titulo_video: string;
  descricao_completa?: string;
  url_original: string;
  /** Cosine similarity in [-1, 1]. 0 when the result came from full-text alone. */
  similarity: number;
  /** ts_rank_cd from the lexical branch. 0 when there was no text match. */
  text_rank?: number;
  /** Fused RRF score used for ordering. */
  score?: number;
  post?: PostInfo | null;
}

export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  resets_at: string;
  tokens_this_month: number;
}

export interface UserUsageRow {
  user_id: string;
  display_name: string;
  analyses: number;
  tokens: number;
  limit: number;
}

export interface FailureReason {
  reason: string;
  count: number;
}

export interface DailyPoint {
  date: string;
  analyses: number;
  tokens: number;
}

export interface AdminStatsReport {
  range_days: number;
  analyses: number;
  saves: number;
  tokens: number;
  avg_tokens: number;
  median_tokens: number;
  min_tokens: number;
  max_tokens: number;
  measured: number;
  failures: number;
  failure_rate: number;
  tokens_wasted: number;
  failures_by_reason: FailureReason[];
  daily: DailyPoint[];
  analyses_today: number;
  daily_limit: number;
  projected_tokens_at_limit: number;
  per_user: UserUsageRow[];
}

export interface ProjectUsageReport {
  rows: UserUsageRow[];
  analyses_today: number;
  daily_limit: number;
}

export interface MyVideo {
  id: string;
  titulo_video?: string;
  descricao_completa?: string;
  url_original: string;
  created_at: string;
  post?: PostInfo | null;
}

export interface SearchParams {
  query: string;
  limit?: number;
  threshold?: number;
  mode?: SearchMode;
}