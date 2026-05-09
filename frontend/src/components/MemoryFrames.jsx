import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MemoryFrames({ steps, numFrames, label, color, colorDim }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    setStepIdx(0)
    setPlaying(false)
  }, [steps])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 400)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, steps.length])

  if (!steps || steps.length === 0) return null

  const current = steps[stepIdx]
  const isFault = current.fault

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isFault ? 'var(--red)' : color}40`,
      borderRadius: 16,
      padding: '20px',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', color,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {label}
        </div>
        <motion.div
          key={`${stepIdx}-${isFault}`}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            padding: '3px 12px',
            borderRadius: 999,
            fontSize: 11, fontWeight: 700,
            background: isFault ? 'var(--red-dim)' : `${color}20`,
            border: `1px solid ${isFault ? 'var(--red)' : color}60`,
            color: isFault ? 'var(--red)' : color,
          }}
        >
          {isFault ? '⚡ PAGE FAULT' : '✓ HIT'}
        </motion.div>
      </div>

      {/* Current page */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', marginRight: 8 }}>Page</span>
        <motion.span
          key={current.page}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            fontSize: 28, fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            color: isFault ? 'var(--red)' : color,
          }}
        >
          {current.page}
        </motion.span>
      </div>

      {/* Frames */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20,
      }}>
        {Array.from({ length: numFrames }, (_, f) => {
          const val = current.frames[f]
          const isEmpty = val === -1
          const isEvicted = current.evicted === val && val !== -1 && isFault
          return (
            <motion.div
              key={f}
              layout
              style={{
                width: 56, height: 56,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10,
                background: isEmpty ? 'var(--surface2)' : `${color}20`,
                border: `2px solid ${isEmpty ? 'var(--border)' : isEvicted ? 'var(--red)' : isFault && f < numFrames && current.frames[f] === current.page ? color : `${color}60`}`,
                fontSize: 18, fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: isEmpty ? 'var(--border2)' : color,
                boxShadow: !isEmpty && !isFault ? `0 0 12px ${colorDim}` : 'none',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={val}
                  initial={{ opacity: 0, scale: 0.5, rotateX: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotateX: -90 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'block' }}
                >
                  {isEmpty ? '—' : val}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={() => { setPlaying(false); setStepIdx(0) }}
          style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            color: 'var(--muted2)', fontSize: 14, cursor: 'pointer',
          }}
        >⏮</button>
        <button
          onClick={() => setStepIdx(s => Math.max(0, s - 1))}
          style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            color: 'var(--muted2)', fontSize: 14, cursor: 'pointer',
          }}
        >◀</button>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{
            padding: '6px 20px', borderRadius: 8,
            background: `${color}20`, border: `1px solid ${color}60`,
            color, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={() => setStepIdx(s => Math.min(steps.length - 1, s + 1))}
          style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            color: 'var(--muted2)', fontSize: 14, cursor: 'pointer',
          }}
        >▶</button>
        <span style={{
          fontSize: 12, color: 'var(--muted)',
          fontFamily: "'JetBrains Mono', monospace", marginLeft: 4,
        }}>
          {stepIdx + 1}/{steps.length}
        </span>
      </div>
    </div>
  )
}
