import { motion } from 'framer-motion'
import { Clock3, MapPinned, Sword } from 'lucide-react'

type MatchStatusCardProps = {
  mode: string
  duration: string
}

export function MatchStatusCard({
  mode,
  duration,
}: MatchStatusCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
      className="px-1 py-0.5"
    >
      <div className="flex flex-wrap items-center gap-8">
        <StatusPill icon={Sword} label="Game mode" value={mode} />
        <StatusPill icon={Clock3} label="Duration" value={duration} />
      </div>
    </motion.section>
  )
}

type StatusPillProps = {
  icon: typeof Sword
  label: string
  value: string
}

function StatusPill({ icon: Icon, label, value }: StatusPillProps) {
  return (
    <div className="flex items-center my-4 gap-3">
      <span className="flex items-center gap-1.5 text-slate-300">
        <Icon className="h-4 w-4 text-cyan-300" />
        <span className="text-[12px] uppercase tracking-[0.16em]">{label}</span>
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
