import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const PLAYER_WIDTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;
const GRAVITY = -22;
const JUMP_SPEED = 8.2;
const WALK_SPEED = 4.5;
const SPRINT_SPEED = 7;

export class FirstPersonController {
  constructor(camera, domElement, world) {
    this.camera = camera;
    this.world = world;
    this.controls = new PointerLockControls(camera, domElement);

    this.velocity = new THREE.Vector3();
    this.position = new THREE.Vector3(0, 20, 0);
    this.onGround = false;

    this.keys = { forward: false, back: false, left: false, right: false, jump: false, sprint: false };

    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
  }

  onKey(e, down) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = down; break;
      case 'KeyS': case 'ArrowDown': this.keys.back = down; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = down; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = down; break;
      case 'Space': this.keys.jump = down; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = down; break;
      default: break;
    }
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }

  getFeetAABB(pos) {
    const hw = PLAYER_WIDTH / 2;
    return {
      minX: pos.x - hw, maxX: pos.x + hw,
      minY: pos.y, maxY: pos.y + PLAYER_HEIGHT,
      minZ: pos.z - hw, maxZ: pos.z + hw,
    };
  }

  collidesAt(pos) {
    const box = this.getFeetAABB(pos);
    const minBX = Math.floor(box.minX), maxBX = Math.floor(box.maxX);
    const minBY = Math.floor(box.minY), maxBY = Math.floor(box.maxY);
    const minBZ = Math.floor(box.minZ), maxBZ = Math.floor(box.maxZ);
    for (let x = minBX; x <= maxBX; x++) {
      for (let y = minBY; y <= maxBY; y++) {
        for (let z = minBZ; z <= maxBZ; z++) {
          if (this.world.isSolidAt(x, y, z)) return true;
        }
      }
    }
    return false;
  }

  moveAxis(axis, amount) {
    if (amount === 0) return;
    const next = this.position.clone();
    next[axis] += amount;
    if (!this.collidesAt(next)) {
      this.position[axis] = next[axis];
      return;
    }
    // Colisão: aproxima do obstáculo por passos pequenos (resolução simples).
    const steps = 8;
    const stepAmount = amount / steps;
    for (let i = 0; i < steps; i++) {
      const tryPos = this.position.clone();
      tryPos[axis] += stepAmount;
      if (this.collidesAt(tryPos)) {
        if (axis === 'y') this.velocity.y = 0;
        break;
      }
      this.position[axis] = tryPos[axis];
    }
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).negate();

    const speed = this.keys.sprint ? SPRINT_SPEED : WALK_SPEED;
    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.back) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);
    if (moveDir.lengthSq() > 0) moveDir.normalize().multiplyScalar(speed);

    this.velocity.x = moveDir.x;
    this.velocity.z = moveDir.z;

    // Gravidade + pulo
    this.velocity.y += GRAVITY * dt;
    if (this.onGround && this.keys.jump) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
    }

    this.moveAxis('x', this.velocity.x * dt);
    this.moveAxis('z', this.velocity.z * dt);
    this.moveAxis('y', this.velocity.y * dt);

    const probe = new THREE.Vector3(this.position.x, this.position.y - 0.05, this.position.z);
    this.onGround = this.velocity.y <= 0 && this.collidesAt(probe);

    this.camera.position.set(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
  }
}
