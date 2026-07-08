// libs/ui/src/lib/cn.spec.ts

import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins standard class names', () => {
    expect(cn('inline-flex', 'items-center', 'justify-center')).toBe(
      'inline-flex items-center justify-center',
    );
  });

  it('ignores falsy class values', () => {
    expect(
      cn('inline-flex', false, null, undefined, '', 0, 'items-center'),
    ).toBe('inline-flex items-center');
  });

  it('supports conditional class names', () => {
    const isActive = true;
    const isDisabled = false;

    expect(
      cn(
        'button',
        isActive && 'button-active',
        isDisabled && 'button-disabled',
      ),
    ).toBe('button button-active');
  });

  it('supports nested arrays of class values', () => {
    expect(
      cn('flex', ['items-center', ['justify-center', false]], 'gap-2'),
    ).toBe('flex items-center justify-center gap-2');
  });

  it('supports object class values', () => {
    expect(
      cn('button', {
        'button-active': true,
        'button-disabled': false,
      }),
    ).toBe('button button-active');
  });

  it('resolves conflicting Tailwind padding utilities', () => {
    expect(cn('px-3 py-2', 'px-5')).toBe('py-2 px-5');
  });

  it('resolves conflicting Tailwind text-size utilities', () => {
    expect(cn('text-sm font-medium', 'text-base')).toBe(
      'font-medium text-base',
    );
  });

  it('resolves conflicting Tailwind display utilities', () => {
    expect(cn('inline-flex items-center', 'flex')).toBe('items-center flex');
  });

  it('preserves responsive utilities independently', () => {
    expect(cn('px-3 md:px-4', 'px-5')).toBe('md:px-4 px-5');
  });

  it('preserves custom class names', () => {
    expect(cn('custom-button', 'custom-button--active')).toBe(
      'custom-button custom-button--active',
    );
  });

  it('returns an empty string when no class values are provided', () => {
    expect(cn()).toBe('');
  });
});
