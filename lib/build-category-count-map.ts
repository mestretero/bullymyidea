export function buildCategoryCountMap(rows: { category: string }[]): Record<string, number> {
  const countMap: Record<string, number> = {}
  for (const row of rows) {
    countMap[row.category] = (countMap[row.category] ?? 0) + 1
  }
  return countMap
}
