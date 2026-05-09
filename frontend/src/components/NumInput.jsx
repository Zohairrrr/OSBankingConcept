import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function NumInput({
  value, onChange,
  min = 0, max = 9999, step = 1,
  color = 'var(--cyan)',
  label, width = 88,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef()

  const clamp = v => Math.max(min, Math.min(max, v))
  const dec = () => onChange(clamp(value - step))
  const inc = () => onChange(clamp(value + step))

  const startEdit = () => {
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 10)
  }

  const commit = () => {
    const v = parseInt(draft)
    if (!isNaN(v)) onChange(clamp(v))
    setEditing(false)
  }

  const btnBase = {
    width: 26, height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none',
    color: 'var(--muted)', fontSize: 18, fontWeight: 300,
    cursor: 'pointer', flexShrink: 0,
    transition: 'all 0.15s', userSelect: 'none',
    lineHeight: 1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {label && (
        <div style={{
          fontSize: 9, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: '1.2px',
          fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
        }}>{label}</div>
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          width, height: 36,
          background: 'var(--surface2)',
          border: `1px solid ${color}20`,
          borderRadius: 8, overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = `${color}55`}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${color}20`}
      >
        <button
          onClick={dec}
          style={btnBase}
          onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = `${color}18` }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
        >−</button>

        <div style={{
          flex: 1, height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderLeft: `1px solid ${color}12`,
          borderRight: `1px solid ${color}12`,
        }}>
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
              style={{
                width: '100%', height: '100%', textAlign: 'center',
                background: `${color}15`, border: 'none', outline: 'none',
                color, fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 800, fontSize: 15,
              }}
            />
          ) : (
            <motion.span
              key={value}
              initial={{ opacity: 0.3, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
              onClick={startEdit}
              style={{
                color, fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 800, fontSize: 15,
                cursor: 'text', userSelect: 'none',
              }}
            >{value}</motion.span>
          )}
        </div>

        <button
          onClick={inc}
          style={btnBase}
          onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = `${color}18` }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
        >+</button>
      </div>
    </div>
  )
}
