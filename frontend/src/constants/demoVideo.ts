import type { PostInfo, VideoMetadata, SearchResult } from '../types';

export const DEMO_QUERY = 'gato';

const DEMO_POST: PostInfo = {
  texto: 'Thanks kitty!',
  miniatura:
    'https://pbs.twimg.com/amplify_video_thumb/2085904873753919488/img/YAHX7d_oRH4ppPeX.jpg?name=small',
};

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
    score: 0.0392,
    post: DEMO_POST,
    vector_position: 1,
    text_position: 1,
    fusion_k: 50,
    matched:
      'planeta Terra e fazendo ela girar | <<Gato>> cinza e branco deitado, de olhos fechados',
  },
  {
    id: 'demo-2',
    titulo_video: 'Filhote de girafa girando incessantemente no zoológico',
    descricao_completa:
      'Um filhote de girafa gira sobre si mesmo repetidamente enquanto os visitantes riem.',
    url_original: 'https://x.com/exemplo/status/2',
    similarity: 0.62,
    text_rank: 0,
    score: 0.0192,
    vector_position: 2,
    text_position: null,
    fusion_k: 50,
    matched: null,
  },
  {
    id: 'demo-3',
    titulo_video: 'Cachorro assustado com gato de pelúcia gigante',
    descricao_completa: 'Um cão recua devagar diante de um gato de pelúcia em tamanho real.',
    url_original: 'https://x.com/exemplo/status/3',
    similarity: 0,
    text_rank: 0.44,
    score: 0.0192,
    vector_position: null,
    text_position: 2,
    fusion_k: 50,
    matched:
      'Cachorro assustado com <<gato>> de pelúcia gigante | Um cão recua devagar diante de um <<gato>> de pelúcia',
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
  post: DEMO_POST,
};
