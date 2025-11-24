FOOTBALL GENERAL QUIZ - QUESTIONS DATA
======================================

This folder contains the quiz questions for the "Football (General)" topic.

FILE STRUCTURE:
---------------
questions.json - Contains 50 football trivia questions

JSON STRUCTURE:
---------------
Each question object contains:
- id: Unique question identifier (1-50)
- question: The question text
- options: Array of 4 possible answers
- answer: The correct answer (must match one of the options exactly)
- difficulty: "easy", "medium", or "hard"
- category: Question category (awards, clubs, world_cup, stadiums, players, derbies, premier_league, legends, transfers, records, nations, managers, euros, rules, trophies, champions_league)

DIFFICULTY DISTRIBUTION:
------------------------
- Easy: 26 questions
- Medium: 18 questions
- Hard: 6 questions

CATEGORIES COVERED:
-------------------
- Awards (Ballon d'Or, Golden Boot)
- Clubs (Nicknames, History)
- World Cup (Winners, Hosts, Records)
- Stadiums (Names, Locations)
- Players (Nicknames, Nationalities, Numbers)
- Derbies (Famous Rivalries)
- Premier League (History, Records)
- Legends (Historic Players)
- Transfers (Famous Moves)
- Records (All-time Stats)
- Nations (National Teams)
- Managers (Famous Coaches)
- Euros (European Championship)
- Rules (Game Rules)
- Trophies (Awards)
- Champions League (UCL History)

USAGE:
------
Load questions.json and parse it as a JSON array.
Each quiz session can randomly select questions or filter by difficulty/category.
