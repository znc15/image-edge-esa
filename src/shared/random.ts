export type ImagePick = {
  url: string;
  index: number;
  total: number;
};

export function parseImageUrls(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function pickRandom(urls: string[], rand: number): ImagePick {
  const total = urls.length;
  if (total <= 0) {
    throw new Error('No image URLs configured');
  }
  const index = Math.floor(rand * total);
  const safeIndex = Math.min(Math.max(index, 0), total - 1);
  return { url: urls[safeIndex], index: safeIndex, total };
}
