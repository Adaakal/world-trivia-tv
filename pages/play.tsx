import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface TriviaItem {
  country: string;
  period: string;
  question: string;
  answer: string;
  funFact?: string;
}

export default function Play() {
  const router = useRouter();
  const { country, period, count } = router.query;

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
    if (!country || !period) return;

    const fetchTrivia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trivia?country=${country}&period=${period}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch trivia');
        }

        if (data.items.length === 0) {
          setError('No trivia found for this selection. Please go back and try another combination.');
          speak('No trivia found for this selection. Please go back and try another combination.');
        } else {
          const requestedCount = count ? parseInt(count as string) : 10;
          const limitedItems = data.items.slice(0, requestedCount);
          setTriviaItems(limitedItems);
          speak(`Starting trivia for ${country} with ${limitedItems.length} questions. Get ready for your first question.`);
        }
      } catch (err) {
        setError('Failed to load trivia. Please check your connection and try again.');
        speak('Failed to load trivia. Please go back to the menu and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrivia();
  }, [country, period, count]);

  // Timer effect - runs every second
  useEffect(() => {
    // Don't run timer if paused, loading, error, or ended
    if (loading || error || triviaItems.length === 0 || isPaused || hasEnded) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      return;
    }

    const currentItem = triviaItems[currentIndex];

    // Start countdown interval
    timerIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        console.log('Countdown:', prev); // Debug log
        
        if (prev <= 1) {
          if (!showAnswer) {
            // Time to show the answer
            setShowAnswer(true);
            const answerText = currentItem.funFact 
              ? `The answer is: ${currentItem.answer}. ${currentItem.funFact}`
              : `The answer is: ${currentItem.answer}`;
            speak(answerText);
            return 6; // Reset to 6 seconds for next question countdown
          } else {
            // Time to move to next question
            if (currentIndex < triviaItems.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setShowAnswer(false);
              return 8; // Reset to 8 seconds for question
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

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentIndex, showAnswer, isPaused, loading, error, hasEnded, triviaItems]);

  // Speak question when it changes
  useEffect(() => {
    if (!loading && !error && triviaItems.length > 0 && !isPaused && !hasEnded && !showAnswer) {
      const currentItem = triviaItems[currentIndex];
      speak(currentItem.question);
      setCountdown(8); // Reset countdown when new question loads
    }
  }, [currentIndex, triviaItems, loading, error, isPaused, hasEnded, showAnswer]);

  const handlePausePlay = () => {
    if (isPaused) {
      speak('Resuming trivia');
    } else {
      speak('Paused');
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    router.push('/');
  };

  const containerClass = `min-h-screen p-8 ${highContrast ? 'bg-black' : 'bg-blue-900'} text-white`;
  const textSize = largeText ? 'text-4xl' : 'text-3xl';
  const questionSize = largeText ? 'text-7xl' : 'text-6xl';
  const answerSize = largeText ? 'text-6xl' : 'text-5xl';
  
  const buttonClass = `px-8 py-6 rounded-xl font-bold transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400 ${highContrast ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-500 hover:bg-blue-400 text-white'}`;

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className={`${questionSize} mb-8 animate-pulse`}>🌍</div>
            <p className={textSize}>Loading your trivia...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>World Trivia TV - Error</title>
        </Head>
        <div className={containerClass}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-4xl">
              <div className={`${questionSize} mb-8`}>⚠️</div>
              <p className={`${textSize} mb-12`}>{error}</p>
              <button onClick={handleBackToMenu} className={`${buttonClass} ${textSize}`}>
                ⬅️ Back to Menu
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (hasEnded) {
    return (
      <>
        <Head>
          <title>World Trivia TV - Finished</title>
        </Head>
        <div className={containerClass}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-4xl">
              <div className={`${questionSize} mb-8`}>🎉</div>
              <h1 className={`${questionSize} mb-8 font-bold`}>Trivia Complete!</h1>
              <p className={`${textSize} mb-12`}>
                You've finished all {triviaItems.length} questions for {country}.
              </p>
              <div className="flex gap-6 justify-center flex-wrap">
                <button onClick={handleReplay} className={`${buttonClass} ${textSize}`}>
                  🔄 Replay
                </button>
                <button onClick={handleBackToMenu} className={`${buttonClass} ${textSize}`}>
                  ⬅️ Back to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentItem = triviaItems[currentIndex];

  return (
    <>
      <Head>
        <title>World Trivia TV - Playing</title>
      </Head>

      <div className={containerClass}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <button onClick={handleBackToMenu} className={`${buttonClass} text-2xl`} aria-label="Exit round">
              ⬅️ Exit Round
            </button>
            
            <div className="flex gap-4 flex-wrap">
              <button 
                onClick={() => setHighContrast(!highContrast)} 
                className={`${buttonClass} text-2xl`}
              >
                {highContrast ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={() => setLargeText(!largeText)} 
                className={`${buttonClass} text-2xl`}
              >
                🔍
              </button>
              <button 
                onClick={handlePausePlay} 
                className={`${buttonClass} text-2xl`}
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button 
                onClick={handleRepeat} 
                className={`${buttonClass} text-2xl`}
              >
                🔊 Repeat
              </button>
              <button 
                onClick={handleNextQuestion} 
                className={`${buttonClass} text-2xl bg-green-600 hover:bg-green-500`}
              >
                ⏭️ Next
              </button>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className={`${textSize} text-yellow-300`}>
              Question {currentIndex + 1} of {triviaItems.length}
            </p>
          </div>

          {/* TIMER DISPLAY - Show before answer */}
          {!showAnswer && !isPaused && (
            <div className="text-center mb-8">
              <div className="inline-block bg-yellow-500 text-black px-12 py-6 rounded-full">
                <p className={`${textSize} font-bold`}>
                  ⏱️ Answer in: {countdown} second{countdown !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          <main className="text-center">
            <div className="mb-16">
              <h1 className={`${questionSize} font-bold leading-tight`}>
                {currentItem.question}
              </h1>
            </div>

            {showAnswer && (
              <div 
                className="mt-20 p-12 bg-green-600 rounded-3xl" 
                aria-live="polite"
              >
                <p className={`${answerSize} font-bold mb-4`}>
                  ✅ {currentItem.answer}
                </p>
                {currentItem.funFact && (
                  <p className={`${textSize} mt-8 text-green-100`}>
                    💡 {currentItem.funFact}
                  </p>
                )}
                {countdown > 0 && !isPaused && (
                  <p className={`${textSize} mt-8 text-yellow-300 font-bold`}>
                    ⏭️ Next question in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            )}

            {isPaused && (
              <div className="mt-20 p-8 bg-yellow-500 text-black rounded-2xl">
                <p className={`${textSize} font-bold`}>⏸️ Paused</p>
                <p className={`${textSize} mt-4`}>Press Resume to continue</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}