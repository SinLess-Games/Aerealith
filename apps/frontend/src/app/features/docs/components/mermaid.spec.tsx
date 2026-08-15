// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Mermaid } from './mermaid';

const mermaidMock = vi.hoisted(() => ({
  bindFunctions: vi.fn(),
  initialize: vi.fn(),
  parse: vi.fn<() => Promise<void>>(),
  render: vi.fn(),
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: mermaidMock.initialize,
    parse: mermaidMock.parse,
    render: mermaidMock.render,
  },
}));

function installMatchMedia(matches = false) {
  const listeners = new Set<() => void>();
  const mediaQuery = {
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.add(listener);
    }),
    matches,
    media: '(prefers-color-scheme: dark)',
    removeEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.delete(listener);
    }),
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQuery),
  );
  return { listeners, mediaQuery };
}

describe('Mermaid', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
    installMatchMedia();
    mermaidMock.bindFunctions.mockReset();
    mermaidMock.initialize.mockReset();
    mermaidMock.parse.mockReset().mockResolvedValue(undefined);
    mermaidMock.render.mockReset().mockResolvedValue({
      bindFunctions: mermaidMock.bindFunctions,
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g /></svg>',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders an accessible diagram using the resolved Aerealith theme', async () => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.setProperty('--ae-accent', '#123456');

    const { container, unmount } = render(
      <Mermaid
        chart={'graph TD; A-->B\\nB-->C'}
        title="Request flow"
        description="A request reaches the service"
        caption="Runtime request flow"
        className="custom-diagram"
      />,
    );

    const figure = container.querySelector('figure');
    await waitFor(() => expect(figure?.dataset['status']).toBe('ready'));

    expect(mermaidMock.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        securityLevel: 'strict',
        startOnLoad: false,
        theme: 'base',
        themeVariables: expect.objectContaining({
          lineColor: '#123456',
          background: '#090b12',
        }),
      }),
    );
    expect(mermaidMock.parse).toHaveBeenCalledWith('graph TD; A-->B\nB-->C');
    expect(mermaidMock.render).toHaveBeenCalledWith(
      expect.stringMatching(/^aerealith-mermaid-/),
      'graph TD; A-->B\nB-->C',
    );

    const svg = container.querySelector(
      '[data-slot="docs-mermaid-content"] svg',
    );
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.getAttribute('aria-label')).toBe(
      'Request flow. A request reaches the service',
    );
    expect(svg?.getAttribute('style')).toContain('max-width: 100%');
    expect(mermaidMock.bindFunctions).toHaveBeenCalled();
    expect(screen.getByText('Runtime request flow')).toBeTruthy();
    expect(screen.getByText('Mermaid diagram rendered.')).toBeTruthy();

    unmount();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    expect(mediaQuery.removeEventListener).toHaveBeenCalled();
  });

  it('copies normalized source and restores the button label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { container } = render(<Mermaid chart={'graph TD; A\\nB'} />);
    await waitFor(() =>
      expect(container.querySelector('figure')?.dataset['status']).toBe(
        'ready',
      ),
    );

    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy source/i }));
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('graph TD; A\nB');
    expect(screen.getByRole('button', { name: /copied/i })).toBeTruthy();

    await act(async () => vi.advanceTimersByTimeAsync(1_500));
    expect(screen.getByRole('button', { name: /copy source/i })).toBeTruthy();
  });

  it('downloads the rendered SVG with a safe filename', async () => {
    const createObjectURL = vi.fn(() => 'blob:diagram');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    const { container } = render(
      <Mermaid chart="graph TD; A-->B" title="  API / Request Flow!  " />,
    );
    await waitFor(() =>
      expect(container.querySelector('figure')?.dataset['status']).toBe(
        'ready',
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: /download svg/i }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:diagram');
  });

  it('shows empty-source and Mermaid parser failures with optional source', async () => {
    const { rerender } = render(<Mermaid chart="   " showToolbar={false} />);

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Unable to render Mermaid diagram',
    );
    expect(
      screen.getByText('The Mermaid diagram does not contain any source.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Mermaid diagram could not be rendered.'),
    ).toBeTruthy();

    mermaidMock.parse.mockRejectedValueOnce(new Error('Unexpected token'));
    rerender(<Mermaid chart="broken chart" showSourceOnError />);

    expect(await screen.findByText('Unexpected token')).toBeTruthy();
    expect(screen.getByText('broken chart')).toBeTruthy();
  });

  it.each([
    ['<not-svg />', 'Mermaid did not return an SVG diagram.'],
    ['<svg', 'Mermaid returned invalid SVG output.'],
  ])('rejects invalid rendered markup %s', async (svg, message) => {
    mermaidMock.render.mockResolvedValueOnce({ svg });
    render(<Mermaid chart="graph TD; A-->B" showSourceOnError={false} />);

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText('Mermaid source')).toBeNull();
  });

  it('handles unavailable and rejected clipboard writes without changing state', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    const { container, rerender } = render(<Mermaid chart="graph TD; A-->B" />);
    await waitFor(() =>
      expect(container.querySelector('figure')?.dataset['status']).toBe(
        'ready',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /copy source/i }));
    expect(screen.queryByRole('button', { name: /copied/i })).toBeNull();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    rerender(<Mermaid chart="graph TD; A-->C" />);
    await waitFor(() =>
      expect(container.querySelector('figure')?.dataset['status']).toBe(
        'ready',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /copy source/i }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /copied/i })).toBeNull(),
    );
  });

  it('preserves Mermaid-provided accessibility metadata and responds to theme changes', async () => {
    const { listeners } = installMatchMedia(true);
    mermaidMock.render.mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg" aria-labelledby="title" style="color: red"><title id="title">Existing title</title></svg>',
    });
    const { container } = render(<Mermaid chart="graph TD; A-->B" />);
    await waitFor(() =>
      expect(container.querySelector('figure')?.dataset['status']).toBe(
        'ready',
      ),
    );

    const svg = container.querySelector(
      '[data-slot="docs-mermaid-content"] svg',
    );
    expect(svg?.hasAttribute('aria-label')).toBe(false);
    expect(svg?.getAttribute('style')).toContain('color: red');

    document.documentElement.dataset.theme = 'light';
    act(() => {
      for (const listener of listeners) listener();
    });
    await waitFor(() =>
      expect(mermaidMock.initialize).toHaveBeenCalledTimes(2),
    );
  });
});
