# Backup and restore

A backup you have never restored is a hope, not a backup. Everything here ends
with a verification step.

---

## 1. What has to be backed up

| # | What | Where | Lose it and… |
| --- | --- | --- | --- |
| 1 | The database | `DATABASE_URL` — a SQLite file, or a PostgreSQL server | everything: people, results, paths, certificates, audit trail |
| 2 | Uploads | `STORAGE_DIR` (default `./storage`) | completion proofs and capstone attachments |
| 3 | Configuration | `.env` | you have to reconstruct settings and secrets |

Not backed up, because they are rebuilt from source: `node_modules`, `.next`,
`src/generated`. Certificate PDFs are regenerated on demand from database rows —
the row is the record, the PDF is a rendering.

**Recommended targets:** RPO 24 hours (nightly), RTO 4 hours. A learning
platform tolerates a day of loss far better than an ERP; set these to whatever
you will actually meet.

---

## 2. SQLite

### Back up

Do **not** copy the `.db` file with `cp` while the app is running — you can
capture a torn write. Use SQLite's own online backup, which is consistent:

```bash
#!/usr/bin/env bash
# /usr/local/bin/tcai-backup.sh
set -euo pipefail

DB=/var/lib/tc-ai-academy/academy.db
STORAGE=/var/lib/tc-ai-academy/storage
DEST=/backup/tc-ai-academy
STAMP=$(date +%F-%H%M)

mkdir -p "$DEST"
sqlite3 "$DB" ".backup '$DEST/academy-$STAMP.db'"
tar -czf "$DEST/storage-$STAMP.tar.gz" -C "$(dirname "$STORAGE")" "$(basename "$STORAGE")"
gzip -f "$DEST/academy-$STAMP.db"

# 30 days of dailies
find "$DEST" -name 'academy-*.db.gz'    -mtime +30 -delete
find "$DEST" -name 'storage-*.tar.gz'   -mtime +30 -delete
```

```bash
sudo chmod +x /usr/local/bin/tcai-backup.sh
sudo crontab -e
# 02:15 every night
15 2 * * * /usr/local/bin/tcai-backup.sh >> /var/log/tcai-backup.log 2>&1
```

If `sqlite3` is not installed, stop the service, copy the `.db`, `.db-wal` and
`.db-shm` files together, and start it again.

### Restore

```bash
sudo systemctl stop tc-ai-academy

cp /var/lib/tc-ai-academy/academy.db /var/lib/tc-ai-academy/academy.db.broken
gunzip -c /backup/tc-ai-academy/academy-2026-08-19-0215.db.gz \
  > /var/lib/tc-ai-academy/academy.db
rm -f /var/lib/tc-ai-academy/academy.db-wal /var/lib/tc-ai-academy/academy.db-shm

rm -rf /var/lib/tc-ai-academy/storage
tar -xzf /backup/tc-ai-academy/storage-2026-08-19-0215.tar.gz \
  -C /var/lib/tc-ai-academy/

chown -R tcai:tcai /var/lib/tc-ai-academy
sudo systemctl start tc-ai-academy
```

Keep the broken file until the restore is verified (§5).

---

## 3. PostgreSQL

### Back up

```bash
#!/usr/bin/env bash
set -euo pipefail
DEST=/backup/tc-ai-academy
STAMP=$(date +%F-%H%M)
mkdir -p "$DEST"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  --host localhost --username tcai --dbname tcai \
  --format=custom --file "$DEST/tcai-$STAMP.dump"

tar -czf "$DEST/storage-$STAMP.tar.gz" -C /var/lib/tc-ai-academy storage
find "$DEST" -name 'tcai-*.dump' -mtime +30 -delete
```

Under Docker Compose:

```bash
docker compose exec -T db pg_dump -U tcai -d tcai --format=custom \
  > "backup/tcai-$(date +%F).dump"

docker run --rm -v tc-ai-academy_app-storage:/data -v "$PWD/backup:/backup" \
  alpine tar -czf "/backup/storage-$(date +%F).tar.gz" -C /data .
```

For a busy installation, add continuous archiving (`archive_mode=on` plus WAL
shipping) so you can restore to a point in time rather than to last night.

### Restore

```bash
docker compose stop app

docker compose exec -T db dropdb   -U tcai --if-exists tcai
docker compose exec -T db createdb -U tcai tcai
docker compose exec -T db pg_restore -U tcai -d tcai --no-owner < backup/tcai-2026-08-19.dump

docker run --rm -v tc-ai-academy_app-storage:/data -v "$PWD/backup:/backup" \
  alpine sh -c "rm -rf /data/* && tar -xzf /backup/storage-2026-08-19.tar.gz -C /data"

docker compose start app
```

---

## 4. Before every deploy

Migrations are forward-only. Rolling the code back does not roll the schema
back, so the pre-deploy backup **is** the rollback plan.

```bash
/usr/local/bin/tcai-backup.sh        # or the pg_dump equivalent
git pull && npm ci && npm run build
npm run db:deploy                    # apply migrations
sudo systemctl restart tc-ai-academy
curl -fsS https://academy.example.com/api/health
```

If the release goes wrong: restore the database from that backup, redeploy the
previous tag, verify health.

---

## 5. Verifying a restore

Never mark a restore complete on "the service started".

```bash
curl -fsS http://localhost:3000/api/health     # status: ok, database: ok
```

Then, in the application:

1. Sign in as an administrator.
2. **Admin → People** — the employee count matches what you expect.
3. **Admin → Certificates** — open one and follow its verification link; the QR
   page resolves and shows *Valid*.
4. **Admin → Audit** — entries continue up to the backup timestamp.
5. Open an employee with a path in progress; the path, hours and progress are
   intact.
6. Download any report from **Admin → Reports** — proves the database is
   readable end to end, not just openable.
7. Open a completion proof from **Admin → Enrollments** — proves the uploads
   volume was restored alongside the database.

Step 7 is the one people skip. A database restored without `STORAGE_DIR` leaves
every proof and attachment as a broken link.

**Test a restore into a scratch environment quarterly**, not into production.

---

## 6. Moving from SQLite to PostgreSQL

The schema is portable; the migration history is not. Do this once, carefully:

1. Back up the SQLite database and `STORAGE_DIR`.
2. Export the reference and operational data you need. For a small installation
   the pragmatic route is: stand up PostgreSQL, run `npm run db:seed:core`
   against it to rebuild all reference data, then bulk-import employees from an
   Excel export of your `User` table via **Admin → People → Import**.
3. For a full-fidelity move (attempts, enrolments, certificates, audit history),
   dump each table from SQLite to CSV and `\copy` it into PostgreSQL in
   dependency order — parents before children — with the application stopped.
4. Set `provider = "postgresql"` in `prisma/schema.prisma`, point
   `DATABASE_URL` at the new server, and generate a fresh initial migration
   against an empty database (`npm run db:migrate`).
5. Copy `STORAGE_DIR` across unchanged.
6. Run the whole of §5 before decommissioning the SQLite file. Keep it for a
   month.

---

## 7. Disaster recovery

**Total host loss.**

1. Provision a host, install Node (§1 of [INSTALLATION.md](INSTALLATION.md)).
2. Deploy the same application version — check the `version` field from
   `/api/health` in your monitoring history if you are unsure which.
3. Restore `.env`, then the database, then `STORAGE_DIR`.
4. `npm ci && npx prisma generate && npm run build`.
5. `npm run db:deploy` — a no-op if the backup already has the schema.
6. Start, then run §5 in full.

**Database corrupt, backups intact.** Restore the most recent good backup.
Anything after it is lost; the audit log shows exactly what fell in the window.

**Backups also lost.** `npm run db:seed:core` rebuilds every piece of reference
data — competencies, levels, the 147-question bank, the course catalog, learning
paths, prompt library, use cases, roles, permissions and settings — from source.
Employees come back from an HR export via the Excel import. Assessment results,
progress and certificates cannot be reconstructed and must be re-earned. This is
why §5 exists.

---

## 8. Checklist

- [ ] Nightly database backup scheduled and its exit status monitored
- [ ] `STORAGE_DIR` backed up in the same job, at the same timestamp
- [ ] `.env` stored in a password manager or secret store, not only on the host
- [ ] At least 30 days of retention
- [ ] A copy held off the application host
- [ ] Backup logs reviewed weekly — a silent failure is the normal failure
- [ ] A restore rehearsed into a scratch environment within the last quarter
- [ ] A pre-deploy backup taken as part of every release
