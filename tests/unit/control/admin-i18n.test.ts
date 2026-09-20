// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { bind, dictionary, languages, setLanguage, t, textNode } from "../../../src/client/control/i18n.js"

afterEach(() => {
  document.body.replaceChildren()
  setLanguage("en")
})
describe("Admin translation contracts", () => {
  it("provides four nonempty translations and identical interpolation slots for every key", () => {
    for (const translations of Object.values(dictionary)) {
      expect(translations).toHaveLength(4)
      const slots = [...translations[0].matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
      for (const text of translations) {
        expect(text.trim().length).toBeGreaterThan(0)
        expect([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()).toEqual(slots)
      }
    }
  })
  it("updates text and accessible attributes without replacing inputs or parsing HTML", () => {
    const label = document.createElement("label"),
      input = document.createElement("input")
    label.append(textNode(t("siteName")), input)
    input.value = "Unsaved <script>text</script>"
    bind(input, t("siteName"), "aria-label")
    bind(input, t("description"), "title")
    document.body.append(label)
    for (const [index, language] of languages.entries()) {
      setLanguage(language)
      expect(document.documentElement.lang).toBe(language)
      expect(document.documentElement.dir).toBe(index > 1 ? "rtl" : "ltr")
      expect(localStorage.getItem("yalla-admin-language")).toBe(language)
      expect(label.firstChild?.textContent).toBe(dictionary.siteName[index])
      expect(input.getAttribute("aria-label")).toBe(dictionary.siteName[index])
      expect(input.title).toBe(dictionary.description[index])
      expect(label.lastChild).toBe(input)
      expect(input.value).toBe("Unsaved <script>text</script>")
      expect(document.querySelector("script")).toBeNull()
    }
  })
  it("resolves dynamic interpolation again on a locale change", () => {
    const message = textNode(t("upload", { label: t("cover") }))
    document.body.append(message)
    setLanguage("tr")
    expect(message.textContent).toBe("Kapak görseli yükle")
    setLanguage("ar")
    expect(message.textContent).toBe("تحميل صورة الغلاف")
  })
})
