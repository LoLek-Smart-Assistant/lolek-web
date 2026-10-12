import { motion } from 'framer-motion'
import { UserCircle2 } from 'lucide-react'

import type { ChatEntry } from '../data/mockRiot'
import { LolekIcon } from './LolekIcon'

type ChatMessageProps = {
  entry: ChatEntry
}

export function ChatMessage({ entry }: ChatMessageProps) {
  const isAssistant = entry.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex gap-3 ${isAssistant ? '' : 'justify-end'}`}
    >
      {isAssistant ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950">
          <LolekIcon />
        </div>
      ) : null}

      <div
        className={`max-w-3xl rounded-[24px] border px-4 py-3 ${
          isAssistant
            ? 'border-cyan-400/15 bg-slate-950/80 text-slate-100'
            : 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-50'
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {!isAssistant ? <UserCircle2 className="h-4 w-4" /> : null}
          <span className="font-medium text-white">{entry.author}</span>
          <span>{entry.time}</span>
        </div>
        <p className="mt-2 text-sm leading-6">{entry.message}</p>
      </div>
    </motion.div>
  )
}
