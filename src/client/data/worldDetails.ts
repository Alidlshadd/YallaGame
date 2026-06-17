import type { LocalizedText } from "@shared/types.js"

/* World detail config — augments the server-side Game catalog with the extra
   atmosphere/marketing content the cinematic game-info page renders.
   Adding a new game = add an entry here + a server catalog entry.
   Slogan is a single design-language poster string (English, all-caps). */

export interface WorldStats {
  recommendedPlayers: string                  // language-neutral, e.g. "3 – 12"
  sessionTime: LocalizedText
  difficulty: LocalizedText
  bestFor: LocalizedText
}

export interface WorldCTA {
  title: LocalizedText
  subtitle: LocalizedText
}

/* Category for "Who Am I?" — players guess one of these on the host's pick. */
export type CategoryDifficulty =
  | "Easy" | "Medium" | "Hard" | "Expert"
  | "Kids" | "Adults" | "Quick" | "Long"

export interface WorldCategory {
  key: string
  title: LocalizedText
  icon: string                // small Unicode glyph (no emoji)
  difficulty: CategoryDifficulty
  /** Short English summary used internally / future Create Room picker. */
  description?: string
  /** Sample English target words to communicate the category's vibe. */
  exampleWords?: string[]
}

export interface WorldDetail {
  slogan: string                              // English uppercase poster line
  description: LocalizedText                  // long atmospheric intro paragraph
  tags: LocalizedText[]                       // 4 short pills
  stats: WorldStats
  bottomCTA: WorldCTA
  /** Optional path to a cinematic full-page background image (WebP). */
  detailBackground?: string
  /** Optional path to the backdrop behind the About / How / Roles trio. */
  sectionsBackground?: string
  /** Optional path to the backdrop behind the final CTA panel. */
  ctaBackground?: string
  /** Optional mobile-optimised backgrounds (≤900-1200px wide). When set, they
      are used on screens ≤768px instead of the full-size desktop image. */
  detailBackgroundMobile?: string
  sectionsBackgroundMobile?: string
  ctaBackgroundMobile?: string
  /** Optional map of Role.id → portrait image path (WebP). */
  roleImages?: Record<string, string>
  /** Optional category list — when present, the detail page renders Categories
      instead of Roles (used by guessing/party games like Who Am I). */
  categories?: WorldCategory[]
}

const VAMPIRE: WorldDetail = {
  slogan: "LIE. SEDUCE. SURVIVE.",
  description: {
    en: "A secret-role game where the admin assigns hidden roles and players must survive the night. Will you protect the village... or drink from it?",
    tr: "Adminin gizli rolleri dağıttığı bir gizli rol oyunu. Köyü koruyacak mısın... yoksa kanını içecek misin?",
    ar: "لعبة أدوار سرية يوزّع فيها المدير الأدوار الخفية ويحاول اللاعبون النجاة في الليل. هل ستحمي القرية... أم ستشرب من دمها؟",
    ku: "یارییەکی ڕۆڵی نهێنییە کە ئەدمین ڕۆڵە شاراوەکان دابەش دەکات و یاریزانان دەبێت لە شەودا ڕزگار ببن. ئایا گوند دەپارێزی... یان لێی دەخۆیتەوە؟"
  },
  tags: [
    { en: "Secret Roles",      tr: "Gizli Roller",      ar: "أدوار سرية",      ku: "ڕۆڵە نهێنییەکان" },
    { en: "3 – 12 Players",    tr: "3 – 12 Oyuncu",     ar: "٣ – ١٢ لاعبون",   ku: "٣ – ١٢ یاریزان" },
    { en: "Social Deduction",  tr: "Sosyal Çıkarım",    ar: "استدلال اجتماعي", ku: "ئەستێرنامەی کۆمەڵایەتی" },
    { en: "Room & Local",      tr: "Oda & Yerel",       ar: "غرفة ومحلي",       ku: "ژوور و ناوخۆیی" }
  ],
  stats: {
    recommendedPlayers: "3 – 12",
    sessionTime: { en: "15 – 30 Min",   tr: "15 – 30 Dk",   ar: "١٥ – ٣٠ دقيقة",     ku: "١٥ – ٣٠ خولەک" },
    difficulty:  { en: "Medium",        tr: "Orta",         ar: "متوسط",              ku: "ناوەند" },
    bestFor:     { en: "Friends & Groups", tr: "Arkadaş Grupları", ar: "للأصدقاء والمجموعات", ku: "بۆ هاوڕێ و گرووپ" }
  },
  bottomCTA: {
    title:    { en: "Ready to enter Vampire Village?", tr: "Vampir Köyü'ne girmeye hazır mısın?", ar: "هل أنت مستعد لدخول قرية مصاصي الدماء؟", ku: "ئامادەی بچیتە ناو گوندی ڤامپایەرەوە؟" },
    subtitle: { en: "Trust no one. Survive the night.", tr: "Kimseye güvenme. Geceyi atlat.",       ar: "لا تثق بأحد. انجُ من الليل.",         ku: "متمانە بە کەس مەکە. ڕزگاری ببە لە شەو." }
  },
  detailBackground:   "/assets/world-bg/vampire-village-detail.webp",
  sectionsBackground: "/assets/world-bg/vampire-sections-bg.webp",
  ctaBackground:      "/assets/world-bg/vampire-cta-bg.webp",
  roleImages: {
    vampire:   "/assets/roles/vampire/night-vampire.webp",
    doctor:    "/assets/roles/vampire/doctor.webp",
    detective: "/assets/roles/vampire/detective.webp",
    villager:  "/assets/roles/vampire/villager.webp"
  }
}

const MAFIA: WorldDetail = {
  slogan: "TRUST IS A WEAPON.",
  description: {
    en: "A noir tale of trust and betrayal. The Mafia move in shadows while citizens search for truth. Bluff well — your face is your alibi.",
    tr: "Güven ve ihanetin noir hikâyesi. Mafya gölgelerde, vatandaşlar gerçeği arıyor. İyi blöf yap — yüzün senin maskendir.",
    ar: "حكاية نوار عن الثقة والخيانة. تتحرك المافيا في الظل بينما يبحث المدنيون عن الحقيقة. أتقن الخداع — وجهك هو حُجّتك.",
    ku: "چیرۆکێکی نوار لەسەر متمانە و ناپاکی. مافیا لە سێبەردا دەجوڵێن لە کاتێکدا شارستانییەکان بەدوای ڕاستیدا دەگەڕێن. باش فێڵ بکە — ڕوخسارت سەلمێنرایە."
  },
  tags: [
    { en: "Secret Roles",      tr: "Gizli Roller",      ar: "أدوار سرية",      ku: "ڕۆڵە نهێنییەکان" },
    { en: "4 – 12 Players",    tr: "4 – 12 Oyuncu",     ar: "٤ – ١٢ لاعبون",   ku: "٤ – ١٢ یاریزان" },
    { en: "Social Deduction",  tr: "Sosyal Çıkarım",    ar: "استدلال اجتماعي", ku: "ئەستێرنامەی کۆمەڵایەتی" },
    { en: "Room & Local",      tr: "Oda & Yerel",       ar: "غرفة ومحلي",       ku: "ژوور و ناوخۆیی" }
  ],
  stats: {
    recommendedPlayers: "4 – 12",
    sessionTime: { en: "20 – 40 Min",     tr: "20 – 40 Dk",        ar: "٢٠ – ٤٠ دقيقة",     ku: "٢٠ – ٤٠ خولەک" },
    difficulty:  { en: "Medium",          tr: "Orta",              ar: "متوسط",              ku: "ناوەند" },
    bestFor:     { en: "Strategy Lovers", tr: "Strateji Severler", ar: "عشاق الاستراتيجية", ku: "بۆ هۆگرانی ستراتیجی" }
  },
  bottomCTA: {
    title:    { en: "Ready to enter Classic Mafia?",       tr: "Klasik Mafya'ya girmeye hazır mısın?", ar: "هل أنت مستعد لدخول المافيا الكلاسيكية؟", ku: "ئامادەی بچیتە یاری مافیای کلاسیکەوە؟" },
    subtitle: { en: "Trust is a weapon. Choose carefully.", tr: "Güven bir silahtır. Dikkatli seç.",    ar: "الثقة سلاح. اختر بحذر.",                  ku: "متمانە چەکێکە. بە وردی هەڵبژێرە." }
  },
  detailBackground:   "/assets/world-bg/mafia-classic-detail.webp",
  sectionsBackground: "/assets/world-bg/mafia-sections-bg.webp",
  ctaBackground:      "/assets/world-bg/mafia-cta-bg.webp",
  roleImages: {
    mafia:     "/assets/roles/mafia/mafia-boss.webp",
    doctor:    "/assets/roles/mafia/doctor.webp",
    detective: "/assets/roles/mafia/detective.webp",
    citizen:   "/assets/roles/mafia/citizen.webp"
  }
}

const SPY: WorldDetail = {
  slogan: "SECRETS. MISSIONS. DECEPTION.",
  description: {
    en: "Most players know the secret. One does not. Ask careful questions, blend in, and never reveal what only you know — or what only you don't.",
    tr: "Çoğu oyuncu sırrı bilir, biri bilmez. Dikkatli sorular sor, kalabalığa karış ve sadece senin bildiğini — ya da senin bilmediğini — asla ele verme.",
    ar: "معظم اللاعبين يعرفون السر، واحد فقط لا يعرفه. اطرح أسئلة بعناية، اندمج، ولا تكشف ما تعرفه أنت فقط — أو ما تجهله أنت فقط.",
    ku: "زۆربەی یاریزانان نهێنییەکە دەزانن، یەکێک نا. بە وردی پرسیار بکە، خۆت تێکەڵ بکە، و هیچ کات ئەوەی تەنها تۆ دەزانیت — یان تەنها تۆ نازانیت — مەسەلمێنە."
  },
  tags: [
    { en: "Bluff & Detect",    tr: "Blöf & Çıkarım",    ar: "خداع وكشف",        ku: "فێڵ و دۆزینەوە" },
    { en: "3 – 10 Players",    tr: "3 – 10 Oyuncu",     ar: "٣ – ١٠ لاعبون",   ku: "٣ – ١٠ یاریزان" },
    { en: "Word Game",         tr: "Kelime Oyunu",      ar: "لعبة كلمات",       ku: "یاری وشە" },
    { en: "Room & Local",      tr: "Oda & Yerel",       ar: "غرفة ومحلي",       ku: "ژوور و ناوخۆیی" }
  ],
  stats: {
    recommendedPlayers: "3 – 10",
    sessionTime: { en: "10 – 20 Min",     tr: "10 – 20 Dk",        ar: "١٠ – ٢٠ دقيقة",     ku: "١٠ – ٢٠ خولەک" },
    difficulty:  { en: "Easy",            tr: "Kolay",             ar: "سهل",                ku: "ئاسان" },
    bestFor:     { en: "Quick Sessions",  tr: "Hızlı Oturumlar",   ar: "للجلسات السريعة",   ku: "بۆ یاری خێرا" }
  },
  bottomCTA: {
    title:    { en: "Ready to enter Spy Game?",       tr: "Casus Oyunu'na girmeye hazır mısın?", ar: "مستعد لدخول لعبة الجاسوس؟",    ku: "ئامادەی بچیتە یاری سیخوڕەوە؟" },
    subtitle: { en: "Trust the mission. Question everyone.", tr: "Göreve güven. Herkesi sorgula.", ar: "ثق بالمهمة. شكك بالجميع.", ku: "متمانە بە ئەرک بکە. لە هەمووان بپرسە." }
  },
  detailBackground:   "/assets/world-bg/spy-game-detail.webp",
  sectionsBackground: "/assets/world-bg/spy-sections-bg.webp",
  ctaBackground:      "/assets/world-bg/spy-cta-bg.webp"
}

const WHO_AM_I: WorldDetail = {
  slogan: "ASK. GUESS. LAUGH.",
  description: {
    en: "A fun guessing game where each player receives a hidden identity and must ask yes/no questions to discover who or what they are.",
    tr: "Eğlenceli bir tahmin oyunu — her oyuncuya gizli bir kimlik verilir ve evet/hayır sorularıyla kim ya da ne olduğunu bulmalıdır.",
    ar: "لعبة تخمين ممتعة: كل لاعب يحصل على هوية خفية ويجب أن يكتشفها بأسئلة نعم/لا.",
    ku: "یارییەکی خۆش بۆ مەنزووری مەنزوور: هەر یاریزانێک ناسنامەیەکی شاراوەی هەیە و دەبێت بە پرسیاری بەڵێ/نا بدۆزێتەوە."
  },
  tags: [
    { en: "Guessing Game",     tr: "Tahmin Oyunu",      ar: "لعبة تخمين",       ku: "یاری مەنزوور" },
    { en: "2 – 12 Players",    tr: "2 – 12 Oyuncu",     ar: "٢ – ١٢ لاعبون",   ku: "٢ – ١٢ یاریزان" },
    { en: "Party Game",        tr: "Parti Oyunu",       ar: "لعبة حفلات",       ku: "یاری پارتی" },
    { en: "Room & Local",      tr: "Oda & Yerel",       ar: "غرفة ومحلي",       ku: "ژوور و ناوخۆیی" }
  ],
  stats: {
    recommendedPlayers: "2 – 12",
    sessionTime: { en: "10 – 20 Min",      tr: "10 – 20 Dk",       ar: "١٠ – ٢٠ دقيقة",      ku: "١٠ – ٢٠ خولەک" },
    difficulty:  { en: "Easy",             tr: "Kolay",            ar: "سهل",                 ku: "ئاسان" },
    bestFor:     { en: "Friends & Groups", tr: "Arkadaş Grupları", ar: "للأصدقاء والمجموعات", ku: "بۆ هاوڕێ و گرووپ" }
  },
  bottomCTA: {
    title:    { en: "Ready to play Who Am I?",            tr: "Ben Neyim oynamaya hazır mısın?",       ar: "هل أنت مستعد للعب من أنا؟",          ku: "ئامادەی یاری من چیم بکەیت؟" },
    subtitle: { en: "Ask smart questions. Guess your identity.", tr: "Akıllı sorular sor. Kimliğini tahmin et.", ar: "اسأل أسئلة ذكية. خمّن هويتك.", ku: "پرسیاری زیرەکانە بکە. ناسنامەکەت مەنزوور بکە." }
  },
  detailBackground:   "/assets/world-bg/who-am-i-detail.webp",
  sectionsBackground: "/assets/world-bg/who-am-i-sections-bg.webp",
  ctaBackground:      "/assets/world-bg/who-am-i-cta-bg.webp",
  categories: [
    /* ── Basic categories ─────────────────────────────────────── */
    { key: "animals",       icon: "paw-print", difficulty: "Easy",   description: "Wild and domestic animals from around the world.", exampleWords: ["Lion","Cat","Eagle","Shark"],
      title: { en: "Animals",            tr: "Hayvanlar",          ar: "حيوانات",            ku: "ئاژەڵەکان" } },
    { key: "jobs",          icon: "briefcase", difficulty: "Easy",   description: "Common professions and trades.", exampleWords: ["Doctor","Teacher","Chef","Pilot"],
      title: { en: "Jobs",               tr: "Meslekler",          ar: "مهن",                 ku: "پیشەکان" } },
    { key: "objects",       icon: "package", difficulty: "Easy",   description: "Everyday items and tools you can hold.", exampleWords: ["Chair","Lamp","Book","Phone"],
      title: { en: "Objects",            tr: "Nesneler",           ar: "أشياء",               ku: "شتومەک" } },
    { key: "food",          icon: "utensils", difficulty: "Easy",   description: "Meals, snacks, and drinks people love.", exampleWords: ["Pizza","Tea","Apple","Coffee"],
      title: { en: "Food & Drinks",      tr: "Yiyecek & İçecek",   ar: "طعام ومشروب",         ku: "خواردن و خواردنەوە" } },
    { key: "countries",     icon: "globe", difficulty: "Medium", description: "Nations from every continent.", exampleWords: ["Japan","Brazil","Egypt","Canada"],
      title: { en: "Countries",          tr: "Ülkeler",            ar: "بلدان",               ku: "وڵاتان" } },
    { key: "cities",        icon: "building-2", difficulty: "Medium", description: "Famous cities around the globe.", exampleWords: ["Paris","Tokyo","Cairo","Istanbul"],
      title: { en: "Cities",             tr: "Şehirler",           ar: "مدن",                 ku: "شارەکان" } },
    { key: "places",        icon: "landmark", difficulty: "Medium", description: "Iconic landmarks and tourist spots.", exampleWords: ["Eiffel Tower","Pyramids","Big Ben","Statue of Liberty"],
      title: { en: "Famous Places",      tr: "Ünlü Yerler",        ar: "أماكن مشهورة",        ku: "شوێنە بەناوبانگەکان" } },
    { key: "vehicles",      icon: "car", difficulty: "Easy",   description: "Things that move people and goods.", exampleWords: ["Car","Plane","Train","Boat"],
      title: { en: "Vehicles",           tr: "Araçlar",            ar: "مركبات",              ku: "وەسائلی گواستنەوە" } },
    { key: "sports",        icon: "trophy", difficulty: "Easy",   description: "Games and athletic activities.", exampleWords: ["Football","Tennis","Boxing","Swimming"],
      title: { en: "Sports",             tr: "Sporlar",            ar: "رياضات",              ku: "وەرزشەکان" } },
    { key: "movies",        icon: "clapperboard", difficulty: "Medium", description: "Films from any era or genre.", exampleWords: ["Inception","Titanic","Avatar","Joker"],
      title: { en: "Movies",             tr: "Filmler",            ar: "أفلام",               ku: "فیلمەکان" } },
    { key: "tv-shows",      icon: "tv", difficulty: "Medium", description: "Series that captured the world.", exampleWords: ["Friends","Lost","Game of Thrones","Squid Game"],
      title: { en: "TV Shows",           tr: "Diziler",            ar: "مسلسلات",             ku: "زنجیرە تەلەفزیۆنییەکان" } },
    { key: "cartoons",      icon: "sparkles", difficulty: "Easy",   description: "Characters from animated worlds.", exampleWords: ["SpongeBob","Mickey","Tom","Bugs Bunny"],
      title: { en: "Cartoon Characters", tr: "Çizgi Karakterler",  ar: "شخصيات كرتونية",      ku: "کاراکتەری کارتۆن" } },
    { key: "famous-people", icon: "user-round", difficulty: "Medium", description: "Modern celebrities and icons.", exampleWords: ["Messi","Elon Musk","Beyoncé","Tom Cruise"],
      title: { en: "Famous People",      tr: "Ünlüler",            ar: "مشاهير",              ku: "ناودارەکان" } },
    { key: "historical",    icon: "scroll", difficulty: "Hard",   description: "People who shaped history.", exampleWords: ["Einstein","Cleopatra","Atatürk","Napoleon"],
      title: { en: "Historical Figures", tr: "Tarihi Kişiler",     ar: "شخصيات تاريخية",      ku: "کەسایەتی مێژوویی" } },
    { key: "brands",        icon: "tag", difficulty: "Medium", description: "Companies everyone recognizes.", exampleWords: ["Apple","Nike","Coca-Cola","Toyota"],
      title: { en: "Brands",             tr: "Markalar",           ar: "علامات تجارية",       ku: "ماڕکەکان" } },
    { key: "technology",    icon: "cpu", difficulty: "Medium", description: "Devices and inventions of the digital age.", exampleWords: ["Smartphone","Laptop","Camera","Drone"],
      title: { en: "Technology",        tr: "Teknoloji",          ar: "تكنولوجيا",           ku: "تەکنەلۆژیا" } },
    { key: "apps-sites",    icon: "monitor-smartphone", difficulty: "Medium", description: "Apps and websites we use daily.", exampleWords: ["WhatsApp","YouTube","Instagram","Google"],
      title: { en: "Apps & Websites",   tr: "Uygulamalar & Siteler", ar: "تطبيقات ومواقع",   ku: "ئەپ و ماڵپەڕەکان" } },
    { key: "school",        icon: "book-open", difficulty: "Easy",   description: "Things you find in a classroom.", exampleWords: ["Pencil","Notebook","Eraser","Ruler"],
      title: { en: "School Items",      tr: "Okul Eşyaları",      ar: "أدوات مدرسية",        ku: "کەلوپەلی خوێندنگە" } },
    { key: "home-items",    icon: "sofa", difficulty: "Easy",   description: "Stuff that lives in every house.", exampleWords: ["Sofa","Bed","Mirror","Vacuum"],
      title: { en: "Home Items",        tr: "Ev Eşyaları",        ar: "أدوات منزلية",        ku: "کەلوپەلی ماڵ" } },
    { key: "clothes",       icon: "shirt", difficulty: "Easy",   description: "Outfits and accessories.", exampleWords: ["Shirt","Hat","Jeans","Scarf"],
      title: { en: "Clothes",           tr: "Giysiler",           ar: "ملابس",                ku: "جلوبەرگ" } },
    { key: "body-parts",    icon: "heart-pulse", difficulty: "Easy",   description: "Parts of the human body.", exampleWords: ["Hand","Heart","Eye","Knee"],
      title: { en: "Body Parts",        tr: "Vücut Bölümleri",    ar: "أجزاء الجسم",         ku: "ئەندامەکانی لەش" } },
    { key: "nature",        icon: "trees", difficulty: "Easy",   description: "Landscapes and natural elements.", exampleWords: ["Mountain","River","Cloud","Forest"],
      title: { en: "Nature",            tr: "Doğa",               ar: "طبيعة",                ku: "سروشت" } },
    { key: "plants",        icon: "leaf", difficulty: "Medium", description: "Trees, flowers, and crops.", exampleWords: ["Rose","Oak","Cactus","Wheat"],
      title: { en: "Plants",            tr: "Bitkiler",           ar: "نباتات",               ku: "ڕووەکان" } },
    { key: "sea",           icon: "fish", difficulty: "Medium", description: "Life beneath the waves.", exampleWords: ["Octopus","Dolphin","Crab","Whale"],
      title: { en: "Sea Creatures",     tr: "Deniz Canlıları",    ar: "كائنات بحرية",         ku: "زیندەوەری دەریا" } },
    { key: "insects",       icon: "bug", difficulty: "Medium", description: "Tiny crawlers and flyers.", exampleWords: ["Ant","Bee","Butterfly","Spider"],
      title: { en: "Insects",           tr: "Böcekler",           ar: "حشرات",                ku: "مێروو" } },
    { key: "mythical",      icon: "wand-sparkles", difficulty: "Hard",   description: "Creatures of legend and myth.", exampleWords: ["Dragon","Unicorn","Phoenix","Mermaid"],
      title: { en: "Mythical Creatures",tr: "Efsanevi Yaratıklar", ar: "كائنات أسطورية",     ku: "زیندەوەری ئەفسانەیی" } },
    { key: "superheroes",   icon: "shield", difficulty: "Easy",   description: "Heroes with extraordinary powers.", exampleWords: ["Superman","Spider-Man","Wonder Woman","Iron Man"],
      title: { en: "Superheroes",       tr: "Süper Kahramanlar",  ar: "أبطال خارقون",         ku: "پاڵەوانە دیارەکان" } },
    { key: "villains",      icon: "skull", difficulty: "Medium", description: "Famous bad guys from fiction.", exampleWords: ["Joker","Thanos","Voldemort","Darth Vader"],
      title: { en: "Villains",          tr: "Kötü Karakterler",   ar: "أشرار",                ku: "خراپەکاران" } },
    { key: "video-games",   icon: "gamepad-2", difficulty: "Medium", description: "Iconic games from all platforms.", exampleWords: ["Minecraft","Mario","FIFA","Fortnite"],
      title: { en: "Video Games",       tr: "Video Oyunları",     ar: "ألعاب فيديو",          ku: "یاری ڤیدیۆ" } },
    { key: "music",         icon: "music", difficulty: "Medium", description: "Singers, bands, and music styles.", exampleWords: ["Adele","Eminem","BTS","Queen"],
      title: { en: "Music & Singers",   tr: "Müzik & Sanatçılar", ar: "موسيقى ومغنون",        ku: "مۆسیقا و گۆرانیبێژان" } },
    { key: "football",      icon: "trophy", difficulty: "Medium", description: "Star players from world football.", exampleWords: ["Messi","Ronaldo","Pelé","Mbappé"],
      title: { en: "Football Players",  tr: "Futbolcular",        ar: "لاعبو كرة القدم",      ku: "یاریزانانی تۆپی پێ" } },
    { key: "tools",         icon: "hammer", difficulty: "Medium", description: "Handyman essentials.", exampleWords: ["Hammer","Drill","Saw","Wrench"],
      title: { en: "Tools",             tr: "Aletler",            ar: "أدوات",                ku: "ئامرازەکان" } },
    { key: "kitchen",       icon: "chef-hat", difficulty: "Easy",   description: "Cookware and kitchen gadgets.", exampleWords: ["Pan","Knife","Mixer","Kettle"],
      title: { en: "Kitchen Items",     tr: "Mutfak Eşyaları",    ar: "أدوات مطبخ",           ku: "کەلوپەلی چێشتخانە" } },
    { key: "emotions",      icon: "smile", difficulty: "Hard",   description: "Feelings people experience.", exampleWords: ["Joy","Anger","Fear","Surprise"],
      title: { en: "Emotions",          tr: "Duygular",           ar: "مشاعر",                ku: "هەستەکان" } },
    { key: "colors",        icon: "palette", difficulty: "Easy",   description: "Names of colors and shades.", exampleWords: ["Red","Blue","Gold","Magenta"],
      title: { en: "Colors",            tr: "Renkler",            ar: "ألوان",                ku: "ڕەنگەکان" } },
    { key: "shapes",        icon: "shapes", difficulty: "Easy",   description: "Basic and complex shapes.", exampleWords: ["Circle","Square","Pyramid","Hexagon"],
      title: { en: "Shapes",            tr: "Şekiller",           ar: "أشكال",                ku: "شێوەکان" } },
    { key: "hobbies",       icon: "heart", difficulty: "Medium", description: "Pastimes people love.", exampleWords: ["Painting","Gaming","Hiking","Cooking"],
      title: { en: "Hobbies",           tr: "Hobiler",            ar: "هوايات",               ku: "حەزە تایبەتییەکان" } },

    /* ── Auto / car-related ──────────────────────────────────── */
    { key: "car-brands",    icon: "car", difficulty: "Medium", description: "Famous car manufacturers.", exampleWords: ["Toyota","Ferrari","BMW","Tesla"],
      title: { en: "Car Brands",        tr: "Araba Markaları",    ar: "ماركات سيارات",        ku: "ماڕکی ئۆتۆمبێل" } },
    { key: "car-models",    icon: "car", difficulty: "Hard",   description: "Specific vehicle models.", exampleWords: ["Mustang","Civic","Model S","Corolla"],
      title: { en: "Car Models",        tr: "Araba Modelleri",    ar: "موديلات سيارات",       ku: "مۆدێلی ئۆتۆمبێل" } },
    { key: "car-parts",     icon: "wrench", difficulty: "Hard",   description: "Components that make a car run.", exampleWords: ["Engine","Brake","Tire","Battery"],
      title: { en: "Car Parts",         tr: "Araba Parçaları",    ar: "قطع غيار",             ku: "پارچەی ئۆتۆمبێل" } },
    { key: "garage-tools",  icon: "wrench", difficulty: "Medium", description: "Mechanic workshop essentials.", exampleWords: ["Jack","Wrench","Diagnostic Tool","Air Compressor"],
      title: { en: "Garage Tools",      tr: "Garaj Aletleri",     ar: "أدوات كراج",           ku: "ئامرازەکانی گاراج" } },
    { key: "mechanic-jobs", icon: "briefcase", difficulty: "Medium", description: "Workshop roles and specialties.", exampleWords: ["Mechanic","Engineer","Technician","Apprentice"],
      title: { en: "Mechanic Jobs",     tr: "Tamirci Meslekleri", ar: "مهن الميكانيكي",       ku: "پیشەکانی مەکانیک" } },
    { key: "road-signs",    icon: "traffic-cone", difficulty: "Medium", description: "Traffic signs and road warnings.", exampleWords: ["Stop","Yield","Speed Limit","One Way"],
      title: { en: "Road Signs",        tr: "Trafik İşaretleri",  ar: "إشارات الطريق",        ku: "نیشانە ڕێگاوبانییەکان" } },
    { key: "car-problems",  icon: "alert-triangle", difficulty: "Hard",   description: "Common vehicle issues.", exampleWords: ["Flat Tire","Engine Light","Overheat","Dead Battery"],
      title: { en: "Vehicle Problems",  tr: "Araç Sorunları",     ar: "مشاكل المركبات",       ku: "کێشەکانی وەسایت" } },
    { key: "engine-parts",  icon: "cog", difficulty: "Expert", description: "Inside the engine block.", exampleWords: ["Piston","Crankshaft","Spark Plug","Cylinder"],
      title: { en: "Engine Parts",      tr: "Motor Parçaları",    ar: "قطع المحرك",           ku: "پارچەکانی ماتۆڕ" } },
    { key: "interior-car",  icon: "armchair", difficulty: "Medium", description: "Things inside the cabin.", exampleWords: ["Steering Wheel","Dashboard","Seat","Pedal"],
      title: { en: "Interior Car Parts",tr: "İç Donanım",         ar: "قطع داخلية",           ku: "پارچەی نێوخۆیی" } },
    { key: "exterior-car",  icon: "car", difficulty: "Medium", description: "Things outside the car body.", exampleWords: ["Bumper","Hood","Mirror","Headlight"],
      title: { en: "Exterior Car Parts",tr: "Dış Donanım",        ar: "قطع خارجية",           ku: "پارچەی دەرەوە" } },

    /* ── Funny / party ───────────────────────────────────────── */
    { key: "weird-objects", icon: "puzzle", difficulty: "Medium", description: "Strange and unusual stuff.", exampleWords: ["Rubber Duck","Lava Lamp","Cactus Plush","Pet Rock"],
      title: { en: "Weird Objects",     tr: "Garip Nesneler",     ar: "أشياء غريبة",          ku: "شتە سەیرەکان" } },
    { key: "funny-animals", icon: "laugh", difficulty: "Easy",   description: "Animals known for being silly.", exampleWords: ["Sloth","Llama","Penguin","Capybara"],
      title: { en: "Funny Animals",     tr: "Komik Hayvanlar",    ar: "حيوانات مضحكة",         ku: "ئاژەڵە سەرنجڕاکێشەکان" } },
    { key: "embarrassing",  icon: "frown", difficulty: "Adults", description: "Awkward life moments.", exampleWords: ["Tripping","Forgetting Name","Spinach in Teeth","Wrong Door"],
      title: { en: "Embarrassing Situations", tr: "Utanç Verici Durumlar", ar: "مواقف محرجة", ku: "بارودۆخی شەرماوی" } },
    { key: "memes",         icon: "message-square", difficulty: "Medium", description: "Famous internet jokes and memes.", exampleWords: ["Doge","Stonks","Distracted Boyfriend","Cat Vibing"],
      title: { en: "Internet Memes",    tr: "İnternet Memleri",   ar: "ميمات الإنترنت",       ku: "میمی ئینتەرنێت" } },
    { key: "daily-life",    icon: "calendar", difficulty: "Easy",   description: "Things from your everyday routine.", exampleWords: ["Brushing Teeth","Morning Coffee","Commute","Cooking Dinner"],
      title: { en: "Daily Life Things", tr: "Günlük Yaşam",       ar: "حياة يومية",           ku: "ژیانی ڕۆژانە" } },
    { key: "hard-random",   icon: "shuffle", difficulty: "Hard",   description: "Difficult random mix mode.",
      title: { en: "Hard Mode Random",  tr: "Zor Karma",          ar: "عشوائي صعب",           ku: "هەڕەمەکی قورس" } },
    { key: "kids-easy",     icon: "baby", difficulty: "Kids",   description: "Simple words for children.", exampleWords: ["Cat","Sun","Ball","Apple"],
      title: { en: "Easy Mode for Kids",tr: "Çocuklar İçin Kolay",ar: "سهل للأطفال",          ku: "ئاسان بۆ منداڵان" } },
    { key: "inside-jokes",  icon: "message-circle", difficulty: "Hard",   description: "Friend-group inside jokes (your own pool).",
      title: { en: "Friends' Inside Jokes", tr: "Arkadaş Şakaları", ar: "نكات الأصدقاء",     ku: "گاڵتەی هاوڕێیان" } },
    { key: "family",        icon: "users", difficulty: "Easy",   description: "Safe words for family game night.", exampleWords: ["Movie","Picnic","Vacation","Park"],
      title: { en: "Family Friendly",   tr: "Aile Dostu",         ar: "ملائم للعائلة",        ku: "گونجاو بۆ خێزان" } },
    { key: "impossible",    icon: "skull", difficulty: "Expert", description: "Extreme challenge — niche words.",
      title: { en: "Impossible Mode",   tr: "İmkansız Mod",       ar: "مستحيل",               ku: "ئەستەم" } },

    /* ── Difficulty / pacing modes ───────────────────────────── */
    { key: "mode-easy",     icon: "circle-check", difficulty: "Easy",    description: "Easy mode — simple categories only.",
      title: { en: "Easy Mode",         tr: "Kolay Mod",          ar: "وضع سهل",              ku: "مۆدی ئاسان" } },
    { key: "mode-medium",   icon: "zap", difficulty: "Medium",  description: "Balanced difficulty mix.",
      title: { en: "Medium Mode",       tr: "Orta Mod",           ar: "وضع متوسط",            ku: "مۆدی ناوەند" } },
    { key: "mode-hard",     icon: "flame", difficulty: "Hard",    description: "For experienced players.",
      title: { en: "Hard Mode",         tr: "Zor Mod",            ar: "وضع صعب",              ku: "مۆدی قورس" } },
    { key: "mode-expert",   icon: "award", difficulty: "Expert",  description: "Toughest words and rarest items.",
      title: { en: "Expert Mode",       tr: "Uzman Mod",          ar: "وضع الخبير",           ku: "مۆدی پسپۆڕ" } },
    { key: "mode-kids",     icon: "baby", difficulty: "Kids",    description: "Kids-friendly only.",
      title: { en: "Kids Mode",         tr: "Çocuk Modu",         ar: "وضع الأطفال",          ku: "مۆدی منداڵان" } },
    { key: "mode-adults",   icon: "user", difficulty: "Adults",  description: "Adult-themed pool.",
      title: { en: "Adults Mode",       tr: "Yetişkin Mod",       ar: "وضع البالغين",         ku: "مۆدی گەورەسالان" } },
    { key: "mode-quick",    icon: "timer", difficulty: "Quick",   description: "Short, fast-paced rounds.",
      title: { en: "Quick Round",       tr: "Hızlı Tur",          ar: "جولة سريعة",           ku: "گەرانێکی خێرا" } },
    { key: "mode-long",     icon: "clock", difficulty: "Long",    description: "Long, deep rounds for big groups.",
      title: { en: "Long Round",        tr: "Uzun Tur",           ar: "جولة طويلة",           ku: "گەرانێکی درێژ" } },

    /* ── Mix ─────────────────────────────────────────────────── */
    { key: "random",        icon: "dices", difficulty: "Medium", description: "A surprise mix of all categories.",
      title: { en: "Random Mix",        tr: "Karma",              ar: "خليط عشوائي",          ku: "تێکەڵی هەڕەمەکی" } }
  ]
}

const WORLDS: Record<string, WorldDetail> = {
  "vampire-village": VAMPIRE,
  "mafia-classic":   MAFIA,
  "spy-game":        SPY,
  "who-am-i":        WHO_AM_I
}

export function getWorldDetail(gameId: string): WorldDetail | undefined {
  return WORLDS[gameId]
}
