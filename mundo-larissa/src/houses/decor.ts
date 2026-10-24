import Phaser from 'phaser';
import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { bumpStat, S } from '../core/state';
import { FURN_BY_ID } from '../data/furniture';
import { HH, HW, tileToWorld, worldToTile } from '../engine/iso';
import { nearestWalkable } from '../engine/pathfinding';
import { objInfo } from '../maps/objInfo';
import { WorldScene } from '../scenes/WorldScene';
import { setArt } from '../art/registry';
import { toast } from '../ui/dom';
import { canPlace, findSpot, houseIdOf, houseState, isHouseMap, notifyDecor, placedOf } from './houses';

/**
 * MODO DECORAÇÃO
 * Toque num móvel para selecionar, arraste para mudar de lugar.
 * Girar, guardar (volta para o inventário) e colocar móveis novos pelo painel de baixo.
 */
interface Drag {
  uid: number;
  ox: number;
  oy: number;
  cand: { x: number; y: number; flip: boolean } | null;
  moved: boolean;
}

class DecorMode {
  on = false;
  selected: number | null = null;
  scene: WorldScene | null = null;
  private drag: Drag | null = null;
  private gfx: Phaser.GameObjects.Graphics | null = null;

  get houseId() {
    return this.scene ? houseIdOf(this.scene.mapId) : S.currentHouse;
  }

  attach(scene: WorldScene) {
    this.scene = scene;
    this.gfx = null;
    if (!isHouseMap(scene.mapId)) {
      if (this.on) this.exit();
      return;
    }
    if (this.on) {
      scene.larissa.setVisible(false);
      setTimeout(() => this.frameCamera(), 50);
    }
    this.drawSel();
  }

  /** Centraliza o cômodo no espaço acima do painel de decoração. */
  frameCamera() {
    const sc = this.scene;
    if (!sc || !sc.sys.isActive()) return;
    const cam = sc.cameras.main;
    cam.stopFollow();
    const panel = document.getElementById('decor');
    const ph = panel?.offsetHeight ?? 200;
    const hud = 74;
    const c = tileToWorld((sc.W - 1) / 2, (sc.H - 1) / 2);
    const freeH = sc.scale.height - ph - hud;
    const roomH = (sc.W + sc.H) * HH + 110;
    const roomW = (sc.W + sc.H) * HW + 40;
    const z = Phaser.Math.Clamp(Math.min(freeH / roomH, sc.scale.width / roomW), 0.55, 1.4);
    cam.setZoom(z);
    const offsetY = (ph - hud) / 2 / z;
    cam.pan(c.x, c.y - 40 + offsetY, 300, 'Sine.easeInOut');
  }

  enter() {
    if (!this.scene || !isHouseMap(this.scene.mapId)) return;
    this.on = true;
    this.selected = null;
    this.scene.larissa.stop();
    this.scene.larissa.setVisible(false);
    sfx('magic');
    bus.emit('decor:mode', true);
    setTimeout(() => this.frameCamera(), 30);
  }

  exit() {
    this.on = false;
    this.selected = null;
    this.drag = null;
    this.gfx?.clear();
    const sc = this.scene;
    if (sc && sc.sys.isActive()) {
      sc.larissa.setVisible(true);
      sc.resetCamera();
      const t = { x: Math.round(sc.larissa.tx), y: Math.round(sc.larissa.ty) };
      if (!sc.walkable(t.x, t.y)) {
        const n = nearestWalkable(sc.W, sc.H, sc.walkable, t.x, t.y);
        if (n) {
          sc.larissa.tx = n.x;
          sc.larissa.ty = n.y;
          sc.larissa.place();
        }
      }
    }
    bus.emit('decor:mode', false);
  }

  private g() {
    if (!this.scene) return null;
    if (!this.gfx || !this.gfx.scene) this.gfx = this.scene.add.graphics().setDepth(96000);
    return this.gfx;
  }

  /** Contorno do móvel selecionado. */
  drawSel(cand?: { x: number; y: number; flip: boolean; ok: boolean }) {
    const g = this.g();
    if (!g) return;
    g.clear();
    if (!this.on || this.selected === null) return;
    const p = placedOf(this.houseId, this.selected);
    if (!p) return;
    const f = FURN_BY_ID[p.id];
    const x = cand?.x ?? p.x;
    const y = cand?.y ?? p.y;
    const flip = cand?.flip ?? p.flip;
    const ok = cand?.ok ?? true;
    const color = ok ? 0xe9739f : 0xf2727a;
    g.lineStyle(3, color, 1);
    g.fillStyle(ok ? 0xffffff : 0xf2727a, 0.25);
    if (f.kind === 'wall') {
      const side = flip ? 'R' : 'L';
      const i = side === 'L' ? y : x;
      const c = side === 'L' ? tileToWorld(0, i) : tileToWorld(i, 0);
      const ax = side === 'L' ? c.x - HW : c.x;
      const ay = side === 'L' ? c.y : c.y - HH;
      const bx = ax + HW;
      const by = side === 'L' ? ay - HH : ay + HH;
      const pts = [new Phaser.Math.Vector2(ax, ay - 20), new Phaser.Math.Vector2(bx, by - 20), new Phaser.Math.Vector2(bx, by - 70), new Phaser.Math.Vector2(ax, ay - 70)];
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
      return;
    }
    const w = flip ? f.d : f.w;
    const d = flip ? f.w : f.d;
    const top = tileToWorld(x - 0.5, y - 0.5);
    const right = tileToWorld(x + w - 0.5, y - 0.5);
    const bottom = tileToWorld(x + w - 0.5, y + d - 0.5);
    const left = tileToWorld(x - 0.5, y + d - 0.5);
    const pts = [top, right, bottom, left].map((p2) => new Phaser.Math.Vector2(p2.x, p2.y));
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
  }

  private moveSprite(uid: number, x: number, y: number, flip: boolean, ok: boolean) {
    const sc = this.scene!;
    const img = sc.furn.get(uid);
    const p = placedOf(this.houseId, uid);
    if (!img || !p) return;
    const f = FURN_BY_ID[p.id];
    if (f.kind === 'wall') {
      // paredes: reposiciona pelo canto da parede
      const side = flip ? 'R' : 'L';
      const i = side === 'L' ? y : x;
      const c = side === 'L' ? tileToWorld(0, i) : tileToWorld(i, 0);
      setArt(img, `wobj:${p.id}:${side}`);
      img.setPosition(c.x + (side === 'L' ? -HW : HW), c.y);
    } else {
      const info = objInfo(`mov:${p.id}`)!;
      const pose = sc.objPose(info, x, y, flip);
      img.setPosition(pose.x, pose.y);
      img.setDepth(pose.depth + 0.5);
    }
    img.setTint(ok ? 0xffffff : 0xff9a9a);
    img.setAlpha(ok ? 1 : 0.75);
  }

  private pickAt(wx: number, wy: number): number | null {
    const sc = this.scene!;
    let best: { uid: number; depth: number } | null = null;
    for (const [uid, img] of sc.furn) {
      if (!img.getBounds().contains(wx, wy)) continue;
      if (!best || img.depth > best.depth) best = { uid, depth: img.depth };
    }
    return best?.uid ?? null;
  }

  /** Converte o ponteiro em posição (para paredes, escolhe a parede mais perto). */
  private posFor(uid: number, wx: number, wy: number, ox: number, oy: number) {
    const p = placedOf(this.houseId, uid)!;
    const f = FURN_BY_ID[p.id];
    if (f.kind === 'wall') {
      if (wx < 0) {
        const i = Math.round(-wx / HW - 0.5);
        return { x: 0, y: i, flip: false };
      }
      const i = Math.round(wx / HW - 0.5);
      return { x: i, y: 0, flip: true };
    }
    const t = worldToTile(wx, wy);
    return { x: Math.round(t.x - ox), y: Math.round(t.y - oy), flip: p.flip };
  }

  // ---------------------------------------------------------------- ganchos de entrada
  tapDown(wx: number, wy: number): boolean {
    const uid = this.pickAt(wx, wy);
    if (uid === null) {
      this.drag = null;
      return false;
    }
    const p = placedOf(this.houseId, uid)!;
    const t = worldToTile(wx, wy);
    this.selected = uid;
    this.drag = { uid, ox: Math.round(t.x) - p.x, oy: Math.round(t.y) - p.y, cand: null, moved: false };
    sfx('pop');
    this.drawSel();
    bus.emit('decor:select', uid);
    return true;
  }

  tapMove(wx: number, wy: number) {
    const d = this.drag;
    if (!d) return;
    const p = placedOf(this.houseId, d.uid);
    if (!p) return;
    const pos = this.posFor(d.uid, wx, wy, d.ox, d.oy);
    if (d.cand && d.cand.x === pos.x && d.cand.y === pos.y && d.cand.flip === pos.flip) return;
    d.cand = pos;
    d.moved = true;
    const ok = canPlace(this.houseId, FURN_BY_ID[p.id], pos.x, pos.y, pos.flip, d.uid);
    this.moveSprite(d.uid, pos.x, pos.y, pos.flip, ok);
    this.drawSel({ ...pos, ok });
  }

  tapUp(wx: number, wy: number): boolean {
    const d = this.drag;
    this.drag = null;
    if (d && d.moved && d.cand) {
      this.tryMove(d.uid, d.cand.x, d.cand.y, d.cand.flip);
      return true;
    }
    if (d) return true;
    // toque no chão com algo selecionado: leva o móvel até lá
    if (this.selected !== null && this.pickAt(wx, wy) === null) {
      const p = placedOf(this.houseId, this.selected);
      if (p) {
        const pos = this.posFor(this.selected, wx, wy, 0, 0);
        if (this.tryMove(this.selected, pos.x, pos.y, pos.flip, true)) return true;
      }
      this.selected = null;
      this.drawSel();
      bus.emit('decor:select', null);
    }
    return true;
  }

  tryMove(uid: number, x: number, y: number, flip: boolean, quietFail = false): boolean {
    const p = placedOf(this.houseId, uid);
    if (!p) return false;
    const ok = canPlace(this.houseId, FURN_BY_ID[p.id], x, y, flip, uid);
    if (ok) {
      p.x = x;
      p.y = y;
      p.flip = flip;
      sfx('click');
    } else if (!quietFail) {
      sfx('error');
      toast('Não cabe aí! Tente outro lugar.', 'warn');
    }
    this.scene?.rebuildObjects();
    this.drawSel();
    if (ok) notifyDecor();
    return ok;
  }

  // ---------------------------------------------------------------- ações do painel
  placeNew(id: string) {
    const f = FURN_BY_ID[id];
    if (!f || (S.furnitureInv[id] ?? 0) <= 0) return;
    const spot = findSpot(this.houseId, f);
    if (!spot) {
      sfx('error');
      toast('A casa está cheia! Guarde algum móvel primeiro.', 'warn');
      return;
    }
    S.furnitureInv[id]--;
    const uid = S.nextUid++;
    houseState(this.houseId).placed.push({ uid, id, ...spot });
    bumpStat('placed');
    this.selected = uid;
    sfx('pop');
    this.scene?.rebuildObjects();
    this.drawSel();
    notifyDecor();
    bus.emit('decor:select', uid);
  }

  rotate() {
    if (this.selected === null) return;
    const p = placedOf(this.houseId, this.selected);
    if (!p) return;
    const f = FURN_BY_ID[p.id];
    if (f.kind === 'wall') {
      // troca de parede, mantendo a posição
      const i = p.flip ? p.x : p.y;
      if (!this.tryMove(p.uid, p.flip ? 0 : i, p.flip ? i : 0, !p.flip, true)) {
        const spot = findSpot(this.houseId, f);
        toast(spot ? 'Não cabe na outra parede aqui.' : 'Não cabe.', 'warn');
      }
      return;
    }
    if (canPlace(this.houseId, f, p.x, p.y, !p.flip, p.uid)) {
      this.tryMove(p.uid, p.x, p.y, !p.flip);
      return;
    }
    // tenta encaixar perto
    for (const [dx, dy] of [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -1]]) {
      if (canPlace(this.houseId, f, p.x + dx, p.y + dy, !p.flip, p.uid)) {
        this.tryMove(p.uid, p.x + dx, p.y + dy, !p.flip);
        return;
      }
    }
    sfx('error');
    toast('Sem espaço para girar aqui.', 'warn');
  }

  store() {
    if (this.selected === null) return;
    const st = houseState(this.houseId);
    const idx = st.placed.findIndex((p) => p.uid === this.selected);
    if (idx < 0) return;
    const [p] = st.placed.splice(idx, 1);
    S.furnitureInv[p.id] = (S.furnitureInv[p.id] ?? 0) + 1;
    this.selected = null;
    sfx('whoosh');
    this.scene?.rebuildObjects();
    this.drawSel();
    notifyDecor();
    bus.emit('decor:select', null);
  }

  setSurface(kind: 'floor' | 'wall', id: string) {
    const st = houseState(this.houseId);
    if (kind === 'floor') st.floor = id;
    else st.wall = id;
    notifyDecor();
    sfx('magic');
    this.scene?.scene.restart({ map: this.scene.mapId });
  }
}

export const decor = new DecorMode();

export function initDecor() {
  WorldScene.decor = {
    active: () => decor.on,
    tapDown: (_s, wx, wy) => decor.tapDown(wx, wy),
    tapMove: (_s, wx, wy) => decor.tapMove(wx, wy),
    tapUp: (_s, wx, wy) => decor.tapUp(wx, wy),
  };
  bus.on('map:entered', (_m: unknown, scene: WorldScene) => decor.attach(scene));
}
