const fs = require("fs");
const https = require("https");
const path = require("path");

const folder = "./logo_images";

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
}

// ==================== LOGO DATABASE (250 BRANDS) ====================
const logos = [
    // ========== BRANDS / SPORTS BRANDS (29) ==========
    // Easy - Most Popular
    { id: "nike", brand: "Nike", slug: "nike", category: "brands", difficulty: "easy", wrongOptions: ["Adidas", "Puma", "Reebok"] },
    { id: "adidas", brand: "Adidas", slug: "adidas", category: "brands", difficulty: "easy", wrongOptions: ["Nike", "Puma", "Under Armour"] },
    { id: "puma", brand: "Puma", slug: "puma", category: "brands", difficulty: "easy", wrongOptions: ["Nike", "Adidas", "Reebok"] },
    { id: "underarmour", brand: "Under Armour", slug: "underarmour", category: "brands", difficulty: "easy", wrongOptions: ["Nike", "Adidas", "Reebok"] },
    { id: "reebok", brand: "Reebok", slug: "reebok", category: "brands", difficulty: "easy", wrongOptions: ["Nike", "Adidas", "Puma"] },
    { id: "newbalance", brand: "New Balance", slug: "newbalance", category: "brands", difficulty: "easy", wrongOptions: ["Nike", "Adidas", "ASICS"] },
    { id: "converse", brand: "Converse", slug: "converse", category: "brands", difficulty: "easy", wrongOptions: ["Vans", "Nike", "Adidas"] },
    { id: "vans", brand: "Vans", slug: "vans", category: "brands", difficulty: "easy", wrongOptions: ["Converse", "DC Shoes", "Nike"] },
    { id: "jordanbrand", brand: "Jordan", slug: "jordan", category: "brands", difficulty: "easy", wrongOptions: ["Nike", "Adidas", "Puma"] },
    { id: "thenorthface", brand: "The North Face", slug: "thenorthface", category: "brands", difficulty: "easy", wrongOptions: ["Patagonia", "Columbia", "Arc'teryx"] },
    // Medium - Well Known
    { id: "asics", brand: "ASICS", slug: "asics", category: "brands", difficulty: "medium", wrongOptions: ["Nike", "New Balance", "Mizuno"] },
    { id: "fila", brand: "Fila", slug: "fila", category: "brands", difficulty: "medium", wrongOptions: ["Champion", "Reebok", "Kappa"] },
    { id: "champion", brand: "Champion", slug: "champion", category: "brands", difficulty: "medium", wrongOptions: ["Fila", "Russell Athletic", "Starter"] },
    { id: "patagonia", brand: "Patagonia", slug: "patagonia", category: "brands", difficulty: "medium", wrongOptions: ["The North Face", "Columbia", "REI"] },
    { id: "columbia", brand: "Columbia", slug: "columbia", category: "brands", difficulty: "medium", wrongOptions: ["The North Face", "Patagonia", "Marmot"] },
    { id: "lacoste", brand: "Lacoste", slug: "lacoste", category: "brands", difficulty: "medium", wrongOptions: ["Ralph Lauren", "Tommy Hilfiger", "Fred Perry"] },
    { id: "ralphlauren", brand: "Ralph Lauren", slug: "ralphlauren", category: "brands", difficulty: "medium", wrongOptions: ["Lacoste", "Tommy Hilfiger", "Calvin Klein"] },
    { id: "tommyhilfiger", brand: "Tommy Hilfiger", slug: "tommyhilfiger", category: "brands", difficulty: "medium", wrongOptions: ["Ralph Lauren", "Calvin Klein", "Lacoste"] },
    { id: "calvinklein", brand: "Calvin Klein", slug: "calvinklein", category: "brands", difficulty: "medium", wrongOptions: ["Tommy Hilfiger", "Ralph Lauren", "Hugo Boss"] },
    { id: "levis", brand: "Levi's", slug: "levis", category: "brands", difficulty: "medium", wrongOptions: ["Wrangler", "Lee", "Diesel"] },
    // Hard - Less Known
    { id: "kappa", brand: "Kappa", slug: "kappa", category: "brands", difficulty: "hard", wrongOptions: ["Fila", "Umbro", "Diadora"] },
    { id: "umbro", brand: "Umbro", slug: "umbro", category: "brands", difficulty: "hard", wrongOptions: ["Kappa", "Lotto", "Diadora"] },
    { id: "mizuno", brand: "Mizuno", slug: "mizuno", category: "brands", difficulty: "hard", wrongOptions: ["ASICS", "Yonex", "Wilson"] },
    { id: "diadora", brand: "Diadora", slug: "diadora", category: "brands", difficulty: "hard", wrongOptions: ["Kappa", "Lotto", "Umbro"] },
    { id: "lotto", brand: "Lotto", slug: "lotto", category: "brands", difficulty: "hard", wrongOptions: ["Diadora", "Umbro", "Kappa"] },
    { id: "ellesse", brand: "Ellesse", slug: "ellesse", category: "brands", difficulty: "hard", wrongOptions: ["Fila", "Sergio Tacchini", "Kappa"] },
    { id: "arcteryx", brand: "Arc'teryx", slug: "arcteryx", category: "brands", difficulty: "hard", wrongOptions: ["Patagonia", "The North Face", "Mammut"] },
    { id: "carhartt", brand: "Carhartt", slug: "carhartt", category: "brands", difficulty: "hard", wrongOptions: ["Dickies", "Wrangler", "Timberland"] },
    { id: "timberland", brand: "Timberland", slug: "timberland", category: "brands", difficulty: "medium", wrongOptions: ["Caterpillar", "Dr. Martens", "Red Wing"] },

    // ========== CARS (29) ==========
    // Easy - Most Popular
    { id: "mercedes", brand: "Mercedes-Benz", slug: "mercedes", category: "cars", difficulty: "easy", wrongOptions: ["BMW", "Audi", "Lexus"] },
    { id: "bmw", brand: "BMW", slug: "bmw", category: "cars", difficulty: "easy", wrongOptions: ["Mercedes-Benz", "Audi", "Volkswagen"] },
    { id: "audi", brand: "Audi", slug: "audi", category: "cars", difficulty: "easy", wrongOptions: ["BMW", "Mercedes-Benz", "Porsche"] },
    { id: "toyota", brand: "Toyota", slug: "toyota", category: "cars", difficulty: "easy", wrongOptions: ["Honda", "Nissan", "Mazda"] },
    { id: "honda", brand: "Honda", slug: "honda", category: "cars", difficulty: "easy", wrongOptions: ["Toyota", "Nissan", "Mazda"] },
    { id: "ferrari", brand: "Ferrari", slug: "ferrari", category: "cars", difficulty: "easy", wrongOptions: ["Lamborghini", "Porsche", "Maserati"] },
    { id: "lamborghini", brand: "Lamborghini", slug: "lamborghini", category: "cars", difficulty: "easy", wrongOptions: ["Ferrari", "McLaren", "Bugatti"] },
    { id: "porsche", brand: "Porsche", slug: "porsche", category: "cars", difficulty: "easy", wrongOptions: ["Ferrari", "Audi", "Maserati"] },
    { id: "tesla", brand: "Tesla", slug: "tesla", category: "cars", difficulty: "easy", wrongOptions: ["Rivian", "Lucid", "Polestar"] },
    { id: "ford", brand: "Ford", slug: "ford", category: "cars", difficulty: "easy", wrongOptions: ["Chevrolet", "Dodge", "Jeep"] },
    { id: "volkswagen", brand: "Volkswagen", slug: "volkswagen", category: "cars", difficulty: "easy", wrongOptions: ["Audi", "Skoda", "Seat"] },
    // Medium - Well Known
    { id: "chevrolet", brand: "Chevrolet", slug: "chevrolet", category: "cars", difficulty: "medium", wrongOptions: ["Ford", "Dodge", "GMC"] },
    { id: "nissan", brand: "Nissan", slug: "nissan", category: "cars", difficulty: "medium", wrongOptions: ["Toyota", "Honda", "Mazda"] },
    { id: "hyundai", brand: "Hyundai", slug: "hyundai", category: "cars", difficulty: "medium", wrongOptions: ["Kia", "Toyota", "Honda"] },
    { id: "kia", brand: "Kia", slug: "kia", category: "cars", difficulty: "medium", wrongOptions: ["Hyundai", "Toyota", "Honda"] },
    { id: "mazda", brand: "Mazda", slug: "mazda", category: "cars", difficulty: "medium", wrongOptions: ["Toyota", "Honda", "Nissan"] },
    { id: "subaru", brand: "Subaru", slug: "subaru", category: "cars", difficulty: "medium", wrongOptions: ["Toyota", "Honda", "Mazda"] },
    { id: "jeep", brand: "Jeep", slug: "jeep", category: "cars", difficulty: "medium", wrongOptions: ["Land Rover", "Ford", "Toyota"] },
    { id: "volvo", brand: "Volvo", slug: "volvo", category: "cars", difficulty: "medium", wrongOptions: ["Saab", "BMW", "Audi"] },
    { id: "lexus", brand: "Lexus", slug: "lexus", category: "cars", difficulty: "medium", wrongOptions: ["Infiniti", "Acura", "Genesis"] },
    { id: "jaguar", brand: "Jaguar", slug: "jaguar", category: "cars", difficulty: "medium", wrongOptions: ["Land Rover", "Aston Martin", "Bentley"] },
    // Hard - Less Known
    { id: "maserati", brand: "Maserati", slug: "maserati", category: "cars", difficulty: "hard", wrongOptions: ["Ferrari", "Alfa Romeo", "Lamborghini"] },
    { id: "bentley", brand: "Bentley", slug: "bentley", category: "cars", difficulty: "hard", wrongOptions: ["Rolls-Royce", "Aston Martin", "Maybach"] },
    { id: "rollsroyce", brand: "Rolls-Royce", slug: "rollsroyce", category: "cars", difficulty: "hard", wrongOptions: ["Bentley", "Maybach", "Aston Martin"] },
    { id: "astonmartin", brand: "Aston Martin", slug: "astonmartin", category: "cars", difficulty: "hard", wrongOptions: ["Bentley", "Jaguar", "Maserati"] },
    { id: "mclaren", brand: "McLaren", slug: "mclaren", category: "cars", difficulty: "hard", wrongOptions: ["Ferrari", "Lamborghini", "Bugatti"] },
    { id: "bugatti", brand: "Bugatti", slug: "bugatti", category: "cars", difficulty: "hard", wrongOptions: ["Lamborghini", "Koenigsegg", "Pagani"] },
    { id: "alfaromeo", brand: "Alfa Romeo", slug: "alfaromeo", category: "cars", difficulty: "hard", wrongOptions: ["Fiat", "Maserati", "Ferrari"] },
    { id: "landrover", brand: "Land Rover", slug: "landrover", category: "cars", difficulty: "hard", wrongOptions: ["Jeep", "Range Rover", "Toyota"] },

    // ========== TECH (29) ==========
    // Easy - Most Popular
    { id: "apple", brand: "Apple", slug: "apple", category: "tech", difficulty: "easy", wrongOptions: ["Samsung", "Huawei", "Xiaomi"] },
    { id: "google", brand: "Google", slug: "google", category: "tech", difficulty: "easy", wrongOptions: ["Yahoo", "Bing", "DuckDuckGo"] },
    { id: "microsoft", brand: "Microsoft", slug: "microsoft", category: "tech", difficulty: "easy", wrongOptions: ["Apple", "Google", "IBM"] },
    { id: "amazon", brand: "Amazon", slug: "amazon", category: "tech", difficulty: "easy", wrongOptions: ["eBay", "Alibaba", "Walmart"] },
    { id: "samsung", brand: "Samsung", slug: "samsung", category: "tech", difficulty: "easy", wrongOptions: ["Apple", "LG", "Sony"] },
    { id: "sony", brand: "Sony", slug: "sony", category: "tech", difficulty: "easy", wrongOptions: ["Samsung", "LG", "Panasonic"] },
    { id: "nvidia", brand: "NVIDIA", slug: "nvidia", category: "tech", difficulty: "easy", wrongOptions: ["AMD", "Intel", "ARM"] },
    { id: "intel", brand: "Intel", slug: "intel", category: "tech", difficulty: "easy", wrongOptions: ["AMD", "NVIDIA", "Qualcomm"] },
    { id: "amd", brand: "AMD", slug: "amd", category: "tech", difficulty: "easy", wrongOptions: ["Intel", "NVIDIA", "ARM"] },
    { id: "lg", brand: "LG", slug: "lg", category: "tech", difficulty: "easy", wrongOptions: ["Samsung", "Sony", "Philips"] },
    // Medium - Well Known
    { id: "huawei", brand: "Huawei", slug: "huawei", category: "tech", difficulty: "medium", wrongOptions: ["Xiaomi", "Oppo", "Vivo"] },
    { id: "xiaomi", brand: "Xiaomi", slug: "xiaomi", category: "tech", difficulty: "medium", wrongOptions: ["Huawei", "Oppo", "OnePlus"] },
    { id: "ibm", brand: "IBM", slug: "ibm", category: "tech", difficulty: "medium", wrongOptions: ["Microsoft", "Oracle", "SAP"] },
    { id: "adobe", brand: "Adobe", slug: "adobe", category: "tech", difficulty: "medium", wrongOptions: ["Autodesk", "Corel", "Canva"] },
    { id: "dell", brand: "Dell", slug: "dell", category: "tech", difficulty: "medium", wrongOptions: ["HP", "Lenovo", "Asus"] },
    { id: "hp", brand: "HP", slug: "hp", category: "tech", difficulty: "medium", wrongOptions: ["Dell", "Lenovo", "Acer"] },
    { id: "lenovo", brand: "Lenovo", slug: "lenovo", category: "tech", difficulty: "medium", wrongOptions: ["Dell", "HP", "Asus"] },
    { id: "asus", brand: "ASUS", slug: "asus", category: "tech", difficulty: "medium", wrongOptions: ["Acer", "MSI", "Gigabyte"] },
    { id: "logitech", brand: "Logitech", slug: "logitech", category: "tech", difficulty: "medium", wrongOptions: ["Razer", "Corsair", "SteelSeries"] },
    { id: "razer", brand: "Razer", slug: "razer", category: "tech", difficulty: "medium", wrongOptions: ["Logitech", "Corsair", "SteelSeries"] },
    // Hard - Less Known
    { id: "oracle", brand: "Oracle", slug: "oracle", category: "tech", difficulty: "hard", wrongOptions: ["IBM", "SAP", "Salesforce"] },
    { id: "cisco", brand: "Cisco", slug: "cisco", category: "tech", difficulty: "hard", wrongOptions: ["Juniper", "Huawei", "Netgear"] },
    { id: "salesforce", brand: "Salesforce", slug: "salesforce", category: "tech", difficulty: "hard", wrongOptions: ["Oracle", "SAP", "Microsoft"] },
    { id: "vmware", brand: "VMware", slug: "vmware", category: "tech", difficulty: "hard", wrongOptions: ["Oracle", "Microsoft", "Citrix"] },
    { id: "sap", brand: "SAP", slug: "sap", category: "tech", difficulty: "hard", wrongOptions: ["Oracle", "IBM", "Salesforce"] },
    { id: "qualcomm", brand: "Qualcomm", slug: "qualcomm", category: "tech", difficulty: "hard", wrongOptions: ["Intel", "MediaTek", "ARM"] },
    { id: "broadcom", brand: "Broadcom", slug: "broadcom", category: "tech", difficulty: "hard", wrongOptions: ["Qualcomm", "Intel", "Marvell"] },
    { id: "micron", brand: "Micron", slug: "micron", category: "tech", difficulty: "hard", wrongOptions: ["Samsung", "SK Hynix", "Western Digital"] },
    { id: "seagate", brand: "Seagate", slug: "seagate", category: "tech", difficulty: "hard", wrongOptions: ["Western Digital", "Toshiba", "Samsung"] },

    // ========== FAST FOOD (29) ==========
    // Easy - Most Popular
    { id: "mcdonalds", brand: "McDonald's", slug: "mcdonalds", category: "fastfood", difficulty: "easy", wrongOptions: ["Burger King", "Wendy's", "KFC"] },
    { id: "burgerking", brand: "Burger King", slug: "burgerking", category: "fastfood", difficulty: "easy", wrongOptions: ["McDonald's", "Wendy's", "Carl's Jr"] },
    { id: "kfc", brand: "KFC", slug: "kfc", category: "fastfood", difficulty: "easy", wrongOptions: ["Popeyes", "Chick-fil-A", "Church's"] },
    { id: "subway", brand: "Subway", slug: "subway", category: "fastfood", difficulty: "easy", wrongOptions: ["Quiznos", "Jimmy John's", "Jersey Mike's"] },
    { id: "starbucks", brand: "Starbucks", slug: "starbucks", category: "fastfood", difficulty: "easy", wrongOptions: ["Dunkin'", "Costa Coffee", "Tim Hortons"] },
    { id: "pizzahut", brand: "Pizza Hut", slug: "pizzahut", category: "fastfood", difficulty: "easy", wrongOptions: ["Domino's", "Papa John's", "Little Caesars"] },
    { id: "dominos", brand: "Domino's", slug: "dominos", category: "fastfood", difficulty: "easy", wrongOptions: ["Pizza Hut", "Papa John's", "Little Caesars"] },
    { id: "tacobell", brand: "Taco Bell", slug: "tacobell", category: "fastfood", difficulty: "easy", wrongOptions: ["Chipotle", "Del Taco", "Qdoba"] },
    { id: "wendys", brand: "Wendy's", slug: "wendys", category: "fastfood", difficulty: "easy", wrongOptions: ["McDonald's", "Burger King", "Five Guys"] },
    { id: "dunkin", brand: "Dunkin'", slug: "dunkin", category: "fastfood", difficulty: "easy", wrongOptions: ["Starbucks", "Krispy Kreme", "Tim Hortons"] },
    // Medium - Well Known
    { id: "chipotle", brand: "Chipotle", slug: "chipotle", category: "fastfood", difficulty: "medium", wrongOptions: ["Taco Bell", "Qdoba", "Moe's"] },
    { id: "popeyes", brand: "Popeyes", slug: "popeyes", category: "fastfood", difficulty: "medium", wrongOptions: ["KFC", "Chick-fil-A", "Church's"] },
    { id: "chickfila", brand: "Chick-fil-A", slug: "chickfila", category: "fastfood", difficulty: "medium", wrongOptions: ["Popeyes", "KFC", "Zaxby's"] },
    { id: "fiveguys", brand: "Five Guys", slug: "fiveguys", category: "fastfood", difficulty: "medium", wrongOptions: ["In-N-Out", "Shake Shack", "Smashburger"] },
    { id: "papajohns", brand: "Papa John's", slug: "papajohns", category: "fastfood", difficulty: "medium", wrongOptions: ["Domino's", "Pizza Hut", "Little Caesars"] },
    { id: "littlecaesars", brand: "Little Caesars", slug: "littlecaesars", category: "fastfood", difficulty: "medium", wrongOptions: ["Domino's", "Pizza Hut", "Papa John's"] },
    { id: "krispykreme", brand: "Krispy Kreme", slug: "krispykreme", category: "fastfood", difficulty: "medium", wrongOptions: ["Dunkin'", "Tim Hortons", "Cinnabon"] },
    { id: "baskinrobbins", brand: "Baskin-Robbins", slug: "baskinrobbins", category: "fastfood", difficulty: "medium", wrongOptions: ["Dairy Queen", "Cold Stone", "Ben & Jerry's"] },
    { id: "dairyqueen", brand: "Dairy Queen", slug: "dairyqueen", category: "fastfood", difficulty: "medium", wrongOptions: ["Baskin-Robbins", "Cold Stone", "Sonic"] },
    { id: "sonic", brand: "Sonic", slug: "sonic", category: "fastfood", difficulty: "medium", wrongOptions: ["Dairy Queen", "A&W", "Checkers"] },
    // Hard - Less Known
    { id: "innout", brand: "In-N-Out Burger", slug: "innout", category: "fastfood", difficulty: "hard", wrongOptions: ["Five Guys", "Shake Shack", "Whataburger"] },
    { id: "shakeshack", brand: "Shake Shack", slug: "shakeshack", category: "fastfood", difficulty: "hard", wrongOptions: ["Five Guys", "In-N-Out", "Smashburger"] },
    { id: "timhortons", brand: "Tim Hortons", slug: "timhortons", category: "fastfood", difficulty: "hard", wrongOptions: ["Dunkin'", "Starbucks", "Krispy Kreme"] },
    { id: "whataburger", brand: "Whataburger", slug: "whataburger", category: "fastfood", difficulty: "hard", wrongOptions: ["In-N-Out", "Five Guys", "Culver's"] },
    { id: "jimmyjohns", brand: "Jimmy John's", slug: "jimmyjohns", category: "fastfood", difficulty: "hard", wrongOptions: ["Subway", "Jersey Mike's", "Firehouse Subs"] },
    { id: "jerseymikes", brand: "Jersey Mike's", slug: "jerseymikes", category: "fastfood", difficulty: "hard", wrongOptions: ["Subway", "Jimmy John's", "Firehouse Subs"] },
    { id: "panerabread", brand: "Panera Bread", slug: "panerabread", category: "fastfood", difficulty: "hard", wrongOptions: ["Au Bon Pain", "Corner Bakery", "Atlanta Bread"] },
    { id: "jackinthebox", brand: "Jack in the Box", slug: "jackinthebox", category: "fastfood", difficulty: "hard", wrongOptions: ["Carl's Jr", "Hardee's", "Checkers"] },
    { id: "carlsjr", brand: "Carl's Jr", slug: "carlsjr", category: "fastfood", difficulty: "hard", wrongOptions: ["Hardee's", "Jack in the Box", "Checkers"] },

    // ========== FOOTBALL CLUBS (29) ==========
    // Easy - Most Popular
    { id: "realmadrid", brand: "Real Madrid", slug: "realmadrid", category: "football", difficulty: "easy", wrongOptions: ["Barcelona", "Atletico Madrid", "Sevilla"] },
    { id: "barcelona", brand: "FC Barcelona", slug: "fcbarcelona", category: "football", difficulty: "easy", wrongOptions: ["Real Madrid", "Atletico Madrid", "Valencia"] },
    { id: "manchesterunited", brand: "Manchester United", slug: "manchesterunited", category: "football", difficulty: "easy", wrongOptions: ["Manchester City", "Liverpool", "Chelsea"] },
    { id: "manchestercity", brand: "Manchester City", slug: "manchestercity", category: "football", difficulty: "easy", wrongOptions: ["Manchester United", "Liverpool", "Arsenal"] },
    { id: "liverpool", brand: "Liverpool FC", slug: "liverpoolfc", category: "football", difficulty: "easy", wrongOptions: ["Manchester United", "Chelsea", "Arsenal"] },
    { id: "chelsea", brand: "Chelsea FC", slug: "chelseafc", category: "football", difficulty: "easy", wrongOptions: ["Arsenal", "Tottenham", "Liverpool"] },
    { id: "arsenal", brand: "Arsenal FC", slug: "arsenal", category: "football", difficulty: "easy", wrongOptions: ["Chelsea", "Tottenham", "Manchester United"] },
    { id: "bayernmunich", brand: "Bayern Munich", slug: "fcbayernmunich", category: "football", difficulty: "easy", wrongOptions: ["Borussia Dortmund", "RB Leipzig", "Schalke 04"] },
    { id: "psg", brand: "Paris Saint-Germain", slug: "psg", category: "football", difficulty: "easy", wrongOptions: ["Marseille", "Lyon", "Monaco"] },
    { id: "juventus", brand: "Juventus", slug: "juventusfc", category: "football", difficulty: "easy", wrongOptions: ["AC Milan", "Inter Milan", "Roma"] },
    // Medium - Well Known
    { id: "acmilan", brand: "AC Milan", slug: "acmilan", category: "football", difficulty: "medium", wrongOptions: ["Inter Milan", "Juventus", "Roma"] },
    { id: "intermilan", brand: "Inter Milan", slug: "intermilan", category: "football", difficulty: "medium", wrongOptions: ["AC Milan", "Juventus", "Napoli"] },
    { id: "tottenham", brand: "Tottenham Hotspur", slug: "tottenhamhotspur", category: "football", difficulty: "medium", wrongOptions: ["Arsenal", "Chelsea", "West Ham"] },
    { id: "dortmund", brand: "Borussia Dortmund", slug: "borussia dortmund", category: "football", difficulty: "medium", wrongOptions: ["Bayern Munich", "RB Leipzig", "Schalke 04"] },
    { id: "atleticomadrid", brand: "Atletico Madrid", slug: "atleticodemadrid", category: "football", difficulty: "medium", wrongOptions: ["Real Madrid", "Barcelona", "Sevilla"] },
    { id: "ajax", brand: "AFC Ajax", slug: "ajax", category: "football", difficulty: "medium", wrongOptions: ["PSV", "Feyenoord", "AZ Alkmaar"] },
    { id: "benfica", brand: "SL Benfica", slug: "slbenfica", category: "football", difficulty: "medium", wrongOptions: ["Porto", "Sporting CP", "Braga"] },
    { id: "porto", brand: "FC Porto", slug: "fcporto", category: "football", difficulty: "medium", wrongOptions: ["Benfica", "Sporting CP", "Braga"] },
    { id: "roma", brand: "AS Roma", slug: "asroma", category: "football", difficulty: "medium", wrongOptions: ["Lazio", "Napoli", "Fiorentina"] },
    { id: "napoli", brand: "SSC Napoli", slug: "sscnapoli", category: "football", difficulty: "medium", wrongOptions: ["Roma", "Lazio", "Fiorentina"] },
    // Hard - Less Known
    { id: "everton", brand: "Everton FC", slug: "evertonfc", category: "football", difficulty: "hard", wrongOptions: ["Liverpool", "West Ham", "Newcastle"] },
    { id: "westham", brand: "West Ham United", slug: "westhamunited", category: "football", difficulty: "hard", wrongOptions: ["Tottenham", "Chelsea", "Arsenal"] },
    { id: "leicester", brand: "Leicester City", slug: "leicestercity", category: "football", difficulty: "hard", wrongOptions: ["Aston Villa", "Wolves", "Newcastle"] },
    { id: "astonvilla", brand: "Aston Villa", slug: "astonvilla", category: "football", difficulty: "hard", wrongOptions: ["Leicester", "West Ham", "Everton"] },
    { id: "newcastle", brand: "Newcastle United", slug: "newcastleunited", category: "football", difficulty: "hard", wrongOptions: ["Sunderland", "Everton", "West Ham"] },
    { id: "lyon", brand: "Olympique Lyon", slug: "olympiquelyonnais", category: "football", difficulty: "hard", wrongOptions: ["PSG", "Marseille", "Monaco"] },
    { id: "marseille", brand: "Olympique Marseille", slug: "olympiquedemarseille", category: "football", difficulty: "hard", wrongOptions: ["PSG", "Lyon", "Monaco"] },
    { id: "sevilla", brand: "Sevilla FC", slug: "sevillafc", category: "football", difficulty: "hard", wrongOptions: ["Real Madrid", "Barcelona", "Valencia"] },
    { id: "lazio", brand: "SS Lazio", slug: "sslazio", category: "football", difficulty: "hard", wrongOptions: ["Roma", "Napoli", "Fiorentina"] },

    // ========== SOCIAL MEDIA (29) ==========
    // Easy - Most Popular
    { id: "instagram", brand: "Instagram", slug: "instagram", category: "social", difficulty: "easy", wrongOptions: ["Snapchat", "TikTok", "Pinterest"] },
    { id: "facebook", brand: "Facebook", slug: "facebook", category: "social", difficulty: "easy", wrongOptions: ["Twitter", "LinkedIn", "MySpace"] },
    { id: "twitter", brand: "Twitter", slug: "twitter", category: "social", difficulty: "easy", wrongOptions: ["Facebook", "Threads", "Mastodon"] },
    { id: "x", brand: "X", slug: "x", category: "social", difficulty: "easy", wrongOptions: ["Threads", "Bluesky", "Mastodon"] },
    { id: "tiktok", brand: "TikTok", slug: "tiktok", category: "social", difficulty: "easy", wrongOptions: ["Instagram Reels", "YouTube Shorts", "Snapchat"] },
    { id: "snapchat", brand: "Snapchat", slug: "snapchat", category: "social", difficulty: "easy", wrongOptions: ["Instagram", "TikTok", "BeReal"] },
    { id: "whatsapp", brand: "WhatsApp", slug: "whatsapp", category: "social", difficulty: "easy", wrongOptions: ["Telegram", "Signal", "Messenger"] },
    { id: "youtube", brand: "YouTube", slug: "youtube", category: "social", difficulty: "easy", wrongOptions: ["Vimeo", "Dailymotion", "Twitch"] },
    { id: "linkedin", brand: "LinkedIn", slug: "linkedin", category: "social", difficulty: "easy", wrongOptions: ["Facebook", "Indeed", "Glassdoor"] },
    { id: "reddit", brand: "Reddit", slug: "reddit", category: "social", difficulty: "easy", wrongOptions: ["4chan", "Quora", "Digg"] },
    // Medium - Well Known
    { id: "telegram", brand: "Telegram", slug: "telegram", category: "social", difficulty: "medium", wrongOptions: ["WhatsApp", "Signal", "Viber"] },
    { id: "pinterest", brand: "Pinterest", slug: "pinterest", category: "social", difficulty: "medium", wrongOptions: ["Instagram", "Tumblr", "Flickr"] },
    { id: "discord", brand: "Discord", slug: "discord", category: "social", difficulty: "medium", wrongOptions: ["Slack", "Skype", "TeamSpeak"] },
    { id: "twitch", brand: "Twitch", slug: "twitch", category: "social", difficulty: "medium", wrongOptions: ["YouTube Gaming", "Kick", "Facebook Gaming"] },
    { id: "threads", brand: "Threads", slug: "threads", category: "social", difficulty: "medium", wrongOptions: ["X", "Mastodon", "Bluesky"] },
    { id: "messenger", brand: "Messenger", slug: "messenger", category: "social", difficulty: "medium", wrongOptions: ["WhatsApp", "Telegram", "Viber"] },
    { id: "wechat", brand: "WeChat", slug: "wechat", category: "social", difficulty: "medium", wrongOptions: ["WhatsApp", "Line", "KakaoTalk"] },
    { id: "tumblr", brand: "Tumblr", slug: "tumblr", category: "social", difficulty: "medium", wrongOptions: ["WordPress", "Blogger", "Medium"] },
    { id: "quora", brand: "Quora", slug: "quora", category: "social", difficulty: "medium", wrongOptions: ["Reddit", "Stack Overflow", "Yahoo Answers"] },
    { id: "medium", brand: "Medium", slug: "medium", category: "social", difficulty: "medium", wrongOptions: ["Substack", "WordPress", "Blogger"] },
    // Hard - Less Known
    { id: "signal", brand: "Signal", slug: "signal", category: "social", difficulty: "hard", wrongOptions: ["WhatsApp", "Telegram", "Viber"] },
    { id: "mastodon", brand: "Mastodon", slug: "mastodon", category: "social", difficulty: "hard", wrongOptions: ["X", "Threads", "Bluesky"] },
    { id: "bluesky", brand: "Bluesky", slug: "bluesky", category: "social", difficulty: "hard", wrongOptions: ["X", "Threads", "Mastodon"] },
    { id: "bereal", brand: "BeReal", slug: "bereal", category: "social", difficulty: "hard", wrongOptions: ["Snapchat", "Instagram", "TikTok"] },
    { id: "flickr", brand: "Flickr", slug: "flickr", category: "social", difficulty: "hard", wrongOptions: ["Pinterest", "Instagram", "500px"] },
    { id: "viber", brand: "Viber", slug: "viber", category: "social", difficulty: "hard", wrongOptions: ["WhatsApp", "Telegram", "Signal"] },
    { id: "line", brand: "Line", slug: "line", category: "social", difficulty: "hard", wrongOptions: ["WeChat", "KakaoTalk", "WhatsApp"] },
    { id: "kakaotalk", brand: "KakaoTalk", slug: "kakaotalk", category: "social", difficulty: "hard", wrongOptions: ["Line", "WeChat", "WhatsApp"] },
    { id: "clubhouse", brand: "Clubhouse", slug: "clubhouse", category: "social", difficulty: "hard", wrongOptions: ["Twitter Spaces", "Discord", "Spotify Greenroom"] },

    // ========== APP ICONS (29) ==========
    // Easy - Most Popular
    { id: "spotify", brand: "Spotify", slug: "spotify", category: "apps", difficulty: "easy", wrongOptions: ["Apple Music", "Deezer", "Tidal"] },
    { id: "netflix", brand: "Netflix", slug: "netflix", category: "apps", difficulty: "easy", wrongOptions: ["Hulu", "Disney+", "HBO Max"] },
    { id: "uber", brand: "Uber", slug: "uber", category: "apps", difficulty: "easy", wrongOptions: ["Lyft", "Grab", "Bolt"] },
    { id: "airbnb", brand: "Airbnb", slug: "airbnb", category: "apps", difficulty: "easy", wrongOptions: ["Booking.com", "Vrbo", "Hotels.com"] },
    { id: "googlemaps", brand: "Google Maps", slug: "googlemaps", category: "apps", difficulty: "easy", wrongOptions: ["Apple Maps", "Waze", "HERE Maps"] },
    { id: "paypal", brand: "PayPal", slug: "paypal", category: "apps", difficulty: "easy", wrongOptions: ["Venmo", "Cash App", "Zelle"] },
    { id: "shazam", brand: "Shazam", slug: "shazam", category: "apps", difficulty: "easy", wrongOptions: ["SoundHound", "Spotify", "Apple Music"] },
    { id: "zoom", brand: "Zoom", slug: "zoom", category: "apps", difficulty: "easy", wrongOptions: ["Microsoft Teams", "Google Meet", "Skype"] },
    { id: "slack", brand: "Slack", slug: "slack", category: "apps", difficulty: "easy", wrongOptions: ["Microsoft Teams", "Discord", "Zoom"] },
    { id: "dropbox", brand: "Dropbox", slug: "dropbox", category: "apps", difficulty: "easy", wrongOptions: ["Google Drive", "OneDrive", "iCloud"] },
    // Medium - Well Known
    { id: "lyft", brand: "Lyft", slug: "lyft", category: "apps", difficulty: "medium", wrongOptions: ["Uber", "Grab", "Bolt"] },
    { id: "doordash", brand: "DoorDash", slug: "doordash", category: "apps", difficulty: "medium", wrongOptions: ["Uber Eats", "Grubhub", "Postmates"] },
    { id: "ubereats", brand: "Uber Eats", slug: "ubereats", category: "apps", difficulty: "medium", wrongOptions: ["DoorDash", "Grubhub", "Deliveroo"] },
    { id: "venmo", brand: "Venmo", slug: "venmo", category: "apps", difficulty: "medium", wrongOptions: ["PayPal", "Cash App", "Zelle"] },
    { id: "cashapp", brand: "Cash App", slug: "cashapp", category: "apps", difficulty: "medium", wrongOptions: ["Venmo", "PayPal", "Zelle"] },
    { id: "duolingo", brand: "Duolingo", slug: "duolingo", category: "apps", difficulty: "medium", wrongOptions: ["Babbel", "Rosetta Stone", "Memrise"] },
    { id: "notion", brand: "Notion", slug: "notion", category: "apps", difficulty: "medium", wrongOptions: ["Evernote", "Obsidian", "Roam"] },
    { id: "evernote", brand: "Evernote", slug: "evernote", category: "apps", difficulty: "medium", wrongOptions: ["Notion", "OneNote", "Bear"] },
    { id: "trello", brand: "Trello", slug: "trello", category: "apps", difficulty: "medium", wrongOptions: ["Asana", "Monday", "Jira"] },
    { id: "figma", brand: "Figma", slug: "figma", category: "apps", difficulty: "medium", wrongOptions: ["Sketch", "Adobe XD", "InVision"] },
    // Hard - Less Known
    { id: "grubhub", brand: "Grubhub", slug: "grubhub", category: "apps", difficulty: "hard", wrongOptions: ["DoorDash", "Uber Eats", "Postmates"] },
    { id: "instacart", brand: "Instacart", slug: "instacart", category: "apps", difficulty: "hard", wrongOptions: ["Shipt", "Amazon Fresh", "Walmart+"] },
    { id: "robinhood", brand: "Robinhood", slug: "robinhood", category: "apps", difficulty: "hard", wrongOptions: ["Webull", "E*TRADE", "TD Ameritrade"] },
    { id: "coinbase", brand: "Coinbase", slug: "coinbase", category: "apps", difficulty: "hard", wrongOptions: ["Binance", "Kraken", "Gemini"] },
    { id: "stripe", brand: "Stripe", slug: "stripe", category: "apps", difficulty: "hard", wrongOptions: ["PayPal", "Square", "Adyen"] },
    { id: "asana", brand: "Asana", slug: "asana", category: "apps", difficulty: "hard", wrongOptions: ["Trello", "Monday", "Jira"] },
    { id: "canva", brand: "Canva", slug: "canva", category: "apps", difficulty: "hard", wrongOptions: ["Adobe", "Figma", "Crello"] },
    { id: "todoist", brand: "Todoist", slug: "todoist", category: "apps", difficulty: "hard", wrongOptions: ["TickTick", "Any.do", "Microsoft To Do"] },
    { id: "strava", brand: "Strava", slug: "strava", category: "apps", difficulty: "hard", wrongOptions: ["Nike Run Club", "MapMyRun", "Runkeeper"] },

    // ========== EXTRA 50 (Mixed Categories) ==========
    // Gaming
    { id: "playstation", brand: "PlayStation", slug: "playstation", category: "gaming", difficulty: "easy", wrongOptions: ["Xbox", "Nintendo", "Steam"] },
    { id: "xbox", brand: "Xbox", slug: "xbox", category: "gaming", difficulty: "easy", wrongOptions: ["PlayStation", "Nintendo", "Steam"] },
    { id: "nintendo", brand: "Nintendo", slug: "nintendo", category: "gaming", difficulty: "easy", wrongOptions: ["PlayStation", "Xbox", "Sega"] },
    { id: "steam", brand: "Steam", slug: "steam", category: "gaming", difficulty: "easy", wrongOptions: ["Epic Games", "GOG", "Origin"] },
    { id: "epicgames", brand: "Epic Games", slug: "epicgames", category: "gaming", difficulty: "medium", wrongOptions: ["Steam", "EA", "Ubisoft"] },
    { id: "ea", brand: "EA", slug: "ea", category: "gaming", difficulty: "medium", wrongOptions: ["Activision", "Ubisoft", "Epic Games"] },
    { id: "ubisoft", brand: "Ubisoft", slug: "ubisoft", category: "gaming", difficulty: "medium", wrongOptions: ["EA", "Activision", "Rockstar"] },
    { id: "riotgames", brand: "Riot Games", slug: "riotgames", category: "gaming", difficulty: "medium", wrongOptions: ["Blizzard", "Valve", "Epic Games"] },
    { id: "rockstargames", brand: "Rockstar Games", slug: "rockstargames", category: "gaming", difficulty: "medium", wrongOptions: ["EA", "Ubisoft", "Activision"] },
    { id: "sega", brand: "SEGA", slug: "sega", category: "gaming", difficulty: "medium", wrongOptions: ["Nintendo", "Capcom", "Konami"] },
    // Entertainment/Streaming
    { id: "disney", brand: "Disney", slug: "disney", category: "entertainment", difficulty: "easy", wrongOptions: ["Warner Bros", "Universal", "Paramount"] },
    { id: "hbo", brand: "HBO", slug: "hbo", category: "entertainment", difficulty: "medium", wrongOptions: ["Netflix", "Showtime", "Starz"] },
    { id: "hulu", brand: "Hulu", slug: "hulu", category: "entertainment", difficulty: "medium", wrongOptions: ["Netflix", "Disney+", "HBO Max"] },
    { id: "primevideo", brand: "Prime Video", slug: "primevideo", category: "entertainment", difficulty: "medium", wrongOptions: ["Netflix", "Hulu", "Disney+"] },
    { id: "marvel", brand: "Marvel", slug: "marvel", category: "entertainment", difficulty: "easy", wrongOptions: ["DC", "Dark Horse", "Image"] },
    { id: "dccomics", brand: "DC Comics", slug: "dc", category: "entertainment", difficulty: "easy", wrongOptions: ["Marvel", "Dark Horse", "Image"] },
    // Finance
    { id: "visa", brand: "Visa", slug: "visa", category: "finance", difficulty: "easy", wrongOptions: ["Mastercard", "American Express", "Discover"] },
    { id: "mastercard", brand: "Mastercard", slug: "mastercard", category: "finance", difficulty: "easy", wrongOptions: ["Visa", "American Express", "JCB"] },
    { id: "americanexpress", brand: "American Express", slug: "americanexpress", category: "finance", difficulty: "medium", wrongOptions: ["Visa", "Mastercard", "Discover"] },
    { id: "bitcoin", brand: "Bitcoin", slug: "bitcoin", category: "finance", difficulty: "easy", wrongOptions: ["Ethereum", "Litecoin", "Dogecoin"] },
    { id: "ethereum", brand: "Ethereum", slug: "ethereum", category: "finance", difficulty: "medium", wrongOptions: ["Bitcoin", "Solana", "Cardano"] },
    // Airlines
    { id: "emirates", brand: "Emirates", slug: "emirates", category: "airlines", difficulty: "medium", wrongOptions: ["Qatar Airways", "Etihad", "Turkish Airlines"] },
    { id: "lufthansa", brand: "Lufthansa", slug: "lufthansa", category: "airlines", difficulty: "hard", wrongOptions: ["Air France", "KLM", "British Airways"] },
    { id: "qatarairways", brand: "Qatar Airways", slug: "qatarairways", category: "airlines", difficulty: "hard", wrongOptions: ["Emirates", "Etihad", "Singapore Airlines"] },
    { id: "britishairways", brand: "British Airways", slug: "britishairways", category: "airlines", difficulty: "hard", wrongOptions: ["Virgin Atlantic", "Lufthansa", "Air France"] },
    { id: "delta", brand: "Delta", slug: "delta", category: "airlines", difficulty: "medium", wrongOptions: ["United", "American Airlines", "Southwest"] },
    { id: "united", brand: "United Airlines", slug: "unitedairlines", category: "airlines", difficulty: "medium", wrongOptions: ["Delta", "American Airlines", "Southwest"] },
    // Retail
    { id: "target", brand: "Target", slug: "target", category: "retail", difficulty: "easy", wrongOptions: ["Walmart", "Costco", "Best Buy"] },
    { id: "walmart", brand: "Walmart", slug: "walmart", category: "retail", difficulty: "easy", wrongOptions: ["Target", "Costco", "Amazon"] },
    { id: "ikea", brand: "IKEA", slug: "ikea", category: "retail", difficulty: "easy", wrongOptions: ["Wayfair", "Pottery Barn", "West Elm"] },
    { id: "costco", brand: "Costco", slug: "costco", category: "retail", difficulty: "medium", wrongOptions: ["Sam's Club", "BJ's", "Walmart"] },
    { id: "bestbuy", brand: "Best Buy", slug: "bestbuy", category: "retail", difficulty: "medium", wrongOptions: ["Target", "Walmart", "Amazon"] },
    { id: "ebay", brand: "eBay", slug: "ebay", category: "retail", difficulty: "easy", wrongOptions: ["Amazon", "Etsy", "Alibaba"] },
    // Fashion/Luxury
    { id: "gucci", brand: "Gucci", slug: "gucci", category: "fashion", difficulty: "medium", wrongOptions: ["Chanel", "Prada", "Versace"] },
    { id: "louisvuitton", brand: "Louis Vuitton", slug: "louisvuitton", category: "fashion", difficulty: "medium", wrongOptions: ["Gucci", "Chanel", "Hermès"] },
    { id: "chanel", brand: "Chanel", slug: "chanel", category: "fashion", difficulty: "medium", wrongOptions: ["Gucci", "Louis Vuitton", "Dior"] },
    { id: "versace", brand: "Versace", slug: "versace", category: "fashion", difficulty: "hard", wrongOptions: ["Gucci", "Dolce & Gabbana", "Armani"] },
    { id: "prada", brand: "Prada", slug: "prada", category: "fashion", difficulty: "hard", wrongOptions: ["Gucci", "Fendi", "Miu Miu"] },
    { id: "burberry", brand: "Burberry", slug: "burberry", category: "fashion", difficulty: "hard", wrongOptions: ["Gucci", "Louis Vuitton", "Coach"] },
    { id: "zara", brand: "Zara", slug: "zara", category: "fashion", difficulty: "easy", wrongOptions: ["H&M", "Uniqlo", "Forever 21"] },
    { id: "hm", brand: "H&M", slug: "hm", category: "fashion", difficulty: "easy", wrongOptions: ["Zara", "Uniqlo", "Gap"] },
    { id: "uniqlo", brand: "Uniqlo", slug: "uniqlo", category: "fashion", difficulty: "medium", wrongOptions: ["Zara", "H&M", "Gap"] },
    // Dev Tools
    { id: "github", brand: "GitHub", slug: "github", category: "devtools", difficulty: "medium", wrongOptions: ["GitLab", "Bitbucket", "SourceForge"] },
    { id: "gitlab", brand: "GitLab", slug: "gitlab", category: "devtools", difficulty: "hard", wrongOptions: ["GitHub", "Bitbucket", "Azure DevOps"] },
    { id: "docker", brand: "Docker", slug: "docker", category: "devtools", difficulty: "hard", wrongOptions: ["Kubernetes", "VMware", "Vagrant"] },
    { id: "kubernetes", brand: "Kubernetes", slug: "kubernetes", category: "devtools", difficulty: "hard", wrongOptions: ["Docker", "OpenShift", "Rancher"] },
    { id: "aws", brand: "AWS", slug: "amazonaws", category: "devtools", difficulty: "medium", wrongOptions: ["Azure", "Google Cloud", "IBM Cloud"] },
    { id: "azure", brand: "Azure", slug: "microsoftazure", category: "devtools", difficulty: "medium", wrongOptions: ["AWS", "Google Cloud", "Oracle Cloud"] },
    { id: "googlecloud", brand: "Google Cloud", slug: "googlecloud", category: "devtools", difficulty: "medium", wrongOptions: ["AWS", "Azure", "IBM Cloud"] },
];

// ==================== DOWNLOAD FUNCTIONS ====================
let successCount = 0;
let failCount = 0;
const failedLogos = [];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadLogo(logo) {
    return new Promise((resolve) => {
        const url = `https://cdn.simpleicons.org/${logo.slug}`;
        const filePath = path.join(folder, `${logo.id}.svg`);

        console.log(`[${successCount + failCount + 1}/${logos.length}] Downloading: ${logo.brand}`);

        const file = fs.createWriteStream(filePath);

        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`  ✓ Downloaded: ${logo.brand}`);
                    successCount++;
                    resolve(true);
                });
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                const redirectUrl = response.headers.location;
                file.close();
                fs.unlink(filePath, () => {});

                https.get(redirectUrl, (redirectResponse) => {
                    if (redirectResponse.statusCode === 200) {
                        const newFile = fs.createWriteStream(filePath);
                        redirectResponse.pipe(newFile);
                        newFile.on('finish', () => {
                            newFile.close();
                            console.log(`  ✓ Downloaded (redirect): ${logo.brand}`);
                            successCount++;
                            resolve(true);
                        });
                    } else {
                        console.log(`  ⚠ Failed after redirect (${redirectResponse.statusCode}): ${logo.brand}`);
                        failCount++;
                        failedLogos.push({ brand: logo.brand, slug: logo.slug });
                        resolve(false);
                    }
                });
            } else {
                console.log(`  ⚠ Failed (${response.statusCode}): ${logo.brand}`);
                failCount++;
                failedLogos.push({ brand: logo.brand, slug: logo.slug });
                fs.unlink(filePath, () => {});
                resolve(false);
            }
        }).on('error', (err) => {
            console.log(`  ⚠ Error: ${logo.brand} - ${err.message}`);
            failCount++;
            failedLogos.push({ brand: logo.brand, slug: logo.slug });
            fs.unlink(filePath, () => {});
            resolve(false);
        });
    });
}

function generateQuizQuestions() {
    const questions = logos
        .filter(logo => fs.existsSync(path.join(folder, `${logo.id}.svg`)))
        .map((logo, index) => ({
            id: index + 1,
            question: "Which brand uses this logo?",
            image: `logo_images/${logo.id}.svg`,
            options: shuffleArray([logo.brand, ...logo.wrongOptions]),
            answer: logo.brand,
            difficulty: logo.difficulty,
            category: logo.category
        }));

    fs.writeFileSync('./logos_questions.json', JSON.stringify(questions, null, 2));
    console.log(`\n✓ Generated logos_questions.json with ${questions.length} questions`);

    // Generate category summary
    const categorySummary = {};
    questions.forEach(q => {
        categorySummary[q.category] = (categorySummary[q.category] || 0) + 1;
    });
    console.log('\n📊 Category breakdown:');
    Object.entries(categorySummary).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} logos`);
    });
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ==================== MAIN EXECUTION ====================
(async function () {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎨 Logo Downloader for Quizzena`);
    console.log(`   Using Simple Icons CDN (https://simpleicons.org)`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Total logos to download: ${logos.length}\n`);

    const startTime = Date.now();

    for (let i = 0; i < logos.length; i++) {
        await downloadLogo(logos[i]);

        // Add small delay between requests
        if (i < logos.length - 1) {
            await delay(150);
        }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 DOWNLOAD COMPLETE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✓ Successfully downloaded:  ${successCount}`);
    console.log(`⚠ Failed downloads:         ${failCount}`);
    if (failedLogos.length > 0) {
        console.log(`\n❌ Failed logos:`);
        failedLogos.forEach(f => console.log(`   - ${f.brand} (slug: ${f.slug})`));
    }
    console.log(`\n⏱ Time taken: ${minutes}m ${seconds}s`);
    console.log(`${"=".repeat(60)}\n`);

    // Generate quiz questions
    if (successCount > 0) {
        generateQuizQuestions();
    }
})();
