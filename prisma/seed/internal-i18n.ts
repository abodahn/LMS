import type { CourseSeed } from "./courses";

/**
 * Arabic and Turkish for the internal T&C curriculum.
 *
 * Kept apart from the course definitions so the English content stays
 * readable and a translator can work in one file. Coverage is asserted by
 * scripts/check-i18n.mts; anything missing falls back to English rather than
 * showing an empty heading.
 *
 * Scope: course names, descriptions, outcomes, and every module and lesson
 * title — everything a learner navigates by. The lesson bodies themselves live
 * in lessons-i18n.ts.
 */

type CourseText = {
  titleAr: string;
  titleTr: string;
  descriptionAr: string;
  descriptionTr: string;
  outcomesAr: string[];
  outcomesTr: string[];
};

/** Course-level text, by course code. */
export const COURSE_I18N: Record<string, CourseText> = {
  "INT-ROLE-FIN": {
    titleAr: "الذكاء الاصطناعي للمالية",
    titleTr: "Finans için Yapay Zekâ",
    descriptionAr:
      "استخدام الذكاء الاصطناعي في تعليقات إقفال الشهر، وتحليل الانحرافات، وسرديات الموازنة، وافتراضات التنبؤ، والتقارير الإدارية — دون أن يقترب من العمليات الحسابية.",
    descriptionTr:
      "Yapay zekâyı ay sonu yorumları, sapma analizi, bütçe anlatıları, tahmin varsayımları ve yönetim raporlamasında kullanmak — aritmetiğe hiç yaklaştırmadan.",
    outcomesAr: [
      "تحويل جدول انحرافات إلى تعليق إداري يقرأه المدير فعلًا",
      "استخدام الذكاء الاصطناعي لبناء سردية موازنة أو تنبؤ",
      "تلخيص المستندات والعقود المالية الطويلة بأمان",
      "بناء أوامر قابلة لإعادة الاستخدام لصيغ Excel والتحليل",
      "معرفة البيانات المالية التي يجب ألّا تغادر T&C إطلاقًا",
    ],
    outcomesTr: [
      "Bir sapma tablosunu yöneticinin gerçekten okuyacağı yorum hâline getirmek",
      "Bütçe veya tahmin anlatısını yapay zekâ ile kurgulamak",
      "Uzun finansal belgeleri ve sözleşmeleri güvenle özetlemek",
      "Excel formülü ve analiz için yeniden kullanılabilir promptlar hazırlamak",
      "Hangi finans verisinin T&C'den asla çıkmaması gerektiğini bilmek",
    ],
  },
  "INT-ROLE-HR": {
    titleAr: "الذكاء الاصطناعي للموارد البشرية",
    titleTr: "İnsan Kaynakları için Yapay Zekâ",
    descriptionAr:
      "الذكاء الاصطناعي في التوظيف والوصف الوظيفي والتهيئة والسياسات وتحليلات الموارد البشرية والتواصل مع الموظفين — مع قاعدة واحدة تسبق كل شيء: القرارات المتعلقة بالأشخاص يتخذها بشر.",
    descriptionTr:
      "İşe alım, görev tanımları, oryantasyon, politikalar, İK analitiği ve çalışan iletişiminde yapay zekâ — her şeyin önünde gelen tek kuralla: insanlarla ilgili kararları insanlar verir.",
    outcomesAr: [
      "استخدام الذكاء الاصطناعي في فرز السير الذاتية دون ترك القرار له",
      "كتابة وصف وظيفي وإعلان توظيف أوضح وأسرع",
      "تحويل السياسات إلى لغة يفهمها الجميع",
      "استخراج المواضيع من نتائج استبيانات الموظفين",
      "حماية البيانات الشخصية في كل خطوة",
    ],
    outcomesTr: [
      "CV ön elemesinde yapay zekâdan yararlanmak, kararı ona bırakmadan",
      "Daha net görev tanımı ve ilan metnini daha hızlı yazmak",
      "Politikaları herkesin anlayacağı dile çevirmek",
      "Çalışan anketi sonuçlarından temaları çıkarmak",
      "Her adımda kişisel veriyi korumak",
    ],
  },
  "INT-ROLE-PRD": {
    titleAr: "الذكاء الاصطناعي للإنتاج",
    titleTr: "Üretim için Yapay Zekâ",
    descriptionAr:
      "تحويل ملاحظات الورديات وتوقفات الماكينات وأرقام الكفاءة إلى معلومات يمكن التصرّف بناءً عليها: ملخصات التوقف، وتحليل الأسباب الجذرية، وإجراءات التشغيل، والتقرير اليومي.",
    descriptionTr:
      "Vardiya notlarını, duruşları ve verimlilik rakamlarını harekete geçirilebilir bilgiye dönüştürmek: duruş özetleri, kök neden analizi, SOP'lar ve günlük rapor.",
    outcomesAr: [
      "تحويل ملاحظات الوردية إلى ملخص توقفات واضح",
      "تحديد الاختناقات وأسباب انخفاض الكفاءة",
      "إجراء تحليل أسباب جذرية منظّم",
      "كتابة إجراء تشغيل قياسي يُتّبع فعلًا",
      "إعداد التقرير اليومي في وقت أقل",
    ],
    outcomesTr: [
      "Vardiya notlarını net bir duruş özetine çevirmek",
      "Darboğazları ve verim düşüşünün nedenlerini bulmak",
      "Yapılandırılmış kök neden analizi yürütmek",
      "Gerçekten uygulanan bir SOP yazmak",
      "Günlük raporu daha kısa sürede hazırlamak",
    ],
  },
  "INT-ROLE-QLT": {
    titleAr: "الذكاء الاصطناعي للجودة",
    titleTr: "Kalite için Yapay Zekâ",
    descriptionAr:
      "تصنيف العيوب، وتحليل باريتو الذي يغيّر قرارًا، وصياغة إجراءات CAPA، وتلخيص تقارير الفحص، وتحليل اتجاهات الجودة — ونظرة واقعية إلى الرؤية الحاسوبية.",
    descriptionTr:
      "Hata sınıflandırma, karar değiştiren Pareto analizi, CAPA taslakları, muayene raporu özetleri, kalite trend analizi — ve bilgisayarlı görüye gerçekçi bir bakış.",
    outcomesAr: [
      "تصنيف أوصاف العيوب النصية الحرة إلى فئات قابلة للتحليل",
      "بناء تحليل باريتو يقود إلى إجراء فعلي",
      "صياغة إجراء تصحيحي ووقائي كامل",
      "تلخيص تقارير الفحص الطويلة بدقة",
      "قراءة اتجاهات الجودة بمرور الوقت",
    ],
    outcomesTr: [
      "Serbest metinli hata açıklamalarını analiz edilebilir kategorilere ayırmak",
      "Gerçek bir aksiyona götüren Pareto analizi kurmak",
      "Eksiksiz bir düzeltici-önleyici faaliyet taslağı yazmak",
      "Uzun muayene raporlarını doğru şekilde özetlemek",
      "Zaman içindeki kalite trendlerini okumak",
    ],
  },
  "INT-ROLE-SCM": {
    titleAr: "الذكاء الاصطناعي لسلسلة الإمداد",
    titleTr: "Tedarik Zinciri için Yapay Zekâ",
    descriptionAr:
      "مقارنة عروض الأسعار، وتحليل الموردين، وتأطير أسئلة الطلب، وإدارة المخزون البطيء، وتقييم المخاطر، والتواصل مع الموردين.",
    descriptionTr:
      "Teklif karşılaştırma, tedarikçi analizi, talep sorularını doğru kurma, yavaş hareket eden stok, risk değerlendirme ve tedarikçi iletişimi.",
    outcomesAr: [
      "مقارنة ثلاثة عروض أسعار على معايير واضحة",
      "اكتشاف ما لا يقوله عرض السعر",
      "صياغة سؤال تخطيط طلب بشكل صحيح",
      "تحليل المخزون بطيء الحركة",
      "إعداد تقييم مخاطر مورّد",
    ],
    outcomesTr: [
      "Üç teklifi net kriterlerle karşılaştırmak",
      "Bir teklifin söylemediğini fark etmek",
      "Talep planlama sorusunu doğru biçimde kurmak",
      "Yavaş hareket eden stoğu analiz etmek",
      "Tedarikçi risk değerlendirmesi hazırlamak",
    ],
  },
  "INT-ROLE-COM": {
    titleAr: "الذكاء الاصطناعي للمبيعات والتسويق",
    titleTr: "Satış ve Pazarlama için Yapay Zekâ",
    descriptionAr:
      "بحث السوق بضوابط، وتحليل المنافسين، وصياغة العروض، والتواصل مع العملاء، والعروض التقديمية، وتحليل ملاحظات العملاء.",
    descriptionTr:
      "Kurallı pazar araştırması, rakip analizi, teklif yazımı, müşteri iletişimi, sunumlar ve müşteri geri bildirimi analizi.",
    outcomesAr: [
      "إجراء بحث سوق يمكنك الدفاع عن مصادره",
      "تحليل منافس دون اختلاق معلومات",
      "صياغة مسودة عرض تجاري قوية",
      "إعداد عرض تقديمي يصل رسالته",
      "استخراج المواضيع من ملاحظات العملاء",
    ],
    outcomesTr: [
      "Kaynağını savunabileceğiniz bir pazar araştırması yapmak",
      "Bilgi uydurmadan rakip analizi yapmak",
      "Güçlü bir teklif taslağı hazırlamak",
      "Mesajı ulaşan bir sunum kurmak",
      "Müşteri geri bildiriminden temaları çıkarmak",
    ],
  },
  "INT-ROLE-MGT": {
    titleAr: "الذكاء الاصطناعي للإدارة",
    titleTr: "Yönetim için Yapay Zekâ",
    descriptionAr:
      "دعم القرار وليس اتخاذه: ملخصات تنفيذية من مستندات طويلة، وتحليل السيناريوهات والخيارات، وذكاء الاجتماعات، وتفويض عمل الذكاء الاصطناعي، والحوكمة والمخاطر.",
    descriptionTr:
      "Karar vermek değil karar desteği: uzun belgelerden yönetici özetleri, senaryo ve seçenek analizi, toplantı zekâsı, yapay zekâ işini devretmek, yönetişim ve risk.",
    outcomesAr: [
      "تحويل مستند طويل إلى ملخص تنفيذي من صفحة واحدة",
      "بناء تحليل سيناريوهات وخيارات",
      "استخلاص القرارات والمهام من محاضر الاجتماعات",
      "تفويض عمل الذكاء الاصطناعي لفريقك بوضوح",
      "طرح أسئلة الحوكمة والمخاطر الصحيحة",
    ],
    outcomesTr: [
      "Uzun bir belgeyi tek sayfalık yönetici özetine indirmek",
      "Senaryo ve seçenek analizi kurmak",
      "Toplantı notlarından karar ve aksiyonları çıkarmak",
      "Yapay zekâ işini ekibinize net biçimde devretmek",
      "Doğru yönetişim ve risk sorularını sormak",
    ],
  },
  "INT-ROLE-IT": {
    titleAr: "الذكاء الاصطناعي لتقنية المعلومات",
    titleTr: "Bilgi Teknolojileri için Yapay Zekâ",
    descriptionAr:
      "الذكاء الاصطناعي في سير عمل التطوير: البرمجة وتصحيح الأخطاء والتوثيق، واستدعاء النماذج من الكود، وRAG، والوكلاء، وأمن الذكاء الاصطناعي، وتقييم ما إذا كان يعمل فعلًا.",
    descriptionTr:
      "Geliştirme akışında yapay zekâ: kodlama, hata ayıklama, dokümantasyon, koddan model çağırma, RAG, ajanlar, yapay zekâ güvenliği ve gerçekten çalışıp çalışmadığını ölçme.",
    outcomesAr: [
      "استخدام الذكاء الاصطناعي في البرمجة والتصحيح والتوثيق",
      "استدعاء نموذج لغوي من داخل الكود",
      "شرح متى يكون RAG هو الحل الصحيح",
      "التعرّف على مخاطر أمن الذكاء الاصطناعي",
      "تقييم ما إذا كان حل الذكاء الاصطناعي يعمل فعلًا",
    ],
    outcomesTr: [
      "Kodlama, hata ayıklama ve dokümantasyonda yapay zekâ kullanmak",
      "Koddan bir dil modeli çağırmak",
      "RAG'ın ne zaman doğru çözüm olduğunu açıklamak",
      "Yapay zekâ güvenlik risklerini tanımak",
      "Bir yapay zekâ çözümünün gerçekten çalışıp çalışmadığını değerlendirmek",
    ],
  },
};

/**
 * Module and lesson titles, keyed by their English text. Titles are reused
 * across role courses (every one has a capstone and an assessment), so a map
 * keyed by text translates each of them exactly once.
 */
export const TITLE_I18N: Record<string, { ar: string; tr: string }> = {
  // --- shared across the role courses ---------------------------------------
  "4. Workplace capstone": { ar: "٤. مشروع التطبيق العملي", tr: "4. İş yeri bitirme projesi" },
  "Your department capstone": { ar: "مشروع قسمك", tr: "Departman projeniz" },
  "5. Module assessment": { ar: "٥. تقييم المقرر", tr: "5. Modül değerlendirmesi" },
  "AI for Finance assessment": { ar: "تقييم: الذكاء الاصطناعي للمالية", tr: "Değerlendirme: Finans için Yapay Zekâ" },
  "AI for HR assessment": { ar: "تقييم: الذكاء الاصطناعي للموارد البشرية", tr: "Değerlendirme: İK için Yapay Zekâ" },
  "AI for Production assessment": { ar: "تقييم: الذكاء الاصطناعي للإنتاج", tr: "Değerlendirme: Üretim için Yapay Zekâ" },
  "AI for Quality assessment": { ar: "تقييم: الذكاء الاصطناعي للجودة", tr: "Değerlendirme: Kalite için Yapay Zekâ" },
  "AI for Supply Chain assessment": { ar: "تقييم: الذكاء الاصطناعي لسلسلة الإمداد", tr: "Değerlendirme: Tedarik Zinciri için Yapay Zekâ" },
  "AI for Sales & Marketing assessment": { ar: "تقييم: الذكاء الاصطناعي للمبيعات والتسويق", tr: "Değerlendirme: Satış ve Pazarlama için Yapay Zekâ" },
  "AI for Management assessment": { ar: "تقييم: الذكاء الاصطناعي للإدارة", tr: "Değerlendirme: Yönetim için Yapay Zekâ" },
  "AI for IT assessment": { ar: "تقييم: الذكاء الاصطناعي لتقنية المعلومات", tr: "Değerlendirme: BT için Yapay Zekâ" },

  // --- AI at T&C ------------------------------------------------------------
  "1. Why AI Matters at T&C": { ar: "١. لماذا يهمّ الذكاء الاصطناعي في T&C", tr: "1. T&C'de Yapay Zekâ Neden Önemli" },
  "What we are actually trying to do": { ar: "ما الذي نحاول تحقيقه فعلًا", tr: "Aslında ne yapmaya çalışıyoruz" },
  "What AI is good at — and where it fails": {
    ar: "فيمَ يبرع الذكاء الاصطناعي — وأين يفشل",
    tr: "Yapay zekâ nelerde iyi — ve nerede başarısız",
  },
  "Where the hours actually are": { ar: "أين تذهب الساعات فعلًا", tr: "Saatler gerçekte nerede",
  },
  "2. How to Use AI Safely": { ar: "٢. كيف تستخدم الذكاء الاصطناعي بأمان", tr: "2. Yapay Zekâyı Güvenle Kullanmak" },
  "The three questions before you paste": {
    ar: "الأسئلة الثلاثة قبل أن تلصق",
    tr: "Yapıştırmadan önceki üç soru",
  },
  "Approved and unapproved tools": { ar: "الأدوات المعتمدة وغير المعتمدة", tr: "Onaylı ve onaysız araçlar" },
  "Check your understanding": { ar: "تحقّق من فهمك", tr: "Anladığınızı kontrol edin" },
  "3. Prompting for Work": { ar: "٣. صياغة الأوامر للعمل", tr: "3. İş için Prompt Yazmak" },
  "The five-part prompt": { ar: "الأمر المكوّن من خمسة أجزاء", tr: "Beş parçalı prompt" },
  "Iterating instead of starting again": {
    ar: "التحسين التدريجي بدل البدء من جديد",
    tr: "Baştan başlamak yerine iyileştirmek",
  },
  "Write a prompt for your own work": { ar: "اكتب أمرًا لعملك أنت", tr: "Kendi işiniz için bir prompt yazın" },
  "4. AI by Department": { ar: "٤. الذكاء الاصطناعي حسب القسم", tr: "4. Departmana Göre Yapay Zekâ" },
  "Finance, HR and Commercial": { ar: "المالية والموارد البشرية والتجاري", tr: "Finans, İK ve Ticari" },
  "Production, Quality and Supply Chain": {
    ar: "الإنتاج والجودة وسلسلة الإمداد",
    tr: "Üretim, Kalite ve Tedarik Zinciri",
  },
  "Find two use cases for your team": {
    ar: "اعثر على حالتَي استخدام لفريقك",
    tr: "Ekibiniz için iki kullanım alanı bulun",
  },
  "5. Verifying AI Output": { ar: "٥. التحقق من مخرجات الذكاء الاصطناعي", tr: "5. Yapay Zekâ Çıktısını Doğrulamak" },
  "How to check an answer in two minutes": {
    ar: "كيف تتحقق من إجابة في دقيقتين",
    tr: "Bir cevap iki dakikada nasıl kontrol edilir",
  },
  "Who is accountable": { ar: "من المسؤول", tr: "Kim sorumlu" },
  "6. Protecting Company Data": { ar: "٦. حماية بيانات الشركة", tr: "6. Şirket Verisini Korumak" },
  "The protected list": { ar: "قائمة المحظورات", tr: "Korunan bilgi listesi" },
  "If something goes wrong": { ar: "إذا حدث خطأ", tr: "Bir şey ters giderse" },
  "7. Practical Challenge": { ar: "٧. التحدي العملي", tr: "7. Uygulamalı Görev" },
  "Your practical challenge": { ar: "تحديك العملي", tr: "Uygulamalı göreviniz" },
  "8. Final Assessment": { ar: "٨. التقييم النهائي", tr: "8. Final Değerlendirmesi" },
  "Course assessment": { ar: "تقييم المقرر", tr: "Kurs değerlendirmesi" },

  // --- Responsible AI at T&C ------------------------------------------------
  "1. Why this module is mandatory": { ar: "١. لماذا هذا المقرر إلزامي", tr: "1. Bu modül neden zorunlu" },
  "The three ways AI goes wrong at work": {
    ar: "الطرق الثلاث التي يخطئ بها الذكاء الاصطناعي في العمل",
    tr: "Yapay zekânın işte yanlış gittiği üç yol",
  },
  "Never blindly trust AI output": {
    ar: "لا تثق أبدًا بمخرجات الذكاء الاصطناعي بشكل أعمى",
    tr: "Yapay zekâ çıktısına asla körü körüne güvenmeyin",
  },
  "2. Protecting information": { ar: "٢. حماية المعلومات", tr: "2. Bilgiyi korumak" },
  "What must never be shared": { ar: "ما يجب ألّا يُشارَك أبدًا", tr: "Asla paylaşılmaması gerekenler" },
  "De-identify: a worked example": { ar: "إزالة التعريف: مثال تطبيقي", tr: "Kimliksizleştirme: uygulamalı örnek" },
  "3. Hallucinations, bias and accountability": {
    ar: "٣. الهلوسة والتحيّز والمساءلة",
    tr: "3. Halüsinasyon, önyargı ve hesap verebilirlik",
  },
  Hallucinations: { ar: "الهلوسة", tr: "Halüsinasyonlar" },
  "Bias and fairness": { ar: "التحيّز والإنصاف", tr: "Önyargı ve adalet" },
  "Human accountability and approval": { ar: "المساءلة البشرية والاعتماد", tr: "İnsan sorumluluğu ve onay" },
  "4. Assessment": { ar: "٤. التقييم", tr: "4. Değerlendirme" },
  "Responsible AI assessment": { ar: "تقييم الاستخدام المسؤول", tr: "Sorumlu yapay zekâ değerlendirmesi" },

  // --- Finance --------------------------------------------------------------
  "1. The finance division of labour": { ar: "١. تقسيم العمل في المالية", tr: "1. Finansta iş bölümü" },
  "Excel calculates, AI explains": { ar: "Excel يحسب، والذكاء الاصطناعي يشرح", tr: "Excel hesaplar, yapay zekâ açıklar" },
  "Variance analysis that gets read": { ar: "تحليل انحرافات يُقرأ فعلًا", tr: "Gerçekten okunan sapma analizi" },
  "What never leaves finance": { ar: "ما لا يغادر المالية أبدًا", tr: "Finanstan asla çıkmayanlar" },
  "2. Reporting and documents": { ar: "٢. التقارير والمستندات", tr: "2. Raporlama ve belgeler" },
  "Management reporting pack": { ar: "حزمة التقارير الإدارية", tr: "Yönetim raporu paketi" },
  "Reading contracts and proposals": { ar: "قراءة العقود والعروض", tr: "Sözleşme ve teklif okuma" },
  "3. Scenarios and forecasting": { ar: "٣. السيناريوهات والتنبؤ", tr: "3. Senaryolar ve tahminleme" },
  "Scenario narratives": { ar: "سرديات السيناريوهات", tr: "Senaryo anlatıları" },
  "Financial presentations": { ar: "العروض المالية", tr: "Finansal sunumlar" },

  // --- HR -------------------------------------------------------------------
  "1. The rule that comes first": { ar: "١. القاعدة التي تسبق كل شيء", tr: "1. Her şeyden önce gelen kural" },
  "AI structures, humans decide": { ar: "الذكاء الاصطناعي ينظّم، والبشر يقرّرون", tr: "Yapay zekâ düzenler, insan karar verir" },
  "CV work, done safely": { ar: "العمل على السير الذاتية بأمان", tr: "CV işini güvenle yapmak" },
  "2. Writing and policy": { ar: "٢. الكتابة والسياسات", tr: "2. Yazım ve politika" },
  "Job descriptions and adverts": { ar: "الأوصاف الوظيفية والإعلانات", tr: "Görev tanımları ve ilanlar" },
  "Policy in plain language": { ar: "السياسات بلغة بسيطة", tr: "Sade dille politika" },
  "3. Analytics and communication": { ar: "٣. التحليلات والتواصل", tr: "3. Analitik ve iletişim" },
  "Survey and feedback themes": { ar: "مواضيع الاستبيانات والملاحظات", tr: "Anket ve geri bildirim temaları" },
  "Employee communication": { ar: "التواصل مع الموظفين", tr: "Çalışan iletişimi" },

  // --- Production -----------------------------------------------------------
  "1. From shift notes to information": { ar: "١. من ملاحظات الوردية إلى معلومة", tr: "1. Vardiya notundan bilgiye" },
  "The downtime summary": { ar: "ملخص التوقفات", tr: "Duruş özeti" },
  "Efficiency and bottlenecks": { ar: "الكفاءة والاختناقات", tr: "Verimlilik ve darboğazlar" },
  "2. Root cause and quality trends": { ar: "٢. الأسباب الجذرية واتجاهات الجودة", tr: "2. Kök neden ve kalite trendleri" },
  "Structured root cause analysis": { ar: "تحليل الأسباب الجذرية المنظّم", tr: "Yapılandırılmış kök neden analizi" },
  "Writing an SOP that gets followed": {
    ar: "كتابة إجراء تشغيل قياسي يُتّبع فعلًا",
    tr: "Gerçekten uygulanan bir SOP yazmak",
  },
  "3. Reporting and improvement": { ar: "٣. التقارير والتحسين", tr: "3. Raporlama ve iyileştirme" },
  "The daily production report": { ar: "تقرير الإنتاج اليومي", tr: "Günlük üretim raporu" },
  "Finding what to improve": { ar: "تحديد ما يجب تحسينه", tr: "Neyin iyileştirileceğini bulmak" },

  // --- Quality --------------------------------------------------------------
  "1. Making defect data usable": { ar: "١. جعل بيانات العيوب قابلة للاستخدام", tr: "1. Hata verisini kullanılabilir kılmak" },
  "Classifying free-text defects": { ar: "تصنيف العيوب النصية الحرة", tr: "Serbest metinli hataları sınıflandırmak" },
  "Pareto that changes a decision": { ar: "تحليل باريتو الذي يغيّر قرارًا", tr: "Karar değiştiren Pareto" },
  "2. CAPA and audits": { ar: "٢. الإجراءات التصحيحية والتدقيق", tr: "2. CAPA ve denetimler" },
  "Drafting a CAPA": { ar: "صياغة إجراء تصحيحي ووقائي", tr: "CAPA taslağı hazırlamak" },
  "Inspection report summaries": { ar: "ملخصات تقارير الفحص", tr: "Muayene raporu özetleri" },
  "3. Looking ahead": { ar: "٣. النظر إلى الأمام", tr: "3. İleriye bakmak" },
  "Quality trend analysis": { ar: "تحليل اتجاهات الجودة", tr: "Kalite trend analizi" },
  "Computer vision: a realistic view": { ar: "الرؤية الحاسوبية: نظرة واقعية", tr: "Bilgisayarlı görü: gerçekçi bir bakış" },

  // --- Supply chain ---------------------------------------------------------
  "1. RFQ and supplier analysis": { ar: "١. طلبات عروض الأسعار وتحليل الموردين", tr: "1. Teklif talebi ve tedarikçi analizi" },
  "Comparing three quotations": { ar: "مقارنة ثلاثة عروض أسعار", tr: "Üç teklifi karşılaştırmak" },
  "What the quotation does not say": { ar: "ما لا يقوله عرض السعر", tr: "Teklifin söylemedikleri" },
  "2. Planning and inventory": { ar: "٢. التخطيط والمخزون", tr: "2. Planlama ve stok" },
  "Framing a demand question": { ar: "صياغة سؤال الطلب", tr: "Talep sorusunu kurmak" },
  "Inventory and slow movers": { ar: "المخزون والأصناف بطيئة الحركة", tr: "Stok ve yavaş hareket edenler" },
  "3. Risk and communication": { ar: "٣. المخاطر والتواصل", tr: "3. Risk ve iletişim" },
  "Supplier risk assessment": { ar: "تقييم مخاطر الموردين", tr: "Tedarikçi risk değerlendirmesi" },
  "Vendor communication": { ar: "التواصل مع الموردين", tr: "Tedarikçi iletişimi" },

  // --- Commercial -----------------------------------------------------------
  "1. Research you can defend": { ar: "١. بحث يمكنك الدفاع عنه", tr: "1. Savunabileceğiniz araştırma" },
  "Market research with guardrails": { ar: "بحث السوق بضوابط", tr: "Kurallı pazar araştırması" },
  "Competitor analysis": { ar: "تحليل المنافسين", tr: "Rakip analizi" },
  "2. Proposals and clients": { ar: "٢. العروض والعملاء", tr: "2. Teklifler ve müşteriler" },
  "Proposal drafting": { ar: "صياغة العروض", tr: "Teklif yazımı" },
  "Client communication": { ar: "التواصل مع العملاء", tr: "Müşteri iletişimi" },
  "3. Presenting and listening": { ar: "٣. العرض والإصغاء", tr: "3. Sunmak ve dinlemek" },
  "Presentations that land": { ar: "عروض تقديمية تصل رسالتها", tr: "Hedefine ulaşan sunumlar" },
  "Customer feedback analysis": { ar: "تحليل ملاحظات العملاء", tr: "Müşteri geri bildirimi analizi" },

  // --- Management -----------------------------------------------------------
  "1. Decision support, not decision making": {
    ar: "١. دعم القرار لا اتخاذه",
    tr: "1. Karar desteği, karar vermek değil",
  },
  "What AI is for at your level": { ar: "ما دور الذكاء الاصطناعي في موقعك", tr: "Sizin seviyenizde yapay zekâ ne işe yarar" },
  "Executive briefs from long documents": {
    ar: "ملخصات تنفيذية من مستندات طويلة",
    tr: "Uzun belgelerden yönetici özetleri",
  },
  "2. Scenarios and meetings": { ar: "٢. السيناريوهات والاجتماعات", tr: "2. Senaryolar ve toplantılar" },
  "Scenario and options analysis": { ar: "تحليل السيناريوهات والخيارات", tr: "Senaryo ve seçenek analizi" },
  "Meeting intelligence": { ar: "ذكاء الاجتماعات", tr: "Toplantı zekâsı" },
  "3. Leading AI use in your function": {
    ar: "٣. قيادة استخدام الذكاء الاصطناعي في إدارتك",
    tr: "3. Kendi biriminizde yapay zekâ kullanımına liderlik etmek",
  },
  "Delegating AI work": { ar: "تفويض عمل الذكاء الاصطناعي", tr: "Yapay zekâ işini devretmek" },
  "Governance and risk": { ar: "الحوكمة والمخاطر", tr: "Yönetişim ve risk" },

  // --- IT -------------------------------------------------------------------
  "1. AI in the development workflow": { ar: "١. الذكاء الاصطناعي في سير عمل التطوير", tr: "1. Geliştirme akışında yapay zekâ" },
  "Coding, debugging, documentation": { ar: "البرمجة والتصحيح والتوثيق", tr: "Kodlama, hata ayıklama, dokümantasyon" },
  "Scripting and internal automation": { ar: "البرمجة النصية والأتمتة الداخلية", tr: "Betik yazımı ve iç otomasyon" },
  "2. Working with LLM APIs": { ar: "٢. العمل مع واجهات النماذج اللغوية", tr: "2. LLM API'leriyle çalışmak" },
  "Calling a model from code": { ar: "استدعاء نموذج من الكود", tr: "Koddan model çağırmak" },
  "RAG: retrieval-augmented generation": { ar: "RAG: التوليد المعزّز بالاسترجاع", tr: "RAG: erişimle güçlendirilmiş üretim" },
  "3. Agents, security and evaluation": { ar: "٣. الوكلاء والأمن والتقييم", tr: "3. Ajanlar, güvenlik ve değerlendirme" },
  "Agents and automation": { ar: "الوكلاء والأتمتة", tr: "Ajanlar ve otomasyon" },
  "AI security": { ar: "أمن الذكاء الاصطناعي", tr: "Yapay zekâ güvenliği" },
  "Evaluating whether it actually works": {
    ar: "تقييم ما إذا كان يعمل فعلًا",
    tr: "Gerçekten çalışıp çalışmadığını değerlendirmek",
  },
};

/** Adds Arabic and Turkish to a course seed when a translation exists. */
export function withCourseI18n(seed: CourseSeed): CourseSeed {
  const t = COURSE_I18N[seed.code];
  if (!t) return seed;
  return {
    ...seed,
    titleAr: seed.titleAr ?? t.titleAr,
    titleTr: seed.titleTr ?? t.titleTr,
    descriptionAr: seed.descriptionAr ?? t.descriptionAr,
    descriptionTr: seed.descriptionTr ?? t.descriptionTr,
    outcomesAr: seed.outcomesAr ?? t.outcomesAr,
    outcomesTr: seed.outcomesTr ?? t.outcomesTr,
  };
}

/** Arabic and Turkish for a module or lesson title, null when untranslated. */
export function titleI18n(title: string) {
  const t = TITLE_I18N[title];
  return { titleAr: t?.ar ?? null, titleTr: t?.tr ?? null };
}
