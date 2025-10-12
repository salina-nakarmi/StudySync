import { useState, useEffect } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

const quotes = [
  "Focus on progress, not perfection.",
  "Discipline beats motivation.",
  "You don't have to be extreme, just consistent.",
  "One hour today saves you a headache tomorrow.",
  "Small steps lead to big changes.",
  "Start where you are. Use what you have.",
  "Today's actions shape tomorrow's results.",
  "Consistency is the key to success."
];

export default function MotivationCard() {
  const [quote, setQuote] = useState("");

  const getRandomQuote = () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  };

  useEffect(() => {
    getRandomQuote();
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg relative">
      <button 
        onClick={getRandomQuote}
        className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <ArrowPathIcon className="h-5 w-5" />
      </button>
      <h2 className="text-xl font-semibold text-center italic">
        "{quote}"
      </h2>
    </div>
  );
}