import type { VideoMetadata } from '../types';

// may need better approach
export const transformFormDataToMetadata = (formData: VideoMetadata): VideoMetadata => {
  return {
    ...formData,
    metadados_visuais: {
      ...formData.metadados_visuais,
      pessoas: typeof formData.metadados_visuais.pessoas === 'string'
        ? (formData.metadados_visuais.pessoas as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : formData.metadados_visuais.pessoas,
    },
    tags_busca: typeof formData.tags_busca === 'string'
      ? (formData.tags_busca as string).split(',').map((s: string) => s.trim()).filter(Boolean)
      : formData.tags_busca
  };
};