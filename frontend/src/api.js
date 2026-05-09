const BASE = '/api'

const post = (path, data) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())

export const runScheduling = (data) => post('/scheduling', data)
export const runBanker     = (data) => post('/banker', data)
export const runMemory     = (data) => post('/memory', data)
export const runIPC        = (data) => post('/ipc', data)
