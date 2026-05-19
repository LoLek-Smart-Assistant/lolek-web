import { motion } from 'framer-motion'
import {
  LoaderCircle,
  PlugZap,
  RadioTower,
  ShieldCheck,
  Swords,
} from 'lucide-react'

type RiotConnectCardProps = {
  riotId: string
  tagline: string
  isConnecting: boolean
  isConnected: boolean
  isInGame: boolean
  onRiotIdChange: (value: string) => void
  onTaglineChange: (value: string) => void
  onConnect: () => void
}

export function RiotConnectCard({
  riotId,
  tagline,
  isConnecting,
  isConnected,
  isInGame,
  onRiotIdChange,
  onTaglineChange,
  onConnect,
}: RiotConnectCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            Riot Connect
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-white">
            Sync a live match profile
          </h3>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            isConnected
              ? 'border border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
              : 'border border-white/10 bg-white/[0.04] text-slate-300'
          }`}
        >
          <RadioTower className="h-3.5 w-3.5" />
          {isConnected ? 'Riot linked' : 'Awaiting link'}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3.5">
        <div className="grid gap-3">
          <input
            value={riotId}
            onChange={(event) => onRiotIdChange(event.target.value)}
            placeholder="Riot ID / In-game Name"
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
          />
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input
              value={tagline}
              onChange={(event) => onTaglineChange(event.target.value)}
              placeholder="Tagline"
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              type="button"
              onClick={onConnect}
              disabled={isConnecting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(56,189,248,0.22)] transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-80 md:w-auto"
            >
              {isConnecting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-[24px] border border-cyan-400/15 bg-cyan-400/8 p-4">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-cyan-200/80">
              <ShieldCheck className="h-4 w-4" />
              Link status
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {isConnected ? 'Connected to Riot profile' : 'No linked account yet'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Ready to simulate match-aware item suggestions.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-fuchsia-400/15 bg-fuchsia-500/8 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fuchsia-200/80">
            <Swords className="h-4 w-4" />
            Current game
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {isInGame ? 'Player is currently in a live match' : 'No live match detected'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Live suggestions will update as the mock match state changes.
          </p>
        </div>
      </div>
    </motion.section>
  )
}
