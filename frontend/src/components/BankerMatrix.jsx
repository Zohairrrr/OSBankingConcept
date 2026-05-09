import React from 'react'
import { motion } from 'framer-motion'

export default function BankerMatrix({ title, matrix, names, color, delay = 0 }) {
  if (!matrix || matrix.length === 0) return null
  const m = matrix[0]?.length || 0

  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
        textTransform: 'uppercase', color, marginBottom: 10,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {title}
      </div>
      <div style={{
        background: 'var(--surface2)',
        border: `1px solid ${color}30`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(${m}, 1fr)`,
          background: `${color}10`,
          borderBottom: `1px solid ${color}20`,
        }}>
          <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Process</div>
          {Array.from({ length: m }, (_, j) => (
            <div key={j} style={{
              padding: '8px 0', textAlign: 'center',
              fontSize: 11, color, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              R{j}
            </div>
          ))}
        </div>
        {/* Rows */}
        {matrix.map((row, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${m}, 1fr)`,
            borderBottom: i < matrix.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              padding: '10px 12px', fontSize: 12,
              fontWeight: 600, color: 'var(--muted2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {names?.[i] || `P${i}`}
            </div>
            {row.map((val, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: delay + (i * m + j) * 0.04,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                style={{
                  padding: '10px 0',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: val > 0 ? color : 'var(--muted)',
                }}
              >
                {val}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
