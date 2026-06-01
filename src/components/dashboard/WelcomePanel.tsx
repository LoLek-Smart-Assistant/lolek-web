type WelcomePanelProps = {
  onGetStartedLabel?: string
}

export function WelcomePanel({ onGetStartedLabel }: WelcomePanelProps) {
  return (
    <section className="flex min-h-[calc(100vh-3rem)] w-full flex-col items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/75 px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
        Welcome
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">
        Your Riot-ready match companion
      </h2>
      <p className="mt-3 max-w-xl text-sm text-slate-300">
        Log in to sync your Riot ID, pull live match data, and unlock
        real-time build recommendations, team insights, and chat coaching.
      </p>
      <div className="mt-6 grid gap-2 text-left text-sm text-slate-300 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          Live game status and team panels
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          Personalized build recommendations
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          Match-ready insights and tips
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          In-game chat coaching
        </div>
      </div>
      {onGetStartedLabel ? (
        <div className="mt-6 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          {onGetStartedLabel}
        </div>
      ) : null}
    </section>
  )
}
