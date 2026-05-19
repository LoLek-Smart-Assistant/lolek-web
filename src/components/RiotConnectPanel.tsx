import { LoaderCircle, PlugZap } from 'lucide-react'

type RiotConnectPanelProps = {
  riotId: string
  tagline: string
  isConnecting: boolean
  onRiotIdChange: (value: string) => void
  onTaglineChange: (value: string) => void
  onConnect: () => void
}

export function RiotConnectPanel({
  riotId,
  tagline,
  isConnecting,
  onRiotIdChange,
  onTaglineChange,
  onConnect,
}: RiotConnectPanelProps) {
  return (
    <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
      <div className="grid gap-3">
        <input
          type="text"
          value={riotId}
          onChange={(event) => onRiotIdChange(event.target.value)}
          placeholder="Riot ID / In-game Name"
          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
        />

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="text"
            value={tagline}
            onChange={(event) => onTaglineChange(event.target.value)}
            placeholder="Tagline"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
          />

          <button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-80 md:w-auto"
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
    </section>
  )
}
