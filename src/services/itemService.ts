import axiosInstance from '../config/axiosConfig';
import type { Item } from './syncService';

let cachedItems: Record<string, Item> | null = null;
let itemsList: Item[] = [];

const normalizeName = (name: string) => (name ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();

const makeAbsoluteImage = (image?: string | null) => {
  if (!image) return undefined;
  if (image.startsWith('http')) return image;
  const base = (axiosInstance.defaults.baseURL as string) || '';
  return image.startsWith('/') ? `${base}${image}` : `${base}/${image}`;
};

export const precacheImageUrls = (urls: Array<string | null | undefined>) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const uniqueUrls = [...new Set(urls.filter(Boolean))] as string[];
  if (uniqueUrls.length === 0) return;

  const message = { type: 'PRECACHE_IMAGES', urls: uniqueUrls };

  navigator.serviceWorker.ready
    .then((registration) => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
        return;
      }

      registration.active?.postMessage(message);
    })
    .catch(() => {
      // SW not ready; image requests will still be cached lazily via fetch handler.
    });
};

const precacheItemImages = (items: Item[]) => {
  precacheImageUrls(items.map((item) => item.image));
};

export type ItemService = {
  fetchItems: () => Promise<Item[]>;
  getCachedItems: () => Record<string, Item> | null;
  getItemByName?: (name: string) => Item | undefined;
  getItemByKey: (nameOrId: string) => Item | undefined;
};

const longestCommonSubstring = (a: string, b: string) => {
  const m = a.length;
  const n = b.length;
  const table: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  let longest = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
        if (table[i][j] > longest) longest = table[i][j];
      }
    }
  }
  return longest;
};

const getItemByKeyImpl = (nameOrId: string): Item | undefined => {
  if (!cachedItems) return undefined;
  const raw = nameOrId ?? '';
  const key = normalizeName(raw);
  if (cachedItems[key]) return cachedItems[key];

  // Try fuzzy strategies in order of cheap -> expensive
  // 1) check if any normalized map key contains the key
  for (const k of Object.keys(cachedItems)) {
    if (k.includes(key) || key.includes(k)) return cachedItems[k];
  }

  // 2) token intersection: split original names and key into words
  const keyTokens = raw.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (keyTokens.length) {
    for (const it of itemsList) {
      const nameTokens = (it.itemName ?? it.itemId ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const common = nameTokens.filter((t) => keyTokens.includes(t));
      if (common.length > 0) return it;
    }
  }

  // 3) longest common substring heuristic (allow partial overlap)
  const MIN_LCS = 5;
  for (const it of itemsList) {
    const n = normalizeName(it.itemName ?? it.itemId ?? '');
    const lcs = longestCommonSubstring(n, key);
    if (lcs >= MIN_LCS) return it;
  }

  return undefined;
};

const itemService: ItemService = {
  fetchItems: async (): Promise<Item[]> => {
    const resp = await axiosInstance.get<{ items: Item[] }>('/items');
    const items = resp.data?.items ?? [];

    // normalize images and build lookup map with multiple keys (name and id)
    itemsList = items.map((it) => ({ ...it, image: makeAbsoluteImage(it.image) }));

    const map: Record<string, Item> = {};
    for (const it of itemsList) {
      const rawName = it.itemName ?? it.itemId ?? '';
      const byName = normalizeName(rawName);
      const byId = normalizeName(it.itemId ?? '');
      // also handle possessive forms like "Berserker's Greaves" -> "Berserker Greaves"
      const noPossessive = rawName.replace(/'s/gi, '');
      const byNameNoPoss = normalizeName(noPossessive);

      if (byName) map[byName] = it;
      if (byNameNoPoss) map[byNameNoPoss] = it;
      if (byId) map[byId] = it;
    }


    cachedItems = map;
    precacheItemImages(itemsList);
    return itemsList;
  },

  getCachedItems: (): Record<string, Item> | null => cachedItems,

  getItemByKey: getItemByKeyImpl,
  getItemByName: getItemByKeyImpl,
};

export default itemService;
