#!/bin/bash

# MindMap AI — Start Script
# Starts PostgreSQL check, backend, and frontend dev servers

set -e

echo "Starting MindMap AI..."

# Check PostgreSQL
if ! pg_isready -q 2>/dev/null; then
  echo "PostgreSQL is not running. Please start it first."
  exit 1
fi
echo "PostgreSQL is running."

# Run Prisma migrations
echo "Running database migrations..."
cd backend
npx prisma migrate deploy --schema=prisma/schema.prisma 2>/dev/null || npx prisma migrate dev --name init --schema=prisma/schema.prisma
cd ..

# Start backend
echo "Starting backend on http://localhost:3000..."
cd backend
npx tsx watch src/index.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

# Start frontend
echo "Starting frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "MindMap AI is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers."

# Handle Ctrl+C — kill both processes
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for either process to exit
wait
