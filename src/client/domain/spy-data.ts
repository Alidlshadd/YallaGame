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
      en: ["Airport", "Amusement Park", "Bank", "Barbershop", "Beach", "Bookstore", "Bus Station", "Cafe", "Cinema", "Factory", "Hospital", "Hotel", "Library", "Museum", "Park", "Pharmacy", "Police Station", "Restaurant", "School", "Shopping Mall", "Stadium", "Supermarket", "Train Station", "University", "Wedding Hall", "Workshop"],
      tr: ["Havalimani", "Lunapark", "Banka", "Berber", "Plaj", "Kitapci", "Otogar", "Kafe", "Sinema", "Fabrika", "Hastane", "Otel", "Kutuphane", "Muze", "Park", "Eczane", "Polis Merkezi", "Restoran", "Okul", "Alisveris Merkezi", "Stadyum", "Supermarket", "Tren Istasyonu", "Universite", "Dugun Salonu", "Atolye"]
    }
  },
  {
    id: "food",
    label: { ku: "Food", ar: "Food", en: "Food", tr: "Yemek" },
    words: {
      en: ["Baklava", "Burger", "Cake", "Chicken", "Coffee", "Doner", "Egg", "Fish", "Fries", "Grilled Meat", "Honey", "Ice Cream", "Kebab", "Lentil Soup", "Noodles", "Pasta", "Pizza", "Rice", "Salad", "Sandwich", "Shawarma", "Soup", "Sushi", "Tea", "Toast", "Watermelon", "Yogurt"],
      tr: ["Baklava", "Burger", "Pasta", "Tavuk", "Kahve", "Doner", "Yumurta", "Balik", "Patates Kizartmasi", "Izgara Et", "Bal", "Dondurma", "Kebap", "Mercimek Corbasi", "Noodle", "Makarna", "Pizza", "Pilav", "Salata", "Sandvic", "Savarama", "Corba", "Sushi", "Cay", "Tost", "Karpuz", "Yogurt"]
    }
  },
  {
    id: "jobs",
    label: { ku: "Jobs", ar: "Jobs", en: "Jobs", tr: "Meslekler" },
    words: {
      en: ["Accountant", "Actor", "Architect", "Barber", "Cashier", "Chef", "Dentist", "Doctor", "Driver", "Electrician", "Engineer", "Farmer", "Firefighter", "Graphic Designer", "Journalist", "Lawyer", "Mechanic", "Nurse", "Photographer", "Pilot", "Police Officer", "Programmer", "Security Guard", "Teacher", "Translator", "Waiter"],
      tr: ["Muhasebeci", "Oyuncu", "Mimar", "Berber", "Kasiyer", "Sef", "Dis Hekimi", "Doktor", "Sofor", "Elektrikci", "Muhendis", "Ciftci", "Itfaiyeci", "Grafik Tasarimci", "Gazeteci", "Avukat", "Tamirci", "Hemsire", "Fotografci", "Pilot", "Polis", "Programci", "Guvenlik", "Ogretmen", "Tercuman", "Garson"]
    }
  },
  {
    id: "objects",
    label: { ku: "Objects", ar: "Objects", en: "Objects", tr: "Esya" },
    words: {
      en: ["Backpack", "Battery", "Book", "Bottle", "Camera", "Chair", "Clock", "Computer", "Door", "Glasses", "Headphones", "Key", "Lamp", "Laptop", "Mirror", "Notebook", "Pen", "Phone", "Remote Control", "Ring", "Shoe", "Table", "Television", "Umbrella", "Wallet", "Watch"],
      tr: ["Sirt Cantasi", "Pil", "Kitap", "Sise", "Kamera", "Sandalye", "Saat", "Bilgisayar", "Kapi", "Gozluk", "Kulaklik", "Anahtar", "Lamba", "Dizustu Bilgisayar", "Ayna", "Defter", "Kalem", "Telefon", "Kumanda", "Yuzuk", "Ayakkabi", "Masa", "Televizyon", "Semsiye", "Cuzdan", "Kol Saati"]
    }
  },
  {
    id: "travel",
    label: { ku: "Travel", ar: "Travel", en: "Travel", tr: "Seyahat" },
    words: {
      en: ["Boarding Pass", "Bus", "Camping", "Cruise", "Desert", "Flight", "Hotel Room", "Island", "Map", "Passport", "Reservation", "Road Trip", "Suitcase", "Subway", "Taxi", "Ticket", "Tour Guide", "Tourist", "Train", "Travel Agency", "Visa", "Waterfall"],
      tr: ["Bini Kart", "Otobus", "Kamp", "Gemi Turu", "Col", "Ucus", "Otel Odasi", "Ada", "Harita", "Pasaport", "Rezervasyon", "Yolculuk", "Valiz", "Metro", "Taksi", "Bilet", "Tur Rehberi", "Turist", "Tren", "Seyahat Acentesi", "Vize", "Selale"]
    }
  },
  {
    id: "school",
    label: { ku: "School", ar: "School", en: "School", tr: "Okul" },
    words: {
      en: ["Backpack", "Blackboard", "Cafeteria", "Classroom", "Desk", "Exam", "Grade", "Homework", "Lesson", "Marker", "Notebook", "Principal", "Projector", "Quiz", "Recess", "Report Card", "Science Lab", "Student", "Teacher", "Textbook", "Uniform", "Whiteboard"],
      tr: ["Okul Cantasi", "Kara Tahta", "Kantin", "Sinif", "Sira", "Sinav", "Not", "Odev", "Ders", "Kalem", "Defter", "Mudur", "Projektor", "Kisa Sinav", "Teneffus", "Karne", "Laboratuvar", "Ogrenci", "Ogretmen", "Ders Kitabi", "Uniforma", "Beyaz Tahta"]
    }
  },
  {
    id: "sports",
    label: { ku: "Sports", ar: "Sports", en: "Sports", tr: "Spor" },
    words: {
      en: ["Basketball", "Boxing", "Chess", "Coach", "Cycling", "Final Match", "Football", "Goalkeeper", "Gym", "Karate", "Medal", "Referee", "Running", "Scoreboard", "Skating", "Stadium", "Swimming", "Tennis", "Training", "Volleyball", "Yoga"],
      tr: ["Basketbol", "Boks", "Satranc", "Antrenor", "Bisiklet", "Final Maci", "Futbol", "Kaleci", "Spor Salonu", "Karate", "Madalya", "Hakem", "Kosmak", "Skor Tabelasi", "Paten", "Stadyum", "Yuzme", "Tenis", "Antrenman", "Voleybol", "Yoga"]
    }
  },
  {
    id: "entertainment",
    label: { ku: "Entertainment", ar: "Entertainment", en: "Entertainment", tr: "Eglence" },
    words: {
      en: ["Board Game", "Carnival", "Concert", "Dance", "Festival", "Game Console", "Karaoke", "Magic Show", "Movie", "Music", "Puzzle", "Radio", "Stage", "Stand Up Show", "Theater", "Toy", "Video Game", "VR Headset", "YouTube"],
      tr: ["Masa Oyunu", "Karnaval", "Konser", "Dans", "Festival", "Oyun Konsolu", "Karaoke", "Sihirbaz Gosterisi", "Film", "Muzik", "Bulmaca", "Radyo", "Sahne", "Stand Up", "Tiyatro", "Oyuncak", "Video Oyunu", "VR Gozluk", "YouTube"]
    }
  },
  {
    id: "city",
    label: { ku: "City", ar: "City", en: "City", tr: "Sehir" },
    words: {
      en: ["Apartment", "Bridge", "Bus Stop", "Cafe", "Crosswalk", "Elevator", "Fire Station", "Market", "Mosque", "Parking Lot", "Pharmacy", "Post Office", "Roundabout", "Sidewalk", "Street", "Supermarket", "Traffic Light", "Tunnel", "Zoo"],
      tr: ["Apartman", "Kopru", "Durak", "Kafe", "Yaya Gecidi", "Asansor", "Itfaiye", "Pazar", "Cami", "Otopark", "Eczane", "Postane", "Donel Kavsak", "Kaldirim", "Sokak", "Market", "Trafik Lambasi", "Tunel", "Hayvanat Bahcesi"]
    }
  },
  {
    id: "nature",
    label: { ku: "Nature", ar: "Nature", en: "Nature", tr: "Doga" },
    words: {
      en: ["Cave", "Cloud", "Desert", "Forest", "Garden", "Hill", "Lake", "Lightning", "Mountain", "Ocean", "Rain", "River", "Rock", "Sand", "Snow", "Sun", "Tree", "Valley", "Waterfall", "Wind", "Volcano"],
      tr: ["Magara", "Bulut", "Col", "Orman", "Bahce", "Tepe", "Gol", "Simsek", "Dag", "Okyanus", "Yagmur", "Nehir", "Kaya", "Kum", "Kar", "Gunes", "Agac", "Vadi", "Selale", "Ruzgar", "Volkan"]
    }
  },
  {
    id: "vehicles",
    label: { ku: "Vehicles", ar: "Vehicles", en: "Vehicles", tr: "Araclar" },
    words: {
      en: ["Ambulance", "Bicycle", "Boat", "Bus", "Cable Car", "Car", "Delivery Van", "Ferry", "Fire Truck", "Helicopter", "Metro", "Motorcycle", "Pickup Truck", "Police Car", "Scooter", "Ship", "Taxi", "Tractor", "Train", "Truck"],
      tr: ["Ambulans", "Bisiklet", "Tekne", "Otobus", "Teleferik", "Araba", "Kurye Araci", "Feribot", "Itfaiye Araci", "Helikopter", "Metro", "Motosiklet", "Pikap", "Polis Arabasi", "Scooter", "Gemi", "Taksi", "Traktor", "Tren", "Kamyon"]
    }
  },
  {
    id: "technology",
    label: { ku: "Technology", ar: "Technology", en: "Technology", tr: "Teknoloji" },
    words: {
      en: ["App", "Bluetooth", "Charger", "Cloud Storage", "Drone", "Email", "Keyboard", "Laptop", "Microphone", "Password", "Printer", "Robot", "Router", "Smart Watch", "Tablet", "Touch Screen", "USB Cable", "Video Call", "Website", "Wi Fi"],
      tr: ["Uygulama", "Bluetooth", "Sarj Aleti", "Bulut Depolama", "Drone", "E Posta", "Klavye", "Dizustu Bilgisayar", "Mikrofon", "Sifre", "Yazici", "Robot", "Modem", "Akilli Saat", "Tablet", "Dokunmatik Ekran", "USB Kablosu", "Goruntulu Arama", "Web Sitesi", "Wi Fi"]
    }
  },
  {
    id: "home",
    label: { ku: "Home", ar: "Home", en: "Home", tr: "Ev" },
    words: {
      en: ["Balcony", "Bathroom", "Bedroom", "Blanket", "Carpet", "Closet", "Couch", "Curtain", "Dining Table", "Dishwasher", "Doorbell", "Kitchen", "Laundry Basket", "Living Room", "Oven", "Pillow", "Refrigerator", "Shower", "Sofa", "Washing Machine"],
      tr: ["Balkon", "Banyo", "Yatak Odasi", "Battaniye", "Hali", "Dolap", "Koltuk", "Perde", "Yemek Masasi", "Bulasik Makinesi", "Kapi Zili", "Mutfak", "Camasir Sepeti", "Salon", "Firin", "Yastik", "Buzdolabi", "Dus", "Kanepe", "Camasir Makinesi"]
    }
  },
  {
    id: "clothing",
    label: { ku: "Clothing", ar: "Clothing", en: "Clothing", tr: "Giyim" },
    words: {
      en: ["Belt", "Boots", "Cap", "Coat", "Dress", "Gloves", "Hat", "Hoodie", "Jacket", "Jeans", "Scarf", "Shirt", "Shorts", "Skirt", "Sneakers", "Suit", "Sunglasses", "Sweater", "Tie", "T Shirt"],
      tr: ["Kemer", "Bot", "Sapka", "Kaban", "Elbise", "Eldiven", "Sapka", "Kapusonlu", "Ceket", "Kot Pantolon", "Atki", "Gomlek", "Sort", "Etek", "Spor Ayakkabi", "Takim Elbise", "Gunes Gozlugu", "Kazak", "Kravat", "Tisort"]
    }
  },
  {
    id: "health",
    label: { ku: "Health", ar: "Health", en: "Health", tr: "Saglik" },
    words: {
      en: ["Ambulance", "Bandage", "Blood Test", "Clinic", "Dentist Chair", "Eye Test", "First Aid", "Hospital Bed", "Injection", "Medicine", "Nurse Station", "Operation Room", "Pharmacy", "Prescription", "Stethoscope", "Surgery", "Thermometer", "Waiting Room", "Wheelchair", "X Ray"],
      tr: ["Ambulans", "Bandaj", "Kan Testi", "Klinik", "Disci Koltugu", "Goz Testi", "Ilk Yardim", "Hastane Yatagi", "Igne", "Ilac", "Hemsire Bankosu", "Ameliyathane", "Eczane", "Recete", "Stetoskop", "Ameliyat", "Termometre", "Bekleme Odasi", "Tekerlekli Sandalye", "Rontgen"]
    }
  },
  {
    id: "shopping",
    label: { ku: "Shopping", ar: "Shopping", en: "Shopping", tr: "Alisveris" },
    words: {
      en: ["Barcode", "Basket", "Cash Register", "Coupon", "Credit Card", "Discount", "Fitting Room", "Gift Card", "Online Order", "Price Tag", "Receipt", "Refund", "Sale", "Shopping Bag", "Shopping Cart", "Store Window", "Supermarket Aisle", "Wallet"],
      tr: ["Barkod", "Sepet", "Kasa", "Kupon", "Kredi Karti", "Indirim", "Deneme Kabini", "Hediye Karti", "Online Siparis", "Fiyat Etiketi", "Fis", "Iade", "Kampanya", "Alisveris Poseti", "Alisveris Arabasi", "Vitrin", "Market Koridoru", "Cuzdan"]
    }
  },
  {
    id: "office",
    label: { ku: "Office", ar: "Office", en: "Office", tr: "Ofis" },
    words: {
      en: ["Boss", "Briefcase", "Calendar", "Conference Room", "Desk", "Document", "Elevator", "Meeting", "Name Tag", "Office Chair", "Paperwork", "Printer", "Project", "Reception", "Report", "Spreadsheet", "Stapler", "Team", "Whiteboard", "Work Email"],
      tr: ["Patron", "Evrak Cantasi", "Takvim", "Toplanti Odasi", "Masa", "Belge", "Asansor", "Toplanti", "Yaka Karti", "Ofis Sandalyesi", "Evrak Isi", "Yazici", "Proje", "Resepsiyon", "Rapor", "E Tablo", "Zimba", "Ekip", "Beyaz Tahta", "Is E Postasi"]
    }
  },
  {
    id: "events",
    label: { ku: "Events", ar: "Events", en: "Events", tr: "Etkinlikler" },
    words: {
      en: ["Birthday Party", "Business Meeting", "Conference", "Engagement", "Festival", "Graduation", "Opening Ceremony", "Picnic", "Press Meeting", "Reunion", "School Trip", "Seminar", "Surprise Party", "Tournament", "Training Camp", "Wedding"],
      tr: ["Dogum Gunu", "Is Toplantisi", "Konferans", "Nisan", "Festival", "Mezuniyet", "Acilis Toreni", "Piknik", "Basin Toplantisi", "Bulusturma", "Okul Gezisi", "Seminer", "Surpriz Parti", "Turnuva", "Kamp", "Dugun"]
    }
  },
  {
    id: "countries",
    label: { ku: "Countries", ar: "Countries", en: "Countries", tr: "Ulkeler" },
    words: {
      en: ["Argentina", "Brazil", "Canada", "China", "Egypt", "France", "Germany", "Greece", "India", "Iraq", "Italy", "Japan", "Mexico", "Morocco", "Netherlands", "Spain", "Sweden", "Turkey", "United Kingdom", "United States"],
      tr: ["Arjantin", "Brezilya", "Kanada", "Cin", "Misir", "Fransa", "Almanya", "Yunanistan", "Hindistan", "Irak", "Italya", "Japonya", "Meksika", "Fas", "Hollanda", "Ispanya", "Isvec", "Turkiye", "Birlesik Krallik", "Amerika"]
    }
  },
  {
    id: "famous_places",
    label: { ku: "Famous Places", ar: "Famous Places", en: "Famous Places", tr: "Unlu Yerler" },
    words: {
      en: ["Big Ben", "Burj Khalifa", "Colosseum", "Eiffel Tower", "Empire State Building", "Grand Bazaar", "Great Wall", "Hagia Sophia", "Hollywood", "Leaning Tower", "Louvre Museum", "Pyramids", "Statue of Liberty", "Taj Mahal", "Times Square", "Tokyo Tower"],
      tr: ["Big Ben", "Burc Halife", "Kolezyum", "Eyfel Kulesi", "Empire State", "Kapali Carsi", "Cin Seddi", "Ayasofya", "Hollywood", "Egik Kule", "Louvre Muzesi", "Piramitler", "Ozgurluk Heykeli", "Tac Mahal", "Times Square", "Tokyo Kulesi"]
    }
  },
  {
    id: "daily_actions",
    label: { ku: "Daily Actions", ar: "Daily Actions", en: "Daily Actions", tr: "Gunluk Isler" },
    words: {
      en: ["Brushing Teeth", "Cleaning Room", "Cooking Dinner", "Doing Homework", "Driving Home", "Drinking Coffee", "Going Shopping", "Listening to Music", "Making Tea", "Paying Bills", "Reading News", "Taking Notes", "Using Elevator", "Walking Outside", "Washing Dishes", "Watching Movie"],
      tr: ["Dis Fircalamak", "Oda Temizlemek", "Aksam Yemegi Yapmak", "Odev Yapmak", "Eve Donmek", "Kahve Icmek", "Alisverise Gitmek", "Muzik Dinlemek", "Cay Yapmak", "Fatura Odemek", "Haber Okumak", "Not Almak", "Asansor Kullanmak", "Yuruyus Yapmak", "Bulasik Yikamak", "Film Izlemek"]
    }
  },
  {
    id: "emotions",
    label: { ku: "Emotions", ar: "Emotions", en: "Emotions", tr: "Duygular" },
    words: {
      en: ["Anger", "Boredom", "Calm", "Confidence", "Confusion", "Curiosity", "Embarrassment", "Excitement", "Fear", "Happiness", "Jealousy", "Loneliness", "Panic", "Pride", "Relief", "Sadness", "Stress", "Surprise"],
      tr: ["Ofke", "Can Sikintisi", "Sakinlik", "Ozguven", "Kafa Karisikligi", "Merak", "Utanma", "Heyecan", "Korku", "Mutluluk", "Kiskanclik", "Yalnizlik", "Panik", "Gurur", "Rahatlama", "Uzuntu", "Stres", "Saskinlik"]
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
