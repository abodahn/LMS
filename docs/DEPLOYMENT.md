# Deployment

Three supported shapes. Pick by how many people use the system at once, not by
how many employees you have.

| Shape | Database | Good for | Section |
| --- | --- | --- | --- |
| Single server | SQLite | up to ~50 concurrent learners | [§2](#2-single-server-on-premise) |
| Docker Compose | PostgreSQL | departments, several hundred employees | [§3](#3-docker-compose-with-postgresql) |
| Managed cloud | PostgreSQL | company-wide, multiple app instances | [§4](#4-managed-cloud) |

Everything in [INSTALLATION.md](INSTALLATION.md) still applies — this document
only covers what changes for production.

---

## 1. Before any production deploy

1. **Seed without demo data.**
   ```bash
   SEED_DEMO=false npm run db:seed     # or: npm run db:seed:core
   ```
   No demo accounts, no `Academy2026!` password, nothing to forget to delete.

2. **Set `APP_URL` to the real public URL.** Certificate QR codes and password
   reset links are built from it. A wrong value makes every certificate
   unverifiable.

3. **Put `STORAGE_DIR` on persistent storage outside the web root.** Uploads are
   only ever served through `/api/files/[...path]`, which checks permissions
   first — but they still need to survive a redeploy.

4. **Terminate TLS.** Session cookies are `httpOnly`, `sameSite=lax` and
   `secure` when `NODE_ENV=production`. Over plain HTTP the browser will drop
   them and nobody can sign in.

5. **Keep secrets out of the image and out of git.** `.env` is git-ignored.
   Provide values as environment variables, Docker secrets or your platform's
   secret store. `NEXT_PUBLIC_*` variables are the only ones that reach the
   browser — never put a key in one.

---

## 2. Single server (on-premise)

The simplest production install: one Node process, one SQLite file, one uploads
directory. No database server to run or back up separately.

```bash
git clone <repo> /opt/tc-ai-academy && cd /opt/tc-ai-academy
npm ci
cp .env.example .env && $EDITOR .env
npm run db:deploy
SEED_DEMO=false npm run db:seed
npm run build
```

`.env` for this shape:

```dotenv
DATABASE_URL="file:/var/lib/tc-ai-academy/academy.db"
APP_URL="https://academy.tcgarments.com"
STORAGE_DIR="/var/lib/tc-ai-academy/storage"
NODE_ENV="production"
```

Run it under a supervisor. A systemd unit:

```ini
[Unit]
Description=T&C AI Academy
After=network.target

[Service]
Type=simple
User=tcai
WorkingDirectory=/opt/tc-ai-academy
EnvironmentFile=/opt/tc-ai-academy/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now tc-ai-academy
```

Put nginx (or IIS on Windows) in front for TLS:

```nginx
server {
  listen 443 ssl http2;
  server_name academy.tcgarments.com;

  ssl_certificate     /etc/ssl/certs/academy.crt;
  ssl_certificate_key /etc/ssl/private/academy.key;

  client_max_body_size 10m;   # must exceed MAX_UPLOAD_BYTES

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**SQLite limits.** It is a single writer. Fine for a few dozen people learning
at once — a learning platform is overwhelmingly reads. If exports start timing
out or writes queue during a company-wide assessment window, move to
PostgreSQL (§3). Nothing in the application code changes.

---

## 3. Docker Compose with PostgreSQL

### Switch the schema first

The Prisma schema is written to be portable — no native enums, no scalar lists,
no `Json` columns — so moving engines is a one-line change plus a migration.

1. In `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
2. Point `DATABASE_URL` at a PostgreSQL instance and generate the migration
   **once, locally**, then commit it:
   ```bash
   npm run db:migrate
   ```
   Existing SQLite migrations are not portable; generate a fresh initial
   migration for PostgreSQL against an empty database.

3. If you are migrating a live SQLite installation, export the data first — see
   [BACKUP_RESTORE.md](BACKUP_RESTORE.md#moving-from-sqlite-to-postgresql).

### Run it

```bash
cp .env.example .env
printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -base64 24)" >> .env
printf 'APP_URL=https://academy.tcgarments.com\n' >> .env

docker compose build
docker compose up -d
```

The app container runs `prisma migrate deploy` on start, so a new image can
never serve an old schema. Seed once, from inside the container:

```bash
docker compose exec app sh -c "SEED_DEMO=false npx tsx prisma/seed/index.ts"
```

What the compose file does:

- `db` publishes **no** port — only the app container reaches PostgreSQL.
- `app` waits for the database health check before starting.
- Uploads live on the `app-storage` volume, the database on `db-data`.
- Both containers restart unless explicitly stopped.

Update to a new version:

```bash
git pull
docker compose build app
docker compose up -d app        # migrations run automatically on boot
```

---

## 4. Render (managed, recommended)

Render fits this application better than a serverless host, for reasons that are
all things the app already assumes: it runs as one long-lived process, so the
in-app scheduler works with nothing extra to wire up; a persistent disk keeps
uploads, SCORM packages and the database across deploys; and rate limiting is
in-memory, which is correct on one instance and wrong on a fleet.

`render.yaml` in the repository root describes the whole service. Render calls
this a Blueprint.

### Deploying it

1. **Push the repository to GitHub.** Render deploys from a Git remote.

   ```bash
   git remote add origin git@github.com:<org>/tc-ai-academy.git
   git push -u origin main
   ```

2. **Render → New → Blueprint**, pick the repository. It reads `render.yaml` and
   proposes a web service with a 10 GB disk mounted at `/data`.

3. **Set the two prompted values**, or leave them blank:
   `ANTHROPIC_API_KEY` (the AI coach stays off without it) and `SMTP_PASSWORD`
   (password-reset links go to the log instead of email). Both degrade cleanly.

4. **Add the first administrator.** Before the first deploy, add these
   environment variables in the Render dashboard:

   | Key | Value |
   | --- | --- |
   | `ADMIN_CODE` | the employee id to sign in with, e.g. `LMS` |
   | `ADMIN_PASSWORD` | a long password, used once |
   | `ADMIN_NAME` | the person's name |

   The account is created on first boot and **must change its password at first
   sign-in** — a password that passed through a dashboard field has been seen by
   the platform, and should not stay valid. Delete the three variables once you
   are in.

   Skip this and create the account from the Render shell instead:

   ```bash
   npx tsx scripts/create-admin.mts --code LMS --password "<something long>"
   ```

### What happens on first boot

The container runs migrations, then `scripts/bootstrap.mts`, then the server.
The bootstrap seeds reference data — roles, permissions, competencies, levels,
the org structure, the starter catalogue, assessments and the prompt library —
but **only when it finds the database empty**. Every later restart is a single
query and a no-op. Both steps are idempotent, so a restart loop cannot corrupt
anything.

A fresh instance comes up with 55 curated courses. To load the full harvested
catalogue of 1,100+, open the Render shell and run:

```bash
npx tsx scripts/import-courses-csv.mts data/harvested-courses.csv
```

### The disk is the whole point

Without the disk, Render gives the service an ephemeral filesystem and the
database is discarded on every deploy. The Blueprint mounts one at `/data`, and
`DATABASE_URL` points at `file:/data/academy.db`.

Because a disk attaches to exactly one instance, this service **cannot be scaled
horizontally**. That is a deliberate trade and matches the rest of the design.
To outgrow it, add a Render Postgres instance, point `DATABASE_URL` at its
internal URL, change `provider` in `prisma/schema.prisma` to `postgresql` and
regenerate the migrations — the schema is already portable, with no native enums
and no JSON columns.

Deploys briefly interrupt service for the same reason: the old instance must
release the disk before the new one takes it.

### Backups

Render's disk snapshots are not a substitute for the application's own backup —
see [BACKUP_RESTORE.md](BACKUP_RESTORE.md). Everything worth keeping is under
`/data`: the database file and the `storage/` directory holding uploads and
unpacked SCORM packages.

### Before real employee data goes in

A Render service is on the public internet. This one holds names, assessment
scores and manager notes. Put it behind an IP allow-list, a VPN, or your own SSO
proxy before it holds anything real. Demo data is fine either way.

---

## 5. Managed cloud

Any platform that runs a Node server works — Azure App Service, AWS App Runner,
Google Cloud Run, Fly.io, Render. The application is a standard Next.js server;
it is **not** an edge/serverless-only app (it uses Node APIs for PDFs, Excel and
file storage).

Requirements:

| Need | Why |
| --- | --- |
| Node 20+ runtime or the Docker image | native `better-sqlite3` / `pg` drivers |
| Managed PostgreSQL | multiple instances cannot share a SQLite file |
| Persistent volume **or** object storage for `STORAGE_DIR` | completion proofs must survive a restart |
| Secret store for `DATABASE_URL`, provider keys, `SMTP_PASSWORD` | never bake them into the image |
| Health probe on `/api/health` | returns 503 when the database is unreachable |

Build and start commands:

```bash
npm ci && npx prisma generate && npm run build     # build
npx prisma migrate deploy && npm run start         # release + start
```

**Scaling to more than one instance.** Sessions are database-backed, not
in-memory, so any instance can serve any request — no sticky sessions needed.
Two things are per-process and worth knowing before you scale out:

- `STORAGE_DIR` is shared state. Give every instance the same network volume, or
  let a single instance own uploads.
- Rate limiting (`src/lib/rate-limit.ts`) counts in process memory, so the
  effective limit is multiplied by the instance count. Sign-in lockout is
  *not* affected — failed-login counting is in the database. If you need exact
  request limits across instances, enforce them at the load balancer or move the
  bucket store to Redis.

---

## 6. Health, logs and monitoring

`GET /api/health` is unauthenticated and cheap:

```json
{ "status": "ok", "database": "ok", "latencyMs": 2, "uptimeSeconds": 8412, "version": "1.0.0" }
```

- `200` — serving normally.
- `503` with `{"status":"degraded","database":"unreachable"}` — the process is up
  but cannot reach the database. Point your load balancer at this.

Point liveness *and* readiness probes at it. Set `APP_VERSION` at deploy time so
the response tells you which build is actually running.

Logs go to stdout/stderr — collect them with journald, Docker's log driver, or
your platform's log stream. Application errors are logged server-side with a
reference id; users only ever see the reference, never a stack trace, a database
error or an API internal. Secrets and passwords are redacted before anything is
written. The in-app **Audit log** (Admin → Audit) is the record of *who did
what*, and is separate from process logs.

---

## 7. Scheduled work

Two jobs keep the academy current. Both already existed as code; neither used to
run unless an administrator pressed a button.

| Job | Every | What it does |
|---|---|---|
| `reminders` | 24h | Evaluates the enabled reminder rules and notifies the employees they match. Duplicate unread reminders are never created, so a rule cannot spam anyone. |
| `linkSweep` | 24h | Re-checks up to 250 external course links whose review interval has elapsed. Three consecutive failures withdraw a course from the catalogue; any success puts it straight back. |

### On a single server (the default)

The application runs them itself. `src/instrumentation.ts` starts a timer that
ticks every fifteen minutes and runs whatever is due, which means there is
nothing to configure. It is **on in production and off in development** — a dev
rebuild restarts the timer on every save, and nobody wants their scratch
database sending mail.

Admin → Settings → **Scheduled jobs** shows each job's last run. That page is
the difference between "nothing was due" and "the scheduler has been dead for a
month", so it is worth a glance after any deploy.

### On more than one instance

Every replica would run the same job. Turn the in-app scheduler off and give the
schedule to cron on exactly one host:

```
SCHEDULER=off
```

```cron
17 * * * * cd /srv/tc-ai-academy && /usr/bin/npx tsx scripts/run-jobs.mts >> /var/log/tcai-jobs.log 2>&1
```

Run it hourly. Each job checks its own interval, so running the command more
often than a job's period costs nothing, and a missed hour is picked up by the
next one. The command exits non-zero if a job failed, so cron's own mail
reports it.

```bash
npm run jobs:status          # when each job last ran
npm run jobs:run             # run whatever is due
npx tsx scripts/run-jobs.mts --force --only linkSweep
```

### What a withdrawn course means

`linkSweep` never deletes anything. A course that fails three checks in a row
gets `stillAvailable: false`: it leaves the catalogue and stops being
recommended, but its enrolments, certificates and history are untouched, and the
admin course screen explains why. Fix the URL and the next sweep restores it.

---

## 8. SCORM content safety

SCORM packages are uploaded by administrators and served from
`/api/scorm/<id>/…`. They are **executable content running on the application's
own origin**, and that is not an oversight — the SCORM standard requires it. A
package locates the LMS by walking `window.parent` until it finds an `API`
object; a cross-origin frame makes that walk throw, and the package fails to
start. Every LMS faces this. The choices are to serve packages from a second
hostname, or to accept it.

**This deployment accepts it, and fences it:**

- uploading needs the `catalog.manage` permission, and every upload is audited;
- archive entries that point outside the package are rejected, so an upload
  cannot overwrite anything on disk;
- packages are written under `STORAGE_DIR`, outside the web root, and served
  only through a route that checks the caller is enrolled or an administrator;
- responses carry `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  no-referrer` and a `Content-Security-Policy` with `default-src 'self'`, which
  stops a package loading anything from, or sending anything to, another host;
- the frame is sandboxed to scripts and forms — no top-level navigation, no
  downloads.

**If T&C will accept packages from a source it does not control, do this first:**
serve `/api/scorm` from a separate hostname (`scorm.example.com`) pointing at the
same application, with its own TLS certificate. The package keeps working —
same-origin *within that host* — while the academy's cookies and DOM become
unreachable to it. This is a reverse-proxy and DNS change; the application needs
no modification.

Relevant settings:

```
MAX_SCORM_BYTES=209715200   # 200 MB per package
STORAGE_DIR=/var/lib/tcai/storage
```

Unpacked packages live in `STORAGE_DIR/scorm/<packageId>/`. They are part of the
data, not the build — include them in backups
([BACKUP_RESTORE.md](BACKUP_RESTORE.md)) or restored courses will open onto
nothing.

---

## 9. Instructor-led training

No infrastructure of its own. Two things are worth knowing:

**Times are stored in UTC and rendered in the viewer's locale.** A session
created at 09:00 by an administrator in Cairo shows as 09:00 to everyone in
Cairo. The `timezone` column records the session's intended zone for sites that
span more than one.

**Calendar files are generated per request** at
`/api/sessions/<id>/calendar`, and only for someone holding a place or able to
manage sessions. A cancelled session emits `METHOD:CANCEL`, so a calendar client
removes it rather than leaving a meeting nobody attends.

Notifications — a seat opening, a cancellation, attendance recorded — go through
the ordinary notification centre, and reach people by email only once SMTP is
configured.

---

## 10. Post-deploy checklist

- [ ] `curl https://…/api/health` returns `status: ok`
- [ ] Signing in over HTTPS works and the session survives a page reload
- [ ] `SEED_DEMO=false` — no `TC-0001` … `TC-2004` accounts exist
- [ ] A real Super Admin exists with a strong, unique password
- [ ] Admin → Settings has the right org name, branding and default locale
- [ ] Admin → Integrations: SMTP verified (or notifications knowingly left off)
- [ ] Certificate QR code resolves to `APP_URL/verify/<code>` from an outside network
- [ ] An employee import runs end to end on a small file
- [ ] A backup has been taken **and restored** into a scratch environment
  ([BACKUP_RESTORE.md](BACKUP_RESTORE.md))
- [ ] Backups are scheduled and monitored
- [ ] Admin → Settings → Scheduled jobs shows a recent run for both jobs
- [ ] `SCHEDULER=off` **and** a cron entry exists, if running more than one instance
- [ ] `.env` is not in git and not in the image
- [ ] On Render: the disk is mounted at `/data` and `DATABASE_URL` points inside it
- [ ] On Render: ADMIN_PASSWORD removed from the dashboard after the first sign-in
- [ ] `STORAGE_DIR` (including `scorm/`) is on the backup schedule
- [ ] If SCORM packages will come from outside T&C, `/api/scorm` is on its own hostname

---

## 11. Rollback

1. Redeploy the previous image or tag.
2. Migrations are forward-only. If a release added a migration, rolling the code
   back does **not** roll the schema back — restore the database from the
   pre-deploy backup instead. Take that backup as part of every deploy, before
   `migrate deploy` runs.
3. Confirm `/api/health` and the version field.
