// Resize only the original Orbit artwork; no upstream restricted assets.
import { PNG } from 'pngjs';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const source = PNG.sync.read(readFileSync('assets/icon.png'));
mkdirSync('store/appx', { recursive: true });
for (const [name, width, height] of [
  ['StoreLogo', 50, 50], ['Square44x44Logo', 44, 44],
  ['Square150x150Logo', 150, 150], ['Wide310x150Logo', 310, 150],
]) {
  const target = new PNG({ width, height });
  const size = Math.min(width, height);
  const offset = Math.floor((width - size) / 2);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const out = (y * width + x) * 4;
    if (x < offset || x >= offset + size) continue;
    const sx = Math.min(source.width - 1, Math.floor((x - offset) * source.width / size));
    const sy = Math.min(source.height - 1, Math.floor(y * source.height / size));
    source.data.copy(target.data, out, (sy * source.width + sx) * 4, (sy * source.width + sx) * 4 + 4);
  }
  writeFileSync(`store/appx/${name}.png`, PNG.sync.write(target));
}
