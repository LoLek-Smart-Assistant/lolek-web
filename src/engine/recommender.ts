import type { Item } from '../services'
import itemService from '../services/itemService'
import type { ItemScore, MayhemItemEntry, RecommendationResult } from './types'

const ITEM_TAG_COUNTERS: Record<string, string[]> = {
  armor: ['armor_penetration'],
  attack_speed: ['anti_attack_speed'],
  critical_strike: ['anti_crit'],
  damage: ['armor'],
  health: ['percent_health_damage'],
  health_regen: ['anti_healing'],
  life_steal: ['anti_healing'],
  magic_resist: ['magic_penetration'],
  shield: ['anti_shield'],
  slow: ['anti_slow'],
  spell_damage: ['magic_resist'],
  spell_vamp: ['anti_healing'],
}

const COUNTER_PRIORITY: Record<string, number> = {
  percent_health_damage: 30,
  anti_healing: 24,
  armor_penetration: 22,
  magic_penetration: 22,
  anti_shield: 16,
  anti_crit: 14,
  anti_attack_speed: 12,
  anti_slow: 12,
  armor: 10,
  magic_resist: 10,
}

type RecommendItemsOptions = {
  myTeamCurrentItems?: string[]
  enemyCurrentItems?: string[]
  mayhemCoreItems?: MayhemItemEntry[]
  mayhemSuggestedItems?: MayhemItemEntry[]
}

const normalizeItemKey = (value: string) =>
  value.replace(/'s/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase()

const resolveCatalogItem = (
  itemName: string,
  itemsCatalog: Record<string, Item> | null | undefined,
) => {
  const key = normalizeItemKey(itemName)
  return itemsCatalog?.[key] ?? itemService.getItemByKey(itemName)
}

const addUniqueItem = (
  target: ItemScore[],
  seen: Set<string>,
  itemName: string,
  score: number,
  reason: string,
  image?: string | null,
) => {
  const key = normalizeItemKey(itemName)
  if (!key || seen.has(key)) {
    return
  }

  seen.add(key)
  target.push({
    item: itemName,
    score,
    reasons: [reason],
    image: image ?? null,
  })
}

const collectItemTagCounts = (
  currentItems: string[],
  itemsCatalog?: Record<string, Item> | null,
) => {
  const tagCounts: Record<string, number> = {}

  for (const itemName of currentItems) {
    const meta = resolveCatalogItem(itemName, itemsCatalog)
    const tags = (meta?.tags ?? []).map((tag) => tag.toLowerCase())

    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  return tagCounts
}

const collectTeamTagCounts = (
  teamCurrentItems: string[],
  itemsCatalog?: Record<string, Item> | null,
) => {
  const tagCounts: Record<string, number> = {}

  for (const teamItemName of teamCurrentItems) {
    const meta = resolveCatalogItem(teamItemName, itemsCatalog)
    const tags = (meta?.tags ?? []).map((tag) => tag.toLowerCase())

    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  return tagCounts
}

const scoreSuggestedItem = (
  item: MayhemItemEntry,
  teamTagCounts: Record<string, number>,
  enemyTagCounts: Record<string, number>,
  itemsCatalog?: Record<string, Item> | null,
) => {
  const meta = resolveCatalogItem(item.item, itemsCatalog)
  const tags = Array.from(
    new Set(
      (item.customTags ?? meta?.customTags ?? [])
        .map((tag) => tag.toLowerCase())
        .filter(Boolean),
    ),
  )

  let bestReason = 'Mayhem suggested item'
  let bestScore = 0

  for (const counterTag of tags) {
    const supportedEnemyTags = Object.entries(ITEM_TAG_COUNTERS)
      .filter(([, counters]) => counters.includes(counterTag))
      .map(([enemyTag]) => enemyTag)

    for (const enemyTag of supportedEnemyTags) {
      const enemyCount = enemyTagCounts[enemyTag] ?? 0
      if (enemyCount === 0) {
        continue
      }

      const teamCount = teamTagCounts[counterTag] ?? 0
      const counterPriority = COUNTER_PRIORITY[counterTag] ?? 8
      let score = enemyCount * counterPriority

      if (enemyCount >= 2) {
        score += 8
      }

      if (enemyCount >= 3) {
        score += 10
      }

      if (teamCount > 0) {
        score -= Math.min(10, teamCount * 4)
      }

      if (score > bestScore) {
        bestScore = score
        bestReason = `Counters enemy ${enemyTag.replace(/_/g, ' ')} stack (${enemyCount})`
        if (teamCount > 0) {
          bestReason += `; your team already has ${teamCount} similar item${teamCount === 1 ? '' : 's'}`
        }
      }
    }
  }

  const enemyScore = tags.reduce((total, tag) => {
    const supportedEnemyTags = Object.entries(ITEM_TAG_COUNTERS).filter(([, counters]) => counters.includes(tag))
    return total + supportedEnemyTags.reduce((tagTotal, [enemyTag]) => tagTotal + (enemyTagCounts[enemyTag] ?? 0), 0)
  }, 0)
  const teamScore = tags.reduce((total, tag) => total + (teamTagCounts[tag] ?? 0), 0)
  return {
    item: meta?.itemName ?? item.item,
    score: 100 + bestScore + enemyScore * 2 - teamScore * 3,
    reasons: bestScore > 0 ? [bestReason] : ['Mayhem suggested item'],
    image: meta?.image ?? item.image ?? null,
  }
}

export const recommendItems = (
  _myChampion: string,
  _enemyChampions: string[],
  limit = 6,
  options: RecommendItemsOptions = {},
): RecommendationResult => {
  const itemsCatalog = itemService.getCachedItems()
  const teamTagCounts = collectTeamTagCounts(options.myTeamCurrentItems ?? [], itemsCatalog)
  const enemyTagCounts = collectItemTagCounts(options.enemyCurrentItems ?? [], itemsCatalog)

  const featured: ItemScore[] = []
  const seen = new Set<string>()

  const coreItems = options.mayhemCoreItems ?? []
  for (let index = 0; index < coreItems.length; index += 1) {
    const entry = coreItems[index]
    const meta = resolveCatalogItem(entry.item, itemsCatalog)
    addUniqueItem(
      featured,
      seen,
      meta?.itemName ?? entry.item,
      1000 - index,
      'Mayhem core item',
      meta?.image ?? entry.image ?? null,
    )

    if (featured.length >= 3) {
      break
    }
  }

  if (featured.length < 3) {
    for (const entry of coreItems.slice(3)) {
      const meta = resolveCatalogItem(entry.item, itemsCatalog)
      addUniqueItem(
        featured,
        seen,
        meta?.itemName ?? entry.item,
        900,
        'Mayhem core item',
        meta?.image ?? entry.image ?? null,
      )

      if (featured.length >= 3) {
        break
      }
    }
  }

  const remainingSlots = Math.max(0, limit - featured.length)
  const suggestedLimit = Math.min(3, remainingSlots)
  const suggested = (options.mayhemSuggestedItems ?? [])
    .map((entry) => scoreSuggestedItem(entry, teamTagCounts, enemyTagCounts, itemsCatalog))
    .filter((entry) => !seen.has(normalizeItemKey(entry.item)))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.item.localeCompare(right.item)
    })
    .slice(0, suggestedLimit)

  for (const entry of suggested) {
    addUniqueItem(featured, seen, entry.item, entry.score, entry.reasons[0], entry.image)
  }

  return featured.slice(0, limit)
}