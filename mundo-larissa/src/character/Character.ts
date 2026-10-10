import Phaser from 'phaser';
import { ART_SCALE, FONT, WALK_SPEED } from '../config';
import { dollComposite, outfitHash } from '../art/doll/compose';
import { DOLL_H, DOLL_OX, DOLL_OY, DOLL_W, type Dir } from '../art/doll/skeleton';
import type { Outfit } from '../core/state';
import { depthAt, tileToWorld } from '../engine/iso';
import type { Pt } from '../engine/pathfinding';

/** Garante a textura da boneca composta no Phaser. */
export function dollTexture(scene: Phaser.Scene, o: Outfit, dir: Dir, frame: number): string {
  const key = `dollc:${outfitHash(o)}:${dir}:${frame}`;
  if (!scene.textures.exists(key)) {
    const { art } = dollComposite(o, dir, frame);
    scene.textures.addCanvas(key, art.source as HTMLCanvasElement);
  }
  return key;
}

export type Facing = 'front' | 'back' | 'left' | 'right';

/**
 * Personagem (Larissa ou NPC) no mundo isométrico: boneca em camadas, sombra,
 * caminhada por uma lista de tiles e animação de passos.
 */
export class Character extends Phaser.GameObjects.Container {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  label?: Phaser.GameObjects.Text;
  outfit: Outfit;
  tx: number;
  ty: number;
  facing: Facing = 'front';
  path: Pt[] = [];
  onArrive?: () => void;
  onStep?: (x: number, y: number) => void;
  private animT = 0;
  private stepIdx = 0;
  private idleT = 0;
  speed = WALK_SPEED;

  constructor(scene: Phaser.Scene, outfit: Outfit, tx: number, ty: number, name?: string) {
    super(scene, 0, 0);
    this.outfit = outfit;
    this.tx = tx;
    this.ty = ty;
    this.shadow = scene.add.ellipse(0, 0, 30, 11, 0x4a3657, 0.18);
    this.sprite = scene.add.image(0, 0, dollTexture(scene, outfit, 'front', 0));
    this.sprite.setOrigin(DOLL_OX / DOLL_W, DOLL_OY / DOLL_H);
    this.sprite.setScale(1 / ART_SCALE);
    this.add([this.shadow, this.sprite]);
    if (name) {
      this.label = scene.add.text(0, -DOLL_H + 4, name, {
        fontFamily: FONT,
        fontSize: '11px',
        color: '#4a3657',
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: { x: 5, y: 2 },
        resolution: 2,
      });
      this.label.setOrigin(0.5, 1);
      this.add(this.label);
    }
    scene.add.existing(this);
    this.place();
  }

  setOutfit(o: Outfit) {
    this.outfit = o;
    this.refresh();
  }

  face(f: Facing) {
    this.facing = f;
    this.refresh();
  }

  /** Vira na direção de um tile. */
  faceTile(x: number, y: number) {
    const a = tileToWorld(this.tx, this.ty);
    const b = tileToWorld(x, y);
    this.facing = facingFromVector(b.x - a.x, b.y - a.y);
    this.refresh();
  }

  private refresh() {
    const dir: Dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    const frame = this.path.length ? [1, 0, 2, 0][this.stepIdx % 4] : 0;
    this.sprite.setTexture(dollTexture(this.scene, this.outfit, dir, frame));
    this.sprite.setFlipX(this.facing === 'left');
  }

  place() {
    const p = tileToWorld(this.tx, this.ty);
    this.setPosition(p.x, p.y);
    this.setDepth(depthAt(this.tx, this.ty) + 1);
  }

  walk(path: Pt[], onArrive?: () => void) {
    this.path = path.slice();
    this.onArrive = onArrive;
    if (!this.path.length) {
      onArrive?.();
      this.onArrive = undefined;
    }
  }

  stop() {
    this.path = [];
    this.onArrive = undefined;
    this.refresh();
  }

  get moving() {
    return this.path.length > 0;
  }

  update(dt: number) {
    if (!this.path.length) {
      this.idleT += dt;
      // pequena "respiração"
      this.sprite.y = Math.sin(this.idleT / 400) * 0.6;
      return;
    }
    this.idleT = 0;
    this.sprite.y = 0;
    const next = this.path[0];
    const dx = next.x - this.tx;
    const dy = next.y - this.ty;
    const dist = Math.hypot(dx, dy);
    const step = (this.speed * dt) / 1000;
    const a = tileToWorld(this.tx, this.ty);
    const b = tileToWorld(next.x, next.y);
    const f = facingFromVector(b.x - a.x, b.y - a.y);
    if (dist <= step) {
      this.tx = next.x;
      this.ty = next.y;
      this.path.shift();
      this.onStep?.(this.tx, this.ty);
    } else {
      this.tx += (dx / dist) * step;
      this.ty += (dy / dist) * step;
    }
    this.animT += dt;
    if (this.animT > 130) {
      this.animT = 0;
      this.stepIdx++;
    }
    if (f !== this.facing || true) {
      this.facing = f;
    }
    this.refresh();
    this.place();
    if (!this.path.length) {
      this.stepIdx = 0;
      this.refresh();
      const cb = this.onArrive;
      this.onArrive = undefined;
      cb?.();
    }
  }
}

export function facingFromVector(vx: number, vy: number): Facing {
  if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) return 'front';
  if (vy < 0 && Math.abs(vx) <= 2.2 * Math.abs(vy)) return 'back';
  if (vy > 0 && Math.abs(vx) < 0.8 * vy) return 'front';
  return vx >= 0 ? 'right' : 'left';
}
