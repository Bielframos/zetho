import { LexoRank } from 'lexorank';

export function generateOrderKey({
  prev,
  next,
}: { prev?: string; next?: string } = {}): string {
  if (!prev && !next) {
    return LexoRank.middle().toString();
  }

  if (!prev) {
    return LexoRank.parse(next!).genPrev().toString();
  }

  if (!next) {
    return LexoRank.parse(prev).genNext().toString();
  }

  return LexoRank.parse(prev).between(LexoRank.parse(next)).toString();
}
