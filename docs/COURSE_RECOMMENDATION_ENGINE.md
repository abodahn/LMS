# The course recommendation engine

This is the core intelligence of T&C AI Academy. Everything else — the
assessment, the catalog, the player, the certificate — exists so that this can
run well.

Two rules govern it:

1. **It is deterministic.** The same learner, the same catalog and the same
   weights always produce the same path. There is no sampling, no temperature,
   no time-dependence.
2. **No LLM makes the decision.** The AI layer may *describe* a result in
   friendlier words. It never selects, ranks, filters or reorders a course.
   Turning AI off changes the wording of nothing that matters.

Source: [`src/lib/recommendation/engine.ts`](../src/lib/recommendation/engine.ts)
(pure, no database) and
[`src/lib/recommendation/service.ts`](../src/lib/recommendation/service.ts)
(loads the learner, the catalog and the weights).
Engine version is stamped on every run as `ENGINE_VERSION` — currently `1.0.0`.

---

## 1. The twenty inputs

| # | Input | Where it comes from | Used by |
| --- | --- | --- | --- |
| 1 | Current AI proficiency level (L0–L4) | placement / latest assessment | constraints, AI level match |
| 2 | Department | employee record | role match |
| 3 | Job title | employee record | role match |
| 4 | Job family | job title → family mapping | role match, path template |
| 5 | Daily tasks | first-time profile | goal match (via goals), reasons |
| 6 | AI experience level | first-time profile | competency defaults before assessment |
| 7 | Learning objective(s) | first-time profile / goals page | learning goal |
| 8 | Technical or non-technical | job family + self-declared | constraints, path template |
| 9 | Preferred language | profile | language fit |
| 10 | Weekly available time | profile | time fit, target date |
| 11 | Previously completed courses | enrolments + imported history | constraints (never repeat) |
| 12 | Competency weaknesses | assessment competency scores | competency gap |
| 13 | Competency strengths | assessment competency scores | competency gap |
| 14 | Manager development goals | manager nomination | forced inclusion, reasons |
| 15 | Mandatory corporate learning | course flag / assignment | forced inclusion |
| 16 | Course prerequisites | catalog | constraints |
| 17 | Course difficulty level | catalog | constraints, AI level match |
| 18 | Course duration | catalog | time fit, path assembly |
| 19 | Previous assessment results | attempt history | competency gap, expected outcome |
| 20 | Course completion history | enrolments | constraints |

Anything not yet known has an explicit, documented fallback — never a silent
zero. Before an assessment exists, competency gap scores `0.5` and says so:
*"No assessment yet — using role defaults."*

---

## 2. Stage 1 — constraints

Hard rules. A course removed here is never scored, and the reason is recorded so
an admin can see it in **Admin → Recommendation → Preview**.

| Code | Rule |
| --- | --- |
| `NOT_PUBLISHED` | Not published in the catalog |
| `UNAVAILABLE` | Marked unavailable, or the link is known to be broken |
| `COMPLETED` | Already completed by this employee |
| `ENROLLED` | Already on this employee's plan |
| `PREREQUISITE` | A prerequisite is neither completed nor itself a candidate |
| `BELOW_LEVEL` | Two or more levels below the employee's demonstrated level |
| `TOO_ADVANCED` | Three or more levels above the employee's current level |
| `TECHNICAL` | Technical content, employee is non-technical, and did not ask for it |
| `LANGUAGE` | Not taught in a language this employee can follow |

Two details worth knowing:

**Prerequisites may be satisfied inside the same path.** If course B requires
course A and both are candidates, B is kept — ordering in stage 3 guarantees A
comes first.

**The ceiling is +2, not +1.** A 35-hour path is *designed* to move someone up a
level, so content one or two levels ahead belongs in its later phases. An L0
production line leader must still be able to reach their own role module, which
sits at L2. Only a three-level jump is genuinely out of reach. Scoring, not
constraints, keeps advanced content out of the early phases.

**Language is a hard rule, not a preference.** English is T&C's working language
and stays acceptable to everyone, but anything else must be taught in the
learner's own language or carry subtitles in it. Without this, adding Arabic and
Turkish content to the catalog would start offering Turkish video to Arabic
speakers on the strength of a good topic match.

**Mandatory learning bypasses the soft rules** (level, technical) but never the
availability rules. A required course that is unpublished or broken is still
rejected — silently serving a dead link would be worse.

---

## 3. Stage 2 — weighted scoring

Seven components. Each returns a raw value in `[0, 1]` **and a sentence**. The
sentence is the reason the learner sees; the number is what the ranking uses.

| Component | Default weight | Question it answers |
| --- | ---: | --- |
| `AI_LEVEL_MATCH` | 25 | Is this pitched at the right level for this person? |
| `ROLE_MATCH` | 20 | Is this for their department and job family? |
| `COMPETENCY_GAP` | 20 | Does it target what they actually scored badly on? |
| `LEARNING_GOAL` | 15 | Does it cover what they said they want to learn? |
| `COURSE_QUALITY` | 10 | Is the provider and the course any good? |
| `TIME_FIT` | 5 | Does it fit the time they actually have? |
| `LANGUAGE_FIT` | 5 | Can they follow it in their language? |

Weights live in the `RecommendationWeight` table and are editable by a Super
Admin at **Admin → Recommendation**. They are normalised, so any set of numbers
works — entering `50/40/40/30/20/10/10` gives exactly the same result as the
defaults.

```
contribution(k) = raw(k) × weight(k) × 100 / Σ weights
recommendation_score = Σ contribution(k)          # 0 … 100
```

### 3.1 AI level match

`delta = courseLevel − learnerLevel`

| delta | raw | Reason shown |
| ---: | ---: | --- |
| 0 | 1.00 | "Written for your level (L2)" |
| +1 | 0.85 | "The natural next step up from your level" |
| −1 | 0.55 | "Consolidates the ground your level is built on" |
| +2 | 0.35 | "Where this path is taking you" |
| other | 0.15 | "Some distance from your current level" |
| no level set | 0.60 | "General-audience content" |

### 3.2 Role match

| Situation | raw |
| --- | ---: |
| Mapped to the employee's department **and** job family | 1.00 |
| Mapped to their department | 0.90 |
| Mapped to their job family | 0.85 |
| Mapped to no department and no family (universal) | 0.55 |
| Mapped to job family `GENERAL` | 0.50 |
| Mapped only to *other* departments | 0.15 |

A course scoring below `0.5` here is marked **not role relevant** and is never
auto-selected into a path, however well it scores elsewhere. It can still be
enrolled in manually from the catalog.

### 3.3 Competency gap

For each competency the course teaches, weighted by how much of the course it
represents:

```
gap = max(0, (100 − learnerScorePercent) / 100)
raw = Σ(gap × competencyWeight) / Σ competencyWeight
```

Competencies scored below 70% are named in the reason:
*"Improves your weakest areas: prompting, data & automation."*

No assessment yet → `0.5`, "No assessment yet — using role defaults".
Course with no competency mapping → `0.4`, "No specific competency mapped".

### 3.4 Learning goal

```
coverage = min(1, matchedGoalWeight / courseGoalWeight + matchedCount / learnerGoalCount)
```

No goals selected → `0.5`. Course not mapped to goals → `0.4`. Goals selected
but none overlap → `0.1`, "Does not cover the goals you selected".

### 3.5 Course quality

The mean of the available signals — provider trust, curated quality score, star
rating (÷5), internal learner feedback (÷5), and `0.9` if a certificate is
available. Missing signals are omitted from the mean, not counted as zero.

### 3.6 Time fit

`weeks = courseHours / weeklyHours` (weekly hours defaults to 2 if unset).

| weeks | raw | Reason |
| ---: | ---: | --- |
| ≤ 4 | 1.00 | "Fits comfortably in your weekly learning time" |
| ≤ 8 | 0.75 | "About two months at your current pace" |
| ≤ 14 | 0.45 | "A longer commitment at your current pace" |
| > 14 | 0.15 | "Very long at your current weekly pace" |

### 3.7 Language fit

Course in the learner's language `1.0` · also available in it `0.8` · English
fallback `0.55` · neither `0.25`.

The weight is only 5%, but that is enough to decide between two rows of the
*same* course. `AI For Everyone` is seeded twice — English and Arabic — and every
other component scores identically, so the 2.25-point language difference picks
the right one per learner. Topic de-duplication then guarantees only one of them
reaches the path. The same pattern works for any course published in more than
one language.

### 3.8 Reasons

The learner sees the components that actually carried the decision: those with
`raw ≥ 0.6` and a positive contribution, strongest first, at most four. A course
is never presented as a bare number with no explanation.

Mandatory and manager-nominated courses get a reason pinned to the front —
*"Required corporate learning at T&C"*, *"Recommended for you by your
manager"* — so nobody has to guess why something appeared.

---

## 4. Stage 3 — path assembly

A 35-hour path is **not** "the five highest-scoring courses". Ranking alone
produces four role modules and no foundations. Assembly runs in six phases, in
this order:

```
Understand AI  →  Master practical AI  →  AI for your job
               →  Data & automation    →  Technical AI
               →  Responsible AI & capstone
```

A course's phase is decided by its dominant (highest-weighted) competency.

1. **Forced first.** Mandatory and manager-nominated courses go in regardless of
   hours.
2. **One course per phase**, in phase order, subject to two budgets:
   - a **reserve** of 4 hours for each later phase that still has content, so a
     single long course cannot swallow the path;
   - a **dominance cap** of 60% of the target hours — a 30-hour programme is a
     path in its own right, not one phase of one.
3. **Top-up**, only while below the minimum hours, only with role-relevant
   content that does not repeat a topic already covered.

**Topic de-duplication.** Two courses cover the same ground when they share a
dominant competency *and* the same audience (`COMPETENCY:ROLE` vs
`COMPETENCY:GENERAL`). Generic workplace content and the employee's own role
module are deliberately different topics — mandatory general learning must never
crowd out the role-specific module, which is the entire point of a personalised
path.

**Short beats padded.** If the catalog cannot honestly reach the target for this
learner, the path comes back short. It is never filled with content aimed at
another department to hit 35.00 exactly. Courses left out are recorded as
`DUPLICATE_TOPIC` or `NO_ROOM`.

**Ordering.** Phase order first, then prerequisites, then score. A final pass
walks the list and moves any prerequisite that landed after its dependant ahead
of it.

**Expected outcome.** A path of 20 hours or more is expected to move the learner
up one level (capped at L4). This is shown as an expectation, never a promise.

**Programme title.** Path templates whose job families exclude the learner are
dropped, as are technical programmes for non-technical learners. The rest are
ranked `10 − |audienceLevel − learnerLevel| × 3`, `+5` for a job-family match,
`+2` when the technical flag agrees.

---

## 5. Output

```jsonc
{
  "engineVersion": "1.0.0",
  "programTitle": "AI Productivity Foundation",
  "totalHours": 30,
  "targetHours": 35,
  "expectedLevelCode": "L1",
  "selected": [ { "course": {...}, "score": 78.4, "phase": "Understand AI",
                  "order": 0, "breakdown": [...], "reasons": [...] } ],
  "considered": [ /* every scored course, highest first */ ],
  "rejected":  [ { "code": "AI-ADV-01", "reasonCode": "TOO_ADVANCED",
                   "reason": "Three or more levels above the employee's current level" } ]
}
```

Every run is persisted — `RecommendationRun`, `Recommendation`,
`RecommendationReason` — with the weights and engine version used. A path can
always be re-explained months later, exactly as it was generated.

---

## 6. Worked example

**Ashraf Younis · TC-4004 · Line Leader, Production · L0 (18%)**

Result: *AI Productivity Foundation* — 30 hours, 5 courses.

| Phase | Course | Hours | Why |
| --- | --- | ---: | --- |
| Understand AI | Google AI Essentials (video series) | 4 | Written for your level (L0) · Trusted provider |
| Master practical AI | Google Prompting Essentials | 9 | The natural next step up · Improves your weakest areas: prompting |
| AI for your job | AI for Production | 8 | Built for Production and your job family |
| Responsible AI | AI at T&C | 5 | Required corporate learning at T&C |
| Responsible AI | Responsible AI at T&C | 4 | Required corporate learning at T&C |

Rejected, with reasons — advanced technical courses as `TOO_ADVANCED`, finance
and HR modules as not role relevant, everything already completed as
`COMPLETED`.

Note what did **not** happen: no Python, no ML engineering, no course aimed at
another department, and the role module was reachable despite a two-level gap.

---

## 7. Acceptance scenarios

Locked in as unit tests in
[`tests/recommendation.test.ts`](../tests/recommendation.test.ts):

| Scenario | Expected |
| --- | --- |
| HR employee, 15% score, non-technical | Foundation-level path. No technical content. |
| Finance employee, 55%, strong prompting, weak data | Data-focused productivity path. |
| IT developer, 80%, technical | L3/L4 technical path. |
| CEO, 45% | Executive/leadership route — **not** Python. |
| Production manager, 30% | Foundation plus production-specific content. |

Plus the invariants: no course below level −2 or above +3; nothing already
completed; prerequisites always ordered; mandatory always present; the same
input twice gives byte-identical output.

---

## 8. Tuning it

**Admin → Recommendation** exposes the weights with live preview against a real
employee. Every change is written to the audit log with the old and new values.

Practical guidance:

- **Too generic?** Raise `ROLE_MATCH`.
- **Too hard / too easy?** Raise `AI_LEVEL_MATCH`.
- **Ignoring what people asked for?** Raise `LEARNING_GOAL`.
- **Not fixing weaknesses?** Raise `COMPETENCY_GAP`.
- **Paths too long to finish?** Raise `TIME_FIT`, or lower the target hours in
  **Settings**.

Existing paths are not retroactively changed by a weight edit — a learner's plan
stays stable. New runs use the new weights, and the run record stores which
weights produced it.

If the engine picks something that looks wrong, the fix is almost always in the
**data**, not the algorithm: a course missing its department mapping, its
competency weights, its level, or its prerequisites. Check
**Admin → Recommendation → Preview** — it shows every rejection reason and every
component score for the learner in question.
