/**
 * ⭐ QUIZZENA XP SIMULATOR
 * ========================
 * Simulates player progression using final XP formulas.
 * This is a development/testing tool - does NOT affect the real game.
 * 
 * Run with: node simulator/xpSimulator.js
 */

// ============================================
// XP FORMULAS (Matching game implementation)
// ============================================

// LCB Multiplier Table (Learning Curve Bonus for Casual)
const LCB_MULTIPLIERS = {
  0: 10,  // 0 correct → ×10 = 100 XP bonus
  1: 6,   // 1 correct → ×6 = 60 XP bonus
  2: 4,   // 2 correct → ×4 = 40 XP bonus
  3: 2,   // 3 correct → ×2 = 20 XP bonus
  4: 1,   // 4 correct → ×1 = 10 XP bonus
  5: 0    // 5 correct → ×0 = 0 XP bonus
};

/**
 * Calculate XP needed to reach a specific level
 * Formula: 40 × level²
 */
function xpNeededForLevel(level) {
  return 40 * level * level;
}

/**
 * CASUAL MODE XP
 * Formula: (correct × 10) + 10 + LCB
 * LCB = 10 × multiplier × fadeFactor
 * Fade: Level 1-20 = 100%, Level 21+ = 0%
 */
function simulateCasualRun(correct, currentLevel = 1) {
  // Performance XP
  const performanceXP = correct * 10;
  
  // Completion XP
  const completionXP = 10;
  
  // Learning Curve Bonus
  const lcbMultiplier = LCB_MULTIPLIERS[correct] || 0;
  const lcbBase = 10 * lcbMultiplier;
  const lcbFadeFactor = currentLevel <= 20 ? 1.0 : 0.0;
  const lcb = Math.floor(lcbBase * lcbFadeFactor);
  
  const totalXP = performanceXP + completionXP + lcb;
  
  return {
    mode: 'Casual',
    correct,
    performanceXP,
    completionXP,
    lcb,
    totalXP
  };
}

/**
 * TIME ATTACK MODE XP
 * Formula: (correct × 5) + (questions × 1) + accuracyBonus + 20
 * AccuracyBonus = correct × (correct / questions)
 */
function simulateTimeAttackRun(correct, questionsAnswered) {
  // Performance XP
  const performanceXP = correct * 5;
  
  // Speed XP
  const speedXP = questionsAnswered * 1;
  
  // Accuracy Bonus
  const accuracy = questionsAnswered > 0 ? correct / questionsAnswered : 0;
  const accuracyBonus = Math.floor(correct * accuracy);
  
  // Completion XP (always 20, no fade)
  const completionXP = 20;
  
  const totalXP = performanceXP + speedXP + accuracyBonus + completionXP;
  
  return {
    mode: 'Time Attack',
    correct,
    questionsAnswered,
    accuracy: Math.round(accuracy * 100),
    performanceXP,
    speedXP,
    accuracyBonus,
    completionXP,
    totalXP
  };
}

/**
 * 3 HEARTS MODE XP
 * Formula: (correct × 12.5) + (survived × 1.5, CAPPED at 75) + (streak × 2)
 */
function simulateThreeHeartsRun(correct, questionsSurvived, streak) {
  // Performance XP (highest in game)
  const performanceXP = correct * 12.5;
  
  // Survival XP (CAPPED at 50 questions = 75 XP)
  const SURVIVAL_CAP = 75;
  const survivalXP = Math.min(questionsSurvived * 1.5, SURVIVAL_CAP);
  
  // Streak Bonus (uncapped - rewards mastery!)
  const streakBonus = streak * 2;
  
  const totalXP = Math.floor(performanceXP + survivalXP + streakBonus);
  
  return {
    mode: '3 Hearts',
    correct,
    questionsSurvived,
    streak,
    performanceXP,
    survivalXP,
    survivalCapped: questionsSurvived > 50,
    streakBonus,
    totalXP
  };
}

// ============================================
// LEVEL-UP SIMULATOR
// ============================================

/**
 * Simulate progression to a target level
 * @param {number} targetLevel - Level to reach
 * @param {string} mode - 'casual', 'timeattack', 'threehearts', 'hybrid'
 * @param {object} pattern - Performance pattern
 */
function simulateToLevel(targetLevel, mode, pattern) {
  let currentXP = 0;
  let currentLevel = 1;
  let gamesPlayed = 0;
  let totalTimeSeconds = 0;
  
  const levelLog = [];
  const milestones = {};
  
  // Time per game (seconds)
  const CASUAL_TIME = 25;        // 20-30 sec average
  const TIME_ATTACK_TIME = 60;   // Fixed 60 sec
  const THREE_HEARTS_TIME = pattern.threeHeartsTime || 15;  // Variable
  
  // XP thresholds for target level
  const xpForTarget = xpNeededForLevel(targetLevel);
  
  while (currentLevel < targetLevel) {
    let xpGained = 0;
    let gameTime = 0;
    
    if (mode === 'casual') {
      const result = simulateCasualRun(pattern.correctPerGame || 3, currentLevel);
      xpGained = result.totalXP;
      gameTime = CASUAL_TIME;
      
    } else if (mode === 'timeattack') {
      const result = simulateTimeAttackRun(
        pattern.correct || 20,
        pattern.questionsAnswered || 30
      );
      xpGained = result.totalXP;
      gameTime = TIME_ATTACK_TIME;
      
    } else if (mode === 'threehearts') {
      const result = simulateThreeHeartsRun(
        pattern.correct || 15,
        pattern.questionsSurvived || 18,
        pattern.streak || 8
      );
      xpGained = result.totalXP;
      gameTime = THREE_HEARTS_TIME;
      
    } else if (mode === 'hybrid') {
      // Casual until level 5, then Time Attack
      if (currentLevel < 5) {
        const result = simulateCasualRun(pattern.casualCorrect || 3, currentLevel);
        xpGained = result.totalXP;
        gameTime = CASUAL_TIME;
      } else {
        const result = simulateTimeAttackRun(
          pattern.timeCorrect || 20,
          pattern.timeQuestions || 30
        );
        xpGained = result.totalXP;
        gameTime = TIME_ATTACK_TIME;
      }
    }
    
    currentXP += xpGained;
    gamesPlayed++;
    totalTimeSeconds += gameTime;
    
    // Check for level up
    const oldLevel = currentLevel;
    while (currentXP >= xpNeededForLevel(currentLevel)) {
      currentLevel++;
      
      // Log level-up
      levelLog.push({
        level: currentLevel,
        xp: currentXP,
        games: gamesPlayed,
        timeMinutes: (totalTimeSeconds / 60).toFixed(1)
      });
      
      // Track milestones
      if (currentLevel === 5) {
        milestones.level5 = {
          xp: currentXP,
          games: gamesPlayed,
          timeMinutes: (totalTimeSeconds / 60).toFixed(1)
        };
      }
      if (currentLevel === 10) {
        milestones.level10 = {
          xp: currentXP,
          games: gamesPlayed,
          timeMinutes: (totalTimeSeconds / 60).toFixed(1)
        };
      }
    }
  }
  
  return {
    mode,
    pattern,
    targetLevel,
    finalXP: currentXP,
    gamesPlayed,
    totalTimeMinutes: (totalTimeSeconds / 60).toFixed(1),
    milestones,
    levelLog
  };
}

// ============================================
// RUN ALL SIMULATIONS
// ============================================

function runAllSimulations() {
  console.log('\n' + '='.repeat(60));
  console.log('⭐ QUIZZENA XP PROGRESSION SIMULATOR');
  console.log('='.repeat(60) + '\n');
  
  const results = [];
  
  // ============================================
  // CASUAL ONLY SCENARIOS
  // ============================================
  console.log('📊 CASUAL MODE SIMULATIONS (to Level 10)');
  console.log('-'.repeat(50));
  
  [2, 3, 4, 5].forEach(correct => {
    const result = simulateToLevel(10, 'casual', { correctPerGame: correct });
    console.log(`\n${correct} correct per game:`);
    console.log(`  → Level 5:  ${result.milestones.level5?.games || 'N/A'} games, ${result.milestones.level5?.timeMinutes || 'N/A'} min`);
    console.log(`  → Level 10: ${result.gamesPlayed} games, ${result.totalTimeMinutes} min`);
    results.push({ scenario: `Casual ${correct}/5`, ...result });
  });
  
  // ============================================
  // TIME ATTACK ONLY SCENARIOS
  // ============================================
  console.log('\n\n📊 TIME ATTACK SIMULATIONS (to Level 10)');
  console.log('-'.repeat(50));
  
  const timeAttackScenarios = [
    { name: '50% accuracy', correct: 15, questions: 30 },
    { name: '75% accuracy', correct: 22, questions: 30 },
    { name: '90% accuracy', correct: 27, questions: 30 }
  ];
  
  timeAttackScenarios.forEach(scenario => {
    const result = simulateToLevel(10, 'timeattack', {
      correct: scenario.correct,
      questionsAnswered: scenario.questions
    });
    console.log(`\n${scenario.name} (${scenario.correct}/${scenario.questions}):`);
    console.log(`  → Level 5:  ${result.milestones.level5?.games || 'N/A'} games, ${result.milestones.level5?.timeMinutes || 'N/A'} min`);
    console.log(`  → Level 10: ${result.gamesPlayed} games, ${result.totalTimeMinutes} min`);
    results.push({ scenario: `TimeAttack ${scenario.name}`, ...result });
  });
  
  // ============================================
  // 3 HEARTS SCENARIOS
  // ============================================
  console.log('\n\n📊 3 HEARTS SIMULATIONS (to Level 10)');
  console.log('-'.repeat(50));
  
  const threeHeartsScenarios = [
    { name: 'Average', correct: 15, survived: 18, streak: 8 },
    { name: 'Good', correct: 25, survived: 28, streak: 15 },
    { name: 'Expert', correct: 40, survived: 43, streak: 25 }
  ];
  
  threeHeartsScenarios.forEach(scenario => {
    const result = simulateToLevel(10, 'threehearts', {
      correct: scenario.correct,
      questionsSurvived: scenario.survived,
      streak: scenario.streak
    });
    console.log(`\n${scenario.name} (${scenario.correct} correct, ${scenario.streak} streak):`);
    console.log(`  → Level 5:  ${result.milestones.level5?.games || 'N/A'} games, ${result.milestones.level5?.timeMinutes || 'N/A'} min`);
    console.log(`  → Level 10: ${result.gamesPlayed} games, ${result.totalTimeMinutes} min`);
    results.push({ scenario: `3Hearts ${scenario.name}`, ...result });
  });
  
  // ============================================
  // HYBRID SCENARIOS
  // ============================================
  console.log('\n\n📊 HYBRID SIMULATIONS (Casual → Time Attack)');
  console.log('-'.repeat(50));
  
  const hybridResult = simulateToLevel(10, 'hybrid', {
    casualCorrect: 3,
    timeCorrect: 20,
    timeQuestions: 30
  });
  console.log(`\nCasual (3/5) until L5, then TimeAttack (20/30):`);
  console.log(`  → Level 5:  ${hybridResult.milestones.level5?.games || 'N/A'} games, ${hybridResult.milestones.level5?.timeMinutes || 'N/A'} min`);
  console.log(`  → Level 10: ${hybridResult.gamesPlayed} games, ${hybridResult.totalTimeMinutes} min`);
  
  // ============================================
  // XP PER RUN EXAMPLES
  // ============================================
  console.log('\n\n📊 XP PER SINGLE RUN');
  console.log('-'.repeat(50));
  
  console.log('\nCasual Mode (5 questions):');
  [0, 1, 2, 3, 4, 5].forEach(correct => {
    const result = simulateCasualRun(correct, 1);
    console.log(`  ${correct}/5 correct: ${result.totalXP} XP (Perf:${result.performanceXP} + Comp:${result.completionXP} + LCB:${result.lcb})`);
  });
  
  console.log('\nTime Attack Mode (60 sec):');
  [
    { c: 10, q: 20 },
    { c: 20, q: 30 },
    { c: 30, q: 40 }
  ].forEach(({ c, q }) => {
    const result = simulateTimeAttackRun(c, q);
    console.log(`  ${c}/${q} (${result.accuracy}%): ${result.totalXP} XP`);
  });
  
  console.log('\n3 Hearts Mode:');
  [
    { c: 10, s: 12, st: 5 },
    { c: 20, s: 23, st: 12 },
    { c: 40, s: 43, st: 25 }
  ].forEach(({ c, s, st }) => {
    const result = simulateThreeHeartsRun(c, s, st);
    console.log(`  ${c} correct, ${s} survived, ${st} streak: ${result.totalXP} XP`);
  });
  
  // ============================================
  // LEVEL THRESHOLDS
  // ============================================
  console.log('\n\n📊 LEVEL XP THRESHOLDS');
  console.log('-'.repeat(50));
  console.log('Level | XP Required | XP from Previous');
  [1, 2, 3, 4, 5, 10, 15, 20, 25, 50].forEach(level => {
    const xpNeeded = xpNeededForLevel(level);
    const prevXp = level > 1 ? xpNeededForLevel(level - 1) : 0;
    const diff = xpNeeded - prevXp;
    console.log(`  ${String(level).padStart(3)} | ${String(xpNeeded).padStart(8)} | +${diff}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ XP SIMULATOR READY — run specific scenarios above');
  console.log('='.repeat(60) + '\n');
  
  return results;
}

// ============================================
// SINGLE SCENARIO RUNNER
// ============================================

function runScenario(mode, targetLevel, pattern) {
  console.log('\n' + '-'.repeat(50));
  console.log(`Simulating: ${mode.toUpperCase()} to Level ${targetLevel}`);
  console.log('Pattern:', JSON.stringify(pattern));
  console.log('-'.repeat(50));
  
  const result = simulateToLevel(targetLevel, mode, pattern);
  
  console.log(`\n📊 Results:`);
  console.log(`  Final XP: ${result.finalXP}`);
  console.log(`  Games Played: ${result.gamesPlayed}`);
  console.log(`  Time Spent: ${result.totalTimeMinutes} minutes`);
  
  if (result.milestones.level5) {
    console.log(`\n  🔓 Level 5 (Time Attack Unlock):`);
    console.log(`     Games: ${result.milestones.level5.games}`);
    console.log(`     Time: ${result.milestones.level5.timeMinutes} min`);
  }
  
  if (result.milestones.level10) {
    console.log(`\n  🔓 Level 10 (3 Hearts Unlock):`);
    console.log(`     Games: ${result.milestones.level10.games}`);
    console.log(`     Time: ${result.milestones.level10.timeMinutes} min`);
  }
  
  console.log('\n📈 Level Progression:');
  result.levelLog.forEach(log => {
    console.log(`  Level ${log.level}: ${log.games} games, ${log.timeMinutes} min`);
  });
  
  return result;
}

// ============================================
// RUN ON EXECUTION
// ============================================

// Run all simulations when file is executed
runAllSimulations();

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simulateCasualRun,
    simulateTimeAttackRun,
    simulateThreeHeartsRun,
    simulateToLevel,
    runAllSimulations,
    runScenario,
    xpNeededForLevel
  };
}

