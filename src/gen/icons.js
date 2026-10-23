// Иконки статусов 8×8 для HUD. Буквы — индексы палитры иконки.
import { Pixels } from './pixels.js';

const ICONS = {
  battery: {
    pal: { k: '#1a1a1a', w: '#e8e8e8', g: '#5ad65a' },
    rows: ['........', '.wwwwww.', 'ww....ww', 'wgggg.ww', 'wgggg.ww', 'ww....ww', '.wwwwww.', '........'],
  },
  stress: {
    pal: { r: '#ff5a4a', y: '#ffd24a' },
    rows: ['...y....', '..yy....', '.yyy....', 'yyyyyyy.', '...yyy..', '...yy...', '..yy....', '..y.....'],
  },
  aura: {
    pal: { p: '#b98cff', w: '#ffffff' },
    rows: ['...p....', '...p....', '.p.w.p..', '..www...', 'ppwwwpp.', '..www...', '.p.w.p..', '...p....'],
  },
  vape: {
    pal: { m: '#9aa3ad', d: '#5c6570', c: '#bfe3ff', l: '#ffd24a' },
    rows: ['.c..c...', 'c..c....', '.cc.....', '...mm...', '...mm...', '...dd...', '...ml...', '...mm...'],
  },
  suspicion: {
    pal: { w: '#ffffff', k: '#111111', r: '#ff5a4a' },
    rows: ['........', '..www...', '.wwwww..', 'wwwkkww.', 'wwwkkww.', '.wwwww..', '..www...', '........'],
  },
  hunger: {
    pal: { b: '#d79a4a', d: '#a06a2a', l: '#f2c27a' },
    rows: ['........', '..llll..', '.lbbbbl.', 'lbbdbbbl', 'bbbbbdbb', 'dbbbbbbd', '.dddddd.', '........'],
  },
  money: {
    pal: { g: '#5ac85a', d: '#3a8a3a', w: '#e8ffe8' },
    rows: ['........', 'gggggggg', 'gdwwwwdg', 'gwwddwwg', 'gwwddwwg', 'gdwwwwdg', 'gggggggg', '........'],
  },
};

const cache = new Map();

export function iconPixels(name, tint = null) {
  const def = ICONS[name];
  const px = new Pixels(8, 8);
  def.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') px.set(x, y, tint || def.pal[ch]);
  }));
  return px;
}

export function getIcon(name, tint = null) {
  const key = name + (tint || '');
  let c = cache.get(key);
  if (!c) { c = iconPixels(name, tint).toCanvas(); cache.set(key, c); }
  return c;
}

export const ICON_NAMES = Object.keys(ICONS);
