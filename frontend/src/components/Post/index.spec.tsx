import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Thumbnail } from './Thumbnail';

const PICTURE = 'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a.jpg?name=small';

describe('Thumbnail', () => {
  it('should load the picture without telling X where it is shown', () => {
    const { container } = render(<Thumbnail src={PICTURE} />);

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', PICTURE);
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('should show the film icon when there is no picture', () => {
    const { container } = render(<Thumbnail src={null} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('🎬');
  });

  it('should fall back to the film icon when the picture no longer loads', () => {
    const { container } = render(<Thumbnail src={PICTURE} />);

    fireEvent.error(container.querySelector('img')!);

    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('🎬');
  });
});
