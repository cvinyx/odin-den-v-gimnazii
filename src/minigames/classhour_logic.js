// Логика «Классного часа» (У-2) без отрисовки — для игры, тестов и симулятора.
import { BALANCE } from '../../data/balance.js';
import { eventRng } from '../game/day.js';

const C = () => BALANCE.classhour;
export const CLASSHOUR_TOPICS = ['belaz', 'brsm', 'rules', 'career', 'pdd', 'health'];

// Тема недели — по коду (одна на всю неделю).
export function classhourTopic(state) { return eventRng(state, 'classhour-topic').pick(CLASSHOUR_TOPICS); }

// Чистая логика (для тестов и бота).
export class ClasshourLogic {
  constructor(rng, p = {}) {
    this.rng = rng;
    this.boil = 0;
    this.round = 0;
    this.rounds = p.rounds || C().rounds;
    this.finished = false; this.result = null; this.kicked = false;
  }
  // Ход друзей: каждый добавляет немного.
  friendTurn() {
    const [a, b] = C().friendBoil;
    const d = this.rng.int(a, b);
    this.boil = Math.min(100, this.boil + d);
    return d;
  }
  // Ход Ромы: level 1..3.
  romaTurn(level) {
    const P = C().romaBoil[level - 1];
    this.boil = Math.min(100, this.boil + P);
    if (level === 3 && this.rng.chance(C().kickChance)) { this.kicked = true; this.finished = true; this.result = 'lose'; return P; }
    this.round++;
    if (this.boil >= 100) { this.finished = true; this.result = 'win'; }
    else if (this.round >= this.rounds) { this.finished = true; this.result = 'lose'; }
    return P;
  }
}

