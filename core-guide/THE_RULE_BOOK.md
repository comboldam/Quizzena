# 📜 QUIZZENA - RULEBOOK

**Purpose:** Define the laws of how the game behaves  
**Audience:** Owner, future developers, future you  
**Rule:** If a rule is not written here, it is not guaranteed

---

## 1️⃣ CORE GAME RULES

These rules apply at all times, across all systems.

### All player progress is tied to one user identity
- Each user has exactly one `userData` record.
- Cloud sync is authoritative when Dev Mode is OFF
- Local data exists only as cache.

### Dev Mode bypasses Firebase
- Used strictly for testing and development.

---

## 2️⃣ PROFILE RULES

Rules governing identity, visibility, and control.

### A player has one profile
- The same profile screen is reused for all users.

### A user may view any other user's profile
- Viewing is read-only.

### When viewing another profile:
- Edit profile is hidden
- Settings are hidden
- Back button is shown

### When viewing own profile:
- Edit profile is available
- Settings are available

### Profile state is cleared on navigation
- No viewed profile persists when leaving the profile screen.

---

## 3️⃣ STATISTICS RULES

How stats are created, updated, and interpreted.

### Stats are updated only on completed games
- Abandoned or interrupted games do not count.

### Accuracy is calculated, not stored manually
- Derived from correct vs total answers.

### Stats exist at two levels
- Global (overall performance)
- Per-topic (topic mastery)

### Screen time is always tracked
- Time spent anywhere in the app counts.

### Stats are visible to other users
- But cannot be edited or manipulated externally.

---

## 4️⃣ XP & PROGRESSION RULES

How players grow and advance.

### Topic XP Rules
- Each topic has its own XP and level
- Topic levels scale beyond 1000
- XP rewards depend on game mode
- XP is granted only after quiz completion

### P-XP (Prestige) Rules
- P-XP represents total player dedication
- P-XP uses a quadratic scaling formula
- P-XP is earned from gameplay and achievements
- 2-Player mode does NOT award P-XP

---

## 5️⃣ GAME MODE RULES

Rules defining gameplay access and rewards.

- **Casual mode** is always unlocked
- Some modes are **locked behind progression**
- **Time Attack** XP depends on difficulty (faster timers = higher XP multipliers)
- **3 Hearts** mode penalizes mistakes
- **2-Player** mode is competitive (no P-XP is awarded)

---

## 6️⃣ ACHIEVEMENT RULES

How achievements function.

- Achievements unlock automatically when conditions are met
- Achievements must be **manually claimed**
- Rewards are granted only on claim
- An achievement can be claimed **only once**
- Achievements reward:
  - P-XP
  - Quanta
- Achievements are grouped into **6 pillars**:
  1. Ascending Levels (Prestige milestones)
  2. Games Completed (Play count)
  3. Total Questions Answered (Answer milestones)
  4. Topic Entry Progression (Topic mastery)
  5. The Path of the Flawed Mind (Skill-based)
  6. The Path of Timeless Devotion (Time dedication)

---

## 7️⃣ QUESTIONS COMPLETED RULES

How question unlocking works.

### A question is unlocked by answering it correctly once
- The specific answer (e.g., "France") becomes permanently unlocked
- Duplicate correct answers do not count again

### Questions Completed only updates on quiz completion
- Exiting early does not save unlocks
- All game modes contribute to Questions Completed

### Display rules by topic type:
- **Flags:** Shows percentage + bar + count, clickable (opens collection)
- **Text-based topics:** Shows percentage + bar only, NOT clickable
- **Excluded topics (borders, area, capitals, logos):** Section hidden

### For Flags topic specifically:
- Each country flag is a "question"
- Unlocking a flag shows it in full color in the collection
- Locked flags appear grayscale with names visible

### Questions Completed data is per-topic
- Each topic tracks its own unlocked questions
- Stored in `userData.stats.topics[topicId].unlockedQuestions`

---

## 8️⃣ QUANTA RULES

Rules for the knowledge currency.

- Quanta is earned **only from achievements**
- Quanta has no spending system yet
- Quanta balance is persistent and cumulative
- Future spending must not invalidate earned Quanta

---

## 9️⃣ TOPIC DETAIL PAGE RULES

Rules for the pre-game topic screen.

### Topic Detail Page appears before mode selection
- User selects topic → Topic Detail Page → Mode Selection Modal → Quiz

### Stats shown are real-time from user data
- Your Level: Topic-specific level
- Games, Accuracy, Streak, Time: Calculated from `userData.stats.topics`

### Questions Completed is clickable
- For Flags: Opens Flags Collection page
- For other topics: Shows "Coming soon" message

### Follow and Rankings buttons are UI placeholders
- Follow does not persist (visual toggle only)
- Rankings shows coming soon message

---

## 10. NAVIGATION & STATE RULES

Rules ensuring stability and clarity.

- Only one primary view is active at a time
- Navigation clears temporary state:
  - Profile view
  - Charts
  - Timers
- A quiz session **blocks navigation** (players cannot switch tabs mid-quiz)
- Timers must always be destroyed on exit

---

## 11. SOCIAL RULES (CURRENT & FUTURE)

Rules governing interaction between players.

- Profile viewing is allowed without friendship
- Leaderboard clicks open profiles
- Followers/following do not yet affect gameplay
- Social Feed is non-functional until implemented

---

## 🔐 ADMIN & OWNER RULES

Rules that apply only to the owner or admins.

- The owner exists outside normal player rules
- The owner may view any user profile
- The owner may inspect all stats
- Dev tools must not be visible in production
- Admin actions must never affect player fairness

---

## ⚖️ FINAL OWNER PRINCIPLES

These are not features - they are laws.

1. **Stats are truth**
2. **Progression must feel earned**
3. **No hidden penalties**
4. **No irreversible punishment**
5. **The owner always has visibility**

---

## ✅ END OF RULEBOOK

*If a rule is not written here, it is not guaranteed.*
