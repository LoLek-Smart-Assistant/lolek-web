import type { Player } from '../data/mockRiot'

type PlayerCardProps = {
  player: Player
}

export function PlayerCard({ player }: PlayerCardProps) {
  const championInitials = player.champion.slice(0, 2).toUpperCase()
  const allItems = [...player.currentItems, ...player.predictedItems].slice(0, 6)

  return (
    <article className="overflow-hidden rounded-[20px] border border-white/8 bg-slate-950/75 px-3 py-2.5 transition hover:border-cyan-400/20 hover:bg-slate-950/90">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${player.accent} text-[10px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.22)] ring-2 ring-white/10`}
          >
            {championInitials}
          </div>

          <div className="min-w-0">
            <p className="break-words text-xs font-semibold leading-4 text-white">
              {player.summonerName}
            </p>
            <p className="truncate text-[11px] text-slate-400">{player.champion}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <ItemStrip items={allItems} currentCount={player.currentItems.length} />
        </div>
      </div>
    </article>
  )
}

type ItemStripProps = {
  items: string[]
  currentCount: number
}

function ItemStrip({ items, currentCount }: ItemStripProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2 lg:justify-end">
      {items.map((item, index) => (
        <ItemIcon
          key={`${item}-${index}`}
          item={item}
          variant={index < currentCount ? 'default' : 'glow'}
        />
      ))}
      </div>
    </div>
  )
}

type ItemIconProps = {
  item: string
  variant: 'default' | 'glow'
}

function ItemIcon({ item, variant }: ItemIconProps) {
  const itemCode = item
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="w-11 shrink-0 text-center flex-col items-center gap-1 justify-center hidden lg:flex">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[10px] font-semibold ${
          variant === 'glow'
            ? 'border-fuchsia-400/35 bg-[radial-gradient(circle_at_top_center,_rgba(217,70,239,0.42),_rgba(59,7,100,0.88)_70%)] text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.22),0_-8px_24px_rgba(217,70,239,0.18)]'
            : 'border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(15,23,42,0.92))] text-slate-100'
        }`}
      >
        {itemCode}
      </div>
      <p className="mt-1 truncate text-[8px] leading-3 text-slate-400">{item}</p>
    </div>
  )
}
