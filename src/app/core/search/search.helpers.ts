export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function extractKeywords(query: string) {
  return normalize(query)
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}
