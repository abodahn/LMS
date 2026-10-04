import type { Db } from "./client";

const PROVIDERS = [
  { key: "DEEPLEARNING_AI", name: "DeepLearning.AI", website: "https://www.deeplearning.ai", trustScore: 0.98 },
  { key: "GOOGLE", name: "Google", website: "https://grow.google", trustScore: 0.96 },
  { key: "MICROSOFT", name: "Microsoft", website: "https://learn.microsoft.com", trustScore: 0.94 },
  { key: "VANDERBILT", name: "Vanderbilt University", website: "https://www.vanderbilt.edu", trustScore: 0.92 },
  { key: "HELSINKI", name: "University of Helsinki / MinnaLearn", website: "https://www.elementsofai.com", trustScore: 0.93 },
  { key: "KAGGLE", name: "Kaggle", website: "https://www.kaggle.com/learn", trustScore: 0.9 },
  { key: "FREECODECAMP", name: "freeCodeCamp", website: "https://www.freecodecamp.org", trustScore: 0.85 },
  { key: "TC_ACADEMY", name: "T&C AI Academy", website: null, trustScore: 1 },
];

export const CATEGORIES = [
  { key: "FOUNDATIONS", name: "AI Foundations", order: 1 },
  { key: "GENERATIVE_AI", name: "Generative AI", order: 2 },
  { key: "PROMPTING", name: "Prompting", order: 3 },
  { key: "ROLE_SPECIFIC", name: "AI for your role", order: 4 },
  { key: "RESPONSIBLE_AI", name: "Responsible AI", order: 5 },
  { key: "DATA", name: "Data & Automation", order: 6 },
  { key: "TECHNICAL", name: "Technical AI", order: 7 },
  // Not AI: the academy also carries the people skills that decide whether
  // any of the AI training turns into better work.
  { key: "COMMUNICATION", name: "Communication & Collaboration", order: 8 },
  { key: "LEADERSHIP", name: "Leadership & Management", order: 9 },
  { key: "PRODUCTIVITY", name: "Productivity & Personal Effectiveness", order: 10 },
  // Egypt and Istanbul work together daily; language is operational here,
  // not a perk.
  { key: "LANGUAGES", name: "Languages", order: 11 },
  // The factory's own subjects. Until discovery reached beyond AI and office
  // skills there was nowhere to file line balancing or an AQL inspection course.
  { key: "OPERATIONS", name: "Operations, Quality & Manufacturing", order: 12 },
  { key: "SAFETY_COMPLIANCE", name: "Safety & Compliance", order: 13 },
];

export type CourseSeed = {
  code: string;
  slug: string;
  title: string;
  titleAr?: string;
  titleTr?: string;
  description: string;
  descriptionAr?: string;
  descriptionTr?: string;
  outcomes: string[];
  outcomesAr?: string[];
  outcomesTr?: string[];
  provider: string;
  platform: string;
  url?: string;
  language?: string;
  subtitles?: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours: number;
  isFree?: boolean;
  price?: number;
  certificateAvailable?: boolean;
  certificateCost?: number;
  level: string;
  category: string;
  isInternal?: boolean;
  isTechnical?: boolean;
  isMandatory?: boolean;
  isRecommended?: boolean;
  youtubePlaylistId?: string;
  rating?: number;
  ratingSource?: string;
  qualityScore: number;
  competencies: { key: string; weight: number }[];
  departments?: string[];
  jobFamilies?: { jobFamily: string; weight: number }[];
  goals?: { goalKey: string; weight: number }[];
  prerequisites?: string[];
};

export const EXTERNAL_COURSES: CourseSeed[] = [
  {
    code: "EXT-AI4E",
    slug: "ai-for-everyone",
    title: "AI For Everyone",
    titleAr: "الذكاء الاصطناعي للجميع",
    titleTr: "Herkes İçin Yapay Zekâ",
    description:
      "Andrew Ng's non-technical introduction to what AI can and cannot do, how AI projects work, and how AI changes the way teams operate. No maths, no coding.",
    descriptionAr:
      "مقدمة غير تقنية من أندرو إنج عن ما يستطيع الذكاء الاصطناعي فعله وما لا يستطيع، وكيف تعمل مشاريع الذكاء الاصطناعي. بدون رياضيات أو برمجة.",
    descriptionTr:
      "Andrew Ng'in teknik olmayan girişi: yapay zekânın yapabildikleri ve yapamadıkları, AI projelerinin nasıl yürüdüğü. Matematik ve kod yok.",
    outcomes: [
      "Explain in plain language what AI is and where it fits at work",
      "Recognise realistic versus unrealistic AI expectations",
      "Describe how an AI project moves from idea to production",
      "Talk confidently with technical colleagues about AI",
    ],
    provider: "DEEPLEARNING_AI",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/ai-for-everyone",
    subtitles: ["ar", "tr", "en"],
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
      { key: "FUNDAMENTALS", weight: 3 },
      { key: "WORKPLACE", weight: 1 },
    ],
    jobFamilies: [{ jobFamily: "GENERAL", weight: 1 }],
    goals: [
      { goalKey: "RESEARCH", weight: 1 },
      { goalKey: "DECISION_MAKING", weight: 1 },
    ],
  },
  {
    code: "EXT-GENAI4E",
    slug: "generative-ai-for-everyone",
    title: "Generative AI for Everyone",
    titleAr: "الذكاء الاصطناعي التوليدي للجميع",
    titleTr: "Herkes İçin Üretken Yapay Zekâ",
    description:
      "How generative AI actually works, what it is good at, and how to find sensible use cases in your own job. Practical, non-technical and current.",
    descriptionAr:
      "كيف يعمل الذكاء الاصطناعي التوليدي فعليًا، وفيمَ يبرع، وكيف تجد حالات استخدام معقولة في عملك. عملي وغير تقني وحديث.",
    descriptionTr:
      "Üretken yapay zekâ gerçekte nasıl çalışır, nelerde iyidir ve kendi işinizde makul kullanım alanlarını nasıl bulursunuz. Pratik, teknik olmayan ve güncel.",
    outcomes: [
      "Describe how a large language model produces an answer",
      "Spot tasks in your own work that generative AI can help with",
      "Understand why models hallucinate and what to do about it",
      "Build a simple, repeatable AI workflow for a real task",
    ],
    provider: "DEEPLEARNING_AI",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/generative-ai-for-everyone",
    subtitles: ["ar", "tr", "en"],
    difficulty: "BEGINNER",
    estimatedHours: 6,
    isFree: true,
    certificateAvailable: true,
    certificateCost: 49,
    level: "L1",
    category: "GENERATIVE_AI",
    isRecommended: true,
    rating: 4.8,
    ratingSource: "Coursera",
    qualityScore: 0.96,
    competencies: [
      { key: "FUNDAMENTALS", weight: 2 },
      { key: "WORKPLACE", weight: 3 },
    ],
    jobFamilies: [{ jobFamily: "GENERAL", weight: 1 }],
    goals: [
      { goalKey: "WRITING", weight: 1 },
      { goalKey: "RESEARCH", weight: 1 },
      { goalKey: "DOCUMENT_ANALYSIS", weight: 1 },
    ],
    prerequisites: ["EXT-AI4E"],
  },
  {
    code: "EXT-GOOG-AIE",
    slug: "google-ai-essentials",
    title: "Google AI Essentials",
    titleTr: "Google AI Temelleri",
    titleAr: "أساسيات الذكاء الاصطناعي من Google",
    description:
      "Google's practical programme for using AI day to day: writing with AI, working faster, and using AI responsibly at work.",
    descriptionAr:
      "برنامج Google العملي لاستخدام الذكاء الاصطناعي يوميًا: الكتابة بمساعدته، وإنجاز العمل بسرعة أكبر، واستخدامه بمسؤولية في بيئة العمل.",
    descriptionTr:
      "Google'ın günlük yapay zekâ kullanımına yönelik pratik programı: yapay zekâ ile yazmak, daha hızlı çalışmak ve işte sorumlu kullanım.",
    outcomes: [
      "Use AI assistants for everyday work tasks",
      "Write clearer prompts that get usable answers",
      "Apply responsible AI practices in a workplace",
      "Save time on routine written and research work",
    ],
    provider: "GOOGLE",
    platform: "Coursera",
    url: "https://www.coursera.org/specializations/ai-essentials-google",
    subtitles: ["ar", "tr", "en"],
    difficulty: "BEGINNER",
    estimatedHours: 10,
    isFree: true,
    certificateAvailable: true,
    certificateCost: 49,
    level: "L1",
    category: "FOUNDATIONS",
    rating: 4.8,
    ratingSource: "Coursera",
    qualityScore: 0.94,
    competencies: [
      { key: "WORKPLACE", weight: 3 },
      { key: "PROMPTING", weight: 2 },
      { key: "RESPONSIBLE_AI", weight: 1 },
    ],
    jobFamilies: [{ jobFamily: "GENERAL", weight: 1 }],
    goals: [
      { goalKey: "WRITING", weight: 2 },
      { goalKey: "EMAIL", weight: 2 },
      { goalKey: "REPORTS", weight: 1 },
    ],
  },
  {
    code: "EXT-GOOG-PROMPT",
    slug: "google-prompting-essentials",
    title: "Google Prompting Essentials",
    titleAr: "أساسيات صياغة الأوامر من Google",
    titleTr: "Google Prompt Temelleri",
    description:
      "A short, very practical course on writing prompts that work — for email, summaries, data, brainstorming and building your own AI helpers.",
    descriptionAr:
      "دورة قصيرة وعملية جدًا في كتابة أوامر فعّالة — للبريد الإلكتروني والملخصات والبيانات والعصف الذهني وبناء مساعدين خاصين بك.",
    descriptionTr:
      "Etkili prompt yazmaya dair kısa ve çok pratik bir kurs — e-posta, özet, veri, fikir üretimi ve kendi yapay zekâ yardımcılarınızı kurmak için.",
    outcomes: [
      "Write prompts with context, objective, constraints and output shape",
      "Iterate on a weak answer instead of starting again",
      "Use AI for summarising, drafting and analysis at work",
      "Build reusable prompt templates for your team",
    ],
    provider: "GOOGLE",
    platform: "Coursera",
    url: "https://www.coursera.org/specializations/prompting-essentials-google",
    subtitles: ["ar", "tr", "en"],
    difficulty: "BEGINNER",
    estimatedHours: 9,
    isFree: true,
    certificateAvailable: true,
    certificateCost: 49,
    level: "L1",
    category: "PROMPTING",
    isRecommended: true,
    rating: 4.8,
    ratingSource: "Coursera",
    qualityScore: 0.95,
    competencies: [
      { key: "PROMPTING", weight: 4 },
      { key: "WORKPLACE", weight: 1 },
    ],
    jobFamilies: [{ jobFamily: "GENERAL", weight: 1 }],
    goals: [
      { goalKey: "WRITING", weight: 2 },
      { goalKey: "EMAIL", weight: 2 },
      { goalKey: "REPORTS", weight: 2 },
      { goalKey: "RESEARCH", weight: 1 },
      { goalKey: "PRESENTATIONS", weight: 1 },
    ],
  },
  {
    code: "EXT-VU-PROMPT",
    slug: "prompt-engineering-for-chatgpt",
    title: "Prompt Engineering for ChatGPT",
    titleTr: "ChatGPT için Prompt Mühendisliği",
    titleAr: "هندسة الأوامر لـ ChatGPT",
    description:
      "Vanderbilt University's deeper treatment of prompt patterns: personas, templates, chain of thought, refinement and building small tools with prompts.",
    descriptionAr:
      "معالجة أعمق من جامعة فاندربيلت لأنماط صياغة الأوامر: الشخصيات، والقوالب، وسلسلة التفكير، والتحسين التدريجي، وبناء أدوات صغيرة بالأوامر.",
    descriptionTr:
      "Vanderbilt Üniversitesi'nin prompt kalıplarına derinlemesine bakışı: personalar, şablonlar, düşünce zinciri, iyileştirme ve promptlarla küçük araçlar kurma.",
    outcomes: [
      "Apply named prompt patterns to real problems",
      "Design multi-step prompts for complex tasks",
      "Create prompt templates others can reuse",
      "Evaluate and improve a weak prompt systematically",
    ],
    provider: "VANDERBILT",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/prompt-engineering",
    subtitles: ["en"],
    difficulty: "INTERMEDIATE",
    estimatedHours: 18,
    isFree: true,
    certificateAvailable: true,
    certificateCost: 49,
    level: "L2",
    category: "PROMPTING",
    rating: 4.8,
    ratingSource: "Coursera",
    qualityScore: 0.92,
    competencies: [
      { key: "PROMPTING", weight: 4 },
      { key: "DATA_AUTOMATION", weight: 1 },
    ],
    jobFamilies: [
      { jobFamily: "GENERAL", weight: 1 },
      { jobFamily: "IT", weight: 1 },
    ],
    goals: [
      { goalKey: "AUTOMATION", weight: 2 },
      { goalKey: "WRITING", weight: 1 },
      { goalKey: "DOCUMENT_ANALYSIS", weight: 1 },
    ],
  },
  {
    code: "EXT-ELEMENTS",
    slug: "elements-of-ai",
    title: "Elements of AI",
    titleAr: "أساسيات الذكاء الاصطناعي",
    titleTr: "Yapay Zekânın Temelleri",
    description:
      "The University of Helsinki's free introduction to AI concepts — machine learning, neural networks, and the real societal implications. Self-paced.",
    descriptionAr:
      "مقدمة مجانية من جامعة هلسنكي لمفاهيم الذكاء الاصطناعي — تعلّم الآلة، والشبكات العصبية، والآثار المجتمعية الحقيقية. بوتيرتك الخاصة. متاحة بالإنجليزية فقط.",
    descriptionTr:
      "Helsinki Üniversitesi'nin yapay zekâ kavramlarına ücretsiz girişi — makine öğrenmesi, sinir ağları ve toplumsal etkiler. Kendi hızınızda. Yalnızca İngilizce.",
    outcomes: [
      "Define the core concepts behind modern AI",
      "Understand what machine learning does and does not learn",
      "Reason about AI's limits and societal effects",
      "Hold an informed conversation about AI strategy",
    ],
    provider: "HELSINKI",
    platform: "Elements of AI",
    url: "https://www.elementsofai.com/",
    subtitles: ["en"],
    difficulty: "BEGINNER",
    estimatedHours: 30,
    isFree: true,
    certificateAvailable: true,
    level: "L1",
    category: "FOUNDATIONS",
    rating: 4.7,
    ratingSource: "Elements of AI",
    qualityScore: 0.9,
    competencies: [
      { key: "FUNDAMENTALS", weight: 4 },
      { key: "RESPONSIBLE_AI", weight: 1 },
    ],
    jobFamilies: [{ jobFamily: "GENERAL", weight: 1 }],
    goals: [{ goalKey: "RESEARCH", weight: 1 }],
  },
  {
    code: "EXT-YT-GOOG",
    slug: "google-ai-essentials-youtube",
    title: "Google AI Essentials (video series)",
    titleAr: "أساسيات الذكاء الاصطناعي من Google (سلسلة فيديو)",
    titleTr: "Google AI Temelleri (video serisi)",
    description:
      "The Google AI Essentials video series, playable inside the academy. A good option if you prefer video over reading.",
    descriptionAr:
      "سلسلة فيديو أساسيات الذكاء الاصطناعي من Google، تُشغَّل داخل الأكاديمية. خيار جيد إن كنت تفضّل الفيديو على القراءة.",
    descriptionTr:
      "Google AI Temelleri video serisi, akademi içinde oynatılır. Okumak yerine video izlemeyi tercih edenler için iyi bir seçenek.",
    outcomes: [
      "Follow along with practical AI demonstrations",
      "See real prompts and real answers side by side",
      "Pick up everyday AI habits quickly",
    ],
    provider: "GOOGLE",
    platform: "YouTube",
    url: "https://www.youtube.com/playlist?list=PLTZYG7bZ1u6piogbmszA_TzDyR3K85Qn9",
    youtubePlaylistId: "PLTZYG7bZ1u6piogbmszA_TzDyR3K85Qn9",
    subtitles: ["en", "ar", "tr"],
    difficulty: "BEGINNER",
    estimatedHours: 4,
    isFree: true,
    level: "L0",
    category: "FOUNDATIONS",
    qualityScore: 0.82,
    competencies: [
      { key: "FUNDAMENTALS", weight: 2 },
      { key: "WORKPLACE", weight: 1 },
    ],
    jobFamilies: [{ jobFamily: "GENERAL", weight: 1 }],
    goals: [{ goalKey: "WRITING", weight: 1 }],
  },
  {
    code: "EXT-MS-GENAI",
    slug: "microsoft-generative-ai-for-beginners",
    title: "Microsoft Generative AI for Beginners",
    titleAr: "الذكاء الاصطناعي التوليدي للمبتدئين من Microsoft",
    titleTr: "Microsoft Yeni Başlayanlar için Üretken Yapay Zekâ",
    description:
      "Microsoft's free 18-lesson series on building with generative AI. Suitable for technical colleagues who want to go beyond using AI to building with it.",
    descriptionAr:
      "سلسلة مجانية من 18 درسًا من Microsoft حول البناء بالذكاء الاصطناعي التوليدي. مناسبة للزملاء التقنيين الذين يريدون الانتقال من الاستخدام إلى البناء.",
    descriptionTr:
      "Microsoft'un üretken yapay zekâ ile geliştirmeye dair ücretsiz 18 derslik serisi. Kullanmaktan geliştirmeye geçmek isteyen teknik ekipler için.",
    outcomes: [
      "Understand tokens, embeddings and model behaviour",
      "Design and evaluate prompts programmatically",
      "Build a simple generative AI application",
      "Apply responsible AI principles in a build",
    ],
    provider: "MICROSOFT",
    platform: "YouTube",
    url: "https://www.youtube.com/playlist?list=PLlrxD0HtieHj2nfK54c62lcs3-YSTx3Je",
    youtubePlaylistId: "PLlrxD0HtieHj2nfK54c62lcs3-YSTx3Je",
    subtitles: ["en"],
    difficulty: "INTERMEDIATE",
    estimatedHours: 12,
    isFree: true,
    level: "L3",
    category: "TECHNICAL",
    isTechnical: true,
    qualityScore: 0.9,
    competencies: [
      { key: "TECHNICAL", weight: 4 },
      { key: "FUNDAMENTALS", weight: 1 },
    ],
    jobFamilies: [{ jobFamily: "IT", weight: 2 }],
    goals: [
      { goalKey: "PROGRAMMING", weight: 2 },
      { goalKey: "AUTOMATION", weight: 1 },
    ],
  },
  {
    code: "EXT-FCC-ML",
    slug: "machine-learning-for-everybody",
    title: "Machine Learning for Everybody",
    titleAr: "تعلّم الآلة للجميع",
    titleTr: "Herkes İçin Makine Öğrenmesi",
    description:
      "A free, hands-on introduction to machine learning with Python from freeCodeCamp. For colleagues who want to understand models from the inside.",
    descriptionAr:
      "مقدمة عملية مجانية إلى تعلّم الآلة باستخدام Python من freeCodeCamp. لمن يريد فهم النماذج من الداخل.",
    descriptionTr:
      "freeCodeCamp'ten Python ile makine öğrenmesine ücretsiz ve uygulamalı giriş. Modelleri içeriden anlamak isteyenler için.",
    outcomes: [
      "Train and evaluate a basic machine learning model",
      "Understand classification and regression",
      "Prepare a dataset for training",
      "Read and interpret model metrics",
    ],
    provider: "FREECODECAMP",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=i_LwzRVP7bg",
    subtitles: ["en"],
    difficulty: "INTERMEDIATE",
    estimatedHours: 7,
    isFree: true,
    level: "L4",
    category: "TECHNICAL",
    isTechnical: true,
    qualityScore: 0.85,
    competencies: [{ key: "TECHNICAL", weight: 4 }],
    jobFamilies: [{ jobFamily: "IT", weight: 2 }],
    goals: [{ goalKey: "PROGRAMMING", weight: 2 }],
  },
  {
    code: "EXT-KAGGLE-PROG",
    slug: "kaggle-intro-to-programming",
    title: "Kaggle: Intro to Programming",
    titleAr: "Kaggle: مقدمة في البرمجة",
    titleTr: "Kaggle: Programlamaya Giriş",
    description: "A short, free Python primer. The starting point if you want to work with data or automate tasks with code.",
    descriptionAr:
      "مقدمة قصيرة ومجانية إلى Python. نقطة البداية إن أردت العمل مع البيانات أو أتمتة المهام بالكود.",
    descriptionTr:
      "Kısa ve ücretsiz bir Python girişi. Veriyle çalışmak veya görevleri kodla otomatikleştirmek isteyenler için başlangıç noktası.",
    outcomes: [
      "Write and run basic Python",
      "Work with variables, lists and loops",
      "Read simple code written by colleagues",
    ],
    provider: "KAGGLE",
    platform: "Kaggle",
    url: "https://www.kaggle.com/learn/intro-to-programming",
    subtitles: ["en"],
    difficulty: "BEGINNER",
    estimatedHours: 5,
    isFree: true,
    certificateAvailable: true,
    level: "L3",
    category: "TECHNICAL",
    isTechnical: true,
    qualityScore: 0.86,
    competencies: [{ key: "TECHNICAL", weight: 3 }],
    jobFamilies: [{ jobFamily: "IT", weight: 2 }],
    goals: [{ goalKey: "PROGRAMMING", weight: 2 }],
  },
  {
    code: "EXT-KAGGLE-ML",
    slug: "kaggle-intro-to-machine-learning",
    title: "Kaggle: Intro to Machine Learning",
    titleAr: "Kaggle: مقدمة في تعلّم الآلة",
    titleTr: "Kaggle: Makine Öğrenmesine Giriş",
    description: "Build your first model in a few hours, using a real dataset and real evaluation.",
    descriptionAr:
      "ابنِ نموذجك الأول في بضع ساعات باستخدام مجموعة بيانات حقيقية وتقييم حقيقي.",
    descriptionTr:
      "Gerçek bir veri kümesi ve gerçek bir değerlendirmeyle ilk modelinizi birkaç saatte kurun.",
    outcomes: [
      "Build a decision tree model end to end",
      "Split data for training and validation",
      "Measure and improve model accuracy",
    ],
    provider: "KAGGLE",
    platform: "Kaggle",
    url: "https://www.kaggle.com/learn/intro-to-machine-learning",
    subtitles: ["en"],
    difficulty: "INTERMEDIATE",
    estimatedHours: 3,
    isFree: true,
    certificateAvailable: true,
    level: "L4",
    category: "TECHNICAL",
    isTechnical: true,
    qualityScore: 0.88,
    competencies: [{ key: "TECHNICAL", weight: 4 }],
    jobFamilies: [{ jobFamily: "IT", weight: 2 }],
    goals: [{ goalKey: "PROGRAMMING", weight: 2 }, { goalKey: "DATA_ANALYSIS", weight: 1 }],
    prerequisites: ["EXT-KAGGLE-PROG"],
  },
];

export async function seedCatalogBase(prisma: Db) {
  for (const p of PROVIDERS) {
    await prisma.courseProvider.upsert({ where: { key: p.key }, update: p, create: p });
  }
  for (const c of CATEGORIES) {
    await prisma.courseCategory.upsert({ where: { key: c.key }, update: c, create: c });
  }
}

export async function upsertCourse(prisma: Db, seed: CourseSeed) {
  const provider = await prisma.courseProvider.findUniqueOrThrow({ where: { key: seed.provider } });
  const category = await prisma.courseCategory.findUnique({ where: { key: seed.category } });
  const level = await prisma.skillLevel.findUnique({ where: { code: seed.level } });

  const data = {
    slug: seed.slug,
    title: seed.title,
    titleAr: seed.titleAr ?? null,
    titleTr: seed.titleTr ?? null,
    description: seed.description,
    descriptionAr: seed.descriptionAr ?? null,
    descriptionTr: seed.descriptionTr ?? null,
    outcomes: JSON.stringify(seed.outcomes),
    outcomesAr: JSON.stringify(seed.outcomesAr ?? []),
    outcomesTr: JSON.stringify(seed.outcomesTr ?? []),
    providerId: provider.id,
    platform: seed.platform,
    url: seed.url ?? null,
    language: seed.language ?? "en",
    difficulty: seed.difficulty,
    estimatedHours: seed.estimatedHours,
    isFree: seed.isFree ?? true,
    price: seed.price ?? null,
    certificateAvailable: seed.certificateAvailable ?? false,
    certificateCost: seed.certificateCost ?? null,
    aiLevelId: level?.id ?? null,
    categoryId: category?.id ?? null,
    status: "PUBLISHED",
    isInternal: seed.isInternal ?? false,
    isTechnical: seed.isTechnical ?? false,
    isMandatory: seed.isMandatory ?? false,
    isRecommended: seed.isRecommended ?? false,
    youtubePlaylistId: seed.youtubePlaylistId ?? null,
    rating: seed.rating ?? null,
    ratingSource: seed.ratingSource ?? null,
    qualityScore: seed.qualityScore,
    lastVerifiedAt: new Date(),
    linkWorking: true,
    stillAvailable: true,
  };

  const course = await prisma.course.upsert({
    where: { code: seed.code },
    update: data,
    create: { code: seed.code, ...data },
  });

  await prisma.courseCompetency.deleteMany({ where: { courseId: course.id } });
  for (const c of seed.competencies) {
    const comp = await prisma.competency.findUnique({ where: { key: c.key } });
    if (comp) {
      await prisma.courseCompetency.create({
        data: { courseId: course.id, competencyId: comp.id, weight: c.weight },
      });
    }
  }

  await prisma.courseDepartment.deleteMany({ where: { courseId: course.id } });
  for (const code of seed.departments ?? []) {
    const dept = await prisma.department.findUnique({ where: { code } });
    if (dept) {
      await prisma.courseDepartment.create({ data: { courseId: course.id, departmentId: dept.id, weight: 2 } });
    }
  }

  await prisma.courseJobFamily.deleteMany({ where: { courseId: course.id } });
  for (const j of seed.jobFamilies ?? []) {
    await prisma.courseJobFamily.create({
      data: { courseId: course.id, jobFamily: j.jobFamily, weight: j.weight },
    });
  }

  await prisma.courseGoal.deleteMany({ where: { courseId: course.id } });
  for (const g of seed.goals ?? []) {
    await prisma.courseGoal.create({ data: { courseId: course.id, goalKey: g.goalKey, weight: g.weight } });
  }

  await prisma.courseLanguage.deleteMany({ where: { courseId: course.id } });
  await prisma.courseLanguage.create({
    data: { courseId: course.id, language: seed.language ?? "en", isSubtitle: false },
  });
  for (const s of seed.subtitles ?? []) {
    if (s === (seed.language ?? "en")) continue;
    await prisma.courseLanguage.create({ data: { courseId: course.id, language: s, isSubtitle: true } });
  }

  return course;
}

export async function linkPrerequisites(prisma: Db, seeds: CourseSeed[]) {
  for (const seed of seeds) {
    if (!seed.prerequisites?.length) continue;
    const course = await prisma.course.findUnique({ where: { code: seed.code } });
    if (!course) continue;
    await prisma.coursePrerequisite.deleteMany({ where: { courseId: course.id } });
    for (const code of seed.prerequisites) {
      const prereq = await prisma.course.findUnique({ where: { code } });
      if (prereq) {
        await prisma.coursePrerequisite.create({
          data: { courseId: course.id, prerequisiteId: prereq.id },
        });
      }
    }
  }
}

export async function seedExternalCourses(prisma: Db) {
  await seedCatalogBase(prisma);
  for (const seed of EXTERNAL_COURSES) await upsertCourse(prisma, seed);
  await linkPrerequisites(prisma, EXTERNAL_COURSES);
}
