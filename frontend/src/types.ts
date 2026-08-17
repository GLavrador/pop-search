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

export interface VideoMetadata {
  titulo_sugerido: string;
  descricao_completa: string;
  url_original?: string;
  metadados_estruturados: MetadadosEstruturados;
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
}

export interface RankedEntry {
  id: string;
  titulo_video: string;
  /** 1-based rank inside this branch alone. */
  position: number;
  /** Cosine similarity or ts_rank_cd, depending on the branch. */
  value: number;
}

export interface FusionRow {
  id: string;
  titulo_video: string;
  url_original: string;
  position: number;
  score: number;
  similarity: number;
  text_rank: number;
  semantic_position: number | null;
  semantic_contribution: number;
  text_position: number | null;
  text_contribution: number;
}

export interface SearchExplain {
  query: string;
  mode: SearchMode;
  threshold: number;
  rrf_k: number;
  semantic: RankedEntry[];
  text: RankedEntry[];
  fused: FusionRow[];
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
}

export interface SearchParams {
  query: string;
  limit?: number;
  threshold?: number;
  mode?: SearchMode;
}