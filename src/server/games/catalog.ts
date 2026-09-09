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
        name: { ku: "ڤامپایەری شەو", ar: "مصاص دماء ليلي", en: "Night Vampire", tr: "Gece Vampiri" },
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
        name: { ku: "گەورەی مافیا", ar: "زعيم المافيا", en: "Mafia Boss", tr: "Mafya Babası" },
        desc: {
          ku: "تۆ گەورەی مافیایت. ناسنامەت بشارەوە و شەو کۆنترۆڵ بکە.",
          ar: "أنت زعيم المافيا. أخفِ هويتك واحكم الليل.",
          en: "You are the Mafia Boss. Hide your identity and control the night.",
          tr: "Sen Mafya Babasısın. Kimliğini gizle ve geceyi yönet."
        }
      },
      {
        id: "doctor",
        icon: "🩺",
        enabledSetting: "doctor",
        name: { ku: "پزیشک", ar: "الطبيب", en: "Doctor", tr: "Doktor" },
        desc: {
          ku: "تۆ پزیشکی. یاریزانان بپارێزە و پشتگیری شار بکە.",
          ar: "أنت الطبيب. احمِ اللاعبين وادعم المدينة.",
          en: "You are the Doctor. Protect players and support the city.",
          tr: "Sen Doktorsun. Oyuncuları koru ve şehre destek ol."
        }
      },
      {
        id: "detective",
        icon: "🕵️",
        enabledSetting: "detective",
        name: { ku: "پشکنەر", ar: "المحقق", en: "Detective", tr: "Dedektif" },
        desc: {
          ku: "تۆ پشکنەری. لێکۆڵینەوە بکە و مافیا بدۆزەوە.",
          ar: "أنت المحقق. حقّق وابحث عن المافيا.",
          en: "You are the Detective. Investigate and find the mafia.",
          tr: "Sen Dedektifsin. Araştır ve mafyayı bul."
        }
      },
      {
        id: "citizen",
        icon: "👤",
        filler: true,
        name: { ku: "شارستانی", ar: "مدني", en: "Citizen", tr: "Vatandaş" },
        desc: {
          ku: "تۆ شارستانییت. تەماشا بکە، گفتوگۆ بکە و ڕاستی بدۆزەرەوە.",
          ar: "أنت مدني. راقب وناقش واكتشف الحقيقة.",
          en: "You are a Citizen. Watch, discuss, and discover the truth.",
          tr: "Sen Vatandaşsın. Gözle, tartış ve gerçeği keşfet."
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
    defaultSettings: { spyCount: 1, roundMinutes: 5, guessAttempts: 1 },
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
        key: "roundMinutes",
        min: 1,
        max: 20,
        label: { ku: "کاتی گفتوگۆ", ar: "وقت النقاش", en: "Discussion Time", tr: "Tartışma Süresi" }
      },
      {
        type: "number",
        key: "guessAttempts",
        min: 1,
        max: 5,
        label: { ku: "هەوڵی پێشبینی", ar: "محاولات التخمين", en: "Guess Attempts", tr: "Tahmin Hakkı" }
      },
      {
        type: "number",
        key: "spyCount",
        min: 1,
        max: 4,
        label: { ku: "ژمارەی سیخوڕ", ar: "عدد الجواسيس", en: "Spy Count", tr: "Casus Sayısı" }
      }
    ]
  },
  {
    id: "football-player-guess",
    icon: "FC",
    theme: "football-player-guess",
    minPlayers: 2,
    defaultSettings: {},
    title: {
      ku: "پێشبینی یاریزانی فووتباڵ",
      ar: "تخمين لاعب كرة القدم",
      en: "Football Player Guess",
      tr: "Futbolcu Tahmin Oyunu"
    },
    subtitle: {
      ku: "یاریی پێشبینی فووتباڵ بە کارتە شاراوەکانی یاریزانان.",
      ar: "لعبة تخمين كروية ببطاقات لاعبين خفية.",
      en: "A football guessing game with hidden player cards.",
      tr: "Gizli futbolcu kartlarıyla oynanan tahmin oyunu."
    },
    rules: {
      ku: [
        "هۆست یارییەکی ناوخۆیی دەستپێدەکات و ناوی یاریزانان دەنووسێت.",
        "هەر یاریزانێک کارتێکی شاراوەی فووتباڵگەرێکی پێ دەدرێت.",
        "یاریزانی نۆبەت پرسیاری بەڵێ/نا دەکات.",
        "پێش تەواوبوونی کات هەوڵ بدە فووتباڵگەرەکە بدۆزیتەوە."
      ],
      ar: [
        "ينشئ المضيف لعبة محلية ويُدخل أسماء اللاعبين.",
        "كل لاعب يحصل على بطاقة لاعب كرة قدم سرية.",
        "اللاعب صاحب الدور يطرح أسئلة بنعم/لا.",
        "حاول تخمين اللاعب قبل انتهاء الوقت."
      ],
      en: [
        "The host starts a local game and enters player names.",
        "Each player receives a hidden football player card.",
        "The active player asks yes/no questions.",
        "Guess the footballer before the time ends."
      ],
      tr: [
        "Host yerel oyunu başlatır ve oyuncu isimlerini girer.",
        "Her oyuncuya gizli bir futbolcu kartı verilir.",
        "Sıra kendisinde olan oyuncu evet/hayır soruları sorar.",
        "Süre bitmeden futbolcuyu tahmin etmeye çalışır."
      ]
    },
    roles: [
      {
        id: "football-player-card",
        icon: "FC",
        filler: true,
        name: {
          ku: "کارتی یاریزانی فووتباڵ",
          ar: "بطاقة لاعب كرة القدم",
          en: "Football Player Card",
          tr: "Futbolcu Kartı"
        },
        desc: {
          ku: "ناسنامەیەکی شاراوەی فووتباڵ کە بە یاریزانێک دەدرێت.",
          ar: "هوية كروية خفية تُسند إلى اللاعب.",
          en: "A hidden football identity assigned to a player.",
          tr: "Oyuncuya atanan gizli futbolcu kimliği."
        }
      }
    ],
    settings: []
  },
  {
    id: "who-am-i",
    icon: "❓",
    theme: "who-am-i",
    minPlayers: 2,
    defaultSettings: { roundSeconds: 60 },
    title: { ku: "من چیم؟", ar: "من أنا؟", en: "Who Am I?", tr: "Ben Neyim?" },
    subtitle: {
      ku: "یارییەکی پارتی: هەر یاریزانێک ناسنامەیەکی شاراوەی هەیە و دەبێت بە پرسیار بدۆزێتەوە.",
      ar: "لعبة حفلات: لكل لاعب هوية خفية يجب اكتشافها بالأسئلة.",
      en: "A party guessing game: each player has a hidden identity to uncover by asking questions.",
      tr: "Parti tahmin oyunu: her oyuncuya gizli bir kimlik verilir, sorularla bulunmalıdır."
    },
    rules: {
      ku: [
        "هۆست ژوور دروست دەکات و کاتیگۆرییەک هەڵدەبژێرێت.",
        "یاریزانان بە کۆد دێنە ژوورەوە؛ هەر کەس ناسنامەیەکی شاراوە وەردەگرێت.",
        "تۆ ناسنامەی خۆت نابینیت — دیکە دەیبینن.",
        "بە پرسیاری بەڵێ/نا هەوڵبدە بدۆزیتەوە کێی یان چی."
      ],
      ar: [
        "ينشئ المضيف غرفة ويختار فئة.",
        "يدخل اللاعبون بالكود ويتلقى كل واحد هوية خفية.",
        "أنت لا ترى هويتك — الآخرون يرونها.",
        "اطرح أسئلة بنعم/لا حتى تكتشف من أو ما أنت."
      ],
      en: [
        "The host creates a room and chooses a category.",
        "Players join with a code; each gets a hidden identity.",
        "You cannot see your own identity — others can.",
        "Ask yes/no questions until you discover who or what you are."
      ],
      tr: [
        "Yönetici oda kurar ve bir kategori seçer.",
        "Oyuncular kod ile girer; her birine gizli bir kimlik verilir.",
        "Kendi kimliğini göremezsin — diğerleri görür.",
        "Evet/hayır soruları sorarak kim ya da ne olduğunu keşfet."
      ]
    },
    roles: [
      {
        id: "animal",
        icon: "🐾",
        filler: true,
        name: { ku: "ئاژەڵەکان", ar: "حيوانات",  en: "Animals", tr: "Hayvanlar" },
        desc: {
          ku: "گیانلەبەرانی کێوی، ئاژەڵە ماڵییەکان، یان زیندەوەری ئەفسانەیی.",
          ar: "حياة برية أو حيوانات أليفة أو مخلوقات أسطورية.",
          en: "Wildlife, pets, or mythical creatures.",
          tr: "Vahşi hayvanlar, evcil dostlar veya efsanevi yaratıklar."
        }
      },
      {
        id: "job",
        icon: "👨‍⚕️",
        filler: true,
        name: { ku: "پیشەکان", ar: "مهن", en: "Jobs", tr: "Meslekler" },
        desc: {
          ku: "پیشە و کارەکانی نێو کۆمەڵگا.",
          ar: "مهن وأدوار اجتماعية.",
          en: "Professions and roles in society.",
          tr: "Mesleki rol ve görevler."
        }
      },
      {
        id: "object",
        icon: "🎁",
        filler: true,
        name: { ku: "شتومەک", ar: "أشياء", en: "Objects", tr: "Nesneler" },
        desc: {
          ku: "شتە ڕۆژانە و ئامرازەکان.",
          ar: "أشياء وأدوات يومية.",
          en: "Everyday items and tools.",
          tr: "Günlük eşyalar ve aletler."
        }
      },
      {
        id: "famous",
        icon: "⭐",
        filler: true,
        name: { ku: "کەسایەتییە ناودارەکان", ar: "شخصيات مشهورة", en: "Famous People", tr: "Ünlü Kişiler" },
        desc: {
          ku: "ستێرە، کەسایەتی مێژوویی، یان کاراکتەرە بەناوبانگەکان.",
          ar: "مشاهير وشخصيات تاريخية وأبطال.",
          en: "Celebrities, historical figures, and beloved characters.",
          tr: "Ünlüler, tarihi kişilikler ve sevilen karakterler."
        }
      }
    ],
    settings: [
      {
        type: "number",
        key: "roundSeconds",
        min: 15,
        max: 180,
        label: { ku: "کاتی خولی (چرکە)", ar: "وقت الجولة (ثواني)", en: "Round Time (seconds)", tr: "Tur Süresi (saniye)" }
      }
    ]
  },
  {
    id: "most-likely-to",
    icon: "🫵",
    theme: "most-likely-to",
    minPlayers: 2,
    // The server keeps the clock, collects the votes and opens them together,
    // so this room runs on the turn engine rather than on a deal of roles.
    turnBased: true,
    defaultSettings: { votingSeconds: 20, roundCount: 5, showVoters: false },
    title: {
      ku: "کێ زۆرترین ئەگەری هەیە؟",
      ar: "من الأكثر احتمالاً؟",
      en: "Most Likely To",
      tr: "En Muhtemel Kim?"
    },
    subtitle: {
      ku: "پرسیارێک، دەنگدانێکی نهێنی، و هەموو دەنگەکان پێکەوە دەکرێنەوە.",
      ar: "سؤال واحد، تصويت سري، وتُكشف كل الأصوات معاً.",
      en: "One question, one secret vote each, and every vote opens at once.",
      tr: "Tek soru, herkesten gizli bir oy ve oyların hep birlikte açılması."
    },
    rules: {
      ku: [
        "هۆست ژوور دروست دەکات و یاری دەست پێ دەکات.",
        "هەموو یاریزانێک هەمان پرسیار دەبینێت.",
        "هەر کەسێک دەنگ بە کەسێکی دیکە دەدات — بۆ خۆی نا.",
        "کاتێک کات تەواو دەبێت هەموو دەنگەکان پێکەوە دەردەکەون."
      ],
      ar: [
        "ينشئ المضيف غرفة ويبدأ اللعبة.",
        "يرى جميع اللاعبين السؤال نفسه.",
        "كل لاعب يصوّت للاعب آخر — لا يمكنه التصويت لنفسه.",
        "عند انتهاء الوقت تُكشف كل الأصوات دفعة واحدة."
      ],
      en: [
        "The host creates a room and starts the game.",
        "Everybody sees the same question.",
        "Each player votes for somebody else — never for themselves.",
        "When the clock runs out every vote is revealed at once."
      ],
      tr: [
        "Host oda kurar ve oyunu başlatır.",
        "Herkes aynı soruyu görür.",
        "Her oyuncu bir başkasına oy verir — kendine oy veremez.",
        "Süre dolunca bütün oylar aynı anda açılır."
      ]
    },
    // Nobody is dealt anything: the question is public and the vote is the
    // only hidden thing, so there are no roles to hand out.
    roles: [],
    settings: [
      {
        type: "number",
        key: "votingSeconds",
        min: 10,
        max: 60,
        label: {
          ku: "کاتی دەنگدان (چرکە)",
          ar: "وقت التصويت (ثواني)",
          en: "Voting Time (seconds)",
          tr: "Oylama Süresi (saniye)"
        }
      },
      {
        type: "number",
        key: "roundCount",
        min: 1,
        max: 20,
        label: {
          ku: "ژمارەی خولەکان",
          ar: "عدد الجولات",
          en: "Rounds",
          tr: "Tur Sayısı"
        }
      },
      {
        // Off means the reveal says how many pointed at somebody and never
        // who. On means the table sees every name. Two different evenings,
        // and the host picks which one before the game starts.
        type: "boolean",
        key: "showVoters",
        label: {
          ku: "دەنگدەران ئاشکرا بکە",
          ar: "إظهار من صوّت لمن",
          en: "Show Who Voted",
          tr: "Kimin Oy Verdiğini Göster"
        }
      }
    ]
  }
] as const

const byId = new Map(GAME_CATALOG.map(g => [g.id, g]))
export function resolveGame(id: string): Game | undefined { return byId.get(id) }
export function defaultGame(): Game { return GAME_CATALOG[0]! }
