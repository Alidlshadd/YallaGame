import type { LocalizedText } from "@shared/types.js"
import type { MostLikelyToCategory } from "@shared/most-likely-to.js"

/**
 * Starter questions for "Most Likely To".
 *
 * Deliberately small: enough for a table to play an evening and for the tests
 * to have something to pick from, not a content drop. The shape is the one a
 * `questions` table would have, so moving this list into the database later is
 * a loader change and nothing else — ids are stable and are what the room
 * stores, never the text.
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
  }
] as const

const byId = new Map(MOST_LIKELY_TO_QUESTIONS.map(q => [q.id, q]))

/** Falls back to the first question: a room must never be stuck without one. */
export function resolveQuestion(id: string): Question {
  return byId.get(id) ?? MOST_LIKELY_TO_QUESTIONS[0]!
}
