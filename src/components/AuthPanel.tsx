import { LockKeyhole, Mail } from 'lucide-react'

type AuthPanelProps = {
  authMode: 'login' | 'register'
  email: string
  password: string
  onAuthModeChange: (mode: 'login' | 'register') => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
}

export function AuthPanel({
  authMode,
  email,
  password,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
}: AuthPanelProps) {
  return (
    <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/80 p-1">
        <button
          type="button"
          onClick={() => onAuthModeChange('login')}
          className={`rounded-xl px-3 py-2 text-sm transition ${
            authMode === 'login'
              ? 'bg-cyan-400/15 text-cyan-200'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => onAuthModeChange('register')}
          className={`rounded-xl px-3 py-2 text-sm transition ${
            authMode === 'register'
              ? 'bg-fuchsia-500/15 text-fuchsia-200'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Register
        </button>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Mail className="h-3.5 w-3.5" />
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="summoner@smartassist.gg"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
            <LockKeyhole className="h-3.5 w-3.5" />
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Enter secure password"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:scale-[1.01]"
      >
        {authMode === 'login' ? 'Sign In' : 'Create Account'}
      </button>
    </section>
  )
}
