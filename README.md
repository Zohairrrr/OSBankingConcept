# OS Visualizer

An interactive, heavily animated visualizer for core Operating Systems concepts — built on a real **C backend** with a **React + Framer Motion** frontend.

Each module is a live simulation you configure and run. The algorithms execute in C and stream results to the UI as JSON.

---

## Modules

### CPU Scheduling
Simulate FCFS, Priority (non-preemptive), and Round Robin scheduling. Configure processes with arrival time, burst time, and priority. Results show:
- Animated Gantt chart with per-process color coding
- Per-process metrics: completion, wait time, turnaround
- Avg wait time and avg turnaround with count-up animation

### Banker's Algorithm
Deadlock avoidance via the Banker's safety algorithm. Input allocation and maximum need matrices, check if the system is in a safe state. Results show:
- SAFE / UNSAFE badge with glow
- Animated safe execution sequence with step numbers
- Computed Need matrix with spring-animated cell pop-in
- Step-by-step safety algorithm trace showing work vector transitions

### Memory Management
Page replacement simulation with FIFO and LRU. Enter a reference string and frame count. Results show:
- Side-by-side animated frame players (play / pause / step)
- Page fault flashes red, hits flash green
- Bar chart comparing page faults across 1–8 frame counts
- Hit ratio and fault count for each algorithm

### IPC Messaging
System V message queue simulation. Client threads send transactions to a server thread. Results show:
- SVG node diagram — server in center, clients in orbit
- Animated packets traveling between nodes with trail lines
- Server load bar and per-client transaction count badges
- Speed controls (0.5× / 1× / 1.5× / 2×)
- Full event timeline list

---

## Stack

| Layer | Tech |
|---|---|
| Backend | C (POSIX sockets, pthreads, no external libs) |
| Frontend | React 18, Vite, Framer Motion, Recharts |
| Communication | HTTP JSON API on `localhost:8765` |

---

## Project Structure

```
OSViz/
├── backend/
│   ├── include/osv.h          # Shared structs and prototypes
│   └── src/
│       ├── main.c             # HTTP server + router (port 8765)
│       ├── scheduling.c       # FCFS, Priority, Round Robin → JSON
│       ├── banker.c           # Banker's safety algorithm → JSON
│       ├── memory.c           # FIFO and LRU page replacement → JSON
│       └── ipc_sim.c          # IPC message timeline simulation → JSON
└── frontend/
    └── src/
        ├── pages/             # Scheduling, Banker, Memory, IPC, Home
        └── components/        # GanttChart, BankerMatrix, MemoryFrames, IPCThread
```

---

## Running Locally

### Prerequisites
- GCC with pthreads (`-lpthread -lm`)
- Node.js 18+

### Start

```bash
# Clone
git clone https://github.com/Zohairrrr/OSBankingConcept.git
cd OSBankingConcept

# Run both servers
chmod +x start.sh
./start.sh
```

- Frontend: `http://localhost:5173`
- C API: `http://localhost:8765`

### Or manually

```bash
# Build and run C backend
gcc -Wall -O2 -I backend/include -o backend/osv backend/src/*.c -lpthread -lm
./backend/osv

# In another terminal — frontend
cd frontend
npm install
npm run dev
```

---

## API Endpoints

All endpoints accept `POST` with JSON body and respond with JSON.

| Endpoint | Description |
|---|---|
| `POST /api/scheduling` | Run FCFS / Priority / RR scheduling |
| `POST /api/banker` | Run Banker's safety algorithm |
| `POST /api/memory` | Run FIFO + LRU page replacement |
| `POST /api/ipc` | Simulate IPC message passing |
| `GET /api/health` | Health check |

---

## Credits

Algorithms ported from a CLI banking OS simulation built in C using POSIX threads, System V IPC, and semaphores.

Built by **Zohair Yasin** — CS Student @ NUCES
