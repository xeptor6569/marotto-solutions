# Storage, backups & import

## Where your data lives

The app uses two stores:

- **PostgreSQL** (when `DATABASE_URL` is set): clients, jobs, helpers, contracts, calendar events, sign-in accounts, and the document number counter.
- **Document files** (JSON): invoices, estimates, quotes, and receipts — either on the server's local `data/` volume or on a remote **WebDAV/Nextcloud** share configured in **Settings → Storage** (including the remote folder name).

**Tools → System** shows which storage mode is active right now.

## Backups

**Tools → Backup** downloads a single `.tar.gz` containing database tables, all document files, job attachments, settings, and your uploaded logo. Restoring uploads the same archive back and **replaces** all business data (clients, jobs, contracts, calendar, documents, attachments, settings) with the archive's contents. Sign-in accounts on this server are kept.

Take a backup before upgrades, and store copies somewhere other than the server itself. [Backups & upgrades](../operations.md#backups) shows how to schedule automatic backups on the server.

## Import vs. restore

These are different tools:

- **Tools → Backup & Restore** takes the `.tar.gz` archive downloaded from that same page and restores *everything* (database records, documents, attachments, settings).
- **Tools → Import** takes a JSON array of individual documents (for migrating from another system) and can migrate legacy lead records into client records. It does not read backup archives.
