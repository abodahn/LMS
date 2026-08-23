import type { Db } from "./client";
import { upsertCourse, linkPrerequisites, type CourseSeed } from "./courses";

/**
 * Arabic- and Turkish-language catalog.
 *
 * Most of T&C's workforce does not work in English. An excellent English
 * course a production supervisor cannot follow is worth less than a good
 * Arabic one they can, so the catalog carries genuinely native-language
 * learning — not English courses with a translated title.
 *
 * `language` is the language the teaching is actually delivered in, and it is
 * what the recommendation engine matches against the learner's profile. Where
 * the same course exists in more than one language it is seeded once per
 * language with its own code; the engine picks the right row per learner
 * (LANGUAGE_FIT), and topic de-duplication guarantees only one of them lands
 * on any single path.
 *
 * Every URL below was checked when this file was written. External providers
 * move things, which is exactly what the Admin → Courses review workflow and
 * the `lastVerifiedAt` field exist for.
 */

export const NATIVE_PROVIDERS = [
  { key: "EDRAAK", name: "Edraak (إدراك)", website: "https://www.edraak.org", trustScore: 0.9 },
  { key: "DUBAI_DCAI", name: "Dubai Centre for AI", website: "https://dub.ai", trustScore: 0.92 },
  { key: "DOROOB", name: "Doroob (دروب) — HRDF", website: "https://doroob.sa", trustScore: 0.88 },
  { key: "BTK_AKADEMI", name: "BTK Akademi", website: "https://www.btkakademi.gov.tr", trustScore: 0.9 },
  { key: "TURKCELL", name: "Turkcell Geleceği Yazanlar", website: "https://gelecegiyazanlar.turkcell.com.tr", trustScore: 0.87 },
  { key: "GOOGLE_CLOUD", name: "Google Cloud", website: "https://cloud.google.com", trustScore: 0.94 },
];

// ---------------------------------------------------------------------------
// Arabic
// ---------------------------------------------------------------------------

export const ARABIC_COURSES: CourseSeed[] = [
  {
    code: "EXT-AI4E-AR",
    slug: "ai-for-everyone-ar",
    title: "AI For Everyone (Arabic)",
    titleAr: "الذكاء الاصطناعي للجميع",
    titleTr: "Herkes İçin Yapay Zekâ (Arapça)",
    description:
      "Andrew Ng's non-technical introduction to AI, delivered in Arabic. What AI can and cannot do, how AI projects work, and how AI changes the way teams operate. No maths, no coding.",
    descriptionAr:
      "مقدمة غير تقنية إلى الذكاء الاصطناعي مع أندرو إنج، بالكامل باللغة العربية. ما الذي يستطيع الذكاء الاصطناعي فعله وما لا يستطيع، وكيف تُدار مشاريعه، وكيف يغيّر طريقة عمل الفِرق. بدون رياضيات وبدون برمجة.",
    descriptionTr:
      "Andrew Ng'in teknik olmayan yapay zekâ girişinin Arapça anlatımı. Matematik ve kod gerektirmez.",
    outcomes: [
      "Explain in plain Arabic what AI is and where it fits at work",
      "Tell realistic AI expectations from unrealistic ones",
      "Describe how an AI project moves from idea to production",
      "Discuss AI confidently with technical colleagues",
    ],
    outcomesAr: [
      "شرح ما هو الذكاء الاصطناعي وأين يفيد في العمل بلغة بسيطة",
      "التمييز بين التوقعات الواقعية وغير الواقعية عن الذكاء الاصطناعي",
      "وصف كيف ينتقل مشروع الذكاء الاصطناعي من الفكرة إلى التطبيق",
      "التحاور بثقة مع الزملاء التقنيين حول الذكاء الاصطناعي",
    ],
    outcomesTr: [
      "Yapay zekânın ne olduğunu ve işte nereye oturduğunu sade bir dille anlatmak",
      "Gerçekçi beklentileri gerçekçi olmayanlardan ayırmak",
      "Bir AI projesinin fikirden üretime nasıl ilerlediğini anlatmak",
      "Teknik meslektaşlarla yapay zekâ hakkında rahatça konuşmak",
    ],
    provider: "DEEPLEARNING_AI",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/ai-for-everyone-ar",
    language: "ar",
    subtitles: ["ar", "en"],
    difficulty: "BEGINNER",
    estimatedHours: 6,
    isFree: true,
    certificateAvailable: true,
    certificateCost: 49,
    level: "L0",
    category: "FOUNDATIONS",
    isRecommended: true,
    rating: 4.8,
    ratingSource: "Coursera",
    qualityScore: 0.97,
    competencies: [
      { key: "FUNDAMENTALS", weight: 5 },
      { key: "WORKPLACE", weight: 2 },
    ],
    goals: [
      { goalKey: "RESEARCH", weight: 1 },
      { goalKey: "DECISION_MAKING", weight: 2 },
    ],
  },
  {
    code: "EXT-EDRAAK-AI",
    slug: "edraak-intro-ai-ar",
    title: "Introduction to Artificial Intelligence (Edraak)",
    titleAr: "مقدمة في الذكاء الاصطناعي — إدراك",
    titleTr: "Yapay Zekâya Giriş (Edraak, Arapça)",
    description:
      "A free Arabic-language introduction to AI from Edraak, the non-profit Arab MOOC platform of the Queen Rania Foundation. Covers what AI is, where it is already used, and the ideas behind machine learning — written for a general audience.",
    descriptionAr:
      "دورة عربية مجانية للتعريف بالذكاء الاصطناعي من منصة إدراك، المنصة العربية غير الربحية التابعة لمؤسسة الملكة رانيا. تشرح ما هو الذكاء الاصطناعي، وأين يُستخدم فعليًا اليوم، والأفكار الأساسية وراء تعلّم الآلة، بأسلوب موجّه لغير المتخصصين.",
    descriptionTr:
      "Queen Rania Vakfı'nın kâr amacı gütmeyen Arapça MOOC platformu Edraak'tan ücretsiz yapay zekâ girişi. Genel kitleye yöneliktir.",
    outcomes: [
      "Define AI and machine learning in everyday Arabic",
      "Recognise AI already at work in daily life",
      "Understand at a high level how a model learns from data",
      "Earn a free completion certificate",
    ],
    outcomesAr: [
      "تعريف الذكاء الاصطناعي وتعلّم الآلة بلغة يومية",
      "التعرّف على تطبيقات الذكاء الاصطناعي الموجودة فعلًا في الحياة اليومية",
      "الفهم العام لكيفية تعلّم النموذج من البيانات",
      "الحصول على شهادة إتمام مجانية",
    ],
    outcomesTr: [
      "Yapay zekâ ve makine öğrenmesini gündelik dille tanımlamak",
      "Günlük hayatta hâlihazırda çalışan yapay zekâyı fark etmek",
      "Bir modelin veriden nasıl öğrendiğini genel hatlarıyla anlamak",
      "Ücretsiz katılım sertifikası almak",
    ],
    provider: "EDRAAK",
    platform: "Edraak",
    url: "https://www.edraak.org/en/programs/course/arin-vt3_2018/",
    language: "ar",
    subtitles: ["ar"],
    difficulty: "BEGINNER",
    estimatedHours: 8,
    isFree: true,
    certificateAvailable: true,
    level: "L0",
    category: "FOUNDATIONS",
    qualityScore: 0.86,
    competencies: [
      { key: "FUNDAMENTALS", weight: 5 },
      { key: "DATA_AUTOMATION", weight: 1 },
    ],
    goals: [{ goalKey: "RESEARCH", weight: 1 }],
  },
  {
    code: "EXT-OMP-AR",
    slug: "one-million-prompters-ar",
    title: "One Million Prompters — Prompt Literacy",
    titleAr: "مليون خبير في هندسة الأوامر — إتقان صياغة الأوامر",
    titleTr: "One Million Prompters — Prompt Okuryazarlığı",
    description:
      "Dubai Centre for AI's free prompt-engineering programme: four one-hour modules on AI fundamentals, advanced prompting, productivity and creative use, ending in a prompt-literacy certificate. No coding background needed, and the whole programme is available in Arabic.",
    descriptionAr:
      "برنامج مجاني في هندسة الأوامر من مركز دبي للذكاء الاصطناعي: أربع وحدات مدة كل منها ساعة تغطي أساسيات الذكاء الاصطناعي، وتقنيات صياغة الأوامر المتقدمة، ورفع الإنتاجية، والاستخدامات الإبداعية، وتنتهي بشهادة في إتقان صياغة الأوامر. لا يتطلب أي خلفية برمجية، والبرنامج متاح بالكامل باللغة العربية.",
    descriptionTr:
      "Dubai Yapay Zekâ Merkezi'nin ücretsiz prompt mühendisliği programı: dört adet birer saatlik modül ve sonunda sertifika. Kodlama bilgisi gerekmez.",
    outcomes: [
      "Write a prompt that states context, objective, constraints and output shape",
      "Apply advanced prompting techniques to real work tasks",
      "Use AI to save time on routine writing and analysis",
      "Earn an accredited prompt-literacy certificate",
    ],
    outcomesAr: [
      "كتابة أمر يوضّح السياق والهدف والقيود وشكل المخرجات المطلوب",
      "تطبيق تقنيات متقدمة في صياغة الأوامر على مهام عمل حقيقية",
      "توفير الوقت في الكتابة والتحليل الروتيني باستخدام الذكاء الاصطناعي",
      "الحصول على شهادة معتمدة في إتقان صياغة الأوامر",
    ],
    outcomesTr: [
      "Bağlam, hedef, kısıt ve çıktı biçimini içeren bir prompt yazmak",
      "İleri prompt tekniklerini gerçek iş görevlerine uygulamak",
      "Rutin yazı ve analiz işlerinde zaman kazanmak",
      "Akredite prompt okuryazarlığı sertifikası almak",
    ],
    provider: "DUBAI_DCAI",
    platform: "Dubai Centre for AI",
    url: "https://dub.ai/en/omp/",
    language: "ar",
    subtitles: ["ar", "en"],
    difficulty: "BEGINNER",
    estimatedHours: 4,
    isFree: true,
    certificateAvailable: true,
    level: "L1",
    category: "PROMPTING",
    isRecommended: true,
    qualityScore: 0.9,
    competencies: [
      { key: "PROMPTING", weight: 5 },
      { key: "WORKPLACE", weight: 2 },
    ],
    goals: [
      { goalKey: "WRITING", weight: 3 },
      { goalKey: "EMAIL", weight: 2 },
      { goalKey: "REPORTS", weight: 2 },
    ],
  },
  {
    code: "EXT-DOROOB-AI",
    slug: "doroob-ai-data-ar",
    title: "AI and Data Analysis in the Future Labour Market",
    titleAr: "الذكاء الاصطناعي وتحليل البيانات في مستقبل سوق العمل",
    titleTr: "Gelecekteki İş Gücü Piyasasında Yapay Zekâ ve Veri Analizi",
    description:
      "A free Arabic course from Doroob, the Saudi Human Resources Development Fund platform, on how AI and data analysis are reshaping jobs — and which skills hold their value. Practical and non-technical.",
    descriptionAr:
      "دورة عربية مجانية من منصة دروب التابعة لصندوق تنمية الموارد البشرية السعودي، تتناول كيف يعيد الذكاء الاصطناعي وتحليل البيانات تشكيل الوظائف، وأي المهارات تحافظ على قيمتها. عملية وغير تقنية.",
    descriptionTr:
      "Suudi İnsan Kaynakları Geliştirme Fonu'nun Doroob platformundan ücretsiz Arapça kurs: yapay zekâ ve veri analizinin işleri nasıl dönüştürdüğü.",
    outcomes: [
      "Describe how AI is changing roles across industries",
      "Identify which of your own tasks data and AI can support",
      "Read a simple data analysis critically",
      "Plan your own skill development around the change",
    ],
    outcomesAr: [
      "وصف كيف يغيّر الذكاء الاصطناعي الأدوار الوظيفية عبر القطاعات",
      "تحديد المهام في عملك التي يمكن للبيانات والذكاء الاصطناعي دعمها",
      "قراءة تحليل بيانات بسيط بعين ناقدة",
      "التخطيط لتطوير مهاراتك في ضوء هذا التغيير",
    ],
    outcomesTr: [
      "Yapay zekânın sektörlerde rolleri nasıl değiştirdiğini anlatmak",
      "Kendi görevlerinizden hangilerinin veri ve AI ile desteklenebileceğini belirlemek",
      "Basit bir veri analizini eleştirel okumak",
      "Bu değişime göre kendi beceri gelişiminizi planlamak",
    ],
    provider: "DOROOB",
    platform: "Doroob",
    url: "https://lms.doroob.sa/courses/Doroob/SC-STC-P2-W5/2030/about",
    language: "ar",
    subtitles: ["ar"],
    difficulty: "BEGINNER",
    estimatedHours: 3,
    isFree: true,
    certificateAvailable: true,
    level: "L1",
    category: "DATA",
    qualityScore: 0.82,
    competencies: [
      { key: "DATA_AUTOMATION", weight: 4 },
      { key: "FUNDAMENTALS", weight: 2 },
    ],
    goals: [
      { goalKey: "DATA_ANALYSIS", weight: 3 },
      { goalKey: "DECISION_MAKING", weight: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Turkish
// ---------------------------------------------------------------------------

export const TURKISH_COURSES: CourseSeed[] = [
  {
    code: "EXT-BTK-AI-INTRO",
    slug: "btk-yapay-zekaya-giris",
    title: "Introduction to AI (BTK Akademi)",
    titleAr: "مقدمة في الذكاء الاصطناعي — أكاديمية BTK",
    titleTr: "Yapay Zekâya Giriş — Temel Seviye",
    description:
      "A free Turkish introduction to AI from BTK Akademi, the Turkish government's digital skills platform. Entirely in Turkish, free, and finishes with an e-Devlet verified certificate.",
    descriptionAr:
      "مقدمة تركية مجانية إلى الذكاء الاصطناعي من أكاديمية BTK، منصة المهارات الرقمية الحكومية في تركيا. باللغة التركية بالكامل، مجانية، وتنتهي بشهادة موثّقة عبر e-Devlet.",
    descriptionTr:
      "BTK Akademi'den ücretsiz yapay zekâ girişi. Tamamen Türkçe, ücretsiz ve e-Devlet onaylı sertifika ile tamamlanır. Yapay zekânın ne olduğu, nerede kullanıldığı ve günlük işlere etkisi anlatılır.",
    outcomes: [
      "Explain what AI is in Turkish, without jargon",
      "Recognise where AI is already used in Turkish workplaces",
      "Understand the limits of current AI systems",
      "Earn an e-Devlet verified certificate",
    ],
    outcomesAr: [
      "شرح ما هو الذكاء الاصطناعي بالتركية دون مصطلحات معقدة",
      "التعرّف على استخدامات الذكاء الاصطناعي في بيئات العمل التركية",
      "فهم حدود أنظمة الذكاء الاصطناعي الحالية",
      "الحصول على شهادة موثّقة عبر e-Devlet",
    ],
    outcomesTr: [
      "Yapay zekânın ne olduğunu jargonsuz anlatmak",
      "Türkiye'deki iş yerlerinde yapay zekânın nerede kullanıldığını fark etmek",
      "Mevcut yapay zekâ sistemlerinin sınırlarını anlamak",
      "e-Devlet onaylı sertifika almak",
    ],
    provider: "BTK_AKADEMI",
    platform: "BTK Akademi",
    url: "https://www.btkakademi.gov.tr/portal/course/yapay-zekaya-giris-29193",
    language: "tr",
    subtitles: ["tr"],
    difficulty: "BEGINNER",
    estimatedHours: 5,
    isFree: true,
    certificateAvailable: true,
    level: "L0",
    category: "FOUNDATIONS",
    isRecommended: true,
    qualityScore: 0.88,
    competencies: [
      { key: "FUNDAMENTALS", weight: 5 },
      { key: "WORKPLACE", weight: 1 },
    ],
    goals: [{ goalKey: "RESEARCH", weight: 1 }],
  },
  {
    code: "EXT-BTK-GENAI",
    slug: "btk-uretken-yapay-zekaya-giris",
    title: "Introduction to Generative AI (BTK Akademi)",
    titleAr: "مقدمة في الذكاء الاصطناعي التوليدي — أكاديمية BTK",
    titleTr: "Üretken Yapay Zekâya Giriş — Temel Seviye",
    description:
      "BTK Akademi's free Turkish course on generative AI: what large language models do, how to use them for everyday work, and where they go wrong. Free, in Turkish, with an e-Devlet verified certificate.",
    descriptionAr:
      "دورة مجانية بالتركية من أكاديمية BTK عن الذكاء الاصطناعي التوليدي: ماذا تفعل النماذج اللغوية الكبيرة، وكيف تُستخدم في العمل اليومي، وأين تخطئ. مجانية وبشهادة موثّقة عبر e-Devlet.",
    descriptionTr:
      "BTK Akademi'nin ücretsiz üretken yapay zekâ kursu: büyük dil modelleri ne yapar, günlük işlerde nasıl kullanılır ve nerelerde hata yaparlar. Türkçe ve e-Devlet onaylı sertifikalı.",
    outcomes: [
      "Explain what a large language model does",
      "Use a generative AI tool for a real work task",
      "Spot a confident but wrong AI answer",
      "Earn an e-Devlet verified certificate",
    ],
    outcomesAr: [
      "شرح ما تفعله النماذج اللغوية الكبيرة",
      "استخدام أداة ذكاء اصطناعي توليدي في مهمة عمل حقيقية",
      "اكتشاف إجابة واثقة لكنها خاطئة",
      "الحصول على شهادة موثّقة عبر e-Devlet",
    ],
    outcomesTr: [
      "Büyük dil modelinin ne yaptığını anlatmak",
      "Üretken yapay zekâ aracını gerçek bir iş görevinde kullanmak",
      "Kendinden emin ama yanlış bir AI cevabını fark etmek",
      "e-Devlet onaylı sertifika almak",
    ],
    provider: "BTK_AKADEMI",
    platform: "BTK Akademi",
    url: "https://www.btkakademi.gov.tr/portal/course/uretken-yapay-zekaya-giris-45762",
    language: "tr",
    subtitles: ["tr"],
    difficulty: "BEGINNER",
    estimatedHours: 6,
    isFree: true,
    certificateAvailable: true,
    level: "L1",
    category: "GENERATIVE_AI",
    isRecommended: true,
    qualityScore: 0.88,
    competencies: [
      { key: "FUNDAMENTALS", weight: 3 },
      { key: "PROMPTING", weight: 3 },
      { key: "WORKPLACE", weight: 2 },
    ],
    goals: [
      { goalKey: "WRITING", weight: 2 },
      { goalKey: "REPORTS", weight: 1 },
    ],
  },
  {
    code: "EXT-TURKCELL-DS-AI",
    slug: "turkcell-veri-bilimi-yapay-zeka",
    title: "Introduction to Data Science and AI (Turkcell)",
    titleAr: "مقدمة في علم البيانات والذكاء الاصطناعي — تركسل",
    titleTr: "Veri Bilimi ve Yapay Zekâya Giriş",
    description:
      "A short, free Turkish course from Turkcell Geleceği Yazanlar: data science and AI explained through everyday examples, including the CRISP-DM way of running a data project. About 15 short videos, certificate on completion.",
    descriptionAr:
      "دورة تركية قصيرة ومجانية من منصة Turkcell Geleceği Yazanlar: شرح علم البيانات والذكاء الاصطناعي عبر أمثلة من الحياة اليومية، مع منهجية CRISP-DM لإدارة مشروع بيانات. نحو 15 مقطعًا قصيرًا وشهادة عند الإتمام.",
    descriptionTr:
      "Turkcell Geleceği Yazanlar'dan kısa ve ücretsiz kurs: veri bilimi ve yapay zekâ günlük hayattan örneklerle, CRISP-DM metodolojisi dahil. Yaklaşık 15 kısa video ve tamamlayanlara sertifika.",
    outcomes: [
      "Describe what a data science project involves",
      "Recognise where data can answer a business question",
      "Follow the CRISP-DM stages at a high level",
      "Earn a free completion certificate",
    ],
    outcomesAr: [
      "وصف مكوّنات مشروع علم البيانات",
      "تحديد الحالات التي تجيب فيها البيانات عن سؤال عمل",
      "متابعة مراحل CRISP-DM بشكل عام",
      "الحصول على شهادة إتمام مجانية",
    ],
    outcomesTr: [
      "Bir veri bilimi projesinin neleri kapsadığını anlatmak",
      "Verinin hangi iş sorusunu yanıtlayabileceğini fark etmek",
      "CRISP-DM aşamalarını genel hatlarıyla izlemek",
      "Ücretsiz tamamlama sertifikası almak",
    ],
    provider: "TURKCELL",
    platform: "Geleceği Yazanlar",
    url: "https://gelecegiyazanlar.turkcell.com.tr/egitimler/veri-bilimi-ve-yapay-zekaya-giris",
    language: "tr",
    subtitles: ["tr"],
    difficulty: "BEGINNER",
    estimatedHours: 2,
    isFree: true,
    certificateAvailable: true,
    level: "L1",
    category: "DATA",
    qualityScore: 0.83,
    competencies: [
      { key: "DATA_AUTOMATION", weight: 4 },
      { key: "FUNDAMENTALS", weight: 2 },
    ],
    goals: [
      { goalKey: "DATA_ANALYSIS", weight: 3 },
      { goalKey: "EXCEL", weight: 1 },
    ],
  },
  {
    code: "EXT-GOOG-GENAI-TR",
    slug: "google-uretken-yapay-zekaya-giris-tr",
    title: "Introduction to Generative AI (Google Cloud, Turkish)",
    titleAr: "مقدمة في الذكاء الاصطناعي التوليدي — Google Cloud بالتركية",
    titleTr: "Üretken Yapay Zekâ'ya Giriş — Google Cloud",
    description:
      "Google Cloud's four-course Turkish specialization on generative AI: large language models, image generation, and responsible AI. Delivered in Turkish on Coursera.",
    descriptionAr:
      "تخصّص تركي من أربع دورات من Google Cloud في الذكاء الاصطناعي التوليدي: النماذج اللغوية الكبيرة، وتوليد الصور، والذكاء الاصطناعي المسؤول. يُقدَّم بالتركية على منصة Coursera.",
    descriptionTr:
      "Google Cloud'un dört kurstan oluşan Türkçe üretken yapay zekâ uzmanlık programı: büyük dil modelleri, görüntü üretimi ve sorumlu yapay zekâ. Coursera üzerinde Türkçe.",
    outcomes: [
      "Explain how large language models are built and used",
      "Describe responsible AI practice in Google's framing",
      "Recognise where generative AI fits a business process",
      "Earn a Coursera certificate in Turkish",
    ],
    outcomesAr: [
      "شرح كيفية بناء النماذج اللغوية الكبيرة واستخدامها",
      "وصف ممارسات الذكاء الاصطناعي المسؤول وفق إطار Google",
      "تحديد المواضع التي يناسب فيها الذكاء الاصطناعي التوليدي عملية عمل",
      "الحصول على شهادة Coursera بالتركية",
    ],
    outcomesTr: [
      "Büyük dil modellerinin nasıl oluşturulduğunu ve kullanıldığını anlatmak",
      "Google'ın çerçevesinde sorumlu yapay zekâ pratiğini tanımlamak",
      "Üretken yapay zekânın bir iş sürecine nerede oturduğunu görmek",
      "Türkçe Coursera sertifikası almak",
    ],
    provider: "GOOGLE_CLOUD",
    platform: "Coursera",
    url: "https://www.coursera.org/specializations/introduction-to-generative-ai-tr",
    language: "tr",
    subtitles: ["tr", "en"],
    difficulty: "INTERMEDIATE",
    estimatedHours: 10,
    isFree: true,
    certificateAvailable: true,
    certificateCost: 49,
    level: "L2",
    category: "GENERATIVE_AI",
    qualityScore: 0.9,
    competencies: [
      { key: "FUNDAMENTALS", weight: 3 },
      { key: "RESPONSIBLE_AI", weight: 2 },
      { key: "PROMPTING", weight: 2 },
    ],
    goals: [{ goalKey: "RESEARCH", weight: 2 }],
  },
  {
    code: "EXT-GOOG-AI-TR",
    slug: "grow-with-google-ai-tr",
    title: "AI Trainings for Everyone (Grow with Google Türkiye)",
    titleAr: "تدريبات الذكاء الاصطناعي للجميع — Google تركيا",
    titleTr: "Herkes İçin Yapay Zekâ Eğitimleri — Google Türkiye",
    description:
      "Google Türkiye's free Turkish AI video trainings, prepared with the Ministry of Industry and Technology: AI fundamentals, AI for professionals, AI for business and AI for marketing. Short videos, no sign-up, no cost.",
    descriptionAr:
      "تدريبات فيديو مجانية بالتركية من Google تركيا، أُعدّت بالتعاون مع وزارة الصناعة والتكنولوجيا: أساسيات الذكاء الاصطناعي، والذكاء الاصطناعي للمحترفين وللأعمال وللتسويق. مقاطع قصيرة بدون تسجيل وبدون تكلفة.",
    descriptionTr:
      "Google Türkiye'nin Sanayi ve Teknoloji Bakanlığı iş birliğiyle hazırladığı ücretsiz Türkçe yapay zekâ video eğitimleri: temel bilgiler, profesyoneller için, işletmeler için ve pazarlama için yapay zekâ.",
    outcomes: [
      "Understand AI basics in Turkish",
      "Apply AI to professional and business tasks",
      "Use AI for marketing and customer work",
      "Choose the right AI tool for a given job",
    ],
    outcomesAr: [
      "فهم أساسيات الذكاء الاصطناعي بالتركية",
      "تطبيق الذكاء الاصطناعي على المهام المهنية والتجارية",
      "استخدام الذكاء الاصطناعي في التسويق والتعامل مع العملاء",
      "اختيار الأداة المناسبة لكل مهمة",
    ],
    outcomesTr: [
      "Yapay zekânın temellerini Türkçe anlamak",
      "Yapay zekâyı profesyonel ve ticari görevlere uygulamak",
      "Pazarlama ve müşteri işlerinde yapay zekâ kullanmak",
      "Bir iş için doğru yapay zekâ aracını seçmek",
    ],
    provider: "GOOGLE",
    platform: "Grow with Google",
    url: "https://grow.google/intl/tr/ai-for-all/",
    language: "tr",
    subtitles: ["tr"],
    difficulty: "BEGINNER",
    estimatedHours: 4,
    isFree: true,
    certificateAvailable: false,
    level: "L1",
    category: "FOUNDATIONS",
    qualityScore: 0.85,
    competencies: [
      { key: "WORKPLACE", weight: 4 },
      { key: "FUNDAMENTALS", weight: 2 },
    ],
    goals: [
      { goalKey: "WRITING", weight: 1 },
      { goalKey: "PRESENTATIONS", weight: 1 },
      { goalKey: "DECISION_MAKING", weight: 1 },
    ],
  },
  {
    code: "EXT-GOOG-DEV-GENAI-TR",
    slug: "google-gelistiriciler-uretken-yapay-zeka-tr",
    title: "Generative AI for Developers (Google Cloud, Turkish)",
    titleAr: "الذكاء الاصطناعي التوليدي للمطوّرين — Google Cloud بالتركية",
    titleTr: "Geliştiriciler için Üretken Yapay Zekâ — Google Cloud",
    description:
      "Google Cloud's Turkish specialization for developers: working with large language models, embeddings, prompt design in code, and building generative AI applications on Google Cloud.",
    descriptionAr:
      "تخصّص تركي من Google Cloud موجّه للمطوّرين: التعامل مع النماذج اللغوية الكبيرة، والتمثيلات المتجهية، وتصميم الأوامر برمجيًا، وبناء تطبيقات الذكاء الاصطناعي التوليدي على Google Cloud.",
    descriptionTr:
      "Google Cloud'un geliştiricilere yönelik Türkçe uzmanlık programı: büyük dil modelleriyle çalışma, embedding'ler, kod içinde prompt tasarımı ve Google Cloud üzerinde üretken yapay zekâ uygulamaları geliştirme.",
    outcomes: [
      "Call a large language model from application code",
      "Design prompts programmatically and evaluate the output",
      "Understand embeddings and vector search",
      "Build a small generative AI application",
    ],
    outcomesAr: [
      "استدعاء نموذج لغوي كبير من داخل كود التطبيق",
      "تصميم الأوامر برمجيًا وتقييم المخرجات",
      "فهم التمثيلات المتجهية والبحث الدلالي",
      "بناء تطبيق صغير بالذكاء الاصطناعي التوليدي",
    ],
    outcomesTr: [
      "Uygulama kodundan büyük dil modeli çağırmak",
      "Prompt'ları programatik tasarlamak ve çıktıyı değerlendirmek",
      "Embedding'leri ve vektör aramayı anlamak",
      "Küçük bir üretken yapay zekâ uygulaması geliştirmek",
    ],
    provider: "GOOGLE_CLOUD",
    platform: "Coursera",
    url: "https://www.coursera.org/specializations/gelistiricilier-uretken-yapay-zeka-tr",
    language: "tr",
    subtitles: ["tr", "en"],
    difficulty: "ADVANCED",
    estimatedHours: 12,
    isFree: true,
    certificateAvailable: true,
    certificateCost: 49,
    level: "L3",
    category: "TECHNICAL",
    isTechnical: true,
    qualityScore: 0.89,
    competencies: [{ key: "TECHNICAL", weight: 5 }],
    jobFamilies: [{ jobFamily: "IT", weight: 3 }],
    goals: [{ goalKey: "PROGRAMMING", weight: 3 }],
  },
];

export const NATIVE_LANGUAGE_COURSES: CourseSeed[] = [...ARABIC_COURSES, ...TURKISH_COURSES];

export async function seedNativeLanguageCourses(prisma: Db) {
  for (const p of NATIVE_PROVIDERS) {
    await prisma.courseProvider.upsert({ where: { key: p.key }, update: p, create: p });
  }
  for (const seed of NATIVE_LANGUAGE_COURSES) await upsertCourse(prisma, seed);
  await linkPrerequisites(prisma, NATIVE_LANGUAGE_COURSES);
}
