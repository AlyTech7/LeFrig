import { PaginatedResponse } from '@lefrig/shared';

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export function skipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
