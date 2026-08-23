# Security

What the platform protects, how, and what an operator is responsible for.

T&C AI Academy holds employee names, job details, assessment results and
learning records. That is personal data about identifiable people, and some of
it — how someone scored — is sensitive in an employment context. The controls
below follow from that.

---

## 1. Authentication

**Passwords** are hashed with bcrypt at 12 rounds. Plaintext is never stored,
never logged, never returned by any query.

**Sessions.** On sign-in a cryptographically random token is generated. Its
SHA-256 hash goes in the `Session` table; the raw token goes to the browser in a
cookie:

| Attribute | Value |
| --- | --- |
| `httpOnly` | yes — JavaScript cannot read it |
| `sameSite` | `lax` — cross-site POSTs cannot carry it |
| `secure` | yes when `NODE_ENV=production` |
| lifetime | `security.sessionHours`, default 12 hours |

Because only the hash is stored, a database dump does not yield usable sessions.
Because sessions are rows and not JWTs, they can be revoked — and are, on
password change, on deactivation, and on sign-out.

**Brute force.** Failed attempts are counted per account. After
`security.maxFailedLogins` (default 5) the account locks for
`security.lockoutMinutes` (default 15). Both are settings, editable by a Super
Admin. Sign-in responses do not reveal whether an account exists, and the
comparison of reset tokens is constant-time.

**Password reset** issues a single-use, time-limited token stored hashed. Using
it invalidates every existing session for that user.

**Forced change.** `mustChangePassword` sends a user to `/change-password`
before anything else — used for admin-created accounts and after a manual reset.

---

## 2. Authorisation

Four roles over about thirty named permissions
([`src/lib/rbac.ts`](../src/lib/rbac.ts)).

| Role | Scope |
| --- | --- |
| `EMPLOYEE` | Own learning only |
| `MANAGER` | Own learning, plus their direct team's progress and capstone reviews |
| `ADMIN` (Learning / HR) | Runs the academy: people, catalog, assessments, enrolments, certificates, analytics, reports |
| `SUPER_ADMIN` | Everything, including settings, roles, integrations, recommendation weights and the audit log |

**Application code never checks a role name — only a permission key.** Role
membership is data, so a Super Admin can re-map permissions without a
deployment, and there is no hidden `if (role === "ADMIN")` to find later.

Every check happens on the server. `requirePermission("users.manage")` runs at
the top of the page *and* again inside the Server Action that mutates. Hiding a
button is presentation; the check that matters is the one next to the write.

**Managers see development, not surveillance.** A manager sees their direct
reports' level, path progress, completions and capstone submissions. They do not
see individual assessment answers, coach conversations, or anything about
employees outside their team.

Playwright asserts the boundaries on every run: an employee reaching `/admin/*`
gets `/no-access`, a manager cannot reach people administration.

---

## 3. Input handling

- **Validation with Zod** on every Server Action and route handler. Types at the
  boundary are checked, not assumed.
- **Parameterised queries only.** Prisma builds every statement; no string
  concatenation reaches the database.
- **React escapes output** by default. Course content authored by admins is
  rendered through a Markdown pipeline that does not permit raw HTML.
- **Uploads** are limited by `MAX_UPLOAD_BYTES` (default 8 MB), restricted to
  PDF/PNG/JPEG/WebP, and checked by **magic number** — the browser-supplied MIME
  type is not trusted on its own. Files are written under `STORAGE_DIR` with
  generated names, never the user's filename.
- **Path traversal** is blocked in `/api/files/[...path]`; the segment list is
  rejected if it contains `..`.
- **Spreadsheet formula injection** is guarded on export: any cell value
  starting with `=`, `+`, `-`, `@`, tab or CR is prefixed with an apostrophe, so
  an employee cannot store `=cmd|…` in a name field and have it execute in
  someone's Excel.
- **Rate limiting** on authentication and other abusable endpoints
  (in-process — see [ARCHITECTURE.md §11](ARCHITECTURE.md#11-deliberate-simplifications)).

---

## 4. Data exposure

**Uploads are never reachable by URL alone.** They live outside the web root
and are served only through `/api/files/[...path]`, which checks that the caller
either owns the file or holds `proofs.verify`, and responds
`private, no-store` with `X-Content-Type-Options: nosniff`.

**Assessment answer keys never reach the browser.** Questions are sent without
correctness data; grading happens on the server.

**Certificate verification is public but minimal.** `/verify/<code>` confirms
the holder's name, the certificate title, the issue date and validity — and
nothing else. No department, no scores, no email address, no employee code.

**The AI coach is scoped to the signed-in learner.** It receives that learner's
own context and the current lesson. It cannot be prompted into returning another
employee's data because it is never given any.

**Errors say nothing useful to an attacker.** Users see a friendly message and a
reference id. Stack traces, database errors and provider responses stay in the
server log.

**No sensitive data in logs.** Passwords, hashes, tokens and API keys are never
logged. The audit trail redacts any field matching
`password | passwordHash | token | tokenHash | apiKey | secret` before writing —
even if a caller passes one by mistake.

---

## 5. Secrets

- **Never in source, never in git.** `.env` is git-ignored; `.env.example`
  carries names and comments only.
- **Server-side only.** Provider keys are read from `process.env` inside server
  modules. The only variables that reach the browser are `NEXT_PUBLIC_*`, which
  hold branding values and nothing else.
- **Never in the client bundle.** Anything reading a secret imports
  `server-only`, so an accidental client import fails the build rather than
  shipping a key.
- **Rotation.** Change the environment variable and restart. Nothing caches a
  key across a restart.

Integration settings (SMTP host, sender, AI provider and model) live in the
`Integration` table and are edited in **Admin → Integrations**; the matching
*passwords and API keys* stay in environment variables.

---

## 6. Audit trail

**Admin → Audit** records who did what:

- authentication events — sign-in, sign-out, failure, lockout;
- every administrative change with before/after values (redacted);
- role and permission changes;
- recommendation weight changes;
- certificate issue and revocation;
- imports and exports;
- settings changes.

Each entry carries the actor, action, entity, timestamp, IP and user agent.
Entries are append-only — there is no edit or delete path in the application.
Filterable by actor, action, entity and date, and exportable to Excel.

`LoginAudit` separately records every authentication attempt, successful or not,
for lockout accounting and incident review.

---

## 7. Operator responsibilities

The application cannot do these for you:

1. **Serve over HTTPS.** Without it, cookies with `secure` are dropped and
   credentials cross the network in the clear.
2. **Seed production with `SEED_DEMO=false`.** Demo accounts share a published
   password. There are deliberately no hardcoded production users.
3. **Give the Super Admin a strong, unique password**, and keep the number of
   Super Admins small.
4. **Protect the database file or server.** SQLite is a file — file permissions
   are your access control. PostgreSQL should not be reachable from outside the
   application host.
5. **Back up, and test restores.** See [BACKUP_RESTORE.md](BACKUP_RESTORE.md).
6. **Patch.** `npm audit` regularly; apply Node security releases.
7. **Deactivate leavers.** Deactivation revokes every active session
   immediately. Prefer it to deletion — learning history and certificates should
   survive, and `deletedAt` keeps the record without keeping access.
8. **Review the audit log** after any incident, and periodically for privileged
   accounts.

---

## 8. Privacy posture

- **Collect what the recommendation needs, and no more.** The first-time profile
  asks about work and learning, not about anything personal.
- **Results are developmental.** An assessment result exists to target learning.
  Framing throughout is "here is where to start", never a pass/fail judgement on
  a person — the placement assessment has no pass mark at all.
- **Aggregation over exposure.** Executive and department views report
  distributions and averages. Department comparison is presented as where
  support is needed, never as a ranking to shame anyone with.
- **No unexplained numbers.** The AI Readiness Index publishes its components
  and weights on the page that shows it.
- **Retention.** Learning history is retained deliberately — certificates must
  remain verifiable and improvement must remain measurable. Set a retention
  period that matches your local employment-data obligations, and delete rather
  than deactivate only when law requires it.

---

## 9. Known limitations

Stated plainly so nobody assumes otherwise:

| Limitation | Impact |
| --- | --- |
| No MFA | Password plus lockout is the whole authentication story. Put SSO in front if your policy requires MFA |
| No SSO / SAML / OIDC out of the box | Accounts are local. An identity-provider integration would be new work |
| Assessments are not proctored | Deliberate — this targets learning, it does not gate employment |
| Rate limiting is per-process | Effective limits multiply across instances; enforce at the load balancer if exact |
| Written-answer scoring is heuristic | Always flagged for human review; never final without an assessor |
| No automatic PII export/erasure tooling | Subject requests are served through admin screens, reports and the database |

---

## 10. Reporting a vulnerability

Contact the platform owner at the support address configured in branding
(default `learning@tcgarments.com`). Include what you did, what happened, and
what you expected. Please do not test against production data.
