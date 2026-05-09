import React from 'react'
import { motion } from 'framer-motion'

const PALETTE = [
  '#06b6d4', '#a855f7', '#22c55e', '#f97316',
  '#f43f5e', '#eab308', '#3b82f6', '#ec4899',
  '#14b8a6', '#8b5cf6',
]

export default function GanttChart({ gantt, totalTime }) {
  if (!gantt || gantt.length === 0) return null

  const maxT = totalTime || Math.max(...gantt.map(g => g.end))
  const colorMap = {}
  gantt.forEach(g => {
    if (!(g.pid in colorMap)) {
      colorMap[g.pid] = PALETTE[Object.keys(colorMap).length % PALETTE.length]
    }
  })

  const tickInterval = Math.max(1, Math.ceil(maxT / 12))
  const ticks = []
  for (let t = 0; t <= maxT; t += tickInterval) ticks.push(t)
  if (ticks[ticks.length - 1] !== maxT) ticks.push(maxT)

  return (
    <div style={{ width: '100%' }}>
      {/* Gantt bars */}
      <div style={{
        position: 'relative',
        height: 52,
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {gantt.map((slice, i) => {
          const left  = (slice.start / maxT) * 100
          const width = ((slice.end - slice.start) / maxT) * 100
          const color = colorMap[slice.pid]
          return (
            <motion.div
              key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                delay: i * 0.06,
                duration: 0.4,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                top: 4, bottom: 4,
                left: `${left}%`,
                width: `${width}%`,
                background: `${color}30`,
                borderLeft: `3px solid ${color}`,
                borderRadius: '0 6px 6px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'left center',
                overflow: 'hidden',
              }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 + 0.35 }}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  paddingLeft: 6,
                }}
              >
                {slice.label}
              </motion.span>
            </motion.div>
          )
        })}
      </div>

      {/* Time axis */}
      <div style={{ position: 'relative', height: 24, marginTop: 2 }}>
        {ticks.map(t => (
          <span
            key={t}
            style={{
              position: 'absolute',
              left: `${(t / maxT) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--muted)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
