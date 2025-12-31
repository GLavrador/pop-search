import type { VideoMetadata } from '../types';
import type { VideoMetadataForm } from '../schemas/videoMetadata';

export const transformFormDataToMetadata = (formData: VideoMetadataForm): VideoMetadata => {
  const meta = formData.metadados_estruturados;

  return {
    ...formData,
    metadados_estruturados: {
      ...meta,
      tags_busca: meta.tags_busca
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      elementos_cenario: meta.elementos_cenario
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    }
  };
};