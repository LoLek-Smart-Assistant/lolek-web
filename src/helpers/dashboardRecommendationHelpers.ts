import type { Recommendation } from '../data/mockRiot'
import type { ItemRecommendation } from '../engine/types'

export function getRecommendationFromEngine(
  fallback: Recommendation,
  engineRecommendations: ItemRecommendation[],
): Recommendation {
  if (!engineRecommendations.length) {
    return fallback
  }

  const recommendedItems = engineRecommendations.map(
    (recommendationItem) => recommendationItem.item,
  )
  const reasons = engineRecommendations.flatMap(
    (recommendationItem) => recommendationItem.reasons,
  )

  return {
    ...fallback,
    nextItems: recommendedItems.slice(0, 3),
    buildPath: recommendedItems,
    alternatives: engineRecommendations
      .slice(3)
      .map(
        (recommendationItem) =>
          `${recommendationItem.item} (${recommendationItem.score})`,
      ),
    reasoning: [...new Set(reasons)].slice(0, 3),
    winRateNote: 'Offline recommendation based on team and enemy item builds',
  }
}
