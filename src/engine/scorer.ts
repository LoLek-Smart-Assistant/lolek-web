import { recommendationRules } from "./rules";
import type {
  ChampionBuildProfile,
  ItemScore,
  RecommendationContext,
  RecommendationRule,
  MayhemItemEntry,
} from "./types";
import type { Item } from "../services";

const CORE_ITEM_SCORE = 1000;
const MAYHEM_SUGGESTED_ITEM_SCORE = 200;
const CORE_BOOT_SCORE = 40;

const normalizeItemKey = (item: string) =>
  item
    .replace(/'s/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

const addItemScore = (
  scores: Map<string, ItemScore>,
  itemKey: string,
  displayName: string,
  score: number,
  reason: string,
  image?: string | null,
) => {
  const current = scores.get(itemKey);

  if (current) {
    current.score += score;
    current.reasons.push(reason);
    if (!current.image && image) current.image = image;
    return;
  }

  scores.set(itemKey, {
    item: displayName,
    score,
    reasons: [reason],
    image: image ?? null,
  });
};

const ruleMatchesContext = (
  rule: RecommendationRule,
  context: RecommendationContext,
): boolean => {
  // Check if enemy tags match the rule requirements
  if (!rule.requiredTags.every((tag) => (context.counts[tag] ?? 0) > 0)) {
    return false;
  }

  // If the rule specifies compatible champion tags, check if the player's champion has at least one
  if (
    rule.compatibleChampionTags &&
    rule.compatibleChampionTags.length > 0
  ) {
    return rule.compatibleChampionTags.some((tag) =>
      context.myChampionTags.includes(tag)
    );
  }

  return true;
};

const buildEnemyTagCounts = (
  enemyCurrentItems: string[],
  itemsCatalog?: Record<string, Item> | null,
): Record<string, number> => {
  const enemyTagCounts: Record<string, number> = {};

  for (const enemyItemName of enemyCurrentItems) {
    const key = normalizeItemKey(enemyItemName);
    const meta = itemsCatalog?.[key];
    const customTags = (meta?.customTags ?? []).map((tag) => tag.toLowerCase());

    for (const tag of customTags) {
      enemyTagCounts[tag] = (enemyTagCounts[tag] ?? 0) + 1;
    }
  }

  return enemyTagCounts;
};

const buildCounterTagBoosts = (
  enemyTagCounts: Record<string, number>,
  customTagCounterMap: Record<string, string[]>,
): Record<string, number> => {
  const counterTagBoosts: Record<string, number> = {};

  for (const [enemyTag, count] of Object.entries(enemyTagCounts)) {
    const counters = customTagCounterMap[enemyTag] ?? [];
    for (const counterTag of counters) {
      counterTagBoosts[counterTag] = (counterTagBoosts[counterTag] ?? 0) + count;
    }
  }

  return counterTagBoosts;
};

const getPriorityTags = (
  entry: MayhemItemEntry,
  itemsCatalog?: Record<string, Item> | null,
): string[] => {
  const normalized = normalizeItemKey(entry.item);
  return (
    entry.customTags ?? itemsCatalog?.[normalized]?.customTags ?? []
  )
    .map((tag) => tag.toLowerCase())
    .filter(Boolean);
};

const getRuleItems = (
  rule: RecommendationRule,
  buildProfile: ChampionBuildProfile,
): string[] => {
  if (!rule.situationalItemCategory) {
    return [rule.recommendItem];
  }

  return (
    buildProfile.situationalItems[rule.situationalItemCategory] ?? [
      rule.recommendItem,
    ]
  );
};

export const scoreItems = (
  buildProfile: ChampionBuildProfile,
  context: RecommendationContext,
  rules: RecommendationRule[] = recommendationRules,
  itemsCatalog?: Record<string, Item> | null,
  options?: {
    mayhemCoreItems?: MayhemItemEntry[];
    mayhemSuggestedItems?: MayhemItemEntry[];
    enemyCurrentItems?: string[];
    customTagCounterMap?: Record<string, string[]>;
  },
): ItemScore[] => {
  const scores = new Map<string, ItemScore>();
  const mayhemCoreItems = options?.mayhemCoreItems ?? [];
  const mayhemSuggestedItems = options?.mayhemSuggestedItems ?? [];
  const enemyCurrentItems = options?.enemyCurrentItems ?? [];
  const customTagCounterMap = options?.customTagCounterMap ?? {};
  const enemyTagCounts = buildEnemyTagCounts(enemyCurrentItems, itemsCatalog);
  const counterTagBoosts = buildCounterTagBoosts(enemyTagCounts, customTagCounterMap);

  for (const entry of mayhemCoreItems) {
    const key = normalizeItemKey(entry.item);
    const coreMeta = itemsCatalog?.[key];
    const display = coreMeta?.itemName ?? entry.item;
    addItemScore(scores, key, display, CORE_ITEM_SCORE, `Mayhem core item for ${context.myChampion}`, coreMeta?.image ?? entry.image ?? null);
  }

  for (const entry of mayhemSuggestedItems) {
    const key = normalizeItemKey(entry.item);
    const meta = itemsCatalog?.[key];
    const display = meta?.itemName ?? entry.item;
    const priorityTags = getPriorityTags(entry, itemsCatalog);
    const tagBoost = priorityTags.reduce((total, tag) => total + ((counterTagBoosts[tag] ?? 0) * 15), 0);
    addItemScore(
      scores,
      key,
      display,
      MAYHEM_SUGGESTED_ITEM_SCORE + tagBoost,
      tagBoost > 0
        ? `Mayhem suggested item; tag priority from ${priorityTags.join(', ')}`
        : `Mayhem suggested item`,
      meta?.image ?? entry.image ?? null,
    );
  }

  for (const item of buildProfile.coreItems) {
    const key = normalizeItemKey(item);
    const coreMeta = itemsCatalog?.[key];
    const display = coreMeta?.itemName ?? item;
    addItemScore(scores, key, display, 50, `Core ${context.myChampion} item`, coreMeta?.image ?? null);
  }

  for (const boot of buildProfile.coreBoots) {
    const key = normalizeItemKey(boot);
    const bootMeta = itemsCatalog?.[key];
    const display = bootMeta?.itemName ?? boot;
    addItemScore(scores, key, display, CORE_BOOT_SCORE, `Core ${context.myChampion} boots`, bootMeta?.image ?? null);
  }

  // Apply enemy-tag rules generically; the rule data decides what can score.
  for (const rule of rules) {
    if (!ruleMatchesContext(rule, context)) {
      continue;
    }

    for (const item of getRuleItems(rule, buildProfile)) {
      // If we have an items catalog, ensure the item is compatible with the player's champion
      const normalized = item.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const meta = itemsCatalog?.[normalized];

      if (meta) {
        const itemTags = (meta.tags ?? []).map((t) => t.toLowerCase());
        const champTags = context.myChampionTags;

        const isCompatible = (() => {
          if (itemTags.length === 0) return true;
          // direct intersection
          if (itemTags.some((tag) => champTags.some((champTag) => champTag === tag))) return true;

          const apKeywords = ["ap", "abilitypower", "magic", "spell"];
          const adKeywords = ["ad", "attackdamage", "physical", "crit"];
          const tankKeywords = ["tank", "health", "hp", "armor", "resist"];
          const supportKeywords = ["support", "heal", "shield"];

          if (itemTags.some((t) => apKeywords.includes(t))) return champTags.includes("ap");
          if (itemTags.some((t) => adKeywords.includes(t))) return champTags.includes("ad");
          if (itemTags.some((t) => tankKeywords.includes(t))) return (
            champTags.includes("tank") || champTags.includes("frontline")
          );
          if (itemTags.some((t) => supportKeywords.includes(t))) return champTags.includes("support");

          return true;
        })();

        if (!isCompatible) continue;
      }

      const display = meta?.itemName ?? item;
      addItemScore(scores, normalizeItemKey(display), display, rule.score, rule.reason, meta?.image ?? null);
    }
  }

  // Counter enemy builds based on observed customTags on their current items.
  if (enemyCurrentItems.length > 0 && itemsCatalog) {
    if (Object.keys(counterTagBoosts).length > 0) {
      for (const meta of Object.values(itemsCatalog)) {
        const itemCustomTags = (meta.customTags ?? []).map((tag) => tag.toLowerCase());
        if (!itemCustomTags.length) continue;

        let bonus = 0;
        const matchedCounterTags: string[] = [];
        for (const counterTag of itemCustomTags) {
          const boost = counterTagBoosts[counterTag] ?? 0;
          if (boost > 0) {
            bonus += 15 * boost;
            matchedCounterTags.push(counterTag);
          }
        }

        if (bonus <= 0) continue;

        const itemKey = normalizeItemKey(meta.itemName);
        addItemScore(
          scores,
          itemKey,
          meta.itemName,
          bonus,
          `Counters enemy build tags via ${matchedCounterTags.join(", ")}`,
          meta.image ?? null,
        );
      }
    }
  }

  return [...scores.values()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.item.localeCompare(right.item);
  });
};
