/**
 * Ranks event photos so the best ones lead: well lit, sharp, and with people
 * clearly in frame. A quick, local heuristic (no external service):
 *
 *  - exposure  — mean brightness near mid-grey, few blown highlights or
 *                crushed shadows;
 *  - contrast  — a healthy spread of tones (flat, hazy shots score low);
 *  - sharpness — edge energy from a Laplacian filter (blur and shake score low);
 *  - people    — share of skin-tone pixels, a cheap stand-in for "faces in
 *                the picture" that favours people over empty rooms and slides.
 *
 * It can't judge faces, expressions or whether a shot is easy to read, so
 * admins pick the photos members see; this only orders the folder for them,
 * best first.
 */
import sharp from "sharp";

export interface PhotoScore {
  score: number;
  exposure: number;
  contrast: number;
  sharpness: number;
  people: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export async function scorePhoto(jpeg: Buffer): Promise<PhotoScore> {
  const base = sharp(jpeg).rotate().resize(320, 320, { fit: "inside" });

  const { data: grey, info } = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let sum = 0;
  let sumSq = 0;
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    const v = grey[i];
    sum += v;
    sumSq += v * v;
    if (v < 10 || v > 245) clipped++;
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  const exposure = clamp01(1 - Math.abs(mean - 120) / 110) * clamp01(1 - (clipped / n) * 2.5);
  const contrast = clamp01(std / 64);

  // Laplacian edge energy; offset keeps negative responses.
  const lap = await base
    .clone()
    .greyscale()
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], offset: 128 })
    .raw()
    .toBuffer();
  let lapSq = 0;
  for (let i = 0; i < lap.length; i++) lapSq += (lap[i] - 128) ** 2;
  const sharpness = clamp01(Math.sqrt(lapSq / lap.length) / 18);

  // Skin tones in YCbCr.
  const { data: rgb } = await base.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let skin = 0;
  for (let i = 0; i < rgb.length; i += 3) {
    const [r, g, b] = [rgb[i], rgb[i + 1], rgb[i + 2]];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    if (y > 50 && cr > 135 && cr < 175 && cb > 80 && cb < 125) skin++;
  }
  // Peaks around a fifth of the frame: people present, not a single close-up.
  const share = skin / (rgb.length / 3);
  const people = clamp01(share / 0.12) * clamp01(1 - Math.max(0, share - 0.35) * 2);

  const score = 0.3 * exposure + 0.15 * contrast + 0.3 * sharpness + 0.25 * people;
  return { score, exposure, contrast, sharpness, people };
}

/**
 * A 64-bit difference hash, as 16 hex digits: near-identical frames (burst
 * shots, the same moment taken twice) differ by only a few bits, so the
 * highlights can skip them.
 */
export async function photoHash(jpeg: Buffer): Promise<string> {
  const px = await sharp(jpeg).rotate().greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    let nibble = 0;
    for (let b = i; b < i + 4; b++) {
      const at = Math.floor(b / 8) * 9 + (b % 8);
      nibble = (nibble << 1) | (px[at] > px[at + 1] ? 1 : 0);
    }
    hex += nibble.toString(16);
  }
  return hex;
}

const BITS = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/** How many of the 64 bits differ; under ~12 means "the same shot". */
export function hashDistance(a: string, b: string): number {
  let count = 0;
  for (let i = 0; i < 16; i++) count += BITS[parseInt(a[i], 16) ^ parseInt(b[i], 16)];
  return count;
}
