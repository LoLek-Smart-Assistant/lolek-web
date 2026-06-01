import { useState } from 'react'
import { LockKeyhole, Mail, User } from 'lucide-react'
import { authService } from '../../services'

type AuthPanelProps = {
  authMode: 'login' | 'register'
  email: string
  password: string
  onAuthModeChange: (mode: 'login' | 'register') => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onAuthSuccess?: (userData: { username: string; email: string }) => void
}

export function AuthPanel({
  authMode,
  email,
  password,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onAuthSuccess,
}: AuthPanelProps) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (authMode === 'register') {
        if (!username.trim()) {
          setError('Username is required')
          setIsLoading(false)
          return
        }

        const response = await authService.signIn({
          username: username.trim(),
          email: email.trim(),
          password,
        })

        onAuthSuccess?.({
          username: response.data.user.username,
          email: response.data.user.email,
        })
      } else {
        const response = await authService.logIn({
          email: email.trim(),
          password,
        })

        onAuthSuccess?.({
          username: response.data.user.username,
          email: response.data.user.email,
        })
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/80 p-1">
        <button
          type="button"
          onClick={() => {
            onAuthModeChange('login')
            setError(null)
          }}
          className={`rounded-xl px-3 py-2 text-sm transition ${
            authMode === 'login'
              ? 'bg-cyan-400/15 text-cyan-200'
              : 'text-slate-400 hover:text-white'
          }`}
          disabled={isLoading}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            onAuthModeChange('register')
            setError(null)
          }}
          className={`rounded-xl px-3 py-2 text-sm transition ${
            authMode === 'register'
              ? 'bg-fuchsia-500/15 text-fuchsia-200'
              : 'text-slate-400 hover:text-white'
          }`}
          disabled={isLoading}
        >
          Register
        </button>
      </div>

      <div className="space-y-3">
        {authMode === 'register' && (
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
              <User className="h-3.5 w-3.5" />
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose your username"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
              disabled={isLoading}
            />
          </label>
        )}

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
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
            disabled={isLoading}
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
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
            disabled={isLoading}
          />
        </label>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleAuth}
        disabled={isLoading}
        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:scale-[1.01] disabled:scale-100 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
      </button>
    </section>
  )
}
