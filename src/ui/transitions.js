// Переходы между сценами: затемнение (используется менеджером сцен) и «шторка» для особых моментов.
export function drawFade(r, alpha, color = '#000') {
  if (alpha <= 0) return;
  r.alpha(Math.min(1, alpha), () => r.rect(0, 0, 480, 270, color));
}

// Шторка сверху вниз: progress 0..1.
export function drawWipe(r, progress, color = '#000') {
  const h = Math.round(270 * Math.max(0, Math.min(1, progress)));
  r.rect(0, 0, 480, h, color);
}

// Всплывающее сообщение (тост) в верхней части экрана.
export function drawToast(r, text, t, life) {
  const a = Math.min(1, t * 6, (life - t) * 4);
  if (a <= 0) return;
  const w = r.measure(text) + 16;
  r.alpha(a, () => {
    r.box(240 - w / 2, 6, w, 17, '#ffffff', '#000000', 1);
    r.text(text, 240, 10, { align: 'center', color: '#ffffff' });
  });
}

// Уведомление «Достижение получено»: выезжает справа сверху, держится ~3 с.
export function drawAchievement(r, a, t) {
  const k = Math.min(1, t * 5, (3 - t) * 4);
  if (k <= 0) return;
  const w = Math.max(150, r.measure(a.name) + 40);
  const x = 480 - (w + 6) * k;
  r.box(x, 28, w, 26, '#ffe14d', '#1a1830', 1);
  r.text('★', x + 8, 36, { color: '#ffe14d', scale: 1 });
  r.text('Достижение!', x + 22, 31, { color: '#ffe14d' });
  r.text(a.name, x + 22, 42, { color: '#ffffff' });
}
