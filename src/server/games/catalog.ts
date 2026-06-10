import type { Game } from "@shared/types.js"

export const GAME_CATALOG: readonly Game[] = [
  {
    id: "vampire-village",
    icon: "🧛",
    theme: "vampire-village",
    minPlayers: 3,
    defaultSettings: { vampireCount: 1, doctor: true, detective: true },
    title: {
      ku: "ڤامپایەر و گوندی",
      ar: "مصاص الدماء والقرية",
      en: "Vampire Village",
      tr: "Vampir Köylü"
    },
    subtitle: {
      ku: "یاری ڕۆڵی نهێنی؛ ئەدمین ڕۆڵەکان دابەش دەکات.",
      ar: "لعبة أدوار سرية؛ المدير يوزّع الأدوار.",
      en: "A secret-role game where the admin assigns hidden roles.",
      tr: "Adminin gizli rolleri dağıttığı sosyal rol oyunu."
    },
    rules: {
      ku: [
        "ئەدمین ژوور دروست دەکات و کۆد دەدات بە یاریزانەکان.",
        "هەر یاریزانێک تەنها ڕۆڵی خۆی دەبینێت.",
        "ئەدمین هەموو ڕۆڵەکان دەبینێت.",
        "ئەم وەشانە تەنها بۆ دابەشکردنی ڕۆڵەکانە؛ بەڕێوەبردنی شەو/ڕۆژ لە دەرەوە دەکرێت."
      ],
      ar: [
        "المدير ينشئ غرفة ويعطي الكود للاعبين.",
        "كل لاعب يرى دوره فقط.",
        "المدير يرى جميع الأدوار.",
        "هذا الإصدار لتوزيع الأدوار فقط؛ إدارة الليل والنهار تتم خارج النظام."
      ],
      en: [
        "The admin creates a room and gives the code to players.",
        "Each player only sees their own role.",
        "The admin can see all roles.",
        "This version only distributes roles; day/night gameplay is managed outside the system."
      ],
      tr: [
        "Admin oda kurar ve kodu oyunculara verir.",
        "Her oyuncu sadece kendi rolünü görür.",
        "Admin bütün rolleri görür.",
        "Bu sürüm sadece rol dağıtır; gece/gündüz oyunu dışarıda yönetilir."
      ]
    },
    roles: [
      {
        id: "vampire",
        icon: "🧛",
        countSetting: "vampireCount",
        name: { ku: "ڤامپایەر", ar: "مصاص دماء", en: "Vampire", tr: "Vampir" },
        desc: {
          ku: "تۆ ڤامپایەری. ڕۆڵەکەت بە نهێنی بهێڵەوە.",
          ar: "أنت مصاص دماء. أخفِ دورك عن الآخرين.",
          en: "You are a Vampire. Keep your role hidden.",
          tr: "Sen Vampirsin. Rolünü gizli tut."
        }
      },
      {
        id: "doctor",
        icon: "🩺",
        enabledSetting: "doctor",
        name: { ku: "پزیشک", ar: "الطبيب", en: "Doctor", tr: "Doktor" },
        desc: {
          ku: "تۆ پزیشکی. لای گوندییەکانیت.",
          ar: "أنت الطبيب. أنت مع أهل القرية.",
          en: "You are the Doctor. You are on the village side.",
          tr: "Sen Doktorsun. Köylü tarafındasın."
        }
      },
      {
        id: "detective",
        icon: "🕵️",
        enabledSetting: "detective",
        name: { ku: "پشکنەر", ar: "المحقق", en: "Detective", tr: "Dedektif" },
        desc: {
          ku: "تۆ پشکنەری. هەوڵ بدە ڤامپایەر بدۆزیتەوە.",
          ar: "أنت المحقق. حاول معرفة مصاصي الدماء.",
          en: "You are the Detective. Try to find the vampires.",
          tr: "Sen Dedektifsin. Vampirleri bulmaya çalış."
        }
      },
      {
        id: "villager",
        icon: "👨‍🌾",
        filler: true,
        name: { ku: "گوندی", ar: "قروي", en: "Villager", tr: "Köylü" },
        desc: {
          ku: "تۆ گوندیی. هەوڵ بدە ڕاستی بدۆزیتەوە.",
          ar: "أنت قروي. حاول اكتشاف الحقيقة.",
          en: "You are a Villager. Try to discover the truth.",
          tr: "Sen Köylüsün. Gerçeği bulmaya çalış."
        }
      }
    ],
    settings: [
      {
        type: "number",
        key: "vampireCount",
        min: 1,
        max: 5,
        label: { ku: "ژمارەی ڤامپایەر", ar: "عدد مصاصي الدماء", en: "Vampire Count", tr: "Vampir Sayısı" }
      },
      {
        type: "boolean",
        key: "doctor",
        label: { ku: "پزیشک هەبێت", ar: "تفعيل الطبيب", en: "Enable Doctor", tr: "Doktor Olsun" }
      },
      {
        type: "boolean",
        key: "detective",
        label: { ku: "پشکنەر هەبێت", ar: "تفعيل المحقق", en: "Enable Detective", tr: "Dedektif Olsun" }
      }
    ]
  },
  {
    id: "mafia-classic",
    icon: "🕴️",
    theme: "mafia-classic",
    minPlayers: 4,
    defaultSettings: { mafiaCount: 1, doctor: true, detective: true },
    title: { ku: "مافیا کلاسیک", ar: "مافيا كلاسيكية", en: "Classic Mafia", tr: "Klasik Mafya" },
    subtitle: {
      ku: "وەشانی مافیای کلاسیک بۆ دابەشکردنی ڕۆڵەکان.",
      ar: "نسخة كلاسيكية من لعبة المافيا لتوزيع الأدوار.",
      en: "Classic Mafia role distribution mode.",
      tr: "Klasik Mafya için rol dağıtma modu."
    },
    rules: {
      ku: [
        "مافیاکان دەبێت خۆیان بشارنەوە.",
        "شارستانییەکان دەبێت مافیاکان بدۆزنەوە.",
        "ئەدمین هەموو ڕۆڵەکان دەبینێت.",
        "تەنها ڕۆڵ دابەش دەکرێت، یاری بە دەنگدان لە دەرەوە دەکرێت."
      ],
      ar: [
        "على المافيا إخفاء هويتهم.",
        "على المدنيين اكتشاف المافيا.",
        "المدير يرى جميع الأدوار.",
        "النظام يوزّع الأدوار فقط، والتصويت يتم خارج النظام."
      ],
      en: [
        "Mafia players must hide their identity.",
        "Citizens try to find the mafia.",
        "The admin sees all roles.",
        "The system only distributes roles; voting is handled outside the system."
      ],
      tr: [
        "Mafya oyuncuları kimliklerini gizler.",
        "Vatandaşlar mafyayı bulmaya çalışır.",
        "Admin bütün rolleri görür.",
        "Sistem sadece rol dağıtır; oylama dışarıda yapılır."
      ]
    },
    roles: [
      {
        id: "mafia",
        icon: "🕴️",
        countSetting: "mafiaCount",
        name: { ku: "مافیا", ar: "مافيا", en: "Mafia", tr: "Mafya" },
        desc: {
          ku: "تۆ مافیایت. ڕۆڵەکەت بشارەوە.",
          ar: "أنت من المافيا. أخفِ دورك.",
          en: "You are Mafia. Hide your role.",
          tr: "Sen Mafyasın. Rolünü gizle."
        }
      },
      {
        id: "doctor",
        icon: "🩺",
        enabledSetting: "doctor",
        name: { ku: "پزیشک", ar: "الطبيب", en: "Doctor", tr: "Doktor" },
        desc: {
          ku: "تۆ پزیشکی و لای شارستانییەکانیت.",
          ar: "أنت الطبيب وأنت مع المدنيين.",
          en: "You are the Doctor and you are on the citizen side.",
          tr: "Sen Doktorsun ve vatandaş tarafındasın."
        }
      },
      {
        id: "detective",
        icon: "🕵️",
        enabledSetting: "detective",
        name: { ku: "پشکنەر", ar: "المحقق", en: "Detective", tr: "Dedektif" },
        desc: {
          ku: "تۆ پشکنەری. مافیا بدۆزەوە.",
          ar: "أنت المحقق. حاول اكتشاف المافيا.",
          en: "You are the Detective. Try to find the mafia.",
          tr: "Sen Dedektifsin. Mafyayı bulmaya çalış."
        }
      },
      {
        id: "citizen",
        icon: "👤",
        filler: true,
        name: { ku: "شارستانی", ar: "مدني", en: "Citizen", tr: "Vatandaş" },
        desc: {
          ku: "تۆ شارستانییت. مافیا بدۆزەوە.",
          ar: "أنت مدني. حاول معرفة المافيا.",
          en: "You are a Citizen. Try to find the mafia.",
          tr: "Sen Vatandaşsın. Mafyayı bulmaya çalış."
        }
      }
    ],
    settings: [
      {
        type: "number",
        key: "mafiaCount",
        min: 1,
        max: 5,
        label: { ku: "ژمارەی مافیا", ar: "عدد المافيا", en: "Mafia Count", tr: "Mafya Sayısı" }
      },
      {
        type: "boolean",
        key: "doctor",
        label: { ku: "پزیشک هەبێت", ar: "تفعيل الطبيب", en: "Enable Doctor", tr: "Doktor Olsun" }
      },
      {
        type: "boolean",
        key: "detective",
        label: { ku: "پشکنەر هەبێت", ar: "تفعيل المحقق", en: "Enable Detective", tr: "Dedektif Olsun" }
      }
    ]
  },
  {
    id: "spy-game",
    icon: "🕶️",
    theme: "spy-game",
    minPlayers: 3,
    defaultSettings: { spyCount: 1 },
    title: { ku: "سیخوڕ", ar: "الجاسوس", en: "Spy Game", tr: "Casus Oyunu" },
    subtitle: {
      ku: "یارییەکی ساده؛ هەمووان یەک ڕۆڵیان هەیە بەڵام سیخوڕ جیاوازە.",
      ar: "لعبة بسيطة؛ الجميع لهم دور واحد لكن الجاسوس مختلف.",
      en: "A simple hidden-role game where spies must stay hidden.",
      tr: "Casusun gizli kaldığı basit rol oyunu."
    },
    rules: {
      ku: [
        "سیخوڕ دەبێت خۆی بشارێتەوە.",
        "یاریزانەکانی تر دەبێت سیخوڕ بدۆزنەوە.",
        "ئەدمین هەموو ڕۆڵەکان دەبینێت.",
        "ئەم یارییە تەنها ڕۆڵ دابەش دەکات."
      ],
      ar: [
        "على الجاسوس إخفاء نفسه.",
        "بقية اللاعبين يحاولون اكتشاف الجاسوس.",
        "المدير يرى جميع الأدوار.",
        "هذه اللعبة توزع الأدوار فقط."
      ],
      en: [
        "The spy must stay hidden.",
        "Other players try to find the spy.",
        "The admin sees all roles.",
        "This game only distributes roles."
      ],
      tr: [
        "Casus kendini gizler.",
        "Diğer oyuncular casusu bulmaya çalışır.",
        "Admin bütün rolleri görür.",
        "Bu oyun sadece rol dağıtır."
      ]
    },
    roles: [
      {
        id: "spy",
        icon: "🕶️",
        countSetting: "spyCount",
        name: { ku: "سیخوڕ", ar: "جاسوس", en: "Spy", tr: "Casus" },
        desc: {
          ku: "تۆ سیخوڕی. خۆت مەدەرخە.",
          ar: "أنت الجاسوس. لا تكشف نفسك.",
          en: "You are the Spy. Do not reveal yourself.",
          tr: "Sen Casussun. Kendini belli etme."
        }
      },
      {
        id: "normal",
        icon: "🙂",
        filler: true,
        name: { ku: "یاریزانی ئاسایی", ar: "لاعب عادي", en: "Normal Player", tr: "Normal Oyuncu" },
        desc: {
          ku: "تۆ یاریزانی ئاساییت. سیخوڕ بدۆزەوە.",
          ar: "أنت لاعب عادي. حاول إيجاد الجاسوس.",
          en: "You are a normal player. Try to find the spy.",
          tr: "Sen normal oyuncusun. Casusu bulmaya çalış."
        }
      }
    ],
    settings: [
      {
        type: "number",
        key: "spyCount",
        min: 1,
        max: 4,
        label: { ku: "ژمارەی سیخوڕ", ar: "عدد الجواسيس", en: "Spy Count", tr: "Casus Sayısı" }
      }
    ]
  }
] as const

const byId = new Map(GAME_CATALOG.map(g => [g.id, g]))
export function resolveGame(id: string): Game | undefined { return byId.get(id) }
export function defaultGame(): Game { return GAME_CATALOG[0]! }
