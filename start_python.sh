#!/bin/bash
# First kill any existing Node.js application
pkill -f "tsx server/index.ts" || true

# Start the Python application
python run.py