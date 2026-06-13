/**
 * Builds a query string from a params object, skipping undefined/null/empty values.
 * buildQuery({ cohort_id: 5, status: undefined }) => '?cohort_id=5'
 * buildQuery({}) => ''
 */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )

  if (entries.length === 0) return ''

  const search = new URLSearchParams()
  for (const [key, value] of entries) {
    search.set(key, String(value))
  }

  return `?${search.toString()}`
}