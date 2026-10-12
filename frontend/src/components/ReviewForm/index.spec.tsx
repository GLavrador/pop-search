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

  describe('the text of the post', () => {
    const post = { texto: 'dia de meia maluca', miniatura: 'https://pbs.twimg.com/a.jpg' };
    const field = () => screen.getByLabelText(/Text of the post/);

    const saved = async (initialData: VideoMetadata) => {
      const handleSaveMock = vi.fn().mockResolvedValue(undefined);
      render(<ReviewForm initialData={initialData} onSave={handleSaveMock} onCancel={() => {}} />);
      return {
        save: async () => {
          fireEvent.click(screen.getByText('Save'));
          await waitFor(() => expect(handleSaveMock).toHaveBeenCalled());
          return handleSaveMock.mock.calls[0][0].post;
        },
      };
    };

    it('should come as a field, and be kept as it was when nobody touches it', async () => {
      const { save } = await saved({ ...mockData, post });

      expect(field()).toHaveValue('dia de meia maluca');
      expect(await save()).toEqual(post);
    });

    it('should be kept the way it was rewritten', async () => {
      const { save } = await saved({ ...mockData, post });

      fireEvent.change(field(), { target: { value: '  meia maluca na escola  ' } });

      expect(await save()).toEqual({ ...post, texto: 'meia maluca na escola' });
    });

    it('should stay out of the video when it is cleared, without losing the picture', async () => {
      const { save } = await saved({ ...mockData, post });

      fireEvent.change(field(), { target: { value: '' } });

      expect(await save()).toEqual({ texto: '', miniatura: post.miniatura });
    });

    it('should be offered empty for a video that came without a post', async () => {
      const { save } = await saved(mockData);

      expect(field()).toHaveValue('');
      expect(await save()).toEqual({ texto: '', miniatura: null });
    });

    it('should never show who posted', () => {
      const withAccount = { ...post, autor: 'larissa', usuario: 'ilfillorosso' };

      render(<ReviewForm initialData={{ ...mockData, post: withAccount }} onSave={async () => {}} onCancel={() => {}} />);

      expect(screen.queryByText(/larissa|ilfillorosso/)).not.toBeInTheDocument();
    });
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