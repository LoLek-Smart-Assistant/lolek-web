import { LoaderCircle, PlugZap } from 'lucide-react'

type RiotConnectPanelProps = {
  riotId: string
  tagline: string
  platform: string
  isConnecting: boolean
  variant?: 'card' | 'embedded'
  onRiotIdChange: (value: string) => void
  onTaglineChange: (value: string) => void
  onPlatformChange: (value: string) => void
  onConnect: () => void
}

export function RiotConnectPanel({
  riotId,
  tagline,
  platform,
  isConnecting,
  variant = 'card',
  onRiotIdChange,
  onTaglineChange,
  onPlatformChange,
  onConnect,
}: RiotConnectPanelProps) {
  const containerClassName =
    variant === 'embedded'
      ? ''
      : 'rounded-[26px] border border-white/10 bg-white/[0.04] p-4'

  return (
    <section className={containerClassName}>
      <div className="grid gap-4">
        <label className="grid gap-2 text-xs font-medium text-slate-400">
          Riot name + tag
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3">
            <input
              type="text"
              value={riotId}
              onChange={(event) => onRiotIdChange(event.target.value)}
              placeholder="NeonFox"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <span className="text-sm font-semibold text-slate-500">#</span>
            <input
              type="text"
              value={tagline}
              onChange={(event) => onTaglineChange(event.target.value)}
              placeholder="EUW"
              maxLength={5}
              className="w-16 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="grid gap-2 text-xs font-medium text-slate-400">
            Platform
            <input
              type="text"
              value={platform}
              onChange={(event) => onPlatformChange(event.target.value)}
              placeholder="EUW1"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-80 sm:w-auto"
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
