import type { Player } from '../data/mockRiot'
import itemService from '../services/itemService'
import { Plus } from 'lucide-react'

type PlayerCardProps = {
  player: Player
  voiceAddedItems?: (string | null)[]
  itemImageMap?: Record<string, string>
  onRemoveItem?: (slotIndex: number) => void
  onOpenAdd?: (slotIndex: number) => void
}

export function PlayerCard({ player, voiceAddedItems = [], itemImageMap = {}, onRemoveItem, onOpenAdd }: PlayerCardProps) {
  const championInitials = player.champion.slice(0, 2).toUpperCase()

  // Merge current items and voice items into 6 slots
  const itemsWithSlots = Array(6)
    .fill(null)
    .map((_, i) => {
      // Prioritize voice items in the array
      if (voiceAddedItems[i] !== undefined && voiceAddedItems[i] !== null) {
        return voiceAddedItems[i]
      }
      // Then fill with current items
      if (i < player.currentItems.length) {
        return player.currentItems[i]
      }
      // Then fill with predicted items
      const predictedIndex = i - player.currentItems.length
      if (predictedIndex < player.predictedItems.length) {
        return player.predictedItems[predictedIndex]
      }
      return null
    })

  return (
    <article className="overflow-visible rounded-[20px] border border-white/8 bg-slate-950/75 px-3 py-2.5 transition hover:border-cyan-400/20 hover:bg-slate-950/90">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {player.championImage ? (
            <div className="h-13 min-w-13 overflow-hidden rounded-full ring-2 ring-white/10 shadow-[0_0_20px_rgba(56,189,248,0.22)]">
              <img
                src={player.championImage}
                alt={player.champion}
                className="h-full w-full scale-110 object-cover"
               />
            </div>
          ) : (
            <div
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${player.accent} text-[10px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.22)] ring-2 ring-white/10`}
            >
              {championInitials}
            </div>
          )}

          <div className="min-w-0">
            <p className="break-words text-xs font-semibold leading-4 text-white">
              {player.summonerName}
            </p>
            <p className="truncate text-[11px] text-slate-400">{player.champion}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <ItemStrip
            items={itemsWithSlots}
            currentCount={player.currentItems.length}
            itemImageMap={itemImageMap}
            onRemoveItem={onRemoveItem}
            onOpenAdd={onOpenAdd}
          />
        </div>
      </div>
    </article>
  )
}

type ItemStripProps = {
  items: (string | null)[]
  currentCount: number
  itemImageMap: Record<string, string>
  onRemoveItem?: (slotIndex: number) => void
}

function ItemStrip({ items, currentCount, itemImageMap, onRemoveItem, onOpenAdd }: ItemStripProps & { onOpenAdd?: (slotIndex: number) => void }) {
  return (
    <div className="w-full pb-1">
      <div className="grid w-full grid-cols-6 gap-2">
      {items.map((item, index) => {
        let variant: 'default' | 'glow' | 'empty'
        if (!item) {
          variant = 'empty'
        } else if (index < currentCount) {
          variant = 'default'
        } else {
          variant = 'glow'
        }

        return (
          <ItemIcon
            key={`${item || 'empty'}-${index}`}
            item={item}
            variant={variant}
            itemImageMap={itemImageMap}
            slotIndex={index}
            onRemove={onRemoveItem}
            onOpenAdd={onOpenAdd}
          />
        )
      })}
      </div>
    </div>
  )
}

type ItemIconProps = {
  item: string | null
  variant: 'default' | 'glow' | 'empty'
  itemImageMap: Record<string, string>
  slotIndex: number
  onRemove?: (slotIndex: number) => void
}

function ItemIcon({ item, variant, itemImageMap, slotIndex, onRemove, onOpenAdd }: ItemIconProps & { onOpenAdd?: (slotIndex: number) => void }) {
  if (!item) {
    return (
      <div className="group mx-auto w-[45px] text-center">
        <div className="relative aspect-square w-[45px]">
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/20 bg-white/[0.02]">
            <div className="text-[10px] text-slate-500">{''}</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenAdd?.(slotIndex)
            }}
            className="absolute inset-0 flex items-center justify-center text-cyan-200 hover:text-cyan-100 cursor-pointer"
            aria-label="Add item"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 truncate text-[8px] leading-3 text-slate-400">{''}</p>
      </div>
    )
  }

  const itemCode = item
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const normalizeItemKey = (value: string) =>
    value.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const isSyntheticItemId = item.startsWith('itemid:')
  const isNumericOnly = /^\d+$/.test(item.trim())

  // Get item image from service
  const itemMeta = itemService.getItemByName?.(item)
  const itemImage =
    itemMeta?.image ??
    itemImageMap[item] ??
    itemImageMap[normalizeItemKey(item)] ??
    null
  const itemDescription = itemMeta?.description?.trim() || undefined

  return (
    <div className="group relative mx-auto w-[45px] text-center">
      <div
        className={`flex aspect-square w-[45px] items-center justify-center overflow-hidden rounded-lg border text-[10px] font-semibold ${
          variant === 'glow'
            ? 'border-fuchsia-400/35 bg-[radial-gradient(circle_at_top_center,_rgba(217,70,239,0.42),_rgba(59,7,100,0.88)_70%)] text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.22),0_-8px_24px_rgba(217,70,239,0.18)]'
            : 'border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(15,23,42,0.92))] text-slate-100'
        }`}
      >
        {itemImage ? (
          <img
            src={itemImage}
            alt={item}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          itemCode
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove(slotIndex)
          }}
          className="absolute -top-1.5 -right-1.5 z-20 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/15 bg-slate-950/95 text-white shadow-[0_6px_18px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:border-white/30 hover:bg-rose-500/95 focus:outline-none focus:ring-2 focus:ring-rose-400/60 pointer-events-auto cursor-pointer"
          aria-label="Remove item"
        >
          <span className="relative block h-2.5 w-2.5">
            <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
            <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
          </span>
        </button>
      )}
      {itemDescription ? (
        <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-lg border border-white/15 bg-slate-950/95 px-2.5 py-2 text-left text-[10px] leading-4 text-slate-100 opacity-0 shadow-[0_10px_25px_rgba(15,23,42,0.55)] transition-opacity duration-150 group-hover:opacity-100">
          {itemDescription}
        </div>
      ) : null}
      <p className="mt-1 truncate text-[8px] leading-3 text-slate-400">
        {isSyntheticItemId || isNumericOnly ? '' : item}
      </p>
    </div>
  )
}
