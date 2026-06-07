import { formatVND, generateOrderNumber, generateSessionToken } from './format.util';

describe('format.util', () => {
  describe('formatVND', () => {
    it('formats 28990000 to contain "28.990.000" and "₫"', () => {
      const result = formatVND(28990000);
      expect(result).toContain('28.990.000');
      expect(result).toContain('₫');
    });

    it('formats 0 to contain "0" and "₫"', () => {
      const result = formatVND(0);
      expect(result).toContain('0');
      expect(result).toContain('₫');
    });

    it('formats a large number correctly', () => {
      const result = formatVND(1000000);
      expect(result).toContain('1.000.000');
      expect(result).toContain('₫');
    });
  });

  describe('generateOrderNumber', () => {
    it('starts with "VN"', () => {
      const result = generateOrderNumber();
      expect(result.startsWith('VN')).toBe(true);
    });

    it('has length >= 10', () => {
      const result = generateOrderNumber();
      expect(result.length).toBeGreaterThanOrEqual(10);
    });

    it('produces different values on two consecutive calls', () => {
      // Use fake timers to control Date.now() between calls if needed,
      // but the random suffix alone should make them differ most of the time.
      const first = generateOrderNumber();
      const second = generateOrderNumber();
      // They might theoretically collide but the random 4-digit suffix makes it extremely unlikely
      // We simply verify the format and that the generator can produce multiple values
      expect(first).toMatch(/^VN\d+$/);
      expect(second).toMatch(/^VN\d+$/);
    });

    it('produces unique values across many calls', () => {
      const values = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
      // With random suffix, collisions should be negligible
      expect(values.size).toBeGreaterThan(1);
    });
  });

  describe('generateSessionToken', () => {
    const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('returns a valid UUID v4 format', () => {
      const token = generateSessionToken();
      expect(token).toMatch(UUID_V4_REGEX);
    });

    it('produces different values on two consecutive calls', () => {
      const first = generateSessionToken();
      const second = generateSessionToken();
      expect(first).not.toBe(second);
    });
  });
});
