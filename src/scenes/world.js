// Сцена свободного перемещения по карте: Рома ходит и бегает, переходы через двери и лестницы,
// разговоры с NPC, точки взаимодействия (кабинка, раковина), подсказка следующего кабинета.
import { TileMap } from '../world/tilemap.js';
import { Actor, Npc } from '../world/npc.js';
import { findTalkTarget, pointInFront } from '../world/interactions.js';
import { populate } from '../world/population.js';
import { getMapDef, STAIRWELLS, MAPS } from '../world/maps/index.js';
import { BuffetScene, isBigBreak } from './buffet.js';
import { patrolSees, PATROL, DIRA } from '../world/patrol.js';
import { changeStat, scriptStatValue } from '../game/state.js';
import { TILE } from '../gen/tiles.js';
import { GAME_H } from '../engine/renderer.js';
import { BALANCE } from '../../data/balance.js';
import { DialogScene } from './dialog_scene.js';
import { ChoiceScene } from './choice_scene.js';
import { PauseScene } from './pause.js';
import { SchoolMapScene } from './school_map.js';
import { MinigameScene } from './minigame_scene.js';
import { DirectorScene } from './director.js';
import { formatTimer } from '../ui/format.js';
import { audio } from '../engine/audio.js';
import { hintText, nextLesson, roomAction, eventRng } from '../game/day.js';
import { canVapeBattle, vapeReady } from '../minigames/vape_battle.js';
import { BAIT_LIST, EAT_FRIENDS, POWERBANK_LIST, vapeBattlePlaceOk, vapePlaceOk } from '../../data/rules.js';
import { askable, askAnswers } from '../game/ask.js';
import { nextToiletStep } from '../world/route.js';
import { rollBet, creditorReminds } from '../game/bets.js';
import { buyFood } from './buffet.js';
import { rollPowerbank } from '../game/powerbank.js';
import { nextText, countText, testText, gradeText } from '../game/ask.js';
import { hasLabel, labelsOf, labelLines } from '../game/dialogs.js';

const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export class WorldScene {
  // opts: { autosave, restore (взять позицию из state.pos), onAction(name, arg, scene) }
  constructor(mapId, spawnId, opts = {}) {
    this.id = 'world';
    this.mapId = mapId;
    this.spawnId = spawnId;
    this.opts = opts;
  }

  enter(game) {
    this.game = game;
    this.def = getMapDef(this.mapId);
    this.map = new TileMap(this.def);
    const st = game.state;
    const sp = (this.def.spawns || {})[this.spawnId] || Object.values(this.def.spawns || {})[0] || { x: 2, y: 2, dir: 'down' };
    const restore = this.opts.restore && st.location === this.def.id && st.pos && st.pos.x > 0;
    const sx = restore ? st.pos.x : (sp.x + 0.5) * TILE;
    const sy = restore ? st.pos.y : (sp.y + 1) * TILE - 2;
    this.player = new Actor('roma', sx, sy, restore ? st.pos.dir : sp.dir);
    this.npcs = populate(this.def, st, (x, y) => this.map.solidAt(x, y)).map((d) => new Npc(d));
    for (const n of this.npcs) if (n.def.named) n.face(this.npcs.find((o) => o !== n && o.def.named) || this.player);
    this.actors = [this.player, ...this.npcs];
    st.location = this.def.id;
    st.locationName = this.def.name;
    st.pos = { x: Math.round(sx), y: Math.round(sy), dir: this.player.dir };
    this.talkTarget = null;
    this.stepT = 0;
    this.bumpT = 0;
    this.cooldown = 0.3;
    game.playMusic(this.def.music);
    this.updateCamera(true);
    if (this.opts.autosave) game.autosave();
  }

  resume() {
    for (const n of this.npcs) n.busy = false;
    this.game.playMusic(this.def.music);
    this.cooldown = 0.25;
    this.handleActions();
    this.saveProgress();
  }

  saveProgress() {
    const st = this.game.state;
    st.pos = { x: Math.round(this.player.x), y: Math.round(this.player.y), dir: this.player.dir };
  }

  // Отложенные действия из диалогов.
  handleActions() {
    const game = this.game;
    for (const a of game.takeActions()) {
      if (a.name === 'bait') this.startBait(a.arg || (this.lastTalk && this.lastTalk.id));
      else if (a.name === 'play') this.startCompetition(a.arg, this.lastTalk && this.lastTalk.id);
      else if (a.name === 'kid_bait') this.startBait(this.lastTalk && this.lastTalk.id);
      else if (a.name === 'gossip') this.gossip();
      else if (a.name === 'lunch') { const r = buyFood(game.state, 'lunch'); game.toast(r.ok ? 'Съедено: блюдо дня' : r.reason); }
      else if (a.name === 'charge_phone') this.startCharging('phone');
      else if (a.name === 'charge_vape') this.startCharging('vape');
      else if (a.name === 'charge_stop') this.stopCharging('Розетка свободна');
      else if (a.name === 'buffet') game.scenes.push(new BuffetScene());
      else if (a.name === 'director_patrol') game.scenes.push(new DirectorScene({}));
      else if (this.opts.onAction) this.opts.onAction(a.name, a.arg, this);
    }
  }

  startBait(opp) {
    if (!opp) return;
    const game = this.game;
    // ИС-7: байт на перемене — только именные из списка и пятиклассник в кабинке (Л-10), у него ставки нет
    const kid = !!(this.lastTalk && this.lastTalk.def.kid5);
    if (!kid && !BAIT_LIST.includes(opp)) return this.say('С ним не выйдет: байтить можно только своих.');
    const bet = kid ? 0 : rollBet(game.state, opp);
    game.scenes.push(new MinigameScene('bait', {
      opp, bet, params: { opp, kid },
      onDone: (res) => {
        if (res && res.extra && res.extra.rage) {
          game.state.flags.igorRage = true;
          game.scenes.push(new DialogScene('bait_igor', 'rage'));
        }
      },
    }));
  }

  // Соревнования на перемене (раздел 14): ставка как у байта, проверки — белый список, вейп, деньги.
  startCompetition(kind, opp) {
    const game = this.game;
    const st = game.state;
    if (!opp) return;
    if (kind === 'mb') {
      const friend = this.mbFriend || 'denis';
      game.scenes.push(new MinigameScene('bait_mb', { opp: 'matych', params: { friend } }));
      return;
    }
    if (kind === 'vape') {
      if (!canVapeBattle(opp)) return this.say('Этот человек не парит. И тебе не советует.');
      if (!vapeReady(st)) return this.say(st.stats.vapeCharge <= 0 ? 'Вейп сел. Нужна розетка.' : 'Жижка кончилась.');
      game.scenes.push(new MinigameScene('vape', {
        opp, bet: rollBet(st, opp), params: { opp, patrolNear: game.patrolNear },
        onDone: (res) => { if (res && res.extra && res.extra.caught) game.scenes.push(new DirectorScene({})); },
      }));
      return;
    }
    if (kind === 'eat') {
      if (!EAT_FRIENDS.includes(opp)) return this.say('С ним за один стол не подсесть.');
      game.scenes.push(new MinigameScene('eat', { opp, params: { opp } }));
      return;
    }
    if (kind === 'toilet') game.scenes.push(new MinigameScene('toilet', { opp, bet: rollBet(st, opp), params: { opp } }));
  }

  // Что можно предложить собеседнику (условия для меню разговора и вызова от NPC). Правила V2-5:
  // рейджбайт — только именные из BAIT_LIST (ИС-7); вейп-баттл — только туалет/раздевалка и список ИС-7;
  // затянуться — только туалет, раздевалка, класс (ИС-7); безымянные вне туалета — только разговор и сплетня (ИС-8);
  // «Кто больше съест» — на большой перемене с Игорем, Денисом, Гузой, Матычем, Буем (Л-13);
  // пауэрбанк (М-1) и вопросы про уроки (М-7) — у именных.
  miniCtx(n) {
    const st = this.game.state;
    const id = n.id;
    const named = !!n.def.named;
    const intoilet = this.def.toilet ? 1 : 0;
    const incanteen = this.def.id === 'canteen' ? 1 : 0;
    const bigbreak = incanteen && isBigBreak(st) ? 1 : 0;
    const baitok = named && BAIT_LIST.includes(id) ? 1 : 0;
    const vapebattle = vapeBattlePlaceOk(this.def) && canVapeBattle(id) ? 1 : 0;
    const eatok = bigbreak && EAT_FRIENDS.includes(id) ? 1 : 0;
    // «Матыч и Буй»: оба рядом, а собеседник — друг Ромы (он и будет в команде)
    const near = (who) => this.npcs.some((m) => m.id === who && Math.hypot(m.x - this.player.x, m.y - this.player.y) < BALANCE.baitMB.nearPx);
    this.mbFriend = baitok && !['matych', 'buy'].includes(id) && near('matych') && near('buy') ? id : null;
    const mbnear = this.mbFriend ? 1 : 0;
    const playable = baitok || vapebattle || (intoilet && (named || canVapeBattle(id))) || eatok ? 1 : 0;
    // инициатива собеседника: иногда он сам предлагает сыграть (раз за перемену)
    let challenge = 0, chalgame = 0;
    if (st.phase === 'break' && playable && !st.flags['challenged_' + id + '_' + st.lesson]) {
      const rng = eventRng(st, 'challenge:' + id + ':' + st.lesson);
      if (rng.chance(BALANCE.challengeChance)) {
        const games = [baitok && 1, vapebattle && vapeReady(st) && 2, intoilet && named && 3, eatok && 4].filter(Boolean);
        if (games.length) { chalgame = rng.pick(games); challenge = 1; }
      }
    }
    // пауэрбанк: телефон или вейп на 0 %, раз за перемену у одного человека
    const dead = st.stats.battery <= 0 || st.stats.vapeCharge <= 0;
    const power = named && POWERBANK_LIST.includes(id) && dead && st.phase === 'break' && !st.flags['power_' + id + '_' + st.lesson] ? 1 : 0;
    // вопросы ученикам других классов (М-7)
    const askok = named && askable(id) && st.phase === 'break' && !st.flags['asked_' + id + '_' + st.lesson]
      && eventRng(st, `ask:${id}:${st.day}:${st.lesson}`).chance(BALANCE.ask.chance) ? 1 : 0;
    // затянуться — только в разрешённых местах (на уроке — как раньше)
    const vape = st.phase === 'lesson' || vapePlaceOk(this.def) ? scriptStatValue(st, 'vape') : 0;
    return { intoilet, incanteen, bigbreak, mbnear, vapebattle, playable, challenge, chalgame, baitok, baitsolo: baitok && !mbnear ? 1 : 0, eatok, power, askok, vape };
  }

  exitAt(tx, ty) { return (this.def.exits || []).find((e) => e.x === tx && e.y === ty) || null; }
  objectAt(tx, ty) { return (this.def.objects || []).find((o) => o.x === tx && o.y === ty) || null; }

  goTo(mapId, spawn) {
    audio.play('door');
    this.saveProgress();
    this.game.scenes.reset(new WorldScene(mapId, spawn, { onAction: this.opts.onAction }), { fade: true });
    this.cooldown = 10;
  }

  say(text) { this.game.scenes.push(DialogScene.message([text])); }

  useExit(ex) {
    const game = this.game;
    this.cooldown = 0.6;
    if (ex.locked) {
      audio.play('menuDenied');
      if (ex.edge) {
        const [dx, dy] = DIRV[ex.edge];
        this.player.x -= dx * 10; this.player.y -= dy * 10;
      }
      this.say(ex.locked);
      return;
    }
    if (ex.deny) return this.denyToilet(ex.deny);
    if (ex.to) {
      // карта-«кабинет» (спортзал, раздевалка, классы): вход в неё на нужной перемене начинает урок
      const target = MAPS[ex.to];
      if (target && (target.room || target.classRoom) && game.state.flags.diarrheaT > 0) { this.say('Терпеть некогда — сначала в туалет!'); return; }
      if (target && target.room) {
        const act = roomAction(game.state, target.room);
        if (act.type === 'lesson') return this.startLesson(act.n);
        // кабинеты классов открыты только на переменах (Л-22)
        if (target.classRoom && game.state.phase !== 'break') { audio.play('menuDenied'); return this.say(act.text); }
      }
      return this.goTo(ex.to, ex.spawn);
    }
    if (ex.stairs) return this.stairsMenu(ex.stairsSpawn || 'stairs');
    if (ex.room) {
      if (game.state.flags.diarrheaT > 0) return this.say('Терпеть некогда — сначала в туалет!');
      const act = roomAction(game.state, ex.room);
      if (act.type === 'lesson') this.startLesson(act.n);
      else this.say(act.text);
    }
  }

  startLesson(n) {
    const game = this.game;
    audio.play('door');
    this.cooldown = 10;
    this.stopCharging();
    import('./lesson_scene.js').then(({ LessonScene }) => game.scenes.reset(new LessonScene(n), { fade: true }));
  }

  // ---------- Зарядка в библиотеке (раздел 7): одно устройство за раз, пока Рома рядом с розеткой ----------
  startCharging(device) {
    const o = (this.def.objects || []).find((x) => x.kind === 'outlet');
    if (!o) return;
    this.game.state.charging = { device, x: (o.x + 0.5) * TILE, y: (o.y + 1) * TILE + 8, map: this.def.id };
    this.chargeAcc = 0;
    audio.play('statUp');
  }

  stopCharging(msg) {
    const st = this.game.state;
    if (!st.charging) return;
    st.charging = null;
    if (msg) this.game.toast(msg);
  }

  updateCharging(dt) {
    const st = this.game.state;
    const c = st.charging;
    if (!c) return;
    if (c.map !== this.def.id || Math.hypot(this.player.x - c.x, this.player.y - c.y) > 36) { this.stopCharging('Зарядка прервана: отошёл от розетки'); return; }
    const key = c.device === 'phone' ? 'battery' : 'vapeCharge';
    const rate = c.device === 'phone' ? BALANCE.battery.chargePerSecond : BALANCE.vape.chargePerSecond;
    this.chargeAcc += dt * rate;
    while (this.chargeAcc >= 1) { this.chargeAcc -= 1; changeStat(st, key, 1); }
    if (st.stats[key] >= 100) this.stopCharging(c.device === 'phone' ? 'Телефон заряжен' : 'Вейп заряжен');
  }

  faceIdCheck(dt) {
    if (this.faceHold > 0) {
      this.faceHold -= dt;
      this.player.moving = false;
      return true;
    }
    const ch = this.map.charAt ? this.map.charAt(Math.floor(this.player.x / TILE), Math.floor((this.player.y - 2) / TILE)) : null;
    if (ch !== '|') { this.onTurnstile = false; return false; }
    if (this.onTurnstile) return false;
    this.onTurnstile = true;
    const st = this.game.state;
    const fail = eventRng(st, `faceid:${st.day}:${st.phase}:${st.lesson}:${(this.faceN = (this.faceN || 0) + 1)}`).chance(BALANCE.faceId.failChance);
    this.faceFlash = { t: 0.6, ok: !fail };
    if (fail) {
      audio.play('menuDenied');
      this.faceHold = BALANCE.faceId.failDelay;
      const l = labelLines('places', 'faceid_fail')[0];
      if (l) this.game.toast(l.text);
    } else audio.play('menuSelect');
    return false;
  }

  // Женский и учительский туалеты (Л-18): Рому не пускают, аура −5.
  denyToilet(kind) {
    audio.play('menuDenied');
    changeStat(this.game.state, 'aura', BALANCE.toilets.wrongDoorAura);
    this.game.scenes.push(new DialogScene('places', 'wc_' + kind));
  }

  stairsMenu(spawn = 'stairs') {
    const floors = STAIRWELLS[this.def.building];
    if (!floors) return;
    const nums = Object.keys(floors).map(Number);
    const opts = nums.map((n) => ({ text: n === this.def.floorNo ? `${n} этаж (ты здесь)` : `${n} этаж` }));
    this.game.scenes.push(new ChoiceScene('Лестница. На какой этаж?', opts, (i) => {
      if (i < 0 || nums[i] === this.def.floorNo) return;
      this.goTo(floors[nums[i]], spawn);
    }));
  }

  useObject(o) {
    this.cooldown = 0.6;
    // объект с набором реплик (сцена актового зала): метка по коду дня и перемене
    if (o.file && o.pick) {
      const st = this.game.state;
      const labels = labelsOf(o.file).filter((l) => l.startsWith(o.pick));
      const label = eventRng(st, `${o.file}:${st.day}:${st.lesson}:${st.phase}`).pick(labels);
      this.game.scenes.push(new DialogScene(o.file, label));
      return;
    }
    this.game.scenes.push(new DialogScene('objects', o.kind));
  }

  talk(n) {
    const game = this.game;
    const st = game.state;
    n.busy = true;
    n.face(this.player);
    this.player.face(n);
    this.player.moving = false;
    this.lastTalk = n;
    st.met[n.id] = true;
    let file = n.talk.file;
    let label = n.talk.label;
    const flag = `talked_${file}_${label}`;
    if (st.flags[flag]) {
      if (hasLabel(file, label + '_again')) label += '_again';
      else if (n.def.named && hasLabel('npc_again', n.id)) { file = 'npc_again'; label = n.id; }
    }
    st.flags[flag] = true;
    if (n.id === 'vasily') st.flags.metVasily = true;
    game.condCtx = this.miniCtx(n);
    const vars = { dish: BALANCE.dishes[(st.day || 1) - 1] };
    game.scenes.push(new DialogScene(file, label, { opp: n.id, vars, onEnd: () => this.afterTalk(n) }));
    // подколы друзей после диарейного позора (М-2): раз на человека
    if (st.flags.diarrheaSeen && n.def.named && !st.flags['joked_' + n.id]) {
      st.flags['joked_' + n.id] = true;
      const js = labelsOf('places').filter((l) => /^j\d$/.test(l));
      game.scenes.push(new DialogScene('places', eventRng(st, `joke:${n.id}:${st.lesson}`).pick(js), { opp: n.id }));
    }
    if (n.def.named && creditorReminds(st, n.id)) game.scenes.push(new DialogScene('bets', 'remind', { opp: n.id }));
  }

  // После разговора с именным: «Ещё»: пауэрбанк (М-1) и вопросы про уроки (М-7), если можно.
  afterTalk(n) {
    const game = this.game;
    if (game.pendingActions.length || !n.def.named) return;
    const c = this.miniCtx(n);
    const opts = [];
    if (c.power) opts.push({ text: '«Дай пауэрбанк?»', run: () => this.powerbank(n) });
    if (c.askok) opts.push({ text: '«Спросить про уроки.»', run: () => this.askLessons(n) });
    if (!opts.length) return;
    opts.push({ text: 'Больше ничего.', run: () => {} });
    game.scenes.push(new ChoiceScene('Ещё что-то?', opts.map((o) => ({ text: o.text })), (i) => { if (i >= 0 && opts[i]) opts[i].run(); }));
  }

  // М-1: шанс 25 %; при успехе Рома выбирает, что заряжать (до 67–98 %). Раз за перемену у одного человека.
  powerbank(n) {
    const game = this.game, st = game.state;
    st.flags['power_' + n.id + '_' + st.lesson] = true;
    const roll = rollPowerbank(st, n.id);
    if (!roll.ok) { game.scenes.push(new DialogScene('places', 'power_no', { opp: n.id })); return; }
    const lvl = roll.level;
    game.scenes.push(new DialogScene('places', 'power_yes', { opp: n.id, onEnd: () => {
      game.scenes.push(new ChoiceScene(`Что заряжать? (до ${lvl} %)`, [{ text: 'Телефон' }, { text: 'Вейп' }], (i) => {
        if (i < 0) return;
        const key = i === 0 ? 'battery' : 'vapeCharge';
        changeStat(st, key, Math.max(0, lvl - st.stats[key]));
        game.toast(i === 0 ? `Телефон: ${lvl} %` : `Вейп: ${lvl} %`);
      }));
    } }));
  }

  // М-7: вопросы ученику другого класса; ответы — из расписания его класса и «состояния тестов» класса.
  askLessons(n) {
    const game = this.game, st = game.state;
    st.flags['asked_' + n.id + '_' + st.lesson] = true;
    const a = askAnswers(st, n.id);
    const opts = [
      { text: '«Какой у вас следующий урок?»', lines: [nextText(a)] },
      { text: a.test ? `«Вы уже писали тест по предмету «${a.test.subject}»?»` : '«Вы уже писали тест?»', lines: a.test && a.test.wrote ? [testText(a), '(Рома:) А что тебе поставили?', gradeText(a)] : [testText(a)] },
      { text: '«Сколько у вас сегодня уроков?»', lines: [countText(a)] },
    ];
    game.scenes.push(new ChoiceScene('О чём спросить?', opts.map((o) => ({ text: o.text })), (i) => {
      if (i < 0) return;
      game.scenes.push(DialogScene.message(opts[i].lines.map((t) => (t.startsWith('(Рома:)') ? { who: 'roma', text: t.slice(8) } : { who: n.id, text: t })), {}));
    }));
  }

  // ИС-8: сплетня безымянного — одна из пула gossip.txt (40+), по коду дня и месту.
  gossip() {
    const st = this.game.state;
    const n = this.lastTalk;
    const ls = labelsOf('gossip').filter((l) => /^g\d+$/.test(l));
    const label = eventRng(st, `gossip:${st.day}:${st.lesson}:${n ? n.id : ''}:${st.flags.gossipN = (st.flags.gossipN || 0) + 1}`).pick(ls);
    this.game.scenes.push(new DialogScene('gossip', label, { opp: n ? n.id : null }));
  }

  // Диарея (М-2): 30 с до туалета, стрелка-подсказка, не успел — «Это позор» (конец дня).
  updateDiarrhea(dt) {
    const st = this.game.state;
    if (!(st.flags.diarrheaT > 0)) return;
    if (this.def.toilet) { this.diarrheaStall(); return; }
    st.flags.diarrheaT -= dt;
    if (st.flags.diarrheaT <= 0) {
      st.flags.diarrheaT = 0;
      import('./day_flow.js').then(({ DayOverScene }) => this.game.scenes.reset(new DayOverScene('shame'), { fade: true }));
    }
  }

  diarrheaStall() {
    const st = this.game.state;
    st.flags.diarrheaT = 0;
    this.game.scenes.push(new DialogScene('places', 'dia_stall'));
  }

  // Баскетбол (М-3): мяч летит от игрока к кольцу справа; иногда попадает.
  updateBall(dt) {
    const players = this.npcs.filter((n) => n.def.bb);
    if (!players.length) return;
    const B = BALANCE.basketball;
    this.ball = this.ball || { t: 99, from: null, hit: false };
    this.ball.t += dt;
    if (this.ball.t > B.throwEvery) {
      const p = players[Math.floor(this.time2 = (this.time2 || 0) + 1) % players.length];
      const st = this.game.state;
      const rng = eventRng(st, `ball:${st.day}:${st.lesson}:${this.time2}`);
      this.ball = { t: 0, from: { x: p.x, y: p.y - 14 }, hit: rng.chance(B.hitChance) };
    }
  }

  drawBall(r) {
    const b = this.ball;
    if (!b || !b.from || b.t > 1.1) return;
    const hoop = { x: 28 * TILE + 4, y: 9 * TILE };
    const k = Math.min(1, b.t / 1.0);
    const x = b.from.x + (hoop.x - b.from.x) * k;
    const y = b.from.y + (hoop.y - b.from.y) * k - Math.sin(k * Math.PI) * 28 + (b.hit || k < 0.9 ? 0 : (k - 0.9) * 120);
    r.rect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, '#e87a2a');
    r.rect(Math.round(x) - 2, Math.round(y), 5, 1, '#8a3a10');
    if (b.t > 0.95 && b.hit) r.text('+2', Math.round(hoop.x) - 6, Math.round(hoop.y) - 14, { color: '#ffe14d', shadow: '#000' });
  }

  update(dt) {
    const game = this.game;
    const input = game.input;
    const st = game.state;
    game.vapeAllowed = vapePlaceOk(this.def);
    this.updateDiarrhea(dt);
    this.updateBall(dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (st.phase !== 'intro') st.playTime += dt;
    for (const n of this.npcs) n.update(dt, this.map, this.actors);
    game.patrolNear = this.npcs.some((n) => n.def.patrol && patrolSees(n, this.player));
    this.updateCharging(dt);
    this.updateAmbient(dt);
    game.hud.hint = hintText(st);

    if (input.pressed('back') && st.phase !== 'intro') { this.saveProgress(); game.scenes.push(new PauseScene()); return; }
    if (input.pressed('tab')) { game.scenes.push(new SchoolMapScene()); return; }

    const ax = input.axis();
    const run = input.held('run');
    const speed = (run ? BALANCE.move.run : BALANCE.move.walk) * dt;
    let dx = ax.x, dy = ax.y;
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    const moved = this.player.step(dx * speed, dy * speed, this.map, this.actors, dt, run ? 12 : 8);
    // простой: Рома стоит без дела — через 5 с глупо озирается («…» над головой)
    if (this.player.moving || ax.x || ax.y || input.anyPressed()) { if (this.idleT > 5 && this.idleDir) this.player.dir = this.idleDir; this.idleT = 0; this.idleDir = null; }
    else {
      this.idleT = (this.idleT || 0) + dt;
      if (this.idleT > 5) {
        if (!this.idleDir) this.idleDir = this.player.dir;
        this.player.dir = ['down', 'left', 'down', 'right'][Math.floor((this.idleT - 5) / 0.9) % 4];
      }
    }
    if (this.player.moving) {
      this.stepT += dt;
      if (this.stepT > (run ? 0.18 : 0.28)) { this.stepT = 0; audio.play('step'); }
    }
    if (this.cooldown > 0) { this.updateCamera(); return; }

    // турникеты Face-ID сразу за входом (ИС-6): писк и зелёный огонёк, иногда «Лицо не распознано»
    if (this.faceIdCheck(dt)) { this.updateCamera(); return; }

    // выход «на ходу» (проёмы и края карты)
    const ptx = Math.floor(this.player.x / TILE), pty = Math.floor((this.player.y - 2) / TILE);
    const here = this.exitAt(ptx, pty);
    if (here) { this.useExit(here); return; }

    // упёрся в дверь/лестницу или нажал Z перед ней
    const f = pointInFront(this.player, 10);
    const ftx = Math.floor(f.x / TILE), fty = Math.floor(f.y / TILE);
    const front = this.exitAt(ftx, fty);
    const obj = this.objectAt(ftx, fty);
    const pushing = (ax.x || ax.y) && Math.abs(moved.x) + Math.abs(moved.y) < 0.01;
    this.bumpT = pushing && (front || obj) ? this.bumpT + dt : 0;

    this.talkTarget = findTalkTarget(this.player, this.npcs);
    if (input.pressed('confirm')) {
      if (this.talkTarget) { input.consume('confirm'); this.talk(this.talkTarget); return; }
      if (front) { input.consume('confirm'); this.useExit(front); return; }
      if (obj) { input.consume('confirm'); this.useObject(obj); return; }
    }
    if (this.bumpT > 0.15) {
      this.bumpT = 0;
      if (front) this.useExit(front); else if (obj) this.useObject(obj);
      return;
    }
    this.updateCamera();
  }

  // Гомон и шаги в коридорах на переменах (звук без влияния на логику — свой простой генератор).
  updateAmbient(dt) {
    if (this.def.ambient !== 'crowd' || this.game.state.phase !== 'break') return;
    this.ambT = (this.ambT || 0) - dt;
    if (this.ambT > 0) return;
    this.ambSeed = ((this.ambSeed || 12345) * 1103515245 + 12345) & 0x7fffffff;
    this.ambT = 0.15 + (this.ambSeed % 1000) / 1000 * 0.5;
    audio.play(this.ambSeed % 5 === 0 ? 'stepFar' : 'murmur');
  }

  updateCamera(snap = false) {
    const r = this.game.r;
    const vw = 480, vh = GAME_H;
    let cx = this.player.x - vw / 2;
    let cy = this.player.y - 16 - vh / 2;
    cx = this.map.pixelW <= vw ? (this.map.pixelW - vw) / 2 : Math.max(0, Math.min(this.map.pixelW - vw, cx));
    cy = this.map.pixelH <= vh ? (this.map.pixelH - vh) / 2 : Math.max(0, Math.min(this.map.pixelH - vh, cy));
    if (snap) { r.cam.x = cx; r.cam.y = cy; }
    else { r.cam.x += (cx - r.cam.x) * 0.2; r.cam.y += (cy - r.cam.y) * 0.2; }
  }

  // Стрелка к ближайшему мужскому туалету и таймер (М-2).
  drawToiletArrow(r) {
    const T = this.game.state.flags.diarrheaT;
    if (!(T > 0)) return;
    const step = nextToiletStep(this.def.id);
    if (!step) return;
    const tx = step.exit.x * TILE + 8, ty = step.exit.y * TILE + 8;
    const dx = tx - this.player.x, dy = ty - (this.player.y - 8);
    const d = Math.hypot(dx, dy) || 1;
    const ax = this.player.x + (dx / d) * 28, ay = this.player.y - 16 + (dy / d) * 22;
    const ang = Math.atan2(dy, dx);
    const ctx = r.ctx;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#000';
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -6); ctx.lineTo(-2, 0); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  drawLabels(r) {
    const next = nextLesson(this.game.state);
    const showNext = next && (this.game.state.phase === 'late' || this.game.state.phase === 'break');
    for (const ex of this.def.exits || []) {
      if (!ex.label) continue;
      const cx = ex.x * TILE + TILE / 2;
      const y = Math.max(0, ex.y - 1) * TILE + 4;
      const w = r.measure(ex.label) + 4;
      r.rect(cx - w / 2, y, w, 10, '#e8e2cf');
      r.frame(cx - w / 2, y, w, 10, '#3b3346');
      r.text(ex.label, cx, y + 1, { align: 'center', color: '#2a2430' });
      if (showNext && (ex.room || (MAPS[ex.to] || {}).room) === next.room) {
        const bob = Math.round(Math.sin(r.time * 5) * 2);
        r.text('▼', cx, y - 10 + bob, { align: 'center', color: '#ffe14d', shadow: '#000' });
      }
    }
    // таблички (столы классов в столовой, Л-11)
    for (const sg of this.def.signs || []) {
      const cx = sg.x * TILE + TILE / 2, y = sg.y * TILE + 3;
      const w = r.measure(sg.text) + 4;
      r.rect(cx - w / 2, y, w, 10, '#f4f2ea');
      r.text(sg.text, cx, y + 1, { align: 'center', color: '#5a2a2a' });
    }
  }

  draw(r) {
    r.clip(0, 0, 480, GAME_H, () => {
      r.withCamera(() => {
        this.map.draw(r, 480, GAME_H);
        this.drawLabels(r);
        for (const n of this.npcs) if (n.def.patrol) drawPatrolCone(r, n);
        const ch = this.game.state.charging;
        if (ch && ch.map === this.def.id) {
          r.ctx.save(); r.ctx.strokeStyle = '#202020'; r.ctx.lineWidth = 1;
          r.ctx.beginPath(); r.ctx.moveTo(ch.x, ch.y - 12); r.ctx.lineTo(this.player.x + 4, this.player.y - 10); r.ctx.stroke(); r.ctx.restore();
        }
        const sorted = [...this.actors].sort((a, b) => a.y - b.y);
        for (const a of sorted) a.draw(r);
        this.drawBall(r);
        this.drawToiletArrow(r);
        if (this.idleT > 5 && this.game.scenes.top === this) {
          const p = this.player, dots = 1 + Math.floor((this.idleT * 2) % 3);
          r.box(p.x - 9, p.y - 44, 19, 11, '#ffffff', '#ffffff', 1);
          r.rect(p.x - 1, p.y - 33, 2, 2, '#ffffff');
          r.text('.'.repeat(dots), p.x - 6, p.y - 44, { color: '#2a2430' });
        }
        if (this.talkTarget && this.game.scenes.top === this) {
          const n = this.talkTarget;
          const bob = Math.round(Math.sin(r.time * 6));
          r.box(n.x - 5, n.y - 44 + bob, 11, 12, '#ffffff', '#000000', 1);
          r.text('Z', n.x - 2, n.y - 42 + bob, { color: '#ffe14d' });
        }
      });
    });
    if (this.def.tint) r.alpha(0.08, () => r.rect(0, 0, 480, GAME_H, this.def.tint));
    if (this.game.state.flags.diarrheaT > 0) {
      const T = Math.ceil(this.game.state.flags.diarrheaT);
      r.rect(120, 16, 240, 24, '#000000cc');
      r.text('В ТУАЛЕТ! ' + T + ' с', 240, 24, { align: 'center', color: T <= 10 ? '#ff4a4a' : '#ffe14d', scale: 2 });
    }
    if (this.faceFlash && this.faceFlash.t > 0) {
      this.faceFlash.t -= 1 / 60;
      r.alpha(0.18, () => r.rect(0, 0, 480, GAME_H, this.faceFlash.ok ? '#40ff60' : '#ff4040'));
    }
    if (this.game.settings.speedrunTimer && this.game.state.phase !== 'intro') r.text(formatTimer(this.game.state.playTime), 474, 4, { align: 'right', color: '#ffe14d', shadow: '#000' });
    this.game.hud.draw(r, this.game.state, { hint: this.game.scenes.top === this });
  }
}

function drawPatrolCone(r, n) {
  const ctx = r.ctx;
  const a = DIRA[n.dir] * Math.PI / 180, h = PATROL.half * Math.PI / 180;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#ff5050';
  ctx.beginPath();
  ctx.moveTo(n.x, n.y - 14);
  ctx.arc(n.x, n.y - 14, PATROL.len, a - h, a + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
