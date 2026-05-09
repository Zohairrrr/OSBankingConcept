import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Scheduling from './pages/Scheduling.jsx'
import Banker from './pages/Banker.jsx'
import Memory from './pages/Memory.jsx'
import IPC from './pages/IPC.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="/banker" element={<Banker />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/ipc" element={<IPC />} />
      </Routes>
    </BrowserRouter>
  )
}
