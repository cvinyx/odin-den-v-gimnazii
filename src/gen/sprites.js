// Генератор персонажей (раздел 19): базовое тело 16 px шириной, высота 22–28 px по росту,
// 4 направления × 3 кадра ходьбы. Всё рисуется по пикселям из параметров и кэшируется.
import { Pixels } from './pixels.js';
import { shade, mix } from './color.js';

export const FRAME_W = 16;
export const FRAME_H = 32;
export const DIRS = ['down', 'left', 'right', 'up'];
export const FRAMES = 3;
const OUTLINE = '#120e16';

// Рост → высота спрайта: 160–190 см → 22–28 px; дети младших классов (120–150 см) — от 16 px.
export function heightPx(cm = 175) {
  return Math.max(16, Math.min(28, Math.round(22 + ((cm - 160) * 6) / 30)));
}

export function layout(p) {
  const H = heightPx(p.heightCm);
  const t = FRAME_H - H;
  const rest = H - 8;
  const legH = Math.round(rest * 0.45);
  const torsoH = rest - legH;
  const torsoTop = t + 8;
  const legTop = torsoTop + torsoH;
  const tw = { thin: 6, normal: 8, athletic: 10, full: 10 }[p.build] || 8;
  return { H, t, legH, torsoH, torsoTop, legTop, tw };
}

export function palette(p) {
  const skin = p.skin || '#f0c39a';
  const hair = p.hairColor || '#333';
  const top = p.topColor || '#555';
  const shirt = p.shirtColor || '#eee';
  const pants = p.pantsColor || '#333';
  const sporty = p.pants === 'track' || p.top === 'tracksuit';
  const shoe = p.shoeColor || (sporty ? '#e6e6ea' : '#1d1b20');
  return {
    skin, skinD: shade(skin, 0.8), skinL: shade(skin, 1.12),
    hair, hairD: shade(hair, 0.72), hairL: shade(hair, 1.25),
    top, topD: shade(top, 0.78), topL: shade(top, 1.18),
    shirt, shirtD: shade(shirt, 0.82),
    pants, pantsD: shade(pants, 0.75),
    shoe,
    eye: shade(p.eyeColor || '#333', 0.8),
    mouth: '#9c4f45',
    lips: '#c8625c',
  };
}

// Главные цвета персонажа, как они реально рисуются (волосы «ёжиком» смешаны с кожей).
// Нужны тесту ИС-18: спрайт и портрет безымянного NPC из одних параметров.
export function keyColors(p) {
  const P = palette(p);
  const hair = p.hairStyle === 'buzz' ? mix(P.hair, P.skin, 0.45) : P.hair;
  const top = p.top === 'shirt' || p.top === 'blouse' ? P.shirt : P.top;
  return { hair, top, pants: p.top === 'dress' ? P.top : P.pants }; // у платья «низ» — само платье
}

function sleeveColor(p, P) {
  if (p.top === 'shirt' || p.top === 'blouse') return P.shirt;
  if (p.top === 'tank' || p.top === 'vest') return P.skin; // руки открыты
  return P.top;
}

// Кроссовки: полоски (три белые — одна точка на спрайте) или цветные вставки.
function shoeMark(px, p, x, y) { if (p.shoeStripe) px.set(x, y, p.shoeStripe); }
// Галстук: школьный — с золотым пикселем-логотипом гимназии.
function tieDraw(px, p, x0, y1, y2) {
  px.vline(x0, y1, y2, p.tie); px.vline(x0 + 1, y1, y2, shade(p.tie, 0.8));
  if (p.tieLogo) px.set(x0, y1 + 1, '#e8c34a');
}

// ---------- Вид спереди ----------

function torsoRowWidth(p, L, j) {
  if (p.build === 'athletic') return j < Math.ceil(L.torsoH / 2) ? 10 : 8;
  if (p.build === 'full') return j === 0 ? 10 : j >= 2 && j <= L.torsoH - 2 ? 12 : 10;
  return L.tw;
}

function legsFront(px, p, L, P, f) {
  const { legTop, legH, tw } = L;
  const bottom = legTop + legH - 1;
  const skirt = p.pants === 'skirt' || p.top === 'dress';
  if (skirt) {
    const sk = Math.ceil(legH * 0.55);
    for (const side of [0, 1]) {
      const lifted = (f === 1 && side === 0) || (f === 2 && side === 1);
      const x = side ? 8 : 6;
      const b = bottom - (lifted ? 1 : 0);
      px.rect(x, legTop + sk, 2, b - legTop - sk, P.skin);
      px.rect(x, b, 2, 1, P.shoe);
    }
    const c = p.top === 'dress' ? P.top : P.pants;
    for (let j = 0; j < sk; j++) {
      const w = tw + (j >= sk / 2 ? 2 : 0);
      px.rect(8 - w / 2, legTop + j, w, 1, j === sk - 1 ? shade(c, 0.8) : c);
    }
    return;
  }
  const lw = p.pants === 'wide' || p.build === 'full' ? 4 : 3;
  for (const side of [0, 1]) {
    const lifted = (f === 1 && side === 0) || (f === 2 && side === 1);
    const x = side ? 8 : 8 - lw;
    const b = bottom - (lifted ? 1 : 0);
    px.rect(x, legTop, lw, b - legTop, P.pants);
    px.vline(side ? 8 : 7, legTop + 1, b - 1, P.pantsD);
    if (p.pants === 'track') px.vline(side ? x + lw - 1 : x, legTop, b - 1, '#e8e8e8');
    if (p.pants === 'joggers') px.hline(x, x + lw - 1, b - 1, P.pantsD); // манжеты
    px.rect(x, b, lw, 1, P.shoe);
    shoeMark(px, p, side ? x + lw - 1 : x, b);
  }
  if (p.belt) { px.hline(8 - lw, 7 + lw, legTop, '#0b0b0d'); px.set(8, legTop, '#9a9aa4'); }
}

function torsoFront(px, p, L, P, back = false) {
  const { torsoTop: y0, torsoH: h } = L;
  const base = p.top === 'shirt' || p.top === 'blouse' ? P.shirt : P.top;
  for (let j = 0; j < h; j++) {
    const w = torsoRowWidth(p, L, j);
    px.rect(8 - w / 2, y0 + j, w, 1, base);
  }
  // тень по бокам
  for (let j = 1; j < h; j++) {
    const w = torsoRowWidth(p, L, j);
    px.set(8 + w / 2 - 1, y0 + j, shade(base, 0.85));
  }
  const vH = Math.ceil(h * 0.55);
  if (back) {
    if (p.top === 'suit' || p.top === 'shirt' || p.top === 'blouse') px.hline(7, 8, y0, P.shirt);
    if (p.top === 'suit') { px.vline(8, y0 + h - 3, y0 + h - 1, P.topD); }
    if (p.top === 'hoodie') px.rect(5, y0, 6, 3, P.topD);
    if (p.top === 'shirt') { const bw = torsoRowWidth(p, L, h - 1); px.hline(8 - bw / 2, 7 + bw / 2, y0 + h - 1, '#2a2420'); }
    return;
  }
  switch (p.top) {
    case 'suit':
      px.hline(6, 9, y0, P.shirt);
      for (let j = 1; j <= vH; j++) px.hline(7, 8, y0 + j, P.shirt);
      px.vline(6, y0 + 1, y0 + 2, P.topD);
      px.vline(9, y0 + 1, y0 + 2, P.topD);
      if (p.tie) tieDraw(px, p, 7, y0 + 1, y0 + vH);
      px.set(8, y0 + vH + 1, P.topL);
      break;
    case 'shirt':
    case 'blouse':
      px.set(6, y0, P.shirtD); px.set(9, y0, P.shirtD);
      px.vline(7, y0 + 1, y0 + h - 2, P.shirtD);
      if (p.tie) tieDraw(px, p, 7, y0 + 1, y0 + vH);
      if (p.top === 'shirt') { const bw = torsoRowWidth(p, L, h - 1); px.hline(8 - bw / 2, 7 + bw / 2, y0 + h - 1, '#2a2420'); }
      break;
    case 'sweater':
      px.hline(7, 8, y0, P.shirt);
      { const bw = torsoRowWidth(p, L, h - 1); px.hline(8 - bw / 2, 7 + bw / 2, y0 + h - 1, P.topD); }
      break;
    case 'zip-hoodie':
      // худи на молнии поверх рубашки: белый воротник, светлая молния
      px.hline(7, 8, y0, P.shirt); px.set(7, y0 + 1, P.shirt);
      px.vline(8, y0 + 1, y0 + h - 1, '#a8a8b0');
      px.hline(8 - torsoRowWidth(p, L, h - 1) / 2, 7 + torsoRowWidth(p, L, h - 1) / 2, y0 + h - 1, P.topD);
      break;
    case 'tank':
      // белая майка: плечи открыты
      px.set(8 - torsoRowWidth(p, L, 0) / 2, y0, P.skin); px.set(7 + torsoRowWidth(p, L, 0) / 2, y0, P.skin);
      px.hline(7, 8, y0, P.skin);
      break;
    case 'vest':
      // жилетка без рукавов поверх майки того же цвета, светлее посередине
      px.vline(7, y0, y0 + h - 1, P.shirt); px.vline(8, y0, y0 + h - 1, P.shirt);
      px.hline(7, 8, y0, P.skin);
      break;
    case 'hoodie':
      px.hline(5, 10, y0, P.topD);
      px.vline(6, y0 + 1, y0 + 3, '#e6e6e6');
      px.vline(9, y0 + 1, y0 + 3, '#e6e6e6');
      px.hline(5, 10, y0 + h - 3, P.topD);
      break;
    case 'cardigan':
      px.vline(7, y0, y0 + h - 1, P.shirt);
      px.vline(8, y0, y0 + h - 1, P.shirt);
      break;
    case 'tshirt':
    case 'tshirt-supreme':
      px.hline(7, 8, y0, P.skin);
      if (p.top === 'tshirt-supreme') { px.rect(6, y0 + 2, 4, 2, '#d3202b'); px.hline(7, 8, y0 + 2, '#f6f6f6'); }
      break;
    case 'tracksuit':
      px.hline(6, 9, y0, P.topD);
      px.vline(7, y0 + 1, y0 + h - 1, '#e8e8e8');
      break;
    case 'coat':
      px.hline(7, 8, y0, P.shirt);
      px.vline(6, y0, y0 + 2, '#b9c0c8');
      px.vline(9, y0, y0 + 2, '#b9c0c8');
      px.set(10, y0 + 3, '#b9c0c8');
      break;
    case 'dress':
      px.hline(7, 8, y0, P.skin);
      { const bw = torsoRowWidth(p, L, h - 2); px.hline(8 - bw / 2, 7 + bw / 2, y0 + h - 2, shade(P.top, 0.75)); }
      break;
    default:
      break;
  }
  if (p.whistle) { px.set(9, y0 + 2, '#d9dde2'); px.set(8, y0 + 1, '#3a3a3a'); }
}

function coatSkirt(px, p, L) {
  if (p.top !== 'coat') return;
  const len = Math.ceil(L.legH / 2);
  px.rect(8 - L.tw / 2, L.legTop, L.tw, len, '#f4f6f8');
  px.vline(7, L.legTop, L.legTop + len - 1, '#c9d0d8');
}

function armsFront(px, p, L, P, f, back = false) {
  const { torsoTop: y0, torsoH: h } = L;
  const w = torsoRowWidth(p, L, 1);
  const x0 = 8 - w / 2;
  const sleeve = sleeveColor(p, P);
  const short = p.top === 'tshirt' || p.top === 'tshirt-supreme';
  for (const side of [0, 1]) {
    const x = side ? x0 + w : x0 - 2;
    let swing = 0;
    if (f === 1) swing = side ? 1 : -1;
    if (f === 2) swing = side ? -1 : 1;
    if (back) swing = -swing;
    const len = h + 1 + swing;
    const top = y0 + 1;
    for (let j = 0; j < len; j++) {
      const y = top + j;
      const isHand = j >= len - 2;
      let c = isHand ? P.skin : sleeve;
      if (short && j >= 2 && !isHand) c = P.skin;
      px.set(x, y, c);
      px.set(x + 1, y, isHand ? P.skinD : shade(c, 0.85));
    }
    if (p.top === 'tracksuit') px.vline(side ? x + 1 : x, top, top + len - 3, '#e8e8e8');
    if (p.ring && side === 1 && !back) px.set(x, top + len - 1, '#e2b23a'); // массивное кольцо
    if (p.briefcase && side === 1 && !back) {
      const by = top + len;
      px.rect(x - 1, by, 4, 3, '#6b4423');
      px.hline(x - 1, x + 2, by, '#4a2e17');
    }
  }
}

function headFront(px, p, L, P) {
  const t = L.t;
  px.rect(4, t + 1, 8, 7, P.skin);
  px.vline(11, t + 2, t + 6, P.skinD);
  px.hline(5, 10, t + 7, P.skinD);
  for (const [x, y] of [[4, t + 1], [11, t + 1], [4, t + 7], [11, t + 7]]) px.data[y * px.w + x] = null;
  px.set(3, t + 4, P.skinD); px.set(3, t + 5, P.skinD);
  px.set(12, t + 4, P.skinD); px.set(12, t + 5, P.skinD);
  if (p.bigChin) { px.hline(5, 10, t + 7, P.skin); px.hline(6, 9, t + 8, P.skinD); }
}

function faceFront(px, p, L, P) {
  const t = L.t;
  const e = t + 4;
  if (!p.noBrows) {
    px.hline(5, 6, e - 1, P.hairD);
    px.hline(9, 10, e - 1, P.hairD);
  }
  px.set(6, e, P.eye);
  px.set(9, e, P.eye);
  if (p.female) { px.set(5, e, '#2a1d1d'); px.set(10, e, '#2a1d1d'); }
  if (p.bigForehead) { px.hline(6, 9, t + 2, P.skinL); }
  if (p.wrinkles) { px.set(5, t + 5, P.skinD); px.set(10, t + 5, P.skinD); }
  let mY = t + 6;
  if (p.bigNose) {
    px.rect(7, t + 4, 2, 3, P.skinD);
    px.set(7, t + 4, P.skinL);
    px.set(6, t + 6, P.skinD);
    mY = t + 7;
  }
  if (p.beard) px.rect(5, t + 6, 6, 2, P.hair);
  if (p.mustache) { px.hline(p.mustache === 'stalin' ? 5 : 6, p.mustache === 'stalin' ? 10 : 9, t + 6, P.hair); mY = t + 7; }
  if (p.bigLips) {
    px.hline(6, 9, mY, P.lips);
    px.hline(7, 8, mY + 1, shade(P.lips, 0.85));
  } else if (p.wideSmile) {
    px.set(6, mY - 1, P.mouth); px.set(9, mY - 1, P.mouth); px.hline(7, 8, mY, P.mouth);
  } else {
    px.hline(7, 8, mY, p.female ? '#b85a5a' : P.mouth);
  }
  if (p.glasses === 'round') {
    const g = '#141414', lens = '#bfe3f7';
    px.set(6, e - 1, g); px.set(9, e - 1, g);
    px.set(5, e, g); px.set(7, e, g); px.set(8, e, g); px.set(10, e, g);
    px.set(6, e, lens); px.set(9, e, lens);
    px.set(6, e + 1, g); px.set(9, e + 1, g);
  } else if (p.glasses === 'thin') {
    const g = '#5a5a66';
    px.set(5, e, g); px.set(7, e, g); px.set(8, e, g); px.set(10, e, g);
  } else if (p.glasses === 'sun') {
    // круглые солнцезащитные: тёмные стёкла
    const g = '#141414', lens = '#2a2a33';
    px.set(6, e - 1, g); px.set(9, e - 1, g);
    px.set(5, e, g); px.set(7, e, g); px.set(8, e, g); px.set(10, e, g);
    px.set(6, e, lens); px.set(9, e, lens);
    px.set(6, e + 1, g); px.set(9, e + 1, g);
  }
}

// Текстура «кудрей»: чередуем основной и тёмный цвет.
function curl(P, x, y) { return (x + y) % 3 === 0 ? P.hairD : P.hair; }

function hairFront(px, p, L, P) {
  const t = L.t;
  const H = P.hair, D = P.hairD, Lh = P.hairL;
  const r = (x, y, w, h, c = H) => px.rect(x, y, w, h, c);
  const s = (x, y, c = H) => px.set(x, y, c);
  switch (p.hairStyle) {
    case 'short':
      r(4, t, 8, 2); px.hline(6, 8, t, Lh); s(4, t + 2); s(11, t + 2); s(4, t + 3); s(11, t + 3);
      break;
    case 'side-part':
      r(4, t, 8, 2); r(4, t + 2, 4, 1); s(4, t + 3); s(11, t + 2); s(11, t + 3); s(8, t, Lh);
      break;
    case 'slick':
      r(4, t, 8, 2); px.hline(5, 9, t, Lh); s(4, t + 2); s(11, t + 2);
      break;
    case 'buzz': {
      const c = mix(H, P.skin, 0.45);
      px.hline(5, 10, t, c); px.hline(4, 11, t + 1, c); s(4, t + 2, c); s(11, t + 2, c);
      break;
    }
    case 'spiky':
      r(4, t, 8, 2); s(4, t + 2); s(11, t + 2);
      s(5, t - 1); s(7, t - 1); s(7, t - 2); s(9, t - 1); s(10, t - 2); s(10, t - 1);
      break;
    case 'curly-short':
      for (let x = 5; x <= 10; x++) if (x % 2) s(x, t - 1, curl(P, x, t));
      for (let y = t; y <= t + 1; y++) for (let x = 3; x <= 12; x++) s(x, y, curl(P, x, y));
      s(3, t + 2); s(3, t + 3); s(12, t + 2); s(12, t + 3); s(4, t + 2); s(11, t + 2);
      break;
    case 'tousled':
      // растрёпанная объёмная стрижка: пряди торчат в стороны и вверх
      r(3, t, 10, 2);
      for (const x of [4, 6, 9, 11]) s(x, t - 1, D);
      s(7, t - 1); s(2, t + 1, D); s(13, t + 1, D);
      s(4, t + 2); s(5, t + 2, D); s(7, t + 2); s(10, t + 2, D); s(11, t + 2);
      px.vline(3, t + 2, t + 4, H); px.vline(12, t + 2, t + 4, H); s(2, t + 3, D); s(13, t + 3, D);
      px.hline(6, 8, t, Lh);
      break;
    case 'wavy':
      // средняя длина, мягкие волны, пряди падают на лоб
      r(4, t, 8, 2); s(3, t + 1);
      for (const x of [4, 5, 7, 10, 11]) s(x, t + 2, x % 2 ? H : D);
      for (let y = t + 1; y <= t + 5; y++) { s(3, y, y % 2 ? H : D); s(12, y, y % 2 ? D : H); }
      s(5, t, Lh); s(9, t, Lh);
      break;
    case 'bangs':
      // короткая с прямой чёлкой
      r(4, t, 8, 2); px.hline(4, 11, t + 2, H); px.hline(5, 10, t + 2, D); s(4, t + 3); s(11, t + 3);
      px.hline(6, 9, t, Lh);
      break;
    case 'curly':
      // густые упругие кудри средней длины
      for (let x = 4; x <= 11; x++) s(x, t - 1, curl(P, x, t - 1));
      for (let y = t; y <= t + 2; y++) for (let x = 3; x <= 12; x++) { if (y === t + 2 && x > 4 && x < 11 && x % 2) continue; s(x, y, curl(P, x, y)); }
      for (let y = t + 3; y <= t + 5; y++) { s(2, y, curl(P, 2, y)); s(3, y, curl(P, 3, y)); s(12, y, curl(P, 12, y)); s(13, y, curl(P, 13, y)); }
      break;
    case 'fringe':
      // короткие, пряди аккуратно спадают на лоб
      r(4, t, 8, 2); s(4, t + 2); s(11, t + 2);
      s(5, t + 2); s(6, t + 2, D); s(8, t + 2); s(9, t + 2, D); s(6, t + 3, D);
      px.hline(6, 8, t, Lh);
      break;
    case 'stalin':
      // густые, зачёсаны назад
      px.hline(5, 10, t - 1, H); r(4, t, 8, 2); s(4, t + 2); s(11, t + 2);
      px.hline(5, 10, t, Lh); px.hline(6, 9, t - 1, Lh);
      break;
    case 'medium-straight':
      r(4, t, 8, 1); r(3, t + 1, 10, 1); px.hline(3, 7, t + 2, H); px.hline(9, 12, t + 2, H);
      px.vline(3, t + 3, t + 6, H); px.vline(12, t + 3, t + 6, H); s(4, t + 3); s(11, t + 3);
      px.hline(5, 6, t, Lh); s(8, t + 1, D);
      break;
    case 'medium':
      r(4, t, 8, 1); r(3, t + 1, 10, 1); px.hline(3, 5, t + 2, H); px.hline(9, 12, t + 2, H);
      px.vline(3, t + 3, t + 5, H); px.vline(12, t + 3, t + 5, H);
      px.hline(9, 10, t, Lh);
      break;
    case 'mullet':
      px.hline(5, 10, t - 1, H); r(4, t, 8, 2); px.hline(4, 6, t + 2, H); px.hline(10, 11, t + 2, H);
      s(4, t + 3); s(11, t + 3);
      px.vline(3, t + 4, t + 9, D); px.vline(12, t + 4, t + 9, D);
      px.vline(2, t + 7, t + 9, D); px.vline(13, t + 7, t + 9, D);
      px.hline(6, 8, t - 1, Lh);
      break;
    case 'long-curly': {
      const end = t + 11;
      for (let x = 4; x <= 11; x++) s(x, t - 1, curl(P, x, t - 1));
      for (let x = 3; x <= 12; x++) s(x, t, curl(P, x, t));
      for (let x = 2; x <= 13; x++) {
        if (p.bigForehead && x >= 5 && x <= 10) continue;
        s(x, t + 1, curl(P, x, t + 1));
      }
      for (const x of [2, 3, 4, 11, 12, 13]) s(x, t + 2, curl(P, x, t + 2));
      if (!p.bigForehead) { s(5, t + 2); s(7, t + 2, D); s(9, t + 2); s(10, t + 2, D); }
      for (let y = t + 3; y <= end; y++) {
        for (const x of [2, 3, 12, 13]) s(x, y, curl(P, x, y));
        if (y % 2) { s(1, y, D); s(14, y, D); }
      }
      for (let y = t + 3; y <= t + 4; y++) { s(4, y); s(11, y); }
      break;
    }
    case 'long-messy':
      for (const [x, y] of [[3, t - 1], [5, t - 1], [6, t - 2], [8, t - 1], [10, t - 1], [9, t - 2], [12, t - 1]]) s(x, y, D);
      r(3, t, 10, 1); r(2, t + 1, 12, 1);
      px.hline(2, 5, t + 2, H); px.hline(7, 8, t + 2, H); px.hline(10, 13, t + 2, H);
      px.hline(2, 3, t + 3, H); s(6, t + 3, D); px.hline(12, 13, t + 3, H);
      for (let y = t + 4; y <= t + 7; y++) { px.hline(2, 3, y, y % 2 ? H : D); px.hline(12, 13, y, y % 2 ? D : H); }
      s(1, t + 3, D); s(14, t + 4, D); s(1, t + 6, D); s(14, t + 7, D); s(2, t + 8, D); s(13, t + 8, D);
      px.hline(5, 7, t, Lh);
      break;
    case 'village':
      r(4, t, 8, 1); r(3, t + 1, 10, 3);
      px.vline(3, t + 4, t + 5, H); px.vline(12, t + 4, t + 5, H);
      px.hline(3, 12, t + 3, D);
      px.hline(5, 9, t, Lh);
      break;
    case 'long-straight':
      r(4, t, 8, 1); r(3, t + 1, 10, 1); px.hline(3, 4, t + 2, H); px.hline(8, 12, t + 2, H);
      px.vline(3, t + 3, t + 12, H); px.vline(12, t + 3, t + 12, H);
      px.vline(2, t + 6, t + 12, D); px.vline(13, t + 6, t + 12, D);
      s(4, t + 3); s(11, t + 3); s(4, t + 4); s(11, t + 4);
      px.hline(5, 7, t, Lh);
      break;
    case 'ponytail':
      r(4, t, 8, 2); s(4, t + 2); s(11, t + 2); s(4, t + 3); s(11, t + 3);
      px.hline(6, 9, t, Lh);
      break;
    case 'bob':
      r(4, t, 8, 1); r(3, t + 1, 10, 2);
      for (let y = t + 3; y <= t + 7; y++) { px.hline(3, 4, y, H); px.hline(11, 12, y, H); }
      px.hline(3, 12, t + 2, D);
      break;
    case 'bun':
      r(6, t - 2, 4, 2); r(4, t, 8, 1); px.hline(4, 5, t + 1, H); px.hline(10, 11, t + 1, H);
      s(4, t + 2); s(11, t + 2); s(4, t + 3); s(11, t + 3);
      px.hline(7, 8, t - 2, Lh);
      break;
    default:
      r(4, t, 8, 2);
  }
  if (p.hairStreak) { s(6, t, p.hairStreak); s(9, t + 1, p.hairStreak); s(4, t + 1, p.hairStreak); }
}

// ---------- Вид сбоку (вправо; влево — зеркально) ----------

function legsSide(px, p, L, P, f) {
  const { legTop, legH } = L;
  const bottom = legTop + legH - 1;
  const uh = Math.max(2, Math.floor(legH / 2));
  const skirt = p.pants === 'skirt' || p.top === 'dress';
  const wide = p.pants === 'wide' || p.build === 'full' ? 1 : 0;
  const pc = skirt ? P.skin : P.pants;
  const pd = skirt ? P.skinD : P.pantsD;
  if (f === 0) {
    px.rect(6, legTop, 4 + wide, legH - 1, pc);
    px.vline(6, legTop + uh, bottom - 1, pd);
    px.hline(6, 10 + wide, bottom, P.shoe);
    shoeMark(px, p, 8, bottom);
  } else {
    px.rect(6, legTop, 4 + wide, uh, pc);
    const backLift = f === 2 ? 1 : 0;
    const frontLift = f === 1 ? 1 : 0;
    px.rect(5, legTop + uh, 2, bottom - legTop - uh - backLift, pd);
    px.hline(4, 6, bottom - backLift, P.shoe);
    px.rect(9, legTop + uh, 2 + wide, bottom - legTop - uh - frontLift, pc);
    px.hline(9, 11 + wide, bottom - frontLift, P.shoe);
    shoeMark(px, p, 10, bottom - frontLift);
  }
  if (p.belt && !skirt) px.hline(6, 9 + wide, legTop, '#0b0b0d');
  if (p.pants === 'track') px.vline(7, legTop, legTop + uh - 1, '#e8e8e8');
  if (skirt) {
    const sk = Math.ceil(legH * 0.55);
    const c = p.top === 'dress' ? P.top : P.pants;
    for (let j = 0; j < sk; j++) px.hline(5, 10 + (j >= sk / 2 ? 1 : 0), legTop + j, c);
  }
}

function torsoSide(px, p, L, P, f) {
  const { torsoTop: y0, torsoH: h, legTop } = L;
  const ts = { thin: 5, normal: 6, athletic: 7, full: 8 }[p.build] || 6;
  const x0 = 8 - Math.floor(ts / 2);
  const base = p.top === 'shirt' || p.top === 'blouse' ? P.shirt : P.top;
  px.rect(x0, y0, ts, h, base);
  px.vline(x0, y0 + 1, y0 + h - 1, shade(base, 0.85));
  if (p.build === 'full') px.vline(x0 + ts, y0 + 2, y0 + h - 2, base);
  const fx = x0 + ts - 1 + (p.build === 'full' ? 1 : 0);
  const vH = Math.ceil(h * 0.55);
  if (p.top === 'suit') {
    px.set(fx, y0, P.shirt);
    px.vline(fx, y0 + 1, y0 + vH, p.tie || P.shirt);
  } else if (p.top === 'tshirt-supreme') {
    px.vline(fx, y0 + 2, y0 + 3, '#d3202b');
  } else if (p.top === 'tracksuit') {
    px.vline(fx, y0, y0 + h - 1, '#e8e8e8');
  } else if (p.top === 'hoodie' || p.top === 'zip-hoodie') {
    px.rect(x0 - 1, y0, 2, 2, P.topD);
    if (p.top === 'zip-hoodie') px.set(fx, y0, P.shirt);
  } else if (p.top === 'vest') {
    px.vline(fx, y0, y0 + h - 1, P.shirt);
  } else if (p.top === 'cardigan') {
    px.vline(fx, y0, y0 + h - 1, P.shirt);
  } else if ((p.top === 'shirt' || p.top === 'blouse') && p.tie) {
    px.vline(fx, y0 + 1, y0 + vH, p.tie);
    if (p.tieLogo) px.set(fx, y0 + 2, '#e8c34a');
  }
  if (p.top === 'shirt') px.hline(x0, x0 + ts - 1, y0 + h - 1, '#2a2420');
  if (p.top === 'coat') {
    const len = Math.ceil(L.legH / 2);
    px.rect(x0, legTop, ts, len, '#f4f6f8');
    px.vline(x0, legTop, legTop + len - 1, '#c9d0d8');
  }
  if (p.whistle) px.set(fx, y0 + 2, '#d9dde2');
  // рука
  const sleeve = sleeveColor(p, P);
  const short = p.top === 'tshirt' || p.top === 'tshirt-supreme';
  const len = h + 1;
  for (let j = 0; j < len; j++) {
    const y = y0 + 1 + j;
    const lower = j >= Math.floor(len / 2);
    const sw = lower ? (f === 1 ? 1 : f === 2 ? -1 : 0) : 0;
    const isHand = j >= len - 2;
    let c = isHand ? P.skin : sleeve;
    if (short && j >= 2 && !isHand) c = P.skin;
    px.set(7 + sw, y, c);
    px.set(8 + sw, y, isHand ? P.skinD : shade(c, 0.85));
    if (p.top === 'tracksuit' && !isHand) px.set(8 + sw, y, '#e8e8e8');
  }
  if (p.briefcase) {
    const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
    px.rect(6 + sw, y0 + len + 1, 4, 3, '#6b4423');
  }
}

function headSide(px, p, L, P) {
  const t = L.t;
  px.rect(5, t + 1, 7, 7, P.skin);
  for (const [x, y] of [[11, t + 1], [11, t + 7], [5, t + 7]]) px.data[y * px.w + x] = null;
  px.hline(6, 10, t + 7, P.skinD);
  px.vline(7, t + 4, t + 5, P.skinD); // ухо
  const e = t + 4;
  if (!p.noBrows) px.hline(10, 11, e - 1, P.hairD);
  px.set(10, e, P.eye);
  if (p.female) px.set(11, e, '#2a1d1d');
  if (p.bigNose) {
    px.rect(12, t + 4, 2, 3, P.skinD);
    px.set(12, t + 4, P.skin);
  } else {
    px.set(12, t + 5, P.skin);
  }
  let mY = t + 6;
  if (p.bigNose) mY = t + 7;
  if (p.beard) px.rect(8, t + 6, 4, 2, P.hair);
  if (p.mustache) { px.hline(p.mustache === 'stalin' ? 9 : 10, 12, t + 6, P.hair); mY = t + 7; }
  if (p.bigLips) { px.set(11, mY, P.lips); px.set(12, mY, P.lips); }
  else px.set(11, mY, p.female ? '#b85a5a' : P.mouth);
  if (p.wrinkles) px.set(9, t + 5, P.skinD);
  if (p.bigChin) { px.hline(8, 11, t + 7, P.skin); px.hline(9, 12, t + 8, P.skinD); }
  if (p.glasses === 'round') {
    const g = '#141414';
    px.set(10, e - 1, g); px.set(9, e, g); px.set(11, e, g); px.set(10, e + 1, g);
    px.set(10, e, '#bfe3f7');
    px.hline(7, 8, e, g);
  } else if (p.glasses === 'thin') {
    px.hline(9, 11, e, '#5a5a66');
    px.set(10, e, P.eye);
    px.hline(7, 8, e, '#5a5a66');
  } else if (p.glasses === 'sun') {
    const g = '#141414';
    px.set(10, e - 1, g); px.set(9, e, g); px.set(11, e, g); px.set(10, e + 1, g);
    px.set(10, e, '#2a2a33');
    px.hline(7, 8, e, g);
  }
}

function hairSide(px, p, L, P) {
  const t = L.t;
  const H = P.hair, D = P.hairD, Lh = P.hairL;
  const r = (x, y, w, h, c = H) => px.rect(x, y, w, h, c);
  const s = (x, y, c = H) => px.set(x, y, c);
  const cap = () => { px.hline(5, 10, t, H); px.hline(4, 11, t + 1, H); };
  switch (p.hairStyle) {
    case 'short': case 'side-part': case 'slick':
      cap(); r(4, t + 2, 3, 3); r(7, t + 2, 2, 2);
      if (p.hairStyle === 'side-part') px.hline(10, 11, t + 2, H);
      if (p.hairStyle === 'slick') px.hline(5, 9, t, Lh); else px.hline(6, 8, t, Lh);
      break;
    case 'buzz': {
      const c = mix(H, P.skin, 0.45);
      px.hline(5, 10, t, c); px.hline(4, 11, t + 1, c); r(4, t + 2, 2, 3, c); s(6, t + 2, c);
      break;
    }
    case 'spiky':
      cap(); r(4, t + 2, 3, 3); r(7, t + 2, 2, 2);
      s(6, t - 1); s(8, t - 1); s(8, t - 2); s(10, t - 1); s(5, t - 1);
      break;
    case 'curly-short':
      for (let x = 5; x <= 9; x++) if (x % 2) s(x, t - 1, curl(P, x, t));
      for (let x = 4; x <= 11; x++) s(x, t, curl(P, x, t));
      for (let x = 3; x <= 12; x++) s(x, t + 1, curl(P, x, t + 1));
      for (let y = t + 2; y <= t + 5; y++) for (let x = 3; x <= 6; x++) s(x, y, curl(P, x, y));
      px.hline(11, 12, t + 2, H);
      break;
    case 'bangs': case 'fringe': case 'stalin':
      cap(); r(4, t + 2, 3, 3); r(7, t + 2, 2, 2);
      if (p.hairStyle === 'bangs') px.hline(10, 12, t + 2, H);
      if (p.hairStyle === 'fringe') { s(11, t + 2); s(12, t + 3, D); }
      if (p.hairStyle === 'stalin') { px.hline(5, 10, t - 1, H); px.hline(5, 10, t, Lh); } else px.hline(6, 8, t, Lh);
      break;
    case 'curly':
      for (let x = 4; x <= 11; x++) s(x, t - 1, curl(P, x, t - 1));
      for (let y = t; y <= t + 1; y++) for (let x = 3; x <= 12; x++) s(x, y, curl(P, x, y));
      for (let y = t + 2; y <= t + 6; y++) for (let x = 2; x <= 6; x++) s(x, y, curl(P, x, y));
      px.hline(10, 12, t + 2, H);
      break;
    case 'tousled':
    case 'wavy':
      px.hline(5, 10, t, H); px.hline(4, 12, t + 1, H); px.hline(10, 12, t + 2, H);
      r(3, t + 2, 5, 4); r(8, t + 2, 1, 2);
      if (p.hairStyle === 'tousled') { for (const x of [4, 7, 10]) s(x, t - 1, D); s(2, t + 3, D); s(12, t + 3, D); }
      else { s(2, t + 4, D); s(3, t + 6, D); s(12, t + 3, D); }
      px.hline(6, 8, t, Lh);
      break;
    case 'medium-straight':
    case 'medium':
      px.hline(5, 10, t, H); px.hline(4, 12, t + 1, H); px.hline(10, 12, t + 2, H);
      r(3, t + 2, 5, p.hairStyle === 'medium' ? 4 : 5); r(8, t + 2, 1, 2);
      px.hline(6, 8, t, Lh);
      break;
    case 'mullet':
      px.hline(6, 10, t - 1, H); px.hline(5, 11, t, H); px.hline(4, 11, t + 1, H);
      px.hline(10, 11, t + 2, H);
      r(4, t + 2, 4, 4); r(3, t + 6, 3, 5, D); r(2, t + 8, 1, 3, D);
      px.hline(7, 9, t - 1, Lh);
      break;
    case 'long-curly':
      for (let x = 4; x <= 11; x++) s(x, t - 1, curl(P, x, t - 1));
      for (let x = 3; x <= 12; x++) s(x, t, curl(P, x, t));
      for (let x = 2; x <= 12; x++) s(x, t + 1, curl(P, x, t + 1));
      if (!p.bigForehead) px.hline(11, 12, t + 2, H);
      for (let y = t + 2; y <= t + 11; y++) for (let x = 1; x <= 7; x++) {
        if (x === 1 && y % 2 === 0) continue;
        if (x === 7 && y > t + 3) continue;
        s(x, y, curl(P, x, y));
      }
      break;
    case 'long-messy':
      for (const x of [4, 6, 8, 10, 12]) s(x, t - 1, D);
      px.hline(3, 12, t, H); px.hline(2, 13, t + 1, H);
      px.hline(10, 13, t + 2, H); s(11, t + 3, D); s(13, t + 3, D);
      r(2, t + 2, 6, 6); s(1, t + 4, D); s(1, t + 7, D); s(3, t + 8, D);
      px.hline(5, 8, t, Lh);
      break;
    case 'village':
      px.hline(5, 11, t, H); r(4, t + 1, 9, 3); px.hline(4, 12, t + 3, D);
      r(4, t + 4, 3, 2);
      px.hline(6, 9, t, Lh);
      break;
    case 'long-straight':
      cap(); px.hline(10, 11, t + 2, H); r(3, t + 2, 5, 11); px.vline(2, t + 6, t + 12, D);
      px.hline(6, 8, t, Lh);
      break;
    case 'ponytail':
      cap(); r(4, t + 2, 3, 3); r(2, t + 2, 2, 7, D); s(4, t + 2, '#c43c5a');
      px.hline(6, 9, t, Lh);
      break;
    case 'bob':
      px.hline(5, 10, t, H); px.hline(4, 12, t + 1, H); px.hline(9, 12, t + 2, H);
      r(3, t + 2, 5, 6);
      break;
    case 'bun':
      px.hline(5, 10, t, H); px.hline(4, 10, t + 1, H); r(4, t + 2, 3, 3); r(2, t - 1, 3, 3);
      break;
    default:
      cap();
  }
}

// ---------- Вид сзади ----------

function hairBack(px, p, L, P) {
  const t = L.t;
  const H = P.hair, D = P.hairD, Lh = P.hairL;
  const r = (x, y, w, h, c = H) => px.rect(x, y, w, h, c);
  const s = (x, y, c = H) => px.set(x, y, c);
  switch (p.hairStyle) {
    case 'short': case 'side-part': case 'slick': case 'bangs': case 'fringe':
      r(4, t, 8, 6); px.hline(5, 10, t, Lh); px.hline(5, 10, t + 5, D);
      break;
    case 'stalin':
      px.hline(5, 10, t - 1, H); r(4, t, 8, 6); for (let y = t; y <= t + 4; y += 2) px.hline(5, 10, y, Lh);
      break;
    case 'curly':
      for (let x = 4; x <= 11; x++) s(x, t - 1, curl(P, x, t - 1));
      for (let y = t; y <= t + 6; y++) for (let x = 2; x <= 13; x++) s(x, y, curl(P, x, y));
      break;
    case 'tousled': case 'wavy':
      r(4, t, 8, 1); r(3, t + 1, 10, 6); px.hline(5, 10, t, Lh);
      if (p.hairStyle === 'tousled') { for (const x of [4, 6, 9, 11]) s(x, t - 1, D); s(2, t + 3, D); s(13, t + 3, D); }
      else for (let y = t + 2; y <= t + 6; y += 2) { s(2, y, D); s(13, y, D); }
      break;
    case 'buzz':
      r(4, t, 8, 6, mix(H, P.skin, 0.45));
      break;
    case 'spiky':
      r(4, t, 8, 6); s(5, t - 1); s(7, t - 1); s(7, t - 2); s(9, t - 1); s(10, t - 2);
      break;
    case 'curly-short':
      for (let x = 5; x <= 10; x++) if (x % 2) s(x, t - 1, curl(P, x, t));
      for (let y = t; y <= t + 5; y++) for (let x = 3; x <= 12; x++) s(x, y, curl(P, x, y));
      break;
    case 'medium-straight':
    case 'medium':
      r(4, t, 8, 1); r(3, t + 1, 10, p.hairStyle === 'medium' ? 6 : 7); px.hline(5, 10, t, Lh);
      break;
    case 'mullet':
      px.hline(5, 10, t - 1, H); r(4, t, 8, 7); r(4, t + 7, 8, 3, D); px.hline(5, 10, t + 10, D);
      px.hline(6, 9, t - 1, Lh);
      break;
    case 'long-curly':
      for (let x = 4; x <= 11; x++) s(x, t - 1, curl(P, x, t - 1));
      for (let y = t; y <= t + 11; y++) for (let x = 2; x <= 13; x++) s(x, y, curl(P, x, y));
      for (let y = t + 3; y <= t + 11; y += 2) { s(1, y, D); s(14, y, D); }
      break;
    case 'long-messy':
      for (const [x, y] of [[3, t - 1], [5, t - 1], [6, t - 2], [8, t - 1], [10, t - 1], [12, t - 1]]) s(x, y, D);
      r(3, t, 10, 1); r(2, t + 1, 12, 7);
      s(1, t + 3, D); s(14, t + 4, D); s(3, t + 8, D); s(6, t + 8, D); s(9, t + 8, D); s(12, t + 8, D);
      break;
    case 'village':
      r(4, t, 8, 1); r(3, t + 1, 10, 5); px.hline(3, 12, t + 5, D); px.hline(5, 9, t, Lh);
      break;
    case 'long-straight':
      r(4, t, 8, 1); r(3, t + 1, 10, 12); px.hline(5, 8, t, Lh);
      break;
    case 'ponytail':
      r(4, t, 8, 6); px.hline(7, 8, t + 5, '#c43c5a'); r(7, t + 6, 2, 6, D);
      break;
    case 'bob':
      r(4, t, 8, 1); r(3, t + 1, 10, 7);
      break;
    case 'bun':
      r(4, t, 8, 6); r(6, t - 2, 4, 3, D);
      break;
    default:
      r(4, t, 8, 6);
  }
}

// ---------- Сборка кадров ----------

function drawFrame(p, dir, f) {
  const px = new Pixels(FRAME_W, FRAME_H);
  const L = layout(p);
  const P = palette(p);
  if (dir === 'down') {
    legsFront(px, p, L, P, f);
    torsoFront(px, p, L, P);
    coatSkirt(px, p, L);
    armsFront(px, p, L, P, f);
    headFront(px, p, L, P);
    faceFront(px, p, L, P);
    hairFront(px, p, L, P);
  } else if (dir === 'up') {
    legsFront(px, p, L, P, f);
    if (p.rippedPants) { px.hline(7, 8, L.legTop, P.skin); px.set(8, L.legTop + 1, P.skin); }
    torsoFront(px, p, L, P, true);
    coatSkirt(px, p, L);
    armsFront(px, p, L, P, f, true);
    headFront(px, p, L, P);
    hairBack(px, p, L, P);
  } else {
    legsSide(px, p, L, P, f);
    torsoSide(px, p, L, P, f);
    headSide(px, p, L, P);
    hairSide(px, p, L, P);
  }
  px.outline(OUTLINE);
  return px;
}

// Полный лист: 3 кадра по горизонтали × 4 направления по вертикали (down, left, right, up).
export function buildSheetPixels(p) {
  const sheet = new Pixels(FRAME_W * FRAMES, FRAME_H * DIRS.length);
  DIRS.forEach((dir, row) => {
    for (let f = 0; f < FRAMES; f++) {
      const srcDir = dir === 'left' ? 'right' : dir;
      const fr = drawFrame(p, srcDir, f);
      fr.blitTo(sheet, f * FRAME_W, row * FRAME_H, dir === 'left');
    }
  });
  return sheet;
}

const cache = new Map();

// Лист спрайтов персонажа (offscreen-canvas), кэш по ключу.
export function getSheet(key, params) {
  let c = cache.get(key);
  if (!c) {
    c = buildSheetPixels(params).toCanvas();
    cache.set(key, c);
  }
  return c;
}

// Порядок кадров анимации ходьбы: стоять, шаг, стоять, шаг другой ногой.
export const WALK_CYCLE = [0, 1, 0, 2];

export function frameRect(dir, frame) {
  const row = Math.max(0, DIRS.indexOf(dir));
  return { sx: frame * FRAME_W, sy: row * FRAME_H, sw: FRAME_W, sh: FRAME_H };
}
