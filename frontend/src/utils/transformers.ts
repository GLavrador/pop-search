import type { VideoMetadata } from '../types';

export const transformFormDataToMetadata = (formData: VideoMetadata): VideoMetadata => {
  const meta = formData.metadados_estruturados;

  return {
    ...formData,
    metadados_estruturados: {
      ...meta,
      tags_busca: typeof meta.tags_busca === 'string'
        ? (meta.tags_busca as unknown as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : meta.tags_busca,
      elementos_cenario: typeof meta.elementos_cenario === 'string'
        ? (meta.elementos_cenario as unknown as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : meta.elementos_cenario,
    }
  };
};