type MatchHistoryPanelProps = {
  entries: ReadonlyArray<{
    id: number
    result: 'Win' | 'Loss'
    queue: string
    duration: string
    champion: string
    kda: string
    role: string
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
            <div className="text-sm text-slate-200">{entry.queue}</div>
            <div className="text-sm text-slate-400">{entry.duration}</div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm font-semibold text-white">
                {entry.champion}
              </div>
              <div className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                {entry.role}
              </div>
              <div className="text-sm text-slate-300">{entry.kda}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
