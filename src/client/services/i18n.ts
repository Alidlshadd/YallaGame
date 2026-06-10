import type { LangCode } from "@shared/types.js"
import en, { type Translations } from "../i18n/en.js"
import tr from "../i18n/tr.js"
import ar from "../i18n/ar.js"
import ku from "../i18n/ku.js"

const DICTIONARIES: Record<LangCode, Translations> = { en, tr, ar, ku }
const RTL: Record<LangCode, boolean> = { en: false, tr: false, ar: true, ku: true }
const STORAGE_KEY = "role-room:lang"

let current: LangCode = (localStorage.getItem(STORAGE_KEY) as LangCode | null) ?? "en"

export function t(key: keyof Translations): string {
  return DICTIONARIES[current][key]
}

export function getLang(): LangCode { return current }

export function setLang(lang: LangCode): void {
  current = lang
  localStorage.setItem(STORAGE_KEY, lang)
  document.documentElement.lang = lang
  document.documentElement.dir = RTL[lang] ? "rtl" : "ltr"
  applyAll()
}

export function applyAll(): void {
  document.documentElement.lang = current
  document.documentElement.dir = RTL[current] ? "rtl" : "ltr"
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset.i18n as keyof Translations | undefined
    if (key && key in DICTIONARIES[current]) el.textContent = DICTIONARIES[current][key]
  }
}
