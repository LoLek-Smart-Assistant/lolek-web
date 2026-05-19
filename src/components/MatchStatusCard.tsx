import { motion } from 'framer-motion'
import { Clock3, MapPinned, Sword } from 'lucide-react'

type MatchStatusCardProps = {
  mode: string
  duration: string
  region: string
}

export function MatchStatusCard({
  mode,
  duration,
  region,
}: MatchStatusCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
      className="overflow-hidden rounded-[20px] border border-white/8 bg-slate-950/75 px-3 py-2.5"
    >
      <div className="grid gap-2 md:grid-cols-3">
        <StatusPill icon={Sword} label="Game mode" value={mode} />
        <StatusPill icon={Clock3} label="Duration" value={duration} />
        <StatusPill icon={MapPinned} label="Region" value={region} />
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
    <div className="rounded-lg border border-white/8 bg-slate-950/60 p-2">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon className="h-3.5 w-3.5 text-cyan-300" />
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-white">{value}</p>
    </div>
  )
}
