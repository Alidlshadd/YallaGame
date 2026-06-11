import type { LangCode, LocalizedText } from "@shared/types.js"

export interface SpyWordCategory {
  id: string
  label: LocalizedText
  words: Partial<Record<LangCode, string[]>>
}

export const SPY_WORD_CATEGORIES: readonly SpyWordCategory[] = [
  {
    id: "places",
    label: { ku: "Places", ar: "Places", en: "Places", tr: "Mekanlar" },
    words: {
      en: ["Airport", "Bank", "Beach", "Cinema", "Hospital", "Hotel", "Library", "Museum", "Park", "Police Station", "Restaurant", "School", "Shopping Mall", "Stadium", "Train Station", "University"],
      tr: ["Havalimani", "Banka", "Plaj", "Sinema", "Hastane", "Otel", "Kutuphane", "Muze", "Park", "Polis Merkezi", "Restoran", "Okul", "Alisveris Merkezi", "Stadyum", "Tren Istasyonu", "Universite"]
    }
  },
  {
    id: "food",
    label: { ku: "Food", ar: "Food", en: "Food", tr: "Yemek" },
    words: {
      en: ["Burger", "Coffee", "Doner", "Fish", "Ice Cream", "Kebab", "Lentil Soup", "Pasta", "Pizza", "Rice", "Salad", "Sandwich", "Sushi", "Tea", "Watermelon", "Yogurt"],
      tr: ["Burger", "Kahve", "Doner", "Balik", "Dondurma", "Kebap", "Mercimek Corbasi", "Makarna", "Pizza", "Pilav", "Salata", "Sandvic", "Sushi", "Cay", "Karpuz", "Yogurt"]
    }
  },
  {
    id: "jobs",
    label: { ku: "Jobs", ar: "Jobs", en: "Jobs", tr: "Meslekler" },
    words: {
      en: ["Actor", "Architect", "Barber", "Chef", "Doctor", "Driver", "Engineer", "Farmer", "Journalist", "Lawyer", "Nurse", "Pilot", "Police Officer", "Programmer", "Teacher", "Waiter"],
      tr: ["Oyuncu", "Mimar", "Berber", "Sef", "Doktor", "Sofor", "Muhendis", "Ciftci", "Gazeteci", "Avukat", "Hemsire", "Pilot", "Polis", "Programci", "Ogretmen", "Garson"]
    }
  },
  {
    id: "objects",
    label: { ku: "Objects", ar: "Objects", en: "Objects", tr: "Esya" },
    words: {
      en: ["Backpack", "Book", "Camera", "Chair", "Clock", "Computer", "Door", "Headphones", "Key", "Lamp", "Mirror", "Phone", "Table", "Television", "Umbrella", "Wallet"],
      tr: ["Sirt Cantasi", "Kitap", "Kamera", "Sandalye", "Saat", "Bilgisayar", "Kapi", "Kulaklik", "Anahtar", "Lamba", "Ayna", "Telefon", "Masa", "Televizyon", "Semsiye", "Cuzdan"]
    }
  },
  {
    id: "travel",
    label: { ku: "Travel", ar: "Travel", en: "Travel", tr: "Seyahat" },
    words: {
      en: ["Bus", "Camping", "Cruise", "Desert", "Flight", "Island", "Map", "Passport", "Suitcase", "Subway", "Taxi", "Ticket", "Tour Guide", "Train", "Visa", "Waterfall"],
      tr: ["Otobus", "Kamp", "Gemi Turu", "Col", "Ucus", "Ada", "Harita", "Pasaport", "Valiz", "Metro", "Taksi", "Bilet", "Tur Rehberi", "Tren", "Vize", "Selale"]
    }
  },
  {
    id: "school",
    label: { ku: "School", ar: "School", en: "School", tr: "Okul" },
    words: {
      en: ["Blackboard", "Classroom", "Exam", "Homework", "Lesson", "Marker", "Notebook", "Principal", "Projector", "Recess", "Science Lab", "Student", "Teacher", "Textbook", "Uniform", "Whiteboard"],
      tr: ["Kara Tahta", "Sinif", "Sinav", "Odev", "Ders", "Kalem", "Defter", "Mudur", "Projektor", "Teneffus", "Laboratuvar", "Ogrenci", "Ogretmen", "Ders Kitabi", "Uniforma", "Beyaz Tahta"]
    }
  },
  {
    id: "sports",
    label: { ku: "Sports", ar: "Sports", en: "Sports", tr: "Spor" },
    words: {
      en: ["Basketball", "Boxing", "Chess", "Cycling", "Football", "Goalkeeper", "Gym", "Karate", "Referee", "Running", "Skating", "Stadium", "Swimming", "Tennis", "Volleyball", "Yoga"],
      tr: ["Basketbol", "Boks", "Satranc", "Bisiklet", "Futbol", "Kaleci", "Spor Salonu", "Karate", "Hakem", "Kosmak", "Paten", "Stadyum", "Yuzme", "Tenis", "Voleybol", "Yoga"]
    }
  },
  {
    id: "entertainment",
    label: { ku: "Entertainment", ar: "Entertainment", en: "Entertainment", tr: "Eglence" },
    words: {
      en: ["Concert", "Dance", "Festival", "Game Console", "Karaoke", "Magic Show", "Movie", "Music", "Puzzle", "Radio", "Stage", "Theater", "Toy", "Video Game", "VR Headset", "YouTube"],
      tr: ["Konser", "Dans", "Festival", "Oyun Konsolu", "Karaoke", "Sihirbaz Gosterisi", "Film", "Muzik", "Bulmaca", "Radyo", "Sahne", "Tiyatro", "Oyuncak", "Video Oyunu", "VR Gozluk", "YouTube"]
    }
  },
  {
    id: "city",
    label: { ku: "City", ar: "City", en: "City", tr: "Sehir" },
    words: {
      en: ["Bridge", "Bus Stop", "Cafe", "Crosswalk", "Elevator", "Fire Station", "Market", "Mosque", "Pharmacy", "Post Office", "Street", "Supermarket", "Traffic Light", "Tunnel", "Zoo", "Apartment"],
      tr: ["Kopru", "Durak", "Kafe", "Yaya Gecidi", "Asansor", "Itfaiye", "Pazar", "Cami", "Eczane", "Postane", "Sokak", "Market", "Trafik Lambasi", "Tunel", "Hayvanat Bahcesi", "Apartman"]
    }
  },
  {
    id: "nature",
    label: { ku: "Nature", ar: "Nature", en: "Nature", tr: "Doga" },
    words: {
      en: ["Cave", "Cloud", "Forest", "Garden", "Lake", "Mountain", "Ocean", "Rain", "River", "Rock", "Snow", "Sun", "Tree", "Valley", "Wind", "Volcano"],
      tr: ["Magara", "Bulut", "Orman", "Bahce", "Gol", "Dag", "Okyanus", "Yagmur", "Nehir", "Kaya", "Kar", "Gunes", "Agac", "Vadi", "Ruzgar", "Volkan"]
    }
  }
]

export function parseCustomSpyWords(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map(word => word.trim())
    .filter(word => word.length >= 2)
}

export function getSpyWords(lang: LangCode, categoryIds: readonly string[], customWords: readonly string[]): string[] {
  const selected = new Set(categoryIds)
  const words = SPY_WORD_CATEGORIES.flatMap(category => {
    if (!selected.has(category.id)) return []
    return category.words[lang] ?? category.words.en ?? []
  })
  return [...words, ...customWords]
}

export function pickSpyWord(
  lang: LangCode,
  categoryIds: readonly string[],
  customWordsText: string,
  rng: () => number = Math.random
): string {
  const words = getSpyWords(lang, categoryIds, parseCustomSpyWords(customWordsText))
  if (words.length === 0) throw new Error("NO_SPY_WORDS")
  return words[Math.floor(rng() * words.length)]!
}
