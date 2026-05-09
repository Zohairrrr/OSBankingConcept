#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building C backend..."
cd "$SCRIPT_DIR"
gcc -Wall -O2 -I backend/include \
    -o backend/osv \
    backend/src/main.c \
    backend/src/scheduling.c \
    backend/src/banker.c \
    backend/src/memory.c \
    backend/src/ipc_sim.c \
    -lpthread -lm

echo "==> Starting C backend on port 8765..."
./backend/osv &
OSV_PID=$!
echo "    Backend PID: $OSV_PID"

echo "==> Starting React frontend..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
VITE_PID=$!
echo "    Frontend PID: $VITE_PID"

echo ""
echo "  OSViz running at http://localhost:5173"
echo "  API server   at http://localhost:8765"
echo ""
echo "  Press Ctrl+C to stop both processes."

trap "echo ''; echo 'Stopping...'; kill $OSV_PID $VITE_PID 2>/dev/null; exit 0" INT TERM
wait
