export type QuestionSeed = {
  competency: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  type: "SINGLE" | "MULTI" | "TRUE_FALSE" | "SCENARIO" | "PROMPT_TASK";
  text: string;
  textAr?: string;
  textTr?: string;
  explanation: string;
  points?: number;
  isTechnical?: boolean;
  tags?: string[];
  bank?: string;
  options: { text: string; textAr?: string; textTr?: string; isCorrect?: boolean; feedback?: string }[];
};

/** AI Fundamentals — what AI is, generative AI, LLMs, capabilities and limits. */
export const FUNDAMENTALS_QUESTIONS: QuestionSeed[] = [
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "SINGLE",
    text: "A colleague says: 'We already have automation on the cutting line, so we already use AI.' What is the most accurate response?",
    textAr: "يقول زميل: «لدينا بالفعل أتمتة في خط القص، إذن نحن نستخدم الذكاء الاصطناعي». ما الرد الأدق؟",
    textTr: "Bir meslektaşınız: 'Kesim hattında zaten otomasyon var, yani yapay zekâ kullanıyoruz' diyor. En doğru yanıt hangisi?",
    explanation:
      "Automation follows fixed rules a person wrote. AI learns patterns from data and produces outputs that were not explicitly programmed. Most factory automation is rule-based, not AI.",
    options: [
      { text: "Automation follows fixed rules someone wrote; AI learns patterns from data and can handle inputs nobody anticipated.", isCorrect: true },
      { text: "They are the same thing — 'AI' is just the newer word for automation." },
      { text: "Automation is AI only when a machine is involved." },
      { text: "AI is automation that runs faster." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "SINGLE",
    text: "What does a large language model actually do when it answers your question?",
    explanation:
      "An LLM predicts likely continuations of text based on patterns learned in training. It is not looking anything up in a database of facts, which is why it can be fluent and wrong at the same time.",
    options: [
      { text: "It predicts the most likely next words based on patterns it learned during training.", isCorrect: true },
      { text: "It searches a verified database of facts and returns the matching entry." },
      { text: "It runs your question past a human reviewer before replying." },
      { text: "It reasons from a fixed set of logical rules programmed by engineers." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "SINGLE",
    text: "You ask an AI assistant for the phone number of a supplier. It gives you a confident, correctly-formatted number. What should you assume?",
    explanation:
      "Specific facts like phone numbers, names and dates are exactly where models invent. Correct formatting is not evidence of correctness.",
    options: [
      { text: "It may be invented — verify it against a source before using it.", isCorrect: true },
      { text: "It is reliable, because the format is correct." },
      { text: "It is reliable, because the assistant did not express doubt." },
      { text: "It is reliable if the assistant is a paid version." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "TRUE_FALSE",
    text: "A generative AI assistant has read T&C's internal policies and supplier contracts, so it can answer questions about them.",
    explanation:
      "Public AI tools have never seen your organisation's internal documents. They can only work with what you paste into the conversation.",
    options: [
      { text: "False — it only knows what you give it in the conversation.", isCorrect: true },
      { text: "True — modern models are trained on company data." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Which of these is the clearest example of generative AI?",
    explanation:
      "Generative AI produces new content — text, images, code. Sorting, filtering and threshold alarms are ordinary software.",
    options: [
      { text: "A tool that drafts a supplier email from three bullet points you provide.", isCorrect: true },
      { text: "A spreadsheet that sorts orders by delivery date." },
      { text: "A machine that stops when a sensor reading passes a threshold." },
      { text: "A dashboard that shows last month's defect rate." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "MULTI",
    text: "Which of these tasks are current AI assistants generally reliable at? Select all that apply.",
    explanation:
      "Models are strong at restructuring and rewriting text you supply. They are weak at arithmetic over long lists and at facts about your specific organisation.",
    options: [
      { text: "Summarising a long document you paste in", isCorrect: true },
      { text: "Rewriting a rough paragraph in a clearer tone", isCorrect: true },
      { text: "Adding up 200 rows of production figures accurately" },
      { text: "Turning meeting notes into a structured action list", isCorrect: true },
      { text: "Telling you your company's current inventory level" },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "SINGLE",
    text: "What is a 'hallucination' in the context of AI assistants?",
    explanation:
      "It is a confident, fluent, invented output. The model has no internal signal that distinguishes what it knows from what it is generating.",
    options: [
      { text: "A confident, well-written answer that is simply invented.", isCorrect: true },
      { text: "The assistant refusing to answer a question." },
      { text: "The assistant giving a very long answer." },
      { text: "A delay before the answer appears." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Two colleagues type exactly the same question into the same AI assistant and get different answers. What does this tell you?",
    explanation:
      "Model outputs are non-deterministic. Different wording of the same answer is normal; substantially different *facts* between runs is a strong signal the model is inventing.",
    options: [
      { text: "This is normal — but if the facts differ between runs, treat both as unverified.", isCorrect: true },
      { text: "One of them is using the tool incorrectly." },
      { text: "The tool is broken and should be reported to IT." },
      { text: "The second answer is always the more accurate one." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Your manager asks whether AI could 'predict next season's order volumes'. What is the most honest answer?",
    explanation:
      "Forecasting from your own historical data is a real, well-established technique — but it needs your data and a model built for it. A chat assistant guessing a number is not forecasting.",
    options: [
      { text: "Forecasting from our own historical order data is realistic, but it needs that data and a proper model — a chat assistant guessing a number is not a forecast.", isCorrect: true },
      { text: "Yes — just ask the assistant what next season's volumes will be." },
      { text: "No — AI cannot be used for any kind of prediction." },
      { text: "Yes, if we describe our business in enough detail in the prompt." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which statement best describes why AI answers sound so confident even when wrong?",
    explanation:
      "Models are trained on text that is mostly written confidently. Confidence is a property of the writing style they learned, not a measure of accuracy.",
    options: [
      { text: "Confidence is a style learned from training text; it carries no information about whether the answer is right.", isCorrect: true },
      { text: "The model calculates a certainty score and only answers when it is above 95%." },
      { text: "The model is confident only when the answer is verified." },
      { text: "Confidence increases with the length of your prompt." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "You want an AI assistant to answer questions about a 40-page technical specification. Which approaches can actually work? Select all that apply.",
    explanation:
      "Giving the model the document is what makes the answer grounded. Asking it from memory, or telling it to 'be accurate', does nothing.",
    options: [
      { text: "Paste the document into the conversation and ask questions about it", isCorrect: true },
      { text: "Upload the document to a tool that supports file attachments", isCorrect: true },
      { text: "Ask the assistant what it knows about the specification by name" },
      { text: "Add 'be accurate and do not make anything up' and ask from memory" },
      { text: "Use an internal tool that retrieves the relevant sections and passes them to the model", isCorrect: true },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "What is the practical difference between machine learning and a language model assistant?",
    explanation:
      "Machine learning is the broad discipline of learning patterns from data. Language model assistants are one application of it, focused on text.",
    options: [
      { text: "Machine learning is the broad field of learning patterns from data; a language assistant is one text-focused application of it.", isCorrect: true },
      { text: "They are unrelated technologies." },
      { text: "Machine learning is newer than language models." },
      { text: "Machine learning only works on images." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "An AI tool summarises a 20-page report into one page. What is the main risk you should check for?",
    explanation:
      "Summarisation is generally reliable, but the risk is silent omission — a material caveat or exception that did not make the summary.",
    options: [
      { text: "Something important was left out without being flagged.", isCorrect: true },
      { text: "The summary will be too long to read." },
      { text: "The tool will refuse to summarise documents that long." },
      { text: "The grammar will be poor." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which is the best description of what 'training data' means for a language model?",
    explanation:
      "Training data is the large body of text the model learned patterns from. It is not stored and searched at answer time.",
    options: [
      { text: "A very large body of text the model learned statistical patterns from — not a database it looks things up in.", isCorrect: true },
      { text: "The documents you upload during a conversation." },
      { text: "A list of approved answers the model chooses between." },
      { text: "The instructions in your prompt." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "A vendor demonstrates an AI system that 'automatically detects all fabric defects with 99% accuracy'. What is the first question you should ask?",
    explanation:
      "Accuracy claims are meaningless without knowing the test conditions. A model measured on clean, well-lit images of obvious defects will not survive your factory floor.",
    options: [
      { text: "On what dataset was that measured, and how similar is it to our fabrics, lighting and defect types?", isCorrect: true },
      { text: "How much does the licence cost per year?" },
      { text: "Which programming language is it written in?" },
      { text: "How many other companies have bought it?" },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "Which of these are genuine limitations of today's general-purpose AI assistants? Select all that apply.",
    explanation:
      "Access to internal systems, reliable arithmetic on long lists, and knowledge of very recent events are all real limits. Understanding a language other than English is not.",
    options: [
      { text: "No access to your internal systems unless connected deliberately", isCorrect: true },
      { text: "Unreliable arithmetic over long lists of numbers", isCorrect: true },
      { text: "Limited or no knowledge of very recent events", isCorrect: true },
      { text: "Inability to work in any language other than English" },
      { text: "No way to know when it is wrong", isCorrect: true },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Your team wants to use AI to answer employee questions about internal HR policies. What has to be true for that to work?",
    explanation:
      "The model must be given the policies — through retrieval or by pasting them. Without that it will invent plausible policies, which is worse than no tool at all.",
    options: [
      { text: "The system must retrieve the actual policy text and pass it to the model with each question.", isCorrect: true },
      { text: "The model must be told it works for T&C." },
      { text: "The policies must have been published on the internet at some point." },
      { text: "Nothing — modern models can answer HR questions for any company." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "Which situation is most likely to produce a hallucinated answer?",
    explanation:
      "The more specific the question and the less grounding material supplied, the higher the invention risk. Asking for precise figures with no source is the classic case.",
    options: [
      { text: "Asking for specific figures and dates about a topic, with no source document supplied.", isCorrect: true },
      { text: "Asking it to rewrite a paragraph you pasted in a friendlier tone." },
      { text: "Asking it to group a list of items you provided into themes." },
      { text: "Asking it to explain a general concept in simpler words." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "You are evaluating whether an AI feature is worth building. Which measurement matters most?",
    explanation:
      "Without a baseline of the current manual process, any 'improvement' is unmeasurable. This is the most commonly skipped step in AI projects.",
    options: [
      { text: "How long and how accurately the task is done today, measured before anything is built.", isCorrect: true },
      { text: "How impressive the demo looks to management." },
      { text: "How many features the vendor offers." },
      { text: "How large the underlying model is." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "ADVANCED",
    type: "MULTI",
    text: "An AI pilot performs well in testing and poorly in production. Which explanations are plausible? Select all that apply.",
    explanation:
      "Test sets that do not resemble reality, users who phrase things differently, and edge cases absent from testing all cause this. Model size is rarely the reason.",
    options: [
      { text: "The test cases were cleaner and more consistent than real inputs", isCorrect: true },
      { text: "Real users phrase requests very differently from the test authors", isCorrect: true },
      { text: "Edge cases were never represented in the test set", isCorrect: true },
      { text: "The underlying model became less capable after deployment" },
      { text: "The process the tool sits inside was never adjusted to use it", isCorrect: true },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "Which best explains why an AI assistant can give an excellent answer about garment manufacturing generally, but a wrong answer about T&C specifically?",
    explanation:
      "General industry knowledge is widely represented in training text. T&C's specifics are not, so the model fills the gap with plausible industry patterns.",
    options: [
      { text: "General industry knowledge is well represented in its training text; T&C's specifics are not, so it substitutes plausible patterns.", isCorrect: true },
      { text: "It deliberately withholds company-specific information for privacy reasons." },
      { text: "It needs a paid licence to answer company questions." },
      { text: "Company-specific questions are always phrased badly." },
    ],
  },
  {
    competency: "FUNDAMENTALS",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "A department proposes replacing a manual weekly report with an AI-generated one. What is the strongest argument for running both in parallel for a period?",
    explanation:
      "Parallel running is how you find the discrepancies. It converts an assumption about accuracy into evidence, at low cost.",
    options: [
      { text: "It produces evidence about where the AI output differs from the trusted process, before anyone depends on it.", isCorrect: true },
      { text: "It gives the team more time to get used to the new tool." },
      { text: "It doubles the amount of reporting available to management." },
      { text: "It satisfies a regulatory requirement for AI systems." },
    ],
  },
];

/** Practical Workplace AI — scenario-driven, drawn from real T&C situations. */
export const WORKPLACE_QUESTIONS: QuestionSeed[] = [
  {
    competency: "WORKPLACE",
    difficulty: "EASY",
    type: "SCENARIO",
    text: "You receive a 20-page supplier proposal and need to understand the major risks quickly. Which AI workflow is most appropriate?",
    textAr: "استلمت عرضًا من مورد من 20 صفحة وتحتاج لفهم المخاطر الرئيسية بسرعة. أي أسلوب هو الأنسب؟",
    textTr: "20 sayfalık bir tedarikçi teklifi aldınız ve büyük riskleri hızlıca anlamanız gerekiyor. Hangi yaklaşım en uygunu?",
    explanation:
      "Give the model the document, ask for a specific structure, and require clause references so every point can be checked against the source.",
    options: [
      { text: "Paste the proposal in, ask for a structured risk summary with clause references, then read the clauses it cites.", isCorrect: true },
      { text: "Ask the assistant what risks usually appear in supplier proposals and use that list." },
      { text: "Ask it to tell you whether to accept the proposal." },
      { text: "Ask it to summarise the proposal in one sentence and act on that." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Which of these everyday tasks is the best first candidate for AI help?",
    explanation:
      "Repetitive writing tasks where you can immediately judge the quality of the output are the lowest-risk, highest-return starting point.",
    options: [
      { text: "Drafting the weekly handover summary you write every Friday.", isCorrect: true },
      { text: "Deciding which supplier to award a contract to." },
      { text: "Approving an employee's leave request." },
      { text: "Calculating this month's payroll." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "EASY",
    type: "SINGLE",
    text: "An AI assistant produces a draft email to a customer. What should happen next?",
    explanation:
      "AI drafts; a person reviews and sends. The sender is accountable for the content regardless of how it was produced.",
    options: [
      { text: "You read it, correct anything wrong, and take responsibility for what you send.", isCorrect: true },
      { text: "Send it immediately — reviewing defeats the time saving." },
      { text: "Forward it to IT for approval." },
      { text: "Ask the AI whether the email is correct and trust its answer." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "EASY",
    type: "MULTI",
    text: "Which of these would you expect AI to help with in a normal working week? Select all that apply.",
    explanation:
      "Reading, writing and restructuring tasks are the reliable wins. Approvals and precise arithmetic are not.",
    options: [
      { text: "Turning rough meeting notes into structured minutes", isCorrect: true },
      { text: "Summarising a long policy into a one-page brief", isCorrect: true },
      { text: "Approving a purchase order" },
      { text: "Drafting a first version of a job description", isCorrect: true },
      { text: "Explaining a technical document in simpler language", isCorrect: true },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "EASY",
    type: "SCENARIO",
    text: "You need to write the same type of report every month. What is the most valuable thing to do after getting one good AI result?",
    explanation:
      "The return on AI comes from reusable templates, not from one clever answer. Saving the prompt turns a one-off into a monthly saving.",
    options: [
      { text: "Save the prompt as a template so next month takes minutes instead of hours.", isCorrect: true },
      { text: "Delete the conversation to save space." },
      { text: "Email the output to your whole department." },
      { text: "Nothing — start fresh each month for better results." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "EASY",
    type: "TRUE_FALSE",
    text: "If an AI assistant produces a report that turns out to contain a serious error, responsibility sits with the person who used and circulated it.",
    explanation: "Accountability always rests with the person who acts on the output. 'The AI said so' is never an explanation.",
    options: [
      { text: "True", isCorrect: true },
      { text: "False — responsibility sits with the tool provider." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Your first AI answer is too long and too formal. What is the most efficient next step?",
    explanation:
      "Iterating in the same conversation keeps all the context. Starting again wastes the setup you already did.",
    options: [
      { text: "Reply in the same conversation: 'Too long and too formal — cut to 150 words for a production supervisor.'", isCorrect: true },
      { text: "Start a completely new conversation with a longer prompt." },
      { text: "Accept it and edit the whole thing manually." },
      { text: "Try a different AI tool." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "You have 300 free-text defect descriptions written by different inspectors. You want them grouped into standard categories. What is the best approach?",
    explanation:
      "Supply your taxonomy, ask for a confidence flag, and review the low-confidence rows. Letting the model invent categories produces groups nobody can act on.",
    options: [
      { text: "Give it your existing defect categories, ask it to map each description with a confidence flag, then review the uncertain ones yourself.", isCorrect: true },
      { text: "Ask it to invent whatever categories it thinks are best and use those." },
      { text: "Ask it to tell you the root cause of each defect." },
      { text: "Ask it how many defects there were in total." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "A production manager wants monthly variance commentary from a finance spreadsheet. What is the correct division of labour?",
    explanation:
      "Calculate in Excel; explain with AI. Models are unreliable at multi-step arithmetic and excellent at turning a correct table into readable commentary.",
    options: [
      { text: "Calculate the variances in Excel, then give AI the summarised table and ask for the commentary.", isCorrect: true },
      { text: "Paste the raw transaction list and ask AI to calculate the variances and write the commentary." },
      { text: "Ask AI what variances a garment factory usually has." },
      { text: "Ask AI to decide which variances matter and hide the rest." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "You are comparing three vendor quotations. Which instruction most improves the usefulness of the AI comparison?",
    explanation:
      "You define the criteria; the model applies them consistently. If it chooses the criteria, the comparison reflects its assumptions rather than your requirements.",
    options: [
      { text: "Specify the exact criteria to compare on, and ask it to list what each quotation does not state.", isCorrect: true },
      { text: "Ask it to pick the best supplier and explain why." },
      { text: "Ask it to rank them from best to worst without criteria." },
      { text: "Ask it which supplier other garment manufacturers use." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "A colleague uses AI to draft an SOP from an operator's verbal description. What is the most important final step?",
    explanation:
      "The operator who does the job is the only person who can confirm the SOP is correct and complete. AI structures; the expert validates.",
    options: [
      { text: "The experienced operator reviews it and confirms nothing is missing or wrong.", isCorrect: true },
      { text: "It is printed and posted on the line immediately." },
      { text: "It is filed in the document system without review." },
      { text: "It is sent to the AI again to double-check itself." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "You want AI to help investigate a three-hour production stoppage. Which prompt produces the most useful result?",
    explanation:
      "Asking it to facilitate one question at a time turns it into an interviewer that draws out what you know, rather than a generator that guesses a cause.",
    options: [
      { text: "'Facilitate a 5-Why analysis. Ask me one question at a time and wait for my answer.'", isCorrect: true },
      { text: "'Tell me the root cause of a three-hour stoppage on a finishing line.'" },
      { text: "'Write the incident report for a three-hour stoppage.'" },
      { text: "'How long do stoppages usually last in garment factories?'" },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "Which instructions make an AI-written management report noticeably more useful? Select all that apply.",
    explanation:
      "Naming the audience, capping length, requiring conclusions rather than topics, and forbidding invented figures all improve usable output.",
    options: [
      { text: "State who the audience is and what they will do with it", isCorrect: true },
      { text: "Set a maximum word count", isCorrect: true },
      { text: "Require headlines that state the conclusion, not the topic", isCorrect: true },
      { text: "Ask it to add relevant industry benchmarks from its own knowledge" },
      { text: "Forbid introducing any figure you did not supply", isCorrect: true },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "Your team spends two hours a week consolidating the same five spreadsheets. What is the most realistic AI-related action?",
    explanation:
      "Repetitive, rule-based data movement is a scripting problem. AI helps by writing the script — not by doing the consolidation each week in a chat window.",
    options: [
      { text: "Use AI to help write a script that does the consolidation, then run it each week.", isCorrect: true },
      { text: "Paste all five spreadsheets into a chat every week and ask for the consolidated result." },
      { text: "Ask AI to remember the spreadsheets so you do not have to send them again." },
      { text: "Accept that this task cannot be improved." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which of these is the strongest sign that a task is a good AI candidate?",
    explanation:
      "If you can immediately tell whether the output is good, the risk of an undetected error is low — which is what makes a task safe to start with.",
    options: [
      { text: "You would recognise a bad output immediately, and the task is mostly reading or writing.", isCorrect: true },
      { text: "The task is very important and high-risk." },
      { text: "Nobody in the team currently understands the task." },
      { text: "The task involves confidential customer data." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "An AI summary of an inspection report is going into a customer audit pack. What must you do?",
    explanation:
      "Audit material must be traceable to source. Requiring report references and checking each one is the minimum standard.",
    options: [
      { text: "Require it to reference each source report, then verify every figure and reference against the originals.", isCorrect: true },
      { text: "Use it as-is — the customer only reads the summary." },
      { text: "Ask the AI to confirm the summary is accurate." },
      { text: "Remove all figures so nothing can be wrong." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "You ask AI to analyse survey comments and it produces beautifully worded themes. What should you check first?",
    explanation:
      "The risk in thematic analysis is smoothing — the model paraphrases criticism into something milder. Checking verbatim quotes against themes catches this.",
    options: [
      { text: "That the verbatim quotes actually support the themes, and that negative feedback has not been softened.", isCorrect: true },
      { text: "That the themes are written in good English." },
      { text: "That there are at least ten themes." },
      { text: "That the themes match what management expected." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "You have used AI to prepare an analysis that will be presented to the board. What is the most important thing to be able to do?",
    explanation:
      "You must be able to defend the reasoning yourself. If the only explanation is 'the AI produced it', the analysis is not ready to present.",
    options: [
      { text: "Explain the reasoning behind every conclusion yourself, without referring to the AI conversation.", isCorrect: true },
      { text: "Show the board the prompt you used." },
      { text: "Confirm which AI tool produced it." },
      { text: "Demonstrate that the AI is a paid enterprise version." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "A department reports that AI 'saved 20 hours a week'. As a manager, what is your first question?",
    explanation:
      "Benefit claims need a measured baseline. Without knowing how long the task took before, the figure is a guess.",
    options: [
      { text: "How long did those tasks take before, and how was that measured?", isCorrect: true },
      { text: "Which AI tool did you use?" },
      { text: "Can we roll it out to every department this month?" },
      { text: "How many prompts did you write?" },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "ADVANCED",
    type: "MULTI",
    text: "Which of these would make you stop and reconsider an AI workflow a team has built? Select all that apply.",
    explanation:
      "Unverifiable outputs, sensitive data in unapproved tools, decisions without human review and undocumented prompts are all genuine warning signs.",
    options: [
      { text: "Nobody can explain how the output was produced", isCorrect: true },
      { text: "Confidential data is being pasted into an unapproved tool", isCorrect: true },
      { text: "The output goes directly to a customer with no review", isCorrect: true },
      { text: "The team saved the prompt as a reusable template" },
      { text: "Figures in the output are never checked against the source", isCorrect: true },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "Two teams solve the same problem with AI. Team A gets one excellent answer. Team B builds a documented, reusable prompt that gives a good answer every time. Which has created more value, and why?",
    explanation:
      "Reusability compounds. A repeatable good-enough process beats a one-off excellent result in almost every operational setting.",
    options: [
      { text: "Team B — a repeatable process compounds every week, while a one-off answer does not.", isCorrect: true },
      { text: "Team A — output quality is the only thing that matters." },
      { text: "Neither — both approaches produce the same value." },
      { text: "Team A, because it took less time." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "An AI-assisted process has been running for three months. What is the most useful thing to review?",
    explanation:
      "Sampling real outputs against reality is the only way to see quality drift. Usage volume and satisfaction scores can both look healthy while accuracy degrades.",
    options: [
      { text: "A sample of real outputs checked against the source, to see whether quality has drifted.", isCorrect: true },
      { text: "How many people are using it." },
      { text: "Whether users say they like it." },
      { text: "Whether the provider has released a newer model." },
    ],
  },
  {
    competency: "WORKPLACE",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "You want to introduce AI into a process that currently has a manual double-check by a second person. What should happen to that check?",
    explanation:
      "Adding a new, less predictable failure mode is not the moment to remove a control. Keep the check, then use its findings to decide whether it can safely change.",
    options: [
      { text: "Keep it, and use what it catches as evidence for whether the control can safely change later.", isCorrect: true },
      { text: "Remove it — the AI replaces the second person." },
      { text: "Remove it only if the AI is a paid enterprise version." },
      { text: "Replace it with a second AI reviewing the first AI." },
    ],
  },
];
