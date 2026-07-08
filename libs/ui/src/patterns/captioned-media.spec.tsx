// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaptionedMedia } from './captioned-media';
describe('CaptionedMedia', () => {
  it('associates a caption with media', () => {
    render(
      <CaptionedMedia caption="Nebula">
        <img alt="Sky" />
      </CaptionedMedia>,
    );
    expect(screen.getByText('Nebula').tagName).toBe('FIGCAPTION');
  });
});
