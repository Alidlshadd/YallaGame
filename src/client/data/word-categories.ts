import type { LangCode, LocalizedText } from "@shared/types.js"

/**
 * Canonical word-category data used by Spy Game and Who Am I.
 *
 * Both games previously had their own duplicated category/word data —
 * Spy in `src/client/domain/spy-data.ts`, Who Am I in
 * `src/client/domain/who-am-i-data.ts`. This file merges them into one
 * source of truth. The old files now re-export filtered views of this
 * data so the consumers in `views/localPlay.ts` keep working unchanged.
 *
 * Rules of the merge:
 *   - Category keys are preserved verbatim (no migration needed for
 *     persisted sessionStorage settings).
 *   - Each category lists which game(s) may surface it in setup
 *     (`games: ["spy-game"]`, `["who-am-i"]`, or both).
 *   - Categories that BOTH games used under the same key (objects, jobs,
 *     vehicles, countries) get a single entry with a UNION of word lists:
 *       * en/tr: union of Spy + Who Am I lists, Turkish diacritics fixed
 *         where Spy shipped ASCII placeholders
 *       * ar/ku: Who Am I's translations carry over (Spy never had any)
 *     ar/ku arrays are shorter than en/tr in those merged categories —
 *     the picker just samples from whatever is available for the active
 *     language.
 *   - "food" (spy) and "food-drinks" (who-am-i) live as separate entries
 *     to avoid migrating any saved Spy default categories.
 *   - Random Mix is a virtual key (see RANDOM_MIX_KEY) — it's not in
 *     WORD_CATEGORIES because it means "all of this game's allowed
 *     categories pooled together", computed at pick-time.
 */

export type SupportedGame = "spy-game" | "who-am-i"
export type CategoryDifficulty = "easy" | "medium" | "hard"

export interface WordCategory {
  key: string
  icon?: string
  difficulty?: CategoryDifficulty
  label: LocalizedText
  words: Partial<Record<LangCode, string[]>>
  games: readonly SupportedGame[]
}

export const RANDOM_MIX_KEY = "random-mix"

const RANDOM_MIX_LABEL: LocalizedText = {
  en: "Random Mix",
  tr: "Rastgele Karışım",
  ar: "خليط عشوائي",
  ku: "تێکەڵی هەڕەمەکی"
}

/* eslint-disable max-len */
export const WORD_CATEGORIES: readonly WordCategory[] = [
  /* ───────────────────────────────────────────────────────────────────
     Who Am I-leaning broad categories (party guessing)
     ─────────────────────────────────────────────────────────────────── */
  {
    key: "animals",
    icon: "🐾",
    difficulty: "easy",
    games: ["who-am-i"],
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
    games: ["who-am-i"],
    label: { en: "Fruits", tr: "Meyveler", ar: "فواكه", ku: "میوەکان" },
    words: {
      en: ["Banana", "Apple", "Orange", "Strawberry", "Watermelon", "Mango", "Grapes", "Pineapple", "Peach", "Cherry", "Lemon", "Kiwi", "Pear", "Pomegranate", "Coconut"],
      tr: ["Muz", "Elma", "Portakal", "Çilek", "Karpuz", "Mango", "Üzüm", "Ananas", "Şeftali", "Kiraz", "Limon", "Kivi", "Armut", "Nar", "Hindistan Cevizi"],
      ar: ["موز", "تفاح", "برتقال", "فراولة", "بطيخ", "مانجو", "عنب", "أناناس", "خوخ", "كرز", "ليمون", "كيوي", "إجاص", "رمان", "جوز الهند"],
      ku: ["مۆز", "سێو", "پرتەقاڵ", "فرۆلە", "شووتی", "مانگۆ", "ترێ", "ئەناناس", "قەیسی", "گێلاس", "لیمۆ", "کیوی", "هەرمێ", "هەنار", "جۆزی هیند"]
    }
  },

  /* ───────────────────────────────────────────────────────────────────
     SHARED categories — used by both Spy and Who Am I.
     Word lists are unions of the previous two data files.
     ─────────────────────────────────────────────────────────────────── */
  {
    key: "objects",
    icon: "🎁",
    difficulty: "easy",
    games: ["spy-game", "who-am-i"],
    label: { en: "Objects", tr: "Eşyalar", ar: "أشياء", ku: "شتومەک" },
    words: {
      en: ["Phone", "Chair", "Key", "Bag", "Book", "Bottle", "Clock", "Laptop", "Pen", "Camera", "Umbrella", "Mirror", "Wallet", "Glasses", "Lamp", "Backpack", "Battery", "Computer", "Door", "Headphones", "Notebook", "Remote Control", "Ring", "Shoe", "Table", "Television", "Watch"],
      tr: ["Telefon", "Sandalye", "Anahtar", "Çanta", "Kitap", "Şişe", "Saat", "Dizüstü", "Kalem", "Kamera", "Şemsiye", "Ayna", "Cüzdan", "Gözlük", "Lamba", "Sırt Çantası", "Pil", "Bilgisayar", "Kapı", "Kulaklık", "Defter", "Kumanda", "Yüzük", "Ayakkabı", "Masa", "Televizyon", "Kol Saati"],
      ar: ["هاتف", "كرسي", "مفتاح", "حقيبة", "كتاب", "زجاجة", "ساعة", "حاسوب محمول", "قلم", "كاميرا", "مظلة", "مرآة", "محفظة", "نظارة", "مصباح"],
      ku: ["مۆبایل", "کورسی", "کلیل", "جانتا", "کتێب", "بوتڵ", "کاتژمێر", "لاپتۆپ", "قەڵەم", "کامێرا", "چەتر", "ئاوێنە", "جزدان", "چاویلکە", "چرا"]
    }
  },
  {
    key: "jobs",
    icon: "👨‍⚕️",
    difficulty: "easy",
    games: ["spy-game", "who-am-i"],
    label: { en: "Jobs", tr: "Meslekler", ar: "مهن", ku: "پیشەکان" },
    words: {
      en: ["Doctor", "Teacher", "Mechanic", "Driver", "Chef", "Police Officer", "Engineer", "Barber", "Farmer", "Lawyer", "Nurse", "Pilot", "Firefighter", "Dentist", "Photographer", "Accountant", "Actor", "Architect", "Cashier", "Electrician", "Graphic Designer", "Journalist", "Programmer", "Security Guard", "Translator", "Waiter"],
      tr: ["Doktor", "Öğretmen", "Tamirci", "Şoför", "Şef", "Polis", "Mühendis", "Berber", "Çiftçi", "Avukat", "Hemşire", "Pilot", "İtfaiyeci", "Diş Hekimi", "Fotoğrafçı", "Muhasebeci", "Oyuncu", "Mimar", "Kasiyer", "Elektrikçi", "Grafik Tasarımcı", "Gazeteci", "Programcı", "Güvenlik", "Tercüman", "Garson"],
      ar: ["طبيب", "معلم", "ميكانيكي", "سائق", "طاهي", "شرطي", "مهندس", "حلاق", "مزارع", "محامي", "ممرضة", "طيار", "إطفائي", "طبيب أسنان", "مصور"],
      ku: ["پزیشک", "مامۆستا", "میکانیک", "شۆفێر", "چێشتلێنەر", "پۆلیس", "ئەندازیار", "ئەسلاحدار", "جوتیار", "پارێزەر", "پەرستیار", "فڕۆکەوان", "ئاگرکوژێنەوە", "پزیشکی ددان", "وێنەگر"]
    }
  },
  {
    key: "food-drinks",
    icon: "🍕",
    difficulty: "easy",
    games: ["who-am-i"],
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
    games: ["spy-game", "who-am-i"],
    label: { en: "Countries", tr: "Ülkeler", ar: "بلدان", ku: "وڵاتان" },
    words: {
      en: ["Iraq", "Turkey", "Japan", "Brazil", "France", "Germany", "Egypt", "Canada", "Italy", "China", "Spain", "Mexico", "India", "Australia", "Greece", "Argentina", "Morocco", "Netherlands", "Sweden", "United Kingdom", "United States"],
      tr: ["Irak", "Türkiye", "Japonya", "Brezilya", "Fransa", "Almanya", "Mısır", "Kanada", "İtalya", "Çin", "İspanya", "Meksika", "Hindistan", "Avustralya", "Yunanistan", "Arjantin", "Fas", "Hollanda", "İsveç", "Birleşik Krallık", "Amerika"],
      ar: ["العراق", "تركيا", "اليابان", "البرازيل", "فرنسا", "ألمانيا", "مصر", "كندا", "إيطاليا", "الصين", "إسبانيا", "المكسيك", "الهند", "أستراليا", "اليونان"],
      ku: ["عێراق", "تورکیا", "یابان", "بەرازیل", "فەڕەنسا", "ئەڵمانیا", "میسر", "کەنەدا", "ئیتالیا", "چین", "ئیسپانیا", "مەکسیک", "هیندستان", "ئوسترالیا", "یۆنان"]
    }
  },
  {
    key: "vehicles",
    icon: "🚗",
    difficulty: "easy",
    games: ["spy-game", "who-am-i"],
    label: { en: "Vehicles", tr: "Araçlar", ar: "مركبات", ku: "ئۆتۆمبیلەکان" },
    words: {
      en: ["Car", "Bus", "Truck", "Taxi", "Motorcycle", "Bicycle", "Ambulance", "Police Car", "Train", "Airplane", "Boat", "Helicopter", "Scooter", "Tractor", "Ship", "Cable Car", "Delivery Van", "Ferry", "Fire Truck", "Metro", "Pickup Truck"],
      tr: ["Araba", "Otobüs", "Kamyon", "Taksi", "Motosiklet", "Bisiklet", "Ambulans", "Polis Arabası", "Tren", "Uçak", "Tekne", "Helikopter", "Scooter", "Traktör", "Gemi", "Teleferik", "Kurye Aracı", "Feribot", "İtfaiye Aracı", "Metro", "Pikap"],
      ar: ["سيارة", "حافلة", "شاحنة", "تاكسي", "دراجة نارية", "دراجة هوائية", "إسعاف", "سيارة شرطة", "قطار", "طائرة", "قارب", "مروحية", "سكوتر", "جرار", "سفينة"],
      ku: ["ئۆتۆمبیل", "پاس", "بارهەڵگر", "تاکسی", "ماتۆڕسکیل", "پایسکیل", "ئامبۆلانس", "ئۆتۆمبیلی پۆلیس", "شەمەندەفەر", "فڕۆکە", "بەلەم", "بالگرد", "سکوتەر", "تراکتۆر", "کەشتی"]
    }
  },
  {
    key: "car-parts",
    icon: "🔧",
    difficulty: "hard",
    games: ["who-am-i"],
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
    games: ["who-am-i"],
    label: { en: "Famous People", tr: "Ünlü Kişiler", ar: "شخصيات مشهورة", ku: "کەسایەتی ناودارەکان" },
    words: {
      en: ["Einstein", "Messi", "Ronaldo", "Beyoncé", "Elon Musk", "Shakespeare", "Mozart", "Picasso", "Napoleon", "Cleopatra", "Charlie Chaplin", "Steve Jobs", "Mandela", "Da Vinci", "Marilyn Monroe"],
      tr: ["Einstein", "Messi", "Ronaldo", "Beyoncé", "Elon Musk", "Shakespeare", "Mozart", "Picasso", "Napolyon", "Kleopatra", "Charlie Chaplin", "Steve Jobs", "Mandela", "Da Vinci", "Marilyn Monroe"],
      ar: ["أينشتاين", "ميسي", "رونالدو", "بيونسيه", "إيلون ماسك", "شكسبير", "موزارت", "بيكاسو", "نابليون", "كليوباترا", "تشارلي تشابلن", "ستيف جوبز", "مانديلا", "دافنشي", "مارلين مونرو"],
      ku: ["ئاینشتاین", "میسی", "ڕۆناڵدۆ", "بیۆنسێ", "ئیلۆن ماسک", "شێکسپیر", "مۆتسارت", "پیکاسۆ", "ناپۆلیۆن", "کلیۆپاترا", "چارلی چاپلن", "ستیڤ جۆبز", "ماندێلا", "داڤنچی", "مەرلین مۆنرۆ"]
    }
  },

  /* ───────────────────────────────────────────────────────────────────
     Spy-only categories. Word LISTS stay en+tr (translating ~400 spy
     words to ar/ku is a separate content task) — but LABELS already
     have full 4-lang coverage from the previous i18n pass.
     ─────────────────────────────────────────────────────────────────── */
  {
    key: "places",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Places", tr: "Mekanlar", ar: "أماكن", ku: "شوێنەکان" },
    words: {
      en: ["Airport", "Amusement Park", "Bank", "Barbershop", "Beach", "Bookstore", "Bus Station", "Cafe", "Cinema", "Factory", "Hospital", "Hotel", "Library", "Museum", "Park", "Pharmacy", "Police Station", "Restaurant", "School", "Shopping Mall", "Stadium", "Supermarket", "Train Station", "University", "Wedding Hall", "Workshop"],
      tr: ["Havalimani", "Lunapark", "Banka", "Berber", "Plaj", "Kitapci", "Otogar", "Kafe", "Sinema", "Fabrika", "Hastane", "Otel", "Kutuphane", "Muze", "Park", "Eczane", "Polis Merkezi", "Restoran", "Okul", "Alisveris Merkezi", "Stadyum", "Supermarket", "Tren Istasyonu", "Universite", "Dugun Salonu", "Atolye"]
    }
  },
  {
    key: "food",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Food", tr: "Yemek", ar: "طعام", ku: "خۆراک" },
    words: {
      en: ["Baklava", "Burger", "Cake", "Chicken", "Coffee", "Doner", "Egg", "Fish", "Fries", "Grilled Meat", "Honey", "Ice Cream", "Kebab", "Lentil Soup", "Noodles", "Pasta", "Pizza", "Rice", "Salad", "Sandwich", "Shawarma", "Soup", "Sushi", "Tea", "Toast", "Watermelon", "Yogurt"],
      tr: ["Baklava", "Burger", "Pasta", "Tavuk", "Kahve", "Doner", "Yumurta", "Balik", "Patates Kizartmasi", "Izgara Et", "Bal", "Dondurma", "Kebap", "Mercimek Corbasi", "Noodle", "Makarna", "Pizza", "Pilav", "Salata", "Sandvic", "Savarama", "Corba", "Sushi", "Cay", "Tost", "Karpuz", "Yogurt"]
    }
  },
  {
    key: "travel",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Travel", tr: "Seyahat", ar: "سفر", ku: "گەشت" },
    words: {
      en: ["Boarding Pass", "Bus", "Camping", "Cruise", "Desert", "Flight", "Hotel Room", "Island", "Map", "Passport", "Reservation", "Road Trip", "Suitcase", "Subway", "Taxi", "Ticket", "Tour Guide", "Tourist", "Train", "Travel Agency", "Visa", "Waterfall"],
      tr: ["Bini Kart", "Otobus", "Kamp", "Gemi Turu", "Col", "Ucus", "Otel Odasi", "Ada", "Harita", "Pasaport", "Rezervasyon", "Yolculuk", "Valiz", "Metro", "Taksi", "Bilet", "Tur Rehberi", "Turist", "Tren", "Seyahat Acentesi", "Vize", "Selale"]
    }
  },
  {
    key: "school",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "School", tr: "Okul", ar: "مدرسة", ku: "قوتابخانە" },
    words: {
      en: ["Backpack", "Blackboard", "Cafeteria", "Classroom", "Desk", "Exam", "Grade", "Homework", "Lesson", "Marker", "Notebook", "Principal", "Projector", "Quiz", "Recess", "Report Card", "Science Lab", "Student", "Teacher", "Textbook", "Uniform", "Whiteboard"],
      tr: ["Okul Cantasi", "Kara Tahta", "Kantin", "Sinif", "Sira", "Sinav", "Not", "Odev", "Ders", "Kalem", "Defter", "Mudur", "Projektor", "Kisa Sinav", "Teneffus", "Karne", "Laboratuvar", "Ogrenci", "Ogretmen", "Ders Kitabi", "Uniforma", "Beyaz Tahta"]
    }
  },
  {
    key: "sports",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Sports", tr: "Spor", ar: "رياضة", ku: "وەرزش" },
    words: {
      en: ["Basketball", "Boxing", "Chess", "Coach", "Cycling", "Final Match", "Football", "Goalkeeper", "Gym", "Karate", "Medal", "Referee", "Running", "Scoreboard", "Skating", "Stadium", "Swimming", "Tennis", "Training", "Volleyball", "Yoga"],
      tr: ["Basketbol", "Boks", "Satranc", "Antrenor", "Bisiklet", "Final Maci", "Futbol", "Kaleci", "Spor Salonu", "Karate", "Madalya", "Hakem", "Kosmak", "Skor Tabelasi", "Paten", "Stadyum", "Yuzme", "Tenis", "Antrenman", "Voleybol", "Yoga"]
    }
  },
  {
    key: "entertainment",
    difficulty: "medium",
    games: ["spy-game"],
    label: { en: "Entertainment", tr: "Eğlence", ar: "ترفيه", ku: "کاتبردن" },
    words: {
      en: ["Board Game", "Carnival", "Concert", "Dance", "Festival", "Game Console", "Karaoke", "Magic Show", "Movie", "Music", "Puzzle", "Radio", "Stage", "Stand Up Show", "Theater", "Toy", "Video Game", "VR Headset", "YouTube"],
      tr: ["Masa Oyunu", "Karnaval", "Konser", "Dans", "Festival", "Oyun Konsolu", "Karaoke", "Sihirbaz Gosterisi", "Film", "Muzik", "Bulmaca", "Radyo", "Sahne", "Stand Up", "Tiyatro", "Oyuncak", "Video Oyunu", "VR Gozluk", "YouTube"]
    }
  },
  {
    key: "city",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "City", tr: "Şehir", ar: "مدينة", ku: "شار" },
    words: {
      en: ["Apartment", "Bridge", "Bus Stop", "Cafe", "Crosswalk", "Elevator", "Fire Station", "Market", "Mosque", "Parking Lot", "Pharmacy", "Post Office", "Roundabout", "Sidewalk", "Street", "Supermarket", "Traffic Light", "Tunnel", "Zoo"],
      tr: ["Apartman", "Kopru", "Durak", "Kafe", "Yaya Gecidi", "Asansor", "Itfaiye", "Pazar", "Cami", "Otopark", "Eczane", "Postane", "Donel Kavsak", "Kaldirim", "Sokak", "Market", "Trafik Lambasi", "Tunel", "Hayvanat Bahcesi"]
    }
  },
  {
    key: "nature",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Nature", tr: "Doğa", ar: "طبيعة", ku: "سروشت" },
    words: {
      en: ["Cave", "Cloud", "Desert", "Forest", "Garden", "Hill", "Lake", "Lightning", "Mountain", "Ocean", "Rain", "River", "Rock", "Sand", "Snow", "Sun", "Tree", "Valley", "Waterfall", "Wind", "Volcano"],
      tr: ["Magara", "Bulut", "Col", "Orman", "Bahce", "Tepe", "Gol", "Simsek", "Dag", "Okyanus", "Yagmur", "Nehir", "Kaya", "Kum", "Kar", "Gunes", "Agac", "Vadi", "Selale", "Ruzgar", "Volkan"]
    }
  },
  {
    key: "technology",
    difficulty: "medium",
    games: ["spy-game"],
    label: { en: "Technology", tr: "Teknoloji", ar: "تكنولوجيا", ku: "تەکنەلۆژیا" },
    words: {
      en: ["App", "Bluetooth", "Charger", "Cloud Storage", "Drone", "Email", "Keyboard", "Laptop", "Microphone", "Password", "Printer", "Robot", "Router", "Smart Watch", "Tablet", "Touch Screen", "USB Cable", "Video Call", "Website", "Wi Fi"],
      tr: ["Uygulama", "Bluetooth", "Sarj Aleti", "Bulut Depolama", "Drone", "E Posta", "Klavye", "Dizustu Bilgisayar", "Mikrofon", "Sifre", "Yazici", "Robot", "Modem", "Akilli Saat", "Tablet", "Dokunmatik Ekran", "USB Kablosu", "Goruntulu Arama", "Web Sitesi", "Wi Fi"]
    }
  },
  {
    key: "home",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Home", tr: "Ev", ar: "منزل", ku: "ماڵ" },
    words: {
      en: ["Balcony", "Bathroom", "Bedroom", "Blanket", "Carpet", "Closet", "Couch", "Curtain", "Dining Table", "Dishwasher", "Doorbell", "Kitchen", "Laundry Basket", "Living Room", "Oven", "Pillow", "Refrigerator", "Shower", "Sofa", "Washing Machine"],
      tr: ["Balkon", "Banyo", "Yatak Odasi", "Battaniye", "Hali", "Dolap", "Koltuk", "Perde", "Yemek Masasi", "Bulasik Makinesi", "Kapi Zili", "Mutfak", "Camasir Sepeti", "Salon", "Firin", "Yastik", "Buzdolabi", "Dus", "Kanepe", "Camasir Makinesi"]
    }
  },
  {
    key: "clothing",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Clothing", tr: "Giyim", ar: "ملابس", ku: "جلوبەرگ" },
    words: {
      en: ["Belt", "Boots", "Cap", "Coat", "Dress", "Gloves", "Hat", "Hoodie", "Jacket", "Jeans", "Scarf", "Shirt", "Shorts", "Skirt", "Sneakers", "Suit", "Sunglasses", "Sweater", "Tie", "T Shirt"],
      tr: ["Kemer", "Bot", "Sapka", "Kaban", "Elbise", "Eldiven", "Sapka", "Kapusonlu", "Ceket", "Kot Pantolon", "Atki", "Gomlek", "Sort", "Etek", "Spor Ayakkabi", "Takim Elbise", "Gunes Gozlugu", "Kazak", "Kravat", "Tisort"]
    }
  },
  {
    key: "health",
    difficulty: "medium",
    games: ["spy-game"],
    label: { en: "Health", tr: "Sağlık", ar: "صحة", ku: "تەندروستی" },
    words: {
      en: ["Ambulance", "Bandage", "Blood Test", "Clinic", "Dentist Chair", "Eye Test", "First Aid", "Hospital Bed", "Injection", "Medicine", "Nurse Station", "Operation Room", "Pharmacy", "Prescription", "Stethoscope", "Surgery", "Thermometer", "Waiting Room", "Wheelchair", "X Ray"],
      tr: ["Ambulans", "Bandaj", "Kan Testi", "Klinik", "Disci Koltugu", "Goz Testi", "Ilk Yardim", "Hastane Yatagi", "Igne", "Ilac", "Hemsire Bankosu", "Ameliyathane", "Eczane", "Recete", "Stetoskop", "Ameliyat", "Termometre", "Bekleme Odasi", "Tekerlekli Sandalye", "Rontgen"]
    }
  },
  {
    key: "shopping",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Shopping", tr: "Alışveriş", ar: "تسوق", ku: "بازاڕکردن" },
    words: {
      en: ["Barcode", "Basket", "Cash Register", "Coupon", "Credit Card", "Discount", "Fitting Room", "Gift Card", "Online Order", "Price Tag", "Receipt", "Refund", "Sale", "Shopping Bag", "Shopping Cart", "Store Window", "Supermarket Aisle", "Wallet"],
      tr: ["Barkod", "Sepet", "Kasa", "Kupon", "Kredi Karti", "Indirim", "Deneme Kabini", "Hediye Karti", "Online Siparis", "Fiyat Etiketi", "Fis", "Iade", "Kampanya", "Alisveris Poseti", "Alisveris Arabasi", "Vitrin", "Market Koridoru", "Cuzdan"]
    }
  },
  {
    key: "office",
    difficulty: "medium",
    games: ["spy-game"],
    label: { en: "Office", tr: "Ofis", ar: "مكتب", ku: "ئۆفیس" },
    words: {
      en: ["Boss", "Briefcase", "Calendar", "Conference Room", "Desk", "Document", "Elevator", "Meeting", "Name Tag", "Office Chair", "Paperwork", "Printer", "Project", "Reception", "Report", "Spreadsheet", "Stapler", "Team", "Whiteboard", "Work Email"],
      tr: ["Patron", "Evrak Cantasi", "Takvim", "Toplanti Odasi", "Masa", "Belge", "Asansor", "Toplanti", "Yaka Karti", "Ofis Sandalyesi", "Evrak Isi", "Yazici", "Proje", "Resepsiyon", "Rapor", "E Tablo", "Zimba", "Ekip", "Beyaz Tahta", "Is E Postasi"]
    }
  },
  {
    key: "events",
    difficulty: "easy",
    games: ["spy-game"],
    label: { en: "Events", tr: "Etkinlikler", ar: "فعاليات", ku: "ڕووداوەکان" },
    words: {
      en: ["Birthday Party", "Business Meeting", "Conference", "Engagement", "Festival", "Graduation", "Opening Ceremony", "Picnic", "Press Meeting", "Reunion", "School Trip", "Seminar", "Surprise Party", "Tournament", "Training Camp", "Wedding"],
      tr: ["Dogum Gunu", "Is Toplantisi", "Konferans", "Nisan", "Festival", "Mezuniyet", "Acilis Toreni", "Piknik", "Basin Toplantisi", "Bulusturma", "Okul Gezisi", "Seminer", "Surpriz Parti", "Turnuva", "Kamp", "Dugun"]
    }
  },
  {
    key: "famous_places",
    difficulty: "hard",
    games: ["spy-game"],
    label: { en: "Famous Places", tr: "Ünlü Yerler", ar: "أماكن مشهورة", ku: "شوێنە بەناوبانگەکان" },
    words: {
      en: ["Big Ben", "Burj Khalifa", "Colosseum", "Eiffel Tower", "Empire State Building", "Grand Bazaar", "Great Wall", "Hagia Sophia", "Hollywood", "Leaning Tower", "Louvre Museum", "Pyramids", "Statue of Liberty", "Taj Mahal", "Times Square", "Tokyo Tower"],
      tr: ["Big Ben", "Burc Halife", "Kolezyum", "Eyfel Kulesi", "Empire State", "Kapali Carsi", "Cin Seddi", "Ayasofya", "Hollywood", "Egik Kule", "Louvre Muzesi", "Piramitler", "Ozgurluk Heykeli", "Tac Mahal", "Times Square", "Tokyo Kulesi"]
    }
  },
  {
    key: "daily_actions",
    difficulty: "medium",
    games: ["spy-game"],
    label: { en: "Daily Actions", tr: "Günlük İşler", ar: "أعمال يومية", ku: "کاری ڕۆژانە" },
    words: {
      en: ["Brushing Teeth", "Cleaning Room", "Cooking Dinner", "Doing Homework", "Driving Home", "Drinking Coffee", "Going Shopping", "Listening to Music", "Making Tea", "Paying Bills", "Reading News", "Taking Notes", "Using Elevator", "Walking Outside", "Washing Dishes", "Watching Movie"],
      tr: ["Dis Fircalamak", "Oda Temizlemek", "Aksam Yemegi Yapmak", "Odev Yapmak", "Eve Donmek", "Kahve Icmek", "Alisverise Gitmek", "Muzik Dinlemek", "Cay Yapmak", "Fatura Odemek", "Haber Okumak", "Not Almak", "Asansor Kullanmak", "Yuruyus Yapmak", "Bulasik Yikamak", "Film Izlemek"]
    }
  },
  {
    key: "emotions",
    difficulty: "medium",
    games: ["spy-game"],
    label: { en: "Emotions", tr: "Duygular", ar: "مشاعر", ku: "هەستەکان" },
    words: {
      en: ["Anger", "Boredom", "Calm", "Confidence", "Confusion", "Curiosity", "Embarrassment", "Excitement", "Fear", "Happiness", "Jealousy", "Loneliness", "Panic", "Pride", "Relief", "Sadness", "Stress", "Surprise"],
      tr: ["Ofke", "Can Sikintisi", "Sakinlik", "Ozguven", "Kafa Karisikligi", "Merak", "Utanma", "Heyecan", "Korku", "Mutluluk", "Kiskanclik", "Yalnizlik", "Panik", "Gurur", "Rahatlama", "Uzuntu", "Stres", "Saskinlik"]
    }
  }
] as const
/* eslint-enable max-len */

const CATEGORY_BY_KEY = new Map(WORD_CATEGORIES.map(c => [c.key, c]))

export function getCategoryByKey(key: string): WordCategory | undefined {
  return CATEGORY_BY_KEY.get(key)
}

export function getCategoriesForGame(game: SupportedGame): readonly WordCategory[] {
  return WORD_CATEGORIES.filter(c => c.games.includes(game))
}

export function getCategoryWords(category: WordCategory, lang: LangCode): string[] {
  return category.words[lang] ?? category.words.en ?? []
}

/**
 * Resolve a category key (including the virtual RANDOM_MIX_KEY) to its
 * label in the requested language. Falls back to English, then the raw key.
 */
export function resolveCategoryLabel(key: string, lang: LangCode): string {
  if (key === RANDOM_MIX_KEY) return RANDOM_MIX_LABEL[lang] ?? RANDOM_MIX_LABEL.en
  const cat = CATEGORY_BY_KEY.get(key)
  return cat ? (cat.label[lang] ?? cat.label.en) : key
}
