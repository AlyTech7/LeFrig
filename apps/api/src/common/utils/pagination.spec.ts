import { describe, it, expect } from 'vitest';
import { paginate } from './pagination';

describe('paginate', () => {
  it('returns correct meta', () => {
    const result = paginate([1, 2], 10, 1, 2);
    expect(result.meta.total).toBe(10);
    expect(result.meta.totalPages).toBe(5);
    expect(result.data).toHaveLength(2);
  });
});
