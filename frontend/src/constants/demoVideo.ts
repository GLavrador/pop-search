import type { VideoMetadata } from '../types';

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
