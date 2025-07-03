import { describe, it, expect } from 'vitest';

describe('Test Environment', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async tests', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});