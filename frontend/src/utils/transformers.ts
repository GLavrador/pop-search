import type { VideoMetadata } from '../types';
import type { VideoMetadataForm } from '../schemas/videoMetadata';

export const transformFormDataToMetadata = (formData: VideoMetadataForm): VideoMetadata => {
  const meta = formData.metadados_estruturados;

  return {
    ...formData,
    metadados_estruturados: {
      ...meta,
      elementos_cenario: meta.elementos_cenario
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    }
  };
};