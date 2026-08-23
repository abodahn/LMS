import type { Db } from "./client";
import { upsertCourse, linkPrerequisites, type CourseSeed } from "./courses";

/**
 * Catalog depth.
 *
 * The core catalog covers the corporate journey; this file adds the breadth an
 * L&D team needs once people finish it — data skills, technical tracks and the
 * short, specific courses that answer "what do I do next?".
 *
 * Everything here is free to take, from a provider whose URLs are stable, and
 * was checked when this file was written. For a catalog of hundreds or
 * thousands, use Admin → Courses → Import rather than adding entries here: a
 * provider export loads in one pass and stays current, which hand-maintained
 * entries never do.
 */

const kaggle = (
  slug: string,
  title: string,
  titleAr: string,
  titleTr: string,
  description: string,
  hours: number,
  level: string,
  extra: Partial<CourseSeed> = {},
): CourseSeed => ({
  code: `EXT-KAGGLE-${slug.toUpperCase().replace(/-/g, "_")}`,
  slug: `kaggle-${slug}`,
  title: `Kaggle: ${title}`,
  titleAr: `Kaggle: ${titleAr}`,
  titleTr: `Kaggle: ${titleTr}`,
  description,
  outcomes: [],
  provider: "KAGGLE",
  platform: "Kaggle",
  url: `https://www.kaggle.com/learn/${slug}`,
  subtitles: ["en"],
  difficulty: "INTERMEDIATE",
  estimatedHours: hours,
  isFree: true,
  certificateAvailable: true,
  level,
  category: "TECHNICAL",
  isTechnical: true,
  qualityScore: 0.86,
  competencies: [{ key: "TECHNICAL", weight: 4 }],
  jobFamilies: [{ jobFamily: "IT", weight: 2 }],
  goals: [{ goalKey: "PROGRAMMING", weight: 2 }],
  ...extra,
});

/** Kaggle Learn — short, free, hands-on, and the URLs have not moved in years. */
export const KAGGLE_COURSES: CourseSeed[] = [
  kaggle("python", "Python", "بايثون", "Python",
    "The Python you need before anything else: variables, functions, lists, loops and libraries. Hands-on in the browser, no setup.", 7, "L3"),
  kaggle("pandas", "Pandas", "مكتبة Pandas", "Pandas",
    "Reading, cleaning, filtering and grouping tabular data in Python — the everyday work of any data task.", 4, "L3",
    { goals: [{ goalKey: "DATA_ANALYSIS", weight: 3 }, { goalKey: "EXCEL", weight: 1 }] }),
  kaggle("data-visualization", "Data Visualization", "تصور البيانات", "Veri Görselleştirme",
    "Making charts that answer a question rather than decorate a slide.", 4, "L3",
    { goals: [{ goalKey: "DATA_ANALYSIS", weight: 2 }, { goalKey: "PRESENTATIONS", weight: 2 }] }),
  kaggle("data-cleaning", "Data Cleaning", "تنظيف البيانات", "Veri Temizleme",
    "Missing values, inconsistent entries, bad dates and character encodings — the part of analysis that actually takes the time.", 4, "L3",
    { goals: [{ goalKey: "DATA_ANALYSIS", weight: 3 }] }),
  kaggle("intro-to-sql", "Intro to SQL", "مقدمة في SQL", "SQL'e Giriş",
    "Querying a database directly instead of waiting for an export.", 3, "L3",
    { goals: [{ goalKey: "DATA_ANALYSIS", weight: 3 }] }),
  kaggle("advanced-sql", "Advanced SQL", "SQL المتقدم", "İleri SQL",
    "Joins, unions, window functions and writing queries that stay fast on real tables.", 4, "L4",
    { prerequisites: ["EXT-KAGGLE-INTRO_TO_SQL"], goals: [{ goalKey: "DATA_ANALYSIS", weight: 3 }] }),
  kaggle("intermediate-machine-learning", "Intermediate Machine Learning", "تعلّم الآلة المتوسط", "Orta Düzey Makine Öğrenmesi",
    "Handling missing values and categorical data, building pipelines, cross-validation and gradient boosting.", 4, "L4",
    { prerequisites: ["EXT-KAGGLE-ML"] }),
  kaggle("feature-engineering", "Feature Engineering", "هندسة الخصائص", "Öznitelik Mühendisliği",
    "Getting more out of a model by shaping the inputs, which is usually worth more than a bigger model.", 5, "L4"),
  kaggle("intro-to-deep-learning", "Intro to Deep Learning", "مقدمة في التعلّم العميق", "Derin Öğrenmeye Giriş",
    "Neural networks with Keras: layers, activation, overfitting and how training actually proceeds.", 4, "L4"),
  kaggle("computer-vision", "Computer Vision", "الرؤية الحاسوبية", "Bilgisayarlı Görü",
    "Image classification with convolutional networks — the foundation of any automated visual inspection work.", 4, "L4",
    { departments: ["QLT", "PRD"], jobFamilies: [{ jobFamily: "IT", weight: 2 }, { jobFamily: "QUALITY", weight: 1 }] }),
  kaggle("natural-language-processing", "Natural Language Processing", "معالجة اللغة الطبيعية", "Doğal Dil İşleme",
    "Working with text as data: classification, word vectors and where language models fit.", 4, "L4"),
  kaggle("time-series", "Time Series", "السلاسل الزمنية", "Zaman Serileri",
    "Trend, seasonality and forecasting — the shape of demand planning and production data.", 5, "L4",
    { departments: ["PLN", "SCM"], goals: [{ goalKey: "DATA_ANALYSIS", weight: 3 }] }),
  kaggle("machine-learning-explainability", "Machine Learning Explainability", "تفسير نماذج تعلّم الآلة", "Makine Öğrenmesi Açıklanabilirliği",
    "Why a model made a prediction, and how to answer that question to somebody who has to sign off on it.", 4, "L4",
    { competencies: [{ key: "TECHNICAL", weight: 3 }, { key: "RESPONSIBLE_AI", weight: 2 }] }),
  kaggle("geospatial-analysis", "Geospatial Analysis", "التحليل الجغرافي المكاني", "Coğrafi Veri Analizi",
    "Mapping and analysing location data — useful for logistics, sourcing and distribution questions.", 4, "L4",
    { departments: ["SCM", "WHS"] }),
  kaggle("intro-to-game-ai-and-reinforcement-learning", "Intro to Game AI and Reinforcement Learning", "مقدمة في التعلّم المعزّز", "Oyun Yapay Zekâsı ve Pekiştirmeli Öğrenmeye Giriş",
    "Agents that learn by trying: the clearest available introduction to reinforcement learning.", 4, "L4"),
  kaggle("intro-to-ai-ethics", "Intro to AI Ethics", "مقدمة في أخلاقيات الذكاء الاصطناعي", "Yapay Zekâ Etiğine Giriş",
    "Bias, fairness, model cards and explainability — applied, with exercises, not a lecture on principles.", 4, "L2",
    {
      category: "RESPONSIBLE_AI",
      isTechnical: false,
      difficulty: "BEGINNER",
      competencies: [{ key: "RESPONSIBLE_AI", weight: 5 }, { key: "FUNDAMENTALS", weight: 1 }],
      jobFamilies: [{ jobFamily: "GENERAL", weight: 2 }],
      goals: [{ goalKey: "DECISION_MAKING", weight: 2 }],
    }),
];

const dlai = (
  slug: string,
  title: string,
  titleAr: string,
  titleTr: string,
  description: string,
  hours: number,
  level: string,
  extra: Partial<CourseSeed> = {},
): CourseSeed => ({
  code: `EXT-DLAI-${slug.toUpperCase().replace(/-/g, "_").slice(0, 40)}`,
  slug: `dlai-${slug}`,
  title,
  titleAr,
  titleTr,
  description,
  outcomes: [],
  provider: "DEEPLEARNING_AI",
  platform: "DeepLearning.AI",
  url: `https://www.deeplearning.ai/short-courses/${slug}/`,
  subtitles: ["en"],
  difficulty: "INTERMEDIATE",
  estimatedHours: hours,
  isFree: true,
  certificateAvailable: false,
  level,
  category: "TECHNICAL",
  isTechnical: true,
  qualityScore: 0.92,
  competencies: [{ key: "TECHNICAL", weight: 4 }],
  jobFamilies: [{ jobFamily: "IT", weight: 3 }],
  goals: [{ goalKey: "PROGRAMMING", weight: 2 }],
  ...extra,
});

/** DeepLearning.AI short courses — an hour or two each, free, current. */
export const SHORT_COURSES: CourseSeed[] = [
  dlai(
    "ai-prompting-for-everyone",
    "AI Prompting for Everyone",
    "صياغة أوامر الذكاء الاصطناعي للجميع",
    "Herkes İçin Yapay Zekâ Prompt Yazımı",
    "Andrew Ng's practical prompting course for people who are not developers: iterating on a prompt, giving context, and getting work-ready output. No coding.",
    7,
    "L1",
    {
      category: "PROMPTING",
      isTechnical: false,
      difficulty: "BEGINNER",
      isRecommended: true,
      competencies: [{ key: "PROMPTING", weight: 5 }, { key: "WORKPLACE", weight: 2 }],
      jobFamilies: [{ jobFamily: "GENERAL", weight: 2 }],
      goals: [
        { goalKey: "WRITING", weight: 3 },
        { goalKey: "EMAIL", weight: 2 },
        { goalKey: "REPORTS", weight: 2 },
        { goalKey: "RESEARCH", weight: 1 },
      ],
    },
  ),
  dlai(
    "build-with-andrew",
    "Build with Andrew",
    "ابنِ مع أندرو",
    "Andrew ile Geliştir",
    "Turning an idea into a working application with AI assistance, for people who have never written code.",
    1.5,
    "L2",
    {
      isTechnical: false,
      difficulty: "BEGINNER",
      category: "GENERATIVE_AI",
      competencies: [{ key: "WORKPLACE", weight: 3 }, { key: "PROMPTING", weight: 2 }],
      jobFamilies: [{ jobFamily: "GENERAL", weight: 1 }],
      goals: [{ goalKey: "AUTOMATION", weight: 2 }],
    },
  ),
  dlai(
    "embedding-models-from-architecture-to-implementation",
    "Embedding Models: from Architecture to Implementation",
    "نماذج التمثيل المتجهي: من البنية إلى التطبيق",
    "Embedding Modelleri: Mimariden Uygulamaya",
    "How embeddings work and how to build semantic search on top of them.",
    1,
    "L4",
  ),
  dlai(
    "event-driven-agentic-document-workflows",
    "Event-Driven Agentic Document Workflows",
    "سير عمل المستندات بالوكلاء المدفوعة بالأحداث",
    "Olay Güdümlü Ajan Tabanlı Belge Akışları",
    "Processing documents with retrieval and a human review step in the loop — the shape most real internal AI tools take.",
    1.5,
    "L4",
  ),
  dlai(
    "building-toward-computer-use-with-anthropic",
    "Building toward Computer Use with Anthropic",
    "نحو استخدام الحاسوب مع Anthropic",
    "Anthropic ile Bilgisayar Kullanımına Doğru",
    "How an AI assistant carries out tasks on a computer, and what has to be controlled when it does.",
    2,
    "L4",
    { competencies: [{ key: "TECHNICAL", weight: 3 }, { key: "RESPONSIBLE_AI", weight: 2 }] },
  ),
  dlai(
    "voice-for-ai-agents-and-applications",
    "Voice for AI Agents and Applications",
    "الصوت في تطبيقات ووكلاء الذكاء الاصطناعي",
    "Yapay Zekâ Ajanları ve Uygulamaları için Ses",
    "Adding speech in and out of an AI application — relevant anywhere hands are busy, including the factory floor.",
    1.5,
    "L4",
  ),
  dlai(
    "spec-driven-development-with-coding-agents",
    "Spec-Driven Development with Coding Agents",
    "التطوير المبني على المواصفات مع وكلاء البرمجة",
    "Kodlama Ajanlarıyla Şartname Odaklı Geliştirme",
    "Writing a specification precise enough that a coding agent produces what you actually wanted.",
    1.5,
    "L4",
  ),
];

export const MICROSOFT_COURSES: CourseSeed[] = [
  {
    code: "EXT-MSLEARN-AI-APPS",
    slug: "mslearn-ai-apps-agents",
    title: "Get started with AI applications and agents on Azure",
    titleAr: "ابدأ مع تطبيقات ووكلاء الذكاء الاصطناعي على Azure",
    titleTr: "Azure'da Yapay Zekâ Uygulamaları ve Ajanlarına Başlangıç",
    description:
      "Microsoft's free seven-module path through generative AI and agents, text analysis, speech, computer vision and information extraction on Azure. Assumes basic Python.",
    descriptionAr:
      "مسار مجاني من سبع وحدات من Microsoft يغطي الذكاء الاصطناعي التوليدي والوكلاء وتحليل النصوص والكلام والرؤية الحاسوبية واستخراج المعلومات على Azure. يفترض معرفة أساسية بـ Python.",
    descriptionTr:
      "Microsoft'un ücretsiz yedi modüllük yolu: Azure üzerinde üretken yapay zekâ ve ajanlar, metin analizi, konuşma, bilgisayarlı görü ve bilgi çıkarımı. Temel Python bilgisi varsayar.",
    outcomes: [],
    provider: "MICROSOFT",
    platform: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/training/paths/get-started-ai-apps-agents/",
    subtitles: ["en"],
    difficulty: "INTERMEDIATE",
    estimatedHours: 8,
    isFree: true,
    certificateAvailable: false,
    level: "L4",
    category: "TECHNICAL",
    isTechnical: true,
    qualityScore: 0.9,
    competencies: [{ key: "TECHNICAL", weight: 5 }],
    jobFamilies: [{ jobFamily: "IT", weight: 3 }],
    goals: [{ goalKey: "PROGRAMMING", weight: 3 }],
  },
];


/**
 * Arabic and Turkish descriptions for the courses above, keyed by code so the
 * English definitions stay readable. Titles are written inline; descriptions
 * live here because they are the long half.
 */
const DESCRIPTIONS_I18N: Record<string, { descriptionAr: string; descriptionTr: string }> = {
  "EXT-KAGGLE-PYTHON": {
    descriptionAr: "أساسيات بايثون قبل أي شيء آخر: المتغيرات والدوال والقوائم والحلقات والمكتبات. تطبيق مباشر في المتصفح بدون أي إعداد.",
    descriptionTr: "Her şeyden önce gereken Python: değişkenler, fonksiyonlar, listeler, döngüler ve kütüphaneler. Kurulum gerektirmeden tarayıcıda uygulamalı.",
  },
  "EXT-KAGGLE-PANDAS": {
    descriptionAr: "قراءة البيانات الجدولية وتنظيفها وتصفيتها وتجميعها في بايثون — العمل اليومي لأي مهمة بيانات.",
    descriptionTr: "Python'da tablo verisini okuma, temizleme, filtreleme ve gruplama — her veri işinin günlük işi.",
  },
  "EXT-KAGGLE-DATA_VISUALIZATION": {
    descriptionAr: "إنشاء رسوم بيانية تجيب عن سؤال بدل أن تزيّن شريحة.",
    descriptionTr: "Bir slaytı süslemek yerine bir soruyu yanıtlayan grafikler yapmak.",
  },
  "EXT-KAGGLE-DATA_CLEANING": {
    descriptionAr: "القيم المفقودة والإدخالات غير المتسقة والتواريخ الخاطئة وترميز المحارف — الجزء من التحليل الذي يستهلك الوقت فعليًا.",
    descriptionTr: "Eksik değerler, tutarsız girdiler, bozuk tarihler ve karakter kodlamaları — analizin gerçekte zaman alan kısmı.",
  },
  "EXT-KAGGLE-INTRO_TO_SQL": {
    descriptionAr: "الاستعلام من قاعدة البيانات مباشرة بدل انتظار تصدير من شخص آخر.",
    descriptionTr: "Bir dışa aktarma beklemek yerine veritabanını doğrudan sorgulamak.",
  },
  "EXT-KAGGLE-ADVANCED_SQL": {
    descriptionAr: "الربط والدمج ودوال النوافذ، وكتابة استعلامات تظل سريعة على جداول حقيقية.",
    descriptionTr: "Join'ler, union'lar, pencere fonksiyonları ve gerçek tablolarda hızlı kalan sorgular yazmak.",
  },
  "EXT-KAGGLE-INTERMEDIATE_MACHINE_LEARNING": {
    descriptionAr: "التعامل مع القيم المفقودة والبيانات الفئوية، وبناء خطوط المعالجة، والتحقق المتقاطع، والتعزيز التدرّجي.",
    descriptionTr: "Eksik değerler ve kategorik veriyle başa çıkma, pipeline kurma, çapraz doğrulama ve gradient boosting.",
  },
  "EXT-KAGGLE-FEATURE_ENGINEERING": {
    descriptionAr: "تحسين النموذج عبر تشكيل المدخلات، وهو عادةً أجدى من استخدام نموذج أكبر.",
    descriptionTr: "Girdileri şekillendirerek modelden daha fazlasını almak — genellikle daha büyük bir modelden daha değerlidir.",
  },
  "EXT-KAGGLE-INTRO_TO_DEEP_LEARNING": {
    descriptionAr: "الشبكات العصبية باستخدام Keras: الطبقات ودوال التنشيط والإفراط في المطابقة وكيف يجري التدريب فعليًا.",
    descriptionTr: "Keras ile sinir ağları: katmanlar, aktivasyon, aşırı öğrenme ve eğitimin gerçekte nasıl ilerlediği.",
  },
  "EXT-KAGGLE-COMPUTER_VISION": {
    descriptionAr: "تصنيف الصور بالشبكات الالتفافية — أساس أي عمل على الفحص البصري الآلي.",
    descriptionTr: "Evrişimli ağlarla görüntü sınıflandırma — otomatik görsel muayenenin temeli.",
  },
  "EXT-KAGGLE-NATURAL_LANGUAGE_PROCESSING": {
    descriptionAr: "التعامل مع النص كبيانات: التصنيف وتمثيلات الكلمات وأين تقع النماذج اللغوية.",
    descriptionTr: "Metni veri olarak işlemek: sınıflandırma, kelime vektörleri ve dil modellerinin yeri.",
  },
  "EXT-KAGGLE-TIME_SERIES": {
    descriptionAr: "الاتجاه والموسمية والتنبؤ — وهي شكل بيانات تخطيط الطلب والإنتاج.",
    descriptionTr: "Trend, mevsimsellik ve tahminleme — talep planlama ve üretim verisinin şekli.",
  },
  "EXT-KAGGLE-MACHINE_LEARNING_EXPLAINABILITY": {
    descriptionAr: "لماذا أعطى النموذج هذا التنبؤ، وكيف تجيب عن هذا السؤال لشخص عليه أن يعتمد النتيجة.",
    descriptionTr: "Modelin neden o tahmini yaptığı ve bunu onay verecek birine nasıl anlatacağınız.",
  },
  "EXT-KAGGLE-GEOSPATIAL_ANALYSIS": {
    descriptionAr: "رسم وتحليل بيانات المواقع — مفيد في أسئلة اللوجستيات والتوريد والتوزيع.",
    descriptionTr: "Konum verisini haritalama ve analiz etme — lojistik, tedarik ve dağıtım soruları için yararlı.",
  },
  "EXT-KAGGLE-INTRO_TO_GAME_AI_AND_REINFORCEMENT_LEARNING": {
    descriptionAr: "وكلاء يتعلمون بالمحاولة: أوضح مقدمة متاحة للتعلّم المعزّز.",
    descriptionTr: "Deneyerek öğrenen ajanlar: pekiştirmeli öğrenmeye mevcut en anlaşılır giriş.",
  },
  "EXT-KAGGLE-INTRO_TO_AI_ETHICS": {
    descriptionAr: "التحيّز والإنصاف وبطاقات النماذج وقابلية التفسير — بشكل تطبيقي مع تمارين، وليس محاضرة في المبادئ.",
    descriptionTr: "Önyargı, adalet, model kartları ve açıklanabilirlik — ilkeler üzerine bir ders değil, alıştırmalarla uygulamalı.",
  },
  "EXT-DLAI-AI_PROMPTING_FOR_EVERYONE": {
    descriptionAr: "دورة أندرو إنج العملية في صياغة الأوامر لغير المبرمجين: تحسين الأمر تدريجيًا، وإعطاء السياق، والحصول على مخرجات صالحة للعمل. بدون برمجة.",
    descriptionTr: "Andrew Ng'in geliştirici olmayanlar için pratik prompt kursu: promptu iyileştirme, bağlam verme ve işe yarar çıktı alma. Kod yok.",
  },
  "EXT-DLAI-BUILD_WITH_ANDREW": {
    descriptionAr: "تحويل فكرة إلى تطبيق يعمل بمساعدة الذكاء الاصطناعي، لمن لم يكتب كودًا من قبل.",
    descriptionTr: "Hiç kod yazmamış kişiler için, bir fikri yapay zekâ yardımıyla çalışan bir uygulamaya dönüştürmek.",
  },
  "EXT-DLAI-EMBEDDING_MODELS_FROM_ARCHITECTURE_TO_IM": {
    descriptionAr: "كيف تعمل التمثيلات المتجهية وكيف تبني بحثًا دلاليًا فوقها.",
    descriptionTr: "Embedding'lerin nasıl çalıştığı ve üzerine semantik arama kurma.",
  },
  "EXT-DLAI-EVENT_DRIVEN_AGENTIC_DOCUMENT_WORKFLOWS": {
    descriptionAr: "معالجة المستندات بالاسترجاع مع خطوة مراجعة بشرية ضمن الدورة — وهو الشكل الذي تأخذه معظم الأدوات الداخلية الحقيقية.",
    descriptionTr: "Belgeleri erişim ve döngüde bir insan inceleme adımıyla işlemek — gerçek iç yapay zekâ araçlarının çoğunun aldığı biçim.",
  },
  "EXT-DLAI-BUILDING_TOWARD_COMPUTER_USE_WITH_ANTHRO": {
    descriptionAr: "كيف ينفّذ مساعد ذكاء اصطناعي مهام على الحاسوب، وما الذي يجب ضبطه عندما يفعل ذلك.",
    descriptionTr: "Bir yapay zekâ asistanının bilgisayarda görevleri nasıl yürüttüğü ve bunu yaparken nelerin denetlenmesi gerektiği.",
  },
  "EXT-DLAI-VOICE_FOR_AI_AGENTS_AND_APPLICATIONS": {
    descriptionAr: "إضافة الصوت دخولًا وخروجًا في تطبيق ذكاء اصطناعي — مفيد حيثما تكون اليدان مشغولتين، بما في ذلك أرض المصنع.",
    descriptionTr: "Bir yapay zekâ uygulamasına ses girişi ve çıkışı eklemek — eller meşgulken, üretim sahası dahil, her yerde işe yarar.",
  },
  "EXT-DLAI-SPEC_DRIVEN_DEVELOPMENT_WITH_CODING_AGEN": {
    descriptionAr: "كتابة مواصفة دقيقة بما يكفي ليُنتج وكيل البرمجة ما أردته فعلًا.",
    descriptionTr: "Bir kodlama ajanının gerçekten istediğinizi üretmesini sağlayacak kadar kesin bir şartname yazmak.",
  },
};

/** Applies the translations above; a course without one keeps its English. */
function withDescriptions(courses: CourseSeed[]): CourseSeed[] {
  return courses.map((c) => ({ ...c, ...(DESCRIPTIONS_I18N[c.code] ?? {}) }));
}

export const EXTENDED_COURSES: CourseSeed[] = withDescriptions([
  ...KAGGLE_COURSES,
  ...SHORT_COURSES,
  ...MICROSOFT_COURSES,
]);

export async function seedExtendedCourses(prisma: Db) {
  for (const seed of EXTENDED_COURSES) await upsertCourse(prisma, seed);
  await linkPrerequisites(prisma, EXTENDED_COURSES);
}
