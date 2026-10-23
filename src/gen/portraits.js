// Портреты 48×48 (раздел 19): собираются из тех же параметров, что и спрайты, + эмоция.
import { Pixels } from './pixels.js';
import { shade, mix } from './color.js';
import { palette } from './sprites.js';

export const PORTRAIT_SIZE = 48;
export const EMOTIONS = ['norm', 'happy', 'angry', 'surprised', 'dumb'];
export const EMOTION_NAMES = { norm: 'норм', happy: 'радость', angry: 'злость', surprised: 'удивление', dumb: 'тупой взгляд' };
const OUTLINE = '#120e16';
const CX = 24;

// Заполненный эллипс, ограниченный по строкам [yMin, yMax].
function ellipseRows(px, cx, cy, rx, ry, c, yMin = -1e9, yMax = 1e9) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    if (y < yMin || y > yMax) continue;
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) px.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
}

function ring(px, cx, cy, r, c, thick = 1) {
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r + 0.5 && d >= r + 0.5 - thick) px.set(x, y, c);
    }
  }
}

function headShape(p) {
  const full = p.build === 'full';
  return { cx: CX, cy: 22, rx: full ? 12.5 : 11, ry: 13 };
}

// ---------- Одежда ----------
function shoulders(px, p, P) {
  const wide = p.build === 'full' ? 21 : p.build === 'athletic' ? 21 : p.build === 'thin' ? 17 : 19;
  const base = p.top === 'shirt' || p.top === 'blouse' ? P.shirt : P.top;
  for (let y = 37; y < 48; y++) {
    const k = Math.min(1, (y - 37) / 4);
    const half = Math.round(11 + (wide - 11) * k);
    px.hline(CX - half, CX + half - 1, y, base);
  }
  // складки/тени
  px.vline(CX - wide + 2, 42, 47, shade(base, 0.85));
  px.vline(CX + wide - 3, 42, 47, shade(base, 0.85));
  const neckL = 20, neckR = 27;
  switch (p.top) {
    case 'suit': {
      for (let y = 37; y < 48; y++) {
        const half = Math.max(1, 4 - Math.floor((y - 37) / 3));
        px.hline(CX - half, CX + half - 1, y, P.shirt);
        px.set(CX - half - 1, y, P.topD); px.set(CX + half, y, P.topD);
      }
      if (p.tie) {
        px.rect(22, 38, 4, 2, p.tie);
        for (let y = 40; y < 48; y++) px.hline(22, 25, y, y % 3 ? p.tie : shade(p.tie, 0.8));
      }
      break;
    }
    case 'shirt':
    case 'blouse':
      for (let i = 0; i < 4; i++) { px.hline(neckL - 1 + i, neckL + 1, 37 + i, P.shirtD); px.hline(neckR - 1, neckR + 1 - i, 37 + i, P.shirtD); }
      if (p.tie) { px.rect(22, 38, 4, 2, p.tie); for (let y = 40; y < 48; y++) px.hline(22, 25, y, p.tie); }
      else for (const y of [41, 44, 47]) px.set(CX, y, P.shirtD);
      break;
    case 'sweater':
      px.hline(neckL, neckR, 37, P.shirt); px.hline(neckL + 1, neckR - 1, 38, P.shirt);
      for (let y = 39; y < 48; y += 2) px.hline(CX - 14, CX + 13, y, shade(P.top, 0.92));
      break;
    case 'hoodie':
      px.rect(CX - 11, 35, 22, 4, P.topD);
      px.vline(21, 39, 45, '#e6e6e6'); px.vline(26, 39, 45, '#e6e6e6');
      break;
    case 'cardigan':
      px.rect(20, 37, 8, 11, P.shirt);
      px.vline(19, 37, 47, P.topD); px.vline(28, 37, 47, P.topD);
      for (const y of [41, 45]) { px.set(18, y, P.topL); }
      break;
    case 'tshirt':
    case 'tshirt-supreme':
      ellipseRows(px, CX, 36, 5, 3, P.skin, 37, 39);
      px.hline(18, 29, 37, shade(P.top, 0.85));
      if (p.top === 'tshirt-supreme') {
        px.rect(16, 41, 16, 6, '#d3202b');
        // «буквы» логотипа
        for (let x = 18; x <= 29; x++) if (x % 3 !== 2) px.vline(x, 43, 44, '#f8f8f8');
      }
      break;
    case 'tracksuit':
      px.rect(19, 36, 10, 3, P.topD);
      px.vline(CX, 38, 47, '#e8e8e8');
      px.hline(CX - 20, CX - 13, 41, '#e8e8e8'); px.hline(CX + 12, CX + 19, 41, '#e8e8e8');
      break;
    case 'coat':
      for (let y = 37; y < 48; y++) {
        const half = Math.max(1, 4 - Math.floor((y - 37) / 3));
        px.hline(CX - half, CX + half - 1, y, P.shirt);
        px.set(CX - half - 1, y, '#b9c0c8'); px.set(CX + half, y, '#b9c0c8');
      }
      px.rect(31, 43, 5, 1, '#b9c0c8');
      break;
    case 'dress':
      ellipseRows(px, CX, 36, 6, 4, P.skin, 37, 40);
      break;
    default:
      break;
  }
  if (p.whistle) {
    px.hline(17, 21, 38, '#2a2a2a'); px.vline(30, 38, 41, '#2a2a2a');
    px.rect(29, 42, 4, 2, '#cfd4da'); px.set(32, 43, '#8a9098');
  }
}

// ---------- Волосы ----------
function curlC(P) { return (x, y) => ((x * 7 + y * 5) % 9 < 3 ? P.hairD : (x + y) % 7 === 0 ? P.hairL : P.hair); }

function hairBack(px, p, P) {
  const H = P.hair, D = P.hairD;
  switch (p.hairStyle) {
    case 'mullet':
      px.rect(13, 26, 6, 16, D); px.rect(29, 26, 6, 16, D);
      px.rect(11, 34, 4, 8, D); px.rect(33, 34, 4, 8, D);
      break;
    case 'long-curly': {
      const c = curlC(P);
      ellipseRows(px, CX, 22, 17, 16, c);
      for (let i = 0; i < 6; i++) {
        ellipseRows(px, 9 + (i % 2), 26 + i * 4, 4, 3, c);
        ellipseRows(px, 39 - (i % 2), 26 + i * 4, 4, 3, c);
      }
      break;
    }
    case 'long-messy':
      ellipseRows(px, CX, 21, 16, 14, H);
      for (const [x, y] of [[7, 20], [41, 22], [8, 30], [40, 31], [10, 34], [38, 35]]) px.rect(x - 2, y - 1, 4, 3, D);
      break;
    case 'long-straight':
      ellipseRows(px, CX, 20, 14, 10, H);
      px.rect(10, 20, 28, 28, H);
      px.vline(10, 24, 47, D); px.vline(37, 24, 47, D);
      break;
    case 'bob':
      ellipseRows(px, CX, 21, 14, 11, H);
      px.rect(10, 21, 28, 13, H);
      px.hline(10, 37, 33, D);
      break;
    case 'ponytail':
      ellipseRows(px, 37, 30, 4, 11, D);
      break;
    case 'medium-straight':
      ellipseRows(px, CX, 21, 14, 12, H);
      px.rect(10, 21, 28, 10, H);
      break;
    case 'medium':
      ellipseRows(px, CX, 21, 13.5, 11, H);
      break;
    default:
      break;
  }
}

function hairFront(px, p, P) {
  const H = P.hair, D = P.hairD, Lh = P.hairL;
  const hs = headShape(p);
  const cap = (yMax, extra = 1.5) => ellipseRows(px, CX, 19, hs.rx + extra, 11, H, 0, yMax);
  switch (p.hairStyle) {
    case 'short':
      cap(14);
      px.rect(12, 14, 3, 8, H); px.rect(33, 14, 3, 8, H);
      px.hline(17, 26, 9, Lh); px.hline(19, 23, 10, Lh);
      break;
    case 'side-part':
      cap(15);
      for (let i = 0; i < 4; i++) px.hline(14, 26 - i * 3, 15 + i, H);
      px.rect(12, 15, 3, 8, H); px.rect(33, 15, 3, 7, H);
      px.vline(27, 8, 13, D); px.hline(17, 24, 9, Lh);
      break;
    case 'slick':
      cap(14);
      px.rect(12, 14, 3, 7, H); px.rect(33, 14, 3, 7, H);
      for (let x = 16; x <= 32; x += 4) px.hline(x, x + 2, 11, Lh);
      px.hline(15, 33, 13, Lh);
      break;
    case 'buzz': {
      const c = mix(H, P.skin, 0.4);
      ellipseRows(px, CX, 19, hs.rx + 0.5, 11, c, 0, 13);
      for (let x = 14; x <= 34; x += 3) px.set(x, 11, shade(c, 0.85));
      break;
    }
    case 'spiky':
      cap(14);
      for (const [x, h] of [[15, 6], [19, 8], [23, 9], [27, 8], [31, 6]]) for (let i = 0; i < h; i++) px.hline(x - Math.floor((h - i) / 3), x + Math.floor((h - i) / 3), 10 - i, i % 3 ? H : D);
      px.rect(12, 14, 3, 7, H); px.rect(33, 14, 3, 7, H);
      break;
    case 'curly-short': {
      const c = curlC(P);
      for (const [x, y] of [[15, 12], [19, 9], [24, 8], [29, 9], [33, 12], [13, 17], [35, 17], [18, 14], [23, 13], [28, 14]]) ellipseRows(px, x, y, 4, 3.5, c);
      break;
    }
    case 'medium-straight':
      cap(15);
      // чёлка, зачёсанная влево, с пробором справа
      for (let i = 0; i < 6; i++) px.hline(13, 27 - i * 2, 15 + i, H);
      px.hline(29, 35, 15, H); px.hline(31, 35, 16, H);
      px.rect(11, 16, 4, 15, H); px.rect(33, 16, 4, 15, H);
      px.vline(28, 9, 15, D); px.hline(16, 24, 10, Lh); px.hline(18, 22, 11, Lh);
      break;
    case 'medium':
      cap(15);
      for (let i = 0; i < 4; i++) px.hline(14 + i * 2, 21 + i, 15 + i, H);
      px.hline(26, 35, 15, H); px.hline(29, 35, 16, H);
      px.rect(11, 16, 4, 11, H); px.rect(33, 16, 4, 11, H);
      px.hline(26, 31, 10, Lh);
      break;
    case 'mullet':
      ellipseRows(px, CX, 17, hs.rx + 1.5, 11, H, 0, 15);
      for (let i = 0; i < 3; i++) px.hline(14 + i * 3, 16 + i * 3, 16, H);
      px.hline(28, 34, 16, H);
      px.rect(12, 15, 3, 10, H); px.rect(33, 15, 3, 10, H);
      px.hline(17, 27, 7, Lh); px.hline(19, 25, 8, Lh);
      break;
    case 'long-curly': {
      const c = curlC(P);
      const hairline = p.bigForehead ? 11 : 16;
      ellipseRows(px, CX, 18, hs.rx + 3, 12, c, 0, hairline);
      if (!p.bigForehead) for (const x of [15, 20, 25, 30]) ellipseRows(px, x, 16, 3, 2.5, c);
      px.rect(10, 14, 5, 18, H); px.rect(33, 14, 5, 18, H);
      for (let y = 14; y < 32; y++) { px.set(10, y, c(10, y)); px.set(37, y, c(37, y)); }
      break;
    }
    case 'long-messy':
      ellipseRows(px, CX, 18, hs.rx + 3, 12, H, 0, 15);
      for (const [x, y, h] of [[14, 16, 5], [17, 16, 3], [21, 16, 4], [25, 16, 2], [28, 16, 4], [32, 16, 5]]) px.rect(x, y, 3, h, H);
      for (const [x, y] of [[13, 4], [19, 3], [25, 2], [31, 4], [35, 6]]) { px.rect(x, y, 2, 4, D); }
      px.rect(10, 15, 4, 16, H); px.rect(34, 15, 4, 16, H);
      px.hline(18, 28, 8, Lh);
      break;
    case 'village':
      ellipseRows(px, CX, 19, hs.rx + 2, 11, H, 0, 19);
      px.hline(12, 36, 19, D);
      px.rect(11, 19, 4, 6, H); px.rect(33, 19, 4, 6, H);
      px.hline(16, 31, 10, Lh); px.hline(14, 33, 11, Lh);
      for (let x = 14; x <= 34; x += 3) px.vline(x, 16, 18, D);
      break;
    case 'long-straight':
      cap(15);
      for (let i = 0; i < 5; i++) px.hline(27 - i, 35, 15 + i, H);
      px.hline(13, 18, 15, H); px.hline(13, 15, 16, H);
      px.rect(11, 16, 3, 22, H); px.rect(34, 16, 3, 22, H);
      px.hline(17, 24, 10, Lh);
      break;
    case 'ponytail':
      cap(14);
      px.rect(12, 14, 3, 6, H); px.rect(33, 14, 3, 6, H);
      px.rect(34, 13, 3, 3, '#c43c5a');
      px.hline(17, 26, 9, Lh);
      break;
    case 'bob':
      ellipseRows(px, CX, 19, hs.rx + 2, 11, H, 0, 17);
      px.hline(13, 35, 17, D);
      px.rect(11, 17, 4, 16, H); px.rect(33, 17, 4, 16, H);
      px.hline(17, 26, 10, Lh);
      break;
    case 'bun':
      ellipseRows(px, CX, 6, 6, 5, H);
      ellipseRows(px, CX, 6, 3, 2, P.hairL);
      cap(13, 1);
      px.rect(12, 13, 3, 6, H); px.rect(33, 13, 3, 6, H);
      break;
    default:
      cap(14);
  }
}

// ---------- Лицо ----------
function eyes(px, p, P, emo) {
  const ey = 24;
  const white = '#f4f4f4';
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 18 : 28; // левый край глаза
    if (emo === 'happy') {
      // глаза-дуги «^ ^»
      px.hline(cx, cx + 3, ey, '#2a1d1d');
      px.set(cx - 1 + (side < 0 ? 0 : 5), ey + 1, '#2a1d1d');
      px.set(cx + (side < 0 ? 4 : -1), ey + 1, '#2a1d1d');
      continue;
    }
    if (emo === 'surprised') {
      px.rect(cx, ey - 1, 4, 4, white);
      px.rect(cx + 1, ey, 2, 2, P.eye);
      px.set(cx + 1, ey, '#ffffff');
      continue;
    }
    px.rect(cx, ey, 4, emo === 'angry' ? 2 : 3, white);
    let ix = cx + 1;
    if (emo === 'dumb') ix = side < 0 ? cx + 2 : cx; // глаза чуть в кучу
    px.rect(ix, ey, 2, emo === 'angry' ? 2 : 3, P.eye);
    px.set(ix, ey, shade(P.eye, 0.6));
    if (emo === 'dumb') px.hline(cx - 1, cx + 4, ey, P.skinD); // тяжёлые веки
    if (p.female) { px.set(side < 0 ? cx - 1 : cx + 4, ey - 1, '#2a1d1d'); }
  }
  // брови
  if (!p.noBrows) {
    const bc = P.hairD;
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 16 : 27;
      for (let i = 0; i < 6; i++) {
        const x = x0 + i;
        let y = 20;
        if (emo === 'angry') y = side < 0 ? 19 + Math.floor(i / 2) : 21 - Math.floor(i / 2);
        else if (emo === 'surprised') y = 17 + (i === 0 || i === 5 ? 1 : 0);
        else if (emo === 'happy') y = 19 + (i === 0 || i === 5 ? 1 : 0);
        else if (emo === 'dumb') y = side < 0 ? 19 : 21;
        px.set(x, y, bc);
        if (!p.female) px.set(x, y + 1, i % 2 ? bc : shade(bc, 1.15));
      }
    }
  } else {
    // без бровей — лёгкие тени на месте бровей подчёркивают гэг
    px.hline(17, 20, 21, P.skinD);
    px.hline(28, 31, 21, P.skinD);
  }
}

function mouth(px, p, P, emo) {
  const y = p.bigNose ? 32 : 31;
  const dark = '#5a2424';
  const lips = p.bigLips ? P.lips : p.female ? '#c45f62' : shade(P.skin, 0.7);
  const smiley = emo === 'happy' || (p.wideSmile && emo === 'norm');
  if (smiley) {
    const w = p.wideSmile || p.bigLips ? 5 : 4;
    px.rect(CX - w, y, w * 2, 2, dark);
    px.hline(CX - w + 1, CX + w - 2, y, '#f4f4f4');
    px.set(CX - w - 1, y - 1, dark); px.set(CX + w, y - 1, dark);
    if (p.bigLips) { px.hline(CX - w, CX + w - 1, y - 1, lips); px.hline(CX - w, CX + w - 1, y + 2, lips); }
  } else if (emo === 'angry') {
    px.rect(CX - 4, y, 8, 2, '#f4f4f4');
    px.hline(CX - 4, CX + 3, y, dark); px.set(CX - 5, y + 1, dark); px.set(CX + 4, y + 1, dark);
    px.vline(CX - 2, y, y + 1, dark); px.vline(CX + 1, y, y + 1, dark);
    if (p.bigLips) { px.hline(CX - 4, CX + 3, y - 1, lips); px.hline(CX - 4, CX + 3, y + 2, lips); }
  } else if (emo === 'surprised') {
    ellipseRows(px, CX, y + 1.5, 2.5, 3, dark);
    if (p.bigLips) ring(px, CX, y + 1.5, 3, lips);
  } else if (emo === 'dumb') {
    px.rect(CX - 2, y, 5, 3, dark);
    px.hline(CX - 2, CX + 2, y + 2, '#b0505a');
    if (p.bigLips) { px.hline(CX - 3, CX + 3, y - 1, lips); px.hline(CX - 3, CX + 3, y + 3, lips); }
    px.set(CX + 3, y + 4, '#9fd3ff'); // слюна
  } else {
    if (p.bigLips) {
      px.hline(CX - 4, CX + 3, y - 1, lips);
      px.hline(CX - 4, CX + 3, y, shade(lips, 0.7));
      px.hline(CX - 3, CX + 2, y + 1, lips);
    } else {
      px.hline(CX - 3, CX + 2, y, lips === P.skin ? dark : shade(lips, 0.8));
    }
  }
}

function nose(px, p, P) {
  if (p.bigNose) {
    ellipseRows(px, CX, 27, 4, 5, P.skinD);
    ellipseRows(px, CX - 1, 26, 2, 3, P.skin);
    px.set(CX - 2, 30, '#3a2020'); px.set(CX + 1, 30, '#3a2020');
    return;
  }
  px.vline(CX, 25, 27, P.skinD);
  px.hline(CX - 1, CX + 1, 28, P.skinD);
}

function drawHead(px, p, P) {
  const hs = headShape(p);
  // шея
  px.rect(19, 30, 10, 9, P.skinD);
  // уши
  ellipseRows(px, hs.cx - hs.rx - 0.5, 24, 2, 3, P.skinD);
  ellipseRows(px, hs.cx + hs.rx + 0.5, 24, 2, 3, P.skinD);
  ellipseRows(px, hs.cx, hs.cy, hs.rx, hs.ry, P.skin);
  if (p.bigChin) { ellipseRows(px, CX, 33, 7, 4.5, P.skin); px.hline(19, 28, 37, P.skinD); }
  // тень на правой стороне лица
  for (let y = 14; y < 34; y++) {
    for (let x = CX + 6; x < 40; x++) {
      if (px.get(x, y) === P.skin && px.get(x + 1, y) !== P.skin) { px.set(x, y, P.skinD); break; }
    }
  }
  if (p.build === 'full') { px.set(15, 29, shade(P.skin, 0.92)); px.set(33, 29, shade(P.skin, 0.92)); }
}

function extras(px, p, P, emo) {
  if (p.bigForehead) {
    // «качает мышцы лба»
    px.vline(20, 13, 16, P.skinD); px.vline(27, 13, 16, P.skinD);
    px.hline(22, 25, 12, P.skinL);
  }
  if (p.wrinkles) {
    px.hline(19, 28, 15, P.skinD); px.hline(20, 27, 17, P.skinD);
    px.set(16, 26, P.skinD); px.set(32, 26, P.skinD);
  }
  if (p.beard) {
    for (let y = 28; y < 38; y++) for (let x = 13; x < 36; x++) {
      const inFace = px.get(x, y) === P.skin || px.get(x, y) === P.skinD;
      if (inFace && !(y >= 30 && y <= 33 && x >= CX - 4 && x <= CX + 4)) px.set(x, y, (x + y) % 4 ? P.hair : shade(P.hair, 0.85));
    }
  }
  if (p.mustache) px.rect(CX - 5, 29, 10, 2, P.hair);
  if (p.glasses === 'round') {
    ring(px, 20, 25, 4, '#111111', 1.6);
    ring(px, 30, 25, 4, '#111111', 1.6);
    px.hline(24, 25, 24, '#111111');
    px.hline(12, 15, 24, '#111111'); px.hline(34, 36, 24, '#111111');
    px.set(18, 22, '#ffffff'); px.set(28, 22, '#ffffff');
  } else if (p.glasses === 'thin') {
    const g = '#4a4a55';
    for (const x0 of [16, 27]) {
      px.hline(x0, x0 + 5, 22, g); px.hline(x0, x0 + 5, 27, g);
      px.vline(x0, 22, 27, g); px.vline(x0 + 5, 22, 27, g);
    }
    px.hline(22, 26, 23, g);
  }
  if (emo === 'angry') {
    // «венка» злости
    const r = '#e0383e';
    px.set(33, 12, r); px.set(35, 12, r); px.set(34, 13, r); px.set(33, 14, r); px.set(35, 14, r);
  }
  if (emo === 'surprised') {
    px.vline(39, 8, 11, '#ffffff'); px.set(39, 13, '#ffffff');
  }
}

function drawDirectorDoor(px) {
  const wood = '#7a4a2a';
  px.rect(8, 2, 32, 46, wood);
  px.rect(8, 2, 32, 2, '#5a361e');
  px.rect(12, 8, 24, 16, shade(wood, 0.85));
  px.rect(12, 28, 24, 16, shade(wood, 0.85));
  px.rect(16, 12, 16, 6, '#d8c070');
  px.hline(18, 29, 14, '#4a3a10'); px.hline(18, 26, 16, '#4a3a10');
  px.rect(33, 26, 3, 2, '#d8c070');
}

function buildPortrait(p, emo) {
  const px = new Pixels(PORTRAIT_SIZE, PORTRAIT_SIZE);
  if (p.voiceOnly) { drawDirectorDoor(px); px.outline(OUTLINE); return px; }
  const P = palette(p);
  hairBack(px, p, P);
  shoulders(px, p, P);
  drawHead(px, p, P);
  eyes(px, p, P, emo);
  nose(px, p, P);
  mouth(px, p, P, emo);
  hairFront(px, p, P);
  extras(px, p, P, emo);
  px.outline(OUTLINE);
  return px;
}

export function buildPortraitPixels(p, emo = 'norm') { return buildPortrait(p, EMOTIONS.includes(emo) ? emo : 'norm'); }

const cache = new Map();

export function getPortrait(key, params, emo = 'norm') {
  const e = EMOTIONS.includes(emo) ? emo : 'norm';
  const k = key + ':' + e;
  let c = cache.get(k);
  if (!c) {
    c = buildPortrait(params, e).toCanvas();
    cache.set(k, c);
  }
  return c;
}
