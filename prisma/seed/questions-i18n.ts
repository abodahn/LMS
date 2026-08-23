import { FINAL_EXAM_I18N } from "./questions-i18n-final";
import { CORE_EASY_I18N } from "./questions-i18n-core";

/**
 * Arabic and Turkish for question banks other than the placement bank.
 *
 * Keyed by the exact English string, so it covers question stems and answer
 * options with one table and needs no edits to the question files themselves.
 * A translator can work in here alone. Anything absent falls back to English.
 *
 * Split across three files purely for size:
 *   - RESPONSIBLE_AI_I18N below — the mandatory module. No certificate is
 *     issued without passing it, so an English-only paper would lock Arabic
 *     and Turkish speakers out of certification entirely.
 *   - FINAL_EXAM_I18N — the certification exam pool.
 *   - CORE_EASY_I18N — the remaining core-bank questions and the technical bank.
 *
 * Run `npx tsx scripts/check-i18n.mts` for live coverage.
 */

const RESPONSIBLE_AI_I18N: Record<string, { ar: string; tr: string }> = {
  // === Responsible AI · easy =================================================
  "You want help writing a difficult performance conversation. What is safe to put into a public AI tool?": {
    ar: "تريد مساعدة في صياغة محادثة أداء صعبة. ما الآمن وضعه في أداة ذكاء اصطناعي عامة؟",
    tr: "Zor bir performans görüşmesini yazmak için yardım istiyorsunuz. Herkese açık bir yapay zekâ aracına ne koymak güvenlidir?",
  },
  "A generic description of the situation with no name, no appraisal text and no identifying details.": {
    ar: "وصف عام للموقف بدون اسم وبدون نص التقييم وبدون أي بيانات تعريفية.",
    tr: "İsim, değerlendirme metni ve kimlik bilgisi içermeyen genel bir durum tarifi.",
  },
  "The employee's full appraisal document, so the AI has proper context.": {
    ar: "مستند تقييم الموظف كاملًا، حتى يكون لدى الذكاء الاصطناعي سياق كافٍ.",
    tr: "Yapay zekânın tam bağlamı olsun diye çalışanın değerlendirme belgesinin tamamı.",
  },
  "The employee's name and salary, but nothing else.": {
    ar: "اسم الموظف وراتبه فقط، ولا شيء غير ذلك.",
    tr: "Yalnızca çalışanın adı ve maaşı, başka bir şey değil.",
  },
  "The whole HR file — public tools do not store data.": {
    ar: "ملف الموارد البشرية بالكامل — فالأدوات العامة لا تخزّن البيانات.",
    tr: "Tüm İK dosyası — herkese açık araçlar veriyi saklamaz.",
  },

  "Which of these must never be pasted into an unapproved AI tool? Select all that apply.": {
    ar: "أي مما يلي يجب ألّا يُلصق أبدًا في أداة ذكاء اصطناعي غير معتمدة؟ اختر كل ما ينطبق.",
    tr: "Bunlardan hangileri onaysız bir yapay zekâ aracına asla yapıştırılmamalıdır? Uygun olanların tümünü seçin.",
  },
  "Customer pricing and contract terms": { ar: "أسعار العملاء وشروط العقود", tr: "Müşteri fiyatları ve sözleşme şartları" },
  "Employee salaries and appraisals": { ar: "رواتب الموظفين وتقييماتهم", tr: "Çalışan maaşları ve değerlendirmeleri" },
  "System passwords or API keys": { ar: "كلمات مرور الأنظمة أو مفاتيح الواجهات البرمجية", tr: "Sistem şifreleri veya API anahtarları" },
  "A published industry article": { ar: "مقال منشور في المجال", tr: "Yayımlanmış bir sektör makalesi" },
  "Product designs and technical specifications": { ar: "تصاميم المنتجات والمواصفات الفنية", tr: "Ürün tasarımları ve teknik şartnameler" },

  "An AI assistant gives you a specific regulation number and quotes it. What must you do before citing it?": {
    ar: "أعطاك مساعد ذكاء اصطناعي رقم لائحة محدّدًا واقتبس نصها. ما الذي يجب فعله قبل الاستشهاد بها؟",
    tr: "Bir yapay zekâ asistanı size belirli bir mevzuat numarası verip alıntıladı. Bunu kaynak göstermeden önce ne yapmalısınız?",
  },
  "Find the regulation and confirm the number and wording yourself.": {
    ar: "ابحث عن اللائحة وتأكّد بنفسك من الرقم والصياغة.",
    tr: "Mevzuatı bulun ve numarayı ve ifadeyi kendiniz doğrulayın.",
  },
  "Cite it — the assistant quoted it directly.": {
    ar: "استشهد بها — فالمساعد اقتبسها مباشرة.",
    tr: "Kaynak gösterin — asistan doğrudan alıntıladı.",
  },
  "Ask the assistant to confirm it is correct.": {
    ar: "اطلب من المساعد تأكيد صحتها.",
    tr: "Asistandan doğru olduğunu teyit etmesini isteyin.",
  },
  "Cite it but add 'according to AI'.": {
    ar: "استشهد بها مع إضافة «وفقًا للذكاء الاصطناعي».",
    tr: "Kaynak gösterin ama 'yapay zekâya göre' ekleyin.",
  },

  "It is acceptable to use an AI tool to screen and rank job applicants automatically, as long as a human sees the final list.":
    {
      ar: "من المقبول استخدام أداة ذكاء اصطناعي لفرز المتقدمين للوظائف وترتيبهم تلقائيًا، طالما يطّلع شخص على القائمة النهائية.",
      tr: "Nihai listeyi bir insan gördüğü sürece, iş başvurularını otomatik eleyip sıralamak için yapay zekâ kullanmak kabul edilebilir.",
    },
  "False — AI must never rank or screen people.": {
    ar: "خطأ — يجب ألّا يقوم الذكاء الاصطناعي بترتيب الأشخاص أو فرزهم إطلاقًا.",
    tr: "Yanlış — yapay zekâ insanları asla sıralamamalı veya elememelidir.",
  },
  "True — human review at the end makes it acceptable.": {
    ar: "صح — المراجعة البشرية في النهاية تجعله مقبولًا.",
    tr: "Doğru — sondaki insan incelemesi bunu kabul edilebilir kılar.",
  },

  "You realise you pasted a customer contract into a public AI tool this morning. What should you do?": {
    ar: "أدركت أنك لصقت عقد عميل في أداة ذكاء اصطناعي عامة هذا الصباح. ماذا تفعل؟",
    tr: "Bu sabah bir müşteri sözleşmesini herkese açık bir yapay zekâ aracına yapıştırdığınızı fark ettiniz. Ne yapmalısınız?",
  },
  "Tell your manager and IT today, noting what was shared and where.": {
    ar: "أبلغ مديرك وقسم تقنية المعلومات اليوم، مع تحديد ما شُورك وأين.",
    tr: "Bugün yöneticinize ve BT'ye haber verin; neyin nerede paylaşıldığını belirtin.",
  },
  "Delete the conversation and say nothing.": { ar: "احذف المحادثة ولا تخبر أحدًا.", tr: "Sohbeti silin ve bir şey söylemeyin." },
  "Wait to see whether anything happens.": { ar: "انتظر لترى إن كان سيحدث شيء.", tr: "Bir şey olup olmayacağını bekleyip görün." },
  "Mention it at the next monthly meeting.": {
    ar: "اذكر الأمر في الاجتماع الشهري القادم.",
    tr: "Bir sonraki aylık toplantıda söyleyin.",
  },

  "Which is the correct way to get AI help with a sensitive costing question?": {
    ar: "ما الطريقة الصحيحة للحصول على مساعدة الذكاء الاصطناعي في سؤال تسعير حسّاس؟",
    tr: "Hassas bir maliyetlendirme sorusunda yapay zekâ yardımı almanın doğru yolu nedir?",
  },
  "Describe the shape of the problem with indexed figures and no customer name.": {
    ar: "صِف شكل المشكلة بأرقام مفهرسة وبدون اسم العميل.",
    tr: "Sorunu, endekslenmiş rakamlarla ve müşteri adı olmadan tarif edin.",
  },
  "Paste the costing sheet but delete the file afterwards.": {
    ar: "الصق ورقة التكاليف ثم احذف الملف بعد ذلك.",
    tr: "Maliyet tablosunu yapıştırın, sonra dosyayı silin.",
  },
  "Paste it into a tool that says it does not train on your data.": {
    ar: "الصقها في أداة تقول إنها لا تتدرّب على بياناتك.",
    tr: "Verinizle eğitilmediğini söyleyen bir araca yapıştırın.",
  },
  "Paste it from a personal device instead of a work device.": {
    ar: "الصقها من جهاز شخصي بدلًا من جهاز العمل.",
    tr: "İş cihazı yerine kişisel cihazdan yapıştırın.",
  },

  "Who is accountable when an AI-assisted report sent to a customer contains a serious error?": {
    ar: "من المسؤول عندما يحتوي تقرير أُعدّ بمساعدة الذكاء الاصطناعي وأُرسل إلى عميل على خطأ جسيم؟",
    tr: "Müşteriye gönderilen, yapay zekâ destekli bir raporda ciddi bir hata varsa kim sorumludur?",
  },
  "The person who used the output and sent it.": {
    ar: "الشخص الذي استخدم المخرجات وأرسلها.",
    tr: "Çıktıyı kullanan ve gönderen kişi.",
  },
  "The AI provider.": { ar: "مزوّد خدمة الذكاء الاصطناعي.", tr: "Yapay zekâ sağlayıcısı." },
  "The IT department that approved the tool.": {
    ar: "قسم تقنية المعلومات الذي اعتمد الأداة.",
    tr: "Aracı onaylayan BT departmanı.",
  },
  "Whoever wrote the prompt template.": { ar: "من كتب قالب الأمر.", tr: "Prompt şablonunu yazan kişi." },

  "A free browser extension promises to summarise any document with AI. Can you install it and use it on T&C documents?": {
    ar: "إضافة متصفح مجانية تَعِد بتلخيص أي مستند بالذكاء الاصطناعي. هل يمكنك تثبيتها واستخدامها على مستندات T&C؟",
    tr: "Ücretsiz bir tarayıcı eklentisi her belgeyi yapay zekâ ile özetlemeyi vaat ediyor. Bunu kurup T&C belgelerinde kullanabilir misiniz?",
  },
  "No — only IT-approved tools may be used with T&C data.": {
    ar: "لا — لا يجوز استخدام سوى الأدوات المعتمدة من تقنية المعلومات مع بيانات T&C.",
    tr: "Hayır — T&C verisiyle yalnızca BT'nin onayladığı araçlar kullanılabilir.",
  },
  "Yes, if it is free.": { ar: "نعم، إن كانت مجانية.", tr: "Evet, ücretsizse." },
  "Yes, if you only use it on documents you wrote yourself.": {
    ar: "نعم، إن استخدمتها فقط على مستندات كتبتها بنفسك.",
    tr: "Evet, yalnızca kendi yazdığınız belgelerde kullanırsanız.",
  },
  "Yes, if you uninstall it afterwards.": { ar: "نعم، إن أزلتها بعد ذلك.", tr: "Evet, sonrasında kaldırırsanız." },

  // === Responsible AI · medium ==============================================
  "An AI summary of a supplier contract states a penalty clause that you cannot find in the document. What is the correct conclusion?":
    {
      ar: "ملخّص أعدّه الذكاء الاصطناعي لعقد مورّد يذكر بند غرامة لا تجده في المستند. ما الاستنتاج الصحيح؟",
      tr: "Bir tedarikçi sözleşmesinin yapay zekâ özeti, belgede bulamadığınız bir ceza maddesinden söz ediyor. Doğru sonuç nedir?",
    },
  "The clause is probably invented — trust the document and re-check the rest of the summary.": {
    ar: "البند على الأرجح مُختلَق — ثِق بالمستند وأعد فحص بقية الملخّص.",
    tr: "Madde büyük olasılıkla uydurma — belgeye güvenin ve özetin kalanını yeniden kontrol edin.",
  },
  "The clause exists somewhere and you missed it.": {
    ar: "البند موجود في مكان ما وقد فاتك.",
    tr: "Madde bir yerlerde var ve siz gözden kaçırdınız.",
  },
  "The AI is using a newer version of the contract.": {
    ar: "الذكاء الاصطناعي يستخدم نسخة أحدث من العقد.",
    tr: "Yapay zekâ sözleşmenin daha yeni bir sürümünü kullanıyor.",
  },
  "The clause is implied by industry standard practice.": {
    ar: "البند مفهوم ضمنًا من الممارسة المعتادة في القطاع.",
    tr: "Madde sektör standardı uygulamadan zımnen doğuyor.",
  },

  "Which practices reduce the risk of AI-driven bias in HR processes? Select all that apply.": {
    ar: "أي الممارسات تقلّل خطر التحيّز الناتج عن الذكاء الاصطناعي في عمليات الموارد البشرية؟ اختر كل ما ينطبق.",
    tr: "İK süreçlerinde yapay zekâ kaynaklı önyargı riskini hangi uygulamalar azaltır? Uygun olanların tümünü seçin.",
  },
  "Use AI to build consistent evaluation criteria that a person then applies": {
    ar: "استخدام الذكاء الاصطناعي لبناء معايير تقييم متسقة يطبّقها شخص بعد ذلك",
    tr: "Bir insanın uygulayacağı tutarlı değerlendirme kriterlerini yapay zekâ ile oluşturmak",
  },
  "Never let AI rank, score or screen out candidates": {
    ar: "عدم السماح للذكاء الاصطناعي بترتيب المرشحين أو تقييمهم أو استبعادهم",
    tr: "Yapay zekânın adayları sıralamasına, puanlamasına veya elemesine asla izin vermemek",
  },
  "Check outputs for assumptions about age, gender or nationality that you never supplied": {
    ar: "فحص المخرجات بحثًا عن افتراضات حول العمر أو الجنس أو الجنسية لم تقدّمها أنت",
    tr: "Çıktılarda, sizin hiç vermediğiniz yaş, cinsiyet veya uyruk varsayımlarını aramak",
  },
  "Trust the model more if it produces a diverse-looking shortlist": {
    ar: "الثقة بالنموذج أكثر إذا أنتج قائمة قصيرة تبدو متنوعة",
    tr: "Çeşitli görünen bir kısa liste üretiyorsa modele daha çok güvenmek",
  },
  "Keep the decision, and the reasoning for it, with a named person": {
    ar: "إبقاء القرار وتبريره في عهدة شخص محدّد بالاسم",
    tr: "Kararı ve gerekçesini adı belli bir kişide tutmak",
  },

  "A production report generated with AI will be used to decide whether to invest in a new machine. What level of verification is required?":
    {
      ar: "سيُستخدم تقرير إنتاج أُعدّ بالذكاء الاصطناعي لتقرير الاستثمار في ماكينة جديدة. ما مستوى التحقق المطلوب؟",
      tr: "Yapay zekâ ile üretilen bir üretim raporu, yeni bir makineye yatırım kararında kullanılacak. Hangi düzeyde doğrulama gerekir?",
    },
  "Full — every figure traced to source, and the reasoning defensible without reference to the AI.": {
    ar: "كامل — كل رقم يُتتبَّع إلى مصدره، والتبرير قابل للدفاع عنه دون الرجوع إلى الذكاء الاصطناعي.",
    tr: "Tam — her rakam kaynağına kadar izlenmeli ve gerekçe, yapay zekâya atıf yapmadan savunulabilmeli.",
  },
  "Light — a quick read for obvious errors.": {
    ar: "خفيف — قراءة سريعة بحثًا عن الأخطاء الواضحة.",
    tr: "Hafif — bariz hatalar için hızlı bir okuma.",
  },
  "None — the underlying data came from our own systems.": {
    ar: "لا شيء — فالبيانات الأساسية جاءت من أنظمتنا.",
    tr: "Hiç — temel veri zaten kendi sistemlerimizden geldi.",
  },
  "Ask the AI to check its own work.": {
    ar: "اطلب من الذكاء الاصطناعي مراجعة عمله بنفسه.",
    tr: "Yapay zekâdan kendi işini kontrol etmesini isteyin.",
  },

  "Which statement about AI and confidential data is accurate?": {
    ar: "أي عبارة عن الذكاء الاصطناعي والبيانات السرّية دقيقة؟",
    tr: "Yapay zekâ ve gizli veri hakkındaki hangi ifade doğrudur?",
  },
  "Once data leaves for an external service, it is outside our control regardless of the stated policy.": {
    ar: "بمجرد خروج البيانات إلى خدمة خارجية تصبح خارج سيطرتنا، بصرف النظر عن السياسة المعلنة.",
    tr: "Veri bir kez dış servise çıktığında, açıklanan politika ne olursa olsun kontrolümüzün dışındadır.",
  },
  "Data is safe if the provider states it does not train on inputs.": {
    ar: "البيانات آمنة إذا صرّح المزوّد بأنه لا يتدرّب على المدخلات.",
    tr: "Sağlayıcı girdilerle eğitilmediğini belirtiyorsa veri güvendedir.",
  },
  "Data is safe if you delete the conversation afterwards.": {
    ar: "البيانات آمنة إذا حذفت المحادثة بعد ذلك.",
    tr: "Sonrasında sohbeti silerseniz veri güvendedir.",
  },
  "Data is safe if you use a paid account.": {
    ar: "البيانات آمنة إذا استخدمت حسابًا مدفوعًا.",
    tr: "Ücretli hesap kullanırsanız veri güvendedir.",
  },

  "Your team wants to publish an AI-written technical article under a colleague's name. What is the main issue to resolve first?":
    {
      ar: "يريد فريقك نشر مقال تقني كتبه الذكاء الاصطناعي باسم أحد الزملاء. ما القضية الأساسية التي يجب حسمها أولًا؟",
      tr: "Ekibiniz, yapay zekânın yazdığı teknik bir makaleyi bir meslektaşın adıyla yayımlamak istiyor. Önce çözülmesi gereken asıl sorun nedir?",
    },
  "Every factual claim must be verified, and we should be clear about how it was produced.": {
    ar: "يجب التحقق من كل ادعاء واقعي، وأن نكون واضحين بشأن كيفية إنتاج المقال.",
    tr: "Her olgusal iddia doğrulanmalı ve içeriğin nasıl üretildiği konusunda açık olunmalıdır.",
  },
  "Whether the AI tool's licence permits commercial use of the output.": {
    ar: "ما إذا كان ترخيص أداة الذكاء الاصطناعي يسمح بالاستخدام التجاري للمخرجات.",
    tr: "Yapay zekâ aracının lisansının çıktının ticari kullanımına izin verip vermediği.",
  },
  "Whether the article is long enough.": { ar: "ما إذا كان المقال طويلًا بما يكفي.", tr: "Makalenin yeterince uzun olup olmadığı." },
  "Nothing — AI-written content is treated like any other draft.": {
    ar: "لا شيء — المحتوى المكتوب بالذكاء الاصطناعي يُعامَل كأي مسودة أخرى.",
    tr: "Hiçbir şey — yapay zekânın yazdığı içerik başka bir taslak gibi ele alınır.",
  },

  "Which of these are legitimate reasons to slow down an AI rollout? Select all that apply.": {
    ar: "أي مما يلي أسباب مشروعة لإبطاء تعميم استخدام الذكاء الاصطناعي؟ اختر كل ما ينطبق.",
    tr: "Bir yapay zekâ yaygınlaştırmasını yavaşlatmak için hangileri meşru gerekçedir? Uygun olanların tümünü seçin.",
  },
  "It is unclear what data the tool sends and where": {
    ar: "من غير الواضح ما البيانات التي ترسلها الأداة وإلى أين",
    tr: "Aracın hangi veriyi nereye gönderdiği belirsiz",
  },
  "There is no defined verification step before outputs are used": {
    ar: "لا توجد خطوة تحقق محدّدة قبل استخدام المخرجات",
    tr: "Çıktılar kullanılmadan önce tanımlı bir doğrulama adımı yok",
  },
  "The output would affect decisions about individual employees": {
    ar: "ستؤثر المخرجات في قرارات تخصّ موظفين بأعينهم",
    tr: "Çıktı, tek tek çalışanlarla ilgili kararları etkileyecek",
  },
  "Some employees are unfamiliar with the tool": {
    ar: "بعض الموظفين غير معتادين على الأداة",
    tr: "Bazı çalışanlar araca aşina değil",
  },
  "No baseline exists, so improvement could not be measured": {
    ar: "لا يوجد خط أساس، لذا لا يمكن قياس التحسّن",
    tr: "Bir başlangıç ölçümü yok, bu yüzden iyileşme ölçülemez",
  },

  "A manager asks you to use AI to 'find out everything you can' about a job candidate. What is the right response?": {
    ar: "يطلب منك مدير استخدام الذكاء الاصطناعي لـ«معرفة كل ما يمكنك» عن مرشّح لوظيفة. ما الرد الصحيح؟",
    tr: "Bir yönetici, bir iş adayı hakkında 'öğrenebildiğin her şeyi bul' demek için yapay zekâ kullanmanızı istiyor. Doğru yanıt nedir?",
  },
  "Decline, and propose structured job-relevant criteria applied equally to all candidates instead.": {
    ar: "الاعتذار، واقتراح معايير منظّمة مرتبطة بالوظيفة تُطبَّق على جميع المرشحين بالتساوي.",
    tr: "Reddedin ve bunun yerine tüm adaylara eşit uygulanan, işle ilgili yapılandırılmış kriterler önerin.",
  },
  "Do it, but only use publicly available information.": {
    ar: "افعل ذلك، لكن استخدم المعلومات المتاحة للعامة فقط.",
    tr: "Yapın, ama yalnızca kamuya açık bilgileri kullanın.",
  },
  "Do it, and let the manager decide what is relevant.": {
    ar: "افعل ذلك، ودع المدير يقرّر ما هو ذو صلة.",
    tr: "Yapın ve neyin ilgili olduğuna yönetici karar versin.",
  },
  "Do it, but do not write anything down.": {
    ar: "افعل ذلك، لكن لا تدوّن شيئًا.",
    tr: "Yapın ama hiçbir şeyi yazıya dökmeyin.",
  },

  // === Responsible AI · advanced ============================================
  "An internal AI assistant retrieves documents to answer questions. A production employee asks a question and receives content from an HR salary review. What went wrong?":
    {
      ar: "مساعد ذكاء اصطناعي داخلي يسترجع مستندات للإجابة عن الأسئلة. طرح موظف إنتاج سؤالًا فتلقّى محتوى من مراجعة رواتب في الموارد البشرية. ما الخطأ الذي حدث؟",
      tr: "Dahilî bir yapay zekâ asistanı soruları yanıtlamak için belge getiriyor. Bir üretim çalışanı soru sorup İK maaş incelemesinden içerik alıyor. Ne ters gitti?",
    },
  "Access permissions were not applied before retrieval, so restricted documents entered the context.": {
    ar: "لم تُطبَّق صلاحيات الوصول قبل الاسترجاع، فدخلت مستندات مقيّدة إلى السياق.",
    tr: "Getirmeden önce erişim izinleri uygulanmadı, bu yüzden kısıtlı belgeler bağlama girdi.",
  },
  "The model hallucinated the salary information.": {
    ar: "اختلق النموذج معلومات الرواتب.",
    tr: "Model maaş bilgisini uydurdu.",
  },
  "The employee phrased the question incorrectly.": {
    ar: "صاغ الموظف السؤال بشكل غير صحيح.",
    tr: "Çalışan soruyu yanlış ifade etti.",
  },
  "The model was trained on HR data.": {
    ar: "دُرِّب النموذج على بيانات الموارد البشرية.",
    tr: "Model İK verisiyle eğitildi.",
  },

  "An AI tool reads incoming supplier emails and can send replies automatically. What is the most serious risk?": {
    ar: "أداة ذكاء اصطناعي تقرأ رسائل الموردين الواردة ويمكنها إرسال ردود تلقائيًا. ما أخطر المخاطر؟",
    tr: "Bir yapay zekâ aracı gelen tedarikçi e-postalarını okuyor ve otomatik yanıt gönderebiliyor. En ciddi risk nedir?",
  },
  "A crafted email could contain instructions the model follows, and it can act on them without a human.": {
    ar: "قد تحتوي رسالة مُعدّة بعناية على تعليمات يتبعها النموذج، ويمكنه التصرّف بناءً عليها دون تدخّل بشري.",
    tr: "Özenle hazırlanmış bir e-posta, modelin izleyeceği talimatlar içerebilir ve model bunlara insan olmadan göre hareket edebilir.",
  },
  "The replies might have grammatical errors.": {
    ar: "قد تحتوي الردود على أخطاء نحوية.",
    tr: "Yanıtlarda dil bilgisi hataları olabilir.",
  },
  "The tool might be slow at busy times.": {
    ar: "قد تكون الأداة بطيئة في أوقات الذروة.",
    tr: "Araç yoğun zamanlarda yavaş olabilir.",
  },
  "Suppliers might notice the replies are automated.": {
    ar: "قد يلاحظ الموردون أن الردود آلية.",
    tr: "Tedarikçiler yanıtların otomatik olduğunu fark edebilir.",
  },

  "Which controls would you require before an AI system is allowed to write to a production system? Select all that apply.": {
    ar: "أي الضوابط تشترطها قبل السماح لنظام ذكاء اصطناعي بالكتابة في نظام إنتاجي؟ اختر كل ما ينطبق.",
    tr: "Bir yapay zekâ sisteminin üretim sistemine yazmasına izin vermeden önce hangi kontrolleri şart koşarsınız? Uygun olanların tümünü seçin.",
  },
  "A human confirmation step before any write": {
    ar: "خطوة تأكيد بشري قبل أي عملية كتابة",
    tr: "Her yazma işlemi öncesinde insan onayı adımı",
  },
  "Complete logging of every action taken": {
    ar: "تسجيل كامل لكل إجراء يُتَّخذ",
    tr: "Gerçekleştirilen her eylemin eksiksiz kaydı",
  },
  "Hard limits on how many actions it may take": {
    ar: "حدود صارمة لعدد الإجراءات المسموح بها",
    tr: "Kaç eylem yapabileceğine dair kesin sınırlar",
  },
  "Read-only access by default, with writes as a justified exception": {
    ar: "وصول للقراءة فقط بشكل افتراضي، والكتابة استثناء مبرَّر",
    tr: "Varsayılan olarak salt okunur erişim, yazma ise gerekçeli bir istisna",
  },
  "A faster model to reduce the chance of errors": {
    ar: "نموذج أسرع لتقليل احتمال الأخطاء",
    tr: "Hata olasılığını azaltmak için daha hızlı bir model",
  },

  "A well-liked AI workflow has been running for six months. An audit asks how you know its outputs are accurate. What is the strongest possible answer?":
    {
      ar: "سير عمل بالذكاء الاصطناعي يحظى بقبول واسع ويعمل منذ ستة أشهر. يسأل التدقيق: كيف تعرف أن مخرجاته دقيقة؟ ما أقوى إجابة ممكنة؟",
      tr: "Beğenilen bir yapay zekâ akışı altı aydır çalışıyor. Denetim, çıktılarının doğru olduğunu nereden bildiğinizi soruyor. En güçlü yanıt nedir?",
    },
  "'We maintain a test set with known-good answers, re-run it after every change, and sample live outputs against source weekly.'": {
    ar: "«نحتفظ بمجموعة اختبار بإجابات صحيحة معروفة، ونعيد تشغيلها بعد كل تغيير، ونقارن عيّنة من المخرجات الحيّة بالمصدر أسبوعيًا.»",
    tr: "'Doğruluğu bilinen cevaplardan oluşan bir test kümemiz var, her değişiklikten sonra yeniden çalıştırıyoruz ve canlı çıktıları haftalık olarak kaynakla örnekliyoruz.'",
  },
  "'Nobody has complained about it.'": { ar: "«لم يشتكِ منه أحد.»", tr: "'Kimse şikâyet etmedi.'" },
  "'It is used by 200 employees every week.'": {
    ar: "«يستخدمه 200 موظف كل أسبوع.»",
    tr: "'Her hafta 200 çalışan kullanıyor.'",
  },
  "'We use a leading commercial AI provider.'": {
    ar: "«نستخدم مزوّد ذكاء اصطناعي تجاريًا رائدًا.»",
    tr: "'Önde gelen ticari bir yapay zekâ sağlayıcısı kullanıyoruz.'",
  },

  "Which situation most clearly requires disclosing that AI was used?": {
    ar: "أي موقف يستوجب بوضوح الإفصاح عن استخدام الذكاء الاصطناعي؟",
    tr: "Hangi durum, yapay zekâ kullanıldığının açıklanmasını en net şekilde gerektirir?",
  },
  "AI produced the analysis behind a recommendation going to the board.": {
    ar: "أنتج الذكاء الاصطناعي التحليل الذي تقوم عليه توصية مرفوعة إلى مجلس الإدارة.",
    tr: "Yönetim kuruluna gidecek bir tavsiyenin arkasındaki analizi yapay zekâ üretti.",
  },
  "AI fixed the grammar in an internal email.": {
    ar: "صحّح الذكاء الاصطناعي قواعد اللغة في بريد داخلي.",
    tr: "Yapay zekâ, dahilî bir e-postanın dil bilgisini düzeltti.",
  },
  "AI suggested a subject line for a newsletter.": {
    ar: "اقترح الذكاء الاصطناعي عنوانًا لرسالة إخبارية.",
    tr: "Yapay zekâ bir bültene konu başlığı önerdi.",
  },
  "AI helped you find a synonym.": {
    ar: "ساعدك الذكاء الاصطناعي في إيجاد مرادف.",
    tr: "Yapay zekâ eş anlamlı bir kelime bulmanıza yardım etti.",
  },

  "You are asked to build a chatbot that answers employee questions from internal policy documents. Which design decision matters most for safety?":
    {
      ar: "طُلب منك بناء روبوت محادثة يجيب عن أسئلة الموظفين اعتمادًا على مستندات السياسات الداخلية. أي قرار تصميمي هو الأهم من ناحية السلامة؟",
      tr: "Çalışan sorularını iç politika belgelerinden yanıtlayan bir sohbet robotu kurmanız isteniyor. Güvenlik açısından en önemli tasarım kararı hangisidir?",
    },
  "It must answer only from retrieved policy text, cite the section, and refuse when nothing relevant is found.": {
    ar: "يجب أن يجيب فقط من نص السياسة المسترجَع، وأن يذكر البند، وأن يمتنع عن الإجابة عند عدم العثور على شيء ذي صلة.",
    tr: "Yalnızca getirilen politika metninden yanıtlamalı, ilgili bölümü belirtmeli ve ilgili bir şey bulunamadığında yanıt vermeyi reddetmelidir.",
  },
  "It should be trained on the policies so it knows them by heart.": {
    ar: "ينبغي تدريبه على السياسات ليحفظها عن ظهر قلب.",
    tr: "Politikaları ezbere bilmesi için onlarla eğitilmelidir.",
  },
  "It should always give an answer so employees are not frustrated.": {
    ar: "ينبغي أن يعطي إجابة دائمًا حتى لا يشعر الموظفون بالإحباط.",
    tr: "Çalışanlar hayal kırıklığına uğramasın diye her zaman bir cevap vermelidir.",
  },
  "It should use the largest model available.": {
    ar: "ينبغي أن يستخدم أكبر نموذج متاح.",
    tr: "Mevcut en büyük modeli kullanmalıdır.",
  },
};

export const QUESTION_I18N: Record<string, { ar: string; tr: string }> = {
  ...RESPONSIBLE_AI_I18N,
  ...FINAL_EXAM_I18N,
  ...CORE_EASY_I18N,
};

/** Arabic and Turkish for a question stem or an option, null when untranslated. */
export function questionI18n(text: string) {
  const t = QUESTION_I18N[text];
  return { textAr: t?.ar ?? null, textTr: t?.tr ?? null };
}
