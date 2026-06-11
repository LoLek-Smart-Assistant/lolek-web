type NoLiveGamePanelProps = {
  message: string
}

export function NoLiveGamePanel({ message }: NoLiveGamePanelProps) {
  return (
    <section className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
        Live game
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">
        No current game yet
      </h3>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
    </section>
  )
}
