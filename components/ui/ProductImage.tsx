'use client';

import { useState } from 'react';

const STORAGE_BUCKET = 'site-surprisez-vous.firebasestorage.app';
const imageUrlCache = new Map<string, string | null>();

function buildCandidates(ref: string): string[] {
  if (!ref) return [];
  const names = [ref, ref.toLowerCase()].filter((v, i, a) => a.indexOf(v) === i);
  return names.map(name => `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/products%2F${encodeURIComponent(name)}.jpg?alt=media`);
}

export function ProductImage({ imageRef, className }: { imageRef: string; className?: string }) {
  const candidates = buildCandidates(imageRef);
  const cached = imageUrlCache.get(imageRef);
  const [idx, setIdx] = useState(0);
  const [url, setUrl] = useState<string | null>(
    cached !== undefined ? cached : candidates[0] ?? null
  );

  if (!imageRef || url === null) return null;

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      className={className ?? 'w-full h-full object-contain'}
      onLoad={() => { imageUrlCache.set(imageRef, url); }}
      onError={() => {
        const next = idx + 1;
        if (next < candidates.length) {
          setIdx(next);
          setUrl(candidates[next]);
        } else {
          imageUrlCache.set(imageRef, null);
          setUrl(null);
        }
      }}
    />
  );
}
