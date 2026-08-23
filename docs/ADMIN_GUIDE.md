# Administrator guide

For Learning / HR Admins and Super Admins running T&C AI Academy.

Not a click-by-click manual — the screens are self-explanatory. This covers the
decisions: what to set, what to watch, and what to do when something looks
wrong.

---

## 1. Roles

| Role | Can do |
| --- | --- |
| **Employee** | Their own learning, assessments, certificates and profile |
| **Manager** | The above, plus their direct team's progress and capstone reviews |
| **Learning / HR Admin** | People, catalog, paths, assessments, questions, enrolments, certificates, analytics, reports, content, opportunities, recommendation weights |
| **Super Admin** | Everything, plus settings, branding, integrations, roles/permissions and the audit log |

A person can hold more than one role. The highest decides which home page they
land on; permissions are the union.

**Keep Super Admins to two or three.** Day-to-day academy work needs only the
Admin role.

---

## 2. First week

1. **Settings** — organisation name, default locale, target learning hours
   (default 35), certification thresholds.
2. **Branding** — logo, mark, favicon, brand colours. No code change needed.
3. **Organisation** — departments, sections, job titles, locations. Get these
   right *before* importing people: the recommendation engine matches courses to
   departments and job families, so an employee with no department gets generic
   content.
4. **Import employees** (§3).
5. **Review the catalog** — 55 seeded courses, including 10 taught natively in
   Arabic or Turkish. To go beyond that, import a provider export rather than
   adding entries by hand (§4). Confirm the external links still
   work and adjust hours if your experience differs.
6. **Integrations** — SMTP if you want email reminders; the AI provider if you
   want the coach and generated explanations. Both are optional.
7. **Announce it.** Employees need to know the assessment measures capability to
   target learning, and is not a performance review. Say so explicitly, or
   participation suffers and results skew.

---

## 3. Importing employees

**Admin → People → Import.** Excel (.xlsx) or CSV. Download the template from
that page.

| Column | Required | Notes |
| --- | --- | --- |
| Employee ID | ✔ | Unique. Used to sign in and to link managers |
| Full Name | ✔ | |
| Email | ✔ | Unique |
| Department | | Must match an existing department name |
| Section | | Must match a section of that department |
| Job Title | | Creates the job-family mapping used by the engine |
| Manager Employee ID | | Another row's Employee ID, or an existing employee |
| Location | | |
| Language | | `en`, `ar` or `tr`; defaults to the system default |
| Years Experience | | |
| AI Experience | | `NONE`, `TRIED`, `OCCASIONAL`, `REGULAR`, `ADVANCED` |
| Technical | | `yes` / `no` |
| Weekly Hours | | Learning time available per week |

Column order does not matter and extra columns are ignored.

**The preview is the point.** Every row is validated before anything is written
and shown as create / update / error with the reason. Nothing is imported until
you confirm. Fix the file and re-upload — the import is idempotent on Employee
ID, so re-running updates rather than duplicating.

**Managers.** If a manager appears later in the same file than their reports,
the import still links them — the whole file is resolved before writing.

---

## 4. The catalog

**Admin → Courses.** Two kinds of course:

- **External** — Google, Microsoft, DeepLearning.AI and others. The learner
  follows the link and completes it on the provider's platform, then submits a
  completion proof (certificate PDF or screenshot) which an admin verifies.
  *No third-party content is copied into this system.*
- **Internal** — authored here: modules, lessons, quizzes, a capstone.

### Fields that drive the recommendation engine

Get these right and the engine works. Leave them empty and it falls back to
generic content.

| Field | Effect |
| --- | --- |
| **AI level** | Level match. A course with no level scores a flat 0.60 |
| **Competencies + weights** | Competency gap, and which phase the course lands in |
| **Departments** | Role match, strongly |
| **Job families** | Role match |
| **Learning goals + weights** | Goal match |
| **Estimated hours** | Time fit and path assembly |
| **Prerequisites** | Hard constraint and ordering |
| **Language + subtitles** | Language fit |
| **Technical flag** | Keeps technical content away from non-technical staff |
| **Mandatory flag** | Forces inclusion for everyone |
| **Provider trust / quality** | Quality signal |

Full detail in
[COURSE_RECOMMENDATION_ENGINE.md](COURSE_RECOMMENDATION_ENGINE.md).

### Importing a large catalog

Twenty courses can be typed in. A thousand cannot, and cannot be kept current by
hand either. **Admin → Courses → Import** takes an Excel or CSV export and loads
it, validating every row first — the same preview-then-commit flow as the
employee import.

Only **Code**, **Title** and **Provider** are required, and Code is derived from
the title if you omit it. Column order does not matter, extra columns are
ignored, and common alternative headings are recognised (*Link* for URL,
*Duration* for Hours, *Partner* for Provider). Multi-value columns accept
commas, semicolons or pipes.

The columns that matter most are the ones the engine reads: **Level**,
**Hours**, **Competencies**, **Departments**, **Job Families**, **Goals**,
**Language**. A course without them still imports, but it can only ever be found
by search — the engine has nothing to match it on. The preview warns you per row.

**Imported courses arrive unverified.** Nobody has opened the links, so the
engine keeps them off employees' paths until someone does — work through
*Courses → Needs review*. If the file is a provider's own catalog export, where
the links are as reliable as any you would click yourself, tick **"These links
come from a trusted source"** at commit and they go live immediately. Either
choice is recorded in the audit log against your name.

Expect validation to be instant and the commit to take roughly a minute per
thousand courses. Leave the tab open.

### Link review

External courses go stale. Each course has a review interval (default 180 days);
past it, the course is flagged **Needs review**. Filter the list by that flag,
open the link, and record the verification. A course marked unavailable or with
a broken link is excluded from every new recommendation — nobody is ever sent to
a dead URL.

---

## 5. Assessments and questions

**Admin → Questions** holds four banks — 147 seeded questions across five
competencies and three difficulty bands, every one of them written in English,
Arabic and Turkish:

| Bank | Used by | Character |
| --- | --- | --- |
| `BANK_PLACEMENT` | Placement only | 30 deliberately easy, plain-language questions |
| `BANK_CORE` | Final exam, module quizzes | The full difficulty range |
| `BANK_TECHNICAL` | Technical assessment | IT, data and development |
| `BANK_PRACTICAL` | Practical prompt task | Rubric-graded written answers |

A pool can be scoped to one bank, which is how the placement stays easy without
softening the final exam.

Writing good questions:

- A real workplace situation, not a definition.
- One defensible best answer; distractors that a reasonable person might pick.
- No trick questions, no programming outside the technical bank.
- Test judgement, not recall.

**Admin → Assessments** defines what gets asked: pools (competency × difficulty
× count), duration, pass mark, attempt limit, cooldown, adaptivity. Adding
questions to the bank automatically deepens the pool they belong to — no
assessment edit needed.

**Grading queue.** Written answers (`SHORT_ANSWER`, `PROMPT_TASK`) get an
immediate rubric-based provisional score and are always flagged for human
review. Confirm or override them here; overrides are audited.

See [ASSESSMENT_SCORING.md](ASSESSMENT_SCORING.md).

---

## 6. Tuning the recommendation engine

**Admin → Recommendation** (Super Admin). Seven weights, with a live preview
against a real employee, and every rejected course shown with its reason.

| Symptom | Move |
| --- | --- |
| Paths feel generic | ↑ Role match |
| Content too hard or too easy | ↑ AI level match |
| Ignores what people asked for | ↑ Learning goal |
| Not addressing weaknesses | ↑ Competency gap |
| Paths too long to finish | ↑ Time fit, or lower target hours in Settings |

Changes apply to **new** runs. Existing learners keep their path — pulling
courses out from under someone mid-way is worse than a slightly stale path.

**When a recommendation looks wrong, check the data before the weights.** Nine
times in ten it is a course missing its department mapping, competency weights
or level. The preview shows you exactly which constraint or which component
caused it.

---

## 7. Enrolments, proofs and certificates

**Admin → Enrolments** — assign learning directly (a compliance course to a
whole department, for instance), extend deadlines, and verify external
completion proofs. A proof is a file the learner uploaded; it is served only
through a permission-checked route and is never public.

**Admin → Certificates** — issue, view and revoke. Programme certificates
require, by default:

- path completion at or above the completion threshold,
- the final assessment passed,
- the Responsible AI assessment passed,
- the capstone approved.

All four are configurable in Settings. Every certificate carries a code and a QR
that resolves to `/verify/<code>` — a public page showing the holder, the title,
the date and validity, and nothing more.

Revocation is permanent and audited; the verification page then shows the
certificate as revoked rather than pretending it never existed.

---

## 8. Analytics and reports

**Admin → Analytics** is the executive view: the AI Readiness Index with its
components and weights published on the page, participation, level distribution,
the department heatmap, improvement, and the AI opportunity pipeline.

Two rules the design enforces, and you should keep:

- **No unexplained numbers.** Any figure shown to leadership must be traceable
  to its inputs.
- **No departmental shaming.** The heatmap identifies where support is needed.
  Framed as a league table, it stops people being honest in assessments, and
  then every number afterwards is worthless.

**Admin → Reports** — eleven reports, each as Excel or CSV, plus the executive
PDF:

employee learning · department learning · course completion · assessment ·
skills gap · AI readiness · certificates · overdue · training hours ·
improvement · course effectiveness

**Benefit figures are never invented.** If leadership wants hours or money
saved, that number comes from what employees and managers actually recorded
against their capstones and AI opportunities. The system will not fabricate one.

---

## 9. Settings reference

| Setting | Default | Effect |
| --- | --- | --- |
| `learning.targetHours` | 35 | Path target |
| `learning.minHours` / `maxHours` | 30 / 40 | Assembly bounds |
| `certification.completionThreshold` | 90 | Path completion % needed for the programme certificate |
| `certification.finalPassScore` | 70 | Final assessment pass mark |
| `certification.responsibleAiMandatory` | true | Responsible AI required before certification |
| `certification.capstoneRequired` | true | Capstone required before certification |
| `catalog.reviewIntervalDays` | 180 | When a course is flagged for review |
| `readiness.weights` | | AI Readiness Index components |
| `security.sessionHours` | 12 | Session lifetime |
| `security.maxFailedLogins` | 5 | Attempts before lockout |
| `security.lockoutMinutes` | 15 | Lockout duration |
| `ai.enabled` / `ai.provider` / `ai.model` | off | Optional AI layer |
| `branding.orgName` / `platformName` | | Names shown throughout |
| `general.defaultLocale` | `en` | Locale for new users |

API keys and SMTP passwords are **environment variables**, never settings rows.

---

## 10. Notifications

**Do not spam employees.** Reminders are for learning that is genuinely overdue
or about to expire, not weekly nagging. Rules live in Admin → Settings; the
in-app notification centre always works, email requires SMTP.

If participation is low, the answer is a conversation with managers, not more
email.

---

## 11. Routine maintenance

| When | Task |
| --- | --- |
| Weekly | Verify pending completion proofs · clear the grading queue · check the backup log · glance at Settings → Scheduled jobs · **close the register on any session that has run** |
| Monthly | Review withdrawn courses · review new AI opportunities · check department participation |
| Quarterly | Re-check assessment questions against reality · review recommendation weights against outcomes · **rehearse a restore** |
| Annually | Refresh the catalog · retire stale courses · review level bands and thresholds |

### Scheduled jobs

Settings → **Scheduled jobs** lists the two jobs that keep the academy current
and when each last ran:

- **Reminder rules** — evaluates your reminder rules and notifies whoever they
  match. Duplicate unread reminders are never created, so a rule cannot spam an
  employee.
- **Course link check** — re-checks external course links, 250 at a time. Three
  consecutive failures withdraw a course from the catalogue: it stops being
  browsable and stops being recommended, but nothing is deleted and the
  enrolment history stays intact. Fix the URL and the next check restores it.
  The course screen shows the reason it failed.

Both run inside the application on a fifteen-minute tick. If a last-run time is
older than a day, the scheduler is not running — tell whoever operates the
server; the fix is in [DEPLOYMENT.md](DEPLOYMENT.md#7-scheduled-work). **Run
now** forces both immediately, which is what you want after editing a rule.

---

## 12. SCORM packages

A SCORM package is a course somebody else authored — in Articulate, Captivate,
iSpring or similar — exported as a `.zip`. Loading one lets a bought course run
*inside* the academy and report its own completion and score, rather than
sending the employee to a supplier's website.

**To load one:** Catalog → open the course → **SCORM package**. Pick the lesson
it belongs to, choose the `.zip`, upload. The version, launch file and file count
shown afterwards are read from the package's own manifest, not typed in.

Uploading again against the same lesson replaces the package. Learner progress
is kept.

### What it records

The package reports back as the employee works: completion, pass or fail, score,
how far through they got, and enough state to resume where they stopped. A pass
or a completion ticks the lesson off, which drives the enrolment's progress like
any other lesson.

Certificates are unaffected: the academy only issues them for its own internal
courses, so a SCORM package cannot mint one.

### Before you upload someone else's package

> A SCORM package is **executable content**. It runs as part of the academy, not
> in a box beside it — the SCORM standard requires this, because the package
> finds the LMS by looking outward from its own frame. A package from a
> supplier you trust is fine. A package from an unknown source can do anything
> the person viewing it could do.

Only people who can manage the catalogue can upload one, and every upload is in
the audit log with the file name and who did it. If T&C ever needs to accept
packages from an untrusted source, tell whoever runs the server: there is a
deployment change that contains them properly, in
[DEPLOYMENT.md](DEPLOYMENT.md#8-scorm-content-safety).

### When a package will not load

The upload refuses, and says why, rather than half-loading:

| Message | What happened |
| --- | --- |
| not a SCORM package | No `imsmanifest.xml` inside. It is probably a plain zip of files. |
| no launchable content | The manifest lists only assets, no startable unit. |
| the manifest points at … which is not in the package | Exported incompletely — re-export from the authoring tool. |
| path escapes the package | The archive contains paths pointing outside itself. Do not use it, and tell whoever supplied it. |
| package is larger than … | Raise `MAX_SCORM_BYTES` on the server, or ask for a lighter export. |

---

## 13. Instructor-led training

Classroom and online sessions, with a register. This is how floor training,
briefings and workshops get onto an employee's record.

**To schedule one:** Training sessions → **New session**. Give it a time, a
capacity, and — if it teaches something in the catalogue — link the course.
Linking matters: it is what lets attendance complete the course.

Sessions can be in person, online or hybrid. Online sessions take a meeting link;
in-person ones take a location and a room.

### Places and the waiting list

Registration stops at capacity. Beyond that, employees join a waiting list in
the order they applied. When somebody gives up a place, the next person on the
list gets it **immediately** and is notified — there is no nightly sweep to wait
for.

An employee cannot hold two places that overlap in time. The second attempt is
refused and names the session that conflicts, so they can decide which they
want.

### The register

Open the session and tick who attended. Saving does three things for each person
marked present:

1. records the attendance against their name and yours,
2. completes the linked course for them, if there is one,
3. adds the session's hours to their learning record.

Hours come from the **Hours credited on attendance** field, or the session's own
length if you leave it blank.

Nobody is enrolled in anything they did not have a place for — the seat is the
consent. Re-opening the register later shows what you recorded, so a correction
does not start from blank.

### Cancelling

Cancelling notifies everyone holding a place *and* everyone waiting for one, with
whatever reason you give. The session stays in the record rather than
disappearing, and anyone who already attended keeps their credit.

---

## 14. Troubleshooting

**"Someone got a strange path."** Admin → Recommendation → Preview for that
employee. It shows every component score and every rejection reason. Almost
always a catalog mapping.

**"An employee cannot sign in."** Check status is Active and whether the account
is locked (Admin → People). Lockout clears itself after the configured window,
or you can reset it. Check the audit log for the attempts.

**"Their path is short."** The catalog cannot honestly fill 35 hours for that
level and department. The engine returns a short path rather than padding it
with content aimed at someone else. Add courses for that department, or lower
the target.

**"A certificate will not issue."** The learner's certificates page lists the
four requirements with a tick or a cross against each. That is the answer.

**"Reports are empty."** No graded attempts yet. Improvement reports need *two*
different attempts per person — a single attempt is a baseline, not growth.

**"An export downloads as a broken file."** Almost always a proxy stripping the
content type. Check `client_max_body_size` and that the reverse proxy is not
buffering large responses.
