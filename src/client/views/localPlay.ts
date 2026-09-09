import type { Game, LangCode, Role } from "@shared/types.js"
import type { RoleAssignedPayload } from "@shared/events.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { goBack, setView, setViewBackHandler } from "../router.js"
import { confirmDialog } from "../ui/confirm.js"
import { syncWakeLock } from "../services/wakeLock.js"
import { vibrate } from "../ui/haptics.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
import { getGames } from "./home.js"
import { worldCoverPath } from "../data/assets.js"
import { buildRolePool, assignRolesLocally, type LocalAssignment } from "../domain/local-roles.js"
import { SPY_WORD_CATEGORIES, pickSpyWordWithCategory } from "../domain/spy-data.js"
import { getCategoryByKey } from "../data/word-categories.js"
import {
  WHO_AM_I_CATEGORIES,
  RANDOM_MIX_KEY,
  pickWhoAmIWord,
  resolveCategoryLabel
} from "../domain/who-am-i-data.js"
import {
  FOOTBALL_CLUB_OPTIONS,
  FOOTBALL_DIFFICULTY_OPTIONS,
  FOOTBALL_EUROPE_LEAGUE_KEYS,
  FOOTBALL_LEAGUE_OPTIONS,
  FOOTBALL_MAX_HINTS,
  FOOTBALL_ROUND_SECONDS,
  FOOTBALL_STAR_CATEGORY_OPTIONS,
  footballLeagueLabel,
  pickFootballCards,
  type FootballCategoryKey,
  type FootballClubKey,
  type FootballDifficulty,
  type FootballLeagueKey,
  type FootballPlayerCard,
  type FootballStarCategoryKey
} from "../domain/football-player-data.js"
import "../themes/local-play.css"

const STORAGE_KEY = "role-room:local-play"
const SPY_GAME_ID = "spy-game"
const WHO_AM_I_GAME_ID = "who-am-i"
const FOOTBALL_GAME_ID = "football-player-guess"
const MOST_LIKELY_TO_GAME_ID = "most-likely-to"
/* After the unified word-categories.ts refactor: pick 4 broad categories
   that exist in the shared file and produce playable spy rounds out of the
   box. "iraq-kurdistan-cities" gives the audience a local hook. */
const DEFAULT_SPY_CATEGORIES = ["iraq-kurdistan-cities", "food-drinks", "jobs", "objects"]
const WHO_AM_I_RECENT_LIMIT = 8

type Step =
  | "game"
  | "names"
  | "settings"
  | "reveal"
  | "adminReview"
  | "starter"
  | "discussion"
  | "vote"
  | "result"
  | "done"
  | "whoSetup"
  | "whoCountdown"
  | "whoRound"
  | "whoTimeUp"
  | "footballTurn"
  | "footballSummary"
type SpyResult = "citizens" | "spies"

interface FootballAssignment {
  name: string
  card: FootballPlayerCard
  hintsUsed: number
  solved: boolean
}

interface LocalState {
  step: Step
  gameId: string | null
  playerNames: string[]
  settings: Record<string, number | boolean>
  assignments: LocalAssignment[]
  currentRevealIndex: number
  spyCategoryIds: string[]
  customSpyWords: string
  spyWord: string | null
  spyHintCategory: Record<LangCode, string> | null
  roundEndsAt: number | null
  voteAttemptsLeft: number
  selectedSuspect: string | null
  lastVoteMessage: string | null
  result: SpyResult | null
  starterName: string | null
  whoCategoryKey: string
  whoCurrentWord: string | null
  whoCurrentWordCategory: string | null
  whoRecentWords: string[]
  footballCategoryKey: FootballCategoryKey
  footballLeagueKey: FootballLeagueKey
  footballStarCategoryKey: FootballStarCategoryKey
  footballClubKey: FootballClubKey
  footballDifficulty: FootballDifficulty
  footballRoundSeconds: number
  footballHintsEnabled: boolean
  footballMaxHints: number
  footballDuplicateCards: boolean
  footballAssignments: FootballAssignment[]
  footballCurrentIndex: number
  footballMessage: string | null
}

let state: LocalState = freshState()
let presetGameId: string | null = null

function freshState(): LocalState {
  return {
    step: "game",
    gameId: null,
    playerNames: [],
    settings: {},
    assignments: [],
    currentRevealIndex: 0,
    spyCategoryIds: [...DEFAULT_SPY_CATEGORIES],
    customSpyWords: "",
    spyWord: null,
    spyHintCategory: null,
    roundEndsAt: null,
    voteAttemptsLeft: 1,
    selectedSuspect: null,
    lastVoteMessage: null,
    result: null,
    starterName: null,
    whoCategoryKey: RANDOM_MIX_KEY,
    whoCurrentWord: null,
    whoCurrentWordCategory: null,
    whoRecentWords: [],
    footballCategoryKey: "mixed",
    footballLeagueKey: "mixed",
    footballStarCategoryKey: "all",
    footballClubKey: "all",
    footballDifficulty: "easy",
    footballRoundSeconds: 60,
    footballHintsEnabled: true,
    footballMaxHints: 1,
    footballDuplicateCards: false,
    footballAssignments: [],
    footballCurrentIndex: 0,
    footballMessage: null
  }
}

function saveState(): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* */ }
}

function loadState(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    // No stored round means a fresh start: without this reset the module kept
    // the previous round in memory and re-entering Local Play dropped the user
    // back into the middle of a game they had already left.
    state = raw ? { ...freshState(), ...JSON.parse(raw) } : freshState()
  } catch { state = freshState() }
  migrateCategoryKeys()
}

/**
 * Map legacy category keys to their new equivalents after the unified
 * word-categories.ts refactor. Anything that has neither a remap nor a
 * matching current key is dropped — and if the resulting list is empty,
 * the Spy game falls back to its safe defaults so the user isn't stuck
 * with an unrunnable selection. Who Am I falls back to Random Mix.
 */
function migrateCategoryKeys(): void {
  const SPY_KEY_REMAP: Record<string, string> = {
    food: "food-drinks",
    school: "school-items",
    home: "home-items",
    entertainment: "movies-entertainment",
    city: "iraq-kurdistan-cities",
    famous_places: "famous-places",
    daily_actions: "movies-entertainment",
    famous: "movies-entertainment"
  }

  const validSpyIds = new Set(SPY_WORD_CATEGORIES.map(c => c.id))
  const remappedSpy: string[] = []
  for (const id of state.spyCategoryIds) {
    const next = SPY_KEY_REMAP[id] ?? id
    if (validSpyIds.has(next) && !remappedSpy.includes(next)) remappedSpy.push(next)
  }
  if (remappedSpy.length === 0) {
    state.spyCategoryIds = [...DEFAULT_SPY_CATEGORIES].filter(id => validSpyIds.has(id))
  } else {
    state.spyCategoryIds = remappedSpy
  }

  const WHO_KEY_REMAP: Record<string, string> = {
    famous: "movies-entertainment"
  }
  if (state.whoCategoryKey && state.whoCategoryKey !== RANDOM_MIX_KEY) {
    const next = WHO_KEY_REMAP[state.whoCategoryKey] ?? state.whoCategoryKey
    const valid = WHO_AM_I_CATEGORIES.some(c => c.key === next)
    state.whoCategoryKey = valid ? next : RANDOM_MIX_KEY
  }
}

function clearLocalState(): void {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* */ }
  state = freshState()
}

function findGame(id: string | null): Game | undefined {
  if (!id) return undefined
  return getGames().find(g => g.id === id)
}

function isSpyGame(game: Game): boolean {
  return game.id === SPY_GAME_ID
}

function isWhoAmIGame(game: Game): boolean {
  return game.id === WHO_AM_I_GAME_ID
}

function isFootballGame(game: Game): boolean {
  return game.id === FOOTBALL_GAME_ID
}

function buildErrorMessage(container: HTMLElement, text: string): void {
  const existing = container.querySelector(".lp-error") as HTMLElement | null
  if (existing) { existing.textContent = text; return }
  container.appendChild(el("div", { class: "lp-error" }, [text]))
}

function settingNumber(key: string, fallback: number): number {
  const value = Number(state.settings[key] ?? fallback)
  return Number.isFinite(value) ? value : fallback
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

const SPY_TEXT = {
  en: {
    wordForPlayer: "Secret word",
    wordForSpy: "The secret word is hidden from you. Blend in and avoid suspicion.",
    spyHint: "Your hint — the word's category:",
    citizensWin: "The players found the spy.",
    spiesWin: "The spy won the game.",
    starterTitle: "Who asks first?",
    starterIs: "starts the round with the first question.",
    startDiscussion: "Start Discussion",
    discussionTitle: "Discussion Time",
    discussionHint: "Ask each other questions without revealing the word.",
    firstQuestion: "First question",
    activeTopics: "Active topics",
    endDiscussion: "End Discussion",
    voteTitle: "Who is the Spy?",
    voteHint: "Choose one suspect. Attempts left",
    sendVote: "Send Vote",
    chooseSuspect: "Choose a suspected spy.",
    wrongGuess: "Wrong guess. Attempts left",
    spiesLabel: "Spies",
    newGameSame: "New Game (Same Group)",
    settingsLabel: "Settings",
    backHome: "Back to Home",
    categoriesTitle: "Word categories",
    categoriesSub: "Pick one or more topics. Normal players see the secret word; spies do not.",
    customWords: "Custom words"
  },
  tr: {
    wordForPlayer: "Gizli kelime",
    wordForSpy: "Gizli kelime sana gösterilmiyor. Sorulara uyum sağla ve fark edilme.",
    spyHint: "İpucun — kelimenin kategorisi:",
    citizensWin: "Oyuncular casusu buldu.",
    spiesWin: "Casus oyunu kazandı.",
    starterTitle: "İlk soruyu kim soracak?",
    starterIs: "ilk soruyu sorarak turu başlatır.",
    startDiscussion: "Tartışmayı Başlat",
    discussionTitle: "Tartışma Zamanı",
    discussionHint: "Kelimeyi açık etmeden birbirinize sorular sorun.",
    firstQuestion: "İlk soru",
    activeTopics: "Aktif konular",
    endDiscussion: "Tartışmayı Bitir",
    voteTitle: "Casus Kim?",
    voteHint: "Bir şüpheli seç. Kalan hak",
    sendVote: "Oyu Gönder",
    chooseSuspect: "Şüpheli bir casus seç.",
    wrongGuess: "Yanlış tahmin. Kalan hak",
    spiesLabel: "Casuslar",
    newGameSame: "Yeni Oyun (Aynı Grup)",
    settingsLabel: "Ayarlar",
    backHome: "Ana Sayfaya Dön",
    categoriesTitle: "Kelime kategorileri",
    categoriesSub: "Bir veya daha fazla konu seç. Normal oyuncular gizli kelimeyi görür; casuslar görmez.",
    customWords: "Özel kelimeler"
  },
  ar: {
    wordForPlayer: "الكلمة السرية",
    wordForSpy: "الكلمة السرية مخفية عنك. اندمج مع الباقين ولا تكشف نفسك.",
    spyHint: "تلميحك — فئة الكلمة:",
    citizensWin: "اللاعبون اكتشفوا الجاسوس.",
    spiesWin: "الجاسوس فاز باللعبة.",
    starterTitle: "من يسأل أولا؟",
    starterIs: "يبدأ الجولة بالسؤال الأول.",
    startDiscussion: "ابدأ النقاش",
    discussionTitle: "وقت النقاش",
    discussionHint: "اطرحوا الأسئلة على بعضكم دون كشف الكلمة.",
    firstQuestion: "السؤال الأول",
    activeTopics: "المواضيع الفعالة",
    endDiscussion: "إنهاء النقاش",
    voteTitle: "من هو الجاسوس؟",
    voteHint: "اختر مشتبها به. المحاولات المتبقية",
    sendVote: "إرسال التصويت",
    chooseSuspect: "اختر جاسوسا مشتبها به.",
    wrongGuess: "تخمين خاطئ. المحاولات المتبقية",
    spiesLabel: "الجواسيس",
    newGameSame: "لعبة جديدة (نفس المجموعة)",
    settingsLabel: "الإعدادات",
    backHome: "العودة للرئيسية",
    categoriesTitle: "فئات الكلمات",
    categoriesSub: "اختر موضوعا أو أكثر. اللاعبون العاديون يرون الكلمة السرية؛ الجواسيس لا يرونها.",
    customWords: "كلمات مخصصة"
  },
  ku: {
    wordForPlayer: "وشەی نهێنی",
    wordForSpy: "وشە نهێنییەکە لێت شاراوەیە. لەگەڵ یاریزانانی تردا تێکەڵ بە و خۆت دەرمەخە.",
    spyHint: "ئاماژەکەت — پۆلی وشەکە:",
    citizensWin: "یاریزانان سیخوڕیان دۆزییەوە.",
    spiesWin: "سیخوڕ یارییەکەی بردەوە.",
    starterTitle: "کێ یەکەم پرسیار دەکات؟",
    starterIs: "بە یەکەم پرسیار خولەکە دەست پێ دەکات.",
    startDiscussion: "دەستپێکردنی گفتوگۆ",
    discussionTitle: "کاتی گفتوگۆ",
    discussionHint: "پرسیار لە یەکتری بکەن بەبێ ئاشکراکردنی وشەکە.",
    firstQuestion: "یەکەم پرسیار",
    activeTopics: "بابەتە چالاکەکان",
    endDiscussion: "کۆتایی گفتوگۆ",
    voteTitle: "سیخوڕ کێیە؟",
    voteHint: "گومانلێکراوێک هەڵبژێرە. هەوڵی ماوە",
    sendVote: "ناردنی دەنگ",
    chooseSuspect: "سیخوڕێکی گومانلێکراو هەڵبژێرە.",
    wrongGuess: "پێشبینی هەڵە. هەوڵی ماوە",
    spiesLabel: "سیخوڕەکان",
    newGameSame: "یاری نوێ (هەمان گرووپ)",
    settingsLabel: "ڕێکخستنەکان",
    backHome: "گەڕانەوە بۆ سەرەکی",
    categoriesTitle: "پۆلەکانی وشە",
    categoriesSub: "یەک یان چەند بابەتێک هەڵبژێرە. یاریزانە ئاساییەکان وشە نهێنییەکە دەبینن؛ سیخوڕەکان نایبینن.",
    customWords: "وشەی تایبەت"
  }
} as const

type SpyTextKey = keyof typeof SPY_TEXT.en

function spyText(lang: LangCode, key: SpyTextKey): string {
  return SPY_TEXT[lang]?.[key] ?? SPY_TEXT.en[key]
}

/* Shared setup-screen strings (used by every local game). */
const SETUP_TEXT = {
  en: {
    step: (n: number, total: number) => `Setup · Step ${n} of ${total}`,
    localStep: (n: number, total: number) => `Local Play · Step ${n} of ${total}`,
    chooseGame: "Choose Your Game",
    chooseGameSub: "Pick a game everyone wants to play",
    minPlayers: (min: number) => `Minimum ${min} players`,
    playerNames: "Player Names",
    playerNamesSub: (title: string, min: number) => `Enter the players joining this ${title} session (min ${min}).`,
    playerPlaceholder: (n: number) => `Player ${n}`,
    addPlayer: "+ Add Player",
    continueBtn: "Continue ->",
    backBtn: "<- Back",
    needAtLeast: (min: number, have: number) => `Need at least ${min} players (you have ${have})`,
    duplicateNames: (names: string) => `Duplicate names: ${names}`,
    spySetup: "Spy Setup",
    configure: "Configure",
    customiseSub: (count: number, title: string) => `${count} players · customise ${title}`,
    startSpy: "Start Spy Game",
    assignRoles: "Assign Roles",
    tooManySpies: "Too many spies for this player count.",
    noWords: "Choose at least one word category or add custom words."
  },
  tr: {
    step: (n: number, total: number) => `Kurulum · Adım ${n} / ${total}`,
    localStep: (n: number, total: number) => `Yerel Oyun · Adım ${n} / ${total}`,
    chooseGame: "Oyununu Seç",
    chooseGameSub: "Herkesin oynamak istediği bir oyun seç",
    minPlayers: (min: number) => `En az ${min} oyuncu`,
    playerNames: "Oyuncu İsimleri",
    playerNamesSub: (title: string, min: number) => `${title} oturumuna katılan oyuncuları yaz (en az ${min}).`,
    playerPlaceholder: (n: number) => `Oyuncu ${n}`,
    addPlayer: "+ Oyuncu Ekle",
    continueBtn: "Devam ->",
    backBtn: "<- Geri",
    needAtLeast: (min: number, have: number) => `En az ${min} oyuncu gerekli (şu an ${have})`,
    duplicateNames: (names: string) => `Aynı isimler: ${names}`,
    spySetup: "Casus Kurulumu",
    configure: "Ayarla",
    customiseSub: (count: number, title: string) => `${count} oyuncu · ${title} ayarları`,
    startSpy: "Casus Oyununu Başlat",
    assignRoles: "Rolleri Dağıt",
    tooManySpies: "Bu oyuncu sayısı için casus sayısı çok fazla.",
    noWords: "En az bir kelime kategorisi seç veya özel kelime ekle."
  },
  ar: {
    step: (n: number, total: number) => `الإعداد · الخطوة ${n} من ${total}`,
    localStep: (n: number, total: number) => `اللعب المحلي · الخطوة ${n} من ${total}`,
    chooseGame: "اختر لعبتك",
    chooseGameSub: "اختر لعبة يريد الجميع لعبها",
    minPlayers: (min: number) => `${min} لاعبين على الأقل`,
    playerNames: "أسماء اللاعبين",
    playerNamesSub: (title: string, min: number) => `أدخل أسماء اللاعبين في جلسة ${title} (على الأقل ${min}).`,
    playerPlaceholder: (n: number) => `اللاعب ${n}`,
    addPlayer: "+ إضافة لاعب",
    continueBtn: "متابعة ->",
    backBtn: "<- رجوع",
    needAtLeast: (min: number, have: number) => `تحتاج ${min} لاعبين على الأقل (لديك ${have})`,
    duplicateNames: (names: string) => `أسماء مكررة: ${names}`,
    spySetup: "إعداد الجاسوس",
    configure: "الإعدادات",
    customiseSub: (count: number, title: string) => `${count} لاعبين · إعدادات ${title}`,
    startSpy: "ابدأ لعبة الجاسوس",
    assignRoles: "توزيع الأدوار",
    tooManySpies: "عدد الجواسيس كبير جدا لهذا العدد من اللاعبين.",
    noWords: "اختر فئة كلمات واحدة على الأقل أو أضف كلمات مخصصة."
  },
  ku: {
    step: (n: number, total: number) => `ڕێکخستن · هەنگاوی ${n} لە ${total}`,
    localStep: (n: number, total: number) => `یاری ناوخۆیی · هەنگاوی ${n} لە ${total}`,
    chooseGame: "یارییەکەت هەڵبژێرە",
    chooseGameSub: "یارییەک هەڵبژێرە کە هەمووان دەیانەوێت",
    minPlayers: (min: number) => `لانی کەم ${min} یاریزان`,
    playerNames: "ناوی یاریزانەکان",
    playerNamesSub: (title: string, min: number) => `ناوی یاریزانەکانی ${title} بنووسە (لانی کەم ${min}).`,
    playerPlaceholder: (n: number) => `یاریزان ${n}`,
    addPlayer: "+ یاریزان زیاد بکە",
    continueBtn: "بەردەوامبوون ->",
    backBtn: "<- گەڕانەوە",
    needAtLeast: (min: number, have: number) => `لانی کەم ${min} یاریزان پێویستە (ئێستا ${have})`,
    duplicateNames: (names: string) => `ناوی دووبارە: ${names}`,
    spySetup: "ڕێکخستنی سیخوڕ",
    configure: "ڕێکخستن",
    customiseSub: (count: number, title: string) => `${count} یاریزان · ڕێکخستنی ${title}`,
    startSpy: "دەستپێکردنی یاری سیخوڕ",
    assignRoles: "دابەشکردنی ڕۆڵەکان",
    tooManySpies: "ژمارەی سیخوڕەکان زۆرە بۆ ئەم ژمارە یاریزانە.",
    noWords: "لانی کەم پۆلێکی وشە هەڵبژێرە یان وشەی تایبەت زیاد بکە."
  }
} as const

type SetupText = (typeof SETUP_TEXT)["en"]

function setupText(lang: LangCode): SetupText {
  return (SETUP_TEXT[lang] ?? SETUP_TEXT.en) as SetupText
}

/* Football local-play strings. */
const FOOTBALL_TEXT = {
  en: {
    cardHeader: "Football Card",
    noTime: "NO TIME",
    timeUp: (n: string) => `Time is up. The card was ${n}.`,
    noHints: "No hints used",
    genericCard: "Football Player Card",
    playersCard: (n: string) => `${n}'s card`,
    showHint: "Show Hint",
    hintShown: (n: number) => `Hint ${n} shown.`,
    solvedTick: "Solved ✓",
    markSolved: "Mark as Solved",
    markedSolved: (n: string) => `${n} marked as solved.`,
    cardWord: "Card",
    newCard: "New Card",
    finishGame: "Finish Game",
    nextPlayer: "Next Player",
    finalScore: "Final Score",
    scoreLine: (s: number, total: number, title: string) => `${s} of ${total} players guessed correctly in ${title}.`,
    newCards: "New Cards",
    positions: { goalkeeper: "Goalkeeper", defender: "Defender", midfielder: "Midfielder", forward: "Forward" },
    difficulties: { easy: "Easy", medium: "Medium", hard: "Hard" }
  },
  tr: {
    cardHeader: "Futbolcu Kartı",
    noTime: "SÜRESİZ",
    timeUp: (n: string) => `Süre doldu. Kart: ${n}.`,
    noHints: "İpucu kullanılmadı",
    genericCard: "Futbolcu Kartı",
    playersCard: (n: string) => `${n} kartı`,
    showHint: "İpucu Göster",
    hintShown: (n: number) => `${n}. ipucu gösterildi.`,
    solvedTick: "Bilindi ✓",
    markSolved: "Bilindi İşaretle",
    markedSolved: (n: string) => `${n} bilindi olarak işaretlendi.`,
    cardWord: "Kart",
    newCard: "Yeni Kart",
    finishGame: "Oyunu Bitir",
    nextPlayer: "Sıradaki Oyuncu",
    finalScore: "Final Skoru",
    scoreLine: (s: number, total: number, title: string) => `${title} oyununda ${total} oyuncudan ${s} tanesi doğru bildi.`,
    newCards: "Yeni Kartlar",
    positions: { goalkeeper: "Kaleci", defender: "Defans", midfielder: "Orta Saha", forward: "Forvet" },
    difficulties: { easy: "Kolay", medium: "Orta", hard: "Zor" }
  },
  ar: {
    cardHeader: "بطاقة اللاعب",
    noTime: "بلا وقت",
    timeUp: (n: string) => `انتهى الوقت. كانت البطاقة ${n}.`,
    noHints: "لم تستخدم تلميحات",
    genericCard: "بطاقة لاعب كرة القدم",
    playersCard: (n: string) => `بطاقة ${n}`,
    showHint: "أظهر تلميحا",
    hintShown: (n: number) => `تم عرض التلميح ${n}.`,
    solvedTick: "تم الحل ✓",
    markSolved: "وضع علامة تم الحل",
    markedSolved: (n: string) => `تم وضع علامة الحل لـ ${n}.`,
    cardWord: "البطاقة",
    newCard: "بطاقة جديدة",
    finishGame: "إنهاء اللعبة",
    nextPlayer: "اللاعب التالي",
    finalScore: "النتيجة النهائية",
    scoreLine: (s: number, total: number, title: string) => `${s} من ${total} لاعبين خمنوا بشكل صحيح في ${title}.`,
    newCards: "بطاقات جديدة",
    positions: { goalkeeper: "حارس مرمى", defender: "مدافع", midfielder: "لاعب وسط", forward: "مهاجم" },
    difficulties: { easy: "سهل", medium: "متوسط", hard: "صعب" }
  },
  ku: {
    cardHeader: "کارتی یاریزان",
    noTime: "بێ کات",
    timeUp: (n: string) => `کات تەواو بوو. کارتەکە ${n} بوو.`,
    noHints: "هیچ ئاماژەیەک بەکارنەهاتووە",
    genericCard: "کارتی یاریزانی فووتباڵ",
    playersCard: (n: string) => `کارتی ${n}`,
    showHint: "ئاماژە پیشان بدە",
    hintShown: (n: number) => `ئاماژەی ${n} پیشان درا.`,
    solvedTick: "دۆزرایەوە ✓",
    markSolved: "وەک دۆزراوە نیشان بکە",
    markedSolved: (n: string) => `${n} وەک دۆزراوە نیشان کرا.`,
    cardWord: "کارت",
    newCard: "کارتی نوێ",
    finishGame: "کۆتایی یاری",
    nextPlayer: "یاریزانی داهاتوو",
    finalScore: "ئەنجامی کۆتایی",
    scoreLine: (s: number, total: number, title: string) => `${s} لە ${total} یاریزان بە دروستی دۆزیانەوە لە ${title}.`,
    newCards: "کارتی نوێ",
    positions: { goalkeeper: "گۆڵپارێز", defender: "بەرگریکار", midfielder: "ناوەڕاست", forward: "هێرشبەر" },
    difficulties: { easy: "ئاسان", medium: "مامناوەند", hard: "قورس" }
  }
} as const

interface FootballText {
  cardHeader: string
  noTime: string
  timeUp: (n: string) => string
  noHints: string
  genericCard: string
  playersCard: (n: string) => string
  showHint: string
  hintShown: (n: number) => string
  solvedTick: string
  markSolved: string
  markedSolved: (n: string) => string
  cardWord: string
  newCard: string
  finishGame: string
  nextPlayer: string
  finalScore: string
  scoreLine: (s: number, total: number, title: string) => string
  newCards: string
  positions: Record<FootballPlayerCard["position"], string>
  difficulties: Record<FootballDifficulty, string>
}

function footballText(lang: LangCode): FootballText {
  return (FOOTBALL_TEXT[lang] ?? FOOTBALL_TEXT.en) as FootballText
}

/* Shared reveal-screen strings (used by every local game). */
const REVEAL_TEXT = {
  en: { playerOf: (n: number, total: number) => `Player ${n} of ${total}`, privacy: "Make sure only you can see the screen", tap: "Tap to See Your Role" },
  tr: { playerOf: (n: number, total: number) => `Oyuncu ${n} / ${total}`, privacy: "Ekranı sadece senin gördüğünden emin ol", tap: "Rolünü Görmek İçin Dokun" },
  ar: { playerOf: (n: number, total: number) => `اللاعب ${n} من ${total}`, privacy: "تأكد أنك الوحيد الذي يرى الشاشة", tap: "اضغط لرؤية دورك" },
  ku: { playerOf: (n: number, total: number) => `یاریزان ${n} لە ${total}`, privacy: "دڵنیابە تەنها تۆ شاشەکە دەبینیت", tap: "دەستبنێ بۆ بینینی ڕۆڵەکەت" }
} as const

function revealText(lang: LangCode): { playerOf: (n: number, total: number) => string; privacy: string; tap: string } {
  return REVEAL_TEXT[lang] ?? REVEAL_TEXT.en
}

function localReviewText(
  lang: LangCode,
  key: "finishedTitle" | "finishedHint" | "adminButton" | "handoffHint" | "doneTitle" | "doneHint" | "doneBack" | "newGame"
): string {
  const text = {
    tr: {
      finishedTitle: "Bitti",
      finishedHint: "Tüm oyuncular kendi rolünü gördü. Şimdi cihazı admine geri ver.",
      adminButton: "Admin Rolleri Görsün",
      handoffHint: "Roller bu ekranda gizli tutulur. Admin butona basınca tüm liste açılır.",
      doneTitle: "Tüm Oyuncular Rollerini Aldı",
      doneHint: "Oyun başlayabilir. Gün, gece, konuşma ve oylama kurallarını grup içinde yönetin.",
      doneBack: "Bitti - Ana Sayfaya Dön",
      newGame: "Yeni Oyun"
    },
    en: {
      finishedTitle: "Done",
      finishedHint: "All players have seen their own role. Now hand the device back to the admin.",
      adminButton: "Admin: Show All Roles",
      handoffHint: "Roles stay hidden on this screen. The full list opens only after the admin continues.",
      doneTitle: "All Players Have Their Roles",
      doneHint: "The game can begin. Day phase, voting, and other rules happen in your group.",
      doneBack: "Done - Back to Home",
      newGame: "New Game"
    },
    ar: {
      finishedTitle: "انتهى",
      finishedHint: "كل اللاعبين شاهدوا أدوارهم. أعط الجهاز الآن للمدير.",
      adminButton: "المدير يرى كل الأدوار",
      handoffHint: "تبقى الأدوار مخفية هنا. تظهر القائمة الكاملة بعد متابعة المدير فقط.",
      doneTitle: "كل اللاعبين حصلوا على أدوارهم",
      doneHint: "يمكن أن تبدأ اللعبة. اليوم والليل والنقاش والتصويت تتم داخل المجموعة.",
      doneBack: "انتهى - العودة للرئيسية",
      newGame: "لعبة جديدة"
    },
    ku: {
      finishedTitle: "تەواو بوو",
      finishedHint: "هەموو یاریزانەکان ڕۆڵی خۆیان بینی. ئێستا ئامێرەکە بدەوە بە ئەدمین.",
      adminButton: "ئەدمین هەموو ڕۆڵەکان ببینێت",
      handoffHint: "ڕۆڵەکان لەم شاشەیەدا شاراوە دەمێننەوە. لیستی تەواو تەنها دوای بەردەوامبوونی ئەدمین دەکرێتەوە.",
      doneTitle: "هەموو یاریزانەکان ڕۆڵیان وەرگرت",
      doneHint: "یارییەکە دەتوانێت دەست پێ بکات. قۆناغەکان و دەنگدان لە ناو گرووپەکەتان بەڕێوە ببەن.",
      doneBack: "تەواو - گەڕانەوە بۆ سەرەکی",
      newGame: "یاری نوێ"
    }
  }
  return text[lang]?.[key] ?? text.en[key]
}

function prepareRound(game: Game, lang: LangCode): void {
  if (isSpyGame(game) && settingNumber("spyCount", 1) >= state.playerNames.length) {
    throw new Error("TOO_MANY_SPECIAL_ROLES")
  }

  const pool = buildRolePool(game, state.settings, state.playerNames.length)
  state.assignments = assignRolesLocally(state.playerNames, pool)
  state.currentRevealIndex = 0
  state.roundEndsAt = null
  state.selectedSuspect = null
  state.lastVoteMessage = null
  state.result = null
  state.starterName = null
  state.voteAttemptsLeft = Math.max(1, settingNumber("guessAttempts", 1))

  if (isSpyGame(game)) {
    const pick = pickSpyWordWithCategory(lang, state.spyCategoryIds, state.customSpyWords)
    state.spyWord = pick.word
    state.spyHintCategory = pick.categoryLabel
  } else {
    state.spyWord = null
    state.spyHintCategory = null
  }

  state.step = "reveal"
}

function initialStepForGame(game: Game): Step {
  if (isFootballGame(game)) return "settings"
  return isWhoAmIGame(game) ? "whoSetup" : "names"
}

function seedStateForGame(gameId: string): boolean {
  const game = findGame(gameId)
  if (!game || game.turnBased === true || game.id === MOST_LIKELY_TO_GAME_ID) return false
  state = {
    ...freshState(),
    gameId,
    settings: { ...game.defaultSettings },
    step: initialStepForGame(game)
  }
  return true
}

/* ─── Back navigation ─────────────────────────────────────
   Every screen of the wizard has a defined parent, so the phone's back
   gesture (and the pill at the top of the view, which routes through the same
   code) walks the flow backwards one screen at a time instead of throwing the
   whole session away. Screens that would lose a round in progress ask first.
*/
export type BackTarget =
  | { kind: "step"; step: Step; resetsRound?: boolean }
  | { kind: "exit"; confirm?: boolean }

/**
 * Where the back gesture goes from a given screen. Pure so it can be unit
 * tested: `pickerReachable` is false when Local Play was opened from a world
 * page, because the game picker is then not part of this flow.
 */
export function backTargetForStep(step: Step, game: Game | undefined, pickerReachable: boolean): BackTarget {
  switch (step) {
    case "game":       return { kind: "exit" }
    case "names":      return pickerReachable ? { kind: "step", step: "game" } : { kind: "exit" }
    case "whoSetup":   return pickerReachable ? { kind: "step", step: "game" } : { kind: "exit" }
    case "settings":
      if (game && isFootballGame(game)) {
        return pickerReachable ? { kind: "step", step: "game" } : { kind: "exit" }
      }
      return { kind: "step", step: "names" }
    case "reveal":       return { kind: "step", step: "settings", resetsRound: true }
    case "adminReview":  return { kind: "exit", confirm: true }
    case "starter":      return { kind: "exit", confirm: true }
    case "discussion":   return { kind: "step", step: "starter" }
    case "vote":         return { kind: "step", step: "discussion" }
    case "whoCountdown": return { kind: "step", step: "whoSetup" }
    case "whoRound":     return { kind: "step", step: "whoSetup" }
    case "whoTimeUp":    return { kind: "step", step: "whoSetup" }
    case "footballTurn": return { kind: "step", step: "settings", resetsRound: true }
    case "result":
    case "done":
    case "footballSummary":
    default:             return { kind: "exit" }
  }
}

/* Screens where a round is actually running: nobody taps the glass for
   minutes at a time, so the phone must not fall asleep. */
const IN_PLAY_STEPS: ReadonlySet<Step> = new Set<Step>([
  "reveal", "adminReview", "starter", "discussion", "vote",
  "whoCountdown", "whoRound", "footballTurn"
])

/* Set just before goBack() when an exit has already been decided (a confirmed
   dialog, or a "Back to Home" button), so the view's back handler steps aside
   and lets the router pop the view instead of asking the question again. */
let exitConfirmed = false

/** Leave Local Play through the back stack — lands on whatever opened it. */
function exitLocalPlay(): void {
  clearLocalState()
  clearTheme()
  exitConfirmed = true
  goBack()
}

/** Leave Local Play straight to the home stage, dropping the back stack. */
function goHomeFromLocalPlay(): void {
  clearLocalState()
  clearTheme()
  void setView("homeView", {}, { mode: "root" })
}

/* Undo the round state that belongs to the screens being left behind, so the
   target screen starts clean instead of instantly bouncing forward again (an
   expired discussion clock, for example, would jump straight back to voting). */
function rewindStateTo(step: Step): void {
  state.roundEndsAt = null
  state.selectedSuspect = null
  state.lastVoteMessage = null
  if (step === "settings" || step === "names" || step === "game") {
    state.assignments = []
    state.currentRevealIndex = 0
    state.spyWord = null
    state.spyHintCategory = null
    state.starterName = null
    state.result = null
    state.footballAssignments = []
    state.footballCurrentIndex = 0
    state.footballMessage = null
  }
  if (step === "whoSetup") {
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
  }
  if (step === "starter" || step === "discussion") {
    state.voteAttemptsLeft = Math.max(state.voteAttemptsLeft, 1)
  }
  state.step = step
}

export const localPlayView = {
  id: "localPlayView" as const,
  mount(ctx: { gameId?: string } = {}) {
    const container = $<HTMLDivElement>("#localPlayContent")
    let activeTimer: number | undefined
    presetGameId = null
    loadState()

    if (typeof ctx.gameId === "string") {
      if (seedStateForGame(ctx.gameId)) {
        presetGameId = ctx.gameId
      } else if (findGame(ctx.gameId)?.turnBased === true || ctx.gameId === MOST_LIKELY_TO_GAME_ID) {
        // Do not let a previously saved local game leak into an unsupported
        // turn-based deep link.
        state = freshState()
      }
    }
    // A stale session (or an old deep link) must not re-enter the role-based
    // wizard for a turn-based game. Those games are started from a room.
    if (state.gameId && (findGame(state.gameId)?.turnBased === true || state.gameId === MOST_LIKELY_TO_GAME_ID)) {
      state = freshState()
      presetGameId = null
    }

    let wakeLock: (() => void) | null = null

    function clearTimer(): void {
      if (activeTimer !== undefined) {
        window.clearInterval(activeTimer)
        activeTimer = undefined
      }
    }

    function render(): void {
      clearTimer()
      clear(container)
      const lang = getLang()
      const game = findGame(state.gameId)
      if (game) void applyTheme(game.theme).catch(() => {})
      else clearTheme()

      if (state.step === "game") renderGamePicker(container, lang, render)
      else if (state.step === "names" && game) renderNameEntry(container, lang, render, game)
      else if (state.step === "settings" && game) renderSettings(container, lang, render, game)
      else if (state.step === "reveal" && game) renderReveal(container, lang, render, game)
      else if (state.step === "adminReview" && game) renderAdminReview(container, lang, render)
      else if (state.step === "starter" && game) renderSpyStarter(container, lang, render)
      else if (state.step === "discussion" && game) renderDiscussion(container, lang, render, id => { activeTimer = id })
      else if (state.step === "vote" && game) renderVote(container, lang, render)
      else if (state.step === "result" && game) renderSpyResult(container, lang, render, game)
      else if (state.step === "done" && game) renderDone(container, lang, render, game)
      else if (state.step === "whoSetup" && game) renderWhoAmISetup(container, lang, render)
      else if (state.step === "whoCountdown" && game) renderWhoAmICountdown(container, lang, render, id => { activeTimer = id })
      else if (state.step === "whoRound" && game) renderWhoAmIRound(container, lang, render, id => { activeTimer = id })
      else if (state.step === "whoTimeUp" && game) renderWhoAmITimeUp(container, lang, render)
      else if (state.step === "footballTurn" && game) renderFootballTurn(container, lang, render, id => { activeTimer = id })
      else if (state.step === "footballSummary" && game) renderFootballSummary(container, lang, render, game)
      else {
        state.step = "game"
        renderGamePicker(container, lang, render)
      }
      updateBackLabel()
      wakeLock = syncWakeLock(IN_PLAY_STEPS.has(state.step), wakeLock)
      saveState()
    }

    function updateBackLabel(): void {
      const button = document.getElementById("localPlayBack")
      if (!button) return
      const target = backTargetForStep(state.step, findGame(state.gameId), !presetGameId)
      // The arrow glyph is a CSS ::before, so only the word changes here.
      button.textContent = target.kind === "exit" ? t("navExit") : t("back")
    }

    render()

    let asking = false

    const leaveView = (): void => {
      clearTimer()
      exitLocalPlay()
    }

    const askExit = (): void => {
      if (asking) return
      asking = true
      void confirmDialog({
        title: "exitGameTitle",
        body: "exitGameBody",
        confirmKey: "dialogExit",
        cancelKey: "dialogStay",
        danger: true
      }).then(confirmed => {
        asking = false
        if (confirmed) leaveView()
      })
    }

    const askReset = (step: Step): void => {
      if (asking) return
      asking = true
      void confirmDialog({
        title: "resetRoundTitle",
        body: "resetRoundBody",
        confirmKey: "dialogRestart",
        cancelKey: "dialogStay"
      }).then(confirmed => {
        asking = false
        if (!confirmed) return
        clearTimer()
        rewindStateTo(step)
        render()
      })
    }

    /* Returns true when the press was handled inside the wizard; false lets the
       router pop back to whatever opened Local Play (home or the world page). */
    const handleBack = (): boolean => {
      if (exitConfirmed) { exitConfirmed = false; return false }
      if (asking) return true
      const target = backTargetForStep(state.step, findGame(state.gameId), !presetGameId)
      if (target.kind === "exit") {
        if (target.confirm) { askExit(); return true }
        // Nothing to confirm: tidy up and hand the press back to the router,
        // which pops to whatever opened Local Play. Calling goBack() here
        // instead would consume this press and leave a stray layer behind.
        clearTimer()
        clearLocalState()
        clearTheme()
        return false
      }
      if (target.resetsRound) { askReset(target.step); return true }
      clearTimer()
      rewindStateTo(target.step)
      render()
      return true
    }
    setViewBackHandler(handleBack)

    const onBack = () => { goBack() }
    const back = $<HTMLButtonElement>("#localPlayBack")
    back.addEventListener("click", onBack)

    return () => {
      clearTimer()
      wakeLock = syncWakeLock(false, wakeLock)
      setViewBackHandler(null)
      back.removeEventListener("click", onBack)
    }
  }
}

function renderProgressBar(stepIdx: number, totalSteps: number): HTMLElement {
  const bar = el("div", { class: "lp-progress" })
  for (let i = 0; i < totalSteps; i++) {
    bar.appendChild(el("span", { class: i <= stepIdx ? "lp-progress-step done" : "lp-progress-step" }))
  }
  return bar
}

function renderGamePicker(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  // Turn-based games run through the shared room/game-stage flow. Local Play
  // is a pass-and-play role/reveal flow and cannot start those games without
  // trying to build a role pool from `roles: []`.
  const games = getGames().filter(game => game.turnBased !== true && game.id !== MOST_LIKELY_TO_GAME_ID)

  const grid = el("div", { class: "lp-game-grid" })
  for (const game of games) {
    const card = el(
      "button",
      {
        class: "lp-game-card",
        "data-theme": game.theme,
        type: "button"
      },
      [
        el("img", {
          src: worldCoverPath(game.theme),
          alt: game.title[lang],
          loading: "lazy",
          decoding: "async",
          width: "200",
          height: "200"
        }),
        el("div", { class: "lp-game-info" }, [
          el("strong", {}, [game.title[lang]]),
          el("span", { class: "muted" }, [setupText(lang).minPlayers(game.minPlayers)])
        ])
      ]
    )
    card.addEventListener("click", () => {
      const nextStep = initialStepForGame(game)
      state = { ...freshState(), gameId: game.id, settings: { ...game.defaultSettings }, step: nextStep }
      render()
    })
    grid.appendChild(card)
  }

  container.append(
    renderProgressBar(0, 4),
    buildSetupHeader(setupText(lang).localStep(1, 4), setupText(lang).chooseGame, setupText(lang).chooseGameSub),
    grid
  )
}

function renderNameEntry(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const list: string[] = state.playerNames.length > 0
    ? [...state.playerNames]
    : Array.from({ length: Math.max(game.minPlayers, 3) }, () => "")

  function renderList(): void {
    const listEl = container.querySelector(".lp-name-list") as HTMLDivElement | null
    if (!listEl) return
    clear(listEl)
    list.forEach((name, idx) => {
      const input = el("input", {
        type: "text",
        maxlength: "24",
        placeholder: setupText(lang).playerPlaceholder(idx + 1),
        autocomplete: "off"
      }) as HTMLInputElement
      input.value = name
      input.addEventListener("input", () => { list[idx] = input.value })

      const row = el("div", { class: "lp-name-row" }, [
        el("span", { class: "lp-name-num" }, [String(idx + 1)]),
        input
      ])

      if (list.length > game.minPlayers) {
        const remove = el("button", { class: "lp-name-remove", type: "button", "aria-label": "Remove player" }, ["x"])
        remove.addEventListener("click", () => {
          list.splice(idx, 1)
          renderList()
        })
        row.appendChild(remove)
      }

      listEl.appendChild(row)
    })
  }

  const addBtn = el("button", { class: "lp-secondary", type: "button" }, [setupText(lang).addPlayer])
  addBtn.addEventListener("click", () => {
    list.push("")
    renderList()
  })

  const continueBtn = el("button", { class: "lp-primary", type: "button" }, [setupText(lang).continueBtn])
  continueBtn.addEventListener("click", () => {
    const validNames = list.map(n => n.trim()).filter(n => n.length > 0)
    const seen = new Set<string>()
    const duplicates = validNames.filter(n => {
      const lower = n.toLowerCase()
      if (seen.has(lower)) return true
      seen.add(lower)
      return false
    })
    if (validNames.length < game.minPlayers) {
      buildErrorMessage(container, setupText(lang).needAtLeast(game.minPlayers, validNames.length))
      return
    }
    if (duplicates.length > 0) {
      buildErrorMessage(container, setupText(lang).duplicateNames(duplicates.join(", ")))
      return
    }
    state.playerNames = validNames
    state.step = "settings"
    render()
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, [setupText(lang).backBtn])
  backBtn.addEventListener("click", () => {
    if (presetGameId) {
      // Opened from a world page: pop back to it through the same stack the
      // hardware back button uses, so history depth stays correct.
      exitLocalPlay()
      return
    }
    state.step = "game"
    render()
  })

  const totalSteps = isSpyGame(game) ? 6 : 4
  const stepNum = presetGameId ? 1 : 2
  container.append(
    renderProgressBar(presetGameId ? 0 : 1, totalSteps),
    presetGameId ? buildSelectedGameSummary(game, lang) : el("div", { class: "lp-selected-empty" }),
    buildSetupHeader(
      setupText(lang).step(stepNum, totalSteps),
      setupText(lang).playerNames,
      setupText(lang).playerNamesSub(game.title[lang], game.minPlayers)
    ),
    el("div", { class: "lp-name-list" }),
    el("div", { class: "lp-actions" }, [addBtn]),
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, continueBtn])
  )
  renderList()
}

function buildSelectedGameSummary(game: Game, lang: LangCode): HTMLElement {
  return el("div", { class: "lp-selected-game" }, [
    el("span", { class: "lp-selected-game-badge", "aria-hidden": "true" }, [game.icon ?? "❖"]),
    el("div", { class: "lp-selected-game-text" }, [
      el("span", { class: "lp-selected-game-label" }, [t("whoAmISelectedGame")]),
      el("strong", {}, [game.title[lang]])
    ]),
    el("span", { class: "lp-selected-game-mode" }, [t("whoAmIPlayModeLocal")])
  ])
}

function buildSetupHeader(eyebrow: string, title: string, subtitle?: string): HTMLElement {
  const children: Array<HTMLElement | Node> = [
    el("p", { class: "lp-eyebrow" }, [eyebrow]),
    el("h2", { class: "lp-title" }, [title])
  ]
  if (subtitle) children.push(el("p", { class: "lp-sub" }, [subtitle]))
  return el("div", { class: "lp-header" }, children)
}

function renderSettings(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  if (isFootballGame(game)) {
    renderFootballSettings(container, lang, render, game)
    return
  }

  const settingsEl = el("div", { class: "lp-settings" })

  if (isSpyGame(game)) {
    settingsEl.appendChild(renderSpyWordSettings(lang))
  }

  for (const def of game.settings) {
    const id = `lp-setting-${def.key}`
    const labelText = def.label[lang]
    const value = state.settings[def.key]
    const row = el("label", { class: "lp-setting-row", for: id }, [el("span", {}, [labelText])])
    if (def.type === "number") {
      const input = el("input", {
        id, type: "number",
        min: String(def.min), max: String(def.max),
        value: String(value ?? def.min)
      }) as HTMLInputElement
      input.addEventListener("input", () => {
        state.settings[def.key] = Math.max(def.min, Math.min(def.max, Number(input.value) || def.min))
      })
      row.appendChild(input)
    } else {
      const input = el("input", { id, type: "checkbox" }) as HTMLInputElement
      input.checked = Boolean(value)
      input.addEventListener("change", () => { state.settings[def.key] = input.checked })
      row.appendChild(input)
    }
    settingsEl.appendChild(row)
  }

  const assignBtn = el("button", { class: "lp-primary", type: "button" }, [isSpyGame(game) ? setupText(lang).startSpy : setupText(lang).assignRoles])
  assignBtn.addEventListener("click", () => {
    try {
      prepareRound(game, lang)
      render()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign roles"
      if (msg === "NO_FILLER_ROLE") buildErrorMessage(container, "Game configuration is broken (no filler role).")
      else if (msg === "TOO_MANY_SPECIAL_ROLES") buildErrorMessage(container, setupText(lang).tooManySpies)
      else if (msg === "NO_SPY_WORDS") buildErrorMessage(container, setupText(lang).noWords)
      else buildErrorMessage(container, msg)
    }
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, [setupText(lang).backBtn])
  backBtn.addEventListener("click", () => {
    state.step = "names"
    render()
  })

  const totalSteps = isSpyGame(game) ? 6 : 4
  const stepNum = presetGameId ? 2 : 3
  container.append(
    renderProgressBar(presetGameId ? 1 : 2, totalSteps),
    presetGameId ? buildSelectedGameSummary(game, lang) : el("div", { class: "lp-selected-empty" }),
    buildSetupHeader(
      setupText(lang).step(stepNum, totalSteps),
      isSpyGame(game) ? setupText(lang).spySetup : setupText(lang).configure,
      setupText(lang).customiseSub(state.playerNames.length, game.title[lang])
    ),
    settingsEl,
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, assignBtn])
  )
}

function renderSpyWordSettings(lang: LangCode): HTMLElement {
  const selected = new Set(state.spyCategoryIds)
  const grid = el("div", { class: "lp-category-grid" })

  for (const category of SPY_WORD_CATEGORIES) {
    const checkbox = el("input", { type: "checkbox", value: category.id }) as HTMLInputElement
    checkbox.checked = selected.has(category.id)
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.add(category.id)
      else selected.delete(category.id)
      state.spyCategoryIds = [...selected]
    })

    const cat = getCategoryByKey(category.id)
    grid.appendChild(el("label", { class: "lp-category-card" }, [
      checkbox,
      el("span", {}, [`${cat?.icon ? cat.icon + " " : ""}${category.label[lang]}`])
    ]))
  }

  const custom = el("textarea", {
    class: "lp-custom-words",
    rows: "4",
    placeholder: "Custom words, comma or line separated"
  }) as HTMLTextAreaElement
  custom.value = state.customSpyWords
  custom.addEventListener("input", () => { state.customSpyWords = custom.value })

  return el("div", { class: "lp-spy-words" }, [
    el("h3", { class: "lp-section-title" }, [spyText(lang, "categoriesTitle")]),
    el("p", { class: "lp-sub" }, [spyText(lang, "categoriesSub")]),
    grid,
    el("label", { class: "lp-custom-label" }, [
      el("span", {}, [spyText(lang, "customWords")]),
      custom
    ])
  ])
}

function renderReveal(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const player = state.assignments[state.currentRevealIndex]
  if (!player) {
    state.step = isSpyGame(game) ? "starter" : "done"
    render()
    return
  }
  const total = state.assignments.length
  const playerNumber = state.currentRevealIndex + 1
  const rt = revealText(lang)

  const card = el("div", { class: "lp-reveal-stage" }, [
    el("p", { class: "lp-reveal-progress" }, [rt.playerOf(playerNumber, total)]),
    el("h1", { class: "lp-reveal-name" }, [player.name]),
    el("p", { class: "lp-reveal-instruction" }, [rt.privacy])
  ])

  const revealBtn = el("button", { class: "lp-primary lp-reveal-cta", type: "button" }, [rt.tap])
  revealBtn.addEventListener("click", async () => {
    const roleData = game.roles.find(r => r.id === player.roleId)
    if (!roleData) {
      buildErrorMessage(container, t("errorGeneric"))
      return
    }
    const payload: RoleAssignedPayload = {
      role: player.roleId,
      roleData: isSpyGame(game) ? buildSpyRevealRole(roleData, player.roleId, lang) : roleData,
      name: player.name,
      code: "LOCAL",
      game
    }
    await showReveal({ payload, lang, onClose: () => {
      state.currentRevealIndex += 1
      if (state.currentRevealIndex >= state.assignments.length) {
        state.step = isSpyGame(game) ? "starter" : "adminReview"
      }
      render()
    }})
  })

  card.appendChild(revealBtn)

  container.append(
    renderProgressBar(3, isSpyGame(game) ? 6 : 4),
    card
  )
}

function renderAdminReview(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  const continueBtn = el("button", { class: "lp-primary lp-reveal-cta", type: "button" }, [
    localReviewText(lang, "adminButton")
  ])
  continueBtn.addEventListener("click", () => {
    state.step = "done"
    render()
  })

  container.append(
    renderProgressBar(4, 4),
    el("div", { class: "lp-reveal-stage lp-admin-review" }, [
      el("p", { class: "lp-reveal-progress" }, [localReviewText(lang, "finishedTitle")]),
      el("h1", { class: "lp-reveal-name" }, [localReviewText(lang, "finishedTitle")]),
      el("p", { class: "lp-reveal-instruction" }, [localReviewText(lang, "finishedHint")]),
      el("p", { class: "lp-reveal-instruction" }, [localReviewText(lang, "handoffHint")]),
      continueBtn
    ])
  )
}

function buildSpyRevealRole(role: Role, roleId: string, lang: LangCode): Role {
  const desc = { ...role.desc }
  if (roleId === "spy") {
    const hintLabel = state.spyHintCategory?.[lang] ?? state.spyHintCategory?.en
    desc[lang] = hintLabel
      ? `${spyText(lang, "wordForSpy")} ${spyText(lang, "spyHint")} ${hintLabel}`
      : spyText(lang, "wordForSpy")
  } else {
    desc[lang] = `${spyText(lang, "wordForPlayer")}: ${state.spyWord ?? "-"}`
  }
  return { ...role, desc }
}

function renderSpyStarter(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  if (!state.starterName && state.assignments.length > 0) {
    const pick = state.assignments[Math.floor(Math.random() * state.assignments.length)]!
    state.starterName = pick.name
  }
  const starter = state.starterName ?? state.assignments[0]?.name ?? "-"

  const startBtn = el("button", { class: "lp-primary lp-reveal-cta", type: "button" }, [
    spyText(lang, "startDiscussion")
  ])
  startBtn.addEventListener("click", () => {
    // The round clock starts only when discussion actually begins.
    state.roundEndsAt = Date.now() + settingNumber("roundMinutes", 5) * 60_000
    state.step = "discussion"
    render()
  })

  container.append(
    renderProgressBar(4, 6),
    el("div", { class: "lp-reveal-stage lp-starter-stage" }, [
      el("p", { class: "lp-starter-dice" }, ["🎲"]),
      el("h2", { class: "lp-title" }, [spyText(lang, "starterTitle")]),
      el("h1", { class: "lp-reveal-name lp-starter-name" }, [starter]),
      el("p", { class: "lp-reveal-instruction" }, [`${starter} ${spyText(lang, "starterIs")}`]),
      startBtn
    ])
  )
}

function renderDiscussion(container: HTMLDivElement, lang: LangCode, render: () => void, setTimer: (id: number) => void): void {
  if (!state.roundEndsAt) {
    state.roundEndsAt = Date.now() + settingNumber("roundMinutes", 5) * 60_000
  }

  const timer = el("div", { class: "lp-timer" }, ["00:00"])
  const firstQuestioner = state.starterName ?? state.assignments[0]?.name ?? "-"
  const endBtn = el("button", { class: "lp-primary", type: "button" }, [spyText(lang, "endDiscussion")])
  endBtn.addEventListener("click", () => {
    state.step = "vote"
    render()
  })

  const updateTimer = () => {
    const remaining = (state.roundEndsAt ?? Date.now()) - Date.now()
    timer.textContent = formatTime(remaining)
    timer.classList.toggle("urgent", remaining > 0 && remaining <= 30_000)
    if (remaining <= 0) {
      vibrate("end")
      state.step = "vote"
      render()
    }
  }
  updateTimer()
  setTimer(window.setInterval(updateTimer, 1000))

  // Active topic chips help everyone (including the spy) stay oriented.
  const topics = el("div", { class: "lp-topic-chips" })
  for (const id of state.spyCategoryIds) {
    const cat = SPY_WORD_CATEGORIES.find(c => c.id === id)
    if (cat) topics.appendChild(el("span", { class: "lp-topic-chip" }, [cat.label[lang] ?? cat.label.en]))
  }

  container.append(
    renderProgressBar(4, 6),
    el("h2", { class: "lp-title" }, [spyText(lang, "discussionTitle")]),
    timer,
    el("p", { class: "lp-first-chip" }, [`💬 ${spyText(lang, "firstQuestion")}: ${firstQuestioner}`]),
    el("p", { class: "lp-sub" }, [spyText(lang, "discussionHint")]),
    topics,
    el("div", { class: "lp-actions" }, [endBtn])
  )
}

function renderVote(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  const list = el("div", { class: "lp-suspect-grid" })
  for (const player of state.assignments) {
    const selected = state.selectedSuspect === player.name
    const button = el("button", {
      class: selected ? "lp-suspect selected" : "lp-suspect",
      type: "button"
    }, [player.name])
    button.addEventListener("click", () => {
      state.selectedSuspect = player.name
      render()
    })
    list.appendChild(button)
  }

  const submitBtn = el("button", { class: "lp-primary", type: "button" }, [spyText(lang, "sendVote")])
  submitBtn.addEventListener("click", () => {
    if (!state.selectedSuspect) {
      buildErrorMessage(container, spyText(lang, "chooseSuspect"))
      return
    }
    const suspect = state.assignments.find(a => a.name === state.selectedSuspect)
    if (suspect?.roleId === "spy") {
      state.result = "citizens"
      state.step = "result"
    } else {
      state.voteAttemptsLeft -= 1
      if (state.voteAttemptsLeft <= 0) {
        state.result = "spies"
        state.step = "result"
      } else {
        vibrate("warn")
        state.lastVoteMessage = `${spyText(lang, "wrongGuess")}: ${state.voteAttemptsLeft}`
        state.selectedSuspect = null
      }
    }
    render()
  })

  container.append(
    renderProgressBar(5, 6),
    el("h2", { class: "lp-title" }, [spyText(lang, "voteTitle")]),
    el("p", { class: "lp-sub" }, [`${spyText(lang, "voteHint")}: ${state.voteAttemptsLeft}`]),
    list
  )
  if (state.lastVoteMessage) container.appendChild(el("div", { class: "lp-error" }, [state.lastVoteMessage]))
  container.appendChild(el("div", { class: "lp-actions" }, [submitBtn]))
}

function renderSpyResult(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const result = state.result ?? "spies"
  const spies = state.assignments.filter(a => a.roleId === "spy").map(a => a.name)
  const list = el("div", { class: "lp-done-list" })
  for (const a of state.assignments) {
    const role = game.roles.find(r => r.id === a.roleId)
    list.appendChild(el("div", { class: "lp-done-row" }, [
      el("span", { class: "lp-done-icon" }, [role?.icon ?? "?"]),
      el("span", { class: "lp-done-name" }, [a.name]),
      el("span", { class: "lp-done-role" }, [role?.name[lang] ?? a.roleId])
    ]))
  }

  const sameGroupBtn = el("button", { class: "lp-primary", type: "button" }, [spyText(lang, "newGameSame")])
  sameGroupBtn.addEventListener("click", () => {
    try {
      prepareRound(game, lang)
      render()
    } catch (err) {
      buildErrorMessage(container, err instanceof Error ? err.message : "Failed to start")
    }
  })

  const settingsBtn = el("button", { class: "lp-secondary", type: "button" }, [spyText(lang, "settingsLabel")])
  settingsBtn.addEventListener("click", () => {
    state.step = "settings"
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, [spyText(lang, "backHome")])
  homeBtn.addEventListener("click", () => {
    goHomeFromLocalPlay()
  })

  container.append(
    renderProgressBar(6, 6),
    el("h2", { class: "lp-title" }, [result === "citizens" ? spyText(lang, "citizensWin") : spyText(lang, "spiesWin")]),
    el("div", { class: "lp-result-card" }, [
      el("span", { class: "lp-result-label" }, [spyText(lang, "wordForPlayer")]),
      el("strong", {}, [state.spyWord ?? "-"]),
      el("span", { class: "lp-result-label" }, [spyText(lang, "spiesLabel")]),
      el("strong", {}, [spies.join(", ") || "-"])
    ]),
    list,
    el("div", { class: "lp-actions" }, [homeBtn, settingsBtn, sameGroupBtn])
  )
}

function renderDone(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const list = el("div", { class: "lp-done-list" })
  for (const a of state.assignments) {
    const role = game.roles.find(r => r.id === a.roleId)
    list.appendChild(el("div", { class: "lp-done-row" }, [
      el("span", { class: "lp-done-icon" }, [role?.icon ?? "?"]),
      el("span", { class: "lp-done-name" }, [a.name]),
      el("span", { class: "lp-done-role" }, [role?.name[lang] ?? a.roleId])
    ]))
  }

  const restartBtn = el("button", { class: "lp-primary", type: "button" }, [localReviewText(lang, "newGame")])
  restartBtn.addEventListener("click", () => {
    clearLocalState()
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, [localReviewText(lang, "doneBack")])
  homeBtn.addEventListener("click", () => {
    goHomeFromLocalPlay()
  })

  container.append(
    renderProgressBar(4, 4),
    el("h2", { class: "lp-title" }, [localReviewText(lang, "doneTitle")]),
    el("p", { class: "lp-sub" }, [localReviewText(lang, "doneHint")]),
    list,
    el("div", { class: "lp-actions" }, [homeBtn, restartBtn])
  )
}

/* ────────────────────────────────────────────────────────────────
   WHO AM I — single-device flow (no names, countdown, seconds timer)
   ──────────────────────────────────────────────────────────────── */

/* Football Player Guess - named local flow with hidden football cards. */

function footballOptionButton(
  label: string,
  selected: boolean,
  onClick: () => void
): HTMLButtonElement {
  const btn = el("button", {
    class: selected ? "lp-football-option selected" : "lp-football-option",
    type: "button",
    "aria-pressed": selected ? "true" : "false"
  }, [label]) as HTMLButtonElement
  btn.addEventListener("click", () => {
    onClick()
  })
  return btn
}

function renderFootballSettings(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const settingsEl = el("div", { class: "lp-football-settings" })

  const buildLeagueButton = (opt: (typeof FOOTBALL_LEAGUE_OPTIONS)[number]): HTMLButtonElement =>
    footballOptionButton(opt.label, state.footballLeagueKey === opt.key, () => {
      state.footballLeagueKey = opt.key
      render()
    })

  const leagueMainRow = el("div", { class: "lp-football-options" })
  const leagueEuropeRow = el("div", { class: "lp-football-options" })
  const europeanKeys = new Set<string>(["european-mixed", ...FOOTBALL_EUROPE_LEAGUE_KEYS])
  for (const opt of FOOTBALL_LEAGUE_OPTIONS) {
    if (europeanKeys.has(opt.key)) leagueEuropeRow.appendChild(buildLeagueButton(opt))
    else leagueMainRow.appendChild(buildLeagueButton(opt))
  }

  const starCategoryRow = el("div", { class: "lp-football-options" })
  for (const opt of FOOTBALL_STAR_CATEGORY_OPTIONS) {
    starCategoryRow.appendChild(footballOptionButton(opt.label, state.footballStarCategoryKey === opt.key, () => {
      state.footballStarCategoryKey = opt.key
      render()
    }))
  }

  const clubMainRow = el("div", { class: "lp-football-options" })
  const clubPopularRow = el("div", { class: "lp-football-options" })
  const virtualClubKeys = new Set<FootballClubKey>(["all", "mixed-clubs", "world-popular-clubs"])
  for (const opt of FOOTBALL_CLUB_OPTIONS) {
    const row = virtualClubKeys.has(opt.key) ? clubMainRow : clubPopularRow
    row.appendChild(footballOptionButton(opt.label, state.footballClubKey === opt.key, () => {
      state.footballClubKey = opt.key
      render()
    }))
  }

  const difficultyRow = el("div", { class: "lp-football-options" })
  for (const opt of FOOTBALL_DIFFICULTY_OPTIONS) {
    difficultyRow.appendChild(footballOptionButton(opt.label, state.footballDifficulty === opt.key, () => {
      state.footballDifficulty = opt.key
      render()
    }))
  }

  const timeRow = el("div", { class: "lp-football-options" })
  for (const seconds of FOOTBALL_ROUND_SECONDS) {
    const label = seconds === 0 ? "No time" : `${seconds}s`
    timeRow.appendChild(footballOptionButton(label, state.footballRoundSeconds === seconds, () => {
      state.footballRoundSeconds = seconds
      render()
    }))
  }

  const hintsToggle = el("label", { class: "lp-football-toggle" }, [
    el("span", {}, ["Hints"]),
    el("input", { type: "checkbox" })
  ])
  const hintsInput = hintsToggle.querySelector("input") as HTMLInputElement
  hintsInput.checked = state.footballHintsEnabled
  hintsInput.addEventListener("change", () => {
    state.footballHintsEnabled = hintsInput.checked
    render()
  })

  const hintsRow = el("div", { class: "lp-football-options" })
  for (const count of FOOTBALL_MAX_HINTS) {
    hintsRow.appendChild(footballOptionButton(String(count), state.footballMaxHints === count, () => {
      state.footballMaxHints = count
      render()
    }))
  }

  const duplicateToggle = el("label", { class: "lp-football-toggle" }, [
    el("span", {}, ["Duplicate cards"]),
    el("input", { type: "checkbox" })
  ])
  const duplicateInput = duplicateToggle.querySelector("input") as HTMLInputElement
  duplicateInput.checked = state.footballDuplicateCards
  duplicateInput.addEventListener("change", () => {
    state.footballDuplicateCards = duplicateInput.checked
    saveState()
  })

  settingsEl.append(
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["League Category"]),
      el("p", { class: "lp-football-group-label" }, ["All"]),
      leagueMainRow,
      el("p", { class: "lp-football-group-label" }, ["Europe"]),
      leagueEuropeRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Star Category"]),
      starCategoryRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Club Filter"]),
      el("p", { class: "lp-football-group-label" }, ["Groups"]),
      clubMainRow,
      el("p", { class: "lp-football-group-label" }, ["Club Popular XI"]),
      clubPopularRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Difficulty"]),
      difficultyRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Round time"]),
      timeRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      hintsToggle,
      hintsRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      duplicateToggle
    ])
  )

  const startBtn = el("button", { class: "lp-primary", type: "button" }, ["Start Football Guess"])
  startBtn.addEventListener("click", () => {
    try {
      prepareFootballRound()
      render()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign football cards"
      if (msg === "NOT_ENOUGH_FOOTBALL_CARDS") {
        buildErrorMessage(container, "Not enough unique cards in this league, star, or club filter. Enable duplicate cards, choose broader filters, or use easier difficulty.")
      } else if (msg === "NO_FOOTBALL_CARDS") {
        buildErrorMessage(container, "No football cards match this league, star, and club filter.")
      } else {
        buildErrorMessage(container, msg)
      }
    }
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, [setupText(lang).backBtn])
  backBtn.addEventListener("click", () => {
    if (presetGameId) {
      // Opened from a world page: pop back to it through the same stack the
      // hardware back button uses, so history depth stays correct.
      exitLocalPlay()
      return
    }
    state.step = "game"
    render()
  })

  const totalSteps = 3
  container.append(
    renderProgressBar(0, totalSteps),
    presetGameId ? buildSelectedGameSummary(game, lang) : el("div", { class: "lp-selected-empty" }),
    buildSetupHeader(
      `Setup - Step 1 of ${totalSteps}`,
      "Football Setup",
      "No player names needed. Pick options and start guessing."
    ),
    settingsEl,
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, startBtn])
  )
}

function prepareFootballRound(): void {
  const names = state.playerNames.length > 0 ? state.playerNames : ["Player"]
  const cards = pickFootballCards(
    names.length,
    state.footballCategoryKey,
    state.footballLeagueKey,
    state.footballStarCategoryKey,
    state.footballClubKey,
    state.footballDifficulty,
    state.footballDuplicateCards
  )
  state.footballAssignments = names.map((name, idx) => ({
    name,
    card: cards[idx]!,
    hintsUsed: 0,
    solved: false
  }))
  state.footballCurrentIndex = 0
  state.footballMessage = null
  state.roundEndsAt = null
  state.step = "footballTurn"
}

function advanceFootballTurn(render: () => void): void {
  if (state.playerNames.length === 0) {
    prepareFootballRound()
    render()
    return
  }
  state.footballCurrentIndex += 1
  state.footballMessage = null
  state.roundEndsAt = null
  if (state.footballCurrentIndex >= state.footballAssignments.length) {
    state.step = "footballSummary"
  }
  render()
}

function renderFootballTurn(container: HTMLDivElement, lang: LangCode, render: () => void, setTimer: (id: number) => void): void {
  const ft = footballText(lang)
  const current = state.footballAssignments[state.footballCurrentIndex]
  if (!current) {
    state.step = "footballSummary"
    render()
    return
  }

  if (state.footballRoundSeconds > 0 && !state.roundEndsAt && !current.solved) {
    state.roundEndsAt = Date.now() + state.footballRoundSeconds * 1000
  }

  const timer = el("div", { class: "lp-timer lp-football-timer" }, [state.footballRoundSeconds === 0 ? ft.noTime : "00"])
  if (state.footballRoundSeconds > 0) {
    const updateTimer = () => {
      const remainingMs = (state.roundEndsAt ?? Date.now()) - Date.now()
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
      timer.textContent = String(remaining)
      timer.classList.toggle("danger", remaining <= 5 && remaining > 0)
      if (remainingMs <= 0 && !current.solved) {
        vibrate("end")
        state.footballMessage = ft.timeUp(current.card.name)
        if (state.playerNames.length === 0) {
          current.solved = true
          state.roundEndsAt = null
          render()
        } else {
          advanceFootballTurn(render)
        }
      }
    }
    updateTimer()
    setTimer(window.setInterval(updateTimer, 250))
  }

  const hints = current.card.hints.slice(0, current.hintsUsed)
  const hintList = el("div", { class: "lp-football-hints" })
  if (hints.length === 0) {
    hintList.appendChild(el("span", { class: "lp-football-hint muted" }, [ft.noHints]))
  } else {
    for (const hint of hints) hintList.appendChild(el("span", { class: "lp-football-hint" }, [hint]))
  }

  const card = el("div", { class: "lp-football-card" }, [
    el("p", { class: "lp-who-meta" }, [
      `${footballLeagueLabel(current.card.leagueCategory)} · ${ft.positions[current.card.position]} · ${ft.difficulties[current.card.difficulty]}`
    ]),
    el("p", { class: "lp-who-identity-label" }, [state.playerNames.length === 0 ? ft.genericCard : ft.playersCard(current.name)]),
    el("h1", { class: "lp-who-word lp-football-player-name" }, [current.card.name]),
    hintList
  ])

  const hintBtn = el("button", { class: "lp-secondary", type: "button" }, [ft.showHint])
  const maxHints = state.footballHintsEnabled ? state.footballMaxHints : 0
  hintBtn.toggleAttribute("disabled", !state.footballHintsEnabled || current.hintsUsed >= maxHints)
  hintBtn.addEventListener("click", () => {
    if (!state.footballHintsEnabled || current.hintsUsed >= maxHints) return
    current.hintsUsed += 1
    state.footballMessage = ft.hintShown(current.hintsUsed)
    render()
  })

  const solvedBtn = el("button", { class: "lp-primary", type: "button" }, [current.solved ? ft.solvedTick : ft.markSolved])
  solvedBtn.addEventListener("click", () => {
    current.solved = !current.solved
    state.roundEndsAt = null
    state.footballMessage = current.solved
      ? ft.markedSolved(state.playerNames.length === 0 ? ft.cardWord : current.name)
      : null
    render()
  })

  const nextBtnLabel = state.playerNames.length === 0
    ? ft.newCard
    : state.footballCurrentIndex + 1 >= state.footballAssignments.length ? ft.finishGame : ft.nextPlayer
  const nextBtn = el("button", { class: "lp-secondary", type: "button" }, [nextBtnLabel])
  nextBtn.addEventListener("click", () => {
    advanceFootballTurn(render)
  })

  container.append(
    renderProgressBar(1, 3),
    el("p", { class: "lp-sub lp-who-active-cat" }, [
      state.playerNames.length === 0 ? ft.cardHeader : revealText(lang).playerOf(state.footballCurrentIndex + 1, state.footballAssignments.length)
    ]),
    timer,
    card
  )
  if (state.footballMessage) container.appendChild(el("p", { class: "lp-info" }, [state.footballMessage]))
  container.appendChild(el("div", { class: "lp-actions lp-who-actions" }, [hintBtn, solvedBtn, nextBtn]))
}

function renderFootballSummary(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const ft = footballText(lang)
  const solved = state.footballAssignments.filter(a => a.solved).length
  const list = el("div", { class: "lp-done-list lp-football-summary" })
  for (const a of state.footballAssignments) {
    list.appendChild(el("div", { class: "lp-done-row" }, [
      el("span", { class: "lp-done-icon" }, [a.solved ? "✅" : "❌"]),
      el("span", { class: "lp-done-name" }, [a.name]),
      el("span", { class: "lp-done-role" }, [a.card.name])
    ]))
  }

  const sameGroupBtn = el("button", { class: "lp-primary", type: "button" }, [ft.newCards])
  sameGroupBtn.addEventListener("click", () => {
    try {
      prepareFootballRound()
      render()
    } catch (err) {
      buildErrorMessage(container, err instanceof Error ? err.message : "Failed to start")
    }
  })

  const settingsBtn = el("button", { class: "lp-secondary", type: "button" }, [spyText(lang, "settingsLabel")])
  settingsBtn.addEventListener("click", () => {
    state.step = "settings"
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, [localReviewText(lang, "doneBack")])
  homeBtn.addEventListener("click", () => {
    goHomeFromLocalPlay()
  })

  container.append(
    renderProgressBar(4, 4),
    el("h2", { class: "lp-title" }, [ft.finalScore]),
    el("p", { class: "lp-sub" }, [ft.scoreLine(solved, state.footballAssignments.length, game.title[lang])]),
    list,
    el("div", { class: "lp-actions" }, [homeBtn, settingsBtn, sameGroupBtn])
  )
}

function clampRoundSeconds(value: number): number {
  if (!Number.isFinite(value)) return 60
  return Math.max(15, Math.min(180, Math.round(value)))
}

function getRoundSeconds(): number {
  return clampRoundSeconds(settingNumber("roundSeconds", 60))
}

function renderWhoAmISetup(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  if (!state.whoCategoryKey) state.whoCategoryKey = RANDOM_MIX_KEY

  const grid = el("div", { class: "lp-who-cat-grid" })

  const allOptions: Array<{ key: string; icon: string; label: string }> = [
    { key: RANDOM_MIX_KEY, icon: "🎲", label: t("whoAmIRandomMix") },
    ...WHO_AM_I_CATEGORIES.map(c => ({ key: c.key, icon: c.icon, label: c.label[lang] ?? c.label.en! }))
  ]

  const summary = el("p", { class: "lp-who-summary" }, [])

  function updateSummary(): void {
    clear(summary)
    summary.append(
      el("span", { class: "lp-who-summary-label" }, [`${t("whoAmISelectedCategory")}:`]),
      el("strong", {}, [resolveCategoryLabel(state.whoCategoryKey, lang)])
    )
  }

  for (const opt of allOptions) {
    const isSelected = opt.key === state.whoCategoryKey
    const card = el(
      "button",
      {
        class: isSelected ? "lp-who-cat selected" : "lp-who-cat",
        type: "button",
        "aria-pressed": isSelected ? "true" : "false",
        "data-key": opt.key
      },
      [
        el("span", { class: "lp-who-cat-icon" }, [opt.icon]),
        el("span", { class: "lp-who-cat-label" }, [opt.label])
      ]
    )
    card.addEventListener("click", () => {
      state.whoCategoryKey = opt.key
      for (const c of grid.querySelectorAll<HTMLElement>(".lp-who-cat")) {
        const active = c.dataset.key === opt.key
        c.classList.toggle("selected", active)
        c.setAttribute("aria-pressed", active ? "true" : "false")
      }
      updateSummary()
      saveState()
    })
    grid.appendChild(card)
  }

  updateSummary()

  // Round time slider/input
  const seconds = getRoundSeconds()
  const secondsInput = el("input", {
    type: "number",
    min: "15",
    max: "180",
    step: "5",
    value: String(seconds),
    class: "lp-who-seconds-input"
  }) as HTMLInputElement
  const secondsValue = el("span", { class: "lp-who-seconds-value" }, [`${seconds} ${t("whoAmISeconds")}`])
  secondsInput.addEventListener("input", () => {
    const v = clampRoundSeconds(Number(secondsInput.value))
    state.settings.roundSeconds = v
    secondsValue.textContent = `${v} ${t("whoAmISeconds")}`
    saveState()
  })

  const presetRow = el("div", { class: "lp-who-presets" })
  for (const preset of [30, 45, 60, 90, 120]) {
    const btn = el("button", {
      type: "button",
      class: preset === seconds ? "lp-who-preset selected" : "lp-who-preset"
    }, [`${preset}s`])
    btn.addEventListener("click", () => {
      state.settings.roundSeconds = preset
      secondsInput.value = String(preset)
      secondsValue.textContent = `${preset} ${t("whoAmISeconds")}`
      for (const b of presetRow.querySelectorAll<HTMLElement>(".lp-who-preset")) {
        b.classList.remove("selected")
      }
      btn.classList.add("selected")
      saveState()
    })
    presetRow.appendChild(btn)
  }

  const startBtn = el("button", { class: "lp-primary lp-who-start", type: "button" }, [t("whoAmIStartRound")])
  startBtn.addEventListener("click", () => {
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.whoRecentWords = []
    state.step = "whoCountdown"
    render()
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, [setupText(lang).backBtn])
  backBtn.addEventListener("click", () => {
    if (presetGameId) {
      exitLocalPlay()
      return
    }
    state.step = "game"
    render()
  })

  const game = findGame(state.gameId)
  const summaryHeader = presetGameId && game ? buildSelectedGameSummary(game, lang) : null

  const children: Array<HTMLElement | Node> = [
    renderProgressBar(0, 3),
    buildSetupHeader(
      setupText(lang).step(1, 3),
      t("whoAmIChooseCategory"),
      t("whoAmICategoryHint")
    ),
    grid,
    summary,
    el("div", { class: "lp-who-time-block" }, [
      el("h3", { class: "lp-section-title" }, [`${t("whoAmIRoundTime")} (${t("whoAmISeconds")})`]),
      presetRow,
      el("label", { class: "lp-who-seconds-row" }, [
        secondsInput,
        secondsValue
      ])
    ]),
    el("div", { class: "lp-actions" }, [backBtn, startBtn])
  ]
  if (summaryHeader) children.unshift(summaryHeader)
  container.append(...children)
}

function pickNextWhoAmIWord(lang: LangCode): void {
  const picked = pickWhoAmIWord(state.whoCategoryKey, lang, state.whoRecentWords)
  state.whoCurrentWord = picked.word
  state.whoCurrentWordCategory = picked.categoryKey
  const recent = [picked.word, ...state.whoRecentWords]
  state.whoRecentWords = recent.slice(0, WHO_AM_I_RECENT_LIMIT)
}

function renderWhoAmICountdown(
  container: HTMLDivElement,
  lang: LangCode,
  render: () => void,
  setTimer: (id: number) => void
): void {
  if (!state.whoCurrentWord) {
    try { pickNextWhoAmIWord(lang) }
    catch {
      buildErrorMessage(container, t("errorNoWords"))
      state.step = "whoSetup"
      render()
      return
    }
  }

  const categoryLabel = resolveCategoryLabel(state.whoCategoryKey, lang)
  const numberEl = el("div", { class: "lp-who-countdown-num" }, ["5"])
  const stage = el("div", { class: "lp-who-countdown-stage" }, [
    el("p", { class: "lp-who-countdown-cat" }, [`${t("whoAmICategory")}: ${categoryLabel}`]),
    el("p", { class: "lp-who-countdown-ready" }, [t("whoAmIGetReady")]),
    numberEl
  ])

  const sequence = ["5", "4", "3", "2", "1", t("whoAmIGo")]
  let idx = 0

  const advance = () => {
    if (idx >= sequence.length) {
      state.roundEndsAt = Date.now() + getRoundSeconds() * 1000
      state.step = "whoRound"
      render()
      return
    }
    numberEl.textContent = sequence[idx]!
    numberEl.classList.remove("anim")
    void numberEl.offsetWidth
    numberEl.classList.add("anim")
    // The countdown used to tick with a sound; a short buzz carries better on
    // a phone that is being passed around a noisy table.
    vibrate(idx < sequence.length - 1 ? "tap" : "reveal")
    idx += 1
  }

  advance()
  setTimer(window.setInterval(advance, 1000))

  container.append(
    renderProgressBar(1, 3),
    stage
  )
}

function renderWhoAmIRound(
  container: HTMLDivElement,
  lang: LangCode,
  render: () => void,
  setTimer: (id: number) => void
): void {
  if (!state.whoCurrentWord) {
    state.step = "whoCountdown"
    render()
    return
  }

  if (!state.roundEndsAt) {
    state.roundEndsAt = Date.now() + getRoundSeconds() * 1000
  }

  const wordCategoryKey = state.whoCurrentWordCategory ?? state.whoCategoryKey
  const wordCategoryLabel = resolveCategoryLabel(wordCategoryKey, lang)
  const selectedCategoryLabel = resolveCategoryLabel(state.whoCategoryKey, lang)

  const timer = el("div", { class: "lp-timer lp-who-timer" }, ["00"])
  const updateTimer = () => {
    const remainingMs = (state.roundEndsAt ?? Date.now()) - Date.now()
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
    timer.textContent = String(remaining)
    timer.classList.toggle("danger", remaining <= 5 && remaining > 0)
    if (remainingMs <= 0) {
      vibrate("end")
      state.step = "whoTimeUp"
      render()
    }
  }
  updateTimer()
  setTimer(window.setInterval(updateTimer, 250))

  const card = el("div", { class: "lp-who-word-card" }, [
    el("p", { class: "lp-who-meta" }, [
      `${t("whoAmICategory")}: ${wordCategoryLabel}`
    ]),
    el("p", { class: "lp-who-identity-label" }, [t("whoAmIYourIdentity")]),
    el("h1", { class: "lp-who-word" }, [state.whoCurrentWord!])
  ])

  const nextBtn = el("button", { class: "lp-secondary", type: "button" }, [t("whoAmINewWord")])
  nextBtn.addEventListener("click", () => {
    try {
      pickNextWhoAmIWord(lang)
      render()
    } catch {
      buildErrorMessage(container, t("errorNoWords"))
    }
  })

  const endBtn = el("button", { class: "lp-primary", type: "button" }, [t("whoAmIEndRound")])
  endBtn.addEventListener("click", () => {
    state.step = "whoTimeUp"
    render()
  })

  const changeBtn = el("button", { class: "lp-back", type: "button" }, [t("whoAmIChangeCategory")])
  changeBtn.addEventListener("click", () => {
    state.roundEndsAt = null
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.step = "whoSetup"
    render()
  })

  const meta = el("p", { class: "lp-sub lp-who-active-cat" }, [
    `${t("whoAmISelectedCategory")}: ${selectedCategoryLabel}`
  ])

  container.append(
    renderProgressBar(2, 3),
    meta,
    timer,
    card,
    el("div", { class: "lp-actions lp-who-actions" }, [changeBtn, nextBtn, endBtn])
  )
}

function renderWhoAmITimeUp(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  state.roundEndsAt = null
  const lastWord = state.whoCurrentWord ?? "-"
  const lastCategory = resolveCategoryLabel(state.whoCurrentWordCategory ?? state.whoCategoryKey, lang)

  const playAgainBtn = el("button", { class: "lp-primary", type: "button" }, [t("whoAmIRestart")])
  playAgainBtn.addEventListener("click", () => {
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.step = "whoCountdown"
    render()
  })

  const setupBtn = el("button", { class: "lp-secondary", type: "button" }, [t("whoAmIBackToSetup")])
  setupBtn.addEventListener("click", () => {
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.step = "whoSetup"
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, [localReviewText(lang, "doneBack")])
  homeBtn.addEventListener("click", () => {
    goHomeFromLocalPlay()
  })

  container.append(
    renderProgressBar(2, 3),
    el("div", { class: "lp-reveal-stage lp-who-timeup" }, [
      el("p", { class: "lp-reveal-progress" }, [t("whoAmITimesUp")]),
      el("h1", { class: "lp-reveal-name" }, [t("whoAmITimesUp")]),
      el("p", { class: "lp-who-meta" }, [`${t("whoAmICategory")}: ${lastCategory}`]),
      el("p", { class: "lp-who-identity-label" }, [t("whoAmIYourIdentity")]),
      el("h2", { class: "lp-who-word lp-who-word-small" }, [lastWord]),
      el("div", { class: "lp-actions lp-who-actions" }, [homeBtn, setupBtn, playAgainBtn])
    ])
  )
}
