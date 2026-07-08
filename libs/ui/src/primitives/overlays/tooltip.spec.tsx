// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
describe('Tooltip', () => {
  it('appears on focus', () => {
    render(
      <Tooltip>
        <TooltipTrigger>
          <button>Help</button>
        </TooltipTrigger>
        <TooltipContent>Details</TooltipContent>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByText('Help'));
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });
});
