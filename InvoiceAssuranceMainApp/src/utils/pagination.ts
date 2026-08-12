export interface CursorPage<T, TCursor = string> {
  items: T[];
  nextCursor?: TCursor;
  hasNextPage?: boolean;
}

export async function collectCursorPages<T, TCursor = string>(
  fetchPage: (cursor?: TCursor) => Promise<CursorPage<T, TCursor>>,
): Promise<T[]> {
  const collected: T[] = [];
  let cursor: TCursor | undefined;

  do {
    const page = await fetchPage(cursor);
    collected.push(...page.items);
    cursor = page.hasNextPage === false ? undefined : page.nextCursor;
  } while (cursor);

  return collected;
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * safePageSize;

  return {
    items: rows.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    pageCount,
    total: rows.length,
  };
}
