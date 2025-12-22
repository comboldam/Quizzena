// ============================================
// 🔥 FIREBASE INITIALIZATION
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAaAO22Tl4QkEYnICaEd8g7WpITKsIWvYI",
  authDomain: "quizzena-app.firebaseapp.com",
  projectId: "quizzena-app",
  storageBucket: "quizzena-app.firebasestorage.app",
  messagingSenderId: "839227999302",
  appId: "1:839227999302:android:b63322d2425eb123067647"
};

// Initialize Firebase
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseUser = null;

if (typeof firebase !== 'undefined') {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebase.auth();
  firebaseDb = firebase.firestore();
  console.log('🔥 Firebase initialized successfully');
} else {
  console.warn('Firebase SDK not loaded');
}

// Anonymous Authentication & Firestore User Document
async function initFirebaseAuth() {
  if (!firebaseAuth) return null;
  
  try {
    // Check if already signed in
    let user = firebaseAuth.currentUser;
    
    if (!user) {
      // Sign in anonymously
      const result = await firebaseAuth.signInAnonymously();
      user = result.user;
      console.log('🔥 Anonymous user created:', user.uid);
    } else {
      console.log('🔥 Existing user found:', user.uid);
    }
    
    firebaseUser = user;
    
    // Create/update Firestore user document
    await updateFirestoreUser(user.uid);
    
    // Load and merge cloud data (if not in dev mode)
    await loadFromFirebase();
    
    return user;
  } catch (error) {
    console.error('🔥 Firebase auth error:', error);
    return null;
  }
}

// Create or update user document in Firestore
async function updateFirestoreUser(uid) {
  if (!firebaseDb || !uid) return;
  
  try {
    const userRef = firebaseDb.collection('users').doc(uid);
    const doc = await userRef.get();
    
    if (doc.exists) {
      // Update lastLogin only
      await userRef.update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('🔥 User lastLogin updated');
    } else {
      // Create new user document
      await userRef.set({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('🔥 New user document created');
    }
  } catch (error) {
    console.error('🔥 Firestore error:', error);
  }
}

// Initialize Firebase auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initFirebaseAuth();
});

// ============================================
// ⏱️ SCREEN TIME TRACKING SYSTEM
// ============================================
// Tracks total time spent in the app (like Steam playtime)

let screenTimeTracker = {
  sessionStartTime: null,
  lastSaveTime: null,
  saveInterval: null,
  isTracking: false,
  SAVE_INTERVAL_MS: 1000, // Save every 1 second for real-time updates
  lastAchievementCheck: 0,
  ACHIEVEMENT_CHECK_INTERVAL: 10000, // Check achievements every 10 seconds
  
  start() {
    if (this.isTracking) return;
    
    this.sessionStartTime = Date.now();
    this.lastSaveTime = Date.now();
    this.lastAchievementCheck = Date.now();
    this.isTracking = true;
    
    // Save and update display every second
    this.saveInterval = setInterval(() => {
      this.saveScreenTime();
    }, this.SAVE_INTERVAL_MS);
    
    console.log('⏱️ Screen time tracking started (1s interval)');
  },
  
  pause() {
    if (!this.isTracking) return;
    
    // Save any unsaved time before pausing
    this.saveScreenTime();
    
    // Clear the interval
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    this.isTracking = false;
    console.log('⏱️ Screen time tracking paused');
  },
  
  resume() {
    if (this.isTracking) return;
    
    this.lastSaveTime = Date.now();
    this.isTracking = true;
    
    // Restart periodic saving
    this.saveInterval = setInterval(() => {
      this.saveScreenTime();
    }, this.SAVE_INTERVAL_MS);
    
    console.log('⏱️ Screen time tracking resumed');
  },
  
  saveScreenTime() {
    if (!this.isTracking || !this.lastSaveTime) return;
    
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.lastSaveTime) / 1000);
    
    if (elapsedSeconds > 0) {
      // Add to total screen time
      if (typeof userData !== 'undefined' && userData.stats) {
        userData.stats.totalTimeSeconds = (userData.stats.totalTimeSeconds || 0) + elapsedSeconds;
        
        // Also update daily stats history for charts
        this.updateDailyScreenTime(elapsedSeconds);
        
        // Update time display in real-time
        this.updateTimeDisplays();
        
        // Save to localStorage (every second)
        try {
          localStorage.setItem('quizzena_userData', JSON.stringify(userData));
        } catch (e) {
          console.warn('⏱️ Could not save screen time:', e);
        }
        
        // Check time achievements every 10 seconds (not every second to save performance)
        if (now - this.lastAchievementCheck >= this.ACHIEVEMENT_CHECK_INTERVAL) {
          if (typeof checkAchievements === 'function') {
            checkAchievements();
          }
          this.lastAchievementCheck = now;
        }
      }
      
      this.lastSaveTime = now;
    }
  },
  
  updateDailyScreenTime(seconds) {
    if (typeof userData === 'undefined' || !userData.stats) return;
    
    const now = new Date();
    // Use local date to match local hours
    const dateKey = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
    const hour = now.getHours().toString().padStart(2, '0');
    
    // Initialize stats history if not exists
    if (!userData.stats.history) {
      userData.stats.history = {};
    }
    
    // Initialize day entry if not exists
    if (!userData.stats.history[dateKey]) {
      userData.stats.history[dateKey] = {
        games: 0,
        correct: 0,
        wrong: 0,
        time: 0,
        streak: 0,
        answerTimeMs: 0,
        hourly: {},
        topics: {}
      };
    }
    
    const dayData = userData.stats.history[dateKey];
    
    // Ensure all fields exist (migration for old data)
    if (dayData.time === undefined) dayData.time = 0;
    if (!dayData.hourly) dayData.hourly = {};
    if (!dayData.topics) dayData.topics = {};
    
    // Add screen time to daily total
    dayData.time += seconds;
    
    // Also add to hourly breakdown
    if (!dayData.hourly[hour]) {
      dayData.hourly[hour] = { g: 0, c: 0, w: 0, t: 0, s: 0, at: 0 };
    }
    
    // Ensure t field exists (migration)
    if (dayData.hourly[hour].t === undefined) dayData.hourly[hour].t = 0;
    
    dayData.hourly[hour].t += seconds;
  },
  
  updateTimeDisplays() {
    if (typeof userData === 'undefined' || !userData.stats) return;
    
    const totalTimeSeconds = userData.stats.totalTimeSeconds || 0;
    const formattedTime = typeof formatTimeDisplay === 'function' 
      ? formatTimeDisplay(totalTimeSeconds) 
      : totalTimeSeconds + 's';
    
    // Update stats page time display
    const statTotalTime = document.getElementById('stat-total-time');
    if (statTotalTime) statTotalTime.textContent = formattedTime;
    
    // Update mini stats time display on home screen
    const miniStatTime = document.getElementById('mini-stat-time');
    if (miniStatTime) miniStatTime.textContent = formattedTime;
    
    // Update profile page time display (if visible)
    const profileTime = document.querySelector('.profile-stat-time');
    if (profileTime) profileTime.textContent = formattedTime;
    
    // Update stats chart if it's showing time and dashboard is visible
    const dashboard = document.getElementById('stats-chart-dashboard');
    if (dashboard && !dashboard.classList.contains('hidden')) {
      // Only refresh chart every 5 seconds to avoid performance issues
      if (!this.lastChartRefresh || Date.now() - this.lastChartRefresh >= 5000) {
        if (typeof currentStatType !== 'undefined' && currentStatType === 'time') {
          if (typeof renderStatsChart === 'function') {
            renderStatsChart();
          }
        }
        this.lastChartRefresh = Date.now();
      }
    }
  },
  
  getSessionTime() {
    if (!this.sessionStartTime) return 0;
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }
};

// Start tracking when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure userData is loaded
  setTimeout(() => {
    screenTimeTracker.start();
  }, 1000);
});

// Handle page visibility changes (tab switch, minimize, etc.)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    screenTimeTracker.pause();
  } else {
    screenTimeTracker.resume();
  }
});

// Save on page unload/close
window.addEventListener('beforeunload', () => {
  screenTimeTracker.saveScreenTime();
});

// Also handle pagehide for mobile browsers
window.addEventListener('pagehide', () => {
  screenTimeTracker.saveScreenTime();
});

// ============================================
// 🔧 DEV MODE TOGGLE
// ============================================
// Set to FALSE when launching to production!
// When true: Data only saves to localStorage (no cloud sync)
// When false: Data syncs to Firebase for cross-device play
const DEV_MODE = true;

// When true: Shows dev panel button
// When false: Hides dev panel (production UI)
const SHOW_DEV_UI = false;

// ============================================
// USER DATA SYSTEM
// ============================================

const defaultUserData = {
  isSetupComplete: false,
  profile: {
    username: "Guest",
    avatar: "👤",
    profilePicture: null, // URL to uploaded profile picture
    country: "",
    createdAt: null
  },
  stats: {
    totalGames: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    accuracy: 0,
    bestStreak: 0,
    totalTimeSeconds: 0,
    topics: {},
    recentGameAccuracies: [],  // Array of last 100 game accuracies for Skill achievements
    hybridBestStreaks: { 80: 0, 90: 0, 100: 0 },  // Best streak achieved at each accuracy threshold
    history: {}  // Stats history for chart: { "YYYY-MM-DD": { games, correct, wrong, time, streak, hourly: {...} } }
  },
  // P-XP (Player Prestige XP) System
  prestige: {
    level: 1,
    pxp: 0,           // Current P-XP toward next level
    totalPxp: 0,      // Lifetime P-XP earned
    history: {}       // Format: { "YYYY-MM-DD": { games: X, answers: Y, hourly: { "00": {g:0,a:0}, ... } } }
  }
};

function loadUserData() {
  const saved = localStorage.getItem('quizzena_user_data');
  if (saved) {
    return JSON.parse(saved);
  }
  return JSON.parse(JSON.stringify(defaultUserData));
}

// Load and merge data from Firebase (called after auth is ready)
async function loadFromFirebase() {
  if (DEV_MODE || !firebaseDb || !firebaseUser) return;
  
  try {
    const userRef = firebaseDb.collection('users').doc(firebaseUser.uid);
    const doc = await userRef.get();
    
    if (doc.exists) {
      const cloudData = doc.data();
      
      // Compare timestamps to decide which data wins
      const localTime = userData.profile?.createdAt || 0;
      const cloudTime = cloudData.lastUpdated?.toMillis() || 0;
      
      if (cloudData.stats && cloudTime > localTime) {
        // Cloud is newer - merge cloud data into local
        console.log('🔥 Loading newer data from Firebase');
        
        // Merge profile
        if (cloudData.profile) {
          userData.profile = { ...userData.profile, ...cloudData.profile };
        }
        
        // Merge stats (take higher values for XP/levels)
        if (cloudData.stats) {
          userData.isSetupComplete = cloudData.isSetupComplete || userData.isSetupComplete;
          userData.stats.totalGames = Math.max(userData.stats.totalGames || 0, cloudData.stats.totalGames || 0);
          userData.stats.correctAnswers = Math.max(userData.stats.correctAnswers || 0, cloudData.stats.correctAnswers || 0);
          userData.stats.wrongAnswers = Math.max(userData.stats.wrongAnswers || 0, cloudData.stats.wrongAnswers || 0);
          userData.stats.bestStreak = Math.max(userData.stats.bestStreak || 0, cloudData.stats.bestStreak || 0);
          
          // Merge topic stats (take higher XP/level per topic)
          if (cloudData.stats.topics) {
            for (const topicId in cloudData.stats.topics) {
              const cloudTopic = cloudData.stats.topics[topicId];
              const localTopic = userData.stats.topics[topicId] || {};
              
              userData.stats.topics[topicId] = {
                games: Math.max(localTopic.games || 0, cloudTopic.games || 0),
                correct: Math.max(localTopic.correct || 0, cloudTopic.correct || 0),
                wrong: Math.max(localTopic.wrong || 0, cloudTopic.wrong || 0),
                accuracy: Math.max(localTopic.accuracy || 0, cloudTopic.accuracy || 0),
                bestStreak: Math.max(localTopic.bestStreak || 0, cloudTopic.bestStreak || 0),
                level: Math.max(localTopic.level || 1, cloudTopic.level || 1),
                xp: Math.max(localTopic.xp || 0, cloudTopic.xp || 0),
                modesUnlocked: {
                  casual: true,
                  timeAttack: (localTopic.modesUnlocked?.timeAttack || cloudTopic.modesUnlocked?.timeAttack) || false,
                  threeHearts: (localTopic.modesUnlocked?.threeHearts || cloudTopic.modesUnlocked?.threeHearts) || false
                },
                // Time tracking fields - take higher values
                timeSpentSeconds: Math.max(localTopic.timeSpentSeconds || 0, cloudTopic.timeSpentSeconds || 0),
                totalQuestionsAnswered: Math.max(localTopic.totalQuestionsAnswered || 0, cloudTopic.totalQuestionsAnswered || 0)
              };
            }
          }
          
          // Merge overall total time
          userData.stats.totalTimeSeconds = Math.max(
            userData.stats.totalTimeSeconds || 0,
            cloudData.stats?.totalTimeSeconds || 0
          );
        }
        
        // Merge P-XP (Prestige) data
        if (cloudData.prestige) {
          if (!userData.prestige) {
            userData.prestige = { level: 1, pxp: 0, totalPxp: 0, history: {} };
          }
          
          // Take higher level and P-XP values
          userData.prestige.level = Math.max(userData.prestige.level || 1, cloudData.prestige.level || 1);
          userData.prestige.pxp = Math.max(userData.prestige.pxp || 0, cloudData.prestige.pxp || 0);
          userData.prestige.totalPxp = Math.max(userData.prestige.totalPxp || 0, cloudData.prestige.totalPxp || 0);
          
          // Merge history (combine both local and cloud history)
          if (cloudData.prestige.history) {
            if (!userData.prestige.history) userData.prestige.history = {};
            
            for (const dateKey in cloudData.prestige.history) {
              const cloudDay = cloudData.prestige.history[dateKey];
              const localDay = userData.prestige.history[dateKey] || { games: 0, answers: 0, hourly: {} };
              
              // Take higher daily totals
              userData.prestige.history[dateKey] = {
                games: Math.max(localDay.games || 0, cloudDay.games || 0),
                answers: Math.max(localDay.answers || 0, cloudDay.answers || 0),
                hourly: { ...localDay.hourly, ...cloudDay.hourly }
              };
            }
          }
        }
        
        // 💎 Merge Quanta (take higher value)
        if (cloudData.quanta !== undefined) {
          userData.quanta = Math.max(userData.quanta || 0, cloudData.quanta || 0);
        }
        
        // 🏆 Merge Achievements
        if (cloudData.achievements) {
          if (!userData.achievements) {
            userData.achievements = { unlocked: [], pending: [], history: {} };
          }
          
          // Merge unlocked achievements (combine unique IDs)
          if (cloudData.achievements.unlocked) {
            const localUnlockedIds = new Set((userData.achievements.unlocked || []).map(a => a.id));
            for (const cloudAchievement of cloudData.achievements.unlocked) {
              if (!localUnlockedIds.has(cloudAchievement.id)) {
                userData.achievements.unlocked.push(cloudAchievement);
              }
            }
          }
          
          // Merge pending achievements (combine unique IDs, but remove if already in unlocked)
          if (cloudData.achievements.pending) {
            const unlockedIds = new Set((userData.achievements.unlocked || []).map(a => a.id));
            const localPendingIds = new Set((userData.achievements.pending || []).map(a => a.id));
            for (const cloudPending of cloudData.achievements.pending) {
              if (!unlockedIds.has(cloudPending.id) && !localPendingIds.has(cloudPending.id)) {
                userData.achievements.pending.push(cloudPending);
              }
            }
          }
          
          // Merge achievement history (combine dates, take higher values)
          if (cloudData.achievements.history) {
            if (!userData.achievements.history) userData.achievements.history = {};
            
            for (const dateKey in cloudData.achievements.history) {
              const cloudDay = cloudData.achievements.history[dateKey];
              const localDay = userData.achievements.history[dateKey] || { pxp: 0, quanta: 0 };
              
              userData.achievements.history[dateKey] = {
                pxp: Math.max(localDay.pxp || 0, cloudDay.pxp || 0),
                quanta: Math.max(localDay.quanta || 0, cloudDay.quanta || 0)
              };
            }
          }
        }
        
        // Save merged data locally
        localStorage.setItem('quizzena_user_data', JSON.stringify(userData));
        console.log('🔥 Merged cloud data with local');
      } else {
        console.log('🔥 Local data is newer, keeping local');
      }
    } else {
      console.log('🔥 No cloud data found, using local');
    }
  } catch (error) {
    console.error('🔥 Firebase load error:', error);
    // Silent fail - continue with localStorage data
  }
}

function saveUserData() {
  // Always save to localStorage (fast, works offline)
  localStorage.setItem('quizzena_user_data', JSON.stringify(userData));
  
  // Sync to Firebase if not in dev mode
  if (!DEV_MODE && firebaseDb && firebaseUser) {
    syncToFirebase();
  }
}

// Async Firebase sync (non-blocking)
async function syncToFirebase() {
  if (!firebaseDb || !firebaseUser) return;
  
  try {
    const userRef = firebaseDb.collection('users').doc(firebaseUser.uid);
    await userRef.set({
      // Profile & Setup
      isSetupComplete: userData.isSetupComplete,
      profile: userData.profile,
      
      // All Stats (includes XP, levels, modesUnlocked per topic)
      stats: userData.stats,
      
      // P-XP (Player Prestige XP) System
      prestige: userData.prestige,
      
      // 💎 Quanta Currency
      quanta: userData.quanta || 0,
      
      // 🏆 Achievements System
      achievements: userData.achievements || { unlocked: [], pending: [], history: {} },
      
      // Timestamps
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('🔥 Data synced to Firebase');
  } catch (error) {
    console.error('🔥 Firebase sync error:', error);
    // Silent fail - localStorage still has the data
  }
}

async function resetUserData() {
  // Clear localStorage
  localStorage.removeItem('quizzena_user_data');
  localStorage.removeItem('quizzena_my_slots');
  
  // Also clear Firebase data if not in dev mode
  if (!DEV_MODE && firebaseDb && firebaseUser) {
    try {
      await firebaseDb.collection('users').doc(firebaseUser.uid).delete();
      console.log('🔥 Firebase user data deleted');
    } catch (error) {
      console.error('🔥 Firebase delete error:', error);
    }
  }
  
  location.reload();
}

let userData = loadUserData();

console.log('User Data System loaded:', userData);

// ============================================
// ⭐ XP & LEVELING SYSTEM (Per Topic)
// ============================================

// Default XP data for a new topic
const defaultTopicXPData = {
  level: 1,
  xp: 0,
  modesUnlocked: {
    casual: true,
    timeAttack: false,
    threeHearts: false
  }
};

// Get or initialize XP data for a topic
function getTopicXPData(topicId) {
  // Ensure topic exists in stats
  if (!userData.stats.topics[topicId]) {
    userData.stats.topics[topicId] = {
      games: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      bestStreak: 0
    };
  }
  
  const topic = userData.stats.topics[topicId];
  
  // Migrate old topics that don't have XP fields (backward compatibility)
  if (topic.level === undefined) {
    topic.level = 1;
  }
  if (topic.xp === undefined) {
    topic.xp = 0;
  }
  if (topic.modesUnlocked === undefined) {
    topic.modesUnlocked = {
      casual: true,
      timeAttack: false,
      threeHearts: false
    };
  }
  
  return topic;
}

// Save topic data (calls existing saveUserData)
function saveTopicXPData() {
  saveUserData();
}

// Convert country code (e.g., "AZ") to flag emoji (e.g., "🇦🇿")
function countryCodeToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const code = countryCode.toUpperCase();
  const offset = 127397; // Regional indicator symbol offset
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}

// ============================================
// ⭐ LEVELING SYSTEM
// ============================================

// Calculate XP needed to reach a specific level
// Formula: 40 × level²
function xpNeededForLevel(level) {
  return 40 * level * level;
}

// Update player level based on current XP (cumulative)
// XP is NOT subtracted - it accumulates
function updateLevel(topicData) {
  // Keep leveling up while XP is enough for next level
  while (topicData.xp >= xpNeededForLevel(topicData.level)) {
    topicData.level++;
    console.log(`🎉 Level up! Now level ${topicData.level}`);
  }
}

// Get XP progress for current level (for progress bars)
function getLevelProgress(topicData) {
  const currentLevelXP = topicData.level > 1 ? xpNeededForLevel(topicData.level - 1) : 0;
  const nextLevelXP = xpNeededForLevel(topicData.level);
  const xpInCurrentLevel = topicData.xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const xpRemaining = xpNeededForNextLevel - xpInCurrentLevel;
  return {
    current: xpInCurrentLevel,
    needed: xpNeededForNextLevel,
    remaining: xpRemaining,
    percentage: Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)
  };
}

// ============================================
// ⭐ MODE UNLOCK SYSTEM
// ============================================
// Casual: Always unlocked (default)
// Time Attack: Unlocks at Level 5
// 3 Hearts: Unlocks at Level 10

const MODE_UNLOCK_LEVELS = {
  casual: 1,        // Always unlocked
  timeAttack: 5,    // Unlocks at level 5
  threeHearts: 10   // Unlocks at level 10
};

// Check and update mode unlocks based on current level
function checkModeUnlocks(topicData) {
  let newUnlocks = [];
  
  // Time Attack unlocks at level 5
  if (topicData.level >= MODE_UNLOCK_LEVELS.timeAttack && !topicData.modesUnlocked.timeAttack) {
    topicData.modesUnlocked.timeAttack = true;
    newUnlocks.push('timeAttack');
    console.log('🔓 Time Attack mode unlocked!');
  }
  
  // 3 Hearts unlocks at level 10
  if (topicData.level >= MODE_UNLOCK_LEVELS.threeHearts && !topicData.modesUnlocked.threeHearts) {
    topicData.modesUnlocked.threeHearts = true;
    newUnlocks.push('threeHearts');
    console.log('🔓 3 Hearts mode unlocked!');
  }
  
  return newUnlocks; // Returns array of newly unlocked modes (for popups)
}

// Check if a specific mode is unlocked for a topic
function isModeUnlocked(topicData, mode) {
  if (mode === 'casual') return true; // Always unlocked
  if (mode === 'time-attack') return topicData.modesUnlocked.timeAttack;
  if (mode === 'three-hearts') return topicData.modesUnlocked.threeHearts;
  return true;
}

// Get required level for a mode
function getRequiredLevelForMode(mode) {
  if (mode === 'casual') return MODE_UNLOCK_LEVELS.casual;
  if (mode === 'time-attack') return MODE_UNLOCK_LEVELS.timeAttack;
  if (mode === 'three-hearts') return MODE_UNLOCK_LEVELS.threeHearts;
  return 1;
}

// ============================================
// ⭐ XP CALCULATION FUNCTIONS
// ============================================

// Learning Curve Bonus Multiplier table (for Casual mode)
// Helps beginners who get fewer correct answers
const LCB_MULTIPLIERS = {
  0: 10,  // 0 correct → ×10 = 100 XP bonus
  1: 6,   // 1 correct → ×6 = 60 XP bonus
  2: 4,   // 2 correct → ×4 = 40 XP bonus
  3: 2,   // 3 correct → ×2 = 20 XP bonus
  4: 1,   // 4 correct → ×1 = 10 XP bonus
  5: 0    // 5 correct → ×0 = 0 XP bonus (perfect = no bonus needed)
};

/**
 * CASUAL MODE XP FORMULA
 * ----------------------
 * XP = (CorrectAnswers × 10) + CompletionXP + LCB
 * 
 * Where:
 * - CorrectAnswers × 10 = Performance XP
 * - CompletionXP = 10 (always)
 * - LCB = Learning Curve Bonus (helps beginners, fades after level 20)
 * 
 * LCB = 10 × LCBM(correct) × FadeFactor(level)
 * - Level 1-20: 100% LCB
 * - Level 21+: 0% LCB
 */
function getXPCasual(correctAnswers, topicData) {
  // Performance XP: 10 XP per correct answer
  const performanceXP = correctAnswers * 10;
  
  // Completion XP: Always 10
  const completionXP = 10;
  
  // Learning Curve Bonus (LCB)
  const lcbMultiplier = LCB_MULTIPLIERS[correctAnswers] || 0;
  const lcbBase = 10 * lcbMultiplier; // Base LCB value
  
  // LCB Fade: 100% for levels 1-20, 0% for level 21+
  const lcbFadeFactor = topicData.level <= 20 ? 1.0 : 0.0;
  const lcb = Math.floor(lcbBase * lcbFadeFactor);
  
  const totalXP = performanceXP + completionXP + lcb;
  
  console.log(`📊 Casual XP: ${correctAnswers}×10 + 10 + ${lcb} LCB = ${totalXP}`);
  return totalXP;
}

/**
 * TIME ATTACK MODE XP FORMULA
 * ---------------------------
 * XP = (CorrectCount × 5) + (QuestionsAnswered × 1) + AccuracyBonus + CompletionXP
 * 
 * Where:
 * - CorrectCount × 5 = Performance XP
 * - QuestionsAnswered × 1 = Speed XP (reward for fast play)
 * - AccuracyBonus = CorrectCount × (CorrectCount / QuestionsAnswered)
 * - CompletionXP = 20 (always, no fade)
 */
function getXPTimeAttack(correctCount, questionsAnswered, topicData) {
  // Performance XP: 5 XP per correct
  const performanceXP = correctCount * 5;
  
  // Speed XP: 1 XP per question answered
  const speedXP = questionsAnswered * 1;
  
  // Accuracy Bonus: rewards high accuracy
  const accuracy = questionsAnswered > 0 ? correctCount / questionsAnswered : 0;
  const accuracyBonus = Math.floor(correctCount * accuracy);
  
  // Completion XP: Always 20 (no fade)
  const completionXP = 20;
  
  const totalXP = performanceXP + speedXP + accuracyBonus + completionXP;
  
  console.log(`📊 Time Attack XP: ${correctCount}×5 + ${questionsAnswered}×1 + ${accuracyBonus} accuracy + 20 = ${totalXP}`);
  return totalXP;
}

/**
 * 3 HEARTS MODE XP FORMULA
 * ------------------------
 * XP = (CorrectAnswers × 12.5) + (SurvivedQuestions × 1.5) + (LongestStreak × 2)
 * 
 * Where:
 * - CorrectAnswers × 12.5 = Performance XP (highest in game - mastery mode)
 * - SurvivedQuestions × 1.5 = Survival XP (how long you lasted)
 * - LongestStreak × 2 = Streak Bonus
 * - No Completion XP (game ends by death)
 * - No Accuracy Bonus (accuracy naturally high)
 */
function getXPThreeHearts(correctAnswers, survivedQuestions, longestStreak, topicData) {
  // Performance XP: 12.5 XP per correct (highest reward)
  const performanceXP = correctAnswers * 12.5;
  
  // Survival XP: 1.5 XP per question survived (CAPPED at 50 questions = 75 XP)
  const SURVIVAL_CAP = 75; // Max survival XP (50 questions × 1.5)
  const survivalXP = Math.min(survivedQuestions * 1.5, SURVIVAL_CAP);
  
  // Streak Bonus: 2 XP per streak count (uncapped - rewards mastery!)
  const streakBonus = longestStreak * 2;
  
  const totalXP = Math.floor(performanceXP + survivalXP + streakBonus);
  
  console.log(`📊 3 Hearts XP: ${correctAnswers}×12.5 + ${survivedQuestions}×1.5 (cap:${SURVIVAL_CAP}) + ${longestStreak}×2 = ${totalXP}`);
  return totalXP;
}

/**
 * ADD XP TO TOPIC
 * ---------------
 * Central function to add XP, update level, and check unlocks
 */
function addXP(topicId, amount) {
  const topicData = getTopicXPData(topicId);
  
  topicData.xp += amount;
  console.log(`✨ +${amount} XP for ${topicId}! Total: ${topicData.xp}`);
  
  // Check for level up
  const oldLevel = topicData.level;
  updateLevel(topicData);
  
  // Check for mode unlocks
  const newUnlocks = checkModeUnlocks(topicData);
  
  // Save data
  saveTopicXPData();
  
  return {
    xpGained: amount,
    totalXP: topicData.xp,
    leveledUp: topicData.level > oldLevel,
    oldLevel: oldLevel,
    newLevel: topicData.level,
    newUnlocks: newUnlocks
  };
}

console.log('XP System initialized');

// ============================================
// 🛠️ DEV PANEL (For Testing)
// ============================================

let devModeActive = false;
let originalTimeAttackDuration = 60;

function showDevPanel() {
  devModeActive = true;
  
  // Create dev panel overlay
  let devPanel = document.getElementById('dev-panel');
  if (!devPanel) {
    devPanel = document.createElement('div');
    devPanel.id = 'dev-panel';
    document.body.appendChild(devPanel);
  }
  
  const flagsData = getTopicXPData('flags');
  const flagsProgress = getLevelProgress(flagsData);
  
  devPanel.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:20px;box-sizing:border-box;overflow-y:auto;';
  
  devPanel.innerHTML = `
    <div style="width:100%;max-width:400px;">
      <h2 style="color:#FF5722;font-size:24px;text-align:center;margin-bottom:20px;">🛠️ DEV PANEL</h2>
      
      <!-- Flags XP Info -->
      <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:10px;padding:15px;margin-bottom:20px;">
        <div style="color:#FFD700;font-size:18px;font-weight:bold;text-align:center;">🏳️ Flags Topic</div>
        <div style="color:#fff;text-align:center;margin-top:10px;">
          <div>Level: <span style="color:#FFD700;font-weight:bold;">${flagsData.level}</span></div>
          <div>XP: <span style="color:#FFD700;font-weight:bold;">${flagsData.xp}</span></div>
          <div>Progress: ${flagsProgress.current}/${flagsProgress.needed} (${flagsProgress.percentage}%)</div>
          <div style="margin-top:5px;">
            Modes: Casual ✅ | Time Attack ${flagsData.modesUnlocked.timeAttack ? '✅' : '🔒'} | 3 Hearts ${flagsData.modesUnlocked.threeHearts ? '✅' : '🔒'}
          </div>
        </div>
      </div>
      
      <!-- Stats Controls (for testing achievements) -->
      <div style="background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#4CAF50;font-size:16px;font-weight:bold;margin-bottom:10px;">📊 Test Game Stats</div>
        <div style="color:#fff;text-align:center;margin-bottom:10px;font-size:11px;">
          Games: <span style="color:#fbbf24;font-weight:bold;">${userData.stats?.totalGames || 0}</span> | 
          Correct: <span style="color:#22c55e;font-weight:bold;">${userData.stats?.correctAnswers || 0}</span> |
          Wrong: <span style="color:#ef4444;font-weight:bold;">${userData.stats?.wrongAnswers || 0}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
          <button onclick="devAddGames(50)" style="padding:10px 14px;background:#4CAF50;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">+50 Games</button>
          <button onclick="devAddCorrectAnswers(100)" style="padding:10px 14px;background:#22c55e;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">+100 Correct</button>
          <button onclick="devAddWrongAnswers(100)" style="padding:10px 14px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">+100 Wrong</button>
          <button onclick="devResetStats()" style="padding:10px 14px;background:#666;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">Reset</button>
        </div>
      </div>
      
      <!-- Topic Level Controls (for testing Pillar 4) -->
      <div style="background:rgba(255,152,0,0.1);border:1px solid rgba(255,152,0,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#FF9800;font-size:16px;font-weight:bold;margin-bottom:10px;">🔥 Topic Level (Flags)</div>
        <div style="color:#fff;text-align:center;margin-bottom:10px;font-size:12px;">
          Highest Topic Level: <span style="color:#fbbf24;font-weight:bold;">${getHighestTopicLevel()}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
          <button onclick="devAddTopicLevels(10)" style="padding:10px 16px;background:#FF9800;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;">+10 Levels</button>
          <button onclick="devAddTopicLevels(50)" style="padding:10px 16px;background:#f57c00;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;">+50 Levels</button>
          <button onclick="devResetTopicLevels()" style="padding:10px 16px;background:#f44336;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;">Reset Topics</button>
        </div>
      </div>
      
      <!-- Screen Time Controls (for testing Pillar 6) -->
      <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#8b5cf6;font-size:16px;font-weight:bold;margin-bottom:10px;">⏳ Screen Time (Total App Time)</div>
        <div style="color:#fff;text-align:center;margin-bottom:10px;font-size:12px;">
          Total: <span style="color:#fbbf24;font-weight:bold;">${formatTimeDisplay(userData.stats?.totalTimeSeconds || 0)}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
          <button onclick="devAddTimePlayed(3600)" style="padding:10px 14px;background:#8b5cf6;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">+1 Hour</button>
          <button onclick="devAddTimePlayed(36000)" style="padding:10px 14px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">+10 Hours</button>
          <button onclick="devAddTimePlayed(360000)" style="padding:10px 14px;background:#6d28d9;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">+100 Hours</button>
          <button onclick="devResetTimePlayed()" style="padding:10px 14px;background:#f44336;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">Reset</button>
        </div>
      </div>
      
      <!-- Skill House Testing -->
      <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#fbbf24;font-size:16px;font-weight:bold;margin-bottom:10px;">⬡ Skill House Testing</div>
        <div style="color:#fff;text-align:center;margin-bottom:8px;font-size:10px;">
          Streak: <span style="color:#ef4444;">${userData.stats?.bestStreak || 0}</span> |
          Hybrid 80%: <span style="color:#fbbf24;">${userData.stats?.hybridBestStreaks?.[80] || 0}</span> |
          90%: <span style="color:#f59e0b;">${userData.stats?.hybridBestStreaks?.[90] || 0}</span> |
          100%: <span style="color:#ec4899;">${userData.stats?.hybridBestStreaks?.[100] || 0}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
          <button onclick="devSetBestStreak(50)" style="padding:8px 12px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">Streak=50</button>
          <button onclick="devSetHybrid(85, 40)" style="padding:8px 12px;background:#fbbf24;color:#000;border:none;border-radius:6px;font-size:11px;cursor:pointer;">H85=40</button>
          <button onclick="devSetHybrid(90, 30)" style="padding:8px 12px;background:#f59e0b;color:#000;border:none;border-radius:6px;font-size:11px;cursor:pointer;">H90=30</button>
          <button onclick="devSetHybrid(100, 20)" style="padding:8px 12px;background:#ec4899;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">H100=20</button>
          <button onclick="devResetSkillStats()" style="padding:8px 12px;background:#666;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">Reset</button>
        </div>
      </div>
      
      <!-- Exploration House -->
      <div style="background:rgba(141,191,255,0.1);border:1px solid rgba(141,191,255,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#8dbfff;font-size:16px;font-weight:bold;margin-bottom:10px;">🧭 Exploration House</div>
        <div style="color:#fff;text-align:center;margin-bottom:8px;font-size:10px;">
          Topics Played: <span style="color:#8dbfff;">${getTopicsPlayedCount()}</span> |
          Categories: <span style="color:#e6d49a;">${getCategoriesPlayedCount()}/6</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
          <button onclick="devAddTopicsPlayed(5)" style="padding:8px 12px;background:#8dbfff;color:#000;border:none;border-radius:6px;font-size:11px;cursor:pointer;">+5 Topics</button>
          <button onclick="devAddTopicsPlayed(10)" style="padding:8px 12px;background:#8dbfff;color:#000;border:none;border-radius:6px;font-size:11px;cursor:pointer;">+10 Topics</button>
          <button onclick="devPlayAllCategories()" style="padding:8px 12px;background:#e6d49a;color:#000;border:none;border-radius:6px;font-size:11px;cursor:pointer;">All Categories</button>
          <button onclick="devResetExploration()" style="padding:8px 12px;background:#666;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">Reset</button>
        </div>
      </div>
      
      <!-- Level Skip -->
      <div style="background:rgba(156,39,176,0.1);border:1px solid rgba(156,39,176,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#9C27B0;font-size:16px;font-weight:bold;margin-bottom:10px;">Skip to Level</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
          <button onclick="devSkipToLevel(5)" style="padding:12px 20px;background:#9C27B0;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Level 5 (Time Attack)</button>
          <button onclick="devSkipToLevel(10)" style="padding:12px 20px;background:#9C27B0;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Level 10 (3 Hearts)</button>
        </div>
      </div>
      
      <!-- P-XP (Prestige) Controls -->
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#3b82f6;font-size:16px;font-weight:bold;margin-bottom:10px;">🔷 Prestige Level (P-XP)</div>
        <div style="color:#fff;text-align:center;margin-bottom:10px;">
          Current: Level <span style="color:#fbbf24;font-weight:bold;">${userData.prestige?.level || 1}</span> | P-XP: ${userData.prestige?.pxp || 0}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
          <button onclick="devSetPrestigeLevel(2)" style="padding:12px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Set Level 2</button>
          <button onclick="devSetPrestigeLevel(5)" style="padding:12px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Set Level 5</button>
          <button onclick="devResetPrestige()" style="padding:12px 20px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Reset Prestige</button>
        </div>
      </div>
      
      <!-- Game Settings -->
      <div style="background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.3);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="color:#FF6B6B;font-size:16px;font-weight:bold;margin-bottom:10px;">Game Settings</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
          <button onclick="devSetTimeAttack5Sec()" style="padding:12px 20px;background:#FF6B6B;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Time Attack = 5 sec</button>
          <button onclick="devResetTimeAttack()" style="padding:12px 20px;background:#666;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Time Attack = 60 sec</button>
        </div>
      </div>
      
      <!-- Data Reset -->
      <div style="background:rgba(244,67,54,0.1);border:1px solid rgba(244,67,54,0.3);border-radius:10px;padding:15px;margin-bottom:20px;">
        <div style="color:#f44336;font-size:16px;font-weight:bold;margin-bottom:10px;">⚠️ Danger Zone</div>
        <div style="display:flex;justify-content:center;">
          <button onclick="devResetAllData()" style="padding:12px 30px;background:#f44336;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">🗑️ Reset ALL Data</button>
        </div>
      </div>
      
      <!-- Exit Button -->
      <button onclick="hideDevPanel()" style="width:100%;padding:16px;background:linear-gradient(135deg,#333,#222);color:#fff;border:none;border-radius:12px;font-size:18px;cursor:pointer;">✖ Exit Dev Panel</button>
    </div>
  `;
  
  // Hide the dev panel button
  const devBtn = document.getElementById('dev-panel-btn');
  if (devBtn) devBtn.style.display = 'none';
}

function hideDevPanel() {
  devModeActive = false;
  const devPanel = document.getElementById('dev-panel');
  if (devPanel) devPanel.remove();
  
  // Show the dev panel button again
  const devBtn = document.getElementById('dev-panel-btn');
  if (devBtn) devBtn.style.display = 'block';
}

function devAddXP(amount) {
  const result = addXP('flags', amount);
  console.log(`DEV: Added ${amount} XP to flags`, result);
  showDevPanel(); // Refresh panel
}

function devResetXP() {
  const topicData = getTopicXPData('flags');
  topicData.xp = 0;
  topicData.level = 1;
  topicData.modesUnlocked = {
    casual: true,
    timeAttack: false,
    threeHearts: false
  };
  saveTopicXPData();
  console.log('DEV: Reset flags XP');
  showDevPanel(); // Refresh panel
}

// Dev function: Add games - uses SAME code path as actual gameplay
function devAddGames(amount) {
  // Add to stats (same as saveQuizStats)
  userData.stats.totalGames = (userData.stats.totalGames || 0) + amount;
  
  // Award P-XP using the SAME function as gameplay (10 P-XP per game, 0 correct answers)
  awardPxp(amount, 0, 'casual');
  
  // Check achievements (same as post-game)
  checkAchievements();
  
  // Update displays
  updateGlobalLevelBadge();
  updateAllStatsDisplays();
  
  console.log(`DEV: +${amount} games (+${amount * 10} P-XP). Total: ${userData.stats.totalGames}`);
  showDevPanel();
}

// Dev function: Add correct answers - uses SAME code path as actual gameplay
function devAddCorrectAnswers(amount) {
  // Add to stats (same as saveQuizStats)
  userData.stats.correctAnswers = (userData.stats.correctAnswers || 0) + amount;
  
  // Award P-XP using the SAME function as gameplay (0 games, X correct answers)
  awardPxp(0, amount, 'casual');
  
  // Check achievements (same as post-game)
  checkAchievements();
  
  // Update displays
  updateGlobalLevelBadge();
  updateAllStatsDisplays();
  
  console.log(`DEV: +${amount} correct (+${amount} P-XP). Total: ${userData.stats.correctAnswers}`);
  showDevPanel();
}

// Dev function: Add wrong answers (for testing Pillar 5 - Flawed Mind)
function devAddWrongAnswers(amount) {
  // Add to stats
  userData.stats.wrongAnswers = (userData.stats.wrongAnswers || 0) + amount;
  
  // Save data
  saveUserData();
  
  // Check achievements
  checkAchievements();
  
  // Update displays
  updateAllStatsDisplays();
  
  console.log(`DEV: +${amount} wrong answers. Total: ${userData.stats.wrongAnswers}`);
  showDevPanel();
}

// Dev function: Reset game stats
function devResetStats() {
  if (confirm('Reset totalGames, correctAnswers, and P-XP history?')) {
    userData.stats.totalGames = 0;
    userData.stats.correctAnswers = 0;
    userData.stats.wrongAnswers = 0;
    // Also reset prestige history for clean chart
    if (userData.prestige) {
      userData.prestige.history = {};
    }
    saveUserData();
    console.log('DEV: Reset game stats and P-XP history');
    showDevPanel();
  }
}

// Dev function: Add topic levels (to test Pillar 4 achievements)
function devAddTopicLevels(amount) {
  // Add levels to flags topic (or create if not exists)
  const topicData = getTopicXPData('flags');
  topicData.level = (topicData.level || 1) + amount;
  
  // Calculate XP needed for new level (to keep XP in sync)
  topicData.xp = xpNeededForLevel(topicData.level - 1);
  
  // Check mode unlocks
  checkModeUnlocks(topicData);
  
  // Save topic data
  saveTopicXPData();
  
  // Check achievements
  checkAchievements();
  
  console.log(`DEV: Added ${amount} levels to Flags. Now level ${topicData.level}`);
  showDevPanel();
}

// Dev function: Reset all topic levels
function devResetTopicLevels() {
  if (confirm('Reset all topic levels to 1?')) {
    if (userData.stats?.topics) {
      for (const topicId in userData.stats.topics) {
        userData.stats.topics[topicId].level = 1;
        userData.stats.topics[topicId].xp = 0;
        userData.stats.topics[topicId].modesUnlocked = {
          casual: true,
          timeAttack: false,
          threeHearts: false
        };
      }
    }
    saveUserData();
    console.log('DEV: Reset all topic levels');
    showDevPanel();
  }
}

// Dev function: Add screen time (for testing Pillar 6 - Timeless Devotion)
// Note: Screen time now tracks total app time, not just quiz time
function devAddTimePlayed(seconds) {
  // Add to total screen time
  userData.stats.totalTimeSeconds = (userData.stats.totalTimeSeconds || 0) + seconds;
  
  // Save data
  saveUserData();
  
  // Check achievements
  checkAchievements();
  
  // Update displays
  updateAllStatsDisplays();
  
  const hours = (seconds / 3600).toFixed(1);
  console.log(`DEV: +${hours} hours. Total: ${formatTimeDisplay(userData.stats.totalTimeSeconds)}`);
}

// Dev function: Add game accuracies (for testing Skill House - Accuracy Feats)
function devAddAccuracyGames(accuracy, count = 1) {
  // Initialize array if needed
  if (!userData.stats.recentGameAccuracies) {
    userData.stats.recentGameAccuracies = [];
  }
  
  // Add 'count' games with the specified accuracy
  for (let i = 0; i < count; i++) {
    userData.stats.recentGameAccuracies.push(accuracy);
    // Keep only last 100
    if (userData.stats.recentGameAccuracies.length > 100) {
      userData.stats.recentGameAccuracies.shift();
    }
  }
  
  // Also add to total games and award P-XP
  userData.stats.totalGames = (userData.stats.totalGames || 0) + count;
  awardPxp(count, 0, 'casual');
  
  // Save data
  saveUserData();
  
  // Check achievements
  checkAchievements();
  
  // Update displays
  updateGlobalLevelBadge();
  updateAllStatsDisplays();
  
  console.log(`DEV: +${count} game(s) with ${accuracy}% accuracy. Recent accuracies: ${userData.stats.recentGameAccuracies.slice(-10).join(', ')}...`);
  showDevPanel();
}

// Dev function: Reset accuracy history
function devResetAccuracy() {
  userData.stats.recentGameAccuracies = [];
  saveUserData();
  console.log('DEV: Reset accuracy history');
  showDevPanel();
}

// Dev function: Set best streak (for testing Skill Pillar 2)
function devSetBestStreak(streak) {
  userData.stats.bestStreak = streak;
  saveUserData();
  checkAchievements();
  console.log(`DEV: Set best streak to ${streak}`);
  showDevPanel();
}

// Dev function: Reset best streak
function devResetStreak() {
  userData.stats.bestStreak = 0;
  saveUserData();
  console.log('DEV: Reset best streak to 0');
  showDevPanel();
}

// Dev function: Set hybrid best streak at accuracy threshold
function devSetHybrid(accuracy, streak) {
  if (!userData.stats.hybridBestStreaks) {
    userData.stats.hybridBestStreaks = { 80: 0, 90: 0, 100: 0 };
  }
  userData.stats.hybridBestStreaks[accuracy] = streak;
  saveUserData();
  checkAchievements();
  console.log(`DEV: Set hybrid ${accuracy}% best streak to ${streak}`);
  showDevPanel();
}

// Dev function: Reset all Skill house stats
function devResetSkillStats() {
  userData.stats.bestStreak = 0;
  userData.stats.recentGameAccuracies = [];
  userData.stats.hybridBestStreaks = { 80: 0, 90: 0, 100: 0 };
  saveUserData();
  console.log('DEV: Reset all Skill house stats');
  showDevPanel();
}

// Helper function to count categories played
function getCategoriesPlayedCount() {
  const playedCategories = new Set();
  if (!userData.stats?.topics) return 0;
  
  Object.keys(userData.stats.topics).forEach(topicId => {
    const topic = userData.stats.topics[topicId];
    if (topic && topic.games > 0) {
      const config = TOPIC_CONFIG[topicId];
      if (config && config.category) {
        playedCategories.add(config.category);
      }
    }
  });
  
  return playedCategories.size;
}

// Dev function: Add topics played (simulates playing in multiple topics)
function devAddTopicsPlayed(count) {
  const allTopics = Object.keys(TOPIC_CONFIG);
  if (!userData.stats.topics) userData.stats.topics = {};
  
  let added = 0;
  for (const topicId of allTopics) {
    if (added >= count) break;
    if (!userData.stats.topics[topicId] || userData.stats.topics[topicId].games === 0) {
      if (!userData.stats.topics[topicId]) {
        userData.stats.topics[topicId] = {
          games: 0, correct: 0, wrong: 0, accuracy: 0,
          bestStreak: 0, level: 1, xp: 0,
          modesUnlocked: { casual: true, timeAttack: false, threeHearts: false },
          timeSpentSeconds: 0, totalQuestionsAnswered: 0
        };
      }
      userData.stats.topics[topicId].games = 5;
      userData.stats.topics[topicId].correct = 20;
      userData.stats.topics[topicId].totalQuestionsAnswered = 25;
      added++;
    }
  }
  
  // Award P-XP for games played
  awardPxp(added, added * 20, 'casual');
  
  saveUserData();
  checkAchievements();
  console.log(`DEV: Added ${added} topics played`);
  showDevPanel();
}

// Dev function: Play all categories (for capstone achievement)
function devPlayAllCategories() {
  const categoryTopics = {
    'geography': 'flags',
    'football': 'football',
    'history': 'world-history',
    'movies': 'movies',
    'tv-shows': 'tv-shows',
    'logos': 'logos'
  };
  
  if (!userData.stats.topics) userData.stats.topics = {};
  
  Object.entries(categoryTopics).forEach(([category, topicId]) => {
    if (!userData.stats.topics[topicId]) {
      userData.stats.topics[topicId] = {
        games: 0, correct: 0, wrong: 0, accuracy: 0,
        bestStreak: 0, level: 1, xp: 0,
        modesUnlocked: { casual: true, timeAttack: false, threeHearts: false },
        timeSpentSeconds: 0, totalQuestionsAnswered: 0
      };
    }
    if (userData.stats.topics[topicId].games === 0) {
      userData.stats.topics[topicId].games = 1;
      userData.stats.topics[topicId].correct = 10;
      userData.stats.topics[topicId].totalQuestionsAnswered = 10;
    }
  });
  
  // Award P-XP
  awardPxp(6, 60, 'casual');
  
  saveUserData();
  checkAchievements();
  console.log('DEV: Played all categories');
  showDevPanel();
}

// Dev function: Reset exploration stats
function devResetExploration() {
  if (!userData.stats.topics) return;
  
  // Reset all topic game counts (but keep XP/level progress)
  for (const topicId in userData.stats.topics) {
    userData.stats.topics[topicId].games = 0;
    userData.stats.topics[topicId].correct = 0;
    userData.stats.topics[topicId].wrong = 0;
    userData.stats.topics[topicId].totalQuestionsAnswered = 0;
  }
  
  saveUserData();
  console.log('DEV: Reset exploration stats');
  showDevPanel();
}

// Dev function: Reset screen time
function devResetTimePlayed() {
  if (confirm('Reset total screen time to 0?')) {
    userData.stats.totalTimeSeconds = 0;
    // Also reset topic time
    if (userData.stats?.topics) {
      for (const topicId in userData.stats.topics) {
        userData.stats.topics[topicId].timeSpentSeconds = 0;
      }
    }
    saveUserData();
    console.log('DEV: Reset time played');
    showDevPanel();
  }
}

function devSkipToLevel(targetLevel) {
  const topicData = getTopicXPData('flags');
  // Calculate XP needed for target level
  const xpNeeded = xpNeededForLevel(targetLevel - 1);
  topicData.xp = xpNeeded;
  topicData.level = targetLevel;
  checkModeUnlocks(topicData);
  saveTopicXPData();
  console.log(`DEV: Skipped to level ${targetLevel}`);
  showDevPanel(); // Refresh panel
}

function devSetTimeAttack5Sec() {
  GAME_CONFIG.TIME_ATTACK_DURATION = 5;
  console.log('DEV: Time Attack set to 5 seconds');
  alert('Time Attack now 5 seconds!');
}

function devResetTimeAttack() {
  GAME_CONFIG.TIME_ATTACK_DURATION = 60;
  console.log('DEV: Time Attack reset to 60 seconds');
  alert('Time Attack now 60 seconds!');
}

function devResetAllData() {
  if (confirm('⚠️ This will delete ALL game data. Are you sure?')) {
    localStorage.removeItem('quizzena_user_data');
    localStorage.removeItem('quizzena_my_slots');
    GAME_CONFIG.TIME_ATTACK_DURATION = 60;
    console.log('DEV: All data reset');
    alert('All data reset! Reloading...');
    location.reload();
  }
}

// Set Prestige Level (P-XP)
function devSetPrestigeLevel(level) {
  if (!userData.prestige) {
    userData.prestige = { level: 1, pxp: 0, totalPxp: 0, history: {} };
  }
  
  userData.prestige.level = level;
  userData.prestige.pxp = 0;
  
  // Calculate totalPxp based on level (sum of all previous level requirements)
  let totalRequired = 0;
  for (let i = 1; i < level; i++) {
    totalRequired += 40 * (i * i);
  }
  userData.prestige.totalPxp = totalRequired;
  
  saveUserData();
  updateGlobalLevelBadge();
  
  // Check achievements
  checkAchievements();
  
  console.log(`DEV: Prestige set to Level ${level}`);
  alert(`Prestige Level set to ${level}!`);
  
  // Refresh dev panel
  showDevPanel();
}

// Reset Prestige to Level 1
function devResetPrestige() {
  if (confirm('Reset Prestige Level to 1?')) {
    userData.prestige = {
      level: 1,
      pxp: 0,
      totalPxp: 0,
      history: {}
    };
    
    // Also reset achievements
    userData.achievements = {
      unlocked: [],
      pending: [],
      history: {}
    };
    
    saveUserData();
    updateGlobalLevelBadge();
    
    console.log('DEV: Prestige and Achievements reset');
    alert('Prestige reset to Level 1!');
    
    // Refresh dev panel
    showDevPanel();
  }
}

// Create Dev Panel button on page load
function createDevPanelButton() {
  const devBtn = document.createElement('button');
  devBtn.id = 'dev-panel-btn';
  devBtn.innerHTML = '🛠️';
  devBtn.style.cssText = 'position:fixed;bottom:80px;right:15px;width:50px;height:50px;background:#FF5722;color:#fff;border:none;border-radius:50%;font-size:24px;cursor:pointer;z-index:9998;box-shadow:0 4px 15px rgba(255,87,34,0.4);';
  devBtn.onclick = showDevPanel;
  document.body.appendChild(devBtn);
}

// Initialize dev button when DOM is ready (only when SHOW_DEV_UI is true)
if (SHOW_DEV_UI) {
document.addEventListener('DOMContentLoaded', createDevPanelButton);
console.log('Dev Panel initialized');
}

// ============================================
// 🌍 TRANSLATION SYSTEM (BUNDLED FOR NATIVE APPS)
// ============================================
// Translations are embedded directly (not fetched via HTTP)
// so they work inside Capacitor/Cordova native shells.

const LANGUAGE_DATA = {
  en: {"app_name":"Quizzena","version":"Quizzena v1 Beta","nav_home":"Home","nav_topics":"Topics","nav_stats":"Stats","nav_leaderboard":"Leaderboard","nav_profile":"Profile","nav_social":"Social","home_quiz_of_day":"🏆 QUIZ OF THE DAY","home_play_now":"▶ PLAY NOW","home_explore_categories":"Explore Categories","home_quizzes":"quizzes","home_quiz":"quiz","category_geography":"Geography","category_football":"Football","category_movies":"Movies","category_tvshows":"TV Shows","category_history":"History","category_logos":"Logos","profile_settings":"Settings","profile_stats_quizzes":"Quizzes","profile_stats_wins":"Wins","profile_stats_accuracy":"Accuracy","profile_achievements":"Achievements","profile_progress":"Progress","profile_streaks":"Streaks","profile_quanta":"Quanta","profile_games":"GAMES","profile_time":"TIME","profile_followers":"FOLLOWERS","profile_following":"FOLLOWING","stats_title":"Stats","stats_total_played":"Total Played","stats_total_correct":"Total Correct","stats_accuracy":"Accuracy","stats_best_streak":"Best Streak","stats_most_played":"Most Played","stats_overall_performance":"Overall Performance","stats_total_games_played":"Total Games Played","stats_total_questions_answered":"Total Questions Answered","stats_correct_answers":"Correct Answers","stats_wrong_answers":"Wrong Answers","stats_overall_accuracy":"Overall Accuracy","stats_avg_time_per_question":"Avg Time per Question","stats_best_streak_label":"Best Streak","stats_total_time_played":"Total Time Played","stats_games":"Games","stats_best_label":"Best","stats_search_topic":"Search Topic","stats_search_placeholder":"Type topic name...","stats_search_found":"Found:","stats_search_not_found":"Topic not found","lb_title":"LEADERBOARD","lb_subtitle":"Founders Season · Preparing","lb_founders_title":"Founders Leaderboard","lb_founders_desc":"The first competitive season of Quizzena is being prepared.","lb_status":"STATUS: COLLECTING FOUNDERS DATA","lb_status_helper":"Your activity now will shape the first rankings.","lb_founders_recognition":"Early players gain Founders recognition.","lb_rankings_unlock":"Rankings unlock when Founders Season begins.","lb_what_matters":"WHAT WILL MATTER","lb_games_played":"Games played","lb_accuracy":"Accuracy","lb_streaks":"Streaks","lb_achievements":"Achievements","lb_season_soon":"SEASON STARTING SOON","lb_early_modal":"You're early. Keep playing.","game_score":"Score","game_timer":"Time","game_question":"Question","game_next":"Next","game_correct":"Correct!","game_wrong":"Wrong!","game_lives":"Lives","game_streak":"Streak","result_game_over":"Game Over","result_final_score":"Final Score","result_play_again":"Play Again","result_main_menu":"Main Menu","result_perfect":"Perfect Score!","result_great":"Great Job!","result_good":"Good Effort!","result_try_again":"Keep Practicing!","settings_title":"Settings","settings_language":"Language","settings_theme":"Theme","settings_sound":"Sound","settings_coming_soon":"Coming Soon","settings_close":"Close","settings_performance":"Performance Mode","settings_performance_hint":"Enable for smoother scrolling (disables animations)","settings_tutorial":"Tutorial","sound_music":"Music","sound_effects":"Sound Effects","sound_volume":"Volume","sound_mute":"Mute","sound_unmute":"Unmute","mode_single_player":"Single Player","mode_two_player":"Two Player","mode_time_attack":"Time Attack","mode_quick_game":"Quick Game","mode_three_strikes":"Three Strikes","mode_select_mode":"Select Mode","mode_back":"Back","difficulty_easy":"Easy","difficulty_medium":"Medium","difficulty_hard":"Hard","difficulty_select":"Select Difficulty","common_loading":"Loading...","common_error":"Error","common_retry":"Retry","common_cancel":"Cancel","common_confirm":"Confirm","common_save":"Save","common_reset":"Reset","common_yes":"Yes","common_no":"No","common_ok":"OK","edit_profile":"Edit Profile","edit_profile_picture":"Profile Picture","edit_upload_photo":"Upload Photo","edit_choose_emoji":"Or choose an emoji:","edit_username":"Username","edit_background":"Background Picture","edit_upload_background":"Upload Background","edit_save_changes":"Save Changes","edit_remove":"Remove","setup_save_start":"Save & Start","quanta_title":"✦ Quanta","quanta_description":"Quanta is the knowledge currency of Quizzena. You earn Quanta by playing quizzes, improving accuracy, and unlocking achievements. Quanta will determine access to Founders privileges and future competitive features.","social_coming_soon":"Quizzena Social — Coming Soon","social_subtitle":"A new way to explore quizzes.","social_feed":"Social Feed","achievements_ritual":"Achievements","achievements_subtitle":"The Seven Paths of Mastery","achievements_house_coming":"Achievements for this path are being forged in the cosmic fires. Return soon to claim your destiny.","view_stats_chart":"View Stats Chart","pxp_dashboard":"P-XP Dashboard","pxp_level":"LEVEL","pxp_total_earned":"Total: {0} P-XP earned","pxp_1_day":"1 Day","pxp_1_week":"1 Week","pxp_1_month":"1 Month","pxp_1_year":"1 Year","pxp_all_time":"All Time","pxp_games_each":"Games (+10 each)","pxp_answers_each":"Answers (+1 each)","pxp_achievements":"Achievements","pxp_today_breakdown":"Today's Breakdown","pxp_games_completed":"Games Completed","pxp_correct_answers":"Correct Answers","pxp_achievements_claimed":"Achievements Claimed","pxp_total_earned_label":"Total Earned","stats_overall":"Overall","stats_by_topic":"By Topic","stats_games_label":"GAMES","stats_questions_label":"QUESTIONS","stats_correct_label":"CORRECT","stats_wrong_label":"WRONG","stats_time_label":"TIME","stats_streak_label":"STREAK","stats_no_data":"No data available for this time range","stats_peak":"PEAK","stats_average":"AVERAGE","stats_total":"TOTAL","home_continue_playing":"Continue Playing","home_quick_play":"Quick Play","home_random":"Random","home_slot":"Slot","home_explore":"Explore","topic_add_to_slot":"+ Add to Slot","topic_level":"Level","topic_choose_mode":"CHOOSE GAME MODE","topic_casual":"Casual","topic_questions":"questions","topic_time_attack":"Time Attack","topic_reach_level":"Reach Level {0} to unlock","topic_3_hearts":"3 Hearts","topic_2_players":"2 Players","topic_progress":"Topic Progress","topic_level_arrow":"Level {0} → Level {1}","pxp_today_breakdown":"Today's Breakdown","pxp_week_breakdown":"This Week's Breakdown","pxp_month_breakdown":"This Month's Breakdown","pxp_year_breakdown":"This Year's Breakdown","pxp_breakdown":"Breakdown","pxp_how_it_works":"ℹ️ How P-XP Works","topic_flags":"Flags","topic_capitals":"Capitals","topic_area":"Country Area","topic_football":"Football","topic_premier_league":"Premier League","topic_champions_league":"Champions League","topic_movies":"Movies","topic_marvel":"Marvel","topic_dc":"DC","topic_tv_shows":"TV Shows","topic_got":"Game of Thrones","topic_stranger_things":"Stranger Things","topic_money_heist":"Money Heist","topic_logos":"Logos","topic_world_history":"World History","home_hot_topics":"🔥 Hot Topics","home_ranked_mode":"Enter Ranked Mode","topic_borders":"Borders","topic_world_cup":"World Cup","topic_derbies":"Derbies","topic_messi":"Messi","topic_ronaldo":"Ronaldo","topic_disney":"Disney","topic_harry_potter":"Harry Potter","topic_star_wars":"Star Wars","topic_lotr":"LOTR","topic_sitcoms":"Sitcoms","topic_breaking_bad":"Breaking Bad","topic_the_office":"The Office","topic_wwii":"WWII","topic_wwi":"WWI","topic_roman_empire":"Roman Empire","topic_ottoman":"Ottoman","topic_egyptian":"Egyptian","topic_british_monarchy":"British Monarchy","topic_ancient_civs":"Ancient Civs","topic_cold_war":"Cold War","achievement_progression":"Progression","achievement_skill":"Skill","achievement_exploration":"Exploration","achievement_time_attack":"Time Attack","achievement_survival":"Survival","achievement_casual":"Casual","achievement_behaviour":"Behaviour","house_progression":"Path of Progression","house_skill":"Path of Skill","house_exploration":"Path of Exploration","house_time":"Path of Time Attack","house_survival":"Path of Survival","house_casual":"Path of Casual Mastery","house_behaviour":"Path of Behaviour","house_coming_soon":"Coming Soon","house_progression_subtitle":"Your journey begins, rises, and becomes.","pillar_ascending_levels":"Ascending Levels","pillar_ascending_levels_desc":"Rise through the Prestige ranks","pillar_topic_entry":"Topic Entry Progression","pillar_topic_entry_desc":"Advance within a subject toward deep specialization.","pillar_games_completed":"Games Completed","pillar_games_completed_desc":"Walk the path through relentless play.","pillar_questions_answered":"Total Questions Answered","pillar_questions_answered_desc":"Expand your mind through accumulated knowledge.","pillar_flawed_mind":"The Path of the Flawed Mind","pillar_flawed_mind_desc":"Wisdom shapes itself through misjudgment and correction.","pillar_timeless_devotion":"The Path of Timeless Devotion","pillar_timeless_devotion_desc":"Presence, endurance, and the slow shaping of mastery through time.","ach_tap_to_claim":"TAP TO CLAIM","ach_prestige_level_2_name":"Initiate of Ascent","ach_prestige_level_2_desc":"Reach Level 2","ach_prestige_level_5_name":"Bearer of Steps","ach_prestige_level_5_desc":"Reach Level 5","ach_prestige_level_10_name":"Rising One","ach_prestige_level_10_desc":"Reach Level 10","ach_prestige_level_20_name":"Pathwalker","ach_prestige_level_20_desc":"Reach Level 20","ach_prestige_level_30_name":"Summit Seeker","ach_prestige_level_30_desc":"Reach Level 30","ach_prestige_level_40_name":"Crestbearer","ach_prestige_level_40_desc":"Reach Level 40","ach_prestige_level_50_name":"Pinnacle Reacher","ach_prestige_level_50_desc":"Reach Level 50","ach_prestige_level_75_name":"Peak of Seventy-Five","ach_prestige_level_75_desc":"Reach Level 75","ach_prestige_level_100_name":"Zenith Ascended","ach_prestige_level_100_desc":"Reach Level 100","ach_prestige_level_250_name":"Ascendant of Two Hundred Fifty","ach_prestige_level_250_desc":"Reach Level 250","ach_prestige_level_500_name":"Bearer of Five Hundred Steps","ach_prestige_level_500_desc":"Reach Level 500","ach_prestige_level_1000_name":"Thousandfold Apex","ach_prestige_level_1000_desc":"Reach Level 1000","ach_games_10_name":"First Footfalls","ach_games_10_desc":"Complete 10 games","ach_games_25_name":"Emerging Rhythm","ach_games_25_desc":"Complete 25 games","ach_games_50_name":"Pulse of Persistence","ach_games_50_desc":"Complete 50 games","ach_games_100_name":"Keeper of Momentum","ach_games_100_desc":"Complete 100 games","ach_games_200_name":"Flowbound","ach_games_200_desc":"Complete 200 games","ach_games_500_name":"The Unbroken March","ach_games_500_desc":"Complete 500 games","ach_games_1000_name":"Bearer of Continuance","ach_games_1000_desc":"Complete 1,000 games","ach_games_3000_name":"Spirit of Repetition","ach_games_3000_desc":"Complete 3,000 games","ach_games_5000_name":"Enduring Pulse","ach_games_5000_desc":"Complete 5,000 games","ach_games_10000_name":"Echo of Ten Thousand Steps","ach_games_10000_desc":"Complete 10,000 games","ach_games_50000_name":"Will of the Enduring","ach_games_50000_desc":"Complete 50,000 games","ach_games_100000_name":"Eternal Pathbearer","ach_games_100000_desc":"Complete 100,000 games","ach_questions_100_name":"First Fragments","ach_questions_100_desc":"Answer 100 questions","ach_questions_250_name":"Gatherer of Thoughts","ach_questions_250_desc":"Answer 250 questions","ach_questions_500_name":"Mind in Motion","ach_questions_500_desc":"Answer 500 questions","ach_questions_750_name":"Stirrings of Insight","ach_questions_750_desc":"Answer 750 questions","ach_questions_1000_name":"Weaver of Understanding","ach_questions_1000_desc":"Answer 1,000 questions","ach_questions_1500_name":"Growing Cognition","ach_questions_1500_desc":"Answer 1,500 questions","ach_questions_2000_name":"Emergent Awareness","ach_questions_2000_desc":"Answer 2,000 questions","ach_questions_2500_name":"Keeper of Recall","ach_questions_2500_desc":"Answer 2,500 questions","ach_questions_3500_name":"Seeker of Patterns","ach_questions_3500_desc":"Answer 3,500 questions","ach_questions_5000_name":"Harvester of Truths","ach_questions_5000_desc":"Answer 5,000 questions","ach_questions_7500_name":"Scribe of Memory","ach_questions_7500_desc":"Answer 7,500 questions","ach_questions_10000_name":"Voice of Reason","ach_questions_10000_desc":"Answer 10,000 questions","ach_questions_15000_name":"Silent Scholar","ach_questions_15000_desc":"Answer 15,000 questions","ach_questions_20000_name":"Bearer of Meaning","ach_questions_20000_desc":"Answer 20,000 questions","ach_questions_25000_name":"Architect of Wisdom","ach_questions_25000_desc":"Answer 25,000 questions","ach_questions_30000_name":"Keeper of Countless Questions","ach_questions_30000_desc":"Answer 30,000 questions","ach_questions_40000_name":"The Endless Mind","ach_questions_40000_desc":"Answer 40,000 questions","ach_questions_50000_name":"Truthbound","ach_questions_50000_desc":"Answer 50,000 questions","ach_questions_60000_name":"Crown of Knowing","ach_questions_60000_desc":"Answer 60,000 questions","ach_questions_75000_name":"The Reflective One","ach_questions_75000_desc":"Answer 75,000 questions","ach_questions_100000_name":"Bearer of the Infinite Query","ach_questions_100000_desc":"Answer 100,000 questions","ach_questions_150000_name":"Mind Beyond Measure","ach_questions_150000_desc":"Answer 150,000 questions","ach_questions_200000_name":"Eternal Comprehension","ach_questions_200000_desc":"Answer 200,000 questions","ach_questions_250000_name":"The Thoughtborne Ascendant","ach_questions_250000_desc":"Answer 250,000 questions","ach_questions_500000_name":"The Vastness Within","ach_questions_500000_desc":"Answer 500,000 questions","ach_questions_1000000_name":"Crown of the Million","ach_questions_1000000_desc":"Answer 1,000,000 questions"},
  es: {"app_name":"Quizzena","version":"Quizzena v1 Beta","nav_home":"Inicio","nav_topics":"Temas","nav_stats":"Estadísticas","nav_leaderboard":"Clasificación","nav_profile":"Perfil","nav_social":"Social","home_quiz_of_day":"🏆 QUIZ DEL DÍA","home_play_now":"▶ JUGAR","home_explore_categories":"Explorar Categorías","home_quizzes":"quizzes","home_quiz":"quiz","category_geography":"Geografía","category_football":"Fútbol","category_movies":"Películas","category_tvshows":"Series","category_history":"Historia","category_logos":"Logos","profile_settings":"Ajustes","profile_stats_quizzes":"Quizzes","profile_stats_wins":"Victorias","profile_stats_accuracy":"Precisión","profile_achievements":"Logros","profile_progress":"Progreso","profile_streaks":"Rachas","profile_quanta":"Quanta","profile_games":"PARTIDAS","profile_time":"TIEMPO","profile_followers":"SEGUIDORES","profile_following":"SIGUIENDO","stats_title":"Estadísticas","stats_total_played":"Total Jugados","stats_total_correct":"Total Correctas","stats_accuracy":"Precisión","stats_best_streak":"Mejor Racha","stats_most_played":"Más Jugados","stats_overall_performance":"Rendimiento General","stats_total_games_played":"Total de Partidas Jugadas","stats_total_questions_answered":"Total de Preguntas Respondidas","stats_correct_answers":"Respuestas Correctas","stats_wrong_answers":"Respuestas Incorrectas","stats_overall_accuracy":"Precisión General","stats_avg_time_per_question":"Tiempo Promedio por Pregunta","stats_best_streak_label":"Mejor Racha","stats_total_time_played":"Tiempo Total Jugado","stats_games":"Partidas","stats_best_label":"Mejor","stats_search_topic":"Buscar Tema","stats_search_placeholder":"Escribe el nombre del tema...","stats_search_found":"Encontrado:","stats_search_not_found":"Tema no encontrado","lb_title":"CLASIFICACIÓN","lb_subtitle":"Temporada Fundadores · Preparando","lb_founders_title":"Tabla de Fundadores","lb_founders_desc":"La primera temporada competitiva de Quizzena está siendo preparada.","lb_status":"ESTADO: RECOPILANDO DATOS DE FUNDADORES","lb_status_helper":"Tu actividad ahora dará forma a las primeras clasificaciones.","lb_founders_recognition":"Los jugadores tempranos obtienen reconocimiento de Fundador.","lb_rankings_unlock":"Las clasificaciones se desbloquean cuando comience la Temporada de Fundadores.","lb_what_matters":"QUÉ IMPORTARÁ","lb_games_played":"Partidas jugadas","lb_accuracy":"Precisión","lb_streaks":"Rachas","lb_achievements":"Logros","lb_season_soon":"TEMPORADA PRÓXIMAMENTE","lb_early_modal":"Llegaste temprano. Sigue jugando.","game_score":"Puntuación","game_timer":"Tiempo","game_question":"Pregunta","game_next":"Siguiente","game_correct":"¡Correcto!","game_wrong":"¡Incorrecto!","game_lives":"Vidas","game_streak":"Racha","result_game_over":"Fin del Juego","result_final_score":"Puntuación Final","result_play_again":"Jugar de Nuevo","result_main_menu":"Menú Principal","result_perfect":"¡Puntuación Perfecta!","result_great":"¡Excelente!","result_good":"¡Buen Trabajo!","result_try_again":"¡Sigue Practicando!","settings_title":"Ajustes","settings_language":"Idioma","settings_theme":"Tema","settings_sound":"Sonido","settings_coming_soon":"Próximamente","settings_close":"Cerrar","settings_performance":"Modo Rendimiento","settings_performance_hint":"Activa para un desplazamiento más fluido (desactiva animaciones)","settings_tutorial":"Tutorial","sound_music":"Música","sound_effects":"Efectos de Sonido","sound_volume":"Volumen","sound_mute":"Silenciar","sound_unmute":"Activar Sonido","mode_single_player":"Un Jugador","mode_two_player":"Dos Jugadores","mode_time_attack":"Contrarreloj","mode_quick_game":"Partida Rápida","mode_three_strikes":"Tres Strikes","mode_select_mode":"Seleccionar Modo","mode_back":"Atrás","difficulty_easy":"Fácil","difficulty_medium":"Medio","difficulty_hard":"Difícil","difficulty_select":"Seleccionar Dificultad","common_loading":"Cargando...","common_error":"Error","common_retry":"Reintentar","common_cancel":"Cancelar","common_confirm":"Confirmar","common_save":"Guardar","common_reset":"Restablecer","common_yes":"Sí","common_no":"No","common_ok":"OK","edit_profile":"Editar Perfil","edit_profile_picture":"Foto de Perfil","edit_upload_photo":"Subir Foto","edit_choose_emoji":"O elige un emoji:","edit_username":"Nombre de usuario","edit_background":"Imagen de Fondo","edit_upload_background":"Subir Fondo","edit_save_changes":"Guardar Cambios","edit_remove":"Eliminar","setup_save_start":"Guardar e Iniciar","quanta_title":"✦ Quanta","quanta_description":"Quanta es la moneda del conocimiento de Quizzena. Ganas Quanta jugando quizzes, mejorando tu precisión y desbloqueando logros. Quanta determinará el acceso a privilegios de Fundadores y futuras funciones competitivas.","social_coming_soon":"Quizzena Social — Próximamente","social_subtitle":"Una nueva forma de explorar quizzes.","social_feed":"Feed Social","achievements_ritual":"Logros","achievements_subtitle":"Los Ocho Caminos de la Maestría","achievements_house_coming":"Los logros de este camino se están forjando en los fuegos cósmicos. Regresa pronto para reclamar tu destino.","view_stats_chart":"Ver Gráfico de Estadísticas","pxp_dashboard":"Panel de P-XP","pxp_level":"NIVEL","pxp_total_earned":"Total: {0} P-XP ganado","pxp_1_day":"1 Día","pxp_1_week":"1 Semana","pxp_1_month":"1 Mes","pxp_1_year":"1 Año","pxp_all_time":"Todo el Tiempo","pxp_games_each":"Partidas (+10 c/u)","pxp_answers_each":"Respuestas (+1 c/u)","pxp_achievements":"Logros","pxp_today_breakdown":"Desglose de Hoy","pxp_games_completed":"Partidas Completadas","pxp_correct_answers":"Respuestas Correctas","pxp_achievements_claimed":"Logros Reclamados","pxp_total_earned_label":"Total Ganado","stats_overall":"General","stats_by_topic":"Por Tema","stats_games_label":"PARTIDAS","stats_questions_label":"PREGUNTAS","stats_correct_label":"CORRECTAS","stats_wrong_label":"INCORRECTAS","stats_time_label":"TIEMPO","stats_streak_label":"RACHA","stats_no_data":"No hay datos para este período","stats_peak":"MÁXIMO","stats_average":"PROMEDIO","stats_total":"TOTAL","home_continue_playing":"Continuar Jugando","home_quick_play":"Juego Rápido","home_random":"Aleatorio","home_slot":"Espacio","home_explore":"Explorar","topic_add_to_slot":"+ Agregar a Espacio","topic_level":"Nivel","topic_choose_mode":"ELIGE MODO DE JUEGO","topic_casual":"Casual","topic_questions":"preguntas","topic_time_attack":"Contrarreloj","topic_reach_level":"Alcanza Nivel {0} para desbloquear","topic_3_hearts":"3 Corazones","topic_2_players":"2 Jugadores","topic_progress":"Progreso de Temas","topic_level_arrow":"Nivel {0} → Nivel {1}","pxp_today_breakdown":"Desglose de Hoy","pxp_week_breakdown":"Desglose de Esta Semana","pxp_month_breakdown":"Desglose de Este Mes","pxp_year_breakdown":"Desglose de Este Año","pxp_breakdown":"Desglose","pxp_how_it_works":"ℹ️ Cómo Funciona P-XP","topic_flags":"Banderas","topic_capitals":"Capitales","topic_area":"Área de Países","topic_football":"Fútbol","topic_premier_league":"Premier League","topic_champions_league":"Champions League","topic_movies":"Películas","topic_marvel":"Marvel","topic_dc":"DC","topic_tv_shows":"Series","topic_got":"Juego de Tronos","topic_stranger_things":"Stranger Things","topic_money_heist":"La Casa de Papel","topic_logos":"Logos","topic_world_history":"Historia Mundial","home_hot_topics":"🔥 Temas Populares","home_ranked_mode":"Entrar Modo Clasificatorio","topic_borders":"Fronteras","topic_world_cup":"Copa del Mundo","topic_derbies":"Derbis","topic_messi":"Messi","topic_ronaldo":"Ronaldo","topic_disney":"Disney","topic_harry_potter":"Harry Potter","topic_star_wars":"Star Wars","topic_lotr":"El Señor de los Anillos","topic_sitcoms":"Comedias","topic_breaking_bad":"Breaking Bad","topic_the_office":"The Office","topic_wwii":"Segunda Guerra Mundial","topic_wwi":"Primera Guerra Mundial","topic_roman_empire":"Imperio Romano","topic_ottoman":"Imperio Otomano","topic_egyptian":"Egipto Antiguo","topic_british_monarchy":"Monarquía Británica","topic_ancient_civs":"Civilizaciones Antiguas","topic_cold_war":"Guerra Fría","achievement_progression":"Progresión","achievement_skill":"Habilidad","achievement_exploration":"Exploración","achievement_time_attack":"Contrarreloj","achievement_survival":"Supervivencia","achievement_casual":"Casual","achievement_behaviour":"Comportamiento","house_progression":"Camino de Progresión","house_skill":"Camino de Habilidad","house_exploration":"Camino de Exploración","house_time":"Camino Contrarreloj","house_survival":"Camino de Supervivencia","house_casual":"Camino del Maestro Casual","house_behaviour":"Camino del Comportamiento","house_coming_soon":"Próximamente","house_progression_subtitle":"Tu viaje comienza, asciende y se transforma.","pillar_ascending_levels":"Niveles Ascendentes","pillar_ascending_levels_desc":"Asciende a través de los rangos de Prestigio","pillar_topic_entry":"Progresión de Temas","pillar_topic_entry_desc":"Avanza en un tema hacia la especialización profunda.","pillar_games_completed":"Partidas Completadas","pillar_games_completed_desc":"Camina el sendero a través del juego constante.","pillar_questions_answered":"Total de Preguntas Respondidas","pillar_questions_answered_desc":"Expande tu mente a través del conocimiento acumulado.","pillar_flawed_mind":"El Camino de la Mente Imperfecta","pillar_flawed_mind_desc":"La sabiduría se forma a través del error y la corrección.","pillar_timeless_devotion":"El Camino de la Devoción Eterna","pillar_timeless_devotion_desc":"Presencia, resistencia y la formación lenta de la maestría a través del tiempo.","ach_tap_to_claim":"TOCA PARA RECLAMAR","ach_prestige_level_2_name":"Iniciado del Ascenso","ach_prestige_level_2_desc":"Alcanza el Nivel 2","ach_prestige_level_5_name":"Portador de Pasos","ach_prestige_level_5_desc":"Alcanza el Nivel 5","ach_prestige_level_10_name":"El Ascendente","ach_prestige_level_10_desc":"Alcanza el Nivel 10","ach_prestige_level_20_name":"Caminante del Sendero","ach_prestige_level_20_desc":"Alcanza el Nivel 20","ach_prestige_level_30_name":"Buscador de Cumbres","ach_prestige_level_30_desc":"Alcanza el Nivel 30","ach_prestige_level_40_name":"Portador de la Cresta","ach_prestige_level_40_desc":"Alcanza el Nivel 40","ach_prestige_level_50_name":"Alcanzador del Pináculo","ach_prestige_level_50_desc":"Alcanza el Nivel 50","ach_prestige_level_75_name":"Cumbre de los Setenta y Cinco","ach_prestige_level_75_desc":"Alcanza el Nivel 75","ach_prestige_level_100_name":"Cénit Ascendido","ach_prestige_level_100_desc":"Alcanza el Nivel 100","ach_prestige_level_250_name":"Ascendente de Doscientos Cincuenta","ach_prestige_level_250_desc":"Alcanza el Nivel 250","ach_prestige_level_500_name":"Portador de Quinientos Pasos","ach_prestige_level_500_desc":"Alcanza el Nivel 500","ach_prestige_level_1000_name":"Ápice de los Mil","ach_prestige_level_1000_desc":"Alcanza el Nivel 1000","ach_games_10_name":"Primeros Pasos","ach_games_10_desc":"Completa 10 partidas","ach_games_25_name":"Ritmo Emergente","ach_games_25_desc":"Completa 25 partidas","ach_games_50_name":"Pulso de Persistencia","ach_games_50_desc":"Completa 50 partidas","ach_games_100_name":"Guardián del Impulso","ach_games_100_desc":"Completa 100 partidas","ach_games_200_name":"Flujo Constante","ach_games_200_desc":"Completa 200 partidas","ach_games_500_name":"La Marcha Inquebrantable","ach_games_500_desc":"Completa 500 partidas","ach_games_1000_name":"Portador de la Continuidad","ach_games_1000_desc":"Completa 1.000 partidas","ach_games_3000_name":"Espíritu de Repetición","ach_games_3000_desc":"Completa 3.000 partidas","ach_games_5000_name":"Pulso Duradero","ach_games_5000_desc":"Completa 5.000 partidas","ach_games_10000_name":"Eco de Diez Mil Pasos","ach_games_10000_desc":"Completa 10.000 partidas","ach_games_50000_name":"Voluntad del Perseverante","ach_games_50000_desc":"Completa 50.000 partidas","ach_games_100000_name":"Portador Eterno del Camino","ach_games_100000_desc":"Completa 100.000 partidas","ach_questions_100_name":"Primeros Fragmentos","ach_questions_100_desc":"Responde 100 preguntas","ach_questions_250_name":"Recolector de Pensamientos","ach_questions_250_desc":"Responde 250 preguntas","ach_questions_500_name":"Mente en Movimiento","ach_questions_500_desc":"Responde 500 preguntas","ach_questions_750_name":"Destellos de Perspicacia","ach_questions_750_desc":"Responde 750 preguntas","ach_questions_1000_name":"Tejedor del Entendimiento","ach_questions_1000_desc":"Responde 1.000 preguntas","ach_questions_1500_name":"Cognición Creciente","ach_questions_1500_desc":"Responde 1.500 preguntas","ach_questions_2000_name":"Conciencia Emergente","ach_questions_2000_desc":"Responde 2.000 preguntas","ach_questions_2500_name":"Guardián del Recuerdo","ach_questions_2500_desc":"Responde 2.500 preguntas","ach_questions_3500_name":"Buscador de Patrones","ach_questions_3500_desc":"Responde 3.500 preguntas","ach_questions_5000_name":"Cosechador de Verdades","ach_questions_5000_desc":"Responde 5.000 preguntas","ach_questions_7500_name":"Escriba de la Memoria","ach_questions_7500_desc":"Responde 7.500 preguntas","ach_questions_10000_name":"Voz de la Razón","ach_questions_10000_desc":"Responde 10.000 preguntas","ach_questions_15000_name":"Erudito Silencioso","ach_questions_15000_desc":"Responde 15.000 preguntas","ach_questions_20000_name":"Portador del Significado","ach_questions_20000_desc":"Responde 20.000 preguntas","ach_questions_25000_name":"Arquitecto de la Sabiduría","ach_questions_25000_desc":"Responde 25.000 preguntas","ach_questions_30000_name":"Guardián de Innumerables Preguntas","ach_questions_30000_desc":"Responde 30.000 preguntas","ach_questions_40000_name":"La Mente Infinita","ach_questions_40000_desc":"Responde 40.000 preguntas","ach_questions_50000_name":"Atado a la Verdad","ach_questions_50000_desc":"Responde 50.000 preguntas","ach_questions_60000_name":"Corona del Conocimiento","ach_questions_60000_desc":"Responde 60.000 preguntas","ach_questions_75000_name":"El Reflexivo","ach_questions_75000_desc":"Responde 75.000 preguntas","ach_questions_100000_name":"Portador de la Consulta Infinita","ach_questions_100000_desc":"Responde 100.000 preguntas","ach_questions_150000_name":"Mente Sin Límites","ach_questions_150000_desc":"Responde 150.000 preguntas","ach_questions_200000_name":"Comprensión Eterna","ach_questions_200000_desc":"Responde 200.000 preguntas","ach_questions_250000_name":"El Ascendiente del Pensamiento","ach_questions_250000_desc":"Responde 250.000 preguntas","ach_questions_500000_name":"La Vastedad Interior","ach_questions_500000_desc":"Responde 500.000 preguntas","ach_questions_1000000_name":"Corona del Millón","ach_questions_1000000_desc":"Responde 1.000.000 preguntas"},
  ru: {"app_name":"Quizzena","version":"Quizzena v1 Бета","nav_home":"Главная","nav_topics":"Темы","nav_stats":"Статистика","nav_leaderboard":"Рейтинг","nav_profile":"Профиль","nav_social":"Лента","home_quiz_of_day":"🏆 ВИКТОРИНА ДНЯ","home_play_now":"▶ ИГРАТЬ","home_explore_categories":"Категории","home_quizzes":"викторин","home_quiz":"викторина","category_geography":"География","category_football":"Футбол","category_movies":"Фильмы","category_tvshows":"Сериалы","category_history":"История","category_logos":"Логотипы","profile_settings":"Настройки","profile_stats_quizzes":"Викторины","profile_stats_wins":"Победы","profile_stats_accuracy":"Точность","profile_achievements":"Достижения","profile_progress":"Прогресс","profile_streaks":"Серии","profile_quanta":"Quanta","profile_games":"ИГРЫ","profile_time":"ВРЕМЯ","profile_followers":"ПОДПИСЧИКИ","profile_following":"ПОДПИСКИ","stats_title":"Статистика","stats_total_played":"Всего сыграно","stats_total_correct":"Правильных ответов","stats_accuracy":"Точность","stats_best_streak":"Лучшая серия","stats_most_played":"Часто играемые","stats_overall_performance":"Общая статистика","stats_total_games_played":"Всего игр","stats_total_questions_answered":"Всего вопросов","stats_correct_answers":"Правильные ответы","stats_wrong_answers":"Неправильные ответы","stats_overall_accuracy":"Общая точность","stats_avg_time_per_question":"Среднее время на вопрос","stats_best_streak_label":"Лучшая серия","stats_total_time_played":"Общее время игры","stats_games":"Игры","stats_best_label":"Лучший","stats_search_topic":"Поиск темы","stats_search_placeholder":"Введите название темы...","stats_search_found":"Найдено:","stats_search_not_found":"Тема не найдена","lb_title":"РЕЙТИНГ","lb_subtitle":"Сезон Основателей · Подготовка","lb_founders_title":"Рейтинг Основателей","lb_founders_desc":"Первый соревновательный сезон Quizzena готовится.","lb_status":"СТАТУС: СБОР ДАННЫХ ОСНОВАТЕЛЕЙ","lb_status_helper":"Ваша активность сейчас определит первые рейтинги.","lb_founders_recognition":"Ранние игроки получат признание Основателей.","lb_rankings_unlock":"Рейтинги откроются с началом Сезона Основателей.","lb_what_matters":"ЧТО БУДЕТ ВАЖНО","lb_games_played":"Игры сыграны","lb_accuracy":"Точность","lb_streaks":"Серии","lb_achievements":"Достижения","lb_season_soon":"СЕЗОН СКОРО НАЧНЁТСЯ","lb_early_modal":"Вы рано. Продолжайте играть.","game_score":"Счёт","game_timer":"Время","game_question":"Вопрос","game_next":"Далее","game_correct":"Правильно!","game_wrong":"Неправильно!","game_lives":"Жизни","game_streak":"Серия","result_game_over":"Игра окончена","result_final_score":"Итоговый счёт","result_play_again":"Играть снова","result_main_menu":"Главное меню","result_perfect":"Идеальный результат!","result_great":"Отлично!","result_good":"Хорошо!","result_try_again":"Продолжай практиковаться!","settings_title":"Настройки","settings_language":"Язык","settings_theme":"Тема","settings_sound":"Звук","settings_coming_soon":"Скоро","settings_close":"Закрыть","settings_performance":"Режим производительности","settings_performance_hint":"Включите для плавной прокрутки (отключает анимации)","settings_tutorial":"Обучение","sound_music":"Музыка","sound_effects":"Звуковые эффекты","sound_volume":"Громкость","sound_mute":"Выключить звук","sound_unmute":"Включить звук","mode_single_player":"Один игрок","mode_two_player":"Два игрока","mode_time_attack":"На время","mode_quick_game":"Быстрая игра","mode_three_strikes":"Три ошибки","mode_select_mode":"Выберите режим","mode_back":"Назад","difficulty_easy":"Легко","difficulty_medium":"Средне","difficulty_hard":"Сложно","difficulty_select":"Выберите сложность","common_loading":"Загрузка...","common_error":"Ошибка","common_retry":"Повторить","common_cancel":"Отмена","common_confirm":"Подтвердить","common_save":"Сохранить","common_reset":"Сбросить","common_yes":"Да","common_no":"Нет","common_ok":"ОК","edit_profile":"Редактировать профиль","edit_profile_picture":"Фото профиля","edit_upload_photo":"Загрузить фото","edit_choose_emoji":"Или выберите эмодзи:","edit_username":"Имя пользователя","edit_background":"Фон профиля","edit_upload_background":"Загрузить фон","edit_save_changes":"Сохранить изменения","edit_remove":"Удалить","setup_save_start":"Сохранить и начать","quanta_title":"✦ Quanta","quanta_description":"Quanta — это валюта знаний Quizzena. Вы зарабатываете Quanta, играя в викторины, улучшая точность и открывая достижения. Quanta определит доступ к привилегиям Основателей и будущим соревновательным функциям.","social_coming_soon":"Quizzena Лента — Скоро","social_subtitle":"Новый способ исследовать викторины.","social_feed":"Лента","achievements_ritual":"Достижения","achievements_subtitle":"Семь путей мастерства","achievements_house_coming":"Достижения этого пути куются в космическом огне. Возвращайтесь скоро, чтобы получить свою судьбу.","view_stats_chart":"Посмотреть график статистики","pxp_dashboard":"Панель P-XP","pxp_level":"УРОВЕНЬ","pxp_total_earned":"Всего: {0} P-XP заработано","pxp_1_day":"1 День","pxp_1_week":"1 Неделя","pxp_1_month":"1 Месяц","pxp_1_year":"1 Год","pxp_all_time":"Всё Время","pxp_games_each":"Игры (+10 каждая)","pxp_answers_each":"Ответы (+1 каждый)","pxp_achievements":"Достижения","pxp_today_breakdown":"Сегодняшняя Разбивка","pxp_games_completed":"Игр Завершено","pxp_correct_answers":"Правильных Ответов","pxp_achievements_claimed":"Достижений Получено","pxp_total_earned_label":"Всего Заработано","stats_overall":"Общее","stats_by_topic":"По Темам","stats_games_label":"ИГРЫ","stats_questions_label":"ВОПРОСЫ","stats_correct_label":"ВЕРНО","stats_wrong_label":"НЕВЕРНО","stats_time_label":"ВРЕМЯ","stats_streak_label":"СЕРИЯ","stats_no_data":"Нет данных за этот период","stats_peak":"МАКС","stats_average":"СРЕДНЕЕ","stats_total":"ВСЕГО","home_continue_playing":"Продолжить Игру","home_quick_play":"Быстрая Игра","home_random":"Случайно","home_slot":"Слот","home_explore":"Обзор","topic_add_to_slot":"+ Добавить в слот","topic_level":"Уровень","topic_choose_mode":"ВЫБЕРИТЕ РЕЖИМ ИГРЫ","topic_casual":"Обычный","topic_questions":"вопросов","topic_time_attack":"На Время","topic_reach_level":"Достигните Уровня {0}","topic_3_hearts":"3 Сердца","topic_2_players":"2 Игрока","topic_progress":"Прогресс Тем","topic_level_arrow":"Уровень {0} → Уровень {1}","pxp_today_breakdown":"Разбивка за Сегодня","pxp_week_breakdown":"Разбивка за Неделю","pxp_month_breakdown":"Разбивка за Месяц","pxp_year_breakdown":"Разбивка за Год","pxp_breakdown":"Разбивка","pxp_how_it_works":"ℹ️ Как работает P-XP","topic_flags":"Флаги","topic_capitals":"Столицы","topic_area":"Площадь Стран","topic_football":"Футбол","topic_premier_league":"Премьер-Лига","topic_champions_league":"Лига Чемпионов","topic_movies":"Фильмы","topic_marvel":"Marvel","topic_dc":"DC","topic_tv_shows":"Сериалы","topic_got":"Игра Престолов","topic_stranger_things":"Очень Странные Дела","topic_money_heist":"Бумажный Дом","topic_logos":"Логотипы","topic_world_history":"Мировая История","home_hot_topics":"🔥 Популярные Темы","home_ranked_mode":"Рейтинговый Режим","topic_borders":"Границы","topic_world_cup":"Чемпионат Мира","topic_derbies":"Дерби","topic_messi":"Месси","topic_ronaldo":"Роналду","topic_disney":"Дисней","topic_harry_potter":"Гарри Поттер","topic_star_wars":"Звёздные Войны","topic_lotr":"Властелин Колец","topic_sitcoms":"Ситкомы","topic_breaking_bad":"Во Все Тяжкие","topic_the_office":"Офис","topic_wwii":"Вторая Мировая","topic_wwi":"Первая Мировая","topic_roman_empire":"Римская Империя","topic_ottoman":"Османская Империя","topic_egyptian":"Древний Египет","topic_british_monarchy":"Британская Монархия","topic_ancient_civs":"Древние Цивилизации","topic_cold_war":"Холодная Война","achievement_progression":"Прогресс","achievement_skill":"Мастерство","achievement_exploration":"Исследование","achievement_time_attack":"На Время","achievement_survival":"Выживание","achievement_casual":"Обычный","achievement_behaviour":"Поведение","house_progression":"Путь Прогресса","house_skill":"Путь Мастерства","house_exploration":"Путь Исследования","house_time":"Путь На Время","house_survival":"Путь Выживания","house_casual":"Путь Обычного Мастера","house_behaviour":"Путь Поведения","house_coming_soon":"Скоро","house_progression_subtitle":"Твой путь начинается, восходит и преображается.","pillar_ascending_levels":"Восхождение по Уровням","pillar_ascending_levels_desc":"Поднимайся по рангам Престижа","pillar_topic_entry":"Прогресс по Темам","pillar_topic_entry_desc":"Продвигайся в теме к глубокой специализации.","pillar_games_completed":"Завершённые Игры","pillar_games_completed_desc":"Иди по пути неустанной игры.","pillar_questions_answered":"Всего Ответов на Вопросы","pillar_questions_answered_desc":"Расширяй свой разум через накопленные знания.","pillar_flawed_mind":"Путь Несовершенного Разума","pillar_flawed_mind_desc":"Мудрость формируется через ошибки и исправления.","pillar_timeless_devotion":"Путь Вечной Преданности","pillar_timeless_devotion_desc":"Присутствие, выносливость и медленное формирование мастерства через время.","ach_tap_to_claim":"НАЖМИ ЧТОБЫ ПОЛУЧИТЬ","ach_prestige_level_2_name":"Посвящённый Восхождения","ach_prestige_level_2_desc":"Достигни 2 Уровня","ach_prestige_level_5_name":"Носитель Шагов","ach_prestige_level_5_desc":"Достигни 5 Уровня","ach_prestige_level_10_name":"Восходящий","ach_prestige_level_10_desc":"Достигни 10 Уровня","ach_prestige_level_20_name":"Путник","ach_prestige_level_20_desc":"Достигни 20 Уровня","ach_prestige_level_30_name":"Искатель Вершин","ach_prestige_level_30_desc":"Достигни 30 Уровня","ach_prestige_level_40_name":"Носитель Гребня","ach_prestige_level_40_desc":"Достигни 40 Уровня","ach_prestige_level_50_name":"Достигший Вершины","ach_prestige_level_50_desc":"Достигни 50 Уровня","ach_prestige_level_75_name":"Пик Семидесяти Пяти","ach_prestige_level_75_desc":"Достигни 75 Уровня","ach_prestige_level_100_name":"Зенит Вознесённый","ach_prestige_level_100_desc":"Достигни 100 Уровня","ach_prestige_level_250_name":"Вознесённый Двухсот Пятидесяти","ach_prestige_level_250_desc":"Достигни 250 Уровня","ach_prestige_level_500_name":"Носитель Пятисот Шагов","ach_prestige_level_500_desc":"Достигни 500 Уровня","ach_prestige_level_1000_name":"Тысячекратный Апекс","ach_prestige_level_1000_desc":"Достигни 1000 Уровня","ach_games_10_name":"Первые Шаги","ach_games_10_desc":"Заверши 10 игр","ach_games_25_name":"Зарождающийся Ритм","ach_games_25_desc":"Заверши 25 игр","ach_games_50_name":"Пульс Настойчивости","ach_games_50_desc":"Заверши 50 игр","ach_games_100_name":"Хранитель Импульса","ach_games_100_desc":"Заверши 100 игр","ach_games_200_name":"Связанный Потоком","ach_games_200_desc":"Заверши 200 игр","ach_games_500_name":"Несломленный Марш","ach_games_500_desc":"Заверши 500 игр","ach_games_1000_name":"Носитель Продолжения","ach_games_1000_desc":"Заверши 1000 игр","ach_games_3000_name":"Дух Повторения","ach_games_3000_desc":"Заверши 3000 игр","ach_games_5000_name":"Стойкий Пульс","ach_games_5000_desc":"Заверши 5000 игр","ach_games_10000_name":"Эхо Десяти Тысяч Шагов","ach_games_10000_desc":"Заверши 10000 игр","ach_games_50000_name":"Воля Стойкого","ach_games_50000_desc":"Заверши 50000 игр","ach_games_100000_name":"Вечный Путеносец","ach_games_100000_desc":"Заверши 100000 игр","ach_questions_100_name":"Первые Фрагменты","ach_questions_100_desc":"Ответь на 100 вопросов","ach_questions_250_name":"Собиратель Мыслей","ach_questions_250_desc":"Ответь на 250 вопросов","ach_questions_500_name":"Разум в Движении","ach_questions_500_desc":"Ответь на 500 вопросов","ach_questions_750_name":"Проблески Озарения","ach_questions_750_desc":"Ответь на 750 вопросов","ach_questions_1000_name":"Ткач Понимания","ach_questions_1000_desc":"Ответь на 1000 вопросов","ach_questions_1500_name":"Растущее Познание","ach_questions_1500_desc":"Ответь на 1500 вопросов","ach_questions_2000_name":"Пробуждающееся Осознание","ach_questions_2000_desc":"Ответь на 2000 вопросов","ach_questions_2500_name":"Хранитель Памяти","ach_questions_2500_desc":"Ответь на 2500 вопросов","ach_questions_3500_name":"Искатель Закономерностей","ach_questions_3500_desc":"Ответь на 3500 вопросов","ach_questions_5000_name":"Жнец Истин","ach_questions_5000_desc":"Ответь на 5000 вопросов","ach_questions_7500_name":"Писец Памяти","ach_questions_7500_desc":"Ответь на 7500 вопросов","ach_questions_10000_name":"Голос Разума","ach_questions_10000_desc":"Ответь на 10000 вопросов","ach_questions_15000_name":"Тихий Учёный","ach_questions_15000_desc":"Ответь на 15000 вопросов","ach_questions_20000_name":"Носитель Смысла","ach_questions_20000_desc":"Ответь на 20000 вопросов","ach_questions_25000_name":"Архитектор Мудрости","ach_questions_25000_desc":"Ответь на 25000 вопросов","ach_questions_30000_name":"Хранитель Бесчисленных Вопросов","ach_questions_30000_desc":"Ответь на 30000 вопросов","ach_questions_40000_name":"Бесконечный Разум","ach_questions_40000_desc":"Ответь на 40000 вопросов","ach_questions_50000_name":"Связанный Истиной","ach_questions_50000_desc":"Ответь на 50000 вопросов","ach_questions_60000_name":"Корона Познания","ach_questions_60000_desc":"Ответь на 60000 вопросов","ach_questions_75000_name":"Размышляющий","ach_questions_75000_desc":"Ответь на 75000 вопросов","ach_questions_100000_name":"Носитель Бесконечного Запроса","ach_questions_100000_desc":"Ответь на 100000 вопросов","ach_questions_150000_name":"Разум За Пределами Меры","ach_questions_150000_desc":"Ответь на 150000 вопросов","ach_questions_200000_name":"Вечное Понимание","ach_questions_200000_desc":"Ответь на 200000 вопросов","ach_questions_250000_name":"Вознесённый Мысли","ach_questions_250000_desc":"Ответь на 250000 вопросов","ach_questions_500000_name":"Бескрайность Внутри","ach_questions_500000_desc":"Ответь на 500000 вопросов","ach_questions_1000000_name":"Корона Миллиона","ach_questions_1000000_desc":"Ответь на 1000000 вопросов"},
  tr: {"app_name":"Quizzena","version":"Quizzena v1 Beta","nav_home":"Ana Sayfa","nav_topics":"Konular","nav_stats":"İstatistikler","nav_leaderboard":"Sıralama","nav_profile":"Profil","nav_social":"Sosyal","home_quiz_of_day":"🏆 GÜNÜN BİLMECESİ","home_play_now":"▶ OYNA","home_explore_categories":"Kategorileri Keşfet","home_quizzes":"bilmece","home_quiz":"bilmece","category_geography":"Coğrafya","category_football":"Futbol","category_movies":"Filmler","category_tvshows":"Diziler","category_history":"Tarih","category_logos":"Logolar","profile_settings":"Ayarlar","profile_stats_quizzes":"Bilmeceler","profile_stats_wins":"Kazanımlar","profile_stats_accuracy":"Doğruluk","profile_achievements":"Başarılar","profile_progress":"İlerleme","profile_streaks":"Seriler","profile_quanta":"Quanta","profile_games":"OYUNLAR","profile_time":"SÜRE","profile_followers":"TAKİPÇİLER","profile_following":"TAKİP","stats_title":"İstatistikler","stats_total_played":"Toplam Oynanan","stats_total_correct":"Toplam Doğru","stats_accuracy":"Doğruluk","stats_best_streak":"En İyi Seri","stats_most_played":"En Çok Oynanan","stats_overall_performance":"Genel Performans","stats_total_games_played":"Toplam Oynanan Oyun","stats_total_questions_answered":"Toplam Yanıtlanan Soru","stats_correct_answers":"Doğru Cevaplar","stats_wrong_answers":"Yanlış Cevaplar","stats_overall_accuracy":"Genel Doğruluk","stats_avg_time_per_question":"Soru Başına Ortalama Süre","stats_best_streak_label":"En İyi Seri","stats_total_time_played":"Toplam Oynama Süresi","stats_games":"Oyunlar","stats_best_label":"En İyi","stats_search_topic":"Konu Ara","stats_search_placeholder":"Konu adını yaz...","stats_search_found":"Bulundu:","stats_search_not_found":"Konu bulunamadı","lb_title":"SIRALAMA","lb_subtitle":"Kurucu Sezonu · Hazırlanıyor","lb_founders_title":"Kurucu Sıralaması","lb_founders_desc":"Quizzena'nın ilk rekabetçi sezonu hazırlanıyor.","lb_status":"DURUM: KURUCU VERİLERİ TOPLANIYOR","lb_status_helper":"Şu anki aktiviteniz ilk sıralamaları şekillendirecek.","lb_founders_recognition":"Erken oyuncular Kurucu tanınırlığı kazanır.","lb_rankings_unlock":"Sıralamalar Kurucu Sezonu başladığında açılır.","lb_what_matters":"NE ÖNEMLİ OLACAK","lb_games_played":"Oynanan oyunlar","lb_accuracy":"Doğruluk","lb_streaks":"Seriler","lb_achievements":"Başarılar","lb_season_soon":"SEZON YAKINDA BAŞLIYOR","lb_early_modal":"Erken geldiniz. Oynamaya devam edin.","game_score":"Puan","game_timer":"Süre","game_question":"Soru","game_next":"Sonraki","game_correct":"Doğru!","game_wrong":"Yanlış!","game_lives":"Can","game_streak":"Seri","result_game_over":"Oyun Bitti","result_final_score":"Final Puanı","result_play_again":"Tekrar Oyna","result_main_menu":"Ana Menü","result_perfect":"Mükemmel Skor!","result_great":"Harika!","result_good":"İyi İş!","result_try_again":"Pratik Yapmaya Devam Et!","settings_title":"Ayarlar","settings_language":"Dil","settings_theme":"Tema","settings_sound":"Ses","settings_coming_soon":"Yakında","settings_close":"Kapat","settings_performance":"Performans Modu","settings_performance_hint":"Daha akıcı kaydırma için etkinleştir (animasyonları kapatır)","settings_tutorial":"Eğitim","sound_music":"Müzik","sound_effects":"Ses Efektleri","sound_volume":"Ses Seviyesi","sound_mute":"Sessiz","sound_unmute":"Sesi Aç","mode_single_player":"Tek Oyuncu","mode_two_player":"İki Oyuncu","mode_time_attack":"Zamana Karşı","mode_quick_game":"Hızlı Oyun","mode_three_strikes":"Üç Hak","mode_select_mode":"Mod Seç","mode_back":"Geri","difficulty_easy":"Kolay","difficulty_medium":"Orta","difficulty_hard":"Zor","difficulty_select":"Zorluk Seç","common_loading":"Yükleniyor...","common_error":"Hata","common_retry":"Tekrar Dene","common_cancel":"İptal","common_confirm":"Onayla","common_save":"Kaydet","common_reset":"Sıfırla","common_yes":"Evet","common_no":"Hayır","common_ok":"Tamam","edit_profile":"Profili Düzenle","edit_profile_picture":"Profil Fotoğrafı","edit_upload_photo":"Fotoğraf Yükle","edit_choose_emoji":"Veya bir emoji seç:","edit_username":"Kullanıcı Adı","edit_background":"Arka Plan Resmi","edit_upload_background":"Arka Plan Yükle","edit_save_changes":"Değişiklikleri Kaydet","edit_remove":"Kaldır","setup_save_start":"Kaydet ve Başla","quanta_title":"✦ Quanta","quanta_description":"Quanta, Quizzena'nın bilgi para birimidir. Bilmece oynayarak, doğruluğunuzu artırarak ve başarıları açarak Quanta kazanırsınız. Quanta, Kurucu ayrıcalıklarına ve gelecekteki rekabetçi özelliklere erişimi belirleyecektir.","social_coming_soon":"Quizzena Sosyal — Yakında","social_subtitle":"Bilmeceleri keşfetmenin yeni bir yolu.","social_feed":"Sosyal Akış","achievements_ritual":"Başarılar","achievements_subtitle":"Ustalığın Yedi Yolu","achievements_house_coming":"Bu yolun başarıları kozmik ateşlerde dövülüyor. Kaderinizi talep etmek için yakında geri dönün.","view_stats_chart":"İstatistik Grafiğini Görüntüle","pxp_dashboard":"P-XP Paneli","pxp_level":"SEVİYE","pxp_total_earned":"Toplam: {0} P-XP kazanıldı","pxp_1_day":"1 Gün","pxp_1_week":"1 Hafta","pxp_1_month":"1 Ay","pxp_1_year":"1 Yıl","pxp_all_time":"Tüm Zamanlar","pxp_games_each":"Oyunlar (+10 her biri)","pxp_answers_each":"Cevaplar (+1 her biri)","pxp_achievements":"Başarılar","pxp_today_breakdown":"Bugünün Dökümü","pxp_games_completed":"Tamamlanan Oyunlar","pxp_correct_answers":"Doğru Cevaplar","pxp_achievements_claimed":"Kazanılan Başarılar","pxp_total_earned_label":"Toplam Kazanılan","stats_overall":"Genel","stats_by_topic":"Konuya Göre","stats_games_label":"OYUNLAR","stats_questions_label":"SORULAR","stats_correct_label":"DOĞRU","stats_wrong_label":"YANLIŞ","stats_time_label":"SÜRE","stats_streak_label":"SERİ","stats_no_data":"Bu dönem için veri yok","stats_peak":"ZİRVE","stats_average":"ORTALAMA","stats_total":"TOPLAM","home_continue_playing":"Oynamaya Devam","home_quick_play":"Hızlı Oyun","home_random":"Rastgele","home_slot":"Slot","home_explore":"Keşfet","topic_add_to_slot":"+ Slota Ekle","topic_level":"Seviye","topic_choose_mode":"OYUN MODUNU SEÇ","topic_casual":"Normal","topic_questions":"soru","topic_time_attack":"Zamana Karşı","topic_reach_level":"Seviye {0}'a ulaşın","topic_3_hearts":"3 Can","topic_2_players":"2 Oyuncu","topic_progress":"Konu İlerlemesi","topic_level_arrow":"Seviye {0} → Seviye {1}","pxp_today_breakdown":"Bugünün Dökümü","pxp_week_breakdown":"Bu Haftanın Dökümü","pxp_month_breakdown":"Bu Ayın Dökümü","pxp_year_breakdown":"Bu Yılın Dökümü","pxp_breakdown":"Döküm","pxp_how_it_works":"ℹ️ P-XP Nasıl Çalışır","topic_flags":"Bayraklar","topic_capitals":"Başkentler","topic_area":"Ülke Alanı","topic_football":"Futbol","topic_premier_league":"Premier Lig","topic_champions_league":"Şampiyonlar Ligi","topic_movies":"Filmler","topic_marvel":"Marvel","topic_dc":"DC","topic_tv_shows":"Diziler","topic_got":"Taht Oyunları","topic_stranger_things":"Stranger Things","topic_money_heist":"La Casa de Papel","topic_logos":"Logolar","topic_world_history":"Dünya Tarihi","home_hot_topics":"🔥 Popüler Konular","home_ranked_mode":"Dereceli Moda Gir","topic_borders":"Sınırlar","topic_world_cup":"Dünya Kupası","topic_derbies":"Derbiler","topic_messi":"Messi","topic_ronaldo":"Ronaldo","topic_disney":"Disney","topic_harry_potter":"Harry Potter","topic_star_wars":"Yıldız Savaşları","topic_lotr":"Yüzüklerin Efendisi","topic_sitcoms":"Sitkomlar","topic_breaking_bad":"Breaking Bad","topic_the_office":"The Office","topic_wwii":"İkinci Dünya Savaşı","topic_wwi":"Birinci Dünya Savaşı","topic_roman_empire":"Roma İmparatorluğu","topic_ottoman":"Osmanlı İmparatorluğu","topic_egyptian":"Antik Mısır","topic_british_monarchy":"İngiliz Monarşisi","topic_ancient_civs":"Antik Medeniyetler","topic_cold_war":"Soğuk Savaş","achievement_progression":"İlerleme","achievement_skill":"Beceri","achievement_exploration":"Keşif","achievement_time_attack":"Zamana Karşı","achievement_survival":"Hayatta Kalma","achievement_casual":"Normal","achievement_behaviour":"Davranış","house_progression":"İlerleme Yolu","house_skill":"Beceri Yolu","house_exploration":"Keşif Yolu","house_time":"Zamana Karşı Yolu","house_survival":"Hayatta Kalma Yolu","house_casual":"Normal Ustalık Yolu","house_behaviour":"Davranış Yolu","house_coming_soon":"Yakında","house_progression_subtitle":"Yolculuğun başlıyor, yükseliyor ve dönüşüyor.","pillar_ascending_levels":"Yükselen Seviyeler","pillar_ascending_levels_desc":"Prestij sıralarında yüksel","pillar_topic_entry":"Konu İlerlemesi","pillar_topic_entry_desc":"Bir konuda derin uzmanlığa doğru ilerle.","pillar_games_completed":"Tamamlanan Oyunlar","pillar_games_completed_desc":"Aralıksız oyunla yolda yürü.","pillar_questions_answered":"Toplam Cevaplanan Sorular","pillar_questions_answered_desc":"Biriken bilgiyle aklını genişlet.","pillar_flawed_mind":"Kusurlu Zihin Yolu","pillar_flawed_mind_desc":"Bilgelik hata ve düzeltmeyle şekillenir.","pillar_timeless_devotion":"Zamansız Adanmışlık Yolu","pillar_timeless_devotion_desc":"Varlık, dayanıklılık ve zamanla yavaş ustalık oluşumu.","ach_tap_to_claim":"ALMAK İÇİN DOKUN","ach_prestige_level_2_name":"Yükselişin Çırağı","ach_prestige_level_2_desc":"Seviye 2'ye Ulaş","ach_prestige_level_5_name":"Adım Taşıyıcısı","ach_prestige_level_5_desc":"Seviye 5'e Ulaş","ach_prestige_level_10_name":"Yükselen","ach_prestige_level_10_desc":"Seviye 10'a Ulaş","ach_prestige_level_20_name":"Yol Yürüyücüsü","ach_prestige_level_20_desc":"Seviye 20'ye Ulaş","ach_prestige_level_30_name":"Zirve Arayıcısı","ach_prestige_level_30_desc":"Seviye 30'a Ulaş","ach_prestige_level_40_name":"Tepe Taşıyıcısı","ach_prestige_level_40_desc":"Seviye 40'a Ulaş","ach_prestige_level_50_name":"Doruk Ulaşan","ach_prestige_level_50_desc":"Seviye 50'ye Ulaş","ach_prestige_level_75_name":"Yetmiş Beşin Zirvesi","ach_prestige_level_75_desc":"Seviye 75'e Ulaş","ach_prestige_level_100_name":"Zenit Yükseleni","ach_prestige_level_100_desc":"Seviye 100'e Ulaş","ach_prestige_level_250_name":"İki Yüz Ellinin Yükseleni","ach_prestige_level_250_desc":"Seviye 250'ye Ulaş","ach_prestige_level_500_name":"Beş Yüz Adımın Taşıyıcısı","ach_prestige_level_500_desc":"Seviye 500'e Ulaş","ach_prestige_level_1000_name":"Binkat Zirve","ach_prestige_level_1000_desc":"Seviye 1000'e Ulaş","ach_games_10_name":"İlk Adımlar","ach_games_10_desc":"10 oyun tamamla","ach_games_25_name":"Beliren Ritim","ach_games_25_desc":"25 oyun tamamla","ach_games_50_name":"Sebat Nabzı","ach_games_50_desc":"50 oyun tamamla","ach_games_100_name":"İvme Koruyucusu","ach_games_100_desc":"100 oyun tamamla","ach_games_200_name":"Akışa Bağlı","ach_games_200_desc":"200 oyun tamamla","ach_games_500_name":"Kırılmaz Yürüyüş","ach_games_500_desc":"500 oyun tamamla","ach_games_1000_name":"Devamlılık Taşıyıcısı","ach_games_1000_desc":"1000 oyun tamamla","ach_games_3000_name":"Tekrar Ruhu","ach_games_3000_desc":"3000 oyun tamamla","ach_games_5000_name":"Kalıcı Nabız","ach_games_5000_desc":"5000 oyun tamamla","ach_games_10000_name":"On Bin Adımın Yankısı","ach_games_10000_desc":"10000 oyun tamamla","ach_games_50000_name":"Dayanıklının İradesi","ach_games_50000_desc":"50000 oyun tamamla","ach_games_100000_name":"Ebedi Yol Taşıyıcısı","ach_games_100000_desc":"100000 oyun tamamla","ach_questions_100_name":"İlk Parçalar","ach_questions_100_desc":"100 soruya cevap ver","ach_questions_250_name":"Düşünce Toplayıcısı","ach_questions_250_desc":"250 soruya cevap ver","ach_questions_500_name":"Hareket Eden Zihin","ach_questions_500_desc":"500 soruya cevap ver","ach_questions_750_name":"Kavrayış Kıvılcımları","ach_questions_750_desc":"750 soruya cevap ver","ach_questions_1000_name":"Anlayış Dokuyucusu","ach_questions_1000_desc":"1000 soruya cevap ver","ach_questions_1500_name":"Büyüyen Biliş","ach_questions_1500_desc":"1500 soruya cevap ver","ach_questions_2000_name":"Beliren Farkındalık","ach_questions_2000_desc":"2000 soruya cevap ver","ach_questions_2500_name":"Hatıra Koruyucusu","ach_questions_2500_desc":"2500 soruya cevap ver","ach_questions_3500_name":"Kalıp Arayıcısı","ach_questions_3500_desc":"3500 soruya cevap ver","ach_questions_5000_name":"Hakikat Hasatçısı","ach_questions_5000_desc":"5000 soruya cevap ver","ach_questions_7500_name":"Bellek Yazıcısı","ach_questions_7500_desc":"7500 soruya cevap ver","ach_questions_10000_name":"Akıl Sesi","ach_questions_10000_desc":"10000 soruya cevap ver","ach_questions_15000_name":"Sessiz Bilgin","ach_questions_15000_desc":"15000 soruya cevap ver","ach_questions_20000_name":"Anlam Taşıyıcısı","ach_questions_20000_desc":"20000 soruya cevap ver","ach_questions_25000_name":"Bilgelik Mimarı","ach_questions_25000_desc":"25000 soruya cevap ver","ach_questions_30000_name":"Sayısız Sorunun Koruyucusu","ach_questions_30000_desc":"30000 soruya cevap ver","ach_questions_40000_name":"Sonsuz Zihin","ach_questions_40000_desc":"40000 soruya cevap ver","ach_questions_50000_name":"Hakikate Bağlı","ach_questions_50000_desc":"50000 soruya cevap ver","ach_questions_60000_name":"Bilme Tacı","ach_questions_60000_desc":"60000 soruya cevap ver","ach_questions_75000_name":"Düşünceli","ach_questions_75000_desc":"75000 soruya cevap ver","ach_questions_100000_name":"Sonsuz Sorgunun Taşıyıcısı","ach_questions_100000_desc":"100000 soruya cevap ver","ach_questions_150000_name":"Ölçüsüz Zihin","ach_questions_150000_desc":"150000 soruya cevap ver","ach_questions_200000_name":"Ebedi Kavrayış","ach_questions_200000_desc":"200000 soruya cevap ver","ach_questions_250000_name":"Düşüncenin Yükseleni","ach_questions_250000_desc":"250000 soruya cevap ver","ach_questions_500000_name":"İçteki Enginlik","ach_questions_500000_desc":"500000 soruya cevap ver","ach_questions_1000000_name":"Milyonun Tacı","ach_questions_1000000_desc":"1000000 soruya cevap ver"}
};

let currentLanguage = localStorage.getItem('quizzena_language') || 'en';
let translations = LANGUAGE_DATA[currentLanguage] || LANGUAGE_DATA.en;

// ============================================
// 🌍 LANGUAGE MANAGER - DOWNLOADABLE LANGUAGE PACKS
// ============================================

// Available languages configuration
const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', bundled: true, size: '4.3 KB' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', bundled: false, size: '4.7 KB' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', bundled: false, size: '5.8 KB' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', bundled: false, size: '4.5 KB' }
];

// Base URL for language packs - UPDATE THIS WITH YOUR GITHUB REPO
// For local testing, use relative path. For production, use CDN URL below:
// const LANGUAGE_PACK_BASE_URL = 'https://cdn.jsdelivr.net/gh/YOUR_USERNAME/flag_quiz@main/language-packs/';
// const LANGUAGE_PACK_BASE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/flag_quiz/main/language-packs/';
const LANGUAGE_PACK_BASE_URL = './language-packs/';

// Get downloaded languages from localStorage
function getDownloadedLanguages() {
  try {
    return JSON.parse(localStorage.getItem('quizzena_downloaded_languages')) || ['en'];
  } catch {
    return ['en'];
  }
}

// Save downloaded languages to localStorage
function saveDownloadedLanguages(languages) {
  localStorage.setItem('quizzena_downloaded_languages', JSON.stringify(languages));
}

// Get cached language data from localStorage
function getCachedLanguageData(langCode) {
  try {
    const data = localStorage.getItem(`quizzena_lang_pack_${langCode}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Save language data to localStorage cache
function cacheLanguageData(langCode, data) {
  try {
    localStorage.setItem(`quizzena_lang_pack_${langCode}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not cache language data:', e);
  }
}

// Delete cached language data
function deleteCachedLanguage(langCode) {
  localStorage.removeItem(`quizzena_lang_pack_${langCode}`);
  const downloaded = getDownloadedLanguages().filter(l => l !== langCode);
  saveDownloadedLanguages(downloaded);
}

// Download a language pack
async function downloadLanguagePack(langCode) {
  const langConfig = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
  if (!langConfig) {
    throw new Error('Language not found');
  }
  
  if (langConfig.bundled) {
    // Already bundled, no download needed
    return LANGUAGE_DATA[langCode];
  }
  
  try {
    const response = await fetch(`${LANGUAGE_PACK_BASE_URL}${langCode}.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch language pack');
    }
    
    const data = await response.json();
    
    // Cache the language data
    cacheLanguageData(langCode, data);
    
    // Add to downloaded list
    const downloaded = getDownloadedLanguages();
    if (!downloaded.includes(langCode)) {
      downloaded.push(langCode);
      saveDownloadedLanguages(downloaded);
    }
    
    // Add to LANGUAGE_DATA for current session
    if (data.ui) {
      LANGUAGE_DATA[langCode] = data.ui;
    }
    
    return data;
  } catch (error) {
    console.error('Error downloading language pack:', error);
    throw error;
  }
}

// Check if a language is downloaded
function isLanguageDownloaded(langCode) {
  if (AVAILABLE_LANGUAGES.find(l => l.code === langCode)?.bundled) {
    return true;
  }
  return getDownloadedLanguages().includes(langCode);
}

// Load cached languages into LANGUAGE_DATA on startup
function loadCachedLanguages() {
  const downloaded = getDownloadedLanguages();
  downloaded.forEach(langCode => {
    if (langCode !== 'en' && !LANGUAGE_DATA[langCode]) {
      const cached = getCachedLanguageData(langCode);
      if (cached && cached.ui) {
        LANGUAGE_DATA[langCode] = cached.ui;
      }
    }
  });
}

// Initialize cached languages
loadCachedLanguages();

// Load language (sync - no HTTP needed, works in native apps)
function loadLanguage(lang) {
  if (!LANGUAGE_DATA[lang]) {
    lang = 'en'; // Fallback to English
  }
  translations = LANGUAGE_DATA[lang];
  currentLanguage = lang;
  localStorage.setItem('quizzena_language', lang);
  applyTranslations();
  updateCurrentLanguageDisplay();
}

// Update the current language display in settings
function updateCurrentLanguageDisplay() {
  const display = document.getElementById('current-language-display');
  if (display) {
    const langConfig = AVAILABLE_LANGUAGES.find(l => l.code === currentLanguage);
    if (langConfig) {
      display.textContent = `${langConfig.flag} ${langConfig.nativeName}`;
    }
  }
}

// Open language manager modal
function openLanguageManager() {
  const modal = document.getElementById('language-manager-modal');
  if (modal) {
    renderLanguageList();
    modal.classList.remove('hidden');
  }
}

// Close language manager modal
function closeLanguageManager() {
  const modal = document.getElementById('language-manager-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Render the language list in the modal
function renderLanguageList() {
  const list = document.getElementById('language-list');
  if (!list) return;
  
  const downloaded = getDownloadedLanguages();
  
  list.innerHTML = AVAILABLE_LANGUAGES.map(lang => {
    const isDownloaded = lang.bundled || downloaded.includes(lang.code);
    const isActive = lang.code === currentLanguage;
    
    return `
      <div class="language-item ${isActive ? 'active' : ''}" data-lang="${lang.code}">
        <div class="language-item-info">
          <span class="language-flag">${lang.flag}</span>
          <div class="language-details">
            <span class="language-name">${lang.name}</span>
            <span class="language-native">${lang.nativeName}</span>
            <span class="language-size">${lang.size}</span>
          </div>
        </div>
        <div class="language-item-actions">
          ${lang.bundled ? `
            <span class="lang-status-bundled">Included</span>
          ` : isDownloaded ? `
            <button class="lang-btn lang-btn-delete" onclick="deleteLanguage('${lang.code}')" title="Delete">🗑️</button>
          ` : `
            <button class="lang-btn lang-btn-download" onclick="handleDownloadLanguage('${lang.code}', this)">
              Download
            </button>
          `}
          ${isActive ? `
            <button class="lang-btn lang-btn-active">✓ Active</button>
          ` : isDownloaded || lang.bundled ? `
            <button class="lang-btn lang-btn-select" onclick="selectLanguage('${lang.code}')">
              Select
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Handle download button click
async function handleDownloadLanguage(langCode, btn) {
  if (btn) {
    btn.textContent = 'Downloading...';
    btn.classList.add('lang-btn-downloading');
    btn.disabled = true;
  }
  
  try {
    await downloadLanguagePack(langCode);
    playClickSound();
    renderLanguageList();
  } catch (error) {
    if (btn) {
      btn.textContent = 'Failed - Retry';
      btn.classList.remove('lang-btn-downloading');
      btn.disabled = false;
    }
    console.error('Download failed:', error);
  }
}

// Select a language
function selectLanguage(langCode) {
  if (isLanguageDownloaded(langCode) || LANGUAGE_DATA[langCode]) {
    loadLanguage(langCode);
    playClickSound();
    renderLanguageList();
  }
}

// Delete a downloaded language
function deleteLanguage(langCode) {
  if (langCode === 'en') return; // Can't delete English
  
  // If currently using this language, switch to English
  if (currentLanguage === langCode) {
    loadLanguage('en');
  }
  
  // Remove from LANGUAGE_DATA
  delete LANGUAGE_DATA[langCode];
  
  // Delete from cache
  deleteCachedLanguage(langCode);
  
  playClickSound();
  renderLanguageList();
}

// Get translation by key
function t(key) {
  return translations[key] || key;
}

// Apply translations to all elements with data-i18n attribute
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[key]) {
      element.setAttribute('placeholder', translations[key]);
    }
  });

  // Update specific dynamic elements
  updateDynamicTranslations();
}

// Update elements that need special handling
function updateDynamicTranslations() {
  // Update version text
  const versionEl = document.getElementById('settings-version');
  if (versionEl && translations.version) {
    versionEl.textContent = translations.version;
  }

  // Update navigation items
  const navItems = {
    'nav-home': 'nav_home',
    'nav-topics': 'nav_topics', 
    'nav-social': 'nav_social',
    'nav-leaderboard': 'nav_leaderboard',
    'nav-profile': 'nav_profile'
  };

  for (const [id, key] of Object.entries(navItems)) {
    const el = document.getElementById(id);
    if (el) {
      const span = el.querySelector('span');
      if (span && translations[key]) {
        span.textContent = translations[key];
      }
    }
  }

  // Update home page elements
  const homeFeaturedLabel = document.querySelector('.home-featured-label');
  if (homeFeaturedLabel && translations.home_quiz_of_day) {
    homeFeaturedLabel.textContent = translations.home_quiz_of_day;
  }

  const homeFeaturedPlay = document.querySelector('.home-featured-play');
  if (homeFeaturedPlay && translations.home_play_now) {
    homeFeaturedPlay.textContent = translations.home_play_now;
  }

  const homeCategoriesTitle = document.querySelector('.home-categories-title');
  if (homeCategoriesTitle && translations.home_explore_categories) {
    homeCategoriesTitle.textContent = translations.home_explore_categories;
  }

  // Update category names
  const categoryNames = {
    'geography': 'category_geography',
    'football': 'category_football',
    'movies': 'category_movies',
    'tvshows': 'category_tvshows',
    'history': 'category_history',
    'logos': 'category_logos'
  };

  document.querySelectorAll('.home-category-card').forEach(card => {
    const category = card.dataset.category;
    const nameEl = card.querySelector('.home-category-name');
    if (nameEl && categoryNames[category] && translations[categoryNames[category]]) {
      nameEl.textContent = translations[categoryNames[category]];
    }
  });

  // Update stats page title
  const statsHeader = document.querySelector('.stats-header h1');
  if (statsHeader && translations.stats_title) {
    statsHeader.textContent = translations.stats_title;
  }
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLanguage);
  updateCurrentLanguageDisplay();
});

// ============================================
// 🎯 TOPIC CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================
// To add a new topic: just add ONE line here!
// Format: 'topic-id': { path: 'path/to/questions.json', icon: '🎯', name: 'Display Name', category: 'category' }

const TOPIC_CONFIG = {
  // Geography (API-based - path is null)
  'flags':            { path: null, icon: '🏳️', name: 'Flags', category: 'geography' },
  'capitals':         { path: null, icon: '🏛️', name: 'Capitals', category: 'geography' },
  'borders':          { path: null, icon: '🗺️', name: 'Borders', category: 'geography' },
  'area':             { path: null, icon: '📏', name: 'Area', category: 'geography' },

  // Football (JSON-based)
  'football':         { path: 'topics/football-general/questions.json', icon: '⚽', name: 'Football', category: 'football' },
  'premier-league':   { path: 'topics/premier-league/questions.json', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Premier League', category: 'football' },
  'champions-league': { path: 'topics/champions-league/questions.json', icon: '🏆', name: 'Champions League', category: 'football' },
  'world-cup':        { path: 'topics/world-cup/questions.json', icon: '🌍', name: 'World Cup', category: 'football' },
  'messi':            { path: 'topics/messi/questions.json', icon: '🐐', name: 'Messi', category: 'football' },
  'ronaldo':          { path: 'topics/ronaldo/questions.json', icon: '👑', name: 'Ronaldo', category: 'football' },
  'derbies':          { path: 'topics/derbies/questions.json', icon: '🏟️', name: 'Football Derbies', category: 'football' },

  // History (JSON-based)
  'world-history':    { path: 'topics/world-history/questions.json', icon: '📜', name: 'World History', category: 'history' },
  'ancient-civs':     { path: 'topics/ancient-civilizations/questions.json', icon: '🏛️', name: 'Ancient Civilizations', category: 'history' },
  'ww2':              { path: 'topics/ww2/questions.json', icon: '✈️', name: 'World War II', category: 'history' },
  'ww1':              { path: 'topics/ww1/questions.json', icon: '🪖', name: 'World War I', category: 'history' },
  'egyptian':         { path: 'topics/egyptian/questions.json', icon: '🔺', name: 'Ancient Egypt', category: 'history' },
  'roman-empire':     { path: 'topics/roman-empire/questions.json', icon: '🏛️', name: 'Roman Empire', category: 'history' },
  'ottoman':          { path: 'topics/ottoman/questions.json', icon: '🕌', name: 'Ottoman Empire', category: 'history' },
  'british-monarchy': { path: 'topics/british-monarchy/questions.json', icon: '👑', name: 'British Monarchy', category: 'history' },
  'cold-war':         { path: 'topics/cold-war/questions.json', icon: '☢️', name: 'Cold War', category: 'history' },

  // Movies (JSON-based)
  'movies':           { path: 'topics/movies-general/questions.json', icon: '🎬', name: 'Movies', category: 'movies' },
  'marvel':           { path: 'topics/marvel-movies/questions.json', icon: '🦸', name: 'Marvel', category: 'movies' },
  'dc':               { path: 'topics/dc/questions.json', icon: '🦇', name: 'DC', category: 'movies' },
  'harry-potter':     { path: 'topics/harry-potter/questions.json', icon: '⚡', name: 'Harry Potter', category: 'movies' },
  'star-wars':        { path: 'topics/star-wars/questions.json', icon: '⭐', name: 'Star Wars', category: 'movies' },
  'lotr':             { path: 'topics/lotr/questions.json', icon: '💍', name: 'Lord of the Rings', category: 'movies' },
  'disney':           { path: 'topics/disney/questions.json', icon: '🏰', name: 'Disney', category: 'movies' },

  // TV Shows (JSON-based)
  'tv-shows':         { path: 'topics/tv-shows/questions.json', icon: '📺', name: 'TV Shows', category: 'tv-shows' },
  'sitcoms':          { path: 'topics/sitcoms/questions.json', icon: '😂', name: 'Sitcoms', category: 'tv-shows' },
  'game-of-thrones':  { path: 'topics/game-of-thrones/questions.json', icon: '🐉', name: 'Game of Thrones', category: 'tv-shows' },
  'breaking-bad':     { path: 'topics/breaking-bad/questions.json', icon: '🧪', name: 'Breaking Bad', category: 'tv-shows' },
  'stranger-things':  { path: 'topics/stranger-things/questions.json', icon: '🔦', name: 'Stranger Things', category: 'tv-shows' },
  'money-heist':      { path: 'topics/money-heist/questions.json', icon: '🎭', name: 'Money Heist', category: 'tv-shows' },
  'the-office':       { path: 'topics/the-office/questions.json', icon: '📎', name: 'The Office', category: 'tv-shows' },

  // Logos (JSON-based)
  'logos':            { path: 'topics/logos/questions.json', icon: '🏷️', name: 'Logos', category: 'logos' },
};

// Auto-generated arrays from config (NO MORE MANUAL UPDATES EVER!)
const ALL_TOPICS = Object.keys(TOPIC_CONFIG);
const JSON_TOPICS = Object.entries(TOPIC_CONFIG)
  .filter(([id, cfg]) => cfg.path !== null)
  .map(([id]) => id);
const API_TOPICS = ['flags', 'capitals', 'borders', 'area'];

// Helper function to get topic config
function getTopicConfig(topicId) {
  return TOPIC_CONFIG[topicId] || { icon: '❓', name: topicId, category: 'unknown' };
}

// ========================================
// ☁️ CLOUDINARY CDN CONFIGURATION
// ========================================
// IMPORTANT: Replace 'YOUR_CLOUD_NAME' with your actual Cloudinary cloud name!
// Instructions: See CLOUDINARY_SETUP.md for setup details
const CLOUDINARY_CLOUD_NAME = 'duuvz86ph';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/`;
const USE_LOCAL_IMAGES = true; // Set to 'true' for local images, 'false' for Cloudinary CDN

// ========================================
// 🎮 GAME STATE VARIABLES
// ========================================
let flags = [];
let usedFlags = [];
let questionCount = 0;
let maxQuestions = 5;
let player1Score = 0;
let player2Score = 0;
let currentPlayer = 1;
let timer;
let timeLeft = 20;
let answered = false;
let gameMode = '';
let singlePlayerScore = 0;
let livesRemaining = 3;
let currentTopic = '';
let selectedDifficulty = '';
let areaQuestions = { easy: [], medium: [], hard: [] };
let allCountriesData = [];

// ========================================
// 📊 STATS TRACKING VARIABLES
// ========================================
let currentSessionCorrect = 0;
let currentSessionWrong = 0;
let currentStreak = 0;
let bestSessionStreak = 0;
let sessionStartTime = null;
let gameEnded = false;

// ========================================
// 🎯 DOM ELEMENTS - SCREENS
// ========================================
const home = document.getElementById("home-screen");
const playerSelect = document.getElementById("player-select");
const modeSelect = document.getElementById("mode-select");
const areaDifficultyScreen = document.getElementById("area-difficulty-screen");
const game = document.getElementById("game-screen");

// ========================================
// 🎯 DOM ELEMENTS - BUTTONS (HOME)
// ========================================
const flagsTopicBtn = document.getElementById("flags-topic-btn");
const capitalsTopicBtn = document.getElementById("capitals-topic-btn");
const bordersTopicBtn = document.getElementById("borders-topic-btn");
const areaTopicBtn = document.getElementById("area-topic-btn");

// ========================================
// 🎯 DOM ELEMENTS - BUTTONS (PLAYER SELECT)
// ========================================
const singlePlayerBtn = document.getElementById("single-player-btn");
const twoPlayerBtn = document.getElementById("two-player-btn");
const backToHomeBtn = document.getElementById("back-to-home-btn");

// ========================================
// 🎯 DOM ELEMENTS - BUTTONS (MODE SELECT)
// ========================================
const timeAttackBtn = document.getElementById("time-attack-btn");
const casualBtn = document.getElementById("casual-btn");
const threeHeartsBtn = document.getElementById("three-hearts-btn");
const backBtn = document.getElementById("back-btn");

// ========================================
// 🎯 DOM ELEMENTS - BUTTONS (GAME)
// ========================================
const backToMenuBtn = document.getElementById("back-to-menu");

// ========================================
// 🎯 DOM ELEMENTS - GAME SCREEN
// ========================================
const resultBox = document.getElementById("result");
const answersDiv = document.getElementById("answers");
const flagImg = document.getElementById("flag");
const question = document.getElementById("question");
const score = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const questionCounter = document.getElementById("question-counter");

// ========================================
// 🎯 DOM ELEMENTS - END GAME BUTTONS
// ========================================
const playAgainBtn = document.getElementById("play-again");
const mainMenuBtn = document.getElementById("main-menu");

// ========================================
// 🎯 DOM ELEMENTS - DIFFICULTY BUTTONS
// ========================================
const areaEasyBtn = document.getElementById("area-easy-btn");
const areaMediumBtn = document.getElementById("area-medium-btn");
const areaHardBtn = document.getElementById("area-hard-btn");
const backFromDifficultyBtn = document.getElementById("back-from-difficulty");

// ========================================
// ⚙️ GAME CONFIGURATION - EDIT THESE VALUES
// ========================================
const GAME_CONFIG = {
  TIME_ATTACK_DURATION: 60,
  CASUAL_QUESTIONS: 5,
  CASUAL_TIME_PER_Q: 10,
  THREE_HEARTS_LIVES: 3,
  TWO_PLAYER_QUESTIONS: 5,
  TWO_PLAYER_TIME_PER_Q: 20,
  FEEDBACK_DELAY_FAST: 500,
  FEEDBACK_DELAY_NORMAL: 1500,
  FEEDBACK_DELAY_SLOW: 2000
};

// ========================================
// ⚙️ POINT SYSTEM - EDIT SCORING RULES
// ========================================
function calculatePoints() {
  if (timeLeft >= 15) return timeLeft;
  else if (timeLeft >= 10) return 15;
  else return 10;
}

// ========================================
// 🔄 UTILITY FUNCTION - RESET GAME
// ========================================
function resetGame() {
  clearInterval(timer);
  usedFlags = [];
  questionCount = 0;
  player1Score = 0;
  player2Score = 0;
  singlePlayerScore = 0;
  livesRemaining = GAME_CONFIG.THREE_HEARTS_LIVES;
  currentPlayer = 1;
  answered = false;
  maxQuestions = GAME_CONFIG.TWO_PLAYER_QUESTIONS;

  // Reset session stats
  currentSessionCorrect = 0;
  currentSessionWrong = 0;
  currentStreak = 0;
  bestSessionStreak = 0;
  sessionStartTime = new Date();
  gameEnded = false;
  sessionAnswerTimes = [];  // Reset answer times for new session
  
  // Reset quiz timer for time tracking
  quizStartTime = Date.now();
}

// ========================================
// ⏱️ TIME TRACKING SYSTEM
// ========================================
let quizStartTime = 0;
let questionOptionsShownTime = 0;  // When options appear (for avg answer time)
let sessionAnswerTimes = [];       // Array of individual answer times (ms)

// Format seconds into human-readable time (45s, 5.3m, 2.5h, 3.2d, 2.1w, 1.3y)
function formatTimeDisplay(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  
  const seconds = Math.floor(totalSeconds);
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;
  const years = days / 365;
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  } else if (days < 7) {
    return `${days.toFixed(1)}d`;
  } else if (weeks < 52) {
    return `${weeks.toFixed(1)}w`;
  } else {
    return `${years.toFixed(1)}y`;
  }
}

// Calculate average time per question for a topic
function getAvgTimePerQuestion(topicId) {
  const topic = userData.stats.topics[topicId];
  if (!topic || !topic.totalQuestionsAnswered || topic.totalQuestionsAnswered === 0) {
    return 0;
  }
  return topic.timeSpentSeconds / topic.totalQuestionsAnswered;
}

// Format average time (always in seconds with 1 decimal)
function formatAvgTime(avgSeconds) {
  if (!avgSeconds || avgSeconds <= 0) return '0s';
  return `${avgSeconds.toFixed(1)}s`;
}

// ========================================
// 🔄 UTILITY FUNCTION - SHUFFLE ARRAY
// ========================================
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ========================================
// 📏 AREA QUIZ - GENERATE QUESTIONS
// ========================================
async function generateAreaQuestions() {
  try {
    const res = await fetch("https://restcountries.com/v3.1/independent?status=true");
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();

    // Store all countries with area data
    allCountriesData = data
      .filter(country => country.area && country.cca2)
      .map(country => ({
        country: country.name.common.replace(/\bStates\b/gi, '').trim(),
        area: country.area,
        isoCode: country.cca2.toLowerCase(),
        originalName: country.name.common
      }))
      .sort((a, b) => b.area - a.area); // Sort by area descending

    // Generate Easy questions (top 10 largest)
    const easyCountries = allCountriesData.slice(0, 10);
    areaQuestions.easy = easyCountries.map(country => ({
      ...country,
      wrongAnswers: generateRandomWrongAnswers(country, allCountriesData, 3)
    }));

    // Generate Medium questions (positions 11-165)
    const mediumCountries = allCountriesData.slice(10, 165);
    areaQuestions.medium = mediumCountries.map(country => ({
      ...country,
      wrongAnswers: generateSmartWrongAnswers(country, allCountriesData, 'medium')
    }));

    // Generate Hard questions (bottom 25 smallest)
    const hardCountries = allCountriesData.slice(-25);
    areaQuestions.hard = hardCountries.map(country => ({
      ...country,
      wrongAnswers: generateSmartWrongAnswers(country, allCountriesData, 'hard')
    }));

  } catch (err) {
    console.error("Failed to generate area questions:", err);
  }
}

// Generate random wrong answers
function generateRandomWrongAnswers(correctCountry, pool, count) {
  const available = pool.filter(c => c.country !== correctCountry.country);
  return shuffle(available).slice(0, count).map(c => c.area);
}

// Generate smart wrong answers based on difficulty
function generateSmartWrongAnswers(correctCountry, pool, difficulty) {
  const wrongAnswers = [];
  const correctArea = correctCountry.area;
  const available = pool.filter(c => c.country !== correctCountry.country);

  if (difficulty === 'medium') {
    // Wrong Answer 1: ~20% different (18-25% acceptable)
    const target20 = correctArea * (Math.random() > 0.5 ? 1.20 : 0.80);
    const closest20 = available.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.area - target20);
      const currDiff = Math.abs(curr.area - target20);
      return currDiff < prevDiff ? curr : prev;
    });
    wrongAnswers.push(closest20.area);

    // Wrong Answer 2: 30-70% range (closest to 50%)
    const target50 = correctArea * (Math.random() > 0.5 ? 1.50 : 0.50);
    const inRange = available.filter(c => {
      const ratio = c.area / correctArea;
      return (ratio >= 0.30 && ratio <= 0.70) || (ratio >= 1.30 && ratio <= 1.70);
    });
    if (inRange.length > 0) {
      const closest50 = inRange.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.area - target50);
        const currDiff = Math.abs(curr.area - target50);
        return currDiff < prevDiff ? curr : prev;
      });
      wrongAnswers.push(closest50.area);
    } else {
      wrongAnswers.push(available[Math.floor(Math.random() * available.length)].area);
    }

    // Wrong Answer 3: Completely random
    const remaining = available.filter(c => !wrongAnswers.includes(c.area));
    wrongAnswers.push(remaining[Math.floor(Math.random() * remaining.length)].area);

  } else if (difficulty === 'hard') {
    // Wrong Answer 1: Absolute nearest
    const nearest = available.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.area - correctArea);
      const currDiff = Math.abs(curr.area - correctArea);
      return currDiff < prevDiff ? curr : prev;
    });
    wrongAnswers.push(nearest.area);

    // Wrong Answer 2: 30-70% range
    const target50 = correctArea * (Math.random() > 0.5 ? 1.50 : 0.50);
    const inRange = available.filter(c => {
      const ratio = c.area / correctArea;
      return (ratio >= 0.30 && ratio <= 0.70) || (ratio >= 1.30 && ratio <= 1.70);
    });
    if (inRange.length > 0) {
      const closest50 = inRange.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.area - target50);
        const currDiff = Math.abs(curr.area - target50);
        return currDiff < prevDiff ? curr : prev;
      });
      wrongAnswers.push(closest50.area);
    } else {
      wrongAnswers.push(available[Math.floor(Math.random() * available.length)].area);
    }

    // Wrong Answer 3: Random
    const remaining = available.filter(c => !wrongAnswers.includes(c.area));
    wrongAnswers.push(remaining[Math.floor(Math.random() * remaining.length)].area);
  }

  return wrongAnswers;
}

// Format area with commas
function formatArea(area) {
  return area.toLocaleString('en-US') + ' km²';
}

// ========================================
// 🏠 NAVIGATION - HOME SCREEN (TOPIC SELECTION)
// ========================================
flagsTopicBtn.onclick = () => {
  playClickSound();
  currentTopic = 'flags';
  showUnifiedModeSelection('Flags', '🏳️');
};

capitalsTopicBtn.onclick = () => {
  playClickSound();
  currentTopic = 'capitals';
  showUnifiedModeSelection('Capitals', '🏛️');
};

bordersTopicBtn.onclick = () => {
  playClickSound();
  currentTopic = 'borders';
  showUnifiedModeSelection('Borders', '🗺️');
};

areaTopicBtn.onclick = () => {
  playClickSound();
  currentTopic = 'area';
  showUnifiedModeSelection('Area', '📏');
};

// ========================================
// 👥 NAVIGATION - PLAYER SELECTION
// ========================================
backToHomeBtn.onclick = () => {
  playClickSound();
  playerSelect.classList.add("hidden");
  home.classList.remove("hidden");
};

singlePlayerBtn.onclick = () => {
  playClickSound();
  playerSelect.classList.add("hidden");
  modeSelect.classList.remove("hidden");
};

twoPlayerBtn.onclick = () => {
  playClickSound();
  resetGame();
  gameMode = 'two';
  maxQuestions = GAME_CONFIG.TWO_PLAYER_QUESTIONS;
  playerSelect.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

// ========================================
// 🏠 NAVIGATION - MODE SELECT BUTTONS
// ========================================
backBtn.onclick = () => {
  playClickSound();
  modeSelect.classList.add("hidden");
  playerSelect.classList.remove("hidden");
};

timeAttackBtn.onclick = () => {
  playClickSound();
  resetGame();
  gameMode = 'time-attack';
  modeSelect.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

casualBtn.onclick = () => {
  playClickSound();
  resetGame();
  gameMode = 'casual';
  maxQuestions = GAME_CONFIG.CASUAL_QUESTIONS;
  modeSelect.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

threeHeartsBtn.onclick = () => {
  playClickSound();
  resetGame();
  gameMode = 'three-hearts';
  livesRemaining = GAME_CONFIG.THREE_HEARTS_LIVES;
  modeSelect.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

// ========================================
// 🎯 NAVIGATION - DIFFICULTY SELECTION
// ========================================
backFromDifficultyBtn.onclick = () => {
  playClickSound();
  areaDifficultyScreen.classList.add("hidden");
  modeSelect.classList.remove("hidden");
};

areaEasyBtn.onclick = () => {
  playClickSound();
  selectedDifficulty = 'easy';
  areaDifficultyScreen.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

areaMediumBtn.onclick = () => {
  playClickSound();
  selectedDifficulty = 'medium';
  areaDifficultyScreen.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

areaHardBtn.onclick = () => {
  playClickSound();
  selectedDifficulty = 'hard';
  areaDifficultyScreen.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

// ========================================
// 🏠 NAVIGATION - IN-GAME MENU BUTTON
// ========================================
backToMenuBtn.onclick = () => {
  playClickSound();
  // Save stats before exiting (completed = false because user quit early)
  // This applies to all tracked topics - stats won't be saved for early exits
  const trackedTopics = ALL_TOPICS;
  if (trackedTopics.includes(currentTopic)) {
    saveQuizStats(currentTopic, false);
  }

  resetGame();
  questionCounter.style.display = "none";
  game.classList.add("hidden");
  home.classList.remove("hidden");
  playAgainBtn.style.display = "none";
  mainMenuBtn.style.display = "none";
};

// ========================================
// 📡 API - LOAD DATA (FLAGS OR CAPITALS)
// ========================================
async function loadFlags() {
  try {
if (currentTopic === 'flags') {
      const res = await fetch("topic_images/flags/codes.json");
      const data = await res.json();

      // Types to include in the quiz (exclude only us-state and uninhabited)
      const includedTypes = ["country", "organization", "special-region", "uk-constituent", 
                             "crown-dependency", "island", "french-territory", "caribbean-territory",
                             "special-territory"];
      
      flags = Object.entries(data)
        .filter(([code, name]) => {
          const entityType = getEntityType(name, code);
          return includedTypes.includes(entityType);
        })
        .map(([code, name]) => ({
          country: name.replace(/\bStates\b/gi, '').trim(),
          flag: `topic_images/flags/${code}.png`,
          originalName: name,
          entityType: getEntityType(name, code)
        }));
        
    } else if (currentTopic === 'capitals') {
  const res = await fetch("https://restcountries.com/v3.1/independent?status=true");
  if (!res.ok) throw new Error('API failed');
  const data = await res.json();

  flags = data
    .filter(country => country.capital && country.capital.length > 0)
    .map(country => ({
      country: country.name.common.replace(/\bStates\b/gi, '').trim(),
      capital: country.capital[0],
      originalName: country.name.common
    }));
} else if (currentTopic === 'borders') {
  const res = await fetch("https://restcountries.com/v3.1/independent?status=true");
  if (!res.ok) throw new Error('API failed');
  const data = await res.json();

  flags = data
    .filter(country => country.cca2)
    .map(country => ({
      country: country.name.common.replace(/\bStates\b/gi, '').trim(),
      isoCode: country.cca2.toLowerCase(),
      originalName: country.name.common
    }));
} else if (currentTopic === 'area') {
  // Set default difficulty to medium (no difficulty selection screen)
  selectedDifficulty = 'medium';

  // Check if questions are already generated
  if (areaQuestions[selectedDifficulty].length === 0) {
    await generateAreaQuestions();
  }

  // Load questions from selected difficulty
  flags = areaQuestions[selectedDifficulty];
} else if (JSON_TOPICS.includes(currentTopic)) {
  // UNIFIED JSON TOPIC LOADER - handles ALL JSON-based topics automatically!
  const config = TOPIC_CONFIG[currentTopic];
  const response = await fetch(config.path);
  const questions = await response.json();

  flags = questions.map(q => ({
    question: q.question,
    correctAnswer: q.answer,
    options: q.options,
    image: q.image,
    type: currentTopic
  }));

  // Shuffle the questions
  for (let i = flags.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flags[i], flags[j]] = [flags[j], flags[i]];
  }
}

    // Check if using unified system
    const unifiedScreen = document.getElementById('unified-quiz-screen');
    if (unifiedScreen) {
      displayUnifiedQuestion();
    } else {
      startRound();
    }
  } catch (err) {
    resultBox.textContent = "Failed to load data. Check your internet and reload.";
    console.error("Load error:", err);
  }
}

// ========================================
// 🚫 FILTER & CLASSIFY FLAG ENTITIES
// ========================================
function getEntityType(name, code = '') {
  // US States - excluded from quiz
  const usStates = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
                    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
                    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
                    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
                    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
                    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
                    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
                    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", 
                    "Washington", "West Virginia", "Wisconsin", "Wyoming"];
  
  // Check US states exclusion (only codes starting with us-)
  if (code.startsWith('us-')) return "us-state";
  
  // UK Constituent countries - INCLUDED
  if (code.startsWith('gb-')) return "uk-constituent";
  if (["England", "Scotland", "Wales", "Northern Ireland"].includes(name)) return "uk-constituent";
  
  // International organizations
  if (["European Union", "United Nations"].includes(name)) return "organization";
  
  // Special Administrative Regions
  if (["Hong Kong", "Macau"].includes(name)) return "special-region";
  
  // Crown Dependencies - INCLUDED as territories
  if (["Isle of Man", "Jersey", "Guernsey"].includes(name)) return "crown-dependency";
  
// Uninhabited territories - exclude from quiz (no population to know them)
  const uninhabited = ["Bouvet Island", "Heard Island and McDonald Islands",
                       "United States Minor Outlying Islands"];
  if (uninhabited.some(u => name.includes(u))) return "uninhabited";
  
  // Special territories (Antarctica, research stations)
  if (["Antarctica", "French Southern and Antarctic Lands", "British Indian Ocean Territory"].some(t => name.includes(t))) return "special-territory";
  
  // Islands and territories - INCLUDED
  const islands = ["Åland Islands", "Faroe Islands", "Greenland", "Bermuda", "Cayman Islands", 
                   "British Virgin Islands", "Turks and Caicos Islands", "Falkland Islands",
                   "Gibraltar", "Montserrat", "Anguilla", "Saint Helena", "South Georgia",
                   "Svalbard and Jan Mayen", "Cocos (Keeling) Islands", "Christmas Island", 
                   "Norfolk Island", "Pitcairn Islands", "Cook Islands", "Niue", "Tokelau",
                   "Marshall Islands", "Solomon Islands", "Wallis and Futuna"];
  if (islands.some(i => name.includes(i))) return "island";
  
  // French overseas territories - INCLUDED
  const frenchTerritories = ["French Polynesia", "New Caledonia", "Martinique", "Guadeloupe", 
                              "Réunion", "Mayotte", "French Guiana", "Saint Martin", 
                              "Saint Barthélemy", "Saint Pierre and Miquelon"];
  if (frenchTerritories.some(t => name.includes(t))) return "french-territory";
  
  // Caribbean/Dutch territories - INCLUDED  
  const caribbeanTerritories = ["Puerto Rico", "Guam", "American Samoa", "U.S. Virgin Islands",
                                 "Northern Mariana Islands", "Aruba", "Curaçao", "Sint Maarten", 
                                 "Caribbean Netherlands"];
  if (caribbeanTerritories.some(t => name.includes(t))) return "caribbean-territory";
  
  // Everything else is a country
  return "country";
}

// Get appropriate question text based on entity type
function getQuestionTextForEntity(entityType) {
  switch (entityType) {
    case "organization":
      return "Which organization's flag is this?";
    case "special-region":
      return "Which region's flag is this?";
    case "uk-constituent":
      return "Which nation's flag is this?";
    case "crown-dependency":
      return "Which territory's flag is this?";
    case "island":
      return "Which island's flag is this?";
    case "french-territory":
      return "Which territory's flag is this?";
    case "caribbean-territory":
      return "Which territory's flag is this?";
    case "special-territory":
      return "Which territory's flag is this?";
    default:
      return "Which country's flag is this?";
  }
}

// ========================================
// ⏱️ TIMER - START COUNTDOWN
// ========================================
function startTimer(correctAnswer) {
  clearInterval(timer);

  // Check if using unified system
  const unifiedScreen = document.getElementById('unified-quiz-screen');
  const isUnified = unifiedScreen !== null;

  if (gameMode === 'time-attack') {
    if (questionCount === 1) {
      timeLeft = GAME_CONFIG.TIME_ATTACK_DURATION;
    }
    answered = false;

    // Update initial display
    if (isUnified) {
      const unifiedTimer = document.getElementById('unified-timer');
      if (unifiedTimer) unifiedTimer.textContent = `${timeLeft}s`;
      // Also update 3D card timer if present
      const card3dTimer = document.getElementById('card3d-timer');
      if (card3dTimer) card3dTimer.textContent = `${timeLeft}s`;
    } else {
      timerDisplay.textContent = `⏳ ${timeLeft}s`;
    }

    timer = setInterval(() => {
      // CHECK BEFORE DECREMENTING - Prevents negative numbers
      if (timeLeft <= 0) {
        gameEnded = true;  // SET THIS FIRST to prevent question flash!
        clearInterval(timer);
        if (isUnified) {
          showUnifiedResults();
        } else {
          endGame();
        }
        return; // STOP HERE
      }

      timeLeft--;

      // UPDATE TIMER DISPLAY IN REAL-TIME
      if (isUnified) {
        const unifiedTimer = document.getElementById('unified-timer');
        if (unifiedTimer) {
          unifiedTimer.textContent = `${timeLeft}s`;
          // Red warning at 10 seconds
          if (timeLeft <= 10) {
            unifiedTimer.style.color = '#FF6B6B';
          }
        }
        // Also update 3D card timer if present
        const card3dTimer = document.getElementById('card3d-timer');
        if (card3dTimer) {
          card3dTimer.textContent = `${timeLeft}s`;
          if (timeLeft <= 10) {
            card3dTimer.style.color = '#FF6B6B';
          }
        }
      } else {
        timerDisplay.textContent = `⏳ ${timeLeft}s`;
      }
    }, 1000);

  } else if (gameMode === 'casual') {
    timeLeft = GAME_CONFIG.CASUAL_TIME_PER_Q;
    answered = false;

    // Update initial display
    if (isUnified) {
      const unifiedTimer = document.getElementById('unified-timer');
      if (unifiedTimer) unifiedTimer.textContent = `${timeLeft}s`;
      // Also update 3D card timer if present
      const card3dTimer = document.getElementById('card3d-timer');
      if (card3dTimer) card3dTimer.textContent = `${timeLeft}s`;
    } else {
      timerDisplay.textContent = `⏳ ${timeLeft}s`;
    }

    timer = setInterval(() => {
      // CHECK BEFORE DECREMENTING
      if (timeLeft <= 0) {
        clearInterval(timer);
        if (!answered) {
          if (isUnified) {
            // Move to next question or end game
            if (questionCount >= maxQuestions) {
              showUnifiedResults();
            } else {
              setTimeout(() => {
                answered = false;
                displayUnifiedQuestion();
              }, 800);
            }
          } else {
            handleTimeout(correctAnswer);
          }
        }
        return;
      }

      timeLeft--;

      // UPDATE TIMER DISPLAY IN REAL-TIME
      if (isUnified) {
        const unifiedTimer = document.getElementById('unified-timer');
        if (unifiedTimer) {
          unifiedTimer.textContent = `${timeLeft}s`;
          // Red warning at 5 seconds
          if (timeLeft <= 5) {
            unifiedTimer.style.color = '#FF6B6B';
          }
        }
        // Also update 3D card timer if present
        const card3dTimer = document.getElementById('card3d-timer');
        if (card3dTimer) {
          card3dTimer.textContent = `${timeLeft}s`;
          if (timeLeft <= 5) {
            card3dTimer.style.color = '#FF6B6B';
          }
        }
      } else {
        timerDisplay.textContent = `⏳ ${timeLeft}s`;
      }
    }, 1000);

  } else if (gameMode === 'three-hearts') {
    if (!isUnified) {
      timerDisplay.textContent = `❤️ Lives: ${livesRemaining}`;
    }

  } else {
    // Two-player mode
    timeLeft = GAME_CONFIG.TWO_PLAYER_TIME_PER_Q;
    answered = false;

    // Update initial display
    if (isUnified) {
      const unifiedTimer = document.getElementById('unified-timer');
      if (unifiedTimer) unifiedTimer.textContent = `${timeLeft}s`;
    } else {
      timerDisplay.textContent = `⏳ ${timeLeft}s`;
    }

    timer = setInterval(() => {
      // CHECK BEFORE DECREMENTING
      if (timeLeft <= 0) {
        clearInterval(timer);
        if (!answered) {
          if (isUnified) {
            // Move to next question or end game
            if (questionCount >= maxQuestions) {
              showUnifiedResults();
            } else {
              // Switch player and continue
              currentPlayer = currentPlayer === 1 ? 2 : 1;
              setTimeout(() => {
                answered = false;
                displayUnifiedQuestion();
              }, 800);
            }
          } else {
            handleTimeout(correctAnswer);
          }
        }
        return;
      }

      timeLeft--;

      // UPDATE TIMER DISPLAY IN REAL-TIME
      if (isUnified) {
        const unifiedTimer = document.getElementById('unified-timer');
        if (unifiedTimer) {
          unifiedTimer.textContent = `${timeLeft}s`;
          if (timeLeft <= 5) {
            unifiedTimer.style.color = '#FF6B6B';
          }
        }
      } else {
        timerDisplay.textContent = `⏳ ${timeLeft}s`;
      }
    }, 1000);
  }
}

// ========================================
// ⏱️ TIMER - HANDLE TIMEOUT
// ========================================
function handleTimeout(correctAnswer) {
  answered = true;

  // List of topics that track stats
  const trackedTopics = ALL_TOPICS;

  // Track timeout as wrong answer for all supported topics
  if (trackedTopics.includes(currentTopic)) {
    currentSessionWrong++;
    currentStreak = 0;
  }

  if (gameMode === 'casual') {
    resultBox.textContent = `⏰ Time's up! It was ${correctAnswer}`;
    disableAnswers();
    setTimeout(() => {
      if (questionCount >= maxQuestions) {
        endGame();
      } else {
        answered = false;
        startRound();
      }
    }, GAME_CONFIG.FEEDBACK_DELAY_SLOW);
  } else if (gameMode === 'two') {
    resultBox.textContent = `⏰ Time's up! It was ${correctAnswer}`;
    disableAnswers();
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    setTimeout(startRound, GAME_CONFIG.FEEDBACK_DELAY_SLOW);
  }
}

// ========================================
// 🎮 GAME LOGIC - START NEW ROUND
// ========================================
function startRound() {
  // Don't start new round if game ended
  if (gameEnded) return;

  if (gameMode === 'two' && questionCount >= maxQuestions) return endGame();
  if (gameMode === 'casual' && questionCount >= maxQuestions) return endGame();

  resultBox.textContent = "";
  answersDiv.innerHTML = "";
  answered = false;
  
  const remaining = flags.filter(f => !usedFlags.includes(f.country));
  if (remaining.length === 0) {
    usedFlags = [];
  }
  
  const randomFlag = remaining[Math.floor(Math.random() * remaining.length)];
  usedFlags.push(randomFlag.country);
  questionCount++;
  
  // SET QUESTION COUNTER
  if (gameMode === 'casual') {
    questionCounter.style.display = "block";
    questionCounter.textContent = `${questionCount}/${maxQuestions}`;
  } else {
    questionCounter.style.display = "none";
  }
  
  // SET QUESTION TEXT
  if (currentTopic === 'capitals') {
    question.textContent = `What is the capital of ${randomFlag.country}?`;
  } else if (currentTopic === 'borders') {
    question.textContent = "Which country's border is this?";
  } else if (currentTopic === 'area') {
    question.textContent = `What is the area of ${randomFlag.country}?`;
  } else if (currentTopic === 'flags' && randomFlag.entityType) {
    question.textContent = getQuestionTextForEntity(randomFlag.entityType);
  } else {
    question.textContent = "Which country's flag is this?";
  }
  
  // ========================================
  // ✅ FIX: USE DOWNLOADED WIKIPEDIA IMAGES
  // ========================================
  if (currentTopic === 'flags') {
    flagImg.style.display = "block";
    flagImg.className = "";
    flagImg.src = randomFlag.flag;
  } else if (currentTopic === 'capitals') {
    flagImg.style.display = "block";
    flagImg.className = "";

    // Sanitize capital name to match filename (both local and Cloudinary)
    const sanitizedCapital = randomFlag.capital.replace(/[/\\?%*:|"<>]/g, "_");

    // Use Cloudinary CDN or local images based on configuration
    const imageBase = USE_LOCAL_IMAGES ? './topic_images/capital_images/' : CLOUDINARY_BASE_URL;
    const finalUrl = `${imageBase}${sanitizedCapital}.jpg`;

    // DEBUG: Log the URL being used
    console.log('Loading capital image:', finalUrl);
    console.log('USE_LOCAL_IMAGES:', USE_LOCAL_IMAGES);
    console.log('CLOUDINARY_BASE_URL:', CLOUDINARY_BASE_URL);

    flagImg.src = finalUrl;

    // Fallback to placeholder if image doesn't exist
    flagImg.onerror = function() {
      console.log('Image failed to load:', finalUrl);
      const seed = randomFlag.capital.toLowerCase().replace(/\s+/g, '-');
      this.src = `https://picsum.photos/seed/${seed}/800/600`;
      this.onerror = null; // Prevent infinite loop
    };
  } else if (currentTopic === 'borders') {
    flagImg.style.display = "block";
    flagImg.className = "border-image";

    // Use absolute path for border images
    const borderPath = `topic_images/country_silhouettes/${randomFlag.isoCode}.png`;
    flagImg.src = borderPath;

    flagImg.onerror = function() {
      this.onerror = null;
    };
  } else if (currentTopic === 'area') {
    flagImg.style.display = "block";
    flagImg.className = "border-image";

    // Countries without border images
    const missingBorders = ['xk', 'mh', 'fm', 'ps', 'tv'];

    if (missingBorders.includes(randomFlag.isoCode)) {
      // Use flag fallback for missing borders
      flagImg.src = `topic_images/flags/${randomFlag.isoCode}.png`;
      flagImg.classList.add('fallback-flag');
    } else {
      // Use border silhouette
      flagImg.src = `topic_images/country_silhouettes/${randomFlag.isoCode}.png`;
      flagImg.classList.remove('fallback-flag');
    }

    flagImg.onerror = function() {
      // Fallback to flag if border image fails
      this.src = `topic_images/flags/${randomFlag.isoCode}.png`;
      this.classList.add('fallback-flag');
      this.onerror = null;
    };
  } else {
    flagImg.style.display = "none";
    flagImg.className = "";
  }
  
  const wrongAnswers = generateBaitAnswers(randomFlag);

  let options;
  if (currentTopic === 'area') {
    // For area quiz, create options with correct and wrong areas
    options = [
      { area: randomFlag.area, isCorrect: true },
      ...randomFlag.wrongAnswers.map(area => ({ area, isCorrect: false }))
    ];
    options = shuffle(options);
  } else {
    options = shuffle([randomFlag, ...wrongAnswers]);
  }

  options.forEach(opt => {
    const btn = document.createElement("button");

    if (currentTopic === 'capitals') {
      btn.textContent = opt.capital;
      btn.onclick = () => checkAnswer(opt.capital, randomFlag.capital);
    } else if (currentTopic === 'area') {
      btn.textContent = formatArea(opt.area);
      btn.onclick = () => checkAnswer(formatArea(opt.area), formatArea(randomFlag.area));
    } else {
      btn.textContent = opt.country;
      btn.onclick = () => checkAnswer(opt.country, randomFlag.country);
    }

    answersDiv.appendChild(btn);
  });

  // Start answer time tracking (for avg time per question)
  questionOptionsShownTime = Date.now();

  const correctAnswer = currentTopic === 'capitals' ? randomFlag.capital :
                        currentTopic === 'area' ? formatArea(randomFlag.area) :
                        randomFlag.country;
  startTimer(correctAnswer);
}

// ========================================
// 🎯 BAIT ANSWERS - GENERATE TRICKY OPTIONS
// ========================================
function generateBaitAnswers(correctFlag) {
  const wrongAnswers = [];
  
  if (currentTopic === 'flags') {
    const correctName = correctFlag.country;
    const baitWords = ["Island", "Republic", "Democratic", "United", "Kingdom", "Federation"];
    const matchingBaitWords = baitWords.filter(word => correctName.includes(word));
    const availableFlags = flags.filter(f => f.country !== correctName);
    
    if (matchingBaitWords.length > 0) {
      const baitFlag = availableFlags.find(f => 
        matchingBaitWords.some(word => f.country.includes(word))
      );
      
      if (baitFlag) {
        wrongAnswers.push(baitFlag);
        const baitIndex = availableFlags.indexOf(baitFlag);
        availableFlags.splice(baitIndex, 1);
      }
    }
    
    const randomFlags = shuffle(availableFlags).slice(0, 3 - wrongAnswers.length);
    wrongAnswers.push(...randomFlags);
    
  } else if (currentTopic === 'capitals') {
    const availableFlags = flags.filter(f => f.country !== correctFlag.country);
    wrongAnswers.push(...shuffle(availableFlags).slice(0, 3));
  } else if (currentTopic === 'borders') {
    const availableFlags = flags.filter(f => f.country !== correctFlag.country);
    wrongAnswers.push(...shuffle(availableFlags).slice(0, 3));
  } else if (currentTopic === 'area') {
    // Area quiz has pre-generated answers, return empty array
    return [];
  }

  return wrongAnswers.slice(0, 3);
}

// ========================================
// ✅ ANSWER CHECKING - HANDLE USER SELECTION
// ========================================
function checkAnswer(selected, correct) {
  if (answered) return;
  
  // Record answer time (reaction time for this question)
  if (questionOptionsShownTime > 0) {
    const answerTime = Date.now() - questionOptionsShownTime;
    sessionAnswerTimes.push(answerTime);
  }
  
  // List of topics that track stats
  const trackedTopics = ALL_TOPICS;

  if (gameMode === 'time-attack') {
    if (selected === correct) {
      singlePlayerScore++;
      resultBox.textContent = `✅ Correct!`;
      playCorrectSound();
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionCorrect++;
        currentStreak++;
        if (currentStreak > bestSessionStreak) {
          bestSessionStreak = currentStreak;
        }
      }
    } else {
      resultBox.textContent = `❌ Wrong!`;
      playWrongSound();
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionWrong++;
        currentStreak = 0;
      }
    }
    score.textContent = `Score: ${singlePlayerScore}`;
    
    setTimeout(() => {
      resultBox.textContent = "";
      startRound();
    }, GAME_CONFIG.FEEDBACK_DELAY_FAST);
    
  } else if (gameMode === 'casual') {
    answered = true;
    clearInterval(timer);
    disableAnswers();

    if (selected === correct) {
      singlePlayerScore++;
      resultBox.textContent = `✅ Correct!`;
      playCorrectSound();
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionCorrect++;
        currentStreak++;
        if (currentStreak > bestSessionStreak) {
          bestSessionStreak = currentStreak;
        }
      }
    } else {
      resultBox.textContent = `❌ Wrong! It was ${correct}`;
      playWrongSound();
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionWrong++;
        currentStreak = 0;
      }
    }
    score.textContent = `Score: ${singlePlayerScore}`;
    
    setTimeout(() => {
      if (questionCount >= maxQuestions) {
        endGame();
      } else {
        startRound();
      }
    }, GAME_CONFIG.FEEDBACK_DELAY_NORMAL);
    
  } else if (gameMode === 'three-hearts') {
    if (selected === correct) {
      singlePlayerScore++;
      resultBox.textContent = `✅ Correct!`;
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionCorrect++;
        currentStreak++;
        if (currentStreak > bestSessionStreak) {
          bestSessionStreak = currentStreak;
        }
      }
    } else {
      livesRemaining--;
      timerDisplay.textContent = `❤️ Lives: ${livesRemaining}`;
      resultBox.textContent = `❌ Wrong! It was ${correct}`;
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionWrong++;
        currentStreak = 0;
      }

      if (livesRemaining <= 0) {
        setTimeout(() => {
          endGame();
        }, GAME_CONFIG.FEEDBACK_DELAY_NORMAL);
        return;
      }
    }
    score.textContent = `Score: ${singlePlayerScore}`;
    
    setTimeout(() => {
      resultBox.textContent = "";
      startRound();
    }, GAME_CONFIG.FEEDBACK_DELAY_FAST);
    
  } else {
    answered = true;
    clearInterval(timer);
    disableAnswers();

    if (selected === correct) {
      const points = calculatePoints();
      if (currentPlayer === 1) player1Score += points;
      else player2Score += points;
      resultBox.textContent = `✅ Correct! +${points} points`;
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionCorrect++;
        currentStreak++;
        if (currentStreak > bestSessionStreak) {
          bestSessionStreak = currentStreak;
        }
      }
    } else {
      resultBox.textContent = `❌ Wrong! It was ${correct}`;
      // Track stats for all supported topics
      if (trackedTopics.includes(currentTopic)) {
        currentSessionWrong++;
        currentStreak = 0;
      }
    }

    score.textContent = `P1: ${player1Score} | P2: ${player2Score}`;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    setTimeout(startRound, GAME_CONFIG.FEEDBACK_DELAY_SLOW);
  }
}

// ========================================
// 🚫 DISABLE BUTTONS AFTER ANSWER
// ========================================
function disableAnswers() {
  const buttons = answersDiv.querySelectorAll("button");
  buttons.forEach(btn => btn.disabled = true);
}

// ========================================
// 🏁 END GAME - SHOW FINAL SCORE
// ========================================
function endGame() {
  // Prevent double calls
  if (gameEnded) return;
  gameEnded = true;

  // SAVE STATS FIRST (completed = true because quiz finished naturally)
  const trackedTopics = ALL_TOPICS;
  if (trackedTopics.includes(currentTopic)) {
    saveQuizStats(currentTopic, true);
  }

  clearInterval(timer);
  answersDiv.innerHTML = "";
  flagImg.style.display = "none";;
  timerDisplay.textContent = "";
  question.textContent = "";
  questionCounter.style.display = "none";
  
  if (gameMode === 'time-attack') {
    resultBox.textContent = `GAME OVER - Final Score: ${singlePlayerScore}`;
    score.textContent = "";
  } else if (gameMode === 'casual') {
    resultBox.textContent = `GAME OVER - Score: ${singlePlayerScore}/${maxQuestions}`;
    score.textContent = "";
  } else if (gameMode === 'three-hearts') {
    resultBox.textContent = `GAME OVER - Final Score: ${singlePlayerScore}`;
    score.textContent = "";
  } else {
    resultBox.textContent = "GAME OVER";
    score.textContent = "";
  }
  
  playAgainBtn.style.display = "inline-block";
  mainMenuBtn.style.display = "inline-block";
}

// ========================================
// 🔄 END GAME BUTTONS - PLAY AGAIN
// ========================================
playAgainBtn.onclick = () => {
  playClickSound();
  resetGame();
  playAgainBtn.style.display = "none";
  mainMenuBtn.style.display = "none";
  
  if (gameMode === 'two') {
    maxQuestions = GAME_CONFIG.TWO_PLAYER_QUESTIONS;
  } else if (gameMode === 'casual') {
    maxQuestions = GAME_CONFIG.CASUAL_QUESTIONS;
  }
  
  if (gameMode === 'time-attack' || gameMode === 'casual' || gameMode === 'three-hearts') {
    score.textContent = "Score: 0";
  } else {
    score.textContent = "P1: 0 | P2: 0";
  }
  
  loadFlags();
};

// ========================================
// 🔄 END GAME BUTTONS - MAIN MENU
// ========================================
mainMenuBtn.onclick = () => {
  playClickSound();
  resetGame();
  questionCounter.style.display = "none";
  game.classList.add("hidden");
  home.classList.remove("hidden");
  playAgainBtn.style.display = "none";
  mainMenuBtn.style.display = "none";
};

// ========================================
// 🚀 COMING SOON TOPICS - PLACEHOLDER ALERTS
// ========================================
const comingSoonTopics = [
  'population', 'landmarks', 'currency', 'rivers', 'mountains', 'deserts', 'lakes',
  'oceans', 'volcanoes', 'earthquakes', 'gdp', 'weather', 'disasters',
  'africa', 'asia', 'europe', 'south-america', 'north-america', 'oceania',
  'borders-adv', 'area-adv', 'population-adv', 'density', 'wonders', 'parks',
  'timezones', 'extra', 'urbanization', 'megacities', 'biomes', 'climate',
  'agriculture', 'trade', 'travel', 'airports', 'navigation', 'gps', 'trivia'
];

comingSoonTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! 🚀");
    };
  }
});

// UNIFIED button handler for all JSON-based topics
JSON_TOPICS.forEach(topicId => {
  // Handle special button ID naming conventions
  let btnId;
  if (topicId === 'football') {
    btnId = 'football-general-topic-btn';
  } else if (topicId === 'movies') {
    btnId = 'movies-general-topic-btn';
  } else if (topicId === 'marvel') {
    btnId = 'marvel-movies-topic-btn';
  } else if (topicId === 'tv-shows') {
    btnId = 'tv-general-topic-btn';
  } else if (topicId === 'dc') {
    btnId = 'dc-movies-topic-btn';
  } else if (topicId === 'disney') {
    btnId = 'disney-movies-topic-btn';
  } else if (topicId === 'ottoman') {
    btnId = 'ottoman-empire-topic-btn';
  } else {
    btnId = `${topicId}-topic-btn`;
  }

  const btn = document.getElementById(btnId);
  if (btn) {
    btn.addEventListener('click', () => {
      playClickSound();
      const config = getTopicConfig(topicId);
      currentTopic = topicId;
      showUnifiedModeSelection(config.name, config.icon);
    });
  }
});

// Football topics placeholders (excluding football-general, premier-league, champions-league, world-cup, messi, ronaldo, and derbies which are implemented)
const footballTopics = [
  'uefa-euro', 'la-liga', 'serie-a', 'bundesliga', 'ligue-1',
  'ballon-dor', 'messi-ronaldo', 'current-stars', 'legends',
  'transfers', 'records', 'managers', 'iconic-matches',
  'historic-teams', 'stadiums', 'finals'
];

footballTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! ⚽");
    };
  }
});

// Movies topics placeholders (excluding dc, harry-potter, star-wars which are implemented)
const moviesTopics = [
  'pixar-movies', 'animated-movies', 'horror-movies',
  'action-movies', 'scifi-movies', 'comedy-movies', 'thriller-movies',
  'classic-movies', 'movie-quotes', 'movie-villains'
];

moviesTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! 🎬");
    };
  }
});

// TV Shows topics placeholders (excluding tv-general, sitcoms, game-of-thrones, breaking-bad, stranger-things, money-heist, the-office which are implemented)
const tvShowsTopics = [
  'animated-tv'
];

tvShowsTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! 📺");
    };
  }
});

// Logos topics placeholders (logos-general is now implemented as 'logos')
const logosTopics = [
  'brand-logos', 'car-logos', 'tech-logos',
  'fastfood-logos', 'football-club-logos', 'social-media-logos',
  'luxury-logos', 'app-icons', 'nba-logos', 'nfl-logos'
];

logosTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! ✨");
    };
  }
});

// History topics placeholders (excluding world-history, ancient-civs, ww2 which are implemented)
const historyTopics = [
  'greek-roman', 'medieval',
  'civil-war',
  'crusades', 'explorers', 'industrial-rev',
  'fall-rome', 'silk-road', 'famous-leaders', 'dictators', 'scientists',
  'inventors', 'historical-maps', 'battles', 'timeline', 'archaeology'
];

historyTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! 📜");
    };
  }
});

// Animals topics placeholders
const animalsTopics = [
  'animals-general', 'marine-animals', 'big-cats', 'dogs', 'cats',
  'birds', 'reptiles', 'dinosaurs', 'mythical', 'endangered',
  'fastest-animals', 'smartest-animals', 'predators-prey', 'weird-animals',
  'animal-patterns', 'farm-animals'
];

animalsTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! 🦁");
    };
  }
});

// Food topics placeholders
const foodTopics = [
  'food-trivia', 'world-cuisines', 'famous-dishes', 'desserts',
  'spices', 'fruits', 'vegetables', 'cheese', 'street-food',
  'fast-food', 'pizza', 'food-closeups', 'candy', 'chocolate'
];

foodTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      playClickSound();
      alert("Coming soon! 🍕");
    };
  }
});

// ========================================
// 🧭 BOTTOM NAV - SCREEN SWITCHING
// ========================================

const navHome = document.getElementById('nav-home');
const navTopics = document.getElementById('nav-topics');
const navSocial = document.getElementById('nav-social');
const navLeaderboard = document.getElementById('nav-leaderboard');
const navProfile = document.getElementById('nav-profile');

const homeView = document.getElementById('home-view');
const topicsView = document.getElementById('topics-view');
const profileView = document.getElementById('profile-view');
const socialView = document.getElementById('social-view');

const browseAllBtn = document.getElementById('browse-all-topics');

// ========================================
// 🎬 PREMIUM SCREEN TRANSITIONS
// ========================================

// Navigation order for directional slides (left to right)
const NAV_ORDER = ['home', 'topics', 'social', 'leaderboard', 'profile'];
let currentNavIndex = 0;

// Get all main views
const allViews = {
  home: homeView,
  topics: topicsView,
  social: socialView,
  leaderboard: document.getElementById('leaderboard-view'),
  profile: profileView
};

// Apply directional animation to a view (desktop only - disabled on mobile via CSS)
function applyNavAnimation(view, direction) {
  if (!view) return;
  
  // Skip animation logic on mobile for better Safari performance
  const isMobile = window.innerWidth <= 768;
  if (isMobile) return;
  
  // Remove any existing animation classes
  view.classList.remove('slide-from-left', 'slide-from-right', 'slide-from-bottom');
  
  // Force reflow to restart animation (desktop only)
  void view.offsetWidth;
  
  // Apply new animation class
  view.classList.add(`slide-from-${direction}`);
}

// Hide all views except the target
function hideAllViewsExcept(targetKey) {
  Object.keys(allViews).forEach(key => {
    if (allViews[key]) {
      if (key === targetKey) {
        allViews[key].classList.remove('hidden');
      } else {
        allViews[key].classList.add('hidden');
      }
    }
  });
}

// Show Home screen
function showHome() {
  clearViewingProfile(); // Clear any viewed profile state
  
  const newIndex = NAV_ORDER.indexOf('home');
  const direction = newIndex < currentNavIndex ? 'left' : 'right';
  currentNavIndex = newIndex;

  hideAllViewsExcept('home');
  applyNavAnimation(homeView, direction);

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navHome.classList.add('active');
  
  // Refresh Continue Playing section to show most recently played
  populateContinuePlaying();

  // Update mini stats
  populateMiniStats();
}

// Show Topics screen
function showTopics() {
  clearViewingProfile(); // Clear any viewed profile state
  
  const newIndex = NAV_ORDER.indexOf('topics');
  const direction = newIndex < currentNavIndex ? 'left' : 'right';
  currentNavIndex = newIndex;

  hideAllViewsExcept('topics');
  applyNavAnimation(topicsView, direction);

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navTopics.classList.add('active');
}

// Currently viewed profile data (null = viewing own profile)
let viewingProfileData = null;
let viewingProfileUserId = null;

// Get profile data - returns userData for self, or viewingProfileData for others
function getProfileData() {
  return viewingProfileData || userData;
}

// Check if viewing own profile
function isViewingOwnProfile() {
  return viewingProfileUserId === null;
}

// Show Profile screen (no animation - instant display)
// userId: optional - if provided, shows that user's profile; if null/undefined, shows own profile
function showProfile(userId = null) {
  // Store which profile we're viewing
  viewingProfileUserId = userId;
  
  if (userId && userId !== userData.odooId) {
    // Viewing another user's profile - load their data
    loadOtherUserProfile(userId);
  } else {
    // Viewing own profile
    viewingProfileData = null;
    viewingProfileUserId = null;
    displayProfile();
  }
}

// Display profile with current data (own or other user's)
function displayProfile() {
  currentNavIndex = NAV_ORDER.indexOf('profile');

  hideAllViewsExcept('profile');
  
  // Remove any animation classes for instant display
  profileView.classList.remove('slide-from-left', 'slide-from-right', 'slide-from-bottom');

  // Show/hide back button and settings based on profile ownership
  const backBtn = document.getElementById('profile-back-btn');
  const settingsBtn = document.getElementById('profile-settings-btn');
  const editBtn = document.querySelector('.profile-avatar-edit-btn');
  
  if (isViewingOwnProfile()) {
    // Viewing own profile - show settings, hide back
    if (backBtn) backBtn.classList.add('hidden');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
    if (editBtn) editBtn.classList.remove('hidden');
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    navProfile.classList.add('active');
  } else {
    // Viewing other's profile - show back, hide settings/edit
    if (backBtn) backBtn.classList.remove('hidden');
    if (settingsBtn) settingsBtn.classList.add('hidden');
    if (editBtn) editBtn.classList.add('hidden');
  }
  
  // Get the data to display (own or other user's)
  const profileData = getProfileData();
  
  // Update profile display with the data
  updateProfileDisplayWithData(profileData);
  
  // Populate stats section in profile
  populateStatsSectionWithData(profileData);
  
  // Update achievement count
  updateAchievementCountWithData(profileData);

  // Update best streak
  updateBestStreakDisplayWithData(profileData);
  
  // Update topic progress
  updateTopicProgressWithData(profileData);
}

// Go back from viewing another user's profile
function goBackFromProfile() {
  clearViewingProfile();
  // Go back to leaderboard (or could track previous location)
  showLeaderboard();
}

// Load another user's profile from Firebase
async function loadOtherUserProfile(userId) {
  console.log('👤 Loading profile for user:', userId);
  
  try {
    // Fetch user document from Firestore
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const data = userDoc.data();
      
      // Build profile data structure matching userData format
      viewingProfileData = {
        odooId: userId,
        profile: {
          username: data.profile?.username || 'Player',
          avatar: data.profile?.avatar || '👤',
          profilePicture: data.profile?.profilePicture || null,
          backgroundPicture: data.profile?.backgroundPicture || null,
          country: data.profile?.country || null,
          countryName: data.profile?.countryName || null
        },
        stats: {
          totalGames: data.stats?.totalGames || 0,
          correctAnswers: data.stats?.correctAnswers || 0,
          wrongAnswers: data.stats?.wrongAnswers || 0,
          accuracy: data.stats?.accuracy || 0,
          bestStreak: data.stats?.bestStreak || 0,
          totalTimeSeconds: data.stats?.totalTimeSeconds || 0,
          topics: data.stats?.topics || {}
        },
        achievements: {
          unlocked: data.achievements?.unlocked || []
        },
        prestige: {
          level: data.prestige?.level || 1,
          pxp: data.prestige?.pxp || 0,
          totalPxp: data.prestige?.totalPxp || 0
        }
      };
      
      console.log('👤 Profile loaded successfully:', viewingProfileData.profile.username);
    } else {
      console.log('👤 User not found, showing default profile');
      // User doesn't exist - show default empty profile
      viewingProfileData = {
        odooId: userId,
        profile: {
          username: 'Unknown Player',
          avatar: '👤',
          profilePicture: null,
          backgroundPicture: null,
          country: null,
          countryName: null
        },
        stats: {
          totalGames: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          accuracy: 0,
          bestStreak: 0,
          totalTimeSeconds: 0,
          topics: {}
        },
        achievements: {
          unlocked: []
        },
        prestige: {
          level: 1,
          pxp: 0,
          totalPxp: 0
        }
      };
    }
  } catch (error) {
    console.error('👤 Error loading profile:', error);
    // On error, show default profile
    viewingProfileData = {
      odooId: userId,
      profile: {
        username: 'Error Loading',
        avatar: '❌',
        profilePicture: null,
        backgroundPicture: null,
        country: null,
        countryName: null
      },
      stats: { totalGames: 0, correctAnswers: 0, wrongAnswers: 0, accuracy: 0, bestStreak: 0, totalTimeSeconds: 0, topics: {} },
      achievements: { unlocked: [] },
      prestige: { level: 1, pxp: 0, totalPxp: 0 }
    };
  }
  
  // Display the profile
  displayProfile();
}

// Clear viewed profile state (call when leaving profile)
function clearViewingProfile() {
  viewingProfileData = null;
  viewingProfileUserId = null;
}

// Nav button click handlers - using addEventListener for iOS compatibility
navHome.addEventListener('click', () => {
  playClickSound();
  showHome();
});

navTopics.addEventListener('click', () => {
  playClickSound();
  showTopics();
});

// Browse All Topics button (on home screen) - DEPRECATED, kept for compatibility
if (browseAllBtn) {
  browseAllBtn.addEventListener('click', () => {
    playClickSound();
    showTopics();
  });
}

// ========================================
// 🏠 HOME PAGE - CATEGORY MODAL
// ========================================
const categoryModal = document.getElementById('category-modal');
const categoryModalBackdrop = document.getElementById('category-modal-backdrop');
const categoryModalClose = document.getElementById('category-modal-close');
const categoryModalTitle = document.getElementById('category-modal-title');
const categoryModalQuizzes = document.getElementById('category-modal-quizzes');

// Category quiz mappings - maps category to section class in topics-view
const categoryMappings = {
  geography: {
    title: '🌍 Geography',
    sectionClass: 'geography-section'
  },
  football: {
    title: '⚽ Football',
    sectionClass: 'football-section'
  },
  movies: {
    title: '🎬 Movies',
    sectionClass: 'movies-section'
  },
  tvshows: {
    title: '📺 TV Shows',
    sectionClass: 'tvshows-section'
  },
  history: {
    title: '📜 History',
    sectionClass: 'history-section'
  },
  logos: {
    title: '🎨 Logos',
    sectionClass: 'logos-section'
  }
};

// Open category modal
function openCategoryModal(category) {
  const mapping = categoryMappings[category];
  if (!mapping) return;

  // Set title
  categoryModalTitle.textContent = mapping.title;

  // Get quiz cards from the topics-view section
  const section = document.querySelector(`.${mapping.sectionClass}`);
  if (!section) return;

  // Clone the quiz cards (only status-active ones with fancy cards)
  const quizCards = section.querySelectorAll('.status-active');
  categoryModalQuizzes.innerHTML = '';

  quizCards.forEach(card => {
    const clone = card.cloneNode(true);
    // Add click handler to close modal when quiz is selected
    const button = clone.querySelector('button');
    if (button) {
      const originalId = button.id;
      button.removeAttribute('id'); // Remove ID from clone to avoid duplicates
      button.addEventListener('click', (e) => {
        e.preventDefault();
        closeCategoryModal();
        // Trigger the original button click
        const originalBtn = document.getElementById(originalId);
        if (originalBtn) {
          setTimeout(() => originalBtn.click(), 100);
        }
      });
    }
    categoryModalQuizzes.appendChild(clone);
  });

  // Show modal
  categoryModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scroll
}

// Close category modal
function closeCategoryModal() {
  categoryModal.classList.add('hidden');
  document.body.style.overflow = ''; // Restore scroll
}

// Event listeners for category cards
document.querySelectorAll('.home-category-card').forEach(card => {
  card.addEventListener('click', () => {
    playClickSound();
    const category = card.dataset.category;
    openCategoryModal(category);
  });
});

// Event listeners for compact category cards (new home layout)
document.querySelectorAll('.home-category-card-compact').forEach(card => {
  card.addEventListener('click', () => {
    playClickSound();
    const category = card.dataset.category;
    openCategoryModal(category);
  });
});

// Close modal on backdrop click
if (categoryModalBackdrop) {
  categoryModalBackdrop.addEventListener('click', () => {
    playClickSound();
    closeCategoryModal();
  });
}

// Close modal on X button click
if (categoryModalClose) {
  categoryModalClose.addEventListener('click', () => {
    playClickSound();
    closeCategoryModal();
  });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (categoryModal && !categoryModal.classList.contains('hidden')) {
      closeCategoryModal();
    }
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
      closeSettingsModal();
    }
    // Close slot modal on Escape
    const slotModal = document.getElementById('slot-modal');
    if (slotModal && !slotModal.classList.contains('hidden')) {
      closeSlotModal();
    }
  }
});

// ========================================
// ⚙️ SETTINGS MODAL
// ========================================
const settingsModal = document.getElementById('settings-modal');
const settingsModalBackdrop = document.getElementById('settings-modal-backdrop');
const settingsModalClose = document.getElementById('settings-modal-close');
// Language select dropdown removed - now using Language Manager modal
const profileSettingsBtn = document.querySelector('.profile-settings');

// Open settings modal
function openSettingsModal() {
  if (settingsModal) {
    // Update current language display
    updateCurrentLanguageDisplay();
    settingsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

// Close settings modal
function closeSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Settings button in Profile page
if (profileSettingsBtn) {
  profileSettingsBtn.addEventListener('click', () => {
    playClickSound();
    openSettingsModal();
  });
}

// Close on backdrop click
if (settingsModalBackdrop) {
  settingsModalBackdrop.addEventListener('click', () => {
    playClickSound();
    closeSettingsModal();
  });
}

// Close on X button
if (settingsModalClose) {
  settingsModalClose.addEventListener('click', () => {
    playClickSound();
    closeSettingsModal();
  });
}

// Language change is now handled by the Language Manager modal


// ========================================
// 🔊 SOUND SYSTEM
// ========================================

// Sound settings from localStorage
const defaultSoundSettings = {
  sfxVolume: 70,
  sfxMuted: false,
  musicVolume: 70,
  musicMuted: false
};

let soundSettings = JSON.parse(localStorage.getItem('quizzena_sound_settings')) || { ...defaultSoundSettings };

// Galaxy Background Setting (Performance Mode)
let galaxyModeEnabled = localStorage.getItem('quizzena_galaxy_mode') !== 'false'; // Default: true (ON)

function saveGalaxyModeSetting() {
  localStorage.setItem('quizzena_galaxy_mode', galaxyModeEnabled.toString());
}

// Initialize galaxy mode toggle
function initGalaxyModeToggle() {
  const toggle = document.getElementById('galaxy-mode-toggle');
  if (toggle) {
    toggle.checked = galaxyModeEnabled;
    toggle.addEventListener('change', () => {
      galaxyModeEnabled = toggle.checked;
      saveGalaxyModeSetting();
    });
  }
}

// 3D Card Transitions Setting
let card3dModeEnabled = localStorage.getItem('quizzena_card3d_mode') === 'true'; // Default: false (OFF)

function saveCard3dModeSetting() {
  localStorage.setItem('quizzena_card3d_mode', card3dModeEnabled.toString());
}

// Initialize 3D card mode toggle
function initCard3dModeToggle() {
  const toggle = document.getElementById('card3d-mode-toggle');
  if (toggle) {
    toggle.checked = card3dModeEnabled;
    toggle.addEventListener('change', () => {
      card3dModeEnabled = toggle.checked;
      saveCard3dModeSetting();
    });
  }
}

// Initialize Extra Effects expandable section
function initExtraEffectsToggle() {
  const btn = document.getElementById('settings-extra-effects-btn');
  const content = document.getElementById('extra-effects-content');
  const arrow = document.getElementById('extra-effects-arrow');
  
  if (btn && content && arrow) {
    btn.addEventListener('click', () => {
      playClickSound();
      content.classList.toggle('hidden');
      arrow.classList.toggle('rotated');
    });
  }
}

// Sound effect audio elements
const clickSound = new Audio('sounds/click.mp3');
const xpFillSound = new Audio('sounds/xp-fill.mp3');
const levelUpSound = new Audio('sounds/level-up.mp3');
const correctSound = new Audio('sounds/correct.mp3');
const wrongSound = new Audio('sounds/wrong.mp3');

// Preload all sounds
clickSound.preload = 'auto';
xpFillSound.preload = 'auto';
levelUpSound.preload = 'auto';
correctSound.preload = 'auto';
wrongSound.preload = 'auto';

// Add error handlers to debug sound loading
clickSound.onerror = () => console.error('❌ Failed to load click.mp3');
xpFillSound.onerror = () => console.error('❌ Failed to load xp-fill.mp3');
levelUpSound.onerror = () => console.error('❌ Failed to load level-up.mp3');
correctSound.onerror = () => console.error('❌ Failed to load correct.mp3');
wrongSound.onerror = () => console.error('❌ Failed to load wrong.mp3');

// Log when sounds are loaded
clickSound.oncanplaythrough = () => console.log('✅ click.mp3 loaded');
correctSound.oncanplaythrough = () => console.log('✅ correct.mp3 loaded');
wrongSound.oncanplaythrough = () => console.log('✅ wrong.mp3 loaded');

// Audio unlock flag
let audioUnlocked = false;

// Unlock all audio on first user interaction (browser autoplay policy)
function unlockAudio() {
  if (audioUnlocked) return;
  
  const sounds = [clickSound, xpFillSound, levelUpSound, correctSound, wrongSound];
  sounds.forEach(sound => {
    // Play and immediately pause to unlock
    sound.volume = 0;
    sound.play().then(() => {
      sound.pause();
      sound.currentTime = 0;
      console.log('🔓 Audio unlocked:', sound.src);
    }).catch((e) => {
      console.log('⚠️ Audio unlock failed:', e.message);
    });
  });
  
  audioUnlocked = true;
  console.log('🔊 Audio system unlocked');
}

// Add unlock listeners
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

// XP Fill sound duration (animation is 2.2 seconds, sound is 4s but we stop it)
const XP_FILL_DURATION = 2200; // 2.2 seconds

// Sound Effects settings (with master toggle)
const defaultSfxSettings = {
  masterMuted: false,   // Master mute for all SFX
  masterVolume: 70,     // Master volume (sets all when adjusted)
  clickVolume: 70,
  clickMuted: false,
  xpFillVolume: 70,
  xpFillMuted: false,
  levelUpVolume: 70,
  levelUpMuted: false,
  correctVolume: 70,
  correctMuted: false,
  wrongVolume: 70,
  wrongMuted: false
};

// Load settings from localStorage, merge with defaults to ensure all keys exist
let sfxSettings = { ...defaultSfxSettings, ...JSON.parse(localStorage.getItem('quizzena_sfx_settings') || '{}') };
console.log('🔊 SFX Settings loaded:', sfxSettings);

function saveSfxSettings() {
  localStorage.setItem('quizzena_sfx_settings', JSON.stringify(sfxSettings));
}

// Apply master volume to all sound effects
function applyMasterVolume(volume) {
  sfxSettings.masterVolume = volume;
  sfxSettings.clickVolume = volume;
  sfxSettings.xpFillVolume = volume;
  sfxSettings.levelUpVolume = volume;
  sfxSettings.correctVolume = volume;
  sfxSettings.wrongVolume = volume;
  saveSfxSettings();
  updateAllSfxVolumeUI();
}

// Toggle master mute (mutes/unmutes all)
function toggleMasterMute() {
  sfxSettings.masterMuted = !sfxSettings.masterMuted;
  if (sfxSettings.masterMuted) {
    // Mute all
    sfxSettings.clickMuted = true;
    sfxSettings.xpFillMuted = true;
    sfxSettings.levelUpMuted = true;
    sfxSettings.correctMuted = true;
    sfxSettings.wrongMuted = true;
  } else {
    // Unmute all
    sfxSettings.clickMuted = false;
    sfxSettings.xpFillMuted = false;
    sfxSettings.levelUpMuted = false;
    sfxSettings.correctMuted = false;
    sfxSettings.wrongMuted = false;
  }
  saveSfxSettings();
  updateAllSfxMuteUI();
}

// Update all SFX volume UI elements
function updateAllSfxVolumeUI() {
  const masterSlider = document.getElementById('sfx-master-volume-slider');
  const masterValue = document.getElementById('sfx-master-volume-value');
  const clickSlider = document.getElementById('sfx-volume-slider');
  const clickValue = document.getElementById('sfx-volume-value');
  const xpFillSlider = document.getElementById('xpfill-volume-slider');
  const xpFillValue = document.getElementById('xpfill-volume-value');
  const levelUpSlider = document.getElementById('levelup-volume-slider');
  const levelUpValue = document.getElementById('levelup-volume-value');
  const correctSlider = document.getElementById('correct-volume-slider');
  const correctValue = document.getElementById('correct-volume-value');
  const wrongSlider = document.getElementById('wrong-volume-slider');
  const wrongValue = document.getElementById('wrong-volume-value');

  if (masterSlider) masterSlider.value = sfxSettings.masterVolume;
  if (masterValue) masterValue.textContent = sfxSettings.masterVolume + '%';
  if (clickSlider) clickSlider.value = sfxSettings.clickVolume;
  if (clickValue) clickValue.textContent = sfxSettings.clickVolume + '%';
  if (xpFillSlider) xpFillSlider.value = sfxSettings.xpFillVolume;
  if (xpFillValue) xpFillValue.textContent = sfxSettings.xpFillVolume + '%';
  if (levelUpSlider) levelUpSlider.value = sfxSettings.levelUpVolume;
  if (levelUpValue) levelUpValue.textContent = sfxSettings.levelUpVolume + '%';
  if (correctSlider) correctSlider.value = sfxSettings.correctVolume;
  if (correctValue) correctValue.textContent = sfxSettings.correctVolume + '%';
  if (wrongSlider) wrongSlider.value = sfxSettings.wrongVolume;
  if (wrongValue) wrongValue.textContent = sfxSettings.wrongVolume + '%';
}

// Update all SFX mute button UIs
function updateAllSfxMuteUI() {
  updateMasterMuteUI();
  updateClickMuteUI();
  updateXpFillMuteUI();
  updateLevelUpMuteUI();
  updateCorrectMuteUI();
  updateWrongMuteUI();
}

function updateMasterMuteUI() {
  const btn = document.getElementById('sfx-master-mute-btn');
  const icon = document.getElementById('sfx-master-mute-icon');
  const text = btn ? btn.querySelector('.mute-text') : null;
  if (!btn || !icon) return;
  if (sfxSettings.masterMuted) {
    btn.classList.add('muted');
    btn.style.background = 'rgba(239, 68, 68, 0.3)';
    btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    icon.textContent = '🔇';
    if (text) text.textContent = 'Unmute All';
  } else {
    btn.classList.remove('muted');
    btn.style.background = '';
    btn.style.borderColor = '';
    icon.textContent = '🔊';
    if (text) text.textContent = 'Mute All';
  }
}

function updateClickMuteUI() {
  const btn = document.getElementById('sfx-mute-btn');
  const icon = document.getElementById('sfx-mute-icon');
  if (!btn || !icon) return;
  if (sfxSettings.clickMuted) {
    btn.classList.add('muted');
    btn.style.background = 'rgba(239, 68, 68, 0.3)';
    btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    icon.textContent = '🔇';
  } else {
    btn.classList.remove('muted');
    btn.style.background = '';
    btn.style.borderColor = '';
    icon.textContent = '👆';
  }
}

function updateXpFillMuteUI() {
  const btn = document.getElementById('xpfill-mute-btn');
  const icon = document.getElementById('xpfill-mute-icon');
  if (!btn || !icon) return;
  if (sfxSettings.xpFillMuted) {
    btn.classList.add('muted');
    btn.style.background = 'rgba(239, 68, 68, 0.3)';
    btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    icon.textContent = '🔇';
  } else {
    btn.classList.remove('muted');
    btn.style.background = '';
    btn.style.borderColor = '';
    icon.textContent = '⬆️';
  }
}

// Play XP Fill sound (4s file, stops at 2.2s when animation ends)
function playXpFillSound() {
  if (sfxSettings.masterMuted || sfxSettings.xpFillMuted) return;

  xpFillSound.volume = sfxSettings.xpFillVolume / 100;
  xpFillSound.currentTime = 0;
  xpFillSound.play().catch(err => {
    console.log('XP Fill sound blocked:', err.message);
  });
}

function stopXpFillSound() {
  xpFillSound.pause();
  xpFillSound.currentTime = 0;
}

// Play Level Up sound (when player levels up)
function playLevelUpSound() {
  if (sfxSettings.masterMuted || sfxSettings.levelUpMuted) return;

  levelUpSound.volume = sfxSettings.levelUpVolume / 100;
  levelUpSound.currentTime = 0;
  levelUpSound.play().catch(err => {
    console.log('Level Up sound blocked:', err.message);
  });
}

// Update Level Up mute UI
function updateLevelUpMuteUI() {
  const btn = document.getElementById('levelup-mute-btn');
  const icon = document.getElementById('levelup-mute-icon');
  if (!btn || !icon) return;
  if (sfxSettings.levelUpMuted) {
    btn.classList.add('muted');
    btn.style.background = 'rgba(239, 68, 68, 0.3)';
    btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    icon.textContent = '🔇';
  } else {
    btn.classList.remove('muted');
    btn.style.background = '';
    btn.style.borderColor = '';
    icon.textContent = '🎉';
  }
}

// Play Correct answer sound
function playCorrectSound() {
  console.log('🎵 playCorrectSound called, masterMuted:', sfxSettings.masterMuted, 'correctMuted:', sfxSettings.correctMuted);
  if (sfxSettings.masterMuted || sfxSettings.correctMuted) {
    console.log('🔇 Correct sound muted, not playing');
    return;
  }
  correctSound.volume = sfxSettings.correctVolume / 100;
  correctSound.currentTime = 0;
  correctSound.play().then(() => {
    console.log('✅ Correct sound playing');
  }).catch(err => {
    console.error('❌ Correct sound blocked:', err.message);
  });
}

// Play Wrong answer sound
function playWrongSound() {
  console.log('🎵 playWrongSound called, masterMuted:', sfxSettings.masterMuted, 'wrongMuted:', sfxSettings.wrongMuted);
  if (sfxSettings.masterMuted || sfxSettings.wrongMuted) {
    console.log('🔇 Wrong sound muted, not playing');
    return;
  }
  wrongSound.volume = sfxSettings.wrongVolume / 100;
  wrongSound.currentTime = 0;
  wrongSound.play().then(() => {
    console.log('✅ Wrong sound playing');
  }).catch(err => {
    console.error('❌ Wrong sound blocked:', err.message);
  });
}

// Update Correct mute UI
function updateCorrectMuteUI() {
  const btn = document.getElementById('correct-mute-btn');
  const icon = document.getElementById('correct-mute-icon');
  if (!btn || !icon) return;
  if (sfxSettings.correctMuted) {
    btn.classList.add('muted');
    btn.style.background = 'rgba(239, 68, 68, 0.3)';
    btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    icon.textContent = '🔇';
  } else {
    btn.classList.remove('muted');
    btn.style.background = '';
    btn.style.borderColor = '';
    icon.textContent = '✅';
  }
}

// Update Wrong mute UI
function updateWrongMuteUI() {
  const btn = document.getElementById('wrong-mute-btn');
  const icon = document.getElementById('wrong-mute-icon');
  if (!btn || !icon) return;
  if (sfxSettings.wrongMuted) {
    btn.classList.add('muted');
    btn.style.background = 'rgba(239, 68, 68, 0.3)';
    btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    icon.textContent = '🔇';
  } else {
    btn.classList.remove('muted');
    btn.style.background = '';
    btn.style.borderColor = '';
    icon.textContent = '❌';
  }
}

// Background music audio element
const backgroundMusic = new Audio('sounds/background-music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3; // Default 30%

// Music settings
let musicSettings = JSON.parse(localStorage.getItem('quizzena_music_settings')) || {
  musicVolume: 30,
  musicMuted: false
};

function saveMusicSettings() {
  localStorage.setItem('quizzena_music_settings', JSON.stringify(musicSettings));
}

// Start background music (call after user interaction)
let musicStarted = false;
function startBackgroundMusic() {
  if (musicStarted || musicSettings.musicMuted) return;
  
  backgroundMusic.volume = musicSettings.musicVolume / 100;
  backgroundMusic.play().catch(err => {
    console.log('Music autoplay blocked:', err.message);
  });
  musicStarted = true;
}

// Update music volume
function updateMusicVolume(volume) {
  musicSettings.musicVolume = volume;
  backgroundMusic.volume = volume / 100;
  saveMusicSettings();
}

// Toggle music mute
function toggleMusicMute() {
  musicSettings.musicMuted = !musicSettings.musicMuted;
  if (musicSettings.musicMuted) {
    backgroundMusic.pause();
  } else {
    backgroundMusic.volume = musicSettings.musicVolume / 100;
    backgroundMusic.play().catch(() => {});
    musicStarted = true;
  }
  saveMusicSettings();
  updateMusicMuteButtonUI();
}

// Update music mute button UI
function updateMusicMuteButtonUI() {
  const musicMuteBtn = document.getElementById('music-mute-btn');
  const musicMuteIcon = document.getElementById('music-mute-icon');
  if (!musicMuteBtn || !musicMuteIcon) return;

  if (musicSettings.musicMuted) {
    musicMuteBtn.classList.add('muted');
    musicMuteIcon.textContent = '🔇';
  } else {
    musicMuteBtn.classList.remove('muted');
    musicMuteIcon.textContent = '🎵';
  }
}

// Initialize music controls
function initMusicControls() {
  const musicVolumeSlider = document.getElementById('music-volume-slider');
  const musicVolumeValue = document.getElementById('music-volume-value');
  const musicMuteBtn = document.getElementById('music-mute-btn');

  if (musicVolumeSlider) {
    musicVolumeSlider.value = musicSettings.musicVolume;
    musicVolumeSlider.addEventListener('input', (e) => {
      const volume = parseInt(e.target.value);
      updateMusicVolume(volume);
      if (musicVolumeValue) musicVolumeValue.textContent = volume + '%';
    });
  }

  if (musicVolumeValue) {
    musicVolumeValue.textContent = musicSettings.musicVolume + '%';
  }

  if (musicMuteBtn) {
    musicMuteBtn.addEventListener('click', toggleMusicMute);
  }

  updateMusicMuteButtonUI();
}

// Save sound settings
function saveSoundSettings() {
  localStorage.setItem('quizzena_sound_settings', JSON.stringify(soundSettings));
}

// Play click sound effect
function playClickSound() {
  if (sfxSettings.masterMuted || sfxSettings.clickMuted) return;
  
  clickSound.volume = sfxSettings.clickVolume / 100;
  clickSound.currentTime = 0;
  clickSound.play().catch(err => {
    // Ignore autoplay errors (user hasn't interacted yet)
    console.log('Sound play blocked:', err.message);
  });
}

// Sound Overlay Elements
const soundOverlay = document.getElementById('sound-overlay');
const soundOverlayBackdrop = document.getElementById('sound-overlay-backdrop');
const soundOverlayBack = document.getElementById('sound-overlay-back');
const settingsSoundBtn = document.getElementById('settings-sound-btn');
const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
const sfxVolumeValue = document.getElementById('sfx-volume-value');
const sfxMuteBtn = document.getElementById('sfx-mute-btn');
const sfxMuteIcon = document.getElementById('sfx-mute-icon');

// Open Sound Overlay (from Settings)
function openSoundOverlay() {
  if (soundOverlay) {
    // Update SFX UI with current settings
    if (sfxVolumeSlider) sfxVolumeSlider.value = soundSettings.sfxVolume;
    if (sfxVolumeValue) sfxVolumeValue.textContent = soundSettings.sfxVolume + '%';
    updateMuteButtonUI();

    // Update Music UI with current settings
    const musicVolumeSlider = document.getElementById('music-volume-slider');
    const musicVolumeValue = document.getElementById('music-volume-value');
    if (musicVolumeSlider) musicVolumeSlider.value = musicSettings.musicVolume;
    if (musicVolumeValue) musicVolumeValue.textContent = musicSettings.musicVolume + '%';
    updateMusicMuteButtonUI();
    
    soundOverlay.classList.remove('hidden');
  }
}

// Close Sound Overlay (back to Settings)
function closeSoundOverlay() {
  if (soundOverlay) {
    soundOverlay.classList.add('hidden');
  }
}

// Open Music Overlay
function openMusicOverlay() {
  const musicOverlay = document.getElementById('music-overlay');
  if (musicOverlay) {
    // Update Music UI
    const musicVolumeSlider = document.getElementById('music-volume-slider');
    const musicVolumeValue = document.getElementById('music-volume-value');
    if (musicVolumeSlider) musicVolumeSlider.value = musicSettings.musicVolume;
    if (musicVolumeValue) musicVolumeValue.textContent = musicSettings.musicVolume + '%';
    updateMusicMuteButtonUI();
    
    musicOverlay.classList.remove('hidden');
  }
}

// Close Music Overlay
function closeMusicOverlay() {
  const musicOverlay = document.getElementById('music-overlay');
  if (musicOverlay) {
    musicOverlay.classList.add('hidden');
  }
}

// Open Sound Effects Overlay
function openSfxOverlay() {
  const sfxOverlay = document.getElementById('sfx-overlay');
  if (sfxOverlay) {
    // Update all SFX UI
    updateAllSfxVolumeUI();
    updateAllSfxMuteUI();
    sfxOverlay.classList.remove('hidden');
  }
}

// Initialize all SFX controls
function initSfxControls() {
  // Master controls
  const masterSlider = document.getElementById('sfx-master-volume-slider');
  const masterMuteBtn = document.getElementById('sfx-master-mute-btn');
  
  if (masterSlider) {
    masterSlider.value = sfxSettings.masterVolume;
    masterSlider.addEventListener('input', (e) => {
      applyMasterVolume(parseInt(e.target.value));
    });
  }
  
  if (masterMuteBtn) {
    masterMuteBtn.addEventListener('click', () => {
      toggleMasterMute();
    });
  }
  
  // Click controls
  const clickSlider = document.getElementById('sfx-volume-slider');
  const clickMuteBtn = document.getElementById('sfx-mute-btn');
  
  if (clickSlider) {
    clickSlider.value = sfxSettings.clickVolume;
    clickSlider.addEventListener('input', (e) => {
      sfxSettings.clickVolume = parseInt(e.target.value);
      const clickValue = document.getElementById('sfx-volume-value');
      if (clickValue) clickValue.textContent = sfxSettings.clickVolume + '%';
      saveSfxSettings();
      playClickSound(); // Preview
    });
  }
  
  if (clickMuteBtn) {
    clickMuteBtn.addEventListener('click', () => {
      sfxSettings.clickMuted = !sfxSettings.clickMuted;
      // If unmuting individual, also unmute master
      if (!sfxSettings.clickMuted && sfxSettings.masterMuted) {
        sfxSettings.masterMuted = false;
        updateMasterMuteUI();
      }
      saveSfxSettings();
      updateClickMuteUI();
      if (!sfxSettings.clickMuted) playClickSound();
    });
  }
  
  // XP Fill controls
  const xpFillSlider = document.getElementById('xpfill-volume-slider');
  const xpFillMuteBtn = document.getElementById('xpfill-mute-btn');
  
  if (xpFillSlider) {
    xpFillSlider.value = sfxSettings.xpFillVolume;
    xpFillSlider.addEventListener('input', (e) => {
      sfxSettings.xpFillVolume = parseInt(e.target.value);
      const xpFillValue = document.getElementById('xpfill-volume-value');
      if (xpFillValue) xpFillValue.textContent = sfxSettings.xpFillVolume + '%';
      saveSfxSettings();
    });
  }
  
  if (xpFillMuteBtn) {
    xpFillMuteBtn.addEventListener('click', () => {
      sfxSettings.xpFillMuted = !sfxSettings.xpFillMuted;
      // If unmuting individual, also unmute master
      if (!sfxSettings.xpFillMuted && sfxSettings.masterMuted) {
        sfxSettings.masterMuted = false;
        updateMasterMuteUI();
      }
      saveSfxSettings();
      updateXpFillMuteUI();
    });
  }

  // Level Up controls
  const levelUpSlider = document.getElementById('levelup-volume-slider');
  const levelUpMuteBtn = document.getElementById('levelup-mute-btn');

  if (levelUpSlider) {
    levelUpSlider.value = sfxSettings.levelUpVolume;
    levelUpSlider.addEventListener('input', (e) => {
      sfxSettings.levelUpVolume = parseInt(e.target.value);
      const levelUpValue = document.getElementById('levelup-volume-value');
      if (levelUpValue) levelUpValue.textContent = sfxSettings.levelUpVolume + '%';
      saveSfxSettings();
    });
  }

  if (levelUpMuteBtn) {
    levelUpMuteBtn.addEventListener('click', () => {
      sfxSettings.levelUpMuted = !sfxSettings.levelUpMuted;
      // If unmuting individual, also unmute master
      if (!sfxSettings.levelUpMuted && sfxSettings.masterMuted) {
        sfxSettings.masterMuted = false;
        updateMasterMuteUI();
      }
      saveSfxSettings();
      updateLevelUpMuteUI();
    });
  }

  // Correct answer controls
  const correctSlider = document.getElementById('correct-volume-slider');
  const correctMuteBtn = document.getElementById('correct-mute-btn');

  if (correctSlider) {
    correctSlider.value = sfxSettings.correctVolume;
    correctSlider.addEventListener('input', (e) => {
      sfxSettings.correctVolume = parseInt(e.target.value);
      const correctValue = document.getElementById('correct-volume-value');
      if (correctValue) correctValue.textContent = sfxSettings.correctVolume + '%';
      saveSfxSettings();
    });
    // Preview sound on slider release
    correctSlider.addEventListener('change', () => {
      if (!sfxSettings.correctMuted && !sfxSettings.masterMuted) {
        playCorrectSound();
      }
    });
  }

  if (correctMuteBtn) {
    correctMuteBtn.addEventListener('click', () => {
      sfxSettings.correctMuted = !sfxSettings.correctMuted;
      if (!sfxSettings.correctMuted && sfxSettings.masterMuted) {
        sfxSettings.masterMuted = false;
        updateMasterMuteUI();
      }
      saveSfxSettings();
      updateCorrectMuteUI();
      // Preview sound when unmuting
      if (!sfxSettings.correctMuted && !sfxSettings.masterMuted) {
        playCorrectSound();
      }
    });
  }

  // Wrong answer controls
  const wrongSlider = document.getElementById('wrong-volume-slider');
  const wrongMuteBtn = document.getElementById('wrong-mute-btn');

  if (wrongSlider) {
    wrongSlider.value = sfxSettings.wrongVolume;
    wrongSlider.addEventListener('input', (e) => {
      sfxSettings.wrongVolume = parseInt(e.target.value);
      const wrongValue = document.getElementById('wrong-volume-value');
      if (wrongValue) wrongValue.textContent = sfxSettings.wrongVolume + '%';
      saveSfxSettings();
    });
    // Preview sound on slider release
    wrongSlider.addEventListener('change', () => {
      if (!sfxSettings.wrongMuted && !sfxSettings.masterMuted) {
        playWrongSound();
      }
    });
  }

  if (wrongMuteBtn) {
    wrongMuteBtn.addEventListener('click', () => {
      sfxSettings.wrongMuted = !sfxSettings.wrongMuted;
      if (!sfxSettings.wrongMuted && sfxSettings.masterMuted) {
        sfxSettings.masterMuted = false;
        updateMasterMuteUI();
      }
      saveSfxSettings();
      updateWrongMuteUI();
      // Preview sound when unmuting
      if (!sfxSettings.wrongMuted && !sfxSettings.masterMuted) {
        playWrongSound();
      }
    });
  }

  // Initialize UI
  updateAllSfxMuteUI();
}

// Close Sound Effects Overlay
function closeSfxOverlay() {
  const sfxOverlay = document.getElementById('sfx-overlay');
  if (sfxOverlay) {
    sfxOverlay.classList.add('hidden');
  }
}

// Update mute button UI
function updateMuteButtonUI() {
  if (!sfxMuteBtn || !sfxMuteIcon) return;
  
  if (soundSettings.sfxMuted) {
    sfxMuteBtn.classList.add('muted');
    sfxMuteIcon.textContent = '🔇';
  } else {
    sfxMuteBtn.classList.remove('muted');
    sfxMuteIcon.textContent = '🔊';
  }
}

// Settings Sound button click -> open Sound Overlay
if (settingsSoundBtn) {
  settingsSoundBtn.addEventListener('click', () => {
    playClickSound();
    openSoundOverlay();
  });
}

// Back button in Sound Overlay -> close and return to Settings
if (soundOverlayBack) {
  soundOverlayBack.addEventListener('click', () => {
    playClickSound();
    closeSoundOverlay();
  });
}

// Close on backdrop click
if (soundOverlayBackdrop) {
  soundOverlayBackdrop.addEventListener('click', () => {
    playClickSound();
    closeSoundOverlay();
  });
}

// Volume slider change
if (sfxVolumeSlider) {
  sfxVolumeSlider.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    soundSettings.sfxVolume = volume;
    if (sfxVolumeValue) sfxVolumeValue.textContent = volume + '%';
    saveSoundSettings();
    
    // Play test sound
    playClickSound();
  });
}

// Mute button click
if (sfxMuteBtn) {
  sfxMuteBtn.addEventListener('click', () => {
    soundSettings.sfxMuted = !soundSettings.sfxMuted;
    updateMuteButtonUI();
    saveSoundSettings();
    
    // Play sound if unmuting
    if (!soundSettings.sfxMuted) {
      playClickSound();
    }
  });
}

// Close Sound Overlay on Escape (but keep Settings open)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && soundOverlay && !soundOverlay.classList.contains('hidden')) {
    closeSoundOverlay();
    e.stopPropagation();
  }
});

// Leaderboard button - using addEventListener for iOS compatibility
navLeaderboard.addEventListener('click', () => {
  playClickSound();
  showLeaderboard();
});

// navSocial click is handled via onclick in HTML (openSocialTeaser)

navProfile.addEventListener('click', () => {
  playClickSound();
  showProfile();
});

// Settings button - now handled by openSettingsModal() above

// ============================================
// 🎮 UNIFIED QUIZ SYSTEM - ALL QUIZZES USE THIS
// ============================================

// Get topic image path based on topic ID
function getTopicImagePath(topicId) {
  const config = TOPIC_CONFIG[topicId];
  if (!config) return 'icons/topics/geography/flags.png';
  
  const category = config.category;
  const imageName = topicId.replace(/-/g, '-');
  
  // Map topic IDs to their image file names
  const imageMap = {
    // Geography
    'flags': 'icons/topics/geography/flags.png',
    'capitals': 'icons/topics/geography/capitals.png',
    'borders': 'icons/topics/geography/flags.png',
    'area': 'icons/topics/geography/area.png',
    // Football
    'football': 'icons/topics/football/football.png',
    'premier-league': 'icons/topics/football/premier-league.png',
    'champions-league': 'icons/topics/football/champions-league.png',
    'world-cup': 'icons/topics/football/world-cup.png',
    'messi': 'icons/topics/football/messi.png',
    'ronaldo': 'icons/topics/football/ronaldo.png',
    'derbies': 'icons/topics/football/derbies.png',
    // History
    'world-history': 'icons/topics/history/world-history.png',
    'ancient-civs': 'icons/topics/history/ancient-civilizations.png',
    'ww2': 'icons/topics/history/wwii.png',
    'ww1': 'icons/topics/history/wwi.png',
    'egyptian': 'icons/topics/history/egyptian.png',
    'roman-empire': 'icons/topics/history/roman-empire.png',
    'ottoman': 'icons/topics/history/ottoman-empire.png',
    'british-monarchy': 'icons/topics/history/british-monarchy.png',
    'cold-war': 'icons/topics/history/cold-war.png',
    // Movies
    'movies': 'icons/topics/movies/movies.png',
    'marvel': 'icons/topics/movies/marvel.png',
    'dc': 'icons/topics/movies/dc.png',
    'harry-potter': 'icons/topics/movies/harry-potter.png',
    'star-wars': 'icons/topics/movies/star-wars.png',
    'lotr': 'icons/topics/movies/lotr.png',
    'disney': 'icons/topics/movies/disney.png',
    // TV Shows
    'tv-shows': 'icons/topics/tvshows/tvshows.png',
    'sitcoms': 'icons/topics/tvshows/sitcoms.png',
    'game-of-thrones': 'icons/topics/tvshows/game-of-thrones.png',
    'breaking-bad': 'icons/topics/tvshows/breaking-bad.png',
    'stranger-things': 'icons/topics/tvshows/stranger-things.png',
    'money-heist': 'icons/topics/tvshows/money-heist.png',
    'the-office': 'icons/topics/tvshows/the-office.png',
    // Logos
    'logos': 'icons/topics/logos/logos.png'
  };
  
  return imageMap[topicId] || 'icons/topics/geography/flags.png';
}

// Track follow state per topic (temporary - will be Firebase later)
let topicFollowState = {};

// Get follower count for a topic (will be Firebase later)
function getTopicFollowers(topicId) {
  return 0;
}

// Get next title unlock level
function getNextTitleLevel(currentLevel) {
  return 'N/A';
}

// ============================================
// 🏆 QUESTIONS COMPLETED TRACKING SYSTEM
// ============================================

// Store all flags data for collection page (loaded once)
let allFlagsData = null;

// Load all flags data for collection
async function loadAllFlagsData() {
  if (allFlagsData) return allFlagsData;
  
  try {
    const res = await fetch("topic_images/flags/codes.json");
    const data = await res.json();
    
    // Filter to only included types (same as quiz)
    const includedTypes = ["country", "organization", "special-region", "uk-constituent",
                           "crown-dependency", "island", "french-territory", "caribbean-territory",
                           "special-territory"];
    
    allFlagsData = Object.entries(data)
      .filter(([code, name]) => {
        const entityType = getEntityType(name, code);
        return includedTypes.includes(entityType);
      })
      .map(([code, name]) => ({
        code: code,
        name: name.replace(/\bStates\b/gi, '').trim(),
        flag: `topic_images/flags/${code}.png`
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort A-Z
    
    return allFlagsData;
  } catch (err) {
    console.error("Failed to load flags data:", err);
    return [];
  }
}

// Get total questions count for a topic
async function getTotalQuestionsCount(topicId) {
  if (topicId === 'flags') {
    const data = await loadAllFlagsData();
    return data.length;
  }
  // For JSON topics, load and count
  if (JSON_TOPICS.includes(topicId)) {
    const config = TOPIC_CONFIG[topicId];
    try {
      const response = await fetch(config.path);
      const questions = await response.json();
      return questions.length;
    } catch (err) {
      return 0;
    }
  }
  return 0;
}

// Get unlocked questions for a topic
function getUnlockedQuestions(topicId) {
  if (!userData.stats.topics[topicId]) return [];
  return userData.stats.topics[topicId].unlockedQuestions || [];
}

// Track a correctly answered question (unlock it)
function trackUnlockedQuestion(topicId, questionId) {
  // Ensure topic exists
  if (!userData.stats.topics[topicId]) {
    userData.stats.topics[topicId] = {
      games: 0, correct: 0, wrong: 0, accuracy: 0,
      bestStreak: 0, level: 1, xp: 0,
      modesUnlocked: { casual: true, timeAttack: false, threeHearts: false },
      timeSpentSeconds: 0, totalQuestionsAnswered: 0,
      unlockedQuestions: []
    };
  }
  
  // Ensure unlockedQuestions array exists
  if (!userData.stats.topics[topicId].unlockedQuestions) {
    userData.stats.topics[topicId].unlockedQuestions = [];
  }
  
  const unlocked = userData.stats.topics[topicId].unlockedQuestions;
  
  // Only add if not already unlocked
  if (!unlocked.includes(questionId)) {
    unlocked.push(questionId);
    return true; // New question unlocked!
  }
  return false; // Already unlocked
}

// Get questions completed percentage
async function getQuestionsCompletedPercent(topicId) {
  const unlocked = getUnlockedQuestions(topicId);
  const total = await getTotalQuestionsCount(topicId);
  if (total === 0) return 0;
  return Math.round((unlocked.length / total) * 100);
}

// Track new unlocks in current session (for end screen animation)
let sessionNewUnlocks = [];

// Reset session unlocks at start of game
function resetSessionUnlocks() {
  sessionNewUnlocks = [];
}

// ============================================
// 🏳️ FLAGS COLLECTION PAGE
// ============================================

async function openFlagsCollection() {
  // Only show collection for flags topic for now
  if (currentTopic !== 'flags') {
    showToast('Collection coming soon for this topic!');
    return;
  }
  
  const allFlags = await loadAllFlagsData();
  const unlockedQuestions = getUnlockedQuestions('flags');
  
  // Sort: Unlocked first (A-Z), then Locked (A-Z)
  const sortedFlags = [...allFlags].sort((a, b) => {
    const aUnlocked = unlockedQuestions.includes(a.name);
    const bUnlocked = unlockedQuestions.includes(b.name);
    
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Create collection modal
  let collectionModal = document.getElementById('flags-collection-modal');
  if (!collectionModal) {
    collectionModal = document.createElement('div');
    collectionModal.id = 'flags-collection-modal';
    document.body.appendChild(collectionModal);
  }
  
  const unlockedCount = unlockedQuestions.length;
  const totalCount = allFlags.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);
  
  collectionModal.className = 'flags-collection-modal';
  collectionModal.innerHTML = `
    <div class="fc-container">
      <!-- Header -->
      <div class="fc-header">
        <button onclick="playClickSound(); closeFlagsCollection()" class="fc-back-btn">←</button>
        <div class="fc-header-info">
          <h2 class="fc-title">🏳️ Flags Collection</h2>
          <p class="fc-subtitle">${unlockedCount}/${totalCount} Unlocked (${percentage}%)</p>
        </div>
      </div>
      
      <!-- Flags Grid -->
      <div class="fc-grid">
        ${sortedFlags.map(flag => {
          const isUnlocked = unlockedQuestions.includes(flag.name);
          return `
            <div class="fc-flag-item ${isUnlocked ? 'fc-unlocked' : 'fc-locked'}">
              <div class="fc-flag-image-wrapper">
                ${isUnlocked 
                  ? `<img src="${flag.flag}" alt="${flag.name}" class="fc-flag-image" onerror="this.src='topic_images/flags/un.png'">`
                  : `<div class="fc-flag-locked-overlay">
                       <span class="fc-lock-icon">🔒</span>
                     </div>
                     <img src="${flag.flag}" alt="${flag.name}" class="fc-flag-image fc-flag-grayscale" onerror="this.src='topic_images/flags/un.png'">`
                }
              </div>
              <span class="fc-flag-name">${flag.name}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  collectionModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    collectionModal.classList.add('show');
  });
}

function closeFlagsCollection() {
  const modal = document.getElementById('flags-collection-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
}

// Format time spent (seconds to h/m/s format)
function formatTopicTime(seconds) {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Format average answer time (ms to seconds)
function formatAvgTime(totalMs, totalQuestions) {
  if (!totalMs || !totalQuestions || totalQuestions === 0) return '0s';
  const avgSeconds = (totalMs / totalQuestions) / 1000;
  return avgSeconds < 10 ? `${avgSeconds.toFixed(1)}s` : `${Math.round(avgSeconds)}s`;
}

function toggleTopicFollow(topicId) {
  topicFollowState[topicId] = !topicFollowState[topicId];
  const btn = document.getElementById('td-follow-btn');
  if (btn) {
    if (topicFollowState[topicId]) {
      btn.innerHTML = `<span class="td-btn-icon">➖</span> Unfollow`;
      btn.classList.add('td-following');
    } else {
      btn.innerHTML = `<span class="td-btn-icon">➕</span> Follow`;
      btn.classList.remove('td-following');
    }
  }
}

async function showUnifiedModeSelection(quizName, icon) {
  // Hide home screen
  home.classList.add('hidden');

  // Get topic XP data for mode unlock checks
  const topicData = getTopicXPData(currentTopic);
  const progress = getLevelProgress(topicData);
  const topicConfig = TOPIC_CONFIG[currentTopic] || {};
  const categoryName = topicConfig.category ? topicConfig.category.charAt(0).toUpperCase() + topicConfig.category.slice(1) : 'Quiz';
  const topicImagePath = getTopicImagePath(currentTopic);
  const isFollowing = topicFollowState[currentTopic] || false;
  
  // Get questions completed data
  const unlockedQuestions = getUnlockedQuestions(currentTopic);
  const totalQuestions = await getTotalQuestionsCount(currentTopic);
  const questionsCompletedPercent = totalQuestions > 0 ? Math.round((unlockedQuestions.length / totalQuestions) * 100) : 0;

  // Create or get mode selection screen
  let modeScreen = document.getElementById('unified-mode-screen');
  if (!modeScreen) {
    modeScreen = document.createElement('div');
    modeScreen.id = 'unified-mode-screen';
    document.body.appendChild(modeScreen);
  }

  // Use new Topic Detail design (QuizUp style)
  modeScreen.className = 'topic-detail-screen';
  modeScreen.style.cssText = '';

  modeScreen.innerHTML = `
    <!-- Top Bar -->
    <div class="td-top-bar">
      <button onclick="playClickSound(); exitUnifiedQuiz()" class="td-back-btn">←</button>
      <div class="td-top-title">${quizName}</div>
      <button onclick="playClickSound(); openSlotModal('${currentTopic}')" class="td-slot-btn">+</button>
    </div>

    <!-- Scrollable Content -->
    <div class="td-scroll-container">
      <!-- Topic Header Section -->
      <div class="td-header-section">
        <h1 class="td-title">${quizName}</h1>
        <p class="td-subtitle">${categoryName} Quiz</p>
      </div>

      <!-- Hero Row: Card + Buttons -->
      <div class="td-hero-row">
        <!-- Topic Card (Left) -->
        <div class="td-topic-card">
          <div class="td-card-glow"></div>
          <div class="td-card-image-wrapper">
            <img src="${topicImagePath}" alt="${quizName}" class="td-card-image" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'td-card-emoji\\'>${icon}</span>';">
          </div>
        </div>

        <!-- Action Buttons (Right) -->
        <div class="td-action-buttons">
          <button onclick="playClickSound(); openModeModal()" class="td-play-btn">
            <span class="td-btn-icon">⚡</span> Play
          </button>
          <button onclick="playClickSound(); toggleTopicFollow('${currentTopic}')" class="td-follow-btn ${isFollowing ? 'td-following' : ''}" id="td-follow-btn">
            <span class="td-btn-icon">${isFollowing ? '➖' : '➕'}</span> ${isFollowing ? 'Unfollow' : 'Follow'}
          </button>
          <button onclick="playClickSound(); showLeaderboard()" class="td-rankings-btn">
            <span class="td-btn-icon">🏆</span> Rankings
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="td-stats-row">
        <div class="td-stat-item">
          <div class="td-stat-label">YOUR LEVEL</div>
          <div class="td-stat-value">${topicData.level}</div>
        </div>
        <div class="td-stat-divider"></div>
        <div class="td-stat-item">
          <div class="td-stat-label">FOLLOWERS</div>
          <div class="td-stat-value">${getTopicFollowers(currentTopic)}</div>
        </div>
        <div class="td-stat-divider"></div>
        <div class="td-stat-item">
          <div class="td-stat-label">NEXT TITLE AT LVL</div>
          <div class="td-stat-value">${getNextTitleLevel(topicData.level)}</div>
        </div>
      </div>

      <!-- Progress Section (Clickable to open collection) -->
      <div class="td-progress-section td-progress-clickable" onclick="playClickSound(); openFlagsCollection()">
        <div class="td-progress-header">
          <div class="td-progress-label">QUESTIONS COMPLETED</div>
          <span class="td-progress-arrow">›</span>
        </div>
        <div class="td-progress-row">
          <div class="td-progress-bar">
            <div class="td-progress-fill" id="td-questions-progress-fill" style="width: ${questionsCompletedPercent}%"></div>
          </div>
          <span class="td-progress-percent" id="td-questions-progress-text">${questionsCompletedPercent}%</span>
        </div>
        <div class="td-progress-count">${unlockedQuestions.length}/${totalQuestions} questions unlocked</div>
      </div>

      <!-- Stats Cards Grid -->
      <div class="td-stats-grid">
        <div class="td-stats-grid-row">
          <div class="td-stat-card">
            <span class="td-stat-card-icon">🎮</span>
            <span class="td-stat-card-value">${topicData.games || 0}</span>
            <span class="td-stat-card-label">GAMES</span>
          </div>
          <div class="td-stat-card">
            <span class="td-stat-card-icon">🎯</span>
            <span class="td-stat-card-value">${topicData.accuracy || 0}%</span>
            <span class="td-stat-card-label">ACCURACY</span>
          </div>
          <div class="td-stat-card">
            <span class="td-stat-card-icon">🔥</span>
            <span class="td-stat-card-value">${topicData.bestStreak || 0}</span>
            <span class="td-stat-card-label">STREAK</span>
          </div>
        </div>
        <div class="td-stats-grid-row">
          <div class="td-stat-card">
            <span class="td-stat-card-icon">⏱️</span>
            <span class="td-stat-card-value">${formatTopicTime(topicData.timeSpentSeconds || 0)}</span>
            <span class="td-stat-card-label">TIME</span>
          </div>
          <div class="td-stat-card td-stat-card-highlight">
            <span class="td-stat-card-icon">⚡</span>
            <span class="td-stat-card-value">${formatAvgTime(topicData.totalAnswerTimeMs, topicData.totalQuestionsAnswered)}</span>
            <span class="td-stat-card-label">A.TIME</span>
          </div>
        </div>
      </div>

      <!-- Level Card -->
      <div class="td-level-card">
        <div class="td-level-badge">
          <span class="td-level-star">⭐</span>
          <span class="td-level-text">Level ${topicData.level}</span>
        </div>
        <div class="td-xp-bar">
          <div class="td-xp-fill" style="width:${progress.percentage}%"></div>
        </div>
        <div class="td-xp-text">${progress.current}/${progress.needed} XP</div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="td-bottom-nav">
      <div class="td-nav-item" onclick="playClickSound(); exitUnifiedQuiz(); showHome();">
        🏠<br><span>${t('nav_home') || 'Home'}</span>
      </div>
      <div class="td-nav-item" onclick="playClickSound(); exitUnifiedQuiz(); showTopics();">
        🌍<br><span>${t('nav_topics') || 'Topics'}</span>
      </div>
      <div class="td-nav-item" onclick="playClickSound(); exitUnifiedQuiz(); openSocialTeaser();">
        👥<br><span>${t('nav_social') || 'Social'}</span>
      </div>
      <div class="td-nav-item" onclick="playClickSound(); exitUnifiedQuiz(); showLeaderboard();">
        🏆<br><span>${t('nav_leaderboard') || 'Leaderboard'}</span>
      </div>
      <div class="td-nav-item" onclick="playClickSound(); exitUnifiedQuiz(); showProfile();">
        👤<br><span>${t('nav_profile') || 'Profile'}</span>
      </div>
    </div>
  `;

  modeScreen.classList.remove('hidden');
}

// Open Mode Selection Modal
function openModeModal() {
  const topicData = getTopicXPData(currentTopic);
  const timeAttackUnlocked = isModeUnlocked(topicData, 'time-attack');
  const threeHeartsUnlocked = isModeUnlocked(topicData, 'three-hearts');

  // Build Time Attack button
  const timeAttackBtn = timeAttackUnlocked 
    ? `<button onclick="playClickSound(); closeModeModal(); startUnifiedGame('time-attack')" class="mode-modal-btn mode-unlocked">
         <span class="mode-modal-icon">⏱️</span>
         <span class="mode-modal-text">${t('topic_time_attack') || 'Time Attack'} (60s)</span>
       </button>`
    : `<div class="mode-modal-btn mode-locked">
         <div class="mode-modal-main">
           <span class="mode-modal-icon">🔒</span>
           <span class="mode-modal-text">${t('topic_time_attack') || 'Time Attack'}</span>
         </div>
         <span class="mode-modal-hint">${(t('topic_reach_level') || 'Reach Level {0} to unlock').replace('{0}', '5')}</span>
       </div>`;

  // Build 3 Hearts button
  const threeHeartsBtn = threeHeartsUnlocked
    ? `<button onclick="playClickSound(); closeModeModal(); startUnifiedGame('three-hearts')" class="mode-modal-btn mode-unlocked">
         <span class="mode-modal-icon">💜</span>
         <span class="mode-modal-text">${t('topic_3_hearts') || '3 Hearts'}</span>
       </button>`
    : `<div class="mode-modal-btn mode-locked">
         <div class="mode-modal-main">
           <span class="mode-modal-icon">🔒</span>
           <span class="mode-modal-text">${t('topic_3_hearts') || '3 Hearts'}</span>
         </div>
         <span class="mode-modal-hint">${(t('topic_reach_level') || 'Reach Level {0} to unlock').replace('{0}', '10')}</span>
       </div>`;

  // Create modal
  let modal = document.getElementById('mode-select-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mode-select-modal';
    document.body.appendChild(modal);
  }

  modal.className = 'mode-select-modal';
  modal.innerHTML = `
    <div class="mode-modal-backdrop" onclick="playClickSound(); closeModeModal()"></div>
    <div class="mode-modal-content">
      <div class="mode-modal-header">
        <h3 class="mode-modal-title">${t('mode_choose') || 'Choose Game Mode'}</h3>
        <button class="mode-modal-close" onclick="playClickSound(); closeModeModal()">✕</button>
      </div>
      <div class="mode-modal-buttons">
        <!-- Casual - Always unlocked -->
        <button onclick="playClickSound(); closeModeModal(); startUnifiedGame('casual')" class="mode-modal-btn mode-unlocked">
          <span class="mode-modal-icon">⚡</span>
          <span class="mode-modal-text">${t('topic_casual') || 'Casual'} (5 ${t('topic_questions') || 'questions'})</span>
        </button>

        <!-- Time Attack -->
        ${timeAttackBtn}

        <!-- 3 Hearts -->
        ${threeHeartsBtn}

        <!-- 2 Players - Always unlocked -->
        <button onclick="playClickSound(); closeModeModal(); startUnifiedGame('two')" class="mode-modal-btn mode-unlocked mode-2p">
          <span class="mode-modal-icon">👥</span>
          <span class="mode-modal-text">${t('topic_2_players') || '2 Players'}</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  // Animate in
  requestAnimationFrame(() => {
    modal.classList.add('show');
  });
}

// Close Mode Selection Modal
function closeModeModal() {
  const modal = document.getElementById('mode-select-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
}

// Area difficulty selection handler
function selectAreaDifficulty(difficulty) {
  playClickSound();
  selectedDifficulty = difficulty;

  // Get topic XP data for mode unlock checks
  const topicData = getTopicXPData(currentTopic);
  const timeAttackUnlocked = isModeUnlocked(topicData, 'time-attack');
  const threeHeartsUnlocked = isModeUnlocked(topicData, 'three-hearts');
  const progress = getLevelProgress(topicData);

  // Build premium Time Attack button
  const timeAttackBtn = timeAttackUnlocked 
    ? `<button onclick="playClickSound(); startUnifiedGame('time-attack')" class="pm-mode-btn pm-mode-unlocked">
         <span class="pm-mode-icon">⏱️</span>
         <span>${t('topic_time_attack') || 'Time Attack'} (60s)</span>
       </button>`
    : `<div class="pm-mode-btn pm-mode-locked">
         <div class="pm-mode-main">
           <span class="pm-lock-icon">🔒</span>
           <span>${t('topic_time_attack') || 'Time Attack'}</span>
         </div>
         <span class="pm-unlock-hint">${(t('topic_reach_level') || 'Reach Level {0} to unlock').replace('{0}', '5')}</span>
       </div>`;

  // Build premium 3 Hearts button
  const threeHeartsBtn = threeHeartsUnlocked
    ? `<button onclick="playClickSound(); startUnifiedGame('three-hearts')" class="pm-mode-btn pm-mode-unlocked">
         <span class="pm-mode-icon">💜</span>
         <span>${t('topic_3_hearts') || '3 Hearts'}</span>
       </button>`
    : `<div class="pm-mode-btn pm-mode-locked">
         <div class="pm-mode-main">
           <span class="pm-lock-icon">🔒</span>
           <span>${t('topic_3_hearts') || '3 Hearts'}</span>
         </div>
         <span class="pm-unlock-hint">${(t('topic_reach_level') || 'Reach Level {0} to unlock').replace('{0}', '10')}</span>
       </div>`;

  // Update mode screen to show game modes with premium design
  const modeScreen = document.getElementById('unified-mode-screen');
  modeScreen.className = 'premium-mode-screen';
  modeScreen.innerHTML = `
    <!-- Header buttons -->
    <div class="pm-header">
      <button onclick="playClickSound(); showUnifiedModeSelection('Area', '📏')" class="pm-back-btn">←</button>
      <button onclick="playClickSound(); openSlotModal('${currentTopic}')" class="pm-slot-btn">
        <span style="font-size:1rem;">+</span> ${t('topic_add_to_slot') || 'Add to Slot'}
      </button>
    </div>

    <!-- Content -->
    <div class="pm-content">
      <!-- Hero section -->
      <div class="pm-hero">
        <div class="pm-icon-wrapper">
          <div class="pm-icon-glow"></div>
          <div class="pm-icon-ring">
            <span class="pm-icon">📏</span>
          </div>
        </div>
        <h2 class="pm-title">Area Quiz</h2>
      </div>

      <!-- Level card -->
      <div class="pm-level-card">
        <div class="pm-level-badge">
          <span class="pm-level-star">⭐</span>
          <span class="pm-level-text">Level ${topicData.level}</span>
        </div>
        <div class="pm-xp-bar">
          <div class="pm-xp-fill" style="width:${progress.percentage}%"></div>
        </div>
        <div class="pm-xp-text">${progress.current}/${progress.needed} XP</div>
      </div>

      <!-- Difficulty badge -->
      <div style="background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);border-radius:10px;padding:8px 20px;margin-bottom:20px;">
        <span style="color:#a78bfa;font-size:14px;font-weight:600;">Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
      </div>

      <!-- Section header -->
      <div class="pm-section-header">
        <div class="pm-section-line"></div>
        <span class="pm-section-title">Choose Game Mode</span>
        <div class="pm-section-line"></div>
      </div>

      <!-- Mode buttons -->
      <div class="pm-modes">
        <!-- Casual - Always unlocked -->
        <button onclick="playClickSound(); startUnifiedGame('casual')" class="pm-mode-btn pm-mode-unlocked">
          <span class="pm-mode-icon">⚡</span>
          <span>${t('topic_casual') || 'Casual'} (5 ${t('topic_questions') || 'questions'})</span>
        </button>

        <!-- Time Attack -->
        ${timeAttackBtn}

        <!-- 3 Hearts -->
        ${threeHeartsBtn}

        <!-- 2 Players - Always unlocked -->
        <button onclick="playClickSound(); startUnifiedGame('two')" class="pm-mode-btn pm-mode-unlocked pm-mode-2p">
          <span class="pm-mode-icon">👥</span>
          <span>${t('topic_2_players') || '2 Players'}</span>
        </button>
      </div>
    </div>
  `;
}

// Store lottie animation instance
let quizLoadingAnim = null;

// Show quiz loading screen
function showQuizLoadingScreen(callback) {
  const loadingScreen = document.getElementById('quiz-loading-screen');
  const lottieContainer = document.getElementById('quiz-loading-lottie');
  
  if (!loadingScreen || !lottieContainer) {
    // If loading screen doesn't exist, just run callback
    if (callback) callback();
    return;
  }
  
  // Clear previous animation
  lottieContainer.innerHTML = '';
  
  // Show loading screen
  loadingScreen.classList.remove('hidden');
  loadingScreen.classList.remove('fade-out');
  
  // Initialize Lottie animation
  if (typeof lottie !== 'undefined') {
    quizLoadingAnim = lottie.loadAnimation({
      container: lottieContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'loading.json'
    });
  }
  
  // After 0.8 seconds, fade out and run callback
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
    
    // After fade animation, hide and run callback
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      if (quizLoadingAnim) {
        quizLoadingAnim.destroy();
        quizLoadingAnim = null;
      }
      if (callback) callback();
    }, 300); // 300ms for fade out animation
  }, 800); // 800ms display time
}

// Start game with selected mode
function startUnifiedGame(mode) {
  // Hide mode selection screen
  const modeScreen = document.getElementById('unified-mode-screen');
  if (modeScreen) modeScreen.remove();
  
  // Show loading screen, then start game
  showQuizLoadingScreen(() => {
    // CRITICAL: Reset ALL game state variables
    resetGame(); // Call the existing resetGame() function
    resetSessionUnlocks(); // Reset new unlocks tracking for this session

    // Set game mode and parameters
    gameMode = mode;

    if (mode === 'time-attack') {
      timeLeft = GAME_CONFIG.TIME_ATTACK_DURATION;
      maxQuestions = 9999; // Unlimited questions
    } else if (mode === 'casual') {
      maxQuestions = GAME_CONFIG.CASUAL_QUESTIONS;
      timeLeft = GAME_CONFIG.CASUAL_TIME_PER_Q;
    } else if (mode === 'three-hearts') {
      livesRemaining = GAME_CONFIG.THREE_HEARTS_LIVES;
      maxQuestions = 9999; // Unlimited until 3 strikes
    } else if (mode === 'two') {
      maxQuestions = GAME_CONFIG.TWO_PLAYER_QUESTIONS;
      timeLeft = GAME_CONFIG.TWO_PLAYER_TIME_PER_Q;
    }

    // Reset scores explicitly (belt-and-suspenders approach)
    singlePlayerScore = 0;
    player1Score = 0;
    player2Score = 0;
    questionCount = 0;
    currentPlayer = 1;

    // Create unified quiz screen
    buildUnifiedQuizScreen();

    // Load questions and start
    loadFlags();
  });
}

// ==========================================
// GALAXY BACKGROUND EFFECT (Pure WebGL)
// ==========================================

const GALAXY_VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const GALAXY_FRAGMENT_SHADER = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare, float glowIntensity) {
  float d = length(uv);
  float m = (0.05 * glowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * glowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * glowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv, float starSpeed, float density, float hueShift, float glowIntensity, float saturation, float twinkleIntensity, float speed) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(starSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;
      
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + hueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * saturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));
      
      vec2 pad = vec2(tris(seed * 34.0 + uTime * speed / 10.0), tris(seed * 38.0 + uTime * speed / 30.0)) - 0.5;
      float star = Star(gv - offset - pad, flareSize, glowIntensity);
      
      float twinkle = trisn(uTime * speed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, twinkleIntensity);
      star *= twinkle;
      
      col += star * size * base;
    }
  }
  return col;
}

void main() {
  vec2 focal = vec2(0.5, 0.5);
  vec2 focalPx = focal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  
  // Parameters
  float density = 1.5;
  float hueShift = 240.0;
  float glowIntensity = 0.5;
  float saturation = 0.8;
  float twinkleIntensity = 0.3;
  float rotationSpeed = 0.05;
  float speed = 1.0;
  float starSpeed = uTime * 0.5 / 10.0;
  
  // Rotation
  float autoRotAngle = uTime * rotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;
  
  vec3 col = vec3(0.0);
  
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + starSpeed * speed);
    float scale = mix(20.0 * density, 0.5 * density, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32, starSpeed, density, hueShift, glowIntensity, saturation, twinkleIntensity, speed) * fade;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
`;

let galaxyInstance = null;

function initGalaxyBackground(container) {
  // Check if galaxy mode is enabled
  if (!galaxyModeEnabled) {
    console.log('Galaxy background disabled (Performance Mode)');
    return null;
  }
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';
  container.appendChild(canvas);
  
  // Get WebGL context
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn('WebGL not supported');
    return null;
  }
  
  // Compile shader
  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  const vertShader = compileShader(gl.VERTEX_SHADER, GALAXY_VERTEX_SHADER);
  const fragShader = compileShader(gl.FRAGMENT_SHADER, GALAXY_FRAGMENT_SHADER);
  
  if (!vertShader || !fragShader) return null;
  
  // Create program
  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }
  
  gl.useProgram(program);
  
  // Create fullscreen quad
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  
  // Get uniform locations
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uResolution = gl.getUniformLocation(program, 'uResolution');
  
  let animateId;
  let destroyed = false;
  let startTime = Date.now();
  
  function resize() {
    canvas.width = container.offsetWidth * window.devicePixelRatio;
    canvas.height = container.offsetHeight * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
  }
  
  function render() {
    if (destroyed) return;
    animateId = requestAnimationFrame(render);
    
    const time = (Date.now() - startTime) * 0.001;
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  window.addEventListener('resize', resize);
  resize();
  render();
  
  console.log('Galaxy background initialized successfully!');
  
  return {
    destroy: function() {
      destroyed = true;
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
}

function destroyGalaxyBackground() {
  if (galaxyInstance) {
    galaxyInstance.destroy();
    galaxyInstance = null;
  }
}

// Build unified quiz screen (matches Football quiz design)
function buildUnifiedQuizScreen() {
  // Remove existing screen if present
  let quizScreen = document.getElementById('unified-quiz-screen');
  if (quizScreen) quizScreen.remove();
  
  // Destroy previous galaxy instance
  destroyGalaxyBackground();

  // Create new full-screen quiz overlay
  quizScreen = document.createElement('div');
  quizScreen.id = 'unified-quiz-screen';
  // Use solid dark for galaxy mode (stars show through), gradient for performance mode
  const bgStyle = galaxyModeEnabled 
    ? 'background:#0f0c29;' 
    : 'background:linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);';
  quizScreen.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;${bgStyle}z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;overflow-y:auto;`;

  // Add galaxy background container (stays persistent, only if galaxy mode enabled)
  const galaxyContainer = document.createElement('div');
  galaxyContainer.id = 'galaxy-bg';
  galaxyContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;overflow:hidden;pointer-events:none;';
  quizScreen.appendChild(galaxyContainer);
  
  // Add content wrapper (this gets updated, not the whole screen)
  const contentWrapper = document.createElement('div');
  contentWrapper.id = 'quiz-content-wrapper';
  contentWrapper.style.cssText = 'width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:1;';
  quizScreen.appendChild(contentWrapper);
  
  document.body.appendChild(quizScreen);
  
  // Initialize galaxy background
  setTimeout(() => {
    galaxyInstance = initGalaxyBackground(galaxyContainer);
  }, 50);
}

// Check if 3D Card mode should be used
function shouldUse3DCardMode() {
  return card3dModeEnabled && currentTopic === 'flags' && gameMode === 'casual';
}

// ==========================================
// INFINITE MENU - 3D SPHERE QUIZ
// ==========================================

let infiniteMenuInstance = null;
let currentQuestionData = null;
let carouselFlags = [];  // Array of flags for the 3D carousel (5 flags)
let carouselIndex = 0;   // Current front flag index

// ===========================================
// 3D CARD - CSS 3D Carousel with zoom transitions
// Corner flags visible, zoom out shows sphere effect
// ===========================================
function display3DCardQuestion(isInitial = true) {
  if (gameEnded) return;
  
  const quizScreen = document.getElementById('unified-quiz-screen');
  if (!quizScreen) return;
  
  const contentWrapper = document.getElementById('quiz-content-wrapper');
  if (!contentWrapper) return;
  
  // Safety check - make sure flags are loaded
  if (!flags || flags.length === 0) {
    console.error('3D Card: Flags data not loaded');
    return;
  }
  
  // Initialize carousel flags on first call
  if (isInitial || carouselFlags.length === 0) {
    carouselFlags = shuffle([...flags]).slice(0, 17);  // 17 flags for full sphere effect
    carouselIndex = 0;
  }
  
  // Get current flag (the one at front/center)
  const currentFlag = carouselFlags[carouselIndex];
  if (!currentFlag) return;
  
  usedFlags.push(currentFlag.country);
  questionCount++;
  
  // Store current question data
  currentQuestionData = {
    imageSrc: currentFlag.flag,
    questionText: currentFlag.entityType 
      ? getQuestionTextForEntity(currentFlag.entityType) 
      : "Which country's flag is this?",
    correctAnswer: currentFlag.country
  };
  
  // Generate options
  const wrongAnswers = generateBaitAnswers(currentFlag);
  let options = shuffle([currentFlag, ...wrongAnswers]).map(opt => opt.country);
  
  // Build options HTML
  const optionsHTML = options.map(country => 
    `<button class="card3d-answer-btn" data-answer="${country.replace(/"/g, '&quot;')}" data-correct="${currentQuestionData.correctAnswer.replace(/"/g, '&quot;')}">${country}</button>`
  ).join('');
  
  // Set content wrapper to full screen
  contentWrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;padding:0;margin:0;';
  
  // Create layout with 3D sphere of flags (17 flags for full sphere)
    contentWrapper.innerHTML = `
    <div class="card3d-layout">
      <!-- 3D Sphere Container -->
      <div class="card3d-sphere" id="card3d-sphere">
        <!-- Center flag (current question) -->
        <div class="card3d-flag card3d-flag-center" data-pos="0">
          <img src="${carouselFlags[0].flag}" alt="">
        </div>
        <!-- Inner ring (4 corners) -->
        <div class="card3d-flag card3d-flag-tl" data-pos="1">
          <img src="${carouselFlags[1].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-tr" data-pos="2">
          <img src="${carouselFlags[2].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-bl" data-pos="3">
          <img src="${carouselFlags[3].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-br" data-pos="4">
          <img src="${carouselFlags[4].flag}" alt="">
        </div>
        <!-- Middle ring (4 edges) -->
        <div class="card3d-flag card3d-flag-l" data-pos="5">
          <img src="${carouselFlags[5].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-r" data-pos="6">
          <img src="${carouselFlags[6].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-t" data-pos="7">
          <img src="${carouselFlags[7].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-b" data-pos="8">
          <img src="${carouselFlags[8].flag}" alt="">
        </div>
        <!-- Outer ring (8 more flags for full sphere) -->
        <div class="card3d-flag card3d-flag-far-tl" data-pos="9">
          <img src="${carouselFlags[9].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-far-tr" data-pos="10">
          <img src="${carouselFlags[10].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-far-bl" data-pos="11">
          <img src="${carouselFlags[11].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-far-br" data-pos="12">
          <img src="${carouselFlags[12].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-far-l" data-pos="13">
          <img src="${carouselFlags[13].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-far-r" data-pos="14">
          <img src="${carouselFlags[14].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-far-t" data-pos="15">
          <img src="${carouselFlags[15].flag}" alt="">
        </div>
        <div class="card3d-flag card3d-flag-far-b" data-pos="16">
          <img src="${carouselFlags[16].flag}" alt="">
        </div>
      </div>
      
      <!-- Back Arrow -->
      <button onclick="playClickSound(); exitUnifiedQuiz()" class="card3d-back-btn">←</button>
      
      <!-- Timer and Score at top center -->
        <div class="card3d-top-bar">
          <div class="card3d-timer" id="card3d-timer">${timeLeft}s</div>
          <div class="card3d-score" id="card3d-score">Score: ${singlePlayerScore}</div>
        </div>
        
      <!-- Question on LEFT -->
      <div class="card3d-question-side" id="card3d-question-side">
        <h2 class="card3d-title" id="card3d-question">${currentQuestionData.questionText}</h2>
          </div>
          
      <!-- Answers on RIGHT -->
          <div class="card3d-answers-side" id="card3d-answers">
            ${optionsHTML}
        </div>
      </div>
    `;
  
  // Add click handlers
  document.querySelectorAll('.card3d-answer-btn').forEach(btn => {
    btn.onclick = () => check3DCardAnswer(btn, btn.dataset.answer, btn.dataset.correct);
  });
  
  // Track answer time
  questionOptionsShownTime = Date.now();
  
  // Start timer
  startTimer(currentQuestionData.correctAnswer);
}

// Animate to next question with 3D sphere effect - ZOOM IN not slide
function animateToNextQuestion(callback) {
  const sphere = document.getElementById('card3d-sphere');
  const questionSide = document.getElementById('card3d-question-side');
  const answersSide = document.getElementById('card3d-answers');
  
  if (!sphere) {
    callback && callback();
    return;
  }
  
  // Hide UI during transition
  if (questionSide) questionSide.classList.add('hidden');
  if (answersSide) answersSide.classList.add('hidden');
  
  // Phase 1: Zoom OUT (show full sphere) - 130ms
  sphere.classList.add('zoomed-out');
  
  setTimeout(() => {
    // Phase 2: Start spinning - 130ms
    sphere.classList.add('spinning');
    
    // Phase 3: Continue spinning - 130ms
    setTimeout(() => {
      sphere.classList.remove('spinning');
      sphere.classList.add('spinning-more');
      
      // Move to next flag and update carousel
      carouselIndex = (carouselIndex + 1) % carouselFlags.length;
      
      // Get a new flag to replace the one that was asked
      const newFlag = getNextUnusedFlag();
      if (newFlag) {
        carouselFlags.push(carouselFlags.shift());
        carouselFlags[carouselFlags.length - 1] = newFlag;
      }
      
      // Update all flag images
      const flagElements = sphere.querySelectorAll('.card3d-flag img');
      flagElements.forEach((img, i) => {
        if (carouselFlags[i]) {
          img.src = carouselFlags[i].flag;
        }
      });
      
      // Update question data now
      const currentFlag = carouselFlags[0];
      currentQuestionData = {
        imageSrc: currentFlag.flag,
        questionText: currentFlag.entityType 
          ? getQuestionTextForEntity(currentFlag.entityType) 
          : "Which country's flag is this?",
        correctAnswer: currentFlag.country
      };
      
      // Phase 4: Settle to front - 100ms
      setTimeout(() => {
        sphere.classList.remove('spinning-more');
        sphere.classList.add('settling');
        
        // Phase 5: ZOOM IN from center - 80ms
        setTimeout(() => {
          sphere.classList.remove('settling');
          sphere.classList.remove('zoomed-out');
          
          setTimeout(() => {
            // Update UI
            const questionEl = document.getElementById('card3d-question');
            if (questionEl) questionEl.textContent = currentQuestionData.questionText;
            
            // Generate new options
            const wrongAnswers = generateBaitAnswers(currentFlag);
            let options = shuffle([currentFlag, ...wrongAnswers]).map(opt => opt.country);
            
            // Update answer buttons
            if (answersSide) {
              answersSide.innerHTML = options.map(country => 
                `<button class="card3d-answer-btn" data-answer="${country.replace(/"/g, '&quot;')}" data-correct="${currentQuestionData.correctAnswer.replace(/"/g, '&quot;')}">${country}</button>`
              ).join('');
              
              answersSide.querySelectorAll('.card3d-answer-btn').forEach(btn => {
                btn.onclick = () => check3DCardAnswer(btn, btn.dataset.answer, btn.dataset.correct);
              });
            }
            
            // Show UI
            if (questionSide) questionSide.classList.remove('hidden');
            if (answersSide) answersSide.classList.remove('hidden');
            
            usedFlags.push(currentFlag.country);
            questionCount++;
            
            callback && callback();
          }, 80);
        }, 80);
      }, 100);
    }, 130);
  }, 130);
}

// Get next unused flag for carousel
function getNextUnusedFlag() {
  const remaining = flags.filter(f => 
    !usedFlags.includes(f.country) && 
    !carouselFlags.some(cf => cf.country === f.country)
  );
  
  if (remaining.length === 0) {
    return shuffle([...flags])[0];
  }
  
  return remaining[Math.floor(Math.random() * remaining.length)];
}

// Initialize the InfiniteMenu 3D sphere
function initInfiniteMenu() {
  // Wait for DOM to be ready and wrapper to have dimensions
  setTimeout(() => {
  const canvas = document.getElementById('infinite-menu-canvas');
    if (!canvas) {
      console.error('InfiniteMenu: Canvas not found');
      return;
    }
    
    const wrapper = canvas.parentElement;
    if (!wrapper || wrapper.clientWidth === 0) {
      console.error('InfiniteMenu: Wrapper has no dimensions, retrying...');
      // Retry after another delay
      setTimeout(() => initInfiniteMenu(), 100);
      return;
    }
    
    // Use sphereFlags that were already initialized by display3DCardQuestion
    // (don't reinitialize them here)
    if (sphereFlags.length === 0) {
      sphereFlags = shuffle([...flags]).slice(0, 42);
      sphereQuestionIndex = 0;
    }
    
    const flagImages = sphereFlags.map(f => f.flag);
  
  try {
      infiniteMenuInstance = new InfiniteGridMenu(canvas, flagImages, () => {
        // Called when zoom completes
      });
    infiniteMenuInstance.run();
      console.log('InfiniteMenu initialized successfully');
  } catch (e) {
    console.error('Failed to initialize InfiniteMenu:', e);
  }
  }, 50);
}

// Destroy InfiniteMenu when leaving quiz
function destroyInfiniteMenu() {
  if (infiniteMenuInstance) {
    infiniteMenuInstance.destroy();
    infiniteMenuInstance = null;
  }
}

// ==========================================
// INFINITE GRID MENU - WebGL2 Implementation
// Enhanced with zoom in/out transitions
// ==========================================

// Ensure glMatrix is available (from CDN or use fallback)
const glMatrix = (function() {
  // Check if gl-matrix loaded from CDN
  if (window.glMatrix && window.glMatrix.mat4) {
    console.log('Using gl-matrix from CDN');
    return window.glMatrix;
  }
  
  console.log('Using built-in gl-matrix fallback');
  
  // Fallback implementation
  return {
    mat4: {
      create: function() {
        const out = new Float32Array(16);
        out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
        return out;
      },
      identity: function(out) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
      },
      perspective: function(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[15] = 0;
        if (far != null && far !== Infinity) {
          const nf = 1 / (near - far);
          out[10] = (far + near) * nf;
          out[14] = 2 * far * near * nf;
        } else {
          out[10] = -1;
          out[14] = -2 * near;
        }
        return out;
      },
      lookAt: function(out, eye, center, up) {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        const eyex = eye[0], eyey = eye[1], eyez = eye[2];
        const upx = up[0], upy = up[1], upz = up[2];
        const centerx = center[0], centery = center[1], centerz = center[2];
        z0 = eyex - centerx; z1 = eyey - centery; z2 = eyez - centerz;
        len = Math.sqrt(z0*z0 + z1*z1 + z2*z2);
        if (len > 0) { len = 1 / len; z0 *= len; z1 *= len; z2 *= len; }
        x0 = upy * z2 - upz * z1; x1 = upz * z0 - upx * z2; x2 = upx * z1 - upy * z0;
        len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
        if (len > 0) { len = 1 / len; x0 *= len; x1 *= len; x2 *= len; }
        y0 = z1 * x2 - z2 * x1; y1 = z2 * x0 - z0 * x2; y2 = z0 * x1 - z1 * x0;
        out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
        out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
        out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
        out[12] = -(x0*eyex + x1*eyey + x2*eyez);
        out[13] = -(y0*eyex + y1*eyey + y2*eyez);
        out[14] = -(z0*eyex + z1*eyey + z2*eyez);
        out[15] = 1;
        return out;
      },
      translate: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        if (out !== a) {
          out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
          out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
          out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
        }
        out[12] = a[0]*x + a[4]*y + a[8]*z + a[12];
        out[13] = a[1]*x + a[5]*y + a[9]*z + a[13];
        out[14] = a[2]*x + a[6]*y + a[10]*z + a[14];
        out[15] = a[3]*x + a[7]*y + a[11]*z + a[15];
        return out;
      },
      scale: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[0] = a[0]*x; out[1] = a[1]*x; out[2] = a[2]*x; out[3] = a[3]*x;
        out[4] = a[4]*y; out[5] = a[5]*y; out[6] = a[6]*y; out[7] = a[7]*y;
        out[8] = a[8]*z; out[9] = a[9]*z; out[10] = a[10]*z; out[11] = a[11]*z;
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        return out;
      },
      multiply: function(out, a, b) {
        const a00=a[0],a01=a[1],a02=a[2],a03=a[3];
        const a10=a[4],a11=a[5],a12=a[6],a13=a[7];
        const a20=a[8],a21=a[9],a22=a[10],a23=a[11];
        const a30=a[12],a31=a[13],a32=a[14],a33=a[15];
        let b0=b[0],b1=b[1],b2=b[2],b3=b[3];
        out[0]=b0*a00+b1*a10+b2*a20+b3*a30;
        out[1]=b0*a01+b1*a11+b2*a21+b3*a31;
        out[2]=b0*a02+b1*a12+b2*a22+b3*a32;
        out[3]=b0*a03+b1*a13+b2*a23+b3*a33;
        b0=b[4];b1=b[5];b2=b[6];b3=b[7];
        out[4]=b0*a00+b1*a10+b2*a20+b3*a30;
        out[5]=b0*a01+b1*a11+b2*a21+b3*a31;
        out[6]=b0*a02+b1*a12+b2*a22+b3*a32;
        out[7]=b0*a03+b1*a13+b2*a23+b3*a33;
        b0=b[8];b1=b[9];b2=b[10];b3=b[11];
        out[8]=b0*a00+b1*a10+b2*a20+b3*a30;
        out[9]=b0*a01+b1*a11+b2*a21+b3*a31;
        out[10]=b0*a02+b1*a12+b2*a22+b3*a32;
        out[11]=b0*a03+b1*a13+b2*a23+b3*a33;
        b0=b[12];b1=b[13];b2=b[14];b3=b[15];
        out[12]=b0*a00+b1*a10+b2*a20+b3*a30;
        out[13]=b0*a01+b1*a11+b2*a21+b3*a31;
        out[14]=b0*a02+b1*a12+b2*a22+b3*a32;
        out[15]=b0*a03+b1*a13+b2*a23+b3*a33;
        return out;
      },
      targetTo: function(out, eye, target, up) {
        const eyex=eye[0],eyey=eye[1],eyez=eye[2];
        const upx=up[0],upy=up[1],upz=up[2];
        let z0=eyex-target[0],z1=eyey-target[1],z2=eyez-target[2];
        let len=z0*z0+z1*z1+z2*z2;
        if(len>0){len=1/Math.sqrt(len);z0*=len;z1*=len;z2*=len;}
        let x0=upy*z2-upz*z1,x1=upz*z0-upx*z2,x2=upx*z1-upy*z0;
        len=x0*x0+x1*x1+x2*x2;
        if(len>0){len=1/Math.sqrt(len);x0*=len;x1*=len;x2*=len;}
        out[0]=x0;out[1]=x1;out[2]=x2;out[3]=0;
        out[4]=z1*x2-z2*x1;out[5]=z2*x0-z0*x2;out[6]=z0*x1-z1*x0;out[7]=0;
        out[8]=z0;out[9]=z1;out[10]=z2;out[11]=0;
        out[12]=eyex;out[13]=eyey;out[14]=eyez;out[15]=1;
        return out;
      }
    },
    vec3: {
      create: function() { return new Float32Array(3); },
      normalize: function(out, a) {
        const len = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
        if (len > 0) {
          out[0] = a[0] / len;
          out[1] = a[1] / len;
          out[2] = a[2] / len;
        }
        return out;
      },
      dot: function(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
      },
      cross: function(out, a, b) {
        const ax=a[0],ay=a[1],az=a[2];
        const bx=b[0],by=b[1],bz=b[2];
        out[0] = ay*bz - az*by;
        out[1] = az*bx - ax*bz;
        out[2] = ax*by - ay*bx;
        return out;
      },
      transformQuat: function(out, a, q) {
        const qx=q[0],qy=q[1],qz=q[2],qw=q[3];
        const x=a[0],y=a[1],z=a[2];
        let uvx=qy*z-qz*y,uvy=qz*x-qx*z,uvz=qx*y-qy*x;
        let uuvx=qy*uvz-qz*uvy,uuvy=qz*uvx-qx*uvz,uuvz=qx*uvy-qy*uvx;
        const w2=qw*2;
        uvx*=w2;uvy*=w2;uvz*=w2;
        uuvx*=2;uuvy*=2;uuvz*=2;
        out[0]=x+uvx+uuvx;
        out[1]=y+uvy+uuvy;
        out[2]=z+uvz+uuvz;
        return out;
      }
    },
    quat: {
      create: function() { return new Float32Array([0,0,0,1]); },
      copy: function(out, a) {
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        return out;
      },
      setAxisAngle: function(out, axis, rad) {
        rad = rad * 0.5;
        const s = Math.sin(rad);
        out[0] = s * axis[0];
        out[1] = s * axis[1];
        out[2] = s * axis[2];
        out[3] = Math.cos(rad);
        return out;
      },
      // Rotation from vector a to vector b
      rotationTo: function(out, a, b) {
        const dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
        if (dot < -0.999999) {
          // Vectors are opposite, find perpendicular axis
          let tmpvec = [0,0,0];
          // Try crossing with X axis
          tmpvec[0] = 0; tmpvec[1] = -a[2]; tmpvec[2] = a[1];
          let len = tmpvec[1]*tmpvec[1] + tmpvec[2]*tmpvec[2];
          if (len < 0.000001) {
            // Try crossing with Y axis
            tmpvec[0] = a[2]; tmpvec[1] = 0; tmpvec[2] = -a[0];
            len = tmpvec[0]*tmpvec[0] + tmpvec[2]*tmpvec[2];
          }
          len = Math.sqrt(len);
          tmpvec[0] /= len; tmpvec[1] /= len; tmpvec[2] /= len;
          out[0] = tmpvec[0]; out[1] = tmpvec[1]; out[2] = tmpvec[2]; out[3] = 0;
        } else if (dot > 0.999999) {
          // Vectors are same direction
          out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 1;
        } else {
          // Normal case: axis = cross(a, b), angle from dot
          const axis = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
          out[0] = axis[0]; out[1] = axis[1]; out[2] = axis[2];
          out[3] = 1 + dot;
          // Normalize
          const len = Math.sqrt(out[0]*out[0] + out[1]*out[1] + out[2]*out[2] + out[3]*out[3]);
          out[0] /= len; out[1] /= len; out[2] /= len; out[3] /= len;
        }
        return out;
      },
      // Spherical linear interpolation
      slerp: function(out, a, b, t) {
        const ax=a[0],ay=a[1],az=a[2],aw=a[3];
        let bx=b[0],by=b[1],bz=b[2],bw=b[3];
        let cosom = ax*bx + ay*by + az*bz + aw*bw;
        // Flip sign if needed for shortest path
        if (cosom < 0) {
          cosom = -cosom;
          bx = -bx; by = -by; bz = -bz; bw = -bw;
        }
        let scale0, scale1;
        if (1 - cosom > 0.000001) {
          const omega = Math.acos(cosom);
          const sinom = Math.sin(omega);
          scale0 = Math.sin((1 - t) * omega) / sinom;
          scale1 = Math.sin(t * omega) / sinom;
        } else {
          // Linear interpolation for nearly parallel quaternions
          scale0 = 1 - t;
          scale1 = t;
        }
        out[0] = scale0*ax + scale1*bx;
        out[1] = scale0*ay + scale1*by;
        out[2] = scale0*az + scale1*bz;
        out[3] = scale0*aw + scale1*bw;
        return out;
      }
    }
  };
})();

const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;

    // Apply stretching effect during rotation
    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        if (length(centerPos) > 0.01) {
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
        }
    }

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    // Alpha based on z position - cards facing camera (positive z) are more visible
    float normalizedZ = normalize(centerPos).z;
    vAlpha = smoothstep(-0.5, 1.0, normalizedZ) * 0.85 + 0.15;
    
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = st * cellSize + cellOffset;
    
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

class InfiniteGridMenu {
  // Camera zoom states - VERY close for ONE HUGE centered card
  static ZOOM_IN = 4.0;    // Close - front card is LARGE
  static ZOOM_OUT = 9.0;   // Far - see all cards
  static ZOOM_DURATION = 500; // ms for smooth zoom animation

  constructor(canvas, images, onZoomComplete = null) {
    this.canvas = canvas;
    this.images = images || [];
    this.SPHERE_RADIUS = 3;  // Larger sphere for better spacing
    this.destroyed = false;
    this.animationId = null;
    this.time = 0;
    this.lastTime = 0;
    this.onZoomComplete = onZoomComplete;

    // Active item tracking - like reference component
    this.activeIndex = 0;  // Which card is currently front-facing
    this.targetIndex = 0;  // Which card we're rotating TO
    
    // Rotation state - quaternion for 3D rotation
    this.currentOrientation = glMatrix.quat.create();  // Current sphere rotation
    this.targetOrientation = glMatrix.quat.create();   // Target sphere rotation
    this.startOrientation = glMatrix.quat.create();    // Start orientation for slerp
    this.rotationProgress = 1;  // 0-1, 1 means rotation complete
    this.rotationVelocity = 0;

    // Zoom state
    this.currentZoom = InfiniteGridMenu.ZOOM_IN;
    this.targetZoom = InfiniteGridMenu.ZOOM_IN;
    this.isZoomedIn = true;
    this.isTransitioning = false;
    this.zoomStartTime = 0;
    this.zoomStartValue = InfiniteGridMenu.ZOOM_IN;
    
    this.camera = {
      position: [0, 0, InfiniteGridMenu.ZOOM_IN],
      up: [0, 1, 0],
      fov: Math.PI / 4,  // 45 degrees - narrower for larger apparent size
      aspect: 1,
      near: 0.1,
      far: 100
    };
    
    this.init();
  }
  
  init() {
    const gl = this.canvas.getContext('webgl2', { 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false  // For proper transparency over background
    });
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }
    this.gl = gl;
    console.log('WebGL2 context created');
    
    // Create matrices FIRST (needed by resize/updateProjection)
    this.worldMatrix = glMatrix.mat4.create();
    this.viewMatrix = glMatrix.mat4.create();
    this.projectionMatrix = glMatrix.mat4.create();
    
    // Resize canvas (now safe to call updateProjection)
    this.resize();
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);
    
    // Create shader program
    this.program = this.createProgram(discVertShaderSource, discFragShaderSource);
    if (!this.program) {
      console.error('Failed to create shader program');
      return;
    }
    console.log('Shader program created');
    
    // Get locations
    this.locations = {
      aModelPosition: gl.getAttribLocation(this.program, 'aModelPosition'),
      aModelUvs: gl.getAttribLocation(this.program, 'aModelUvs'),
      aInstanceMatrix: gl.getAttribLocation(this.program, 'aInstanceMatrix'),
      uWorldMatrix: gl.getUniformLocation(this.program, 'uWorldMatrix'),
      uViewMatrix: gl.getUniformLocation(this.program, 'uViewMatrix'),
      uProjectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
      uRotationAxisVelocity: gl.getUniformLocation(this.program, 'uRotationAxisVelocity'),
      uTex: gl.getUniformLocation(this.program, 'uTex'),
      uItemCount: gl.getUniformLocation(this.program, 'uItemCount'),
      uAtlasSize: gl.getUniformLocation(this.program, 'uAtlasSize')
    };
    
    // Create disc geometry
    this.createDiscGeometry();
    
    // Create subdivided icosahedron for more card positions
    this.createSpherePositions();
    console.log('Created', this.instanceCount, 'sphere positions');
    
    // IMPORTANT: Set initial orientation to show card 0 at front center
    // Copy the orientation for card 0 to both current and target
    if (this.cardOrientations && this.cardOrientations[0]) {
      glMatrix.quat.copy(this.currentOrientation, this.cardOrientations[0]);
      glMatrix.quat.copy(this.targetOrientation, this.cardOrientations[0]);
      glMatrix.quat.copy(this.startOrientation, this.cardOrientations[0]);
      this.rotationProgress = 1; // Already at target
    }
    
    // Create instance matrices
    this.createInstances();
    
    // Load textures
    this.loadTextures();
    
    // Update camera (matrices already created at start of init)
    this.updateCamera();
    console.log('InfiniteGridMenu init complete');
  }
  
  createProgram(vertSrc, fragSrc) {
    const gl = this.gl;
    
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertSrc);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vertShader));
      return null;
    }
    
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragSrc);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragShader));
      return null;
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }
  
  createDiscGeometry() {
    const gl = this.gl;
    const steps = 48; // More steps for smoother circles
    const radius = 1;
    
    const vertices = [0, 0, 0];
    const uvs = [0.5, 0.5];
    const indices = [];
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      vertices.push(x, y, 0);
      uvs.push(x * 0.5 + 0.5, y * 0.5 + 0.5);
      
      if (i > 0) {
        indices.push(0, i, i + 1);
      }
    }
    indices.push(0, steps, 1);
    
    // Create VAO
    this.discVAO = gl.createVertexArray();
    gl.bindVertexArray(this.discVAO);
    
    // Vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.locations.aModelPosition);
    gl.vertexAttribPointer(this.locations.aModelPosition, 3, gl.FLOAT, false, 0, 0);
    
    // UV buffer
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.locations.aModelUvs);
    gl.vertexAttribPointer(this.locations.aModelUvs, 2, gl.FLOAT, false, 0, 0);
    
    // Index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    this.discIndexCount = indices.length;
    
    gl.bindVertexArray(null);
  }
  
  createSpherePositions() {
    // Create subdivided icosahedron for more positions
    const t = (1 + Math.sqrt(5)) / 2;
    
    // Base icosahedron vertices
    let vertices = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    
    // Icosahedron faces
    const faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    
    // Subdivide once to get more vertices
    const midPointCache = {};
    const getMidPoint = (a, b) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (midPointCache[key] !== undefined) return midPointCache[key];
      
      const v1 = vertices[a];
      const v2 = vertices[b];
      const mid = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2, (v1[2] + v2[2]) / 2];
      
      const idx = vertices.length;
      vertices.push(mid);
      midPointCache[key] = idx;
      return idx;
    };
    
    // Subdivide each face
    faces.forEach(face => {
      getMidPoint(face[0], face[1]);
      getMidPoint(face[1], face[2]);
      getMidPoint(face[2], face[0]);
    });
    
    // Normalize all vertices to sphere surface and store BASE positions
    this.basePositions = vertices.map(v => {
      const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
      return [
        v[0]/len * this.SPHERE_RADIUS,
        v[1]/len * this.SPHERE_RADIUS,
        v[2]/len * this.SPHERE_RADIUS
      ];
    });
    
    // IMPORTANT: Put first card (index 0) at front (positive Z facing camera)
    // Find the vertex closest to [0, 0, RADIUS] and swap it with index 0
    let frontIndex = 0;
    let maxZ = -Infinity;
    for (let i = 0; i < this.basePositions.length; i++) {
      if (this.basePositions[i][2] > maxZ) {
        maxZ = this.basePositions[i][2];
        frontIndex = i;
      }
    }
    // Swap so index 0 is the front-facing position
    if (frontIndex !== 0) {
      const temp = this.basePositions[0];
      this.basePositions[0] = this.basePositions[frontIndex];
      this.basePositions[frontIndex] = temp;
    }
    
    this.instancePositions = this.basePositions.map(p => [...p]);
    this.instanceCount = this.instancePositions.length;
    
    // Store initial orientations for each card position
    this.cardOrientations = this.basePositions.map(pos => {
      return this.calculateOrientationToFaceCamera(pos);
    });
  }
  
  // Calculate the quaternion rotation needed to bring a position to face the camera
  calculateOrientationToFaceCamera(pos) {
    const normalized = glMatrix.vec3.create();
    glMatrix.vec3.normalize(normalized, pos);
    
    // Target direction is [0, 0, 1] (facing camera)
    const target = [0, 0, 1];
    
    // Calculate rotation from normalized position to target
    const quat = glMatrix.quat.create();
    glMatrix.quat.rotationTo(quat, normalized, target);
    
    return quat;
  }
  
  // Rotate sphere to show card at given index
  setActiveCard(index) {
    if (index < 0 || index >= this.instanceCount) return;
    
    this.targetIndex = index;
    const targetQuat = this.cardOrientations[index];
    
    // Store current orientation as start for slerp
    glMatrix.quat.copy(this.startOrientation, this.currentOrientation);
    
    // Copy to target orientation
    glMatrix.quat.copy(this.targetOrientation, targetQuat);
    
    // Start rotation animation
    this.rotationProgress = 0;
  }
  
  createInstances() {
    const gl = this.gl;
    
    this.instanceMatrices = new Float32Array(this.instanceCount * 16);
    
    gl.bindVertexArray(this.discVAO);
    
    this.instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceMatrices, gl.DYNAMIC_DRAW);
    
    // Set up instanced attributes (mat4 = 4 vec4s)
    for (let i = 0; i < 4; i++) {
      const loc = this.locations.aInstanceMatrix + i;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, i * 16);
      gl.vertexAttribDivisor(loc, 1);
    }
    
    gl.bindVertexArray(null);
  }
  
  loadTextures() {
    const gl = this.gl;
    
    this.atlasSize = Math.ceil(Math.sqrt(this.images.length));
    const cellSize = 512; // Higher resolution for crisp images
    
    const canvas = document.createElement('canvas');
    canvas.width = this.atlasSize * cellSize;
    canvas.height = this.atlasSize * cellSize;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Load images
    let loadedCount = 0;
    this.images.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const x = (i % this.atlasSize) * cellSize;
        const y = Math.floor(i / this.atlasSize) * cellSize;
        ctx.drawImage(img, x, y, cellSize, cellSize);
        loadedCount++;
        
        if (loadedCount === this.images.length) {
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
          gl.generateMipmap(gl.TEXTURE_2D);
        }
      };
      img.onerror = () => {
        loadedCount++;
      };
      img.src = src;
    });
  }
  
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio);
    
    // Use full window dimensions for full-screen experience
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Fallback to wrapper if available
    const wrapper = this.canvas.parentElement;
    if (wrapper && wrapper.clientWidth > 0) {
      width = wrapper.clientWidth;
      height = wrapper.clientHeight;
    }
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    this.camera.aspect = width / height;
    this.updateProjection();
  }
  
  updateCamera() {
    glMatrix.mat4.lookAt(this.viewMatrix, this.camera.position, [0, 0, 0], this.camera.up);
    this.updateProjection();
  }
  
  updateProjection() {
    glMatrix.mat4.perspective(
      this.projectionMatrix,
      this.camera.fov,
      this.camera.aspect,
      this.camera.near,
      this.camera.far
    );
  }
  
  // Easing function for smooth zoom
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Start zoom out animation
  zoomOut() {
    this.isZoomedIn = false;
    this.zoomStartTime = performance.now();
    this.zoomStartValue = this.currentZoom;
    this.targetZoom = InfiniteGridMenu.ZOOM_OUT;
  }
  
  // Start zoom in animation
  zoomIn() {
    this.isZoomedIn = true;
    this.zoomStartTime = performance.now();
    this.zoomStartValue = this.currentZoom;
    this.targetZoom = InfiniteGridMenu.ZOOM_IN;
  }
  
  // Rotate to show specific card at front
  rotateToCard(index) {
    if (index >= 0 && index < this.instanceCount) {
      this.setActiveCard(index);
      this.activeIndex = index;
    }
  }
  
  // Full transition: zoom out -> rotate to next -> zoom in (like reference)
  transitionToNext(callback, nextCardIndex = null) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.transitionCallback = callback;
    
    // Determine next card (default: next in sequence)
    const nextIdx = nextCardIndex !== null ? nextCardIndex : (this.activeIndex + 1) % this.instanceCount;

    // Phase 1: Zoom OUT
    this.zoomOut();
    
    // Phase 2: After zoom out, rotate to next card
    setTimeout(() => {
      this.rotateToCard(nextIdx);
      
      // Phase 3: After rotation, zoom IN
      setTimeout(() => {
        this.zoomIn();
        
        // Phase 4: After zoom in, call callback
        setTimeout(() => {
          this.isTransitioning = false;
          if (this.transitionCallback) {
            this.transitionCallback();
            this.transitionCallback = null;
          }
          if (this.onZoomComplete) {
            this.onZoomComplete();
          }
        }, InfiniteGridMenu.ZOOM_DURATION + 50);
      }, 500); // Wait for rotation
    }, InfiniteGridMenu.ZOOM_DURATION);
  }
  
  animate(currentTime) {
    if (this.destroyed) return;
    
    const deltaTime = Math.min(32, currentTime - this.lastTime);
    this.lastTime = currentTime;
    this.time += deltaTime * 0.001;
    
    // Update zoom animation with smooth easing
    if (Math.abs(this.currentZoom - this.targetZoom) > 0.001) {
      const elapsed = currentTime - this.zoomStartTime;
      const progress = Math.min(1, elapsed / InfiniteGridMenu.ZOOM_DURATION);
      const easedProgress = this.easeInOutCubic(progress);
      
      this.currentZoom = this.zoomStartValue + (this.targetZoom - this.zoomStartValue) * easedProgress;
      this.camera.position[2] = this.currentZoom;
      this.updateCamera();
      
      if (progress >= 1) {
        this.currentZoom = this.targetZoom;
      }
    }
    
    // Smooth quaternion rotation using slerp (like reference component)
    if (this.rotationProgress < 1) {
      this.rotationProgress += 0.03; // Smooth rotation speed
      this.rotationProgress = Math.min(1, this.rotationProgress);
      
      const easedProgress = this.easeInOutCubic(this.rotationProgress);
      // Interpolate from START to TARGET orientation
      glMatrix.quat.slerp(this.currentOrientation, this.startOrientation, this.targetOrientation, easedProgress);
      
      // Calculate rotation velocity for stretching effect
      this.rotationVelocity = (1 - this.rotationProgress) * 0.6;
    } else {
      this.rotationVelocity *= 0.9; // Fade out velocity
    }
    
    // Update instance matrices - LARGE front card like reference image
    const baseScale = 2.5; // Very large base scale for prominent cards
    for (let i = 0; i < this.instanceCount; i++) {
      const pos = this.basePositions[i];
      const rotatedPos = glMatrix.vec3.create();
      glMatrix.vec3.transformQuat(rotatedPos, pos, this.currentOrientation);
      
      const matrix = new Float32Array(this.instanceMatrices.buffer, i * 64, 16);
      glMatrix.mat4.identity(matrix);
      
      // Translate to the sphere position
      glMatrix.mat4.translate(matrix, matrix, rotatedPos);
      
      // Orient disc to face OUTWARD from sphere center (toward camera)
      // targetTo makes Z-axis point FROM target TO eye
      // So targetTo(eye=rotatedPos, target=[0,0,0]) makes Z point outward
      const lookMatrix = glMatrix.mat4.create();
      glMatrix.mat4.targetTo(lookMatrix, rotatedPos, [0, 0, 0], [0, 1, 0]);
      glMatrix.mat4.multiply(matrix, matrix, lookMatrix);
      
      // Scale based on Z position - HUGE front card, tiny back cards
      // zNormalized: 0 = back of sphere, 1 = front of sphere (facing camera)
      const zNormalized = (rotatedPos[2] + this.SPHERE_RADIUS) / (2 * this.SPHERE_RADIUS);
      
      // Like reference: front card is MASSIVE, back cards are very small
      // Sharp cutoff - only front-most cards are visible
      const scaleFactor = 0.05 + Math.pow(zNormalized, 4) * 0.95;
      const finalScale = baseScale * scaleFactor;
      glMatrix.mat4.scale(matrix, matrix, [finalScale, finalScale, finalScale]);
    }
    
    // Upload instance matrices
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceMatrices);
  }
  
  render() {
    const gl = this.gl;
    if (!gl || this.destroyed || !this.program || !this.discVAO) return;
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE); // Disable culling for now to show all faces
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.useProgram(this.program);
    
    gl.uniformMatrix4fv(this.locations.uWorldMatrix, false, this.worldMatrix);
    gl.uniformMatrix4fv(this.locations.uViewMatrix, false, this.viewMatrix);
    gl.uniformMatrix4fv(this.locations.uProjectionMatrix, false, this.projectionMatrix);
    gl.uniform4f(this.locations.uRotationAxisVelocity, 0, 1, 0, this.rotationVelocity || 0);
    gl.uniform1i(this.locations.uItemCount, Math.max(1, this.images.length));
    gl.uniform1i(this.locations.uAtlasSize, Math.max(1, this.atlasSize));
    gl.uniform1i(this.locations.uTex, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    gl.bindVertexArray(this.discVAO);
    gl.drawElementsInstanced(gl.TRIANGLES, this.discIndexCount, gl.UNSIGNED_SHORT, 0, this.instanceCount);
    gl.bindVertexArray(null);
  }
  
  run(time = 0) {
    if (this.destroyed) return;
    
    this.animate(time);
    this.render();
    
    this.animationId = requestAnimationFrame(t => this.run(t));
  }
  
  destroy() {
    this.destroyed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.gl) {
      this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
}

// Check answer in 3D card mode - WITH CSS 3D ANIMATION
function check3DCardAnswer(btnElement, selected, correct) {
  if (answered) return;
  answered = true;
  
  // Record answer time
  if (questionOptionsShownTime > 0) {
    const answerTime = Date.now() - questionOptionsShownTime;
    sessionAnswerTimes.push(answerTime);
  }
  
  const isCorrect = selected === correct;
  
  // Visual feedback
  document.querySelectorAll('.card3d-answer-btn').forEach(btn => {
    btn.style.pointerEvents = 'none';
    if (btn.dataset.answer === correct) {
      btn.classList.add('correct');
    } else if (btn === btnElement && !isCorrect) {
      btn.classList.add('wrong');
    }
  });
  
  // Update score display
  const scoreEl = document.getElementById('card3d-score');
  if (isCorrect) {
    singlePlayerScore++;
    currentSessionCorrect++;
  } else {
    currentSessionWrong++;
  }
  if (scoreEl) scoreEl.textContent = `Score: ${singlePlayerScore}`;
  
  // Play sound
  if (isCorrect) {
    playCorrectSound();
  } else {
    playWrongSound();
  }
  
  // Check if game should end
  if (questionCount >= maxQuestions) {
    clearInterval(timer);
    setTimeout(() => showUnifiedResults(), 800);
    return;
  }
  
  // Animate to next question using CSS 3D transition
  setTimeout(() => {
    animateToNextQuestion(() => {
      answered = false;
      questionOptionsShownTime = Date.now();
      startTimer(currentQuestionData.correctAnswer);
    });
  }, 480); // Show feedback before animating (480ms + 520ms animation = 1s total)
}

// Timer for 3D card mode
let card3dTimerInterval = null;

function start3DCardTimer(correctAnswer) {
  clearInterval(card3dTimerInterval);
  
  if (gameMode !== 'casual') return; // Casual has no time pressure per question
  
  // For casual mode, we don't have a per-question timer
  // Just update the display if there's a global timer
}

// Update 3D card timer display
function update3DCardTimerDisplay() {
  const timerEl = document.getElementById('card3d-timer');
  if (timerEl) {
    timerEl.textContent = `${timeLeft}s`;
  }
}

// Display question in unified quiz screen
function displayUnifiedQuestion() {
  // Check if we should use 3D card mode
  if (shouldUse3DCardMode()) {
    display3DCardQuestion();
    return;
  }
  
  // Don't display new question if game ended
  if (gameEnded) return;

  const quizScreen = document.getElementById('unified-quiz-screen');
  if (!quizScreen) return;

  // Get current question data
  let randomFlag, questionIdentifier;

  if (JSON_TOPICS.includes(currentTopic)) {
    // JSON topics - track by question text (or by image for logos since all have same question)
    const trackingKey = currentTopic === 'logos' ? 'image' : 'question';
    const remaining = flags.filter(f => !usedFlags.includes(f[trackingKey]));
    if (remaining.length === 0) usedFlags = [];
    randomFlag = remaining[Math.floor(Math.random() * remaining.length)];
    usedFlags.push(randomFlag[trackingKey]);
    questionIdentifier = randomFlag[trackingKey];
  } else {
    // Other topics track by country
    const remaining = flags.filter(f => !usedFlags.includes(f.country));
    if (remaining.length === 0) usedFlags = [];
    randomFlag = remaining[Math.floor(Math.random() * remaining.length)];
    usedFlags.push(randomFlag.country);
    questionIdentifier = randomFlag.country;
  }

  questionCount++;

  // Determine question text
  let questionText = '';
  if (JSON_TOPICS.includes(currentTopic)) {
    questionText = randomFlag.question;
  } else if (currentTopic === 'capitals') {
    questionText = `What is the capital of ${randomFlag.country}?`;
  } else if (currentTopic === 'borders') {
    questionText = "Which country's border is this?";
  } else if (currentTopic === 'area') {
    questionText = `What is the area of ${randomFlag.country}?`;
  } else if (currentTopic === 'flags' && randomFlag.entityType) {
    questionText = getQuestionTextForEntity(randomFlag.entityType);
  } else {
    questionText = "Which country's flag is this?";
  }

  // Determine image source
  let imageSrc = '';
  let imageClass = '';
  let imageHTML = '';

  if (JSON_TOPICS.includes(currentTopic)) {
    // UNIFIED image handling for all JSON topics
    const config = getTopicConfig(currentTopic);
    if (randomFlag.image) {
      // Special handling for logos - use local SVG files
      if (currentTopic === 'logos') {
        const filename = randomFlag.image.replace('logo_images/', '');
        imageSrc = `topic_images/logo_images/${filename}`;
        imageClass = 'logo-image';
      } else {
        imageSrc = randomFlag.image;
      }
    } else {
      // Use topic icon image instead of emoji
      const topicIconPath = getTopicImagePath(currentTopic);
      imageHTML = `<div style="margin:20px 0;"><img src="${topicIconPath}" style="width:120px;height:120px;object-fit:cover;border-radius:50%;border:2px solid rgba(167, 139, 250, 0.3);box-shadow:0 8px 20px rgba(0,0,0,0.3);" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><div style="display:none;font-size:80px;">${config.icon}</div></div>`;
    }
  } else if (currentTopic === 'flags') {
    imageSrc = randomFlag.flag;
  } else if (currentTopic === 'capitals') {
    const sanitizedCapital = randomFlag.capital.replace(/[/\\?%*:|"<>]/g, "_");
    // Use Cloudinary CDN or local images based on configuration
    imageSrc = USE_LOCAL_IMAGES
      ? `./topic_images/capital_images/${sanitizedCapital}.jpg`
      : `${CLOUDINARY_BASE_URL}${sanitizedCapital}.jpg`;
    // DEBUG: Log unified quiz system image URL
    console.log('[Unified Quiz] Loading capital image:', imageSrc);
  } else if (currentTopic === 'borders') {
    imageSrc = `topic_images/country_silhouettes/${randomFlag.isoCode}.png`;
    imageClass = 'border-style';
  } else if (currentTopic === 'area') {
    const missingBorders = ['xk', 'mh', 'fm', 'ps', 'tv'];
    if (missingBorders.includes(randomFlag.isoCode)) {
      imageSrc = `topic_images/flags/${randomFlag.isoCode}.png`;
    } else {
      imageSrc = `topic_images/country_silhouettes/${randomFlag.isoCode}.png`;
      imageClass = 'border-style';
    }
  }

  // Generate answer options
  let options;
  let correctAnswer;

  if (JSON_TOPICS.includes(currentTopic)) {
    // Football, history, movies, marvel, premier-league, champions-league, world-cup, and messi already have options in the question data
    options = randomFlag.options.map(opt => ({ text: opt }));
    correctAnswer = randomFlag.correctAnswer;
  } else if (currentTopic === 'area') {
    options = [
      { area: randomFlag.area, isCorrect: true },
      ...randomFlag.wrongAnswers.map(area => ({ area, isCorrect: false }))
    ];
    options = shuffle(options);
    correctAnswer = formatArea(randomFlag.area);
  } else {
    const wrongAnswers = generateBaitAnswers(randomFlag);
    options = shuffle([randomFlag, ...wrongAnswers]);
    correctAnswer = currentTopic === 'capitals' ? randomFlag.capital : randomFlag.country;
  }

  // Build header info
  let headerInfo = '';
  if (gameMode === 'time-attack') {
    headerInfo = `<span id="unified-timer" style="color:#a78bfa;font-size:24px;font-weight:bold;">⏳ ${timeLeft}s</span>`;
  } else if (gameMode === 'casual') {
    headerInfo = `<span id="unified-timer" style="color:#a78bfa;font-size:20px;font-weight:bold;">⏳ ${timeLeft}s | Q ${questionCount}/${maxQuestions}</span>`;
  } else if (gameMode === 'three-hearts') {
    headerInfo = `<span style="color:#FF6B6B;font-size:20px;">${'❤️'.repeat(livesRemaining)}${'🖤'.repeat(3-livesRemaining)}</span>`;
  } else if (gameMode === 'two') {
    headerInfo = `<span id="unified-timer" style="color:#a78bfa;font-size:18px;">⏳ ${timeLeft}s | Q ${questionCount}/${maxQuestions}</span>`;
  } else {
    headerInfo = `<span style="color:#a78bfa;font-size:18px;">Q ${questionCount}/${maxQuestions}</span>`;
  }

  // Build player info (for 2-player mode)
  let playerInfo = '';
  if (gameMode === 'two') {
    playerInfo = `<div style="color:#fff;margin-bottom:10px;font-size:16px;">
      <span style="${currentPlayer === 1 ? 'background:rgba(124, 58, 237, 0.9);padding:5px 10px;border-radius:5px;' : ''}">P1: ${player1Score}</span>
      <span style="margin:0 10px;">|</span>
      <span style="${currentPlayer === 2 ? 'background:rgba(124, 58, 237, 0.9);padding:5px 10px;border-radius:5px;' : ''}">P2: ${player2Score}</span>
    </div>`;
  }

  // Build score display
  const scoreDisplay = gameMode === 'two' ? '' : `<div style="color:#a78bfa;font-size:16px;margin:10px 0;font-weight:bold;">Score: ${singlePlayerScore}</div>`;

  // Build options HTML
  let optionsHTML = '';
  options.forEach(opt => {
    let btnText = '';
    let btnAnswer = '';

    if (JSON_TOPICS.includes(currentTopic)) {
      btnText = opt.text;
      btnAnswer = opt.text;
    } else if (currentTopic === 'capitals') {
      btnText = opt.capital;
      btnAnswer = opt.capital;
    } else if (currentTopic === 'area') {
      btnText = formatArea(opt.area);
      btnAnswer = formatArea(opt.area);
    } else {
      btnText = opt.country;
      btnAnswer = opt.country;
    }

    optionsHTML += `<button class="unified-option-btn" data-answer="${btnAnswer.replace(/"/g, '&quot;')}" data-correct="${correctAnswer.replace(/"/g, '&quot;')}" style="width:100%;padding:16px;font-size:16px;border:2px solid rgba(167, 139, 250, 0.3);border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;transition:all 0.2s;">${btnText}</button>`;
  });

  // Render the content (only update content wrapper, keep galaxy intact)
  const contentWrapper = document.getElementById('quiz-content-wrapper');
  if (contentWrapper) {
    contentWrapper.innerHTML = `
      <div style="position:absolute;top:15px;left:15px;">
        <button onclick="playClickSound(); exitUnifiedQuiz()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 15px;border-radius:8px;font-size:1.2rem;cursor:pointer;font-weight:bold;">←</button>
      </div>
      <div style="width:100%;max-width:500px;text-align:center;">
        ${headerInfo}
        ${playerInfo}
        ${scoreDisplay}
        ${JSON_TOPICS.includes(currentTopic) ? (imageSrc ? `<div style="margin:20px 0;"><img src="${imageSrc}" class="${imageClass}" style="max-width:350px;width:90%;height:auto;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.3);" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='block';"><div style="display:none;font-size:80px;">${getTopicConfig(currentTopic).icon}</div></div>` : imageHTML) : ''}
        ${!JSON_TOPICS.includes(currentTopic) && imageSrc ? `<img src="${imageSrc}" style="max-width:350px;width:90%;height:auto;margin:20px auto;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : ''}
        <div style="background:rgba(255,255,255,0.1);border-radius:15px;padding:25px;margin:20px 0;box-shadow:0 4px 15px rgba(124, 58, 237, 0.2);">
          <p style="color:#fff;font-size:20px;line-height:1.4;">${questionText}</p>
        </div>
        <div id="unified-options" style="display:flex;flex-direction:column;gap:12px;">
          ${optionsHTML}
        </div>
      </div>
    `;
  }

  // Add click handlers to options
  document.querySelectorAll('.unified-option-btn').forEach(btn => {
    btn.onclick = () => checkUnifiedAnswer(btn.dataset.answer, btn.dataset.correct);
  });

  // Start answer time tracking (for avg time per question)
  questionOptionsShownTime = Date.now();

  // Start timer
  startTimer(correctAnswer);
}

// Check answer in unified quiz
function checkUnifiedAnswer(selected, correct) {
  if (answered) return;
  answered = true;

  // Record answer time (reaction time for this question)
  if (questionOptionsShownTime > 0) {
    const answerTime = Date.now() - questionOptionsShownTime;
    sessionAnswerTimes.push(answerTime);
  }

  // List of topics that track stats
  const trackedTopics = ALL_TOPICS;

  const buttons = document.querySelectorAll('.unified-option-btn');
  buttons.forEach(btn => {
    btn.onclick = null;
    if (btn.dataset.answer === correct) {
      btn.style.background = 'rgba(34, 197, 94, 0.9)';
      btn.style.borderColor = 'rgba(34, 197, 94, 0.9)';
      btn.style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.4)';
    } else if (btn.dataset.answer === selected && selected !== correct) {
      btn.style.background = '#f44336';
      btn.style.borderColor = '#f44336';
      btn.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.4)';
    }
  });

  // Update scores
  if (selected === correct) {
    // Play correct sound
    playCorrectSound();

    if (gameMode === 'two') {
      if (currentPlayer === 1) player1Score++;
      else player2Score++;
    } else {
      singlePlayerScore++;
    }
    // Track stats for all supported topics
    if (trackedTopics.includes(currentTopic)) {
      currentSessionCorrect++;
      currentStreak++;
      if (currentStreak > bestSessionStreak) {
        bestSessionStreak = currentStreak;
      }
      
      // Track unlocked question (Questions Completed system)
      const isNewUnlock = trackUnlockedQuestion(currentTopic, correct);
      if (isNewUnlock) {
        sessionNewUnlocks.push(correct);
      }
    }
  } else {
    // Play wrong sound
    playWrongSound();
    
    if (gameMode === 'three-hearts') {
      livesRemaining--;
      if (livesRemaining <= 0) {
        clearInterval(timer);
        setTimeout(() => showUnifiedResults(), 800);
        return;
      }
    }
    // Track stats for all supported topics
    if (trackedTopics.includes(currentTopic)) {
      currentSessionWrong++;
      currentStreak = 0;
    }
  }

  // Check if game should end
  if (gameMode === 'two' && questionCount >= maxQuestions) {
    clearInterval(timer);
    setTimeout(() => showUnifiedResults(), 800);
    return;
  } else if (gameMode === 'casual' && questionCount >= maxQuestions) {
    clearInterval(timer);
    setTimeout(() => showUnifiedResults(), 800);
    return;
  }

  // Switch player in 2-player mode
  if (gameMode === 'two') {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
  }

  // Next question
  setTimeout(() => {
    answered = false;
    displayUnifiedQuestion();
  }, 800);
}

// ⭐ XP CIRCLE ANIMATION HELPERS
const XP_ANIMATION_DURATION = 2200; // 2.2 seconds (matches XP Fill sound)

function animateXPNumber(element, startValue, endValue, duration, prefix = '') {
  const startTime = performance.now();
  const change = endValue - startValue;
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(startValue + (change * progress));
    element.textContent = prefix + currentValue;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function animateXPCircleFill(circleEl, existingDeg, endNewDeg, duration, positionCallback) {
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentNewDeg = endNewDeg * progress;
    const cappedTotalDeg = Math.min(existingDeg + currentNewDeg, 360);
    
    circleEl.style.background = `conic-gradient(
      #ff3333 0deg,
      #ff3333 ${existingDeg}deg,
      #ff6b6b ${existingDeg}deg,
      #ff6b6b ${cappedTotalDeg}deg,
      transparent ${cappedTotalDeg}deg
    )`;
    
    if (positionCallback) positionCallback(existingDeg, cappedTotalDeg);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function positionXPArrows(existingDeg, totalDeg, wrapperEl) {
  const radius = 90;
  const centerX = radius;
  const centerY = radius;
  
  const arrowGained = wrapperEl.querySelector('.xp-arrow-gained');
  const arrowNeeded = wrapperEl.querySelector('.xp-arrow-needed');
  const arrowCompleted = wrapperEl.querySelector('.xp-arrow-completed');
  const labelGained = wrapperEl.querySelector('.xp-label-gained');
  const labelCompleted = wrapperEl.querySelector('.xp-label-completed');
  const labelNeeded = wrapperEl.querySelector('.xp-label-needed');
  
  const dotGained = wrapperEl.querySelector('.xp-dot-gained');
  const dotNeeded = wrapperEl.querySelector('.xp-dot-needed');
  const dotCompleted = wrapperEl.querySelector('.xp-dot-completed');
  
  const wrapperRect = wrapperEl.getBoundingClientRect();
  
  // Calculate new XP degrees
  const newDeg = totalDeg - existingDeg;
  
  // Hide XP GAINED if no new XP
  if (newDeg <= 0 && labelGained) {
    labelGained.style.display = 'none';
    if (arrowGained) arrowGained.style.display = 'none';
  } else if (labelGained) {
    labelGained.style.display = 'block';
    if (arrowGained) arrowGained.style.display = 'block';
  }
  
  // Hide OVERALL XP if no existing XP
  if (existingDeg <= 0 && labelCompleted) {
    labelCompleted.style.display = 'none';
    if (arrowCompleted) arrowCompleted.style.display = 'none';
  } else if (labelCompleted) {
    labelCompleted.style.display = 'block';
    if (arrowCompleted) arrowCompleted.style.display = 'block';
  }
  
  // Position XP GAINED arrow
  if (dotGained && arrowGained && newDeg > 0) {
    const dotRect = dotGained.getBoundingClientRect();
    const gainedAngle = (totalDeg - 90) * (Math.PI / 180);
    const circleX = centerX + Math.cos(gainedAngle) * radius;
    const circleY = centerY + Math.sin(gainedAngle) * radius;
    const dotX = (dotRect.left + dotRect.width / 2) - wrapperRect.left;
    const dotY = (dotRect.top + dotRect.height / 2) - wrapperRect.top;
    
    arrowGained.innerHTML = `<svg width="300" height="200" style="position:absolute;left:-50px;top:-10px;overflow:visible;">
      <line x1="${dotX + 50}" y1="${dotY + 10}" x2="${circleX + 50}" y2="${circleY + 10}" stroke="#ff3333" stroke-width="2"/>
    </svg>`;
  }
  
  // Position XP TO LEVEL arrow
  if (dotNeeded && arrowNeeded && labelNeeded) {
    const emptyMidDeg = totalDeg + ((360 - totalDeg) / 2);
    const emptyAngle = (emptyMidDeg - 90) * (Math.PI / 180);
    const emptyY = centerY + Math.sin(emptyAngle) * radius;
    const labelYPercent = (emptyY / (radius * 2)) * 100;
    const clampedY = Math.max(15, Math.min(50, labelYPercent));
    labelNeeded.style.top = `${clampedY}%`;
    
    setTimeout(() => {
      const dotRect = dotNeeded.getBoundingClientRect();
      const newWrapperRect = wrapperEl.getBoundingClientRect();
      const dotX = (dotRect.left + dotRect.width / 2) - newWrapperRect.left;
      const dotY = (dotRect.top + dotRect.height / 2) - newWrapperRect.top;
      
      if (totalDeg > 320) {
        const targetX = centerX + Math.cos(emptyAngle) * radius;
        const targetY = centerY + Math.sin(emptyAngle) * radius;
        arrowNeeded.innerHTML = `<svg width="300" height="200" style="position:absolute;left:-100px;top:-10px;overflow:visible;">
          <line x1="${dotX + 100}" y1="${dotY + 10}" x2="${targetX + 100}" y2="${targetY + 10}" stroke="#888" stroke-width="2"/>
        </svg>`;
      } else {
        const dy = dotY - centerY;
        const touchX = centerX - Math.sqrt(Math.max(0, radius * radius - dy * dy));
        arrowNeeded.innerHTML = `<svg width="300" height="200" style="position:absolute;left:-100px;top:-10px;overflow:visible;">
          <line x1="${dotX + 100}" y1="${dotY + 10}" x2="${touchX + 100}" y2="${dotY + 10}" stroke="#888" stroke-width="2"/>
        </svg>`;
      }
    }, 10);
  }
  
  // Position OVERALL XP arrow
  if (dotCompleted && arrowCompleted && existingDeg > 0) {
    const dotRect = dotCompleted.getBoundingClientRect();
    const completedAngle = (existingDeg - 90) * (Math.PI / 180);
    const circleX = centerX + Math.cos(completedAngle) * radius;
    const circleY = centerY + Math.sin(completedAngle) * radius;
    const dotX = (dotRect.left + dotRect.width / 2) - wrapperRect.left;
    const dotY = (dotRect.top + dotRect.height / 2) - wrapperRect.top;
    
    arrowCompleted.innerHTML = `<svg width="300" height="200" style="position:absolute;left:-50px;top:-10px;overflow:visible;">
      <line x1="${dotX + 50}" y1="${dotY + 10}" x2="${circleX + 50}" y2="${circleY + 10}" stroke="#ff3333" stroke-width="2"/>
    </svg>`;
  }
}

// Show unified results screen
function showUnifiedResults() {
  // SAVE STATS FIRST (completed = true because quiz finished naturally)
  const trackedTopics = ALL_TOPICS;
  if (trackedTopics.includes(currentTopic)) {
    saveQuizStats(currentTopic, true);
  }

  clearInterval(timer);

  // ⭐ XP CALCULATION
  let xpResult = null;
  if (trackedTopics.includes(currentTopic) && gameMode !== 'two') {
    const topicData = getTopicXPData(currentTopic);
    let xpEarned = 0;
    
    if (gameMode === 'casual') {
      xpEarned = getXPCasual(currentSessionCorrect, topicData);
    } else if (gameMode === 'time-attack') {
      xpEarned = getXPTimeAttack(currentSessionCorrect, questionCount, topicData);
    } else if (gameMode === 'three-hearts') {
      xpEarned = getXPThreeHearts(currentSessionCorrect, questionCount, bestSessionStreak, topicData);
    }
    
    if (xpEarned > 0) {
      xpResult = addXP(currentTopic, xpEarned);
    }
  }

  const quizScreen = document.getElementById('unified-quiz-screen');
  if (!quizScreen) return;

  let resultText = '';
  let scoreDisplay = '';

  if (gameMode === 'time-attack') {
    resultText = 'Time Attack Complete!';
    scoreDisplay = `${singlePlayerScore}`;
  } else if (gameMode === 'casual') {
    resultText = 'Casual Complete!';
    scoreDisplay = `${singlePlayerScore} / ${maxQuestions}`;
  } else if (gameMode === 'three-hearts') {
    resultText = '3 Hearts Complete!';
    scoreDisplay = `${singlePlayerScore}`;
  } else {
    resultText = 'Game Over!';
    scoreDisplay = player1Score > player2Score ? `Player 1 Wins! ${player1Score} - ${player2Score}` :
                   player2Score > player1Score ? `Player 2 Wins! ${player2Score} - ${player1Score}` :
                   `Tie! ${player1Score} - ${player2Score}`;
  }

  // Use session tracking for accurate percentage (avoids phantom +1 bug)
  const totalAnswered = currentSessionCorrect + currentSessionWrong;
  const percentage = gameMode === 'two' ? 0 : (totalAnswered > 0 ? Math.round((currentSessionCorrect / totalAnswered) * 100) : 0);
  const message = percentage >= 80 ? '🏆 Excellent!' : percentage >= 60 ? '⭐ Great Job!' : percentage >= 40 ? '👍 Good Effort!' : '💪 Keep Practicing!';

  // Build XP display HTML with circular progress
  let xpDisplayHTML = '';
  let xpAnimationData = null;
  
  if (xpResult && gameMode !== 'two') {
    const topicData = getTopicXPData(currentTopic);
    const progress = getLevelProgress(topicData);
    
    // Calculate existing XP percent (bright red) and new XP percent (dim red)
    let existingPercent, newPercent, leveledUp = xpResult.leveledUp;
    let oldLevelExistingPercent = 0; // For level up animation phase 1
    
    if (leveledUp) {
      // Calculate old level's fill percentage before the game
      const oldLevelReq = xpNeededForLevel(xpResult.oldLevel) - (xpResult.oldLevel > 1 ? xpNeededForLevel(xpResult.oldLevel - 1) : 0);
      const xpUsedToCompleteOldLevel = xpResult.xpGained - progress.current;
      const xpInOldLevelBefore = oldLevelReq - xpUsedToCompleteOldLevel;
      oldLevelExistingPercent = Math.max(0, (xpInOldLevelBefore / oldLevelReq) * 100);
      
      // New level starts at 0, fills to current progress
      existingPercent = 0;
      newPercent = (progress.current / progress.needed) * 100;
    } else {
    const existingXPInLevel = progress.current - xpResult.xpGained;
      existingPercent = Math.max(0, (existingXPInLevel / progress.needed) * 100);
      newPercent = (xpResult.xpGained / progress.needed) * 100;
    }
    
    // Store data for animation
    xpAnimationData = {
      xpGained: xpResult.xpGained,
      existingPercent,
      newPercent,
      totalXP: topicData.xp,
      xpToLevel: progress.remaining,
      level: topicData.level,
      leveledUp: leveledUp,
      oldLevelExistingPercent: oldLevelExistingPercent,
      newLevel: xpResult.newLevel
    };
    
    // Show OLD level initially if leveling up, otherwise current level
    const displayLevel = leveledUp ? xpResult.oldLevel : topicData.level;
    const nextLevelNum = leveledUp ? xpResult.newLevel : topicData.level + 1;
    
    xpDisplayHTML = `
      <div id="xpCircleWrapper" style="position:relative;width:180px;height:180px;margin:20px auto;">
        <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:#1a1a2e;border:8px solid #2a2a3e;"></div>
        <div id="xpCircleProgress" style="position:absolute;width:100%;height:100%;border-radius:50%;background:transparent;"></div>
        <div style="position:absolute;inset:12px;border-radius:50%;background:linear-gradient(145deg,#1e2740,#151c2e);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 2px 15px rgba(0,0,0,0.5);">
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#ff6b6b;opacity:0.9;">Level</span>
          <span id="xpLevelNumber" style="font-size:52px;font-weight:800;color:#fff;line-height:1;">${displayLevel}</span>
        </div>
        
        <!-- XP GAINED (right side) -->
        <div class="xp-arrow-gained" style="position:absolute;pointer-events:none;overflow:visible;"></div>
        <div class="xp-label-gained" style="position:absolute;right:-100px;top:50%;transform:translateY(-50%);font-size:11px;white-space:nowrap;text-align:center;color:#ff3333;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="xp-dot-gained" style="width:6px;height:6px;border-radius:50%;background:#ff3333;margin-top:14px;"></span>
            <span>XP GAINED</span>
          </div>
          <div id="xpGainedValue" style="font-size:11px;font-weight:700;margin-top:2px;">+0</div>
        </div>
        
        <!-- XP TO LEVEL (left side) -->
        <div class="xp-arrow-needed" style="position:absolute;pointer-events:none;overflow:visible;"></div>
        <div class="xp-label-needed" style="position:absolute;left:-100px;top:50%;transform:translateY(-50%);font-size:11px;white-space:nowrap;text-align:center;color:#888;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="xpToLevelText">XP TO LEVEL ${nextLevelNum}</span>
            <span class="xp-dot-needed" style="width:6px;height:6px;border-radius:50%;background:#888;margin-top:14px;"></span>
          </div>
          <div id="xpNeededValue" style="font-size:11px;font-weight:700;margin-top:2px;">${progress.remaining + xpResult.xpGained}</div>
        </div>
        
        <!-- OVERALL XP (bottom right) -->
        <div class="xp-arrow-completed" style="position:absolute;pointer-events:none;overflow:visible;"></div>
        <div class="xp-label-completed" style="position:absolute;right:-100px;bottom:-10px;font-size:11px;white-space:nowrap;text-align:center;color:#ff3333;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="xp-dot-completed" style="width:6px;height:6px;border-radius:50%;background:#ff3333;margin-top:14px;"></span>
            <span>OVERALL XP</span>
          </div>
          <div id="xpOverallValue" style="font-size:11px;font-weight:700;margin-top:2px;">${topicData.xp}</div>
        </div>
      </div>
      ${xpResult.leveledUp ? `<div style="color:#00FF00;font-size:18px;margin-top:10px;">🎉 Level Up! Level ${xpResult.newLevel}</div>` : ''}
      ${xpResult.newUnlocks.length > 0 ? `<div style="color:#00BFFF;font-size:16px;margin-top:5px;">🔓 ${xpResult.newUnlocks.includes('timeAttack') ? 'Time Attack' : '3 Hearts'} Unlocked!</div>` : ''}
    `;
  }

  // Get topic icon and name
  const topicIcon = currentTopic === 'flags' ? '🏳️' :
                    currentTopic === 'capitals' ? '🏛️' :
                    currentTopic === 'borders' ? '🗺️' :
                    currentTopic === 'football' ? '⚽' :
                    currentTopic === 'world-history' ? '🌍' : '📏';
  const topicName = currentTopic.charAt(0).toUpperCase() + currentTopic.slice(1).replace('-', ' ');
  
  // Get player level and title
  const topicDataForDisplay = xpResult ? getTopicXPData(currentTopic) : { level: 1 };
  const playerLevel = topicDataForDisplay.level || 1;
  const playerTitle = playerLevel >= 20 ? 'Master' : playerLevel >= 10 ? 'Expert' : playerLevel >= 5 ? 'Intermediate' : 'Beginner';
  
  // Calculate XP breakdown for display
  let perfXP = 0, compXP = 0, bonusXP = 0, survivalXP = 0, streakXP = 0, speedXP = 0, accuracyXP = 0, totalXPEarned = 0;
  let is3Hearts = gameMode === 'three-hearts';
  let isTimeAttack = gameMode === 'time-attack';
  
  if (xpResult) {
    if (gameMode === 'casual') {
      perfXP = currentSessionCorrect * 10;
      compXP = 10;
      // LCB calculation
      const lcbMultipliers = [100, 60, 40, 20, 10, 0];
      const lcbBase = lcbMultipliers[Math.min(currentSessionCorrect, 5)] || 0;
      bonusXP = playerLevel <= 20 ? lcbBase : 0;
    } else if (gameMode === 'time-attack') {
      perfXP = currentSessionCorrect * 5;
      speedXP = questionCount;
      accuracyXP = questionCount > 0 ? Math.floor((currentSessionCorrect / questionCount) * 20) : 0;
      compXP = 20;
    } else if (gameMode === 'three-hearts') {
      perfXP = Math.floor(currentSessionCorrect * 12.5);
      survivalXP = Math.floor(Math.min(questionCount * 1.5, 75));
      streakXP = bestSessionStreak * 2;
    }
    totalXPEarned = xpResult.xpGained;
  }

  // Keep galaxy background visible (don't override with gradient)
  // Update content wrapper, not the whole screen
  const contentWrapper = document.getElementById('quiz-content-wrapper');
  if (!contentWrapper) return;
  
  contentWrapper.innerHTML = `
    <div style="text-align:center;max-width:450px;padding:20px;position:relative;z-index:1;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="width:36px;"></div>
        <div style="text-align:center;flex:1;">
          <div style="color:#888;font-size:14px;font-weight:400;text-transform:uppercase;letter-spacing:2px;">Results</div>
          <div style="color:#fff;font-size:18px;font-weight:600;margin-top:2px;">${topicName}</div>
        </div>
        <button onclick="playClickSound(); exitUnifiedQuiz()" style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#888;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      
      <!-- Player Section -->
      <div style="display:flex;flex-direction:column;align-items:center;margin:25px 0;">
        <div style="position:relative;margin-bottom:15px;">
          <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:50px;border:4px solid #00d4aa;box-shadow:0 0 20px rgba(0,212,170,0.4);">👤</div>
          <div style="position:absolute;top:-5px;right:-15px;background:linear-gradient(135deg,#00d4aa,#00ff88);color:#000;font-size:18px;font-weight:800;padding:5px 12px;border-radius:20px;box-shadow:0 4px 15px rgba(0,212,170,0.5);">${singlePlayerScore}</div>
        </div>
        <div style="font-size:22px;font-weight:700;color:#00d4aa;margin-bottom:3px;">Player123</div>
        <div style="font-size:14px;color:#888;margin-bottom:3px;">${playerTitle}</div>
        <div style="font-size:13px;color:#666;">Level ${playerLevel}</div>
      </div>
      
      <!-- XP Breakdown Boxes -->
      ${xpResult ? `
      <div style="display:flex;justify-content:center;gap:8px;margin:20px 0;flex-wrap:wrap;">
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #22c55e;color:#22c55e;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Performance</div>
          <div style="font-size:20px;font-weight:700;">${perfXP}</div>
        </div>
        ${is3Hearts ? `
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #f59e0b;color:#f59e0b;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Survival</div>
          <div style="font-size:20px;font-weight:700;">${survivalXP}</div>
        </div>
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #06b6d4;color:#06b6d4;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Streak</div>
          <div style="font-size:20px;font-weight:700;">${streakXP}</div>
        </div>
        ` : isTimeAttack ? `
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #a855f7;color:#a855f7;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Speed</div>
          <div style="font-size:20px;font-weight:700;">${speedXP}</div>
        </div>
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #06b6d4;color:#06b6d4;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Accuracy</div>
          <div style="font-size:20px;font-weight:700;">${accuracyXP}</div>
        </div>
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #f59e0b;color:#f59e0b;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Completion</div>
          <div style="font-size:20px;font-weight:700;">${compXP}</div>
        </div>
        ` : `
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #f59e0b;color:#f59e0b;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Completion</div>
          <div style="font-size:20px;font-weight:700;">${compXP}</div>
        </div>
        ${bonusXP > 0 ? `
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #06b6d4;color:#06b6d4;min-width:70px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">LCB Bonus</div>
          <div style="font-size:20px;font-weight:700;">${Math.floor(bonusXP)}</div>
        </div>
        ` : ''}
        `}
        <div style="text-align:center;padding:10px 12px;border-radius:8px;border:2px solid #ef4444;color:#ef4444;min-width:70px;background:rgba(239,68,68,0.1);">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:4px;">Total XP</div>
          <div style="font-size:20px;font-weight:700;">${totalXPEarned}</div>
        </div>
      </div>
      ` : ''}
      
      ${xpDisplayHTML}
      
      ${gameMode !== 'two' ? `<p style="color:#00d4aa;font-size:16px;margin:20px 0;">${message}</p>` : ''}

      <button onclick="playClickSound(); restartUnifiedQuiz()" style="width:100%;padding:16px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#00d4aa,#00ff88);color:#1a1a2e;font-weight:600;cursor:pointer;box-shadow:0 8px 25px rgba(0,212,170,0.4);">▶ Play Again</button>
      
      <!-- Add to Slot Button -->
      <button onclick="playClickSound(); openSlotModal('${currentTopic}')" style="width:100%;padding:14px;margin:8px 0;font-size:16px;border:2px solid rgba(167,139,250,0.5);border-radius:12px;background:rgba(167,139,250,0.15);color:#a78bfa;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.3s ease;">
        <span style="font-size:1.2rem;">+</span> Add to My Slots
      </button>
    </div>
  `;
  
  // Animate XP circle if we have data
  if (xpAnimationData) {
    setTimeout(() => {
      const wrapper = document.getElementById('xpCircleWrapper');
      const circle = document.getElementById('xpCircleProgress');
      const xpGainedEl = document.getElementById('xpGainedValue');
      const xpNeededEl = document.getElementById('xpNeededValue');
      const levelDisplay = document.getElementById('xpLevelNumber');
      const xpToLevelText = document.getElementById('xpToLevelText');
      
      if (wrapper && circle) {
        // Play XP Fill sound
        playXpFillSound();
        
        if (xpAnimationData.leveledUp) {
          // TWO-PHASE ANIMATION for level up
          // Phase 1: Fill old level from existing to 100%
          const oldExistingDeg = (xpAnimationData.oldLevelExistingPercent / 100) * 360;
          const remainingToFillDeg = 360 - oldExistingDeg;
          const phase1Duration = XP_ANIMATION_DURATION * 0.6; // 60% of time for phase 1
          const phase2Duration = XP_ANIMATION_DURATION * 0.4; // 40% of time for phase 2
          
          // Phase 1: Fill to 100%
          animateXPCircleFill(circle, oldExistingDeg, remainingToFillDeg, phase1Duration, (existDeg, totalDeg) => {
            positionXPArrows(existDeg, totalDeg, wrapper);
          });
          
          // Phase 2: After phase 1, flash and start new level
          setTimeout(() => {
            // Stop XP fill sound, play level up sound
            stopXpFillSound();
            playLevelUpSound();
            
            // Flash effect
            circle.style.transition = 'opacity 0.15s';
            circle.style.opacity = '0.3';
            setTimeout(() => {
              circle.style.opacity = '1';
              // Update level number and "XP TO LEVEL" text
              if (levelDisplay) levelDisplay.textContent = xpAnimationData.newLevel;
              if (xpToLevelText) xpToLevelText.textContent = `XP TO LEVEL ${xpAnimationData.newLevel + 1}`;

              // Reset and animate new level
              const newDeg = (xpAnimationData.newPercent / 100) * 360;
              animateXPCircleFill(circle, 0, newDeg, phase2Duration, (existDeg, totalDeg) => {
                positionXPArrows(existDeg, totalDeg, wrapper);
              });
            }, 150);
          }, phase1Duration);
          
          // Animate numbers
          if (xpGainedEl) animateXPNumber(xpGainedEl, 0, xpAnimationData.xpGained, XP_ANIMATION_DURATION, '+');
          if (xpNeededEl) animateXPNumber(xpNeededEl, xpAnimationData.xpToLevel + xpAnimationData.xpGained, xpAnimationData.xpToLevel, XP_ANIMATION_DURATION);
          
        } else {
          // SINGLE-PHASE ANIMATION (no level up)
        const existingDeg = (xpAnimationData.existingPercent / 100) * 360;
        const newDeg = (xpAnimationData.newPercent / 100) * 360;
        
        // Animate numbers
        if (xpGainedEl) animateXPNumber(xpGainedEl, 0, xpAnimationData.xpGained, XP_ANIMATION_DURATION, '+');
        if (xpNeededEl) animateXPNumber(xpNeededEl, xpAnimationData.xpToLevel + xpAnimationData.xpGained, xpAnimationData.xpToLevel, XP_ANIMATION_DURATION);
        
        // Animate circle fill
        animateXPCircleFill(circle, existingDeg, newDeg, XP_ANIMATION_DURATION, (existDeg, totalDeg) => {
          positionXPArrows(existDeg, totalDeg, wrapper);
        });
          
          // Stop XP fill sound when animation ends
          setTimeout(() => {
            stopXpFillSound();
          }, XP_ANIMATION_DURATION);
        }
      }
    }, 300);
  }
}

// Restart unified quiz
function restartUnifiedQuiz() {
  // Destroy galaxy background when going back to mode selection
  destroyGalaxyBackground();
  // Destroy InfiniteMenu
  destroyInfiniteMenu();
  
  resetGame();
  const topicIcon = currentTopic === 'flags' ? '🏳️' :
                    currentTopic === 'capitals' ? '🏛️' :
                    currentTopic === 'borders' ? '🗺️' :
                    currentTopic === 'football' ? '⚽' :
                    currentTopic === 'world-history' ? '🌍' : '📏';
  const topicName = currentTopic === 'world-history' ? 'World History' :
                    currentTopic.charAt(0).toUpperCase() + currentTopic.slice(1);
  showUnifiedModeSelection(topicName, topicIcon);
}

// Exit quiz
function exitUnifiedQuiz() {
  // Save stats before exiting (completed = false because user quit early)
  // This applies to all tracked topics - stats won't be saved for early exits
  const trackedTopics = ALL_TOPICS;
  if (trackedTopics.includes(currentTopic)) {
    saveQuizStats(currentTopic, false);
  }

  // Destroy galaxy background
  destroyGalaxyBackground();
  // Destroy InfiniteMenu
  destroyInfiniteMenu();

  const quizScreen = document.getElementById('unified-quiz-screen');
  const modeScreen = document.getElementById('unified-mode-screen');

  if (quizScreen) quizScreen.remove();
  if (modeScreen) modeScreen.remove();

  clearInterval(timer);
  resetGame();

  // Return to topics (home view)
  home.classList.remove('hidden');
  showTopics();
}

// ========================================
// 📊 STATS PAGE FUNCTIONS
// ========================================

// Open Overall Stats dashboard directly
function showOverallStats() {
  openStatsChart();
}

// Toggle stats box expand/collapse
function toggleStatsBox(boxId) {
  const content = document.getElementById(boxId + '-content');
  const arrow = document.getElementById(boxId + '-arrow');

  if (content.classList.contains('expanded')) {
    // Collapse
    content.classList.remove('expanded');
    content.classList.add('hidden');
    arrow.classList.remove('rotated');
  } else {
    // Expand
    content.classList.remove('hidden');
    content.classList.add('expanded');
    arrow.classList.add('rotated');
  }
}

// Populate Stats section (wrapper)
function populateStatsSection() {
  populateStatsSectionWithData(getProfileData());
}

// Populate Stats section with provided data
function populateStatsSectionWithData(data) {
  // Populate Overall Performance stats from data
  const totalGames = data.stats?.totalGames || 0;
  const correctAnswers = data.stats?.correctAnswers || 0;
  const wrongAnswers = data.stats?.wrongAnswers || 0;
  const totalQuestions = correctAnswers + wrongAnswers;
  const accuracy = data.stats?.accuracy || 0;
  const bestStreak = data.stats?.bestStreak || 0;
  const totalTimeSeconds = data.stats?.totalTimeSeconds || 0;

  // Update stat elements
  const statTotalGames = document.getElementById('stat-total-games');
  if (statTotalGames) statTotalGames.textContent = totalGames;

  const statTotalQuestions = document.getElementById('stat-total-questions');
  if (statTotalQuestions) statTotalQuestions.textContent = totalQuestions;

  const statCorrect = document.getElementById('stat-correct');
  if (statCorrect) statCorrect.textContent = correctAnswers;

  const statWrong = document.getElementById('stat-wrong');
  if (statWrong) statWrong.textContent = wrongAnswers;

  const statAccuracy = document.getElementById('stat-accuracy');
  if (statAccuracy) statAccuracy.textContent = accuracy + '%';

  const statBestStreak = document.getElementById('stat-best-streak');
  if (statBestStreak) statBestStreak.textContent = bestStreak;

  // Calculate avg time per question (overall) - sum totalAnswerTimeMs across all topics
  let globalTotalAnswerTimeMs = 0;
  const topics = data.stats?.topics || {};
  for (const topicId in topics) {
    globalTotalAnswerTimeMs += topics[topicId].totalAnswerTimeMs || 0;
  }
  const avgTimeSeconds = totalQuestions > 0 ? (globalTotalAnswerTimeMs / totalQuestions) / 1000 : 0;
  const statAvgTime = document.getElementById('stat-avg-time');
  if (statAvgTime) statAvgTime.textContent = avgTimeSeconds.toFixed(1) + 's';

  // Format total time played using the new formatting function
  const statTotalTime = document.getElementById('stat-total-time');
  if (statTotalTime) statTotalTime.textContent = formatTimeDisplay(totalTimeSeconds);

  // Update Most Played section - dynamically sorted by games played
  const topicDefinitions = Object.entries(TOPIC_CONFIG).map(([id, cfg]) => ({
    id: id,
    name: cfg.name,
    icon: cfg.icon
  }));

  // Get stats for each topic and sort by games played (descending), then alphabetically
  const topicsWithStats = topicDefinitions.map(topic => {
    const stats = topics[topic.id] || { 
      games: 0, 
      accuracy: 0, 
      bestStreak: 0,
      timeSpentSeconds: 0,
      totalQuestionsAnswered: 0,
      totalAnswerTimeMs: 0
    };
    // Calculate avg answer time (reaction time) - totalAnswerTimeMs is in milliseconds
    const avgTimePerQ = stats.totalQuestionsAnswered > 0 
      ? (stats.totalAnswerTimeMs / stats.totalQuestionsAnswered) / 1000  // Convert ms to seconds
      : 0;
    return {
      ...topic,
      games: stats.games || 0,
      accuracy: stats.accuracy || 0,
      bestStreak: stats.bestStreak || 0,
      timeSpentSeconds: stats.timeSpentSeconds || 0,
      avgTimePerQuestion: avgTimePerQ
    };
  });

  // Sort: by games (descending), then by name (alphabetically) for ties
  topicsWithStats.sort((a, b) => {
    if (b.games !== a.games) return b.games - a.games;
    return a.name.localeCompare(b.name);
  });

  // Update the 3 Most Played cards with 5 columns
  const mostPlayedCards = document.querySelectorAll('#most-played-content .most-played-card:not(.search-card)');
  for (let i = 0; i < 3 && i < mostPlayedCards.length; i++) {
    const card = mostPlayedCards[i];
    const topic = topicsWithStats[i];

    // Update rank
    const rankEl = card.querySelector('.most-played-rank');
    if (rankEl) rankEl.textContent = i + 1;

    // Update icon
    const iconEl = card.querySelector('.most-played-icon');
    if (iconEl) iconEl.textContent = topic.icon;

    // Update name
    const nameEl = card.querySelector('.most-played-name');
    if (nameEl) nameEl.textContent = topic.name;

    // Update stats (5 columns: Games, Accuracy, Streak, Time, Avg Time)
    const miniStatValues = card.querySelectorAll('.mini-stat-value');
    if (miniStatValues[0]) miniStatValues[0].textContent = topic.games;
    if (miniStatValues[1]) miniStatValues[1].textContent = topic.accuracy + '%';
    if (miniStatValues[2]) miniStatValues[2].textContent = topic.bestStreak;
    if (miniStatValues[3]) miniStatValues[3].textContent = formatTimeDisplay(topic.timeSpentSeconds);
    if (miniStatValues[4]) miniStatValues[4].textContent = formatAvgTime(topic.avgTimePerQuestion);
  }

  console.log('Stats section populated:', { totalGames, totalQuestions, accuracy, bestStreak, topicsWithStats });
}

// ========================================
// 🔍 TOPIC SEARCH FUNCTION
// ========================================

// Available topics with their icons - auto-generated from TOPIC_CONFIG
const availableTopics = Object.fromEntries(
  Object.entries(TOPIC_CONFIG).map(([id, cfg]) => [id, { icon: cfg.icon, name: cfg.name }])
);

function searchTopic(query) {
  const searchResult = document.getElementById('search-result');

  if (!query || query.trim() === '') {
    // Hide result if empty
    searchResult.classList.add('hidden');
    return;
  }

  // Search for matching topic
  const lowerQuery = query.toLowerCase().trim();
  let foundKey = null;
  let foundTopic = null;

  for (const [key, topic] of Object.entries(availableTopics)) {
    if (key.includes(lowerQuery) || topic.name.toLowerCase().includes(lowerQuery)) {
      foundKey = key;
      foundTopic = topic;
      break;
    }
  }

  if (foundTopic) {
    // Get real stats for this topic from userData
    const topicStats = userData.stats.topics[foundKey] || { 
      games: 0, 
      accuracy: 0, 
      bestStreak: 0,
      timeSpentSeconds: 0,
      totalQuestionsAnswered: 0,
      totalAnswerTimeMs: 0
    };
    const games = topicStats.games || 0;
    const accuracy = topicStats.accuracy || 0;
    const bestStreak = topicStats.bestStreak || 0;
    const timeSpent = topicStats.timeSpentSeconds || 0;
    const totalQ = topicStats.totalQuestionsAnswered || 0;
    const totalAnswerMs = topicStats.totalAnswerTimeMs || 0;
    // Calculate avg answer time (reaction time) - convert ms to seconds
    const avgTimePerQ = totalQ > 0 ? (totalAnswerMs / totalQ) / 1000 : 0;

    // Show found topic with real stats (5 columns)
    searchResult.innerHTML = `
      <div class="search-result-found">${t('stats_search_found')}</div>
      <div class="search-result-topic">${foundTopic.icon} ${foundTopic.name}</div>
      <div class="search-result-stats five-columns">
        <div class="mini-stat">
          <span class="mini-stat-label">G</span>
          <span class="mini-stat-value">${games}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">Ac</span>
          <span class="mini-stat-value">${accuracy}%</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">Str</span>
          <span class="mini-stat-value">${bestStreak}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">T</span>
          <span class="mini-stat-value">${formatTimeDisplay(timeSpent)}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">A.T</span>
          <span class="mini-stat-value">${formatAvgTime(avgTimePerQ)}</span>
        </div>
      </div>
    `;
    searchResult.classList.remove('hidden');
  } else {
    // Show "not found" message
    searchResult.innerHTML = `
      <div class="search-result-empty">${t('stats_search_not_found')}</div>
    `;
    searchResult.classList.remove('hidden');
  }
}

// ========================================
// 🔥 TOPIC STATS PAGE 2 FUNCTIONS
// ========================================

let currentTopicPage2 = 'flags';  // Currently selected topic
let currentTopicPeriod = 'day';   // day, week, month, year
let currentTopicStatType = 'games';  // games, accuracy, streak, time, avgtime
let topicStatsChart = null;

// Toggle topic dropdown
function toggleTopicDropdown() {
  const dropdown = document.getElementById('topic-dropdown');
  const selector = document.getElementById('topic-selector');
  
  if (dropdown.classList.contains('hidden')) {
    dropdown.classList.remove('hidden');
    selector.classList.add('open');
    populateTopicDropdown();
  } else {
    dropdown.classList.add('hidden');
    selector.classList.remove('open');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.topic-selector-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    const dropdown = document.getElementById('topic-dropdown');
    const selector = document.getElementById('topic-selector');
    if (dropdown) dropdown.classList.add('hidden');
    if (selector) selector.classList.remove('open');
  }
});

// Populate topic dropdown list
function populateTopicDropdown(filter = '') {
  const list = document.getElementById('topic-dropdown-list');
  if (!list) return;
  
  const topics = Object.entries(TOPIC_CONFIG).map(([id, cfg]) => ({
    id,
    name: cfg.name,
    icon: cfg.icon,
    games: userData.stats.topics[id]?.games || 0
  }));
  
  // Sort by games played (most played first)
  topics.sort((a, b) => b.games - a.games);
  
  // Filter if search query provided
  const filtered = filter 
    ? topics.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()) || t.id.includes(filter.toLowerCase()))
    : topics;
  
  list.innerHTML = filtered.map(t => `
    <div class="topic-dropdown-item ${t.id === currentTopicPage2 ? 'selected' : ''}" onclick="selectTopic('${t.id}')">
      <span class="topic-dropdown-item-icon">${t.icon}</span>
      <span class="topic-dropdown-item-name">${t.name}</span>
      <span class="topic-dropdown-item-games">${t.games} games</span>
    </div>
  `).join('');
}

// Filter dropdown
function filterTopicDropdown(query) {
  populateTopicDropdown(query);
}

// Select a topic
function selectTopic(topicId) {
  currentTopicPage2 = topicId;
  
  // Update selector display
  const cfg = TOPIC_CONFIG[topicId];
  document.getElementById('selected-topic-icon').textContent = cfg.icon;
  document.getElementById('selected-topic-name').textContent = cfg.name;
  
  // Close dropdown
  document.getElementById('topic-dropdown').classList.add('hidden');
  document.getElementById('topic-selector').classList.remove('open');
  
  // Clear search
  const searchInput = document.getElementById('topic-dropdown-search');
  if (searchInput) searchInput.value = '';
  
  // Render chart
  renderTopicStatsChart();
}

// Switch period
function switchTopicPeriod(period) {
  currentTopicPeriod = period;
  
  // Update button states (Page 2 only)
  const page2 = document.getElementById('stats-page-2');
  if (page2) {
    page2.querySelectorAll('.stats-period-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === period);
    });
  }
  
  renderTopicStatsChart();
}

// Switch stat type
function switchTopicStatType(type) {
  currentTopicStatType = type;
  
  // Update button states (Page 2 only)
  const page2 = document.getElementById('stats-page-2');
  if (page2) {
    page2.querySelectorAll('.stats-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.stat === type);
    });
  }
  
  renderTopicStatsChart();
}

// Render topic stats chart
function renderTopicStatsChart() {
  const canvas = document.getElementById('topic-stats-chart');
  const emptyEl = document.getElementById('topic-chart-empty');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const history = userData.stats?.history || {};
  const topicId = currentTopicPage2;
  
  let labels = [];
  let data = [];
  let total = 0;
  let peak = 0;
  
  // Get data based on period
  if (currentTopicPeriod === 'day') {
    // Show rolling 24 hours ending at current hour
    const today = getDateString(0);
    const yesterday = getDateString(1);
    const todayTopicData = history[today]?.topics?.[topicId] || { hourly: {} };
    const yesterdayTopicData = history[yesterday]?.topics?.[topicId] || { hourly: {} };
    const currentHour = new Date().getHours();
    
    let totalCorrect = 0, totalWrong = 0;
    
    for (let i = 0; i < 24; i++) {
      const h = (currentHour + 1 + i) % 24;
      const hourKey = h.toString().padStart(2, '0');
      
      const isYesterday = (currentHour + 1 + i) < 24;
      const dayData = isYesterday ? yesterdayTopicData : todayTopicData;
      const hourData = dayData.hourly?.[hourKey] || { g: 0, c: 0, w: 0, t: 0, s: 0, at: 0 };
      
      labels.push(h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h-12}p`);
      
      let value = 0;
      switch (currentTopicStatType) {
        case 'games': value = hourData.g; break;
        case 'accuracy': 
          const totalQ = hourData.c + hourData.w;
          value = totalQ > 0 ? Math.round((hourData.c / totalQ) * 100) : 0;
          break;
        case 'streak': value = hourData.s; break;
        case 'time': value = hourData.t; break;
        case 'avgtime':
          const qCount = hourData.c + hourData.w;
          value = qCount > 0 ? (hourData.at / qCount) / 1000 : 0;
          break;
      }
      
      data.push(value);
      totalCorrect += hourData.c;
      totalWrong += hourData.w;
      if (currentTopicStatType !== 'streak' && currentTopicStatType !== 'accuracy') {
        total += value;
      }
      if (value > peak) peak = value;
    }
    
    if (currentTopicStatType === 'streak') {
      total = Math.max(todayTopicData.streak || 0, yesterdayTopicData.streak || 0);
    }
    if (currentTopicStatType === 'accuracy') {
      total = (totalCorrect + totalWrong) > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
    }
    
  } else if (currentTopicPeriod === 'week') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const dateKey = getDateString(i);
      const dayData = history[dateKey]?.topics?.[topicId] || { games: 0, correct: 0, wrong: 0, time: 0, streak: 0, answerTimeMs: 0 };
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      labels.push(dayNames[date.getDay()]);
      
      let value = 0;
      switch (currentTopicStatType) {
        case 'games': value = dayData.games; break;
        case 'accuracy':
          const totalQ = dayData.correct + dayData.wrong;
          value = totalQ > 0 ? Math.round((dayData.correct / totalQ) * 100) : 0;
          break;
        case 'streak': value = dayData.streak; break;
        case 'time': value = dayData.time; break;
        case 'avgtime':
          const qCount = dayData.correct + dayData.wrong;
          value = qCount > 0 ? (dayData.answerTimeMs / qCount) / 1000 : 0;
          break;
      }
      
      data.push(value);
      if (currentTopicStatType !== 'streak' && currentTopicStatType !== 'accuracy') {
        total += value;
      }
      if (value > peak) peak = value;
    }
    
    if (currentTopicStatType === 'streak') total = Math.max(...data, 0);
    if (currentTopicStatType === 'accuracy') total = data.filter(v => v > 0).length > 0 ? Math.round(data.reduce((a,b) => a+b, 0) / data.filter(v => v > 0).length) : 0;
    
  } else if (currentTopicPeriod === 'month') {
    for (let i = 29; i >= 0; i--) {
      const dateKey = getDateString(i);
      const dayData = history[dateKey]?.topics?.[topicId] || { games: 0, correct: 0, wrong: 0, time: 0, streak: 0, answerTimeMs: 0 };
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      
      let value = 0;
      switch (currentTopicStatType) {
        case 'games': value = dayData.games; break;
        case 'accuracy':
          const totalQ = dayData.correct + dayData.wrong;
          value = totalQ > 0 ? Math.round((dayData.correct / totalQ) * 100) : 0;
          break;
        case 'streak': value = dayData.streak; break;
        case 'time': value = dayData.time; break;
        case 'avgtime':
          const qCount = dayData.correct + dayData.wrong;
          value = qCount > 0 ? (dayData.answerTimeMs / qCount) / 1000 : 0;
          break;
      }
      
      data.push(value);
      if (currentTopicStatType !== 'streak' && currentTopicStatType !== 'accuracy') {
        total += value;
      }
      if (value > peak) peak = value;
    }
    
    if (currentTopicStatType === 'streak') total = Math.max(...data, 0);
    if (currentTopicStatType === 'accuracy') total = data.filter(v => v > 0).length > 0 ? Math.round(data.reduce((a,b) => a+b, 0) / data.filter(v => v > 0).length) : 0;
    
  } else if (currentTopicPeriod === 'year') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      labels.push(monthNames[monthDate.getMonth()]);
      
      // Sum all days in this month for the topic
      let monthTotal = { games: 0, correct: 0, wrong: 0, time: 0, streak: 0, answerTimeMs: 0 };
      Object.keys(history).filter(k => k.startsWith(monthKey)).forEach(dateKey => {
        const dayData = history[dateKey]?.topics?.[topicId] || {};
        monthTotal.games += dayData.games || 0;
        monthTotal.correct += dayData.correct || 0;
        monthTotal.wrong += dayData.wrong || 0;
        monthTotal.time += dayData.time || 0;
        monthTotal.answerTimeMs += dayData.answerTimeMs || 0;
        if ((dayData.streak || 0) > monthTotal.streak) monthTotal.streak = dayData.streak;
      });
      
      let value = 0;
      switch (currentTopicStatType) {
        case 'games': value = monthTotal.games; break;
        case 'accuracy':
          const totalQ = monthTotal.correct + monthTotal.wrong;
          value = totalQ > 0 ? Math.round((monthTotal.correct / totalQ) * 100) : 0;
          break;
        case 'streak': value = monthTotal.streak; break;
        case 'time': value = monthTotal.time; break;
        case 'avgtime':
          const qCount = monthTotal.correct + monthTotal.wrong;
          value = qCount > 0 ? (monthTotal.answerTimeMs / qCount) / 1000 : 0;
          break;
      }
      
      data.push(value);
      if (currentTopicStatType !== 'streak' && currentTopicStatType !== 'accuracy') {
        total += value;
      }
      if (value > peak) peak = value;
    }
    
    if (currentTopicStatType === 'streak') total = Math.max(...data, 0);
    if (currentTopicStatType === 'accuracy') total = data.filter(v => v > 0).length > 0 ? Math.round(data.reduce((a,b) => a+b, 0) / data.filter(v => v > 0).length) : 0;
  }
  
  // Check if has data
  const hasData = data.some(v => v > 0);
  
  // Show/hide empty state
  if (emptyEl) {
    emptyEl.classList.toggle('hidden', hasData);
  }
  canvas.style.display = hasData ? 'block' : 'none';
  
  // Update summary cards
  const avg = data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;
  
  const formatTopicValue = (val) => {
    if (currentTopicStatType === 'time') return formatTimeDisplay(val);
    if (currentTopicStatType === 'avgtime') return formatAvgTime(val);
    if (currentTopicStatType === 'accuracy') return val + '%';
    return Math.round(val).toLocaleString();
  };
  
  const peakEl = document.getElementById('topic-peak-value');
  const avgEl = document.getElementById('topic-avg-value');
  const totalEl = document.getElementById('topic-total-value');
  
  if (peakEl) peakEl.textContent = formatTopicValue(peak);
  if (avgEl) avgEl.textContent = formatTopicValue(avg);
  if (totalEl) totalEl.textContent = formatTopicValue(total);
  
  // Destroy existing chart
  if (topicStatsChart) {
    topicStatsChart.destroy();
  }
  
  if (!hasData) return;
  
  // Chart colors based on stat type
  const colors = {
    games: { line: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
    accuracy: { line: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    streak: { line: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
    time: { line: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    avgtime: { line: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
  };
  
  const color = colors[currentTopicStatType] || colors.games;
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, color.bg.replace('0.1', '0.4'));
  gradient.addColorStop(1, color.bg.replace('0.1', '0'));
  
  // Create chart
  topicStatsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        borderColor: color.line,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: color.line,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#fff',
          bodyColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: color.line,
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (item) => formatTopicValue(item.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9 }, maxRotation: 0 }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9 } }
        }
      }
    }
  });
}

// ========================================
// 🏆 LEADERBOARD PAGE FUNCTIONS
// ========================================

// Show Leaderboard screen
function showLeaderboard() {
  clearViewingProfile(); // Clear any viewed profile state

  const newIndex = NAV_ORDER.indexOf('leaderboard');
  const direction = newIndex < currentNavIndex ? 'left' : 'right';
  currentNavIndex = newIndex;

  // Hide all views
  const homeView = document.getElementById('home-view');
  const topicsView = document.getElementById('topics-view');
  const profileView = document.getElementById('profile-view');
  const statsView = document.getElementById('stats-view');
  const leaderboardView = document.getElementById('leaderboard-view');

  if (homeView) homeView.classList.add('hidden');
  if (topicsView) topicsView.classList.add('hidden');
  if (profileView) profileView.classList.add('hidden');
  if (statsView) statsView.classList.add('hidden');
  if (leaderboardView) {
    leaderboardView.classList.remove('hidden');
    applyNavAnimation(leaderboardView, direction);
  }

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navLeaderboard = document.getElementById('nav-leaderboard');
  if (navLeaderboard) navLeaderboard.classList.add('active');
}

// Handle leaderboard row click - opens user profile
function handleLeaderboardRowClick(userId) {
  if (!userId) return;
  
  playClickSound();
  console.log('👤 Leaderboard row clicked, viewing profile:', userId);
  showProfile(userId);
}

// Populate leaderboard with real data (call when data is available)
function populateLeaderboard(leaderboardData) {
  const listContainer = document.querySelector('.lb-preview-list');
  if (!listContainer) return;
  
  // Clear existing rows
  listContainer.innerHTML = '';
  
  // Rank styling classes
  const rankClasses = ['lb-rank-gold', 'lb-rank-silver', 'lb-rank-bronze'];
  
  leaderboardData.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'lb-preview-row';
    row.style.cssText = 'display:flex !important; cursor:pointer;';
    row.dataset.userId = entry.userId;
    
    // Click handler
    row.addEventListener('click', () => handleLeaderboardRowClick(entry.userId));
    
    // Rank
    const rank = document.createElement('span');
    rank.className = `lb-rank ${rankClasses[index] || ''}`.trim();
    rank.textContent = `#${index + 1}`;
    
    // Avatar
    const avatar = document.createElement('span');
    avatar.className = 'lb-avatar';
    avatar.textContent = entry.avatar || '👤';
    
    // Username
    const username = document.createElement('span');
    username.className = 'lb-username';
    username.textContent = entry.username || 'Player';
    
    // Score/stat
    const stat = document.createElement('span');
    stat.className = 'lb-stat';
    stat.textContent = entry.displayStat || '';
    
    row.appendChild(rank);
    row.appendChild(avatar);
    row.appendChild(username);
    row.appendChild(stat);
    
    listContainer.appendChild(row);
  });
  
  console.log('📊 Leaderboard populated with', leaderboardData.length, 'entries');
}

// ============================================
// WELCOME & SETUP LOGIC
// ============================================

let selectedAvatar = '👤';
let selectedProfilePicture = null; // File object for upload
let profilePictureDataUrl = null; // Base64 preview

// Initialize Firebase Storage
const firebaseStorage = firebase.storage ? firebase.storage() : null;

function checkFirstTimeUser() {
  if (!userData.isSetupComplete) {
    document.getElementById('welcome-screen').classList.remove('hidden');
  }
}

// Welcome button
const welcomeStartBtn = document.getElementById('welcome-start-btn');
if (welcomeStartBtn) {
  welcomeStartBtn.onclick = () => {
    playClickSound();
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
  };
}

// Profile picture upload handling
const profilePictureInput = document.getElementById('profile-picture-input');
if (profilePictureInput) {
  profilePictureInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large. Please select an image under 5MB.');
        return;
      }
      
      selectedProfilePicture = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        profilePictureDataUrl = event.target.result;
        updateProfilePicturePreview();
      };
      reader.readAsDataURL(file);
      
      // Clear avatar selection when photo is uploaded
      document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
      selectedAvatar = null;
    }
  };
}

// Remove photo button
const removePhotoBtn = document.getElementById('remove-photo-btn');
if (removePhotoBtn) {
  removePhotoBtn.onclick = () => {
    playClickSound();
    selectedProfilePicture = null;
    profilePictureDataUrl = null;
    document.getElementById('profile-picture-input').value = '';
    
    // Reset to default avatar
    selectedAvatar = '👤';
    document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector('.avatar-btn[data-avatar="👤"]')?.classList.add('selected');
    
    updateProfilePicturePreview();
  };
}

function updateProfilePicturePreview() {
  const previewAvatar = document.getElementById('preview-avatar');
  const previewImage = document.getElementById('preview-image');
  const removeBtn = document.getElementById('remove-photo-btn');
  
  if (profilePictureDataUrl) {
    // Show uploaded image
    if (previewAvatar) previewAvatar.classList.add('hidden');
    if (previewImage) {
      previewImage.src = profilePictureDataUrl;
      previewImage.classList.remove('hidden');
    }
    if (removeBtn) removeBtn.classList.remove('hidden');
  } else {
    // Show emoji avatar
    if (previewImage) previewImage.classList.add('hidden');
    if (previewAvatar) {
      previewAvatar.textContent = selectedAvatar || '👤';
      previewAvatar.classList.remove('hidden');
    }
    if (removeBtn) removeBtn.classList.add('hidden');
  }
}

// Avatar selection
const avatarGrid = document.getElementById('avatar-grid');
if (avatarGrid) {
  avatarGrid.onclick = (e) => {
    if (e.target.classList.contains('avatar-btn')) {
      playClickSound();
      document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      selectedAvatar = e.target.dataset.avatar;
      
      // Clear profile picture when emoji is selected
      selectedProfilePicture = null;
      profilePictureDataUrl = null;
      document.getElementById('profile-picture-input').value = '';
      
      updateProfilePicturePreview();
    }
  };
}

// Upload profile picture to Firebase Storage (with local fallback)
async function uploadProfilePicture(file) {
  // First, convert to base64 for local storage fallback
  const base64Promise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
  
  const base64Data = await base64Promise;
  
  // If no Firebase Storage or no user, use base64 locally
  if (!firebaseStorage || !firebaseUser) {
    console.log('Using local base64 storage for profile picture');
    return base64Data;
  }

  try {
    // Try Firebase Storage upload with timeout
    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        const storageRef = firebaseStorage.ref();
        const fileRef = storageRef.child(`profile-pictures/${firebaseUser.uid}`);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        resolve(downloadURL);
      } catch (err) {
        reject(err);
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timed out')), 10000)
    );
    
    const downloadURL = await Promise.race([uploadPromise, timeoutPromise]);
    console.log('Profile picture uploaded to Firebase:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Firebase upload failed, using local base64:', error);
    // Fall back to base64 for local testing
    console.log('Using local base64 storage as fallback');
    return base64Data;
  }
}

// Save profile
const setupSaveBtn = document.getElementById('setup-save-btn');
if (setupSaveBtn) {
  setupSaveBtn.onclick = async () => {
    playClickSound();
    
    // Validate required fields
    const usernameInput = document.getElementById('setup-username');
    const countrySelect = document.getElementById('setup-country');
    const username = usernameInput.value.trim();
    const country = countrySelect.value;
    
    // Check username
    if (!username || username.length < 2) {
      usernameInput.style.border = '2px solid #ef4444';
      usernameInput.placeholder = 'Username required (min 2 characters)';
      usernameInput.focus();
      setTimeout(() => {
        usernameInput.style.border = '';
        usernameInput.placeholder = 'Enter username';
      }, 3000);
      return;
    }
    
    // Check country
    if (!country) {
      countrySelect.style.border = '2px solid #ef4444';
      setTimeout(() => {
        countrySelect.style.border = '';
      }, 3000);
      return;
    }
    
    // Show loading state
    setupSaveBtn.textContent = 'Saving...';
    setupSaveBtn.disabled = true;
    
    userData.profile.username = username;
    userData.profile.avatar = selectedAvatar || '👤';
    userData.profile.country = countrySelect.value;
    userData.profile.countryName = countrySelect.options[countrySelect.selectedIndex].text;
    userData.profile.createdAt = new Date().toISOString();
    
    // Upload profile picture if selected
    if (selectedProfilePicture) {
      const pictureUrl = await uploadProfilePicture(selectedProfilePicture);
      if (pictureUrl) {
        userData.profile.profilePicture = pictureUrl;
      }
    } else {
      userData.profile.profilePicture = null;
    }
    
    userData.isSetupComplete = true;

    saveUserData();
    document.getElementById('setup-screen').classList.add('hidden');
    updateProfileDisplay();
    console.log('Profile saved:', userData.profile);
    
    // Reset button
    setupSaveBtn.textContent = 'Save & Start';
    setupSaveBtn.disabled = false;
    
    // Start tutorial automatically for new users
    setTimeout(() => {
      startTutorial();
    }, 500); // Small delay to let the home screen render first
  };
}

// Wrapper that uses current profile data
function updateProfileDisplay() {
  updateProfileDisplayWithData(getProfileData());
}

// Display profile with provided data
function updateProfileDisplayWithData(data) {
  const profilePicture = data.profile.profilePicture;
  const avatar = data.profile.avatar || '👤';
  
  // Top bar - show profile picture or avatar
  const navAvatar = document.getElementById('nav-avatar');
  const navProfileImage = document.getElementById('nav-profile-image');
  
  const userProfileEl = document.querySelector('.user-profile');
  
  if (profilePicture) {
    // Show profile picture
    if (navAvatar) navAvatar.classList.add('hidden');
    if (navProfileImage) {
      navProfileImage.src = profilePicture;
      navProfileImage.classList.remove('hidden');
    }
    if (userProfileEl) userProfileEl.classList.add('has-image');
  } else {
    // Show emoji avatar
    if (navProfileImage) navProfileImage.classList.add('hidden');
    if (userProfileEl) userProfileEl.classList.remove('has-image');
    if (navAvatar) {
      navAvatar.textContent = avatar;
      navAvatar.classList.remove('hidden');
    }
  }

  // Profile page avatar
  const profileAvatar = document.querySelector('.profile-avatar');
  const profileAvatarImg = document.querySelector('.profile-avatar-image');
  
  if (profilePicture) {
    if (profileAvatar) profileAvatar.classList.add('hidden');
    if (profileAvatarImg) {
      profileAvatarImg.src = profilePicture;
      profileAvatarImg.classList.remove('hidden');
    } else if (profileAvatar) {
      // Create image element if it doesn't exist
      const img = document.createElement('img');
      img.className = 'profile-avatar-image';
      img.src = profilePicture;
      img.alt = 'Profile';
      profileAvatar.parentNode.insertBefore(img, profileAvatar);
      profileAvatar.classList.add('hidden');
    }
  } else {
    if (profileAvatarImg) profileAvatarImg.classList.add('hidden');
    if (profileAvatar) {
      profileAvatar.textContent = avatar;
      profileAvatar.classList.remove('hidden');
    }
  }

  // Profile name
  const name = document.querySelector('.profile-name');
  if (name) name.textContent = data.profile.username;

  // Profile location/country with flag image
  const location = document.querySelector('.profile-location');
  if (location) {
    if (data.profile.country && data.profile.countryName) {
      const flagCode = data.profile.country.toLowerCase();
      location.innerHTML = `<img class="profile-country-flag" src="topic_images/flags/${flagCode}.png" alt="${data.profile.countryName}" onerror="this.style.display='none'"> ${data.profile.countryName}`;
    } else if (data.profile.country) {
      const flagCode = data.profile.country.toLowerCase();
      location.innerHTML = `<img class="profile-country-flag" src="topic_images/flags/${flagCode}.png" alt="${data.profile.country}" onerror="this.style.display='none'"> ${data.profile.country}`;
    } else {
      location.textContent = '🌍 Location not set';
    }
  }
  
  // Update profile banner with data
  updateProfileBannerWithData(data);
}

// Update profile banner background (wrapper)
function updateProfileBanner() {
  updateProfileBannerWithData(getProfileData());
}

// Update profile banner with provided data
function updateProfileBannerWithData(data) {
  const banner = document.getElementById('profile-banner');
  if (!banner) return;
  
  const backgroundPicture = data.profile?.backgroundPicture;
  
  if (backgroundPicture) {
    // Apply custom background image using full background shorthand to override CSS
    banner.style.background = `url(${backgroundPicture}) center/cover no-repeat`;
    banner.classList.add('has-custom-bg');
  } else {
    // Reset to default gradient (clear inline style, let CSS take over)
    banner.style.background = '';
    banner.classList.remove('has-custom-bg');
  }
}

// ============================================
// EDIT PROFILE MODAL
// ============================================

let editSelectedAvatar = null;
let editProfilePicture = null;
let editProfilePictureDataUrl = null;
let editBackgroundPicture = null;
let editBackgroundPictureDataUrl = null;

function openEditProfileModal() {
  // Close settings modal
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) settingsModal.classList.add('hidden');
  
  // Open edit profile modal
  const modal = document.getElementById('edit-profile-modal');
  if (modal) modal.classList.remove('hidden');
  
  // Populate with current data
  const usernameInput = document.getElementById('edit-username');
  if (usernameInput) usernameInput.value = userData.profile.username || '';
  
  // Set current avatar/picture
  editSelectedAvatar = userData.profile.avatar || '👤';
  editProfilePicture = null;
  editProfilePictureDataUrl = userData.profile.profilePicture || null;
  
  // Set current background picture
  editBackgroundPicture = null;
  editBackgroundPictureDataUrl = userData.profile.backgroundPicture || null;
  
  // Update previews
  updateEditProfilePreview();
  updateEditBackgroundPreview();
  
  // Highlight current avatar if no profile picture
  document.querySelectorAll('.avatar-btn-edit').forEach(btn => {
    btn.classList.remove('selected');
    if (!userData.profile.profilePicture && btn.dataset.avatar === editSelectedAvatar) {
      btn.classList.add('selected');
    }
  });
}

function closeEditProfileModal() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) modal.classList.add('hidden');

  // Reset temp variables
  editSelectedAvatar = null;
  editProfilePicture = null;
  editProfilePictureDataUrl = null;
  editBackgroundPicture = null;
  editBackgroundPictureDataUrl = null;
}

function updateEditProfilePreview() {
  const previewAvatar = document.getElementById('edit-preview-avatar');
  const previewImage = document.getElementById('edit-preview-image');
  const removeBtn = document.getElementById('edit-remove-photo-btn');
  
  if (editProfilePictureDataUrl) {
    // Show uploaded/existing image
    if (previewAvatar) previewAvatar.classList.add('hidden');
    if (previewImage) {
      previewImage.src = editProfilePictureDataUrl;
      previewImage.classList.remove('hidden');
    }
    if (removeBtn) removeBtn.classList.remove('hidden');
  } else {
    // Show emoji avatar
    if (previewImage) previewImage.classList.add('hidden');
    if (previewAvatar) {
      previewAvatar.textContent = editSelectedAvatar || '👤';
      previewAvatar.classList.remove('hidden');
    }
    if (removeBtn) removeBtn.classList.add('hidden');
  }
}

// Edit profile picture input handler
const editProfilePictureInput = document.getElementById('edit-profile-picture-input');
if (editProfilePictureInput) {
  editProfilePictureInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large. Please select an image under 5MB.');
        return;
      }
      
      editProfilePicture = file;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        editProfilePictureDataUrl = event.target.result;
        updateEditProfilePreview();
      };
      reader.readAsDataURL(file);
      
      // Clear avatar selection
      document.querySelectorAll('.avatar-btn-edit').forEach(b => b.classList.remove('selected'));
      editSelectedAvatar = null;
    }
  };
}

// Edit avatar grid selection
const editAvatarGrid = document.getElementById('edit-avatar-grid');
if (editAvatarGrid) {
  editAvatarGrid.onclick = (e) => {
    if (e.target.classList.contains('avatar-btn-edit')) {
      playClickSound();
      document.querySelectorAll('.avatar-btn-edit').forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      editSelectedAvatar = e.target.dataset.avatar;
      
      // Clear profile picture
      editProfilePicture = null;
      editProfilePictureDataUrl = null;
      document.getElementById('edit-profile-picture-input').value = '';
      
      updateEditProfilePreview();
    }
  };
}

function removeEditProfilePicture() {
  playClickSound();
  editProfilePicture = null;
  editProfilePictureDataUrl = null;
  document.getElementById('edit-profile-picture-input').value = '';
  
  // Reset to current avatar or default
  editSelectedAvatar = userData.profile.avatar || '👤';
  document.querySelectorAll('.avatar-btn-edit').forEach(b => {
    b.classList.remove('selected');
    if (b.dataset.avatar === editSelectedAvatar) {
      b.classList.add('selected');
    }
  });
  
  updateEditProfilePreview();
}

// Update background preview in edit modal
function updateEditBackgroundPreview() {
  const previewDefault = document.getElementById('edit-background-default');
  const previewImage = document.getElementById('edit-background-image');
  const removeBtn = document.getElementById('edit-remove-background-btn');
  
  if (editBackgroundPictureDataUrl) {
    // Show background image
    if (previewDefault) previewDefault.classList.add('hidden');
    if (previewImage) {
      previewImage.src = editBackgroundPictureDataUrl;
      previewImage.classList.remove('hidden');
    }
    if (removeBtn) removeBtn.classList.remove('hidden');
  } else {
    // Show default
    if (previewImage) previewImage.classList.add('hidden');
    if (previewDefault) previewDefault.classList.remove('hidden');
    if (removeBtn) removeBtn.classList.add('hidden');
  }
}

// Edit background picture input handler
const editBackgroundPictureInput = document.getElementById('edit-background-picture-input');
if (editBackgroundPictureInput) {
  editBackgroundPictureInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large. Please select an image under 5MB.');
        return;
      }
      
      editBackgroundPicture = file;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        editBackgroundPictureDataUrl = event.target.result;
        updateEditBackgroundPreview();
      };
      reader.readAsDataURL(file);
    }
  };
}

function removeEditBackgroundPicture() {
  playClickSound();
  editBackgroundPicture = null;
  editBackgroundPictureDataUrl = null;
  const input = document.getElementById('edit-background-picture-input');
  if (input) input.value = '';
  updateEditBackgroundPreview();
}

async function saveEditedProfile() {
  playClickSound();
  
  const saveBtn = document.getElementById('edit-save-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
  }
  
  // Update username
  const newUsername = document.getElementById('edit-username').value.trim();
  if (newUsername) {
    userData.profile.username = newUsername;
  }
  
  // Handle profile picture - use the already-loaded base64 data
  if (editProfilePictureDataUrl) {
    // User has a profile picture (either new or existing)
    userData.profile.profilePicture = editProfilePictureDataUrl;
    userData.profile.avatar = editSelectedAvatar || '👤';
  } else if (editSelectedAvatar) {
    // User removed picture or selected avatar only
    userData.profile.profilePicture = null;
    userData.profile.avatar = editSelectedAvatar;
  }
  
  // Handle background picture - use the already-loaded base64 data
  if (editBackgroundPictureDataUrl) {
    userData.profile.backgroundPicture = editBackgroundPictureDataUrl;
  } else {
    userData.profile.backgroundPicture = null;
  }
  
  // Save and update
  saveUserData();
  updateProfileDisplay();
  updateProfileBanner();
  
  // Reset button and close modal
  if (saveBtn) {
    saveBtn.textContent = 'Save Changes';
    saveBtn.disabled = false;
  }
  
  closeEditProfileModal();
  console.log('Profile updated:', userData.profile);
}

// Update all stats displays (Profile + Overall Performance use same data)
function updateAllStatsDisplays() {
  const totalGames = userData.stats.totalGames || 0;
  const totalTimeSeconds = userData.stats.totalTimeSeconds || 0;

  // Update Profile Stats Row - Games (1st stat-item)
  const statItems = document.querySelectorAll('.profile-stats-row .stat-item');
  if (statItems[0]) statItems[0].querySelector('.stat-value').textContent = totalGames;

  // Update Profile Stats Row - Time (2nd stat-item) - shows screen time
  if (statItems[1]) statItems[1].querySelector('.stat-value').textContent = formatTimeDisplay(totalTimeSeconds);

  // Also update by ID if available
  const profileStatTime = document.getElementById('profile-stat-time');
  if (profileStatTime) profileStatTime.textContent = formatTimeDisplay(totalTimeSeconds);

  // Update Best Streak in profile feature card
  updateBestStreakDisplay();

  console.log('Stats displays updated:', { totalGames, totalTimeSeconds });
}

// ============================================
// SAVE QUIZ STATS
// ============================================
function saveQuizStats(topicId, completed) {
  // Don't save stats if player exits early
  if (!completed) {
    console.log('Quiz exited early - stats not saved');
    return;
  }

  // List of supported topics for stats tracking
  const supportedTopics = ALL_TOPICS;
  if (!supportedTopics.includes(topicId)) return;

  // Initialize topic stats if not exists (includes XP fields)
  if (!userData.stats.topics[topicId]) {
    userData.stats.topics[topicId] = {
      games: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      bestStreak: 0,
      // XP System fields
      level: 1,
      xp: 0,
      modesUnlocked: {
        casual: true,
        timeAttack: false,
        threeHearts: false
      },
      // Time tracking fields
      timeSpentSeconds: 0,
      totalQuestionsAnswered: 0,
      totalAnswerTimeMs: 0  // Sum of all individual answer times (for avg calculation)
    };
  } else {
    // Migrate old topics that don't have XP fields
    getTopicXPData(topicId);
    // Migrate old topics that don't have time fields
    if (userData.stats.topics[topicId].timeSpentSeconds === undefined) {
      userData.stats.topics[topicId].timeSpentSeconds = 0;
    }
    if (userData.stats.topics[topicId].totalQuestionsAnswered === undefined) {
      userData.stats.topics[topicId].totalQuestionsAnswered = 0;
    }
    if (userData.stats.topics[topicId].totalAnswerTimeMs === undefined) {
      userData.stats.topics[topicId].totalAnswerTimeMs = 0;
    }
  }

  const topic = userData.stats.topics[topicId];

  // Update topic stats
  if (completed) {
    topic.games++;
    topic.lastPlayed = Date.now(); // Track when this topic was last played
    userData.stats.totalGames++;
    
    // Calculate time spent in this session (in seconds)
    const sessionTimeSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
    topic.timeSpentSeconds += sessionTimeSeconds;
    
    // Track total questions answered (for avg time calculation)
    const questionsThisSession = currentSessionCorrect + currentSessionWrong;
    topic.totalQuestionsAnswered += questionsThisSession;
    
    // Track total answer time (sum of individual answer times for avg calculation)
    const sessionAnswerTimeMs = sessionAnswerTimes.reduce((a, b) => a + b, 0);
    topic.totalAnswerTimeMs += sessionAnswerTimeMs;

    // Note: totalTimeSeconds is now tracked by screenTimeTracker (total app screen time)
    // Topic-specific time (topic.timeSpentSeconds) still tracks quiz time per topic
  }

  topic.correct += currentSessionCorrect;
  topic.wrong += currentSessionWrong;

  // Calculate topic accuracy
  const totalAnswers = topic.correct + topic.wrong;
  topic.accuracy = totalAnswers > 0 ? Math.round((topic.correct / totalAnswers) * 100) : 0;

  // Update best streak for this topic
  if (bestSessionStreak > topic.bestStreak) {
    topic.bestStreak = bestSessionStreak;
  }

  // Update global best streak (highest across ALL topics)
  let highestBestStreak = 0;
  for (const tid of supportedTopics) {
    if (userData.stats.topics[tid] && userData.stats.topics[tid].bestStreak > highestBestStreak) {
      highestBestStreak = userData.stats.topics[tid].bestStreak;
    }
  }
  userData.stats.bestStreak = highestBestStreak;

  // Update global stats
  userData.stats.correctAnswers += currentSessionCorrect;
  userData.stats.wrongAnswers += currentSessionWrong;

  // Calculate global accuracy
  const globalTotal = userData.stats.correctAnswers + userData.stats.wrongAnswers;
  userData.stats.accuracy = globalTotal > 0 ? Math.round((userData.stats.correctAnswers / globalTotal) * 100) : 0;

  // Track this game's accuracy for Skill achievements (only for completed single-player games)
  if (completed && gameMode !== 'two') {
    const sessionTotal = currentSessionCorrect + currentSessionWrong;
    const sessionAccuracy = sessionTotal > 0 ? Math.round((currentSessionCorrect / sessionTotal) * 100) : 0;
    
    // Initialize array if needed
    if (!userData.stats.recentGameAccuracies) {
      userData.stats.recentGameAccuracies = [];
    }
    
    // Add to recent accuracies (keep last 100 games)
    userData.stats.recentGameAccuracies.push(sessionAccuracy);
    if (userData.stats.recentGameAccuracies.length > 100) {
      userData.stats.recentGameAccuracies.shift();
    }
    
    // Track hybrid best streaks (best streak achieved at each accuracy threshold)
    // This is for Pillar 3 achievements
    if (!userData.stats.hybridBestStreaks) {
      userData.stats.hybridBestStreaks = { 80: 0, 90: 0, 100: 0 };
    }
    
    // Update hybrid best streaks for each threshold
    if (sessionAccuracy >= 80 && bestSessionStreak > (userData.stats.hybridBestStreaks[80] || 0)) {
      userData.stats.hybridBestStreaks[80] = bestSessionStreak;
    }
    if (sessionAccuracy >= 90 && bestSessionStreak > (userData.stats.hybridBestStreaks[90] || 0)) {
      userData.stats.hybridBestStreaks[90] = bestSessionStreak;
    }
    if (sessionAccuracy === 100 && bestSessionStreak > (userData.stats.hybridBestStreaks[100] || 0)) {
      userData.stats.hybridBestStreaks[100] = bestSessionStreak;
    }
  }

  // Award P-XP (Player Prestige XP) - only for completed games, not 2-player mode
  if (completed && gameMode !== 'two') {
    awardPxp(1, currentSessionCorrect, gameMode);
  }

  // Record stats history for chart (only for completed single-player games)
  if (completed && gameMode !== 'two') {
    const sessionTimeSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
    const sessionAnswerTimeMs = sessionAnswerTimes.reduce((a, b) => a + b, 0);
    recordStatsHistory(1, currentSessionCorrect, currentSessionWrong, sessionTimeSeconds, bestSessionStreak, topicId, sessionAnswerTimeMs);
  }

  // Save to localStorage
  saveUserData();

  // Update displays
  updateAllStatsDisplays();

  console.log('Quiz stats saved:', {
    topic: topicId,
    completed: completed,
    sessionCorrect: currentSessionCorrect,
    sessionWrong: currentSessionWrong,
    bestStreak: bestSessionStreak,
    sessionAnswerTimes: sessionAnswerTimes,
    avgAnswerTimeMs: sessionAnswerTimes.length > 0 ? Math.round(sessionAnswerTimes.reduce((a,b) => a+b, 0) / sessionAnswerTimes.length) : 0,
    topicStats: topic,
    globalAccuracy: userData.stats.accuracy
  });
}

// ========================================
// ⚔️ RANKED MODE SYSTEM
// ========================================

const RANKED_QUIZZES_REQUIRED = 30;
const RANKED_RELEASED = false; // Set to true when Ranked Mode launches

// Get current quiz count (totalGames)
function getRankedQuizCount() {
  return userData.stats.totalGames || 0;
}

// Check if user is qualified for ranked
function isRankedQualified() {
  return getRankedQuizCount() >= RANKED_QUIZZES_REQUIRED;
}

// Update Ranked button state based on user progress
function updateRankedButtonState() {
  const rankedButton = document.getElementById('ranked-button');
  const lockIcon = document.getElementById('ranked-lock-icon');
  const qualifiedIcon = document.getElementById('ranked-qualified-icon');
  
  if (!rankedButton) return;
  
  const qualified = isRankedQualified();
  
  if (qualified) {
    // State B: Qualified but not released yet
    rankedButton.classList.add('qualified');
    if (lockIcon) lockIcon.classList.add('hidden');
    if (qualifiedIcon) qualifiedIcon.classList.remove('hidden');
  } else {
    // State A: Locked
    rankedButton.classList.remove('qualified');
    if (lockIcon) lockIcon.classList.remove('hidden');
    if (qualifiedIcon) qualifiedIcon.classList.add('hidden');
  }
}

// Open appropriate Ranked modal based on state
function openRankedModal() {
  const qualified = isRankedQualified();
  const lockedModal = document.getElementById('ranked-modal-locked');
  const qualifiedModal = document.getElementById('ranked-modal-qualified');
  
  if (RANKED_RELEASED) {
    // State C: Ranked is live - open Ranked Mode (future implementation)
    console.log('Opening Ranked Mode...');
    // TODO: Navigate to Ranked screen when implemented
    return;
  }
  
  if (qualified) {
    // State B: Show qualified modal
    if (qualifiedModal) qualifiedModal.classList.remove('hidden');
  } else {
    // State A: Show locked modal with progress
    updateRankedLockedModal();
    if (lockedModal) lockedModal.classList.remove('hidden');
  }
}

// Update locked modal with current progress
function updateRankedLockedModal() {
  const currentQuizzes = getRankedQuizCount();
  const remaining = Math.max(0, RANKED_QUIZZES_REQUIRED - currentQuizzes);
  const progress = Math.min(100, (currentQuizzes / RANKED_QUIZZES_REQUIRED) * 100);
  
  const remainingEl = document.getElementById('ranked-remaining-quizzes');
  const progressFill = document.getElementById('ranked-progress-fill');
  const progressText = document.getElementById('ranked-progress-text');
  
  if (remainingEl) remainingEl.textContent = remaining;
  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${currentQuizzes} / ${RANKED_QUIZZES_REQUIRED}`;
}

// Close all Ranked modals
function closeRankedModal() {
  const lockedModal = document.getElementById('ranked-modal-locked');
  const qualifiedModal = document.getElementById('ranked-modal-qualified');
  
  if (lockedModal) lockedModal.classList.add('hidden');
  if (qualifiedModal) qualifiedModal.classList.add('hidden');
}

// Placeholder for notify button
function notifyRankedRelease() {
  alert('You will be notified when Ranked Mode launches!');
  closeRankedModal();
}

// Developer Debug: Set user to 30 quizzes (for testing qualified state)
function devSetQualified() {
  userData.stats.totalGames = RANKED_QUIZZES_REQUIRED;
  saveUserData();
  updateRankedButtonState();
  updateAllStatsDisplays();
  console.log('🛠️ DEV: User set to qualified (30 quizzes)');
  alert('Developer Mode: Quiz count set to 30. You are now qualified for Ranked!');
}

// Developer Debug: Reset quiz count to 0 (for testing locked state)
function devResetQuizCount() {
  userData.stats.totalGames = 0;
  saveUserData();
  updateRankedButtonState();
  updateAllStatsDisplays();
  console.log('🛠️ DEV: Quiz count reset to 0');
}

// Add developer debug button (only if SHOW_DEV_UI is true)
function addDevDebugButton() {
  if (!SHOW_DEV_UI) return;
  
  // Check if button already exists
  if (document.getElementById('dev-ranked-btn')) return;
  
  const devBtn = document.createElement('button');
  devBtn.id = 'dev-ranked-btn';
  devBtn.className = 'dev-debug-btn';
  devBtn.textContent = '🛠️ Make Me Lvl 30';
  devBtn.onclick = devSetQualified;
  document.body.appendChild(devBtn);
}

// Initialize Ranked system
function initRankedSystem() {
  updateRankedButtonState();
  addDevDebugButton();
}

// ========================================
// 🔮 TRAIL RING SYSTEM
// ========================================

// Open Trail Ring modal
function openTrailRingModal() {
  const modal = document.getElementById('trail-ring-modal');
  if (modal) modal.classList.remove('hidden');
}

// Close Trail Ring modal
function closeTrailRingModal() {
  const modal = document.getElementById('trail-ring-modal');
  if (modal) modal.classList.add('hidden');
}

// ========================================
// 🧠 QUIZ OF THE DAY SYSTEM
// ========================================

// All available topics for daily rotation
const qotdTopics = [
  { id: 'flags-topic-btn', icon: '🏳️', name: 'Flags' },
  { id: 'capitals-topic-btn', icon: '🏛️', name: 'Capitals' },
  { id: 'area-topic-btn', icon: '📏', name: 'Area' },
  { id: 'borders-topic-btn', icon: '🗺️', name: 'Borders' },
  { id: 'football-general-topic-btn', icon: '⚽', name: 'Football' },
  { id: 'premier-league-topic-btn', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Premier League' },
  { id: 'champions-league-topic-btn', icon: '🏆', name: 'Champions League' },
  { id: 'world-cup-topic-btn', icon: '🌍', name: 'World Cup' },
  { id: 'derbies-topic-btn', icon: '🔥', name: 'Derbies' },
  { id: 'messi-topic-btn', icon: '🐐', name: 'Messi' },
  { id: 'ronaldo-topic-btn', icon: '🐐', name: 'Ronaldo' },
  { id: 'movies-general-topic-btn', icon: '🎬', name: 'Movies' },
  { id: 'marvel-movies-topic-btn', icon: '🦸', name: 'Marvel' },
  { id: 'dc-movies-topic-btn', icon: '🦇', name: 'DC' },
  { id: 'disney-movies-topic-btn', icon: '🏰', name: 'Disney' },
  { id: 'harry-potter-topic-btn', icon: '⚡', name: 'Harry Potter' },
  { id: 'star-wars-topic-btn', icon: '⭐', name: 'Star Wars' },
  { id: 'lotr-topic-btn', icon: '💍', name: 'LOTR' },
  { id: 'tv-general-topic-btn', icon: '📺', name: 'TV Shows' },
  { id: 'sitcoms-topic-btn', icon: '😂', name: 'Sitcoms' },
  { id: 'game-of-thrones-topic-btn', icon: '🐉', name: 'Game of Thrones' },
  { id: 'breaking-bad-topic-btn', icon: '🧪', name: 'Breaking Bad' },
  { id: 'stranger-things-topic-btn', icon: '👾', name: 'Stranger Things' },
  { id: 'money-heist-topic-btn', icon: '💰', name: 'Money Heist' },
  { id: 'the-office-topic-btn', icon: '📋', name: 'The Office' },
  { id: 'world-history-topic-btn', icon: '📜', name: 'World History' },
  { id: 'ww2-topic-btn', icon: '✠', name: 'World War II' },
  { id: 'ww1-topic-btn', icon: '⚔️', name: 'World War I' },
  { id: 'roman-empire-topic-btn', icon: '🏛️', name: 'Roman Empire' },
  { id: 'ottoman-empire-topic-btn', icon: '🌙', name: 'Ottoman Empire' },
  { id: 'egyptian-topic-btn', icon: '🔱', name: 'Egyptian' }
];

// Get today's quiz based on day of year
function getTodaysQuiz() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Use day of year to select topic (cycles through all topics)
  const topicIndex = dayOfYear % qotdTopics.length;
  return qotdTopics[topicIndex];
}

// Initialize Quiz of the Day
function initQuizOfTheDay() {
  const topic = getTodaysQuiz();
  const iconEl = document.getElementById('qotd-topic-icon');
  
  if (iconEl) {
    iconEl.textContent = topic.icon;
  }
}

// Start Quiz of the Day
function startQuizOfTheDay() {
  const topic = getTodaysQuiz();
  const btn = document.getElementById(topic.id);
  
  if (btn) {
    btn.click();
  } else {
    console.warn('Quiz of the Day topic button not found:', topic.id);
  }
}

// Start a random quiz from any topic with a random unlocked mode
function startRandomQuiz() {
  // Build pool of all valid (topic, mode) combinations
  const availableCombinations = [];
  const modes = ['casual', 'time-attack', 'three-hearts'];
  
  ALL_TOPICS.forEach(topicId => {
    const topicData = getTopicXPData(topicId);
    
    modes.forEach(mode => {
      // Check if this mode is unlocked for this topic
      if (isModeUnlocked(topicData, mode)) {
        availableCombinations.push({
          topicId: topicId,
          mode: mode
        });
      }
    });
  });
  
  // If no combinations available (shouldn't happen - casual is always unlocked)
  if (availableCombinations.length === 0) {
    console.warn('No available quiz combinations!');
    return;
  }
  
  // Pick a random combination
  const randomIndex = Math.floor(Math.random() * availableCombinations.length);
  const selected = availableCombinations[randomIndex];
  
  console.log(`🎲 Random Quiz: ${selected.topicId} - ${selected.mode}`);
  
  // Set current topic
  currentTopic = selected.topicId;
  
  // Start the game directly with selected mode (bypassing mode selection screen)
  startUnifiedGame(selected.mode);
}

// ========================================
// 🎰 MY SLOTS SYSTEM
// ========================================

// Storage key for slots
const SLOTS_STORAGE_KEY = 'quizzena_my_slots';

// Topic image path mapping (category -> folder name)
const TOPIC_IMAGE_FOLDERS = {
  'geography': 'geography',
  'football': 'football',
  'history': 'history',
  'movies': 'movies',
  'tv-shows': 'tvshows',
  'logos': 'logos'
};

// Get topic image path
function getTopicImagePath(topicId) {
  const config = getTopicConfig(topicId);
  const folder = TOPIC_IMAGE_FOLDERS[config.category] || config.category;
  
  // Handle special cases where topicId doesn't match filename
  const imageNameMap = {
    'ancient-civs': 'ancient-civilizations',
    'ottoman': 'ottoman-empire',
    'tv-shows': 'tvshows',
    'sitcoms': 'sitcoms',
    'game-of-thrones': 'game-of-thrones',
    'breaking-bad': 'breaking-bad',
    'stranger-things': 'stranger-things',
    'money-heist': 'money-heist',
    'the-office': 'the-office'
  };
  
  const imageName = imageNameMap[topicId] || topicId;
  return `./icons/topics/${folder}/${imageName}.png`;
}

// Load slots from localStorage
function loadSlots() {
  try {
    const stored = localStorage.getItem(SLOTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load slots from storage:', e);
  }
  return { slot1: null, slot2: null };
}

// Save slots to localStorage
function saveSlots(slots) {
  try {
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(slots));
  } catch (e) {
    console.warn('Failed to save slots to storage:', e);
  }
}

// Get current slots
function getSlots() {
  return loadSlots();
}

// Render a single slot
function renderSlot(slotNumber) {
  const slots = getSlots();
  const topicId = slots[`slot${slotNumber}`];
  const slotElement = document.getElementById(`slot-${slotNumber}`);
  
  if (!slotElement) return;
  
  const imgElement = slotElement.querySelector('.slot-topic-img');
  const labelElement = slotElement.querySelector('.slot-label');
  const emptyIcon = slotElement.querySelector('.slot-empty-icon');
  const clearBtn = slotElement.querySelector('.slot-clear-btn');
  
  // Remove any existing tooltip
  const existingTooltip = slotElement.querySelector('.slot-tooltip');
  if (existingTooltip) existingTooltip.remove();
  
  if (topicId && TOPIC_CONFIG[topicId]) {
    // Filled state
    const config = getTopicConfig(topicId);
    slotElement.classList.remove('slot-empty');
    slotElement.classList.add('slot-filled');
    
    imgElement.src = getTopicImagePath(topicId);
    imgElement.alt = config.name;
    labelElement.textContent = config.name;
  } else {
    // Empty state
    slotElement.classList.remove('slot-filled');
    slotElement.classList.add('slot-empty');
    
    imgElement.src = '';
    imgElement.alt = '';
    labelElement.textContent = `Slot ${slotNumber}`;
  }
}

// Render all slots
function renderAllSlots() {
  renderSlot(1);
  renderSlot(2);
}

// Handle slot click
function handleSlotClick(slotNumber) {
  const slots = getSlots();
  const topicId = slots[`slot${slotNumber}`];

  if (topicId && TOPIC_CONFIG[topicId]) {
    // Filled slot - go to mode selection
    currentTopic = topicId;
    const config = getTopicConfig(topicId);
    showUnifiedModeSelection(config.name, config.icon);
  } else {
    // Empty slot - go to Topics page so user can pick a quiz
    showTopics();
  }
}

// Show tooltip for empty slot
function showSlotTooltip(slotNumber) {
  const slotElement = document.getElementById(`slot-${slotNumber}`);
  if (!slotElement) return;
  
  // Remove any existing tooltips
  document.querySelectorAll('.slot-tooltip').forEach(t => t.remove());
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'slot-tooltip';
  tooltip.textContent = 'Assign a quiz from any topic';
  slotElement.appendChild(tooltip);
  
  // Show tooltip
  requestAnimationFrame(() => {
    tooltip.classList.add('show');
  });
  
  // Hide after 2.5 seconds
  setTimeout(() => {
    tooltip.classList.remove('show');
    setTimeout(() => tooltip.remove(), 300);
  }, 2500);
}

// Variable to store pending topic for slot assignment
let pendingSlotTopic = null;

// Open slot selection modal
function openSlotModal(topicId) {
  pendingSlotTopic = topicId;
  
  const modal = document.getElementById('slot-modal');
  const slots = getSlots();
  
  // Update modal buttons to show current slot contents
  const btn1Text = document.getElementById('slot-modal-btn-1');
  const btn2Text = document.getElementById('slot-modal-btn-2');
  
  if (slots.slot1 && TOPIC_CONFIG[slots.slot1]) {
    btn1Text.textContent = getTopicConfig(slots.slot1).name;
    btn1Text.classList.add('has-topic');
  } else {
    btn1Text.textContent = 'Empty';
    btn1Text.classList.remove('has-topic');
  }
  
  if (slots.slot2 && TOPIC_CONFIG[slots.slot2]) {
    btn2Text.textContent = getTopicConfig(slots.slot2).name;
    btn2Text.classList.add('has-topic');
  } else {
    btn2Text.textContent = 'Empty';
    btn2Text.classList.remove('has-topic');
  }
  
  modal.classList.remove('hidden');
}

// Close slot selection modal
function closeSlotModal() {
  const modal = document.getElementById('slot-modal');
  modal.classList.add('hidden');
  pendingSlotTopic = null;
}

// Assign topic to slot
function assignToSlot(slotNumber) {
  if (!pendingSlotTopic) {
    closeSlotModal();
    return;
  }

  const slots = getSlots();
  slots[`slot${slotNumber}`] = pendingSlotTopic;
  saveSlots(slots);

  // Get topic name for toast
  const config = getTopicConfig(pendingSlotTopic);

  closeSlotModal();

  // Render slots with updated data (for when user returns to home)
  renderAllSlots();

  // Show success toast
  showToast(`${config.name} added to Slot ${slotNumber}! ✓`);
}

// Clear a slot
function clearSlot(slotNumber) {
  const slots = getSlots();
  const topicId = slots[`slot${slotNumber}`];
  
  if (topicId) {
    const config = getTopicConfig(topicId);
    slots[`slot${slotNumber}`] = null;
    saveSlots(slots);
    renderAllSlots();
    showToast(`Slot ${slotNumber} cleared`);
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  const messageEl = toast.querySelector('.toast-message');
  
  messageEl.textContent = message;
  toast.classList.remove('hidden');
  
  // Hide after 2.5 seconds
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// Initialize slots on page load
function initializeSlots() {
  renderAllSlots();
}

// Populate Continue Playing section with recently played topics (clones actual topic cards)
function populateContinuePlaying() {
  const continueSection = document.querySelector('.continue-section');
  const continueRow = document.getElementById('continue-row');
  if (!continueRow || !continueSection) return;
  
  // Get topics with games played, sorted by MOST RECENTLY PLAYED (left = most recent)
  const playedTopics = [];
  
  if (userData.stats && userData.stats.topics) {
    for (const topicId in userData.stats.topics) {
      const stats = userData.stats.topics[topicId];
      if (stats.games && stats.games > 0) {
        playedTopics.push({
          id: topicId,
          lastPlayed: stats.lastPlayed || 0 // Use timestamp, default to 0 if not set
        });
      }
    }
  }
  
  // Sort by lastPlayed timestamp (most recent first = LEFT side)
  playedTopics.sort((a, b) => b.lastPlayed - a.lastPlayed);
  
  // Take top 2 (fits mobile screen like Quick Play)
  const topTopics = playedTopics.slice(0, 2);
  
  // If no topics played, HIDE the entire section
  if (topTopics.length === 0) {
    continueSection.style.display = 'none';
    return;
  }
  
  // Show the section
  continueSection.style.display = 'block';
  continueRow.innerHTML = '';
  
  // Clone the actual topic cards from the DOM
  topTopics.forEach(topic => {
    // Map topic ID to button ID (handle special cases)
    let btnId = `${topic.id}-topic-btn`;
    if (topic.id === 'football') btnId = 'football-general-topic-btn';
    else if (topic.id === 'movies') btnId = 'movies-general-topic-btn';
    else if (topic.id === 'marvel') btnId = 'marvel-movies-topic-btn';
    else if (topic.id === 'tv-shows') btnId = 'tv-general-topic-btn';
    else if (topic.id === 'dc') btnId = 'dc-movies-topic-btn';
    else if (topic.id === 'disney') btnId = 'disney-movies-topic-btn';
    else if (topic.id === 'ottoman') btnId = 'ottoman-empire-topic-btn';
    
    // Find the original topic card button
    const originalBtn = document.getElementById(btnId);
    if (originalBtn) {
      // Clone the parent container (status-active div) which contains the full styled card
      const originalCard = originalBtn.closest('.status-active') || originalBtn.parentElement;
      if (originalCard) {
        const clonedCard = originalCard.cloneNode(true);
        // Make sure cloned button has a unique ID to avoid conflicts
        const clonedBtn = clonedCard.querySelector('button[id]');
        if (clonedBtn) {
          clonedBtn.id = `continue-${clonedBtn.id}`;
          // Add click handler to trigger the original button
          clonedBtn.onclick = function() {
            playClickSound();
            originalBtn.click();
          };
        }
        continueRow.appendChild(clonedCard);
      }
    }
  });
}

// Populate Mini Stats Snapshot
function populateMiniStats() {
  const section = document.getElementById('mini-stats-section');
  if (!section) return;

  const stats = userData.stats || {};
  const totalGames = stats.totalGames || 0;

  // Only show if user has played at least 1 game
  if (totalGames < 1) {
    section.classList.add('hidden');
    return;
  }

  const totalQuestions = (stats.correctAnswers || 0) + (stats.wrongAnswers || 0);
  const bestStreak = stats.bestStreak || 0;
  const totalTimeSeconds = stats.totalTimeSeconds || 0;

  // Format time
  let timeDisplay;
  if (totalTimeSeconds < 60) {
    timeDisplay = totalTimeSeconds + 's';
  } else if (totalTimeSeconds < 3600) {
    timeDisplay = Math.floor(totalTimeSeconds / 60) + 'm';
  } else {
    const hours = Math.floor(totalTimeSeconds / 3600);
    const mins = Math.floor((totalTimeSeconds % 3600) / 60);
    timeDisplay = hours + 'h ' + mins + 'm';
  }

  // Update values
  document.getElementById('mini-stat-games').textContent = totalGames;
  document.getElementById('mini-stat-questions').textContent = totalQuestions;
  document.getElementById('mini-stat-streak').textContent = bestStreak;
  document.getElementById('mini-stat-time').textContent = timeDisplay;

  // Show section
  section.classList.remove('hidden');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initQuizOfTheDay();
  populateContinuePlaying();
  populateMiniStats();
  initializeSlots();
  initGalaxyModeToggle();
  initCard3dModeToggle();
  initExtraEffectsToggle();
  initMusicControls();
  initSfxControls();

  // Start background music on first user interaction
  document.addEventListener('click', () => {
    startBackgroundMusic();
  }, { once: true });
});

// ========================================
// ✦ QUANTA & LEVEL BADGE SYSTEM
// ========================================

// Open Quanta modal
function openQuantaModal() {
  const modal = document.getElementById('quanta-modal');
  if (modal) modal.classList.remove('hidden');
}

// Close Quanta modal
function closeQuantaModal() {
  const modal = document.getElementById('quanta-modal');
  if (modal) modal.classList.add('hidden');
}

// ========================================
// FOUNDERS LEADERBOARD MODAL
// ========================================

// Show founders early modal
function showFoundersEarlyModal() {
  // Add pulse animation to button
  const btn = document.querySelector('.lb-cta-btn');
  if (btn) {
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 400);
  }
  
  // Trigger haptic feedback if available
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
  
  // Get translated text
  const modalText = translations.lb_early_modal || "You're early. Keep playing.";
  const okText = translations.common_ok || "OK";
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('lb-early-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'lb-early-modal';
    modal.className = 'lb-early-modal';
    modal.innerHTML = `
      <div class="lb-early-modal-content">
        <div class="lb-early-modal-icon">⏳</div>
        <p class="lb-early-modal-text">${modalText.replace('. ', '.<br>')}</p>
        <button class="lb-early-modal-btn" onclick="closeFoundersEarlyModal()">${okText}</button>
      </div>
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFoundersEarlyModal();
    });
    document.body.appendChild(modal);
  } else {
    // Update text if modal already exists
    const textEl = modal.querySelector('.lb-early-modal-text');
    const btnEl = modal.querySelector('.lb-early-modal-btn');
    if (textEl) textEl.innerHTML = modalText.replace('. ', '.<br>');
    if (btnEl) btnEl.textContent = okText;
  }
  
  // Show with animation (slight delay for pulse effect)
  setTimeout(() => modal.classList.add('active'), 150);
  playClickSound();
}

// Close founders early modal
function closeFoundersEarlyModal() {
  const modal = document.getElementById('lb-early-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  playClickSound();
}

// ========================================
// P-XP (Player Prestige XP) SYSTEM
// ========================================

// P-XP Formula: Required XP to level up = 40 × (Level²)
function getPxpRequiredForLevel(level) {
  return 40 * (level * level);
}

// Get current P-XP progress info
function getPxpProgress() {
  const level = userData.prestige?.level || 1;
  const currentPxp = userData.prestige?.pxp || 0;
  const required = getPxpRequiredForLevel(level);
  const progress = Math.min((currentPxp / required) * 100, 100);
  return { level, currentPxp, required, progress };
}

// Award P-XP (called after quiz completion)
function awardPxp(gamesCompleted, correctAnswers, gameMode) {
  // No P-XP for 2-player mode
  if (gameMode === '2player' || gameMode === 'two-player') return;
  
  // Ensure prestige data exists
  if (!userData.prestige) {
    userData.prestige = { level: 1, pxp: 0, totalPxp: 0, history: {} };
  }
  
  const pxpFromGames = gamesCompleted * 10;
  const pxpFromAnswers = correctAnswers * 1;
  const totalEarned = pxpFromGames + pxpFromAnswers;
  
  if (totalEarned <= 0) return;
  
  // Add to current P-XP
  userData.prestige.pxp += totalEarned;
  userData.prestige.totalPxp += totalEarned;
  
  // Record in history
  recordPxpHistory(pxpFromGames, pxpFromAnswers);
  
  // Check for level up
  checkPxpLevelUp();
  
  // Save data
  saveUserData();
  
  console.log(`🏆 P-XP Earned: +${totalEarned} (Games: ${pxpFromGames}, Answers: ${pxpFromAnswers})`);
}

// Check and handle P-XP level up
function checkPxpLevelUp() {
  let levelsGained = 0;
  let required = getPxpRequiredForLevel(userData.prestige.level);
  
  while (userData.prestige.pxp >= required) {
    userData.prestige.pxp -= required;
    userData.prestige.level++;
    levelsGained++;
    required = getPxpRequiredForLevel(userData.prestige.level);
    console.log(`🎉 P-XP Level Up! Now Level ${userData.prestige.level}`);
  }
  
  if (levelsGained > 0) {
    // Update displays
    updateGlobalLevelBadge();
  }
}

// Record P-XP in history
function recordPxpHistory(gamesXp, answersXp) {
  const now = new Date();
  // Use local date to match local hours
  const dateKey = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
  const hour = now.getHours().toString().padStart(2, '0');
  
  if (!userData.prestige.history) {
    userData.prestige.history = {};
  }
  
  if (!userData.prestige.history[dateKey]) {
    userData.prestige.history[dateKey] = { games: 0, answers: 0, hourly: {} };
  }
  
  const dayData = userData.prestige.history[dateKey];
  dayData.games += gamesXp;
  dayData.answers += answersXp;
  
  // Hourly breakdown for "1 Day" view
  if (!dayData.hourly[hour]) {
    dayData.hourly[hour] = { g: 0, a: 0 };
  }
  dayData.hourly[hour].g += gamesXp;
  dayData.hourly[hour].a += answersXp;
}

// Record stats history (games, correct, wrong, time, streak, topic, answerTime)
function recordStatsHistory(gamesCount, correctCount, wrongCount, timeSeconds, bestStreak, topicId = null, answerTimeMs = 0) {
  const now = new Date();
  // Use local date to match local hours
  const dateKey = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
  const hour = now.getHours().toString().padStart(2, '0');
  
  // Initialize stats if not exists (migration for existing users)
  if (!userData.stats) {
    userData.stats = {};
  }
  
  // Initialize stats history if not exists
  if (!userData.stats.history) {
    userData.stats.history = {};
  }
  
  // Initialize day entry if not exists
  if (!userData.stats.history[dateKey]) {
    userData.stats.history[dateKey] = { 
      games: 0, 
      correct: 0, 
      wrong: 0, 
      time: 0, 
      streak: 0,
      hourly: {},
      topics: {}  // Per-topic history
    };
  }
  
  const dayData = userData.stats.history[dateKey];
  
  // Migrate old data that doesn't have topics
  if (!dayData.topics) {
    dayData.topics = {};
  }
  
  // Add to daily totals (global)
  dayData.games += gamesCount;
  dayData.correct += correctCount;
  dayData.wrong += wrongCount;
  dayData.time += timeSeconds;
  
  // Track best streak observed today (keep the highest)
  if (bestStreak > dayData.streak) {
    dayData.streak = bestStreak;
  }
  
  // Hourly breakdown for "1 Day" view (global)
  if (!dayData.hourly[hour]) {
    dayData.hourly[hour] = { g: 0, c: 0, w: 0, t: 0, s: 0 };
  }
  
  const hourData = dayData.hourly[hour];
  hourData.g += gamesCount;
  hourData.c += correctCount;
  hourData.w += wrongCount;
  hourData.t += timeSeconds;
  
  // Track best streak for this hour (keep the highest)
  if (bestStreak > hourData.s) {
    hourData.s = bestStreak;
  }
  
  // ========== PER-TOPIC HISTORY ==========
  if (topicId) {
    // Initialize topic entry for this day if not exists
    if (!dayData.topics[topicId]) {
      dayData.topics[topicId] = {
        games: 0,
        correct: 0,
        wrong: 0,
        time: 0,
        streak: 0,
        answerTimeMs: 0,
        hourly: {}
      };
    }
    
    const topicDayData = dayData.topics[topicId];
    
    // Add to topic daily totals
    topicDayData.games += gamesCount;
    topicDayData.correct += correctCount;
    topicDayData.wrong += wrongCount;
    topicDayData.time += timeSeconds;
    topicDayData.answerTimeMs += answerTimeMs;
    
    // Track best streak for this topic today
    if (bestStreak > topicDayData.streak) {
      topicDayData.streak = bestStreak;
    }
    
    // Topic hourly breakdown
    if (!topicDayData.hourly[hour]) {
      topicDayData.hourly[hour] = { g: 0, c: 0, w: 0, t: 0, s: 0, at: 0 };
    }
    
    const topicHourData = topicDayData.hourly[hour];
    topicHourData.g += gamesCount;
    topicHourData.c += correctCount;
    topicHourData.w += wrongCount;
    topicHourData.t += timeSeconds;
    topicHourData.at += answerTimeMs;
    
    if (bestStreak > topicHourData.s) {
      topicHourData.s = bestStreak;
    }
  }
}

// Get date string for N days ago
function getDateString(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  // Use local date (not UTC) to match local hours
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
}

// P-XP Dashboard Chart instance
let pxpChart = null;
let currentPxpPeriod = 'day';

// Open P-XP Dashboard
function openJourneyModal() {
  openPxpDashboard();
}

function openPxpDashboard() {
  const dashboard = document.getElementById('pxp-dashboard');
  if (dashboard) {
    dashboard.classList.remove('hidden');
    updatePxpDashboard();
  }
}

// Close P-XP Dashboard
function closeJourneyModal() {
  closePxpDashboard();
}

function closePxpDashboard() {
  const dashboard = document.getElementById('pxp-dashboard');
  if (dashboard) dashboard.classList.add('hidden');
}

// Calculate all-time P-XP from history
function calculateAllTimePxp() {
  const history = userData.prestige?.history || {};
  const achHistory = userData.achievements?.history || {};
  let total = 0;

  // Sum all days from prestige history
  Object.keys(history).forEach(dateKey => {
    const day = history[dateKey];
    // Sum from hourly data
    if (day.hourly) {
      Object.values(day.hourly).forEach(h => {
        total += (h.g || 0) + (h.a || 0);
      });
    }
  });

  // Sum from achievements history
  Object.keys(achHistory).forEach(dateKey => {
    total += achHistory[dateKey]?.pxp || 0;
  });

  return total;
}

// Update P-XP Dashboard display
function updatePxpDashboard() {
  // Calculate all-time total from history (source of truth)
  const allTimeTotal = calculateAllTimePxp();
  
  // Calculate level from all-time total
  let remainingPxp = allTimeTotal;
  let level = 1;
  let required = getPxpRequiredForLevel(level);
  
  while (remainingPxp >= required) {
    remainingPxp -= required;
    level++;
    required = getPxpRequiredForLevel(level);
  }
  
  const progressPercent = Math.min((remainingPxp / required) * 100, 100);
  
  // Update DOM elements
  const levelNum = document.getElementById('pxp-level-number');
  const currentEl = document.getElementById('pxp-current');
  const requiredEl = document.getElementById('pxp-required');
  const totalEl = document.getElementById('pxp-total');
  const progressFill = document.getElementById('pxp-progress-fill');
  const ringProgress = document.getElementById('pxp-ring-progress');
  
  if (levelNum) levelNum.textContent = level;
  if (currentEl) currentEl.textContent = remainingPxp;
  if (requiredEl) requiredEl.textContent = required;
  if (totalEl) totalEl.textContent = allTimeTotal;
  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  
  // Update ring progress
  if (ringProgress) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (1 - progressPercent / 100);
    ringProgress.style.strokeDashoffset = offset;
  }
  
  // Sync userData.prestige if needed
  if (!userData.prestige) userData.prestige = { level: 1, pxp: 0, totalPxp: 0, history: {} };
  if (userData.prestige.totalPxp !== allTimeTotal || userData.prestige.level !== level) {
    userData.prestige.totalPxp = allTimeTotal;
    userData.prestige.level = level;
    userData.prestige.pxp = remainingPxp;
    saveUserData();
    updateGlobalLevelBadge();
  }
  
  // Render chart
  renderPxpChart(currentPxpPeriod);
}

// Switch time period
function switchPxpPeriod(period) {
  currentPxpPeriod = period;
  
  // Update active tab
  document.querySelectorAll('.pxp-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.period === period);
  });
  
  // Update breakdown title
  const titleEl = document.getElementById('pxp-breakdown-title');
  if (titleEl) {
    const titles = {
      'day': t('pxp_today_breakdown') || "Today's Breakdown",
      'week': t('pxp_week_breakdown') || "This Week's Breakdown",
      'month': t('pxp_month_breakdown') || "This Month's Breakdown",
      'year': t('pxp_year_breakdown') || "This Year's Breakdown"
    };
    titleEl.textContent = titles[period] || t('pxp_breakdown') || "Breakdown";
  }
  
  renderPxpChart(period);
}

// Render P-XP Chart
function renderPxpChart(period) {
  const canvas = document.getElementById('pxp-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const history = userData.prestige?.history || {};
  const achHistory = userData.achievements?.history || {};
  
  let labels = [];
  let gamesData = [];
  let answersData = [];
  let achievementsData = [];
  let totalGames = 0;
  let totalAnswers = 0;
  let totalAchievements = 0;
  
  if (period === 'day') {
    // Show rolling 24 hours ending at current hour
    const today = getDateString(0);
    const yesterday = getDateString(1);
    const todayData = history[today] || { hourly: {} };
    const yesterdayData = history[yesterday] || { hourly: {} };
    const achTodayData = achHistory[today] || { pxp: 0 };
    const achYesterdayData = achHistory[yesterday] || { pxp: 0 };
    const currentHour = new Date().getHours();
    
    for (let i = 0; i < 24; i++) {
      const h = (currentHour + 1 + i) % 24;
      const hourKey = h.toString().padStart(2, '0');
      
      const isYesterday = (currentHour + 1 + i) < 24;
      const dayData = isYesterday ? yesterdayData : todayData;
      const hourData = dayData.hourly?.[hourKey] || { g: 0, a: 0 };
      
      labels.push(h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h-12}p`);
      gamesData.push(hourData.g);
      answersData.push(hourData.a);
      // Show achievements at the current hour (last point)
      achievementsData.push(i === 23 ? (achTodayData.pxp || 0) : 0);
      totalGames += hourData.g;
      totalAnswers += hourData.a;
    }
    totalAchievements = (achTodayData.pxp || 0) + (achYesterdayData.pxp || 0);
  } else if (period === 'week') {
    // Show last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const dateKey = getDateString(i);
      const dayData = history[dateKey] || { games: 0, answers: 0 };
      const achDayData = achHistory[dateKey] || { pxp: 0 };
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      labels.push(dayNames[date.getDay()]);
      gamesData.push(dayData.games);
      answersData.push(dayData.answers);
      achievementsData.push(achDayData.pxp || 0);
      totalGames += dayData.games;
      totalAnswers += dayData.answers;
      totalAchievements += achDayData.pxp || 0;
    }
  } else if (period === 'month') {
    // Show last 30 days
    for (let i = 29; i >= 0; i--) {
      const dateKey = getDateString(i);
      const dayData = history[dateKey] || { games: 0, answers: 0 };
      const achDayData = achHistory[dateKey] || { pxp: 0 };
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      labels.push(date.getDate().toString());
      gamesData.push(dayData.games);
      answersData.push(dayData.answers);
      achievementsData.push(achDayData.pxp || 0);
      totalGames += dayData.games;
      totalAnswers += dayData.answers;
      totalAchievements += achDayData.pxp || 0;
    }
  } else if (period === 'year') {
    // Show 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      let monthGames = 0;
      let monthAnswers = 0;
      let monthAchievements = 0;
      
      // Sum all days in this month
      Object.keys(history).forEach(dateKey => {
        if (dateKey.startsWith(monthKey)) {
          monthGames += history[dateKey].games || 0;
          monthAnswers += history[dateKey].answers || 0;
        }
      });
      
      Object.keys(achHistory).forEach(dateKey => {
        if (dateKey.startsWith(monthKey)) {
          monthAchievements += achHistory[dateKey].pxp || 0;
        }
      });
      
      labels.push(monthNames[targetDate.getMonth()]);
      gamesData.push(monthGames);
      answersData.push(monthAnswers);
      achievementsData.push(monthAchievements);
      totalGames += monthGames;
      totalAnswers += monthAnswers;
      totalAchievements += monthAchievements;
    }
  }
  
  // Update breakdown numbers
  const gamesCount = document.getElementById('pxp-games-count');
  const gamesPxp = document.getElementById('pxp-games-pxp');
  const answersCount = document.getElementById('pxp-answers-count');
  const answersPxp = document.getElementById('pxp-answers-pxp');
  const achievementsCount = document.getElementById('pxp-achievements-count');
  const achievementsPxp = document.getElementById('pxp-achievements-pxp');
  const periodTotal = document.getElementById('pxp-period-total');
  
  if (gamesCount) gamesCount.textContent = totalGames / 10; // Convert back to game count
  if (gamesPxp) gamesPxp.textContent = `+${totalGames}`;
  if (answersCount) answersCount.textContent = totalAnswers;
  if (answersPxp) answersPxp.textContent = `+${totalAnswers}`;
  if (achievementsCount) achievementsCount.textContent = (userData.achievements?.unlocked?.length || 0);
  if (achievementsPxp) achievementsPxp.textContent = `+${totalAchievements}`;
  if (periodTotal) periodTotal.textContent = `+${totalGames + totalAnswers + totalAchievements} P-XP`;
  
  // Destroy existing chart if any
  if (pxpChart) {
    pxpChart.destroy();
  }
  
  // Create new chart
  pxpChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Games P-XP',
          data: gamesData,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          pointBackgroundColor: '#7c3aed',
          pointBorderColor: '#7c3aed',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Answers P-XP',
          data: answersData,
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          pointBackgroundColor: '#fbbf24',
          pointBorderColor: '#fbbf24',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Achievements P-XP',
          data: achievementsData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#22c55e',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          titleColor: '#fff',
          bodyColor: '#a78bfa',
          borderColor: 'rgba(124, 58, 237, 0.3)',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} P-XP`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 10 },
            maxRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 10 },
            stepSize: 10
          }
        }
      }
    }
  });
}

// ========================================
// STATS CHART DASHBOARD
// ========================================

let statsChart = null;
let currentStatType = 'games';
let currentStatsPeriod = 'day';

// Open Stats Chart Dashboard
function openStatsChart() {
  const dashboard = document.getElementById('stats-chart-dashboard');
  if (dashboard) {
    dashboard.classList.remove('hidden');
    switchStatsPage(1); // Start on Page 1
    renderStatsChart();
  }
}

// Close Stats Chart Dashboard
function closeStatsChart() {
  const dashboard = document.getElementById('stats-chart-dashboard');
  if (dashboard) {
    dashboard.classList.add('hidden');
  }
}

// Switch between stats pages
function switchStatsPage(page) {
  const page1 = document.getElementById('stats-page-1');
  const page2 = document.getElementById('stats-page-2');
  const tab1 = document.getElementById('stats-page-1-tab');
  const tab2 = document.getElementById('stats-page-2-tab');
  
  if (page === 1) {
    page1?.classList.remove('hidden');
    page2?.classList.add('hidden');
    tab1?.classList.add('active');
    tab2?.classList.remove('active');
    renderStatsChart();
  } else {
    page1?.classList.add('hidden');
    page2?.classList.remove('hidden');
    tab1?.classList.remove('active');
    tab2?.classList.add('active');
    renderTopicStatsChart();  // Render the topic stats chart
  }
}

// Switch stat type (games, questions, correct, wrong, time, streak)
function switchStatType(type) {
  currentStatType = type;
  
  // Update button states
  document.querySelectorAll('.stats-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stat === type);
  });
  
  renderStatsChart();
}

// Switch time period
function switchStatsPeriod(period) {
  currentStatsPeriod = period;
  
  // Update tab states
  document.querySelectorAll('.stats-period-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.period === period);
  });
  
  renderStatsChart();
}

// Render Stats Chart
function renderStatsChart() {
  const canvas = document.getElementById('stats-chart');
  const emptyEl = document.getElementById('stats-chart-empty');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const history = userData.stats?.history || {};
  
  let labels = [];
  let data = [];
  let total = 0;
  let peak = 0;
  
  // Get data based on period and type
  if (currentStatsPeriod === 'day') {
    // Show rolling 24 hours ending at current hour
    const today = getDateString(0);
    const yesterday = getDateString(1);
    const todayData = history[today] || { hourly: {} };
    const yesterdayData = history[yesterday] || { hourly: {} };
    const currentHour = new Date().getHours();
    
    // Loop through last 24 hours (from currentHour+1 yesterday to currentHour today)
    for (let i = 0; i < 24; i++) {
      // Calculate which hour this represents (starting 23 hours ago)
      const h = (currentHour + 1 + i) % 24;
      const hourKey = h.toString().padStart(2, '0');
      
      // Use yesterday's data for hours after current hour, today's for hours up to current
      const isYesterday = (currentHour + 1 + i) < 24;
      const dayData = isYesterday ? yesterdayData : todayData;
      const hourData = dayData.hourly?.[hourKey] || { g: 0, c: 0, w: 0, t: 0, s: 0 };
      
      labels.push(h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h-12}p`);
      
      let value = 0;
      switch (currentStatType) {
        case 'games': value = hourData.g; break;
        case 'questions': value = hourData.c + hourData.w; break;
        case 'correct': value = hourData.c; break;
        case 'wrong': value = hourData.w; break;
        case 'time': value = hourData.t; break; // Seconds (raw)
        case 'streak': value = hourData.s; break;
      }
      
      data.push(value);
      total += (currentStatType === 'streak') ? 0 : value;
      if (value > peak) peak = value;
    }
    
    // For streak, total is the max observed in the 24h window
    if (currentStatType === 'streak') {
      total = Math.max(todayData.streak || 0, yesterdayData.streak || 0);
    }
    
  } else if (currentStatsPeriod === 'week') {
    // Show last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const dateKey = getDateString(i);
      const dayData = history[dateKey] || { games: 0, correct: 0, wrong: 0, time: 0, streak: 0 };
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      labels.push(dayNames[date.getDay()]);
      
      let value = 0;
      switch (currentStatType) {
        case 'games': value = dayData.games; break;
        case 'questions': value = dayData.correct + dayData.wrong; break;
        case 'correct': value = dayData.correct; break;
        case 'wrong': value = dayData.wrong; break;
        case 'time': value = dayData.time; break; // Seconds (raw)
        case 'streak': value = dayData.streak; break;
      }
      
      data.push(value);
      total += (currentStatType === 'streak') ? 0 : value;
      if (value > peak) peak = value;
    }
    
    if (currentStatType === 'streak') {
      total = Math.max(...data);
    }
    
  } else if (currentStatsPeriod === 'month') {
    // Show last 30 days (grouped by ~5 day periods)
    const periods = 6;
    const daysPerPeriod = 5;
    
    for (let p = periods - 1; p >= 0; p--) {
      let periodTotal = 0;
      let periodPeak = 0;
      
      for (let d = 0; d < daysPerPeriod; d++) {
        const daysAgo = p * daysPerPeriod + d;
        const dateKey = getDateString(daysAgo);
        const dayData = history[dateKey] || { games: 0, correct: 0, wrong: 0, time: 0, streak: 0 };
        
        let value = 0;
        switch (currentStatType) {
          case 'games': value = dayData.games; break;
          case 'questions': value = dayData.correct + dayData.wrong; break;
          case 'correct': value = dayData.correct; break;
          case 'wrong': value = dayData.wrong; break;
          case 'time': value = dayData.time; break; // Seconds (raw)
          case 'streak': value = dayData.streak; break;
        }
        
        if (currentStatType === 'streak') {
          if (value > periodPeak) periodPeak = value;
        } else {
          periodTotal += value;
        }
      }
      
      const endDaysAgo = p * daysPerPeriod;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - endDaysAgo);
      labels.push(`${endDate.getMonth()+1}/${endDate.getDate()}`);
      
      const val = currentStatType === 'streak' ? periodPeak : periodTotal;
      data.push(val);
      total += (currentStatType === 'streak') ? 0 : val;
      if (val > peak) peak = val;
    }
    
    if (currentStatType === 'streak') {
      total = Math.max(...data);
    }
    
  } else if (currentStatsPeriod === 'year') {
    // Show last 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    
    for (let m = 11; m >= 0; m--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      let monthTotal = 0;
      let monthPeak = 0;
      
      // Sum all days in this month
      Object.keys(history).forEach(dateKey => {
        const date = new Date(dateKey);
        if (date.getMonth() === targetMonth && date.getFullYear() === targetYear) {
          const dayData = history[dateKey];
          
          let value = 0;
          switch (currentStatType) {
            case 'games': value = dayData.games || 0; break;
            case 'questions': value = (dayData.correct || 0) + (dayData.wrong || 0); break;
            case 'correct': value = dayData.correct || 0; break;
            case 'wrong': value = dayData.wrong || 0; break;
            case 'time': value = dayData.time || 0; break; // Seconds (raw)
            case 'streak': value = dayData.streak || 0; break;
          }
          
          if (currentStatType === 'streak') {
            if (value > monthPeak) monthPeak = value;
          } else {
            monthTotal += value;
          }
        }
      });
      
      labels.push(monthNames[targetMonth]);
      const val = currentStatType === 'streak' ? monthPeak : monthTotal;
      data.push(val);
      total += (currentStatType === 'streak') ? 0 : val;
      if (val > peak) peak = val;
    }
    
    if (currentStatType === 'streak') {
      total = Math.max(...data);
    }
    
  } else if (currentStatsPeriod === 'all') {
    // Show all time data grouped by month
    const allDates = Object.keys(history).sort();
    
    if (allDates.length === 0) {
      labels = ['No Data'];
      data = [0];
    } else {
      const monthlyData = {};
      
      allDates.forEach(dateKey => {
        const date = new Date(dateKey);
        const monthKey = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, peak: 0 };
        }
        
        const dayData = history[dateKey];
        let value = 0;
        switch (currentStatType) {
          case 'games': value = dayData.games || 0; break;
          case 'questions': value = (dayData.correct || 0) + (dayData.wrong || 0); break;
          case 'correct': value = dayData.correct || 0; break;
          case 'wrong': value = dayData.wrong || 0; break;
          case 'time': value = dayData.time || 0; break; // Seconds (raw)
          case 'streak': value = dayData.streak || 0; break;
        }
        
        if (currentStatType === 'streak') {
          if (value > monthlyData[monthKey].peak) {
            monthlyData[monthKey].peak = value;
          }
        } else {
          monthlyData[monthKey].total += value;
        }
      });
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const sortedMonths = Object.keys(monthlyData).sort();
      
      sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        labels.push(`${monthNames[parseInt(month)-1]} '${year.slice(2)}`);
        
        const val = currentStatType === 'streak' ? monthlyData[monthKey].peak : monthlyData[monthKey].total;
        data.push(val);
        total += (currentStatType === 'streak') ? 0 : val;
        if (val > peak) peak = val;
      });
      
      if (currentStatType === 'streak') {
        total = Math.max(...data, 0);
      }
    }
  }
  
  // Check if all data is zero
  const hasData = data.some(v => v > 0);
  
  // Show/hide empty state
  if (emptyEl) {
    emptyEl.classList.toggle('hidden', hasData);
  }
  canvas.style.display = hasData ? 'block' : 'none';
  
  // Update summary cards
  const avg = data.length > 0 ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;
  
  const peakEl = document.getElementById('stats-peak-value');
  const avgEl = document.getElementById('stats-avg-value');
  const totalEl = document.getElementById('stats-total-value');
  
  // Determine time unit based on max value (for chart Y-axis)
  // maxSeconds is the max value in seconds
  const maxSeconds = Math.max(...data, 0);
  let timeUnit = 'seconds'; // 's', 'm', or 'h'
  if (currentStatType === 'time') {
    if (maxSeconds >= 3600) {
      timeUnit = 'hours';
    } else if (maxSeconds >= 60) {
      timeUnit = 'minutes';
    }
  }
  
  // Format values for summary cards (smart formatting)
  const formatValue = (val) => {
    if (currentStatType === 'time') {
      // val is in seconds
      if (val < 60) {
        // Show seconds
        return `${Math.round(val)}s`;
      } else if (val < 3600) {
        // Show minutes and seconds (e.g., "1m 30s" or "5m")
        const mins = Math.floor(val / 60);
        const secs = Math.round(val % 60);
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
      } else {
        // Hours - smart decimal formatting
        const hours = val / 3600;
        if (hours >= 10000) {
          // 10k+ hours: no decimal
          return `${Math.round(hours)}h`;
        } else {
          // 1-9999 hours: 1 decimal place
          return `${hours.toFixed(1)}h`;
        }
      }
    }
    return val.toLocaleString();
  };
  
  // Format Y-axis values (auto-convert based on max)
  const formatYAxisValue = (val) => {
    if (currentStatType !== 'time') return val;
    
    // Convert based on determined unit
    if (timeUnit === 'hours') {
      return (val / 3600).toFixed(1);
    } else if (timeUnit === 'minutes') {
      return Math.round(val / 60);
    }
    return val; // seconds
  };
  
  // Get Y-axis unit suffix
  const getYAxisSuffix = () => {
    if (currentStatType !== 'time') return '';
    if (timeUnit === 'hours') return 'h';
    if (timeUnit === 'minutes') return 'm';
    return 's';
  };
  
  if (peakEl) peakEl.textContent = formatValue(peak);
  if (avgEl) avgEl.textContent = formatValue(avg);
  if (totalEl) totalEl.textContent = formatValue(total);
  
  // Destroy existing chart
  if (statsChart) {
    statsChart.destroy();
  }
  
  if (!hasData) return;
  
  // Get chart color based on stat type
  const colors = {
    games: { line: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    questions: { line: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    correct: { line: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    wrong: { line: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    time: { line: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    streak: { line: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' }
  };
  
  const color = colors[currentStatType] || colors.games;
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, color.bg.replace('0.1', '0.3'));
  gradient.addColorStop(1, color.bg.replace('0.1', '0'));
  
  // Create chart
  statsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        borderColor: color.line,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: color.line,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#fff',
          bodyColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: color.line,
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => {
              const statNames = {
                games: 'Games Played',
                questions: 'Questions Answered',
                correct: 'Correct Answers',
                wrong: 'Wrong Answers',
                time: 'Time Played',
                streak: 'Best Streak'
              };
              return `${statNames[currentStatType]}: ${formatValue(item.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 10 },
            maxRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 10 },
            callback: function(value) {
              if (currentStatType === 'time') {
                if (timeUnit === 'hours') {
                  // Always 1 decimal for hours
                  return (value / 3600).toFixed(1) + 'h';
                } else if (timeUnit === 'minutes') {
                  // Show decimal minutes if max < 5 min, otherwise whole
                  const mins = value / 60;
                  if (maxSeconds < 300) {
                    return mins.toFixed(1) + 'm';
                  }
                  return Math.round(mins) + 'm';
                }
                // Seconds - whole numbers
                return Math.round(value) + 's';
              }
              return value;
            }
          }
        }
      }
    }
  });
}

// Update global level badge display
function updateGlobalLevelBadge() {
  const levelNumber = document.getElementById('global-level-number');
  const levelRing = document.getElementById('level-ring');
  const profileLevelNumber = document.getElementById('profile-level-number');
  const profileLevelRing = document.getElementById('profile-level-ring');
  
  // Use P-XP (Prestige) level for the global badge
  const pxpProgress = getPxpProgress();
  const level = pxpProgress.level;
  
  if (levelNumber) {
    levelNumber.textContent = level;
  }
  
  // Also update profile level badge
  if (profileLevelNumber) {
    profileLevelNumber.textContent = level;
  }
  
  // Calculate P-XP progress for the rings
  const progress = pxpProgress.progress / 100;
  const circumference = 2 * Math.PI * 22;
  const offset = circumference * (1 - progress);
  
  if (levelRing) {
    levelRing.style.strokeDashoffset = offset;
  }
  
  // Also update profile level ring
  if (profileLevelRing) {
    profileLevelRing.style.strokeDashoffset = offset;
  }
}

// Update Quanta display
function updateQuantaDisplay() {
  const quantaAmount = document.getElementById('quanta-amount');
  if (quantaAmount) {
    quantaAmount.textContent = userData.quanta || 0;
  }
}

// Initialize Quanta in userData if not exists
if (!userData.quanta) {
  userData.quanta = 0;
}

// Initialize Prestige (P-XP) in userData if not exists
if (!userData.prestige) {
  userData.prestige = {
    level: 1,
    pxp: 0,
    totalPxp: 0,
    history: {}
  };
}

// Initialize Achievements in userData if not exists
if (!userData.achievements) {
  userData.achievements = {
    unlocked: [],      // Claimed achievements: [{id, date, pxpReward, quantaReward}]
    pending: [],       // Unlocked but not claimed: [{id, date}]
    history: {}        // For chart: { "YYYY-MM-DD": { pxp: X, quanta: Y } }
  };
}

// ========================================
// 🏆 ACHIEVEMENTS SYSTEM
// ========================================

// Achievement definitions for House 1 - Path of Progression
const ACHIEVEMENTS = {
  // ═══════════════════════════════════════════════════════════
  // PILLAR 1: ASCENDING LEVELS (Prestige Levels)
  // Symbol: Vertical diamond ladder / rising stair glyph
  // Theme: Endless ascent, skybreaking milestones
  // ═══════════════════════════════════════════════════════════
  'prestige-level-2': {
    id: 'prestige-level-2',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Initiate of Ascent',
    description: 'Reach Level 2',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 2,
    pxpReward: 20,
    quantaReward: 50
  },
  'prestige-level-5': {
    id: 'prestige-level-5',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Bearer of Steps',
    description: 'Reach Level 5',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 5,
    pxpReward: 50,
    quantaReward: 100
  },
  'prestige-level-10': {
    id: 'prestige-level-10',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Rising One',
    description: 'Reach Level 10',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 10,
    pxpReward: 100,
    quantaReward: 250
  },
  'prestige-level-20': {
    id: 'prestige-level-20',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Pathwalker',
    description: 'Reach Level 20',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 20,
    pxpReward: 200,
    quantaReward: 500
  },
  'prestige-level-30': {
    id: 'prestige-level-30',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Summit Seeker',
    description: 'Reach Level 30',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 30,
    pxpReward: 300,
    quantaReward: 750
  },
  'prestige-level-40': {
    id: 'prestige-level-40',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Crestbearer',
    description: 'Reach Level 40',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 40,
    pxpReward: 400,
    quantaReward: 1000
  },
  'prestige-level-50': {
    id: 'prestige-level-50',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Pinnacle Reacher',
    description: 'Reach Level 50',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 50,
    pxpReward: 500,
    quantaReward: 1250
  },
  'prestige-level-75': {
    id: 'prestige-level-75',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Peak of Seventy-Five',
    description: 'Reach Level 75',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 75,
    pxpReward: 750,
    quantaReward: 2000
  },
  'prestige-level-100': {
    id: 'prestige-level-100',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Zenith Ascended',
    description: 'Reach Level 100',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 100,
    pxpReward: 1000,
    quantaReward: 3000
  },
  'prestige-level-250': {
    id: 'prestige-level-250',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Ascendant of Two Hundred Fifty',
    description: 'Reach Level 250',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 250,
    pxpReward: 2500,
    quantaReward: 7500
  },
  'prestige-level-500': {
    id: 'prestige-level-500',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Bearer of Five Hundred Steps',
    description: 'Reach Level 500',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 500,
    pxpReward: 5000,
    quantaReward: 15000
  },
  'prestige-level-1000': {
    id: 'prestige-level-1000',
    house: 'progression',
    pillar: 'ascending-levels',
    name: 'Thousandfold Apex',
    description: 'Reach Level 1000',
    icon: '🔷',
    condition: () => userData.prestige?.level >= 1000,
    pxpReward: 10000,
    quantaReward: 50000
  },
  
  // ═══════════════════════════════════════════════════════════
  // PILLAR 2: GAMES COMPLETED
  // Symbol: Pathway / footstep glyph
  // Theme: Walk the path through relentless play
  // ═══════════════════════════════════════════════════════════
  
  // TIER 1 — EARLY MOTION
  'games-10': {
    id: 'games-10',
    house: 'progression',
    pillar: 'games-completed',
    name: 'First Footfalls',
    description: 'Complete 10 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 10,
    pxpReward: 15,
    quantaReward: 30
  },
  'games-25': {
    id: 'games-25',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Emerging Rhythm',
    description: 'Complete 25 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 25,
    pxpReward: 30,
    quantaReward: 60
  },
  'games-50': {
    id: 'games-50',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Pulse of Persistence',
    description: 'Complete 50 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 50,
    pxpReward: 50,
    quantaReward: 100
  },
  
  // TIER 2 — THE STEADY PATH
  'games-100': {
    id: 'games-100',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Keeper of Momentum',
    description: 'Complete 100 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 100,
    pxpReward: 100,
    quantaReward: 200
  },
  'games-200': {
    id: 'games-200',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Flowbound',
    description: 'Complete 200 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 200,
    pxpReward: 200,
    quantaReward: 400
  },
  'games-500': {
    id: 'games-500',
    house: 'progression',
    pillar: 'games-completed',
    name: 'The Unbroken March',
    description: 'Complete 500 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 500,
    pxpReward: 500,
    quantaReward: 1000
  },
  
  // TIER 3 — DEVOTION PHASE
  'games-1000': {
    id: 'games-1000',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Bearer of Continuance',
    description: 'Complete 1,000 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 1000,
    pxpReward: 1000,
    quantaReward: 2500
  },
  'games-3000': {
    id: 'games-3000',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Spirit of Repetition',
    description: 'Complete 3,000 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 3000,
    pxpReward: 3000,
    quantaReward: 7500
  },
  'games-5000': {
    id: 'games-5000',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Enduring Pulse',
    description: 'Complete 5,000 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 5000,
    pxpReward: 5000,
    quantaReward: 12500
  },
  
  // TIER 4 — MYTHIC PROGRESSION
  'games-10000': {
    id: 'games-10000',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Echo of Ten Thousand Steps',
    description: 'Complete 10,000 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 10000,
    pxpReward: 10000,
    quantaReward: 25000
  },
  'games-50000': {
    id: 'games-50000',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Will of the Enduring',
    description: 'Complete 50,000 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 50000,
    pxpReward: 50000,
    quantaReward: 125000
  },
  'games-100000': {
    id: 'games-100000',
    house: 'progression',
    pillar: 'games-completed',
    name: 'Eternal Pathbearer',
    description: 'Complete 100,000 games',
    icon: '👣',
    condition: () => userData.stats?.totalGames >= 100000,
    pxpReward: 100000,
    quantaReward: 500000
  },
  
  // ═══════════════════════════════════════════════════════════
  // PILLAR 3: TOTAL QUESTIONS ANSWERED
  // Symbol: Radiant orb / spark of knowledge (◉)
  // Theme: Expand your mind through accumulated knowledge
  // ═══════════════════════════════════════════════════════════
  
  // TIER 1 — THE FIRST KNOWINGS
  'questions-100': {
    id: 'questions-100',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'First Fragments',
    description: 'Answer 100 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 100,
    pxpReward: 10,
    quantaReward: 25
  },
  'questions-250': {
    id: 'questions-250',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Gatherer of Thoughts',
    description: 'Answer 250 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 250,
    pxpReward: 25,
    quantaReward: 50
  },
  'questions-500': {
    id: 'questions-500',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Mind in Motion',
    description: 'Answer 500 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 500,
    pxpReward: 50,
    quantaReward: 100
  },
  'questions-750': {
    id: 'questions-750',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Stirrings of Insight',
    description: 'Answer 750 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 750,
    pxpReward: 75,
    quantaReward: 150
  },
  
  // TIER 2 — FORMING UNDERSTANDING
  'questions-1000': {
    id: 'questions-1000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Weaver of Understanding',
    description: 'Answer 1,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 1000,
    pxpReward: 100,
    quantaReward: 250
  },
  'questions-1500': {
    id: 'questions-1500',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Growing Cognition',
    description: 'Answer 1,500 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 1500,
    pxpReward: 150,
    quantaReward: 375
  },
  'questions-2000': {
    id: 'questions-2000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Emergent Awareness',
    description: 'Answer 2,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 2000,
    pxpReward: 200,
    quantaReward: 500
  },
  'questions-2500': {
    id: 'questions-2500',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Keeper of Recall',
    description: 'Answer 2,500 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 2500,
    pxpReward: 250,
    quantaReward: 625
  },
  
  // TIER 3 — SHAPING THOUGHT
  'questions-3500': {
    id: 'questions-3500',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Seeker of Patterns',
    description: 'Answer 3,500 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 3500,
    pxpReward: 350,
    quantaReward: 875
  },
  'questions-5000': {
    id: 'questions-5000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Harvester of Truths',
    description: 'Answer 5,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 5000,
    pxpReward: 500,
    quantaReward: 1250
  },
  'questions-7500': {
    id: 'questions-7500',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Scribe of Memory',
    description: 'Answer 7,500 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 7500,
    pxpReward: 750,
    quantaReward: 1875
  },
  'questions-10000': {
    id: 'questions-10000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Voice of Reason',
    description: 'Answer 10,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 10000,
    pxpReward: 1000,
    quantaReward: 2500
  },
  
  // TIER 4 — EXPANDING INSIGHT
  'questions-15000': {
    id: 'questions-15000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Silent Scholar',
    description: 'Answer 15,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 15000,
    pxpReward: 1500,
    quantaReward: 3750
  },
  'questions-20000': {
    id: 'questions-20000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Bearer of Meaning',
    description: 'Answer 20,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 20000,
    pxpReward: 2000,
    quantaReward: 5000
  },
  'questions-25000': {
    id: 'questions-25000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Architect of Wisdom',
    description: 'Answer 25,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 25000,
    pxpReward: 2500,
    quantaReward: 6250
  },
  'questions-30000': {
    id: 'questions-30000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Keeper of Countless Questions',
    description: 'Answer 30,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 30000,
    pxpReward: 3000,
    quantaReward: 7500
  },
  
  // TIER 5 — THE DEEP MIND
  'questions-40000': {
    id: 'questions-40000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'The Endless Mind',
    description: 'Answer 40,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 40000,
    pxpReward: 4000,
    quantaReward: 10000
  },
  'questions-50000': {
    id: 'questions-50000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Truthbound',
    description: 'Answer 50,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 50000,
    pxpReward: 5000,
    quantaReward: 12500
  },
  'questions-60000': {
    id: 'questions-60000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Crown of Knowing',
    description: 'Answer 60,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 60000,
    pxpReward: 6000,
    quantaReward: 15000
  },
  'questions-75000': {
    id: 'questions-75000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'The Reflective One',
    description: 'Answer 75,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 75000,
    pxpReward: 7500,
    quantaReward: 18750
  },
  
  // TIER 6 — COSMIC INTELLECT
  'questions-100000': {
    id: 'questions-100000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Bearer of the Infinite Query',
    description: 'Answer 100,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 100000,
    pxpReward: 10000,
    quantaReward: 25000
  },
  'questions-150000': {
    id: 'questions-150000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Mind Beyond Measure',
    description: 'Answer 150,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 150000,
    pxpReward: 15000,
    quantaReward: 37500
  },
  'questions-200000': {
    id: 'questions-200000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Eternal Comprehension',
    description: 'Answer 200,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 200000,
    pxpReward: 20000,
    quantaReward: 50000
  },
  'questions-250000': {
    id: 'questions-250000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'The Thoughtborne Ascendant',
    description: 'Answer 250,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 250000,
    pxpReward: 25000,
    quantaReward: 62500
  },
  
  // TIER 7 — TRANSCENDENT INTELLIGENCE (Mythic)
  'questions-500000': {
    id: 'questions-500000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'The Vastness Within',
    description: 'Answer 500,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 500000,
    pxpReward: 50000,
    quantaReward: 125000
  },
  'questions-1000000': {
    id: 'questions-1000000',
    house: 'progression',
    pillar: 'questions-answered',
    name: 'Crown of the Million',
    description: 'Answer 1,000,000 questions',
    icon: '◉',
    condition: () => userData.stats?.correctAnswers >= 1000000,
    pxpReward: 100000,
    quantaReward: 500000
  },
  
  // ═══════════════════════════════════════════════════════════
  // PILLAR 4: TOPIC ENTRY PROGRESSION
  // Symbol: Rising flame / subject sigil (🔥)
  // Theme: Advance within a single subject toward deep specialization
  // ═══════════════════════════════════════════════════════════
  
  // TIER 1 — FOUNDATIONAL TOPIC GROWTH
  'topic-level-2': {
    id: 'topic-level-2',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Dawn of Understanding',
    description: 'Reach Level 2 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 2,
    pxpReward: 10,
    quantaReward: 25
  },
  'topic-level-5': {
    id: 'topic-level-5',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'First Touch of Knowledge',
    description: 'Reach Level 5 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 5,
    pxpReward: 25,
    quantaReward: 50
  },
  'topic-level-10': {
    id: 'topic-level-10',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Opening of the Subject Path',
    description: 'Reach Level 10 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 10,
    pxpReward: 50,
    quantaReward: 125
  },
  
  // TIER 2 — RISING SUBJECT STUDY
  'topic-level-20': {
    id: 'topic-level-20',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Steps Toward Mastery',
    description: 'Reach Level 20 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 20,
    pxpReward: 100,
    quantaReward: 250
  },
  'topic-level-30': {
    id: 'topic-level-30',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Binder of Core Concepts',
    description: 'Reach Level 30 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 30,
    pxpReward: 150,
    quantaReward: 375
  },
  'topic-level-40': {
    id: 'topic-level-40',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Emerging Subject Practitioner',
    description: 'Reach Level 40 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 40,
    pxpReward: 200,
    quantaReward: 500
  },
  'topic-level-50': {
    id: 'topic-level-50',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'The Subject Initiate',
    description: 'Reach Level 50 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 50,
    pxpReward: 250,
    quantaReward: 625
  },
  
  // TIER 3 — ADVANCED SUBJECT PROFICIENCY
  'topic-level-75': {
    id: 'topic-level-75',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Scholar of Focused Study',
    description: 'Reach Level 75 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 75,
    pxpReward: 500,
    quantaReward: 1250
  },
  'topic-level-100': {
    id: 'topic-level-100',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Adept of the Discipline',
    description: 'Reach Level 100 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 100,
    pxpReward: 1000,
    quantaReward: 2500
  },
  
  // TIER 4 — GRAND SUBJECT MASTERY
  'topic-level-250': {
    id: 'topic-level-250',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'Keeper of the Subject Flame',
    description: 'Reach Level 250 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 250,
    pxpReward: 2500,
    quantaReward: 6250
  },
  'topic-level-500': {
    id: 'topic-level-500',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'The Inner Depthwalker',
    description: 'Reach Level 500 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 500,
    pxpReward: 5000,
    quantaReward: 12500
  },
  'topic-level-1000': {
    id: 'topic-level-1000',
    house: 'progression',
    pillar: 'topic-progression',
    name: 'The Apex Subject Sage',
    description: 'Reach Level 1000 in any topic',
    icon: '🔥',
    condition: () => getHighestTopicLevel() >= 1000,
    pxpReward: 10000,
    quantaReward: 50000
  },
  
  // ═══════════════════════════════════════════════════════════
  // PILLAR 5: THE PATH OF THE FLAWED MIND
  // Symbol: Fractured circle / cracked gem (💔)
  // Theme: Wisdom shapes itself through misjudgment and correction
  // ═══════════════════════════════════════════════════════════
  
  // TIER 1 — THE FIRST FRACTURES
  'wrong-100': {
    id: 'wrong-100',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Echoes of Error',
    description: 'Give 100 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 100,
    pxpReward: 10,
    quantaReward: 25
  },
  'wrong-250': {
    id: 'wrong-250',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Seeds of Imperfection',
    description: 'Give 250 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 250,
    pxpReward: 25,
    quantaReward: 50
  },
  'wrong-500': {
    id: 'wrong-500',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Steps Into Uncertainty',
    description: 'Give 500 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 500,
    pxpReward: 50,
    quantaReward: 100
  },
  'wrong-750': {
    id: 'wrong-750',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Lessons in Misjudgment',
    description: 'Give 750 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 750,
    pxpReward: 75,
    quantaReward: 150
  },
  
  // TIER 2 — THE EARLY SHAPING
  'wrong-1000': {
    id: 'wrong-1000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Bearer of Flawed Attempts',
    description: 'Give 1,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 1000,
    pxpReward: 100,
    quantaReward: 250
  },
  'wrong-1500': {
    id: 'wrong-1500',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Contours of Correction',
    description: 'Give 1,500 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 1500,
    pxpReward: 150,
    quantaReward: 375
  },
  'wrong-2000': {
    id: 'wrong-2000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Mind Shaped by Mistakes',
    description: 'Give 2,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 2000,
    pxpReward: 200,
    quantaReward: 500
  },
  'wrong-2500': {
    id: 'wrong-2500',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Keeper of Missteps',
    description: 'Give 2,500 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 2500,
    pxpReward: 250,
    quantaReward: 625
  },
  
  // TIER 3 — THE ART OF ERROR
  'wrong-3500': {
    id: 'wrong-3500',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Seeker of Better Ways',
    description: 'Give 3,500 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 3500,
    pxpReward: 350,
    quantaReward: 875
  },
  'wrong-5000': {
    id: 'wrong-5000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Refiner of Flaws',
    description: 'Give 5,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 5000,
    pxpReward: 500,
    quantaReward: 1250
  },
  'wrong-7500': {
    id: 'wrong-7500',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Scribe of Misjudgment',
    description: 'Give 7,500 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 7500,
    pxpReward: 750,
    quantaReward: 1875
  },
  'wrong-10000': {
    id: 'wrong-10000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Voice of Rethinking',
    description: 'Give 10,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 10000,
    pxpReward: 1000,
    quantaReward: 2500
  },
  
  // TIER 4 — REFINEMENT THROUGH FAILING
  'wrong-15000': {
    id: 'wrong-15000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Quiet Collector of Faults',
    description: 'Give 15,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 15000,
    pxpReward: 1500,
    quantaReward: 3750
  },
  'wrong-20000': {
    id: 'wrong-20000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Bearer of Imperfect Truths',
    description: 'Give 20,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 20000,
    pxpReward: 2000,
    quantaReward: 5000
  },
  'wrong-25000': {
    id: 'wrong-25000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Sculptor of Misunderstanding',
    description: 'Give 25,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 25000,
    pxpReward: 2500,
    quantaReward: 6250
  },
  'wrong-30000': {
    id: 'wrong-30000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Keeper of Fallen Answers',
    description: 'Give 30,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 30000,
    pxpReward: 3000,
    quantaReward: 7500
  },
  
  // TIER 5 — THE DEPTH OF ERROR
  'wrong-40000': {
    id: 'wrong-40000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Mind Tempered in Failure',
    description: 'Give 40,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 40000,
    pxpReward: 4000,
    quantaReward: 10000
  },
  'wrong-50000': {
    id: 'wrong-50000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Bound to Improvement',
    description: 'Give 50,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 50000,
    pxpReward: 5000,
    quantaReward: 12500
  },
  'wrong-60000': {
    id: 'wrong-60000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Crown of Correction',
    description: 'Give 60,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 60000,
    pxpReward: 6000,
    quantaReward: 15000
  },
  'wrong-75000': {
    id: 'wrong-75000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'The Thoughtful Contrarian',
    description: 'Give 75,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 75000,
    pxpReward: 7500,
    quantaReward: 18750
  },
  
  // TIER 6 — DEPTHS OF THE FALLIBLE MIND
  'wrong-100000': {
    id: 'wrong-100000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Bearer of the Unlearned Paths',
    description: 'Give 100,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 100000,
    pxpReward: 10000,
    quantaReward: 25000
  },
  'wrong-150000': {
    id: 'wrong-150000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Mind Shaped by Shadows',
    description: 'Give 150,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 150000,
    pxpReward: 15000,
    quantaReward: 37500
  },
  'wrong-200000': {
    id: 'wrong-200000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Understanding Through Error',
    description: 'Give 200,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 200000,
    pxpReward: 20000,
    quantaReward: 50000
  },
  'wrong-250000': {
    id: 'wrong-250000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'The Crimson Insight',
    description: 'Give 250,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 250000,
    pxpReward: 25000,
    quantaReward: 62500
  },
  
  // TIER 7 — TRANSCENDENCE OF IMPERFECTION (Mythic)
  'wrong-500000': {
    id: 'wrong-500000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'The Vast Lesson',
    description: 'Give 500,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 500000,
    pxpReward: 50000,
    quantaReward: 125000
  },
  'wrong-1000000': {
    id: 'wrong-1000000',
    house: 'progression',
    pillar: 'flawed-mind',
    name: 'Sage of Imperfection',
    description: 'Give 1,000,000 wrong answers',
    icon: '💔',
    condition: () => userData.stats?.wrongAnswers >= 1000000,
    pxpReward: 100000,
    quantaReward: 500000
  },
  
  // ═══════════════════════════════════════════════════════════
  // PILLAR 6: THE PATH OF TIMELESS DEVOTION
  // Symbol: Soft glowing clock / sun arc (⏳)
  // Theme: Presence, endurance, and slow shaping of mastery through time
  // ═══════════════════════════════════════════════════════════
  
  // TIER 1 — FIRST MOMENTS OF PRESENCE
  'time-1min': {
    id: 'time-1min',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Whisper of Beginnings',
    description: 'Play for 1 minute',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 60,
    pxpReward: 5,
    quantaReward: 10
  },
  'time-5min': {
    id: 'time-5min',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Stirring of Intent',
    description: 'Play for 5 minutes',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 300,
    pxpReward: 10,
    quantaReward: 25
  },
  'time-30min': {
    id: 'time-30min',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Growing Presence',
    description: 'Play for 30 minutes',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 1800,
    pxpReward: 25,
    quantaReward: 50
  },
  'time-1hr': {
    id: 'time-1hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Settling Into the Journey',
    description: 'Play for 1 hour',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 3600,
    pxpReward: 50,
    quantaReward: 100
  },
  
  // TIER 2 — HOURS OF FOUNDATION
  'time-10hr': {
    id: 'time-10hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Footsteps in Time',
    description: 'Play for 10 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 36000,
    pxpReward: 100,
    quantaReward: 250
  },
  'time-25hr': {
    id: 'time-25hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Bearer of Steady Hours',
    description: 'Play for 25 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 90000,
    pxpReward: 250,
    quantaReward: 625
  },
  'time-50hr': {
    id: 'time-50hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'The Rising Continuum',
    description: 'Play for 50 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 180000,
    pxpReward: 500,
    quantaReward: 1250
  },
  
  // TIER 3 — THE GATHERING OF HOURS
  'time-100hr': {
    id: 'time-100hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Keeper of the Long Watch',
    description: 'Play for 100 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 360000,
    pxpReward: 1000,
    quantaReward: 2500
  },
  'time-250hr': {
    id: 'time-250hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Watcher of the Quiet Flow',
    description: 'Play for 250 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 900000,
    pxpReward: 2500,
    quantaReward: 6250
  },
  'time-500hr': {
    id: 'time-500hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Endurant Spirit',
    description: 'Play for 500 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 1800000,
    pxpReward: 5000,
    quantaReward: 12500
  },
  
  // TIER 4 — THE TIME-HONED SELF
  'time-1000hr': {
    id: 'time-1000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Mind Tempered by Hours',
    description: 'Play for 1,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 3600000,
    pxpReward: 10000,
    quantaReward: 25000
  },
  'time-2000hr': {
    id: 'time-2000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Bearer of the Lingering Clock',
    description: 'Play for 2,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 7200000,
    pxpReward: 20000,
    quantaReward: 50000
  },
  
  // TIER 5 — THE LONG ARC OF PRESENCE
  'time-3000hr': {
    id: 'time-3000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Echoes of Endless Practice',
    description: 'Play for 3,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 10800000,
    pxpReward: 30000,
    quantaReward: 75000
  },
  'time-4000hr': {
    id: 'time-4000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Keeper of the Fading Days',
    description: 'Play for 4,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 14400000,
    pxpReward: 40000,
    quantaReward: 100000
  },
  
  // TIER 6 — THE TIMEWOVEN PATH
  'time-5000hr': {
    id: 'time-5000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Walker of Uncounted Moments',
    description: 'Play for 5,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 18000000,
    pxpReward: 50000,
    quantaReward: 125000
  },
  'time-6000hr': {
    id: 'time-6000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'The Enduring Pulse',
    description: 'Play for 6,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 21600000,
    pxpReward: 60000,
    quantaReward: 150000
  },
  'time-7000hr': {
    id: 'time-7000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Sage of Slow Eternity',
    description: 'Play for 7,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 25200000,
    pxpReward: 70000,
    quantaReward: 175000
  },
  
  // TIER 7 — THE TIMELESS ASCENT
  'time-8000hr': {
    id: 'time-8000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Voice of Unbroken Time',
    description: 'Play for 8,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 28800000,
    pxpReward: 80000,
    quantaReward: 200000
  },
  'time-9000hr': {
    id: 'time-9000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Guardian of Waning Suns',
    description: 'Play for 9,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 32400000,
    pxpReward: 90000,
    quantaReward: 225000
  },
  'time-10000hr': {
    id: 'time-10000hr',
    house: 'progression',
    pillar: 'timeless-devotion',
    name: 'Master of the Long Horizon',
    description: 'Play for 10,000 hours',
    icon: '⏳',
    condition: () => userData.stats?.totalTimeSeconds >= 36000000,
    pxpReward: 100000,
    quantaReward: 500000
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUSE 2: PATH OF SKILL — PILLAR 1: ACCURACY FEATS
  // Symbol: Sharp hexagon with target dot
  // Theme: Single-session brilliance → Sustained mastery
  // ═══════════════════════════════════════════════════════════════════════════
  
  // --- TIER 1: SINGLE-SESSION ACCURACY FEATS ---
  'skill-accuracy-80': {
    id: 'skill-accuracy-80',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 1,
    name: 'Sharper Moment',
    description: 'Earn 80%+ accuracy in any quiz',
    icon: '⬡',
    condition: () => {
      const recent = userData.stats?.recentGameAccuracies || [];
      return recent.some(acc => acc >= 80);
    },
    pxpReward: 30,
    quantaReward: 75
  },
  'skill-accuracy-90': {
    id: 'skill-accuracy-90',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 1,
    name: 'Crystal Precision',
    description: 'Earn 90%+ accuracy in any quiz',
    icon: '⬡',
    condition: () => {
      const recent = userData.stats?.recentGameAccuracies || [];
      return recent.some(acc => acc >= 90);
    },
    pxpReward: 60,
    quantaReward: 150
  },
  'skill-accuracy-100': {
    id: 'skill-accuracy-100',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 1,
    name: 'Flawless Strike',
    description: 'Earn 100% accuracy in any quiz',
    icon: '⬡',
    condition: () => {
      const recent = userData.stats?.recentGameAccuracies || [];
      return recent.some(acc => acc === 100);
    },
    pxpReward: 100,
    quantaReward: 300
  },
  
  // --- TIER 2: CONSISTENCY (80% ACCURACY) ---
  'skill-streak-80-5': {
    id: 'skill-streak-80-5',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 2,
    name: 'Rhythm of Accuracy',
    description: 'Maintain 80%+ accuracy for 5 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(80, 5),
    pxpReward: 80,
    quantaReward: 200
  },
  'skill-streak-80-10': {
    id: 'skill-streak-80-10',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 2,
    name: 'Steady-Hand Pattern',
    description: 'Maintain 80%+ accuracy for 10 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(80, 10),
    pxpReward: 150,
    quantaReward: 400
  },
  'skill-streak-80-50': {
    id: 'skill-streak-80-50',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 2,
    name: 'Enduring Alignment',
    description: 'Maintain 80%+ accuracy for 50 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(80, 50),
    pxpReward: 500,
    quantaReward: 1500
  },
  'skill-streak-80-100': {
    id: 'skill-streak-80-100',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 2,
    name: 'Unbroken Calibration',
    description: 'Maintain 80%+ accuracy for 100 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(80, 100),
    pxpReward: 1000,
    quantaReward: 3000
  },
  
  // --- TIER 3: CONSISTENCY (90% ACCURACY) ---
  'skill-streak-90-5': {
    id: 'skill-streak-90-5',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 3,
    name: 'Refined Continuum',
    description: 'Maintain 90%+ accuracy for 5 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(90, 5),
    pxpReward: 120,
    quantaReward: 300
  },
  'skill-streak-90-10': {
    id: 'skill-streak-90-10',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 3,
    name: 'Polished Sequence',
    description: 'Maintain 90%+ accuracy for 10 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(90, 10),
    pxpReward: 250,
    quantaReward: 600
  },
  'skill-streak-90-50': {
    id: 'skill-streak-90-50',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 3,
    name: 'Purity of Motion',
    description: 'Maintain 90%+ accuracy for 50 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(90, 50),
    pxpReward: 750,
    quantaReward: 2000
  },
  'skill-streak-90-100': {
    id: 'skill-streak-90-100',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 3,
    name: 'Precision Ascendant',
    description: 'Maintain 90%+ accuracy for 100 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(90, 100),
    pxpReward: 1500,
    quantaReward: 5000
  },
  
  // --- TIER 4: CONSISTENCY (100% ACCURACY) ---
  'skill-streak-100-5': {
    id: 'skill-streak-100-5',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 4,
    name: 'Faultless Chain',
    description: 'Maintain 100% accuracy for 5 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(100, 5),
    pxpReward: 300,
    quantaReward: 750
  },
  'skill-streak-100-10': {
    id: 'skill-streak-100-10',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 4,
    name: 'Unerring Lineage',
    description: 'Maintain 100% accuracy for 10 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(100, 10),
    pxpReward: 600,
    quantaReward: 1500
  },
  'skill-streak-100-50': {
    id: 'skill-streak-100-50',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 4,
    name: 'Immaculate Cycle',
    description: 'Maintain 100% accuracy for 50 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(100, 50),
    pxpReward: 2000,
    quantaReward: 7500
  },
  'skill-streak-100-100': {
    id: 'skill-streak-100-100',
    house: 'skill',
    pillar: 'accuracy-feats',
    tier: 4,
    name: 'Legend of Perfection',
    description: 'Maintain 100% accuracy for 100 games in a row',
    icon: '⬡',
    condition: () => checkAccuracyStreak(100, 100),
    pxpReward: 5000,
    quantaReward: 20000
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUSE 2: PATH OF SKILL — PILLAR 2: STREAK MASTERY
  // Symbol: Sharp hexagon with rising flame/momentum curve
  // Theme: Momentum sustained becomes mastery
  // ═══════════════════════════════════════════════════════════════════════════
  
  // --- TIER 1: EARLY MOMENTUM ---
  'skill-streak-5': {
    id: 'skill-streak-5',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 1,
    name: 'Spark of Continuity',
    description: 'Achieve a 5-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 5,
    pxpReward: 20,
    quantaReward: 50
  },
  'skill-streak-10': {
    id: 'skill-streak-10',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 1,
    name: 'Thread of Flow',
    description: 'Achieve a 10-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 10,
    pxpReward: 40,
    quantaReward: 100
  },
  'skill-streak-15': {
    id: 'skill-streak-15',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 1,
    name: 'Rising Cadence',
    description: 'Achieve a 15-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 15,
    pxpReward: 60,
    quantaReward: 150
  },
  'skill-streak-20': {
    id: 'skill-streak-20',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 1,
    name: 'Gathering Pace',
    description: 'Achieve a 20-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 20,
    pxpReward: 80,
    quantaReward: 200
  },
  
  // --- TIER 2: SUSTAINED MOMENTUM ---
  'skill-streak-30': {
    id: 'skill-streak-30',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 2,
    name: 'Unwavering Current',
    description: 'Achieve a 30-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 30,
    pxpReward: 120,
    quantaReward: 300
  },
  'skill-streak-40': {
    id: 'skill-streak-40',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 2,
    name: 'The Quiet Surge',
    description: 'Achieve a 40-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 40,
    pxpReward: 200,
    quantaReward: 500
  },
  'skill-streak-50': {
    id: 'skill-streak-50',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 2,
    name: 'Flowbound Mind',
    description: 'Achieve a 50-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 50,
    pxpReward: 300,
    quantaReward: 750
  },
  'skill-streak-60': {
    id: 'skill-streak-60',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 2,
    name: 'The Unbroken Thread',
    description: 'Achieve a 60-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 60,
    pxpReward: 400,
    quantaReward: 1000
  },
  
  // --- TIER 3: MASTERFUL MOMENTUM ---
  'skill-streak-70': {
    id: 'skill-streak-70',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 3,
    name: 'Pulse of Continuance',
    description: 'Achieve a 70-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 70,
    pxpReward: 500,
    quantaReward: 1500
  },
  'skill-streak-80': {
    id: 'skill-streak-80',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 3,
    name: 'The Endless Rise',
    description: 'Achieve an 80-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 80,
    pxpReward: 750,
    quantaReward: 2000
  },
  'skill-streak-90': {
    id: 'skill-streak-90',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 3,
    name: 'Bearer of the Unbroken Path',
    description: 'Achieve a 90-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 90,
    pxpReward: 1000,
    quantaReward: 3000
  },
  'skill-streak-100': {
    id: 'skill-streak-100',
    house: 'skill',
    pillar: 'streak-mastery',
    tier: 3,
    name: 'Crown of Momentum',
    description: 'Achieve a 100-answer streak in any topic',
    icon: '🔥',
    condition: () => (userData.stats?.bestStreak || 0) >= 100,
    pxpReward: 2000,
    quantaReward: 5000
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUSE 2: PATH OF SKILL — PILLAR 3: HYBRID ACCURACY & STREAK FEATS
  // Symbol: Sharp hexagon with dual-line motif (accuracy + streak)
  // Theme: A fusion of precision and momentum
  // ═══════════════════════════════════════════════════════════════════════════
  
  // --- TIER 1: 80% ACCURACY HYBRID FEATS ---
  'skill-hybrid-80-10': {
    id: 'skill-hybrid-80-10',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 1,
    name: 'Harmony of Focus',
    description: 'Maintain 80%+ accuracy while achieving a 10-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[80] || 0) >= 10,
    pxpReward: 100,
    quantaReward: 250
  },
  'skill-hybrid-80-20': {
    id: 'skill-hybrid-80-20',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 1,
    name: 'Thread of Clarity',
    description: 'Maintain 80%+ accuracy while achieving a 20-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[80] || 0) >= 20,
    pxpReward: 200,
    quantaReward: 500
  },
  'skill-hybrid-80-40': {
    id: 'skill-hybrid-80-40',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 1,
    name: 'Balance of Mind and Motion',
    description: 'Maintain 80%+ accuracy while achieving a 40-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[80] || 0) >= 40,
    pxpReward: 400,
    quantaReward: 1000
  },
  'skill-hybrid-80-60': {
    id: 'skill-hybrid-80-60',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 1,
    name: 'Bearer of Sharp Consistency',
    description: 'Maintain 80%+ accuracy while achieving a 60-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[80] || 0) >= 60,
    pxpReward: 600,
    quantaReward: 1500
  },
  
  // --- TIER 2: 90% ACCURACY HYBRID FEATS ---
  'skill-hybrid-90-10': {
    id: 'skill-hybrid-90-10',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 2,
    name: 'The Refined Current',
    description: 'Maintain 90%+ accuracy while achieving a 10-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[90] || 0) >= 10,
    pxpReward: 150,
    quantaReward: 400
  },
  'skill-hybrid-90-20': {
    id: 'skill-hybrid-90-20',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 2,
    name: 'Rising Exactitude',
    description: 'Maintain 90%+ accuracy while achieving a 20-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[90] || 0) >= 20,
    pxpReward: 300,
    quantaReward: 750
  },
  'skill-hybrid-90-40': {
    id: 'skill-hybrid-90-40',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 2,
    name: 'Unbroken Purity',
    description: 'Maintain 90%+ accuracy while achieving a 40-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[90] || 0) >= 40,
    pxpReward: 600,
    quantaReward: 1500
  },
  'skill-hybrid-90-60': {
    id: 'skill-hybrid-90-60',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 2,
    name: 'The Precision Flow',
    description: 'Maintain 90%+ accuracy while achieving a 60-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[90] || 0) >= 60,
    pxpReward: 1000,
    quantaReward: 2500
  },
  
  // --- TIER 3: PERFECT ACCURACY HYBRID FEATS ---
  'skill-hybrid-100-10': {
    id: 'skill-hybrid-100-10',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 3,
    name: 'Cycle of Perfection',
    description: 'Maintain 100% accuracy while achieving a 10-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[100] || 0) >= 10,
    pxpReward: 250,
    quantaReward: 600
  },
  'skill-hybrid-100-20': {
    id: 'skill-hybrid-100-20',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 3,
    name: 'Faultless Momentum',
    description: 'Maintain 100% accuracy while achieving a 20-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[100] || 0) >= 20,
    pxpReward: 500,
    quantaReward: 1250
  },
  'skill-hybrid-100-40': {
    id: 'skill-hybrid-100-40',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 3,
    name: 'Mind of the Untouched Path',
    description: 'Maintain 100% accuracy while achieving a 40-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[100] || 0) >= 40,
    pxpReward: 1500,
    quantaReward: 4000
  },
  'skill-hybrid-100-60': {
    id: 'skill-hybrid-100-60',
    house: 'skill',
    pillar: 'hybrid-feats',
    tier: 3,
    name: 'Crown of Unerring Flow',
    description: 'Maintain 100% accuracy while achieving a 60-answer streak',
    icon: '⚡',
    condition: () => (userData.stats?.hybridBestStreaks?.[100] || 0) >= 60,
    pxpReward: 3000,
    quantaReward: 10000
  },

  // =============================================
  // EXPLORATION HOUSE — PATH OF DISCOVERY
  // =============================================
  
  // --- TIER 1: TOPIC DISCOVERY ---
  'exploration-topics-5': {
    id: 'exploration-topics-5',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 1,
    name: "Wanderer's First Step",
    description: 'Play a game in 5 different topics',
    icon: '🧭',
    condition: () => getTopicsPlayedCount() >= 5,
    pxpReward: 50,
    quantaReward: 100
  },
  'exploration-topics-10': {
    id: 'exploration-topics-10',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 1,
    name: 'Curious Mind',
    description: 'Play a game in 10 different topics',
    icon: '🧭',
    condition: () => getTopicsPlayedCount() >= 10,
    pxpReward: 100,
    quantaReward: 200
  },
  'exploration-topics-20': {
    id: 'exploration-topics-20',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 1,
    name: 'Seeker of Horizons',
    description: 'Play a game in 20 different topics',
    icon: '🧭',
    condition: () => getTopicsPlayedCount() >= 20,
    pxpReward: 200,
    quantaReward: 400
  },
  'exploration-topics-30': {
    id: 'exploration-topics-30',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 1,
    name: 'Explorer of Thirty Realms',
    description: 'Play a game in 30 different topics',
    icon: '🧭',
    condition: () => getTopicsPlayedCount() >= 30,
    pxpReward: 400,
    quantaReward: 800
  },

  // --- TIER 2: TOPIC DEEP SAMPLING ---
  'exploration-sampling-5': {
    id: 'exploration-sampling-5',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 2,
    name: 'The First Glimpse',
    description: 'Complete 5 games across 5 different topics',
    icon: '🗺️',
    condition: () => getTopicsWithGamesCount(5) >= 5,
    pxpReward: 75,
    quantaReward: 150
  },
  'exploration-sampling-10': {
    id: 'exploration-sampling-10',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 2,
    name: 'The Surveyor',
    description: 'Complete 10 games across 10 different topics',
    icon: '🗺️',
    condition: () => getTopicsWithGamesCount(10) >= 10,
    pxpReward: 150,
    quantaReward: 300
  },
  'exploration-sampling-20': {
    id: 'exploration-sampling-20',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 2,
    name: 'The Pathfarer',
    description: 'Complete 20 games across 20 different topics',
    icon: '🗺️',
    condition: () => getTopicsWithGamesCount(20) >= 20,
    pxpReward: 300,
    quantaReward: 600
  },
  'exploration-sampling-30': {
    id: 'exploration-sampling-30',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 2,
    name: 'The Widefoot Voyager',
    description: 'Complete 30 games across 30 different topics',
    icon: '🗺️',
    condition: () => getTopicsWithGamesCount(30) >= 30,
    pxpReward: 500,
    quantaReward: 1000
  },

  // --- TIER 3: CATEGORY DISCOVERY (Capstone) ---
  'exploration-all-categories': {
    id: 'exploration-all-categories',
    house: 'exploration',
    pillar: 'path-of-discovery',
    tier: 3,
    name: 'Touch of Realms',
    description: 'Play a game in one topic from each major category',
    icon: '🌍',
    condition: () => hasPlayedAllCategories(),
    pxpReward: 1000,
    quantaReward: 2500
  }
};

// Helper function to get count of unique topics played
function getTopicsPlayedCount() {
  if (!userData.stats?.topics) return 0;
  return Object.keys(userData.stats.topics).filter(topicId => {
    const topic = userData.stats.topics[topicId];
    return topic && topic.games > 0;
  }).length;
}

// Helper function to count topics with at least N games
function getTopicsWithGamesCount(minGames) {
  if (!userData.stats?.topics) return 0;
  return Object.keys(userData.stats.topics).filter(topicId => {
    const topic = userData.stats.topics[topicId];
    return topic && topic.games >= minGames;
  }).length;
}

// Helper function to check if player has played in all major categories
function hasPlayedAllCategories() {
  const allCategories = ['geography', 'football', 'history', 'movies', 'tv-shows', 'logos'];
  const playedCategories = new Set();
  
  if (!userData.stats?.topics) return false;
  
  Object.keys(userData.stats.topics).forEach(topicId => {
    const topic = userData.stats.topics[topicId];
    if (topic && topic.games > 0) {
      const config = TOPIC_CONFIG[topicId];
      if (config && config.category) {
        playedCategories.add(config.category);
      }
    }
  });
  
  return allCategories.every(cat => playedCategories.has(cat));
}

// Helper function to check accuracy streak (last N games all >= threshold)
function checkAccuracyStreak(threshold, count) {
  const recent = userData.stats?.recentGameAccuracies || [];
  if (recent.length < count) return false;
  
  // Check the last 'count' games
  const lastN = recent.slice(-count);
  return lastN.every(acc => acc >= threshold);
}

// Check if an achievement is unlocked (pending or claimed)
function isAchievementUnlocked(achievementId) {
  return userData.achievements.unlocked.some(a => a.id === achievementId) ||
         userData.achievements.pending.some(a => a.id === achievementId);
}

// Check if an achievement is claimed
function isAchievementClaimed(achievementId) {
  return userData.achievements.unlocked.some(a => a.id === achievementId);
}

// Check if an achievement is pending (unlocked but not claimed)
function isAchievementPending(achievementId) {
  return userData.achievements.pending.some(a => a.id === achievementId);
}

// Check achievements and unlock any that meet conditions
function checkAchievements() {
  let newUnlocks = [];
  
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    // Skip if already unlocked or pending
    if (isAchievementUnlocked(id)) continue;
    
    // Check if condition is met
    if (achievement.condition()) {
      // Add to pending
      userData.achievements.pending.push({
        id: id,
        date: new Date().toISOString()
      });
      newUnlocks.push(achievement);
      console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
    }
  }
  
  if (newUnlocks.length > 0) {
    saveUserData();
    // TODO: Trigger Spark animation for each unlock
  }
  
  return newUnlocks;
}

// Claim a pending achievement
function claimAchievement(achievementId) {
  const pendingIndex = userData.achievements.pending.findIndex(a => a.id === achievementId);
  if (pendingIndex === -1) return false;
  
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return false;
  
  // Remove from pending
  const pending = userData.achievements.pending.splice(pendingIndex, 1)[0];
  
  // Add to unlocked with rewards
  userData.achievements.unlocked.push({
    id: achievementId,
    date: pending.date,
    claimedDate: new Date().toISOString(),
    pxpReward: achievement.pxpReward,
    quantaReward: achievement.quantaReward
  });
  
  // Give rewards
  userData.prestige.pxp += achievement.pxpReward;
  userData.prestige.totalPxp += achievement.pxpReward;
  userData.quanta = (userData.quanta || 0) + achievement.quantaReward;
  
  // Record in achievement history for chart
  const now = new Date();
  const today = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
  if (!userData.achievements.history[today]) {
    userData.achievements.history[today] = { pxp: 0, quanta: 0 };
  }
  userData.achievements.history[today].pxp += achievement.pxpReward;
  userData.achievements.history[today].quanta += achievement.quantaReward;
  
  // Check for P-XP level up
  checkPxpLevelUp();
  
  // Save and update displays
  saveUserData();
  updateQuantaDisplay();
  updateGlobalLevelBadge();
  updateAchievementCount();
  
  console.log(`🎁 Achievement Claimed: ${achievement.name} (+${achievement.pxpReward} P-XP, +${achievement.quantaReward} Quanta)`);
  
  return true;
}

// Update achievement count in profile (wrapper)
function updateAchievementCount() {
  updateAchievementCountWithData(getProfileData());
}

// Update achievement count with provided data
function updateAchievementCountWithData(data) {
  const countEl = document.getElementById('profile-achievements-count');
  if (countEl) {
    const claimedCount = data.achievements?.unlocked?.length || 0;
    countEl.textContent = claimedCount;
  }
}

// Update best streak in profile (wrapper)
function updateBestStreakDisplay() {
  updateBestStreakDisplayWithData(getProfileData());
}

// Update best streak with provided data
function updateBestStreakDisplayWithData(data) {
  const streakEl = document.getElementById('profile-best-streak');
  if (streakEl) {
    const bestStreak = data.stats?.bestStreak || 0;
    streakEl.textContent = bestStreak;
  }
}

// Update Topic Progress section (wrapper)
function updateTopicProgress() {
  updateTopicProgressWithData(getProfileData());
}

// Update Topic Progress section - shows top 3 topics by XP
function updateTopicProgressWithData(data) {
  const container = document.getElementById('topic-progress-list');
  if (!container) return;
  
  // Get all topics with their XP data
  const topicsWithXP = [];
  
  if (data.stats?.topics) {
    for (const topicId in data.stats.topics) {
      const topicStats = data.stats.topics[topicId];
      if (topicStats && topicStats.xp > 0) {
        const config = TOPIC_CONFIG[topicId];
        if (config) {
          topicsWithXP.push({
            id: topicId,
            name: config.name,
            icon: config.icon,
            xp: topicStats.xp || 0,
            level: topicStats.level || 1
          });
        }
      }
    }
  }
  
  // Sort by XP (highest first) and take top 3
  topicsWithXP.sort((a, b) => b.xp - a.xp);
  const top3 = topicsWithXP.slice(0, 3);
  
  // If no topics have XP, show placeholder
  if (top3.length === 0) {
    container.innerHTML = `
      <div class="topic-progress-empty">
        <span class="topic-progress-empty-icon">🎮</span>
        <p>Play quizzes to track your progress!</p>
      </div>
    `;
    return;
  }
  
  // Render top 3 topics
  container.innerHTML = top3.map(topic => {
    // Calculate level progress
    const currentLevelXP = topic.level > 1 ? xpNeededForLevel(topic.level - 1) : 0;
    const nextLevelXP = xpNeededForLevel(topic.level);
    const xpInCurrentLevel = topic.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100);
    
    // Get the actual topic image path
    const imagePath = getTopicImagePath(topic.id);
    
    return `
      <div class="topic-progress-item">
        <div class="topic-progress-header">
          <div class="topic-progress-icon-wrap">
            <img class="topic-progress-icon" src="${imagePath}" alt="${topic.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <span class="topic-progress-icon-fallback">${topic.icon}</span>
          </div>
          <span class="topic-progress-name">${topic.name}</span>
        </div>
        <div class="topic-progress-level">Level ${topic.level} → Level ${topic.level + 1}</div>
        <div class="topic-progress-bar-container">
          <div class="topic-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
        <div class="topic-progress-xp">${xpInCurrentLevel.toLocaleString()} / ${xpNeededForNextLevel.toLocaleString()} XP</div>
      </div>
    `;
  }).join('');
}

// Get the highest level achieved in any topic
function getHighestTopicLevel() {
  let highest = 1;
  if (userData.stats?.topics) {
    for (const topicId in userData.stats.topics) {
      const topic = userData.stats.topics[topicId];
      if (topic.level && topic.level > highest) {
        highest = topic.level;
      }
    }
  }
  return highest;
}

// Get achievements for a specific house
function getHouseAchievements(house) {
  return Object.values(ACHIEVEMENTS).filter(a => a.house === house);
}

// ========================================
// 📱 SOCIAL TAB SYSTEM
// ========================================

const SOCIAL_RELEASED = false; // Set to true when Social feature launches

// Open Social teaser modal
function openSocialTeaser() {
  if (SOCIAL_RELEASED) {
    // Future: Navigate to Social feed
    showSocialFeed();
    return;
  }
  
  const socialModal = document.getElementById('social-modal');
  if (socialModal) socialModal.classList.remove('hidden');
}

// Close Social teaser modal
function closeSocialTeaser() {
  const socialModal = document.getElementById('social-modal');
  if (socialModal) socialModal.classList.add('hidden');
}

// Show Social feed (placeholder for future)
function showSocialFeed() {
  clearViewingProfile(); // Clear any viewed profile state
  
  hideAllViewsExcept('social');
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navSocial = document.getElementById('nav-social');
  if (navSocial) navSocial.classList.add('active');
  currentNavIndex = NAV_ORDER.indexOf('social');
}

// Developer: Simulate Social unlock
function devUnlockSocial() {
  // Remove lock badge
  const lockBadge = document.querySelector('.social-lock-badge');
  if (lockBadge) lockBadge.style.display = 'none';
  
  // Show social feed instead of modal
  closeSocialTeaser();
  showSocialFeed();
  
  console.log('🛠️ DEV: Social unlocked');
  alert('Developer Mode: Social feature unlocked (placeholder view)');
}

// ========================================
// 🏛️ ACHIEVEMENTS RITUAL PAGE
// ========================================

// Open the Achievements Ritual page
function openAchievementsRitual() {
  const ritualView = document.getElementById('achievements-ritual-view');
  if (ritualView) {
    ritualView.classList.remove('hidden');
    // Create floating particles
    createRitualParticles();
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }
}

// Close the Achievements Ritual page
function closeAchievementsRitual() {
  const ritualView = document.getElementById('achievements-ritual-view');
  if (ritualView) {
    ritualView.classList.add('hidden');
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  }
}

// Open a specific House sub-page
function openHousePage(house, icon, title) {
  const subpage = document.getElementById('house-subpage');
  const subpageTitle = document.getElementById('house-subpage-title');
  const subpageContent = document.querySelector('.house-subpage-content');
  
  if (subpage && subpageTitle && subpageContent) {
    subpage.setAttribute('data-house', house);
    // Translate the house title
    const translatedTitle = t(`house_${house}`) || title;
    subpageTitle.textContent = translatedTitle;
    
    // Check achievements when opening house
    checkAchievements();
    
    // Generate content based on house
    if (house === 'progression') {
      subpageContent.innerHTML = generateProgressionHouseContent();
    } else if (house === 'skill') {
      subpageContent.innerHTML = generateSkillHouseContent();
    } else if (house === 'exploration') {
      subpageContent.innerHTML = generateExplorationHouseContent();
    } else {
      // Coming soon for other houses
      const comingSoonTitle = t('house_coming_soon') || 'Coming Soon';
      const comingSoonText = t('achievements_house_coming') || 'Achievements for this path are being forged in the cosmic fires. Return soon to claim your destiny.';
      subpageContent.innerHTML = `
        <div class="house-coming-soon-icon">${icon}</div>
        <h3 class="house-coming-soon-title">${comingSoonTitle}</h3>
        <p class="house-coming-soon-text">${comingSoonText}</p>
      `;
    }
    
    subpage.classList.remove('hidden');
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }
}

// Generate House 1 - Path of Progression content
function generateProgressionHouseContent() {
  const achievements = getHouseAchievements('progression');
  
  // Filter achievements by pillar
  const ascendingAchievements = achievements.filter(a => a.pillar === 'ascending-levels');
  const gamesAchievements = achievements.filter(a => a.pillar === 'games-completed');
  const questionsAchievements = achievements.filter(a => a.pillar === 'questions-answered');
  const topicAchievements = achievements.filter(a => a.pillar === 'topic-progression');
  const flawedAchievements = achievements.filter(a => a.pillar === 'flawed-mind');
  
  // Count claimed/pending achievements per pillar
  const ascendingClaimed = ascendingAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const ascendingPending = ascendingAchievements.filter(a => isAchievementPending(a.id)).length;
  const ascendingTotal = ascendingAchievements.length;
  
  const gamesClaimed = gamesAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const gamesPending = gamesAchievements.filter(a => isAchievementPending(a.id)).length;
  const gamesTotal = gamesAchievements.length;
  
  const questionsClaimed = questionsAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const questionsPending = questionsAchievements.filter(a => isAchievementPending(a.id)).length;
  const questionsTotal = questionsAchievements.length;
  
  const topicClaimed = topicAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const topicPending = topicAchievements.filter(a => isAchievementPending(a.id)).length;
  const topicTotal = topicAchievements.length;
  
  const flawedClaimed = flawedAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const flawedPending = flawedAchievements.filter(a => isAchievementPending(a.id)).length;
  const flawedTotal = flawedAchievements.length;
  
  const timeAchievements = achievements.filter(a => a.pillar === 'timeless-devotion');
  const timeClaimed = timeAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const timePending = timeAchievements.filter(a => isAchievementPending(a.id)).length;
  const timeTotal = timeAchievements.length;
  
  let html = `
    <div class="house-progression-content">
      <!-- House Header -->
      <div class="house-header-section">
        <div class="house-icon-large">🔷</div>
        <p class="house-subtitle">${t('house_progression_subtitle') || 'Your journey begins, rises, and becomes.'}</p>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 1: Ascending Levels -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar collapsed" id="pillar-ascending-levels">
        <div class="pillar-header" onclick="togglePillar('ascending-levels')">
          <div class="pillar-header-left">
            <span class="pillar-icon">◆</span>
            <h3 class="pillar-title-text">${getPillarText('ascending_levels') || 'Ascending Levels'}</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${ascendingPending > 0 ? 'has-pending' : ''}">${ascendingClaimed}/${ascendingTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description">${getPillarText('ascending_levels', 'desc') || 'Rise through the Prestige ranks'}</p>
        
        <div class="achievement-ladder pillar-content" id="pillar-content-ascending-levels" style="max-height: 0px;">
  `;
  
  // Add achievement cards for Ascending Levels
  ascendingAchievements.forEach(achievement => {
    html += generateAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 2: Topic Entry Progression -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar collapsed" id="pillar-topic-progression">
        <div class="pillar-header" onclick="togglePillar('topic-progression')">
          <div class="pillar-header-left">
            <span class="pillar-icon">🔥</span>
            <h3 class="pillar-title-text">${getPillarText('topic_entry') || 'Topic Entry Progression'}</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${topicPending > 0 ? 'has-pending' : ''}">${topicClaimed}/${topicTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description">${getPillarText('topic_entry', 'desc') || 'Advance within a subject toward deep specialization.'}</p>
        
        <div class="achievement-ladder pillar-content" id="pillar-content-topic-progression" style="max-height: 0px;">
  `;
  
  // Add achievement cards for Topic Progression
  topicAchievements.forEach(achievement => {
    html += generateAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 3: Games Completed -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar collapsed" id="pillar-games-completed">
        <div class="pillar-header" onclick="togglePillar('games-completed')">
          <div class="pillar-header-left">
            <span class="pillar-icon">👣</span>
            <h3 class="pillar-title-text">${getPillarText('games_completed') || 'Games Completed'}</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${gamesPending > 0 ? 'has-pending' : ''}">${gamesClaimed}/${gamesTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description">${getPillarText('games_completed', 'desc') || 'Walk the path through relentless play.'}</p>
        
        <div class="achievement-ladder pillar-content" id="pillar-content-games-completed" style="max-height: 0px;">
  `;
  
  // Add achievement cards for Games Completed
  gamesAchievements.forEach(achievement => {
    html += generateAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 4: Total Questions Answered -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar collapsed" id="pillar-questions-answered">
        <div class="pillar-header" onclick="togglePillar('questions-answered')">
          <div class="pillar-header-left">
            <span class="pillar-icon">◉</span>
            <h3 class="pillar-title-text">Total Questions Answered</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${questionsPending > 0 ? 'has-pending' : ''}">${questionsClaimed}/${questionsTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description">Expand your mind through accumulated knowledge.</p>
        
        <div class="achievement-ladder pillar-content" id="pillar-content-questions-answered" style="max-height: 0px;">
  `;
  
  // Add achievement cards for Questions Answered
  questionsAchievements.forEach(achievement => {
    html += generateAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 5: The Path of the Flawed Mind -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar collapsed" id="pillar-flawed-mind">
        <div class="pillar-header" onclick="togglePillar('flawed-mind')">
          <div class="pillar-header-left">
            <span class="pillar-icon">💔</span>
            <h3 class="pillar-title-text">${getPillarText('flawed_mind') || 'The Path of the Flawed Mind'}</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${flawedPending > 0 ? 'has-pending' : ''}">${flawedClaimed}/${flawedTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description">${getPillarText('flawed_mind', 'desc') || 'Wisdom shapes itself through misjudgment and correction.'}</p>
        
        <div class="achievement-ladder pillar-content" id="pillar-content-flawed-mind" style="max-height: 0px;">
  `;
  
  // Add achievement cards for Flawed Mind (Wrong Answers)
  flawedAchievements.forEach(achievement => {
    html += generateAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 6: The Path of Timeless Devotion -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar collapsed" id="pillar-timeless-devotion">
        <div class="pillar-header" onclick="togglePillar('timeless-devotion')">
          <div class="pillar-header-left">
            <span class="pillar-icon">⏳</span>
            <h3 class="pillar-title-text">${getPillarText('timeless_devotion') || 'The Path of Timeless Devotion'}</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${timePending > 0 ? 'has-pending' : ''}">${timeClaimed}/${timeTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description">${getPillarText('timeless_devotion', 'desc') || 'Presence, endurance, and the slow shaping of mastery through time.'}</p>
        
        <div class="achievement-ladder pillar-content" id="pillar-content-timeless-devotion" style="max-height: 0px;">
  `;
  
  // Add achievement cards for Timeless Devotion (Time Played)
  timeAchievements.forEach(achievement => {
    html += generateAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
    </div>
  `;
  
  return html;
}

// Generate House 2 - Path of Skill content
function generateSkillHouseContent() {
  const achievements = getHouseAchievements('skill');
  
  // Filter achievements by pillar
  const accuracyAchievements = achievements.filter(a => a.pillar === 'accuracy-feats');
  const streakAchievements = achievements.filter(a => a.pillar === 'streak-mastery');
  const hybridAchievements = achievements.filter(a => a.pillar === 'hybrid-feats');
  
  // Count claimed/pending achievements for Pillar 1
  const accuracyClaimed = accuracyAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const accuracyPending = accuracyAchievements.filter(a => isAchievementPending(a.id)).length;
  const accuracyTotal = accuracyAchievements.length;
  
  // Count claimed/pending achievements for Pillar 2
  const streakClaimed = streakAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const streakPending = streakAchievements.filter(a => isAchievementPending(a.id)).length;
  const streakTotal = streakAchievements.length;
  
  // Count claimed/pending achievements for Pillar 3
  const hybridClaimed = hybridAchievements.filter(a => isAchievementClaimed(a.id)).length;
  const hybridPending = hybridAchievements.filter(a => isAchievementPending(a.id)).length;
  const hybridTotal = hybridAchievements.length;
  
  // Group Pillar 1 by tier
  const accTier1 = accuracyAchievements.filter(a => a.tier === 1);
  const accTier2 = accuracyAchievements.filter(a => a.tier === 2);
  const accTier3 = accuracyAchievements.filter(a => a.tier === 3);
  const accTier4 = accuracyAchievements.filter(a => a.tier === 4);
  
  // Group Pillar 2 by tier
  const streakTier1 = streakAchievements.filter(a => a.tier === 1);
  const streakTier2 = streakAchievements.filter(a => a.tier === 2);
  const streakTier3 = streakAchievements.filter(a => a.tier === 3);
  
  // Group Pillar 3 by tier
  const hybridTier1 = hybridAchievements.filter(a => a.tier === 1);
  const hybridTier2 = hybridAchievements.filter(a => a.tier === 2);
  const hybridTier3 = hybridAchievements.filter(a => a.tier === 3);
  
  let html = `
    <div class="house-skill-content">
      <!-- House Header -->
      <div class="house-header-section skill-header">
        <div class="house-icon-large skill-icon">⬡</div>
        <p class="house-subtitle skill-subtitle">Mastery is forged in precision, consistency, and flawless execution.</p>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 1: Accuracy Feats -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar skill-pillar collapsed" id="pillar-accuracy-feats">
        <div class="pillar-header skill-pillar-header" onclick="togglePillar('accuracy-feats')">
          <div class="pillar-header-left">
            <span class="pillar-icon skill-pillar-icon">⬡</span>
            <h3 class="pillar-title-text">Accuracy Feats</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${accuracyPending > 0 ? 'has-pending' : ''}">${accuracyClaimed}/${accuracyTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description skill-pillar-desc">Single-session brilliance → Sustained mastery</p>
        
        <div class="achievement-ladder pillar-content skill-achievement-ladder" id="pillar-content-accuracy-feats" style="max-height: 0px;">
          
          <!-- TIER 1: Single-Session Accuracy -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Single-Session Accuracy</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 1 Tier 1 achievements
  accTier1.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 2: Consistency (80% Accuracy) -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Consistency (80%)</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 1 Tier 2 achievements
  accTier2.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 3: Consistency (90% Accuracy) -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Consistency (90%)</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 1 Tier 3 achievements
  accTier3.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 4: Consistency (100% Accuracy) -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Consistency (100%)</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 1 Tier 4 achievements
  accTier4.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 2: Streak Mastery -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar skill-pillar collapsed" id="pillar-streak-mastery">
        <div class="pillar-header skill-pillar-header" onclick="togglePillar('streak-mastery')">
          <div class="pillar-header-left">
            <span class="pillar-icon skill-pillar-icon">🔥</span>
            <h3 class="pillar-title-text">Streak Mastery</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${streakPending > 0 ? 'has-pending' : ''}">${streakClaimed}/${streakTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description skill-pillar-desc">Momentum sustained becomes mastery.</p>
        
        <div class="achievement-ladder pillar-content skill-achievement-ladder" id="pillar-content-streak-mastery" style="max-height: 0px;">
          
          <!-- TIER 1: Early Momentum -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Early Momentum</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 2 Tier 1 achievements
  streakTier1.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 2: Sustained Momentum -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Sustained Momentum</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 2 Tier 2 achievements
  streakTier2.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 3: Masterful Momentum -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Masterful Momentum</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 2 Tier 3 achievements
  streakTier3.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PILLAR 3: Hybrid Accuracy & Streak Feats -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="achievement-pillar skill-pillar collapsed" id="pillar-hybrid-feats">
        <div class="pillar-header skill-pillar-header" onclick="togglePillar('hybrid-feats')">
          <div class="pillar-header-left">
            <span class="pillar-icon skill-pillar-icon">⚡</span>
            <h3 class="pillar-title-text">Hybrid Accuracy & Streak</h3>
          </div>
          <div class="pillar-header-right">
            <span class="pillar-count ${hybridPending > 0 ? 'has-pending' : ''}">${hybridClaimed}/${hybridTotal}</span>
            <span class="pillar-arrow">▼</span>
          </div>
        </div>
        <p class="pillar-description skill-pillar-desc">A fusion of precision and momentum.</p>
        
        <div class="achievement-ladder pillar-content skill-achievement-ladder" id="pillar-content-hybrid-feats" style="max-height: 0px;">
          
          <!-- TIER 1: 80% Accuracy Hybrid Feats -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">80% Accuracy Hybrid</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 3 Tier 1 achievements
  hybridTier1.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 2: 90% Accuracy Hybrid Feats -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">90% Accuracy Hybrid</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 3 Tier 2 achievements
  hybridTier2.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 3: Perfect Accuracy Hybrid Feats -->
          <div class="skill-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Perfect Accuracy Hybrid</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Pillar 3 Tier 3 achievements
  hybridTier3.forEach(achievement => {
    html += generateSkillAchievementCard(achievement);
  });
  
  html += `
        </div>
      </div>
    </div>
  `;
  
  return html;
}

// Generate a Skill house achievement card (sharper design)
function generateSkillAchievementCard(achievement) {
  const isPending = isAchievementPending(achievement.id);
  const isClaimed = isAchievementClaimed(achievement.id);
  const isLocked = !isPending && !isClaimed;
  
  let statusClass = isLocked ? 'locked' : (isPending ? 'pending' : 'claimed');
  let statusIcon = isLocked ? '🔒' : (isPending ? '✨' : '✅');
  
  return `
    <div class="achievement-card skill-achievement-card ${statusClass}" data-id="${achievement.id}" onclick="handleAchievementClick('${achievement.id}')">
      <div class="skill-card-glow-line"></div>
      <div class="achievement-icon-wrapper">
        <span class="achievement-status-icon">${statusIcon}</span>
      </div>
      <div class="achievement-info">
        <h4 class="achievement-name">${achievement.name}</h4>
        <p class="achievement-desc">${achievement.description}</p>
        <div class="achievement-rewards">
          <span class="reward-item pxp">+${achievement.pxpReward} P-XP</span>
          <span class="reward-item quanta">+${achievement.quantaReward} ✦</span>
        </div>
      </div>
      ${isPending ? '<div class="claim-indicator">TAP TO CLAIM</div>' : ''}
    </div>
  `;
}

// =============================================
// EXPLORATION HOUSE — PATH OF EXPLORATION
// =============================================
function generateExplorationHouseContent() {
  const achievements = getHouseAchievements('exploration');
  
  // Filter achievements by tier
  const tier1 = achievements.filter(a => a.tier === 1);
  const tier2 = achievements.filter(a => a.tier === 2);
  const tier3 = achievements.filter(a => a.tier === 3);
  
  // Count claimed achievements for progress
  const claimedCount = achievements.filter(a => isAchievementClaimed(a.id)).length;
  const totalCount = achievements.length;
  
  let html = `
    <div class="exploration-house-content">
      <!-- Exploration House Header -->
      <div class="exploration-header">
        <div class="exploration-compass-container">
          <span class="exploration-compass-icon">🧭</span>
          <div class="exploration-compass-glow"></div>
        </div>
        <h2 class="exploration-title">Path of Exploration</h2>
        <p class="exploration-subtitle">Curiosity guides the seeker.</p>
      </div>
      
      <!-- Single Pillar: The Path of Discovery -->
      <div class="achievement-pillar exploration-pillar collapsed" id="pillar-path-of-discovery" onclick="togglePillar('path-of-discovery')">
        <div class="pillar-header">
          <div class="pillar-icon exploration-pillar-icon">🧭</div>
          <div class="pillar-title-group">
            <h3 class="pillar-title">The Path of Discovery</h3>
            <p class="pillar-description">Walk new lands and touch unfamiliar realms.</p>
          </div>
          <div class="pillar-progress">${claimedCount}/${totalCount}</div>
          <div class="pillar-arrow">▼</div>
        </div>
        
        <div class="achievement-ladder pillar-content exploration-achievement-ladder" id="pillar-content-path-of-discovery" style="max-height: 0px;">
          
          <!-- TIER 1: Topic Discovery -->
          <div class="exploration-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Topic Discovery</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Tier 1 achievements
  tier1.forEach(achievement => {
    html += generateExplorationAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 2: Topic Deep Sampling -->
          <div class="exploration-tier-divider">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">Topic Deep Sampling</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Tier 2 achievements
  tier2.forEach(achievement => {
    html += generateExplorationAchievementCard(achievement);
  });
  
  html += `
          <!-- TIER 3: The World-Wide Touch (Capstone) -->
          <div class="exploration-tier-divider capstone-tier">
            <span class="tier-flourish">◂</span>
            <span class="tier-label">The World-Wide Touch</span>
            <span class="tier-flourish">▸</span>
          </div>
  `;
  
  // Add Tier 3 capstone achievement
  tier3.forEach(achievement => {
    html += generateExplorationAchievementCard(achievement, true);
  });
  
  html += `
        </div>
      </div>
    </div>
  `;
  
  return html;
}

// Generate an Exploration house achievement card (softer, airy design)
function generateExplorationAchievementCard(achievement, isCapstone = false) {
  const isPending = isAchievementPending(achievement.id);
  const isClaimed = isAchievementClaimed(achievement.id);
  const isLocked = !isPending && !isClaimed;
  
  let statusClass = isLocked ? 'locked' : (isPending ? 'pending' : 'claimed');
  let statusIcon = isLocked ? '🔒' : (isPending ? '✨' : '✅');
  
  const capstoneClass = isCapstone ? 'capstone-card' : '';
  
  return `
    <div class="achievement-card exploration-achievement-card ${statusClass} ${capstoneClass}" data-id="${achievement.id}" onclick="handleAchievementClick('${achievement.id}')">
      <div class="exploration-card-compass-accent"></div>
      <div class="achievement-icon-wrapper">
        <span class="achievement-status-icon">${statusIcon}</span>
      </div>
      <div class="achievement-info">
        <h4 class="achievement-name">${achievement.name}</h4>
        <p class="achievement-desc">${achievement.description}</p>
        <div class="achievement-rewards">
          <span class="reward-item pxp">+${achievement.pxpReward} P-XP</span>
          <span class="reward-item quanta">+${achievement.quantaReward} ✦</span>
        </div>
      </div>
      ${isPending ? '<div class="claim-indicator">TAP TO CLAIM</div>' : ''}
    </div>
  `;
}

// Helper to get translated achievement text
function getAchievementText(achievementId, type) {
  const key = `ach_${achievementId.replace(/-/g, '_')}_${type}`;
  return t(key) || (type === 'name' ? ACHIEVEMENTS[achievementId]?.name : ACHIEVEMENTS[achievementId]?.description);
}

// Helper to get translated pillar text
function getPillarText(pillarId, type) {
  const key = `pillar_${pillarId.replace(/-/g, '_')}${type === 'desc' ? '_desc' : ''}`;
  return t(key);
}

// Generate a single achievement card HTML
function generateAchievementCard(achievement) {
  const isPending = isAchievementPending(achievement.id);
  const isClaimed = isAchievementClaimed(achievement.id);
  const isLocked = !isPending && !isClaimed;
  
  let statusClass = isLocked ? 'locked' : (isPending ? 'pending' : 'claimed');
  let statusIcon = isLocked ? '🔒' : (isPending ? '✨' : '✅');
  const claimText = t('ach_tap_to_claim') || 'TAP TO CLAIM';
  
  return `
    <div class="achievement-card ${statusClass}" data-id="${achievement.id}" onclick="handleAchievementClick('${achievement.id}')">
      <div class="achievement-icon-wrapper">
        <span class="achievement-status-icon">${statusIcon}</span>
      </div>
      <div class="achievement-info">
        <h4 class="achievement-name">${getAchievementText(achievement.id, 'name')}</h4>
        <p class="achievement-desc">${getAchievementText(achievement.id, 'desc')}</p>
        <div class="achievement-rewards">
          <span class="reward-item pxp">+${achievement.pxpReward} P-XP</span>
          <span class="reward-item quanta">+${achievement.quantaReward} ✦</span>
        </div>
      </div>
      ${isPending ? `<div class="claim-indicator">${claimText}</div>` : ''}
    </div>
  `;
}

// Toggle pillar expansion
function togglePillar(pillarId) {
  const content = document.getElementById(`pillar-content-${pillarId}`);
  const pillar = document.getElementById(`pillar-${pillarId}`);
  
  if (content && pillar) {
    const isCollapsed = pillar.classList.contains('collapsed');
    
    if (isCollapsed) {
      // Expanding - remove collapsed class and let CSS handle the height
      pillar.classList.remove('collapsed');
      content.style.maxHeight = 'none';
    } else {
      // Collapsing - add collapsed class
      pillar.classList.add('collapsed');
      content.style.maxHeight = '0px';
    }
  }
}

// Handle achievement card click
function handleAchievementClick(achievementId) {
  if (isAchievementPending(achievementId)) {
    // Show claim animation
    claimAchievementWithAnimation(achievementId);
  } else if (isAchievementClaimed(achievementId)) {
    // Already claimed - maybe show details
    console.log('Achievement already claimed');
  } else {
    // Locked - show requirement
    const achievement = ACHIEVEMENTS[achievementId];
    if (achievement) {
      console.log(`Locked: ${achievement.description}`);
    }
  }
}

// Claim achievement with animation
function claimAchievementWithAnimation(achievementId) {
  const card = document.querySelector(`.achievement-card[data-id="${achievementId}"]`);
  if (!card) return;
  
  // Add claiming animation class
  card.classList.add('claiming');
  
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([50, 50, 100]);
  }
  
  setTimeout(() => {
    // Actually claim the achievement
    const success = claimAchievement(achievementId);
    
    if (success) {
      // Update the card to show claimed state
      card.classList.remove('pending', 'claiming');
      card.classList.add('claimed');
      
      const statusIcon = card.querySelector('.achievement-status-icon');
      if (statusIcon) statusIcon.textContent = '✅';
      
      const claimIndicator = card.querySelector('.claim-indicator');
      if (claimIndicator) claimIndicator.remove();
      
      // Show reward popup
      showRewardPopup(ACHIEVEMENTS[achievementId]);
    }
  }, 500);
}

// Show reward popup after claiming
function showRewardPopup(achievement) {
  // Create popup element
  const popup = document.createElement('div');
  popup.className = 'achievement-reward-popup';
  popup.innerHTML = `
    <div class="reward-popup-content">
      <div class="reward-popup-icon">🎁</div>
      <h3 class="reward-popup-title">Rewards Claimed!</h3>
      <div class="reward-popup-items">
        <div class="reward-popup-item">
          <span class="reward-amount">+${achievement.pxpReward}</span>
          <span class="reward-label">P-XP</span>
        </div>
        <div class="reward-popup-item">
          <span class="reward-amount">+${achievement.quantaReward}</span>
          <span class="reward-label">Quanta ✦</span>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Animate in
  setTimeout(() => popup.classList.add('visible'), 10);
  
  // Remove after delay
  setTimeout(() => {
    popup.classList.remove('visible');
    setTimeout(() => popup.remove(), 300);
  }, 2000);
}

// Close the House sub-page
function closeHousePage() {
  const subpage = document.getElementById('house-subpage');
  if (subpage) {
    subpage.classList.add('hidden');
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  }
}

// Create floating particles for the ritual page
function createRitualParticles() {
  const container = document.getElementById('ritual-particles');
  if (!container) return;
  
  // Clear existing particles
  container.innerHTML = '';
  
  const particleCount = 20;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'ritual-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (10 + Math.random() * 10) + 's';
    particle.style.opacity = 0.3 + Math.random() * 0.4;
    particle.style.width = (2 + Math.random() * 3) + 'px';
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}

// Run on page load
checkFirstTimeUser();
updateProfileDisplay();
updateAllStatsDisplays();
initRankedSystem();
updateGlobalLevelBadge();
updateQuantaDisplay();

// ============================================
// 📖 GUIDED TUTORIAL SYSTEM
// ============================================

const GUIDED_TUTORIAL_STEPS = [
  // Step 0: Welcome
  {
    type: 'welcome',
    title: 'Welcome to Quizzena! 👋',
    text: 'Let\'s take a quick tour to show you around. This will only take a minute!',
    screen: 'home',
    icon: '🧠'
  },
  // Step 1: Level Badge
  {
    type: 'highlight',
    target: '.level-badge',
    title: 'Your Level',
    text: 'This is your Player Level. It shows your overall mastery in Quizzena. Tap it to see your P-XP progress!',
    screen: 'home',
    position: 'bottom',
    showTap: true,
    tapAction: 'openPxpDashboard'
  },
  // Step 2: Inside P-XP Dashboard
  {
    type: 'highlight',
    target: '.pxp-ring-container',
    title: 'P-XP Dashboard',
    text: 'Here you can see your Prestige XP progress. Earn P-XP by playing games, answering correctly, and claiming achievements!',
    screen: 'pxp-dashboard',
    position: 'bottom',
    showTap: false
  },
  // Step 3: Quanta (navigate back to home first)
  {
    type: 'highlight',
    target: '.quanta-display',
    title: 'Quanta ✦',
    text: 'Quanta is the knowledge currency of Quizzena. Earn it through achievements and spend it on special features (coming soon)!',
    screen: 'home',
    position: 'bottom-left',
    showTap: false,
    navigateTo: 'home-from-pxp'
  },
  // Step 4: Quiz of the Day
  {
    type: 'highlight',
    target: '.qotd-card-compact',
    title: 'Quiz of the Day',
    text: 'Every day brings a new featured quiz! Tap here to discover today\'s challenge and test your knowledge.',
    screen: 'home',
    position: 'bottom',
    showTap: true,
    tapAction: 'none'
  },
  // Step 5: Quick Play Section
  {
    type: 'highlight',
    target: '.quick-play-section',
    title: 'Quick Play',
    text: 'Jump straight into action! Use Random for a surprise quiz, or save your favorites to Slot 1 & Slot 2 for instant access.',
    screen: 'home',
    position: 'top',
    showTap: false
  },
  // Step 6: Explore Section
  {
    type: 'highlight',
    target: '.home-categories-section-compact',
    title: 'Explore Categories',
    text: 'Browse quiz categories here! Tap any category to see all available topics within it.',
    screen: 'home',
    position: 'top',
    showTap: false
  },
  // Step 7: Hot Topics
  {
    type: 'highlight',
    target: '.hot-topics-section',
    title: '🔥 Hot Topics',
    text: 'These are the most popular quizzes right now! Jump into trending topics that other players are enjoying.',
    screen: 'home',
    position: 'top',
    showTap: false
  },
  // Step 8: Navigate to Topics
  {
    type: 'navigate',
    title: 'Topics Library',
    text: 'Let\'s explore all available topics! Here you\'ll find 30+ quizzes across multiple categories.',
    screen: 'topics',
    navigateTo: 'topics'
  },
  // Step 9: Topic Cards
  {
    type: 'highlight',
    target: '.topics-scroll-row .status-active:first-child',
    title: 'Topic Cards',
    text: 'Each card represents a quiz topic. You can see your level progress on each card. Higher levels unlock harder game modes!',
    screen: 'topics',
    position: 'bottom',
    showTap: true,
    tapAction: 'openFirstTopic'
  },
  // Step 10: Mode Selection
  {
    type: 'highlight',
    target: '.topic-detail-screen',
    title: 'Game Modes',
    text: '<b>Casual</b> — Relaxed, no penalties<br><b>Time Attack</b> — Race the clock (Lvl 5)<br><b>3 Hearts</b> — Survival mode (Lvl 10)<br><br>Level up to unlock all modes!',
    screen: 'mode-selection',
    position: 'center',
    showTap: false
  },
  // Step 11: Navigate to REAL profile page
  {
    type: 'navigate',
    title: 'Your Profile',
    text: 'Welcome to your Profile! Here you can track your achievements, stats, and progress.',
    screen: 'profile',
    navigateTo: 'profile'
  },
  // Step 12: Highlight Achievements on REAL profile
  {
    type: 'highlight',
    target: '.feature-card.achievements-card',
    title: 'Achievements',
    text: 'Tap here to view the Achievements Ritual — 8 paths of mastery with unique challenges to complete!',
    screen: 'profile',
    position: 'bottom',
    showTap: true,
    tapAction: 'openAchievements'
  },
  // Step 13: Achievements Ritual Page (14/19) - Uses static achievements page
  {
    type: 'highlight',
    target: '#tutorial-houses-grid',
    title: 'The Eight Paths',
    text: 'Each house represents a different type of achievement: Progression, Skill, Exploration, Casual, Time Attack, Survival, and more!',
    screen: 'achievements',
    position: 'center',
    showTap: false,
    showStaticAchievements: true
  },
  // Step 14: Back to REAL Profile, show Stats (15/19)
  {
    type: 'navigate',
    title: 'Statistics',
    text: 'Now let\'s look at your statistics to track your gaming journey!',
    screen: 'profile',
    navigateTo: 'profile-back'
  },
  // Step 15: Stats Button (16/19) - REAL profile
  {
    type: 'highlight',
    target: '.stats-chart-button',
    title: 'View Stats',
    text: 'Tap here to see detailed statistics about your games, accuracy, streaks, and more!',
    screen: 'profile',
    position: 'top',
    showTap: true,
    tapAction: 'openStats'
  },
  // Step 16: Inside Stats (17/19) - Uses static stats page
  {
    type: 'highlight',
    target: '#tutorial-stats-selector',
    title: 'Stats Overview',
    text: 'Track your Games, Questions, Correct answers, Wrong, Time spent, and Streaks. Use the time filters to see different periods!',
    screen: 'stats',
    position: 'bottom',
    showTap: false,
    showStaticStats: true
  },
  // Step 17: By Topic Tab (18/19) - Uses static stats page
  {
    type: 'highlight',
    target: '#tutorial-stats-tab-2',
    title: 'By Topic Stats',
    text: 'Switch to "By Topic" to see your performance breakdown for each individual quiz topic!',
    screen: 'stats',
    position: 'bottom',
    showTap: false,
    showStaticStats: true
  },
  // Step 18: Language Settings (19/20)
  {
    type: 'info',
    title: '🌍 Language Options',
    text: 'Quizzena supports multiple languages! Go to <b>Settings → Language</b> to download and switch between English, Spanish, Russian, Turkish, and more coming soon!',
    screen: 'home',
    icon: '🌍',
    navigateTo: 'home-finish'
  },
  // Step 19: Finish (20/20)
  {
    type: 'finish',
    title: 'You\'re All Set! 🎉',
    text: 'That\'s the tour! Start playing to level up, unlock achievements, and become a Quizzena master. Good luck!',
    screen: 'home',
    icon: '🏆'
  }
];

let tutorialCurrentStep = 0;
let tutorialActive = false;

function startTutorial() {
  // Close settings modal if open
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) settingsModal.classList.add('hidden');
  
  // Close any open overlays
  closePxpDashboard();
  closeUnifiedModeSelection();
  closeAchievementsRitual();
  
  // Go to home screen
  showHome();
  
  tutorialCurrentStep = 0;
  tutorialActive = true;
  
  const overlay = document.getElementById('tutorial-overlay');
  overlay.classList.remove('hidden');
  
  // Setup button listeners
  document.getElementById('tutorial-skip-btn').onclick = endTutorial;
  document.getElementById('tutorial-next-btn').onclick = nextTutorialStep;
  
  // Show first step
  showGuidedTutorialStep(0);
}

function showGuidedTutorialStep(stepIndex) {
  const step = GUIDED_TUTORIAL_STEPS[stepIndex];
  const totalSteps = GUIDED_TUTORIAL_STEPS.length;
  
  // Update step indicator
  document.getElementById('tutorial-step-indicator').textContent = `${stepIndex + 1} / ${totalSteps}`;
  document.getElementById('tutorial-textbox-title').textContent = step.title;
  document.getElementById('tutorial-textbox-text').innerHTML = step.text;
  
  // Update next button
  const nextBtn = document.getElementById('tutorial-next-btn');
  if (stepIndex === totalSteps - 1) {
    nextBtn.textContent = 'Finish ✓';
    nextBtn.classList.add('finish-btn');
  } else {
    nextBtn.textContent = 'Next →';
    nextBtn.classList.remove('finish-btn');
  }
  
  // Handle different step types
  if (step.type === 'welcome' || step.type === 'finish') {
    showWelcomeStep(step);
  } else if (step.type === 'navigate') {
    showNavigateStep(step);
  } else if (step.type === 'highlight') {
    showHighlightStep(step);
  }
}

function showWelcomeStep(step) {
  // Handle static pages
  const staticProfile = document.getElementById('tutorial-static-profile');
  const staticAchievements = document.getElementById('tutorial-static-achievements');
  const staticStats = document.getElementById('tutorial-static-stats');
  
  // Hide all static pages first
  if (staticProfile) staticProfile.classList.add('hidden');
  if (staticAchievements) staticAchievements.classList.add('hidden');
  if (staticStats) staticStats.classList.add('hidden');
  
  // Show the appropriate static page
  if (step.showStaticProfile && staticProfile) {
    staticProfile.classList.remove('hidden');
  }
  if (step.showStaticAchievements && staticAchievements) {
    staticAchievements.classList.remove('hidden');
  }
  if (step.showStaticStats && staticStats) {
    staticStats.classList.remove('hidden');
  }
  
  // Navigate first if needed (for finish step)
  if (step.navigateTo && step.type === 'finish') {
    performNavigation(step.navigateTo);
  }
  
  const textbox = document.getElementById('tutorial-textbox');
  const highlightRing = document.getElementById('tutorial-highlight-ring');
  const tapIndicator = document.getElementById('tutorial-tap-indicator');
  const arrow = document.getElementById('tutorial-textbox-arrow');
  const mask = document.getElementById('tutorial-spotlight-mask');
  
  // Hide highlight elements
  highlightRing.classList.add('hidden');
  tapIndicator.classList.add('hidden');
  arrow.className = 'tutorial-textbox-arrow hidden';
  
  // Fully transparent (no dark overlay)
  mask.style.clipPath = 'none';
  mask.style.background = 'transparent';
  
  // Center the textbox with icon
  textbox.classList.add('welcome-mode');
  textbox.style.top = '50%';
  textbox.style.left = '50%';
  textbox.style.transform = 'translate(-50%, -50%)';
  textbox.style.bottom = 'auto';
  textbox.style.right = 'auto';
  
  // Add icon if exists
  const content = textbox.querySelector('.tutorial-textbox-content');
  let iconEl = content.querySelector('.tutorial-welcome-icon');
  if (!iconEl && step.icon) {
    iconEl = document.createElement('div');
    iconEl.className = 'tutorial-welcome-icon';
    content.insertBefore(iconEl, content.firstChild);
  }
  if (iconEl) {
    iconEl.textContent = step.icon || '👋';
  }
}

function showNavigateStep(step) {
  // Hide all static pages
  const staticProfile = document.getElementById('tutorial-static-profile');
  const staticAchievements = document.getElementById('tutorial-static-achievements');
  const staticStats = document.getElementById('tutorial-static-stats');
  if (staticProfile) staticProfile.classList.add('hidden');
  if (staticAchievements) staticAchievements.classList.add('hidden');
  if (staticStats) staticStats.classList.add('hidden');
  
  // Navigate FIRST, then show the message on the new page
  if (step.navigateTo) {
    performNavigation(step.navigateTo);
  }
  
  // Wait for navigation transition to complete and DOM to be ready
  setTimeout(() => {
    requestAnimationFrame(() => {
      showWelcomeStep(step);
    });
  }, 500);
}

function showHighlightStep(step) {
  // Handle static pages
  const staticProfile = document.getElementById('tutorial-static-profile');
  const staticAchievements = document.getElementById('tutorial-static-achievements');
  const staticStats = document.getElementById('tutorial-static-stats');
  
  // Hide all static pages first
  if (staticProfile) staticProfile.classList.add('hidden');
  if (staticAchievements) staticAchievements.classList.add('hidden');
  if (staticStats) staticStats.classList.add('hidden');
  
  // Show the appropriate static page
  if (step.showStaticProfile && staticProfile) {
    staticProfile.classList.remove('hidden');
  }
  if (step.showStaticAchievements && staticAchievements) {
    staticAchievements.classList.remove('hidden');
  }
  if (step.showStaticStats && staticStats) {
    staticStats.classList.remove('hidden');
  }
  
  // Navigate first if needed (only if not using static pages)
  if (step.navigateTo && !step.showStaticProfile && !step.showStaticAchievements && !step.showStaticStats) {
    performNavigation(step.navigateTo);
  }
  
  const textbox = document.getElementById('tutorial-textbox');
  const highlightRing = document.getElementById('tutorial-highlight-ring');
  const tapIndicator = document.getElementById('tutorial-tap-indicator');
  const arrow = document.getElementById('tutorial-textbox-arrow');
  const mask = document.getElementById('tutorial-spotlight-mask');
  
  // Remove welcome mode
  textbox.classList.remove('welcome-mode');
  
  // Remove welcome icon if exists
  const iconEl = textbox.querySelector('.tutorial-welcome-icon');
  if (iconEl) iconEl.remove();
  
  // Small delay to ensure static page is rendered
  const delay = step.showStaticProfile ? 100 : 0;
  
  setTimeout(() => {
    // Find target element
    const target = document.querySelector(step.target);
    if (!target) {
      console.warn('Tutorial target not found:', step.target);
      // Show centered instead
      showWelcomeStep(step);
      return;
    }
    
    // Scroll element into view if needed
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait for scroll to complete, then position elements
    setTimeout(() => {
      positionHighlightElements(target, step, textbox, highlightRing, tapIndicator, arrow, mask);
    }, 350);
  }, delay);
}

function positionHighlightElements(target, step, textbox, highlightRing, tapIndicator, arrow, mask) {
  // Get target position after scroll
  const rect = target.getBoundingClientRect();
  const padding = 8;
  
  // Position highlight ring
  highlightRing.classList.remove('hidden');
  highlightRing.style.top = (rect.top - padding) + 'px';
  highlightRing.style.left = (rect.left - padding) + 'px';
  highlightRing.style.width = (rect.width + padding * 2) + 'px';
  highlightRing.style.height = (rect.height + padding * 2) + 'px';
  
  // Create spotlight cutout
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rx = (rect.width / 2) + padding + 10;
  const ry = (rect.height / 2) + padding + 10;
  
  mask.style.background = 'transparent';
  mask.style.clipPath = `polygon(
    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
    ${cx - rx}px ${cy}px,
    ${cx}px ${cy - ry}px,
    ${cx + rx}px ${cy}px,
    ${cx}px ${cy + ry}px,
    ${cx - rx}px ${cy}px
  )`;
  
  // Position tap indicator
  if (step.showTap) {
    tapIndicator.classList.remove('hidden');
    tapIndicator.style.top = (rect.bottom + 10) + 'px';
    tapIndicator.style.left = (rect.left + rect.width / 2) + 'px';
    tapIndicator.style.transform = 'translateX(-50%)';
  } else {
    tapIndicator.classList.add('hidden');
  }
  
  // Position textbox based on step.position
  positionTextbox(textbox, arrow, rect, step.position || 'bottom');
}

function positionTextbox(textbox, arrow, targetRect, position) {
  const margin = 20;
  const boxWidth = 320;
  const boxHeight = 200; // approximate
  
  // Reset styles
  textbox.style.top = 'auto';
  textbox.style.bottom = 'auto';
  textbox.style.left = 'auto';
  textbox.style.right = 'auto';
  textbox.style.transform = 'none';
  
  arrow.className = 'tutorial-textbox-arrow';
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (position === 'bottom' || position === 'bottom-left') {
    // Textbox below element
    textbox.style.top = (targetRect.bottom + margin + 30) + 'px';
    textbox.style.left = Math.max(20, Math.min(viewportWidth - boxWidth - 20, targetRect.left + targetRect.width / 2 - boxWidth / 2)) + 'px';
    arrow.classList.add('arrow-up');
  } else if (position === 'top') {
    // Textbox above element
    textbox.style.bottom = (viewportHeight - targetRect.top + margin + 30) + 'px';
    textbox.style.left = Math.max(20, Math.min(viewportWidth - boxWidth - 20, targetRect.left + targetRect.width / 2 - boxWidth / 2)) + 'px';
    arrow.classList.add('arrow-down');
  } else if (position === 'center') {
    // Center on screen
    textbox.style.top = '50%';
    textbox.style.left = '50%';
    textbox.style.transform = 'translate(-50%, -50%)';
    arrow.classList.add('hidden');
  }
}

function nextTutorialStep() {
  playClickSound();
  
  const currentStep = GUIDED_TUTORIAL_STEPS[tutorialCurrentStep];
  
  // Handle tap actions (navigation for 'navigate' type steps now happens when step is shown)
  if (currentStep.tapAction && currentStep.tapAction !== 'none') {
    performTapAction(currentStep.tapAction);
  }
  
  // Move to next step
  tutorialCurrentStep++;
  
  if (tutorialCurrentStep >= GUIDED_TUTORIAL_STEPS.length) {
    endTutorial();
    return;
  }
  
  // Delay for navigation transitions
  const nextStep = GUIDED_TUTORIAL_STEPS[tutorialCurrentStep];
  const delay = (currentStep.type === 'navigate' || currentStep.tapAction) ? 400 : 100;
  
  setTimeout(() => {
    showGuidedTutorialStep(tutorialCurrentStep);
  }, delay);
}

function performNavigation(destination) {
  switch (destination) {
    case 'home':
      showHome();
      closeStatsChart();
      break;
    case 'home-from-pxp':
      closePxpDashboard();
      showHome();
      break;
    case 'home-finish':
      // Close everything and go home for tutorial finish
      closeStatsChart();
      closeAchievementsRitual();
      closePxpDashboard();
      showHome();
      break;
    case 'topics':
      showTopics();
      break;
    case 'profile':
      // Ensure home-screen container is visible
      const homeScreenProfile = document.getElementById('home-screen');
      if (homeScreenProfile) homeScreenProfile.classList.remove('hidden');
      // Remove the mode screen completely  
      const modeScreen = document.getElementById('unified-mode-screen');
      if (modeScreen) modeScreen.classList.add('hidden');
      showProfile();
      break;
    case 'profile-back':
      // Ensure home-screen container is visible
      const homeScreenBack = document.getElementById('home-screen');
      if (homeScreenBack) homeScreenBack.classList.remove('hidden');
      closeAchievementsRitual();
      // Show profile
      showProfile();
      break;
    case 'stats':
      openStatsChart();
      break;
  }
}

function performTapAction(action) {
  switch (action) {
    case 'openPxpDashboard':
      openPxpDashboard();
      break;
    case 'openFirstTopic':
      // Find first topic and simulate click to open mode selection
      const firstTopicBtn = document.querySelector('.topics-scroll-row .status-active button');
      if (firstTopicBtn) {
        firstTopicBtn.click();
      }
      break;
    case 'openAchievements':
      // Remove any blocking screens first
      const modeScreenAch = document.getElementById('unified-mode-screen');
      const quizScreenAch = document.getElementById('unified-quiz-screen');
      if (modeScreenAch) modeScreenAch.remove();
      if (quizScreenAch) quizScreenAch.remove();
      // Hide static tutorial profile
      const staticProfileAch = document.getElementById('tutorial-static-profile');
      if (staticProfileAch) staticProfileAch.classList.add('hidden');
      // Open achievements
      openAchievementsRitual();
      break;
    case 'openStats':
      openStatsChart();
      break;
  }
}

// Close the mode selection overlay
function closeUnifiedModeSelection() {
  // Return to topics or home
  const modeScreen = document.getElementById('unified-mode-screen');
  if (modeScreen) {
    modeScreen.classList.add('hidden');
  }
  // Also hide any mode selection overlays
  const modeOverlay = document.querySelector('.topic-detail-screen');
  if (modeOverlay) {
    // The mode selection is part of the unified screen, just show topics
    showTopics();
  }
}

function endTutorial() {
  tutorialActive = false;
  
  // Hide tutorial overlay
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.classList.add('hidden');
  
  // Hide all static tutorial pages
  const staticProfile = document.getElementById('tutorial-static-profile');
  const staticAchievements = document.getElementById('tutorial-static-achievements');
  const staticStats = document.getElementById('tutorial-static-stats');
  if (staticProfile) staticProfile.classList.add('hidden');
  if (staticAchievements) staticAchievements.classList.add('hidden');
  if (staticStats) staticStats.classList.add('hidden');
  
  // Hide tutorial elements
  const mask = document.getElementById('tutorial-spotlight-mask');
  const ring = document.getElementById('tutorial-highlight-ring');
  const textbox = document.getElementById('tutorial-textbox');
  const tapIndicator = document.getElementById('tutorial-tap-indicator');
  if (mask) mask.style.clipPath = '';
  if (ring) ring.classList.add('hidden');
  if (textbox) textbox.classList.add('hidden');
  if (tapIndicator) tapIndicator.classList.add('hidden');
  
  // Close any open overlays
  try { closePxpDashboard(); } catch(e) {}
  try { closeAchievementsRitual(); } catch(e) {}
  try { closeStatsChart(); } catch(e) {}
  try { closeCategoryModal(); } catch(e) {}
  try { closeSettingsModal(); } catch(e) {}
  
  // Reset body styles that might be blocking
  document.body.style.overflow = '';
  
  // **FIX: Show the home-screen container (it gets hidden during mode selection)**
  const homeScreen = document.getElementById('home-screen');
  if (homeScreen) homeScreen.classList.remove('hidden');
  
  // Hide unified mode screen if visible
  const unifiedModeScreen = document.getElementById('unified-mode-screen');
  if (unifiedModeScreen) unifiedModeScreen.classList.add('hidden');
  
  // Navigate to home using the proper function
  showHome();
  
  // Mark as seen
  localStorage.setItem('quizzena_tutorial_seen', 'true');
  
  playClickSound();
}

// Close P-XP dashboard if it exists
function closePxpDashboard() {
  const dashboard = document.getElementById('pxp-dashboard');
  if (dashboard) dashboard.classList.add('hidden');
}

// Open P-XP dashboard - calls updatePxpDashboard to refresh data
function openPxpDashboard() {
  const dashboard = document.getElementById('pxp-dashboard');
  if (dashboard) {
    dashboard.classList.remove('hidden');
    updatePxpDashboard();
  }
}
