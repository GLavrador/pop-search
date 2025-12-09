import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewForm } from './index';
import type { VideoMetadata } from '../../types';
import { vi } from 'vitest'; 

const mockData: VideoMetadata = {
  titulo_sugerido: 'Original Title',
  resumo: 'Original Summary',
  url_original: 'http://twitter.com/video',
  metadados_visuais: {
    pessoas: ['Person A'],
    elementos_cenario: ['Tree'],
    contexto: 'Outdoor',
  },
  metadados_audio: {
    transcricao_trecho: 'Lalalala',
    musica_identificada: null,
    artista: null,
  },
  tags_busca: ['tag1'],
  sentimento: 'neutral'
};

describe('ReviewForm Component', () => {
  it('should render initial values correctly', () => {
    render(<ReviewForm initialData={mockData} onSave={() => {}} onCancel={() => {}} />);
    
    expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('tag1')).toBeInTheDocument();
  });

  it('should convert comma-separated strings back to arrays on submit', () => {
    const handleSaveMock = vi.fn();

    render(<ReviewForm initialData={mockData} onSave={handleSaveMock} onCancel={() => {}} />);

    const tagsInput = screen.getByDisplayValue('tag1');
    fireEvent.change(tagsInput, { target: { value: 'react, testing' } });

    const saveButton = screen.getByText('Confirm & Save');
    fireEvent.click(saveButton);

    expect(handleSaveMock).toHaveBeenCalledWith(expect.objectContaining({
      tags_busca: ['react', 'testing']
    }));
  });
});