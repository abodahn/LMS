import type { Db } from "./client";
import { upsertCourse, type CourseSeed } from "./courses";
import { titleI18n, withCourseI18n } from "./internal-i18n";
import { lessonContentI18n } from "./lessons-i18n";

export type LessonSeed = {
  title: string;
  type: string;
  durationMinutes: number;
  content?: string;
  url?: string;
  isRequired?: boolean;
};

export type ModuleSeed = { title: string; description?: string; lessons: LessonSeed[] };

export async function upsertInternalCourse(prisma: Db, seed: CourseSeed, modules: ModuleSeed[]) {
  const course = await upsertCourse(prisma, {
    ...withCourseI18n(seed),
    isInternal: true,
    provider: "TC_ACADEMY",
    platform: "T&C AI Academy",
  });

  // Replace the structure wholesale — the admin course builder is the editing
  // surface; the seed only establishes the starting shell.
  await prisma.courseModule.deleteMany({ where: { courseId: course.id } });

  for (const [i, m] of modules.entries()) {
    const courseModule = await prisma.courseModule.create({
      data: { courseId: course.id, title: m.title, ...titleI18n(m.title), description: m.description, order: i },
    });
    for (const [j, l] of m.lessons.entries()) {
      await prisma.courseLesson.create({
        data: {
          moduleId: courseModule.id,
          title: l.title,
          ...titleI18n(l.title),
          ...lessonContentI18n(seed.code, l.title),
          type: l.type,
          content: l.content ?? null,
          url: l.url ?? null,
          durationMinutes: l.durationMinutes,
          isRequired: l.isRequired ?? true,
          order: j,
        },
      });
    }
  }
  return course;
}

// ---------------------------------------------------------------------------
// AI at T&C — the corporate introduction every employee takes
// ---------------------------------------------------------------------------

export const AI_AT_TC: CourseSeed = {
  code: "INT-AI-TC",
  slug: "ai-at-tc",
  title: "AI at T&C",
  titleAr: "الذكاء الاصطناعي في T&C",
  titleTr: "T&C'de Yapay Zekâ",
  description:
    "The T&C introduction to using AI at work: why it matters here, how to use it safely, how to prompt, and how to check what comes back. Written for every role, technical or not.",
  descriptionAr:
    "مقدمة T&C لاستخدام الذكاء الاصطناعي في العمل: لماذا يهمنا، وكيف نستخدمه بأمان، وكيف نكتب الأوامر، وكيف نتحقق من المخرجات.",
  descriptionTr:
    "T&C'nin iş yerinde yapay zekâ kullanımına girişi: neden önemli, nasıl güvenle kullanılır, nasıl prompt yazılır ve çıktı nasıl doğrulanır.",
  outcomes: [
    "Explain in your own words what AI can and cannot do for your job",
    "Use a structured prompt to get a usable answer first time",
    "Identify data you must never put into an AI tool",
    "Check an AI answer before you act on it",
    "Describe two AI use cases from your own department",
  ],
  outcomesAr: [
    "شرح ما يستطيع الذكاء الاصطناعي فعله لعملك وما لا يستطيع، بكلماتك أنت",
    "استخدام أمر منظّم للحصول على إجابة قابلة للاستخدام من المرة الأولى",
    "تحديد البيانات التي يجب ألّا تضعها أبدًا في أداة ذكاء اصطناعي",
    "التحقق من إجابة الذكاء الاصطناعي قبل التصرّف بناءً عليها",
    "وصف حالتَي استخدام للذكاء الاصطناعي من قسمك",
  ],
  outcomesTr: [
    "Yapay zekânın işiniz için ne yapıp ne yapamayacağını kendi cümlelerinizle anlatmak",
    "Yapılandırılmış bir promptla ilk seferde kullanılabilir cevap almak",
    "Bir yapay zekâ aracına asla girmemeniz gereken veriyi belirlemek",
    "Harekete geçmeden önce yapay zekâ cevabını kontrol etmek",
    "Kendi departmanınızdan iki yapay zekâ kullanım alanı anlatmak",
  ],
  provider: "TC_ACADEMY",
  platform: "T&C AI Academy",
  difficulty: "BEGINNER",
  estimatedHours: 5,
  isFree: true,
  certificateAvailable: true,
  level: "L0",
  category: "FOUNDATIONS",
  isInternal: true,
  isMandatory: true,
  isRecommended: true,
  qualityScore: 1,
  competencies: [
    { key: "FUNDAMENTALS", weight: 2 },
    { key: "WORKPLACE", weight: 3 },
    { key: "PROMPTING", weight: 2 },
    { key: "RESPONSIBLE_AI", weight: 2 },
  ],
  jobFamilies: [{ jobFamily: "GENERAL", weight: 2 }],
  goals: [
    { goalKey: "WRITING", weight: 1 },
    { goalKey: "EMAIL", weight: 1 },
    { goalKey: "REPORTS", weight: 1 },
    { goalKey: "DOCUMENT_ANALYSIS", weight: 1 },
  ],
};

export const AI_AT_TC_MODULES: ModuleSeed[] = [
  {
    title: "1. Why AI Matters at T&C",
    description: "What changes for us, and what does not.",
    lessons: [
      {
        title: "What we are actually trying to do",
        type: "TEXT",
        durationMinutes: 12,
        content: `T&C is not asking anyone to become a data scientist. The goal is narrower and more useful than that: **every employee should be able to hand a routine thinking task to an AI assistant, check the result, and get their real work done faster.**

Think about the parts of your week that are:

- repetitive but not identical each time (writing similar emails, summarising similar reports)
- reading-heavy (long supplier documents, policies, inspection notes)
- formatting-heavy (turning notes into a report, a table into a summary)
- first-draft work (a job description, a variance explanation, a customer reply)

Those are the tasks where AI helps most today. It is a fast, tireless, slightly unreliable assistant. It drafts; you decide.

**What does not change:** you remain responsible for anything you send, sign or act on. AI does not approve, it does not decide, and it is not a source of truth about T&C. Everything in this course is built around that one rule.`,
      },
      {
        title: "What AI is good at — and where it fails",
        type: "TEXT",
        durationMinutes: 12,
        content: `**Reliable today**

- Rewriting and summarising text you give it
- Turning rough notes into a structured document
- Explaining something in simpler language
- Comparing options against criteria you supply
- Drafting: emails, job descriptions, SOP outlines, meeting minutes
- Suggesting what to check in a dataset

**Unreliable today**

- Facts it was not given. If you did not paste it in, treat any specific number, date, name or quotation as unverified.
- Arithmetic on long lists. It often looks right and is not.
- Anything about T&C specifically — our suppliers, our policies, our prices. It has never seen them.
- Recent events, unless the tool searches for them.

The failure mode that catches people out is called a **hallucination**: the model produces a confident, well-written, completely invented answer. It does not know that it does not know. There is no warning tone in the text. That is exactly why the verification habit in Module 5 matters more than any prompting trick.`,
      },
      {
        title: "Where the hours actually are",
        type: "TEXT",
        durationMinutes: 10,
        content: `A quick exercise before you go further. Take the last full working week and list the five tasks that took you the longest.

For each one, ask three questions:

1. **Is it mostly reading or writing?** If yes, AI probably helps.
2. **Would I recognise a wrong answer immediately?** If yes, the risk is low.
3. **Does it involve confidential data?** If yes, read Module 6 before you try anything.

The tasks that answer *yes, yes, no* are your starting points. Write two of them down now — you will use them again in the practical challenge at the end of this course, and in your workplace capstone.

Most people find their first genuine time saving in something unglamorous: the weekly summary, the handover note, the supplier email that always takes twenty minutes to word carefully.`,
      },
    ],
  },
  {
    title: "2. How to Use AI Safely",
    description: "The rules that keep T&C and you protected.",
    lessons: [
      {
        title: "The three questions before you paste",
        type: "TEXT",
        durationMinutes: 12,
        content: `Before you put anything into an AI tool, ask:

**1. Would I be comfortable if this appeared outside T&C?**
Public AI tools are outside our network. Treat anything you paste as though you emailed it to someone you do not know.

**2. Does it identify a person?**
Names, ID numbers, salaries, appraisals, medical notes, phone numbers, addresses. Remove them or replace them with placeholders such as "Employee A".

**3. Is it commercially sensitive?**
Prices, costings, margins, supplier terms, customer contracts, designs, production capacity, upcoming orders. These stay inside approved systems.

If the answer to 2 or 3 is yes, either use an approved internal tool or **de-identify first**: strip the names, replace the real numbers with representative ones, and ask about the shape of the problem rather than the specific record. You almost always get the same quality of help.`,
      },
      {
        title: "Approved and unapproved tools",
        type: "TEXT",
        durationMinutes: 8,
        content: `T&C maintains a list of approved AI tools. Your IT department keeps it current, and it is the only list that counts.

The general rule:

- **Approved tool + non-confidential data** — go ahead.
- **Approved tool + confidential data** — only if IT has confirmed that tool is cleared for it.
- **Unapproved tool + any T&C data** — no. This includes free browser extensions, phone apps, and "just this once".

If a tool would genuinely help and it is not on the list, ask IT to review it. That is a normal request, not an inconvenience — and it is a great deal cheaper than a data incident.

Never paste passwords, API keys, or access tokens into any AI tool, approved or not.`,
      },
      {
        title: "Check your understanding",
        type: "QUIZ",
        durationMinutes: 10,
        content: "A short check on the safety rules before you continue.",
      },
    ],
  },
  {
    title: "3. Prompting for Work",
    description: "A structure you can reuse for any task.",
    lessons: [
      {
        title: "The five-part prompt",
        type: "TEXT",
        durationMinutes: 15,
        content: `Most disappointing AI answers come from thin prompts, not weak models. Use this structure and the quality jumps immediately.

**1. Context** — who you are, what the situation is, what data you are providing.
**2. Objective** — exactly what you want produced.
**3. Constraints** — length, tone, audience, criteria, what to leave out.
**4. Output shape** — the structure you want back: a table, five bullets, a one-page brief.
**5. Verification** — ask it to flag assumptions or say when it is unsure.

**Thin prompt**

> Summarise this supplier proposal.

**Structured prompt**

> I am a procurement officer at a garment manufacturer. Below is a 20-page supplier proposal.
> Produce a one-page brief for our purchasing manager covering: commercial terms, delivery commitments, quality obligations, and anything unusual or risky.
> Keep it under 400 words, plain English, no marketing language.
> Present it as four short sections with a bulleted list under each.
> At the end, list anything the proposal does not state clearly, and mark any figure you are inferring rather than quoting.

The second one takes ninety seconds longer to write and saves twenty minutes of rework.`,
      },
      {
        title: "Iterating instead of starting again",
        type: "TEXT",
        durationMinutes: 12,
        content: `When the first answer is not right, do not rewrite the whole prompt. Correct it in place — the assistant keeps the context.

Useful follow-ups:

- "Too long. Cut to 150 words, keep the risk section."
- "You have written this for a technical reader. Rewrite for a production supervisor."
- "Point 3 is wrong — the delivery window is 45 days, not 30. Redo the timeline."
- "Which parts of that answer came from the document I gave you, and which did you infer?"

That last one is the single most useful question in this course. It forces the assistant to separate what it read from what it invented, and it surfaces hallucinations quickly.

Iteration also beats perfection: two or three quick rounds usually reach a better result than one very long prompt.`,
      },
      {
        title: "Write a prompt for your own work",
        type: "TASK",
        durationMinutes: 15,
        content: `Take one of the two tasks you listed in Module 1 and write a full five-part prompt for it.

Then check it against the rubric we use in the platform:

- **Context** — would a new colleague understand the situation from this alone?
- **Objective** — is there exactly one clear deliverable?
- **Constraints** — length, audience, tone, criteria?
- **Output shape** — did you say what structure you want?
- **Verification** — did you ask it to flag assumptions?

Save the finished prompt to **My AI Toolbox**. You will reuse it more than you expect.`,
      },
    ],
  },
  {
    title: "4. AI by Department",
    description: "What this looks like in your part of the business.",
    lessons: [
      {
        title: "Finance, HR and Commercial",
        type: "TEXT",
        durationMinutes: 10,
        content: `**Finance** — explaining variances in words a manager will read; turning a workbook of figures into a management commentary; drafting scenario narratives; checking that a report says what the numbers say. AI is a poor calculator and a good explainer: do the arithmetic in Excel, use AI for the sentence that follows it.

**HR** — first-draft job descriptions, structured interview questions, onboarding checklists, policy summaries in plain language, survey theme analysis. Never paste CVs, appraisals, salaries or disciplinary records into a public tool.

**Commercial** — market and competitor research to be verified afterwards, proposal drafting, customer email tone, turning a specification into a client-facing summary. Prices and contract terms stay out of public tools.

Look in the **AI Use Case Library** for worked examples with sample prompts for each of these.`,
      },
      {
        title: "Production, Quality and Supply Chain",
        type: "TEXT",
        durationMinutes: 10,
        content: `**Production** — turning shift notes into a downtime summary; drafting an SOP from an experienced operator's description; structuring a root cause investigation; writing the daily report so the numbers you already have get read.

**Quality** — grouping free-text defect descriptions into categories; drafting CAPA documents; summarising inspection reports; preparing the narrative for a Pareto you built in Excel.

**Supply Chain** — comparing RFQ responses against criteria you define; summarising supplier terms; drafting purchase follow-ups; listing what a quotation fails to state.

The pattern is the same everywhere: **you keep the numbers, AI handles the language around them.** That division of labour is where the reliable time saving lives.`,
      },
      {
        title: "Find two use cases for your team",
        type: "TASK",
        durationMinutes: 15,
        content: `Open the **AI Use Case Library** and filter to your department.

Pick two cases that would work in your team, and for each note:

1. Who does this task today and how long it takes
2. What data is involved, and whether any of it is sensitive
3. What "good" would look like in the output
4. How you would check the result before using it

Bookmark them. If either turns into something real, it becomes an excellent workplace capstone — and approved capstones feed the T&C AI Opportunities pipeline.`,
      },
    ],
  },
  {
    title: "5. Verifying AI Output",
    description: "The habit that makes all of this safe.",
    lessons: [
      {
        title: "How to check an answer in two minutes",
        type: "TEXT",
        durationMinutes: 12,
        content: `Verification is not re-doing the work. It is a short, targeted check on the parts most likely to be wrong.

**Always check**

- Every number. Against the source, not against the AI.
- Every name, date and reference. These are invented most often.
- Any quotation. If it is in quotation marks, find it in the original.
- Anything stated about T&C policy, our suppliers, or our contracts.

**Usually safe**

- Structure, ordering, grouping
- Tone and phrasing
- Summaries of text you supplied — though check nothing important was dropped

**A useful move:** ask "Which parts of this are directly supported by the text I gave you? List anything you inferred." Then check the inferred list properly.

If an answer would cause a problem when wrong — a figure in a board pack, a commitment to a customer, a safety instruction — verify it fully or do not use it.`,
      },
      {
        title: "Who is accountable",
        type: "TEXT",
        durationMinutes: 8,
        content: `The person who sends, signs, publishes or acts on the output is accountable for it. Not the tool, not IT, not the person who wrote the prompt template.

Practically, that means:

- "The AI said so" is never an explanation for an error.
- Anything going to a customer, a supplier, an auditor or the board follows the same review path it always did.
- If AI materially shaped a decision, say so when you present it. Colleagues are entitled to know how the analysis was produced.
- If you find a mistake that reached someone else, correct it the same way you would correct any other mistake — quickly and in writing.

None of this is meant to discourage use. It is meant to make the use defensible.`,
      },
    ],
  },
  {
    title: "6. Protecting Company Data",
    description: "What must never leave T&C.",
    lessons: [
      {
        title: "The protected list",
        type: "TEXT",
        durationMinutes: 12,
        content: `Never place the following into an AI tool that has not been approved for it:

- **Employee data** — names with salaries, appraisals, ID or passport numbers, medical or disciplinary records
- **Customer data** — contacts, contracts, order books, pricing agreements
- **Financial data** — costings, margins, forecasts, unpublished results
- **Supplier data** — quotations, terms, audit findings
- **Pricing** — anything not already public
- **Intellectual property** — designs, patterns, technical specifications, process know-how
- **Production-sensitive information** — capacity, yields, defect rates tied to a customer
- **Credentials** — passwords, API keys, tokens, connection strings

**The de-identify habit.** You rarely need the real record to get useful help. Replace names with "Supplier A", scale figures, remove the customer. Ask about the pattern, not the file. You get the same quality of answer with none of the exposure.

If you are unsure whether something counts as sensitive, it counts. Ask IT.`,
      },
      {
        title: "If something goes wrong",
        type: "TEXT",
        durationMinutes: 6,
        content: `If you realise you have pasted something you should not have:

1. Tell your manager and IT the same day. Not next week.
2. Note what was shared, into which tool, and roughly when.
3. Delete the conversation if the tool allows it — but report it anyway; deletion is not containment.
4. Do not try to quietly fix it yourself.

Reporting early is treated as good practice at T&C, not as a disciplinary matter. Hiding it is what causes real damage. Everyone gets this wrong at least once; what matters is what happens in the next hour.`,
      },
    ],
  },
  {
    title: "7. Practical Challenge",
    description: "Apply it to something real from your own week.",
    lessons: [
      {
        title: "Your practical challenge",
        type: "ASSIGNMENT",
        durationMinutes: 45,
        content: `Choose one real task from your own work — one of the two you listed in Module 1.

Submit:

1. **The task** — what it is and how long it takes you today
2. **Your prompt** — the full five-part prompt you used
3. **What came back** — a short description, or the output with any sensitive detail removed
4. **What you had to correct** — be specific; this is the most useful part
5. **Your verification** — what you checked and how
6. **Would you use it again?** — and what you would change

There is no minimum time saving and no wrong answer. A well-documented attempt that did *not* save time is a genuinely useful result, and it is graded as such.`,
      },
    ],
  },
  {
    title: "8. Final Assessment",
    description: "Confirm what you have learned.",
    lessons: [
      {
        title: "Course assessment",
        type: "QUIZ",
        durationMinutes: 20,
        content: "Twelve questions covering safety, prompting, verification and workplace application.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Responsible AI at T&C — mandatory
// ---------------------------------------------------------------------------

export const RESPONSIBLE_AI: CourseSeed = {
  code: "INT-RAI-TC",
  slug: "responsible-ai-at-tc",
  title: "Responsible AI at T&C",
  titleAr: "الاستخدام المسؤول للذكاء الاصطناعي في T&C",
  titleTr: "T&C'de Sorumlu Yapay Zekâ",
  description:
    "The mandatory T&C module on using AI responsibly: protecting company and personal data, recognising hallucinations and bias, and understanding who is accountable for AI-assisted work.",
  descriptionAr:
    "مقرر T&C الإلزامي للاستخدام المسؤول للذكاء الاصطناعي: حماية بيانات الشركة والبيانات الشخصية، والتعرّف على الهلوسة والتحيّز، ومعرفة من يتحمّل المسؤولية عن العمل المنجز بمساعدة الذكاء الاصطناعي.",
  descriptionTr:
    "T&C'nin zorunlu sorumlu yapay zekâ modülü: şirket ve kişisel veriyi korumak, halüsinasyon ve önyargıyı fark etmek ve yapay zekâ destekli işten kimin sorumlu olduğunu bilmek.",
  outcomes: [
    "List the categories of data that must never reach an unapproved AI tool",
    "Recognise a hallucination and verify before acting",
    "Explain how bias enters an AI answer and what to do about it",
    "State who is accountable for an AI-assisted decision",
    "Follow the T&C approval path for AI-assisted work",
  ],
  outcomesAr: [
    "تعداد فئات البيانات التي يجب ألّا تصل إلى أداة ذكاء اصطناعي غير معتمدة",
    "التعرّف على الهلوسة والتحقق قبل التصرّف",
    "شرح كيف يتسرّب التحيّز إلى إجابة الذكاء الاصطناعي وكيف نتعامل معه",
    "تحديد المسؤول عن قرار اتُّخذ بمساعدة الذكاء الاصطناعي",
    "اتباع مسار الاعتماد المعتمد في T&C للعمل المنجز بمساعدة الذكاء الاصطناعي",
  ],
  outcomesTr: [
    "Onaysız bir yapay zekâ aracına asla ulaşmaması gereken veri kategorilerini saymak",
    "Halüsinasyonu fark etmek ve harekete geçmeden doğrulamak",
    "Önyargının bir yapay zekâ cevabına nasıl girdiğini ve ne yapılacağını açıklamak",
    "Yapay zekâ destekli bir karardan kimin sorumlu olduğunu söylemek",
    "Yapay zekâ destekli iş için T&C onay yolunu izlemek",
  ],
  provider: "TC_ACADEMY",
  platform: "T&C AI Academy",
  difficulty: "BEGINNER",
  estimatedHours: 4,
  isFree: true,
  certificateAvailable: true,
  level: "L1",
  category: "RESPONSIBLE_AI",
  isInternal: true,
  isMandatory: true,
  isRecommended: true,
  qualityScore: 1,
  competencies: [{ key: "RESPONSIBLE_AI", weight: 5 }],
  jobFamilies: [{ jobFamily: "GENERAL", weight: 2 }],
  goals: [],
};

export const RESPONSIBLE_AI_MODULES: ModuleSeed[] = [
  {
    title: "1. Why this module is mandatory",
    lessons: [
      {
        title: "The three ways AI goes wrong at work",
        type: "TEXT",
        durationMinutes: 15,
        content: `Almost every AI incident in a company like ours falls into one of three groups.

**1. Data leaves.** Someone pastes a customer contract, a salary list or a costing sheet into a public tool to save ten minutes. The data is now outside our control, and may be retained.

**2. A wrong answer is trusted.** The model invents a figure, a clause or a regulation. It reads well, nobody checks it, and it reaches a customer or a board pack.

**3. Nobody owns it.** A decision gets made "because the AI said so", and when it turns out badly there is no person who reviewed it.

Everything in this module exists to prevent one of those three. That is why it is mandatory, why it must be passed rather than merely completed, and why it is required before any T&C AI certificate is issued.`,
      },
      {
        title: "Never blindly trust AI output",
        type: "TEXT",
        durationMinutes: 12,
        content: `A language model produces the *most plausible next words*. Plausible is not the same as true.

This has an uncomfortable consequence: **an AI answer is most convincing exactly when you are least able to check it.** In a subject you know well, you spot the error instantly. In one you do not, the same error reads as authority.

So the rule is not "check when it looks wrong". It is: **check the things that would matter if they were wrong**, every time, regardless of how confident the answer sounds.

Specifically: every number, every name, every date, every quotation, every claim about a rule, standard, policy or contract.`,
      },
    ],
  },
  {
    title: "2. Protecting information",
    lessons: [
      {
        title: "What must never be shared",
        type: "TEXT",
        durationMinutes: 15,
        content: `The protected categories at T&C:

- **Employee data** — names with salaries, appraisals, ID or passport numbers, medical and disciplinary records
- **Customer information** — contacts, contracts, order volumes, commercial terms
- **Financial data** — costings, margins, forecasts, unpublished results
- **Supplier data** — quotations, terms, audit findings
- **Pricing** — anything not already public
- **Passwords and credentials** — never, in any tool
- **Personal information** of any individual, ours or a third party's
- **Intellectual property** — designs, patterns, technical specifications
- **Production-sensitive information** — capacity, yields, customer-linked defect data

If you need help with something in these categories, either use a tool IT has approved for that data, or de-identify: strip names, scale figures, describe the pattern instead of the record.`,
      },
      {
        title: "De-identify: a worked example",
        type: "TEXT",
        durationMinutes: 12,
        content: `**Do not send this**

> Here is our costing sheet for customer Nordwear, order 44120, 18,000 pcs at $4.12 landed with a 14% margin. Should we accept their request for a 6% reduction?

**Send this instead**

> I am negotiating a garment order of roughly 18,000 pieces. Our landed cost gives us a margin in the low teens as a percentage. The buyer is asking for a 6% price reduction.
> List the levers a manufacturer typically has in this situation, the risks of each, and what information I should confirm internally before responding. Do not assume figures I have not given you.

Same help. No customer name, no order number, no exact costing. This takes fifteen seconds and is the single most useful habit in this module.`,
      },
    ],
  },
  {
    title: "3. Hallucinations, bias and accountability",
    lessons: [
      {
        title: "Hallucinations",
        type: "TEXT",
        durationMinutes: 12,
        content: `A hallucination is a confident, fluent, invented answer. The model is not lying — it has no concept of truth to lie about. It is completing a pattern.

**Where they appear most**

- Specific figures, percentages and dates
- Names of people, companies, standards and regulations
- Citations and quotations
- Anything about your organisation, which it has never seen
- Detailed answers to questions with little real information behind them

**How to reduce them**

- Give it the source material rather than asking from memory
- Ask it to say "not stated in the document" instead of guessing
- Ask which parts are quoted and which are inferred
- Ask the same question twice, differently — unstable answers signal invention

**How to catch them:** verify against the source. There is no substitute.`,
      },
      {
        title: "Bias and fairness",
        type: "TEXT",
        durationMinutes: 12,
        content: `Models learn from text written by people, so they carry the patterns in that text — including unfair ones.

Where this matters most at T&C is anything touching people: recruitment, evaluation, promotion, discipline, and workforce planning.

**Practical rules**

- AI may help *structure* a hiring process — drafting a job description, preparing consistent interview questions, summarising a policy.
- AI must not *rank, score or screen out* people. A human makes every people decision, on stated criteria.
- Watch for assumptions the model adds that you never supplied — gender, nationality, age, seniority.
- If an output would embarrass us in front of an employee it describes, do not use it.

The same caution applies to supplier and customer judgements built on incomplete data.`,
      },
      {
        title: "Human accountability and approval",
        type: "TEXT",
        durationMinutes: 12,
        content: `**The person who uses the output owns the output.**

At T&C that means:

1. **Same approvals as before.** AI-assisted work follows the existing review path. It does not create a shortcut.
2. **Disclose material use.** If AI substantially shaped an analysis or document, say so when you present it.
3. **No automated decisions about people.** Ever.
4. **Keep your reasoning.** If asked why a recommendation says what it says, you must be able to answer without pointing at a chat window.
5. **Report incidents the same day.** Reporting early is expected and is not a disciplinary matter.

If you cannot personally defend the output, it is not ready to leave your desk.`,
      },
    ],
  },
  {
    title: "4. Assessment",
    lessons: [
      {
        title: "Responsible AI assessment",
        type: "QUIZ",
        durationMinutes: 20,
        content:
          "You must pass this assessment to receive any T&C AI Academy certificate. It can be retaken after review.",
      },
    ],
  },
];

export async function seedInternalCore(prisma: Db) {
  await upsertInternalCourse(prisma, AI_AT_TC, AI_AT_TC_MODULES);
  await upsertInternalCourse(prisma, RESPONSIBLE_AI, RESPONSIBLE_AI_MODULES);
}
