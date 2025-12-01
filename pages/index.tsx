import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const countries = ['USA', 'Nigeria'];
const periods = ['1940-1959', '1960-1979', '1980-1999', '2000-2019', 'Any Time'];

export default function Home() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

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
    const timer = setTimeout(() => {
      speak('Welcome to World Trivia TV. Choose a country, a time period, and how many questions you want to answer, then press Start.');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    speak(country);
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
    if (selectedCountry && selectedPeriod) {
      speak(`Starting trivia with ${questionCount} questions`);
      const periodParam = selectedPeriod === 'Any Time' ? 'any' : selectedPeriod;
      router.push(`/play?country=${selectedCountry}&period=${periodParam}&count=${questionCount}`);
    }
  };

  const handleRepeatInstructions = () => {
    speak('Welcome to World Trivia TV. Choose a country: USA or Nigeria. Then choose a time period. Select how many questions you want, from 5 to 15. Finally, press the Start Trivia button.');
  };

  const containerClass = `min-h-screen p-8 ${highContrast ? 'bg-black' : 'bg-blue-900'} text-white`;
  const textSize = largeText ? 'text-3xl' : 'text-2xl';
  const headingSize = largeText ? 'text-7xl' : 'text-6xl';
  const subHeadingSize = largeText ? 'text-5xl' : 'text-4xl';
  
  const buttonClass = `px-8 py-6 rounded-xl font-bold transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400 ${highContrast ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-500 hover:bg-blue-400 text-white'}`;
  const selectedButtonClass = `px-8 py-6 rounded-xl font-bold transition-all ring-4 ring-yellow-300 bg-yellow-500 text-black focus:outline-none focus:ring-4 focus:ring-yellow-400`;

  return (
    <>
      <Head>
        <title>World Trivia TV - Home</title>
        <meta name="description" content="World Trivia TV - Choose your country and time period" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={containerClass}>
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12">
            <h1 className={`font-bold mb-6 ${headingSize}`}>🌍 World Trivia TV</h1>
            <p className={`${textSize} mb-4`}>Choose your preferences to begin</p>
          </header>

          <section className="flex flex-wrap gap-4 mb-12 justify-center" aria-label="Display settings">
            <button 
              onClick={() => setHighContrast(!highContrast)} 
              className={buttonClass}
              aria-label={`Toggle high contrast mode. Currently ${highContrast ? 'on' : 'off'}`}
            >
              {highContrast ? '☀️ Normal' : '🌙 High Contrast'}
            </button>
            <button 
              onClick={() => setLargeText(!largeText)} 
              className={buttonClass}
              aria-label={`Toggle large text. Currently ${largeText ? 'large' : 'normal'}`}
            >
              🔍 {largeText ? 'Normal Text' : 'Larger Text'}
            </button>
            <button 
              onClick={handleRepeatInstructions} 
              className={buttonClass}
              aria-label="Repeat instructions"
            >
              🔊 Repeat Instructions
            </button>
          </section>

          <section className="mb-12" aria-labelledby="country-heading">
            <h2 id="country-heading" className={`font-bold mb-6 text-center ${subHeadingSize}`}>
              Choose Country
            </h2>
            <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => handleCountrySelect(country)}
                  className={selectedCountry === country ? selectedButtonClass : buttonClass}
                  aria-pressed={selectedCountry === country}
                  aria-label={`Select ${country}`}
                >
                  <span className={textSize}>{country}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-12" aria-labelledby="period-heading">
            <h2 id="period-heading" className={`font-bold mb-6 text-center ${subHeadingSize}`}>
              Choose Time Period
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodSelect(period)}
                  className={selectedPeriod === period ? selectedButtonClass : buttonClass}
                  aria-pressed={selectedPeriod === period}
                  aria-label={`Select ${period}`}
                >
                  <span className={textSize}>{period}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-12" aria-labelledby="count-heading">
            <h2 id="count-heading" className={`font-bold mb-6 text-center ${subHeadingSize}`}>
              How Many Questions? (5-15)
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-8 mb-6">
                <button
                  onClick={() => handleQuestionCountChange(Math.max(5, questionCount - 1))}
                  className={buttonClass}
                  aria-label="Decrease question count"
                >
                  <span className="text-4xl">−</span>
                </button>
                <div className={`${headingSize} font-bold text-yellow-300 min-w-[200px] text-center`}>
                  {questionCount}
                </div>
                <button
                  onClick={() => handleQuestionCountChange(Math.min(15, questionCount + 1))}
                  className={buttonClass}
                  aria-label="Increase question count"
                >
                  <span className="text-4xl">+</span>
                </button>
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                {[5, 8, 10, 12, 15].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleQuestionCountChange(count)}
                    className={questionCount === count ? selectedButtonClass : buttonClass}
                    aria-pressed={questionCount === count}
                    aria-label={`Select ${count} questions`}
                  >
                    <span className={textSize}>{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="text-center mt-16">
            <button
              onClick={handleStart}
              disabled={!selectedCountry || !selectedPeriod}
              className={`${buttonClass} ${textSize} px-20 py-10 text-4xl ${
                !selectedCountry || !selectedPeriod ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'
              }`}
              aria-label="Start trivia"
              aria-disabled={!selectedCountry || !selectedPeriod}
            >
              ▶️ Start Trivia
            </button>
            {(!selectedCountry || !selectedPeriod) && (
              <p className={`mt-6 ${textSize} text-yellow-300`}>
                Please select both a country and a time period
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}