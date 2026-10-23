// Цветовые утилиты для генераторов спрайтов.
export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

// f < 1 — темнее, f > 1 — светлее.
export function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex);
  if (f <= 1) return rgbToHex([r * f, g * f, b * f]);
  const k = f - 1;
  return rgbToHex([r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k]);
}

export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

// Яркость 0..1 — чтобы выбирать контурный цвет.
export function luma(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
