# Installation

How to get T&C AI Academy running on a developer machine or a single server.
For production hosting, container images and PostgreSQL, read
[DEPLOYMENT.md](DEPLOYMENT.md) after this.

---

## 1. Requirements

| | Minimum | Notes |
| --- | --- | --- |
| Node.js | 20.9 or newer | 22 LTS recommended |
| npm | 10 or newer | ships with Node |
| Disk | 2 GB | `node_modules` plus the database and uploads |
| RAM | 2 GB | 4 GB for comfortable builds |
| Database | none | SQLite is the default and needs no server |

Windows, macOS and Linux are all supported. On Windows the native SQLite driver
needs the **Visual Studio Build Tools** (C++ workload) the first time you run
`npm install`; on Debian/Ubuntu install `build-essential` and `python3`.

## 2. Get the code and install

```bash
git clone <your-repository-url> tc-ai-academy
cd tc-ai-academy
npm install
```

`npm install` also runs `prisma generate`, which writes the typed database
client into `src/generated/prisma`. That directory is build output — it is
regenerated, never edited.

## 3. Configure the environment

```bash
cp .env.example .env
```

Open `.env`. For a local install the defaults work as they are. The values that
matter:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` for SQLite, or a `postgresql://…` URL |
| `APP_URL` | Public base URL. Used in certificate QR codes and emails |
| `STORAGE_DIR` | Where uploads are written. Must be **outside** the web root |
| `MAX_UPLOAD_BYTES` | Upload ceiling, default 8 MB |
| `SEED_DEMO` | Set to `false` for a real installation |
| `DEMO_PASSWORD` | Password given to seeded demo accounts |
| `NEXT_PUBLIC_*` | Branding overrides — see [ADMIN_GUIDE.md](ADMIN_GUIDE.md) |
| `ANTHROPIC_API_KEY` etc. | Optional AI provider key (server-side only) |
| `SMTP_PASSWORD` | Optional mail password; host and sender are set in the admin |

`.env` is git-ignored and must never be committed. API keys are read on the
server only and are never sent to the browser.

## 4. Create the database

```bash
npm run db:migrate
```

This creates `dev.db` and applies every migration. On an existing production
database use `npm run db:deploy` instead — it applies migrations without ever
offering to reset.

## 5. Seed

**For evaluation, training or a demo** — reference data plus 36 realistic
employees, assessment attempts, enrolments, certificates and a full set of
generated recommendations:

```bash
npm run db:seed
```

**For a real installation** — reference data only (competencies, levels,
question banks, courses, learning paths, prompt library, use cases, settings,
roles and permissions), with no demo users:

```bash
npm run db:seed:core
```

The core seed is idempotent: running it again updates the reference data and
leaves your real employees untouched. Import your own people from Excel or CSV
afterwards — see [ADMIN_GUIDE.md](ADMIN_GUIDE.md#importing-employees).

> With `db:seed:core` no user accounts exist yet. Create the first Super Admin
> either with `npm run db:studio` (set `employeeCode`, `email`, a bcrypt
> `passwordHash`, and a `UserRole` row pointing at the `SUPER_ADMIN` role) or by
> running the demo seed once on a scratch database, exporting the shape, and
> matching it. There are deliberately no hardcoded production accounts.

## 6. Run

```bash
npm run dev          # http://localhost:3000
```

Production mode on the same machine:

```bash
npm run build
npm run start
```

## 7. Sign in

If you ran the **demo** seed, every account uses the password from
`DEMO_PASSWORD` (default `Academy2026!`). Sign in with the employee code or the
email address:

| Code | Who | Role |
| --- | --- | --- |
| `TC-0001` | Chief Executive | Super Admin |
| `TC-0002` | Learning & Development lead | Learning / HR Admin |
| `TC-1001` | Department manager | Manager |
| `TC-1004` | Team member with a path in progress | Employee |
| `TC-2004` | New starter, nothing done yet | Employee |

These accounts exist only in demo data. Change or delete them before the system
holds anything real.

## 8. Verify the install

```bash
curl http://localhost:3000/api/health
# {"status":"ok","database":"ok","latencyMs":2,"uptimeSeconds":11,"version":"1.0.0"}
```

Then the test suites:

```bash
npm run typecheck
npm run lint
npm run test        # unit tests
npm run test:e2e    # seeds, builds and drives a real browser
```

`npm run test:e2e` reseeds the database it points at. Never run it against
production data.

## Troubleshooting

**`better-sqlite3` fails to build.** Install the platform build tools listed in
§1, delete `node_modules` and `package-lock.json`, then `npm install` again.

**`Environment variable not found: DATABASE_URL`.** `.env` is missing or is not
in the project root. Prisma reads it from the working directory.

**`P3009` / migration already applied.** Use `npm run db:deploy` rather than
`db:migrate` on a database that already has data. Never run `db:reset` outside
development — it drops everything.

**Port 3000 is busy.** `npm run dev -- -p 3001`, and update `APP_URL` to match so
certificate QR codes point at the right host.

**Uploads or certificate PDFs fail.** The process needs write access to
`STORAGE_DIR`. Create it and grant permissions; it is created on demand but
cannot be created without rights to the parent directory.

**Arabic renders left to right.** Locale is per user, in Profile → Language, and
is also switchable from the header. Confirm the page has `dir="rtl"`; if it does
not, the browser is caching an old HTML shell — hard-reload.
