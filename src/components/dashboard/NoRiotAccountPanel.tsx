type NoRiotAccountPanelProps = {
  title?: string
  description?: string
}

export function NoRiotAccountPanel({
  title = 'No Riot account linked yet',
  description = 'Connect your Riot ID in the sidebar to unlock live match data, team insights, and build recommendations.',
}: NoRiotAccountPanelProps) {
  return (
    <section className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/75 px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">
        Riot account
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-xl text-sm text-slate-300">{description}</p>
      <div className="mt-6 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
        Link your Riot ID to continue
      </div>
    </section>
  )
}
