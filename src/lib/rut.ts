export const RUT_MAX_LENGTH = 10

export function formatRUT(value: string): string {
  const cleaned = value.replace(/[^0-9Kk]/g, '')
  if (cleaned.length <= 1) return cleaned.toUpperCase()
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()
  return `${body}-${dv}`
}
