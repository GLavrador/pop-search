import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewForm } from './index';
import type { VideoMetadata } from '../../types';
import { vi } from 'vitest'; 

const mockData: VideoMetadata = {
  titulo_sugerido: 'Original Title With Five Words Here',
  descricao_completa: 'This is a very detailed description of the video content that contains more than twenty words to pass the validation requirement set by Zod schema.',
  url_original: 'http://twitter.com/video',
  metadados_estruturados: {
    pessoas: [{ descricao: 'Person A', papel: null }],
    elementos_cenario: ['Tree', 'Building'],
    audio: {
      transcricao: 'Lalalala',
      musica: null,
      artista: null,
    }
  }
};

describe('ReviewForm Component', () => {
  it('should render initial values correctly', () => {
    render(<ReviewForm initialData={mockData} onSave={async () => {}} onCancel={() => {}} />);
    
    expect(screen.getByDisplayValue('Original Title With Five Words Here')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tree, Building')).toBeInTheDocument();
  });

  it('should convert comma-separated strings back to arrays on submit', async () => {
    const handleSaveMock = vi.fn().mockResolvedValue(undefined);

    render(<ReviewForm initialData={mockData} onSave={handleSaveMock} onCancel={() => {}} />);

    const tagsInput = screen.getByDisplayValue('Tree, Building');
    fireEvent.change(tagsInput, { target: { value: 'Tree, Building, Car, Road' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSaveMock).toHaveBeenCalledWith(expect.objectContaining({
        metadados_estruturados: expect.objectContaining({
          elementos_cenario: ['Tree', 'Building', 'Car', 'Road']
        })
      }));
    });
  });
});