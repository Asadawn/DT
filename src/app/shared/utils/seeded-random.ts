export function seededRandom(seedStr: string): () => number {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (Math.imul(seed, 31) + seedStr.charCodeAt(i)) | 0;
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
