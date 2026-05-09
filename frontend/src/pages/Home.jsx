import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const MODULES = [
  {
    path: '/scheduling',
    name: 'CPU Scheduling',
    color: 'var(--cyan)',
    dim: 'var(--cyan-dim)',
    glow: 'var(--cyan-glow)',
    colorHex: '#00d9f5',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="8" width="6" height="16" rx="2" fill="currentColor" opacity="0.9"/>
        <rect x="11" y="4" width="6" height="20" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="20" y="11" width="6" height="13" rx="2" fill="currentColor" opacity="0.5"/>
        <line x1="2" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
      </svg>
    ),
    tags: ['FCFS', 'Priority', 'Round Robin'],
    detail: 'Animated Gantt charts as algorithms run. Live metrics on wait time & turnaround.',
  },
  {
    path: '/banker',
    name: "Banker's Algorithm",
    color: 'var(--purple)',
    dim: 'var(--purple-dim)',
    glow: 'var(--purple-glow)',
    colorHex: '#b06ef3',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <polygon points="16,3 29,10 29,22 16,29 3,22 3,10" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.9"/>
        <polygon points="16,9 23,13 23,19 16,23 9,19 9,13" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.18"/>
        <circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    tags: ['Deadlock Avoidance', 'Safety Check', 'Resource Req'],
    detail: 'Watch safety algorithm propagate through matrices. Step-by-step safe sequence.',
  },
  {
    path: '/memory',
    name: 'Memory Management',
    color: 'var(--green)',
    dim: 'var(--green-dim)',
    glow: 'var(--green-glow)',
    colorHex: '#00e878',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="5" width="28" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9"/>
        <rect x="2" y="15" width="28" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <rect x="2" y="5" width="7" height="7" rx="2" fill="currentColor" opacity="0.5"/>
        <rect x="2" y="15" width="13" height="7" rx="2" fill="currentColor" opacity="0.35"/>
        <rect x="5" y="25" width="5" height="3" rx="1" fill="currentColor" opacity="0.4"/>
        <rect x="12" y="25" width="5" height="3" rx="1" fill="currentColor" opacity="0.4"/>
        <rect x="19" y="25" width="5" height="3" rx="1" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
    tags: ['FIFO', 'LRU', 'Fault Analysis'],
    detail: 'Frames load and evict in real time. Compare algorithms with animated fault graphs.',
  },
  {
    path: '/ipc',
    name: 'IPC Messaging',
    color: 'var(--orange)',
    dim: 'var(--orange-dim)',
    glow: 'var(--orange-glow)',
    colorHex: '#ff7a29',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="8" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="24" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="16" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M12 10 L20 10" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
        <path d="M10 14 L14 21" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
        <path d="M22 14 L18 21" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
        <circle cx="16" cy="10" r="1.5" fill="currentColor" opacity="0.8"/>
      </svg>
    ),
    tags: ['Message Queue', 'Threads', 'Client-Server'],
    detail: 'Glowing packets travel between thread nodes. Live message queue simulation.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
    }}>

      {/* Background — big radial blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '-5%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,217,245,0.055) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}/>
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(176,110,243,0.055) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}/>
      </div>

      {/* Grid bg */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}>
        <defs>
          <pattern id="g" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0L0 0 0 56" fill="none" stroke="white" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
      </svg>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 900,
        margin: '0 auto',
        padding: '80px 24px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 52,
      }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '4px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 18,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ◆ Operating Systems Concepts ◆
          </motion.div>

          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 88px)',
            fontWeight: 900,
            letterSpacing: '-3px',
            lineHeight: 1,
            background: 'linear-gradient(130deg, #e2e8f0 0%, #94a3b8 35%, #00d9f5 65%, #b06ef3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            OS Visualizer
          </h1>

          <p style={{
            marginTop: 20,
            fontSize: 16,
            color: 'var(--muted2)',
            maxWidth: 500,
            lineHeight: 1.65,
            margin: '20px auto 0',
          }}>
            Core OS algorithms — live, interactive, animated.
            <br/>Built on real C simulation running under the hood.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 18,
          width: '100%',
          maxWidth: 800,
        }}>
          {MODULES.map((mod, idx) => (
            <motion.div
              key={mod.path}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.97 }}
              onHoverStart={() => setHovered(idx)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => navigate(mod.path)}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${hovered === idx ? mod.colorHex + '55' : 'var(--border)'}`,
                borderRadius: 22,
                padding: '28px 26px 24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: hovered === idx
                  ? `0 0 0 1px ${mod.colorHex}22, 0 24px 64px rgba(0,0,0,0.6), 0 0 80px ${mod.colorHex}15`
                  : '0 2px 16px rgba(0,0,0,0.4)',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
            >
              {/* Inner glow on hover */}
              <motion.div
                animate={{ opacity: hovered === idx ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: `radial-gradient(ellipse at 20% 20%, ${mod.colorHex}12 0%, transparent 60%)`,
                  borderRadius: 'inherit',
                }}
              />

              {/* Noise texture overlay */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
              }}/>

              {/* Icon + tag row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
                <motion.div
                  animate={{ color: hovered === idx ? mod.colorHex : mod.colorHex + 'aa' }}
                  transition={{ duration: 0.2 }}
                  style={{ filter: hovered === idx ? `drop-shadow(0 0 10px ${mod.colorHex}80)` : 'none', transition: 'filter 0.25s' }}
                >
                  {mod.icon}
                </motion.div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: 999,
                  background: `${mod.colorHex}12`,
                  border: `1px solid ${mod.colorHex}28`,
                  color: mod.color,
                }}>
                  {mod.tags[0]}
                </div>
              </div>

              {/* Name */}
              <h2 style={{
                fontSize: 19, fontWeight: 700,
                color: 'var(--text)', marginBottom: 8,
                letterSpacing: '-0.3px',
              }}>{mod.name}</h2>

              {/* Detail */}
              <p style={{
                fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 20,
              }}>{mod.detail}</p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {mod.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 10, fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '3px 9px', borderRadius: 999,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border2)',
                    color: 'var(--muted2)',
                  }}>{t}</span>
                ))}
              </div>

              {/* Arrow */}
              <motion.div
                animate={{
                  x: hovered === idx ? 3 : 0,
                  opacity: hovered === idx ? 1 : 0.3,
                  color: hovered === idx ? mod.colorHex : 'var(--muted)',
                }}
                style={{ position: 'absolute', bottom: 26, right: 28, fontSize: 18 }}
              >→</motion.div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.3px', textAlign: 'center' }}
        >
          Start the C backend with{' '}
          <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted2)', background: 'var(--surface2)', padding: '2px 7px', borderRadius: 5 }}>
            ./start.sh
          </code>{' '}
          before running simulations
        </motion.p>
      </div>
    </div>
  )
}
