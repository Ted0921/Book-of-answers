import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Enums and Types ---
const GameState = {
  AwaitingInput: 'AwaitingInput',
  Thinking: 'Thinking',
  Answer: 'Answer',
  Error: 'Error',
};

// --- Gemini Service ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `You are 'The Book of Answers'. Your purpose is to provide short, enigmatic, and insightful answers to unspoken questions. Your tone should be wise, mysterious, and encouraging. Never ask for the question. Keep your answers to a single sentence, or at most two short sentences. Your answers should be profound, sometimes metaphorical, and always thought-provoking.`;

const fetchAnswer = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Reveal an answer.",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0,
        topP: 0.95,
        topK: 64,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No answer received from the oracle.");
    }
    return text.trim();
  } catch (error) {
    console.error("Error fetching answer from Gemini:", error);
    throw new Error("The oracle is silent at the moment. Please try again later.");
  }
};


// --- Components ---
const Spinner = () => {
  return React.createElement(
    'div',
    { className: 'flex flex-col items-center justify-center text-yellow-200/80' },
    React.createElement(
      'svg',
      {
        className: 'animate-spin h-12 w-12 text-yellow-500',
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        viewBox: '0 0 24 24',
      },
      React.createElement('circle', {
        className: 'opacity-25',
        cx: '12',
        cy: '12',
        r: '10',
        stroke: 'currentColor',
        strokeWidth: '4',
      }),
      React.createElement('path', {
        className: 'opacity-75',
        fill: 'currentColor',
        d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
      })
    ),
    React.createElement('p', { className: 'mt-4 text-sm italic' }, 'The oracle is contemplating...')
  );
};

const AnswerDisplay = ({ gameState, answer, error }) => {
  return React.createElement(
    'div',
    {
      className:
        'w-full max-w-md h-[450px] sm:h-[400px] mx-auto flex flex-col items-center justify-center text-center p-8 bg-slate-900 rounded-2xl shadow-xl border border-yellow-700/30 relative overflow-hidden bg-cover bg-center animate-fade-in',
      style: {
        backgroundImage: `url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=800&auto=format&fit=crop')`,
      },
    },
    React.createElement('div', { className: 'absolute inset-0 bg-black/70 z-0' }),
    React.createElement(
      'div',
      { className: 'z-10 relative w-full h-full flex items-center justify-center' },
      gameState === GameState.Thinking && React.createElement(Spinner),
      gameState === GameState.Answer &&
        React.createElement(
          'p',
          {
            className: 'font-lora text-xl sm:text-2xl italic text-yellow-100 animate-fade-in',
            style: { textShadow: '0 2px 4px rgba(0,0,0,0.8)' },
          },
          answer
        ),
      gameState === GameState.Error &&
        React.createElement(
          'div',
          { className: 'text-red-100 animate-fade-in bg-red-900/60 border border-red-700 p-4 rounded-lg shadow-md max-w-sm' },
          React.createElement('h3', { className: 'font-bold text-lg sm:text-xl mb-2 text-red-200' }, 'The Oracle is Silent'),
          React.createElement('p', { className: 'text-sm sm:text-base italic' }, error)
        )
    )
  );
};

const NumberInput = ({ onSubmit }) => {
  const [numbers, setNumbers] = useState(['', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null)];

  const handleChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newNumbers = [...numbers];
      newNumbers[index] = value;
      setNumbers(newNumbers);

      if (value && index < 2) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !numbers[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const allNumbersEntered = numbers.every((num) => num !== '');

  return React.createElement(
    'div',
    {
      className:
        'w-full max-w-md mx-auto flex flex-col items-center text-center p-8 bg-slate-800/50 rounded-2xl shadow-xl border border-yellow-700/30 animate-fade-in',
    },
    React.createElement('h1', { className: 'font-cinzel text-3xl sm:text-4xl text-yellow-500 tracking-wider' }, 'Consult the Oracle'),
    React.createElement(
      'p',
      { className: 'mt-4 text-sm text-blue-200/70 italic leading-relaxed' },
      'Clear your mind and enter three numbers that call to you.',
      React.createElement('br'),
      'Concentrate on a question... then seek your answer.'
    ),
    React.createElement(
      'div',
      { className: 'flex justify-center space-x-4 my-8' },
      numbers.map((num, index) =>
        React.createElement('input', {
          key: index,
          ref: inputRefs[index],
          type: 'text',
          pattern: '\\d*',
          maxLength: 1,
          value: num,
          onChange: (e) => handleChange(index, e.target.value),
          onKeyDown: (e) => handleKeyDown(index, e),
          className:
            'w-16 h-20 sm:w-20 sm:h-24 bg-slate-900/50 border-2 border-yellow-800 rounded-lg text-yellow-400 text-4xl sm:text-5xl text-center font-cinzel focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all',
          'aria-label': `Number ${index + 1}`,
          autoFocus: index === 0,
        })
      )
    ),
    React.createElement(
      'button',
      {
        onClick: onSubmit,
        disabled: !allNumbersEntered,
        className:
          'px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 disabled:bg-gray-500 disabled:hover:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100',
      },
      'Seek Your Answer'
    )
  );
};

// --- App Component ---
const App = () => {
  const [gameState, setGameState] = useState(GameState.AwaitingInput);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(null);

  const seekAnswer = useCallback(async () => {
    if (gameState === GameState.Thinking) return;

    setGameState(GameState.Thinking);
    setError(null);

    try {
      const newAnswer = await fetchAnswer();
      setAnswer(newAnswer);
      setGameState(GameState.Answer);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      setGameState(GameState.Error);
    }
  }, [gameState]);

  const handleReset = useCallback(() => {
    setGameState(GameState.AwaitingInput);
    setAnswer('');
    setError(null);
  }, []);

  return React.createElement(
    'main',
    { className: 'min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-4 overflow-hidden' },
    React.createElement(
      'div',
      { className: 'w-full max-w-md mx-auto flex flex-col items-center' },
      gameState === GameState.AwaitingInput
        ? React.createElement(NumberInput, { onSubmit: seekAnswer })
        : React.createElement(
            React.Fragment,
            null,
            React.createElement(AnswerDisplay, {
              gameState: gameState,
              answer: answer,
              error: error,
            }),
            (gameState === GameState.Answer || gameState === GameState.Error) &&
              React.createElement(
                'button',
                {
                  onClick: handleReset,
                  className:
                    'mt-6 px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75',
                },
                'Ask Another Question'
              )
          )
    ),
    React.createElement(
        'footer',
        { className: 'absolute bottom-4 text-center text-xs text-gray-500' },
        React.createElement('p', null, 'Powered by Gemini. For entertainment purposes only.')
    )
  );
};


// --- Mount the App ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(React.StrictMode, null, React.createElement(App)));
