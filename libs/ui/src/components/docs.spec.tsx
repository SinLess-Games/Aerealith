// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DocsApiEndpoint,
  DocsBadge,
  DocsCallout,
  DocsCard,
  DocsCardGrid,
  DocsCodeBlock,
  DocsDetails,
  DocsFigure,
  DocsInlineCode,
  DocsKeyboardKey,
  DocsLinkCard,
  DocsProse,
  DocsSteps,
  DocsTable,
  DocsTabs,
} from './docs';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('documentation components', () => {
  it('renders the static documentation building blocks and optional content', () => {
    render(
      <DocsProse data-testid="prose" className="custom-prose">
        <DocsCallout variant="security">Protect credentials</DocsCallout>
        <DocsCallout title="Custom title">Custom body</DocsCallout>
        <DocsCard
          title="Card title"
          description="Card description"
          footer="Card footer"
        >
          Card body
        </DocsCard>
        <DocsCardGrid data-testid="grid">Grid content</DocsCardGrid>
        <DocsLinkCard
          href="/next"
          title="Next guide"
          description="Continue learning"
          icon="★"
        >
          Five minutes
        </DocsLinkCard>
        <DocsSteps>
          <li>First step</li>
        </DocsSteps>
        <DocsInlineCode>const value = true</DocsInlineCode>
        <DocsTable>
          <table>
            <tbody>
              <tr>
                <td>Cell</td>
              </tr>
            </tbody>
          </table>
        </DocsTable>
        <DocsFigure caption="Architecture diagram">Diagram</DocsFigure>
        <DocsDetails summary="More details">Hidden details</DocsDetails>
        <DocsKeyboardKey>Enter</DocsKeyboardKey>
        <DocsApiEndpoint method="POST" path="/v1/projects" />
        <DocsBadge variant="success">Stable</DocsBadge>
      </DocsProse>,
    );

    expect(screen.getByTestId('prose').className).toContain('custom-prose');
    expect(screen.getByText('Security')).toBeTruthy();
    expect(screen.getByText('Custom title')).toBeTruthy();
    expect(screen.getByText('Card footer')).toBeTruthy();
    expect(screen.getByTestId('grid').textContent).toBe('Grid content');
    expect(screen.getByRole('link', { name: /next guide/i })).toHaveProperty(
      'pathname',
      '/next',
    );
    expect(screen.getByText('Architecture diagram')).toBeTruthy();
    expect(screen.getByText('/v1/projects')).toBeTruthy();
    expect(screen.getByText('Stable').getAttribute('data-variant')).toBe(
      'success',
    );
  });

  it('copies code, supports hidden chrome, and resets its announcement', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { rerender } = render(
      <DocsCodeBlock filename="example.ts" language="ts" code="const id = 1" />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('const id = 1');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();

    rerender(<DocsCodeBlock showCopyButton={false}>plain text</DocsCodeBlock>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('plain text')).toBeTruthy();

    vi.useRealTimers();
  });

  it('changes tabs, falls back from an unknown default, and handles no items', async () => {
    const { rerender } = render(
      <DocsTabs
        defaultValue="missing"
        items={[
          { value: 'one', label: 'One', content: 'First panel' },
          { value: 'two', label: 'Two', content: 'Second panel' },
        ]}
      />,
    );

    expect(screen.getByRole('tabpanel').textContent).toBe('First panel');
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    await waitFor(() => {
      expect(screen.getByRole('tabpanel').textContent).toBe('Second panel');
    });

    rerender(<DocsTabs items={[]} />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});
