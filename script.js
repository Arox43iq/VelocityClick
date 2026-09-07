document.addEventListener("DOMContentLoaded", () => {
  const translations = {
    es: { timeLeft: "Tiempo restante", unit: "seg", darkMode: "🌙 Modo Oscuro", lightMode: "☀️ Modo Claro" },
    en: { timeLeft: "Time left", unit: "sec", darkMode: "🌙 Dark Mode", lightMode: "☀️ Light Mode" }
  };

  const currentLang = (navigator.language || navigator.userLanguage).startsWith('es') ? 'es' : 'en';
  const themeToggleBtn = document.getElementById('theme-toggle');

  function loadUtterances(isDark) {
    const container = document.getElementById('utterances-container');
    if (!container) return;

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

  window.toggleTheme = function() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const newDarkState = !isDark;
    localStorage.setItem('velocityClickTheme', newDarkState ? 'dark' : 'light');
    setThemeUI(newDarkState);
  };

  // Inicializar tema guardado
  setThemeUI(localStorage.getItem('velocityClickTheme') === 'dark');

  let timeTotal = 20, timeLeft = 20, score = 0, timer = null, cpsHistory = [], clicksThisSecond = 0, gameStarted = false, lastSecondChecked = 20;
  const timerElement = document.getElementById('timer');
  const scoreElement = document.getElementById('score');
  const clicker = document.getElementById('clicker');
  const resetBtn = document.getElementById('resetBtn');
  const statsDiv = document.getElementById('stats');

  function formatTime(s) { 
    return `${translations[currentLang].timeLeft}: ${s.toFixed(2).replace('.', ',')} ${translations[currentLang].unit}`; 
  }

  window.setTime = function(seconds) {
    if (gameStarted && timer) return;
    timeTotal = timeLeft = lastSecondChecked = seconds;
    if (timerElement) timerElement.textContent = formatTime(timeLeft);
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(seconds + 's'));
    });
  };

  function updateStats() {
    if (!cpsHistory.length) return;
    const maxEl = document.getElementById('maxCPS');
    const minEl = document.getElementById('minCPS');
    const avgEl = document.getElementById('avgCPS');
    const recEl = document.getElementById('personalRecord');

    if (maxEl) maxEl.textContent = Math.max(...cpsHistory);
    if (minEl) minEl.textContent = Math.min(...cpsHistory);
    if (avgEl) avgEl.textContent = (cpsHistory.reduce((a, b) => a + b, 0) / cpsHistory.length).toFixed(2);
    
    let record = parseInt(localStorage.getItem('clickerPersonalRecord_' + timeTotal) || '0', 10);
    if (score > record) { 
      localStorage.setItem('clickerPersonalRecord_' + timeTotal, score); 
      record = score; 
    }
    if (recEl) recEl.textContent = record;
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
        if (timerElement) timerElement.textContent = formatTime(timeLeft);
        clearInterval(timer);
        timer = null;
        if (clicker) clicker.disabled = true;
        if (resetBtn) resetBtn.style.display = 'block';
        if (statsDiv) statsDiv.style.display = 'block';
        cpsHistory.push(clicksThisSecond);
        clicksThisSecond = 0;
        updateStats();
        return;
      }
      timeLeft = remainingMs / 1000;
      if (timerElement) timerElement.textContent = formatTime(timeLeft);
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
        if (scoreElement) scoreElement.textContent = score;
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
      if (timerElement) timerElement.textContent = formatTime(timeLeft);
      if (scoreElement) scoreElement.textContent = score;
      if (clicker) clicker.disabled = false;
      if (resetBtn) resetBtn.style.display = 'none';
      if (statsDiv) statsDiv.style.display = 'none';
      document.querySelectorAll('.time-btn').forEach(btn => btn.style.opacity = '1');
    });
  }
});
