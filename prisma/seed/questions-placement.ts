import type { QuestionSeed } from "./questions-core";

/**
 * The placement question bank.
 *
 * This is the first thing every employee at T&C ever does in the Academy, and
 * most of them are not technical and are not confident. So every question here
 * is deliberately EASY: a short stem, plain words, one clearly better answer,
 * and no jargon a machine operator would have to look up. It is a starting
 * point, not an exam — nobody passes or fails it.
 *
 * Everything is written in all three working languages, question and every
 * option, because a question an employee cannot read measures nothing. The
 * parity is enforced by tests/placement-i18n.test.ts.
 *
 * These live in their own bank (BANK_PLACEMENT) so they can never leak into
 * the final certification exam, which still has to discriminate.
 */

const BANK = "BANK_PLACEMENT";

const easy = (q: Omit<QuestionSeed, "difficulty" | "bank" | "type"> & { type?: QuestionSeed["type"] }): QuestionSeed => ({
  ...q,
  type: q.type ?? "SINGLE",
  difficulty: "EASY",
  bank: BANK,
});

// ---------------------------------------------------------------------------
// A — AI fundamentals (6)
// ---------------------------------------------------------------------------

const FUNDAMENTALS: QuestionSeed[] = [
  easy({
    competency: "FUNDAMENTALS",
    text: "What is a tool like ChatGPT or Gemini mainly good at?",
    textAr: "ما الذي تجيده أدوات مثل ChatGPT أو Gemini بشكل أساسي؟",
    textTr: "ChatGPT veya Gemini gibi araçlar esas olarak ne konuda iyidir?",
    explanation:
      "These tools work with language. They write, rewrite, summarise and explain. They are not calculators and not databases.",
    options: [
      {
        text: "Working with text — writing, rewriting, summarising and explaining",
        textAr: "التعامل مع النصوص — الكتابة وإعادة الصياغة والتلخيص والشرح",
        textTr: "Metinle çalışmak — yazmak, yeniden yazmak, özetlemek ve açıklamak",
        isCorrect: true,
      },
      {
        text: "Storing the company's official records",
        textAr: "تخزين السجلات الرسمية للشركة",
        textTr: "Şirketin resmî kayıtlarını saklamak",
      },
      {
        text: "Repairing machines on the production line",
        textAr: "إصلاح الماكينات في خط الإنتاج",
        textTr: "Üretim hattındaki makineleri onarmak",
      },
      {
        text: "Replacing the company's accounting system",
        textAr: "استبدال النظام المحاسبي للشركة",
        textTr: "Şirketin muhasebe sisteminin yerini almak",
      },
    ],
  }),
  easy({
    competency: "FUNDAMENTALS",
    text: "An AI assistant gives you an answer that sounds very confident. Does that mean it is correct?",
    textAr: "أعطاك مساعد ذكاء اصطناعي إجابة تبدو واثقة جدًا. هل يعني ذلك أنها صحيحة؟",
    textTr: "Bir yapay zekâ asistanı çok emin görünen bir cevap verdi. Bu, cevabın doğru olduğu anlamına gelir mi?",
    explanation:
      "Confidence and correctness are separate things. These tools always sound sure, including when they are wrong. Check anything that matters.",
    options: [
      {
        text: "No — it can sound sure and still be wrong, so important facts must be checked",
        textAr: "لا — يمكن أن تبدو واثقة وتكون خاطئة، لذلك يجب التحقق من المعلومات المهمة",
        textTr: "Hayır — emin görünüp yine de yanlış olabilir, önemli bilgiler doğrulanmalıdır",
        isCorrect: true,
      },
      {
        text: "Yes — a confident answer is a checked answer",
        textAr: "نعم — الإجابة الواثقة هي إجابة مُتحقَّق منها",
        textTr: "Evet — emin bir cevap, kontrol edilmiş bir cevaptır",
      },
      {
        text: "Yes, as long as the answer is long and detailed",
        textAr: "نعم، طالما كانت الإجابة طويلة ومفصّلة",
        textTr: "Cevap uzun ve ayrıntılı olduğu sürece evet",
      },
    ],
  }),
  easy({
    competency: "FUNDAMENTALS",
    type: "TRUE_FALSE",
    text: "True or false: AI tools can make mistakes.",
    textAr: "صح أم خطأ: يمكن لأدوات الذكاء الاصطناعي أن تخطئ.",
    textTr: "Doğru mu yanlış mı: Yapay zekâ araçları hata yapabilir.",
    explanation: "They can, and they do. That is why a person stays responsible for the result.",
    options: [
      { text: "True", textAr: "صح", textTr: "Doğru", isCorrect: true },
      { text: "False", textAr: "خطأ", textTr: "Yanlış" },
    ],
  }),
  easy({
    competency: "FUNDAMENTALS",
    text: "Do you need to know programming to use AI in your daily work at T&C?",
    textAr: "هل تحتاج إلى معرفة البرمجة لاستخدام الذكاء الاصطناعي في عملك اليومي في T&C؟",
    textTr: "T&C'de günlük işinizde yapay zekâ kullanmak için programlama bilmeniz gerekir mi?",
    explanation:
      "For everyday use you write in normal language, the same way you would ask a colleague. Programming is only needed to build AI systems, not to use them.",
    options: [
      {
        text: "No — you write in normal language, like asking a colleague",
        textAr: "لا — تكتب بلغة عادية، تمامًا كما تسأل زميلًا",
        textTr: "Hayır — bir meslektaşınıza sorar gibi normal dille yazarsınız",
        isCorrect: true,
      },
      {
        text: "Yes — you must know at least one programming language",
        textAr: "نعم — يجب أن تعرف لغة برمجة واحدة على الأقل",
        textTr: "Evet — en az bir programlama dili bilmelisiniz",
      },
      {
        text: "Yes — only the IT department can use these tools",
        textAr: "نعم — قسم تقنية المعلومات فقط يمكنه استخدام هذه الأدوات",
        textTr: "Evet — bu araçları yalnızca Bilgi Teknolojileri kullanabilir",
      },
    ],
  }),
  easy({
    competency: "FUNDAMENTALS",
    text: "Your machine has run the same fixed program for ten years. Is that artificial intelligence?",
    textAr: "ماكينتك تشغّل البرنامج الثابت نفسه منذ عشر سنوات. هل هذا ذكاء اصطناعي؟",
    textTr: "Makineniz on yıldır aynı sabit programı çalıştırıyor. Bu yapay zekâ mıdır?",
    explanation:
      "A fixed program follows rules a person wrote. AI learns patterns from examples and can handle situations nobody wrote a rule for. Most factory automation is the first kind.",
    options: [
      {
        text: "No — it follows fixed rules someone wrote. AI learns patterns from examples",
        textAr: "لا — إنه يتبع قواعد ثابتة كتبها شخص ما. أما الذكاء الاصطناعي فيتعلّم الأنماط من الأمثلة",
        textTr: "Hayır — biri tarafından yazılmış sabit kuralları izler. Yapay zekâ ise örneklerden örüntü öğrenir",
        isCorrect: true,
      },
      {
        text: "Yes — any machine that works on its own is AI",
        textAr: "نعم — أي ماكينة تعمل من تلقاء نفسها هي ذكاء اصطناعي",
        textTr: "Evet — kendi başına çalışan her makine yapay zekâdır",
      },
      {
        text: "Yes — automation and AI are two words for the same thing",
        textAr: "نعم — الأتمتة والذكاء الاصطناعي كلمتان لنفس الشيء",
        textTr: "Evet — otomasyon ve yapay zekâ aynı şeyin iki adıdır",
      },
    ],
  }),
  easy({
    competency: "FUNDAMENTALS",
    text: "Which of these is the AI most likely to get wrong?",
    textAr: "أي مما يلي هو الأرجح أن يخطئ فيه الذكاء الاصطناعي؟",
    textTr: "Yapay zekânın en çok hangisinde hata yapması beklenir?",
    explanation:
      "Specific facts — numbers, names, dates, references — are exactly what these tools invent. Rewriting text you supplied is much safer.",
    options: [
      {
        text: "A specific number, name or date it was not given",
        textAr: "رقم أو اسم أو تاريخ محدّد لم يُعطَ له",
        textTr: "Kendisine verilmemiş belirli bir sayı, isim veya tarih",
        isCorrect: true,
      },
      {
        text: "Making an email you wrote sound more polite",
        textAr: "جعل بريد إلكتروني كتبته أكثر لباقة",
        textTr: "Yazdığınız bir e-postayı daha kibar hâle getirmek",
      },
      {
        text: "Shortening a paragraph you pasted in",
        textAr: "اختصار فقرة قمت بلصقها",
        textTr: "Yapıştırdığınız bir paragrafı kısaltmak",
      },
    ],
  }),
];

// ---------------------------------------------------------------------------
// B — Practical workplace AI (7)
// ---------------------------------------------------------------------------

const WORKPLACE: QuestionSeed[] = [
  easy({
    competency: "WORKPLACE",
    text: "Which of these tasks is a good first thing to try AI on?",
    textAr: "أي من هذه المهام مناسبة كأول تجربة للذكاء الاصطناعي؟",
    textTr: "Bu görevlerden hangisi yapay zekâyı ilk denemek için uygundur?",
    explanation:
      "Start where a mistake is cheap and you can check the result yourself — drafting and summarising. Not where an error is expensive or final.",
    options: [
      {
        text: "Writing a first draft of a routine email you will read before sending",
        textAr: "كتابة مسودة أولى لبريد إلكتروني روتيني ستقرأه قبل إرساله",
        textTr: "Göndermeden önce okuyacağınız rutin bir e-postanın ilk taslağını yazmak",
        isCorrect: true,
      },
      {
        text: "Deciding which employee to promote",
        textAr: "تحديد أي موظف تتم ترقيته",
        textTr: "Hangi çalışanın terfi edeceğine karar vermek",
      },
      {
        text: "Approving a supplier payment",
        textAr: "اعتماد دفعة لمورّد",
        textTr: "Bir tedarikçi ödemesini onaylamak",
      },
      {
        text: "Signing off a quality release without inspection",
        textAr: "اعتماد الإفراج عن الجودة دون فحص",
        textTr: "Muayene yapmadan kalite onayı vermek",
      },
    ],
  }),
  easy({
    competency: "WORKPLACE",
    text: "You have a 20-page supplier proposal and 10 minutes before a meeting. What is the most useful way to use AI?",
    textAr: "لديك عرض من مورّد بـ 20 صفحة و10 دقائق قبل اجتماع. ما أفضل استخدام للذكاء الاصطناعي؟",
    textTr: "20 sayfalık bir tedarikçi teklifiniz ve toplantıya 10 dakikanız var. Yapay zekâyı en yararlı nasıl kullanırsınız?",
    explanation:
      "Ask it to summarise the document you give it and point you at the parts that matter. Then read those parts yourself before you speak.",
    options: [
      {
        text: "Ask it to summarise the document and list the main risks, then read those sections yourself",
        textAr: "اطلب منه تلخيص المستند وسرد أهم المخاطر، ثم اقرأ تلك الأجزاء بنفسك",
        textTr: "Belgeyi özetlemesini ve ana riskleri listelemesini isteyin, sonra o bölümleri kendiniz okuyun",
        isCorrect: true,
      },
      {
        text: "Ask it what it thinks of that supplier from memory",
        textAr: "اسأله عن رأيه في ذلك المورّد من ذاكرته",
        textTr: "O tedarikçi hakkında hafızasından ne düşündüğünü sorun",
      },
      {
        text: "Ask it to sign the contract for you",
        textAr: "اطلب منه توقيع العقد نيابة عنك",
        textTr: "Sözleşmeyi sizin adınıza imzalamasını isteyin",
      },
    ],
  }),
  easy({
    competency: "WORKPLACE",
    text: "AI has written a report for you. What should you do before sending it to your manager?",
    textAr: "كتب لك الذكاء الاصطناعي تقريرًا. ماذا يجب أن تفعل قبل إرساله إلى مديرك؟",
    textTr: "Yapay zekâ sizin için bir rapor yazdı. Yöneticinize göndermeden önce ne yapmalısınız?",
    explanation: "You are the author. Read it, check the numbers, and fix anything that is not true or not yours to say.",
    options: [
      {
        text: "Read it fully and check every figure and claim",
        textAr: "اقرأه بالكامل وتحقّق من كل رقم وكل ادعاء",
        textTr: "Tamamını okuyun ve her rakamı ve iddiayı kontrol edin",
        isCorrect: true,
      },
      {
        text: "Send it straight away to save time",
        textAr: "أرسله فورًا لتوفير الوقت",
        textTr: "Zaman kazanmak için hemen gönderin",
      },
      {
        text: "Only check the spelling",
        textAr: "تحقّق من الإملاء فقط",
        textTr: "Sadece yazımı kontrol edin",
      },
    ],
  }),
  easy({
    competency: "WORKPLACE",
    text: "Where does AI save the most time in normal office work?",
    textAr: "أين يوفّر الذكاء الاصطناعي أكبر وقت في العمل المكتبي العادي؟",
    textTr: "Normal ofis işinde yapay zekâ en çok nerede zaman kazandırır?",
    explanation:
      "The first draft is the slow part of most writing tasks. Editing a draft is much faster than starting from an empty page.",
    options: [
      {
        text: "Getting a first draft on the page, which you then edit",
        textAr: "الحصول على مسودة أولى تقوم بتحريرها بعد ذلك",
        textTr: "İlk taslağı ortaya çıkarmak, sonra siz düzenlersiniz",
        isCorrect: true,
      },
      {
        text: "Taking the final decision instead of you",
        textAr: "اتخاذ القرار النهائي بدلًا منك",
        textTr: "Nihai kararı sizin yerinize vermek",
      },
      {
        text: "Attending your meetings for you",
        textAr: "حضور اجتماعاتك نيابة عنك",
        textTr: "Toplantılarınıza sizin yerinize katılmak",
      },
    ],
  }),
  easy({
    competency: "WORKPLACE",
    text: "Your colleague says AI gave them a wrong number in a report. What is the right lesson?",
    textAr: "قال زميلك إن الذكاء الاصطناعي أعطاه رقمًا خاطئًا في تقرير. ما الدرس الصحيح؟",
    textTr: "Meslektaşınız yapay zekânın raporda yanlış bir sayı verdiğini söylüyor. Doğru ders nedir?",
    explanation:
      "The tool is useful and imperfect. The answer is not to ban it or to trust it blindly, but to check the parts that matter.",
    options: [
      {
        text: "Keep using it, but always check numbers against the real source",
        textAr: "استمر في استخدامه، لكن تحقّق دائمًا من الأرقام مقابل المصدر الحقيقي",
        textTr: "Kullanmaya devam edin, ama sayıları her zaman gerçek kaynakla karşılaştırın",
        isCorrect: true,
      },
      {
        text: "Never use AI again for anything",
        textAr: "لا تستخدم الذكاء الاصطناعي مرة أخرى لأي شيء",
        textTr: "Bir daha hiçbir şey için yapay zekâ kullanmayın",
      },
      {
        text: "Blame the colleague for using it",
        textAr: "لُم الزميل لاستخدامه",
        textTr: "Kullandığı için meslektaşınızı suçlayın",
      },
    ],
  }),
  easy({
    competency: "WORKPLACE",
    text: "Which of these should a person always decide, not AI?",
    textAr: "أي مما يلي يجب أن يقرره شخص دائمًا، وليس الذكاء الاصطناعي؟",
    textTr: "Bunlardan hangisine her zaman yapay zekâ değil bir insan karar vermelidir?",
    explanation:
      "Anything with consequences for a person, money or safety stays a human decision. AI can prepare the information behind it.",
    options: [
      {
        text: "A decision that affects someone's job, safety or money",
        textAr: "قرار يؤثر في وظيفة شخص أو سلامته أو أمواله",
        textTr: "Birinin işini, güvenliğini veya parasını etkileyen bir karar",
        isCorrect: true,
      },
      {
        text: "How to phrase the subject line of an email",
        textAr: "كيفية صياغة عنوان رسالة بريد إلكتروني",
        textTr: "Bir e-postanın konu satırının nasıl yazılacağı",
      },
      {
        text: "Whether a paragraph is too long",
        textAr: "ما إذا كانت فقرة طويلة أكثر من اللازم",
        textTr: "Bir paragrafın çok uzun olup olmadığı",
      },
    ],
  }),
  easy({
    competency: "WORKPLACE",
    text: "You do the same 30-minute report every week, the same way each time. What does that suggest?",
    textAr: "تُعِدّ التقرير نفسه كل أسبوع بالطريقة نفسها ويستغرق 30 دقيقة. ماذا يوحي ذلك؟",
    textTr: "Her hafta aynı 30 dakikalık raporu aynı şekilde hazırlıyorsunuz. Bu ne anlama gelir?",
    explanation:
      "Repetitive work with a fixed shape is the best place to start. Write the instruction once, reuse it every week.",
    options: [
      {
        text: "It is a good candidate — write the instruction once and reuse it each week",
        textAr: "إنها مرشّح جيد — اكتب التعليمات مرة واحدة وأعد استخدامها كل أسبوع",
        textTr: "İyi bir aday — talimatı bir kez yazın ve her hafta yeniden kullanın",
        isCorrect: true,
      },
      {
        text: "It should never be touched, because it already works",
        textAr: "يجب ألّا تمسّها أبدًا لأنها تعمل بالفعل",
        textTr: "Zaten çalıştığı için hiç dokunulmamalı",
      },
      {
        text: "It is too small to be worth improving",
        textAr: "إنها أصغر من أن تستحق التحسين",
        textTr: "İyileştirmeye değmeyecek kadar küçük",
      },
    ],
  }),
];

// ---------------------------------------------------------------------------
// C — Prompting (7)
// ---------------------------------------------------------------------------

const PROMPTING: QuestionSeed[] = [
  easy({
    competency: "PROMPTING",
    text: "Which instruction will give you a more useful answer?",
    textAr: "أي تعليمات ستعطيك إجابة أكثر فائدة؟",
    textTr: "Hangi talimat size daha yararlı bir cevap verir?",
    explanation:
      "Say who it is for, what you want, and how long. Vague requests get vague answers.",
    options: [
      {
        text: "\"Write a short, polite email to a supplier asking why delivery 4471 is three days late.\"",
        textAr: "«اكتب بريدًا إلكترونيًا قصيرًا ومهذبًا لمورّد تسأله فيه عن سبب تأخّر الشحنة 4471 ثلاثة أيام.»",
        textTr: "\"Bir tedarikçiye, 4471 numaralı sevkiyatın neden üç gün geciktiğini soran kısa ve kibar bir e-posta yaz.\"",
        isCorrect: true,
      },
      {
        text: "\"Write an email.\"",
        textAr: "«اكتب بريدًا إلكترونيًا.»",
        textTr: "\"Bir e-posta yaz.\"",
      },
      {
        text: "\"Supplier.\"",
        textAr: "«مورّد.»",
        textTr: "\"Tedarikçi.\"",
      },
    ],
  }),
  easy({
    competency: "PROMPTING",
    text: "You want a summary of a report. What is the most important thing to give the AI?",
    textAr: "تريد ملخّصًا لتقرير. ما أهم شيء يجب أن تعطيه للذكاء الاصطناعي؟",
    textTr: "Bir raporun özetini istiyorsunuz. Yapay zekâya vermeniz gereken en önemli şey nedir?",
    explanation:
      "It cannot summarise something it has never seen. Paste in the actual text, or attach the file.",
    options: [
      {
        text: "The report itself — paste the text or attach the file",
        textAr: "التقرير نفسه — الصق النص أو أرفق الملف",
        textTr: "Raporun kendisi — metni yapıştırın veya dosyayı ekleyin",
        isCorrect: true,
      },
      {
        text: "Only the title of the report",
        textAr: "عنوان التقرير فقط",
        textTr: "Sadece raporun başlığı",
      },
      {
        text: "The name of the person who wrote it",
        textAr: "اسم الشخص الذي كتبه",
        textTr: "Onu yazan kişinin adı",
      },
    ],
  }),
  easy({
    competency: "PROMPTING",
    text: "The answer you got is too long. What is the easiest fix?",
    textAr: "الإجابة التي حصلت عليها طويلة جدًا. ما أسهل حل؟",
    textTr: "Aldığınız cevap çok uzun. En kolay çözüm nedir?",
    explanation: "Just say so. These tools are built for conversation — ask again with the length you want.",
    options: [
      {
        text: "Reply and say \"make it shorter — five bullet points maximum\"",
        textAr: "ردّ وقل «اجعله أقصر — خمس نقاط كحد أقصى»",
        textTr: "Yanıt verin ve \"daha kısa yap — en fazla beş madde\" deyin",
        isCorrect: true,
      },
      {
        text: "Start a completely new conversation from the beginning",
        textAr: "ابدأ محادثة جديدة تمامًا من البداية",
        textTr: "Baştan tamamen yeni bir sohbet başlatın",
      },
      {
        text: "Delete the parts you do not want by hand and say nothing",
        textAr: "احذف الأجزاء غير المرغوبة يدويًا ولا تقل شيئًا",
        textTr: "İstemediğiniz kısımları elle silin ve bir şey söylemeyin",
      },
    ],
  }),
  easy({
    competency: "PROMPTING",
    text: "Which detail is worth adding to almost any request?",
    textAr: "أي تفصيل يستحق الإضافة إلى أي طلب تقريبًا؟",
    textTr: "Neredeyse her isteğe eklemeye değer ayrıntı hangisidir?",
    explanation:
      "Who will read it changes everything — the tone, the length and the words. It costs you four words to say.",
    options: [
      {
        text: "Who the answer is for — a customer, your manager, the production team",
        textAr: "لمن الإجابة — عميل، مديرك، فريق الإنتاج",
        textTr: "Cevabın kimin için olduğu — müşteri, yöneticiniz, üretim ekibi",
        isCorrect: true,
      },
      {
        text: "The time of day you are asking",
        textAr: "وقت اليوم الذي تسأل فيه",
        textTr: "Sorduğunuz günün saati",
      },
      {
        text: "How long you have worked at the company",
        textAr: "منذ متى تعمل في الشركة",
        textTr: "Şirkette ne kadar süredir çalıştığınız",
      },
    ],
  }),
  easy({
    competency: "PROMPTING",
    type: "TRUE_FALSE",
    text: "True or false: you can ask the AI to redo an answer differently.",
    textAr: "صح أم خطأ: يمكنك أن تطلب من الذكاء الاصطناعي إعادة الإجابة بشكل مختلف.",
    textTr: "Doğru mu yanlış mı: Yapay zekâdan bir cevabı farklı şekilde yeniden yapmasını isteyebilirsiniz.",
    explanation: "It is a conversation. The second and third attempt are usually much better than the first.",
    options: [
      { text: "True", textAr: "صح", textTr: "Doğru", isCorrect: true },
      { text: "False", textAr: "خطأ", textTr: "Yanlış" },
    ],
  }),
  easy({
    competency: "PROMPTING",
    text: "You want the answer as a table. What should you do?",
    textAr: "تريد الإجابة على شكل جدول. ماذا تفعل؟",
    textTr: "Cevabı tablo olarak istiyorsunuz. Ne yapmalısınız?",
    explanation: "Ask for the shape you want, and name the columns. You will get it.",
    options: [
      {
        text: "Ask for a table and name the columns you want",
        textAr: "اطلب جدولًا وحدّد أسماء الأعمدة التي تريدها",
        textTr: "Tablo isteyin ve istediğiniz sütunları belirtin",
        isCorrect: true,
      },
      {
        text: "Copy the answer into Excel and rebuild it yourself",
        textAr: "انسخ الإجابة إلى Excel وأعد بناءها بنفسك",
        textTr: "Cevabı Excel'e kopyalayıp kendiniz yeniden oluşturun",
      },
      {
        text: "Nothing — it decides the format, not you",
        textAr: "لا شيء — هو من يقرّر الشكل، وليس أنت",
        textTr: "Hiçbir şey — biçime siz değil o karar verir",
      },
    ],
  }),
  easy({
    competency: "PROMPTING",
    text: "Which of these is the best way to end an important request?",
    textAr: "أي مما يلي أفضل طريقة لإنهاء طلب مهم؟",
    textTr: "Önemli bir isteği bitirmenin en iyi yolu hangisidir?",
    explanation:
      "Asking it to flag what it is unsure about turns a black box into something you can check quickly.",
    options: [
      {
        text: "\"Tell me which parts you are not sure about.\"",
        textAr: "«أخبرني بالأجزاء التي لست متأكدًا منها.»",
        textTr: "\"Hangi kısımlardan emin olmadığını söyle.\"",
        isCorrect: true,
      },
      {
        text: "\"Make sure everything you say is correct.\"",
        textAr: "«تأكّد من أن كل ما تقوله صحيح.»",
        textTr: "\"Söylediğin her şeyin doğru olduğundan emin ol.\"",
      },
      {
        text: "\"Answer quickly.\"",
        textAr: "«أجب بسرعة.»",
        textTr: "\"Hızlı cevap ver.\"",
      },
    ],
  }),
];

// ---------------------------------------------------------------------------
// D — Responsible AI and information security (6)
// ---------------------------------------------------------------------------

const RESPONSIBLE_AI: QuestionSeed[] = [
  easy({
    competency: "RESPONSIBLE_AI",
    text: "Which of these should you NOT paste into a public AI tool?",
    textAr: "أي مما يلي يجب ألّا تلصقه في أداة ذكاء اصطناعي عامة؟",
    textTr: "Bunlardan hangisini herkese açık bir yapay zekâ aracına YAPIŞTIRMAMALISINIZ?",
    explanation:
      "Customer lists, prices, salaries, personal data and anything under a supplier agreement stay inside T&C systems.",
    options: [
      {
        text: "A customer list with names, prices and contact details",
        textAr: "قائمة عملاء تحتوي على أسماء وأسعار وبيانات اتصال",
        textTr: "İsimler, fiyatlar ve iletişim bilgileri içeren bir müşteri listesi",
        isCorrect: true,
      },
      {
        text: "A paragraph from a public news article",
        textAr: "فقرة من مقال إخباري منشور للعامة",
        textTr: "Herkese açık bir haber yazısından bir paragraf",
      },
      {
        text: "A general question about how to write a polite email",
        textAr: "سؤال عام عن كيفية كتابة بريد إلكتروني مهذّب",
        textTr: "Kibar bir e-posta nasıl yazılır sorusu",
      },
    ],
  }),
  easy({
    competency: "RESPONSIBLE_AI",
    text: "You need AI help with a document that contains employee names and salaries. What do you do?",
    textAr: "تحتاج مساعدة الذكاء الاصطناعي في مستند يحتوي على أسماء موظفين ورواتبهم. ماذا تفعل؟",
    textTr: "İçinde çalışan adları ve maaşları olan bir belgede yapay zekâ yardımına ihtiyacınız var. Ne yaparsınız?",
    explanation:
      "Remove the identifying details first, or use a tool T&C has approved for this. The task usually works fine without the real names.",
    options: [
      {
        text: "Remove the names and salaries first, or use an approved T&C tool",
        textAr: "احذف الأسماء والرواتب أولًا، أو استخدم أداة معتمدة من T&C",
        textTr: "Önce isimleri ve maaşları kaldırın ya da T&C'nin onayladığı bir aracı kullanın",
        isCorrect: true,
      },
      {
        text: "Paste the whole document — the tool will keep it private",
        textAr: "الصق المستند بالكامل — الأداة ستحافظ على خصوصيته",
        textTr: "Belgenin tamamını yapıştırın — araç gizli tutar",
      },
      {
        text: "Paste it, but ask the tool to forget it afterwards",
        textAr: "الصقه، ثم اطلب من الأداة أن تنساه بعد ذلك",
        textTr: "Yapıştırın, sonra araçtan unutmasını isteyin",
      },
    ],
  }),
  easy({
    competency: "RESPONSIBLE_AI",
    type: "TRUE_FALSE",
    text: "True or false: if AI writes something and it turns out to be wrong, the person who sent it is still responsible.",
    textAr: "صح أم خطأ: إذا كتب الذكاء الاصطناعي شيئًا وتبيّن أنه خاطئ، يظل الشخص الذي أرسله مسؤولًا.",
    textTr: "Doğru mu yanlış mı: Yapay zekâ bir şey yazdı ve yanlış çıktıysa, onu gönderen kişi yine de sorumludur.",
    explanation: "The tool is not accountable. You are. That does not change because you used AI to draft it.",
    options: [
      { text: "True", textAr: "صح", textTr: "Doğru", isCorrect: true },
      { text: "False", textAr: "خطأ", textTr: "Yanlış" },
    ],
  }),
  easy({
    competency: "RESPONSIBLE_AI",
    text: "An AI tool asks you to sign in with your work email and password. What should you do?",
    textAr: "طلبت منك أداة ذكاء اصطناعي تسجيل الدخول ببريدك الإلكتروني وكلمة مرور العمل. ماذا تفعل؟",
    textTr: "Bir yapay zekâ aracı iş e-postanız ve şifrenizle giriş yapmanızı istiyor. Ne yapmalısınız?",
    explanation:
      "Your work password goes into T&C systems only. Check with IT before signing into any tool with company credentials.",
    options: [
      {
        text: "Do not enter your work password — check with IT first",
        textAr: "لا تُدخل كلمة مرور العمل — راجع قسم تقنية المعلومات أولًا",
        textTr: "İş şifrenizi girmeyin — önce Bilgi Teknolojileri'ne danışın",
        isCorrect: true,
      },
      {
        text: "Enter it — it is faster than creating another account",
        textAr: "أدخلها — أسرع من إنشاء حساب آخر",
        textTr: "Girin — başka bir hesap açmaktan daha hızlı",
      },
      {
        text: "Enter it if the website looks professional",
        textAr: "أدخلها إذا بدا الموقع احترافيًا",
        textTr: "Site profesyonel görünüyorsa girin",
      },
    ],
  }),
  easy({
    competency: "RESPONSIBLE_AI",
    text: "AI gives you a statistic to put in a customer presentation. What should you do first?",
    textAr: "أعطاك الذكاء الاصطناعي إحصائية لوضعها في عرض تقديمي لعميل. ماذا تفعل أولًا؟",
    textTr: "Yapay zekâ, müşteri sunumuna koymanız için bir istatistik verdi. Önce ne yapmalısınız?",
    explanation:
      "Numbers going to a customer must come from a source you can name. If you cannot find the source, do not use the number.",
    options: [
      {
        text: "Find the real source. If you cannot, do not use the number",
        textAr: "ابحث عن المصدر الحقيقي. إن لم تجده، لا تستخدم الرقم",
        textTr: "Gerçek kaynağı bulun. Bulamazsanız o sayıyı kullanmayın",
        isCorrect: true,
      },
      {
        text: "Use it — it came from an AI, so it is from the internet",
        textAr: "استخدمه — جاء من ذكاء اصطناعي، إذن هو من الإنترنت",
        textTr: "Kullanın — yapay zekâdan geldi, yani internetten",
      },
      {
        text: "Use it but write the number in a smaller font",
        textAr: "استخدمه لكن اكتب الرقم بخط أصغر",
        textTr: "Kullanın ama sayıyı daha küçük yazın",
      },
    ],
  }),
  easy({
    competency: "RESPONSIBLE_AI",
    text: "Who at T&C is allowed to decide that AI output is good enough to act on?",
    textAr: "من في T&C يحقّ له أن يقرّر أن مخرجات الذكاء الاصطناعي جيدة بما يكفي للتصرّف بناءً عليها؟",
    textTr: "T&C'de yapay zekâ çıktısının üzerine iş yapılacak kadar iyi olduğuna kim karar verebilir?",
    explanation:
      "The responsible person for that piece of work, the same as before AI existed. The tool does not approve its own output.",
    options: [
      {
        text: "The person responsible for that work, exactly as before",
        textAr: "الشخص المسؤول عن ذلك العمل، تمامًا كما كان من قبل",
        textTr: "O işten sorumlu kişi, tıpkı eskisi gibi",
        isCorrect: true,
      },
      {
        text: "The AI tool itself",
        textAr: "أداة الذكاء الاصطناعي نفسها",
        textTr: "Yapay zekâ aracının kendisi",
      },
      {
        text: "Whoever typed the request",
        textAr: "أيًّا كان من كتب الطلب",
        textTr: "İsteği kim yazdıysa o",
      },
    ],
  }),
];

// ---------------------------------------------------------------------------
// E — Data and automation awareness (4)
// ---------------------------------------------------------------------------

const DATA: QuestionSeed[] = [
  easy({
    competency: "DATA_AUTOMATION",
    text: "You have a spreadsheet of last month's production output. How can AI help most?",
    textAr: "لديك جدول بيانات لإنتاج الشهر الماضي. كيف يساعدك الذكاء الاصطناعي أكثر؟",
    textTr: "Geçen ayın üretim çıktısını içeren bir tablonuz var. Yapay zekâ en çok nasıl yardımcı olur?",
    explanation:
      "Give it the data and ask it to explain what stands out. It works with what you provide — not with data it has never seen.",
    options: [
      {
        text: "Give it the data and ask what stands out and why",
        textAr: "أعطه البيانات واسأله عمّا يلفت النظر ولماذا",
        textTr: "Veriyi verin ve neyin dikkat çektiğini, nedenini sorun",
        isCorrect: true,
      },
      {
        text: "Ask it what your factory produced last month without showing it anything",
        textAr: "اسأله عمّا أنتجه مصنعك الشهر الماضي دون أن تريه شيئًا",
        textTr: "Hiçbir şey göstermeden fabrikanızın geçen ay ne ürettiğini sorun",
      },
      {
        text: "Ask it to connect to the production machines directly",
        textAr: "اطلب منه الاتصال بماكينات الإنتاج مباشرة",
        textTr: "Üretim makinelerine doğrudan bağlanmasını isteyin",
      },
    ],
  }),
  easy({
    competency: "DATA_AUTOMATION",
    text: "Which task is the best fit for automation?",
    textAr: "أي مهمة هي الأنسب للأتمتة؟",
    textTr: "Hangi görev otomasyona en uygundur?",
    explanation: "Same steps, same order, every time — that is what automation is for.",
    options: [
      {
        text: "Copying the same figures into the same report every week",
        textAr: "نسخ الأرقام نفسها إلى التقرير نفسه كل أسبوع",
        textTr: "Her hafta aynı rakamları aynı rapora kopyalamak",
        isCorrect: true,
      },
      {
        text: "Deciding how to handle an unhappy customer",
        textAr: "تحديد كيفية التعامل مع عميل غير راضٍ",
        textTr: "Memnuniyetsiz bir müşteriyle nasıl ilgilenileceğine karar vermek",
      },
      {
        text: "Negotiating a new supplier contract",
        textAr: "التفاوض على عقد مورّد جديد",
        textTr: "Yeni bir tedarikçi sözleşmesini müzakere etmek",
      },
    ],
  }),
  easy({
    competency: "DATA_AUTOMATION",
    text: "You ask AI to add up a column of numbers. What should you do with the total?",
    textAr: "طلبت من الذكاء الاصطناعي جمع عمود من الأرقام. ماذا تفعل بالمجموع؟",
    textTr: "Yapay zekâdan bir sütundaki sayıları toplamasını istediniz. Toplamla ne yapmalısınız?",
    explanation:
      "These tools handle language well and arithmetic less reliably. For a number that matters, check it in Excel.",
    options: [
      {
        text: "Check it in Excel — these tools are better with words than with sums",
        textAr: "تحقّق منه في Excel — هذه الأدوات أفضل مع الكلمات منها مع الحسابات",
        textTr: "Excel'de kontrol edin — bu araçlar sayılardan çok kelimelerde iyidir",
        isCorrect: true,
      },
      {
        text: "Use it directly — computers never make arithmetic mistakes",
        textAr: "استخدمه مباشرة — الحواسيب لا تخطئ في الحساب أبدًا",
        textTr: "Doğrudan kullanın — bilgisayarlar aritmetikte hata yapmaz",
      },
      {
        text: "Ask it a second time and use whichever total is bigger",
        textAr: "اسأله مرة ثانية واستخدم المجموع الأكبر",
        textTr: "Bir kez daha sorun ve büyük olan toplamı kullanın",
      },
    ],
  }),
  easy({
    competency: "DATA_AUTOMATION",
    type: "TRUE_FALSE",
    text: "True or false: AI can only work with data you actually give it.",
    textAr: "صح أم خطأ: لا يستطيع الذكاء الاصطناعي العمل إلا بالبيانات التي تعطيها له فعليًا.",
    textTr: "Doğru mu yanlış mı: Yapay zekâ yalnızca gerçekten verdiğiniz verilerle çalışabilir.",
    explanation:
      "It has no access to T&C's systems. If you did not paste it in or attach it, the tool is guessing.",
    options: [
      { text: "True", textAr: "صح", textTr: "Doğru", isCorrect: true },
      { text: "False", textAr: "خطأ", textTr: "Yanlış" },
    ],
  }),
];

export const PLACEMENT_QUESTIONS: QuestionSeed[] = [
  ...FUNDAMENTALS,
  ...WORKPLACE,
  ...PROMPTING,
  ...RESPONSIBLE_AI,
  ...DATA,
];
