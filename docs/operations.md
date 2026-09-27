# Backups & upgrades

## Backups

### In-app backup (everything in one file)

**Tools → Backup & Restore → Download backup** produces a single `.tar.gz` archive containing:

- every database table: clients, jobs, helpers, contracts, calendar events, document counters, presets
- every document file: invoices, estimates, quotes, receipts, leads
- job attachments
- your settings, presets, and uploaded logo

Store copies somewhere other than the server: your laptop, cloud storage, or a NAS. Take one before every upgrade.

The in-app backup needs a signed-in admin, so it's manual. Pair it with the scheduled host-level backup below.

### Scheduled host-level backup

Run this from the directory containing `docker-compose.yml`, for example from a nightly cron job on the host:

```bash
#!/bin/sh
set -e
cd /path/to/backoffice
STAMP=$(date +%F)
DEST=/var/backups/backoffice
PROJECT=$(basename "$PWD")   # or your COMPOSE_PROJECT_NAME
mkdir -p "$DEST"

# Database
docker compose exec -T postgres pg_dump -U marotto marotto_db | gzip > "$DEST/db-$STAMP.sql.gz"

# Documents, settings, logo, attachments
docker run --rm -v "${PROJECT}_marotto_data:/data:ro" -v "$DEST:/out" alpine \
  tar -czf "/out/data-$STAMP.tar.gz" -C /data .

# Keep 30 days
find "$DEST" -name '*.gz' -mtime +30 -delete
```

Copy `$DEST` off the server, for example with `rclone` or `restic`. Check the volume name with `docker volume ls`.

If documents are stored on WebDAV/Nextcloud, back up that server too. The data volume then holds only settings, logo, and attachments.

### Restoring

**From an in-app archive:** open **Tools → Backup & Restore**, choose the `.tar.gz`, and confirm.

- Restore **replaces** all business data (clients, jobs, contracts, calendar, documents, attachments, settings) with the archive's contents.
- **Sign-in accounts on this server are kept**, so you stay signed in.
- Archives from older versions of the app restore too.

**Moving to a new server:** install fresh ([Getting started](getting-started.md) steps 1–5), create an admin in the setup wizard, then restore the archive. Your business name, branding, and data all come back. Update DNS last.

**From host-level backups:**

```bash
gunzip -c db-2026-01-31.sql.gz | docker compose exec -T postgres psql -U marotto -d marotto_db
docker run --rm -v "${PROJECT}_marotto_data:/data" -v /var/backups/backoffice:/in alpine \
  sh -c "rm -rf /data/* && tar -xzf /in/data-2026-01-31.tar.gz -C /data"
docker compose restart web
```

Restore the SQL dump into an **empty** database. Stop the app first so it doesn't create tables while you restore: `docker compose stop web`, drop and recreate `marotto_db` (`docker compose exec postgres dropdb -U marotto marotto_db && docker compose exec postgres createdb -U marotto marotto_db`), run the `psql` command above, restore the data volume, then `docker compose start web`.

## Upgrading

```bash
cd /path/to/backoffice

# 1. Back up (Tools → Backup & Restore, and/or the host-level script)

# 2. Get the new version
git pull

# 3. Rebuild and restart (database changes are applied automatically on startup)
docker compose up -d --build
```

Then open **Tools → System** to confirm the database, storage, and email checks are green. Downtime is usually under a minute: the old container keeps serving while the new image builds.

Check `env.example` for new optional settings after upgrading (`git diff HEAD@{1} -- env.example`).

To test an upgrade against a copy of your data first, run a second instance ([Deploying → Running a second instance](deployment.md#running-a-second-instance)) and restore a backup into it.

### Rolling back

Database migrations only move forward. To go back to an earlier version:

1. `git checkout <previous-commit-or-tag>`
2. `docker compose up -d --build`
3. If the upgrade included database migrations, restore the backup you took beforehand.

## Migrating from another system

- **Documents:** **Tools → Import** accepts a JSON array of invoices, estimates, quotes, or receipts. Import does not read backup archives; use Restore for those.
- **Numbering:** to continue your old sequence, set the starting number under **Settings → Documents** before creating new documents.
- **Clients:** add them in the app, or let them appear as quote requests come in from the public site.

## Logs

```bash
docker compose logs -f web        # the app
docker compose logs -f cron       # scheduler
docker compose exec cron tail -n 50 /var/log/contracts-cron.log /var/log/calendar-cron.log
```
