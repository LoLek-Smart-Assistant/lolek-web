import { recommendationRules } from "./rules";
import type {
  ChampionBuildProfile,
  ItemScore,
  RecommendationContext,
  RecommendationRule,
} from "./types";
import type { Item } from "../services";

const CORE_ITEM_SCORE = 50;
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
): ItemScore[] => {
  const scores = new Map<string, ItemScore>();

  // Start from the champion's normal build so recommendations are useful even offline.
  for (const item of buildProfile.coreItems) {
    // attach image if available
    const key = normalizeItemKey(item);
    const coreMeta = itemsCatalog?.[key];
    const display = coreMeta?.itemName ?? item;
    addItemScore(scores, key, display, CORE_ITEM_SCORE, `Core ${context.myChampion} item`, coreMeta?.image ?? null);
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
          if (itemTags.some((t) => champTags.includes(t as any))) return true;

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

  return [...scores.values()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.item.localeCompare(right.item);
  });
};
