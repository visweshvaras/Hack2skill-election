# Python Tracker — Cloud Run Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create snapshots directory (ephemeral in Cloud Run, but kept for local compat)
RUN mkdir -p snapshots

ENV PORT=8080

# Use gunicorn for production
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120 app:app
