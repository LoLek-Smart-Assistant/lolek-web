import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BrainCircuit, ChevronRight } from 'lucide-react'

import type { Recommendation } from '../data/mockRiot'
import itemService from '../services/itemService'

type RecommendedBuildProps = {
  recommendation: Recommendation
  coreItems?: string[]
  playerCurrentItems?: string[]
  onAddItem?: (item: string) => void
}

export function RecommendedBuild({
  recommendation,
  coreItems = [],
  playerCurrentItems = [],
  onAddItem,
}: RecommendedBuildProps) {
  const featuredItems = buildFeaturedItems(
    coreItems,
    recommendation.nextItems,
    recommendation.buildPath,
  )
  const [itemsReady, setItemsReady] = useState(
    Boolean(itemService.getCachedItems()),
  )

  useEffect(() => {
    if (itemsReady) {
      return
    }

    let isActive = true

    itemService
      .fetchItems()
      .then(() => {
        if (isActive) {
          setItemsReady(true)
        }
      })
      .catch((error) => {
        console.error('Item fetch error:', error)
      })

    return () => {
      isActive = false
    }
  }, [itemsReady])

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="relative overflow-hidden rounded-[30px] border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.8),rgba(76,29,149,0.35))] p-4 shadow-[0_25px_90px_rgba(17,24,39,0.6)]"
    >
      <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute left-0 top-8 h-28 w-28 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative">
        <div className="grid gap-4">
          <div className="grid gap-4">
            <div className="rounded-[26px] border border-amber-400/20 bg-black/20 p-4 shadow-[0_0_35px_rgba(251,191,36,0.08)]">
              <div className="mt-3 flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
                <div className="flex min-w-0 items-center gap-3 xl:w-56">
                  {recommendation.championImage ? (
                    <img
                      src={recommendation.championImage}
                      alt={recommendation.champion}
                      className="h-18 w-18 shrink-0 rounded-full object-cover ring-2 ring-amber-200/20"
                    />
                  ) : (
                    <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-xl font-semibold text-slate-950 ring-2 ring-amber-200/20">
                      {recommendation.champion.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">
                      {recommendation.summonerName}
                    </p>
                    <p className="truncate text-sm text-slate-400">
                      {recommendation.champion}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 overflow-x-auto pb-1">
                  <div className="flex min-w-max items-center gap-3 xl:justify-end">
                    {featuredItems.map((item, index) => (
                      <div key={item} className="flex items-center gap-3">
                        <RecommendedItemTile
                          item={item}
                          highlighted={index < recommendation.nextItems.length}
                          isAdded={playerCurrentItems.includes(item)}
                          onAddItem={onAddItem}
                        />
                        {index < featuredItems.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                <BrainCircuit className="h-4 w-4 text-cyan-300" />
                Smart reasoning
              </p>
              <div className="mt-3 space-y-2">
                {recommendation.reasoning.slice(0, 2).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm leading-5 text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Full build path
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {recommendation.buildPath.map((item, index) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white">
                      {item}
                    </span>
                    {index < recommendation.buildPath.length - 1 ? (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-fuchsia-400/15 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-200/80">
                Situational items
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recommendation.alternatives.map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-fuchsia-400/15 bg-fuchsia-500/8 px-2.5 py-1 text-[10px] leading-4 text-fuchsia-50"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

type RecommendedItemTileProps = {
  item: string
  highlighted: boolean
  isAdded?: boolean
  onAddItem?: (item: string) => void
}

function RecommendedItemTile({
  item,
  highlighted,
  isAdded = false,
  onAddItem,
}: RecommendedItemTileProps) {
  const itemCode = item
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const image =
    itemService.getItemByKey(item)?.image ??
    itemService.getItemByName?.(item)?.image ??
    undefined

  const handleClick = () => {
    if (onAddItem && !isAdded) {
      onAddItem(item)
    }
  }

  return (
    <div className="w-16 shrink-0 text-center">
      <button
        onClick={handleClick}
        disabled={isAdded}
        className={`flex h-14 w-14 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
          isAdded
            ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100 cursor-default opacity-75'
            : highlighted
              ? 'border-amber-300/35 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.32),_rgba(154,52,18,0.9))] text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.28)] cursor-pointer hover:shadow-[0_0_28px_rgba(251,191,36,0.35)]'
              : 'border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(15,23,42,0.92))] text-slate-100 cursor-pointer hover:border-cyan-400/30'
        }`}
      >
        {image ? (
          <img src={image} alt={item} className="h-12 w-12 rounded" />
        ) : (
          itemCode
        )}
      </button>
      <p className="mt-1 truncate text-[9px] leading-3 text-slate-400">{item}</p>
      {isAdded && <p className="mt-1 text-[8px] text-emerald-400">✓ Added</p>}
    </div>
  )
}

function buildFeaturedItems(coreItems: string[], nextItems: string[], buildPath: string[]) {
  const seen = new Set<string>()
  const featured: string[] = []

  const pushUnique = (item: string) => {
    const key = normalizeItemKey(item)
    if (!key || seen.has(key)) {
      return
    }

    seen.add(key)
    featured.push(item)
  }

  coreItems.slice(0, 3).forEach(pushUnique)
  nextItems.forEach(pushUnique)
  buildPath.forEach(pushUnique)

  return featured.slice(0, 6)
}

function normalizeItemKey(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase()
}
