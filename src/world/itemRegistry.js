import { BlockInfo } from './blocks.js';
import { FarmItemInfo } from '../farming/items.js';

export function getItemInfo(id) {
  return BlockInfo[id] ?? FarmItemInfo[id] ?? { name: '?', color: 0xffffff };
}
