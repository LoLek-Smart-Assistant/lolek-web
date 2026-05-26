import { LoaderCircle, ShieldAlert, ShieldCheck, LogOut } from 'lucide-react'
import { useState } from 'react'
import { authService } from '../services'
import { AuthPanel } from './AuthPanel'
import { RiotConnectPanel } from './RiotConnectPanel'
import { LolekIcon } from './LolekIcon'

type SidebarProps = {
  activeTab: 'dashboard' | 'history'
  authMode: 'login' | 'register'
  email: string
  password: string
  riotId: string
  tagline: string
  platform: string
  isConnecting: boolean
  isRiotConnected: boolean
  isEditingRiotProfile: boolean
  username?: string | null
  onAuthModeChange: (mode: 'login' | 'register') => void
  onTabChange: (tab: 'dashboard' | 'history') => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRiotIdChange: (value: string) => void
  onTaglineChange: (value: string) => void
  onPlatformChange: (value: string) => void
  onEditRiotProfile: () => void
  onConnect: () => void
  onAuthSuccess?: (userData: { username: string; email: string }) => void
  onLogout?: () => void
}

export function Sidebar({
  activeTab,
  authMode,
  email,
  password,
  riotId,
  tagline,
  platform,
  isConnecting,
  isRiotConnected,
  isEditingRiotProfile,
  username,
  onAuthModeChange,
  onTabChange,
  onEmailChange,
  onPasswordChange,
  onRiotIdChange,
  onTaglineChange,
  onPlatformChange,
  onEditRiotProfile,
  onConnect,
  onAuthSuccess,
  onLogout,
}: SidebarProps) {
  const isLoggedIn = !!username
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const riotStatus = isConnecting
    ? {
        label: 'Linking Riot ID',
        value: 'Working',
        className: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
        icon: LoaderCircle,
        iconClassName: 'animate-spin',
      }
    : isRiotConnected
      ? {
          label: 'Riot connected',
          value: 'Linked',
          className: 'border-emerald-400/15 bg-emerald-400/10 text-emerald-200',
          icon: ShieldCheck,
          iconClassName: '',
        }
      : {
          label: 'Riot not connected',
          value: 'Not linked',
          className: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
          icon: ShieldAlert,
          iconClassName: '',
        }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authService.logOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      onLogout?.()
      setIsLoggingOut(false)
    }
  }

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

        {isLoggedIn ? (
          <div className="grid gap-2 rounded-2xl bg-white/[0.03] p-2">
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                activeTab === 'dashboard'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onTabChange('history')}
              className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                activeTab === 'history'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              History
            </button>
          </div>
        ) : null}

        {!isLoggedIn ? (
          <>
            <AuthPanel
              authMode={authMode}
              email={email}
              password={password}
              onAuthModeChange={onAuthModeChange}
              onEmailChange={onEmailChange}
              onPasswordChange={onPasswordChange}
              onAuthSuccess={onAuthSuccess}
            />
          </>
        ) : (
          <>
            <div className="mt-auto rounded-3xl bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.85))] p-4 shadow-[0_25px_80px_rgba(2,6,23,0.75)]">
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{username}</p>
                    <p className="text-xs text-slate-400">Riot-ready profile</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-full bg-white/[0.04] p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div
                  className={`flex flex-1 items-center justify-between rounded-2xl border px-3 py-2 text-xs ${riotStatus.className}`}
                >
                  <span className="flex items-center gap-2">
                    <riotStatus.icon className={`h-4 w-4 ${riotStatus.iconClassName}`} />
                    {riotStatus.label}
                  </span>
                  <span>{riotStatus.value}</span>
                </div>
                {isRiotConnected ? (
                  <button
                    type="button"
                    onClick={onEditRiotProfile}
                    className="rounded-full bg-white/[0.1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/[0.18]"
                  >
                    {isEditingRiotProfile ? 'Close' : 'Edit'}
                  </button>
                ) : null}
              </div>
              {!isRiotConnected || isEditingRiotProfile ? (
                <div className="mt-4">
                  <RiotConnectPanel
                    riotId={riotId}
                    tagline={tagline}
                    platform={platform}
                    isConnecting={isConnecting}
                    isConnected={isRiotConnected}
                    isEditing={isEditingRiotProfile}
                    variant="embedded"
                    onRiotIdChange={onRiotIdChange}
                    onTaglineChange={onTaglineChange}
                    onPlatformChange={onPlatformChange}
                    onConnect={onConnect}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
