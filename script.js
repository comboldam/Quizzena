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

// ============================================
// 🌍 TRANSLATION SYSTEM (BUNDLED FOR NATIVE APPS)
// ============================================
// Translations are embedded directly (not fetched via HTTP)
// so they work inside Capacitor/Cordova native shells.

const LANGUAGE_DATA = {
  en: {"app_name":"Quizzena","version":"Quizzena v1 Beta","nav_home":"Home","nav_topics":"Topics","nav_stats":"Stats","nav_leaderboard":"Leaderboard","nav_profile":"Profile","home_quiz_of_day":"🏆 QUIZ OF THE DAY","home_play_now":"▶ PLAY NOW","home_explore_categories":"Explore Categories","home_quizzes":"quizzes","home_quiz":"quiz","category_geography":"Geography","category_football":"Football","category_movies":"Movies","category_tvshows":"TV Shows","category_history":"History","category_logos":"Logos","profile_settings":"Settings","profile_stats_quizzes":"Quizzes","profile_stats_wins":"Wins","profile_stats_accuracy":"Accuracy","profile_achievements":"Achievements","profile_progress":"Progress","stats_title":"Stats","stats_total_played":"Total Played","stats_total_correct":"Total Correct","stats_accuracy":"Accuracy","stats_best_streak":"Best Streak","stats_most_played":"Most Played","stats_overall_performance":"Overall Performance","stats_total_games_played":"Total Games Played","stats_total_questions_answered":"Total Questions Answered","stats_correct_answers":"Correct Answers","stats_wrong_answers":"Wrong Answers","stats_overall_accuracy":"Overall Accuracy","stats_avg_time_per_question":"Avg Time per Question","stats_best_streak_label":"Best Streak","stats_total_time_played":"Total Time Played","stats_games":"Games","stats_best_label":"Best","stats_search_topic":"Search Topic","stats_search_placeholder":"Type topic name...","stats_search_found":"Found:","stats_search_not_found":"Topic not found","leaderboard_title":"Leaderboard","leaderboard_global":"Global Rankings","leaderboard_coming_soon":"Coming Soon","game_score":"Score","game_timer":"Time","game_question":"Question","game_next":"Next","game_correct":"Correct!","game_wrong":"Wrong!","game_lives":"Lives","game_streak":"Streak","result_game_over":"Game Over","result_final_score":"Final Score","result_play_again":"Play Again","result_main_menu":"Main Menu","result_perfect":"Perfect Score!","result_great":"Great Job!","result_good":"Good Effort!","result_try_again":"Keep Practicing!","settings_title":"Settings","settings_language":"Language","settings_theme":"Theme","settings_sound":"Sound","settings_coming_soon":"Coming Soon","settings_close":"Close","sound_music":"Music","sound_effects":"Sound Effects","sound_volume":"Volume","sound_mute":"Mute","sound_unmute":"Unmute","mode_single_player":"Single Player","mode_two_player":"Two Player","mode_time_attack":"Time Attack","mode_quick_game":"Quick Game","mode_three_strikes":"Three Strikes","mode_select_mode":"Select Mode","mode_back":"Back","difficulty_easy":"Easy","difficulty_medium":"Medium","difficulty_hard":"Hard","difficulty_select":"Select Difficulty","common_loading":"Loading...","common_error":"Error","common_retry":"Retry","common_cancel":"Cancel","common_confirm":"Confirm","common_save":"Save","common_reset":"Reset","common_yes":"Yes","common_no":"No"},
  es: {"app_name":"Quizzena","version":"Quizzena v1 Beta","nav_home":"Inicio","nav_topics":"Temas","nav_stats":"Estadísticas","nav_leaderboard":"Clasificación","nav_profile":"Perfil","home_quiz_of_day":"🏆 QUIZ DEL DÍA","home_play_now":"▶ JUGAR","home_explore_categories":"Explorar Categorías","home_quizzes":"quizzes","home_quiz":"quiz","category_geography":"Geografía","category_football":"Fútbol","category_movies":"Películas","category_tvshows":"Series","category_history":"Historia","category_logos":"Logos","profile_settings":"Ajustes","profile_stats_quizzes":"Quizzes","profile_stats_wins":"Victorias","profile_stats_accuracy":"Precisión","profile_achievements":"Logros","profile_progress":"Progreso","stats_title":"Estadísticas","stats_total_played":"Total Jugados","stats_total_correct":"Total Correctas","stats_accuracy":"Precisión","stats_best_streak":"Mejor Racha","stats_most_played":"Más Jugados","stats_overall_performance":"Rendimiento General","stats_total_games_played":"Total de Partidas Jugadas","stats_total_questions_answered":"Total de Preguntas Respondidas","stats_correct_answers":"Respuestas Correctas","stats_wrong_answers":"Respuestas Incorrectas","stats_overall_accuracy":"Precisión General","stats_avg_time_per_question":"Tiempo Promedio por Pregunta","stats_best_streak_label":"Mejor Racha","stats_total_time_played":"Tiempo Total Jugado","stats_games":"Partidas","stats_best_label":"Mejor","stats_search_topic":"Buscar Tema","stats_search_placeholder":"Escribe el nombre del tema...","stats_search_found":"Encontrado:","stats_search_not_found":"Tema no encontrado","leaderboard_title":"Clasificación","leaderboard_global":"Ranking Global","leaderboard_coming_soon":"Próximamente","game_score":"Puntuación","game_timer":"Tiempo","game_question":"Pregunta","game_next":"Siguiente","game_correct":"¡Correcto!","game_wrong":"¡Incorrecto!","game_lives":"Vidas","game_streak":"Racha","result_game_over":"Fin del Juego","result_final_score":"Puntuación Final","result_play_again":"Jugar de Nuevo","result_main_menu":"Menú Principal","result_perfect":"¡Puntuación Perfecta!","result_great":"¡Excelente!","result_good":"¡Buen Trabajo!","result_try_again":"¡Sigue Practicando!","settings_title":"Ajustes","settings_language":"Idioma","settings_theme":"Tema","settings_sound":"Sonido","settings_coming_soon":"Próximamente","settings_close":"Cerrar","sound_music":"Música","sound_effects":"Efectos de Sonido","sound_volume":"Volumen","sound_mute":"Silenciar","sound_unmute":"Activar Sonido","mode_single_player":"Un Jugador","mode_two_player":"Dos Jugadores","mode_time_attack":"Contrarreloj","mode_quick_game":"Partida Rápida","mode_three_strikes":"Tres Strikes","mode_select_mode":"Seleccionar Modo","mode_back":"Atrás","difficulty_easy":"Fácil","difficulty_medium":"Medio","difficulty_hard":"Difícil","difficulty_select":"Seleccionar Dificultad","common_loading":"Cargando...","common_error":"Error","common_retry":"Reintentar","common_cancel":"Cancelar","common_confirm":"Confirmar","common_save":"Guardar","common_reset":"Restablecer","common_yes":"Sí","common_no":"No"},
  ru: {"app_name":"Quizzena","version":"Quizzena v1 Бета","nav_home":"Главная","nav_topics":"Темы","nav_stats":"Статистика","nav_leaderboard":"Рейтинг","nav_profile":"Профиль","home_quiz_of_day":"🏆 ВИКТОРИНА ДНЯ","home_play_now":"▶ ИГРАТЬ","home_explore_categories":"Категории","home_quizzes":"викторин","home_quiz":"викторина","category_geography":"География","category_football":"Футбол","category_movies":"Фильмы","category_tvshows":"Сериалы","category_history":"История","category_logos":"Логотипы","profile_settings":"Настройки","profile_stats_quizzes":"Викторины","profile_stats_wins":"Победы","profile_stats_accuracy":"Точность","profile_achievements":"Достижения","profile_progress":"Прогресс","stats_title":"Статистика","stats_total_played":"Всего сыграно","stats_total_correct":"Правильных ответов","stats_accuracy":"Точность","stats_best_streak":"Лучшая серия","stats_most_played":"Часто играемые","stats_overall_performance":"Общая статистика","stats_total_games_played":"Всего игр","stats_total_questions_answered":"Всего вопросов","stats_correct_answers":"Правильные ответы","stats_wrong_answers":"Неправильные ответы","stats_overall_accuracy":"Общая точность","stats_avg_time_per_question":"Среднее время на вопрос","stats_best_streak_label":"Лучшая серия","stats_total_time_played":"Общее время игры","stats_games":"Игры","stats_best_label":"Лучший","stats_search_topic":"Поиск темы","stats_search_placeholder":"Введите название темы...","stats_search_found":"Найдено:","stats_search_not_found":"Тема не найдена","leaderboard_title":"Рейтинг","leaderboard_global":"Мировой рейтинг","leaderboard_coming_soon":"Скоро","game_score":"Счёт","game_timer":"Время","game_question":"Вопрос","game_next":"Далее","game_correct":"Правильно!","game_wrong":"Неправильно!","game_lives":"Жизни","game_streak":"Серия","result_game_over":"Игра окончена","result_final_score":"Итоговый счёт","result_play_again":"Играть снова","result_main_menu":"Главное меню","result_perfect":"Идеальный результат!","result_great":"Отлично!","result_good":"Хорошо!","result_try_again":"Продолжай практиковаться!","settings_title":"Настройки","settings_language":"Язык","settings_theme":"Тема","settings_sound":"Звук","settings_coming_soon":"Скоро","settings_close":"Закрыть","sound_music":"Музыка","sound_effects":"Звуковые эффекты","sound_volume":"Громкость","sound_mute":"Выключить звук","sound_unmute":"Включить звук","mode_single_player":"Один игрок","mode_two_player":"Два игрока","mode_time_attack":"На время","mode_quick_game":"Быстрая игра","mode_three_strikes":"Три ошибки","mode_select_mode":"Выберите режим","mode_back":"Назад","difficulty_easy":"Легко","difficulty_medium":"Средне","difficulty_hard":"Сложно","difficulty_select":"Выберите сложность","common_loading":"Загрузка...","common_error":"Ошибка","common_retry":"Повторить","common_cancel":"Отмена","common_confirm":"Подтвердить","common_save":"Сохранить","common_reset":"Сбросить","common_yes":"Да","common_no":"Нет"},
  tr: {"app_name":"Quizzena","version":"Quizzena v1 Beta","nav_home":"Ana Sayfa","nav_topics":"Konular","nav_stats":"İstatistikler","nav_leaderboard":"Sıralama","nav_profile":"Profil","home_quiz_of_day":"🏆 GÜNÜN BİLMECESİ","home_play_now":"▶ OYNA","home_explore_categories":"Kategorileri Keşfet","home_quizzes":"bilmece","home_quiz":"bilmece","category_geography":"Coğrafya","category_football":"Futbol","category_movies":"Filmler","category_tvshows":"Diziler","category_history":"Tarih","category_logos":"Logolar","profile_settings":"Ayarlar","profile_stats_quizzes":"Bilmeceler","profile_stats_wins":"Kazanımlar","profile_stats_accuracy":"Doğruluk","profile_achievements":"Başarılar","profile_progress":"İlerleme","stats_title":"İstatistikler","stats_total_played":"Toplam Oynanan","stats_total_correct":"Toplam Doğru","stats_accuracy":"Doğruluk","stats_best_streak":"En İyi Seri","stats_most_played":"En Çok Oynanan","stats_overall_performance":"Genel Performans","stats_total_games_played":"Toplam Oynanan Oyun","stats_total_questions_answered":"Toplam Yanıtlanan Soru","stats_correct_answers":"Doğru Cevaplar","stats_wrong_answers":"Yanlış Cevaplar","stats_overall_accuracy":"Genel Doğruluk","stats_avg_time_per_question":"Soru Başına Ortalama Süre","stats_best_streak_label":"En İyi Seri","stats_total_time_played":"Toplam Oynama Süresi","stats_games":"Oyunlar","stats_best_label":"En İyi","stats_search_topic":"Konu Ara","stats_search_placeholder":"Konu adını yaz...","stats_search_found":"Bulundu:","stats_search_not_found":"Konu bulunamadı","leaderboard_title":"Sıralama","leaderboard_global":"Dünya Sıralaması","leaderboard_coming_soon":"Yakında","game_score":"Puan","game_timer":"Süre","game_question":"Soru","game_next":"Sonraki","game_correct":"Doğru!","game_wrong":"Yanlış!","game_lives":"Can","game_streak":"Seri","result_game_over":"Oyun Bitti","result_final_score":"Final Puanı","result_play_again":"Tekrar Oyna","result_main_menu":"Ana Menü","result_perfect":"Mükemmel Skor!","result_great":"Harika!","result_good":"İyi İş!","result_try_again":"Pratik Yapmaya Devam Et!","settings_title":"Ayarlar","settings_language":"Dil","settings_theme":"Tema","settings_sound":"Ses","settings_coming_soon":"Yakında","settings_close":"Kapat","sound_music":"Müzik","sound_effects":"Ses Efektleri","sound_volume":"Ses Seviyesi","sound_mute":"Sessiz","sound_unmute":"Sesi Aç","mode_single_player":"Tek Oyuncu","mode_two_player":"İki Oyuncu","mode_time_attack":"Zamana Karşı","mode_quick_game":"Hızlı Oyun","mode_three_strikes":"Üç Hak","mode_select_mode":"Mod Seç","mode_back":"Geri","difficulty_easy":"Kolay","difficulty_medium":"Orta","difficulty_hard":"Zor","difficulty_select":"Zorluk Seç","common_loading":"Yükleniyor...","common_error":"Hata","common_retry":"Tekrar Dene","common_cancel":"İptal","common_confirm":"Onayla","common_save":"Kaydet","common_reset":"Sıfırla","common_yes":"Evet","common_no":"Hayır"}
};

let currentLanguage = localStorage.getItem('quizzena_language') || 'en';
let translations = LANGUAGE_DATA[currentLanguage] || LANGUAGE_DATA.en;

// Load language (sync - no HTTP needed, works in native apps)
function loadLanguage(lang) {
  if (!LANGUAGE_DATA[lang]) {
    lang = 'en'; // Fallback to English
  }
  translations = LANGUAGE_DATA[lang];
  currentLanguage = lang;
  localStorage.setItem('quizzena_language', lang);
  applyTranslations();
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
    'nav-stats': 'nav_stats',
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

  // Update leaderboard title
  const leaderboardHeader = document.querySelector('.leaderboard-header h1 [data-i18n="leaderboard_title"]');
  if (leaderboardHeader && translations.leaderboard_title) {
    leaderboardHeader.textContent = translations.leaderboard_title;
  }

  const leaderboardSubtitle = document.querySelector('.leaderboard-header p');
  if (leaderboardSubtitle && translations.leaderboard_global) {
    leaderboardSubtitle.textContent = translations.leaderboard_global;
  }
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLanguage);
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

  // Reset session stats
  currentSessionCorrect = 0;
  currentSessionWrong = 0;
  currentStreak = 0;
  bestSessionStreak = 0;
  sessionStartTime = new Date();
  gameEnded = false;
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

quickGameBtn.onclick = () => {
  playClickSound();
  resetGame();
  gameMode = 'quick-game';
  maxQuestions = GAME_CONFIG.QUICK_GAME_QUESTIONS;
  modeSelect.classList.add("hidden");
  game.classList.remove("hidden");
  loadFlags();
};

threeStrikesBtn.onclick = () => {
  playClickSound();
  resetGame();
  gameMode = 'three-strikes';
  livesRemaining = GAME_CONFIG.THREE_STRIKES_LIVES;
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

  // List of topics that track stats
  const trackedTopics = ALL_TOPICS;

  // Track timeout as wrong answer for all supported topics
  if (trackedTopics.includes(currentTopic)) {
    currentSessionWrong++;
    currentStreak = 0;
  }

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
  // Don't start new round if game ended
  if (gameEnded) return;

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
    const imageBase = USE_LOCAL_IMAGES ? './images.js/capital_images/' : CLOUDINARY_BASE_URL;
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
    const borderPath = `images.js/country_silhouettes/${randomFlag.isoCode}.png`;
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
      flagImg.src = `images.js/country_silhouettes/${randomFlag.isoCode}.png`;
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
  
  // List of topics that track stats
  const trackedTopics = ALL_TOPICS;

  if (gameMode === 'time-attack') {
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
      resultBox.textContent = `❌ Wrong!`;
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
    
  } else if (gameMode === 'quick-game') {
    answered = true;
    clearInterval(timer);
    disableAnswers();

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
      resultBox.textContent = `❌ Wrong! It was ${correct}`;
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
    
  } else if (gameMode === 'three-strikes') {
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
  playClickSound();
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
const navStats = document.getElementById('nav-stats');
const navLeaderboard = document.getElementById('nav-leaderboard');
const navProfile = document.getElementById('nav-profile');

const homeView = document.getElementById('home-view');
const topicsView = document.getElementById('topics-view');
const profileView = document.getElementById('profile-view');

const browseAllBtn = document.getElementById('browse-all-topics');

// ========================================
// 🎬 PREMIUM SCREEN TRANSITIONS
// ========================================

// Navigation order for directional slides (left to right)
const NAV_ORDER = ['home', 'topics', 'stats', 'leaderboard', 'profile'];
let currentNavIndex = 0;

// Get all main views
const allViews = {
  home: homeView,
  topics: topicsView,
  stats: document.getElementById('stats-view'),
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
  const newIndex = NAV_ORDER.indexOf('home');
  const direction = newIndex < currentNavIndex ? 'left' : 'right';
  currentNavIndex = newIndex;
  
  hideAllViewsExcept('home');
  applyNavAnimation(homeView, direction);

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navHome.classList.add('active');
}

// Show Topics screen
function showTopics() {
  const newIndex = NAV_ORDER.indexOf('topics');
  const direction = newIndex < currentNavIndex ? 'left' : 'right';
  currentNavIndex = newIndex;
  
  hideAllViewsExcept('topics');
  applyNavAnimation(topicsView, direction);

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navTopics.classList.add('active');
}

// Show Profile screen (slides from bottom - it's special)
function showProfile() {
  currentNavIndex = NAV_ORDER.indexOf('profile');
  
  hideAllViewsExcept('profile');
  applyNavAnimation(profileView, 'bottom');

  // Update active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  navProfile.classList.add('active');
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
  }
});

// ========================================
// ⚙️ SETTINGS MODAL
// ========================================
const settingsModal = document.getElementById('settings-modal');
const settingsModalBackdrop = document.getElementById('settings-modal-backdrop');
const settingsModalClose = document.getElementById('settings-modal-close');
const languageSelect = document.getElementById('language-select');
const profileSettingsBtn = document.querySelector('.profile-settings');

// Open settings modal
function openSettingsModal() {
  if (settingsModal) {
    // Set current language in dropdown
    if (languageSelect) {
      languageSelect.value = currentLanguage;
    }
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

// Language change handler
if (languageSelect) {
  languageSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    loadLanguage(newLang);
  });
}


// ========================================
// PERFORMANCE MODE SYSTEM
// ========================================

const performanceToggle = document.getElementById('performance-toggle');

// Check if device is mobile/touch
function isMobileDevice() {
  return (window.innerWidth <= 900) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

// Load performance mode from localStorage (default: auto-detect based on device)
function loadPerformanceMode() {
  const savedMode = localStorage.getItem('quizzena_performance_mode');
  
  if (savedMode !== null) {
    return savedMode === 'low';
  } else {
    return isMobileDevice();
  }
}

// Apply performance mode to body
function applyPerformanceMode(isLowMode) {
  if (isLowMode) {
    document.body.classList.add('performance-mode-low');
  } else {
    document.body.classList.remove('performance-mode-low');
  }
  
  if (performanceToggle) {
    performanceToggle.checked = isLowMode;
  }
}

// Save performance mode preference
function savePerformanceMode(isLowMode) {
  localStorage.setItem('quizzena_performance_mode', isLowMode ? 'low' : 'high');
  applyPerformanceMode(isLowMode);
}

// Initialize performance mode on page load
const isLowPerformance = loadPerformanceMode();
applyPerformanceMode(isLowPerformance);

// Toggle event listener
if (performanceToggle) {
  performanceToggle.addEventListener('change', (e) => {
    playClickSound();
    savePerformanceMode(e.target.checked);
  });
}

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

// Sound effect audio element
const clickSound = new Audio('sounds/click.mp3');

// Save sound settings
function saveSoundSettings() {
  localStorage.setItem('quizzena_sound_settings', JSON.stringify(soundSettings));
}

// Play click sound effect
function playClickSound() {
  if (soundSettings.sfxMuted) return;
  
  clickSound.volume = soundSettings.sfxVolume / 100;
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
    // Update UI with current settings
    if (sfxVolumeSlider) sfxVolumeSlider.value = soundSettings.sfxVolume;
    if (sfxVolumeValue) sfxVolumeValue.textContent = soundSettings.sfxVolume + '%';
    updateMuteButtonUI();
    
    soundOverlay.classList.remove('hidden');
  }
}

// Close Sound Overlay (back to Settings)
function closeSoundOverlay() {
  if (soundOverlay) {
    soundOverlay.classList.add('hidden');
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

navStats.addEventListener('click', () => {
  playClickSound();
  showStats();
});

navProfile.addEventListener('click', () => {
  playClickSound();
  showProfile();
});

// Settings button - now handled by openSettingsModal() above

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

  // Show mode selection for all quizzes (Area uses medium difficulty by default)
  modeScreen.innerHTML = `
      <button onclick="playClickSound(); exitUnifiedQuiz()" style="position:absolute;top:15px;left:15px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 15px;border-radius:8px;font-size:1.2rem;cursor:pointer;font-weight:bold;transition:all 0.3s ease;">←</button>
      <h2 style="color:#fff;font-size:28px;margin-bottom:10px;">${icon} ${quizName} Quiz</h2>
      <h3 style="color:#a78bfa;font-size:18px;margin-bottom:30px;">Choose Game Mode</h3>

      <button onclick="playClickSound(); startUnifiedGame('time-attack')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF6B6B,#ee5a5a);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(255, 107, 107, 0.4);">⏱️ Time Attack (60s)</button>

      <button onclick="playClickSound(); startUnifiedGame('quick-game')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">⚡ Quick Game (10 questions)</button>

      <button onclick="playClickSound(); startUnifiedGame('three-strikes')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#9C27B0,#7B1FA2);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(156, 39, 176, 0.4);">💥 Three Strikes</button>

      <button onclick="playClickSound(); startUnifiedGame('two-player')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">👥 2 Players</button>
    `;

  modeScreen.classList.remove('hidden');
}

// Area difficulty selection handler
function selectAreaDifficulty(difficulty) {
  playClickSound();
  selectedDifficulty = difficulty;

  // Update mode screen to show game modes
  const modeScreen = document.getElementById('unified-mode-screen');
  modeScreen.innerHTML = `
    <button onclick="playClickSound(); showUnifiedModeSelection('Area', '📏')" style="position:absolute;top:15px;left:15px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 15px;border-radius:8px;font-size:1.2rem;cursor:pointer;font-weight:bold;transition:all 0.3s ease;">←</button>
    <h2 style="color:#fff;font-size:28px;margin-bottom:10px;">📏 Area Quiz</h2>
    <h3 style="color:#a78bfa;font-size:18px;margin-bottom:30px;">Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h3>

    <button onclick="playClickSound(); startUnifiedGame('time-attack')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF6B6B,#ee5a5a);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(255, 107, 107, 0.4);">⏱️ Time Attack (60s)</button>

    <button onclick="playClickSound(); startUnifiedGame('quick-game')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">⚡ Quick Game (10 questions)</button>

    <button onclick="playClickSound(); startUnifiedGame('three-strikes')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#9C27B0,#7B1FA2);color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(156, 39, 176, 0.4);">💥 Three Strikes</button>

    <button onclick="playClickSound(); startUnifiedGame('two-player')" style="width:80%;max-width:300px;padding:18px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">👥 2 Players</button>
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
      // Special handling for logos - use Cloudinary SVG
      if (currentTopic === 'logos') {
        const filename = randomFlag.image.replace('logo_images/', '');
        imageSrc = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/Quizzena/logos/${filename}`;
        imageClass = 'logo-image';
      } else {
        imageSrc = randomFlag.image;
      }
    } else {
      imageHTML = `<div style="font-size:80px;margin:20px 0;">${config.icon}</div>`;
    }
  } else if (currentTopic === 'flags') {
    imageSrc = randomFlag.flag;
  } else if (currentTopic === 'capitals') {
    const sanitizedCapital = randomFlag.capital.replace(/[/\\?%*:|"<>]/g, "_");
    // Use Cloudinary CDN or local images based on configuration
    imageSrc = USE_LOCAL_IMAGES
      ? `./images.js/capital_images/${sanitizedCapital}.jpg`
      : `${CLOUDINARY_BASE_URL}${sanitizedCapital}.jpg`;
    // DEBUG: Log unified quiz system image URL
    console.log('[Unified Quiz] Loading capital image:', imageSrc);
  } else if (currentTopic === 'borders') {
    imageSrc = `images.js/country_silhouettes/${randomFlag.isoCode}.png`;
    imageClass = 'border-style';
  } else if (currentTopic === 'area') {
    const missingBorders = ['xk', 'mh', 'fm', 'ps', 'tv'];
    if (missingBorders.includes(randomFlag.isoCode)) {
      imageSrc = `https://flagcdn.com/w320/${randomFlag.isoCode}.png`;
    } else {
      imageSrc = `images.js/country_silhouettes/${randomFlag.isoCode}.png`;
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

  // Render the screen
  quizScreen.innerHTML = `
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
  // SAVE STATS FIRST (completed = true because quiz finished naturally)
  const trackedTopics = ALL_TOPICS;
  if (trackedTopics.includes(currentTopic)) {
    saveQuizStats(currentTopic, true);
  }

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

  // Use session tracking for accurate percentage (avoids phantom +1 bug)
  const totalAnswered = currentSessionCorrect + currentSessionWrong;
  const percentage = gameMode === 'two' ? 0 : (totalAnswered > 0 ? Math.round((currentSessionCorrect / totalAnswered) * 100) : 0);
  const message = percentage >= 80 ? '🏆 Excellent!' : percentage >= 60 ? '⭐ Great Job!' : percentage >= 40 ? '👍 Good Effort!' : '💪 Keep Practicing!';

  quizScreen.innerHTML = `
    <div style="text-align:center;max-width:400px;">
      <h2 style="color:#FFD700;font-size:32px;margin-bottom:10px;">${resultText}</h2>
      <div style="background:rgba(255,255,255,0.1);border-radius:20px;padding:30px;margin:20px 0;box-shadow:0 8px 30px rgba(124, 58, 237, 0.3);">
        <div style="color:#a78bfa;font-size:48px;font-weight:bold;">${scoreDisplay}</div>
        ${gameMode !== 'two' ? `<div style="color:#fff;font-size:20px;margin-top:10px;">${percentage}% Correct</div>` : ''}
      </div>
      ${gameMode !== 'two' ? `<p style="color:#a78bfa;font-size:18px;margin:20px 0;">${message}</p>` : ''}

      <button onclick="playClickSound(); restartUnifiedQuiz()" style="width:100%;padding:16px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,rgba(124, 58, 237, 0.9),rgba(72, 52, 212, 0.9));color:#fff;cursor:pointer;box-shadow:0 8px 25px rgba(124, 58, 237, 0.4);">Play Again</button>
      <button onclick="playClickSound(); exitUnifiedQuiz()" style="width:100%;padding:16px;margin:10px 0;font-size:18px;border:none;border-radius:12px;background:linear-gradient(135deg,#666,#555);color:#fff;cursor:pointer;">Back to Topics</button>
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
  // Save stats before exiting (completed = false because user quit early)
  // This applies to all tracked topics - stats won't be saved for early exits
  const trackedTopics = ALL_TOPICS;
  if (trackedTopics.includes(currentTopic)) {
    saveQuizStats(currentTopic, false);
  }

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
  const newIndex = NAV_ORDER.indexOf('stats');
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
  if (statsView) {
    statsView.classList.remove('hidden');
    applyNavAnimation(statsView, direction);
  }
  if (leaderboardView) leaderboardView.classList.add('hidden');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navStats = document.getElementById('nav-stats');
  if (navStats) navStats.classList.add('active');

  // Populate Overall Performance stats from userData
  const totalGames = userData.stats.totalGames || 0;
  const correctAnswers = userData.stats.correctAnswers || 0;
  const wrongAnswers = userData.stats.wrongAnswers || 0;
  const totalQuestions = correctAnswers + wrongAnswers;
  const accuracy = userData.stats.accuracy || 0;
  const bestStreak = userData.stats.bestStreak || 0;
  const totalTimeSeconds = userData.stats.totalTimeSeconds || 0;

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

  // Calculate avg time per question
  const avgTime = totalQuestions > 0 ? (totalTimeSeconds / totalQuestions).toFixed(1) : '0.0';
  const statAvgTime = document.getElementById('stat-avg-time');
  if (statAvgTime) statAvgTime.textContent = avgTime + 's';

  // Format total time played
  const minutes = Math.floor(totalTimeSeconds / 60);
  const seconds = totalTimeSeconds % 60;
  const statTotalTime = document.getElementById('stat-total-time');
  if (statTotalTime) statTotalTime.textContent = `${minutes}m ${seconds}s`;

  // Update Most Played section - dynamically sorted by games played
  const topicDefinitions = Object.entries(TOPIC_CONFIG).map(([id, cfg]) => ({
    id: id,
    name: cfg.name,
    icon: cfg.icon
  }));

  // Get stats for each topic and sort by games played (descending), then alphabetically
  const topicsWithStats = topicDefinitions.map(topic => {
    const stats = userData.stats.topics[topic.id] || { games: 0, accuracy: 0, bestStreak: 0 };
    return {
      ...topic,
      games: stats.games || 0,
      accuracy: stats.accuracy || 0,
      bestStreak: stats.bestStreak || 0
    };
  });

  // Sort: by games (descending), then by name (alphabetically) for ties
  topicsWithStats.sort((a, b) => {
    if (b.games !== a.games) return b.games - a.games;
    return a.name.localeCompare(b.name);
  });

  // Update the 3 Most Played cards
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

    // Update stats
    const miniStatValues = card.querySelectorAll('.mini-stat-value');
    if (miniStatValues[0]) miniStatValues[0].textContent = topic.games;
    if (miniStatValues[1]) miniStatValues[1].textContent = topic.accuracy + '%';
    if (miniStatValues[2]) miniStatValues[2].textContent = topic.bestStreak;
  }

  console.log('Stats page populated:', { totalGames, totalQuestions, accuracy, bestStreak, topicsWithStats });
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
    const topicStats = userData.stats.topics[foundKey] || { games: 0, accuracy: 0, bestStreak: 0 };
    const games = topicStats.games || 0;
    const accuracy = topicStats.accuracy || 0;
    const bestStreak = topicStats.bestStreak || 0;

    // Show found topic with real stats
    searchResult.innerHTML = `
      <div class="search-result-found">${t('stats_search_found')}</div>
      <div class="search-result-topic">${foundTopic.icon} ${foundTopic.name}</div>
      <div class="search-result-stats">
        <div class="mini-stat">
          <span class="mini-stat-label">${t('stats_games')}</span>
          <span class="mini-stat-value">${games}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">${t('stats_accuracy')}</span>
          <span class="mini-stat-value">${accuracy}%</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">${t('stats_best_label')}</span>
          <span class="mini-stat-value">${bestStreak}</span>
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
// 🏆 LEADERBOARD PAGE FUNCTIONS
// ========================================

// Show Leaderboard screen
function showLeaderboard() {
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
    playClickSound();
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
  };
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
    }
  };
}

// Save profile
const setupSaveBtn = document.getElementById('setup-save-btn');
if (setupSaveBtn) {
  setupSaveBtn.onclick = () => {
    playClickSound();
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

// Update all stats displays (Profile + Overall Performance use same data)
function updateAllStatsDisplays() {
  const accuracy = userData.stats.accuracy || 0;
  const totalGames = userData.stats.totalGames || 0;

  // Update Profile Stats Row - Games (1st stat-item)
  const statItems = document.querySelectorAll('.profile-stats-row .stat-item');
  if (statItems[0]) statItems[0].querySelector('.stat-value').textContent = totalGames;

  // Update Profile Stats Row - Accuracy (2nd stat-item)
  if (statItems[1]) statItems[1].querySelector('.stat-value').textContent = accuracy + '%';

  console.log('Stats displays updated:', { totalGames, accuracy });
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

  // Initialize topic stats if not exists
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

  // Update topic stats
  if (completed) {
    topic.games++;
    userData.stats.totalGames++;
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
    topicStats: topic,
    globalAccuracy: userData.stats.accuracy
  });
}

// Run on page load
checkFirstTimeUser();
updateProfileDisplay();
updateAllStatsDisplays();
