/**
 * Arabic and Turkish for the internal lesson bodies.
 *
 * Keyed by `COURSE-CODE::Lesson title` because lesson titles repeat across the
 * role courses — every one of them has a capstone and an assessment — while the
 * content behind them differs.
 *
 * These are translations of authored T&C material, not machine output pasted in
 * bulk: the register matters. A production supervisor reading the Arabic should
 * meet the same plain, direct voice as the English, not a formal translation of
 * it. Markdown structure is preserved so the player renders identically.
 *
 * Coverage is reported by `npx tsx scripts/check-i18n.mts`.
 */

type Body = { ar: string; tr: string };

// ---------------------------------------------------------------------------
// AI at T&C — the mandatory corporate introduction
// ---------------------------------------------------------------------------

const AI_AT_TC: Record<string, Body> = {
  "What we are actually trying to do": {
    ar: `لا تطلب T&C من أحد أن يصبح عالم بيانات. الهدف أضيق من ذلك وأكثر فائدة: **أن يكون كل موظف قادرًا على تسليم مهمة ذهنية روتينية إلى مساعد ذكاء اصطناعي، ثم يتحقق من النتيجة، وينجز عمله الحقيقي أسرع.**

فكّر في أجزاء أسبوعك التي تكون:

- متكررة لكن غير متطابقة في كل مرة (كتابة رسائل متشابهة، تلخيص تقارير متشابهة)
- كثيفة القراءة (مستندات موردين طويلة، سياسات، ملاحظات فحص)
- كثيفة التنسيق (تحويل ملاحظات إلى تقرير، أو جدول إلى ملخص)
- عمل المسودة الأولى (وصف وظيفي، تفسير انحراف، رد على عميل)

هذه هي المهام التي يساعد فيها الذكاء الاصطناعي أكثر اليوم. إنه مساعد سريع لا يتعب، وغير موثوق قليلًا. هو يكتب المسودة، وأنت من يقرّر.

**ما لا يتغيّر:** تبقى مسؤولًا عن أي شيء ترسله أو توقّعه أو تتصرّف بناءً عليه. الذكاء الاصطناعي لا يعتمد، ولا يقرّر، وليس مصدرًا موثوقًا للمعلومات عن T&C. كل ما في هذا المقرر مبني على هذه القاعدة الواحدة.`,
    tr: `T&C kimseden veri bilimci olmasını istemiyor. Hedef bundan daha dar ve daha yararlı: **her çalışan rutin bir düşünme işini bir yapay zekâ asistanına devredebilmeli, sonucu kontrol edebilmeli ve asıl işini daha hızlı bitirebilmeli.**

Haftanızın şu türden kısımlarını düşünün:

- tekrarlayan ama her seferinde birebir aynı olmayan işler (benzer e-postalar yazmak, benzer raporları özetlemek)
- okuma yükü ağır işler (uzun tedarikçi belgeleri, politikalar, muayene notları)
- biçimlendirme yükü ağır işler (notları rapora, tabloyu özete çevirmek)
- ilk taslak işleri (görev tanımı, sapma açıklaması, müşteri yanıtı)

Yapay zekânın bugün en çok yardımcı olduğu görevler bunlar. Hızlı, yorulmayan, biraz da güvenilmez bir asistan. O taslağı yazar; kararı siz verirsiniz.

**Değişmeyen şey:** gönderdiğiniz, imzaladığınız veya üzerine iş yaptığınız her şeyden siz sorumlusunuz. Yapay zekâ onaylamaz, karar vermez ve T&C hakkında bir doğruluk kaynağı değildir. Bu kursun tamamı bu tek kural üzerine kuruludur.`,
  },

  "What AI is good at — and where it fails": {
    ar: `**موثوق اليوم**

- إعادة صياغة وتلخيص نص تعطيه إياه
- تحويل ملاحظات أولية إلى مستند منظّم
- شرح شيء بلغة أبسط
- مقارنة خيارات وفق معايير تحدّدها أنت
- كتابة المسودات: رسائل، أوصاف وظيفية، هياكل إجراءات تشغيل، محاضر اجتماعات
- اقتراح ما ينبغي فحصه في مجموعة بيانات

**غير موثوق اليوم**

- الحقائق التي لم تُعطَ له. إن لم تلصقها أنت، فعامل أي رقم أو تاريخ أو اسم أو اقتباس محدّد على أنه غير مُتحقَّق منه.
- الحساب على قوائم طويلة. غالبًا يبدو صحيحًا وهو ليس كذلك.
- أي شيء يخصّ T&C تحديدًا — مورّدينا، سياساتنا، أسعارنا. لم يرَها قط.
- الأحداث الحديثة، إلا إذا كانت الأداة تبحث عنها.

الخطأ الذي يوقع الناس اسمه **الهلوسة**: ينتج النموذج إجابة واثقة، حسنة الصياغة، ومُختلَقة تمامًا. هو لا يعرف أنه لا يعرف. ولا توجد نبرة تحذير في النص. ولهذا بالضبط فإن عادة التحقق في الوحدة الخامسة أهم من أي حيلة في صياغة الأوامر.`,
    tr: `**Bugün güvenilir**

- Verdiğiniz metni yeniden yazmak ve özetlemek
- Ham notları yapılandırılmış bir belgeye çevirmek
- Bir şeyi daha sade bir dille açıklamak
- Sizin verdiğiniz kriterlere göre seçenekleri karşılaştırmak
- Taslak yazmak: e-postalar, görev tanımları, SOP taslakları, toplantı tutanakları
- Bir veri kümesinde nelerin kontrol edilmesi gerektiğini önermek

**Bugün güvenilmez**

- Kendisine verilmemiş olgular. Siz yapıştırmadıysanız, herhangi bir sayıyı, tarihi, ismi veya alıntıyı doğrulanmamış sayın.
- Uzun listelerde aritmetik. Çoğu zaman doğru görünür, değildir.
- T&C'ye özgü her şey — tedarikçilerimiz, politikalarımız, fiyatlarımız. Bunları hiç görmedi.
- Yakın tarihli olaylar, araç arama yapmıyorsa.

İnsanları yakalayan hata türünün adı **halüsinasyon**: model kendinden emin, iyi yazılmış, tamamen uydurma bir cevap üretir. Bilmediğini bilmez. Metinde bir uyarı tonu yoktur. Beşinci modüldeki doğrulama alışkanlığının her prompt hilesinden daha önemli olmasının sebebi tam olarak budur.`,
  },

  "Where the hours actually are": {
    ar: `تمرين سريع قبل أن تكمل. خذ آخر أسبوع عمل كامل واكتب المهام الخمس التي استغرقت منك أطول وقت.

ولكل واحدة، اسأل ثلاثة أسئلة:

1. **هل هي في معظمها قراءة أو كتابة؟** إن كان نعم، فالأرجح أن الذكاء الاصطناعي يساعد.
2. **هل سأتعرّف على الإجابة الخاطئة فورًا؟** إن كان نعم، فالمخاطرة منخفضة.
3. **هل تتضمّن بيانات سرّية؟** إن كان نعم، فاقرأ الوحدة السادسة قبل أن تجرّب أي شيء.

المهام التي إجابتها *نعم، نعم، لا* هي نقاط انطلاقك. اكتب اثنتين منها الآن — ستستخدمهما مرة أخرى في التحدي العملي في نهاية هذا المقرر، وفي مشروع التطبيق العملي في عملك.

يجد معظم الناس أول توفير حقيقي للوقت في شيء غير لافت: الملخص الأسبوعي، أو مذكرة التسليم، أو رسالة المورّد التي تستغرق دائمًا عشرين دقيقة لصياغتها بعناية.`,
    tr: `Devam etmeden önce hızlı bir alıştırma. Son tam çalışma haftanızı alın ve en uzun süren beş görevi listeleyin.

Her biri için üç soru sorun:

1. **Ağırlıklı olarak okuma veya yazma mı?** Öyleyse yapay zekâ muhtemelen yardımcı olur.
2. **Yanlış bir cevabı hemen fark eder miyim?** Ederseniz risk düşüktür.
3. **Gizli veri içeriyor mu?** İçeriyorsa, bir şey denemeden önce altıncı modülü okuyun.

Cevabı *evet, evet, hayır* olan görevler başlangıç noktalarınızdır. Şimdi bunlardan ikisini yazın — bu kursun sonundaki uygulamalı görevde ve iş yeri bitirme projenizde tekrar kullanacaksınız.

Çoğu kişi ilk gerçek zaman kazancını gösterişsiz bir işte bulur: haftalık özet, devir notu ya da özenle yazmak her seferinde yirmi dakika alan o tedarikçi e-postası.`,
  },

  "The three questions before you paste": {
    ar: `قبل أن تضع أي شيء في أداة ذكاء اصطناعي، اسأل:

**1. هل سأكون مرتاحًا لو ظهر هذا خارج T&C؟**
أدوات الذكاء الاصطناعي العامة خارج شبكتنا. عامِل أي شيء تلصقه كما لو أنك أرسلته بالبريد إلى شخص لا تعرفه.

**2. هل يحدّد هوية شخص؟**
الأسماء، أرقام الهوية، الرواتب، التقييمات، الملاحظات الطبية، أرقام الهواتف، العناوين. احذفها أو استبدلها بعناصر نائبة مثل «الموظف أ».

**3. هل هو حسّاس تجاريًا؟**
الأسعار، التكاليف، الهوامش، شروط الموردين، عقود العملاء، التصاميم، الطاقة الإنتاجية، الطلبات القادمة. هذه تبقى داخل الأنظمة المعتمدة.

إن كانت الإجابة على 2 أو 3 نعم، فإما أن تستخدم أداة داخلية معتمدة، أو **أزل التعريف أولًا**: احذف الأسماء، واستبدل الأرقام الحقيقية بأخرى تمثيلية، واسأل عن شكل المشكلة بدل السجل المحدّد. ستحصل في الغالب على المستوى نفسه من المساعدة.`,
    tr: `Bir yapay zekâ aracına bir şey koymadan önce sorun:

**1. Bu T&C dışında görünse rahat eder miydim?**
Herkese açık yapay zekâ araçları ağımızın dışındadır. Yapıştırdığınız her şeyi, tanımadığınız birine e-postayla göndermişsiniz gibi düşünün.

**2. Bir kişiyi tanımlıyor mu?**
İsimler, kimlik numaraları, maaşlar, değerlendirmeler, sağlık notları, telefon numaraları, adresler. Bunları kaldırın veya "Çalışan A" gibi yer tutucularla değiştirin.

**3. Ticari açıdan hassas mı?**
Fiyatlar, maliyetler, marjlar, tedarikçi şartları, müşteri sözleşmeleri, tasarımlar, üretim kapasitesi, gelecek siparişler. Bunlar onaylı sistemlerin içinde kalır.

2 veya 3'ün cevabı evetse, ya onaylı bir dahilî araç kullanın ya da **önce kimliksizleştirin**: isimleri çıkarın, gerçek rakamları temsilî olanlarla değiştirin ve belirli bir kayıt yerine sorunun genel şeklini sorun. Neredeyse her zaman aynı kalitede yardım alırsınız.`,
  },

  "Approved and unapproved tools": {
    ar: `تحتفظ T&C بقائمة أدوات ذكاء اصطناعي معتمدة. قسم تقنية المعلومات لديك يبقيها محدّثة، وهي القائمة الوحيدة المعتبرة.

القاعدة العامة:

- **أداة معتمدة + بيانات غير سرّية** — تفضّل.
- **أداة معتمدة + بيانات سرّية** — فقط إذا أكّدت تقنية المعلومات أن تلك الأداة مُجازة لذلك.
- **أداة غير معتمدة + أي بيانات لـ T&C** — لا. ويشمل ذلك إضافات المتصفح المجانية وتطبيقات الهاتف و«مرة واحدة فقط».

إن كانت أداة ما ستساعد فعلًا وليست على القائمة، اطلب من تقنية المعلومات مراجعتها. هذا طلب عادي وليس إزعاجًا — وهو أرخص بكثير من حادثة تسريب بيانات.

لا تلصق أبدًا كلمات مرور أو مفاتيح واجهات برمجية أو رموز وصول في أي أداة ذكاء اصطناعي، معتمدة كانت أو لا.`,
    tr: `T&C onaylı yapay zekâ araçlarının listesini tutar. Bilgi Teknolojileri bu listeyi güncel tutar ve geçerli olan tek liste odur.

Genel kural:

- **Onaylı araç + gizli olmayan veri** — devam edin.
- **Onaylı araç + gizli veri** — yalnızca BT o aracın bunun için uygun olduğunu doğrulamışsa.
- **Onaysız araç + herhangi bir T&C verisi** — hayır. Buna ücretsiz tarayıcı eklentileri, telefon uygulamaları ve "sadece bu seferlik" de dahildir.

Bir araç gerçekten işe yarayacaksa ve listede değilse, BT'den incelemesini isteyin. Bu sıradan bir taleptir, bir zahmet değil — ve bir veri olayından çok daha ucuzdur.

Onaylı olsun olmasın, hiçbir yapay zekâ aracına asla şifre, API anahtarı veya erişim jetonu yapıştırmayın.`,
  },

  "Check your understanding": {
    ar: `فحص قصير على قواعد السلامة قبل أن تكمل.`,
    tr: `Devam etmeden önce güvenlik kuralları üzerine kısa bir kontrol.`,
  },

  "The five-part prompt": {
    ar: `معظم الإجابات المخيّبة تأتي من أوامر ضعيفة، لا من نماذج ضعيفة. استخدم هذه البنية وسترتفع الجودة فورًا.

**1. السياق** — من أنت، وما هو الموقف، وما البيانات التي تقدّمها.
**2. الهدف** — ما تريد إنتاجه بالضبط.
**3. القيود** — الطول، النبرة، الجمهور، المعايير، وما يجب استبعاده.
**4. شكل المخرجات** — البنية التي تريدها: جدول، خمس نقاط، موجز من صفحة واحدة.
**5. التحقق** — اطلب منه الإشارة إلى الافتراضات أو الإفصاح عندما لا يكون متأكدًا.

**أمر ضعيف**

> لخّص عرض المورّد هذا.

**أمر منظّم**

> أنا مسؤول مشتريات في مصنع ملابس. في الأسفل عرض مورّد من 20 صفحة.
> أعدّ موجزًا من صفحة واحدة لمدير المشتريات لدينا يغطي: الشروط التجارية، والتزامات التسليم، والتزامات الجودة، وأي شيء غير معتاد أو محفوف بالمخاطر.
> اجعله أقل من 400 كلمة، بلغة بسيطة، وبدون لغة تسويقية.
> قدّمه في أربعة أقسام قصيرة مع قائمة نقاط تحت كل قسم.
> وفي النهاية، اسرد ما لا يذكره العرض بوضوح، وميّز أي رقم تستنتجه بدل أن تقتبسه.

الثاني يستغرق تسعين ثانية إضافية في الكتابة ويوفّر عشرين دقيقة من إعادة العمل.`,
    tr: `Hayal kırıklığı yaratan cevapların çoğu zayıf modellerden değil, zayıf promptlardan gelir. Bu yapıyı kullanın, kalite hemen yükselsin.

**1. Bağlam** — kim olduğunuz, durumun ne olduğu, hangi veriyi verdiğiniz.
**2. Hedef** — tam olarak neyin üretilmesini istediğiniz.
**3. Kısıtlar** — uzunluk, ton, hedef kitle, kriterler, nelerin dışarıda kalacağı.
**4. Çıktı biçimi** — geri istediğiniz yapı: bir tablo, beş madde, tek sayfalık bir özet.
**5. Doğrulama** — varsayımları işaretlemesini ya da emin olmadığında söylemesini isteyin.

**Zayıf prompt**

> Bu tedarikçi teklifini özetle.

**Yapılandırılmış prompt**

> Bir konfeksiyon üreticisinde satın alma sorumlusuyum. Aşağıda 20 sayfalık bir tedarikçi teklifi var.
> Satın alma müdürümüz için tek sayfalık bir özet hazırla: ticari şartlar, teslimat taahhütleri, kalite yükümlülükleri ve olağandışı ya da riskli her şey.
> 400 kelimenin altında, sade bir dille, pazarlama dili olmadan.
> Dört kısa bölüm hâlinde sun, her birinin altında madde listesiyle.
> Sonunda, teklifin açıkça belirtmediği her şeyi listele ve alıntıladığın değil çıkarımla ürettiğin her rakamı işaretle.

İkincisi yazmak doksan saniye daha uzun sürer ve yirmi dakikalık yeniden çalışmayı ortadan kaldırır.`,
  },

  "Iterating instead of starting again": {
    ar: `عندما لا تكون الإجابة الأولى صحيحة، لا تُعد كتابة الأمر كله. صحّحه في مكانه — فالمساعد يحتفظ بالسياق.

متابعات مفيدة:

- «طويل جدًا. اختصره إلى 150 كلمة مع الإبقاء على قسم المخاطر.»
- «كتبت هذا لقارئ تقني. أعد كتابته لمشرف إنتاج.»
- «النقطة 3 خاطئة — نافذة التسليم 45 يومًا لا 30. أعد الجدول الزمني.»
- «أي أجزاء من تلك الإجابة جاءت من المستند الذي أعطيتك إياه، وأيها استنتجته؟»

السؤال الأخير هو الأكثر فائدة في هذا المقرر كله. فهو يجبر المساعد على الفصل بين ما قرأه وما اختلقه، ويكشف الهلوسة بسرعة.

التحسين التدريجي يتفوّق أيضًا على السعي للكمال: جولتان أو ثلاث سريعة تصل عادةً إلى نتيجة أفضل من أمر واحد طويل جدًا.`,
    tr: `İlk cevap doğru değilse promptun tamamını yeniden yazmayın. Yerinde düzeltin — asistan bağlamı korur.

Yararlı takipler:

- "Çok uzun. 150 kelimeye indir, risk bölümünü koru."
- "Bunu teknik bir okuyucu için yazmışsın. Bir üretim şefi için yeniden yaz."
- "3. madde yanlış — teslim penceresi 30 değil 45 gün. Zaman çizelgesini yeniden yap."
- "Bu cevabın hangi kısımları verdiğim belgeden geldi, hangilerini çıkarımla ürettin?"

Sonuncusu bu kursun en yararlı sorusudur. Asistanı, okuduğu ile uydurduğunu ayırmaya zorlar ve halüsinasyonları hızla ortaya çıkarır.

İyileştirme, mükemmeliyetçiliği de yener: iki üç hızlı tur, genellikle tek bir çok uzun promptun ulaştığından daha iyi bir sonuca varır.`,
  },

  "Write a prompt for your own work": {
    ar: `خذ إحدى المهمتين اللتين كتبتهما في الوحدة الأولى واكتب لها أمرًا كاملًا من خمسة أجزاء.

ثم قِسه على المعيار الذي نستخدمه في المنصة:

- **السياق** — هل يفهم زميل جديد الموقف من هذا وحده؟
- **الهدف** — هل هناك مخرَج واحد واضح فقط؟
- **القيود** — الطول، الجمهور، النبرة، المعايير؟
- **شكل المخرجات** — هل ذكرت البنية التي تريدها؟
- **التحقق** — هل طلبت منه الإشارة إلى الافتراضات؟

احفظ الأمر النهائي في **صندوق أدواتي**. ستعيد استخدامه أكثر مما تتوقع.`,
    tr: `Birinci modülde listelediğiniz iki görevden birini alın ve onun için tam beş parçalı bir prompt yazın.

Sonra platformda kullandığımız ölçüte göre kontrol edin:

- **Bağlam** — yeni bir meslektaş yalnızca bundan durumu anlar mıydı?
- **Hedef** — tam olarak tek bir net çıktı var mı?
- **Kısıtlar** — uzunluk, hedef kitle, ton, kriterler?
- **Çıktı biçimi** — hangi yapıyı istediğinizi söylediniz mi?
- **Doğrulama** — varsayımları işaretlemesini istediniz mi?

Bitmiş promptu **AI Araç Kutum**'a kaydedin. Beklediğinizden daha çok kullanacaksınız.`,
  },

  "Finance, HR and Commercial": {
    ar: `**المالية** — شرح الانحرافات بكلمات يقرأها المدير؛ تحويل مصنّف أرقام إلى تعليق إداري؛ صياغة سرديات السيناريوهات؛ التأكد من أن التقرير يقول ما تقوله الأرقام. الذكاء الاصطناعي آلة حاسبة رديئة وشارح جيد: احسب في Excel، واستخدمه في الجملة التي تلي الرقم.

**الموارد البشرية** — مسودات أولى للأوصاف الوظيفية، وأسئلة مقابلات منظّمة، وقوائم تهيئة، وملخصات سياسات بلغة بسيطة، وتحليل مواضيع الاستبيانات. لا تلصق أبدًا سيرًا ذاتية أو تقييمات أو رواتب أو سجلات تأديبية في أداة عامة.

**التجاري** — بحث السوق والمنافسين على أن يُتحقَّق منه لاحقًا، وصياغة العروض، ونبرة رسائل العملاء، وتحويل مواصفة إلى ملخص موجّه للعميل. الأسعار وشروط العقود تبقى خارج الأدوات العامة.

راجع **مكتبة حالات استخدام الذكاء الاصطناعي** للاطلاع على أمثلة تطبيقية مع أوامر جاهزة لكل من هذه المجالات.`,
    tr: `**Finans** — sapmaları bir yöneticinin okuyacağı kelimelerle açıklamak; rakam dolu bir çalışma kitabını yönetim yorumuna çevirmek; senaryo anlatıları yazmak; raporun rakamların söylediğini söylediğinden emin olmak. Yapay zekâ kötü bir hesap makinesi, iyi bir açıklayıcıdır: aritmetiği Excel'de yapın, sonrasındaki cümle için yapay zekâyı kullanın.

**İnsan Kaynakları** — ilk taslak görev tanımları, yapılandırılmış mülakat soruları, oryantasyon kontrol listeleri, sade dilde politika özetleri, anket tema analizi. Herkese açık bir araca asla CV, değerlendirme, maaş veya disiplin kaydı yapıştırmayın.

**Ticari** — sonradan doğrulanmak üzere pazar ve rakip araştırması, teklif yazımı, müşteri e-postası tonu, bir şartnameyi müşteriye dönük özete çevirmek. Fiyatlar ve sözleşme şartları herkese açık araçların dışında kalır.

Bunların her biri için örnek promptlarla işlenmiş örnekleri **AI Kullanım Alanları Kütüphanesi**'nde bulabilirsiniz.`,
  },

  "Production, Quality and Supply Chain": {
    ar: `**الإنتاج** — تحويل ملاحظات الوردية إلى ملخص توقفات؛ صياغة إجراء تشغيل قياسي من وصف مشغّل ذي خبرة؛ هيكلة تحقيق في الأسباب الجذرية؛ كتابة التقرير اليومي بحيث تُقرأ الأرقام التي لديك أصلًا.

**الجودة** — تجميع أوصاف العيوب النصية الحرة في فئات؛ صياغة مستندات الإجراءات التصحيحية؛ تلخيص تقارير الفحص؛ إعداد السرد المرافق لتحليل باريتو الذي بنيته في Excel.

**سلسلة الإمداد** — مقارنة ردود طلبات عروض الأسعار وفق معايير تحدّدها؛ تلخيص شروط الموردين؛ صياغة متابعات الشراء؛ سرد ما يغفل عرض السعر عن ذكره.

النمط نفسه في كل مكان: **الأرقام تبقى لك، والذكاء الاصطناعي يتولّى اللغة المحيطة بها.** في تقسيم العمل هذا يكمن التوفير الموثوق في الوقت.`,
    tr: `**Üretim** — vardiya notlarını duruş özetine çevirmek; deneyimli bir operatörün anlatımından SOP taslağı çıkarmak; kök neden incelemesini yapılandırmak; günlük raporu, hâlihazırda elinizde olan rakamlar gerçekten okunacak şekilde yazmak.

**Kalite** — serbest metinli hata açıklamalarını kategorilere ayırmak; CAPA belgeleri hazırlamak; muayene raporlarını özetlemek; Excel'de kurduğunuz Pareto için anlatımı hazırlamak.

**Tedarik Zinciri** — teklif yanıtlarını sizin belirlediğiniz kriterlere göre karşılaştırmak; tedarikçi şartlarını özetlemek; satın alma takip yazıları hazırlamak; bir teklifin neyi belirtmediğini listelemek.

Her yerde desen aynı: **rakamlar sizde kalır, yapay zekâ etraflarındaki dili üstlenir.** Güvenilir zaman kazancı bu iş bölümünde yatar.`,
  },

  "Find two use cases for your team": {
    ar: `افتح **مكتبة حالات استخدام الذكاء الاصطناعي** وصفِّها على قسمك.

اختر حالتين تصلحان لفريقك، ودوّن لكل منهما:

1. من يقوم بهذه المهمة اليوم وكم تستغرق
2. ما البيانات المتضمّنة، وهل أي منها حسّاس
3. كيف يبدو المخرَج «الجيد»
4. كيف ستتحقق من النتيجة قبل استخدامها

احفظهما. إن تحوّلت إحداهما إلى شيء حقيقي، فستكون مشروع تطبيق عملي ممتازًا — والمشاريع المعتمدة تغذّي مسار فرص الذكاء الاصطناعي في T&C.`,
    tr: `**AI Kullanım Alanları Kütüphanesi**'ni açın ve departmanınıza göre filtreleyin.

Ekibinizde işe yarayacak iki durum seçin ve her biri için not alın:

1. Bu görevi bugün kim yapıyor ve ne kadar sürüyor
2. Hangi veri söz konusu ve bunun herhangi biri hassas mı
3. Çıktıda "iyi"nin nasıl görüneceği
4. Sonucu kullanmadan önce nasıl kontrol edeceğiniz

Bunları kaydedin. Biri gerçek bir şeye dönüşürse mükemmel bir iş yeri bitirme projesi olur — ve onaylanan projeler T&C AI Fırsatları hattını besler.`,
  },

  "How to check an answer in two minutes": {
    ar: `التحقق ليس إعادة إنجاز العمل. إنه فحص قصير وموجّه للأجزاء الأرجح أن تكون خاطئة.

**تحقّق دائمًا من**

- كل رقم. مقابل المصدر، لا مقابل الذكاء الاصطناعي.
- كل اسم وتاريخ ومرجع. هذه أكثر ما يُختلَق.
- أي اقتباس. إن كان بين علامتَي تنصيص، فابحث عنه في الأصل.
- أي شيء يُقال عن سياسة T&C أو مورّدينا أو عقودنا.

**آمن عادةً**

- البنية والترتيب والتجميع
- النبرة والصياغة
- ملخصات نص قدّمته أنت — مع التحقق من عدم إسقاط شيء مهم

**خطوة مفيدة:** اسأل «أي أجزاء من هذا مدعومة مباشرة بالنص الذي أعطيتك إياه؟ اسرد ما استنتجته.» ثم افحص قائمة المستنتَج كما ينبغي.

إن كانت الإجابة ستسبّب مشكلة إذا كانت خاطئة — رقم في ملف لمجلس الإدارة، أو التزام لعميل، أو تعليمة سلامة — فتحقّق منها بالكامل أو لا تستخدمها.`,
    tr: `Doğrulama, işi yeniden yapmak değildir. Yanlış olma olasılığı en yüksek kısımlara yönelik kısa ve hedefli bir kontroldür.

**Her zaman kontrol edin**

- Her sayıyı. Yapay zekâya değil, kaynağa karşı.
- Her ismi, tarihi ve atfı. En sık bunlar uydurulur.
- Her alıntıyı. Tırnak içindeyse orijinalinde bulun.
- T&C politikası, tedarikçilerimiz veya sözleşmelerimiz hakkında söylenen her şeyi.

**Genelde güvenli**

- Yapı, sıralama, gruplama
- Ton ve ifade
- Sizin verdiğiniz metnin özetleri — yine de önemli bir şeyin düşmediğini kontrol edin

**Yararlı bir hamle:** "Bunun hangi kısımları verdiğim metinle doğrudan destekleniyor? Çıkarımla ürettiklerini listele" diye sorun. Sonra çıkarım listesini gerektiği gibi kontrol edin.

Bir cevap yanlış olduğunda sorun yaratacaksa — yönetim kurulu dosyasındaki bir rakam, bir müşteriye verilen taahhüt, bir güvenlik talimatı — ya tam olarak doğrulayın ya da kullanmayın.`,
  },

  "Who is accountable": {
    ar: `الشخص الذي يرسل المخرجات أو يوقّعها أو ينشرها أو يتصرّف بناءً عليها هو المسؤول عنها. ليست الأداة، ولا تقنية المعلومات، ولا من كتب قالب الأمر.

عمليًا، هذا يعني:

- «الذكاء الاصطناعي قال ذلك» ليس تفسيرًا لخطأ، أبدًا.
- أي شيء يذهب إلى عميل أو مورّد أو مدقّق أو مجلس الإدارة يتبع مسار المراجعة نفسه الذي كان يتبعه دائمًا.
- إن كان الذكاء الاصطناعي قد شكّل قرارًا بشكل جوهري، فاذكر ذلك عند عرضه. من حق الزملاء أن يعرفوا كيف أُنتج التحليل.
- إن اكتشفت خطأً وصل إلى شخص آخر، فصحّحه بالطريقة نفسها التي تصحّح بها أي خطأ آخر — بسرعة وكتابةً.

لا شيء من هذا يهدف إلى تثبيط الاستخدام. الهدف أن يكون الاستخدام قابلًا للدفاع عنه.`,
    tr: `Çıktıyı gönderen, imzalayan, yayımlayan veya üzerine iş yapan kişi ondan sorumludur. Araç değil, BT değil, prompt şablonunu yazan kişi değil.

Pratikte bu şu demek:

- "Yapay zekâ öyle dedi" bir hatanın açıklaması olamaz.
- Bir müşteriye, tedarikçiye, denetçiye veya yönetim kuruluna giden her şey, her zamanki inceleme yolundan geçer.
- Yapay zekâ bir kararı esaslı biçimde şekillendirdiyse, sunarken bunu söyleyin. Meslektaşlarınızın analizin nasıl üretildiğini bilmeye hakkı var.
- Başkasına ulaşmış bir hatayı fark ederseniz, başka herhangi bir hatayı düzelttiğiniz gibi düzeltin — hızlıca ve yazılı olarak.

Bunların hiçbiri kullanımı caydırmak için değil. Kullanımı savunulabilir kılmak için.`,
  },

  "The protected list": {
    ar: `لا تضع أبدًا ما يلي في أداة ذكاء اصطناعي غير معتمدة لذلك:

- **بيانات الموظفين** — أسماء مع رواتب، تقييمات، أرقام هوية أو جوازات، سجلات طبية أو تأديبية
- **بيانات العملاء** — جهات الاتصال، العقود، دفاتر الطلبات، اتفاقيات التسعير
- **البيانات المالية** — التكاليف، الهوامش، التوقعات، النتائج غير المنشورة
- **بيانات الموردين** — عروض الأسعار، الشروط، نتائج التدقيق
- **الأسعار** — أي شيء غير معلن للعامة أصلًا
- **الملكية الفكرية** — التصاميم، الباترونات، المواصفات الفنية، خبرة العمليات
- **معلومات حسّاسة للإنتاج** — الطاقة، معدلات الإنتاجية، نسب العيوب المرتبطة بعميل
- **بيانات الاعتماد** — كلمات المرور، مفاتيح الواجهات، الرموز، سلاسل الاتصال

**عادة إزالة التعريف.** نادرًا ما تحتاج السجل الحقيقي للحصول على مساعدة مفيدة. استبدل الأسماء بـ«المورّد أ»، وغيّر مقياس الأرقام، واحذف العميل. اسأل عن النمط لا عن الملف. تحصل على المستوى نفسه من الإجابة بدون أي انكشاف.

إن لم تكن متأكدًا مما إذا كان شيء ما حسّاسًا، فهو حسّاس. اسأل تقنية المعلومات.`,
    tr: `Aşağıdakileri, bunun için onaylanmamış bir yapay zekâ aracına asla koymayın:

- **Çalışan verisi** — maaşlarla birlikte isimler, değerlendirmeler, kimlik veya pasaport numaraları, sağlık veya disiplin kayıtları
- **Müşteri verisi** — iletişim bilgileri, sözleşmeler, sipariş defterleri, fiyat anlaşmaları
- **Finansal veri** — maliyetler, marjlar, tahminler, yayımlanmamış sonuçlar
- **Tedarikçi verisi** — teklifler, şartlar, denetim bulguları
- **Fiyatlandırma** — halihazırda kamuya açık olmayan her şey
- **Fikrî mülkiyet** — tasarımlar, kalıplar, teknik şartnameler, süreç bilgisi
- **Üretime duyarlı bilgi** — kapasite, verim, bir müşteriye bağlı hata oranları
- **Kimlik bilgileri** — şifreler, API anahtarları, jetonlar, bağlantı dizeleri

**Kimliksizleştirme alışkanlığı.** Yararlı yardım almak için gerçek kayda nadiren ihtiyacınız olur. İsimleri "Tedarikçi A" ile değiştirin, rakamların ölçeğini değiştirin, müşteriyi çıkarın. Dosyayı değil deseni sorun. Aynı kalitede cevabı, hiçbir ifşa olmadan alırsınız.

Bir şeyin hassas sayılıp sayılmadığından emin değilseniz, sayılır. BT'ye sorun.`,
  },

  "If something goes wrong": {
    ar: `إن أدركت أنك لصقت شيئًا ما كان ينبغي لصقه:

1. أبلغ مديرك وتقنية المعلومات في اليوم نفسه. لا الأسبوع القادم.
2. دوّن ما شُورك، وفي أي أداة، ومتى تقريبًا.
3. احذف المحادثة إن سمحت الأداة بذلك — لكن أبلغ على أي حال؛ الحذف ليس احتواءً.
4. لا تحاول إصلاح الأمر بنفسك في صمت.

الإبلاغ المبكر يُعامَل في T&C كممارسة جيدة، لا كمسألة تأديبية. الإخفاء هو ما يسبّب الضرر الحقيقي. الجميع يخطئ في هذا مرة على الأقل؛ المهم ما يحدث في الساعة التالية.`,
    tr: `Koymamanız gereken bir şeyi yapıştırdığınızı fark ederseniz:

1. Yöneticinize ve BT'ye aynı gün haber verin. Gelecek hafta değil.
2. Neyin, hangi araca ve yaklaşık ne zaman paylaşıldığını not edin.
3. Araç izin veriyorsa sohbeti silin — ama yine de bildirin; silmek kontrol altına almak değildir.
4. Sessizce kendiniz düzeltmeye çalışmayın.

Erken bildirim T&C'de iyi bir uygulama sayılır, disiplin konusu değil. Asıl zararı gizlemek verir. Herkes bunu en az bir kez yapar; önemli olan sonraki bir saatte ne olduğudur.`,
  },

  "Your practical challenge": {
    ar: `اختر مهمة حقيقية واحدة من عملك — إحدى المهمتين اللتين كتبتهما في الوحدة الأولى.

قدّم:

1. **المهمة** — ما هي وكم تستغرق منك اليوم
2. **أمرك** — الأمر الكامل من خمسة أجزاء الذي استخدمته
3. **ما عاد إليك** — وصف قصير، أو المخرجات بعد إزالة أي تفصيل حسّاس
4. **ما اضطررت لتصحيحه** — كن محدّدًا؛ هذا أنفع جزء
5. **تحققك** — ماذا فحصت وكيف
6. **هل ستستخدمه مرة أخرى؟** — وما الذي ستغيّره

لا يوجد حد أدنى لتوفير الوقت ولا إجابة خاطئة. محاولة موثّقة جيدًا *لم* توفّر وقتًا هي نتيجة مفيدة فعلًا، وتُقيَّم على هذا الأساس.`,
    tr: `Kendi işinizden gerçek bir görev seçin — birinci modülde listelediğiniz ikisinden biri.

Şunları gönderin:

1. **Görev** — ne olduğu ve bugün sizin ne kadar sürdüğü
2. **Promptunuz** — kullandığınız tam beş parçalı prompt
3. **Ne geldiği** — kısa bir açıklama ya da hassas ayrıntıları çıkarılmış çıktı
4. **Neyi düzeltmek zorunda kaldığınız** — spesifik olun; en yararlı kısım bu
5. **Doğrulamanız** — neyi, nasıl kontrol ettiğiniz
6. **Tekrar kullanır mıydınız?** — ve neyi değiştirirdiniz

Asgari bir zaman kazancı yok, yanlış cevap da yok. Zaman kazandırmayan ama iyi belgelenmiş bir deneme gerçekten yararlı bir sonuçtur ve öyle değerlendirilir.`,
  },

  "Course assessment": {
    ar: `اثنا عشر سؤالًا تغطي السلامة وصياغة الأوامر والتحقق والتطبيق في العمل.`,
    tr: `Güvenlik, prompt yazımı, doğrulama ve iş yerinde uygulamayı kapsayan on iki soru.`,
  },
};

// ---------------------------------------------------------------------------
// Responsible AI at T&C — mandatory before any certificate
// ---------------------------------------------------------------------------

const RESPONSIBLE_AI: Record<string, Body> = {
  "The three ways AI goes wrong at work": {
    ar: `تقع كل حادثة ذكاء اصطناعي تقريبًا في شركة مثل شركتنا ضمن واحدة من ثلاث مجموعات.

**1. البيانات تخرج.** يلصق شخص عقد عميل أو قائمة رواتب أو ورقة تكاليف في أداة عامة ليوفّر عشر دقائق. البيانات الآن خارج سيطرتنا، وقد يُحتفظ بها.

**2. إجابة خاطئة تُصدَّق.** يختلق النموذج رقمًا أو بندًا أو لائحة. تُقرأ بشكل جيد، ولا يتحقق منها أحد، فتصل إلى عميل أو إلى ملف مجلس الإدارة.

**3. لا أحد يتحمّل المسؤولية.** يُتَّخذ قرار «لأن الذكاء الاصطناعي قال ذلك»، وحين تسوء النتيجة لا يوجد شخص راجعه.

كل ما في هذه الوحدة موجود لمنع واحدة من هذه الثلاث. لهذا هي إلزامية، ولهذا يجب اجتيازها لا مجرد إكمالها، ولهذا تُشترط قبل إصدار أي شهادة ذكاء اصطناعي من T&C.`,
    tr: `Bizimki gibi bir şirkette neredeyse her yapay zekâ olayı üç gruptan birine girer.

**1. Veri dışarı çıkar.** Biri on dakika kazanmak için bir müşteri sözleşmesini, maaş listesini veya maliyet tablosunu herkese açık bir araca yapıştırır. Veri artık kontrolümüz dışındadır ve saklanıyor olabilir.

**2. Yanlış bir cevaba güvenilir.** Model bir rakamı, bir maddeyi veya bir mevzuatı uydurur. İyi okunur, kimse kontrol etmez ve bir müşteriye ya da yönetim kurulu dosyasına ulaşır.

**3. Kimse sahiplenmez.** "Yapay zekâ öyle dedi" diye bir karar verilir ve kötü sonuçlandığında onu inceleyen bir kişi yoktur.

Bu modüldeki her şey bu üçünden birini önlemek için var. Zorunlu olmasının, yalnızca tamamlanması değil geçilmesi gerekmesinin ve herhangi bir T&C yapay zekâ sertifikasından önce şart koşulmasının sebebi bu.`,
  },

  "Never blindly trust AI output": {
    ar: `ينتج النموذج اللغوي *الكلمات التالية الأكثر ترجيحًا*. والمرجّح ليس هو الصحيح.

ولهذا نتيجة غير مريحة: **تكون إجابة الذكاء الاصطناعي أكثر إقناعًا بالضبط حين تكون أنت أقل قدرة على التحقق منها.** في موضوع تتقنه، تكتشف الخطأ فورًا. وفي موضوع لا تتقنه، يُقرأ الخطأ نفسه بوصفه سلطة معرفية.

فالقاعدة ليست «تحقّق حين تبدو خاطئة». بل: **تحقّق من الأشياء التي ستكون مهمة لو كانت خاطئة**، في كل مرة، مهما بدت الإجابة واثقة.

وتحديدًا: كل رقم، وكل اسم، وكل تاريخ، وكل اقتباس، وكل ادعاء بشأن قاعدة أو معيار أو سياسة أو عقد.`,
    tr: `Bir dil modeli *en olası sonraki kelimeleri* üretir. Olası, doğru ile aynı şey değildir.

Bunun rahatsız edici bir sonucu var: **bir yapay zekâ cevabı, tam da onu kontrol etme imkânınızın en az olduğu yerde en ikna edicidir.** İyi bildiğiniz bir konuda hatayı anında görürsünüz. Bilmediğiniz bir konuda aynı hata otorite gibi okunur.

Yani kural "yanlış göründüğünde kontrol et" değildir. Kural şudur: **yanlış olsaydı önemli olacak şeyleri kontrol edin**, her seferinde, cevap ne kadar emin görünürse görünsün.

Somut olarak: her sayı, her isim, her tarih, her alıntı ve bir kural, standart, politika veya sözleşme hakkındaki her iddia.`,
  },

  "What must never be shared": {
    ar: `الفئات المحمية في T&C:

- **بيانات الموظفين** — أسماء مع رواتب، تقييمات، أرقام هوية أو جوازات، سجلات طبية وتأديبية
- **معلومات العملاء** — جهات الاتصال، العقود، أحجام الطلبات، الشروط التجارية
- **البيانات المالية** — التكاليف، الهوامش، التوقعات، النتائج غير المنشورة
- **بيانات الموردين** — عروض الأسعار، الشروط، نتائج التدقيق
- **الأسعار** — أي شيء غير معلن للعامة أصلًا
- **كلمات المرور وبيانات الاعتماد** — أبدًا، وفي أي أداة
- **المعلومات الشخصية** لأي فرد، منّا أو من طرف ثالث
- **الملكية الفكرية** — التصاميم، الباترونات، المواصفات الفنية
- **معلومات حسّاسة للإنتاج** — الطاقة، معدلات الإنتاجية، بيانات عيوب مرتبطة بعميل

إن احتجت مساعدة في شيء من هذه الفئات، فإما أن تستخدم أداة اعتمدتها تقنية المعلومات لتلك البيانات، أو أن تزيل التعريف: احذف الأسماء، وغيّر مقياس الأرقام، وصِف النمط بدل السجل.`,
    tr: `T&C'de korunan kategoriler:

- **Çalışan verisi** — maaşlarla birlikte isimler, değerlendirmeler, kimlik veya pasaport numaraları, sağlık ve disiplin kayıtları
- **Müşteri bilgileri** — iletişim bilgileri, sözleşmeler, sipariş hacimleri, ticari şartlar
- **Finansal veri** — maliyetler, marjlar, tahminler, yayımlanmamış sonuçlar
- **Tedarikçi verisi** — teklifler, şartlar, denetim bulguları
- **Fiyatlandırma** — halihazırda kamuya açık olmayan her şey
- **Şifreler ve kimlik bilgileri** — hiçbir araçta, asla
- **Kişisel bilgiler** — bizden ya da üçüncü taraftan, herhangi bir bireye ait
- **Fikrî mülkiyet** — tasarımlar, kalıplar, teknik şartnameler
- **Üretime duyarlı bilgi** — kapasite, verim, müşteriye bağlı hata verileri

Bu kategorilerden birinde yardıma ihtiyacınız varsa, ya BT'nin o veri için onayladığı bir aracı kullanın ya da kimliksizleştirin: isimleri çıkarın, rakamların ölçeğini değiştirin, kaydı değil deseni anlatın.`,
  },

  "De-identify: a worked example": {
    ar: `**لا ترسل هذا**

> إليك ورقة التكاليف لعميلنا Nordwear، الطلب 44120، 18,000 قطعة بسعر 4.12 دولار واصل بهامش 14%. هل نقبل طلبهم بتخفيض 6%؟

**أرسل هذا بدلًا منه**

> أتفاوض على طلب ملابس بحوالي 18,000 قطعة. تكلفتنا الواصلة تعطينا هامشًا في حدود مطلع العشرات بالمئة. المشتري يطلب تخفيضًا بنسبة 6%.
> اسرد الأدوات التي تكون عادةً بيد المصنّع في هذا الموقف، ومخاطر كل منها، وما المعلومات التي ينبغي أن أؤكّدها داخليًا قبل الرد. لا تفترض أرقامًا لم أعطها لك.

المساعدة نفسها. بدون اسم عميل، وبدون رقم طلب، وبدون تكلفة دقيقة. يستغرق هذا خمس عشرة ثانية وهو أنفع عادة في هذه الوحدة.`,
    tr: `**Bunu göndermeyin**

> Nordwear müşterimiz için maliyet tablomuz: 44120 numaralı sipariş, 18.000 adet, 4,12 dolar teslim maliyet, %14 marj. %6 indirim taleplerini kabul etmeli miyiz?

**Bunun yerine bunu gönderin**

> Yaklaşık 18.000 adetlik bir konfeksiyon siparişi için pazarlık yapıyorum. Teslim maliyetimiz bize yüzde olarak onlu rakamların başında bir marj bırakıyor. Alıcı %6 fiyat indirimi istiyor.
> Bir üreticinin bu durumda genelde elinde olan kaldıraçları, her birinin risklerini ve yanıt vermeden önce içeride hangi bilgileri teyit etmem gerektiğini listele. Sana vermediğim rakamları varsayma.

Aynı yardım. Müşteri adı yok, sipariş numarası yok, kesin maliyet yok. Bu on beş saniye alır ve bu modüldeki en yararlı tek alışkanlıktır.`,
  },

  Hallucinations: {
    ar: `الهلوسة إجابة واثقة وسلسة ومُختلَقة. النموذج لا يكذب — فليس لديه مفهوم للحقيقة كي يكذب بشأنه. إنه يُكمل نمطًا.

**أين تظهر أكثر**

- الأرقام والنسب والتواريخ المحدّدة
- أسماء الأشخاص والشركات والمعايير واللوائح
- المراجع والاقتباسات
- أي شيء يخصّ مؤسستك، فهو لم يرَها قط
- الإجابات المفصّلة عن أسئلة لا يقف خلفها معلومات حقيقية كافية

**كيف تقلّلها**

- أعطه المادة المصدر بدل أن تسأله من الذاكرة
- اطلب منه أن يقول «غير مذكور في المستند» بدل التخمين
- اسأله أي الأجزاء مقتبسة وأيها مستنتجة
- اطرح السؤال نفسه مرتين بصياغتين مختلفتين — الإجابات غير المستقرة إشارة على الاختلاق

**كيف تكتشفها:** تحقّق مقابل المصدر. لا بديل عن ذلك.`,
    tr: `Halüsinasyon, kendinden emin, akıcı ve uydurma bir cevaptır. Model yalan söylemiyor — hakkında yalan söyleyeceği bir doğruluk kavramı yok. Bir deseni tamamlıyor.

**En çok nerede görülür**

- Belirli rakamlar, yüzdeler ve tarihler
- Kişi, şirket, standart ve mevzuat isimleri
- Atıflar ve alıntılar
- Kuruluşunuzla ilgili her şey — onu hiç görmedi
- Arkasında yeterli gerçek bilgi olmayan sorulara verilen ayrıntılı cevaplar

**Nasıl azaltılır**

- Hafızasından sormak yerine kaynak materyali verin
- Tahmin etmek yerine "belgede belirtilmemiş" demesini isteyin
- Hangi kısımların alıntı, hangilerinin çıkarım olduğunu sorun
- Aynı soruyu iki kez, farklı biçimde sorun — kararsız cevaplar uydurma işaretidir

**Nasıl yakalanır:** kaynakla karşılaştırarak doğrulayın. Bunun yerine geçecek bir şey yok.`,
  },

  "Bias and fairness": {
    ar: `تتعلّم النماذج من نصوص كتبها بشر، فتحمل الأنماط الموجودة في تلك النصوص — بما فيها غير العادلة.

وأكثر ما يهمّ هذا في T&C هو كل ما يمسّ الأشخاص: التوظيف، والتقييم، والترقية، والانضباط، وتخطيط القوى العاملة.

**قواعد عملية**

- يجوز للذكاء الاصطناعي أن يساعد في *هيكلة* عملية توظيف — صياغة وصف وظيفي، وإعداد أسئلة مقابلة متسقة، وتلخيص سياسة.
- لا يجوز للذكاء الاصطناعي أن *يرتّب أو يقيّم أو يستبعد* أشخاصًا. كل قرار يخصّ الأشخاص يتخذه إنسان، وفق معايير معلنة.
- انتبه للافتراضات التي يضيفها النموذج ولم تقدّمها أنت — الجنس، الجنسية، العمر، الأقدمية.
- إن كانت المخرجات ستُحرجنا أمام الموظف الذي تصفه، فلا تستخدمها.

ينطبق الحذر نفسه على الأحكام المتعلقة بالموردين والعملاء والمبنية على بيانات ناقصة.`,
    tr: `Modeller insanların yazdığı metinlerden öğrenir, dolayısıyla o metinlerdeki desenleri — adil olmayanlar dahil — taşırlar.

Bunun T&C'de en çok önem taşıdığı yer insanlara dokunan her şeydir: işe alım, değerlendirme, terfi, disiplin ve iş gücü planlaması.

**Pratik kurallar**

- Yapay zekâ bir işe alım sürecini *yapılandırmaya* yardım edebilir — görev tanımı yazmak, tutarlı mülakat soruları hazırlamak, bir politikayı özetlemek.
- Yapay zekâ insanları *sıralayamaz, puanlayamaz veya eleyemez*. İnsanlarla ilgili her kararı, açıkça belirtilmiş kriterlere göre bir insan verir.
- Modelin sizin vermediğiniz halde eklediği varsayımlara dikkat edin — cinsiyet, uyruk, yaş, kıdem.
- Bir çıktı, tarif ettiği çalışanın karşısında bizi utandıracaksa kullanmayın.

Aynı dikkat, eksik veriye dayanan tedarikçi ve müşteri değerlendirmeleri için de geçerlidir.`,
  },

  "Human accountability and approval": {
    ar: `**من يستخدم المخرجات يملك المخرجات.**

في T&C يعني ذلك:

1. **الاعتمادات نفسها كما كانت.** العمل المدعوم بالذكاء الاصطناعي يتبع مسار المراجعة القائم. وهو لا ينشئ طريقًا مختصرًا.
2. **أفصح عن الاستخدام الجوهري.** إن كان الذكاء الاصطناعي قد شكّل تحليلًا أو مستندًا بشكل جوهري، فاذكر ذلك عند عرضه.
3. **لا قرارات آلية بشأن الأشخاص.** إطلاقًا.
4. **احتفظ بتبريرك.** إن سُئلت لماذا تقول التوصية ما تقول، يجب أن تستطيع الإجابة دون أن تشير إلى نافذة محادثة.
5. **أبلغ عن الحوادث في اليوم نفسه.** الإبلاغ المبكر متوقَّع وليس مسألة تأديبية.

إن لم تستطع الدفاع عن المخرجات بنفسك، فهي ليست جاهزة لمغادرة مكتبك.`,
    tr: `**Çıktıyı kullanan, çıktının sahibidir.**

T&C'de bu şu demek:

1. **Eskisiyle aynı onaylar.** Yapay zekâ destekli iş mevcut inceleme yolunu izler. Bir kestirme yaratmaz.
2. **Esaslı kullanımı açıklayın.** Yapay zekâ bir analizi veya belgeyi önemli ölçüde şekillendirdiyse, sunarken bunu söyleyin.
3. **İnsanlar hakkında otomatik karar yok.** Hiçbir zaman.
4. **Gerekçenizi elinizde tutun.** Bir önerinin neden öyle dediği sorulduğunda, bir sohbet penceresini işaret etmeden yanıtlayabilmelisiniz.
5. **Olayları aynı gün bildirin.** Erken bildirim beklenen davranıştır, disiplin konusu değildir.

Çıktıyı bizzat savunamıyorsanız, masanızdan çıkmaya hazır değildir.`,
  },

  "Responsible AI assessment": {
    ar: `يجب اجتياز هذا التقييم للحصول على أي شهادة من أكاديمية T&C للذكاء الاصطناعي. ويمكن إعادته بعد المراجعة.`,
    tr: `T&C AI Academy sertifikalarından herhangi birini almak için bu değerlendirmeyi geçmeniz gerekir. Gözden geçirmenin ardından tekrar alınabilir.`,
  },
};

// ---------------------------------------------------------------------------
// Role courses — shared scaffolding
//
// Every role course ends with the same capstone instructions and the same
// one-line quiz description; only the opening context sentence differs. The
// English seed builds them from a helper, so the translations do too rather
// than repeating the boilerplate eight times.
// ---------------------------------------------------------------------------

const CAPSTONE_TAIL_AR = `قدّم استمارة المشروع المنظّمة: مشكلة العمل، والعملية الحالية، وأين يساعد الذكاء الاصطناعي، وأمرك أو سير عملك، والمخرجات المتوقّعة، والمخاطر، وكيف ستتحقق من النتيجة، والفائدة التقديرية.

قاعدتان بشأن رقم الفائدة: قدّره انطلاقًا من شيء قِسته فعلًا (كم تستغرق المهمة اليوم)، وميّزه بوضوح على أنه تقدير. لا تخترع أرقامًا — «حوالي 40 دقيقة أسبوعيًا» بصدق أثمن من رقم واثق مُختلَق.

تُراجَع المشاريع المعتمدة ضمن مسار فرص الذكاء الاصطناعي في T&C، لذا قد يتحوّل التقديم الجيد إلى مشروع حقيقي.`;

const CAPSTONE_TAIL_TR = `Yapılandırılmış proje formunu gönderin: iş problemi, mevcut süreç, yapay zekânın nerede yardımcı olduğu, promptunuz veya akışınız, beklenen çıktı, riskler, sonucu nasıl doğrulayacağınız ve tahminî fayda.

Fayda rakamı için iki kural: gerçekten ölçtüğünüz bir şeyden yola çıkarak tahmin edin (görev bugün ne kadar sürüyor) ve açıkça tahmin olarak işaretleyin. Sayı uydurmayın — dürüst bir "haftada yaklaşık 40 dakika", kendinden emin bir uydurmadan daha değerlidir.

Onaylanan projeler T&C AI Fırsatları hattı için incelenir, bu yüzden iyi bir gönderim gerçek bir projeye dönüşebilir.`;

const capstone = (contextAr: string, contextTr: string): Body => ({
  ar: `${contextAr}\n\n${CAPSTONE_TAIL_AR}`,
  tr: `${contextTr}\n\n${CAPSTONE_TAIL_TR}`,
});

const QUIZ: Body = {
  ar: `فحص قصير قائم على سيناريوهات لهذا المقرر.`,
  tr: `Bu kurs için kısa, senaryo temelli bir kontrol.`,
};

// ---------------------------------------------------------------------------
// AI for Finance
// ---------------------------------------------------------------------------

const ROLE_FIN: Record<string, Body> = {
  "Excel calculates, AI explains": {
    ar: `أهم قاعدة في المالية: **احسب في Excel، واستخدم الذكاء الاصطناعي في اللغة المحيطة بالرقم.**

النماذج اللغوية غير موثوقة في الحساب متعدد الخطوات على قوائم طويلة. وهي ممتازة في تحويل جدول صحيح إلى فقرة يقرأها فعلًا مدير غير متخصص في المالية.

فسير العمل هو:

1. ابنِ جدول الانحرافات / الهوامش / التنبؤ في Excel كما تفعل دائمًا.
2. الصق الجدول *الملخّص ومنزوع التعريف* في الذكاء الاصطناعي.
3. اطلب التعليق أو الشرح أو الملخص التنفيذي.
4. تحقّق من كل رقم يعيده مقابل جدولك.

وحيث يساعد الذكاء الاصطناعي فعلًا في الخطوة الأولى هو **كتابة الصيغة، لا إجراء الحساب**: «أعطني صيغة Excel تُرجع نسبة الانحراف في العمود D مقابل الموازنة في العمود C، وتُظهر شرطة عندما تكون الموازنة صفرًا.» ثم تشغّل أنت تلك الصيغة على البيانات الحقيقية.`,
    tr: `Finansın en önemli kuralı: **aritmetiği Excel'de yapın, yapay zekâyı rakamın etrafındaki dil için kullanın.**

Dil modelleri uzun listelerde çok adımlı aritmetikte güvenilmezdir. Doğru bir tabloyu, finans dışı bir yöneticinin gerçekten okuyacağı bir paragrafa çevirmekte ise mükemmeldirler.

Yani akış şöyle:

1. Sapma / marj / tahmin tablosunu her zamanki gibi Excel'de kurun.
2. *Özetlenmiş ve kimliksizleştirilmiş* tabloyu yapay zekâya yapıştırın.
3. Yorumu, açıklamayı veya yönetici özetini isteyin.
4. Geri verdiği her rakamı kendi tablonuzla karşılaştırın.

Yapay zekânın birinci adımda gerçekten yardımcı olduğu yer **hesabı yapmak değil, formülü yazmaktır**: "Bana D sütununda, C sütunundaki bütçeye göre sapma yüzdesini döndüren, bütçe sıfırken tire gösteren bir Excel formülü ver." Formülü gerçek veride siz çalıştırırsınız.`,
  },

  "Variance analysis that gets read": {
    ar: `معظم تعليقات الانحرافات تفشل لأنها تعيد سرد الجدول. المدير يرى أصلًا أن المصروفات العامة ارتفعت 9%. ما يحتاجه هو *لماذا يهمّ ذلك وماذا نفعل*.

**أمر ينجح**

> أنا محلل مالي في مصنع ملابس. في الأسفل جدول انحرافات شهري ملخّص حسب مركز التكلفة، الفعلي مقابل الموازنة، مع نسبة الانحراف.
> اكتب تعليقًا لمدير العمليات. لكل انحراف يتجاوز 5%، أعطِ جملة واحدة عن المسبّبات المرجّحة استنادًا فقط إلى ما تُظهره البيانات، وسؤالًا واحدًا ينبغي أن يطرحه على صاحب مركز التكلفة.
> بحد أقصى 300 كلمة. لغة بسيطة، بدون مصطلحات مالية. مجمّعًا حسب مركز التكلفة.
> لا تتكهّن بما يتجاوز البيانات. وحيث يكون المسبّب غير واضح، قل ذلك صراحةً.

السطر الأخير مهم. بدونه ستحصل على تفسيرات واثقة مُختلَقة عن «الطلب الموسمي» الذي لا يعرف عنه شيئًا.`,
    tr: `Sapma yorumlarının çoğu, tabloyu yeniden anlattığı için başarısız olur. Yönetici genel giderlerin %9 arttığını zaten görüyor. İhtiyacı olan şey *bunun neden önemli olduğu ve ne yapılacağı*.

**İşe yarayan bir prompt**

> Bir konfeksiyon üreticisinde finans analistiyim. Aşağıda maliyet merkezine göre özetlenmiş aylık sapma tablosu var: gerçekleşen, bütçe ve yüzde sapma.
> Operasyon direktörü için yorum yaz. %5'in üzerindeki her sapma için, yalnızca verinin gösterdiğine dayanarak olası nedenler hakkında bir cümle ve maliyet merkezi sahibine sorması gereken bir soru ver.
> En fazla 300 kelime. Sade dil, finans jargonu yok. Maliyet merkezine göre grupla.
> Verinin ötesine geçip tahmin yürütme. Nedenin belirsiz olduğu yerde bunu açıkça söyle.

Son satır önemlidir. O olmadan, hiçbir şey bilmediği "mevsimsel talep" hakkında kendinden emin uydurma açıklamalar alırsınız.`,
  },

  "What never leaves finance": {
    ar: `لا تضع أبدًا في أداة غير معتمدة:

- التكاليف، والتكاليف المعيارية، والتكاليف الواصلة، والهوامش
- أسعار العملاء وشروط العقود
- شروط الدفع للموردين والحسومات
- بيانات الرواتب بأي شكل
- النتائج غير المنشورة والتوقعات ومواد مجلس الإدارة
- التفاصيل البنكية والتسهيلات الائتمانية ومراكز الخزينة

**خطوة إزالة التعريف في المالية:** غيّر مقياس كل شيء. بدّل العملة، وافهرس الأرقام إلى 100، واحذف اسم العميل ومركز التكلفة. عبارة «مركز تكلفة كان مؤشره 100 العام الماضي يعمل الآن عند 109» تعطيك المساعدة التحليلية نفسها تمامًا.`,
    tr: `Onaysız bir araca asla koymayın:

- Maliyetler, standart maliyetler, teslim maliyetleri, marjlar
- Müşteri fiyatları ve sözleşme şartları
- Tedarikçi ödeme şartları ve primler
- Her türden bordro verisi
- Yayımlanmamış sonuçlar, tahminler ve yönetim kurulu materyali
- Banka bilgileri, kredi limitleri, hazine pozisyonları

**Finans için kimliksizleştirme hamlesi:** her şeyin ölçeğini değiştirin. Para birimini değiştirin, rakamları 100'e endeksleyin, müşteri ve maliyet merkezi adını kaldırın. "Geçen yıl endeksi 100 olan bir maliyet merkezi şu anda 109'da" cümlesi size tam olarak aynı analitik yardımı sağlar.`,
  },

  "Management reporting pack": {
    ar: `نمط شهري قابل للتكرار:

1. **البيانات** — صدّر ملخصك من نظام ERP إلى جدول نظيف.
2. **السرد** — يصوغ الذكاء الاصطناعي التعليق من الجدول.
3. **الملخص التنفيذي** — يختصر الذكاء الاصطناعي السرد إلى خمس نقاط للصفحة الأولى.
4. **التحقق** — تفحص أنت كل رقم وكل ادعاء سببي.
5. **القالب** — احفظ الأمر في صندوق أدواتي وأعد استخدامه الشهر القادم.

وبمجرد وجود القالب، تهبط الحزمة الشهرية من ساعات إلى مراجعة. وهنا يكمن العائد الحقيقي — لا في أول إجابة ذكية، بل في الإجابة القابلة لإعادة الاستخدام.`,
    tr: `Tekrarlanabilir bir aylık desen:

1. **Veri** — ERP'den özetinizi temiz bir tabloya aktarın.
2. **Anlatı** — yapay zekâ tablodan yorumu yazar.
3. **Yönetici özeti** — yapay zekâ anlatıyı ilk sayfa için beş maddeye indirir.
4. **Doğrulama** — her rakamı ve her nedensellik iddiasını siz kontrol edersiniz.
5. **Şablon** — promptu AI Araç Kutum'a kaydedin ve gelecek ay yeniden kullanın.

Şablon bir kez var olduğunda aylık paket saatlerden bir incelemeye düşer. Asıl getiri oradadır — ilk akıllı cevapta değil, yeniden kullanılabilir olanda.`,
  },

  "Reading contracts and proposals": {
    ar: `لمستند مورّد أو عقد إيجار طويل:

> في الأسفل اتفاقية مورّد. أنتج، بهذا الترتيب:
> 1. الشروط التجارية — أساس التسعير، وشروط الدفع، وآلية الزيادة
> 2. الالتزامات علينا
> 3. الالتزامات عليهم
> 4. بنود الإنهاء والغرامات
> 5. أي شيء غير معتاد مقارنة باتفاقية توريد قياسية
> اذكر رقم البند لكل نقطة. وإن كان شيء غير مذكور في المستند، فأدرجه تحت «غير متناوَل» بدل افتراض عُرف السوق.

ثم اقرأ البنود التي استشهد بها. الذكاء الاصطناعي يضيّق عشرين صفحة إلى الخمس التي تحتاج إنسانًا — وهو لا يغني عن قراءة تلك الخمس.`,
    tr: `Uzun bir tedarikçi veya kira belgesi için:

> Aşağıda bir tedarikçi sözleşmesi var. Şu sırayla üret:
> 1. Ticari şartlar — fiyat esası, ödeme şartları, artış mekanizması
> 2. Bize düşen yükümlülükler
> 3. Onlara düşen yükümlülükler
> 4. Fesih ve ceza maddeleri
> 5. Standart bir tedarik sözleşmesine kıyasla olağandışı olan her şey
> Her nokta için madde numarasını belirt. Bir şey belgede belirtilmemişse, piyasa normu varsaymak yerine "Ele alınmamış" başlığı altında listele.

Sonra atıf yaptığı maddeleri okuyun. Yapay zekâ yirmi sayfayı insan gerektiren beş sayfaya indirir — o beşi okumanın yerine geçmez.`,
  },

  "Scenario narratives": {
    ar: `ابنِ السيناريوهات في نموذجك. واستخدم الذكاء الاصطناعي للتعبير عنها.

> لديّ ثلاثة سيناريوهات لسعر القطن العام القادم: الأساس، و+15%، و+30%. ونموذجي يعطي هامشًا إجماليًا 22% و18% و14% على التوالي.
> لكل سيناريو اكتب فقرة قصيرة لمجلس الإدارة تغطي الأثر على الهامش، وأداتين تشغيليتين متاحتين، وأبكر إشارة على أن هذا السيناريو يتحقق.
> لا تُدخل أرقامًا لم أعطها لك.

القيد في السطر الأخير هو ما يبقي المخرجات قابلة للاستخدام. بدونه تكتسب ملفات مجلس الإدارة أرقامًا مُختلَقة — وهو أكثر أنماط الفشل ضررًا في المالية.`,
    tr: `Senaryoları modelinizde kurun. İfade etmek için yapay zekâyı kullanın.

> Gelecek yılın pamuk fiyatı için üç senaryom var: baz, +%15 ve +%30. Modelim sırasıyla %22, %18 ve %14 brüt marj veriyor.
> Her senaryo için yönetim kuruluna kısa bir paragraf yaz: marj etkisi, elde bulunan iki operasyonel kaldıraç ve bu senaryonun gerçekleştiğine dair en erken sinyal.
> Sana vermediğim rakamları ekleme.

Son satırdaki kısıt, çıktıyı kullanılabilir tutan şeydir. O olmadan yönetim kurulu dosyaları uydurma rakamlar edinir — finanstaki en zararlı hata biçimi budur.`,
  },

  "Financial presentations": {
    ar: `تحويل حزمة إلى عرض تقديمي مسألة هيكلة، والذكاء الاصطناعي جيد فيها.

> في الأسفل تعليق مالي شهري من ثلاث صفحات. حوّله إلى مخطط عرض من 8 شرائح لاجتماع إدارة مدته 15 دقيقة.
> لكل شريحة أعطِ عنوانًا يذكر الخلاصة (لا الموضوع)، وثلاث نقاط داعمة.
> الجمهور غير متخصص في المالية. افترض أنهم لن يقرأوا الملحق.

عبارة «عناوين تذكر الخلاصة» هي التعليمة التي تفصل بين عرض مفيد وقائمة محتويات.`,
    tr: `Bir paketi sunuma çevirmek bir yapılandırma problemidir ve yapay zekâ bunu iyi yapar.

> Aşağıda üç sayfalık aylık finans yorumu var. Bunu 15 dakikalık bir yönetim toplantısı için 8 slaytlık bir taslağa çevir.
> Her slayt için konuyu değil sonucu söyleyen bir başlık ve üç destekleyici madde ver.
> Hedef kitle finans kökenli değil. Eki okumayacaklarını varsay.

"Sonucu söyleyen başlıklar", yararlı bir sunumu bir içindekiler listesinden ayıran talimattır.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة مالية حقيقية: تعليق إقفال الشهر، أو حزمة انحرافات، أو مراجعة عقد مورّد، أو سردية موازنة.`,
    `Gerçek bir finans görevi seçin: ay sonu yorumu, bir sapma paketi, bir tedarikçi sözleşmesi incelemesi ya da bir bütçe anlatısı.`,
  ),

  "AI for Finance assessment": QUIZ,
};

// ---------------------------------------------------------------------------
// AI for HR
// ---------------------------------------------------------------------------

const ROLE_HR: Record<string, Body> = {
  "AI structures, humans decide": {
    ar: `في الموارد البشرية يكون الحد أوضح منه في أي مكان آخر في الشركة.

**يجوز للذكاء الاصطناعي:** صياغة وصف وظيفي، وتوليد أسئلة مقابلة متسقة، وتلخيص سياسة، وإنتاج قائمة تهيئة، وتجميع تعليقات الاستبيانات في مواضيع، وصياغة رسالة.

**لا يجوز للذكاء الاصطناعي:** تقييم مرشّح، أو ترتيب المتقدمين، أو استبعاد أحد، أو صياغة نتيجة تأديبية، أو إنتاج توصية بترقية أو إنهاء خدمة.

والسبب ليس بيروقراطيًا. النماذج تعيد إنتاج الأنماط الموجودة في بيانات تدريبها، بما فيها المتحيّزة، وتفعل ذلك بشكل غير مرئي ومتّسق — وهو ما يحوّل تحيّزًا فرديًا إلى تحيّز منهجي يُطبَّق على مئات الأشخاص.

**لا تلصق أبدًا** سيرًا ذاتية أو تقييمات أو رواتب أو ملاحظات طبية أو سجلات تأديبية أو تفاصيل تظلّمات في أداة عامة. إن احتجت مساعدة في حالة قائمة، فصِف الموقف دون الشخص.`,
    tr: `İnsan Kaynakları'nda sınır, şirketin başka hiçbir yerinde olmadığı kadar keskindir.

**Yapay zekâ şunları yapabilir:** görev tanımı taslağı, tutarlı mülakat soruları, politika özeti, oryantasyon kontrol listesi, anket yorumlarını temalara ayırma, duyuru taslağı.

**Yapay zekâ şunları yapamaz:** bir adayı puanlamak, başvuranları sıralamak, birini elemek, disiplin sonucu yazmak ya da terfi veya işten çıkarma önerisi üretmek.

Sebep bürokratik değil. Modeller eğitim verisindeki desenleri — önyargılı olanlar dahil — yeniden üretir ve bunu görünmez ve tutarlı biçimde yapar; bu da tek bir önyargıyı yüzlerce kişiye uygulanan sistematik bir önyargıya çevirir.

**Asla yapıştırmayın:** CV'ler, değerlendirmeler, maaşlar, sağlık notları, disiplin kayıtları veya şikâyet ayrıntıları — herkese açık bir araca. Devam eden bir vaka için yardım gerekiyorsa, durumu kişi olmadan anlatın.`,
  },

  "CV work, done safely": {
    ar: `لا يمكنك لصق سيرة ذاتية في أداة عامة. لكن *يمكنك* استخدام الذكاء الاصطناعي لجعل فرزك أنت أكثر اتساقًا.

> أوظّف مخطّط إنتاج في مصنع ملابس. صُغ إطار تقييم منظّمًا من 6 معايير، لكل منها تعريف واضح وشكل الإجابة الضعيفة / المقبولة / القوية.
> يجب أن يكون الإطار قابلًا للتطبيق على أي مرشّح، وألّا يشير إلى العمر أو الجنس أو الجنسية أو الحالة الاجتماعية أو الصور.

ثم تطبّق أنت ذلك الإطار بنفسك، على سير ذاتية حقيقية، داخل أنظمتنا. الذكاء الاصطناعي حسّن *العملية*؛ ولم يرَ أي مرشّح.`,
    tr: `Herkese açık bir araca CV yapıştıramazsınız. Ama yapay zekâyı *kendi* elemenizi daha tutarlı hale getirmek için kullanabilirsiniz.

> Bir konfeksiyon üreticisinde Üretim Planlamacısı arıyorum. Her biri net bir tanıma ve zayıf / yeterli / güçlü bir cevabın nasıl göründüğüne sahip 6 kriterden oluşan yapılandırılmış bir değerlendirme çerçevesi hazırla.
> Çerçeve her adaya uygulanabilir olmalı ve yaş, cinsiyet, uyruk, medeni durum veya fotoğrafa atıf yapmamalı.

Sonra o çerçeveyi kendiniz, gerçek CV'lere, kendi sistemlerimizin içinde uygularsınız. Yapay zekâ *süreci* iyileştirdi; hiçbir adayı görmedi.`,
  },

  "Job descriptions and adverts": {
    ar: `> صُغ وصفًا وظيفيًا لمهندس جودة في مصنع ملابس (نحو 800 موظف، موجّه للتصدير).
> أدرج: الغرض، و6-8 مسؤوليات، والمتطلبات الأساسية، والمتطلبات المفضّلة، وخط التبعية لمدير الجودة.
> نبرة محايدة وواقعية — بدون لغة تسويقية، وبدون «نجم»، وبدون صياغة تحمل تحيّزًا جندريًا.
> أشِر إلى أي مسؤولية استنتجتها بدل أن تكون معتادة في هذا الدور، حتى أؤكّدها.

راجع دائمًا مقابل الدور الحقيقي. المسودة بنية انطلاق، وليست وصفًا لوظيفتنا *نحن*.`,
    tr: `> Bir konfeksiyon üreticisi (yaklaşık 800 çalışan, ihracat odaklı) için Kalite Mühendisi görev tanımı hazırla.
> Şunları içersin: amaç, 6-8 sorumluluk, zorunlu gereklilikler, tercih edilen gereklilikler ve Kalite Müdürü'ne raporlama hattı.
> Tarafsız, olgusal ton — pazarlama dili yok, "yıldız" yok, cinsiyetli ifade yok.
> Rol için tipik olmaktan ziyade çıkarımla eklediğin her sorumluluğu işaretle ki teyit edebileyim.

Her zaman gerçek rolle karşılaştırıp gözden geçirin. Taslak bir başlangıç yapısıdır, *bizim* işimizin tanımı değil.`,
  },

  "Policy in plain language": {
    ar: `تفشل السياسات حين لا يقرأها أحد.

> في الأسفل سياسة الحضور لدينا. أنتج ملخصًا للموظفين من صفحة واحدة بمستوى قراءة يناسب الصف الثامن تقريبًا.
> غطِّ: ما هو متوقَّع، وكيف يُبلَّغ عن الغياب، وماذا يحدث إن لم تُتّبع الإجراءات، وبمن يُتصل.
> استخدم جملًا قصيرة وقائمة «ما عليك فعله». لا تضف أي قاعدة غير موجودة في النص المصدر.

ثم اجعل مالك السياسة يراجعه. الملخص الذي ينحرف عن السياسة أسوأ من عدم وجود ملخص.`,
    tr: `Politikalar kimse okumadığında başarısız olur.

> Aşağıda devam politikamız var. Yaklaşık 8. sınıf okuma düzeyinde, tek sayfalık bir çalışan özeti üret.
> Şunları kapsa: ne beklendiği, devamsızlığın nasıl bildirileceği, süreç izlenmezse ne olacağı ve kime başvurulacağı.
> Kısa cümleler ve bir "ne yapmanız gerekiyor" listesi kullan. Kaynak metinde olmayan hiçbir kuralı ekleme.

Sonra politikanın sahibine kontrol ettirin. Politikadan sapan bir özet, hiç özet olmamasından kötüdür.`,
  },

  "Survey and feedback themes": {
    ar: `تعليقات الاستبيانات النصية الحرة هي مشكلة التحليل الكلاسيكية في الموارد البشرية: أكثر من أن تُقرأ، وأثمن من أن تُهمَل.

> في الأسفل 200 رد نصي مجهول على سؤال «ما الذي سيحسّن أسبوع عملك أكثر؟»
> جمّعها في 8 مواضيع كحد أقصى. ولكل موضوع أعطِ اسمًا وعددًا تقريبيًا واقتباسين تمثيليين.
> لا تُعِد صياغة الاقتباسات — استخدمها حرفيًا. وأشِر بشكل منفصل إلى أي تعليق يوحي بمخاوف تتعلق بالسلامة أو التحرش لمراجعة بشرية.

**قبل أن تلصق:** تأكّد أن الردود مجهولة فعلًا ولا تحتوي أسماء. واحذف أي رد يحدّد هوية شخص.`,
    tr: `Serbest metinli anket yorumları İK'nın klasik analiz problemidir: okunamayacak kadar çok, göz ardı edilemeyecek kadar değerli.

> Aşağıda "Çalışma haftanızı en çok ne iyileştirirdi?" sorusuna verilmiş 200 anonim serbest metin yanıtı var.
> Bunları en fazla 8 temaya ayır. Her tema için bir ad, yaklaşık bir sayı ve iki temsilî alıntı ver.
> Alıntıları başka sözcüklerle anlatma — birebir kullan. Güvenlik veya taciz endişesi düşündüren her yorumu insan incelemesi için ayrıca işaretle.

**Yapıştırmadan önce:** yanıtların gerçekten anonim olduğunu ve isim içermediğini teyit edin. Bir kişiyi tanımlayan her yanıtı çıkarın.`,
  },

  "Employee communication": {
    ar: `> صُغ إعلانًا لجميع موظفي المصنع بشأن تغيير في أنماط الورديات يبدأ الشهر القادم.
> النبرة: محترمة ومباشرة وغير مؤسسية جافة. نحو 250 كلمة.
> غطِّ: ما الذي يتغيّر، ومتى، ولماذا، وماذا يعني للأجر، وأين تُطرح الأسئلة.
> أنتج نسخة إنجليزية وبيّن أي الأجزاء ستحتاج ترجمة دقيقة إلى العربية.

رسائل الموظفين لها وزن أكبر مما نفترض. صُغها بالذكاء الاصطناعي، ثم اقرأها مرة واحدة كما لو كنت في أرض المصنع تستقبلها.`,
    tr: `> Gelecek ay başlayacak vardiya düzeni değişikliği hakkında tüm fabrika çalışanlarına bir duyuru hazırla.
> Ton: saygılı, doğrudan, kurumsal-kuru değil. Yaklaşık 250 kelime.
> Şunları kapsa: neyin değiştiği, ne zaman, neden, ücret açısından ne anlama geldiği ve soruların nereye sorulacağı.
> İngilizce bir sürüm üret ve hangi kısımların Arapçaya dikkatli çeviri gerektireceğini belirt.

Çalışan duyuruları sandığımızdan daha fazla ağırlık taşır. Yapay zekâ ile yazın, sonra sahada onu alan biriymişsiniz gibi bir kez okuyun.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة حقيقية في الموارد البشرية: إطار توظيف، أو ملخص سياسة، أو حزمة تهيئة، أو تحليل استبيان.`,
    `Gerçek bir İK görevi seçin: bir işe alım çerçevesi, bir politika özeti, bir oryantasyon paketi ya da anket analizi.`,
  ),

  "AI for HR assessment": QUIZ,
};

// ---------------------------------------------------------------------------
// AI for Production
// ---------------------------------------------------------------------------

const ROLE_PRD: Record<string, Body> = {
  "The downtime summary": {
    ar: `كل خط يحتفظ بملاحظات. ولا أحد تقريبًا لديه وقت لتحويل أسبوع منها إلى شيء مفيد.

> في الأسفل سبعة أيام من ملاحظات تسليم الورديات في خط خياطة. وهي غير رسمية وغير متسقة.
> أنتج: (1) جدولًا بأحداث التوقف مع المدة التقريبية والسبب المذكور، (2) الأسباب الثلاثة الأكثر تكرارًا بإجمالي الدقائق، (3) أي حدث يكون سببه غير واضح أو مفقود.
> استخدم ما هو مكتوب فقط. لا تستنتج سببًا غير مذكور — أدرج تلك تحت «السبب غير مسجَّل».

النقطة الثالثة هي عادةً أثمن المخرجات. فهي تخبرك أين تفشل عملية التسجيل لديك، وهي مشكلة قابلة للإصلاح.`,
    tr: `Her hat not tutar. Neredeyse kimsenin bir haftalık notu işe yarar bir şeye çevirecek vakti yoktur.

> Aşağıda bir dikim hattından yedi günlük vardiya devir notları var. Gayriresmî ve tutarsızlar.
> Şunları üret: (1) yaklaşık süre ve belirtilen nedenle birlikte duruş olayları tablosu, (2) toplam dakikaya göre en sık üç neden, (3) nedeni belirsiz veya eksik olan her olay.
> Yalnızca yazılanı kullan. Belirtilmemiş bir nedeni çıkarımla üretme — onları "neden kaydedilmemiş" altında listele.

Üçüncü madde genelde en değerli çıktıdır. Kayıt sürecinizin nerede aksadığını söyler ve bu düzeltilebilir bir sorundur.`,
  },

  "Efficiency and bottlenecks": {
    ar: `احسب الكفاءة في نظامك. واستخدم الذكاء الاصطناعي لتفسيرها وهيكلة المتابعة.

> كفاءة الخط حسب العملية للأسبوع الماضي: [جدول]. المستهدف 85%.
> حدّد العمليات التي تقع تحت المستهدف، وهل تتجمّع في مرحلة معيّنة من التدفق، ولكل واحدة اسرد ثلاثة أسباب محتملة يفحصها مهندس صناعي أولًا.
> قدّمها كخطة تحقيق قصيرة تبيّن ما يجب ملاحظته وما البيانات التي يجب جمعها.
> لا تستنتج سببًا — هذه خطة لا تشخيص.

المخرَج قائمة فحص لشخص سيذهب ويرى بنفسه. هذا التأطير هو ما يبقيها صادقة.`,
    tr: `Verimliliği kendi sisteminizde hesaplayın. Yorumlamak ve takibi yapılandırmak için yapay zekâyı kullanın.

> Geçen haftanın operasyon bazında hat verimliliği: [tablo]. Hedef %85.
> Hangi operasyonların hedefin altında kaldığını, akışın belirli bir aşamasında kümelenip kümelenmediklerini belirle ve her biri için bir endüstri mühendisinin önce kontrol edeceği üç olası nedeni listele.
> Neyin gözlemleneceğini ve hangi verinin toplanacağını gösteren kısa bir inceleme planı olarak sun.
> Bir neden sonucuna varma — bu bir plan, teşhis değil.

Çıktı, gidip bakacak bir kişi için bir kontrol listesidir. Bu çerçeveleme onu dürüst tutar.`,
  },

  "Structured root cause analysis": {
    ar: `الذكاء الاصطناعي مُيسِّر جيد لجلسة الأسباب الخمسة أو مخطط السبب والأثر، لأنه لا يملّ أبدًا من طرح السؤال التالي.

> حدث توقف لثلاث ساعات في خط التشطيب. السبب المذكور كان «عطل مكبس البخار».
> أدِر تحليل الأسباب الخمسة. اسألني سؤالًا واحدًا في كل مرة وانتظر إجابتي قبل أن تكمل.
> وفي النهاية، لخّص السلسلة، وميّز السبب المباشر عن السبب النظامي، واقترح إجراء احتواء واحدًا وإجراءً وقائيًا واحدًا.

عبارة «سؤال واحد في كل مرة» تحوّله من مولّد نصوص إلى مُحاوِر، وهو ما تريده فعلًا.`,
    tr: `Yapay zekâ, bir 5-Neden veya balık kılçığı oturumu için iyi bir kolaylaştırıcıdır; çünkü bir sonraki soruyu sormaktan asla yorulmaz.

> Finisaj hattında 3 saatlik bir duruş yaşadık. Belirtilen neden "buharlı pres arızası" idi.
> Bir 5-Neden analizi yürüt. Her seferinde tek soru sor ve devam etmeden önce cevabımı bekle.
> Sonunda zinciri özetle, doğrudan nedeni sistemik olandan ayır ve bir kontrol altına alma ile bir önleyici faaliyet öner.

"Her seferinde tek soru" onu bir metin üreticisinden bir görüşmeciye dönüştürür; asıl istediğiniz de budur.`,
  },

  "Writing an SOP that gets followed": {
    ar: `أفضل إجراءات التشغيل تأتي من المشغّل الذي يؤدّي العمل. العائق هو كتابتها.

> سأصف كيف يجهّز أكثر مشغّلينا خبرةً طاولة القص. حوّله إلى إجراء تشغيل قياسي يتضمّن: الغرض، والنطاق، ومعدات الوقاية وملاحظات السلامة، وخطوات مرقّمة، وفحوصًا بعد كل مرحلة، والأخطاء الشائعة.
> يجب أن تكون الخطوات أوامر قصيرة. وأشِر إلى أي موضع يكون وصفي فيه غامضًا بدل أن تملأ الفراغ بنفسك.

سجّل المشغّل وهو يشرح، واكتب الملاحظات الأولية، ودع الذكاء الاصطناعي يهيكلها. ثم يراجع المشغّل الإجراء — سيكتشف الخطوتين اللتين فاتتاك.`,
    tr: `En iyi SOP'lar işi yapan operatörden gelir. Engel, onları yazıya dökmektir.

> En deneyimli operatörümüzün kesim masasını nasıl hazırladığını anlatacağım. Bunu şunları içeren bir SOP'a çevir: amaç, kapsam, KKD ve güvenlik notları, numaralı adımlar, her aşamadan sonraki kontroller ve sık yapılan hatalar.
> Adımlar kısa emir cümleleri olmalı. Anlatımımın belirsiz olduğu her yeri, boşluğu kendin doldurmak yerine işaretle.

Operatörü anlatırken kaydedin, ham notları yazın ve yapay zekânın yapılandırmasına bırakın. Sonra operatör SOP'u gözden geçirsin — atladığınız iki adımı o fark edecek.`,
  },

  "The daily production report": {
    ar: `> في الأسفل أرقام إنتاج اليوم حسب الخط: المخرجات، والمستهدف، والكفاءة، ودقائق التوقف، وأكثر عيب تكرارًا.
> اكتب ملخصًا يوميًا من 150 كلمة لمدير الإنتاج. ابدأ بما يحتاج قرارًا اليوم. ثم سطر واحد لحالة كل خط. واختم بمخاطر الغد.
> لا تكرّر كل رقم — فقط الأرقام التي غيّرت الصورة.

القيد الأخير هو ما يجعله قابلًا للقراءة. التقرير الذي يكرّر الجدول هو جدول بخطوات إضافية.`,
    tr: `> Aşağıda bugünün hat bazında üretim rakamları var: çıktı, hedef, verimlilik, duruş dakikası, en sık hata.
> Üretim müdürü için 150 kelimelik günlük bir özet yaz. Bugün karar gerektiren şeyle başla. Sonra her hat için tek satır durum. Yarının riskiyle bitir.
> Her rakamı tekrarlama — yalnızca tabloyu değiştirenleri.

Son kısıt onu okunabilir kılan şeydir. Tabloyu tekrarlayan bir rapor, fazladan adımları olan bir tablodur.`,
  },

  "Finding what to improve": {
    ar: `> إليك المشكلات المتكررة التي أُثيرت في آخر ست اجتماعات إنتاج أسبوعية: [قائمة].
> جمّعها حسب الموضوع الكامن وراءها لا حسب طريقة وصفها. ولكل موضوع، دوّن كم مرة ظهر وهل يبدو مشكلة أشخاص أم آلات أم طرق أم مواد.
> ثم رتّب المواضيع بحسب تكرار ظهورها مقابل مدى سهولة احتواء الحل، واشرح الترتيب.

المشكلات المتكررة هدف تحسين أفضل من الحوادث الفردية المثيرة، وهي بالضبط ما يضيع في محاضر الاجتماعات.`,
    tr: `> Son altı haftalık üretim toplantısında gündeme gelen tekrarlayan sorunlar: [liste].
> Bunları nasıl tarif edildiklerine göre değil, altta yatan temaya göre grupla. Her tema için kaç kez göründüğünü ve bunun bir insan, makine, yöntem mi yoksa malzeme sorunu mu göründüğünü not et.
> Sonra temaları görülme sıklığına karşı çözümün ne kadar kolay kontrol altına alınabildiğine göre sırala ve sıralamayı açıkla.

Tekrarlayan sorunlar, çarpıcı tek seferlik olaylardan daha iyi bir iyileştirme hedefidir ve toplantı tutanaklarında kaybolan tam da onlardır.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة إنتاج حقيقية: تحليل توقفات، أو إجراء تشغيل قياسي، أو تقرير يومي، أو تحقيق في الأسباب الجذرية.`,
    `Gerçek bir üretim görevi seçin: bir duruş analizi, bir SOP, bir günlük rapor ya da bir kök neden incelemesi.`,
  ),

  "AI for Production assessment": QUIZ,
};

// ---------------------------------------------------------------------------
// AI for Quality
// ---------------------------------------------------------------------------

const ROLE_QLT: Record<string, Body> = {
  "Classifying free-text defects": {
    ar: `يصف المفتشون العيب نفسه بخمس طرق مختلفة. هذا التفاوت هو ما يمنع تحليل البيانات.

> في الأسفل 300 وصف عيب نصي حر من الفحص النهائي.
> اربط كل واحد بفئة قياسية من هذه القائمة: [تصنيف العيوب لديك].
> أخرِج جدولًا: النص الأصلي، والفئة المسنَدة، ودرجة الثقة (مرتفعة/متوسطة/منخفضة).
> وحيث لا ينطبق وصف على أي فئة أو يكون مبهمًا جدًا، ضع «غير مصنَّف» — ولا تفرض ملاءمة.

راجع بنفسك كل صف منخفض الثقة أو غير مصنَّف. هذه الصفوف هي حيث يحتاج تصنيفك إلى عمل، وهي أثمن من الصفوف التي أصابها.`,
    tr: `Denetçiler aynı hatayı beş farklı şekilde tarif eder. Verinin analiz edilememesinin sebebi bu tutarsızlıktır.

> Aşağıda son kontrolden 300 serbest metinli hata açıklaması var.
> Her birini şu listedeki standart bir kategoriye eşle: [hata taksonominiz].
> Bir tablo üret: özgün metin, atanan kategori, güven (yüksek/orta/düşük).
> Bir açıklama hiçbir kategoriye uymuyorsa veya çok belirsizse "sınıflandırılmamış" olarak işaretle — zorlama bir eşleme yapma.

Düşük güvenli ve sınıflandırılmamış her satırı kendiniz gözden geçirin. Taksonominizin çalışma gerektirdiği yer o satırlardır ve doğru eşleşenlerden daha değerlidirler.`,
  },

  "Pareto that changes a decision": {
    ar: `ابنِ تحليل باريتو في Excel. واستخدم الذكاء الاصطناعي في بناء الحجة.

> تحليل باريتو للعيوب للشهر الماضي: [الفئة، العدد، % من الإجمالي، % تراكمية].
> اكتب نصف صفحة لمراجعة إدارة الجودة: أي الفئات تشكّل 80% من العيوب، وماذا توحي أكبر فئتين عن الموضع في العملية الذي تنشأ منه، وما الذي يجب التحقيق فيه أولًا.
> ميّز بوضوح بين ما تُظهره البيانات وما تستنتجه.

هذه التعليمة الأخيرة هي الفرق بين التحليل والتكهّن المتنكّر في هيئة تحليل.`,
    tr: `Pareto'yu Excel'de kurun. Argümanı kurmak için yapay zekâyı kullanın.

> Geçen ayın hata Pareto'su: [kategori, adet, toplamın %'si, kümülatif %].
> Kalite yönetim gözden geçirmesi için yarım sayfa yaz: hangi kategoriler hataların %80'ini oluşturuyor, en büyük ikisi süreçte nereden kaynaklandıklarına dair ne söylüyor ve önce neyin incelenmesi gerekiyor.
> Verinin gösterdiği ile çıkarımla ürettiğini net biçimde ayır.

Bu son talimat, analiz ile analiz kılığına girmiş spekülasyon arasındaki farktır.`,
  },

  "Drafting a CAPA": {
    ar: `> صُغ إجراءً تصحيحيًا ووقائيًا لهذه الملاحظة: «تلف متكرر بالإبرة على القماش التريكو في قسم الخياطة، بنسبة 2.4% من القطع المفحوصة على مدى ثلاثة أسابيع.»
> البنية: بيان المشكلة، والاحتواء الفوري، ومنهج التحقيق في السبب الجذري، والإجراء التصحيحي، والإجراء الوقائي، وفحص الفاعلية بمعيار قابل للقياس وتاريخ مراجعة، والدور المسؤول.
> لا تذكر سببًا جذريًا — فالتحقيق لم يحدث بعد. اترك ذلك القسم كمنهج.

الإجراء التصحيحي الذي يسمّي سببًا جذريًا قبل التحقيق هو أكثر ملاحظات التدقيق شيوعًا على الإطلاق. والقيد أعلاه يمنع ذلك بالضبط.`,
    tr: `> Şu bulgu için bir CAPA hazırla: "Dikim bölümünde örme kumaşta tekrarlayan iğne hasarı, üç hafta boyunca kontrol edilen parçaların %2,4'ünde."
> Yapı: problem tanımı, acil kontrol altına alma, kök neden inceleme yöntemi, düzeltici faaliyet, önleyici faaliyet, ölçülebilir bir kriter ve gözden geçirme tarihiyle etkinlik kontrolü ve sorumlu rol.
> Bir kök neden belirtme — inceleme henüz yapılmadı. O bölümü bir yöntem olarak bırak.

İnceleme yapılmadan kök neden adı koyan bir CAPA, var olan en yaygın denetim bulgusudur. Yukarıdaki kısıt tam olarak bunu engeller.`,
  },

  "Inspection report summaries": {
    ar: `> في الأسفل 12 تقرير فحص أثناء الخط من هذا الأسبوع.
> أنتج ملخصًا من صفحة واحدة: إجمالي القطع المفحوصة، ومعدل العيوب الكلي، وأكثر ثلاثة عيوب شيوعًا مع الأعداد، وأي خط يتكرر ظهوره، وأي تقرير به بيانات ناقصة أو غير متسقة.
> اذكر أرقام التقارير لكل نقطة حتى يمكن تتبّع كل منها.
> لا تحسب معدلات لم أقدّمها — وإن كان إجمالي ما مفقودًا، فقل ذلك.

المطلوب هنا هو قابلية التتبّع. ملخص تدقيق لا يمكن إرجاعه إلى تقارير مصدره ليس دليلًا صالحًا للاستخدام.`,
    tr: `> Aşağıda bu haftadan 12 hat içi muayene raporu var.
> Tek sayfalık bir özet üret: kontrol edilen toplam parça, genel hata oranı, adetleriyle en sık üç hata, tekrar tekrar görünen herhangi bir hat ve verisi eksik veya tutarsız olan her rapor.
> Her nokta için rapor numaralarını belirt ki her biri izlenebilsin.
> Vermediğim oranları hesaplama — bir toplam eksikse bunu söyle.

Buradaki gereklilik izlenebilirliktir. Kaynak raporlara geri izlenemeyen bir denetim özeti kullanılabilir kanıt değildir.`,
  },

  "Quality trend analysis": {
    ar: `> معدلات العيوب الشهرية حسب الفئة لآخر 12 شهرًا: [جدول].
> حدّد أي الفئات في اتجاه صاعد، وأيها مستقرة، وأيها تُظهر موسمية. ودوّن أي شهر يكسر النمط.
> ولكل اتجاه صاعد، اسرد الأدلة التي تؤكد أو تنفي وجود تدهور حقيقي مقابل تغيّر في طريقة فحصنا.

الجزء الأخير أهم مما يبدو. فارتفاع معدل العيوب كثيرًا ما يعني أن الفحص تحسّن، والخلط بين الأمرين يرسل الفرق للركض خلف المشكلة الخطأ.`,
    tr: `> Son 12 ayın kategori bazında aylık hata oranları: [tablo].
> Hangi kategorilerin yükselişte, hangilerinin durağan olduğunu ve hangilerinin mevsimsellik gösterdiğini belirle. Deseni bozan her ayı not et.
> Yükselen her eğilim için, gerçek bir kötüleşme mi yoksa kontrol biçimimizdeki bir değişiklik mi olduğunu doğrulayacak veya eleyecek kanıtları listele.

Son kısım göründüğünden daha önemli. Yükselen bir hata oranı çoğu zaman kontrolün iyileştiğini gösterir ve ikisini karıştırmak ekipleri yanlış sorunun peşine düşürür.`,
  },

  "Computer vision: a realistic view": {
    ar: `الفحص البصري الآلي حقيقي في صناعة الملابس، لكنه مشروع لا أداة تشغّلها بضغطة زر.

**يعمل بشكل معقول اليوم:** العيوب المتسقة عالية التباين جيدة الإضاءة على سطح مضبوط — الثقوب، والبقع، وبعض عيوب الطباعة.

**ما زال صعبًا:** اختلافات الدرجة اللونية الطفيفة، وملمس القماش، وأي شيء يتطلب حكمًا على القبول، وأي شيء يعتمد فيه تعريف «العيب» على معيار العميل.

**ما يحتاجه:** آلاف الصور الموسومة، وإضاءة وتثبيت مستقران، وعملية إعادة تدريب مع تغيّر الأقمشة، ومسار بشري لأي شيء لا يكون النموذج متأكدًا منه.

الخطوة الأولى المفيدة ليست شراء نظام. بل البدء بتصوير العيوب ووسمها بشكل متسق — فمجموعة البيانات تلك هي الأصل الحقيقي، وبناؤها يستغرق شهورًا.`,
    tr: `Otomatik görsel muayene konfeksiyonda gerçektir, ama bu bir proje — düğmesine bastığınız bir araç değil.

**Bugün makul çalışıyor:** kontrollü bir yüzeyde tutarlı, yüksek kontrastlı, iyi aydınlatılmış hatalar — delikler, lekeler, bazı baskı hataları.

**Hâlâ zor:** ince ton farkları, kumaş tuşesi, kabul edilebilirlik hakkında yargı gerektiren her şey ve "hata" tanımının müşterinin standardına bağlı olduğu her durum.

**Gerekenler:** binlerce etiketli görüntü, kararlı aydınlatma ve fikstür, kumaşlar değiştikçe yeniden eğitim süreci ve modelin emin olmadığı her şey için bir insan yolu.

Yararlı ilk adım bir sistem satın almak değildir. Hataları tutarlı biçimde fotoğraflamaya ve etiketlemeye başlamaktır — asıl varlık o veri kümesidir ve oluşturulması aylar alır.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة جودة حقيقية: تصنيف عيوب، أو إجراءً تصحيحيًا ووقائيًا، أو تحليل اتجاهات، أو ملخص تدقيق.`,
    `Gerçek bir kalite görevi seçin: hata sınıflandırma, bir CAPA, bir trend analizi ya da bir denetim özeti.`,
  ),

  "AI for Quality assessment": QUIZ,
};

// ---------------------------------------------------------------------------
// AI for Supply Chain
// ---------------------------------------------------------------------------

const ROLE_SCM: Record<string, Body> = {
  "Comparing three quotations": {
    ar: `المهمة الكلاسيكية للذكاء الاصطناعي في سلسلة الإمداد، وهي مهمة جيدة — ما دمت *أنت* من يضع المعايير.

> أقارن ثلاثة عروض أسعار من موردين لـ [السلعة]. العروض في الأسفل، وقد حُذفت أسماء الموردين.
> ابنِ جدول مقارنة بهذه المعايير: أساس سعر الوحدة، والحد الأدنى للطلب، ومهلة التوريد، وشروط الدفع، وضمانات الجودة، وبنود الغرامات، وما لا يذكره كل عرض.
> ثم أعطِ تقييم مخاطر قصيرًا لكل عرض، وتوصية مع تبريرها.
> لا تحدّد أوزان المعايير بنفسك — إن لزمت مفاضلة، فاعرضها ودعني أقرّر.

احذف أسماء الموردين وأي تسعير لا تريده خارج T&C. التحليل جيد بالقدر نفسه على «المورّد أ / ب / ج».`,
    tr: `Tedarik zincirinin klasik yapay zekâ görevi ve iyi bir görev — kriterleri *siz* belirlediğiniz sürece.

> [Ürün] için üç tedarikçi teklifini karşılaştırıyorum. Teklifler aşağıda, tedarikçi adları kaldırılmış.
> Şu kriterlerle bir karşılaştırma tablosu kur: birim fiyat esası, asgari sipariş miktarı, teslim süresi, ödeme şartları, kalite garantileri, ceza maddeleri ve her teklifin neyi belirtmediği.
> Sonra her biri için kısa bir risk değerlendirmesi ve gerekçesiyle bir öneri ver.
> Kriterleri kendin ağırlıklandırma — bir ödünleşim gerekiyorsa sun ve kararı bana bırak.

Tedarikçi adlarını ve T&C dışında olmasını istemeyeceğiniz her fiyatı çıkarın. Analiz "Tedarikçi A / B / C" ile de aynı derecede iyidir.`,
  },

  "What the quotation does not say": {
    ar: `الشروط الغائبة تكلّف أكثر من الشروط السيئة، لأن لا أحد يجادل فيها حتى يفوت الأوان.

> في الأسفل عرض سعر من مورّد. اسرد كل ما يتوقّع مدير مشتريات عادةً أن يراه وهو غائب أو غامض — شروط التسليم الدولية، والعملة، ومدة الصلاحية، وآلية الزيادة، والتغليف، وحقوق الفحص، والتعويض عن التأخير.
> ولكل ثغرة، صُغ سؤالًا مباشرًا واحدًا يُرسَل إلى المورّد.
> لا تفترض انطباق عُرف سوقي حيث يسكت المستند.

تحصل على رسالة استيضاح جاهزة للإرسال وموقف تفاوضي أقوى بكثير.`,
    tr: `Eksik şartlar, kötü şartlardan daha pahalıya mal olur; çünkü iş işten geçene kadar kimse onları tartışmaz.

> Aşağıda bir tedarikçi teklifi var. Bir satın alma müdürünün normalde görmeyi bekleyeceği ama eksik veya belirsiz olan her şeyi listele — incoterms, para birimi, geçerlilik süresi, artış mekanizması, ambalaj, muayene hakları, geç teslimatın telafisi.
> Her boşluk için tedarikçiye gönderilecek doğrudan bir soru yaz.
> Belgenin sessiz kaldığı yerde bir piyasa standardının geçerli olduğunu varsayma.

Gönderilmeye hazır bir açıklama talebi e-postası ve çok daha güçlü bir pazarlık pozisyonu elde edersiniz.`,
  },

  "Framing a demand question": {
    ar: `لن يتنبّأ الذكاء الاصطناعي بطلبك. لكنه جيد جدًا في مساعدتك على طرح السؤال الصحيح على بياناتك أنت.

> أخطّط للمواد الخام في مصنع ملابس. لديّ 24 شهرًا من الاستهلاك حسب المادة، وتغطية دفتر الطلبات للأشهر الثلاثة القادمة.
> اسرد التحليلات التي ينبغي أن أجريها لتحسين دقة تخطيط المواد، مرتّبة حسب الجهد مقابل الفائدة المرجّحة. ولكل تحليل، اذكر ما البيانات التي يحتاجها، وما المخرَج الذي ينتجه، وأي قرار سيغيّره.
> افترض أن لديّ Excel، لا نظام تخطيط.

المخرَج خطة عمل يمكنك تنفيذها فعلًا — وهي إجابة أنفع بكثير من تنبؤ مُختلَق.`,
    tr: `Yapay zekâ talebinizi tahmin etmeyecek. Ama kendi verinize doğru soruyu sormanıza yardımcı olmakta çok iyidir.

> Bir konfeksiyon fabrikasında hammadde planlıyorum. Malzeme bazında 24 aylık tüketim ve önümüzdeki 3 ay için sipariş defteri kapsamı elimde.
> Malzeme planlama doğruluğunu artırmak için yapmam gereken analizleri, çaba karşısında olası fayda sırasıyla listele. Her biri için hangi veriye ihtiyaç duyduğunu, hangi çıktıyı ürettiğini ve hangi kararı değiştireceğini belirt.
> Bir planlama sistemim değil, Excel'im olduğunu varsay.

Çıktı gerçekten uygulayabileceğiniz bir iş planıdır — uydurma bir tahminden çok daha yararlı bir cevap.`,
  },

  "Inventory and slow movers": {
    ar: `> في الأسفل مخزون موادنا الخام: رمز المادة، وشريحة القيمة، وأشهر التغطية، وتاريخ آخر حركة.
> جمّع الأصناف إلى: نشطة، وبطيئة الحركة، ومعرّضة لخطر التقادم. واشرح القاعدة التي استخدمتها لكل مجموعة.
> ولمجموعة التقادم، اسرد الأسئلة التي ينبغي أن أجيب عنها قبل شطب أي شيء.

مطالبته بذكر قاعدة التجميع التي استخدمها هي الجزء المهم. فالتجميع الذي لا تستطيع شرحه للمدير المالي هو تجميع لا تستطيع التصرّف بناءً عليه.`,
    tr: `> Aşağıda hammadde stoğumuz var: malzeme kodu, değer bandı, kaç aylık karşılık, son hareket tarihi.
> Kalemleri şöyle grupla: aktif, yavaş hareket eden, atıl kalma riski taşıyan. Her grup için kullandığın kuralı açıkla.
> Atıl kalma grubu için, herhangi bir şeyi zarar yazmadan önce yanıtlamam gereken soruları listele.

Kendi gruplama kuralını söylemesini istemek işin önemli kısmıdır. Finans müdürüne açıklayamadığınız bir gruplama, üzerine iş yapamayacağınız bir gruplamadır.`,
  },

  "Supplier risk assessment": {
    ar: `> إليك ما نعرفه عن مورّد: [الدولة، وسنوات العلاقة، وحصته من إنفاقنا، وأداء التسليم آخر 12 شهرًا، ونتائج التدقيق، ومصدر وحيد أم مزدوج].
> قيّم المخاطر عبر: موثوقية التسليم، والجودة، والانكشاف المالي، والتركّز، والجغرافيا.
> صنّف كلًا منها منخفض / متوسط / مرتفع مع تبرير من سطر واحد مرتبط بالأدلة التي أعطيتك إياها.
> وقل صراحةً أين تكون المعلومات غير كافية للتصنيف.

مخاطر التركّز هي ما يغفله الناس: قد يكون المورّد ممتازًا ويظل مخاطرة جسيمة إن كان يمثّل 40% من إنفاقك ومن مصدر وحيد.`,
    tr: `> Bir tedarikçi hakkında bildiklerimiz: [ülke, ilişki yılı, harcamamızdaki payı, son 12 ayın teslimat performansı, denetim bulguları, tek mi çift kaynak mı].
> Riski şu boyutlarda değerlendir: teslimat güvenilirliği, kalite, finansal maruziyet, yoğunlaşma ve coğrafya.
> Her birini düşük / orta / yüksek olarak, verdiğim kanıta bağlı tek satırlık bir gerekçeyle derecelendir.
> Derecelendirmek için yeterli bilgin olmadığı yerleri açıkça söyle.

İnsanların atladığı şey yoğunlaşma riskidir: bir tedarikçi mükemmel olabilir ve harcamanızın %40'ıysa ve tek kaynaksa yine de ciddi bir risktir.`,
  },

  "Vendor communication": {
    ar: `> صُغ رسالة إلى مورّد فوّت تاريخ التسليم المتفق عليه مرتين خلال ثلاثة أشهر.
> النبرة: حازمة ومهنية ومحافِظة على العلاقة — فنحن ننوي مواصلة العمل معهم.
> غطِّ: حالات التأخير المحدّدة، وأثرها على إنتاجنا، وما نحتاج التزامًا به كتابةً، والتاريخ الذي نحتاج ردًا فيه.
> أقل من 200 كلمة. بدون تهديدات، وبدون اعتذار عن إثارة الموضوع.

عبارة «بدون اعتذار عن إثارة الموضوع» تعليمة مفيدة فعلًا. فإن تُرك الأمر له، يكتب الذكاء الاصطناعي رسائل تصعيد تُضعف نفسها في الجملة الأولى.`,
    tr: `> Üç ayda iki kez anlaşılan teslim tarihini kaçıran bir tedarikçiye e-posta yaz.
> Ton: kararlı, profesyonel, ilişkiyi koruyan — onlarla çalışmaya devam etmek niyetindeyiz.
> Şunları kapsa: kaçırılan spesifik tarihler, üretimimize etkisi, yazılı olarak taahhüt edilmesini istediğimiz şey ve yanıt beklediğimiz tarih.
> 200 kelimenin altında. Tehdit yok, konuyu açtığımız için özür yok.

"Konuyu açtığımız için özür yok" gerçekten yararlı bir talimattır. Kendi haline bırakıldığında yapay zekâ, ilk cümlesinde kendini zayıflatan yükseltme e-postaları yazar.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة حقيقية في سلسلة الإمداد: مقارنة عروض أسعار، أو تقييم مخاطر مورّد، أو تحليل مخزون، أو خطة تخطيط طلب.`,
    `Gerçek bir tedarik zinciri görevi seçin: teklif karşılaştırma, tedarikçi risk değerlendirmesi, stok analizi ya da bir talep planlama çalışması.`,
  ),

  "AI for Supply Chain assessment": QUIZ,
};

// ---------------------------------------------------------------------------
// AI for Sales & Marketing
// ---------------------------------------------------------------------------

const ROLE_COM: Record<string, Body> = {
  "Market research with guardrails": {
    ar: `البحث هو المجال الذي تُحدث فيه الهلوسة أكبر ضرر تجاري، لأن رقم سوق مُختلَق داخل عرض لعميل يصعب جدًا التراجع عنه.

> أبيع خدمات تصنيع الملابس لعلامات تجزئة أوروبية. أعطني نظرة عامة منظّمة عمّا يعطيه هؤلاء المشترون الأولوية عادةً عند اختيار مصنّع.
> ولكل نقطة، بيّن هل هي (أ) نمط قطاعي موثّق على نطاق واسع، أم (ب) استنتاج منك.
> لا تعطني أرقام حجم سوق أو معدلات نمو أو ادعاءات خاصة بشركات ما لم تستطع تسمية المصدر — وإن لم تستطع، فقل «يحتاج تحققًا».

ثم تحقّق من كل ما في الفئة (ب). استخدم الذكاء الاصطناعي في *هيكلة سؤال البحث*، ومصادر مسمّاة للإجابة عنه.`,
    tr: `Araştırma, halüsinasyonların ticari olarak en çok zarar verdiği alandır; çünkü bir müşteri teklifindeki uydurma bir pazar rakamından geri dönmek çok zordur.

> Avrupalı perakende markalarına konfeksiyon üretim hizmeti satıyorum. Bu alıcıların bir üretici seçerken genelde neye öncelik verdiğine dair yapılandırılmış bir genel bakış ver.
> Her madde için bunun (a) geniş çapta belgelenmiş bir sektör deseni mi yoksa (b) senin çıkarımın mı olduğunu belirt.
> Kaynağını adlandıramıyorsan bana pazar büyüklüğü rakamı, büyüme oranı veya şirkete özgü iddia verme — adlandıramıyorsan "doğrulama gerektirir" de.

Sonra (b) kategorisindeki her şeyi doğrulayın. Yapay zekâyı *araştırma sorusunu yapılandırmak* için, adı belli kaynakları ise onu yanıtlamak için kullanın.`,
  },

  "Competitor analysis": {
    ar: `> أُعِدّ ملخص تموضع تنافسي لفريق المبيعات لدينا.
> استنادًا فقط إلى المعلومات العامة التي ألصقها في الأسفل عن ثلاثة منافسين، ابنِ مقارنة عبر: القدرات المعلنة، والشهادات، والقطاعات المستهدفة، ومهل التوريد المعلنة.
> دوّن أين تكون المعلومات ناقصة لمنافس ما بدل أن تملأ الفراغ.
> واختم بثلاثة أسئلة ينبغي أن يكون فريق مبيعاتنا مستعدًا للإجابة عنها حين يقارننا مشترٍ بهم.

الصق المادة التي جمعتها. ولا تسأل النموذج عمّا «يعرفه» عن منافس بالاسم — فمن هناك تأتي الادعاءات المُختلَقة.`,
    tr: `> Satış ekibimiz için bir rekabetçi konumlandırma özeti hazırlıyorum.
> Yalnızca aşağıya yapıştırdığım üç rakip hakkındaki kamuya açık bilgilere dayanarak şu boyutlarda bir karşılaştırma kur: beyan edilen yetkinlikler, sertifikalar, hedef segmentler ve beyan edilen teslim süreleri.
> Bir rakip için bilgi eksikse boşluğu doldurmak yerine bunu not et.
> Bir alıcı bizi onlarla karşılaştırdığında satış ekibimizin yanıtlamaya hazır olması gereken üç soruyla bitir.

Topladığınız materyali yapıştırın. Modele adı belli bir rakip hakkında ne "bildiğini" sormayın — uydurma iddialar oradan gelir.`,
  },

  "Proposal drafting": {
    ar: `> صُغ ردًا على طلب عرض من مشترٍ أوروبي للتجزئة يبحث عن شريك تصنيع لبرنامج تريكو بحجم 40,000 قطعة.
> البنية: فهمنا لمتطلبهم، ونهجنا المقترح، والجودة والامتثال، والجدول الزمني، والخطوات التالية.
> النبرة: واثقة ومحدّدة وبدون مبالغات. نحو 700 كلمة.
> اترك عناصر نائبة موسومة بوضوح — [الطاقة]، [مهلة التوريد]، [الشهادات] — في كل موضع يلزم فيه ادعاء واقعي عن T&C. ولا تخترع أي قدرة.

تعليمة العناصر النائبة هي الحيلة كلها. بدونها ستدّعي المسودة بثقة شهادات قد لا نملكها.`,
    tr: `> 40.000 parçalık bir triko programı için üretim ortağı arayan Avrupalı bir perakende alıcısına teklif yanıtı hazırla.
> Yapı: ihtiyaçlarını anlayışımız, önerdiğimiz yaklaşım, kalite ve uyumluluk, zaman çizelgesi ve sonraki adımlar.
> Ton: kendinden emin, spesifik, abartısız. Yaklaşık 700 kelime.
> T&C hakkında olgusal bir iddia gereken her yere açıkça işaretlenmiş yer tutucular bırak — [KAPASİTE], [TESLİM SÜRESİ], [SERTİFİKALAR]. Hiçbir yetkinlik uydurma.

Yer tutucu talimatı işin tamamıdır. O olmadan taslak, sahip olmayabileceğimiz sertifikaları kendinden emin biçimde iddia eder.`,
  },

  "Client communication": {
    ar: `موقفان شائعان:

**خبر سيئ، يُدار جيدًا**

> صُغ رسالة تُبلغ عميلًا بأن شحنة ستتأخر خمسة أيام بسبب تأخر قماش. ابدأ بالحقيقة والتاريخ الجديد، ثم السبب في جملة واحدة، ثم ما نفعله، ثم ما نحتاجه منهم. أقل من 150 كلمة. بدون اعتذار مفرط.

**من التقني إلى المبسّط**

> حوّل المواصفة الفنية في الأسفل إلى ملخص من صفحة واحدة يفهمه فريق التجارة لدى المشتري. أبقِ كل رقم فني كما هو تمامًا؛ واشرح ما يعنيه كل منها عمليًا.

كلاهما مهمة هيكلة، وهو المجال الذي يكون فيه الذكاء الاصطناعي موثوقًا — ولا يتطلب أي منهما أن يعرف شيئًا عن نشاطنا.`,
    tr: `İki yaygın durum:

**Kötü haber, iyi yönetilmiş**

> Bir kumaş gecikmesi nedeniyle sevkiyatın beş gün geç kalacağını müşteriye bildiren bir e-posta yaz. Olgu ve yeni tarihle başla, sonra tek cümlede neden, sonra ne yaptığımız, sonra onlardan ne istediğimiz. 150 kelimenin altında. Aşırı özür yok.

**Teknikten sadeye**

> Aşağıdaki teknik şartnameyi, alıcının ürün ekibinin anlayacağı tek sayfalık bir özete çevir. Her teknik rakamı yazıldığı gibi koru; her birinin pratikte ne anlama geldiğini açıkla.

İkisi de yapılandırma görevidir ve yapay zekânın güvenilir olduğu yer burasıdır — hiçbiri onun işimiz hakkında bir şey bilmesini gerektirmez.`,
  },

  "Presentations that land": {
    ar: `> حوّل الملاحظات في الأسفل إلى مخطط عرض تقديمي للعميل من 10 شرائح.
> لكل شريحة: عنوان يذكر الخلاصة، وثلاث نقاط داعمة، وسطر واحد عمّا ينبغي أن يقوله المقدّم زيادة على الشريحة.
> يجب أن تذكر الشريحة الأولى ما نريد من العميل أن يقرّره بحلول النهاية.
> ولا يجوز أن تحمل أي شريحة عنوان «مقدمة» أو «نظرة عامة» أو «شكرًا».

منع شرائح الحشو يجبر كل شريحة على أن تستحق مكانها.`,
    tr: `> Aşağıdaki notları 10 slaytlık bir müşteri sunumu taslağına çevir.
> Her slayt: sonucu söyleyen bir başlık, üç destekleyici madde ve sunumu yapanın slaytın ötesinde ne söylemesi gerektiğine dair tek satırlık bir not.
> 1. slayt, sonunda müşterinin neye karar vermesini istediğimizi belirtmeli.
> Hiçbir slayt "Giriş", "Genel Bakış" veya "Teşekkürler" başlığını taşıyamaz.

Dolgu slaytlarını yasaklamak her slaydı yerini hak etmeye zorlar.`,
  },

  "Customer feedback analysis": {
    ar: `> في الأسفل 60 ملاحظة من العملاء خلال الربع الأخير، مع حذف أسماء العملاء.
> جمّعها في مواضيع. ولكل موضوع: اسم الموضوع، والعدد، وهل يتعلق بالمنتج أم الخدمة أم التواصل أم الشروط التجارية، واقتباسان حرفيان.
> واسرد بشكل منفصل أي شيء يبدو خطرًا على فقدان حساب عميل.
> لا تلطّف الملاحظات السلبية.

السطر الأخير مهم. فإن تُرك الأمر له، يشذّب الذكاء الاصطناعي النقد حتى يفقد فائدته.`,
    tr: `> Aşağıda son çeyrekten, müşteri adları kaldırılmış 60 müşteri geri bildirimi var.
> Temalara ayır. Her biri için: tema adı, sayı, ürün mü hizmet mi iletişim mi ticari şartlar mı ilgilendirdiği ve iki birebir alıntı.
> Bir müşteriyi kaybetme riski gibi okunan her şeyi ayrıca listele.
> Olumsuz geri bildirimi yumuşatma.

Son satır önemlidir. Kendi haline bırakıldığında yapay zekâ, eleştiriyi yararsız hâle gelene kadar törpüler.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة تجارية حقيقية: عرضًا، أو ملخصًا تنافسيًا، أو عرضًا تقديميًا لعميل، أو تحليل ملاحظات.`,
    `Gerçek bir ticari görev seçin: bir teklif, bir rekabet özeti, bir müşteri sunumu ya da bir geri bildirim analizi.`,
  ),

  "AI for Sales & Marketing assessment": QUIZ,
};

// ---------------------------------------------------------------------------
// AI for Management
// ---------------------------------------------------------------------------

const ROLE_MGT: Record<string, Body> = {
  "What AI is for at your level": {
    ar: `لا يحتاج كبار المديرين عادةً إلى الذكاء الاصطناعي ليكتب لهم. يحتاجونه كي **يضغط ويتحدّى**.

**يضغط** — يحوّل تقريرًا من 40 صفحة إلى الأمور الستة التي تحتاج قرارًا. ويحوّل اثني عشر تقريرًا أسبوعيًا إلى ما الذي تغيّر.

**يتحدّى** — يبني الحجة المضادة، ويسرد ما يجب أن يكون صحيحًا كي تفشل هذه الخطة، ويسمّي الافتراض الذي يحمل أكبر عبء.

> أفكّر في [القرار]. وهذا تبريري: [التبرير].
> ابنِ أقوى حجة ضده. ثم اسرد الافتراضات الثلاثة التي يعتمد عليها تبريري أكثر من غيرها، وما الدليل الذي يختبر كلًا منها.
> لا تكن متوازنًا. فأنا بنيت حجة التأييد بالفعل.

هذا الأمر أثمن من أي حيلة تلخيص، ويكلّف دقيقتين.`,
    tr: `Üst düzey yöneticilerin yapay zekâya genelde yazması için ihtiyacı yoktur. **Sıkıştırması ve meydan okuması** için ihtiyaç duyarlar.

**Sıkıştırma** — 40 sayfalık bir raporu karar gerektiren altı maddeye indirmek. On iki haftalık raporu "ne değişti"ye çevirmek.

**Meydan okuma** — karşı savı kurmak, bu planın başarısız olması için nelerin doğru olması gerektiğini listelemek, en fazla yükü taşıyan varsayımı adlandırmak.

> [Karar] üzerinde düşünüyorum. Gerekçem şu: [gerekçe].
> Buna karşı en güçlü savı kur. Sonra gerekçemin en çok dayandığı üç varsayımı ve her birini hangi kanıtın test edeceğini listele.
> Dengeli olma. Lehte savı ben zaten kurdum.

Bu prompt her özetleme hilesinden değerlidir ve iki dakikaya mal olur.`,
  },

  "Executive briefs from long documents": {
    ar: `> في الأسفل تقرير استشاري من 30 صفحة.
> أنتج موجزًا من صفحة واحدة: النتائج الثلاث التي ستغيّر قرارًا، وعلى ماذا تستند كل منها، وما الذي يوصي به التقرير.
> واسرد بشكل منفصل: الادعاءات المطروحة بلا دليل داعم، وأي شيء يقول التقرير صراحةً إنه لم يفحصه.
> اذكر أرقام الصفحات في كل موضع.

القائمة الثانية هي ما ينبغي قراءته أولًا. فهي تخبرك أين يكون التقرير أضعف، وهو بالضبط ما يفوت القارئ المشغول.`,
    tr: `> Aşağıda 30 sayfalık bir danışman raporu var.
> Tek sayfalık bir özet üret: bir kararı değiştirecek üç bulgu, her birinin neye dayandığı ve raporun ne önerdiği.
> Ayrıca şunları listele: destekleyici kanıt olmadan sunulan iddialar ve raporun incelemediğini açıkça söylediği her şey.
> Her yerde sayfa numarası belirt.

Önce okunması gereken ikinci listedir. Raporun en zayıf olduğu yeri söyler ve meşgul bir okuyucunun kaçırdığı tam olarak budur.`,
  },

  "Scenario and options analysis": {
    ar: `> نقيّم ثلاثة خيارات لتوسيع الطاقة: [أ، ب، ج]، بالقيود المذكورة أدناه.
> ولكل خيار، هيكِل: على ماذا نراهن، وما الذي يجب أن يسير على ما يرام، وأبكر إشارة على أنه يسير بشكل خاطئ، وكم يكلّف التراجع عنه، ومن يتأثر به داخليًا.
> لا توصِ بأحدها. ولا تُدخل أرقامًا مالية لم أعطها لك.
> واختم بالسؤال الوحيد الذي يفصل بين هذه الخيارات أكثر من غيره.

حجب التوصية متعمَّد. القيمة في البنية — والقرار يبقى حيث تقع المسؤولية.`,
    tr: `> Kapasite artırımı için üç seçeneği değerlendiriyoruz: [A, B, C], aşağıdaki kısıtlarla.
> Her biri için şunu yapılandır: neye bahis oynadığımız, nelerin yolunda gitmesi gerektiği, ters gittiğine dair en erken sinyal, geri dönmenin maliyeti ve içeride kimi etkilediği.
> Birini önerme. Sana vermediğim finansal rakamları ekleme.
> Bu seçenekleri en çok ayıran tek soruyla bitir.

Öneriyi esirgemek bilinçlidir. Değer yapıdadır — karar, sorumluluğun bulunduğu yerde kalır.`,
  },

  "Meeting intelligence": {
    ar: `> في الأسفل محاضر آخر أربعة اجتماعات إدارة لدينا.
> أنتج: (1) الإجراءات المفتوحة مع المسؤول وعمر كل منها، (2) أي شيء أُثير أكثر من مرة وما زال دون حل، (3) القرارات المتخذة دون مسؤول مسجَّل.
> رتّبها حسب المدة التي ظلّ كل منها مفتوحًا.

البنود المتكررة دون حل هي أوثق إشارة إدارية على الإطلاق، وهي غير مرئية في أي محضر منفرد.

**قبل اللصق:** احذف أي شيء يخصّ أفرادًا — الأداء، والرواتب، والمسائل التأديبية.`,
    tr: `> Aşağıda son dört yönetim toplantımızın tutanakları var.
> Şunları üret: (1) sahibi ve ne kadar süredir açık olduğuyla birlikte açık aksiyonlar, (2) birden çok kez gündeme gelmiş ve hâlâ çözülmemiş her şey, (3) kayıtlı bir sahibi olmadan alınmış kararlar.
> Her birinin ne kadar süredir açık olduğuna göre sırala.

Tekrarlayan çözümsüz maddeler var olan en güvenilir yönetim sinyalidir ve tek bir tutanakta görünmezler.

**Yapıştırmadan önce:** bireylerle ilgili her şeyi çıkarın — performans, maaşlar, disiplin konuları.`,
  },

  "Delegating AI work": {
    ar: `حين تطلب من شخص أن «يستخدم الذكاء الاصطناعي في هذا»، كن صريحًا في أربعة أمور:

1. **ما البيانات التي يجوز استخدامها** — وما الذي لا يجوز إطلاقًا
2. **ما التحقق الذي تتوقّعه** — أي الأرقام يجب فحصها مقابل المصدر
3. **ما تريد أن تراه** — المخرجات، والأمر الذي أنتجها
4. **أي قرار تغذّيه** — كي يستطيع تقدير مدى أهمية الدقة

طلب رؤية الأمر هو أعلى العادات مردودًا هنا. فهو يُظهر لك كيف صيغ التحليل، وينشر الأوامر الجيدة في الفريق، ويجعل الجودة مرئية.`,
    tr: `Birinden "bunun için yapay zekâ kullan" derken dört şey konusunda açık olun:

1. **Hangi verinin kullanılabileceği** — ve kesinlikle kullanılamayacağı
2. **Hangi doğrulamayı beklediğiniz** — hangi rakamların kaynakla karşılaştırılması gerektiği
3. **Ne görmek istediğiniz** — çıktı ve onu üreten prompt
4. **Hangi kararı beslediği** — doğruluğun ne kadar önemli olduğunu değerlendirebilsinler diye

Promptu görmek istemek buradaki en yüksek getirili alışkanlıktır. Analizin nasıl çerçevelendiğini gösterir, iyi promptları ekibe yayar ve kaliteyi görünür kılar.`,
  },

  "Governance and risk": {
    ar: `بصفتك مديرًا، أنت مسؤول عن استخدام الذكاء الاصطناعي في إدارتك. عمليًا:

- **اعرف ما الأدوات التي يستخدمها فريقك.** اسأل. الاستخدام غير المعلن شائع وغالبًا حسن النية.
- **اجعل قواعد البيانات ملموسة لإدارتك** — سمِّ الملفات والأنظمة المحدّدة التي يجب ألّا تُلصق أبدًا.
- **اشترط الإفصاح** عن أي شيء شكّله الذكاء الاصطناعي جوهريًا ويصل إلى عميل أو مجلس الإدارة أو مدقّق.
- **لا قرارات آلية بشأن الأشخاص.** لا فرزًا، ولا ترتيبًا، ولا أداءً.
- **ادعم الإبلاغ المبكر.** إن أخبرك أحدهم أنه لصق الشيء الخطأ، فالرد الذي يحمي T&C هو «شكرًا، لنتصل بتقنية المعلومات الآن.»

لا شيء من هذا يتطلب معرفة تقنية. بل يتطلب طرح أربعة أسئلة بانتظام.`,
    tr: `Yönetici olarak biriminizdeki yapay zekâ kullanımından siz sorumlusunuz. Pratikte:

- **Ekibinizin hangi araçları kullandığını bilin.** Sorun. Gölge yapay zekâ kullanımı yaygındır ve genelde iyi niyetlidir.
- **Veri kurallarını biriminiz için somutlaştırın** — asla yapıştırılmaması gereken belirli dosyaları ve sistemleri adlandırın.
- **Açıklama şart koşun:** bir müşteriye, yönetim kuruluna veya denetçiye ulaşan ve yapay zekânın esaslı biçimde şekillendirdiği her şey için.
- **İnsanlar hakkında otomatik karar yok.** Eleme yok, sıralama yok, performans yok.
- **Erken bildirimi destekleyin.** Biri size yanlış şeyi yapıştırdığını söylerse, T&C'yi güvende tutan yanıt "teşekkürler, hemen BT'yi arayalım" olur.

Bunların hiçbiri teknik bilgi gerektirmiyor. Düzenli olarak dört soru sormayı gerektiriyor.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة إدارية حقيقية: موجز قرار، أو تحليل خيارات، أو ملخصًا لمجلس الإدارة، أو مراجعة حوكمة لإدارتك.`,
    `Gerçek bir yönetim görevi seçin: bir karar özeti, bir seçenek analizi, bir yönetim kurulu özeti ya da biriminiz için bir yönetişim gözden geçirmesi.`,
  ),

  "AI for Management assessment": QUIZ,
};

// ---------------------------------------------------------------------------
// AI for IT
// ---------------------------------------------------------------------------

const ROLE_IT: Record<string, Body> = {
  "Coding, debugging, documentation": {
    ar: `أصبحت مساعدات الذكاء الاصطناعي جزءًا عاديًا من التطوير. وأنماط الفشل محدّدة وتستحق التسمية.

**يعمل جيدًا**
- الكود المتكرر، والاختبارات، والكود بلغة تعرفها لكنك تستخدمها نادرًا
- شرح كود غير مألوف، بما في ذلك سكربتاتنا القديمة
- توليد التوثيق من الكود
- التصحيح الأولي عندما تلصق الخطأ الفعلي والكود الفعلي

**يخطئ**
- دوال مكتبات وطرق واجهات برمجية مُختلَقة وغير موجودة
- منطق خاطئ بشكل دقيق في الحالات الحدّية، ملفوف بتعليقات واثقة
- أنماط أمنية سيئة — SQL مبني بدمج النصوص، وأسرار داخل الكود، وفحوص صلاحيات مفقودة
- أساليب قديمة من إصدارات سابقة من إطار العمل

**قواعد لكود T&C:** لا تلصق أبدًا بيانات اعتماد أو سلاسل اتصال أو بيانات عملاء. راجع الكود المكتوب بالذكاء الاصطناعي كما تراجع كود موظف جديد — سطرًا سطرًا، خصوصًا كل ما يمسّ المصادقة أو الأموال أو البيانات الشخصية.`,
    tr: `Yapay zekâ asistanları artık geliştirmenin normal bir parçası. Hata biçimleri ise spesifik ve adlandırmaya değer.

**İyi çalışır**
- Tekrarlayan kod, testler ve bildiğiniz ama nadiren kullandığınız bir dildeki kod
- Tanımadığınız kodu açıklamak — kendi eski betiklerimiz dahil
- Koddan dokümantasyon üretmek
- Gerçek hatayı ve gerçek kodu yapıştırdığınızda ilk aşama hata ayıklama

**Ters gider**
- Var olmayan uydurma kütüphane fonksiyonları ve API metotları
- Kendinden emin yorumlara sarılmış, uç durumlarda ince biçimde yanlış mantık
- Güvenlik anti-desenleri — dize birleştirmeli SQL, kaynak içinde sırlar, eksik yetki kontrolleri
- Bir çerçevenin eski sürümlerinden kalma güncelliğini yitirmiş kalıplar

**T&C kodu için kurallar:** asla kimlik bilgisi, bağlantı dizesi veya müşteri verisi yapıştırmayın. Yapay zekânın yazdığı kodu yeni bir çalışanın kodunu inceler gibi inceleyin — satır satır, özellikle kimlik doğrulama, para veya kişisel veriye dokunan her yeri.`,
  },

  "Scripting and internal automation": {
    ar: `أعلى قيمة لعمل الذكاء الاصطناعي في تقنية المعلومات هنا ليست بناء النماذج. بل إزالة الأعمال اليدوية الصغيرة التي لم يجد أحد وقتًا لبرمجتها.

مرشّحون جيدون: تصدير التقارير المتكررة، وتحويل الملفات بين الأنظمة، وفرز السجلات، وإدارة المستخدمين بالجملة، وفحوص جودة البيانات.

> اكتب سكربت Python يقرأ كل ملف ‎.xlsx في مجلد، ويستخرج الورقة المسمّاة «Summary»، ويكتب ملف CSV مدمجًا واحدًا مع عمود لاسم الملف المصدر.
> عالج: الأوراق المفقودة، والملفات المقفلة، وترتيب الأعمدة غير المتسق. وسجّل ما تخطّاه ولماذا.
> لا تستخدم pandas — الجهاز الهدف يحتوي فقط على المكتبة القياسية بالإضافة إلى openpyxl.

القيود في النهاية هي ما يجعله قابلًا للتشغيل. حدّد البيئة وإلا حصلت على كود لجهاز لا تملكه.`,
    tr: `BT'de en yüksek değerli yapay zekâ işi model kurmak değildir. Kimsenin betik yazmaya vakit bulamadığı küçük manuel işleri ortadan kaldırmaktır.

İyi adaylar: tekrarlayan rapor dışa aktarımları, sistemler arası dosya dönüşümleri, log triyajı, toplu kullanıcı yönetimi, veri kalitesi kontrolleri.

> Bir klasördeki her .xlsx dosyasını okuyan, "Summary" adlı sayfayı çıkaran ve kaynak dosya sütunuyla tek bir birleşik CSV yazan bir Python betiği yaz.
> Şunları ele al: eksik sayfalar, kilitli dosyalar ve tutarsız sütun sıralaması. Neyi neden atladığını logla.
> pandas kullanma — hedef makinede yalnızca standart kütüphane ve openpyxl var.

Sondaki kısıtlar onu çalıştırılabilir kılan şeydir. Ortamı belirtin, yoksa sahip olmadığınız bir makine için kod alırsınız.`,
  },

  "Calling a model from code": {
    ar: `الانتقال من نافذة محادثة إلى واجهة برمجية يغيّر ما يجب أن تتولاه بنفسك.

**أمور يجب ضبطها من البداية**

- **المفاتيح في متغيّرات البيئة.** لا في الكود، ولا في حزمة العميل أبدًا.
- **المهل وإعادة المحاولة.** المزوّدون يحدّون المعدل؛ عالج 429 بتراجع أُسّي.
- **ميزانيات الرموز.** المستندات الطويلة يجب تقطيعها؛ والتكلفة تتناسب مع عدد الرموز.
- **المخرجات المهيكلة.** اطلب JSON و*تحقّق منه* — فالنموذج سيعيد نصًا عاديًا أحيانًا.
- **اللاحتمية.** الأمر نفسه قد يعيد نصًا مختلفًا. وكل ما يعتمد عليه لاحقًا يجب أن يحتمل ذلك.
- **مسار الفشل.** قرّر ماذا تفعل ميزتك حين يتعطّل المزوّد. وسيتعطّل.

طبقة الذكاء الاصطناعي في هذه المنصة نفسها (\`src/lib/ai/provider.ts\`) مثال مختصر: دالة واحدة، وثلاث صيغ اتصال، ومفاتيح من البيئة، ومهلة صارمة، وكل مستدعٍ يعالج حالة التعطيل.`,
    tr: `Bir sohbet penceresinden API'ye geçmek, kendinizin ele alması gerekenleri değiştirir.

**Baştan doğru yapılması gerekenler**

- **Anahtarlar ortam değişkenlerinde.** Asla kaynakta, asla istemci paketinde değil.
- **Zaman aşımları ve yeniden denemeler.** Sağlayıcılar hız sınırı uygular; 429'u üstel geri çekilmeyle ele alın.
- **Token bütçeleri.** Uzun belgeler parçalanmalı; maliyet token sayısıyla ölçeklenir.
- **Yapılandırılmış çıktı.** JSON isteyin ve *doğrulayın* — model zaman zaman düz metin döndürür.
- **Belirsizlik.** Aynı prompt farklı metin döndürebilir. Aşağı akıştaki her şey buna dayanıklı olmalı.
- **Hata yolu.** Sağlayıcı çöktüğünde özelliğinizin ne yapacağına karar verin. Çökecek.

Bu platformun kendi yapay zekâ katmanı (\`src/lib/ai/provider.ts\`) derli toplu bir örnektir: tek bir fonksiyon, üç ağ formatı, ortamdan gelen anahtarlar, kesin bir zaman aşımı ve devre dışı durumu ele alan her çağıran.`,
  },

  "RAG: retrieval-augmented generation": {
    ar: `لا يمكن للنموذج أن يعرف أي شيء عن T&C. وRAG هي الطريقة التي تصلح بها ذلك دون تدريب أي شيء.

**الشكل**
1. قسّم مستنداتك إلى مقاطع.
2. حوّل كل مقطع إلى تمثيل متجهي — متجه يلتقط المعنى.
3. خزّن المتجهات.
4. عند السؤال، مثّل السؤال متجهيًا، واسترجع أقرب المقاطع، ومرّرها إلى النموذج كسياق.
5. يجيب النموذج *من النص المُقدَّم* ويشير إلى المقطع الذي استخدمه.

**متى تكون RAG صحيحة:** مجموعة مستقرة من المستندات الداخلية التي يسأل عنها الناس مرارًا — السياسات، وإجراءات التشغيل، والمواصفات الفنية، وشروط الموردين.

**متى لا تكون:** الأسئلة التي تحتاج حسابًا على بيانات مهيكلة (استعلم من قاعدة البيانات)، أو حيث تكون أي إجابة خاطئة غير مقبولة (ابنِ جدول بحث، لا روبوت محادثة).

**الجزء الذي تستهين به الفرق:** جودة التقطيع والاسترجاع هي ما يقرّر نجاح الأمر. فإن أعاد الاسترجاع الفقرات الثلاث الخاطئة، فلا نموذج يستطيع إنقاذ الإجابة.`,
    tr: `Bir model T&C hakkında hiçbir şey bilemez. RAG, hiçbir şey eğitmeden bunu düzeltmenin yoludur.

**Yapısı**
1. Belgelerinizi parçalara bölün.
2. Her parçayı bir embedding'e — anlamı yakalayan bir vektöre — çevirin.
3. Vektörleri saklayın.
4. Soru anında soruyu embed edin, en yakın parçaları getirin ve bağlam olarak modele verin.
5. Model *verilen metinden* yanıtlar ve hangi parçayı kullandığını belirtir.

**RAG ne zaman doğrudur:** insanların tekrar tekrar soru sorduğu, kararlı bir iç belge kümesi — politikalar, SOP'lar, teknik şartnameler, tedarikçi şartları.

**Ne zaman değildir:** yapılandırılmış veri üzerinde hesap gerektiren sorular (veritabanını sorgulayın) veya herhangi bir yanlış cevabın kabul edilemez olduğu durumlar (sohbet robotu değil, bir arama tablosu kurun).

**Ekiplerin hafife aldığı kısım:** işe yarayıp yaramayacağına parçalama ve getirme kalitesi karar verir. Getirme yanlış üç paragrafı döndürüyorsa hiçbir model cevabı kurtaramaz.`,
  },

  "Agents and automation": {
    ar: `«الوكيل» هو نموذج أُعطي أدوات وسُمح له بأن يقرّر أيها يستدعي ضمن حلقة.

**واقعي اليوم:** حلقات ضيقة ومحدّدة جيدًا بمجموعة أدوات صغيرة، مع تأكيد بشري لأي شيء ذي أثر — فرز التذاكر وتوجيهها، وصياغة رد للاعتماد، وجمع بيانات من ثلاثة أنظمة في ملخص.

**غير واقعي اليوم:** سلاسل ذاتية طويلة تمسّ أنظمة الإنتاج دون إشراف. الخطأ يتراكم عند كل خطوة، ولا يوجد موضع طبيعي كي يلاحظ فيه إنسان.

**قواعد التصميم إن بنيت واحدًا في T&C:**
- كل أداة تكتب تحتاج خطوة تأكيد
- حدود صارمة على التكرارات والتكلفة
- سجّل كل استدعاء أداة — ستحتاجه للتصحيح وللتفسير
- القراءة فقط بشكل افتراضي؛ والكتابة استثناء تبرّره`,
    tr: `"Ajan", araçlar verilmiş ve bir döngü içinde hangisini çağıracağına karar vermesine izin verilmiş bir modeldir.

**Bugün gerçekçi:** küçük bir araç setiyle dar, iyi tanımlanmış döngüler ve sonuç doğuran her şeyi onaylayan bir insan — talep triyajı ve yönlendirme, onay için yanıt taslağı, üç sistemden veri toplayıp özetleme.

**Bugün gerçekçi değil:** üretim sistemlerine dokunan, denetimsiz uzun özerk zincirler. Hata her adımda birikir ve bir insanın fark edeceği doğal bir yer yoktur.

**T&C'de bir tane kuracaksanız tasarım kuralları:**
- Yazma yapan her araç bir onay adımı gerektirir
- Yineleme ve maliyet için kesin sınırlar
- Her araç çağrısını loglayın — hata ayıklamak ve açıklamak için gerekecek
- Varsayılan salt okunur; yazma, gerekçelendirdiğiniz bir istisnadır`,
  },

  "AI security": {
    ar: `لأنظمة الذكاء الاصطناعي أنماط فشل لا توجد في التطبيقات العادية.

**حقن الأوامر.** إن كان نظامك يغذّي النموذج بمحتوى غير موثوق — رسالة، أو صفحة ويب، أو مستند مرفوع — فقد يحمل ذلك المحتوى تعليمات يتبعها النموذج. عامِل كل مستند مسترجَع كمدخل غير موثوق، لا كتعليمات. ولا تعطِ أبدًا نموذجًا يقرأ محتوى غير موثوق القدرة على التصرّف بدون تأكيد.

**تسريب البيانات.** أي شيء في نافذة السياق قد يظهر في إجابة. فإن استرجعت عبر الأقسام، قد تُظهر بيانات موارد بشرية لمستخدم في الإنتاج. صفِّ حسب الصلاحية *قبل* الاسترجاع، لا بعده.

**الصلاحية المفرطة.** أشيع عيب تصميمي جسيم: منح النموذج صلاحية كتابة «ليكون مفيدًا». القراءة فقط بشكل افتراضي.

**معالجة غير آمنة للمخرجات.** مخرجات النموذج المعروضة كـ HTML ثغرة XSS؛ والمستخدمة في استعلام ثغرة حقن. هرّبها وتحقّق منها تمامًا كما تفعل مع مدخلات المستخدم.

**سلسلة التوريد.** إضافات ونماذج الذكاء الاصطناعي من أطراف ثالثة هي اعتماديات. وتخضع للمراجعة نفسها كأي اعتمادية أخرى.`,
    tr: `Yapay zekâ sistemlerinin, sıradan uygulamalarda bulunmayan hata biçimleri vardır.

**Prompt enjeksiyonu.** Sisteminiz modele güvenilmeyen içerik besliyorsa — bir e-posta, bir web sayfası, yüklenmiş bir belge — o içerik modelin izleyeceği talimatlar taşıyabilir. Getirilen her belgeyi talimat değil, güvenilmeyen girdi sayın. Güvenilmeyen içerik okuyan bir modele asla onaysız hareket etme yetkisi vermeyin.

**Veri sızıntısı.** Bağlam penceresindeki her şey bir cevapta görünebilir. Departmanlar arası getirme yaparsanız, bir üretim kullanıcısına İK verisi gösterebilirsiniz. İzne göre filtrelemeyi getirmeden *önce* yapın, sonra değil.

**Aşırı yetki.** En yaygın ciddi tasarım hatası: "yardımcı olsun diye" modele yazma erişimi vermek. Varsayılan salt okunur.

**Güvensiz çıktı işleme.** HTML olarak render edilen model çıktısı bir XSS vektörüdür; bir sorguda kullanıldığında enjeksiyon vektörüdür. Tam olarak kullanıcı girdisi gibi kaçırın ve doğrulayın.

**Tedarik zinciri.** Üçüncü taraf yapay zekâ eklentileri ve modelleri birer bağımlılıktır. Diğer bağımlılıklarla aynı incelemeden geçerler.`,
  },

  "Evaluating whether it actually works": {
    ar: `«بدا جيدًا في العرض التجريبي» ليس تقييمًا. قبل أن يصل أي شيء إلى المستخدمين:

1. **ابنِ مجموعة اختبار.** 30-50 سؤالًا حقيقيًا بإجابات صحيحة معروفة. يكتبها من سيستخدمون النظام.
2. **عرّف الفشل.** إجابة خاطئة، ورفض، ومرجع مُختلَق، ومخرجات غير آمنة — عُدّ كلًا منها على حدة.
3. **قِس خط الأساس أولًا.** قِس العملية اليدوية الحالية. بدونه لا يمكنك ادعاء تحسّن.
4. **أعد التشغيل بعد كل تغيير.** تعديلات الأوامر وترقيات النماذج وتحسينات الاسترجاع كلها تغيّر السلوك، وغالبًا بشكل غير مرئي.
5. **راقبه في الإنتاج.** سجّل المدخلات والمخرجات (مع احترام الخصوصية) وافحص عيّنة أسبوعيًا.

مجموعة الاختبار هي المخرَج الذي يتخطّاه الناس ثم يندمون. ابنِها قبل الميزة.`,
    tr: `"Demoda iyi görünüyordu" bir değerlendirme değildir. Bir şey kullanıcılara ulaşmadan önce:

1. **Bir test kümesi kurun.** Doğruluğu bilinen cevaplarıyla 30-50 gerçek soru. Sistemi kullanacak kişilerce yazılmış.
2. **Hatayı tanımlayın.** Yanlış cevap, reddetme, uydurma atıf, güvensiz çıktı — her birini ayrı sayın.
3. **Önce başlangıç ölçümü.** Mevcut manuel süreci ölçün. O olmadan bir iyileşme iddia edemezsiniz.
4. **Her değişiklikten sonra yeniden çalıştırın.** Prompt düzenlemeleri, model yükseltmeleri ve getirme ayarları davranışı değiştirir, çoğu zaman görünmeden.
5. **Üretimde izleyin.** Girdi ve çıktıları (gizliliğe saygı göstererek) loglayın ve haftalık örnekleyin.

Test kümesi, insanların atlayıp sonra pişman olduğu çıktıdır. Özellikten önce kurun.`,
  },

  "Your department capstone": capstone(
    `اختر مهمة حقيقية في تقنية المعلومات: سكربت أتمتة، أو نطاق نموذج أولي لـ RAG، أو مراجعة أمنية للذكاء الاصطناعي، أو منظومة تقييم لميزة ذكاء اصطناعي قائمة.`,
    `Gerçek bir BT görevi seçin: bir otomasyon betiği, bir RAG prototipinin kapsamı, bir yapay zekâ güvenlik incelemesi ya da mevcut bir yapay zekâ özelliği için bir değerlendirme düzeneği.`,
  ),

  "AI for IT assessment": QUIZ,
};

// ---------------------------------------------------------------------------

export const LESSON_CONTENT_I18N: Record<string, Body> = {
  ...Object.fromEntries(Object.entries(AI_AT_TC).map(([title, body]) => [`INT-AI-TC::${title}`, body])),
  ...Object.fromEntries(Object.entries(RESPONSIBLE_AI).map(([title, body]) => [`INT-RAI-TC::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_FIN).map(([title, body]) => [`INT-ROLE-FIN::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_HR).map(([title, body]) => [`INT-ROLE-HR::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_PRD).map(([title, body]) => [`INT-ROLE-PRD::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_QLT).map(([title, body]) => [`INT-ROLE-QLT::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_SCM).map(([title, body]) => [`INT-ROLE-SCM::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_COM).map(([title, body]) => [`INT-ROLE-COM::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_MGT).map(([title, body]) => [`INT-ROLE-MGT::${title}`, body])),
  ...Object.fromEntries(Object.entries(ROLE_IT).map(([title, body]) => [`INT-ROLE-IT::${title}`, body])),
};

/** Arabic and Turkish for one lesson body, null when not yet translated. */
export function lessonContentI18n(courseCode: string, title: string) {
  const body = LESSON_CONTENT_I18N[`${courseCode}::${title}`];
  return { contentAr: body?.ar ?? null, contentTr: body?.tr ?? null };
}
