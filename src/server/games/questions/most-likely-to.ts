import type { LocalizedText } from "@shared/types.js"
import type { MostLikelyToCategory } from "@shared/most-likely-to.js"

/**
 * Questions for "Most Likely To".
 *
 * The shape is the one a `questions` table would have, so moving this list
 * into the database later is a loader change and nothing else — ids are
 * stable and are what the room stores, never the text.
 *
 * The Arabic and Kurdish strings are ordinary logical-order text. Nothing here
 * is pre-reversed; direction is the renderer's job (`dir` on <html>).
 */

export interface Question {
  id: string
  category: MostLikelyToCategory
  text: LocalizedText
}

export const MOST_LIKELY_TO_QUESTIONS: readonly Question[] = [
  // ── Funny ──────────────────────────────────────────────────────────
  {
    id: "like-exs-story",
    category: "funny",
    text: {
      en: "Who accidentally likes their ex's story while secretly stalking their profile?",
      tr: "Kim gizlice takip ettiği eski sevgilisinin hikayesini yanlışlıkla beğenir?",
      ar: "من الذي يعجب بقصة حبيبه السابق بالخطأ وهو يتابعه بالسر؟",
      ku: "کێ کاتێک بە نهێنی سۆشیال میدیای دڵدارە پێشووی خۆی دەبینێت، بەهەڵە لایک لە هەڵبژاردەکەی دەدات؟"
    }
  },
  {
    id: "typing-never-sends",
    category: "funny",
    text: {
      en: "Who leaves \"typing...\" showing on WhatsApp and never actually sends the message?",
      tr: "Kim WhatsApp'ta \"yazıyor...\" yazıp asla mesaj atmaz?",
      ar: "من الذي يترك كتابة \"يكتب الآن...\" على واتساب ولا يرسل الرسالة أبداً؟",
      ku: "کێ لە واتسئاپدا \"دەنووسێت...\" دەردەکەوێت بەڵام هەرگیز نامەکە نانێرێت؟"
    }
  },
  {
    id: "delete-story-fast",
    category: "funny",
    text: {
      en: "Who posts a story, deletes it five minutes later, and assumes nobody saw it?",
      tr: "Kim attığı hikayeyi 5 dakika sonra silip \"kimse görmedi zaten\" sanır?",
      ar: "من الذي ينشر ستوري ثم يحذفه بعد خمس دقائق ويظن أن لا أحد شاهده؟",
      ku: "کێ ستۆرییەک بڵاو دەکاتەوە و دوای ٥ خولەک دەیسڕێتەوە و وا دەزانێت کەس نەیبینیوە؟"
    }
  },
  {
    id: "mirror-self-compliment",
    category: "funny",
    text: {
      en: "Who looks in the mirror and says \"okay I'm actually gorgeous\" out loud?",
      tr: "Kim aynada kendine bakıp \"yok artık çok yakışıklıyım/güzelim\" der?",
      ar: "من الذي ينظر إلى المرآة ويقول لنفسه \"أنا وسيم/جميلة جداً فعلاً\"؟",
      ku: "کێ لە ئاوێنە سەیری خۆی دەکات و بە دەنگی بەرز دەڵێت \"بەڕاستی زۆر جوانم\"؟"
    }
  },
  {
    id: "fart-blame-dog",
    category: "funny",
    text: {
      en: "Who farts in public and blames the dog?",
      tr: "Kim toplulukta gaz çıkarıp suçu köpeğe atar?",
      ar: "من الذي يطلق ريحاً أمام الجميع ثم يلقي اللوم على الكلب؟",
      ku: "کێ لەناو کۆمەڵدا با دەردەدات و تاوانەکە دەخاتە سەر سەگ؟"
    }
  },
  {
    id: "eyes-closed-photos",
    category: "funny",
    text: {
      en: "Who always has their eyes closed in every group photo?",
      tr: "Kim grup fotoğrafında hep gözü kapalı çıkar?",
      ar: "من الذي تظهر عيناه مغمضتين في كل صورة جماعية؟",
      ku: "کێ لە هەموو وێنە کۆمەڵایەتییەکاندا هەمیشە چاوی داخراوە؟"
    }
  },
  {
    id: "bathroom-phone-marathon",
    category: "funny",
    text: {
      en: "Who disappears into the bathroom with their phone for 20 minutes?",
      tr: "Kim tuvalette telefonla 20 dakika kaybolur?",
      ar: "من الذي يختفي في الحمام مع هاتفه لمدة 20 دقيقة؟",
      ku: "کێ بۆ ٢٠ خولەک لەگەڵ مۆبایلەکەی لە تەوالێتدا ون دەبێت؟"
    }
  },
  {
    id: "diet-midnight-kebab",
    category: "funny",
    text: {
      en: "Who says \"I'm on a diet\" and then orders kebab at midnight?",
      tr: "Kim \"diyet yapıyorum\" deyip gece yarısı kebap siparişi verir?",
      ar: "من الذي يقول \"أنا على حمية\" ثم يطلب كباباً في منتصف الليل؟",
      ku: "کێ دەڵێت \"ڕژیمم گرتووە\" بەڵام لە نیوەشەودا داوای کەباب دەکات؟"
    }
  },
  {
    id: "same-joke-tenth-time",
    category: "funny",
    text: {
      en: "Who tells the same joke for the tenth time and still laughs at it themselves?",
      tr: "Kim aynı esprisini 10. kez anlatıp yine kendi güler?",
      ar: "من الذي يعيد النكتة نفسها للمرة العاشرة ويضحك عليها هو بنفسه؟",
      ku: "کێ هەمان گاڵتەجاڕی بۆ جاری دەیەم دووبارە دەکاتەوە و هێشتا خۆی پێی پێدەکەنێت؟"
    }
  },
  {
    id: "elevator-mirror-pose",
    category: "funny",
    text: {
      en: "Who poses for themselves in the elevator mirror?",
      tr: "Kim asansördeki aynada kendine poz verir?",
      ar: "من الذي يقف أمام مرآة المصعد ليتخذ وضعية لنفسه؟",
      ku: "کێ لەناو ئاسانسێردا لەبەردەم ئاوێنە پۆز بۆ خۆی دەگرێت؟"
    }
  },
  {
    id: "cancel-plans-secret-party",
    category: "funny",
    text: {
      en: "Who cancels going out at the last minute saying \"I'm tired\" but their story that night shows them partying?",
      tr: "Kim dışarı çıkma planını son anda iptal edip \"yorgunum\" der ama gece hikayesinde parti yapar?",
      ar: "من الذي يلغي خطة الخروج في اللحظة الأخيرة بحجة \"أنا متعب\" لكن ستوريه في تلك الليلة يظهره في حفلة؟",
      ku: "کێ پلانی دەرچوون لە دوایین ساتدا هەڵدەوەشێنێتەوە بە بیانووی \"ماندووم\" بەڵام ستۆرییەکەی ئەو شەوە پارتی نیشان دەدات؟"
    }
  },
  {
    id: "fall-claim-intentional",
    category: "funny",
    text: {
      en: "Who trips and falls in front of everyone, then claims \"I meant to do that\"?",
      tr: "Kim herkesin önünde takılıp düşer ve \"ben böyle yapmıştım\" der?",
      ar: "من الذي يتعثر ويسقط أمام الجميع ثم يقول \"كنت أقصد ذلك\"؟",
      ku: "کێ لەبەردەم هەمووان دەکەوێت و دواتر دەڵێت \"بە مەبەست وام کرد\"؟"
    }
  },
  {
    id: "screen-share-leak",
    category: "funny",
    text: {
      en: "Who shares their screen and accidentally shows everyone their private messages?",
      tr: "Kim ekranını paylaşırken özel mesajlarını herkese gösterir?",
      ar: "من الذي يشارك شاشته ويظهر رسائله الخاصة للجميع دون قصد؟",
      ku: "کێ کاتێک شاشەکەی هاوبەش دەکات بەبێ ئەوەی بزانێت نامە تایبەتەکانی بۆ هەموو کەس دەردەکەوێت؟"
    }
  },
  {
    id: "laugh-at-own-line",
    category: "funny",
    text: {
      en: "Who cracks up laughing at their own line and can't finish the sentence?",
      tr: "Kim bir replik söylerken kendi kendine gülüp cümleyi bitiremez?",
      ar: "من الذي يضحك على نكتته الخاصة وهو يرويها فلا يستطيع إكمال الجملة؟",
      ku: "کێ کاتێک گاڵتەیەک دەڵێت خۆی پێی پێدەکەنێت و ناتوانێت دەربڕینەکە تەواو بکات؟"
    }
  },
  {
    id: "pure-narcissist",
    category: "funny",
    text: {
      en: "Who has the biggest unearned ego and thinks they're better than everyone in the group?",
      tr: "Kim kendini grupta herkesten üstün gören kişidir?",
      ar: "من الذي يظن نفسه أفضل من الجميع في المجموعة بلا أي سبب؟",
      ku: "کێ خۆی لە هەمووان لە کۆمەڵەکەدا باشتر دەبینێت بەبێ هیچ هۆکارێک؟"
    }
  },
  {
    id: "nobody-understands-him",
    category: "funny",
    text: {
      en: "Who sometimes talks and nobody has any idea what they just said?",
      tr: "Kim bazen konuştuğunda ne dediği hiç anlaşılmaz?",
      ar: "من الذي أحياناً يتكلم ولا يفهم أحد ماذا يقصد؟",
      ku: "کێ هەندێک جار قسە دەکات و کەس تێناگات چی دەڵێت؟"
    }
  },
  {
    id: "talks-too-much-headache",
    category: "funny",
    text: {
      en: "Who talks so much they give everyone a headache?",
      tr: "Kim o kadar çok konuşur ki kafanızı şişirir?",
      ar: "من الذي يتكلم كثيراً لدرجة أنه يصدع رؤوس الجميع؟",
      ku: "کێ ئەوەندە زۆر قسە دەکات کە سەری هەمووان دەئێشێنێت؟"
    }
  },
  {
    id: "jokes-too-far",
    category: "funny",
    text: {
      en: "Who jokes around so much they end up hurting people's feelings?",
      tr: "Kim çok fazla şaka yapıp karşısındakini kırar?",
      ar: "من الذي يمزح كثيراً لدرجة أنه يجرح مشاعر من أمامه؟",
      ku: "کێ ئەوەندە گاڵتە دەکات کە سەرئەنجام دڵی لای بەرامبەری دەشکێنێت؟"
    }
  },
  {
    id: "believes-fake-news",
    category: "funny",
    text: {
      en: "Who believes every piece of fake news they hear and repeats it to the whole group?",
      tr: "Kim her duyduğu yalan bilgiye inanıp arkadaş ortamında anlatır?",
      ar: "من الذي يصدق كل معلومة كاذبة يسمعها وينقلها لكل الأصدقاء؟",
      ku: "کێ هەموو زانیارییەکی درۆینی کە دەیبیستێت باوەڕی پێدەکات و بۆ هەموو هاوڕێکان دەیگێڕێتەوە؟"
    }
  },
  {
    id: "chases-girls-denies-it",
    category: "funny",
    text: {
      en: "Who is obsessed with chasing girls but will never admit it?",
      tr: "Kim kızlara çok düşkündür ama bunu asla kabul etmez?",
      ar: "من الذي مهووس بالمطاردة وراء الفتيات لكنه لا يعترف بذلك أبداً؟",
      ku: "کێ زۆر دڵبەستەی کچانە بەڵام هەرگیز دان بەوەدا نانێت؟"
    }
  },
  {
    id: "wrong-number-chat",
    category: "funny",
    text: {
      en: "Who calls the wrong number and chats for five minutes before realizing it's a stranger?",
      tr: "Kim yanlış numarayı arayıp beş dakika boyunca kimle konuştuğunu anlamadan sohbet eder?",
      ar: "من الذي يتصل برقم خطأ ويتحدث خمس دقائق قبل أن يدرك أنه يتكلم مع شخص غريب؟",
      ku: "کێ ژمارەیەکی هەڵە بانگ دەکات و ٥ خولەک قسە دەکات پێش ئەوەی بزانێت لەگەڵ کەسێکی نەناسراو دەدوێت؟"
    }
  },
  {
    id: "hot-mic-meeting",
    category: "funny",
    text: {
      en: "Who leaves their mic on in an online meeting and gets caught saying something they shouldn't?",
      tr: "Kim online toplantıda mikrofonu açık unutup arkasından duymaması gereken bir şey söyler?",
      ar: "من الذي ينسى الميكروفون مفتوحاً في اجتماع أونلاين ويُسمع وهو يقول شيئاً لا يجب أن يُسمع؟",
      ku: "کێ لە کۆبوونەوەیەکی ئۆنلایندا مایکەکەی کراوە جێدەهێڵێت و شتێک دەڵێت کە نابێت کەس بیبیستێت؟"
    }
  },
  {
    id: "taxi-wrong-address",
    category: "funny",
    text: {
      en: "Who sends their taxi to the wrong address and only realizes it halfway there?",
      tr: "Kim aldığı taksiyi yanlış adrese gönderip yolun ortasında anlar?",
      ar: "من الذي يرسل التاكسي إلى عنوان خاطئ ولا يكتشف ذلك إلا في منتصف الطريق؟",
      ku: "کێ تاکسییەکە بۆ ناونیشانی هەڵە دەنێرێت و تەنها لە ناوەڕاستی ڕێگادا تێدەگات؟"
    }
  },
  {
    id: "laughing-fit-meeting",
    category: "funny",
    text: {
      en: "Who gets a laughing fit at the most serious moment and derails the whole meeting?",
      tr: "Kim en ciddi anda gülme krizine girip toplantıyı dağıtır?",
      ar: "من الذي تنتابه نوبة ضحك في أكثر لحظة جدية فيفسد الاجتماع بأكمله؟",
      ku: "کێ لە جددیترین ساتدا کەوتنی پێکەنینی لێدێت و هەموو کۆبوونەوەکە تێکدەدات؟"
    }
  },
  {
    id: "regret-in-public",
    category: "funny",
    text: {
      en: "Who says the exact sentence they'll later regret, right in the middle of a crowd?",
      tr: "Kim \"keşke söylemeseydim\" dediği cümleyi tam kalabalığın ortasında söyler?",
      ar: "من الذي يقول الجملة التي سيندم عليها لاحقاً في وسط حشد من الناس بالضبط؟",
      ku: "کێ ئەو دەربڕینەی کە دواتر پەشیمان دەبێتەوە لێی، دەڵێت لە ناوەڕاستی خەڵکێکی زۆردا؟"
    }
  },

  // ── Friendship ─────────────────────────────────────────────────────
  {
    id: "most-drama-group",
    category: "friendship",
    text: {
      en: "Who causes the most drama in the friend group?",
      tr: "Kim arkadaş grubunda en çok drama çıkarır?",
      ar: "من الذي يفتعل أكبر قدر من الدراما في مجموعة الأصدقاء؟",
      ku: "کێ لە کۆمەڵی هاوڕێکاندا زۆرترین دراما دروست دەکات؟"
    }
  },
  {
    id: "talks-behind-smiles-front",
    category: "friendship",
    text: {
      en: "Who talks about everyone behind their back and smiles to their face?",
      tr: "Kim herkesin arkasından konuşup yüzüne gülümser?",
      ar: "من الذي يتحدث عن الجميع من وراء ظهورهم ويبتسم في وجوههم؟",
      ku: "کێ لە پشتەوە قسەی هەمووان دەکات بەڵام لە بەردەمیاندا زەردەخەنە دەکات؟"
    }
  },
  {
    id: "secret-five-minutes",
    category: "friendship",
    text: {
      en: "Who says \"keep this between us\" and tells everyone within five minutes?",
      tr: "Kim \"aramızda kalsın\" deyip 5 dakikada herkese anlatır?",
      ar: "من الذي يقول \"خليها بيننا\" ثم يخبر الجميع خلال خمس دقائق؟",
      ku: "کێ دەڵێت \"با تەنها لەنێوان ئێمەدا بمێنێتەوە\" بەڵام لە ماوەی ٥ خولەکدا بۆ هەمووان دەیڵێتەوە؟"
    }
  },
  {
    id: "delete-group-message",
    category: "friendship",
    text: {
      en: "Who deletes a message from the group chat and acts like it never happened?",
      tr: "Kim grup sohbetine attığı mesajı silip hiç yazmamış gibi davranır?",
      ar: "من الذي يحذف رسالة أرسلها في محادثة المجموعة ويتصرف وكأنه لم يكتبها أبداً؟",
      ku: "کێ نامەیەک کە لە چاتی کۆمەڵدا ناردوویەتی دەسڕێتەوە و وا هەڵسوکەوت دەکات وەک هەرگیز نەینووسیبێت؟"
    }
  },
  {
    id: "never-repays-debt",
    category: "friendship",
    text: {
      en: "Who borrows money and conveniently never remembers to pay it back?",
      tr: "Kim borç alıp ödemeyi asla hatırlamaz?",
      ar: "من الذي يستدين المال ولا يتذكر أبداً أن يرده؟",
      ku: "کێ قەرز دەکات و هەرگیز لەبیری نایەت گەڕاندنەوەی؟"
    }
  },
  {
    id: "meddles-relationships",
    category: "friendship",
    text: {
      en: "Who meddles in everyone's relationships and says \"I told you so\"?",
      tr: "Kim herkesin ilişkisine karışıp \"ben söylemiştim\" der?",
      ar: "من الذي يتدخل في علاقات الجميع ثم يقول \"أنا حذرتك\"؟",
      ku: "کێ خۆی دەخاتە ناو پەیوەندییەکانی هەمووان و دواتر دەڵێت \"من پێم گوتیت\"؟"
    }
  },
  {
    id: "watches-story-ignores-text",
    category: "friendship",
    text: {
      en: "Who watches your story right away but takes days to answer your text?",
      tr: "Kim arkadaşının hikayesini izler ama mesajını cevaplamaz?",
      ar: "من الذي يشاهد ستوري صديقه فوراً لكنه يتأخر أياماً في الرد على رسائله؟",
      ku: "کێ ستۆرییەکەت بە خێرایی دەبینێت بەڵام ڕۆژان وەڵامی نامەکەت نادات؟"
    }
  },
  {
    id: "most-jealous-friend",
    category: "friendship",
    text: {
      en: "Who is the most jealous person in the group?",
      tr: "Kim gruptaki en kıskanç kişidir?",
      ar: "من هو أكثر شخص غيرة في المجموعة؟",
      ku: "کێ لە کۆمەڵەکەدا چاوپیسترین کەسە؟"
    }
  },
  {
    id: "fake-neutral-fight",
    category: "friendship",
    text: {
      en: "Who says \"I'm staying neutral\" during a fight but secretly takes a side?",
      tr: "Kim kavgada \"tarafsızım\" der ama gizlice taraf tutar?",
      ar: "من الذي يقول \"أنا محايد\" أثناء الشجار لكنه يختار طرفاً سراً؟",
      ku: "کێ لە کاتی دەمەقاڵێدا دەڵێت \"بێلایەنم\" بەڵام بە نهێنی لایەکی دەگرێت؟"
    }
  },
  {
    id: "hangs-with-friends-ex",
    category: "friendship",
    text: {
      en: "Who keeps hanging out with a friend's ex?",
      tr: "Kim arkadaşının eskisiyle takılmaya devam eder?",
      ar: "من الذي يستمر بالتسكع مع حبيب صديقه السابق؟",
      ku: "کێ بەردەوام لەگەڵ دڵدارە پێشووی هاوڕێکەی دەگەڕێت؟"
    }
  },
  {
    id: "manipulates-group-trip",
    category: "friendship",
    text: {
      en: "Who manipulates the whole group trip into always going their way?",
      tr: "Kim grup tatilinde herkesi manipüle edip istediğini yaptırır?",
      ar: "من الذي يتلاعب بالجميع في رحلة المجموعة ليفعلوا ما يريده هو فقط؟",
      ku: "کێ لە گەشتی کۆمەڵدا هەمووان مانیپولەیت دەکات تاکو ئەوەی ئەو دەیەوێت جێبەجێ بکرێت؟"
    }
  },
  {
    id: "most-likely-ghosted",
    category: "friendship",
    text: {
      en: "Who is the most likely to get ghosted?",
      tr: "Kim \"ghost\" edilmeye en yatkın kişidir?",
      ar: "من الأكثر عرضة لأن يتم تجاهله وقطع التواصل معه فجأة؟",
      ku: "کێ زۆرترین ئەگەری هەیە کەسێک لەناکاو پەیوەندی لەگەڵی ببڕێت؟"
    }
  },
  {
    id: "cant-hold-secret",
    category: "friendship",
    text: {
      en: "Who can't hold a secret for more than five minutes and announces it to everyone?",
      tr: "Kim bir sırrı öğrenince dayanamayıp anons gibi duyurur?",
      ar: "من الذي لا يستطيع كتم سر لأكثر من خمس دقائق ويعلنه للجميع؟",
      ku: "کێ ناتوانێت زیاتر لە ٥ خولەک نهێنییەک بشارێتەوە و بۆ هەمووان ڕایدەگەیەنێت؟"
    }
  },
  {
    id: "always-says-i-was-right",
    category: "friendship",
    text: {
      en: "Who says \"I was right all along\" the most in the group?",
      tr: "Kim grup içinde en çok \"ben haklıydım zaten\" der?",
      ar: "من الذي يقول \"أنا كنت محقاً من البداية\" أكثر من الجميع؟",
      ku: "کێ لە کۆمەڵەکەدا لە هەمووان زیاتر دەڵێت \"من لە سەرەتاوە ڕاست بووم\"؟"
    }
  },
  {
    id: "secret-group-leader",
    category: "friendship",
    text: {
      en: "Who is the secret leader, the real boss, of the friend group?",
      tr: "Kim arkadaşlık grubunun gizli lideri, gerçek patronudur?",
      ar: "من هو القائد الحقيقي والزعيم الخفي لمجموعة الأصدقاء؟",
      ku: "کێ سەرکردەی نهێنی و پاترۆنی ڕاستەقینەی کۆمەڵی هاوڕێکانە؟"
    }
  },
  {
    id: "first-call-in-trouble",
    category: "friendship",
    text: {
      en: "Who is the person you'd call first if you were in trouble at 4am?",
      tr: "Kim gece yarısı başın belada olsa ilk arayacağın kişidir?",
      ar: "من هو الشخص الذي ستتصل به أولاً لو وقعت في مشكلة في الرابعة فجراً؟",
      ku: "کێ ئەو کەسەیە کە ئەگەر شەو کاتژمێر ٤ تووشی کێشە بیت یەکەم کەس بانگی دەکەیت؟"
    }
  },
  {
    id: "cant-take-a-joke",
    category: "friendship",
    text: {
      en: "Who gets needlessly offended whenever anyone jokes with them?",
      tr: "Kim kendisiyle şaka yapıldığında anlamsız yere alınan/bozulan kişidir?",
      ar: "من الذي يستاء بلا سبب كلما مزح أحد معه؟",
      ku: "کێ کاتێک یەکێک گاڵتەی پێدەکات بەبێ هۆکار توڕە دەبێت؟"
    }
  },
  {
    id: "most-generous-friend",
    category: "friendship",
    text: {
      en: "Who is the most generous person when it comes to their friends?",
      tr: "Kim arkadaşları için en cömert kişidir?",
      ar: "من هو الأكثر كرماً تجاه أصدقائه؟",
      ku: "کێ بۆ هاوڕێکانی لە هەمووان بەخشندەترە؟"
    }
  },
  {
    id: "future-idol-of-group",
    category: "friendship",
    text: {
      en: "Who from this group is going to end up a famous idol one day?",
      tr: "Kim bu ortamdan çıkıp idol olacak kişidir?",
      ar: "من هذه المجموعة سيصبح نجماً مشهوراً يوماً ما؟",
      ku: "کێ لەم کۆمەڵەدا ڕۆژێک دەبێتە ئایدۆلێکی بەناوبانگ؟"
    }
  },
  {
    id: "lifts-the-mood",
    category: "friendship",
    text: {
      en: "Who is the one who always lifts the mood or gets the party started?",
      tr: "Kim ortamı en çok neşelendiren ya da ortamı kuran kişidir?",
      ar: "من الذي يرفع معنويات الجميع دائماً أو يشعل أجواء السهرة؟",
      ku: "کێ هەمیشە کەشوهەوای هاوڕێکان خۆش دەکات یان کۆڕوکۆبوونەوەکە بەڕێوە دەبات؟"
    }
  },
  {
    id: "vanishes-shared-task",
    category: "friendship",
    text: {
      en: "Who disappears and invents excuses whenever there's a shared task to do?",
      tr: "Kim ortak bir iş/görev olduğunda ortadan kaybolup bahane uydurur?",
      ar: "من الذي يختفي ويختلق الأعذار كلما كان هناك عمل مشترك يجب إنجازه؟",
      ku: "کێ کاتێک کارێکی هاوبەش هەیە ون دەبێت و بیانوو هەڵدەبەستێت؟"
    }
  },
  {
    id: "does-all-the-work",
    category: "friendship",
    text: {
      en: "Who is the most selfless when there's shared work, and ends up doing it all alone?",
      tr: "Kim ortak işlerde en fedakar kişi olur ve sonunda bütün işler ona kalır?",
      ar: "من الذي يكون الأكثر تضحية في الأعمال المشتركة، فينتهي به الأمر يقوم بكل شيء بمفرده؟",
      ku: "کێ لە کارە هاوبەشەکاندا لە هەمووان زیاتر خۆگوزەرانە و لە کۆتاییدا هەموو کارەکان دەکەوێتە سەر شانی؟"
    }
  },
  {
    id: "never-gives-up-admin",
    category: "friendship",
    text: {
      en: "Who will never, ever hand over group chat admin rights to anyone else?",
      tr: "Kim grup sohbetinde adminliği asla başkasına bırakmaz?",
      ar: "من الذي لا يتنازل عن صلاحيات الإدارة في محادثة المجموعة مهما حدث؟",
      ku: "کێ هەرگیز دەسەڵاتی ئەدمینایەتی چاتی کۆمەڵ نادات بە کەسێکی تر؟"
    }
  },
  {
    id: "dislikes-new-partner-instantly",
    category: "friendship",
    text: {
      en: "Who makes it obvious from day one that they don't like a friend's new partner?",
      tr: "Kim bir arkadaşının yeni sevgilisini daha ilk günden beğenmediğini belli eder?",
      ar: "من الذي يجعل من الواضح منذ اليوم الأول أنه لا يحب حبيب صديقه الجديد؟",
      ku: "کێ لە یەکەم ڕۆژەوە دەریدەخات کە هاوڕێی نوێی هاوڕێکەی پێی خۆش نییە؟"
    }
  },
  {
    id: "sulks-forgotten-birthday",
    category: "friendship",
    text: {
      en: "Who sulks for days if someone forgets their birthday?",
      tr: "Kim kendi doğum gününde biri unutursa günlerce küser?",
      ar: "من الذي يزعل لأيام لو نسي أحدهم عيد ميلاده؟",
      ku: "کێ ئەگەر یەکێک ڕۆژی لەدایکبوونی لەبیر بکات بۆ چەند ڕۆژێک قارە دەبێت؟"
    }
  },

  // ── Daily Life ─────────────────────────────────────────────────────
  {
    id: "stalks-ex-online",
    category: "daily",
    text: {
      en: "Who secretly stalks their ex on social media?",
      tr: "Kim sosyal medyada eski sevgilisini gizlice stalklar?",
      ar: "من الذي يتابع حبيبه السابق سراً على مواقع التواصل؟",
      ku: "کێ بە نهێنی دڵدارە پێشووی خۆی لە سۆشیال میدیا چاودێری دەکات؟"
    }
  },
  {
    id: "detox-triple-order",
    category: "daily",
    text: {
      en: "Who says \"I'm detoxing\" and orders takeout three times the same day?",
      tr: "Kim \"detoks yapıyorum\" deyip aynı gün üç kez paket sipariş eder?",
      ar: "من الذي يقول \"أنا أعمل ديتوكس\" ثم يطلب الطعام ثلاث مرات في اليوم نفسه؟",
      ku: "کێ دەڵێت \"دیتۆکس دەکەم\" بەڵام لە هەمان ڕۆژدا سێ جار داوای خواردنی دەرەوە دەکات؟"
    }
  },
  {
    id: "buys-useless-online-junk",
    category: "daily",
    text: {
      en: "Who buys the most ridiculous, completely unnecessary thing while online shopping?",
      tr: "Kim online alışverişte ihtiyacı olmayan en saçma şeyi satın alır?",
      ar: "من الذي يشتري أغرب شيء لا يحتاجه إطلاقاً أثناء التسوق عبر الإنترنت؟",
      ku: "کێ لە کڕینی ئۆنلایندا سەیرترین شتی بێ پێویست دەکڕێت؟"
    }
  },
  {
    id: "says-workout-stays-in-bed",
    category: "daily",
    text: {
      en: "Who says \"I'm working out today\" and then spends the whole day in bed?",
      tr: "Kim \"bugün spor yapacağım\" deyip günü yatakta geçirir?",
      ar: "من الذي يقول \"سأتمرن اليوم\" ثم يقضي اليوم كله في السرير؟",
      ku: "کێ دەڵێت \"ئەمڕۆ وەرزش دەکەم\" بەڵام هەموو ڕۆژەکە لەناو جێگادا بەسەردەبات؟"
    }
  },
  {
    id: "edits-photo-ten-times",
    category: "daily",
    text: {
      en: "Who edits a photo ten times before posting and still hates it?",
      tr: "Kim attığı fotoğrafı on kez düzenleyip yine beğenmez?",
      ar: "من الذي يعدّل صورته عشر مرات قبل نشرها ولا يزال غير راضٍ عنها؟",
      ku: "کێ وێنەیەک دە جار دەگۆڕێت پێش بڵاوکردنەوەی و هێشتا پێی خۆش نییە؟"
    }
  },
  {
    id: "late-night-lonely-story",
    category: "daily",
    text: {
      en: "Who posts a \"feeling lonely\" story late at night?",
      tr: "Kim gece geç saatte \"yalnız hissediyorum\" hikayesi atar?",
      ar: "من الذي ينشر ستوري \"أشعر بالوحدة\" في وقت متأخر من الليل؟",
      ku: "کێ درەنگانی شەو ستۆرییەکی \"هەستم بە تەنیایی دەکەم\" بڵاو دەکاتەوە؟"
    }
  },
  {
    id: "says-saving-broke-same-week",
    category: "daily",
    text: {
      en: "Who says \"I'm saving money\" and is broke by the end of the same week?",
      tr: "Kim \"para biriktiriyorum\" deyip aynı hafta parası biter?",
      ar: "من الذي يقول \"أنا أوفّر المال\" وينفد ماله في نفس الأسبوع؟",
      ku: "کێ دەڵێت \"پارە کۆدەکەمەوە\" بەڵام لە هەمان هەفتەدا پارەکەی تەواو دەبێت؟"
    }
  },
  {
    id: "bad-mouths-after-fight",
    category: "daily",
    text: {
      en: "Who tries to make a friend look bad in front of the group after a fight with them?",
      tr: "Kim bir arkadaşıyla kavga edince onu grup içinde kötü göstermeye çalışır?",
      ar: "من الذي يحاول تشويه صورة صديقه أمام المجموعة بعد أن يتشاجر معه؟",
      ku: "کێ دوای دەمەقاڵێ لەگەڵ هاوڕێیەکی، هەوڵ دەدات لەبەردەم کۆمەڵدا خراپی نیشان بدات؟"
    }
  },
  {
    id: "same-mistake-again",
    category: "daily",
    text: {
      en: "Who says \"this time will be different\" and makes the exact same mistake again?",
      tr: "Kim \"bu sefer farklı olacak\" deyip yine aynı hatayı yapar?",
      ar: "من الذي يقول \"هذه المرة ستكون مختلفة\" ثم يكرر نفس الخطأ تماماً؟",
      ku: "کێ دەڵێت \"ئەم جارە جیاواز دەبێت\" بەڵام هەمان هەڵە دووبارە دەکاتەوە؟"
    }
  },
  {
    id: "nonstop-dating-app-search",
    category: "daily",
    text: {
      en: "Who is nonstop searching for girls on dating apps?",
      tr: "Kim flört uygulamalarında hiç durmadan kız arar?",
      ar: "من الذي يبحث عن الفتيات بلا توقف في تطبيقات المواعدة؟",
      ku: "کێ بەردەوام و بەبێ وەستان لە ئەپەکانی دۆستایەتیدا بەدوای کچدا دەگەڕێت؟"
    }
  },
  {
    id: "hides-heartbreak",
    category: "daily",
    text: {
      en: "Who never shows it, even when their heart is broken?",
      tr: "Kim kalbi kırılsa bile bunu asla belli etmez?",
      ar: "من الذي لا يظهر انكساره أبداً حتى عندما ينكسر قلبه؟",
      ku: "کێ تەنانەت کاتێک دڵی دەشکێت هەرگیز ئەوە دەرناخات؟"
    }
  },
  {
    id: "night-plans-forgotten",
    category: "daily",
    text: {
      en: "Who makes an ambitious plan for tomorrow right before bed and remembers none of it in the morning?",
      tr: "Kim gece yatmadan önce yarın için kocaman bir plan yapar ama sabah hiçbirini hatırlamaz?",
      ar: "من الذي يضع خطة ضخمة لليوم التالي قبل النوم ولا يتذكر منها شيئاً في الصباح؟",
      ku: "کێ پێش خەوتن پلانێکی گەورە بۆ سبەینێ دادەنێت بەڵام بەیانی هیچی لەبیر نامێنێتەوە؟"
    }
  },
  {
    id: "just-bread-full-bags",
    category: "daily",
    text: {
      en: "Who goes to the store \"just for bread\" and comes back with bags full of everything?",
      tr: "Kim markete \"sadece ekmek almaya\" gidip poşetlerle geri döner?",
      ar: "من الذي يذهب إلى المتجر \"لشراء الخبز فقط\" ويعود محملاً بالأكياس؟",
      ku: "کێ دەچێتە دووکان \"تەنها بۆ کڕینی نان\" و بە کیسەی پڕەوە دەگەڕێتەوە؟"
    }
  },
  {
    id: "snooze-ten-still-tired",
    category: "daily",
    text: {
      en: "Who hits snooze ten times and still claims \"I didn't sleep at all\"?",
      tr: "Kim sabah alarmını on kez erteleyip yine de \"hiç uyumadım\" der?",
      ar: "من الذي يؤجل المنبه عشر مرات ثم يقول \"لم أنم إطلاقاً\"؟",
      ku: "کێ زەنگی بیدارکەرەوە دە جار دوا دەخات و پاشان دەڵێت \"بە تەواوی نەخەوتووم\"؟"
    }
  },
  {
    id: "one-percent-battery-announcement",
    category: "daily",
    text: {
      en: "Who announces to everyone \"my battery's at 1%, don't call me if something happens\" like it's a public emergency?",
      tr: "Kim telefonu %1'deyken herkese \"şarjım bitiyor, bir şey olursa arama\" diye duyuru yapar?",
      ar: "من الذي يعلن للجميع \"بطاريتي على وشك النفاد، لا تتصلوا بي إذا حصل شيء\" وكأنه إعلان طوارئ؟",
      ku: "کێ بە هەمووان ڕایدەگەیەنێت \"باتریم لە کۆتاییدایە، پەیوەندیم پێوە مەکەن\" وەک ئاگادارکردنەوەیەکی گشتی؟"
    }
  },
  {
    id: "binge-whole-season-overnight",
    category: "daily",
    text: {
      en: "Who starts a new show and finishes the entire season by sunrise?",
      tr: "Kim yeni bir diziye başlayınca sabaha kadar tüm sezonu bitirir?",
      ar: "من الذي يبدأ مسلسلاً جديداً وينهي الموسم كاملاً حتى الصباح؟",
      ku: "کێ کاتێک دەستپێدەکات بە سیریالێکی نوێ، هەموو وەرزەکە تا بەیانی تەواو دەکات؟"
    }
  },
  {
    id: "gym-membership-first-week-only",
    category: "daily",
    text: {
      en: "Who signs up for a gym membership and only ever shows up the first week?",
      tr: "Kim spor salonuna üye olup sadece ilk hafta gider?",
      ar: "من الذي يشترك في صالة رياضية ولا يذهب إلا في الأسبوع الأول فقط؟",
      ku: "کێ ئەندامیێتی هۆڵی وەرزش وەردەگرێت و تەنها هەفتەی یەکەم دەچێت؟"
    }
  },
  {
    id: "new-hobby-forgotten",
    category: "daily",
    text: {
      en: "Who swears at night they'll take up a new hobby and forgets all about it by morning?",
      tr: "Kim gece \"yeni bir hobi edineceğim\" diye yemin edip sabah unutur?",
      ar: "من الذي يقسم ليلاً أنه سيبدأ هواية جديدة وينسى الأمر تماماً في الصباح؟",
      ku: "کێ شەو سوێند دەخوات \"هۆبیەکی نوێ هەڵدەگرم\" بەڵام بەیانی تەواو لەبیری دەچێت؟"
    }
  },
  {
    id: "solo-concert-at-home",
    category: "daily",
    text: {
      en: "Who dances around the house alone like they're performing a concert?",
      tr: "Kim evde yalnızken kendine konser veriyormuş gibi dans eder?",
      ar: "من الذي يرقص في البيت وحده وكأنه يقيم حفلاً غنائياً؟",
      ku: "کێ کاتێک بە تەنهایە لە ماڵەوە هەڵدەبزوێت وەک کۆنسێرتێک پێشکەش بکات؟"
    }
  },
  {
    id: "rewatches-still-surprised",
    category: "daily",
    text: {
      en: "Who watches the same movie for the tenth time and still acts surprised by the ending?",
      tr: "Kim aynı filmi onuncu kez izlerken yine de sona şaşırır?",
      ar: "من الذي يشاهد نفس الفيلم للمرة العاشرة ولا يزال يتفاجأ بنهايته؟",
      ku: "کێ هەمان فیلم بۆ جاری دەیەم دەبینێت و هێشتا لە کۆتاییەکەی سەرسام دەبێت؟"
    }
  },
  {
    id: "full-day-scrolling",
    category: "daily",
    text: {
      en: "Who spends an entire day doing nothing but scrolling their phone?",
      tr: "Kim bir günü tamamen telefonu kaydırarak (scroll) geçirir?",
      ar: "من الذي يقضي يوماً كاملاً وهو فقط يمرر شاشة هاتفه؟",
      ku: "کێ ڕۆژێکی تەواو تەنها بە سکرۆڵکردنی مۆبایل بەسەردەبات؟"
    }
  },
  {
    id: "early-tomorrow-never-remembers",
    category: "daily",
    text: {
      en: "Who says \"I'll get up early tomorrow\" but never remembers what time they actually went to sleep?",
      tr: "Kim \"yarın erken kalkacağım\" der ama saat kaçta yattığını asla hatırlamaz?",
      ar: "من الذي يقول \"سأستيقظ باكراً غداً\" لكنه لا يتذكر أبداً في أي ساعة نام؟",
      ku: "کێ دەڵێت \"بەیانی زوو هەڵدەستم\" بەڵام هەرگیز لەبیری نامێنێت کەی خەوتووە؟"
    }
  },
  {
    id: "caught-singing-in-car",
    category: "daily",
    text: {
      en: "Who gets caught singing at the top of their lungs alone in the car at a red light?",
      tr: "Kim arabada yalnızken yüksek sesle şarkı söyleyip kırmızı ışıkta yakalanır?",
      ar: "من الذي يُضبط وهو يغني بأعلى صوته وحيداً في السيارة عند الإشارة الحمراء؟",
      ku: "کێ لە کاتی وەستان لەبەردەم چرای سوردا بە تەنها لەناو ئۆتۆمبێلدا بە دەنگی بەرز گۆرانی دەڵێت و ئاشکرا دەبێت؟"
    }
  },
  {
    id: "cleans-later-never",
    category: "daily",
    text: {
      en: "Who is the one who says \"I'll clean it later\" and never actually cleans it?",
      tr: "Kim evde \"ben sonra temizlerim\" deyip asla temizlemeyen kişidir?",
      ar: "من الذي يقول دائماً \"سأنظف لاحقاً\" ولا ينظف أبداً؟",
      ku: "کێ هەمیشە دەڵێت \"دواتر پاکی دەکەمەوە\" بەڵام هەرگیز پاکی ناکاتەوە؟"
    }
  },
  {
    id: "midnight-fridge-raid",
    category: "daily",
    text: {
      en: "Who gets hungry at midnight and quietly searches the kitchen in the dark for food?",
      tr: "Kim gece yarısı acıkıp mutfakta karanlıkta sessizce yemek arar?",
      ar: "من الذي يجوع في منتصف الليل ويبحث بهدوء عن الطعام في المطبخ المظلم؟",
      ku: "کێ لە نیوەشەودا برسی دەبێت و بە بێدەنگی لە تاریکیدا لە چێشتخانە بەدوای خواردندا دەگەڕێت؟"
    }
  },

  // ── Chaos ──────────────────────────────────────────────────────────
  {
    id: "first-to-loot-apocalypse",
    category: "chaos",
    text: {
      en: "Who would be the first to start looting if the apocalypse hit?",
      tr: "Kim kıyamet kopsa yağmayı ilk başlatan kişi olur?",
      ar: "من سيكون أول من يبدأ بالنهب لو حدثت نهاية العالم؟",
      ku: "کێ ئەگەر کۆتایی جیهان بێت یەکەم کەس دەبێت دەست بە تاڵانکردن بکات؟"
    }
  },
  {
    id: "gets-away-with-murder",
    category: "chaos",
    text: {
      en: "Who could commit a murder and never get caught?",
      tr: "Kim bir cinayet işlese hayatta asla yakalanmaz?",
      ar: "من الذي لو ارتكب جريمة قتل لن يُقبض عليه أبداً؟",
      ku: "کێ ئەگەر تاوانێکی کوشتن بکات هەرگیز ناگیرێت؟"
    }
  },
  {
    id: "gang-boss-in-a-week",
    category: "chaos",
    text: {
      en: "Who would join a gang and become the boss within a week?",
      tr: "Kim bir çeteye katılsa bir hafta içinde patron olur?",
      ar: "من الذي لو انضم إلى عصابة سيصبح زعيمها خلال أسبوع؟",
      ku: "کێ ئەگەر بچێتە ناو تاقمێکی تاوانکار لە ماوەی هەفتەیەکدا دەبێتە سەرکردەی؟"
    }
  },
  {
    id: "phone-during-apocalypse",
    category: "chaos",
    text: {
      en: "Who would still be checking their phone as the world ends?",
      tr: "Kim dünya sona ererken hâlâ telefonuna bakar?",
      ar: "من الذي سيظل ينظر إلى هاتفه حتى وهو العالم ينتهي؟",
      ku: "کێ تەنانەت کاتێک جیهان کۆتایی دێت هێشتا سەیری مۆبایلەکەی دەکات؟"
    }
  },
  {
    id: "ruins-the-heist",
    category: "chaos",
    text: {
      en: "Who would be the one who ruins the whole plan in a heist, not the one who made it?",
      tr: "Kim bir soygunda plan yapan değil her şeyi batıran kişi olur?",
      ar: "من سيكون الشخص الذي يفسد الخطة بأكملها في عملية سرقة، لا من وضعها؟",
      ku: "کێ لە جیاتی دانانی پلان بۆ دزینێک، ئەو کەسە دەبێت کە هەموو شتێک تێکدەدات؟"
    }
  },
  {
    id: "convinces-kidnapper",
    category: "chaos",
    text: {
      en: "Who could get kidnapped and end up convincing the kidnapper to switch sides?",
      tr: "Kim bir kaçırılma senaryosunda kaçıranı ikna edip tarafını değiştirir?",
      ar: "من الذي لو تعرض للخطف سيقنع الخاطف بتغيير موقفه والانضمام إليه؟",
      ku: "کێ ئەگەر بدزرێتەوە، دزەرەکە قایل دەکات لایەنی خۆی بگۆڕێت؟"
    }
  },
  {
    id: "first-to-die-disaster-movie",
    category: "chaos",
    text: {
      en: "Who would be the first character to die in a disaster movie?",
      tr: "Kim bir felaket filminde ilk ölen karakter olur?",
      ar: "من سيكون أول شخصية تموت في فيلم كوارث؟",
      ku: "کێ لە فیلمێکی کارەساتیدا یەکەم کەسایەتی دەبێت کە دەمرێت؟"
    }
  },
  {
    id: "cult-leader-most-followers",
    category: "chaos",
    text: {
      en: "Who could start a cult and gather the most followers?",
      tr: "Kim bir tarikat kurup en fazla takipçiyi toplar?",
      ar: "من الذي لو أسس طائفة سيجمع أكبر عدد من الأتباع؟",
      ku: "کێ ئەگەر تەریقەتێک دامەزرێنێت زۆرترین شوێنکەوتووان کۆدەکاتەوە؟"
    }
  },
  {
    id: "sells-out-humanity",
    category: "chaos",
    text: {
      en: "Who would sell out humanity to save themselves during an alien invasion?",
      tr: "Kim uzaylı istilasında insanlığı satıp kendini kurtarır?",
      ar: "من الذي سيبيع البشرية لينقذ نفسه في حال غزو الفضائيين؟",
      ku: "کێ لە هێرشی زیندەوەرانی گەردوونیدا مرۆڤایەتی دەفرۆشێت بۆ ڕزگارکردنی خۆی؟"
    }
  },
  {
    id: "switches-sides-in-war",
    category: "chaos",
    text: {
      en: "Who would be the first to switch sides if a war broke out?",
      tr: "Kim bir savaş çıksa ilk taraf değiştiren kişi olur?",
      ar: "من سيكون أول من يبدّل موقفه لو اندلعت حرب؟",
      ku: "کێ ئەگەر شەڕێک ڕووبدات یەکەم کەس دەبێت لایەن بگۆڕێت؟"
    }
  },
  {
    id: "best-at-gaslighting",
    category: "chaos",
    text: {
      en: "Who is secretly the best at gaslighting people without them noticing?",
      tr: "Kim fark ettirmeden en iyi \"gaslighting\" yapan kişidir?",
      ar: "من الذي يجيد التلاعب النفسي بالآخرين دون أن يلاحظوا؟",
      ku: "کێ بەبێ ئەوەی کەس هەستی پێبکات باشترین کەسە لە مانیپولەکردنی دەروونی خەڵک؟"
    }
  },
  {
    id: "real-conspiracy-nobody-believes",
    category: "chaos",
    text: {
      en: "Who would actually live through a real conspiracy and never be able to convince anyone it happened?",
      tr: "Kim gerçek bir komployu yaşayıp kimseye inandıramaz?",
      ar: "من الذي لو عاش مؤامرة حقيقية لن يستطيع إقناع أحد بها؟",
      ku: "کێ ئەگەر بەڕاستی تووشی پیلانێکی ڕاستەقینە بێت، ناتوانێت کەس قایل بکات؟"
    }
  },
  {
    id: "sacrifices-everyone-else",
    category: "chaos",
    text: {
      en: "Who would sacrifice everyone else to save themselves in a disaster scenario?",
      tr: "Kim bir felaket senaryosunda herkesi feda edip kendini kurtarır?",
      ar: "من الذي سيضحي بالجميع لينقذ نفسه في سيناريو كارثي؟",
      ku: "کێ لە دۆخێکی کارەساتیدا هەمووان قوربانی دەدات بۆ ڕزگارکردنی خۆی؟"
    }
  },
  {
    id: "the-real-killer-twist",
    category: "chaos",
    text: {
      en: "Who would turn out to be the real killer in the final scene of a detective movie?",
      tr: "Kim bir dedektif filminde son sahnede asıl katil çıkar?",
      ar: "من سيتضح أنه القاتل الحقيقي في المشهد الأخير من فيلم بوليسي؟",
      ku: "کێ لە دیمەنی کۆتایی فیلمێکی پۆلیسیدا دەردەکەوێت کە بکوژە ڕاستەقینەکەیە؟"
    }
  },
  {
    id: "first-to-lose-it-space",
    category: "chaos",
    text: {
      en: "Who would be the first to lose their mind if stuck alone on a space station?",
      tr: "Kim uzay istasyonunda tek başına kalıp ilk delirir?",
      ar: "من سيفقد عقله أولاً لو بقي وحيداً في محطة فضائية؟",
      ku: "کێ ئەگەر بە تەنها لە شاراوگەیەکی گەردوونیدا بمێنێتەوە یەکەم کەس دەبێت شێت بێت؟"
    }
  },
  {
    id: "revenge-plan-never-executed",
    category: "chaos",
    text: {
      en: "Who would plan out an elaborate revenge scheme and never actually have the guts to go through with it?",
      tr: "Kim bir intikam planı kurup asla uygulamaya cesaret edemez?",
      ar: "من الذي سيضع خطة انتقام معقدة ولن تكون لديه الشجاعة لتنفيذها أبداً؟",
      ku: "کێ پلانێکی تۆڵەسەندنەوەی ئاڵۆز دادەنێت بەڵام هەرگیز ئازایەتی جێبەجێکردنی نابێت؟"
    }
  },
  {
    id: "fake-identity-reveal",
    category: "chaos",
    text: {
      en: "Who is the one whose real identity will turn out to be fake one day?",
      tr: "Kim bir gün gerçek kimliğinin sahte olduğu ortaya çıkacak kişidir?",
      ar: "من الذي سيتضح يوماً ما أن هويته الحقيقية مزيفة؟",
      ku: "کێ ئەو کەسەیە کە ڕۆژێک دەردەکەوێت ناسنامەی ڕاستەقینەی ساختەیە؟"
    }
  },
  {
    id: "dystopian-dictator",
    category: "chaos",
    text: {
      en: "Who would become the dictator in a dystopian world?",
      tr: "Kim distopik bir dünyada diktatör olur?",
      ar: "من الذي سيصبح الديكتاتور في عالم ديستوبي؟",
      ku: "کێ لە جیهانێکی دیستۆپیدا دەبێتە دیکتاتۆر؟"
    }
  },
  {
    id: "attention-at-own-funeral",
    category: "chaos",
    text: {
      en: "Who would try to steal the spotlight even at their own funeral?",
      tr: "Kim kendi cenazesinde bile dikkat çekmeye çalışır?",
      ar: "من الذي سيحاول لفت الأنظار حتى في جنازته الخاصة؟",
      ku: "کێ تەنانەت لە بۆنە پرسەی خۆشیدا هەوڵ دەدات سەرنج ڕابکێشێت؟"
    }
  },
  {
    id: "rats-everyone-out",
    category: "chaos",
    text: {
      en: "Who would be the first person in this room to rat everyone else out during an investigation?",
      tr: "Kim bu odadaki herkesi bir soruşturmada ele verecek ilk kişidir?",
      ar: "من سيكون أول شخص في هذه الغرفة يشي بالجميع أثناء تحقيق؟",
      ku: "کێ یەکەم کەس دەبێت لەم ژوورەدا لە کاتی لێکۆڵینەوەیەکدا هەمووان بفرۆشێت؟"
    }
  },
  {
    id: "talks-when-they-leave",
    category: "chaos",
    text: {
      en: "Who talks about someone the most as soon as they leave the room?",
      tr: "Kim biri ortamda yokken arkasından en çok konuşan kişidir?",
      ar: "من الذي يتحدث عن شخص أكثر من الجميع بمجرد أن يغادر الغرفة؟",
      ku: "کێ کاتێک یەکێک لە هاوڕێکان ژوورەکە بەجێدەهێڵێت لە هەمووان زیاتر باسی دەکات؟"
    }
  },
  {
    id: "most-two-faced",
    category: "chaos",
    text: {
      en: "Who is the most two-faced person in the group?",
      tr: "Kim grupta en iki yüzlü davranan kişidir?",
      ar: "من هو أكثر شخص ذو وجهين في المجموعة؟",
      ku: "کێ لە کۆمەڵەکەدا دووڕووترین کەسە؟"
    }
  },
  {
    id: "secretly-jealous-of-success",
    category: "chaos",
    text: {
      en: "Who gets the most secretly jealous whenever they hear about someone else's success?",
      tr: "Kim birinin başarısını duyunca içten içe en çok kıskanan kişidir?",
      ar: "من الذي يغار بصمت أكثر من الجميع عندما يسمع عن نجاح شخص آخر؟",
      ku: "کێ کاتێک سەرکەوتنی کەسێکی تر دەبیستێت لە دڵەوە لە هەمووان زیاتر چاوی پێی دەبات؟"
    }
  },
  {
    id: "ruins-game-after-losing",
    category: "chaos",
    text: {
      en: "Who ruins the whole game the moment they lose once while playing with friends?",
      tr: "Kim arkadaşlarıyla oyun oynarken bir kere kaybedince oyunu bozar?",
      ar: "من الذي يفسد اللعبة بأكملها بمجرد أن يخسر مرة واحدة وهو يلعب مع أصدقائه؟",
      ku: "کێ کاتێک لەگەڵ هاوڕێکانی یاری دەکات، یەک جار ون بکات یارییەکە تێکدەدات؟"
    }
  },
  {
    id: "ridiculous-no-regrets",
    category: "chaos",
    text: {
      en: "Who sometimes does completely ridiculous things and never regrets any of it?",
      tr: "Kim bazen çok saçma sapan işler yapar ama asla pişman olmaz?",
      ar: "من الذي أحياناً يفعل أموراً سخيفة جداً ولا يندم عليها أبداً؟",
      ku: "کێ هەندێک جار کارێکی زۆر گێلانە دەکات بەڵام هەرگیز پەشیمان نابێتەوە؟"
    }
  }
] as const

const byId = new Map(MOST_LIKELY_TO_QUESTIONS.map(q => [q.id, q]))

/** Falls back to the first question: a room must never be stuck without one. */
export function resolveQuestion(id: string): Question {
  return byId.get(id) ?? MOST_LIKELY_TO_QUESTIONS[0]!
}
