import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewForm } from './index';
import type { VideoMetadata } from '../../types';
import { vi } from 'vitest'; 

const mockData: VideoMetadata = {
  titulo_sugerido: 'Original Title',
  descricao_completa: 'Original detailed description of the video content.',
  url_original: 'http://twitter.com/video',
  metadados_estruturados: {
    pessoas: [{ descricao: 'Person A', papel: null }],
    elementos_cenario: ['Tree', 'Building'],
    audio: {
      transcricao: 'Lalalala',
      musica: null,
      artista: null,
    },
    tags_busca: ['tag1', 'tag2']
  }
};

describe('ReviewForm Component', () => {
  it('should render initial values correctly', () => {
    render(<ReviewForm initialData={mockData} onSave={() => {}} onCancel={() => {}} />);
    
    expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('tag1,tag2')).toBeInTheDocument();
  });

  it('should convert comma-separated strings back to arrays on submit', async () => {
    const handleSaveMock = vi.fn();

    render(<ReviewForm initialData={mockData} onSave={handleSaveMock} onCancel={() => {}} />);

    const tagsInput = screen.getByDisplayValue('tag1,tag2');
    fireEvent.change(tagsInput, { target: { value: 'react, testing' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSaveMock).toHaveBeenCalledWith(expect.objectContaining({
        metadados_estruturados: expect.objectContaining({
          tags_busca: ['react', 'testing']
        })
      }));
    });
  });
});