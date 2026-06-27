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
  | "bayer-leverkusen"
  | "juventus"
  | "ac-milan"
  | "inter-milan"
  | "atalanta"
  | "atletico-madrid"
  | "sevilla"
  | "tottenham-hotspur"
  | "newcastle"
  | "aston-villa"
  | "ajax"
  | "benfica"
  | "porto"
  | "sporting-cp"
  | "napoli"
  | "roma"
  | "galatasaray"
  | "fenerbahce"
  | "besiktas"
  | "trabzonspor"
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
  | "mls"
  | "brazilian-serie-a"
  | "argentine-liga"
  | "j-league"
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
  { key: "newcastle", label: "Newcastle United" },
  { key: "aston-villa", label: "Aston Villa" },
  { key: "tottenham-hotspur", label: "Tottenham Hotspur" },
  { key: "bayern-munich", label: "Bayern Munich" },
  { key: "borussia-dortmund", label: "Borussia Dortmund" },
  { key: "bayer-leverkusen", label: "Bayer Leverkusen" },
  { key: "juventus", label: "Juventus" },
  { key: "ac-milan", label: "AC Milan" },
  { key: "inter-milan", label: "Inter Milan" },
  { key: "atalanta", label: "Atalanta" },
  { key: "atletico-madrid", label: "Atletico Madrid" },
  { key: "sevilla", label: "Sevilla" },
  { key: "ajax", label: "Ajax" },
  { key: "benfica", label: "Benfica" },
  { key: "porto", label: "Porto" },
  { key: "sporting-cp", label: "Sporting CP" },
  { key: "napoli", label: "Napoli" },
  { key: "roma", label: "Roma" },
  { key: "galatasaray", label: "Galatasaray" },
  { key: "fenerbahce", label: "Fenerbahce" },
  { key: "besiktas", label: "Besiktas" },
  { key: "trabzonspor", label: "Trabzonspor" }
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
  { key: "mls", label: "MLS (USA)" },
  { key: "brazilian-serie-a", label: "Brazilian Serie A" },
  { key: "argentine-liga", label: "Argentine Liga" },
  { key: "j-league", label: "J-League (Japan)" },
  { key: "other-leagues", label: "Other Leagues" },
  { key: "classic-legends", label: "Classic Legends" }
]

export const FOOTBALL_EUROPE_LEAGUE_KEYS: readonly Exclude<FootballLeagueKey, "mixed" | "european-mixed" | "saudi-pro-league" | "mls" | "brazilian-serie-a" | "argentine-liga" | "j-league" | "other-leagues" | "classic-legends">[] = [
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
export const FOOTBALL_MAX_HINTS = [1, 2] as const

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
  "mls": "MLS (USA)",
  "brazilian-serie-a": "Brazilian Serie A",
  "argentine-liga": "Argentine Liga",
  "j-league": "J-League (Japan)",
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
      "Fernando Muslera", "Rustu Recber", "Volkan Demirel", "Recep Bolatci", "Engin Ipekoglu",
      "Hugo Lloris", "Keylor Navas", "Gianluca Pagliuca", "Francesco Toldo", "Sergio Goycochea",
      "Nelson Dida", "Ivo Viktor", "Antonio Carbajal"
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
      "Mats Hummels", "Walter Samuel", "Bulent Korkmaz", "Alpay Ozalan", "Fatih Akyel",
      "Emre Belozoglu", "Andrea Barzagli", "Jamie Carragher", "Patrice Evra", "Gary Neville",
      "Stephane Henchoz", "Nelson Cabanas", "Tony Adams", "Steve Bruce"
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
      "Robert Pires", "Freddie Ljungberg", "Guti", "Ariel Ortega", "Tomas Rosicky",
      "Tugay Kerimoglu", "Hamit Altintop", "Yildiray Bastürk", "Hasan Sas", "Ergun Penbe"
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
      "Pierre Littbarski", "Rudi Voller", "Karl-Heinz Rummenigge", "Uwe Seeler", "Sandor Kocsis",
      "Hakan Sukur", "Tanju Colak", "Metin Oktay", "Lefter Kuçukandonyadis", "Cemil Turan",
      "Nihat Kahveci", "Tuncay Sanli", "Ilhan Mansiz", "Hami Mandirali", "Ronaldo de Lima",
      "Adriano", "Bebeto", "Careca", "Mario Jardel", "Gabriel Omar Batistuta"
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
      "Robert Sanchez", "Jose Sa", "Bernd Leno", "Mattia Perin", "Ivan Provedel",
      "Lukas Hradecky", "Yann Sommer", "Marco Bizot", "Predrag Rajkovic", "Anthony Lopes",
      "Ugurcan Cakir", "Mert Gunok", "Dominik Livakovic", "Maarten Vandevoordt", "Bart Verbruggen"
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
      "Lucas Hernandez", "Milan Skriniar", "Kalidou Koulibaly", "Nicolas Otamendi", "Aymeric Laporte",
      "Dean Henderson", "Sven Botman", "Ezri Konsa", "Pau Cubarsi", "Inigo Martinez",
      "Jonathan Tah", "Edmond Tapsoba", "David Carmo", "Cristhian Mosquera", "Goncalo Inacio",
      "Merih Demiral", "Caglar Soyuncu", "Mert Muldur", "Zeki Celik", "Ozan Kabak"
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
      "Dani Olmo", "Mikel Merino", "Martin Zubimendi", "Ismael Bennacer", "Yunus Musah",
      "Arda Guler", "Salih Ozcan", "Orkun Kokcu", "Kerem Akturkoglu", "Ismail Yuksek",
      "Yves Bissouma", "Cole Palmer", "Eberechi Eze", "Morgan Gibbs-White", "Pierre-Emile Hojbjerg",
      "Granit Xhaka", "Exequiel Palacios", "Robert Andrich", "Charles De Ketelaere", "Mario Pasalic",
      "Eljif Elmas", "Stanislav Lobotka", "Tijjani Reijnders", "Nicolo Rovella"
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
      "Ferran Torres", "Lamine Yamal", "Raphinha", "Memphis Depay", "Sadio Mane",
      "Anthony Gordon", "Bryan Mbeumo", "Eddie Nketiah", "Yoane Wissa", "Dominic Solanke",
      "Hugo Ekitike", "Goncalo Ramos", "Bradley Barcola", "Endrick", "Joao Pedro",
      "Evan Ferguson", "Mathys Tel", "Mathias Olivera", "Folarin Balogun", "Marcus Thuram",
      "Pedro Neto", "Joaquin Correa", "Mehdi Taremi", "Cengiz Under", "Yusuf Yazici",
      "Halil Akbunar", "Enes Unal", "Cenk Tosun", "Burak Yilmaz", "Umut Bozok"
    ]
  }
] as const

const FOOTBALL_SMALL_EUROPEAN_LEAGUE_GROUPS: readonly FootballCardGroup[] = [
  // Turkish Super Lig — beefed up
  { category: "current-stars", leagueCategory: "turkish-super-lig", position: "goalkeeper", names: ["Fernando Muslera", "Ugurcan Cakir", "Mert Gunok", "Dominik Livakovic", "Irfan Can Egribayat"] },
  { category: "current-stars", leagueCategory: "turkish-super-lig", position: "defender", names: ["Bright Osayi-Samuel", "Alexander Djiku", "Merih Demiral", "Kaan Ayhan", "Davinson Sanchez", "Abdulkerim Bardakci", "Victor Nelsson", "Mert Muldur"] },
  { category: "current-stars", leagueCategory: "turkish-super-lig", position: "midfielder", names: ["Fred", "Lucas Torreira", "Hakim Ziyech", "Dusan Tadic", "Gedson Fernandes", "Sebastian Szymanski", "Ismail Yuksek", "Salih Ozcan", "Orkun Kokcu"] },
  { category: "current-stars", leagueCategory: "turkish-super-lig", position: "forward", names: ["Mauro Icardi", "Edin Dzeko", "Baris Alper Yilmaz", "Dries Mertens", "Michy Batshuayi", "Kerem Akturkoglu", "Edon Zhegrova", "Cenk Tosun", "Wout Weghorst"] },

  // Portuguese Liga
  { category: "current-stars", leagueCategory: "portuguese-liga", position: "goalkeeper", names: ["Diogo Costa", "Anatoliy Trubin", "Franco Israel", "Samuel Soares"] },
  { category: "current-stars", leagueCategory: "portuguese-liga", position: "defender", names: ["Antonio Silva", "Goncalo Inacio", "Pepe", "Nuno Mendes", "David Carmo", "Wendell"] },
  { category: "current-stars", leagueCategory: "portuguese-liga", position: "midfielder", names: ["Joao Neves", "Pedro Goncalves", "Orkun Kokcu", "Alan Varela", "Florentino Luis", "Morten Hjulmand", "Hidemasa Morita"] },
  { category: "current-stars", leagueCategory: "portuguese-liga", position: "forward", names: ["Viktor Gyokeres", "Angel Di Maria", "Rafa Silva", "Mehdi Taremi", "Francisco Trincao", "Vangelis Pavlidis", "Marcus Edwards", "Galeno"] },

  // Eredivisie
  { category: "current-stars", leagueCategory: "eredivisie", position: "goalkeeper", names: ["Bart Verbruggen", "Justin Bijlow", "Lars Unnerstall", "Andries Noppert"] },
  { category: "current-stars", leagueCategory: "eredivisie", position: "defender", names: ["Jorrel Hato", "Sven Mijnans", "Quilindschy Hartman", "Lutsharel Geertruida"] },
  { category: "current-stars", leagueCategory: "eredivisie", position: "midfielder", names: ["Jerdy Schouten", "Quinten Timber", "Kenneth Taylor", "Guus Til", "Malik Tillman", "Mauro Junior", "Joey Veerman"] },
  { category: "current-stars", leagueCategory: "eredivisie", position: "forward", names: ["Luuk de Jong", "Steven Bergwijn", "Brian Brobbey", "Santiago Gimenez", "Johan Bakayoko", "Sem Steijn", "Vangelis Pavlidis", "Calvin Stengs"] },

  // Belgian Pro League
  { category: "current-stars", leagueCategory: "belgian-pro-league", position: "goalkeeper", names: ["Maarten Vandevoordt", "Senne Lammens", "Matej Kovar"] },
  { category: "current-stars", leagueCategory: "belgian-pro-league", position: "defender", names: ["Zeno Debast", "Maxime De Cuyper", "Brandon Mechele", "Joaquin Seys"] },
  { category: "current-stars", leagueCategory: "belgian-pro-league", position: "midfielder", names: ["Hans Vanaken", "Charles Vanhoutte", "Raphael Onyedika", "Bilal El Khannouss", "Cameron Puertas", "Aleksandar Stankovic", "Jan Vertonghen"] },
  { category: "current-stars", leagueCategory: "belgian-pro-league", position: "forward", names: ["Andreas Skov Olsen", "Igor Thiago", "Tolu Arokodare", "Kasper Dolberg", "Gift Orban", "Hugo Cuypers", "Christian Kouame"] },

  // Scottish Premiership
  { category: "current-stars", leagueCategory: "scottish-premiership", position: "goalkeeper", names: ["Jack Butland", "Joe Hart", "Liam Kelly", "Kasper Schmeichel"] },
  { category: "current-stars", leagueCategory: "scottish-premiership", position: "defender", names: ["Connor Goldson", "Cameron Carter-Vickers", "Liam Scales", "Borna Barisic"] },
  { category: "current-stars", leagueCategory: "scottish-premiership", position: "midfielder", names: ["Callum McGregor", "Matt O'Riley", "Nicolas Raskin", "Todd Cantwell", "Reo Hatate", "Tom Lawrence", "Daniel Cummings"] },
  { category: "current-stars", leagueCategory: "scottish-premiership", position: "forward", names: ["Kyogo Furuhashi", "Daizen Maeda", "James Tavernier", "Cyriel Dessers", "Lawrence Shankland", "Adam Idah", "Danilo Pereira"] },

  // Austrian Bundesliga
  { category: "current-stars", leagueCategory: "austrian-bundesliga", position: "goalkeeper", names: ["Niklas Hedl", "Patrick Pentz", "Tobias Lawal"] },
  { category: "current-stars", leagueCategory: "austrian-bundesliga", position: "defender", names: ["David Affengruber", "Aleksandar Dragovic", "Strahinja Pavlovic", "Maximilian Wober"] },
  { category: "current-stars", leagueCategory: "austrian-bundesliga", position: "midfielder", names: ["Nicolas Seiwald", "Maurits Kjaergaard", "Oscar Gloukh", "Alexander Prass", "Matthias Seidl", "Lukas Wallner", "Yusuf Demir"] },
  { category: "current-stars", leagueCategory: "austrian-bundesliga", position: "forward", names: ["Karim Konate", "Junior Adamu", "Benjamin Sesko", "Marco Grull", "Guido Burgstaller", "Marko Arnautovic", "Ercan Kara", "Petar Ratkov"] },

  // Swiss Super League
  { category: "current-stars", leagueCategory: "swiss-super-league", position: "goalkeeper", names: ["Yvon Mvogo", "Marwin Hitz", "Mirko Salvi"] },
  { category: "current-stars", leagueCategory: "swiss-super-league", position: "defender", names: ["Aurele Amenda", "Lewin Blum", "Becir Omeragic", "Ulisses Garcia"] },
  { category: "current-stars", leagueCategory: "swiss-super-league", position: "midfielder", names: ["Granit Xhaka", "Fabian Rieder", "Ardon Jashari", "Xherdan Shaqiri", "Vincent Sierro", "Renato Steffen", "Filip Ugrinic"] },
  { category: "current-stars", leagueCategory: "swiss-super-league", position: "forward", names: ["Jean-Pierre Nsame", "Cedric Itten", "Zeki Amdouni", "Andi Zeqiri", "Thierno Barry", "Breel Embolo", "Dan Ndoye"] },

  // Danish Superliga
  { category: "current-stars", leagueCategory: "danish-superliga", position: "goalkeeper", names: ["Kamil Grabara", "Anders Hermansen", "Magnus Reynir"] },
  { category: "current-stars", leagueCategory: "danish-superliga", position: "defender", names: ["Joel Andersson", "Jacob Rasmussen", "Maxime Soulas", "Daniel Wass"] },
  { category: "current-stars", leagueCategory: "danish-superliga", position: "midfielder", names: ["Morten Hjulmand", "Mikkel Damsgaard", "Jesper Lindstrom", "Christian Norgaard", "Thomas Delaney", "Mathias Jensen", "Jeppe Gronning"] },
  { category: "current-stars", leagueCategory: "danish-superliga", position: "forward", names: ["Roony Bardghji", "Andreas Cornelius", "Mohamed Elyounoussi", "Patrick Mortensen", "Ernest Nuamah", "Mika Biereth", "Conrad Harder"] },

  // Norwegian Eliteserien
  { category: "current-stars", leagueCategory: "norwegian-eliteserien", position: "goalkeeper", names: ["Andre Hansen", "Erlend Dahl Reitan", "Magnus Sjoeng Solli"] },
  { category: "current-stars", leagueCategory: "norwegian-eliteserien", position: "defender", names: ["Stefan Strandberg", "Andreas Vindheim", "Brede Moe", "Kristian Eriksen"] },
  { category: "current-stars", leagueCategory: "norwegian-eliteserien", position: "midfielder", names: ["Patrick Berg", "Hugo Vetlesen", "Sondre Fet", "Markus Henriksen", "Emil Breivik", "Fredrik Bjorkan", "Sondre Brunstad Fet"] },
  { category: "current-stars", leagueCategory: "norwegian-eliteserien", position: "forward", names: ["Amahl Pellegrino", "Albert Gronbaek", "Ola Solbakken", "Bard Finne", "Akor Adams", "Sondre Liseth", "Veton Berisha"] },

  // Swedish Allsvenskan
  { category: "current-stars", leagueCategory: "swedish-allsvenskan", position: "goalkeeper", names: ["Hugo Pettersson", "Aly Keita", "Carl Wennstam"] },
  { category: "current-stars", leagueCategory: "swedish-allsvenskan", position: "defender", names: ["Jacob Rinne", "Daniel Sundgren", "Pontus Almqvist", "Eric Bjorkander"] },
  { category: "current-stars", leagueCategory: "swedish-allsvenskan", position: "midfielder", names: ["Hugo Larsson", "Samuel Gustafson", "Anders Christiansen", "Oliver Berg", "Taha Ali", "Gustav Ludwigson", "Pierre Bengtsson"] },
  { category: "current-stars", leagueCategory: "swedish-allsvenskan", position: "forward", names: ["Alexander Jeremejeff", "Isaac Kiese Thelin", "Sebastian Nanasi", "Nahir Besara", "Viktor Djukanovic", "Daniel Hoegh", "Daleho Irandust"] },

  // Greek Super League
  { category: "current-stars", leagueCategory: "greek-super-league", position: "goalkeeper", names: ["Konstantinos Tzolakis", "Alexandros Paschalakis", "Lampros Karaoulis"] },
  { category: "current-stars", leagueCategory: "greek-super-league", position: "defender", names: ["Sokratis Papastathopoulos", "Kostas Manolas", "David Carmo", "Lazaros Rota"] },
  { category: "current-stars", leagueCategory: "greek-super-league", position: "midfielder", names: ["Konstantinos Fortounis", "Bernard", "Mijat Gacinovic", "Sergio Araujo", "Daniel Podence", "Gerasimos Mitoglou", "Tasos Bakasetas"] },
  { category: "current-stars", leagueCategory: "greek-super-league", position: "forward", names: ["Ayoub El Kaabi", "Fotis Ioannidis", "Levi Garcia", "Andraz Sporar", "Kiril Despodov", "Tete", "Anastasios Douvikas"] },

  // Croatian HNL
  { category: "current-stars", leagueCategory: "croatian-hnl", position: "goalkeeper", names: ["Dominik Livakovic", "Ivica Ivusic", "Dominik Kotarski"] },
  { category: "current-stars", leagueCategory: "croatian-hnl", position: "defender", names: ["Josko Gvardiol", "Borna Sosa", "Domagoj Vida", "Josip Sutalo"] },
  { category: "current-stars", leagueCategory: "croatian-hnl", position: "midfielder", names: ["Luka Sucic", "Martin Baturina", "Lovro Majer", "Luka Ivanusec", "Marcelo Brozovic", "Mateo Kovacic", "Petar Sucic"] },
  { category: "current-stars", leagueCategory: "croatian-hnl", position: "forward", names: ["Bruno Petkovic", "Marko Livaja", "Mislav Orsic", "Dion Drena Beljo", "Matija Frigan", "Andrej Kramaric", "Antonio Marin"] },

  // Serbian SuperLiga
  { category: "current-stars", leagueCategory: "serbian-superliga", position: "goalkeeper", names: ["Predrag Rajkovic", "Marko Dmitrovic", "Vanja Milinkovic-Savic"] },
  { category: "current-stars", leagueCategory: "serbian-superliga", position: "defender", names: ["Strahinja Pavlovic", "Nikola Milenkovic", "Erhan Masovic", "Stefan Mitrovic"] },
  { category: "current-stars", leagueCategory: "serbian-superliga", position: "midfielder", names: ["Uros Spajic", "Sasa Zdjelar", "Guelor Kanga", "Mirko Ivanic", "Marko Grujic", "Sergej Milinkovic-Savic", "Aleksandar Lutovac"] },
  { category: "current-stars", leagueCategory: "serbian-superliga", position: "forward", names: ["Aleksandar Mitrovic", "Aleksandar Katai", "Luka Jovic", "Cherif Ndiaye", "Samed Bazdar", "Dusan Vlahovic", "Filip Kostic"] },

  // Ukrainian Premier League
  { category: "current-stars", leagueCategory: "ukrainian-premier-league", position: "goalkeeper", names: ["Anatoliy Trubin", "Andriy Lunin", "Heorhiy Bushchan"] },
  { category: "current-stars", leagueCategory: "ukrainian-premier-league", position: "defender", names: ["Mykola Matviyenko", "Vitaliy Mykolenko", "Eduard Sobol", "Bohdan Mykhaylichenko"] },
  { category: "current-stars", leagueCategory: "ukrainian-premier-league", position: "midfielder", names: ["Georgiy Sudakov", "Oleksandr Zinchenko", "Taras Stepanenko", "Mykola Shaparenko", "Ruslan Malinovskyi", "Andriy Yarmolenko", "Heorhiy Tsitaishvili"] },
  { category: "current-stars", leagueCategory: "ukrainian-premier-league", position: "forward", names: ["Artem Dovbyk", "Mykhailo Mudryk", "Viktor Tsygankov", "Danylo Sikan", "Vladyslav Vanat", "Roman Yaremchuk", "Yegor Yarmolyuk"] },

  // Czech First League
  { category: "current-stars", leagueCategory: "czech-first-league", position: "goalkeeper", names: ["Jindrich Stanek", "Matej Kovar", "Vitezslav Jaros"] },
  { category: "current-stars", leagueCategory: "czech-first-league", position: "defender", names: ["David Hancko", "Ladislav Krejci", "Tomas Holes", "Robin Hranac"] },
  { category: "current-stars", leagueCategory: "czech-first-league", position: "midfielder", names: ["Tomas Soucek", "Antonin Barak", "Lukas Provod", "Alex Kral", "Vaclav Cerny", "Mojmir Chytil"] },
  { category: "current-stars", leagueCategory: "czech-first-league", position: "forward", names: ["Patrik Schick", "Adam Hlozek", "Jan Kuchta", "Tomas Chory", "Vaclav Jurecka", "Mojmir Chytil"] },

  // Polish Ekstraklasa
  { category: "current-stars", leagueCategory: "polish-ekstraklasa", position: "goalkeeper", names: ["Lukasz Skorupski", "Marcin Bulka", "Wojciech Szczesny"] },
  { category: "current-stars", leagueCategory: "polish-ekstraklasa", position: "defender", names: ["Jakub Kiwior", "Pawel Dawidowicz", "Bartosz Bereszynski", "Tymoteusz Puchacz"] },
  { category: "current-stars", leagueCategory: "polish-ekstraklasa", position: "midfielder", names: ["Piotr Zielinski", "Jakub Moder", "Sebastian Szymanski", "Damian Szymanski", "Bartosz Slisz", "Mateusz Klich", "Nicola Zalewski"] },
  { category: "current-stars", leagueCategory: "polish-ekstraklasa", position: "forward", names: ["Erik Exposito", "Krzysztof Piatek", "Arkadiusz Milik", "Kamil Grosicki", "Efthymis Koulouris", "Karol Swiderski", "Adam Buksa"] }
] as const

// New league groups: MLS, Brazilian Serie A, Argentine Liga, J-League, Saudi Pro League expansion
const FOOTBALL_NEW_LEAGUE_GROUPS: readonly FootballCardGroup[] = [
  // Saudi Pro League — beefed up
  { category: "current-stars", leagueCategory: "saudi-pro-league", position: "goalkeeper", names: ["Bono", "David Ospina", "Edouard Mendy", "Nawaf Al-Aqidi", "Mohammed Al-Owais"] },
  { category: "current-stars", leagueCategory: "saudi-pro-league", position: "defender", names: ["Kalidou Koulibaly", "Aymeric Laporte", "Ruben Neves", "Roger Ibanez", "Joao Cancelo", "Marquinhos"] },
  { category: "current-stars", leagueCategory: "saudi-pro-league", position: "midfielder", names: ["N'Golo Kante", "Sergej Milinkovic-Savic", "Allan Saint-Maximin", "Marcelo Brozovic", "Fabinho", "Houssem Aouar", "Otavio"] },
  { category: "current-stars", leagueCategory: "saudi-pro-league", position: "forward", names: ["Cristiano Ronaldo", "Karim Benzema", "Sadio Mane", "Riyad Mahrez", "Neymar", "Roberto Firmino", "Aleksandar Mitrovic", "Anderson Talisca", "Jhon Duran", "Ivan Toney"] },

  // MLS (USA)
  { category: "current-stars", leagueCategory: "mls", position: "goalkeeper", names: ["Matt Turner", "Drake Callender", "Roman Burki", "William Yarbrough"] },
  { category: "current-stars", leagueCategory: "mls", position: "defender", names: ["Walker Zimmerman", "Jordan Pefok", "Aaron Long", "Sergio Busquets", "DeAndre Yedlin", "Tim Ream"] },
  { category: "current-stars", leagueCategory: "mls", position: "midfielder", names: ["Sergio Busquets", "Jordi Alba", "Hany Mukhtar", "Lorenzo Insigne", "Carles Gil", "Luciano Acosta", "Christian Roldan", "Sebastian Driussi"] },
  { category: "current-stars", leagueCategory: "mls", position: "forward", names: ["Lionel Messi", "Luis Suarez", "Cucho Hernandez", "Denis Bouanga", "Federico Bernardeschi", "Daniel Gazdag", "Christian Benteke", "Josef Martinez", "Olivier Giroud", "Christian Ramirez"] },

  // Brazilian Serie A (Brasileirao)
  { category: "current-stars", leagueCategory: "brazilian-serie-a", position: "goalkeeper", names: ["Weverton", "Hugo Souza", "John Victor", "Cassio", "Marcelo Lomba"] },
  { category: "current-stars", leagueCategory: "brazilian-serie-a", position: "defender", names: ["Gustavo Gomez", "David Luiz", "Murilo", "Vitor Hugo", "Renato Augusto", "Felipe Melo"] },
  { category: "current-stars", leagueCategory: "brazilian-serie-a", position: "midfielder", names: ["Andreas Pereira", "Hulk", "Lucas Lima", "Diego", "Giorgian de Arrascaeta", "Raphael Veiga", "Andrey Santos"] },
  { category: "current-stars", leagueCategory: "brazilian-serie-a", position: "forward", names: ["Pedro", "Endrick", "Estevao", "Yuri Alberto", "Marcos Leonardo", "Roger Guedes", "Gabigol", "Vitor Roque", "Vitor Reis", "Tiquinho Soares"] },

  // Argentine Liga Profesional
  { category: "current-stars", leagueCategory: "argentine-liga", position: "goalkeeper", names: ["Sergio Romero", "Franco Armani", "Cristopher Toselli", "Marcos Diaz"] },
  { category: "current-stars", leagueCategory: "argentine-liga", position: "defender", names: ["Marcos Rojo", "Marcos Acuna", "Cristian Lema", "Lucas Martinez Quarta", "Walter Kannemann"] },
  { category: "current-stars", leagueCategory: "argentine-liga", position: "midfielder", names: ["Edinson Cavani", "Cristian Medina", "Equi Fernandez", "Ignacio Fernandez", "Maximiliano Meza", "Diego Valeri", "Thiago Almada"] },
  { category: "current-stars", leagueCategory: "argentine-liga", position: "forward", names: ["Miguel Borja", "Adam Bareiro", "Cristian Tarragona", "Sebastian Driussi", "Lucas Beltran", "Pablo Vegetti", "Jorman Campuzano", "Cristian Pavon"] },

  // J-League (Japan)
  { category: "current-stars", leagueCategory: "j-league", position: "goalkeeper", names: ["Eiji Kawashima", "Daniel Schmidt", "Zion Suzuki", "Kosei Tani"] },
  { category: "current-stars", leagueCategory: "j-league", position: "defender", names: ["Maya Yoshida", "Sho Sasaki", "Hiroki Sakai", "Takehiro Tomiyasu", "Ko Itakura"] },
  { category: "current-stars", leagueCategory: "j-league", position: "midfielder", names: ["Hidemasa Morita", "Yuki Soma", "Junya Ito", "Wataru Endo", "Daichi Kamada", "Takefusa Kubo", "Hiroki Ito"] },
  { category: "current-stars", leagueCategory: "j-league", position: "forward", names: ["Ayase Ueda", "Mao Hosoya", "Ado Onaiwu", "Daizen Maeda", "Shuto Machino", "Yuya Osako", "Anderson Lopes", "Marcinho"] }
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

/* Nationality data — grouped by country so the list stays maintainable.
   Used to produce the country hint (1st of 2 hints). */
const NATIONALITY_GROUPS: Record<string, string[]> = {
  "Argentina": [
    "Lionel Messi", "Diego Maradona", "Sergio Aguero", "Carlos Tevez", "Juan Roman Riquelme",
    "Gabriel Batistuta", "Hernan Crespo", "Mario Kempes", "Daniel Passarella", "Ubaldo Fillol",
    "Jose Luis Chilavert", "Sergio Romero", "Claudio Caniggia", "Ariel Ortega", "Juan Sebastian Veron",
    "Fernando Redondo", "Esteban Cambiasso", "Javier Zanetti", "Walter Samuel", "Nicolas Otamendi",
    "Lisandro Martinez", "Cristian Romero", "Marcos Acuna", "Lucas Martinez Quarta", "Marcos Rojo",
    "Cristian Lema", "Walter Kannemann", "Franco Armani", "Lionel Scaloni", "Angel Di Maria",
    "Paulo Dybala", "Lautaro Martinez", "Julian Alvarez", "Alexis Mac Allister", "Enzo Fernandez",
    "Joaquin Correa", "Emiliano Martinez", "Thiago Almada", "Equi Fernandez", "Cristian Medina",
    "Ignacio Fernandez", "Maximiliano Meza", "Diego Valeri", "Lucas Beltran", "Pablo Vegetti",
    "Jorman Campuzano", "Cristian Pavon", "Adam Bareiro", "Sebastian Driussi", "Cristian Tarragona",
    "Miguel Borja", "Omar Sivori", "Sergio Goycochea", "Cristopher Toselli", "Marcos Diaz", "Andrey Santos"
  ],
  "Brazil": [
    "Pele", "Ronaldo Nazario", "Ronaldinho", "Romario", "Kaka", "Cafu", "Roberto Carlos",
    "Carlos Alberto", "Nilton Santos", "Djalma Santos", "Junior", "Gilmar", "Socrates", "Didi", "Gerson",
    "Garrincha", "Jairzinho", "Roberto Rivelino", "Rivaldo", "Hulk", "Bebeto", "Careca",
    "Mario Jardel", "Adriano", "Ronaldo de Lima", "Claudio Taffarel", "Dida", "Julio Cesar",
    "Marquinhos", "Vinicius Junior", "Rodrygo", "Neymar", "Casemiro", "Gabriel Jesus",
    "Gabriel Martinelli", "Raphinha", "Richarlison", "Philippe Coutinho", "Thiago Silva",
    "Dani Alves", "Marcelo", "Alisson Becker", "Ederson", "Andreas Pereira", "Lucas Lima",
    "Diego", "Giorgian de Arrascaeta", "Raphael Veiga", "Pedro", "Endrick", "Estevao",
    "Yuri Alberto", "Marcos Leonardo", "Roger Guedes", "Gabigol", "Vitor Roque", "Vitor Reis",
    "Tiquinho Soares", "Gustavo Gomez", "David Luiz", "Murilo", "Vitor Hugo", "Renato Augusto",
    "Felipe Melo", "Weverton", "Hugo Souza", "John Victor", "Cassio", "Marcelo Lomba",
    "Mauro Junior", "Anderson Lopes", "Marcinho", "Anderson Talisca", "Roberto Firmino",
    "Igor Thiago", "Wendell", "Bernard", "Tete", "Galeno", "Wesley Sneijder"
  ],
  "Portugal": [
    "Cristiano Ronaldo", "Eusebio", "Luis Figo", "Deco", "Rui Costa", "Pepe", "Ricardo Carvalho",
    "Bruno Fernandes", "Bernardo Silva", "Diogo Jota", "Joao Felix", "Joao Cancelo", "Ruben Dias",
    "Vitinha", "Nuno Mendes", "Rafael Leao", "Goncalo Ramos", "Joao Neves", "Antonio Silva",
    "Goncalo Inacio", "Diogo Costa", "Jose Sa", "Pedro Goncalves", "Florentino Luis",
    "Rafa Silva", "Francisco Trincao", "Mehdi Taremi", "Renato Sanches", "Pedro Neto",
    "Otavio", "Ruben Neves", "David Carmo", "Samuel Soares", "Franco Israel",
    "Hidemasa Morita"
  ],
  "Spain": [
    "Iker Casillas", "Xavi", "Andres Iniesta", "Sergio Ramos", "Carles Puyol", "Andoni Zubizarreta",
    "Ricardo Zamora", "Fernando Hierro", "Sergio Busquets", "Cesc Fabregas", "David Silva", "Xabi Alonso",
    "David Villa", "Fernando Torres", "Raul", "Marc-Andre ter Stegen", "Unai Simon", "Robert Sanchez",
    "Kepa Arrizabalaga", "Dani Olmo", "Mikel Merino", "Martin Zubimendi", "Pedri", "Gavi", "Lamine Yamal",
    "Ferran Torres", "Ansu Fati", "Alvaro Morata", "Aymeric Laporte", "Alejandro Balde", "Pau Cubarsi",
    "Inigo Martinez", "Cristhian Mosquera", "Pau Torres", "Dani Carvajal", "Rodri", "Koke", "Jordi Alba",
    "Guti", "Fernando Llorente", "Mikel Oyarzabal", "Joselu", "Pedro Porro", "Hector Bellerin",
    "Erik Exposito", "Marco Asensio", "Saul Niguez", "Iago Aspas", "Sergio Busquets", "Cesc Fabregas"
  ],
  "France": [
    "Zinedine Zidane", "Michel Platini", "Thierry Henry", "Fabien Barthez", "Lilian Thuram",
    "Marcel Desailly", "Patrick Vieira", "Claude Makelele", "Laurent Blanc", "Eric Cantona",
    "Robert Pires", "Franck Ribery", "Hugo Lloris", "Mike Maignan", "Kylian Mbappe", "Antoine Griezmann",
    "N'Golo Kante", "Paul Pogba", "Aurelien Tchouameni", "Eduardo Camavinga", "Warren Zaire-Emery",
    "William Saliba", "Jules Kounde", "Theo Hernandez", "Lucas Hernandez", "Ferland Mendy",
    "Dayot Upamecano", "Randal Kolo Muani", "Ousmane Dembele", "Marcus Thuram", "Kingsley Coman",
    "Christopher Nkunku", "Olivier Giroud", "David Trezeguet", "Karim Benzema", "Bradley Barcola",
    "Hugo Ekitike", "Anthony Lopes", "Wesley Fofana", "Adrien Rabiot", "Manuel Ugarte", "Moussa Diaby",
    "Folarin Balogun", "Mathys Tel", "Robert Andrich"
  ],
  "Germany": [
    "Franz Beckenbauer", "Gerd Muller", "Sepp Maier", "Oliver Kahn", "Manuel Neuer", "Philipp Lahm",
    "Lothar Matthaus", "Matthias Sammer", "Andreas Brehme", "Berti Vogts", "Paul Breitner",
    "Bastian Schweinsteiger", "Toni Kroos", "Miroslav Klose", "Pierre Littbarski", "Rudi Voller",
    "Karl-Heinz Rummenigge", "Uwe Seeler", "Jurgen Klinsmann", "Michael Ballack", "Thomas Muller",
    "Marco Reus", "Mats Hummels", "Mesut Ozil", "Jamal Musiala", "Florian Wirtz", "Joshua Kimmich",
    "Leon Goretzka", "Kai Havertz", "Niclas Fullkrug", "Leroy Sane", "Serge Gnabry", "Timo Werner",
    "Marc-Andre ter Stegen", "Bernd Leno", "Jonathan Tah", "Nico Schlotterbeck", "Pascal Gross"
  ],
  "Italy": [
    "Dino Zoff", "Gianluigi Buffon", "Walter Zenga", "Paolo Maldini", "Franco Baresi", "Alessandro Nesta",
    "Fabio Cannavaro", "Gaetano Scirea", "Giacinto Facchetti", "Giuseppe Bergomi", "Claudio Gentile",
    "Andrea Pirlo", "Daniele De Rossi", "Marco Verratti", "Andrea Barzagli", "Giorgio Chiellini",
    "Leonardo Bonucci", "Alessandro Bastoni", "Federico Dimarco", "Francesco Acerbi",
    "Roberto Baggio", "Alessandro Del Piero", "Francesco Totti", "Paolo Rossi", "Sandro Mazzola",
    "Gianni Rivera", "Giuseppe Meazza", "Gianluigi Donnarumma", "Alex Meret", "Guglielmo Vicario",
    "Mattia Perin", "Ivan Provedel", "Nicolo Barella", "Sandro Tonali", "Lorenzo Insigne",
    "Federico Chiesa", "Ciro Immobile", "Mario Balotelli", "Andrea Belotti", "Mateo Retegui",
    "Davide Frattesi", "Nicolo Rovella", "Demetrio Albertini", "Gennaro Gattuso", "Gianfranco Zola"
  ],
  "England": [
    "Bobby Charlton", "Bobby Moore", "Gordon Banks", "Peter Shilton", "David Beckham", "Wayne Rooney",
    "Steven Gerrard", "Frank Lampard", "Paul Scholes", "Rio Ferdinand", "John Terry", "Sol Campbell",
    "Ashley Cole", "Gary Lineker", "Michael Owen", "Alan Shearer", "Teddy Sheringham", "Ian Rush",
    "Kenny Dalglish", "Harry Kane", "Jude Bellingham", "Bukayo Saka", "Phil Foden", "Marcus Rashford",
    "Trent Alexander-Arnold", "Declan Rice", "Mason Mount", "James Maddison", "Conor Gallagher",
    "Kyle Walker", "John Stones", "Reece James", "Ben White", "Marc Guehi", "Levi Colwill",
    "Ezri Konsa", "Ollie Watkins", "Jarrod Bowen", "Ivan Toney", "Alexander Isak", "Callum Wilson",
    "Anthony Gordon", "Eddie Nketiah", "Cole Palmer", "Dominic Solanke", "Eberechi Eze",
    "Morgan Gibbs-White", "Aaron Ramsdale", "Jordan Pickford", "Nick Pope", "Dean Henderson",
    "Tammy Abraham", "Jadon Sancho", "Tony Adams", "Steve Bruce", "Jamie Carragher", "Gary Neville",
    "David Seaman", "Joe Hart", "Tim Ream"
  ],
  "Netherlands": [
    "Johan Cruyff", "Marco van Basten", "Ruud Gullit", "Frank Rijkaard", "Dennis Bergkamp",
    "Clarence Seedorf", "Edwin van der Sar", "Wesley Sneijder", "Robin van Persie", "Arjen Robben",
    "Patrick Kluivert", "Ruud van Nistelrooy", "Edgar Davids", "Ronald Koeman", "Ruud Krol",
    "Jaap Stam", "Virgil van Dijk", "Matthijs de Ligt", "Stefan de Vrij", "Nathan Ake",
    "Denzel Dumfries", "Jeremie Frimpong", "Frenkie de Jong", "Cody Gakpo", "Memphis Depay",
    "Xavi Simons", "Steven Bergwijn", "Donyell Malen", "Wout Weghorst", "Brian Brobbey",
    "Luuk de Jong", "Ryan Gravenberch", "Tijjani Reijnders", "Justin Bijlow", "Bart Verbruggen",
    "Jorrel Hato", "Sven Mijnans", "Quilindschy Hartman", "Lutsharel Geertruida", "Jerdy Schouten",
    "Quinten Timber", "Kenneth Taylor", "Guus Til", "Joey Veerman", "Calvin Stengs", "Sem Steijn",
    "Daley Blind", "Georginio Wijnaldum", "Bart Verbruggen", "Lars Unnerstall", "Andries Noppert",
    "Dirk Kuyt"
  ],
  "Belgium": [
    "Eden Hazard", "Kevin De Bruyne", "Vincent Kompany", "Romelu Lukaku", "Thibaut Courtois",
    "Yannick Carrasco", "Dries Mertens", "Axel Witsel", "Jan Vertonghen", "Toby Alderweireld",
    "Michel Preudhomme", "Jean-Marie Pfaff", "Charles De Ketelaere", "Jeremy Doku", "Leandro Trossard",
    "Loic Openda", "Maxim De Cuyper", "Zeno Debast", "Maxime De Cuyper", "Brandon Mechele",
    "Joaquin Seys", "Hans Vanaken", "Charles Vanhoutte", "Roméo Lavia", "Yannick Ferrera",
    "Senne Lammens", "Maarten Vandevoordt", "Koen Casteels", "Michy Batshuayi", "Christian Benteke",
    "Christian Kouame"
  ],
  "Croatia": [
    "Luka Modric", "Zvonimir Boban", "Davor Suker", "Mateo Kovacic", "Marcelo Brozovic", "Ivan Rakitic",
    "Ivan Perisic", "Andrej Kramaric", "Domagoj Vida", "Borna Sosa", "Josip Sutalo", "Josko Gvardiol",
    "Luka Sucic", "Martin Baturina", "Lovro Majer", "Luka Ivanusec", "Petar Sucic", "Bruno Petkovic",
    "Marko Livaja", "Mislav Orsic", "Dion Drena Beljo", "Matija Frigan", "Antonio Marin",
    "Dominik Livakovic", "Ivica Ivusic", "Dominik Kotarski"
  ],
  "Serbia": [
    "Dejan Stankovic", "Branislav Ivanovic", "Nemanja Vidic", "Predrag Mijatovic", "Dragan Stojkovic",
    "Aleksandar Mitrovic", "Dusan Vlahovic", "Filip Kostic", "Sergej Milinkovic-Savic", "Marko Grujic",
    "Strahinja Pavlovic", "Nikola Milenkovic", "Erhan Masovic", "Stefan Mitrovic", "Predrag Rajkovic",
    "Marko Dmitrovic", "Vanja Milinkovic-Savic", "Uros Spajic", "Sasa Zdjelar", "Mirko Ivanic",
    "Aleksandar Katai", "Luka Jovic", "Samed Bazdar", "Marko Arnautovic", "Aleksandar Lutovac",
    "Aleksandar Stankovic"
  ],
  "Sweden": [
    "Zlatan Ibrahimovic", "Henrik Larsson", "Andreas Cornelius", "Daniel Sundgren", "Pierre Bengtsson",
    "Hugo Larsson", "Samuel Gustafson", "Anders Christiansen", "Oliver Berg", "Alexander Isak",
    "Viktor Gyokeres", "Sebastian Nanasi", "Nahir Besara", "Alexander Jeremejeff", "Isaac Kiese Thelin",
    "Taha Ali", "Carl Wennstam", "Jacob Rinne", "Pontus Almqvist", "Eric Bjorkander",
    "Daleho Irandust", "Daniel Hoegh", "Gustav Ludwigson", "Roony Bardghji", "Hugo Pettersson",
    "Aly Keita", "Niclas Eliasson", "Anthony Elanga", "Robin Olsen"
  ],
  "Denmark": [
    "Brian Laudrup", "Michael Laudrup", "Peter Schmeichel", "Christian Eriksen", "Andreas Christensen",
    "Pierre-Emile Hojbjerg", "Joachim Andersen", "Simon Kjaer", "Yussuf Poulsen", "Rasmus Hojlund",
    "Mikkel Damsgaard", "Jesper Lindstrom", "Christian Norgaard", "Thomas Delaney", "Mathias Jensen",
    "Jeppe Gronning", "Patrick Mortensen", "Mika Biereth", "Conrad Harder", "Daniel Wass",
    "Jacob Rasmussen", "Joel Andersson", "Maxime Soulas", "Kamil Grabara", "Anders Hermansen",
    "Magnus Reynir", "Kasper Schmeichel", "Kasper Dolberg", "Magnus Kofod Andersen"
  ],
  "Norway": [
    "Erling Haaland", "Martin Odegaard", "Alexander Sorloth", "Albert Gronbaek", "Ola Solbakken",
    "Patrick Berg", "Hugo Vetlesen", "Sondre Fet", "Markus Henriksen", "Emil Breivik", "Fredrik Bjorkan",
    "Sondre Brunstad Fet", "Amahl Pellegrino", "Bard Finne", "Sondre Liseth", "Veton Berisha",
    "Andre Hansen", "Erlend Dahl Reitan", "Magnus Sjoeng Solli", "Stefan Strandberg", "Andreas Vindheim",
    "Brede Moe", "Kristian Eriksen"
  ],
  "Poland": [
    "Robert Lewandowski", "Wojciech Szczesny", "Lukasz Skorupski", "Marcin Bulka", "Jakub Kiwior",
    "Pawel Dawidowicz", "Bartosz Bereszynski", "Tymoteusz Puchacz", "Piotr Zielinski", "Jakub Moder",
    "Sebastian Szymanski", "Damian Szymanski", "Bartosz Slisz", "Mateusz Klich", "Nicola Zalewski",
    "Krzysztof Piatek", "Arkadiusz Milik", "Kamil Grosicki", "Karol Swiderski", "Adam Buksa"
  ],
  "Czech Republic": [
    "Pavel Nedved", "Tomas Rosicky", "Petr Cech", "Patrik Schick", "Adam Hlozek", "Jan Kuchta",
    "Tomas Chory", "Vaclav Jurecka", "Tomas Soucek", "Antonin Barak", "Lukas Provod", "Ladislav Krejci",
    "Alex Kral", "Mojmir Chytil", "Vaclav Cerny", "David Hancko", "Tomas Holes", "Robin Hranac",
    "Jindrich Stanek", "Matej Kovar", "Vitezslav Jaros", "Ivo Viktor"
  ],
  "Hungary": [
    "Ferenc Puskas", "Sandor Kocsis", "Jozsef Bozsik", "Dominik Szoboszlai", "Andras Schafer",
    "Roland Sallai", "Willi Orban", "Peter Gulacsi"
  ],
  "Ukraine": [
    "Andriy Shevchenko", "Anatoliy Trubin", "Andriy Lunin", "Heorhiy Bushchan", "Mykola Matviyenko",
    "Vitaliy Mykolenko", "Eduard Sobol", "Bohdan Mykhaylichenko", "Georgiy Sudakov", "Oleksandr Zinchenko",
    "Taras Stepanenko", "Mykola Shaparenko", "Ruslan Malinovskyi", "Andriy Yarmolenko", "Heorhiy Tsitaishvili",
    "Artem Dovbyk", "Mykhailo Mudryk", "Viktor Tsygankov", "Danylo Sikan", "Vladyslav Vanat",
    "Roman Yaremchuk", "Yegor Yarmolyuk"
  ],
  "Russia": [
    "Lev Yashin", "Andrey Arshavin", "Aleksandr Kerzhakov", "Roman Pavlyuchenko", "Aleksandr Golovin",
    "Fedor Smolov", "Anton Zabolotny"
  ],
  "Greece": [
    "Konstantinos Tzolakis", "Alexandros Paschalakis", "Lampros Karaoulis", "Sokratis Papastathopoulos",
    "Kostas Manolas", "Lazaros Rota", "Konstantinos Fortounis", "Mijat Gacinovic", "Gerasimos Mitoglou",
    "Tasos Bakasetas", "Fotis Ioannidis", "Anastasios Douvikas", "Efthymis Koulouris", "Konstantinos Mavropanos"
  ],
  "Turkey": [
    "Fernando Muslera", "Hakan Sukur", "Hakan Calhanoglu", "Arda Guler", "Cengiz Under", "Burak Yilmaz",
    "Yusuf Yazici", "Halil Akbunar", "Enes Unal", "Cenk Tosun", "Tugay Kerimoglu", "Hamit Altintop",
    "Yildiray Bastürk", "Hasan Sas", "Ergun Penbe", "Bulent Korkmaz", "Alpay Ozalan", "Fatih Akyel",
    "Emre Belozoglu", "Rustu Recber", "Volkan Demirel", "Recep Bolatci", "Engin Ipekoglu",
    "Tanju Colak", "Metin Oktay", "Lefter Kuçukandonyadis", "Cemil Turan", "Nihat Kahveci",
    "Tuncay Sanli", "Ilhan Mansiz", "Hami Mandirali", "Ugurcan Cakir", "Mert Gunok", "Irfan Can Egribayat",
    "Merih Demiral", "Kaan Ayhan", "Abdulkerim Bardakci", "Mert Muldur", "Caglar Soyuncu", "Zeki Celik",
    "Ozan Kabak", "Salih Ozcan", "Orkun Kokcu", "Kerem Akturkoglu", "Ismail Yuksek",
    "Baris Alper Yilmaz", "Umut Bozok", "Alex de Souza"
  ],
  "Switzerland": [
    "Granit Xhaka", "Xherdan Shaqiri", "Yann Sommer", "Breel Embolo", "Dan Ndoye", "Fabian Rieder",
    "Ardon Jashari", "Vincent Sierro", "Renato Steffen", "Filip Ugrinic", "Jean-Pierre Nsame",
    "Cedric Itten", "Zeki Amdouni", "Andi Zeqiri", "Thierno Barry", "Yvon Mvogo", "Marwin Hitz",
    "Mirko Salvi", "Aurele Amenda", "Lewin Blum", "Becir Omeragic", "Ulisses Garcia", "Manuel Akanji",
    "Stephane Henchoz", "Manuel Obafemi Akanji"
  ],
  "Austria": [
    "Niklas Hedl", "Patrick Pentz", "Tobias Lawal", "David Affengruber", "Aleksandar Dragovic",
    "Maximilian Wober", "Nicolas Seiwald", "Maurits Kjaergaard", "Oscar Gloukh", "Alexander Prass",
    "Matthias Seidl", "Lukas Wallner", "Yusuf Demir", "Karim Konate", "Junior Adamu", "Marco Grull",
    "Guido Burgstaller", "Marko Arnautovic", "Ercan Kara", "Petar Ratkov", "Konrad Laimer", "Christoph Baumgartner"
  ],
  "Slovenia": [
    "Jan Oblak", "Benjamin Sesko", "Andraz Sporar", "Josip Ilicic"
  ],
  "Slovakia": [
    "Marek Hamsik", "Milan Skriniar", "Stanislav Lobotka", "Ondrej Duda"
  ],
  "Bulgaria": [
    "Hristo Stoichkov", "Kiril Despodov", "Ilia Gruev"
  ],
  "Romania": [
    "Gheorghe Hagi", "Adrian Mutu", "Florin Raducioiu"
  ],
  "Wales": [
    "Gareth Bale", "Aaron Ramsey", "Daniel James"
  ],
  "Scotland": [
    "Andrew Robertson", "Kenny Dalglish", "John McGinn", "Scott McTominay", "Liam Scales", "Tom Lawrence",
    "Connor Goldson", "Cameron Carter-Vickers", "Borna Barisic", "Lyndon Dykes", "Callum McGregor",
    "Matt O'Riley", "Nicolas Raskin", "Todd Cantwell", "Reo Hatate", "Daniel Cummings", "James Tavernier",
    "Cyriel Dessers", "Lawrence Shankland", "Adam Idah", "Danilo Pereira", "Jack Butland", "Liam Kelly"
  ],
  "Ireland": [
    "Roy Keane", "Damien Duff", "Robbie Keane", "Evan Ferguson"
  ],
  "Northern Ireland": [
    "George Best", "Pat Jennings", "Steven Davis"
  ],
  "Finland": [
    "Sami Hyypia", "Teemu Pukki", "Lukas Hradecky"
  ],
  "Iceland": [
    "Gylfi Sigurdsson", "Aron Gunnarsson", "Albert Gudmundsson"
  ],
  "Bosnia and Herzegovina": [
    "Edin Dzeko", "Edin Visca", "Miralem Pjanic"
  ],
  "Albania": [
    "Lorik Cana", "Armando Broja"
  ],
  "Kosovo": [
    "Edon Zhegrova", "Bernard Berisha"
  ],
  "Georgia": [
    "Khvicha Kvaratskhelia", "Giorgi Mamardashvili"
  ],
  "Senegal": [
    "Sadio Mane", "Edouard Mendy", "Kalidou Koulibaly", "Yassine Bounou"
  ],
  "Morocco": [
    "Achraf Hakimi", "Hakim Ziyech", "Bilal El Khannouss", "Brahim Diaz", "Yassine Bounou", "Sofyan Amrabat",
    "Mehdi Taremi"
  ],
  "Egypt": [
    "Mohamed Salah", "Trezeguet", "Mohamed Elneny"
  ],
  "Ivory Coast": [
    "Didier Drogba", "Yaya Toure", "Wilfried Zaha", "Sebastien Haller", "Eric Bailly", "Franck Kessie", "Nicolas Pepe",
    "Christian Kouame"
  ],
  "Cameroon": [
    "Samuel Eto'o", "Roger Milla", "Andre Onana", "Vincent Aboubakar", "Karl Toko Ekambi"
  ],
  "Nigeria": [
    "Victor Osimhen", "Jay-Jay Okocha", "Ademola Lookman", "Samuel Chukwueze", "Wilfred Ndidi", "Alex Iwobi",
    "Tolu Arokodare", "Gift Orban", "Cherif Ndiaye", "Raphael Onyedika"
  ],
  "Ghana": [
    "Abedi Pele", "Samuel Kuffour", "Mohammed Kudus", "Thomas Partey", "Inaki Williams"
  ],
  "Liberia": [
    "George Weah"
  ],
  "Algeria": [
    "Riyad Mahrez", "Ismael Bennacer", "Houssem Aouar", "Said Benrahma"
  ],
  "Tunisia": [
    "Wahbi Khazri", "Hannibal Mejbri"
  ],
  "South Korea": [
    "Son Heung-min", "Kim Min-jae", "Lee Kang-in", "Hwang Hee-chan", "Hwang In-beom"
  ],
  "Japan": [
    "Eiji Kawashima", "Daniel Schmidt", "Zion Suzuki", "Kosei Tani", "Maya Yoshida", "Sho Sasaki",
    "Hiroki Sakai", "Takehiro Tomiyasu", "Ko Itakura", "Hidemasa Morita", "Yuki Soma", "Junya Ito",
    "Wataru Endo", "Daichi Kamada", "Takefusa Kubo", "Hiroki Ito", "Ayase Ueda", "Mao Hosoya",
    "Ado Onaiwu", "Daizen Maeda", "Shuto Machino", "Yuya Osako", "Kyogo Furuhashi"
  ],
  "Australia": [
    "Tim Cahill", "Harry Souttar", "Mathew Ryan", "Aaron Mooy"
  ],
  "USA": [
    "Christian Pulisic", "Tyler Adams", "Weston McKennie", "Giovanni Reyna", "Yunus Musah", "Folarin Balogun",
    "Brenden Aaronson", "Matt Turner", "Drake Callender", "Walker Zimmerman", "Jordan Pefok",
    "Aaron Long", "DeAndre Yedlin", "Tim Ream", "Christian Roldan", "Sebastian Driussi", "Daniel Gazdag",
    "Cucho Hernandez", "Christian Ramirez", "Josef Martinez", "Hany Mukhtar", "Carles Gil",
    "Luciano Acosta", "William Yarbrough"
  ],
  "Mexico": [
    "Hugo Sanchez", "Jorge Campos", "Antonio Carbajal", "Rafael Marquez", "Hirving Lozano", "Edson Alvarez",
    "Raul Jimenez", "Santiago Gimenez", "Cesar Montes"
  ],
  "Colombia": [
    "Carlos Valderrama", "James Rodriguez", "Radamel Falcao", "Luis Diaz", "David Ospina", "Davinson Sanchez",
    "Jhon Duran", "Rene Higuita", "Cucho Hernandez"
  ],
  "Uruguay": [
    "Edinson Cavani", "Luis Suarez", "Diego Forlan", "Darwin Nunez", "Federico Valverde", "Ronald Araujo",
    "Maximiliano Araujo", "Nicolas De La Cruz", "Manuel Ugarte", "Sergio Rochet", "Fernando Muslera", "Enzo Francescoli",
    "Mathias Olivera"
  ],
  "Chile": [
    "Alexis Sanchez", "Arturo Vidal", "Claudio Bravo", "Eduardo Vargas", "Ben Brereton"
  ],
  "Peru": [
    "Paolo Guerrero", "Andre Carrillo", "Renato Tapia"
  ],
  "Paraguay": [
    "Roque Santa Cruz", "Miguel Almiron", "Adam Bareiro"
  ],
  "Ecuador": [
    "Antonio Valencia", "Moises Caicedo", "Piero Hincapie", "Pervis Estupinan", "Enner Valencia"
  ],
  "Venezuela": [
    "Salomon Rondon", "Yeferson Soteldo", "Tomas Rincon", "Roberto Rosales"
  ],
  "Bolivia": [
    "Marcelo Moreno Martins", "Carmelo Algaranaz"
  ],
  "Costa Rica": [
    "Keylor Navas", "Bryan Ruiz", "Joel Campbell"
  ],
  "Honduras": [
    "Maynor Figueroa", "Anthony Lozano"
  ],
  "Jamaica": [
    "Leon Bailey", "Michail Antonio"
  ],
  "Iran": [
    "Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh", "Ali Karimi"
  ],
  "Saudi Arabia": [
    "Salem Al-Dawsari", "Yasser Al-Shahrani", "Salman Al-Faraj", "Nawaf Al-Aqidi", "Mohammed Al-Owais"
  ],
  "Qatar": [
    "Akram Afif", "Almoez Ali", "Hassan Al-Haydos"
  ],
  "Israel": [
    "Eran Zahavi", "Manor Solomon", "Oscar Gloukh", "Liel Abada"
  ],
  "Yugoslavia": [
    "Dragan Dzajic"
  ],
  "Soviet Union": [
    "Oleg Blokhin", "Igor Belanov"
  ],
  "Czechoslovakia": [
    "Antonin Panenka"
  ],
  "Bulgaria-East": [
    "Trifon Ivanov"
  ]
}

const NATIONALITY_BY_NAME = new Map<string, string>()
for (const [country, names] of Object.entries(NATIONALITY_GROUPS)) {
  for (const name of names) {
    if (!NATIONALITY_BY_NAME.has(name)) NATIONALITY_BY_NAME.set(name, country)
  }
}

function nationalityFor(name: string): string {
  return NATIONALITY_BY_NAME.get(name) ?? "International"
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
    "Ivan Toney", "Jarrod Bowen", "Moussa Diaby", "Anthony Gordon", "Bryan Mbeumo", "Eddie Nketiah",
    "Yoane Wissa", "Dominic Solanke", "Evan Ferguson", "Cole Palmer", "Eberechi Eze",
    "Morgan Gibbs-White", "Pierre-Emile Hojbjerg", "Dean Henderson", "Sven Botman", "Ezri Konsa",
    "Pedro Neto", "Mathias Olivera", "Joao Pedro"
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
    "Ferran Torres", "Lamine Yamal", "Raphinha", "Memphis Depay", "Pau Cubarsi", "Inigo Martinez",
    "Aymeric Laporte", "Goncalo Inacio", "Cristhian Mosquera"
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
    "Tammy Abraham", "Ciro Immobile", "Romelu Lukaku", "Charles De Ketelaere", "Mario Pasalic",
    "Marcus Thuram", "Stanislav Lobotka", "Eljif Elmas", "Tijjani Reijnders", "Nicolo Rovella",
    "Mateo Retegui", "Davide Frattesi"
  ].map(name => [name, "serie-a"] as const),
  ...[
    "Oliver Kahn", "Manuel Neuer", "Sepp Maier", "Franz Beckenbauer", "Philipp Lahm",
    "Matthias Sammer", "Andreas Brehme", "Berti Vogts", "Paul Breitner", "Lothar Matthaus",
    "Bastian Schweinsteiger", "Toni Kroos", "Miroslav Klose", "Pierre Littbarski", "Rudi Voller",
    "Karl-Heinz Rummenigge", "Uwe Seeler", "Jurgen Klinsmann", "Gerd Muller", "Gregor Kobel", "Koen Casteels",
    "Alphonso Davies", "Dayot Upamecano", "Kim Min-jae", "Lucas Hernandez", "Joshua Kimmich",
    "Leon Goretzka", "Thomas Muller", "Marco Reus", "Mats Hummels", "Jamal Musiala", "Florian Wirtz",
    "Xavi Simons", "Harry Kane", "Leroy Sane", "Serge Gnabry", "Kingsley Coman", "Jeremie Frimpong",
    "Granit Xhaka", "Exequiel Palacios", "Robert Andrich", "Jonathan Tah", "Edmond Tapsoba",
    "Lukas Hradecky", "Yann Sommer", "Marco Bizot", "Predrag Rajkovic", "Donyell Malen"
  ].map(name => [name, "bundesliga"] as const),
  ...[
    "Fabien Barthez", "Lilian Thuram", "Marcel Desailly", "Michel Platini", "Marco Verratti",
    "Gianluigi Donnarumma", "Yassine Bounou", "Marquinhos", "Achraf Hakimi", "Jules Kounde",
    "Theo Hernandez", "Nuno Mendes", "Vitinha", "Warren Zaire-Emery", "Manuel Ugarte",
    "Neymar", "Edinson Cavani", "Randal Kolo Muani", "Ousmane Dembele", "Anthony Lopes",
    "Bradley Barcola", "Hugo Ekitike", "Lucas Hernandez"
  ].map(name => [name, "ligue-1"] as const),
  ...[
    "Karim Benzema", "Sadio Mane", "Cristiano Ronaldo", "Bono", "David Ospina", "Edouard Mendy",
    "Nawaf Al-Aqidi", "Mohammed Al-Owais", "Kalidou Koulibaly", "Aymeric Laporte", "Ruben Neves",
    "Roger Ibanez", "Joao Cancelo", "Marquinhos", "N'Golo Kante", "Sergej Milinkovic-Savic",
    "Allan Saint-Maximin", "Marcelo Brozovic", "Fabinho", "Houssem Aouar", "Otavio",
    "Riyad Mahrez", "Neymar", "Roberto Firmino", "Aleksandar Mitrovic", "Anderson Talisca",
    "Jhon Duran", "Ivan Toney", "Salem Al-Dawsari"
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
  ...FOOTBALL_SMALL_EUROPEAN_LEAGUE_GROUPS,
  ...FOOTBALL_NEW_LEAGUE_GROUPS
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
  "ac-milan",
  "inter-milan",
  "atletico-madrid"
]

export const FOOTBALL_CLUB_POPULAR_XI: Record<RealFootballClubKey, readonly string[]> = {
  "real-madrid": [
    "Cristiano Ronaldo", "Karim Benzema", "Vinicius Junior", "Luka Modric", "Toni Kroos",
    "Jude Bellingham", "Sergio Ramos", "Marcelo", "Roberto Carlos", "Iker Casillas", "Zinedine Zidane",
    "Raul", "Casemiro", "James Rodriguez", "Mesut Ozil", "Xabi Alonso", "Pepe", "Eder Militao",
    "Aurelien Tchouameni", "Eduardo Camavinga", "Federico Valverde", "Rodrygo", "Antonio Rudiger",
    "Dani Carvajal", "Ferland Mendy", "Thibaut Courtois", "Andriy Lunin", "Kylian Mbappe",
    "Endrick", "Alfredo Di Stefano", "Raphael Varane", "Sergio Reguilon", "Brahim Diaz"
  ],
  "barcelona": [
    "Lionel Messi", "Ronaldinho", "Neymar", "Luis Suarez", "Xavi",
    "Andres Iniesta", "Sergio Busquets", "Gerard Pique", "Carles Puyol", "Dani Alves", "Marc-Andre ter Stegen",
    "Pedri", "Gavi", "Frenkie de Jong", "Ilkay Gundogan", "Lamine Yamal", "Raphinha", "Robert Lewandowski",
    "Ferran Torres", "Joao Felix", "Dani Olmo", "Ronald Araujo", "Jules Kounde", "Alejandro Balde",
    "Pau Cubarsi", "Inigo Martinez", "Ansu Fati", "Eric Garcia", "Wojciech Szczesny", "Andres Iniesta",
    "Romario", "Hristo Stoichkov", "Patrick Kluivert", "Yamal", "Marc Casado", "Fermin Lopez",
    "David Villa", "Cesc Fabregas", "Memphis Depay"
  ],
  "manchester-united": [
    "Cristiano Ronaldo", "Wayne Rooney", "David Beckham", "Eric Cantona", "Paul Scholes",
    "Bruno Fernandes", "Rio Ferdinand", "Nemanja Vidic", "Peter Schmeichel", "Marcus Rashford", "Casemiro",
    "Roy Keane", "Gary Neville", "Patrice Evra", "Ruud van Nistelrooy", "Edwin van der Sar", "Andre Onana",
    "Jadon Sancho", "Mason Mount", "Antony", "Lisandro Martinez", "Harry Maguire", "Luke Shaw",
    "Diogo Dalot", "Rasmus Hojlund", "Alejandro Garnacho", "Kobbie Mainoo", "Joshua Zirkzee",
    "Manuel Ugarte", "Leny Yoro", "Robin van Persie", "Teddy Sheringham", "Andy Cole",
    "Dimitar Berbatov", "Steve Bruce", "Tony Adams"
  ],
  "manchester-city": [
    "Erling Haaland", "Sergio Aguero", "Kevin De Bruyne", "David Silva", "Bernardo Silva",
    "Phil Foden", "Yaya Toure", "Rodri", "Ruben Dias", "Vincent Kompany", "Ederson",
    "Joshua Kimmich", "Kyle Walker", "John Stones", "Manuel Akanji", "Joao Cancelo", "Nathan Ake",
    "Josko Gvardiol", "Jeremy Doku", "Julian Alvarez", "Mateo Kovacic", "Jack Grealish", "Riyad Mahrez",
    "Sterling", "Gabriel Jesus", "Aymeric Laporte", "Ilkay Gundogan", "Savinho", "Matheus Nunes",
    "Mario Balotelli", "James Milner"
  ],
  "paris-saint-germain": [
    "Lionel Messi", "Kylian Mbappe", "Neymar", "Zlatan Ibrahimovic", "Edinson Cavani",
    "Angel Di Maria", "Marco Verratti", "Achraf Hakimi", "Marquinhos", "Thiago Silva", "Gianluigi Donnarumma",
    "Ousmane Dembele", "Bradley Barcola", "Goncalo Ramos", "Vitinha", "Warren Zaire-Emery",
    "Manuel Ugarte", "Fabian Ruiz", "Nuno Mendes", "Lucas Hernandez", "Randal Kolo Muani",
    "Khvicha Kvaratskhelia", "Bernardo Silva", "Pierre-Emerick Aubameyang", "Mauro Icardi", "Adrien Rabiot",
    "Lucas Moura", "Mauricio Pochettino", "David Beckham", "Hugo Ekitike"
  ],
  liverpool: [
    "Mohamed Salah", "Steven Gerrard", "Virgil van Dijk", "Alisson Becker", "Trent Alexander-Arnold",
    "Andrew Robertson", "Luis Suarez", "Fernando Torres", "Michael Owen", "Kenny Dalglish", "Ian Rush",
    "Sadio Mane", "Roberto Firmino", "Diogo Jota", "Cody Gakpo", "Darwin Nunez", "Luis Diaz",
    "Dominik Szoboszlai", "Alexis Mac Allister", "Ryan Gravenberch", "Wataru Endo", "Curtis Jones",
    "Harvey Elliott", "Joe Gomez", "Ibrahima Konate", "Kostas Tsimikas", "Diogo Dalot", "Conor Bradley",
    "Caoimhin Kelleher", "Federico Chiesa"
  ],
  chelsea: [
    "Didier Drogba", "Frank Lampard", "Eden Hazard", "N'Golo Kante", "Petr Cech",
    "Claude Makelele", "Ashley Cole", "John Terry", "Ricardo Carvalho", "Cesc Fabregas", "Michael Ballack",
    "Cole Palmer", "Enzo Fernandez", "Moises Caicedo", "Nicolas Jackson", "Christopher Nkunku", "Reece James",
    "Levi Colwill", "Trevoh Chalobah", "Wesley Fofana", "Marc Cucurella", "Robert Sanchez",
    "Filip Jorgensen", "Pedro Neto", "Joao Felix", "Jadon Sancho", "Mykhailo Mudryk", "Romelu Lukaku",
    "Diego Costa", "Andriy Shevchenko", "Hernan Crespo", "Branislav Ivanovic"
  ],
  arsenal: [
    "Thierry Henry", "Dennis Bergkamp", "Patrick Vieira", "Robert Pires", "Freddie Ljungberg",
    "Mesut Ozil", "Cesc Fabregas", "Bukayo Saka", "Martin Odegaard", "David Seaman", "Sol Campbell",
    "Pierre-Emerick Aubameyang", "Alexis Sanchez", "Gabriel Jesus", "Gabriel Martinelli", "Kai Havertz",
    "Declan Rice", "William Saliba", "Ben White", "Gabriel Magalhaes", "Jurrien Timber",
    "Oleksandr Zinchenko", "Mikel Merino", "Riccardo Calafiori", "David Raya", "Aaron Ramsdale",
    "Leandro Trossard", "Raheem Sterling", "Eddie Nketiah", "Ian Wright", "Tony Adams"
  ],
  newcastle: [
    "Alexander Isak", "Anthony Gordon", "Bruno Guimaraes", "Sven Botman", "Kieran Trippier",
    "Nick Pope", "Sandro Tonali", "Joelinton", "Callum Wilson", "Miguel Almiron", "Sven Botman",
    "Fabian Schar", "Dan Burn", "Tino Livramento", "Lewis Hall", "Joe Willock", "Sean Longstaff",
    "Harvey Barnes", "Lloyd Kelly", "Ezri Konsa", "Allan Saint-Maximin", "Alan Shearer"
  ],
  "aston-villa": [
    "Ollie Watkins", "Jhon Duran", "Morgan Rogers", "Leon Bailey", "Pau Torres", "Diego Carlos",
    "Ezri Konsa", "Matty Cash", "Lucas Digne", "Emiliano Martinez", "Robin Olsen", "John McGinn",
    "Douglas Luiz", "Boubacar Kamara", "Youri Tielemans", "Amadou Onana", "Ross Barkley", "Ian Maatsen",
    "Marcus Rashford", "Marco Asensio"
  ],
  "tottenham-hotspur": [
    "Harry Kane", "Son Heung-min", "Gareth Bale", "Luka Modric", "Christian Eriksen",
    "Richarlison", "James Maddison", "Cristian Romero", "Teddy Sheringham", "Jurgen Klinsmann",
    "Dejan Kulusevski", "Brennan Johnson", "Pape Matar Sarr", "Yves Bissouma", "Rodrigo Bentancur",
    "Pedro Porro", "Destiny Udogie", "Micky van de Ven", "Guglielmo Vicario", "Dominic Solanke",
    "Heung-min Son", "Eric Dier", "Hugo Lloris", "Davinson Sanchez", "Antonio Rudiger", "Ledley King"
  ],
  "bayern-munich": [
    "Robert Lewandowski", "Manuel Neuer", "Oliver Kahn", "Franz Beckenbauer", "Philipp Lahm",
    "Joshua Kimmich", "Thomas Muller", "Arjen Robben", "Franck Ribery", "Bastian Schweinsteiger", "Lothar Matthaus",
    "Jamal Musiala", "Harry Kane", "Leroy Sane", "Serge Gnabry", "Kingsley Coman", "Alphonso Davies",
    "Dayot Upamecano", "Kim Min-jae", "Konrad Laimer", "Leon Goretzka", "Jamal Musiala", "Eric Dier",
    "Michael Olise", "Aleksandar Pavlovic", "Min-jae Kim", "Hiroki Ito", "Hiroki Ito"
  ],
  "borussia-dortmund": [
    "Marco Reus", "Erling Haaland", "Robert Lewandowski", "Jude Bellingham", "Jadon Sancho",
    "Mats Hummels", "Ilkay Gundogan", "Ousmane Dembele", "Giovanni Reyna", "Gregor Kobel",
    "Karim Adeyemi", "Niclas Fullkrug", "Donyell Malen", "Julian Brandt", "Marcel Sabitzer",
    "Pascal Gross", "Niko Schlotterbeck", "Felix Nmecha", "Maximilian Beier", "Waldemar Anton",
    "Pierre-Emerick Aubameyang", "Henrikh Mkhitaryan", "Mario Gotze", "Yann Sommer"
  ],
  "bayer-leverkusen": [
    "Florian Wirtz", "Alex Grimaldo", "Jeremie Frimpong", "Granit Xhaka", "Exequiel Palacios",
    "Jonathan Tah", "Edmond Tapsoba", "Piero Hincapie", "Lukas Hradecky", "Patrik Schick",
    "Victor Boniface", "Amine Adli", "Nathan Tella", "Robert Andrich", "Aleix Garcia",
    "Borja Iglesias", "Martin Terrier", "Matej Kovar", "Mario Hermoso", "Nordi Mukiele"
  ],
  juventus: [
    "Gianluigi Buffon", "Giorgio Chiellini", "Leonardo Bonucci", "Andrea Pirlo", "Zinedine Zidane",
    "Pavel Nedved", "Alessandro Del Piero", "David Trezeguet", "Cristiano Ronaldo", "Paulo Dybala", "Paul Pogba",
    "Dusan Vlahovic", "Federico Chiesa", "Adrien Rabiot", "Weston McKennie", "Manuel Locatelli",
    "Bremer", "Federico Gatti", "Andrea Cambiaso", "Khephren Thuram", "Teun Koopmeiners",
    "Nico Gonzalez", "Pierre Kalulu", "Douglas Luiz", "Michele Di Gregorio", "Mattia Perin",
    "Andrea Barzagli", "Giorgio Chiellini", "Massimiliano Allegri", "Carlos Tevez"
  ],
  "ac-milan": [
    "Paolo Maldini", "Franco Baresi", "Alessandro Nesta", "Kaka", "Andrea Pirlo",
    "Clarence Seedorf", "Gennaro Gattuso", "Andriy Shevchenko", "Ronaldinho", "Zlatan Ibrahimovic", "Dida",
    "Theo Hernandez", "Rafael Leao", "Mike Maignan", "Olivier Giroud", "Tijjani Reijnders", "Ruben Loftus-Cheek",
    "Fikayo Tomori", "Pierre Kalulu", "Ismael Bennacer", "Christian Pulisic", "Tammy Abraham",
    "Alvaro Morata", "Davide Calabria", "Strahinja Pavlovic", "Emerson Royal", "Yunus Musah",
    "Filippo Inzaghi", "Marco van Basten", "George Weah"
  ],
  "inter-milan": [
    "Javier Zanetti", "Ronaldo Nazario", "Samuel Eto'o", "Zlatan Ibrahimovic", "Wesley Sneijder",
    "Esteban Cambiasso", "Lautaro Martinez", "Romelu Lukaku", "Nicolo Barella", "Denzel Dumfries", "Julio Cesar",
    "Marcus Thuram", "Hakan Calhanoglu", "Henrikh Mkhitaryan", "Federico Dimarco", "Alessandro Bastoni",
    "Francesco Acerbi", "Yann Sommer", "Mehdi Taremi", "Piotr Zielinski", "Davide Frattesi",
    "Mehdi Taremi", "Marko Arnautovic", "Walter Samuel", "Diego Milito", "Andrea Pirlo",
    "Stefan de Vrij", "Joaquin Correa"
  ],
  atalanta: [
    "Charles De Ketelaere", "Ademola Lookman", "Mateo Retegui", "Marten de Roon", "Berat Djimsiti",
    "Mario Pasalic", "Davide Zappacosta", "Juan Cuadrado", "Sead Kolasinac", "Marco Carnesecchi",
    "Gianluca Scamacca", "Teun Koopmeiners", "Ederson", "Isak Hien", "Giorgio Scalvini",
    "Lazar Samardzic", "Pasquale Mazzocchi", "Nikola Krstovic"
  ],
  "atletico-madrid": [
    "Antoine Griezmann", "Fernando Torres", "Luis Suarez", "Sergio Aguero", "Diego Forlan",
    "Radamel Falcao", "Diego Godin", "Jan Oblak", "Koke", "Joao Felix",
    "Alvaro Morata", "Memphis Depay", "Alexander Sorloth", "Conor Gallagher", "Marcos Llorente",
    "Rodrigo De Paul", "Pablo Barrios", "Robin Le Normand", "Jose Maria Gimenez", "Cesar Azpilicueta",
    "Saul Niguez", "Yannick Carrasco", "Angel Correa", "Julian Alvarez", "Nahuel Molina"
  ],
  sevilla: [
    "Ivan Rakitic", "Sergio Ramos", "Lucas Ocampos", "Jesus Navas", "Youssef En-Nesyri",
    "Loic Bade", "Tanguy Nianzou", "Marcao", "Stanis Idumbo", "Saul Niguez",
    "Suso", "Rafa Mir", "Sergio Rico", "Federico Fazio", "Joan Jordan",
    "Diego Lopez", "Joaquin Correa", "Wissam Ben Yedder"
  ],
  ajax: [
    "Johan Cruyff", "Marco van Basten", "Frank Rijkaard", "Dennis Bergkamp", "Clarence Seedorf",
    "Wesley Sneijder", "Matthijs de Ligt", "Frenkie de Jong", "Edwin van der Sar", "Luis Suarez",
    "Jorrel Hato", "Brian Brobbey", "Steven Bergwijn", "Davy Klaassen", "Kenneth Taylor", "Christian Rasmussen",
    "Bertrand Traore", "Anton Gaaei", "Daley Blind", "Edson Alvarez", "Antony", "Andre Onana",
    "Nico Tagliafico", "Lasse Schone"
  ],
  benfica: [
    "Eusebio", "Angel Di Maria", "Joao Felix", "Joao Neves", "Rafa Silva",
    "Enzo Fernandez", "Darwin Nunez", "Ederson", "Alexander Bah", "Antonio Silva",
    "Nicolas Otamendi", "Renato Sanches", "Florentino Luis", "Vangelis Pavlidis", "Orkun Kokcu",
    "Arthur Cabral", "Petar Musa", "David Neres", "Tomas Araujo", "Bruma",
    "Anatoliy Trubin", "Alvaro Carreras", "Joao Mario"
  ],
  porto: [
    "Deco", "Pepe", "Diogo Costa", "Ricardo Carvalho", "Radamel Falcao",
    "James Rodriguez", "Hulk", "Luis Diaz", "Mehdi Taremi", "Pepe",
    "Galeno", "Otavio", "Stephen Eustaquio", "Alan Varela", "Wendell",
    "Evanilson", "Joao Mario", "Tiago Djalo", "Vitinha", "Andre Franco",
    "Wilson Manafa", "Iker Casillas"
  ],
  "sporting-cp": [
    "Viktor Gyokeres", "Pedro Goncalves", "Morten Hjulmand", "Hidemasa Morita", "Goncalo Inacio",
    "Eduardo Quaresma", "Franco Israel", "Marcus Edwards", "Geovany Quenda", "Maximiliano Araujo",
    "Conrad Harder", "Daniel Bragança", "Cristiano Ronaldo", "Vladan Kovacevic", "Matheus Reis",
    "Antonio Adan", "Manuel Ugarte"
  ],
  napoli: [
    "Diego Maradona", "Edinson Cavani", "Victor Osimhen", "Khvicha Kvaratskhelia", "Dries Mertens",
    "Ciro Immobile", "Fabio Cannavaro", "Gianfranco Zola", "Marek Hamsik", "Lorenzo Insigne",
    "Stanislav Lobotka", "Eljif Elmas", "Mathias Olivera", "Alessandro Buongiorno", "Romelu Lukaku",
    "Andre-Frank Zambo Anguissa", "Giovanni Di Lorenzo", "Amir Rrahmani", "Scott McTominay",
    "Billy Gilmour", "Alex Meret", "Pasquale Mazzocchi", "Mario Rui"
  ],
  roma: [
    "Francesco Totti", "Paulo Dybala", "Gabriel Batistuta", "Cafu", "Walter Samuel",
    "Daniele De Rossi", "Alisson Becker", "Edin Dzeko", "Tammy Abraham", "Romelu Lukaku",
    "Bryan Cristante", "Lorenzo Pellegrini", "Leandro Paredes", "Nicola Zalewski", "Mile Svilar",
    "Gianluca Mancini", "Mats Hummels", "Stephan El Shaarawy", "Manu Kone", "Artem Dovbyk",
    "Matias Soule", "Mario Hermoso", "Ola Aina", "Niccolo Pisilli", "Anthony Taty"
  ],
  galatasaray: [
    "Didier Drogba", "Wesley Sneijder", "Mauro Icardi", "Dries Mertens", "Hakim Ziyech",
    "Fernando Muslera", "Gheorghe Hagi", "Lucas Torreira", "Baris Alper Yilmaz", "Michy Batshuayi",
    "Kerem Akturkoglu", "Davinson Sanchez", "Victor Nelsson", "Kaan Ayhan", "Sergio Oliveira",
    "Wilfried Zaha", "Bright Osayi-Samuel", "Sacha Boey", "Mertens", "Halil Dervisoglu",
    "Mathias Jensen", "Salih Ozcan", "Singo", "Sara", "Yusuf Demir",
    "Tete", "Berkan Kutlu", "Metin Oktay", "Bulent Korkmaz", "Hakan Sukur"
  ],
  fenerbahce: [
    "Roberto Carlos", "Edin Dzeko", "Dusan Tadic", "Fred", "Arda Guler",
    "Dirk Kuyt", "Alex de Souza", "Robin van Persie", "Sebastian Szymanski", "Ismail Yuksek",
    "Dominik Livakovic", "Irfan Can Egribayat", "Bright Osayi-Samuel", "Alexander Djiku",
    "Rodrigo Becao", "Caglar Soyuncu", "Mert Muldur", "Mert Hakan Yandas", "Cengiz Under",
    "Allan Saint-Maximin", "Youssef En-Nesyri", "Cenk Tosun", "Diego Carlos", "Filip Kostic",
    "Edon Zhegrova", "Mikel John Obi", "Alper Potuk", "Mathieu Valbuena", "Anders Hermansen"
  ],
  besiktas: [
    "Hakan Sukur", "Quaresma", "Demba Ba", "Pepe", "Mario Gomez",
    "Cenk Tosun", "Ricardo Quaresma", "Nemanja Pejcinovic", "Ernst Mert Yetkin", "Vincent Aboubakar",
    "Necip Uysal", "Atiba Hutchinson", "Domagoj Vida", "Mert Gunok", "Rachid Ghezzal",
    "Salih Ucan", "Wout Weghorst", "Al-Musrati", "Gedson Fernandes", "Ciro Immobile",
    "Mustafa Hekimoglu", "Felix Uduokhai", "Joao Mario", "Kerem Atakan Kesgin", "Rafa Silva",
    "Tayyip Talha Sanuc", "Yiannis Hodzic"
  ],
  trabzonspor: [
    "Caglar Soyuncu", "Edin Visca", "Edgar Ie", "Marek Hamsik", "Anastasios Bakasetas",
    "Sopo Hrustic", "Trezeguet", "Mahmoud Trezeguet", "Joaquin Pereyra", "Paul Onuachu",
    "Anastasios Donis", "Vitor Hugo", "Ugurcan Cakir", "Stefano Denswil", "Eren Elmali",
    "Mehmet Can Aydin", "Yusuf Sari", "Berat Ozdemir", "Mahmoud Trezeguet", "Folcarelli",
    "Burak Yilmaz", "Hami Mandirali", "Ozan Tufan", "Aleksandar Pesic", "Bilal Toure"
  ]
}

const FOOTBALL_CLUB_TAGS_BY_NAME = new Map<string, FootballClubKey[]>()
for (const [club, names] of Object.entries(FOOTBALL_CLUB_POPULAR_XI) as Array<[RealFootballClubKey, readonly string[]]>) {
  for (const name of names) {
    const tags = FOOTBALL_CLUB_TAGS_BY_NAME.get(name) ?? []
    if (!tags.includes(club)) tags.push(club)
    FOOTBALL_CLUB_TAGS_BY_NAME.set(name, tags)
  }
}

function clubTagsForCard(name: string): FootballClubKey[] {
  return FOOTBALL_CLUB_TAGS_BY_NAME.get(name) ?? []
}

/* Hints: country + position only (2 hints total). */
function buildHints(name: string, position: FootballPlayerCard["position"]): string[] {
  return [
    `Country: ${nationalityFor(name)}`,
    `Position: ${POSITION_HINTS[position]}`
  ]
}

export const FOOTBALL_PLAYER_CARDS: readonly FootballPlayerCard[] = ALL_FOOTBALL_CARD_GROUPS.flatMap(group =>
  group.names.map((name, index) => ({
    name,
    category: group.category,
    leagueCategory: group.leagueCategory ?? leagueForCard(name, group.category),
    position: group.position,
    difficulty: cardDifficulty(index),
    clubTags: clubTagsForCard(name),
    hints: buildHints(name, group.position)
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
  "Thomas Muller", "Marco Reus", "Vinicius Junior", "Rodrygo", "Florian Wirtz",
  "Jamal Musiala", "Khvicha Kvaratskhelia", "Julian Alvarez", "Marquinhos",
  "Eric Cantona", "Patrick Vieira", "Hugo Lloris", "Cesc Fabregas", "Frank Lampard",
  "Steven Gerrard", "Didier Drogba", "Diego Maradona", "Pele", "Roberto Carlos",
  "Cafu", "Romario", "Marco van Basten", "Gerd Muller", "Eusebio",
  "Ferenc Puskas", "Alfredo Di Stefano", "Diogo Jota", "Ronald Araujo", "Achraf Hakimi",
  "Frenkie de Jong", "Mason Mount", "Joshua Kimmich", "Toni Kroos", "Trent Alexander-Arnold",
  "Hakan Calhanoglu", "Cole Palmer", "Rasmus Hojlund", "Federico Valverde", "Joao Felix",
  "Alvaro Morata", "Memphis Depay", "Mehdi Taremi"
])

const CURRENT_SUPERSTAR_NAMES = new Set<string>([
  "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappe", "Neymar", "Erling Haaland",
  "Mohamed Salah", "Kevin De Bruyne", "Vinicius Junior", "Jude Bellingham", "Harry Kane",
  "Robert Lewandowski", "Karim Benzema", "Sadio Mane", "Son Heung-min", "Antoine Griezmann",
  "Bruno Fernandes", "Bukayo Saka", "Phil Foden", "Rodri", "Pedri", "Lamine Yamal",
  "Rafael Leao", "Victor Osimhen", "Lautaro Martinez", "Paulo Dybala", "Virgil van Dijk",
  "Casemiro", "Florian Wirtz", "Jamal Musiala", "Khvicha Kvaratskhelia", "Julian Alvarez",
  "Federico Valverde", "Joshua Kimmich", "Toni Kroos", "Trent Alexander-Arnold",
  "Cole Palmer", "Rasmus Hojlund", "Mehdi Taremi", "Ousmane Dembele", "Marquinhos",
  "Frenkie de Jong", "Achraf Hakimi", "Ronald Araujo", "Bernardo Silva", "Martin Odegaard",
  "Vinicius Junior", "Rodrygo", "Endrick", "Joao Felix", "Memphis Depay",
  "Eduardo Camavinga", "Aurelien Tchouameni", "Declan Rice", "Phil Foden", "Marcus Rashford",
  "Nicolo Barella", "Sandro Tonali", "Hakan Calhanoglu", "Alexander Isak", "Cody Gakpo"
])

const MODERN_LEGEND_NAMES = new Set<string>([
  "Luka Modric", "Karim Benzema", "Sadio Mane", "Angel Di Maria", "Eden Hazard",
  "Gareth Bale", "Wayne Rooney", "Sergio Aguero", "Luis Suarez", "Zlatan Ibrahimovic",
  "David Beckham", "Thierry Henry", "Andrea Pirlo", "Kaka", "Xavi", "Andres Iniesta",
  "Sergio Ramos", "Iker Casillas", "Gianluigi Buffon", "Manuel Neuer", "N'Golo Kante",
  "Paul Pogba", "Thomas Muller", "Marco Reus", "Didier Drogba", "Frank Lampard",
  "Steven Gerrard", "Patrick Vieira", "Andriy Shevchenko", "Francesco Totti",
  "Alessandro Del Piero", "Ronaldinho", "Ronaldo Nazario", "Dennis Bergkamp",
  "Roberto Carlos", "Cafu", "Carles Puyol", "Lilian Thuram", "Marcel Desailly",
  "Fernando Torres", "David Villa", "Cesc Fabregas", "David Silva", "Hristo Stoichkov",
  "Hakan Sukur", "Roberto Baggio", "Edgar Davids", "Clarence Seedorf", "Toni Kroos",
  "Bastian Schweinsteiger", "Wesley Sneijder", "Michael Owen", "Petr Cech", "Rio Ferdinand",
  "John Terry", "Ashley Cole", "Jamie Carragher", "Vincent Kompany", "Rio Ferdinand"
])

const GOAT_PLAYER_NAMES = new Set<string>([
  "Lionel Messi", "Cristiano Ronaldo", "Pele", "Diego Maradona", "Ronaldo Nazario",
  "Zinedine Zidane", "Ronaldinho", "Johan Cruyff", "Franz Beckenbauer", "Thierry Henry",
  "Xavi", "Andres Iniesta", "Luka Modric", "Gianluigi Buffon", "Iker Casillas",
  "Manuel Neuer", "Sergio Ramos", "Paolo Maldini", "Franco Baresi", "Marco van Basten",
  "Alfredo Di Stefano", "Ferenc Puskas", "Eusebio", "Gerd Muller", "George Best",
  "Michel Platini", "Bobby Charlton", "Bobby Moore", "Lev Yashin", "Dino Zoff",
  "Roberto Baggio", "Romario", "Andrea Pirlo", "Kaka", "Steven Gerrard",
  "Frank Lampard", "Cafu", "Roberto Carlos", "Andriy Shevchenko", "Eric Cantona",
  "Bobby Charlton", "Pele", "Dennis Bergkamp"
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
