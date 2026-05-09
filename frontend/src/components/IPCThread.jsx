import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

const CLIENT_COLORS = ['#00d9f5','#b06ef3','#00e878','#ff7a29','#f43f5e']

function getClientPos(idx, total, cx, cy, r) {
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function ServerNode({ isActive, queueLen, cx, cy }) {
  return (
    <g>
      {/* Outer pulse ring */}
      {isActive && (
        <motion.circle cx={cx} cy={cy} r={44}
          fill="none" stroke="rgba(255,122,41,0.25)" strokeWidth="1"
          initial={{ r: 36, opacity: 0.8 }}
          animate={{ r: 56, opacity: 0 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      {/* Second ring */}
      <circle cx={cx} cy={cy} r={36}
        fill="rgba(255,122,41,0.06)"
        stroke={isActive ? 'rgba(255,122,41,0.5)' : 'rgba(255,122,41,0.15)'}
        strokeWidth="1"
        style={{ transition: 'stroke 0.3s' }}
      />
      {/* Main circle */}
      <motion.circle cx={cx} cy={cy} r={28}
        fill="#0e0e18"
        stroke={isActive ? '#ff7a29' : 'rgba(255,122,41,0.35)'}
        strokeWidth={isActive ? 2 : 1.5}
        animate={{ filter: isActive ? 'drop-shadow(0 0 14px rgba(255,122,41,0.8))' : 'drop-shadow(0 0 4px rgba(255,122,41,0.2))' }}
        transition={{ duration: 0.3 }}
      />
      {/* Label */}
      <text x={cx} y={cy - 5} textAnchor="middle"
        fill={isActive ? '#ff7a29' : 'rgba(255,122,41,0.7)'}
        fontSize="9" fontWeight="800"
        fontFamily="JetBrains Mono,monospace"
        style={{ transition: 'fill 0.3s' }}>SERVER</text>
      {/* Queue indicator */}
      <text x={cx} y={cy + 8} textAnchor="middle"
        fill="rgba(255,122,41,0.5)" fontSize="8"
        fontFamily="JetBrains Mono,monospace">
        {isActive ? 'PROC...' : queueLen > 0 ? `Q:${queueLen}` : 'IDLE'}
      </text>
      {/* Queue dots */}
      {queueLen > 0 && Array.from({length: Math.min(queueLen, 4)}, (_, k) => (
        <motion.circle key={k}
          cx={cx - 6 + k * 4} cy={cy + 18} r={2.5}
          fill={isActive && k === 0 ? '#ff7a29' : 'rgba(255,122,41,0.3)'}
          animate={{ opacity: isActive && k === 0 ? [0.4, 1, 0.4] : 1 }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      ))}
    </g>
  )
}

function ClientNode({ cid, pos, isActive, isSending, color, eventsCount }) {
  return (
    <g>
      {isActive && (
        <motion.circle cx={pos.x} cy={pos.y} r={28}
          fill="none" stroke={color} strokeWidth="1" opacity="0.4"
          initial={{ r: 24, opacity: 0.6 }}
          animate={{ r: 34, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <motion.circle cx={pos.x} cy={pos.y} r={22}
        fill="#0e0e18"
        stroke={isActive ? color : color + '40'}
        strokeWidth={isActive ? 2 : 1.5}
        animate={{
          filter: isActive ? `drop-shadow(0 0 10px ${color}aa)` : `drop-shadow(0 0 2px ${color}22)`,
        }}
        transition={{ duration: 0.3 }}
      />
      <text x={pos.x} y={pos.y - 4} textAnchor="middle"
        fill={isActive ? color : color + '99'}
        fontSize="10" fontWeight="800"
        fontFamily="JetBrains Mono,monospace"
        style={{ transition: 'fill 0.3s' }}>C{cid}</text>
      <text x={pos.x} y={pos.y + 8} textAnchor="middle"
        fill="rgba(255,255,255,0.25)" fontSize="7.5"
        fontFamily="JetBrains Mono,monospace">
        {isSending ? 'sending' : 'idle'}
      </text>
      {/* Tx count badge */}
      {eventsCount > 0 && (
        <g>
          <circle cx={pos.x + 16} cy={pos.y - 16} r={8} fill={color} opacity="0.9"/>
          <text x={pos.x + 16} y={pos.y - 12} textAnchor="middle"
            fill="#000" fontSize="8" fontWeight="800">{eventsCount}</text>
        </g>
      )}
    </g>
  )
}

function Packet({ fromPos, toPos, color, label, onDone }) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Trail line */}
      <motion.line
        x1={fromPos.x} y1={fromPos.y}
        x2={fromPos.x} y2={fromPos.y}
        stroke={color} strokeWidth="1.5" opacity="0.3"
        animate={{ x2: toPos.x, y2: toPos.y }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />
      {/* Glow circle */}
      <motion.circle r={6}
        fill={color}
        filter={`url(#glow-${color.replace(/[^a-z0-9]/gi,'')})`}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        initial={{ cx: fromPos.x, cy: fromPos.y, opacity: 1, r: 5 }}
        animate={{
          cx: [fromPos.x, toPos.x],
          cy: [fromPos.y, toPos.y],
          opacity: [0, 1, 1, 0],
          r: [3, 7, 7, 3],
        }}
        transition={{ duration: 0.9, ease: 'easeInOut', times: [0, 0.1, 0.85, 1] }}
        onAnimationComplete={onDone}
      />
      {/* Label floating along midpoint */}
      <motion.text
        textAnchor="middle"
        fill={color}
        fontSize="9" fontWeight="700"
        fontFamily="JetBrains Mono,monospace"
        initial={{
          x: fromPos.x,
          y: fromPos.y - 12,
          opacity: 0,
        }}
        animate={{
          x: [(fromPos.x + toPos.x) / 2],
          y: [(fromPos.y + toPos.y) / 2 - 14],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: 0.9, ease: 'easeInOut', times: [0, 0.2, 0.8, 1] }}
      >{label}</motion.text>
    </motion.g>
  )
}

export default function IPCThread({ events, numClients }) {
  const [evtIdx, setEvtIdx]     = useState(-1)
  const [playing, setPlaying]   = useState(false)
  const [speed, setSpeed]       = useState(1200)
  const [packets, setPackets]   = useState([])
  const [serverActive, setServerActive] = useState(false)
  const [serverQueue, setServerQueue]   = useState(0)
  const intervalRef = useRef(null)
  const packetId    = useRef(0)

  const W = 500, H = 340, cx = W / 2, cy = H / 2 - 10, r = 128

  useEffect(() => {
    setEvtIdx(-1); setPlaying(false)
    setPackets([]); setServerActive(false); setServerQueue(0)
  }, [events])

  const advance = (prev) => {
    const next = prev + 1
    if (next >= events.length) { setPlaying(false); return prev }
    const ev = events[next]
    const isToServer = ev.to === 'Server'
    if (isToServer) setServerQueue(q => q + 1)
    else            setServerQueue(q => Math.max(0, q - 1))
    setServerActive(ev.to === 'Server' || ev.from === 'Server')
    const fromPos = nodePos(ev.from)
    const toPos   = nodePos(ev.to)
    if (fromPos && toPos) {
      const id = packetId.current++
      const color = ev.type === 'send' ? '#ff7a29' : '#00e878'
      const shortMsg = ev.msg.length > 22 ? ev.msg.slice(0, 19) + '…' : ev.msg
      setPackets(p => [...p, { id, fromPos, toPos, color, label: shortMsg }])
      setTimeout(() => setPackets(p => p.filter(x => x.id !== id)), speed)
    }
    return next
  }

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => setEvtIdx(advance), speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, events])

  if (!events || events.length === 0) return null

  const clientIds = [...new Set(
    events.flatMap(e => [e.from, e.to]
      .map(x => x.match(/Client (\d+)/)?.[1])
      .filter(Boolean)
      .map(Number))
  )].sort().slice(0, numClients)

  const nodePos = (name) => {
    if (name === 'Server') return { x: cx, y: cy }
    const m = name.match(/Client (\d+)/)
    if (!m) return null
    const idx = clientIds.indexOf(parseInt(m[1]))
    if (idx === -1) return null
    return getClientPos(idx, clientIds.length, cx, cy, r)
  }

  const currentEvt = evtIdx >= 0 && evtIdx < events.length ? events[evtIdx] : null
  const activeClient = currentEvt
    ? (currentEvt.from === 'Server' ? currentEvt.to : currentEvt.from)
    : null

  // Per-client tx counts
  const txCounts = {}
  events.slice(0, Math.max(0, evtIdx + 1))
    .filter(e => e.type === 'send')
    .forEach(e => { txCounts[e.from] = (txCounts[e.from] || 0) + 1 })

  return (
    <div>
      {/* SVG */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a12, #0d0d18)',
        border: '1px solid rgba(255,122,41,0.12)',
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 14,
        position: 'relative',
      }}>
        {/* Server load bar */}
        <div style={{
          position: 'absolute', top: 12, right: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,122,41,0.5)', fontFamily:'monospace', letterSpacing:'1px', textTransform:'uppercase' }}>Server Load</span>
          <div style={{ width: 80, height: 4, background: 'rgba(255,122,41,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: serverActive ? '100%' : `${Math.min(serverQueue * 25, 100)}%` }}
              transition={{ duration: 0.3 }}
              style={{
                height: '100%',
                background: serverActive
                  ? 'linear-gradient(90deg, #ff7a29, #f97316)'
                  : 'linear-gradient(90deg, rgba(255,122,41,0.4), rgba(255,122,41,0.2))',
                borderRadius: 2,
                boxShadow: serverActive ? '0 0 8px rgba(255,122,41,0.6)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: 'rgba(255,122,41,0.08)',
        }}>
          <motion.div
            animate={{ width: `${events.length > 0 ? ((evtIdx + 1) / events.length) * 100 : 0}%` }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%', background: 'rgba(255,122,41,0.5)', borderRadius: 1 }}
          />
        </div>

        <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
          {/* Grid dots */}
          {Array.from({length:6},(_,row) => Array.from({length:8},(_,col) => (
            <circle key={`${row}-${col}`}
              cx={col*72+8} cy={row*60+10} r={0.8}
              fill="rgba(255,255,255,0.04)"
            />
          )))}

          {/* Connection lines — static */}
          {clientIds.map(cid => {
            const pos = getClientPos(clientIds.indexOf(cid), clientIds.length, cx, cy, r)
            const isActive = `Client ${cid}` === activeClient
            const clientColor = CLIENT_COLORS[clientIds.indexOf(cid) % CLIENT_COLORS.length]
            return (
              <line key={cid}
                x1={cx} y1={cy} x2={pos.x} y2={pos.y}
                stroke={isActive ? clientColor + '55' : 'rgba(255,255,255,0.04)'}
                strokeWidth={isActive ? 1.5 : 1}
                strokeDasharray={isActive ? '0' : '5 5'}
                style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
              />
            )
          })}

          {/* Animated packets */}
          <AnimatePresence>
            {packets.map(p => (
              <Packet key={p.id} {...p} onDone={() => {}} />
            ))}
          </AnimatePresence>

          {/* Server */}
          <ServerNode isActive={serverActive} queueLen={serverQueue} cx={cx} cy={cy} />

          {/* Clients */}
          {clientIds.map((cid, idx) => {
            const pos = getClientPos(idx, clientIds.length, cx, cy, r)
            const name = `Client ${cid}`
            const isActive = name === activeClient
            const isSending = currentEvt?.from === name
            const color = CLIENT_COLORS[idx % CLIENT_COLORS.length]
            return (
              <ClientNode key={cid} cid={cid} pos={pos}
                isActive={isActive} isSending={isSending}
                color={color} eventsCount={txCounts[name] || 0}
              />
            )
          })}
        </svg>

        {/* Active message bar */}
        <div style={{
          borderTop: '1px solid rgba(255,122,41,0.1)',
          minHeight: 48,
          display: 'flex', alignItems: 'center',
          padding: '10px 18px', gap: 12,
        }}>
          <AnimatePresence mode="wait">
            {currentEvt ? (
              <motion.div key={evtIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '1.5px',
                  textTransform: 'uppercase', flexShrink: 0,
                  padding: '3px 9px', borderRadius: 999,
                  background: currentEvt.type==='send' ? 'rgba(255,122,41,0.15)' : 'rgba(0,232,120,0.12)',
                  border: `1px solid ${currentEvt.type==='send' ? 'rgba(255,122,41,0.4)' : 'rgba(0,232,120,0.35)'}`,
                  color: currentEvt.type==='send' ? '#ff7a29' : '#00e878',
                }}>
                  {currentEvt.type === 'send' ? '▶ SEND' : '◀ RECV'}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                  <span style={{ color: '#00d9f5', fontWeight: 700 }}>{currentEvt.from}</span>
                  {' → '}
                  <span style={{ color: '#ff7a29', fontWeight: 700 }}>{currentEvt.to}</span>
                </span>
                <span style={{
                  fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
                  color: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>{currentEvt.msg}</span>
                <span style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.25)',
                  fontFamily: 'monospace', flexShrink: 0,
                }}>t={currentEvt.t}ms</span>
              </motion.div>
            ) : (
              <motion.span key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}
              >Press play to simulate message passing…</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => { setPlaying(false); setEvtIdx(-1); setPackets([]); setServerActive(false); setServerQueue(0) }}
          style={{ padding:'7px 13px', borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--muted2)', fontSize:14, cursor:'pointer' }}>
          ⏮
        </button>
        <button onClick={() => setEvtIdx(prev => {
          const next = Math.max(-1, prev - 1)
          if (next >= 0) setServerActive(events[next]?.to === 'Server' || events[next]?.from === 'Server')
          return next
        })}
          style={{ padding:'7px 13px', borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--muted2)', fontSize:14, cursor:'pointer' }}>
          ◀
        </button>
        <button onClick={() => setPlaying(p => !p)}
          style={{
            padding:'7px 22px', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer',
            background: playing ? 'rgba(255,122,41,0.1)' : 'rgba(255,122,41,0.15)',
            border:`1px solid ${playing ? 'rgba(255,122,41,0.5)' : 'rgba(255,122,41,0.35)'}`,
            color:'var(--orange)',
          }}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={() => setEvtIdx(advance)}
          style={{ padding:'7px 13px', borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--muted2)', fontSize:14, cursor:'pointer' }}>
          ▶
        </button>

        {/* Speed */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>Speed</span>
          {[[2000,'0.5×'],[1200,'1×'],[700,'1.5×'],[400,'2×']].map(([ms, label]) => (
            <button key={ms} onClick={() => setSpeed(ms)}
              style={{
                padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700,
                cursor:'pointer', transition:'all 0.15s',
                background: speed===ms ? 'rgba(255,122,41,0.15)' : 'transparent',
                border:`1px solid ${speed===ms ? 'rgba(255,122,41,0.4)' : 'var(--border2)'}`,
                color: speed===ms ? 'var(--orange)' : 'var(--muted2)',
              }}>{label}</button>
          ))}
        </div>

        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginLeft: 8 }}>
          {Math.max(0, evtIdx + 1)}/{events.length}
        </span>
      </div>
    </div>
  )
}
