import type { LangCode, LocalizedText } from "@shared/types.js"

export interface WhoAmICategory {
  key: string
  icon: string
  label: LocalizedText
  difficulty: "easy" | "medium" | "hard"
  words: Partial<Record<LangCode, string[]>>
}

export const RANDOM_MIX_KEY = "random-mix"

export const WHO_AM_I_CATEGORIES: readonly WhoAmICategory[] = [
  {
    key: "animals",
    icon: "🐾",
    difficulty: "easy",
    label: { en: "Animals", tr: "Hayvanlar", ar: "حيوانات", ku: "ئاژەڵەکان" },
    words: {
      en: ["Lion", "Cat", "Dog", "Eagle", "Shark", "Elephant", "Tiger", "Horse", "Monkey", "Wolf", "Bear", "Rabbit", "Snake", "Dolphin", "Owl"],
      tr: ["Aslan", "Kedi", "Köpek", "Kartal", "Köpekbalığı", "Fil", "Kaplan", "At", "Maymun", "Kurt", "Ayı", "Tavşan", "Yılan", "Yunus", "Baykuş"],
      ar: ["أسد", "قطة", "كلب", "نسر", "قرش", "فيل", "نمر", "حصان", "قرد", "ذئب", "دب", "أرنب", "أفعى", "دلفين", "بومة"],
      ku: ["شێر", "پشیلە", "سەگ", "هەڵۆ", "کۆسە", "فیل", "بەبر", "ئەسپ", "مەیموون", "گورگ", "ورچ", "کەروێشک", "مار", "دۆلفین", "کوندە"]
    }
  },
  {
    key: "fruits",
    icon: "🍎",
    difficulty: "easy",
    label: { en: "Fruits", tr: "Meyveler", ar: "فواكه", ku: "میوەکان" },
    words: {
      en: ["Banana", "Apple", "Orange", "Strawberry", "Watermelon", "Mango", "Grapes", "Pineapple", "Peach", "Cherry", "Lemon", "Kiwi", "Pear", "Pomegranate", "Coconut"],
      tr: ["Muz", "Elma", "Portakal", "Çilek", "Karpuz", "Mango", "Üzüm", "Ananas", "Şeftali", "Kiraz", "Limon", "Kivi", "Armut", "Nar", "Hindistan Cevizi"],
      ar: ["موز", "تفاح", "برتقال", "فراولة", "بطيخ", "مانجو", "عنب", "أناناس", "خوخ", "كرز", "ليمون", "كيوي", "إجاص", "رمان", "جوز الهند"],
      ku: ["مۆز", "سێو", "پرتەقاڵ", "فرۆلە", "شووتی", "مانگۆ", "ترێ", "ئەناناس", "قەیسی", "گێلاس", "لیمۆ", "کیوی", "هەرمێ", "هەنار", "جۆزی هیند"]
    }
  },
  {
    key: "objects",
    icon: "🎁",
    difficulty: "easy",
    label: { en: "Objects", tr: "Eşyalar", ar: "أشياء", ku: "شتومەک" },
    words: {
      en: ["Phone", "Chair", "Key", "Bag", "Book", "Bottle", "Clock", "Laptop", "Pen", "Camera", "Umbrella", "Mirror", "Wallet", "Glasses", "Lamp"],
      tr: ["Telefon", "Sandalye", "Anahtar", "Çanta", "Kitap", "Şişe", "Saat", "Dizüstü", "Kalem", "Kamera", "Şemsiye", "Ayna", "Cüzdan", "Gözlük", "Lamba"],
      ar: ["هاتف", "كرسي", "مفتاح", "حقيبة", "كتاب", "زجاجة", "ساعة", "حاسوب محمول", "قلم", "كاميرا", "مظلة", "مرآة", "محفظة", "نظارة", "مصباح"],
      ku: ["مۆبایل", "کورسی", "کلیل", "جانتا", "کتێب", "بوتڵ", "کاتژمێر", "لاپتۆپ", "قەڵەم", "کامێرا", "چەتر", "ئاوێنە", "جزدان", "چاویلکە", "چرا"]
    }
  },
  {
    key: "jobs",
    icon: "👨‍⚕️",
    difficulty: "easy",
    label: { en: "Jobs", tr: "Meslekler", ar: "مهن", ku: "پیشەکان" },
    words: {
      en: ["Doctor", "Teacher", "Mechanic", "Driver", "Chef", "Police Officer", "Engineer", "Barber", "Farmer", "Lawyer", "Nurse", "Pilot", "Firefighter", "Dentist", "Photographer"],
      tr: ["Doktor", "Öğretmen", "Tamirci", "Şoför", "Şef", "Polis", "Mühendis", "Berber", "Çiftçi", "Avukat", "Hemşire", "Pilot", "İtfaiyeci", "Diş Hekimi", "Fotoğrafçı"],
      ar: ["طبيب", "معلم", "ميكانيكي", "سائق", "طاهي", "شرطي", "مهندس", "حلاق", "مزارع", "محامي", "ممرضة", "طيار", "إطفائي", "طبيب أسنان", "مصور"],
      ku: ["پزیشک", "مامۆستا", "میکانیک", "شۆفێر", "چێشتلێنەر", "پۆلیس", "ئەندازیار", "ئەسلاحدار", "جوتیار", "پارێزەر", "پەرستیار", "فڕۆکەوان", "ئاگرکوژێنەوە", "پزیشکی ددان", "وێنەگر"]
    }
  },
  {
    key: "food-drinks",
    icon: "🍕",
    difficulty: "easy",
    label: { en: "Food & Drinks", tr: "Yiyecek & İçecek", ar: "طعام ومشروبات", ku: "خۆراک و خواردنەوە" },
    words: {
      en: ["Pizza", "Burger", "Tea", "Coffee", "Rice", "Kebab", "Cake", "Juice", "Soup", "Ice Cream", "Pasta", "Sushi", "Salad", "Bread", "Chocolate"],
      tr: ["Pizza", "Burger", "Çay", "Kahve", "Pilav", "Kebap", "Pasta", "Meyve Suyu", "Çorba", "Dondurma", "Makarna", "Suşi", "Salata", "Ekmek", "Çikolata"],
      ar: ["بيتزا", "برغر", "شاي", "قهوة", "أرز", "كباب", "كيك", "عصير", "شوربة", "آيس كريم", "مكرونة", "سوشي", "سلطة", "خبز", "شوكولاتة"],
      ku: ["پیتزا", "بێرگەر", "چا", "قاوە", "برنج", "کەباب", "کێک", "شەربەت", "شۆربا", "بەستەنی", "ماکارۆنی", "سوشی", "سالاد", "نان", "شیکۆلاتە"]
    }
  },
  {
    key: "countries",
    icon: "🌍",
    difficulty: "medium",
    label: { en: "Countries", tr: "Ülkeler", ar: "بلدان", ku: "وڵاتان" },
    words: {
      en: ["Iraq", "Turkey", "Japan", "Brazil", "France", "Germany", "Egypt", "Canada", "Italy", "China", "Spain", "Mexico", "India", "Australia", "Greece"],
      tr: ["Irak", "Türkiye", "Japonya", "Brezilya", "Fransa", "Almanya", "Mısır", "Kanada", "İtalya", "Çin", "İspanya", "Meksika", "Hindistan", "Avustralya", "Yunanistan"],
      ar: ["العراق", "تركيا", "اليابان", "البرازيل", "فرنسا", "ألمانيا", "مصر", "كندا", "إيطاليا", "الصين", "إسبانيا", "المكسيك", "الهند", "أستراليا", "اليونان"],
      ku: ["عێراق", "تورکیا", "یابان", "بەرازیل", "فەڕەنسا", "ئەڵمانیا", "میسر", "کەنەدا", "ئیتالیا", "چین", "ئیسپانیا", "مەکسیک", "هیندستان", "ئوسترالیا", "یۆنان"]
    }
  },
  {
    key: "vehicles",
    icon: "🚗",
    difficulty: "easy",
    label: { en: "Vehicles", tr: "Araçlar", ar: "مركبات", ku: "ئۆتۆمبیلەکان" },
    words: {
      en: ["Car", "Bus", "Truck", "Taxi", "Motorcycle", "Bicycle", "Ambulance", "Police Car", "Train", "Airplane", "Boat", "Helicopter", "Scooter", "Tractor", "Ship"],
      tr: ["Araba", "Otobüs", "Kamyon", "Taksi", "Motosiklet", "Bisiklet", "Ambulans", "Polis Arabası", "Tren", "Uçak", "Tekne", "Helikopter", "Scooter", "Traktör", "Gemi"],
      ar: ["سيارة", "حافلة", "شاحنة", "تاكسي", "دراجة نارية", "دراجة هوائية", "إسعاف", "سيارة شرطة", "قطار", "طائرة", "قارب", "مروحية", "سكوتر", "جرار", "سفينة"],
      ku: ["ئۆتۆمبیل", "پاس", "بارهەڵگر", "تاکسی", "ماتۆڕسکیل", "پایسکیل", "ئامبۆلانس", "ئۆتۆمبیلی پۆلیس", "شەمەندەفەر", "فڕۆکە", "بەلەم", "بالگرد", "سکوتەر", "تراکتۆر", "کەشتی"]
    }
  },
  {
    key: "car-parts",
    icon: "🔧",
    difficulty: "hard",
    label: { en: "Car Parts", tr: "Araç Parçaları", ar: "قطع غيار", ku: "بەشەکانی ئۆتۆمبیل" },
    words: {
      en: ["Engine", "Brake Pad", "Battery", "Radiator", "Oil Filter", "Spark Plug", "Tire", "Headlight", "Mirror", "Gearbox", "Clutch", "Steering Wheel", "Exhaust", "Bumper", "Windshield"],
      tr: ["Motor", "Fren Balatası", "Akü", "Radyatör", "Yağ Filtresi", "Buji", "Lastik", "Far", "Ayna", "Şanzıman", "Debriyaj", "Direksiyon", "Egzoz", "Tampon", "Ön Cam"],
      ar: ["محرك", "تيل فرامل", "بطارية", "رادياتير", "فلتر زيت", "بوجي", "إطار", "كشاف أمامي", "مرآة", "علبة تروس", "دبرياج", "مقود", "عادم", "صدام", "زجاج أمامي"],
      ku: ["ئەنجن", "بەلاتی فرامل", "باتری", "ڕادیاتۆر", "فیلتەری زەیت", "بووژی", "تایر", "لامپای پێشەوە", "ئاوێنە", "گێربۆکس", "دیپریاج", "ستێرنگ", "ئەگزۆست", "تامپۆن", "شووشەی پێشەوە"]
    }
  },
  {
    key: "famous",
    icon: "⭐",
    difficulty: "medium",
    label: { en: "Famous People", tr: "Ünlü Kişiler", ar: "شخصيات مشهورة", ku: "کەسایەتی ناودارەکان" },
    words: {
      en: ["Einstein", "Messi", "Ronaldo", "Beyoncé", "Elon Musk", "Shakespeare", "Mozart", "Picasso", "Napoleon", "Cleopatra", "Charlie Chaplin", "Steve Jobs", "Mandela", "Da Vinci", "Marilyn Monroe"],
      tr: ["Einstein", "Messi", "Ronaldo", "Beyoncé", "Elon Musk", "Shakespeare", "Mozart", "Picasso", "Napolyon", "Kleopatra", "Charlie Chaplin", "Steve Jobs", "Mandela", "Da Vinci", "Marilyn Monroe"],
      ar: ["أينشتاين", "ميسي", "رونالدو", "بيونسيه", "إيلون ماسك", "شكسبير", "موزارت", "بيكاسو", "نابليون", "كليوباترا", "تشارلي تشابلن", "ستيف جوبز", "مانديلا", "دافنشي", "مارلين مونرو"],
      ku: ["ئاینشتاین", "میسی", "ڕۆناڵدۆ", "بیۆنسێ", "ئیلۆن ماسک", "شێکسپیر", "مۆتسارت", "پیکاسۆ", "ناپۆلیۆن", "کلیۆپاترا", "چارلی چاپلن", "ستیڤ جۆبز", "ماندێلا", "داڤنچی", "مەرلین مۆنرۆ"]
    }
  }
] as const

export function getCategoryWords(category: WhoAmICategory, lang: LangCode): string[] {
  return category.words[lang] ?? category.words.en ?? []
}

export function pickWhoAmIWord(
  categoryKey: string,
  lang: LangCode,
  exclude: readonly string[] = [],
  rng: () => number = Math.random
): { word: string; categoryKey: string } {
  const excluded = new Set(exclude)
  const pool: Array<{ word: string; categoryKey: string }> = []

  if (categoryKey === RANDOM_MIX_KEY) {
    for (const cat of WHO_AM_I_CATEGORIES) {
      for (const word of getCategoryWords(cat, lang)) {
        pool.push({ word, categoryKey: cat.key })
      }
    }
  } else {
    const cat = WHO_AM_I_CATEGORIES.find(c => c.key === categoryKey)
    if (!cat) throw new Error("WHO_AM_I_UNKNOWN_CATEGORY")
    for (const word of getCategoryWords(cat, lang)) {
      pool.push({ word, categoryKey: cat.key })
    }
  }

  const fresh = pool.filter(p => !excluded.has(p.word))
  const choices = fresh.length > 0 ? fresh : pool
  if (choices.length === 0) throw new Error("WHO_AM_I_NO_WORDS")
  return choices[Math.floor(rng() * choices.length)]!
}

export function resolveCategoryLabel(key: string, lang: LangCode): string {
  if (key === RANDOM_MIX_KEY) {
    const mix: LocalizedText = {
      en: "Random Mix",
      tr: "Rastgele Karışım",
      ar: "خليط عشوائي",
      ku: "تێکەڵی هەڕەمەکی"
    }
    return mix[lang] ?? mix.en
  }
  const cat = WHO_AM_I_CATEGORIES.find(c => c.key === key)
  return cat ? (cat.label[lang] ?? cat.label.en) : key
}
