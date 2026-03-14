import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";

const countries = [
  "USA", "Nigeria", "Mexico", "Brazil", "Japan", "India",
  "United Kingdom", "France", "Germany", "Italy",
  "China", "South Korea", "Kenya", "Egypt", "Australia",
];

const periods = ["1940-1959", "1960-1979", "1980-1999", "2000-2019", "Any Time"];

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

const headerVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Home() {
  const router = useRouter();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState("");

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 0.9;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCountrySelect = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== country));
    } else if (selectedCountries.length < 2) {
      setSelectedCountries([...selectedCountries, country]);
      speak(country);
    } else {
      speak("You can only select 2 countries. Please deselect one first.");
    }
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    speak(period);
  };

  const handleQuestionCountChange = (count: number) => {
    setQuestionCount(count);
    speak(`${count} questions`);
  };

  const handleStart = () => {
    if (selectedCountries.length === 2 && selectedPeriod) {
      speak(`Starting trivia with ${questionCount} questions from ${selectedCountries[0]} and ${selectedCountries[1]}`);
      const periodParam = selectedPeriod === "Any Time" ? "any" : selectedPeriod;
      router.push(`/play?countries=${selectedCountries.join(",")}&period=${periodParam}&count=${questionCount}`);
    }
  };

  const handleRepeatInstructions = () => {
    speak("Welcome to World Trivia TV. Choose 2 countries from the list. Then choose a time period. Select how many questions you want, from 5 to 15. Finally, press the Start Trivia button.");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Welcome to World Trivia TV. Choose 2 countries, a time period, and how many questions you want to answer, then press Start.");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVoiceActive) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      speak("Voice commands are not supported on this device");
      alert("Voice commands are not supported on this browser. Try Chrome or Edge.");
      setIsVoiceActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      speak("Voice commands active. Say start to begin.");
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase();
      const isFinal = event.results[current].isFinal;
      setVoiceCommand(transcript);

      if (isFinal) {
        if (transcript.includes("start") || transcript.includes("begin") || transcript.includes("go")) {
          if (selectedCountries.length === 2 && selectedPeriod) {
            speak("Starting trivia now");
            setTimeout(() => handleStart(), 500);
          } else {
            speak("Please select 2 countries and a time period first");
          }
        } else if (transcript.includes("stop") || transcript.includes("cancel")) {
          speak("Voice commands off");
          setIsVoiceActive(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
        setIsVoiceActive(false);
      }
    };

    recognition.onend = () => {
      if (isVoiceActive) {
        try { recognition.start(); } catch (e) {}
      }
    };

    try {
      recognition.start();
    } catch (error) {
      speak("Could not start voice commands");
      setIsVoiceActive(false);
    }

    return () => { recognition.stop(); };
  }, [isVoiceActive, selectedCountries, selectedPeriod]);

  const containerClass = `min-h-screen p-8 ${highContrast ? "bg-black" : "bg-blue-900"} text-white`;
  const textSize = largeText ? "text-3xl" : "text-2xl";
  const headingSize = largeText ? "text-7xl" : "text-6xl";
  const subHeadingSize = largeText ? "text-5xl" : "text-4xl";
  const buttonClass = `px-8 py-6 rounded-xl font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-400 ${
    highContrast ? "bg-white text-black hover:bg-gray-200" : "bg-blue-500 hover:bg-blue-400 text-white"
  }`;
  const selectedButtonClass = `px-8 py-6 rounded-xl font-bold ring-4 ring-yellow-300 bg-yellow-500 text-black focus:outline-none focus:ring-4 focus:ring-yellow-400`;

  const canStart = selectedCountries.length === 2 && !!selectedPeriod;

  return (
    <>
      <Head>
        <title>World Trivia TV - Home</title>
        <meta name="description" content="World Trivia TV - Choose your countries and time period" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={containerClass}>
        <motion.div
          className="max-w-7xl mx-auto"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.header className="text-center mb-12" variants={headerVariants}>
            <motion.h1
              className={`font-bold mb-6 ${headingSize}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            >
              🌍 World Trivia TV
            </motion.h1>
            <motion.p
              className={`${textSize} mb-4`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Choose your preferences to begin
            </motion.p>
          </motion.header>

          {/* Accessibility Controls */}
          <motion.section
            className="flex flex-wrap gap-4 mb-12 justify-center"
            aria-label="Display settings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {[
              { label: highContrast ? "☀️ Normal" : "🌙 High Contrast", action: () => setHighContrast(!highContrast), ariaLabel: `Toggle high contrast mode. Currently ${highContrast ? "on" : "off"}` },
              { label: `🔍 ${largeText ? "Normal Text" : "Larger Text"}`, action: () => setLargeText(!largeText), ariaLabel: `Toggle large text. Currently ${largeText ? "large" : "normal"}` },
              { label: "🔊 Repeat Instructions", action: handleRepeatInstructions, ariaLabel: "Repeat instructions" },
              { label: `🎤 ${isVoiceActive ? "Voice ON" : "Voice OFF"}`, action: () => setIsVoiceActive(!isVoiceActive), ariaLabel: "Toggle voice commands", active: isVoiceActive },
            ].map((btn) => (
              <motion.button
                key={btn.label}
                onClick={btn.action}
                className={`${buttonClass} ${btn.active ? "bg-red-600 hover:bg-red-500" : ""}`}
                aria-label={btn.ariaLabel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {btn.label}
              </motion.button>
            ))}
          </motion.section>

          {/* Voice Status Bar */}
          <AnimatePresence>
            {isVoiceActive && (
              <motion.div
                className="text-center mb-8 p-6 bg-green-600 rounded-lg"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className={`${textSize} font-bold mb-2`}>
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    🎤
                  </motion.span>
                  {" "}Listening...{" "}
                  {voiceCommand ? `Heard: "${voiceCommand}"` : 'Say "Start" to begin'}
                </p>
                <p className="text-xl">{'Commands: "Start", "Begin", "Go"'}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {voiceCommand && !isVoiceActive && (
              <motion.div
                className="text-center mb-8 p-4 bg-blue-700 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className={textSize}>Last command: &quot;{voiceCommand}&quot;</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Country Selection */}
          <section className="mb-12" aria-labelledby="country-heading">
            <motion.h2
              id="country-heading"
              className={`font-bold mb-6 text-center ${subHeadingSize}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              Choose 2 Countries ({selectedCountries.length}/2)
            </motion.h2>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {countries.map((country) => {
                const isSelected = selectedCountries.includes(country);
                const isDisabled = !isSelected && selectedCountries.length >= 2;
                return (
                  <motion.button
                    key={country}
                    onClick={() => handleCountrySelect(country)}
                    disabled={isDisabled}
                    className={`${isSelected ? selectedButtonClass : buttonClass} ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Select ${country}`}
                    variants={itemVariants}
                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isDisabled ? { scale: 0.93 } : {}}
                    animate={isSelected ? { scale: [1, 1.12, 1], transition: { duration: 0.3 } } : {}}
                  >
                    <span className={textSize}>{country}</span>
                  </motion.button>
                );
              })}
            </motion.div>
            <AnimatePresence>
              {selectedCountries.length > 0 && (
                <motion.div
                  className="text-center mt-6"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <p className={`${textSize} text-yellow-300`}>
                    Selected: {selectedCountries.join(" and ")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Period Selection */}
          <section className="mb-12" aria-labelledby="period-heading">
            <motion.h2
              id="period-heading"
              className={`font-bold mb-6 text-center ${subHeadingSize}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              Choose Time Period
            </motion.h2>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {periods.map((period) => (
                <motion.button
                  key={period}
                  onClick={() => handlePeriodSelect(period)}
                  className={selectedPeriod === period ? selectedButtonClass : buttonClass}
                  aria-pressed={selectedPeriod === period}
                  aria-label={`Select ${period}`}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <span className={textSize}>{period}</span>
                </motion.button>
              ))}
            </motion.div>
          </section>

          {/* Question Count */}
          <section className="mb-12" aria-labelledby="count-heading">
            <motion.h2
              id="count-heading"
              className={`font-bold mb-6 text-center ${subHeadingSize}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              How Many Questions? (5–15)
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-8 mb-6">
                <motion.button
                  onClick={() => handleQuestionCountChange(Math.max(5, questionCount - 1))}
                  className={buttonClass}
                  aria-label="Decrease question count"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-4xl">−</span>
                </motion.button>
                <motion.div
                  key={questionCount}
                  className={`${headingSize} font-bold text-yellow-300 min-w-[200px] text-center`}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  {questionCount}
                </motion.div>
                <motion.button
                  onClick={() => handleQuestionCountChange(Math.min(15, questionCount + 1))}
                  className={buttonClass}
                  aria-label="Increase question count"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-4xl">+</span>
                </motion.button>
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                {[5, 8, 10, 12, 15].map((count) => (
                  <motion.button
                    key={count}
                    onClick={() => handleQuestionCountChange(count)}
                    className={questionCount === count ? selectedButtonClass : buttonClass}
                    aria-pressed={questionCount === count}
                    aria-label={`Select ${count} questions`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <span className={textSize}>{count}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>

          {/* Start Button */}
          <div className="text-center mt-16">
            <motion.button
              onClick={handleStart}
              disabled={!canStart}
              className={`${buttonClass} ${textSize} px-20 py-10 text-4xl ${!canStart ? "opacity-40 cursor-not-allowed" : ""}`}
              aria-label="Start trivia"
              aria-disabled={!canStart}
              whileHover={canStart ? { scale: 1.08 } : {}}
              whileTap={canStart ? { scale: 0.95 } : {}}
              animate={canStart ? { boxShadow: ["0 0 0 0 rgba(234,179,8,0)", "0 0 0 16px rgba(234,179,8,0.3)", "0 0 0 0 rgba(234,179,8,0)"] } : {}}
              transition={canStart ? { duration: 2, repeat: Infinity } : {}}
            >
              ▶️ Start Trivia
            </motion.button>
            <AnimatePresence>
              {!canStart && (
                <motion.p
                  className={`mt-6 ${textSize} text-yellow-300`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Please select 2 countries and a time period
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
