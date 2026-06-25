export type FootballCategoryKey = "legends" | "current-stars" | "mixed"
export type FootballDifficulty = "easy" | "medium" | "hard"
export type FootballStarCategoryKey = "all" | "world-popular-stars" | "current-superstars" | "modern-legends" | "goat-players"
export type FootballClubKey =
  | "all"
  | "mixed-clubs"
  | "world-popular-clubs"
  | "real-madrid"
  | "barcelona"
  | "manchester-united"
  | "manchester-city"
  | "paris-saint-germain"
  | "liverpool"
  | "chelsea"
  | "arsenal"
  | "bayern-munich"
  | "borussia-dortmund"
  | "juventus"
  | "ac-milan"
  | "inter-milan"
  | "atletico-madrid"
  | "tottenham-hotspur"
  | "ajax"
  | "benfica"
  | "porto"
  | "napoli"
  | "roma"
  | "galatasaray"
  | "fenerbahce"
export type FootballLeagueKey =
  | "mixed"
  | "european-mixed"
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "turkish-super-lig"
  | "portuguese-liga"
  | "eredivisie"
  | "belgian-pro-league"
  | "scottish-premiership"
  | "austrian-bundesliga"
  | "swiss-super-league"
  | "danish-superliga"
  | "norwegian-eliteserien"
  | "swedish-allsvenskan"
  | "greek-super-league"
  | "croatian-hnl"
  | "serbian-superliga"
  | "ukrainian-premier-league"
  | "czech-first-league"
  | "polish-ekstraklasa"
  | "saudi-pro-league"
  | "other-leagues"
  | "classic-legends"

export interface FootballPlayerCard {
  name: string
  category: Exclude<FootballCategoryKey, "mixed">
  leagueCategory: Exclude<FootballLeagueKey, "mixed" | "european-mixed">
  position: "goalkeeper" | "defender" | "midfielder" | "forward"
  difficulty: FootballDifficulty
  clubTags: FootballClubKey[]
  hints: string[]
}

export const FOOTBALL_CATEGORY_OPTIONS: Array<{ key: FootballCategoryKey; label: string }> = [
  { key: "mixed", label: "Mixed" },
  { key: "legends", label: "Football Legends" },
  { key: "current-stars", label: "Current Stars" }
]

export const FOOTBALL_STAR_CATEGORY_OPTIONS: Array<{ key: FootballStarCategoryKey; label: string }> = [
  { key: "all", label: "All Players" },
  { key: "world-popular-stars", label: "World Popular Stars" },
  { key: "current-superstars", label: "Current Superstars" },
  { key: "modern-legends", label: "Modern Legends" },
  { key: "goat-players", label: "GOAT Players" }
]

export const FOOTBALL_CLUB_OPTIONS: Array<{ key: FootballClubKey; label: string }> = [
  { key: "all", label: "All Clubs" },
  { key: "mixed-clubs", label: "Mixed Clubs" },
  { key: "world-popular-clubs", label: "World Popular Clubs" },
  { key: "real-madrid", label: "Real Madrid" },
  { key: "barcelona", label: "Barcelona" },
  { key: "manchester-united", label: "Manchester United" },
  { key: "manchester-city", label: "Manchester City" },
  { key: "paris-saint-germain", label: "Paris Saint-Germain" },
  { key: "liverpool", label: "Liverpool" },
  { key: "chelsea", label: "Chelsea" },
  { key: "arsenal", label: "Arsenal" },
  { key: "bayern-munich", label: "Bayern Munich" },
  { key: "borussia-dortmund", label: "Borussia Dortmund" },
  { key: "juventus", label: "Juventus" },
  { key: "ac-milan", label: "AC Milan" },
  { key: "inter-milan", label: "Inter Milan" },
  { key: "atletico-madrid", label: "Atletico Madrid" },
  { key: "tottenham-hotspur", label: "Tottenham Hotspur" },
  { key: "ajax", label: "Ajax" },
  { key: "benfica", label: "Benfica" },
  { key: "porto", label: "Porto" },
  { key: "napoli", label: "Napoli" },
  { key: "roma", label: "Roma" },
  { key: "galatasaray", label: "Galatasaray" },
  { key: "fenerbahce", label: "Fenerbahce" }
]

export const FOOTBALL_DIFFICULTY_OPTIONS: Array<{ key: FootballDifficulty; label: string }> = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" }
]

export const FOOTBALL_LEAGUE_OPTIONS: Array<{ key: FootballLeagueKey; label: string }> = [
  { key: "mixed", label: "Mixed Leagues" },
  { key: "european-mixed", label: "European Mixed" },
  { key: "premier-league", label: "Premier League" },
  { key: "la-liga", label: "La Liga" },
  { key: "serie-a", label: "Serie A" },
  { key: "bundesliga", label: "Bundesliga" },
  { key: "ligue-1", label: "Ligue 1" },
  { key: "turkish-super-lig", label: "Turkish Super Lig" },
  { key: "portuguese-liga", label: "Portuguese Liga" },
  { key: "eredivisie", label: "Eredivisie" },
  { key: "belgian-pro-league", label: "Belgian Pro League" },
  { key: "scottish-premiership", label: "Scottish Premiership" },
  { key: "austrian-bundesliga", label: "Austrian Bundesliga" },
  { key: "swiss-super-league", label: "Swiss Super League" },
  { key: "danish-superliga", label: "Danish Superliga" },
  { key: "norwegian-eliteserien", label: "Norwegian Eliteserien" },
  { key: "swedish-allsvenskan", label: "Swedish Allsvenskan" },
  { key: "greek-super-league", label: "Greek Super League" },
  { key: "croatian-hnl", label: "Croatian HNL" },
  { key: "serbian-superliga", label: "Serbian SuperLiga" },
  { key: "ukrainian-premier-league", label: "Ukrainian Premier League" },
  { key: "czech-first-league", label: "Czech First League" },
  { key: "polish-ekstraklasa", label: "Polish Ekstraklasa" },
  { key: "saudi-pro-league", label: "Saudi Pro League" },
  { key: "other-leagues", label: "Other Leagues" },
  { key: "classic-legends", label: "Classic Legends" }
]

export const FOOTBALL_EUROPE_LEAGUE_KEYS: readonly Exclude<FootballLeagueKey, "mixed" | "european-mixed" | "saudi-pro-league" | "other-leagues" | "classic-legends">[] = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
  "turkish-super-lig",
  "portuguese-liga",
  "eredivisie",
  "belgian-pro-league",
  "scottish-premiership",
  "austrian-bundesliga",
  "swiss-super-league",
  "danish-superliga",
  "norwegian-eliteserien",
  "swedish-allsvenskan",
  "greek-super-league",
  "croatian-hnl",
  "serbian-superliga",
  "ukrainian-premier-league",
  "czech-first-league",
  "polish-ekstraklasa"
]

export const FOOTBALL_ROUND_SECONDS = [30, 60, 90, 0] as const
export const FOOTBALL_MAX_HINTS = [1, 2, 3] as const

const FOOTBALL_LEAGUE_LABELS: Record<Exclude<FootballLeagueKey, "mixed" | "european-mixed">, string> = {
  "premier-league": "Premier League",
  "la-liga": "La Liga",
  "serie-a": "Serie A",
  "bundesliga": "Bundesliga",
  "ligue-1": "Ligue 1",
  "turkish-super-lig": "Turkish Super Lig",
  "portuguese-liga": "Portuguese Liga",
  "eredivisie": "Eredivisie",
  "belgian-pro-league": "Belgian Pro League",
  "scottish-premiership": "Scottish Premiership",
  "austrian-bundesliga": "Austrian Bundesliga",
  "swiss-super-league": "Swiss Super League",
  "danish-superliga": "Danish Superliga",
  "norwegian-eliteserien": "Norwegian Eliteserien",
  "swedish-allsvenskan": "Swedish Allsvenskan",
  "greek-super-league": "Greek Super League",
  "croatian-hnl": "Croatian HNL",
  "serbian-superliga": "Serbian SuperLiga",
  "ukrainian-premier-league": "Ukrainian Premier League",
  "czech-first-league": "Czech First League",
  "polish-ekstraklasa": "Polish Ekstraklasa",
  "saudi-pro-league": "Saudi Pro League",
  "other-leagues": "Other Leagues",
  "classic-legends": "Classic Legends"
}

export function footballLeagueLabel(key: Exclude<FootballLeagueKey, "mixed" | "european-mixed">): string {
  return FOOTBALL_LEAGUE_LABELS[key]
}

interface FootballCardGroup {
  category: Exclude<FootballCategoryKey, "mixed">
  leagueCategory?: FootballPlayerCard["leagueCategory"]
  position: FootballPlayerCard["position"]
  names: string[]
}

const FOOTBALL_CARD_GROUPS: readonly FootballCardGroup[] = [
  {
    category: "legends",
    position: "goalkeeper",
    names: [
      "Lev Yashin", "Dino Zoff", "Peter Schmeichel", "Oliver Kahn", "Edwin van der Sar",
      "Iker Casillas", "Gianluigi Buffon", "Manuel Neuer", "Sepp Maier", "Gordon Banks",
      "Peter Shilton", "Pat Jennings", "Michel Preudhomme", "Andoni Zubizarreta", "Fabien Barthez",
      "Claudio Taffarel", "Jose Luis Chilavert", "Jorge Campos", "Walter Zenga", "Jean-Marie Pfaff",
      "Ubaldo Fillol", "Gilmar", "Ricardo Zamora", "Rene Higuita", "Ray Clemence",
      "David Seaman", "Victor Valdes", "Julio Cesar", "Dida", "Jens Lehmann", "Petr Cech",
      "Fernando Muslera"
    ]
  },
  {
    category: "legends",
    position: "defender",
    names: [
      "Paolo Maldini", "Franco Baresi", "Franz Beckenbauer", "Cafu", "Roberto Carlos",
      "Carlos Alberto", "Bobby Moore", "Alessandro Nesta", "Fabio Cannavaro", "Carles Puyol",
      "Sergio Ramos", "Philipp Lahm", "Javier Zanetti", "Lilian Thuram", "Marcel Desailly",
      "Jaap Stam", "Rio Ferdinand", "Nemanja Vidic", "John Terry", "Ashley Cole",
      "Sol Campbell", "Dani Alves", "Gerard Pique", "Ronald Koeman", "Ruud Krol",
      "Gaetano Scirea", "Giacinto Facchetti", "Berti Vogts", "Billy Wright", "Daniel Passarella",
      "Fernando Hierro", "Laurent Blanc", "Matthias Sammer", "Andreas Brehme", "Giuseppe Bergomi",
      "Claudio Gentile", "Paul Breitner", "Nilton Santos", "Djalma Santos", "Junior",
      "Branislav Ivanovic", "Ricardo Carvalho", "Vincent Kompany", "Pepe", "Marcelo",
      "Thiago Silva", "Diego Godin", "Giorgio Chiellini", "Leonardo Bonucci", "Raphael Varane",
      "Mats Hummels", "Walter Samuel"
    ]
  },
  {
    category: "legends",
    position: "midfielder",
    names: [
      "Zinedine Zidane", "Xavi", "Andres Iniesta", "Andrea Pirlo", "Luka Modric",
      "Kaka", "Ronaldinho", "Michel Platini", "Johan Cruyff", "Socrates",
      "Juan Roman Riquelme", "Paul Scholes", "Steven Gerrard", "Frank Lampard", "Patrick Vieira",
      "Claude Makelele", "N'Golo Kante", "Casemiro", "Paul Pogba", "Clarence Seedorf",
      "Ruud Gullit", "Frank Rijkaard", "Lothar Matthaus", "Thomas Muller", "Marco Reus",
      "Xabi Alonso", "Sergio Busquets", "Cesc Fabregas", "David Silva", "Mesut Ozil",
      "Wesley Sneijder", "Deco", "Marco Verratti", "James Rodriguez", "Koke", "Marek Hamsik",
      "Daniele De Rossi", "Alex de Souza", "Arda Guler", "Pavel Nedved", "Luis Figo", "Michael Laudrup",
      "Gheorghe Hagi", "Carlos Valderrama", "Enzo Francescoli", "Didi", "Gerson",
      "Bobby Charlton", "Roy Keane", "Edgar Davids", "Michael Ballack", "Bastian Schweinsteiger",
      "Toni Kroos", "Yaya Toure", "Rui Costa", "Zvonimir Boban", "Dejan Stankovic",
      "Esteban Cambiasso", "Juan Sebastian Veron", "Gennaro Gattuso", "Demetrio Albertini", "Fernando Redondo",
      "Sandro Mazzola", "Gianni Rivera", "Jozsef Bozsik", "Nils Liedholm", "Sami Hyypia",
      "Robert Pires", "Freddie Ljungberg", "Guti", "Ariel Ortega", "Tomas Rosicky"
    ]
  },
  {
    category: "legends",
    position: "forward",
    names: [
      "Pele", "Diego Maradona", "Ronaldo Nazario", "Cristiano Ronaldo", "Lionel Messi",
      "Eusebio", "Gerd Muller", "Marco van Basten", "Romario", "Ferenc Puskas",
      "Alfredo Di Stefano", "George Best", "Thierry Henry", "Zlatan Ibrahimovic", "Andriy Shevchenko",
      "Raul", "Samuel Eto'o", "Didier Drogba", "David Beckham", "Eden Hazard",
      "Gareth Bale", "Wayne Rooney", "Roberto Baggio",
      "Alessandro Del Piero", "Francesco Totti", "Gabriel Batistuta", "Hristo Stoichkov", "Dennis Bergkamp",
      "Ruud van Nistelrooy", "Alan Shearer", "Eric Cantona", "Ian Rush", "Kenny Dalglish",
      "Gary Lineker", "Michael Owen", "Miroslav Klose", "David Villa", "Fernando Torres",
      "Carlos Tevez", "Sergio Aguero", "Luis Suarez", "Edinson Cavani", "Radamel Falcao", "Diego Forlan",
      "David Trezeguet", "Hulk", "Gianfranco Zola", "Lorenzo Insigne", "Robin van Persie",
      "Dirk Kuyt", "Jurgen Klinsmann", "Teddy Sheringham", "Arjen Robben", "Franck Ribery",
      "Rivaldo", "Jairzinho", "Garrincha", "Roberto Rivelino", "Mario Kempes",
      "Paolo Rossi", "Omar Sivori", "Giuseppe Meazza", "Hugo Sanchez", "Hernan Crespo",
      "Claudio Caniggia", "George Weah", "Roger Milla", "Samuel Kuffour", "Abedi Pele",
      "Jay-Jay Okocha", "Henrik Larsson", "Brian Laudrup", "Predrag Mijatovic", "Davor Suker",
      "Pierre Littbarski", "Rudi Voller", "Karl-Heinz Rummenigge", "Uwe Seeler", "Sandor Kocsis"
    ]
  },
  {
    category: "current-stars",
    position: "goalkeeper",
    names: [
      "Thibaut Courtois", "Alisson Becker", "Ederson", "Jan Oblak", "Marc-Andre ter Stegen",
      "Gianluigi Donnarumma", "Mike Maignan", "Emiliano Martinez", "Yassine Bounou", "David Raya",
      "Unai Simon", "Gregor Kobel", "Diogo Costa", "Andre Onana", "Aaron Ramsdale",
      "Jordan Pickford", "Nick Pope", "Wojciech Szczesny", "Koen Casteels", "Kepa Arrizabalaga",
      "Alex Meret", "Guglielmo Vicario", "Anatoliy Trubin", "Giorgi Mamardashvili", "Illan Meslier",
      "Robert Sanchez", "Jose Sa", "Bernd Leno", "Mattia Perin", "Ivan Provedel"
    ]
  },
  {
    category: "current-stars",
    position: "defender",
    names: [
      "Virgil van Dijk", "Ruben Dias", "William Saliba", "Antonio Rudiger", "Eder Militao",
      "Marquinhos", "Achraf Hakimi", "Trent Alexander-Arnold", "Andrew Robertson", "Joao Cancelo",
      "Kyle Walker", "Reece James", "Ben White", "John Stones", "Lisandro Martinez",
      "Cristian Romero", "Jules Kounde", "Ronald Araujo", "Alejandro Balde", "Alphonso Davies",
      "Theo Hernandez", "Fikayo Tomori", "Alessandro Bastoni", "Federico Dimarco", "Matthijs de Ligt",
      "Dayot Upamecano", "Kim Min-jae", "Josko Gvardiol", "Nathan Ake", "Manuel Akanji",
      "Micky van de Ven", "Pau Torres", "Marc Guehi", "Levi Colwill", "Piero Hincapie",
      "Nuno Mendes", "Denzel Dumfries", "Jeremie Frimpong", "Dani Carvajal", "Ferland Mendy",
      "Lucas Hernandez", "Milan Skriniar", "Kalidou Koulibaly", "Nicolas Otamendi", "Aymeric Laporte"
    ]
  },
  {
    category: "current-stars",
    position: "midfielder",
    names: [
      "Kevin De Bruyne", "Jude Bellingham", "Rodri", "Federico Valverde", "Aurelien Tchouameni",
      "Eduardo Camavinga", "Pedri", "Gavi", "Frenkie de Jong", "Ilkay Gundogan",
      "Bruno Fernandes", "Bernardo Silva", "Martin Odegaard", "Declan Rice", "Phil Foden",
      "Jamal Musiala", "Florian Wirtz", "Joshua Kimmich", "Leon Goretzka", "Nicolo Barella",
      "Sandro Tonali", "Hakan Calhanoglu", "Sergej Milinkovic-Savic", "Enzo Fernandez", "Moises Caicedo",
      "Alexis Mac Allister", "Dominik Szoboszlai", "Ryan Gravenberch", "Mason Mount", "Conor Gallagher",
      "James Maddison", "Kai Havertz", "Xavi Simons", "Vitinha", "Warren Zaire-Emery",
      "Manuel Ugarte", "Adrien Rabiot", "Weston McKennie", "Giovanni Reyna", "Christian Eriksen",
      "Dani Olmo", "Mikel Merino", "Martin Zubimendi", "Ismael Bennacer", "Yunus Musah"
    ]
  },
  {
    category: "current-stars",
    position: "forward",
    names: [
      "Kylian Mbappe", "Erling Haaland", "Mohamed Salah", "Neymar", "Vinicius Junior",
      "Rodrygo", "Harry Kane", "Robert Lewandowski", "Karim Benzema", "Lautaro Martinez",
      "Victor Osimhen", "Khvicha Kvaratskhelia", "Rafael Leao", "Bukayo Saka", "Gabriel Martinelli",
      "Gabriel Jesus", "Son Heung-min", "Richarlison", "Darwin Nunez", "Luis Diaz",
      "Cody Gakpo", "Diogo Jota", "Julian Alvarez", "Philippe Coutinho", "Antoine Griezmann",
      "Joao Felix", "Alvaro Morata", "Randal Kolo Muani", "Ousmane Dembele", "Kingsley Coman",
      "Leroy Sane", "Serge Gnabry", "Marcus Rashford", "Jadon Sancho", "Rasmus Hojlund",
      "Dusan Vlahovic", "Federico Chiesa", "Paulo Dybala", "Tammy Abraham", "Ciro Immobile",
      "Romelu Lukaku", "Christopher Nkunku", "Nicolas Jackson", "Alexander Isak", "Callum Wilson",
      "Ollie Watkins", "Ivan Toney", "Jarrod Bowen", "Moussa Diaby", "Ansu Fati",
      "Ferran Torres", "Lamine Yamal", "Raphinha", "Memphis Depay", "Sadio Mane"
    ]
  }
] as const

const FOOTBALL_SMALL_EUROPEAN_LEAGUE_GROUPS: readonly FootballCardGroup[] = [
  { category: "current-stars", leagueCategory: "turkish-super-lig", position: "forward", names: ["Mauro Icardi", "Edin Dzeko", "Baris Alper Yilmaz", "Dries Mertens", "Michy Batshuayi"] },
  { category: "current-stars", leagueCategory: "turkish-super-lig", position: "midfielder", names: ["Fred", "Lucas Torreira", "Hakim Ziyech", "Tadic", "Gedson Fernandes"] },
  { category: "current-stars", leagueCategory: "portuguese-liga", position: "forward", names: ["Viktor Gyokeres", "Angel Di Maria", "Rafa Silva", "Mehdi Taremi", "Francisco Trincao"] },
  { category: "current-stars", leagueCategory: "portuguese-liga", position: "midfielder", names: ["Joao Neves", "Pedro Goncalves", "Orkun Kokcu", "Alan Varela", "Florentino Luis"] },
  { category: "current-stars", leagueCategory: "eredivisie", position: "forward", names: ["Luuk de Jong", "Steven Bergwijn", "Brian Brobbey", "Santiago Gimenez", "Johan Bakayoko"] },
  { category: "current-stars", leagueCategory: "eredivisie", position: "midfielder", names: ["Jerdy Schouten", "Quinten Timber", "Kenneth Taylor", "Guus Til", "Malik Tillman"] },
  { category: "current-stars", leagueCategory: "belgian-pro-league", position: "forward", names: ["Andreas Skov Olsen", "Igor Thiago", "Tolu Arokodare", "Kasper Dolberg", "Gift Orban"] },
  { category: "current-stars", leagueCategory: "belgian-pro-league", position: "midfielder", names: ["Hans Vanaken", "Charles Vanhoutte", "Raphael Onyedika", "Bilal El Khannouss", "Cameron Puertas"] },
  { category: "current-stars", leagueCategory: "scottish-premiership", position: "forward", names: ["Kyogo Furuhashi", "Daizen Maeda", "James Tavernier", "Cyriel Dessers", "Lawrence Shankland"] },
  { category: "current-stars", leagueCategory: "scottish-premiership", position: "midfielder", names: ["Callum McGregor", "Matt O'Riley", "Nicolas Raskin", "Todd Cantwell", "Reo Hatate"] },
  { category: "current-stars", leagueCategory: "austrian-bundesliga", position: "forward", names: ["Karim Konate", "Junior Adamu", "Benjamin Sesko", "Marco Grull", "Guido Burgstaller"] },
  { category: "current-stars", leagueCategory: "austrian-bundesliga", position: "midfielder", names: ["Nicolas Seiwald", "Maurits Kjaergaard", "Oscar Gloukh", "Alexander Prass", "Matthias Seidl"] },
  { category: "current-stars", leagueCategory: "swiss-super-league", position: "forward", names: ["Jean-Pierre Nsame", "Cedric Itten", "Zeki Amdouni", "Andi Zeqiri", "Thierno Barry"] },
  { category: "current-stars", leagueCategory: "swiss-super-league", position: "midfielder", names: ["Granit Xhaka", "Fabian Rieder", "Ardon Jashari", "Xherdan Shaqiri", "Vincent Sierro"] },
  { category: "current-stars", leagueCategory: "danish-superliga", position: "forward", names: ["Roony Bardghji", "Andreas Cornelius", "Mohamed Elyounoussi", "Patrick Mortensen", "Ernest Nuamah"] },
  { category: "current-stars", leagueCategory: "danish-superliga", position: "midfielder", names: ["Morten Hjulmand", "Mikkel Damsgaard", "Jesper Lindstrom", "Christian Norgaard", "Thomas Delaney"] },
  { category: "current-stars", leagueCategory: "norwegian-eliteserien", position: "forward", names: ["Amahl Pellegrino", "Albert Gronbaek", "Ola Solbakken", "Bard Finne", "Akor Adams"] },
  { category: "current-stars", leagueCategory: "norwegian-eliteserien", position: "midfielder", names: ["Patrick Berg", "Hugo Vetlesen", "Sondre Fet", "Markus Henriksen", "Emil Breivik"] },
  { category: "current-stars", leagueCategory: "swedish-allsvenskan", position: "forward", names: ["Alexander Jeremejeff", "Isaac Kiese Thelin", "Sebastian Nanasi", "Nahir Besara", "Viktor Djukanovic"] },
  { category: "current-stars", leagueCategory: "swedish-allsvenskan", position: "midfielder", names: ["Hugo Larsson", "Samuel Gustafson", "Anders Christiansen", "Oliver Berg", "Taha Ali"] },
  { category: "current-stars", leagueCategory: "greek-super-league", position: "forward", names: ["Ayoub El Kaabi", "Fotis Ioannidis", "Levi Garcia", "Andraz Sporar", "Kiril Despodov"] },
  { category: "current-stars", leagueCategory: "greek-super-league", position: "midfielder", names: ["Konstantinos Fortounis", "Bernard", "Mijat Gacinovic", "Sergio Araujo", "Daniel Podence"] },
  { category: "current-stars", leagueCategory: "croatian-hnl", position: "forward", names: ["Bruno Petkovic", "Marko Livaja", "Mislav Orsic", "Dion Drena Beljo", "Matija Frigan"] },
  { category: "current-stars", leagueCategory: "croatian-hnl", position: "midfielder", names: ["Luka Sucic", "Martin Baturina", "Lovro Majer", "Luka Ivanusec", "Marcelo Brozovic"] },
  { category: "current-stars", leagueCategory: "serbian-superliga", position: "forward", names: ["Aleksandar Mitrovic", "Aleksandar Katai", "Luka Jovic", "Cherif Ndiaye", "Samed Bazdar"] },
  { category: "current-stars", leagueCategory: "serbian-superliga", position: "midfielder", names: ["Uros Spajic", "Sasa Zdjelar", "Guelor Kanga", "Mirko Ivanic", "Marko Grujic"] },
  { category: "current-stars", leagueCategory: "ukrainian-premier-league", position: "forward", names: ["Artem Dovbyk", "Mykhailo Mudryk", "Viktor Tsygankov", "Danylo Sikan", "Vladyslav Vanat"] },
  { category: "current-stars", leagueCategory: "ukrainian-premier-league", position: "midfielder", names: ["Georgiy Sudakov", "Oleksandr Zinchenko", "Taras Stepanenko", "Mykola Shaparenko", "Ruslan Malinovskyi"] },
  { category: "current-stars", leagueCategory: "czech-first-league", position: "forward", names: ["Patrik Schick", "Adam Hlozek", "Jan Kuchta", "Tomas Chory", "Vaclav Jurecka"] },
  { category: "current-stars", leagueCategory: "czech-first-league", position: "midfielder", names: ["Tomas Soucek", "Antonin Barak", "Lukas Provod", "Ladislav Krejci", "Alex Kral"] },
  { category: "current-stars", leagueCategory: "polish-ekstraklasa", position: "forward", names: ["Erik Exposito", "Krzysztof Piatek", "Arkadiusz Milik", "Kamil Grosicki", "Efthymis Koulouris"] },
  { category: "current-stars", leagueCategory: "polish-ekstraklasa", position: "midfielder", names: ["Piotr Zielinski", "Jakub Moder", "Sebastian Szymanski", "Damian Szymanski", "Bartosz Slisz"] }
] as const

const POSITION_HINTS: Record<FootballPlayerCard["position"], string> = {
  goalkeeper: "Goalkeeper",
  defender: "Defender",
  midfielder: "Midfielder",
  forward: "Forward"
}

function cardDifficulty(index: number): FootballDifficulty {
  if (index % 5 === 0) return "hard"
  if (index % 2 === 0) return "medium"
  return "easy"
}

const LEAGUE_BY_NAME = new Map<string, FootballPlayerCard["leagueCategory"]>([
  ...[
    "Peter Schmeichel", "Edwin van der Sar", "David Seaman", "Jens Lehmann", "Bobby Moore",
    "Petr Cech", "Teddy Sheringham",
    "Jaap Stam", "Rio Ferdinand", "Nemanja Vidic", "John Terry", "Ashley Cole", "Sol Campbell",
    "Branislav Ivanovic", "Ricardo Carvalho", "Vincent Kompany", "Paul Scholes", "Steven Gerrard",
    "Frank Lampard", "Patrick Vieira", "Claude Makelele", "Xabi Alonso", "Cesc Fabregas",
    "Mesut Ozil", "Michael Ballack", "Yaya Toure", "Robert Pires", "Freddie Ljungberg",
    "N'Golo Kante", "Paul Pogba", "David Beckham", "Thierry Henry", "Eden Hazard",
    "Wayne Rooney", "Robin van Persie", "Dirk Kuyt", "Eric Cantona", "Ian Rush", "Kenny Dalglish",
    "Gary Lineker", "Michael Owen", "Fernando Torres", "Carlos Tevez", "Sergio Aguero",
    "Luis Suarez", "Didier Drogba", "George Weah", "Jay-Jay Okocha", "Alisson Becker",
    "Ederson", "David Raya", "Andre Onana", "Aaron Ramsdale", "Jordan Pickford", "Nick Pope",
    "Kepa Arrizabalaga", "Robert Sanchez", "Jose Sa", "Bernd Leno", "Virgil van Dijk",
    "Ruben Dias", "William Saliba", "Trent Alexander-Arnold", "Andrew Robertson", "Joao Cancelo",
    "Kyle Walker", "Reece James", "Ben White", "John Stones", "Lisandro Martinez",
    "Cristian Romero", "Josko Gvardiol", "Nathan Ake", "Manuel Akanji", "Micky van de Ven",
    "Pau Torres", "Marc Guehi", "Levi Colwill", "Bruno Fernandes", "Bernardo Silva",
    "Martin Odegaard", "Declan Rice", "Phil Foden", "Alexis Mac Allister", "Dominik Szoboszlai",
    "Ryan Gravenberch", "Mason Mount", "Conor Gallagher", "James Maddison", "Kai Havertz",
    "Christian Eriksen", "Erling Haaland", "Mohamed Salah", "Bukayo Saka", "Gabriel Martinelli",
    "Gabriel Jesus", "Son Heung-min", "Richarlison", "Darwin Nunez", "Luis Diaz", "Cody Gakpo",
    "Diogo Jota", "Julian Alvarez", "Marcus Rashford", "Jadon Sancho", "Rasmus Hojlund",
    "Christopher Nkunku", "Nicolas Jackson", "Alexander Isak", "Callum Wilson", "Ollie Watkins",
    "Ivan Toney", "Jarrod Bowen", "Moussa Diaby"
  ].map(name => [name, "premier-league"] as const),
  ...[
    "Iker Casillas", "Andoni Zubizarreta", "Ricardo Zamora", "Rene Higuita", "Roberto Carlos",
    "Carles Puyol", "Sergio Ramos", "Dani Alves", "Gerard Pique", "Ronald Koeman", "Fernando Hierro",
    "Marcelo", "Raphael Varane", "Zinedine Zidane", "Xavi", "Andres Iniesta", "Luka Modric",
    "Kaka", "Ronaldinho", "Johan Cruyff", "Michael Laudrup", "Sergio Busquets", "David Silva",
    "Luis Figo", "Guti", "Ariel Ortega", "Alfredo Di Stefano", "Diego Maradona", "Cristiano Ronaldo",
    "Lionel Messi", "Romario", "Raul", "Samuel Eto'o", "Ronaldo Nazario", "Roberto Baggio",
    "David Villa", "Gareth Bale", "Casemiro", "James Rodriguez", "Koke", "Radamel Falcao",
    "Diego Forlan", "Hugo Sanchez", "Thibaut Courtois", "Jan Oblak", "Marc-Andre ter Stegen",
    "Unai Simon", "Giorgi Mamardashvili", "Antonio Rudiger", "Eder Militao", "Ronald Araujo",
    "Alejandro Balde", "Dani Carvajal", "Ferland Mendy", "Federico Valverde", "Aurelien Tchouameni",
    "Eduardo Camavinga", "Pedri", "Gavi", "Frenkie de Jong", "Ilkay Gundogan", "Dani Olmo",
    "Mikel Merino", "Martin Zubimendi", "Kylian Mbappe", "Vinicius Junior", "Rodrygo",
    "Robert Lewandowski", "Antoine Griezmann", "Joao Felix", "Alvaro Morata", "Ansu Fati",
    "Ferran Torres", "Lamine Yamal", "Raphinha", "Memphis Depay"
  ].map(name => [name, "la-liga"] as const),
  ...[
    "Dino Zoff", "Gianluigi Buffon", "Walter Zenga", "Walter Samuel", "Paolo Maldini", "Franco Baresi",
    "Alessandro Nesta", "Fabio Cannavaro", "Gaetano Scirea", "Giacinto Facchetti", "Giuseppe Bergomi",
    "Claudio Gentile", "Laurent Blanc", "Thiago Silva", "Diego Godin", "Giorgio Chiellini",
    "Leonardo Bonucci", "Andrea Pirlo", "Clarence Seedorf", "Frank Rijkaard", "Wesley Sneijder",
    "Deco", "Pavel Nedved", "Marek Hamsik", "Daniele De Rossi", "Rui Costa", "Zvonimir Boban", "Dejan Stankovic", "Esteban Cambiasso",
    "Juan Sebastian Veron", "Gennaro Gattuso", "Demetrio Albertini", "Fernando Redondo",
    "Sandro Mazzola", "Gianni Rivera", "Nils Liedholm", "Marco van Basten", "Andriy Shevchenko",
    "Alessandro Del Piero", "Francesco Totti", "Gabriel Batistuta", "Hernan Crespo", "Gianfranco Zola", "Paolo Rossi",
    "Omar Sivori", "Giuseppe Meazza", "David Trezeguet", "Lorenzo Insigne", "Dida", "Gianluigi Donnarumma", "Mike Maignan", "Alex Meret",
    "Guglielmo Vicario", "Mattia Perin", "Ivan Provedel", "Fikayo Tomori", "Alessandro Bastoni",
    "Federico Dimarco", "Matthijs de Ligt", "Milan Skriniar", "Nicolas Otamendi", "Nicolo Barella",
    "Sandro Tonali", "Hakan Calhanoglu", "Sergej Milinkovic-Savic", "Weston McKennie",
    "Adrien Rabiot", "Ismael Bennacer", "Yunus Musah", "Lautaro Martinez", "Victor Osimhen",
    "Khvicha Kvaratskhelia", "Rafael Leao", "Dusan Vlahovic", "Federico Chiesa", "Paulo Dybala",
    "Tammy Abraham", "Ciro Immobile", "Romelu Lukaku"
  ].map(name => [name, "serie-a"] as const),
  ...[
    "Oliver Kahn", "Manuel Neuer", "Sepp Maier", "Franz Beckenbauer", "Philipp Lahm",
    "Matthias Sammer", "Andreas Brehme", "Berti Vogts", "Paul Breitner", "Lothar Matthaus",
    "Bastian Schweinsteiger", "Toni Kroos", "Miroslav Klose", "Pierre Littbarski", "Rudi Voller",
    "Karl-Heinz Rummenigge", "Uwe Seeler", "Jurgen Klinsmann", "Gerd Muller", "Gregor Kobel", "Koen Casteels",
    "Alphonso Davies", "Dayot Upamecano", "Kim Min-jae", "Lucas Hernandez", "Joshua Kimmich",
    "Leon Goretzka", "Thomas Muller", "Marco Reus", "Mats Hummels", "Jamal Musiala", "Florian Wirtz", "Xavi Simons", "Harry Kane",
    "Leroy Sane", "Serge Gnabry", "Kingsley Coman"
  ].map(name => [name, "bundesliga"] as const),
  ...[
    "Fabien Barthez", "Lilian Thuram", "Marcel Desailly", "Michel Platini", "Marco Verratti", "Kylian Mbappe",
    "Gianluigi Donnarumma", "Yassine Bounou", "Marquinhos", "Achraf Hakimi", "Jules Kounde",
    "Theo Hernandez", "Nuno Mendes", "Vitinha", "Warren Zaire-Emery", "Manuel Ugarte",
    "Neymar", "Edinson Cavani", "Randal Kolo Muani", "Ousmane Dembele"
  ].map(name => [name, "ligue-1"] as const),
  ...[
    "Karim Benzema", "Sadio Mane", "Cristiano Ronaldo"
  ].map(name => [name, "saudi-pro-league"] as const),
  ...[
    "Hulk"
  ].map(name => [name, "portuguese-liga"] as const),
  ...[
    "Fernando Muslera", "Alex de Souza"
  ].map(name => [name, "turkish-super-lig"] as const),
  ...[
    "Arda Guler"
  ].map(name => [name, "la-liga"] as const)
])

function leagueForCard(name: string, category: Exclude<FootballCategoryKey, "mixed">): FootballPlayerCard["leagueCategory"] {
  return LEAGUE_BY_NAME.get(name) ?? (category === "legends" ? "classic-legends" : "other-leagues")
}

const ALL_FOOTBALL_CARD_GROUPS: readonly FootballCardGroup[] = [
  ...FOOTBALL_CARD_GROUPS,
  ...FOOTBALL_SMALL_EUROPEAN_LEAGUE_GROUPS
]

type RealFootballClubKey = Exclude<FootballClubKey, "all" | "mixed-clubs" | "world-popular-clubs">

export const FOOTBALL_WORLD_POPULAR_CLUB_KEYS: readonly RealFootballClubKey[] = [
  "real-madrid",
  "barcelona",
  "manchester-united",
  "manchester-city",
  "paris-saint-germain",
  "liverpool",
  "chelsea",
  "bayern-munich",
  "juventus",
  "ac-milan"
]

export const FOOTBALL_CLUB_POPULAR_XI: Record<RealFootballClubKey, readonly string[]> = {
  "real-madrid": [
    "Cristiano Ronaldo", "Karim Benzema", "Vinicius Junior", "Luka Modric", "Toni Kroos",
    "Jude Bellingham", "Sergio Ramos", "Marcelo", "Roberto Carlos", "Iker Casillas", "Zinedine Zidane"
  ],
  "barcelona": [
    "Lionel Messi", "Ronaldinho", "Neymar", "Luis Suarez", "Xavi",
    "Andres Iniesta", "Sergio Busquets", "Gerard Pique", "Carles Puyol", "Dani Alves", "Marc-Andre ter Stegen"
  ],
  "manchester-united": [
    "Cristiano Ronaldo", "Wayne Rooney", "David Beckham", "Eric Cantona", "Paul Scholes",
    "Bruno Fernandes", "Rio Ferdinand", "Nemanja Vidic", "Peter Schmeichel", "Marcus Rashford", "Casemiro"
  ],
  "manchester-city": [
    "Erling Haaland", "Sergio Aguero", "Kevin De Bruyne", "David Silva", "Bernardo Silva",
    "Phil Foden", "Yaya Toure", "Rodri", "Ruben Dias", "Vincent Kompany", "Ederson"
  ],
  "paris-saint-germain": [
    "Lionel Messi", "Kylian Mbappe", "Neymar", "Zlatan Ibrahimovic", "Edinson Cavani",
    "Angel Di Maria", "Marco Verratti", "Achraf Hakimi", "Marquinhos", "Thiago Silva", "Gianluigi Donnarumma"
  ],
  liverpool: [
    "Mohamed Salah", "Steven Gerrard", "Virgil van Dijk", "Alisson Becker", "Trent Alexander-Arnold",
    "Andrew Robertson", "Luis Suarez", "Fernando Torres", "Michael Owen", "Kenny Dalglish", "Ian Rush"
  ],
  chelsea: [
    "Didier Drogba", "Frank Lampard", "Eden Hazard", "N'Golo Kante", "Petr Cech",
    "Claude Makelele", "Ashley Cole", "John Terry", "Ricardo Carvalho", "Cesc Fabregas", "Michael Ballack"
  ],
  arsenal: [
    "Thierry Henry", "Dennis Bergkamp", "Patrick Vieira", "Robert Pires", "Freddie Ljungberg",
    "Mesut Ozil", "Cesc Fabregas", "Bukayo Saka", "Martin Odegaard", "David Seaman", "Sol Campbell"
  ],
  "bayern-munich": [
    "Robert Lewandowski", "Manuel Neuer", "Oliver Kahn", "Franz Beckenbauer", "Philipp Lahm",
    "Joshua Kimmich", "Thomas Muller", "Arjen Robben", "Franck Ribery", "Bastian Schweinsteiger", "Lothar Matthaus"
  ],
  "borussia-dortmund": [
    "Marco Reus", "Erling Haaland", "Robert Lewandowski", "Jude Bellingham", "Jadon Sancho",
    "Mats Hummels", "Ilkay Gundogan", "Ousmane Dembele", "Giovanni Reyna", "Gregor Kobel"
  ],
  juventus: [
    "Gianluigi Buffon", "Giorgio Chiellini", "Leonardo Bonucci", "Andrea Pirlo", "Zinedine Zidane",
    "Pavel Nedved", "Alessandro Del Piero", "David Trezeguet", "Cristiano Ronaldo", "Paulo Dybala", "Paul Pogba"
  ],
  "ac-milan": [
    "Paolo Maldini", "Franco Baresi", "Alessandro Nesta", "Kaka", "Andrea Pirlo",
    "Clarence Seedorf", "Gennaro Gattuso", "Andriy Shevchenko", "Ronaldinho", "Zlatan Ibrahimovic", "Dida"
  ],
  "inter-milan": [
    "Javier Zanetti", "Ronaldo Nazario", "Samuel Eto'o", "Zlatan Ibrahimovic", "Wesley Sneijder",
    "Esteban Cambiasso", "Lautaro Martinez", "Romelu Lukaku", "Nicolo Barella", "Denzel Dumfries", "Julio Cesar"
  ],
  "atletico-madrid": [
    "Antoine Griezmann", "Fernando Torres", "Luis Suarez", "Sergio Aguero", "Diego Forlan",
    "Radamel Falcao", "Diego Godin", "Jan Oblak", "Koke", "Joao Felix"
  ],
  "tottenham-hotspur": [
    "Harry Kane", "Son Heung-min", "Gareth Bale", "Luka Modric", "Christian Eriksen",
    "Richarlison", "James Maddison", "Cristian Romero", "Teddy Sheringham", "Jurgen Klinsmann"
  ],
  ajax: [
    "Johan Cruyff", "Marco van Basten", "Frank Rijkaard", "Dennis Bergkamp", "Clarence Seedorf",
    "Wesley Sneijder", "Matthijs de Ligt", "Frenkie de Jong", "Edwin van der Sar", "Luis Suarez"
  ],
  benfica: [
    "Eusebio", "Angel Di Maria", "Joao Felix", "Joao Neves", "Rafa Silva",
    "Enzo Fernandez", "Darwin Nunez", "Ederson"
  ],
  porto: [
    "Deco", "Pepe", "Diogo Costa", "Ricardo Carvalho", "Radamel Falcao",
    "James Rodriguez", "Hulk", "Luis Diaz", "Mehdi Taremi"
  ],
  napoli: [
    "Diego Maradona", "Edinson Cavani", "Victor Osimhen", "Khvicha Kvaratskhelia", "Dries Mertens",
    "Ciro Immobile", "Fabio Cannavaro", "Gianfranco Zola", "Marek Hamsik", "Lorenzo Insigne"
  ],
  roma: [
    "Francesco Totti", "Paulo Dybala", "Gabriel Batistuta", "Cafu", "Walter Samuel",
    "Daniele De Rossi", "Alisson Becker", "Edin Dzeko", "Tammy Abraham"
  ],
  galatasaray: [
    "Didier Drogba", "Wesley Sneijder", "Mauro Icardi", "Dries Mertens", "Hakim Ziyech",
    "Fernando Muslera", "Gheorghe Hagi", "Lucas Torreira", "Baris Alper Yilmaz", "Michy Batshuayi"
  ],
  fenerbahce: [
    "Roberto Carlos", "Edin Dzeko", "Tadic", "Fred", "Arda Guler",
    "Dirk Kuyt", "Alex de Souza", "Robin van Persie"
  ]
}

const FOOTBALL_CLUB_TAGS_BY_NAME = new Map<string, FootballClubKey[]>()
for (const [club, names] of Object.entries(FOOTBALL_CLUB_POPULAR_XI) as Array<[RealFootballClubKey, readonly string[]]>) {
  for (const name of names) {
    const tags = FOOTBALL_CLUB_TAGS_BY_NAME.get(name) ?? []
    tags.push(club)
    FOOTBALL_CLUB_TAGS_BY_NAME.set(name, tags)
  }
}

function clubTagsForCard(name: string): FootballClubKey[] {
  return FOOTBALL_CLUB_TAGS_BY_NAME.get(name) ?? []
}

export const FOOTBALL_PLAYER_CARDS: readonly FootballPlayerCard[] = ALL_FOOTBALL_CARD_GROUPS.flatMap(group =>
  group.names.map((name, index) => ({
    name,
    category: group.category,
    leagueCategory: group.leagueCategory ?? leagueForCard(name, group.category),
    position: group.position,
    difficulty: cardDifficulty(index),
    clubTags: clubTagsForCard(name),
    hints: [
      group.category === "legends" ? "Football legend" : "Current star",
      footballLeagueLabel(group.leagueCategory ?? leagueForCard(name, group.category)),
      POSITION_HINTS[group.position],
      group.position === "goalkeeper" ? "Protects the goal" : "Outfield player"
    ]
  }))
)

const WORLD_POPULAR_STAR_NAMES = new Set<string>([
  "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappe", "Neymar", "Erling Haaland",
  "Mohamed Salah", "Kevin De Bruyne", "Vinicius Junior", "Jude Bellingham", "Harry Kane",
  "Robert Lewandowski", "Luka Modric", "Karim Benzema", "Sadio Mane", "Son Heung-min",
  "Antoine Griezmann", "Bruno Fernandes", "Bukayo Saka", "Phil Foden", "Rodri",
  "Pedri", "Lamine Yamal", "Rafael Leao", "Victor Osimhen", "Lautaro Martinez",
  "Paulo Dybala", "Angel Di Maria", "Eden Hazard", "Gareth Bale", "Wayne Rooney",
  "Sergio Aguero", "Luis Suarez", "Zlatan Ibrahimovic", "Ronaldinho", "Ronaldo Nazario",
  "Zinedine Zidane", "David Beckham", "Thierry Henry", "Andrea Pirlo", "Kaka",
  "Xavi", "Andres Iniesta", "Sergio Ramos", "Iker Casillas", "Gianluigi Buffon",
  "Manuel Neuer", "Virgil van Dijk", "N'Golo Kante", "Casemiro", "Paul Pogba",
  "Thomas Muller", "Marco Reus"
])

const CURRENT_SUPERSTAR_NAMES = new Set<string>([
  "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappe", "Neymar", "Erling Haaland",
  "Mohamed Salah", "Kevin De Bruyne", "Vinicius Junior", "Jude Bellingham", "Harry Kane",
  "Robert Lewandowski", "Karim Benzema", "Sadio Mane", "Son Heung-min", "Antoine Griezmann",
  "Bruno Fernandes", "Bukayo Saka", "Phil Foden", "Rodri", "Pedri", "Lamine Yamal",
  "Rafael Leao", "Victor Osimhen", "Lautaro Martinez", "Paulo Dybala", "Virgil van Dijk",
  "Casemiro"
])

const MODERN_LEGEND_NAMES = new Set<string>([
  "Luka Modric", "Karim Benzema", "Sadio Mane", "Angel Di Maria", "Eden Hazard",
  "Gareth Bale", "Wayne Rooney", "Sergio Aguero", "Luis Suarez", "Zlatan Ibrahimovic",
  "David Beckham", "Thierry Henry", "Andrea Pirlo", "Kaka", "Xavi", "Andres Iniesta",
  "Sergio Ramos", "Iker Casillas", "Gianluigi Buffon", "Manuel Neuer", "N'Golo Kante",
  "Paul Pogba", "Thomas Muller", "Marco Reus"
])

const GOAT_PLAYER_NAMES = new Set<string>([
  "Lionel Messi", "Cristiano Ronaldo", "Pele", "Diego Maradona", "Ronaldo Nazario",
  "Zinedine Zidane", "Ronaldinho", "Johan Cruyff", "Franz Beckenbauer", "Thierry Henry",
  "Xavi", "Andres Iniesta", "Luka Modric", "Gianluigi Buffon", "Iker Casillas",
  "Manuel Neuer", "Sergio Ramos"
])

function starCategoryMatch(card: FootballPlayerCard, starCategory: FootballStarCategoryKey): boolean {
  switch (starCategory) {
    case "all": return true
    case "world-popular-stars": return WORLD_POPULAR_STAR_NAMES.has(card.name)
    case "current-superstars": return CURRENT_SUPERSTAR_NAMES.has(card.name)
    case "modern-legends": return MODERN_LEGEND_NAMES.has(card.name)
    case "goat-players": return GOAT_PLAYER_NAMES.has(card.name)
  }
}

function clubMatch(card: FootballPlayerCard, club: FootballClubKey): boolean {
  switch (club) {
    case "all": return true
    case "mixed-clubs": return card.clubTags.length > 0
    case "world-popular-clubs": return card.clubTags.some(tag => FOOTBALL_WORLD_POPULAR_CLUB_KEYS.includes(tag as RealFootballClubKey))
    default: return card.clubTags.includes(club)
  }
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function difficultyRank(value: FootballDifficulty): number {
  switch (value) {
    case "easy": return 1
    case "medium": return 2
    case "hard": return 3
  }
}

export function pickFootballCards(
  count: number,
  category: FootballCategoryKey,
  league: FootballLeagueKey,
  starCategory: FootballStarCategoryKey,
  club: FootballClubKey,
  difficulty: FootballDifficulty,
  allowDuplicates: boolean,
  rng: () => number = Math.random
): FootballPlayerCard[] {
  const maxRank = difficultyRank(difficulty)
  const pool = FOOTBALL_PLAYER_CARDS.filter(card => {
    const categoryMatch = category === "mixed" || card.category === category
    const leagueMatch =
      league === "mixed" ||
      (league === "european-mixed" && FOOTBALL_EUROPE_LEAGUE_KEYS.includes(card.leagueCategory as typeof FOOTBALL_EUROPE_LEAGUE_KEYS[number])) ||
      card.leagueCategory === league
    return categoryMatch && leagueMatch && starCategoryMatch(card, starCategory) && clubMatch(card, club) && difficultyRank(card.difficulty) <= maxRank
  })

  if (pool.length === 0) throw new Error("NO_FOOTBALL_CARDS")
  if (!allowDuplicates && pool.length < count) throw new Error("NOT_ENOUGH_FOOTBALL_CARDS")

  if (!allowDuplicates) return shuffle(pool, rng).slice(0, count)

  const cards: FootballPlayerCard[] = []
  for (let i = 0; i < count; i++) {
    cards.push(pool[Math.floor(rng() * pool.length)]!)
  }
  return cards
}
