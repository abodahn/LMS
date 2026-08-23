import type { Db } from "./client";
import type { CourseSeed } from "./courses";
import { upsertInternalCourse, type ModuleSeed } from "./internal-core";

type RoleCourse = { seed: CourseSeed; modules: ModuleSeed[] };

const base = (
  code: string,
  slug: string,
  title: string,
  description: string,
  outcomes: string[],
  departments: string[],
  jobFamily: string,
  goals: { goalKey: string; weight: number }[],
  extra: Partial<CourseSeed> = {},
): CourseSeed => ({
  code,
  slug,
  title,
  description,
  outcomes,
  provider: "TC_ACADEMY",
  platform: "T&C AI Academy",
  difficulty: "INTERMEDIATE",
  estimatedHours: 8,
  isFree: true,
  certificateAvailable: true,
  level: "L2",
  category: "ROLE_SPECIFIC",
  isInternal: true,
  qualityScore: 1,
  competencies: [
    { key: "WORKPLACE", weight: 4 },
    { key: "PROMPTING", weight: 2 },
    { key: "DATA_AUTOMATION", weight: 1 },
  ],
  departments,
  jobFamilies: [{ jobFamily, weight: 3 }],
  goals,
  ...extra,
});

const capstone = (context: string): ModuleSeed => ({
  title: "4. Workplace capstone",
  description: "Apply this to a real task from your own job.",
  lessons: [
    {
      title: "Your department capstone",
      type: "ASSIGNMENT",
      durationMinutes: 60,
      content: `${context}

Submit the structured capstone form: business problem, current process, where AI helps, your prompt or workflow, expected output, risks, how you will validate the result, and an estimated benefit.

Two rules on the benefit figure: estimate it from something you actually measured (how long the task takes today), and mark it clearly as an estimate. Do not invent numbers — an honest "about 40 minutes a week" is worth more than a confident fabrication.

Approved capstones are reviewed for the T&C AI Opportunities pipeline, so a good submission can turn into a real project.`,
    },
  ],
});

const quiz = (title: string): ModuleSeed => ({
  title: "5. Module assessment",
  lessons: [{ title, type: "QUIZ", durationMinutes: 15, content: "A short scenario-based check on this course." }],
});

export const ROLE_COURSES: RoleCourse[] = [
  // ------------------------------------------------------------------ FINANCE
  {
    seed: base(
      "INT-ROLE-FIN",
      "ai-for-finance",
      "AI for Finance",
      "Using AI for month-end commentary, variance analysis, budgeting narratives, forecasting assumptions and management reporting — without letting it near the arithmetic.",
      [
        "Turn a variance table into management commentary a director will read",
        "Use AI to structure a budget or forecast narrative",
        "Summarise long financial documents and contracts safely",
        "Build reusable Excel formula and analysis prompts",
        "Know exactly which finance data must never leave T&C",
      ],
      ["FIN"],
      "FINANCE",
      [
        { goalKey: "EXCEL", weight: 3 },
        { goalKey: "REPORTS", weight: 3 },
        { goalKey: "DATA_ANALYSIS", weight: 2 },
        { goalKey: "PRESENTATIONS", weight: 1 },
      ],
    ),
    modules: [
      {
        title: "1. The finance division of labour",
        lessons: [
          {
            title: "Excel calculates, AI explains",
            type: "TEXT",
            durationMinutes: 20,
            content: `The single most important rule for finance: **do the arithmetic in Excel, use AI for the language around it.**

Language models are unreliable at multi-step arithmetic over long lists. They are excellent at turning a correct table into a paragraph a non-finance manager will actually read.

So the workflow is:

1. Build the variance / margin / forecast table in Excel as you always have.
2. Paste the *summarised, de-identified* table into AI.
3. Ask for the commentary, the explanation, or the executive summary.
4. Check every figure it repeats back against your table.

Where AI genuinely helps in step 1 is **writing the formula, not doing the sum**: "Give me an Excel formula that returns the variance percentage in column D against budget in column C, showing a dash when budget is zero." You then run that formula on the real data.`,
          },
          {
            title: "Variance analysis that gets read",
            type: "TEXT",
            durationMinutes: 20,
            content: `Most variance commentary fails because it restates the table. A manager can already see that overheads are up 9%. What they need is *why it matters and what to do*.

**A prompt that works**

> I am a finance analyst at a garment manufacturer. Below is a summarised monthly variance table by cost centre, actual vs budget, with percentage variance.
> Write commentary for the operations director. For each variance above 5%, give one sentence on likely drivers based only on what the data shows, and one question they should ask the cost centre owner.
> Maximum 300 words. Plain English, no finance jargon. Group by cost centre.
> Do not speculate beyond the data. Where a driver is unclear, say so explicitly.

That last line matters. Without it you will get confident invented explanations about "seasonal demand" it knows nothing about.`,
          },
          {
            title: "What never leaves finance",
            type: "TEXT",
            durationMinutes: 15,
            content: `Never place into an unapproved tool:

- Costings, standard costs, landed costs, margins
- Customer pricing and contract terms
- Supplier payment terms and rebates
- Payroll data of any kind
- Unpublished results, forecasts and board material
- Bank details, credit lines, treasury positions

**The de-identification move for finance:** scale everything. Change the currency, index the figures to 100, remove the customer and the cost centre name. "A cost centre with an index of 100 last year is running at 109" gets you exactly the same analytical help.`,
          },
        ],
      },
      {
        title: "2. Reporting and documents",
        lessons: [
          {
            title: "Management reporting pack",
            type: "TEXT",
            durationMinutes: 20,
            content: `A repeatable monthly pattern:

1. **Data** — export your summary from the ERP into a clean table.
2. **Narrative** — AI drafts the commentary from the table.
3. **Executive summary** — AI condenses the narrative to five bullets for the front page.
4. **Verification** — you check every number and every causal claim.
5. **Template** — save the prompt to My AI Toolbox and reuse it next month.

Once the template exists, the monthly pack drops from hours to a review. That is where the real return sits — not in the first clever answer, but in the reusable one.`,
          },
          {
            title: "Reading contracts and proposals",
            type: "TEXT",
            durationMinutes: 20,
            content: `For a long supplier or lease document:

> Below is a supplier agreement. Produce, in this order:
> 1. Commercial terms — price basis, payment terms, escalation
> 2. Obligations on us
> 3. Obligations on them
> 4. Termination and penalty clauses
> 5. Anything unusual compared with a standard supply agreement
> Quote the clause number for every point. If something is not stated in the document, list it under "Not addressed" rather than assuming a market norm.

Then read the clauses it quoted. AI narrows twenty pages to the five that need a human — it does not replace reading those five.`,
          },
        ],
      },
      {
        title: "3. Scenarios and forecasting",
        lessons: [
          {
            title: "Scenario narratives",
            type: "TEXT",
            durationMinutes: 20,
            content: `Build the scenarios in your model. Use AI to articulate them.

> I have three scenarios for next year's cotton price: base, +15%, and +30%. My model gives gross margin of 22%, 18% and 14% respectively.
> For each scenario write a short paragraph for the board covering the margin impact, two operational levers available, and the earliest signal that this scenario is materialising.
> Do not introduce figures I have not given you.

The constraint in the last line is what keeps the output usable. Without it, board packs acquire invented numbers — the most damaging failure mode in finance.`,
          },
          {
            title: "Financial presentations",
            type: "TEXT",
            durationMinutes: 15,
            content: `Turning a pack into a presentation is a structuring problem, which AI does well.

> Below is a three-page monthly finance commentary. Turn it into an 8-slide outline for a 15-minute management meeting.
> For each slide give a headline that states the conclusion (not the topic), and three supporting bullets.
> The audience is non-financial. Assume they will not read the appendix.

"Headlines that state the conclusion" is the instruction that separates a useful deck from a table of contents.`,
          },
        ],
      },
      capstone(
        "Choose a real finance task: month-end commentary, a variance pack, a supplier contract review, or a budget narrative.",
      ),
      quiz("AI for Finance assessment"),
    ],
  },

  // ----------------------------------------------------------------------- HR
  {
    seed: base(
      "INT-ROLE-HR",
      "ai-for-hr",
      "AI for HR",
      "Using AI across recruitment, onboarding, learning, policy and employee communication — with strict rules about personal data and people decisions.",
      [
        "Draft job descriptions and structured interview guides",
        "Summarise policies into plain language employees will read",
        "Analyse survey free-text into themes without exposing individuals",
        "Apply the T&C rule that AI never screens or ranks people",
        "Build an onboarding and communication template library",
      ],
      ["HR"],
      "HR",
      [
        { goalKey: "WRITING", weight: 3 },
        { goalKey: "EMAIL", weight: 2 },
        { goalKey: "DOCUMENT_ANALYSIS", weight: 2 },
        { goalKey: "REPORTS", weight: 1 },
      ],
    ),
    modules: [
      {
        title: "1. The rule that comes first",
        lessons: [
          {
            title: "AI structures, humans decide",
            type: "TEXT",
            durationMinutes: 20,
            content: `In HR the boundary is sharper than anywhere else in the company.

**AI may:** draft a job description, generate consistent interview questions, summarise a policy, produce an onboarding checklist, group survey comments into themes, draft a communication.

**AI must not:** score a candidate, rank applicants, screen anyone out, draft a disciplinary conclusion, or produce a promotion or termination recommendation.

The reason is not bureaucratic. Models reproduce patterns in their training data, including biased ones, and they do it invisibly and consistently — which turns a single bias into a systematic one applied to hundreds of people.

**Never paste** CVs, appraisals, salaries, medical notes, disciplinary records or grievance details into a public tool. If you need help with a live case, describe the situation without the person.`,
          },
          {
            title: "CV work, done safely",
            type: "TEXT",
            durationMinutes: 20,
            content: `You cannot paste a CV into a public tool. You *can* use AI to make your own screening more consistent.

> I am hiring a Production Planner for a garment manufacturer. Draft a structured evaluation framework with 6 criteria, each with a clear definition and what a weak / adequate / strong answer looks like.
> The framework must be applicable to any candidate and must not reference age, gender, nationality, marital status or photographs.

You then apply that framework yourself, to real CVs, inside our systems. The AI improved the *process*; it never saw a candidate.`,
          },
        ],
      },
      {
        title: "2. Writing and policy",
        lessons: [
          {
            title: "Job descriptions and adverts",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Draft a job description for a Quality Engineer at a garment manufacturer (about 800 employees, export-focused).
> Include: purpose, 6-8 responsibilities, essential requirements, desirable requirements, and reporting line to the Quality Manager.
> Neutral, factual tone — no marketing language, no "rockstar", no gendered wording.
> Flag any responsibility you inferred rather than something typical of the role, so I can confirm it.

Always review against the real role. The draft is a starting structure, not a description of *our* job.`,
          },
          {
            title: "Policy in plain language",
            type: "TEXT",
            durationMinutes: 20,
            content: `Policies fail when nobody reads them.

> Below is our attendance policy. Produce a one-page employee summary at roughly a grade-8 reading level.
> Cover: what is expected, how to report absence, what happens if the process is not followed, and who to contact.
> Use short sentences and a "what you need to do" list. Do not add any rule that is not in the source text.

Then have the policy owner check it. A summary that drifts from the policy is worse than no summary.`,
          },
        ],
      },
      {
        title: "3. Analytics and communication",
        lessons: [
          {
            title: "Survey and feedback themes",
            type: "TEXT",
            durationMinutes: 20,
            content: `Free-text survey comments are the classic HR analysis problem: too many to read, too valuable to ignore.

> Below are 200 anonymous free-text responses to "What would most improve your working week?"
> Group them into no more than 8 themes. For each theme give a name, an approximate count, and two representative quotes.
> Do not paraphrase quotes — use them verbatim. Flag any comment that suggests a safety or harassment concern separately for human review.

**Before you paste:** confirm the responses are genuinely anonymous and contain no names. Remove any that identify a person.`,
          },
          {
            title: "Employee communication",
            type: "TEXT",
            durationMinutes: 15,
            content: `> Draft an announcement to all factory employees about a change to shift patterns starting next month.
> Tone: respectful, direct, not corporate. Roughly 250 words.
> Cover: what is changing, when, why, what it means for pay, and where to ask questions.
> Produce an English version and note which parts will need careful translation into Arabic.

Employee communications carry more weight than we assume. Draft with AI, then read it once as if you were on the shop floor receiving it.`,
          },
        ],
      },
      capstone("Choose a real HR task: a recruitment framework, a policy summary, an onboarding pack or survey analysis."),
      quiz("AI for HR assessment"),
    ],
  },

  // --------------------------------------------------------------- PRODUCTION
  {
    seed: base(
      "INT-ROLE-PRD",
      "ai-for-production",
      "AI for Production",
      "Using AI for downtime analysis, efficiency reporting, bottleneck investigation, SOP creation and continuous improvement on the factory floor.",
      [
        "Turn shift notes into a structured downtime summary",
        "Run a structured root cause investigation with AI support",
        "Draft SOPs from an experienced operator's description",
        "Produce production reports managers actually read",
        "Identify repeatable production tasks worth automating",
      ],
      ["PRD", "MNT"],
      "PRODUCTION",
      [
        { goalKey: "PRODUCTION_IMPROVEMENT", weight: 3 },
        { goalKey: "REPORTS", weight: 2 },
        { goalKey: "DATA_ANALYSIS", weight: 2 },
        { goalKey: "AUTOMATION", weight: 1 },
      ],
    ),
    modules: [
      {
        title: "1. From shift notes to information",
        lessons: [
          {
            title: "The downtime summary",
            type: "TEXT",
            durationMinutes: 20,
            content: `Every line keeps notes. Almost nobody has time to turn a week of them into anything.

> Below are seven days of shift handover notes from a sewing line. They are informal and inconsistent.
> Produce: (1) a table of downtime events with approximate duration and stated cause, (2) the three most frequent causes by total minutes, (3) any event where the cause is unclear or missing.
> Use only what is written. Do not infer a cause that is not stated — list those under "cause not recorded".

Point 3 is usually the most valuable output. It tells you where your recording process is failing, which is a fixable problem.`,
          },
          {
            title: "Efficiency and bottlenecks",
            type: "TEXT",
            durationMinutes: 20,
            content: `Calculate efficiency in your system. Use AI to interpret and structure the follow-up.

> Line efficiency by operation for last week: [table]. Target is 85%.
> Identify which operations sit below target, whether they cluster at any stage of the flow, and for each one list three plausible causes an industrial engineer would check first.
> Present as a short investigation plan with what to observe and what data to collect.
> Do not conclude a cause — this is a plan, not a diagnosis.

The output is a checklist for a person who goes and looks. That framing keeps it honest.`,
          },
        ],
      },
      {
        title: "2. Root cause and quality trends",
        lessons: [
          {
            title: "Structured root cause analysis",
            type: "TEXT",
            durationMinutes: 20,
            content: `AI is a good facilitator for a 5-Why or fishbone session because it never gets tired of asking the next question.

> We had a 3-hour stoppage on the finishing line. The stated cause was "steam press failure".
> Facilitate a 5-Why analysis. Ask me one question at a time and wait for my answer before continuing.
> At the end, summarise the chain, distinguish the immediate cause from the systemic one, and propose one containment action and one preventive action.

"One question at a time" turns it from a generator into an interviewer, which is what you actually want.`,
          },
          {
            title: "Writing an SOP that gets followed",
            type: "TEXT",
            durationMinutes: 20,
            content: `The best SOPs come from the operator who does the job. The barrier is writing them up.

> I will describe how our most experienced operator sets up the cutting table. Turn it into an SOP with: purpose, scope, PPE and safety notes, numbered steps, checks after each stage, and common mistakes.
> Steps must be short imperatives. Flag anywhere my description is ambiguous rather than filling the gap yourself.

Record the operator explaining it, type up the rough notes, and let AI structure them. Then the operator reviews the SOP — they will spot the two steps you missed.`,
          },
        ],
      },
      {
        title: "3. Reporting and improvement",
        lessons: [
          {
            title: "The daily production report",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Below are today's production figures by line: output, target, efficiency, downtime minutes, top defect.
> Write a 150-word daily summary for the production manager. Lead with anything that needs a decision today. Then a one-line status per line. End with tomorrow's risk.
> Do not repeat every number — only the ones that changed the picture.

The last constraint is what makes it readable. A report that repeats the table is a table with extra steps.`,
          },
          {
            title: "Finding what to improve",
            type: "TEXT",
            durationMinutes: 15,
            content: `> Here are the recurring issues raised in our last six weekly production meetings: [list].
> Group them by underlying theme rather than by how they were described. For each theme, note how often it appeared and whether it looks like a people, machine, method or material issue.
> Then rank the themes by how often they appear against how contained the fix looks, and explain the ranking.

Repeated issues are a better improvement target than dramatic one-offs, and they are exactly what gets lost in meeting minutes.`,
          },
        ],
      },
      capstone("Choose a real production task: a downtime analysis, an SOP, a daily report or a root cause investigation."),
      quiz("AI for Production assessment"),
    ],
  },

  // ------------------------------------------------------------------ QUALITY
  {
    seed: base(
      "INT-ROLE-QLT",
      "ai-for-quality",
      "AI for Quality",
      "Using AI for defect classification, Pareto narratives, root cause work, CAPA documentation, inspection summaries and an introduction to visual inspection.",
      [
        "Classify free-text defect descriptions consistently",
        "Turn a Pareto into an argument management will act on",
        "Draft CAPA documents that satisfy an auditor",
        "Summarise inspection reports for a customer audit",
        "Understand where computer vision does and does not help",
      ],
      ["QLT"],
      "QUALITY",
      [
        { goalKey: "DATA_ANALYSIS", weight: 3 },
        { goalKey: "REPORTS", weight: 2 },
        { goalKey: "DOCUMENT_ANALYSIS", weight: 2 },
        { goalKey: "PRODUCTION_IMPROVEMENT", weight: 2 },
      ],
    ),
    modules: [
      {
        title: "1. Making defect data usable",
        lessons: [
          {
            title: "Classifying free-text defects",
            type: "TEXT",
            durationMinutes: 20,
            content: `Inspectors describe the same defect five different ways. That inconsistency is what stops the data being analysable.

> Below are 300 free-text defect descriptions from final inspection.
> Map each to a standard category from this list: [your defect taxonomy].
> Output a table: original text, assigned category, confidence (high/medium/low).
> Where a description does not fit any category or is too vague, mark it "unclassified" — do not force a fit.

Review every low-confidence and unclassified row yourself. Those rows are where your taxonomy needs work, and they are worth more than the ones it got right.`,
          },
          {
            title: "Pareto that changes a decision",
            type: "TEXT",
            durationMinutes: 20,
            content: `Build the Pareto in Excel. Use AI for the argument.

> Our Pareto of defects for last month: [category, count, % of total, cumulative %].
> Write a half-page for the quality management review: which categories make up 80% of defects, what the two largest suggest about where in the process they originate, and what to investigate first.
> Distinguish clearly between what the data shows and what you are inferring.

That final instruction is the difference between analysis and speculation dressed as analysis.`,
          },
        ],
      },
      {
        title: "2. CAPA and audits",
        lessons: [
          {
            title: "Drafting a CAPA",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Draft a CAPA for this finding: "Repeated needle damage on knit fabric in the sewing section, 2.4% of inspected pieces over three weeks."
> Structure: problem statement, immediate containment, root cause investigation method, corrective action, preventive action, effectiveness check with a measurable criterion and a review date, and responsible role.
> Do not state a root cause — the investigation has not happened yet. Leave that section as a method.

A CAPA that names a root cause before the investigation is the most common audit finding there is. The constraint above prevents exactly that.`,
          },
          {
            title: "Inspection report summaries",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Below are 12 inline inspection reports from this week.
> Produce a one-page summary: total pieces inspected, overall defect rate, the three most common defects with counts, any line appearing repeatedly, and any report with missing or inconsistent data.
> Quote report numbers for every point so each can be traced.
> Do not calculate rates I have not provided — if a total is missing, say so.

Traceability is the requirement here. An audit summary that cannot be traced back to source reports is not usable evidence.`,
          },
        ],
      },
      {
        title: "3. Looking ahead",
        lessons: [
          {
            title: "Quality trend analysis",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Monthly defect rates by category for the last 12 months: [table].
> Identify which categories are trending up, which are stable, and which show seasonality. Note any month that breaks the pattern.
> For each rising trend, list what evidence would confirm or rule out a real deterioration versus a change in how we inspect.

That last part matters more than it sounds. A rising defect rate often means inspection improved, and confusing the two sends teams chasing the wrong problem.`,
          },
          {
            title: "Computer vision: a realistic view",
            type: "TEXT",
            durationMinutes: 15,
            content: `Automated visual inspection is real in garment manufacturing, but it is a project, not a tool you switch on.

**Works reasonably today:** consistent, high-contrast, well-lit defects on a controlled surface — holes, stains, some print faults.

**Still hard:** subtle shade variation, fabric hand feel, anything needing judgement about acceptability, and anything where "defect" depends on the customer's standard.

**What it needs:** thousands of labelled images, stable lighting and fixturing, a retraining process as fabrics change, and a human path for anything the model is unsure about.

The useful first step is not buying a system. It is starting to photograph and label defects consistently — that dataset is the asset, and it takes months to build.`,
          },
        ],
      },
      capstone("Choose a real quality task: defect classification, a CAPA, a trend analysis or an audit summary."),
      quiz("AI for Quality assessment"),
    ],
  },

  // ------------------------------------------------------------- SUPPLY CHAIN
  {
    seed: base(
      "INT-ROLE-SCM",
      "ai-for-supply-chain",
      "AI for Supply Chain",
      "Using AI for RFQ comparison, supplier analysis, inventory and demand questions, risk assessment and vendor communication.",
      [
        "Compare RFQ responses against criteria you define",
        "Summarise supplier terms and spot what is missing",
        "Structure demand and inventory questions for analysis",
        "Assess supplier risk from documents you already hold",
        "Write clear, firm vendor communication quickly",
      ],
      ["SCM", "WHS", "PLN"],
      "SUPPLY_CHAIN",
      [
        { goalKey: "DOCUMENT_ANALYSIS", weight: 3 },
        { goalKey: "DATA_ANALYSIS", weight: 2 },
        { goalKey: "EMAIL", weight: 2 },
        { goalKey: "REPORTS", weight: 1 },
      ],
    ),
    modules: [
      {
        title: "1. RFQ and supplier analysis",
        lessons: [
          {
            title: "Comparing three quotations",
            type: "TEXT",
            durationMinutes: 20,
            content: `The classic supply chain AI task, and a good one — as long as *you* set the criteria.

> I am comparing three supplier quotations for [commodity]. The quotations are below, with supplier names removed.
> Build a comparison table with these criteria: unit price basis, MOQ, lead time, payment terms, quality guarantees, penalty clauses, and what each quotation does not state.
> Then give a short risk assessment for each, and a recommendation with the reasoning.
> Do not weight the criteria yourself — if a trade-off is needed, present it and let me decide.

Remove supplier names and any pricing you would not want outside T&C. The analysis is just as good on "Supplier A / B / C".`,
          },
          {
            title: "What the quotation does not say",
            type: "TEXT",
            durationMinutes: 20,
            content: `Missing terms cost more than bad ones, because nobody argues about them until it is too late.

> Below is a supplier quotation. List everything a purchasing manager would normally expect to see that is absent or ambiguous — incoterms, currency, validity period, escalation, packaging, inspection rights, remedy for late delivery.
> For each gap, draft one direct question to send to the supplier.
> Do not assume a market standard applies where the document is silent.

You get a ready-to-send clarification email and a much stronger negotiating position.`,
          },
        ],
      },
      {
        title: "2. Planning and inventory",
        lessons: [
          {
            title: "Framing a demand question",
            type: "TEXT",
            durationMinutes: 20,
            content: `AI will not forecast your demand. It is very good at helping you ask the right question of your own data.

> I plan raw material for a garment factory. I have 24 months of consumption by material and order book coverage for the next 3 months.
> List the analyses I should run to improve material planning accuracy, in order of effort against likely benefit. For each, state what data it needs, what output it produces, and what decision it would change.
> Assume I have Excel, not a planning system.

The output is a work plan you can actually execute — a far more useful answer than a fabricated forecast.`,
          },
          {
            title: "Inventory and slow movers",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Below is our raw material inventory: material code, value band, months of cover, last movement date.
> Group items into: active, slow-moving, at risk of obsolescence. Explain the rule you used for each group.
> For the obsolescence group, list the questions I should answer before writing anything off.

Asking it to state its own grouping rule is the important part. A grouping you cannot explain to the finance manager is a grouping you cannot act on.`,
          },
        ],
      },
      {
        title: "3. Risk and communication",
        lessons: [
          {
            title: "Supplier risk assessment",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Here is what we know about a supplier: [country, years of relationship, share of our spend, delivery performance last 12 months, audit findings, single or dual source].
> Assess the risk across: delivery reliability, quality, financial exposure, concentration, and geography.
> Rate each low / medium / high with a one-line justification tied to the evidence I gave.
> Say explicitly where you have insufficient information to rate.

Concentration risk is the one people miss: a supplier can be excellent and still be a serious risk if they are 40% of your spend and single-sourced.`,
          },
          {
            title: "Vendor communication",
            type: "TEXT",
            durationMinutes: 15,
            content: `> Draft an email to a supplier who has missed the agreed delivery date twice in three months.
> Tone: firm, professional, relationship-preserving — we intend to keep working with them.
> Cover: the specific misses, the impact on our production, what we need committed in writing, and the date we need a response.
> Under 200 words. No threats, no apology for raising it.

"No apology for raising it" is a genuinely useful instruction. Left alone, AI writes escalation emails that undercut themselves in the first sentence.`,
          },
        ],
      },
      capstone("Choose a real supply chain task: an RFQ comparison, a supplier risk review, an inventory analysis or a vendor negotiation."),
      quiz("AI for Supply Chain assessment"),
    ],
  },

  // -------------------------------------------------------- SALES / MARKETING
  {
    seed: base(
      "INT-ROLE-COM",
      "ai-for-sales-and-marketing",
      "AI for Sales & Marketing",
      "Using AI for market research, competitor analysis, proposals, client communication, presentations and content — with a hard rule about verifying every claim.",
      [
        "Run structured market and competitor research you then verify",
        "Draft proposals and client communication faster",
        "Turn a specification into a client-facing summary",
        "Build presentations that lead with the conclusion",
        "Analyse customer feedback into actionable themes",
      ],
      ["COM"],
      "SALES_MARKETING",
      [
        { goalKey: "WRITING", weight: 3 },
        { goalKey: "RESEARCH", weight: 3 },
        { goalKey: "PRESENTATIONS", weight: 2 },
        { goalKey: "EMAIL", weight: 2 },
      ],
    ),
    modules: [
      {
        title: "1. Research you can defend",
        lessons: [
          {
            title: "Market research with guardrails",
            type: "TEXT",
            durationMinutes: 20,
            content: `Research is where hallucinations do the most commercial damage, because an invented market figure in a client proposal is very hard to walk back.

> I sell garment manufacturing services to European retail brands. Give me a structured overview of what these buyers typically prioritise when selecting a manufacturer.
> For each point, state whether it is (a) a widely documented industry pattern, or (b) your inference.
> Do not give me market size figures, growth rates or company-specific claims unless you can name the source — if you cannot, say "requires verification".

Then verify everything in category (b). Use AI to *structure the research question*, and named sources to answer it.`,
          },
          {
            title: "Competitor analysis",
            type: "TEXT",
            durationMinutes: 20,
            content: `> I am preparing a competitive positioning summary for our sales team.
> Based only on the public information I paste below about three competitors, build a comparison across: stated capabilities, certifications, target segments, and stated lead times.
> Note where information is missing for a competitor rather than filling the gap.
> Finish with three questions our sales team should be prepared to answer when a buyer compares us to them.

Paste in the material you gathered. Do not ask the model what it "knows" about a named competitor — that is where invented claims come from.`,
          },
        ],
      },
      {
        title: "2. Proposals and clients",
        lessons: [
          {
            title: "Proposal drafting",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Draft a proposal response for a European retail buyer requesting a manufacturing partner for a 40,000-piece knitwear programme.
> Structure: understanding of their requirement, our proposed approach, quality and compliance, timeline, and next steps.
> Tone: confident, specific, no superlatives. Around 700 words.
> Leave clearly marked placeholders — [CAPACITY], [LEAD TIME], [CERTIFICATIONS] — everywhere a factual claim about T&C is needed. Do not invent any capability.

The placeholder instruction is the whole trick. Without it, the draft will confidently claim certifications we may not hold.`,
          },
          {
            title: "Client communication",
            type: "TEXT",
            durationMinutes: 20,
            content: `Two common situations:

**Bad news, handled well**

> Draft an email telling a client that a shipment will be five days late due to a fabric delay. Lead with the fact and the new date, then the cause in one sentence, then what we are doing, then what we need from them. Under 150 words. No excessive apology.

**Technical to plain**

> Turn the technical specification below into a one-page summary a buyer's merchandising team will understand. Keep every technical figure exactly as written; explain what each means in practice.

Both are structuring tasks, which is where AI is reliable — and neither requires it to know anything about our business.`,
          },
        ],
      },
      {
        title: "3. Presenting and listening",
        lessons: [
          {
            title: "Presentations that land",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Turn the notes below into a 10-slide client presentation outline.
> Each slide: a headline that states the conclusion, three supporting bullets, and a one-line note on what the presenter should say beyond the slide.
> Slide 1 must state what we want the client to decide by the end.
> No slide may be titled "Introduction", "Overview" or "Thank you".

Banning the filler slides forces every slide to earn its place.`,
          },
          {
            title: "Customer feedback analysis",
            type: "TEXT",
            durationMinutes: 15,
            content: `> Below are 60 pieces of customer feedback from the last quarter, with client names removed.
> Group into themes. For each: theme name, count, whether it concerns product, service, communication or commercial terms, and two verbatim quotes.
> Separately list anything that reads like a risk of losing an account.
> Do not soften negative feedback.

That last line matters. Left to itself, AI rounds off criticism until it stops being useful.`,
          },
        ],
      },
      capstone("Choose a real commercial task: a proposal, a competitive summary, a client presentation or a feedback analysis."),
      quiz("AI for Sales & Marketing assessment"),
    ],
  },

  // --------------------------------------------------------------- MANAGEMENT
  {
    seed: base(
      "INT-ROLE-MGT",
      "ai-for-management",
      "AI for Management",
      "Using AI for executive research, decision support, scenario analysis, meeting intelligence and executive communication — plus how to govern AI use in your own function.",
      [
        "Use AI as a decision-support tool without outsourcing the decision",
        "Run structured scenario and options analysis",
        "Turn long reports into executive briefs you can trust",
        "Delegate AI work to your team with the right guardrails",
        "Understand your governance responsibilities for AI use",
      ],
      ["MGT"],
      "MANAGEMENT",
      [
        { goalKey: "DECISION_MAKING", weight: 3 },
        { goalKey: "RESEARCH", weight: 2 },
        { goalKey: "REPORTS", weight: 2 },
        { goalKey: "PRESENTATIONS", weight: 1 },
      ],
      { level: "L2", estimatedHours: 7 },
    ),
    modules: [
      {
        title: "1. Decision support, not decision making",
        lessons: [
          {
            title: "What AI is for at your level",
            type: "TEXT",
            durationMinutes: 20,
            content: `Senior managers usually do not need AI to write. They need it to **compress and challenge**.

**Compress** — turn a 40-page report into the six things that need a decision. Turn twelve weekly reports into what changed.

**Challenge** — argue the opposite case, list what would have to be true for this plan to fail, name the assumption doing the most work.

> I am considering [decision]. Here is my reasoning: [reasoning].
> Argue the strongest case against it. Then list the three assumptions my reasoning depends on most heavily, and what evidence would test each.
> Do not be balanced. I have already made the case for.

That prompt is worth more than any summarisation trick, and it costs two minutes.`,
          },
          {
            title: "Executive briefs from long documents",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Below is a 30-page consultant report.
> Produce a one-page brief: the three findings that would change a decision, what each is based on, and what the report recommends.
> Separately list: claims presented without supporting evidence, and anything the report explicitly says it did not examine.
> Quote page numbers throughout.

The second list is the one to read first. It tells you where the report is weakest, which is exactly what a busy reader misses.`,
          },
        ],
      },
      {
        title: "2. Scenarios and meetings",
        lessons: [
          {
            title: "Scenario and options analysis",
            type: "TEXT",
            durationMinutes: 20,
            content: `> We are evaluating three options for expanding capacity: [A, B, C], with the constraints below.
> For each, structure: what we are betting on, what has to go right, the earliest signal it is going wrong, what it costs to reverse, and who it affects internally.
> Do not recommend one. Do not introduce financial figures I have not given you.
> Finish with the single question that most separates these options.

Withholding the recommendation is deliberate. The value is in the structure — the decision stays where accountability sits.`,
          },
          {
            title: "Meeting intelligence",
            type: "TEXT",
            durationMinutes: 20,
            content: `> Below are the minutes of our last four management meetings.
> Produce: (1) open actions with owner and age, (2) anything raised more than once and still unresolved, (3) decisions taken without a recorded owner.
> Sort by how long each has been open.

Recurring unresolved items are the most reliable management signal there is, and they are invisible in any single set of minutes.

**Before pasting:** remove anything about individuals — performance, salaries, disciplinary matters.`,
          },
        ],
      },
      {
        title: "3. Leading AI use in your function",
        lessons: [
          {
            title: "Delegating AI work",
            type: "TEXT",
            durationMinutes: 20,
            content: `When you ask someone to "use AI for this", be explicit about four things:

1. **What data may be used** — and what absolutely may not
2. **What verification you expect** — which figures must be checked against source
3. **What you want to see** — the output, and the prompt that produced it
4. **What decision it feeds** — so they can judge how much accuracy matters

Asking to see the prompt is the highest-leverage habit here. It shows you how the analysis was framed, it spreads good prompts through the team, and it makes quality visible.`,
          },
          {
            title: "Governance and risk",
            type: "TEXT",
            durationMinutes: 15,
            content: `As a manager you are accountable for AI use in your function. Practically:

- **Know which tools your team uses.** Ask. Shadow AI use is common and usually well-intentioned.
- **Make the data rules concrete for your function** — name the specific files and systems that must never be pasted.
- **Require disclosure** on anything AI materially shaped that reaches a customer, the board or an auditor.
- **No automated decisions about people.** Not screening, not ranking, not performance.
- **Support early reporting.** If someone tells you they pasted the wrong thing, the response that keeps T&C safe is "thank you, let's call IT now."

None of this requires technical knowledge. It requires asking four questions regularly.`,
          },
        ],
      },
      capstone("Choose a real management task: a decision brief, an options analysis, a board summary or a governance review for your function."),
      quiz("AI for Management assessment"),
    ],
  },

  // ----------------------------------------------------------------------- IT
  {
    seed: base(
      "INT-ROLE-IT",
      "ai-for-it",
      "AI for IT",
      "The technical track: coding assistance, documentation, scripting, APIs, retrieval-augmented generation, agents, AI security and where automation genuinely pays off at T&C.",
      [
        "Use AI assistants for coding, debugging and documentation effectively",
        "Call an LLM API and handle its failure modes",
        "Explain RAG and when it is the right architecture",
        "Assess the security risks specific to AI systems",
        "Identify and scope an automation candidate at T&C",
      ],
      ["IT"],
      "IT",
      [
        { goalKey: "PROGRAMMING", weight: 3 },
        { goalKey: "AUTOMATION", weight: 3 },
        { goalKey: "DATA_ANALYSIS", weight: 2 },
      ],
      { level: "L3", isTechnical: true, estimatedHours: 9, difficulty: "ADVANCED", competencies: [{ key: "TECHNICAL", weight: 4 }, { key: "RESPONSIBLE_AI", weight: 2 }, { key: "DATA_AUTOMATION", weight: 2 }] },
    ),
    modules: [
      {
        title: "1. AI in the development workflow",
        lessons: [
          {
            title: "Coding, debugging, documentation",
            type: "TEXT",
            durationMinutes: 25,
            content: `AI assistants are now a normal part of development. The failure modes are specific and worth naming.

**Works well**
- Boilerplate, tests, and code in a language you know but use rarely
- Explaining unfamiliar code, including our own legacy scripts
- Generating documentation from code
- First-pass debugging when you paste the actual error and the actual code

**Goes wrong**
- Invented library functions and API methods that do not exist
- Subtly wrong logic in edge cases, wrapped in confident comments
- Security anti-patterns — string-concatenated SQL, secrets in source, missing authorisation checks
- Outdated idioms from older versions of a framework

**Rules for T&C code:** never paste credentials, connection strings or customer data. Review AI-written code as you would review a new joiner's — line by line, especially anything touching auth, money or personal data.`,
          },
          {
            title: "Scripting and internal automation",
            type: "TEXT",
            durationMinutes: 20,
            content: `The highest-value AI work in IT here is not building models. It is removing the small manual jobs nobody has had time to script.

Good candidates: recurring report exports, file transformations between systems, log triage, bulk user administration, data quality checks.

> Write a Python script that reads every .xlsx in a folder, extracts the sheet named "Summary", and writes one consolidated CSV with a source-file column.
> Handle: missing sheets, locked files, and inconsistent column ordering. Log what it skipped and why.
> Do not use pandas — the target machine only has the standard library plus openpyxl.

The constraints at the end are what make it runnable. State the environment or you will get code for a machine you do not have.`,
          },
        ],
      },
      {
        title: "2. Working with LLM APIs",
        lessons: [
          {
            title: "Calling a model from code",
            type: "TEXT",
            durationMinutes: 25,
            content: `Moving from a chat window to an API changes what you must handle yourself.

**Things to get right from the start**

- **Keys in environment variables.** Never in source, never in the client bundle.
- **Timeouts and retries.** Providers rate-limit; handle 429 with backoff.
- **Token budgets.** Long documents must be chunked; cost scales with tokens.
- **Structured output.** Ask for JSON and *validate it* — the model will occasionally return prose.
- **Non-determinism.** The same prompt can return different text. Anything downstream must tolerate that.
- **Failure path.** Decide what your feature does when the provider is down. It will be.

This platform's own AI layer (\`src/lib/ai/provider.ts\`) is a compact example: one function, three wire formats, keys from the environment, a hard timeout, and every caller handling the disabled case.`,
          },
          {
            title: "RAG: retrieval-augmented generation",
            type: "TEXT",
            durationMinutes: 25,
            content: `A model cannot know anything about T&C. RAG is how you fix that without training anything.

**The shape**
1. Split your documents into chunks.
2. Convert each chunk into an embedding — a vector capturing meaning.
3. Store the vectors.
4. At question time, embed the question, retrieve the closest chunks, and pass them to the model as context.
5. The model answers *from the supplied text* and cites which chunk it used.

**When RAG is right:** a stable body of internal documents people repeatedly ask questions about — policies, SOPs, technical specifications, supplier terms.

**When it is not:** questions needing calculation over structured data (query the database), or where any wrong answer is unacceptable (build a lookup, not a chatbot).

**The part teams underestimate:** chunking and retrieval quality decide whether it works. If retrieval returns the wrong three paragraphs, no model can rescue the answer.`,
          },
        ],
      },
      {
        title: "3. Agents, security and evaluation",
        lessons: [
          {
            title: "Agents and automation",
            type: "TEXT",
            durationMinutes: 20,
            content: `An "agent" is a model given tools and allowed to decide which to call in a loop.

**Realistic today:** narrow, well-defined loops with a small tool set and a human confirming anything consequential — ticket triage and routing, drafting a reply for approval, gathering data from three systems into a summary.

**Not realistic today:** long autonomous chains touching production systems without supervision. Error compounds at every step, and there is no natural place for a person to notice.

**Design rules if you build one at T&C:**
- Every tool that writes needs a confirmation step
- Hard limits on iterations and cost
- Log every tool call — you will need it to debug and to explain
- Read-only by default; writes are an exception you justify`,
          },
          {
            title: "AI security",
            type: "TEXT",
            durationMinutes: 25,
            content: `AI systems have failure modes ordinary applications do not.

**Prompt injection.** If your system feeds untrusted content — an email, a web page, an uploaded document — into a model, that content can carry instructions the model follows. Treat every retrieved document as untrusted input, never as instructions. Never give a model that reads untrusted content the ability to act without confirmation.

**Data leakage.** Anything in the context window can appear in an answer. If you retrieve across departments, you can surface HR data to a production user. Filter by permission *before* retrieval, not after.

**Excessive agency.** The most common serious design flaw: giving a model write access "to be helpful". Read-only by default.

**Insecure output handling.** Model output rendered as HTML is an XSS vector; used in a query it is an injection vector. Escape and validate exactly as you would user input.

**Supply chain.** Third-party AI plugins and models are dependencies. They get the same review as any other.`,
          },
          {
            title: "Evaluating whether it actually works",
            type: "TEXT",
            durationMinutes: 20,
            content: `"It looked good in the demo" is not evaluation. Before anything reaches users:

1. **Build a test set.** 30-50 real questions with known-good answers. Written by the people who will use it.
2. **Define failure.** Wrong answer, refusal, hallucinated citation, unsafe output — count them separately.
3. **Baseline first.** Measure the current manual process. Without it you cannot claim an improvement.
4. **Re-run after every change.** Prompt edits, model upgrades and retrieval tweaks all change behaviour, often invisibly.
5. **Watch it in production.** Log inputs and outputs (respecting privacy) and sample them weekly.

The test set is the deliverable people skip and then regret. Build it before the feature.`,
          },
        ],
      },
      capstone("Choose a real IT task: an automation script, a RAG prototype scope, an AI security review or an evaluation harness for an existing AI feature."),
      quiz("AI for IT assessment"),
    ],
  },
];

export async function seedRoleCourses(prisma: Db) {
  for (const rc of ROLE_COURSES) {
    await upsertInternalCourse(prisma, rc.seed, rc.modules);
  }
}
