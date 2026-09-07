import type { LocalizedText } from "./types.js"

export interface AccessoryDef {
  id: string
  name: LocalizedText
  anchor: "eyes" | "head" | "frame" | "neck"
}

export const ACCESSORIES: AccessoryDef[] = [
  { id: "heart-glasses", anchor: "eyes", name: { en: "Heart glasses", tr: "Kalpli gözlük", ar: "نظارة القلوب", ku: "چاویلکەی دڵ" } },
  { id: "crown", anchor: "head", name: { en: "Little crown", tr: "Minik taç", ar: "تاج صغير", ku: "تاجی بچووک" } },
  { id: "headphones", anchor: "frame", name: { en: "Headphones", tr: "Kulaklık", ar: "سماعات", ku: "گوێگر" } },
  { id: "party-hat", anchor: "head", name: { en: "Party hat", tr: "Parti şapkası", ar: "قبعة الحفلة", ku: "کڵاوی ئاهەنگ" } },
  { id: "round-glasses", anchor: "eyes", name: { en: "Pink glasses", tr: "Pembe gözlük", ar: "نظارة وردية", ku: "چاویلکەی پەمەیی" } },
  { id: "propeller", anchor: "head", name: { en: "Propeller cap", tr: "Pervaneli şapka", ar: "قبعة المروحة", ku: "کڵاوی پەروانە" } },
  { id: "top-hat", anchor: "head", name: { en: "Top hat", tr: "Silindir şapka", ar: "قبعة طويلة", ku: "کڵاوی بەرز" } },
  { id: "snorkel", anchor: "eyes", name: { en: "Snorkel", tr: "Şnorkel", ar: "نظارة الغوص", ku: "چاویلکەی مەلە" } },
  { id: "heart-band", anchor: "frame", name: { en: "Heart headband", tr: "Kalpli taç", ar: "طوق القلوب", ku: "تەوقی دڵ" } },
  { id: "beanie", anchor: "head", name: { en: "Pom-pom beanie", tr: "Ponponlu bere", ar: "قبعة صوفية", ku: "کڵاوی خوری" } },
  { id: "star-glasses", anchor: "eyes", name: { en: "Star glasses", tr: "Yıldızlı gözlük", ar: "نظارة النجوم", ku: "چاویلکەی ئەستێرە" } },
  { id: "bow-tie", anchor: "neck", name: { en: "Bow tie", tr: "Papyon", ar: "ربطة فراشة", ku: "پاپیۆن" } }
]

/** Empty string explicitly removes an accessory. Missing fields preserve old saves. */
export function isAccessoryId(id: string): boolean {
  return id === "" || ACCESSORIES.some(a => a.id === id)
}

export function findAccessory(id: string): AccessoryDef | undefined {
  return ACCESSORIES.find(a => a.id === id)
}
