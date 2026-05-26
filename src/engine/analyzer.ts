import { championTags } from "./championTags";
import type { ChampionTag, RecommendationContext } from "./types";

const normalizeChampionName = (champion: string): string =>
  champion.replace(/[^a-z0-9]/gi, "").toLowerCase();

const normalizedChampionTags = new Map<string, ChampionTag[]>(
  Object.entries(championTags).map(([champion, tags]) => [
    normalizeChampionName(champion),
    tags,
  ]),
);

export const getChampionTags = (champion: string): ChampionTag[] =>
  normalizedChampionTags.get(normalizeChampionName(champion)) ?? [];

export const getEnemyTeamTags = (enemyChampions: string[]): ChampionTag[] =>
  enemyChampions.flatMap(getChampionTags);

export const countTags = (
  tags: ChampionTag[],
): Partial<Record<ChampionTag, number>> =>
  tags.reduce<Partial<Record<ChampionTag, number>>>((counts, tag) => {
    counts[tag] = (counts[tag] ?? 0) + 1;
    return counts;
  }, {});

export const analyzeEnemyChampions = (
  myChampion: string,
  enemyChampions: string[],
): RecommendationContext => {
  const myChampionTags = getChampionTags(myChampion);
  const enemyTags = getEnemyTeamTags(enemyChampions);

  return {
    myChampion,
    myChampionTags,
    tags: [...new Set(enemyTags)],
    counts: countTags(enemyTags),
  };
};
