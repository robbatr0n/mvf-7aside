export function PlayerPin({
  name,
  rating,
  isKeeper = false,
  isMotm = false,
  empty = false,
}: {
  name?: string
  rating?: number
  isKeeper?: boolean
  isMotm?: boolean
  empty?: boolean
}) {
  if (empty) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
          <span className="text-white/30 text-xs">?</span>
        </div>
        <span className="text-white/30 text-xs font-medium">No GK</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isKeeper
          ? "bg-yellow-500/20 border-yellow-400"
          : isMotm
            ? "bg-amber-400/20 border-amber-400"
            : "bg-[#FFFFFF]/20 border-white"
          }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${isKeeper ? "bg-yellow-400" : isMotm ? "bg-amber-400" : "bg-[#FFFFFF]"
            }`}
        />
      </div>
      <span
        className={`text-xs font-medium text-center leading-tight max-w-[64px] drop-shadow ${isKeeper ? "text-yellow-300" : isMotm ? "text-amber-300" : "text-white"
          }`}
      >
        {name}
      </span>
      {rating !== undefined && (
        <span className="text-[10px] font-bold drop-shadow text-white/70">
          {rating.toFixed(1)}
        </span>
      )}
      {isMotm && (
        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider drop-shadow">
          MOTM
        </span>
      )}
    </div>
  )
}
