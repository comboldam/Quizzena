// ============================================
// USER DATA SYSTEM
// ============================================

const defaultUserData = {
  isSetupComplete: false,
  profile: {
    username: "Guest",
    avatar: "👤",
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
    topics: {}
  }
};

function loadUserData() {
  const saved = localStorage.getItem('quizzena_user_data');
  if (saved) {
    return JSON.parse(saved);
  }
  return JSON.parse(JSON.stringify(defaultUserData));
}

function saveUserData() {
  localStorage.setItem('quizzena_user_data', JSON.stringify(userData));
}

function resetUserData() {
  localStorage.removeItem('quizzena_user_data');
  location.reload();
}

let userData = loadUserData();

console.log('User Data System loaded:', userData);

// ========================================
// ☁️ CLOUDINARY CDN CONFIGURATION
// ========================================
// IMPORTANT: Replace 'YOUR_CLOUD_NAME' with your actual Cloudinary cloud name!
// Instructions: See CLOUDINARY_SETUP.md for setup details
const CLOUDINARY_CLOUD_NAME = 'duuvz86ph';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/`;
const USE_LOCAL_IMAGES = false; // Set to 'true' for local development, 'false' for production CDN

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
const quickGameBtn = document.getElementById("quick-game-btn");
const threeStrikesBtn = document.getElementById("three-strikes-btn");
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
  QUICK_GAME_QUESTIONS: 10,
  QUICK_GAME_TIME_PER_Q: 10,
  THREE_STRIKES_LIVES: 3,
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
  livesRemaining = GAME_CONFIG.THREE_STRIKES_LIVES;
  currentPlayer = 1;
  answered = false;
  maxQuestions = GAME_CONFIG.TWO_PLAYER_QUESTIONS;
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
  currentTopic = 'flags';
  showUnifiedModeSelection('Flags', '🏳️');
};

capitalsTopicBtn.onclick = () => {
  currentTopic = 'capitals';
  showUnifiedModeSelection('Capitals', '🏛️');
};

bordersTopicBtn.onclick = () => {
  currentTopic = 'borders';
  showUnifiedModeSelection('Borders', '🗺️');
};

areaTopicBtn.onclick = () => {
  currentTopic = 'area';
  showUnifiedModeSelection('Area', '📏');
};

// ========================================
// 👥 NAVIGATION - PLAYER SELECTION
// ========================================
backToHomeBtn.onclick = () => {
  playerSelect.classList.add("hidden");
  home.classList.remove("hidden");
};

singlePlayerBtn.onclick = () => {
  playerSelect.classList.add("hidden");
  modeSelect.classList.remove("hidden");
};

twoPlayerBtn.onclick = () => {
  resetGame();
  gameMode = 'two';
  maxQuestions = GAME_CONFIG.TWO_PLAYER_QUESTIONS;
  playerSelect.classList.add("hidden");

  if (currentTopic === 'area') {
    areaDifficultyScreen.classList.remove("hidden");
  } else {
    game.classList.remove("hidden");
    loadFlags();
  }
};

// ========================================
// 🏠 NAVIGATION - MODE SELECT BUTTONS
// ========================================
backBtn.onclick = () => {
  modeSelect.classList.add("hidden");
  playerSelect.classList.remove("hidden");
};

timeAttackBtn.onclick = () => {
  resetGame();
  gameMode = 'time-attack';
  modeSelect.classList.add("hidden");

  if (currentTopic === 'area') {
    areaDifficultyScreen.classList.remove("hidden");
  } else {
    game.classList.remove("hidden");
    loadFlags();
  }
};

quickGameBtn.onclick = () => {
  resetGame();
  gameMode = 'quick-game';
  maxQuestions = GAME_CONFIG.QUICK_GAME_QUESTIONS;
  modeSelect.classList.add("hidden");

  if (currentTopic === 'area') {
    areaDifficultyScreen.classList.remove("hidden");
  } else {
    game.classList.remove("hidden");
    loadFlags();
  }
};

threeStrikesBtn.onclick = () => {
  resetGame();
  gameMode = 'three-strikes';
  livesRemaining = GAME_CONFIG.THREE_STRIKES_LIVES;
  modeSelect.classList.add("hidden");

  if (currentTopic === 'area') {
    areaDifficultyScreen.classList.remove("hidden");
  } else {
    game.classList.remove("hidden");
    loadFlags();
  }
};

// ========================================
// 🎯 NAVIGATION - DIFFICULTY SELECTION
// ========================================
backFromDifficultyBtn.onclick = () => {
  areaDifficultyScreen.classList.add("hidden");
  modeSelect.classList.remove("hidden");
};

areaEasyBtn.onclick = () => {
  selectedDifficulty = 'easy';
  areaDifficultyScreen.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

areaMediumBtn.onclick = () => {
  selectedDifficulty = 'medium';
  areaDifficultyScreen.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

areaHardBtn.onclick = () => {
  selectedDifficulty = 'hard';
  areaDifficultyScreen.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

// ========================================
// 🏠 NAVIGATION - IN-GAME MENU BUTTON
// ========================================
backToMenuBtn.onclick = () => {
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
      const res = await fetch("https://flagcdn.com/en/codes.json");
      const data = await res.json();
      
      flags = Object.entries(data)
        .filter(([code, name]) => {
          const entityType = getEntityType(name);
          return entityType === "country";
        })
        .map(([code, name]) => ({
          country: name.replace(/\bStates\b/gi, '').trim(),
          flag: `https://flagcdn.com/w320/${code}.png`,
          originalName: name
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
  // Check if questions are already generated
  if (areaQuestions[selectedDifficulty].length === 0) {
    await generateAreaQuestions();
  }

  // Load questions from selected difficulty
  flags = areaQuestions[selectedDifficulty];
} else if (currentTopic === 'football') {
  // Load football questions from JSON
  const response = await fetch('topics/football-general/questions.json');
  const questions = await response.json();

  // Convert football format to unified format
  flags = questions.map(q => ({
    question: q.question,
    correctAnswer: q.answer,
    options: q.options,
    type: 'football'
  }));

  // Shuffle the questions
  for (let i = flags.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flags[i], flags[j]] = [flags[j], flags[i]];
  }
} else if (currentTopic === 'world-history') {
  // Load world history questions from JSON (exact copy of football structure)
  const response = await fetch('topics/world-history/questions.json');
  const questions = await response.json();

  // Convert history format to unified format
  flags = questions.map(q => ({
    question: q.question,
    correctAnswer: q.answer,
    options: q.options,
    image: q.image, // Add image support
    type: 'world-history'
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
// 🚫 FILTER - EXCLUDE NON-COUNTRIES
// ========================================
function getEntityType(name) {
  const territories = ["Puerto Rico", "Guam", "American Samoa", "U.S. Virgin Islands", 
                       "Northern Mariana Islands", "Greenland", "Faroe Islands", "Åland Islands",
                       "French Polynesia", "New Caledonia", "Martinique", "Guadeloupe", "Réunion",
                       "Mayotte", "French Guiana", "Saint Martin", "Saint Barthélemy",
                       "Bermuda", "Cayman Islands", "British Virgin Islands", "Turks and Caicos Islands",
                       "Gibraltar", "Falkland Islands", "Montserrat", "Anguilla", "Saint Helena",
                       "Aruba", "Curaçao", "Sint Maarten", "Caribbean Netherlands"];
  
  const dependencies = ["Isle of Man", "Jersey", "Guernsey", "Cook Islands", "Niue", "Tokelau"];
  
  const usStates = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
                    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
                    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
                    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
                    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
                    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
                    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
                    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", 
                    "Washington", "West Virginia", "Wisconsin", "Wyoming"];
  
  if (territories.some(t => name.includes(t))) return "territory";
  if (dependencies.some(d => name.includes(d))) return "dependency";
  if (usStates.some(s => name === s)) return "us-state";
  return "country";
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
    } else {
      timerDisplay.textContent = `⏳ ${timeLeft}s`;
    }

    timer = setInterval(() => {
      // CHECK BEFORE DECREMENTING - Prevents negative numbers
      if (timeLeft <= 0) {
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
      } else {
        timerDisplay.textContent = `⏳ ${timeLeft}s`;
      }
    }, 1000);

  } else if (gameMode === 'quick-game') {
    timeLeft = GAME_CONFIG.QUICK_GAME_TIME_PER_Q;
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
      } else {
        timerDisplay.textContent = `⏳ ${timeLeft}s`;
      }
    }, 1000);

  } else if (gameMode === 'three-strikes') {
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
  
  if (gameMode === 'quick-game') {
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
  if (gameMode === 'two' && questionCount >= maxQuestions) return endGame();
  if (gameMode === 'quick-game' && questionCount >= maxQuestions) return endGame();
  
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
  if (gameMode === 'quick-game') {
    questionCounter.style.display = "block";
    questionCounter.textContent = `${questionCount}/10`;
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
    const imageBase = USE_LOCAL_IMAGES ? './capital_images/' : CLOUDINARY_BASE_URL;
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
    const borderPath = `country_silhouettes/${randomFlag.isoCode}.png`;
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
      flagImg.src = `https://flagcdn.com/w320/${randomFlag.isoCode}.png`;
      flagImg.classList.add('fallback-flag');
    } else {
      // Use border silhouette
      flagImg.src = `country_silhouettes/${randomFlag.isoCode}.png`;
      flagImg.classList.remove('fallback-flag');
    }

    flagImg.onerror = function() {
      // Fallback to flag if border image fails
      this.src = `https://flagcdn.com/w320/${randomFlag.isoCode}.png`;
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
  
  if (gameMode === 'time-attack') {
    if (selected === correct) {
      singlePlayerScore++;
      resultBox.textContent = `✅ Correct!`;
    } else {
      resultBox.textContent = `❌ Wrong!`;
    }
    score.textContent = `Score: ${singlePlayerScore}`;
    
    setTimeout(() => {
      resultBox.textContent = "";
      startRound();
    }, GAME_CONFIG.FEEDBACK_DELAY_FAST);
    
  } else if (gameMode === 'quick-game') {
    answered = true;
    clearInterval(timer);
    disableAnswers();
    
    if (selected === correct) {
      singlePlayerScore++;
      resultBox.textContent = `✅ Correct!`;
    } else {
      resultBox.textContent = `❌ Wrong! It was ${correct}`;
    }
    score.textContent = `Score: ${singlePlayerScore}`;
    
    setTimeout(() => {
      if (questionCount >= maxQuestions) {
        endGame();
      } else {
        startRound();
      }
    }, GAME_CONFIG.FEEDBACK_DELAY_NORMAL);
    
  } else if (gameMode === 'three-strikes') {
    if (selected === correct) {
      singlePlayerScore++;
      resultBox.textContent = `✅ Correct!`;
    } else {
      livesRemaining--;
      timerDisplay.textContent = `❤️ Lives: ${livesRemaining}`;
      resultBox.textContent = `❌ Wrong! It was ${correct}`;
      
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
    } else {
      resultBox.textContent = `❌ Wrong! It was ${correct}`;
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
  clearInterval(timer);
  answersDiv.innerHTML = "";
  flagImg.style.display = "none";;
  timerDisplay.textContent = "";
  question.textContent = "";
  questionCounter.style.display = "none";
  
  if (gameMode === 'time-attack') {
    resultBox.textContent = `GAME OVER - Final Score: ${singlePlayerScore}`;
    score.textContent = "";
  } else if (gameMode === 'quick-game') {
    resultBox.textContent = `GAME OVER - Score: ${singlePlayerScore}/10`;
    score.textContent = "";
  } else if (gameMode === 'three-strikes') {
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
  resetGame();
  playAgainBtn.style.display = "none";
  mainMenuBtn.style.display = "none";
  
  if (gameMode === 'two') {
    maxQuestions = GAME_CONFIG.TWO_PLAYER_QUESTIONS;
  } else if (gameMode === 'quick-game') {
    maxQuestions = GAME_CONFIG.QUICK_GAME_QUESTIONS;
  }
  
  if (gameMode === 'time-attack' || gameMode === 'quick-game' || gameMode === 'three-strikes') {
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
      alert("Coming soon! 🚀");
    };
  }
});

// Football General - now uses unified system
const footballGeneralBtn = document.getElementById('football-general-topic-btn');
if (footballGeneralBtn) {
  footballGeneralBtn.addEventListener('click', () => {
    currentTopic = 'football';
    showUnifiedModeSelection('Football', '⚽');
  });
}

// World History - uses unified system (exact copy of football structure)
const worldHistoryBtn = document.getElementById('world-history-topic-btn');
if (worldHistoryBtn) {
  worldHistoryBtn.addEventListener('click', () => {
    currentTopic = 'world-history';
    showUnifiedModeSelection('World History', '🌍');
  });
}

// Football topics placeholders (excluding football-general which is implemented)
const footballTopics = [
  'premier-league', 'champions-league', 'world-cup',
  'uefa-euro', 'la-liga', 'serie-a', 'bundesliga', 'ligue-1',
  'ballon-dor', 'messi-ronaldo', 'current-stars', 'legends',
  'transfers', 'records', 'managers', 'iconic-matches',
  'historic-teams', 'stadiums', 'finals', 'derbies', 'messi', 'ronaldo'
];

footballTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      alert("Coming soon! ⚽");
    };
  }
});

// Movies topics placeholders
const moviesTopics = [
  'movies-general', 'marvel-movies', 'dc-movies', 'harry-potter', 'star-wars', 'lotr',
  'disney-movies', 'pixar-movies', 'animated-movies', 'horror-movies',
  'action-movies', 'scifi-movies', 'comedy-movies', 'thriller-movies',
  'classic-movies', 'movie-quotes', 'movie-villains'
];

moviesTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      alert("Coming soon! 🎬");
    };
  }
});

// TV Shows topics placeholders
const tvTopics = [
  'tv-general', 'sitcoms', 'drama-tv', 'thriller-tv',
  'comedy-tv', 'fantasy-tv', 'crime-tv', 'animated-tv'
];

tvTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      alert("Coming soon! 📺");
    };
  }
});

// Logos topics placeholders
const logosTopics = [
  'logos-general', 'brand-logos', 'car-logos', 'tech-logos',
  'fastfood-logos', 'football-club-logos', 'social-media-logos',
  'luxury-logos', 'app-icons', 'nba-logos', 'nfl-logos'
];

logosTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
      alert("Coming soon! ✨");
    };
  }
});

// History topics placeholders (excluding world-history which is implemented)
const historyTopics = [
  'ancient-civs', 'egyptian', 'greek-roman', 'medieval',
  'ww2', 'ww1', 'cold-war', 'civil-war', 'british-monarchy',
  'roman-empire', 'ottoman-empire', 'crusades', 'explorers', 'industrial-rev',
  'fall-rome', 'silk-road', 'famous-leaders', 'dictators', 'scientists',
  'inventors', 'historical-maps', 'battles', 'timeline', 'archaeology'
];

historyTopics.forEach(topic => {
  const btn = document.getElementById(`${topic}-topic-btn`);
  if (btn) {
    btn.onclick = () => {
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
      alert("Coming soon! 🍕");
    };
  }
});

// ========================================
// 🧭 BOTTOM NAV - SCREEN SWITCHING
// ========================================

const navHome = document.getElementById('nav-home');
const navTopics = document.getElementById('nav-topics');
const navStats = document.getElementById('nav-stats');
const navLeaderboard = document.getElementById('nav-leaderboard');
const navProfile = document.getElementById('nav-profile');

const homeView = document.getElementById('home-view');
const topicsView = document.getElementById('topics-view');
const profileView = document.getElementById('profile-view');

const browseAllBtn = document.getElementById('browse-all-topics');

// Show Home screen
function showHome() {
  homeView.classList.remove('hidden');
  topicsView.classList.add('hidden');
  profileView.classList.add('hidden');

  const statsView = document.getElementById('stats-view');
  if (statsView) statsView.classList.add('hidden');

  const leaderboardView = document.getElementById('leaderboard-view');
  if (leaderboardView) leaderboardView.classList.add('hidden');

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navHome.classList.add('active');
}

// Show Topics screen
function showTopics() {
  homeView.classList.add('hidden');
  topicsView.classList.remove('hidden');
  profileView.classList.add('hidden');

  const statsView = document.getElementById('stats-view');
  if (statsView) statsView.classList.add('hidden');

  const leaderboardView = document.getElementById('leaderboard-view');
  if (leaderboardView) leaderboardView.classList.add('hidden');

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navTopics.classList.add('active');
}

// Show Profile screen
function showProfile() {
  homeView.classList.add('hidden');
  topicsView.classList.add('hidden');
  profileView.classList.remove('hidden');

  const statsView = document.getElementById('stats-view');
  if (statsView) statsView.classList.add('hidden');

  const leaderboardView = document.getElementById('leaderboard-view');
  if (leaderboardView) leaderboardView.classList.add('hidden');

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navProfile.classList.add('active');
}

// Nav button click handlers - using addEventListener for iOS compatibility
navHome.addEventListener('click', () => {
  showHome();
});

navTopics.addEventListener('click', () => {
  showTopics();
});

// Browse All Topics button (on home screen)
if (browseAllBtn) {
  browseAllBtn.addEventListener('click', () => {
    showTopics();
  });
}

// Leaderboard button - using addEventListener for iOS compatibility
navLeaderboard.addEventListener('click', () => {
  showLeaderboard();
});

navStats.addEventListener('click', () => {
  showStats();
});

navProfile.addEventListener('click', () => {
  showProfile();
});

// Settings button placeholder
const profileSettings = document.querySelector('.profile-settings');
if (profileSettings) {
  profileSettings.onclick = () => {
    alert('Settings coming soon! ⚙️');
  };
}

// ============================================
// 🎮 UNIFIED QUIZ SYSTEM - ALL QUIZZES USE THIS
// ============================================

function showUnifiedModeSelection(quizName, icon) {
  // Hide home screen
  home.classList.add('hidden');

  // Create or get mode selection screen
  let modeScreen = document.getElementById('unified-mode-screen');
  if (!modeScreen) {
    modeScreen = document.createElement('div');
    modeScreen.id = 'unified-mode-screen';
    modeScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
    document.body.appendChild(modeScreen);
  }

  // Show difficulty selection for Area quiz
  if (currentTopic === 'area') {
    modeScreen.innerHTML = `
      <button onclick="exitUnifiedQuiz()" style="position:absolute;top:15px;left:15px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 15px;border-radius:8px;font-size:1.2rem;cursor:pointer;font-weight:bold;transition:all 0.3s ease;">←</button>
      <h2 style="color:#fff;font-size:28px;margin-bottom:10px;">${icon} ${quizName} Quiz</h2>
      <h3 style="color:#a78bfa;font-size:18px;margin-bottom:30px;">Select Difficulty</h3>

      <button onclick="selectAreaDifficulty('easy')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#4CAF50,#45a049);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(76, 175, 80, 0.4);">
        <div style="font-size:2em;margin-bottom:5px;">🟢</div>
        <div style="font-weight:bold;">Easy</div>
        <div style="font-size:0.9em;opacity:0.9;">10 Largest Countries</div>
      </button>

      <button onclick="selectAreaDifficulty('medium')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#FFA726,#FB8C00);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(255, 167, 38, 0.4);">
        <div style="font-size:2em;margin-bottom:5px;">🟡</div>
        <div style="font-weight:bold;">Medium</div>
        <div style="font-size:0.9em;opacity:0.9;">155 Mid-size Countries</div>
      </button>

      <button onclick="selectAreaDifficulty('hard')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#EF5350,#E53935);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(239, 83, 80, 0.4);">
        <div style="font-size:2em;margin-bottom:5px;">🔴</div>
        <div style="font-weight:bold;">Hard</div>
        <div style="font-size:0.9em;opacity:0.9;">25 Smallest Countries</div>
      </button>
    `;
  } else {
    // Show mode selection for other quizzes
    modeScreen.innerHTML = `
      <button onclick="exitUnifiedQuiz()" style="position:absolute;top:15px;left:15px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 15px;border-radius:8px;font-size:1.2rem;cursor:pointer;font-weight:bold;transition:all 0.3s ease;">←</button>
      <h2 style="color:#fff;font-size:28px;margin-bottom:10px;">${icon} ${quizName} Quiz</h2>
      <h3 style="color:#a78bfa;font-size:18px;margin-bottom:30px;">Choose Game Mode</h3>

      <button onclick="startUnifiedGame('time-attack')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF6B6B,#ee5a5a);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(255, 107, 107, 0.4);">⏱️ Time Attack (60s)</button>

      <button onclick="startUnifiedGame('quick-game')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">⚡ Quick Game (10 questions)</button>

      <button onclick="startUnifiedGame('three-strikes')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#9C27B0,#7B1FA2);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(156, 39, 176, 0.4);">💥 Three Strikes</button>

      <button onclick="startUnifiedGame('two-player')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">👥 2 Players</button>
    `;
  }

  modeScreen.classList.remove('hidden');
}

// Area difficulty selection handler
function selectAreaDifficulty(difficulty) {
  selectedDifficulty = difficulty;

  // Update mode screen to show game modes
  const modeScreen = document.getElementById('unified-mode-screen');
  modeScreen.innerHTML = `
    <button onclick="showUnifiedModeSelection('Area', '📏')" style="position:absolute;top:15px;left:15px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 15px;border-radius:8px;font-size:1.2rem;cursor:pointer;font-weight:bold;transition:all 0.3s ease;">←</button>
    <h2 style="color:#fff;font-size:28px;margin-bottom:10px;">📏 Area Quiz</h2>
    <h3 style="color:#a78bfa;font-size:18px;margin-bottom:30px;">Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h3>

    <button onclick="startUnifiedGame('time-attack')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF6B6B,#ee5a5a);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(255, 107, 107, 0.4);">⏱️ Time Attack (60s)</button>

    <button onclick="startUnifiedGame('quick-game')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">⚡ Quick Game (10 questions)</button>

    <button onclick="startUnifiedGame('three-strikes')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#9C27B0,#7B1FA2);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(156, 39, 176, 0.4);">💥 Three Strikes</button>

    <button onclick="startUnifiedGame('two-player')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">👥 2 Players</button>
  `;
}

// Start game with selected mode
function startUnifiedGame(mode) {
  // Hide mode selection screen
  const modeScreen = document.getElementById('unified-mode-screen');
  if (modeScreen) modeScreen.remove();

  // CRITICAL: Reset ALL game state variables
  resetGame(); // Call the existing resetGame() function

  // Set game mode and parameters
  gameMode = mode;

  if (mode === 'time-attack') {
    timeLeft = GAME_CONFIG.TIME_ATTACK_DURATION;
    maxQuestions = 9999; // Unlimited questions
  } else if (mode === 'quick-game') {
    maxQuestions = GAME_CONFIG.QUICK_GAME_QUESTIONS;
    timeLeft = GAME_CONFIG.QUICK_GAME_TIME_PER_Q;
  } else if (mode === 'three-strikes') {
    livesRemaining = GAME_CONFIG.THREE_STRIKES_LIVES;
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
}

// Build unified quiz screen (matches Football quiz design)
function buildUnifiedQuizScreen() {
  // Remove existing screen if present
  let quizScreen = document.getElementById('unified-quiz-screen');
  if (quizScreen) quizScreen.remove();

  // Create new full-screen quiz overlay
  quizScreen = document.createElement('div');
  quizScreen.id = 'unified-quiz-screen';
  quizScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;overflow-y:auto;';

  document.body.appendChild(quizScreen);
}

// Display question in unified quiz screen
function displayUnifiedQuestion() {
  const quizScreen = document.getElementById('unified-quiz-screen');
  if (!quizScreen) return;

  // Get current question data
  let randomFlag, questionIdentifier;

  if (currentTopic === 'football' || currentTopic === 'world-history') {
    // Football and history use different tracking - track by question text
    const remaining = flags.filter(f => !usedFlags.includes(f.question));
    if (remaining.length === 0) usedFlags = [];
    randomFlag = remaining[Math.floor(Math.random() * remaining.length)];
    usedFlags.push(randomFlag.question);
    questionIdentifier = randomFlag.question;
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
  if (currentTopic === 'football' || currentTopic === 'world-history') {
    questionText = randomFlag.question;
  } else if (currentTopic === 'capitals') {
    questionText = `What is the capital of ${randomFlag.country}?`;
  } else if (currentTopic === 'borders') {
    questionText = "Which country's border is this?";
  } else if (currentTopic === 'area') {
    questionText = `What is the area of ${randomFlag.country}?`;
  } else {
    questionText = "Which country's flag is this?";
  }

  // Determine image source
  let imageSrc = '';
  let imageClass = '';
  let imageHTML = '';

  if (currentTopic === 'football') {
    // Football has no image - show football icon instead
    imageHTML = `<div style="font-size:80px;margin:20px 0;">⚽</div>`;
  } else if (currentTopic === 'world-history') {
    // History quiz - use image from question data if available, otherwise show history icon
    if (randomFlag.image) {
      imageSrc = randomFlag.image;
    } else {
      imageHTML = `<div style="font-size:80px;margin:20px 0;">📜</div>`;
    }
  } else if (currentTopic === 'flags') {
    imageSrc = randomFlag.flag;
  } else if (currentTopic === 'capitals') {
    const sanitizedCapital = randomFlag.capital.replace(/[/\\?%*:|"<>]/g, "_");
    // Use Cloudinary CDN or local images based on configuration
    imageSrc = USE_LOCAL_IMAGES
      ? `./capital_images/${sanitizedCapital}.jpg`
      : `${CLOUDINARY_BASE_URL}${sanitizedCapital}.jpg`;
    // DEBUG: Log unified quiz system image URL
    console.log('[Unified Quiz] Loading capital image:', imageSrc);
  } else if (currentTopic === 'borders') {
    imageSrc = `country_silhouettes/${randomFlag.isoCode}.png`;
    imageClass = 'border-style';
  } else if (currentTopic === 'area') {
    const missingBorders = ['xk', 'mh', 'fm', 'ps', 'tv'];
    if (missingBorders.includes(randomFlag.isoCode)) {
      imageSrc = `https://flagcdn.com/w320/${randomFlag.isoCode}.png`;
    } else {
      imageSrc = `country_silhouettes/${randomFlag.isoCode}.png`;
      imageClass = 'border-style';
    }
  }

  // Generate answer options
  let options;
  let correctAnswer;

  if (currentTopic === 'football' || currentTopic === 'world-history') {
    // Football and history already have options in the question data
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
  } else if (gameMode === 'quick-game') {
    headerInfo = `<span id="unified-timer" style="color:#a78bfa;font-size:20px;font-weight:bold;">⏳ ${timeLeft}s | Q ${questionCount}/${maxQuestions}</span>`;
  } else if (gameMode === 'three-strikes') {
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

    if (currentTopic === 'football' || currentTopic === 'world-history') {
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

  // Render the screen
  quizScreen.innerHTML = `
    <div style="position:absolute;top:15px;left:15px;">
      <button onclick="exitUnifiedQuiz()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 15px;border-radius:8px;font-size:1.2rem;cursor:pointer;font-weight:bold;">←</button>
    </div>
    <div style="width:100%;max-width:500px;text-align:center;">
      ${headerInfo}
      ${playerInfo}
      ${scoreDisplay}
      ${(currentTopic === 'football' || currentTopic === 'world-history') ? imageHTML : (imageSrc ? `<img src="${imageSrc}" style="max-width:350px;width:90%;height:auto;margin:20px auto;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : '')}
      ${currentTopic === 'world-history' && imageSrc ? `<img src="${imageSrc}" style="max-width:350px;width:90%;height:auto;margin:20px auto;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : ''}
      <div style="background:rgba(255,255,255,0.1);border-radius:15px;padding:25px;margin:20px 0;box-shadow:0 4px 15px rgba(124, 58, 237, 0.2);">
        <p style="color:#fff;font-size:20px;line-height:1.4;">${questionText}</p>
      </div>
      <div id="unified-options" style="display:flex;flex-direction:column;gap:12px;">
        ${optionsHTML}
      </div>
    </div>
  `;

  // Add click handlers to options
  document.querySelectorAll('.unified-option-btn').forEach(btn => {
    btn.onclick = () => checkUnifiedAnswer(btn.dataset.answer, btn.dataset.correct);
  });

  // Start timer
  startTimer(correctAnswer);
}

// Check answer in unified quiz
function checkUnifiedAnswer(selected, correct) {
  if (answered) return;
  answered = true;

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
    if (gameMode === 'two') {
      if (currentPlayer === 1) player1Score++;
      else player2Score++;
    } else {
      singlePlayerScore++;
    }
  } else {
    if (gameMode === 'three-strikes') {
      livesRemaining--;
      if (livesRemaining <= 0) {
        clearInterval(timer);
        setTimeout(() => showUnifiedResults(), 800);
        return;
      }
    }
  }

  // Check if game should end
  if (gameMode === 'two' && questionCount >= maxQuestions) {
    clearInterval(timer);
    setTimeout(() => showUnifiedResults(), 800);
    return;
  } else if (gameMode === 'quick-game' && questionCount >= maxQuestions) {
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

// Show unified results screen
function showUnifiedResults() {
  clearInterval(timer);

  const quizScreen = document.getElementById('unified-quiz-screen');
  if (!quizScreen) return;

  let resultText = '';
  let scoreDisplay = '';

  if (gameMode === 'time-attack') {
    resultText = 'Time Attack Complete!';
    scoreDisplay = `${singlePlayerScore}`;
  } else if (gameMode === 'quick-game') {
    resultText = 'Quick Game Complete!';
    scoreDisplay = `${singlePlayerScore} / ${maxQuestions}`;
  } else if (gameMode === 'three-strikes') {
    resultText = 'Three Strikes Complete!';
    scoreDisplay = `${singlePlayerScore}`;
  } else {
    resultText = 'Game Over!';
    scoreDisplay = player1Score > player2Score ? `Player 1 Wins! ${player1Score} - ${player2Score}` :
                   player2Score > player1Score ? `Player 2 Wins! ${player2Score} - ${player1Score}` :
                   `Tie! ${player1Score} - ${player2Score}`;
  }

  const percentage = gameMode === 'two' ? 0 : Math.round((singlePlayerScore / questionCount) * 100);
  const message = percentage >= 80 ? '🏆 Excellent!' : percentage >= 60 ? '⭐ Great Job!' : percentage >= 40 ? '👍 Good Effort!' : '💪 Keep Practicing!';

  quizScreen.innerHTML = `
    <div style="text-align:center;max-width:400px;">
      <h2 style="color:#FFD700;font-size:32px;margin-bottom:10px;">${resultText}</h2>
      <div style="background:rgba(255,255,255,0.1);border-radius:20px;padding:30px;margin:20px 0;box-shadow:0 8px 30px rgba(124, 58, 237, 0.3);">
        <div style="color:#a78bfa;font-size:48px;font-weight:bold;">${scoreDisplay}</div>
        ${gameMode !== 'two' ? `<div style="color:#fff;font-size:20px;margin-top:10px;">${percentage}% Correct</div>` : ''}
      </div>
      ${gameMode !== 'two' ? `<p style="color:#a78bfa;font-size:18px;margin:20px 0;">${message}</p>` : ''}

      <button onclick="restartUnifiedQuiz()" style="width:100%;padding:16px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">Play Again</button>
      <button onclick="exitUnifiedQuiz()" style="width:100%;padding:16px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#666,#555);color:#fff;cursor:pointer;">Back to Topics</button>
    </div>
  `;
}

// Restart unified quiz
function restartUnifiedQuiz() {
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

// Show Stats screen
function showStats() {
  // Hide all views
  const homeView = document.getElementById('home-view');
  const topicsView = document.getElementById('topics-view');
  const profileView = document.getElementById('profile-view');
  const statsView = document.getElementById('stats-view');
  const leaderboardView = document.getElementById('leaderboard-view');

  if (homeView) homeView.classList.add('hidden');
  if (topicsView) topicsView.classList.add('hidden');
  if (profileView) profileView.classList.add('hidden');
  if (statsView) statsView.classList.remove('hidden');
  if (leaderboardView) leaderboardView.classList.add('hidden');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navStats = document.getElementById('nav-stats');
  if (navStats) navStats.classList.add('active');
}

// ========================================
// 🔍 TOPIC SEARCH FUNCTION
// ========================================

// Available topics with their icons
const availableTopics = {
  'flags': { icon: '🏳️', name: 'Flags' },
  'capitals': { icon: '🏛️', name: 'Capitals' },
  'borders': { icon: '🗺️', name: 'Borders' },
  'area': { icon: '📏', name: 'Area' },
  'football': { icon: '⚽', name: 'Football' }
};

function searchTopic(query) {
  const searchResult = document.getElementById('search-result');

  if (!query || query.trim() === '') {
    // Hide result if empty
    searchResult.classList.add('hidden');
    return;
  }

  // Search for matching topic
  const lowerQuery = query.toLowerCase().trim();
  let found = null;

  for (const [key, topic] of Object.entries(availableTopics)) {
    if (key.includes(lowerQuery) || topic.name.toLowerCase().includes(lowerQuery)) {
      found = topic;
      break;
    }
  }

  if (found) {
    // Show found topic with stats (all 0 for now)
    searchResult.innerHTML = `
      <div class="search-result-found">Found:</div>
      <div class="search-result-topic">${found.icon} ${found.name}</div>
      <div class="search-result-stats">
        <div class="mini-stat">
          <span class="mini-stat-label">Games</span>
          <span class="mini-stat-value">0</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">Accuracy</span>
          <span class="mini-stat-value">0%</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">Best</span>
          <span class="mini-stat-value">0</span>
        </div>
      </div>
    `;
    searchResult.classList.remove('hidden');
  } else {
    // Show "not found" message
    searchResult.innerHTML = `
      <div class="search-result-empty">Topic not found</div>
    `;
    searchResult.classList.remove('hidden');
  }
}


// ========================================
// 🏆 LEADERBOARD PAGE FUNCTIONS
// ========================================

// Show Leaderboard screen
function showLeaderboard() {
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
  if (leaderboardView) leaderboardView.classList.remove('hidden');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navLeaderboard = document.getElementById('nav-leaderboard');
  if (navLeaderboard) navLeaderboard.classList.add('active');
}

// ============================================
// WELCOME & SETUP LOGIC
// ============================================

let selectedAvatar = '👤';

function checkFirstTimeUser() {
  if (!userData.isSetupComplete) {
    document.getElementById('welcome-screen').classList.remove('hidden');
  }
}

// Welcome button
const welcomeStartBtn = document.getElementById('welcome-start-btn');
if (welcomeStartBtn) {
  welcomeStartBtn.onclick = () => {
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
  };
}

// Avatar selection
const avatarGrid = document.getElementById('avatar-grid');
if (avatarGrid) {
  avatarGrid.onclick = (e) => {
    if (e.target.classList.contains('avatar-btn')) {
      document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      selectedAvatar = e.target.dataset.avatar;
    }
  };
}

// Save profile
const setupSaveBtn = document.getElementById('setup-save-btn');
if (setupSaveBtn) {
  setupSaveBtn.onclick = () => {
    userData.profile.username = document.getElementById('setup-username').value.trim() || 'Player';
    userData.profile.avatar = selectedAvatar;
    const countrySelect = document.getElementById('setup-country');
    userData.profile.country = countrySelect.value;
    userData.profile.countryName = countrySelect.options[countrySelect.selectedIndex].text;
    userData.profile.createdAt = new Date().toISOString();
    userData.isSetupComplete = true;

    saveUserData();
    document.getElementById('setup-screen').classList.add('hidden');
    updateProfileDisplay();
    console.log('Profile saved:', userData.profile);
  };
}

function updateProfileDisplay() {
  // Top bar
  const topBar = document.querySelector('.user-profile');
  if (topBar) topBar.textContent = userData.profile.username + ' ' + userData.profile.avatar;

  // Profile avatar
  const avatar = document.querySelector('.profile-avatar');
  if (avatar) avatar.textContent = userData.profile.avatar;

  // Profile name
  const name = document.querySelector('.profile-name');
  if (name) name.textContent = userData.profile.username;

  // Profile location/country
  const location = document.querySelector('.profile-location');
  if (location) {
    if (userData.profile.country && userData.profile.countryName) {
      location.textContent = '🌍 ' + userData.profile.countryName;
    } else if (userData.profile.country) {
      location.textContent = '🌍 ' + userData.profile.country;
    } else {
      location.textContent = '🌍 Location not set';
    }
  }
}

// Run on page load
checkFirstTimeUser();
updateProfileDisplay();
