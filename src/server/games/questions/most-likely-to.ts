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
      tr: "Kim kendi doğum gününü unutabilir?",
      ar: "من الأكثر احتمالاً أن ينسى عيد ميلاده؟",
      ku: "کێ زۆرترین ئەگەری هەیە ڕۆژی لەدایکبوونی خۆی لەبیر بکات؟"
    }
  },
  {
    id: "become-famous",
    category: "funny",
    text: {
      en: "Who is most likely to become famous one day?",
      tr: "Kim bir gün ünlü olur?",
      ar: "من الأكثر احتمالاً أن يصبح مشهوراً يوماً ما؟",
      ku: "کێ زۆرترین ئەگەری هەیە ڕۆژێک ببێتە کەسێکی بەناوبانگ؟"
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
      en: "Who is most likely to text the wrong person?",
      tr: "Kim yanlış kişiye mesaj atar?",
      ar: "من الأكثر احتمالاً أن يرسل رسالة إلى الشخص الخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە نامە بۆ کەسی هەڵە بنێرێت؟"
    }
  },
  {
    id: "talk-to-self",
    category: "funny",
    text: {
      en: "Who talks to themselves in front of the mirror?",
      tr: "Kim aynanın karşısında kendi kendine konuşur?",
      ar: "من يتحدث مع نفسه أمام المرآة؟",
      ku: "کێ لەبەردەم ئاوێنەدا لەگەڵ خۆی قسە دەکات؟"
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
      en: "Who is most likely to become an internet meme?",
      tr: "Kim internette meme olur?",
      ar: "من الأكثر احتمالاً أن يتحوّل إلى ميم على الإنترنت؟",
      ku: "کێ زۆرترین ئەگەری هەیە ببێتە میمێک لە ئینتەرنێتدا؟"
    }
  },
  {
    id: "talk-to-pet",
    category: "funny",
    text: {
      en: "Who is most likely to have a serious argument with a cat or dog?",
      tr: "Kim kedi veya köpekle ciddi ciddi tartışır?",
      ar: "من الأكثر احتمالاً أن يدخل في جدال جاد مع قط أو كلب؟",
      ku: "کێ زۆرترین ئەگەری هەیە بە جدی دەمەقاڵێ لەگەڵ پشیلە یان سەگ بکات؟"
    }
  },

  // ── Friendship ─────────────────────────────────────────────────────
  {
    id: "laugh-wrong-moment",
    category: "friendship",
    text: {
      en: "Who is most likely to start laughing at the wrong moment?",
      tr: "Kim yanlış zamanda gülmeye başlar?",
      ar: "من الأكثر احتمالاً أن يبدأ بالضحك في الوقت غير المناسب؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە کاتێکی نەگونجاودا دەست بە پێکەنین بکات؟"
    }
  },
  {
    id: "reply-three-days-later",
    category: "friendship",
    text: {
      en: "Who takes the longest to reply to messages?",
      tr: "Kim mesajlara en geç cevap verir?",
      ar: "من يتأخر أكثر في الرد على الرسائل؟",
      ku: "کێ لە هەمووان درەنگتر وەڵامی نامەکان دەداتەوە؟"
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
      en: "Who gives the most sensible advice in the group?",
      tr: "Kim grubun en mantıklı tavsiyesini verir?",
      ar: "من يقدّم النصيحة الأكثر منطقية في المجموعة؟",
      ku: "کێ لە کۆمەڵەکەدا لۆژیکیترین ئامۆژگاری دەدات؟"
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
      en: "Who organizes the entire vacation plan?",
      tr: "Kim tatil planını tamamen organize eder?",
      ar: "من ينظّم خطة العطلة بالكامل؟",
      ku: "کێ هەموو پلانی پشووەکە ڕێک دەخات؟"
    }
  },
  {
    id: "always-late-hangout",
    category: "friendship",
    text: {
      en: "Who is most likely to be late?",
      tr: "Kim en çok geç kalır?",
      ar: "من الأكثر تأخراً عن المواعيد؟",
      ku: "کێ زۆرتر درەنگ دەگات؟"
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
      en: "Who is most likely to fall asleep in class?",
      tr: "Kim derste uyuyakalabilir?",
      ar: "من الأكثر احتمالاً أن يغلبه النوم في الدرس؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە وانەدا خەوی لێ بکەوێت؟"
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
      en: "Who says “I didn't study at all” before an exam and gets the highest score?",
      tr: "Kim sınavdan önce “hiç çalışmadım” deyip en yüksek notu alır?",
      ar: "من يقول قبل الامتحان «لم أدرس أبداً» ثم يحصل على أعلى درجة؟",
      ku: "کێ پێش تاقیکردنەوە دەڵێت «هیچم نەخوێندووە» و پاشان بەرزترین نمرە دەهێنێت؟"
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
      en: "Who is most likely to snooze their alarm 10 times?",
      tr: "Kim alarmı 10 kez erteler?",
      ar: "من الأكثر احتمالاً أن يؤجل المنبّه 10 مرات؟",
      ku: "کێ زۆرترین ئەگەری هەیە ١٠ جار زەنگی ئاگادارکەرەوەکەی دوا بخات؟"
    }
  },
  {
    id: "same-food-always",
    category: "daily",
    text: {
      en: "Who always orders the same meal?",
      tr: "Kim her zaman aynı yemeği sipariş eder?",
      ar: "من يطلب الوجبة نفسها دائماً؟",
      ku: "کێ هەمیشە هەمان خواردن داوا دەکات؟"
    }
  },

  // ── Chaos ──────────────────────────────────────────────────────────
  {
    id: "zombie-apocalypse",
    category: "chaos",
    text: {
      en: "Who would survive the longest in a zombie apocalypse?",
      tr: "Kim zombi istilasında en uzun süre hayatta kalır?",
      ar: "من سيبقى حياً لأطول وقت في اجتياح الزومبي؟",
      ku: "کێ لە هێرشی زۆمبییەکاندا درێژترین ماوە بە زیندوویی دەمێنێتەوە؟"
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
      en: "Who gets lost even with Google Maps open?",
      tr: "Kim Google Maps açıkken bile kaybolur?",
      ar: "من يضل الطريق حتى وخرائط Google مفتوحة؟",
      ku: "کێ تەنانەت کاتێک نەخشەی Google کراوەیە ڕێگا ون دەکات؟"
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
      en: "Who could manage to live alone on an island?",
      tr: "Kim bir adada tek başına yaşamayı başarır?",
      ar: "من يستطيع العيش بمفرده على جزيرة؟",
      ku: "کێ دەتوانێت بە تەنها لە دورگەیەکدا بژیێت؟"
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
      en: "Who is most likely to start their own company one day?",
      tr: "Kim bir gün kendi şirketini kurar?",
      ar: "من الأكثر احتمالاً أن يؤسس شركته الخاصة يوماً ما؟",
      ku: "کێ زۆرترین ئەگەری هەیە ڕۆژێک کۆمپانیای خۆی دامەزرێنێت؟"
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
  },
  // Additional community questions; equivalent questions above retain their ids.
  {
    id: "fall-asleep-easily",
    category: "daily",
    text: {
      en: "Who falls asleep the most easily?",
      tr: "Kim en kolay uyuyakalır?",
      ar: "من يغلبه النوم بسهولة أكثر من غيره؟",
      ku: "کێ لە هەمووان ئاسانتر خەوی لێ دەکەوێت؟"
    }
  },
  {
    id: "lose-phone-every-week",
    category: "daily",
    text: {
      en: "Who cannot go a week without losing their phone?",
      tr: "Kim bir hafta boyunca telefonunu kaybetmeden yaşayamaz?",
      ar: "من لا يستطيع أن يمضي أسبوعاً دون أن يضيّع هاتفه؟",
      ku: "کێ ناتوانێت هەفتەیەک بەسەر ببات بەبێ ئەوەی مۆبایلەکەی ون بکات؟"
    }
  },
  {
    id: "order-food-most",
    category: "daily",
    text: {
      en: "Who orders food the most often?",
      tr: "Kim en çok yemek sipariş eder?",
      ar: "من يطلب الطعام أكثر من الجميع؟",
      ku: "کێ لە هەمووان زیاتر داوای خواردن دەکات؟"
    }
  },
  {
    id: "take-most-photos",
    category: "daily",
    text: {
      en: "Who takes the most photos?",
      tr: "Kim en çok fotoğraf çeker?",
      ar: "من يلتقط أكبر عدد من الصور؟",
      ku: "کێ لە هەمووان زیاتر وێنە دەگرێت؟"
    }
  },
  {
    id: "group-jokester",
    category: "friendship",
    text: {
      en: "Who cracks the most jokes in the friend group?",
      tr: "Kim arkadaş grubunda en çok şaka yapar?",
      ar: "من يمزح أكثر في مجموعة الأصدقاء؟",
      ku: "کێ لە کۆمەڵی هاوڕێکاندا لە هەمووان زیاتر گاڵتە دەکات؟"
    }
  },
  {
    id: "panic-over-small-things",
    category: "funny",
    text: {
      en: "Who is most likely to panic over the smallest thing?",
      tr: "Kim en küçük şeyden panik olur?",
      ar: "من الأكثر احتمالاً أن يصاب بالذعر من أبسط شيء؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە بچووکترین شت تۆقیو بێت؟"
    }
  },
  {
    id: "horror-movie-first-to-run",
    category: "chaos",
    text: {
      en: "Who would be the first to run away in a horror movie?",
      tr: "Kim bir korku filminde ilk kaçar?",
      ar: "من سيكون أول من يهرب في فيلم رعب؟",
      ku: "کێ لە فیلمێکی ترسناکدا یەکەم کەس دەبێت هەڵبێت؟"
    }
  },
  {
    id: "zombie-first-caught",
    category: "chaos",
    text: {
      en: "Who would be the first caught in a zombie apocalypse?",
      tr: "Kim zombi istilasında ilk yakalanır?",
      ar: "من سيكون أول من يقع في قبضة الزومبي عند اجتياحهم؟",
      ku: "کێ لە هێرشی زۆمبییەکاندا یەکەم کەس دەبێت بگیرێت؟"
    }
  },
  {
    id: "wrong-bus",
    category: "daily",
    text: {
      en: "Who is most likely to get on the wrong bus?",
      tr: "Kim yanlış otobüse biner?",
      ar: "من الأكثر احتمالاً أن يركب الحافلة الخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە سواری پاسی هەڵە ببێت؟"
    }
  },
  {
    id: "lost-in-another-city",
    category: "daily",
    text: {
      en: "Who is most likely to get lost visiting another city?",
      tr: "Kim başka bir şehre gidip yolu kaybeder?",
      ar: "من الأكثر احتمالاً أن يزور مدينة أخرى ويضل الطريق؟",
      ku: "کێ زۆرترین ئەگەری هەیە بچێتە شارێکی تر و ڕێگا ون بکات؟"
    }
  },
  {
    id: "forget-why-left-home",
    category: "funny",
    text: {
      en: "Who is most likely to leave home and forget why they went out?",
      tr: "Kim evden çıkıp neden çıktığını unutur?",
      ar: "من الأكثر احتمالاً أن يخرج من البيت وينسى لماذا خرج؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە ماڵ بێتە دەرەوە و لەبیری بچێت بۆچی هاتووەتە دەرەوە؟"
    }
  },
  {
    id: "search-phone-in-hand",
    category: "funny",
    text: {
      en: "Who is most likely to look for their phone while holding it?",
      tr: "Kim telefonu elindeyken telefonunu arar?",
      ar: "من الأكثر احتمالاً أن يبحث عن هاتفه وهو في يده؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەدوای مۆبایلەکەیدا بگەڕێت کە لە دەستیدایە؟"
    }
  },
  {
    id: "five-minutes-half-hour",
    category: "friendship",
    text: {
      en: "Who says “I'll be there in 5 minutes” but arrives half an hour later?",
      tr: "Kim en çok “5 dakikaya geliyorum” deyip yarım saat sonra gelir?",
      ar: "من يقول «سأصل خلال 5 دقائق» ثم يصل بعد نصف ساعة؟",
      ku: "کێ دەڵێت «بە ٥ خولەک دەگەم» بەڵام دوای نیو کاتژمێر دەگات؟"
    }
  },
  {
    id: "game-until-morning",
    category: "daily",
    text: {
      en: "Who is most likely to play games until morning?",
      tr: "Kim sabaha kadar oyun oynar?",
      ar: "من الأكثر احتمالاً أن يلعب حتى الصباح؟",
      ku: "کێ زۆرترین ئەگەری هەیە تا بەیانی یاری بکات؟"
    }
  },
  {
    id: "angry-game-loser",
    category: "friendship",
    text: {
      en: "Who gets the angriest when they lose a game?",
      tr: "Kim bir oyunda kaybedince en çok sinirlenir?",
      ar: "من يغضب أكثر عندما يخسر في لعبة؟",
      ku: "کێ لە هەمووان زیاتر تووڕە دەبێت کاتێک لە یارییەکدا دەدۆڕێت؟"
    }
  },
  {
    id: "suspected-game-cheater",
    category: "friendship",
    text: {
      en: "Who would be the first person suspected of cheating in a game?",
      tr: "Kim oyunda hile yaptığından şüphelenilecek ilk kişidir?",
      ar: "من سيكون أول شخص يُشتبه بأنه يغش في اللعبة؟",
      ku: "کێ یەکەم کەس دەبێت گومانی لێ بکرێت کە لە یاریدا فێڵ دەکات؟"
    }
  },
  {
    id: "most-competitive",
    category: "friendship",
    text: {
      en: "Who is the most competitive?",
      tr: "Kim en rekabetçi kişidir?",
      ar: "من هو الأكثر تنافسية؟",
      ku: "کێ لە هەمووان زیاتر حەزی لە کێبڕکێیە؟"
    }
  },
  {
    id: "worst-at-secrets",
    category: "friendship",
    text: {
      en: "Who is the worst at keeping secrets?",
      tr: "Kim sır saklamakta en kötüdür?",
      ar: "من هو الأسوأ في حفظ الأسرار؟",
      ku: "کێ لە هەمووان خراپتر نهێنی دەپارێزێت؟"
    }
  },
  {
    id: "knows-all-gossip",
    category: "friendship",
    text: {
      en: "Who knows all the gossip in the group?",
      tr: "Kim grubun bütün dedikodularını bilir?",
      ar: "من يعرف كل أخبار النميمة في المجموعة؟",
      ku: "کێ هەموو قسەو‌باسەکانی ناو کۆمەڵەکە دەزانێت؟"
    }
  },
  {
    id: "accidentally-reveal-secret",
    category: "friendship",
    text: {
      en: "Who is most likely to accidentally reveal a secret?",
      tr: "Kim istemeden bir sırrı açıklar?",
      ar: "من الأكثر احتمالاً أن يكشف سراً دون قصد؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەبێ مەبەست نهێنییەک ئاشکرا بکات؟"
    }
  },
  {
    id: "best-excuses",
    category: "funny",
    text: {
      en: "Who comes up with the best excuses?",
      tr: "Kim en iyi bahane uydurur?",
      ar: "من يختلق أفضل الأعذار؟",
      ku: "کێ باشترین بیانوو دەهێنێتەوە؟"
    }
  },
  {
    id: "call-teacher-mom",
    category: "school",
    text: {
      en: "Who is most likely to accidentally call their teacher “Mom”?",
      tr: "Kim öğretmene/hocaya yanlışlıkla “anne” diyebilir?",
      ar: "من الأكثر احتمالاً أن ينادي المعلّم «ماما» بالخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەهەڵە بە مامۆستاکەی بڵێت «دایە»؟"
    }
  },
  {
    id: "study-day-before-exam",
    category: "school",
    text: {
      en: "Who starts studying the day before an exam?",
      tr: "Kim sınava bir gün kala çalışmaya başlar?",
      ar: "من يبدأ الدراسة قبل الامتحان بيوم واحد؟",
      ku: "کێ ڕۆژێک پێش تاقیکردنەوە دەست بە خوێندن دەکات؟"
    }
  },
  {
    id: "forget-homework-deadline",
    category: "school",
    text: {
      en: "Who is most likely to forget the homework deadline?",
      tr: "Kim ödevin son tarihini unutur?",
      ar: "من الأكثر احتمالاً أن ينسى موعد تسليم الواجب؟",
      ku: "کێ زۆرترین ئەگەری هەیە دوا وادەی ڕادەستکردنی ئەرکی ماڵەوە لەبیر بکات؟"
    }
  },
  {
    id: "leave-exam-first",
    category: "school",
    text: {
      en: "Who is the first to leave an exam?",
      tr: "Kim sınavda en önce çıkar?",
      ar: "من يخرج أولاً من الامتحان؟",
      ku: "کێ لە تاقیکردنەوەدا لە هەمووان زووتر دەچێتە دەرەوە؟"
    }
  },
  {
    id: "most-coffee-at-school",
    category: "school",
    text: {
      en: "Who drinks the most coffee at school or university?",
      tr: "Kim okulda/üniversitede en çok kahve içer?",
      ar: "من يشرب أكبر كمية من القهوة في المدرسة أو الجامعة؟",
      ku: "کێ لە قوتابخانە یان زانکۆدا لە هەمووان زیاتر قاوە دەخواتەوە؟"
    }
  },
  {
    id: "sit-in-wrong-class",
    category: "school",
    text: {
      en: "Who is most likely to walk into the wrong classroom and sit down?",
      tr: "Kim yanlış sınıfa girip oturur?",
      ar: "من الأكثر احتمالاً أن يدخل الصف الخطأ ويجلس فيه؟",
      ku: "کێ زۆرترین ئەگەری هەیە بچێتە پۆلی هەڵە و تێیدا دابنیشێت؟"
    }
  },
  {
    id: "forget-presentation",
    category: "school",
    text: {
      en: "Who is most likely to forget what to say during a presentation?",
      tr: "Kim sunum sırasında ne söyleyeceğini unutur?",
      ar: "من الأكثر احتمالاً أن ينسى ما يريد قوله أثناء العرض التقديمي؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە کاتی پێشکەشکردندا لەبیری بچێت چی بڵێت؟"
    }
  },
  {
    id: "finish-project-last-night",
    category: "school",
    text: {
      en: "Who finishes a project on the very last night?",
      tr: "Kim projeyi son gece bitirir?",
      ar: "من ينهي المشروع في الليلة الأخيرة؟",
      ku: "کێ لە دوا شەودا پڕۆژەکە تەواو دەکات؟"
    }
  },
  {
    id: "become-millionaire",
    category: "daily",
    text: {
      en: "Who is most likely to become a millionaire?",
      tr: "Kim milyoner olma ihtimali en yüksek kişidir?",
      ar: "من الأكثر احتمالاً أن يصبح مليونيراً؟",
      ku: "کێ زۆرترین ئەگەری هەیە ببێتە ملیۆنێر؟"
    }
  },
  {
    id: "spend-everything-on-nothing",
    category: "daily",
    text: {
      en: "Who is most likely to spend all their money on something unnecessary?",
      tr: "Kim bütün parasını gereksiz bir şeye harcar?",
      ar: "من الأكثر احتمالاً أن ينفق كل ماله على شيء لا يحتاجه؟",
      ku: "کێ زۆرترین ئەگەری هەیە هەموو پارەکەی لەسەر شتێکی بێ‌پێویست خەرج بکات؟"
    }
  },
  {
    id: "best-at-bargaining",
    category: "daily",
    text: {
      en: "Who is the best at bargaining?",
      tr: "Kim pazarlık yaparken en başarılıdır?",
      ar: "من هو الأبرع في المساومة على السعر؟",
      ku: "کێ لە هەمووان باشتر لەسەر نرخ دانوسان دەکات؟"
    }
  },
  {
    id: "accidental-expensive-purchase",
    category: "daily",
    text: {
      en: "Who is most likely to accidentally buy something very expensive?",
      tr: "Kim yanlışlıkla çok pahalı bir şey satın alır?",
      ar: "من الأكثر احتمالاً أن يشتري شيئاً باهظ الثمن بالخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەهەڵە شتێکی زۆر گران بکڕێت؟"
    }
  },
  {
    id: "most-online-packages",
    category: "daily",
    text: {
      en: "Who is always waiting for the most online shopping deliveries?",
      tr: "Kim online alışverişte en çok paket bekler?",
      ar: "من ينتظر أكبر عدد من طرود التسوّق عبر الإنترنت؟",
      ku: "کێ چاوەڕێی زۆرترین پاکەتی کڕینی ئۆنلاین دەکات؟"
    }
  },
  {
    id: "buy-unneeded-sale-items",
    category: "daily",
    text: {
      en: "Who buys things they don't need just because they're on sale?",
      tr: "Kim indirim görünce ihtiyacı olmayan şeyi alır?",
      ar: "من يشتري أشياء لا يحتاجها لمجرد أنها مخفّضة؟",
      ku: "کێ شتی بێ‌پێویست دەکڕێت تەنها لەبەر ئەوەی داشکاندنی لەسەرە؟"
    }
  },
  {
    id: "lend-friends-money",
    category: "friendship",
    text: {
      en: "Who is always lending money to friends?",
      tr: "Kim arkadaşlarına sürekli borç verir?",
      ar: "من يُقرض أصدقاءه المال باستمرار؟",
      ku: "کێ بەردەوام پارە بە قەرز دەدات بە هاوڕێکانی؟"
    }
  },
  {
    id: "forget-to-pay-bill",
    category: "daily",
    text: {
      en: "Who is most likely to forget to pay the bill?",
      tr: "Kim hesabı ödemeyi unutur?",
      ar: "من الأكثر احتمالاً أن ينسى دفع الحساب؟",
      ku: "کێ زۆرترین ئەگەری هەیە پارەدانی حسابەکە لەبیر بکات؟"
    }
  },
  {
    id: "go-out-without-money",
    category: "daily",
    text: {
      en: "Who is most likely to go out without any money?",
      tr: "Kim cebinde para olmadan dışarı çıkar?",
      ar: "من الأكثر احتمالاً أن يخرج دون مال في جيبه؟",
      ku: "کێ زۆرترین ئەگەری هەیە بێ پارە لە گیرفانیدا بچێتە دەرەوە؟"
    }
  },
  {
    id: "eat-the-most",
    category: "daily",
    text: {
      en: "Who eats the most?",
      tr: "Kim en çok yemek yer?",
      ar: "من يأكل أكثر من الجميع؟",
      ku: "کێ لە هەمووان زیاتر خواردن دەخوات؟"
    }
  },
  {
    id: "order-food-at-three-am",
    category: "daily",
    text: {
      en: "Who is most likely to order food at 3 a.m.?",
      tr: "Kim gece 3'te yemek sipariş eder?",
      ar: "من الأكثر احتمالاً أن يطلب الطعام في الثالثة فجراً؟",
      ku: "کێ زۆرترین ئەگەری هەیە کاتژمێر ٣ی بەرەبەیان داوای خواردن بکات؟"
    }
  },
  {
    id: "win-spicy-food-contest",
    category: "funny",
    text: {
      en: "Who would win a spicy food eating contest?",
      tr: "Kim acı yeme yarışmasını kazanır?",
      ar: "من سيفوز في مسابقة أكل الطعام الحار؟",
      ku: "کێ لە کێبڕکێی خواردنی خواردنی تیژدا دەباتەوە؟"
    }
  },
  {
    id: "weird-food-combinations",
    category: "funny",
    text: {
      en: "Who is most likely to try the weirdest food combination?",
      tr: "Kim en garip yemek kombinasyonunu dener?",
      ar: "من الأكثر احتمالاً أن يجرّب أغرب خليط من الأطعمة؟",
      ku: "کێ زۆرترین ئەگەری هەیە سەیرترین تێکەڵەی خواردن تاقی بکاتەوە؟"
    }
  },
  {
    id: "stare-into-fridge",
    category: "daily",
    text: {
      en: "Who opens the fridge and stares for 5 minutes without taking anything?",
      tr: "Kim buzdolabını açıp 5 dakika hiçbir şey almadan bakar?",
      ar: "من يفتح الثلاجة ويحدّق فيها 5 دقائق دون أن يأخذ شيئاً؟",
      ku: "کێ سەلاجەکە دەکاتەوە و ٥ خولەک سەیری دەکات بەبێ ئەوەی هیچ شتێک هەڵبگرێت؟"
    }
  },
  {
    id: "just-one-bite",
    category: "friendship",
    text: {
      en: "Who always asks for “just one bite” of someone else's food?",
      tr: "Kim başkasının yemeğinden sürekli “bir lokma” ister?",
      ar: "من يطلب دائماً «لقمة واحدة فقط» من طعام الآخرين؟",
      ku: "کێ هەمیشە داوای «تەنها یەک پاروو» لە خواردنی کەسانی تر دەکات؟"
    }
  },
  {
    id: "read-menu-twenty-minutes",
    category: "daily",
    text: {
      en: "Who studies the restaurant menu for 20 minutes?",
      tr: "Kim restoranda menüyü 20 dakika inceler?",
      ar: "من يدرس قائمة الطعام في المطعم لمدة 20 دقيقة؟",
      ku: "کێ لە چێشتخانەدا ٢٠ خولەک سەیری لیستی خواردن دەکات؟"
    }
  },
  {
    id: "stay-quiet-wrong-order",
    category: "daily",
    text: {
      en: "Who stays quiet even when the wrong food order arrives?",
      tr: "Kim yanlış sipariş gelse bile sesini çıkarmaz?",
      ar: "من يظل صامتاً حتى لو وصل طلب الطعام الخطأ؟",
      ku: "کێ تەنانەت کاتێک خواردنی هەڵەی بۆ دێت بێدەنگ دەمێنێتەوە؟"
    }
  },
  {
    id: "kitchen-battlefield",
    category: "funny",
    text: {
      en: "Who turns the kitchen into a battlefield while trying to cook?",
      tr: "Kim yemek yapmaya çalışırken mutfağı savaş alanına çevirir?",
      ar: "من يحوّل المطبخ إلى ساحة حرب وهو يحاول الطبخ؟",
      ku: "کێ لە کاتی هەوڵدان بۆ چێشتلێناندا چێشتخانەکە دەکاتە گۆڕەپانی جەنگ؟"
    }
  },
  {
    id: "befriend-aliens-first",
    category: "chaos",
    text: {
      en: "Who would be the first to befriend aliens?",
      tr: "Kim uzaylılarla ilk arkadaş olur?",
      ar: "من سيكون أول من يصادق الكائنات الفضائية؟",
      ku: "کێ یەکەم کەس دەبێت ببێتە هاوڕێی بوونەوەرە ئاسمانییەکان؟"
    }
  },
  {
    id: "photograph-an-alien",
    category: "chaos",
    text: {
      en: "Who would try to take a photo if they saw an alien?",
      tr: "Kim uzaylı görse fotoğraf çekmeye çalışır?",
      ar: "من سيحاول التقاط صورة إذا رأى كائناً فضائياً؟",
      ku: "کێ ئەگەر بوونەوەرێکی ئاسمانی ببینێت هەوڵ دەدات وێنەی بگرێت؟"
    }
  },
  {
    id: "plan-world-domination",
    category: "chaos",
    text: {
      en: "Who could come up with a plan to take over the world?",
      tr: "Kim dünyayı ele geçirme planı yapabilecek kişidir?",
      ar: "من قد يضع خطة للسيطرة على العالم؟",
      ku: "کێ دەکرێت پلانێک بۆ دەستبەسەرداگرتنی جیهان دابنێت؟"
    }
  },
  {
    id: "secret-agent",
    category: "chaos",
    text: {
      en: "Who is most likely to turn out to be a secret agent?",
      tr: "Kim gizli ajan çıkma ihtimali en yüksek kişidir?",
      ar: "من الأكثر احتمالاً أن يتبيّن أنه عميل سري؟",
      ku: "کێ زۆرترین ئەگەری هەیە دەربکەوێت کە سیخوڕێکی نهێنییە؟"
    }
  },
  {
    id: "accidental-cult-leader",
    category: "chaos",
    text: {
      en: "Who is most likely to accidentally become the leader of a cult?",
      tr: "Kim yanlışlıkla bir tarikatın lideri olur?",
      ar: "من الأكثر احتمالاً أن يصبح زعيم طائفة بالصدفة؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەهەڵە ببێتە سەرکردەی تەریقەتێک؟"
    }
  },
  {
    id: "time-travel-to-past",
    category: "chaos",
    text: {
      en: "Who would travel to the past if given the chance to time travel?",
      tr: "Kim zamanda yolculuk yapma fırsatı bulsa geçmişe gider?",
      ar: "من سيختار الذهاب إلى الماضي لو أتيحت له فرصة السفر عبر الزمن؟",
      ku: "کێ ئەگەر دەرفەتی گەشت بە کاتدا بدۆزێتەوە، دەچێتە ڕابردوو؟"
    }
  },
  {
    id: "accidentally-change-history",
    category: "chaos",
    text: {
      en: "Who would time travel and accidentally change history?",
      tr: "Kim zamanda yolculuk yapıp yanlışlıkla tarihi değiştirir?",
      ar: "من سيسافر عبر الزمن ويغيّر التاريخ بالخطأ؟",
      ku: "کێ گەشت بە کاتدا دەکات و بەهەڵە مێژوو دەگۆڕێت؟"
    }
  },
  {
    id: "argue-with-robots",
    category: "chaos",
    text: {
      en: "Who is most likely to start arguing with robots?",
      tr: "Kim robotlarla tartışmaya başlar?",
      ar: "من الأكثر احتمالاً أن يبدأ جدالاً مع الروبوتات؟",
      ku: "کێ زۆرترین ئەگەری هەیە دەست بە دەمەقاڵێ لەگەڵ ڕۆبۆتەکان بکات؟"
    }
  },
  {
    id: "befriend-ai",
    category: "chaos",
    text: {
      en: "Who is most likely to become best friends with an AI?",
      tr: "Kim yapay zekâyla en iyi arkadaş olur?",
      ar: "من الأكثر احتمالاً أن يصبح أفضل صديق للذكاء الاصطناعي؟",
      ku: "کێ زۆرترین ئەگەری هەیە ببێتە باشترین هاوڕێی زیرەکیی دەستکرد؟"
    }
  },
  {
    id: "accidentally-go-viral",
    category: "funny",
    text: {
      en: "Who is most likely to accidentally go viral one day?",
      tr: "Kim bir gün yanlışlıkla viral olur?",
      ar: "من الأكثر احتمالاً أن ينتشر على الإنترنت بالصدفة يوماً ما؟",
      ku: "کێ زۆرترین ئەگەری هەیە ڕۆژێک بە ڕێکەوت ناوی بە خێرایی لە ئینتەرنێتدا بڵاو ببێتەوە؟"
    }
  },
  {
    id: "most-social-followers",
    category: "daily",
    text: {
      en: "Who is most likely to gain the most followers on social media?",
      tr: "Kim sosyal medyada en çok takipçiye ulaşır?",
      ar: "من الأكثر احتمالاً أن يجمع أكبر عدد من المتابعين على مواقع التواصل؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە تۆڕە کۆمەڵایەتییەکاندا زۆرترین شوێنکەوتوو کۆ بکاتەوە؟"
    }
  },
  {
    id: "accidental-livestream",
    category: "funny",
    text: {
      en: "Who is most likely to accidentally start a livestream?",
      tr: "Kim yanlışlıkla canlı yayın açar?",
      ar: "من الأكثر احتمالاً أن يبدأ بثاً مباشراً بالخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەهەڵە پەخشی ڕاستەوخۆ دەست پێ بکات؟"
    }
  },
  {
    id: "forget-camera-is-on",
    category: "funny",
    text: {
      en: "Who is most likely to not notice their phone camera is on?",
      tr: "Kim telefonunun kamerasının açık olduğunu fark etmez?",
      ar: "من الأكثر احتمالاً ألا يلاحظ أن كاميرا هاتفه تعمل؟",
      ku: "کێ زۆرترین ئەگەری هەیە تێبینی نەکات کامێرای مۆبایلەکەی کراوەیە؟"
    }
  },
  {
    id: "silly-video-million-views",
    category: "funny",
    text: {
      en: "Who could make the silliest video and get millions of views?",
      tr: "Kim en saçma videoyu çekip milyonlarca izlenme alır?",
      ar: "من قد يصوّر أسخف فيديو ويحصل على ملايين المشاهدات؟",
      ku: "کێ دەکرێت بێماناترین ڤیدیۆ دروست بکات و ملیۆنان بینین بەدەست بهێنێت؟"
    }
  },
  {
    id: "try-being-influencer",
    category: "daily",
    text: {
      en: "Who is most likely to try becoming an influencer?",
      tr: "Kim influencer olmayı dener?",
      ar: "من الأكثر احتمالاً أن يحاول أن يصبح مؤثراً على مواقع التواصل؟",
      ku: "کێ زۆرترین ئەگەری هەیە هەوڵ بدات ببێتە ئینفلۆنسەر؟"
    }
  },
  {
    id: "forget-account-password",
    category: "daily",
    text: {
      en: "Who is most likely to forget their account password?",
      tr: "Kim hesabının şifresini unutur?",
      ar: "من الأكثر احتمالاً أن ينسى كلمة مرور حسابه؟",
      ku: "کێ زۆرترین ئەگەری هەیە وشەی نهێنیی هەژمارەکەی لەبیر بکات؟"
    }
  },
  {
    id: "hundred-open-tabs",
    category: "daily",
    text: {
      en: "Who leaves 100 browser tabs open?",
      tr: "Kim 100 tane sekme açık bırakır?",
      ar: "من يترك 100 علامة تبويب مفتوحة في المتصفح؟",
      ku: "کێ ١٠٠ تابی وێبگەڕ بە کراوەیی بەجێ دەهێڵێت؟"
    }
  },
  {
    id: "wifi-end-of-world",
    category: "funny",
    text: {
      en: "Who acts like their world has ended when the Wi-Fi goes down?",
      tr: "Kim Wi-Fi gidince dünyası yıkılmış gibi davranır?",
      ar: "من يتصرّف وكأن عالمه انهار عندما ينقطع الواي فاي؟",
      ku: "کێ کاتێک وای‌فای دەبڕێت وا هەڵسوکەوت دەکات وەک جیهانەکەی ڕووخابێت؟"
    }
  },
  {
    id: "friend-group-leader",
    category: "friendship",
    text: {
      en: "Who is most likely to become the leader of the friend group?",
      tr: "Kim arkadaş grubunun lideri olur?",
      ar: "من الأكثر احتمالاً أن يصبح قائد مجموعة الأصدقاء؟",
      ku: "کێ زۆرترین ئەگەری هەیە ببێتە سەرکردەی کۆمەڵی هاوڕێکان؟"
    }
  },
  {
    id: "calm-everyone-down",
    category: "friendship",
    text: {
      en: "Who calms everyone down when a fight breaks out?",
      tr: "Kim kavga çıktığında herkesi sakinleştirir?",
      ar: "من يهدّئ الجميع عندما ينشب شجار؟",
      ku: "کێ کاتێک شەڕێک ڕوودەدات هەمووان ئارام دەکاتەوە؟"
    }
  },
  {
    id: "instant-friends",
    category: "friendship",
    text: {
      en: "Who becomes friends with everyone within two minutes?",
      tr: "Kim iki dakika içinde herkesle arkadaş olur?",
      ar: "من يصادق الجميع خلال دقيقتين؟",
      ku: "کێ لە ماوەی دوو خولەکدا دەبێتە هاوڕێی هەمووان؟"
    }
  },
  {
    id: "shy-with-new-people",
    category: "friendship",
    text: {
      en: "Who is the shyest about talking to someone new?",
      tr: "Kim yeni biriyle konuşmaya en çekinen kişidir?",
      ar: "من هو الأكثر خجلاً من التحدث مع شخص جديد؟",
      ku: "کێ لە هەمووان زیاتر شەرم دەکات لەگەڵ کەسێکی نوێ قسە بکات؟"
    }
  },
  {
    id: "make-everyone-laugh",
    category: "friendship",
    text: {
      en: "Who makes the most people laugh?",
      tr: "Kim en çok insanı güldürür?",
      ar: "من يُضحك أكبر عدد من الناس؟",
      ku: "کێ زۆرترین کەس پێدەکەنێنێت؟"
    }
  },
  {
    id: "first-to-agree-bad-idea",
    category: "chaos",
    text: {
      en: "Who is the first to say “Let's do it” to a bad idea?",
      tr: "Kim kötü bir fikre ilk “hadi yapalım” der?",
      ar: "من يكون أول من يقول «هيا نفعلها» لفكرة سيئة؟",
      ku: "کێ یەکەم کەس دەبێت بۆ بیرۆکەیەکی خراپ بڵێت «وەرن بیکەین»؟"
    }
  },
  {
    id: "ignore-own-plan",
    category: "friendship",
    text: {
      en: "Who makes a plan but doesn't follow it themselves?",
      tr: "Kim plan yapar ama plana kendisi uymaz?",
      ar: "من يضع الخطة ثم لا يلتزم بها بنفسه؟",
      ku: "کێ پلان دادەنێت بەڵام خۆی پابەندی نابێت؟"
    }
  },
  {
    id: "forget-passport-at-hotel",
    category: "daily",
    text: {
      en: "Who is most likely to leave their passport at the hotel on vacation?",
      tr: "Kim tatilde pasaportunu otelde unutur?",
      ar: "من الأكثر احتمالاً أن ينسى جواز سفره في الفندق أثناء العطلة؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە پشوودا پاسپۆرتەکەی لە هوتێل لەبیر بکات؟"
    }
  },
  {
    id: "attend-wrong-wedding",
    category: "chaos",
    text: {
      en: "Who is most likely to accidentally attend the wrong wedding?",
      tr: "Kim yanlışlıkla başka bir düğüne katılabilir?",
      ar: "من الأكثر احتمالاً أن يحضر حفل زفاف آخر بالخطأ؟",
      ku: "کێ زۆرترین ئەگەری هەیە بەهەڵە بەشداری لە ئاهەنگی هاوسەرگیرییەکی تر بکات؟"
    }
  },
  {
    id: "wrong-shoes-all-day",
    category: "funny",
    text: {
      en: "Who could wear the wrong shoes all day without noticing?",
      tr: "Kim bir gün boyunca yanlış ayakkabıyla dolaşır ve fark etmez?",
      ar: "من قد يتجوّل طوال اليوم بالحذاء الخطأ دون أن يلاحظ؟",
      ku: "کێ دەکرێت ڕۆژێکی تەواو بە پێڵاوی هەڵەوە بگەڕێت و تێبینی نەکات؟"
    }
  },
  {
    id: "one-item-twenty-purchases",
    category: "daily",
    text: {
      en: "Who goes to the shop for one thing and comes back with 20?",
      tr: "Kim markete bir şey almaya gidip 20 farklı şeyle geri döner?",
      ar: "من يذهب إلى المتجر لشراء شيء واحد ويعود بعشرين شيئاً؟",
      ku: "کێ بۆ کڕینی یەک شت دەچێتە مارکێت و بە ٢٠ شتی جیاواز دەگەڕێتەوە؟"
    }
  },
  {
    id: "go-out-in-pajamas",
    category: "funny",
    text: {
      en: "Who is most likely to leave home in pajamas and only realize later?",
      tr: "Kim evden pijamayla çıkıp sonradan fark eder?",
      ar: "من الأكثر احتمالاً أن يخرج بالبيجاما ولا ينتبه إلا لاحقاً؟",
      ku: "کێ زۆرترین ئەگەری هەیە بە پیژامە لە ماڵ بچێتە دەرەوە و دواتر تێبینی بکات؟"
    }
  },
  {
    id: "unrecognized-celebrity",
    category: "funny",
    text: {
      en: "Who could happen to chat with a celebrity without realizing they're famous?",
      tr: "Kim yanlışlıkla bir ünlüyle konuşup onun ünlü olduğunu anlamaz?",
      ar: "من قد يتحدث صدفة مع شخص مشهور دون أن يعرف أنه مشهور؟",
      ku: "کێ دەکرێت بە ڕێکەوت لەگەڵ کەسێکی بەناوبانگ قسە بکات و نەزانێت بەناوبانگە؟"
    }
  },
  {
    id: "home-alone-concert",
    category: "funny",
    text: {
      en: "Who acts like they're giving a concert when home alone?",
      tr: "Kim evde tek başınayken konser veriyormuş gibi davranır?",
      ar: "من يتصرّف وكأنه يحيي حفلاً غنائياً عندما يكون وحده في البيت؟",
      ku: "کێ کاتێک بە تەنهایە لە ماڵ وا هەڵسوکەوت دەکات وەک کۆنسێرتێک پێشکەش بکات؟"
    }
  },
  {
    id: "sleep-through-end-of-world",
    category: "chaos",
    text: {
      en: "Who would keep sleeping even on the last day of the world?",
      tr: "Kim dünyanın son günü olsa bile uyumaya devam eder?",
      ar: "من سيواصل النوم حتى لو كان اليوم الأخير في العالم؟",
      ku: "کێ تەنانەت ئەگەر دوا ڕۆژی جیهانیش بێت هەر بەردەوام دەخەوێت؟"
    }
  },
  {
    id: "chosen-for-most-questions",
    category: "friendship",
    text: {
      en: "Who is most likely to be picked for most of these questions?",
      tr: "Kim bu soruların çoğunda seçilecek kişidir?",
      ar: "من الأكثر احتمالاً أن يتم اختياره في معظم هذه الأسئلة؟",
      ku: "کێ زۆرترین ئەگەری هەیە لە زۆربەی ئەم پرسیارانەدا هەڵبژێردرێت؟"
    }
  }
] as const

const byId = new Map(MOST_LIKELY_TO_QUESTIONS.map(q => [q.id, q]))

/** Falls back to the first question: a room must never be stuck without one. */
export function resolveQuestion(id: string): Question {
  return byId.get(id) ?? MOST_LIKELY_TO_QUESTIONS[0]!
}
