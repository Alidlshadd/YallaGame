import { describe, expect, it } from "vitest"
import { MOST_LIKELY_TO_QUESTIONS, resolveQuestion } from "@server/games/questions/most-likely-to.js"

const languages = ["tr", "en", "ar", "ku"] as const

// Regression manifest for the 100 requested prompts, including reused stable ids.
const requestedQuestions = [
  ["like-exs-story", "Kim gizlice takip ettiği eski sevgilisinin hikayesini yanlışlıkla beğenir?"],
  ["typing-never-sends", "Kim WhatsApp'ta \"yazıyor...\" yazıp asla mesaj atmaz?"],
  ["delete-story-fast", "Kim attığı hikayeyi 5 dakika sonra silip \"kimse görmedi zaten\" sanır?"],
  ["mirror-self-compliment", "Kim aynada kendine bakıp \"yok artık çok yakışıklıyım/güzelim\" der?"],
  ["fart-blame-dog", "Kim toplulukta gaz çıkarıp suçu köpeğe atar?"],
  ["eyes-closed-photos", "Kim grup fotoğrafında hep gözü kapalı çıkar?"],
  ["bathroom-phone-marathon", "Kim tuvalette telefonla 20 dakika kaybolur?"],
  ["diet-midnight-kebab", "Kim \"diyet yapıyorum\" deyip gece yarısı kebap siparişi verir?"],
  ["same-joke-tenth-time", "Kim aynı esprisini 10. kez anlatıp yine kendi güler?"],
  ["elevator-mirror-pose", "Kim asansördeki aynada kendine poz verir?"],
  ["cancel-plans-secret-party", "Kim dışarı çıkma planını son anda iptal edip \"yorgunum\" der ama gece hikayesinde parti yapar?"],
  ["fall-claim-intentional", "Kim herkesin önünde takılıp düşer ve \"ben böyle yapmıştım\" der?"],
  ["screen-share-leak", "Kim ekranını paylaşırken özel mesajlarını herkese gösterir?"],
  ["laugh-at-own-line", "Kim bir replik söylerken kendi kendine gülüp cümleyi bitiremez?"],
  ["pure-narcissist", "Kim kendini grupta herkesten üstün gören kişidir?"],
  ["nobody-understands-him", "Kim bazen konuştuğunda ne dediği hiç anlaşılmaz?"],
  ["talks-too-much-headache", "Kim o kadar çok konuşur ki kafanızı şişirir?"],
  ["jokes-too-far", "Kim çok fazla şaka yapıp karşısındakini kırar?"],
  ["believes-fake-news", "Kim her duyduğu yalan bilgiye inanıp arkadaş ortamında anlatır?"],
  ["chases-girls-denies-it", "Kim kızlara çok düşkündür ama bunu asla kabul etmez?"],
  ["wrong-number-chat", "Kim yanlış numarayı arayıp beş dakika boyunca kimle konuştuğunu anlamadan sohbet eder?"],
  ["hot-mic-meeting", "Kim online toplantıda mikrofonu açık unutup arkasından duymaması gereken bir şey söyler?"],
  ["taxi-wrong-address", "Kim aldığı taksiyi yanlış adrese gönderip yolun ortasında anlar?"],
  ["laughing-fit-meeting", "Kim en ciddi anda gülme krizine girip toplantıyı dağıtır?"],
  ["regret-in-public", "Kim \"keşke söylemeseydim\" dediği cümleyi tam kalabalığın ortasında söyler?"],
  ["most-drama-group", "Kim arkadaş grubunda en çok drama çıkarır?"],
  ["talks-behind-smiles-front", "Kim herkesin arkasından konuşup yüzüne gülümser?"],
  ["secret-five-minutes", "Kim \"aramızda kalsın\" deyip 5 dakikada herkese anlatır?"],
  ["delete-group-message", "Kim grup sohbetine attığı mesajı silip hiç yazmamış gibi davranır?"],
  ["never-repays-debt", "Kim borç alıp ödemeyi asla hatırlamaz?"],
  ["meddles-relationships", "Kim herkesin ilişkisine karışıp \"ben söylemiştim\" der?"],
  ["watches-story-ignores-text", "Kim arkadaşının hikayesini izler ama mesajını cevaplamaz?"],
  ["most-jealous-friend", "Kim gruptaki en kıskanç kişidir?"],
  ["fake-neutral-fight", "Kim kavgada \"tarafsızım\" der ama gizlice taraf tutar?"],
  ["hangs-with-friends-ex", "Kim arkadaşının eskisiyle takılmaya devam eder?"],
  ["manipulates-group-trip", "Kim grup tatilinde herkesi manipüle edip istediğini yaptırır?"],
  ["most-likely-ghosted", "Kim \"ghost\" edilmeye en yatkın kişidir?"],
  ["cant-hold-secret", "Kim bir sırrı öğrenince dayanamayıp anons gibi duyurur?"],
  ["always-says-i-was-right", "Kim grup içinde en çok \"ben haklıydım zaten\" der?"],
  ["secret-group-leader", "Kim arkadaşlık grubunun gizli lideri, gerçek patronudur?"],
  ["first-call-in-trouble", "Kim gece yarısı başın belada olsa ilk arayacağın kişidir?"],
  ["cant-take-a-joke", "Kim kendisiyle şaka yapıldığında anlamsız yere alınan/bozulan kişidir?"],
  ["most-generous-friend", "Kim arkadaşları için en cömert kişidir?"],
  ["future-idol-of-group", "Kim bu ortamdan çıkıp idol olacak kişidir?"],
  ["lifts-the-mood", "Kim ortamı en çok neşelendiren ya da ortamı kuran kişidir?"],
  ["vanishes-shared-task", "Kim ortak bir iş/görev olduğunda ortadan kaybolup bahane uydurur?"],
  ["does-all-the-work", "Kim ortak işlerde en fedakar kişi olur ve sonunda bütün işler ona kalır?"],
  ["never-gives-up-admin", "Kim grup sohbetinde adminliği asla başkasına bırakmaz?"],
  ["dislikes-new-partner-instantly", "Kim bir arkadaşının yeni sevgilisini daha ilk günden beğenmediğini belli eder?"],
  ["sulks-forgotten-birthday", "Kim kendi doğum gününde biri unutursa günlerce küser?"],
  ["stalks-ex-online", "Kim sosyal medyada eski sevgilisini gizlice stalklar?"],
  ["detox-triple-order", "Kim \"detoks yapıyorum\" deyip aynı gün üç kez paket sipariş eder?"],
  ["buys-useless-online-junk", "Kim online alışverişte ihtiyacı olmayan en saçma şeyi satın alır?"],
  ["says-workout-stays-in-bed", "Kim \"bugün spor yapacağım\" deyip günü yatakta geçirir?"],
  ["edits-photo-ten-times", "Kim attığı fotoğrafı on kez düzenleyip yine beğenmez?"],
  ["late-night-lonely-story", "Kim gece geç saatte \"yalnız hissediyorum\" hikayesi atar?"],
  ["says-saving-broke-same-week", "Kim \"para biriktiriyorum\" deyip aynı hafta parası biter?"],
  ["bad-mouths-after-fight", "Kim bir arkadaşıyla kavga edince onu grup içinde kötü göstermeye çalışır?"],
  ["same-mistake-again", "Kim \"bu sefer farklı olacak\" deyip yine aynı hatayı yapar?"],
  ["nonstop-dating-app-search", "Kim flört uygulamalarında hiç durmadan kız arar?"],
  ["hides-heartbreak", "Kim kalbi kırılsa bile bunu asla belli etmez?"],
  ["night-plans-forgotten", "Kim gece yatmadan önce yarın için kocaman bir plan yapar ama sabah hiçbirini hatırlamaz?"],
  ["just-bread-full-bags", "Kim markete \"sadece ekmek almaya\" gidip poşetlerle geri döner?"],
  ["snooze-ten-still-tired", "Kim sabah alarmını on kez erteleyip yine de \"hiç uyumadım\" der?"],
  ["one-percent-battery-announcement", "Kim telefonu %1'deyken herkese \"şarjım bitiyor, bir şey olursa arama\" diye duyuru yapar?"],
  ["binge-whole-season-overnight", "Kim yeni bir diziye başlayınca sabaha kadar tüm sezonu bitirir?"],
  ["gym-membership-first-week-only", "Kim spor salonuna üye olup sadece ilk hafta gider?"],
  ["new-hobby-forgotten", "Kim gece \"yeni bir hobi edineceğim\" diye yemin edip sabah unutur?"],
  ["solo-concert-at-home", "Kim evde yalnızken kendine konser veriyormuş gibi dans eder?"],
  ["rewatches-still-surprised", "Kim aynı filmi onuncu kez izlerken yine de sona şaşırır?"],
  ["full-day-scrolling", "Kim bir günü tamamen telefonu kaydırarak (scroll) geçirir?"],
  ["early-tomorrow-never-remembers", "Kim \"yarın erken kalkacağım\" der ama saat kaçta yattığını asla hatırlamaz?"],
  ["caught-singing-in-car", "Kim arabada yalnızken yüksek sesle şarkı söyleyip kırmızı ışıkta yakalanır?"],
  ["cleans-later-never", "Kim evde \"ben sonra temizlerim\" deyip asla temizlemeyen kişidir?"],
  ["midnight-fridge-raid", "Kim gece yarısı acıkıp mutfakta karanlıkta sessizce yemek arar?"],
  ["first-to-loot-apocalypse", "Kim kıyamet kopsa yağmayı ilk başlatan kişi olur?"],
  ["gets-away-with-murder", "Kim bir cinayet işlese hayatta asla yakalanmaz?"],
  ["gang-boss-in-a-week", "Kim bir çeteye katılsa bir hafta içinde patron olur?"],
  ["phone-during-apocalypse", "Kim dünya sona ererken hâlâ telefonuna bakar?"],
  ["ruins-the-heist", "Kim bir soygunda plan yapan değil her şeyi batıran kişi olur?"],
  ["convinces-kidnapper", "Kim bir kaçırılma senaryosunda kaçıranı ikna edip tarafını değiştirir?"],
  ["first-to-die-disaster-movie", "Kim bir felaket filminde ilk ölen karakter olur?"],
  ["cult-leader-most-followers", "Kim bir tarikat kurup en fazla takipçiyi toplar?"],
  ["sells-out-humanity", "Kim uzaylı istilasında insanlığı satıp kendini kurtarır?"],
  ["switches-sides-in-war", "Kim bir savaş çıksa ilk taraf değiştiren kişi olur?"],
  ["best-at-gaslighting", "Kim fark ettirmeden en iyi \"gaslighting\" yapan kişidir?"],
  ["real-conspiracy-nobody-believes", "Kim gerçek bir komployu yaşayıp kimseye inandıramaz?"],
  ["sacrifices-everyone-else", "Kim bir felaket senaryosunda herkesi feda edip kendini kurtarır?"],
  ["the-real-killer-twist", "Kim bir dedektif filminde son sahnede asıl katil çıkar?"],
  ["first-to-lose-it-space", "Kim uzay istasyonunda tek başına kalıp ilk delirir?"],
  ["revenge-plan-never-executed", "Kim bir intikam planı kurup asla uygulamaya cesaret edemez?"],
  ["fake-identity-reveal", "Kim bir gün gerçek kimliğinin sahte olduğu ortaya çıkacak kişidir?"],
  ["dystopian-dictator", "Kim distopik bir dünyada diktatör olur?"],
  ["attention-at-own-funeral", "Kim kendi cenazesinde bile dikkat çekmeye çalışır?"],
  ["rats-everyone-out", "Kim bu odadaki herkesi bir soruşturmada ele verecek ilk kişidir?"],
  ["talks-when-they-leave", "Kim biri ortamda yokken arkasından en çok konuşan kişidir?"],
  ["most-two-faced", "Kim grupta en iki yüzlü davranan kişidir?"],
  ["secretly-jealous-of-success", "Kim birinin başarısını duyunca içten içe en çok kıskanan kişidir?"],
  ["ruins-game-after-losing", "Kim arkadaşlarıyla oyun oynarken bir kere kaybedince oyunu bozar?"],
  ["ridiculous-no-regrets", "Kim bazen çok saçma sapan işler yapar ama asla pişman olmaz?"]
] as const

describe("Most Likely To question bank", () => {
  it("includes each of the 100 requested prompts exactly once", () => {
    expect(requestedQuestions).toHaveLength(100)
    for (const [id, tr] of requestedQuestions) {
      const matches = MOST_LIKELY_TO_QUESTIONS.filter(question => question.text.tr === tr)
      expect(matches, tr).toHaveLength(1)
      expect(matches[0]!.id).toBe(id)
    }
  })

  it("uses unique stable ids and resolves every question", () => {
    const ids = MOST_LIKELY_TO_QUESTIONS.map(question => question.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const question of MOST_LIKELY_TO_QUESTIONS) {
      expect(resolveQuestion(question.id)).toBe(question)
    }
  })

  it.each(languages)("has complete, distinct %s text without duplicate prompts", lang => {
    const seen = new Set<string>()
    for (const question of MOST_LIKELY_TO_QUESTIONS) {
      expect(Object.keys(question.text).sort()).toEqual([...languages].sort())
      const text = question.text[lang]
      expect(text.trim(), question.id).not.toBe("")
      expect(text, question.id).toBe(text.trim())
      expect(text, question.id).not.toContain("�")
      if (lang !== "en") expect(text, question.id).not.toBe(question.text.en)
      if (lang === "ar" || lang === "ku") {
        expect(text, question.id).toMatch(/[؀-ۿ]/u)
      }
      const normalized = text.normalize("NFKC").toLocaleLowerCase(lang)
        .replace(/[\p{P}\p{Z}\p{Cf}]/gu, "")
      expect(seen.has(normalized), question.id).toBe(false)
      seen.add(normalized)
    }
  })

  it("only uses the existing four categories and keeps each category populated", () => {
    const categories = ["funny", "friendship", "daily", "chaos"]
    for (const question of MOST_LIKELY_TO_QUESTIONS) {
      expect(categories).toContain(question.category)
    }
    for (const category of categories) {
      expect(MOST_LIKELY_TO_QUESTIONS.filter(q => q.category === category).length).toBeGreaterThanOrEqual(10)
    }
  })
})
