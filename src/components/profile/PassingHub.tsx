import { useMemo, useState } from 'react'
import type { Event, Player } from '../../types'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  playerId: string
  events: Event[]
  players: Player[]
}

interface Relation {
  player: Player
  sent: number
  received: number
}

const SENT_COLOR = '#3b82f6'
const RECEIVED_COLOR = '#16a34a'

export default function PassingHub({ playerId, events, players }: Props) {
  const { isDark } = useTheme()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { relations, subjectFirstName } = useMemo(() => {
    const subject = players.find(p => p.id === playerId)

    const passCompletedById = new Map<string, Event>()
    const receivedByRelatedId = new Map<string, Event>()
    for (const e of events) {
      if (e.event_type === 'pass_completed') passCompletedById.set(e.id, e)
      if (e.event_type === 'pass_received' && e.related_event_id) {
        receivedByRelatedId.set(e.related_event_id, e)
      }
    }

    const sentMap = new Map<string, number>()
    const receivedMap = new Map<string, number>()

    for (const [, pc] of passCompletedById) {
      if (pc.player_id !== playerId) continue
      const recv = receivedByRelatedId.get(pc.id)
      if (recv) sentMap.set(recv.player_id, (sentMap.get(recv.player_id) ?? 0) + 1)
    }

    for (const e of events) {
      if (e.event_type === 'pass_received' && e.player_id === playerId && e.related_event_id) {
        const pc = passCompletedById.get(e.related_event_id)
        if (pc) receivedMap.set(pc.player_id, (receivedMap.get(pc.player_id) ?? 0) + 1)
      }
    }

    const allIds = new Set([...sentMap.keys(), ...receivedMap.keys()])
    const rels: Relation[] = []
    for (const tid of allIds) {
      if (tid === playerId) continue
      const player = players.find(p => p.id === tid)
      if (!player || player.is_guest) continue
      rels.push({ player, sent: sentMap.get(tid) ?? 0, received: receivedMap.get(tid) ?? 0 })
    }
    rels.sort((a, b) => (b.sent + b.received) - (a.sent + a.received))

    return { relations: rels.slice(0, 6), subjectFirstName: subject?.name.split(' ')[0] ?? '' }
  }, [playerId, events, players])

  if (relations.length === 0) return null

  const count = relations.length
  const centerR = 20
  const nodeR = 11
  // Ensure arc spacing between nodes >= 44px for readable labels
  const orbitR = Math.max(95, Math.ceil((44 * count) / (2 * Math.PI)))
  const reach = orbitR + nodeR + 80
  const half = Math.max(160, reach + 8)
  const vbSize = half * 2
  const cx = half, cy = half

  const maxCount = Math.max(...relations.map(r => Math.max(r.sent, r.received)), 1)
  const scaleW = (v: number) => Math.max(1.5, Math.min(5.5, (v / maxCount) * 5.5))

  const hoveredRel = relations.find(r => r.player.id === hoveredId) ?? null

  const cardBg = isDark ? '#111518' : '#ffffff'
  const nodeFill = isDark ? '#1a1e21' : '#f3f4f6'
  const nodeBorder = isDark ? '#2a2e31' : '#D4D3D0'
  const nodeBorderHov = isDark ? '#E5E6E3' : '#1C1C1C'
  const textMuted = isDark ? '#9CA3AF' : '#6b7280'
  const textMain = isDark ? '#E5E6E3' : '#1C1C1C'
  const trackBg = isDark ? '#1a1e21' : '#f3f4f6'

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
        Passing Connections
      </h2>
      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-4">

        <div className="flex items-center gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: textMuted }}>
            <svg width="14" height="3" aria-hidden="true">
              <line x1="0" y1="1.5" x2="14" y2="1.5" stroke={SENT_COLOR} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Sent
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: textMuted }}>
            <svg width="14" height="3" aria-hidden="true">
              <line x1="0" y1="1.5" x2="14" y2="1.5" stroke={RECEIVED_COLOR} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Received
          </span>
        </div>

        <svg viewBox={`0 0 ${vbSize} ${vbSize}`} width="100%" className="max-w-sm mx-auto block">
          {relations.map((rel, i) => {
            const angle = (i / count) * 2 * Math.PI - Math.PI / 2
            const nx = cx + orbitR * Math.cos(angle)
            const ny = cy + orbitR * Math.sin(angle)

            const dx = nx - cx, dy = ny - cy
            const len = Math.sqrt(dx * dx + dy * dy)
            const ux = dx / len, uy = dy / len
            const px = -uy, py = ux  // perpendicular unit vector

            const off = 2.5
            const isHov = hoveredId === rel.player.id

            // Line endpoints: edge of center node → edge of teammate node
            const sx = cx + ux * centerR, sy = cy + uy * centerR
            const ex = nx - ux * nodeR, ey = ny - uy * nodeR

            const labelR = orbitR + nodeR + 8
            const lx = cx + labelR * Math.cos(angle)
            const ly = cy + labelR * Math.sin(angle)
            const ta = Math.cos(angle) > 0.15 ? 'start' : Math.cos(angle) < -0.15 ? 'end' : 'middle'
            return (
              <g
                key={rel.player.id}
                onMouseEnter={() => setHoveredId(rel.player.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'default' }}
              >
                {rel.sent > 0 && (
                  <line
                    x1={sx + px * off} y1={sy + py * off}
                    x2={ex + px * off} y2={ey + py * off}
                    stroke={SENT_COLOR}
                    strokeWidth={scaleW(rel.sent)}
                    strokeOpacity={isHov ? 0.95 : 0.45}
                    strokeLinecap="round"
                  />
                )}
                {rel.received > 0 && (
                  <line
                    x1={sx - px * off} y1={sy - py * off}
                    x2={ex - px * off} y2={ey - py * off}
                    stroke={RECEIVED_COLOR}
                    strokeWidth={scaleW(rel.received)}
                    strokeOpacity={isHov ? 0.95 : 0.45}
                    strokeLinecap="round"
                  />
                )}
                <circle
                  cx={nx} cy={ny} r={nodeR}
                  fill={nodeFill}
                  stroke={isHov ? nodeBorderHov : nodeBorder}
                  strokeWidth={isHov ? 1.5 : 1}
                />
                <text
                  x={lx} y={ly}
                  textAnchor={ta}
                  dominantBaseline="middle"
                  fontSize={11}
                  fill={isHov ? textMain : textMuted}
                  fontWeight={isHov ? 'bold' : 'normal'}
                >
                  {rel.player.name}
                </text>
              </g>
            )
          })}

          {/* Center node */}
          <circle cx={cx} cy={cy} r={centerR} fill={cardBg} stroke={nodeBorder} strokeWidth={1.5} />
          <text
            x={cx} y={cy}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={8.5} fontWeight="bold"
            fill={textMain}
          >
            {subjectFirstName}
          </text>
        </svg>

        {/* Hover info bar */}
        <div className="h-7 flex items-center px-1">
          {hoveredRel ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium" style={{ color: textMain }}>{hoveredRel.player.name}</span>
              <span style={{ color: SENT_COLOR }}>{hoveredRel.sent} sent</span>
              <span style={{ color: RECEIVED_COLOR }}>{hoveredRel.received} received</span>
              <span style={{ color: textMuted }}>{hoveredRel.sent + hoveredRel.received} total</span>
            </div>
          ) : (
            <p className="text-xs" style={{ color: textMuted }}>Hover a player to see pass counts</p>
          )}
        </div>

        {/* Top connections list */}
        <div className="border-t border-[#D4D3D0] dark:border-[#2a2e31] pt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>
            Top connections
          </p>
          {relations.map(rel => {
            const total = rel.sent + rel.received
            const maxTotal = relations[0].sent + relations[0].received
            return (
              <div key={rel.player.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: textMuted }}>{rel.player.name}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: SENT_COLOR }} className="text-[10px]">{rel.sent}↑</span>
                    <span style={{ color: RECEIVED_COLOR }} className="text-[10px]">{rel.received}↓</span>
                    <span style={{ color: textMain }} className="font-semibold w-5 text-right">{total}</span>
                  </div>
                </div>
                <div className="h-1 rounded-full" style={{ background: trackBg }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(total / maxTotal) * 100}%`,
                      background: `linear-gradient(to right, ${SENT_COLOR}, ${RECEIVED_COLOR})`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
