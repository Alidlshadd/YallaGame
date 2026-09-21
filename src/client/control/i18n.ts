// Admin copy is deliberately isolated from the public game interface.
export const languages = ["en", "tr", "ar", "ku"] as const
export type Language = (typeof languages)[number]
export const dictionary = {
  overview: ["Overview", "Genel bakış", "نظرة عامة", "پوختە"],
  analytics: ["Analytics", "Analitik", "التحليلات", "شیکاری"],
  history: ["Game history", "Oyun geçmişi", "سجل الألعاب", "مێژووی یاری"],
  players: ["Players", "Oyuncular", "اللاعبون", "یاریزانان"],
  library: ["Game library", "Oyun kütüphanesi", "مكتبة الألعاب", "کتێبخانەی یاری"],
  branding: ["Branding", "Marka", "الهوية البصرية", "ناسنامەی براند"],
  system: ["System", "Sistem", "النظام", "سیستەم"],
  audit: ["Audit log", "Denetim kaydı", "سجل التدقيق", "تۆماری پشکنین"],
  control: ["Control Center", "Kontrol Merkezi", "مركز التحكم", "ناوەندی کۆنترۆڵ"],
  workspace: ["Workspace", "Çalışma alanı", "مساحة العمل", "شوێنی کار"],
  manage: ["Manage your worlds", "Dünyalarını yönet", "إدارة عوالمك", "بەڕێوەبردنی جیهانەکانت"],
  settings: ["Configuration", "Yapılandırma", "الإعدادات", "ڕێکخستن"],
  private: ["Private administration", "Özel yönetim alanı", "إدارة خاصة", "بەڕێوەبردنی تایبەت"],
  administration: ["Administration", "Yönetim", "الإدارة", "بەڕێوەبردن"],
  live: ["Live workspace", "Canlı çalışma alanı", "مساحة عمل متصلة", "شوێنی کاری زیندوو"],
  account: ["Administrator account", "Yönetici hesabı", "حساب المسؤول", "هەژماری بەڕێوەبەر"],
  signOut: ["Sign out", "Çıkış yap", "تسجيل الخروج", "چوونە دەرەوە"],
  signOutDesc: [
    "End your administrator session on this browser.",
    "Bu tarayıcıdaki yönetici oturumunu sonlandır.",
    "إنهاء جلسة المسؤول في هذا المتصفح.",
    "دانیشتنی بەڕێوەبەر لەم وێبگەڕە کۆتایی پێ بهێنە."
  ],
  skip: ["Skip to content", "İçeriğe atla", "انتقل إلى المحتوى", "بڕۆ بۆ ناوەڕۆک"],
  navigation: ["Navigation", "Gezinme", "التنقل", "ڕێنیشاندەر"],
  openMenu: ["Open navigation", "Menüyü aç", "فتح قائمة التنقل", "کردنەوەی لیست"],
  closeMenu: ["Close menu", "Menüyü kapat", "إغلاق القائمة", "داخستنی لیست"],
  language: ["Language", "Dil", "اللغة", "زمان"],
  dark: ["Dark mode", "Koyu tema", "الوضع الداكن", "دۆخی تاریک"],
  light: ["Light mode", "Açık tema", "الوضع الفاتح", "دۆخی ڕووناک"],
  loginLine: [
    "Your worlds. One command center.",
    "Tüm dünyaların. Tek kontrol merkezi.",
    "عوالمك. مركز تحكم واحد.",
    "جیهانەکانت. یەک ناوەندی کۆنترۆڵ."
  ],
  loginHero: [
    "Great games.\nStronger connections.",
    "Harika oyunlar.\nGüçlü bağlar.",
    "ألعاب رائعة.\nروابط أقوى.",
    "یاریی نایاب.\nپەیوەندیی بەهێزتر."
  ],
  loginDesc: [
    "Create a place where every game brings people closer.",
    "Her oyunun insanları yakınlaştırdığı bir dünya oluştur.",
    "اصنع مكاناً يجمع الناس مع كل لعبة.",
    "شوێنێک دروست بکە کە هەر یارییەک خەڵک نزیکتر بکاتەوە."
  ],
  welcome: ["Welcome back", "Tekrar hoş geldin", "مرحباً بعودتك", "بەخێربێیتەوە"],
  username: [
    "Username or email",
    "Kullanıcı adı veya e-posta",
    "اسم المستخدم أو البريد الإلكتروني",
    "ناوی بەکارهێنەر یان ئیمەیڵ"
  ],
  password: ["Password", "Parola", "كلمة المرور", "وشەی نهێنی"],
  showPassword: ["Show password", "Parolayı göster", "إظهار كلمة المرور", "پیشاندانی وشەی نهێنی"],
  hidePassword: ["Hide password", "Parolayı gizle", "إخفاء كلمة المرور", "شاردنەوەی وشەی نهێنی"],
  signIn: ["Sign in", "Giriş yap", "تسجيل الدخول", "چوونە ژوورەوە"],
  signingIn: ["Signing in…", "Giriş yapılıyor…", "جارٍ تسجيل الدخول…", "چوونە ژوورەوە…"],
  restricted: [
    "Restricted to authorized administrators",
    "Yalnızca yetkili yöneticiler içindir",
    "للمسؤولين المصرح لهم فقط",
    "تەنها بۆ بەڕێوەبەرە ڕێگەپێدراوەکان"
  ],
  required: [
    "Please complete this field.",
    "Lütfen bu alanı doldurun.",
    "يرجى إكمال هذا الحقل.",
    "تکایە ئەم خانەیە پڕ بکەرەوە."
  ],
  invalid: [
    "Please check this value.",
    "Lütfen bu değeri kontrol edin.",
    "يرجى التحقق من هذه القيمة.",
    "تکایە ئەم بەهایە بپشکنە."
  ],
  failure: [
    "We couldn’t complete the request. Please try again.",
    "İstek tamamlanamadı. Lütfen yeniden deneyin.",
    "تعذر إكمال الطلب. يرجى المحاولة مجدداً.",
    "داواکارییەکە تەواو نەکرا. تکایە دووبارە هەوڵ بدەوە."
  ],
  credentials: [
    "The username or password is incorrect.",
    "Kullanıcı adı veya parola hatalı.",
    "اسم المستخدم أو كلمة المرور غير صحيحة.",
    "ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە."
  ],
  expired: [
    "Your session has expired. Please sign in again.",
    "Oturumunuz sona erdi. Yeniden giriş yapın.",
    "انتهت جلستك. يرجى تسجيل الدخول مجدداً.",
    "دانیشتنەکەت بەسەرچوو. تکایە دووبارە بچۆ ژوورەوە."
  ],
  forbidden: [
    "Verification failed. Refresh the page and try again.",
    "Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin.",
    "فشل التحقق. حدّث الصفحة وحاول مجدداً.",
    "پشتڕاستکردنەوە سەرکەوتوو نەبوو. پەڕەکە نوێ بکەرەوە."
  ],
  rateLimit: [
    "Too many attempts. Please try again in 15 minutes.",
    "Çok fazla deneme. 15 dakika sonra yeniden deneyin.",
    "محاولات كثيرة. يرجى المحاولة بعد 15 دقيقة.",
    "هەوڵی زۆر. تکایە دوای ١٥ خولەک هەوڵ بدەوە."
  ],
  retry: ["Retry", "Yeniden dene", "إعادة المحاولة", "دووبارە هەوڵدانەوە"],
  cancel: ["Cancel", "İptal", "إلغاء", "هەڵوەشاندنەوە"],
  confirm: ["Confirm change", "Değişikliği onayla", "تأكيد التغيير", "پشتڕاستکردنەوەی گۆڕانکاری"],
  applies: [
    "This change will apply to the public site.",
    "Bu değişiklik herkese açık siteye uygulanacak.",
    "سيُطبق هذا التغيير على الموقع العام.",
    "ئەم گۆڕانکارییە لە ماڵپەڕی گشتی جێبەجێ دەکرێت."
  ],
  overviewTitle: [
    "Workspace overview",
    "Çalışma alanına genel bakış",
    "نظرة عامة على مساحة العمل",
    "پوختەی شوێنی کار"
  ],
  overviewDesc: [
    "A clear view of your community and the games bringing people together.",
    "Topluluğunu ve insanları bir araya getiren oyunları yakından izle.",
    "رؤية واضحة لمجتمعك والألعاب التي تجمع الناس.",
    "دیمەنێکی ڕوونی کۆمەڵگاکەت و ئەو یارییانەی خەڵک کۆدەکەنەوە."
  ],
  dateRange: ["Date range", "Tarih aralığı", "النطاق الزمني", "ماوەی کات"],
  today: ["Today", "Bugün", "اليوم", "ئەمڕۆ"],
  days7: ["Last 7 days", "Son 7 gün", "آخر 7 أيام", "٧ ڕۆژی ڕابردوو"],
  days30: ["Last 30 days", "Son 30 gün", "آخر 30 يوماً", "٣٠ ڕۆژی ڕابردوو"],
  days90: ["Last 90 days", "Son 90 gün", "آخر 90 يوماً", "٩٠ ڕۆژی ڕابردوو"],
  allTime: ["All time", "Tüm zamanlar", "كل الوقت", "هەموو کاتەکان"],
  period: ["Activity period", "Etkinlik dönemi", "فترة النشاط", "ماوەی چالاکی"],
  refresh: ["Refresh data", "Verileri yenile", "تحديث البيانات", "نوێکردنەوەی داتا"],
  refreshed: [
    "Updated {time} · UTC",
    "Güncellendi {time} · UTC",
    "حُدثت {time} · UTC",
    "نوێکرایەوە {time} · UTC"
  ],
  utcNote: [
    "Dates use UTC. Online means active within 90 seconds. Totals cover retained data. Local offline rounds are not counted.",
    "Tarihler UTC kullanır. Çevrimiçi: son 90 saniyede etkin. Toplamlar saklanan veriyi kapsar. Çevrimdışı yerel turlar sayılmaz.",
    "التواريخ بتوقيت UTC. المتصل نشط خلال 90 ثانية. الإجماليات للبيانات المحتفظ بها. الجولات المحلية دون اتصال غير محسوبة.",
    "بەروارەکان بە UTC ـن. ئۆنلاین واتە چالاک لە ٩٠ چرکەی ڕابردوودا. کۆی گشتی داتا پارێزراوەکان دەگرێتەوە. یارییە ئۆفلاینەکان ناژمێردرێن."
  ],
  loading: ["Loading activity…", "Etkinlik yükleniyor…", "جارٍ تحميل النشاط…", "بارکردنی چالاکی…"],
  loadingRecords: ["Loading records…", "Kayıtlar yükleniyor…", "جارٍ تحميل السجلات…", "بارکردنی تۆمارەکان…"],
  opening: [
    "Opening control center…",
    "Kontrol merkezi açılıyor…",
    "جارٍ فتح مركز التحكم…",
    "کردنەوەی ناوەندی کۆنترۆڵ…"
  ],
  visitorsToday: ["Visitors today", "Bugünkü ziyaretçiler", "زوار اليوم", "سەردانکەرانی ئەمڕۆ"],
  visitors7: ["Visitors · 7 days", "Ziyaretçiler · 7 gün", "الزوار · 7 أيام", "سەردانکەران · ٧ ڕۆژ"],
  visitorsTotal: ["Total visitors", "Toplam ziyaretçi", "إجمالي الزوار", "کۆی سەردانکەران"],
  online: ["Online now", "Şu anda çevrimiçi", "متصلون الآن", "ئێستا ئۆنلاین"],
  rooms: ["Rooms today", "Bugünkü odalar", "غرف اليوم", "ژوورەکانی ئەمڕۆ"],
  started: [
    "Games started today",
    "Bugün başlayan oyunlar",
    "ألعاب بدأت اليوم",
    "یارییە دەستپێکراوەکانی ئەمڕۆ"
  ],
  completed: ["Completed today", "Bugün tamamlanan", "مكتملة اليوم", "تەواوکراوەکانی ئەمڕۆ"],
  gamesTotal: ["Total games played", "Toplam oynanan oyun", "إجمالي الألعاب", "کۆی یارییە کراوەکان"],
  average: [
    "Average players · selected period",
    "Ortalama oyuncu · seçili dönem",
    "متوسط اللاعبين · الفترة المحددة",
    "تێکڕای یاریزانان · ماوەی دیاریکراو"
  ],
  popular: [
    "Most played · selected period",
    "En çok oynanan · seçili dönem",
    "الأكثر لعباً · الفترة المحددة",
    "زۆرترین یاریکراو · ماوەی دیاریکراو"
  ],
  uniqueHint: [
    "Distinct visitor identities",
    "Benzersiz ziyaretçi kimlikleri",
    "هويات زوار فريدة",
    "ناسنامەی تاکی سەردانکەران"
  ],
  retainedHint: [
    "Across retained history",
    "Saklanan geçmiş boyunca",
    "ضمن السجل المحتفظ به",
    "لە مێژووی پارێزراودا"
  ],
  onlineHint: [
    "Active in the last 90 seconds",
    "Son 90 saniyede etkin",
    "نشط خلال آخر 90 ثانية",
    "چالاک لە ٩٠ چرکەی ڕابردوودا"
  ],
  roomsHint: [
    "New places to play together",
    "Birlikte oynamak için yeni odalar",
    "مساحات جديدة للعب معاً",
    "شوێنی نوێ بۆ یاریکردن پێکەوە"
  ],
  startsHint: [
    "Server-recorded game starts",
    "Sunucuda kaydedilen başlangıçlar",
    "بدايات ألعاب مسجلة على الخادم",
    "دەستپێکی یاریی تۆمارکراو لە سێرڤەر"
  ],
  completeHint: [
    "Confirmed completed rounds",
    "Tamamlandığı doğrulanan turlar",
    "جولات مكتملة مؤكدة",
    "خولە تەواوکراوە پشتڕاستکراوەکان"
  ],
  averageHint: [
    "Players per recorded game",
    "Kayıtlı oyun başına oyuncu",
    "لاعبون لكل لعبة مسجلة",
    "یاریزان بۆ هەر یارییەکی تۆمارکراو"
  ],
  popularHint: [
    "Your community’s favorite world",
    "Topluluğunun favori dünyası",
    "عالم مجتمعك المفضل",
    "جیهانی دڵخوازی کۆمەڵگاکەت"
  ],
  unique: ["Unique visitors", "Benzersiz ziyaretçiler", "زوار فريدون", "سەردانکەری تاک"],
  starts: ["Game starts", "Oyun başlangıçları", "بدايات الألعاب", "دەستپێکی یارییەکان"],
  rotation: ["Games in rotation", "Oynanan oyunlar", "الألعاب المتداولة", "یارییە چالاکەکان"],
  hours: [
    "Activity by hour · UTC",
    "Saate göre etkinlik · UTC",
    "النشاط حسب الساعة · UTC",
    "چالاکی بە کاتژمێر · UTC"
  ],
  emptyActivity: [
    "No activity in this period.",
    "Bu dönemde etkinlik yok.",
    "لا نشاط في هذه الفترة.",
    "لەم ماوەیەدا چالاکی نییە."
  ],
  selectedVisitors: [
    "{count} unique visitors in the selected period",
    "Seçili dönemde {count} benzersiz ziyaretçi",
    "{count} زائر فريد في الفترة المحددة",
    "{count} سەردانکەری تاک لە ماوەی دیاریکراودا"
  ],
  noData: ["No data yet", "Henüz veri yok", "لا بيانات بعد", "هێشتا داتا نییە"],
  pulse: ["Workspace pulse", "Çalışma alanının nabzı", "نبض مساحة العمل", "لێدانی شوێنی کار"],
  connected: ["System online", "Sistem çevrimiçi", "النظام متصل", "سیستەم ئۆنلاینە"],
  disconnected: [
    "System unreachable",
    "Sisteme ulaşılamıyor",
    "تعذر الوصول إلى النظام",
    "دەست بە سیستەم ناگات"
  ],
  checking: ["Checking system…", "Sistem kontrol ediliyor…", "جارٍ فحص النظام…", "پشکنینی سیستەم…"],
  playerDesc: [
    "Display names from admitted room joins. These are not registered user identities.",
    "Odalara kabul edilen oyuncuların görünen adları. Kayıtlı kullanıcı kimlikleri değildir.",
    "أسماء العرض لمن قُبلوا في الغرف، وليست هويات حسابات مسجلة.",
    "ناوی پیشاندراوی ئەوانەی چوونەتە ژوورەکان؛ ناسنامەی هەژماری تۆمارکراو نین."
  ],
  recordsDesc: [
    "Search and review retained workspace activity.",
    "Saklanan çalışma alanı etkinliklerini ara ve incele.",
    "ابحث في نشاط مساحة العمل المحتفظ به وراجعه.",
    "بگەڕێ و چالاکیی پارێزراوی شوێنی کار بپشکنە."
  ],
  search: ["Search", "Ara", "بحث", "گەڕان"],
  from: ["From", "Başlangıç", "من", "لە"],
  to: ["To", "Bitiş", "إلى", "بۆ"],
  gameFilter: ["Game filter", "Oyun filtresi", "تصفية الألعاب", "پاڵاوتنی یاری"],
  allGames: ["All games", "Tüm oyunlar", "كل الألعاب", "هەموو یارییەکان"],
  apply: ["Apply filters", "Filtreleri uygula", "تطبيق المرشحات", "جێبەجێکردنی پاڵاوتن"],
  datesInvalid: [
    "The end date must be on or after the start date.",
    "Bitiş tarihi başlangıçtan önce olamaz.",
    "يجب ألا يسبق تاريخ النهاية تاريخ البداية.",
    "بەرواری کۆتایی نابێت پێش بەرواری دەستپێک بێت."
  ],
  date: ["Date · UTC", "Tarih · UTC", "التاريخ · UTC", "بەروار · UTC"],
  game: ["Game", "Oyun", "اللعبة", "یاری"],
  room: ["Room reference", "Oda referansı", "مرجع الغرفة", "ئاماژەی ژوور"],
  count: ["Count", "Sayı", "العدد", "ژمارە"],
  duration: ["Duration", "Süre", "المدة", "ماوە"],
  status: ["Status", "Durum", "الحالة", "دۆخ"],
  displayName: ["Display name", "Görünen ad", "اسم العرض", "ناوی پیشاندراو"],
  admin: ["Admin", "Yönetici", "المسؤول", "بەڕێوەبەر"],
  action: ["Action", "İşlem", "الإجراء", "کردار"],
  target: ["Target", "Hedef", "الهدف", "ئامانج"],
  details: ["Details", "Ayrıntılar", "التفاصيل", "وردەکاری"],
  anonymous: ["Local CLI / anonymous", "Yerel CLI / anonim", "واجهة محلية / مجهول", "CLI ناوخۆیی / نەناسراو"],
  emptyRecords: [
    "No records match these filters.",
    "Bu filtrelerle eşleşen kayıt yok.",
    "لا سجلات تطابق هذه المرشحات.",
    "هیچ تۆمارێک لەگەڵ ئەم پاڵاوتنانە ناگونجێت."
  ],
  previous: ["Previous", "Önceki", "السابق", "پێشوو"],
  next: ["Next", "Sonraki", "التالي", "دواتر"],
  pagination: [
    "{count} records · Page {page} of {pages}",
    "{count} kayıt · Sayfa {page} / {pages}",
    "{count} سجل · الصفحة {page} من {pages}",
    "{count} تۆمار · پەڕەی {page} لە {pages}"
  ],
  seconds: ["{count} s", "{count} sn", "{count} ث", "{count} چرکە"],
  minutes: ["{count} minutes", "{count} dakika", "{count} دقيقة", "{count} خولەک"],
  running: ["Running", "Devam ediyor", "قيد التشغيل", "بەردەوامە"],
  complete: ["Completed", "Tamamlandı", "مكتملة", "تەواوکراو"],
  interrupted: ["Interrupted", "Yarıda kaldı", "متوقفة", "پچڕاو"],
  libraryDesc: [
    "Curate your worlds. Update artwork, visibility and the order players discover them.",
    "Dünyalarını düzenle. Görselleri, görünürlüğü ve keşif sırasını güncelle.",
    "نسّق عوالمك. حدّث الصور والظهور وترتيب اكتشاف اللاعبين لها.",
    "جیهانەکانت ڕێک بخە. وێنە، دیاربوون و ڕیزبەندی دۆزینەوەیان نوێ بکەرەوە."
  ],
  visible: ["Visible & available", "Görünür ve kullanılabilir", "ظاهرة ومتاحة", "دیار و بەردەست"],
  disabled: ["Disabled", "Devre dışı", "معطلة", "ناچالاک"],
  order: ["Display order", "Görüntüleme sırası", "ترتيب العرض", "ڕیزبەندی پیشاندان"],
  cover: ["Cover image", "Kapak görseli", "صورة الغلاف", "وێنەی بەرگ"],
  detail: ["Detail image", "Detay görseli", "صورة التفاصيل", "وێنەی وردەکاری"],
  cta: ["CTA background", "Eylem alanı arka planı", "خلفية الدعوة للإجراء", "پاشبنەمای بانگهێشت"],
  section: ["Section background", "Bölüm arka planı", "خلفية القسم", "پاشبنەمای بەش"],
  saveGame: ["Save game", "Oyunu kaydet", "حفظ اللعبة", "پاشەکەوتکردنی یاری"],
  disableConfirm: [
    "Disable {game}?",
    "{game} devre dışı bırakılsın mı?",
    "تعطيل {game}؟",
    "{game} ناچالاک بکرێت؟"
  ],
  gameSaved: ["{game} saved", "{game} kaydedildi", "تم حفظ {game}", "{game} پاشەکەوت کرا"],
  unsaved: [
    "Unsaved changes",
    "Kaydedilmemiş değişiklikler",
    "تغييرات غير محفوظة",
    "گۆڕانکاریی پاشەکەوت نەکراو"
  ],
  saved: [
    "All changes saved",
    "Tüm değişiklikler kaydedildi",
    "كل التغييرات محفوظة",
    "هەموو گۆڕانکارییەکان پاشەکەوت کران"
  ],
  saving: ["Saving…", "Kaydediliyor…", "جارٍ الحفظ…", "پاشەکەوتکردن…"],
  upload: ["Upload {label}", "{label} yükle", "تحميل {label}", "بارکردنی {label}"],
  preview: ["{label} preview", "{label} önizlemesi", "معاينة {label}", "پێشبینینی {label}"],
  uploadHelp: [
    "Choose or drop an image",
    "Görsel seç veya sürükle",
    "اختر صورة أو اسحبها هنا",
    "وێنە هەڵبژێرە یان ڕایبکێشە ئێرە"
  ],
  uploadLimit: [
    "Use JPEG, PNG or WebP up to 5 MiB",
    "En fazla 5 MiB JPEG, PNG veya WebP kullanın",
    "استخدم JPEG أو PNG أو WebP بحجم حتى 5 MiB",
    "JPEG، PNG یان WebP تا 5 MiB بەکاربهێنە"
  ],
  imageLimits: [
    "JPEG, PNG or WebP · up to 5 MiB · maximum 4096 × 4096",
    "JPEG, PNG veya WebP · en fazla 5 MiB · en çok 4096 × 4096",
    "JPEG أو PNG أو WebP · حتى 5 MiB · بحد أقصى 4096 × 4096",
    "JPEG، PNG یان WebP · تا 5 MiB · زۆرترین 4096 × 4096"
  ],
  newPreview: [
    "New preview · unsaved",
    "Yeni önizleme · kaydedilmedi",
    "معاينة جديدة · غير محفوظة",
    "پێشبینینی نوێ · پاشەکەوت نەکراو"
  ],
  restore: ["Restore default", "Varsayılana dön", "استعادة الافتراضي", "گەڕانەوە بۆ بنەڕەت"],
  restoreConfirm: [
    "Restore default {label}?",
    "{label} varsayılana döndürülsün mü?",
    "استعادة {label} الافتراضية؟",
    "{label} بگەڕێتەوە بۆ بنەڕەت؟"
  ],
  defaultSelected: [
    "Default selected · save to apply",
    "Varsayılan seçildi · uygulamak için kaydet",
    "تم اختيار الافتراضي · احفظ للتطبيق",
    "بنەڕەت هەڵبژێردرا · بۆ جێبەجێکردن پاشەکەوت بکە"
  ],
  defaultAsset: ["Bundled default", "Paketlenmiş varsayılan", "الافتراضي المرفق", "بنەڕەتی هاوپێچ"],
  uploaded: ["Uploaded", "Yüklendi", "تم التحميل", "بارکرا"],
  uploading: ["Uploading…", "Yükleniyor…", "جارٍ التحميل…", "بارکردن…"],
  uploadFailed: [
    "Image upload failed. Check the format and size, then retry.",
    "Görsel yüklenemedi. Biçim ve boyutu kontrol edip yeniden deneyin.",
    "فشل تحميل الصورة. تحقق من الصيغة والحجم وحاول مجدداً.",
    "وێنە بار نەکرا. جۆر و قەبارەکە بپشکنە و دووبارە هەوڵ بدەوە."
  ],
  brandTitle: ["Brand identity", "Marka kimliği", "هوية العلامة", "ناسنامەی براند"],
  brandDesc: [
    "Keep every touchpoint unmistakably yours. Empty fields restore the bundled defaults.",
    "Her ayrıntıya markanı yansıt. Boş alanlar paketlenmiş varsayılanları geri getirir.",
    "اجعل كل تفصيلة تعبّر عنك. الحقول الفارغة تستعيد القيم الافتراضية.",
    "هەر وردەکارییەک بە هی خۆت بکە. خانە بەتاڵەکان بەهای بنەڕەت دەگەڕێننەوە."
  ],
  siteName: ["Site name", "Site adı", "اسم الموقع", "ناوی ماڵپەڕ"],
  description: ["Short description", "Kısa açıklama", "وصف قصير", "وەسفی کورت"],
  footer: ["Footer text", "Alt bilgi metni", "نص التذييل", "دەقی خوارەوە"],
  mainLogo: ["Main logo", "Ana logo", "الشعار الرئيسي", "لۆگۆی سەرەکی"],
  darkLogo: [
    "Dark background logo",
    "Koyu arka plan logosu",
    "شعار الخلفية الداكنة",
    "لۆگۆی پاشبنەمای تاریک"
  ],
  favicon: ["Favicon", "Site simgesi", "أيقونة الموقع", "ئایکۆنی ماڵپەڕ"],
  og: ["Open Graph image", "Paylaşım görseli", "صورة المشاركة", "وێنەی هاوبەشکردن"],
  saveBrand: [
    "Save brand identity",
    "Marka kimliğini kaydet",
    "حفظ هوية العلامة",
    "پاشەکەوتکردنی ناسنامەی براند"
  ],
  publishBrand: [
    "Publish brand changes?",
    "Marka değişiklikleri yayımlansın mı?",
    "نشر تغييرات العلامة؟",
    "گۆڕانکاریی براند بڵاو بکرێتەوە؟"
  ],
  brandSaved: [
    "Brand identity saved",
    "Marka kimliği kaydedildi",
    "تم حفظ هوية العلامة",
    "ناسنامەی براند پاشەکەوت کرا"
  ],
  livePreview: [
    "Live brand preview",
    "Canlı marka önizlemesi",
    "معاينة مباشرة للعلامة",
    "پێشبینینی زیندووی براند"
  ],
  previewNote: [
    "Preview only. Save to publish your changes.",
    "Yalnızca önizleme. Yayımlamak için kaydedin.",
    "معاينة فقط. احفظ لنشر تغييراتك.",
    "تەنها پێشبینینە. بۆ بڵاوکردنەوە پاشەکەوت بکە."
  ],
  systemTitle: ["System status", "Sistem durumu", "حالة النظام", "دۆخی سیستەم"],
  systemDesc: [
    "Read-only health and runtime information.",
    "Salt okunur sağlık ve çalışma bilgileri.",
    "معلومات الصحة والتشغيل للقراءة فقط.",
    "زانیاری تەندروستی و کارکردن تەنها بۆ خوێندنەوە."
  ],
  version: ["Application version", "Uygulama sürümü", "إصدار التطبيق", "وەشانی بەرنامە"],
  node: ["Node.js", "Node.js", "Node.js", "Node.js"],
  uptime: ["Node uptime", "Node çalışma süresi", "مدة تشغيل Node", "ماوەی کارکردنی Node"],
  database: ["Database", "Veritabanı", "قاعدة البيانات", "بنکەی داتا"],
  healthCheck: ["Last health check", "Son sağlık kontrolü", "آخر فحص للصحة", "دوا پشکنینی تەندروستی"],
  notChecked: ["Not yet checked", "Henüz kontrol edilmedi", "لم يُفحص بعد", "هێشتا نەپسکنراوە"],
  disk: ["Disk available", "Kullanılabilir disk", "مساحة القرص المتاحة", "بۆشایی دیسکی بەردەست"],
  unavailable: ["Unavailable", "Kullanılamıyor", "غير متاح", "بەردەست نییە"],
  loginAction: ["Signed in", "Giriş yapıldı", "تسجيل دخول", "چوونە ژوورەوە"],
  logoutAction: ["Signed out", "Çıkış yapıldı", "تسجيل خروج", "چوونە دەرەوە"],
  loginFailed: ["Sign-in failed", "Giriş başarısız", "فشل تسجيل الدخول", "چوونە ژوورەوە سەرکەوتوو نەبوو"],
  gameUpdated: ["Game updated", "Oyun güncellendi", "تحديث لعبة", "یاری نوێکرایەوە"],
  brandUpdated: ["Brand updated", "Marka güncellendi", "تحديث العلامة", "براند نوێکرایەوە"],
  imageUploaded: ["Image uploaded", "Görsel yüklendi", "تحميل صورة", "وێنە بارکرا"],
  avatars: ["Avatars", "Avatarlar", "الصور الرمزية", "ئاڤاتارەکان"],
  avatarsDesc: [
    "Add, edit or hide the characters players can pick when they join a room.",
    "Oyuncuların odaya katılırken seçebileceği karakterleri ekle, düzenle veya gizle.",
    "أضف الشخصيات التي يختارها اللاعبون عند الانضمام إلى غرفة أو عدّلها أو أخفها.",
    "ئەو کارەکتەرانەی یاریزانان لە کاتی چوونە ژوورەوەی ژوورێکدا هەڵدەبژێرن زیاد بکە، دەستکاری بکە یان بیشارەوە."
  ],
  addAvatar: ["Add avatar", "Avatar ekle", "إضافة صورة رمزية", "زیادکردنی ئاڤاتار"],
  newAvatar: ["New avatar", "Yeni avatar", "صورة رمزية جديدة", "ئاڤاتاری نوێ"],
  builtIn: ["Built-in", "Yerleşik", "مدمجة", "بنەڕەتی"],
  custom: ["Custom", "Özel", "مخصصة", "تایبەت"],
  nameEn: ["Name (English)", "İsim (İngilizce)", "الاسم (إنجليزي)", "ناو (ئینگلیزی)"],
  nameTr: ["Name (Turkish)", "İsim (Türkçe)", "الاسم (تركي)", "ناو (تورکی)"],
  nameAr: ["Name (Arabic)", "İsim (Arapça)", "الاسم (عربي)", "ناو (عەرەبی)"],
  nameKu: ["Name (Kurdish)", "İsim (Kürtçe)", "الاسم (كردي)", "ناو (کوردی)"],
  avatarImage: ["Avatar image", "Avatar görseli", "صورة الأفاتار", "وێنەی ئاڤاتار"],
  saveAvatar: ["Save avatar", "Avatarı kaydet", "حفظ الصورة الرمزية", "پاشەکەوتکردنی ئاڤاتار"],
  avatarSaved: ["{avatar} saved", "{avatar} kaydedildi", "تم حفظ {avatar}", "{avatar} پاشەکەوت کرا"],
  avatarCreated: [
    "Avatar added",
    "Avatar eklendi",
    "تمت إضافة الصورة الرمزية",
    "ئاڤاتار زیاد کرا"
  ],
  hideAvatarConfirm: [
    "Hide {avatar}? Players won't be able to pick it anymore.",
    "{avatar} gizlensin mi? Oyuncular artık bunu seçemez.",
    "إخفاء {avatar}؟ لن يتمكن اللاعبون من اختيارها بعد الآن.",
    "{avatar} بشاردرێتەوە؟ یاریزانان چیتر ناتوانن هەڵیبژێرن."
  ],
  deleteAvatar: ["Delete", "Sil", "حذف", "سڕینەوە"],
  deleteAvatarConfirm: [
    "Permanently delete {avatar}? This can't be undone.",
    "{avatar} kalıcı olarak silinsin mi? Bu geri alınamaz.",
    "حذف {avatar} نهائياً؟ لا يمكن التراجع عن هذا.",
    "{avatar} بە یەکجاری بسڕدرێتەوە؟ ناتوانرێت بگەڕێندرێتەوە."
  ],
  avatarDeleted: ["Avatar deleted", "Avatar silindi", "تم حذف الصورة الرمزية", "ئاڤاتار سڕایەوە"]
} as const satisfies Record<string, readonly [string, string, string, string]>

export type Key = keyof typeof dictionary
export type Copy = string | (() => string)
export let language: Language = languages.includes(document.documentElement.lang as Language)
  ? (document.documentElement.lang as Language)
  : "en"
const bindings = new Map<Node, { read: () => string; attribute?: string }>()
export function t(key: Key, params: Record<string, Copy | number> = {}): () => string {
  return () =>
    dictionary[key][languages.indexOf(language)]!.replace(/\{(\w+)\}/g, (_, name: string) => {
      const value = params[name]
      return typeof value === "function" ? value() : String(value ?? "")
    })
}
export function bind(target: Node, copy: Copy, attribute?: string): void {
  const read = typeof copy === "function" ? copy : () => copy
  if (attribute && target instanceof Element) {
    // Multiple translated attributes are separate bindings on otherwise inert Attr nodes.
    target.setAttribute(attribute, read())
    const attr = target.getAttributeNode(attribute)!
    bindings.set(attr, { read })
  } else {
    target.textContent = read()
    bindings.set(target, { read })
  }
}
export function textNode(copy: Copy): Text {
  const text = document.createTextNode("")
  bind(text, copy)
  return text
}
export function updateTranslations(): void {
  for (const [target, { read }] of bindings) {
    const connected = target instanceof Attr ? target.ownerElement?.isConnected : target.isConnected
    if (!connected) bindings.delete(target)
    else target.textContent = read()
  }
}
export function setLanguage(value: Language): void {
  language = value
  document.documentElement.lang = value
  document.documentElement.dir = value === "ar" || value === "ku" ? "rtl" : "ltr"
  try {
    localStorage.setItem("yalla-admin-language", value)
  } catch {
    /* Storage may be disabled. */
  }
  updateTranslations()
  document.dispatchEvent(new Event("admin-language"))
}
// Prune detached page/notification bindings without keeping discarded trees alive.
new MutationObserver(() => {
  for (const target of bindings.keys()) {
    if (!(target instanceof Attr ? target.ownerElement?.isConnected : target.isConnected))
      bindings.delete(target)
  }
}).observe(document.body, { childList: true, subtree: true })

export function number(value: number): string {
  return new Intl.NumberFormat(language === "ku" ? "ckb" : language, { maximumFractionDigits: 1 }).format(
    value
  )
}
export function date(value: number, timeOnly = false): string {
  return new Intl.DateTimeFormat(language === "ku" ? "ckb" : language, {
    timeZone: "UTC",
    ...(timeOnly ? {} : ({ year: "numeric", month: "short", day: "numeric" } as const)),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(value)
}
