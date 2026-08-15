// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import {
  aerealithMdxComponents,
  getMDXComponents,
  useMDXComponents,
} from './mdx-components';

function component(
  name: keyof typeof aerealithMdxComponents,
): ComponentType<any> {
  return aerealithMdxComponents[name] as ComponentType<any>;
}

describe('documentation MDX components', () => {
  it('secures external links and preserves internal navigation semantics', () => {
    const Anchor = component('a');
    const { rerender } = render(
      <Anchor href="https://example.com">External</Anchor>,
    );

    const external = screen.getByRole('link', { name: 'External' });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');
    expect(external.dataset['external']).toBe('true');

    rerender(
      <Anchor href="http://example.com" rel="author noopener" target="_blank">
        Related
      </Anchor>,
    );
    expect(
      screen.getByRole('link', { name: 'Related' }).getAttribute('rel'),
    ).toBe('author noopener noreferrer');

    rerender(
      <Anchor href="/documentation" rel="bookmark" target="_self">
        Internal
      </Anchor>,
    );
    const internal = screen.getByRole('link', { name: 'Internal' });
    expect(internal.getAttribute('target')).toBe('_self');
    expect(internal.getAttribute('rel')).toBe('bookmark');
    expect(internal.hasAttribute('data-external')).toBe(false);
  });

  it('distinguishes inline and fenced code and wraps generated tables', () => {
    const Code = component('code');
    const Pre = component('pre');
    const Table = component('table');

    const { container } = render(
      <>
        <Code data-inline="true">const value = 1</Code>
        <Pre data-language="ts">
          <Code className="language-ts">const block = true</Code>
        </Pre>
        <Table>
          <tbody>
            <tr>
              <td>cell</td>
            </tr>
          </tbody>
        </Table>
      </>,
    );

    expect(container.querySelector('[data-inline="true"]')).toBeTruthy();
    expect(container.querySelector('pre code.language-ts')?.textContent).toBe(
      'const block = true',
    );
    expect(container.querySelector('table td')?.textContent).toBe('cell');
  });

  it('applies safe image defaults while respecting explicit values', () => {
    const Image = component('img');
    const { container, rerender } = render(<Image src="/diagram.png" />);
    let image = container.querySelector('img')!;
    expect(image.getAttribute('alt')).toBe('');
    expect(image.getAttribute('decoding')).toBe('async');
    expect(image.getAttribute('loading')).toBe('lazy');

    rerender(
      <Image
        src="/diagram.png"
        alt="Architecture"
        decoding="sync"
        loading="eager"
      />,
    );
    image = screen.getByRole('img', { name: 'Architecture' });
    expect(image.getAttribute('decoding')).toBe('sync');
    expect(image.getAttribute('loading')).toBe('eager');
  });

  it('renders the documentation callout conveniences and API children', () => {
    const Requirement = component('Requirement');
    const Warning = component('Warning');
    const SecurityNote = component('SecurityNote');
    const ArchitectureDecision = component('ArchitectureDecision');
    const ApiEndpoint = component('ApiEndpoint');

    render(
      <>
        <Requirement>Required content</Requirement>
        <Requirement title="Custom requirement">Custom content</Requirement>
        <Warning title="Warning title">Warning content</Warning>
        <SecurityNote>Secure content</SecurityNote>
        <SecurityNote title="Custom security">
          Custom secure content
        </SecurityNote>
        <ArchitectureDecision>Decision content</ArchitectureDecision>
        <ArchitectureDecision title="ADR-1">
          Custom decision
        </ArchitectureDecision>
        <ApiEndpoint method="GET" path="/v1/users">
          Endpoint details
        </ApiEndpoint>
      </>,
    );

    for (const text of [
      'Requirement',
      'Custom requirement',
      'Warning title',
      'Security note',
      'Custom security',
      'Architecture decision',
      'ADR-1',
      'Endpoint details',
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('returns a complete overridable component map through both exports', () => {
    const Override = () => <p>Override</p>;
    const components = getMDXComponents({ Mermaid: Override });

    expect(components['a']).toBe(aerealithMdxComponents.a);
    expect(components['Mermaid']).toBe(Override);
    expect(useMDXComponents()).toMatchObject(aerealithMdxComponents);
  });
});
