import {
  championBuilds,
  getChampionBuildProfile,
} from "./championBuilds";
import { analyzeEnemyChampions, getChampionTags } from "./analyzer";
import { scoreItems } from "./scorer";
import type { RecommendationResult } from "./types";
import itemService from "../services/itemService";

// Default fallbacks based on champion type
const getFallbackBuildProfile = (championName: string) => {
  const tags = getChampionTags(championName);

  // Choose appropriate fallback based on champion tags
  if (tags.includes("ap")) {
    return championBuilds.Ahri; // AP caster
  } else if (tags.includes("tank")) {
    return championBuilds.Sion; // Tank
  } else if (tags.includes("support")) {
    return championBuilds.Leona; // Support
  } else if (tags.includes("ad")) {
    return championBuilds.Yasuo; // AD carry
  } else {
    return championBuilds.Yasuo; // Default to AD for unknown champs
  }
};

export const recommendItems = (
  myChampion: string,
  enemyChampions: string[],
  limit = 6,
): RecommendationResult => {
  const buildProfile = getChampionBuildProfile(myChampion) ?? getFallbackBuildProfile(myChampion);

  // Pipeline: champion profile -> enemy semantic tags -> rule scores -> ranked items.
  const itemsCatalog = itemService.getCachedItems();

  const scored = scoreItems(
    buildProfile,
    analyzeEnemyChampions(myChampion, enemyChampions),
    undefined,
    itemsCatalog,
  );

  if (scored.length >= limit) {
    return scored.slice(0, limit);
  }

  // If we don't have enough scored items, fill from the champion's build profile
  const normalizeKey = (name: string) =>
    name
      .replace(/'s/gi, "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();

  const existing = new Set(scored.map((s) => normalizeKey(s.item)));
  const fillers: typeof scored = [];

  const pushIfNew = (name: string, reason = "Fallback build item") => {
    if (!name) return;
    const key = normalizeKey(name);
    if (existing.has(key)) return;
    existing.add(key);
    const meta = itemsCatalog?.[key];
    const display = meta?.itemName ?? name;
    fillers.push({ item: display, score: 1, reasons: [reason], image: meta?.image ?? null });
  };

  // Core items and boots
  for (const it of buildProfile.coreItems) pushIfNew(it, "Core fallback");
  for (const b of buildProfile.coreBoots) pushIfNew(b, "Core boots fallback");

  // All situational items from the profile
  for (const list of Object.values(buildProfile.situationalItems)) {
    for (const it of list ?? []) pushIfNew(it, "Situational fallback");
    if (existing.size >= limit) break;
  }

  const combined = [...scored, ...fillers];
  return combined.slice(0, limit);
};
