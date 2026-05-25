import { useEffect, useRef, useState } from 'react'

import { ChatSection } from '../../components/ChatSection'
import { MatchStatusCard } from '../../components/MatchStatusCard'
import { RecommendedBuild } from '../../components/RecommendedBuild'
import { Sidebar } from '../../components/Sidebar'
import { TeamPanel } from '../../components/TeamPanel'
import { initialChat, liveMatch, recommendation, teams } from '../../data/mockRiot'
import authService from '../../services/authService'
import userService from '../../services/userService'

export function DashboardScreen() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('jasna@smartassist.gg')
  const [password, setPassword] = useState('hunter2')
  const [riotId, setRiotId] = useState('NeonFox')
  const [tagline, setTagline] = useState('EUW')
  const [platform, setPlatform] = useState('EUW1')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRiotConnected, setIsRiotConnected] = useState(false)
  const [messages, setMessages] = useState(initialChat)
  const [pendingMessage, setPendingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const timeoutRef = useRef<number | null>(null)

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.initializeAuth()
        if (user) {
          setUsername(user.username)
          if (user.riotName && user.riotTag) {
            setRiotId(user.riotName)
            setTagline(user.riotTag)
            if (user.platform) {
              setPlatform(user.platform)
            }
            setIsRiotConnected(true)
          }
        }
      } finally {
        setIsInitializing(false)
      }
    }

    initAuth()
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleConnect = async () => {
    if (!riotId || !tagline || !platform) {
      return
    }

    setIsConnecting(true)

    try {
      const response = await userService.linkRiotProfile({
        riotName: riotId,
        riotTag: tagline,
        platform,
      })
      const linkedUser = response.data?.user

      if (linkedUser?.username) {
        setUsername(linkedUser.username)
      }

      setIsRiotConnected(true)
    } catch (error) {
      console.error('Riot link error:', error)
      setIsRiotConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleAuthSuccess = (userData: { username: string; email: string }) => {
    setUsername(userData.username)
    setEmail(userData.email)
    // Clear sensitive data after successful auth
    setPassword('')
  }

  const handleLogout = () => {
    setUsername(null)
    setEmail('')
    setPassword('')
    setAuthMode('login')
    setIsRiotConnected(false)
  }

  const handleRiotIdChange = (value: string) => {
    setRiotId(value)
    if (isRiotConnected) {
      setIsRiotConnected(false)
    }
  }

  const handleTaglineChange = (value: string) => {
    setTagline(value)
    if (isRiotConnected) {
      setIsRiotConnected(false)
    }
  }

  const handlePlatformChange = (value: string) => {
    setPlatform(value)
    if (isRiotConnected) {
      setIsRiotConnected(false)
    }
  }

  const handleSendMessage = () => {
    const trimmed = pendingMessage.trim()

    if (!trimmed) {
      return
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    const userEntry = {
      id: Date.now(),
      role: 'user' as const,
      author: 'You',
      message: trimmed,
      time: timestamp,
    }

    setMessages((current) => [...current, userEntry])
    setPendingMessage('')
    setIsTyping(true)

    timeoutRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          author: 'LoL AI',
          message:
            'Based on this board state, prioritize your burst spike before dragon. Keep defensive pivot options for the next purchase if their assassin gets flank access.',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
      setIsTyping(false)
    }, 1100)
  }

  const visibleTeams = teams.map((team) => ({
    ...team,
    players: team.players.filter(
      (player) => player.summonerName !== recommendation.summonerName,
    ),
  }))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] px-4 py-4 text-white sm:px-6 lg:px-6">
      <div className="mx-auto grid max-w-[1840px] gap-6 xl:grid-cols-[300px_minmax(0,1fr)_440px]">
        <Sidebar
          authMode={authMode}
          email={email}
          password={password}
          riotId={riotId}
          tagline={tagline}
          platform={platform}
          isConnecting={isConnecting}
          isRiotConnected={isRiotConnected}
          username={username}
          onAuthModeChange={setAuthMode}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRiotIdChange={handleRiotIdChange}
          onTaglineChange={handleTaglineChange}
          onPlatformChange={handlePlatformChange}
          onConnect={handleConnect}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />

        <main className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-6">
              <MatchStatusCard
                mode={liveMatch.mode}
                duration={liveMatch.duration}
                region={liveMatch.region}
              />
              {visibleTeams[0] && <TeamPanel team={visibleTeams[0]} />}
            </div>
            {visibleTeams[1] && <TeamPanel team={visibleTeams[1]} />}
          </div>

          <RecommendedBuild recommendation={recommendation} />
        </main>

        <aside className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/75 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(3,7,18,0.7)] backdrop-blur-xl xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_65%)]" />
          <div className="absolute -left-10 top-24 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative">
            <ChatSection
              messages={messages}
              pendingMessage={pendingMessage}
              isTyping={isTyping}
              compact
              onPendingMessageChange={setPendingMessage}
              onSendMessage={handleSendMessage}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
