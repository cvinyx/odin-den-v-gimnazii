// Телефон: лента соцсети. Посты едут вверх; Z — лайк посту в центре. Лайкай «нужное» (друзей),
// кринж и рекламу — не лайкай. Гэг «лайк не туда»: нажал Z во время лага — лайк улетел случайному посту.
import { registerMinigame } from './registry.js';
import { PhoneGame } from './phone_shell.js';
import { FakeInput, hungerMul } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { FEED_POSTS } from '../../data/feed.js';
import { portraitOf, getPerson } from '../gen/people.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.phoneGames.feed;
const POST_H = 52;

export class FeedLogic {
  constructor(rng, p = {}) {
    this.rng = rng;
    this.posts = rng.shuffle(FEED_POSTS.map((x) => ({ ...x, liked: false })));
    this.offset = -40;
    this.score = 0;
    this.target = p.target || B.target;
    this.accuracy = p.accuracy || 1; // голод: −20 % «точности» — окно лайка уже
    this.wrongLike = null;
    this.finished = false;
    this.events = [];
  }
  // индекс поста в центре экрана (центр на высоте 90)
  current() {
    const i = Math.floor((this.offset + 90) / POST_H);
    const within = ((this.offset + 90) % POST_H + POST_H) % POST_H;
    const margin = (1 - this.accuracy) * POST_H / 2;
    if (within < margin || within > POST_H - margin) return -1;
    return i >= 0 && i < this.posts.length ? i : -1;
  }
  update(dt, input) {
    const fast = input.held('down');
    const slow = input.held('up');
    this.offset += (fast ? B.fastScroll : slow ? B.scroll * 0.4 : B.scroll) * dt;
    if (this.offset > this.posts.length * POST_H - 60) this.finished = true;
    if (input.pressed('confirm')) this.like(this.current());
  }
  like(i) {
    if (i < 0) return;
    const p = this.posts[i];
    if (p.liked) return;
    p.liked = true;
    this.score += p.good ? 1 : -1;
    this.events.push({ type: p.good ? 'good' : 'bad', i });
  }
  // лайк во время лага улетает не туда
  frozenPress() {
    const i = this.rng.int(0, this.posts.length - 1);
    const p = this.posts[i];
    if (!this.wrongLike) this.wrongLike = p.text.length > 40 ? p.text.slice(0, 38) + '…' : p.text;
    p.liked = true;
    this.events.push({ type: 'wrong', i });
  }
}

// «Средний игрок»: лайкает нужное с вероятностью 0,85, ошибается на кринже в 15 %, иногда листает быстрее.
export function feedBot(L, rng) {
  let seen = -1, wait = 0, decision = false;
  return (dt) => {
    const inp = new FakeInput();
    const i = L.current();
    if (i !== seen) { seen = i; wait = rng.float(0.25, 0.7); decision = i >= 0 && (L.posts[i].good ? rng.chance(0.85) : rng.chance(0.15)); }
    wait -= dt;
    if (i >= 0 && decision && wait <= 0 && !L.posts[i].liked) inp.press('confirm');
    if (i >= 0 && L.posts[i].liked) inp.hold('down');
    return inp;
  };
}

export class FeedInner {
  constructor(rng, p) {
    this.L = new FeedLogic(rng, { accuracy: hungerMul(p.state) });
    this.kit = p.kit;
    this.botFn = feedBot(this.L, rng);
  }
  get score() { return Math.max(0, this.L.score); }
  get target() { return this.L.target; }
  get finished() { return this.L.finished; }
  get wrongLike() { return this.L.wrongLike; }
  onFrozenPress() { this.L.frozenPress(); this.fx(); }
  update(dt, input) { this.L.update(dt, input); this.fx(); }
  fx() {
    for (const e of this.L.events) {
      if (!this.kit) continue;
      if (e.type === 'good') { audio.play('coin'); this.kit.popups.add(240, 100, '+1 ♥', '#ff8ad0'); this.kit.particles.burst(240, 100, 10, { color: '#ff4a8a', speed: 40 }); }
      if (e.type === 'bad') { audio.play('statDown'); this.kit.popups.add(240, 100, '−1 кринж', '#ff6a6a'); }
      if (e.type === 'wrong') { audio.play('menuDenied'); this.kit.popups.add(240, 100, 'лайк не туда!', '#ffb84a'); this.kit.game.r.shake(2, 0.3); }
    }
    this.L.events = [];
  }
  bot(dt) { return this.botFn(dt); }
  draw(r, x, y, w) {
    const L = this.L;
    r.rect(0, 0, w, 200, '#f0f0f4');
    L.posts.forEach((p, i) => {
      const py = i * POST_H - L.offset;
      if (py < -POST_H || py > 200) return;
      r.rect(3, py + 2, w - 6, POST_H - 4, '#ffffff');
      r.frame(3, py + 2, w - 6, POST_H - 4, '#d0d0d8');
      const person = p.author ? getPerson(p.author) : null;
      const pt = p.author ? portraitOf(p.author, 'happy') : null;
      if (pt) r.image(pt, 6, py + 4, 12, 12); else r.rect(6, py + 4, 12, 12, '#c8c8d0');
      r.text(person ? person.short : p.name, 21, py + 5, { color: '#303040' });
      drawPic(r, p.pic, 6, py + 18);
      r.wrap(p.text, w - 50).slice(0, 3).forEach((ln, k) => r.text(ln, 42, py + 18 + k * 10, { color: '#404050' }));
      r.text(p.liked ? '♥' : '♡', w - 10, py + 5, { color: p.liked ? '#ff3a6a' : '#a0a0a8' });
    });
    // линия «центр»
    r.alpha(0.25, () => r.rect(0, 89, w, 2, '#ff4a8a'));
  }
}

// Пиксельные картинки постов (без откровенных изображений).
function drawPic(r, pic, x, y) {
  r.rect(x, y, 32, 28, '#dfe8f0');
  const c = (col, ax, ay, w, h) => r.rect(x + ax, y + ay, w, h, col);
  switch (pic) {
    case 'forehead': c('#f0c39a', 8, 6, 16, 18); c('#f3e19a', 6, 4, 20, 4); c('#e0a080', 12, 9, 2, 5); c('#e0a080', 18, 9, 2, 5); break;
    case 'cola': c('#7a1a1a', 12, 4, 8, 22); c('#e02020', 12, 10, 8, 6); c('#202020', 14, 2, 4, 3); break;
    case 'ball': c('#ffffff', 9, 7, 14, 14); c('#202020', 14, 11, 4, 4); c('#3a7ad0', 0, 22, 32, 6); break;
    case 'jeans': c('#3d5a8a', 9, 4, 14, 22); c('#2a3e60', 15, 12, 2, 14); c('#f0c39a', 12, 6, 4, 2); break;
    case 'cat': c('#f0a0c0', 9, 8, 14, 12); c('#f0a0c0', 9, 5, 3, 4); c('#f0a0c0', 20, 5, 3, 4); c('#202020', 12, 12, 2, 2); c('#202020', 18, 12, 2, 2); c('#7ac0ff', 13, 15, 1, 3); break;
    case 'tank': c('#556b3a', 6, 12, 20, 9); c('#445530', 12, 8, 9, 5); c('#445530', 20, 9, 10, 2); c('#202020', 6, 21, 20, 3); break;
    case 'banana': c('#f0d040', 8, 10, 4, 10); c('#f0d040', 11, 18, 12, 4); c('#f0d040', 21, 12, 4, 8); c('#806020', 22, 10, 2, 2); break;
    case 'crown': c('#f0c040', 8, 12, 16, 8); c('#f0c040', 8, 8, 3, 4); c('#f0c040', 15, 6, 3, 6); c('#f0c040', 21, 8, 3, 4); c('#ffffff', 10, 22, 12, 3); break;
    case 'aura': c('#1a1a22', 12, 8, 8, 16); c('#b98cff', 6, 4, 2, 20); c('#b98cff', 24, 4, 2, 20); c('#d0b0ff', 10, 2, 12, 2); break;
    case 'book': c('#8a5a32', 7, 6, 18, 18); c('#f0ead8', 9, 8, 14, 14); c('#303030', 11, 11, 10, 1); c('#303030', 11, 14, 8, 1); break;
    case 'nose': c('#f0c39a', 10, 4, 12, 20); c('#d89a7a', 15, 10, 9, 9); c('#3a2020', 17, 17, 2, 2); break;
    case 'coin': c('#e0c040', 9, 7, 14, 14); c('#b09020', 14, 10, 4, 8); break;
    case 'ad': c('#ff4a4a', 4, 6, 24, 16); c('#ffffff', 7, 10, 18, 2); c('#ffffff', 7, 14, 12, 2); break;
    case 'sun': c('#ffd040', 11, 9, 10, 10); for (let i = 0; i < 4; i++) c('#ffd040', 4 + i * 7, 3, 2, 3); break;
    case 'angry': c('#f0c39a', 9, 6, 14, 16); c('#202020', 11, 10, 4, 1); c('#202020', 17, 10, 4, 1); c('#802020', 13, 17, 6, 2); break;
    case 'star': c('#e0c040', 14, 4, 4, 20); c('#e0c040', 6, 12, 20, 4); break;
    default: c('#a0a0b0', 8, 8, 16, 12);
  }
}

registerMinigame('phone_feed', {
  title: 'Телефон: лента соцсети',
  music: 'minigame',
  keys: ['Z — лайк посту в центре', '↓ — листать быстрее, ↑ — медленнее', 'Лайкай друзей, не лайкай кринж и рекламу', 'X — спрятать. Лайк во время лага улетит не туда!'],
  describe: () => `Набери ${B.target} правильных лайков за ${B.duration} с.`,
  create: (ctx) => new PhoneGame(ctx, (rng, p) => new FeedInner(rng, p), { duration: B.duration, title: 'Лента', help: ['Z — лайк', '↓ быстрее, ↑ медленнее'] }),
});
