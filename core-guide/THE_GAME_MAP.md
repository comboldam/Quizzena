# 🗺️ QUIZZENA - GAME MAP

**Purpose:** Single source of truth for what exists in the game  
**Owner:** You  
**Rule:** If it's not listed here, it does not exist

---

## 1️⃣ CORE SYSTEMS

These systems power the entire game and exist at all times.

### Firebase Integration
- Anonymous authentication
- Cloud sync of user data
- Firestore as primary backend

### User Data System
- Central data structure (`userData`)
- Stores all progress, stats, profile, achievements

### Screen Time Tracking
- Tracks total time spent in the app
- Saved locally and synced to Firebase

### Dev Mode
- Allows local-only operation (no Firebase)
- Used for testing and development

---

## 2️⃣ PROFILE & IDENTITY SYSTEM

Everything related to player identity and visibility.

### Own Profile
- Avatar, username, country
- Profile picture and background
- Full stats visibility
- Edit and settings access

### Other User Profile Viewing
- View any user by userId
- Read-only view
- Edit/settings hidden

### Profile State Management
- Single profile screen reused
- State switches between self / other user
- State cleared on navigation

### Profile Customization
- Avatar (emoji)
- Profile picture
- Background banner
- Country flag and name

---

## 3️⃣ PROGRESSION SYSTEMS

Systems that define growth, mastery, and long-term engagement.

### Topic XP System
- Separate XP and level per topic
- Levels scale beyond 1000
- XP earned depends on game mode

### P-XP (Prestige System)
- Global player level
- Formula-based scaling (quadratic)
- Represents total dedication

### Achievements System
- 157 achievements
- Grouped into 6 pillars:
  1. **Ascending Levels** - Prestige level milestones
  2. **Games Completed** - Total games played
  3. **Total Questions Answered** - Answer count milestones
  4. **Topic Entry Progression** - Topic mastery
  5. **The Path of the Flawed Mind** - Skill-based (accuracy + streaks)
  6. **The Path of Timeless Devotion** - Time dedication
- Achievements must be claimed
- Rewards include P-XP and Quanta

### Quanta Currency
- Knowledge-based currency
- Earned via achievements
- No spending system yet (reserved)

### Questions Completed System
- Tracks unique correct answers per topic
- Each correct answer "unlocks" that question permanently
- Progress updates after quiz completion
- Data stored in `userData.stats.topics[topicId].unlockedQuestions`
- Synced to Firebase
- **Display varies by topic type:**
  - **Flags:** Percentage + bar + count + clickable (opens Flags Collection)
  - **Capitals:** Percentage + bar + count + clickable (opens Capitals Collection)
  - **Logos:** Percentage + bar + count + clickable (opens Logos Collection)
  - **Area:** Percentage + bar + count + clickable (opens Area Collection)
  - **Text-based topics:** Percentage + bar only (not clickable)
  - **Excluded (borders only):** Hidden (not trackable)

---

## 4️⃣ GAMEPLAY & QUIZ SYSTEMS

Core play experience of Quizzena.

### Quiz Engine
- Question loading
- Timer handling
- Answer validation

### Game Modes
- Casual
- Time Attack (3 difficulty levels)
- 3 Hearts
- 2 Player

### Mode Unlock Logic
- Some modes locked behind progression
- Unlocks based on topic level

### Topic Detail Page (QuizUp-style)
- Appears when selecting a topic (before mode selection)
- Displays:
  - Topic card with image/emoji
  - Action buttons: Play, Follow, Rankings
  - Stats row: Your Level, Followers (placeholder), Next Title at Level (placeholder)
  - Questions Completed progress bar (clickable)
  - Stats cards: Games, Accuracy, Best Streak, Time Spent, Avg Time
- Play button opens Mode Selection Modal
- Questions Completed click opens collection page (for Flags, Capitals, and Logos)

### Mode Selection Modal
- Triggered by Play button on Topic Detail Page
- Shows available game modes with lock/unlock status
- Displays mode icons and descriptions

### Topic System
- 35 topics across 6 categories:
  - **Geography (4):** Flags, Capitals, Borders, Area
  - **Football (7):** Football, Premier League, Champions League, World Cup, Messi, Ronaldo, Derbies
  - **History (9):** World History, Ancient Civilizations, WW2, WW1, Egyptian, Roman Empire, Ottoman, British Monarchy, Cold War
  - **Movies (7):** Movies, Marvel, DC, Harry Potter, Star Wars, LOTR, Disney
  - **TV Shows (7):** TV Shows, Sitcoms, Game of Thrones, Breaking Bad, Stranger Things, Money Heist, The Office
  - **Logos (1):** Logos

### Quiz of the Day
- Daily rotating quiz

### Continue Playing
- Recently played topics shown on home

### Slots System
- Pin favorite topics to home screen

### Optional 3D Card Mode
- Alternative visual presentation for questions

### Flags Collection
- Accessible via Questions Completed click (Flags topic only)
- Shows all 200+ country flags in a grid
- Unlocked flags: Full color, earned by answering correctly
- Locked flags: Grayscale with lock icon overlay

### Capitals Collection
- Accessible via Questions Completed click (Capitals topic only)
- Shows all capital cities with their images
- Unlocked capitals: Full color image, capital name visible
- Locked capitals: Grayscale image with lock icon, capital name visible
- Data fetched from REST Countries API (same source as quiz)
- Country names always visible (locked or unlocked)
- Sorting: Unlocked first (A-Z), then Locked (A-Z)
- Header shows progress: "X/Y Unlocked (Z%)"

### Logos Collection
- Accessible via Questions Completed click (Logos topic only)
- Shows all 230 brand logos in a grid
- Unlocked logos: Full color SVG, brand name visible
- Locked logos: Grayscale image with lock icon, brand name visible
- Data loaded from `topics/logos/questions.json`
- Sorting: Unlocked first (A-Z), then Locked (A-Z)
- Header shows progress: "X/Y Unlocked (Z%)"
- Other topics: "Coming soon" placeholder (text-based questions)

### Area Collection
- Accessible via Questions Completed click (Area topic only)
- Shows all ~195 countries with their silhouettes
- Unlocked countries: Full color silhouette, country name + area value visible
- Locked countries: Grayscale silhouette with lock icon, country name visible
- Data fetched from REST Countries API (same source as quiz)
- Tracking by country name (e.g., "Russia", "Canada")
- Sorting: Unlocked first, then by area (largest to smallest)
- Header shows progress: "X/Y Unlocked (Z%)"

---

## 5️⃣ SOCIAL SYSTEMS (PARTIAL / EXPANDING)

Social foundations that are present or prepared.

### Topic Follow System (LIVE)
- Users can follow/unfollow any topic
- Follower counts update in real-time across all players
- Data model:
  - `users/{uid}/follows/{topicId}` - User's follow records
  - `topics/{topicId}.followersCount` - Aggregate counter
- Atomic transactions prevent race conditions
- Counter never goes below 0
- DEV_MODE: Falls back to local-only state
- Real-time listeners attached on Topic Detail Page, detached on exit

### Leaderboard (Preview)
- UI exists
- Clickable rows
- Profile view on click
- Real data not yet connected

### Profile Viewing
- Foundation for friends and social features

### Followers / Following
- UI placeholders exist
- No backend logic yet

### Social Feed
- View exists
- Marked "Coming Soon"

---

## 6️⃣ NAVIGATION & UI SYSTEMS

How the player moves through the game.

### Bottom Navigation
- Home
- Topics
- Social
- Leaderboard
- Profile

### Animated View Transitions
- Slide animations between tabs

### Modal System
- Settings
- Edit Profile
- Sound
- Language
- Mode selection

### State Cleanup
- Profile state cleared on navigation
- Timers and charts properly destroyed

---

## 7️⃣ ADMIN / OWNER SYSTEMS

Systems intended for the owner and testing.

### Dev Panel
- Test XP, stats, achievements

### Admin Visibility (Conceptual)
- Ability to view any user profile
- Ability to inspect all stats

### Ranked Qualification Logic
- Ranked mode gated by quiz count
- Ranked gameplay not yet live

---

## 8️⃣ PLANNED & RESERVED SYSTEMS

These systems are not live but are structurally supported.

- Real leaderboard data
- Friends system
- Follow / unfollow logic
- Ranked mode
- Quanta spending (shop)
- Privacy settings
- Admin control panel UI

---

## 📋 OWNER NOTE

This document is not code.  
It is ownership memory.

**Update it only when:**
- A system is added
- A system is removed
- A system fundamentally changes

---

## ✅ END OF GAME MAP

*If it's not listed here, it does not exist.*
