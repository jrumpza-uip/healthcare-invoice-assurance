import { collectCursorPages, paginateRows } from './pagination';

describe('pagination', () => {
  it('collects every cursor page in order', async () => {
    const seen: Array<string | undefined> = [];
    const result = await collectCursorPages(async (cursor) => {
      seen.push(cursor);
      if (!cursor) return { items: ['a', 'b'], nextCursor: 'next-1' };
      return { items: ['c'], nextCursor: undefined };
    });

    expect(seen).toEqual([undefined, 'next-1']);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('returns a bounded stable client page', () => {
    expect(paginateRows(['a', 'b', 'c', 'd'], 2, 2)).toEqual({
      items: ['c', 'd'],
      page: 2,
      pageSize: 2,
      pageCount: 2,
      total: 4,
    });
  });
});
