# 📜 QUIZZENA — RULEBOOK

**Purpose:** Define the laws of how the game behaves  
**Audience:** Owner, future developers, future you  
**Rule:** If a rule is not written here, it is not guaranteed  
**Last Updated:** December 2024

---

## 1️⃣ CORE GAME RULES

These rules apply at all times, across all systems.

1. **All player progress is tied to one user identity**
   - Each user has exactly one `userData` record.

2. **Cloud sync is authoritative when Dev Mode is OFF**
   - Local data exists only as cache.

3. **Dev Mode bypasses Firebase**
   - Used strictly for testing and development.

---

## 2️⃣ PROFILE RULES

Rules governing identity, visibility, and control.

1. **A player has one profile**
   - The same profile screen is reused for all users.

2. **A user may view any other user's profile**
   - Viewing is read-only.

3. **When viewing another profile:**
   - Edit profile is hidden
   - Settings are hidden
   - Back button is shown

4. **When viewing own profile:**
   - Edit profile is available
   - Settings are available

5. **Profile state is cleared on navigation**
   - No viewed profile persists when leaving the profile screen.

6. **Profile images are stored via Cloudinary**
   - All profile pictures and banners use Cloudinary CDN.

---

## 3️⃣ STATISTICS RULES

How stats are created, updated, and interpreted.

1. **Stats are updated only on completed games**
   - Abandoned or interrupted games do not count.

2. **Accuracy is calculated, not stored manually**
   - Derived from correct vs total answers.

3. **Stats exist at two levels**
   - Global (overall performance)
   - Per-topic (topic mastery)

4. **Screen time is always tracked**
   - Time spent anywhere in the app counts.

5. **Stats are visible to other users**
   - But cannot be edited or manipulated externally.

---

## 4️⃣ XP & PROGRESSION RULES

How players grow and advance.

### Topic XP Rules

1. Each topic has its own XP and level
2. Topic levels scale beyond 1000
3. XP rewards depend on game mode
4. XP is granted only after quiz completion

### P-XP (Prestige) Rules

5. P-XP represents total player dedication
6. P-XP uses a quadratic scaling formula (40 × level²)
7. P-XP is earned from gameplay and achievements
8. **2-Player mode does NOT award P-XP**
9. **If P-XP data becomes inconsistent, the system automatically recalculates P-XP from historical data**

---

## 5️⃣ GAME MODE RULES

Rules defining gameplay access and rewards.

1. **Casual mode is always unlocked**

2. **Some modes are locked behind progression**
   - Time Attack: requires topic level 3
   - 3 Hearts: requires topic level 5

3. **Time Attack XP depends on difficulty**
   - 5s timer = 2.5x XP multiplier
   - 7s timer = 1.5x XP multiplier
   - 10s timer = 1.0x XP multiplier

4. **3 Hearts mode penalizes mistakes**

5. **2-Player mode is competitive**
   - No P-XP is awarded

---

## 6️⃣ ACHIEVEMENT RULES

How achievements function.

1. **Achievements unlock automatically when conditions are met**

2. **Achievements must be manually claimed**

3. **Rewards are granted only on claim**

4. **An achievement can be claimed only once**

5. **Achievements reward:**
   - P-XP
   - Quanta

6. **Achievements are grouped into houses**
   - Houses are thematic, not gameplay-affecting

---

## 7️⃣ QUANTA RULES

Rules for the knowledge currency.

1. **Quanta is earned only from achievements**

2. **Quanta has no spending system yet**

3. **Quanta balance is persistent and cumulative**

4. **Future spending must not invalidate earned Quanta**

---

## 8️⃣ NAVIGATION & STATE RULES

Rules ensuring stability and clarity.

1. **Only one primary view is active at a time**

2. **Navigation clears temporary state**
   - Profile view
   - Charts
   - Timers

3. **A quiz session blocks navigation**
   - Players cannot switch tabs mid-quiz

4. **Timers must always be destroyed on exit**

---

## 9️⃣ SOCIAL RULES (CURRENT & FUTURE)

Rules governing interaction between players.

1. **Profile viewing is allowed without friendship**

2. **Leaderboard clicks open profiles**

3. **Followers/following do not yet affect gameplay**

4. **Social Feed is non-functional until implemented**

---

## 🔟 ADMIN & OWNER RULES

Rules that apply only to the owner or admins.

1. **The owner exists outside normal player rules**

2. **The owner may view any user profile**

3. **The owner may inspect all stats**

4. **Dev tools must not be visible in production**

5. **Admin actions must never affect player fairness**

---

## 1️⃣1️⃣ IMPLICIT SYSTEM RULES

These rules govern background system behavior.

### Audio Rules
1. **Music and SFX are controlled independently**
2. **Audio preferences persist between sessions**

### Tutorial Rules
3. **Tutorial runs only once for first-time users**
4. **Tutorial does not repeat after completion**

### Daily Content Rules
5. **Quiz of the Day is determined by calendar date**
6. **Daily quiz refreshes at midnight**

### Slot Rules
7. **Slot system is limited to 2 slots**

### Language Rules
8. **Language preference is persisted locally**
9. **All UI text respects the selected language**

### Data Integrity Rules
10. **P-XP automatically repairs from history if desynced**
11. **Historical data serves as backup for progression**

### Topic Data Rules
12. **API topics (Flags, Capitals, Borders, Area) require internet connection**
13. **JSON topics work offline once loaded**
14. **Area quiz difficulty affects country selection by size ranking**

### Questions Completed Rules
15. **A question is unlocked by answering it correctly once**
16. **Duplicate correct answers do not count again**
17. **Questions Completed only updates on quiz completion**
18. **All game modes contribute to Questions Completed**
19. **Trackable collection topics:** Flags, Capitals, Logos, Area
20. **Area tracking uses country name** (not formatted area value)
21. **Excluded topic (borders):** Questions Completed section hidden

---

## 📌 FINAL OWNER PRINCIPLES

These are not features — they are laws.

- **Stats are truth**
- **Progression must feel earned**
- **No hidden penalties**
- **No irreversible punishment**
- **The owner always has visibility**

---

✅ **END OF RULEBOOK**
