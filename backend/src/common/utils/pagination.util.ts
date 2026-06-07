import { PaginatedResult } from '../types';

/**
 * Slice an in-memory array into a paginated result.
 *
 * For database queries, apply LIMIT/OFFSET at the query level instead and
 * pass the raw rows + total count directly to avoid loading all records.
 */
export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.floor(limit));
  const total = items.length;
  const totalPages = Math.ceil(total / safeLimit);
  const offset = (safePage - 1) * safeLimit;
  const data = items.slice(offset, offset + safeLimit);

  return {
    data,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
  };
}
