type MatchHistoryPanelProps = {
  entries: ReadonlyArray<{
    id: number
    result: 'Win' | 'Loss'
    queue: string
    mode?: string
    duration: string
    champion: string
    kda: string
    role: string
    level?: number
    player?: string
    matchId?: string
    playedAt?: string
    team?: string
    teamBuilds?: Array<{
      teamId: string
      teamName: string
      won: boolean
      players: Array<{
        champion: string
        championImage?: string
        player: string
        items: Array<{
          name: string
          image?: string
        }>
      }>
    }>
  }>
}

export function MatchHistoryPanel({ entries }: MatchHistoryPanelProps) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/75 p-5 shadow-[0_20px_70px_rgba(8,15,35,0.35)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            Match history
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            Recent results
          </h3>
        </div>
        <div className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {entries.length} matches
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3"
          >
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                entry.result === 'Win'
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : 'bg-rose-500/15 text-rose-200'
              }`}
            >
              {entry.result}
            </div>
            <div className="text-sm text-slate-200">
              {entry.queue}{entry.mode ? ` • ${entry.mode}` : ''}
            </div>
            <div className="text-sm text-slate-400">
              {entry.duration}{entry.playedAt ? ` • ${entry.playedAt}` : ''}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm font-semibold text-white">
                {entry.champion}
              </div>
              <div className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                {entry.role}{typeof entry.level === 'number' ? ` • Lv ${entry.level}` : ''}
              </div>
              <div className="text-sm text-slate-300">KDA {entry.kda}</div>
            </div>
            {entry.player || entry.team ? (
              <div className="text-xs text-slate-400">
                {entry.player ?? 'Unknown player'}{entry.team ? ` • ${entry.team}` : ''}
              </div>
            ) : null}
            {entry.matchId ? <div className="text-xs text-slate-500">Match ID: {entry.matchId}</div> : null}
            {entry.teamBuilds?.length ? (
              <div className="mt-1 rounded-xl border border-white/10 bg-slate-950/55 p-3">
                <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Champion Builds
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {entry.teamBuilds
                    .sort((a, b) => a.teamId.localeCompare(b.teamId))
                    .map((team) => (
                    <div
                      key={`${entry.id}-${team.teamId}`}
                      className={`rounded-lg border p-2 ${
                        team.teamId === '200'
                          ? 'border-rose-400/20 bg-rose-500/5'
                          : 'border-cyan-400/20 bg-cyan-500/5'
                      }`}
                    >
                      <div className="mb-2 text-xs font-semibold text-white">
                        {team.teamName} {team.won ? '(Win)' : '(Loss)'}
                      </div>
                      <div className="space-y-2">
                        {team.players.map((player, idx) => (
                          <div key={`${team.teamId}-${player.player}-${idx}`} className="rounded-md border border-white/10 bg-slate-900/50 p-2">
                            <div className="mb-1 flex items-center gap-2 text-xs text-slate-200">
                              {player.championImage ? (
                                <img
                                  src={player.championImage}
                                  alt={player.champion}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-[10px]">
                                  {player.champion.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-semibold text-white">{player.champion}</span>
                              <span className="text-slate-400">• {player.player}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {player.items.length ? (
                                player.items.map((item, itemIdx) => (
                                  <div
                                    key={`${team.teamId}-${player.player}-${item.name}-${itemIdx}`}
                                    className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-1 text-[11px] text-slate-200"
                                  >
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="h-4 w-4 rounded object-cover" />
                                    ) : (
                                      <span className="inline-block h-4 w-4 rounded bg-white/10" />
                                    )}
                                    <span>{item.name}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-500">No items</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
