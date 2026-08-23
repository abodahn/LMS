import type { Db } from "./client";

// ---------------------------------------------------------------------------
// Prompt library — centrally approved templates
// ---------------------------------------------------------------------------

const PROMPTS: {
  key: string;
  title: string;
  titleAr?: string;
  titleTr?: string;
  body: string;
  description: string;
  department?: string;
  taskCategory: string;
  difficulty: string;
  tool: string;
  tags: string[];
}[] = [
  {
    key: "PR-EMAIL-PRO",
    title: "Write a professional email",
    titleAr: "كتابة بريد إلكتروني احترافي",
    titleTr: "Profesyonel e-posta yaz",
    description: "A reliable everyday template for internal or external email.",
    taskCategory: "COMMUNICATION",
    difficulty: "EASY",
    tool: "ANY",
    tags: ["email", "writing"],
    body: `I need to write an email to [RECIPIENT AND THEIR ROLE].

Purpose: [WHAT YOU WANT TO HAPPEN]
Key points to include: [BULLETS]
Relationship / tone: [e.g. supplier we want to keep, internal colleague, new customer]

Write it in under [150] words. Lead with the point, not the pleasantries. No excessive apology. End with one clear ask and a date.

If any key information is missing for this email to make sense, list it instead of inventing it.`,
  },
  {
    key: "PR-SUMMARISE-REPORT",
    title: "Summarise a long report",
    titleAr: "تلخيص تقرير طويل",
    titleTr: "Uzun bir raporu özetle",
    description: "Turns a long document into a decision-ready brief with traceable references.",
    taskCategory: "ANALYSIS",
    difficulty: "EASY",
    tool: "ANY",
    tags: ["summary", "documents"],
    body: `Below is a [LENGTH]-page [TYPE OF DOCUMENT].

Produce a one-page brief for [AUDIENCE] covering:
1. The findings that would change a decision
2. What each is based on
3. What the document recommends
4. Anything stated without supporting evidence
5. Anything the document explicitly does not cover

Quote the page or section number for every point. Maximum [400] words. Plain English.
Mark clearly anything you are inferring rather than quoting.`,
  },
  {
    key: "PR-EXCEL-FORMULA",
    title: "Get the right Excel formula",
    titleAr: "الحصول على معادلة Excel الصحيحة",
    titleTr: "Doğru Excel formülünü al",
    description: "Ask for the formula, not the answer — the calculation stays in Excel where it is reliable.",
    department: "FIN",
    taskCategory: "ANALYSIS",
    difficulty: "EASY",
    tool: "EXCEL",
    tags: ["excel", "formula"],
    body: `I have a spreadsheet where:
- Column [A] contains [WHAT]
- Column [B] contains [WHAT]
- Column [C] contains [WHAT]

I need a formula in column [D] that [WHAT IT SHOULD RETURN].

Handle these cases: [e.g. blank cells, division by zero, text where a number is expected].
Give me the formula, a one-line explanation of how it works, and how to test it on three rows.
Do not calculate the result for me — I will run it on the real data.`,
  },
  {
    key: "PR-VARIANCE",
    title: "Explain a variance to management",
    titleTr: "Yönetime bir sapmayı açıkla",
    description: "Turns a correct variance table into commentary a non-financial manager will read.",
    department: "FIN",
    taskCategory: "REPORTING",
    difficulty: "MEDIUM",
    tool: "ANY",
    tags: ["finance", "reporting"],
    body: `I am a finance analyst at a garment manufacturer. Below is a summarised monthly variance table by cost centre: actual, budget and percentage variance.

Write commentary for [AUDIENCE]. For each variance above [5]%, give:
- one sentence on likely drivers, based only on what this data shows
- one question they should ask the cost centre owner

Maximum [300] words. Plain English, no finance jargon. Group by cost centre.
Do not speculate beyond the data. Where a driver is unclear, say so explicitly.
Do not introduce any figure I have not provided.`,
  },
  {
    key: "PR-COMPARE-VENDORS",
    title: "Compare supplier quotations",
    titleAr: "مقارنة عروض الموردين",
    titleTr: "Tedarikçi tekliflerini karşılaştır",
    description: "You set the criteria; the AI applies them consistently and reports what is missing.",
    department: "SCM",
    taskCategory: "ANALYSIS",
    difficulty: "MEDIUM",
    tool: "ANY",
    tags: ["procurement", "comparison"],
    body: `I am comparing [3] supplier quotations for [COMMODITY]. Supplier names have been removed — they are A, B and C.

Build a comparison table using exactly these criteria:
- unit price basis
- minimum order quantity
- lead time
- payment terms
- quality guarantees
- penalty / remedy clauses
- what the quotation does not state

Then give a short risk note for each supplier and a recommendation with reasoning.
Do not weight the criteria yourself — where there is a trade-off, present it and let me decide.
Do not assume a market standard applies where a document is silent.`,
  },
  {
    key: "PR-MEETING-MINUTES",
    title: "Create meeting minutes",
    titleAr: "إعداد محضر اجتماع",
    titleTr: "Toplantı tutanağı oluştur",
    description: "Rough notes to structured minutes with owners and dates.",
    taskCategory: "REPORTING",
    difficulty: "EASY",
    tool: "ANY",
    tags: ["meetings", "minutes"],
    body: `Below are my rough notes from a [TYPE] meeting on [DATE] with [ATTENDEES].

Produce minutes with:
1. Decisions taken — one line each
2. Actions — what, who owns it, by when
3. Open items with no owner (list these separately)
4. Anything discussed but explicitly deferred

Use only what is in my notes. Where an owner or date is missing, write "not recorded" rather than guessing.
Keep it under [300] words.`,
  },
  {
    key: "PR-JOB-DESCRIPTION",
    title: "Draft a job description",
    titleTr: "İş tanımı taslağı hazırla",
    description: "A neutral, structured first draft you then check against the real role.",
    department: "HR",
    taskCategory: "HR",
    difficulty: "EASY",
    tool: "ANY",
    tags: ["hr", "recruitment"],
    body: `Draft a job description for a [ROLE] at a garment manufacturer with around [800] employees, [EXPORT-FOCUSED].

Include: purpose, 6-8 responsibilities, essential requirements, desirable requirements, and reporting line to [MANAGER ROLE].

Neutral, factual tone. No marketing language. No gendered wording. No requirements about age, nationality or marital status.
Flag any responsibility you inferred rather than something typical of this role, so I can confirm it.`,
  },
  {
    key: "PR-PRODUCTION-ISSUE",
    title: "Investigate a production issue",
    titleAr: "تحليل مشكلة إنتاجية",
    titleTr: "Bir üretim sorununu incele",
    description: "Turns AI into an interviewer for a structured 5-Why, instead of a guesser.",
    department: "PRD",
    taskCategory: "ANALYSIS",
    difficulty: "MEDIUM",
    tool: "ANY",
    tags: ["production", "root-cause"],
    body: `We had [DESCRIBE THE EVENT: what happened, when, how long, what was the stated cause].

Facilitate a 5-Why analysis with me. Ask me ONE question at a time and wait for my answer before asking the next.

At the end, summarise:
- the chain of causes
- the immediate cause versus the systemic one
- one containment action and one preventive action

Do not propose a root cause before the questions are finished.`,
  },
  {
    key: "PR-TRANSLATE-DOC",
    title: "Translate a corporate document",
    titleAr: "ترجمة مستند مؤسسي",
    titleTr: "Kurumsal bir belgeyi çevir",
    description: "Translation that preserves meaning and flags terms that need a human decision.",
    taskCategory: "COMMUNICATION",
    difficulty: "EASY",
    tool: "ANY",
    tags: ["translation", "communication"],
    body: `Translate the text below from [SOURCE LANGUAGE] into [TARGET LANGUAGE].

Requirements:
- Keep the meaning exact. Do not improve, shorten or soften anything.
- Keep all numbers, dates, units and product codes exactly as written.
- Use formal workplace register.
- List separately any term where the translation is ambiguous or where a company-specific term should be confirmed by a person.

Do not translate anything in [square brackets] — those are placeholders.`,
  },
  {
    key: "PR-DEFECT-CLASSIFY",
    title: "Classify free-text defect descriptions",
    titleTr: "Serbest metin hata açıklamalarını sınıflandır",
    description: "Makes inconsistent inspector notes analysable, with a confidence flag for review.",
    department: "QLT",
    taskCategory: "ANALYSIS",
    difficulty: "MEDIUM",
    tool: "ANY",
    tags: ["quality", "classification"],
    body: `Below are free-text defect descriptions written by different inspectors.

Map each one to a category from this list ONLY: [YOUR DEFECT CATEGORIES].

Return a table: original text | assigned category | confidence (high / medium / low).

Where a description does not fit any category, or is too vague to classify, mark it "unclassified".
Do not force a fit and do not invent new categories.`,
  },
  {
    key: "PR-EXEC-PRESENTATION",
    title: "Turn a document into a presentation",
    titleTr: "Bir belgeyi sunuma dönüştür",
    description: "Slide outlines whose headlines state conclusions, not topics.",
    taskCategory: "REPORTING",
    difficulty: "MEDIUM",
    tool: "ANY",
    tags: ["presentations"],
    body: `Turn the content below into a [10]-slide presentation outline for [AUDIENCE], to be delivered in [15] minutes.

For each slide give:
- a headline that states the conclusion, not the topic
- three supporting bullets
- one line on what the presenter should say beyond the slide

Slide 1 must state what we want the audience to decide by the end.
Do not include slides titled "Introduction", "Overview", "Agenda" or "Thank you".
Do not add any figure that is not in the source material.`,
  },
  {
    key: "PR-CHALLENGE-MY-THINKING",
    title: "Challenge my reasoning",
    titleAr: "اختبر منطقي",
    titleTr: "Muhakememi sorgula",
    description: "The highest-value two-minute prompt for anyone making a decision.",
    department: "MGT",
    taskCategory: "ANALYSIS",
    difficulty: "MEDIUM",
    tool: "ANY",
    tags: ["decision", "management"],
    body: `I am considering [DECISION].

My reasoning is: [YOUR REASONING].

Argue the strongest case AGAINST this. Do not be balanced — I have already made the case for.

Then list:
- the three assumptions my reasoning depends on most heavily
- what evidence would test each one
- the single question that would most change my mind

Do not introduce facts or figures I have not given you.`,
  },
];

// ---------------------------------------------------------------------------
// AI use case library
// ---------------------------------------------------------------------------

const USE_CASES: {
  key: string;
  title: string;
  titleAr?: string;
  department: string;
  problem: string;
  howAiHelps: string;
  workflow: string[];
  examplePrompt: string;
  dataSensitivityWarning: string;
  estimatedTimeSaved: string;
  difficulty: string;
}[] = [
  {
    key: "UC-FIN-VARIANCE",
    title: "Monthly variance analysis",
    titleAr: "تحليل الانحرافات الشهرية",
    department: "FIN",
    problem:
      "Month-end commentary takes half a day and often ends up restating the numbers instead of explaining what management should do about them.",
    howAiHelps:
      "Once the variance table is calculated in Excel, AI turns it into commentary aimed at a non-financial reader, with a question to ask each cost centre owner.",
    workflow: [
      "Calculate variances in Excel as normal",
      "Index or scale the figures and remove customer names",
      "Paste the summarised table with the commentary prompt",
      "Check every figure the output repeats back against your table",
      "Save the prompt as a monthly template",
    ],
    examplePrompt:
      "Below is a summarised monthly variance table by cost centre. Write commentary for the operations director. For each variance above 5%, give one sentence on likely drivers based only on this data, and one question to ask the cost centre owner. Maximum 300 words, plain English. Do not introduce any figure I have not provided.",
    dataSensitivityWarning:
      "Never paste real costings, margins or customer-linked figures into a public tool. Index the numbers first — the commentary is just as good.",
    estimatedTimeSaved: "About 2 hours per month",
    difficulty: "MEDIUM",
  },
  {
    key: "UC-HR-CV-FRAMEWORK",
    title: "CV screening assistant (framework only)",
    department: "HR",
    problem:
      "Different interviewers assess the same candidate against different unwritten criteria, so hiring decisions are inconsistent and hard to defend.",
    howAiHelps:
      "AI drafts a structured evaluation framework with clear definitions of weak, adequate and strong. A person then applies it to real CVs inside our own systems.",
    workflow: [
      "Describe the role and its real requirements",
      "Ask for 6 criteria with definitions and rating anchors",
      "Review and adjust the framework with the hiring manager",
      "Apply it yourself to every candidate, consistently",
      "Keep the completed frameworks as the hiring record",
    ],
    examplePrompt:
      "I am hiring a Production Planner for a garment manufacturer. Draft a structured evaluation framework with 6 criteria, each with a clear definition and what a weak / adequate / strong answer looks like. The framework must apply to any candidate and must not reference age, gender, nationality, marital status or photographs.",
    dataSensitivityWarning:
      "Never paste a CV, application or candidate detail into a public AI tool. AI never ranks, scores or screens out a person at T&C — it only helps design the process.",
    estimatedTimeSaved: "About 3 hours per vacancy, plus far more consistent decisions",
    difficulty: "MEDIUM",
  },
  {
    key: "UC-PRD-DOWNTIME",
    title: "Production loss investigation",
    titleAr: "تحليل خسائر الإنتاج",
    department: "PRD",
    problem:
      "Shift handover notes contain everything needed to find repeat downtime causes, but nobody has time to read a week of them together.",
    howAiHelps:
      "AI converts inconsistent free-text notes into a structured downtime table, ranks causes by total minutes, and flags every event where the cause was never recorded.",
    workflow: [
      "Collect a week of handover notes into one text file",
      "Remove any employee names",
      "Ask for a downtime table plus the top causes by total minutes",
      "Ask specifically for events where the cause is missing or unclear",
      "Take the missing-cause list to the next production meeting",
    ],
    examplePrompt:
      "Below are seven days of shift handover notes from a sewing line. Produce: (1) a table of downtime events with duration and stated cause, (2) the three most frequent causes by total minutes, (3) any event where the cause is unclear or missing. Use only what is written — do not infer a cause that is not stated.",
    dataSensitivityWarning:
      "Remove operator and supervisor names before pasting. Downtime data linked to a specific customer order is commercially sensitive.",
    estimatedTimeSaved: "About 3 hours per week",
    difficulty: "EASY",
  },
  {
    key: "UC-QLT-ROOT-CAUSE",
    title: "Defect root cause analysis",
    department: "QLT",
    problem:
      "Root cause sessions drift towards the first plausible explanation, and the written CAPA often names a cause before the investigation has happened.",
    howAiHelps:
      "AI facilitates a disciplined 5-Why — one question at a time — and then drafts a CAPA that deliberately leaves the root cause section as a method until the work is done.",
    workflow: [
      "Describe the finding factually, with the numbers you have",
      "Ask AI to facilitate a 5-Why, one question at a time",
      "Answer from evidence, not assumption",
      "Ask for a CAPA draft with the root cause section left as a method",
      "Complete the investigation, then fill it in",
    ],
    examplePrompt:
      "Facilitate a 5-Why analysis with me for this finding: repeated needle damage on knit fabric in the sewing section, 2.4% of inspected pieces over three weeks. Ask one question at a time and wait for my answer. At the end summarise the chain, separate the immediate cause from the systemic one, and propose one containment and one preventive action.",
    dataSensitivityWarning:
      "Defect rates tied to a named customer are commercially sensitive. Describe the product generically.",
    estimatedTimeSaved: "About 90 minutes per investigation, and better-structured CAPAs",
    difficulty: "MEDIUM",
  },
  {
    key: "UC-SCM-RFQ",
    title: "RFQ comparison",
    titleAr: "مقارنة عروض الأسعار",
    department: "SCM",
    problem:
      "Comparing three quotations with different structures takes an afternoon, and the gaps — the terms nobody stated — are what cost money later.",
    howAiHelps:
      "AI applies criteria you define consistently across all quotations and, crucially, lists what each one fails to state.",
    workflow: [
      "Anonymise the quotations to A, B and C and remove pricing you would not share",
      "Define your comparison criteria explicitly",
      "Ask for the comparison table plus a 'not stated' column",
      "Ask it to draft one clarification question per gap",
      "Send the clarifications; decide the trade-offs yourself",
    ],
    examplePrompt:
      "I am comparing three supplier quotations for knit fabric. Build a comparison table using these criteria: unit price basis, MOQ, lead time, payment terms, quality guarantees, penalty clauses, and what each quotation does not state. Then give a short risk note per supplier. Do not weight the criteria yourself — present trade-offs and let me decide.",
    dataSensitivityWarning:
      "Remove supplier names and any pricing you would not want outside T&C. The analysis works just as well on Supplier A / B / C.",
    estimatedTimeSaved: "About 2 hours per RFQ",
    difficulty: "MEDIUM",
  },
  {
    key: "UC-IT-TICKETS",
    title: "Ticket classification and triage",
    department: "IT",
    problem:
      "Support tickets arrive as free text and get manually sorted, so triage is slow and inconsistent between people.",
    howAiHelps:
      "AI classifies tickets into your existing categories with a confidence flag, routes the confident ones and escalates the rest to a person.",
    workflow: [
      "Define your category list and routing rules",
      "Classify with a required confidence flag",
      "Auto-route only high-confidence tickets",
      "Send everything else to a human queue",
      "Sample the auto-routed ones weekly to check for drift",
    ],
    examplePrompt:
      "Classify this support ticket into exactly one of these categories: [list]. Return JSON: {category, confidence: high|medium|low, reason}. If it does not fit any category, return category: 'unclassified'. Do not invent new categories.",
    dataSensitivityWarning:
      "Tickets often contain employee names, machine identifiers and sometimes credentials. Redact before any external call, and never log raw ticket text with personal data.",
    estimatedTimeSaved: "About 5 hours per week across the team",
    difficulty: "ADVANCED",
  },
  {
    key: "UC-COM-PROPOSAL",
    title: "Client proposal first draft",
    department: "COM",
    problem:
      "Proposals take a day to draft and the first version is mostly structure — the part that is easiest to standardise.",
    howAiHelps:
      "AI produces a complete structured draft with explicit placeholders everywhere a factual claim about T&C is needed, so nothing gets invented.",
    workflow: [
      "Summarise the client requirement in your own words",
      "Ask for the draft with bracketed placeholders for every T&C fact",
      "Fill the placeholders from verified internal sources",
      "Have the commercial manager review before sending",
      "Save the prompt as a proposal template",
    ],
    examplePrompt:
      "Draft a proposal response for a European retail buyer requesting a manufacturing partner for a 40,000-piece knitwear programme. Structure: understanding of requirement, proposed approach, quality and compliance, timeline, next steps. Around 700 words, confident and specific, no superlatives. Leave clearly marked placeholders — [CAPACITY], [LEAD TIME], [CERTIFICATIONS] — wherever a factual claim about us is needed. Do not invent any capability.",
    dataSensitivityWarning:
      "Never paste existing client contracts, pricing or order volumes. Describe the requirement generically.",
    estimatedTimeSaved: "About 4 hours per proposal",
    difficulty: "MEDIUM",
  },
  {
    key: "UC-MGT-BOARD-BRIEF",
    title: "Board brief from a long report",
    department: "MGT",
    problem:
      "Long consultant and audit reports arrive before board meetings and nobody has time to read them properly, so weak evidence goes unchallenged.",
    howAiHelps:
      "AI compresses to the decisions and — more usefully — lists claims made without evidence and what the report explicitly did not examine.",
    workflow: [
      "Paste or attach the report",
      "Ask for findings that would change a decision, with page references",
      "Ask separately for unsupported claims and stated exclusions",
      "Read the pages it cites for anything you will rely on",
      "Bring the 'not examined' list to the meeting",
    ],
    examplePrompt:
      "Below is a 30-page consultant report. Produce a one-page brief: the three findings that would change a decision, what each is based on, and what the report recommends. Separately list claims presented without supporting evidence, and anything the report says it did not examine. Quote page numbers throughout.",
    dataSensitivityWarning:
      "Reports often contain unpublished financials and named individuals. Use an approved tool, or remove those sections first.",
    estimatedTimeSaved: "About 90 minutes per report",
    difficulty: "MEDIUM",
  },
  {
    key: "UC-WHS-STOCK",
    title: "Slow-moving stock review",
    department: "WHS",
    problem:
      "Obsolescence is only noticed at stock-take, by which time the write-off is already unavoidable.",
    howAiHelps:
      "AI groups inventory into active, slow-moving and at-risk using a rule it must state explicitly, so finance can agree the rule before anything is written off.",
    workflow: [
      "Export material code, value band, months of cover and last movement date",
      "Ask for grouping with the rule stated explicitly",
      "Agree the rule with finance",
      "Ask for the questions to answer before any write-off",
      "Re-run monthly with the same prompt",
    ],
    examplePrompt:
      "Below is our raw material inventory: material code, value band, months of cover, last movement date. Group items into active, slow-moving, and at risk of obsolescence. State explicitly the rule you used for each group. For the obsolescence group, list the questions I should answer before writing anything off.",
    dataSensitivityWarning:
      "Use value bands rather than exact values, and material codes rather than customer-identifying descriptions.",
    estimatedTimeSaved: "About 3 hours per month",
    difficulty: "EASY",
  },
];

// ---------------------------------------------------------------------------
// Capstone assignments
// ---------------------------------------------------------------------------

const CAPSTONES: { key: string; title: string; jobFamily: string | null; courseCode?: string; instructions: string }[] = [
  {
    key: "CAP-GENERAL",
    title: "Workplace AI Challenge",
    jobFamily: null,
    instructions:
      "Choose one real task from your own job and show how you would apply AI to it. This is not an essay — it is a practical proposal your manager could act on. Ground every figure in something you actually measured, and mark estimates clearly as estimates.",
  },
  {
    key: "CAP-FINANCE",
    title: "Finance AI Challenge",
    jobFamily: "FINANCE",
    courseCode: "INT-ROLE-FIN",
    instructions:
      "Analyse a sample financial workbook and produce an executive management brief with AI support. Show the prompt you used, the output, what you corrected, and how you verified every figure.",
  },
  {
    key: "CAP-HR",
    title: "HR AI Challenge",
    jobFamily: "HR",
    courseCode: "INT-ROLE-HR",
    instructions:
      "Design an AI-supported HR process improvement — a recruitment framework, policy summary, onboarding pack or survey analysis. State explicitly how personal data is protected and where the human decision sits.",
  },
  {
    key: "CAP-PRODUCTION",
    title: "Production AI Challenge",
    jobFamily: "PRODUCTION",
    courseCode: "INT-ROLE-PRD",
    instructions:
      "Take a real production problem — downtime, efficiency, an SOP gap or a recurring issue — and show an AI-supported approach with the prompt, the output and your verification.",
  },
  {
    key: "CAP-QUALITY",
    title: "Quality AI Challenge",
    jobFamily: "QUALITY",
    courseCode: "INT-ROLE-QLT",
    instructions:
      "Apply AI to a real quality task: defect classification, a CAPA, a trend analysis or an audit summary. Show how traceability to source records is maintained.",
  },
  {
    key: "CAP-SUPPLY",
    title: "Supply Chain AI Challenge",
    jobFamily: "SUPPLY_CHAIN",
    courseCode: "INT-ROLE-SCM",
    instructions:
      "Apply AI to a real supply chain task: an RFQ comparison, supplier risk review, inventory analysis or vendor negotiation. Show how commercially sensitive data was protected.",
  },
  {
    key: "CAP-COMMERCIAL",
    title: "Commercial AI Challenge",
    jobFamily: "SALES_MARKETING",
    courseCode: "INT-ROLE-COM",
    instructions:
      "Apply AI to a real commercial task: a proposal, competitive summary, client presentation or feedback analysis. Show how every factual claim about T&C was verified.",
  },
  {
    key: "CAP-MANAGEMENT",
    title: "Management AI Challenge",
    jobFamily: "MANAGEMENT",
    courseCode: "INT-ROLE-MGT",
    instructions:
      "Apply AI to a real management task: a decision brief, options analysis, board summary, or an AI governance review for your own function.",
  },
  {
    key: "CAP-IT",
    title: "Technical AI Challenge",
    jobFamily: "IT",
    courseCode: "INT-ROLE-IT",
    instructions:
      "Deliver a real technical piece: an automation script, a scoped RAG prototype, an AI security review, or an evaluation harness for an existing AI feature. Include how you would measure whether it works.",
  },
];

export async function seedContent(prisma: Db) {
  for (const p of PROMPTS) {
    const dept = p.department ? await prisma.department.findUnique({ where: { code: p.department } }) : null;
    const data = {
      title: p.title,
      titleAr: p.titleAr ?? null,
      titleTr: p.titleTr ?? null,
      body: p.body,
      description: p.description,
      departmentId: dept?.id ?? null,
      taskCategory: p.taskCategory,
      difficulty: p.difficulty,
      tool: p.tool,
      tags: JSON.stringify(p.tags),
      isApproved: true,
    };
    await prisma.promptTemplate.upsert({ where: { key: p.key }, update: data, create: { key: p.key, ...data } });
  }

  for (const u of USE_CASES) {
    const dept = await prisma.department.findUnique({ where: { code: u.department } });
    const data = {
      title: u.title,
      titleAr: u.titleAr ?? null,
      departmentId: dept?.id ?? null,
      problem: u.problem,
      howAiHelps: u.howAiHelps,
      workflow: JSON.stringify(u.workflow),
      examplePrompt: u.examplePrompt,
      dataSensitivityWarning: u.dataSensitivityWarning,
      estimatedTimeSaved: u.estimatedTimeSaved,
      difficulty: u.difficulty,
      status: "PUBLISHED",
    };
    await prisma.aiUseCase.upsert({ where: { key: u.key }, update: data, create: { key: u.key, ...data } });
  }

  const rubric = await prisma.rubric.findUnique({ where: { key: "CAPSTONE" } });
  for (const c of CAPSTONES) {
    const course = c.courseCode ? await prisma.course.findUnique({ where: { code: c.courseCode } }) : null;
    const data = {
      title: c.title,
      instructions: c.instructions,
      type: "CAPSTONE",
      rubricId: rubric?.id ?? null,
      maxScore: 100,
      passingScore: 70,
      jobFamily: c.jobFamily,
      courseId: course?.id ?? null,
    };
    await prisma.assignment.upsert({ where: { key: c.key }, update: data, create: { key: c.key, ...data } });
  }
}
