import Phaser from 'phaser';
import { ART_SCALE, FONT } from '../config';
import { artImage, ensureTex, getArt } from '../art/registry';
import { EDGE_H, floorWalkable } from '../art/tiles';
import { Character, dollTexture } from '../character/Character';
import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { isUnlocked, unlockText } from '../core/progress';
import { changed, DEFAULT_OUTFIT, S, type Outfit } from '../core/state';
import { HH, HW, depthAt, tileToWorld, worldToTile } from '../engine/iso';
import { findPath, nearestWalkable, type Pt } from '../engine/pathfinding';
import { getMap } from '../maps';
import { objInfo } from '../maps/objInfo';
import type { MapDef, NpcDef, ObjPlace, PortalDef } from '../maps/types';
import { hiddenActive, npcMarker } from '../missions/missions';
import { anyModalOpen, toast } from '../ui/dom';

interface Target {
  kind: 'npc' | 'station' | 'portal' | 'hidden' | 'object';
  x: number;
  y: number;
  w: number;
  d: number;
  obj: Phaser.GameObjects.GameObject & { getBounds: () => Phaser.Geom.Rectangle; depth: number };
  walkOnto?: boolean;
  act: () => void;
}

interface NpcRt {
  def: NpcDef;
  char?: Character;
  img?: Phaser.GameObjects.Image;
  x: number;
  y: number;
  bubble?: Phaser.GameObjects.Image;
  wanderT: number;
  target?: Target;
}

/** Hooks do modo decoração (preenchidos pelo módulo de casas). */
export interface DecorHooks {
  tapDown?: (scene: WorldScene, wx: number, wy: number) => boolean;
  tapMove?: (scene: WorldScene, wx: number, wy: number) => void;
  tapUp?: (scene: WorldScene, wx: number, wy: number) => boolean;
  active: () => boolean;
}

export function npcOutfit(look?: Partial<Outfit>): Outfit {
  return { skin: 'pele3', hairStyle: 'cab_longo', hairColor: 'cor_castanho', ...look } as Outfit;
}

/**
 * Cena principal: desenha um mapa isométrico, a Larissa, NPCs, portais e o ponto do mini game.
 * Clique/toque no chão para andar (A*).
 */
export class WorldScene extends Phaser.Scene {
  static decor: DecorHooks | null = null;
  m!: MapDef;
  mapId = 'praca';
  fromMap?: string;
  W = 0;
  H = 0;
  floorType: string[] = [];
  blocked!: Uint8Array;
  larissa!: Character;
  npcs: NpcRt[] = [];
  targets: Target[] = [];
  objSprites: Phaser.GameObjects.GameObject[] = [];
  portalAt = new Map<string, PortalDef>();
  hover!: Phaser.GameObjects.Graphics;
  marker!: Phaser.GameObjects.Graphics;
  private down?: { x: number; y: number; moved: boolean };
  private offs: (() => void)[] = [];
  private traveling = false;
  private idleFrontT = 0;

  constructor() {
    super('world');
  }

  init(data: { map?: string; from?: string }) {
    this.mapId = data.map ?? S.location.map ?? 'praca';
    this.fromMap = data.from;
    this.npcs = [];
    this.targets = [];
    this.objSprites = [];
    this.portalAt = new Map();
    this.traveling = false;
  }

  create() {
    const m = getMap(this.mapId) ?? getMap('praca')!;
    this.m = m;
    this.mapId = m.id;
    [this.W, this.H] = m.size;
    document.body.style.background = `linear-gradient(${m.bg[0]}, ${m.bg[1]})`;

    this.computeFloor();
    this.buildFloor();
    if (m.indoor) this.buildWalls();
    this.buildObjects();
    this.buildPortals();
    this.buildStation();
    this.buildNpcs();
    this.buildHidden();

    this.hover = this.add.graphics().setDepth(-90000);
    this.marker = this.add.graphics().setDepth(-89000);

    // Larissa
    const sp = this.spawnPoint();
    this.larissa = new Character(this, S.outfit, sp.x, sp.y);
    this.larissa.onStep = (x, y) => this.onLarissaStep(x, y);

    this.setupCamera();
    this.setupInput();

    this.offs.push(
      bus.on('outfit:changed', () => this.larissa.setOutfit(S.outfit)),
      bus.on('world:travel', (to: string) => this.travel(to)),
      bus.on('state:changed', () => this.refreshMarkers()),
      bus.on('world:refresh', () => this.scene.restart({ map: this.mapId })),
    );
    this.events.once('shutdown', () => {
      this.offs.forEach((f) => f());
      this.offs = [];
    });

    S.location = { map: m.id, x: sp.x, y: sp.y };
    if (!m.id.startsWith('casa')) S.lastOutdoorMap = m.id;
    if (!S.visitedMaps.includes(m.id)) S.visitedMaps.push(m.id);
    changed('location');
    this.cameras.main.fadeIn(280, 255, 250, 245);
    bus.emit('map:entered', m, this);
  }

  // ------------------------------------------------------------------ construção do mapa
  private computeFloor() {
    const { W, H, m } = this;
    this.floorType = new Array(W * H).fill(m.floor.base);
    for (const r of m.floor.rects ?? []) {
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (x < W && y < H) this.floorType[y * W + x] = r.t;
    }
    for (const [x, y] of m.floor.holes ?? []) this.floorType[y * W + x] = '';
    this.blocked = new Uint8Array(W * H);
  }

  floorAt(x: number, y: number) {
    return this.floorType[y * this.W + x];
  }

  private buildFloor() {
    const { W, H } = this;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = this.floorAt(x, y);
        if (!t) continue;
        const v = (x * 7 + y * 13 + x * y) % 4;
        const p = tileToWorld(x, y);
        artImage(this, p.x, p.y, `floor:${t}:${v}`).setDepth(-100000);
        const below = (xx: number, yy: number) => xx >= W || yy >= H || !this.floorAt(xx, yy);
        if (below(x + 1, y)) artImage(this, p.x + HW, p.y, `edge:R:${t}`).setDepth(-100001);
        if (below(x, y + 1)) artImage(this, p.x - HW, p.y, `edge:L:${t}`).setDepth(-100001);
      }
    }
  }

  private buildWalls() {
    const style = this.m.wall ?? 'parede_creme';
    for (let y = 0; y < this.H; y++) {
      const p = tileToWorld(0, y);
      artImage(this, p.x - HW, p.y, `wall:${style}:L`).setDepth(-50000);
    }
    for (let x = 0; x < this.W; x++) {
      const p = tileToWorld(x, 0);
      artImage(this, p.x + HW, p.y, `wall:${style}:R`).setDepth(-50000);
    }
    const c = tileToWorld(0, 0);
    artImage(this, c.x, c.y - HH, `wallcorner:${style}`).setDepth(-49999);
    for (const wo of this.m.wallObjects ?? []) this.addWallObject(wo.type, wo.side, wo.i);
  }

  addWallObject(type: string, side: 'L' | 'R', i: number, key = `wobj:${type}:${side}`) {
    const p = side === 'L' ? tileToWorld(0, i) : tileToWorld(i, 0);
    const img = artImage(this, p.x + (side === 'L' ? -HW : HW), p.y, key).setDepth(-49000);
    this.objSprites.push(img);
    return img;
  }

  /** Coloca objetos (cenário ou móveis) e marca tiles bloqueados. */
  buildObjects(list: ObjPlace[] = this.m.objects) {
    for (const o of list) this.addObject(o);
  }

  addObject(o: ObjPlace): Phaser.GameObjects.Image | null {
    const info = objInfo(o.type);
    if (!info) {
      console.warn('Objeto desconhecido', o.type);
      return null;
    }
    if (info.wall) {
      const side = o.x === 0 && !o.flip ? 'L' : 'R';
      const idx = side === 'L' ? o.y : o.x;
      return this.addWallObject(o.type, side, idx, `${info.artKey}:${side}`);
    }
    const fw = o.flip ? info.d : info.w;
    const fd = o.flip ? info.w : info.d;
    const bx = o.x + fw - 1;
    const by = o.y + fd - 1;
    const p = tileToWorld(bx, by);
    const img = artImage(this, p.x, p.y + HH, info.artKey);
    if (o.flip) {
      const a = getArt(info.artKey);
      img.setFlipX(true);
      img.setOrigin((a.w - a.ox) / a.w, a.oy / a.h);
    }
    img.setDepth(info.flat ? -20000 + depthAt(o.x, o.y) : depthAt(bx, by) - 2);
    if (info.solid) {
      for (let y = o.y; y < o.y + fd; y++) for (let x = o.x; x < o.x + fw; x++) if (this.inside(x, y)) this.blocked[y * this.W + x] = 1;
    }
    this.objSprites.push(img);
    return img;
  }

  private buildPortals() {
    for (const p of this.m.portals) {
      this.portalAt.set(`${p.x},${p.y}`, p);
      const img = this.addObject({ type: 'portal', x: p.x, y: p.y })!;
      const w = tileToWorld(p.x, p.y);
      const target = p.to === 'casa' ? null : getMap(p.to);
      const locked = target ? !isUnlocked(target.id) : false;
      const label = this.add.text(w.x, w.y - 44, `${locked ? '(fechado) ' : ''}${p.label ?? target?.name ?? 'Sair'}`, {
        fontFamily: FONT, fontSize: '13px', color: '#4a3657', backgroundColor: locked ? '#e6e0ee' : '#ffffff',
        padding: { x: 7, y: 3 }, resolution: 2, fontStyle: 'bold',
      }).setOrigin(0.5, 1).setDepth(90000);
      const arrow = artImage(this, w.x, w.y - 16, 'ui:arrow').setDepth(90000);
      this.tweens.add({ targets: arrow, y: w.y - 24, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });
      this.targets.push({ kind: 'portal', x: p.x, y: p.y, w: 1, d: 1, obj: label as never, walkOnto: true, act: () => this.travel(p.to) });
      this.targets.push({ kind: 'portal', x: p.x, y: p.y, w: 1, d: 1, obj: img as never, walkOnto: true, act: () => this.travel(p.to) });
    }
  }

  private buildStation() {
    const mg = this.m.minigame;
    if (!mg) return;
    const img = this.addObject({ type: mg.obj, x: mg.x, y: mg.y });
    if (!img) return;
    const info = objInfo(mg.obj)!;
    const top = img.getBounds().top;
    const cx = img.getBounds().centerX;
    const star = artImage(this, cx, top - 6, 'ui:star').setDepth(90000);
    this.tweens.add({ targets: star, y: top - 16, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: star, angle: 15, yoyo: true, repeat: -1, duration: 900 });
    const act = () => bus.emit('minigame:open', mg.id);
    this.targets.push({ kind: 'station', x: mg.x, y: mg.y, w: info.w, d: info.d, obj: img as never, act });
    this.targets.push({ kind: 'station', x: mg.x, y: mg.y, w: info.w, d: info.d, obj: star as never, act });
  }

  private buildNpcs() {
    for (const def of this.m.npcs) {
      const rt: NpcRt = { def, x: def.x, y: def.y, wanderT: 2000 + Math.random() * 4000 };
      let obj: Target['obj'];
      if (def.animal) {
        const p = tileToWorld(def.x, def.y);
        rt.img = artImage(this, p.x, p.y + HH, `obj:${def.animal}`).setDepth(depthAt(def.x, def.y));
        if (def.mirror) rt.img.setFlipX(true);
        obj = rt.img as never;
      } else {
        rt.char = new Character(this, npcOutfit(def.look), def.x, def.y);
        rt.char.speed = 1.6;
        const f = def.dir === 'side' ? (def.mirror ? 'left' : 'right') : def.dir === 'back' ? 'back' : 'front';
        rt.char.face(f);
        obj = rt.char as never;
      }
      if (!def.wander) this.blocked[def.y * this.W + def.x] = 1;
      this.npcs.push(rt);
      rt.target = {
        kind: 'npc', x: def.x, y: def.y, w: 1, d: 1, obj,
        act: () => {
          if (rt.char) {
            rt.char.stop();
            rt.char.faceTile(Math.round(this.larissa.tx), Math.round(this.larissa.ty));
          }
          if (def.animal) sfx(def.animal.includes('gat') ? 'meow' : 'pop');
          bus.emit('npc:talk', def, this.m.id);
        },
      };
      this.targets.push(rt.target);
    }
    this.refreshMarkers();
  }

  private buildHidden() {
    const hd = this.m.hidden;
    if (!hd || !hiddenActive(this.m.id)) return;
    hd.spots.forEach(([x, y], i) => {
      const id = `${hd.mission}:${i}`;
      if (S.found[id]) return;
      const p = tileToWorld(x, y);
      const img = artImage(this, p.x, p.y, 'ui:hidden').setDepth(depthAt(x, y));
      this.tweens.add({ targets: img, scale: img.scale * 1.15, yoyo: true, repeat: -1, duration: 500 });
      const t: Target = {
        kind: 'hidden', x, y, w: 1, d: 1, obj: img as never, walkOnto: !this.blocked[y * this.W + x],
        act: () => {
          if (S.found[id]) return;
          S.found[id] = true;
          sfx('magic');
          img.destroy();
          this.targets = this.targets.filter((tt) => tt !== t);
          bus.emit('hidden:found', hd.mission, this.m.id, hd.kind);
          changed('found');
        },
      };
      this.targets.push(t);
    });
  }

  refreshMarkers() {
    if (!this.npcs) return;
    for (const rt of this.npcs) {
      const mk = npcMarker(rt.def.id);
      const key = mk === '!' ? 'ui:excl' : mk === '?' ? 'ui:quest' : rt.def.shop ? 'ui:chat' : null;
      if (!key) {
        rt.bubble?.destroy();
        rt.bubble = undefined;
        continue;
      }
      if (!rt.bubble || rt.bubble.texture.key !== key) {
        rt.bubble?.destroy();
        rt.bubble = artImage(this, 0, 0, key).setDepth(95000);
        this.tweens.add({ targets: rt.bubble, scaleY: rt.bubble.scaleY * 1.08, yoyo: true, repeat: -1, duration: 500 });
      }
    }
  }

  // ------------------------------------------------------------------ utilidades da grade
  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.W && y < this.H;
  }

  walkable = (x: number, y: number): boolean => {
    if (!this.inside(x, y)) return false;
    const t = this.floorAt(x, y);
    if (!t || !floorWalkable(t)) return false;
    return !this.blocked[y * this.W + x];
  };

  private spawnPoint(): Pt {
    if (this.fromMap) {
      const p = this.m.portals.find((pp) => pp.to === this.fromMap || (this.fromMap!.startsWith('casa') && pp.to === 'casa'));
      if (p) {
        const n = nearestWalkable(this.W, this.H, (x, y) => this.walkable(x, y) && !this.portalAt.has(`${x},${y}`), p.x, p.y);
        if (n) return n;
      }
    }
    if (!this.fromMap && S.location.map === this.m.id && this.walkable(S.location.x, S.location.y) && !this.portalAt.has(`${S.location.x},${S.location.y}`)) {
      return { x: S.location.x, y: S.location.y };
    }
    const [sx, sy] = this.m.spawn;
    return nearestWalkable(this.W, this.H, this.walkable, sx, sy) ?? { x: sx, y: sy };
  }

  // ------------------------------------------------------------------ câmera e entrada
  private setupCamera() {
    const cam = this.cameras.main;
    const fit = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      const z = Phaser.Math.Clamp(Math.min(w / 1000, (h - 70) / 640), 0.72, 1.5);
      cam.setZoom(z);
      cam.setFollowOffset(0, 30 / z);
    };
    fit();
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
    cam.startFollow(this.larissa, true, 0.09, 0.09);
    // limites suaves: a câmera não se afasta muito do mapa
    const a = tileToWorld(0, 0);
    const b = tileToWorld(this.W - 1, this.H - 1);
    const l = tileToWorld(0, this.H - 1);
    const r = tileToWorld(this.W - 1, 0);
    const pad = 260;
    cam.setBounds(l.x - pad, a.y - pad - (this.m.indoor ? 140 : 60), r.x - l.x + pad * 2, b.y - a.y + pad * 2 + 80);
  }

  private setupInput() {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (anyModalOpen() || this.traveling) return;
      this.down = { x: p.x, y: p.y, moved: false };
      if (WorldScene.decor?.active() && WorldScene.decor.tapDown?.(this, p.worldX, p.worldY)) this.down.moved = true;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.down && Phaser.Math.Distance.Between(p.x, p.y, this.down.x, this.down.y) > 12) this.down.moved = true;
      if (WorldScene.decor?.active()) {
        if (p.isDown) WorldScene.decor.tapMove?.(this, p.worldX, p.worldY);
        this.hover.clear();
        return;
      }
      this.drawHover(p);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const d = this.down;
      this.down = undefined;
      if (WorldScene.decor?.active()) {
        WorldScene.decor.tapUp?.(this, p.worldX, p.worldY);
        return;
      }
      if (!d || d.moved || anyModalOpen() || this.traveling) return;
      this.tap(p.worldX, p.worldY);
    });
  }

  private drawHover(p: Phaser.Input.Pointer) {
    this.hover.clear();
    if (p.wasTouch) return;
    const t = worldToTile(p.worldX, p.worldY);
    const x = Math.round(t.x);
    const y = Math.round(t.y);
    if (!this.inside(x, y) || !this.floorAt(x, y)) return;
    const c = tileToWorld(x, y);
    const ok = this.walkable(x, y);
    this.hover.lineStyle(2, ok ? 0xffffff : 0xf2727a, 0.9);
    this.hover.fillStyle(ok ? 0xffffff : 0xf2727a, 0.22);
    const pts = [new Phaser.Math.Vector2(c.x, c.y - HH), new Phaser.Math.Vector2(c.x + HW, c.y), new Phaser.Math.Vector2(c.x, c.y + HH), new Phaser.Math.Vector2(c.x - HW, c.y)];
    this.hover.fillPoints(pts, true);
    this.hover.strokePoints(pts, true);
  }

  private tap(wx: number, wy: number) {
    // 1) alvos (NPCs, mini game, portais…), do mais da frente para o de trás
    const hits = this.targets
      .filter((t) => t.obj.active !== false && t.obj.getBounds().contains(wx, wy))
      .sort((a, b) => b.obj.depth - a.obj.depth);
    if (hits.length) {
      sfx('click');
      this.goToTarget(hits[0]);
      return;
    }
    // 2) chão
    const t = worldToTile(wx, wy);
    const x = Math.round(t.x);
    const y = Math.round(t.y);
    if (!this.inside(x, y) || !this.floorAt(x, y)) return;
    let goal: Pt | null = { x, y };
    if (!this.walkable(x, y)) goal = nearestWalkable(this.W, this.H, this.walkable, x, y, this.curTile());
    if (!goal) return;
    this.walkTo(goal, () => {
      const portal = this.portalAt.get(`${goal!.x},${goal!.y}`);
      if (portal) this.travel(portal.to);
    });
  }

  curTile(): Pt {
    if (this.larissa.path.length) return this.larissa.path[0];
    return { x: Math.round(this.larissa.tx), y: Math.round(this.larissa.ty) };
  }

  walkTo(goal: Pt, onArrive?: () => void): boolean {
    const start = this.curTile();
    const path = findPath(this.W, this.H, this.walkable, start, goal);
    if (!path) {
      sfx('error');
      return false;
    }
    const full = this.larissa.path.length ? [start, ...path] : path;
    this.larissa.walk(full, onArrive);
    this.showMarker(goal);
    return true;
  }

  private goToTarget(t: Target) {
    if (t.walkOnto) {
      if (!this.walkTo({ x: t.x, y: t.y }, t.act)) t.act();
      return;
    }
    // procura o tile vizinho alcançável mais perto
    const cands: Pt[] = [];
    for (let y = t.y - 1; y <= t.y + t.d; y++) {
      for (let x = t.x - 1; x <= t.x + t.w; x++) {
        const inFoot = x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.d;
        if (!inFoot && this.walkable(x, y)) cands.push({ x, y });
      }
    }
    const start = this.curTile();
    let best: Pt[] | null = null;
    for (const c of cands) {
      const p = findPath(this.W, this.H, this.walkable, start, c);
      if (p && (!best || p.length < best.length)) best = p;
    }
    const face = () => this.larissa.faceTile(t.x + (t.w - 1) / 2, t.y + (t.d - 1) / 2);
    if (!best) {
      // já está do lado ou não dá para chegar: interage mesmo assim se estiver perto
      const dx = Math.abs(start.x - t.x);
      const dy = Math.abs(start.y - t.y);
      if (dx <= t.w + 1 && dy <= t.d + 1) {
        face();
        t.act();
      } else sfx('error');
      return;
    }
    const full = this.larissa.path.length ? [start, ...best] : best;
    this.larissa.walk(full, () => {
      face();
      t.act();
    });
    if (best.length) this.showMarker(best[best.length - 1]);
  }

  private showMarker(p: Pt) {
    const c = tileToWorld(p.x, p.y);
    this.marker.clear();
    this.marker.lineStyle(3, 0xf58fbb, 1);
    this.marker.strokeEllipse(c.x, c.y, 34, 17);
    this.marker.setAlpha(1);
    this.tweens.killTweensOf(this.marker);
    this.tweens.add({ targets: this.marker, alpha: 0, duration: 900, delay: 300 });
  }

  private onLarissaStep(x: number, y: number) {
    S.location = { map: this.m.id, x, y };
    if (Math.random() < 0.5) sfx('step');
    bus.emit('larissa:step', this.m.id, x, y);
  }

  travel(to: string) {
    if (this.traveling) return;
    const target = to === 'casa' ? `casa:${S.currentHouse}` : to;
    if (!isUnlocked(target)) {
      sfx('error');
      const tm = getMap(target);
      toast(`${tm?.name ?? 'Esse lugar'} ainda está fechado. ${unlockText(target)}`, 'warn');
      return;
    }
    if (target === this.m.id) return;
    this.traveling = true;
    this.larissa.stop();
    sfx('whoosh');
    this.cameras.main.fadeOut(250, 255, 250, 245);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ map: target, from: this.m.id });
    });
  }

  // ------------------------------------------------------------------ atualização
  update(_t: number, rawDt: number) {
    const dt = Math.min(rawDt, 100);
    this.larissa.update(dt);
    if (!this.larissa.moving) {
      this.idleFrontT += dt;
      if (this.idleFrontT > 2500 && this.larissa.facing !== 'front') this.larissa.face('front');
    } else this.idleFrontT = 0;
    for (const rt of this.npcs) {
      if (rt.char) {
        rt.char.update(dt);
        if (rt.def.wander) {
          this.wander(rt, dt);
          if (rt.target) {
            rt.target.x = Math.round(rt.char.tx);
            rt.target.y = Math.round(rt.char.ty);
          }
        }
      }
      if (rt.bubble) {
        const src = rt.char ?? rt.img!;
        const top = rt.char ? rt.char.y - 86 : rt.img!.getBounds().top;
        rt.bubble.setPosition(src.x, top - 2);
      }
    }
  }

  private wander(rt: NpcRt, dt: number) {
    const c = rt.char!;
    if (c.moving) return;
    rt.wanderT -= dt;
    if (rt.wanderT > 0) return;
    rt.wanderT = 3000 + Math.random() * 5000;
    const home = rt.def;
    const gx = home.x + Math.floor(Math.random() * 5) - 2;
    const gy = home.y + Math.floor(Math.random() * 5) - 2;
    const lt = this.curTile();
    if (!this.walkable(gx, gy) || (gx === lt.x && gy === lt.y) || this.portalAt.has(`${gx},${gy}`)) return;
    const start = { x: Math.round(c.tx), y: Math.round(c.ty) };
    const p = findPath(this.W, this.H, this.walkable, start, { x: gx, y: gy });
    if (p && p.length < 6) c.walk(p);
  }
}

export { dollTexture, ensureTex, DEFAULT_OUTFIT, EDGE_H };
