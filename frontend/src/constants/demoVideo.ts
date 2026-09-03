import type { MyVideo, QuotaStatus, SearchResult, VideoMetadata } from '../types';

export const DEMO_QUERY = 'gato';

/** Chosen to show all three badges: one match by both routes, one by meaning alone, one by words alone. */
export const DEMO_SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'demo-1',
    titulo_video: 'Gatinho deitado lambendo planeta Terra e fazendo ela girar',
    descricao_completa:
      'Gato cinza e branco deitado, de olhos fechados, lambendo a Terra no meio do espaço.',
    url_original: 'https://x.com/VorosTwins/status/2085904884084478151/video/1',
    similarity: 0.78,
    text_rank: 0.91,
    score: 0.039,
  },
  {
    id: 'demo-2',
    titulo_video: 'Filhote de girafa girando incessantemente no zoológico',
    descricao_completa:
      'Um filhote de girafa gira sobre si mesmo repetidamente enquanto os visitantes riem.',
    url_original: 'https://x.com/exemplo/status/2',
    similarity: 0.62,
    text_rank: 0,
    score: 0.019,
  },
  {
    id: 'demo-3',
    titulo_video: 'Cachorro assustado com gato de pelúcia gigante',
    descricao_completa: 'Um cão recua devagar diante de um gato de pelúcia em tamanho real.',
    url_original: 'https://x.com/exemplo/status/3',
    similarity: 0,
    text_rank: 0.44,
    score: 0.018,
  },
];

/** A real analysis, captured so the tour can show the genuine output shape without spending a Gemini call. */
export const DEMO_VIDEO: VideoMetadata = {
  titulo_sugerido: 'Gatinho deitado lambendo planeta Terra e fazendo ela girar',
  descricao_completa:
    'Gato cinza e branco deitado, de olhos fechados, lambendo a Terra no meio do espaço. ' +
    'A Terra gira, brincando com o fato de que é o gato que é responsável pela rotação. É uma montagem.',
  url_original: 'https://x.com/VorosTwins/status/2085904884084478151/video/1',
  metadados_estruturados: {
    pessoas: [],
    elementos_cenario: ['Terra', 'Gato', 'Língua', 'Espaço'],
    audio: {
      transcricao: "I swear I'm over it (And then I smell your perfume)",
      musica: 'I Always Say I’m Leaving',
      artista: 'Olivia O’Brien',
    },
  },
};

const firstOfNextMonth = (): string => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
};

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/** Built on each call so the tour never shows a renewal date that has passed. */
export const demoQuotaStatus = (): QuotaStatus => ({
  used: 3,
  limit: 20,
  remaining: 17,
  resets_at: firstOfNextMonth(),
  tokens_this_month: 48210,
});

export const demoMyVideos = (): MyVideo[] => [
  {
    id: 'demo-1',
    titulo_video: DEMO_SEARCH_RESULTS[0].titulo_video,
    descricao_completa: DEMO_SEARCH_RESULTS[0].descricao_completa,
    url_original: DEMO_SEARCH_RESULTS[0].url_original,
    created_at: daysAgo(2),
  },
  {
    id: 'demo-2',
    titulo_video: DEMO_SEARCH_RESULTS[1].titulo_video,
    descricao_completa: DEMO_SEARCH_RESULTS[1].descricao_completa,
    url_original: DEMO_SEARCH_RESULTS[1].url_original,
    created_at: daysAgo(9),
  },
];
