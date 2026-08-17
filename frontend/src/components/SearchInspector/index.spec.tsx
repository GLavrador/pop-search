import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { SearchInspector } from './index';
import type { SearchExplain } from '../../types';

const RRF_K = 50;

// B leads neither branch and still wins the fusion. That is the behaviour the
// panel exists to make visible.
const explain: SearchExplain = {
  query: 'banda',
  mode: 'hybrid',
  threshold: 0.6,
  rrf_k: RRF_K,
  semantic: [
    { id: 'A', titulo_video: 'Gato laranja dormindo', position: 1, value: 0.91 },
    { id: 'B', titulo_video: 'Banda tocando ao vivo', position: 2, value: 0.72 },
  ],
  text: [
    { id: 'B', titulo_video: 'Banda tocando ao vivo', position: 1, value: 1.4 },
    { id: 'C', titulo_video: 'Show da banda', position: 2, value: 0.9 },
  ],
  fused: [
    {
      id: 'B', titulo_video: 'Banda tocando ao vivo', url_original: 'http://x.com/b',
      position: 1, score: 1 / (RRF_K + 2) + 1 / (RRF_K + 1), similarity: 0.72, text_rank: 1.4,
      semantic_position: 2, semantic_contribution: 1 / (RRF_K + 2),
      text_position: 1, text_contribution: 1 / (RRF_K + 1),
    },
    {
      id: 'A', titulo_video: 'Gato laranja dormindo', url_original: 'http://x.com/a',
      position: 2, score: 1 / (RRF_K + 1), similarity: 0.91, text_rank: 0,
      semantic_position: 1, semantic_contribution: 1 / (RRF_K + 1),
      text_position: null, text_contribution: 0,
    },
  ],
};

const mathPanel = () => screen.getByText('The arithmetic for this video').parentElement as HTMLElement;

describe('SearchInspector', () => {
  it('should lay out both branch rankings and the fused one', () => {
    render(<SearchInspector explain={explain} />);

    expect(screen.getAllByText('By meaning').length).toBeGreaterThan(0);
    expect(screen.getAllByText('By words').length).toBeGreaterThan(0);
    expect(screen.getByText('Final result')).toBeInTheDocument();

    // Semantic column and fused column, never the lexical one: found by
    // meaning alone.
    expect(screen.getAllByText('Gato laranja dormindo')).toHaveLength(2);

    // Lexical only, so it never reaches the fused column at this limit.
    expect(screen.getByText('Show da banda')).toBeInTheDocument();

    // Both branches, the fusion, and the arithmetic panel that opens on it.
    expect(screen.getAllByText('Banda tocando ao vivo')).toHaveLength(4);
  });

  it('should show the arithmetic of the winning result by default', () => {
    render(<SearchInspector explain={explain} />);

    const panel = mathPanel();
    expect(within(panel).getByText(`1 / (${RRF_K} + 2) = 0.019231`)).toBeInTheDocument();
    expect(within(panel).getByText(`1 / (${RRF_K} + 1) = 0.019608`)).toBeInTheDocument();
    expect(within(panel).getByText('0.038839')).toBeInTheDocument();
  });

  it('should switch the arithmetic to whichever result is hovered', async () => {
    const user = userEvent.setup();
    render(<SearchInspector explain={explain} />);

    await user.hover(screen.getByRole('button', { name: /Gato laranja dormindo/ }));

    const panel = mathPanel();
    expect(within(panel).getByText('Gato laranja dormindo')).toBeInTheDocument();
    expect(within(panel).getByText(`1 / (${RRF_K} + 1) = 0.019608`)).toBeInTheDocument();
    expect(within(panel).getByText('did not appear in this search')).toBeInTheDocument();
  });

  it('should not invent a contribution for a branch that never matched', async () => {
    const user = userEvent.setup();
    render(<SearchInspector explain={explain} />);

    await user.hover(screen.getByRole('button', { name: /Gato laranja dormindo/ }));

    const panel = mathPanel();
    const total = within(panel).getByText('Fused score').nextElementSibling;

    expect(total).toHaveTextContent('0.019608');
  });
});
