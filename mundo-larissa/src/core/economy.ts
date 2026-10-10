import { FULL_REWARD_PLAYS, REDUCED_FACTOR } from '../config';
import { sfx } from './audio';
import { bus } from './events';
import { checkUnlocks } from './progress';
import { changed, S, todayStr } from './state';

/**
 * ECONOMIA
 * - Mini games: 1★ = 15, 2★ = 30, 3★ = 50 moedas (reduzido para 40% depois de 3 partidas no dia).
 * - Missões: 50 a 150 moedas.
 * - Subir de nível dá um bônus de moedas.
 * - Recompensa diária cresce com dias seguidos.
 */
export const STAR_REWARD = [0, 15, 30, 50];
export const DAILY_REWARD = [30, 40, 55, 70, 85, 100, 130];

export function addCoins(n: number, reason = '') {
  if (n <= 0) return;
  S.coins += n;
  S.totalEarned += n;
  changed('coins');
  bus.emit('coins:gained', n, reason);
  checkUnlocks();
}

export function canAfford(n: number) {
  return S.coins >= n;
}

export function spend(n: number): boolean {
  if (S.coins < n) {
    sfx('error');
    return false;
  }
  S.coins -= n;
  changed('coins');
  sfx('coin');
  return true;
}

// ------------------------------------------------------------------ níveis
export function xpForLevel(lv: number) {
  return 60 * lv * (lv - 1);
}

export function levelOf(xp: number) {
  let lv = 1;
  while (xp >= xpForLevel(lv + 1)) lv++;
  return lv;
}

export function levelInfo() {
  const level = levelOf(S.xp);
  const a = xpForLevel(level);
  const b = xpForLevel(level + 1);
  return { level, progress: (S.xp - a) / (b - a) };
}

export function addXp(n: number) {
  const before = levelOf(S.xp);
  S.xp += n;
  const after = levelOf(S.xp);
  changed('xp');
  if (after > before) {
    const bonus = 40 + after * 10;
    addCoins(bonus, 'nivel');
    bus.emit('level:up', after, bonus);
  }
}

// ------------------------------------------------------------------ mini games
function resetPlaysIfNewDay() {
  const t = todayStr();
  if (S.plays.date !== t) S.plays = { date: t, counts: {} };
}

export function playsToday(game: string) {
  resetPlaysIfNewDay();
  return S.plays.counts[game] ?? 0;
}

/** Calcula e entrega a recompensa de uma partida. */
export function rewardMinigame(game: string, stars: number): { coins: number; reduced: boolean; best: boolean } {
  resetPlaysIfNewDay();
  const n = (S.plays.counts[game] ?? 0) + 1;
  S.plays.counts[game] = n;
  const reduced = n > FULL_REWARD_PLAYS;
  const base = STAR_REWARD[Math.max(0, Math.min(3, stars))];
  const coins = reduced ? Math.max(stars > 0 ? 5 : 0, Math.round(base * REDUCED_FACTOR)) : base;
  const best = stars > (S.bestStars[game] ?? 0);
  if (best) S.bestStars[game] = stars;
  changed('plays');
  if (coins > 0) addCoins(coins, `mg:${game}`);
  addXp(5 + stars * 10);
  bus.emit('minigame:result', game, stars);
  return { coins, reduced, best };
}

// ------------------------------------------------------------------ recompensa diária
export function dailyPending(): { streak: number; coins: number } | null {
  const t = todayStr();
  if (S.daily.lastDate === t) return null;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const streak = S.daily.lastDate === todayStr(y) ? S.daily.streak + 1 : 1;
  return { streak, coins: DAILY_REWARD[Math.min(streak, DAILY_REWARD.length) - 1] };
}

export function claimDaily(): number {
  const p = dailyPending();
  if (!p) return 0;
  S.daily = { lastDate: todayStr(), streak: p.streak };
  addCoins(p.coins, 'diaria');
  return p.coins;
}
