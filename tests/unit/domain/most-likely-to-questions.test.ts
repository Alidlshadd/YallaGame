import { describe, expect, it } from "vitest"
import { MOST_LIKELY_TO_QUESTIONS, resolveQuestion } from "@server/games/questions/most-likely-to.js"

const languages = ["tr", "en", "ar", "ku"] as const

// Regression manifest for the 100 requested prompts, including reused stable ids.
const requestedQuestions = [
  ["always-late-hangout", "Kim en çok geç kalır?"],
  ["reply-three-days-later", "Kim mesajlara en geç cevap verir?"],
  ["become-famous", "Kim bir gün ünlü olur?"],
  ["text-wrong-person", "Kim yanlış kişiye mesaj atar?"],
  ["forget-birthday", "Kim kendi doğum gününü unutabilir?"],
  ["fall-asleep-easily", "Kim en kolay uyuyakalır?"],
  ["lose-phone-every-week", "Kim bir hafta boyunca telefonunu kaybetmeden yaşayamaz?"],
  ["order-food-most", "Kim en çok yemek sipariş eder?"],
  ["take-most-photos", "Kim en çok fotoğraf çeker?"],
  ["group-jokester", "Kim arkadaş grubunda en çok şaka yapar?"],
  ["laugh-wrong-moment", "Kim yanlış zamanda gülmeye başlar?"],
  ["panic-over-small-things", "Kim en küçük şeyden panik olur?"],
  ["horror-movie-first-to-run", "Kim bir korku filminde ilk kaçar?"],
  ["zombie-apocalypse", "Kim zombi istilasında en uzun süre hayatta kalır?"],
  ["zombie-first-caught", "Kim zombi istilasında ilk yakalanır?"],
  ["wrong-bus", "Kim yanlış otobüse biner?"],
  ["lost-in-another-city", "Kim başka bir şehre gidip yolu kaybeder?"],
  ["lost-using-gps", "Kim Google Maps açıkken bile kaybolur?"],
  ["forget-why-left-home", "Kim evden çıkıp neden çıktığını unutur?"],
  ["search-phone-in-hand", "Kim telefonu elindeyken telefonunu arar?"],
  ["five-minutes-half-hour", "Kim en çok “5 dakikaya geliyorum” deyip yarım saat sonra gelir?"],
  ["snooze-ten-times", "Kim alarmı 10 kez erteler?"],
  ["game-until-morning", "Kim sabaha kadar oyun oynar?"],
  ["angry-game-loser", "Kim bir oyunda kaybedince en çok sinirlenir?"],
  ["suspected-game-cheater", "Kim oyunda hile yaptığından şüphelenilecek ilk kişidir?"],
  ["most-competitive", "Kim en rekabetçi kişidir?"],
  ["worst-at-secrets", "Kim sır saklamakta en kötüdür?"],
  ["knows-all-gossip", "Kim grubun bütün dedikodularını bilir?"],
  ["accidentally-reveal-secret", "Kim istemeden bir sırrı açıklar?"],
  ["best-excuses", "Kim en iyi bahane uydurur?"],
  ["call-teacher-mom", "Kim öğretmene/hocaya yanlışlıkla “anne” diyebilir?"],
  ["study-day-before-exam", "Kim sınava bir gün kala çalışmaya başlar?"],
  ["forget-homework-deadline", "Kim ödevin son tarihini unutur?"],
  ["leave-exam-first", "Kim sınavda en önce çıkar?"],
  ["ace-without-studying", "Kim sınavdan önce “hiç çalışmadım” deyip en yüksek notu alır?"],
  ["fall-asleep-class", "Kim derste uyuyakalabilir?"],
  ["most-coffee-at-school", "Kim okulda/üniversitede en çok kahve içer?"],
  ["sit-in-wrong-class", "Kim yanlış sınıfa girip oturur?"],
  ["forget-presentation", "Kim sunum sırasında ne söyleyeceğini unutur?"],
  ["finish-project-last-night", "Kim projeyi son gece bitirir?"],
  ["start-business-on-whim", "Kim bir gün kendi şirketini kurar?"],
  ["become-millionaire", "Kim milyoner olma ihtimali en yüksek kişidir?"],
  ["spend-everything-on-nothing", "Kim bütün parasını gereksiz bir şeye harcar?"],
  ["best-at-bargaining", "Kim pazarlık yaparken en başarılıdır?"],
  ["accidental-expensive-purchase", "Kim yanlışlıkla çok pahalı bir şey satın alır?"],
  ["most-online-packages", "Kim online alışverişte en çok paket bekler?"],
  ["buy-unneeded-sale-items", "Kim indirim görünce ihtiyacı olmayan şeyi alır?"],
  ["lend-friends-money", "Kim arkadaşlarına sürekli borç verir?"],
  ["forget-to-pay-bill", "Kim hesabı ödemeyi unutur?"],
  ["go-out-without-money", "Kim cebinde para olmadan dışarı çıkar?"],
  ["eat-the-most", "Kim en çok yemek yer?"],
  ["order-food-at-three-am", "Kim gece 3'te yemek sipariş eder?"],
  ["win-spicy-food-contest", "Kim acı yeme yarışmasını kazanır?"],
  ["weird-food-combinations", "Kim en garip yemek kombinasyonunu dener?"],
  ["stare-into-fridge", "Kim buzdolabını açıp 5 dakika hiçbir şey almadan bakar?"],
  ["just-one-bite", "Kim başkasının yemeğinden sürekli “bir lokma” ister?"],
  ["read-menu-twenty-minutes", "Kim restoranda menüyü 20 dakika inceler?"],
  ["same-food-always", "Kim her zaman aynı yemeği sipariş eder?"],
  ["stay-quiet-wrong-order", "Kim yanlış sipariş gelse bile sesini çıkarmaz?"],
  ["kitchen-battlefield", "Kim yemek yapmaya çalışırken mutfağı savaş alanına çevirir?"],
  ["befriend-aliens-first", "Kim uzaylılarla ilk arkadaş olur?"],
  ["photograph-an-alien", "Kim uzaylı görse fotoğraf çekmeye çalışır?"],
  ["plan-world-domination", "Kim dünyayı ele geçirme planı yapabilecek kişidir?"],
  ["secret-agent", "Kim gizli ajan çıkma ihtimali en yüksek kişidir?"],
  ["accidental-cult-leader", "Kim yanlışlıkla bir tarikatın lideri olur?"],
  ["survive-desert-island", "Kim bir adada tek başına yaşamayı başarır?"],
  ["time-travel-to-past", "Kim zamanda yolculuk yapma fırsatı bulsa geçmişe gider?"],
  ["accidentally-change-history", "Kim zamanda yolculuk yapıp yanlışlıkla tarihi değiştirir?"],
  ["argue-with-robots", "Kim robotlarla tartışmaya başlar?"],
  ["befriend-ai", "Kim yapay zekâyla en iyi arkadaş olur?"],
  ["accidentally-go-viral", "Kim bir gün yanlışlıkla viral olur?"],
  ["become-a-meme", "Kim internette meme olur?"],
  ["most-social-followers", "Kim sosyal medyada en çok takipçiye ulaşır?"],
  ["accidental-livestream", "Kim yanlışlıkla canlı yayın açar?"],
  ["forget-camera-is-on", "Kim telefonunun kamerasının açık olduğunu fark etmez?"],
  ["silly-video-million-views", "Kim en saçma videoyu çekip milyonlarca izlenme alır?"],
  ["try-being-influencer", "Kim influencer olmayı dener?"],
  ["forget-account-password", "Kim hesabının şifresini unutur?"],
  ["hundred-open-tabs", "Kim 100 tane sekme açık bırakır?"],
  ["wifi-end-of-world", "Kim Wi-Fi gidince dünyası yıkılmış gibi davranır?"],
  ["friend-group-leader", "Kim arkadaş grubunun lideri olur?"],
  ["calm-everyone-down", "Kim kavga çıktığında herkesi sakinleştirir?"],
  ["instant-friends", "Kim iki dakika içinde herkesle arkadaş olur?"],
  ["shy-with-new-people", "Kim yeni biriyle konuşmaya en çekinen kişidir?"],
  ["make-everyone-laugh", "Kim en çok insanı güldürür?"],
  ["best-advice", "Kim grubun en mantıklı tavsiyesini verir?"],
  ["first-to-agree-bad-idea", "Kim kötü bir fikre ilk “hadi yapalım” der?"],
  ["ignore-own-plan", "Kim plan yapar ama plana kendisi uymaz?"],
  ["organize-group-trip", "Kim tatil planını tamamen organize eder?"],
  ["forget-passport-at-hotel", "Kim tatilde pasaportunu otelde unutur?"],
  ["attend-wrong-wedding", "Kim yanlışlıkla başka bir düğüne katılabilir?"],
  ["wrong-shoes-all-day", "Kim bir gün boyunca yanlış ayakkabıyla dolaşır ve fark etmez?"],
  ["one-item-twenty-purchases", "Kim markete bir şey almaya gidip 20 farklı şeyle geri döner?"],
  ["go-out-in-pajamas", "Kim evden pijamayla çıkıp sonradan fark eder?"],
  ["unrecognized-celebrity", "Kim yanlışlıkla bir ünlüyle konuşup onun ünlü olduğunu anlamaz?"],
  ["talk-to-pet", "Kim kedi veya köpekle ciddi ciddi tartışır?"],
  ["talk-to-self", "Kim aynanın karşısında kendi kendine konuşur?"],
  ["home-alone-concert", "Kim evde tek başınayken konser veriyormuş gibi davranır?"],
  ["sleep-through-end-of-world", "Kim dünyanın son günü olsa bile uyumaya devam eder?"],
  ["chosen-for-most-questions", "Kim bu soruların çoğunda seçilecek kişidir?"]
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
      expect(text, question.id).not.toContain("\uFFFD")
      if (lang !== "en") expect(text, question.id).not.toBe(question.text.en)
      if (lang === "ar" || lang === "ku") {
        expect(text, question.id).toMatch(/[\u0600-\u06ff]/u)
      }
      const normalized = text.normalize("NFKC").toLocaleLowerCase(lang)
        .replace(/[\p{P}\p{Z}\p{Cf}]/gu, "")
      expect(seen.has(normalized), question.id).toBe(false)
      seen.add(normalized)
    }
  })

  it("only uses the existing five categories and keeps each category populated", () => {
    const categories = ["funny", "friendship", "school", "daily", "chaos"]
    for (const question of MOST_LIKELY_TO_QUESTIONS) {
      expect(categories).toContain(question.category)
    }
    for (const category of categories) {
      expect(MOST_LIKELY_TO_QUESTIONS.filter(q => q.category === category).length).toBeGreaterThanOrEqual(10)
    }
  })
})
