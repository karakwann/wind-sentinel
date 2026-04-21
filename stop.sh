#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDS_FILE="$ROOT/.pids"

if [ ! -f "$PIDS_FILE" ]; then
    echo "Aucun processus trouvé dans .pids — arrêt par port..."
else
    while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" && echo "Arrêté PID=$pid"
        fi
    done < "$PIDS_FILE"
    rm -f "$PIDS_FILE"
fi

# Nettoyage par port en cas de processus orphelins
for port in 8001 5173; do
    pid=$(lsof -ti :"$port" 2>/dev/null)
    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null && echo "Libéré port $port (PID=$pid)"
    fi
done

echo "Wind-Sentinel arrêté."
