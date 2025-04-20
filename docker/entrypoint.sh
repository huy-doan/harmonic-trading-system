#!/bin/sh

set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until nc -z ${POSTGRES_HOST} ${POSTGRES_PORT}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is ready! Starting application..."

# Wait for Redis to be ready if used
if [ ! -z "$REDIS_HOST" ]; then
  echo "Waiting for Redis to be ready..."
  until nc -z ${REDIS_HOST} ${REDIS_PORT}; do
    echo "Redis is unavailable - sleeping"
    sleep 2
  done
  echo "Redis is ready!"
fi

# Run migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  yarn migration:run
fi

# Run seeds if needed
if [ "$RUN_SEEDS" = "true" ]; then
  echo "Running database seeds..."
  yarn seed
fi

# Start the application
echo "Starting the application..."
exec node -r tsconfig-paths/register dist/main.js
