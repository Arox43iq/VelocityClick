Aquí tienes el contenido completo que debes colocar dentro de tu archivo script.js:

JavaScript
const translations = {
  es: { timeLeft: "Tiempo restante", unit: "seg", darkMode: "🌙 Modo Oscuro", lightMode: "☀️ Modo Claro" },
  en: { timeLeft: "Time left", unit: "sec", darkMode: "🌙 Dark Mode", lightMode: "☀️ Light Mode" }
};

const currentLang = (navigator.language || navigator.userLanguage).startsWith('es') ? 'es' : 'en';
const themeToggleBtn = document.getElementById('theme-toggle');

function loadUtterances(isDark) {
  const container = document.getElementById('utterances-container');
  // Evitamos recargar el script si ya fue insertado para mantener la sesión y los comentarios estables
  if (container.querySelector('script')) {
    const iframe = container.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'set-theme',
        theme: isDark ? 'github-dark' : 'github-light'
      }, 'https://utteranc.es');
    }
    return;
  }

  container.innerHTML = '';
  const script = document.createElement('script');
  script.src = 'https://utteranc.es/client.js';
  script.setAttribute('repo', 'Arox43iq/Clicks-Per-Second-Test');
  script.setAttribute('issue-term', 'pathname');
  script.setAttribute('theme', isDark ? 'github-dark' : 'github-light');
  script.setAttribute('crossorigin', 'anonymous');
  script.async = true;
  container.appendChild(script);
}

function setThemeUI(isDark) {
  document.documentElement.classList.toggle('dark-mode', isDark);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = translations[currentLang][isDark ? 'lightMode' : 'darkMode'];
  }
  loadUtterances(isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark-mode');
  const newDarkState = !isDark;
  localStorage.setItem('velocityClickTheme', newDarkState ? 'dark' : 'light');
  setThemeUI(newDarkState);
}

// Inicializar tema al cargar la página
setThemeUI(localStorage.getItem('velocityClickTheme') === 'dark');

let timeTotal = 20, timeLeft = 20, score = 0, timer = null, cpsHistory = [], clicksThisSecond = 0, gameStarted = false, lastSecondChecked = 20;
const timerElement = document.getElementById('timer'), 
      scoreElement = document.getElementById('score'), 
      clicker = document.getElementById('clicker'), 
      resetBtn = document.getElementById('resetBtn'), 
      statsDiv = document.getElementById('stats');

function formatTime(s) { 
  return `${translations[currentLang].timeLeft}: ${s.toFixed(2).replace('.', ',')} ${translations[currentLang].unit}`; 
}

function setTime(seconds) {
  if (gameStarted && timer) return;
  timeTotal = timeLeft = lastSecondChecked = seconds;
  timerElement.textContent = formatTime(timeLeft);
  document.querySelectorAll('.time-btn').forEach(btn => btn.classList.toggle('active', btn.textContent === seconds + 's'));
}

function updateStats() {
  if (!cpsHistory.length) return;
  document.getElementById('maxCPS').textContent = Math.max(...cpsHistory);
  document.getElementById('minCPS').textContent = Math.min(...cpsHistory);
  document.getElementById('avgCPS').textContent = (cpsHistory.reduce((a, b) => a + b, 0) / cpsHistory.length).toFixed(2);
  
  let record = parseInt(localStorage.getItem('clickerPersonalRecord_' + timeTotal) || '0', 10);
  if (score > record) { 
    localStorage.setItem('clickerPersonalRecord_' + timeTotal, score); 
    record = score; 
  }
  document.getElementById('personalRecord').textContent = record;
}

function startTimer() {
  if (timer) return;
  gameStarted = true;
  document.querySelectorAll('.time-btn').forEach(btn => btn.style.opacity = '0.6');
  let startTime = performance.now(), durationMs = timeTotal * 1000;

  timer = setInterval(() => {
    let remainingMs = durationMs - (performance.now() - startTime);
    if (remainingMs <= 0) {
      timeLeft = 0;
      timerElement.textContent = formatTime(timeLeft);
      clearInterval(timer);
      timer = null;
      clicker.disabled = true;
      resetBtn.style.display = 'block';
      statsDiv.style.display = 'block';
      cpsHistory.push(clicksThisSecond);
      clicksThisSecond = 0;
      updateStats();
      return;
    }
    timeLeft = remainingMs / 1000;
    timerElement.textContent = formatTime(timeLeft);
    let currentSecondFloor = Math.ceil(timeLeft);
    if (currentSecondFloor < lastSecondChecked) {
      cpsHistory.push(clicksThisSecond);
      clicksThisSecond = 0;
      lastSecondChecked = currentSecondFloor;
    }
  }, 10);
}

if (timerElement) {
  timerElement.textContent = formatTime(timeLeft);
}

if (clicker) {
  clicker.addEventListener('click', () => {
    if (timeLeft > 0) {
      score++;
      clicksThisSecond++;
      scoreElement.textContent = score;
      startTimer();
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = lastSecondChecked = timeTotal;
    cpsHistory = [];
    clicksThisSecond = gameStarted = false;
    timerElement.textContent = formatTime(timeLeft);
    scoreElement.textContent = score;
    clicker.disabled = false;
    resetBtn.style.display = statsDiv.style.display = 'none';
    document.querySelectorAll('.time-btn').forEach(btn => btn.style.opacity = '1');
  });
}
