import { describe, expect, it } from "vitest"
import { BLUFF_TRIVIA_QUESTIONS, resolveBluffQuestion } from "@server/games/questions/bluff-trivia.js"

const languages = ["tr", "en", "ar", "ku"] as const

describe("Bluff Trivia question bank", () => {
  it("uses unique stable ids and resolves every question", () => {
    const ids = BLUFF_TRIVIA_QUESTIONS.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const question of BLUFF_TRIVIA_QUESTIONS) {
      expect(resolveBluffQuestion(question.id)).toBe(question)
    }
  })

  it("falls back to the first question for an unknown id", () => {
    expect(resolveBluffQuestion("does-not-exist")).toBe(BLUFF_TRIVIA_QUESTIONS[0])
  })

  it.each(languages)("has complete %s text for the question and the correct answer", lang => {
    for (const question of BLUFF_TRIVIA_QUESTIONS) {
      expect(question.question[lang].trim(), `${question.id} question`).not.toBe("")
      expect(question.correctAnswer[lang].trim(), `${question.id} answer`).not.toBe("")
      if (lang === "ar" || lang === "ku") {
        expect(question.question[lang], question.id).toMatch(/[؀-ۿ]/u)
      }
    }
  })

  it("carries at least three decoys per question, each complete in every language", () => {
    for (const question of BLUFF_TRIVIA_QUESTIONS) {
      expect(question.decoys.length, question.id).toBeGreaterThanOrEqual(3)
      for (const decoy of question.decoys) {
        for (const lang of languages) {
          expect(decoy[lang].trim(), question.id).not.toBe("")
        }
      }
    }
  })

  it("never lets a decoy read as the correct answer, in any one language", () => {
    for (const question of BLUFF_TRIVIA_QUESTIONS) {
      for (const lang of languages) {
        const correct = question.correctAnswer[lang].trim().toLocaleLowerCase(lang)
        for (const decoy of question.decoys) {
          expect(decoy[lang].trim().toLocaleLowerCase(lang), question.id).not.toBe(correct)
        }
      }
    }
  })
})
