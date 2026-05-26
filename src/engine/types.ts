export type ChampionTag =
  | "tank"
  | "healing"
  | "assassin"
  | "burst"
  | "poke"
  | "frontline"
  | "heavy_cc"
  | "ad"
  | "ap"
  | "scaling"
  | "mobile"
  | "high_hp"
  | "support"
  | "shielding"
  | "sustain";

export type SituationalItemCategory =
  | "antiTank"
  | "antiHeal"
  | "antiBurst"
  | "antiAp"
  | "antiAd"
  | "antiCc"
  | "antiPoke";

export interface RecommendationRule {
  id: string;
  requiredTags: ChampionTag[];
  recommendItem: string;
  situationalItemCategory?: SituationalItemCategory;
  score: number;
  reason: string;
  compatibleChampionTags?: ChampionTag[];
}

export interface RecommendationContext {
  myChampion: string;
  myChampionTags: ChampionTag[];
  tags: ChampionTag[];
  counts: Partial<Record<ChampionTag, number>>;
}

export interface ItemScore {
  item: string;
  score: number;
  reasons: string[];
  image?: string | null;
}

export interface ChampionBuildProfile {
  coreItems: string[];
  coreBoots: string[];
  situationalItems: Partial<Record<SituationalItemCategory, string[]>>;
}

export type RecommendationResult = ItemScore[];

export type ItemRecommendation = ItemScore;
