#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Démarrage du backend (port 8001)..."
cd "$ROOT/backend"
uvicorn app.main:app --port 8001 --host 0.0.0.0 &
BACKEND_PID=$!
echo "    Backend PID=$BACKEND_PID"

echo "==> Démarrage du frontend (port 5173)..."
cd "$ROOT/frontend"
node_modules/.bin/vite --port 5173 &
FRONTEND_PID=$!
echo "    Frontend PID=$FRONTEND_PID"

echo "$BACKEND_PID" > "$ROOT/.pids"
echo "$FRONTEND_PID" >> "$ROOT/.pids"

echo ""
echo "Wind-Sentinel démarré :"
echo "  Frontend → http://localhost:5173"
echo "  Backend  → http://localhost:8001"
echo ""
echo "Pour arrêter : ./stop.sh"
