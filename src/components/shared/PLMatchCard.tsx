interface Props {
  name: string
  club: string
  position: string
}

const POS_COLOURS: Record<string, string> = {
  GK: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  CB: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  RB: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  LB: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  CDM: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  CM: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  CAM: 'bg-green-500/20 text-green-600 dark:text-green-400',
  RM: 'bg-green-500/20 text-green-600 dark:text-green-400',
  RW: 'bg-green-500/20 text-green-600 dark:text-green-400',
  LW: 'bg-green-500/20 text-green-600 dark:text-green-400',
  ST: 'bg-red-500/20 text-red-600 dark:text-red-400',
}

export default function PLMatchCard({ name, club, position }: Props) {
  const posClass = POS_COLOURS[position] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'

  return (
    <div className="mt-3 rounded-xl border border-[#D4D3D0] dark:border-[#2a2e31] bg-white dark:bg-[#111518] px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1">Premier League Likeness</p>
        <p className="text-sm font-bold text-[#1C1C1C] dark:text-[#E5E6E3] truncate">{name}</p>
        <p className="text-xs text-[#737373] mt-0.5">{club}</p>
      </div>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${posClass}`}>
        {position}
      </span>
    </div>
  )
}
