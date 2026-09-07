import type { LocalizedText } from "./types.js"

export interface CharacterDef {
  id: string
  name: LocalizedText
}

/**
 * The cast a player picks from when they join a room.
 *
 * Deliberately animals and nothing else. Every online game here is a
 * hidden-role game, so an avatar that looks like a role — a vampire, a
 * detective, a doctor — would read as a tell across the table. These carry
 * personality without claiming anything about the person holding them.
 *
 * The id is the contract: it is what the server stores, what travels over the
 * wire, and the filename of the artwork under `public/assets/characters/`.
 * Adding one means adding the image; removing one orphans anybody who had it,
 * so retire an id rather than reusing it.
 */
export const CHARACTERS: CharacterDef[] = [
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

export const CHARACTER_IDS: readonly string[] = CHARACTERS.map(c => c.id)

export function isCharacterId(value: string): boolean {
  return CHARACTER_IDS.includes(value)
}

export function findCharacter(id: string): CharacterDef | undefined {
  return CHARACTERS.find(c => c.id === id)
}
