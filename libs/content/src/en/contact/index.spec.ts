import { describe, expect, it } from 'vitest';
import {
  ContactDescription,
  ContactHeader,
  ContactImage,
  contactOptions,
} from '.';

describe('contact content', () => {
  it('provides labeled contact actions', () => {
    expect(ContactHeader).toBeTruthy();
    expect(ContactDescription).toBeTruthy();
    expect(ContactImage).toMatch(/^\/images\//);
    expect(
      contactOptions.every(
        (option) => option.title && option.href && option.buttonText,
      ),
    ).toBe(true);
  });
});
