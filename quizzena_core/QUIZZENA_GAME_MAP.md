# 🎮 QUIZZENA — GAME MAP

**Purpose:** Single source of truth for what exists in the game  
**Owner:** You  
**Rule:** If it's not listed here, it does not exist  
**Last Updated:** December 2024

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

### Cloudinary CDN Integration
- Profile images stored and served via Cloudinary
- Background banners stored via Cloudinary
- Optimized delivery for mobile

### Multi-Language System
- Supported languages: English, Spanish, Russian, Turkish
- Language preference persisted locally
- All UI text translated via language keys

### Audio System
- **Background Music:** Ambient music during gameplay
- **Sound Effects (SFX):** Click sounds, correct/wrong answers
- Music and SFX controlled independently
- Preferences persist between sessions

### Tutorial System
- Runs once for first-time users only
- Guides user through core features
- Does not repeat after completion

### Haptic Feedback
- Vibration on certain actions (claim achievement, etc.)
- Uses device vibration API when available

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
- Back button shown

### Profile State Management
- Single profile screen reused
- State switches between self / other user
- State cleared on navigation

### Profile Customization
- Avatar (emoji)
- Profile picture (via Cloudinary)
- Background banner (via Cloudinary)
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
- Formula-based scaling (quadratic: 40 × level²)
- Represents total dedication

### P-XP Dashboard & Charts
- Visual display of P-XP progress
- Historical charts showing P-XP growth over time
- Level ring with progress indicator

### P-XP Repair System
- Automatically recalculates P-XP from historical data if values become desynced
- Uses hourly history for accurate reconstruction
- Ensures level always reflects true progress

### Stats Charts
- Per-topic performance charts
- Global performance visualization
- Historical data tracking

### Historical Tracking
- **Stats History:** Daily quiz performance data
- **Prestige History:** P-XP gains over time (hourly/daily)
- **Achievement History:** When achievements were unlocked

### Achievements System
- 200+ achievements
- Grouped into 7 thematic houses
- Achievements must be claimed
- Rewards include P-XP and Quanta

### Quanta Currency
- Knowledge-based currency
- Earned via achievements
- No spending system yet (reserved for future)

---

## 4️⃣ GAMEPLAY & QUIZ SYSTEMS

Core play experience of Quizzena.

### Quiz Engine
- Question loading
- Timer handling
- Answer validation

### Game Modes
- **Casual:** Always unlocked, no pressure
- **Time Attack:** 3 difficulty levels (5s/7s/10s timers)
- **3 Hearts:** Limited mistakes allowed
- **2 Player:** Competitive local mode

### Mode Unlock Logic
- Some modes locked behind topic level progression
- Time Attack unlocks at level 3
- 3 Hearts unlocks at level 5

### Topic System
- **37 topics** across 6 categories
- Each topic has independent progression
- **API-based topics:** Flags, Capitals, Borders, Area (use live data from REST Countries API)
- **JSON-based topics:** All other topics (use local question files)

### Area Quiz Difficulty
- Area quiz has 3 difficulty levels: Easy, Medium, Hard
- Difficulty affects which countries appear (by size ranking)

### Questions Completed System
- Tracks unique correct answers per topic
- Each correct answer "unlocks" that question permanently
- Progress updates after quiz completion
- Data stored in `userData.stats.topics[topicId].unlockedQuestions`
- Synced to Firebase
- **Trackable topics with collections:**
  - **Flags:** ~200 countries, opens Flags Collection
  - **Capitals:** ~195 capitals, opens Capitals Collection
  - **Logos:** 230 brands, opens Logos Collection
  - **Area:** ~195 countries, opens Area Collection
- **Text-based topics:** Progress bar only (not clickable)
- **Excluded (borders):** Hidden (not trackable)

### Area Collection
- Accessible via Questions Completed click (Area topic only)
- Shows all ~195 countries with their silhouettes
- Unlocked countries: Full color silhouette + country name + area value
- Locked countries: Grayscale silhouette + lock icon + country name
- Tracking by country name (e.g., "Russia", "Canada")
- Sorting: Unlocked first, then by area (largest to smallest)

### Quiz of the Day
- Daily rotating quiz
- Determined by calendar date
- Refreshes at midnight

### Continue Playing
- Recently played topics shown on home
- Quick access to resume progress

### Mini Stats Snapshot
- Quick stats display on home screen
- Shows games played, accuracy, streaks at a glance

### Slots System
- Pin favorite topics to home screen
- **Limited to 2 slots**

### Optional 3D Card Mode
- Alternative visual presentation for questions
- Enhanced animations
- Includes InfiniteMenu 3D sphere effect

---

## 5️⃣ SOCIAL SYSTEMS (PARTIAL / EXPANDING)

Social foundations that are present or prepared.

### Leaderboard (Preview)
- UI exists
- Clickable rows
- Profile view on click
- Backend calculation running (hidden)

### Profile Viewing
- Foundation for friends and social features
- Any user can view any other user's profile

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
- Smooth visual flow

### Modal System
- Settings
- Edit Profile
- Sound
- Language
- Mode selection

### State Cleanup
- Profile state cleared on navigation
- Timers and charts properly destroyed

### Toast Notifications
- Non-blocking feedback messages
- Success, error, and info variants

### Galaxy Background Effect
- Animated visual background
- Adds visual depth to the experience

---

## 7️⃣ ADMIN / OWNER SYSTEMS

Systems intended for the owner and testing.

### Dev Panel
- Test XP, stats, achievements
- Accessible in Dev Mode

### Admin Visibility (Conceptual)
- Ability to view any user profile ✅ (implemented)
- Ability to inspect all stats (via profile view)

### Ranked Qualification Logic
- Ranked mode gated by quiz count
- Ranked gameplay not yet live

---

## 8️⃣ PLANNED & RESERVED SYSTEMS

These systems are not live but are structurally supported.

- Real-time leaderboard data (backend calculation exists)
- Friends system
- Follow / unfollow logic
- Ranked mode
- Quanta spending (shop)
- Privacy settings
- Admin control panel UI

---

## 📌 OWNER NOTE

This document is not code.  
It is ownership memory.

Update it only when:
- A system is added
- A system is removed
- A system fundamentally changes

---

✅ **END OF GAME MAP**
