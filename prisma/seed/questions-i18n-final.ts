/**
 * Arabic and Turkish for the final certification exam pool.
 *
 * Split out from questions-i18n.ts only for file size — it is merged into the
 * same lookup table and keyed the same way, by exact English string.
 *
 * This pool gates the certificate, so leaving it English-only would let an
 * Arabic or Turkish speaker complete every course and then fail at the last
 * step for a reason that has nothing to do with their AI capability.
 */

export const FINAL_EXAM_I18N: Record<string, { ar: string; tr: string }> = {
  // === Fundamentals · medium ================================================
  "Your manager asks whether AI could 'predict next season's order volumes'. What is the most honest answer?": {
    ar: "يسألك مديرك إن كان الذكاء الاصطناعي قادرًا على «التنبؤ بأحجام طلبات الموسم القادم». ما الإجابة الأصدق؟",
    tr: "Yöneticiniz yapay zekânın 'gelecek sezonun sipariş hacimlerini tahmin edip edemeyeceğini' soruyor. En dürüst yanıt nedir?",
  },
  "Forecasting from our own historical order data is realistic, but it needs that data and a proper model — a chat assistant guessing a number is not a forecast.":
    {
      ar: "التنبؤ من بيانات طلباتنا التاريخية أمر واقعي، لكنه يحتاج تلك البيانات ونموذجًا مناسبًا — أما مساعد محادثة يخمّن رقمًا فليس تنبؤًا.",
      tr: "Kendi geçmiş sipariş verimizden tahmin yapmak gerçekçidir, ama bu veriyi ve uygun bir model gerektirir — sohbet asistanının bir sayı tahmin etmesi tahminleme değildir.",
    },
  "Yes — just ask the assistant what next season's volumes will be.": {
    ar: "نعم — فقط اسأل المساعد عن أحجام الموسم القادم.",
    tr: "Evet — asistana gelecek sezonun hacimlerini sorman yeter.",
  },
  "No — AI cannot be used for any kind of prediction.": {
    ar: "لا — لا يمكن استخدام الذكاء الاصطناعي في أي نوع من التنبؤ.",
    tr: "Hayır — yapay zekâ hiçbir tahmin türü için kullanılamaz.",
  },
  "Yes, if we describe our business in enough detail in the prompt.": {
    ar: "نعم، إذا وصفنا نشاطنا بتفصيل كافٍ داخل الأمر.",
    tr: "Evet, işimizi promptta yeterince ayrıntılı tarif edersek.",
  },

  "Which statement best describes why AI answers sound so confident even when wrong?": {
    ar: "أي عبارة تصف أفضل سبب لظهور إجابات الذكاء الاصطناعي واثقة حتى عندما تكون خاطئة؟",
    tr: "Yapay zekâ cevaplarının yanlışken bile neden bu kadar emin göründüğünü en iyi hangi ifade açıklar?",
  },
  "Confidence is a style learned from training text; it carries no information about whether the answer is right.": {
    ar: "الثقة أسلوب مكتسب من نصوص التدريب؛ ولا تحمل أي معلومة عن صحة الإجابة.",
    tr: "Kendinden eminlik, eğitim metninden öğrenilmiş bir üsluptur; cevabın doğru olup olmadığı hakkında bilgi taşımaz.",
  },
  "The model calculates a certainty score and only answers when it is above 95%.": {
    ar: "يحسب النموذج درجة يقين ولا يجيب إلا إذا تجاوزت 95٪.",
    tr: "Model bir kesinlik puanı hesaplar ve yalnızca %95'in üzerindeyse yanıt verir.",
  },
  "The model is confident only when the answer is verified.": {
    ar: "لا يكون النموذج واثقًا إلا عندما تكون الإجابة مُتحقَّقًا منها.",
    tr: "Model yalnızca cevap doğrulandığında emin olur.",
  },
  "Confidence increases with the length of your prompt.": {
    ar: "تزداد الثقة كلما طال الأمر الذي تكتبه.",
    tr: "Promptunuz uzadıkça kendinden eminlik artar.",
  },

  "You want an AI assistant to answer questions about a 40-page technical specification. Which approaches can actually work? Select all that apply.":
    {
      ar: "تريد من مساعد ذكاء اصطناعي أن يجيب عن أسئلة حول مواصفة فنية من 40 صفحة. أي الأساليب يمكن أن ينجح فعلًا؟ اختر كل ما ينطبق.",
      tr: "40 sayfalık teknik bir şartname hakkındaki soruları yapay zekâ asistanının yanıtlamasını istiyorsunuz. Hangi yaklaşımlar gerçekten işe yarar? Uygun olanların tümünü seçin.",
    },
  "Paste the document into the conversation and ask questions about it": {
    ar: "لصق المستند داخل المحادثة وطرح الأسئلة عنه",
    tr: "Belgeyi sohbete yapıştırıp hakkında soru sormak",
  },
  "Upload the document to a tool that supports file attachments": {
    ar: "رفع المستند إلى أداة تدعم إرفاق الملفات",
    tr: "Belgeyi dosya eki destekleyen bir araca yüklemek",
  },
  "Ask the assistant what it knows about the specification by name": {
    ar: "سؤال المساعد عمّا يعرفه عن المواصفة بالاسم",
    tr: "Asistana şartnameyi adıyla sorup ne bildiğini öğrenmek",
  },
  "Add 'be accurate and do not make anything up' and ask from memory": {
    ar: "إضافة «كن دقيقًا ولا تختلق شيئًا» ثم السؤال اعتمادًا على الذاكرة",
    tr: "'Doğru ol ve hiçbir şey uydurma' ekleyip hafızadan sormak",
  },
  "Use an internal tool that retrieves the relevant sections and passes them to the model": {
    ar: "استخدام أداة داخلية تسترجع الأقسام ذات الصلة وتمرّرها إلى النموذج",
    tr: "İlgili bölümleri getirip modele veren dahilî bir araç kullanmak",
  },

  "What is the practical difference between machine learning and a language model assistant?": {
    ar: "ما الفرق العملي بين تعلّم الآلة ومساعد النماذج اللغوية؟",
    tr: "Makine öğrenmesi ile bir dil modeli asistanı arasındaki pratik fark nedir?",
  },
  "Machine learning is the broad field of learning patterns from data; a language assistant is one text-focused application of it.":
    {
      ar: "تعلّم الآلة هو المجال الواسع لتعلّم الأنماط من البيانات؛ والمساعد اللغوي تطبيق واحد منه يركّز على النص.",
      tr: "Makine öğrenmesi, veriden örüntü öğrenmenin geniş alanıdır; dil asistanı ise onun metne odaklı tek bir uygulamasıdır.",
    },
  "They are unrelated technologies.": { ar: "هما تقنيتان غير مرتبطتين.", tr: "Bunlar ilgisiz teknolojilerdir." },
  "Machine learning is newer than language models.": {
    ar: "تعلّم الآلة أحدث من النماذج اللغوية.",
    tr: "Makine öğrenmesi dil modellerinden daha yenidir.",
  },
  "Machine learning only works on images.": {
    ar: "تعلّم الآلة يعمل على الصور فقط.",
    tr: "Makine öğrenmesi yalnızca görüntüler üzerinde çalışır.",
  },

  "An AI tool summarises a 20-page report into one page. What is the main risk you should check for?": {
    ar: "لخّصت أداة ذكاء اصطناعي تقريرًا من 20 صفحة في صفحة واحدة. ما الخطر الرئيسي الذي يجب التحقق منه؟",
    tr: "Bir yapay zekâ aracı 20 sayfalık raporu tek sayfaya özetledi. Kontrol etmeniz gereken temel risk nedir?",
  },
  "Something important was left out without being flagged.": {
    ar: "حُذف شيء مهم دون الإشارة إليه.",
    tr: "Önemli bir şey, belirtilmeden dışarıda bırakılmış olabilir.",
  },
  "The summary will be too long to read.": {
    ar: "سيكون الملخّص أطول من أن يُقرأ.",
    tr: "Özet okunamayacak kadar uzun olur.",
  },
  "The tool will refuse to summarise documents that long.": {
    ar: "سترفض الأداة تلخيص مستندات بهذا الطول.",
    tr: "Araç bu uzunluktaki belgeleri özetlemeyi reddeder.",
  },
  "The grammar will be poor.": { ar: "ستكون قواعد اللغة ضعيفة.", tr: "Dil bilgisi zayıf olur." },

  "Which is the best description of what 'training data' means for a language model?": {
    ar: "ما أفضل وصف لمعنى «بيانات التدريب» بالنسبة لنموذج لغوي؟",
    tr: "Bir dil modeli için 'eğitim verisi' ne demektir, en iyi hangisi tarif eder?",
  },
  "A very large body of text the model learned statistical patterns from — not a database it looks things up in.": {
    ar: "كمّ هائل من النصوص تعلّم منها النموذج أنماطًا إحصائية — وليست قاعدة بيانات يبحث فيها.",
    tr: "Modelin istatistiksel örüntüler öğrendiği çok büyük bir metin yığını — içinde arama yaptığı bir veritabanı değil.",
  },
  "The documents you upload during a conversation.": {
    ar: "المستندات التي ترفعها أثناء المحادثة.",
    tr: "Sohbet sırasında yüklediğiniz belgeler.",
  },
  "A list of approved answers the model chooses between.": {
    ar: "قائمة إجابات معتمدة يختار النموذج من بينها.",
    tr: "Modelin arasından seçtiği onaylı cevaplar listesi.",
  },
  "The instructions in your prompt.": { ar: "التعليمات الموجودة في أمرك.", tr: "Promptunuzdaki talimatlar." },

  "A vendor demonstrates an AI system that 'automatically detects all fabric defects with 99% accuracy'. What is the first question you should ask?":
    {
      ar: "يعرض مورّد نظام ذكاء اصطناعي «يكتشف كل عيوب الأقمشة تلقائيًا بدقة 99٪». ما أول سؤال ينبغي أن تطرحه؟",
      tr: "Bir satıcı, 'tüm kumaş hatalarını %99 doğrulukla otomatik tespit eden' bir yapay zekâ sistemi gösteriyor. Sormanız gereken ilk soru nedir?",
    },
  "On what dataset was that measured, and how similar is it to our fabrics, lighting and defect types?": {
    ar: "على أي مجموعة بيانات قيست هذه النسبة، وما مدى تشابهها مع أقمشتنا وإضاءتنا وأنواع عيوبنا؟",
    tr: "Bu hangi veri kümesinde ölçüldü ve bizim kumaşlarımıza, aydınlatmamıza ve hata türlerimize ne kadar benziyor?",
  },
  "How much does the licence cost per year?": {
    ar: "كم تبلغ تكلفة الترخيص سنويًا؟",
    tr: "Lisans yıllık ne kadara mal oluyor?",
  },
  "Which programming language is it written in?": {
    ar: "بأي لغة برمجة كُتب؟",
    tr: "Hangi programlama diliyle yazılmış?",
  },
  "How many other companies have bought it?": {
    ar: "كم شركة أخرى اشترته؟",
    tr: "Kaç şirket daha satın almış?",
  },

  "Which of these are genuine limitations of today's general-purpose AI assistants? Select all that apply.": {
    ar: "أي مما يلي قيود حقيقية في مساعدي الذكاء الاصطناعي العامين اليوم؟ اختر كل ما ينطبق.",
    tr: "Bunlardan hangileri bugünkü genel amaçlı yapay zekâ asistanlarının gerçek sınırlarıdır? Uygun olanların tümünü seçin.",
  },
  "No access to your internal systems unless connected deliberately": {
    ar: "لا وصول إلى أنظمتك الداخلية ما لم تُربط عمدًا",
    tr: "Kasıtlı olarak bağlanmadıkça iç sistemlerinize erişim yok",
  },
  "Unreliable arithmetic over long lists of numbers": {
    ar: "حساب غير موثوق عبر قوائم طويلة من الأرقام",
    tr: "Uzun sayı listelerinde güvenilmez aritmetik",
  },
  "Limited or no knowledge of very recent events": {
    ar: "معرفة محدودة أو معدومة بالأحداث الحديثة جدًا",
    tr: "Çok yakın tarihli olaylar hakkında sınırlı ya da hiç bilgi olmaması",
  },
  "Inability to work in any language other than English": {
    ar: "عدم القدرة على العمل بأي لغة غير الإنجليزية",
    tr: "İngilizce dışında bir dilde çalışamamak",
  },
  "No way to know when it is wrong": {
    ar: "لا وسيلة لديه لمعرفة متى يكون مخطئًا",
    tr: "Yanıldığını anlamasının bir yolu olmaması",
  },

  "Your team wants to use AI to answer employee questions about internal HR policies. What has to be true for that to work?":
    {
      ar: "يريد فريقك استخدام الذكاء الاصطناعي للإجابة عن أسئلة الموظفين حول سياسات الموارد البشرية الداخلية. ما الشرط اللازم لنجاح ذلك؟",
      tr: "Ekibiniz, iç İK politikalarıyla ilgili çalışan sorularını yapay zekâ ile yanıtlamak istiyor. Bunun işe yaraması için ne doğru olmalı?",
    },
  "The system must retrieve the actual policy text and pass it to the model with each question.": {
    ar: "يجب أن يسترجع النظام نص السياسة الفعلي ويمرّره إلى النموذج مع كل سؤال.",
    tr: "Sistem, gerçek politika metnini getirip her soruyla birlikte modele vermelidir.",
  },
  "The model must be told it works for T&C.": {
    ar: "يجب إخبار النموذج بأنه يعمل لدى T&C.",
    tr: "Modele T&C için çalıştığı söylenmelidir.",
  },
  "The policies must have been published on the internet at some point.": {
    ar: "يجب أن تكون السياسات قد نُشرت على الإنترنت في وقت ما.",
    tr: "Politikalar bir zamanlar internette yayımlanmış olmalıdır.",
  },
  "Nothing — modern models can answer HR questions for any company.": {
    ar: "لا شيء — فالنماذج الحديثة تستطيع الإجابة عن أسئلة الموارد البشرية لأي شركة.",
    tr: "Hiçbir şey — modern modeller her şirketin İK sorularını yanıtlayabilir.",
  },

  // === Fundamentals · advanced ==============================================
  "Which situation is most likely to produce a hallucinated answer?": {
    ar: "أي موقف هو الأرجح أن يُنتج إجابة مُختلَقة؟",
    tr: "Hangi durum halüsinasyonlu bir cevap üretmeye en yatkındır?",
  },
  "Asking for specific figures and dates about a topic, with no source document supplied.": {
    ar: "طلب أرقام وتواريخ محدّدة عن موضوع دون تقديم مستند مصدر.",
    tr: "Kaynak belge vermeden, bir konu hakkında belirli rakam ve tarih istemek.",
  },
  "Asking it to rewrite a paragraph you pasted in a friendlier tone.": {
    ar: "طلب إعادة صياغة فقرة لصقتها بنبرة أكثر ودّية.",
    tr: "Yapıştırdığınız bir paragrafı daha samimi bir tonda yeniden yazmasını istemek.",
  },
  "Asking it to group a list of items you provided into themes.": {
    ar: "طلب تجميع قائمة عناصر قدّمتها في مواضيع.",
    tr: "Verdiğiniz bir öğe listesini temalara ayırmasını istemek.",
  },
  "Asking it to explain a general concept in simpler words.": {
    ar: "طلب شرح مفهوم عام بكلمات أبسط.",
    tr: "Genel bir kavramı daha basit kelimelerle açıklamasını istemek.",
  },

  "You are evaluating whether an AI feature is worth building. Which measurement matters most?": {
    ar: "تقيّم ما إذا كانت ميزة ذكاء اصطناعي تستحق البناء. أي قياس هو الأهم؟",
    tr: "Bir yapay zekâ özelliğinin geliştirilmeye değer olup olmadığını değerlendiriyorsunuz. Hangi ölçüm en önemlidir?",
  },
  "How long and how accurately the task is done today, measured before anything is built.": {
    ar: "كم تستغرق المهمة اليوم وبأي دقة تُنجَز، مقيسًا قبل بناء أي شيء.",
    tr: "Görevin bugün ne kadar sürede ve ne doğrulukta yapıldığı — hiçbir şey inşa edilmeden önce ölçülmüş hâli.",
  },
  "How impressive the demo looks to management.": {
    ar: "مدى إبهار العرض التجريبي للإدارة.",
    tr: "Demonun yönetime ne kadar etkileyici göründüğü.",
  },
  "How many features the vendor offers.": { ar: "عدد الميزات التي يقدّمها المورّد.", tr: "Satıcının kaç özellik sunduğu." },
  "How large the underlying model is.": { ar: "حجم النموذج الأساسي.", tr: "Altta yatan modelin ne kadar büyük olduğu." },

  "An AI pilot performs well in testing and poorly in production. Which explanations are plausible? Select all that apply.":
    {
      ar: "أداء تجربة ذكاء اصطناعي جيد في الاختبار وضعيف في التشغيل الفعلي. أي التفسيرات معقولة؟ اختر كل ما ينطبق.",
      tr: "Bir yapay zekâ pilotu testte iyi, üretimde kötü performans gösteriyor. Hangi açıklamalar makul? Uygun olanların tümünü seçin.",
    },
  "The test cases were cleaner and more consistent than real inputs": {
    ar: "كانت حالات الاختبار أنظف وأكثر اتساقًا من المدخلات الحقيقية",
    tr: "Test senaryoları gerçek girdilerden daha temiz ve tutarlıydı",
  },
  "Real users phrase requests very differently from the test authors": {
    ar: "يصوغ المستخدمون الحقيقيون طلباتهم بشكل مختلف تمامًا عن كاتبي الاختبارات",
    tr: "Gerçek kullanıcılar istekleri test yazarlarından çok farklı ifade ediyor",
  },
  "Edge cases were never represented in the test set": {
    ar: "لم تُمثَّل الحالات الحدّية في مجموعة الاختبار",
    tr: "Uç durumlar test kümesinde hiç temsil edilmemişti",
  },
  "The underlying model became less capable after deployment": {
    ar: "أصبح النموذج الأساسي أقل قدرة بعد النشر",
    tr: "Altta yatan model devreye alındıktan sonra daha az yetenekli hâle geldi",
  },
  "The process the tool sits inside was never adjusted to use it": {
    ar: "لم تُعدَّل العملية التي تعمل الأداة داخلها لاستيعابها",
    tr: "Aracın içinde yer aldığı süreç, onu kullanacak şekilde hiç uyarlanmadı",
  },

  "Which best explains why an AI assistant can give an excellent answer about garment manufacturing generally, but a wrong answer about T&C specifically?":
    {
      ar: "ما أفضل تفسير لكون مساعد الذكاء الاصطناعي يعطي إجابة ممتازة عن صناعة الملابس عمومًا، وإجابة خاطئة عن T&C تحديدًا؟",
      tr: "Bir yapay zekâ asistanının genel olarak konfeksiyon üretimi hakkında mükemmel, T&C hakkında ise yanlış cevap vermesini en iyi ne açıklar?",
    },
  "General industry knowledge is well represented in its training text; T&C's specifics are not, so it substitutes plausible patterns.":
    {
      ar: "المعرفة العامة بالقطاع ممثَّلة جيدًا في نصوص تدريبه؛ أما تفاصيل T&C فليست كذلك، فيستبدلها بأنماط تبدو معقولة.",
      tr: "Genel sektör bilgisi eğitim metninde iyi temsil edilir; T&C'ye özgü ayrıntılar edilmez, bu yüzden makul görünen örüntüleri yerine koyar.",
    },
  "It deliberately withholds company-specific information for privacy reasons.": {
    ar: "يحجب عمدًا المعلومات الخاصة بالشركات لأسباب تتعلق بالخصوصية.",
    tr: "Gizlilik nedeniyle şirkete özgü bilgileri kasten saklar.",
  },
  "It needs a paid licence to answer company questions.": {
    ar: "يحتاج ترخيصًا مدفوعًا للإجابة عن أسئلة الشركات.",
    tr: "Şirket sorularını yanıtlamak için ücretli lisansa ihtiyaç duyar.",
  },
  "Company-specific questions are always phrased badly.": {
    ar: "الأسئلة الخاصة بالشركات تُصاغ دائمًا بشكل سيئ.",
    tr: "Şirkete özgü sorular her zaman kötü ifade edilir.",
  },

  "A department proposes replacing a manual weekly report with an AI-generated one. What is the strongest argument for running both in parallel for a period?":
    {
      ar: "يقترح قسم استبدال تقرير أسبوعي يدوي بآخر يولّده الذكاء الاصطناعي. ما أقوى حجة لتشغيل الاثنين بالتوازي لفترة؟",
      tr: "Bir departman, elle hazırlanan haftalık raporu yapay zekâ üretimiyle değiştirmeyi öneriyor. İkisini bir süre paralel yürütmek için en güçlü gerekçe nedir?",
    },
  "It produces evidence about where the AI output differs from the trusted process, before anyone depends on it.": {
    ar: "يوفّر دليلًا على مواضع اختلاف مخرجات الذكاء الاصطناعي عن العملية الموثوقة، قبل أن يعتمد عليها أحد.",
    tr: "Kimse ona bağımlı hâle gelmeden önce, yapay zekâ çıktısının güvenilir süreçten nerede ayrıldığına dair kanıt üretir.",
  },
  "It gives the team more time to get used to the new tool.": {
    ar: "يمنح الفريق وقتًا أطول للاعتياد على الأداة الجديدة.",
    tr: "Ekibe yeni araca alışması için daha fazla zaman verir.",
  },
  "It doubles the amount of reporting available to management.": {
    ar: "يضاعف كمية التقارير المتاحة للإدارة.",
    tr: "Yönetime sunulan rapor miktarını ikiye katlar.",
  },
  "It satisfies a regulatory requirement for AI systems.": {
    ar: "يلبّي متطلبًا تنظيميًا خاصًا بأنظمة الذكاء الاصطناعي.",
    tr: "Yapay zekâ sistemleri için bir mevzuat gerekliliğini karşılar.",
  },

  // === Workplace · medium ===================================================
  "You have 300 free-text defect descriptions written by different inspectors. You want them grouped into standard categories. What is the best approach?":
    {
      ar: "لديك 300 وصف عيب بنص حر كتبها مفتشون مختلفون، وتريد تجميعها في فئات قياسية. ما الأسلوب الأفضل؟",
      tr: "Farklı denetçilerin yazdığı 300 serbest metinli hata açıklamanız var ve bunları standart kategorilere ayırmak istiyorsunuz. En iyi yaklaşım nedir?",
    },
  "Give it your existing defect categories, ask it to map each description with a confidence flag, then review the uncertain ones yourself.":
    {
      ar: "أعطه فئات العيوب الموجودة لديك، واطلب منه ربط كل وصف بفئة مع إشارة ثقة، ثم راجع بنفسك الحالات غير المؤكدة.",
      tr: "Mevcut hata kategorilerinizi verin, her açıklamayı bir güven işaretiyle eşleştirmesini isteyin, sonra emin olunmayanları kendiniz gözden geçirin.",
    },
  "Ask it to invent whatever categories it thinks are best and use those.": {
    ar: "اطلب منه ابتكار الفئات التي يراها الأفضل واستخدامها.",
    tr: "En iyi gördüğü kategorileri uydurmasını isteyin ve onları kullanın.",
  },
  "Ask it to tell you the root cause of each defect.": {
    ar: "اطلب منه إخبارك بالسبب الجذري لكل عيب.",
    tr: "Her hatanın kök nedenini söylemesini isteyin.",
  },
  "Ask it how many defects there were in total.": {
    ar: "اسأله عن العدد الإجمالي للعيوب.",
    tr: "Toplamda kaç hata olduğunu sorun.",
  },

  "A production manager wants monthly variance commentary from a finance spreadsheet. What is the correct division of labour?":
    {
      ar: "يريد مدير إنتاج تعليقًا شهريًا على الانحرافات من جدول بيانات مالي. ما التقسيم الصحيح للعمل؟",
      tr: "Bir üretim müdürü, finans tablosundan aylık sapma yorumu istiyor. Doğru iş bölümü nedir?",
    },
  "Calculate the variances in Excel, then give AI the summarised table and ask for the commentary.": {
    ar: "احسب الانحرافات في Excel، ثم أعطِ الذكاء الاصطناعي الجدول الملخّص واطلب التعليق.",
    tr: "Sapmaları Excel'de hesaplayın, sonra özet tabloyu yapay zekâya verip yorumu isteyin.",
  },
  "Paste the raw transaction list and ask AI to calculate the variances and write the commentary.": {
    ar: "لصق قائمة الحركات الخام وطلب أن يحسب الذكاء الاصطناعي الانحرافات ويكتب التعليق.",
    tr: "Ham işlem listesini yapıştırıp sapmaları hesaplamasını ve yorumu yazmasını istemek.",
  },
  "Ask AI what variances a garment factory usually has.": {
    ar: "سؤال الذكاء الاصطناعي عن الانحرافات المعتادة في مصنع ملابس.",
    tr: "Bir konfeksiyon fabrikasında genelde hangi sapmalar olduğunu sormak.",
  },
  "Ask AI to decide which variances matter and hide the rest.": {
    ar: "طلب أن يقرّر الذكاء الاصطناعي أي الانحرافات مهم وإخفاء الباقي.",
    tr: "Hangi sapmaların önemli olduğuna yapay zekânın karar verip kalanını gizlemesini istemek.",
  },

  "You are comparing three vendor quotations. Which instruction most improves the usefulness of the AI comparison?": {
    ar: "تقارن ثلاثة عروض أسعار من موردين. أي تعليمات تحسّن فائدة المقارنة أكثر؟",
    tr: "Üç satıcı teklifini karşılaştırıyorsunuz. Hangi talimat yapay zekâ karşılaştırmasının faydasını en çok artırır?",
  },
  "Specify the exact criteria to compare on, and ask it to list what each quotation does not state.": {
    ar: "تحديد معايير المقارنة بدقة، وطلب سرد ما لا يذكره كل عرض.",
    tr: "Karşılaştırma kriterlerini tam olarak belirtmek ve her teklifin neyi belirtmediğini listelemesini istemek.",
  },
  "Ask it to pick the best supplier and explain why.": {
    ar: "طلب اختيار أفضل مورّد وشرح السبب.",
    tr: "En iyi tedarikçiyi seçmesini ve nedenini açıklamasını istemek.",
  },
  "Ask it to rank them from best to worst without criteria.": {
    ar: "طلب ترتيبها من الأفضل إلى الأسوأ دون معايير.",
    tr: "Kriter vermeden en iyiden en kötüye sıralamasını istemek.",
  },
  "Ask it which supplier other garment manufacturers use.": {
    ar: "سؤاله عن المورّد الذي يستخدمه مصنّعو الملابس الآخرون.",
    tr: "Diğer konfeksiyon üreticilerinin hangi tedarikçiyi kullandığını sormak.",
  },

  "A colleague uses AI to draft an SOP from an operator's verbal description. What is the most important final step?": {
    ar: "يستخدم زميل الذكاء الاصطناعي لصياغة إجراء تشغيل قياسي من وصف شفهي لمشغّل. ما أهم خطوة أخيرة؟",
    tr: "Bir meslektaş, operatörün sözlü anlatımından SOP taslağı çıkarmak için yapay zekâ kullanıyor. En önemli son adım nedir?",
  },
  "The experienced operator reviews it and confirms nothing is missing or wrong.": {
    ar: "يراجعه المشغّل ذو الخبرة ويؤكد عدم وجود نقص أو خطأ.",
    tr: "Deneyimli operatör inceleyip eksik veya yanlış bir şey olmadığını teyit eder.",
  },
  "It is printed and posted on the line immediately.": {
    ar: "يُطبع ويُعلَّق على الخط فورًا.",
    tr: "Hemen basılıp hatta asılır.",
  },
  "It is filed in the document system without review.": {
    ar: "يُحفظ في نظام المستندات دون مراجعة.",
    tr: "İncelenmeden doküman sistemine kaydedilir.",
  },
  "It is sent to the AI again to double-check itself.": {
    ar: "يُرسَل إلى الذكاء الاصطناعي مرة أخرى ليراجع نفسه.",
    tr: "Kendini kontrol etmesi için yapay zekâya tekrar gönderilir.",
  },

  "You want AI to help investigate a three-hour production stoppage. Which prompt produces the most useful result?": {
    ar: "تريد مساعدة الذكاء الاصطناعي في التحقيق في توقّف إنتاج دام ثلاث ساعات. أي أمر يعطي أفيد نتيجة؟",
    tr: "Üç saatlik bir üretim duruşunu incelemek için yapay zekâdan yardım istiyorsunuz. Hangi prompt en yararlı sonucu verir?",
  },
  "'Facilitate a 5-Why analysis. Ask me one question at a time and wait for my answer.'": {
    ar: "«أدِر معي تحليل الأسباب الخمسة. اسألني سؤالًا واحدًا في كل مرة وانتظر إجابتي.»",
    tr: "'Benimle bir 5-Neden analizi yürüt. Her seferinde tek soru sor ve cevabımı bekle.'",
  },
  "'Tell me the root cause of a three-hour stoppage on a finishing line.'": {
    ar: "«أخبرني بالسبب الجذري لتوقف دام ثلاث ساعات في خط التشطيب.»",
    tr: "'Bir finisaj hattındaki üç saatlik duruşun kök nedenini söyle.'",
  },
  "'Write the incident report for a three-hour stoppage.'": {
    ar: "«اكتب تقرير الحادث لتوقف دام ثلاث ساعات.»",
    tr: "'Üç saatlik duruş için olay raporunu yaz.'",
  },
  "'How long do stoppages usually last in garment factories?'": {
    ar: "«كم تدوم التوقفات عادة في مصانع الملابس؟»",
    tr: "'Konfeksiyon fabrikalarında duruşlar genelde ne kadar sürer?'",
  },

  "Which instructions make an AI-written management report noticeably more useful? Select all that apply.": {
    ar: "أي التعليمات تجعل تقريرًا إداريًا كتبه الذكاء الاصطناعي أكثر فائدة بوضوح؟ اختر كل ما ينطبق.",
    tr: "Hangi talimatlar, yapay zekânın yazdığı bir yönetim raporunu belirgin biçimde daha yararlı kılar? Uygun olanların tümünü seçin.",
  },
  "State who the audience is and what they will do with it": {
    ar: "تحديد من الجمهور وماذا سيفعل بالتقرير",
    tr: "Hedef kitlenin kim olduğunu ve raporu ne için kullanacağını belirtmek",
  },
  "Set a maximum word count": { ar: "تحديد حد أقصى لعدد الكلمات", tr: "Azami kelime sayısı belirlemek" },
  "Require headlines that state the conclusion, not the topic": {
    ar: "اشتراط عناوين تذكر الخلاصة لا الموضوع",
    tr: "Başlıkların konuyu değil sonucu söylemesini şart koşmak",
  },
  "Ask it to add relevant industry benchmarks from its own knowledge": {
    ar: "طلب إضافة معايير قطاعية من معرفته الخاصة",
    tr: "Kendi bilgisinden sektör kıyas değerleri eklemesini istemek",
  },
  "Forbid introducing any figure you did not supply": {
    ar: "منع إدخال أي رقم لم تقدّمه أنت",
    tr: "Sizin vermediğiniz hiçbir rakamı eklemesini yasaklamak",
  },

  "Your team spends two hours a week consolidating the same five spreadsheets. What is the most realistic AI-related action?":
    {
      ar: "يقضي فريقك ساعتين أسبوعيًا في دمج نفس جداول البيانات الخمسة. ما الإجراء الأكثر واقعية المتعلق بالذكاء الاصطناعي؟",
      tr: "Ekibiniz her hafta aynı beş tabloyu birleştirmek için iki saat harcıyor. Yapay zekâ açısından en gerçekçi adım nedir?",
    },
  "Use AI to help write a script that does the consolidation, then run it each week.": {
    ar: "استخدام الذكاء الاصطناعي للمساعدة في كتابة سكربت يقوم بالدمج، ثم تشغيله كل أسبوع.",
    tr: "Birleştirmeyi yapan bir betiği yazmak için yapay zekâdan yararlanıp her hafta çalıştırmak.",
  },
  "Paste all five spreadsheets into a chat every week and ask for the consolidated result.": {
    ar: "لصق جداول البيانات الخمسة في محادثة كل أسبوع وطلب النتيجة المدمجة.",
    tr: "Her hafta beş tabloyu da sohbete yapıştırıp birleşik sonucu istemek.",
  },
  "Ask AI to remember the spreadsheets so you do not have to send them again.": {
    ar: "طلب أن يتذكر الذكاء الاصطناعي الجداول حتى لا ترسلها مجددًا.",
    tr: "Tabloları tekrar göndermek zorunda kalmamak için yapay zekâdan hatırlamasını istemek.",
  },
  "Accept that this task cannot be improved.": {
    ar: "القبول بأن هذه المهمة لا يمكن تحسينها.",
    tr: "Bu görevin iyileştirilemeyeceğini kabul etmek.",
  },

  "Which of these is the strongest sign that a task is a good AI candidate?": {
    ar: "أي مما يلي أقوى إشارة إلى أن مهمة ما مرشّحة جيدة للذكاء الاصطناعي؟",
    tr: "Bir görevin yapay zekâ için iyi bir aday olduğunun en güçlü işareti hangisidir?",
  },
  "You would recognise a bad output immediately, and the task is mostly reading or writing.": {
    ar: "ستتعرّف على المخرجات السيئة فورًا، والمهمة في معظمها قراءة أو كتابة.",
    tr: "Kötü bir çıktıyı hemen fark edersiniz ve görev çoğunlukla okuma veya yazmadır.",
  },
  "The task is very important and high-risk.": {
    ar: "المهمة بالغة الأهمية وعالية المخاطر.",
    tr: "Görev çok önemli ve yüksek riskli.",
  },
  "Nobody in the team currently understands the task.": {
    ar: "لا أحد في الفريق يفهم المهمة حاليًا.",
    tr: "Ekipte şu anda görevi anlayan kimse yok.",
  },
  "The task involves confidential customer data.": {
    ar: "تتضمن المهمة بيانات عملاء سرّية.",
    tr: "Görev gizli müşteri verisi içeriyor.",
  },

  "An AI summary of an inspection report is going into a customer audit pack. What must you do?": {
    ar: "سيُدرَج ملخّص أعدّه الذكاء الاصطناعي لتقرير فحص ضمن ملف تدقيق للعميل. ماذا يجب أن تفعل؟",
    tr: "Bir muayene raporunun yapay zekâ özeti, müşteri denetim dosyasına girecek. Ne yapmalısınız?",
  },
  "Require it to reference each source report, then verify every figure and reference against the originals.": {
    ar: "اشتراط الإشارة إلى كل تقرير مصدر، ثم التحقق من كل رقم وكل مرجع مقابل الأصول.",
    tr: "Her kaynak rapora atıf yapmasını şart koşup her rakamı ve atfı orijinalleriyle doğrulamak.",
  },
  "Use it as-is — the customer only reads the summary.": {
    ar: "استخدامه كما هو — فالعميل يقرأ الملخص فقط.",
    tr: "Olduğu gibi kullanmak — müşteri yalnızca özeti okuyor.",
  },
  "Ask the AI to confirm the summary is accurate.": {
    ar: "طلب أن يؤكد الذكاء الاصطناعي دقة الملخص.",
    tr: "Yapay zekâdan özetin doğru olduğunu teyit etmesini istemek.",
  },
  "Remove all figures so nothing can be wrong.": {
    ar: "حذف جميع الأرقام حتى لا يكون هناك خطأ.",
    tr: "Hiçbir şey yanlış olmasın diye tüm rakamları çıkarmak.",
  },

  "You ask AI to analyse survey comments and it produces beautifully worded themes. What should you check first?": {
    ar: "طلبت من الذكاء الاصطناعي تحليل تعليقات استبيان فأنتج مواضيع مصاغة بشكل جميل. ما أول ما يجب التحقق منه؟",
    tr: "Yapay zekâdan anket yorumlarını analiz etmesini istediniz ve güzel ifade edilmiş temalar üretti. Önce neyi kontrol etmelisiniz?",
  },
  "That the verbatim quotes actually support the themes, and that negative feedback has not been softened.": {
    ar: "أن الاقتباسات الحرفية تدعم المواضيع فعلًا، وأن الملاحظات السلبية لم تُلطَّف.",
    tr: "Birebir alıntıların temaları gerçekten desteklediğini ve olumsuz geri bildirimin yumuşatılmadığını.",
  },
  "That the themes are written in good English.": {
    ar: "أن المواضيع مكتوبة بإنجليزية جيدة.",
    tr: "Temaların iyi bir İngilizceyle yazıldığını.",
  },
  "That there are at least ten themes.": { ar: "أن هناك عشرة مواضيع على الأقل.", tr: "En az on tema olduğunu." },
  "That the themes match what management expected.": {
    ar: "أن المواضيع تطابق ما توقّعته الإدارة.",
    tr: "Temaların yönetimin beklediğiyle örtüştüğünü.",
  },

  // === Workplace · advanced =================================================
  "You have used AI to prepare an analysis that will be presented to the board. What is the most important thing to be able to do?":
    {
      ar: "استخدمت الذكاء الاصطناعي لإعداد تحليل سيُعرض على مجلس الإدارة. ما أهم ما يجب أن تكون قادرًا عليه؟",
      tr: "Yönetim kuruluna sunulacak bir analizi hazırlamak için yapay zekâ kullandınız. Yapabilmeniz gereken en önemli şey nedir?",
    },
  "Explain the reasoning behind every conclusion yourself, without referring to the AI conversation.": {
    ar: "شرح المنطق وراء كل استنتاج بنفسك، دون الرجوع إلى محادثة الذكاء الاصطناعي.",
    tr: "Her sonucun arkasındaki gerekçeyi, yapay zekâ sohbetine başvurmadan kendiniz açıklamak.",
  },
  "Show the board the prompt you used.": {
    ar: "عرض الأمر الذي استخدمته على مجلس الإدارة.",
    tr: "Kullandığınız promptu yönetim kuruluna göstermek.",
  },
  "Confirm which AI tool produced it.": {
    ar: "تأكيد أي أداة ذكاء اصطناعي أنتجته.",
    tr: "Hangi yapay zekâ aracının ürettiğini teyit etmek.",
  },
  "Demonstrate that the AI is a paid enterprise version.": {
    ar: "إثبات أن الذكاء الاصطناعي نسخة مؤسسية مدفوعة.",
    tr: "Yapay zekânın ücretli kurumsal sürüm olduğunu göstermek.",
  },

  "A department reports that AI 'saved 20 hours a week'. As a manager, what is your first question?": {
    ar: "يُبلغ قسم أن الذكاء الاصطناعي «وفّر 20 ساعة أسبوعيًا». بصفتك مديرًا، ما أول سؤال تطرحه؟",
    tr: "Bir departman yapay zekânın 'haftada 20 saat kazandırdığını' bildiriyor. Yönetici olarak ilk sorunuz nedir?",
  },
  "How long did those tasks take before, and how was that measured?": {
    ar: "كم كانت تستغرق تلك المهام من قبل، وكيف قِيس ذلك؟",
    tr: "Bu görevler önceden ne kadar sürüyordu ve bu nasıl ölçüldü?",
  },
  "Which AI tool did you use?": { ar: "أي أداة ذكاء اصطناعي استخدمتم؟", tr: "Hangi yapay zekâ aracını kullandınız?" },
  "Can we roll it out to every department this month?": {
    ar: "هل يمكننا تعميمه على كل الأقسام هذا الشهر؟",
    tr: "Bu ay tüm departmanlara yayabilir miyiz?",
  },
  "How many prompts did you write?": { ar: "كم أمرًا كتبتم؟", tr: "Kaç prompt yazdınız?" },

  "Which of these would make you stop and reconsider an AI workflow a team has built? Select all that apply.": {
    ar: "أي مما يلي يجعلك تتوقف وتعيد النظر في سير عمل بالذكاء الاصطناعي بناه فريق؟ اختر كل ما ينطبق.",
    tr: "Bir ekibin kurduğu yapay zekâ akışını durup yeniden düşünmenize hangileri yol açar? Uygun olanların tümünü seçin.",
  },
  "Nobody can explain how the output was produced": {
    ar: "لا أحد يستطيع شرح كيف أُنتجت المخرجات",
    tr: "Çıktının nasıl üretildiğini kimse açıklayamıyor",
  },
  "Confidential data is being pasted into an unapproved tool": {
    ar: "تُلصق بيانات سرّية في أداة غير معتمدة",
    tr: "Gizli veri onaysız bir araca yapıştırılıyor",
  },
  "The output goes directly to a customer with no review": {
    ar: "تذهب المخرجات مباشرة إلى العميل دون مراجعة",
    tr: "Çıktı hiç incelenmeden doğrudan müşteriye gidiyor",
  },
  "The team saved the prompt as a reusable template": {
    ar: "حفظ الفريق الأمر كقالب قابل لإعادة الاستخدام",
    tr: "Ekip promptu yeniden kullanılabilir şablon olarak kaydetti",
  },
  "Figures in the output are never checked against the source": {
    ar: "لا تُقارَن الأرقام في المخرجات بالمصدر أبدًا",
    tr: "Çıktıdaki rakamlar kaynakla hiç karşılaştırılmıyor",
  },

  "Two teams solve the same problem with AI. Team A gets one excellent answer. Team B builds a documented, reusable prompt that gives a good answer every time. Which has created more value, and why?":
    {
      ar: "فريقان يحلّان المشكلة نفسها بالذكاء الاصطناعي. الفريق أ يحصل على إجابة ممتازة واحدة. الفريق ب يبني أمرًا موثّقًا قابلًا لإعادة الاستخدام يعطي إجابة جيدة في كل مرة. أيهما خلق قيمة أكبر ولماذا؟",
      tr: "İki ekip aynı sorunu yapay zekâ ile çözüyor. A ekibi tek bir mükemmel cevap alıyor. B ekibi her seferinde iyi cevap veren, belgelenmiş ve yeniden kullanılabilir bir prompt kuruyor. Hangisi daha çok değer yarattı ve neden?",
    },
  "Team B — a repeatable process compounds every week, while a one-off answer does not.": {
    ar: "الفريق ب — العملية القابلة للتكرار تتراكم فائدتها كل أسبوع، بينما الإجابة العابرة لا.",
    tr: "B ekibi — tekrarlanabilir bir süreç her hafta birikir, tek seferlik bir cevap ise birikmez.",
  },
  "Team A — output quality is the only thing that matters.": {
    ar: "الفريق أ — جودة المخرجات هي الشيء الوحيد المهم.",
    tr: "A ekibi — önemli olan tek şey çıktı kalitesidir.",
  },
  "Neither — both approaches produce the same value.": {
    ar: "لا هذا ولا ذاك — كلا الأسلوبين ينتج القيمة نفسها.",
    tr: "Hiçbiri — her iki yaklaşım da aynı değeri üretir.",
  },
  "Team A, because it took less time.": { ar: "الفريق أ، لأنه استغرق وقتًا أقل.", tr: "A ekibi, çünkü daha az zaman aldı." },

  "An AI-assisted process has been running for three months. What is the most useful thing to review?": {
    ar: "عملية مدعومة بالذكاء الاصطناعي تعمل منذ ثلاثة أشهر. ما أنفع شيء لمراجعته؟",
    tr: "Yapay zekâ destekli bir süreç üç aydır çalışıyor. Gözden geçirilecek en yararlı şey nedir?",
  },
  "A sample of real outputs checked against the source, to see whether quality has drifted.": {
    ar: "عيّنة من المخرجات الحقيقية تُقارَن بالمصدر لمعرفة ما إذا كانت الجودة قد انحرفت.",
    tr: "Kalitenin kayıp kaymadığını görmek için gerçek çıktılardan bir örneklemi kaynakla karşılaştırmak.",
  },
  "How many people are using it.": { ar: "عدد الأشخاص الذين يستخدمونها.", tr: "Kaç kişinin kullandığı." },
  "Whether users say they like it.": { ar: "ما إذا كان المستخدمون يقولون إنهم يحبونها.", tr: "Kullanıcıların beğendiklerini söyleyip söylemediği." },
  "Whether the provider has released a newer model.": {
    ar: "ما إذا كان المزوّد قد أصدر نموذجًا أحدث.",
    tr: "Sağlayıcının daha yeni bir model yayınlayıp yayınlamadığı.",
  },

  "You want to introduce AI into a process that currently has a manual double-check by a second person. What should happen to that check?":
    {
      ar: "تريد إدخال الذكاء الاصطناعي في عملية تتضمن حاليًا مراجعة يدوية مزدوجة من شخص ثانٍ. ماذا يجب أن يحدث لتلك المراجعة؟",
      tr: "Şu anda ikinci bir kişinin elle çift kontrol yaptığı bir sürece yapay zekâ eklemek istiyorsunuz. Bu kontrole ne olmalı?",
    },
  "Keep it, and use what it catches as evidence for whether the control can safely change later.": {
    ar: "الإبقاء عليها، واستخدام ما تكتشفه كدليل على ما إذا كان يمكن تغيير الضابط بأمان لاحقًا.",
    tr: "Korumak ve yakaladıklarını, kontrolün ileride güvenle değiştirilip değiştirilemeyeceğine dair kanıt olarak kullanmak.",
  },
  "Remove it — the AI replaces the second person.": {
    ar: "إزالتها — فالذكاء الاصطناعي يحل محل الشخص الثاني.",
    tr: "Kaldırmak — yapay zekâ ikinci kişinin yerini alır.",
  },
  "Remove it only if the AI is a paid enterprise version.": {
    ar: "إزالتها فقط إذا كان الذكاء الاصطناعي نسخة مؤسسية مدفوعة.",
    tr: "Yalnızca yapay zekâ ücretli kurumsal sürümse kaldırmak.",
  },
  "Replace it with a second AI reviewing the first AI.": {
    ar: "استبدالها بذكاء اصطناعي ثانٍ يراجع الأول.",
    tr: "Yerine, ilk yapay zekâyı inceleyen ikinci bir yapay zekâ koymak.",
  },

  // === Prompting · medium ===================================================
  "Which follow-up question is most effective at exposing invented content?": {
    ar: "أي سؤال متابعة هو الأكثر فاعلية في كشف المحتوى المُختلَق؟",
    tr: "Uydurma içeriği ortaya çıkarmada hangi takip sorusu en etkilidir?",
  },
  "'Which parts of that answer are directly supported by the document I gave you, and which did you infer?'": {
    ar: "«أي أجزاء من تلك الإجابة مدعومة مباشرة بالمستند الذي أعطيتك إياه، وأيها استنتجته؟»",
    tr: "'Bu cevabın hangi kısımları verdiğim belgeyle doğrudan destekleniyor, hangilerini çıkarımla ürettin?'",
  },
  "'Are you sure that is correct?'": { ar: "«هل أنت متأكد من صحة ذلك؟»", tr: "'Bunun doğru olduğundan emin misin?'" },
  "'Please double-check your answer.'": { ar: "«من فضلك راجع إجابتك مرة أخرى.»", tr: "'Lütfen cevabını bir kez daha kontrol et.'" },
  "'How confident are you out of ten?'": { ar: "«ما درجة ثقتك من عشرة؟»", tr: "'On üzerinden ne kadar eminsin?'" },

  "You need AI to compare three vendor quotations and produce a price comparison, a risk assessment, a recommendation and a management summary. Which prompt design is strongest?":
    {
      ar: "تحتاج من الذكاء الاصطناعي مقارنة ثلاثة عروض أسعار وإنتاج مقارنة أسعار وتقييم مخاطر وتوصية وملخص إداري. أي تصميم للأمر هو الأقوى؟",
      tr: "Yapay zekânın üç satıcı teklifini karşılaştırıp fiyat karşılaştırması, risk değerlendirmesi, öneri ve yönetici özeti üretmesini istiyorsunuz. Hangi prompt tasarımı en güçlüdür?",
    },
  "State the four deliverables as a numbered list, define the comparison criteria yourself, forbid figures you did not supply, and ask it to list anything a quotation fails to state.":
    {
      ar: "ذكر المخرجات الأربعة كقائمة مرقّمة، وتحديد معايير المقارنة بنفسك، ومنع أي أرقام لم تقدّمها، وطلب سرد ما يغفل عن ذكره أي عرض.",
      tr: "Dört çıktıyı numaralı liste hâlinde belirtmek, karşılaştırma kriterlerini kendiniz tanımlamak, vermediğiniz rakamları yasaklamak ve bir teklifin belirtmediği her şeyi listelemesini istemek.",
    },
  "Ask one open question: 'Analyse these three quotations and tell me what to do.'": {
    ar: "طرح سؤال مفتوح واحد: «حلّل هذه العروض الثلاثة وأخبرني ماذا أفعل.»",
    tr: "Tek bir açık soru sormak: 'Bu üç teklifi analiz et ve ne yapmam gerektiğini söyle.'",
  },
  "Ask four separate questions in four separate conversations.": {
    ar: "طرح أربعة أسئلة منفصلة في أربع محادثات منفصلة.",
    tr: "Dört ayrı sohbette dört ayrı soru sormak.",
  },
  "Ask it to score each supplier out of 100 using its own criteria.": {
    ar: "طلب تقييم كل مورّد من 100 وفق معاييره الخاصة.",
    tr: "Her tedarikçiyi kendi kriterleriyle 100 üzerinden puanlamasını istemek.",
  },

  "Which constraints would meaningfully improve a prompt asking for an executive brief? Select all that apply.": {
    ar: "أي القيود تحسّن فعليًا أمرًا يطلب ملخصًا تنفيذيًا؟ اختر كل ما ينطبق.",
    tr: "Yönetici özeti isteyen bir promptu hangi kısıtlar anlamlı şekilde iyileştirir? Uygun olanların tümünü seçin.",
  },
  "'Maximum 300 words'": { ar: "«بحد أقصى 300 كلمة»", tr: "'En fazla 300 kelime'" },
  "'Written for a non-financial operations director'": {
    ar: "«موجّه لمدير عمليات غير متخصص في المالية»",
    tr: "'Finans kökenli olmayan bir operasyon direktörü için yazılmış'",
  },
  "'Each heading must state the conclusion, not the topic'": {
    ar: "«كل عنوان يجب أن يذكر الخلاصة لا الموضوع»",
    tr: "'Her başlık konuyu değil sonucu söylemeli'",
  },
  "'Use a formal and professional tone'": { ar: "«استخدم نبرة رسمية ومهنية»", tr: "'Resmî ve profesyonel bir ton kullan'" },
  "'Do not introduce any figure I have not provided'": {
    ar: "«لا تُدخل أي رقم لم أقدّمه»",
    tr: "'Benim vermediğim hiçbir rakamı ekleme'",
  },

  "You are drafting a difficult email to a supplier. Which instruction most improves the result?": {
    ar: "تصوغ بريدًا صعبًا إلى مورّد. أي تعليمات تحسّن النتيجة أكثر؟",
    tr: "Bir tedarikçiye zor bir e-posta yazıyorsunuz. Hangi talimat sonucu en çok iyileştirir?",
  },
  "'Firm but relationship-preserving. Do not apologise for raising the issue.'": {
    ar: "«حازم مع الحفاظ على العلاقة. لا تعتذر عن إثارة الموضوع.»",
    tr: "'Kararlı ama ilişkiyi koruyan. Konuyu açtığın için özür dileme.'",
  },
  "'Write it professionally.'": { ar: "«اكتبه باحترافية.»", tr: "'Profesyonelce yaz.'" },
  "'Make it polite.'": { ar: "«اجعله مهذبًا.»", tr: "'Kibar olsun.'" },
  "'Write it the way a manager would.'": { ar: "«اكتبه كما يكتبه مدير.»", tr: "'Bir yöneticinin yazacağı gibi yaz.'" },

  "What is the main benefit of giving the AI an example of the output you want?": {
    ar: "ما الفائدة الرئيسية من إعطاء الذكاء الاصطناعي مثالًا على المخرجات التي تريدها؟",
    tr: "Yapay zekâya istediğiniz çıktının bir örneğini vermenin temel faydası nedir?",
  },
  "It conveys structure, tone and detail level more precisely than describing them.": {
    ar: "ينقل البنية والنبرة ومستوى التفصيل بدقة أكبر من وصفها بالكلمات.",
    tr: "Yapıyı, tonu ve ayrıntı düzeyini tarif etmekten daha net aktarır.",
  },
  "It makes the response arrive faster.": { ar: "يجعل الإجابة تصل أسرع.", tr: "Cevabın daha hızlı gelmesini sağlar." },
  "It is the only way to get formatted output.": {
    ar: "إنها الطريقة الوحيدة للحصول على مخرجات منسّقة.",
    tr: "Biçimlendirilmiş çıktı almanın tek yoludur.",
  },
  "It prevents the model from hallucinating.": {
    ar: "يمنع النموذج من الهلوسة.",
    tr: "Modelin halüsinasyon görmesini engeller.",
  },

  "A colleague's prompt keeps producing generic marketing language. What is the most likely cause?": {
    ar: "أمر زميلك ينتج باستمرار لغة تسويقية عامة. ما السبب الأرجح؟",
    tr: "Bir meslektaşınızın promptu sürekli genel pazarlama dili üretiyor. En olası sebep nedir?",
  },
  "The prompt has no specific context or constraints, so the model produces the most average answer possible.": {
    ar: "الأمر خالٍ من سياق أو قيود محددة، فينتج النموذج أكثر إجابة متوسطة ممكنة.",
    tr: "Promptta belirli bir bağlam veya kısıt yok, bu yüzden model mümkün olan en ortalama cevabı üretiyor.",
  },
  "The model is not capable of writing in a specific style.": {
    ar: "النموذج غير قادر على الكتابة بأسلوب محدد.",
    tr: "Model belirli bir üslupla yazamaz.",
  },
  "The prompt is too long.": { ar: "الأمر طويل جدًا.", tr: "Prompt çok uzun." },
  "They need a paid version of the tool.": {
    ar: "يحتاجون نسخة مدفوعة من الأداة.",
    tr: "Aracın ücretli sürümüne ihtiyaçları var.",
  },

  "Which prompt is most likely to produce a useful root-cause investigation?": {
    ar: "أي أمر هو الأرجح أن ينتج تحقيقًا مفيدًا في الأسباب الجذرية؟",
    tr: "Hangi prompt yararlı bir kök neden incelemesi üretmeye en yatkındır?",
  },
  "'Facilitate a 5-Why analysis with me. Ask one question at a time and wait for my answer before the next.'": {
    ar: "«أدِر معي تحليل الأسباب الخمسة. اسأل سؤالًا واحدًا في كل مرة وانتظر إجابتي قبل التالي.»",
    tr: "'Benimle bir 5-Neden analizi yürüt. Her seferinde tek soru sor ve bir sonrakinden önce cevabımı bekle.'",
  },
  "'What causes machine stoppages in garment factories?'": {
    ar: "«ما أسباب توقف الماكينات في مصانع الملابس؟»",
    tr: "'Konfeksiyon fabrikalarında makine duruşlarına ne yol açar?'",
  },
  "'Write a root cause analysis for a stoppage.'": {
    ar: "«اكتب تحليل أسباب جذرية لتوقف.»",
    tr: "'Bir duruş için kök neden analizi yaz.'",
  },
  "'List all possible causes of production problems.'": {
    ar: "«اسرد كل الأسباب المحتملة لمشكلات الإنتاج.»",
    tr: "'Üretim sorunlarının tüm olası nedenlerini listele.'",
  },

  "You are building a prompt template your whole team will reuse. What should it include? Select all that apply.": {
    ar: "تبني قالب أمر سيعيد فريقك بأكمله استخدامه. ماذا ينبغي أن يتضمّن؟ اختر كل ما ينطبق.",
    tr: "Tüm ekibinizin yeniden kullanacağı bir prompt şablonu hazırlıyorsunuz. Neleri içermeli? Uygun olanların tümünü seçin.",
  },
  "Clearly marked placeholders for the parts that change each time": {
    ar: "عناصر نائبة موسومة بوضوح للأجزاء التي تتغيّر في كل مرة",
    tr: "Her seferinde değişen kısımlar için açıkça işaretlenmiş yer tutucular",
  },
  "The constraints that should stay the same every time": {
    ar: "القيود التي ينبغي أن تبقى ثابتة في كل مرة",
    tr: "Her seferinde aynı kalması gereken kısıtlar",
  },
  "The required output structure": { ar: "بنية المخرجات المطلوبة", tr: "İstenen çıktı yapısı" },
  "A note on what must be verified before the output is used": {
    ar: "ملاحظة بما يجب التحقق منه قبل استخدام المخرجات",
    tr: "Çıktı kullanılmadan önce nelerin doğrulanması gerektiğine dair bir not",
  },
  "The name of the person who wrote it": { ar: "اسم من كتبه", tr: "Yazan kişinin adı" },

  "Why does asking for 'anything the document does not state' produce such useful output?": {
    ar: "لماذا يُنتج طلب «أي شيء لا يذكره المستند» مخرجات مفيدة إلى هذا الحد؟",
    tr: "'Belgenin belirtmediği her şeyi' istemek neden bu kadar yararlı çıktı üretir?",
  },
  "It surfaces gaps and stops the model quietly filling them with assumed norms.": {
    ar: "يكشف الثغرات ويمنع النموذج من ملئها بهدوء بافتراضات معتادة.",
    tr: "Boşlukları görünür kılar ve modelin onları sessizce varsayılan normlarla doldurmasını engeller.",
  },
  "It makes the summary shorter.": { ar: "يجعل الملخص أقصر.", tr: "Özeti kısaltır." },
  "It is required for the model to read attachments.": {
    ar: "إنه شرط لكي يقرأ النموذج المرفقات.",
    tr: "Modelin ekleri okuyabilmesi için gereklidir.",
  },
  "It prevents the model from summarising incorrectly.": {
    ar: "يمنع النموذج من التلخيص بشكل غير صحيح.",
    tr: "Modelin yanlış özetlemesini engeller.",
  },

  // === Prompting · advanced =================================================
  "Your prompt works well for you but produces poor results when a colleague uses it. What is the most likely explanation?":
    {
      ar: "أمرك يعمل جيدًا معك لكنه يعطي نتائج ضعيفة عندما يستخدمه زميل. ما التفسير الأرجح؟",
      tr: "Promptunuz sizde iyi çalışıyor ama bir meslektaşınız kullandığında kötü sonuç veriyor. En olası açıklama nedir?",
    },
  "Your prompt depends on context established earlier in your conversation and is not self-contained.": {
    ar: "أمرك يعتمد على سياق تأسّس سابقًا في محادثتك وليس مكتفيًا بذاته.",
    tr: "Promptunuz, sohbetinizde daha önce kurulmuş bağlama dayanıyor ve kendi başına yeterli değil.",
  },
  "Prompts only work for the person who wrote them.": {
    ar: "الأوامر لا تعمل إلا مع من كتبها.",
    tr: "Promptlar yalnızca onları yazan kişide çalışır.",
  },
  "Your colleague has a different account tier.": {
    ar: "زميلك لديه مستوى حساب مختلف.",
    tr: "Meslektaşınızın hesap seviyesi farklı.",
  },
  "The model remembers you specifically.": { ar: "النموذج يتذكّرك أنت تحديدًا.", tr: "Model özellikle sizi hatırlıyor." },

  "Which is the strongest verification instruction to build into a prompt used for management reporting?": {
    ar: "ما أقوى تعليمات تحقق يمكن تضمينها في أمر يُستخدم للتقارير الإدارية؟",
    tr: "Yönetim raporlaması için kullanılan bir prompta yerleştirilecek en güçlü doğrulama talimatı hangisidir?",
  },
  "'Mark every statement as either supported by the data I gave you or inferred, and list what you would need to confirm each inference.'":
    {
      ar: "«صنّف كل عبارة إما مدعومة بالبيانات التي أعطيتك إياها أو مستنتجة، واذكر ما تحتاجه لتأكيد كل استنتاج.»",
      tr: "'Her ifadeyi ya verdiğim veriyle destekleniyor ya da çıkarım olarak işaretle ve her çıkarımı doğrulamak için neye ihtiyacın olduğunu listele.'",
    },
  "'Be careful with the numbers.'": { ar: "«كن حذرًا مع الأرقام.»", tr: "'Sayılara dikkat et.'" },
  "'Only include things you are sure about.'": {
    ar: "«أدرج فقط ما أنت متأكد منه.»",
    tr: "'Yalnızca emin olduğun şeyleri ekle.'",
  },
  "'Say if you are unsure.'": { ar: "«قل إن كنت غير متأكد.»", tr: "'Emin değilsen söyle.'" },

  "A prompt asks for a decision recommendation. Which design choices reduce the risk of a poor decision? Select all that apply.":
    {
      ar: "أمر يطلب توصية بقرار. أي خيارات التصميم تقلّل خطر قرار سيئ؟ اختر كل ما ينطبق.",
      tr: "Bir prompt karar önerisi istiyor. Hangi tasarım tercihleri kötü karar riskini azaltır? Uygun olanların tümünü seçin.",
    },
  "Ask it to present trade-offs rather than choose": {
    ar: "طلب عرض المفاضلات بدل الاختيار",
    tr: "Seçim yapmak yerine ödünleşimleri sunmasını istemek",
  },
  "Forbid any figure you did not supply": {
    ar: "منع أي رقم لم تقدّمه أنت",
    tr: "Sizin vermediğiniz hiçbir rakamı yasaklamak",
  },
  "Require it to name the assumptions the recommendation depends on": {
    ar: "اشتراط تسمية الافتراضات التي تقوم عليها التوصية",
    tr: "Önerinin dayandığı varsayımları adlandırmasını şart koşmak",
  },
  "Ask it to argue the strongest case against its own recommendation": {
    ar: "طلب بناء أقوى حجة ضد توصيته هو",
    tr: "Kendi önerisine karşı en güçlü savı kurmasını istemek",
  },
  "Ask it to be confident and decisive": {
    ar: "طلب أن يكون واثقًا وحاسمًا",
    tr: "Kendinden emin ve kararlı olmasını istemek",
  },

  "You want consistent output structure across 50 documents processed one at a time. What matters most?": {
    ar: "تريد بنية مخرجات متسقة عبر 50 مستندًا تُعالَج واحدًا تلو الآخر. ما الأهم؟",
    tr: "Teker teker işlenen 50 belgede tutarlı bir çıktı yapısı istiyorsunuz. En önemli olan nedir?",
  },
  "Specify an exact output schema and reuse the identical wording every time.": {
    ar: "تحديد مخطّط مخرجات دقيق وإعادة استخدام الصياغة نفسها حرفيًا في كل مرة.",
    tr: "Tam bir çıktı şeması belirtmek ve her seferinde birebir aynı ifadeyi kullanmak.",
  },
  "Ask each time for 'the same format as before'.": {
    ar: "الطلب في كل مرة بـ«نفس الشكل السابق».",
    tr: "Her seferinde 'öncekiyle aynı biçimde' istemek.",
  },
  "Process all 50 in one conversation so it remembers.": {
    ar: "معالجة الخمسين جميعًا في محادثة واحدة كي يتذكّر.",
    tr: "Hatırlaması için 50'sini tek sohbette işlemek.",
  },
  "Use a longer prompt each time for more detail.": {
    ar: "استخدام أمر أطول في كل مرة لمزيد من التفصيل.",
    tr: "Daha fazla ayrıntı için her seferinde daha uzun prompt kullanmak.",
  },

  // === Data & automation · medium ===========================================
  "Your team manually copies figures from five reports into one summary each week. What is the most sensible first step?":
    {
      ar: "ينسخ فريقك يدويًا أرقامًا من خمسة تقارير إلى ملخص واحد كل أسبوع. ما أنسب خطوة أولى؟",
      tr: "Ekibiniz her hafta beş rapordan rakamları elle tek bir özete kopyalıyor. En mantıklı ilk adım nedir?",
    },
  "Map where each figure originates — the five reports may share one source you can go to directly.": {
    ar: "تتبّع مصدر كل رقم — فقد تشترك التقارير الخمسة في مصدر واحد يمكنك الرجوع إليه مباشرة.",
    tr: "Her rakamın nereden geldiğini haritalayın — beş rapor, doğrudan gidebileceğiniz tek bir kaynağı paylaşıyor olabilir.",
  },
  "Build an AI tool to read the five reports.": {
    ar: "بناء أداة ذكاء اصطناعي لقراءة التقارير الخمسة.",
    tr: "Beş raporu okuyacak bir yapay zekâ aracı geliştirmek.",
  },
  "Ask AI to do the copying each week in a chat.": {
    ar: "طلب أن يقوم الذكاء الاصطناعي بالنسخ كل أسبوع داخل محادثة.",
    tr: "Kopyalamayı her hafta sohbette yapay zekâya yaptırmak.",
  },
  "Accept it as unavoidable manual work.": {
    ar: "القبول به كعمل يدوي لا مفر منه.",
    tr: "Kaçınılmaz bir elle iş olarak kabul etmek.",
  },

  "Which task is genuinely well suited to AI rather than a simple script?": {
    ar: "أي مهمة تناسب الذكاء الاصطناعي فعلًا أكثر من سكربت بسيط؟",
    tr: "Hangi görev basit bir betikten çok gerçekten yapay zekâya uygundur?",
  },
  "Grouping thousands of free-text complaint descriptions into themes.": {
    ar: "تجميع آلاف أوصاف الشكاوى النصية الحرة في مواضيع.",
    tr: "Binlerce serbest metinli şikâyet açıklamasını temalara ayırmak.",
  },
  "Copying column C from one spreadsheet to another every Monday.": {
    ar: "نسخ العمود C من جدول إلى آخر كل يوم اثنين.",
    tr: "Her pazartesi C sütununu bir tablodan diğerine kopyalamak.",
  },
  "Summing a column of numbers.": { ar: "جمع عمود من الأرقام.", tr: "Bir sayı sütununu toplamak." },
  "Renaming files according to a fixed pattern.": {
    ar: "إعادة تسمية الملفات وفق نمط ثابت.",
    tr: "Dosyaları sabit bir desene göre yeniden adlandırmak.",
  },

  "What makes a process a good automation candidate? Select all that apply.": {
    ar: "ما الذي يجعل عملية مرشّحة جيدة للأتمتة؟ اختر كل ما ينطبق.",
    tr: "Bir süreci iyi bir otomasyon adayı yapan nedir? Uygun olanların tümünü seçin.",
  },
  "It happens frequently": { ar: "تتكرر كثيرًا", tr: "Sık gerçekleşiyor olması" },
  "The rules are consistent and can be written down": {
    ar: "القواعد متسقة ويمكن تدوينها",
    tr: "Kuralların tutarlı olması ve yazıya dökülebilmesi",
  },
  "The inputs are already digital": { ar: "المدخلات رقمية بالفعل", tr: "Girdilerin hâlihazırda dijital olması" },
  "It is the most complex process in the department": {
    ar: "إنها أعقد عملية في القسم",
    tr: "Departmandaki en karmaşık süreç olması",
  },
  "You can clearly define what a correct output looks like": {
    ar: "يمكنك تعريف شكل المخرجات الصحيحة بوضوح",
    tr: "Doğru bir çıktının nasıl göründüğünü net tanımlayabilmeniz",
  },

  "You automate a weekly report. What must you also plan for?": {
    ar: "تُؤتمت تقريرًا أسبوعيًا. ما الذي يجب أن تخطّط له أيضًا؟",
    tr: "Haftalık bir raporu otomatikleştiriyorsunuz. Ayrıca neyi planlamalısınız?",
  },
  "Who notices when it breaks, and what happens when the source format changes.": {
    ar: "من يلاحظ عند تعطّله، وماذا يحدث عندما يتغيّر تنسيق المصدر.",
    tr: "Bozulduğunda kimin fark edeceğini ve kaynak biçimi değiştiğinde ne olacağını.",
  },
  "How to make it run faster.": { ar: "كيف تجعله يعمل أسرع.", tr: "Nasıl daha hızlı çalışacağını." },
  "How to add more charts.": { ar: "كيف تضيف مزيدًا من الرسوم البيانية.", tr: "Nasıl daha fazla grafik ekleneceğini." },
  "Nothing — automated processes maintain themselves.": {
    ar: "لا شيء — فالعمليات المؤتمتة تصون نفسها.",
    tr: "Hiçbir şey — otomatik süreçler kendi bakımını yapar.",
  },

  "A dashboard shows a defect rate rising sharply. Before escalating, what should you check?": {
    ar: "تُظهر لوحة معلومات ارتفاعًا حادًا في معدل العيوب. قبل التصعيد، ما الذي يجب التحقق منه؟",
    tr: "Bir gösterge panosu hata oranının keskin yükseldiğini gösteriyor. Yükseltmeden önce neyi kontrol etmelisiniz?",
  },
  "Whether inspection volume or method changed over the same period.": {
    ar: "ما إذا كان حجم الفحص أو أسلوبه قد تغيّر في الفترة نفسها.",
    tr: "Aynı dönemde muayene hacminin veya yönteminin değişip değişmediğini.",
  },
  "Whether the dashboard colours are correct.": {
    ar: "ما إذا كانت ألوان لوحة المعلومات صحيحة.",
    tr: "Pano renklerinin doğru olup olmadığını.",
  },
  "Whether other departments have seen the dashboard.": {
    ar: "ما إذا كانت أقسام أخرى قد اطّلعت على اللوحة.",
    tr: "Panoyu diğer departmanların görüp görmediğini.",
  },
  "Whether the chart type is appropriate.": {
    ar: "ما إذا كان نوع الرسم البياني مناسبًا.",
    tr: "Grafik türünün uygun olup olmadığını.",
  },

  // === Data & automation · advanced =========================================
  "You want to build a system that answers questions about your SOPs. What determines whether it works?": {
    ar: "تريد بناء نظام يجيب عن أسئلة حول إجراءات التشغيل القياسية لديك. ما الذي يحدّد نجاحه؟",
    tr: "SOP'larınızla ilgili soruları yanıtlayan bir sistem kurmak istiyorsunuz. Çalışıp çalışmayacağını ne belirler?",
  },
  "Whether the right sections of the right SOP are retrieved and given to the model.": {
    ar: "ما إذا كانت الأقسام الصحيحة من الإجراء الصحيح تُسترجَع وتُعطى للنموذج.",
    tr: "Doğru SOP'un doğru bölümlerinin getirilip modele verilip verilmediği.",
  },
  "Which model is used.": { ar: "أي نموذج يُستخدم.", tr: "Hangi modelin kullanıldığı." },
  "How the question is phrased by the user.": {
    ar: "كيف يصوغ المستخدم السؤال.",
    tr: "Sorunun kullanıcı tarafından nasıl ifade edildiği.",
  },
  "How many SOPs exist in total.": {
    ar: "كم عدد إجراءات التشغيل القياسية إجمالًا.",
    tr: "Toplamda kaç SOP olduğu.",
  },

  "A team proposes automated visual defect detection. What is the most realistic first step?": {
    ar: "يقترح فريق كشفًا آليًا بصريًا للعيوب. ما أكثر خطوة أولى واقعية؟",
    tr: "Bir ekip otomatik görsel hata tespiti öneriyor. En gerçekçi ilk adım nedir?",
  },
  "Start photographing and labelling defects consistently to build a dataset.": {
    ar: "البدء بتصوير العيوب ووسمها بشكل متسق لبناء مجموعة بيانات.",
    tr: "Bir veri kümesi oluşturmak için hataları tutarlı biçimde fotoğraflayıp etiketlemeye başlamak.",
  },
  "Buy a system and pilot it next month.": {
    ar: "شراء نظام وتجربته الشهر القادم.",
    tr: "Bir sistem satın alıp gelecek ay pilot uygulamak.",
  },
  "Hire a machine learning engineer.": {
    ar: "توظيف مهندس تعلّم آلة.",
    tr: "Bir makine öğrenmesi mühendisi işe almak.",
  },
  "Wait for the technology to mature.": {
    ar: "انتظار نضج التقنية.",
    tr: "Teknolojinin olgunlaşmasını beklemek.",
  },

  "An automation saves 4 hours a week but breaks twice a month, each time taking 3 hours to fix. What should you consider? Select all that apply.":
    {
      ar: "أتمتة توفّر 4 ساعات أسبوعيًا لكنها تتعطّل مرتين شهريًا، ويستغرق إصلاحها 3 ساعات في كل مرة. ما الذي ينبغي أخذه في الحسبان؟ اختر كل ما ينطبق.",
      tr: "Bir otomasyon haftada 4 saat kazandırıyor ama ayda iki kez bozuluyor ve her seferinde onarımı 3 saat sürüyor. Neleri dikkate almalısınız? Uygun olanların tümünü seçin.",
    },
  "The net saving after maintenance time": {
    ar: "صافي التوفير بعد خصم وقت الصيانة",
    tr: "Bakım süresi düşüldükten sonraki net kazanç",
  },
  "Why it breaks — usually an unstable input format": {
    ar: "لماذا تتعطّل — عادة بسبب تنسيق مدخلات غير مستقر",
    tr: "Neden bozulduğu — genelde kararsız bir girdi biçimi",
  },
  "Whether the upstream source can be stabilised instead": {
    ar: "ما إذا كان بالإمكان تثبيت المصدر الأعلى بدلًا من ذلك",
    tr: "Bunun yerine kaynak tarafın kararlı hâle getirilip getirilemeyeceği",
  },
  "Whether anyone owns it when its author is on leave": {
    ar: "ما إذا كان أحد مسؤولًا عنها عندما يكون كاتبها في إجازة",
    tr: "Yazarı izinliyken sahibinin olup olmadığı",
  },
  "Whether a larger AI model would break less often": {
    ar: "ما إذا كان نموذج ذكاء اصطناعي أكبر سيتعطّل أقل",
    tr: "Daha büyük bir yapay zekâ modelinin daha az bozulup bozulmayacağı",
  },

  "Which is the best description of when AI should replace a rule-based script?": {
    ar: "ما أفضل وصف للحالة التي ينبغي فيها أن يحل الذكاء الاصطناعي محل سكربت قائم على القواعد؟",
    tr: "Yapay zekânın kural tabanlı bir betiğin yerini ne zaman alması gerektiğini en iyi hangisi tarif eder?",
  },
  "Only when the input varies in ways rules cannot capture, such as free text or images.": {
    ar: "فقط عندما تتباين المدخلات بطرق لا تستطيع القواعد استيعابها، مثل النص الحر أو الصور.",
    tr: "Yalnızca girdi, serbest metin veya görüntü gibi kuralların yakalayamayacağı biçimde değiştiğinde.",
  },
  "Whenever a newer AI tool becomes available.": {
    ar: "كلما توفّرت أداة ذكاء اصطناعي أحدث.",
    tr: "Ne zaman daha yeni bir yapay zekâ aracı çıksa.",
  },
  "Whenever the script is longer than 50 lines.": {
    ar: "كلما تجاوز السكربت 50 سطرًا.",
    tr: "Betik 50 satırdan uzun olduğunda.",
  },
  "Whenever management asks for an AI project.": {
    ar: "كلما طلبت الإدارة مشروع ذكاء اصطناعي.",
    tr: "Yönetim bir yapay zekâ projesi istediğinde.",
  },
};
