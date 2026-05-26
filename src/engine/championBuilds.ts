import { championTags } from "./championTags";
import type { ChampionBuildProfile, ChampionTag } from "./types";

const makeProfile = (
  coreItems: string[],
  coreBoots: string[],
  situationalItems: ChampionBuildProfile["situationalItems"],
): ChampionBuildProfile => ({
  coreItems,
  coreBoots,
  situationalItems,
});

const buildTemplates = {
  apMage: makeProfile(
    ["Luden's Companion", "Shadowflame"],
    ["Sorcerer's Shoes"],
    {
      antiTank: ["Liandry's Torment"],
      antiHeal: ["Morellonomicon"],
      antiBurst: ["Zhonya's Hourglass"],
      antiAp: ["Banshee's Veil"],
      antiCc: ["Banshee's Veil"],
      antiPoke: ["Seraph's Embrace"],
    },
  ),
  apAssassin: makeProfile(
    ["Stormsurge", "Shadowflame"],
    ["Sorcerer's Shoes"],
    {
      antiTank: ["Liandry's Torment"],
      antiHeal: ["Morellonomicon"],
      antiBurst: ["Zhonya's Hourglass"],
      antiAp: ["Banshee's Veil"],
      antiCc: ["Banshee's Veil"],
      antiPoke: ["Horizon Focus"],
    },
  ),
  apPoke: makeProfile(
    ["Luden's Companion", "Horizon Focus"],
    ["Sorcerer's Shoes"],
    {
      antiTank: ["Liandry's Torment"],
      antiHeal: ["Morellonomicon"],
      antiBurst: ["Zhonya's Hourglass"],
      antiAp: ["Banshee's Veil"],
      antiCc: ["Banshee's Veil"],
      antiPoke: ["Seraph's Embrace"],
    },
  ),
  apBattleMage: makeProfile(
    ["Rod of Ages", "Liandry's Torment"],
    ["Ionian Boots of Lucidity"],
    {
      antiTank: ["Riftmaker"],
      antiHeal: ["Morellonomicon"],
      antiBurst: ["Zhonya's Hourglass"],
      antiAp: ["Kaenic Rookern"],
      antiAd: ["Zhonya's Hourglass"],
      antiCc: ["Banshee's Veil"],
      antiPoke: ["Seraph's Embrace"],
    },
  ),
  adCarry: makeProfile(
    ["Kraken Slayer", "Infinity Edge"],
    ["Berserker's Greaves"],
    {
      antiTank: ["Lord Dominik's Regards"],
      antiHeal: ["Mortal Reminder"],
      antiBurst: ["Guardian Angel"],
      antiAp: ["Maw of Malmortius"],
      antiAd: ["Guardian Angel"],
      antiCc: ["Mercurial Scimitar"],
      antiPoke: ["Bloodthirster"],
    },
  ),
  adSkirmisher: makeProfile(
    ["Blade of the Ruined King", "Trinity Force"],
    ["Berserker's Greaves"],
    {
      antiTank: ["Blade of the Ruined King"],
      antiHeal: ["Mortal Reminder"],
      antiBurst: ["Immortal Shieldbow"],
      antiAp: ["Maw of Malmortius"],
      antiAd: ["Death's Dance"],
      antiCc: ["Mercurial Scimitar"],
      antiPoke: ["Bloodthirster"],
    },
  ),
  adBruiser: makeProfile(
    ["Trinity Force", "Black Cleaver"],
    ["Plated Steelcaps"],
    {
      antiTank: ["Black Cleaver"],
      antiHeal: ["Chempunk Chainsword"],
      antiBurst: ["Sterak's Gage"],
      antiAp: ["Maw of Malmortius"],
      antiAd: ["Death's Dance"],
      antiCc: ["Mercurial Scimitar"],
      antiPoke: ["Bloodthirster"],
    },
  ),
  adAssassin: makeProfile(
    ["Eclipse", "Youmuu's Ghostblade"],
    ["Ionian Boots of Lucidity"],
    {
      antiTank: ["Black Cleaver"],
      antiHeal: ["Mortal Reminder"],
      antiBurst: ["Guardian Angel"],
      antiAp: ["Maw of Malmortius"],
      antiAd: ["Death's Dance"],
      antiCc: ["Mercurial Scimitar"],
      antiPoke: ["Serylda's Grudge"],
    },
  ),
  tankFrontline: makeProfile(
    ["Heartsteel", "Sunfire Aegis"],
    ["Plated Steelcaps"],
    {
      antiTank: ["Jak'Sho, The Protean"],
      antiHeal: ["Thornmail"],
      antiBurst: ["Sterak's Gage"],
      antiAp: ["Kaenic Rookern"],
      antiAd: ["Randuin's Omen"],
      antiCc: ["Mercury's Treads"],
      antiPoke: ["Warmog's Armor"],
    },
  ),
  tankAP: makeProfile(
    ["Jak'Sho, The Protean", "Sunfire Aegis"],
    ["Mercury's Treads"],
    {
      antiTank: ["Jak'Sho, The Protean"],
      antiHeal: ["Thornmail"],
      antiBurst: ["Sterak's Gage"],
      antiAp: ["Kaenic Rookern"],
      antiAd: ["Randuin's Omen"],
      antiCc: ["Mercury's Treads"],
      antiPoke: ["Warmog's Armor"],
    },
  ),
  tankSupport: makeProfile(
    ["Locket of the Iron Solari", "Zeke's Convergence"],
    ["Mercury's Treads"],
    {
      antiTank: ["Knight's Vow"],
      antiHeal: ["Thornmail"],
      antiBurst: ["Locket of the Iron Solari"],
      antiAp: ["Kaenic Rookern"],
      antiAd: ["Randuin's Omen"],
      antiCc: ["Mercury's Treads"],
      antiPoke: ["Warmog's Armor"],
    },
  ),
  supportEnchanter: makeProfile(
    ["Moonstone Renewer", "Redemption"],
    ["Ionian Boots of Lucidity"],
    {
      antiTank: ["Ardent Censer"],
      antiHeal: ["Oblivion Orb"],
      antiBurst: ["Mikael's Blessing"],
      antiAp: ["Locket of the Iron Solari"],
      antiAd: ["Locket of the Iron Solari"],
      antiCc: ["Mikael's Blessing"],
      antiPoke: ["Redemption"],
    },
  ),
  supportMage: makeProfile(
    ["Locket of the Iron Solari", "Redemption"],
    ["Ionian Boots of Lucidity"],
    {
      antiTank: ["Ardent Censer"],
      antiHeal: ["Oblivion Orb"],
      antiBurst: ["Mikael's Blessing"],
      antiAp: ["Locket of the Iron Solari"],
      antiAd: ["Locket of the Iron Solari"],
      antiCc: ["Mikael's Blessing"],
      antiPoke: ["Redemption"],
    },
  ),
  hybridOnHit: makeProfile(
    ["Nashor's Tooth", "Guinsoo's Rageblade"],
    ["Berserker's Greaves"],
    {
      antiTank: ["Riftmaker"],
      antiHeal: ["Morellonomicon"],
      antiBurst: ["Zhonya's Hourglass"],
      antiAp: ["Banshee's Veil"],
      antiAd: ["Death's Dance"],
      antiCc: ["Mercurial Scimitar"],
      antiPoke: ["Wit's End"],
    },
  ),
} satisfies Record<string, ChampionBuildProfile>;

const buildOverrides: Partial<Record<string, ChampionBuildProfile>> = {
  Ahri: buildTemplates.apMage,
  Jinx: buildTemplates.adCarry,
  Yasuo: buildTemplates.adSkirmisher,
  Sion: buildTemplates.tankFrontline,
  Lux: buildTemplates.apMage,
  "Lee Sin": buildTemplates.adBruiser,
  Leona: buildTemplates.tankSupport,
  Soraka: buildTemplates.supportEnchanter,
  Riven: buildTemplates.adBruiser,
};

const hasTag = (tags: ChampionTag[], tag: ChampionTag): boolean => tags.includes(tag);

const inferBuildProfile = (tags: ChampionTag[]): ChampionBuildProfile => {
  const isSupport = hasTag(tags, "support");
  const isTank = hasTag(tags, "tank") || hasTag(tags, "frontline") || hasTag(tags, "high_hp");
  const isAP = hasTag(tags, "ap");
  const isAD = hasTag(tags, "ad");
  const isAssassin = hasTag(tags, "assassin");
  const isBurst = hasTag(tags, "burst");
  const isPoke = hasTag(tags, "poke");
  const isMobile = hasTag(tags, "mobile");
  const isSustain = hasTag(tags, "sustain") || hasTag(tags, "healing") || hasTag(tags, "shielding");

  if (isSupport && isTank) return buildTemplates.tankSupport;
  if (isSupport && isAP) return buildTemplates.supportMage;
  if (isSupport) return buildTemplates.supportEnchanter;

  if (isTank && isAP && !isAD) return buildTemplates.tankAP;
  if (isTank) return buildTemplates.tankFrontline;

  if (isAP && isAD) {
    if (isPoke) return buildTemplates.apPoke;
    if (isBurst || isMobile || isAssassin) return buildTemplates.hybridOnHit;
    if (isSustain) return buildTemplates.apBattleMage;
    return buildTemplates.hybridOnHit;
  }

  if (isAP) {
    if (isAssassin) return buildTemplates.apAssassin;
    if (isPoke) return buildTemplates.apPoke;
    if (isSustain || isTank) return buildTemplates.apBattleMage;
    return buildTemplates.apMage;
  }

  if (isAD) {
    if (isAssassin) return buildTemplates.adAssassin;
    if (isPoke) return buildTemplates.adCarry;
    if (isTank || isSustain || isBurst) return buildTemplates.adBruiser;
    if (isMobile) return buildTemplates.adSkirmisher;
    return buildTemplates.adCarry;
  }

  return buildTemplates.adBruiser;
};

const normalizeChampionName = (champion: string): string =>
  champion.replace(/[^a-z0-9]/gi, "").toLowerCase();

export const championBuilds: Record<string, ChampionBuildProfile> = Object.fromEntries(
  Object.entries(championTags).map(([champion, tags]) => {
    const profile = buildOverrides[champion] ?? inferBuildProfile(tags);
    return [champion, profile];
  }),
);

const normalizedChampionBuilds = new Map<string, ChampionBuildProfile>(
  Object.entries(championBuilds).map(([champion, profile]) => [
    normalizeChampionName(champion),
    profile,
  ]),
);

export const getChampionBuildProfile = (
  champion: string,
): ChampionBuildProfile | undefined =>
  normalizedChampionBuilds.get(normalizeChampionName(champion));
