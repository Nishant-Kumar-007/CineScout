# Use official lightweight Python image
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    HOST=0.0.0.0

WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and static frontend assets
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY README.md .

# Cloud Run forwards ingress traffic to container port (default 8080)
EXPOSE 8080

# Execute uvicorn server binding to 0.0.0.0 and dynamic $PORT
CMD exec uvicorn backend.server:app --host 0.0.0.0 --port ${PORT:-8080}
