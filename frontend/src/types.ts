export interface VideoMetadata {
  titulo_sugerido: string;
  resumo: string;
  url_original?: string; 
  metadados_visuais: {
    pessoas: string[];
    elementos_cenario: string[];
    contexto: string;
  };
  metadados_audio: {
    transcricao_trecho: string;
    musica_identificada: string | null;
    artista: string | null;
  };
  tags_busca: string[];
  sentimento: string;
}

export interface SearchResult {
  id: string;
  titulo_video: string;
  resumo: string;
  similarity: number;
}

export interface SearchParams {
  query: string;
  limit?: number;
  threshold?: number;
}