#!/bin/sh
# Applies pending database migrations, then starts the app. Migrating is a
# no-op when the schema is current, so this is safe on every start; a failed
# migration stops the container instead of serving against a stale schema.
set -e

if [ -n "$DATABASE_URL" ] && [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
    attempt=1
    until node /opt/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma; do
        if [ "$attempt" -ge 5 ]; then
            echo "Database migrations failed after $attempt attempts; not starting the app." >&2
            exit 1
        fi
        echo "Migration attempt $attempt failed; retrying in 5s..." >&2
        attempt=$((attempt + 1))
        sleep 5
    done
fi

exec "$@"
