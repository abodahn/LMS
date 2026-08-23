# Assessment and scoring

How T&C AI Academy measures AI capability: what it asks, how answers are
graded, how a level is decided, and what the learner is shown.

Source: [`src/lib/assessment/scoring.ts`](../src/lib/assessment/scoring.ts)
(pure, fully unit-tested) and
[`src/lib/assessment/service.ts`](../src/lib/assessment/service.ts) (attempts,
pooling, persistence).

---

## 1. Design principles

- **Practical, not trivia.** Every question is a decision someone actually has
  to make at work. Nothing tests whether you can recall what "GPT" stands for.
- **No programming in the general assessment.** A production supervisor and a
  developer sit the same placement assessment.
- **Never a bare score.** A result is a level, five competency bars, named
  strengths, named gaps, and what happens next. A percentage on its own tells
  someone nothing they can act on.
- **Reproducible.** Grading is deterministic. No LLM writes a score. Written
  answers are scored against a published rubric and always flagged for human
  confirmation.
- **Original content.** All questions are authored internally from T&C's
  competency requirements. No third-party assessment material is reproduced.
- **Readable by the person sitting it.** Every question and every answer option
  exists in English, Arabic and Turkish. A question an employee cannot read
  measures nothing except their English.

---

## 2. The five competencies

| Key | Competency | Weight | What it covers |
| --- | --- | ---: | --- |
| `FUNDAMENTALS` | AI fundamentals | 20% | What AI is and is not, capability and limits, hallucination |
| `WORKPLACE` | Practical workplace application | 25% | Choosing the right task for AI, judging output, time saved |
| `PROMPTING` | Prompting and interaction | 25% | Context, objective, constraints, output shape, verification |
| `RESPONSIBLE_AI` | Responsible AI, security and data | 20% | Confidentiality, personal data, bias, disclosure, approval |
| `DATA_AUTOMATION` | Data literacy and automation | 10% | Spreadsheets, structured output, where automation belongs |

A sixth competency, `TECHNICAL`, is used only by the optional technical
assessment and never counted in the general score. Weights are stored on the
`Competency` table and are editable.

---

## 3. The assessments

| Assessment | Questions | Time | Pass | Attempts | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| **Placement** | 20 | 25 min | — | 2 | Deliberately easy. No pass mark — it measures, it does not judge |
| **Technical** (optional) | 12 | 18 min | 60% | 3 | Required to reach L4. IT, data and development roles |
| **Responsible AI** | 12 | 20 min | 80% | 5 | Mandatory before any certificate |
| **Final** | 30 | 40 min | 70% | 3 | Same competencies as placement, for a true before/after |
| **Module quizzes** | 3–5 | — | 70% | ∞ | Inside each course module |

Each definition draws from **pools** — a competency, a difficulty band and a
count, optionally scoped to one question bank. The placement assessment pulls 4
`FUNDAMENTALS` + 5 `WORKPLACE` + 5 `PROMPTING` + 4 `RESPONSIBLE_AI` + 2
`DATA_AUTOMATION`, all easy, all from the placement bank — a mix that follows
the competency weights, so the level it produces still means something. Pools
are filled by random selection, so two people rarely see the same paper and both
papers have the same shape.

The seeded banks hold **147 questions**, and every one of them — stem and every
answer option — exists in English, Arabic and Turkish. Add more at
**Admin → Questions**; pools automatically draw from whatever is available.

### Banks

A pool can be scoped to a question bank, so the papers do not contaminate each
other:

| Bank | Drawn on by | Character |
| --- | --- | --- |
| `BANK_PLACEMENT` | Placement only | 30 easy, plain-language, fully translated questions |
| `BANK_CORE` | Final exam, module quizzes | The full difficulty range |
| `BANK_TECHNICAL` | Technical assessment | IT, data and development |
| `BANK_PRACTICAL` | Practical prompt task | Rubric-graded written answers |

This is what lets the placement be genuinely easy while the final certification
exam stays demanding — the easy questions can never leak into it.

---

## 4. Question types and grading

| Type | Grading |
| --- | --- |
| `SINGLE` | All or nothing |
| `TRUE_FALSE` | All or nothing |
| `SCENARIO` | All or nothing — a situation with one defensible best action |
| `MULTI` | Partial credit, penalised: `max(0, (hits − wrong) / correctCount)` |
| `MATCHING` | Ratio of correctly matched pairs |
| `SHORT_ANSWER` | Rubric heuristic, flagged for human review |
| `PROMPT_TASK` | Rubric heuristic, flagged for human review |

Multi-select never scores below zero, so guessing everything scores nothing
rather than something.

### Written answers

`SHORT_ANSWER` and `PROMPT_TASK` questions ask the learner to write a real
prompt for a real task. They are scored against the same rubric taught in the
prompting module:

| Criterion | Weight | Looks for |
| --- | ---: | --- |
| Context | 20 | The situation, the data, who the output is for |
| Clear objective | 20 | Precisely what the AI must produce |
| Data & constraints | 20 | Limits, criteria, tone, format rules |
| Expected output | 20 | The structure of the answer wanted |
| Verification | 20 | Sources, assumptions, or a checking step |

Each criterion is matched by a published set of signal patterns. Answers under
12 words cannot score more than half on any criterion — a five-word prompt does
not demonstrate context, whatever words it contains.

The learner gets specific feedback, not a grade:

> *"Good start. To make this stronger, add: data & constraints, verification."*

**Every written answer is flagged `needsHumanReview`.** The heuristic gives an
immediate, explainable provisional score; an assessor with `assessments.grade`
confirms or overrides it at **Admin → Assessments → Grading queue**. The AI
layer never writes these scores.

---

## 5. From answers to a level

**Step 1 — aggregate by competency.**

```
competencyPercent = Σ score / Σ maxScore     (per competency)
```

**Step 2 — weight the competencies.**

```
overall = Σ (competencyPercent × competencyWeight) / Σ competencyWeight
```

Weighting matters: a competency with more questions does not silently dominate
the result.

**Step 3 — band it.**

| Level | Score | Meaning |
| --- | --- | --- |
| **L0** | 0 – 24.99 | Beginner — has not used AI at work yet |
| **L1** | 25 – 44.99 | Aware — has tried AI, no reliable method |
| **L2** | 45 – 64.99 | Practitioner — uses AI regularly for real work |
| **L3** | 65 – 84.99 | Advanced — designs prompts and workflows for others |
| **L4** | 85 – 100 | Expert — builds and evaluates AI solutions |

**L4 requires the technical assessment.** The general assessment alone caps at
L3, however high the score. L4 claims demonstrated technical capability, and no
set of non-technical questions can demonstrate that. Bands are editable at
**Admin → Assessments → Levels**.

**Step 4 — strengths and gaps.** Up to three competencies at 60% or above are
strengths; up to three below 70% are gaps, weakest first. These feed the
recommendation engine's `COMPETENCY_GAP` component directly.

---

## 6. Adaptive difficulty

The engine supports adaptivity by **controlled branching**, not by item response
theory:

- three correct in a row → the remaining questions reorder towards harder ones;
- two wrong in a row → they reorder towards easier ones.

The number of questions, the competency mix and the scoring are all unchanged;
only the *order* the learner meets questions in shifts. Difficulty moves one
step at a time through `EASY → MEDIUM → ADVANCED`.

It is per-definition (`isAdaptive`) and **off for the placement assessment**.
Stepping a nervous first-time learner up into harder questions is the opposite
of what that assessment is for — it exists to find a starting point, not to
probe a ceiling. It is also off for the final assessment, where everybody should
face the same difficulty profile.

## 7. During the attempt

- **Answers autosave.** Options save on selection, free text after a short
  pause. A closed laptop loses nothing.
- **Resume where you left off.** The attempt remembers the current question.
- **A visible timer**, and time already spent is carried across a resume, so a
  refresh cannot buy extra minutes.
- **Review before submitting** — a grid of answered and unanswered questions.
- **No correct answers are shown mid-attempt**, and answer keys are never sent
  to the browser.

## 8. After the attempt

The result page shows, in this order:

1. **The level**, with a plain-language description of what it means.
2. **Five competency bars** with the actual percentages.
3. **What you are good at** — named strengths.
4. **What to work on** — named gaps.
5. **Your recommended path** — generated immediately, with reasons.
6. **The next action**, as the largest button on the page.

A percentage never appears alone. The framing is developmental throughout: an
L0 result says *"here is where to start"*, not *"you failed"*. The placement
assessment has no pass mark for exactly this reason.

**Before/after.** The final assessment is scored against the same five
competencies as the placement, so the passport page can show a genuine
per-competency delta rather than two unrelated numbers. Only employees with
**two different** graded attempts count towards the organisation's improvement
statistics — a single attempt is a baseline, not growth.

---

## 9. Integrity

Not a proctoring system, deliberately — this measures capability to target
learning, it is not an exam that gates employment. What it does do:

- randomised pooling, so papers differ between people;
- correct answers are never present in the browser payload;
- attempt limits and cooldown periods per definition;
- server-side time limits — the client timer is a courtesy, the server decides;
- every attempt, grade and manual override is written to the audit log;
- manual overrides record who changed what, and to what.

---

## 10. Administration

| Task | Where |
| --- | --- |
| Bulk-load a course catalog from a provider export | Admin → Courses → Import |
| Add or edit questions, options, rubrics | Admin → Questions |
| Create an assessment, set pools, time, pass mark | Admin → Assessments |
| Grade written answers, override scores | Admin → Assessments → Grading |
| Adjust competency weights | Admin → Assessments → Competencies |
| Adjust level bands | Admin → Assessments → Levels |
| Export every attempt with its competency breakdown | Admin → Reports → Assessment |

When adding questions, follow the bank's own conventions: a real workplace
situation, one defensible best answer, plausible distractors, and no question
that rewards recall over judgement.
