// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

function ExampleTabs() {
  return (
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three">Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First</TabsContent>
      <TabsContent value="two">Second</TabsContent>
      <TabsContent value="three">Third</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('switches panels and connects the selected tab with its panel', () => {
    render(<ExampleTabs />);

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    const tab = screen.getByRole('tab', { name: 'Two' });
    const panel = screen.getByRole('tabpanel');
    expect(screen.getByText('Second')).toBeTruthy();
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  it('uses roving focus for horizontal Arrow keys and Home/End', () => {
    render(<ExampleTabs />);
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });
    const three = screen.getByRole('tab', { name: 'Three' });

    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(two);
    expect(two.getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(two, { key: 'End' });
    expect(document.activeElement).toBe(three);
    fireEvent.keyDown(three, { key: 'Home' });
    expect(document.activeElement).toBe(one);
    fireEvent.keyDown(one, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(three);
  });
});
