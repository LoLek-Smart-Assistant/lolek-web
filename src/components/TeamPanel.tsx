import { motion } from 'framer-motion'
import { Swords } from 'lucide-react'

import type { Team } from '../data/mockRiot'
import { PlayerCard } from './PlayerCard'

type TeamPanelProps = {
  team: Team
  champItemsMap?: Record<string, (string | null)[]>
  itemImageMap?: Record<string, string>
  onRemoveItem?: (champName: string, slotIndex: number) => void
  onOpenAdd?: (champName: string, playerIndex: number, slotIndex: number) => void
}

export function TeamPanel({ team, champItemsMap = {}, itemImageMap = {}, onRemoveItem, onOpenAdd }: TeamPanelProps) {
  const accent =
    team.side === 'blue'
      ? 'from-cyan-400/30 to-blue-500/10 border-cyan-400/20'
      : 'from-rose-500/30 to-red-500/10 border-rose-400/20'

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-[28px] border bg-gradient-to-b ${accent} px-4 py-3.5 shadow-[0_20px_70px_rgba(8,15,35,0.45)]`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
            Team composition
          </p>
          <h3 className="mt-0.5 text-xl font-semibold text-white">
            {team.name}
          </h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
          <Swords className="h-4 w-4 text-cyan-300" />
        </div>
      </div>

      <div className="space-y-2.5">
        {team.players.map((player, playerIndex) => (
          <PlayerCard
            key={`${team.name}-${player.summonerName}`}
            player={player}
            voiceAddedItems={champItemsMap[player.champion]}
            itemImageMap={itemImageMap}
            onRemoveItem={(slotIndex) => onRemoveItem?.(player.champion, slotIndex)}
            onOpenAdd={(slotIndex) => onOpenAdd?.(player.champion, playerIndex, slotIndex)}
          />
        ))}
      </div>
    </motion.section>
  )
}
