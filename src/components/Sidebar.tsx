import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Unplug,
} from 'lucide-react'
import { useState } from 'react'
import { authService } from '../services'
import { AuthPanel } from './auth/AuthPanel'
import { RiotConnectPanel } from './RiotConnectPanel'
import { LolekIcon } from './LolekIcon'

type SidebarProps = {
  activeTab: 'dashboard' | 'history'
  surfaceMode: 'live' | 'manual'
  authMode: 'login' | 'register'
  email: string
  password: string
  riotId: string
  tagline: string
  platform: string
  connectedRiotId: string
  connectedTagline: string
  isConnecting: boolean
  isRemovingRiotProfile: boolean
  isRiotConnected: boolean
  isEditingRiotProfile: boolean
  username?: string | null
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onSurfaceModeChange: (mode: 'live' | 'manual') => void
  onAuthModeChange: (mode: 'login' | 'register') => void
  onTabChange: (tab: 'dashboard' | 'history') => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRiotIdChange: (value: string) => void
  onTaglineChange: (value: string) => void
  onPlatformChange: (value: string) => void
  onEditRiotProfile: () => void
  onRemoveRiotProfile: () => void
  onConnect: () => void
  onAuthSuccess?: (userData: { username: string; email: string }) => void
  onLogout?: () => void
}

export function Sidebar({
  activeTab,
  surfaceMode,
  authMode,
  email,
  password,
  riotId,
  tagline,
  platform,
  connectedRiotId,
  connectedTagline,
  isConnecting,
  isRemovingRiotProfile,
  isRiotConnected,
  isEditingRiotProfile,
  username,
  isCollapsed = false,
  onToggleCollapse,
  onSurfaceModeChange,
  onAuthModeChange,
  onTabChange,
  onEmailChange,
  onPasswordChange,
  onRiotIdChange,
  onTaglineChange,
  onPlatformChange,
  onEditRiotProfile,
  onRemoveRiotProfile,
  onConnect,
  onAuthSuccess,
  onLogout,
}: SidebarProps) {
  const isLoggedIn = !!username
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const showDetails = !isCollapsed
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
    <aside className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/75 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(3,7,18,0.7)] backdrop-blur-xl transition-all lg:sticky lg:top-6 lg:self-start lg:h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain ${
      isCollapsed ? 'p-3' : 'p-5'
    }`}>
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_65%)]" />
      <div className="absolute -right-10 top-24 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative flex h-full flex-col gap-6">
        <div>
          <div className={`flex ${showDetails ? 'items-center justify-between' : 'flex-col items-center gap-3'}`}>
            <div className={`flex ${showDetails ? 'items-center gap-3' : 'flex-col items-center gap-2'}`}>
              <div className="flex items-center justify-center text-white">
                <LolekIcon />
              </div>
              {showDetails ? (
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300/80">
                    Smart Assistant
                  </p>
                  <h1 className="text-xl font-semibold text-white">
                    LoLek
                  </h1>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className={`rounded-2xl border border-white/10 bg-white/[0.03] ${showDetails ? 'p-1' : 'p-2'}`}>
          <div className={showDetails ? 'inline-flex w-full rounded-[20px] p-1' : 'grid gap-2'}>
            <button
              type="button"
              onClick={() => onSurfaceModeChange('live')}
              className={`font-semibold uppercase tracking-[0.24em] transition ${
                showDetails ? 'flex-1 rounded-full px-4 py-2 text-xs' : 'w-full rounded-xl px-3 py-2.5 text-[10px] text-center'
              } ${
                surfaceMode === 'live'
                  ? 'bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live"
            >
              {showDetails ? 'Live' : 'L'}
            </button>
            <button
              type="button"
              onClick={() => onSurfaceModeChange('manual')}
              className={`font-semibold uppercase tracking-[0.24em] transition ${
                showDetails ? 'flex-1 rounded-full px-4 py-2 text-xs' : 'w-full rounded-xl px-3 py-2.5 text-[10px] text-center'
              } ${
                surfaceMode === 'manual'
                  ? 'bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Manual"
            >
              {showDetails ? 'Manual' : 'M'}
            </button>
          </div>
        </div>

        {isLoggedIn ? (
          <div className={`grid gap-2 rounded-2xl bg-white/[0.03] ${showDetails ? 'p-2' : 'p-1'}`}>
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                showDetails ? '' : 'justify-center'
              } ${
                activeTab === 'dashboard'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
              {showDetails ? 'Dashboard' : null}
            </button>
            <button
              type="button"
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                showDetails ? '' : 'justify-center'
              } ${
                activeTab === 'history'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="History"
            >
              <History className="h-4 w-4" />
              {showDetails ? 'History' : null}
            </button>
          </div>
        ) : null}

        {!isLoggedIn ? (
          showDetails ? (
            <AuthPanel
              authMode={authMode}
              email={email}
              password={password}
              onAuthModeChange={onAuthModeChange}
              onEmailChange={onEmailChange}
              onPasswordChange={onPasswordChange}
              onAuthSuccess={onAuthSuccess}
            />
          ) : null
        ) : showDetails ? (
          <div className="mt-auto rounded-3xl bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.85))] p-4 shadow-[0_25px_80px_rgba(2,6,23,0.75)]">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={isRiotConnected ? onEditRiotProfile : undefined}
                disabled={!isRiotConnected}
                className={`flex flex-1 items-center justify-between rounded-2xl border px-3 py-2 text-xs text-left transition ${
                  isRiotConnected ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'
                } ${riotStatus.className}`}
              >
                <span className="flex items-center gap-2">
                  <riotStatus.icon className={`h-4 w-4 ${riotStatus.iconClassName}`} />
                  {riotStatus.label}
                </span>
                {isRiotConnected ? (
                  isEditingRiotProfile ? (
                    <ChevronUp className="h-4 w-4 text-emerald-200/90" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-emerald-200/90" />
                  )
                ) : null}
              </button>
              {isRiotConnected ? (
                <button
                  type="button"
                  onClick={onRemoveRiotProfile}
                  disabled={isRemovingRiotProfile}
                  className="rounded-full bg-white/[0.1] p-2 text-white/80 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-wait disabled:opacity-80"
                  title="Disconnect Riot account"
                >
                  {isRemovingRiotProfile ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="h-4 w-4" />
                  )}
                </button>
              ) : null}
            </div>
            <div className="mt-4 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{username}</p>
                  {isRiotConnected && connectedRiotId ? (
                    <p className="text-xs text-slate-400">
                      {connectedRiotId}
                      {connectedTagline ? `#${connectedTagline}` : ''}
                    </p>
                  ) : null}
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
        ) : (
          <div className="mt-auto flex justify-center">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-full bg-white/[0.04] p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
