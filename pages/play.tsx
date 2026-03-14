import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

interface TriviaItem {
  countries: string;
  period: string;
  question: string;
  answer: string;
  funFact?: string;
}

export default function Play() {
  const router = useRouter();
  const { countries, period, count } = router.query;

  const [triviaItems, setTriviaItems] = useState<TriviaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [countdown, setCountdown] = useState(8);

  const timerIntervalRef = useRef<NodeJS.Timeout>();

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 0.9;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (!countries || !period) return;
    const fetchTrivia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trivia?countries=${countries}&period=${period}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch trivia');
        if (data.items.length === 0) {
          setError('No trivia found for this selection. Please go back and try another combination.');
          speak('No trivia found for this selection. Please go back and try another combination.');
        } else {
          const requestedCount = count ? parseInt(count as string) : 10;
          const limitedItems = data.items.slice(0, requestedCount);
          setTriviaItems(limitedItems);
          speak(`Starting trivia with ${limitedItems.length} questions. Get ready for your first question.`);
        }
      } catch (err) {
        setError('Failed to load trivia. Please check your connection and try again.');
        speak('Failed to load trivia. Please go back to the menu and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrivia();
  }, [countries, period, count]);

  useEffect(() => {
    if (loading || error || triviaItems.length === 0 || isPaused || hasEnded) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    const currentItem = triviaItems[currentIndex];
    timerIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (!showAnswer) {
            setShowAnswer(true);
            const answerText = currentItem.funFact
              ? `The answer is: ${currentItem.answer}. ${currentItem.funFact}`
              : `The answer is: ${currentItem.answer}`;
            speak(answerText);
            return 6;
          } else {
            if (currentIndex < triviaItems.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setShowAnswer(false);
              return 8;
            } else {
              setHasEnded(true);
              speak('Trivia has finished. You can replay from the beginning or go back to the menu.');
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [currentIndex, showAnswer, isPaused, loading, error, hasEnded, triviaItems]);

  useEffect(() => {
    if (!loading && !error && triviaItems.length > 0 && !isPaused && !hasEnded && !showAnswer) {
      const currentItem = triviaItems[currentIndex];
      speak(currentItem.question);
      setCountdown(8);
    }
  }, [currentIndex, triviaItems, loading, error, isPaused, hasEnded, showAnswer]);

  const handlePausePlay = () => {
    if (isPaused) {
      speak('Resuming trivia');
    } else {
      speak('Paused');
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    }
    setIsPaused(!isPaused);
  };

  const handleRepeat = () => {
    if (triviaItems.length === 0) return;
    const currentItem = triviaItems[currentIndex];
    if (showAnswer) {
      const answerText = currentItem.funFact
        ? `${currentItem.question}. The answer is: ${currentItem.answer}. ${currentItem.funFact}`
        : `${currentItem.question}. The answer is: ${currentItem.answer}`;
      speak(answerText);
    } else {
      speak(currentItem.question);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < triviaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setCountdown(8);
      speak('Moving to next question');
    } else {
      setHasEnded(true);
      speak('That was the last question. Trivia has finished.');
    }
  };

  const handleReplay = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setHasEnded(false);
    setIsPaused(false);
    setCountdown(8);
    speak('Restarting trivia from the beginning');
  };

  const handleBackToMenu = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    router.push('/');
  };

  const containerClass = `min-h-screen p-8 ${highContrast ? 'bg-black' : 'bg-blue-900'} text-white`;
  const textSize = largeText ? 'text-4xl' : 'text-3xl';
  const questionSize = largeText ? 'text-7xl' : 'text-6xl';
  const answerSize = largeText ? 'text-6xl' : 'text-5xl';
  const buttonClass = `px-8 py-6 rounded-xl font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-400 ${
    highContrast ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-500 hover:bg-blue-400 text-white'
  }`;

  // ── Loading State ──
  if (loading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className={`${questionSize} mb-8`}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              🌍
            </motion.div>
            <motion.p
              className={textSize}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading your trivia...
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <>
        <Head><title>World Trivia TV - Error</title></Head>
        <div className={containerClass}>
          <div className="flex items-center justify-center min-h-screen">
            <motion.div
              className="text-center max-w-4xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={`${questionSize} mb-8`}>⚠️</div>
              <p className={`${textSize} mb-12`}>{error}</p>
              <motion.button
                onClick={handleBackToMenu}
                className={`${buttonClass} ${textSize}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ⬅️ Back to Menu
              </motion.button>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // ── End State ──
  if (hasEnded) {
    return (
      <>
        <Head><title>World Trivia TV - Finished</title></Head>
        <div className={containerClass}>
          <div className="flex items-center justify-center min-h-screen">
            <motion.div
              className="text-center max-w-4xl"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            >
              <motion.div
                className={`${questionSize} mb-8`}
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1.2, 1.2, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                🎉
              </motion.div>
              <h1 className={`${questionSize} mb-8 font-bold`}>Trivia Complete!</h1>
              <p className={`${textSize} mb-12`}>
                You&apos;ve finished all {triviaItems.length} questions for {countries}.
              </p>
              <div className="flex gap-6 justify-center flex-wrap">
                <motion.button
                  onClick={handleReplay}
                  className={`${buttonClass} ${textSize}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 Replay
                </motion.button>
                <motion.button
                  onClick={handleBackToMenu}
                  className={`${buttonClass} ${textSize}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⬅️ Back to Menu
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  const currentItem = triviaItems[currentIndex];
  // Countdown ring: 8s for question, 6s for answer
  const maxCount = showAnswer ? 6 : 8;
  const countdownPct = countdown / maxCount;

  return (
    <>
      <Head><title>World Trivia TV - Playing</title></Head>

      <div className={containerClass}>
        <div className="max-w-7xl mx-auto">

          {/* Controls Bar */}
          <motion.div
            className="flex justify-between items-center mb-8 flex-wrap gap-4"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              onClick={handleBackToMenu}
              className={`${buttonClass} text-2xl`}
              aria-label="Exit round"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⬅️ Exit Round
            </motion.button>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: highContrast ? '☀️' : '🌙', action: () => setHighContrast(!highContrast) },
                { label: '🔍', action: () => setLargeText(!largeText) },
                { label: isPaused ? '▶️ Resume' : '⏸️ Pause', action: handlePausePlay },
                { label: '🔊 Repeat', action: handleRepeat },
                { label: '⏭️ Next', action: handleNextQuestion, extra: 'bg-green-600 hover:bg-green-500' },
              ].map((btn) => (
                <motion.button
                  key={btn.label}
                  onClick={btn.action}
                  className={`${buttonClass} text-2xl ${btn.extra || ''}`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {btn.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Progress */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className={`${textSize} text-yellow-300`}>
              Question {currentIndex + 1} of {triviaItems.length}
            </p>
            {/* Progress bar */}
            <div className="mt-3 max-w-xl mx-auto h-2 bg-blue-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-yellow-400 rounded-full"
                animate={{ width: `${((currentIndex + 1) / triviaItems.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Animated Countdown */}
          <AnimatePresence>
            {!showAnswer && !isPaused && (
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="inline-flex flex-col items-center">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                    <motion.circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke={countdown <= 3 ? '#EF4444' : '#EAB308'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - countdownPct)}`}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }}
                      transition={{ duration: 0.9 }}
                    />
                    <text x="40" y="47" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{countdown}</text>
                  </svg>
                  <p className="text-lg text-white/60 mt-1">seconds</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question */}
          <main className="text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${currentIndex}`}
                className="mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <h1 className={`${questionSize} font-bold leading-tight`}>
                  {currentItem.question}
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* Answer Reveal */}
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  className="mt-20 p-12 bg-green-600 rounded-3xl"
                  aria-live="polite"
                  initial={{ opacity: 0, scale: 0.8, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                >
                  <motion.p
                    className={`${answerSize} font-bold mb-4`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    ✅ {currentItem.answer}
                  </motion.p>
                  {currentItem.funFact && (
                    <motion.p
                      className={`${textSize} mt-8 text-green-100`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      💡 {currentItem.funFact}
                    </motion.p>
                  )}
                  {countdown > 0 && !isPaused && (
                    <motion.p
                      className={`${textSize} mt-8 text-yellow-300 font-bold`}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ⏭️ Next question in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Paused State */}
            <AnimatePresence>
              {isPaused && (
                <motion.div
                  className="mt-20 p-8 bg-yellow-500 text-black rounded-2xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <p className={`${textSize} font-bold`}>⏸️ Paused</p>
                  <p className={`${textSize} mt-4`}>Press Resume to continue</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}
