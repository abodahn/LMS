# T&C AI Academy

An AI-skills learning platform for T&C Garments. It measures where every
employee actually stands with AI, builds each of them a personalised ~35-hour
learning path, teaches, tests, and certifies — and gives leadership a defensible
read on organisational AI readiness.

It is a working system, not a prototype: a real database, real authentication,
real grading, real exports.

## Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/abodahn/LMS)

Render reads [`render.yaml`](render.yaml) and provisions the service with its
persistent disk already configured. Set `ADMIN_CODE`, `ADMIN_PASSWORD` and
`ADMIN_NAME` before the first deploy and the first administrator is created on
boot — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#4-render-managed-recommended).

The Starter plan or above is required: the free tier has no persistent disk, and
without one the database is discarded on every deploy.

---

## The employee journey

```
Sign in
  → First-time profile (department, job, daily tasks, goals, weekly time)
  → AI placement assessment (20 easy questions, 25 minutes, EN/AR/TR)
  → Skill analysis by competency
  → Level identification (L0 … L4)
  → Role analysis
  → Personalised course recommendation — explained, not a black box
  → ~35-hour learning path
  → Enrol → learn → module quizzes → progress
  → Final assessment
  → Practical workplace capstone (manager-reviewed)
  → Before / after comparison
  → Certificate with QR verification
  → Next recommendation
```

## What makes it work

**The recommendation engine is the product.** It is deterministic and
explainable: hard constraints first, then seven weighted components
(AI level match 25, role match 20, competency gap 20, learning goal 15, course
quality 10, time fit 5, language fit 5), then phase-balanced path assembly.
The same inputs always produce the same path, and every course carries the
reasons it was chosen — and every rejected course carries the reason it was not.
No LLM ever makes the decision. See
[docs/COURSE_RECOMMENDATION_ENGINE.md](docs/COURSE_RECOMMENDATION_ENGINE.md).

**Assessment is measurement, not trivia.** Five competencies, scenario-based
questions, partial credit, a transparent rubric for written prompts, and a
level that is never shown as a bare number. Every question in every assessment
is written in English, Arabic and Turkish. See
[docs/ASSESSMENT_SCORING.md](docs/ASSESSMENT_SCORING.md).

**Numbers are always explained.** The AI Readiness Index publishes its
components and weights on the page that shows it. Department comparisons are
framed as support needs, not league tables.

## Documentation

| Document | For |
| --- | --- |
| [INSTALLATION.md](docs/INSTALLATION.md) | Getting it running locally |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | On-premise, Docker and cloud |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the system is built |
| [COURSE_RECOMMENDATION_ENGINE.md](docs/COURSE_RECOMMENDATION_ENGINE.md) | The scoring algorithm, in full |
| [ASSESSMENT_SCORING.md](docs/ASSESSMENT_SCORING.md) | Grading, levels and adaptivity |
| [ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | Running the academy day to day |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | For employees and managers |
| [SECURITY.md](docs/SECURITY.md) | Authentication, RBAC, data handling |
| [BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) | Backups, restores, disaster recovery |

## Quick start

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Then open <http://localhost:3000>. The seed creates 36 demo employees; sign in as
`TC-0001` / `Academy2026!` for the Super Admin view. Full detail — including how
to seed **without** demo data for a real install — is in
[docs/INSTALLATION.md](docs/INSTALLATION.md).

## Stack

Next.js 16 (App Router, React 19 Server Components and Server Actions) ·
TypeScript · Tailwind CSS v4 · Prisma 7 · SQLite or PostgreSQL ·
Vitest · Playwright.

English, Arabic (full RTL) and Turkish from day one.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # run the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # unit tests (vitest)
npm run test:e2e     # seed, build and run Playwright end to end
npm run test:all     # typecheck + unit + e2e
npm run db:migrate   # create/apply a migration in development
npm run db:deploy    # apply migrations in production
npm run db:seed      # seed reference data (+ demo data unless SEED_DEMO=false)
npm run db:studio    # browse the database

npm run jobs:status  # when the scheduled jobs last ran
npm run jobs:run     # run whatever is due (the app also does this itself)

npm run catalog:harvest    # search YouTube per topic per language and verify every hit
npm run catalog:filter     # re-apply the current relevance rules to the harvest file
npm run catalog:import     # import a course CSV
npm run catalog:lessons    # give imported YouTube courses a playable lesson
npm run catalog:platforms  # verify and import the curated platform courses
npm run catalog:prune      # drop harvested rows the latest harvest no longer returns
```

## Licensing and content

All assessment questions, course modules, prompts and use cases in this
repository are written for T&C from internal competency requirements and
internally authored scenarios. No third-party course material is reproduced.
External courses (Google, Microsoft, DeepLearning.AI and others) are referenced
by link only — learners follow the link and complete them on the provider's own
platform.
