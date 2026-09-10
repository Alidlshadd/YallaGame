import type { LocalizedText } from "@shared/types.js"

/**
 * Questions for "Bluff Trivia".
 *
 * Same shape convention as most-likely-to's question bank: stable ids the
 * room stores instead of text, and every string in all four languages so a
 * question is playable regardless of which language a given phone is set
 * to. `decoys` is the pre-written fallback pool a round draws from when
 * there are not enough submitted lies to fill the guessing screen on its
 * own — see `MIN_OPTIONS` in `bluff-trivia.ts`.
 *
 * A small, real dataset for now. A larger multilingual seed is future work,
 * the same way the original design intended.
 */

export interface BluffTriviaQuestion {
  id: string
  category: string
  question: LocalizedText
  correctAnswer: LocalizedText
  decoys: readonly LocalizedText[]
}

export const BLUFF_TRIVIA_QUESTIONS: readonly BluffTriviaQuestion[] = [
  {
    id: "honey-never-spoils",
    category: "science",
    question: {
      en: "According to archaeologists, how long can honey stay edible without spoiling?",
      tr: "Arkeologlara göre bal bozulmadan ne kadar süre yenilebilir kalabilir?",
      ar: "وفقاً لعلماء الآثار، كم من الوقت يمكن أن يبقى العسل صالحاً للأكل دون أن يفسد؟",
      ku: "بەپێی توێژەرانی شوێنەواری، هەنگوین چەند ماوەیەک دەتوانێت بەبێ خراپبوون بخورێت؟"
    },
    correctAnswer: {
      en: "Thousands of years",
      tr: "Binlerce yıl",
      ar: "آلاف السنين",
      ku: "هەزاران ساڵ"
    },
    decoys: [
      { en: "About six months", tr: "Yaklaşık altı ay", ar: "حوالي ستة أشهر", ku: "نزیکەی شەش مانگ" },
      { en: "Two to three years", tr: "İki ila üç yıl", ar: "من سنتين إلى ثلاث سنوات", ku: "لە دوو تا سێ ساڵ" },
      { en: "Roughly ten years", tr: "Yaklaşık on yıl", ar: "حوالي عشر سنوات", ku: "نزیکەی دە ساڵ" }
    ]
  },
  {
    id: "octopus-hearts",
    category: "nature",
    question: {
      en: "How many hearts does an octopus have?",
      tr: "Bir ahtapotun kaç kalbi vardır?",
      ar: "كم عدد قلوب الأخطبوط؟",
      ku: "ئاختەپۆت چەند دڵی هەیە؟"
    },
    correctAnswer: { en: "Three", tr: "Üç", ar: "ثلاثة", ku: "سێ" },
    decoys: [
      { en: "One", tr: "Bir", ar: "واحد", ku: "یەک" },
      { en: "Two", tr: "İki", ar: "اثنان", ku: "دوو" },
      { en: "Five", tr: "Beş", ar: "خمسة", ku: "پێنج" }
    ]
  },
  {
    id: "eiffel-tower-grows",
    category: "history",
    question: {
      en: "Why does the Eiffel Tower grow a little taller in summer?",
      tr: "Eyfel Kulesi yazın neden biraz daha uzun olur?",
      ar: "لماذا يصبح برج إيفل أطول قليلاً في الصيف؟",
      ku: "بۆچی قوللەی ئایفڵ لە هاویندا کەمێک بەرزتر دەبێت؟"
    },
    correctAnswer: {
      en: "The heat makes the iron expand",
      tr: "Sıcaklık demirin genleşmesine neden olur",
      ar: "الحرارة تجعل الحديد يتمدد",
      ku: "گەرمی وا لە ئاسن دەکات فراوان ببێت"
    },
    decoys: [
      {
        en: "New panels are added every year",
        tr: "Her yıl yeni paneller eklenir",
        ar: "تُضاف ألواح جديدة كل عام",
        ku: "ساڵانە تەختە نوێ زیاد دەکرێت"
      },
      {
        en: "It was built on soft ground that shifts",
        tr: "Zamanla kayan yumuşak bir zemin üzerine inşa edilmiştir",
        ar: "بُني على أرض طرية تتحرك مع الوقت",
        ku: "لەسەر زەوییەکی نەرم بنیاد نراوە کە جوڵە دەکات"
      },
      {
        en: "An optical illusion from the sun's angle",
        tr: "Güneşin açısından kaynaklanan bir optik yanılsamadır",
        ar: "وهم بصري ناتج عن زاوية الشمس",
        ku: "خەیاڵێکی بینینە لەبەر گۆشەی خۆر"
      }
    ]
  },
  {
    id: "shortest-war",
    category: "history",
    question: {
      en: "How long did the shortest war in recorded history last?",
      tr: "Tarihe geçen en kısa savaş ne kadar sürdü?",
      ar: "كم استغرقت أقصر حرب مسجلة في التاريخ؟",
      ku: "کورتترین جەنگ لە مێژوودا چەند خایاند؟"
    },
    correctAnswer: {
      en: "About 38 minutes",
      tr: "Yaklaşık 38 dakika",
      ar: "حوالي 38 دقيقة",
      ku: "نزیکەی ٣٨ خولەک"
    },
    decoys: [
      { en: "One day", tr: "Bir gün", ar: "يوم واحد", ku: "ڕۆژێک" },
      { en: "Three hours", tr: "Üç saat", ar: "ثلاث ساعات", ku: "سێ کاتژمێر" },
      { en: "One week", tr: "Bir hafta", ar: "أسبوع واحد", ku: "هەفتەیەک" }
    ]
  },
  {
    id: "bananas-are-berries",
    category: "science",
    question: {
      en: "Botanically speaking, which of these actually is a berry?",
      tr: "Botanik olarak bunlardan hangisi gerçekten bir meyve tanesi (berry) sayılır?",
      ar: "من الناحية النباتية، أي من هذه يُعتبر فعلاً من فصيلة التوت؟",
      ku: "لە ڕووی زیندەزانییەوە، کامیان لەم خواردنانە بەڕاستی جۆرێک لە \"بێری\"یە؟"
    },
    correctAnswer: { en: "Banana", tr: "Muz", ar: "الموز", ku: "مۆز" },
    decoys: [
      { en: "Strawberry", tr: "Çilek", ar: "الفراولة", ku: "تووی سواو (فراولا)" },
      { en: "Raspberry", tr: "Ahududu", ar: "التوت الأحمر", ku: "تمشکی سوور" },
      { en: "Blackberry", tr: "Böğürtlen", ar: "التوت الأسود", ku: "تمشکی ڕەش" }
    ]
  },
  {
    id: "national-animal-scotland",
    category: "strange-facts",
    question: {
      en: "What is the official national animal of Scotland?",
      tr: "İskoçya'nın resmi ulusal hayvanı nedir?",
      ar: "ما هو الحيوان الوطني الرسمي لاسكتلندا؟",
      ku: "ئاژەڵی نیشتیمانی فەرمی سکۆتلەند چییە؟"
    },
    correctAnswer: {
      en: "The unicorn",
      tr: "Tek boynuzlu at (unicorn)",
      ar: "وحيد القرن الخرافي (اليونيكورن)",
      ku: "یونیکۆرن (ئەسپە تاکشاخەکە)"
    },
    decoys: [
      { en: "The Highland cow", tr: "Highland ineği", ar: "بقرة الهايلاند", ku: "مانگای های لاند" },
      { en: "The golden eagle", tr: "Kaya kartalı", ar: "النسر الذهبي", ku: "هەڵۆی زێڕین" },
      { en: "The red deer", tr: "Kızıl geyik", ar: "الأيل الأحمر", ku: "ئاسکی سوور" }
    ]
  }
] as const

const byId = new Map(BLUFF_TRIVIA_QUESTIONS.map(q => [q.id, q]))

/** Falls back to the first question: a room must never be stuck without one. */
export function resolveBluffQuestion(id: string): BluffTriviaQuestion {
  return byId.get(id) ?? BLUFF_TRIVIA_QUESTIONS[0]!
}
