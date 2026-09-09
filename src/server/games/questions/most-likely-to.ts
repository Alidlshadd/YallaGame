import type { LocalizedText } from "@shared/types.js"
import type { MostLikelyToCategory } from "@shared/most-likely-to.js"

/**
 * Questions for "Most Likely To".
 *
 * The shape is the one a `questions` table would have, so moving this list
 * into the database later is a loader change and nothing else — ids are
 * stable and are what the room stores, never the text.
 *
 * The Arabic and Kurdish strings are ordinary logical-order text. Nothing here
 * is pre-reversed; direction is the renderer's job (`dir` on <html>).
 */

export interface Question {
  id: string
  category: MostLikelyToCategory
  text: LocalizedText
}

export const MOST_LIKELY_TO_QUESTIONS: readonly Question[] = [
  // ── Funny ──────────────────────────────────────────────────────────
  {
    id: "forget-birthday",
    category: "funny",
    text: {
      en: "Who is most likely to forget their own birthday?",
      tr: "Kendi doğum gününü unutma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينسى عيد ميلاده؟",
      ku: "کێ زۆرترین ئەگەری هەیە ڕۆژی لەدایکبوونی خۆی لەبیر بکات؟"
    }
  },
  {
    id: "become-famous",
    category: "funny",
    text: {
      en: "Who is most likely to become famous?",
      tr: "Ünlü olma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يصبح مشهوراً؟",
      ku: "کێ زۆرترین ئەگەری هەیە ببێتە کەسێکی بەناوبانگ؟"
    }
  },
  {
    id: "trip-over-nothing",
    category: "funny",
    text: {
      en: "Who is most likely to trip over nothing?",
      tr: "Hiçbir şeye takılıp düşme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يتعثر من دون أي سبب؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەبێ هۆکار بکەوێتە خوارەوە؟"
    }
  },
  {
    id: "text-wrong-person",
    category: "funny",
    text: {
      en: "Who is most likely to send a text to the wrong person?",
      tr: "Yanlış kişiye mesaj atma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يرسل رسالة للشخص الخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە نامەیەک بۆ کەسی هەڵە بنێرێت؟"
    }
  },
  {
    id: "talk-to-self",
    category: "funny",
    text: {
      en: "Who is most likely to get caught talking to themselves?",
      tr: "Kendi kendine konuşurken yakalanma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يُضبط وهو يتحدث مع نفسه؟",
      ku: "کێ زۆرترین ئەگەری هەیە لەکاتی قسەکردن لەگەڵ خۆیدا بگیرێت؟"
    }
  },
  {
    id: "like-old-photo",
    category: "funny",
    text: {
      en: "Who is most likely to accidentally like a five-year-old photo while stalking someone's profile?",
      tr: "Birinin profilini gizlice gezerken beş yıllık bir fotoğrafını yanlışlıkla beğenme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يعجب بصورة عمرها خمس سنوات بالخطأ وهو يتصفح حساب أحدهم؟",
      ku: "کێ زۆرترین ئەگەری هەیە کاتێک بە نهێنی پڕۆفایلی کەسێک دەبینێت، بەهەڵە لایک لە وێنەیەکی پێنج ساڵ لەمەوبەر بدات؟"
    }
  },
  {
    id: "fall-asleep-movie",
    category: "funny",
    text: {
      en: "Who is most likely to fall asleep during a movie?",
      tr: "Film izlerken uyuyakalma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينام أثناء مشاهدة فيلم؟",
      ku: "کێ زۆرترین ئەگەری هەیە لەکاتی سەیرکردنی فیلمێکدا بخەوێت؟"
    }
  },
  {
    id: "laugh-until-cry",
    category: "funny",
    text: {
      en: "Who is most likely to laugh so hard they start crying?",
      tr: "Ağlayana kadar gülme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يضحك حتى يبكي؟",
      ku: "کێ زۆرترین ئەگەری هەیە ئەوەندە پێبکەنێت کە بگریێت؟"
    }
  },
  {
    id: "forget-why-in-room",
    category: "funny",
    text: {
      en: "Who is most likely to walk into a room and forget why they came in?",
      tr: "Bir odaya girip neden geldiğini unutma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يدخل غرفة وينسى سبب دخوله؟",
      ku: "کێ زۆرترین ئەگەری هەیە بچێتە ژوورەوە و لەبیری بچێت بۆچی هاتووە؟"
    }
  },
  {
    id: "mismatched-socks",
    category: "funny",
    text: {
      en: "Who is most likely to wear mismatched socks without noticing?",
      tr: "Farkında olmadan uyumsuz çorap giyme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يلبس جوارب غير متطابقة دون أن ينتبه؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێ ئەوەی هەست پێبکات جورابی نایەکسان لەبەر بکات؟"
    }
  },
  {
    id: "become-a-meme",
    category: "funny",
    text: {
      en: "Who is most likely to accidentally become an internet meme?",
      tr: "Yanlışlıkla internet mizahına konu olma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يتحول بالصدفة إلى ميم على الإنترنت؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەهەڵە ببێتە مێمێکی ئینتەرنێت؟"
    }
  },
  {
    id: "talk-to-pet",
    category: "funny",
    text: {
      en: "Who is most likely to talk to their pet like it understands every word?",
      tr: "Evcil hayvanıyla her kelimeyi anlıyormuş gibi konuşma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يتحدث إلى حيوانه الأليف وكأنه يفهم كل كلمة؟",
      ku: "کێ زۆرترین ئەگەری هەیە لەگەڵ ئاژەڵە ماڵییەکەیدا قسە بکات وەک ئەوەی هەموو وشەیەک تێبگات؟"
    }
  },

  // ── Friendship ─────────────────────────────────────────────────────
  {
    id: "laugh-wrong-moment",
    category: "friendship",
    text: {
      en: "Who is most likely to laugh at the wrong moment?",
      tr: "Yanlış zamanda gülme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يضحك في الوقت الخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە کاتی هەڵەدا پێبکەنێت؟"
    }
  },
  {
    id: "reply-three-days-later",
    category: "friendship",
    text: {
      en: "Who is most likely to reply to a message three days later?",
      tr: "Bir mesaja üç gün sonra cevap verme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يرد على رسالة بعد ثلاثة أيام؟",
      ku: "کێ زۆرترین ئەگەری هەیە دوای سێ ڕۆژ وەڵامی نامەیەک بداتەوە؟"
    }
  },
  {
    id: "pay-whole-bill",
    category: "friendship",
    text: {
      en: "Who is most likely to pay the whole bill without saying anything?",
      tr: "Hesabın tamamını sessizce ödeme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يدفع الحساب كله دون أن يقول شيئاً؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێدەنگ هەموو حسابەکە بدات؟"
    }
  },
  {
    id: "remember-birthdays",
    category: "friendship",
    text: {
      en: "Who is most likely to remember everyone's birthday without checking their phone?",
      tr: "Telefonuna bakmadan herkesin doğum gününü hatırlama ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يتذكر أعياد ميلاد الجميع دون النظر إلى هاتفه؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێ سەیرکردنی مۆبایلەکەی ڕۆژی لەدایکبوونی هەمووان بیربێتەوە؟"
    }
  },
  {
    id: "best-advice",
    category: "friendship",
    text: {
      en: "Who is most likely to give the best advice at 3 a.m.?",
      tr: "Sabahın üçünde en iyi tavsiyeyi verme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يقدّم أفضل نصيحة في الساعة الثالثة فجراً؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە کاتژمێر سێی شەودا باشترین ڕاوێژ بدات؟"
    }
  },
  {
    id: "cancel-last-minute",
    category: "friendship",
    text: {
      en: "Who is most likely to cancel plans at the very last minute?",
      tr: "Planları son dakikada iptal etme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يلغي الخطط في اللحظة الأخيرة؟",
      ku: "کێ زۆرترین ئەگەری هەیە پلانەکان لە دوایین ساتدا هەڵبوەشێنێتەوە؟"
    }
  },
  {
    id: "show-up-uninvited",
    category: "friendship",
    text: {
      en: "Who is most likely to show up uninvited and somehow make the night better?",
      tr: "Davetsiz gelip geceyi bir şekilde daha güzel yapma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يحضر دون دعوة ويجعل السهرة أجمل بطريقة ما؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێ بانگهێشت بێت و بەشێوەیەک شەوگار باشتر بکات؟"
    }
  },
  {
    id: "keep-secret-forever",
    category: "friendship",
    text: {
      en: "Who is most likely to keep a secret forever, no matter what?",
      tr: "Ne olursa olsun bir sırrı sonsuza dek saklama ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يحافظ على سر إلى الأبد مهما حدث؟",
      ku: "کێ زۆرترین ئەگەری هەیە هەرچی بێت نهێنییەک بۆ هەتاهەتایە بشارێتەوە؟"
    }
  },
  {
    id: "organize-group-trip",
    category: "friendship",
    text: {
      en: "Who is most likely to organize the entire group trip on their own?",
      tr: "Grup gezisini tek başına organize etme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينظّم رحلة المجموعة كلها بمفرده؟",
      ku: "کێ زۆرترین ئەگەری هەیە بە تەنیا هەموو گەشتی گرووپەکە ڕێکبخات؟"
    }
  },
  {
    id: "always-late-hangout",
    category: "friendship",
    text: {
      en: "Who is most likely to always be the last one to show up?",
      tr: "Buluşmaya her zaman en son gelme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يكون دائماً آخر من يصل؟",
      ku: "کێ زۆرترین ئەگەری هەیە هەمیشە دواین کەس بێت کە دەگات؟"
    }
  },
  {
    id: "defend-a-friend",
    category: "friendship",
    text: {
      en: "Who is most likely to defend a friend without a second thought?",
      tr: "Bir arkadaşını hiç düşünmeden savunma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يدافع عن صديقه دون تردد؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێ دوودڵی بەرگری لە هاوڕێیەکی بکات؟"
    }
  },
  {
    id: "steal-your-fries",
    category: "friendship",
    text: {
      en: "Who is most likely to steal food off your plate without asking?",
      tr: "İzin almadan tabağından yemek çalma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يسرق طعاماً من طبقك دون أن يسأل؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێ پرسیارکردن خواردن لە پلێتەکەت بدزێت؟"
    }
  },
  {
    id: "emergency-contact",
    category: "friendship",
    text: {
      en: "Who is most likely to be everyone's emergency contact?",
      tr: "Herkesin acil durum kişisi olma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يكون جهة اتصال الطوارئ للجميع؟",
      ku: "کێ زۆرترین ئەگەری هەیە ببێتە کەسی پەیوەندی لە کاتی مەترسیدا بۆ هەمووان؟"
    }
  },

  // ── School ─────────────────────────────────────────────────────────
  {
    id: "late-to-class",
    category: "school",
    text: {
      en: "Who is most likely to be late to class?",
      tr: "Derse geç kalma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يتأخر عن الحصة؟",
      ku: "کێ زۆرترین ئەگەری هەیە درەنگ بگاتە وانە؟"
    }
  },
  {
    id: "homework-last-hour",
    category: "school",
    text: {
      en: "Who is most likely to do their homework in the last hour?",
      tr: "Ödevini son saatte yapma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يحل واجبه في آخر ساعة؟",
      ku: "کێ زۆرترین ئەگەری هەیە ئەرکی ماڵەوە لە کاتژمێری کۆتاییدا بکات؟"
    }
  },
  {
    id: "fall-asleep-class",
    category: "school",
    text: {
      en: "Who is most likely to fall asleep in the middle of class?",
      tr: "Ders sırasında uyuyakalma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينام في منتصف الحصة؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە ناوەڕاستی وانەدا بخەوێت؟"
    }
  },
  {
    id: "become-a-teacher",
    category: "school",
    text: {
      en: "Who is most likely to become a teacher one day?",
      tr: "Bir gün öğretmen olma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يصبح معلماً يوماً ما؟",
      ku: "کێ زۆرترین ئەگەری هەیە ڕۆژێک ببێتە مامۆستا؟"
    }
  },
  {
    id: "principals-office",
    category: "school",
    text: {
      en: "Who is most likely to get called to the principal's office?",
      tr: "Müdürün odasına çağrılma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يُستدعى إلى مكتب المدير؟",
      ku: "کێ زۆرترین ئەگەری هەیە بانگ بکرێت بۆ ژووری بەڕێوەبەر؟"
    }
  },
  {
    id: "ace-without-studying",
    category: "school",
    text: {
      en: "Who is most likely to ace a test without studying at all?",
      tr: "Hiç çalışmadan sınavdan tam not alma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينجح في اختبار دون أن يذاكر إطلاقاً؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێ خوێندنەوە نمرەی باڵا لە تاقیکردنەوەدا بەدەست بهێنێت؟"
    }
  },
  {
    id: "forget-homework",
    category: "school",
    text: {
      en: "Who is most likely to forget their homework at home?",
      tr: "Ödevini evde unutma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينسى واجبه في المنزل؟",
      ku: "کێ زۆرترین ئەگەری هەیە ئەرکی ماڵەوەی لە ماڵەوە جێبهێڵێت؟"
    }
  },
  {
    id: "start-classroom-debate",
    category: "school",
    text: {
      en: "Who is most likely to start a debate in the middle of class?",
      tr: "Ders ortasında tartışma başlatma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يبدأ نقاشاً في منتصف الحصة؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە ناوەڕاستی وانەدا دەمەقاڵێیەک دەست پێ بکات؟"
    }
  },
  {
    id: "copy-answers",
    category: "school",
    text: {
      en: "Who is most likely to copy someone else's answers five minutes before class?",
      tr: "Ders başlamadan beş dakika önce başkasının cevaplarını kopyalama ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينسخ إجابات شخص آخر قبل خمس دقائق من الحصة؟",
      ku: "کێ زۆرترین ئەگەری هەیە پێنج خولەک پێش دەستپێکردنی وانە وەڵامەکانی کەسێکی تر لابگرێت؟"
    }
  },
  {
    id: "skip-class-regret",
    category: "school",
    text: {
      en: "Who is most likely to skip class and immediately regret it?",
      tr: "Dersi asıp hemen pişman olma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يتغيّب عن الحصة ثم يندم فوراً؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە وانە بترازێت و دەستبەجێ پەشیمان بێتەوە؟"
    }
  },

  // ── Daily Life ─────────────────────────────────────────────────────
  {
    id: "lose-phone-at-home",
    category: "daily",
    text: {
      en: "Who is most likely to lose their phone inside their own house?",
      tr: "Telefonunu evin içinde kaybetme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يضيّع هاتفه داخل البيت؟",
      ku: "کێ زۆرترین ئەگەری هەیە مۆبایلەکەی لە ناو ماڵەوە ون بکات؟"
    }
  },
  {
    id: "sleep-through-alarms",
    category: "daily",
    text: {
      en: "Who is most likely to sleep through ten alarms?",
      tr: "On alarmı birden duymayıp uyumaya devam etme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينام رغم عشرة منبهات؟",
      ku: "کێ زۆرترین ئەگەری هەیە بە دە زەنگی ئاگادارکردنەوەشەوە خەوی لێبکەوێت؟"
    }
  },
  {
    id: "leave-fridge-open",
    category: "daily",
    text: {
      en: "Who is most likely to leave the fridge door open?",
      tr: "Buzdolabının kapısını açık unutma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يترك باب الثلاجة مفتوحاً؟",
      ku: "کێ زۆرترین ئەگەری هەیە دەرگای سارردەرکردنی کراوە جێبهێڵێت؟"
    }
  },
  {
    id: "run-out-of-gas",
    category: "daily",
    text: {
      en: "Who is most likely to run out of gas in the middle of the road?",
      tr: "Yolun ortasında benzini bitme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينفد منه البنزين في منتصف الطريق؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەنزینی لە ناوەڕاستی ڕێگادا تەواو بێت؟"
    }
  },
  {
    id: "burn-toast",
    category: "daily",
    text: {
      en: "Who is most likely to burn something just trying to make toast?",
      tr: "Sadece kızarmış ekmek yaparken bir şeyleri yakma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يحرق شيئاً وهو يحاول فقط تحضير التوست؟",
      ku: "کێ زۆرترین ئەگەری هەیە تەنها لەکاتی چێشتلێنانی نانی برژاودا شتێک بسووتێنێت؟"
    }
  },
  {
    id: "lose-keys-daily",
    category: "daily",
    text: {
      en: "Who is most likely to lose their keys at least once a week?",
      tr: "Haftada en az bir kez anahtarlarını kaybetme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يفقد مفاتيحه مرة على الأقل كل أسبوع؟",
      ku: "کێ زۆرترین ئەگەری هەیە هەفتانە بەلایەنی کەمەوە جارێک کلیلەکانی ون بکات؟"
    }
  },
  {
    id: "hour-picking-outfit",
    category: "daily",
    text: {
      en: "Who is most likely to spend an hour deciding what to wear?",
      tr: "Ne giyeceğine karar vermek için bir saat harcama ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يقضي ساعة كاملة يقرر ماذا سيرتدي؟",
      ku: "کێ زۆرترین ئەگەری هەیە کاتژمێرێک بۆ بڕیاردان لەسەر ئەوەی چی لەبەر بکات بەفیڕۆ بدات؟"
    }
  },
  {
    id: "never-do-laundry",
    category: "daily",
    text: {
      en: "Who is most likely to run out of clean clothes before doing laundry?",
      tr: "Çamaşır yıkamadan önce temiz kıyafeti bitirme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن تنفد منه الملابس النظيفة قبل أن يغسلها؟",
      ku: "کێ زۆرترین ئەگەری هەیە جلوبەرگی پاکی تەواو بێت پێش ئەوەی جل بشوات؟"
    }
  },
  {
    id: "cold-coffee-forgotten",
    category: "daily",
    text: {
      en: "Who is most likely to forget their coffee and drink it cold?",
      tr: "Kahvesini unutup soğuk içme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينسى قهوته ويشربها باردة؟",
      ku: "کێ زۆرترین ئەگەری هەیە قاوەکەی لەبیر بکات و سارد بیخواتەوە؟"
    }
  },
  {
    id: "longest-showers",
    category: "daily",
    text: {
      en: "Who is most likely to take the longest shower in the house?",
      tr: "Evde en uzun duşu alma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يأخذ أطول دُش في المنزل؟",
      ku: "کێ زۆرترین ئەگەری هەیە درێژترین دووش لە ماڵەوە بگرێت؟"
    }
  },
  {
    id: "snooze-ten-times",
    category: "daily",
    text: {
      en: "Who is most likely to snooze their alarm at least ten times?",
      tr: "Alarmını en az on kez erteleme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يؤجل المنبه عشر مرات على الأقل؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەلایەنی کەمەوە دە جار ئاگادارکردنەوەکە دوابخات؟"
    }
  },
  {
    id: "same-food-always",
    category: "daily",
    text: {
      en: "Who is most likely to order the exact same thing every single time?",
      tr: "Her seferinde tıpatıp aynı şeyi sipariş etme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يطلب نفس الطبق بالضبط في كل مرة؟",
      ku: "کێ زۆرترین ئەگەری هەیە هەموو جارێک هەمان شت داوا بکات؟"
    }
  },

  // ── Chaos ──────────────────────────────────────────────────────────
  {
    id: "zombie-apocalypse",
    category: "chaos",
    text: {
      en: "Who is most likely to survive a zombie apocalypse?",
      tr: "Zombi istilasında hayatta kalma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينجو من غزو الزومبي؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە هێرشی زۆمبی ڕزگاری ببێت؟"
    }
  },
  {
    id: "argument-over-nothing",
    category: "chaos",
    text: {
      en: "Who is most likely to start an argument over nothing?",
      tr: "Yoktan yere tartışma başlatma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يبدأ جدالاً من لا شيء؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە هیچەوە دەمەقاڵێ دەست پێ بکات؟"
    }
  },
  {
    id: "press-the-button",
    category: "chaos",
    text: {
      en: "Who is most likely to press a button just to see what happens?",
      tr: "Sırf ne olacağını görmek için bir düğmeye basma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يضغط زراً فقط ليرى ماذا سيحدث؟",
      ku: "کێ زۆرترین ئەگەری هەیە دوگمەیەک دابگرێت تەنها بۆ ئەوەی ببینێت چی ڕوودەدات؟"
    }
  },
  {
    id: "start-food-fight",
    category: "chaos",
    text: {
      en: "Who is most likely to start a food fight?",
      tr: "Yemek savaşı başlatma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يبدأ معركة بالطعام؟",
      ku: "کێ زۆرترین ئەگەری هەیە شەڕی خواردن دەست پێ بکات؟"
    }
  },
  {
    id: "lost-using-gps",
    category: "chaos",
    text: {
      en: "Who is most likely to get lost even while using GPS?",
      tr: "GPS kullanırken bile kaybolma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يضيع حتى وهو يستخدم نظام تحديد المواقع؟",
      ku: "کێ زۆرترین ئەگەری هەیە تەنانەت لەکاتی بەکارهێنانی GPSیشدا ون بێت؟"
    }
  },
  {
    id: "set-off-fire-alarm",
    category: "chaos",
    text: {
      en: "Who is most likely to set off a fire alarm while cooking?",
      tr: "Yemek yaparken yangın alarmını çalıştırma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يُطلق إنذار الحريق أثناء الطبخ؟",
      ku: "کێ زۆرترین ئەگەری هەیە لەکاتی چێشتلێناندا ئاگادارکەرەوەی ئاگر دابگرێت؟"
    }
  },
  {
    id: "end-up-on-news",
    category: "chaos",
    text: {
      en: "Who is most likely to end up on the news for something ridiculous?",
      tr: "Saçma bir şey yüzünden haberlere çıkma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يظهر في الأخبار بسبب شيء سخيف؟",
      ku: "کێ زۆرترین ئەگەری هەیە لەبەر شتێکی گاڵتەجاڕ بکەوێتە ناو هەواڵەکان؟"
    }
  },
  {
    id: "talk-out-of-ticket",
    category: "chaos",
    text: {
      en: "Who is most likely to talk their way out of a speeding ticket?",
      tr: "Hız cezasından konuşarak kurtulma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينجو من مخالفة سرعة بحديثه فقط؟",
      ku: "کێ زۆرترین ئەگەری هەیە بە قسەکردن خۆی لە سزای خێرایی ڕزگار بکات؟"
    }
  },
  {
    id: "conspiracy-theorist",
    category: "chaos",
    text: {
      en: "Who is most likely to become a conspiracy theorist?",
      tr: "Komplo teorisyeni olma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يصبح مؤمناً بنظريات المؤامرة؟",
      ku: "کێ زۆرترین ئەگەری هەیە ببێتە باوەڕدار بە تیۆری کۆنسپیراسیۆن؟"
    }
  },
  {
    id: "survive-desert-island",
    category: "chaos",
    text: {
      en: "Who is most likely to survive stranded on a desert island?",
      tr: "Issız bir adada mahsur kalıp hayatta kalma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينجو عالقاً على جزيرة صحراوية؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە دورگەیەکی چۆڵدا ڕزگاری بمێنێتەوە؟"
    }
  },
  {
    id: "lose-lottery-ticket",
    category: "chaos",
    text: {
      en: "Who is most likely to win the lottery and then lose the ticket?",
      tr: "Piyangoyu kazanıp sonra bileti kaybetme ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يربح اليانصيب ثم يضيّع التذكرة؟",
      ku: "کێ زۆرترین ئەگەری هەیە یانەسیب ببات و پاشان بلیتەکە ون بکات؟"
    }
  },
  {
    id: "start-business-on-whim",
    category: "chaos",
    text: {
      en: "Who is most likely to start a business on a complete whim?",
      tr: "Anlık bir kararla iş kurma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن يبدأ مشروعاً تجارياً بقرار مفاجئ؟",
      ku: "کێ زۆرترین ئەگەری هەیە بە بڕیارێکی کتوپڕ بازرگانییەک دەست پێ بکات؟"
    }
  },
  {
    id: "join-a-cult",
    category: "chaos",
    text: {
      en: "Who is most likely to accidentally join a cult?",
      tr: "Yanlışlıkla bir tarikata katılma ihtimali en yüksek kişi kim?",
      ar: "من الأكثر احتمالاً أن ينضم بالخطأ إلى طائفة غامضة؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەهەڵە بچێتە ناو تاقمێکی نهێنی؟"
    }
  }
] as const

const byId = new Map(MOST_LIKELY_TO_QUESTIONS.map(q => [q.id, q]))

/** Falls back to the first question: a room must never be stuck without one. */
export function resolveQuestion(id: string): Question {
  return byId.get(id) ?? MOST_LIKELY_TO_QUESTIONS[0]!
}
