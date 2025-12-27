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
  tags_busca: string[];
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
  resumo?: string; // dados antigos
  url_original: string;
  similarity: number;
}

export interface SearchParams {
  query: string;
  limit?: number;
  threshold?: number;
}