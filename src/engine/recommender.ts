import type { Item } from '../services'
import itemService from '../services/itemService'
import type { ItemScore, MayhemItemEntry, RecommendationResult } from './types'

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

const collectEnemyTagCounts = (
  enemyCurrentItems: string[],
  itemsCatalog?: Record<string, Item> | null,
) => {
  const tagCounts: Record<string, number> = {}

  for (const enemyItemName of enemyCurrentItems) {
    const meta = resolveCatalogItem(enemyItemName, itemsCatalog)
    const tags = (meta?.customTags ?? []).map((tag) => tag.toLowerCase())

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
    const tags = (meta?.customTags ?? []).map((tag) => tag.toLowerCase())

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

  const enemyScore = tags.reduce((total, tag) => total + (enemyTagCounts[tag] ?? 0), 0)
  const teamScore = tags.reduce((total, tag) => total + (teamTagCounts[tag] ?? 0), 0)
  return {
    item: meta?.itemName ?? item.item,
    score: 100 + enemyScore * 10 + teamScore * 4,
    reasons:
      enemyScore > 0 || teamScore > 0
        ? [`Mayhem suggested item`, `Matches enemy tags: ${tags.join(', ')}`]
        : ['Mayhem suggested item'],
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
  const enemyTagCounts = collectEnemyTagCounts(options.enemyCurrentItems ?? [], itemsCatalog)

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

  const suggested = (options.mayhemSuggestedItems ?? [])
    .map((entry) => scoreSuggestedItem(entry, teamTagCounts, enemyTagCounts, itemsCatalog))
    .filter((entry) => !seen.has(normalizeItemKey(entry.item)))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.item.localeCompare(right.item)
    })

  for (const entry of suggested) {
    addUniqueItem(featured, seen, entry.item, entry.score, entry.reasons[0], entry.image)
  }

  return featured.slice(0, limit)
}