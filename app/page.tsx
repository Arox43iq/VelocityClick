'use client';

import { useState, useEffect, useRef } from 'react';
import Giscus from '@giscus/react';

export default function Home() {
  // --- Estados del Juego y Configuración ---
  const [timeTotal, setTimeTotal] = useState(20);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Estadísticas
  const [maxCPS, setMaxCPS] = useState(0);
  const [minCPS, setMinCPS] = useState(0);
  const [avgCPS, setAvgCPS] = useState('0');
  const [personalRecord, setPersonalRecord] = useState(0);

  // Tema (Oscuro por defecto / Guardado en localStorage)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Referencias para manejar intervalos y lógica sin perder estados actuales
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const clicksThisSecondRef = useRef<number>(0);
  const cpsHistoryRef = useRef<number[]>([]);
  const lastSecondCheckedRef = useRef<number>(20);

  // Cargar preferencia de tema al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('velocityClickTheme');
    const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  // Cargar récord personal al cambiar el tiempo total
  useEffect(() => {
    const savedRecord = localStorage.getItem(`clickerPersonalRecord_${timeTotal}`);
    setPersonalRecord(savedRecord ? parseInt(savedRecord, 10) : 0);
  }, [timeTotal]);

  // Cambiar Tema con animación View Transition si está disponible
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newDarkState = !isDarkMode;
    const x = e.clientX;
    const y = e.clientY;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    ) + 400;

    const updateDOM = () => {
      setIsDarkMode(newDarkState);
      localStorage.setItem('velocityClickTheme', newDarkState ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-mode', newDarkState);
    };

    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        updateDOM();
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 900,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    } else {
      updateDOM();
    }
  };

  // Seleccionar tiempo de prueba
  const handleSetTime = (seconds: number) => {
    if (gameStarted) return;
    setTimeTotal(seconds);
    setTimeLeft(seconds);
    lastSecondCheckedRef.current = seconds;
  };

  // Manejar cada clic del usuario
  const handleClick = () => {
    if (isGameOver) return;

    // Iniciar temporizador en el primer clic
    if (!gameStarted) {
      setGameStarted(true);
      startTimeRef.current = performance.now();
      const durationMs = timeTotal * 1000;

      timerRef.current = setInterval(() => {
        const elapsed = performance.now() - startTimeRef.current;
        const remainingMs = durationMs - elapsed;

        if (remainingMs <= 0) {
          // Fin del juego
          setTimeLeft(0);
          if (timerRef.current) clearInterval(timerRef.current);
          setIsGameOver(true);

          // Calcular estadísticas finales
          cpsHistoryRef.current.push(clicksThisSecondRef.current);
          const history = cpsHistoryRef.current;

          if (history.length > 0) {
            const max = Math.max(...history);
            const min = Math.min(...history);
            const avg = (history.reduce((a, b) => a + b, 0) / history.length).toFixed(2);
            setMaxCPS(max);
            setMinCPS(min);
            setAvgCPS(avg);
          }

          setScore((currentScore) => {
            const currentRecord = parseInt(localStorage.getItem(`clickerPersonalRecord_${timeTotal}`) || '0', 10);
            if (currentScore > currentRecord) {
              localStorage.setItem(`clickerPersonalRecord_${timeTotal}`, currentScore.toString());
              setPersonalRecord(currentScore);
            }
            return currentScore;
          });

          return;
        }

        const currentT = remainingMs / 1000;
        setTimeLeft(currentT);

        const currentSecondFloor = Math.ceil(currentT);
        if (currentSecondFloor < lastSecondCheckedRef.current) {
          cpsHistoryRef.current.push(clicksThisSecondRef.current);
          clicksThisSecondRef.current = 0;
          lastSecondCheckedRef.current = currentSecondFloor;
        }
      }, 10);
    }

    setScore((prev) => prev + 1);
    clicksThisSecondRef.current += 1;
  };

  // Reiniciar juego
  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScore(0);
    setTimeLeft(timeTotal);
    setGameStarted(false);
    setIsGameOver(false);
    clicksThisSecondRef.current = 0;
    cpsHistoryRef.current = [];
    lastSecondCheckedRef.current = timeTotal;
  };

  return (
    <main className={`min-h-screen p-5 font-sans select-none box-border transition-colors duration-400 ${isDarkMode ? 'dark-mode' : ''}`}>
      <style jsx global>{`
        :root {
          --bg-color: #f0f2f5;
          --container-bg: #ffffff;
          --text-main: #111827;
          --text-sub: #374151;
          --btn-bg: #f3f4f6;
          --btn-border: #cbd5e1;
          --btn-hover: #e5e7eb;
          --btn-text: #d97706;
          --border-color: #e2e8f0;
          --shadow-color: rgba(0, 0, 0, 0.08);
          --stats-bg: #f0fdf4;
          --stats-border: #bbf7d0;
          --stats-color: #166534;
        }

        .dark-mode {
          --bg-color: #0f1115;
          --container-bg: #181b22;
          --text-main: #f0f2f5;
          --text-sub: #9e9ea0;
          --btn-bg: #21252d;
          --btn-border: #2f3542;
          --btn-hover: #292f3b;
          --btn-text: #ffa726;
          --border-color: #262c36;
          --shadow-color: rgba(0, 0, 0, 0.5);
          --stats-bg: #132215;
          --stats-border: #1e4620;
          --stats-color: #81c784;
        }

        html, body {
          background-color: var(--bg-color);
          color: var(--text-main);
          margin: 0;
        }

        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
        ::view-transition-old(root) { z-index: 1; }
        ::view-transition-new(root) { z-index: 9999; }
      `}</style>

      <div className="flex justify-center items-start gap-6 max-w-[1150px] mx-auto my-[30px] max-lg:flex-col max-lg:items-center max-lg:m-[10px]">
        
        {/* Columna del Juego */}
        <div className="flex-1 max-w-[550px] w-full flex flex-col gap-5">
          <div className="bg-[var(--container-bg)] rounded-[28px] p-[35px_25px] shadow-[0_15px_40px_var(--shadow-color)] border border-[var(--border-color)] text-center relative overflow-hidden transition-all duration-400">
            
            <h1 className="text-[2.2rem] m-[0_0_2px] font-extrabold tracking-[-0.5px] bg-gradient-to-r from-[#e67e22] to-[#f39c12] bg-clip-text text-transparent">
              VelocityClick
            </h1>
            <div className="text-[0.75rem] text-[var(--text-sub)] mb-6 uppercase tracking-[2.5px] font-bold">
              The Ultimate CPS Test
            </div>
            
            <div className="flex justify-center items-center gap-3 mb-6">
              <a 
                href="https://github.com/Arox43iq?tab=repositories" 
                target="_blank" 
                rel="noreferrer" 
                className="bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[var(--btn-text)] font-semibold p-[8px_16px] rounded-[14px] cursor-pointer transition-all duration-200 text-[0.85rem] no-underline hover:-translate-y-0.5 hover:bg-[var(--btn-hover)] hover:shadow-md"
              >
                🚀 Proyectos
              </a>
              <button 
                onClick={toggleTheme}
                className="bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[var(--text-main)] font-semibold p-[8px_16px] rounded-[14px] cursor-pointer transition-all duration-200 text-[0.85rem] hover:-translate-y-0.5 hover:bg-[var(--btn-hover)] hover:shadow-md"
              >
                {isDarkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
              </button>
            </div>

            {/* Selector de Tiempos */}
            <div className="flex justify-center gap-2 mb-5">
              {[1, 5, 10, 20].map((sec) => (
                <button
                  key={sec}
                  onClick={() => handleSetTime(sec)}
                  style={{ opacity: gameStarted ? 0.5 : 1 }}
                  className={`p-[6px_16px] rounded-[14px] font-bold text-[0.9rem] cursor-pointer transition-all duration-200 border ${
                    timeTotal === sec
                      ? 'bg-gradient-to-br from-[#e67e22] to-[#d35400] text-white border-transparent shadow-[0_4px_15px_rgba(230,126,34,0.4)]'
                      : 'bg-[var(--btn-bg)] border-[var(--btn-border)] text-[var(--text-main)] hover:bg-[var(--btn-hover)] hover:-translate-y-0.5'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            <div className="text-[0.85rem] mb-5 text-[var(--text-sub)]">
              Elige el tiempo, haz clic en el botón tantas veces como puedas y ¡mide tus CPS!
            </div>
            
            <div className="text-[1.15rem] font-semibold text-[var(--text-sub)] mb-1.5">
              Time left: {timeLeft.toFixed(2).replace('.', ',')} seg
            </div>
            
            <div className="text-[4.2rem] font-black m-[0_0_20px] leading-none tracking-[-2px]">
              {score}
            </div>
            
            <div>
              <button
                id="clicker"
                onClick={handleClick}
                disabled={isGameOver}
                className="w-full max-w-[320px] p-[24px_20px] text-[1.9rem] font-extrabold m-[0_auto_15px_auto] cursor-pointer rounded-[20px] border-none bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white shadow-[0_8px_25px_rgba(46,204,113,0.35)] transition-all duration-100 block active:scale-[0.97] active:translate-y-0.5 hover:from-[#27ae60] hover:to-[#219653] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(46,204,113,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ¡Haz Clic!
              </button>
            </div>

            {isGameOver && (
              <div>
                <button
                  onClick={resetGame}
                  className="p-[10px_24px] text-[0.95rem] font-bold bg-gradient-to-br from-[#e74c3c] to-[#c0392b] text-white border-none rounded-[14px] cursor-pointer mx-auto mt-[15px] shadow-[0_4px_15px_rgba(231,76,60,0.3)] transition-all duration-200 hover:-translate-y-0.5 block"
                >
                  Reiniciar Test
                </button>
              </div>
            )}

            {isGameOver && (
              <div className="mt-6 text-[0.9rem] leading-[1.6] border border-[var(--stats-border)] rounded-[18px] p-4 bg-[var(--stats-bg)] text-[var(--stats-color)] text-left animate-fadeIn">
                <p className="my-1"><strong>📊 Estadísticas de la partida:</strong></p>
                <p className="my-1">• Max CPS: <span>{maxCPS}</span></p>
                <p className="my-1">• Promedio CPS: <span>{avgCPS}</span></p>
                <p className="my-1">• Min CPS: <span>{minCPS}</span></p>
                <p className="my-1">• Récord personal: <span>{personalRecord}</span></p>
              </div>
            )}

          </div>
        </div>

        {/* Columna de Comentarios (Giscus) */}
        <div className="flex-1 max-w-[550px] w-full flex flex-col gap-5">
          <div className="bg-[var(--container-bg)] rounded-[28px] p-7 shadow-[0_15px_40px_var(--shadow-color)] border border-[var(--border-color)] text-left transition-all duration-400">
            <h3 className="mt-0 text-[1.2rem] text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              💬 Comentarios y Récords
            </h3>
            <div className="text-[0.8rem] text-[var(--text-sub)] mb-4">
              ¡Deja tu marca o comparte tu récord con la comunidad! (Inicia sesión con GitHub para comentar)
            </div>
            
            {/* Componente Giscus con tus nuevos identificadores exactos */}
            <div className="w-full">
              <Giscus
                repo="Arox43iq/VelocityClick"
                repoId="R_kgDOPLu7zA"
                category="Announcements"
                categoryId="DIC_kwDOPLu7zM4DFHry"
                mapping="pathname"
                strict="0"
                reactionsEnabled="1"
                emitMetadata="0"
                inputPosition="bottom"
                theme={isDarkMode ? 'github-dark' : 'light'}
                lang="es"
              />
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}