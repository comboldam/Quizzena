# 🎛️ QUIZZENA - OWNER / ADMIN DASHBOARD

**Purpose:** Define what the owner can see, control, and override  
**Audience:** Game Owner (You), future admins  
**Rule:** The owner exists outside the normal game rules

---

## 1️⃣ OWNER IDENTITY & ACCESS

Defines who the owner/admin is.

### Owner Account
- Special user account (by UID / flag)
- Not bound by player restrictions

### Admin Privilege Flag
- `isAdmin = true`
- Never exposed in UI to normal users

### Owner Access Scope
- Can view all users
- Can inspect all data
- Can simulate game states

> **Rule:** The owner is not a player - even if they play the game.

---

## 2️⃣ GLOBAL OVERVIEW (OWNER HOME)

High-level view of the entire game ecosystem.

### Owner Can See:
- Total users
- Active users (daily / weekly)
- Total quizzes played
- Total time spent across all users
- Distribution of levels (topic & P-XP)
- Achievement unlock rates
- Quanta distribution

> **Purpose:** Understand health, engagement, and balance at a glance.

---

## 3️⃣ USER EXPLORER

Direct access to any user in the system.

### Owner Can:
- Search users by:
  - Username
  - UID
- Open any user profile
- View:
  - Full stats
  - Topic mastery
  - Achievements (claimed + unclaimed)
  - Prestige history
  - Screen time

> **Rule:** Owner sees everything, regardless of privacy.

---

## 4️⃣ PROFILE INSPECTION MODE

Deep inspection of a single user.

### Owner Can See:
- Raw `userData`
- Firebase document snapshot
- Last login / last update
- Per-topic stats
- Accuracy history
- Streak history

### Owner Can Do:
- Read-only by default
- Toggle Inspection Mode (no mutation)
- Toggle Simulation Mode (temporary changes)

> **Rule:** No permanent data mutation without explicit confirmation.

---

## 5️⃣ PROGRESSION & BALANCE CONTROLS

Tools to test and validate progression systems.

### Owner Can:
- Simulate XP gains
- Simulate P-XP level-ups
- Trigger achievement unlocks
- Grant temporary Quanta (test-only)
- Reset simulation state

> **Rule:** Simulation never persists to production data.

---

## 6️⃣ ACHIEVEMENT CONTROL PANEL

Full visibility into the achievement system.

### Owner Can:
- View all achievement definitions
- See unlock rate per achievement
- Inspect which users unlocked what
- Identify:
  - Too-easy achievements
  - Rare or broken achievements

> **Purpose:** Balance long-term motivation.

---

## 7️⃣ LEADERBOARD & SOCIAL MONITORING

Oversight of competitive systems.

### Owner Can:
- Preview leaderboard calculations
- See raw leaderboard data
- Identify anomalies:
  - Impossible stats
  - Cheating patterns
- Disable leaderboard temporarily (emergency)

> **Rule:** Fairness > visibility.

---

## 8️⃣ DEV / DEBUG TOOLS

Internal tools for testing and stability.

### Owner Can:
- Toggle Dev Mode
- Enable debug UI
- Force-sync Firebase
- Clear caches
- Inspect logs
- Test offline mode

> **Rule:** Dev tools are never visible to players.

---

## 9️⃣ SECURITY & INTEGRITY

Protects the game from abuse.

### Owner Can:
- Flag accounts:
  - Tester
  - Suspected cheater
- Freeze a user (read-only)
- Inspect abnormal patterns
- Review audit logs (future)

> **Rule:** No punishment without evidence.

---

## 🔮 FUTURE OWNER CONTROLS (RESERVED)

Architectural placeholders - not live yet.

- Admin UI (visual dashboard)
- Role-based admins
- Automated cheat detection
- Seasonal resets / archives
- Data export tools

---

## ⚖️ OWNER PRINCIPLES (NON-NEGOTIABLE)

1. **Visibility beats control**
2. **Simulation before mutation**
3. **Fairness over convenience**
4. **The owner always understands the system**
5. **No hidden power**

---

## ✅ END OF OWNER DASHBOARD

### WHAT YOU HAVE NOW (IMPORTANT)

You now possess **THREE CORE OWNERSHIP DOCUMENTS**:

| Document | Purpose |
|----------|---------|
| 1️⃣ **Game Map** | What exists |
| 2️⃣ **Rulebook** | How it behaves |
| 3️⃣ **Owner Dashboard** | What you control |

*This is the same structure used by serious games and platforms.*
