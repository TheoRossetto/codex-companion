// Original Orbit satellite icon. No upstream artwork is used.
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const png = new PNG({ width: 256, height: 256 });
for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
  const dx = (x - 128) / 2, dy = (y - 128) / 2;
  const rx = dx * Math.cos(.4) - dy * Math.sin(.4), ry = dx * Math.sin(.4) + dy * Math.cos(.4);
  const ring = Math.sqrt((rx / 53) ** 2 + (ry / 18) ** 2), r = Math.hypot(dx, dy);
  let c = [0, 0, 0, 0];
  if (Math.abs(ring - 1) < .075) c = [165, 185, 255, 255];
  if (r < 32) c = [155 - dy, 176 - dy, 232 - dy * .5, 255];
  if (r < 17) c = [16, 25, 46, 255];
  if (Math.hypot(dx - 2, dy) < 7) c = [165, 185, 255, 255];
  if (Math.hypot(dx - 4, dy + 3) < 2.5) c = [255, 255, 255, 255];
  if (Math.hypot(dx - 44, dy + 25) < 5) c = [165, 185, 255, 255];
  png.data.set(c, (y * 256 + x) * 4);
}
mkdirSync('assets', { recursive: true });
writeFileSync('assets/icon.png', PNG.sync.write(png));
