// Бот для Playwright: ходит по картам (поиск пути), листает диалоги, выбирает варианты, играет мини-игры —
// всё через нажатия клавиш. Состояние читает из window.__odin.
export class Bot {
  constructor(page, opts = {}) {
    this.page = page;
    this.log = [];
    this.policy = opts.policy || (() => 0);
    this.cheatStyle = opts.cheatStyle || 'cautious';
    this.lossOption = opts.lossOption ?? 2;
    this.baitPick = opts.baitPick || ((round) => [1, 2, 1, 3][round % 4]);
  }

  wait(ms) { return this.page.waitForTimeout(ms); }
  async press(key, ms = 40) { await this.page.keyboard.down(key); await this.wait(ms); await this.page.keyboard.up(key); await this.wait(30); }
  ev(fn, arg) { return this.page.evaluate(fn, arg); }
  async top() { return this.ev(() => { const s = window.__odin.scenes.top; return s ? s.id : null; }); }
  async stack() { return this.ev(() => window.__odin.scenes.stack.map((s) => s.id).join('>')); }

  // Ждать, пока верхняя сцена не станет нужной (или пока идёт переход).
  async waitFor(pred, timeout = 8000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const st = await this.ev(() => ({ top: window.__odin.scenes.top && window.__odin.scenes.top.id, fading: window.__odin.scenes.busy, map: window.__odin.state.location }));
      if (!st.fading && pred(st)) return st;
      await this.wait(50);
    }
    throw new Error('Бот застрял: ожидание не дождалось. Стек: ' + (await this.stack()));
  }

  // Обработать всё «поверх мира»: диалоги, выборы, мини-игры, экраны итогов. until(top) — когда остановиться.
  async handle(until = (t) => t === 'world', timeout = 120000) {
    const t0 = Date.now();
    let baitRound = 0;
    while (Date.now() - t0 < timeout) {
      const s = await this.ev(() => {
        const g = window.__odin; const t = g.scenes.top;
        if (!t) return { id: null };
        const o = { id: t.id, fading: g.scenes.busy, bottom: g.scenes.stack[0].id, map: g.state.location };
        if (t.id === 'dialog') { o.mode = t.mode; o.q = t.choice && t.choice.question; o.opts = t.choice && t.choice.options.map((x) => x.text); o.text = t.box && t.box.pages[0] && t.box.pages.map((p) => p.map((l) => l.map((c) => c.ch).join('')).join(' ')).join(' '); }
        if (t.id === 'choice') { o.q = t.menu.question; o.opts = t.menu.options.map((x) => x.text); }
        if (t.id === 'minigame') {
          o.phase = t.phase; o.game = t.gameId;
          if (t.inst && t.gameId === 'bait') { o.bmode = t.inst.mode; o.opts = t.inst.choice && t.inst.choice.options.map((x) => x.text); }
          if (t.inst && t.gameId === 'cheat') { const L = t.inst.logic; o.cheat = { sees: L.sees, mode: L.mode, peeking: L.peeking, finished: L.finished }; }
          if (t.inst && t.inst.optionsAll) { o.smode = t.inst.mode; o.opts = t.inst.choice && t.inst.choice.options.map((x) => x.text); }
        }
        return o;
      });
      if (s.fading) { await this.wait(60); continue; }
      if (until(s.id, s)) return s;
      switch (s.id) {
        case 'dialog':
          if (s.mode === 'choice') {
            const i = this.policy(s.q || '', s.opts || []);
            this.log.push({ q: s.q, pick: s.opts[i] });
            for (let k = 0; k < i; k++) await this.press('ArrowDown');
            await this.press('z');
          } else await this.press('z');
          break;
        case 'choice': {
          const i = this.policy(s.q || '', s.opts || []);
          this.log.push({ q: s.q, pick: s.opts[i] });
          for (let k = 0; k < i; k++) await this.press('ArrowDown');
          await this.press('z');
          break;
        }
        case 'minigame':
          if (s.phase === 'intro') await this.press('z');
          else if (s.phase === 'play' && s.game === 'cheat') await this.playCheat();
          else if (s.phase === 'play' && s.game === 'bait') {
            if (s.bmode === 'choose') {
              const i = this.baitPick(baitRound++);
              this.log.push({ bait: s.opts[i] });
              for (let k = 0; k < i; k++) await this.press('ArrowDown');
              await this.press('z');
            } else await this.press('z');
          } else if (s.phase === 'play' && s.smode) {
            if (s.smode === 'choose') {
              const i = this.policy('stub', s.opts || []);
              this.log.push({ stub: s.game, pick: (s.opts || [])[i] });
              for (let k = 0; k < i; k++) await this.press('ArrowDown');
              await this.press('z');
            } else await this.press('z');
          } else if (s.phase === 'loss') {
            this.log.push({ loss: this.lossOption });
            for (let k = 0; k < 3; k++) await this.press('ArrowUp');
            const enabled = await this.ev(() => window.__odin.scenes.top.lossMenu.index);
            for (let k = enabled; k < this.lossOption; k++) await this.press('ArrowDown');
            await this.press('z');
          } else if (s.phase === 'outro') {
            const r = await this.ev(() => window.__odin.scenes.top.res);
            this.log.push({ minigame: s.game, result: r.result, grade: r.grade });
            await this.press('z');
          } else await this.wait(50);
          break;
        case 'buffet': case 'school_map': case 'status':
          if (s.id === 'buffet' || s.id === 'school_map' || s.id === 'status') { await this.press('Escape'); break; }
        // eslint-disable-next-line no-fallthrough
        case 'lesson_result': case 'bell': case 'phone': case 'save_code':
          await this.wait(450); await this.press('z'); break;
        default:
          await this.wait(80);
      }
    }
    throw new Error('Бот застрял в сценах: ' + (await this.stack()));
  }

  // «Списывание» нажатиями: держит Z по выбранной стратегии с реакцией ~60 мс.
  async playCheat() {
    let holding = false, safeSince = 0;
    for (;;) {
      const c = await this.ev(() => {
        const t = window.__odin.scenes.top;
        if (!t || t.id !== 'minigame' || t.phase !== 'play') return null;
        const L = t.inst.logic; return { sees: L.sees, mode: L.mode, finished: L.finished, quiz: !!t.inst.quiz };
      });
      if (!c || c.finished) break;
      if (c.quiz) {
        if (holding) { await this.page.keyboard.up('z'); holding = false; }
        await this.wait(150);
        await this.press('z'); // ответить первым вариантом (варианты перемешаны)
        continue;
      }
      let want;
      if (this.cheatStyle === 'greedy') want = !c.sees || !holding;
      else {
        if (c.mode === 'look' && !c.sees) { if (!safeSince) safeSince = Date.now(); } else safeSince = 0;
        want = c.mode === 'look' && !c.sees && Date.now() - safeSince > 200;
      }
      if (want && !holding) { await this.page.keyboard.down('z'); holding = true; }
      if (!want && holding) { await this.page.keyboard.up('z'); holding = false; }
      await this.wait(25);
    }
    if (holding) await this.page.keyboard.up('z');
  }

  async mapInfo() {
    return this.ev(() => {
      const s = window.__odin.scenes.top;
      const m = s.map;
      const solid = [];
      for (let y = 0; y < m.h; y++) { const row = []; for (let x = 0; x < m.w; x++) row.push(m.solidAt(x, y) ? 1 : 0); solid.push(row); }
      const npcs = [];
      for (const n of s.npcs) for (const [ox, oy] of [[-6, -1], [6, -1], [-6, -7], [6, -7]]) npcs.push([Math.floor((n.x + ox) / 16), Math.floor((n.y + oy) / 16)]);
      return { id: s.def.id, w: m.w, h: m.h, solid, npcs, p: [s.player.x, s.player.y] };
    });
  }

  async playerTile() {
    return this.ev(() => { const p = window.__odin.scenes.top.player; return [Math.floor(p.x / 16), Math.floor((p.y - 2) / 16), p.x, p.y]; });
  }

  bfs(info, from, to, avoidNpcs = true) {
    const key = (x, y) => y * info.w + x;
    const blocked = new Set(avoidNpcs ? info.npcs.map(([x, y]) => key(x, y)) : []);
    const prev = new Map([[key(...from), null]]);
    const q = [from];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === to[0] && y === to[1]) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= info.w || ny >= info.h) continue;
        if (info.solid[ny][nx] || prev.has(key(nx, ny))) continue;
        if (blocked.has(key(nx, ny)) && !(nx === to[0] && ny === to[1])) continue;
        prev.set(key(nx, ny), [x, y]);
        q.push([nx, ny]);
      }
    }
    if (!prev.has(key(...to))) return null;
    const path = [];
    for (let c = to; c; c = prev.get(key(...c))) path.unshift(c);
    return path;
  }

  // Дойти до тайла (tx, ty).
  async walkTo(tx, ty, tries = 6) {
    for (let attempt = 0; attempt < tries; attempt++) {
      const info = await this.mapInfo();
      const pt = await this.playerTile();
      const path = this.bfs(info, [pt[0], pt[1]], [tx, ty], attempt < tries - 1) || this.bfs(info, [pt[0], pt[1]], [tx, ty], false);
      if (!path) throw new Error(`Нет пути на ${info.id} от ${pt} до ${tx},${ty}`);
      let ok = true;
      for (let i = 1; i < path.length; i++) {
        if (!(await this.stepTo(path[i]))) { ok = false; break; }
      }
      const end = await this.playerTile();
      if (ok && end[0] === tx && end[1] === ty) return true;
      await this.wait(700); // NPC мешал — подождать и перепланировать
    }
    const dbg = await this.ev(() => { const g = window.__odin; const s = g.scenes.top; return { top: s.id, keys: [...g.input.down], p: s.player && [s.player.x, s.player.y], cd: s.cooldown, stack: g.scenes.stack.map((x) => x.id) }; });
    throw new Error(`Бот не дошёл до ${tx},${ty}: ${JSON.stringify(dbg)}`);
  }

  async stepTo([nx, ny]) {
    const cx = nx * 16 + 8, cy = (ny + 1) * 16 - 2;
    const t0 = Date.now();
    let key = null;
    for (;;) {
      const [tx, ty, x, y] = await this.playerTile();
      const dx = cx - x, dy = cy - y;
      const horiz = tx !== nx; // главная ось шага
      let k = null;
      // сначала точно выровняться по поперечной оси (иначе «ноги» цепляют угол стены)
      if (horiz && Math.abs(dy) > 1.5) k = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      else if (!horiz && ty !== ny && Math.abs(dx) > 1.5) k = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      else if (Math.abs(dx) > 2.5) k = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      else if (Math.abs(dy) > 2.5) k = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      if (k !== key) { if (key) await this.page.keyboard.up(key); if (k) await this.page.keyboard.down(k); key = k; }
      if (!k) return true;
      if (Date.now() - t0 > 2500) { if (key) await this.page.keyboard.up(key); return false; }
      await this.wait(12);
    }
  }

  async face(dir) { await this.press({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir], 60); }

  // Подойти к NPC и поговорить.
  async talkTo(id) {
    const n = await this.ev((id) => { const s = window.__odin.scenes.top; const n = s.npcs.find((n) => n.id === id); return n && [Math.floor(n.x / 16), Math.floor((n.y - 2) / 16)]; }, id);
    if (!n) throw new Error('Нет NPC ' + id);
    const info = await this.mapInfo();
    const spots = [[n[0], n[1] + 1, 'up'], [n[0] - 1, n[1], 'right'], [n[0] + 1, n[1], 'left'], [n[0], n[1] - 1, 'down']]
      .filter(([x, y]) => x >= 0 && y >= 0 && x < info.w && y < info.h && !info.solid[y][x] && !info.npcs.some(([a, b]) => a === x && b === y));
    const why = [];
    for (const [x, y, dir] of spots) {
      try { await this.walkTo(x, y, 4); } catch (e) { why.push(e.message); continue; }
      for (let k = 0; k < 4; k++) {
        await this.face(dir);
        await this.wait(120);
        const tgt = await this.ev(() => { const s = window.__odin.scenes.top; return s.id === 'world' ? { t: s.talkTarget && s.talkTarget.id, cd: s.cooldown } : { t: null, top: s.id }; });
        if (tgt.t === id) {
          await this.press('z');
          await this.wait(150);
          if ((await this.top()) === 'dialog') return true;
        }
        why.push(JSON.stringify(tgt));
        await this.wait(200);
      }
    }
    console.error('talkTo', id, why.join(' | '));
    throw new Error('Не получилось заговорить с ' + id);
  }

  // Войти в дверь/лестницу: встать под ней и упереться вверх.
  async useDoor(x, y) {
    await this.walkTo(x, y + 1);
    await this.page.keyboard.down('ArrowUp');
    await this.wait(400);
    await this.page.keyboard.up('ArrowUp');
    await this.wait(100);
  }
}

// ---------- Навигация по всей школе ----------
// Граф карт: выходы-переходы, проёмы и лестницы. Возвращает следующий шаг к карте с нужным кабинетом.
export function planRoute(data, from, room, goalMap = null) {
  const { MAPS, STAIRWELLS } = data;
  const isGoal = (id) => (goalMap ? id === goalMap : MAPS[id].room === room || (MAPS[id].exits || []).some((e) => e.room === room));
  const prev = new Map([[from, null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (isGoal(cur)) {
      const path = [];
      for (let c = cur; prev.get(c); c = prev.get(c).from) path.unshift(prev.get(c));
      return path;
    }
    const m = MAPS[cur];
    for (const e of m.exits || []) {
      const targets = e.to ? [e.to] : e.stairs && STAIRWELLS[m.building] ? Object.values(STAIRWELLS[m.building]) : [];
      for (const t of targets) {
        if (t === cur || prev.has(t) || MAPS[t].id === 'test_room') continue;
        const floor = e.stairs ? Number(Object.keys(STAIRWELLS[m.building]).find((k) => STAIRWELLS[m.building][k] === t)) : null;
        prev.set(t, { from: cur, exit: e, to: t, floor });
        q.push(t);
      }
    }
  }
  return null;
}

Bot.prototype.data = async function () {
  if (!this._data) this._data = await this.ev(() => JSON.parse(JSON.stringify(window.__odinData)));
  return this._data;
};

Bot.prototype.curMap = async function () {
  return this.ev(() => { const s = window.__odin.scenes.top; return s && s.id === 'world' ? s.def.id : null; });
};

// Подойти к выходу и воспользоваться им (дверь/лестница — упереться; проём — шагнуть за край).
Bot.prototype.useExit = async function (mapId, e) {
  const data = await this.data();
  const m = data.MAPS[mapId];
  const solid = (x, y) => { const ch = (m.rows[y] || '')[x]; return !ch || '#WwDBLTPbSksMtfrhFEYCNKUOQAZvH'.includes(ch); };
  const dirs = [[0, 1, 'ArrowUp'], [-1, 0, 'ArrowRight'], [1, 0, 'ArrowLeft'], [0, -1, 'ArrowDown']];
  if (e.edge) {
    const push = { left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown', up: 'ArrowUp' }[e.edge];
    const [dx, dy] = { left: [1, 0], right: [-1, 0], down: [0, -1], up: [0, 1] }[e.edge];
    await this.walkTo(e.x + dx, e.y + dy);
    await this.page.keyboard.down(push); await this.wait(450); await this.page.keyboard.up(push);
    return;
  }
  for (const [dx, dy, key] of dirs) {
    const sx = e.x + dx, sy = e.y + dy;
    if (solid(sx, sy)) continue;
    try { await this.walkTo(sx, sy); } catch (err) { continue; }
    await this.page.keyboard.down(key); await this.wait(400); await this.page.keyboard.up(key);
    return;
  }
  throw new Error(`Не подойти к выходу ${mapId} ${e.x},${e.y}`);
};

// Дойти до кабинета room (через любые карты) и войти. Возвращает время в пути (мс).
Bot.prototype.goToRoom = async function (room, opts = {}) {
  const t0 = Date.now();
  const data = await this.data();
  for (let hop = 0; hop < 20; hop++) {
    await this.waitFor((s) => s.top === 'world');
    const cur = await this.curMap();
    const m = data.MAPS[cur];
    const door = (m.exits || []).find((e) => e.room === room);
    if (door) { await this.useExit(cur, door); return Date.now() - t0; }
    const path = planRoute(data, cur, room);
    if (!path || !path.length) throw new Error(`Нет маршрута из ${cur} к кабинету ${room}`);
    const step = path[0];
    if (step.floor) this.floorWanted = step.floor;
    await this.useExit(cur, step.exit);
    // лестница: меню этажей
    if (step.exit.stairs) await this.handle((t, s) => t === 'world' && s.map !== cur, 15000);
    // если карта сама «кабинет» (спортзал) — сразу начнётся урок
    const st = await this.waitFor((s) => (s.top === 'world' && s.map !== cur) || s.top === 'dialog' || s.top === 'lesson', 15000);
    if (st.top !== 'world') return Date.now() - t0;
  }
  throw new Error('Слишком длинный путь к ' + room);
};

// Дойти до карты mapId (без входа на урок).
Bot.prototype.goToMap = async function (mapId) {
  const data = await this.data();
  for (let hop = 0; hop < 20; hop++) {
    await this.waitFor((s) => s.top === 'world');
    const cur = await this.curMap();
    if (cur === mapId) return;
    const path = planRoute(data, cur, null, mapId);
    if (!path || !path.length) throw new Error(`Нет маршрута из ${cur} в ${mapId}`);
    const step = path[0];
    if (step.floor) this.floorWanted = step.floor;
    await this.useExit(cur, step.exit);
    if (step.exit.stairs) await this.handle((t, s) => t === 'world' && s.map !== cur, 15000);
    await this.waitFor((s) => s.top === 'world' && s.map !== cur, 15000);
  }
};
