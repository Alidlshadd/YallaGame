import type { LangCode, LocalizedText } from "@shared/types.js"

/**
 * Canonical shared word/category database for Spy Game and Who Am I.
 *
 * Per-word data shape: { key, en, tr, ar, ku } — every word ships with
 * all four languages. The previous parallel-array shape made partial
 * coverage easy to ship by accident, and forced consumers to assume the
 * index alignment was correct. The object shape is loud about missing
 * data and validateWordCategories() rejects any incomplete entry.
 *
 * Audience: weighted toward Kurdistan Region & Iraq, so categories
 * include local cities (Hewlêr / Sulaymaniyah / Mosul / Baghdad / …),
 * regional foods (Masgouf / Dolma / Kleicha / Samoon), and a strong
 * automotive set (Car Brands + Car Parts + Garage Tools).
 *
 * Translation rules followed:
 *   • Kurdish = Sorani, written naturally (never reversed).
 *   • Arabic = MSA with Iraqi-familiar terms where idiomatic.
 *   • Turkish = simple, diacritics correct.
 *   • English = common everyday words.
 *   • No political, religious, adult, or otherwise sensitive entries.
 */

export type SupportedGame = "spy-game" | "who-am-i"

/**
 * Difficulty enum is intentionally broad — it covers content difficulty
 * (easy/medium/hard/expert) as well as audience hints (kids/adults) and
 * play-style hints (quick/long). Most categories use the content axis.
 */
export type CategoryDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "kids"
  | "adults"
  | "quick"
  | "long"

export interface LocalizedWord {
  key: string
  en: string
  tr: string
  ar: string
  ku: string
}

export interface WordCategory {
  key: string
  icon?: string
  difficulty: CategoryDifficulty
  label: LocalizedText
  description?: LocalizedText
  games: readonly SupportedGame[]
  words: readonly LocalizedWord[]
}

export const RANDOM_MIX_KEY = "random-mix"

const RANDOM_MIX_LABEL: LocalizedText = {
  en: "Random Mix",
  tr: "Rastgele Karışım",
  ar: "خليط عشوائي",
  ku: "تێکەڵی هەڕەمەکی"
}

/* ────────────────────────────────────────────────────────────────────
   Inline helper to keep word entries one-per-line and readable.
   Used inside the category arrays below — TypeScript still infers the
   LocalizedWord shape from each literal.
   ──────────────────────────────────────────────────────────────────── */
const w = (
  key: string,
  en: string,
  tr: string,
  ar: string,
  ku: string
): LocalizedWord => ({ key, en, tr, ar, ku })

const BOTH: readonly SupportedGame[] = ["spy-game", "who-am-i"]
const WHO_ONLY: readonly SupportedGame[] = ["who-am-i"]

/* eslint-disable max-len */
export const WORD_CATEGORIES: readonly WordCategory[] = [
  /* ─── 1. ANIMALS ─────────────────────────────────────────────────── */
  {
    key: "animals",
    icon: "🐾",
    difficulty: "easy",
    games: WHO_ONLY,
    label: { en: "Animals", tr: "Hayvanlar", ar: "حيوانات", ku: "ئاژەڵەکان" },
    description: {
      en: "Wildlife, pets, and farm animals everyone knows.",
      tr: "Vahşi hayvanlar, evcil dostlar ve çiftlik hayvanları.",
      ar: "حيوانات برية وأليفة ومن المزرعة يعرفها الجميع.",
      ku: "ئاژەڵی کێوی، ماڵی و کشتوکاڵی کە هەموو دەیناسن."
    },
    words: [
      w("lion",        "Lion",        "Aslan",        "أسد",          "شێر"),
      w("tiger",       "Tiger",       "Kaplan",       "نمر",          "بەبر"),
      w("elephant",    "Elephant",    "Fil",          "فيل",          "فیل"),
      w("monkey",      "Monkey",      "Maymun",       "قرد",          "مەیموون"),
      w("bear",        "Bear",        "Ayı",          "دب",           "ورچ"),
      w("wolf",        "Wolf",        "Kurt",         "ذئب",          "گورگ"),
      w("fox",         "Fox",         "Tilki",        "ثعلب",         "ڕێوی"),
      w("rabbit",      "Rabbit",      "Tavşan",       "أرنب",         "کەروێشک"),
      w("dog",         "Dog",         "Köpek",        "كلب",          "سەگ"),
      w("cat",         "Cat",         "Kedi",         "قطة",          "پشیلە"),
      w("horse",       "Horse",       "At",           "حصان",         "ئەسپ"),
      w("cow",         "Cow",         "İnek",         "بقرة",         "مانگا"),
      w("sheep",       "Sheep",       "Koyun",        "خروف",         "مەڕ"),
      w("goat",        "Goat",        "Keçi",         "ماعز",         "بزن"),
      w("donkey",      "Donkey",      "Eşek",         "حمار",         "گوێدرێژ"),
      w("camel",       "Camel",       "Deve",         "جمل",          "ووشتر"),
      w("chicken",     "Chicken",     "Tavuk",        "دجاجة",        "مریشک"),
      w("duck",        "Duck",        "Ördek",        "بطة",          "مراوی"),
      w("eagle",       "Eagle",       "Kartal",       "نسر",          "هەڵۆ"),
      w("owl",         "Owl",         "Baykuş",       "بومة",         "کوندە"),
      w("pigeon",      "Pigeon",      "Güvercin",     "حمامة",        "کۆتر"),
      w("sparrow",     "Sparrow",     "Serçe",        "عصفور",        "چۆلەکە"),
      w("fish",        "Fish",        "Balık",        "سمكة",         "ماسی"),
      w("shark",       "Shark",       "Köpekbalığı",  "قرش",          "کۆسە"),
      w("dolphin",     "Dolphin",     "Yunus",        "دلفين",        "دۆلفین"),
      w("snake",       "Snake",       "Yılan",        "أفعى",         "مار"),
      w("turtle",      "Turtle",      "Kaplumbağa",   "سلحفاة",       "کیسەڵ"),
      w("bee",         "Bee",         "Arı",          "نحلة",         "هەنگ"),
      w("butterfly",   "Butterfly",   "Kelebek",      "فراشة",        "پەپوولە"),
      w("ant",         "Ant",         "Karınca",      "نملة",         "مێروولە")
    ]
  },

  /* ─── 2. FRUITS ──────────────────────────────────────────────────── */
  {
    key: "fruits",
    icon: "🍎",
    difficulty: "easy",
    games: WHO_ONLY,
    label: { en: "Fruits", tr: "Meyveler", ar: "فواكه", ku: "میوەکان" },
    description: {
      en: "Fresh fruit you'd find at any market.",
      tr: "Her pazarda bulabileceğin taze meyveler.",
      ar: "فواكه طازجة تجدها في أي سوق.",
      ku: "میوەی تازە کە لە هەر بازاڕێکدا دەیدۆزیتەوە."
    },
    words: [
      w("apple",        "Apple",        "Elma",            "تفاح",        "سێو"),
      w("banana",       "Banana",       "Muz",             "موز",         "مۆز"),
      w("orange",       "Orange",       "Portakal",        "برتقال",      "پرتەقاڵ"),
      w("strawberry",   "Strawberry",   "Çilek",           "فراولة",      "فرۆلە"),
      w("watermelon",   "Watermelon",   "Karpuz",          "بطيخ",        "شووتی"),
      w("melon",        "Melon",        "Kavun",           "شمام",        "گەڕەک"),
      w("grapes",       "Grapes",       "Üzüm",            "عنب",         "ترێ"),
      w("pomegranate",  "Pomegranate",  "Nar",             "رمان",        "هەنار"),
      w("fig",          "Fig",          "İncir",           "تين",         "هەنجیر"),
      w("date",         "Date",         "Hurma",           "تمر",         "خورما"),
      w("apricot",      "Apricot",      "Kayısı",          "مشمش",        "زەردەلوو"),
      w("peach",        "Peach",        "Şeftali",         "خوخ",         "قەیسی"),
      w("plum",         "Plum",         "Erik",            "برقوق",       "هەلوژە"),
      w("cherry",       "Cherry",       "Kiraz",           "كرز",         "گێلاس"),
      w("pear",         "Pear",         "Armut",           "إجاص",        "هەرمێ"),
      w("mango",        "Mango",        "Mango",           "مانجو",       "مانگۆ"),
      w("pineapple",    "Pineapple",    "Ananas",          "أناناس",      "ئەناناس"),
      w("lemon",        "Lemon",        "Limon",           "ليمون",       "لیمۆ"),
      w("kiwi",         "Kiwi",         "Kivi",            "كيوي",        "کیوی"),
      w("coconut",      "Coconut",      "Hindistan Cevizi","جوز الهند",   "جۆزی هیند"),
      w("walnut",       "Walnut",       "Ceviz",           "جوز",         "گوێز"),
      w("almond",       "Almond",       "Badem",           "لوز",         "بادەم"),
      w("raisin",       "Raisin",       "Kuru Üzüm",       "زبيب",        "کشمیش"),
      w("strawberry-cluster","Berry",   "Yaban Mersini",   "توت",         "تووە"),
      w("guava",        "Guava",        "Guava",           "جوافة",       "گوێاڤا")
    ]
  },

  /* ─── 3. FOOD & DRINKS (heavy Iraqi/Kurdish flavor) ──────────────── */
  {
    key: "food-drinks",
    icon: "🍕",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Food & Drinks", tr: "Yiyecek & İçecek", ar: "طعام ومشروبات", ku: "خۆراک و خواردنەوە" },
    description: {
      en: "Local Iraqi and Kurdish dishes plus everyday meals and drinks.",
      tr: "Yöresel Irak ve Kürt yemekleri, günlük yemek ve içecekler.",
      ar: "أكلات عراقية وكردية محلية إضافة إلى وجبات ومشروبات يومية.",
      ku: "خواردنە ناوخۆییەکانی عێراق و کوردستان لەگەڵ ژەم و خواردنەوەی ڕۆژانە."
    },
    words: [
      w("dolma",         "Dolma",          "Dolma",         "دولمة",         "دۆڵمە"),
      w("biryani",       "Biryani",        "Biryani",       "برياني",        "بریانی"),
      w("kebab",         "Kebab",          "Kebap",         "كباب",          "کەباب"),
      w("masgouf",       "Masgouf",        "Masgouf",       "مصكوف",         "مەسگووف"),
      w("samoon",        "Samoon",         "Samun",         "صمون",          "صەموون"),
      w("kleicha",       "Kleicha",        "Kleicha",       "كليجة",         "کلێچە"),
      w("qaymar",        "Qaymar",         "Kaymak",        "قيمر",          "قەیمەر"),
      w("kunafa",        "Kunafa",         "Künefe",        "كنافة",         "کونافە"),
      w("baklava",       "Baklava",        "Baklava",       "بقلاوة",        "بەقڵاوا"),
      w("shawarma",      "Shawarma",       "Şavurma",       "شاورما",        "شاوەرما"),
      w("falafel",       "Falafel",        "Falafel",       "فلافل",         "فەلافیل"),
      w("hummus",        "Hummus",         "Humus",         "حمص",           "حومس"),
      w("lentil-soup",   "Lentil Soup",    "Mercimek Çorbası","شوربة عدس",   "شۆربای نیسک"),
      w("rice",          "Rice",           "Pilav",         "أرز",           "برنج"),
      w("bread",         "Bread",          "Ekmek",         "خبز",           "نان"),
      w("yogurt",        "Yogurt",         "Yoğurt",        "لبن",           "ماست"),
      w("ayran",         "Ayran",          "Ayran",         "عيران",         "ماستاو"),
      w("tea",           "Tea",            "Çay",           "شاي",           "چا"),
      w("coffee",        "Coffee",         "Kahve",         "قهوة",          "قاوە"),
      w("water",         "Water",          "Su",            "ماء",           "ئاو"),
      w("juice",         "Juice",          "Meyve Suyu",    "عصير",          "شەربەت"),
      w("milk",          "Milk",           "Süt",           "حليب",          "شیر"),
      w("pizza",         "Pizza",          "Pizza",         "بيتزا",         "پیتزا"),
      w("burger",        "Burger",         "Burger",        "برغر",          "بێرگەر"),
      w("pasta",         "Pasta",          "Makarna",       "مكرونة",        "ماکارۆنی"),
      w("cake",          "Cake",           "Pasta",         "كيك",           "کێک"),
      w("ice-cream",     "Ice Cream",      "Dondurma",      "آيس كريم",      "بەستەنی"),
      w("chocolate",     "Chocolate",      "Çikolata",      "شوكولاتة",      "شیکۆلاتە"),
      w("salad",         "Salad",          "Salata",        "سلطة",          "سالاد"),
      w("soup",          "Soup",           "Çorba",         "شوربة",         "شۆربا"),
      w("sandwich",      "Sandwich",       "Sandviç",       "ساندويتش",      "ساندویچ"),
      w("egg",           "Egg",            "Yumurta",       "بيض",           "هێلکە"),
      w("chicken-dish",  "Chicken",        "Tavuk",         "دجاج",          "مریشک"),
      w("fish-dish",     "Fish",           "Balık",         "سمك",           "ماسی"),
      w("french-fries",  "French Fries",   "Patates Kızartması","بطاطا مقلية","پەتاتە سوور"),
      w("honey",         "Honey",          "Bal",           "عسل",           "هەنگوین"),
      w("olive",         "Olive",          "Zeytin",        "زيتون",         "زەیتوون"),
      w("cheese",        "Cheese",         "Peynir",        "جبن",           "پەنیر"),
      w("butter",        "Butter",         "Tereyağı",      "زبدة",          "کەرە"),
      w("sugar",         "Sugar",          "Şeker",         "سكر",           "شەکر")
    ]
  },

  /* ─── 4. JOBS ────────────────────────────────────────────────────── */
  {
    key: "jobs",
    icon: "👨‍⚕️",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Jobs", tr: "Meslekler", ar: "مهن", ku: "پیشەکان" },
    description: {
      en: "Professions and trades found in every city.",
      tr: "Her şehirde bulunan meslekler ve zanaatlar.",
      ar: "مهن وحرف تجدها في كل مدينة.",
      ku: "پیشە و کارەکان کە لە هەموو شارێکدا هەن."
    },
    words: [
      w("doctor",          "Doctor",           "Doktor",         "طبيب",           "پزیشک"),
      w("nurse",           "Nurse",            "Hemşire",        "ممرضة",          "پەرستیار"),
      w("dentist",         "Dentist",          "Diş Hekimi",     "طبيب أسنان",     "پزیشکی ددان"),
      w("teacher",         "Teacher",          "Öğretmen",       "معلم",           "مامۆستا"),
      w("engineer",        "Engineer",         "Mühendis",       "مهندس",          "ئەندازیار"),
      w("architect",       "Architect",        "Mimar",          "مهندس معماري",   "تەلارساز"),
      w("lawyer",          "Lawyer",           "Avukat",         "محامي",          "پارێزەر"),
      w("judge",           "Judge",            "Yargıç",         "قاضي",           "دادوەر"),
      w("police-officer",  "Police Officer",   "Polis",          "شرطي",           "پۆلیس"),
      w("firefighter",     "Firefighter",      "İtfaiyeci",      "إطفائي",         "ئاگرکوژێنەوە"),
      w("soldier",         "Soldier",          "Asker",          "جندي",           "سەرباز"),
      w("pilot",           "Pilot",            "Pilot",          "طيار",           "فڕۆکەوان"),
      w("driver",          "Driver",           "Şoför",          "سائق",           "شۆفێر"),
      w("chef",            "Chef",             "Şef",            "طاهي",           "چێشتلێنەر"),
      w("baker",           "Baker",            "Fırıncı",        "خباز",           "نانەوا"),
      w("farmer",          "Farmer",           "Çiftçi",         "مزارع",          "جوتیار"),
      w("shepherd",        "Shepherd",         "Çoban",          "راعي",           "شوان"),
      w("barber",          "Barber",           "Berber",         "حلاق",           "ئەسلاحدار"),
      w("tailor",          "Tailor",           "Terzi",          "خياط",           "دەرزی"),
      w("mechanic",        "Mechanic",         "Tamirci",        "ميكانيكي",       "میکانیک"),
      w("electrician",     "Electrician",      "Elektrikçi",     "كهربائي",        "کارەباچی"),
      w("plumber",         "Plumber",          "Tesisatçı",      "سباك",           "بۆریچی"),
      w("carpenter",       "Carpenter",        "Marangoz",       "نجار",           "دارتاش"),
      w("painter",         "Painter",          "Ressam",         "رسام",           "نەخشە‌کێش"),
      w("photographer",    "Photographer",     "Fotoğrafçı",     "مصور",           "وێنەگر"),
      w("journalist",      "Journalist",       "Gazeteci",       "صحفي",           "ڕۆژنامەنووس"),
      w("translator",      "Translator",       "Tercüman",       "مترجم",          "وەرگێڕ"),
      w("waiter",          "Waiter",           "Garson",         "نادل",           "گارسۆن"),
      w("cashier",         "Cashier",          "Kasiyer",        "صراف",           "کاسیێر"),
      w("accountant",      "Accountant",       "Muhasebeci",     "محاسب",          "ژمێریار"),
      w("programmer",      "Programmer",       "Programcı",      "مبرمج",          "بەرنامەنووس"),
      w("designer",        "Graphic Designer", "Grafik Tasarımcı","مصمم",          "دیزاینەر"),
      w("scientist",       "Scientist",        "Bilim İnsanı",   "عالم",           "زاناکار"),
      w("singer",          "Singer",           "Şarkıcı",        "مغني",           "گۆرانیبێژ"),
      w("actor",           "Actor",            "Oyuncu",         "ممثل",           "ئەکتەر"),
      w("athlete",         "Athlete",          "Sporcu",         "رياضي",          "وەرزشکار"),
      w("guard",           "Security Guard",   "Güvenlik",       "حارس",           "پاسەوان"),
      w("postman",         "Postman",          "Postacı",        "ساعي بريد",      "پۆستچی"),
      w("librarian",       "Librarian",        "Kütüphaneci",    "أمين مكتبة",     "کتێبخانەوان"),
      w("pharmacist",      "Pharmacist",       "Eczacı",         "صيدلي",          "دەرمانساز")
    ]
  },

  /* ─── 5. OBJECTS (everyday items) ────────────────────────────────── */
  {
    key: "objects",
    icon: "🎁",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Objects", tr: "Eşyalar", ar: "أشياء", ku: "شتومەک" },
    description: {
      en: "Daily items everyone uses or carries.",
      tr: "Herkesin kullandığı veya taşıdığı günlük eşyalar.",
      ar: "أغراض يومية يستخدمها الجميع.",
      ku: "شتە ڕۆژانەکان کە هەموو بەکاریان دەهێنن."
    },
    words: [
      w("phone",          "Phone",          "Telefon",          "هاتف",          "مۆبایل"),
      w("laptop",         "Laptop",         "Dizüstü",          "حاسوب محمول",   "لاپتۆپ"),
      w("watch",          "Watch",          "Kol Saati",        "ساعة يد",       "کاتژمێری دەست"),
      w("clock",          "Clock",          "Saat",             "ساعة",          "کاتژمێر"),
      w("camera",         "Camera",         "Kamera",           "كاميرا",        "کامێرا"),
      w("book",           "Book",           "Kitap",            "كتاب",          "کتێب"),
      w("pen",            "Pen",            "Kalem",            "قلم",           "قەڵەم"),
      w("notebook",       "Notebook",       "Defter",           "دفتر",          "دەفتەر"),
      w("bag",            "Bag",            "Çanta",            "حقيبة",         "جانتا"),
      w("backpack",       "Backpack",       "Sırt Çantası",     "حقيبة ظهر",     "جانتای پشت"),
      w("wallet",         "Wallet",         "Cüzdan",           "محفظة",         "جزدان"),
      w("keys",           "Keys",           "Anahtar",          "مفتاح",         "کلیل"),
      w("glasses",        "Glasses",        "Gözlük",           "نظارة",         "چاویلکە"),
      w("sunglasses",     "Sunglasses",     "Güneş Gözlüğü",    "نظارة شمسية",   "چاویلکەی خۆر"),
      w("umbrella",       "Umbrella",       "Şemsiye",          "مظلة",          "چەتر"),
      w("mirror",         "Mirror",         "Ayna",             "مرآة",          "ئاوێنە"),
      w("bottle",         "Bottle",         "Şişe",             "زجاجة",         "بوتڵ"),
      w("cup",            "Cup",            "Bardak",           "كوب",           "پەرداخ"),
      w("plate",          "Plate",          "Tabak",            "صحن",           "قاپ"),
      w("spoon",          "Spoon",          "Kaşık",            "ملعقة",         "کەوچک"),
      w("fork",           "Fork",           "Çatal",            "شوكة",          "چەنگاڵ"),
      w("knife",          "Knife",          "Bıçak",            "سكين",          "چەقۆ"),
      w("chair",          "Chair",          "Sandalye",         "كرسي",          "کورسی"),
      w("table",          "Table",          "Masa",             "طاولة",         "مێز"),
      w("lamp",           "Lamp",           "Lamba",            "مصباح",         "چرا"),
      w("door",           "Door",           "Kapı",             "باب",           "دەرگا"),
      w("window",         "Window",         "Pencere",          "نافذة",         "پەنجەرە"),
      w("ring",           "Ring",           "Yüzük",            "خاتم",          "ئەنگوستیلە"),
      w("necklace",       "Necklace",       "Kolye",            "قلادة",         "ملوانکە"),
      w("shoe",           "Shoe",           "Ayakkabı",         "حذاء",          "پێڵاو"),
      w("hat",            "Hat",            "Şapka",            "قبعة",          "کڵاو"),
      w("blanket",        "Blanket",        "Battaniye",        "بطانية",        "لێفە"),
      w("pillow",         "Pillow",         "Yastık",           "وسادة",         "سەرین"),
      w("brush",          "Brush",          "Fırça",            "فرشاة",         "فرشە"),
      w("toothbrush",     "Toothbrush",     "Diş Fırçası",      "فرشاة أسنان",   "فرشەی ددان"),
      w("toothpaste",     "Toothpaste",     "Diş Macunu",       "معجون أسنان",   "ماجوونی ددان"),
      w("battery",        "Battery",        "Pil",              "بطارية",        "پاتری"),
      w("flashlight",     "Flashlight",     "El Feneri",        "كشاف يدوي",     "چرای دەست"),
      w("scissors",       "Scissors",       "Makas",            "مقص",           "مەقەست"),
      w("calendar",       "Calendar",       "Takvim",           "تقويم",         "ساڵنامە")
    ]
  },

  /* ─── 6. HOME ITEMS ──────────────────────────────────────────────── */
  {
    key: "home-items",
    icon: "🛋️",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Home Items", tr: "Ev Eşyaları", ar: "مستلزمات المنزل", ku: "کەلوپەلی ماڵ" },
    description: {
      en: "Furniture and appliances in a typical home.",
      tr: "Tipik bir evdeki mobilya ve aletler.",
      ar: "أثاث وأجهزة تجدها في أي منزل.",
      ku: "هەرە و ئامێرە‌کان لە ماڵێکی ئاسایی."
    },
    words: [
      w("sofa",           "Sofa",           "Koltuk",           "أريكة",           "قەنەفە"),
      w("bed",            "Bed",            "Yatak",            "سرير",            "قەرەوێڵە"),
      w("wardrobe",       "Wardrobe",       "Dolap",            "خزانة",           "دۆڵاپ"),
      w("dining-table",   "Dining Table",   "Yemek Masası",     "طاولة الطعام",    "مێزی نان"),
      w("kitchen",        "Kitchen",        "Mutfak",           "مطبخ",            "چێشتخانە"),
      w("bathroom",       "Bathroom",       "Banyo",            "حمام",            "حەمام"),
      w("bedroom",        "Bedroom",        "Yatak Odası",      "غرفة نوم",        "ژووری خەو"),
      w("living-room",    "Living Room",    "Salon",            "غرفة معيشة",      "ژووری دانیشتن"),
      w("balcony",        "Balcony",        "Balkon",           "شرفة",            "بەلکۆن"),
      w("refrigerator",   "Refrigerator",   "Buzdolabı",        "ثلاجة",           "ساردکەرەوە"),
      w("oven",           "Oven",           "Fırın",            "فرن",             "تەنوور"),
      w("microwave",      "Microwave",      "Mikrodalga",       "مايكروويف",       "مایکرۆوەیڤ"),
      w("dishwasher",     "Dishwasher",     "Bulaşık Makinesi", "غسالة صحون",      "ئامێری شوشتنی قاپ"),
      w("washing-machine","Washing Machine","Çamaşır Makinesi", "غسالة ملابس",     "ئامێری شوشتنی جل"),
      w("vacuum",         "Vacuum Cleaner", "Süpürge",          "مكنسة كهربائية",  "ئامێری گەردگرتن"),
      w("iron",           "Iron",           "Ütü",              "مكواة",           "ئوتوو"),
      w("kettle",         "Kettle",         "Su Isıtıcısı",     "غلاية",           "کوتری چا"),
      w("toaster",        "Toaster",        "Tost Makinesi",    "محمصة",           "تۆستەر"),
      w("blender",        "Blender",        "Blender",          "خلاط",            "تێکدەر"),
      w("fan",            "Fan",            "Vantilatör",       "مروحة",           "پانکە"),
      w("air-conditioner","Air Conditioner","Klima",            "مكيف",            "ساردکەرەوەی هەوا"),
      w("heater",         "Heater",         "Isıtıcı",          "مدفأة",           "گەرمکەرەوە"),
      w("curtain",        "Curtain",        "Perde",            "ستارة",           "پەردە"),
      w("carpet",         "Carpet",         "Halı",             "سجادة",           "فەرش"),
      w("television",     "Television",     "Televizyon",       "تلفاز",           "تەلەفزیۆن"),
      w("remote",         "Remote Control", "Kumanda",          "ريموت",           "کۆنترۆڵ"),
      w("doorbell",       "Doorbell",       "Kapı Zili",        "جرس الباب",       "زەنگی دەرگا"),
      w("stairs",         "Stairs",         "Merdiven",         "درج",             "پلیکانە"),
      w("elevator",       "Elevator",       "Asansör",          "مصعد",            "ئاسانسۆر"),
      w("garage",         "Garage",         "Garaj",            "كراج",            "گەراج")
    ]
  },

  /* ─── 7. SCHOOL ITEMS ────────────────────────────────────────────── */
  {
    key: "school-items",
    icon: "📚",
    difficulty: "easy",
    games: BOTH,
    label: { en: "School Items", tr: "Okul Eşyaları", ar: "مستلزمات المدرسة", ku: "کەلوپەلی قوتابخانە" },
    description: {
      en: "Things you'd find in any classroom.",
      tr: "Her sınıfta bulabileceğin şeyler.",
      ar: "أشياء تجدها في أي فصل دراسي.",
      ku: "شتانێک کە لە هەر پۆلێکدا دەیدۆزیتەوە."
    },
    words: [
      w("pencil",         "Pencil",         "Kurşun Kalem",   "قلم رصاص",       "قەڵەمی ڕەسەن"),
      w("eraser",         "Eraser",         "Silgi",          "ممحاة",          "تەختەسڕ"),
      w("ruler",          "Ruler",          "Cetvel",         "مسطرة",          "ڕیزبەند"),
      w("textbook",       "Textbook",       "Ders Kitabı",    "كتاب دراسي",     "کتێبی دەرس"),
      w("notebook-school","Notebook",       "Defter",         "دفتر",           "دەفتەر"),
      w("backpack-school","Schoolbag",      "Okul Çantası",   "حقيبة مدرسية",   "جانتای قوتابخانە"),
      w("blackboard",     "Blackboard",     "Kara Tahta",     "سبورة",          "تەختەی ڕەش"),
      w("whiteboard",     "Whiteboard",     "Beyaz Tahta",    "سبورة بيضاء",    "تەختەی سپی"),
      w("marker",         "Marker",         "Keçeli Kalem",   "قلم تخطيط",      "ماکێر"),
      w("chalk",          "Chalk",          "Tebeşir",        "طباشير",         "گەچ"),
      w("desk",           "Desk",           "Sıra",           "مكتب",           "مێزی قوتابی"),
      w("teacher-school", "Teacher",        "Öğretmen",       "معلم",           "مامۆستا"),
      w("student",        "Student",        "Öğrenci",        "طالب",           "قوتابی"),
      w("principal",      "Principal",      "Müdür",          "مدير",           "بەڕێوەبەر"),
      w("classroom",      "Classroom",      "Sınıf",          "صف",             "پۆل"),
      w("library",        "Library",        "Kütüphane",      "مكتبة",          "کتێبخانە"),
      w("cafeteria",      "Cafeteria",      "Kantin",         "كافتيريا",       "کافتریا"),
      w("exam",           "Exam",           "Sınav",          "امتحان",         "تاقیکردنەوە"),
      w("homework",       "Homework",       "Ödev",           "واجب",           "ئەرک"),
      w("lesson",         "Lesson",         "Ders",           "درس",            "وانە"),
      w("uniform",        "Uniform",        "Üniforma",       "زي مدرسي",       "فۆرم"),
      w("schoolbus",      "School Bus",     "Okul Servisi",   "حافلة مدرسية",   "پاسی قوتابخانە"),
      w("calculator",     "Calculator",     "Hesap Makinesi", "آلة حاسبة",      "ژمێریار"),
      w("map-school",     "Map",            "Harita",         "خريطة",          "نەخشە"),
      w("globe-school",   "Globe",          "Yer Küresi",     "كرة أرضية",      "گۆی زەوی")
    ]
  },

  /* ─── 8. TECHNOLOGY ──────────────────────────────────────────────── */
  {
    key: "technology",
    icon: "💻",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Technology", tr: "Teknoloji", ar: "تكنولوجيا", ku: "تەکنەلۆژیا" },
    description: {
      en: "Gadgets, devices, and modern tech essentials.",
      tr: "Modern teknoloji ürünleri, cihazlar ve aletler.",
      ar: "أجهزة وأدوات تكنولوجية حديثة.",
      ku: "ئامێر و کەلوپەلی تەکنەلۆژیای نوێ."
    },
    words: [
      w("smartphone",     "Smartphone",     "Akıllı Telefon", "هاتف ذكي",        "مۆبایلی زیرەک"),
      w("laptop-tech",    "Laptop",         "Dizüstü",        "حاسوب محمول",     "لاپتۆپ"),
      w("tablet",         "Tablet",         "Tablet",         "جهاز لوحي",       "تابلێت"),
      w("desktop",        "Desktop",        "Masaüstü",       "حاسوب مكتبي",     "کۆمپیوتەری مێز"),
      w("monitor",        "Monitor",        "Monitör",        "شاشة",            "شاشە"),
      w("keyboard",       "Keyboard",       "Klavye",         "لوحة مفاتيح",     "کلاوێ"),
      w("mouse",          "Mouse",          "Fare",           "فأرة",            "ماوس"),
      w("printer",        "Printer",        "Yazıcı",         "طابعة",           "پرینتەر"),
      w("scanner",        "Scanner",        "Tarayıcı",       "ماسح ضوئي",       "سکانەر"),
      w("speaker",        "Speaker",        "Hoparlör",       "مكبر صوت",        "بڵندگۆ"),
      w("headphones",     "Headphones",     "Kulaklık",       "سماعات",          "گوێگرە"),
      w("microphone",     "Microphone",     "Mikrofon",       "ميكروفون",        "میکرۆفۆن"),
      w("charger",        "Charger",        "Şarj Aleti",     "شاحن",            "شارژەر"),
      w("usb-cable",      "USB Cable",      "USB Kablosu",    "كابل USB",        "کێبڵی USB"),
      w("router",         "Router",         "Modem",          "راوتر",           "ڕاوتەر"),
      w("wifi",           "Wi-Fi",          "Wi-Fi",          "واي فاي",         "وای-فای"),
      w("bluetooth",      "Bluetooth",      "Bluetooth",      "بلوتوث",          "بلووتووس"),
      w("hard-drive",     "Hard Drive",     "Sabit Disk",     "قرص صلب",         "هاردیسک"),
      w("flash-drive",    "USB Stick",      "USB Bellek",     "فلاش",            "فلاش"),
      w("memory-card",    "Memory Card",    "Hafıza Kartı",   "بطاقة ذاكرة",     "کارتی یادگە"),
      w("camera-tech",    "Camera",         "Kamera",         "كاميرا",          "کامێرا"),
      w("drone",          "Drone",          "Drone",          "درون",            "درۆن"),
      w("robot",          "Robot",          "Robot",          "روبوت",           "ڕۆبۆت"),
      w("smartwatch",     "Smart Watch",    "Akıllı Saat",    "ساعة ذكية",       "کاتژمێری زیرەک"),
      w("vr-headset",     "VR Headset",     "VR Gözlük",      "نظارة VR",        "چاویلکەی VR"),
      w("console",        "Game Console",   "Oyun Konsolu",   "كونسول ألعاب",    "کۆنسۆڵی یاری"),
      w("solar-panel",    "Solar Panel",    "Güneş Paneli",   "لوح شمسي",        "پانێڵی خۆر"),
      w("server",         "Server",         "Sunucu",         "سيرفر",           "سێرڤەر"),
      w("battery-tech",   "Battery",        "Pil",            "بطارية",          "پاتری"),
      w("power-bank",     "Power Bank",     "Power Bank",     "باور بانك",       "پاوەربانک"),
      w("video-call",     "Video Call",     "Görüntülü Arama","مكالمة فيديو",    "پەیوەندی ڤیدیۆیی"),
      w("email",          "Email",          "E-Posta",        "بريد إلكتروني",   "ئیمەیڵ"),
      w("password",       "Password",       "Şifre",          "كلمة سر",         "وشەی نهێنی"),
      w("cloud-storage",  "Cloud Storage",  "Bulut Depolama", "تخزين سحابي",     "هەڵگرتنی هەوری"),
      w("touch-screen",   "Touch Screen",   "Dokunmatik",     "شاشة لمس",        "شاشەی دەستلێدان")
    ]
  },

  /* ─── 9. APPS & WEBSITES ─────────────────────────────────────────── */
  {
    key: "apps-websites",
    icon: "📱",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Apps & Websites", tr: "Uygulamalar & Siteler", ar: "تطبيقات ومواقع", ku: "ئەپ و وێبسایت" },
    description: {
      en: "Popular apps and websites everyone has heard of.",
      tr: "Herkesin bildiği popüler uygulama ve siteler.",
      ar: "تطبيقات ومواقع مشهورة يعرفها الجميع.",
      ku: "ئەپ و وێبسایتی بەناوبانگ کە هەموو دەیناسن."
    },
    words: [
      w("whatsapp",     "WhatsApp",   "WhatsApp",   "واتساب",       "واتساپ"),
      w("instagram",    "Instagram",  "Instagram",  "إنستغرام",     "ئینستاگرام"),
      w("facebook",     "Facebook",   "Facebook",   "فيسبوك",       "فەیسبووک"),
      w("tiktok",       "TikTok",     "TikTok",     "تيك توك",      "تیک‌تۆک"),
      w("youtube",      "YouTube",    "YouTube",    "يوتيوب",       "یوتیوب"),
      w("snapchat",     "Snapchat",   "Snapchat",   "سناب شات",     "سناپچات"),
      w("telegram",     "Telegram",   "Telegram",   "تيليجرام",     "تەلەگرام"),
      w("twitter",      "Twitter",    "Twitter",    "تويتر",        "تویتەر"),
      w("google",       "Google",     "Google",     "جوجل",         "گووگڵ"),
      w("gmail",        "Gmail",      "Gmail",      "جيميل",        "جیمەیڵ"),
      w("netflix",      "Netflix",    "Netflix",    "نتفليكس",      "نێتفلیکس"),
      w("spotify",      "Spotify",    "Spotify",    "سبوتيفاي",     "سپۆتیفای"),
      w("zoom",         "Zoom",       "Zoom",       "زووم",         "زووم"),
      w("uber",         "Uber",       "Uber",       "أوبر",         "ئوبەر"),
      w("careem",       "Careem",     "Careem",     "كريم",         "کەریم"),
      w("amazon",       "Amazon",     "Amazon",     "أمازون",       "ئامازۆن"),
      w("paypal",       "PayPal",     "PayPal",     "باي بال",      "پەی‌پاڵ"),
      w("linkedin",     "LinkedIn",   "LinkedIn",   "لينكد إن",     "لینکدئن"),
      w("pinterest",    "Pinterest",  "Pinterest",  "بنترست",       "پنتەرست"),
      w("reddit",       "Reddit",     "Reddit",     "ريديت",        "ڕێدیت"),
      w("wikipedia",    "Wikipedia",  "Wikipedia",  "ويكيبيديا",    "ویکیپیدیا"),
      w("chatgpt",      "ChatGPT",    "ChatGPT",    "شات جي بي تي", "چات‌جی‌پی‌تی"),
      w("discord",      "Discord",    "Discord",    "ديسكورد",      "دیسکۆرد"),
      w("twitch",       "Twitch",     "Twitch",     "تويتش",        "تویچ"),
      w("noon",         "Noon",       "Noon",       "نون",          "نوون")
    ]
  },

  /* ─── 10. COUNTRIES ─────────────────────────────────────────────── */
  {
    key: "countries",
    icon: "🌍",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Countries", tr: "Ülkeler", ar: "بلدان", ku: "وڵاتان" },
    description: {
      en: "Well-known countries from around the world.",
      tr: "Dünyanın bilinen ülkeleri.",
      ar: "دول معروفة من حول العالم.",
      ku: "وڵاتانێکی ناسراو لە هەموو جیهان."
    },
    words: [
      w("iraq",       "Iraq",          "Irak",          "العراق",         "عێراق"),
      w("turkey",     "Turkey",        "Türkiye",       "تركيا",          "تورکیا"),
      w("iran",       "Iran",          "İran",          "إيران",          "ئێران"),
      w("syria",      "Syria",         "Suriye",        "سوريا",          "سوریا"),
      w("saudi",      "Saudi Arabia",  "Suudi Arabistan","السعودية",      "سعوودیە"),
      w("uae",        "UAE",           "BAE",           "الإمارات",       "ئیمارات"),
      w("qatar",      "Qatar",         "Katar",         "قطر",            "قەتەر"),
      w("kuwait",     "Kuwait",        "Kuveyt",        "الكويت",         "کوێت"),
      w("jordan",     "Jordan",        "Ürdün",         "الأردن",         "ئوردن"),
      w("egypt",      "Egypt",         "Mısır",         "مصر",            "میسر"),
      w("morocco",    "Morocco",       "Fas",           "المغرب",         "مەغریب"),
      w("lebanon",    "Lebanon",       "Lübnan",        "لبنان",          "لوبنان"),
      w("palestine",  "Palestine",     "Filistin",      "فلسطين",         "فەلەستین"),
      w("france",     "France",        "Fransa",        "فرنسا",          "فەڕەنسا"),
      w("germany",    "Germany",       "Almanya",       "ألمانيا",        "ئەڵمانیا"),
      w("italy",      "Italy",         "İtalya",        "إيطاليا",        "ئیتالیا"),
      w("spain",      "Spain",         "İspanya",       "إسبانيا",        "ئیسپانیا"),
      w("uk",         "United Kingdom","Birleşik Krallık","بريطانيا",     "بەریتانیا"),
      w("usa",        "United States", "Amerika",       "أمريكا",         "ئەمریکا"),
      w("canada",     "Canada",        "Kanada",        "كندا",           "کەنەدا"),
      w("brazil",     "Brazil",        "Brezilya",      "البرازيل",       "بەرازیل"),
      w("argentina",  "Argentina",     "Arjantin",      "الأرجنتين",      "ئەرژەنتین"),
      w("mexico",     "Mexico",        "Meksika",       "المكسيك",        "مەکسیک"),
      w("japan",      "Japan",         "Japonya",       "اليابان",        "یابان"),
      w("china",      "China",         "Çin",           "الصين",          "چین"),
      w("india",      "India",         "Hindistan",     "الهند",          "هیندستان"),
      w("south-korea","South Korea",   "Güney Kore",    "كوريا الجنوبية", "کۆریای باشوور"),
      w("russia",     "Russia",        "Rusya",         "روسيا",          "ڕووسیا"),
      w("greece",     "Greece",        "Yunanistan",    "اليونان",        "یۆنان"),
      w("netherlands","Netherlands",   "Hollanda",      "هولندا",         "هۆڵەندا"),
      w("sweden",     "Sweden",        "İsveç",         "السويد",         "سوید"),
      w("australia",  "Australia",     "Avustralya",    "أستراليا",       "ئوسترالیا"),
      w("south-africa","South Africa", "Güney Afrika",  "جنوب أفريقيا",   "ئەفریقیای باشوور"),
      w("portugal",   "Portugal",      "Portekiz",      "البرتغال",       "پۆرتوگاڵ"),
      w("indonesia",  "Indonesia",     "Endonezya",     "إندونيسيا",      "ئەندۆنیسیا")
    ]
  },

  /* ─── 11. IRAQ & KURDISTAN CITIES ────────────────────────────────── */
  {
    key: "iraq-kurdistan-cities",
    icon: "🏙️",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Iraq & Kurdistan Cities", tr: "Irak ve Kürdistan Şehirleri", ar: "مدن العراق وكردستان", ku: "شارەکانی عێراق و کوردستان" },
    description: {
      en: "Cities and towns across Iraq and the Kurdistan Region.",
      tr: "Irak ve Kürdistan Bölgesi şehirleri.",
      ar: "مدن وبلدات في عموم العراق وإقليم كردستان.",
      ku: "شار و شارۆچکەکانی سەرتاسەری عێراق و هەرێمی کوردستان."
    },
    words: [
      w("erbil",        "Erbil",         "Erbil",         "أربيل",        "هەولێر"),
      w("sulaymaniyah", "Sulaymaniyah",  "Süleymaniye",   "السليمانية",   "سلێمانی"),
      w("duhok",        "Duhok",         "Dohuk",         "دهوك",         "دهۆک"),
      w("halabja",      "Halabja",       "Halepçe",       "حلبجة",        "هەڵەبجە"),
      w("kirkuk",       "Kirkuk",        "Kerkük",        "كركوك",        "کەرکووک"),
      w("mosul",        "Mosul",         "Musul",         "الموصل",       "مووسڵ"),
      w("baghdad",      "Baghdad",       "Bağdat",        "بغداد",        "بەغدا"),
      w("basra",        "Basra",         "Basra",         "البصرة",       "بەسرە"),
      w("najaf",        "Najaf",         "Necef",         "النجف",        "نەجەف"),
      w("karbala",      "Karbala",       "Kerbela",       "كربلاء",       "کەربەلا"),
      w("zakho",        "Zakho",         "Zaho",          "زاخو",         "زاخۆ"),
      w("koya",         "Koya",          "Koya",          "كويسنجق",      "کۆیە"),
      w("ranya",        "Ranya",         "Ranye",         "رانية",        "ڕانیە"),
      w("akre",         "Akre",          "Akra",          "عقرة",         "ئاکرێ"),
      w("shaqlawa",     "Shaqlawa",      "Şeqlawe",       "شقلاوة",       "شەقڵاوە"),
      w("choman",       "Choman",        "Çoman",         "جومان",        "چۆمان"),
      w("rawanduz",     "Rawanduz",      "Revandüz",      "راوندوز",      "ڕەواندز"),
      w("amedi",        "Amedi",         "Amedi",         "العمادية",     "ئامێدی"),
      w("soran",        "Soran",         "Soran",         "سوران",        "سۆران"),
      w("penjwen",      "Penjwen",       "Pencvin",       "بنجوين",       "پێنجوێن"),
      w("tikrit",       "Tikrit",        "Tikrit",        "تكريت",        "تکریت"),
      w("ramadi",       "Ramadi",        "Ramadi",        "الرمادي",      "ڕەمادی"),
      w("nasiriyah",    "Nasiriyah",     "Nasıriye",      "الناصرية",     "ناسریە"),
      w("hilla",        "Hilla",         "Hille",         "الحلة",        "حیلە"),
      w("samawah",      "Samawah",       "Semave",        "السماوة",      "سەماوە"),
      w("amara",        "Amara",         "Amara",         "العمارة",      "عەمارە"),
      w("garmian",      "Garmian",       "Germiyan",      "كرميان",       "گەرمیان")
    ]
  },

  /* ─── 12. FAMOUS PLACES / LANDMARKS ──────────────────────────────── */
  {
    key: "famous-places",
    icon: "🗽",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Famous Places", tr: "Ünlü Yerler", ar: "أماكن مشهورة", ku: "شوێنە بەناوبانگەکان" },
    description: {
      en: "World-famous landmarks and monuments.",
      tr: "Dünya çapında ünlü yapılar ve anıtlar.",
      ar: "معالم وأبنية شهيرة حول العالم.",
      ku: "شوێن و ئەسەرە بەناوبانگەکانی جیهان."
    },
    words: [
      w("eiffel-tower",      "Eiffel Tower",      "Eyfel Kulesi",    "برج إيفل",       "بورجی ئەیفێل"),
      w("big-ben",           "Big Ben",           "Big Ben",         "بيغ بن",         "بیگ بێن"),
      w("colosseum",         "Colosseum",         "Kolezyum",        "الكولوسيوم",     "کۆلیزیۆم"),
      w("pyramids",          "Pyramids",          "Piramitler",      "الأهرامات",      "ئەهرامەکان"),
      w("sphinx",            "Sphinx",            "Sfenks",          "أبو الهول",      "ئەبوولهۆڵ"),
      w("statue-of-liberty", "Statue of Liberty", "Özgürlük Heykeli","تمثال الحرية",   "پەیکەری ئازادی"),
      w("great-wall",        "Great Wall",        "Çin Seddi",       "سور الصين",      "شوورای چین"),
      w("taj-mahal",         "Taj Mahal",         "Tac Mahal",       "تاج محل",        "تاج مەهەل"),
      w("hagia-sophia",      "Hagia Sophia",      "Ayasofya",        "آيا صوفيا",      "ئایا سۆفیا"),
      w("blue-mosque",       "Blue Mosque",       "Sultanahmet",     "الجامع الأزرق",  "مزگەوتی شین"),
      w("burj-khalifa",      "Burj Khalifa",      "Burj Halife",     "برج خليفة",      "بورجی خەلیفە"),
      w("kaaba",             "Kaaba",             "Kâbe",            "الكعبة",         "کەعبە"),
      w("grand-bazaar",      "Grand Bazaar",      "Kapalı Çarşı",    "البازار الكبير", "بازاڕی گەورە"),
      w("erbil-citadel",     "Erbil Citadel",     "Erbil Kalesi",    "قلعة أربيل",     "قەڵای هەولێر"),
      w("babylon",           "Babylon",           "Babil",           "بابل",           "بابل"),
      w("ziggurat",          "Ziggurat of Ur",    "Ur Ziguratı",     "زقورة أور",      "زیقوراتی ئوور"),
      w("petra",             "Petra",             "Petra",           "البتراء",        "پێترا"),
      w("acropolis",         "Acropolis",         "Akropolis",       "الأكروبوليس",    "ئاکرۆپۆلیس"),
      w("louvre",            "Louvre Museum",     "Louvre Müzesi",   "متحف اللوفر",    "مۆزەخانەی لوڤر"),
      w("tower-of-pisa",     "Leaning Tower",     "Pisa Kulesi",     "برج بيزا",       "بورجی پیسا"),
      w("mount-fuji",        "Mount Fuji",        "Fuji Dağı",       "جبل فوجي",       "چیای فوجی"),
      w("niagara-falls",     "Niagara Falls",     "Niagara Şelalesi","شلالات نياجرا",  "تاڤگەی نیاگارا"),
      w("hollywood-sign",    "Hollywood Sign",    "Hollywood Tabelası","علامة هوليوود","نیشانەی هۆلیوود"),
      w("times-square",      "Times Square",      "Times Square",    "تايمز سكوير",    "تایمز سکوێر"),
      w("dead-sea",          "Dead Sea",          "Ölü Deniz",       "البحر الميت",    "دەریای مردوو")
    ]
  },

  /* ─── 13. VEHICLES ───────────────────────────────────────────────── */
  {
    key: "vehicles",
    icon: "🚗",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Vehicles", tr: "Araçlar", ar: "مركبات", ku: "ئامرازەکانی گواستنەوە" },
    description: {
      en: "Cars, trucks, planes and other ways to move around.",
      tr: "Arabalar, kamyonlar, uçaklar ve diğer ulaşım araçları.",
      ar: "سيارات وشاحنات وطائرات ووسائل تنقل أخرى.",
      ku: "ئۆتۆمبیل و بارهەڵگر و فڕۆکە و ئامرازی تری گواستنەوە."
    },
    words: [
      w("car",            "Car",             "Araba",            "سيارة",          "ئۆتۆمبیل"),
      w("bus",            "Bus",             "Otobüs",           "حافلة",          "پاس"),
      w("truck",          "Truck",           "Kamyon",           "شاحنة",          "بارهەڵگر"),
      w("taxi",           "Taxi",            "Taksi",            "تاكسي",          "تاکسی"),
      w("motorcycle",     "Motorcycle",      "Motosiklet",       "دراجة نارية",    "ماتۆڕسکیل"),
      w("bicycle",        "Bicycle",         "Bisiklet",         "دراجة هوائية",   "پایسکیل"),
      w("scooter",        "Scooter",         "Scooter",          "سكوتر",          "سکوتەر"),
      w("ambulance",      "Ambulance",       "Ambulans",         "إسعاف",          "ئامبۆلانس"),
      w("police-car",     "Police Car",      "Polis Arabası",    "سيارة شرطة",     "ئۆتۆمبیلی پۆلیس"),
      w("fire-truck",     "Fire Truck",      "İtfaiye Aracı",    "سيارة إطفاء",    "ئۆتۆمبیلی ئاگرکوژێنەوە"),
      w("train",          "Train",           "Tren",             "قطار",           "شەمەندەفەر"),
      w("metro",          "Metro",           "Metro",            "مترو",           "مەترۆ"),
      w("tram",           "Tram",            "Tramvay",          "ترام",           "ترام"),
      w("airplane",       "Airplane",        "Uçak",             "طائرة",          "فڕۆکە"),
      w("helicopter",     "Helicopter",      "Helikopter",       "مروحية",         "بالگرد"),
      w("boat",           "Boat",            "Tekne",            "قارب",           "بەلەم"),
      w("ship",           "Ship",            "Gemi",             "سفينة",          "کەشتی"),
      w("submarine",      "Submarine",       "Denizaltı",        "غواصة",          "ژێرئاوی"),
      w("ferry",          "Ferry",           "Feribot",          "عبارة",          "فێریبۆت"),
      w("yacht",          "Yacht",           "Yat",              "يخت",            "یاخت"),
      w("tractor",        "Tractor",         "Traktör",          "جرار",           "تراکتۆر"),
      w("pickup",         "Pickup Truck",    "Pikap",            "بيك أب",         "پیکاپ"),
      w("van",            "Van",             "Minibüs",          "فان",            "ڤان"),
      w("cable-car",      "Cable Car",       "Teleferik",        "تلفريك",         "تەلەفریک"),
      w("hot-air-balloon","Hot Air Balloon", "Sıcak Hava Balonu","منطاد هواء",     "بەرمیلی هەوا")
    ]
  },

  /* ─── 14. CAR BRANDS ─────────────────────────────────────────────── */
  {
    key: "car-brands",
    icon: "🏷️",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Car Brands", tr: "Otomobil Markaları", ar: "ماركات السيارات", ku: "براندە ئۆتۆمبیلەکان" },
    description: {
      en: "Car makers seen on the road every day.",
      tr: "Her gün yolda gördüğümüz otomobil markaları.",
      ar: "شركات سيارات تراها على الطريق كل يوم.",
      ku: "کۆمپانیا ئۆتۆمبیلسازەکان کە هەموو ڕۆژێک لە ڕێگەدا دەیانبینیت."
    },
    words: [
      w("toyota",       "Toyota",        "Toyota",        "تويوتا",        "تۆیۆتا"),
      w("honda",        "Honda",         "Honda",         "هوندا",         "هۆندا"),
      w("hyundai",      "Hyundai",       "Hyundai",       "هيونداي",       "هیوندای"),
      w("kia",          "Kia",           "Kia",           "كيا",           "کیا"),
      w("nissan",       "Nissan",        "Nissan",        "نيسان",         "نیسان"),
      w("mazda",        "Mazda",         "Mazda",         "مازدا",         "مازدا"),
      w("mitsubishi",   "Mitsubishi",    "Mitsubishi",    "ميتسوبيشي",     "میتسۆبیشی"),
      w("suzuki",       "Suzuki",        "Suzuki",        "سوزوكي",        "سوزوکی"),
      w("ford",         "Ford",          "Ford",          "فورد",          "فۆرد"),
      w("chevrolet",    "Chevrolet",     "Chevrolet",     "شيفروليه",      "شیڤرۆلێ"),
      w("dodge",        "Dodge",         "Dodge",         "دودج",          "دۆج"),
      w("jeep",         "Jeep",          "Jeep",          "جيب",           "جیپ"),
      w("gmc",          "GMC",           "GMC",           "جي إم سي",      "جی ئێم سی"),
      w("mercedes",     "Mercedes-Benz", "Mercedes-Benz", "مرسيدس",        "مێرسیدس"),
      w("bmw",          "BMW",           "BMW",           "بي إم دبليو",   "بی ئێم دەبلیو"),
      w("audi",         "Audi",          "Audi",          "أودي",          "ئاودی"),
      w("volkswagen",   "Volkswagen",    "Volkswagen",    "فولكس واجن",    "ڤۆلکس واگن"),
      w("volvo",        "Volvo",         "Volvo",         "فولفو",         "ڤۆلڤۆ"),
      w("land-rover",   "Land Rover",    "Land Rover",    "لاند روفر",     "لاند ڕۆڤەر"),
      w("peugeot",      "Peugeot",       "Peugeot",       "بيجو",          "پێژۆ"),
      w("renault",      "Renault",       "Renault",       "رينو",          "ڕینۆ"),
      w("citroen",      "Citroen",       "Citroen",       "ستروين",        "سترۆیێن"),
      w("fiat",         "Fiat",          "Fiat",          "فيات",          "فیات"),
      w("lexus",        "Lexus",         "Lexus",         "لكزس",          "لێکسەس"),
      w("tesla",        "Tesla",         "Tesla",         "تيسلا",         "تیسلا")
    ]
  },

  /* ─── 15. CAR PARTS ─────────────────────────────────────────────── */
  {
    key: "car-parts",
    icon: "🔧",
    difficulty: "hard",
    games: BOTH,
    label: { en: "Car Parts", tr: "Araç Parçaları", ar: "قطع غيار", ku: "بەشەکانی ئۆتۆمبیل" },
    description: {
      en: "Engine, brakes, body parts — everything that makes a car run.",
      tr: "Motor, fren, gövde — bir arabayı çalıştıran her şey.",
      ar: "محرك وفرامل وجسم السيارة — كل ما يجعل السيارة تعمل.",
      ku: "ئەنجن و فرامل و بەشەکانی لاشە — هەموو ئەو شتانەی ئۆتۆمبیل کاردەکات."
    },
    words: [
      w("engine",            "Engine",            "Motor",          "محرك",            "ئەنجن"),
      w("gearbox",           "Gearbox",           "Şanzıman",       "علبة تروس",       "گێربۆکس"),
      w("clutch",            "Clutch",            "Debriyaj",       "دبرياج",          "دیپریاج"),
      w("radiator",          "Radiator",          "Radyatör",       "رادياتير",        "ڕادیاتۆر"),
      w("battery-car",       "Battery",           "Akü",            "بطارية",          "باتری"),
      w("alternator",        "Alternator",        "Alternatör",     "دينامو",          "دینامۆ"),
      w("starter-motor",     "Starter Motor",     "Marş Motoru",    "ماتور التشغيل",   "ستارتەر"),
      w("oil-filter",        "Oil Filter",        "Yağ Filtresi",   "فلتر زيت",        "فیلتەری زەیت"),
      w("air-filter",        "Air Filter",        "Hava Filtresi",  "فلتر هواء",       "فیلتەری هەوا"),
      w("fuel-filter",       "Fuel Filter",       "Yakıt Filtresi", "فلتر وقود",       "فیلتەری بەنزین"),
      w("fuel-pump",         "Fuel Pump",         "Yakıt Pompası",  "مضخة بنزين",      "پۆمپی بەنزین"),
      w("water-pump",        "Water Pump",        "Su Pompası",     "مضخة ماء",        "پۆمپی ئاو"),
      w("spark-plug",        "Spark Plug",        "Buji",           "بوجي",            "بووژی"),
      w("timing-belt",       "Timing Belt",       "Triger Kayışı",  "سير الكاتينة",    "بەندی کاتینە"),
      w("shock-absorber",    "Shock Absorber",    "Amortisör",      "مساعد",           "مساعد"),
      w("suspension",        "Suspension",        "Süspansiyon",    "نظام التعليق",    "سیستەمی هەڵواسین"),
      w("axle",              "Axle",              "Aks",            "محور",            "ئاکس"),
      w("differential",      "Differential",      "Diferansiyel",   "ديفرنشيل",        "دیفرەنشیاڵ"),
      w("drive-shaft",       "Drive Shaft",       "Şaft",           "عمود الإدارة",    "شافت"),
      w("wheel-bearing",     "Wheel Bearing",     "Tekerlek Rulmanı","رولمان عجلة",    "ڕۆڵمانی چەرخ"),
      w("brake-pad",         "Brake Pad",         "Fren Balatası",  "تيل فرامل",       "بەلاتی فرامل"),
      w("brake-disc",        "Brake Disc",        "Fren Diski",     "قرص فرامل",       "دیسکی فرامل"),
      w("brake-caliper",     "Brake Caliper",     "Fren Kaliperi",  "كاليبر فرامل",    "کالیپەری فرامل"),
      w("tire",              "Tire",              "Lastik",         "إطار",            "تایر"),
      w("rim",               "Rim",               "Jant",           "جنط",             "جانت"),
      w("steering-wheel",    "Steering Wheel",    "Direksiyon",     "مقود",            "ستێرنگ"),
      w("dashboard",         "Dashboard",         "Gösterge Paneli","لوحة قيادة",      "تابلۆی شۆفێر"),
      w("speedometer",       "Speedometer",       "Hızölçer",       "عداد السرعة",     "ژمێری خێرایی"),
      w("headlight",         "Headlight",         "Far",            "كشاف أمامي",      "لامپای پێشەوە"),
      w("tail-light",        "Tail Light",        "Stop Lambası",   "كشاف خلفي",       "لامپای دواوە"),
      w("fog-light",         "Fog Light",         "Sis Farı",       "كشاف ضباب",       "لامپای تەم"),
      w("mirror-side",       "Side Mirror",       "Yan Ayna",       "مرآة جانبية",     "ئاوێنەی لاتەنیشت"),
      w("rear-mirror",       "Rear-View Mirror",  "İç Dikiz Aynası","مرآة داخلية",     "ئاوێنەی ناوەوە"),
      w("windshield",        "Windshield",        "Ön Cam",         "زجاج أمامي",      "شووشەی پێشەوە"),
      w("bumper",            "Bumper",            "Tampon",         "صدام",            "تامپۆن"),
      w("hood",              "Hood",              "Kaput",          "غطاء المحرك",     "کاپۆتی ئەنجن"),
      w("trunk",             "Trunk",             "Bagaj",          "صندوق السيارة",   "بەلێکی ئۆتۆمبیل"),
      w("wiper",             "Wiper",             "Silecek",        "ماسحة زجاج",      "پاککەرەوەی شووشە"),
      w("seat-belt",         "Seat Belt",         "Emniyet Kemeri", "حزام أمان",       "کەمەربەندی سەلامەتی"),
      w("airbag",            "Airbag",            "Hava Yastığı",   "وسادة هوائية",    "بالۆنی هەوا"),
      w("exhaust",           "Exhaust",           "Egzoz",          "عادم",            "ئەگزۆست"),
      w("muffler",           "Muffler",           "Susturucu",      "كاتم صوت",        "کپکەرەوەی دەنگ"),
      w("catalytic",         "Catalytic Converter","Katalitik",     "محول حفاز",       "گۆڕەری کاتالێزی"),
      w("turbocharger",      "Turbocharger",      "Turbo",          "تربو",            "تەربۆ"),
      w("ecu",               "ECU",               "ECU",            "كمبيوتر السيارة", "ئی سی یوو"),
      w("fuel-tank",         "Fuel Tank",         "Yakıt Deposu",   "خزان وقود",       "تانکی بەنزین")
    ]
  },

  /* ─── 16. GARAGE TOOLS ──────────────────────────────────────────── */
  {
    key: "garage-tools",
    icon: "🛠️",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Garage Tools", tr: "Garaj Aletleri", ar: "أدوات الكراج", ku: "ئامرازەکانی گەراج" },
    description: {
      en: "Tools every mechanic keeps within arm's reach.",
      tr: "Her tamircinin elinin altında tuttuğu aletler.",
      ar: "أدوات يحتفظ بها كل ميكانيكي تحت يده.",
      ku: "ئامرازانێک کە هەموو میکانیکێک لە بەردەستیدا هەیە."
    },
    words: [
      w("wrench",          "Wrench",          "İngiliz Anahtarı", "مفتاح ربط",      "بەناڵی"),
      w("screwdriver",     "Screwdriver",     "Tornavida",        "مفك",            "تۆرنەویدا"),
      w("hammer",          "Hammer",          "Çekiç",            "مطرقة",          "چەکوش"),
      w("pliers",          "Pliers",          "Pense",            "كماشة",          "زێراندنی"),
      w("drill",           "Drill",           "Matkap",           "مثقاب",          "دریل"),
      w("jack",            "Jack",            "Kriko",            "كريك",           "جاک"),
      w("torque-wrench",   "Torque Wrench",   "Tork Anahtarı",    "مفتاح عزم",      "بەناڵی تۆرک"),
      w("socket-set",      "Socket Set",      "Lokma Takımı",     "طقم بكسات",      "ستی بۆکسات"),
      w("hex-key",         "Hex Key",         "Alyan",            "مفتاح ألن",      "بەناڵی ئاڵن"),
      w("multimeter",      "Multimeter",      "Multimetre",       "ملتيميتر",       "مەلتیمێتر"),
      w("tire-iron",       "Tire Iron",       "Lastik Demiri",    "حديد إطارات",    "ئاسنی تایر"),
      w("air-compressor",  "Air Compressor",  "Hava Kompresörü",  "كمبروسر هواء",   "کۆمپرێسۆری هەوا"),
      w("battery-charger", "Battery Charger", "Akü Şarjı",        "شاحن بطارية",    "شارژەری باتری"),
      w("grease-gun",      "Grease Gun",      "Gresörlük",        "مسدس شحم",       "گرێس‌گان"),
      w("oil-pan",         "Oil Pan",         "Yağ Tavası",       "حوض زيت",        "تەشتی زەیت"),
      w("funnel",          "Funnel",          "Huni",             "قمع",            "قنە"),
      w("welding-machine", "Welding Machine", "Kaynak Makinesi",  "ماكينة لحام",    "ئامێری لیحیم"),
      w("grinder",         "Grinder",         "Taşlama",          "صاروخ",          "صارووخ"),
      w("sander",          "Sander",          "Zımpara",          "ساندر",          "ساندەر"),
      w("vise",            "Vise",            "Mengene",          "ملزمة",          "ملزمە"),
      w("file",            "File",            "Eğe",              "مبرد",           "پاککەرە"),
      w("diagnostic",      "Diagnostic Scanner","Diagnostik Cihaz","جهاز تشخيص",    "ئامێری تەشخیص"),
      w("code-reader",     "Code Reader",     "Kod Okuyucu",      "قارئ أكواد",     "خوێنەری کۆد"),
      w("test-light",      "Test Light",      "Test Lambası",     "لمبة فحص",       "چرای تاقیکردنەوە"),
      w("brake-bleeder",   "Brake Bleeder",   "Fren Hava Alma",   "أداة تنفيس",     "ئامێری دەرکردنی هەوا"),
      w("spark-plug-wrench","Spark Plug Wrench","Buji Anahtarı",  "مفتاح بوجي",     "بەناڵی بووژی"),
      w("filter-wrench",   "Oil Filter Wrench","Yağ Filtre Anahtarı","مفتاح فلتر زيت","بەناڵی فیلتەر"),
      w("tape-measure",    "Tape Measure",    "Metre",            "متر قياس",       "میترە"),
      w("flashlight-tool", "Flashlight",      "El Feneri",        "كشاف",           "چرای دەست"),
      w("workbench",       "Workbench",       "Çalışma Tezgâhı",  "بنشن عمل",       "مێزی کارکردن")
    ]
  },

  /* ─── 17. SPORTS ─────────────────────────────────────────────────── */
  {
    key: "sports",
    icon: "⚽",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Sports", tr: "Spor", ar: "رياضة", ku: "وەرزش" },
    description: {
      en: "Games, sports, and athletic activities.",
      tr: "Oyunlar, sporlar ve atletik etkinlikler.",
      ar: "ألعاب ورياضات وأنشطة بدنية.",
      ku: "یاری و وەرزش و چالاکی جەستەیی."
    },
    words: [
      w("football",      "Football",      "Futbol",       "كرة قدم",       "تۆپی پێ"),
      w("basketball",    "Basketball",    "Basketbol",    "كرة سلة",       "تۆپی سەبەت"),
      w("volleyball",    "Volleyball",    "Voleybol",     "كرة طائرة",     "تۆپی پەرپێچ"),
      w("tennis",        "Tennis",        "Tenis",        "تنس",           "تینیس"),
      w("table-tennis",  "Table Tennis",  "Masa Tenisi",  "تنس طاولة",     "تینیسی مێز"),
      w("swimming",      "Swimming",      "Yüzme",        "سباحة",         "مەلەکردن"),
      w("running",       "Running",       "Koşu",         "جري",           "ڕاکردن"),
      w("cycling",       "Cycling",       "Bisiklet",     "ركوب الدراجة",  "پایسکیلسواری"),
      w("boxing",        "Boxing",        "Boks",         "ملاكمة",        "بۆکس"),
      w("wrestling",     "Wrestling",     "Güreş",        "مصارعة",        "زۆراناباز"),
      w("karate",        "Karate",        "Karate",       "كاراتيه",       "کاراتێ"),
      w("judo",          "Judo",          "Judo",         "جودو",          "جودۆ"),
      w("chess",         "Chess",         "Satranç",      "شطرنج",         "شەترەنج"),
      w("yoga",          "Yoga",          "Yoga",         "يوغا",          "یۆگا"),
      w("gym",           "Gym",           "Spor Salonu",  "نادي رياضي",    "هۆڵی وەرزش"),
      w("stadium",       "Stadium",       "Stadyum",      "ملعب",          "یاریگا"),
      w("goalkeeper",    "Goalkeeper",    "Kaleci",       "حارس مرمى",     "گۆڵپارێز"),
      w("referee",       "Referee",       "Hakem",        "حكم",           "هاکم"),
      w("coach",         "Coach",         "Antrenör",     "مدرب",          "ڕاهێنەر"),
      w("medal",         "Medal",         "Madalya",      "ميدالية",       "مەداڵیا"),
      w("trophy",        "Trophy",        "Kupa",         "كأس",           "جامی شایستەیی"),
      w("ski",           "Skiing",        "Kayak",        "تزلج",          "خشاوەسواری"),
      w("skating",       "Skating",       "Paten",        "تزحلق",         "پاتین"),
      w("climbing",      "Climbing",      "Tırmanma",     "تسلق",          "هەڵگەڕان"),
      w("archery",       "Archery",       "Okçuluk",      "رماية",         "تیرئەندازی")
    ]
  },

  /* ─── 18. MOVIES / TV / ENTERTAINMENT ────────────────────────────── */
  {
    key: "movies-entertainment",
    icon: "🎬",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Movies & TV", tr: "Film & Dizi", ar: "أفلام ومسلسلات", ku: "فیلم و زنجیرە" },
    description: {
      en: "Movies, TV shows, music, and entertainment everyone talks about.",
      tr: "Herkesin bahsettiği filmler, diziler, müzikler.",
      ar: "أفلام ومسلسلات وموسيقى يتحدث عنها الجميع.",
      ku: "فیلم و زنجیرە و مۆسیقا کە هەموو باسیان دەکات."
    },
    words: [
      w("movie",         "Movie",         "Film",         "فيلم",          "فیلم"),
      w("series",        "Series",        "Dizi",         "مسلسل",         "زنجیرە"),
      w("cartoon",       "Cartoon",       "Çizgi Film",   "كرتون",         "کارتۆن"),
      w("documentary",   "Documentary",   "Belgesel",     "وثائقي",        "بەڵگەنامەیی"),
      w("comedy",        "Comedy",        "Komedi",       "كوميديا",       "کۆمیدیا"),
      w("action",        "Action Film",   "Aksiyon",      "أكشن",          "ئەکشن"),
      w("horror",        "Horror Film",   "Korku Filmi",  "رعب",           "ترسناک"),
      w("drama",         "Drama",         "Drama",        "دراما",         "درامە"),
      w("concert",       "Concert",       "Konser",       "حفلة موسيقية",  "کۆنسێرت"),
      w("song",          "Song",          "Şarkı",        "أغنية",         "گۆرانی"),
      w("album",         "Album",         "Albüm",        "ألبوم",         "ئەلبوم"),
      w("theater",       "Theater",       "Tiyatro",      "مسرح",          "شانۆ"),
      w("cinema",        "Cinema",        "Sinema",       "سينما",         "سینەما"),
      w("netflix-tv",    "Netflix",       "Netflix",      "نتفليكس",       "نێتفلیکس"),
      w("oscar",         "Oscar",         "Oscar",        "أوسكار",        "ئۆسکار"),
      w("actor-tv",      "Actor",         "Oyuncu",       "ممثل",          "ئەکتەر"),
      w("singer-tv",     "Singer",        "Şarkıcı",      "مغني",          "گۆرانیبێژ"),
      w("director",      "Director",      "Yönetmen",     "مخرج",          "دەرهێنەر"),
      w("messi",         "Messi",         "Messi",        "ميسي",          "میسی"),
      w("ronaldo",       "Ronaldo",       "Ronaldo",      "رونالدو",       "ڕۆناڵدۆ"),
      w("einstein",      "Einstein",      "Einstein",     "أينشتاين",      "ئاینشتاین"),
      w("shakespeare",   "Shakespeare",   "Shakespeare",  "شكسبير",        "شێکسپیر"),
      w("mozart",        "Mozart",        "Mozart",       "موزارت",        "مۆتسارت"),
      w("picasso",       "Picasso",       "Picasso",      "بيكاسو",        "پیکاسۆ"),
      w("chaplin",       "Charlie Chaplin","Charlie Chaplin","تشارلي تشابلن","چارلی چاپلن")
    ]
  },

  /* ─── 19. COLORS & SHAPES ────────────────────────────────────────── */
  {
    key: "colors-shapes",
    icon: "🎨",
    difficulty: "kids",
    games: BOTH,
    label: { en: "Colors & Shapes", tr: "Renkler ve Şekiller", ar: "ألوان وأشكال", ku: "ڕەنگ و شێوەکان" },
    description: {
      en: "Basic colors and shapes — great for younger players.",
      tr: "Temel renk ve şekiller — küçük oyuncular için ideal.",
      ar: "ألوان وأشكال أساسية — مثالية للأطفال.",
      ku: "ڕەنگ و شێوەی سەرەتایی — گونجاو بۆ یاریزانە بچووکەکان."
    },
    words: [
      w("red",          "Red",          "Kırmızı",      "أحمر",         "سوور"),
      w("blue",         "Blue",         "Mavi",         "أزرق",         "شین"),
      w("green",        "Green",        "Yeşil",        "أخضر",         "سەوز"),
      w("yellow",       "Yellow",       "Sarı",         "أصفر",         "زەرد"),
      w("orange-color", "Orange",       "Turuncu",      "برتقالي",      "پرتەقاڵی"),
      w("purple",       "Purple",       "Mor",          "بنفسجي",       "مۆر"),
      w("pink",         "Pink",         "Pembe",        "وردي",         "پەمەیی"),
      w("brown",        "Brown",        "Kahverengi",   "بني",          "قاوەیی"),
      w("black",        "Black",        "Siyah",        "أسود",         "ڕەش"),
      w("white",        "White",        "Beyaz",        "أبيض",         "سپی"),
      w("gray",         "Gray",         "Gri",          "رمادي",        "خۆڵەمێشی"),
      w("gold",         "Gold",         "Altın",        "ذهبي",         "زێڕینی"),
      w("silver",       "Silver",       "Gümüş",        "فضي",          "زیوینی"),
      w("turquoise",    "Turquoise",    "Turkuaz",      "تركوازي",      "فیرۆزە"),
      w("beige",        "Beige",        "Bej",          "بيج",          "بێژ"),
      w("circle",       "Circle",       "Daire",        "دائرة",        "بازنە"),
      w("square",       "Square",       "Kare",         "مربع",         "چوارگۆشە"),
      w("triangle",     "Triangle",     "Üçgen",        "مثلث",         "سێگۆشە"),
      w("rectangle",    "Rectangle",    "Dikdörtgen",   "مستطيل",       "ڕێکخراو"),
      w("star",         "Star",         "Yıldız",       "نجمة",         "ئەستێرە"),
      w("heart-shape",  "Heart",        "Kalp",         "قلب",          "دڵ"),
      w("diamond",      "Diamond",      "Elmas",        "ماس",          "ئەلماس"),
      w("oval",         "Oval",         "Oval",         "بيضاوي",       "بەیزی"),
      w("cube",         "Cube",         "Küp",          "مكعب",         "کوب"),
      w("hexagon",      "Hexagon",      "Altıgen",      "سداسي",        "شەشگۆشە")
    ]
  },

  /* ─── 20. EMOTIONS / FEELINGS ────────────────────────────────────── */
  {
    key: "emotions",
    icon: "😊",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Emotions", tr: "Duygular", ar: "مشاعر", ku: "هەستەکان" },
    description: {
      en: "How people feel — every day, every mood.",
      tr: "İnsanların hisleri — her gün, her ruh hâli.",
      ar: "مشاعر الناس في كل يوم وكل حالة.",
      ku: "هەستی خەڵک لە هەموو ڕۆژێک و هەموو دۆخێکدا."
    },
    words: [
      w("happiness",    "Happiness",    "Mutluluk",     "سعادة",         "خۆشی"),
      w("sadness",      "Sadness",      "Üzüntü",       "حزن",           "خەم"),
      w("anger",        "Anger",        "Öfke",         "غضب",           "تووڕەیی"),
      w("fear",         "Fear",         "Korku",        "خوف",           "ترس"),
      w("surprise",     "Surprise",     "Şaşkınlık",    "مفاجأة",        "سەرسوڕمان"),
      w("calm",         "Calm",         "Sakinlik",     "هدوء",          "ئارامی"),
      w("excitement",   "Excitement",   "Heyecan",      "حماس",          "بزە"),
      w("boredom",      "Boredom",      "Sıkıntı",      "ملل",           "بێزاری"),
      w("love",         "Love",         "Sevgi",        "حب",            "خۆشەویستی"),
      w("hope",         "Hope",         "Umut",         "أمل",           "هیوا"),
      w("pride",        "Pride",        "Gurur",        "فخر",           "شانازی"),
      w("shame",        "Shame",        "Utanç",        "خجل",           "شەرم"),
      w("jealousy",     "Jealousy",     "Kıskançlık",   "غيرة",          "ئیرەیی"),
      w("loneliness",   "Loneliness",   "Yalnızlık",    "وحدة",          "تەنیایی"),
      w("relief",       "Relief",       "Rahatlama",    "ارتياح",        "ئاسوودەیی"),
      w("confidence",   "Confidence",   "Özgüven",      "ثقة",           "متمانە بەخۆبوون"),
      w("stress",       "Stress",       "Stres",        "ضغط نفسي",      "فشاری دەروونی"),
      w("panic",        "Panic",        "Panik",        "ذعر",           "تۆقین"),
      w("curiosity",    "Curiosity",    "Merak",        "فضول",          "حەزی زانیاری"),
      w("disappointment","Disappointment","Hayal Kırıklığı","خيبة أمل",  "خەفەتی هیوا"),
      w("gratitude",    "Gratitude",    "Minnettarlık", "امتنان",        "سوپاسگوزاری"),
      w("trust",        "Trust",        "Güven",        "ثقة",           "متمانە"),
      w("doubt",        "Doubt",        "Şüphe",        "شك",            "گومان"),
      w("courage",      "Courage",      "Cesaret",      "شجاعة",         "ئازایەتی"),
      w("kindness",     "Kindness",     "Nezaket",      "لطف",           "نازکی")
    ]
  },

  /* ─── 21. NATURE ─────────────────────────────────────────────────── */
  {
    key: "nature",
    icon: "🌳",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Nature", tr: "Doğa", ar: "طبيعة", ku: "سروشت" },
    description: {
      en: "Mountains, rivers, weather, and the natural world.",
      tr: "Dağlar, nehirler, hava ve doğa.",
      ar: "جبال وأنهار وطقس والعالم الطبيعي.",
      ku: "چیا و ڕووبار و کەشوهەوا و جیهانی سروشتی."
    },
    words: [
      w("mountain",   "Mountain",     "Dağ",          "جبل",           "چیا"),
      w("river",      "River",        "Nehir",        "نهر",           "ڕووبار"),
      w("lake",       "Lake",         "Göl",          "بحيرة",         "دەریاچە"),
      w("sea",        "Sea",          "Deniz",        "بحر",           "دەریا"),
      w("ocean",      "Ocean",        "Okyanus",      "محيط",          "ئۆقیانووس"),
      w("waterfall",  "Waterfall",    "Şelale",       "شلال",          "تاڤگە"),
      w("forest",     "Forest",       "Orman",        "غابة",          "دارستان"),
      w("desert",     "Desert",       "Çöl",          "صحراء",         "بیابان"),
      w("valley",     "Valley",       "Vadi",         "وادي",          "دۆڵ"),
      w("cave",       "Cave",         "Mağara",       "كهف",           "ئەشکەوت"),
      w("hill",       "Hill",         "Tepe",         "تل",            "گرد"),
      w("island",     "Island",       "Ada",          "جزيرة",         "دوورگە"),
      w("beach",      "Beach",        "Plaj",         "شاطئ",          "کەنار دەریا"),
      w("garden",     "Garden",       "Bahçe",        "حديقة",         "باخچە"),
      w("tree",       "Tree",         "Ağaç",         "شجرة",          "دار"),
      w("flower",     "Flower",       "Çiçek",        "زهرة",          "گوڵ"),
      w("grass",      "Grass",        "Çimen",        "عشب",           "گیا"),
      w("rock",       "Rock",         "Kaya",         "صخرة",          "کاش"),
      w("sand",       "Sand",         "Kum",          "رمل",           "لم"),
      w("snow",       "Snow",         "Kar",          "ثلج",           "بەفر"),
      w("rain",       "Rain",         "Yağmur",       "مطر",           "باران"),
      w("wind",       "Wind",         "Rüzgâr",       "رياح",          "با"),
      w("storm",      "Storm",        "Fırtına",      "عاصفة",         "ڕەشەبا"),
      w("lightning",  "Lightning",    "Şimşek",       "برق",           "هەورەبروسکە"),
      w("thunder",    "Thunder",      "Gök Gürültüsü","رعد",           "هەورەتریشقە"),
      w("rainbow",    "Rainbow",      "Gökkuşağı",    "قوس قزح",       "پەلکەزێڕینە"),
      w("sun",        "Sun",          "Güneş",        "شمس",           "خۆر"),
      w("moon",       "Moon",         "Ay",           "قمر",           "مانگ"),
      w("star-night", "Star",         "Yıldız",       "نجم",           "ئەستێرە"),
      w("volcano",    "Volcano",      "Yanardağ",     "بركان",         "ئاگرکێو")
    ]
  },

  /* ─── 22. FOOTBALL CLUBS ─────────────────────────────────────────── */
  {
    key: "football-clubs",
    icon: "⚽",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Football Clubs", tr: "Futbol Kulüpleri", ar: "أندية كرة القدم", ku: "یانە فووتباڵییەکان" },
    description: {
      en: "Famous football clubs from Europe and the region.",
      tr: "Avrupa ve bölgeden ünlü futbol kulüpleri.",
      ar: "أندية كرة قدم مشهورة من أوروبا والمنطقة.",
      ku: "یانە بەناوبانگەکانی فووتباڵ لە ئەورووپا و ناوچەکە."
    },
    words: [
      w("real-madrid",   "Real Madrid",        "Real Madrid",       "ريال مدريد",        "ڕیاڵ مەدرید"),
      w("barcelona",     "Barcelona",          "Barcelona",         "برشلونة",           "بارسلۆنا"),
      w("man-united",    "Manchester United",  "Manchester United", "مانشستر يونايتد",   "مانچێستەر یونایتد"),
      w("man-city",      "Manchester City",    "Manchester City",   "مانشستر سيتي",      "مانچێستەر سیتی"),
      w("liverpool",     "Liverpool",          "Liverpool",         "ليفربول",           "لیڤەرپوول"),
      w("chelsea",       "Chelsea",            "Chelsea",           "تشيلسي",            "چێلسی"),
      w("arsenal",       "Arsenal",            "Arsenal",           "أرسنال",            "ئارسێناڵ"),
      w("bayern",        "Bayern Munich",      "Bayern Münih",      "بايرن ميونخ",       "بایرن میونیخ"),
      w("dortmund",      "Borussia Dortmund",  "Borussia Dortmund", "بوروسيا دورتموند",  "بۆروسیا دۆرتموند"),
      w("psg",           "Paris Saint-Germain","Paris Saint-Germain","باريس سان جيرمان", "پاریس سان ژێرمەن"),
      w("juventus",      "Juventus",           "Juventus",          "يوفنتوس",           "یوڤێنتوس"),
      w("ac-milan",      "AC Milan",           "AC Milan",          "إيه سي ميلان",      "ئەی سی میلان"),
      w("inter",         "Inter Milan",        "Inter",             "إنتر ميلان",        "ئینتەر میلان"),
      w("atletico",      "Atletico Madrid",    "Atletico Madrid",   "أتلتيكو مدريد",     "ئەتلێتیکۆ مەدرید"),
      w("galatasaray",   "Galatasaray",        "Galatasaray",       "غلطة سراي",         "گاڵاتاسارای"),
      w("fenerbahce",    "Fenerbahce",         "Fenerbahçe",        "فنربخشة",           "فێنەرباغچە"),
      w("besiktas",      "Besiktas",           "Beşiktaş",          "بشكتاش",            "بێشکتاش"),
      w("ajax",          "Ajax",               "Ajax",              "أياكس",             "ئایاکس"),
      w("benfica",       "Benfica",            "Benfica",           "بنفيكا",            "بێنفیکا"),
      w("al-hilal",      "Al-Hilal",           "Al-Hilal",          "الهلال",            "ئەلهیلال")
    ]
  },

  /* ─── 23. CLOTHES ────────────────────────────────────────────────── */
  {
    key: "clothes",
    icon: "👕",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Clothes", tr: "Kıyafetler", ar: "ملابس", ku: "جلوبەرگ" },
    description: {
      en: "Everyday clothing and accessories.",
      tr: "Günlük kıyafetler ve aksesuarlar.",
      ar: "ملابس وإكسسوارات يومية.",
      ku: "جلوبەرگ و ئاکسسواری ڕۆژانە."
    },
    words: [
      w("tshirt",     "T-shirt",   "Tişört",        "تي شيرت",     "تیشێرت"),
      w("shirt",      "Shirt",     "Gömlek",        "قميص",        "کراس"),
      w("trousers",   "Trousers",  "Pantolon",      "بنطال",       "پانتۆڵ"),
      w("jeans",      "Jeans",     "Kot Pantolon",  "جينز",        "جینز"),
      w("dress",      "Dress",     "Elbise",        "فستان",       "کراسی ژنانە"),
      w("skirt",      "Skirt",     "Etek",          "تنورة",       "تەنوورە"),
      w("jacket",     "Jacket",    "Ceket",         "سترة",        "چاکەت"),
      w("coat",       "Coat",      "Palto",         "معطف",        "پاڵتۆ"),
      w("sweater",    "Sweater",   "Kazak",         "كنزة",        "بلوز"),
      w("scarf",      "Scarf",     "Atkı",          "وشاح",        "ملوانکە"),
      w("hat",        "Hat",       "Şapka",         "قبعة",        "کڵاو"),
      w("gloves",     "Gloves",    "Eldiven",       "قفازات",      "دەستکێش"),
      w("socks",      "Socks",     "Çorap",         "جوارب",       "گۆرەوی"),
      w("shoes",      "Shoes",     "Ayakkabı",      "حذاء",        "پێڵاو"),
      w("boots",      "Boots",     "Bot",           "جزمة",        "پووتین"),
      w("sandals",    "Sandals",   "Sandalet",      "صندل",        "ساندەڵ"),
      w("belt",       "Belt",      "Kemer",         "حزام",        "قایش"),
      w("tie",        "Tie",       "Kravat",        "ربطة عنق",    "بۆینباخ"),
      w("glasses",    "Glasses",   "Gözlük",        "نظارات",      "چاویلکە"),
      w("watch",      "Watch",     "Kol Saati",     "ساعة يد",     "کاتژمێری دەست")
    ]
  },

  /* ─── 24. MUSIC & INSTRUMENTS ────────────────────────────────────── */
  {
    key: "music-instruments",
    icon: "🎵",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Music & Instruments", tr: "Müzik & Enstrümanlar", ar: "موسيقى وآلات", ku: "مۆسیقا و ئامێرەکان" },
    description: {
      en: "Instruments and music words from the region and the world.",
      tr: "Bölgeden ve dünyadan enstrümanlar ve müzik kavramları.",
      ar: "آلات موسيقية وكلمات من المنطقة والعالم.",
      ku: "ئامێری مۆسیقا و وشەکانی مۆسیقا لە ناوچەکە و جیهان."
    },
    words: [
      w("guitar",     "Guitar",     "Gitar",       "غيتار",        "گیتار"),
      w("piano",      "Piano",      "Piyano",      "بيانو",        "پیانۆ"),
      w("violin",     "Violin",     "Keman",       "كمان",         "کەمان"),
      w("drums",      "Drums",      "Davul",       "طبول",         "تەپڵ"),
      w("flute",      "Flute",      "Flüt",        "ناي",          "شمشاڵ"),
      w("saz",        "Saz",        "Saz",         "طنبور",        "تەمبوور"),
      w("oud",        "Oud",        "Ud",          "عود",          "عوود"),
      w("zurna",      "Zurna",      "Zurna",       "زرنة",         "زوڕنا"),
      w("daf",        "Daf",        "Def",         "دف",           "دەف"),
      w("trumpet",    "Trumpet",    "Trompet",     "بوق",          "کەڕەنا"),
      w("microphone", "Microphone", "Mikrofon",    "ميكروفون",     "مایکرۆفۆن"),
      w("singer",     "Singer",     "Şarkıcı",     "مغني",         "گۆرانیبێژ"),
      w("song",       "Song",       "Şarkı",       "أغنية",        "گۆرانی"),
      w("concert",    "Concert",    "Konser",      "حفلة موسيقية", "کۆنسێرت"),
      w("orchestra",  "Orchestra",  "Orkestra",    "أوركسترا",     "ئۆرکێسترا"),
      w("dj",         "DJ",         "DJ",          "دي جي",        "دی جەی"),
      w("headphones-music", "Headphones", "Kulaklık", "سماعات",    "هێدفۆن"),
      w("melody",     "Melody",     "Melodi",      "لحن",          "ئاواز")
    ]
  },

  /* ─── 25. KITCHEN ITEMS ──────────────────────────────────────────── */
  {
    key: "kitchen-items",
    icon: "🍳",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Kitchen Items", tr: "Mutfak Eşyaları", ar: "أدوات المطبخ", ku: "کەلوپەلی چێشتخانە" },
    description: {
      en: "Tools and utensils found in every kitchen.",
      tr: "Her mutfakta bulunan araç gereçler.",
      ar: "أدوات موجودة في كل مطبخ.",
      ku: "ئامراز و کەلوپەلی ناو هەموو چێشتخانەیەک."
    },
    words: [
      w("pan",           "Frying Pan",  "Tava",           "مقلاة",        "تاوە"),
      w("pot",           "Pot",         "Tencere",        "قدر",          "مەنجەڵ"),
      w("kettle",        "Kettle",      "Çaydanlık",      "غلاية",        "قوری"),
      w("teapot",        "Teapot",      "Demlik",         "إبريق شاي",    "چایدان"),
      w("knife",         "Knife",       "Bıçak",          "سكين",         "چەقۆ"),
      w("fork",          "Fork",        "Çatal",          "شوكة",         "چەتاڵ"),
      w("spoon",         "Spoon",       "Kaşık",          "ملعقة",        "کەوچک"),
      w("plate",         "Plate",       "Tabak",          "صحن",          "قاپ"),
      w("glass-cup",     "Glass",       "Bardak",         "كوب",          "پەرداخ"),
      w("cutting-board", "Cutting Board","Kesme Tahtası", "لوح تقطيع",    "تەختەی بڕین"),
      w("oven-kitchen",  "Oven",        "Fırın",          "فرن",          "فڕن"),
      w("blender",       "Blender",     "Blender",        "خلاط",         "بلێندەر"),
      w("grater",        "Grater",      "Rende",          "مبشرة",        "ڕەندە"),
      w("tray",          "Tray",        "Tepsi",          "صينية",        "سینی"),
      w("bowl",          "Bowl",        "Kase",           "وعاء",         "قاپی قووڵ"),
      w("jug",           "Jug",         "Sürahi",         "إبريق",        "دۆلکە"),
      w("strainer",      "Strainer",    "Süzgeç",         "مصفاة",        "پاڵێوک"),
      w("rolling-pin",   "Rolling Pin", "Oklava",         "شوبك",         "تیرۆک"),
      w("apron",         "Apron",       "Önlük",          "مريلة",        "بەروانکە"),
      w("thermos",       "Thermos",     "Termos",         "ترمس",         "تێرمۆس")
    ]
  },

  /* ─── 26. HOLIDAYS & EVENTS ──────────────────────────────────────── */
  {
    key: "holidays-events",
    icon: "🎉",
    difficulty: "medium",
    games: BOTH,
    label: { en: "Holidays & Events", tr: "Bayramlar & Etkinlikler", ar: "أعياد ومناسبات", ku: "جەژن و بۆنەکان" },
    description: {
      en: "Celebrations, holidays, and special days.",
      tr: "Kutlamalar, bayramlar ve özel günler.",
      ar: "احتفالات وأعياد وأيام خاصة.",
      ku: "ئاهەنگ و جەژن و ڕۆژە تایبەتەکان."
    },
    words: [
      w("newroz",         "Newroz",          "Nevruz",           "نوروز",           "نەورۆز"),
      w("eid",            "Eid",             "Ramazan Bayramı",  "عيد الفطر",       "جەژنی ڕەمەزان"),
      w("eid-adha",       "Eid al-Adha",     "Kurban Bayramı",   "عيد الأضحى",      "جەژنی قوربان"),
      w("wedding",        "Wedding",         "Düğün",            "زفاف",            "زەماوەند"),
      w("birthday",       "Birthday",        "Doğum Günü",       "عيد ميلاد",       "ڕۆژی لەدایکبوون"),
      w("new-year",       "New Year",        "Yılbaşı",          "رأس السنة",       "سەری ساڵ"),
      w("graduation",     "Graduation",      "Mezuniyet",        "تخرج",            "دەرچوون"),
      w("picnic",         "Picnic",          "Piknik",           "نزهة",            "سەیران"),
      w("engagement",     "Engagement",      "Nişan",            "خطوبة",           "نیشانکردن"),
      w("ramadan",        "Ramadan",         "Ramazan",          "رمضان",           "ڕەمەزان"),
      w("iftar",          "Iftar",           "İftar",            "إفطار",           "بەربانگ"),
      w("henna-night",    "Henna Night",     "Kına Gecesi",      "ليلة الحناء",     "شەوی خەنە"),
      w("funfair",        "Funfair",         "Lunapark",         "مدينة ملاهي",     "یاریگای ئاهەنگ"),
      w("fireworks",      "Fireworks",       "Havai Fişek",      "ألعاب نارية",     "ئاگربازی"),
      w("parade",         "Parade",          "Geçit Töreni",     "استعراض",         "ڕێپێوان"),
      w("festival",       "Festival",        "Festival",         "مهرجان",          "فیستیڤاڵ"),
      w("camping-trip",   "Camping",         "Kamp",             "تخييم",           "خێوەتگە"),
      w("mothers-day",    "Mother's Day",    "Anneler Günü",     "عيد الأم",        "ڕۆژی دایک")
    ]
  },

  /* ─── 27. SUPERHEROES & CHARACTERS ───────────────────────────────── */
  {
    key: "heroes-characters",
    icon: "🦸",
    difficulty: "easy",
    games: BOTH,
    label: { en: "Heroes & Characters", tr: "Kahramanlar & Karakterler", ar: "أبطال وشخصيات", ku: "پاڵەوان و کارەکتەرەکان" },
    description: {
      en: "Superheroes and famous fictional characters.",
      tr: "Süper kahramanlar ve ünlü kurgu karakterleri.",
      ar: "أبطال خارقون وشخصيات خيالية شهيرة.",
      ku: "پاڵەوانە سەرسوڕهێنەرەکان و کارەکتەرە بەناوبانگەکان."
    },
    words: [
      w("superman",       "Superman",        "Superman",        "سوبرمان",         "سوپەرمان"),
      w("batman",         "Batman",          "Batman",          "باتمان",          "باتمان"),
      w("spiderman",      "Spider-Man",      "Örümcek Adam",    "سبايدرمان",       "سپایدەرمان"),
      w("ironman",        "Iron Man",        "Iron Man",        "الرجل الحديدي",   "ئایرۆنمان"),
      w("hulk",           "Hulk",            "Hulk",            "هالك",            "هەڵک"),
      w("thor",           "Thor",            "Thor",            "ثور",             "سۆر"),
      w("captain-america","Captain America", "Kaptan Amerika",  "كابتن أمريكا",    "کاپتن ئەمریکا"),
      w("wonder-woman",   "Wonder Woman",    "Wonder Woman",    "المرأة المعجزة",  "وۆندەر وومان"),
      w("harry-potter",   "Harry Potter",    "Harry Potter",    "هاري بوتر",       "هاری پۆتەر"),
      w("mickey-mouse",   "Mickey Mouse",    "Mickey Mouse",    "ميكي ماوس",       "میکی ماوس"),
      w("tom-jerry",      "Tom and Jerry",   "Tom ve Jerry",    "توم وجيري",       "تۆم و جێری"),
      w("spongebob",      "SpongeBob",       "Sünger Bob",      "سبونج بوب",       "سپۆنج بۆب"),
      w("pikachu",        "Pikachu",         "Pikachu",         "بيكاتشو",         "پیکاچو"),
      w("mario",          "Super Mario",     "Super Mario",     "سوبر ماريو",      "سوپەر ماریۆ"),
      w("sonic",          "Sonic",           "Sonic",           "سونيك",           "سۆنیک"),
      w("elsa",           "Elsa",            "Elsa",            "إلسا",            "ئێلسا"),
      w("shrek",          "Shrek",           "Shrek",           "شريك",            "شرێک"),
      w("minions",        "Minions",         "Minyonlar",       "المينيونز",       "مینیۆنەکان"),
      w("aladdin",        "Aladdin",         "Alaaddin",        "علاء الدين",      "عەلائەدین"),
      w("cinderella",     "Cinderella",      "Külkedisi",       "سندريلا",         "سیندرێلا")
    ]
  }
] as const
/* eslint-enable max-len */

/* ────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

const CATEGORY_BY_KEY = new Map(WORD_CATEGORIES.map(c => [c.key, c]))

export function getCategoryByKey(key: string): WordCategory | undefined {
  return CATEGORY_BY_KEY.get(key)
}

export function getCategoriesForGame(game: SupportedGame): readonly WordCategory[] {
  return WORD_CATEGORIES.filter(c => c.games.includes(game))
}

/** Extract the localized strings for the given language; falls back to English. */
export function getCategoryWords(category: WordCategory, lang: LangCode): string[] {
  return category.words.map(word => (word[lang] && word[lang].length > 0 ? word[lang] : word.en))
}

export function resolveCategoryLabel(key: string, lang: LangCode): string {
  if (key === RANDOM_MIX_KEY) return RANDOM_MIX_LABEL[lang] ?? RANDOM_MIX_LABEL.en
  const cat = CATEGORY_BY_KEY.get(key)
  return cat ? (cat.label[lang] ?? cat.label.en) : key
}

/** All valid category keys (excluding RANDOM_MIX_KEY). */
export const VALID_CATEGORY_KEYS: ReadonlySet<string> = new Set(
  WORD_CATEGORIES.map(c => c.key)
)

/* ────────────────────────────────────────────────────────────────────
   Validation — dev-only sanity check. Call once at app boot in dev or
   from a unit test. Reports counts + any data-quality problems.
   ──────────────────────────────────────────────────────────────────── */

export interface ValidationReport {
  ok: boolean
  errors: string[]
  totalWords: number
  perGame: Record<SupportedGame, number>
  perCategory: Array<{ key: string; count: number; games: readonly SupportedGame[] }>
}

const LANGS: readonly LangCode[] = ["en", "tr", "ar", "ku"]

export function validateWordCategories(): ValidationReport {
  const errors: string[] = []
  let total = 0
  const perGame: Record<SupportedGame, number> = { "spy-game": 0, "who-am-i": 0 }
  const perCategory: ValidationReport["perCategory"] = []

  const categoryKeys = new Set<string>()

  for (const cat of WORD_CATEGORIES) {
    if (categoryKeys.has(cat.key)) errors.push(`duplicate category key: ${cat.key}`)
    categoryKeys.add(cat.key)

    if (!cat.games || cat.games.length === 0) {
      errors.push(`category "${cat.key}" is not enabled for any game`)
    }

    const wordKeys = new Set<string>()
    for (const word of cat.words) {
      if (wordKeys.has(word.key)) errors.push(`duplicate word key "${word.key}" in category "${cat.key}"`)
      wordKeys.add(word.key)
      for (const lang of LANGS) {
        const v = word[lang]
        if (typeof v !== "string" || v.trim().length === 0) {
          errors.push(`word "${cat.key}/${word.key}" missing or empty translation for "${lang}"`)
        }
      }
    }

    total += cat.words.length
    perCategory.push({ key: cat.key, count: cat.words.length, games: cat.games })
    for (const g of cat.games) perGame[g] += cat.words.length
  }

  if (total < 500) errors.push(`total word count (${total}) is below the 500 minimum`)

  return { ok: errors.length === 0, errors, totalWords: total, perGame, perCategory }
}

export function getTotalWordCount(): number {
  return WORD_CATEGORIES.reduce((sum, cat) => sum + cat.words.length, 0)
}
