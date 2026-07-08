import { describe, expect, it } from 'vitest';
import { AerealithStyleOrder, AerealithStyles } from './index';
describe('AerealithStyles', () => {
  it('exports every stylesheet in loading order', () => {
    expect(AerealithStyleOrder).toHaveLength(
      Object.keys(AerealithStyles).length,
    );
    expect(AerealithStyles).toHaveProperty('reducedMotion');
  });
});
