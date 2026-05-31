import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BrainCircuit, ChevronRight, Plus } from 'lucide-react'

import type { Recommendation } from '../data/mockRiot'
import itemService from '../services/itemService'

type RecommendedBuildProps = {
  recommendation: Recommendation
  coreItems?: string[]
  items?: (string | null)[]
  onOpenAdd?: (slotIndex: number) => void
  onRemoveItem?: (slotIndex: number) => void
}

export function RecommendedBuild({
  recommendation,
  coreItems = [],
  items,
  onOpenAdd,
  onRemoveItem,
}: RecommendedBuildProps) {
  const featuredItems = buildFeaturedItems(
    coreItems,
    recommendation.nextItems,
    recommendation.buildPath,
  )
  const displayItems = items ?? featuredItems.map((item) => item)
  const [addedSlots, setAddedSlots] = useState<Set<number>>(new Set())
  const [itemsReady, setItemsReady] = useState(
    Boolean(itemService.getCachedItems()),
  )

  useEffect(() => {
    setAddedSlots(new Set())
  }, [displayItems.map((item) => item ?? '').join('|')])

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
              <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
                <div className="flex h-18 min-w-18 items-center gap-3 xl:w-56">
                  {recommendation.championImage ? (
                    <div className="h-18 w-18 overflow-hidden rounded-full shadow-[0_0_20px_rgba(251,191,36,0.12)] ring-2 ring-amber-200/20">
                      <img
                        src={recommendation.championImage}
                        alt={recommendation.champion}
                        className="block h-full w-full scale-110 object-cover object-center"
                      />
                    </div>
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

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-max items-center gap-3 xl:justify-end">
                    {displayItems.map((item, index) => (
                      <div key={`${item ?? 'empty'}-${index}`} className="flex items-center gap-3">
                        <RecommendedItemTile
                          item={item}
                          highlighted={index < recommendation.nextItems.length}
                          isAdded={addedSlots.has(index)}
                          onMarkAdded={() => {
                            setAddedSlots((current) => {
                              const next = new Set(current)
                              next.add(index)
                              return next
                            })
                          }}
                          onOpenAdd={onOpenAdd}
                          onRemoveItem={(slotIndex) => {
                            setAddedSlots((current) => {
                              const next = new Set(current)
                              next.delete(slotIndex)
                              return next
                            })
                            onRemoveItem?.(slotIndex)
                          }}
                          slotIndex={index}
                        />
                        {index < displayItems.length - 1 && (
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
  item: string | null
  highlighted: boolean
  isAdded: boolean
  slotIndex: number
  onMarkAdded: () => void
  onOpenAdd?: (slotIndex: number) => void
  onRemoveItem?: (slotIndex: number) => void
}

function RecommendedItemTile({
  item,
  highlighted,
  isAdded,
  onMarkAdded,
  onOpenAdd,
  onRemoveItem,
  slotIndex,
}: RecommendedItemTileProps) {
  const itemCode = (item ?? '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const itemMeta = item
    ? itemService.getItemByKey(item) ?? itemService.getItemByName?.(item)
    : undefined
  const image = itemMeta?.image ?? undefined
  const itemDescription = itemMeta?.description?.trim() || undefined

  const handleClick = () => {
    if (item) {
      onMarkAdded()
      return
    }

    if (onOpenAdd) {
      onOpenAdd(slotIndex)
    }
  }

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onRemoveItem?.(slotIndex)
  }

  return (
    <div className="group relative mx-auto w-[60px] text-center">
      <button
        type="button"
        onClick={handleClick}
        className={`flex aspect-square w-[60px] items-center justify-center overflow-hidden rounded-lg border text-[10px] font-semibold ${
          item
            ? highlighted
              ? 'border-fuchsia-400/35 bg-[radial-gradient(circle_at_top_center,_rgba(217,70,239,0.42),_rgba(59,7,100,0.88)_70%)] text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.22),0_-8px_24px_rgba(217,70,239,0.18)]'
              : 'border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(15,23,42,0.92))] text-slate-100'
            : 'border-white/20 bg-white/[0.02] text-slate-500'
        }`}
        aria-label={item ? 'Mark item as added' : 'Add item'}
      >
        {item && image ? (
          <img
            src={image}
            alt={item}
            className={`h-full w-full rounded-lg object-cover transition-all ${
              isAdded ? 'opacity-100' : 'opacity-90'
            }`}
          />
        ) : item ? (
          <span className={isAdded ? '' : 'opacity-85'}>
            {itemCode}
          </span>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-cyan-200 transition-colors hover:text-cyan-100 cursor-pointer">
            <Plus className="h-4 w-4" />
          </span>
        )}
      </button>
      {item ? (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 z-20 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/15 bg-slate-950/95 text-white shadow-[0_6px_18px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:border-white/30 hover:bg-rose-500/95 focus:outline-none focus:ring-2 focus:ring-rose-400/60 pointer-events-auto cursor-pointer"
          aria-label="Remove item"
        >
          <span className="relative block h-2.5 w-2.5">
            <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
            <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
          </span>
        </button>
      ) : null}
      {itemDescription ? (
        <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-60 -translate-x-1/2 rounded-lg border border-white/15 bg-slate-950/95 px-2.5 py-2 text-left text-[10px] leading-4 text-slate-100 opacity-0 shadow-[0_10px_25px_rgba(15,23,42,0.55)] transition-opacity duration-150 group-hover:opacity-100">
          {itemDescription}
        </div>
      ) : null}
      <p className="mt-1 truncate text-[8px] leading-3 text-slate-400">{item ?? ''}</p>
    </div>
  )
}

export function buildFeaturedItems(coreItems: string[], nextItems: string[], buildPath: string[]) {
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

