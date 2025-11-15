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

// ========================================
// 🎯 DOM ELEMENTS - SCREENS
// ========================================
const home = document.getElementById("home-screen");
const playerSelect = document.getElementById("player-select");
const modeSelect = document.getElementById("mode-select");
const game = document.getElementById("game-screen");

// ========================================
// 🎯 DOM ELEMENTS - BUTTONS (HOME)
// ========================================
const flagsTopicBtn = document.getElementById("flags-topic-btn");
const capitalsTopicBtn = document.getElementById("capitals-topic-btn");

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
// 🏠 NAVIGATION - HOME SCREEN (TOPIC SELECTION)
// ========================================
flagsTopicBtn.onclick = () => {
  currentTopic = 'flags';
  home.classList.add("hidden");
  playerSelect.classList.remove("hidden");
};

capitalsTopicBtn.onclick = () => {
  currentTopic = 'capitals';
  home.classList.add("hidden");
  playerSelect.classList.remove("hidden");
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
  game.classList.remove("hidden");
  loadFlags();
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
  game.classList.remove("hidden");
  loadFlags();
};

quickGameBtn.onclick = () => {
  resetGame();
  gameMode = 'quick-game';
  maxQuestions = GAME_CONFIG.QUICK_GAME_QUESTIONS;
  modeSelect.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

threeStrikesBtn.onclick = () => {
  resetGame();
  gameMode = 'three-strikes';
  livesRemaining = GAME_CONFIG.THREE_STRIKES_LIVES;
  modeSelect.classList.add("hidden");
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
}
    
    startRound();
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
  
  if (gameMode === 'time-attack') {
    if (questionCount === 1) {
      timeLeft = GAME_CONFIG.TIME_ATTACK_DURATION;
    }
    answered = false;
    timerDisplay.textContent = `⏳ ${timeLeft}s`;
    
    timer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `⏳ ${timeLeft}s`;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        endGame();
      }
    }, 1000);
  } else if (gameMode === 'quick-game') {
    timeLeft = GAME_CONFIG.QUICK_GAME_TIME_PER_Q;
    answered = false;
    timerDisplay.textContent = `⏳ ${timeLeft}s`;
    
    timer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `⏳ ${timeLeft}s`;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        if (!answered) {
          handleTimeout(correctAnswer);
        }
      }
    }, 1000);
  } else if (gameMode === 'three-strikes') {
    timerDisplay.textContent = `❤️ Lives: ${livesRemaining}`;
  } else {
    timeLeft = GAME_CONFIG.TWO_PLAYER_TIME_PER_Q;
    answered = false;
    timerDisplay.textContent = `⏳ ${timeLeft}s`;
    
    timer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `⏳ ${timeLeft}s`;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        if (!answered) {
          handleTimeout(correctAnswer);
        }
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
  } else {
    question.textContent = "Which country's flag is this?";
  }
  
  // ========================================
  // ✅ FIX: USE DOWNLOADED WIKIPEDIA IMAGES
  // ========================================
  if (currentTopic === 'flags') {
    flagImg.style.display = "block";
    flagImg.src = randomFlag.flag;
  } else if (currentTopic === 'capitals') {
    flagImg.style.display = "block";
    
    // Sanitize capital name to match downloaded filename
    const sanitizedCapital = randomFlag.capital.replace(/[/\\?%*:|"<>]/g, "_");
    
    // Try to load the downloaded Wikipedia image first
    flagImg.src = `./capital_images/${sanitizedCapital}.jpg`;
    
    // Fallback to placeholder if image doesn't exist
    flagImg.onerror = function() {
      const seed = randomFlag.capital.toLowerCase().replace(/\s+/g, '-');
      this.src = `https://picsum.photos/seed/${seed}/800/600`;
      this.onerror = null; // Prevent infinite loop
    };
  } else {
    flagImg.style.display = "none";
  }
  
  const wrongAnswers = generateBaitAnswers(randomFlag);
  const options = shuffle([randomFlag, ...wrongAnswers]);
  
  options.forEach(opt => {
    const btn = document.createElement("button");
    
    if (currentTopic === 'capitals') {
      btn.textContent = opt.capital;
      btn.onclick = () => checkAnswer(opt.capital, randomFlag.capital);
    } else {
      btn.textContent = opt.country;
      btn.onclick = () => checkAnswer(opt.country, randomFlag.country);
    }
    
    answersDiv.appendChild(btn);
  });
  
  startTimer(currentTopic === 'capitals' ? randomFlag.capital : randomFlag.country);
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