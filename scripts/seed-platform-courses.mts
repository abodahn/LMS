/**
 * Adds the free courses that live on real training platforms rather than YouTube.
 *
 *   npx tsx scripts/seed-platform-courses.mts
 *   npx tsx scripts/seed-platform-courses.mts --dry
 *
 * Every row is checked before it is allowed in: the URL has to answer, and the
 * request has to finish on the path it started on. That second part is the one
 * that matters — a retired course redirects to a catalogue index, which would
 * otherwise pass as a healthy 200 and leave a link in the catalogue that does
 * not go where it claims. Anything that fails is dropped and named in the
 * output, so the list shrinks rather than going stale silently.
 *
 * Everything here is free to start. `Certificate` is only "yes" where the
 * certificate itself costs nothing, so the catalogue's "no approval needed"
 * filter stays truthful.
 */
import "dotenv/config";
import { validateCourseRows, commitCourseImport, COURSE_IMPORT_COLUMNS } from "../src/lib/import/courses";

type Entry = {
  code: string;
  title: string;
  url: string;
  provider: string;
  platform: string;
  language: "en" | "ar" | "tr";
  level: "L0" | "L1" | "L2" | "L3" | "L4";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  hours: number;
  category: string;
  competencies?: string;
  technical?: boolean;
  certificate?: boolean;
  /** Expected in the served HTML. Reported when missing, not fatal: several of
   * these platforms render the course page in the browser. */
  expect: string;
  description: string;
  descriptionAr: string;
  descriptionTr: string;
};

const COURSES: Entry[] = [
  {
    code: "PF-ELEMENTS-AI",
    title: "Elements of AI",
    url: "https://www.elementsofai.com/",
    provider: "University of Helsinki",
    platform: "Elements of AI",
    language: "en",
    level: "L1",
    difficulty: "BEGINNER",
    hours: 30,
    category: "FOUNDATIONS",
    competencies: "FUNDAMENTALS:5",
    certificate: true,
    expect: "Elements of AI",
    description:
      "The University of Helsinki's open course on what AI is, how it reasons, and where its limits are. No mathematics or programming required.",
    descriptionAr:
      "المساق المفتوح من جامعة هلسنكي حول ماهية الذكاء الاصطناعي وكيف يستنتج وأين تقف حدوده. لا يتطلب رياضيات ولا برمجة.",
    descriptionTr:
      "Helsinki Üniversitesi'nin açık kursu: yapay zekânın ne olduğu, nasıl akıl yürüttüğü ve sınırlarının nerede olduğu. Matematik veya programlama gerekmez.",
  },
  {
    code: "PF-AI-FOR-EVERYONE",
    title: "AI For Everyone",
    url: "https://www.coursera.org/learn/ai-for-everyone",
    provider: "DeepLearning.AI",
    platform: "Coursera",
    language: "en",
    level: "L1",
    difficulty: "BEGINNER",
    hours: 6,
    category: "FOUNDATIONS",
    competencies: "FUNDAMENTALS:4,WORKPLACE:2",
    expect: "AI For Everyone",
    description:
      "Andrew Ng's non-technical course on what AI can realistically do for an organisation, and how to spot a project that will not work. Free to audit.",
    descriptionAr:
      "مساق أندرو إنج غير التقني حول ما يمكن للذكاء الاصطناعي تحقيقه فعليًا في المؤسسة، وكيف تكتشف مشروعًا لن ينجح. مجاني عند الاطلاع.",
    descriptionTr:
      "Andrew Ng'in teknik olmayan kursu: yapay zekânın bir kurum için gerçekçi olarak ne yapabileceği ve yürümeyecek bir projenin nasıl anlaşılacağı. Dinleyici olarak ücretsiz.",
  },
  {
    code: "PF-GOOGLE-AI-ESSENTIALS",
    title: "Google AI Essentials",
    url: "https://www.coursera.org/specializations/ai-essentials-google",
    provider: "Google",
    platform: "Coursera",
    language: "en",
    level: "L1",
    difficulty: "BEGINNER",
    hours: 10,
    category: "ROLE_SPECIFIC",
    competencies: "WORKPLACE:5",
    expect: "Google AI Essentials",
    description:
      "Google's introduction to using generative AI in everyday work, including where to keep a human in the loop. Free to audit.",
    descriptionAr:
      "مقدمة جوجل لاستخدام الذكاء الاصطناعي التوليدي في العمل اليومي، بما في ذلك متى يجب إبقاء الإنسان في الحلقة. مجاني عند الاطلاع.",
    descriptionTr:
      "Google'ın günlük işte üretken yapay zekâ kullanımına girişi; insanın döngüde nerede kalması gerektiği dâhil. Dinleyici olarak ücretsiz.",
  },
  {
    code: "PF-GOOGLE-PROMPTING",
    title: "Google Prompting Essentials",
    url: "https://www.coursera.org/specializations/prompting-essentials-google",
    provider: "Google",
    platform: "Coursera",
    language: "en",
    level: "L2",
    difficulty: "BEGINNER",
    hours: 9,
    category: "PROMPTING",
    competencies: "PROMPTING:5",
    expect: "Prompting Essentials",
    description:
      "A structured method for writing prompts and iterating on weak output, from Google's own AI teams. Free to audit.",
    descriptionAr:
      "طريقة منظّمة لكتابة الأوامر وتحسين المخرجات الضعيفة، من فرق الذكاء الاصطناعي في جوجل. مجاني عند الاطلاع.",
    descriptionTr:
      "Google'ın yapay zekâ ekiplerinden, istem yazma ve zayıf çıktıyı iyileştirme için yapılandırılmış bir yöntem. Dinleyici olarak ücretsiz.",
  },
  {
    code: "PF-MSLEARN-AI-FUND",
    title: "Get started with AI applications and agents on Azure",
    url: "https://learn.microsoft.com/en-us/training/paths/get-started-ai-apps-agents/",
    provider: "Microsoft",
    platform: "Microsoft Learn",
    language: "en",
    level: "L2",
    difficulty: "BEGINNER",
    hours: 6,
    category: "FOUNDATIONS",
    competencies: "FUNDAMENTALS:4",
    certificate: true,
    expect: "artificial intelligence",
    description:
      "Microsoft's learning path covering the main categories of AI workload — language, vision, generative — and the responsible-use principles attached to each.",
    descriptionAr:
      "مسار تعلّم مايكروسوفت الذي يغطي الفئات الرئيسية لأحمال الذكاء الاصطناعي — اللغة والرؤية والتوليد — ومبادئ الاستخدام المسؤول لكل منها.",
    descriptionTr:
      "Microsoft'un öğrenme yolu: yapay zekâ iş yüklerinin ana kategorileri — dil, görüntü, üretken — ve her birine bağlı sorumlu kullanım ilkeleri.",
  },
  {
    code: "PF-FCC-ML-PYTHON",
    title: "Machine Learning with Python",
    url: "https://www.freecodecamp.org/learn/machine-learning-with-python/",
    provider: "freeCodeCamp",
    platform: "freeCodeCamp",
    language: "en",
    level: "L4",
    difficulty: "ADVANCED",
    hours: 300,
    category: "TECHNICAL",
    competencies: "TECHNICAL:5",
    technical: true,
    certificate: true,
    expect: "Machine Learning with Python",
    description:
      "freeCodeCamp's project-based certification: five machine-learning projects that have to pass automated tests before the certificate is issued.",
    descriptionAr:
      "شهادة freeCodeCamp القائمة على المشاريع: خمسة مشاريع في تعلّم الآلة يجب أن تجتاز اختبارات آلية قبل إصدار الشهادة.",
    descriptionTr:
      "freeCodeCamp'in proje temelli sertifikası: sertifika verilmeden önce otomatik testleri geçmesi gereken beş makine öğrenmesi projesi.",
  },
  {
    code: "PF-FCC-DATA-PYTHON",
    title: "Data Analysis with Python",
    url: "https://www.freecodecamp.org/learn/data-analysis-with-python/",
    provider: "freeCodeCamp",
    platform: "freeCodeCamp",
    language: "en",
    level: "L3",
    difficulty: "INTERMEDIATE",
    hours: 300,
    category: "DATA",
    competencies: "DATA_AUTOMATION:5,TECHNICAL:2",
    technical: true,
    certificate: true,
    expect: "Data Analysis with Python",
    description:
      "Reading, cleaning and analysing real datasets with pandas and NumPy, ending in five projects that are graded automatically.",
    descriptionAr:
      "قراءة مجموعات بيانات حقيقية وتنظيفها وتحليلها باستخدام pandas وNumPy، وتنتهي بخمسة مشاريع تُصحَّح آليًا.",
    descriptionTr:
      "pandas ve NumPy ile gerçek veri kümelerini okumak, temizlemek ve analiz etmek; otomatik değerlendirilen beş projeyle biter.",
  },
  {
    code: "PF-KAGGLE-INTRO-ML",
    title: "Intro to Machine Learning",
    url: "https://www.kaggle.com/learn/intro-to-machine-learning",
    provider: "Kaggle",
    platform: "Kaggle Learn",
    language: "en",
    level: "L4",
    difficulty: "INTERMEDIATE",
    hours: 3,
    category: "TECHNICAL",
    competencies: "TECHNICAL:4",
    technical: true,
    certificate: true,
    expect: "Machine Learning",
    description:
      "A short hands-on course that builds and validates a first model in the browser, with no local setup at all.",
    descriptionAr:
      "مساق عملي قصير يبني نموذجًا أوليًا ويتحقق منه داخل المتصفح، دون أي إعداد على جهازك.",
    descriptionTr:
      "Tarayıcıda ilk modeli kuran ve doğrulayan kısa, uygulamalı bir kurs; yerel kurulum gerektirmez.",
  },
  {
    code: "PF-KAGGLE-AI-ETHICS",
    title: "Intro to AI Ethics",
    url: "https://www.kaggle.com/learn/intro-to-ai-ethics",
    provider: "Kaggle",
    platform: "Kaggle Learn",
    language: "en",
    level: "L2",
    difficulty: "BEGINNER",
    hours: 4,
    category: "RESPONSIBLE_AI",
    competencies: "RESPONSIBLE_AI:5",
    certificate: true,
    expect: "AI Ethics",
    description:
      "Practical exercises on bias, fairness and explainability — the questions to ask about a model before anyone relies on its output.",
    descriptionAr:
      "تمارين عملية حول التحيّز والإنصاف وقابلية التفسير — الأسئلة التي يجب طرحها عن النموذج قبل أن يعتمد أحد على مخرجاته.",
    descriptionTr:
      "Önyargı, adillik ve açıklanabilirlik üzerine uygulamalı alıştırmalar — biri çıktısına güvenmeden önce modele sorulması gereken sorular.",
  },
  {
    code: "PF-KAGGLE-PANDAS",
    title: "Pandas",
    url: "https://www.kaggle.com/learn/pandas",
    provider: "Kaggle",
    platform: "Kaggle Learn",
    language: "en",
    level: "L3",
    difficulty: "INTERMEDIATE",
    hours: 4,
    category: "DATA",
    competencies: "DATA_AUTOMATION:4,TECHNICAL:2",
    technical: true,
    certificate: true,
    expect: "Pandas",
    description:
      "The data-wrangling library most analysis work runs on: selecting, grouping, joining and reshaping tables.",
    descriptionAr:
      "مكتبة معالجة البيانات التي يقوم عليها معظم عمل التحليل: الاختيار والتجميع والدمج وإعادة تشكيل الجداول.",
    descriptionTr:
      "Analiz işlerinin çoğunun dayandığı veri düzenleme kütüphanesi: tabloları seçme, gruplama, birleştirme ve yeniden şekillendirme.",
  },
  {
    code: "PF-HF-LLM-COURSE",
    title: "Hugging Face LLM Course",
    url: "https://huggingface.co/learn/llm-course",
    provider: "Hugging Face",
    platform: "Hugging Face",
    language: "en",
    level: "L4",
    difficulty: "ADVANCED",
    hours: 30,
    category: "TECHNICAL",
    competencies: "TECHNICAL:5",
    technical: true,
    expect: "course",
    description:
      "How transformer models are built, fine-tuned and served, written by the team behind the library most of them ship with.",
    descriptionAr:
      "كيف تُبنى نماذج المحوّلات وتُضبط وتُنشر، بقلم الفريق الذي يقف خلف المكتبة التي يُشحن بها معظمها.",
    descriptionTr:
      "Transformer modellerinin nasıl kurulduğu, ince ayarlandığı ve sunulduğu; çoğunun birlikte geldiği kütüphanenin arkasındaki ekip tarafından yazıldı.",
  },
  {
    code: "PF-CS50-AI",
    title: "CS50's Introduction to AI with Python",
    url: "https://cs50.harvard.edu/ai/",
    provider: "Harvard University",
    platform: "CS50",
    language: "en",
    level: "L4",
    difficulty: "ADVANCED",
    hours: 60,
    category: "TECHNICAL",
    competencies: "TECHNICAL:5,FUNDAMENTALS:2",
    technical: true,
    expect: "CS50",
    description:
      "Harvard's AI course: search, knowledge representation, optimisation, learning and neural networks, with substantial Python problem sets.",
    descriptionAr:
      "مساق هارفارد في الذكاء الاصطناعي: البحث وتمثيل المعرفة والتحسين والتعلّم والشبكات العصبية، مع مجموعات مسائل جوهرية ببايثون.",
    descriptionTr:
      "Harvard'ın yapay zekâ kursu: arama, bilgi temsili, optimizasyon, öğrenme ve sinir ağları; kapsamlı Python problem setleriyle.",
  },
  {
    code: "PF-CS50X",
    title: "CS50's Introduction to Computer Science",
    url: "https://cs50.harvard.edu/x/",
    provider: "Harvard University",
    platform: "CS50",
    language: "en",
    level: "L3",
    difficulty: "INTERMEDIATE",
    hours: 100,
    category: "TECHNICAL",
    competencies: "TECHNICAL:4",
    technical: true,
    expect: "CS50",
    description:
      "The computing foundation the technical track assumes: how a program actually runs, and how to think about a problem before writing code.",
    descriptionAr:
      "الأساس الحاسوبي الذي يفترضه المسار التقني: كيف يعمل البرنامج فعليًا، وكيف تفكّر في المشكلة قبل كتابة الكود.",
    descriptionTr:
      "Teknik patikanın varsaydığı bilişim temeli: bir programın gerçekte nasıl çalıştığı ve kod yazmadan önce problemi nasıl düşünmek gerektiği.",
  },
  {
    code: "PF-DLAI-SHORT",
    title: "DeepLearning.AI Short Courses",
    url: "https://www.deeplearning.ai/courses/",
    provider: "DeepLearning.AI",
    platform: "DeepLearning.AI",
    language: "en",
    level: "L3",
    difficulty: "INTERMEDIATE",
    hours: 2,
    category: "GENERATIVE_AI",
    competencies: "PROMPTING:3,TECHNICAL:2",
    expect: "Courses",
    description:
      "A library of free one-to-two hour courses built with the teams behind the major AI tools, each focused on one technique.",
    descriptionAr:
      "مكتبة من المساقات المجانية بطول ساعة إلى ساعتين، أُنتجت مع الفرق التي تقف خلف أدوات الذكاء الاصطناعي الكبرى، ويركّز كل منها على تقنية واحدة.",
    descriptionTr:
      "Büyük yapay zekâ araçlarının arkasındaki ekiplerle hazırlanmış, her biri tek bir tekniğe odaklanan bir–iki saatlik ücretsiz kurslardan oluşan bir kitaplık.",
  },
  {
    code: "PF-GCSB-GENAI",
    title: "Introduction to Generative AI Learning Path",
    url: "https://www.cloudskillsboost.google/paths/118",
    provider: "Google Cloud",
    platform: "Google Cloud Skills Boost",
    language: "en",
    level: "L2",
    difficulty: "BEGINNER",
    hours: 8,
    category: "GENERATIVE_AI",
    competencies: "FUNDAMENTALS:3,WORKPLACE:2",
    certificate: true,
    expect: "Generative AI",
    description:
      "Google Cloud's free introductory path on generative AI, large language models and responsible AI, with a badge on completion.",
    descriptionAr:
      "المسار التمهيدي المجاني من جوجل كلاود حول الذكاء الاصطناعي التوليدي والنماذج اللغوية الكبيرة والذكاء الاصطناعي المسؤول، مع شارة عند الإتمام.",
    descriptionTr:
      "Google Cloud'un üretken yapay zekâ, büyük dil modelleri ve sorumlu yapay zekâ üzerine ücretsiz giriş patikası; tamamlayınca rozet verilir.",
  },
  {
    code: "PF-OPENAI-ACADEMY",
    title: "OpenAI Academy",
    url: "https://academy.openai.com/",
    provider: "OpenAI",
    platform: "OpenAI Academy",
    language: "en",
    level: "L2",
    difficulty: "BEGINNER",
    hours: 4,
    category: "GENERATIVE_AI",
    competencies: "WORKPLACE:4,PROMPTING:2",
    expect: "OpenAI",
    description:
      "OpenAI's own free training on using its tools at work, including the guardrails it recommends for business use.",
    descriptionAr:
      "التدريب المجاني من OpenAI على استخدام أدواتها في العمل، بما في ذلك الضوابط التي توصي بها للاستخدام المؤسسي.",
    descriptionTr:
      "OpenAI'nin kendi araçlarını işte kullanmaya dair ücretsiz eğitimi; kurumsal kullanım için önerdiği korumalar dâhil.",
  },
  // --- Turkish -------------------------------------------------------------
  {
    code: "PF-BTK-YZ-GIRIS",
    title: "Yapay Zekaya Giriş",
    url: "https://www.btkakademi.gov.tr/portal/course/yapay-zekaya-giris-29193",
    provider: "BTK Akademi",
    platform: "BTK Akademi",
    language: "tr",
    level: "L1",
    difficulty: "BEGINNER",
    hours: 6,
    category: "FOUNDATIONS",
    competencies: "FUNDAMENTALS:5",
    certificate: true,
    expect: "Yapay Zeka",
    description:
      "A Turkish-language introduction to artificial intelligence from Turkey's national IT academy. Free, with an e-Devlet verified certificate.",
    descriptionAr:
      "مقدمة باللغة التركية في الذكاء الاصطناعي من الأكاديمية الوطنية التركية لتقنية المعلومات. مجانية، مع شهادة موثّقة عبر e-Devlet.",
    descriptionTr:
      "Türkiye'nin ulusal bilişim akademisinden Türkçe yapay zekâ girişi. Ücretsiz ve e-Devlet onaylı sertifikalı.",
  },
  {
    code: "PF-BTK-URETKEN-YZ",
    title: "Üretken Yapay Zekâya Giriş",
    url: "https://www.btkakademi.gov.tr/portal/course/uretken-yapay-zekaya-giris-45762",
    provider: "BTK Akademi",
    platform: "BTK Akademi",
    language: "tr",
    level: "L2",
    difficulty: "BEGINNER",
    hours: 5,
    category: "GENERATIVE_AI",
    competencies: "FUNDAMENTALS:2,WORKPLACE:3",
    certificate: true,
    expect: "Yapay Zek",
    description:
      "Generative AI explained in Turkish: what the tools do, how to prompt them, and where their output must be checked. Free and certified.",
    descriptionAr:
      "شرح الذكاء الاصطناعي التوليدي بالتركية: ما تفعله الأدوات، وكيف توجّهها، وأين يجب التحقق من مخرجاتها. مجاني وبشهادة.",
    descriptionTr:
      "Türkçe üretken yapay zekâ anlatımı: araçların ne yaptığı, nasıl yönlendirildiği ve çıktısının nerede denetlenmesi gerektiği. Ücretsiz ve sertifikalı.",
  },
  {
    code: "PF-BTK-YZ-ALGO",
    title: "Yapay Zeka ve Algoritmalarına Giriş",
    url: "https://www.btkakademi.gov.tr/portal/course/yapay-zeka-ve-algoritmalarina-giris-17500",
    provider: "BTK Akademi",
    platform: "BTK Akademi",
    language: "tr",
    level: "L3",
    difficulty: "INTERMEDIATE",
    hours: 10,
    category: "TECHNICAL",
    competencies: "TECHNICAL:4,FUNDAMENTALS:2",
    technical: true,
    certificate: true,
    expect: "Algoritma",
    description:
      "The algorithms behind AI, taught in Turkish for learners who want the mechanism rather than the interface. Free and certified.",
    descriptionAr:
      "الخوارزميات التي يقوم عليها الذكاء الاصطناعي، بالتركية، لمن يريد فهم الآلية لا الواجهة. مجاني وبشهادة.",
    descriptionTr:
      "Arayüzü değil mekanizmayı öğrenmek isteyenler için Türkçe anlatılan yapay zekâ algoritmaları. Ücretsiz ve sertifikalı.",
  },
  {
    code: "PF-BTK-SIBER-GIRIS",
    title: "Siber Güvenliğe Giriş",
    url: "https://www.btkakademi.gov.tr/portal/course/siber-guvenlige-giris-27928",
    provider: "BTK Akademi",
    platform: "BTK Akademi",
    language: "tr",
    level: "L2",
    difficulty: "BEGINNER",
    hours: 8,
    category: "RESPONSIBLE_AI",
    competencies: "RESPONSIBLE_AI:4",
    certificate: true,
    expect: "Siber",
    description:
      "Turkish-language security fundamentals — the habits that decide whether company data ends up in a public AI tool. Free and certified.",
    descriptionAr:
      "أساسيات الأمن السيبراني بالتركية — العادات التي تحدّد ما إذا كانت بيانات الشركة ستنتهي في أداة ذكاء اصطناعي عامة. مجاني وبشهادة.",
    descriptionTr:
      "Türkçe siber güvenlik temelleri — şirket verisinin herkese açık bir yapay zekâ aracında bitip bitmeyeceğini belirleyen alışkanlıklar. Ücretsiz ve sertifikalı.",
  },
  {
    code: "PF-BTK-BILGI-TEK",
    title: "Bilgi Teknolojileri",
    url: "https://www.btkakademi.gov.tr/portal/course/bilgi-teknolojileri-61923",
    provider: "BTK Akademi",
    platform: "BTK Akademi",
    language: "tr",
    level: "L1",
    difficulty: "BEGINNER",
    hours: 12,
    category: "FOUNDATIONS",
    competencies: "FUNDAMENTALS:3",
    certificate: true,
    expect: "Bilgi Teknolojileri",
    description:
      "Hardware, operating systems, databases and security basics in Turkish — the grounding an office role needs before anything AI-specific.",
    descriptionAr:
      "العتاد وأنظمة التشغيل وقواعد البيانات وأساسيات الأمن بالتركية — الأساس الذي يحتاجه الموظف المكتبي قبل أي شيء خاص بالذكاء الاصطناعي.",
    descriptionTr:
      "Türkçe donanım, işletim sistemleri, veritabanları ve güvenlik temelleri — bir ofis rolünün yapay zekâya özgü her şeyden önce ihtiyaç duyduğu zemin.",
  },

  // --- edX ------------------------------------------------------------------
  {
    code: "PF-EDX-CS50-AI",
    title: "CS50's Introduction to Artificial Intelligence with Python",
    url: "https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python",
    provider: "HarvardX",
    platform: "edX",
    language: "en",
    level: "L4",
    difficulty: "ADVANCED",
    hours: 60,
    category: "TECHNICAL",
    competencies: "TECHNICAL:5,FUNDAMENTALS:2",
    technical: true,
    expect: "Artificial Intelligence",
    description:
      "Harvard's AI course on edX — search, knowledge, optimisation and neural networks. Free to audit; the certificate is paid.",
    descriptionAr:
      "مساق هارفارد في الذكاء الاصطناعي على edX — البحث وتمثيل المعرفة والتحسين والشبكات العصبية. مجاني عند الاطلاع، والشهادة مدفوعة.",
    descriptionTr:
      "Harvard'ın edX üzerindeki yapay zekâ kursu — arama, bilgi, optimizasyon ve sinir ağları. Dinleyici olarak ücretsiz; sertifika ücretlidir.",
  },
  {
    code: "PF-EDX-DS-PYTHON",
    title: "Introduction to Data Science with Python",
    url: "https://www.edx.org/learn/data-science/harvard-university-introduction-to-data-science-with-python",
    provider: "HarvardX",
    platform: "edX",
    language: "en",
    level: "L3",
    difficulty: "INTERMEDIATE",
    hours: 45,
    category: "DATA",
    competencies: "DATA_AUTOMATION:5,TECHNICAL:3",
    technical: true,
    expect: "Data Science",
    description:
      "Harvard's data-science foundations on edX: regression, model selection and the reasoning behind them. Free to audit.",
    descriptionAr:
      "أساسيات علم البيانات من هارفارد على edX: الانحدار واختيار النماذج والمنطق الكامن وراءها. مجاني عند الاطلاع.",
    descriptionTr:
      "Harvard'ın edX üzerindeki veri bilimi temelleri: regresyon, model seçimi ve ardındaki akıl yürütme. Dinleyici olarak ücretsiz.",
  },
  {
    code: "PF-EDX-UCSD-PYTHON",
    title: "Python for Data Science",
    url: "https://www.edx.org/learn/python/the-university-of-california-san-diego-python-for-data-science",
    provider: "UCSanDiegoX",
    platform: "edX",
    language: "en",
    level: "L3",
    difficulty: "INTERMEDIATE",
    hours: 40,
    category: "DATA",
    competencies: "DATA_AUTOMATION:4,TECHNICAL:4",
    technical: true,
    expect: "Python",
    description:
      "UC San Diego's course on the Python data stack — pandas, Git and Matplotlib — applied to real datasets. Free to audit.",
    descriptionAr:
      "مساق جامعة كاليفورنيا سان دييغو حول أدوات بايثون للبيانات — pandas وGit وMatplotlib — مطبَّقة على بيانات حقيقية. مجاني عند الاطلاع.",
    descriptionTr:
      "UC San Diego'nun Python veri araçları kursu — pandas, Git ve Matplotlib — gerçek veri kümeleri üzerinde. Dinleyici olarak ücretsiz.",
  },
  {
    code: "PF-EDX-IBM-PYTHON",
    title: "Python Basics for Data Science",
    url: "https://www.edx.org/learn/python/ibm-python-basics-for-data-science",
    provider: "IBM",
    platform: "edX",
    language: "en",
    level: "L3",
    difficulty: "BEGINNER",
    hours: 20,
    category: "DATA",
    competencies: "DATA_AUTOMATION:3,TECHNICAL:3",
    technical: true,
    expect: "Python",
    description:
      "IBM's entry point to Python for data work, assuming no programming background. Free to audit.",
    descriptionAr:
      "نقطة البداية من IBM لتعلّم بايثون لأعمال البيانات، دون افتراض خلفية برمجية. مجاني عند الاطلاع.",
    descriptionTr:
      "IBM'in veri işleri için Python girişi; programlama geçmişi varsaymaz. Dinleyici olarak ücretsiz.",
  },
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const path = (url: string) => new URL(url).pathname.replace(/\/+$/, "").toLowerCase();

/**
 * Returns a reason to drop the row, or null to keep it.
 *
 * The decisive check is that the request ends on the path it started on. A
 * course that has been retired redirects to a catalogue index, which would
 * otherwise answer 200 and leave a link in the catalogue that does not go where
 * it claims. The `expect` string is a second opinion: several of these
 * platforms render the course page in the browser, so its absence from the
 * served HTML is reported and not treated as a failure.
 */
async function check(entry: Entry): Promise<string | null> {
  try {
    const res = await fetch(entry.url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": entry.language,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) return `HTTP ${res.status}`;
    // A redirect deeper into the same course is normal — several platforms send
    // /course straight to /course/chapter1. Only a redirect that leaves the
    // course's own path means the course has moved or gone.
    if (!path(res.url).startsWith(path(entry.url))) return `redirected to ${res.url}`;

    const body = await res.text();
    if (!body.toLowerCase().includes(entry.expect.toLowerCase())) {
      console.log(`          (no "${entry.expect}" in the served HTML — rendered client-side)`);
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const DRY = process.argv.includes("--dry");
const rows: Record<string, string>[] = [];

for (const entry of COURSES) {
  const problem = await check(entry);
  if (problem) {
    console.log(`  DROPPED ${entry.code}: ${problem}`);
    continue;
  }
  console.log(`  ok      ${entry.code}`);
  rows.push({
    Code: entry.code,
    Title: entry.title,
    URL: entry.url,
    Provider: entry.provider,
    Platform: entry.platform,
    Description: entry.description,
    "Description AR": entry.descriptionAr,
    "Description TR": entry.descriptionTr,
    Language: entry.language,
    Level: entry.level,
    Difficulty: entry.difficulty,
    Hours: String(entry.hours),
    Free: "yes",
    Price: "0",
    Certificate: entry.certificate ? "yes" : "no",
    Category: entry.category,
    Competencies: entry.competencies ?? "",
    Technical: entry.technical ? "yes" : "no",
  });
}

console.log(`\n${rows.length} of ${COURSES.length} verified`);
if (DRY || rows.length === 0) process.exit(0);

const preview = await validateCourseRows([...COURSE_IMPORT_COLUMNS], rows);
for (const bad of preview.rows.filter((r) => r.status === "INVALID")) {
  console.log(`  invalid line ${bad.line}: ${bad.issues.join("; ")}`);
}
const result = await commitCourseImport(preview, { trustLinks: true });
console.log(`imported: ${result.created} created, ${result.updated} updated`);
