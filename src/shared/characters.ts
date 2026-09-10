import type { LocalizedText } from "./types.js"

export interface CharacterDef {
  id: string
  name: LocalizedText
  /** Position in the approved portrait atlas, when using atlas artwork. */
  portrait?: number
  image?: string
  accessories?: boolean
}

/**
 * The cast a player picks from when they join a room.
 *
 * The original animal ids remain valid for existing saved seats. The new
 * selectable cast uses the owner's approved human and fantasy portraits.
 *
 * The id is the contract: it is what the server stores, what travels over the
 * wire. Retire ids instead of reusing them for different identities.
 */
const LEGACY_CHARACTERS: CharacterDef[] = [
  { id: "owl",     name: { en: "Owl",     tr: "Baykuş",   ar: "بومة",    ku: "کوندە" } },
  { id: "fox",     name: { en: "Fox",     tr: "Tilki",    ar: "ثعلب",    ku: "ڕێوی" } },
  { id: "raven",   name: { en: "Raven",   tr: "Kuzgun",   ar: "غراب",    ku: "قەلەڕەش" } },
  { id: "wolf",    name: { en: "Wolf",    tr: "Kurt",     ar: "ذئب",     ku: "گورگ" } },
  { id: "cat",     name: { en: "Cat",     tr: "Kedi",     ar: "قطة",     ku: "پشیلە" } },
  { id: "bear",    name: { en: "Bear",    tr: "Ayı",      ar: "دب",      ku: "ورچ" } },
  { id: "stag",    name: { en: "Stag",    tr: "Geyik",    ar: "أيل",     ku: "ئاسک" } },
  { id: "moth",    name: { en: "Moth",    tr: "Pervane",  ar: "فراشة",   ku: "پەروانە" } },
  { id: "serpent", name: { en: "Serpent", tr: "Yılan",    ar: "أفعى",    ku: "مار" } },
  { id: "hound",   name: { en: "Hound",   tr: "Tazı",     ar: "كلب صيد", ku: "تاژی" } },
  { id: "hare",    name: { en: "Hare",    tr: "Tavşan",   ar: "أرنب",    ku: "کەروێشک" } },
  { id: "lion",    name: { en: "Lion",    tr: "Aslan",    ar: "أسد",     ku: "شێر" } }
]

/** Original ids remain readable for saved rooms; new picks use the approved cast. */
export const CHARACTERS: CharacterDef[] = [
  ["ace", "Ace", "As", "آس", "ئاس"],
  ["ruby", "Ruby", "Yakut", "ياقوت", "یاقووت"],
  ["pebble", "Pebble", "Çakıl", "حصاة", "بەردۆک"],
  ["gizmo", "Gizmo", "Gizmo", "غيزمو", "گیزمۆ"],
  ["silver", "Silver", "Gümüş", "فضة", "زیو"],
  ["fuzz", "Fuzz", "Pofuduk", "منفوش", "پەشمووک"],
  ["wisp", "Wisp", "Hayalet", "طيف", "خێو"],
  ["nova", "Nova", "Nova", "نوفا", "نۆڤا"],
  ["bolt", "Bolt", "Cıvata", "بولت", "بۆڵت"],
  ["splash", "Splash", "Şıpır", "رذاذ", "پرژە"],
  ["rusty", "Rusty", "Bakır", "نحاسي", "مسین"],
  ["luna", "Luna", "Luna", "لونا", "لوونا"],
  ["ember", "Ember", "Köz", "جمرة", "پشکۆ"],
  ["blinky", "Blinky", "Tekgöz", "غمزة", "چاوک"],
  ["cosmo", "Cosmo", "Kozmo", "كوزمو", "کۆزمۆ"],
  ["jade", "Jade", "Yeşim", "يشم", "یەشم"],
  ["pixie", "Pixie", "Peri", "جنية", "پەری"],
  ["mochi", "Mochi", "Mantar", "فطر", "قارچک"],
  ["onyx", "Onyx", "Oniks", "عقيق", "عەقیق"],
  ["milo", "Milo", "Milo", "ميلو", "میلۆ"]
].map(([id, en, tr, ar, ku], portrait) => ({
  id: id!, name: { en: en!, tr: tr!, ar: ar!, ku: ku! }, portrait
}))

CHARACTERS.push({
  id: "ali", name: { en: "Ali", tr: "Ali", ar: "علي", ku: "علي" },
  image: "/assets/characters/ali.webp", accessories: false
})

CHARACTERS.push({
  id: "mahmud", name: { en: "Mahmud", tr: "Mahmud", ar: "محمود", ku: "مەحموود" },
  image: "/assets/characters/mahmud.webp", accessories: false
})

CHARACTERS.push({
  id: "morinji", name: { en: "Morinji", tr: "Morinji", ar: "مورينجي", ku: "مۆرینجی" },
  image: "/assets/characters/morinji.webp", accessories: false
})

export const CHARACTER_IDS: readonly string[] = [...CHARACTERS, ...LEGACY_CHARACTERS].map(c => c.id)

export function isCharacterId(value: string): boolean {
  return CHARACTER_IDS.includes(value)
}

export function findCharacter(id: string): CharacterDef | undefined {
  return CHARACTERS.find(c => c.id === id) ?? LEGACY_CHARACTERS.find(c => c.id === id)
}
