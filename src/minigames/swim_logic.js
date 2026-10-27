// Логика урока плавания (У-3) без отрисовки — для игры, тестов и бота.
// Иван Владимирович по кругу: даёт команду («Две дорожки кролем!») → заплыв → снова команда → заплыв →
// уходит (свободное время: брызгаться, притопить друга) → возвращается. Так до конца урока.
// Заплыв: чередуй ← и → — каждый правильный гребок толкает вперёд; выносливость тратится на гребки
// и восстанавливается, когда не гребёшь; её запас меньше от затяжек за день и голода.
import { BALANCE } from '../../data/balance.js';

const S = () => BALANCE.swim;

export class SwimLogic {
  // p: { swimmers: [id] (без Ромы), romaBench: bool, staminaMax (0..1), duration }
  constructor(rng, p = {}) {
    this.rng = rng;
    this.p = p;
    const C = S();
    this.duration = p.duration || C.duration;
    this.t = 0;
    this.phase = 'command';
    this.phaseT = C.commandSeconds;
    this.cycle = 0; // номер шага в круге физрука
    this.ivanHere = true;
    this.heat = null;
    this.heats = [];
    this.stamina = 1;
    this.staminaMax = Math.max(0.35, p.staminaMax ?? 1);
    this.lastKey = null;
    this.splashes = 0; this.dunks = 0; this.caughtDunk = 0;
    this.overtakes = { igor: 0, denis: 0 };
    this.events = [];
    this.finished = false;
    this.command = this.rng.int(0, 99);
  }

  startHeat() {
    const C = S();
    const lanes = [{ id: 'roma', x: 0, speed: 0, done: false }];
    for (const id of this.p.swimmers || []) {
      const [a, b] = C.npcSpeed[id] || C.npcSpeed.default;
      lanes.push({ id, x: 0, speed: this.rng.float(a, b), done: false });
    }
    this.heat = { lanes, t: 0, order: [] };
    this.phase = 'heat';
    this.events.push({ type: 'heat' });
  }

  // input: { left: bool (нажато), right: bool, splash: bool, dunk: bool }
  update(dt, input = {}) {
    if (this.finished) return;
    const C = S();
    this.t += dt;
    if (this.phase === 'heat') this.updateHeat(dt, input);
    else {
      this.stamina = Math.min(this.staminaMax, this.stamina + C.staminaRegen * dt);
      this.phaseT -= dt;
      if (this.phase === 'away') this.updateAway(dt, input);
      if (this.phaseT <= 0) this.nextPhase();
    }
    if (this.t >= this.duration && this.phase !== 'heat') { this.finished = true; this.events.push({ type: 'end' }); }
  }

  nextPhase() {
    const C = S();
    // круг: команда → заплыв → команда → заплыв → уходит → (вернулся) команда → …
    if (this.phase === 'command') return this.startHeat();
    if (this.phase === 'away') {
      this.ivanHere = true; this.phase = 'command'; this.phaseT = C.commandSeconds; this.command = this.rng.int(0, 99);
      this.events.push({ type: 'ivan_back' });
      return;
    }
  }

  updateHeat(dt, input) {
    const C = S(), H = this.heat;
    H.t += dt;
    const roma = H.lanes[0];
    // гребок: правильное чередование ← → (повтор той же стороны — слабый гребок)
    for (const side of ['left', 'right']) {
      if (!input[side]) continue;
      const good = this.lastKey !== side;
      this.lastKey = side;
      const power = (good ? C.strokePower : C.strokePower * 0.25) * (0.35 + 0.65 * this.stamina / Math.max(0.01, this.staminaMax));
      roma.speed += power;
      this.stamina = Math.max(0, this.stamina - C.strokeCost);
    }
    roma.speed = Math.max(0, roma.speed - C.drag * roma.speed * dt);
    if (!input.left && !input.right) this.stamina = Math.min(this.staminaMax, this.stamina + C.staminaRegen * 0.5 * dt);
    for (const l of H.lanes) {
      if (l.done) continue;
      const before = l.x;
      if (l.id === 'roma') l.x += l.speed * dt;
      else l.x += l.speed * (0.85 + 0.3 * Math.sin(H.t * 1.7 + l.speed)) * dt;
      if (l.x >= C.distance) { l.x = C.distance; l.done = true; H.order.push(l.id); }
      void before;
    }
    // обгоны Игоря и Дениса
    for (const id of ['igor', 'denis']) {
      const o = H.lanes.find((l) => l.id === id);
      if (!o) continue;
      if (roma.x > o.x && o.wasAhead) { this.overtakes[id]++; this.events.push({ type: 'overtake', id }); }
      o.wasAhead = o.x > roma.x;
    }
    if (H.lanes.every((l) => l.done) || H.t >= C.heatMaxSeconds) {
      for (const l of H.lanes) if (!l.done) H.order.push(l.id);
      const place = H.order.indexOf('roma') + 1;
      this.heats.push({ place, of: H.lanes.length, t: H.t });
      this.events.push({ type: 'heat_end', place });
      this.heat = null;
      this.cycle++;
      if (this.cycle % 2 === 0) {
        this.phase = 'away'; this.ivanHere = false; this.phaseT = this.rng.float(C.awaySeconds[0], C.awaySeconds[1]);
        this.events.push({ type: 'ivan_away' });
      } else { this.phase = 'command'; this.phaseT = C.commandSeconds; this.command = this.rng.int(0, 99); }
    }
  }

  // Пока физрука нет: Z — брызги, X — притопить друга. Иногда он возвращается раньше и застаёт.
  updateAway(dt, input) {
    const C = S();
    if (input.splash) { this.splashes++; this.events.push({ type: 'splash' }); }
    if (input.dunk) {
      this.dunks++;
      if (this.rng.chance(C.earlyReturnChance)) {
        this.caughtDunk++;
        this.events.push({ type: 'caught' });
        this.phaseT = 0;
      } else this.events.push({ type: 'dunk' });
    }
  }

  wins() { return this.heats.filter((h) => h.place === 1).length; }

  // Итог урока: аура за победы, обгоны и шалости, стресс за пойманные шалости и усталость.
  deltas() {
    const C = S();
    const aura = this.wins() * C.winAura + (this.overtakes.igor + this.overtakes.denis) * C.overtakeAura
      + Math.min(C.funCap, this.splashes * C.splashAura + (this.dunks - this.caughtDunk) * C.dunkAura);
    const stress = this.caughtDunk * C.caughtStress - Math.min(5, this.splashes);
    return { aura, stress, hunger: C.hunger };
  }
}

// Бот «среднего» игрока: гребёт в ритм с паузами, иногда брызгается.
export function swimBot(L, rng) {
  let t = 0, side = 'left';
  return (dt) => {
    t += dt;
    const inp = {};
    if (L.phase === 'heat') {
      const rate = L.stamina > 0.25 ? 0.16 : 0.32;
      if (t >= rate) { t = 0; inp[side] = true; side = side === 'left' ? 'right' : 'left'; if (rng.chance(0.08)) side = side === 'left' ? 'right' : 'left'; }
    } else if (L.phase === 'away' && t > 1.5) { t = 0; if (rng.chance(0.5)) inp.splash = true; else if (rng.chance(0.2)) inp.dunk = true; }
    return inp;
  };
}
