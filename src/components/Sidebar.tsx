import { ShieldCheck } from 'lucide-react'
import { AuthPanel } from './AuthPanel'
import { RiotConnectPanel } from './RiotConnectPanel'
import { LolekIcon } from './LolekIcon'

type SidebarProps = {
  authMode: 'login' | 'register'
  email: string
  password: string
  riotId: string
  tagline: string
  isConnecting: boolean
  onAuthModeChange: (mode: 'login' | 'register') => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRiotIdChange: (value: string) => void
  onTaglineChange: (value: string) => void
  onConnect: () => void
}

export function Sidebar({
  authMode,
  email,
  password,
  riotId,
  tagline,
  isConnecting,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onRiotIdChange,
  onTaglineChange,
  onConnect,
}: SidebarProps) {
  return (
    <aside className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/75 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(3,7,18,0.7)] backdrop-blur-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_65%)]" />
      <div className="absolute -right-10 top-24 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative flex h-full flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-fuchsia-500 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
              <LolekIcon />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300/80">
                AI Coach
              </p>
              <h1 className="text-xl font-semibold text-white">
                LoLek Smart Assistant
              </h1>
            </div>
          </div>
        </div>

        <RiotConnectPanel
          riotId={riotId}
          tagline={tagline}
          isConnecting={isConnecting}
          onRiotIdChange={onRiotIdChange}
          onTaglineChange={onTaglineChange}
          onConnect={onConnect}
        />

        <AuthPanel
          authMode={authMode}
          email={email}
          password={password}
          onAuthModeChange={onAuthModeChange}
          onEmailChange={onEmailChange}
          onPasswordChange={onPasswordChange}
        />

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-semibold text-slate-950">
              JN
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Jasna Nova</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Smart sync active
            </span>
            <span>98%</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
