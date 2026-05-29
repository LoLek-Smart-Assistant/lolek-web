import type { Player } from '../data/mockRiot'
import itemService from '../services/itemService'

type PlayerCardProps = {
  player: Player
  voiceAddedItems?: (string | null)[]
  onRemoveItem?: (slotIndex: number) => void
}

export function PlayerCard({ player, voiceAddedItems = [], onRemoveItem }: PlayerCardProps) {
  const championInitials = player.champion.slice(0, 2).toUpperCase()

  // Merge current items and voice items into 6 slots
  const itemsWithSlots = Array(6)
    .fill(null)
    .map((_, i) => {
      // Prioritize voice items in the array
      if (voiceAddedItems[i] !== undefined) {
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
    <article className="overflow-hidden rounded-[20px] border border-white/8 bg-slate-950/75 px-3 py-2.5 transition hover:border-cyan-400/20 hover:bg-slate-950/90">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {player.championImage ? (
            <img
              src={player.championImage}
              alt={player.champion}
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-[0_0_20px_rgba(56,189,248,0.22)] ring-2 ring-white/10"
            />
          ) : (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${player.accent} text-[10px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.22)] ring-2 ring-white/10`}
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
            onRemoveItem={onRemoveItem}
          />
        </div>
      </div>
    </article>
  )
}

type ItemStripProps = {
  items: (string | null)[]
  currentCount: number
  onRemoveItem?: (slotIndex: number) => void
}

function ItemStrip({ items, currentCount, onRemoveItem }: ItemStripProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2 lg:justify-end relative">
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
            slotIndex={index}
            onRemove={onRemoveItem}
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
  slotIndex: number
  onRemove?: (slotIndex: number) => void
}

function ItemIcon({ item, variant, slotIndex, onRemove }: ItemIconProps) {
  if (!item) {
    return (
      <div className="w-11 shrink-0 text-center flex-col items-center gap-1 justify-center hidden lg:flex">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/[0.02]">
          <div className="text-[10px] text-slate-500">—</div>
        </div>
      </div>
    )
  }

  const itemCode = item
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Get item image from service
  const itemMeta = itemService.getItemByName?.(item)
  const itemImage = itemMeta?.image

  return (
    <div className="w-11 shrink-0 text-center flex-col items-center gap-1 justify-center hidden lg:flex group relative">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[10px] font-semibold overflow-hidden ${
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
          className="absolute z-20 -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-125 pointer-events-auto cursor-pointer shadow-lg"
          aria-label="Remove item"
        >
          <span className="text-sm font-bold leading-none">×</span>
        </button>
      )}
      <p className="mt-1 truncate text-[8px] leading-3 text-slate-400">{item}</p>
    </div>
  )
}
