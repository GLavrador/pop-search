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