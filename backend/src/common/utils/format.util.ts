import { randomUUID } from 'crypto';

/**
 * Format a numeric amount as Vietnamese Dong.
 * Example: 28990000 → "28.990.000 ₫"
 */
export function formatVND(amount: number): string {
  return (
    new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' ₫'
  );
}

/**
 * Generate a unique order number.
 * Format: VN + 13-digit timestamp + 4 random digits
 * Example: "VN16832100000001234"
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `VN${timestamp}${random}`;
}

/**
 * Generate a cryptographically random session token (UUID v4).
 */
export function generateSessionToken(): string {
  return randomUUID();
}
