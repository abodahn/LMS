/**
 * Builds the free-course catalogue from YouTube.
 *
 *   npx tsx scripts/harvest-courses.mts              # harvest, verify, import
 *   npx tsx scripts/harvest-courses.mts --dry        # write the CSV, import nothing
 *   npx tsx scripts/harvest-courses.mts --per 12     # more results per topic/language
 *
 * Why scrape rather than hand-write a list: a catalogue is only worth having if
 * the links open. Every row here comes back from a live search and is then
 * confirmed through YouTube's oEmbed endpoint, which 404s for anything deleted,
 * private or non-embeddable. Titles, channel names and runtimes are whatever
 * YouTube returned — nothing about the course itself is invented. The only text
 * this file writes is the one-line summary per topic, in all three languages,
 * which describes the topic rather than making claims about the video.
 *
 * Re-running is safe: codes are derived from the video id, so a second run
 * updates rows instead of duplicating them.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { validateCourseRows, commitCourseImport, COURSE_IMPORT_COLUMNS } from "../src/lib/import/courses";
import { writtenIn, onTopic } from "../src/lib/import/relevance";
import { youTubeOEmbedUrl } from "../src/lib/youtube";
import { assertSearchScrapingAllowed } from "../src/lib/import/youtube-search";

// This script carries its own copy of the YouTube search, so the guard is
// checked here as well: retired for the reasons in youtube-search.ts.
assertSearchScrapingAllowed();

type Lang = "en" | "ar" | "tr";
type Trio = Record<Lang, string>;

type Topic = {
  id: string;
  category: string;
  level: "L0" | "L1" | "L2" | "L3" | "L4";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  technical?: boolean;
  competencies?: string;
  queries: Trio;
  blurb: Trio;
};

// ---------------------------------------------------------------------------
// What to look for. Half AI, half the people skills the academy is also meant
// to cover; every topic is searched once per language.
// ---------------------------------------------------------------------------
const TOPICS: Topic[] = [
  {
    id: "AI-INTRO",
    category: "FOUNDATIONS",
    level: "L1",
    difficulty: "BEGINNER",
    competencies: "FUNDAMENTALS:4",
    queries: {
      en: "introduction to artificial intelligence full course for beginners",
      ar: "مقدمة في الذكاء الاصطناعي كورس كامل للمبتدئين",
      tr: "yapay zeka nedir sıfırdan tam kurs başlangıç",
    },
    blurb: {
      en: "An introduction to what artificial intelligence is, what it can and cannot do, and the vocabulary used around it at work.",
      ar: "مقدمة تشرح ما هو الذكاء الاصطناعي، وما يمكنه وما لا يمكنه فعله، والمصطلحات المستخدمة حوله في بيئة العمل.",
      tr: "Yapay zekânın ne olduğunu, neyi yapıp neyi yapamadığını ve iş ortamında kullanılan terimleri tanıtan bir giriş.",
    },
  },
  {
    id: "AI-CHATGPT",
    category: "GENERATIVE_AI",
    level: "L1",
    difficulty: "BEGINNER",
    competencies: "WORKPLACE:4",
    queries: {
      en: "ChatGPT full tutorial for beginners how to use at work",
      ar: "شرح ChatGPT كامل للمبتدئين واستخدامه في العمل",
      tr: "ChatGPT nasıl kullanılır tam eğitim iş hayatında",
    },
    blurb: {
      en: "Hands-on use of ChatGPT for everyday office work: drafting, summarising, rewriting and checking your own output.",
      ar: "استخدام عملي لـ ChatGPT في أعمال المكتب اليومية: الصياغة والتلخيص وإعادة الكتابة ومراجعة مخرجاتك.",
      tr: "ChatGPT'yi günlük ofis işlerinde kullanma: taslak yazma, özetleme, yeniden yazma ve kendi çıktınızı denetleme.",
    },
  },
  {
    id: "AI-PROMPT",
    category: "PROMPTING",
    level: "L2",
    difficulty: "BEGINNER",
    competencies: "PROMPTING:5",
    queries: {
      en: "prompt engineering full course practical examples",
      ar: "هندسة الأوامر برومبت انجنيرينج كورس كامل أمثلة عملية",
      tr: "prompt mühendisliği tam kurs pratik örnekler",
    },
    blurb: {
      en: "Writing prompts that give context, an objective, constraints and a required output, then checking the result before you use it.",
      ar: "كتابة أوامر تتضمّن السياق والهدف والقيود والمخرجات المطلوبة، ثم التحقق من النتيجة قبل استخدامها.",
      tr: "Bağlam, hedef, kısıt ve istenen çıktıyı içeren istemler yazmak ve sonucu kullanmadan önce doğrulamak.",
    },
  },
  {
    id: "AI-GENAI",
    category: "GENERATIVE_AI",
    level: "L2",
    difficulty: "INTERMEDIATE",
    competencies: "FUNDAMENTALS:2,WORKPLACE:3",
    queries: {
      en: "generative AI full course explained",
      ar: "الذكاء الاصطناعي التوليدي كورس كامل شرح",
      tr: "üretken yapay zeka tam kurs anlatım",
    },
    blurb: {
      en: "How generative models produce text and images, where the output is reliable, and where it needs a human check.",
      ar: "كيف تُنتج النماذج التوليدية النصوص والصور، ومتى تكون المخرجات موثوقة، ومتى تحتاج إلى مراجعة بشرية.",
      tr: "Üretken modellerin metin ve görsel üretme biçimi, çıktının nerede güvenilir olduğu ve nerede insan denetimi gerektirdiği.",
    },
  },
  {
    id: "AI-OFFICE",
    category: "ROLE_SPECIFIC",
    level: "L2",
    difficulty: "BEGINNER",
    competencies: "WORKPLACE:5",
    queries: {
      en: "AI tools for office productivity tutorial full",
      ar: "أدوات الذكاء الاصطناعي لزيادة الإنتاجية في العمل شرح كامل",
      tr: "ofis işlerinde yapay zeka araçları verimlilik eğitimi",
    },
    blurb: {
      en: "The AI tools that fit ordinary office tasks — documents, mail, meetings and reporting — and how to fold them into a working day.",
      ar: "أدوات الذكاء الاصطناعي المناسبة لمهام المكتب المعتادة — المستندات والبريد والاجتماعات والتقارير — وكيفية إدخالها في يوم العمل.",
      tr: "Sıradan ofis işlerine uyan yapay zekâ araçları — belgeler, e-posta, toplantılar ve raporlama — ve bunları iş gününe katma yolları.",
    },
  },
  {
    id: "AI-COPILOT",
    category: "ROLE_SPECIFIC",
    level: "L2",
    difficulty: "BEGINNER",
    competencies: "WORKPLACE:4",
    queries: {
      en: "Microsoft Copilot 365 full tutorial Word Excel Outlook",
      ar: "شرح مايكروسوفت كوبايلوت 365 كامل وورد اكسل اوتلوك",
      tr: "Microsoft Copilot 365 tam eğitim Word Excel Outlook",
    },
    blurb: {
      en: "Using Copilot inside the Microsoft 365 apps most work already runs on, and knowing what it is drawing on when it answers.",
      ar: "استخدام كوبايلوت داخل تطبيقات مايكروسوفت 365 التي يعتمد عليها العمل بالفعل، ومعرفة مصادره عند الإجابة.",
      tr: "Copilot'u işin zaten yürüdüğü Microsoft 365 uygulamalarında kullanmak ve yanıt verirken neye dayandığını bilmek.",
    },
  },
  {
    id: "AI-EXCEL",
    category: "DATA",
    level: "L2",
    difficulty: "BEGINNER",
    competencies: "DATA_AUTOMATION:4",
    queries: {
      en: "Excel with AI data analysis full course",
      ar: "تحليل البيانات في الاكسل مع الذكاء الاصطناعي كورس كامل",
      tr: "Excel veri analizi yapay zeka ile tam kurs",
    },
    blurb: {
      en: "Turning a spreadsheet into an answer: cleaning data, building the summary, and using AI to speed up the parts that are mechanical.",
      ar: "تحويل جدول البيانات إلى إجابة: تنظيف البيانات وبناء الملخص واستخدام الذكاء الاصطناعي لتسريع الأجزاء الآلية.",
      tr: "Bir tabloyu cevaba dönüştürmek: veriyi temizlemek, özeti kurmak ve mekanik kısımları yapay zekâ ile hızlandırmak.",
    },
  },
  {
    id: "AI-DATA",
    category: "DATA",
    level: "L2",
    difficulty: "INTERMEDIATE",
    competencies: "DATA_AUTOMATION:5",
    queries: {
      en: "data analysis for beginners full course dashboard",
      ar: "تحليل البيانات للمبتدئين كورس كامل لوحات المعلومات",
      tr: "veri analizi sıfırdan tam kurs gösterge paneli",
    },
    blurb: {
      en: "Reading data honestly: what a chart is claiming, which comparisons hold, and how to build a dashboard someone can act on.",
      ar: "قراءة البيانات بأمانة: ما الذي يدّعيه الرسم البياني، وأي المقارنات صحيحة، وكيف تبني لوحة معلومات قابلة للتنفيذ.",
      tr: "Veriyi dürüstçe okumak: bir grafiğin ne iddia ettiği, hangi karşılaştırmaların geçerli olduğu ve eyleme dönüşen bir pano kurmak.",
    },
  },
  {
    id: "AI-AUTOMATION",
    category: "DATA",
    level: "L3",
    difficulty: "INTERMEDIATE",
    competencies: "DATA_AUTOMATION:5",
    queries: {
      en: "no code automation workflow tutorial full course",
      ar: "أتمتة المهام بدون برمجة كورس كامل",
      tr: "kod yazmadan otomasyon iş akışı tam kurs",
    },
    blurb: {
      en: "Automating a repetitive process end to end without writing code, and deciding which steps should stay under human control.",
      ar: "أتمتة عملية متكرّرة من بدايتها إلى نهايتها دون كتابة كود، وتحديد الخطوات التي يجب أن تبقى تحت سيطرة بشرية.",
      tr: "Tekrarlayan bir süreci kod yazmadan uçtan uca otomatikleştirmek ve hangi adımların insan denetiminde kalması gerektiğine karar vermek.",
    },
  },
  {
    id: "AI-RESPONSIBLE",
    category: "RESPONSIBLE_AI",
    level: "L2",
    difficulty: "BEGINNER",
    competencies: "RESPONSIBLE_AI:5",
    queries: {
      en: "AI ethics privacy and data security at work course",
      ar: "أخلاقيات الذكاء الاصطناعي وخصوصية وأمن البيانات في العمل",
      tr: "yapay zeka etiği gizlilik ve veri güvenliği kurumsal eğitim",
    },
    blurb: {
      en: "What must never be pasted into a public AI tool, how bias enters a model, and who stays accountable for an AI-assisted decision.",
      ar: "ما الذي يجب ألا يُلصق أبدًا في أداة ذكاء اصطناعي عامة، وكيف يتسرّب التحيّز إلى النموذج، ومن يتحمّل مسؤولية القرار المدعوم بالذكاء الاصطناعي.",
      tr: "Herkese açık bir yapay zekâ aracına asla yapıştırılmaması gerekenler, önyargının modele nasıl girdiği ve yapay zekâ destekli bir kararın sorumluluğunun kimde kaldığı.",
    },
  },
  {
    id: "AI-BUSINESS",
    category: "ROLE_SPECIFIC",
    level: "L3",
    difficulty: "INTERMEDIATE",
    competencies: "WORKPLACE:4",
    queries: {
      en: "AI for business strategy and operations course",
      ar: "الذكاء الاصطناعي في الأعمال والاستراتيجية والعمليات كورس",
      tr: "işletmeler için yapay zeka strateji ve operasyon eğitimi",
    },
    blurb: {
      en: "Where AI actually changes a business process, what it costs to run, and how to tell a real use case from a demonstration.",
      ar: "أين يغيّر الذكاء الاصطناعي عملية العمل فعليًا، وما تكلفة تشغيله، وكيف تميّز حالة استخدام حقيقية من مجرد عرض توضيحي.",
      tr: "Yapay zekânın bir iş sürecini gerçekten nerede değiştirdiği, işletme maliyeti ve gerçek bir kullanım senaryosunu gösteriden ayırmak.",
    },
  },
  {
    id: "AI-MANUFACTURING",
    category: "ROLE_SPECIFIC",
    level: "L3",
    difficulty: "INTERMEDIATE",
    competencies: "WORKPLACE:3,DATA_AUTOMATION:2",
    queries: {
      en: "AI in manufacturing supply chain and quality control",
      ar: "الذكاء الاصطناعي في التصنيع وسلاسل الإمداد ومراقبة الجودة",
      tr: "üretimde yapay zeka tedarik zinciri ve kalite kontrol",
    },
    blurb: {
      en: "AI applied on the factory side: demand planning, quality inspection and the data a production line has to produce first.",
      ar: "الذكاء الاصطناعي في المصنع: تخطيط الطلب وفحص الجودة والبيانات التي يجب أن ينتجها خط الإنتاج أولًا.",
      tr: "Fabrika tarafında yapay zekâ: talep planlama, kalite denetimi ve üretim hattının önce üretmesi gereken veri.",
    },
  },
  {
    id: "AI-ML",
    category: "TECHNICAL",
    level: "L4",
    difficulty: "ADVANCED",
    technical: true,
    competencies: "TECHNICAL:5",
    queries: {
      en: "machine learning full course python",
      ar: "تعلم الآلة كورس كامل بايثون",
      tr: "makine öğrenmesi tam kurs python",
    },
    blurb: {
      en: "Machine learning in practice with Python: how a model is trained, evaluated, and why a good score can still be the wrong answer.",
      ar: "تعلّم الآلة عمليًا باستخدام بايثون: كيف يُدرَّب النموذج ويُقيَّم، ولماذا قد تكون الدرجة الجيدة إجابة خاطئة رغم ذلك.",
      tr: "Python ile uygulamalı makine öğrenmesi: bir modelin nasıl eğitildiği, değerlendirildiği ve iyi bir skorun neden yine de yanlış cevap olabileceği.",
    },
  },
  {
    id: "AI-LLM",
    category: "TECHNICAL",
    level: "L4",
    difficulty: "ADVANCED",
    technical: true,
    competencies: "TECHNICAL:4,FUNDAMENTALS:2",
    queries: {
      en: "large language models LLM full course how they work",
      ar: "النماذج اللغوية الكبيرة كورس كامل كيف تعمل",
      tr: "büyük dil modelleri LLM tam kurs nasıl çalışır",
    },
    blurb: {
      en: "What a large language model is doing when it answers — tokens, context, and the failure modes that follow from the architecture.",
      ar: "ما الذي يفعله النموذج اللغوي الكبير عند الإجابة — الرموز والسياق وأنماط الفشل الناتجة عن بنيته.",
      tr: "Büyük bir dil modelinin yanıt verirken ne yaptığı — belirteçler, bağlam ve mimariden doğan hata biçimleri.",
    },
  },
  {
    id: "AI-PYTHON",
    category: "TECHNICAL",
    level: "L4",
    difficulty: "INTERMEDIATE",
    technical: true,
    competencies: "TECHNICAL:5",
    queries: {
      en: "python programming full course for beginners",
      ar: "بايثون كورس كامل للمبتدئين برمجة",
      tr: "python programlama sıfırdan tam kurs",
    },
    blurb: {
      en: "Python from the beginning, as the working language for anything technical you will do with data or AI later.",
      ar: "بايثون من البداية، بوصفها لغة العمل لأي شيء تقني ستقوم به لاحقًا مع البيانات أو الذكاء الاصطناعي.",
      tr: "Baştan Python: ileride veri veya yapay zekâ ile yapacağınız teknik işlerin çalışma dili olarak.",
    },
  },
  {
    id: "AI-IMAGE",
    category: "GENERATIVE_AI",
    level: "L2",
    difficulty: "BEGINNER",
    competencies: "PROMPTING:3,WORKPLACE:2",
    queries: {
      en: "AI image generation tutorial full course design",
      ar: "توليد الصور بالذكاء الاصطناعي كورس كامل تصميم",
      tr: "yapay zeka ile görsel üretme tam eğitim tasarım",
    },
    blurb: {
      en: "Generating and editing images with AI for presentations, product mock-ups and internal material, including what not to publish.",
      ar: "توليد الصور وتحريرها بالذكاء الاصطناعي للعروض التقديمية ونماذج المنتجات والمواد الداخلية، بما في ذلك ما لا يصح نشره.",
      tr: "Sunumlar, ürün maketleri ve iç materyaller için yapay zekâ ile görsel üretmek ve düzenlemek; neyin yayımlanmaması gerektiği dâhil.",
    },
  },
  {
    id: "AI-MEETINGS",
    category: "ROLE_SPECIFIC",
    level: "L1",
    difficulty: "BEGINNER",
    competencies: "WORKPLACE:4",
    queries: {
      en: "AI note taking meeting summary email writing tutorial",
      ar: "الذكاء الاصطناعي لتلخيص الاجتماعات وكتابة البريد الإلكتروني شرح",
      tr: "yapay zeka ile toplantı özeti ve e-posta yazma eğitimi",
    },
    blurb: {
      en: "Using AI for the written overhead of a job: meeting notes, follow-up mail and status updates that someone else has to read.",
      ar: "استخدام الذكاء الاصطناعي في الأعباء الكتابية للوظيفة: محاضر الاجتماعات ورسائل المتابعة وتحديثات الحالة التي سيقرأها غيرك.",
      tr: "İşin yazılı yükünde yapay zekâ: toplantı notları, takip e-postaları ve başkasının okuyacağı durum güncellemeleri.",
    },
  },
  // --- people skills --------------------------------------------------------
  {
    id: "SS-COMMUNICATION",
    category: "COMMUNICATION",
    level: "L1",
    difficulty: "BEGINNER",
    queries: {
      en: "effective communication skills at work full training",
      ar: "مهارات التواصل الفعّال في العمل دورة كاملة",
      tr: "etkili iletişim becerileri iş yerinde tam eğitim",
    },
    blurb: {
      en: "Making yourself understood at work: structuring what you say, listening for what was actually meant, and closing the loop.",
      ar: "أن تُفهم في العمل: ترتيب ما تقوله، والإنصات لما قُصد فعلًا، وإغلاق الحلقة بالمتابعة.",
      tr: "İş yerinde anlaşılmak: söyleyeceğinizi kurmak, gerçekte kastedileni dinlemek ve döngüyü kapatmak.",
    },
  },
  {
    id: "SS-PRESENTATION",
    category: "COMMUNICATION",
    level: "L1",
    difficulty: "BEGINNER",
    queries: {
      en: "presentation skills and public speaking full course",
      ar: "مهارات العرض والتقديم والتحدث أمام الجمهور دورة كاملة",
      tr: "sunum teknikleri ve topluluk önünde konuşma tam kurs",
    },
    blurb: {
      en: "Presenting so the point survives the room: one message, evidence behind it, and slides that carry rather than compete.",
      ar: "أن تقدّم عرضًا تصل فكرته: رسالة واحدة، وأدلة تسندها، وشرائح تدعم الكلام بدل أن تنافسه.",
      tr: "Fikrin salondan sağ çıkacağı bir sunum: tek bir mesaj, arkasındaki kanıt ve konuşmayla yarışmayan slaytlar.",
    },
  },
  {
    id: "SS-TIME",
    category: "PRODUCTIVITY",
    level: "L1",
    difficulty: "BEGINNER",
    queries: {
      en: "time management and prioritisation full training course",
      ar: "إدارة الوقت وترتيب الأولويات دورة تدريبية كاملة",
      tr: "zaman yönetimi ve önceliklendirme tam eğitim",
    },
    blurb: {
      en: "Deciding what not to do: prioritising against real deadlines, protecting focused time and handling interruption without losing the thread.",
      ar: "أن تقرّر ما لن تفعله: ترتيب الأولويات وفق مواعيد حقيقية، وحماية وقت التركيز، والتعامل مع المقاطعات دون فقدان الخيط.",
      tr: "Ne yapmayacağına karar vermek: gerçek teslim tarihlerine göre önceliklendirmek, odaklı zamanı korumak ve bölünmeyi ipin ucunu kaçırmadan yönetmek.",
    },
  },
  {
    id: "SS-LEADERSHIP",
    category: "LEADERSHIP",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "leadership skills for new managers full course",
      ar: "مهارات القيادة للمديرين الجدد دورة كاملة",
      tr: "yeni yöneticiler için liderlik becerileri tam kurs",
    },
    blurb: {
      en: "The move from doing the work to being answerable for it: setting direction, delegating properly and holding a standard.",
      ar: "الانتقال من تنفيذ العمل إلى تحمّل المسؤولية عنه: تحديد الاتجاه، والتفويض الصحيح، والحفاظ على المعايير.",
      tr: "İşi yapmaktan işin hesabını vermeye geçiş: yön belirlemek, düzgün delege etmek ve bir standardı korumak.",
    },
  },
  {
    id: "SS-TEAMWORK",
    category: "COMMUNICATION",
    level: "L1",
    difficulty: "BEGINNER",
    queries: {
      en: "teamwork and collaboration skills training course",
      ar: "مهارات العمل الجماعي والتعاون دورة تدريبية",
      tr: "takım çalışması ve iş birliği becerileri eğitimi",
    },
    blurb: {
      en: "Working with people you did not choose: shared goals, visible commitments and disagreement that stays about the work.",
      ar: "العمل مع من لم تخترهم: أهداف مشتركة، والتزامات واضحة، وخلاف يبقى في حدود العمل.",
      tr: "Seçmediğiniz insanlarla çalışmak: ortak hedefler, görünür taahhütler ve işin sınırında kalan anlaşmazlık.",
    },
  },
  {
    id: "SS-PROBLEM",
    category: "PRODUCTIVITY",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "problem solving and critical thinking skills full course",
      ar: "حل المشكلات والتفكير النقدي دورة كاملة",
      tr: "problem çözme ve eleştirel düşünme tam kurs",
    },
    blurb: {
      en: "Getting to the actual cause before proposing a fix, and testing a conclusion against evidence rather than confidence.",
      ar: "الوصول إلى السبب الحقيقي قبل اقتراح الحل، واختبار الاستنتاج بالأدلة لا بالثقة.",
      tr: "Çözüm önermeden önce gerçek nedene ulaşmak ve bir sonucu kendinden eminlikle değil kanıtla sınamak.",
    },
  },
  {
    id: "SS-EQ",
    category: "COMMUNICATION",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "emotional intelligence at work full training course",
      ar: "الذكاء العاطفي في بيئة العمل دورة تدريبية كاملة",
      tr: "duygusal zeka iş yerinde tam eğitim",
    },
    blurb: {
      en: "Noticing your own reaction before it becomes a decision, and reading the room without guessing at what people are thinking.",
      ar: "ملاحظة ردّ فعلك قبل أن يتحوّل إلى قرار، وقراءة الأجواء دون تخمين ما يفكّر فيه الآخرون.",
      tr: "Kendi tepkinizi karara dönüşmeden fark etmek ve insanların ne düşündüğünü tahmin etmeden ortamı okumak.",
    },
  },
  {
    id: "SS-NEGOTIATION",
    category: "LEADERSHIP",
    level: "L3",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "negotiation skills full course business",
      ar: "مهارات التفاوض دورة كاملة في الأعمال",
      tr: "müzakere teknikleri tam kurs iş dünyası",
    },
    blurb: {
      en: "Preparing a negotiation properly: knowing your alternative, separating positions from interests, and closing without damage.",
      ar: "الإعداد الجيد للتفاوض: معرفة البديل، والفصل بين المواقف والمصالح، والإغلاق دون إضرار بالعلاقة.",
      tr: "Bir müzakereye düzgün hazırlanmak: alternatifinizi bilmek, pozisyonları çıkarlardan ayırmak ve ilişkiyi zedelemeden kapatmak.",
    },
  },
  {
    id: "SS-CUSTOMER",
    category: "COMMUNICATION",
    level: "L1",
    difficulty: "BEGINNER",
    queries: {
      en: "customer service excellence training full course",
      ar: "التميز في خدمة العملاء دورة تدريبية كاملة",
      tr: "müşteri hizmetlerinde mükemmellik tam eğitim",
    },
    blurb: {
      en: "Handling a customer who is already unhappy: acknowledging the problem, being specific about what happens next, and following through.",
      ar: "التعامل مع عميل غاضب بالفعل: الاعتراف بالمشكلة، وتحديد الخطوة التالية بدقة، ثم تنفيذها.",
      tr: "Zaten memnuniyetsiz bir müşteriyi karşılamak: sorunu kabul etmek, bundan sonra ne olacağını netleştirmek ve sözü tutmak.",
    },
  },
  {
    id: "SS-CONFLICT",
    category: "LEADERSHIP",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "conflict resolution at workplace training course",
      ar: "حل النزاعات في بيئة العمل دورة تدريبية",
      tr: "iş yerinde çatışma yönetimi eğitimi",
    },
    blurb: {
      en: "Taking the heat out of a disagreement early, and running the conversation that fixes it rather than the one that wins it.",
      ar: "نزع الاحتقان من الخلاف مبكرًا، وإدارة الحوار الذي يحلّه لا الذي ينتصر فيه.",
      tr: "Bir anlaşmazlığın gerginliğini erken almak ve kazandıran değil çözen konuşmayı yürütmek.",
    },
  },
  {
    id: "SS-PM",
    category: "PRODUCTIVITY",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "project management fundamentals full course beginners",
      ar: "أساسيات إدارة المشاريع دورة كاملة للمبتدئين",
      tr: "proje yönetimi temelleri tam kurs başlangıç",
    },
    blurb: {
      en: "Running a piece of work to a date: scope, sequence, who owns what, and reporting progress that reflects reality.",
      ar: "إدارة عمل بموعد محدّد: النطاق والتسلسل ومن يملك كل مهمة، وتقارير تقدّم تعكس الواقع.",
      tr: "Bir işi tarihe yetiştirmek: kapsam, sıra, hangi işin sahibi kim ve gerçeği yansıtan ilerleme raporu.",
    },
  },
  {
    id: "SS-WRITING",
    category: "COMMUNICATION",
    level: "L1",
    difficulty: "BEGINNER",
    queries: {
      en: "business writing professional email skills course",
      ar: "الكتابة المهنية وكتابة البريد الإلكتروني دورة",
      tr: "iş yazışmaları ve profesyonel e-posta yazma kursu",
    },
    blurb: {
      en: "Writing that gets read: the ask in the first line, only the detail that matters, and a subject line that says what it is.",
      ar: "كتابة تُقرأ فعلًا: الطلب في السطر الأول، والتفاصيل الضرورية فقط، وعنوان يقول ما بداخله.",
      tr: "Okunan yazı: ilk satırda talep, yalnızca gereken ayrıntı ve içeriği söyleyen bir konu satırı.",
    },
  },
  {
    id: "SS-CHANGE",
    category: "LEADERSHIP",
    level: "L3",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "change management training course organisational",
      ar: "إدارة التغيير في المؤسسات دورة تدريبية",
      tr: "değişim yönetimi kurumsal eğitim",
    },
    blurb: {
      en: "Bringing people through a change they did not ask for, including the AI ones: explaining the why, and handling the resistance honestly.",
      ar: "قيادة الناس خلال تغيير لم يطلبوه، بما في ذلك تغييرات الذكاء الاصطناعي: شرح السبب، والتعامل مع المقاومة بصدق.",
      tr: "İnsanları istemedikleri bir değişimden geçirmek — yapay zekâ kaynaklı olanlar dâhil: nedenini anlatmak ve direnci dürüstçe karşılamak.",
    },
  },
  {
    id: "SS-FEEDBACK",
    category: "LEADERSHIP",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "giving and receiving feedback at work training",
      ar: "إعطاء وتلقي التغذية الراجعة في العمل تدريب",
      tr: "geri bildirim verme ve alma iş yerinde eğitim",
    },
    blurb: {
      en: "Feedback that changes something: specific behaviour, its effect, and a request — given close to the event rather than at review time.",
      ar: "تغذية راجعة تُحدث فرقًا: سلوك محدّد، وأثره، وطلب واضح — تُقال قرب الحدث لا في موعد التقييم.",
      tr: "Bir şeyi değiştiren geri bildirim: somut davranış, etkisi ve bir talep — değerlendirme dönemini beklemeden, olaya yakın verilir.",
    },
  },
  {
    id: "SS-CRITICAL",
    category: "PRODUCTIVITY",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "decision making and analytical thinking course",
      ar: "اتخاذ القرار والتفكير التحليلي دورة",
      tr: "karar verme ve analitik düşünme kursu",
    },
    blurb: {
      en: "Making a decision you can defend later: naming the options, the trade-off you accepted, and what would change your mind.",
      ar: "اتخاذ قرار يمكنك الدفاع عنه لاحقًا: تسمية البدائل، والمقايضة التي قبلتها، وما الذي قد يغيّر رأيك.",
      tr: "Sonradan savunabileceğiniz bir karar: seçenekleri adlandırmak, kabul ettiğiniz ödünü ve fikrinizi neyin değiştireceğini bilmek.",
    },
  },
  {
    id: "SS-STRESS",
    category: "PRODUCTIVITY",
    level: "L1",
    difficulty: "BEGINNER",
    queries: {
      en: "stress management and resilience at work course",
      ar: "إدارة الضغوط والمرونة النفسية في العمل دورة",
      tr: "stres yönetimi ve dayanıklılık iş yerinde kurs",
    },
    blurb: {
      en: "Working under pressure without burning down: recognising the load early, recovering deliberately and asking for help in time.",
      ar: "العمل تحت الضغط دون احتراق: ملاحظة الحِمل مبكرًا، والتعافي بشكل مقصود، وطلب المساعدة في وقتها.",
      tr: "Tükenmeden baskı altında çalışmak: yükü erken fark etmek, bilinçli toparlanmak ve yardımı zamanında istemek.",
    },
  },
  {
    id: "SS-INTERVIEW",
    category: "LEADERSHIP",
    level: "L2",
    difficulty: "INTERMEDIATE",
    queries: {
      en: "coaching and mentoring skills for managers course",
      ar: "مهارات التدريب والإرشاد للمديرين دورة",
      tr: "yöneticiler için koçluk ve mentorluk becerileri kursu",
    },
    blurb: {
      en: "Developing someone rather than correcting them: asking before telling, agreeing a next step, and following it up.",
      ar: "تطوير الشخص بدل تصحيحه: أن تسأل قبل أن تُملي، وأن تتفقا على خطوة تالية، ثم تتابعها.",
      tr: "Birini düzeltmek yerine geliştirmek: söylemeden önce sormak, bir sonraki adımda anlaşmak ve takibini yapmak.",
    },
  },
];

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const REGION: Record<Lang, string> = { en: "US", ar: "EG", tr: "TR" };

type Candidate = { videoId: string; title: string; channel: string; seconds: number };

/** `videoRenderer` nodes are nested differently depending on the result layout, so walk for them. */
function collectRenderers(node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    for (const item of node) collectRenderers(item, out);
  } else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.videoRenderer) out.push(obj.videoRenderer as Record<string, unknown>);
    for (const value of Object.values(obj)) collectRenderers(value, out);
  }
  return out;
}

const text = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";
  const o = node as { simpleText?: string; runs?: { text: string }[] };
  return o.simpleText ?? (o.runs ?? []).map((r) => r.text).join("") ?? "";
};

/** "1:23:45" / "45:10" → seconds. */
function toSeconds(label: string): number {
  const parts = label.split(":").map((n) => Number(n.trim()));
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * YouTube starts refusing connections after roughly ten searches in quick
 * succession, so every search is paced and retried with a widening gap. This is
 * the slow part of the run by design — a harvest takes a few minutes.
 */
async function searchWithRetry(query: string, lang: Lang, tries = 4): Promise<Candidate[]> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const found = await search(query, lang);
      if (found.length) return found;
    } catch {
      // fall through to the backoff below
    }
    if (attempt < tries) await sleep(2000 * attempt + Math.floor(Math.random() * 800));
  }
  return [];
}

async function search(query: string, lang: Lang): Promise<Candidate[]> {
  // sp=EgIYAg%3D%3D restricts to videos over 20 minutes: the length filter is
  // doing the quality filtering here, since a "course" is not a three-minute clip.
  const url =
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` +
    `&sp=EgIYAg%3D%3D&hl=${lang}&gl=${REGION[lang]}`;

  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": lang } });
  if (!res.ok) return [];
  const html = await res.text();

  const match = html.match(/var ytInitialData = (\{[\s\S]+?\});<\/script>/);
  if (!match) return [];

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const out: Candidate[] = [];
  for (const r of collectRenderers(data)) {
    const videoId = typeof r.videoId === "string" ? r.videoId : "";
    const title = text(r.title).trim();
    const channel = (text(r.ownerText) || text(r.longBylineText)).trim();
    const seconds = toSeconds(text(r.lengthText));
    if (!videoId || !title || !channel || !seconds) continue;
    // Between 20 minutes and 12 hours: shorter is a clip, longer is usually a
    // livestream recording or a lo-fi loop that matched on the title alone.
    if (seconds < 20 * 60 || seconds > 12 * 3600) continue;
    out.push({ videoId, title, channel, seconds });
  }
  return out;
}

/** oEmbed 404s for anything deleted, private or blocked from embedding. */
async function verify(videoId: string): Promise<{ title: string; channel: string } | null> {
  const url = youTubeOEmbedUrl(`https://www.youtube.com/watch?v=${videoId}`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const body = (await res.json()) as { title?: string; author_name?: string };
    if (!body.title || !body.author_name) return null;
    return { title: body.title, channel: body.author_name };
  } catch {
    return null;
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return results;
}

// ---------------------------------------------------------------------------
const argOf = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const PER_TOPIC = Number(argOf("per", "8"));
const DRY = process.argv.includes("--dry");
const LANGS: Lang[] = ["en", "ar", "tr"];

const seen = new Set<string>();
const rows: Record<string, string>[] = [];

for (const topic of TOPICS) {
  for (const lang of LANGS) {
    const found = await searchWithRetry(topic.queries[lang], lang);
    await sleep(1200 + Math.floor(Math.random() * 900));

    const relevant = found.filter(
      (c) => !seen.has(c.videoId) && writtenIn(c.title, lang) && onTopic(c.title, topic.queries[lang]),
    );
    const fresh = relevant.slice(0, PER_TOPIC);
    const checked = await pool(fresh, 6, async (c) => ({ c, ok: await verify(c.videoId) }));

    let kept = 0;
    for (const { c, ok } of checked) {
      if (!ok || seen.has(c.videoId)) continue;
      seen.add(c.videoId);
      kept++;

      const hours = Math.max(0.5, Math.round((c.seconds / 3600) * 10) / 10);
      const by: Trio = {
        en: `Presented by ${ok.channel} on YouTube.`,
        ar: `مقدَّم من ${ok.channel} على يوتيوب.`,
        tr: `${ok.channel} tarafından YouTube'da sunulmaktadır.`,
      };

      rows.push({
        Code: `YT-${c.videoId}`,
        // The channel's own title, never a rewritten one.
        Title: ok.title.slice(0, 200),
        URL: `https://www.youtube.com/watch?v=${c.videoId}`,
        Provider: ok.channel.slice(0, 120),
        Platform: "YouTube",
        Description: `${topic.blurb.en} ${by.en}`.slice(0, 4000),
        "Description AR": `${topic.blurb.ar} ${by.ar}`.slice(0, 4000),
        "Description TR": `${topic.blurb.tr} ${by.tr}`.slice(0, 4000),
        Language: lang,
        Level: topic.level,
        Difficulty: topic.difficulty,
        Hours: String(hours),
        Free: "yes",
        Price: "0",
        Certificate: "no",
        Category: topic.category,
        Competencies: topic.competencies ?? "",
        Technical: topic.technical ? "yes" : "no",
      });
    }
    console.log(`  ${topic.id}/${lang}: ${found.length} found → ${relevant.length} relevant → ${kept} kept`);
  }
}

console.log(`\n${rows.length} verified courses`);
for (const lang of LANGS) {
  console.log(`  ${lang}: ${rows.filter((r) => r.Language === lang).length}`);
}

// CSV alongside, so the same set can be re-imported from the admin screen.
const csv = [
  COURSE_IMPORT_COLUMNS.join(","),
  ...rows.map((r) =>
    COURSE_IMPORT_COLUMNS.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","),
  ),
].join("\n");
mkdirSync("data", { recursive: true });
writeFileSync("data/harvested-courses.csv", "﻿" + csv, "utf8");
console.log("\nwrote data/harvested-courses.csv");

if (DRY) {
  console.log("--dry: nothing imported");
  process.exit(0);
}

const preview = await validateCourseRows([...COURSE_IMPORT_COLUMNS], rows);
const c = preview.counts;
console.log(
  `preview: ${c.total} rows — ${c.created} new, ${c.updated} existing, ${c.invalid} invalid, ${c.duplicates} duplicate, ${c.unrecommendable} unrecommendable`,
);
if (preview.unknown.providers.length) {
  console.log(`  new providers: ${preview.unknown.providers.length}`);
}
for (const bad of preview.rows.filter((r) => r.status === "INVALID").slice(0, 5)) {
  console.log(`  invalid line ${bad.line}: ${bad.issues.join("; ")}`);
}

// trustLinks: every URL above came back 200 from oEmbed moments ago, which is a
// stronger check than the admin ticking the box for a provider's own export.
const result = await commitCourseImport(preview, { trustLinks: true });
console.log(`imported: ${result.created} created, ${result.updated} updated`);
