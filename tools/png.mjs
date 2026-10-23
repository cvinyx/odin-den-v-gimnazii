// Мини-кодировщик PNG для предпросмотра пиксельных буферов в node (без браузера).
import zlib from 'node:zlib';
import fs from 'node:fs';
import { hexToRgb } from '../src/gen/color.js';

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}

// cells: [{ px: Pixels, x, y }] на холсте w×h, масштаб scale, фон bg.
export function writePng(file, w, h, cells, scale = 4, bg = '#3a3a48') {
  const W = w * scale, H = h * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  const bgc = hexToRgb(bg);
  const grid = new Array(w * h).fill(null);
  for (const { px, x, y } of cells) {
    for (let j = 0; j < px.h; j++) for (let i = 0; i < px.w; i++) {
      const c = px.get(i, j);
      if (c && x + i < w && y + j < h) grid[(y + j) * w + x + i] = c;
    }
  }
  for (let Y = 0; Y < H; Y++) {
    raw[Y * (W * 4 + 1)] = 0;
    for (let X = 0; X < W; X++) {
      const c = grid[Math.floor(Y / scale) * w + Math.floor(X / scale)];
      const rgb = c ? hexToRgb(c) : bgc;
      const o = Y * (W * 4 + 1) + 1 + X * 4;
      raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2]; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}
