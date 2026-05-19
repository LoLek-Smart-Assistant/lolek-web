import { AnimatePresence, motion } from 'framer-motion'
import { SendHorizonal } from 'lucide-react'

import type { ChatEntry } from '../data/mockRiot'
import { ChatMessage } from './ChatMessage'
import { LolekIcon } from './LolekIcon'

type ChatSectionProps = {
  messages: ChatEntry[]
  pendingMessage: string
  isTyping: boolean
  compact?: boolean
  onPendingMessageChange: (value: string) => void
  onSendMessage: () => void
}

export function ChatSection({
  messages,
  pendingMessage,
  isTyping,
  compact = false,
  onPendingMessageChange,
  onSendMessage,
}: ChatSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className={`rounded-[32px]`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300/80">
              Match Chat
            </p>
          </div>
        </div>
      </div>

      <div
        className={`mt-5 space-y-4 overflow-y-auto rounded-[28px] border border-white/8 bg-slate-950/70 ${
          compact ? 'h-[28rem] p-3' : 'h-[26rem] p-4'
        }`}
      >
        {messages.map((entry) => (
          <ChatMessage key={entry.id} entry={entry} />
        ))}

        <AnimatePresence>
          {isTyping ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950">
                <LolekIcon />
              </div>
              <div className="rounded-[24px] border border-cyan-400/15 bg-slate-900/90 px-4 py-3 text-sm text-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
                  <span className="ml-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                    AI is typing
                  </span>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className={`mt-5 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-slate-950/65 ${
          compact ? 'p-3' : 'p-4 md:flex-row'
        }`}
      >
        <input
          value={pendingMessage}
          onChange={(event) => onPendingMessageChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSendMessage()
            }
          }}
          placeholder="Ask what to build next, when to spike, or how to play the next fight..."
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
        />
        <button
          type="button"
          onClick={onSendMessage}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(56,189,248,0.22)] transition hover:scale-[1.01]"
        >
          <SendHorizonal className="h-4 w-4" />
          Send
        </button>
      </div>
    </motion.section>
  )
}
