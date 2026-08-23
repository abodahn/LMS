# Architecture

What the system is made of, and why each choice was made.

---

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router | One deployable unit. Server Components keep data access on the server; Server Actions remove a hand-written API layer for mutations |
| UI | React 19 | Server Components by default, client components only where interaction demands it |
| Styling | Tailwind CSS v4 | CSS-first `@theme`. Brand tokens are CSS custom properties, so re-branding needs no rebuild of component code |
| Data | Prisma 7 with driver adapters | Typed queries and migrations. Adapters let the same schema run on SQLite or PostgreSQL |
| Database | SQLite → PostgreSQL | SQLite for a single server with no DBA; PostgreSQL when concurrency demands it |
| Auth | Database sessions, bcrypt | No third-party identity dependency, no JWT revocation problem |
| Documents | pdf-lib, qrcode, ExcelJS | Certificates, executive PDF, Excel/CSV import and export — all server-side, no external service |
| Tests | Vitest + Playwright | Pure logic unit-tested; the journey driven in a real browser, desktop and mobile |

No state-management library, no component library, no ORM wrapper, no CSS-in-JS
runtime. Each would have been a dependency to maintain for something the
platform already does.

---

## 2. Layout

```
src/
  app/
    (auth)/            login, forgot-password, reset-password
    (app)/             everything behind a session
      page.tsx           role-aware home
      onboarding/        first-time profile → assessment → goals
      assessment/        the attempt runner and its result
      learning/          my learning, path, enrolment detail
      learn/             the lesson player
      catalog/ prompts/ use-cases/ toolbox/ capstone/
      certificates/ passport/ notifications/ profile/
      team/              manager views
      admin/             27 administration screens
    api/
      health             liveness + database reachability
      files/[...path]    permission-checked upload serving
      certificates/…/pdf certificate generation
      export/[report]    Excel / CSV report exports
      reports/executive  the leadership PDF
      coach              optional AI assistant
    verify/[code]        public certificate verification
  components/          shell, UI primitives, i18n provider, brand
  lib/
    recommendation/    engine.ts (pure) + service.ts (data) + types.ts
    assessment/        scoring.ts (pure) + service.ts (attempts)
    import/            parse.ts (pure) + employees.ts + courses.ts
    ai/                provider.ts, coach.ts — optional, never decisive
    analytics.ts       team, executive, readiness index, effectiveness
    auth.ts rbac.ts audit.ts settings.ts storage.ts i18n.ts branding.ts …
  messages/            en.json · ar.json · tr.json
  generated/prisma/    generated client — build output, never edited
prisma/
  schema.prisma        ~65 models
  seed/                reference data, courses, questions, demo data
e2e/                   Playwright specs
tests/                 Vitest specs
```

**The pure/impure split is the important one.** `engine.ts` and `scoring.ts`
contain the two algorithms the whole platform rests on, and neither imports the
database, the network or the clock. They take plain objects and return plain
objects, which is why they can be exhaustively unit-tested and why the seed can
run the *real* engine to produce demo recommendations rather than faking them.

---

## 3. Data model

About 65 models. The main clusters:

| Cluster | Models |
| --- | --- |
| Identity & org | `User`, `Session`, `Role`, `Permission`, `RolePermission`, `UserRole`, `Department`, `Section`, `JobTitle`, `Location`, `EmployeeProfile` |
| Assessment | `Competency`, `SkillLevel`, `AssessmentDefinition`, `AssessmentPool`, `QuestionBank`, `AssessmentQuestion`, `QuestionOption`, `Rubric`, `AssessmentAttempt`, `AttemptQuestion`, `AssessmentAnswer`, `AssessmentScore` |
| Catalog | `CourseProvider`, `CourseCategory`, `Course`, `CourseModule`, `CourseLesson`, `CoursePrerequisite`, `CourseCompetency`, `CourseDepartment`, `CourseJobFamily`, `CourseGoal`, `CourseLanguage`, `CourseVerification` |
| Paths & recommendation | `LearningPath`, `LearningPathPhase`, `LearningPathCourse`, `RecommendationWeight`, `RecommendationRun`, `Recommendation`, `RecommendationReason` |
| Learning | `Enrollment`, `LessonProgress`, `LearningActivity`, `ExternalCompletionProof`, `Assignment`, `AssignmentSubmission`, `CourseFeedback`, `HistoricalTraining` |
| Recognition | `Certificate`, `Badge`, `UserBadge` |
| Content | `PromptTemplate`, `SavedPrompt`, `UserNote`, `AiUseCase`, `UseCaseBookmark`, `AiOpportunity` |
| System | `SystemSetting`, `Integration`, `AuditLog`, `Notification`, `ReminderRule`, `LoginAudit`, `PasswordResetToken` |

### Portability rules

The schema deliberately avoids anything that behaves differently across engines:

- **no native enums** — vocabularies are `String` columns validated in
  `src/lib/constants.ts`, which is also what the UI and the engine read;
- **no scalar lists** — always a join table;
- **no `Json` columns** — JSON is stored as text and parsed through one helper.

Consequence: moving SQLite → PostgreSQL is a one-line `provider` change plus a
fresh migration. `src/lib/db.ts` picks the driver adapter from the URL scheme at
runtime, so no application code changes at all.

### Conventions

- `cuid()` primary keys.
- Soft delete via `deletedAt` on `User`; history is never destroyed.
- Every table that matters carries `createdAt` / `updatedAt`.
- Recommendation runs are immutable records — weights and engine version are
  stored with the result, so any path can be re-explained later exactly as it
  was produced.

---

## 4. Request flow

**Reads.** A Server Component calls `requireUser()` or
`requirePermission("…")`, queries Prisma directly, and renders. No API round
trip, no client-side data fetching, no loading spinner for the primary content.

**Writes.** A form posts to a Server Action. The action re-checks the
permission (never trusting that the page already did), validates with Zod,
writes, records an audit entry, and calls `revalidatePath`.

**Route handlers** exist only where something other than HTML is returned:
health, file downloads, PDFs, Excel/CSV exports, the AI coach stream.

There is no `middleware.ts`. Authorisation lives next to the data access, in
`requirePermission`, so there is exactly one place to get it right and no risk
of a route being added without a matching matcher entry.

---

## 5. Authentication and authorisation

**Sessions.** On sign-in a random token is generated; its SHA-256 hash is stored
in the `Session` table and the raw token goes into an `httpOnly`, `sameSite=lax`
cookie (`secure` in production). A stolen database dump does not yield usable
session tokens. Sessions are revoked server-side on password change, on
deactivation, and on sign-out — a database session can be killed, a JWT cannot.

**Passwords.** bcrypt, 12 rounds. Failed attempts are counted; after the
configured threshold the account locks for the configured window. Both are
settings, not constants.

**RBAC.** Four roles — `EMPLOYEE`, `MANAGER`, `ADMIN` (Learning/HR),
`SUPER_ADMIN` — over ~30 named permissions in `src/lib/rbac.ts`. **Code never
checks a role name**, only a permission key, so a Super Admin can re-map role
permissions without a deployment. Role/permission rows are seeded from the same
constant, so code and database cannot drift.

Details in [SECURITY.md](SECURITY.md).

---

## 6. Internationalisation

Three locales — English, Arabic, Turkish — from the first line of code, not
retrofitted.

- Messages live in `src/messages/{en,ar,tr}.json`. A unit test asserts key
  parity across all three, so a missing translation fails the build, not the
  user.
- No UI string is hardcoded in a component.
- Locale is per user (profile) with a header switcher; it sets `lang` and `dir`
  on `<html>`.
- Layout is direction-agnostic throughout: `ms-`/`me-`, `ps-`/`pe-`, `start`/
  `end` — never `left`/`right`. Arabic is a real mirror, not a font swap.
- Playwright asserts RTL and Turkish navigation on every run.

**Content is translated as well as chrome.** Translating the buttons and leaving
the questions in English would be worse than useless — it looks finished and
isn't. So the *data* carries translations too:

| Table | Translated columns |
| --- | --- |
| `Course` | `titleAr/Tr`, `descriptionAr/Tr`, `outcomesAr/Tr` |
| `CourseModule`, `CourseLesson` | `titleAr/Tr`, `contentAr/Tr` |
| `AssessmentDefinition` | `titleAr/Tr`, `descriptionAr/Tr` |
| `AssessmentQuestion`, `QuestionOption` | `textAr/Tr` |
| `Competency`, `SkillLevel`, `Department` | `nameAr/Tr` |

One helper reads them — `localized(row, "title", locale)` — falling back to
English rather than rendering an empty heading. Every admin editor exposes the
Arabic and Turkish fields, so translation is a data task, not a deployment.

Seed translations live in dedicated files (`prisma/seed/internal-i18n.ts`,
`questions-i18n*.ts`) keyed by the English string, so a translator works in one
place and the English content stays readable. Run
`npx tsx scripts/check-i18n.mts` for a live coverage report, broken down by
assessment — the number that matters is whether *this paper* can be sat in
Arabic, not the bank average.

Current state: **complete in all three languages** — all 55 courses, all 52
modules, all 92 lesson titles, all 92 lesson bodies, and all 147 questions with
every answer option. `tests/lessons-i18n.test.ts` additionally asserts that each
translation preserves the Markdown structure of its source, so a translation
cannot silently flatten a numbered list into a wall of text.

---

## 7. Branding

`src/lib/branding.ts` is the single source of truth: organisation name, platform
name, tagline, logo, mark, favicon, certificate seal, support email and the
colour palette. Each value can be overridden by a `NEXT_PUBLIC_*` environment
variable.

`<BrandStyle/>` in the root layout injects the palette as CSS custom
properties, and every component references `var(--brand-…)`. Changing the red
changes the whole system, including generated PDFs, with no code edit.

The palette is white / charcoal with red as an **accent** — used for the primary
action, the active navigation item, and focus. Never as a background wash.

---

## 8. AI integration

Optional, and deliberately not load-bearing.

| Used for | Not used for |
| --- | --- |
| Rephrasing a recommendation explanation | Choosing or ranking courses |
| The learner coach, scoped to the current lesson | Grading anything |
| Summarising a capstone submission for a reviewer | Deciding a level |
| Suggesting wording for an AI use case | Any number shown to leadership |

`src/lib/ai/provider.ts` reads its key from the server environment only. If AI
is disabled or the key is missing, every feature above degrades to its
deterministic text and the platform is fully functional. The coach is scoped to
the signed-in learner's own context and can never surface another employee's
information.

---

## 9. Performance

- Server Components mean the browser downloads markup, not a data layer.
- List pages paginate at 25 rows with server-side filtering; no page loads an
  unbounded table.
- Analytics aggregate in SQL, not in JavaScript over full result sets.
- Only genuinely interactive leaves are client components — the assessment
  runner, the lesson footer, filter bars, the coach, the locale switcher.
- Exports stream through ExcelJS rather than building an in-memory workbook of
  every row.

---

## 10. Testing

| Layer | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | The recommendation engine including all five acceptance scenarios, assessment scoring, RBAC, utilities, and Arabic/Turkish coverage of every question and course — 84 tests |
| End to end | Playwright | The full journey, RBAC boundaries, i18n/RTL, exports, mobile layout — 91 tests across desktop and Pixel 7 |
| Types | `tsc --noEmit` | Whole project, strict |
| Lint | ESLint | Whole project |

`npm run test:all` runs the lot. The E2E suite seeds a database, builds, starts
a real server on port 3100 and drives a real browser — it verifies that no page
scrolls sideways on a phone, that Arabic really is RTL, and that an employee
cannot reach an admin route.

---

## 11. Deliberate simplifications

Honest about the ceilings:

| Simplification | Ceiling | Upgrade path |
| --- | --- | --- |
| SQLite by default | single writer; fine to ~50 concurrent learners | flip `provider` to `postgresql` |
| Written answers scored by signal patterns | catches structure, not nuance | already flagged for human review; an LLM assist could pre-fill, never decide |
| Adaptivity by reordering | not item-response theory | swap `reorderForDifficulty` for an IRT selector; the data model already supports it |
| Uploads on local disk | one server, or a shared volume | `src/lib/storage.ts` is the only file that touches the filesystem — swap it for object storage |
| Rate limiting in process memory (`src/lib/rate-limit.ts`) | per-node counters; limits are effectively multiplied by the instance count | move the bucket store to Redis |
| Mail falls back to a server-log transport (`src/lib/mailer.ts`) | nothing is delivered until SMTP is configured in Admin → Integrations — but nothing is silently dropped either | enable SMTP; call sites are unchanged |
| In-app notifications, email optional | no push, no SMS | `src/lib/notifications.ts` is the single dispatch point |

The last two are marked in the source with a comment naming the ceiling and the
upgrade path.
