import type { QuestionSeed } from "./questions-core";

/** Prompting — context, objective, constraints, output shape, iteration, verification. */
export const PROMPTING_QUESTIONS: QuestionSeed[] = [
  {
    competency: "PROMPTING",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Which of these prompts will produce the more useful answer?",
    textAr: "أي من هذين الأمرين سيعطي نتيجة أفضل؟",
    textTr: "Bu iki prompt'tan hangisi daha kullanışlı bir yanıt üretir?",
    explanation:
      "The second prompt supplies context, an objective, constraints, an audience and an output shape. That is the difference between a usable draft and a generic paragraph.",
    options: [
      {
        text: "'I am a production supervisor. Write a 120-word update for the plant manager on yesterday's downtime, leading with anything needing a decision today, then one line per line.'",
        isCorrect: true,
      },
      { text: "'Write an update about production.'" },
      { text: "'Write a professional and detailed production update. Be thorough.'" },
      { text: "'Production update please, make it good.'" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "EASY",
    type: "MULTI",
    text: "Which elements belong in a well-structured work prompt? Select all that apply.",
    explanation: "Context, objective, constraints, output shape and a verification instruction are the five reliable components.",
    options: [
      { text: "Context — who you are and what the situation is", isCorrect: true },
      { text: "Objective — exactly what you want produced", isCorrect: true },
      { text: "Constraints — length, audience, tone, criteria", isCorrect: true },
      { text: "Output shape — the structure you want back", isCorrect: true },
      { text: "Politeness — saying please and thank you" },
      { text: "Verification — asking it to flag assumptions", isCorrect: true },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "EASY",
    type: "SINGLE",
    text: "The answer you got is 80% right. What is the best next move?",
    explanation:
      "Correcting in the same conversation keeps all the context you already supplied. Starting over throws it away.",
    options: [
      { text: "Tell it specifically what to change, in the same conversation.", isCorrect: true },
      { text: "Start a brand new conversation with a longer prompt." },
      { text: "Accept it — 80% is as good as AI gets." },
      { text: "Ask it to try again without saying what was wrong." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Why is it useful to tell the AI who the audience is?",
    explanation:
      "Audience determines vocabulary, length, assumed knowledge and what can be left out. It is the single highest-value piece of context.",
    options: [
      { text: "It changes the vocabulary, length and assumed knowledge of the answer.", isCorrect: true },
      { text: "It makes the AI respond faster." },
      { text: "It is required by most AI tools." },
      { text: "It reduces the cost of the request." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "EASY",
    type: "TRUE_FALSE",
    text: "Adding 'be accurate and do not make anything up' to a prompt reliably prevents hallucinations.",
    explanation:
      "It slightly reduces confident invention but does not prevent it. Only supplying source material and verifying the output actually works.",
    options: [
      { text: "False — supplying the source and verifying the answer is what works.", isCorrect: true },
      { text: "True — the model will comply with the instruction." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Which instruction best controls the shape of the output?",
    explanation: "Describing the exact structure removes ambiguity and makes the result immediately usable.",
    options: [
      { text: "'Return four sections with a maximum of three bullets each, then a one-line recommendation.'", isCorrect: true },
      { text: "'Make it well organised.'" },
      { text: "'Format it nicely.'" },
      { text: "'Use professional formatting.'" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "EASY",
    type: "SINGLE",
    text: "You want a shorter answer. Which is clearest?",
    explanation: "Specific limits are followed far more reliably than vague adjectives.",
    options: [
      { text: "'Maximum 150 words.'", isCorrect: true },
      { text: "'Keep it brief.'" },
      { text: "'Not too long please.'" },
      { text: "'Be concise and to the point.'" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which follow-up question is most effective at exposing invented content?",
    explanation:
      "Forcing the model to separate what it read from what it inferred surfaces hallucinations quickly and specifically.",
    options: [
      { text: "'Which parts of that answer are directly supported by the document I gave you, and which did you infer?'", isCorrect: true },
      { text: "'Are you sure that is correct?'" },
      { text: "'Please double-check your answer.'" },
      { text: "'How confident are you out of ten?'" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "You need AI to compare three vendor quotations and produce a price comparison, a risk assessment, a recommendation and a management summary. Which prompt design is strongest?",
    explanation:
      "Numbered deliverables, explicit criteria, a rule against inventing figures, and an instruction to surface gaps gives you all four outputs in a checkable form.",
    options: [
      {
        text: "State the four deliverables as a numbered list, define the comparison criteria yourself, forbid figures you did not supply, and ask it to list anything a quotation fails to state.",
        isCorrect: true,
      },
      { text: "Ask one open question: 'Analyse these three quotations and tell me what to do.'" },
      { text: "Ask four separate questions in four separate conversations." },
      { text: "Ask it to score each supplier out of 100 using its own criteria." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "Which constraints would meaningfully improve a prompt asking for an executive brief? Select all that apply.",
    explanation:
      "Word limits, named audience, required structure and a rule against unsupplied figures all constrain output usefully. Asking for a formal tone changes little.",
    options: [
      { text: "'Maximum 300 words'", isCorrect: true },
      { text: "'Written for a non-financial operations director'", isCorrect: true },
      { text: "'Each heading must state the conclusion, not the topic'", isCorrect: true },
      { text: "'Use a formal and professional tone'" },
      { text: "'Do not introduce any figure I have not provided'", isCorrect: true },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "You are drafting a difficult email to a supplier. Which instruction most improves the result?",
    explanation:
      "Left alone, models over-apologise and hedge. Naming the tone and explicitly forbidding the failure mode fixes it in one line.",
    options: [
      { text: "'Firm but relationship-preserving. Do not apologise for raising the issue.'", isCorrect: true },
      { text: "'Write it professionally.'" },
      { text: "'Make it polite.'" },
      { text: "'Write it the way a manager would.'" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "What is the main benefit of giving the AI an example of the output you want?",
    explanation:
      "An example communicates structure, tone and level of detail far more precisely than description. This is why 'here is last month's version' works so well.",
    options: [
      { text: "It conveys structure, tone and detail level more precisely than describing them.", isCorrect: true },
      { text: "It makes the response arrive faster." },
      { text: "It is the only way to get formatted output." },
      { text: "It prevents the model from hallucinating." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "A colleague's prompt keeps producing generic marketing language. What is the most likely cause?",
    explanation:
      "Generic output almost always means missing context and missing constraints. The model fills an information vacuum with the most average text it knows.",
    options: [
      { text: "The prompt has no specific context or constraints, so the model produces the most average answer possible.", isCorrect: true },
      { text: "The model is not capable of writing in a specific style." },
      { text: "The prompt is too long." },
      { text: "They need a paid version of the tool." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which prompt is most likely to produce a useful root-cause investigation?",
    explanation:
      "Asking the model to interview you one question at a time draws out what you actually know instead of letting it guess a cause.",
    options: [
      { text: "'Facilitate a 5-Why analysis with me. Ask one question at a time and wait for my answer before the next.'", isCorrect: true },
      { text: "'What causes machine stoppages in garment factories?'" },
      { text: "'Write a root cause analysis for a stoppage.'" },
      { text: "'List all possible causes of production problems.'" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "You are building a prompt template your whole team will reuse. What should it include? Select all that apply.",
    explanation:
      "Clear placeholders, fixed constraints, the required output shape and a verification instruction make a template usable by someone who did not write it.",
    options: [
      { text: "Clearly marked placeholders for the parts that change each time", isCorrect: true },
      { text: "The constraints that should stay the same every time", isCorrect: true },
      { text: "The required output structure", isCorrect: true },
      { text: "A note on what must be verified before the output is used", isCorrect: true },
      { text: "The name of the person who wrote it" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Why does asking for 'anything the document does not state' produce such useful output?",
    explanation:
      "Gaps are where risk lives, and they are invisible when you only summarise what is present. It also stops the model quietly assuming a market norm.",
    options: [
      { text: "It surfaces gaps and stops the model quietly filling them with assumed norms.", isCorrect: true },
      { text: "It makes the summary shorter." },
      { text: "It is required for the model to read attachments." },
      { text: "It prevents the model from summarising incorrectly." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "Your prompt works well for you but produces poor results when a colleague uses it. What is the most likely explanation?",
    explanation:
      "Prompts often rely on context supplied earlier in your conversation. A template must be self-contained to travel.",
    options: [
      { text: "Your prompt depends on context established earlier in your conversation and is not self-contained.", isCorrect: true },
      { text: "Prompts only work for the person who wrote them." },
      { text: "Your colleague has a different account tier." },
      { text: "The model remembers you specifically." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "Which is the strongest verification instruction to build into a prompt used for management reporting?",
    explanation:
      "Requiring explicit separation of source-supported statements from inferences makes the output auditable, which is what reporting needs.",
    options: [
      { text: "'Mark every statement as either supported by the data I gave you or inferred, and list what you would need to confirm each inference.'", isCorrect: true },
      { text: "'Be careful with the numbers.'" },
      { text: "'Only include things you are sure about.'" },
      { text: "'Say if you are unsure.'" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "ADVANCED",
    type: "MULTI",
    text: "A prompt asks for a decision recommendation. Which design choices reduce the risk of a poor decision? Select all that apply.",
    explanation:
      "Presenting trade-offs rather than a verdict, forbidding invented figures, requiring the assumptions to be named, and asking for the counter-case all keep the decision with the human.",
    options: [
      { text: "Ask it to present trade-offs rather than choose", isCorrect: true },
      { text: "Forbid any figure you did not supply", isCorrect: true },
      { text: "Require it to name the assumptions the recommendation depends on", isCorrect: true },
      { text: "Ask it to argue the strongest case against its own recommendation", isCorrect: true },
      { text: "Ask it to be confident and decisive" },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "You want consistent output structure across 50 documents processed one at a time. What matters most?",
    explanation:
      "An explicit output schema, repeated identically each time, is what makes results comparable. Natural-language descriptions of format drift between runs.",
    options: [
      { text: "Specify an exact output schema and reuse the identical wording every time.", isCorrect: true },
      { text: "Ask each time for 'the same format as before'." },
      { text: "Process all 50 in one conversation so it remembers." },
      { text: "Use a longer prompt each time for more detail." },
    ],
  },
  {
    competency: "PROMPTING",
    difficulty: "ADVANCED",
    type: "PROMPT_TASK",
    points: 5,
    text:
      "Practical task. You need AI to compare three vendor quotations and produce: (1) a price comparison, (2) a risk assessment, (3) a recommendation, and (4) a management summary. Write the prompt you would actually give the AI assistant.",
    textAr:
      "مهمة عملية: تحتاج من الذكاء الاصطناعي مقارنة ثلاثة عروض أسعار وإنتاج: (1) مقارنة الأسعار، (2) تقييم المخاطر، (3) التوصية، (4) ملخص إداري. اكتب الأمر الذي ستعطيه فعليًا.",
    textTr:
      "Uygulama görevi. Üç tedarikçi teklifini karşılaştırıp şunları üretmesini istiyorsunuz: (1) fiyat karşılaştırması, (2) risk değerlendirmesi, (3) öneri, (4) yönetici özeti. Yapay zekâya vereceğiniz prompt'u yazın.",
    explanation:
      "A strong answer sets the context (your role, the commodity, that quotations follow), states the four deliverables, defines the comparison criteria, constrains length and audience, describes the output structure, and asks the model to flag anything inferred or missing from the quotations.",
    options: [],
  },
];

/** Responsible AI & Information Security — the highest-stakes competency. */
export const RESPONSIBLE_AI_QUESTIONS: QuestionSeed[] = [
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "SCENARIO",
    text: "You want help writing a difficult performance conversation. What is safe to put into a public AI tool?",
    textAr: "تريد مساعدة في صياغة محادثة أداء صعبة. ما الذي يمكن وضعه بأمان في أداة ذكاء اصطناعي عامة؟",
    textTr: "Zor bir performans görüşmesini yazmak için yardım istiyorsunuz. Genel bir yapay zekâ aracına ne koymak güvenlidir?",
    explanation:
      "Describe the situation generically. Never paste the employee's name, appraisal, salary or any identifying detail.",
    options: [
      { text: "A generic description of the situation with no name, no appraisal text and no identifying details.", isCorrect: true },
      { text: "The employee's full appraisal document, so the AI has proper context." },
      { text: "The employee's name and salary, but nothing else." },
      { text: "The whole HR file — public tools do not store data." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "MULTI",
    text: "Which of these must never be pasted into an unapproved AI tool? Select all that apply.",
    explanation: "All of these are protected categories at T&C. Passwords are never acceptable in any tool, approved or not.",
    options: [
      { text: "Customer pricing and contract terms", isCorrect: true },
      { text: "Employee salaries and appraisals", isCorrect: true },
      { text: "System passwords or API keys", isCorrect: true },
      { text: "A published industry article" },
      { text: "Product designs and technical specifications", isCorrect: true },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "SINGLE",
    text: "An AI assistant gives you a specific regulation number and quotes it. What must you do before citing it?",
    explanation: "Citations and quotations are among the most commonly invented outputs. Verify against the actual regulation.",
    options: [
      { text: "Find the regulation and confirm the number and wording yourself.", isCorrect: true },
      { text: "Cite it — the assistant quoted it directly." },
      { text: "Ask the assistant to confirm it is correct." },
      { text: "Cite it but add 'according to AI'." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "TRUE_FALSE",
    text: "It is acceptable to use an AI tool to screen and rank job applicants automatically, as long as a human sees the final list.",
    explanation:
      "AI must not rank, score or screen out people at T&C. Bias is applied invisibly and consistently, which turns one bad judgement into a systematic one.",
    options: [
      { text: "False — AI must never rank or screen people.", isCorrect: true },
      { text: "True — human review at the end makes it acceptable." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "SINGLE",
    text: "You realise you pasted a customer contract into a public AI tool this morning. What should you do?",
    explanation:
      "Report the same day to your manager and IT. Early reporting is expected practice; deleting the chat quietly is not containment.",
    options: [
      { text: "Tell your manager and IT today, noting what was shared and where.", isCorrect: true },
      { text: "Delete the conversation and say nothing." },
      { text: "Wait to see whether anything happens." },
      { text: "Mention it at the next monthly meeting." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Which is the correct way to get AI help with a sensitive costing question?",
    explanation:
      "De-identification gives you the same analytical help with none of the exposure. Index the figures, remove the customer, describe the pattern.",
    options: [
      { text: "Describe the shape of the problem with indexed figures and no customer name.", isCorrect: true },
      { text: "Paste the costing sheet but delete the file afterwards." },
      { text: "Paste it into a tool that says it does not train on your data." },
      { text: "Paste it from a personal device instead of a work device." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Who is accountable when an AI-assisted report sent to a customer contains a serious error?",
    explanation: "The person who used and sent the output. This never transfers to the tool, to IT, or to whoever wrote the prompt template.",
    options: [
      { text: "The person who used the output and sent it.", isCorrect: true },
      { text: "The AI provider." },
      { text: "The IT department that approved the tool." },
      { text: "Whoever wrote the prompt template." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "EASY",
    type: "SINGLE",
    text: "A free browser extension promises to summarise any document with AI. Can you install it and use it on T&C documents?",
    explanation: "Only tools on the IT-approved list may be used with T&C data, whatever their cost or convenience.",
    options: [
      { text: "No — only IT-approved tools may be used with T&C data.", isCorrect: true },
      { text: "Yes, if it is free." },
      { text: "Yes, if you only use it on documents you wrote yourself." },
      { text: "Yes, if you uninstall it afterwards." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "An AI summary of a supplier contract states a penalty clause that you cannot find in the document. What is the correct conclusion?",
    explanation:
      "The model very likely invented a plausible clause. Trust the document, not the summary, and check the rest of the summary too.",
    options: [
      { text: "The clause is probably invented — trust the document and re-check the rest of the summary.", isCorrect: true },
      { text: "The clause exists somewhere and you missed it." },
      { text: "The AI is using a newer version of the contract." },
      { text: "The clause is implied by industry standard practice." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "Which practices reduce the risk of AI-driven bias in HR processes? Select all that apply.",
    explanation:
      "Structured human-applied criteria, forbidding automated ranking, watching for unsupplied assumptions and having a person decide are the effective controls.",
    options: [
      { text: "Use AI to build consistent evaluation criteria that a person then applies", isCorrect: true },
      { text: "Never let AI rank, score or screen out candidates", isCorrect: true },
      { text: "Check outputs for assumptions about age, gender or nationality that you never supplied", isCorrect: true },
      { text: "Trust the model more if it produces a diverse-looking shortlist" },
      { text: "Keep the decision, and the reasoning for it, with a named person", isCorrect: true },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "A production report generated with AI will be used to decide whether to invest in a new machine. What level of verification is required?",
    explanation:
      "Verification effort should scale with consequence. A capital decision requires every figure traced to source and the reasoning independently defensible.",
    options: [
      { text: "Full — every figure traced to source, and the reasoning defensible without reference to the AI.", isCorrect: true },
      { text: "Light — a quick read for obvious errors." },
      { text: "None — the underlying data came from our own systems." },
      { text: "Ask the AI to check its own work." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which statement about AI and confidential data is accurate?",
    explanation:
      "Once data is sent to an external service it is outside your control, whatever the provider's stated retention policy. Assume it cannot be recalled.",
    options: [
      { text: "Once data leaves for an external service, it is outside our control regardless of the stated policy.", isCorrect: true },
      { text: "Data is safe if the provider states it does not train on inputs." },
      { text: "Data is safe if you delete the conversation afterwards." },
      { text: "Data is safe if you use a paid account." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Your team wants to publish an AI-written technical article under a colleague's name. What is the main issue to resolve first?",
    explanation:
      "Accuracy and attribution. Every factual claim must be verified, and the organisation should be clear about how the content was produced.",
    options: [
      { text: "Every factual claim must be verified, and we should be clear about how it was produced.", isCorrect: true },
      { text: "Whether the AI tool's licence permits commercial use of the output." },
      { text: "Whether the article is long enough." },
      { text: "Nothing — AI-written content is treated like any other draft." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "Which of these are legitimate reasons to slow down an AI rollout? Select all that apply.",
    explanation:
      "Unclear data handling, no verification process, decisions affecting people, and no measurable baseline are all sound reasons to pause.",
    options: [
      { text: "It is unclear what data the tool sends and where", isCorrect: true },
      { text: "There is no defined verification step before outputs are used", isCorrect: true },
      { text: "The output would affect decisions about individual employees", isCorrect: true },
      { text: "Some employees are unfamiliar with the tool" },
      { text: "No baseline exists, so improvement could not be measured", isCorrect: true },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "A manager asks you to use AI to 'find out everything you can' about a job candidate. What is the right response?",
    explanation:
      "This is both a bias risk and a privacy issue. Evaluation should follow structured, job-relevant criteria applied consistently to every candidate.",
    options: [
      { text: "Decline, and propose structured job-relevant criteria applied equally to all candidates instead.", isCorrect: true },
      { text: "Do it, but only use publicly available information." },
      { text: "Do it, and let the manager decide what is relevant." },
      { text: "Do it, but do not write anything down." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "An internal AI assistant retrieves documents to answer questions. A production employee asks a question and receives content from an HR salary review. What went wrong?",
    explanation:
      "Permission filtering must happen before retrieval. If everything is retrievable and filtering is attempted afterwards, sensitive content reaches the model and the answer.",
    options: [
      { text: "Access permissions were not applied before retrieval, so restricted documents entered the context.", isCorrect: true },
      { text: "The model hallucinated the salary information." },
      { text: "The employee phrased the question incorrectly." },
      { text: "The model was trained on HR data." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "An AI tool reads incoming supplier emails and can send replies automatically. What is the most serious risk?",
    explanation:
      "A malicious email can contain instructions the model follows — prompt injection. Combined with the ability to send, that is a direct path to harm.",
    options: [
      { text: "A crafted email could contain instructions the model follows, and it can act on them without a human.", isCorrect: true },
      { text: "The replies might have grammatical errors." },
      { text: "The tool might be slow at busy times." },
      { text: "Suppliers might notice the replies are automated." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "ADVANCED",
    type: "MULTI",
    text: "Which controls would you require before an AI system is allowed to write to a production system? Select all that apply.",
    explanation:
      "Human confirmation on writes, full logging, hard iteration limits and read-only defaults are the standard controls for agentic systems.",
    options: [
      { text: "A human confirmation step before any write", isCorrect: true },
      { text: "Complete logging of every action taken", isCorrect: true },
      { text: "Hard limits on how many actions it may take", isCorrect: true },
      { text: "Read-only access by default, with writes as a justified exception", isCorrect: true },
      { text: "A faster model to reduce the chance of errors" },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "A well-liked AI workflow has been running for six months. An audit asks how you know its outputs are accurate. What is the strongest possible answer?",
    explanation:
      "A maintained test set plus regular sampling of real outputs against source is the only defensible evidence. Usage and satisfaction prove nothing about accuracy.",
    options: [
      { text: "'We maintain a test set with known-good answers, re-run it after every change, and sample live outputs against source weekly.'", isCorrect: true },
      { text: "'Nobody has complained about it.'" },
      { text: "'It is used by 200 employees every week.'" },
      { text: "'We use a leading commercial AI provider.'" },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "Which situation most clearly requires disclosing that AI was used?",
    explanation:
      "When AI materially shaped an analysis or recommendation that others will rely on, colleagues are entitled to know how it was produced.",
    options: [
      { text: "AI produced the analysis behind a recommendation going to the board.", isCorrect: true },
      { text: "AI fixed the grammar in an internal email." },
      { text: "AI suggested a subject line for a newsletter." },
      { text: "AI helped you find a synonym." },
    ],
  },
  {
    competency: "RESPONSIBLE_AI",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "You are asked to build a chatbot that answers employee questions from internal policy documents. Which design decision matters most for safety?",
    explanation:
      "Grounding every answer in retrieved policy text with a citation, and refusing when nothing relevant is retrieved, is what prevents invented policy.",
    options: [
      { text: "It must answer only from retrieved policy text, cite the section, and refuse when nothing relevant is found.", isCorrect: true },
      { text: "It should be trained on the policies so it knows them by heart." },
      { text: "It should always give an answer so employees are not frustrated." },
      { text: "It should use the largest model available." },
    ],
  },
];

/** Data & Automation Awareness — general employees, no programming required. */
export const DATA_QUESTIONS: QuestionSeed[] = [
  {
    competency: "DATA_AUTOMATION",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Which of these is structured data?",
    explanation:
      "Structured data has consistent fields and rows — a spreadsheet or a database table. Emails, photos and free-text notes are unstructured.",
    options: [
      { text: "A spreadsheet of orders with columns for date, customer, quantity and value.", isCorrect: true },
      { text: "A folder of scanned inspection photographs." },
      { text: "Six months of email correspondence with a supplier." },
      { text: "Handwritten notes from a shift handover." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "EASY",
    type: "SINGLE",
    text: "A task is done the same way every week with the same steps and no judgement calls. What does that suggest?",
    explanation:
      "Consistent, rule-based, repetitive tasks are the best automation candidates — and often need no AI at all, just a script.",
    options: [
      { text: "It is a strong automation candidate, and may not need AI at all.", isCorrect: true },
      { text: "It should be left alone because it already works." },
      { text: "It needs a machine learning model." },
      { text: "It should be done more often." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "EASY",
    type: "MULTI",
    text: "Which of these are unstructured data? Select all that apply.",
    explanation: "Free text, images and audio have no fixed fields. That is exactly why AI is useful for working with them.",
    options: [
      { text: "Free-text defect descriptions written by inspectors", isCorrect: true },
      { text: "Photographs of fabric faults", isCorrect: true },
      { text: "A table of monthly production quantities" },
      { text: "Recorded customer complaint calls", isCorrect: true },
      { text: "Supplier contract documents", isCorrect: true },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Why is inconsistent data entry a problem for analysis?",
    explanation:
      "If the same defect is recorded five different ways, it appears as five small problems rather than one large one, and never reaches the top of a Pareto.",
    options: [
      { text: "The same real issue splits across several categories and never appears as significant.", isCorrect: true },
      { text: "It makes files larger." },
      { text: "It slows down the computer." },
      { text: "It is only a problem if there is a lot of data." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "EASY",
    type: "SINGLE",
    text: "You want to know which defect type costs the most. What do you need first?",
    explanation:
      "Consistent categories are the prerequisite. Without them, no amount of analysis produces a trustworthy answer.",
    options: [
      { text: "Consistently categorised defect records with a cost attached.", isCorrect: true },
      { text: "A machine learning model." },
      { text: "More data of any kind." },
      { text: "A dashboard tool." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "MEDIUM",
    type: "SCENARIO",
    text: "Your team manually copies figures from five reports into one summary each week. What is the most sensible first step?",
    explanation:
      "Understanding where the data actually comes from is the prerequisite. Often the reports share one source and the whole step can be removed.",
    options: [
      { text: "Map where each figure originates — the five reports may share one source you can go to directly.", isCorrect: true },
      { text: "Build an AI tool to read the five reports." },
      { text: "Ask AI to do the copying each week in a chat." },
      { text: "Accept it as unavoidable manual work." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which task is genuinely well suited to AI rather than a simple script?",
    explanation:
      "AI earns its place on unstructured, judgement-adjacent tasks like categorising free text. Fixed-rule copying and arithmetic are better as scripts.",
    options: [
      { text: "Grouping thousands of free-text complaint descriptions into themes.", isCorrect: true },
      { text: "Copying column C from one spreadsheet to another every Monday." },
      { text: "Summing a column of numbers." },
      { text: "Renaming files according to a fixed pattern." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "What makes a process a good automation candidate? Select all that apply.",
    explanation:
      "High frequency, consistent rules, digital inputs and a clear definition of a correct result all point towards automation.",
    options: [
      { text: "It happens frequently", isCorrect: true },
      { text: "The rules are consistent and can be written down", isCorrect: true },
      { text: "The inputs are already digital", isCorrect: true },
      { text: "It is the most complex process in the department" },
      { text: "You can clearly define what a correct output looks like", isCorrect: true },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "You automate a weekly report. What must you also plan for?",
    explanation:
      "Automation fails silently. Someone must own it, notice when it breaks, and know what to do when the source format changes.",
    options: [
      { text: "Who notices when it breaks, and what happens when the source format changes.", isCorrect: true },
      { text: "How to make it run faster." },
      { text: "How to add more charts." },
      { text: "Nothing — automated processes maintain themselves." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "A dashboard shows a defect rate rising sharply. Before escalating, what should you check?",
    explanation:
      "A change in how or how much you inspect will move the rate without any change in real quality. Confusing the two sends teams after the wrong problem.",
    options: [
      { text: "Whether inspection volume or method changed over the same period.", isCorrect: true },
      { text: "Whether the dashboard colours are correct." },
      { text: "Whether other departments have seen the dashboard." },
      { text: "Whether the chart type is appropriate." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "ADVANCED",
    type: "SCENARIO",
    text: "You want to build a system that answers questions about your SOPs. What determines whether it works?",
    explanation:
      "Retrieval quality decides everything. If the wrong sections are retrieved, no model can produce a correct answer from them.",
    options: [
      { text: "Whether the right sections of the right SOP are retrieved and given to the model.", isCorrect: true },
      { text: "Which model is used." },
      { text: "How the question is phrased by the user." },
      { text: "How many SOPs exist in total." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "A team proposes automated visual defect detection. What is the most realistic first step?",
    explanation:
      "The labelled image dataset is the asset and takes months to build. Starting to photograph and label consistently is the step that makes anything later possible.",
    options: [
      { text: "Start photographing and labelling defects consistently to build a dataset.", isCorrect: true },
      { text: "Buy a system and pilot it next month." },
      { text: "Hire a machine learning engineer." },
      { text: "Wait for the technology to mature." },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "ADVANCED",
    type: "MULTI",
    text: "An automation saves 4 hours a week but breaks twice a month, each time taking 3 hours to fix. What should you consider? Select all that apply.",
    explanation:
      "Net benefit, why it breaks, whether the source can be stabilised, and who owns it are all relevant. The headline saving alone is misleading.",
    options: [
      { text: "The net saving after maintenance time", isCorrect: true },
      { text: "Why it breaks — usually an unstable input format", isCorrect: true },
      { text: "Whether the upstream source can be stabilised instead", isCorrect: true },
      { text: "Whether anyone owns it when its author is on leave", isCorrect: true },
      { text: "Whether a larger AI model would break less often" },
    ],
  },
  {
    competency: "DATA_AUTOMATION",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "Which is the best description of when AI should replace a rule-based script?",
    explanation:
      "Rules are cheaper, faster and fully predictable. Use AI only when the input varies in ways rules cannot capture — like free text or images.",
    options: [
      { text: "Only when the input varies in ways rules cannot capture, such as free text or images.", isCorrect: true },
      { text: "Whenever a newer AI tool becomes available." },
      { text: "Whenever the script is longer than 50 lines." },
      { text: "Whenever management asks for an AI project." },
    ],
  },
];

/** Technical AI — optional additional assessment for technical roles. */
export const TECHNICAL_QUESTIONS: QuestionSeed[] = [
  {
    competency: "TECHNICAL",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Where should an LLM provider API key live in a web application?",
    explanation: "Server-side environment variables only. Anything in the client bundle is public.",
    isTechnical: true,
    options: [
      { text: "In a server-side environment variable, never in the client bundle.", isCorrect: true },
      { text: "In a JavaScript constant, minified so it is hard to read." },
      { text: "In the database, encrypted at rest." },
      { text: "In a config file committed to the repository." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "EASY",
    type: "SINGLE",
    text: "What is an embedding?",
    explanation:
      "A numeric vector representing meaning, so semantically similar texts sit close together. It is the basis of semantic search and RAG.",
    isTechnical: true,
    options: [
      { text: "A numeric vector representing meaning, so similar texts are close together.", isCorrect: true },
      { text: "A compressed copy of a document." },
      { text: "The model's internal memory of a conversation." },
      { text: "A cached API response." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "EASY",
    type: "SINGLE",
    text: "Your API call returns HTTP 429. What does that mean and what should the client do?",
    explanation: "Rate limited. Retry with exponential backoff and respect any Retry-After header.",
    isTechnical: true,
    options: [
      { text: "Rate limited — retry with exponential backoff, honouring Retry-After.", isCorrect: true },
      { text: "Invalid API key — prompt the user to re-authenticate." },
      { text: "The model refused the request — rewrite the prompt." },
      { text: "The response was too long — reduce max_tokens." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "You ask a model to return JSON and it occasionally returns prose instead. What is the correct engineering response?",
    explanation:
      "Validate every response against a schema and handle failure. Model output is untrusted input, however well the prompt is written.",
    isTechnical: true,
    options: [
      { text: "Validate against a schema and handle the failure case explicitly.", isCorrect: true },
      { text: "Add 'ONLY RETURN JSON' in capitals and assume it complies." },
      { text: "Parse with a regular expression and hope for the best." },
      { text: "Retry indefinitely until valid JSON arrives." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "In a RAG system, answers are frequently wrong even though the documents contain the right information. Where do you look first?",
    explanation:
      "Retrieval. If the wrong chunks are returned, the model cannot answer correctly. Chunking strategy and retrieval quality dominate RAG performance.",
    isTechnical: true,
    options: [
      { text: "Retrieval — chunking strategy and whether the right passages are being returned.", isCorrect: true },
      { text: "The model — upgrade to a larger one." },
      { text: "The system prompt — make it more emphatic." },
      { text: "The temperature setting." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "MEDIUM",
    type: "MULTI",
    text: "Which are genuine security risks specific to LLM applications? Select all that apply.",
    explanation:
      "Prompt injection, excessive agency, insecure output handling and cross-permission data leakage are all AI-specific classes of risk.",
    isTechnical: true,
    options: [
      { text: "Prompt injection via untrusted retrieved content", isCorrect: true },
      { text: "Excessive agency — giving the model write access it does not need", isCorrect: true },
      { text: "Insecure output handling — rendering model output as HTML", isCorrect: true },
      { text: "Retrieving documents the requesting user is not permitted to see", isCorrect: true },
      { text: "The model consuming too much disk space" },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "What does 'temperature' control in a model API call?",
    explanation: "How much randomness is allowed in token selection. Lower is more deterministic; it does not make answers more factual.",
    isTechnical: true,
    options: [
      { text: "Randomness in token selection — lower is more repeatable, not more accurate.", isCorrect: true },
      { text: "How factually accurate the answer is." },
      { text: "How long the answer will be." },
      { text: "How fast the model responds." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "You need to process a 200-page document that exceeds the model's context window. What is the standard approach?",
    explanation:
      "Chunk the document, process or retrieve relevant chunks, then combine. Truncation silently loses content.",
    isTechnical: true,
    options: [
      { text: "Chunk it, process or retrieve the relevant chunks, then combine the results.", isCorrect: true },
      { text: "Truncate it to fit and accept the loss." },
      { text: "Compress the text by removing spaces." },
      { text: "Send it anyway — the API will handle it." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "An agent has tools for reading tickets, querying a database and sending emails. What is the minimum safe design?",
    explanation:
      "Reads may be autonomous; anything that acts outside the system needs confirmation, plus logging and hard iteration limits.",
    isTechnical: true,
    options: [
      { text: "Reads can run autonomously; sending requires human confirmation, with full logging and hard iteration limits.", isCorrect: true },
      { text: "Allow all three autonomously but log everything." },
      { text: "Allow all three but limit it to 100 iterations." },
      { text: "Allow all three and review the logs weekly." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "How should you evaluate whether a prompt change improved your AI feature?",
    explanation:
      "Re-run a fixed test set of real cases with known-good answers and compare. Anecdotes cannot detect regressions.",
    isTechnical: true,
    options: [
      { text: "Re-run a fixed test set of real cases with known-good answers and compare results.", isCorrect: true },
      { text: "Try a few examples by hand and see if they look better." },
      { text: "Ask the model to compare the two prompts." },
      { text: "Ship it and wait for user complaints." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "ADVANCED",
    type: "MULTI",
    text: "Which mitigations reduce prompt-injection risk in a document-reading assistant? Select all that apply.",
    explanation:
      "Treating retrieved content as data, confirming actions, restricting tools and separating instruction channels all help. A longer system prompt does not.",
    isTechnical: true,
    options: [
      { text: "Treat all retrieved content as untrusted data, never as instructions", isCorrect: true },
      { text: "Require human confirmation before any consequential action", isCorrect: true },
      { text: "Give the model the smallest possible tool set", isCorrect: true },
      { text: "Keep system instructions in a separate channel from user content", isCorrect: true },
      { text: "Write a longer, firmer system prompt telling it to ignore injected instructions" },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "When is fine-tuning a model the right choice over RAG?",
    explanation:
      "Fine-tuning teaches form — style, format, task shape. RAG supplies facts. Facts that change should never be baked into weights.",
    isTechnical: true,
    options: [
      { text: "When you need consistent style, format or task behaviour — not to teach it changing facts.", isCorrect: true },
      { text: "Whenever you have internal documents to make available." },
      { text: "Whenever RAG retrieval is slow." },
      { text: "Whenever the model's answers are wrong." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "What is the most common cause of an AI feature that works in development and fails in production?",
    explanation:
      "Real inputs are messier and more varied than the ones developers test with. The gap is almost always in input distribution, not model capability.",
    isTechnical: true,
    options: [
      { text: "Real input is far messier and more varied than the developer's test cases.", isCorrect: true },
      { text: "Production servers are slower." },
      { text: "The model version changed." },
      { text: "Users send too many requests." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "ADVANCED",
    type: "SINGLE",
    text: "You must log AI interactions for debugging, but inputs may contain personal data. What is the right approach?",
    explanation:
      "Redact or pseudonymise before writing to logs, set a retention period, and restrict access. Logs are a data store like any other.",
    isTechnical: true,
    options: [
      { text: "Redact personal data before logging, set retention limits, and restrict who can read the logs.", isCorrect: true },
      { text: "Log everything — logs are internal." },
      { text: "Log nothing, to be safe." },
      { text: "Log everything but delete it after a year." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "MEDIUM",
    type: "SINGLE",
    text: "Which SQL pattern should you reject in AI-generated code review?",
    explanation:
      "String concatenation of user input into SQL is injection. Parameterised queries are the only acceptable pattern.",
    isTechnical: true,
    options: [
      { text: "Building the query by concatenating user input into a string.", isCorrect: true },
      { text: "Using a parameterised query with bound values." },
      { text: "Using an ORM's query builder." },
      { text: "Using a prepared statement." },
    ],
  },
  {
    competency: "TECHNICAL",
    difficulty: "EASY",
    type: "SINGLE",
    text: "An AI assistant suggests a library function that does not exist in the documentation. What is happening?",
    explanation:
      "A hallucinated API — extremely common. Always check generated code against the actual library documentation.",
    isTechnical: true,
    options: [
      { text: "A hallucinated API — verify every generated call against the real documentation.", isCorrect: true },
      { text: "The library version installed is out of date." },
      { text: "The function is undocumented but exists." },
      { text: "The assistant is using a different programming language." },
    ],
  },
];
