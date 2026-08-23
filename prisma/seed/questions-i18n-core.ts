/**
 * Arabic and Turkish for the remaining core-bank questions (the easy set used
 * by the "AI at T&C" course assessment) and the whole technical bank.
 *
 * Merged into the same lookup as questions-i18n.ts and keyed identically, by
 * exact English string. Split out only for file size.
 */

export const CORE_EASY_I18N: Record<string, { ar: string; tr: string }> = {
  // === Fundamentals · easy ==================================================
  "A colleague says: 'We already have automation on the cutting line, so we already use AI.' What is the most accurate response?":
    {
      ar: "يقول زميل: «لدينا بالفعل أتمتة في خط القص، إذن نحن نستخدم الذكاء الاصطناعي». ما الرد الأدق؟",
      tr: "Bir meslektaşınız: 'Kesim hattında zaten otomasyon var, yani yapay zekâ kullanıyoruz' diyor. En doğru yanıt hangisi?",
    },
  "Automation follows fixed rules someone wrote; AI learns patterns from data and can handle inputs nobody anticipated.": {
    ar: "الأتمتة تتبع قواعد ثابتة كتبها شخص ما؛ أما الذكاء الاصطناعي فيتعلّم الأنماط من البيانات ويستطيع التعامل مع مدخلات لم يتوقّعها أحد.",
    tr: "Otomasyon, birinin yazdığı sabit kuralları izler; yapay zekâ ise veriden örüntü öğrenir ve kimsenin öngörmediği girdilerle başa çıkabilir.",
  },
  "They are the same thing — 'AI' is just the newer word for automation.": {
    ar: "هما الشيء نفسه — «الذكاء الاصطناعي» مجرد كلمة أحدث للأتمتة.",
    tr: "Aynı şeydir — 'yapay zekâ' otomasyonun daha yeni adıdır.",
  },
  "Automation is AI only when a machine is involved.": {
    ar: "الأتمتة تكون ذكاءً اصطناعيًا فقط عندما تتضمّن ماكينة.",
    tr: "Otomasyon yalnızca bir makine söz konusuysa yapay zekâdır.",
  },
  "AI is automation that runs faster.": {
    ar: "الذكاء الاصطناعي هو أتمتة تعمل بسرعة أكبر.",
    tr: "Yapay zekâ, daha hızlı çalışan otomasyondur.",
  },

  "What does a large language model actually do when it answers your question?": {
    ar: "ماذا يفعل النموذج اللغوي الكبير فعليًا عندما يجيب عن سؤالك؟",
    tr: "Büyük bir dil modeli sorunuzu yanıtlarken gerçekte ne yapar?",
  },
  "It predicts the most likely next words based on patterns it learned during training.": {
    ar: "يتنبّأ بالكلمات التالية الأرجح بناءً على أنماط تعلّمها أثناء التدريب.",
    tr: "Eğitim sırasında öğrendiği örüntülere dayanarak en olası sonraki kelimeleri tahmin eder.",
  },
  "It searches a verified database of facts and returns the matching entry.": {
    ar: "يبحث في قاعدة بيانات موثّقة من الحقائق ويعيد المدخل المطابق.",
    tr: "Doğrulanmış bir olgu veritabanında arama yapıp eşleşen kaydı döndürür.",
  },
  "It runs your question past a human reviewer before replying.": {
    ar: "يعرض سؤالك على مراجع بشري قبل الرد.",
    tr: "Yanıtlamadan önce sorunuzu bir insan denetçiye gösterir.",
  },
  "It reasons from a fixed set of logical rules programmed by engineers.": {
    ar: "يستنتج من مجموعة ثابتة من القواعد المنطقية برمجها مهندسون.",
    tr: "Mühendislerin programladığı sabit bir mantık kuralları kümesinden akıl yürütür.",
  },

  "You ask an AI assistant for the phone number of a supplier. It gives you a confident, correctly-formatted number. What should you assume?":
    {
      ar: "طلبت من مساعد ذكاء اصطناعي رقم هاتف مورّد، فأعطاك رقمًا واثقًا وبصيغة صحيحة. ماذا ينبغي أن تفترض؟",
      tr: "Bir yapay zekâ asistanından bir tedarikçinin telefon numarasını istediniz. Size emin ve doğru biçimlendirilmiş bir numara verdi. Ne varsaymalısınız?",
    },
  "It may be invented — verify it against a source before using it.": {
    ar: "قد يكون مُختلَقًا — تحقّق منه مقابل مصدر قبل استخدامه.",
    tr: "Uydurulmuş olabilir — kullanmadan önce bir kaynakla doğrulayın.",
  },
  "It is reliable, because the format is correct.": {
    ar: "موثوق، لأن الصيغة صحيحة.",
    tr: "Güvenilirdir, çünkü biçimi doğru.",
  },
  "It is reliable, because the assistant did not express doubt.": {
    ar: "موثوق، لأن المساعد لم يُبدِ أي شك.",
    tr: "Güvenilirdir, çünkü asistan şüphe belirtmedi.",
  },
  "It is reliable if the assistant is a paid version.": {
    ar: "موثوق إذا كان المساعد نسخة مدفوعة.",
    tr: "Asistan ücretli sürümse güvenilirdir.",
  },

  "A generative AI assistant has read T&C's internal policies and supplier contracts, so it can answer questions about them.":
    {
      ar: "قرأ مساعد الذكاء الاصطناعي التوليدي سياسات T&C الداخلية وعقود مورديها، لذا يمكنه الإجابة عن أسئلة بشأنها.",
      tr: "Üretken bir yapay zekâ asistanı T&C'nin iç politikalarını ve tedarikçi sözleşmelerini okumuştur, bu yüzden bunlarla ilgili soruları yanıtlayabilir.",
    },
  "False — it only knows what you give it in the conversation.": {
    ar: "خطأ — لا يعرف إلا ما تعطيه إياه داخل المحادثة.",
    tr: "Yanlış — yalnızca sohbette ona verdiğinizi bilir.",
  },
  "True — modern models are trained on company data.": {
    ar: "صح — النماذج الحديثة مدرَّبة على بيانات الشركات.",
    tr: "Doğru — modern modeller şirket verisiyle eğitilir.",
  },

  "Which of these is the clearest example of generative AI?": {
    ar: "أي مما يلي أوضح مثال على الذكاء الاصطناعي التوليدي؟",
    tr: "Bunlardan hangisi üretken yapay zekânın en net örneğidir?",
  },
  "A tool that drafts a supplier email from three bullet points you provide.": {
    ar: "أداة تصوغ بريدًا لمورّد انطلاقًا من ثلاث نقاط تقدّمها أنت.",
    tr: "Verdiğiniz üç maddeden tedarikçiye e-posta taslağı yazan bir araç.",
  },
  "A spreadsheet that sorts orders by delivery date.": {
    ar: "جدول بيانات يرتّب الطلبات حسب تاريخ التسليم.",
    tr: "Siparişleri teslim tarihine göre sıralayan bir tablo.",
  },
  "A machine that stops when a sensor reading passes a threshold.": {
    ar: "ماكينة تتوقف عندما تتجاوز قراءة حسّاس عتبة معيّنة.",
    tr: "Bir sensör okuması eşiği aştığında duran bir makine.",
  },
  "A dashboard that shows last month's defect rate.": {
    ar: "لوحة معلومات تعرض معدل عيوب الشهر الماضي.",
    tr: "Geçen ayın hata oranını gösteren bir pano.",
  },

  "Which of these tasks are current AI assistants generally reliable at? Select all that apply.": {
    ar: "في أي من هذه المهام يكون مساعدو الذكاء الاصطناعي الحاليون موثوقين عمومًا؟ اختر كل ما ينطبق.",
    tr: "Bugünkü yapay zekâ asistanları hangi görevlerde genel olarak güvenilirdir? Uygun olanların tümünü seçin.",
  },
  "Summarising a long document you paste in": {
    ar: "تلخيص مستند طويل تلصقه",
    tr: "Yapıştırdığınız uzun bir belgeyi özetlemek",
  },
  "Rewriting a rough paragraph in a clearer tone": {
    ar: "إعادة صياغة فقرة أولية بنبرة أوضح",
    tr: "Ham bir paragrafı daha net bir tonda yeniden yazmak",
  },
  "Adding up 200 rows of production figures accurately": {
    ar: "جمع 200 صف من أرقام الإنتاج بدقة",
    tr: "200 satırlık üretim rakamını doğru şekilde toplamak",
  },
  "Turning meeting notes into a structured action list": {
    ar: "تحويل ملاحظات اجتماع إلى قائمة إجراءات منظّمة",
    tr: "Toplantı notlarını yapılandırılmış bir aksiyon listesine çevirmek",
  },
  "Telling you your company's current inventory level": {
    ar: "إخبارك بمستوى مخزون شركتك الحالي",
    tr: "Şirketinizin güncel stok seviyesini söylemek",
  },

  "What is a 'hallucination' in the context of AI assistants?": {
    ar: "ما معنى «الهلوسة» في سياق مساعدي الذكاء الاصطناعي؟",
    tr: "Yapay zekâ asistanları bağlamında 'halüsinasyon' nedir?",
  },
  "A confident, well-written answer that is simply invented.": {
    ar: "إجابة واثقة ومصاغة جيدًا لكنها ببساطة مُختلَقة.",
    tr: "Kendinden emin, iyi yazılmış ama tamamen uydurma bir cevap.",
  },
  "The assistant refusing to answer a question.": {
    ar: "رفض المساعد الإجابة عن سؤال.",
    tr: "Asistanın bir soruyu yanıtlamayı reddetmesi.",
  },
  "The assistant giving a very long answer.": {
    ar: "إعطاء المساعد إجابة طويلة جدًا.",
    tr: "Asistanın çok uzun bir cevap vermesi.",
  },
  "A delay before the answer appears.": {
    ar: "تأخّر ظهور الإجابة.",
    tr: "Cevap görünmeden önceki gecikme.",
  },

  "Two colleagues type exactly the same question into the same AI assistant and get different answers. What does this tell you?":
    {
      ar: "يكتب زميلان السؤال نفسه حرفيًا في المساعد نفسه فيحصلان على إجابتين مختلفتين. ماذا يعني ذلك؟",
      tr: "İki meslektaş aynı yapay zekâ asistanına birebir aynı soruyu yazıyor ve farklı cevaplar alıyor. Bu size ne anlatır?",
    },
  "This is normal — but if the facts differ between runs, treat both as unverified.": {
    ar: "هذا طبيعي — لكن إذا اختلفت الحقائق بين المحاولتين فعامِل كلتيهما كغير مُتحقَّق منهما.",
    tr: "Bu normaldir — ama denemeler arasında olgular farklıysa ikisini de doğrulanmamış sayın.",
  },
  "One of them is using the tool incorrectly.": {
    ar: "أحدهما يستخدم الأداة بشكل خاطئ.",
    tr: "Biri aracı yanlış kullanıyordur.",
  },
  "The tool is broken and should be reported to IT.": {
    ar: "الأداة معطّلة وينبغي إبلاغ تقنية المعلومات.",
    tr: "Araç bozuktur ve BT'ye bildirilmelidir.",
  },
  "The second answer is always the more accurate one.": {
    ar: "الإجابة الثانية هي الأدق دائمًا.",
    tr: "İkinci cevap her zaman daha doğrudur.",
  },

  // === Workplace · easy =====================================================
  "You receive a 20-page supplier proposal and need to understand the major risks quickly. Which AI workflow is most appropriate?":
    {
      ar: "استلمت عرضًا من مورّد من 20 صفحة وتحتاج لفهم المخاطر الرئيسية بسرعة. أي أسلوب هو الأنسب؟",
      tr: "20 sayfalık bir tedarikçi teklifi aldınız ve ana riskleri hızla anlamanız gerekiyor. Hangi yapay zekâ akışı en uygundur?",
    },
  "Paste the proposal in, ask for a structured risk summary with clause references, then read the clauses it cites.": {
    ar: "الصق العرض، واطلب ملخص مخاطر منظّمًا مع الإشارة إلى البنود، ثم اقرأ البنود التي استشهد بها.",
    tr: "Teklifi yapıştırın, madde atıflarıyla yapılandırılmış bir risk özeti isteyin, sonra atıf yaptığı maddeleri okuyun.",
  },
  "Ask the assistant what risks usually appear in supplier proposals and use that list.": {
    ar: "اسأل المساعد عن المخاطر التي تظهر عادة في عروض الموردين واستخدم تلك القائمة.",
    tr: "Asistana tedarikçi tekliflerinde genelde hangi risklerin çıktığını sorup o listeyi kullanın.",
  },
  "Ask it to tell you whether to accept the proposal.": {
    ar: "اطلب منه إخبارك بقبول العرض من عدمه.",
    tr: "Teklifi kabul edip etmeyeceğinizi söylemesini isteyin.",
  },
  "Ask it to summarise the proposal in one sentence and act on that.": {
    ar: "اطلب تلخيص العرض في جملة واحدة والتصرّف بناءً عليها.",
    tr: "Teklifi tek cümlede özetlemesini isteyip ona göre hareket edin.",
  },

  "Which of these everyday tasks is the best first candidate for AI help?": {
    ar: "أي من هذه المهام اليومية هي أفضل مرشّح أول للاستعانة بالذكاء الاصطناعي؟",
    tr: "Bu günlük görevlerden hangisi yapay zekâ yardımı için en iyi ilk adaydır?",
  },
  "Drafting the weekly handover summary you write every Friday.": {
    ar: "صياغة ملخص التسليم الأسبوعي الذي تكتبه كل جمعة.",
    tr: "Her cuma yazdığınız haftalık devir özetinin taslağını hazırlamak.",
  },
  "Deciding which supplier to award a contract to.": {
    ar: "تحديد المورّد الذي يُرسى عليه العقد.",
    tr: "Sözleşmenin hangi tedarikçiye verileceğine karar vermek.",
  },
  "Approving an employee's leave request.": {
    ar: "اعتماد طلب إجازة موظف.",
    tr: "Bir çalışanın izin talebini onaylamak.",
  },
  "Calculating this month's payroll.": { ar: "حساب رواتب هذا الشهر.", tr: "Bu ayın bordrosunu hesaplamak." },

  "An AI assistant produces a draft email to a customer. What should happen next?": {
    ar: "أنتج مساعد ذكاء اصطناعي مسودة بريد إلى عميل. ماذا يجب أن يحدث بعد ذلك؟",
    tr: "Bir yapay zekâ asistanı müşteriye e-posta taslağı üretti. Sırada ne olmalı?",
  },
  "You read it, correct anything wrong, and take responsibility for what you send.": {
    ar: "تقرأه وتصحّح ما هو خاطئ وتتحمّل مسؤولية ما ترسله.",
    tr: "Okursunuz, yanlış olanı düzeltirsiniz ve gönderdiğinizin sorumluluğunu alırsınız.",
  },
  "Send it immediately — reviewing defeats the time saving.": {
    ar: "أرسله فورًا — فالمراجعة تُفقد التوفير في الوقت.",
    tr: "Hemen gönderin — incelemek zaman kazancını yok eder.",
  },
  "Forward it to IT for approval.": {
    ar: "أرسله إلى تقنية المعلومات للاعتماد.",
    tr: "Onay için BT'ye iletin.",
  },
  "Ask the AI whether the email is correct and trust its answer.": {
    ar: "اسأل الذكاء الاصطناعي إن كان البريد صحيحًا وثِق بإجابته.",
    tr: "Yapay zekâya e-postanın doğru olup olmadığını sorun ve cevabına güvenin.",
  },

  "Which of these would you expect AI to help with in a normal working week? Select all that apply.": {
    ar: "في أي مما يلي تتوقّع أن يساعدك الذكاء الاصطناعي خلال أسبوع عمل عادي؟ اختر كل ما ينطبق.",
    tr: "Normal bir çalışma haftasında yapay zekânın hangilerinde yardımcı olmasını beklersiniz? Uygun olanların tümünü seçin.",
  },
  "Turning rough meeting notes into structured minutes": {
    ar: "تحويل ملاحظات اجتماع أولية إلى محضر منظّم",
    tr: "Ham toplantı notlarını yapılandırılmış tutanağa çevirmek",
  },
  "Summarising a long policy into a one-page brief": {
    ar: "تلخيص سياسة طويلة في موجز من صفحة واحدة",
    tr: "Uzun bir politikayı tek sayfalık özete indirmek",
  },
  "Approving a purchase order": { ar: "اعتماد أمر شراء", tr: "Bir satın alma siparişini onaylamak" },
  "Drafting a first version of a job description": {
    ar: "صياغة نسخة أولى من وصف وظيفي",
    tr: "Bir görev tanımının ilk sürümünü yazmak",
  },
  "Explaining a technical document in simpler language": {
    ar: "شرح مستند تقني بلغة أبسط",
    tr: "Teknik bir belgeyi daha sade dille açıklamak",
  },

  "You need to write the same type of report every month. What is the most valuable thing to do after getting one good AI result?":
    {
      ar: "عليك كتابة النوع نفسه من التقارير كل شهر. ما أثمن ما تفعله بعد الحصول على نتيجة جيدة واحدة؟",
      tr: "Her ay aynı tür raporu yazmanız gerekiyor. İyi bir yapay zekâ sonucu aldıktan sonra yapılacak en değerli şey nedir?",
    },
  "Save the prompt as a template so next month takes minutes instead of hours.": {
    ar: "احفظ الأمر كقالب حتى يستغرق الشهر القادم دقائق بدل ساعات.",
    tr: "Promptu şablon olarak kaydedin ki gelecek ay saatler yerine dakikalar sürsün.",
  },
  "Delete the conversation to save space.": {
    ar: "احذف المحادثة لتوفير المساحة.",
    tr: "Yer kazanmak için sohbeti silin.",
  },
  "Email the output to your whole department.": {
    ar: "أرسل المخرجات بالبريد إلى قسمك بالكامل.",
    tr: "Çıktıyı tüm departmanınıza e-postayla gönderin.",
  },
  "Nothing — start fresh each month for better results.": {
    ar: "لا شيء — ابدأ من جديد كل شهر للحصول على نتائج أفضل.",
    tr: "Hiçbir şey — daha iyi sonuç için her ay sıfırdan başlayın.",
  },

  "If an AI assistant produces a report that turns out to contain a serious error, responsibility sits with the person who used and circulated it.":
    {
      ar: "إذا أنتج مساعد ذكاء اصطناعي تقريرًا تبيّن أنه يحتوي على خطأ جسيم، فالمسؤولية تقع على من استخدمه وعمّمه.",
      tr: "Bir yapay zekâ asistanının ürettiği raporda ciddi bir hata çıkarsa, sorumluluk onu kullanan ve dağıtan kişidedir.",
    },
  True: { ar: "صح", tr: "Doğru" },
  "False — responsibility sits with the tool provider.": {
    ar: "خطأ — المسؤولية تقع على مزوّد الأداة.",
    tr: "Yanlış — sorumluluk araç sağlayıcısındadır.",
  },

  "Your first AI answer is too long and too formal. What is the most efficient next step?": {
    ar: "إجابتك الأولى من الذكاء الاصطناعي طويلة جدًا ورسمية جدًا. ما أكفأ خطوة تالية؟",
    tr: "İlk yapay zekâ cevabınız çok uzun ve çok resmî. En verimli sonraki adım nedir?",
  },
  "Reply in the same conversation: 'Too long and too formal — cut to 150 words for a production supervisor.'": {
    ar: "الرد في المحادثة نفسها: «طويل ورسمي أكثر من اللازم — اختصره إلى 150 كلمة لمشرف إنتاج.»",
    tr: "Aynı sohbette yanıtlayın: 'Çok uzun ve çok resmî — bir üretim şefi için 150 kelimeye indir.'",
  },
  "Start a completely new conversation with a longer prompt.": {
    ar: "بدء محادثة جديدة تمامًا بأمر أطول.",
    tr: "Daha uzun bir promptla tamamen yeni bir sohbet başlatmak.",
  },
  "Accept it and edit the whole thing manually.": {
    ar: "قبولها وتحرير كل شيء يدويًا.",
    tr: "Kabul edip her şeyi elle düzenlemek.",
  },
  "Try a different AI tool.": { ar: "تجربة أداة ذكاء اصطناعي مختلفة.", tr: "Farklı bir yapay zekâ aracı denemek." },

  // === Prompting · easy =====================================================
  "Which of these prompts will produce the more useful answer?": {
    ar: "أي من هذه الأوامر سينتج إجابة أكثر فائدة؟",
    tr: "Bu promptlardan hangisi daha yararlı bir cevap üretir?",
  },
  "'I am a production supervisor. Write a 120-word update for the plant manager on yesterday's downtime, leading with anything needing a decision today, then one line per line.'":
    {
      ar: "«أنا مشرف إنتاج. اكتب تحديثًا من 120 كلمة لمدير المصنع عن توقفات الأمس، تبدأ بما يحتاج قرارًا اليوم، ثم سطر واحد لكل خط.»",
      tr: "'Ben bir üretim şefiyim. Fabrika müdürü için dünkü duruşlar hakkında 120 kelimelik bir güncelleme yaz; bugün karar gerektiren konularla başla, sonra her hat için bir satır.'",
    },
  "'Write an update about production.'": { ar: "«اكتب تحديثًا عن الإنتاج.»", tr: "'Üretim hakkında bir güncelleme yaz.'" },
  "'Write a professional and detailed production update. Be thorough.'": {
    ar: "«اكتب تحديث إنتاج احترافيًا ومفصّلًا. كن شاملًا.»",
    tr: "'Profesyonel ve ayrıntılı bir üretim güncellemesi yaz. Kapsamlı ol.'",
  },
  "'Production update please, make it good.'": {
    ar: "«تحديث إنتاج من فضلك، واجعله جيدًا.»",
    tr: "'Üretim güncellemesi lütfen, iyi olsun.'",
  },

  "Which elements belong in a well-structured work prompt? Select all that apply.": {
    ar: "أي العناصر تنتمي إلى أمر عمل جيد البنية؟ اختر كل ما ينطبق.",
    tr: "İyi yapılandırılmış bir iş promptunda hangi ögeler bulunur? Uygun olanların tümünü seçin.",
  },
  "Context — who you are and what the situation is": {
    ar: "السياق — من أنت وما هو الموقف",
    tr: "Bağlam — kim olduğunuz ve durumun ne olduğu",
  },
  "Objective — exactly what you want produced": {
    ar: "الهدف — ما تريد إنتاجه بالضبط",
    tr: "Hedef — tam olarak neyin üretilmesini istediğiniz",
  },
  "Constraints — length, audience, tone, criteria": {
    ar: "القيود — الطول والجمهور والنبرة والمعايير",
    tr: "Kısıtlar — uzunluk, hedef kitle, ton, kriterler",
  },
  "Output shape — the structure you want back": {
    ar: "شكل المخرجات — البنية التي تريد استلامها",
    tr: "Çıktı biçimi — geri istediğiniz yapı",
  },
  "Politeness — saying please and thank you": {
    ar: "اللباقة — قول من فضلك وشكرًا",
    tr: "Nezaket — lütfen ve teşekkürler demek",
  },
  "Verification — asking it to flag assumptions": {
    ar: "التحقق — مطالبته بالإشارة إلى الافتراضات",
    tr: "Doğrulama — varsayımları işaretlemesini istemek",
  },

  "The answer you got is 80% right. What is the best next move?": {
    ar: "الإجابة التي حصلت عليها صحيحة بنسبة 80٪. ما أفضل خطوة تالية؟",
    tr: "Aldığınız cevap %80 doğru. En iyi sonraki hamle nedir?",
  },
  "Tell it specifically what to change, in the same conversation.": {
    ar: "أخبره تحديدًا بما يجب تغييره، في المحادثة نفسها.",
    tr: "Aynı sohbette, tam olarak neyi değiştireceğini söyleyin.",
  },
  "Start a brand new conversation with a longer prompt.": {
    ar: "ابدأ محادثة جديدة تمامًا بأمر أطول.",
    tr: "Daha uzun bir promptla yepyeni bir sohbet başlatın.",
  },
  "Accept it — 80% is as good as AI gets.": {
    ar: "اقبلها — 80٪ هي أقصى ما يصل إليه الذكاء الاصطناعي.",
    tr: "Kabul edin — %80 yapay zekânın ulaşabileceği en iyi seviyedir.",
  },
  "Ask it to try again without saying what was wrong.": {
    ar: "اطلب منه المحاولة مجددًا دون أن تذكر الخطأ.",
    tr: "Neyin yanlış olduğunu söylemeden tekrar denemesini isteyin.",
  },

  "Why is it useful to tell the AI who the audience is?": {
    ar: "لماذا من المفيد إخبار الذكاء الاصطناعي بمن هو الجمهور؟",
    tr: "Yapay zekâya hedef kitlenin kim olduğunu söylemek neden yararlıdır?",
  },
  "It changes the vocabulary, length and assumed knowledge of the answer.": {
    ar: "يغيّر المفردات وطول الإجابة والمعرفة المفترضة فيها.",
    tr: "Cevabın kelime dağarcığını, uzunluğunu ve varsaydığı bilgi düzeyini değiştirir.",
  },
  "It makes the AI respond faster.": {
    ar: "يجعل الذكاء الاصطناعي يرد أسرع.",
    tr: "Yapay zekânın daha hızlı yanıt vermesini sağlar.",
  },
  "It is required by most AI tools.": {
    ar: "معظم أدوات الذكاء الاصطناعي تشترطه.",
    tr: "Çoğu yapay zekâ aracı bunu zorunlu tutar.",
  },
  "It reduces the cost of the request.": { ar: "يقلّل تكلفة الطلب.", tr: "İsteğin maliyetini düşürür." },

  "Adding 'be accurate and do not make anything up' to a prompt reliably prevents hallucinations.": {
    ar: "إضافة «كن دقيقًا ولا تختلق شيئًا» إلى الأمر تمنع الهلوسة بشكل موثوق.",
    tr: "Prompta 'doğru ol ve hiçbir şey uydurma' eklemek halüsinasyonları güvenilir biçimde önler.",
  },
  "False — supplying the source and verifying the answer is what works.": {
    ar: "خطأ — ما ينفع هو تزويده بالمصدر والتحقق من الإجابة.",
    tr: "Yanlış — işe yarayan şey kaynağı vermek ve cevabı doğrulamaktır.",
  },
  "True — the model will comply with the instruction.": {
    ar: "صح — سيلتزم النموذج بالتعليمات.",
    tr: "Doğru — model talimata uyar.",
  },

  "Which instruction best controls the shape of the output?": {
    ar: "أي تعليمات تتحكم في شكل المخرجات على أفضل وجه؟",
    tr: "Çıktının biçimini en iyi hangi talimat kontrol eder?",
  },
  "'Return four sections with a maximum of three bullets each, then a one-line recommendation.'": {
    ar: "«أعد أربعة أقسام بحد أقصى ثلاث نقاط لكل قسم، ثم توصية من سطر واحد.»",
    tr: "'Her biri en fazla üç maddeden oluşan dört bölüm ver, sonra tek satırlık bir öneri.'",
  },
  "'Make it well organised.'": { ar: "«اجعله منظّمًا جيدًا.»", tr: "'İyi düzenlenmiş olsun.'" },
  "'Format it nicely.'": { ar: "«نسّقه بشكل جميل.»", tr: "'Güzel biçimlendir.'" },
  "'Use professional formatting.'": { ar: "«استخدم تنسيقًا احترافيًا.»", tr: "'Profesyonel biçimlendirme kullan.'" },

  "You want a shorter answer. Which is clearest?": {
    ar: "تريد إجابة أقصر. أيها الأوضح؟",
    tr: "Daha kısa bir cevap istiyorsunuz. Hangisi en nettir?",
  },
  "'Maximum 150 words.'": { ar: "«بحد أقصى 150 كلمة.»", tr: "'En fazla 150 kelime.'" },
  "'Keep it brief.'": { ar: "«اجعله موجزًا.»", tr: "'Kısa tut.'" },
  "'Not too long please.'": { ar: "«ليس طويلًا جدًا من فضلك.»", tr: "'Çok uzun olmasın lütfen.'" },
  "'Be concise and to the point.'": { ar: "«كن مختصرًا ومباشرًا.»", tr: "'Özlü ve konuya odaklı ol.'" },

  // === Data & automation · easy =============================================
  "Which of these is structured data?": { ar: "أي مما يلي بيانات مهيكلة؟", tr: "Bunlardan hangisi yapılandırılmış veridir?" },
  "A spreadsheet of orders with columns for date, customer, quantity and value.": {
    ar: "جدول بيانات للطلبات بأعمدة للتاريخ والعميل والكمية والقيمة.",
    tr: "Tarih, müşteri, miktar ve tutar sütunları olan bir sipariş tablosu.",
  },
  "A folder of scanned inspection photographs.": {
    ar: "مجلد يحوي صور فحص ممسوحة ضوئيًا.",
    tr: "Taranmış muayene fotoğraflarından oluşan bir klasör.",
  },
  "Six months of email correspondence with a supplier.": {
    ar: "ستة أشهر من المراسلات بالبريد مع مورّد.",
    tr: "Bir tedarikçiyle altı aylık e-posta yazışması.",
  },
  "Handwritten notes from a shift handover.": {
    ar: "ملاحظات مكتوبة بخط اليد من تسليم وردية.",
    tr: "Vardiya devrinden elle yazılmış notlar.",
  },

  "A task is done the same way every week with the same steps and no judgement calls. What does that suggest?": {
    ar: "مهمة تُنجَز بالطريقة نفسها كل أسبوع بالخطوات نفسها وبدون أحكام تقديرية. ماذا يوحي ذلك؟",
    tr: "Bir görev her hafta aynı adımlarla, takdir gerektirmeden aynı şekilde yapılıyor. Bu ne anlama gelir?",
  },
  "It is a strong automation candidate, and may not need AI at all.": {
    ar: "إنها مرشّح قوي للأتمتة، وقد لا تحتاج ذكاءً اصطناعيًا على الإطلاق.",
    tr: "Güçlü bir otomasyon adayıdır ve yapay zekâya hiç ihtiyaç duymayabilir.",
  },
  "It should be left alone because it already works.": {
    ar: "ينبغي تركها كما هي لأنها تعمل بالفعل.",
    tr: "Zaten çalıştığı için olduğu gibi bırakılmalıdır.",
  },
  "It needs a machine learning model.": {
    ar: "تحتاج نموذج تعلّم آلة.",
    tr: "Bir makine öğrenmesi modeline ihtiyaç duyar.",
  },
  "It should be done more often.": { ar: "ينبغي إنجازها بوتيرة أكبر.", tr: "Daha sık yapılmalıdır." },

  "Which of these are unstructured data? Select all that apply.": {
    ar: "أي مما يلي بيانات غير مهيكلة؟ اختر كل ما ينطبق.",
    tr: "Bunlardan hangileri yapılandırılmamış veridir? Uygun olanların tümünü seçin.",
  },
  "Free-text defect descriptions written by inspectors": {
    ar: "أوصاف عيوب بنص حر كتبها مفتشون",
    tr: "Denetçilerin yazdığı serbest metinli hata açıklamaları",
  },
  "Photographs of fabric faults": { ar: "صور فوتوغرافية لعيوب الأقمشة", tr: "Kumaş hatalarının fotoğrafları" },
  "A table of monthly production quantities": {
    ar: "جدول بكميات الإنتاج الشهرية",
    tr: "Aylık üretim miktarları tablosu",
  },
  "Recorded customer complaint calls": {
    ar: "مكالمات شكاوى عملاء مسجّلة",
    tr: "Kaydedilmiş müşteri şikâyet çağrıları",
  },
  "Supplier contract documents": { ar: "مستندات عقود الموردين", tr: "Tedarikçi sözleşme belgeleri" },

  "Why is inconsistent data entry a problem for analysis?": {
    ar: "لماذا يمثّل إدخال البيانات غير المتسق مشكلة للتحليل؟",
    tr: "Tutarsız veri girişi analiz için neden sorundur?",
  },
  "The same real issue splits across several categories and never appears as significant.": {
    ar: "تنقسم المشكلة الحقيقية نفسها بين عدة فئات فلا تبدو أبدًا ذات أهمية.",
    tr: "Aynı gerçek sorun birkaç kategoriye bölünür ve hiçbir zaman önemli görünmez.",
  },
  "It makes files larger.": { ar: "يجعل الملفات أكبر حجمًا.", tr: "Dosyaları büyütür." },
  "It slows down the computer.": { ar: "يبطئ الحاسوب.", tr: "Bilgisayarı yavaşlatır." },
  "It is only a problem if there is a lot of data.": {
    ar: "لا يمثّل مشكلة إلا إذا كانت البيانات كثيرة.",
    tr: "Yalnızca çok fazla veri varsa sorundur.",
  },

  "You want to know which defect type costs the most. What do you need first?": {
    ar: "تريد معرفة نوع العيب الأكثر تكلفة. ما الذي تحتاجه أولًا؟",
    tr: "Hangi hata türünün en pahalıya mal olduğunu bilmek istiyorsunuz. Önce neye ihtiyacınız var?",
  },
  "Consistently categorised defect records with a cost attached.": {
    ar: "سجلات عيوب مصنّفة بشكل متسق ومرتبطة بتكلفة.",
    tr: "Maliyet bilgisi eklenmiş, tutarlı biçimde kategorilendirilmiş hata kayıtları.",
  },
  "A machine learning model.": { ar: "نموذج تعلّم آلة.", tr: "Bir makine öğrenmesi modeli." },
  "More data of any kind.": { ar: "مزيد من البيانات من أي نوع.", tr: "Her türden daha fazla veri." },
  "A dashboard tool.": { ar: "أداة لوحات معلومات.", tr: "Bir gösterge panosu aracı." },

  // === Technical bank · easy ================================================
  "Where should an LLM provider API key live in a web application?": {
    ar: "أين ينبغي أن يوجد مفتاح واجهة مزوّد النموذج اللغوي في تطبيق ويب؟",
    tr: "Bir web uygulamasında LLM sağlayıcısının API anahtarı nerede durmalıdır?",
  },
  "In a server-side environment variable, never in the client bundle.": {
    ar: "في متغيّر بيئة على الخادم، وليس في حزمة العميل إطلاقًا.",
    tr: "Sunucu tarafında bir ortam değişkeninde; asla istemci paketinde değil.",
  },
  "In a JavaScript constant, minified so it is hard to read.": {
    ar: "في ثابت JavaScript مُصغَّر ليصعب قراءته.",
    tr: "Okunması zor olsun diye küçültülmüş bir JavaScript sabitinde.",
  },
  "In the database, encrypted at rest.": {
    ar: "في قاعدة البيانات مشفّرًا أثناء التخزين.",
    tr: "Veritabanında, beklerken şifrelenmiş olarak.",
  },
  "In a config file committed to the repository.": {
    ar: "في ملف إعدادات مُودَع في المستودع.",
    tr: "Depoya işlenmiş bir yapılandırma dosyasında.",
  },

  "What is an embedding?": { ar: "ما هو التمثيل المتجهي (embedding)؟", tr: "Embedding nedir?" },
  "A numeric vector representing meaning, so similar texts are close together.": {
    ar: "متجه رقمي يمثّل المعنى، بحيث تكون النصوص المتشابهة قريبة من بعضها.",
    tr: "Anlamı temsil eden sayısal bir vektör; benzer metinler birbirine yakın konumlanır.",
  },
  "A compressed copy of a document.": { ar: "نسخة مضغوطة من مستند.", tr: "Bir belgenin sıkıştırılmış kopyası." },
  "The model's internal memory of a conversation.": {
    ar: "ذاكرة النموذج الداخلية للمحادثة.",
    tr: "Modelin bir sohbete dair iç hafızası.",
  },
  "A cached API response.": { ar: "استجابة واجهة برمجية مخزّنة مؤقتًا.", tr: "Önbelleğe alınmış bir API yanıtı." },

  "Your API call returns HTTP 429. What does that mean and what should the client do?": {
    ar: "أعاد استدعاء الواجهة البرمجية رمز HTTP 429. ماذا يعني ذلك وماذا ينبغي أن يفعل العميل؟",
    tr: "API çağrınız HTTP 429 döndürdü. Bu ne anlama gelir ve istemci ne yapmalıdır?",
  },
  "Rate limited — retry with exponential backoff, honouring Retry-After.": {
    ar: "تجاوز حد المعدل — أعد المحاولة بتراجع أُسّي مع احترام Retry-After.",
    tr: "Hız sınırı aşıldı — Retry-After başlığına uyarak üstel geri çekilmeyle yeniden deneyin.",
  },
  "Invalid API key — prompt the user to re-authenticate.": {
    ar: "مفتاح واجهة غير صالح — اطلب من المستخدم إعادة المصادقة.",
    tr: "Geçersiz API anahtarı — kullanıcıdan yeniden kimlik doğrulaması isteyin.",
  },
  "The model refused the request — rewrite the prompt.": {
    ar: "رفض النموذج الطلب — أعد صياغة الأمر.",
    tr: "Model isteği reddetti — promptu yeniden yazın.",
  },
  "The response was too long — reduce max_tokens.": {
    ar: "كانت الاستجابة طويلة جدًا — قلّل max_tokens.",
    tr: "Yanıt çok uzundu — max_tokens değerini düşürün.",
  },

  "An AI assistant suggests a library function that does not exist in the documentation. What is happening?": {
    ar: "يقترح مساعد ذكاء اصطناعي دالة مكتبة غير موجودة في التوثيق. ما الذي يحدث؟",
    tr: "Bir yapay zekâ asistanı, dokümantasyonda bulunmayan bir kütüphane fonksiyonu öneriyor. Ne oluyor?",
  },
  "A hallucinated API — verify every generated call against the real documentation.": {
    ar: "واجهة برمجية مُختلَقة — تحقّق من كل استدعاء مُولَّد مقابل التوثيق الحقيقي.",
    tr: "Halüsinasyon bir API — üretilen her çağrıyı gerçek dokümantasyonla doğrulayın.",
  },
  "The library version installed is out of date.": {
    ar: "نسخة المكتبة المثبّتة قديمة.",
    tr: "Kurulu kütüphane sürümü eski.",
  },
  "The function is undocumented but exists.": {
    ar: "الدالة موجودة لكنها غير موثّقة.",
    tr: "Fonksiyon belgelenmemiş ama mevcut.",
  },
  "The assistant is using a different programming language.": {
    ar: "المساعد يستخدم لغة برمجة مختلفة.",
    tr: "Asistan farklı bir programlama dili kullanıyor.",
  },

  // === Technical bank · medium ==============================================
  "You ask a model to return JSON and it occasionally returns prose instead. What is the correct engineering response?": {
    ar: "تطلب من نموذج إعادة JSON فيعيد أحيانًا نصًا عاديًا. ما الاستجابة الهندسية الصحيحة؟",
    tr: "Modelden JSON döndürmesini istiyorsunuz ama bazen düz metin dönüyor. Doğru mühendislik yanıtı nedir?",
  },
  "Validate against a schema and handle the failure case explicitly.": {
    ar: "التحقق مقابل مخطّط والتعامل مع حالة الفشل صراحة.",
    tr: "Bir şemaya göre doğrulayın ve hata durumunu açıkça ele alın.",
  },
  "Add 'ONLY RETURN JSON' in capitals and assume it complies.": {
    ar: "إضافة «أعد JSON فقط» بأحرف كبيرة وافتراض الالتزام.",
    tr: "Büyük harfle 'YALNIZCA JSON DÖNDÜR' ekleyip uyacağını varsaymak.",
  },
  "Parse with a regular expression and hope for the best.": {
    ar: "التحليل بتعبير نمطي والأمل في الأفضل.",
    tr: "Düzenli ifadeyle ayrıştırıp en iyisini ummak.",
  },
  "Retry indefinitely until valid JSON arrives.": {
    ar: "إعادة المحاولة إلى ما لا نهاية حتى يصل JSON صالح.",
    tr: "Geçerli JSON gelene kadar sonsuza dek yeniden denemek.",
  },

  "In a RAG system, answers are frequently wrong even though the documents contain the right information. Where do you look first?":
    {
      ar: "في نظام RAG، الإجابات خاطئة كثيرًا رغم أن المستندات تحتوي على المعلومة الصحيحة. أين تبحث أولًا؟",
      tr: "Bir RAG sisteminde, belgeler doğru bilgiyi içerdiği hâlde cevaplar sık sık yanlış. Önce nereye bakarsınız?",
    },
  "Retrieval — chunking strategy and whether the right passages are being returned.": {
    ar: "الاسترجاع — استراتيجية التقطيع وما إذا كانت المقاطع الصحيحة تُعاد فعلًا.",
    tr: "Getirme katmanı — parçalama stratejisi ve doğru pasajların dönüp dönmediği.",
  },
  "The model — upgrade to a larger one.": {
    ar: "النموذج — الترقية إلى نموذج أكبر.",
    tr: "Model — daha büyüğüne yükseltmek.",
  },
  "The system prompt — make it more emphatic.": {
    ar: "أمر النظام — جعله أكثر تشديدًا.",
    tr: "Sistem promptu — daha vurgulu hâle getirmek.",
  },
  "The temperature setting.": { ar: "إعداد درجة العشوائية (temperature).", tr: "Temperature ayarı." },

  "Which are genuine security risks specific to LLM applications? Select all that apply.": {
    ar: "أي المخاطر الأمنية حقيقية وخاصة بتطبيقات النماذج اللغوية؟ اختر كل ما ينطبق.",
    tr: "Hangileri LLM uygulamalarına özgü gerçek güvenlik riskleridir? Uygun olanların tümünü seçin.",
  },
  "Prompt injection via untrusted retrieved content": {
    ar: "حقن الأوامر عبر محتوى مسترجَع غير موثوق",
    tr: "Güvenilmeyen getirilmiş içerik üzerinden prompt enjeksiyonu",
  },
  "Excessive agency — giving the model write access it does not need": {
    ar: "صلاحية مفرطة — منح النموذج صلاحية كتابة لا يحتاجها",
    tr: "Aşırı yetki — modele ihtiyacı olmayan yazma erişimi vermek",
  },
  "Insecure output handling — rendering model output as HTML": {
    ar: "معالجة غير آمنة للمخرجات — عرض مخرجات النموذج كـ HTML",
    tr: "Güvensiz çıktı işleme — model çıktısını HTML olarak render etmek",
  },
  "Retrieving documents the requesting user is not permitted to see": {
    ar: "استرجاع مستندات لا يُسمح للمستخدم الطالب برؤيتها",
    tr: "İsteği yapan kullanıcının görmeye yetkili olmadığı belgeleri getirmek",
  },
  "The model consuming too much disk space": {
    ar: "استهلاك النموذج مساحة قرص كبيرة جدًا",
    tr: "Modelin çok fazla disk alanı tüketmesi",
  },

  "What does 'temperature' control in a model API call?": {
    ar: "ماذا تتحكم فيه «temperature» في استدعاء واجهة النموذج؟",
    tr: "Bir model API çağrısında 'temperature' neyi kontrol eder?",
  },
  "Randomness in token selection — lower is more repeatable, not more accurate.": {
    ar: "العشوائية في اختيار الرموز — القيمة الأقل أكثر قابلية للتكرار، لا أكثر دقة.",
    tr: "Token seçimindeki rastgeleliği — düşük değer daha tekrarlanabilirdir, daha doğru değil.",
  },
  "How factually accurate the answer is.": { ar: "مدى دقة الإجابة واقعيًا.", tr: "Cevabın olgusal doğruluğunu." },
  "How long the answer will be.": { ar: "طول الإجابة.", tr: "Cevabın ne kadar uzun olacağını." },
  "How fast the model responds.": { ar: "سرعة استجابة النموذج.", tr: "Modelin ne kadar hızlı yanıt verdiğini." },

  "You need to process a 200-page document that exceeds the model's context window. What is the standard approach?": {
    ar: "تحتاج معالجة مستند من 200 صفحة يتجاوز نافذة سياق النموذج. ما الأسلوب المعتاد؟",
    tr: "Modelin bağlam penceresini aşan 200 sayfalık bir belgeyi işlemeniz gerekiyor. Standart yaklaşım nedir?",
  },
  "Chunk it, process or retrieve the relevant chunks, then combine the results.": {
    ar: "قسّمه إلى مقاطع، وعالج أو استرجع المقاطع ذات الصلة، ثم ادمج النتائج.",
    tr: "Parçalara ayırın, ilgili parçaları işleyin veya getirin, sonra sonuçları birleştirin.",
  },
  "Truncate it to fit and accept the loss.": {
    ar: "اقتطعه ليناسب الحجم واقبل بالفقد.",
    tr: "Sığacak şekilde kesin ve kaybı kabul edin.",
  },
  "Compress the text by removing spaces.": {
    ar: "اضغط النص بحذف المسافات.",
    tr: "Boşlukları kaldırarak metni sıkıştırın.",
  },
  "Send it anyway — the API will handle it.": {
    ar: "أرسله على أي حال — ستتعامل الواجهة معه.",
    tr: "Yine de gönderin — API halleder.",
  },

  "Which SQL pattern should you reject in AI-generated code review?": {
    ar: "أي نمط SQL ينبغي رفضه عند مراجعة كود ولّده الذكاء الاصطناعي؟",
    tr: "Yapay zekânın ürettiği kodu incelerken hangi SQL kalıbını reddetmelisiniz?",
  },
  "Building the query by concatenating user input into a string.": {
    ar: "بناء الاستعلام بدمج مدخلات المستخدم داخل نص.",
    tr: "Sorguyu, kullanıcı girdisini bir dizeye ekleyerek oluşturmak.",
  },
  "Using a parameterised query with bound values.": {
    ar: "استخدام استعلام معلَّم بقيم مربوطة.",
    tr: "Bağlı değerlerle parametreli sorgu kullanmak.",
  },
  "Using an ORM's query builder.": {
    ar: "استخدام منشئ الاستعلامات في أداة ORM.",
    tr: "Bir ORM'in sorgu oluşturucusunu kullanmak.",
  },
  "Using a prepared statement.": { ar: "استخدام عبارة مُجهَّزة مسبقًا.", tr: "Hazırlanmış ifade kullanmak." },

  // === Technical bank · advanced ============================================
  "An agent has tools for reading tickets, querying a database and sending emails. What is the minimum safe design?": {
    ar: "لدى وكيل أدوات لقراءة التذاكر والاستعلام من قاعدة بيانات وإرسال رسائل بريد. ما الحد الأدنى للتصميم الآمن؟",
    tr: "Bir ajanın talep okuma, veritabanı sorgulama ve e-posta gönderme araçları var. Asgari güvenli tasarım nedir?",
  },
  "Reads can run autonomously; sending requires human confirmation, with full logging and hard iteration limits.": {
    ar: "يمكن أن تعمل عمليات القراءة ذاتيًا؛ أما الإرسال فيتطلب تأكيدًا بشريًا، مع تسجيل كامل وحدود صارمة للتكرار.",
    tr: "Okuma işlemleri özerk çalışabilir; gönderim insan onayı gerektirir, tam kayıt ve kesin yineleme sınırlarıyla.",
  },
  "Allow all three autonomously but log everything.": {
    ar: "السماح بالثلاثة ذاتيًا مع تسجيل كل شيء.",
    tr: "Üçüne de özerk izin vermek ama her şeyi kaydetmek.",
  },
  "Allow all three but limit it to 100 iterations.": {
    ar: "السماح بالثلاثة مع تحديد 100 تكرار.",
    tr: "Üçüne de izin vermek ama 100 yinelemeyle sınırlamak.",
  },
  "Allow all three and review the logs weekly.": {
    ar: "السماح بالثلاثة ومراجعة السجلات أسبوعيًا.",
    tr: "Üçüne de izin verip kayıtları haftalık incelemek.",
  },

  "How should you evaluate whether a prompt change improved your AI feature?": {
    ar: "كيف ينبغي تقييم ما إذا كان تغيير الأمر قد حسّن ميزتك المعتمدة على الذكاء الاصطناعي؟",
    tr: "Bir prompt değişikliğinin yapay zekâ özelliğinizi iyileştirip iyileştirmediğini nasıl değerlendirmelisiniz?",
  },
  "Re-run a fixed test set of real cases with known-good answers and compare results.": {
    ar: "أعد تشغيل مجموعة اختبار ثابتة من حالات حقيقية بإجابات صحيحة معروفة وقارن النتائج.",
    tr: "Doğruluğu bilinen cevaplara sahip gerçek vakalardan oluşan sabit bir test kümesini yeniden çalıştırıp sonuçları karşılaştırın.",
  },
  "Try a few examples by hand and see if they look better.": {
    ar: "جرّب بضعة أمثلة يدويًا وانظر إن كانت تبدو أفضل.",
    tr: "Birkaç örneği elle deneyip daha iyi görünüp görünmediklerine bakın.",
  },
  "Ask the model to compare the two prompts.": {
    ar: "اطلب من النموذج مقارنة الأمرين.",
    tr: "Modelden iki promptu karşılaştırmasını isteyin.",
  },
  "Ship it and wait for user complaints.": {
    ar: "أطلقه وانتظر شكاوى المستخدمين.",
    tr: "Yayına alın ve kullanıcı şikâyetlerini bekleyin.",
  },

  "Which mitigations reduce prompt-injection risk in a document-reading assistant? Select all that apply.": {
    ar: "أي الإجراءات تقلّل خطر حقن الأوامر في مساعد يقرأ المستندات؟ اختر كل ما ينطبق.",
    tr: "Belge okuyan bir asistanda prompt enjeksiyonu riskini hangi önlemler azaltır? Uygun olanların tümünü seçin.",
  },
  "Treat all retrieved content as untrusted data, never as instructions": {
    ar: "معاملة كل المحتوى المسترجَع كبيانات غير موثوقة، لا كتعليمات أبدًا",
    tr: "Getirilen tüm içeriği güvenilmez veri saymak, asla talimat saymamak",
  },
  "Require human confirmation before any consequential action": {
    ar: "اشتراط تأكيد بشري قبل أي إجراء ذي أثر",
    tr: "Sonuç doğuran her eylemden önce insan onayı şartı",
  },
  "Give the model the smallest possible tool set": {
    ar: "منح النموذج أصغر مجموعة أدوات ممكنة",
    tr: "Modele mümkün olan en küçük araç setini vermek",
  },
  "Keep system instructions in a separate channel from user content": {
    ar: "إبقاء تعليمات النظام في قناة منفصلة عن محتوى المستخدم",
    tr: "Sistem talimatlarını kullanıcı içeriğinden ayrı bir kanalda tutmak",
  },
  "Write a longer, firmer system prompt telling it to ignore injected instructions": {
    ar: "كتابة أمر نظام أطول وأكثر حزمًا يطلب تجاهل التعليمات المحقونة",
    tr: "Enjekte edilen talimatları yok saymasını söyleyen daha uzun ve sert bir sistem promptu yazmak",
  },

  "When is fine-tuning a model the right choice over RAG?": {
    ar: "متى يكون الضبط الدقيق للنموذج خيارًا أفضل من RAG؟",
    tr: "Bir modeli ince ayarlamak, RAG'a göre ne zaman doğru tercihtir?",
  },
  "When you need consistent style, format or task behaviour — not to teach it changing facts.": {
    ar: "عندما تحتاج أسلوبًا أو تنسيقًا أو سلوك مهمة متسقًا — لا لتعليمه حقائق متغيّرة.",
    tr: "Tutarlı üslup, biçim veya görev davranışı gerektiğinde — değişen olguları öğretmek için değil.",
  },
  "Whenever you have internal documents to make available.": {
    ar: "كلما كانت لديك مستندات داخلية تريد إتاحتها.",
    tr: "Erişilebilir kılmak istediğiniz iç belgeleriniz olduğunda.",
  },
  "Whenever RAG retrieval is slow.": { ar: "كلما كان استرجاع RAG بطيئًا.", tr: "RAG getirme işlemi yavaş olduğunda." },
  "Whenever the model's answers are wrong.": {
    ar: "كلما كانت إجابات النموذج خاطئة.",
    tr: "Modelin cevapları yanlış olduğunda.",
  },

  "What is the most common cause of an AI feature that works in development and fails in production?": {
    ar: "ما السبب الأكثر شيوعًا لميزة ذكاء اصطناعي تعمل في التطوير وتفشل في الإنتاج؟",
    tr: "Geliştirmede çalışıp üretimde başarısız olan bir yapay zekâ özelliğinin en yaygın nedeni nedir?",
  },
  "Real input is far messier and more varied than the developer's test cases.": {
    ar: "المدخلات الحقيقية أكثر فوضوية وتنوعًا بكثير من حالات اختبار المطوّر.",
    tr: "Gerçek girdi, geliştiricinin test senaryolarından çok daha dağınık ve çeşitlidir.",
  },
  "Production servers are slower.": { ar: "خوادم الإنتاج أبطأ.", tr: "Üretim sunucuları daha yavaştır." },
  "The model version changed.": { ar: "تغيّرت نسخة النموذج.", tr: "Model sürümü değişti." },
  "Users send too many requests.": {
    ar: "يرسل المستخدمون طلبات كثيرة جدًا.",
    tr: "Kullanıcılar çok fazla istek gönderiyor.",
  },

  "You must log AI interactions for debugging, but inputs may contain personal data. What is the right approach?": {
    ar: "عليك تسجيل تفاعلات الذكاء الاصطناعي لأغراض التصحيح، لكن المدخلات قد تحتوي بيانات شخصية. ما الأسلوب الصحيح؟",
    tr: "Hata ayıklama için yapay zekâ etkileşimlerini kaydetmeniz gerekiyor ama girdiler kişisel veri içerebilir. Doğru yaklaşım nedir?",
  },
  "Redact personal data before logging, set retention limits, and restrict who can read the logs.": {
    ar: "احجب البيانات الشخصية قبل التسجيل، وحدّد مدد الاحتفاظ، وقيّد من يمكنه قراءة السجلات.",
    tr: "Kaydetmeden önce kişisel veriyi maskeleyin, saklama süresi belirleyin ve kayıtları kimin okuyabileceğini kısıtlayın.",
  },
  "Log everything — logs are internal.": {
    ar: "سجّل كل شيء — فالسجلات داخلية.",
    tr: "Her şeyi kaydedin — kayıtlar dahilîdir.",
  },
  "Log nothing, to be safe.": { ar: "لا تسجّل شيئًا، احتياطًا.", tr: "Güvenli olsun diye hiçbir şey kaydetmeyin." },
  "Log everything but delete it after a year.": {
    ar: "سجّل كل شيء واحذفه بعد سنة.",
    tr: "Her şeyi kaydedip bir yıl sonra silin.",
  },
};
